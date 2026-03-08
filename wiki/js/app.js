(function () {
  "use strict";

  let manifest = null;
  let allDocs = [];
  let allTags = [];
  let activeTag = null;
  const docCache = {};

  // ── Markdown ──

  function initMarked() {
    if (typeof marked === "undefined") return;
    marked.setOptions({
      gfm: true,
      breaks: true,
      highlight: function (code, lang) {
        if (typeof hljs !== "undefined" && lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return code;
      },
    });
  }

  function stripFrontmatter(md) {
    return md.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "");
  }

  function resolveWikilink(name) {
    const normalize = (s) => s.toLowerCase().replace(/[-_\s]+/g, " ").trim();
    const target = normalize(name);
    return allDocs.find((d) => {
      const filename = d.path.split("/").pop().replace(/\.md$/, "");
      return normalize(filename) === target;
    });
  }

  const ATTACHMENTS_DIR = "docs/attachments/";

  function renderObsidianSyntax(md) {
    md = md.replace(/!\[\[([^\]|]+?)(\|([^\]]*))?\]\]/g, (_, file, __, alt) => {
      const raw = file.includes("/") ? file : ATTACHMENTS_DIR + file;
      return `![${alt || file}](${encodeURI(raw)})`;
    });
    md = md.replace(/(?<!!)\[\[([^\]|]+?)(\|([^\]]*))?\]\]/g, (_, target, __, display) => {
      const doc = resolveWikilink(target);
      const label = display || (doc && doc.title) || target;
      if (doc) return `[@${label}](#${encodeURI(doc.path)})`;
      return `[@${label}](#)`;
    });
    return md;
  }

  function renderMarkdown(md) {
    if (typeof marked === "undefined") return `<pre>${md}</pre>`;
    md = stripFrontmatter(md);
    md = renderObsidianSyntax(md);
    const { text, blocks, inlines } = extractMath(md);
    let html = marked.parse(text);
    html = restoreMath(html, blocks, inlines);
    html = renderInlineTags(html);
    return html;
  }

  function extractMath(md) {
    const blocks = [];
    const inlines = [];
    md = md.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
      blocks.push(tex.trim());
      return `\n\nMATHBLOCK${blocks.length - 1}END\n\n`;
    });
    md = md.replace(/(?<!\$)\$(?!\$)([^\$\n]+?)\$(?!\$)/g, (_, tex) => {
      inlines.push(tex.trim());
      return `MATHINLINE${inlines.length - 1}END`;
    });
    return { text: md, blocks, inlines };
  }

  function restoreMath(html, blocks, inlines) {
    if (typeof katex === "undefined") return html;
    html = html.replace(/MATHBLOCK(\d+)END/g, (_, i) => {
      try { return katex.renderToString(blocks[+i], { displayMode: true, throwOnError: false }); }
      catch { return `<pre>${blocks[+i]}</pre>`; }
    });
    html = html.replace(/MATHINLINE(\d+)END/g, (_, i) => {
      try { return katex.renderToString(inlines[+i], { displayMode: false, throwOnError: false }); }
      catch { return `<code>${inlines[+i]}</code>`; }
    });
    return html;
  }

  function renderInlineTags(html) {
    return html.replace(
      /(?:^|(?<=\s))#([\w\u4e00-\u9fff/-]+(?:\/[\w\u4e00-\u9fff-]+)*)/g,
      '<span class="inline-tag" data-tag="$1">#$1</span>'
    );
  }

  function resolveAssetPaths(container, base) {
    if (!base) return;
    container.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");
      if (src && !src.startsWith("http") && !src.startsWith("/") && !src.startsWith("data:") && !src.startsWith("docs/")) {
        img.src = base + src;
      }
    });
    container.querySelectorAll("a").forEach((a) => {
      const href = a.getAttribute("href");
      if (href && !href.startsWith("http") && !href.startsWith("/") && !href.startsWith("#") && !href.startsWith("mailto:") && !href.startsWith("docs/")) {
        a.href = base + href;
      }
    });
  }

  function addHeadingAnchors(container) {
    container.querySelectorAll("h1, h2, h3, h4").forEach((h) => {
      const id = h.textContent.trim().toLowerCase()
        .replace(/[^\w\u4e00-\u9fff]+/g, "-")
        .replace(/^-|-$/g, "") || "heading";
      h.id = id;
      h.classList.add("heading-anchor");
    });
  }

  function getBasePath(filePath) {
    const idx = filePath.lastIndexOf("/");
    return idx >= 0 ? filePath.substring(0, idx + 1) : "";
  }

  function docPathToUrl(docPath) {
    return "/wiki/" + encodeURI(docPath.replace(/\.md$/, ""));
  }

  function getDocPathFromUrl() {
    const pathname = decodeURIComponent(window.location.pathname);
    const prefix = "/wiki/";
    if (!pathname.startsWith(prefix)) return null;
    const rest = pathname.slice(prefix.length).replace(/\/+$/, "");
    if (!rest) return null;
    return rest + ".md";
  }

  // ── Data ──

  function flattenDocs(tree) {
    const docs = [];
    const seen = new Set();
    (function walk(nodes, crumbs) {
      for (const node of nodes) {
        if (node.type === "folder") {
          walk(node.children || [], [...crumbs, node.title]);
        } else if (!seen.has(node.path)) {
          seen.add(node.path);
          docs.push({
            title: node.title,
            path: node.path,
            tags: node.tags || [],
            breadcrumb: [...crumbs, node.title],
          });
        }
      }
    })(tree, []);
    return docs;
  }

  function collectTags(docs) {
    const s = new Set();
    for (const d of docs) for (const t of d.tags) if (t !== "index") s.add(t);
    return Array.from(s).sort();
  }

  function tagMatches(docTags, filter) {
    return docTags.some((t) => t === filter || t.startsWith(filter + "/"));
  }

  // ── Sidebar: Tag Cloud ──

  function buildTagHierarchy(tags) {
    const tree = {};
    for (const t of tags) {
      let node = tree;
      for (const part of t.split("/")) node = node[part] || (node[part] = {});
    }
    return tree;
  }

  function renderTagCloud() {
    const container = document.getElementById("tag-cloud");
    const hierarchy = buildTagHierarchy(allTags);
    let html = "";

    (function render(node, prefix) {
      for (const key of Object.keys(node).sort()) {
        const full = prefix ? prefix + "/" + key : key;
        const hasChildren = Object.keys(node[key]).length > 0;
        const cls = "tag-pill" + (hasChildren ? " tag-parent" : "") + (activeTag === full ? " active" : "");
        html += `<span class="${cls}" data-tag="${full}" title="${full}">#${key}</span>`;
        if (hasChildren) {
          html += '<span class="tag-children">';
          render(node[key], full);
          html += "</span>";
        }
      }
    })(hierarchy, "");

    container.innerHTML = html;
    container.querySelectorAll(".tag-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        const tag = pill.dataset.tag;
        activeTag = activeTag === tag ? null : tag;
        renderTagCloud();
        applyFilter();
      });
    });
  }

  // ── Sidebar: File Tree (depth-aware indentation) ──

  function renderFileTree() {
    const el = document.getElementById("file-tree");
    el.innerHTML = buildTreeHTML(manifest.tree, 0);
    bindTreeEvents(el);
  }

  function buildTreeHTML(tree, depth) {
    let html = "";
    const folderPad = 16 + depth * 14;
    const itemPad = 16 + depth * 14 + 14;

    for (const node of tree) {
      if (node.type === "folder") {
        html += `<div class="tree-folder">` +
          `<div class="tree-folder-label" style="padding-left:${folderPad}px">` +
          `<span class="arrow">▼</span> ${node.title}</div>` +
          `<div class="tree-children">${buildTreeHTML(node.children || [], depth + 1)}</div>` +
          `</div>`;
      } else {
        const tags = (node.tags || []).join(",");
        html += `<div class="tree-item" data-path="${node.path}" data-tags="${tags}" style="padding-left:${itemPad}px">` +
          `<span class="tree-item-icon">📄</span> ${node.title}</div>`;
      }
    }
    return html;
  }

  function bindTreeEvents(container) {
    container.querySelectorAll(".tree-folder-label").forEach((label) => {
      label.addEventListener("click", () => {
        label.classList.toggle("collapsed");
        label.nextElementSibling.classList.toggle("collapsed");
      });
    });
    container.querySelectorAll(".tree-item").forEach((item) => {
      item.addEventListener("click", () => loadDocument(item.dataset.path));
    });
  }

  // ── Filter ──

  function applyFilter() {
    const query = document.getElementById("tag-search").value.trim().toLowerCase();
    const tagFromSearch = query.startsWith("#") ? query.slice(1) : null;
    const filterTag = activeTag || tagFromSearch;
    const textQuery = tagFromSearch ? null : query;

    document.querySelectorAll(".tree-item").forEach((item) => {
      const tags = (item.dataset.tags || "").split(",").filter(Boolean);
      const title = item.textContent.toLowerCase();
      let visible = true;
      if (filterTag && !tagMatches(tags, filterTag)) visible = false;
      if (textQuery && !title.includes(textQuery)) visible = false;
      item.classList.toggle("hidden", !visible);
    });

    document.querySelectorAll(".tree-folder").forEach((folder) => {
      folder.classList.toggle("hidden", !folder.querySelector(".tree-item:not(.hidden)"));
    });
  }

  // ── Activity Heatmap (GitHub-style, for welcome page) ──

  function renderActivityHeatmap(container) {
    const activity = manifest.activity;
    if (!activity || Object.keys(activity).length === 0) return;

    const today = new Date();
    const weeks = 26;
    const totalDays = weeks * 7;

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDays + 1);
    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDay);

    const counts = [];
    const dates = [];
    const d = new Date(startDate);
    while (d <= today) {
      const key = d.toISOString().slice(0, 10);
      counts.push(activity[key] || 0);
      dates.push(key);
      d.setDate(d.getDate() + 1);
    }

    const maxCount = Math.max(...counts, 1);

    function level(c) {
      if (c === 0) return 0;
      const ratio = c / maxCount;
      if (ratio <= 0.25) return 1;
      if (ratio <= 0.5) return 2;
      if (ratio <= 0.75) return 3;
      return 4;
    }

    const totalCols = Math.ceil(counts.length / 7);
    const monthLabels = [];
    let lastMonth = -1;
    for (let col = 0; col < totalCols; col++) {
      const idx = col * 7;
      if (idx < dates.length) {
        const m = new Date(dates[idx]).getMonth();
        if (m !== lastMonth) {
          monthLabels.push({ col, label: new Date(dates[idx]).toLocaleString("zh-CN", { month: "short" }) });
          lastMonth = m;
        }
      }
    }

    let html = '<div class="heatmap-wrap"><h2>更新记录</h2>';
    html += '<div class="heatmap-months">';
    let prev = 0;
    for (const ml of monthLabels) {
      const gap = ml.col - prev;
      if (gap > 0) html += `<span style="grid-column:span ${gap}"></span>`;
      html += `<span>${ml.label}</span>`;
      prev = ml.col + 1;
    }
    html += '</div>';

    html += '<div class="heatmap-grid">';
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < totalCols; col++) {
        const idx = col * 7 + row;
        if (idx < counts.length) {
          const lv = level(counts[idx]);
          const dt = dates[idx];
          const c = counts[idx];
          const tip = `${dt}: ${c} 次更新`;
          html += `<span class="heatmap-cell lv${lv}" title="${tip}"></span>`;
        } else {
          html += '<span class="heatmap-cell empty"></span>';
        }
      }
    }
    html += '</div>';

    html += '<div class="heatmap-legend"><span>少</span>';
    for (let i = 0; i <= 4; i++) html += `<span class="heatmap-cell lv${i}"></span>`;
    html += '<span>多</span></div></div>';

    const wrap = document.createElement("div");
    wrap.innerHTML = html;
    container.appendChild(wrap);
  }

  // ── Document Loading ──

  async function loadDocument(path, pushState = true) {
    const doc = allDocs.find((d) => d.path === path);
    if (doc) renderBreadcrumb(doc.breadcrumb);

    setActiveTreeItem(path);

    if (pushState) {
      history.pushState({ docPath: path }, "", docPathToUrl(path));
    }

    const content = document.getElementById("wiki-content");

    try {
      let md;
      if (docCache[path]) {
        md = docCache[path];
      } else {
        const res = await fetch(encodeURI(path));
        if (!res.ok) throw new Error("Not found");
        md = await res.text();
        docCache[path] = md;
      }

      content.innerHTML = renderMarkdown(md);

      if (path.endsWith("welcome.md")) {
        renderActivityHeatmap(content);
      }

      resolveAssetPaths(content, getBasePath(path));
      addHeadingAnchors(content);

      content.querySelectorAll(".inline-tag").forEach((tag) => {
        tag.addEventListener("click", () => {
          activeTag = tag.dataset.tag;
          renderTagCloud();
          applyFilter();
        });
      });

      content.querySelectorAll('a[href^="#docs/"]').forEach((a) => {
        a.addEventListener("click", (e) => {
          e.preventDefault();
          loadDocument(decodeURI(a.getAttribute("href").slice(1)));
        });
      });

      content.scrollTop = 0;
    } catch {
      content.innerHTML = '<div class="wiki-welcome"><p>文档加载失败，请检查路径。</p></div>';
    }

    closeSidebarMobile();
  }

  function setActiveTreeItem(path) {
    document.querySelectorAll(".tree-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.path === path);
    });
  }

  function renderBreadcrumb(parts) {
    document.getElementById("breadcrumb").innerHTML = parts
      .map((p, i) => i === parts.length - 1 ? `<span>${p}</span>` : p)
      .join(" / ");
  }

  // ── Mobile Sidebar ──

  function closeSidebarMobile() {
    document.getElementById("sidebar").classList.remove("open");
  }

  // ── Init ──

  async function init() {
    initMarked();

    const openBtn = document.getElementById("sidebar-open");
    const closeBtn = document.getElementById("sidebar-close");
    const sidebar = document.getElementById("sidebar");
    if (openBtn) openBtn.addEventListener("click", () => sidebar.classList.add("open"));
    if (closeBtn) closeBtn.addEventListener("click", () => sidebar.classList.remove("open"));

    try {
      manifest = await (await fetch("manifest.json")).json();
    } catch {
      document.getElementById("wiki-content").innerHTML = '<div class="wiki-welcome"><p>知识库加载失败。</p></div>';
      return;
    }

    allDocs = flattenDocs(manifest.tree);
    allTags = collectTags(allDocs);

    renderTagCloud();
    renderFileTree();

    document.getElementById("tag-search").addEventListener("input", applyFilter);

    window.addEventListener("popstate", (e) => {
      const state = e.state;
      if (state && state.docPath) {
        loadDocument(state.docPath, false);
      } else {
        const docPath = getDocPathFromUrl();
        if (docPath) {
          const doc = allDocs.find((d) => d.path === docPath);
          if (doc) { loadDocument(doc.path, false); return; }
        }
        const w = allDocs.find((d) => d.path.endsWith("welcome.md"));
        if (w) loadDocument(w.path, false);
      }
    });

    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (hash) {
      const doc = allDocs.find((d) => d.path === hash || d.path.endsWith(hash));
      if (doc) {
        history.replaceState({ docPath: doc.path }, "", docPathToUrl(doc.path));
        return loadDocument(doc.path, false);
      }
    }

    const docPath = getDocPathFromUrl();
    if (docPath) {
      const doc = allDocs.find((d) => d.path === docPath);
      if (doc) return loadDocument(doc.path, false);
    }

    const welcome = allDocs.find((d) => d.path.endsWith("welcome.md"));
    if (welcome) loadDocument(welcome.path, false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

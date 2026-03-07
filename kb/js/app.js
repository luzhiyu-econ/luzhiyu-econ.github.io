(function () {
  "use strict";

  let manifest = null;
  let allDocs = [];
  let allTags = [];
  let activeTag = null;
  let activeDocPath = null;
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
      const src = encodeURI(raw);
      return `![${alt || file}](${src})`;
    });

    md = md.replace(/(?<!!)\[\[([^\]|]+?)(\|([^\]]*))?\]\]/g, (_, target, __, display) => {
      const doc = resolveWikilink(target);
      if (doc) {
        return `[${display || doc.title || target}](#${encodeURI(doc.path)})`;
      }
      return `[${display || target}](#)`;
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
      try {
        return katex.renderToString(blocks[+i], { displayMode: true, throwOnError: false });
      } catch { return `<pre>${blocks[+i]}</pre>`; }
    });

    html = html.replace(/MATHINLINE(\d+)END/g, (_, i) => {
      try {
        return katex.renderToString(inlines[+i], { displayMode: false, throwOnError: false });
      } catch { return `<code>${inlines[+i]}</code>`; }
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
    const lastSlash = filePath.lastIndexOf("/");
    return lastSlash >= 0 ? filePath.substring(0, lastSlash + 1) : "";
  }

  // ── Data ──

  function flattenDocs(tree, breadcrumb) {
    const docs = [];
    const seen = new Set();
    function walk(nodes, crumbs) {
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
    }
    walk(tree, breadcrumb);
    return docs;
  }

  function collectTags(docs) {
    const tagSet = new Set();
    for (const doc of docs) {
      for (const t of doc.tags) {
        if (t === "index") continue;
        tagSet.add(t);
      }
    }
    return Array.from(tagSet).sort();
  }

  function buildTagHierarchy(tags) {
    const tree = {};
    for (const t of tags) {
      const parts = t.split("/");
      let node = tree;
      for (const part of parts) {
        if (!node[part]) node[part] = {};
        node = node[part];
      }
    }
    return tree;
  }

  function tagMatches(docTags, filterTag) {
    return docTags.some((t) => t === filterTag || t.startsWith(filterTag + "/"));
  }

  // ── Sidebar: Tag Cloud ──

  function renderTagCloud() {
    const container = document.getElementById("tag-cloud");
    const hierarchy = buildTagHierarchy(allTags);

    let html = "";
    function renderLevel(node, prefix) {
      const keys = Object.keys(node).sort();
      for (const key of keys) {
        const fullTag = prefix ? prefix + "/" + key : key;
        const isActive = activeTag === fullTag;
        const isParent = Object.keys(node[key]).length > 0;
        const cls = "tag-pill" + (isParent ? " tag-parent" : "") + (isActive ? " active" : "");
        const display = prefix ? key : key;
        html += `<span class="${cls}" data-tag="${fullTag}" title="${fullTag}">#${display}</span>`;
        if (isParent) {
          html += '<span class="tag-children">';
          renderLevel(node[key], fullTag);
          html += "</span>";
        }
      }
    }
    renderLevel(hierarchy, "");

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

  // ── Sidebar: File Tree ──

  function renderFileTree() {
    const container = document.getElementById("file-tree");
    container.innerHTML = buildTreeHTML(manifest.tree);
    bindTreeEvents(container);
  }

  function buildTreeHTML(tree) {
    let html = "";
    for (const node of tree) {
      if (node.type === "folder") {
        html += `<div class="tree-folder">
          <div class="tree-folder-label"><span class="arrow">▼</span> ${node.title}</div>
          <div class="tree-children">${buildTreeHTML(node.children || [])}</div>
        </div>`;
      } else {
        const tags = (node.tags || []).join(",");
        html += `<div class="tree-item" data-path="${node.path}" data-tags="${tags}">
          <span class="tree-item-icon">📄</span> ${node.title}
        </div>`;
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
      item.addEventListener("click", () => {
        loadDocument(item.dataset.path);
      });
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
      const hasVisible = folder.querySelector(".tree-item:not(.hidden)");
      folder.classList.toggle("hidden", !hasVisible);
    });
  }

  // ── Tag Navigation (auto-generated for welcome page) ──

  function buildTagNavHTML() {
    const topGroups = {};
    const seen = new Set();
    for (const doc of allDocs) {
      for (const tag of doc.tags) {
        if (tag === "index") continue;
        const parts = tag.split("/");
        const top = parts[0];
        const sub = parts.length > 1 ? parts.slice(1).join("/") : null;

        if (!topGroups[top]) topGroups[top] = {};
        const key = sub || "__root__";
        if (!topGroups[top][key]) topGroups[top][key] = [];

        const uid = tag + "::" + doc.path;
        if (!seen.has(uid)) {
          seen.add(uid);
          topGroups[top][key].push(doc);
        }
      }
    }

    const sortedTops = Object.keys(topGroups).sort();
    if (sortedTops.length === 0) return "";

    let html = '<div class="tag-nav"><h2 id="导航">导航</h2>';
    for (const top of sortedTops) {
      html += '<div class="tag-nav-group">';
      html += `<h3><span class="tag-nav-pill" data-tag="${top}">#${top}</span></h3>`;

      const subs = topGroups[top];
      const subKeys = Object.keys(subs).sort();
      for (const sub of subKeys) {
        if (sub !== "__root__") {
          html += `<h4><span class="tag-nav-pill tag-nav-sub" data-tag="${top}/${sub}">#${sub}</span></h4>`;
        }
        html += "<ul>";
        for (const doc of subs[sub]) {
          html += `<li><a href="#${encodeURI(doc.path)}" class="tag-nav-link" data-path="${doc.path}">${doc.title}</a></li>`;
        }
        html += "</ul>";
      }

      html += "</div>";
    }
    html += "</div>";
    return html;
  }

  function bindTagNavEvents(container) {
    container.querySelectorAll(".tag-nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        loadDocument(link.dataset.path);
      });
    });

    container.querySelectorAll(".tag-nav-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        activeTag = pill.dataset.tag;
        renderTagCloud();
        applyFilter();
      });
    });
  }

  // ── Document Loading ──

  async function loadDocument(path) {
    activeDocPath = path;
    setActiveTreeItem(path);

    const doc = allDocs.find((d) => d.path === path);
    if (doc) renderBreadcrumb(doc.breadcrumb);

    const content = document.getElementById("kb-content");

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
        content.innerHTML += buildTagNavHTML();
        bindTagNavEvents(content);
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
          const docPath = decodeURI(a.getAttribute("href").slice(1));
          loadDocument(docPath);
        });
      });

      content.scrollTop = 0;
    } catch {
      content.innerHTML =
        '<div class="kb-welcome"><p>文档加载失败，请检查路径。</p></div>';
    }

    closeSidebarMobile();
  }

  function setActiveTreeItem(path) {
    document.querySelectorAll(".tree-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.path === path);
    });
  }

  function renderBreadcrumb(parts) {
    const el = document.getElementById("breadcrumb");
    el.innerHTML = parts
      .map((p, i) =>
        i === parts.length - 1 ? `<span>${p}</span>` : p
      )
      .join(" / ");
  }

  // ── Mobile Sidebar ──

  function closeSidebarMobile() {
    document.getElementById("sidebar").classList.remove("open");
  }

  function initMobile() {
    const openBtn = document.getElementById("sidebar-open");
    const closeBtn = document.getElementById("sidebar-close");
    const sidebar = document.getElementById("sidebar");

    if (openBtn) {
      openBtn.addEventListener("click", () => sidebar.classList.add("open"));
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", () => sidebar.classList.remove("open"));
    }
  }

  // ── Init ──

  async function init() {
    initMarked();
    initMobile();

    try {
      const res = await fetch("manifest.json");
      manifest = await res.json();
    } catch {
      document.getElementById("kb-content").innerHTML =
        '<div class="kb-welcome"><p>知识库加载失败。</p></div>';
      return;
    }

    allDocs = flattenDocs(manifest.tree, []);
    allTags = collectTags(allDocs);

    renderTagCloud();
    renderFileTree();

    document.getElementById("tag-search").addEventListener("input", applyFilter);

    const hash = window.location.hash.replace("#", "");
    if (hash) {
      const doc = allDocs.find((d) => d.path === hash || d.path.endsWith(hash));
      if (doc) loadDocument(doc.path);
    } else {
      const welcome = allDocs.find((d) => d.path.endsWith("welcome.md"));
      if (welcome) loadDocument(welcome.path);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

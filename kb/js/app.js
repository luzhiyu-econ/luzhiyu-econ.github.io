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
    const lower = name.toLowerCase().replace(/\s+/g, "-");
    return allDocs.find(
      (d) =>
        d.path.toLowerCase().endsWith("/" + lower + ".md") ||
        d.path.toLowerCase() === "docs/" + lower + ".md"
    );
  }

  function renderObsidianSyntax(md) {
    md = md.replace(/!\[\[([^\]|]+?)(\|([^\]]*))?\]\]/g, (_, file, __, alt) => {
      return `![${alt || file}](${file})`;
    });

    md = md.replace(/(?<!!)\[\[([^\]|]+?)(\|([^\]]*))?\]\]/g, (_, target, __, display) => {
      const doc = resolveWikilink(target);
      if (doc) {
        return `[${display || target}](#${doc.path})`;
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
      /(?:^|(?<=\s))#([\w\u4e00-\u9fff-]+)/g,
      '<span class="inline-tag" data-tag="$1">#$1</span>'
    );
  }

  function resolveAssetPaths(container, base) {
    if (!base) return;
    container.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");
      if (src && !src.startsWith("http") && !src.startsWith("/") && !src.startsWith("data:")) {
        img.src = base + src;
      }
    });
    container.querySelectorAll("a").forEach((a) => {
      const href = a.getAttribute("href");
      if (href && !href.startsWith("http") && !href.startsWith("/") && !href.startsWith("#") && !href.startsWith("mailto:")) {
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
    for (const node of tree) {
      if (node.type === "folder") {
        docs.push(
          ...flattenDocs(node.children || [], [...breadcrumb, node.title])
        );
      } else {
        docs.push({
          title: node.title,
          path: node.path,
          tags: node.tags || [],
          breadcrumb: [...breadcrumb, node.title],
        });
      }
    }
    return docs;
  }

  function collectTags(docs) {
    const tagSet = new Set();
    for (const doc of docs) {
      for (const t of doc.tags) tagSet.add(t);
    }
    return Array.from(tagSet).sort();
  }

  // ── Sidebar: Tag Cloud ──

  function renderTagCloud() {
    const container = document.getElementById("tag-cloud");
    container.innerHTML = allTags
      .map(
        (t) =>
          `<span class="tag-pill${activeTag === t ? " active" : ""}" data-tag="${t}">#${t}</span>`
      )
      .join("");

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
      const tags = (item.dataset.tags || "").split(",");
      const title = item.textContent.toLowerCase();

      let visible = true;
      if (filterTag && !tags.includes(filterTag)) visible = false;
      if (textQuery && !title.includes(textQuery)) visible = false;

      item.classList.toggle("hidden", !visible);
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
        const res = await fetch(path);
        if (!res.ok) throw new Error("Not found");
        md = await res.text();
        docCache[path] = md;
      }

      content.innerHTML = renderMarkdown(md);

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
          const docPath = a.getAttribute("href").slice(1);
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
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

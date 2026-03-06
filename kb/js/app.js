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

  function renderMarkdown(md) {
    if (typeof marked === "undefined") return `<pre>${md}</pre>`;
    let html = marked.parse(md);
    html = renderInlineTags(html);
    return html;
  }

  function renderInlineTags(html) {
    return html.replace(
      /(?:^|(?<=\s))#([\w\u4e00-\u9fff-]+)/g,
      '<span class="inline-tag" data-tag="$1">#$1</span>'
    );
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

      content.querySelectorAll(".inline-tag").forEach((tag) => {
        tag.addEventListener("click", () => {
          activeTag = tag.dataset.tag;
          renderTagCloud();
          applyFilter();
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

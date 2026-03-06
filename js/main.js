(function () {
  "use strict";

  const SECTIONS = {
    home: "sections/home.html",
    research: "sections/research.html",
    cv: "sections/cv-en.html",
    "cv-cn": "sections/cv-cn.html",
    blog: "sections/blog.html",
  };

  const sectionCache = {};
  let blogPosts = [];
  let currentBlogView = "list";

  // ── Markdown setup ──

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
    return marked.parse(md);
  }

  // ── Helpers ──

  async function fetchText(url) {
    if (sectionCache[url]) return sectionCache[url];
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}`);
    const text = await res.text();
    sectionCache[url] = text;
    return text;
  }

  // ── Section Loading ──

  async function loadSection(name) {
    const url = SECTIONS[name];
    if (!url) return;

    const container = document.getElementById("main-content");
    try {
      const html = await fetchText(url);
      container.innerHTML = html;
      container.classList.remove("active");
      void container.offsetWidth;
      container.classList.add("active");

      if (name === "blog") {
        await initBlog();
      }
    } catch {
      container.innerHTML =
        '<p style="text-align:center;color:#888;padding:60px 0;">Loading failed. Please refresh.</p>';
    }
  }

  // ── Navigation ──

  function setActiveNav(name) {
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.toggle("active", link.dataset.section === name);
    });
  }

  function navigateTo(section, pushState = true) {
    setActiveNav(section);
    loadSection(section);
    if (pushState) {
      history.pushState({ section }, "", `#${section}`);
    }
  }

  function initNav() {
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const target = link.dataset.section;
        if (target) {
          currentBlogView = "list";
          navigateTo(target);
        }
      });
    });

    window.addEventListener("popstate", (e) => {
      const section = e.state?.section || getSectionFromHash() || "home";
      currentBlogView = "list";
      navigateTo(section, false);
    });
  }

  function getSectionFromHash() {
    const hash = window.location.hash.replace("#", "");
    return SECTIONS[hash] ? hash : null;
  }

  // ── Blog System ──

  async function initBlog() {
    const listContainer = document.getElementById("blog-list-container");
    const postContainer = document.getElementById("blog-post-container");
    if (!listContainer || !postContainer) return;

    if (blogPosts.length === 0) {
      try {
        const res = await fetch("blog/posts.json");
        blogPosts = await res.json();
      } catch {
        listContainer.innerHTML = '<p class="blog-empty">暂无文章</p>';
        return;
      }
    }

    if (currentBlogView === "list") {
      showBlogList(listContainer, postContainer);
    }
  }

  function showBlogList(listContainer, postContainer) {
    listContainer.style.display = "";
    postContainer.style.display = "none";

    if (blogPosts.length === 0) {
      listContainer.innerHTML = '<p class="blog-empty">暂无文章</p>';
      return;
    }

    listContainer.innerHTML = blogPosts
      .map(
        (post) => `
      <div class="blog-card" data-post-id="${post.id}">
        <div class="blog-date">${post.date}</div>
        <h3>${post.title}</h3>
        <div class="blog-excerpt">${post.excerpt}</div>
        <div class="blog-tags">
          ${post.tags.map((t) => `<span class="blog-tag">${t}</span>`).join("")}
        </div>
      </div>`
      )
      .join("");

    listContainer.querySelectorAll(".blog-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.postId;
        const post = blogPosts.find((p) => p.id === id);
        if (post) openBlogPost(post, listContainer, postContainer);
      });
    });
  }

  async function openBlogPost(post, listContainer, postContainer) {
    currentBlogView = "post";
    listContainer.style.display = "none";
    postContainer.style.display = "";

    try {
      const raw = await fetchText(post.file);
      const isMarkdown = post.file.endsWith(".md");
      const rendered = isMarkdown ? renderMarkdown(raw) : raw;

      postContainer.innerHTML = `
        <span class="blog-back-link" id="blog-back">&larr; 返回文章列表</span>
        <div class="post-meta">${post.date} · ${post.tags.join(", ")}</div>
        <div class="post-body">${rendered}</div>`;

      document.getElementById("blog-back").addEventListener("click", () => {
        currentBlogView = "list";
        showBlogList(listContainer, postContainer);
      });
    } catch {
      postContainer.innerHTML =
        '<p style="text-align:center;color:#888;">文章加载失败</p>';
    }
  }

  // ── Init ──

  function init() {
    initMarked();
    initNav();
    const initial = getSectionFromHash() || "home";
    navigateTo(initial, false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

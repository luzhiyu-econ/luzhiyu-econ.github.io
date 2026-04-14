(function () {
  "use strict";

  const SECTIONS = {
    home: "sections/home.html",
    research: "sections/research.html",
    blog: "sections/blog.html",
    software: "sections/software.html",
  };

  const sectionCache = {};
  let blogPosts = [];
  let currentBlogView = "list";

  // ── Markdown ──

  function renderMarkdown(md) {
    if (typeof marked === "undefined") return `<pre>${md}</pre>`;
    const { text, blocks, inlines } = SharedUtils.extractMath(md);
    let html = marked.parse(text);
    html = SharedUtils.restoreMath(html, blocks, inlines);
    return html;
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

  let blogTocScrollHandler = null;

  function buildBlogTOC(postBody) {
    let tocEl = document.querySelector(".blog-toc");
    if (!tocEl) {
      tocEl = document.createElement("nav");
      tocEl.className = "blog-toc";
      document.body.appendChild(tocEl);
    }

    const headings = postBody.querySelectorAll("h2, h3, h4");
    if (headings.length < 2) { tocEl.innerHTML = ""; return; }

    let html = '<div class="toc-title">目录</div><ul class="toc-list">';
    headings.forEach((h) => {
      const level = h.tagName.toLowerCase();
      html += `<li><a href="#${h.id}" class="toc-${level}">${h.textContent}</a></li>`;
    });
    html += "</ul>";
    tocEl.innerHTML = html;

    tocEl.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const target = document.getElementById(a.getAttribute("href").slice(1));
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    if (blogTocScrollHandler) window.removeEventListener("scroll", blogTocScrollHandler);
    let ticking = false;
    blogTocScrollHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => { updateBlogTOCActive(postBody, tocEl); ticking = false; });
        ticking = true;
      }
    };
    window.addEventListener("scroll", blogTocScrollHandler);
    updateBlogTOCActive(postBody, tocEl);
  }

  function updateBlogTOCActive(postBody, tocEl) {
    const headings = postBody.querySelectorAll("h2, h3, h4");
    const links = tocEl.querySelectorAll("a");
    if (!headings.length) return;

    let current = headings[0].id;
    const offset = 80;
    headings.forEach((h) => {
      if (h.getBoundingClientRect().top < offset) current = h.id;
    });
    links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + current));
  }

  function removeBlogTOC() {
    const tocEl = document.querySelector(".blog-toc");
    if (tocEl) tocEl.innerHTML = "";
    if (blogTocScrollHandler) {
      window.removeEventListener("scroll", blogTocScrollHandler);
      blogTocScrollHandler = null;
    }
  }

  // ── Section Loading ──

  async function loadSection(name, postId = null) {
    const url = SECTIONS[name];
    if (!url) return;

    removeBlogTOC();

    const container = document.getElementById("main-content");
    try {
      const html = await fetchText(url);
      container.innerHTML = html;
      container.classList.remove("active");
      // Force reflow so the CSS transition replays
      void container.offsetWidth;
      container.classList.add("active");

      if (name === "blog") {
        await initBlog(postId);
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

  function navigateTo(section, pushState = true, postId = null) {
    setActiveNav(section);
    loadSection(section, postId);
    if (pushState) {
      let url = section === "home" ? "/" : `/${section}`;
      if (postId) url += `/${postId}`;
      history.pushState({ section, postId }, "", url);
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
      const state = e.state;
      if (state && state.postId) {
        currentBlogView = "post";
        navigateTo("blog", false, state.postId);
      } else if (state && state.section) {
        currentBlogView = "list";
        navigateTo(state.section, false);
      } else {
        const route = getRouteFromPath();
        currentBlogView = route.postId ? "post" : "list";
        navigateTo(route.section, false, route.postId);
      }
    });
  }

  function getRouteFromPath() {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
    if (!path) return { section: "home", postId: null };

    const parts = path.split("/");
    const section = parts[0];
    if (!SECTIONS[section]) return { section: "home", postId: null };

    if (section === "blog" && parts[1]) {
      return { section: "blog", postId: parts[1] };
    }
    return { section, postId: null };
  }

  // ── Blog System ──

  async function initBlog(postId = null) {
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

    if (postId) {
      const post = blogPosts.find((p) => p.id === postId);
      if (post) {
        await openBlogPost(post, listContainer, postContainer, false);
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

  async function openBlogPost(post, listContainer, postContainer, pushState = true) {
    currentBlogView = "post";
    listContainer.style.display = "none";
    postContainer.style.display = "";

    if (pushState) {
      history.pushState({ section: "blog", postId: post.id }, "", `/blog/${post.id}`);
    }

    try {
      const raw = await fetchText(post.file);
      const isMarkdown = post.file.endsWith(".md");
      const rendered = isMarkdown ? renderMarkdown(raw) : raw;

      postContainer.innerHTML = `
        <span class="blog-back-link" id="blog-back">&larr; 返回文章列表</span>
        <div class="post-meta">${post.date} · ${post.tags.join(", ")}</div>
        <div class="post-body md-content">${rendered}</div>`;

      const postBody = postContainer.querySelector(".post-body");
      SharedUtils.resolveAssetPaths(postBody, post.base);
      SharedUtils.addHeadingAnchors(postBody);
      buildBlogTOC(postBody);

      document.getElementById("blog-back").addEventListener("click", () => {
        currentBlogView = "list";
        removeBlogTOC();
        showBlogList(listContainer, postContainer);
        history.pushState({ section: "blog", postId: null }, "", "/blog");
      });

      window.scrollTo({ top: 0 });
    } catch {
      postContainer.innerHTML =
        '<p style="text-align:center;color:#888;">文章加载失败</p>';
    }
  }

  // ── Init ──

  function init() {
    SharedUtils.initMarked();
    initNav();

    const hash = window.location.hash.replace("#", "");
    if (hash && SECTIONS[hash]) {
      const url = hash === "home" ? "/" : `/${hash}`;
      history.replaceState({ section: hash, postId: null }, "", url);
      navigateTo(hash, false);
      return;
    }

    const route = getRouteFromPath();
    if (route.postId) {
      currentBlogView = "post";
    }
    navigateTo(route.section, false, route.postId);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

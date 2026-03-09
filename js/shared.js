/**
 * shared.js — Shared utilities for both the main site and the wiki.
 * Loaded before main.js / app.js by both index.html and wiki/index.html.
 */
(function () {
  "use strict";

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
      } catch {
        return `<pre class="math-error">${blocks[+i]}</pre>`;
      }
    });
    html = html.replace(/MATHINLINE(\d+)END/g, (_, i) => {
      try {
        return katex.renderToString(inlines[+i], { displayMode: false, throwOnError: false });
      } catch {
        return `<code>${inlines[+i]}</code>`;
      }
    });
    return html;
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

  /**
   * Rewrite relative src/href to absolute paths based on the document base.
   * @param {Element} container
   * @param {string}  base - base path prefix
   * @param {string[]} [extraPrefixExclusions] - additional prefixes to skip
   */
  function resolveAssetPaths(container, base, extraPrefixExclusions) {
    if (!base) return;
    const skip = ["http", "/", "data:"];
    if (extraPrefixExclusions) skip.push(...extraPrefixExclusions);

    function shouldSkip(val) {
      return !val || skip.some((p) => val.startsWith(p));
    }

    container.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");
      if (!shouldSkip(src)) img.src = base + src;
    });
    container.querySelectorAll("a").forEach((a) => {
      const href = a.getAttribute("href");
      if (!shouldSkip(href) && !href.startsWith("#") && !href.startsWith("mailto:")) {
        a.href = base + href;
      }
    });
  }

  window.SharedUtils = {
    initMarked: initMarked,
    extractMath: extractMath,
    restoreMath: restoreMath,
    addHeadingAnchors: addHeadingAnchors,
    resolveAssetPaths: resolveAssetPaths,
  };
})();

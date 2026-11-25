(function () {
  "use strict";

  const topics = {
    hello: {
      caption: "你好，我是陆知雨，欢迎来到我的个人主页。",
      translation: "Hello, I’m Zhiyu Lu. Welcome to my homepage.",
      gesture: "wave",
      audio: "/fig/avatar/greeting.mp3",
    },
    research: {
      caption: "我研究政治经济学、公共经济学和创新经济学，也用文本分析和大语言模型做实证研究。",
      translation: "I study political economy, public economics, and the economics of innovation. I also use text analysis and large language models in empirical research.",
      gesture: "present",
      audio: "/fig/avatar/research.mp3",
      link: ["/research", "Browse my research"],
    },
    handbook: {
      caption: "我在写一本面向经济学研究者的人工智能手册，介绍怎样用大语言模型做研究。",
      translation: "I’m writing an AI handbook for economists on how to use large language models in their research.",
      gesture: "point",
      audio: "/fig/avatar/handbook.mp3",
      link: ["https://zhiyulu.org/EconLLM-Lab/", "Read the AI4Econ handbook"],
    },
  };

  const followupTopics = [topics.research, topics.handbook];
  const atlas = new Image();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const viewportInset = 14;
  const arrowMoves = {
    ArrowLeft: [-20, 0],
    ArrowRight: [20, 0],
    ArrowUp: [0, -20],
    ArrowDown: [0, 20],
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  function visibleBounds(viewport) {
    const x = viewport?.offsetLeft ?? 0;
    const y = viewport?.offsetTop ?? 0;
    return {
      left: x + viewportInset,
      top: y + viewportInset,
      right: x + (viewport?.width ?? document.documentElement.clientWidth) - viewportInset,
      bottom: y + (viewport?.height ?? document.documentElement.clientHeight) - viewportInset,
    };
  }

  function positionBubble(bubble, anchor, bounds) {
    const gap = 10;
    const width = Math.min(284, bounds.right - bounds.left);
    const leftSpace = anchor.left - bounds.left;
    const rightSpace = bounds.right - anchor.right;
    const aboveSpace = anchor.top - bounds.top;
    const belowSpace = bounds.bottom - anchor.bottom;
    const beside = Math.max(leftSpace, rightSpace) >= width + gap;
    const maxHeight = beside
      ? bounds.bottom - bounds.top
      : Math.max(aboveSpace, belowSpace) - gap;

    bubble.style.width = width + "px";
    bubble.style.setProperty("--avatar-message-height", Math.max(0, maxHeight) + "px");
    const height = bubble.offsetHeight;
    let x, y, tail;

    if (beside) {
      const placeLeft = leftSpace >= rightSpace;
      const face = anchor.top + (anchor.bottom - anchor.top) * 0.24;
      bubble.dataset.side = placeLeft ? "left" : "right";
      x = placeLeft ? anchor.left - width - gap : anchor.right + gap;
      y = clamp(face - height / 2, bounds.top, bounds.bottom - height);
      tail = clamp(face - y, 12, height - 12);
    } else {
      const placeAbove = aboveSpace >= belowSpace;
      const center = (anchor.left + anchor.right) / 2;
      bubble.dataset.side = placeAbove ? "above" : "below";
      x = clamp(center - width / 2, bounds.left, bounds.right - width);
      y = placeAbove ? anchor.top - height - gap : anchor.bottom + gap;
      tail = clamp(center - x, 12, width - 12);
    }

    bubble.style.left = x - anchor.left + "px";
    bubble.style.top = y - anchor.top + "px";
    bubble.style.setProperty("--avatar-tail", tail + "px");
  }

  function bindStage(stage, moveTo, activate, options) {
    let pointer;
    let suppressClick = false;

    stage.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary || event.button !== 0 || pointer) return;
      const { left, top } = stage.getBoundingClientRect();
      pointer = { id: event.pointerId, left, top, x: event.clientX, y: event.clientY, moved: false };
      suppressClick = false;
      stage.setPointerCapture(event.pointerId);
    }, options);

    function movePointer(event) {
      if (pointer?.id !== event.pointerId) return;
      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      if (!pointer.moved && Math.hypot(dx, dy) < 6) return;
      pointer.moved = true;
      stage.classList.add("is-dragging");
      moveTo(pointer.left + dx, pointer.top + dy);
    }

    function endPointer(event) {
      if (pointer?.id !== event.pointerId) return;
      suppressClick = pointer.moved;
      pointer = undefined;
      stage.classList.remove("is-dragging");
    }

    stage.addEventListener("pointermove", movePointer, options);
    stage.addEventListener("pointerup", (event) => {
      if (pointer?.id !== event.pointerId) return;
      movePointer(event);
      const tap = event.pointerType === "touch" && !pointer.moved;
      endPointer(event);
      if (tap) {
        // 拖动之后，浏览器有时不会给下一次轻触派发 click。
        suppressClick = true;
        activate();
      }
    }, options);
    stage.addEventListener("pointercancel", endPointer, options);
    stage.addEventListener("lostpointercapture", endPointer, options);
    stage.addEventListener("click", (event) => {
      if (!suppressClick || (!event.detail && !event.pointerType)) activate();
    }, options);
    stage.addEventListener("keydown", (event) => {
      const delta = arrowMoves[event.key];
      if (!delta || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      const { left, top } = stage.getBoundingClientRect();
      moveTo(left + delta[0], top + delta[1]);
    }, options);
  }

  function mountAvatar(root) {
    const listeners = new AbortController();
    const options = { signal: listeners.signal };
    const stage = root.querySelector(".avatar-stage");
    const gesture = root.querySelector(".avatar-gesture");
    const bubble = root.querySelector(".avatar-content");
    const announcement = root.querySelector(".avatar-announcement");
    const caption = root.querySelector(".avatar-caption");
    const translation = root.querySelector(".avatar-translation");
    const feedback = root.querySelector(".avatar-feedback");
    const followup = root.querySelector(".avatar-followup");
    const link = root.querySelector(".avatar-link");
    const stop = root.querySelector(".avatar-stop");
    const audio = root.querySelector("audio");
    const viewport = window.visualViewport;
    let position;
    let greeted = false;
    let interaction = 0;
    let frameId = 0;

    function layoutAvatar() {
      const bounds = visibleBounds(viewport);
      const maxWidth = Math.min(bounds.right - bounds.left, (bounds.bottom - bounds.top) * 0.28);
      root.style.maxWidth = Math.max(1, maxWidth) + "px";
      const { width, height } = stage.getBoundingClientRect();
      const maxX = bounds.right - width;
      const maxY = bounds.bottom - height;
      const x = clamp(position?.x ?? maxX, bounds.left, maxX);
      const y = clamp(position?.y ?? maxY, bounds.top, maxY);
      root.style.left = x + "px";
      root.style.top = y + "px";
      if (position) position = { x, y };

      if (!bubble.hidden) {
        positionBubble(bubble, { left: x, top: y, right: x + width, bottom: y + height }, bounds);
      }
    }

    function moveTo(x, y) {
      position = { x, y };
      layoutAvatar();
    }

    function resetPlayback() {
      interaction += 1;
      cancelAnimationFrame(frameId);
      gesture.hidden = true;
      if (audio.hasAttribute("src")) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
      if (document.activeElement === stop) stage.focus({ preventScroll: true });
      stop.hidden = true;
      followup.hidden = link.hidden;
    }

    async function showGesture(topic, id, voiced) {
      if (reducedMotion.matches) return;
      if (!atlas.hasAttribute("src")) atlas.src = "fig/avatar/gestures.webp";
      try {
        await atlas.decode();
      } catch {
        return;
      }
      if (id !== interaction) return;

      const start = performance.now();
      const waveDuration = 1.6;
      const duration = topic.gesture === "wave" ? waveDuration : 2.4;
      const mouthFrames = [0, 1, 2, 1, 0, 3, 2, 1];

      function draw(now) {
        const seconds = voiced ? audio.currentTime : (now - start) / 1000;
        if (reducedMotion.matches || (!voiced && seconds >= duration)) {
          gesture.hidden = true;
          return;
        }
        const waving = topic.gesture === "wave" && seconds < waveDuration;
        const row = waving ? 0 : topic.gesture === "point" ? 2 : 1;
        const column = waving
          ? Math.floor(seconds / 0.2) % 4
          : mouthFrames[Math.floor(seconds / 0.12) % mouthFrames.length];
        gesture.style.backgroundPosition = (column * 100 / 3) + "% " + (row * 50) + "%";
        gesture.hidden = false;
        frameId = requestAnimationFrame(draw);
      }
      frameId = requestAnimationFrame(draw);
    }

    function reportAudioError() {
      resetPlayback();
      feedback.textContent = "Audio is unavailable. You can read the transcript above.";
      feedback.hidden = false;
    }

    function chooseTopic() {
      resetPlayback();
      const topic = greeted
        ? followupTopics[Math.floor(Math.random() * followupTopics.length)]
        : topics.hello;
      greeted = true;
      caption.textContent = topic.caption;
      translation.textContent = topic.translation;
      announcement.textContent = topic.translation;
      feedback.hidden = true;
      if (topic.link) [link.href, link.textContent] = topic.link;
      link.hidden = !topic.link;
      stop.hidden = !topic.audio;
      followup.hidden = link.hidden && stop.hidden;
      bubble.hidden = false;
      stage.setAttribute("aria-expanded", "true");
      layoutAvatar();

      const id = interaction;
      if (!topic.audio) {
        showGesture(topic, id, false);
        return;
      }
      audio.src = topic.audio;
      audio.play().then(
        () => showGesture(topic, id, true),
        () => {
          if (id === interaction) reportAudioError();
        },
      );
    }

    function dismissReply() {
      resetPlayback();
      if (bubble.contains(document.activeElement)) stage.focus({ preventScroll: true });
      bubble.hidden = true;
      announcement.textContent = "";
      stage.setAttribute("aria-expanded", "false");
    }

    bindStage(stage, moveTo, chooseTopic, options);
    root.querySelector(".avatar-dismiss").addEventListener("click", dismissReply, options);
    root.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || bubble.hidden) return;
      event.preventDefault();
      dismissReply();
    }, options);
    document.addEventListener("pointerdown", (event) => {
      if (!bubble.hidden && !root.contains(event.target)) dismissReply();
    }, options);
    stop.addEventListener("click", resetPlayback, options);
    audio.addEventListener("ended", () => {
      if (audio.ended) resetPlayback();
    }, options);
    audio.addEventListener("error", () => {
      if (audio.error) reportAudioError();
    }, options);
    window.addEventListener("pagehide", () => {
      dismissReply();
      greeted = false;
    }, options);
    window.addEventListener("resize", layoutAvatar, options);
    viewport?.addEventListener("resize", layoutAvatar, options);
    viewport?.addEventListener("scroll", layoutAvatar, options);

    const observer = new ResizeObserver(layoutAvatar);
    observer.observe(bubble);
    layoutAvatar();

    return () => {
      listeners.abort();
      observer.disconnect();
      resetPlayback();
    };
  }

  class HomeAvatar extends HTMLElement {
    #cleanup;

    connectedCallback() {
      this.#cleanup = mountAvatar(this);
    }

    disconnectedCallback() {
      this.#cleanup?.();
    }
  }

  customElements.define("home-avatar", HomeAvatar);
})();

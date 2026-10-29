(() => {
  "use strict";

  if (!window.markdownit) return;
  const markdown = window.markdownit({ html: false, breaks: false, linkify: false });
  let disposeOutline;

  function node(tag, className, text) {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (text !== undefined) result.textContent = text;
    return result;
  }

  // Preserve the simple display formulas supported by the original article reader.
  markdown.block.ruler.before("fence", "display_math", (state, start, end, silent) => {
    const line = index => state.src.slice(state.bMarks[index] + state.tShift[index], state.eMarks[index]).trim();
    if (line(start) !== "$$") return false;
    let next = start + 1;
    while (next < end && line(next) !== "$$") next++;
    if (next === end) return false;
    if (silent) return true;
    const token = state.push("display_math", "div", 0);
    token.block = true;
    token.content = state.getLines(start + 1, next, 0, false).trim();
    token.map = [start, next + 1];
    state.line = next + 1;
    return true;
  }, { alt: ["paragraph", "reference", "blockquote", "list"] });
  markdown.renderer.rules.display_math = (tokens, index) => {
    const expression = tokens[index].content.replace(/\\operatorname\{([^}]+)\}/g, "$1").replace(/[{}]/g, "");
    return `<div class="math-block">${markdown.utils.escapeHtml(expression)}</div>\n`;
  };

  function resolveUrl(value, baseUrl, image = false) {
    try {
      const url = new URL(value, value.startsWith("#") ? window.location.href : baseUrl);
      return (image ? ["http:", "https:"] : ["http:", "https:", "mailto:"]).includes(url.protocol) ? url : null;
    } catch {
      return null;
    }
  }

  function headingSlug(text) {
    return text.normalize("NFKC").toLowerCase().trim()
      .replace(/[^\p{L}\p{N}\s_-]/gu, "")
      .replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "") || "untitled";
  }

  function createOutline(body) {
    const headings = [...body.querySelectorAll("h1, h2, h3, h4, h5, h6")];
    if (!headings.length) return;
    const article = body.closest("article");
    const layout = article.closest(".article-layout");
    const navigation = node("nav", "article-toc");
    navigation.setAttribute("aria-label", "Article contents");
    navigation.append(node("p", "toc-title", "Contents"));
    const list = node("ol", "toc-list");
    navigation.append(list);
    const usedIds = new Set([...document.querySelectorAll("[id]")].map(item => item.id));
    const stack = [];
    const links = [];

    headings.forEach(heading => {
      const baseId = `section-${headingSlug(heading.textContent)}`;
      let id = baseId;
      let suffix = 2;
      while (usedIds.has(id)) id = `${baseId}-${suffix++}`;
      usedIds.add(id);
      heading.id = id;
      heading.tabIndex = -1;
      const level = Number(heading.tagName.slice(1));
      while (stack.length && stack.at(-1).level >= level) stack.pop();
      let parent = list;
      if (stack.length) {
        const ancestor = stack.at(-1).item;
        parent = ancestor.querySelector(":scope > ol");
        if (!parent) {
          parent = node("ol");
          ancestor.append(parent);
        }
      }
      const item = node("li");
      const anchor = node("a", "", heading.textContent);
      anchor.href = `#${encodeURIComponent(id)}`;
      item.append(anchor);
      parent.append(item);
      links.push(anchor);
      stack.push({ level, item });
    });

    // A Markdown fragment link such as #overview also accepts the generated section prefix.
    body.querySelectorAll('a[href^="#"]').forEach(anchor => {
      try {
        const value = decodeURIComponent(anchor.getAttribute("href").slice(1));
        const target = headings.find(heading => heading.id === value || heading.id === `section-${headingSlug(value)}`);
        if (target) anchor.href = `#${encodeURIComponent(target.id)}`;
      } catch { /* Leave malformed fragments as ordinary links. */ }
    });
    body.before(navigation);
    layout.classList.add("has-toc");

    const events = new AbortController();
    const options = { passive: true, signal: events.signal };
    let frame;
    let active = -1;
    function updateCurrentSection() {
      frame = undefined;
      let current = 0;
      for (let index = 0; index < headings.length; index++) {
        if (headings[index].getBoundingClientRect().top <= 96) current = index;
      }
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) current = headings.length - 1;
      if (current === active) return;
      if (active >= 0) links[active].removeAttribute("aria-current");
      active = current;
      const anchor = links[active];
      anchor.setAttribute("aria-current", "location");
      const bounds = list.getBoundingClientRect();
      const itemBounds = anchor.getBoundingClientRect();
      if (itemBounds.top < bounds.top) list.scrollTop += itemBounds.top - bounds.top;
      else if (itemBounds.bottom > bounds.bottom) list.scrollTop += itemBounds.bottom - bounds.bottom;
    }
    function scheduleUpdate() {
      if (frame === undefined) frame = requestAnimationFrame(updateCurrentSection);
    }
    window.addEventListener("scroll", scheduleUpdate, options);
    window.addEventListener("resize", scheduleUpdate, options);
    window.addEventListener("hashchange", scheduleUpdate, options);

    // The browser sees the initial hash before the asynchronously loaded headings exist.
    const initialHash = window.location.hash;
    let restoreInitialPosition = Boolean(initialHash);
    function restoreHash() {
      if (!restoreInitialPosition || window.location.hash !== initialHash) return;
      let id;
      try { id = decodeURIComponent(initialHash.slice(1)); } catch { return; }
      const heading = headings.find(item => item.id === id);
      if (!heading) return;
      const root = document.documentElement;
      const previousBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      heading.scrollIntoView({ block: "start" });
      heading.focus({ preventScroll: true });
      root.style.scrollBehavior = previousBehavior;
      scheduleUpdate();
    }
    const stopRestoring = () => { restoreInitialPosition = false; };
    ["pointerdown", "wheel", "touchstart", "keydown", "hashchange"].forEach(type => {
      window.addEventListener(type, stopRestoring, { ...options, once: true });
    });
    body.querySelectorAll("img").forEach(image => {
      image.addEventListener("load", () => { restoreHash(); scheduleUpdate(); }, { once: true, signal: events.signal });
    });
    restoreHash();
    scheduleUpdate();
    disposeOutline = () => {
      events.abort();
      if (frame !== undefined) cancelAnimationFrame(frame);
      navigation.remove();
      layout.classList.remove("has-toc");
    };
  }

  function render(body, source, baseUrl, title) {
    if (disposeOutline) {
      disposeOutline();
      disposeOutline = undefined;
    }
    const template = document.createElement("template");
    template.innerHTML = markdown.render(source);
    const fragment = template.content;
    const first = fragment.firstElementChild;
    if (first?.tagName === "H1" && first.textContent === title) first.remove();
    fragment.querySelectorAll("a[href]").forEach(anchor => {
      const value = anchor.getAttribute("href");
      const url = resolveUrl(value, baseUrl);
      if (!url) { anchor.removeAttribute("href"); return; }
      if (!value.startsWith("#")) anchor.href = url.href;
      if (/^https?:$/.test(url.protocol) && url.origin !== window.location.origin) {
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
      }
    });
    fragment.querySelectorAll("img").forEach(image => {
      const url = resolveUrl(image.getAttribute("src") || "", baseUrl, true);
      if (!url) { image.remove(); return; }
      image.src = url.href;
      image.loading = "lazy";
      image.decoding = "async";
    });
    body.replaceChildren(fragment);
    createOutline(body);
  }

  window.ARTICLE_READER = Object.freeze({ render });
})();

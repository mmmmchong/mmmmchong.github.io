(() => {
  "use strict";

  const content = window.SITE_CONTENT;
  if (!content) return;
  document.documentElement.classList.add("js");
  const profile = {
    ...content.profile,
    fullName: content.profile.nameZh
      ? `${content.profile.name}（${content.profile.nameZh}）`
      : content.profile.name,
    initials: content.profile.initials || (content.profile.name || "")
      .trim().split(/\s+/).filter(Boolean).slice(0, 2)
      .map(part => Array.from(part)[0]).join("").toUpperCase()
  };
  const page = document.body.dataset.page;
  const publications = [...(content.publications || [])].sort((a, b) => b.year - a.year);
  const posts = [...(content.posts || [])].sort((a, b) => b.date.localeCompare(a.date));
  const pageNames = { home: "Home", publications: "Publication", blog: "Blog" };

  // 所有内容按纯文本插入，避免误把正文或标题解释为 HTML。
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // 允许 HTTPS、HTTP、邮件与站内相对路径，拒绝脚本 URL。
  function safeUrl(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    try {
      const url = new URL(value.trim(), window.location.href);
      return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  }

  function link(label, url, className) {
    const href = safeUrl(url);
    if (!href) return null;
    const node = el("a", className, label);
    node.href = href;
    if (/^https?:/.test(href) && new URL(href).origin !== window.location.origin) {
      node.target = "_blank";
      node.rel = "noopener noreferrer";
    }
    return node;
  }

  // 只解析已配置的链接占位符，其他文字始终按纯文本显示。
  function inlineText(text) {
    const fragment = document.createDocumentFragment();
    const source = String(text ?? "");
    const references = profile.introLinks || {};
    let cursor = 0;
    for (const match of source.matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g)) {
      fragment.append(document.createTextNode(source.slice(cursor, match.index)));
      const item = Object.prototype.hasOwnProperty.call(references, match[1]) && references[match[1]];
      if (item && typeof item.label === "string") {
        fragment.append(link(item.label, item.url) || document.createTextNode(item.label));
      } else {
        fragment.append(document.createTextNode(match[0]));
      }
      cursor = match.index + match[0].length;
    }
    fragment.append(document.createTextNode(source.slice(cursor)));
    return fragment;
  }

  function empty(title, description) {
    const box = el("div", "empty-state");
    box.append(el("h3", "", title), el("p", "", description));
    return box;
  }

  function sampleLabel() {
    return el("span", "example-label", "示例 · 待替换");
  }

  function dateLabel(date) {
    return date.replaceAll("-", ".");
  }

  document.title = `${profile.name} · ${pageNames[page] || "Home"}`;
  document.querySelectorAll("[data-profile]").forEach(node => {
    node.textContent = profile[node.dataset.profile] || "";
    if (node.dataset.profile === "intro") {
      node.replaceChildren(inlineText(profile.intro));
    }
    if (node.dataset.profile === "fullName" && profile.nameZh) {
      const english = el("span", "english-name", profile.name);
      const chinese = el("span", "native-name", `（${profile.nameZh}）`);
      node.replaceChildren(english, chinese);
      let previousWidth;
      function updateNameLayout() {
        const availableWidth = node.getBoundingClientRect().width;
        if (availableWidth === previousWidth) return;
        previousWidth = availableWidth;
        chinese.classList.remove("is-stacked");
        chinese.textContent = `（${profile.nameZh}）`;
        if (english.getBoundingClientRect().width + chinese.getBoundingClientRect().width > availableWidth) {
          chinese.textContent = profile.nameZh;
          chinese.classList.add("is-stacked");
        }
      }
      updateNameLayout();
      new ResizeObserver(updateNameLayout).observe(node);
    }
  });
  document.querySelectorAll("[data-year]").forEach(node => {
    node.textContent = new Date().getFullYear();
  });
  const brandInitial = (Array.from((profile.name || "").trim())[0] || "").toUpperCase();
  document.querySelectorAll(".brand-mark").forEach(node => {
    node.textContent = brandInitial ? `${brandInitial}.` : "";
  });
  const favicon = document.querySelector('link[rel="icon"]');
  if (favicon && brandInitial) {
    const icon = new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#24483e"/><text x="32" y="46" text-anchor="middle" font-family="Georgia,serif" font-size="42" fill="#faf9f6"/></svg>', "image/svg+xml");
    icon.querySelector("text").textContent = brandInitial;
    favicon.href = `data:image/svg+xml,${encodeURIComponent(new XMLSerializer().serializeToString(icon.documentElement))}`;
  }
  document.querySelectorAll("[data-interests]").forEach(node => {
    node.replaceChildren(...(profile.interests || []).map(item => el("li", "", item)));
  });

  const education = document.querySelector("[data-education]");
  if (education) {
    const entries = content.education || [];
    education.closest(".education").hidden = entries.length === 0;
    education.replaceChildren(...entries.map(item => {
      const entry = el("li", "education-entry");
      const heading = el("div", "education-heading");
      heading.append(el("h3", "", item.institution));
      if (item.period) heading.append(el("span", "education-period", item.period));
      entry.append(heading);
      if (item.school) entry.append(el("p", "education-school", item.school));
      entry.append(el("p", "education-degree", [item.degree, item.major].filter(Boolean).join(", ")));
      return entry;
    }));
  }

  if (profile.photo && safeUrl(profile.photo)) {
    document.querySelectorAll("[data-avatar]").forEach(node => {
      const image = el("img");
      image.src = safeUrl(profile.photo);
      image.alt = `${profile.name} 的头像`;
      image.addEventListener("error", () => image.remove());
      node.append(image);
    });
  }

  document.querySelectorAll("[data-profile-links]").forEach(node => {
    const links = [];
    if (profile.email) {
      const email = el("span", "profile-email");
      const icon = new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg" class="contact-icon" width="13" height="16" viewBox="0 0 16 20" fill="none" aria-hidden="true"><rect x="1" y="5" width="14" height="10" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="m1.5 5.5 6.5 5 6.5-5" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>', "image/svg+xml").documentElement;
      email.append(icon, el("span", "", profile.email));
      links.push(email);
    }
    (profile.links || []).forEach(item => links.push(link(`${item.label} ↗`, item.url)));
    if (profile.cvUrl) links.push(link("Curriculum vitae ↗", profile.cvUrl));
    const visibleLinks = links.filter(Boolean);
    node.replaceChildren(...(visibleLinks.length ? visibleLinks : [el("p", "muted-note", "联系方式待补充")]));
  });

  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  function closeMenu() {
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
  }
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      closeMenu();
      toggle.focus();
    }
  });
  nav.addEventListener("click", event => {
    if (event.target.closest("a")) closeMenu();
  });

  function publicationCard(paper) {
    const card = el("article", "publication");
    if (paper.example) card.append(sampleLabel());
    const authors = (paper.authors || "").replaceAll("{name}", () => profile.name);
    card.append(el("h3", "", paper.title), el("p", "authors", authors), el("p", "venue", `${paper.venue} · ${paper.year}`));
    const resources = (paper.links || []).map(item => link(`[${item.label}]`, item.url)).filter(Boolean);
    if (resources.length) {
      const group = el("div", "resource-links");
      group.append(...resources);
      card.append(group);
    }
    return card;
  }

  function postCard(post, heading = "h2") {
    const card = el("article", "post-row");
    const time = el("time", "post-date", dateLabel(post.date));
    time.dateTime = post.date;
    const body = el("div", "post-content");
    const title = el(heading);
    const anchor = link(post.title, `blog.html?post=${encodeURIComponent(post.slug)}`);
    title.append(anchor);
    body.append(title, el("p", "", post.excerpt));
    if (post.example) body.append(sampleLabel());
    const arrow = el("span", "post-arrow", "↗");
    arrow.setAttribute("aria-hidden", "true");
    card.append(time, body, arrow);
    return card;
  }

  if (page === "publications") {
    const list = document.getElementById("publication-list");
    if (!publications.length) {
      list.replaceChildren(empty("论文即将更新", "研究成果将在这里按年份整理。"));
    } else {
      const years = [...new Set(publications.map(item => item.year))];
      list.replaceChildren(...years.map(year => {
        const group = el("section", "publication-group");
        const papers = el("div");
        papers.append(...publications.filter(item => item.year === year).map(item => publicationCard(item)));
        group.append(el("h2", "year-heading", year), papers);
        return group;
      }));
    }
  }

  if (page === "blog") {
    const slug = new URLSearchParams(window.location.search).get("post");
    if (slug !== null) {
      document.getElementById("blog-index").hidden = true;
      document.getElementById("main").classList.add("article-layout");
      const article = document.getElementById("blog-article");
      article.hidden = false;
      const back = link("← 所有文章", "blog.html", "back-link");
      const post = posts.find(item => item.slug === slug);
      if (!post) {
        document.title = `文章未找到 · ${profile.name}`;
        article.append(back, el("h1", "", "文章未找到"), el("p", "page-description", "这篇文章可能已被移除，或链接有误。可以返回博客查看其他文章。"));
        return;
      }
      document.title = `${post.title} · ${profile.name}`;
      document.querySelector('meta[name="description"]').content = post.excerpt;
      const header = el("header", "article-heading");
      header.append(el("h1", "", post.title));
      const meta = el("div", "article-meta");
      const time = el("time", "", dateLabel(post.date));
      time.dateTime = post.date;
      meta.append(time);
      if (post.example) meta.append(sampleLabel());
      const body = el("div", "article-body");
      body.append(...(post.paragraphs || []).map(text => el("p", "", text)));
      article.append(back, header, meta, body, el("div", "article-end"));
    } else {
      document.getElementById("blog-list").replaceChildren(...(posts.length ? posts.map(item => postCard(item)) : [empty("文章即将更新", "一些想法，正在慢慢成形。") ]));
    }
  }

})();

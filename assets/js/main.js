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
    return el("span", "example-label", "Example");
  }

  function dateLabel(date) {
    return date.replaceAll("-", ".");
  }

  function inlineMarkdown(text, baseUrl) {
    const fragment = document.createDocumentFragment();
    const pattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|`([^`]+)`|\*\*(.+?)\*\*|\*([^*]+)\*|_([^_]+)_|\$([^$]+)\$/g;
    let cursor = 0;
    for (const match of String(text).matchAll(pattern)) {
      fragment.append(document.createTextNode(text.slice(cursor, match.index)));
      if (match[1] !== undefined) {
        const imageUrl = safeUrl(new URL(match[2], baseUrl).href);
        if (imageUrl) {
          const image = el("img");
          image.src = imageUrl;
          image.alt = match[1];
          image.loading = "lazy";
          fragment.append(image);
        } else {
          fragment.append(document.createTextNode(match[0]));
        }
      } else if (match[3] !== undefined) {
        const target = safeUrl(new URL(match[4], baseUrl).href);
        const anchor = target && link(match[3], target);
        fragment.append(anchor || document.createTextNode(match[0]));
      } else if (match[5] !== undefined) {
        fragment.append(el("code", "", match[5]));
      } else if (match[6] !== undefined) {
        fragment.append(el("strong", "", match[6]));
      } else if (match[7] !== undefined || match[8] !== undefined) {
        fragment.append(el("em", "", match[7] ?? match[8]));
      } else {
        fragment.append(el("span", "inline-math", match[9]));
      }
      cursor = match.index + match[0].length;
    }
    fragment.append(document.createTextNode(text.slice(cursor)));
    return fragment;
  }

  function renderMarkdown(source, baseUrl, articleTitle) {
    const lines = source.replaceAll("\r\n", "\n").split("\n");
    const fragment = document.createDocumentFragment();
    const isTableRule = line => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }

      if (/^```/.test(line.trim())) {
        const language = line.trim().slice(3).trim();
        const code = [];
        i++;
        while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) code.push(lines[i++]);
        if (i < lines.length) i++;
        const pre = el("pre", language ? `language-${language}` : "");
        pre.append(el("code", "", code.join("\n")));
        fragment.append(pre);
        continue;
      }

      if (/^\s*\$\$\s*$/.test(line)) {
        const math = [];
        i++;
        while (i < lines.length && !/^\s*\$\$\s*$/.test(lines[i])) math.push(lines[i++]);
        if (i < lines.length) i++;
        const expression = math.join(" ")
          .replace(/\\operatorname\{([^}]+)\}/g, "$1")
          .replace(/[{}]/g, "")
          .replace(/\s+/g, " ").trim();
        fragment.append(el("div", "math-block", expression));
        continue;
      }

      const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (heading) {
        if (heading[1].length === 1 && heading[2] === articleTitle) {
          i++;
          continue;
        }
        const node = el(`h${heading[1].length}`);
        node.append(inlineMarkdown(heading[2], baseUrl));
        fragment.append(node);
        i++;
        continue;
      }

      if (/^\s*([-*_])\1\1+\s*$/.test(line)) {
        fragment.append(el("hr"));
        i++;
        continue;
      }

      if (i + 1 < lines.length && line.includes("|") && isTableRule(lines[i + 1])) {
        const cells = value => value.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(cell => cell.trim());
        const table = el("table");
        const head = el("thead");
        const headerRow = el("tr");
        cells(line).forEach(value => {
          const cell = el("th");
          cell.append(inlineMarkdown(value, baseUrl));
          headerRow.append(cell);
        });
        head.append(headerRow);
        table.append(head);
        i += 2;
        const body = el("tbody");
        while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
          const row = el("tr");
          cells(lines[i++]).forEach(value => {
            const cell = el("td");
            cell.append(inlineMarkdown(value, baseUrl));
            row.append(cell);
          });
          body.append(row);
        }
        table.append(body);
        fragment.append(table);
        continue;
      }

      if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
        const ordered = /^\s*\d+[.)]\s+/.test(line);
        const list = el(ordered ? "ol" : "ul");
        const pattern = ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-*+]\s+/;
        while (i < lines.length && pattern.test(lines[i])) {
          const item = el("li");
          item.append(inlineMarkdown(lines[i++].replace(pattern, ""), baseUrl));
          list.append(item);
        }
        fragment.append(list);
        continue;
      }

      if (/^    /.test(line)) {
        const code = [];
        while (i < lines.length && (/^    /.test(lines[i]) || !lines[i].trim())) {
          code.push(lines[i].startsWith("    ") ? lines[i].slice(4) : "");
          i++;
        }
        while (code.length && !code.at(-1)) code.pop();
        const pre = el("pre");
        pre.append(el("code", "", code.join("\n")));
        fragment.append(pre);
        continue;
      }

      const paragraph = [];
      while (i < lines.length && lines[i].trim() &&
        !/^```|^\s*\$\$\s*$|^#{1,6}\s|^\s*([-*_])\1\1+\s*$/.test(lines[i]) &&
        !(i + 1 < lines.length && lines[i].includes("|") && isTableRule(lines[i + 1])) &&
        !/^\s*[-*+]\s+/.test(lines[i]) && !/^\s*\d+[.)]\s+/.test(lines[i]) && !/^    /.test(lines[i])) {
        paragraph.push(lines[i++].trim());
      }
      if (paragraph.length) {
        const node = el("p", "");
        node.append(inlineMarkdown(paragraph.join(" "), baseUrl));
        fragment.append(node);
      } else {
        i++;
      }
    }
    return fragment;
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
      chinese.lang = "zh-CN";
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
      image.alt = `Portrait of ${profile.name}`;
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
    node.replaceChildren(...(visibleLinks.length ? visibleLinks : [el("p", "muted-note", "Contact information coming soon.")]));
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
      list.replaceChildren(empty("Publications coming soon", "Research publications will be listed here by year."));
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
      const back = link("← All posts", "blog.html", "back-link");
      const post = posts.find(item => item.slug === slug);
      if (!post) {
        document.title = `Post not found · ${profile.name}`;
        article.append(back, el("h1", "", "Post not found"), el("p", "page-description", "This post may have been removed or the link may be incorrect. Return to the blog to browse other posts."));
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
      article.append(back, header, meta, body, el("div", "article-end"));
      if (post.markdown) {
        const sourceUrl = safeUrl(post.markdown);
        if (!sourceUrl) {
          body.append(el("p", "muted-note", "This post could not be loaded."));
        } else {
          fetch(sourceUrl).then(response => {
            if (!response.ok) throw new Error("Post request failed");
            return response.text();
          }).then(source => body.append(renderMarkdown(source, sourceUrl, post.title))).catch(() => {
            body.append(el("p", "muted-note", "This post could not be loaded."));
          });
        }
      } else {
        body.append(...(post.paragraphs || []).map(text => el("p", "", text)));
      }
    } else {
      document.getElementById("blog-list").replaceChildren(...(posts.length ? posts.map(item => postCard(item)) : [empty("Posts coming soon", "Research notes and ideas will appear here.") ]));
    }
  }

})();

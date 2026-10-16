/* Canon frame. Banner, edge menu, footer badges, reading controls, download list.
   The Guide Bot is not built here. #guide-mount is its only mount point. */
(function () {
  var root = document.documentElement;

  function prefix() {
    var nodes = document.querySelectorAll("script[src]");
    var mark = "assets/js/frame.js";
    for (var i = 0; i < nodes.length; i++) {
      var src = nodes[i].getAttribute("src") || "";
      var at = src.indexOf(mark);
      if (at !== -1) return src.slice(0, at);
    }
    return "";
  }
  var rootPrefix = prefix();
  function fromRoot(href) {
    if (!href) return "";
    if (/^(https?:|mailto:|#)/.test(href)) return href;
    return rootPrefix + String(href).replace(/^\//, "");
  }
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }
  function fineMotion() {
    if (root.dataset.motion === "reduce") return false;
    if (window.matchMedia("(max-width: 720px), (pointer: coarse)").matches) return false;
    if (root.dataset.motion === "full") return true;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  var ICONS = {
    home: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/>',
    rocket: '<path d="M12 19c-4 0-7-3-7-7 4-1 7-4 8-8 4 1 7 4 8 8-4 1-6 4-9 7z"/><path d="M9 15l-2 4 4-2"/>',
    rooms: '<path d="M4 6h7v12H4zM13 6h7v5h-7zM13 13h7v5h-7z"/>',
    image: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.4"/><path d="m7 16 3.2-3.2L13 15l2-2 2 3"/>',
    flow: '<path d="M4 7h6M14 7h6M4 12h16M4 17h6M14 17h6"/><circle cx="12" cy="7" r="2"/><circle cx="12" cy="17" r="2"/>',
    sliders: '<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="8" cy="7" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="10" cy="17" r="2"/>',
    cards: '<rect x="3" y="6" width="12" height="14" rx="2"/><rect x="9" y="4" width="12" height="14" rx="2"/>',
    spark: '<path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8z"/>',
    globe: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.4 2.4 3.6 5 3.6 8s-1.2 5.6-3.6 8c-2.4-2.4-3.6-5-3.6-8s1.2-5.6 3.6-8z"/>',
    download: '<path d="M12 4v10M8 10l4 4 4-4M5 19h14"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/>',
    check: '<circle cx="12" cy="12" r="8"/><path d="M8.5 12.2 10.8 14.5 15.5 9.5"/>',
    book: '<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5z"/>',
    flask: '<path d="M9 3h6M10 3v6L5.5 18A3 3 0 0 0 8 22h8a3 3 0 0 0 2.5-4L14 9V3"/>',
    wrench: '<path d="M14.5 6.2a4 4 0 0 0-5.6 5.1L4 16.2 7.8 20l4.9-4.9a4 4 0 0 0 5.1-5.6L15 12l-3-3z"/>',
    flag: '<path d="M6 21V4M6 5h11l-2 4 2 4H6"/>',
    map: '<path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2zM9 4v14M15 6v14"/>',
    radio: '<path d="M5 15a7 7 0 0 1 14 0"/><path d="M8 15a4 4 0 0 1 8 0"/><circle cx="12" cy="15" r="1"/>',
    server: '<rect x="4" y="4" width="16" height="6" rx="1.5"/><rect x="4" y="14" width="16" height="6" rx="1.5"/><path d="M7 7h.01M7 17h.01"/>',
    phone: '<rect x="8" y="3" width="8" height="18" rx="2"/><path d="M11 18h2"/>',
    headset: '<path d="M4 13a8 8 0 0 1 16 0"/><rect x="3" y="13" width="4" height="7" rx="1.5"/><rect x="17" y="13" width="4" height="7" rx="1.5"/>',
    cloud: '<path d="M7 18h10a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.5A3.5 3.5 0 0 0 7 18z"/>',
    node: '<circle cx="6" cy="12" r="2.2"/><circle cx="18" cy="7" r="2.2"/><circle cx="18" cy="17" r="2.2"/><path d="M8 11.2 16 8M8 12.8l8 3.2"/>',
    building: '<path d="M4 20h16M6 20V6h8v14M14 10h4v10"/><path d="M8 9h2M8 12h2M8 15h2"/>',
    diamond: '<path d="M12 3 20 10 12 21 4 10z"/>',
    script: '<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4M9 12h6M9 16h6"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"/>'
  };
  function svg(name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || ICONS.spark) + "</svg>";
  }
  var TOYS = [
    ["server", "server"],
    ["phone", "phone"],
    ["headset", "headset"],
    ["cloud", "cloud"],
    ["node", "node"],
    ["building", "building"]
  ];
  var GEMS = ["server", "phone", "headset", "cloud", "node", "building", "diamond", "script"];

  var SECTIONS = [
    { id: "home", label: "Home", href: "index.html", icon: "home", desc: "Teams Phone rooms. Read offline. Claims stay cited." },
    { id: "start", label: "Start Here", href: "start.html", icon: "rocket", desc: "Tenant, license, then a dial plan." },
    { id: "help", label: "Help", href: "help.html", icon: "link", desc: "Microsoft Learn pages this lab cites. Confirm before you rely on a seat." },
    { id: "rooms", label: "All Rooms", href: "index.html#rooms", icon: "rooms", desc: "Seventeen tracks. Open a written room from the map." },
    { id: "diagrams", label: "Diagrams", href: "diagrams.html", icon: "image", desc: "Diagrams from the lessons, saved as SVG, PNG, and HTML." },
    { id: "flows", label: "Flows", href: "flows.html", icon: "flow", desc: "Animated call paths. Reduced motion keeps every hop visible." },
    { id: "charts", label: "Charts", href: "charts.html", icon: "sliders", desc: "Counts from this repository. No traffic and no prices." },
    { id: "cheat", label: "Cheat Codes", href: "downloads.html", icon: "cards", desc: "Sheets, cards, and a zip. Each file carries the disclaimer." },
    { id: "play", label: "Play", href: "play.html", icon: "spark", desc: "A port game and a routing drill. Scores stay in this browser." },
    { id: "ecosystem", label: "Ecosystem", href: "ecosystem.html", icon: "globe", desc: "Glossary, sisters, and bridges to CUCM, Webex, and UCCE." },
    { id: "bridges", label: "Bridges", href: "bridges.html", icon: "globe", desc: "Bridges to CUCM, Webex Calling, and UCCE. Confirm before relying." },
    { id: "downloads", label: "Downloads", href: "downloads.html#downloads-bonus", icon: "download", desc: "Sheets, cards, templates, and the offline zip." },
    { id: "careers", label: "Careers", href: "careers.html", icon: "mic", desc: "Study paths. Job titles are labels, not open roles." },
    { id: "quizzes", label: "Practice Quiz", href: "quizzes.html", icon: "check", desc: "Practice checks. Room quizzes stay on the room pages." },
    { id: "cards", label: "Flashcards", href: "flashcards.html", icon: "cards", desc: "Cards from the glossary. Know and Again stay in this browser." },
    { id: "glossary", label: "Glossary", href: "glossary.html", icon: "book", desc: "Term, config note, fault, and source." },
    { id: "labs", label: "Hands-on Labs", href: "labs.html", icon: "flask", desc: "Browser labs. They do not sign in to a tenant." },
    { id: "cases", label: "Troubleshooting", href: "troubleshooting.html", icon: "wrench", desc: "A symptom, a likely cause, and the check." },
    { id: "interviews", label: "Interview Prep", href: "interviews.html", icon: "mic", desc: "Questions with a source. No invented work history." },
    { id: "regions", label: "Countries", href: "regions.html", icon: "flag", desc: "Commercial, GCC High, and DoD are different lists." },
    { id: "mastery", label: "Mastery", href: "start.html", icon: "map", desc: "Fundamentals through Copilot. Unverified stays marked." },
    { id: "ports", label: "Ports", href: "downloads/sheets/ports-protocols.html", icon: "radio", desc: "Ports named in the Teams Phone lessons. Confirm the current list." },
    { id: "certs", label: "Exam notes", href: "careers.html", icon: "check", desc: "MS-700, AB-250, and the seats this lab can still name. Confirm the seat." }
  ];
  var THEMES = [
    ["bloom", "Bloom"],
    ["aurora", "Dark (Aurora)"],
    ["neon", "Neon"],
    ["holographic", "Holographic"],
    ["cyberpunk", "Cyberpunk"],
    ["sunset", "Sunset"],
    ["paper", "Light"],
    ["contrast", "Contrast"]
  ];
  /* Offline copy of assets/data/socials.json. Append a network in both places. */
  var SOCIALS = [];
  var BRAND = {
    github: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5A11.5 11.5 0 0 0 .5 12.3c0 5.22 3.38 9.65 8.07 11.22.59.12.8-.26.8-.57v-2.02c-3.28.73-3.97-1.42-3.97-1.42-.53-1.38-1.3-1.75-1.3-1.75-1.07-.75.08-.73.08-.73 1.18.08 1.8 1.24 1.8 1.24 1.05 1.84 2.76 1.31 3.43.99.1-.78.41-1.31.75-1.61-2.62-.31-5.37-1.34-5.37-5.98 0-1.32.46-2.4 1.22-3.25-.12-.3-.53-1.53.12-3.18 0 0 1-.33 3.3 1.25a11.3 11.3 0 0 1 6 0c2.3-1.58 3.3-1.25 3.3-1.25.65 1.65.24 2.88.12 3.18.76.85 1.22 1.93 1.22 3.25 0 4.65-2.76 5.66-5.39 5.96.42.38.8 1.12.8 2.26v3.35c0 .31.21.7.81.57A11.52 11.52 0 0 0 23.5 12.3 11.5 11.5 0 0 0 12 .5z"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14.6 3h3.2l-7 8L19.2 21h-3.3l-5.1-6.2L6.4 21H3.2l7.4-8.5L4.4 3h3.4l4.6 5.7L14.6 3zm-1.1 16.2h1.8L7.6 4.7H5.8l7.7 14.5z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.7 3.3a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zM3.2 8.4h3v12.2h-3zM10 8.4h2.9v1.7h.1c.4-.8 1.4-1.7 3-1.7 3.2 0 3.8 2.1 3.8 4.8v7.4h-3v-6.6c0-1.6 0-3.6-2.2-3.6s-2.5 1.7-2.5 3.5v6.7H10z"/></svg>',
    huggingface: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#FFD21F"/><circle cx="8.2" cy="10.2" r="1.35" fill="#1c1917"/><circle cx="15.8" cy="10.2" r="1.35" fill="#1c1917"/><path d="M8 14.7c1.1 1.4 2.4 2.1 4 2.1s2.9-.7 4-2.1" fill="none" stroke="#1c1917" stroke-width="1.4" stroke-linecap="round"/></svg>'
  };
  function brandIcon(id) {
    return BRAND[id] || svg("globe");
  }
  var GLOBE = '<svg class="badge-globe" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="24" fill="currentColor" opacity="0.18"/><circle cx="32" cy="32" r="20" fill="none" stroke="currentColor" stroke-width="3"/><g class="globe-spin"><ellipse cx="32" cy="32" rx="9" ry="20" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M12 32h40M15 22h34M15 42h34" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></g><circle cx="24" cy="22" r="4" fill="#fff" opacity="0.85"/></svg>';

  function fileName() {
    var path = (location.pathname || "").split("/").pop() || "index.html";
    if (!path || path.indexOf(".") === -1) return "index.html";
    return path;
  }
  function isCurrent(href) {
    var file = fileName();
    var hash = location.hash || "";
    var clean = href.split("#")[0].split("/").pop() || "index.html";
    var want = href.indexOf("#") === -1 ? "" : href.slice(href.indexOf("#"));
    if (clean !== file) return false;
    if (file === "index.html" && (want === "#rooms" || hash === "#rooms")) return want === hash;
    if (file === "downloads.html") {
      if (want === "#downloads-bonus") return hash === "#downloads-bonus";
      return hash !== "#downloads-bonus";
    }
    return true;
  }

  function riseCounts(scope) {
    (scope || document).querySelectorAll("[data-count-up]").forEach(function (node) {
      var target = Number(node.getAttribute("data-count-up"));
      if (!target || node.dataset.rose === "1") return;
      node.dataset.rose = "1";
      if (!fineMotion()) {
        node.textContent = String(target);
        return;
      }
      var start = performance.now();
      function tick(now) {
        var p = Math.min(1, (now - start) / 900);
        var eased = 1 - Math.pow(1 - p, 3);
        node.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }
  function mountBanner() {
    var chips = SECTIONS.map(function (item) {
      var current = isCurrent(item.href);
      return '<a class="section-chip' + (current ? " is-current" : "") + '" href="' + esc(fromRoot(item.href)) + '"' +
        (current ? ' aria-current="page"' : "") + ' title="' + esc(item.desc) + '">' +
        '<span class="chip-ico" aria-hidden="true">' + svg(item.icon) + "</span>" +
        "<span>" + esc(item.label) + "</span></a>";
    }).join("");
    var existing = document.querySelector(".canon-banner");
    if (existing) {
      var rail = existing.querySelector(".section-rail");
      if (rail && !rail.querySelector(".section-chip")) rail.innerHTML = chips;
      if (!existing.querySelector(".identity-line")) {
        var line = document.createElement("p");
        line.className = "identity-line";
        line.textContent = "A student's open lab: learning and sharing, free for everyone.";
        existing.appendChild(line);
      }
      return;
    }
    var stage = document.querySelector(".v4-stage") || document.body;
    var banner = document.createElement("div");
    banner.className = "canon-banner";
    banner.innerHTML =
      '<nav class="section-rail" aria-label="Sections">' + chips + "</nav>" +
      "<p class=\"identity-line\">A student's open lab: learning and sharing, free for everyone.</p>";
    var topbar = stage.querySelector(".topbar");
    var links = stage.querySelector(".lab-links");
    if (links && links.parentNode) links.parentNode.insertBefore(banner, links.nextSibling);
    else if (topbar && topbar.parentNode) topbar.parentNode.insertBefore(banner, topbar);
    else stage.insertBefore(banner, stage.firstChild);
    riseCounts(banner);
  }

  function syncThemeButtons(name) {
    document.querySelectorAll("[data-set-theme]").forEach(function (btn) {
      var on = btn.getAttribute("data-set-theme") === name;
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
  }
  function applyTheme(name) {
    var allowed = THEMES.some(function (item) { return item[0] === name; });
    if (!allowed) name = "bloom";
    root.dataset.theme = name;
    try { localStorage.setItem("canon-theme", name); } catch (err) { /* storage off */ }
    syncThemeButtons(name);
    document.dispatchEvent(new CustomEvent("canon-theme", { detail: { theme: name } }));
  }
  function applyFont(size) {
    if (size !== "sm" && size !== "md" && size !== "lg") size = "md";
    root.dataset.font = size;
    try { localStorage.setItem("canon-font", size); } catch (err) { /* storage off */ }
    document.querySelectorAll("[data-font-set]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-font-set") === size ? "true" : "false");
    });
  }
  function motionOn() {
    if (root.dataset.motion === "reduce") return true;
    if (root.dataset.motion === "full") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function applyMotion(reduce) {
    root.dataset.motion = reduce ? "reduce" : "full";
    try { localStorage.setItem("canon-motion", reduce ? "reduce" : "full"); } catch (err) { /* storage off */ }
    root.classList.toggle("v4-motion", !reduce);
    document.querySelectorAll("[data-motion-toggle]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", reduce ? "true" : "false");
    });
    var box = document.querySelector("[data-reduce-motion]");
    if (box) box.checked = reduce;
    document.dispatchEvent(new CustomEvent("canon-motion", { detail: { reduced: reduce } }));
  }
  function mountA11y() {
    if (document.querySelector(".display-control")) return;
    var bar = document.querySelector(".topbar .bar-inner") || document.querySelector(".topbar");
    var font = root.dataset.font || "md";
    var theme = root.dataset.theme || "bloom";
    var fonts = [["sm", "A−", "Smaller text"], ["md", "A", "Default text"], ["lg", "A+", "Larger text"]];
    var dock = document.createElement("div");
    dock.className = "display-control";
    dock.innerHTML =
      '<button type="button" class="display-btn" aria-expanded="false" aria-controls="display-panel">Display</button>' +
      '<div id="display-panel" class="display-panel" role="region" aria-label="Reading preferences" hidden>' +
      '<p class="a11y-label">Text</p>' +
      '<div class="a11y-font" role="group" aria-label="Font size">' +
      fonts.map(function (item) {
        return '<button type="button" data-font-set="' + item[0] + '" aria-pressed="' + (font === item[0] ? "true" : "false") + '" aria-label="' + item[2] + '">' + item[1] + "</button>";
      }).join("") +
      "</div>" +
      '<p class="a11y-label">Theme</p>' +
      '<div class="a11y-themes" role="group" aria-label="Theme">' +
      THEMES.map(function (item) {
        return '<button type="button" data-set-theme="' + item[0] + '" aria-checked="' + (theme === item[0] ? "true" : "false") + '">' + item[1] + "</button>";
      }).join("") +
      "</div>" +
      '<button type="button" class="a11y-motion" data-motion-toggle aria-pressed="' + (motionOn() ? "true" : "false") + '">Reduce motion</button>' +
      '<p class="display-stats">110 rooms · Teams Phone · cited notes</p>' +
      "</div>";
    if (bar) bar.appendChild(dock);
    else document.body.insertBefore(dock, document.body.firstChild);
    var button = dock.querySelector(".display-btn");
    var panel = dock.querySelector(".display-panel");
    function setDisplay(open) {
      panel.hidden = !open;
      button.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        var current = panel.querySelector("[aria-pressed='true'], [aria-checked='true']") || panel.querySelector("button");
        if (current) current.focus();
      }
    }
    button.addEventListener("click", function (event) {
      event.stopPropagation();
      setDisplay(panel.hidden);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !panel.hidden) {
        setDisplay(false);
        button.focus();
      }
    });
    document.addEventListener("pointerdown", function (event) {
      if (panel.hidden || dock.contains(event.target)) return;
      setDisplay(false);
    });
    document.querySelectorAll(".theme-switch, .settings-themes").forEach(function (group) {
      if (group.querySelector('[data-set-theme="contrast"]')) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-set-theme", "contrast");
      btn.textContent = "Contrast";
      group.appendChild(btn);
    });
    syncThemeButtons(theme);
  }

  function mountEdge() {
    if (document.querySelector(".edge-rail")) return;
    var rail = document.createElement("div");
    rail.className = "edge-rail";
    var items = SECTIONS.map(function (item) {
      var current = isCurrent(item.href);
      return '<li><a href="' + esc(fromRoot(item.href)) + '"' + (current ? ' class="is-current" aria-current="page"' : "") + ">" +
        '<span class="edge-ico" aria-hidden="true">' + svg(item.icon) + "</span>" +
        '<span class="edge-copy"><span class="edge-label">' + esc(item.label) + "</span>" +
        '<span class="edge-desc">' + esc(item.desc) + "</span></span></a></li>";
    }).join("");
    rail.innerHTML =
      '<button type="button" class="edge-tab" aria-expanded="false" aria-controls="edge-menu">' +
      '<svg class="edge-wheel" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' +
      '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.8M12 18.7v2.8M2.5 12h2.8M18.7 12h2.8M5.1 5.1l2 2M16.9 16.9l2 2M18.9 5.1l-2 2M7.1 16.9l-2 2"/></svg>' +
      '<span class="edge-name">Menu</span><span class="sr">Open sections</span></button>' +
      '<button type="button" class="edge-scrim" hidden aria-label="Close sections"></button>' +
      '<nav id="edge-menu" class="edge-menu" hidden aria-label="All sections">' +
      '<div class="edge-menu-bar"><p>Sections</p><button type="button" class="edge-close">Close</button></div>' +
      '<ul class="edge-list">' + items + "</ul></nav>";
    document.body.appendChild(rail);
    var tab = rail.querySelector(".edge-tab");
    var menu = rail.querySelector(".edge-menu");
    var scrim = rail.querySelector(".edge-scrim");
    var closeBtn = rail.querySelector(".edge-close");
    var links = Array.prototype.slice.call(menu.querySelectorAll("a"));
    var open = false;
    function setOpen(next, focusMenu) {
      open = next;
      menu.hidden = !next;
      scrim.hidden = !next;
      tab.setAttribute("aria-expanded", next ? "true" : "false");
      document.body.classList.toggle("edge-open", next);
      if (next && focusMenu) {
        var current = menu.querySelector(".is-current") || links[0];
        if (current) current.focus();
      }
    }
    tab.addEventListener("click", function () { setOpen(!open, true); });
    closeBtn.addEventListener("click", function () { setOpen(false); tab.focus(); });
    scrim.addEventListener("click", function () { setOpen(false); tab.focus(); });
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      tab.addEventListener("mouseenter", function () { setOpen(true, false); });
      rail.addEventListener("mouseleave", function () {
        if (menu.contains(document.activeElement)) return;
        setOpen(false);
      });
    }
    document.addEventListener("pointerdown", function (event) {
      if (!open || rail.contains(event.target)) return;
      setOpen(false);
    });
    menu.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        tab.focus();
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Home" && event.key !== "End") return;
      var index = links.indexOf(document.activeElement);
      if (index < 0) index = 0;
      if (event.key === "ArrowDown") index = (index + 1) % links.length;
      if (event.key === "ArrowUp") index = (index - 1 + links.length) % links.length;
      if (event.key === "Home") index = 0;
      if (event.key === "End") index = links.length - 1;
      event.preventDefault();
      links[index].focus();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !open) return;
      if (document.querySelector(".settings-panel:not([hidden]), .phone-menu:not([hidden])")) return;
      setOpen(false);
      tab.focus();
    });
  }

  function renderSocials(list, panel) {
    panel.innerHTML = list.map(function (item) {
      if (!item || !item.href || !item.label) return "";
      return '<a href="' + esc(item.href) + '" target="_blank" rel="noopener noreferrer">' +
        brandIcon(item.id) + "<span>" + esc(item.label) + "</span></a>";
    }).join("");
  }
  function mountFooter() {
    if (document.querySelector(".brand-icons, .site-footer[data-canon-footer]")) return;
    var slot = document.querySelector("[data-float-badges]");
    if (!slot) {
      var foot = document.querySelector(".site-footer");
      if (!foot) return;
      slot = document.createElement("div");
      slot.className = "float-badges";
      slot.setAttribute("data-float-badges", "");
      foot.appendChild(slot);
    }
    if (slot.childElementCount) return;
    slot.innerHTML =
      '<a class="float-badge badge-cyan" href="https://cyphermonkeylabs.com"><span class="badge-orb" aria-hidden="true">' + GLOBE + '</span><span class="badge-label">CypherMonkey Labs</span></a>' +
      '<a class="float-badge badge-violet" href="https://github.com/CypherMonkeyLabs"><span class="badge-orb" aria-hidden="true">' + GLOBE + '</span><span class="badge-label">GitHub organization</span></a>' +
      '<div class="badge-wrap"><button type="button" class="float-badge badge-pink" aria-expanded="false" aria-controls="social-panel">' +
      '<span class="badge-orb" aria-hidden="true">' + GLOBE + '</span><span class="badge-label">Socials</span></button>' +
      '<div id="social-panel" class="social-panel" hidden></div></div>';
    var panel = slot.querySelector(".social-panel");
    var button = slot.querySelector("button.float-badge");
    renderSocials(SOCIALS, panel);
    function setPanel(show) {
      panel.hidden = !show;
      button.setAttribute("aria-expanded", show ? "true" : "false");
      document.body.classList.toggle("social-open", !!show);
      if (show) {
        var first = panel.querySelector("a");
        if (first) first.focus();
      }
    }
    button.addEventListener("click", function () { setPanel(panel.hidden); });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !panel.hidden) {
        setPanel(false);
        button.focus();
      }
    });
    document.addEventListener("pointerdown", function (event) {
      if (panel.hidden) return;
      if (panel.contains(event.target) || button.contains(event.target)) return;
      setPanel(false);
    });
    fetch(fromRoot("assets/data/socials.json")).then(function (response) {
      if (!response.ok) return null;
      return response.json();
    }).then(function (data) {
      var list = data && data.networks;
      if (!list || !list.length) return;
      SOCIALS = list;
      renderSocials(list, panel);
    }).catch(function () { /* offline copy stays */ });
  }

  function formatSize(bytes) {
    var size = Number(bytes) || 0;
    if (size >= 1048576) return (size / 1048576).toFixed(1) + " MB";
    if (size >= 1024) return Math.max(1, Math.round(size / 1024)) + " KB";
    return size + " B";
  }
  function dlButton(file, big) {
    var name = String(file.href).split("/").pop();
    return '<a class="dl-btn dl-' + esc(file.kind) + (big ? " dl-big" : "") + '" href="' + esc(fromRoot(file.href)) + '" download="' + esc(name) + '">' +
      svg("download") + "<span>" + esc(file.kind) + "</span><em>" + formatSize(file.bytes) + "</em></a>";
  }
  function bonusHtml(data, compact) {
    var groups = (data && data.groups) || [];
    var html = '<section class="bonus" id="downloads-bonus" aria-labelledby="bonus-title">' +
      '<h2 id="bonus-title">Downloads</h2>' +
      "<p>Everything is free. Each diagram comes as SVG, PNG, and a standalone HTML page that keeps its colors and motion. Sheets come as PDF, cards as PDF, JSON, and HTML.</p>";
    var total = 0, count = 0;
    groups.forEach(function (g) { (g.items || []).forEach(function (it) { (it.files || []).forEach(function (f) { count += 1; total += Number(f.bytes) || 0; }); }); });
    groups.forEach(function (group) {
      var items = group.items || [];
      if (group.id === "bundle") {
        items.forEach(function (item) {
          html += '<div class="dl-all"><div><h3>' + esc(item.label) + "</h3><p>" + esc(item.blurb || "") + "</p></div>" +
            (item.files || []).map(function (f) { return dlButton(f, true); }).join("") + "</div>";
        });
        return;
      }
      if (compact) return;
      html += '<div class="bonus-group"><h3>' + esc(group.title) + ' <small>(' + items.length + ')</small></h3><div class="dl-grid">';
      items.forEach(function (item) {
        html += '<div class="dl-card"><strong>' + esc(item.label) + "</strong><small>" + esc(item.blurb || "") + '</small><div class="dl-files">' +
          (item.files || []).map(function (f) { return dlButton(f, false); }).join("") + "</div></div>";
      });
      html += "</div></div>";
    });
    if (compact) {
      html += '<p><a class="dl-btn dl-ZIP" href="' + esc(fromRoot("downloads.html#downloads-bonus")) + '">' + svg("download") + "<span>See all " + count + " files (" + formatSize(total) + ")</span></a></p>";
    }
    html += "</section>";
    return html;
  }
  function mountBonus(data) {
    if (document.getElementById("downloads-bonus")) return;
    var file = fileName();
    var wrap = document.createElement("div");
    if (file === "downloads.html") {
      wrap.innerHTML = bonusHtml(data, false);
      var grid = document.querySelector(".sheet-grid");
      var node = wrap.firstChild;
      if (grid && grid.parentNode) grid.parentNode.insertBefore(node, grid.nextSibling);
      else {
        var main = document.querySelector("main") || document.body;
        main.appendChild(node);
      }
      return;
    }
    if (file !== "index.html") return;
    wrap.innerHTML = bonusHtml(data, true);
    var footer = document.querySelector(".site-footer");
    var homeNode = wrap.firstChild;
    if (footer && footer.parentNode) footer.parentNode.insertBefore(homeNode, footer);
  }
  function loadBonus() {
    var fallback = { groups: [{ id: "bundle", title: "Offline zip", items: [{ label: "Download everything", blurb: "The whole site, saved for offline reading.", files: [{ kind: "ZIP", href: "downloads/microsoft-voice-university.zip", bytes: 12000000 }] }] }] };
    fetch(fromRoot("assets/data/downloads.json")).then(function (response) {
      if (!response.ok) throw new Error("downloads");
      return response.json();
    }).then(function (data) { mountBonus(data); }).catch(function () { mountBonus(fallback); });
  }

  function mountOrbit(host) {
    if (!host || host.querySelector(".orbit")) return;
    if (window.matchMedia("(max-width: 720px), (pointer: coarse)").matches) return;
    var orbit = document.createElement("div");
    orbit.className = "orbit";
    orbit.setAttribute("aria-hidden", "true");
    orbit.innerHTML = '<div class="orbit-spin">' + TOYS.map(function (toy) {
      return '<span class="toy">' + svg(toy[1]) + "</span>";
    }).join("") + "</div>";
    host.appendChild(orbit);
  }
  function mountGems() {
    document.querySelectorAll("main h2").forEach(function (heading, index) {
      if (heading.querySelector(".head-gem") || heading.closest(".canon-banner, .edge-menu, .site-footer")) return;
      var gem = document.createElement("span");
      gem.className = "head-gem" + (index < 3 && fineMotion() ? " is-live" : "");
      gem.setAttribute("aria-hidden", "true");
      gem.innerHTML = svg(GEMS[index % GEMS.length]);
      heading.insertBefore(gem, heading.firstChild);
    });
  }
  function dockHeight() {
    var dock = document.querySelector(".phone-dock");
    if (!dock) return 0;
    var style = getComputedStyle(dock);
    if (style.display === "none" || style.visibility === "hidden") return 0;
    var rect = dock.getBoundingClientRect();
    if (rect.height < 8 || rect.top > window.innerHeight) return 0;
    return Math.min(rect.height, window.innerHeight);
  }
  function placeGuide() {
    var footer = document.querySelector(".site-footer");
    var base = dockHeight() + 16;
    var lift = base;
    var hide = false;
    if (footer) {
      var rect = footer.getBoundingClientRect();
      if (rect.top < window.innerHeight - base) {
        var needed = window.innerHeight - rect.top + 16;
        if (needed > window.innerHeight * 0.42) hide = true;
        else lift = Math.max(base, needed);
      }
    }
    root.style.setProperty("--guide-bottom", lift + "px");
    root.classList.toggle("guide-clear", hide);
  }
  function ensureMount() {
    if (document.getElementById("guide-mount")) return;
    var mount = document.createElement("div");
    mount.id = "guide-mount";
    mount.className = "guide-mount";
    mount.setAttribute("data-guide-mount", "");
    document.body.appendChild(mount);
  }

  document.addEventListener("click", function (event) {
    var fontBtn = event.target.closest && event.target.closest("[data-font-set]");
    if (fontBtn) applyFont(fontBtn.getAttribute("data-font-set"));
    var themeBtn = event.target.closest && event.target.closest("[data-set-theme]");
    if (themeBtn) applyTheme(themeBtn.getAttribute("data-set-theme"));
    var motionBtn = event.target.closest && event.target.closest("[data-motion-toggle]");
    if (motionBtn) applyMotion(motionBtn.getAttribute("aria-pressed") !== "true");
  });

  ensureMount();
  mountBanner();
  mountA11y();
  mountEdge();
  mountFooter();
  loadBonus();
  mountOrbit(document.querySelector(".world-ui"));
  mountOrbit(document.querySelector(".hero-copy"));
  mountGems();
  placeGuide();
  window.addEventListener("scroll", placeGuide, { passive: true });
  window.addEventListener("resize", placeGuide);
  window.addEventListener("load", placeGuide);
  var guideWatches = 0;
  var guideTimer = setInterval(function () {
    placeGuide();
    guideWatches += 1;
    if (guideWatches > 24) clearInterval(guideTimer);
    else if (guideWatches > 4 && document.querySelector(".phone-dock")) clearInterval(guideTimer);
  }, 120);
  document.addEventListener("university-ready", function () {
    applyFont(root.dataset.font || "md");
    syncThemeButtons(root.dataset.theme || "bloom");
    placeGuide();
  });
})();

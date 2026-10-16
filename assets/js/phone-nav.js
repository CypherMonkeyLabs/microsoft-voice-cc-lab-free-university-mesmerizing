/* Phone menu, quick bar, and the one Settings panel. Relative paths. */
(function () {
  var root = document.documentElement;

  function prefix() {
    var nodes = document.querySelectorAll("script[src]");
    var mark = "assets/js/phone-nav.js";
    for (var i = 0; i < nodes.length; i++) {
      var src = nodes[i].getAttribute("src") || "";
      var at = src.indexOf(mark);
      if (at !== -1) return src.slice(0, at);
    }
    return "";
  }
  var rootPrefix = prefix();
  function href(path) {
    return rootPrefix + path;
  }
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }
  var ICONS = {
    home: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/>',
    rocket: '<path d="M12 19c-4 0-7-3-7-7 4-1 7-4 8-8 4 1 7 4 8 8-4 1-6 4-9 7z"/><path d="M9 15l-2 4 4-2"/><circle cx="14" cy="10" r="1.2"/>',
    rooms: '<path d="M4 6h7v12H4zM13 6h7v5h-7zM13 13h7v5h-7z"/>',
    image: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.4"/><path d="M7 16l3.2-3.2L13 15l2-2 2 3"/>',
    flow: '<path d="M4 7h6M14 7h6M4 12h16M4 17h6M14 17h6"/><circle cx="12" cy="7" r="2"/><circle cx="12" cy="17" r="2"/>',
    sliders: '<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="8" cy="7" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="10" cy="17" r="2"/>',
    cards: '<rect x="3" y="6" width="12" height="14" rx="2"/><rect x="9" y="4" width="12" height="14" rx="2"/>',
    spark: '<path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8z"/>',
    globe: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.4 2.4 3.6 5 3.6 8s-1.2 5.6-3.6 8c-2.4-2.4-3.6-5-3.6-8s1.2-5.6 3.6-8z"/>',
    download: '<path d="M12 4v10M8 10l4 4 4-4M5 19h14"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/>',
    check: '<circle cx="12" cy="12" r="8"/><path d="M8.5 12.2l2.3 2.3 4.7-5"/>',
    book: '<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5z"/><path d="M5 5.5V21"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"/>',
    flask: '<path d="M9 3h6M10 3v6L5.5 18A3 3 0 0 0 8 22h8a3 3 0 0 0 2.5-4L14 9V3"/>',
    wrench: '<path d="M14.5 6.2a4 4 0 0 0-5.6 5.1L4 16.2 7.8 20l4.9-4.9a4 4 0 0 0 5.1-5.6L15 12l-3-3z"/>',
    flag: '<path d="M6 21V4M6 5h11l-2 4 2 4H6"/>',
    map: '<path d="M9 4l-5 2v14l5-2 6 2 5-2V4l-5 2zM9 4v14M15 6v14"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M4.8 7.2l1.9 1.1M17.3 15.7l1.9 1.1M4.8 16.8l1.9-1.1M17.3 8.3l1.9-1.1"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="5" cy="6" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="18" r="1"/>',
    headphones: '<path d="M4 13a8 8 0 0 1 16 0"/><rect x="3" y="13" width="4" height="7" rx="1.5"/><rect x="17" y="13" width="4" height="7" rx="1.5"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"/>',
    github: '<path d="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.2a2.8 2.8 0 0 0-.8-2.2c2.7-.3 5.5-1.3 5.5-6A4.6 4.6 0 0 0 18 6.3 4.3 4.3 0 0 0 17.9 3S16.7 2.7 14 4.5a12 12 0 0 0-6 0C5.3 2.7 4.1 3 4.1 3A4.3 4.3 0 0 0 4 6.3a4.6 4.6 0 0 0-1.3 3.2c0 4.6 2.8 5.6 5.5 6A2.8 2.8 0 0 0 9 18.8V21"/>',
    edit: '<path d="M4 20h4l10-10-4-4L4 16z"/><path d="M13 7l4 4"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>'
  };
  function svg(name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || ICONS.spark) + "</svg>";
  }
  function menuItem(item) {
    var text = (item.label + " " + item.desc).toLowerCase();
    var open = item.button ? "<button" : "<a";
    var close = item.button ? "</button>" : "</a>";
    var attrs = item.button
      ? ' type="button"' + (item.attr || "")
      : ' href="' + esc(item.abs ? item.href : href(item.href)) + '"';
    return open + ' class="menu-item"' + attrs + ' data-menu-text="' + esc(text) + '">' +
      '<span class="menu-ico" aria-hidden="true">' + svg(item.icon) + "</span>" +
      '<span class="menu-copy"><span class="menu-label"' + (item.key ? ' data-i18n="' + item.key + '"' : "") + ">" + esc(item.label) + "</span>" +
      '<span class="menu-desc">' + esc(item.desc) + "</span></span>" + close;
  }
  function motionReduced() {
    if (root.dataset.motion === "reduce") return true;
    if (root.dataset.motion === "full") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function applyMotion(mode) {
    if (mode === "reduce" || mode === "full") {
      root.dataset.motion = mode;
      try { localStorage.setItem("canon-motion", mode); } catch (err) { /* storage off */ }
    } else {
      delete root.dataset.motion;
      try { localStorage.removeItem("canon-motion"); } catch (err) { /* storage off */ }
    }
    root.classList.toggle("v4-motion", !motionReduced());
    document.dispatchEvent(new CustomEvent("canon-motion", { detail: { reduced: motionReduced() } }));
  }

  var view = document.querySelector('meta[name="viewport"]');
  if (view && view.content.indexOf("viewport-fit") === -1) {
    view.setAttribute("content", view.content + ", viewport-fit=cover");
  }

  var SECTIONS = [
    { key: "learn", label: "Home", href: "index.html", icon: "home", desc: "Teams Phone rooms. Read offline. Claims stay cited." },
    { key: "start", label: "Start here", href: "start.html", icon: "rocket", desc: "Tenant, license, then a dial plan." },
    { key: "resources", label: "Help", href: "help.html", icon: "link", desc: "How to use the menu, the course, the bot, and the downloads." },
    { key: "rooms", label: "Rooms", href: "index.html#rooms", icon: "rooms", desc: "Seventeen tracks. Open a written room." },
    { key: "diagrams", label: "Diagrams", href: "diagrams.html", icon: "image", desc: "Diagrams saved as SVG, PNG, and HTML." },
    { key: "flows", label: "Flows", href: "flows.html", icon: "flow", desc: "Animated call paths you can pause in your head." },
    { key: "charts", label: "Charts", href: "charts.html", icon: "sliders", desc: "Counts from this repository. No prices." },
    { key: "cheat", label: "Cheat Codes", href: "downloads.html", icon: "cards", desc: "Sheets, cards, and a zip with the disclaimer." },
    { key: "play", label: "Play", href: "play.html", icon: "spark", desc: "A port game and a routing drill in this browser." },
    { key: "ecosystem", label: "Ecosystem", href: "ecosystem.html", icon: "globe", desc: "Sisters, and bridges to CUCM, Webex, and UCCE." },
    { key: "downloads", label: "Downloads", href: "downloads.html", icon: "download", desc: "Sheets, cards, templates, and the zip." },
    { key: "careers", label: "Careers", href: "careers.html", icon: "mic", desc: "Study paths. Job titles are labels, not open roles." },
    { key: "quizzes", label: "Quizzes", href: "quizzes.html", icon: "check", desc: "Practice checks beside the room quizzes." },
    { key: "cards", label: "Flashcards", href: "flashcards.html", icon: "cards", desc: "Glossary cards. Progress stays in this browser." },
    { key: "glossary", label: "Glossary", href: "glossary.html", icon: "book", desc: "Term, config note, and fault." },
    { key: "labs", label: "Labs", href: "labs.html", icon: "flask", desc: "Browser labs. No sign-in." },
    { key: "cases", label: "Cases", href: "troubleshooting.html", icon: "wrench", desc: "Symptom, cause, and the check." },
    { key: "interviews", label: "Interviews", href: "interviews.html", icon: "mic", desc: "Questions with a source." },
    { key: "regions", label: "Bridges", href: "bridges.html", icon: "flag", desc: "Commercial, GCC High, and DoD are different lists." },
    { key: "mastery", label: "Mastery", href: "start.html", icon: "map", desc: "Fundamentals through Copilot. Unverified stays marked." }
  ];

  var bar = document.querySelector(".topbar .bar-inner");
  var opener = null;
  if (bar && !bar.querySelector(".phone-menu-btn")) {
    opener = document.createElement("button");
    opener.type = "button";
    opener.className = "phone-menu-btn";
    opener.setAttribute("aria-expanded", "false");
    opener.setAttribute("aria-controls", "phone-menu");
    opener.innerHTML = '<span class="phone-burger" aria-hidden="true"></span><span data-i18n="menu">Menu</span>';
    bar.insertBefore(opener, bar.firstChild);
    opener.setAttribute("data-tour", "menu");
  }

  var menu = document.createElement("div");
  menu.id = "phone-menu";
  menu.className = "phone-menu";
  menu.hidden = true;
  menu.setAttribute("role", "dialog");
  menu.setAttribute("aria-modal", "true");
  menu.setAttribute("aria-labelledby", "phone-menu-title");
  var sectionLinks = SECTIONS.map(menuItem).join("");
  var actionLinks = [
    menuItem({ key: "settings", label: "Settings", icon: "gear", desc: "Theme, language, sound, and motion.", button: true, attr: " data-open-settings" }),
    menuItem({ key: "browse", label: "Browse rooms", icon: "list", desc: "Open the track list.", button: true, attr: " data-open-rooms" })
  ].join("");
  var extraLinks = "";
  menu.innerHTML =
    '<div class="phone-menu-bar">' +
    '<p id="phone-menu-title" data-i18n="menu">Menu</p>' +
    '<button type="button" class="phone-menu-close" data-i18n="close">Close</button>' +
    "</div>" +
    '<label class="menu-search"><span class="sr">Search the menu</span>' +
    '<input type="search" data-menu-filter placeholder="Search the menu" aria-label="Search the menu" autocomplete="off">' +
    "</label>" +
    '<p class="menu-empty" hidden>No menu pages match.</p>' +
    '<nav class="phone-menu-list" aria-label="University">' + sectionLinks + actionLinks + "</nav>" +
    '<div data-about-mount></div>';
  document.body.appendChild(menu);

  document.querySelectorAll(".uni-menu").forEach(function (nav) {
    if (nav.querySelector("[data-open-settings]")) return;
    var button = document.createElement("button");
    button.type = "button";
    button.className = "uni-settings";
    button.setAttribute("data-open-settings", "");
    button.textContent = "Settings";
    nav.appendChild(button);
  });
  document.querySelectorAll(".uni-menu a[data-i18n]").forEach(function (anchor) {
    var key = anchor.getAttribute("data-i18n");
    var section = null;
    SECTIONS.forEach(function (item) { if (item.key === key) section = item; });
    if (!section) return;
    var label = anchor.textContent;
    anchor.removeAttribute("data-i18n");
    anchor.classList.add("menu-pill");
    anchor.innerHTML = '<span class="menu-ico" aria-hidden="true">' + svg(section.icon) + '</span><span class="menu-copy"><span class="menu-label" data-i18n="' + key + '">' + esc(label) + '</span><span class="menu-desc">' + esc(section.desc) + "</span></span>";
  });
  document.querySelectorAll(".uni-menu .uni-settings").forEach(function (button) {
    button.removeAttribute("data-i18n");
    button.classList.add("menu-pill");
    button.innerHTML = '<span class="menu-ico" aria-hidden="true">' + svg("gear") + '</span><span class="menu-copy"><span class="menu-label" data-i18n="settings">Settings</span><span class="menu-desc">Theme, language, sound, and motion.</span></span>';
  });

  var dock = document.createElement("nav");
  dock.className = "phone-dock";
  dock.setAttribute("aria-label", "Quick");
  function dockItem(item) {
    var open = item.button ? "<button" : "<a";
    var close = item.button ? "</button>" : "</a>";
    var attrs = item.button ? ' type="button"' + (item.attr || "") : ' href="' + esc(href(item.href)) + '"' + (item.attr || "");
    return open + ' class="dock-item"' + attrs + '><span class="menu-ico" aria-hidden="true">' + svg(item.icon) + '</span><span class="dock-label" data-i18n="' + item.key + '">' + esc(item.label) + "</span>" + close;
  }
  dock.innerHTML =
    dockItem({ key: "menu", label: "Menu", icon: "menu", button: true, attr: " data-open-menu data-tour=\"menu-dock\"" }) +
    dockItem({ key: "learn", label: "Learn", href: "start.html", icon: "home", attr: " data-tour=\"learn\"" }) +
    dockItem({ key: "diagrams", label: "Diagrams", href: "diagrams.html", icon: "image", attr: " data-tour=\"diagrams\"" }) +
    dockItem({ key: "play", label: "Play", href: "play.html", icon: "spark", attr: " data-tour=\"play\"" }) +
    dockItem({ key: "listen", label: "Listen", icon: "headphones", button: true, attr: " data-listen data-tour=\"listen\"" }) +
    dockItem({ key: "guide", label: "Guide", icon: "spark", button: true, attr: " data-open-guide data-tour=\"bot\"" });
  document.body.appendChild(dock);

  var settings = document.createElement("div");
  settings.className = "settings-panel";
  settings.hidden = true;
  settings.setAttribute("role", "dialog");
  settings.setAttribute("aria-modal", "true");
  settings.setAttribute("aria-labelledby", "settings-title");
  settings.innerHTML =
    '<div class="settings-card">' +
    '<div class="settings-bar"><h2 id="settings-title" data-i18n="settings">Settings</h2>' +
    '<button type="button" class="settings-close" data-i18n="close">Close</button></div>' +
    '<fieldset class="settings-themes"><legend data-i18n="themeWord">Theme</legend>' +
    '<button type="button" data-set-theme="bloom">Bloom</button>' +
    '<button type="button" data-set-theme="aurora">Aurora</button>' +
    '<button type="button" data-set-theme="neon">Neon</button>' +
    '<button type="button" data-set-theme="holographic">Holographic</button>' +
    '<button type="button" data-set-theme="cyberpunk">Cyberpunk</button>' +
    '<button type="button" data-set-theme="sunset">Sunset</button>' +
    '<button type="button" data-set-theme="paper">Light</button>' +
    '<button type="button" data-set-theme="contrast">Contrast</button>' +
    "</fieldset>" +
    '<div class="a11y-font" role="group" aria-label="Font size">' +
    '<button type="button" data-font-set="sm" aria-label="Smaller text">A−</button>' +
    '<button type="button" data-font-set="md" aria-label="Default text">A</button>' +
    '<button type="button" data-font-set="lg" aria-label="Larger text">A+</button>' +
    "</div>" +
    '<label class="settings-lang"><span data-i18n="langName">Language</span> <select data-lang aria-label="Language"></select></label>' +
    '<fieldset data-settings-sound><legend data-i18n="sound">Sound</legend>' +
    '<button type="button" data-listen data-i18n="listen">Listen</button>' +
    '<button type="button" data-mute data-i18n="mute">Mute</button>' +
    '<button type="button" data-rate="0.85">0.85×</button>' +
    '<button type="button" data-rate="1">1×</button>' +
    '<button type="button" data-rate="1.15">1.15×</button>' +
    "</fieldset>" +
    '<label class="settings-ink">Font colour <input type="color" data-ink value="#102033" aria-label="Font colour"></label>' +
    '<label class="settings-motion"><input type="checkbox" data-reduce-motion> <span data-i18n="reduceMotion">Reduce motion</span></label>' +
    "</div>";
  document.body.appendChild(settings);

  var pushed = false;
  var lastFocus = null;

  function focusables(rootNode) {
    return Array.prototype.slice.call(rootNode.querySelectorAll("a[href], button, input, select, textarea")).filter(function (el) {
      return !el.disabled && !el.closest("[hidden]");
    });
  }
  function fileName() {
    var path = location.pathname.split("/").pop() || "index.html";
    return path || "index.html";
  }
  function markCurrent() {
    var file = fileName();
    var hash = location.hash;
    document.querySelectorAll(".phone-menu a, .phone-dock a, .uni-menu a").forEach(function (link) {
      var url;
      try { url = new URL(link.getAttribute("href"), location.href); } catch (err) { return; }
      if (url.origin !== location.origin) {
        link.classList.remove("is-current");
        link.removeAttribute("aria-current");
        return;
      }
      var target = url.pathname.split("/").pop() || "index.html";
      var on = target === file;
      if (on && target === "index.html") {
        if (url.hash === "#rooms") on = hash === "#rooms";
        else on = hash !== "#rooms";
      } else if (on && url.hash) {
        on = url.hash === hash;
      }
      link.classList.toggle("is-current", on);
      if (on) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }
  function openMenu(from) {
    if (!menu.hidden) return;
    lastFocus = from || document.activeElement;
    menu.hidden = false;
    document.body.classList.add("phone-menu-open");
    if (opener) opener.setAttribute("aria-expanded", "true");
    var closeBtn = menu.querySelector(".phone-menu-close");
    if (closeBtn) closeBtn.focus();
    if (!pushed) {
      history.pushState({ phoneMenu: 1 }, "");
      pushed = true;
    }
  }
  function closeMenu(fromPop) {
    if (menu.hidden) return;
    menu.hidden = true;
    document.body.classList.remove("phone-menu-open");
    if (opener) opener.setAttribute("aria-expanded", "false");
    if (!fromPop && pushed) {
      pushed = false;
      history.back();
    } else {
      pushed = false;
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function openSettings(from) {
    lastFocus = from || document.activeElement;
    settings.hidden = false;
    document.body.classList.add("settings-open");
    var closeBtn = settings.querySelector(".settings-close");
    if (closeBtn) closeBtn.focus();
  }
  function closeSettings() {
    if (settings.hidden) return;
    settings.hidden = true;
    document.body.classList.remove("settings-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function trap(event, panel, closer) {
    if (event.key === "Escape") {
      event.preventDefault();
      closer();
      return;
    }
    if (event.key !== "Tab") return;
    var items = focusables(panel);
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (opener) opener.addEventListener("click", function () { openMenu(opener); });
  dock.querySelector("[data-open-menu]").addEventListener("click", function (event) { openMenu(event.currentTarget); });
  menu.querySelector(".phone-menu-close").addEventListener("click", function () { closeMenu(false); });
  menu.addEventListener("keydown", function (event) {
    if (!settings.hidden) return;
    trap(event, menu, function () { closeMenu(false); });
  });
  settings.addEventListener("keydown", function (event) { trap(event, settings, closeSettings); });
  settings.querySelector(".settings-close").addEventListener("click", closeSettings);
  settings.addEventListener("click", function (event) { if (event.target === settings) closeSettings(); });
  document.querySelectorAll("[data-open-settings]").forEach(function (btn) {
    btn.addEventListener("click", function () { openSettings(btn); });
  });
  menu.querySelector("[data-open-rooms]").addEventListener("click", function () {
    closeMenu(false);
    root.dataset.drawer = "open";
    document.body.classList.add("drawer-open");
  });
  window.addEventListener("popstate", function () {
    if (!menu.hidden) closeMenu(true);
  });
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (!settings.hidden) closeSettings();
    else if (!menu.hidden) closeMenu(false);
  });

  function audioEl() {
    return document.querySelector("[data-audio]");
  }
  function ensureAudio() {
    var audio = audioEl();
    if (audio) return audio;
    audio = document.createElement("audio");
    audio.setAttribute("data-audio", "");
    audio.preload = "none";
    audio.setAttribute("controls", "");
    settings.querySelector("[data-settings-sound]").appendChild(audio);
    return audio;
  }
  function arm(audio) {
    if (!audio.getAttribute("src")) audio.src = rootPrefix + "audio/how-to-use.mp3";
    audio.preload = "none";
  }
  function listen(button) {
    document.dispatchEvent(new CustomEvent("mvcc-listen"));
    var pressed = button && button.getAttribute("aria-pressed") === "true";
    document.querySelectorAll("[data-listen]").forEach(function (el) {
      el.setAttribute("aria-pressed", pressed ? "false" : "true");
    });
  }
  document.querySelectorAll("[data-listen]").forEach(function (btn) {
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", function () { listen(btn); });
  });
  settings.querySelector("[data-mute]").addEventListener("click", function (event) {
    var audio = ensureAudio();
    audio.muted = !audio.muted;
    event.currentTarget.setAttribute("aria-pressed", audio.muted ? "true" : "false");
  });
  settings.querySelectorAll("[data-rate]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var audio = ensureAudio();
      arm(audio);
      audio.playbackRate = Number(btn.getAttribute("data-rate")) || 1;
    });
  });

  var motionBox = settings.querySelector("[data-reduce-motion]");
  motionBox.checked = motionReduced();
  motionBox.addEventListener("change", function () {
    applyMotion(motionBox.checked ? "reduce" : "full");
  });

  settings.querySelectorAll("[data-set-theme]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var theme = btn.getAttribute("data-set-theme");
      root.dataset.theme = theme;
      try { localStorage.setItem("canon-theme", theme); } catch (err) { /* storage off */ }
      document.querySelectorAll("[data-set-theme]").forEach(function (peer) {
        peer.setAttribute("aria-checked", peer.getAttribute("data-set-theme") === theme ? "true" : "false");
      });
      document.dispatchEvent(new CustomEvent("canon-theme", { detail: { theme: theme } }));
    });
  });

  var menuFilter = menu.querySelector("[data-menu-filter]");
  var menuEmpty = menu.querySelector(".menu-empty");
  if (menuFilter) {
    menuFilter.addEventListener("input", function () {
      var query = menuFilter.value.trim().toLowerCase();
      var shown = 0;
      menu.querySelectorAll(".menu-item").forEach(function (item) {
        var hay = item.getAttribute("data-menu-text") || "";
        var match = !query || hay.indexOf(query) !== -1;
        item.hidden = !match;
        if (match) shown += 1;
      });
      if (menuEmpty) menuEmpty.hidden = shown !== 0;
    });
  }

  markCurrent();
  window.addEventListener("hashchange", markCurrent);
})();

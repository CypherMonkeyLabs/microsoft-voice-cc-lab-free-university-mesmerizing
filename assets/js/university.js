/* University chrome for every Canon page. Relative paths. No network required to read. */
(function () {
  var root = document.documentElement;
  var reduce = root.dataset.motion === "reduce" || (root.dataset.motion !== "full" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function prefix() {
    var nodes = document.querySelectorAll("script[src]");
    var mark = "assets/js/university.js";
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

  var LABS = [
    ["UC Lab", "https://cyphermonkeylabs.com/uc-lab-free-university-mesmerizing/"],
    ["AI Lab", "https://cyphermonkeylabs.com/ai-lab-free-university-mesmerizing/"],
    ["SIP Universe", "https://cyphermonkeylabs.com/sip-universe-lab-free-university-mesmerizing/"],
    ["Microsoft Voice", "https://cyphermonkeylabs.com/microsoft-voice-cc-lab-free-university-mesmerizing/"],
    ["Amazon Connect", "https://cyphermonkeylabs.com/amazon-connect-lab-free-university-mesmerizing/"],
    ["Genesys Cloud", "https://cyphermonkeylabs.com/genesys-cloud-lab-free-university-mesmerizing/"],
    ["Five9", "https://cyphermonkeylabs.com/five9-lab-free-university-mesmerizing/"],
    ["NICE CXone", "https://cyphermonkeylabs.com/nice-cxone-lab-free-university-mesmerizing/"]
  ];
  var CONTACT = "https://cyphermonkeylabs.com/#contact";
  var REPO = "https://github.com/CypherMonkeyLabs/microsoft-voice-cc-lab-free-university-mesmerizing";
  function socialLinksHtml() { return ""; }
  window.CANON_SOCIAL_HTML = socialLinksHtml();

  function footerHtml() {
    var labs = LABS.map(function (lab) {
      return '<a href="' + lab[1] + '">' + lab[0] + "<small>Next lab</small></a>";
    }).join("");
    return (
      '<p class="footer-disclaimer">This is an independent, free, learning-only project by a student. It respects every company and vendor. Trademarks belong to their owners. It is not affiliated or endorsed. If anyone has a concern, content will be removed or corrected promptly via the contact form at <a href="' + CONTACT + '">' + CONTACT + '</a>. Nothing here is sold, and there are no ads. Happy to volunteer for any organization.</p>' +
      '<p>MIT code. CC BY-NC-SA content. <a href="' + CONTACT + '">Report a concern</a>.</p>' +
      '<p class="site-copy">© 2026 CypherMonkeyLabs 🐒</p>' +
      '<div class="float-badges" data-float-badges></div>' +
      '<nav class="next-labs" aria-label="Other labs">' + labs + "</nav>"
    );
  }
  var foot = document.querySelector(".site-footer");
  if (foot && foot.hasAttribute("data-canon-footer")) {
    /* baked into every page by scripts/polish_html.py */
  } else if (foot) {
    foot.classList.add("lab-footer");
    foot.innerHTML = footerHtml();
  } else {
    var main = document.querySelector("main") || document.body;
    var extra = document.createElement("footer");
    extra.className = "site-footer lab-footer wrap";
    extra.innerHTML = footerHtml();
    main.appendChild(extra);
  }
  function badges() {
    try { return JSON.parse(localStorage.getItem("canon-badges") || "{}"); }
    catch (err) { return {}; }
  }
  function award(id) {
    var bag = badges();
    if (bag[id]) return false;
    bag[id] = new Date().toISOString();
    try { localStorage.setItem("canon-badges", JSON.stringify(bag)); } catch (err) { /* storage off */ }
    document.dispatchEvent(new CustomEvent("canon-badge", { detail: id }));
    return true;
  }
  window.CANON_UNIVERSITY = { fromRoot: fromRoot, award: award, badges: badges, contact: CONTACT, repo: REPO };

  try {
    var progress = JSON.parse(localStorage.getItem("canon-progress") || "{}");
    var opened = progress && progress.rooms ? Object.keys(progress.rooms).length : 0;
    if (opened >= 1) award("first-room");
    if (opened >= 10) award("ten-rooms");
    if (opened >= 63) award("all-rooms");
  } catch (err) { /* ignore */ }

  var konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  var konamiAt = 0;
  document.addEventListener("keydown", function (event) {
    var key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key === konami[konamiAt]) {
      konamiAt += 1;
      if (konamiAt === konami.length) {
        konamiAt = 0;
        award("konami");
        var layer = document.createElement("div");
        layer.className = "egg-layer";
        layer.innerHTML = '<div class="egg-card" role="dialog" aria-label="Banana trunk"><p>Banana trunk unlocked.</p><p>CypherMonkey saved a badge in this browser. The keypad does not change a tenant.</p><button type="button" class="ghost">Close</button></div>';
        document.body.appendChild(layer);
        layer.querySelector("button").addEventListener("click", function () { layer.remove(); });
        layer.addEventListener("click", function (ev) { if (ev.target === layer) layer.remove(); });
      }
    } else {
      konamiAt = key === konami[0] ? 1 : 0;
    }
  });

  function cacheUrls(urls) {
    if (!("caches" in window)) return Promise.reject(new Error("Cache Storage is unavailable"));
    return caches.open("mvcc-university-v1").then(function (cache) {
      return Promise.all(urls.map(function (url) {
        return fetch(url).then(function (response) {
          if (response && response.ok) return cache.put(url, response);
          return null;
        }).catch(function () { return null; });
      }));
    });
  }
  document.querySelectorAll("[data-offline-save]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      btn.disabled = true;
      var label = btn.textContent;
      btn.textContent = "Saving…";
      var manifest = fromRoot("downloads/cache-manifest.json");
      fetch(manifest).then(function (response) { return response.json(); }).then(function (list) {
        var urls = (list || []).map(function (item) { return fromRoot(item); });
        return cacheUrls(urls);
      }).then(function () {
        award("offline");
        btn.textContent = "Saved in this browser";
      }).catch(function () {
        btn.disabled = false;
        btn.textContent = label;
      });
    });
  });

  var MENU = [
    ["Diagrams", "diagrams.html"],
    ["Flows", "flows.html"],
    ["Charts", "charts.html"],
    ["Cheat Codes", "downloads.html"],
    ["Play", "play.html"],
    ["Ecosystem", "ecosystem.html"],
    ["Downloads", "downloads.html"],
    ["Careers", "careers.html"]
  ];
  if (!document.querySelector(".uni-menu")) {
    var menu = document.createElement("nav");
    menu.className = "uni-menu";
    menu.setAttribute("aria-label", "University");
    menu.innerHTML = MENU.map(function (item) {
      return '<a href="' + fromRoot(item[1]) + '">' + item[0] + "</a>";
    }).join("");
    var header = document.querySelector(".topbar .bar-inner") || document.querySelector(".topbar");
    if (header) header.appendChild(menu);
  }
  document.querySelectorAll(".uni-menu").forEach(function (menu) {
    var links = Array.prototype.slice.call(menu.querySelectorAll("a"));
    links.forEach(function (link, index) {
      link.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = links[(index + 1) % links.length];
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = links[(index - 1 + links.length) % links.length];
        if (event.key === "Home") next = links[0];
        if (event.key === "End") next = links[links.length - 1];
        if (!next) return;
        event.preventDefault();
        next.focus();
      });
    });
  });
  document.querySelectorAll("[data-set-theme]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var theme = btn.getAttribute("data-set-theme");
      document.documentElement.dataset.theme = theme;
      try { localStorage.setItem("canon-theme", theme); } catch (err) { /* storage off */ }
      document.querySelectorAll("[data-set-theme]").forEach(function (peer) {
        peer.setAttribute("aria-checked", peer.getAttribute("data-set-theme") === theme ? "true" : "false");
      });
      document.dispatchEvent(new CustomEvent("canon-theme", { detail: { theme: theme } }));
    });
  });
  var spark = document.querySelector(".track-spark, .uni-fold");
  if (spark && !reduce) {
    window.addEventListener("scroll", function () {
      var y = window.scrollY || 0;
      spark.querySelectorAll("[data-depth]").forEach(function (layer) {
        var depth = Number(layer.getAttribute("data-depth")) || 0.3;
        layer.style.transform = "translateY(" + (y * depth * 0.08).toFixed(1) + "px)";
      });
    }, { passive: true });
  }
  function later(fn) {
    if ("requestIdleCallback" in window) window.requestIdleCallback(fn, { timeout: 1500 });
    else window.setTimeout(fn, 250);
  }
  function motionReduced() {
    if (root.dataset.motion === "reduce") return true;
    if (root.dataset.motion === "full") return false;
    return reduce;
  }
  later(function () {
    var confettiScript = document.createElement("script");
    confettiScript.src = fromRoot("vendor/confetti.browser.js");
    confettiScript.async = true;
    document.body.appendChild(confettiScript);
  });
  document.addEventListener("canon-badge", function () {
    if (reduce || typeof window.confetti !== "function") return;
    window.confetti({ particleCount: 70, spread: 64, origin: { y: 0.75 } });
  });

  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    navigator.serviceWorker.register(fromRoot("sw.js")).catch(function () { /* pages still work */ });
  }

  if (!document.body.classList.contains("home-world")) {
    document.body.classList.add("canon-world");
    var mainEl = document.querySelector("main");
    if (mainEl && !document.querySelector(".stage-banner")) {
      var banner = document.createElement("div");
      banner.className = "stage-banner";
      banner.setAttribute("aria-hidden", "true");
      banner.innerHTML = '<div class="stage-grid"></div><div class="stage-orb"></div><p class="stage-kicker">Teams Phone · in color</p>';
      mainEl.parentNode.insertBefore(banner, mainEl);
    }
  }

  if (!document.querySelector('link[href*="assets/css/wow.css"]')) {
    var wowCss = document.createElement("link");
    wowCss.rel = "stylesheet";
    wowCss.href = rootPrefix + "assets/css/wow.css";
    document.head.appendChild(wowCss);
  }
  var phone = window.matchMedia("(max-width: 720px), (pointer: coarse)").matches;
  if (!document.getElementById("guide-mount")) {
    var guideMount = document.createElement("div");
    guideMount.id = "guide-mount";
    guideMount.className = "guide-mount";
    guideMount.setAttribute("data-guide-mount", "");
    document.body.appendChild(guideMount);
  }
  if (!document.querySelector('link[href*="assets/css/frame.css"]')) {
    var frameCss = document.createElement("link");
    frameCss.rel = "stylesheet";
    frameCss.href = rootPrefix + "assets/css/frame.css";
    document.head.appendChild(frameCss);
  }
  var frameJs = document.createElement("script");
  frameJs.src = rootPrefix + "assets/js/frame.js";
  frameJs.async = false;
  document.body.appendChild(frameJs);
  var phoneJs = document.createElement("script");
  phoneJs.src = rootPrefix + "assets/js/phone-nav.js";
  phoneJs.async = false;
  document.body.appendChild(phoneJs);
  var wowJs = document.createElement("script");
  wowJs.src = rootPrefix + "assets/js/wow.js";
  wowJs.async = false;
  document.body.appendChild(wowJs);
  var guideJs = document.createElement("script");
  guideJs.src = rootPrefix + "assets/js/round2-bot.js";
  document.body.appendChild(guideJs);
  if (!document.querySelector('link[href*="assets/css/round3.css"]')) {
    var round3Css = document.createElement("link");
    round3Css.rel = "stylesheet";
    round3Css.href = rootPrefix + "assets/css/round3.css";
    document.head.appendChild(round3Css);
  }
  var round3Js = document.createElement("script");
  round3Js.src = rootPrefix + "assets/js/round3.js";
  document.body.appendChild(round3Js);
  var sourcesJs = document.createElement("script");
  sourcesJs.src = rootPrefix + "assets/js/sources-block.js";
  document.body.appendChild(sourcesJs);

  document.dispatchEvent(new CustomEvent("university-ready"));
})();

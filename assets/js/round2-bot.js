/* Round-2 guide: tour, glowing monkey, read-along, voice input.
   Answers come from assets/data/guide-index.json. No cloud endpoint. */
(function () {
  var root = document.documentElement;
  var STORE = "mvcc-round2";

  function prefix() {
    var nodes = document.querySelectorAll("script[src]");
    var mark = "assets/js/round2-bot.js";
    for (var i = 0; i < nodes.length; i++) {
      var src = nodes[i].getAttribute("src") || "";
      var at = src.indexOf(mark);
      if (at !== -1) return src.slice(0, at);
    }
    return "";
  }
  var rootPrefix = prefix();
  function fromRoot(href) {
    if (!href || /^(https?:|#)/.test(href)) return href || "";
    return rootPrefix + String(href).replace(/^\//, "");
  }
  function loadBag() {
    try { return JSON.parse(localStorage.getItem(STORE) || "{}"); }
    catch (err) { return {}; }
  }
  function saveBag(bag) {
    try { localStorage.setItem(STORE, JSON.stringify(bag)); } catch (err) { /* storage off */ }
  }
  function reduceMotion() {
    return root.dataset.motion === "reduce" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function shot() {
    return new URLSearchParams(location.search).get("shot") || "";
  }

  var index = { pages: [], rooms: [] };
  fetch(fromRoot("assets/data/guide-index.json")).then(function (r) { return r.json(); }).then(function (data) {
    if (data) index = data;
  }).catch(function () { /* typed questions still work */ });

  /* Banner arrows */
  document.querySelectorAll("[data-rail]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var rail = document.querySelector(".section-rail");
      if (!rail) return;
      rail.scrollBy({ left: Number(btn.getAttribute("data-rail")) * 220, behavior: reduceMotion() ? "auto" : "smooth" });
    });
  });

  /* Font colour */
  document.addEventListener("input", function (event) {
    var input = event.target.closest && event.target.closest("[data-ink]");
    if (!input) return;
    root.style.setProperty("--ink", input.value);
    try { localStorage.setItem("canon-ink", input.value); } catch (err) { /* storage off */ }
  });
  function ensureInkControl() {
    if (document.querySelector("[data-ink]")) return;
    var panel = document.querySelector(".display-panel");
    if (!panel) return;
    var label = document.createElement("label");
    label.className = "settings-ink";
    label.innerHTML = 'Font colour <input type="color" data-ink value="#102033" aria-label="Font colour">';
    panel.appendChild(label);
  }

  /* Outside click closes the drawer */
  document.addEventListener("pointerdown", function (event) {
    var menu = document.getElementById("phone-menu");
    if (!menu || menu.hidden) return;
    if (menu.contains(event.target)) return;
    if (event.target.closest && event.target.closest(".phone-menu-btn, [data-open-menu]")) return;
    var closeBtn = menu.querySelector(".phone-menu-close");
    if (closeBtn) closeBtn.click();
  });

  /* Quiz */
  document.addEventListener("click", function (event) {
    var choice = event.target.closest && event.target.closest("[data-choice]");
    if (!choice) return;
    var card = choice.closest("[data-quiz]");
    if (!card) return;
    var answer = String(card.getAttribute("data-answer"));
    card.querySelectorAll("[data-choice]").forEach(function (btn) {
      btn.classList.toggle("is-right", btn.getAttribute("data-choice") === answer);
      btn.classList.toggle("is-wrong", btn === choice && btn.getAttribute("data-choice") !== answer);
    });
    var note = card.querySelector(".quiz-why");
    if (note) note.hidden = false;
  });

  /* Tour */
  var TOUR = [
    { sel: ".brand, a.section-chip[href$='index.html']", title: "1. Home", text: "Home is the front door. The track list, then a room." },
    { sel: "[data-tour='menu']", title: "2. Menu", text: "Menu opens the drawer. Each row is an icon, a name, and one line. Esc closes it." },
    { sel: "[data-tour='learn'], a[href$='start.html']", title: "3. Learn", text: "Learn opens the study path: tenant, license, dial plan, then contact center." },
    { sel: "[data-tour='diagrams'], a[href*='diagrams.html']", title: "4. Diagrams", text: "Diagrams are drawings. Every one has a download button." },
    { sel: "[data-tour='play'], a[href*='play.html']", title: "5. Play", text: "Play is a port game and a routing drill. Scores stay in this browser." },
    { sel: "[data-tour='listen']", title: "6. Listen", text: "Listen reads this page aloud and highlights the sentence. Downloads sit on every section. The monkey is next." }
  ];
  var tourLayer = document.createElement("div");
  tourLayer.className = "tour-layer";
  tourLayer.hidden = true;
  tourLayer.innerHTML = '<div class="tour-spot"></div><div class="tour-card" role="dialog" aria-modal="true" aria-label="Tour"><p class="tour-kicker"></p><h2 class="tour-title"></h2><p class="tour-copy"></p><div class="tour-dots" aria-hidden="true"></div><div class="tour-actions"><button type="button" data-tour-back>Back</button><button type="button" class="primary" data-tour-next>Next</button><button type="button" data-tour-skip>Skip</button></div></div>';
  document.body.appendChild(tourLayer);
  var tourAt = 0;
  function shownBox(node) {
    var style = getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") return null;
    var rect = node.getBoundingClientRect();
    if (rect.width <= 28 || rect.height <= 18) return null;
    var visibleW = Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0);
    var visibleH = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
    if (visibleW < 28 || visibleH < 18) return null;
    return rect;
  }
  function visible(sel) {
    var nodes = document.querySelectorAll(sel);
    var phone = window.matchMedia("(max-width: 720px)").matches;
    var first = null;
    var brand = null;
    var dock = null;
    for (var i = 0; i < nodes.length; i++) {
      var rect = shownBox(nodes[i]);
      if (!rect) continue;
      if (!first) first = nodes[i];
      if (nodes[i].classList && nodes[i].classList.contains("brand") && rect.width > 72) brand = nodes[i];
      if (phone && nodes[i].closest && nodes[i].closest(".phone-dock")) dock = nodes[i];
    }
    if (brand) return brand;
    if (dock) return dock;
    return first;
  }
  function placeTour() {
    var step = TOUR[tourAt];
    var node = visible(step.sel);
    var spot = tourLayer.querySelector(".tour-spot");
    var card = tourLayer.querySelector(".tour-card");
    tourLayer.querySelector(".tour-kicker").textContent = "Step " + (tourAt + 1) + " of " + TOUR.length;
    tourLayer.querySelector(".tour-title").textContent = step.title;
    tourLayer.querySelector(".tour-copy").textContent = step.text;
    var dots = "";
    for (var d = 0; d < TOUR.length; d++) {
      dots += '<span class="tour-dot' + (d === tourAt ? " is-on" : "") + '"></span>';
    }
    tourLayer.querySelector(".tour-dots").innerHTML = dots;
    var rect = node ? node.getBoundingClientRect() : { top: 80, left: 16, width: 48, height: 48, right: 64, bottom: 128 };
    var dockNav = node && node.closest ? node.closest(".phone-dock") : null;
    if (dockNav) {
      var dockRect = dockNav.getBoundingClientRect();
      var cellLeft = Math.max(dockRect.left + 2, Math.min(rect.left, dockRect.right - 36));
      var cellWidth = Math.max(36, Math.min(rect.width, dockRect.right - cellLeft - 2));
      rect = { left: cellLeft, top: dockRect.top + 2, width: cellWidth, height: Math.max(36, dockRect.height - 4), right: cellLeft + cellWidth, bottom: dockRect.bottom - 2 };
    }
    var pad = 8;
    var spotLeft = Math.max(pad, rect.left - 6);
    var spotTop = Math.max(pad, rect.top - 6);
    spot.style.left = spotLeft + "px";
    spot.style.top = spotTop + "px";
    spot.style.width = Math.max(28, Math.min(rect.width + 12, window.innerWidth - spotLeft - pad)) + "px";
    spot.style.height = Math.max(28, rect.height + 12) + "px";
    var margin = 12;
    var phone = window.matchMedia("(max-width: 720px)").matches;
    var bottomReserve = phone ? 108 : 20;
    var maxW = Math.max(200, Math.min(380, window.innerWidth - margin * 2));
    card.style.width = maxW + "px";
    card.style.maxWidth = maxW + "px";
    var cardW = card.offsetWidth || maxW;
    var cardH = card.offsetHeight || 200;
    var left = rect.left;
    if (left + cardW > window.innerWidth - margin) left = window.innerWidth - margin - cardW;
    if (left < margin) left = margin;
    var top = rect.bottom + 14;
    var maxTop = window.innerHeight - bottomReserve - cardH;
    if (top > maxTop) top = rect.top - cardH - 14;
    if (top < margin) top = margin;
    if (top > maxTop) top = Math.max(margin, maxTop);
    card.style.left = left + "px";
    card.style.top = top + "px";
    var box = card.getBoundingClientRect();
    if (box.right > window.innerWidth - margin) card.style.left = Math.max(margin, window.innerWidth - margin - box.width) + "px";
    if (box.left < margin) card.style.left = margin + "px";
    box = card.getBoundingClientRect();
    if (box.bottom > window.innerHeight - margin) card.style.top = Math.max(margin, window.innerHeight - margin - box.height) + "px";
    box = card.getBoundingClientRect();
    var spotBox = spot.getBoundingClientRect();
    function hits(a, b) {
      return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    }
    var overlaps = hits(box, spotBox);
    if (overlaps) {
      var above = spotBox.top - 14 - box.height;
      if (above >= margin) card.style.top = above + "px";
      else card.style.top = Math.min(spotBox.bottom + 14, Math.max(margin, window.innerHeight - margin - box.height)) + "px";
    }
    var heads = document.querySelectorAll("h1");
    var head = null;
    for (var h = 0; h < heads.length; h++) {
      var headRect = shownBox(heads[h]);
      if (headRect) { head = headRect; break; }
    }
    if (head) {
      box = card.getBoundingClientRect();
      if (hits(box, head)) {
        var under = head.bottom + 16;
        var floor = window.innerHeight - bottomReserve - box.height;
        if (under <= floor) card.style.top = under + "px";
        else {
          var over = head.top - 16 - box.height;
          card.style.top = (over >= margin ? over : under) + "px";
        }
        box = card.getBoundingClientRect();
        if (hits(box, head)) card.style.top = (head.bottom + 16) + "px";
      }
    }
    tourLayer.querySelector("[data-tour-back]").disabled = tourAt === 0;
    tourLayer.querySelector("[data-tour-next]").textContent = tourAt === TOUR.length - 1 ? "Finish" : "Next";
  }
  function endTour() {
    tourLayer.hidden = true;
    var bag = loadBag();
    bag.tour = 1;
    saveBag(bag);
    greetOnce();
  }
  function startTour() {
    tourAt = 0;
    tourLayer.hidden = false;
    placeTour();
  }
  tourLayer.querySelector("[data-tour-next]").addEventListener("click", function () {
    if (tourAt >= TOUR.length - 1) endTour();
    else { tourAt += 1; placeTour(); }
  });
  tourLayer.querySelector("[data-tour-back]").addEventListener("click", function () {
    if (tourAt > 0) { tourAt -= 1; placeTour(); }
  });
  tourLayer.querySelector("[data-tour-skip]").addEventListener("click", endTour);
  document.addEventListener("click", function (event) {
    if (event.target.closest && event.target.closest("[data-reopen-tour]")) startTour();
  });

  /* Layered monkey: face, ears, eyes. Crisp shapes, no blur orb. */
  function monkeySvg(id) {
    return '<svg class="monkey-svg" viewBox="0 0 160 180" role="img" aria-label="CypherMonkey guide">' +
      '<defs>' +
      '<linearGradient id="fur' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset=".4" stop-color="#f59e0b"/><stop offset="1" stop-color="#c2410c"/></linearGradient>' +
      '<linearGradient id="face' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff7ed"/><stop offset="1" stop-color="#fdba74"/></linearGradient>' +
      '<linearGradient id="ear' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fb7185"/><stop offset="1" stop-color="#be123c"/></linearGradient>' +
      '<linearGradient id="glass' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#a78bfa"/></linearGradient>' +
      '</defs>' +
      '<ellipse cx="80" cy="96" rx="72" ry="80" fill="none" stroke="#fde047" stroke-width="5"/>' +
      '<ellipse cx="80" cy="96" rx="66" ry="74" fill="none" stroke="#22d3ee" stroke-width="2.5"/>' +
      '<circle cx="26" cy="64" r="24" fill="url(#fur' + id + ')" stroke="#7c2d12" stroke-width="2.5"/>' +
      '<circle cx="134" cy="64" r="24" fill="url(#fur' + id + ')" stroke="#7c2d12" stroke-width="2.5"/>' +
      '<circle cx="26" cy="64" r="13" fill="url(#ear' + id + ')"/>' +
      '<circle cx="134" cy="64" r="13" fill="url(#ear' + id + ')"/>' +
      '<ellipse cx="80" cy="152" rx="38" ry="22" fill="url(#fur' + id + ')" stroke="#7c2d12" stroke-width="2"/>' +
      '<path class="arm-l" d="M46 132 q-26 8 -16 30" fill="none" stroke="#f59e0b" stroke-width="14" stroke-linecap="round"/>' +
      '<path class="arm-r" d="M114 128 q28 -10 20 28" fill="none" stroke="#f59e0b" stroke-width="14" stroke-linecap="round"/>' +
      '<circle cx="80" cy="82" r="48" fill="url(#fur' + id + ')" stroke="#7c2d12" stroke-width="2.5"/>' +
      '<ellipse cx="80" cy="100" rx="28" ry="22" fill="url(#face' + id + ')" stroke="#ea580c" stroke-width="1.6"/>' +
      '<ellipse cx="62" cy="74" rx="13" ry="15" fill="#fff" stroke="#1c1917" stroke-width="1.2"/>' +
      '<ellipse cx="98" cy="74" rx="13" ry="15" fill="#fff" stroke="#1c1917" stroke-width="1.2"/>' +
      '<circle cx="64" cy="76" r="7.2" fill="#0284c7"/>' +
      '<circle cx="100" cy="76" r="7.2" fill="#0284c7"/>' +
      '<circle cx="64" cy="76" r="3.4" fill="#0f172a"/>' +
      '<circle cx="100" cy="76" r="3.4" fill="#0f172a"/>' +
      '<circle cx="66.2" cy="73.6" r="1.6" fill="#fff"/>' +
      '<circle cx="102.2" cy="73.6" r="1.6" fill="#fff"/>' +
      '<circle class="glasses" cx="63" cy="75" r="16" fill="none" stroke="url(#glass' + id + ')" stroke-width="3.2"/>' +
      '<circle class="glasses" cx="99" cy="75" r="16" fill="none" stroke="url(#glass' + id + ')" stroke-width="3.2"/>' +
      '<path class="glasses" d="M79 75 H83" stroke="#22d3ee" stroke-width="3.2" stroke-linecap="round"/>' +
      '<ellipse cx="80" cy="98" rx="5.5" ry="4" fill="#9a3412"/>' +
      '<path class="mouth" d="M64 108 q16 14 32 0" fill="none" stroke="#9a3412" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>';
  }

  var greet = document.createElement("div");
  greet.className = "greet-modal";
  greet.hidden = true;
  greet.innerHTML = '<div class="greet-card" role="dialog" aria-modal="true" aria-labelledby="greet-title">' +
    monkeySvg("g") +
    '<h2 id="greet-title">Welcome to CypherMonkey Labs</h2>' +
    '<p>I am the Teams Phone guide. I only use notes in this lab.</p>' +
    '<div class="mvcc-cards"><button type="button" data-path="ten">Finish in 10 minutes</button>' +
    '<button type="button" data-path="full">Full course</button>' +
    '<button type="button" data-path="download">Just download</button></div>' +
    '<button type="button" class="greet-stay" data-greet-close>Continue on this page</button></div>';
  document.body.appendChild(greet);

  var bot = document.createElement("div");
  bot.className = "mvcc-bot pose-wave";
  bot.innerHTML =
    '<button type="button" class="bot-launch" aria-expanded="false" aria-controls="bot-panel">' + monkeySvg("d") + '</button>' +
    '<div class="nudge" hidden><p>Need a hand with this page?</p><button type="button" data-nudge-yes>Yes</button><button type="button" data-nudge-no>Not now</button><button type="button" data-nudge-stop>Stop offering</button></div>' +
    '<section id="bot-panel" class="bot-panel" hidden role="dialog" aria-label="Guide">' +
    '<div class="sheet-handle" data-sheet-handle aria-hidden="true"></div>' +
    '<p class="bot-log"></p>' +
    '<div class="mvcc-cards" data-quick></div>' +
    '<div class="bot-form"><button type="button" data-mic aria-label="Voice input">Mic</button><input type="text" data-ask aria-label="Ask or type" placeholder="Type if the mic is off"><button type="button" data-send>Send</button></div>' +
    '<details class="bot-extra"><summary>Voice and sound</summary>' +
    '<label>Voice <select data-voice-name aria-label="Speaking voice"></select></label>' +
    '<label>Rate <input data-rate type="range" min="0.8" max="1.2" step="0.05" value="0.95" aria-label="Speech rate"></label>' +
    '<label>Pitch <input data-pitch type="range" min="0.8" max="1.2" step="0.05" value="1" aria-label="Speech pitch"></label>' +
    '<label class="check-row"><input type="checkbox" data-ambient> Soft ambient sound</label>' +
    '</details>' +
    '<div class="bot-actions"><button type="button" data-read>Read this page</button><button type="button" data-stop-read>Stop</button><button type="button" data-close-bot>Close</button></div>' +
    '</section>';
  document.body.appendChild(bot);
  var launch = bot.querySelector(".bot-launch");
  var panel = bot.querySelector(".bot-panel");
  var log = bot.querySelector(".bot-log");
  var nudge = bot.querySelector(".nudge");

  function setPose(name) {
    bot.classList.remove("pose-wave", "pose-think", "pose-cheer", "pose-read");
    bot.classList.add("pose-" + name);
  }
  function say(text) {
    log.textContent = text;
    setPose("think");
  }
  function closeGreet() {
    greet.hidden = true;
  }
  function openPanel() {
    closeGreet();
    panel.hidden = false;
    bot.classList.add("is-open");
    launch.setAttribute("aria-expanded", "true");
    setPose("cheer");
  }
  function closePanel() {
    panel.hidden = true;
    bot.classList.remove("is-open");
    launch.setAttribute("aria-expanded", "false");
    setPose("wave");
  }
  launch.addEventListener("click", function () {
    if (dragged) { dragged = false; return; }
    if (panel.hidden) openPanel(); else closePanel();
  });
  bot.querySelector("[data-close-bot]").addEventListener("click", closePanel);
  document.addEventListener("click", function (event) {
    if (event.target.closest && event.target.closest("[data-open-guide]")) {
      openPanel();
      say("Ask for a room, or choose a path.");
    }
  });

  function fileName() {
    var path = (location.pathname || "").split("/").pop() || "index.html";
    return path || "index.html";
  }
  function exportForHere() {
    var file = fileName();
    var hit = (index.pages || []).filter(function (p) { return p.href && p.href.indexOf(file) !== -1; })[0];
    if (hit && hit.export) return hit.export;
    var row = document.querySelector(".room-dl a, .dl-row a");
    if (row) return { label: "This section", href: row.getAttribute("href") };
    return { label: "All downloads", href: fromRoot("downloads.html") };
  }
  function quick() {
    var exp = exportForHere();
    bot.querySelector("[data-quick]").innerHTML =
      '<button type="button" data-path="ten">Finish in 10 minutes</button>' +
      '<button type="button" data-path="full">Full course</button>' +
      '<button type="button" data-go="' + exp.href + '">Download: ' + exp.label + '</button>';
  }
  function go(href) {
    if (!href) return;
    location.href = href;
  }
  function answer(q) {
    var query = String(q || "").trim().toLowerCase();
    if (!query) return;
    openPanel();
    if (query.indexOf("download") !== -1 || query.indexOf("export") !== -1 || query.indexOf("sheet") !== -1) {
      var exp = exportForHere();
      say("This section exports as " + exp.label + ".");
      go(exp.href);
      return;
    }
    if (query.indexOf("10") !== -1 || query.indexOf("ten") !== -1) { say("Ten minutes: tenant, Direct Routing, then one quiz."); go(fromRoot("start.html")); return; }
    if (query.indexOf("full") !== -1 || query.indexOf("course") !== -1) { say("The full course starts at track 1."); go(fromRoot("index.html#rooms")); return; }
    if (query.indexOf("bridge") !== -1 || query.indexOf("cucm") !== -1 || query.indexOf("ucce") !== -1 || query.indexOf("webex") !== -1) {
      say("Bridges to CUCM, Webex, and UCCE are marked confirm-before-relying.");
      go(fromRoot("bridges.html"));
      return;
    }
    var rooms = index.rooms || [];
    for (var i = 0; i < rooms.length; i++) {
      if (rooms[i].title && query.indexOf(rooms[i].title.toLowerCase()) !== -1) {
        say("Opening " + rooms[i].title + ".");
        go(fromRoot(rooms[i].href));
        return;
      }
    }
    var pages = index.pages || [];
    for (var j = 0; j < pages.length; j++) {
      if (pages[j].title && query.indexOf(pages[j].title.toLowerCase()) !== -1) {
        say("Opening " + pages[j].title + ".");
        go(fromRoot(pages[j].href));
        return;
      }
    }
    say("I only answer from this lab. Try Direct Routing, Operator Connect, Copilot, or Downloads. Confirm anything you will build.");
    setPose("think");
  }
  function onOffer(event) {
    var path = event.target.closest && event.target.closest("[data-path]");
    if (path) {
      closeGreet();
      var kind = path.getAttribute("data-path");
      if (kind === "ten") answer("ten minutes");
      else if (kind === "full") answer("full course");
      else answer("download");
      return;
    }
    var jump = event.target.closest && event.target.closest("[data-go]");
    if (jump) go(jump.getAttribute("data-go"));
  }
  bot.addEventListener("click", onOffer);
  greet.addEventListener("click", function (event) {
    if (event.target === greet || (event.target.closest && event.target.closest("[data-greet-close]"))) closeGreet();
    onOffer(event);
  });
  bot.querySelector("[data-send]").addEventListener("click", function () {
    var input = bot.querySelector("[data-ask]");
    answer(input.value);
    input.value = "";
  });
  bot.querySelector("[data-ask]").addEventListener("keydown", function (event) {
    if (event.key === "Enter") { answer(event.target.value); event.target.value = ""; }
  });

  /* Voice */
  var synth = window.speechSynthesis;
  var chosen = null;
  function rank(voice) {
    var name = (voice.name || "") + " " + (voice.lang || "");
    var score = 0;
    if (/natural|neural|aria|jenny|guy|samantha|enhanced|premium/i.test(name)) score += 5;
    if (/en[-_]US/i.test(voice.lang || "")) score += 2;
    if (/english/i.test(name)) score += 1;
    if (/microsoft/i.test(name) && /desktop/i.test(name)) score -= 2;
    return score;
  }
  function fillVoices() {
    if (!synth) return;
    var voices = synth.getVoices() || [];
    voices.sort(function (a, b) { return rank(b) - rank(a); });
    var sel = bot.querySelector("[data-voice-name]");
    sel.innerHTML = voices.map(function (v, i) {
      return '<option value="' + i + '">' + v.name + "</option>";
    }).join("");
    chosen = voices[0] || null;
    sel.onchange = function () { chosen = voices[Number(sel.value)] || chosen; };
  }
  if (synth) {
    fillVoices();
    synth.addEventListener("voiceschanged", fillVoices);
  }
  var reading = false;
  function stopRead() {
    reading = false;
    if (synth) synth.cancel();
    document.querySelectorAll(".is-spoken, .is-reading").forEach(function (n) {
      n.classList.remove("is-spoken", "is-reading");
    });
    setPose("wave");
  }
  function splitPlain(el) {
    if (el.closest(".disclaimer-panel, .site-footer, .mvcc-bot, .room-dl, .quiz")) return [];
    if (el.querySelector("a, button, code, .read-sent")) {
      return [{ section: el.closest("section") || el, span: el }];
    }
    var text = (el.textContent || "").trim();
    if (!text) return [];
    var parts = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    if (parts.length < 2) return [{ section: el.closest("section") || el, span: el }];
    el.textContent = "";
    var made = [];
    parts.forEach(function (part, index) {
      var span = document.createElement("span");
      span.className = "read-sent";
      span.textContent = part;
      el.appendChild(span);
      if (index < parts.length - 1) el.appendChild(document.createTextNode(" "));
      made.push({ section: el.closest("section") || el, span: span });
    });
    return made;
  }
  function sentences() {
    var ready = document.querySelectorAll("main .read-sent");
    if (ready.length) {
      return Array.prototype.map.call(ready, function (span) {
        return { section: span.closest("section") || span, span: span };
      });
    }
    var made = [];
    document.querySelectorAll("main p, main li").forEach(function (el) {
      made = made.concat(splitPlain(el));
    });
    return made;
  }
  function readAlong() {
    if (!synth) { say("This browser has no speech voice. The text stays on the page."); return; }
    stopRead();
    reading = true;
    openPanel();
    setPose("read");
    var nodes = sentences();
    var i = 0;
    function next() {
      if (!reading || i >= nodes.length) { stopRead(); return; }
      var item = nodes[i];
      i += 1;
      document.querySelectorAll(".is-spoken, .is-reading").forEach(function (n) { n.classList.remove("is-spoken", "is-reading"); });
      item.span.classList.add("is-spoken");
      var section = item.section;
      if (section && section.classList) {
        section.classList.add("is-reading");
        var id = section.id;
        if (id) {
          document.querySelectorAll(".toc a, .section-rail a").forEach(function (a) {
            var href = a.getAttribute("href") || "";
            var on = href === "#" + id || href.indexOf("#" + id) === href.length - ("#" + id).length;
            a.classList.toggle("is-current", on);
            if (on) a.setAttribute("aria-current", "true");
            else a.removeAttribute("aria-current");
          });
        }
      }
      item.span.scrollIntoView({ block: "center", behavior: reduceMotion() ? "auto" : "smooth" });
      var utter = new SpeechSynthesisUtterance(item.span.textContent);
      if (chosen) utter.voice = chosen;
      utter.rate = Number(bot.querySelector("[data-rate]").value) || 0.95;
      utter.pitch = Number(bot.querySelector("[data-pitch]").value) || 1;
      utter.onend = next;
      utter.onerror = next;
      synth.speak(utter);
    }
    next();
  }
  bot.querySelector("[data-read]").addEventListener("click", readAlong);
  bot.querySelector("[data-stop-read]").addEventListener("click", stopRead);
  document.addEventListener("mvcc-listen", readAlong);

  var Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  var micBtn = bot.querySelector("[data-mic]");
  if (!Rec) micBtn.hidden = false;
  micBtn.addEventListener("click", function () {
    if (!Rec) { say("No mic in this browser. Type in the box."); bot.querySelector("[data-ask]").focus(); return; }
    var rec = new Rec();
    rec.lang = "en-US";
    rec.onresult = function (event) {
      var text = event.results[0][0].transcript;
      bot.querySelector("[data-ask]").value = text;
      answer(text);
    };
    rec.onerror = function () { say("Mic did not hear that. Type instead."); bot.querySelector("[data-ask]").focus(); };
    try { rec.start(); say("Listening."); setPose("think"); }
    catch (err) { say("Mic did not start. Type instead."); }
  });

  /* Ambient, off by default */
  var audioCtx = null;
  var ambientNodes = null;
  bot.querySelector("[data-ambient]").addEventListener("change", function (event) {
    if (!event.target.checked) {
      if (ambientNodes) ambientNodes.stop();
      ambientNodes = null;
      return;
    }
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx || new Ctx();
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.frequency.value = 174;
    gain.gain.value = 0.012;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    ambientNodes = osc;
  });

  /* Drag, edge snap, tilt and reset live in assets/js/dragbot.js */
  var dragged = false;
  var botScript = document.createElement("script");
  botScript.src = rootPrefix + "assets/js/dragbot.js";
  document.body.appendChild(botScript);

  function greetOnce() {
    var bag = loadBag();
    if (bag.greeted || shot()) return;
    bag.greeted = 1;
    saveBag(bag);
    greet.hidden = false;
    setPose("wave");
  }
  var handle = bot.querySelector("[data-sheet-handle]");
  var sheetDrag = null;
  handle.addEventListener("pointerdown", function (event) {
    sheetDrag = event.clientY;
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener("pointerup", function (event) {
    if (sheetDrag != null && event.clientY - sheetDrag > 36) closePanel();
    sheetDrag = null;
  });

  /* Idle offers: first at 2 min, then 3 min, then 5 min. Three times max. */
  var waits = [120000, 180000, 300000];
  function scheduleNudge() {
    var bag = loadBag();
    if (bag.stopOffers) return;
    var n = bag.offers || 0;
    if (n >= waits.length) return;
    window.setTimeout(function () {
      var fresh = loadBag();
      if (fresh.stopOffers || !panel.hidden || document.visibilityState === "hidden") return;
      nudge.hidden = false;
      setPose("wave");
      fresh.offers = (fresh.offers || 0) + 1;
      saveBag(fresh);
      scheduleNudge();
    }, waits[n]);
  }
  bot.querySelector("[data-nudge-yes]").addEventListener("click", function () { nudge.hidden = true; openPanel(); say("What do you want to open?"); });
  bot.querySelector("[data-nudge-no]").addEventListener("click", function () { nudge.hidden = true; });
  bot.querySelector("[data-nudge-stop]").addEventListener("click", function () {
    nudge.hidden = true;
    var bag = loadBag();
    bag.stopOffers = 1;
    saveBag(bag);
  });

  function boot() {
    ensureInkControl();
    quick();
    var bag = loadBag();
    var mode = shot();
    if (mode === "menu") {
      var opener = document.querySelector(".phone-menu-btn");
      if (opener) opener.click();
    } else if (mode === "bot") {
      openPanel();
      say("I am the Teams Phone guide.");
    } else if (mode === "scroll") {
      var target = document.querySelector("#rooms, #five, h2");
      if (target) target.scrollIntoView();
    } else if (mode === "footer") {
      var foot = document.querySelector(".site-footer");
      var stage = document.querySelector(".v4-stage") || document.body;
      if (foot && stage) stage.insertBefore(foot, stage.firstChild);
    } else if (mode === "tour") {
      var stepNum = Number(new URLSearchParams(location.search).get("step") || "1");
      tourAt = Math.max(0, Math.min(TOUR.length - 1, (stepNum || 1) - 1));
      tourLayer.hidden = false;
      placeTour();
    }
    window.addEventListener("resize", function () {
      if (!tourLayer.hidden) placeTour();
    });
    if (!bag.tour && !mode) window.setTimeout(startTour, 400);
    else if (!mode) greetOnce();
    scheduleNudge();
  }
  if (document.readyState === "complete") window.setTimeout(boot, 60);
  else window.addEventListener("load", function () { window.setTimeout(boot, 60); });
})();

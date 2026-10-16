/* Round 4 interactions: lightbox, chart tips, languages, mascot, audio, icons.
   Loaded after the university chrome. Relative paths. No CDN. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  var COPY = {
    en: { greeting: "Learn Teams Phone in color.", lede: "One hundred ten rooms. Open a track, then a bridge.", kicker: "Teams Phone study · 8 tracks · offline", diagrams: "Diagrams", flows: "Flows", charts: "Charts", cheat: "Cheat Codes", play: "Play", ecosystem: "Ecosystem", downloads: "Downloads", careers: "Careers", regions: "Countries and residency", audioTitle: "Architect desk", langName: "Language", sheet: "Scene controls", menu: "Menu", close: "Close", learn: "Learn", listen: "Listen", settings: "Settings", sound: "Sound", mute: "Mute", themeWord: "Theme", reduceMotion: "Reduce motion", start: "Start here", rooms: "Rooms", quizzes: "Quizzes", cards: "Flashcards", glossary: "Glossary", labs: "Labs", cases: "Cases", interviews: "Interviews", mastery: "Mastery", browse: "Browse rooms" },
    es: { greeting: "Aprende el Canon en órbita.", lede: "Sesenta y tres salas. Mira la ruta de la llamada y abre una pista.", kicker: "Estudio de Teams Phone · 8 pistas · sin red", diagrams: "Diagramas", flows: "Flujos", charts: "Gráficos", cheat: "Chuletas", play: "Jugar", ecosystem: "Ecosistema", downloads: "Descargas", careers: "Carreras", regions: "Países y residencia", audioTitle: "Mesa de arquitectos", langName: "Idioma", sheet: "Controles de la escena", menu: "Menú", close: "Cerrar", learn: "Aprender", listen: "Escuchar", settings: "Ajustes", sound: "Sonido", mute: "Silencio", themeWord: "Tema", reduceMotion: "Reducir movimiento", start: "Empieza aquí", rooms: "Salas", quizzes: "Cuestionarios", cards: "Tarjetas", glossary: "Glosario", labs: "Laboratorios", cases: "Casos", interviews: "Entrevistas", mastery: "Dominio", browse: "Ver salas" },
    hi: { greeting: "कैनन को रंगों में सीखें।", lede: "तिरसठ कमरे। कॉल पथ देखें, फिर एक ट्रैक खोलें।", kicker: "टीम्स फोन अध्ययन · 8 ट्रैक · ऑफ़लाइन", diagrams: "आरेख", flows: "प्रवाह", charts: "चार्ट", cheat: "चीट कोड", play: "खेल", ecosystem: "पारिस्थितिकी", downloads: "डाउनलोड", careers: "करियर", regions: "देश और डेटा निवास", audioTitle: "आर्किटेक्ट डेस्क", langName: "भाषा", sheet: "दृश्य नियंत्रण", menu: "मेनू", close: "बंद करें", learn: "सीखें", listen: "सुनें", settings: "सेटिंग्स", sound: "ध्वनि", mute: "मौन", themeWord: "थीम", reduceMotion: "गति कम करें", start: "यहाँ से शुरू", rooms: "कमरे", quizzes: "प्रश्नोत्तरी", cards: "कार्ड", glossary: "शब्दावली", labs: "प्रयोगशाला", cases: "मामले", interviews: "साक्षात्कार", mastery: "महारत", browse: "कमरे देखें" },
    te: { greeting: "క్యానన్‌ను కక్ష్యలో నేర్చుకోండి.", lede: "అరవై మూడు గదులు. కాల్ మార్గం చూడండి, తర్వాత ట్రాక్ తెరవండి.", kicker: "టీమ్స్ ఫోన్ అధ్యయనం · 8 ట్రాక్‌లు · ఆఫ్‌లైన్", diagrams: "రేఖాచిత్రాలు", flows: "ప్రవాహాలు", charts: "చార్టులు", cheat: "చీట్ కోడ్స్", play: "ఆట", ecosystem: "పర్యావరణం", downloads: "డౌన్‌లోడ్‌లు", careers: "కెరీర్", regions: "దేశాలు మరియు డేటా నివాసం", audioTitle: "ఆర్కిటెక్ట్ డెస్క్", langName: "భాష", sheet: "దృశ్య నియంత్రణలు", menu: "మెనూ", close: "మూసివేయి", learn: "నేర్చుకోండి", listen: "వినండి", settings: "సెట్టింగ్‌లు", sound: "ధ్వని", mute: "నిశ్శబ్దం", themeWord: "థీమ్", reduceMotion: "చలనం తగ్గించు", start: "ఇక్కడ మొదలు", rooms: "గదులు", quizzes: "క్విజ్‌లు", cards: "కార్డులు", glossary: "పదకోశం", labs: "ల్యాబ్‌లు", cases: "కేసులు", interviews: "ఇంటర్వ్యూలు", mastery: "నైపుణ్యం", browse: "గదులు చూడండి" },
    fr: { greeting: "Apprenez le Canon en orbite.", lede: "Soixante-trois salles. Suivez le chemin d'appel, puis ouvrez une piste.", kicker: "Étude Teams Phone · 8 pistes · hors ligne", diagrams: "Schémas", flows: "Flux", charts: "Graphiques", cheat: "Antisèches", play: "Jouer", ecosystem: "Écosystème", downloads: "Téléchargements", careers: "Carrières", regions: "Pays et résidence", audioTitle: "Bureau des architectes", langName: "Langue", sheet: "Contrôles de la scène", menu: "Menu", close: "Fermer", learn: "Apprendre", listen: "Écouter", settings: "Réglages", sound: "Son", mute: "Muet", themeWord: "Thème", reduceMotion: "Réduire le mouvement", start: "Commencer ici", rooms: "Salles", quizzes: "Quiz", cards: "Cartes", glossary: "Glossaire", labs: "Ateliers", cases: "Cas", interviews: "Entretiens", mastery: "Maîtrise", browse: "Parcourir les salles" },
    de: { greeting: "Lerne den Canon in der Umlaufbahn.", lede: "Dreiundsechzig Räume. Folge dem Anrufpfad und öffne dann einen Track.", kicker: "Teams-Phone-Studium · 8 Tracks · offline", diagrams: "Diagramme", flows: "Flüsse", charts: "Charts", cheat: "Spickzettel", play: "Spielen", ecosystem: "Ökosystem", downloads: "Downloads", careers: "Karriere", regions: "Länder und Residenz", audioTitle: "Architektentisch", langName: "Sprache", sheet: "Szenenregler", menu: "Menü", close: "Schließen", learn: "Lernen", listen: "Hören", settings: "Einstellungen", sound: "Ton", mute: "Stumm", themeWord: "Thema", reduceMotion: "Bewegung reduzieren", start: "Hier starten", rooms: "Räume", quizzes: "Quiz", cards: "Karten", glossary: "Glossar", labs: "Labore", cases: "Fälle", interviews: "Interviews", mastery: "Meisterschaft", browse: "Räume durchsuchen" },
    ja: { greeting: "軌道でキヤノンを学ぶ。", lede: "63の部屋。通話経路を見てからトラックを開く。", kicker: "Teams Phone学習 · 8トラック · オフライン", diagrams: "図", flows: "フロー", charts: "チャート", cheat: "チートコード", play: "プレイ", ecosystem: "エコシステム", downloads: "ダウンロード", careers: "キャリア", regions: "国とデータ居住地", audioTitle: "設計者の机", langName: "言語", sheet: "シーンの操作", menu: "メニュー", close: "閉じる", learn: "学ぶ", listen: "聴く", settings: "設定", sound: "音声", mute: "ミュート", themeWord: "テーマ", reduceMotion: "動きを減らす", start: "ここから開始", rooms: "部屋", quizzes: "クイズ", cards: "カード", glossary: "用語集", labs: "ラボ", cases: "事例", interviews: "面接", mastery: "習熟", browse: "部屋を見る" },
    ar: { greeting: "تعلّم القانون في المدار.", lede: "ثلاث وستون غرفة. شاهد مسار المكالمة ثم افتح مساراً.", kicker: "دراسة تيمز فون · ٨ مسارات · دون اتصال", diagrams: "مخططات", flows: "تدفقات", charts: "رسوم", cheat: "أوراق الغش", play: "لعب", ecosystem: "المنظومة", downloads: "تنزيلات", careers: "مهن", regions: "البلدان وإقامة البيانات", audioTitle: "مكتب المهندسين", langName: "اللغة", sheet: "عناصر المشهد", menu: "القائمة", close: "إغلاق", learn: "تعلّم", listen: "استمع", settings: "الإعدادات", sound: "الصوت", mute: "كتم", themeWord: "السمة", reduceMotion: "تقليل الحركة", start: "ابدأ هنا", rooms: "الغرف", quizzes: "اختبارات", cards: "بطاقات", glossary: "مسرد", labs: "مختبرات", cases: "حالات", interviews: "مقابلات", mastery: "إتقان", browse: "تصفح الغرف" }
  };
  var LANGS = ["en", "es", "hi", "te", "fr", "de", "ja", "ar"];

  function applyLang(code) {
    if (LANGS.indexOf(code) === -1) code = "en";
    var pack = COPY[code];
    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      var key = node.getAttribute("data-i18n");
      if (pack[key]) node.textContent = pack[key];
    });
    root.lang = code === "en" ? "en" : code;
    root.dir = code === "ar" ? "rtl" : "ltr";
    try { localStorage.setItem("canon-lang", code); } catch (err) { /* storage off */ }
    document.querySelectorAll("[data-lang]").forEach(function (sel) { sel.value = code; });
    applyRooms(code);
  }

  var MT = { es: "Traducción automática", hi: "मशीन अनुवाद", te: "యంత్ర అనువాదం", fr: "Traduction automatique", de: "Maschinenübersetzung", ja: "機械翻訳", ar: "ترجمة آلية" };

  function applyRooms(code) {
    var book = window.CANON_ROOMS_I18N;
    if (!book) return;
    var flag = document.querySelector(".mt-flag");
    function remember(node, attr) {
      if (node && !node.getAttribute(attr)) node.setAttribute(attr, node.textContent);
    }
    function restore(selector, attr) {
      document.querySelectorAll("[" + attr + "]").forEach(function (node) {
        if (selector && !node.matches(selector)) return;
        node.textContent = node.getAttribute(attr);
      });
    }
    if (code === "en") {
      restore("", "data-en-title");
      restore("", "data-en-summary");
      if (flag) flag.hidden = true;
      return;
    }
    var room = document.body.getAttribute("data-room");
    var h1 = document.querySelector("main h1");
    var lede = document.querySelector("main .lede, main p.lede");
    if (room && book[room]) {
      if (h1 && book[room].title && book[room].title[code]) {
        remember(h1, "data-en-title");
        h1.textContent = book[room].title[code];
      }
      if (lede && book[room].summary && book[room].summary[code]) {
        remember(lede, "data-en-summary");
        lede.textContent = book[room].summary[code];
      }
    }
    document.querySelectorAll(".room-row").forEach(function (row) {
      var id = row.getAttribute("data-code");
      var link = row.querySelector(".room-title");
      if (!id || !link || !book[id] || !book[id].title || !book[id].title[code]) return;
      remember(link, "data-en-title");
      link.textContent = book[id].title[code];
    });
    var host = h1 || document.querySelector("#rooms") || document.querySelector("main");
    if (host && !document.querySelector(".mt-flag")) {
      flag = document.createElement("p");
      flag.className = "mt-flag";
      if (h1) h1.insertAdjacentElement("afterend", flag);
      else host.prepend(flag);
    }
    flag = document.querySelector(".mt-flag");
    if (flag) {
      flag.hidden = false;
      flag.textContent = MT[code] || "Machine translation";
    }
  }

  function mountLang() {
    if (!document.querySelector("[data-lang]")) {
      var menu = document.querySelector(".uni-menu");
      if (menu) {
        var label = document.createElement("label");
        label.className = "lang-switch";
        label.innerHTML = '<span data-i18n="langName">Language</span> <select data-lang aria-label="Language"></select>';
        menu.insertAdjacentElement("afterend", label);
      }
    }
    document.querySelectorAll("[data-lang]").forEach(function (sel) {
      if (!sel.options.length) {
        LANGS.forEach(function (code) {
          var opt = document.createElement("option");
          opt.value = code;
          opt.textContent = code === "en" ? "English" : code === "es" ? "Español" : code === "hi" ? "हिन्दी" : code === "te" ? "తెలుగు" : code === "fr" ? "Français" : code === "de" ? "Deutsch" : code === "ja" ? "日本語" : "العربية";
          sel.appendChild(opt);
        });
      }
      sel.addEventListener("change", function () { applyLang(sel.value); });
    });
    var stored = "en";
    try { stored = localStorage.getItem("canon-lang") || "en"; } catch (err) { stored = "en"; }
    applyLang(stored);
    document.addEventListener("canon-i18n", function () {
      var live = "en";
      try { live = localStorage.getItem("canon-lang") || "en"; } catch (err) { live = "en"; }
      applyLang(live);
    });
    document.addEventListener("canon-rooms-ready", function () {
      var live = document.querySelector("[data-lang]");
      applyRooms(live && live.value ? live.value : stored);
    });
  }

  var isoN = 0;
  function iso(color, kind) {
    isoN += 1;
    var id = "iso" + isoN;
    var top = kind % 3 === 0 ? "40,8 70,24 40,40 10,24" : kind % 3 === 1 ? "40,4 66,22 40,36 14,20" : "40,10 74,26 40,42 6,26";
    return '<svg class="iso-mark" viewBox="0 0 80 72" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="' + color + '"/></linearGradient></defs><polygon points="40,44 70,30 70,52 40,66" fill="#0b1020" opacity=".45"/><polygon points="10,30 40,44 40,66 10,52" fill="' + color + '" opacity=".55"/><polygon points="' + top + '" fill="url(#' + id + ')" stroke="#ffffff" stroke-opacity=".65"/><polygon points="28,20 46,28 34,34 16,26" fill="#ffffff" opacity=".55"/></svg>';
  }

  function paintIcons() {
    document.querySelectorAll(".tile-art").forEach(function (slot, index) {
      var tile = slot.closest(".track-tile");
      var color = "#22d3ee";
      if (tile) {
        var style = tile.getAttribute("style") || "";
        var match = style.match(/--card:\s*([^;]+)/);
        if (match) color = match[1].trim();
      }
      slot.innerHTML = iso(color, index);
    });
    document.querySelectorAll(".track-card").forEach(function (card, index) {
      var header = card.querySelector("header > div");
      if (!header || header.querySelector(".iso-mark")) return;
      var style = card.getAttribute("style") || "";
      var match = style.match(/--card:\s*([^;]+)/);
      var color = match ? match[1].trim() : "#22d3ee";
      header.insertAdjacentHTML("afterbegin", iso(color, index + 3));
    });
    document.querySelectorAll(".room-row").forEach(function (row, index) {
      var code = row.querySelector(".room-code");
      if (!code || code.querySelector(".iso-mark")) return;
      var card = row.closest(".track-card");
      var style = card ? card.getAttribute("style") || "" : "";
      var match = style.match(/--card:\s*([^;]+)/);
      code.insertAdjacentHTML("afterbegin", iso(match ? match[1].trim() : "#a5b4fc", index));
    });
  }

  var WHY = {
    "calling-registration": "Study map: Teams clients register to the Teams service. Direct Routing media can bypass the SBC. Re-check the Direct Routing room before you draw a trunk.",
    "certificate-trunk": "Study map for SIP TLS toward a certified SBC. Re-check Plan Direct Routing before you open a firewall.",
    "e911-held": "Study map for emergency calling. 933 is a test path and does not alert public safety. Re-check the RedSky room before you change a location.",
    "firewall-lanes": "Study map of lanes an architect checks. Port numbers follow the cited Microsoft article. This drawing is not a firewall policy."
  };

  function svgRoot(object) {
    try {
      return object.contentDocument && object.contentDocument.documentElement;
    } catch (err) {
      return null;
    }
  }

  function mountLightbox() {
    var cards = document.querySelectorAll(".atlas-card");
    if (!cards.length) return;
    var layer = document.createElement("div");
    layer.className = "atlas-lightbox";
    layer.hidden = true;
    layer.innerHTML = '<div class="atlas-dialog" role="dialog" aria-modal="true" aria-labelledby="atlas-title"><p><button type="button" data-close>Close</button> <button type="button" data-play>Play</button> <button type="button" data-pause>Pause</button> <button type="button" data-step>Step</button></p><h2 id="atlas-title"></h2><div class="atlas-legend"><span><i style="background:#22d3ee"></i>Start node</span><span><i style="background:#fde68a"></i>Moving packet</span><span><i style="background:#a5b4fc"></i>Control point</span></div><p class="atlas-why"></p><object type="image/svg+xml" data=""></object><p><a data-file href="">Open the SVG file</a></p></div>';
    document.body.appendChild(layer);
    var dialog = layer.querySelector(".atlas-dialog");
    var object = layer.querySelector("object");
    var title = layer.querySelector("#atlas-title");
    var why = layer.querySelector(".atlas-why");
    var file = layer.querySelector("[data-file]");
    var last = null;

    function open(card) {
      var source = card.querySelector("object");
      if (!source) return;
      var href = source.getAttribute("data") || "";
      title.textContent = (card.querySelector("h2") || {}).textContent || "Diagram";
      var slug = href.split("/").pop().replace(".svg", "");
      why.textContent = WHY[slug] || "This is a study drawing from the Canon rooms. Read the caption in the SVG and the linked room before you treat a box as a product limit.";
      object.setAttribute("data", href);
      file.setAttribute("href", href);
      layer.hidden = false;
      last = document.activeElement;
      layer.querySelector("[data-close]").focus();
    }
    function close() {
      layer.hidden = true;
      object.setAttribute("data", "");
      if (last && last.focus) last.focus();
    }
    function withSvg(fn) {
      var svg = svgRoot(object);
      if (!svg || !svg.pauseAnimations) {
        why.textContent += " Controls talk to the embedded SVG. If they stay quiet, open the SVG file.";
        return;
      }
      fn(svg);
    }
    cards.forEach(function (card) {
      card.addEventListener("click", function (event) {
        if (event.target.closest("a")) return;
        open(card);
      });
      card.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open(card);
        }
      });
      if (!card.hasAttribute("tabindex")) card.tabIndex = 0;
    });
    layer.querySelector("[data-close]").addEventListener("click", close);
    layer.addEventListener("click", function (event) { if (event.target === layer) close(); });
    layer.querySelector("[data-pause]").addEventListener("click", function () {
      withSvg(function (svg) { svg.pauseAnimations(); });
    });
    layer.querySelector("[data-play]").addEventListener("click", function () {
      withSvg(function (svg) { svg.unpauseAnimations(); });
    });
    layer.querySelector("[data-step]").addEventListener("click", function () {
      withSvg(function (svg) {
        var now = typeof svg.getCurrentTime === "function" ? svg.getCurrentTime() : 0;
        svg.pauseAnimations();
        if (typeof svg.setCurrentTime === "function") svg.setCurrentTime(now + 0.45);
      });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !layer.hidden) close();
    });
    dialog.addEventListener("click", function (event) { event.stopPropagation(); });
  }

  function mountCharts() {
    var tip = document.createElement("div");
    tip.className = "chart-tip";
    tip.hidden = true;
    document.body.appendChild(tip);
    function show(text, event) {
      tip.hidden = false;
      tip.textContent = text;
      tip.style.left = Math.min(event.clientX + 12, window.innerWidth - 220) + "px";
      tip.style.top = Math.min(event.clientY + 12, window.innerHeight - 48) + "px";
    }
    document.querySelectorAll(".lab-chart").forEach(function (chart) {
      var label = chart.getAttribute("data-chart") || chart.getAttribute("aria-label") || "Chart";
      chart.addEventListener("pointermove", function (event) {
        var node = event.target;
        var value = "";
        if (node && node.nextElementSibling && node.tagName === "rect") {
          var next = node.nextElementSibling.nextElementSibling;
          if (next && next.textContent) value = next.textContent;
        }
        show(label + (value ? " · " + value : "") + " · counted in this repository", event);
      });
      chart.addEventListener("pointerleave", function () { tip.hidden = true; });
    });
  }

  var FUR = { aurora: "#fbbf24", neon: "#e879f9", holographic: "#5eead4", cyberpunk: "#facc15", sunset: "#fb7185", paper: "#d97706", futuristic: "#38bdf8", gaming: "#4ade80" };
  var VARIANTS = ["wave", "cheer", "think", "idle"];

  function showVariant(name) {
    document.querySelectorAll(".mascot-var").forEach(function (node) {
      node.classList.toggle("is-var", node.getAttribute("data-variant") === name);
    });
  }
  function paintMascot() {
    var svg = document.querySelector(".mascot");
    if (!svg) return;
    svg.style.setProperty("--mascot-fur", FUR[document.documentElement.dataset.theme || "aurora"] || "#fbbf24");
  }
  function mountMascot() {
    if (!document.querySelector(".mascot-var")) return;
    var step = 0;
    showVariant(VARIANTS[0]);
    paintMascot();
    document.addEventListener("canon-theme", function () {
      paintMascot();
      step = (step + 1) % VARIANTS.length;
      showVariant(VARIANTS[step]);
    });
    if (!reduce) window.setInterval(function () {
      step = (step + 1) % VARIANTS.length;
      showVariant(VARIANTS[step]);
    }, 20000);
  }
  function assetRoot() {
    var nodes = document.querySelectorAll("script[src]");
    for (var i = 0; i < nodes.length; i++) {
      var src = nodes[i].getAttribute("src") || "";
      var at = src.indexOf("assets/js/wow.js");
      if (at !== -1) return src.slice(0, at);
    }
    return "";
  }

  function mountAudio() {
    var box = document.querySelector("[data-audio-player]");
    var audio = box && box.querySelector("[data-audio]");
    if (!audio) return;
    audio.preload = "none";
    audio.src = assetRoot() + "audio/how-to-use.mp3";
    box.querySelectorAll("[data-rate]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        audio.playbackRate = Number(btn.getAttribute("data-rate")) || 1;
      });
    });
  }

  function mountHud() {
    var hud = document.querySelector("[data-hud]");
    if (!hud) return;
    var toggle = hud.querySelector(".hud-sheet-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var open = hud.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
    if (reduce || window.matchMedia("(max-width: 720px)").matches) return;
    window.addEventListener("pointermove", function (event) {
      var px = (event.clientX / window.innerWidth) - 0.5;
      var py = (event.clientY / window.innerHeight) - 0.5;
      hud.querySelectorAll("[data-depth]").forEach(function (panel) {
        var depth = Number(panel.getAttribute("data-depth")) || 0.4;
        panel.style.translate = (px * depth * -28).toFixed(1) + "px " + (py * depth * -18).toFixed(1) + "px";
      });
    }, { passive: true });
  }

  function mountProgress() {
    var ring = document.querySelector("[data-progress-ring]");
    if (!ring) return;
    var opened = 0;
    try {
      var progress = JSON.parse(localStorage.getItem("canon-progress") || "{}");
      opened = Object.keys((progress && progress.rooms) || {}).length;
    } catch (err) { opened = 0; }
    var pct = Math.max(0, Math.min(100, Math.round((opened / 63) * 100)));
    ring.style.setProperty("--p", String(pct));
    var label = ring.querySelector("span");
    if (label) label.textContent = pct + "%";
    ring.setAttribute("aria-label", opened + " of 63 rooms opened in this browser");
  }

  mountLang();
  mountLightbox();
  mountCharts();
  mountMascot();
  mountAudio();
  mountProgress();
  mountHud();
})();

"use strict";

const FIELD_LINKS = [
  ["#/track/t01", "Fundamentals", "Tenant, identity, and the order of work."],
  ["#/track/t05", "Architecture and PSTN", "Calling Plans, Operator Connect, Phone Mobile, Direct Routing."],
  ["#/track/t10", "Deployment", "Certified SBCs and the shared configuration gate."],
  ["#/migrate", "Migration and cutover", "Checklist from inventory through hypercare."],
  ["#/track/t03", "Configuration", "PowerShell simulator and the admin track."],
  ["#/track/t12", "Troubleshooting", "Fault catalog, CQD cases, and SIP health."],
  ["#/ports", "Ports and protocols", "Firewall matrix, ladder, and the mastery game."],
  ["#/track/t17", "WFM, recording, CRM, agents", "Ecosystem track, including E911 and analytics."],
  ["#/track/t08", "E911 and survivability", "Dynamic location, LBR, and the branch appliance."],
  ["#/track/t13", "Contact center and AI", "Dynamics 365 Contact Center, ACS, Copilot Studio."],
  ["#/track/t11", "Security", "TLS, certificates, and the trust boundary."],
  ["#/career", "Licensing, exams, career", "Status board, paths, and interview traps."],
  ["#/news", "Roadmap and what is new", "Dated to 14 October 2026. Unverified items are marked."],
  ["#/downloads", "Cheat codes", "Printable sheets, flashcards, and the offline bundle."],
];

const PORT_ROWS = [
  ["Direct Routing signaling", "TCP", "5061", "TLS to sip.pstnhub.microsoft.com, sip2, and sip3", "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan"],
  ["Direct Routing media", "UDP", "3478–3481", "Media processors, unless bypass keeps RTP local", "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan"],
  ["Direct Routing media high", "UDP", "49152–53247", "Second media range. Open it or calls connect with silence", "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan"],
  ["Client audio", "UDP/TCP", "50000–50019", "DSCP 46 EF when QoS marking is on", "https://learn.microsoft.com/en-us/microsoftteams/qos-in-teams"],
  ["Client video", "UDP/TCP", "50020–50039", "DSCP 34 AF41", "https://learn.microsoft.com/en-us/microsoftteams/qos-in-teams"],
  ["Client app sharing", "UDP/TCP", "50040–50059", "DSCP 18 AF21", "https://learn.microsoft.com/en-us/microsoftteams/qos-in-teams"],
  ["Client signaling", "UDP/TCP", "50070–50089", "DSCP 40 CS5. The article says these ports are not configurable", "https://learn.microsoft.com/en-us/microsoftteams/qos-in-teams"],
  ["Direct Routing SBC IPv4", "IP", "52.112.0.0/14 and 52.120.0.0/14", "Commercial signaling and media on the plan page checked 15 October 2026. This is not the Teams client optimize list.", "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan"],
  ["Direct Routing SBC IPv6", "IP", "2603:1063:400::/40 and 2603:1063:100::/40", "Signaling uses 2603:1063:400::/40. Media uses that prefix and 2603:1063:100::/40.", "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan"],
  ["Teams client optimize", "IP", "52.112.0.0/14 and 52.122.0.0/15", "Office 365 URLs article ID 11 and the worldwide endpoints feed, checked 15 October 2026. IPv6 optimize includes 2603:1063::/38. 52.120.0.0/14 is not on this client list, and 52.122.0.0/15 is not the SBC pair.", "https://learn.microsoft.com/en-us/microsoft-365/enterprise/urls-and-ip-address-ranges"],
  ["GCC High / DoD media", "IP", "52.127.88.0/21 and 52.127.64.0/21", "GCC High media 52.127.88.0/21. DoD media 52.127.64.0/21. Proxy names are not the commercial trio.", "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan"],
];

const GAME_ROUNDS = [
  { q: "A certified SBC signals to the commercial PSTN hubs on which port?", choices: ["UDP 5060", "TCP 5061", "TCP 443 only", "UDP 50000"], answer: 1, why: "Direct Routing signaling is TLS to the three commercial proxies on TCP 5061." },
  { q: "Calls connect and both sides hear silence. Which range was most often forgotten?", choices: ["TCP 5061", "UDP 3478–3481 and 49152–53247", "TCP 80", "UDP 53"], answer: 1, why: "5061 carries SIP. Media is the UDP ranges, unless media bypass keeps RTP off the processor path." },
  { q: "The QoS article’s audio client ports and mark are:", choices: ["50020–50039 DSCP 34", "50000–50019 DSCP 46", "5061 DSCP 46", "3478 DSCP 0"], answer: 1, why: "Audio is 50000–50019 at EF 46. Video starts at 50020." },
  { q: "Browser meeting joins and the fixed 50000-range ports.", choices: ["Browsers always use 50000–50019", "Browser joins do not use those fixed ranges", "Browsers open TCP 5061 to the SBC", "Browsers mark every packet EF"], answer: 1, why: "An ACL that only matches the desktop ranges misses a lot of browser traffic." },
  { q: "Client signaling ports in the QoS article are:", choices: ["Configurable, any high port", "50070–50089 and not configurable", "5061 only", "3478–3481"], answer: 1, why: "Calling and meeting signaling is 50070–50089 at DSCP 40. The article says the ports are not configurable." },
  { q: "Media bypass changes which path?", choices: ["Signaling moves to the SBC", "Media can run between the client and the SBC", "TLS moves to UDP 5060", "E911 stops using a location"], answer: 1, why: "Signaling stays with Teams. Bypass is a media decision, and a VPN or location-based routing can forbid it." },
  { q: "SIP OPTIONS to the SBC returns no 200 OK, repeatedly. What should happen?", choices: ["Keep sending INVITEs", "Treat the trunk as out of service and use the next gateway", "Switch the user to Islands mode", "Open TCP 80"], answer: 1, why: "Missed OPTIONS are how Teams decides the trunk is unhealthy. The next gateway only helps if the route lists one." },
  { q: "GCC High PSTN proxy names match the commercial trio.", choices: ["Yes, sip.pstnhub.microsoft.com", "No. GCC High and DoD use different names", "Only sip2 changes", "Unverified, so either is fine"], answer: 1, why: "Commercial clouds use the microsoft.com trio. GCC High and DoD use gov and dod names. Do not copy a commercial ACL into those clouds." },
];

const DAILY = [
  { q: "Teams Phone and a Calling Plan are the same license.", choices: ["True", "False"], answer: 1, why: "Teams Phone is the enterprise-voice capability. A Calling Plan is Microsoft acting as the carrier, bought separately." },
  { q: "Which exam is the Dynamics 365 Contact Center exam on this status board?", choices: ["MS-700", "AB-210", "AB-250", "MB-280"], answer: 2, why: "AB-250 is the contact-center exam. AB-210 is the sales successor to MB-280 and is in beta. MS-700 is Teams administration." },
  { q: "MS-700 on 14 October 2026 is:", choices: ["Retired, replaced by AB-210", "Still live, with a skills update on 27 October 2026", "Replaced by MS-900", "Unverified"], answer: 1, why: "The status board says MS-700 is still live and has no replacement. The skills update date is 27 October 2026." },
  { q: "A resource account for an auto attendant should be licensed like a human Calling Plan user.", choices: ["Always", "No. It needs the resource-account license the voice app requires", "Only in Islands mode", "Only for Operator Connect"], answer: 1, why: "The resource account is not an agent login. Outbound from the app is a separate funding question." },
  { q: "First matching normalization rule wins.", choices: ["True", "False, all rules apply", "Only the last rule", "Only if the SBC agrees"], answer: 0, why: "Later rules do not get a vote. Put the specific pattern before the catch-all." },
  { q: "Direct Routing users in Islands mode are supported.", choices: ["Yes", "No"], answer: 1, why: "Islands mode is a hard stop for Direct Routing, not a tuning problem." },
  { q: "Erlang C in this lab is:", choices: ["A Microsoft SLA", "A teaching model", "The CQD formula", "A Calling Plan price"], answer: 1, why: "The calculator is labeled as a teaching model. It is not a vendor staffing guarantee." },
  { q: "Compliance recording in Teams requires:", choices: ["Any third-party SIP recorder on TCP 5060", "A certified recorder, an application instance, an enabled policy, and a grant", "Teams Premium alone", "A Calling Plan"], answer: 1, why: "The recording builder in this lab walks the certified-recorder path. Teams Premium does not replace it." },
  { q: "A full-tunnel VPN is a good media-bypass candidate.", choices: ["Yes", "No"], answer: 1, why: "Microsoft’s guidance, as taught here, is to keep real-time media off a full-tunnel VPN." },
  { q: "Who owns number normalization during CUCM coexistence?", choices: ["Both systems, so nothing is missed", "One owner, written down", "The carrier only", "Whoever dials last"], answer: 1, why: "If both sides add the country code, the SBC sees a broken number." },
  { q: "Call Quality Dashboard versus one bad call.", choices: ["CQD is for a single user", "One user is a Call Analytics case", "They are the same database view", "Neither looks at the network"], answer: 1, why: "A single user and a single call is Call Analytics. CQD is the building view." },
  { q: "AB-210 replaces MS-700.", choices: ["Yes", "No"], answer: 1, why: "AB-210 is not a replacement for MS-700 and it is not the contact-center exam." },
];

const FLOW_BLOCKS = [
  { id: "options", label: "OPTIONS", detail: "Trunk health" },
  { id: "invite", label: "INVITE", detail: "Dialog offer" },
  { id: "trying", label: "100 Trying", detail: "Transaction" },
  { id: "ring", label: "180 Ringing", detail: "Alerting" },
  { id: "ok", label: "200 OK", detail: "Answer" },
  { id: "ack", label: "ACK", detail: "Dialog confirmed" },
  { id: "media", label: "RTP / SRTP", detail: "Media" },
  { id: "record", label: "Record", detail: "Policy grant" },
  { id: "xfer", label: "REFER", detail: "Transfer" },
  { id: "e911", label: "Emergency", detail: "Location first" },
  { id: "bye", label: "BYE", detail: "Tear down" },
];

let sandboxSeq = [];
let gameCursor = 0;
let gameScore = 0;
let gameLocked = false;
let atlasCache = null;

async function loadAtlas() {
  if (atlasCache) return atlasCache;
  const payload = await fetchJson("data/atlas.json");
  atlasCache = payload;
  return payload;
}

function atlasCard(item, feature) {
  const kind = item.animated ? "Animated flow" : "Diagram";
  return (
    '<article class="panel atlas-card holo' + (feature ? " atlas-feature" : "") + '" id="atlas-' + esc(item.id) + '" data-kind="' + (item.animated ? "flow" : "diagram") + '" data-topic="' + esc(item.topic) + '" data-title="' + esc(item.title) + '" data-caption="' + esc(item.caption) + '">' +
    '<p class="kicker">' + kind + " · " + esc(item.topic) + "</p>" +
    "<h2>" + esc(item.title) + "</h2>" +
    '<div class="figure-canvas">' + item.svg + "</div>" +
    "<p>" + esc(item.caption) + "</p>" +
    '<p class="tiny"><a href="' + esc(item.source) + '">Source</a> · accessed ' + esc(item.accessed) + "</p>" +
    '<button type="button" class="primary enlarge" data-enlarge="1" data-i18n="enlarge">Enlarge</button></article>'
  );
}

function atlasPage(flowsOnly) {
  const items = ((atlasCache && atlasCache.items) || []).filter((item) => !flowsOnly || item.animated);
  const title = flowsOnly ? "Flows" : "Diagrams";
  window.__listen = title + ". " + items.length + " figures in the atlas. Animated packets follow the signal path.";
  const topics = [];
  items.forEach((item) => {
    if (topics.indexOf(item.topic) === -1) topics.push(item.topic);
  });
  const filters = '<div class="choice-row" role="tablist" aria-label="Filter">' +
    '<button type="button" class="choice" data-atlas="all" aria-pressed="true">All</button>' +
    topics.map((topic) => '<button type="button" class="choice" data-atlas="' + esc(topic) + '" aria-pressed="false">' + esc(topic) + "</button>").join("") +
    "</div>";
  return (
    crumbs([["Home", "#/"], [title, ""]]) +
    '<p class="kicker">Diagram atlas · checked ' + esc((atlasCache && atlasCache.checked) || "2026-10-15") + "</p>" +
    "<h1>" + title + "</h1>" +
    '<p class="lede">' + items.length + (flowsOnly ? " animated call, signal, and data flows." : " custom diagrams, including the animated flows.") + " Hand-built for this campus. Not a copy of a vendor document.</p>" +
    filters +
    '<p class="tiny" id="atlas-count">' + items.length + " showing</p>" +
    '<div id="atlas-list">' + items.map((item, index) => atlasCard(item, index === 0)).join("") + "</div>"
  );
}

function renderDiagrams() {
  return atlasPage(false);
}

function renderFlows() {
  return atlasPage(true);
}

function renderPlay() {
  window.__listen = "Play. Ports game, call-flow sandbox, daily challenge, and the SBC mesh.";
  const tiles = [
    ["#/game", "Ports game", "Eight questions. A perfect score is a badge."],
    ["#/sandbox", "Call-flow sandbox", "Stack INVITE, 200 OK, and RTP and read the note."],
    ["#/daily", "Daily challenge", "One question for this date, saved in this browser."],
    ["#/explorer", "Flow explorer", "Hop by hop from the client to the recorder."],
    ["#/topology", "SBC mesh", "Orbit the geo-redundant pair."],
    ["#/diagrams", "Diagrams", "The full atlas, including the troubleshooting tree."],
  ];
  return (
    crumbs([["Home", "#/"], ["Play", ""]]) +
    '<p class="kicker">Practice</p><h1>Play</h1>' +
    '<p class="lede">Games and sandboxes already in this campus. Scores stay in this browser.</p>' +
    '<div class="lab-grid">' + tiles.map((tile) => '<a class="card spot holo" href="' + tile[0] + '"><h3>' + esc(tile[1]) + "</h3><p>" + esc(tile[2]) + "</p></a>").join("") + "</div>"
  );
}

function wireAtlas() {
  const buttons = $$("[data-atlas]");
  if (!buttons.length) return;
  const apply = function (topic) {
    let shown = 0;
    $$(".atlas-card").forEach((card) => {
      const on = topic === "all" || card.getAttribute("data-topic") === topic;
      card.hidden = !on;
      if (on) shown += 1;
    });
    const count = $("#atlas-count");
    if (count) count.textContent = shown + " showing";
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", button.getAttribute("data-atlas") === topic ? "true" : "false");
    });
  };
  buttons.forEach((button) => {
    button.onclick = function () { apply(button.getAttribute("data-atlas")); };
  });
  $$("[data-enlarge]").forEach((button) => {
    button.onclick = function () {
      const card = button.closest(".atlas-card");
      if (card) openLightbox(card);
    };
  });
  $$(".atlas-card .figure-canvas").forEach((canvas) => {
    canvas.onclick = function () {
      const card = canvas.closest(".atlas-card");
      if (card) openLightbox(card);
    };
  });
}

function openLightbox(card) {
  const box = $("#lightbox");
  const stage = $("#lb-stage");
  if (!box || !stage) return;
  const figure = card.querySelector(".figure-canvas");
  stage.innerHTML = figure ? figure.innerHTML : "";
  stage.classList.remove("paused");
  stage.dataset.step = "0";
  const play = $("#lb-play");
  if (play) play.textContent = "Pause";
  const legend = $("#lb-legend");
  if (legend) legend.textContent = (card.getAttribute("data-kind") === "flow" ? "Animated flow" : "Diagram") + " · " + (card.getAttribute("data-topic") || "");
  const why = $("#lb-why");
  if (why) why.textContent = card.getAttribute("data-caption") || "";
  const title = $("#lb-title");
  if (title) title.textContent = card.getAttribute("data-title") || "Diagram";
  box.hidden = false;
}

function closeLightbox() {
  const box = $("#lightbox");
  if (box) box.hidden = true;
}

function armLightbox() {
  const box = $("#lightbox");
  if (!box || box.dataset.bound === "1") return;
  box.dataset.bound = "1";
  const close = $("#lb-close");
  if (close) close.onclick = closeLightbox;
  box.addEventListener("click", function (event) {
    if (event.target === box) closeLightbox();
  });
  const play = $("#lb-play");
  if (play) {
    play.onclick = function () {
      const stage = $("#lb-stage");
      if (!stage) return;
      const paused = stage.classList.toggle("paused");
      play.textContent = paused ? "Play" : "Pause";
      if (!paused) {
        stage.querySelectorAll(".atlas-packet").forEach((node) => {
          node.style.animation = "";
          node.style.offsetDistance = "";
        });
      }
    };
  }
  const step = $("#lb-step");
  if (step) {
    step.onclick = function () {
      const stage = $("#lb-stage");
      if (!stage) return;
      stage.classList.add("paused");
      const playBtn = $("#lb-play");
      if (playBtn) playBtn.textContent = "Play";
      const next = (Number(stage.dataset.step) || 0) + 1;
      stage.dataset.step = String(next % 8);
      const packets = stage.querySelectorAll(".atlas-packet");
      if (!packets.length) return;
      packets.forEach((node) => {
        node.style.animation = "none";
        node.style.offsetDistance = ((next % 8) * 12.5) + "%";
      });
    };
  }
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeLightbox();
  });
}

const I18N = {
  en: { greet: "The call path, in light.", diagrams: "Diagrams", flows: "Flows", charts: "Charts", codes: "Cheat Codes", play: "Play", eco: "Ecosystem", downloads: "Downloads", careers: "Careers", regions: "Regions", codesShort: "Codes", enlarge: "Enlarge", listen: "Architect briefing", light: "Light", dark: "Dark" },
  es: { greet: "La ruta de la llamada, en luz.", diagrams: "Diagramas", flows: "Flujos", charts: "Gráficos", codes: "Chuletas", play: "Jugar", eco: "Ecosistema", downloads: "Descargas", careers: "Carreras", regions: "Regiones", codesShort: "Chuletas", enlarge: "Ampliar", listen: "Charla de arquitectura", light: "Claro", dark: "Oscuro" },
  hi: { greet: "कॉल का रास्ता, रोशनी में।", diagrams: "आरेख", flows: "प्रवाह", charts: "चार्ट", codes: "चीट कोड", play: "खेल", eco: "इकोसिस्टम", downloads: "डाउनलोड", careers: "करियर", regions: "क्षेत्र", codesShort: "कोड", enlarge: "बड़ा करें", listen: "आर्किटेक्ट वार्ता", light: "हल्का", dark: "गहरा" },
  te: { greet: "కాల్ మార్గం, వెలుగులో.", diagrams: "రేఖాచిత్రాలు", flows: "ప్రవాహాలు", charts: "పటాలు", codes: "చీట్ కోడ్", play: "ఆట", eco: "వ్యవస్థ", downloads: "డౌన్‌లోడ్", careers: "వృత్తులు", regions: "ప్రాంతాలు", codesShort: "కోడ్", enlarge: "పెద్దది", listen: "వాస్తు సంభాషణ", light: "వెలుతురు", dark: "చీకటి" },
  fr: { greet: "Le chemin de l'appel, en lumière.", diagrams: "Schémas", flows: "Flux", charts: "Graphiques", codes: "Antisèches", play: "Jouer", eco: "Écosystème", downloads: "Téléchargements", careers: "Carrières", regions: "Régions", codesShort: "Fiches", enlarge: "Agrandir", listen: "Brief architectes", light: "Clair", dark: "Sombre" },
  de: { greet: "Der Anrufweg, in Licht.", diagrams: "Diagramme", flows: "Flüsse", charts: "Charts", codes: "Spickzettel", play: "Spielen", eco: "Ökosystem", downloads: "Downloads", careers: "Karriere", regions: "Regionen", codesShort: "Zettel", enlarge: "Vergrößern", listen: "Architektenbriefing", light: "Hell", dark: "Dunkel" },
  ja: { greet: "通話経路を、光で。", diagrams: "図", flows: "フロー", charts: "チャート", codes: "チートシート", play: "練習", eco: "エコシステム", downloads: "ダウンロード", careers: "キャリア", regions: "地域", codesShort: "シート", enlarge: "拡大", listen: "設計者の対話", light: "ライト", dark: "ダーク" },
  ar: { greet: "مسار المكالمة، في الضوء.", diagrams: "مخططات", flows: "تدفقات", charts: "رسوم", codes: "أوراق الغش", play: "تدريب", eco: "المنظومة", downloads: "تنزيلات", careers: "مسارات", regions: "مناطق", codesShort: "أوراق", enlarge: "تكبير", listen: "حوار المعماريين", light: "فاتح", dark: "داكن" },
};

function applyI18n() {
  const lang = state.lang || "en";
  const pack = I18N[lang] || I18N.en;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  $$("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    if (pack[key]) node.textContent = pack[key];
  });
  const sel = $("#lang");
  if (sel && sel.value !== lang) sel.value = lang;
  const flip = $("#theme-flip");
  if (flip) flip.textContent = activeTheme() === "light" ? pack.dark : pack.light;
}

function architectAudio() {
  return (
    '<section class="panel holo architect">' +
    '<h2 data-i18n="listen">Architect briefing</h2>' +
    '<p>Two short clips. Maya and Jon walk the campus: how to view the scene, open the menu, practise, and share. Spoken on this machine with espeak-ng. Nothing is uploaded.</p>' +
    '<figure><figcaption>Use and view</figcaption><audio controls preload="none" src="audio/architect-use.mp3"></audio></figure>' +
    '<figure><figcaption>Practise and share</figcaption><audio controls preload="none" src="audio/architect-share.mp3"></audio></figure>' +
    '<p class="audio-actions"><a href="https://github.com/cipher0x9/microsoft-voice-cc-lab-free-university-mesmerizing/issues">Rate and comment</a> · <button type="button" class="ghost" id="share-lab">Share</button> · <a href="https://cyphermonkeylabs.com">CypherMonkey Labs</a></p>' +
    '<p class="tiny" id="share-note">Share copies the public campus address. Report a concern from the footer. No email is shown.</p></section>'
  );
}

function wireArchitect() {
  const button = $("#share-lab");
  if (!button || button.dataset.bound === "1") return;
  button.dataset.bound = "1";
  button.onclick = function () {
    const url = "https://cipher0x9.github.io/microsoft-voice-cc-lab-free-university-mesmerizing/campus/";
    const note = $("#share-note");
    const done = function (text) { if (note) note.textContent = text; };
    if (navigator.share) {
      navigator.share({ title: "Microsoft Voice & Contact Center Lab", url: url }).then(function () { done("Shared."); }).catch(function () { done(url); });
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { done("Copied " + url); }).catch(function () { done(url); });
      return;
    }
    done(url);
  };
}

function bindChartTips() {
  const host = $("#view");
  if (!host || host.dataset.tips === "1") return;
  host.dataset.tips = "1";
  let tip = $("#chart-tip");
  if (!tip) {
    tip = document.createElement("div");
    tip.id = "chart-tip";
    tip.className = "chart-tip";
    tip.hidden = true;
    document.body.appendChild(tip);
  }
  host.addEventListener("pointerover", function (event) {
    const node = event.target && event.target.closest ? event.target.closest("rect, path") : null;
    if (!node || !node.closest("svg")) return;
    const own = node.querySelector("title");
    const svg = node.closest("svg");
    const svgTitle = svg ? svg.querySelector("title") : null;
    const label = (own && own.textContent) || (svgTitle && svgTitle.textContent) || "";
    if (!label) {
      tip.hidden = true;
      return;
    }
    tip.hidden = false;
    tip.textContent = label;
  });
  host.addEventListener("pointermove", function (event) {
    if (tip.hidden) return;
    tip.style.left = (event.clientX + 14) + "px";
    tip.style.top = (event.clientY + 16) + "px";
  });
  host.addEventListener("pointerout", function (event) {
    const node = event.target && event.target.closest ? event.target.closest("rect, path") : null;
    if (node) tip.hidden = true;
  });
}

function renderRegions() {
  window.__listen = "Regions. Cited firewall lists, then an example country map that is not a live catalog.";
  const cited = [
    ["Commercial SBC signaling and media", "52.112.0.0/14 and 52.120.0.0/14. IPv6 signaling 2603:1063:400::/40. IPv6 media adds 2603:1063:100::/40. SIP/TLS TCP 5061.", "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan"],
    ["Teams client optimize", "52.112.0.0/14 and 52.122.0.0/15, plus IPv6 2603:1063::/38. This is not the SBC pair. 52.120.0.0/14 is not on the client optimize list.", "https://learn.microsoft.com/en-us/microsoft-365/enterprise/urls-and-ip-address-ranges"],
    ["GCC High and DoD", "Different proxy names and media prefixes. GCC High media 52.127.88.0/21. DoD media 52.127.64.0/21. Do not copy a commercial ACL into those clouds.", "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan"],
    ["Client QoS marks", "Audio UDP/TCP 50000–50019 DSCP 46. Browser joins do not use that range.", "https://learn.microsoft.com/en-us/microsoftteams/qos-in-teams"],
  ];
  const examples = [
    ["US", "United States", "+1", "Example: Calling Plans are a country catalog. Confirm the current list before you assign a SKU."],
    ["GB", "United Kingdom", "+44", "Example: emergency 999 and 112 must not be eaten by a catch-all dial-plan rule."],
    ["IN", "India", "+91", "Example: this campus teaches that Operator Connect for India is its own plan. Re-read the vendor page."],
    ["DE", "Germany", "+49", "Example: location-based routing is the tool when PSTN must stay with the local gateway."],
    ["JP", "Japan", "+81", "Example: media processors prefer a nearby region. You do not pick a street address for one."],
    ["AE", "United Arab Emirates", "+971", "Example: a traveler laptop should not egress through another country’s SBC."],
    ["BR", "Brazil", "+55", "Example study pin only. Not a claim about carrier coverage."],
    ["AU", "Australia", "+61", "Example study pin only. Not a data-residency promise."],
  ];
  return (
    crumbs([["Home", "#/"], ["Regions", ""]]) +
    '<p class="kicker">Places · checked 15 October 2026</p><h1>Regions</h1>' +
    '<p class="lede">Two lists are facts from Microsoft’s pages. The country grid below is an example study map, not a live PSTN catalog and not a data-residency table.</p>' +
    '<div class="region-grid">' + examples.map((row) => (
      '<article class="panel holo region-card"><p class="flag" aria-hidden="true">' + esc(row[0]) + '</p><h2>' + esc(row[1]) + '</h2><p class="kicker">' + esc(row[2]) + '</p><p><span class="tag warn">Example</span> ' + esc(row[3]) + "</p></article>"
    )).join("") + "</div>" +
    "<h2>Cited network facts</h2>" +
    fieldTable(["What", "Fact", "Source"], cited.map((row) => [
      esc(row[0]),
      esc(row[1]),
      '<a href="' + esc(row[2]) + '">Microsoft Learn</a>',
    ])) +
    '<p class="tiny">Accessed 15 October 2026 for the firewall rows. The country cards stay labeled Example. The vendor page wins when they disagree.</p>'
  );
}

function extraHits() {
  return [
    { href: "#/field", title: "Field desk", kind: "Guide" },
    { href: "#/migrate", title: "Migration and cutover", kind: "Guide" },
    { href: "#/ports", title: "Ports and protocols", kind: "Guide" },
    { href: "#/game", title: "Ports mastery game", kind: "Game" },
    { href: "#/explorer", title: "Flow map explorer", kind: "Guide" },
    { href: "#/sandbox", title: "Call-flow sandbox", kind: "Lab" },
    { href: "#/daily", title: "Daily challenge", kind: "Game" },
    { href: "#/diagrams", title: "Diagram atlas", kind: "Guide" },
    { href: "#/flows", title: "Animated flows", kind: "Guide" },
    { href: "#/play", title: "Play", kind: "Game" },
    { href: "#/downloads", title: "Cheat Codes and downloads", kind: "Guide" },
    { href: "#/career", title: "Career and certification paths", kind: "Guide" },
    { href: "#/regions", title: "Regions and residency notes", kind: "Guide" },
    { href: "#/news", title: "What is new", kind: "Guide" },
  ];
}

function fieldTable(headers, rows) {
  const head = "<tr>" + headers.map((cell) => "<th>" + esc(cell) + "</th>").join("") + "</tr>";
  const body = rows.map((row) => "<tr>" + row.map((cell) => "<td>" + cell + "</td>").join("") + "</tr>").join("");
  return '<div class="table-wrap"><table class="ports">' + head + body + "</table></div>";
}

function renderField() {
  window.__listen = "Field desk. Fundamentals through career, with migration, ports, and the cheat-code downloads.";
  const cards = FIELD_LINKS.map((item) => '<a class="card" href="' + item[0] + '"><h3>' + esc(item[1]) + "</h3><p>" + esc(item[2]) + "</p></a>").join("");
  return (
    '<p class="kicker">Gap audit · 15 October 2026</p><h1>Field desk</h1>' +
    '<p class="lede">Every section below is a real page in this campus. The seventeen tracks still hold the long lessons. This desk is the map when you need a checklist, a port, or a printable sheet.</p>' +
    '<div class="lab-grid">' + cards + "</div>" +
    '<article class="panel"><h2>Named customers</h2><p>This lab does not claim a named deployment. Integration patterns for CUCM, Webex, UCCE, Genesys, and Amazon Connect are teaching bridges on the coexistence and ecosystem tracks. <span class="tag warn">Unverified</span> as a story about any real company.</p>' +
    '<p class="tiny">Older Origin rooms from cypher-microsoft-voice-cc-lab were not readable from this build environment, so they are not pasted in here. The facts on this desk come from the lessons already cited in this repo.</p></article>'
  );
}

function renderMigrate() {
  window.__listen = "Migration checklist. Inventory, identity, numbers, the SBC, a pilot, cutover, and hypercare. One owner for normalization.";
  const steps = [
    ["inv", "Inventory", "Export users, devices, numbers, call flows, analog endpoints, hunt groups, and the hours the business actually answers. Keep the export. Do not start with a firewall ticket."],
    ["id", "Identity", "Users who will take Direct Routing must be homed online and out of Islands mode. Resource accounts exist in Entra ID before they get a voice app."],
    ["num", "Numbers", "Pick one owner for normalization. Write the E.164 plan, the ranges that stay on CUCM, and the ranges that move. Porting dates belong to the carrier, not to this page."],
    ["sbc", "SBC", "Certified controller, verified domain, public certificate whose name matches the paired FQDN, TCP 5061 to all three commercial proxies, and both media ranges unless bypass is a deliberate design."],
    ["pilot", "Pilot", "Ten users, one site, one route, OPTIONS healthy, a test emergency location that is not a real 911 call. Record the Call-ID."],
    ["cut", "Cutover", "Move a site when the pilot’s route, location, and recording policy are boring. Dual-running trombones through the SBC. That is expected, and it is not the steady state."],
    ["hyper", "Hypercare", "Watch OPTIONS, CQD for the new subnet, Call Analytics for the loud one user, and the resource-account licenses. Roll back is the voice route, not a hope."],
  ];
  const saved = state.cutover || {};
  const list = steps.map((step) => {
    const on = saved[step[0]] ? " checked" : "";
    return '<label class="row cut-row"><input type="checkbox" data-cut="' + step[0] + '"' + on + "><span><strong>" + esc(step[1]) + ".</strong> " + esc(step[2]) + "</span></label>";
  }).join("");
  return (
    '<p class="kicker"><a href="#/field">Field desk</a> · coexistence</p><h1>Migration and cutover</h1>' +
    '<p class="lede">A teaching checklist for a move onto Teams Phone. It is not a carrier porting agreement and it is not a Microsoft runbook. Check the boxes in this browser only.</p>' +
    '<div class="panel">' + list + "</div>" +
    '<p id="cut-out" class="tiny"></p>' +
    '<article class="panel"><h2>Where the long version lives</h2><ul>' +
    '<li><a href="#/lesson/t14-cucm">CUCM and CUBE</a></li>' +
    '<li><a href="#/lesson/t14-webex">Webex calling interop</a></li>' +
    '<li><a href="#/lesson/t14-ucce">UCCE during a move</a></li>' +
    '<li><a href="#/lesson/t14-others">Genesys and Amazon Connect</a></li>' +
    '<li><a href="#/lab/coexist">Coexistence bridge lab</a> and <a href="#/lab/cucm-map">CUCM translator</a></li>' +
    "</ul><p class=\"tiny\">Sources: <a href=\"https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan\">Plan Direct Routing</a>, <a href=\"https://learn.microsoft.com/en-us/microsoftteams/pstn-connectivity\">PSTN connectivity options</a>, <a href=\"https://learn.microsoft.com/en-us/microsoftteams/teams-contact-center\">Teams contact center integration models</a>. Accessed 14 October 2026. Carrier SLAs and a named customer’s freeze window are <span class=\"tag warn\">Unverified</span> here.</p></article>"
  );
}

function renderPorts() {
  window.__listen = "Ports and protocols. 5061 for signaling. Media on the UDP ranges. Client QoS ports from the QoS article.";
  const rows = PORT_ROWS.map((row) => [
    esc(row[0]),
    esc(row[1]),
    "<strong>" + esc(row[2]) + "</strong>",
    esc(row[3]),
    '<a href="' + esc(row[4]) + '">Source</a>',
  ]);
  return (
    '<p class="kicker"><a href="#/field">Field desk</a></p><h1>Ports and protocols</h1>' +
    '<p class="lede">Two firewall lists, checked 15 October 2026. Direct Routing SBC signaling and media are not the Teams client optimize ranges. Government clouds use different proxy names. The Microsoft pages win over this table.</p>' +
    fieldTable(["Flow", "Proto", "Port", "What it is for", "Source"], rows) +
    "<h2>Ladder</h2>" +
    flowSvg([
      { label: "Client", detail: "50000 audio" },
      { label: "Teams", detail: "TLS 5061" },
      { label: "SBC", detail: "OPTIONS" },
      { label: "Media", detail: "UDP ranges" },
      { label: "Carrier", detail: "PSTN" },
    ], "Commercial Direct Routing") +
    '<p class="row"><a class="primary" href="#/game">Play the ports game</a><a class="ghost" href="#/explorer">Open the flow explorer</a><a class="ghost" href="downloads/ports-protocols.html">Printable sheet</a></p>' +
    '<p class="tiny">QoS source: <a href="https://learn.microsoft.com/en-us/microsoftteams/qos-in-teams">QoS in Microsoft Teams</a>. Direct Routing source: <a href="https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan">Plan Direct Routing</a>. Client ranges: <a href="https://learn.microsoft.com/en-us/microsoft-365/enterprise/urls-and-ip-address-ranges">Office 365 URLs and IP address ranges</a> and the worldwide endpoints feed. Accessed 15 October 2026.</p>'
  );
}

function renderExplorer() {
  window.__listen = "Flow map explorer. Select a hop and read the port, the failure, and the lesson.";
  const hops = [
    ["client", "Teams client", "Audio 50000–50019 when the desktop client can bind it. Browsers do not use that range.", "#/lesson/t04-qos"],
    ["proxy", "SIP proxy", "TCP 5061 to sip, sip2, and sip3. A firewall that allows only today’s DNS answer fails later.", "#/lesson/t05-dr"],
    ["sbc", "Certified SBC", "Certificate name matches the paired FQDN. OPTIONS must return 200 OK.", "#/lesson/t10-sbc"],
    ["media", "Media", "UDP 3478–3481 and 49152–53247, or a bypass path you meant to allow.", "#/lab/bypass"],
    ["e911", "Emergency location", "A subnet or BSSID needs a civic address. A VPN pool is not automatically the HQ.", "#/lab/e911-match"],
    ["record", "Recorder", "Certified application instance and a policy grant. The SBC is not the compliance recorder by default.", "#/lesson/t17-rec"],
  ];
  const buttons = hops.map((hop, index) => '<button type="button" class="choice" data-hop="' + index + '">' + esc(hop[1]) + "</button>").join("");
  return (
    '<p class="kicker"><a href="#/map">Mind map</a></p><h1>Flow map explorer</h1>' +
    '<p class="lede">The ecosystem mind map is the wide picture. This explorer is one commercial call, hop by hop.</p>' +
    flowSvg(hops.map((hop) => ({ label: hop[1], detail: "Select" })), "Explorer") +
    '<div class="choice-row">' + buttons + "</div>" +
    '<article class="panel" id="hop-out"><p>Select a hop.</p></article>'
  );
}

function renderCareer() {
  window.__listen = "Career paths. Teams administration, contact center, SBC specialty, and the fundamentals that support them.";
  return (
    '<p class="kicker"><a href="#/exam">Exam status</a></p><h1>Career and certification paths</h1>' +
    '<p class="lede">Roles people actually hire for, next to the exams this campus will name. Seats move. Read the exam page again before you book. Checked 14 October 2026.</p>' +
    fieldTable(
      ["Path", "You spend the day on", "Exam this lab will name", "Start here"],
      [
        ["Teams voice engineer", "Tenant, licenses, dial plans, Direct Routing", "MS-700, still live", '<a href="#/lesson/t16-ms700">MS-700</a>'],
        ["Contact-center builder", "Queues, routing, Copilot, channels", "AB-250", '<a href="#/lesson/t13-exam">AB-250 map</a>'],
        ["SBC specialist", "Certificates, OPTIONS, media, failover", "No separate Microsoft SBC exam on this board", '<a href="#/track/t10">SBC track</a>'],
        ["Recording and compliance", "Certified recorder, policy, notification", "SC-900 for the trust language, not as a voice exam", '<a href="#/lesson/t17-rec">Recording</a>'],
        ["Cloud fundamentals", "Identity, Azure context for ACS and Speech", "AZ-900 and SC-900, both live on this board", '<a href="#/lesson/t16-fund">Fundamentals</a>'],
      ]
    ) +
    '<article class="panel"><h2>Interview loop</h2><ol>' +
    "<li>Draw the call before you name a cmdlet.</li>" +
    "<li>Say which license is missing, in one sentence.</li>" +
    "<li>Separate a CQD building from a Call Analytics user.</li>" +
    "<li>Refuse Islands mode for Direct Routing without a speech.</li>" +
    "</ol><p><a href=\"#/tips\">Tips and traps</a> · <a href=\"#/boss\">Boss exams</a> · <a href=\"#/lesson/t16-paths\">Learning paths that match the job</a></p></article>" +
    '<p class="tiny">MB-280 retired 31 July 2026. AB-210 is its successor and is in beta. AB-210 is not the contact-center exam and it does not replace MS-700. <span class="tag warn">Unverified</span>: salary bands, visa rules, and which employer requires which exam.</p>'
  );
}

function renderNews() {
  window.__listen = "What is new, as checked on 14 October 2026. Anything past the status board is marked unverified.";
  const rows = [
    ["14 Oct 2026", "MS-700 still live", "Skills update scheduled 27 October 2026. No replacement exam.", "Cited on the status board", "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ms-700"],
    ["31 Jul 2026", "MB-280 retired", "Successor on this board is AB-210, which is in beta.", "Cited", "https://learn.microsoft.com/en-us/credentials/support/retired-certification-exams"],
    ["2026", "AB-250", "Dynamics 365 Contact Center exam. Confirm the live seat before you book.", "Cited, seat can move", "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-250"],
    ["21 Oct 2026", "SC-900 English update", "Scheduled on the certification page this lab read.", "Cited as a schedule", "https://learn.microsoft.com/en-us/credentials/certifications/security-compliance-and-identity-fundamentals/"],
    ["31 Mar 2026", "MS-900 retired", "Do not book it.", "Cited", "https://learn.microsoft.com/en-us/credentials/support/retired-certification-exams"],
    ["30 Jun 2026", "AI-900 retired", "Use Speech and Copilot Studio docs instead.", "Cited", "https://learn.microsoft.com/en-us/credentials/support/retired-certification-exams"],
    ["2026", "Feature rumors", "New SBC firmware, a specific Copilot button, or a price change.", "Unverified", ""],
  ];
  const body = rows.map((row) => {
    const mark = row[3] === "Unverified" ? '<span class="tag warn">Unverified</span>' : esc(row[3]);
    const link = row[4] ? '<a href="' + esc(row[4]) + '">Learn</a>' : "—";
    return [esc(row[0]), esc(row[1]), esc(row[2]), mark, link];
  });
  return (
    '<p class="kicker">Checked 14 October 2026</p><h1>What is new</h1>' +
    '<p class="lede">Only rows this campus already stands behind. The last row is the bucket for everything else.</p>' +
    '<div class="callout">' + esc(DATA.examFact || "") + "</div>" +
    fieldTable(["When", "Item", "What this lab will say", "Standing", "Link"], body) +
    '<p><a href="#/charts">Certification and feature charts</a> · <a href="#/sources">Source list</a></p>'
  );
}

function renderGame() {
  window.__listen = "Ports mastery game. Eight questions from the firewall matrix.";
  gameCursor = 0;
  gameScore = 0;
  gameLocked = false;
  return (
    '<p class="kicker">Cheat codes</p><h1>Ports mastery</h1>' +
    '<p class="lede">Eight questions. The best score in this browser is ' + (state.portsBest || 0) + " / " + GAME_ROUNDS.length + ".</p>" +
    '<article class="panel" id="game-out"></article>' +
    '<div id="share-slot"></div>'
  );
}

function paintGame() {
  const slot = $("#game-out");
  if (!slot) return;
  if (gameCursor >= GAME_ROUNDS.length) {
    if ((state.portsBest || 0) < gameScore) state.portsBest = gameScore;
    markStudy();
    slot.innerHTML = "<h2>" + gameScore + " / " + GAME_ROUNDS.length + "</h2><p>Score saved in this browser.</p>";
    $("#share-slot").innerHTML = shareCardHtml("Ports mastery", gameScore + " / " + GAME_ROUNDS.length, "Firewall matrix for Teams voice");
    wireShare("Ports mastery", gameScore + "/" + GAME_ROUNDS.length, "Teams voice ports");
    return;
  }
  const round = GAME_ROUNDS[gameCursor];
  slot.innerHTML = "<h2>Round " + (gameCursor + 1) + "</h2><p>" + esc(round.q) + "</p>" +
    round.choices.map((choice, index) => '<button type="button" class="choice" data-g="' + index + '">' + esc(choice) + "</button>").join("");
  $$("[data-g]").forEach((button) => {
    button.onclick = function () {
      if (gameLocked) return;
      gameLocked = true;
      const pick = Number(button.getAttribute("data-g"));
      if (pick === round.answer) gameScore += 1;
      $$("[data-g]").forEach((peer, index) => {
        if (index === round.answer) peer.classList.add("right");
        if (index === pick && pick !== round.answer) peer.classList.add("wrong");
      });
      slot.insertAdjacentHTML("beforeend", "<p>" + esc(round.why) + '</p><button type="button" class="primary" id="game-next">Next</button>');
      $("#game-next").onclick = function () {
        gameCursor += 1;
        gameLocked = false;
        paintGame();
      };
    };
  });
}

function dayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

function renderDaily() {
  const index = dayOfYear() % DAILY.length;
  const item = DAILY[index];
  const done = state.dailyDate === todayKey();
  window.__listen = "Daily challenge. One question, dated, saved in this browser.";
  return (
    '<p class="kicker">Day ' + dayOfYear() + "</p><h1>Daily challenge</h1>" +
    '<p class="lede">' + esc(todayKey()) + ". One question from the status board and the voice tracks. It changes with the date, not with a server.</p>" +
    '<article class="panel"><h2>' + esc(item.q) + "</h2>" +
    item.choices.map((choice, i) => '<button type="button" class="choice" data-d="' + i + '"' + (done ? " disabled" : "") + ">" + esc(choice) + "</button>").join("") +
    '<div id="daily-out">' + (done ? "<p>You already answered today. " + (state.dailyOk ? "It matched." : "The note is in the sheet you opened.") + "</p>" : "") + "</div></article>"
  );
}

function renderSandbox() {
  window.__listen = "Call-flow sandbox. Stack SIP pieces and play them. Emergency wants a location before a queue.";
  sandboxSeq = [];
  const tray = FLOW_BLOCKS.map((block) => '<button type="button" class="choice" data-block="' + block.id + '">' + esc(block.label) + "</button>").join("");
  return (
    '<p class="kicker">Build a call</p><h1>Call-flow sandbox</h1>' +
    '<p class="lede">Add blocks, then play. This is a teaching ladder. It does not place a call. Do not test emergency calling against a live network.</p>' +
    '<div class="choice-row">' + tray + "</div>" +
    '<div class="row"><button type="button" class="ghost" id="sand-clear">Clear</button><button type="button" class="primary" id="sand-play">Play</button></div>' +
    '<ol id="sand-seq"></ol><div id="sand-out"></div>'
  );
}

function paintSandbox() {
  const list = $("#sand-seq");
  if (!list) return;
  list.innerHTML = sandboxSeq.map((id) => {
    const block = FLOW_BLOCKS.find((item) => item.id === id);
    return "<li><strong>" + esc(block.label) + ".</strong> " + esc(block.detail) + "</li>";
  }).join("") || "<li>Empty. OPTIONS or an emergency divert usually comes before a casual INVITE.</li>";
}

function playSandbox() {
  const seq = sandboxSeq.slice();
  const notes = [];
  if (!seq.length) notes.push("Nothing to play.");
  if (seq[0] === "e911") notes.push("Emergency is first. Resolve a dispatchable location before any queue music.");
  else if (seq[0] !== "options" && seq[0] !== "invite") notes.push("The ladder usually starts with OPTIONS health or an INVITE.");
  if (seq.indexOf("media") !== -1 && seq.indexOf("ok") === -1) notes.push("Media is on the ladder before 200 OK. Early media exists, but a two-way SRTP session still wants an answer.");
  if (seq.indexOf("media") !== -1 && seq.indexOf("ok") !== -1 && seq.indexOf("media") < seq.indexOf("ok")) notes.push("RTP is drawn before the answer. Check whether you meant early media.");
  if (seq.indexOf("record") !== -1) notes.push("Recording stays on the ladder only when a certified policy is granted. The block does not create that policy.");
  if (seq.indexOf("bye") === -1 && seq.length) notes.push("No BYE. The dialog is still up in this sketch.");
  if (seq.indexOf("invite") !== -1 && seq.indexOf("ack") === -1 && seq.indexOf("ok") !== -1) notes.push("200 OK without ACK leaves the INVITE transaction open.");
  if (!notes.length) notes.push("The sketch is internally consistent. It is still not a packet capture.");
  const steps = seq.map((id) => {
    const block = FLOW_BLOCKS.find((item) => item.id === id);
    return { label: block.label, detail: block.detail };
  });
  $("#sand-out").innerHTML = (steps.length ? flowSvg(steps, "Your ladder") : "") + "<ul>" + notes.map((line) => "<li>" + esc(line) + "</li>").join("") + "</ul>";
  state.sandboxOk = true;
  markStudy();
}

function shareCardHtml(title, score, detail) {
  return (
    '<article class="share-card" id="share-card">' +
    "<p class=\"kicker\">CypherMonkey Labs</p><h2>" + esc(title) + "</h2><p class=\"share-score\">" + esc(score) + "</p><p>" + esc(detail) + "</p>" +
    '<p class="tiny">cyphermonkeylabs.com · Independent study card. Not a vendor certificate.</p>' +
    '<div class="row"><button type="button" class="primary" id="share-png">Download card</button><button type="button" class="ghost" id="share-copy">Copy text</button></div>' +
    '<canvas id="share-canvas" width="1200" height="630" hidden></canvas></article>'
  );
}

function paintShareCanvas(title, score, detail) {
  const canvas = $("#share-canvas");
  if (!canvas) return null;
  const g = canvas.getContext("2d");
  g.fillStyle = "#07111c";
  g.fillRect(0, 0, 1200, 630);
  g.fillStyle = "#123";
  g.fillRect(36, 36, 1128, 558);
  g.strokeStyle = "#3ee0ff";
  g.lineWidth = 4;
  g.strokeRect(36, 36, 1128, 558);
  g.fillStyle = "#9be7ff";
  g.font = "28px sans-serif";
  g.fillText("CypherMonkey Labs", 72, 110);
  g.fillStyle = "#f8fafc";
  g.font = "64px sans-serif";
  g.fillText(title, 72, 220);
  g.fillStyle = "#f5d76e";
  g.font = "92px sans-serif";
  g.fillText(score, 72, 360);
  g.fillStyle = "#dbe7f5";
  g.font = "32px sans-serif";
  g.fillText(detail, 72, 440);
  g.font = "26px sans-serif";
  g.fillStyle = "#8fb4c9";
  g.fillText("https://cyphermonkeylabs.com", 72, 530);
  return canvas;
}

function wireShare(title, score, detail) {
  const png = $("#share-png");
  const copy = $("#share-copy");
  if (png) {
    png.onclick = function () {
      const canvas = paintShareCanvas(title, score, detail);
      if (!canvas) return;
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "voice-lab-card.png";
      link.click();
    };
  }
  if (copy) {
    copy.onclick = function () {
      const text = title + " — " + score + ". " + detail + ". Study card from the Microsoft Voice Lab. https://cyphermonkeylabs.com";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () { /* clipboard can be denied */ });
      }
    };
  }
}

async function renderDownloads() {
  window.__listen = "Cheat codes. Printable sheets, a flashcard deck, and the offline zip.";
  let items = [];
  try {
    const catalog = await fetchJson("downloads/catalog.json");
    items = catalog.items || [];
  } catch (err) {
    items = [];
  }
  const cards = items.map((item) => '<a class="card" href="' + esc(item.href) + '"><p class="kicker">' + esc(item.kind) + "</p><h3>" + esc(item.title) + "</h3><p>" + esc(item.blurb) + "</p></a>").join("");
  const fallback = items.length ? "" : '<p class="callout">The download catalog did not load. Open the campus from a local server so <code>downloads/catalog.json</code> can be fetched.</p>';
  return (
    crumbs([["Home", "#/"], ["Cheat Codes", ""]]) +
    '<p class="kicker">Offline</p><h1>Cheat Codes</h1>' +
    '<p class="lede">One-page sheets for ports, call flows, configuration, troubleshooting, and the glossary, plus a track sheet for every track. Each file carries the lab footer. Nothing is hosted on a CDN.</p>' +
    '<div class="hero-actions row">' +
    '<a class="primary" href="downloads/microsoft-voice-contact-center-lab.zip" download>Download the offline bundle</a>' +
    '<a class="ghost" href="downloads/flashcards.json" download>Flashcards JSON</a>' +
    '<a class="ghost" href="downloads/flashcards.html">Printable deck</a>' +
    "</div>" +
    fallback +
    '<div class="lab-grid">' + cards + "</div>" +
    '<p class="tiny">Sheets cite Microsoft Learn and the other sources already listed in this campus. They are not copies of vendor documents. Accessed 14 October 2026.</p>'
  );
}

function mountOnThisPage() {
  const heads = $$("#view h2");
  if (heads.length < 2) return;
  const nav = document.createElement("nav");
  nav.className = "reading";
  nav.setAttribute("aria-label", "On this page");
  const title = document.createElement("p");
  title.className = "kicker";
  title.textContent = "On this page";
  nav.appendChild(title);
  heads.forEach((head, index) => {
    if (!head.id) head.id = "sec-" + index;
    const link = document.createElement("a");
    link.href = "#" + head.id;
    link.textContent = head.textContent;
    nav.appendChild(link);
  });
  const view = $("#view");
  if (view && view.firstChild) view.insertBefore(nav, view.firstChild);
}

function wireExtras(root) {
  if (root === "migrate") {
    const paint = function () {
      const boxes = $$("[data-cut]");
      let n = 0;
      boxes.forEach((box) => {
        state.cutover[box.getAttribute("data-cut")] = box.checked;
        if (box.checked) n += 1;
      });
      save();
      const out = $("#cut-out");
      if (out) out.textContent = n + " of " + boxes.length + " cutover gates checked in this browser.";
    };
    $$("[data-cut]").forEach((box) => { box.onchange = paint; });
    paint();
  }
  if (root === "game") paintGame();
  if (root === "daily") {
    const index = dayOfYear() % DAILY.length;
    const item = DAILY[index];
    $$("[data-d]").forEach((button) => {
      button.onclick = function () {
        const pick = Number(button.getAttribute("data-d"));
        const ok = pick === item.answer;
        state.dailyDate = todayKey();
        state.dailyOk = ok;
        markStudy();
        $$("[data-d]").forEach((peer, i) => {
          if (i === item.answer) peer.classList.add("right");
          if (i === pick && !ok) peer.classList.add("wrong");
        });
        $("#daily-out").innerHTML = "<p>" + esc(item.why) + "</p>" + shareCardHtml("Daily challenge", ok ? "Matched" : "Review", todayKey());
        wireShare("Daily challenge", ok ? "Matched" : "Review", todayKey());
      };
    });
  }
  if (root === "sandbox") {
    $$("[data-block]").forEach((button) => {
      button.onclick = function () {
        sandboxSeq.push(button.getAttribute("data-block"));
        paintSandbox();
      };
    });
    $("#sand-clear").onclick = function () { sandboxSeq = []; paintSandbox(); $("#sand-out").innerHTML = ""; };
    $("#sand-play").onclick = playSandbox;
    paintSandbox();
  }
  if (root === "explorer") {
    const hops = [
      ["Teams client", "Audio 50000–50019 when the desktop client can bind it. Browsers do not use that range.", "#/track/t04"],
      ["SIP proxy", "TCP 5061 to sip, sip2, and sip3. Allow the published ranges, not one DNS answer.", "#/lesson/t05-dr"],
      ["Certified SBC", "The certificate name matches the paired FQDN. OPTIONS should return 200 OK.", "#/track/t10"],
      ["Media", "UDP 3478–3481 and 49152–53247, unless bypass is an intentional path.", "#/lab/bypass"],
      ["Emergency location", "Match a subnet or BSSID to a civic address. Do not borrow the HQ address for a VPN pool.", "#/lab/e911-match"],
      ["Recorder", "A certified recorder needs an application instance, an enabled policy, and a grant.", "#/lesson/t17-rec"],
    ];
    $$("[data-hop]").forEach((button) => {
      button.onclick = function () {
        const hop = hops[Number(button.getAttribute("data-hop"))];
        $("#hop-out").innerHTML = "<h2>" + esc(hop[0]) + "</h2><p>" + esc(hop[1]) + '</p><p><a href="' + hop[2] + '">Open the lesson or lab</a></p>';
      };
    });
  }
  if (root === "diagrams" || root === "flows") wireAtlas();
  if (root === "lesson" || root === "field" || root === "migrate" || root === "ports") mountOnThisPage();
  bindChartTips();
  wireArchitect();
}

function bindReadbar() {
  const bar = $("#readbar");
  if (!bar) return;
  const onScroll = function () {
    const node = document.documentElement;
    const max = node.scrollHeight - node.clientHeight;
    bar.style.width = (max > 0 ? (node.scrollTop / max) * 100 : 0) + "%";
  };
  if (window.__readbar) document.removeEventListener("scroll", window.__readbar);
  window.__readbar = onScroll;
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function cycleMascot() {
  const poses = ["idle", "wave", "think", "listen"];
  let index = 0;
  window.setInterval(function () {
    if (document.documentElement.dataset.motion === "reduce") return;
    index = (index + 1) % poses.length;
    $$(".monkey").forEach((node) => {
      if (node.getAttribute("data-fixed") === "1") return;
      node.dataset.pose = poses[index];
    });
  }, 7000);
  window.setInterval(function () {
    if (document.documentElement.dataset.motion === "reduce") return;
    $$(".monkey").forEach((node) => {
      const next = ((Number(node.dataset.look) || 0) + 1) % 4;
      node.dataset.look = String(next);
    });
  }, 180000);
}

function armKonami() {
  const code = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let cursor = 0;
  document.addEventListener("keydown", function (event) {
    const tag = event.target && event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key === code[cursor]) {
      cursor += 1;
      if (cursor === code.length) {
        cursor = 0;
        state.konami = true;
        save();
        $$(".monkey").forEach((node) => { node.dataset.pose = "celebrate"; });
        const egg = $("#egg");
        if (egg) egg.hidden = false;
        confetti();
      }
    } else {
      cursor = key === code[0] ? 1 : 0;
    }
  });
}

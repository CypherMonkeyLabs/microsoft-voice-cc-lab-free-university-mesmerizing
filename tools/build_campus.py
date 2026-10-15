#!/usr/bin/env python3
"""Assemble the campus as a shell plus on-demand track modules. No CDN."""

from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path

from build_atlas import main as build_atlas
from curriculum import build_payload
from tips import TIPS

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
CAMPUS = ROOT / "campus"
CHECKED = "2026-10-14"


def write_headings(payload: dict, data_dir: Path) -> None:
    from heading_packs import translations

    ids = [lesson["id"] for lesson in payload["lessons"]]
    pack = translations()
    missing = [item for item in ids if item not in pack]
    extra = [item for item in pack if item not in set(ids)]
    if missing or extra:
        raise SystemExit("headings mismatch missing=%s extra=%s" % (",".join(missing), ",".join(extra)))
    langs = ("es", "hi", "te", "fr", "de", "ja", "ar")
    out = {}
    for item in ids:
        row = pack[item]
        if tuple(row.keys()) != langs and set(row) != set(langs):
            raise SystemExit("heading langs " + item)
        for lang in langs:
            text = row.get(lang) or ""
            if not text.strip():
                raise SystemExit("empty heading %s %s" % (item, lang))
        out[item] = {lang: row[lang] for lang in langs}
    write_json(data_dir / "headings.json", out)


def dump(obj: object) -> str:
    return json.dumps(obj, ensure_ascii=True, separators=(",", ":")).replace("<", "\\u003c")


def write_json(path: Path, obj: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(dump(obj), encoding="utf-8")


def figure_index(lessons: list[dict]) -> tuple[list[dict], list[dict]]:
    illustrations = []
    flows = []
    for lesson in lessons:
        for fig in lesson.get("figures") or []:
            row = {
                "id": fig["id"],
                "lesson": lesson["id"],
                "title": fig.get("title") or "",
                "animated": bool(fig.get("animated")),
            }
            illustrations.append(row)
            if fig.get("animated"):
                flows.append(row)
    return illustrations, flows


def main() -> None:
    import shutil as shutil_mod

    if shutil_mod.which("espeak-ng"):
        from make_audio import build as build_audio

        build_audio()
    else:
        print("espeak-ng missing; keeping the audio already in campus/audio")

    payload = build_payload()
    illustrations, flows = figure_index(payload["lessons"])
    payload["illustrations"] = illustrations
    payload["flows"] = flows

    data_dir = CAMPUS / "data"
    if data_dir.exists():
        shutil.rmtree(data_dir)
    tracks_dir = data_dir / "tracks"
    tracks_dir.mkdir(parents=True)

    by_track: dict[str, list[dict]] = {track["id"]: [] for track in payload["tracks"]}
    for lesson in payload["lessons"]:
        by_track.setdefault(lesson["track"], []).append(lesson)
    for track_id, lessons in by_track.items():
        write_json(tracks_dir / f"{track_id}.json", {"id": track_id, "lessons": lessons})

    write_json(data_dir / "quiz.json", payload["quiz"])
    write_json(data_dir / "cards.json", payload["cards"])
    write_json(data_dir / "glossary.json", payload["glossary"])
    write_json(data_dir / "charts.json", payload["charts"])
    write_json(data_dir / "bosses.json", payload["bosses"])

    lesson_index = [
        {
            "id": lesson["id"],
            "track": lesson["track"],
            "title": lesson["title"],
            "minutes": lesson["minutes"],
            "say": lesson["say"],
            "tryLab": lesson.get("tryLab"),
        }
        for lesson in payload["lessons"]
    ]
    term_index = [{"term": row["term"], "track": row["track"]} for row in payload["glossary"]]
    manifest = {
        "checked": payload["checked"],
        "examFact": payload["examFact"],
        "tracks": payload["tracks"],
        "lessonIndex": lesson_index,
        "termIndex": term_index,
        "labs": payload["labs"],
        "exams": payload["exams"],
        "sources": payload["sources"],
        "audio": payload["audio"],
        "scenarios": payload["scenarios"],
        "map": payload["map"],
        "faults": payload["faults"],
        "illustrations": illustrations,
        "flows": flows,
        "tips": TIPS,
        "counts": {
            "tracks": len(payload["tracks"]),
            "lessons": len(payload["lessons"]),
            "labs": len(payload["labs"]),
            "quiz": len(payload["quiz"]),
            "cards": len(payload["cards"]),
            "scenarios": len(payload["scenarios"]),
            "glossary": len(payload["glossary"]),
            "illustrations": len(illustrations),
            "flows": len(flows),
            "charts": len(payload["charts"]),
            "faults": len(payload["faults"]),
            "bosses": len(payload["bosses"]),
            "audio": len(payload["audio"]),
            "sources": len(payload["sources"]),
        },
    }
    write_json(data_dir / "manifest.json", manifest)

    css = (SRC / "campus.css").read_text(encoding="utf-8")
    (CAMPUS / "app.css").write_text(css, encoding="utf-8")
    app = "\n".join(
        [
            (SRC / "teaching.js").read_text(encoding="utf-8"),
            (SRC / "studios.js").read_text(encoding="utf-8"),
            (SRC / "field.js").read_text(encoding="utf-8"),
            (SRC / "campus.js").read_text(encoding="utf-8"),
        ]
    )
    (CAMPUS / "app.js").write_text(app, encoding="utf-8")
    studios = CAMPUS / "studios"
    studios.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(SRC / "studios" / "topology.js", studios / "topology.js")
    shutil.copyfile(SRC / "studios" / "hero.js", studios / "hero.js")
    shutil.copyfile(SRC / "studios" / "icons.js", studios / "icons.js")
    write_headings(payload, data_dir)
    shutil.copyfile(SRC / "effects.js", CAMPUS / "effects.js")
    build_atlas()

    version = hashlib.sha256(app.encode("utf-8")).hexdigest()[:12]
    precache = [
        "./",
        "./index.html",
        "./app.css",
        "./app.js",
        "./studios/topology.js",
        "./studios/hero.js",
        "./studios/icons.js",
        "./data/headings.json",
        "./vendor/postprocessing/EffectComposer.js",
        "./vendor/postprocessing/RenderPass.js",
        "./vendor/postprocessing/ShaderPass.js",
        "./vendor/postprocessing/MaskPass.js",
        "./vendor/postprocessing/Pass.js",
        "./vendor/postprocessing/UnrealBloomPass.js",
        "./vendor/shaders/CopyShader.js",
        "./vendor/shaders/LuminosityHighPassShader.js",
        "./vendor/three.module.min.js",
        "./vendor/OrbitControls.js",
        "./og-card.png",
        "./data/manifest.json",
        "./data/quiz.json",
        "./data/cards.json",
        "./data/glossary.json",
        "./data/charts.json",
        "./data/bosses.json",
        "./data/atlas.json",
        "./effects.js",
        "./vendor/anime.esm.min.js",
        "./vendor/rough.esm.js",
        "./vendor/d3.min.js",
        "./vendor/confetti.browser.js",
    ]
    for track in payload["tracks"]:
        precache.append(f"./data/tracks/{track['id']}.json")
    audio_dir = CAMPUS / "audio"
    if audio_dir.is_dir():
        for pattern in ("*.wav", "*.mp3"):
            for clip in sorted(audio_dir.glob(pattern)):
                precache.append("./audio/" + clip.name)
    downloads = CAMPUS / "downloads"
    if downloads.is_dir():
        for item in sorted(downloads.iterdir()):
            if item.suffix in {".html", ".json"} and item.stat().st_size < 1_500_000:
                precache.append("./downloads/" + item.name)
    sw = SW_TEMPLATE.format(version=version, precache=json.dumps(precache, indent=2))
    (CAMPUS / "sw.js").write_text(sw, encoding="utf-8")

    html = HTML_TEMPLATE.format(css_href="app.css", checked=CHECKED)
    (CAMPUS / "index.html").write_text(html, encoding="utf-8")

    shell = (
        (CAMPUS / "index.html").stat().st_size
        + (CAMPUS / "app.css").stat().st_size
        + (CAMPUS / "app.js").stat().st_size
        + (data_dir / "manifest.json").stat().st_size
    )
    print(f"wrote {CAMPUS / 'index.html'}")
    print(f"first-load bytes {shell} (html+css+js+manifest)")
    print(
        "tracks", len(payload["tracks"]),
        "lessons", len(payload["lessons"]),
        "labs", len(payload["labs"]),
        "quiz", len(payload["quiz"]),
        "cards", len(payload["cards"]),
        "scenarios", len(payload["scenarios"]),
        "glossary", len(payload["glossary"]),
        "illustrations", len(illustrations),
        "flows", len(flows),
    )


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en" data-theme="neon">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Microsoft Voice &amp; Contact Center Lab</title>
<meta name="description" content="Free offline campus for Teams Phone, Direct Routing, Dynamics 365 Contact Center, and the systems around the call. No CDN. Checked {checked}.">
<meta property="og:title" content="Microsoft Voice &amp; Contact Center Lab">
<meta property="og:description" content="A free offline campus for Teams voice and Microsoft contact-center work. Labs, drills, and a cited status board. Checked {checked}.">
<meta property="og:type" content="website">
<meta property="og:image" content="og-card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Microsoft Voice and Contact Center Lab, an offline study campus for Teams Phone and contact center engineering.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Microsoft Voice &amp; Contact Center Lab">
<meta name="twitter:description" content="Free offline Teams voice and contact-center campus. Zero-key labs, quiz, and ecosystem map. Checked {checked}.">
<meta name="twitter:image" content="og-card.png">
<meta name="twitter:image:alt" content="Microsoft Voice and Contact Center Lab card.">
<link rel="stylesheet" href="{css_href}">
<script type="importmap">
{{"imports":{{"three":"./vendor/three.module.min.js"}}}}
</script>
<script>
try {{
  var saved = JSON.parse(localStorage.getItem("mvcc-lab-v1") || "{{}}");
  var theme = saved.theme || "neon";
  document.documentElement.dataset.theme = theme;
  if (saved.lang === "ar") document.documentElement.dir = "rtl";
  if (saved.lang) document.documentElement.lang = saved.lang;
  document.documentElement.dataset.font = saved.font || "md";
  var motion = saved.reduceMotion || "system";
  var reduce = motion === "reduce" || (motion !== "full" && window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  document.documentElement.dataset.motion = reduce ? "reduce" : "full";
}} catch (err) {{}}
</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="readbar" id="readbar" aria-hidden="true"></div>
<header class="top">
  <div class="link-rail">
  <div class="top-row">
  <button class="icon-btn menu-btn" id="menu" type="button" aria-label="Open the track menu">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>
  </button>
  <a class="brand" href="#/">
    <svg class="monkey mini" data-look="0" viewBox="0 0 64 72" aria-hidden="true">
      <path class="tail" d="M46 54c10 2 14 12 8 16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"></path>
      <circle cx="32" cy="28" r="14" fill="var(--cc-accent-3)"></circle>
      <circle class="ear" cx="18" cy="26" r="5" fill="var(--cc-accent-4)"></circle>
      <circle class="ear" cx="46" cy="26" r="5" fill="var(--cc-accent-4)"></circle>
      <g class="look look-1"><path d="M18 18h28v6H18z" fill="var(--cc-accent-1)"></path></g>
      <g class="look look-2"><polygon points="32,6 36,15 32,13 28,15" fill="var(--cc-accent-2)"></polygon></g>
      <g class="look look-3"><path d="M16 46h32v5H16z" fill="var(--cc-accent-4)"></path></g>
      <circle class="eye" cx="27" cy="27" r="1.6" fill="#1a1208"></circle>
      <circle class="eye" cx="37" cy="27" r="1.6" fill="#1a1208"></circle>
      <path class="smile" d="M27 33c2.2 2 7.8 2 10 0" fill="none" stroke="#1a1208" stroke-width="1.4" stroke-linecap="round"></path>
      <path class="headset" d="M20 24c0-8 24-8 24 0v6" fill="none" stroke="var(--cc-accent-1)" stroke-width="2"></path>
      <rect x="16" y="28" width="6" height="8" rx="2" fill="var(--cc-accent-1)"></rect>
      <rect x="42" y="28" width="6" height="8" rx="2" fill="var(--cc-accent-1)"></rect>
      <ellipse cx="32" cy="54" rx="14" ry="10" fill="var(--cc-accent-2)"></ellipse>
      <g class="arm"><path d="M20 50c-8 2-12 10-8 14" fill="none" stroke="var(--cc-accent-3)" stroke-width="3" stroke-linecap="round"></path></g>
    </svg>
    <span><b>Voice Lab</b><small>Teams phone campus</small></span>
  </a>
  <button class="search-btn" id="search" type="button">Search lessons, labs, and terms · Ctrl+K</button>
  <div class="top-meta">
    <span class="pill" id="streak">Streak 0</span>
    <span class="pill" id="done">0%</span>
    <span class="pill" id="ach-count">0 badges</span>
    <label class="lang-pick"><span class="visually-hidden">Language</span>
      <select id="lang" aria-label="Language">
        <option value="en">EN</option>
        <option value="es">ES</option>
        <option value="hi">HI</option>
        <option value="te">TE</option>
        <option value="fr">FR</option>
        <option value="de">DE</option>
        <option value="ja">JA</option>
        <option value="ar">AR</option>
      </select>
    </label>
    <button class="ghost theme-flip" id="theme-flip" type="button" data-i18n="light">Light</button>
    <button class="ghost theme-cycle" id="theme-cycle" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="theme-pop">Theme</button>
    <a class="icon-btn" id="settings" href="#/settings" aria-label="Settings">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"></circle><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>
    </a>
  </div>
  </div>
  <div class="rail-scroll">
  <nav class="skybar" aria-label="CypherMonkey">
    <a href="https://cyphermonkeylabs.com">CypherMonkey Labs</a>
    <a href="https://linktr.ee/cyphermonkey">Linktree</a>
    <a href="https://github.com/cipher0x9/microsoft-voice-cc-lab-free-university-mesmerizing/issues">Rate, comment, help</a>
    <a href="https://dev.to/cyphermonkey">DEV</a>
    <a href="https://huggingface.co/Cypher0x9">Hugging Face</a>
    <a href="https://x.com/Cypher0x9">X</a>
    <a id="offline-dl" href="downloads/microsoft-voice-contact-center-lab.zip" download>Download offline</a>
  </nav>
  <nav class="primary-nav" id="primary-nav" aria-label="Sections">
    <a href="#/diagrams" data-i18n="diagrams">Diagrams</a>
    <a href="#/flows" data-i18n="flows">Flows</a>
    <a href="#/charts" data-i18n="charts">Charts</a>
    <a href="#/downloads" data-i18n="codes">Cheat Codes</a>
    <a href="#/play" data-i18n="play">Play</a>
    <a href="#/map" data-i18n="eco">Ecosystem</a>
    <a href="#/downloads" data-i18n="downloads">Downloads</a>
    <a href="#/career" data-i18n="careers">Careers</a>
  </nav>
  </div>
  </div>
</header>
<div id="theme-pop" class="theme-pop" hidden role="dialog" aria-label="Theme"></div>
<div class="shell">
  <nav id="nav" class="nav" aria-label="Campus"></nav>
  <main id="main" tabindex="-1">
    <h1 id="view-title">Microsoft Voice &amp; Contact Center Lab</h1>
    <div id="view"><p class="loading">Opening the campus.</p></div>
  </main>
</div>
<nav class="bottom-nav" aria-label="Mobile">
  <a href="#/diagrams" data-tab="diagrams" data-i18n="diagrams">Diagrams</a>
  <a href="#/flows" data-tab="flows" data-i18n="flows">Flows</a>
  <a href="#/charts" data-tab="charts" data-i18n="charts">Charts</a>
  <a href="#/downloads" data-tab="downloads" data-i18n="codesShort">Codes</a>
  <a href="#/play" data-tab="play" data-i18n="play">Play</a>
</nav>
<div class="dock" role="region" aria-label="Section audio">
  <button id="listen" type="button">Listen</button>
  <p id="transcript">Open a lesson. Listen uses a voice already installed in this browser. Nothing is uploaded.</p>
  <label>Rate <input id="rate" type="range" min="0.75" max="1.5" step="0.05" value="1" aria-label="Speech rate"></label>
</div>
<div id="palette" class="palette" hidden>
  <div class="box" role="dialog" aria-modal="true" aria-label="Search">
    <input id="q" type="search" placeholder="Search lessons, labs, terms, scenarios" aria-label="Search">
    <div id="hits" class="hits"></div>
  </div>
</div>
<footer class="site-foot">
  <svg class="monkey" id="monkey" data-pose="idle" data-look="2" viewBox="0 0 64 72" aria-hidden="true">
    <path class="tail" d="M46 54c10 2 14 12 8 16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"></path>
    <circle cx="32" cy="28" r="14" fill="var(--cc-accent-3)"></circle>
    <circle class="ear" cx="18" cy="26" r="5" fill="var(--cc-accent-4)"></circle>
    <circle class="ear" cx="46" cy="26" r="5" fill="var(--cc-accent-4)"></circle>
    <g class="look look-1"><path d="M18 18h28v6H18z" fill="var(--cc-accent-1)"></path></g>
    <g class="look look-2"><polygon points="32,6 36,15 32,13 28,15" fill="var(--cc-accent-2)"></polygon></g>
    <g class="look look-3"><path d="M16 46h32v5H16z" fill="var(--cc-accent-4)"></path></g>
    <circle class="eye" cx="27" cy="27" r="1.6" fill="#1a1208"></circle>
    <circle class="eye" cx="37" cy="27" r="1.6" fill="#1a1208"></circle>
    <path class="smile" d="M27 33c2.2 2 7.8 2 10 0" fill="none" stroke="#1a1208" stroke-width="1.4" stroke-linecap="round"></path>
    <path class="headset" d="M20 24c0-8 24-8 24 0v6" fill="none" stroke="var(--cc-accent-1)" stroke-width="2"></path>
    <rect x="16" y="28" width="6" height="8" rx="2" fill="var(--cc-accent-1)"></rect>
    <rect x="42" y="28" width="6" height="8" rx="2" fill="var(--cc-accent-1)"></rect>
    <ellipse cx="32" cy="54" rx="14" ry="10" fill="var(--cc-accent-2)"></ellipse>
    <g class="arm"><path d="M20 50c-8 2-12 10-8 14" fill="none" stroke="var(--cc-accent-3)" stroke-width="3" stroke-linecap="round"></path></g>
  </svg>
  <p class="sig">CypherMonkey · Microsoft Voice &amp; Contact Center Lab</p>
  <p>Independent educational project, not affiliated with or endorsed by any vendor. Trademarks belong to their owners. MIT code, CC BY-NC-SA content.</p>
  <p><a href="https://cyphermonkeylabs.com/#contact">Report a concern</a> · <a href="https://cyphermonkeylabs.com/#contact">Work with us</a></p>
  <nav class="next-labs" aria-label="Other labs">
    <a href="https://cipher0x9.github.io/uc-lab-free-university-mesmerizing/">UC Lab</a>
    <a href="https://cipher0x9.github.io/webex-lab-free-university-mesmerizing/">Webex</a>
    <a href="https://cipher0x9.github.io/genesys-cloud-lab-free-university-mesmerizing/">Genesys</a>
    <a href="https://cipher0x9.github.io/amazon-connect-lab-free-university-mesmerizing/">Amazon Connect</a>
    <a href="https://cipher0x9.github.io/five9-lab-free-university-mesmerizing/">Five9</a>
    <a href="https://cipher0x9.github.io/nice-cxone-lab-free-university-mesmerizing/">NiCE CXone</a>
    <a href="https://cipher0x9.github.io/sip-universe-lab-free-university-mesmerizing/">SIP Universe</a>
    <a href="https://cipher0x9.github.io/ai-lab-free-university-mesmerizing/">AI Lab</a>
    <a href="https://cipher0x9.github.io/gemini-gems-free-gallery/">Gemini Gems</a>
  </nav>
</footer>
<div id="lightbox" class="lightbox" hidden>
  <div class="lb-frame" role="dialog" aria-modal="true" aria-labelledby="lb-title">
    <div class="lb-bar">
      <p id="lb-title">Diagram</p>
      <button type="button" class="ghost" id="lb-close">Close</button>
    </div>
    <div id="lb-stage"></div>
    <div class="lb-controls">
      <button type="button" class="primary" id="lb-play">Pause</button>
      <button type="button" class="ghost" id="lb-step">Step</button>
    </div>
    <p id="lb-legend" class="kicker"></p>
    <p id="lb-why"></p>
  </div>
</div>
<div id="egg" class="egg" hidden>
  <p>Operator mode. The monkey found the hidden keypad. This does not change a tenant.</p>
</div>
<noscript><p>This campus needs JavaScript. It does not load a CDN. Enable JavaScript in this browser and open the file again.</p></noscript>
<script type="module" src="effects.js"></script>
<script src="app.js" defer></script>
</body>
</html>
"""


SW_TEMPLATE = """/* Offline cache for the Voice Lab. Generated. Cache {version}. */
"use strict";
const CACHE = "mvcc-lab-{version}";
const PRECACHE = {precache};
self.addEventListener("install", function (event) {{
  event.waitUntil(caches.open(CACHE).then(function (cache) {{ return cache.addAll(PRECACHE); }}).then(function () {{ return self.skipWaiting(); }}));
}});
self.addEventListener("activate", function (event) {{
  event.waitUntil(caches.keys().then(function (keys) {{
    return Promise.all(keys.filter(function (key) {{ return key !== CACHE; }}).map(function (key) {{ return caches.delete(key); }}));
  }}).then(function () {{ return self.clients.claim(); }}));
}});
self.addEventListener("fetch", function (event) {{
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(function (cached) {{
    const fetched = fetch(event.request).then(function (response) {{
      if (response && response.ok) {{
        const copy = response.clone();
        caches.open(CACHE).then(function (cache) {{ cache.put(event.request, copy); }});
      }}
      return response;
    }}).catch(function () {{ return cached || caches.match("./index.html"); }});
    return cached || fetched;
  }}));
}});
"""


if __name__ == "__main__":
    main()

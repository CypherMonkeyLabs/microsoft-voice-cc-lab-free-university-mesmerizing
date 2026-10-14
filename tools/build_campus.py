#!/usr/bin/env python3
"""Assemble the single-file campus from local sources. No network."""

from __future__ import annotations

import json
from pathlib import Path

from curriculum import build_payload

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
CAMPUS = ROOT / "campus"
CHECKED = "2026-10-14"


def main() -> None:
    from make_audio import build as build_audio

    build_audio()
    payload = build_payload()
    css = (SRC / "campus.css").read_text(encoding="utf-8")
    teaching = (SRC / "teaching.js").read_text(encoding="utf-8")
    app = (SRC / "campus.js").read_text(encoding="utf-8")
    data = json.dumps(payload, ensure_ascii=True, separators=(",", ":")).replace("<", "\\u003c")
    html = HTML_TEMPLATE.format(css=css, data=data, js=teaching + "\n" + app, checked=CHECKED)
    CAMPUS.mkdir(parents=True, exist_ok=True)
    target = CAMPUS / "index.html"
    target.write_text(html, encoding="utf-8")
    print(f"wrote {target} ({target.stat().st_size} bytes)")
    print(
        "tracks", len(payload["tracks"]),
        "lessons", len(payload["lessons"]),
        "labs", len(payload["labs"]),
        "quiz", len(payload["quiz"]),
        "cards", len(payload["cards"]),
        "scenarios", len(payload["scenarios"]),
        "glossary", len(payload["glossary"]),
    )


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
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
<style>
{css}
</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <button class="icon-btn menu-btn" id="menu" type="button" aria-label="Open the track menu">Menu</button>
  <a class="brand" href="#/">
    <svg class="mark" viewBox="0 0 36 36" aria-hidden="true">
      <rect width="36" height="36" rx="10" fill="#102433"></rect>
      <path d="M6 22c4-8 8-8 12 0s8 8 12 0" fill="none" stroke="#3ee0c3" stroke-width="2"></path>
      <circle cx="18" cy="14" r="3" fill="#a89bff"></circle>
    </svg>
    <span><b>Voice Lab</b><small>Contact center campus</small></span>
  </a>
  <button class="search-btn" id="search" type="button">Search lessons, labs, and terms · Ctrl+K</button>
  <div class="top-meta">
    <span class="pill" id="streak">Streak 0</span>
    <span class="pill" id="done">0%</span>
    <span class="pill" id="ach-count">0 badges</span>
    <button class="icon-btn" id="theme" type="button" aria-label="Cycle color theme">Theme</button>
  </div>
</header>
<div class="shell">
  <nav id="nav" class="nav" aria-label="Campus"></nav>
  <main id="main" tabindex="-1"></main>
</div>
<div class="dock" role="region" aria-label="Section audio">
  <button id="listen" type="button">Listen</button>
  <p id="transcript">Open a lesson. Listen uses a voice already installed in this browser. Nothing is uploaded.</p>
  <label>Rate <input id="rate" type="range" min="0.8" max="1.25" step="0.05" value="1" aria-label="Speech rate"></label>
</div>
<div id="palette" class="palette" hidden>
  <div class="box" role="dialog" aria-modal="true" aria-label="Search">
    <input id="q" type="search" placeholder="Search lessons, labs, terms, scenarios" aria-label="Search">
    <div id="hits" class="hits"></div>
  </div>
</div>
<noscript><p>This campus needs JavaScript. It does not load a CDN. Enable JavaScript in this browser and open the file again.</p></noscript>
<script type="application/json" id="campus-data">{data}</script>
<script>
{js}
</script>
</body>
</html>
"""


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Check the generated campus file. No network."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAMPUS = ROOT / "campus"
HTML = CAMPUS / "index.html"
CARD = CAMPUS / "og-card.png"

REQUIRED_LABS = [
    "dr-path",
    "route-match",
    "dial-plan",
    "aa-cq",
    "sbc-check",
    "tls-hand",
    "cqd-fault",
    "license-pick",
    "cucm-map",
    "routing-designer",
    "acs-flow",
    "erlang",
    "exam-map",
    "record-policy",
    "integrate-map",
    "hook-plan",
    "e911-match",
]

ECOSYSTEM_NEEDLES = [
    "glossary",
    "mind map",
    "wfm",
    "compliance recording",
    "e911",
    "power bi",
    "crm",
    "copilot",
    "integration",
    "bridge",
    "hook",
]

BANNED = [
    "fonts.googleapis",
    "cdn.jsdelivr",
    "unpkg.com",
    "cdnjs.cloudflare",
    "ajax.googleapis",
]


def fail(message: str) -> None:
    print("FAIL", message)
    sys.exit(1)


def load_payload() -> dict:
    manifest = json.loads((CAMPUS / "data" / "manifest.json").read_text(encoding="utf-8"))
    lessons = []
    for track in manifest["tracks"]:
        pack = json.loads((CAMPUS / "data" / "tracks" / f"{track['id']}.json").read_text(encoding="utf-8"))
        lessons.extend(pack["lessons"])
    manifest["lessons"] = lessons
    manifest["quiz"] = json.loads((CAMPUS / "data" / "quiz.json").read_text(encoding="utf-8"))
    manifest["cards"] = json.loads((CAMPUS / "data" / "cards.json").read_text(encoding="utf-8"))
    manifest["glossary"] = json.loads((CAMPUS / "data" / "glossary.json").read_text(encoding="utf-8"))
    manifest["charts"] = json.loads((CAMPUS / "data" / "charts.json").read_text(encoding="utf-8"))
    manifest["bosses"] = json.loads((CAMPUS / "data" / "bosses.json").read_text(encoding="utf-8"))
    return manifest


def main() -> None:
    if not HTML.exists():
        fail(f"missing {HTML}")
    html = HTML.read_text(encoding="utf-8")
    css = (CAMPUS / "app.css").read_text(encoding="utf-8")
    js = (CAMPUS / "app.js").read_text(encoding="utf-8")
    sw = (CAMPUS / "sw.js").read_text(encoding="utf-8")
    effects = (CAMPUS / "effects.js").read_text(encoding="utf-8")
    manifest_text = (CAMPUS / "data" / "manifest.json").read_text(encoding="utf-8")
    text = "\n".join([html, css, js, sw, manifest_text, effects])
    lowered = text.lower()
    for needle in BANNED:
        if needle in lowered:
            fail(f"remote asset: {needle}")
    if re.search(r"<script[^>]+src=[\"']https?:", html, re.I):
        fail("remote script src")
    if re.search(r"<link[^>]+href=[\"']https?:", html, re.I):
        fail("remote stylesheet")
    if html.lower().count("<h1") != 1:
        fail(f"expected one h1 in the shell, found {html.lower().count('<h1')}")
    if "voiceschanged" not in js:
        fail("speech voices are not waited on")
    if "isRoboticEdge" not in js:
        fail("narration still defaults without an Edge check")
    for theme_name in ('data-theme="dark"', 'data-theme="hc"', 'data-theme="teams"', 'data-theme="futuristic"', 'data-theme="gaming"', 'data-theme="neon"', 'data-theme="light"'):
        if theme_name not in css:
            fail(f"missing theme {theme_name}")
    for needle in (
        "https://cyphermonkeylabs.com",
        "https://linktr.ee/cyphermonkey",
        "https://dev.to/cyphermonkey",
        "https://huggingface.co/Cypher0x9",
        "https://x.com/Cypher0x9",
        "downloads/microsoft-voice-contact-center-lab.zip",
        "Report a concern",
        "Work with us",
    ):
        if needle not in html:
            fail(f"chrome missing {needle}")
    if "linkedin" in html.lower() or "mailto:" in html.lower():
        fail("shell contains a banned contact")
    sheet = CAMPUS / "downloads" / "ports-protocols.html"
    if not sheet.exists():
        fail("ports cheat sheet missing")
    if "#/settings" not in js or "set-voice" not in js:
        fail("settings panel missing")
    if '#/track/t01' not in js or "redirectHash" not in js:
        fail("hash router fallback missing")
    if "--cc-bg" not in css or "--cc-accent-4" not in css:
        fail("campus-core tokens missing")
    if "max-width: 640px" not in css or "bottom-nav" not in css:
        fail("mobile bottom nav missing")
    if not (CAMPUS / "vendor" / "three.module.min.js").exists():
        fail("three.js is not vendored")
    if "three.module.min.js" not in html and "three" not in html:
        fail("three import map missing")
    shell = sum((CAMPUS / name).stat().st_size for name in ("index.html", "app.css", "app.js"))
    shell += (CAMPUS / "data" / "manifest.json").stat().st_size
    if shell > 1_500_000:
        fail(f"first load {shell} bytes")
    for tag in (
        'property="og:image"',
        'name="twitter:card" content="summary_large_image"',
        'property="og:image:width" content="1200"',
        'property="og:image:height" content="630"',
    ):
        if tag not in text:
            fail(f"missing meta {tag}")
    if "prefers-reduced-motion" not in text:
        fail("missing reduced-motion")
    if "mvcc-lab-v1" not in text:
        fail("missing localStorage key")
    if "<link rel=\"stylesheet\" href=\"app.css\">" not in html:
        fail("stylesheet not in head")
    if not (CAMPUS / "sw.js").exists():
        fail("service worker missing")
    data = load_payload()
    if not isinstance(data.get("illustrations"), list) or not isinstance(data.get("flows"), list):
        fail("illustration counters are not arrays")
    tracks = data["tracks"]
    lessons = data["lessons"]
    labs = data["labs"]
    quiz = data["quiz"]
    cards = data["cards"]
    scenarios = data["scenarios"]
    glossary = data["glossary"]
    if len(tracks) < 17:
        fail(f"tracks {len(tracks)}")
    tips = data.get("tips") or {}
    if len(tips) < 17:
        fail(f"tips {len(tips)}")
    for track in tracks:
        pack = tips.get(track["id"]) or {}
        if len(pack.get("tips") or []) < 2 or len(pack.get("traps") or []) < 1 or not pack.get("sheet"):
            fail(f"thin tips for {track['id']}")
    eco = next((track for track in tracks if track["id"] == "t17"), None)
    if not eco:
        fail("ecosystem track missing")
    blob = json.dumps(
        {
            "track": eco,
            "lessons": [lesson for lesson in lessons if lesson["track"] == "t17"],
            "map": data["map"],
            "labs": [lab for lab in labs if lab["track"] == "t17"],
        }
    ).lower()
    for needle in ECOSYSTEM_NEEDLES:
        if needle not in blob:
            fail(f"ecosystem missing {needle}")
    ids = {lab["id"] for lab in labs}
    if len(labs) < 20:
        fail(f"labs {len(labs)}")
    for lab_id in REQUIRED_LABS:
        if lab_id not in ids:
            fail(f"lab {lab_id}")
        if f'"{lab_id}"' not in text and lab_id not in text:
            fail(f"lab {lab_id} not wired in script")
    if len(quiz) < 600:
        fail(f"quiz {len(quiz)}")
    if any(not item.get("explain") or not item.get("choices") for item in quiz):
        fail("quiz item without explanation or choices")
    if len(cards) < 300:
        fail(f"cards {len(cards)}")
    if len(scenarios) < 20:
        fail(f"scenarios {len(scenarios)}")
    if len(glossary) < 300:
        fail(f"glossary {len(glossary)}")
    lesson_ids = {lesson["id"] for lesson in lessons}
    for lesson in lessons:
        if not lesson.get("why") or not lesson.get("depends"):
            fail(f"lesson {lesson['id']} missing why or depends")
        if len(lesson.get("flow") or []) < 3:
            fail(f"lesson {lesson['id']} flow")
        if not lesson.get("chart", {}).get("bars"):
            fail(f"lesson {lesson['id']} chart")
        if not lesson.get("say") or not lesson.get("fault") or not lesson.get("sources"):
            fail(f"lesson {lesson['id']} say/fault/sources")
    for node in data["map"]["nodes"]:
        href = node["href"].split("/")[-1]
        if href not in lesson_ids:
            fail(f"map node {node['id']} points at missing {href}")
    for track in tracks:
        if not track.get("why") or "depends" not in track:
            fail(f"track {track['id']} why/depends")
    figures = []
    flow_svgs = []
    for lesson in lessons:
        lesson_figures = lesson.get("figures") or []
        diagrams = [fig for fig in lesson_figures if not fig.get("animated")]
        animated = [fig for fig in lesson_figures if fig.get("animated")]
        if len(diagrams) < 3:
            fail(f"{lesson['id']} diagrams {len(diagrams)}")
        if len(animated) < 1:
            fail(f"{lesson['id']} animated flows")
        if not lesson.get("tryLab"):
            fail(f"{lesson['id']} try lab")
        for fig in lesson_figures:
            svg = fig.get("svg") or ""
            if "<svg" not in svg:
                fail(f"{lesson['id']} empty svg")
            figures.append(svg)
            if fig.get("animated"):
                if "offset-path" not in svg:
                    fail(f"{fig['id']} not animated")
                flow_svgs.append(svg)
    if len(figures) < 1500:
        fail(f"illustrations {len(figures)}")
    if len(flow_svgs) < 300:
        fail(f"flows {len(flow_svgs)}")
    if len(data["illustrations"]) != len(figures) or len(data["flows"]) != len(flow_svgs):
        fail("figure index does not match the lesson svgs")
    for boss in data.get("bosses") or []:
        incident = boss.get("incident") or {}
        if len(incident.get("steps") or []) < 3 or "syslog" not in incident:
            fail(f"boss incident {boss.get('code')}")
    normalized = []
    for svg in figures:
        bare = re.sub(r"<title>.*?</title>", "", svg, flags=re.S)
        bare = re.sub(r">[^<]*<", "><", bare)
        bare = re.sub(r"\s+", " ", bare)
        normalized.append(bare)
    if len(set(normalized)) != len(normalized):
        fail(f"templated figures {len(normalized) - len(set(normalized))}")
    charts = data.get("charts") or []
    if len(charts) < 20:
        fail(f"charts {len(charts)}")
    chart_blob = " ".join(chart["title"] + " " + chart["id"] for chart in charts).lower()
    for needle in ("licens", "cqd", "erlang", "certif", "feature"):
        if needle not in chart_blob:
            fail(f"chart missing {needle}")
    faults = data.get("faults") or []
    if len(faults) < 30:
        fail(f"faults {len(faults)}")
    for fault in faults:
        for key in ("symptom", "cause", "fix", "check", "source", "url"):
            if not fault.get(key):
                fail(f"fault field {key}")
    bosses = data.get("bosses") or []
    codes = {boss["code"] for boss in bosses}
    for code in ("MS-700", "MB-280", "AB-250", "AB-210"):
        if code not in codes:
            fail(f"boss {code}")
    fact = (
        "MS-700 is still live, with a skills update on Oct 27 2026; it is NOT retired and has no replacement. "
        "MB-280 retired Jul 31 2026, with AB-210 as its successor; AB-210 is in beta."
    )
    if data.get("examFact") != fact or fact not in text:
        fail("exam fact missing")
    for banned in ("available 9 July 2026", "available from 9 July 2026", "AB-210 available", "9 July 2026"):
        if banned in text:
            fail(f"stale exam wording: {banned}")
    if any(len(boss.get("questions") or []) < 10 for boss in bosses):
        fail("boss exam too short")
    audio = data.get("audio") or []
    if len(audio) < 25:
        fail(f"audio {len(audio)}")
    audio_dir = ROOT / "campus" / "audio"
    for clip in audio:
        if not (ROOT / "campus" / clip["file"]).exists():
            fail(f"missing {clip['file']}")
    if not audio_dir.is_dir():
        fail("audio directory")
    for needle in ("Try it", "confetti", "perspective", "sheen", "prefers-reduced-motion"):
        if needle not in text:
            fail(f"shell missing {needle}")
    if not CARD.exists():
        fail("og card missing")
    try:
        from PIL import Image
    except ImportError:
        fail("pillow required to measure og card")
    with Image.open(CARD) as image:
        if image.size != (1200, 630):
            fail(f"og card size {image.size}")
    atlas = json.loads((CAMPUS / "data" / "atlas.json").read_text(encoding="utf-8"))
    atlas_items = atlas.get("items") or []
    atlas_flows = [item for item in atlas_items if item.get("animated")]
    if len(atlas_items) < 25:
        fail(f"atlas diagrams {len(atlas_items)}")
    if len(atlas_flows) < 12:
        fail(f"atlas flows {len(atlas_flows)}")
    seen_topics = {item.get("topic") for item in atlas_items}
    for topic in ("ladder", "routing", "architecture", "deployment", "migration", "troubleshooting"):
        if topic not in seen_topics:
            fail(f"atlas topic {topic}")
    for item in atlas_items:
        svg = item.get("svg") or ""
        if "<svg" not in svg:
            fail(f"atlas svg {item.get('id')}")
        if item.get("animated") and ("offset-path" not in svg or "atlas-packet" not in svg):
            fail(f"atlas motion {item.get('id')}")
    primary = re.search(r'<nav class="primary-nav".*?</nav>', html, re.S)
    if not primary:
        fail("primary nav missing")
    for label in ("Diagrams", "Flows", "Charts", "Cheat Codes", "Play", "Ecosystem", "Downloads", "Careers"):
        if label not in primary.group(0):
            fail(f"menu missing {label}")
    for needle in ("mascot-row", "data-home-theme", "data-count", "signal-deck", "hero-flow", "spot-nav", "signalDeck"):
        if needle not in js:
            fail(f"home surface {needle}")
    if "parallax" not in js or "signalDeck(id)" not in js:
        fail("track signal deck missing")
    license_text = (ROOT / "LICENSE").read_text(encoding="utf-8")
    if "CC BY-NC-SA" not in license_text or "MIT License" not in license_text:
        fail("LICENSE does not state MIT code and CC BY-NC-SA content")
    for repo in (
        "uc-lab-free-university-mesmerizing",
        "webex-lab-free-university-mesmerizing",
        "ai-lab-free-university-mesmerizing",
    ):
        if f"https://cyphermonkeylabs.com/{repo}/" not in html:
            fail(f"sibling url {repo}")
    if "https://cipher0x9.github.io/gemini-gems-free-gallery/" not in html:
        fail("sibling url gemini-gems-free-gallery")
    sheets = []
    for sheet in (CAMPUS / "downloads").glob("*.html"):
        body = sheet.read_text(encoding="utf-8", errors="ignore")
        lowered_sheet = body.lower()
        if "linkedin" in lowered_sheet or "mailto:" in lowered_sheet:
            fail(f"sheet contact {sheet.name}")
        if all(bit in body for bit in (
            "https://cyphermonkeylabs.com",
            "https://linktr.ee/cyphermonkey",
            "https://github.com/CypherMonkeyLabs/microsoft-voice-cc-lab-free-university-mesmerizing",
            "MIT code, CC BY-NC-SA content",
        )):
            sheets.append(sheet.name)
    if len(sheets) < 10:
        fail(f"cheat sheets {len(sheets)}")
    ports_sheet = (CAMPUS / "downloads" / "ports-protocols.html").read_text(encoding="utf-8")
    if "52.122.0.0/15" not in ports_sheet or "52.120.0.0/14" not in ports_sheet:
        fail("ports sheet firewall lists")
    if "52.122.0.0/15" not in js or "52.120.0.0/14" not in js:
        fail("app firewall lists")
    for vendor_name in ("anime.esm.min.js", "rough.esm.js", "d3.min.js", "confetti.browser.js", "three.module.min.js"):
        if not (CAMPUS / "vendor" / vendor_name).exists():
            fail(f"vendor {vendor_name}")
    if "anime.esm.min.js" not in effects or "rough.esm.js" not in effects or "armVisuals" not in effects:
        fail("effects module is not wired")
    if 'type="module" src="effects.js"' not in html:
        fail("effects module tag")
    print(
        "ok",
        "tracks", len(tracks),
        "atlas", len(atlas_items),
        "atlas_flows", len(atlas_flows),
        "sheets", len(sheets),
        "lessons", len(lessons),
        "labs", len(labs),
        "quiz", len(quiz),
        "cards", len(cards),
        "scenarios", len(scenarios),
        "glossary", len(glossary),
        "illustrations", len(figures),
        "flows", len(flow_svgs),
        "charts", len(charts),
        "faults", len(faults),
        "bosses", len(bosses),
        "audio", len(audio),
        "sources", len(data["sources"]),
    )


if __name__ == "__main__":
    main()

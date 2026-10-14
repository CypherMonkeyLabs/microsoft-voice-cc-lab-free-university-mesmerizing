#!/usr/bin/env python3
"""Check the generated campus file. No network."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "campus" / "index.html"
CARD = ROOT / "campus" / "og-card.png"

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


def main() -> None:
    if not HTML.exists():
        fail(f"missing {HTML}")
    text = HTML.read_text(encoding="utf-8")
    lowered = text.lower()
    for needle in BANNED:
        if needle in lowered:
            fail(f"remote asset: {needle}")
    if re.search(r"<script[^>]+src=", text, re.I):
        fail("external script src")
    if re.search(r"<link[^>]+stylesheet", text, re.I):
        fail("external stylesheet")
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
    match = re.search(
        r'<script type="application/json" id="campus-data">(.*?)</script>',
        text,
        re.S,
    )
    if not match:
        fail("campus-data missing")
    data = json.loads(match.group(1))
    tracks = data["tracks"]
    lessons = data["lessons"]
    labs = data["labs"]
    quiz = data["quiz"]
    cards = data["cards"]
    scenarios = data["scenarios"]
    glossary = data["glossary"]
    if len(tracks) < 17:
        fail(f"tracks {len(tracks)}")
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
    print(
        "ok",
        "tracks", len(tracks),
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

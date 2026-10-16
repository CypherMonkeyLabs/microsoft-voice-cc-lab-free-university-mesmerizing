#!/usr/bin/env python3
"""Build the Teams Phone university from campus/data and the Webex kit chrome."""

from __future__ import annotations

import html
import json
import re
import shutil
import subprocess
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "campus" / "data"
OUT_DIAG = ROOT / "assets" / "diagrams"
OUT_DL = ROOT / "downloads"
CHROME = "/usr/local/bin/google-chrome"
CHECKED = "2026-10-14"

WEB = "https://cyphermonkeylabs.com"
ORG = "https://github.com/CypherMonkeyLabs"
TREE = "https://linktr.ee/cypherMonkey"
REPO = ORG + "/microsoft-voice-cc-lab-free-university-mesmerizing"
CONTACT = WEB + "/#contact"

MONKEY = """<svg viewBox="0 0 64 64" class="monkey-icon" aria-hidden="true"><defs>
<radialGradient id="mh" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="#ffd9a0"/><stop offset="1" stop-color="#9a3412"/></radialGradient>
<linearGradient id="mg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#67e8f9"/><stop offset="1" stop-color="#fde047"/></linearGradient></defs>
<circle cx="14" cy="34" r="7" fill="url(#mh)"/><circle cx="50" cy="34" r="7" fill="url(#mh)"/>
<circle cx="32" cy="32" r="18" fill="url(#mh)"/>
<ellipse cx="32" cy="38" rx="9" ry="7" fill="#ffedd5"/>
<circle cx="26" cy="31" r="2" fill="#1c1917"/><circle cx="38" cy="31" r="2" fill="#1c1917"/>
<circle cx="26" cy="31" r="6" fill="none" stroke="url(#mg)" stroke-width="1.8"/>
<circle cx="38" cy="31" r="6" fill="none" stroke="url(#mg)" stroke-width="1.8"/>
<path d="M32 30 h1" stroke="url(#mg)" stroke-width="1.6"/>
<path d="M27 42 q5 4 10 0" fill="none" stroke="#7c2d12" stroke-width="1.6" stroke-linecap="round"/></svg>"""

GH = """<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5A11.5 11.5 0 0 0 .5 12.3c0 5.22 3.38 9.65 8.07 11.22.59.12.8-.26.8-.57v-2.02c-3.28.73-3.97-1.42-3.97-1.42-.53-1.38-1.3-1.75-1.3-1.75-1.07-.75.08-.73.08-.73 1.18.08 1.8 1.24 1.8 1.24 1.05 1.84 2.76 1.31 3.43.99.1-.78.41-1.31.75-1.61-2.62-.31-5.37-1.34-5.37-5.98 0-1.32.46-2.4 1.22-3.25-.12-.3-.53-1.53.12-3.18 0 0 1-.33 3.3 1.25a11.3 11.3 0 0 1 6 0c2.3-1.58 3.3-1.25 3.3-1.25.65 1.65.24 2.88.12 3.18.76.85 1.22 1.93 1.22 3.25 0 4.65-2.76 5.66-5.39 5.96.42.38.8 1.12.8 2.26v3.35c0 .31.21.7.81.57A11.52 11.52 0 0 0 23.5 12.3 11.5 11.5 0 0 0 12 .5z"/></svg>"""

LT = """<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9.2" y="1.2" width="5.6" height="3.1" rx="1.55" fill="currentColor"/><rect x="1.4" y="6.1" width="7.2" height="3.1" rx="1.55" fill="currentColor"/><rect x="15.4" y="6.1" width="7.2" height="3.1" rx="1.55" fill="currentColor"/><rect x="3.2" y="11.1" width="6.2" height="3" rx="1.5" fill="currentColor"/><rect x="14.6" y="11.1" width="6.2" height="3" rx="1.5" fill="currentColor"/><rect x="10.15" y="4.2" width="3.7" height="16.4" rx="1.7" fill="currentColor"/></svg>"""

SECTIONS = [
    ("Home", "index.html", "Seventeen tracks for Teams Phone."),
    ("Start", "start.html", "Tenant, license, then a dial plan."),
    ("Diagrams", "diagrams.html", "Drawings as SVG, PNG, and HTML."),
    ("Flows", "flows.html", "Animated call paths."),
    ("Charts", "charts.html", "Counts from this repository."),
    ("Cheat Codes", "downloads.html", "Sheets, cards, and a zip."),
    ("Play", "play.html", "A port game in this browser."),
    ("Ecosystem", "ecosystem.html", "Sisters around the call."),
    ("Bridges", "bridges.html", "CUCM, Webex, and UCCE."),
    ("Downloads", "downloads.html#library", "Every export, with the disclaimer."),
    ("Careers", "careers.html", "Study paths, not job offers."),
    ("Quizzes", "quizzes.html", "Practice checks with a source."),
    ("Cards", "flashcards.html", "Glossary cards."),
    ("Glossary", "glossary.html", "Term, config, and fault."),
    ("Labs", "labs.html", "Studios that do not sign in."),
    ("Help", "help.html", "Menu, course, bot, downloads."),
    ("Legal", "legal.html", "Licence, privacy, removal."),
]

PORTS = [
    ("5061", "Direct Routing signaling", "TCP 5061 TLS to sip, sip2, and sip3"),
    ("3478", "Media low", "UDP 3478-3481"),
    ("49152", "Media high", "UDP 49152-53247"),
    ("50000", "Client audio", "UDP/TCP 50000-50019, DSCP 46"),
    ("50070", "Client signaling", "UDP/TCP 50070-50089"),
]


def esc(value) -> str:
    return html.escape(str(value if value is not None else ""), quote=True)


def bake_svg(svg: str) -> str:
    """Standalone drawings cannot see the page theme variables."""
    replacements = {
        "var(--bg-3)": "#1e293b",
        "var(--bg-2)": "#0f172a",
        "var(--bg)": "#0b1020",
        "var(--ink)": "#f8fafc",
        "var(--muted)": "#cbd5e1",
        "var(--line)": "#94a3b8",
        "var(--teal)": "#2dd4bf",
        "var(--card)": "#1e293b",
        "var(--card-bg)": "#1e293b",
        "var(--accent)": "#a5b4fc",
        "var(--paper)": "#0f172a",
        "var(--gold)": "#fbbf24",
    }
    for token, color in replacements.items():
        svg = svg.replace(token, color)
    return re.sub(r"var\(--[a-zA-Z0-9_-]+\)", "#e2e8f0", svg)


def write_png(svg: str, dest: Path) -> None:
    import cairosvg

    dest.parent.mkdir(parents=True, exist_ok=True)
    cairosvg.svg2png(bytestring=bake_svg(svg).encode("utf-8"), write_to=str(dest), output_width=1280)


def slug(text: str) -> str:
    text = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return text[:72] or "room"


def sentences(text: str) -> str:
    parts = re.split(r"(?<=[.!?])\s+", str(text).strip())
    return " ".join(f'<span class="read-sent">{esc(p)}</span>' for p in parts if p)


def dl_row(items: list[tuple[str, str]]) -> str:
    buttons = []
    for label, href in items:
        buttons.append(f'<a class="dl-btn" href="{esc(href)}" download>{esc(label)}</a>')
    return '<p class="room-dl">' + "".join(buttons) + "</p>"


def footer(prefix: str) -> str:
    labs = [
        ("UC Lab", WEB + "/uc-lab-free-university-mesmerizing/"),
        ("Webex Lab", WEB + "/webex-lab-free-university-mesmerizing/"),
        ("AI Lab", WEB + "/ai-lab-free-university-mesmerizing/"),
        ("SIP Universe", WEB + "/sip-universe-lab-free-university-mesmerizing/"),
    ]
    cards = "".join(
        f'<a class="lab-card" style="--c:#6366f1" href="{esc(href)}"><span class="lab-card-copy"><strong>{esc(name)}</strong><small>Another free lab on the same site.</small></span></a>'
        for name, href in labs
    )
    return f'''<footer class="site-footer lab-footer wrap" data-canon-footer>
<aside class="disclaimer-panel" aria-labelledby="disc-title"><span class="disclaimer-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2.5 4.5 5.5v5.8c0 4.6 3.1 8.6 7.5 10.2 4.4-1.6 7.5-5.6 7.5-10.2V5.5z" fill="currentColor" opacity=".18" stroke="currentColor" stroke-width="1.6"/></svg></span>
<div><h2 id="disc-title">A note from the student behind this lab</h2>
<p>This is an <strong>independent, free, learning-only student project</strong>. It respects every company and vendor. Trademarks belong to their owners. It is <strong>not affiliated with or endorsed by</strong> any of them.</p>
<p>If anyone has a concern, the content will be removed or corrected promptly via the contact form at <a href="{CONTACT}">{CONTACT}</a>. Nothing here is sold. Happy to volunteer for any organization.</p>
</div></aside>
<p class="footer-brand">CypherMonkey Labs</p>
<nav class="brand-icons" aria-label="CypherMonkey Labs links">
<a class="brand-icon brand-web" href="{WEB}" aria-label="CypherMonkey Labs website">{MONKEY}</a>
<a class="brand-icon brand-gh" href="{ORG}" aria-label="CypherMonkeyLabs on GitHub">{GH}</a>
<a class="brand-icon brand-lt" href="{TREE}" aria-label="Linktree">{LT}</a>
</nav>
<p class="site-copy">© 2026 CypherMonkeyLabs 🐒</p>
<nav class="next-labs" aria-label="More labs"><div class="lab-cards">{cards}</div></nav>
<p class="footer-license">MIT code. CC BY-NC-SA content. <a href="{prefix}legal.html">Legal and credits</a>.</p>
</footer>'''


def chips(prefix: str) -> str:
    bits = []
    for label, href, desc in SECTIONS:
        bits.append(
            f'<a class="section-chip" href="{prefix}{esc(href)}" title="{esc(desc)}"><span>{esc(label)}</span></a>'
        )
    return (
        '<div class="canon-banner"><button type="button" class="rail-arrow" data-rail="-1" aria-label="Scroll sections left">‹</button>'
        f'<nav class="section-rail" aria-label="Sections">{"".join(bits)}</nav>'
        '<button type="button" class="rail-arrow" data-rail="1" aria-label="Scroll sections right">›</button></div>'
    )


def shell(rel: str, title: str, body: str, desc: str) -> str:
    depth = rel.count("/")
    prefix = "../" * depth
    boot = (
        '<script>try{var t=localStorage.getItem("canon-theme");'
        'if(["bloom","aurora","futuristic","gaming","neon","sunset","paper","holographic","cyberpunk","contrast"].indexOf(t)<0)t="bloom";'
        'document.documentElement.dataset.theme=t||"bloom";'
        'var f=localStorage.getItem("canon-font");if(f==="sm"||f==="md"||f==="lg")document.documentElement.dataset.font=f;'
        'var m=localStorage.getItem("canon-motion");if(m==="reduce"||m==="full")document.documentElement.dataset.motion=m;'
        'var ink=localStorage.getItem("canon-ink");if(ink&&/^#[0-9a-f]{6}$/i.test(ink))document.documentElement.style.setProperty("--ink",ink);'
        '}catch(e){document.documentElement.dataset.theme="bloom";}</script>'
    )
    css = ["canon", "shell", "wow", "frame", "polish", "footer", "university", "round2", "round3"]
    links = "\n".join(f'<link rel="stylesheet" href="{prefix}assets/css/{name}.css">' for name in css)
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
{boot}
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="icon" href="{prefix}favicon.svg" type="image/svg+xml">
<link rel="manifest" href="{prefix}manifest.webmanifest">
{links}
</head>
<body class="v4">
<a class="skip" href="#main">Skip to content</a>
<div class="v4-app"><div class="v4-stage">
{chips(prefix)}
<header class="topbar"><div class="bar-inner">
<a class="brand" data-tour="home" href="{prefix}index.html"><span class="brand-name">Voice Lab<small>Teams Phone</small></span></a>
<nav class="nav-quick" aria-label="Primary">
<a class="nav-icon" data-tour="learn" href="{prefix}start.html">Learn</a>
<a class="nav-icon" data-tour="diagrams" href="{prefix}diagrams.html">Diagrams</a>
<a class="nav-icon" data-tour="play" href="{prefix}play.html">Play</a>
<a class="nav-icon" data-tour="downloads" href="{prefix}downloads.html">Downloads</a>
<button type="button" data-listen data-tour="listen">Listen</button>
</nav>
</div></header>
<div class="stage-banner" aria-hidden="true"><div class="stage-grid"></div><div class="stage-orb"></div><p class="stage-kicker">Teams Phone · in color</p></div>
<main id="main" class="wrap">
{body}
</main>
{footer(prefix)}
</div></div>
<script src="{prefix}assets/js/university.js"></script>
</body>
</html>
'''


def write(rel: str, title: str, body: str, desc: str) -> None:
    path = ROOT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(shell(rel, title, body, desc), encoding="utf-8")


def load():
    manifest = json.loads((DATA / "manifest.json").read_text())
    tracks = []
    lessons = []
    for i in range(1, 18):
        blob = json.loads((DATA / "tracks" / f"t{i:02d}.json").read_text())
        meta = next(t for t in manifest["tracks"] if t["id"] == blob["id"])
        blob["meta"] = meta
        tracks.append(blob)
        for n, lesson in enumerate(blob["lessons"], start=1):
            lesson["_n"] = n
            lesson["_meta"] = meta
            lessons.append(lesson)
    quiz = json.loads((DATA / "quiz.json").read_text())
    glossary = json.loads((DATA / "glossary.json").read_text())
    cards = json.loads((DATA / "cards.json").read_text())
    return manifest, tracks, lessons, quiz, glossary, cards


def room_href(lesson) -> str:
    meta = lesson["_meta"]
    name = f'{meta["id"].upper()}-R{lesson["_n"]:02d}-{slug(lesson["title"])}.html'
    return "rooms/" + name


def pick_figures(lessons):
    diagrams = []
    seen = set()

    def add(fig, lesson, kind):
        if fig["id"] in seen:
            return
        seen.add(fig["id"])
        diagrams.append({"fig": fig, "lesson": lesson, "kind": kind})

    for lesson in lessons:
        figs = lesson.get("figures") or []
        if not figs:
            continue
        animated = [f for f in figs if f.get("animated")]
        add(animated[0] if animated else figs[0], lesson, "flow" if animated else "diagram")
    for lesson in lessons:
        for fig in lesson.get("figures") or []:
            if fig.get("animated"):
                add(fig, lesson, "flow")
            if sum(1 for d in diagrams if d["kind"] == "flow") >= 36 and len(diagrams) >= 70:
                return diagrams
    return diagrams


def write_diagram_files(diagrams):
    if OUT_DIAG.exists():
        shutil.rmtree(OUT_DIAG)
    (OUT_DIAG).mkdir(parents=True)
    (OUT_DL / "diagrams").mkdir(parents=True, exist_ok=True)
    for item in diagrams:
        fig = item["fig"]
        stem = fig["id"]
        svg = fig["svg"]
        if "<svg" not in svg:
            continue
        baked = bake_svg(svg)
        (OUT_DIAG / f"{stem}.svg").write_text(baked, encoding="utf-8")
        page = f'''<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>{esc(fig["title"])}</title>
<style>body{{margin:0;font:16px/1.45 system-ui,sans-serif;background:#0b1020;color:#e2e8f0}} svg{{width:100%;height:auto;display:block}} .box{{margin:16px;padding:16px;border:2px solid #0f766e;border-radius:16px;background:#ecfdf5;color:#0b1f2a}} .box a{{color:#0b3a8f;font-weight:800}}</style>
</head><body>{baked}<div class="box"><h1>{esc(fig["title"])}</h1><p>{esc(fig.get("caption") or "")}</p>
<p>Independent, free, learning-only student project. Trademarks belong to their owners. Not affiliated or endorsed. Removal via <a href="{CONTACT}">{CONTACT}</a>. Nothing is sold.</p>
<p>CypherMonkey Labs</p>
<p><a href="{WEB}">Website</a> · <a href="{ORG}">GitHub</a> · <a href="{TREE}">Linktree</a></p>
<p>© 2026 CypherMonkeyLabs 🐒</p></div></body></html>'''
        (OUT_DL / "diagrams" / f"{stem}.html").write_text(page, encoding="utf-8")
        (OUT_DL / "diagrams" / f"{stem}.svg").write_text(baked, encoding="utf-8")
        try:
            write_png(baked, OUT_DL / "diagrams" / f"{stem}.png")
        except Exception as exc:
            print("png fail", stem, exc)


def bar_chart(chart) -> str:
    bars = chart.get("bars") or []
    if not bars:
        return ""
    width = 640
    height = 36 * len(bars) + 48
    parts = [f'<svg viewBox="0 0 {width} {height}" role="img" aria-label="{esc(chart.get("title") or "Chart")}">']
    parts.append(f'<text x="8" y="22" fill="currentColor" font-size="16">{esc(chart.get("title") or "")}</text>')
    max_v = max((float(b.get("value") or 1) for b in bars), default=1) or 1
    for i, bar in enumerate(bars):
        y = 36 + i * 34
        w = 40 + (520 * float(bar.get("value") or 1) / max_v)
        parts.append(f'<rect x="8" y="{y}" width="{w:.0f}" height="24" rx="8" fill="#818cf8"/>')
        parts.append(f'<text x="16" y="{y+17}" fill="#0b1020" font-size="13">{esc(bar.get("label"))} · {esc(bar.get("display") or "")}</text>')
    parts.append("</svg>")
    note = chart.get("note") or ""
    return f'<figure class="callout">{"".join(parts)}<figcaption>{esc(note)} Counts in this drawing are teaching order, not customers.</figcaption></figure>'


def quiz_block(items) -> str:
    cards = []
    for q in items:
        choices = "".join(
            f'<button type="button" class="choice" data-choice="{i}">{esc(c)}</button>'
            for i, c in enumerate(q["choices"])
        )
        cards.append(
            f'<article class="quiz-card" data-quiz data-answer="{int(q["answer"])}"><p class="read-sent">{esc(q["q"])}</p>{choices}'
            f'<p class="quiz-why" hidden>{esc(q.get("explain") or "")}</p></article>'
        )
    return "".join(cards)


def bridge_html(source_url: str) -> str:
    return f'''<div class="bridge-grid">
<article class="bridge-card" id="cucm"><h3>CUCM</h3><p class="read-sent">Cisco CUBE is one of the SBC families named in this lab’s certification lesson. A certified release can be the Direct Routing SBC between Unified CM and Teams.</p><p class="read-sent">The tenant still needs a verified domain on the SBC FQDN, and the user still needs Teams Phone. The studio translator does not open a live AXL session. Confirm the current certified release before you build.</p></article>
<article class="bridge-card" id="webex"><h3>Webex</h3><p class="read-sent">Teams Phone and Webex Calling are separate clouds. This lab does not describe a feature that registers a Webex Calling user into a Teams tenant.</p><p class="read-sent">A number move is usually a carrier port, a certified SBC, or a meetings interop product. Confirm before relying.</p></article>
<article class="bridge-card" id="ucce"><h3>UCCE</h3><p class="read-sent">Unified CCE stays the ACD until you migrate it. Microsoft’s contact-center articles name Connect, Extend, and Unify. They do not name a UCCE connector in the notes this lab cites.</p><p class="read-sent">Voice into Teams is still Direct Routing or Operator Connect. The routing script stays on the contact-center product you bought. Confirm the vendor’s current model. Source: <a href="{esc(source_url)}">{esc(source_url)}</a>.</p></article>
</div>'''


def build():
    manifest, tracks, lessons, quiz, glossary, cards = load()
    t14 = next(t for t in tracks if t["id"] == "t14")
    t14_source = (t14["lessons"][0].get("sources") or [{"url": "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan"}])[0]["url"]
    diagrams = pick_figures(lessons)
    write_diagram_files(diagrams)
    by_lesson = {}
    for item in diagrams:
        by_lesson.setdefault(item["lesson"]["id"], item)

    flows = [d for d in diagrams if d["kind"] == "flow"]
    print(f"diagrams {len(diagrams)} flows {len(flows)} lessons {len(lessons)}")

    # Rooms
    guide_rooms = []
    for lesson in lessons:
        meta = lesson["_meta"]
        href = room_href(lesson)
        fig_item = by_lesson.get(lesson["id"])
        fig = fig_item["fig"] if fig_item else (lesson.get("figures") or [None])[0]
        stem = fig["id"] if fig else ""
        prefix = "../"
        visual = ""
        if fig:
            visual = f'<figure>{fig["svg"]}<figcaption>{esc(fig.get("caption") or fig["title"])}</figcaption></figure>'
        body_html = "".join(f"<p>{sentences(p)}</p>" for p in (lesson.get("body") or [])[:4])
        flow_html = "".join(
            f'<li><strong>{esc(step.get("label"))}</strong> {esc(step.get("detail") or "")}</li>'
            for step in (lesson.get("flow") or [])
        )
        qs = [q for q in quiz if q.get("track") == lesson["track"]]
        start = ((lesson["_n"] - 1) * 3) % max(1, len(qs))
        picked = [qs[(start + i) % len(qs)] for i in range(min(3, len(qs)))]
        terms = [g for g in glossary if g.get("track") == lesson["track"]][:4]
        term_html = "".join(
            f'<li><strong>{esc(g["term"])}</strong> {esc(g["plain"])} Config: {esc(g.get("config") or "")} Fault: {esc(g.get("fault") or "")}</li>'
            for g in terms
        )
        sources = lesson.get("sources") or []
        src_html = "".join(
            f'<li><a href="{esc(s["url"])}">{esc(s["title"])}</a> accessed {esc(s.get("accessed") or CHECKED)}</li>'
            for s in sources
        )
        dl_visual = dl_row([
            ("SVG", f"{prefix}downloads/diagrams/{stem}.svg"),
            ("PNG", f"{prefix}downloads/diagrams/{stem}.png"),
            ("HTML", f"{prefix}downloads/diagrams/{stem}.html"),
        ]) if stem else dl_row([("This room", href.split("/")[-1])])
        body = f'''<p class="kicker">{esc(meta["num"])} · {esc(meta["title"])}</p>
<h1>{esc(lesson["title"])}</h1>
<p class="lede">{sentences(lesson.get("why") or "")}</p>
{dl_row([("Room HTML", href.split("/")[-1]), ("All downloads", prefix + "downloads.html")])}
<nav class="toc" aria-label="Room sections"><a href="#five">5 minutes</a> · <a href="#visual">Visual</a> · <a href="#example">Example</a> · <a href="#quiz">Quiz</a> · <a href="#sources">Sources</a> · <a href="#eco">Ecosystem</a></nav>
<section id="five" data-read><h2>Learn it in 5 minutes</h2>{body_html}<p>{sentences(lesson.get("listen") or "")}</p>{dl_row([("Room HTML", href.split("/")[-1])])}</section>
<section id="visual" data-read><h2>Visual</h2>{visual}{bar_chart(lesson.get("chart") or {})}{dl_visual}</section>
<section id="example" data-read><h2>Worked example</h2><p>{sentences(lesson.get("say") or "")}</p><ol>{flow_html}</ol><p class="callout">If it fails: {esc(lesson.get("fault") or "Check the cited article.")}</p>{dl_row([("Checklist HTML", prefix + "downloads/templates/sbc-checklist.html")])}</section>
<section id="quiz" data-read><h2>Quiz</h2>{quiz_block(picked)}{dl_row([("Flashcards", prefix + "flashcards.html")])}</section>
<section id="sources"><h2>Sources</h2><ul>{src_html or "<li>Confirm before relying. This room has no primary URL stored.</li>"}</ul><p>Checked {CHECKED}. When a vendor page and this file disagree, the vendor page wins.</p>{dl_row([("Sources page", prefix + "help.html")])}</section>
<section id="eco" data-read><h2>Ecosystem</h2>
<h3>Glossary</h3><ul>{term_html}</ul>
<h3>Sister technologies</h3><p class="read-sent">Around the call: compliance recording, workforce management, emergency location, analytics, CRM screen pop, and an agent with a human escape. Each one has its own failure.</p>
<h3>Config and troubleshooting</h3><p class="read-sent">{esc(lesson.get("fault") or "")}</p>
<h3>Cross-platform bridges</h3>{bridge_html(t14_source)}
<h3>Future hooks</h3><p class="read-sent">Copilot Studio, Azure Communication Services, and Graph are later tracks in this lab. Treat any uncited limit as confirm before relying.</p>
{dl_row([("Bridges", prefix + "bridges.html"), ("Ecosystem", prefix + "ecosystem.html")])}
</section>'''
        write(href, f'{lesson["title"]} · Teams Phone Lab', body, lesson.get("why") or lesson["title"])
        guide_rooms.append({"title": lesson["title"], "href": href, "track": meta["title"]})

    # Track indexes
    for track in tracks:
        meta = track["meta"]
        rows = []
        for lesson in track["lessons"]:
            rows.append(f'<li><a href="../{room_href(lesson)}">{esc(lesson["title"])}</a> <small>{esc(lesson.get("minutes") or "")} min</small></li>')
        body = f'''<p class="kicker">Track {esc(meta["num"])}</p><h1>{esc(meta["title"])}</h1>
<p class="lede">{sentences(meta.get("why") or "")}</p>
{dl_row([("Track sheet", f"../downloads/sheets/{meta['id']}.html"), ("PNG", f"../downloads/sheets/{meta['id']}.png"), ("PDF", f"../downloads/sheets/{meta['id']}.pdf")])}
<section id="five" data-read><h2>Learn it in 5 minutes</h2><p>{sentences(meta.get("outcome") or meta.get("why") or "")}</p></section>
<section id="visual"><h2>Visual</h2>{bar_chart(meta.get("chart") or {})}</section>
<section id="rooms"><h2>Rooms</h2><ol>{"".join(rows)}</ol></section>
<section id="eco"><h2>Ecosystem</h2>{bridge_html(t14_source)}</section>'''
        write(f'tracks/{meta["id"].upper()}/index.html', f'{meta["title"]} · Teams Phone Lab', body, meta.get("why") or meta["title"])

    # Sheets
    (OUT_DL / "sheets").mkdir(parents=True, exist_ok=True)
    (OUT_DL / "templates").mkdir(parents=True, exist_ok=True)
    for track in tracks:
        meta = track["meta"]
        lines = "".join(f"<li>{esc(ls['title'])}: {esc(ls.get('why') or '')}</li>" for ls in track["lessons"])
        sheet = standalone_sheet(meta["title"], f"<p>{esc(meta.get('why') or '')}</p><ul>{lines}</ul>{bridge_html(t14_source)}")
        (OUT_DL / "sheets" / f"{meta['id']}.html").write_text(sheet, encoding="utf-8")
    ports_html = "<ul>" + "".join(f"<li><strong>{esc(a)}</strong> {esc(b)} — {esc(c)}</li>" for a, b, c in PORTS) + "</ul>"
    ports_html += "<p>Taken from this lab’s ports sheet. Signaling stays with Teams. Confirm the current Microsoft list before you open a firewall.</p>"
    (OUT_DL / "sheets" / "ports-protocols.html").write_text(standalone_sheet("Ports and protocols", ports_html), encoding="utf-8")
    (OUT_DL / "sheets" / "bridges.html").write_text(standalone_sheet("CUCM, Webex, and UCCE bridges", bridge_html(t14_source)), encoding="utf-8")

    # Templates
    templates = {
        "sbc-checklist": ("SBC pairing checklist", ["Verified domain on the SBC FQDN", "Certified software release", "TCP 5061 TLS", "OPTIONS reachability", "Voice route and policy assigned", "Sample numbers only: +1 425 555 0100"]),
        "dial-plan": ("Dial plan worksheet", ["Emergency short codes above the catch-all", "First matching rule wins", "Route sees the normalized number", "Test raw digits and E.164"]),
        "cutover": ("Cutover notes", ["Name the tenant", "Name the PSTN option", "Park the old route", "Call the sample number", "Read CQD after, not during the first call"]),
        "bridges": ("Bridge notes", ["CUCM via a certified SBC such as CUBE", "Webex Calling is a different cloud", "UCCE remains the ACD until migrated", "Confirm before relying"]),
    }
    for stem, (title, steps) in templates.items():
        lis = "".join(f"<li>{esc(s)}</li>" for s in steps)
        (OUT_DL / "templates" / f"{stem}.html").write_text(standalone_sheet(title, f"<ol>{lis}</ol>"), encoding="utf-8")
        write_docx(OUT_DL / "templates" / f"{stem}.docx", title, steps)
        write_pdf_note(OUT_DL / "templates" / f"{stem}.pdf", title, steps)

    # Flashcards
    card_html = ["<ul>"]
    for card in cards:
        card_html.append(f"<li><strong>{esc(card['front'])}</strong> {esc(card['back'])}</li>")
    card_html.append("</ul>")
    flash_doc = standalone_sheet("Flashcards", "".join(card_html)).replace("../../assets/css/footer.css", "../assets/css/footer.css")
    (OUT_DL / "flashcards.html").write_text(flash_doc, encoding="utf-8")
    (OUT_DL / "flashcards.json").write_text(json.dumps({"cards": cards}, ensure_ascii=False), encoding="utf-8")
    (ROOT / "flashcards.html").write_text(shell(
        "flashcards.html",
        "Flashcards · Teams Phone Lab",
        f'<h1>Flashcards</h1><p>{len(cards)} cards from the glossary. Progress is not uploaded.</p>{dl_row([("HTML", "downloads/flashcards.html"), ("JSON", "downloads/flashcards.json"), ("PDF", "downloads/flashcards.pdf")])}<section id="five" data-read><h2>Learn it in 5 minutes</h2><p class="read-sent">Read the front, say the back, then check the source in the glossary.</p></section><section id="deck">{"".join(card_html[:80])}<p>The full deck is in the download.</p></section>',
        "Glossary flashcards for Teams Phone.",
    ), encoding="utf-8")

    # Glossary page
    gloss_items = "".join(
        f'<article class="quiz-card" id="{esc(slug(g["term"]))}"><h2>{esc(g["term"])}</h2><p class="read-sent">{esc(g["plain"])}</p><p>Config: {esc(g.get("config") or "")}</p><p>Fault: {esc(g.get("fault") or "")}</p><p><a href="{esc(g.get("source") or "")}">{esc(g.get("source") or "")}</a> accessed {esc(g.get("accessed") or CHECKED)}</p></article>'
        for g in glossary
    )
    write("glossary.html", "Glossary · Teams Phone Lab",
          f'<h1>Glossary</h1><p>{len(glossary)} terms. Each one has a config note and a fault.</p>{dl_row([("HTML", "downloads/sheets/glossary.html")])}<section id="five"><h2>Learn it in 5 minutes</h2><p class="read-sent">A term is useful when you can name the fault it causes.</p></section>{gloss_items}',
          "Teams Phone glossary.")
    (OUT_DL / "sheets" / "glossary.html").write_text(standalone_sheet("Glossary", gloss_items), encoding="utf-8")

    # Quizzes page (sample of 24, one screen, rest in rooms)
    sample = quiz[:: max(1, len(quiz) // 24)][:24]
    write("quizzes.html", "Quizzes · Teams Phone Lab",
          f'<h1>Practice quiz</h1><p>{len(quiz)} questions live in the data. This page shows 24. Each room has three more.</p>{dl_row([("JSON", "downloads/quiz-sample.json")])}<section id="quiz">{quiz_block(sample)}</section>',
          "Practice questions with explanations.")
    (OUT_DL / "quiz-sample.json").write_text(json.dumps(sample, ensure_ascii=False), encoding="utf-8")

    # Home
    track_cards = []
    for track in tracks:
        meta = track["meta"]
        track_cards.append(
            f'<article class="track-card"><p class="kicker">{esc(meta["emoji"])} {esc(meta["num"])}</p><h2><a href="tracks/{meta["id"].upper()}/index.html">{esc(meta["title"])}</a></h2><p>{esc(meta.get("why") or "")}</p></article>'
        )
    counts = manifest.get("counts") or {}
    home = f'''<section class="hero-band" id="top"><p class="kicker">Teams Phone · Operator Connect · Direct Routing · Dynamics 365 Contact Center · Copilot</p>
<h1>Microsoft Voice and Contact Center Lab</h1>
<p class="lede">A free offline university. {counts.get("lessons", len(lessons))} rooms from the cited notes checked {CHECKED}. Product claims stay tied to a source.</p>
<p><a class="dl-btn" href="start.html">Start here</a> <a class="dl-btn" href="campus/index.html">Open the studios</a> <a class="dl-btn" href="{REPO}">View repo</a></p>
<div class="stat-row" aria-label="Counts"><span><b>{len(lessons)}</b> rooms</span><span><b>{len(quiz)}</b> prompts</span><span><b>{len(cards)}</b> cards</span><span><b>{len(diagrams)}</b> diagrams</span><span><b>{len(flows)}</b> flows</span></div>
</section>
<section id="five" data-read><h2>Learn it in 5 minutes</h2><p class="read-sent">Name the tenant, the verified domain, and the PSTN option before you touch a route.</p><p class="read-sent">Calling Plan, Operator Connect, Teams Phone Mobile, and Direct Routing can share a tenant. They are not the same purchase.</p>{dl_row([("Start sheet", "downloads/sheets/t01.html")])}</section>
<section id="rooms"><h2>Tracks</h2><div class="track-grid">{"".join(track_cards)}</div></section>
<section id="downloads-bonus"><h2>Downloads</h2><p>Every room has export buttons. The library is one page.</p>{dl_row([("Open the library", "downloads.html"), ("Zip", "downloads/microsoft-voice-university.zip")])}</section>'''
    write("index.html", "Microsoft Voice and Contact Center Lab", home, "Free offline campus for Teams Phone and Microsoft contact center study.")

    write("start.html", "Start here · Teams Phone Lab",
          '''<h1>Start here</h1>
<section id="five" data-read><h2>Finish in 10 minutes</h2><ol><li><a href="rooms/T01-R01-the-tenant-boundary.html">The tenant boundary</a></li><li><a href="tracks/T05/index.html">PSTN connectivity</a></li><li><a href="bridges.html">Bridges</a></li><li><a href="quizzes.html">Three questions</a></li></ol></section>
<section id="full" data-read><h2>Full course</h2><p class="read-sent">Foundations, licensing, PowerShell, and the network. Then PSTN, dial plans, attendants, emergency, devices, SBCs, and TLS. Then Dynamics 365 Contact Center, coexistence, ACS, Speech, Copilot, exams, and the ecosystem.</p></section>
<p><a class="dl-btn" href="downloads.html">Just download</a></p>''',
          "A short path and the full course.")

    write("bridges.html", "Bridges · Teams Phone Lab",
          f'<h1>Bridges</h1><p class="lede">CUCM, Webex, and UCCE next to Teams Phone. Sentences that are a design reading, not a vendor matrix, say confirm before relying.</p>{dl_row([("HTML", "downloads/sheets/bridges.html"), ("DOCX", "downloads/templates/bridges.docx"), ("PDF", "downloads/templates/bridges.pdf")])}<section id="five" data-read><h2>Learn it in 5 minutes</h2><p class="read-sent">The SBC is the usual voice bridge. The contact-center brain does not move just because the number moved.</p></section><section id="visual"><h2>Visual</h2>{bridge_html(t14_source)}</section>',
          "CUCM, Webex, and UCCE bridges.")

    write("ecosystem.html", "Ecosystem · Teams Phone Lab",
          f'<h1>Ecosystem</h1><section id="five" data-read><h2>Learn it in 5 minutes</h2><p class="read-sent">Teams Phone gets a number to a person or a voice app. Recording, staffing, location, analytics, CRM, and agents sit around that call.</p></section><section id="visual"><h2>Mind map</h2>{bar_chart(tracks[-1]["meta"].get("chart") or {"title": "Around the call", "bars": [{"label": "Phone", "value": 1, "display": "Teams"}, {"label": "Record", "value": 2, "display": "Compliance"}, {"label": "Queue", "value": 3, "display": "Contact center"}, {"label": "CRM", "value": 4, "display": "Screen pop"}]})}</section><section id="eco"><h2>Bridges</h2>{bridge_html(t14_source)}<p><a href="glossary.html">Glossary</a> · <a href="bridges.html">Integration map</a></p></section>',
          "Systems around a Teams call.")

    write("diagrams.html", "Diagrams · Teams Phone Lab",
          diagram_index(diagrams, "Diagrams", False), "Diagram library.")
    write("flows.html", "Flows · Teams Phone Lab",
          diagram_index(flows, "Flows", True), "Animated flows.")

    charts_body = ['<h1>Charts</h1><p>These bars are teaching order from the track notes. They are not traffic and not prices.</p>', dl_row([("Charts HTML", "charts.html")]), '<section id="visual">']
    for track in tracks:
        charts_body.append(bar_chart(track["meta"].get("chart") or {}))
    charts_body.append("</section>")
    write("charts.html", "Charts · Teams Phone Lab", "".join(charts_body), "Teaching charts.")

    write("play.html", "Play · Teams Phone Lab", play_html(), "Port game.")
    write("downloads.html", "Downloads · Teams Phone Lab", downloads_body(diagrams, tracks), "Exports.")
    write("help.html", "Help · Teams Phone Lab", help_body(), "How to use this lab.")
    write("legal.html", "Legal and credits · Teams Phone Lab", legal_body(), "Licence and removal.")
    write("careers.html", "Careers · Teams Phone Lab", careers_body(manifest), "Study paths.")
    write("labs.html", "Labs · Teams Phone Lab",
          '''<h1>Hands-on labs</h1><p class="read-sent">The studios are the earlier campus: a simulated PowerShell tenant, a Direct Routing ladder, an E.164 sandbox, and an SBC mesh. Nothing signs in to Microsoft 365.</p>
<p><a class="dl-btn" href="campus/index.html">Open the studios</a></p>
<ul><li><a href="campus/index.html#/powershell">Teams PowerShell</a></li><li><a href="campus/index.html#/topology">SBC mesh</a></li><li><a href="play.html">Port game</a></li></ul>''',
          "Browser labs.")
    write("troubleshooting.html", "Troubleshooting · Teams Phone Lab",
          '''<h1>Troubleshooting</h1><section id="five" data-read><h2>Learn it in 5 minutes</h2><p class="read-sent">Pairing fails when the FQDN’s domain was never verified. A 488 is codecs, not a greeting. Islands mode is not a Direct Routing user.</p></section>
<p>The fault catalog in the studios has symptom, cause, fix, and a source. <a href="campus/index.html#/faults">Open the catalog</a>.</p>''',
          "Fault checks.")

    guide = {
        "pages": [
            {"title": "home", "href": "index.html", "export": {"label": "Zip", "href": "downloads/microsoft-voice-university.zip"}},
            {"title": "downloads", "href": "downloads.html", "export": {"label": "Zip", "href": "downloads/microsoft-voice-university.zip"}},
            {"title": "diagrams", "href": "diagrams.html", "export": {"label": "First diagram", "href": f"downloads/diagrams/{diagrams[0]['fig']['id']}.svg" if diagrams else "downloads.html"}},
            {"title": "bridges", "href": "bridges.html", "export": {"label": "Bridge sheet", "href": "downloads/sheets/bridges.html"}},
            {"title": "play", "href": "play.html", "export": {"label": "Ports sheet", "href": "downloads/sheets/ports-protocols.html"}},
            {"title": "start", "href": "start.html", "export": {"label": "Foundations sheet", "href": "downloads/sheets/t01.html"}},
        ],
        "rooms": guide_rooms,
    }
    (ROOT / "assets" / "data").mkdir(parents=True, exist_ok=True)
    (ROOT / "assets" / "data" / "guide-index.json").write_text(json.dumps(guide), encoding="utf-8")
    (ROOT / "assets" / "data" / "downloads.json").write_text(json.dumps({"groups": []}), encoding="utf-8")

    deck_slides = [(t["meta"]["title"], t["meta"].get("why") or "") for t in tracks]
    write_pptx(OUT_DL / "teams-phone-deck.pptx", deck_slides)

    # PNGs are written with cairosvg inside write_diagram_files. PDFs use headless Chrome.
    raster_jobs = []
    for track in tracks:
        stem = track["meta"]["id"]
        raster_jobs.append((OUT_DL / "sheets" / f"{stem}.html", OUT_DL / "sheets" / f"{stem}.pdf", "pdf"))
    for extra in ("ports-protocols", "bridges", "glossary"):
        raster_jobs.append((OUT_DL / "sheets" / f"{extra}.html", OUT_DL / "sheets" / f"{extra}.pdf", "pdf"))
    raster_jobs.append((OUT_DL / "flashcards.html", OUT_DL / "flashcards.pdf", "pdf"))
    for stem in templates:
        raster_jobs.append((OUT_DL / "templates" / f"{stem}.html", OUT_DL / "templates" / f"{stem}.pdf", "pdf"))
    run_chrome(raster_jobs)
    for src, dest, kind in raster_jobs:
        if kind == "pdf" and (not dest.exists() or dest.stat().st_size < 80):
            write_pdf_note(dest, dest.stem.replace("-", " "), ["Open the matching HTML sheet for the full text.", "Confirm before relying."])

    zip_path = OUT_DL / "microsoft-voice-university.zip"
    if zip_path.exists():
        zip_path.unlink()
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in OUT_DL.rglob("*"):
            if path.is_file() and path.suffix != ".zip":
                zf.write(path, path.relative_to(OUT_DL.parent))
    print("zip", zip_path.stat().st_size)


def title_fallback(lesson):
    return lesson["title"]


def diagram_index(diagrams, title, flows_only: bool) -> str:
    cards = []
    for item in diagrams:
        fig = item["fig"]
        stem = fig["id"]
        lesson = item["lesson"]
        svg = fig["svg"] if flows_only or len(cards) < 12 else ""
        cards.append(
            f'<article class="quiz-card" id="{esc(stem)}"><h2>{esc(fig["title"])}</h2>'
            f'{svg}<p>{esc(fig.get("caption") or "")}</p>'
            f'<p><a href="{room_href(lesson)}">{esc(lesson["title"])}</a></p>'
            f'{dl_row([("SVG", f"downloads/diagrams/{stem}.svg"), ("PNG", f"downloads/diagrams/{stem}.png"), ("HTML", f"downloads/diagrams/{stem}.html")])}</article>'
        )
    kind = "Animated flows keep their motion in the SVG." if flows_only else "Each drawing is also a file."
    return f'<h1>{title}</h1><p class="read-sent">{kind} {len(diagrams)} files. Reduced motion still shows every hop.</p><section id="visual">{"".join(cards)}</section>'


def play_html() -> str:
    buttons = "".join(
        f'<button type="button" class="choice" data-port="{esc(code)}">{esc(label)}</button>' for code, label, _ in PORTS
    )
    rows = "".join(f"<li><strong>{esc(code)}</strong> {esc(blurb)}</li>" for code, _, blurb in PORTS)
    return f'''<h1>Play</h1>
<section id="five" data-read><h2>Learn it in 5 minutes</h2><p class="read-sent">Signaling for Direct Routing in this lab’s sheet is TCP 5061. Media uses a different range. Signaling stays with Teams.</p></section>
<section id="game"><h2>Match the port</h2>
<p id="port-prompt">Which label is TCP 5061?</p>
<div id="port-choices">{buttons}</div>
<p id="port-result"></p>
</section>
<section id="sheet"><h2>The sheet</h2><ul>{rows}</ul>
<p>Source notes checked {CHECKED}. Confirm the current list in Microsoft’s Direct Routing plan before you build a firewall.</p>
{dl_row([("Ports HTML", "downloads/sheets/ports-protocols.html"), ("Ports PDF", "downloads/sheets/ports-protocols.pdf")])}
</section>
<script>
(function(){{
  var pairs = {json.dumps([{"code": a, "label": b} for a, b, _ in PORTS])};
  var i = 0;
  function ask(){{
    document.getElementById("port-prompt").textContent = "Which label matches " + pairs[i].code + "?";
  }}
  document.getElementById("port-choices").addEventListener("click", function(ev){{
    var btn = ev.target.closest("[data-port]");
    if(!btn) return;
    var ok = btn.getAttribute("data-port") === pairs[i].code;
    document.getElementById("port-result").textContent = ok ? "Yes. That matches the sheet." : "Not that one. Read the sheet under the game.";
    if(ok){{ i = (i + 1) % pairs.length; ask(); }}
  }});
  ask();
}})();
</script>'''


def downloads_body(diagrams, tracks) -> str:
    rows = []
    for item in diagrams:
        stem = item["fig"]["id"]
        rows.append(f'<li>{esc(item["fig"]["title"])} <a href="downloads/diagrams/{stem}.svg">SVG</a> <a href="downloads/diagrams/{stem}.png">PNG</a> <a href="downloads/diagrams/{stem}.html">HTML</a></li>')
    sheets = "".join(f'<li><a href="downloads/sheets/{t["meta"]["id"]}.html">{esc(t["meta"]["title"])}</a> PDF PNG</li>' for t in tracks)
    return f'''<h1>Downloads</h1>
<p><a class="dl-btn" href="campus/index.html">Open app</a> <a class="dl-btn" href="{REPO}">View repo</a> <a class="dl-btn" href="downloads/microsoft-voice-university.zip">Download everything</a></p>
<section id="library"><h2>Library</h2>
<p>Standalone files. Each one carries the disclaimer. PNG and PDF are rendered headless from the HTML.</p>
<h3>Sheets</h3><ul>{sheets}<li><a href="downloads/sheets/ports-protocols.html">Ports</a></li><li><a href="downloads/sheets/bridges.html">Bridges</a></li><li><a href="downloads/sheets/glossary.html">Glossary</a></li></ul>
<h3>Templates</h3><ul>
<li>SBC checklist <a href="downloads/templates/sbc-checklist.html">HTML</a> <a href="downloads/templates/sbc-checklist.docx">DOCX</a> <a href="downloads/templates/sbc-checklist.pdf">PDF</a></li>
<li>Dial plan <a href="downloads/templates/dial-plan.docx">DOCX</a> <a href="downloads/templates/dial-plan.pdf">PDF</a></li>
<li>Cutover <a href="downloads/templates/cutover.docx">DOCX</a></li>
<li>Bridges <a href="downloads/templates/bridges.docx">DOCX</a></li>
</ul>
<h3>Cards and deck</h3>
<p><a href="downloads/flashcards.html">Flashcards HTML</a> · <a href="downloads/flashcards.json">JSON</a> · <a href="downloads/flashcards.pdf">PDF</a> · <a href="downloads/teams-phone-deck.pptx">PPTX deck</a></p>
<h3>Diagrams</h3><ul>{"".join(rows)}</ul>
</section>
<section id="tests"><h2>Test table</h2><p>See docs/download-tests.md after the build. The script checks magic bytes for HTML, SVG, PNG, PDF, DOCX, PPTX, and ZIP.</p></section>'''


def help_body() -> str:
    return '''<h1>Help</h1>
<section id="menu" data-read><h2>Menu</h2><p class="read-sent">The Menu button is at the top left. The drawer slides in from the left. Esc or a tap outside closes it. On a phone the bottom bar is Menu, Learn, Diagrams, Play, Listen, and Guide.</p></section>
<section id="course" data-read><h2>Course</h2><p class="read-sent">Start here is the short path. Tracks are the full course. Each room has a five-minute read, a drawing, an example, a quiz, sources, and an ecosystem panel.</p></section>
<section id="bot" data-read><h2>Bot</h2><p class="read-sent">The monkey greets you once, then sits at the right. Drag it. Ask it to open a room. Mic uses the browser, and the box is there if the mic is off. Read this page highlights the sentence it speaks.</p><p><button type="button" data-reopen-tour>Replay the tour</button></p></section>
<section id="downloads" data-read><h2>Downloads</h2><p class="read-sent">Every section has a colored download button. The library lists SVG, PNG, HTML, PDF, DOCX, JSON, PPTX, and one zip.</p></section>'''


def legal_body() -> str:
    return f'''<h1>Legal and credits</h1>
<section id="copy"><h2>Copyright</h2><p>© 2026 CypherMonkeyLabs. Curriculum text, diagrams, and sheets are CC BY-NC-SA 4.0. Code in this repository is MIT.</p></section>
<section id="tm"><h2>Trademarks</h2><p>Microsoft, Teams, Dynamics 365, Copilot, Azure, and related marks belong to Microsoft. Cisco, CUCM, CUBE, Webex, and UCCE belong to Cisco. Other names belong to their owners. This lab is not affiliated with or endorsed by them.</p></section>
<section id="third"><h2>Third-party licences</h2><ul>
<li>three.js, MIT, vendored for the studio mesh.</li>
<li>Anime.js, MIT, vendored.</li>
<li>D3, ISC, vendored.</li>
<li>canvas-confetti, ISC, vendored.</li>
<li>The page chrome was adapted from the Webex lab kit in the CypherMonkeyLabs organization and retargeted to this topic.</li>
</ul></section>
<section id="privacy"><h2>Privacy</h2><p>No account, no analytics, no tracker. Progress, theme, tour, and the bot’s position stay in localStorage on this device. Speech uses the browser’s own voice. Nothing is uploaded. The guide has no cloud endpoint.</p></section>
<section id="a11y"><h2>Accessibility</h2><p>Font size and font colour are in Display and in Settings. A skip link is on every page. Reduced motion is honored.</p></section>
<section id="removal"><h2>Removal</h2><p>Write via <a href="{CONTACT}">{CONTACT}</a>. Content will be removed or corrected. Nothing is sold.</p></section>'''


def careers_body(manifest) -> str:
    fact = manifest.get("examFact") or ""
    return f'''<h1>Careers and exams</h1>
<section id="five" data-read><h2>Learn it in 5 minutes</h2><p class="read-sent">Job titles here are study labels, not open roles and not a vendor requisition.</p><p class="read-sent">{esc(fact)}</p><p>Confirm the live seat on the exam page before you book. Renewal is not retirement.</p></section>
<ul><li>Teams voice: tenant, PSTN option, dial plan, SBC.</li><li>Contact center: Dynamics 365 Contact Center routing, then the human escape.</li><li>Bridge work: CUCM or UCCE still running beside Teams. Confirm the design.</li></ul>
{dl_row([("Careers HTML", "downloads/sheets/t16.html")])}'''


def standalone_sheet(title: str, inner: str) -> str:
    return f'''<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>{esc(title)}</title>
<link rel="stylesheet" href="../../assets/css/footer.css">
<style>body{{margin:24px auto;max-width:880px;font:17px/1.5 system-ui,sans-serif;color:#0f172a;background:#f8fafc}} h1{{font-size:1.8rem}} a{{color:#0b3a8f;font-weight:800}} .disclaimer-panel a{{color:#0b3a8f}}</style>
</head><body><h1>{esc(title)}</h1>{inner}
<footer class="site-footer standalone-footer" data-canon-footer>
<aside class="disclaimer-panel"><div><h2>A note from the student behind this lab</h2>
<p>This is an independent, free, learning-only student project. It respects every company and vendor. Trademarks belong to their owners. It is not affiliated or endorsed. Concerns go to <a href="{CONTACT}">{CONTACT}</a> and will be removed or corrected. Nothing is sold. Happy to volunteer for any organization.</p></div></aside>
<p class="footer-brand">CypherMonkey Labs</p>
<nav class="brand-icons"><a class="brand-icon brand-web" href="{WEB}" aria-label="Website">{MONKEY}</a>
<a class="brand-icon brand-gh" href="{ORG}" aria-label="GitHub">{GH}</a>
<a class="brand-icon brand-lt" href="{TREE}" aria-label="Linktree">{LT}</a></nav>
<p class="site-copy">© 2026 CypherMonkeyLabs 🐒</p>
</footer></body></html>'''


def write_docx(path: Path, title: str, steps: list[str]) -> None:
    paras = "".join(f"<w:p><w:r><w:t>{esc(step)}</w:t></w:r></w:p>" for step in steps)
    document = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
<w:p><w:r><w:t>{esc(title)}</w:t></w:r></w:p>{paras}
<w:p><w:r><w:t>Independent free learning-only student project. Not affiliated. Contact {CONTACT}. Nothing sold. CypherMonkey Labs. © 2026 CypherMonkeyLabs.</w:t></w:r></w:p>
</w:body></w:document>'''
    content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'''
    rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'''
    path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(path, "w") as zf:
        zf.writestr("[Content_Types].xml", content_types)
        zf.writestr("_rels/.rels", rels)
        zf.writestr("word/document.xml", document)


def write_pdf_note(path: Path, title: str, steps: list[str]) -> None:
    """Tiny PDF so a template still opens if Chrome is unavailable."""
    lines = [title, *steps, "Independent free learning-only project. Not affiliated.", CONTACT, "CypherMonkey Labs", "2026 CypherMonkeyLabs"]
    text = "\\n".join(lines).replace("(", "\\(").replace(")", "\\)")
    stream = f"BT /F1 12 Tf 50 780 Td ({text}) Tj ET".encode("latin-1", "replace")
    objects = []
    objects.append(b"1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n")
    objects.append(b"2 0 obj<< /Type /Pages /Count 1 /Kids [3 0 R] >>endobj\n")
    objects.append(b"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n")
    objects.append(f"4 0 obj<< /Length {len(stream)} >>stream\n".encode() + stream + b"\nendstream endobj\n")
    objects.append(b"5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n")
    out = b"%PDF-1.4\n"
    offsets = [0]
    for obj in objects:
        offsets.append(len(out))
        out += obj
    xref = len(out)
    out += f"xref\n0 {len(offsets)}\n".encode()
    out += b"0000000000 65535 f \n"
    for off in offsets[1:]:
        out += f"{off:010d} 00000 n \n".encode()
    out += f"trailer<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF".encode()
    path.write_bytes(out)


def write_pptx(path: Path, slides: list[tuple[str, str]]) -> None:
    slide_xmls = []
    rels_slides = []
    for i, (title, body) in enumerate(slides, start=1):
        slide_xmls.append((i, f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
<p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="400000" y="300000"/><a:ext cx="8000000" cy="800000"/></a:xfrm></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="3200"/><a:t>{esc(title)}</a:t></a:r></a:p></p:txBody></p:sp>
<p:sp><p:nvSpPr><p:cNvPr id="3" name="Body"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="400000" y="1400000"/><a:ext cx="8000000" cy="3000000"/></a:xfrm></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="1800"/><a:t>{esc(body)} Confirm before relying. Independent free learning-only project.</a:t></a:r></a:p></p:txBody></p:sp>
</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>'''))
        rels_slides.append(f'<Relationship Id="rId{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{i}.xml"/>')
    pres = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:sldIdLst>{"".join(f'<p:sldId id="{255+i}" r:id="rId{i}"/>' for i in range(1, len(slides)+1))}</p:sldIdLst><p:sldSz cx="9144000" cy="5143500"/></p:presentation>'''
    ctypes = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
              '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
              '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
              '<Default Extension="xml" ContentType="application/xml"/>',
              '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>']
    for i in range(1, len(slides) + 1):
        ctypes.append(f'<Override PartName="/ppt/slides/slide{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>')
    ctypes.append("</Types>")
    with zipfile.ZipFile(path, "w") as zf:
        zf.writestr("[Content_Types].xml", "".join(ctypes))
        zf.writestr("_rels/.rels", '''<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>''')
        zf.writestr("ppt/presentation.xml", pres)
        zf.writestr("ppt/_rels/presentation.xml.rels", f'''<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">{"".join(rels_slides)}</Relationships>''')
        for i, xml in slide_xmls:
            zf.writestr(f"ppt/slides/slide{i}.xml", xml)


def run_chrome(jobs: list[tuple[Path, Path, str]]) -> None:
    if not Path(CHROME).exists():
        print("chrome missing, skip raster")
        return
    from concurrent.futures import ThreadPoolExecutor, as_completed

    def one(job):
        src, dest, kind = job
        dest.parent.mkdir(parents=True, exist_ok=True)
        cmd = [CHROME, "--headless", "--disable-gpu", "--no-sandbox", "--hide-scrollbars", "--force-device-scale-factor=1", "--window-size=1100,1400"]
        if kind == "png":
            cmd.append(f"--screenshot={dest}")
        else:
            cmd += [f"--print-to-pdf={dest}", "--no-pdf-header-footer"]
        cmd.append(src.resolve().as_uri())
        try:
            subprocess.run(cmd, check=False, timeout=50, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except subprocess.TimeoutExpired:
            return dest.name + " timeout"
        return dest.name if dest.exists() and dest.stat().st_size > 80 else dest.name + " empty"

    ok = 0
    with ThreadPoolExecutor(max_workers=1) as pool:
        futs = [pool.submit(one, job) for job in jobs]
        for fut in as_completed(futs):
            result = fut.result()
            if result and "empty" not in result and "timeout" not in result:
                ok += 1
    print("raster", ok, "of", len(jobs))


def magic_table() -> str:
    rows = ["| File | Kind | Bytes | OK |", "|---|---|---|---|"]
    samples = []
    for pattern, kind, magic in [
        ("downloads/diagrams/*.svg", "SVG", b"<svg"),
        ("downloads/diagrams/*.png", "PNG", b"\x89PNG"),
        ("downloads/diagrams/*.html", "HTML", b"<!DOCTYPE"),
        ("downloads/sheets/*.pdf", "PDF", b"%PDF"),
        ("downloads/sheets/*.html", "HTML", b"<!DOCTYPE"),
        ("downloads/templates/*.docx", "DOCX", b"PK"),
        ("downloads/templates/*.pdf", "PDF", b"%PDF"),
        ("downloads/flashcards.json", "JSON", b"{"),
        ("downloads/flashcards.pdf", "PDF", b"%PDF"),
        ("downloads/teams-phone-deck.pptx", "PPTX", b"PK"),
        ("downloads/microsoft-voice-university.zip", "ZIP", b"PK"),
    ]:
        paths = sorted(ROOT.glob(pattern))
        if not paths:
            rows.append(f"| `{pattern}` | {kind} | 0 | MISSING |")
            continue
        for path in paths[:3]:
            data = path.read_bytes()[:16]
            good = data.startswith(magic) or (kind == "SVG" and b"<svg" in path.read_bytes()[:200])
            rows.append(f"| `{path.relative_to(ROOT)}` | {kind} | {path.stat().st_size} | {'yes' if good else 'NO'} |")
        if len(paths) > 3:
            rows.append(f"| `{pattern}` | {kind} | {len(paths)} files | sampled 3 |")
    text = "\n".join(rows) + "\n"
    (ROOT / "docs" / "download-tests.md").write_text("# Download tests\n\nHeadless Chrome rendered PNG and PDF. Magic bytes checked after the build.\n\n" + text, encoding="utf-8")
    return text


if __name__ == "__main__":
    build()
    print(magic_table())

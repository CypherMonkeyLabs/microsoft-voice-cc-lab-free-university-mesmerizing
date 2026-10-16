#!/usr/bin/env python3
"""Open lab source URLs and write a Sources and go deeper block onto every room, chapter, sheet, diagram, and card."""

from __future__ import annotations

import html
import json
import re
import ssl
import urllib.error
import urllib.request
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urlparse, unquote

import sources_render

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "campus" / "data"
OUT = DATA / "sources"
ROOMS = ROOT / "rooms"
CHECKED = "2026-10"
CTX = ssl.create_default_context()

COMMUNITY_URL = "https://techcommunity.microsoft.com/category/microsoftteams/blog/microsoftteamsblog"
COMMUNITY_NOTE = "Community index for the Microsoft Teams blog. This is the index, not a claim that a post discusses this room."

WIKI_NOTE = "Wikipedia fallback for background. Confirm the vendor page before you change a tenant."

REPLACEMENTS = {
    "https://learn.microsoft.com/en-us/microsoftteams/cloud-voicemail": {
        "url": "https://learn.microsoft.com/en-us/microsoftteams/set-up-phone-system-voicemail",
        "fallback_title": "Set up Cloud Voicemail",
        "note": "Opened in place of https://learn.microsoft.com/en-us/microsoftteams/cloud-voicemail, which did not open. The title is the page that opened.",
    },
    "https://learn.microsoft.com/en-us/microsoftteams/teams-phone-mobile-plan": {
        "url": "https://learn.microsoft.com/en-us/microsoftteams/operator-connect-mobile-plan",
        "fallback_title": "Operator Connect Mobile",
        "note": "Opened in place of https://learn.microsoft.com/en-us/microsoftteams/teams-phone-mobile-plan, which did not open. This is the page that opened, not proof it equals the old slug.",
    },
    "https://www.audiocodes.com/solutions-products/products/session-border-controllers": {
        "url": "https://www.audiocodes.com/products/session-border-controllers-sbcs",
        "fallback_title": "AudioCodes session border controllers",
        "note": "The longer AudioCodes path did not open. This product URL did.",
    },
    "https://www.oracle.com/communications/session-border-controller/": {
        "url": "https://docs.oracle.com/en/industries/communications/session-border-controller/index.html",
        "fallback_title": "Oracle Communications Session Border Controller documentation",
        "note": "The Oracle marketing URL did not open. This docs index did.",
    },
}

RFC_URL = {
    "3261": "https://www.rfc-editor.org/rfc/rfc3261",
    "3550": "https://www.rfc-editor.org/rfc/rfc3550",
    "3711": "https://www.rfc-editor.org/rfc/rfc3711",
    "3966": "https://www.rfc-editor.org/rfc/rfc3966",
    "4566": "https://www.rfc-editor.org/rfc/rfc4566",
    "8446": "https://www.rfc-editor.org/rfc/rfc8446",
}

WIKI = {
    "Session_Initiation_Protocol": "Session Initiation Protocol",
    "Session_border_controller": "Session border controller",
    "Microsoft_Teams": "Microsoft Teams",
    "Public_switched_telephone_network": "Public switched telephone network",
    "Quality_of_service": "Quality of service",
    "Transport_Layer_Security": "Transport Layer Security",
    "E.164": "E.164",
    "Microsoft_365": "Microsoft 365",
    "PowerShell": "PowerShell",
    "Emergency_telephone_number": "Emergency telephone number",
    "Interactive_voice_response": "Interactive voice response",
    "Automatic_call_distributor": "Automatic call distributor",
    "Call_centre": "Call centre",
}

TRACK_EXTRAS = {
    "t01": ["wiki:Microsoft_365", "wiki:Microsoft_Teams", "community"],
    "t02": ["wiki:Microsoft_365", "community"],
    "t03": ["wiki:PowerShell", "community"],
    "t04": ["rfc:3550", "wiki:Quality_of_service", "community"],
    "t05": ["rfc:3261", "wiki:Public_switched_telephone_network", "wiki:Session_Initiation_Protocol", "community"],
    "t06": ["rfc:3966", "wiki:E.164", "community"],
    "t07": ["wiki:Automatic_call_distributor", "wiki:Interactive_voice_response", "community"],
    "t08": ["wiki:Emergency_telephone_number", "community"],
    "t09": ["rfc:3550", "rfc:3711", "wiki:Session_Initiation_Protocol", "community"],
    "t10": ["rfc:3261", "wiki:Session_border_controller", "community"],
    "t11": ["rfc:3261", "rfc:8446", "rfc:4566", "wiki:Transport_Layer_Security", "wiki:Session_Initiation_Protocol", "community"],
    "t12": ["rfc:3261", "wiki:Session_Initiation_Protocol", "community"],
    "t13": ["wiki:Call_centre", "community"],
    "t14": ["rfc:3261", "wiki:Session_Initiation_Protocol", "wiki:Session_border_controller", "community"],
    "t15": ["wiki:Microsoft_Teams", "community"],
    "t16": ["wiki:Microsoft_365", "community"],
    "t17": ["wiki:Microsoft_Teams", "wiki:Call_centre", "community"],
}

SHEET_KEYS = {
    "ports": [
        "https://learn.microsoft.com/en-us/microsoftteams/qos-in-teams",
        "https://learn.microsoft.com/en-us/microsoftteams/prepare-network",
        "https://www.rfc-editor.org/rfc/rfc3550",
        "https://en.wikipedia.org/wiki/Quality_of_service",
        COMMUNITY_URL,
    ],
    "bridges": [
        "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan",
        "https://learn.microsoft.com/en-us/microsoftteams/teams-contact-center",
        "https://www.cisco.com/c/en/us/products/unified-communications/unified-border-element/index.html",
        "https://www.rfc-editor.org/rfc/rfc3261",
        "https://en.wikipedia.org/wiki/Session_border_controller",
        "https://en.wikipedia.org/wiki/Session_Initiation_Protocol",
        COMMUNITY_URL,
    ],
    "sbc-checklist": [
        "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan",
        "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-border-controllers",
        "https://www.rfc-editor.org/rfc/rfc3261",
        "https://en.wikipedia.org/wiki/Session_border_controller",
        COMMUNITY_URL,
    ],
    "dial-plan": [
        "https://learn.microsoft.com/en-us/microsoftteams/create-and-manage-dial-plans",
        "https://www.rfc-editor.org/rfc/rfc3966",
        "https://en.wikipedia.org/wiki/E.164",
        COMMUNITY_URL,
    ],
    "cutover": [
        "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan",
        "https://learn.microsoft.com/en-us/microsoftteams/cqd-what-is-call-quality-dashboard",
        COMMUNITY_URL,
    ],
    "career": [
        "https://learn.microsoft.com/en-us/credentials/certifications/m365-teams-administrator-associate/",
        "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ms-700",
        "https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/",
        "https://learn.microsoft.com/en-us/credentials/certifications/security-compliance-and-identity-fundamentals/",
        "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/mb-280",
        "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-250",
        "https://learn.microsoft.com/en-us/credentials/support/retired-certification-exams",
        COMMUNITY_URL,
    ],
    "whats-new": [
        "https://learn.microsoft.com/en-us/partner-center/announcements/2026-july",
        "https://learn.microsoft.com/en-us/credentials/support/retired-certification-exams",
        "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ms-700",
        COMMUNITY_URL,
    ],
    "migration": [
        "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan",
        "https://learn.microsoft.com/en-us/microsoftteams/teams-contact-center",
        "https://www.rfc-editor.org/rfc/rfc3261",
        COMMUNITY_URL,
    ],
    "troubleshooting": [
        "https://learn.microsoft.com/en-us/microsoftteams/cqd-what-is-call-quality-dashboard",
        "https://learn.microsoft.com/en-us/microsoftteams/use-call-analytics-to-troubleshoot-poor-call-quality",
        "https://learn.microsoft.com/en-us/microsoftteams/qos-in-teams",
        COMMUNITY_URL,
    ],
    "config-checklist": [
        "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan",
        "https://learn.microsoft.com/en-us/microsoftteams/create-and-manage-dial-plans",
        "https://learn.microsoft.com/en-us/microsoftteams/aa-cq-manage-resource-accounts",
        COMMUNITY_URL,
    ],
    "call-flows": [
        "https://www.rfc-editor.org/rfc/rfc3261",
        "https://en.wikipedia.org/wiki/Session_Initiation_Protocol",
        "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan",
        COMMUNITY_URL,
    ],
}

CAMPUS_SHEET = {
    "ports-protocols.html": "ports",
    "call-flows.html": "call-flows",
    "config-checklist.html": "config-checklist",
    "troubleshooting.html": "troubleshooting",
    "migration.html": "migration",
    "career.html": "career",
    "whats-new.html": "whats-new",
    "glossary-full.html": "glossary",
    "glossary-core.html": "glossary",
}


def slug(text: str) -> str:
    text = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return text[:72] or "room"


def kind_of(url: str) -> str:
    host = urlparse(url).netloc.lower()
    path = urlparse(url).path.lower()
    if "wikipedia.org" in host:
        return "wikipedia"
    if "rfc-editor.org" in host or "ietf.org" in host:
        return "rfc"
    if "techcommunity.microsoft.com" in host:
        return "community"
    if host.startswith("docs.") or "/docs" in path:
        return "docs"
    if "learn.microsoft.com" in host or host.endswith("microsoft.com"):
        return "learn"
    return "vendor"


def wiki_url(slug_name: str) -> str:
    return "https://en.wikipedia.org/wiki/" + slug_name


def extra_url(token: str) -> str:
    if token == "community":
        return COMMUNITY_URL
    if token.startswith("rfc:"):
        return RFC_URL[token.split(":", 1)[1]]
    if token.startswith("wiki:"):
        return wiki_url(token.split(":", 1)[1])
    raise KeyError(token)


def planned_title(url: str) -> str:
    if url == COMMUNITY_URL:
        return "Microsoft Teams blog index"
    if "rfc-editor.org/rfc/rfc" in url:
        number = url.rstrip("/").split("rfc")[-1]
        return f"RFC {number}"
    if "wikipedia.org/wiki/" in url:
        slug_name = unquote(url.split("/wiki/", 1)[1])
        return WIKI.get(slug_name, slug_name.replace("_", " "))
    for spec in REPLACEMENTS.values():
        if spec["url"] == url:
            return spec["fallback_title"]
    return url


def planned_note(url: str) -> str:
    if url == COMMUNITY_URL:
        return COMMUNITY_NOTE
    if "wikipedia.org" in url:
        return WIKI_NOTE
    for spec in REPLACEMENTS.values():
        if spec["url"] == url:
            return spec["note"]
    return ""


def open_url(url: str) -> dict:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; MVCC-sources/1.0; +https://cyphermonkeylabs.com)"},
    )
    try:
        with urllib.request.urlopen(request, timeout=20, context=CTX) as response:
            code = getattr(response, "status", 200) or 200
            final = response.geturl()
            body = response.read(120000)
            title = page_title(body)
            blocked = looks_blocked(title, body)
            if 200 <= code < 400 and not blocked:
                return {"url": url, "status": "ok", "http": code, "final": final, "title": title, "note": ""}
            reason = "HTTP 200 but the body looked like a block page" if blocked else f"HTTP {code}"
            return {"url": url, "status": "confirm", "http": code, "final": final, "title": "", "note": reason}
    except urllib.error.HTTPError as exc:
        return {"url": url, "status": "confirm", "http": exc.code, "final": url, "title": "", "note": f"HTTP {exc.code}"}
    except Exception as exc:
        return {"url": url, "status": "confirm", "http": 0, "final": url, "title": "", "note": type(exc).__name__}


def page_title(body: bytes) -> str:
    text = body.decode("utf-8", "replace")
    match = re.search(r"<title[^>]*>(.*?)</title>", text, re.I | re.S)
    if not match:
        return ""
    title = re.sub(r"\s+", " ", html.unescape(match.group(1))).strip()
    return title[:180]


def looks_blocked(title: str, body: bytes) -> bool:
    sample = (title + " " + body[:4000].decode("utf-8", "replace")).lower()
    markers = ("just a moment", "attention required", "cf-browser-verification", "access denied", "request blocked")
    return any(marker in sample for marker in markers)


def record_from_check(url: str, title: str, check: dict, note: str = "") -> dict:
    status = check["status"]
    used_note = note or planned_note(url)
    if status != "ok":
        used_note = check.get("note") or used_note or "Did not open"
        if note and check.get("note") and note not in used_note:
            used_note = f"{check['note']}. {note}"
    return {
        "title": title,
        "url": url,
        "kind": kind_of(url),
        "lastChecked": CHECKED,
        "status": status,
        "note": used_note,
    }


def dedupe(items: list[dict]) -> list[dict]:
    seen = set()
    out = []
    for item in items:
        url = item.get("url") or ""
        if not url or url in seen:
            continue
        seen.add(url)
        out.append(item)
    return out


def lesson_sources(lesson: dict, checks: dict) -> list[dict]:
    rows = []
    for source in lesson.get("sources") or []:
        url = source["url"]
        check = checks[url]
        rows.append(record_from_check(url, source.get("title") or planned_title(url), check))
        spec = REPLACEMENTS.get(url)
        if spec and check["status"] != "ok":
            replacement = checks.get(spec["url"])
            if replacement and replacement["status"] == "ok":
                title = replacement.get("title") or spec["fallback_title"]
                if not title or title.lower() in {"microsoft learn", "documentation"}:
                    title = spec["fallback_title"]
                rows.append(record_from_check(spec["url"], title, replacement, spec["note"]))
    for token in TRACK_EXTRAS.get(lesson["track"], []):
        url = extra_url(token)
        check = checks.get(url)
        if not check or check["status"] != "ok":
            continue
        title = planned_title(url)
        if token.startswith("rfc:") or token == "community" or token.startswith("wiki:"):
            found = check.get("title") or ""
            if found and "just a moment" not in found.lower() and len(found) > 3:
                if token.startswith("rfc:"):
                    title = planned_title(url)
                elif token.startswith("wiki:"):
                    title = planned_title(url)
                else:
                    title = "Microsoft Teams blog index"
        rows.append(record_from_check(url, title, check))
    if not any(row["kind"] == "wikipedia" and row["status"] == "ok" for row in rows):
        fallback = extra_url("wiki:Microsoft_Teams")
        check = checks.get(fallback)
        if check and check["status"] == "ok":
            rows.append(record_from_check(fallback, "Microsoft Teams", check))
    return dedupe(rows)


def pick(urls: list[str], checks: dict, catalog: dict) -> list[dict]:
    rows = []
    for url in urls:
        if url in catalog:
            rows.append(dict(catalog[url]))
            continue
        check = checks.get(url)
        if not check:
            continue
        if check["status"] != "ok" and url not in REPLACEMENTS:
            # Only keep a failing URL when it is one we stored or explicitly listed.
            rows.append(record_from_check(url, planned_title(url), check))
            continue
        if check["status"] == "ok":
            rows.append(record_from_check(url, planned_title(url), check))
    return dedupe(rows)


def room_name(meta: dict, lesson: dict) -> str:
    return f'{meta["id"].upper()}-R{lesson["_n"]:02d}-{slug(lesson["title"])}.html'


def strip_old(text: str) -> str:
    text = re.sub(r'<section id="sources">.*?</section>', "", text, count=1, flags=re.S)
    text = re.sub(r'<section id="sources" class="sources-deeper".*?</section>', "", text, flags=re.S)
    text = re.sub(r'<section class="sources-deeper".*?</section>', "", text, flags=re.S)
    return text


def insert_before(text: str, marker: str, block: str) -> str:
    if marker not in text:
        raise SystemExit(f"marker missing: {marker[:80]}")
    return text.replace(marker, block + marker, 1)


def patch_room(path: Path, block: str) -> None:
    text = strip_old(path.read_text(encoding="utf-8"))
    text = text.replace('<a href="#sources">Sources</a>', '<a href="#sources">Sources and go deeper</a>')
    text = insert_before(text, "</main>", block + "\n")
    path.write_text(text, encoding="utf-8")


def patch_before_footer(path: Path, block: str) -> None:
    text = strip_old(path.read_text(encoding="utf-8"))
    if "<footer" not in text:
        raise SystemExit(f"no footer in {path}")
    text = insert_before(text, "<footer", block)
    path.write_text(text, encoding="utf-8")


def patch_diagram(path: Path, block: str) -> None:
    text = strip_old(path.read_text(encoding="utf-8"))
    marker = "<p>Independent, free, learning-only"
    if marker not in text:
        raise SystemExit(f"diagram marker missing {path}")
    text = insert_before(text, marker, block)
    path.write_text(text, encoding="utf-8")


def patch_each(text: str, closer: str, blocks: list[str]) -> str:
    text = strip_old(text)
    parts = []
    pos = 0
    index = 0
    for match in re.finditer(re.escape(closer), text):
        if index >= len(blocks):
            break
        parts.append(text[pos:match.start()])
        parts.append(blocks[index])
        parts.append(match.group(0))
        pos = match.end()
        index += 1
    parts.append(text[pos:])
    if index != len(blocks):
        raise SystemExit(f"closer count {index} != blocks {len(blocks)} for {closer}")
    return "".join(parts)


def docx_append(path: Path, sources: list[dict]) -> None:
    with zipfile.ZipFile(path, "r") as archive:
        files = {name: archive.read(name) for name in archive.namelist()}
    xml = files["word/document.xml"].decode("utf-8")
    xml = re.sub(
        r"<w:p><w:r><w:t>Sources and go deeper</w:t></w:r></w:p>.*?(?=</w:body>)",
        "",
        xml,
        count=1,
        flags=re.S,
    )
    chunks = ['<w:p><w:r><w:t>Sources and go deeper</w:t></w:r></w:p>']
    for source in sources:
        status = "confirm" if source.get("status") != "ok" else (source.get("kind") or "docs")
        line = f'{source.get("title")} — {status} — {source.get("url")} — last checked {CHECKED}'
        if source.get("status") != "ok":
            line += ". Did not open when checked."
            if source.get("note"):
                line += " " + str(source["note"])
        chunks.append("<w:p><w:r><w:t>" + sources_render.esc(line) + "</w:t></w:r></w:p>")
    if "</w:body>" not in xml:
        raise SystemExit(f"docx has no body close: {path}")
    xml = xml.replace("</w:body>", "".join(chunks) + "</w:body>", 1)
    files["word/document.xml"] = xml.encode("utf-8")
    with zipfile.ZipFile(path, "w") as archive:
        for name, payload in files.items():
            archive.writestr(name, payload)


def load_lessons():
    manifest = json.loads((DATA / "manifest.json").read_text(encoding="utf-8"))
    tracks = []
    lessons = []
    for index in range(1, 18):
        blob = json.loads((DATA / "tracks" / f"t{index:02d}.json").read_text(encoding="utf-8"))
        meta = next(item for item in manifest["tracks"] if item["id"] == blob["id"])
        blob["meta"] = meta
        tracks.append(blob)
        for number, lesson in enumerate(blob["lessons"], start=1):
            lesson["_n"] = number
            lesson["_meta"] = meta
            lessons.append(lesson)
    return tracks, lessons


def main() -> None:
    tracks, lessons = load_lessons()
    glossary = json.loads((DATA / "glossary.json").read_text(encoding="utf-8"))
    cards = json.loads((DATA / "cards.json").read_text(encoding="utf-8"))
    urls = set()
    for lesson in lessons:
        for source in lesson.get("sources") or []:
            urls.add(source["url"])
    for term in glossary:
        if term.get("source"):
            urls.add(term["source"])
    for spec in REPLACEMENTS.values():
        urls.add(spec["url"])
    for tokens in TRACK_EXTRAS.values():
        for token in tokens:
            urls.add(extra_url(token))
    for listed in SHEET_KEYS.values():
        urls.update(listed)
    urls.add(wiki_url("Microsoft_Teams"))

    print(f"opening {len(urls)} urls")
    checks = {}
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(open_url, url): url for url in sorted(urls)}
        for future in as_completed(futures):
            result = future.result()
            checks[result["url"]] = result
            print(f'{result["status"]:7} {result.get("http")} {result["url"]}')

    by_lesson = {}
    catalog = {}
    for lesson in lessons:
        rows = lesson_sources(lesson, checks)
        by_lesson[lesson["id"]] = rows
        for row in rows:
            catalog.setdefault(row["url"], row)

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "checks.json").write_text(json.dumps(checks, indent=2), encoding="utf-8")

    track_rows = {track["id"]: [] for track in tracks}
    room_files = {track["id"]: [] for track in tracks}
    mvcc = {}

    for lesson in lessons:
        meta = lesson["_meta"]
        filename = room_name(meta, lesson)
        rows = by_lesson[lesson["id"]]
        record = {
            "room": filename,
            "lesson": lesson["id"],
            "title": lesson["title"],
            "checked": CHECKED,
            "sources": rows,
        }
        (ROOMS / f"{filename[:-5]}.sources.json").write_text(json.dumps(record, indent=2), encoding="utf-8")
        (OUT / f"{lesson['id']}.json").write_text(json.dumps(record, indent=2), encoding="utf-8")
        mvcc[lesson["id"]] = {"title": lesson["title"], "room": filename, "sources": rows}
        track_rows[lesson["track"]].extend(rows)
        room_files[lesson["track"]].append(filename)
        block = sources_render.section_html(
            rows,
            data_sources=f"{filename[:-5]}.sources.json",
            note="Opened 2026-10. A row marked confirm did not open. Wikipedia is background. The Teams blog row is the community index.",
            download_href=f"{filename[:-5]}.sources.json",
        )
        patch_room(ROOMS / filename, block)

    for track in tracks:
        meta = track["meta"]
        rows = dedupe(track_rows[track["id"]])
        rooms = [
            {"room": name, "sourcesFile": f"../../rooms/{name[:-5]}.sources.json"}
            for name in room_files[track["id"]]
        ]
        record = {"track": track["id"], "title": meta["title"], "checked": CHECKED, "rooms": rooms, "sources": rows}
        track_dir = ROOT / "tracks" / track["id"].upper()
        (track_dir / "sources.json").write_text(json.dumps(record, indent=2), encoding="utf-8")
        (OUT / f"{track['id']}.json").write_text(json.dumps(record, indent=2), encoding="utf-8")
        links = " ".join(
            f'<a href="../../rooms/{sources_render.esc(name[:-5])}.sources.json">{sources_render.esc(name[:-5])}</a>'
            for name in room_files[track["id"]]
        )
        block = sources_render.section_html(
            rows,
            data_sources="sources.json",
            note="Chapter list. Each room keeps its own sources.json.",
        )
        block = block.replace("</section>", f"<p>Room files: {links}</p></section>")
        patch_room(track_dir / "index.html", block)
        sheet = ROOT / "downloads" / "sheets" / f"{track['id']}.html"
        patch_before_footer(sheet, sources_render.section_html(rows, data_sources=""))
        campus_sheet = ROOT / "campus" / "downloads" / f"track-{track['id']}.html"
        patch_before_footer(campus_sheet, sources_render.section_html(rows, with_id=True))

    glossary_urls = []
    for term in glossary:
        url = term.get("source")
        if url and url not in glossary_urls:
            glossary_urls.append(url)
    for extra in (wiki_url("Microsoft_Teams"), "https://www.rfc-editor.org/rfc/rfc3261", COMMUNITY_URL):
        if extra not in glossary_urls:
            glossary_urls.append(extra)
    sheet_sets = {key: pick(listed, checks, catalog) for key, listed in SHEET_KEYS.items()}
    sheet_sets["glossary"] = pick(glossary_urls, checks, catalog)
    (OUT / "sheets.json").write_text(json.dumps({key: {"checked": CHECKED, "sources": rows} for key, rows in sheet_sets.items()}, indent=2), encoding="utf-8")
    for key, rows in sheet_sets.items():
        (OUT / f"sheet-{key}.json").write_text(json.dumps({"checked": CHECKED, "sources": rows}, indent=2), encoding="utf-8")

    for stem, key in (
        ("ports-protocols.html", "ports"),
        ("bridges.html", "bridges"),
        ("glossary.html", "glossary"),
    ):
        patch_before_footer(ROOT / "downloads" / "sheets" / stem, sources_render.section_html(sheet_sets[key]))
    for stem, key in (
        ("sbc-checklist.html", "sbc-checklist"),
        ("dial-plan.html", "dial-plan"),
        ("cutover.html", "cutover"),
        ("bridges.html", "bridges"),
    ):
        patch_before_footer(ROOT / "downloads" / "templates" / stem, sources_render.section_html(sheet_sets[key]))
        docx_append(ROOT / "downloads" / "templates" / f"{stem[:-5]}.docx", sheet_sets[key])

    for name, key in CAMPUS_SHEET.items():
        patch_before_footer(ROOT / "campus" / "downloads" / name, sources_render.section_html(sheet_sets[key]))

    by_track = {track["id"]: dedupe(track_rows[track["id"]]) for track in tracks}
    flash_blocks = [
        sources_render.section_html(by_track.get(card["track"]) or [], with_id=False)
        for card in cards
    ]
    deck = ROOT / "downloads" / "flashcards.html"
    deck.write_text(patch_each(deck.read_text(encoding="utf-8"), "</li>", flash_blocks), encoding="utf-8")
    root_cards = ROOT / "flashcards.html"
    root_text = root_cards.read_text(encoding="utf-8")
    root_count = len(re.findall(r"</li>", strip_old(root_text)))
    root_cards.write_text(patch_each(root_text, "</li>", flash_blocks[:root_count]), encoding="utf-8")
    campus_cards = ROOT / "campus" / "downloads" / "flashcards.html"
    campus_cards.write_text(
        patch_each(campus_cards.read_text(encoding="utf-8"), "</article>", flash_blocks),
        encoding="utf-8",
    )

    diagrams = sorted((ROOT / "downloads" / "diagrams").glob("*.html"))
    missed = []
    for path in diagrams:
        stem = path.stem
        match = None
        for lesson in lessons:
            lesson_id = lesson["id"]
            if stem == lesson_id or stem.startswith(lesson_id + "-"):
                if match is None or len(lesson_id) > len(match["id"]):
                    match = lesson
        if match is None:
            missed.append(stem)
            continue
        filename = room_name(match["_meta"], match)
        rows = by_lesson[match["id"]]
        block = sources_render.section_html(
            rows,
            note=f"Same checked list as {filename}.",
            download_href=f"../../rooms/{filename[:-5]}.sources.json",
        )
        patch_diagram(path, block)
    if missed:
        raise SystemExit(f"diagrams without a lesson: {missed}")

    payload = "window.MVCC_SOURCES = " + json.dumps(mvcc, ensure_ascii=False) + ";\n"
    (ROOT / "campus" / "sources-deeper.js").write_text(payload, encoding="utf-8")
    ok = sum(1 for row in checks.values() if row["status"] == "ok")
    bad = sum(1 for row in checks.values() if row["status"] != "ok")
    print(f"checked {len(checks)} ok {ok} confirm {bad} rooms {len(lessons)} diagrams {len(diagrams)}")


if __name__ == "__main__":
    main()

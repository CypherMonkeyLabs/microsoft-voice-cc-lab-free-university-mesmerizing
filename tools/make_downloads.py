#!/usr/bin/env python3
"""Write printable cheat sheets, flashcard decks, and the offline zip. No CDN."""

from __future__ import annotations

import argparse
import html
import json
import textwrap
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from glossary_core import EXTRA, ROWS
from tips import TIPS

ROOT = Path(__file__).resolve().parents[1]
CAMPUS = ROOT / "campus"
OUT = CAMPUS / "downloads"
FONT = Path("/usr/share/fonts/truetype/macos/Inter-Regular.ttf")
FONT_B = Path("/usr/share/fonts/truetype/macos/Inter-Bold.ttf")
REPO = "https://github.com/CypherMonkeyLabs/microsoft-voice-cc-lab-free-university-mesmerizing"
FOOT = (
    "CypherMonkey · cyphermonkeylabs.com · linktr.ee/cyphermonkey · "
    + REPO
    + " · Independent educational project, not affiliated with or endorsed by any vendor. "
    "Trademarks belong to their owners. MIT code, CC BY-NC-SA content. No email."
)

TRACKS = {
    "t01": "01 Foundations",
    "t02": "02 Licensing",
    "t03": "03 PowerShell and admin",
    "t04": "04 Network and QoS",
    "t05": "05 PSTN connectivity",
    "t06": "06 Routing and dial plans",
    "t07": "07 Attendants and queues",
    "t08": "08 Emergency, LBR, survivability",
    "t09": "09 Devices and media",
    "t10": "10 Session border controllers",
    "t11": "11 TLS, certificates, SIP",
    "t12": "12 Troubleshooting",
    "t13": "13 Dynamics contact center",
    "t14": "14 Coexistence and CCaaS",
    "t15": "15 ACS, Speech, Copilot",
    "t16": "16 Certifications and status",
    "t17": "17 Ecosystem",
}

PORT_LINES = [
    "Ports and protocols — commercial Microsoft 365 voice",
    "Firewall prefixes re-checked 15 October 2026. Two lists. Do not merge them.",
    "Source: https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan",
    "Source: https://learn.microsoft.com/en-us/microsoft-365/enterprise/urls-and-ip-address-ranges",
    "Source: https://learn.microsoft.com/en-us/microsoftteams/qos-in-teams",
    "",
    "Direct Routing signaling   TCP 5061   TLS to sip, sip2, and sip3",
    "Media low                 UDP 3478-3481",
    "Media high                UDP 49152-53247",
    "Client audio              UDP/TCP 50000-50019   DSCP 46 EF",
    "Client video              UDP/TCP 50020-50039   DSCP 34 AF41",
    "Client sharing            UDP/TCP 50040-50059   DSCP 18 AF21",
    "Client signaling          UDP/TCP 50070-50089   DSCP 40 CS5, not configurable",
    "SBC signaling and media     52.112.0.0/14 and 52.120.0.0/14",
    "SBC IPv6                   2603:1063:400::/40, media also 2603:1063:100::/40",
    "Teams client optimize      52.112.0.0/14 and 52.122.0.0/15, IPv6 2603:1063::/38",
    "GCC High media             52.127.88.0/21    DoD media 52.127.64.0/21",
    "52.120.0.0/14 is not the client optimize list. 52.122.0.0/15 is not the SBC pair.",
    "",
    "GCC High and DoD use different proxy names. Do not copy a commercial ACL.",
    "Browser joins do not use the fixed 50000 desktop ranges.",
    "Signaling stays with Teams. Media bypass does not move SIP off 5061.",
]

FLOW_LINES = [
    "Call flow — Teams client, SIP proxy, SBC, carrier",
    "Source: Plan Direct Routing, accessed 14 October 2026.",
    "",
    "1. Client marks audio when QoS is enabled.",
    "2. Teams sends SIP/TLS to the PSTN hubs on TCP 5061.",
    "3. SBC presents a public certificate. The paired FQDN is in the name.",
    "4. OPTIONS. Repeated misses pull the trunk out of the route.",
    "5. INVITE carries the normalized E.164 number.",
    "6. 100 Trying, 180 Ringing, 200 OK, ACK.",
    "7. Media uses the UDP ranges, or a bypass path you designed.",
    "8. BYE tears the dialog down. Recording needs its own policy grant.",
    "",
    "Emergency: resolve a dispatchable location before queue music.",
    "Do not place a real emergency call to test this sheet.",
]

CONFIG_LINES = [
    "Configuration checklist — Teams Phone",
    "Sources: setting up your phone system, dial plans, voice routing, Direct Routing plan.",
    "Accessed 14 October 2026.",
    "",
    "[ ] Tenant and verified domain confirmed",
    "[ ] User homed online, not Islands, for Direct Routing",
    "[ ] Teams Phone license, and a PSTN option named out loud",
    "[ ] Resource accounts licensed as resource accounts",
    "[ ] Dial plan: first matching normalization rule wins",
    "[ ] Voice routing policy ordered, route lists a backup gateway",
    "[ ] SBC FQDN paired, certificate name matches",
    "[ ] TCP 5061 to all three commercial proxies",
    "[ ] Media ranges open, or bypass documented",
    "[ ] Emergency location is dispatchable for that network",
    "[ ] Compliance recording policy granted if the business records",
    "[ ] One owner for number transforms during coexistence",
]

TROUBLE_LINES = [
    "Troubleshooting tree",
    "Sources: Call Analytics, Call Quality Dashboard, Direct Routing plan.",
    "Accessed 14 October 2026.",
    "",
    "No dial tone",
    "  License or voice routing policy missing, or the user is in the wrong tenant.",
    "SIP fails before OPTIONS",
    "  Certificate name, private CA, or TLS version. 5061 never opens.",
    "OPTIONS misses",
    "  Trunk out of service. Failover only if the route lists the next gateway.",
    "Connects, silence",
    "  Media ports or a bypass path that the network blocks.",
    "One user sounds bad",
    "  Call Analytics, not a CQD building case.",
    "Whole subnet looks bad",
    "  CQD. Check loss, jitter, RTT, and whether DSCP survived.",
    "VPN",
    "  Full tunnel hides the site and often strips the mark.",
    "Both sides transform numbers",
    "  Pick one normalization owner before the next cutover.",
]

NEWS_LINES = [
    "What is new — 14 October 2026",
    "MS-700 is still live. Skills update 27 October 2026. No replacement.",
    "MB-280 retired 31 July 2026. AB-210 is the successor and is in beta.",
    "AB-210 is not the contact-center exam and does not replace MS-700.",
    "AB-250 is the Dynamics 365 Contact Center exam. Confirm the live seat.",
    "SC-900 English update scheduled 21 October 2026.",
    "AZ-900 still a fundamentals exam on this board.",
    "MS-900 retired 31 March 2026. AI-900 retired 30 June 2026.",
    "Anything beyond this list is unverified in this lab.",
    "Source: Microsoft Learn certification pages, accessed 14 October 2026.",
]

MIGRATE_LINES = [
    "Migration and cutover checklist",
    "Teaching list. Not a carrier porting agreement.",
    "Source: PSTN connectivity options and Plan Direct Routing, 14 October 2026.",
    "",
    "1. Inventory users, devices, numbers, hours, analog, and hunt groups.",
    "2. Identity: online, out of Islands, resource accounts in Entra ID.",
    "3. One owner for normalization. Write the ranges that stay and the ranges that move.",
    "4. Certified SBC, verified domain, public certificate, 5061, media.",
    "5. Pilot: one site, OPTIONS healthy, emergency location that is not a live 911 test.",
    "6. Cut over when the pilot is boring. Trombone during dual-running is expected.",
    "7. Hypercare: OPTIONS, CQD for the new subnet, Call Analytics for one user.",
    "Named-customer stories are unverified in this lab.",
]

CAREER_LINES = [
    "Career paths this lab will name",
    "Teams voice engineer — MS-700, still live.",
    "Contact-center builder — AB-250. Confirm the seat.",
    "SBC specialist — no separate Microsoft SBC exam on this board.",
    "Recording and compliance — SC-900 for trust language, plus the recording policy.",
    "Fundamentals — AZ-900 and SC-900.",
    "Interview: draw the call, name the missing license, separate CQD from one user.",
    "Salary bands and employer requirements are unverified.",
    "Source: Microsoft Learn study guides, accessed 14 October 2026.",
]


def ascii_text(value: str) -> str:
    return value.encode("ascii", "replace").decode("ascii")


def wrap_lines(lines: list[str], width: int = 92) -> list[str]:
    out: list[str] = []
    for line in lines:
        if not line:
            out.append("")
            continue
        out.extend(textwrap.wrap(line, width) or [""])
    return out


def footer_html() -> str:
    return (
        "<footer><p><strong>CypherMonkey</strong> · "
        '<a href="https://cyphermonkeylabs.com">cyphermonkeylabs.com</a> · '
        '<a href="https://linktr.ee/cyphermonkey">linktr.ee/cyphermonkey</a> · '
        f'<a href="{html.escape(REPO)}">Repo: rate, comment, help</a> · '
        '<a href="https://dev.to/cyphermonkey">DEV</a> · '
        '<a href="https://huggingface.co/Cypher0x9">Hugging Face</a> · '
        '<a href="https://x.com/Cypher0x9">X</a></p>'
        "<p>Independent educational project, not affiliated with or endorsed by any vendor. "
        "Trademarks belong to their owners. MIT code, CC BY-NC-SA content.</p>"
        "<p>Report a concern and work with us: "
        '<a href="https://cyphermonkeylabs.com/#contact">cyphermonkeylabs.com contact form</a>. '
        "No email on this sheet.</p></footer>"
    )


def write_html(path: Path, title: str, lines: list[str]) -> None:
    body = "\n".join(f"<p>{html.escape(line) if line else '&nbsp;'}</p>" for line in lines)
    doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<style>
  body {{ margin: 24px auto; max-width: 820px; font: 16px/1.45 Inter, Segoe UI, sans-serif; color: #142033; background: #f7f4ea; }}
  h1 {{ font-size: 28px; letter-spacing: -0.03em; }}
  p {{ margin: 0 0 6px; }}
  footer {{ margin-top: 28px; border-top: 2px solid #123; padding-top: 12px; font-size: 13px; }}
  a {{ color: #123; }}
  @media print {{ body {{ background: #fff; }} }}
</style>
</head>
<body>
<h1>{html.escape(title)}</h1>
{body}
{footer_html()}
</body>
</html>
"""
    path.write_text(doc, encoding="utf-8")


def write_png(path: Path, title: str, lines: list[str]) -> None:
    width, height = 1240, 1754
    image = Image.new("RGB", (width, height), "#f7f4ea")
    draw = ImageDraw.Draw(image)
    regular = ImageFont.truetype(str(FONT), 28)
    bold = ImageFont.truetype(str(FONT_B), 42)
    small = ImageFont.truetype(str(FONT), 18)
    draw.rounded_rectangle((36, 36, width - 36, height - 36), radius=18, outline="#12324d", width=4)
    draw.text((64, 64), title[:70], font=bold, fill="#12324d")
    y = 140
    for line in wrap_lines(lines, 68)[:42]:
        draw.text((64, y), ascii_text(line), font=regular, fill="#1b2433")
        y += 34
    footer = wrap_lines([FOOT], 90)
    fy = height - 36 - 28 * len(footer) - 16
    draw.line((64, fy - 12, width - 64, fy - 12), fill="#12324d", width=2)
    for line in footer:
        draw.text((64, fy), ascii_text(line), font=small, fill="#334155")
        fy += 24
    image.save(path, "PNG")


def pdf_escape(text: str) -> str:
    return ascii_text(text).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def write_pdf(path: Path, title: str, lines: list[str]) -> None:
    pages = []
    chunk: list[str] = []
    wrapped = wrap_lines([title, ""] + lines + ["", FOOT], 92)
    for line in wrapped:
        chunk.append(line)
        if len(chunk) == 46:
            pages.append(chunk)
            chunk = []
    if chunk:
        pages.append(chunk)
    objects: list[bytes] = []

    def add(data: str) -> int:
        objects.append(data.encode("latin-1", "replace"))
        return len(objects)

    font_id = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    page_ids = []
    content_ids = []
    for page in pages:
        commands = ["BT", "/F1 11 Tf", "50 780 Td", "14 TL"]
        first = True
        for line in page:
            if first:
                commands.append(f"({pdf_escape(line)}) Tj")
                first = False
            else:
                commands.append(f"T* ({pdf_escape(line)}) Tj")
        commands.append("ET")
        stream = "\n".join(commands).encode("latin-1", "replace")
        content = b"<< /Length " + str(len(stream)).encode("ascii") + b" >>\nstream\n" + stream + b"\nendstream"
        objects.append(content)
        content_ids.append(len(objects))
    for content_id in content_ids:
        page = (
            f"<< /Type /Page /Parent 0 0 R /MediaBox [0 0 612 792] "
            f"/Contents {content_id} 0 R /Resources << /Font << /F1 {font_id} 0 R >> >> >>"
        )
        page_ids.append(add(page))
    kids = " ".join(f"{pid} 0 R" for pid in page_ids)
    pages_id = add(f"<< /Type /Pages /Count {len(page_ids)} /Kids [{kids}] >>")
    # Fix parent references now that pages_id is known.
    for pid in page_ids:
        objects[pid - 1] = objects[pid - 1].replace(b"/Parent 0 0 R", f"/Parent {pages_id} 0 R".encode("ascii"))
    catalog_id = add(f"<< /Type /Catalog /Pages {pages_id} 0 R >>")
    out = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(out))
        out.extend(f"{index} 0 obj\n".encode("ascii"))
        out.extend(obj)
        out.extend(b"\nendobj\n")
    xref = len(out)
    out.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    out.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        out.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    out.extend(f"trailer << /Size {len(objects) + 1} /Root {catalog_id} 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode("ascii"))
    path.write_bytes(out)


def glossary_lines(rows: list[tuple], limit: int | None) -> list[str]:
    lines = [
        "Glossary sheet. Definitions are the campus teaching lines, not a vendor glossary copy.",
        "Accessed 14 October 2026. Open the in-app glossary for the config note and the fault.",
        "",
    ]
    chosen = rows if limit is None else rows[:limit]
    for row in chosen:
        lines.append(f"{row[0]} — {row[2]}")
    if limit is not None:
        lines.append("")
        lines.append(f"Showing {len(chosen)} core terms. The full HTML sheet lists every core row.")
    return lines


def track_lines(track_id: str) -> list[str]:
    pack = TIPS[track_id]
    lines = [TRACKS[track_id], ""]
    lines.append("Pro tips")
    for tip in pack["tips"]:
        lines.append("• " + str(tip))
    lines.append("")
    lines.append("Interview traps")
    for trap in pack["traps"]:
        lines.append("• " + str(trap))
    lines.append("")
    lines.append("Cheat sheet")
    lines.extend(str(pack["sheet"]).splitlines())
    lines.append("")
    lines.append("Facts in the long lessons were checked 14 October 2026. This sheet is a memory aid.")
    return lines


def write_sheet(stem: str, title: str, lines: list[str], catalog: list[dict], kind: str) -> None:
    write_html(OUT / f"{stem}.html", title, lines)
    write_png(OUT / f"{stem}.png", title, lines)
    write_pdf(OUT / f"{stem}.pdf", title, lines)
    catalog.append({
        "href": f"downloads/{stem}.html",
        "title": title,
        "kind": kind,
        "blurb": "HTML, PDF, and PNG. Print from the browser. Footer included.",
    })


def write_flashcards() -> None:
    cards = json.loads((CAMPUS / "data" / "cards.json").read_text(encoding="utf-8"))
    payload = {
        "title": "Microsoft Voice & Contact Center Lab flashcards",
        "checked": "2026-10-14",
        "footer": FOOT,
        "source": "Generated from the campus glossary. Not a copy of a vendor document.",
        "cards": cards,
    }
    (OUT / "flashcards.json").write_text(json.dumps(payload, ensure_ascii=True, indent=2), encoding="utf-8")
    blocks = []
    for card in cards:
        blocks.append(
            "<article class='card'><h2>"
            + html.escape(card["front"])
            + "</h2><p>"
            + html.escape(card["back"])
            + "</p><p class='meta'>Track "
            + html.escape(card["track"])
            + "</p></article>"
        )
    doc = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Flashcards</title>
<style>
  body {{ font: 15px/1.4 Inter, Segoe UI, sans-serif; margin: 16px; color: #142033; background: #fff; }}
  .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }}
  .card {{ break-inside: avoid; border: 1px solid #123; border-radius: 10px; padding: 10px 12px; }}
  h2 {{ font-size: 16px; margin: 0 0 6px; }}
  p {{ margin: 0; }}
  .meta {{ color: #475569; margin-top: 6px; font-size: 12px; }}
  footer {{ margin-top: 18px; font-size: 12px; }}
  @media print {{ .card {{ break-inside: avoid; }} }}
</style></head><body>
<h1>Flashcards</h1>
<p>{len(cards)} cards from the campus glossary. Print and fold, or use the JSON deck offline.</p>
<div class="grid">{''.join(blocks)}</div>
{footer_html()}
</body></html>"""
    (OUT / "flashcards.html").write_text(doc, encoding="utf-8")
    pdf_lines = [f"{card['front']} — {card['back']}" for card in cards]
    write_pdf(OUT / "flashcards.pdf", "Flashcards", pdf_lines)


def write_full_glossary(rows: list[tuple]) -> None:
    lines = [f"<li><strong>{html.escape(row[0])}</strong> — {html.escape(row[2])}</li>" for row in rows]
    doc = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Glossary</title>
<style>
  body {{ margin: 24px auto; max-width: 820px; font: 16px/1.45 Inter, Segoe UI, sans-serif; color: #142033; }}
  footer {{ margin-top: 24px; font-size: 13px; }}
</style></head><body>
<h1>Glossary</h1>
<p>Core terms from this campus. Each in-app entry also has a config note and a fault. Accessed 14 October 2026.</p>
<ul>
{''.join(lines)}
</ul>
{footer_html()}
</body></html>"""
    (OUT / "glossary-full.html").write_text(doc, encoding="utf-8")


def build_sheets() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    catalog: list[dict] = [
        {
            "href": "downloads/microsoft-voice-contact-center-lab.zip",
            "title": "Offline bundle",
            "kind": "Zip",
            "blurb": "The campus folder, including these sheets. Serve it with any static file server.",
        },
        {
            "href": "downloads/flashcards.json",
            "title": "Flashcard deck JSON",
            "kind": "JSON",
            "blurb": "Every card in the campus deck, with the standard footer in the file header.",
        },
        {
            "href": "downloads/flashcards.html",
            "title": "Printable flashcards",
            "kind": "HTML",
            "blurb": "Two-up cards for the printer. A PDF of the same deck sits beside it.",
        },
    ]
    topics = [
        ("ports-protocols", "Ports and protocols", PORT_LINES, "Sheet"),
        ("call-flows", "Call flows", FLOW_LINES, "Sheet"),
        ("config-checklist", "Configuration checklist", CONFIG_LINES, "Sheet"),
        ("troubleshooting", "Troubleshooting tree", TROUBLE_LINES, "Sheet"),
        ("migration", "Migration and cutover", MIGRATE_LINES, "Sheet"),
        ("career", "Career paths", CAREER_LINES, "Sheet"),
        ("whats-new", "What is new", NEWS_LINES, "Sheet"),
    ]
    rows = list(ROWS) + list(EXTRA)
    topics.insert(4, ("glossary-core", "Glossary core", glossary_lines(rows, 16), "Sheet"))
    for stem, title, lines, kind in topics:
        write_sheet(stem, title, lines, catalog, kind)
    for track_id, title in TRACKS.items():
        write_sheet("track-" + track_id, title, track_lines(track_id), catalog, "Track sheet")
    write_full_glossary(rows)
    catalog.append({
        "href": "downloads/glossary-full.html",
        "title": "Full core glossary",
        "kind": "HTML",
        "blurb": "Every core glossary row on one printable page set.",
    })
    write_flashcards()
    (OUT / "catalog.json").write_text(
        json.dumps({"items": catalog}, ensure_ascii=True, indent=2),
        encoding="utf-8",
    )
    print(f"sheets {len(catalog)} catalog rows in {OUT}")


def build_zip() -> None:
    target = OUT / "microsoft-voice-contact-center-lab.zip"
    release = ROOT / "releases" / "microsoft-voice-contact-center-lab.zip"
    if target.exists():
        target.unlink()
    with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in CAMPUS.rglob("*"):
            if not path.is_file():
                continue
            if path.suffix == ".zip":
                continue
            archive.write(path, path.relative_to(CAMPUS.parent).as_posix())
    release.parent.mkdir(parents=True, exist_ok=True)
    release.write_bytes(target.read_bytes())
    print(f"zip {target.stat().st_size} bytes")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--zip-only", action="store_true")
    parser.add_argument("--sheets-only", action="store_true")
    args = parser.parse_args()
    if args.zip_only:
        build_zip()
        return
    build_sheets()
    if not args.sheets_only:
        build_zip()


if __name__ == "__main__":
    main()

"""Render a Sources and go deeper block from already-checked source records."""

from __future__ import annotations

import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "campus" / "data" / "sources"
CHECKED = "2026-10"

KIND_LABEL = {
    "learn": "Microsoft Learn",
    "docs": "Docs",
    "rfc": "RFC",
    "community": "Community",
    "wikipedia": "Wikipedia",
    "vendor": "Vendor",
}

SECTION_STYLE = (
    "margin:18px 0;padding:14px 16px;border:2px solid #0f766e;"
    "border-radius:16px;background:#ecfdf5;color:#052e2b"
)
CONFIRM_STYLE = "border-left:4px solid #b45309;padding-left:8px;margin:8px 0"


def esc(text) -> str:
    return html.escape(str(text if text is not None else ""), quote=True)


def kind_label(kind: str) -> str:
    return KIND_LABEL.get(kind or "", "Docs")


def item_html(source: dict) -> str:
    title = esc(source.get("title") or source.get("url") or "Untitled")
    url = esc(source.get("url") or "")
    checked = esc(source.get("lastChecked") or CHECKED)
    note = esc(source.get("note") or "")
    if source.get("status") != "ok":
        extra = f" {note}" if note else ""
        return (
            f'<li class="is-confirm" style="{CONFIRM_STYLE}"><strong>{title}</strong>'
            f" — confirm — last checked {checked}."
            f' <a href="{url}">{url}</a> did not open when checked.{extra}</li>'
        )
    tail = f" {note}" if note else ""
    return (
        f'<li><a href="{url}">{title}</a> — {esc(kind_label(source.get("kind")))}'
        f" — last checked {checked}.{tail}</li>"
    )


def section_html(
    sources: list[dict],
    *,
    data_sources: str = "",
    with_id: bool = True,
    note: str = "",
    download_href: str = "",
) -> str:
    rows = "".join(item_html(source) for source in sources)
    if not rows:
        rows = (
            '<li class="is-confirm" style="' + CONFIRM_STYLE + '">'
            "<strong>No checked URL for this page</strong> — confirm — "
            f"last checked {CHECKED}.</li>"
        )
    attr = f' data-sources="{esc(data_sources)}"' if data_sources else ""
    ident = ' id="sources"' if with_id else ""
    note_html = f"<p>{esc(note)}</p>" if note else ""
    download = ""
    if download_href:
        download = (
            f'<p class="room-dl"><a class="dl-btn" href="{esc(download_href)}" download>sources.json</a></p>'
        )
    return (
        f'<section{ident} class="sources-deeper"{attr} style="{SECTION_STYLE}">'
        f"<h2>Sources and go deeper</h2>{note_html}<ul>{rows}</ul>{download}</section>"
    )


def load_record(name: str) -> dict:
    path = SOURCES / name
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def sources_named(name: str) -> list[dict]:
    record = load_record(name)
    return list(record.get("sources") or [])

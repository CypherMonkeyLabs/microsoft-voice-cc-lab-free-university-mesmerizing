"""Lesson heading translations. Bodies stay English. Product names and exam codes stay."""

from __future__ import annotations

from pathlib import Path

from lesson_rows import LESSON_ROWS

LANGS = ("es", "hi", "te", "fr", "de", "ja", "ar")
HERE = Path(__file__).resolve().parent / "headings"


def translations() -> dict[str, dict[str, str]]:
    ids = [row[0] for row in LESSON_ROWS]
    out: dict[str, dict[str, str]] = {item: {} for item in ids}
    for lang in LANGS:
        lines = (HERE / f"{lang}.txt").read_text(encoding="utf-8").splitlines()
        if len(lines) != len(ids):
            raise SystemExit("%s has %s lines, want %s" % (lang, len(lines), len(ids)))
        for item, line in zip(ids, lines):
            text = line.strip()
            if not text:
                raise SystemExit("empty %s %s" % (lang, item))
            out[item][lang] = text
    return out

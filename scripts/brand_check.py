#!/usr/bin/env python3
"""Flag income claims and disallowed profile links in lab pages.

A host-name denylist inside frame.js is not a link. Citation anchors are
reported, not failed, unless they are LinkedIn or Spotify.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
BANNED = re.compile(r"linkedin\.com|spotify\.com|salary|earnings|get hired|land a job|job guarantee", re.I)
problems = []
for path in ROOT.rglob("*"):
    if not path.is_file() or path.suffix.lower() not in {".html", ".js", ".mjs", ".md", ".json", ".css"}:
        continue
    rel = path.relative_to(ROOT).as_posix()
    if rel.startswith(("campus/vendor/", "vendor/", "node_modules/", ".git/")):
        continue
    text = path.read_text(errors="replace")
    if rel == "assets/js/frame.js":
        text = re.sub(r"linkedin\.com|spotify", "", text, flags=re.I)
    for match in BANNED.finditer(text):
        problems.append(f"{rel}: {match.group(0)}")

for problem in problems:
    print("FAIL", problem)
print("brand_check:", len(problems), "hits")
sys.exit(1 if problems else 0)

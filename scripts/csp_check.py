#!/usr/bin/env python3
"""Report off-origin loads. Anchor links to other sites are not loads.

Exit 1 when a script, stylesheet, image, media, import, fetch, or CSS url()
points at another origin. Citation anchors are ignored.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
LOADS = [
    (r"<(?:script|img|iframe|source|video|audio)[^>]+\bsrc=[\"'](https?://[^\"']+)", "html src"),
    (r"<link[^>]+href=[\"'](https?://[^\"']+)", "html link"),
    (r"url\(\s*[\"']?(https?://[^)\"']+)", "css url()"),
    (r"@import\s+[\"'](https?://[^\"']+)", "css @import"),
    (r"\bimport\s*(?:\(|[^;]*from\s*)[\"'](https?://[^\"']+)", "js import"),
    (r"\bfetch\(\s*[\"'`](https?://[^\"'`]+)", "js fetch"),
    (r"new (?:Worker|WebSocket|EventSource)\(\s*[\"'`](https?://[^\"'`]+)", "js net"),
]
SKIP = {"campus/vendor", "vendor", "node_modules", "test-results", "playwright-report"}
fail = []
files = []
for path in ROOT.rglob("*"):
    if not path.is_file() or path.suffix.lower() not in {".html", ".css", ".js", ".mjs"}:
        continue
    rel = path.relative_to(ROOT).as_posix()
    if rel.startswith(tuple(prefix + "/" for prefix in SKIP)) or rel.split("/")[0] in SKIP or "/.git/" in rel:
        continue
    files.append(path)

for path in files:
    text = path.read_text(errors="replace")
    for pattern, kind in LOADS:
        for match in re.finditer(pattern, text, re.I):
            fail.append(f"{path.relative_to(ROOT)}: off-origin {kind}: {match.group(1)}")

print("files scanned:", len(files))
for item in fail:
    print("FAIL", item)
print("csp_check:", len(fail), "off-origin loads")
sys.exit(1 if fail else 0)

#!/usr/bin/env python3
"""Reprint sheet PDFs from the HTML that already ends with Sources and go deeper, rewrite the deck, and rebuild the offline zips."""

from __future__ import annotations

import json
import subprocess
import time
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import build_round2

ROOT = build_round2.ROOT
CHROME = build_round2.CHROME


def deck_slides() -> list[tuple[str, str]]:
    manifest = json.loads((ROOT / "campus" / "data" / "manifest.json").read_text(encoding="utf-8"))
    slides = [(track["title"], track.get("why") or "") for track in manifest["tracks"]]
    slides.extend(build_round2.sources_deck_slides())
    return slides


def pdf_ready(dest: Path) -> bool:
    if not dest.exists() or dest.stat().st_size <= 1000:
        return False
    return dest.read_bytes()[:5] == b"%PDF-"


def print_pdf(src: Path, dest: Path) -> str:
    dest.parent.mkdir(parents=True, exist_ok=True)
    profile = f"/tmp/chrome-pdf-{dest.parent.name}-{dest.stem}"
    cmd = [
        CHROME,
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        "--window-size=1100,1400",
        f"--user-data-dir={profile}",
        f"--print-to-pdf={dest}",
        "--no-pdf-header-footer",
        src.resolve().as_uri(),
    ]
    if dest.exists():
        dest.unlink()
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    deadline = time.time() + 90
    last_size = -1
    stable = 0
    try:
        while time.time() < deadline:
            if proc.poll() is not None and pdf_ready(dest):
                break
            size = dest.stat().st_size if dest.exists() else 0
            if size > 1000 and size == last_size:
                stable += 1
                if stable >= 3 and pdf_ready(dest):
                    break
            else:
                stable = 0
            last_size = size
            time.sleep(0.25)
    finally:
        if proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
    if pdf_ready(dest):
        return "ok " + str(dest.resolve().relative_to(ROOT)) + f" {dest.stat().st_size}"
    return "FAIL " + str(dest)


def already_cited(dest: Path) -> bool:
    if not pdf_ready(dest):
        return False
    try:
        from pypdf import PdfReader
        text = "\n".join((page.extract_text() or "") for page in PdfReader(dest).pages)
    except Exception:
        return False
    return "Sources and go deeper" in text


def pdf_jobs() -> list[tuple[Path, Path]]:
    jobs = []
    for folder in (ROOT / "downloads" / "sheets", ROOT / "downloads" / "templates", ROOT / "campus" / "downloads"):
        for src in sorted(folder.glob("*.html")):
            jobs.append((src, src.with_suffix(".pdf")))
    jobs.append((ROOT / "downloads" / "flashcards.html", ROOT / "downloads" / "flashcards.pdf"))
    return jobs


def write_zip(folder: Path, zip_path: Path, arc_root: Path) -> None:
    tmp = zip_path.with_suffix(".zip.tmp")
    if tmp.exists():
        tmp.unlink()
    with zipfile.ZipFile(tmp, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in folder.rglob("*"):
            if not path.is_file():
                continue
            if path.suffix == ".zip" or path.name.endswith(".zip.tmp"):
                continue
            archive.write(path, path.relative_to(arc_root).as_posix())
    tmp.replace(zip_path)


def main() -> None:
    slides = deck_slides()
    pptx = ROOT / "downloads" / "teams-phone-deck.pptx"
    build_round2.write_pptx(pptx, slides)
    print("pptx", len(slides), "slides", pptx.stat().st_size)
    all_jobs = pdf_jobs()
    jobs = [(src, dest) for src, dest in all_jobs if not already_cited(dest)]
    print("printing", len(jobs), "of", len(all_jobs), "pdfs", flush=True)
    ok = len(all_jobs) - len(jobs)
    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(print_pdf, src, dest) for src, dest in jobs]
        for future in as_completed(futures):
            line = future.result()
            print(line, flush=True)
            if line.startswith("ok "):
                ok += 1
    print("pdfs", ok, "of", len(all_jobs), flush=True)
    uni = ROOT / "downloads" / "microsoft-voice-university.zip"
    write_zip(ROOT / "downloads", uni, ROOT)
    print("university zip", uni.stat().st_size, flush=True)
    campus_zip = ROOT / "campus" / "downloads" / "microsoft-voice-contact-center-lab.zip"
    write_zip(ROOT / "campus", campus_zip, ROOT)
    release = ROOT / "releases" / "microsoft-voice-contact-center-lab.zip"
    release.write_bytes(campus_zip.read_bytes())
    print("campus zip", campus_zip.stat().st_size, flush=True)


if __name__ == "__main__":
    main()

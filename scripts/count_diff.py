#!/usr/bin/env python3
"""Compare content counts with origin/main. Exit 1 if anything was lost."""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main_payload() -> dict:
    html = subprocess.check_output(
        ["git", "show", "origin/main:campus/index.html"],
        cwd=ROOT,
        text=True,
        errors="replace",
    )
    match = re.search(
        r'<script type="application/json" id="campus-data">(.*?)</script>',
        html,
        re.S,
    )
    if not match:
        raise SystemExit("main campus-data missing")
    return json.loads(match.group(1))


def head_lessons() -> list[dict]:
    lessons = []
    tracks = ROOT / "campus" / "data" / "tracks"
    for path in sorted(tracks.glob("t*.json")):
        pack = json.loads(path.read_text(encoding="utf-8"))
        lessons.extend(pack["lessons"])
    return lessons


def load_json(name: str):
    return json.loads((ROOT / "campus" / "data" / name).read_text(encoding="utf-8"))


def ids(rows, key="id"):
    return [row[key] for row in rows]


def digest(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def figure_map(lessons: list[dict]) -> dict[str, str]:
    found = {}
    for lesson in lessons:
        for fig in lesson.get("figures") or []:
            found[fig["id"]] = digest((fig.get("svg") or "") + "\n" + str(fig.get("animated")))
    return found


def audio_names(tree: str) -> dict[str, int]:
    listing = subprocess.check_output(
        ["git", "ls-tree", "-r", "-l", tree, "campus/audio"],
        cwd=ROOT,
        text=True,
    )
    found = {}
    for line in listing.splitlines():
        parts = line.split()
        if len(parts) < 5 or not parts[-1].endswith(".wav"):
            continue
        found[parts[-1]] = int(parts[3])
    return found


def image_names(tree: str) -> set[str]:
    listing = subprocess.check_output(["git", "ls-tree", "-r", "--name-only", tree], cwd=ROOT, text=True)
    keep = []
    for line in listing.splitlines():
        if line.startswith("docs/assets/") or line.endswith("og-card.png"):
            keep.append(line)
    return set(keep)


def multiset(rows, *keys):
    bags: dict[str, int] = {}
    for row in rows:
        token = "\n".join(str(row.get(key, "")) for key in keys)
        bags[token] = bags.get(token, 0) + 1
    return bags


def report_bag(label, before, after) -> list[str]:
    lost = []
    for token, count in before.items():
        if after.get(token, 0) < count:
            lost.append(f"{label} lost {count - after.get(token, 0)}")
    return lost


def main() -> None:
    main_data = main_payload()
    lessons = head_lessons()
    quiz = load_json("quiz.json")
    cards = load_json("cards.json")
    manifest = json.loads((ROOT / "campus" / "data" / "manifest.json").read_text(encoding="utf-8"))
    lines = []

    def row(label, before, after):
        mark = "same" if before == after else ("gained" if after > before else "LOST")
        lines.append(f"| {label} | {before} | {after} | {mark} |")

    lines.append("| Item | main | this branch | result |")
    lines.append("|---|---:|---:|---|")
    row("tracks", len(main_data["tracks"]), len(list((ROOT / "campus" / "data" / "tracks").glob("t*.json"))))
    row("lessons", len(main_data["lessons"]), len(lessons))
    row("labs", len(main_data["labs"]), len(manifest["labs"]))
    row("quiz items", len(main_data["quiz"]), len(quiz))
    row("cards", len(main_data["cards"]), len(cards))
    row("glossary", len(main_data["glossary"]), len(load_json("glossary.json")))
    row("scenarios", len(main_data["scenarios"]), len(manifest["scenarios"]))
    row("audio clips", len(main_data["audio"]), len(manifest["audio"]))
    main_figs = [fig for lesson in main_data["lessons"] for fig in lesson.get("figures") or []]
    head_figs = [fig for lesson in lessons for fig in lesson.get("figures") or []]
    row("illustrations", len(main_figs), len(head_figs))
    row("animated flows", sum(1 for fig in main_figs if fig.get("animated")), sum(1 for fig in head_figs if fig.get("animated")))
    row("illustration counter", main_data["illustrations"], len(head_figs))
    row("flow counter", main_data["flows"], sum(1 for fig in head_figs if fig.get("animated")))

    problems = []
    if ids(main_data["lessons"]) != ids(lessons):
        missing = set(ids(main_data["lessons"])) - set(ids(lessons))
        problems.append(f"lesson ids lost: {sorted(missing)[:8]}")
    if ids(main_data["labs"]) != ids(manifest["labs"]):
        problems.append("lab ids differ")
    problems.extend(report_bag("quiz", multiset(main_data["quiz"], "q", "choices", "answer"), multiset(quiz, "q", "choices", "answer")))
    card_keys = ("front", "back") if "front" in main_data["cards"][0] else tuple(main_data["cards"][0].keys())
    head_keys = card_keys if all(key in cards[0] for key in card_keys) else tuple(cards[0].keys())
    problems.extend(report_bag("card", multiset(main_data["cards"], *card_keys), multiset(cards, *head_keys)))

    before_figs = figure_map(main_data["lessons"])
    after_figs = figure_map(lessons)
    lost_figs = [fig_id for fig_id, digest_value in before_figs.items() if after_figs.get(fig_id) != digest_value]
    if lost_figs:
        problems.append(f"illustrations changed or missing: {len(lost_figs)} e.g. {lost_figs[:5]}")

    main_audio = {row["id"]: row.get("file") for row in main_data["audio"]}
    head_audio = {row["id"]: row.get("file") for row in manifest["audio"]}
    if main_audio != head_audio:
        problems.append("audio manifest entries differ")
    wav_main = audio_names("origin/main")
    wav_head = audio_names("HEAD")
    lost_wav = sorted(set(wav_main) - set(wav_head))
    if lost_wav:
        problems.append(f"wav files lost: {lost_wav}")
    changed_wav = [name for name, size in wav_main.items() if name in wav_head and wav_head[name] != size]
    if changed_wav:
        problems.append(f"wav sizes changed: {changed_wav}")

    images_main = image_names("origin/main")
    images_head = image_names("HEAD")
    # Uncommitted screenshots are still on disk.
    disk_images = set()
    for path in (ROOT / "docs" / "assets").glob("*"):
        disk_images.add("docs/assets/" + path.name)
    for path in (ROOT / "campus").glob("*.png"):
        disk_images.add("campus/" + path.name)
    lost_images = sorted(images_main - images_head - disk_images)
    row("images on main", len(images_main), len(images_main - set(lost_images)))
    if lost_images:
        problems.append(f"images lost: {lost_images}")

    print("\n".join(lines))
    print("card fields", card_keys)
    print("wav main", len(wav_main), "wav head", len(wav_head))
    print("images only on this branch", sorted((images_head | disk_images) - images_main))
    if problems:
        print("PROBLEMS")
        for item in problems:
            print("-", item)
        raise SystemExit(1)
    print("no content lost")


if __name__ == "__main__":
    main()

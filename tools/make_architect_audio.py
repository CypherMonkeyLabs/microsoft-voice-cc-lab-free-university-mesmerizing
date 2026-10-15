#!/usr/bin/env python3
"""Synthesize the two architect briefings with espeak-ng and a quiet pad."""

from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "campus" / "audio"

CLIPS = {
    "architect-use": [
        ("f", "I am Maya. This is the Microsoft Voice and Contact Center Lab, an independent study campus. It is not a Microsoft site."),
        ("m", "I am Jon. Nothing here signs into a tenant. The files run in the browser, and they work offline after the first load."),
        ("f", "Start on the home scene. The glowing path is Teams, the SIP proxy, your session border controller, and the carrier. Signaling stays on TLS port 5061. Media can take another road."),
        ("m", "The menu across the top is real. Diagrams, Flows, Charts, Cheat Codes, Play, Ecosystem, Downloads, and Careers each open their own page."),
        ("f", "Open Diagrams and click a figure. It enlarges. Pause it, or step the packet. The caption says why the picture matters."),
        ("m", "Flows is the animated subset. Charts are the counted pictures, and a bar tells you its label when you point at it."),
        ("f", "Themes recolor the scene. Neon, holographic, cyberpunk, sunset, and light are five different looks. The light button flips the page without leaving the lab."),
        ("m", "The language menu changes the labels and the greeting. Arabic runs right to left. The lessons stay in English so the citations do not drift."),
    ],
    "architect-share": [
        ("f", "Practice lives under Play. The ports game, the call-flow sandbox, and the daily question stay in this browser."),
        ("m", "Cheat Codes are the printable sheets. Download the zip if you want the campus on a machine with no network."),
        ("f", "Careers holds the exam board. The line you should be able to say is exact. MS-700 is still live, with a skills update on October 27, 2026. It is not retired and has no replacement. MB-280 retired July 31, 2026, with AB-210 as its successor. AB-210 is in beta."),
        ("m", "Read the source link before you repeat a prefix. The session border controller list and the Teams client list are not the same list."),
        ("f", "Regions shows those cited prefixes, then an example country map. Example cards are labeled example. They are not a live catalog."),
        ("m", "When a sentence is a teaching model, it is labeled. The vendor page wins when they disagree."),
        ("f", "When you are done, rate the lab, leave a comment, or share the page. The links sit on this player. There is no email address on this site."),
        ("m", "Report a concern from the footer. It opens the contact form on CypherMonkey Labs. That is the whole loop: view, practise, share."),
    ],
}

VOICES = {"f": "en-us+f3", "m": "en-gb+m3"}


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        silence = work / "gap.wav"
        run([
            "ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=22050:cl=mono",
            "-t", "0.35", str(silence),
        ])
        for name, lines in CLIPS.items():
            parts = []
            for index, (who, text) in enumerate(lines):
                wav = work / f"{name}-{index}.wav"
                subprocess.run(
                    ["espeak-ng", "-v", VOICES[who], "-s", "148", "-w", str(wav), text],
                    check=True,
                )
                parts.append(wav)
                parts.append(silence)
            listing = work / f"{name}.txt"
            listing.write_text("".join(f"file '{path}'\n" for path in parts), encoding="utf-8")
            speech = work / f"{name}-speech.wav"
            run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(listing), "-c", "copy", str(speech)])
            duration = subprocess.check_output(
                ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(speech)],
                text=True,
            ).strip()
            pad = work / f"{name}-pad.wav"
            run([
                "ffmpeg", "-y",
                "-f", "lavfi", "-i", f"sine=frequency=92:sample_rate=22050:duration={duration}",
                "-f", "lavfi", "-i", f"sine=frequency=184:sample_rate=22050:duration={duration}",
                "-filter_complex", "amix=inputs=2:duration=first,volume=0.03",
                str(pad),
            ])
            target = OUT / f"{name}.mp3"
            run([
                "ffmpeg", "-y", "-i", str(speech), "-i", str(pad),
                "-filter_complex", "[0:a]volume=1.6[a];[1:a][a]amix=inputs=2:duration=first:dropout_transition=0",
                "-codec:a", "libmp3lame", "-qscale:a", "7", "-ac", "1", "-ar", "22050",
                str(target),
            ])
            print(name, duration, target.stat().st_size)


if __name__ == "__main__":
    main()

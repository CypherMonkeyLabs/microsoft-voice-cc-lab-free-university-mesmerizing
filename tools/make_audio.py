#!/usr/bin/env python3
"""Write offline WAV clips next to the campus. Tones are generated. Speech uses espeak-ng."""

from __future__ import annotations

import math
import shutil
import struct
import subprocess
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "campus" / "audio"
RATE = 16000

# DTMF: row Hz, column Hz.
DTMF = {
    "1": (697, 1209),
    "2": (697, 1336),
    "3": (697, 1477),
    "4": (770, 1209),
    "5": (770, 1336),
    "6": (770, 1477),
    "7": (852, 1209),
    "8": (852, 1336),
    "9": (852, 1477),
    "star": (941, 1209),
    "0": (941, 1336),
    "pound": (941, 1477),
}


def clip(kind: str, file_id: str, title: str, blurb: str, text: str = "") -> dict:
    return {"id": file_id, "kind": kind, "title": title, "blurb": blurb, "text": text, "file": f"audio/{file_id}.wav"}


CLIPS = [
    clip("dtmf", f"dtmf-{name}", f"DTMF {label}", "A local dual tone. Not a recording of a carrier.", "")
    for name, label in [("1", "1"), ("2", "2"), ("3", "3"), ("4", "4"), ("5", "5"), ("6", "6"), ("7", "7"), ("8", "8"), ("9", "9"), ("star", "star"), ("0", "0"), ("pound", "pound")]
] + [
    clip("progress", "tone-dial", "Dial tone", "North American 350 plus 440 Hz, continuous, short sample.", ""),
    clip("progress", "tone-ringback", "Ringback", "440 plus 480 Hz. A short on-period, not a full cadence loop.", ""),
    clip("progress", "tone-busy", "Busy", "480 plus 620 Hz, half-second on and off.", ""),
    clip("progress", "tone-reorder", "Reorder", "480 plus 620 Hz, faster than busy.", ""),
    clip("prompt", "aa-welcome", "Attendant: welcome", "Synthesized locally. A production attendant uses a recorded prompt.", "Thank you for calling Contoso. This is a sample attendant, not a live system."),
    clip("prompt", "aa-sales", "Attendant: sales", "Synthesized locally.", "For sales, press 1."),
    clip("prompt", "aa-support", "Attendant: support", "Synthesized locally.", "For support, press 2."),
    clip("prompt", "aa-hold", "Attendant: please hold", "Synthesized locally.", "Please hold. Your call is in a sample queue."),
    clip("prompt", "aa-hours", "Attendant: after hours", "Synthesized locally.", "We are closed. Our sample hours are weekdays, 9 to 5."),
    clip("prompt", "aa-operator", "Attendant: operator", "Synthesized locally.", "To speak with the operator, press 0."),
    clip("prompt", "aa-goodbye", "Attendant: goodbye", "Synthesized locally.", "Goodbye."),
    clip("prompt", "aa-record", "Attendant: record your name", "Synthesized locally. Do not use this as a real consent prompt.", "Please say your name after the tone. This sample does not store audio."),
    clip("intro", "intro-tenant", "Intro: tenant", "Short narration for the foundations track.", "Start with the tenant. The SBC name has to live on a verified domain, and Islands mode cannot use Direct Routing."),
    clip("intro", "intro-routing", "Intro: Direct Routing", "Short narration for the PSTN track.", "Direct Routing pairs your certified SBC to Teams on TLS port 5061. Signaling stays with Teams. Media may bypass."),
    clip("intro", "intro-qos", "Intro: QoS", "Short narration for the network track.", "Mark audio expedited forwarding, 46. Keep real-time media off the VPN. Browser joins do not use the fixed port ranges."),
    clip("intro", "intro-queue", "Intro: queues", "Short narration for attendants and queues.", "The published number is often a resource account. Give that account the resource account license, and fund external transfer."),
    clip("intro", "intro-emergency", "Intro: emergency", "Short narration for emergency and survivability.", "Emergency location is a design gate. On Direct Routing, your SBC and carrier route the call. Do not test with a real emergency number."),
    clip("intro", "intro-cc", "Intro: contact center", "Short narration for Dynamics and the models.", "Connect, Extend, and Unify are different media paths. AB-250 is the contact center exam. MB-280 retired Jul 31 2026, with AB-210 as its successor; AB-210 is in beta."),
    clip("intro", "intro-record", "Intro: recording", "Short narration for compliance recording.", "Compliance recording is a policy bot plus a partner recorder. A grant with no application instance records nothing."),
    clip("intro", "intro-exams", "Intro: exams", "Short narration for the status board.", "MS-700 is still live, with a skills update on Oct 27 2026; it is NOT retired and has no replacement. MB-280 retired Jul 31 2026, with AB-210 as its successor; AB-210 is in beta."),
]


def tone(path: Path, parts: list[tuple[float, float, list[float]]]) -> None:
    frames = bytearray()
    for duration, amplitude, freqs in parts:
        count = int(RATE * duration)
        for n in range(count):
            t = n / RATE
            sample = 0.0
            for freq in freqs:
                sample += math.sin(2 * math.pi * freq * t)
            if freqs:
                sample = sample / len(freqs)
            # Soft edges so the clip does not click.
            edge = min(1.0, n / 80, (count - n) / 80)
            value = max(-1.0, min(1.0, sample * amplitude * edge))
            frames += struct.pack("<h", int(value * 32767))
    _write(path, frames)


def _write(path: Path, frames: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "w") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(RATE)
        handle.writeframes(frames)


def speak(path: Path, text: str) -> None:
    binary = shutil.which("espeak-ng")
    if not binary:
        raise SystemExit("espeak-ng is required to build the narrated clips")
    path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [binary, "-s", "150", "-v", "en-us", "-w", str(path), text],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def build() -> list[dict]:
    OUT.mkdir(parents=True, exist_ok=True)
    for item in CLIPS:
        target = ROOT / "campus" / item["file"]
        if item["kind"] == "dtmf":
            key = item["id"].split("-", 1)[1]
            low, high = DTMF[key]
            tone(target, [(0.18, 0.35, [low, high]), (0.08, 0.0, [])])
        elif item["id"] == "tone-dial":
            tone(target, [(1.6, 0.28, [350, 440])])
        elif item["id"] == "tone-ringback":
            tone(target, [(1.2, 0.28, [440, 480]), (0.4, 0.0, [])])
        elif item["id"] == "tone-busy":
            tone(target, [(0.5, 0.28, [480, 620]), (0.5, 0.0, []), (0.5, 0.28, [480, 620])])
        elif item["id"] == "tone-reorder":
            tone(target, [(0.25, 0.28, [480, 620]), (0.25, 0.0, []), (0.25, 0.28, [480, 620]), (0.25, 0.0, []), (0.25, 0.28, [480, 620])])
        else:
            speak(target, item["text"])
    return [{key: value for key, value in item.items() if key != "text"} for item in CLIPS]


if __name__ == "__main__":
    rows = build()
    print(f"wrote {len(rows)} clips to {OUT}")

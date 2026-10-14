#!/usr/bin/env python3
"""Draw the 1200×630 social card. No network."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "campus" / "og-card.png"


def font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def sans(size: int) -> ImageFont.ImageFont:
    path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    if Path(path).exists():
        return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def main() -> None:
    image = Image.new("RGB", (1200, 630), "#071018")
    draw = ImageDraw.Draw(image)
    # Soft instrument glow, drawn as overlapping ellipses so the card stays local.
    overlay = Image.new("RGBA", (1200, 630), (0, 0, 0, 0))
    glow = ImageDraw.Draw(overlay)
    glow.ellipse((-180, -220, 620, 420), fill=(62, 224, 195, 38))
    glow.ellipse((720, -160, 1320, 380), fill=(168, 155, 255, 42))
    glow.ellipse((280, 360, 980, 820), fill=(18, 80, 90, 70))
    image = Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((36, 36, 1164, 594), radius=36, outline=(62, 224, 195, 180), width=2)
    draw.rounded_rectangle((64, 72, 148, 156), radius=18, fill="#102433", outline="#3ee0c3", width=2)
    draw.arc((78, 96, 134, 132), 200, 20, fill="#3ee0c3", width=3)
    draw.ellipse((100, 88, 116, 104), fill="#a89bff")
    title = font(54, bold=True)
    draw.text((172, 68), "Microsoft Voice &", font=title, fill="#e7f4f1")
    draw.text((172, 132), "Contact Center Lab", font=title, fill="#e7f4f1")
    body = sans(26)
    draw.text((176, 214), "Teams Phone  ·  Direct Routing  ·  Dynamics 365 Contact Center", font=body, fill="#93a8b2")
    draw.text((176, 258), "Free offline campus. Zero-key labs. Cited status board.", font=body, fill="#3ee0c3")
    boxes = [
        (72, "Teams"),
        (292, "SIP proxy"),
        (512, "SBC"),
        (732, "Carrier"),
        (952, "Queue"),
    ]
    for x, label in boxes:
        draw.rounded_rectangle((x, 360, x + 168, 436), radius=18, fill="#102433", outline="#3ee0c3", width=2)
        draw.text((x + 84, 384), label, font=sans(22), fill="#e7f4f1", anchor="ma")
    for x in (240, 460, 680, 900):
        draw.line((x, 398, x + 52, 398), fill="#a89bff", width=3)
    draw.text((72, 480), "17 tracks   ·   ecosystem map   ·   recording, WFM, E911, CRM, agents", font=sans(22), fill="#93a8b2")
    draw.text((72, 528), "Checked 14 October 2026   ·   Not an official Microsoft publication", font=sans(20), fill="#6d838d")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    image.save(OUT, "PNG")
    print(f"wrote {OUT} {image.size}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Generate opaque iOS AppIcon + Android mipmaps from assets/icon-only.png."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "icon-only.png"
BG = (7, 11, 20)  # #070b14
ASSETS = ROOT / "assets"
STORE = ROOT / "store"

DENSITIES = {
    "ldpi": 36,
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192,
}
FG_SIZES = {
    "ldpi": 81,
    "mdpi": 108,
    "hdpi": 162,
    "xhdpi": 216,
    "xxhdpi": 324,
    "xxxhdpi": 432,
}


def make_1024(src: Image.Image) -> Image.Image:
    size = 1024
    max_side = int(size * 0.78)
    ratio = min(max_side / src.width, max_side / src.height)
    nw, nh = int(src.width * ratio), int(src.height * ratio)
    resized = src.resize((nw, nh), Image.Resampling.LANCZOS)
    base = Image.new("RGBA", (size, size), (*BG, 255))
    base.paste(resized, ((size - nw) // 2, (size - nh) // 2), resized)
    return base.convert("RGB")


def make_foreground(src: Image.Image, size: int = 432) -> Image.Image:
    fg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    max_side = int(size * 0.66)
    ratio = min(max_side / src.width, max_side / src.height)
    nw, nh = int(src.width * ratio), int(src.height * ratio)
    resized = src.resize((nw, nh), Image.Resampling.LANCZOS)
    fg.paste(resized, ((size - nw) // 2, (size - nh) // 2), resized)
    return fg


def make_feature_graphic(src: Image.Image) -> Image.Image:
    w, h = 1024, 500
    img = Image.new("RGB", (w, h), BG)
    draw = ImageDraw.Draw(img)
    draw.ellipse((-120, -180, 420, 360), fill=(20, 40, 70))
    draw.ellipse((640, 80, 1180, 620), fill=(14, 55, 58))
    side = 280
    ratio = min(side / src.width, side / src.height)
    nw, nh = int(src.width * ratio), int(src.height * ratio)
    logo = src.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (nw, nh), (0, 0, 0, 0))
    canvas.paste(logo, (0, 0), logo)
    img.paste(canvas.convert("RGB"), (80, (h - nh) // 2))
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 56)
        small = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 22)
    except OSError:
        font = ImageFont.load_default()
        small = font
    draw = ImageDraw.Draw(img)
    draw.text((400, 175), "TalentoLink", fill=(255, 255, 255), font=font)
    draw.text((400, 250), "Gestor de empleo y RRHH", fill=(94, 234, 212), font=small)
    return img


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing {SRC}")
    src = Image.open(SRC).convert("RGBA")
    icon = make_1024(src)
    fg = make_foreground(src)
    bg = Image.new("RGB", (432, 432), BG)

    ASSETS.mkdir(parents=True, exist_ok=True)
    STORE.mkdir(parents=True, exist_ok=True)
    icon.save(ASSETS / "app-icon-1024.png", "PNG")
    icon.resize((512, 512), Image.Resampling.LANCZOS).save(STORE / "play-icon-512.png", "PNG")
    make_feature_graphic(src).save(STORE / "play-feature-1024x500.png", "PNG")
    fg.save(ASSETS / "app-icon-foreground.png", "PNG")
    bg.save(ASSETS / "app-icon-background.png", "PNG")

    ios = ROOT / "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
    if ios.parent.exists():
        icon.save(ios, "PNG")
        print(f"OK iOS {ios}")

    android_res = ROOT / "android/app/src/main/res"
    if android_res.exists():
        for dens, px in DENSITIES.items():
            d = android_res / f"mipmap-{dens}"
            d.mkdir(parents=True, exist_ok=True)
            launcher = icon.resize((px, px), Image.Resampling.LANCZOS)
            launcher.save(d / "ic_launcher.png", "PNG")
            launcher.save(d / "ic_launcher_round.png", "PNG")
            fsz = FG_SIZES[dens]
            fg.resize((fsz, fsz), Image.Resampling.LANCZOS).save(
                d / "ic_launcher_foreground.png", "PNG"
            )
            bg.resize((fsz, fsz), Image.Resampling.LANCZOS).save(
                d / "ic_launcher_background.png", "PNG"
            )
            print(f"OK Android mipmap-{dens}")

    print("OK icons generated")


if __name__ == "__main__":
    main()

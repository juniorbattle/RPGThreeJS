#!/usr/bin/env python3
"""
prepare_v11b_p1_sources.py
===========================
Deterministic cinematic source-frame compositor for V11B-P1.

Reads existing project assets (painted backgrounds + pixel character sprites)
and composites two 1920x1080 PNG source frames for later image-to-video
generation:

  1. serpent_general_reveal_source.png
  2. lion_judgement_source.png

Constraints:
  - Offline only (no network calls).
  - Reads only from public/assets/.
  - Writes only to public/assets/cinematics/source/.
  - Fails clearly on missing assets.
  - Does not modify any existing files.

Requirements: Python 3.10+, Pillow, numpy.
"""

from __future__ import annotations

import math
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.normpath(os.path.join(SCRIPT_DIR, "..", ".."))
ASSETS_DIR = os.path.join(PROJECT_ROOT, "public", "assets")
OUTPUT_DIR = os.path.join(ASSETS_DIR, "cinematics", "source")

FRAME_W = 1920
FRAME_H = 1080

# ---------------------------------------------------------------------------
# Asset definitions
# ---------------------------------------------------------------------------

ASSET_DEFINITIONS = {
    "lion_sanctum_bg": os.path.join(
        ASSETS_DIR, "generated", "lion-phase", "combat", "lion_sanctum.webp"
    ),
    "lion_finale_judgement_bg": os.path.join(
        ASSETS_DIR, "generated", "lion-phase", "dialogue", "lion_finale_judgement.webp"
    ),
    "serpent_general_boss": os.path.join(
        ASSETS_DIR, "characters", "pixel", "full", "serpent_general_boss.png"
    ),
    "alaric": os.path.join(
        ASSETS_DIR, "characters", "pixel", "full", "alaric.png"
    ),
    "lion_champion": os.path.join(
        ASSETS_DIR, "characters", "pixel", "full", "lion_champion.png"
    ),
}


def verify_assets() -> None:
    """Exit with a clear message if any required asset is missing."""
    missing = []
    for name, path in ASSET_DEFINITIONS.items():
        if not os.path.isfile(path):
            missing.append(f"  {name}: {path}")
    if missing:
        print("ERROR: Missing required assets:", file=sys.stderr)
        for line in missing:
            print(line, file=sys.stderr)
        sys.exit(1)


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------


def load_rgb(path: str) -> Image.Image:
    """Load an image and convert to RGB."""
    return Image.open(path).convert("RGB")


def load_rgba(path: str) -> Image.Image:
    """Load an image and convert to RGBA."""
    return Image.open(path).convert("RGBA")


def fit_background(img: Image.Image, w: int, h: int) -> Image.Image:
    """Resize a background image to fill w×h, cropping excess if aspect differs."""
    src_w, src_h = img.size
    src_ratio = src_w / src_h
    dst_ratio = w / h
    if src_ratio > dst_ratio:
        # Source is wider — crop horizontally
        new_w = int(src_h * dst_ratio)
        left = (src_w - new_w) // 2
        img = img.crop((left, 0, left + new_w, src_h))
    elif src_ratio < dst_ratio:
        # Source is taller — crop vertically
        new_h = int(src_w / dst_ratio)
        top = (src_h - new_h) // 2
        img = img.crop((0, top, src_w, top + new_h))
    return img.resize((w, h), Image.LANCZOS)


def scale_sprite(sprite: Image.Image, target_h: int) -> Image.Image:
    """Scale a sprite to a target height, preserving aspect ratio."""
    src_w, src_h = sprite.size
    scale = target_h / src_h
    new_w = max(1, int(round(src_w * scale)))
    return sprite.resize((new_w, target_h), Image.LANCZOS)


def place_sprite(
    canvas: Image.Image,
    sprite: Image.Image,
    x: int,
    y: int,
) -> Image.Image:
    """Alpha-composite a sprite onto an RGBA canvas at (x, y)."""
    canvas.paste(sprite, (x, y), sprite)
    return canvas


def create_vignette(w: int, h: int, strength: float = 0.45) -> Image.Image:
    """Create a radial vignette overlay (dark edges, transparent center)."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = w / 2.0, h / 2.0
    max_dist = math.sqrt(cx * cx + cy * cy)
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / max_dist  # 0..1
    # Smooth falloff: start darkening at 40% from center, full at edges
    falloff = np.clip((dist - 0.35) / 0.65, 0, 1) ** 1.6
    alpha = (falloff * strength * 255).astype(np.uint8)
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, 3] = alpha
    return Image.fromarray(rgba, "RGBA")


def create_floor_mist(
    w: int, h: int, mist_h: int = 220, opacity: float = 0.18
) -> Image.Image:
    """Create a subtle floor mist gradient at the bottom of the frame."""
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    # Gradient from transparent (top) to semi-opaque grey-white (bottom)
    for i in range(mist_h):
        y = h - mist_h + i
        t = i / mist_h  # 0 at top of mist, 1 at bottom
        alpha = int(opacity * 255 * t ** 1.5)
        rgba[y, :, 0] = 200  # R
        rgba[y, :, 1] = 210  # G
        rgba[y, :, 2] = 215  # B
        rgba[y, :, 3] = alpha
    return Image.fromarray(rgba, "RGBA")


def create_aura_glow(
    w: int,
    h: int,
    cx: int,
    cy: int,
    radius: int,
    color: tuple[int, int, int],
    opacity: float = 0.15,
) -> Image.Image:
    """Create a soft radial glow centered at (cx, cy) with given color."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / max(1, radius)
    glow = np.clip(1.0 - dist, 0, 1) ** 2.2
    alpha = (glow * opacity * 255).astype(np.uint8)
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, 0] = color[0]
    rgba[:, :, 1] = color[1]
    rgba[:, :, 2] = color[2]
    rgba[:, :, 3] = alpha
    return Image.fromarray(rgba, "RGBA").filter(ImageFilter.GaussianBlur(radius=30))


def create_warmth_overlay(
    w: int, h: int, opacity: float = 0.08
) -> Image.Image:
    """Create a subtle warm golden tint concentrated in the upper third."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    # Stronger at top, fading downward
    vertical = np.clip(1.0 - yy / (h * 0.6), 0, 1) ** 1.5
    alpha = (vertical * opacity * 255).astype(np.uint8)
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, 0] = 255  # R
    rgba[:, :, 1] = 200  # G
    rgba[:, :, 2] = 120  # B
    rgba[:, :, 3] = alpha
    return Image.fromarray(rgba, "RGBA")


def darken_sprite(sprite: Image.Image, factor: float = 0.45) -> Image.Image:
    """Darken an RGBA sprite's RGB channels by a factor, keeping alpha."""
    arr = np.array(sprite, dtype=np.uint8)
    arr[:, :, :3] = (arr[:, :, :3].astype(np.float32) * factor).clip(0, 255).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def reduce_alpha(sprite: Image.Image, factor: float = 0.65) -> Image.Image:
    """Reduce the alpha channel of a sprite by a factor."""
    arr = np.array(sprite, dtype=np.uint8)
    arr[:, :, 3] = (arr[:, :, 3].astype(np.float32) * factor).clip(0, 255).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


# ---------------------------------------------------------------------------
# Composite 1: serpent_general_reveal
# ---------------------------------------------------------------------------


def build_serpent_general_reveal() -> Image.Image:
    """
    Boss reveal: Serpent General in the Lion Sanctum.

    - Background: lion_sanctum.webp (2048x1152 → 1920x1080)
    - Character: serpent_general_boss.png, scaled large, slightly right of center
    - Atmosphere: dark green shadow aura, floor mist, vignette
    """
    bg = load_rgb(ASSET_DEFINITIONS["lion_sanctum_bg"])
    bg = fit_background(bg, FRAME_W, FRAME_H)

    boss = load_rgba(ASSET_DEFINITIONS["serpent_general_boss"])
    boss_scaled = scale_sprite(boss, 820)
    bw, bh = boss_scaled.size

    # Place slightly right of center, feet near bottom
    x = int(FRAME_W * 0.60) - bw // 2  # 811
    y = 1050 - int(bh * 737 / 768)     # feet at y≈1050
    y = max(0, y)

    # Build RGBA canvas
    canvas = bg.convert("RGBA")

    # Shadow aura behind boss (dark green, subtle)
    aura_cx = x + bw // 2
    aura_cy = y + int(bh * 0.45)
    aura = create_aura_glow(
        FRAME_W, FRAME_H, aura_cx, aura_cy, 380,
        color=(20, 60, 30), opacity=0.22,
    )
    canvas = Image.alpha_composite(canvas, aura)

    # Place boss sprite
    canvas = place_sprite(canvas, boss_scaled, x, y)

    # Floor mist
    mist = create_floor_mist(FRAME_W, FRAME_H, mist_h=200, opacity=0.15)
    canvas = Image.alpha_composite(canvas, mist)

    # Vignette
    vignette = create_vignette(FRAME_W, FRAME_H, strength=0.48)
    canvas = Image.alpha_composite(canvas, vignette)

    return canvas.convert("RGB")


# ---------------------------------------------------------------------------
# Composite 2: lion_judgement
# ---------------------------------------------------------------------------


def build_lion_judgement() -> Image.Image:
    """
    Judgement hall: Alaric presides, Lion Champion as secondary guard.

    - Background: lion_finale_judgement.webp (1920x1080, no resize)
    - Primary: alaric.png, center-left, prominent
    - Secondary: lion_champion.png, right side, smaller, darkened
    - Atmosphere: warm golden tint, vignette, subtle dust
    """
    bg = load_rgb(ASSET_DEFINITIONS["lion_finale_judgement_bg"])
    # Already 1920x1080 but ensure exact fit
    bg = fit_background(bg, FRAME_W, FRAME_H)

    # --- Alaric (primary) ---
    alaric = load_rgba(ASSET_DEFINITIONS["alaric"])
    alaric_scaled = scale_sprite(alaric, 750)
    aw, ah = alaric_scaled.size
    ax = int(FRAME_W * 0.38) - aw // 2  # 417
    ay = 1050 - int(ah * 735 / 768)     # feet at y≈1050
    ay = max(0, ay)

    # --- Lion Champion (secondary, darkened) ---
    champion = load_rgba(ASSET_DEFINITIONS["lion_champion"])
    champion_scaled = scale_sprite(champion, 520)
    cw, ch = champion_scaled.size
    champion_dark = darken_sprite(champion_scaled, factor=0.42)
    champion_dark = reduce_alpha(champion_dark, factor=0.72)
    cx = int(FRAME_W * 0.72) - cw // 2  # 1166
    cy = 1050 - int(ch * 735 / 768)     # feet at y≈1050
    cy = max(0, cy)

    # Build RGBA canvas
    canvas = bg.convert("RGBA")

    # Warm golden tint from above
    warmth = create_warmth_overlay(FRAME_W, FRAME_H, opacity=0.07)
    canvas = Image.alpha_composite(canvas, warmth)

    # Subtle golden glow behind Alaric (judgement light)
    alaric_glow = create_aura_glow(
        FRAME_W, FRAME_H,
        ax + aw // 2, ay + int(ah * 0.4),
        320,
        color=(255, 210, 130), opacity=0.10,
    )
    canvas = Image.alpha_composite(canvas, alaric_glow)

    # Place Lion Champion first (behind Alaric in z-order, but both are foreground)
    canvas = place_sprite(canvas, champion_dark, cx, cy)

    # Place Alaric
    canvas = place_sprite(canvas, alaric_scaled, ax, ay)

    # Vignette
    vignette = create_vignette(FRAME_W, FRAME_H, strength=0.42)
    canvas = Image.alpha_composite(canvas, vignette)

    return canvas.convert("RGB")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    verify_assets()

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    composites = [
        ("serpent_general_reveal_source.png", build_serpent_general_reveal),
        ("lion_judgement_source.png", build_lion_judgement),
    ]

    for filename, builder in composites:
        print(f"Building {filename} ...")
        img = builder()
        out_path = os.path.join(OUTPUT_DIR, filename)
        img.save(out_path, "PNG", optimize=True)
        size_bytes = os.path.getsize(out_path)
        print(f"  -> {out_path}")
        print(f"     {img.size[0]}x{img.size[1]}, {size_bytes:,} bytes")

    print("\nDone. Both source frames written to:")
    print(f"  {OUTPUT_DIR}")


if __name__ == "__main__":
    main()

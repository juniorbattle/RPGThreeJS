#!/usr/bin/env python3
"""Keep a plateau atlas on the layout of the Lion atlas it replaces (OD-2026-11-11-F, F1).

A post-demo plateau places its POIs at the positions of their Lion counterparts, so its own atlas must keep the Lion
atlas's roads and clearings where they are. The image model works at 1536x1024; the Lion atlases are wider.

  prepare <lion atlas> <out>             letterbox the Lion atlas into 1536x1024 (blurred mirrored bands) as the layout
  fit <generated> <lion atlas> <out>     crop the generated image back to the letterboxed area, at the Lion atlas size

Paths are relative to the repository root. Usage: py -3 tools/art/atlas_layout.py prepare|fit ...
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[2]
CANVAS = (1536, 1024)


def frame(src: Image.Image) -> tuple[int, int]:
    """Height of the letterboxed atlas inside the canvas, and the band above it."""
    height = round(src.height * CANVAS[0] / src.width)
    return height, (CANVAS[1] - height) // 2


def prepare(lion: Path, out: Path) -> None:
    src = Image.open(lion).convert('RGB')
    height, pad = frame(src)
    body = src.resize((CANVAS[0], height), Image.LANCZOS)
    canvas = Image.new('RGB', CANVAS)
    canvas.paste(body, (0, pad))
    # Bands: the nearest rows mirrored and blurred, so the model reads them as terrain to paint, not as a frame.
    top = ImageOps.flip(body.crop((0, 0, CANVAS[0], pad))).filter(ImageFilter.GaussianBlur(18))
    bottom = ImageOps.flip(body.crop((0, height - (CANVAS[1] - height - pad), CANVAS[0], height))).filter(ImageFilter.GaussianBlur(18))
    canvas.paste(top, (0, 0))
    canvas.paste(bottom, (0, pad + height))
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out, optimize=True)
    print(f'layout {out.relative_to(ROOT)}: atlas {CANVAS[0]}x{height} at y={pad}')


def save_options(out: Path) -> dict:
    """Backdrops ship as WebP (quality 95, a quarter of the PNG weight, like the combat arena plates)."""
    return {'quality': 95, 'method': 6} if out.suffix == '.webp' else {'optimize': True}


def fit(generated: Path, lion: Path, out: Path) -> None:
    src = Image.open(lion)
    height, pad = frame(src)
    image = Image.open(generated).convert('RGB')
    if image.size != CANVAS:
        image = image.resize(CANVAS, Image.LANCZOS)
    fitted = image.crop((0, pad, CANVAS[0], pad + height)).resize(src.size, Image.LANCZOS)
    out.parent.mkdir(parents=True, exist_ok=True)
    fitted.save(out, **save_options(out))
    print(f'atlas {out.relative_to(ROOT)}: {fitted.width}x{fitted.height}, same frame as {lion.relative_to(ROOT)}')


if __name__ == '__main__':
    command, *paths = sys.argv[1:]
    if command == 'prepare' and len(paths) == 2:
        prepare(ROOT / paths[0], ROOT / paths[1])
    elif command == 'fit' and len(paths) == 3:
        fit(ROOT / paths[0], ROOT / paths[1], ROOT / paths[2])
    else:
        raise SystemExit(__doc__)

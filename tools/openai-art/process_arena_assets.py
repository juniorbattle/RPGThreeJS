#!/usr/bin/env python3
"""Process generated arena layers and FX sheets into runtime assets.

Arena layers (art-gen/combat-arena-plates/)
  <scene>-far.png  sky + far distance (opaque): cropped to the horizon band the
                   fixed tactical camera sees, bottom faded into the fog, and
                   written over public/assets/generated/combat-arena/<scene>-far.webp
  <scene>-mid.png  mid-ground frieze on magenta: keyed out, trimmed, written to
                   <scene>-mid.webp and listed in src/render/generated/combatArenaPlates.json
                   (the arena then drops its procedural mid-ground band).

FX sheets (art-gen/combat-fx-sheets/fx-<id>.png, 4×4 frames on black)
  written to public/assets/vfx/generated/<id>.webp and listed in
  src/render/generated/combatFxSheets.json; recipes play them additively on top
  of the procedural layers (steps of kind `sheet`).

Usage: python3 tools/openai-art/process_arena_assets.py [--art-gen art-gen]
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ARENA_OUT = ROOT / 'public/assets/generated/combat-arena'
FX_OUT = ROOT / 'public/assets/vfx/generated'
PLATES_JSON = ROOT / 'src/render/generated/combatArenaPlates.json'
FX_JSON = ROOT / 'src/render/generated/combatFxSheets.json'
FAR_JSON = ARENA_OUT / 'far-plates.json'
# Placement of the mid-ground frieze (world units), see arenaThemes.ts.
MID_PLACEMENT = {'width': 40, 'z': -14, 'bottomY': -0.2}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def far_plate(src: Path, scene: str, meta: dict) -> None:
    img = np.asarray(Image.open(src).convert('RGBA'), dtype=np.float32)
    h = img.shape[0]
    band = img[int(h * 0.38):int(h * 0.82)].copy()
    bh = band.shape[0]
    start = int(bh * 0.7)
    t = np.linspace(0, 1, bh - start)
    band[start:, :, 3] *= (1 - t * t * (3 - 2 * t))[:, None]
    out = ARENA_OUT / f'{scene}-far.webp'
    Image.fromarray(band.astype(np.uint8), 'RGBA').save(out, 'WEBP', quality=88, method=6)
    meta[scene] = {'file': f'/assets/generated/combat-arena/{scene}-far.webp', 'size': [band.shape[1], bh], 'source': f'art-gen/{src.parent.name}/{src.name}', 'sha256': sha(src)}
    print(f'{scene} far plate ← {src.name}')


def key_out(rgba: np.ndarray, key=(1.0, 0.0, 1.0)) -> np.ndarray:
    rgb = rgba[..., :3] / 255.0
    k = np.array(key, dtype=np.float32)
    # magenta distance: high R & B, low G
    m = np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1]
    alpha = np.clip((0.82 - m) / (0.82 - 0.18), 0, 1)
    unmixed = np.clip((rgb - k * (1 - alpha[..., None])) / np.maximum(alpha, 1e-3)[..., None], 0, 1)
    return np.concatenate([unmixed * 255, alpha[..., None] * 255], axis=-1)


def mid_plate(src: Path, scene: str, plates: dict) -> None:
    rgba = key_out(np.asarray(Image.open(src).convert('RGBA'), dtype=np.float32))
    ys, xs = np.nonzero(rgba[..., 3] > 127)
    crop = rgba[ys.min():ys.max() + 1, :]
    out = ARENA_OUT / f'{scene}-mid.webp'
    Image.fromarray(crop.astype(np.uint8), 'RGBA').save(out, 'WEBP', quality=90, method=6)
    plates.setdefault(scene, {})['mid'] = {
        'file': f'/assets/generated/combat-arena/{scene}-mid.webp',
        'aspect': round(crop.shape[0] / crop.shape[1], 4),
        **MID_PLACEMENT,
        'sha256': sha(out),
    }
    print(f'{scene} mid frieze ← {src.name}')


def fx_sheet(src: Path, sheets: dict) -> None:
    fx_id = src.stem.removeprefix('fx-')
    img = Image.open(src).convert('RGB').resize((1024, 1024), Image.Resampling.LANCZOS)
    out = FX_OUT / f'{fx_id}.webp'
    img.save(out, 'WEBP', quality=90, method=6)
    sheets[fx_id] = {'file': f'/assets/vfx/generated/{fx_id}.webp', 'grid': [4, 4], 'frames': 16, 'blending': 'additive', 'sha256': sha(out)}
    print(f'fx {fx_id} ← {src.name}')


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--art-gen', default=str(ROOT / 'art-gen'))
    args = ap.parse_args()
    base = Path(args.art_gen)
    plates = json.loads(PLATES_JSON.read_text())
    far = json.loads(FAR_JSON.read_text()) if FAR_JSON.exists() else {}
    for src in sorted((base / 'combat-arena-plates').glob('*.png')):
        scene, _, layer = src.stem.rpartition('-')
        if layer == 'far':
            far_plate(src, scene, far)
        elif layer == 'mid':
            mid_plate(src, scene, plates['plates'])
    sheets = json.loads(FX_JSON.read_text())
    FX_OUT.mkdir(parents=True, exist_ok=True)
    for src in sorted((base / 'combat-fx-sheets').glob('fx-*.png')):
        fx_sheet(src, sheets['sheets'])
    PLATES_JSON.write_text(json.dumps(plates, indent=2) + '\n')
    FAR_JSON.write_text(json.dumps(far, indent=2) + '\n')
    FX_JSON.write_text(json.dumps(sheets, indent=2) + '\n')


if __name__ == '__main__':
    main()

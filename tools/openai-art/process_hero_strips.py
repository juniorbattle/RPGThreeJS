#!/usr/bin/env python3
"""Turn generated hero animation strips into pixel sheets (contract v1).

Input: art-gen/combat-hero-anims/<unit>-<anim>.png + provenance.json (written by
generate-images.mjs, `meta` carries frames / ms / loop / key colour).
Output: public/assets/characters/pixel/combat-sprites/<unit>.png and the unit's
entry in src/render/generated/combatPixelSprites.json, replacing the
pose-derived keyframes with the full animation set:

  idle (4) · move (6) · windup (attack 1-2) · attack (attack 3-6) · cast (6)
  hurt (hurtko 1-2) · ko (hurtko 3-5)

The pixel density stays the one of build_combat_sprites.py (40 px/m): each
strip is scaled so its opening (standing) frame keeps the figure height of the
current sheet. Animations without a strip fall back to the first idle frame.

Usage: python3 tools/openai-art/process_hero_strips.py [--unit alistair] [--batch combat-hero-anims]
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('pixel_tool', ROOT / 'tools/pixel-sprites/build_combat_sprites.py')
pixel = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
assert spec and spec.loader
spec.loader.exec_module(pixel)  # type: ignore[union-attr]

ANIMS = ('idle', 'walk', 'attack', 'cast', 'hurtko')


def hex_rgb(value: str) -> np.ndarray:
    v = int(value.lstrip('#'), 16)
    return np.array([(v >> 16) & 255, (v >> 8) & 255, v & 255], dtype=np.float32) / 255.0


def remove_key(rgba: np.ndarray, key: np.ndarray, d0: float = 0.22, d1: float = 0.55) -> np.ndarray:
    """Alpha from the distance to the key colour, then un-mix the key from edges."""
    rgb = rgba[..., :3]
    dist = np.linalg.norm(rgb - key, axis=-1) / np.sqrt(3)
    alpha = np.clip((dist - d0) / (d1 - d0), 0, 1)
    safe = np.maximum(alpha, 1e-3)[..., None]
    unmixed = np.clip((rgb - key * (1 - alpha[..., None])) / safe, 0, 1)
    out = np.concatenate([np.where(alpha[..., None] > 0, unmixed, 0), alpha[..., None]], axis=-1)
    return out.astype(np.float32)


def split_frames(rgba: np.ndarray, expected: int) -> list[np.ndarray]:
    """Frames from empty column bands; equal division when the count is off."""
    occupied = (rgba[..., 3] > 0.5).sum(axis=0) > 2
    runs, start = [], None
    for x, filled in enumerate(occupied):
        if filled and start is None:
            start = x
        elif not filled and start is not None:
            runs.append([start, x]); start = None
    if start is not None:
        runs.append([start, len(occupied)])
    # merge slivers (weapon tips split from their body)
    merged: list[list[int]] = []
    for run in runs:
        if merged and (run[1] - run[0] < 12 or run[0] - merged[-1][1] < 6):
            merged[-1][1] = run[1]
        else:
            merged.append(run)
    if len(merged) != expected:
        w = rgba.shape[1] / expected
        merged = [[int(i * w), int((i + 1) * w)] for i in range(expected)]
    return [rgba[:, a:b] for a, b in merged]


def figure_box(frame: np.ndarray) -> tuple[int, int, int, int]:
    ys, xs = np.nonzero(frame[..., 3] > 0.5)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def feet_anchor(frame: np.ndarray) -> tuple[float, float]:
    x0, y0, x1, y1 = figure_box(frame)
    band = frame[max(y0, y1 - max(3, (y1 - y0) // 12)):y1, :, 3] > 0.5
    ys, xs = np.nonzero(band)
    return (float(xs.mean()) if len(xs) else (x0 + x1) / 2), float(y1)


def load_strips(batch_dir: Path, unit: str, provenance: dict) -> dict[str, dict]:
    strips = {}
    for anim in ANIMS:
        path = batch_dir / f'{unit}-{anim}.png'
        if not path.exists():
            continue
        meta = next((im.get('meta') for im in provenance.get('images', []) if im.get('name') == f'{unit}-{anim}'), None) or {}
        rgba = np.asarray(Image.open(path).convert('RGBA'), dtype=np.float32) / 255.0
        key = hex_rgb(meta.get('key', '#FF00FF'))
        clean = remove_key(rgba, key)
        frames = split_frames(clean, int(meta.get('frames', 6)))
        strips[anim] = {'frames': frames, 'ms': meta.get('ms'), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    return strips


def build(unit: str, batch_dir: Path, sheets: dict) -> dict | None:
    provenance_path = batch_dir / 'provenance.json'
    provenance = json.loads(provenance_path.read_text()) if provenance_path.exists() else {}
    strips = load_strips(batch_dir, unit, provenance)
    if not strips:
        return None
    current = sheets['units'].get(unit)
    target_h = current['figureHeightPx'] if current else 88

    frames: dict[str, np.ndarray] = {}
    anchors: dict[str, tuple[float, float]] = {}
    for anim, strip in strips.items():
        # Every strip opens on a standing pose (stance, guard, contact, flinch):
        # its height pins the scale, so a strip the model drew smaller keeps
        # the same on-screen figure.
        first = figure_box(strip['frames'][0])
        factor = target_h / float(max(1, first[3] - first[1]))
        for i, frame in enumerate(strip['frames']):
            ax, ay = feet_anchor(frame)
            small = pixel.clean_specks(pixel.binarize(pixel.downscale(frame, factor)))
            name = f'{anim}_{i}'
            frames[name] = small
            anchors[name] = (ax * factor, ay * factor)
    pal = pixel.shared_palette(list(frames.values()), pixel.PALETTE_SIZE)
    for k in frames:
        frames[k] = pixel.add_outline(pixel.apply_palette(frames[k], pal))

    left = right = up = down = 0.0
    for k, img in frames.items():
        ax, ay = anchors[k]
        ys, xs = np.nonzero(img[..., 3] > 0.5)
        left, right = max(left, ax - xs.min()), max(right, xs.max() + 1 - ax)
        up, down = max(up, ay - ys.min()), max(down, ys.max() + 1 - ay)
    pad = 2
    cw, ch = int(np.ceil(left + right)) + pad * 2, int(np.ceil(up + down)) + pad * 2
    cax, cay = int(np.ceil(left)) + pad, int(np.ceil(up)) + pad
    names = list(frames.keys())
    cells = []
    for k in names:
        cell = np.zeros((ch, cw, 4), dtype=np.float32)
        ax, ay = anchors[k]
        ox, oy = int(round(cax - ax)), int(round(cay - ay))
        ys, xs = np.nonzero(frames[k][..., 3] > 0.5)
        ty, tx = ys + oy, xs + ox
        ok = (ty >= 0) & (ty < ch) & (tx >= 0) & (tx < cw)
        cell[ty[ok], tx[ok]] = frames[k][ys[ok], xs[ok]]
        cells.append(cell)
    sheet = np.concatenate(cells, axis=1)

    def seq(anim: str, idx: list[int] | None = None) -> list[str]:
        count = len(strips[anim]['frames']) if anim in strips else 0
        return [f'{anim}_{i}' for i in (idx if idx is not None else range(count)) if i < count]

    def ms(anim: str, idx: list[int] | None = None, fallback: int = 120) -> list[int]:
        values = strips.get(anim, {}).get('ms') or []
        count = len(strips[anim]['frames']) if anim in strips else 0
        return [int(values[i]) if i < len(values) else fallback for i in (idx if idx is not None else range(count)) if i < count]

    anims = dict(current['anims']) if current else {}
    if 'idle' in strips: anims['idle'] = {'frames': seq('idle'), 'ms': ms('idle'), 'loop': True}
    if 'walk' in strips: anims['move'] = {'frames': seq('walk'), 'ms': ms('walk'), 'loop': True}
    if 'attack' in strips:
        anims['windup'] = {'frames': seq('attack', [0, 1]), 'ms': ms('attack', [0, 1]), 'loop': False}
        anims['attack'] = {'frames': seq('attack', [2, 3, 4, 5]), 'ms': ms('attack', [2, 3, 4, 5]), 'loop': False}
    if 'cast' in strips: anims['cast'] = {'frames': seq('cast'), 'ms': ms('cast'), 'loop': False}
    if 'hurtko' in strips:
        anims['hurt'] = {'frames': seq('hurtko', [0, 1]), 'ms': ms('hurtko', [0, 1]), 'loop': False}
        anims['ko'] = {'frames': seq('hurtko', [2, 3, 4]), 'ms': ms('hurtko', [2, 3, 4]), 'loop': False}
    # animations without a generated strip must not reference dropped pose cells
    for name, anim in list(anims.items()):
        if any(frame not in names for frame in anim['frames']):
            fallback = seq('idle', [0]) or [names[0]]
            anims[name] = {'frames': fallback, 'ms': [200], 'loop': anim.get('loop', False)}

    out = pixel.OUT_DIR / f'{unit}.png'
    Image.fromarray((sheet * 255).round().astype(np.uint8), 'RGBA').save(out, optimize=True)
    idle_cell = cells[names.index(seq('idle', [0])[0])] if 'idle' in strips else cells[0]
    ys = np.nonzero(idle_cell[..., 3] > 0.5)[0]
    entry = {
        'file': f'{pixel.PUBLIC_PREFIX}/{unit}.png',
        'cell': [cw, ch],
        'anchor': [cax, cay],
        'presenceScale': current.get('presenceScale', 1.0) if current else 1.0,
        'cells': names,
        'anims': anims,
        'generated': True,
        'source': {anim: strip['sha256'] for anim, strip in strips.items()},
        'figureHeightPx': int(cay - ys.min()),
        'idleBoundsPx': pixel.idle_bounds(idle_cell),
        'colors': int(len(np.unique((sheet[sheet[..., 3] > 0.5][:, :3] * 255).astype(np.uint8), axis=0))),
        'sha256': hashlib.sha256(out.read_bytes()).hexdigest(),
    }
    if current and current.get('aliases'):
        entry['aliases'] = current['aliases']
    preview = Image.fromarray((sheet * 255).round().astype(np.uint8), 'RGBA')
    preview.resize((preview.width * 3, preview.height * 3), Image.Resampling.NEAREST).save(batch_dir / f'preview-{unit}.png')
    return entry


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--batch', default='combat-hero-anims')
    ap.add_argument('--unit', default='')
    ap.add_argument('--art-gen', default=str(ROOT / 'art-gen'))
    args = ap.parse_args()
    batch_dir = Path(args.art_gen) / args.batch
    if not batch_dir.exists():
        print(f'nothing to process: {batch_dir} does not exist')
        return 1
    sheets = json.loads(pixel.OUT_JSON.read_text())
    units = [args.unit] if args.unit else sorted({p.name.rsplit('-', 1)[0] for p in batch_dir.glob('*-*.png') if not p.name.startswith('preview-')})
    for unit in units:
        entry = build(unit, batch_dir, sheets)
        if not entry:
            print(f'{unit}: no strip found')
            continue
        sheets['units'][unit] = entry
        print(f"{unit}: {len(entry['cells'])} cells, cell {entry['cell']}, figure {entry['figureHeightPx']}px, {entry['colors']} colours")
    pixel.OUT_JSON.write_text(json.dumps(sheets, indent=2) + '\n')
    return 0


if __name__ == '__main__':
    sys.exit(main())

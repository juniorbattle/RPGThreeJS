#!/usr/bin/env python3
"""Build pixel-art combat sprite sheets from the Character System V2 poses.

The masters and their four combat poses (prepare / dash / attack / cast) stay
the visual authority. This tool re-renders them on a real pixel grid so every
combat unit shares one pixel density on screen (HD-2D: pixel sprites in a lit
3D arena), with a shared per-unit palette and a selective dark outline.

Output
  public/assets/characters/pixel/combat-sprites/<unit>.png   (art pixels x1)
  src/render/generated/combatPixelSprites.json                (sheet contract)

Sheet contract v1 (read by src/combat/pixel/PixelSpriteSheets.ts)
  pxPerUnit      art pixels per world unit (constant for every unit)
  cell [w, h]    art pixels, every cell of a sheet has the same anchor
  anchor [x, y]  feet point inside a cell (top-left origin, y down)
  cells          named cells, left to right
  anims          frame sequences over cell names, with durations in ms

When locally generated animation strips arrive (tools/openai-art), the same
contract simply lists more cells and longer sequences.

Usage
  python3 tools/pixel-sprites/build_combat_sprites.py [--only alistair,goblin] [--preview out.png]
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / 'src/render/generated/characterSystemV2Manifest.json'
OUT_DIR = ROOT / 'public/assets/characters/pixel/combat-sprites'
OUT_JSON = ROOT / 'src/render/generated/combatPixelSprites.json'
PUBLIC_PREFIX = '/assets/characters/pixel/combat-sprites'

# 40 art px per world unit: a 2.17 m hero (Alistair) is ~87 px tall, the same
# figure height as the RPGCards city walkers (≈88 px).
PX_PER_UNIT = 40
PALETTE_SIZE = 40
OUTLINE_RGB = np.array([20, 14, 26], dtype=np.float32)
HERO_REFERENCE_UNIT = 'alistair'
SMALL_CREATURE_MIN_HEIGHT = 1.15
BOSS_UNITS = {'lion_champion', 'serpent_general_boss'}
POSES = ('prepare', 'dash', 'attack', 'cast')


def load_rgba(src: str) -> np.ndarray:
    path = ROOT / 'public' / src.lstrip('/')
    return np.asarray(Image.open(path).convert('RGBA'), dtype=np.float32) / 255.0


def visible_height(pose: dict, wupp: float) -> float:
    b = pose['alphaBoundsPx']
    return (b['bottom'] - b['top']) * wupp * pose.get('scaleCorrection', 1.0)


def presence_scale(unit: dict, hero_height: float) -> float:
    """Same rule as combatLargeUnitPresenceScale() for 2x2 opponents, plus a
    readability floor for small creatures. It is baked into the pixels, so the
    on-screen pixel size stays identical for every unit."""
    h = visible_height(unit['poses']['prepare'], unit['worldUnitsPerPixel'])
    if not h:
        return 1.0
    if unit['scaleFamily'] == 'SMALL_CREATURE':
        # Readability floor: rats and badgers stay legible on a 1.18 m tile.
        return max(1.0, SMALL_CREATURE_MIN_HEIGHT / h)
    if unit['scaleFamily'] != 'LARGE_ELITE_BOSS':
        return 1.0
    ratio = 2.0 if unit['unitId'] in BOSS_UNITS else 1.85
    return max(1.0, min(1.9, hero_height * ratio / h))


def downscale(rgba: np.ndarray, factor: float) -> np.ndarray:
    """Area downscale in premultiplied space after a light unsharp pass, so the
    fine painted detail survives the reduction as readable clusters."""
    img = Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA')
    rgb = img.convert('RGB').filter(ImageFilter.UnsharpMask(radius=2.2, percent=90, threshold=2))
    sharp = np.asarray(rgb, dtype=np.float32) / 255.0
    a = rgba[..., 3:4]
    pre = np.concatenate([sharp * a, a], axis=-1)
    h, w = rgba.shape[:2]
    nw, nh = max(1, round(w * factor)), max(1, round(h * factor))
    chans = [np.asarray(Image.fromarray(pre[..., c]).resize((nw, nh), Image.Resampling.BOX), dtype=np.float32) for c in range(4)]
    out = np.stack(chans, axis=-1)
    alpha = out[..., 3:4]
    rgb_out = np.where(alpha > 1e-4, out[..., :3] / np.maximum(alpha, 1e-4), 0.0)
    return np.concatenate([np.clip(rgb_out, 0, 1), alpha], axis=-1)


def binarize(rgba: np.ndarray, threshold: float = 0.48) -> np.ndarray:
    out = rgba.copy()
    solid = out[..., 3] >= threshold
    out[..., 3] = solid.astype(np.float32)
    out[~solid, :3] = 0
    return out


def clean_specks(rgba: np.ndarray) -> np.ndarray:
    """Remove isolated opaque pixels (no 4-neighbour) left by thin effect wisps."""
    a = rgba[..., 3] > 0.5
    p = np.pad(a, 1)
    n = p[:-2, 1:-1].astype(int) + p[2:, 1:-1] + p[1:-1, :-2] + p[1:-1, 2:]
    lone = a & (n == 0)
    out = rgba.copy()
    out[lone] = 0
    return out


def shared_palette(frames: list[np.ndarray], colors: int) -> Image.Image:
    pixels = [f[f[..., 3] > 0.5][:, :3] for f in frames]
    stack = np.concatenate(pixels, axis=0)
    side = int(np.ceil(np.sqrt(len(stack))))
    canvas = np.zeros((side * side, 3), dtype=np.float32)
    canvas[: len(stack)] = stack
    canvas[len(stack):] = stack[: side * side - len(stack)] if len(stack) else 0
    img = Image.fromarray((canvas.reshape(side, side, 3) * 255).astype(np.uint8), 'RGB')
    return img.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, kmeans=4, dither=Image.Dither.NONE)


def apply_palette(rgba: np.ndarray, pal: Image.Image) -> np.ndarray:
    rgb = Image.fromarray((rgba[..., :3] * 255).astype(np.uint8), 'RGB')
    q = rgb.quantize(palette=pal, dither=Image.Dither.NONE).convert('RGB')
    out = rgba.copy()
    out[..., :3] = np.asarray(q, dtype=np.float32) / 255.0
    out[out[..., 3] < 0.5, :3] = 0
    return out


def add_outline(rgba: np.ndarray) -> np.ndarray:
    """One-pixel outline in a single ink tone, so silhouettes read on any arena
    floor and the sheet keeps its palette budget (PALETTE_SIZE + 1)."""
    a = rgba[..., 3] > 0.5
    pa = np.pad(a, 1)
    prgb = np.pad(rgba[..., :3], ((1, 1), (1, 1), (0, 0)))
    neigh = [(pa[:-2, 1:-1], prgb[:-2, 1:-1]), (pa[2:, 1:-1], prgb[2:, 1:-1]),
             (pa[1:-1, :-2], prgb[1:-1, :-2]), (pa[1:-1, 2:], prgb[1:-1, 2:])]
    count = sum(m.astype(np.float32) for m, _ in neigh)
    edge = (~a) & (count > 0)
    out = rgba.copy()
    out[edge, :3] = OUTLINE_RGB / 255.0
    out[edge, 3] = 1.0
    return out


def breathe(rgba: np.ndarray, feet_y: int, top_y: int) -> np.ndarray:
    """Idle B: everything above the waist sinks one art pixel (classic breath)."""
    waist = int(round(feet_y - (feet_y - top_y) * 0.46))
    out = rgba.copy()
    out[1:waist + 1] = rgba[0:waist]
    out[0] = 0
    return out


def pose_frame(unit: dict, pose_name: str, factor: float) -> tuple[np.ndarray, tuple[float, float]]:
    pose = unit['poses'][pose_name]
    rgba = load_rgba(pose['src'])
    f = factor * pose.get('scaleCorrection', 1.0)
    small = clean_specks(binarize(downscale(rgba, f)))
    ax, ay = pose['anchor']['x'] * f, pose['anchor']['y'] * f
    return small, (ax, ay)


def build_unit(unit: dict, hero_height: float) -> tuple[np.ndarray, dict]:
    presence = presence_scale(unit, hero_height)
    factor = unit['worldUnitsPerPixel'] * PX_PER_UNIT * presence
    frames: dict[str, np.ndarray] = {}
    anchors: dict[str, tuple[float, float]] = {}
    for pose in POSES:
        frames[pose], anchors[pose] = pose_frame(unit, pose, factor)

    pal = shared_palette(list(frames.values()), PALETTE_SIZE)
    for k in frames:
        frames[k] = add_outline(apply_palette(frames[k], pal))

    # Common cell: every pose is placed so its anchor lands on the same point.
    left = right = up = down = 0
    for k, img in frames.items():
        ax, ay = anchors[k]
        ys, xs = np.nonzero(img[..., 3] > 0.5)
        left = max(left, ax - xs.min())
        right = max(right, xs.max() + 1 - ax)
        up = max(up, ay - ys.min())
        down = max(down, ys.max() + 1 - ay)
    pad = 2
    cw = int(np.ceil(left + right)) + pad * 2
    ch = int(np.ceil(up + down)) + pad * 2
    cax, cay = int(np.ceil(left)) + pad, int(np.ceil(up)) + pad

    cells: dict[str, np.ndarray] = {}
    for k, img in frames.items():
        cell = np.zeros((ch, cw, 4), dtype=np.float32)
        ax, ay = anchors[k]
        ox, oy = int(round(cax - ax)), int(round(cay - ay))
        ys, xs = np.nonzero(img[..., 3] > 0.5)
        ty, tx = ys + oy, xs + ox
        ok = (ty >= 0) & (ty < ch) & (tx >= 0) & (tx < cw)
        cell[ty[ok], tx[ok]] = img[ys[ok], xs[ok]]
        cells[k] = cell

    ys = np.nonzero(cells['prepare'][..., 3] > 0.5)[0]
    cells['idle_b'] = breathe(cells['prepare'], cay, int(ys.min()))
    order = ['prepare', 'idle_b', 'dash', 'attack', 'cast']
    sheet = np.concatenate([cells[k] for k in order], axis=1)

    entry = {
        'file': f"{PUBLIC_PREFIX}/{unit['unitId']}.png",
        'cell': [cw, ch],
        'anchor': [cax, cay],
        'presenceScale': round(presence, 4),
        'cells': ['idle', 'idle_b', 'dash', 'attack', 'cast'],
        'anims': default_anims(unit),
        'source': {pose: unit['poses'][pose]['sha256'] for pose in POSES},
        'figureHeightPx': int(cay - ys.min()),
        'idleBoundsPx': idle_bounds(cells['prepare']),
        'colors': int(len(np.unique((sheet[sheet[..., 3] > 0.5][:, :3] * 255).astype(np.uint8), axis=0))),
    }
    return sheet, entry


def idle_bounds(cell: np.ndarray) -> dict:
    ys, xs = np.nonzero(cell[..., 3] > 0.5)
    return {'left': int(xs.min()), 'top': int(ys.min()), 'right': int(xs.max()) + 1, 'bottom': int(ys.max()) + 1}


def default_anims(unit: dict) -> dict:
    """Keyframe sequences; in-betweens come from the runtime's code motion."""
    creature = unit['scaleFamily'] == 'SMALL_CREATURE'
    return {
        'idle': {'frames': ['idle', 'idle', 'idle_b', 'idle_b'], 'ms': [420, 260, 420, 260] if not creature else [300, 200, 300, 200], 'loop': True},
        'move': {'frames': ['dash'], 'ms': [120], 'loop': True},
        'windup': {'frames': ['idle_b', 'dash'], 'ms': [90, 120], 'loop': False},
        'attack': {'frames': ['attack'], 'ms': [360], 'loop': False},
        'cast': {'frames': ['idle_b', 'cast'], 'ms': [110, 520], 'loop': False},
        'hurt': {'frames': ['idle_b'], 'ms': [220], 'loop': False},
        'ko': {'frames': ['idle_b'], 'ms': [400], 'loop': False},
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', default='')
    ap.add_argument('--preview', default='')
    args = ap.parse_args()
    manifest = json.loads(MANIFEST.read_text())
    units = [u for u in manifest['units'] if all(p in u.get('poses', {}) for p in POSES)]
    hero = next(u for u in units if u['unitId'] == HERO_REFERENCE_UNIT)
    hero_height = visible_height(hero['poses']['prepare'], hero['worldUnitsPerPixel'])
    only = {s for s in args.only.split(',') if s}
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    existing = json.loads(OUT_JSON.read_text()) if OUT_JSON.exists() and only else {'units': {}}
    result = {'version': 1, 'pxPerUnit': PX_PER_UNIT, 'units': dict(existing.get('units', {}))}
    previews = []
    for unit in units:
        if only and unit['unitId'] not in only:
            continue
        sheet, entry = build_unit(unit, hero_height)
        png = Image.fromarray((sheet * 255).round().astype(np.uint8), 'RGBA')
        out = OUT_DIR / f"{unit['unitId']}.png"
        png.save(out, optimize=True)
        entry['sha256'] = hashlib.sha256(out.read_bytes()).hexdigest()
        result['units'][unit['unitId']] = entry
        previews.append(png)
        print(f"{unit['unitId']:26s} cell {entry['cell']} figure {entry['figureHeightPx']}px colors {entry['colors']} presence {entry['presenceScale']}")
    result['units'] = dict(sorted(result['units'].items()))
    OUT_JSON.write_text(json.dumps(result, indent=2) + '\n')
    if args.preview and previews:
        scale = 3
        w = max(p.width for p in previews) * scale
        h = sum(p.height for p in previews) * scale
        canvas = Image.new('RGBA', (w, h), (58, 64, 72, 255))
        y = 0
        for p in previews:
            big = p.resize((p.width * scale, p.height * scale), Image.Resampling.NEAREST)
            canvas.alpha_composite(big, (0, y))
            y += big.height
        canvas.save(args.preview)
    return 0


if __name__ == '__main__':
    sys.exit(main())

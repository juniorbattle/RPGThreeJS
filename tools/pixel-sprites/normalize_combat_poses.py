#!/usr/bin/env python3
"""Bring generated combat poses to their master's scale and store them for the pixel builder (OD-2026-11-13-A).

The image model draws each pose at its own scale (the Aldric pilot: dash 1.10, attack 1.245, cast 1.10 times its master).
For each pose this tool measures that scale on rigid parts, so that the body keeps one size in every pose (Gate 4 of
docs/art-direction/option-c/character-style-lock/generation-gate.md), then stores the pose in its master's pixel space:

  - effect-free pose: SIFT matches master -> pose split into rigid clusters by repeated RANSAC similarity fits, plus a
    multi-scale template of the master's head band; the scale is the median of the trusted measures;
  - pose with its baked effect: measured against its own effect-free version, which the effect step only edits (the
    pilot: 0.999 with 400+ matches), so scale and feet stay exact under auras and rings;
  - feet anchor: lowest solid row and centre of the solid pixels in the lowest 6 % of the figure (of the effect-free
    pose, carried over to the effect version);
  - QC: transparent corners, no magenta key pixel, no solid pixel on the canvas edge.

A measure can be overridden by eye in tools/pixel-sprites/poses/overrides.json ({"unit": {"pose": scale}}).

Input   tmp/combat-poses/out/<unit>__<pose>[__fx].png (tools/art/finalImages.ts poses), tmp/combat-poses/units.json
Output  tools/pixel-sprites/poses/<unit>/<pose>.webp (lossless) and tools/pixel-sprites/poses/poses.json
Usage   py -3 tools/pixel-sprites/normalize_combat_poses.py --units aldric,morvan | --group heroes
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
GEN = ROOT / 'tmp/combat-poses'
OUT = ROOT / 'tools/pixel-sprites/poses'
MANIFEST = OUT / 'poses.json'
OVERRIDES = OUT / 'overrides.json'
POSES = ('dash', 'attack', 'cast')
# Stored poses keep at most 160 px per metre (4x the pixel sheets' 40, the density of the Character V2 poses) and never
# upscale their master.
STORE_PX_PER_M = 160


def rgba(path: Path) -> np.ndarray:
    return np.asarray(Image.open(path).convert('RGBA'))


def flat_gray(a: np.ndarray, k: float = 1.0) -> np.ndarray:
    al = a[..., 3:4].astype(np.float32) / 255
    img = (a[..., :3].astype(np.float32) * al + 64 * (1 - al)).astype(np.uint8)
    g = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    return g if k == 1 else cv2.resize(g, None, fx=k, fy=k, interpolation=cv2.INTER_AREA)


def solid(a: np.ndarray) -> np.ndarray:
    return a[..., 3] > 128


def bbox(a: np.ndarray) -> tuple[int, int, int, int]:
    ys, xs = np.nonzero(solid(a))
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def feet_anchor(a: np.ndarray) -> tuple[float, float]:
    ys, xs = np.nonzero(solid(a))
    bottom, top = ys.max(), ys.min()
    band = ys >= bottom - 0.06 * (bottom - top)
    return float(xs[band].mean()), float(bottom + 1)


def qc(a: np.ndarray) -> dict:
    s = solid(a)
    r, g, b = (a[..., c].astype(int) for c in range(3))
    magenta = s & (r > 200) & (g < 60) & (b > 200)
    edge = int(s[:2].sum() + s[-2:].sum() + s[:, :2].sum() + s[:, -2:].sum())
    corners = all(a[y, x, 3] <= 16 for y in (0, -1) for x in (0, -1))  # a faint haze is dropped by the builder's alpha cut
    return {'cornersTransparent': bool(corners), 'magentaPx': int(magenta.sum()), 'solidPxOnEdges': edge}


def sift_matches(a: np.ndarray, b: np.ndarray, ratio: float = 0.8) -> tuple[np.ndarray, np.ndarray]:
    sift = cv2.SIFT_create(nfeatures=0, contrastThreshold=0.02)
    k1, d1 = sift.detectAndCompute(flat_gray(a), None)
    k2, d2 = sift.detectAndCompute(flat_gray(b), None)
    if d1 is None or d2 is None:
        return np.zeros((0, 2), np.float32), np.zeros((0, 2), np.float32)
    good = [m for m, n in cv2.BFMatcher().knnMatch(d1, d2, k=2) if m.distance < ratio * n.distance]
    return np.float32([k1[m.queryIdx].pt for m in good]), np.float32([k2[m.trainIdx].pt for m in good])


def sift_clusters(master: np.ndarray, pose: np.ndarray) -> list[tuple[float, int]]:
    src, dst = sift_matches(master, pose)
    left, out = np.ones(len(src), bool), []
    for _ in range(5):
        if left.sum() < 6:
            break
        M, inl = cv2.estimateAffinePartial2D(src[left], dst[left], method=cv2.RANSAC, ransacReprojThreshold=5, maxIters=8000)
        if M is None or inl.sum() < 5:
            break
        idx = np.nonzero(left)[0][inl.ravel() == 1]
        out.append((float(np.hypot(M[0, 0], M[1, 0])), len(idx)))
        left[idx] = False
    return out


def head_box(master: np.ndarray) -> tuple[int, int, int, int] | None:
    """The master's head (helm, hood or mask): in the top 22 % of the figure, the solid shape nearest the torso's axis, so
    that a raised weapon or a spear tip in the same band is left out."""
    x0, y0, x1, y1 = bbox(master)
    fig_h = y1 - y0
    torso = solid(master)[y0 + int(0.3 * fig_h):y0 + int(0.5 * fig_h)]
    axis = float(np.nonzero(torso)[1].mean()) if torso.any() else (x0 + x1) / 2
    band = solid(master)[y0:y0 + int(0.22 * fig_h)].astype(np.uint8)
    count, labels, stats, centroids = cv2.connectedComponentsWithStats(band, connectivity=8)
    shapes = [i for i in range(1, count) if stats[i, cv2.CC_STAT_AREA] > 0.002 * fig_h * fig_h]
    if not shapes:
        return None
    head = min(shapes, key=lambda i: abs(centroids[i][0] - axis))
    hx, hy, hw, hh = (int(v) for v in stats[head, :4])
    if hw > 0.45 * (x1 - x0):
        return None
    return hx, y0 + hy, hx + hw, y0 + hy + hh


def head_template(master: np.ndarray, pose: np.ndarray) -> tuple[float, float] | None:
    """The master's head matched in the pose at several scales and angles, at half resolution."""
    box = head_box(master)
    if not box:
        return None
    hx0, hy0, hx1, hy1 = box
    t0 = flat_gray(master[hy0:hy1, hx0:hx1], 0.5)
    g = flat_gray(pose, 0.5)

    def rot(img: np.ndarray, ang: float) -> np.ndarray:
        h, w = img.shape[:2]
        return cv2.warpAffine(img, cv2.getRotationMatrix2D((w / 2, h / 2), ang, 1.0), (w, h), borderValue=64)

    def search(scales, angs):
        best = (-1.0, 0.0, 0)
        for s in scales:
            ts = cv2.resize(t0, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
            if ts.shape[0] >= g.shape[0] or ts.shape[1] >= g.shape[1] or min(ts.shape) < 8:
                continue
            for a in angs:
                v = cv2.minMaxLoc(cv2.matchTemplate(g, rot(ts, a), cv2.TM_CCOEFF_NORMED))[1]
                if v > best[0]:
                    best = (float(v), float(s), a)
        return best

    v, s, a = search(np.arange(0.7, 2.0, 0.05), range(-40, 41, 8))
    if v < 0:
        return None
    v, s, a = search(np.arange(s - 0.05, s + 0.051, 0.0125), range(a - 6, a + 7, 3))
    return v, s


def measure(master: np.ndarray, pose: np.ndarray) -> dict:
    clusters = sift_clusters(master, pose)
    head = head_template(master, pose)
    trusted = [s for s, n in clusters if n >= 15] + ([head[1]] if head and head[0] >= 0.55 else [])
    if len(trusted) < 2:  # a turned pose shows few rigid parts: accept the smaller clusters too
        trusted += [s for s, n in clusters if 6 <= n < 15]
    trusted = [s for s in trusted if 0.5 <= s <= 2.5]
    scale = float(np.median(trusted)) if trusted else 1.0
    spread = (max(trusted) - min(trusted)) / scale if len(trusted) > 1 else 1.0
    return {'scale': round(scale, 4), 'measures': sorted(round(s, 3) for s in trusted),
            'uncertain': bool(len(trusted) < 2 or spread > 0.25),
            'siftClusters': [[round(s, 3), n] for s, n in clusters],
            'headTemplate': [round(head[0], 3), round(head[1], 3)] if head else None}


def edit_transform(base: np.ndarray, fx: np.ndarray) -> tuple[np.ndarray, int]:
    """Similarity from an effect-free pose to its effect version (the edit keeps the drawing)."""
    src, dst = sift_matches(base, fx, ratio=0.75)
    M, inl = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=4)
    if M is None:
        raise RuntimeError('effect version does not match its pose')
    return M, int(inl.sum())


def store(a: np.ndarray, factor: float, anchor: tuple[float, float], path: Path) -> tuple[list[float], list[int]]:
    """Resizes by `factor`, crops to the figure with a margin, saves lossless WebP; returns the anchor in the stored image."""
    img = Image.fromarray(a, 'RGBA')
    w, h = max(1, round(img.width * factor)), max(1, round(img.height * factor))
    img = img.resize((w, h), Image.Resampling.LANCZOS)
    arr = np.asarray(img)
    ys, xs = np.nonzero(arr[..., 3] > 8)
    pad = 6
    x0, y0 = max(0, xs.min() - pad), max(0, ys.min() - pad)
    x1, y1 = min(w, xs.max() + 1 + pad), min(h, ys.max() + 1 + pad)
    crop = img.crop((x0, y0, x1, y1))
    path.parent.mkdir(parents=True, exist_ok=True)
    crop.save(path, format='WEBP', lossless=True, quality=100, method=6)
    return [round(anchor[0] * factor - x0, 2), round(anchor[1] * factor - y0, 2)], [crop.width, crop.height]


REFS = GEN / 'refs'
# Reference canvases: the master's figure stands this high on the canvas, its feet on this line, a little to the left for
# the attack's reach (square canvas; a four-legged beast gets a wide one and a lower figure).
CANVAS = {'square': {'size': (1024, 1024), 'height': 0.62, 'maxWidth': 0.80, 'x': {'stand': 0.5, 'attack': 0.40}},
          'wide': {'size': (1536, 1024), 'height': 0.50, 'maxWidth': 0.62, 'x': {'stand': 0.5, 'attack': 0.42}}}
FEET = 0.92


def prepare_refs(units: list[str], table: dict) -> None:
    """Places each master on its pose canvas at a known size (tools/art/finalImages.ts poses sends it as the reference)."""
    REFS.mkdir(parents=True, exist_ok=True)
    known = json.loads((REFS / 'refs.json').read_text()) if (REFS / 'refs.json').exists() else {}
    for unit_id in units:
        unit = table[unit_id]
        layout = CANVAS['wide' if unit['body'] == 'quadruped' else 'square']
        W, H = layout['size']
        master = Image.open(ROOT / unit['master']).convert('RGBA')
        fig = master.crop(master.getbbox())
        factor = min(layout['height'] * H / fig.height, layout['maxWidth'] * W / fig.width)
        fig = fig.resize((round(fig.width * factor), round(fig.height * factor)), Image.Resampling.LANCZOS)
        for kind, cx in layout['x'].items():
            canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
            canvas.alpha_composite(fig, (round(cx * W - fig.width / 2), round(FEET * H) - fig.height))
            canvas.save(REFS / f'{unit_id}__{kind}.png')
        known[unit_id] = {'factor': round(factor, 5), 'canvas': [W, H]}
        print(f'{unit_id:22s} reference canvas {W}x{H}, master x{factor:.3f}')
    (REFS / 'refs.json').write_text(json.dumps(dict(sorted(known.items())), indent=2) + '\n')


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--units', default='')
    ap.add_argument('--group', default='')
    ap.add_argument('--prepare-refs', action='store_true')
    args = ap.parse_args()
    table = json.loads((GEN / 'units.json').read_text())
    units = [u for u in args.units.split(',') if u] or [u for u, d in table.items() if d['group'] == args.group]
    if not units:
        raise SystemExit('Choose --units or --group.')
    if args.prepare_refs:
        prepare_refs(units, table)
        return 0
    refs = json.loads((REFS / 'refs.json').read_text()) if (REFS / 'refs.json').exists() else {}
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {'version': 1, 'storePxPerMetre': STORE_PX_PER_M, 'units': {}}
    overrides = json.loads(OVERRIDES.read_text()) if OVERRIDES.exists() else {}
    for unit_id in units:
        unit = table[unit_id]
        master = rgba(ROOT / unit['master'])
        mx0, my0, mx1, my1 = bbox(master)
        master_fig = my1 - my0
        store_k = min(1.0, STORE_PX_PER_M * unit['worldHeight'] / master_fig)
        entry = {'group': unit['group'], 'master': unit['master'], 'worldHeight': unit['worldHeight'],
                 'masterSha256': hashlib.sha256((ROOT / unit['master']).read_bytes()).hexdigest(),
                 'masterFigureHeightPx': master_fig, 'storeScale': round(store_k, 5), 'poses': {}}
        for pose in POSES:
            base_path = GEN / 'out' / f'{unit_id}__{pose}.png'
            fx_path = GEN / 'out' / f'{unit_id}__{pose}__fx.png'
            if not base_path.exists():
                raise SystemExit(f'missing {base_path.relative_to(ROOT)}')
            base = rgba(base_path)
            m = measure(master, base)
            override = overrides.get(unit_id, {}).get(pose)
            # The model draws near the size of its reference canvas, but often 5 to 25 % larger (the Bear's lot): the
            # median of the measures wins as soon as there are two; one measure is averaged with the canvas factor when
            # they agree within 25 %; with none, the canvas factor stands.
            expected = refs.get(unit_id, {}).get('factor')
            measures = m['measures']
            if override:
                scale, basis = float(override), 'override'
            elif len(measures) >= 2 or not expected:
                scale, basis = m['scale'], 'measured'
            elif measures and abs(measures[0] - expected) <= 0.25 * expected:
                scale, basis = (measures[0] + expected) / 2, 'measure and reference canvas'
            else:
                scale, basis = float(expected), 'reference canvas'
            m['expected'] = expected
            m['basis'] = basis
            anchor = feet_anchor(base)
            source, src_path = base, base_path
            fx_info = None
            if pose in unit['fxPoses']:
                if not fx_path.exists():
                    raise SystemExit(f'missing {fx_path.relative_to(ROOT)}')
                fx = rgba(fx_path)
                M, inliers = edit_transform(base, fx)
                s_edit = float(np.hypot(M[0, 0], M[1, 0]))
                scale *= s_edit
                anchor = (float(M[0, 0] * anchor[0] + M[0, 1] * anchor[1] + M[0, 2]), float(M[1, 0] * anchor[0] + M[1, 1] * anchor[1] + M[1, 2]))
                source, src_path = fx, fx_path
                fx_info = {'editScale': round(s_edit, 4), 'editInliers': inliers, 'editShift': [round(float(M[0, 2]), 1), round(float(M[1, 2]), 1)]}
            out = OUT / unit_id / f'{pose}.webp'
            stored_anchor, size = store(source, store_k / scale, anchor, out)
            entry['poses'][pose] = {
                'src': out.relative_to(ROOT).as_posix(), 'sha256': hashlib.sha256(out.read_bytes()).hexdigest(),
                'sizePx': size, 'anchor': stored_anchor, 'characterBoundFx': fx_info is not None,
                'scaleVsMaster': round(scale, 4), 'measured': m, 'override': override, 'edit': fx_info,
                'generated': {'file': src_path.relative_to(ROOT).as_posix(), 'sha256': hashlib.sha256(src_path.read_bytes()).hexdigest()},
                'qc': qc(source),
            }
            print(f"{unit_id:22s} {pose:6s} scale {scale:.3f} ({m['basis']}, expected {expected}) measures {m['measures']}{' fx' if fx_info else ''} qc {entry['poses'][pose]['qc']}")
        manifest['units'][unit_id] = entry
    manifest['units'] = dict(sorted(manifest['units'].items()))
    OUT.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

#!/usr/bin/env python3
"""Remove residual magenta matte pixels from an already isolated RGBA candidate."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def alpha_bbox(alpha: np.ndarray) -> list[int] | None:
    ys, xs = np.nonzero(alpha)
    if not len(xs):
        return None
    return [int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)]


def boundary(mask: np.ndarray) -> np.ndarray:
    padded = np.pad(mask, 1, constant_values=False)
    interior = mask.copy()
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            interior &= padded[
                1 + dy : 1 + dy + mask.shape[0],
                1 + dx : 1 + dx + mask.shape[1],
            ]
    return mask & ~interior


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    parser.add_argument("--distance-threshold", type=float, default=220.0)
    parser.add_argument("--rings", type=int, default=1)
    args = parser.parse_args()

    if args.output.exists() or args.report.exists():
        raise RuntimeError("Refusing to overwrite an existing output or report")
    if args.rings < 1:
        raise RuntimeError("--rings must be at least 1")

    image = Image.open(args.input).convert("RGBA")
    rgba = np.array(image)
    before_alpha = rgba[:, :, 3].copy()
    rgb = rgba[:, :, :3].astype(np.float32)
    magenta_distance = np.sqrt(
        (rgb[:, :, 0] - 255.0) ** 2
        + rgb[:, :, 1] ** 2
        + (rgb[:, :, 2] - 255.0) ** 2
    )

    removed_by_ring: list[int] = []
    for _ in range(args.rings):
        opaque = rgba[:, :, 3] > 0
        remove = boundary(opaque) & (magenta_distance < args.distance_threshold)
        removed_by_ring.append(int(remove.sum()))
        rgba[remove] = (0, 0, 0, 0)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba, mode="RGBA").save(args.output)
    report = {
        "schemaVersion": 1,
        "method": "bounded-magenta-edge-ring-removal",
        "input": args.input.as_posix(),
        "inputSha256": sha256(args.input),
        "output": args.output.as_posix(),
        "outputSha256": sha256(args.output),
        "distanceThreshold": args.distance_threshold,
        "rings": args.rings,
        "removedPixelsByRing": removed_by_ring,
        "alphaBBoxBefore": alpha_bbox(before_alpha),
        "alphaBBoxAfter": alpha_bbox(rgba[:, :, 3]),
        "alphaPixelsBefore": int((before_alpha > 0).sum()),
        "alphaPixelsAfter": int((rgba[:, :, 3] > 0).sum()),
    }
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

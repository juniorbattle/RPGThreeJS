#!/usr/bin/env python3
"""Cut the far-distance plate of each procedural combat arena.

The approved strategic paintings (demo-environment-pack-v1) already hold the
right sky, horizon and distant architecture for each biome. The arena keeps
only that far band: the floor is now procedural 3D, so the painted floor is
cropped away and the bottom edge fades out into the arena fog.

These plates are placeholders until the locally generated layered plates
(tools/openai-art, batch `arena-plates`) replace them with the same contract:
one image per biome, wide, horizon near the bottom, no floor, no characters.

Usage: python3 tools/combat-arena/build_far_plates.py
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'public/assets/generated/lion-phase/environments/demo-environment-pack-v1/strategic'
OUT = ROOT / 'public/assets/generated/combat-arena'

# crop: share of the painting height kept from the top; fade: share of the
# kept band that fades to transparent at the bottom.
PLATES = {
    'forest_route': {'src': 'forest-route-strategic.png', 'crop': 0.50, 'fade': 0.30},
    'bois_clair_burning': {'src': 'bois-clair-burning-strategic.png', 'crop': 0.52, 'fade': 0.30},
    'lion_sanctum': {'src': 'lion-sanctum-strategic.png', 'crop': 0.53, 'fade': 0.28},
}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {}
    for scene, spec in PLATES.items():
        img = Image.open(SRC / spec['src']).convert('RGBA')
        w, h = img.size
        band = img.crop((0, 0, w, int(round(h * spec['crop']))))
        arr = np.asarray(band, dtype=np.float32)
        bh = arr.shape[0]
        fade_start = int(bh * (1 - spec['fade']))
        ramp = np.ones(bh, dtype=np.float32)
        t = np.linspace(0, 1, bh - fade_start)
        ramp[fade_start:] = 1 - (t * t * (3 - 2 * t))
        arr[..., 3] *= ramp[:, None]
        horizon = arr[fade_start - 8:fade_start, :, :3].reshape(-1, 3).mean(axis=0)
        out = OUT / f'{scene}-far.webp'
        Image.fromarray(arr.astype(np.uint8), 'RGBA').save(out, 'WEBP', quality=88, method=6)
        meta[scene] = {
            'file': f'/assets/generated/combat-arena/{scene}-far.webp',
            'size': [w, bh],
            'horizonRgb': [int(c) for c in horizon],
            'source': f'demo-environment-pack-v1/strategic/{spec["src"]}',
        }
        print(scene, out.stat().st_size // 1024, 'KB', meta[scene]['horizonRgb'])
    (OUT / 'far-plates.json').write_text(json.dumps(meta, indent=2) + '\n')


if __name__ == '__main__':
    main()

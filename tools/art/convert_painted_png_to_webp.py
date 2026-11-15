"""Write the WebP the game loads beside each large painted PNG of the demo (OD-2026-11-15-A, P2).

The 29 painted backdrops below were still shipped as PNG (about 86 MiB). The game now loads a WebP sibling saved with
the post-demo setting (quality 95, method 6, atlas_layout.save_options): same resolution, same framing, no retouch.
The PNG stays in the repository as the master that the art pipeline reads as a reference (finalImagesStaging.ts,
provenance records); vite.config.ts keeps it out of the production build (tools/build/production-excluded-public-assets.json).

Usage: py tools/art/convert_painted_png_to_webp.py [--force]
Prints one JSON line per image: png, webp, sha256, bytes, width, height. An existing WebP is kept unless --force.
"""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from atlas_layout import save_options  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
PACK = 'public/assets/generated/lion-phase/environments/demo-environment-pack-v1'

PAINTED_PNGS = [
    'public/assets/generated/lion-phase/poi-lot-e/judgement.png',
    'public/assets/generated/lion-phase/poi-lot-e/lion-opening.png',
    'public/assets/generated/lion-phase/poi-lot-e/bois-clair.png',
    'public/assets/generated/lion-phase/environments/corrections/bois-clair-night-watch-v1.png',
    'public/assets/backdrops/travel_default.png',
    f'{PACK}/travel/forest-road-travel.png',
    *[f'{PACK}/tableau/{name}.png' for name in (
        'abandoned-cart-area-tableau', 'alaric-audience-tableau', 'bois-clair-tableau-aftermath-sacrificed',
        'bois-clair-tableau-aftermath-saved', 'bois-clair-tableau-burning', 'dragon-roost-area', 'final-refuge-tableau',
        'first-refuge-tableau', 'forest-ambush-area-tableau', 'forest-crossroads-tableau', 'forest-road-tableau',
        'lion-camp-tableau', 'lion-judgement-epilogue-tableau', 'lion-judgement-tableau', 'lion-trial-tableau-aftermath',
        'old-shrine-tableau', 'refugee-road-tableau', 'roadside-event-tableau', 'second-refuge-night-tableau',
        'serpent-finale-tableau-aftermath', 'shadow-ruins-tableau', 'valmir-road-tableau', 'witness-road-tableau',
    )],
]


def main() -> None:
    force = '--force' in sys.argv[1:]
    for relative in PAINTED_PNGS:
        png = ROOT / relative
        webp = png.with_suffix('.webp')
        if force or not webp.exists():
            with Image.open(png) as image:
                image.convert('RGB').save(webp, **save_options(webp))
        with Image.open(webp) as image:
            width, height = image.size
        data = webp.read_bytes()
        print(json.dumps({
            'png': relative, 'webp': webp.relative_to(ROOT).as_posix(), 'sha256': hashlib.sha256(data).hexdigest(),
            'bytes': len(data), 'width': width, 'height': height,
        }))


if __name__ == '__main__':
    main()

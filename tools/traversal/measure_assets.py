"""Read-only alpha bounds for canonical sprites; never rewrites source art."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
manifest = json.loads((ROOT / 'src/render/generated/characterSystemV2Manifest.json').read_text())
paths = [u['roles']['full'] for u in manifest['units']]
paths += ['/assets/generated/lion-phase/traversal/t0/vehicle/wooden-4x4/clean.png',
          '/assets/generated/lion-phase/traversal/t0/vehicle/wooden-4x4/fantasy-truck-v3.png',
          '/assets/generated/lion-phase/traversal/t0/entities/merchant-caravan/clean.png']
paths += [f'/assets/generated/lion-phase/traversal/t0/entities/route-props-v3/{name}.png'
          for name in ['chest', 'abandoned-cart', 'debris', 'waystone', 'barricade', 'foreground']]
paths += [f'/assets/generated/lion-phase/traversal/t0/forest-v4/{name}.png'
          for name in ['fork-sign', 'woodland-blockade', 'resting-place', 'ruined-outpost', 'crossroads-ground', 'merchant-camp']]
bounds = {}
for url in paths:
    with Image.open(ROOT / 'public' / url.lstrip('/')) as image:
        alpha = image.convert('RGBA').getchannel('A')
        box = alpha.point(lambda a: 255 if a > 16 else 0).getbbox()
        if box:
            bounds[url] = dict(width=image.width, height=image.height, left=box[0], top=box[1],
                               right=box[2], bottom=box[3])
(ROOT / 'src/traversal/TraversalSpriteBounds.json').write_text(json.dumps(bounds, indent=2) + '\n')
print(f'Measured {len(bounds)} immutable visual sources')

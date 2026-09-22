"""Deterministic extraction only. Creative source is built-in image_gen, never repainted."""
from pathlib import Path
from PIL import Image
import hashlib
import json

SOURCE = Path('tools/traversal/qa/final-convergence/caravan/processed/raw-sheet-clean.png')
DEST = Path('public/assets/generated/lion-phase/traversal/t0/vehicle/traversal-caravan/closed-v1')
DEST.mkdir(parents=True, exist_ok=True)
image = Image.open(SOURCE).convert('RGBA')
# Remove residual chroma spill in the antialiased key boundary. This design has no purple material.
pixels = image.load()
for y in range(image.height):
    for x in range(image.width):
        r, g, b, a = pixels[x, y]
        if a and min(r, b) > g + 30:
            pixels[x, y] = (0, 0, 0, 0)
body = image.crop((140, 20, 1400, 674))
body.save(DEST / 'chassis.png', optimize=True)
wheel = image.crop((619, 672, 919, 972))
wheel.save(DEST / 'wheel.png', optimize=True)
assets = []
for path in DEST.glob('*.png'):
    im = Image.open(path)
    assets.append(dict(path=path.as_posix(), sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                       size=im.size, bounds=im.getbbox(), bytes=path.stat().st_size))
Path('tools/traversal/qa/final-convergence/caravan/extraction.json').write_text(json.dumps({
    'source': str(SOURCE), 'sourceSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'generator': 'built-in image_gen', 'processing': 'generate2dsprite chroma key, residual magenta removal, component crops only',
    'bodyCrop': [140,20,1400,674], 'wheelCrop': [619,672,919,972], 'assets': assets,
}, indent=2))
print(json.dumps(assets, indent=2))

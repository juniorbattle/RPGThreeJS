"""Frame the six recruitable heroes for the static dialogue tableaux (operator remarks, 2026-11-13).

The tableau fits every actor picture into boxes of the same width (`.narrative-cast__actor`, object-fit: contain).
The company's masters are 512x512 canvases where a standing figure fills about two thirds of the height above a
margin of 56 px (10.9 %). The six heroes' masters are 640x768 canvases where the figure fills 84 % of the height
above a margin of 34 px, so they showed about 1.5 times taller than the company and lower on the ground.

This script only re-frames: it crops a picture to its visible figure and pads it, without any resampling, on a square
canvas where one world unit (the heroes' `worldHeight`, tools/art/combatPosesTable.ts) takes the same share of the
height as on the company's masters, with the same share of margin under the feet. No pixel is drawn or changed.

- From the master (default): the heroes' masters come from one pipeline, about 313 px per world unit.
- From an accepted rest pose (`--rest lyra,...`): the standing figure the tool drew (finalImages.ts `rest`, in
  tmp/tableau-rest/out/), measured on its own height, since a rest pose stands upright.

Usage: py -3 tools/art/frame_tableau_actors.py [--rest lyra,aldric]   (writes public/assets/characters/pixel/tableau/)
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'public/assets/characters/pixel/archive/non-demo'
REST_SOURCE = ROOT / 'tmp/tableau-rest/out'
TARGET = ROOT / 'public/assets/characters/pixel/tableau'
# worldHeight of tools/art/combatPosesTable.ts
HEROES = {'aldric': 2.08, 'morvan': 2.12, 'lyra': 2.02, 'eldwin': 2.04, 'talon': 2.05, 'gunnar': 2.06}

# The company's masters (alistair, archer, sage_seraphine, dark_mage): figure share of the canvas height per world
# unit of their combat height, and margin under the feet as a share of the canvas.
COMPANY_SHARE_PER_UNIT = 0.667 / 2.125
COMPANY_FOOT_MARGIN = 56 / 512
HERO_PIXELS_PER_UNIT = 313
ALPHA_THRESHOLD = 24


def frame(hero: str, rest: bool) -> tuple[int, tuple[int, int, int, int]]:
    path = REST_SOURCE / f'{hero}__rest.png' if rest else SOURCE / f'{hero}.png'
    picture = Image.open(path).convert('RGBA')
    box = picture.getchannel('A').point(lambda value: 255 if value > ALPHA_THRESHOLD else 0).getbbox()
    if box is None:
        raise SystemExit(f'{hero}: empty picture')
    figure = picture.crop(box)
    if rest:
        size = round(figure.height / (COMPANY_SHARE_PER_UNIT * HEROES[hero]))
    else:
        size = round(HERO_PIXELS_PER_UNIT / COMPANY_SHARE_PER_UNIT)
    margin = round(COMPANY_FOOT_MARGIN * size)
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    left = (size - figure.width) // 2
    top = size - margin - figure.height
    if left < 0 or top < 0:
        raise SystemExit(f'{hero}: figure {figure.size} does not fit a {size} px canvas')
    canvas.paste(figure, (left, top))
    TARGET.mkdir(parents=True, exist_ok=True)
    canvas.save(TARGET / f'{hero}.png', optimize=True)
    return size, box


if __name__ == '__main__':
    rest = set(sys.argv[sys.argv.index('--rest') + 1].split(',')) if '--rest' in sys.argv else set()
    unknown = rest - HEROES.keys()
    if unknown:
        raise SystemExit(f'Not a recruitable hero: {", ".join(sorted(unknown))}')
    for hero in HEROES:
        size, box = frame(hero, hero in rest)
        source = 'rest pose' if hero in rest else 'master'
        print(f'{hero} ({source}): figure {box[2] - box[0]}x{box[3] - box[1]} on a {size}x{size} canvas')

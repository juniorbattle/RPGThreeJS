"""Frame the six recruitable heroes' masters for the static dialogue tableaux (operator remark, 2026-11-13).

The tableau fits every actor picture into boxes of the same width (`.narrative-cast__actor`, object-fit: contain).
The company's masters are 512x512 canvases where a standing figure fills about two thirds of the height above a
margin of 56 px (10.9 %). The six heroes' masters are 640x768 canvases where the figure fills 84 % of the height
above a margin of 34 px, so they showed about 1.5 times taller than the company and lower on the ground.

This script only re-frames: it crops each master to its visible figure and pads it, without any resampling, on a
square canvas where one world unit (the heroes' `worldHeight`, tools/art/combatPosesTable.ts) takes the same share of
the height as on the company's masters, with the same share of margin under the feet. No pixel is drawn or changed.

Usage: py -3 tools/art/frame_tableau_actors.py   (writes public/assets/characters/pixel/tableau/<hero>.png)
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'public/assets/characters/pixel/archive/non-demo'
TARGET = ROOT / 'public/assets/characters/pixel/tableau'
HEROES = ('aldric', 'morvan', 'lyra', 'eldwin', 'talon', 'gunnar')

# The company's masters (alistair, archer, sage_seraphine, dark_mage): figure share of the canvas height per world
# unit of their combat height, and margin under the feet as a share of the canvas.
COMPANY_SHARE_PER_UNIT = 0.667 / 2.125
COMPANY_FOOT_MARGIN = 56 / 512
# The heroes' masters come from one pipeline: about 313 px per world unit for the five standing figures.
HERO_PIXELS_PER_UNIT = 313
ALPHA_THRESHOLD = 24


def frame(hero: str) -> tuple[int, tuple[int, int, int, int]]:
    master = Image.open(SOURCE / f'{hero}.png').convert('RGBA')
    box = master.getchannel('A').point(lambda value: 255 if value > ALPHA_THRESHOLD else 0).getbbox()
    if box is None:
        raise SystemExit(f'{hero}: empty master')
    figure = master.crop(box)
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
    for hero in HEROES:
        size, box = frame(hero)
        print(f'{hero}: figure {box[2] - box[0]}x{box[3] - box[1]} on a {size}x{size} canvas')

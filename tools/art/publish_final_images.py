#!/usr/bin/env python3
"""Publish a chapter's accepted final images into the game's assets (OD-2026-11-11-F, F1).

Reads tmp/final-images/plan.json, log.json and out/ (written by tools/art/finalImages.ts) and, for every image of the
chapter, writes:

  backdrops   public/assets/generated/post-demo/<chapter>/{scenes,refuges,surfaces}/<key>.webp  (WebP, quality 95)
  atlases     public/assets/generated/post-demo/<chapter>/atlases/region-<n>.webp
              cropped back to the frame of the Lion atlas whose layout it keeps (tools/art/atlas_layout.py)
  characters  public/assets/characters/pixel/post-demo/<chapter>/<id>.png
              a 512x512 master at the Character V2 scale: feet on row 456, figure centred, height by role

and tools/art/provenance/<chapter>-final-images.json: for each published file, its brief, model, date, prompt and
sha256. Usage: py -3 tools/art/publish_final_images.py <chapter> [--ids id1,id2]
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from atlas_layout import fit, save_options  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / 'tmp' / 'final-images'
MASTER = 512
BASELINE = 456
# Figure heights of the Character V2 masters (alpha bounds, 512 canvas): standard humanoids 326-353, elites and
# bosses 392-423. Beasts are fitted by width, as the wolf and the boar are.
ELITE_HEIGHT = 412
STANDARD_HEIGHT = 345
BEAST_WIDTH = 430
ELITES = {'borin', 'raven_miner_chief', 'raven_master_spy', 'raven_foreman'}
BEASTS = {'corrupted_beast', 'depth_beast'}


def file_of(item_id: str) -> str:
    """The output name tools/art/finalImages.ts gives a brief (its fileOf)."""
    return re.sub(r'[^a-zA-Z0-9_-]+', '__', item_id) + '.png'


def master(src: Path, out: Path, unit_id: str) -> None:
    image = Image.open(src).convert('RGBA')
    box = image.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox()
    figure = image.crop(box)
    if unit_id in BEASTS:
        scale = BEAST_WIDTH / figure.width
    else:
        scale = (ELITE_HEIGHT if unit_id in ELITES else STANDARD_HEIGHT) / figure.height
    size = (max(1, round(figure.width * scale)), max(1, round(figure.height * scale)))
    # Premultiplied resampling keeps transparent edges free of dark fringes.
    figure = figure.convert('RGBa').resize(size, Image.LANCZOS).convert('RGBA')
    canvas = Image.new('RGBA', (MASTER, MASTER), (0, 0, 0, 0))
    canvas.paste(figure, ((MASTER - size[0]) // 2, BASELINE - size[1]), figure)
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out, optimize=True)


def main() -> int:
    args = sys.argv[1:]
    if not args:
        raise SystemExit(__doc__)
    chapter = args[0]
    wanted = set(args[args.index('--ids') + 1].split(',')) if '--ids' in args else None
    plan = json.loads((WORK / 'plan.json').read_text(encoding='utf8'))
    log = json.loads((WORK / 'log.json').read_text(encoding='utf8'))
    last = {entry['id']: entry for entry in log}
    provenance_path = ROOT / 'tools' / 'art' / 'provenance' / f'{chapter}-final-images.json'
    provenance = json.loads(provenance_path.read_text(encoding='utf8')) if provenance_path.exists() else {}
    backdrops = ROOT / 'public' / 'assets' / 'generated' / 'post-demo' / chapter
    characters = ROOT / 'public' / 'assets' / 'characters' / 'pixel' / 'post-demo' / chapter
    published = 0
    for item in plan:
        if item['chapter'] != chapter or (wanted and item['id'] not in wanted):
            continue
        src = WORK / 'out' / file_of(item['id'])
        if not src.exists() or item['id'] not in last:
            print(f'not generated: {item["id"]}')
            continue
        _, group, key = item['id'].split(':', 2)
        if group in ('actor', 'enemy'):
            out = characters / f'{key}.png'
            master(src, out, key)
        elif group == 'atlas':
            out = backdrops / 'atlases' / f'region-{key}.webp'
            fit(src, ROOT / item['references'][0], out)
        else:
            folder = {'scene': 'scenes', 'refuge': 'refuges', 'surface': 'surfaces'}[group]
            out = backdrops / folder / f'{key}.webp'
            out.parent.mkdir(parents=True, exist_ok=True)
            Image.open(src).convert('RGB').save(out, **save_options(out))
        entry = last[item['id']]
        public = '/' + out.relative_to(ROOT / 'public').as_posix()
        provenance[item['id']] = {
            'file': public, 'sha256': hashlib.sha256(out.read_bytes()).hexdigest(), 'awaitedFinal': item['awaitedFinal'],
            'model': entry['model'], 'quality': entry['quality'], 'generatedAt': entry['at'],
            'references': entry['references'], 'prompt': entry['prompt'], 'notes': entry.get('notes', ''),
        }
        published += 1
        print(f'{item["id"]:42s} -> {public}')
    provenance_path.parent.mkdir(parents=True, exist_ok=True)
    provenance_path.write_text(json.dumps(dict(sorted(provenance.items())), indent=2, ensure_ascii=False) + '\n', encoding='utf8')
    print(f'{published} images published; provenance in {provenance_path.relative_to(ROOT).as_posix()}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

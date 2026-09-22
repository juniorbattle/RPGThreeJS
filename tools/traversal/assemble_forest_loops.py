"""Overlap-assemble generated terrain layers; never mirror, paint, or overwrite source art."""
from pathlib import Path
from PIL import Image
import json
import hashlib

root = Path(__file__).resolve().parents[2]
pack = root / 'public/assets/generated/lion-phase/traversal/t0/forest-v4'
report = []
for name, overlap in [('road', 160), ('trees', 200), ('foreground', 180)]:
    source = Image.open(pack / f'{name}-source.png').convert('RGBA')
    w, h = source.size
    # Cut through the original, then join end/start across an overlap instead of reflecting art.
    output = Image.new('RGBA', (w - overlap, h))
    output.paste(source.crop((overlap, 0, w - overlap, h)), (0, 0))
    end = source.crop((w - overlap, 0, w, h))
    start = source.crop((0, 0, overlap, h))
    mask = Image.new('L', (overlap, 1))
    mask.putdata([round(255 * x / (overlap - 1)) for x in range(overlap)])
    join = Image.composite(start, end, mask.resize((overlap, h)))
    output.paste(join, (w - 2 * overlap, 0))
    output.save(pack / f'{name}-loop.png')
    report.append(dict(name=name, sourceSize=source.size, outputSize=output.size,
                       overlap=overlap, mirrored=False,
                       sourceSha256=hashlib.sha256((pack / f'{name}-source.png').read_bytes()).hexdigest(),
                       outputSha256=hashlib.sha256((pack / f'{name}-loop.png').read_bytes()).hexdigest()))
(pack / 'assembly.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))

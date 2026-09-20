"""Extract generated transparent props at the inspected empty gutters; preserve original alpha."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
pack = ROOT / 'public/assets/generated/lion-phase/traversal/t0/entities/route-props-v3'
source = Image.open(pack / 'raw-sheet.png')
# The generated atlas uses a narrower first column. Equal thirds clip the cart.
columns = [0, 448, 1024, 1536]
names = ['chest', 'abandoned-cart', 'debris', 'waystone', 'barricade', 'foreground']
report = []
for i, name in enumerate(names):
    row, col = divmod(i, 3)
    cell = source.crop((columns[col], row * 512, columns[col + 1], (row + 1) * 512))
    bounds = cell.getchannel('A').point(lambda a: 255 if a > 16 else 0).getbbox()
    assert bounds and bounds[0] > 0 and bounds[1] > 0 and bounds[2] < cell.width and bounds[3] < cell.height
    cell.save(pack / f'{name}.png')
    report.append(dict(name=name, bounds=bounds, size=cell.size, touchesEdge=False))
(pack / 'extraction-qa.json').write_text(json.dumps(report, indent=2) + '\n')
print('Six complete props extracted; alpha preserved, no cell-edge contact.')

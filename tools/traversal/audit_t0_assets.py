"""Audit immutable originals and publish accurate preview-only runtime asset provenance."""
import hashlib
import json
import re
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[2]
pack = ROOT / 'public/assets/generated/lion-phase/traversal/t0'
path = pack / 'asset-manifest.json'
manifest = json.loads(path.read_text())
active = re.findall(r"'(/assets/[^']+\.png)'", (ROOT / 'src/traversal/TraversalT0Assets.ts').read_text())
entries = {entry['path']: entry for entry in manifest['assets']}
for entry in entries.values():
    original = ROOT / 'public' / entry['path'].lstrip('/')
    assert hashlib.sha256(original.read_bytes()).hexdigest() == entry['sha256'], entry['path']
    entry['activeInRuntime'] = entry['path'] in active
for url in active:
    source = ROOT / 'public' / url.lstrip('/')
    with Image.open(source) as image:
        entry = entries.setdefault(url, {'id': source.stem, 'path': url, 'role': 'T0_PRESENTATION'})
        entry.update(width=image.width, height=image.height, mode=image.mode,
                     sha256=hashlib.sha256(source.read_bytes()).hexdigest(), activeInRuntime=True)
entries[active[0]]['role'] = 'UNIQUE_HERO_BACKGROUND_NO_REPEAT'
entries[active[2]].update(role='DRIVERLESS_FANTASY_TIMBER_TRUCK', visibleWheels=4,
                         driverVisible=False, passengerVisible=False, playerClanHeraldry=False)
manifest.update(packId='traversal-t0-preview-v3-confirm-before-commit',
                status='PREVIEW_ONLY', productionGateReady=False,
                interactionModel='PAUSE_CONFIRM_OR_SKIP_LOCAL_OPTIONALS_CANONICAL_MANDATORY_STAGES',
                assets=list(entries.values()))
path.write_text(json.dumps(manifest, indent=2) + '\n')
road = Image.open(ROOT / 'public' / active[1].lstrip('/'))
edges_equal = ImageChops.difference(road.crop((0,0,1,road.height)),
                                  road.crop((road.width-1,0,road.width,road.height))).getbbox() is None
assert edges_equal
report = dict(activeAssets=len(active), preservedOriginalAssets=len(entries)-7,
              roadEdgePixelsEqual=edges_equal, productionEnabled=False,
              localOptionalPersistentRewards=False,
              alphaExtraction=json.loads((pack / 'entities/route-props-v3/extraction-qa.json').read_text()))
(ROOT / 'tools/traversal/qa/asset-audit.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({key:value for key,value in report.items() if key != 'alphaExtraction'}))

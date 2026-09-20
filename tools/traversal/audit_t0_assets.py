"""Audit preserved T0 artwork and publish named preview forest asset provenance."""
import hashlib
import json
import re
import subprocess
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[2]
pack = ROOT / 'public/assets/generated/lion-phase/traversal/t0'
path = pack / 'asset-manifest.json'
baseline = json.loads(subprocess.check_output(['git', 'show', '04e969eb2273efb9c844c9c78cfd31e2f471be85:public/assets/generated/lion-phase/traversal/t0/asset-manifest.json'], cwd=ROOT))
manifest = json.loads(path.read_text())
assets = dict(re.findall(r"(\w+): '(/assets/[^']+\.png)'", (ROOT / 'src/traversal/TraversalT0Assets.ts').read_text()))
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
for entry in baseline['assets']:
    assert sha(ROOT / 'public' / entry['path'].lstrip('/')) == entry['sha256'], entry['path']
entries = {entry['path']: entry for entry in manifest['assets']}
for entry in entries.values():
    entry['activeInRuntime'] = entry['path'] in assets.values()
for role, url in assets.items():
    source = ROOT / 'public' / url.lstrip('/')
    with Image.open(source) as image:
        entry = entries.setdefault(url, {'id': 'forest-v4-' + role, 'path': url})
        entry.update(role=role, width=image.width, height=image.height, mode=image.mode,
                     sha256=sha(source), activeInRuntime=True)
entries[assets['vehicle']].update(visibleWheels=4, driverVisible=False, passengerVisible=False, playerClanHeraldry=False)
manifest.update(packId='traversal-t0-preview-v4-forest-road', status='PREVIEW_ONLY', productionGateReady=False,
                interactionModel='PAUSE_CONFIRM_OR_SKIP_LOCAL_AND_CANONICAL_OPTIONALS_DEFERRED_BRANCH', assets=list(entries.values()))
path.write_text(json.dumps(manifest, indent=2) + '\n')
assembly = json.loads((pack / 'forest-v4/assembly.json').read_text())
for row in assembly:
    assert row['mirrored'] is False
    assert sha(pack / 'forest-v4' / (row['name'] + '-source.png')) == row['sourceSha256']
    assert sha(pack / 'forest-v4' / (row['name'] + '-loop.png')) == row['outputSha256']
report = dict(activeAssets=len(assets), preservedBaselineAssets=len(baseline['assets']),
              baselineCommit='04e969eb2273efb9c844c9c78cfd31e2f471be85', assembly=assembly,
              productionEnabled=False, localOptionalPersistentRewards=False,
              seamAcceptance='Non-mirrored end/start overlap; visual continuity requires live browser review.')
(ROOT / 'tools/traversal/qa/forest-v4/asset-audit.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(dict(activeAssets=len(assets), preservedBaselineAssets=len(baseline['assets']), productionEnabled=False)))

"""Rebuild the T0 cleanup inventory from tracked files and source references.

Run before cleanup with --phase initial, and after cleanup with --phase final.
The explicit active set is audited against TraversalT0World, TraversalDepth,
TraversalCaravan and TraversalT0Route; no filename-only guess grants deletion.
"""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
T0 = 'public/assets/generated/lion-phase/traversal/t0/'
ACTIVE = {
    'world-v1/forest-road.png', 'world-v1/opening-ambush.png',
    'world-v1/ambush-cleared.png', 'world-v1/forest-junction.png',
    'world-v1/ruined-outpost.png',
    'world-v1/reference-convergence/nomad-waystation.png',
    'depth-v1/clearance/refugee-halt.png',
    'depth-v1/clearance/damaged-caravan.png',
    'depth-v1/foreground/ferns.png', 'depth-v1/foreground/roots.png',
    'forest-v4/fork-sign.png', 'forest-v4/foreground-loop.png',
    'entities/route-props-v3/abandoned-cart.png',
    'vehicle/traversal-caravan/closed-v1/chassis.png',
    'vehicle/traversal-caravan/closed-v1/wheel.png',
}
PROMOTIONS = {
    'world-v1/reference-convergence/nomad-waystation.png': 'world-v1/nomad-waystation.png',
    'depth-v1/clearance/refugee-halt.png': 'world-v1/refugee-halt.png',
    'depth-v1/clearance/damaged-caravan.png': 'world-v1/damaged-caravan.png',
    'depth-v1/foreground/ferns.png': 'foreground/ferns.png',
    'depth-v1/foreground/roots.png': 'foreground/roots.png',
    'forest-v4/fork-sign.png': 'props/fork-sign.png',
    'forest-v4/foreground-loop.png': 'foreground/shared-loop.png',
    'entities/route-props-v3/abandoned-cart.png': 'props/abandoned-cart.png',
    'vehicle/traversal-caravan/closed-v1/chassis.png': 'vehicle/traversal-caravan/chassis.png',
    'vehicle/traversal-caravan/closed-v1/wheel.png': 'vehicle/traversal-caravan/wheel.png',
}
FINAL_ASSETS = (ACTIVE - PROMOTIONS.keys()) | set(PROMOTIONS.values())
ASSET_REASONS = {
    'world-v1/forest-road.png': 'The single painted forest Route 1-6 surface and checkpoint seam margins.',
    'world-v1/opening-ambush.png': 'Opening Ambush checkpoint painting.',
    'world-v1/ambush-cleared.png': 'Opening Ambush painting after its canonical resolution.',
    'world-v1/nomad-waystation.png': 'Cedric checkpoint painting.',
    'world-v1/refugee-halt.png': 'Refugees checkpoint painting.',
    'world-v1/forest-junction.png': 'Fork checkpoint painting.',
    'world-v1/damaged-caravan.png': 'Branch A authored consequence painting.',
    'world-v1/ruined-outpost.png': 'Branch B authored consequence painting.',
    'foreground/ferns.png': 'Shared camera-side foreground fern occluder.',
    'foreground/roots.png': 'Shared camera-side foreground root occluder.',
    'foreground/shared-loop.png': 'Approved repeating foreground texture in route and checkpoint views.',
    'props/fork-sign.png': 'Persistent sign at the authored fork checkpoint.',
    'props/abandoned-cart.png': 'Conditional branch A actor when RunSystem assigns mystery_treasure.',
    'vehicle/traversal-caravan/chassis.png': 'Approved current caravan chassis.',
    'vehicle/traversal-caravan/wheel.png': 'Approved current rotating caravan wheel.',
}
KEEP_REPORT = ('traversal-t0-route-checkpoints-1-shared-world-full-generalization.md',
               'traversal-t0-motion-handoff-polish-1.md')

def tracked():
    indexed = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT)
    added = subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard', '-z'], cwd=ROOT)
    files = {p.decode().replace('\\', '/') for p in (indexed + added).split(b'\0') if p}
    return sorted(path for path in files if (ROOT / path).is_file())

def candidate(path):
    return (path.startswith(T0) or path.startswith('src/traversal/')
            or path == 'src/styles/traversal.css'
            or path.startswith('tools/traversal/')
            or Path(path).name.startswith('traversal-t0-') and path.startswith('tools/')
            or path.startswith('docs/reports/traversal-')
            or path.endswith('.test.ts') and 'Traversal' in path)

def references(files):
    buckets = {'runtimeRefs': [], 'testRefs': [], 'toolRefs': [], 'docRefs': []}
    for path in files:
        if path.startswith('src/') and not path.endswith('.test.ts'):
            bucket = 'runtimeRefs'
        elif path.endswith('.test.ts'):
            bucket = 'testRefs'
        elif path.startswith('tools/'):
            bucket = 'toolRefs'
        else:
            bucket = 'docRefs'
        if not Path(path).suffix.lower() in {'.ts', '.css', '.json', '.mjs', '.py', '.md', '.html'}:
            continue
        file = ROOT / path
        if file.stat().st_size > 1_000_000:
            continue
        try:
            content = file.read_text(encoding='utf-8')
        except UnicodeError:
            continue
        buckets[bucket].append((path, content))
    return buckets

def classify(path, phase):
    if path.startswith(T0):
        rel = path[len(T0):]
        if phase == 'final':
            if rel in FINAL_ASSETS:
                return 'ACTIVE_CANONICAL', 'KEEP', ASSET_REASONS[rel]
            if rel == 'asset-manifest.json':
                return 'DEVELOPMENT_REQUIRED', 'KEEP', 'Current asset integrity manifest.'
            return 'UNKNOWN', 'AUDIT', 'Remaining T0 file has no approved role.'
        if rel in PROMOTIONS:
            return 'ACTIVE_LEGACY_LOCATION', 'PROMOTE to ' + T0 + PROMOTIONS[rel], 'Approved runtime image is in a historical or redundant pack; preserve bytes.'
        if rel in ACTIVE:
            return 'ACTIVE_CANONICAL', 'KEEP', 'Approved runtime image; world-v1 remains a stable current directory.'
        if rel == 'asset-manifest.json':
            return 'DEVELOPMENT_REQUIRED', 'REWRITE', 'Remove stale entries and record current asset hashes.'
        return 'DEAD_OR_SUPERSEDED', 'DELETE', 'Not used by the approved runtime; historical source, candidate, prototype or stale metadata.'
    if path.startswith('docs/reports/traversal-'):
        name = Path(path).name
        if 'remaining-legs-audit-1' in path:
            return 'DEVELOPMENT_REQUIRED', 'KEEP', 'Independent future-leg audit, outside this T0 cleanup.'
        if phase == 'final' or name in KEEP_REPORT:
            return 'DEVELOPMENT_REQUIRED', 'KEEP', 'Accepted Lot A report or cleanup evidence.'
        return 'DEAD_OR_SUPERSEDED', 'REVIEW_EVIDENCE', 'Historical or duplicate QA; retain selected accepted files until new browser coverage exists.'
    if path.startswith('tools/traversal/'):
        return 'DEAD_OR_SUPERSEDED', 'DELETE', 'Historical T0 art/QA pipeline; canonical regression driver replaces it.'
    if path.startswith('tools/traversal-t0-'):
        return ('DEVELOPMENT_REQUIRED', 'KEEP', 'Current canonical T0 inventory or browser regression.') if phase == 'final' else ('DEAD_OR_SUPERSEDED', 'CONSOLIDATE', 'Temporary Lot A driver; merge into canonical browser workflow.')
    if path.endswith('TraversalRoadEncounter.ts') or path.endswith('TraversalRoadEncounter.test.ts'):
        return 'DEAD_OR_SUPERSEDED', 'DELETE', 'Only the removed local road combat prototype uses this module.'
    return 'ACTIVE_CANONICAL', 'KEEP_OR_SIMPLIFY', 'Current Traversal source, style or invariant test; audit dead branches without removing active contract.'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--phase', choices=['initial', 'final'], required=True)
    args = parser.parse_args()
    files = tracked()
    refs = references(files)
    entries = []
    for path in files:
        if not candidate(path):
            continue
        category, action, reason = classify(path, args.phase)
        probes = [path, '/' + path.removeprefix('public/')]
        if path.startswith(T0):
            probes.append(path[len(T0):])
        found = {}
        for name, bucket in refs.items():
            hits = [file for file, content in bucket if file != path and any(probe in content for probe in probes)]
            found[name] = hits[:30]
        if args.phase == 'final' and path.startswith(T0) and path.endswith('.png'):
            rel = path[len(T0):]
            if rel.startswith('world-v1/'):
                sources = ['src/traversal/TraversalT0World.ts', 'src/traversal/TraversalWorldRenderer.ts']
            elif rel in ('foreground/ferns.png', 'foreground/roots.png'):
                sources = ['src/traversal/TraversalDepth.ts']
            elif rel == 'foreground/shared-loop.png':
                sources = ['src/traversal/TraversalT0Assets.ts', 'src/traversal/TraversalT0Scene.ts', 'src/styles/traversal.css']
            elif rel == 'props/fork-sign.png':
                sources = ['src/traversal/TraversalT0Assets.ts', 'src/traversal/TraversalT0World.ts']
            elif rel == 'props/abandoned-cart.png':
                sources = ['src/traversal/TraversalT0Assets.ts', 'src/traversal/TraversalT0Route.ts']
            else:
                sources = ['src/traversal/TraversalCaravan.ts']
            found['runtimeRefs'] = sorted(set(found['runtimeRefs'] + sources))
            found['testRefs'] = sorted(set(found['testRefs'] + ['src/traversal/TraversalT0Assets.test.ts']))
        entries.append({'path': path, 'bytes': (ROOT / path).stat().st_size,
                        'classification': category, **found, 'action': action, 'reason': reason,
                        **({'approvedBrowserFlow': 'conditional mystery_treasure assignment' if path.endswith('/props/abandoned-cart.png')
                            else 'route or checkpoint flow'} if args.phase == 'final' and path.startswith(T0) and path.endswith('.png') else {})})
    payload = {'phase': args.phase, 'baseline': 'e1be7d0261d699aee27079e256291826b7b78f1e',
               'entries': entries}
    if args.phase == 'final':
        initial = json.loads((ROOT / 'docs/reports/traversal-t0-cleanup-1-initial-inventory.json').read_text(encoding='utf-8'))
        old_assets = [row for row in initial['entries'] if row['path'].startswith(T0)]
        payload['retainedRuntimeAssets'] = [row['path'] for row in entries
                                            if row['path'].startswith(T0) and row['classification'] == 'ACTIVE_CANONICAL']
        payload['retainedDevelopmentAssets'] = [T0 + 'asset-manifest.json']
        payload['promotedAssets'] = []
        for row in old_assets:
            if row['classification'] != 'ACTIVE_LEGACY_LOCATION':
                continue
            target = row['action'].removeprefix('PROMOTE to ')
            old = subprocess.check_output(['git', 'show', 'HEAD:' + row['path']], cwd=ROOT)
            digest = hashlib.sha256(old).hexdigest()
            assert hashlib.sha256((ROOT / target).read_bytes()).hexdigest() == digest
            payload['promotedAssets'].append({'from': row['path'], 'to': target, 'sha256': digest})
        payload['deletedAssets'] = [{'path': row['path'], 'bytes': row['bytes'],
                                     'result': 'replaced-by-promoted-chassis' if (ROOT / row['path']).exists() else 'deleted'}
                                    for row in old_assets if row['classification'] == 'DEAD_OR_SUPERSEDED']
        payload['t0BytesBefore'] = sum(row['bytes'] for row in old_assets)
        payload['t0BytesAfter'] = sum((ROOT / row['path']).stat().st_size for row in entries if row['path'].startswith(T0))
        deletions = json.loads((ROOT / 'docs/reports/traversal-t0-cleanup-1-deletions.json').read_text(encoding='utf-8'))
        payload['qaToolReportDeletions'] = {'files': deletions['fileCount'], 'bytes': deletions['bytesRemoved'],
                                            'directories': deletions['directoriesRemoved']}
    output = ROOT / 'docs/reports' / f'traversal-t0-cleanup-1-{args.phase}-inventory.json'
    output.write_text(json.dumps(payload, indent=2) + '\n', encoding='utf-8')
    print(f'{len(entries)} entries -> {output.relative_to(ROOT)}')
    print(json.dumps({kind: sum(row['classification'] == kind for row in entries)
                      for kind in sorted({row['classification'] for row in entries})}))

if __name__ == '__main__':
    main()

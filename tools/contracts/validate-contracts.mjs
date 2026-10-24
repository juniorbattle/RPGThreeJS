import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..', '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const manifest = JSON.parse(read('docs/contracts/contracts.manifest.json'));
const failures = [];
const required = [
  'WORLD_AND_CHARACTERS', 'CAMPAIGN_AND_STATE', 'PRESENTATION_AND_MEDIA',
  'TRAVERSAL', 'COMBAT_AND_VFX', 'UI_AND_ACCESSIBILITY',
  'AUTHORING_AND_QA', 'AUTONOMOUS_WORK_PROTOCOL',
];
const expectedSlots = [
  'camp_departure', 'alaric_audience_arrival', 'bois_clair_arrival',
  'bois_clair_saved', 'bois_clair_sacrificed', 'lion_judgement',
  'serpent_route_ending', 'lion_trial_route_ending',
];
const insideRoot = (path) => {
  const absolute = resolve(root, path);
  return absolute.startsWith(root + sep) && !path.includes('..');
};
if (manifest.schemaVersion !== 1 || manifest.status !== 'LOCKED' || manifest.lockId !== 'PRODUCTION-CONTRACTS-LOCK-1') {
  failures.push('Manifest identity/status is invalid.');
}
if (!insideRoot(manifest.constitution) || !existsSync(resolve(root, manifest.constitution))) {
  failures.push('Constitution path is missing or outside repository.');
} else if (!read(manifest.constitution).includes('Status: **LOCKED**')) {
  failures.push('Constitution is not marked LOCKED.');
}
const ids = new Set();
const paths = new Set();
const index = read('docs/contracts/README.md');
for (const entry of manifest.contracts ?? []) {
  if (ids.has(entry.id) || paths.has(entry.path)) failures.push(`Duplicate contract: ${entry.id}`);
  ids.add(entry.id);
  paths.add(entry.path);
  if (entry.status !== 'LOCKED' || !insideRoot(entry.path) || !existsSync(resolve(root, entry.path))) {
    failures.push(`Invalid contract path/status: ${entry.id}`);
    continue;
  }
  if (!read(entry.path).includes('Status: **LOCKED**')) failures.push(`Missing LOCKED marker: ${entry.id}`);
  if (!index.includes(`(${entry.path.replace('docs/contracts/', '')})`)) failures.push(`Missing README link: ${entry.id}`);
}
for (const id of required) if (!ids.has(id)) failures.push(`Missing required contract: ${id}`);
const media = read('docs/contracts/PRESENTATION_AND_MEDIA.md');
const listedSlots = [...media.matchAll(/^\d+\. `([a-z_]+)`$/gm)].map((match) => match[1]);
if (JSON.stringify(listedSlots) !== JSON.stringify(expectedSlots)) failures.push('Historical cinematic identities are not exactly the eight locked IDs.');
// The retirement policy must be implemented, not merely described by the contract.
const production = JSON.parse(read('tools/cinematics/specs/production_presentation_modes.json'));
if (production.retirementDecision !== 'OD-2026-10-24-A'
  || JSON.stringify(production.historicalVideoIds) !== JSON.stringify(expectedSlots)
  || JSON.stringify(production.approvedVideoIds) !== '[]') {
  failures.push('Production retirement requires the eight historical identities and zero approved videos.');
}
const runtimeManifest = JSON.parse(read('public/assets/cinematics/manifest.json'));
if (runtimeManifest.version !== 1 || JSON.stringify(runtimeManifest.cinematics) !== '[]') {
  failures.push('Production cinematic manifest must have zero descriptors.');
}
const generated = read('src/cinematics/FinalPresentationRegistry.generated.ts')
  .match(/Object\.freeze\(([\s\S]+) as const satisfies readonly ResolvedPresentationBeat\[\]\);/);
const beats = generated ? JSON.parse(generated[1]) : [];
if (beats.length !== 147 || new Set(beats.map(beat => beat.beatId)).size !== 147) failures.push('Historical 147 beat identities must remain unique.');
for (const beat of beats) {
  if (['CINEMATIC_VIDEO', 'CINEMATIC_HOLD'].includes(beat.mode)
    || beat.cinematicId || beat.holdSourceCinematicId
    || [beat.sourceAsset, ...beat.preloadRefs].some(ref => /\.(mp4|webm)(?:$|[?#])/i.test(ref ?? ''))) {
    failures.push(`Retired video/hold/preload remains: ${beat.beatId}`);
  }
}
const videoFiles = directory => readdirSync(resolve(root, directory), { withFileTypes: true }).flatMap(entry => (
  entry.isDirectory() ? videoFiles(`${directory}/${entry.name}`) : /\.(mp4|webm)$/i.test(entry.name) ? [`${directory}/${entry.name}`] : []
));
if (videoFiles('public').length) failures.push('Video files remain in shipped public assets.');
const archive = JSON.parse(read('tools/cinematics/archive/production-videos-2026-10-24/retirement.json'));
if (JSON.stringify(archive.inventory.filter(entry => entry.id).map(entry => entry.id)) !== JSON.stringify(expectedSlots)) {
  failures.push('Retired media archive must preserve all eight identities.');
}
for (const entry of archive.inventory) {
  if (!insideRoot(entry.archive) || !existsSync(resolve(root, entry.archive))
    || createHash('sha256').update(readFileSync(resolve(root, entry.archive))).digest('hex') !== entry.sha256) {
    failures.push(`Retired media archive missing or changed: ${entry.id ?? entry.source}`);
  }
}
if (failures.length) {
  for (const failure of failures) console.error(failure);
  process.exitCode = 1;
} else {
  console.log(`Validated ${manifest.contracts.length} locked contracts, ${listedSlots.length} historical media IDs, zero active videos/holds/preloads/shipped video files, and byte-identical archives.`);
}

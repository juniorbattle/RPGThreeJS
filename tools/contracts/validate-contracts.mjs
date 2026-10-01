import { readFileSync, existsSync } from 'node:fs';
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
if (JSON.stringify(listedSlots) !== JSON.stringify(expectedSlots)) failures.push('Approved cinematic slots are not exactly the eight locked IDs.');
if (failures.length) {
  for (const failure of failures) console.error(failure);
  process.exitCode = 1;
} else {
  console.log(`Validated ${manifest.contracts.length} locked contracts and ${listedSlots.length} video slots.`);
}

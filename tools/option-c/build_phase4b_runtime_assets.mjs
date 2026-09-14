import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, relative, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..', '..');
const pilotRoot = join(repoRoot, 'docs', 'art-direction', 'option-c', 'phase4-pilot');
const runtimeRoot = join(repoRoot, 'public', 'assets', 'dev', 'option-c', 'phase4b');

const assets = [
  ['environment/forest-road-travel-dev.png', 'environment/forest-road-travel.png', 'TRAVEL'],
  ['environment/forest-road-tableau-dev.png', 'environment/forest-road-tableau.png', 'TABLEAU'],
  ['environment/forest-road-strategic-dev.png', 'environment/forest-road-strategic.png', 'STRATEGIC'],
  ['environment/forest-road-combat-stage-dev.png', 'environment/forest-road-combat-stage.png', 'COMBAT_STAGE'],
  ...['idle', 'dash', 'attack', 'skill'].flatMap((state) => {
    const acceptedFolder = state === 'idle' ? 'processed' : 'processed-retry';
    return Array.from({ length: 8 }, (_, index) => [
      `animations/${state}/${acceptedFolder}/kestrel-${state}-${index + 1}.png`,
      `kestrel/${state}/frame-${String(index + 1).padStart(2, '0')}.png`,
      `KESTREL_${state.toUpperCase()}`,
    ]);
  }),
];

function pngDimensions(buffer) {
  if (buffer.toString('ascii', 1, 4) !== 'PNG') throw new Error('Expected PNG input.');
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

await mkdir(runtimeRoot, { recursive: true });
const inventory = [];
for (const [sourceRelative, outputRelative, purpose] of assets) {
  const source = join(pilotRoot, sourceRelative);
  const output = join(runtimeRoot, outputRelative);
  await mkdir(dirname(output), { recursive: true });
  await copyFile(source, output);
  const bytes = await readFile(output);
  inventory.push({
    source: relative(repoRoot, source).replaceAll('\\', '/'),
    runtimeDerivative: relative(repoRoot, output).replaceAll('\\', '/'),
    purpose,
    dimensions: pngDimensions(bytes),
    bytes: bytes.byteLength,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    status: 'RUNTIME_PROOF_CANDIDATE',
    processing: 'BYTE_IDENTICAL_COPY',
  });
}

await writeFile(
  join(runtimeRoot, 'runtime-assets.json'),
  `${JSON.stringify({ schemaVersion: 1, sourcePilot: 'APPROVED_DEV_PILOT', assets: inventory }, null, 2)}\n`,
  'utf8',
);

console.log(`Phase 4B runtime derivatives: ${inventory.length} assets copied to ${relative(repoRoot, runtimeRoot)}.`);

import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';

const REPO_ROOT = resolve(import.meta.dirname, '..', '..');
const SOURCE_ROOT = join(
  REPO_ROOT,
  'public',
  'assets',
  'dev',
  'option-c',
  'phase4b',
  'environment',
  'demo-environment-pack-v1',
);
const PRODUCTION_RELATIVE_ROOT = 'public/assets/generated/lion-phase/environments/demo-environment-pack-v1';
const PRODUCTION_ROOT = join(REPO_ROOT, ...PRODUCTION_RELATIVE_ROOT.split('/'));
const PRODUCTION_PUBLIC_ROOT = '/assets/generated/lion-phase/environments/demo-environment-pack-v1/';
const RUNTIME_DATA_PATH = join(
  REPO_ROOT,
  'src',
  'render',
  'data',
  'demo-environment-pack-v1.production.json',
);
const CHECK_ONLY = process.argv.includes('--check');

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function toPosix(value) {
  return value.split(sep).join('/');
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function sha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

async function writeDeterministicJson(path, value) {
  const expected = `${JSON.stringify(value, null, 2)}\n`;
  if (CHECK_ONLY) {
    const actual = await readFile(path, 'utf8');
    invariant(actual === expected, `Generated JSON drift: ${relative(REPO_ROOT, path)}`);
    return;
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, expected, 'utf8');
}

const approvedManifest = await readJson(join(SOURCE_ROOT, 'manifest.json'));
const approvedMap = await readJson(join(SOURCE_ROOT, 'beat-background-map.json'));
const approvedCensus = await readJson(join(SOURCE_ROOT, 'demo-environment-census.json'));

invariant(approvedManifest.packId === 'demo-environment-pack-v1', 'Unexpected source pack id');
invariant(approvedManifest.assets.length === 44, `Expected 44 approved assets, got ${approvedManifest.assets.length}`);

const mappings = approvedMap.mappings;
const mappingEntries = Object.entries(mappings);
invariant(mappingEntries.length === 165, `Expected 165 mapped contexts, got ${mappingEntries.length}`);

const sourcePrefix = `${toPosix(relative(REPO_ROOT, SOURCE_ROOT))}/`;
const assets = [];
const assetsById = new Map();

for (const approved of approvedManifest.assets) {
  const sourceRelative = approved.runtimeCandidatePath.replaceAll('\\', '/');
  invariant(sourceRelative.startsWith(sourcePrefix), `Asset escapes approved pack: ${sourceRelative}`);
  const packRelativePath = sourceRelative.slice(sourcePrefix.length);
  const sourcePath = join(SOURCE_ROOT, ...packRelativePath.split('/'));
  const productionPath = join(PRODUCTION_ROOT, ...packRelativePath.split('/'));
  const currentHash = await sha256(sourcePath);
  invariant(currentHash === approved.sha256, `Approved hash mismatch: ${approved.assetId}`);

  if (CHECK_ONLY) {
    invariant(await sha256(productionPath) === approved.sha256, `Production hash mismatch: ${approved.assetId}`);
  } else {
    await mkdir(dirname(productionPath), { recursive: true });
    await copyFile(sourcePath, productionPath);
    invariant(await sha256(productionPath) === approved.sha256, `Copy hash mismatch: ${approved.assetId}`);
  }

  const record = {
    assetId: approved.assetId,
    sourceDevPath: sourceRelative,
    productionPath: `${PRODUCTION_RELATIVE_ROOT}/${packRelativePath}`,
    publicUrl: `${PRODUCTION_PUBLIC_ROOT}${packRelativePath}`,
    surfaceRole: approved.surfaceRole,
    visualFamily: approved.visualFamily,
    sha256: approved.sha256,
    width: approved.width,
    height: approved.height,
  };
  invariant(!assetsById.has(record.assetId), `Duplicate asset id: ${record.assetId}`);
  assets.push(record);
  assetsById.set(record.assetId, record);
}

for (const [contextId, mapping] of mappingEntries) {
  invariant(mapping.plates.length > 0, `Unmapped context: ${contextId}`);
  for (const plate of mapping.plates) {
    const asset = assetsById.get(plate.assetId);
    invariant(asset, `Unknown asset ${plate.assetId} in ${contextId}`);
    invariant(
      asset.publicUrl.endsWith(plate.runtimeCandidatePath),
      `Path mismatch for ${plate.assetId} in ${contextId}`,
    );
  }
}

const visualFamilies = [...new Set(assets.map((asset) => asset.visualFamily))].sort();
invariant(visualFamilies.length === 13, `Expected 13 visual families, got ${visualFamilies.length}`);

const promotionManifest = {
  schemaVersion: 1,
  packId: approvedManifest.packId,
  status: 'PRODUCTION_APPROVED',
  promotedAt: '2026-09-16',
  sourcePackRoot: `${sourcePrefix}`,
  productionPackRoot: `${PRODUCTION_RELATIVE_ROOT}/`,
  productionPublicRoot: PRODUCTION_PUBLIC_ROOT,
  summary: {
    visualFamilyCount: visualFamilies.length,
    approvedAssetCount: assets.length,
    promotedAssetCount: assets.length,
    totalContexts: mappingEntries.length,
    mappedContexts: mappingEntries.length,
    unmappedContexts: 0,
    fallbackContexts: 0,
    byteIdenticalAssets: assets.length,
  },
  visualFamilies,
  assets,
  mappings,
};

const productionMap = {
  ...approvedMap,
  packRoot: `${PRODUCTION_RELATIVE_ROOT}/`,
  status: 'PRODUCTION_APPROVED',
};

await writeDeterministicJson(join(PRODUCTION_ROOT, 'promotion-manifest.json'), promotionManifest);
await writeDeterministicJson(join(PRODUCTION_ROOT, 'beat-background-map.json'), productionMap);
await writeDeterministicJson(join(PRODUCTION_ROOT, 'approved-source-manifest.json'), approvedManifest);
await writeDeterministicJson(join(PRODUCTION_ROOT, 'demo-environment-census.json'), approvedCensus);
await writeDeterministicJson(RUNTIME_DATA_PATH, promotionManifest);

console.log(JSON.stringify({
  mode: CHECK_ONLY ? 'check' : 'promote',
  status: 'PRODUCTION_APPROVED',
  assets: assets.length,
  byteIdentical: assets.length,
  visualFamilies: visualFamilies.length,
  contexts: mappingEntries.length,
  fallbacks: 0,
}, null, 2));

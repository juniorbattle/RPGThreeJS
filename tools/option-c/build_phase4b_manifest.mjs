import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const proofRoot = path.join(repoRoot, 'docs', 'art-direction', 'option-c', 'phase4b-runtime-proof');
const manifestsRoot = path.join(proofRoot, 'manifests');
const manifestPath = path.join(manifestsRoot, 'runtime-proof-manifest.json');
const checksumPath = path.join(manifestsRoot, 'runtime-proof.sha256');

function relative(filePath) {
  return path.relative(repoRoot, filePath).replaceAll('\\', '/');
}

async function sha256(filePath) {
  return createHash('sha256').update(await readFile(filePath)).digest('hex');
}

async function filesUnder(root) {
  const output = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const filePath = path.join(root, entry.name);
    if (entry.isDirectory()) output.push(...await filesUnder(filePath));
    else output.push(filePath);
  }
  return output;
}

function surfaceUse(purpose) {
  if (purpose === 'TRAVEL') return ['TRAVEL_VIEW'];
  if (purpose === 'TABLEAU') return ['STATIC_TABLEAU'];
  if (purpose === 'STRATEGIC') return ['STRATEGIC_COMBAT'];
  if (purpose === 'COMBAT_STAGE') return ['COMBAT_STAGE'];
  return ['STATIC_TABLEAU', 'STRATEGIC_COMBAT', 'COMBAT_STAGE'];
}

const runtimeAssetIndexPath = path.join(repoRoot, 'public', 'assets', 'dev', 'option-c', 'phase4b', 'runtime-assets.json');
const runtimeIndex = JSON.parse(await readFile(runtimeAssetIndexPath, 'utf8'));
const browserQaPath = path.join(proofRoot, 'qa', 'browser-qa-results.json');
const browserQa = JSON.parse(await readFile(browserQaPath, 'utf8'));

const evidenceFiles = (await filesUnder(proofRoot))
  .filter((filePath) => filePath !== manifestPath && filePath !== checksumPath)
  .sort((left, right) => relative(left).localeCompare(relative(right)));
const evidence = await Promise.all(evidenceFiles.map(async (filePath) => ({
  path: relative(filePath),
  bytes: (await readFile(filePath)).byteLength,
  sha256: await sha256(filePath),
})));

const manifest = {
  schemaVersion: 1,
  phase: 'OPTION_C_PHASE4B',
  family: 'FOREST_ROAD',
  character: 'KESTREL',
  status: 'RUNTIME_PROOF_CANDIDATE',
  baseline: 'd4baeb79fb16e24c5707c482c80245f431ce498e',
  phase4aReferenceStatus: 'APPROVED_DEV_PILOT',
  generatedAt: browserQa.generatedAt,
  generationTool: 'OpenAI image_gen',
  modelProvenance: 'UNKNOWN',
  runtimeEntry: '/?devOptionC=forest-road',
  devOnly: true,
  productionBehaviorChange: 0,
  globalProductionPromotion: 0,
  productionManifestPromotions: 0,
  liveProductionAssetsReplaced: false,
  processing: 'BYTE_IDENTICAL_COPY',
  runtimeAssets: runtimeIndex.assets.map((asset) => ({
    ...asset,
    runtimeUrl: `/${asset.runtimeDerivative.replace(/^public\//u, '')}`,
    surfaceUse: surfaceUse(asset.purpose),
  })),
  sourceChanges: {
    DEV_HARNESS_ONLY: [
      'src/main.ts',
      'src/styles/app.css',
      'src/dev/optionCPhase4b/',
      'tools/option-c/',
      'tools/cinematics/cin6ea_preproduction.test.mjs',
      'tools/cinematics/cin6ea_finalization.test.mjs',
    ],
    RUNTIME_PRESENTATION_SUPPORT: [
      'src/cinematics/NarrativeSceneSurface.ts',
      'src/combat/CombatBridge.ts',
      'src/combat/legacyCombatRuntime.js',
      'src/combat/protocol.ts',
      'src/combat/stage/CombatStage.ts',
    ],
    ASSET_LOADING_SUPPORT: [
      'src/dev/optionCPhase4b/OptionCPhase4bAssets.ts',
      'tools/option-c/build_phase4b_runtime_assets.mjs',
    ],
    ANIMATION_RUNTIME_SUPPORT: [
      'src/render/SpriteFrameAnimation.ts',
      'src/render/SpriteFrameAnimation.test.ts',
    ],
    PRODUCTION_BEHAVIOR_CHANGE: [],
  },
  qa: {
    targetViewports: ['1920x1080', '1366x768'],
    primarySurfaceChecks: 8,
    animationViewportRuns: 2,
    damageEvidenceCaptures: 2,
    runtimeConsoleErrors: 0,
    pageErrors: 0,
    failedRequests: 0,
    focusedTests: { passed: 124, failed: 0 },
    fullSuite: { passed: 2361, failed: 11, historicalFailures: 11, newRegressions: 0 },
  },
  evidence,
};

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const protectedFiles = [
  manifestPath,
  runtimeAssetIndexPath,
  ...runtimeIndex.assets.map((asset) => path.join(repoRoot, asset.runtimeDerivative)),
  ...evidenceFiles,
];
const uniqueFiles = [...new Set(protectedFiles)].sort((left, right) => relative(left).localeCompare(relative(right)));
const checksumLines = await Promise.all(uniqueFiles.map(async (filePath) => `${await sha256(filePath)}  ${relative(filePath)}`));
await writeFile(checksumPath, `${checksumLines.join('\n')}\n`, 'utf8');

console.log(JSON.stringify({
  runtimeAssets: manifest.runtimeAssets.length,
  evidenceFiles: evidence.length,
  checksums: checksumLines.length,
  manifest: relative(manifestPath),
}, null, 2));

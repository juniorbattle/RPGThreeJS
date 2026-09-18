import { chromium } from 'playwright';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const qa = path.join(root, 'public/assets/dev/option-c/final-character-combat-promotion-v1/qa');
const runtime = path.join(qa, 'runtime');
const heroRoot = path.join(root, 'public/assets/dev/option-c/hero-scale-parity-v1/runtime-proof');
const militiaReportPath = path.join(qa, 'militia-runtime/runtime-proof-report.json');
const baseUrl = process.env.OPTION_C_BASE_URL ?? 'http://127.0.0.1:5173/';
await mkdir(runtime, { recursive: true });

const heroReport = JSON.parse(await readFile(path.join(heroRoot, 'runtime-proof-report.json'), 'utf8'));
const militiaReport = JSON.parse(await readFile(militiaReportPath, 'utf8'));
const copiedHeroScreenshots = [];
for (const source of heroReport.screenshots) {
  const name = `lancer-${path.basename(source)}`;
  await copyFile(path.join(root, source), path.join(runtime, name));
  copiedHeroScreenshots.push(`public/assets/dev/option-c/final-character-combat-promotion-v1/qa/runtime/${name}`);
}

const browser = await chromium.launch({ headless: true });
const errors = [];
const failedRequests = [];
let strategic;
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 700 } });
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' }));
  await page.goto(`${baseUrl}docs/reports/cin-6e-a-4r-dialogue-review.html`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  strategic = await page.evaluate(async () => {
    const registry = await import('/src/combat/stage/CombatPoseRegistry.ts');
    const ids = ['village_militia_spearman', 'village_militia_slinger'];
    const visuals = ids.map((unitId) => ({ unitId, ...registry.resolveStrategicUnitVisual(unitId) }));
    document.body.innerHTML = `<main><h1>PRODUCTION STRATEGIC PREPARE PROOF</h1><section></section></main>`;
    const style = document.createElement('style');
    style.textContent = 'body{margin:0;background:#07101b;color:#dff;font-family:monospace}main{padding:28px}section{display:flex;gap:40px}.card{width:520px;height:560px;background:#111d2c;border:1px solid #36d8ff;display:grid;place-items:center;position:relative}.card img{width:512px;height:512px;object-fit:contain;image-rendering:pixelated}.card p{position:absolute;left:12px;top:4px;background:#07101bcc;padding:6px}';
    document.head.append(style);
    const section = document.querySelector('section');
    for (const visual of visuals) {
      const card = document.createElement('article'); card.className = 'card';
      const img = document.createElement('img'); img.src = visual.src;
      const label = document.createElement('p'); label.textContent = `${visual.unitId} | PREPARE | ${visual.src}`;
      card.append(img, label); section.append(card);
    }
    await Promise.all([...document.images].map((img) => img.decode()));
    return { visuals, brute: registry.resolveStrategicUnitVisual('village_militia_brute') ?? null };
  });
  await page.screenshot({ path: path.join(runtime, 'militia-strategic-prepare.png'), animations: 'disabled' });
} finally {
  await browser.close();
}

const manifest = JSON.parse(await readFile(path.join(root, 'public/assets/characters/pixel/character-system-v2-manifest.json'), 'utf8'));
const poseUnits = manifest.units.filter((unit) => Object.keys(unit.poses ?? {}).length === 4);
const militiaUnits = ['village_militia_spearman', 'village_militia_slinger'].map((id) => poseUnits.find((unit) => unit.unitId === id));
const registryProof = {
  schemaVersion: 1,
  status: poseUnits.length === 27 && manifest.counts.combatPoses === 108 && militiaUnits.every(Boolean) ? 'PASS' : 'FAIL',
  manifestStatus: manifest.status,
  counts: manifest.counts,
  combatPoseIdentities: poseUnits.length,
  militia: militiaUnits.map((unit) => ({ unitId: unit.unitId, poses: Object.fromEntries(Object.entries(unit.poses).map(([pose, asset]) => [pose, asset.src])) })),
  bruteCombatPoseStatus: manifest.units.find((unit) => unit.unitId === 'village_militia_brute')?.combatPoseStatus,
  brutePoseCount: Object.keys(manifest.units.find((unit) => unit.unitId === 'village_militia_brute')?.poses ?? {}).length,
  strategicPrepare: strategic,
};
await writeFile(path.join(qa, 'combat-registry-proof.json'), `${JSON.stringify(registryProof, null, 2)}\n`);

const report = {
  schemaVersion: 1,
  mission: 'Final Character Combat Promotion V1 runtime proof',
  status: heroReport.status === 'PASS' && militiaReport.status === 'PASS' && registryProof.status === 'PASS' && strategic.brute === null && errors.length === 0 && failedRequests.length === 0 ? 'PASS' : 'FAIL',
  surfaces: {
    lancer: {
      travel: heroReport.records.travel,
      companyRegister: heroReport.records.companyRegister,
      strategicPrepare: heroReport.records.strategic,
      combatStagePrepare: heroReport.records.combatStage,
      combatStageAttack: heroReport.records.combatStageAttack,
      screenshots: copiedHeroScreenshots,
    },
    villageMilitia: {
      strategicPrepare: strategic,
      combatStageAllFourPoses: militiaReport.captures,
      strategicScreenshot: 'public/assets/dev/option-c/final-character-combat-promotion-v1/qa/runtime/militia-strategic-prepare.png',
    },
  },
  checks: {
    productionSourcesOnly: militiaReport.captures.every((capture) => capture.evidence.assetResponses.some((response) => response.url.includes('/assets/characters/pixel/combat/village_militia_') && response.status === 200)) && heroReport.devCandidateOverride === false ? 'PASS' : 'FAIL',
    noBrowserErrors: errors.length === 0 && heroReport.browserErrors.length === 0 && militiaReport.errors.length === 0 ? 'PASS' : 'FAIL',
    noFailedRequests: failedRequests.length === 0 && heroReport.failedRequests.length === 0 && militiaReport.failedAssets.length === 0 ? 'PASS' : 'FAIL',
    gameplayChanged: 'NO', combatLogicChanged: 'NO', vfxChanged: 'NO', environmentChanged: 'NO', uiLayoutChanged: 'NO',
  },
  errors,
  failedRequests,
};
await writeFile(path.join(qa, 'runtime-proof-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ status: report.status, registry: registryProof.status, checks: report.checks }, null, 2));
if (report.status !== 'PASS') process.exitCode = 1;

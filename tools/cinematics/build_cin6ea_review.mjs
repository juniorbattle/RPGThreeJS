#!/usr/bin/env node
/** Build the local CIN-6E-A.1 image, A.2 dynamic gate and A.3 Pilot E regate review. */

import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = resolve(ROOT, 'tmp/cinematics/cin6ea/review');
const SPEC_PATH = resolve(ROOT, 'tools/cinematics/specs/cin6ea_image_gate_review.json');
const DYNAMIC_PATH = resolve(ROOT, 'tools/cinematics/specs/cin6ea2_operator_selections.json');
const REGATE_PATH = resolve(ROOT, 'tools/cinematics/specs/cin6ea3_pilot_e_regate.json');
const CAMPAIGN_CENSUS_PATH = resolve(ROOT, 'tools/cinematics/specs/campaign_cinematic_census.json');
const ROOT_FROM_REVIEW = '../../../../';
const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const href = (path) => `${ROOT_FROM_REVIEW}${path.replaceAll('\\', '/')}`;
const { characterAssetPaths } = JSON.parse(await readFile(CAMPAIGN_CENSUS_PATH, 'utf8'));

const characterNames = {
  alaric: 'Alaric',
  alistair: 'Alistair',
  cedric: 'Cedric',
  elara: 'Elara',
  kestrel: 'Kestrel',
  maelor: 'Maelor',
  marian: 'Marian',
  sage_seraphine: 'Sage Seraphine',
  villageoise: 'Villageoise de Bois-Clair',
};

function statusClass(status) {
  if (status.includes('REJECTED')) return 'reject';
  if (status.includes('PENDING_OPERATOR')) return 'pending';
  return 'pass';
}

function characterReference(characterId) {
  const path = characterAssetPaths[characterId];
  if (!path) throw new Error(`Missing canonical campaign asset path for ${characterId}.`);
  const relativePath = path.replace('public/assets/characters/pixel/', '');
  return `<figure class="reference"><a href="${href(path)}"><img loading="lazy" src="${href(path)}" alt="Canonical full sprite for ${escapeHtml(characterNames[characterId] ?? characterId)}"></a><figcaption>${escapeHtml(characterNames[characterId] ?? characterId)}<br><code>${escapeHtml(relativePath)}</code></figcaption></figure>`;
}

function assetCard(asset) {
  const refs = asset.characters.length
    ? `<div class="references">${asset.characters.map(characterReference).join('')}</div>`
    : '<p class="no-cast">Character-free generated layer; character identity is assessed in its runtime composite.</p>';
  return `<article class="asset-card ${statusClass(asset.status)}">
    <header><div><p class="kind">${escapeHtml(asset.kind)}</p><h3>${escapeHtml(asset.id)}</h3></div><span class="status">${escapeHtml(asset.status)}</span></header>
    <a class="candidate-link" href="${href(asset.image)}"><img class="candidate" loading="lazy" src="${href(asset.image)}" alt="${escapeHtml(asset.id)}"></a>
    <p class="reason">${escapeHtml(asset.reason)}</p>
    ${refs}
  </article>`;
}

function dynamicCard(source, verdict) {
  const selectedFrames = source.dynamicResult.analysisPath.replace(/analysis\.json$/u, 'selected_frames.png');
  const uniformStrip = source.dynamicResult.analysisPath.replace(/analysis\.json$/u, 'uniform_strip.png');
  const passed = ['AGENT_VIDEO_PASS_PENDING_OPERATOR', 'OPERATOR_APPROVED'].includes(verdict.agentVerdict);
  const characterRows = Object.entries(verdict.characters).map(([id, result]) => `<li><strong>${escapeHtml(characterNames[id] ?? id)}:</strong> ${escapeHtml(result.verdict)} — ${escapeHtml(result.evidence)}</li>`).join('');
  return `<article class="dynamic-card ${passed ? 'pass' : 'reject'}">
    <header><div><p class="kind">H3 CONTINUOUS SHOT · ATTEMPT ${verdict.attempt}</p><h3>PILOT ${escapeHtml(source.pilotId)}</h3></div><div class="status-stack"><span class="status source">OPERATOR_SOURCE_APPROVED</span><span class="status">${escapeHtml(verdict.agentVerdict)}</span></div></header>
    <div class="dynamic-grid">
      <figure><a href="${href(source.sourcePath)}"><img src="${href(source.sourcePath)}" alt="Pilot ${escapeHtml(source.pilotId)} source keyframe"></a><figcaption>Source keyframe · SHA ${escapeHtml(source.sourceSha256.slice(0, 12))}</figcaption></figure>
      <figure><video controls preload="metadata" poster="${href(source.dynamicResult.finalFramePath)}"><source src="${href(source.dynamicResult.masterVideoPath)}" type="video/mp4"></video><figcaption>H3 master · 1920×1080 · 24 fps · 5.000 s · silent</figcaption></figure>
      <figure class="wide"><a href="${href(selectedFrames)}"><img src="${href(selectedFrames)}" alt="Representative frames for Pilot ${escapeHtml(source.pilotId)}"></a><figcaption>Representative temporal frames</figcaption></figure>
      <figure class="wide"><a href="${href(uniformStrip)}"><img src="${href(uniformStrip)}" alt="Uniform frame strip for Pilot ${escapeHtml(source.pilotId)}"></a><figcaption>Uniform 12-frame strip</figcaption></figure>
      <figure><a href="${href(source.dynamicResult.finalFramePath)}"><img src="${href(source.dynamicResult.finalFramePath)}" alt="Exact final frame for Pilot ${escapeHtml(source.pilotId)}"></a><figcaption>Exact final decoded frame · SHA ${escapeHtml(source.dynamicResult.finalFrameSha256.slice(0, 12))}</figcaption></figure>
      <div class="diagnostics"><p><strong>Cut candidates:</strong> ${verdict.cutAnalysis.CUT_CANDIDATES.length}</p><p><strong>Confirmed cuts:</strong> ${verdict.cutAnalysis.CONFIRMED_CUTS.length}</p><p><strong>Internal cut count:</strong> ${verdict.cutAnalysis.INTERNAL_CUT_COUNT}</p><p><strong>World resets:</strong> ${verdict.spatialContinuity.WORLD_RESET}</p><p><strong>Spatial resets:</strong> ${verdict.spatialContinuity.SPATIAL_RESET}</p><p><strong>HOLD:</strong> ${escapeHtml(verdict.finalFrame.FINAL_FRAME_HOLD_SAFE)}</p></div>
    </div>
    <div class="references">${source.requiredCast.map(characterReference).join('')}</div>
    <ul class="continuity">${characterRows}</ul>
    ${verdict.rejectionReason ? `<p class="rejection"><strong>REJECTED:</strong> ${escapeHtml(verdict.rejectionReason)}</p>` : `<p class="acceptance">${verdict.agentVerdict === 'OPERATOR_APPROVED' ? 'OPERATOR APPROVED.' : 'AGENT VIDEO PASS — operator visual review remains required.'}</p>`}
  </article>`;
}

async function main() {
  const review = JSON.parse(await readFile(SPEC_PATH, 'utf8'));
  const dynamic = JSON.parse(await readFile(DYNAMIC_PATH, 'utf8'));
  const regate = JSON.parse(await readFile(REGATE_PATH, 'utf8'));
  const dynamicAttempts = await Promise.all(dynamic.selectedH3Sources.map(async (source) => ({
    source,
    verdict: {
      ...JSON.parse(await readFile(resolve(ROOT, source.dynamicResult.verdictPath), 'utf8')),
      agentVerdict: source.dynamicResult.agentVerdict,
    },
  })));
  const regateSource = {
    pilotId: 'E-C',
    sourcePath: regate.source.path,
    sourceSha256: regate.source.sha256,
    requiredCast: ['cedric', 'kestrel'],
    dynamicResult: {
      masterVideoPath: regate.h3.masterVideoPath,
      masterVideoSha256: regate.h3.masterVideoSha256,
      finalFramePath: regate.h3.finalFramePath,
      finalFrameSha256: regate.h3.finalFrameSha256,
      analysisPath: regate.h3.analysisPath,
      verdictPath: regate.h3.verdictPath,
    },
  };
  const regateVerdict = {
    ...JSON.parse(await readFile(resolve(ROOT, regate.h3.verdictPath), 'utf8')),
    agentVerdict: regate.decision.PILOT_E,
  };
  const assets = review.pilots.flatMap((pilot) => pilot.assets);
  const summary = assets.reduce((acc, asset) => {
    const key = asset.status.includes('REJECTED') ? 'rejected' : asset.status.includes('PENDING_OPERATOR') ? 'pending' : 'accepted';
    acc[key] += 1;
    return acc;
  }, { accepted: 0, pending: 0, rejected: 0 });
  const pilotSections = review.pilots.map((pilot) => `<section class="pilot"><div class="pilot-title"><span>PILOT ${escapeHtml(pilot.id)}</span><h2>${escapeHtml(pilot.name)}</h2><p>${escapeHtml(pilot.summary)}</p></div><div class="assets">${pilot.assets.map(assetCard).join('')}</div></section>`).join('');
  const dynamicSection = `<section class="dynamic-section"><div class="dynamic-title"><p class="kind">CIN-6E-A.2 · HISTORICAL GATE</p><h2>Selected H3 Continuous-Shot Video Gate</h2><p>C-B and F-A are operator-approved. The rejected E-A attempt is preserved below as diagnostic evidence and is superseded by E-C.</p><div class="gate-summary ${dynamic.dynamicGate.dynamicVideoGate === 'YES' ? 'pass' : 'reject'}"><strong>DYNAMIC_VIDEO_GATE: ${escapeHtml(dynamic.dynamicGate.dynamicVideoGate)}</strong><span>VISUAL_PRODUCTION_LOCK: ${escapeHtml(dynamic.dynamicGate.visualProductionLock)}</span><span>${escapeHtml(dynamic.dynamicGate.note)}</span></div></div>${dynamicAttempts.map(({ source, verdict }) => dynamicCard(source, verdict)).join('')}<article class="continuity-board"><h3>Global same-game continuity</h3><a href="global-continuity-board.png"><img src="global-continuity-board.png" alt="Global same-game continuity board"></a><p><strong>SAME_GAME_VISUAL_IDENTITY: ${escapeHtml(dynamic.dynamicGate.sameGameVisualIdentity)}</strong> — final operator review approved.</p></article></section>`;
  const regateSection = `<section class="dynamic-section"><div class="dynamic-title"><p class="kind">CIN-6E-A.3 · E-ONLY REGATE</p><h2>Kestrel Source Repair + Dynamic Video Gate</h2><p>E-C is operator-approved. This section contains the sole MiniMax-H3 regate attempt and preserves the rejected E-A/E-B evidence below.</p><div class="gate-summary pass"><strong>DYNAMIC_VIDEO_GATE: ${escapeHtml(regate.decision.DYNAMIC_VIDEO_GATE)}</strong><span>VISUAL_PRODUCTION_LOCK: ${escapeHtml(regate.decision.VISUAL_PRODUCTION_LOCK)}</span><span>PILOT_E: ${escapeHtml(regate.decision.PILOT_E)}</span></div></div>${dynamicCard(regateSource, regateVerdict)}<article class="continuity-board"><h3>Mask continuity detail</h3><a href="cin6ea3/pilot-e-mask-continuity.png"><img src="cin6ea3/pilot-e-mask-continuity.png" alt="Cedric and Kestrel mask continuity strip"></a><p>Both canonical masks remain intact from opening through the final review sample. Exact decoded final-frame evidence is included above.</p></article><article class="continuity-board"><h3>Updated global same-game continuity</h3><a href="global-continuity-board.png"><img src="global-continuity-board.png" alt="Global same-game continuity board with E-C"></a><p><strong>AGENT_VISUAL_QA: ${escapeHtml(regate.decision.AGENT_VISUAL_QA)}</strong> · HUMAN_VISUAL_REVIEW: ${escapeHtml(regate.decision.HUMAN_VISUAL_REVIEW)}.</p></article></section>`;
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CIN-6E-A.1 + A.2 + A.3 Operator Review</title><style>
:root{color-scheme:dark;--bg:#080b11;--panel:#111722;--panel2:#0c111a;--line:#344154;--gold:#e2bd76;--text:#f0ede5;--muted:#a9b1bd;--pass:#5ed3a1;--pending:#e6bd67;--reject:#ff7777}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:radial-gradient(circle at 50% 0,#1d283b 0,var(--bg) 42rem);color:var(--text);font:16px/1.5 Segoe UI,Arial,sans-serif}body>header,main,footer{width:min(1760px,95vw);margin:auto}body>header{padding:42px 0 26px;border-bottom:1px solid var(--line)}h1,h2,h3{font-family:Georgia,serif;color:var(--gold);letter-spacing:.025em}h1{font-size:clamp(30px,4vw,58px);margin:0 0 8px}h2{font-size:clamp(24px,3vw,38px);margin:0}.lead{font-size:18px;max-width:1100px}.policy{margin:24px 0 0;padding:18px 22px;background:#0d1420;border:1px solid var(--gold);border-radius:10px}.policy strong{color:var(--gold)}.summary{display:flex;flex-wrap:wrap;gap:12px;margin-top:20px}.badge{padding:8px 12px;border:1px solid var(--line);border-radius:999px;background:#0d131d}.badge.reject{border-color:var(--reject);color:var(--reject)}.badge.pending{border-color:var(--pending);color:var(--pending)}.current-gate{color:var(--pass);font-weight:800}.pilot{padding:42px 0;border-bottom:1px solid #222c3a}.pilot-title{display:grid;grid-template-columns:140px minmax(250px,420px) 1fr;gap:22px;align-items:baseline;margin-bottom:18px}.pilot-title>span{color:var(--gold);font-weight:800;letter-spacing:.16em}.pilot-title p{color:var(--muted);margin:0}.assets{display:grid;grid-template-columns:repeat(auto-fit,minmax(520px,1fr));gap:18px}.asset-card,.dynamic-card,.continuity-board{background:linear-gradient(180deg,var(--panel),var(--panel2));border:1px solid var(--line);border-top:4px solid var(--pass);border-radius:10px;padding:16px;overflow:hidden}.asset-card.pending{border-top-color:var(--pending)}.asset-card.reject,.dynamic-card.reject{border-top-color:var(--reject)}.asset-card>header,.dynamic-card>header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.asset-card h3,.dynamic-card h3{margin:2px 0 10px;font-size:22px}.kind{margin:0;color:var(--muted);font:12px/1.3 Consolas,monospace;letter-spacing:.08em}.status{flex:0 0 auto;max-width:45%;padding:6px 9px;border:1px solid currentColor;border-radius:6px;color:var(--pass);font:700 12px/1.25 Consolas,monospace;text-align:center}.pending .status{color:var(--pending)}.reject .status{color:var(--reject)}.status-stack{display:flex;flex-direction:column;gap:7px;align-items:flex-end}.status.source{color:var(--gold)}.candidate-link{display:block;background:#05070b}.candidate{display:block;width:100%;aspect-ratio:16/9;object-fit:contain;border:1px solid #283448}.reason{min-height:3em}.references{display:flex;gap:12px;overflow-x:auto;padding:12px;background:#090d14;border:1px solid #232e3c}.reference{flex:0 0 150px;margin:0;text-align:center}.reference img{display:block;width:150px;height:180px;object-fit:contain;background:repeating-conic-gradient(#131a24 0 25%,#0c1118 0 50%) 50%/18px 18px;border:1px solid #2b3848}.reference figcaption{font-size:12px;color:var(--muted);margin-top:6px}.reference code{font-size:10px}.no-cast{color:var(--muted);background:#090d14;padding:12px;border:1px solid #232e3c}.dynamic-section{padding:54px 0;border-bottom:1px solid #222c3a}.dynamic-title{margin-bottom:24px}.dynamic-title>p{max-width:980px}.gate-summary{display:flex;flex-wrap:wrap;gap:12px;margin:18px 0;padding:14px 16px;border:1px solid var(--reject);border-radius:8px;background:#1b1015;color:var(--reject)}.gate-summary.pass{border-color:var(--pass);background:#0f211b;color:var(--pass)}.gate-summary span{color:var(--text)}.dynamic-card{margin:20px 0}.dynamic-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:16px 0}.dynamic-grid figure{margin:0;background:#05070b;border:1px solid #283448}.dynamic-grid figure.wide{grid-column:1/-1}.dynamic-grid img,.dynamic-grid video{display:block;width:100%;aspect-ratio:16/9;object-fit:contain}.dynamic-grid figcaption{padding:8px 10px;color:var(--muted);font-size:13px}.diagnostics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-content:center;gap:8px;padding:18px;border:1px solid #283448;background:#090d14}.diagnostics p{margin:0}.continuity{color:var(--muted)}.continuity strong{color:var(--text)}.rejection{padding:14px;border:1px solid var(--reject);background:#241219;color:#ffd0d0}.acceptance{padding:14px;border:1px solid var(--pass);background:#0f211b;color:#bdf7df}.continuity-board{margin-top:24px}.continuity-board img{display:block;width:100%;height:auto}.continuity-board p{color:var(--muted)}footer{padding:38px 0 72px;color:var(--muted)}@media(max-width:820px){.pilot-title{grid-template-columns:1fr}.assets,.dynamic-grid{grid-template-columns:1fr}.dynamic-grid figure.wide{grid-column:auto}.asset-card>header,.dynamic-card>header{display:block}.status-stack{align-items:flex-start}.status{display:inline-block;max-width:100%;margin-bottom:6px}}
</style></head><body><header><h1>CIN-6E-A.1 + A.2 + A.3 Operator Review</h1><p class="lead">Revue visuelle des six pilotes image, de la porte vidéo C/E/F et du regate E-C. Chaque personnage est comparé directement à son sprite canonique <code>full</code>.</p><div class="policy"><strong>Référence absolue:</strong> ${escapeHtml(review.referencePolicy.sourceOfTruth)}<br>${escapeHtml(review.referencePolicy.rule)}<br><span class="current-gate">Pilotes A-F approuvés. C, E-C et F H3 approuvés. Le verrou de production visuelle est levé.</span></div><div class="summary"><span class="badge">${summary.accepted} images acceptées ou conservées</span><span class="badge reject">${summary.rejected} images historiques rejetées</span><span class="badge">C, E-C et F H3 approuvés</span><span class="badge">VISUAL_PRODUCTION_LOCK: YES</span><span class="badge">baseline ${escapeHtml(review.baseline.slice(0, 12))}</span></div></header><main>${regateSection}${dynamicSection}${pilotSections}</main><footer><p>${escapeHtml(review.referencePolicy.staticTableauRule)}</p><p>E-A et E-B restent conservés comme preuves de rejet. E-C est la source et la vidéo approuvées.<br>C et F restent byte-identical. Aucun média de production n'a changé.</p><p>READY_FOR_CIN_6E_B: YES · CIN-6E-B non démarré.</p></footer></body></html>`;
  await mkdir(OUT, { recursive: true });
  await writeFile(resolve(OUT, 'index.html'), html, 'utf8');
  await copyFile(SPEC_PATH, resolve(OUT, 'image_gate_review.json'));
  await copyFile(DYNAMIC_PATH, resolve(OUT, 'dynamic_gate_review.json'));
  await copyFile(REGATE_PATH, resolve(OUT, 'cin6ea3_pilot_e_regate.json'));
  console.log(JSON.stringify({
    viewer: 'tmp/cinematics/cin6ea/review/index.html',
    manifest: 'tmp/cinematics/cin6ea/review/image_gate_review.json',
    pilots: review.pilots.length,
    assets: assets.length,
    summary,
    imageGeneration: review.executionState.imageGeneration,
    videoGeneration: review.executionState.videoGeneration,
    dynamicVideoGate: dynamic.dynamicGate.dynamicVideoGate,
    visualProductionLock: dynamic.dynamicGate.visualProductionLock,
    cin6ea3DynamicVideoGate: regate.decision.DYNAMIC_VIDEO_GATE,
    cin6ea3VisualProductionLock: regate.decision.VISUAL_PRODUCTION_LOCK,
  }, null, 2));
}

await main();

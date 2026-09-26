import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve('docs/reports/combat-shell-ui-kit-adoption-1-browser');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const viewports = [{ width: 1440, height: 810 }, { width: 1366, height: 768 }, { width: 620, height: 780 }, { width: 390, height: 844 }];
const results = [], statusCensus = [], stageCensus = [], errors = [], messages = [];
const stats = (dexterity, magic = 12) => ({ maxHealth: 100, strength: 12, magic, endurance: 10, dexterity, charisma: 12, moveRange: 2 });
const weapon = (id, type, range = 1) => ({ id, name: id, description: '', category: 'weapons', price: 0, icon: '✦', type, damage: 14, range, minRange: 1, accuracyBonus: 0, critBonus: 5 });
const member = (id, name, className, kind, portrait, type, dexterity) => ({ id, name, className, kind, portrait: `/assets/characters/pixel/masters/${portrait}.png`, stats: stats(dexterity), currentHealth: 100, weapons: [weapon(type, type, type === 'longbow' ? 4 : 1)], skills: [], skillUpgrades: {} });
const clan = [
  member('alistair', 'Alistair', 'Chevalier', 'knight', 'alistair', 'greatsword', 34),
  member('kestrel', 'Kestrel', 'Archer', 'archer', 'archer', 'longbow', 25),
  member('marian', 'Marian', 'Mage Blanc', 'cleric', 'white_mage', 'crosier', 22),
  member('morvan', 'Morvan', 'Mage Noir', 'mage', 'dark_mage', 'grimoire', 20),
  member('rogue', "L'Ombre", 'Voleur', 'rogue', 'rogue', 'dagger', 18),
  member('lancer', 'Lancier', 'Lancier', 'knight', 'lancer', 'long_spear', 16),
];
function payload(kind = 'normal', stageQa = false) {
  const boss = kind === 'lion';
  const visuals = { normal: ['wolf', 'forest_badger'], serpent: ['serpent_raider', 'serpent_brute', 'serpent_oracle'], elite: ['serpent_duelist_elite', 'serpent_raider'], creature: ['wolf', 'forest_badger', 'wild_boar'], dragon: ['young_dragon_elite', 'wolf'] };
  return { type: 'rpg-threejs:combat-initialize', config: {
    id: boss ? 'lion_chief' : `combat-shell-${kind}`, sceneId: 'forest_route', objective: boss ? 'Vaincre le Champion du Lion.' : 'Sécuriser le passage.', encounterLabel: boss ? 'Champion du Lion' : 'Passage du Bois Clair', encounterRank: boss ? 'boss' : kind === 'elite' || kind === 'dragon' ? 'elite' : 'normal',
    enemyVisualIds: visuals[kind] ?? [], bossVisualId: boss ? 'lion_champion' : undefined, escortVisualIds: boss && !stageQa ? ['wolf'] : [],
    maxPlayerUnits: 5, isBoss: boss, rewards: { gold: 52, reputation: 2, materials: { red_gem: 3 } },
  }, clan: stageQa ? clan.slice(0, 5) : clan, inventory: { potion: 2 }, preferredUnitIds: ['alistair', 'kestrel', 'marian'], reducedGraphics: true, devQa: true, qaFullAp: false, qaDeployAll: false };
}
async function openCampaign(viewport, kind = 'normal', stageQa = false) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await context.addInitScript(() => { localStorage.setItem('rpg-tutorial-seen', '1'); localStorage.setItem('rpg-boss-tutorial-seen', '1'); });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`${kind} ${viewport.width}: ${error.message}`));
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#030b15}iframe{display:block;width:100vw;height:100dvh;border:0}</style></head><body><iframe id="combat-frame" src="/legacy-combat.html?campaign=1&qa=1${stageQa ? '&stageqa=1' : ''}&reduced=1"></iframe><script>const payload=${JSON.stringify(payload(kind, stageQa))};window.resultMessages=[];addEventListener('message',event=>{if(event.origin!==location.origin)return;if(event.data?.type==='rpg-threejs:combat-ready')document.getElementById('combat-frame').contentWindow.postMessage(payload,location.origin);if(event.data?.type==='rpg-threejs:combat-result')window.resultMessages.push(event.data)});</script></body></html>`;
  await page.route('**/combat-shell-harness', route => route.fulfill({ status: 200, contentType: 'text/html', body: html }));
  await page.goto('http://127.0.0.1:5173/combat-shell-harness', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('#combat-frame')?.contentWindow?.__BOOTED === true, null, { timeout: 60000 });
  const frame = page.frameLocator('#combat-frame');
  await frame.locator('#qa-combat-controls').evaluate(el => { el.style.display = 'none'; });
  return { context, page, frame };
}
async function capture(page, name, viewport, phase) {
  await page.waitForTimeout(180);
  const data = await page.evaluate(() => {
    const doc = document.querySelector('#combat-frame')?.contentDocument ?? document;
    const win = doc.defaultView;
    const box = selector => { const el = doc.querySelector(selector); if (!el || win.getComputedStyle(el).display === 'none') return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom) }; };
    const launch = doc.querySelector('#menu [data-d="start"]');
    const zone = [[0,0],[0,1],[0,2],[0,3],[1,0],[1,1],[1,2],[1,3]].map(([gx,gz]) => win.__qaHelpers?.getCellScreenPosition?.(gx,gz)).filter(Boolean);
    const boxes = { roster: box('#menu.deploy-roster'), preview: box('#panel.deploy-preview'), result: box('.combat-result-card'), action: box('#combat-result-action'), launch: box('#menu [data-d="start"]') };
    const covered = point => [boxes.roster,boxes.preview].some(rect => rect && point.screenX >= rect.x && point.screenX <= rect.right && point.screenY >= rect.y && point.screenY <= rect.bottom);
    return { mode: win.G?.mode, wave: win.G?.wave, deployedCount: win.G?.deployedUnits?.length, deployedIds: win.G?.deployedUnits?.map(unit => unit.campaignId || unit.name), rosterCount: win.G?.rosterDefs?.length, pageLabel: doc.querySelector('.deploy-pages span')?.textContent, selectedId: win.G?.selectedDeployId, launchDisabled: launch?.disabled ?? null, boxes, zoneCellsVisible: zone.filter(point => point.screenX >= 0 && point.screenX < win.innerWidth && point.screenY >= 0 && point.screenY < win.innerHeight && !covered(point)).length,
      documentWidth: doc.documentElement.scrollWidth, documentHeight: doc.documentElement.scrollHeight, viewportWidth: win.innerWidth, viewportHeight: win.innerHeight,
      resultTitle: doc.querySelector('.combat-result-card h1')?.textContent ?? '', rewardText: doc.querySelector('.combat-result__rewards')?.textContent ?? '', unitRows: [...doc.querySelectorAll('.combat-result__unit')].map(row => row.textContent?.trim()),
      status: win.__qaHelpers?.inspectStatusAnchorsForQa?.() ?? [], statusChips: [...doc.querySelectorAll('#panel .status-chip')].map(chip => chip.getAttribute('aria-label')),
      portraitLoaded: [...doc.querySelectorAll('.deploy-card__portrait img,.deploy-preview__portrait img')].every(img => img.complete && img.naturalWidth > 0) };
  });
  const screenshot = `${name}.jpg`;
  await page.screenshot({ path: resolve(output, screenshot), type: 'jpeg', quality: 88 });
  const record = { name, viewport, phase, screenshot, ...data };
  results.push(record);
  if (data.documentWidth > viewport.width + 1 || data.documentHeight > viewport.height + 1) errors.push(`${name}: document overflow ${data.documentWidth}×${data.documentHeight}`);
  if (!data.portraitLoaded) errors.push(`${name}: portrait failed to load`);
  const a = data.boxes.roster, b = data.boxes.preview;
  if (a && b && a.x < b.right - 2 && b.x < a.right - 2 && a.y < b.bottom - 2 && b.y < a.bottom - 2) errors.push(`${name}: roster overlaps preview`);
  if (phase === 'deployment' && data.zoneCellsVisible < 1) errors.push(`${name}: no unobscured deployment cell`);
  if (phase === 'result' && data.boxes.action && (data.boxes.action.bottom > viewport.height || data.boxes.action.y < 0)) errors.push(`${name}: continuation clipped`);
  return record;
}
function statusBy(record, query) { return record.status.find(unit => [unit.name,unit.id,unit.portrait].some(value => String(value).includes(query))); }

for (const viewport of viewports) {
  const { context, page, frame } = await openCampaign(viewport);
  const prefix = `${viewport.width}x${viewport.height}`;
  const empty = await capture(page, `${prefix}-deployment-empty`, viewport, 'deployment');
  if (!empty.launchDisabled) errors.push(`${prefix}: empty launch enabled`);
  await frame.locator('.deploy-card').first().click();
  const selected = await capture(page, `${prefix}-deployment-selected`, viewport, 'deployment');
  if (selected.deployedCount !== 0) errors.push(`${prefix}: selection mutated deployment`);
  const cell = await frame.locator('body').evaluate(() => window.__qaHelpers.getCellScreenPosition(0,0));
  await page.mouse.click(cell.screenX, cell.screenY);
  const partial = await capture(page, `${prefix}-deployment-partial`, viewport, 'deployment');
  if (partial.deployedCount !== 1) errors.push(`${prefix}: manual placement failed`);
  if (viewport.width === 1440) {
    await page.mouse.click(cell.screenX, cell.screenY);
    const removed = await capture(page, `${prefix}-deployment-removed`, viewport, 'deployment');
    if (removed.deployedCount !== 0 || !removed.launchDisabled) errors.push(`${prefix}: removal semantics failed`);
    await page.mouse.click(cell.screenX, cell.screenY);
    const redeployed = await capture(page, `${prefix}-deployment-redeployed`, viewport, 'deployment');
    if (redeployed.deployedCount !== 1) errors.push(`${prefix}: redeployment semantics failed`);
  }
  await frame.locator('[data-d="next"]').click();
  const alternate = await capture(page, `${prefix}-deployment-alternate-page`, viewport, 'deployment');
  if (alternate.pageLabel === '1 / 2') errors.push(`${prefix}: alternate roster page did not advance`);
  await frame.locator('[data-d="prev"]').click();
  await frame.locator('.deploy-card.is-deployed').first().click();
  await capture(page, `${prefix}-deployment-reselected`, viewport, 'deployment');
  await frame.locator('[data-d="auto"]').click();
  const full = await capture(page, `${prefix}-deployment-auto-full`, viewport, 'deployment');
  if (full.deployedCount !== 5 || full.launchDisabled) errors.push(`${prefix}: auto deployment / launch mismatch`);
  if (full.deployedIds?.slice(0,3).join(',') !== 'alistair,kestrel,marian') errors.push(`${prefix}: preferred auto order changed`);
  const fresh = full.status.filter(unit => unit.team === 'player');
  if (fresh.some(unit => unit.ap !== 0 || unit.hasStartedTurn || unit.exhausted || unit.visibleGapPx !== null)) errors.push(`${prefix}: false fresh exhaustion`);
  await frame.locator('[data-d="start"]').click();
  await page.waitForFunction(() => document.querySelector('#combat-frame')?.contentWindow?.__qaHelpers?.getGameMode?.() === 'menu', null, { timeout: 30000 });
  const entry = await capture(page, `${prefix}-first-turn-entry`, viewport, 'status');
  const active = entry.status.find(unit => unit.hasStartedTurn && unit.team === 'player');
  if (!active || active.exhausted) errors.push(`${prefix}: first turn entry exhaustion invalid`);
  if (viewport.width === 1440 || viewport.width === 390) {
    const exhausted = await frame.locator('body').evaluate(() => window.__qaHelpers.stageRealExhaustionForQa());
    if (!exhausted.ok || !exhausted.exhausted) errors.push(`${prefix}: post-participation exhaustion staging failed`);
    const after = await capture(page, `${prefix}-real-exhaustion-ess`, viewport, 'status');
    if (!after.status.some(unit => unit.exhausted && unit.visibleGapPx !== null) || !after.statusChips.some(label => label?.includes('Essoufflé'))) errors.push(`${prefix}: world/panel ESS missing`);
    await frame.locator('body').evaluate(() => window.__qaHelpers.showStatusForShellQa(window.G.active.name, 'staggered', 2));
    const broken = await capture(page, `${prefix}-brise-priority`, viewport, 'status');
    if (broken.statusChips.some(label => label?.includes('Essoufflé'))) errors.push(`${prefix}: Brisé failed to override ESS`);
  }
  await context.close();
}

for (const [name, kind, viewport] of [
  ['victory', 'normal', viewports[0]], ['victory-rewards-mobile', 'normal', viewports[3]],
  ['victory-ko', 'normal', viewports[0]], ['defeat', 'normal', viewports[0]], ['defeat-mobile', 'normal', viewports[3]],
]) {
  const { context, page, frame } = await openCampaign(viewport, kind);
  await frame.locator('[data-d="auto"]').click();
  await frame.locator('[data-d="start"]').click();
  await page.waitForFunction(() => document.querySelector('#combat-frame')?.contentWindow?.__qaHelpers?.getGameMode?.() === 'menu', null, { timeout: 30000 });
  if (name === 'victory-ko') await frame.locator('body').evaluate(() => { const u = window.G.deployedUnits[0]; u.alive = false; u.hp = 0; });
  await frame.locator(`[data-qa="${name.startsWith('defeat') ? 'defeat' : 'victory'}"]`).evaluate(button => button.click());
  const result = await capture(page, `${viewport.width}x${viewport.height}-result-${name}`, viewport, 'result');
  if (name.startsWith('victory') && (!result.rewardText.includes('+52') || !result.rewardText.includes('+3') || !result.rewardText.includes('+2'))) errors.push(`${name}: reward truth missing`);
  if (name === 'victory-ko' && !result.unitRows.some(row => row.endsWith('K.O.'))) errors.push('victory-ko: K.O. row missing');
  if (name.startsWith('defeat') && result.rewardText) errors.push(`${name}: defeat shows rewards`);
  await frame.locator('#combat-result-action').evaluate(button => { button.click(); button.click(); });
  const notified = await page.evaluate(() => window.resultMessages);
  messages.push({ name, notified });
  if (notified.length !== 1 || notified[0].victory !== !name.startsWith('defeat')) errors.push(`${name}: result notification was not exactly once with correct truth`);
  await context.close();
}

for (const viewport of [viewports[0], viewports[3]]) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await context.addInitScript(() => { localStorage.setItem('rpg-tutorial-seen', '1'); localStorage.setItem('rpg-boss-tutorial-seen', '1'); });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`wave ${viewport.width}: ${error.message}`));
  await page.goto('http://127.0.0.1:5173/legacy-combat.html?qa=1&reduced=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__BOOTED === true, null, { timeout: 60000 });
  await page.locator('#qa-combat-controls [data-qa="victory"]').evaluate(button => button.click());
  await capture(page, `${viewport.width}x${viewport.height}-result-wave`, viewport, 'result');
  await page.locator('#combat-result-action').click();
  await page.waitForFunction(() => window.G.wave === 2 && document.querySelector('#banner').classList.contains('hidden'), null, { timeout: 30000 });
  await context.close();
}

const censusGroups = [
  ['serpent', ['serpent_raider', 'serpent_brute', 'serpent_oracle']],
  ['elite', ['serpent_duelist_elite']],
  ['creature', ['wolf', 'forest_badger', 'wild_boar']],
  ['dragon', ['young_dragon_elite']],
  ['lion', ['lion_champion', 'wolf']],
];
for (const [kind, identities] of censusGroups) {
  const viewport = viewports[0];
  const { context, page, frame } = await openCampaign(viewport, kind);
  await frame.locator('[data-d="auto"]').click();
  await frame.locator('[data-d="start"]').click();
  await page.waitForFunction(() => document.querySelector('#combat-frame')?.contentWindow?.__qaHelpers?.getGameMode?.() === 'menu', null, { timeout: 30000 });
  for (const identity of identities) {
    const result = await frame.locator('body').evaluate((_body, id) => window.__qaHelpers.showStatusForShellQa(id, 'burn', 2), identity);
    if (!result.ok) errors.push(`${kind}: missing ${identity}`);
  }
  if (kind === 'lion' || kind === 'elite' || kind === 'dragon') {
    const boss = identities[0];
    const intent = await frame.locator('body').evaluate((_body, id) => window.__qaHelpers.showBossIntentForShellQa(id), boss);
    if (!intent.ok) errors.push(`${kind}: intent unavailable`);
  }
  const shot = await capture(page, `1440x810-status-${kind}`, viewport, 'status');
  for (const identity of identities) {
    const unit = statusBy(shot, identity);
    if (unit) {
      statusCensus.push({ kind, identity, screenshot: shot.screenshot, ...unit });
      if (unit.visibleGapPx === null || unit.visibleGapPx < 0 || unit.visibleGapPx > 14 || unit.screenClipped) errors.push(`${kind}: status anchor outlier ${identity} gap=${unit.visibleGapPx}`);
      if (unit.intentCenterY !== null && unit.intentCenterY >= unit.indicatorCenterY - 28) errors.push(`${kind}: intent/status stacking too tight ${identity}`);
    }
    else errors.push(`${kind}: census entry missing ${identity}`);
  }
  if (['dragon', 'elite', 'lion'].includes(kind)) {
    const hero = shot.status.find(unit => unit.name === 'Alistair');
    const large = statusBy(shot, identities[0]);
    const ratio = large?.actorVisibleHeightPx / hero?.actorVisibleHeightPx;
    stageCensus.push({ kind, phase: 'tactical', viewport, ratio, heroHeightPx: hero?.actorVisibleHeightPx, largeHeightPx: large?.actorVisibleHeightPx, screenshot: shot.screenshot });
    if (!Number.isFinite(ratio) || ratio < 1.65) errors.push(`${kind}: tactical large/hero visible height ratio ${ratio}`);
    if (large?.actorTopY < -1 || large?.actorBottomY > viewport.height + 1) errors.push(`${kind}: tactical actor clipped`);
  }
  await context.close();
}

for (const [kind, viewport] of [['dragon', viewports[0]], ['elite', viewports[0]], ['lion', viewports[0]], ['dragon', viewports[3]]]) {
  const { context, page, frame } = await openCampaign(viewport, kind, true);
  await frame.locator('[data-d="auto"]').click();
  await frame.locator('[data-d="start"]').click();
  await page.waitForFunction(() => document.querySelector('#combat-frame')?.contentWindow?.__qaHelpers?.getGameMode?.() === 'menu', null, { timeout: 30000 });
  await frame.locator('body').evaluate(() => { window.G.pinnedUnit = window.G.units.find(unit => unit.name === 'Kestrel'); });
  await frame.locator('[data-pose-qa="hold"]').evaluate(button => button.click());
  await page.waitForFunction(() => document.querySelector('#combat-frame')?.contentWindow?.__qaHelpers?.inspectCombatStagePresenceForQa?.().length === 2, null, { timeout: 30000 });
  await page.waitForTimeout(350);
  const stageActors = await frame.locator('body').evaluate(() => window.__qaHelpers.inspectCombatStagePresenceForQa());
  const stageRatio = stageActors[1]?.height / stageActors[0]?.height;
  const screenshot = `${viewport.width}x${viewport.height}-stage-${kind}.jpg`;
  await page.screenshot({ path: resolve(output, screenshot), type: 'jpeg', quality: 88 });
  stageCensus.push({ kind, phase: 'stage', viewport, ratio: stageRatio, actors: stageActors, screenshot });
  if (!Number.isFinite(stageRatio) || stageRatio < 1.5) errors.push(`${kind} ${viewport.width}: Stage large/hero height ratio ${stageRatio}`);
  if (stageActors.some(actor => actor.clipped)) errors.push(`${kind} ${viewport.width}: Stage actor clipped ${JSON.stringify(stageActors)}`);
  await context.close();
}

const { context: stateContext, page: statePage, frame: stateFrame } = await openCampaign(viewports[0]);
await stateFrame.locator('[data-d="auto"]').click();
await stateFrame.locator('[data-d="start"]').click();
await statePage.waitForFunction(() => document.querySelector('#combat-frame')?.contentWindow?.__qaHelpers?.getGameMode?.() === 'menu', null, { timeout: 30000 });
for (const identity of ['Alistair', 'Kestrel', 'Marian', 'Morvan']) await stateFrame.locator('body').evaluate((_body, id) => window.__qaHelpers.showStatusForShellQa(id, 'burn', 2), identity);
const heroes = await capture(statePage, '1440x810-status-heroes', viewports[0], 'status');
for (const identity of ['Alistair', 'Kestrel', 'Marian', 'Morvan']) {
  const unit = statusBy(heroes, identity);
  if (unit) {
    statusCensus.push({ kind: 'hero', identity, screenshot: heroes.screenshot, ...unit });
    if (unit.visibleGapPx === null || unit.visibleGapPx < 0 || unit.visibleGapPx > 14 || unit.screenClipped) errors.push(`hero: status anchor outlier ${identity} gap=${unit.visibleGapPx}`);
  }
  else errors.push(`hero: census entry missing ${identity}`);
}
await stateFrame.locator('body').evaluate(() => { window.G.active.statuses = {}; });
await stateFrame.locator('body').evaluate(() => window.__qaHelpers.showStatusForShellQa(window.G.active.name, 'regen', 2));
await capture(statePage, '1440x810-status-positive', viewports[0], 'status');
await stateFrame.locator('body').evaluate(() => window.__qaHelpers.showStatusForShellQa(window.G.active.name, 'burn', 2));
await capture(statePage, '1440x810-status-carousel', viewports[0], 'status');
await stateContext.close();

const contactFiles = ['1440x810-status-heroes.jpg', '1440x810-status-serpent.jpg', '1440x810-status-elite.jpg', '1440x810-status-creature.jpg', '1440x810-status-dragon.jpg', '1440x810-status-lion.jpg', '1440x810-status-positive.jpg', '1440x810-status-carousel.jpg', '1440x810-real-exhaustion-ess.jpg'];
const cells = await Promise.all(contactFiles.map(async file => ({ file, image: (await readFile(resolve(output, file))).toString('base64') })));
const sheet = await browser.newPage({ viewport: { width: 1050, height: 720 }, deviceScaleFactor: 1 });
await sheet.setContent(`<html><style>*{box-sizing:border-box}body{margin:0;padding:12px;background:#071522;color:#f4dcaa;font:12px Arial}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}figure{margin:0;border:1px solid #b9955d;padding:5px;background:#102633}figcaption{padding:2px 0 5px}img{display:block;width:100%;height:auto}</style><div class="grid">${cells.map(cell => `<figure><figcaption>${cell.file}</figcaption><img src="data:image/jpeg;base64,${cell.image}"></figure>`).join('')}</div></html>`, { waitUntil: 'load' });
await sheet.screenshot({ path: resolve(output, 'status-anchor-contact-sheet.png'), fullPage: true });
await sheet.close();
await browser.close();
await writeFile(resolve(output, 'browser-qa.json'), JSON.stringify({ baseline: 'a62572f7f0889241f7e5d2ec54735dd43e84b0a5', results, statusCensus, stageCensus, resultMessages: messages, errors }, null, 2) + '\n');
console.log(JSON.stringify({ captures: results.length + stageCensus.filter(entry => entry.phase === 'stage').length, census: statusCensus.length, stageCensus: stageCensus.length, errors, output }, null, 2));
if (errors.length) process.exitCode = 1;

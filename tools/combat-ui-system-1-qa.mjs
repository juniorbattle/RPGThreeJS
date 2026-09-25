import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve(process.env.COMBAT_UI_QA_OUTPUT || 'docs/reports/combat-ui-system-1-browser');
const browser = await chromium.launch({ headless: true });
const results = [];
const errors = [];
const viewports = [{ width: 1440, height: 810 }, { width: 1366, height: 768 }, { width: 620, height: 780 }, { width: 390, height: 844 }]
  .filter(viewport => !process.env.COMBAT_UI_QA_VIEWPORT || String(viewport.width) === process.env.COMBAT_UI_QA_VIEWPORT);
await mkdir(output, { recursive: true });

async function measure(page, name, viewport) {
  const geometry = await page.evaluate(() => {
    const hudDocument = document.querySelector('#combat-frame')?.contentDocument ?? document;
    const hudWindow = hudDocument.defaultView;
    const ids = ['turnbar', 'hint', 'objective', 'log', 'panel', 'menu', 'skillmenu', 'action-preview', 'help', 'settings-btn'];
    const boxes = Object.fromEntries(ids.map(id => {
      const element = hudDocument.getElementById(id);
      if (!element || hudWindow.getComputedStyle(element).display === 'none' || element.classList.contains('hidden')) return [id, null];
      const rect = element.getBoundingClientRect();
      return [id, { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height), right: Math.round(rect.right), bottom: Math.round(rect.bottom) }];
    }));
    return {
      boxes,
      documentWidth: hudDocument.documentElement.scrollWidth,
      documentHeight: hudDocument.documentElement.scrollHeight,
      viewportWidth: hudWindow.innerWidth,
      viewportHeight: hudWindow.innerHeight,
      activeName: hudWindow.__qaHelpers?.getActiveUnitName?.() ?? '',
      mode: hudWindow.__qaHelpers?.getGameMode?.() ?? '',
      selectedAction: hudDocument.querySelector('#menu .ico.is-selected')?.getAttribute('data-a') ?? null,
      actionPreviewText: hudDocument.querySelector('#action-preview')?.textContent?.trim() ?? '',
      skills: [...hudDocument.querySelectorAll('#skillmenu .combat-skill')].map(el => ({ name: el.querySelector('b')?.textContent, cost: el.querySelector('.combat-skill__cost')?.textContent, disabled: el.disabled })),
      skillHovered: Boolean(hudDocument.querySelector('#skillmenu .combat-skill:hover')),
      portrait: hudDocument.querySelector('#panel .du-portrait img')?.getAttribute('src') ?? null,
      portraitLoaded: (() => { const image = hudDocument.querySelector('#panel .du-portrait img'); return image ? image.complete && image.naturalWidth > 0 : null; })(),
      statusCount: hudDocument.querySelectorAll('#panel .status-chip').length,
      objectiveExpanded: Boolean(hudDocument.querySelector('#objective details')?.open),
      statsExpanded: hudDocument.querySelector('#panel .stats-toggle')?.getAttribute('aria-expanded') === 'true',
      activeTurnCount: hudDocument.querySelectorAll('#turnbar .chip.active').length,
      panelScroll: (() => { const panel = hudDocument.getElementById('panel'); return panel ? panel.scrollHeight > panel.clientHeight + 1 : false; })(),
    };
  });
  const filename = `${name}.jpg`;
  await page.screenshot({ path: resolve(output, filename), type: 'jpeg', quality: 90 });
  results.push({ name, viewport, screenshot: filename, ...geometry });
  if (geometry.documentWidth > viewport.width + 1 || geometry.documentHeight > viewport.height + 1) errors.push(`${name}: document overflow ${geometry.documentWidth}×${geometry.documentHeight}`);
  if (geometry.portrait && !geometry.portraitLoaded) errors.push(`${name}: portrait failed to load`);
  if (geometry.mode === 'menu' && geometry.activeTurnCount !== 1) errors.push(`${name}: active turn highlight count ${geometry.activeTurnCount}`);
  if (name.endsWith('-move') && geometry.selectedAction !== 'move') errors.push(`${name}: move selection missing`);
  if (name.endsWith('-enemy-preview') && geometry.selectedAction !== 'attack') errors.push(`${name}: attack selection missing`);
  if (name.endsWith('-ally-preview') && geometry.selectedAction !== 'skill') errors.push(`${name}: skill selection missing`);
  if (name.endsWith('-status') && geometry.statusCount < 1) errors.push(`${name}: status missing`);
  if (name.endsWith('-skill-hover') && !geometry.skillHovered) errors.push(`${name}: skill hover state missing`);
  if (name.endsWith('-skills') && !geometry.skills.some(skill => skill.disabled)) errors.push(`${name}: disabled skill state missing`);
  if (name.endsWith('-skills-enabled') && !geometry.skills.some(skill => !skill.disabled)) errors.push(`${name}: enabled skill state missing`);
  if (name.endsWith('-stats-expanded') && !geometry.statsExpanded) errors.push(`${name}: expanded stats missing`);
  if (name.endsWith('-objective-expanded') && !geometry.objectiveExpanded) errors.push(`${name}: expanded objective missing`);
  if (name.endsWith('-normal') && geometry.objectiveExpanded) errors.push(`${name}: objective should start collapsed`);
  const overlaps = (left, right) => left && right && left.x < right.right - 2 && right.x < left.right - 2 && left.y < right.bottom - 2 && right.y < left.bottom - 2;
  if (overlaps(geometry.boxes.panel, geometry.boxes.menu)) errors.push(`${name}: unit card overlaps action dock`);
  if (overlaps(geometry.boxes.panel, geometry.boxes.skillmenu)) errors.push(`${name}: unit card overlaps skill menu`);
  if (overlaps(geometry.boxes.hint, geometry.boxes.objective)) errors.push(`${name}: active banner overlaps objective`);
  for (const upperHud of ['turnbar', 'hint', 'objective', 'log']) {
    if (overlaps(geometry.boxes['action-preview'], geometry.boxes[upperHud])) errors.push(`${name}: action preview overlaps ${upperHud}`);
  }
  if (geometry.panelScroll && !name.endsWith('-stats-expanded')) errors.push(`${name}: unexpected unit card scrollbar`);
  return geometry;
}

function campaignMessage(isBoss) {
  const stats = (dexterity, magic = 12) => ({ maxHealth: 100, strength: 12, magic, endurance: 10, dexterity, charisma: 12, moveRange: 2 });
  const weapon = (id, type, range) => ({ id, name: id, description: '', category: 'weapons', price: 0, icon: '✦', type, damage: 14, range, minRange: 1, accuracyBonus: 0, critBonus: 5 });
  return {
    type: 'rpg-threejs:combat-initialize',
    config: {
      id: isBoss ? 'lion_chief' : 'combat-ui-qa', sceneId: 'forest_route',
      objective: isBoss ? 'Vaincre le Champion du Lion.' : 'Repousser la meute.',
      encounterLabel: isBoss ? 'Champion du Lion' : 'Meute affamée',
      encounterRank: isBoss ? 'boss' : 'normal', enemyVisualIds: isBoss ? [] : ['wolf', 'forest_badger'],
      bossVisualId: isBoss ? 'lion_champion' : undefined, escortVisualIds: isBoss ? ['wolf'] : [],
      maxPlayerUnits: 3, isBoss, rewards: { gold: 0, reputation: 0, materials: {} },
    },
    clan: [
      { id: 'qa-cleric', name: 'Marian', className: 'Mage Blanc', kind: 'cleric', portrait: '/assets/characters/pixel/masters/white_mage.png', stats: stats(30, 22), currentHealth: 100, weapons: [weapon('Crosier', 'crosier', 1)], skills: ['w_salvation', 'w_purify'], skillUpgrades: {} },
      { id: 'qa-archer', name: 'Kestrel', className: 'Archer', kind: 'archer', portrait: '/assets/characters/pixel/masters/archer.png', stats: stats(20), currentHealth: 90, weapons: [weapon('Arc', 'longbow', 4)], skills: ['a_precise_shot'], skillUpgrades: {} },
    ],
    inventory: { potion: 2, antidote: 1 }, preferredUnitIds: ['qa-cleric', 'qa-archer'], reducedGraphics: true,
    devQa: true, qaFullAp: true, qaDeployAll: false,
  };
}

async function openCampaignQa(page, isBoss) {
  const message = campaignMessage(isBoss);
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#030b15}iframe{display:block;width:100vw;height:100dvh;border:0}</style></head><body><iframe id="combat-frame" src="/legacy-combat.html?campaign=1&qa=1&reduced=1"></iframe><script>const payload=${JSON.stringify(message)};addEventListener('message',event=>{if(event.origin===location.origin&&event.data?.type==='rpg-threejs:combat-ready')document.getElementById('combat-frame').contentWindow.postMessage(payload,location.origin)});</script></body></html>`;
  await page.route('**/combat-ui-system-1-harness', route => route.fulfill({ status: 200, contentType: 'text/html', body: html }));
  await page.goto('http://127.0.0.1:5173/combat-ui-system-1-harness', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('#combat-frame')?.contentWindow?.__BOOTED === true, null, { timeout: 60000 });
  const frame = page.frameLocator('#combat-frame');
  await frame.locator('[data-qa="prepare"]').click();
  await page.waitForFunction(() => document.querySelector('#combat-frame')?.contentWindow?.__qaHelpers?.getGameMode?.() === 'menu', null, { timeout: 60000 });
  await frame.locator('#qa-combat-controls').evaluate(element => { element.style.display = 'none'; });
  await page.waitForTimeout(600);
  return frame;
}

for (const viewport of process.env.COMBAT_UI_QA_CAMPAIGN_ONLY ? [] : viewports) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await context.addInitScript(() => { localStorage.setItem('rpg-tutorial-seen', '1'); localStorage.setItem('rpg-boss-tutorial-seen', '1'); });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`${viewport.width}: ${error.message}`));
  await page.goto('http://127.0.0.1:5173/legacy-combat.html?reduced=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => window.__BOOTED === true, { timeout: 60000 });
  await page.locator('#menu [data-d="auto"]').click();
  await page.locator('#menu [data-d="start"]').click();
  await page.waitForFunction(() => window.__qaHelpers?.getGameMode?.() === 'menu', { timeout: 60000 });
  await page.waitForTimeout(600);
  const prefix = `${viewport.width}x${viewport.height}`;
  await measure(page, `${prefix}-normal`, viewport);
  await page.locator('#objective summary').click();
  await measure(page, `${prefix}-objective-expanded`, viewport);
  await page.locator('#objective summary').click();
  await page.locator('#panel .stats-toggle').click();
  await measure(page, `${prefix}-stats-expanded`, viewport);
  await page.locator('#panel .stats-toggle').click();
  const skill = page.locator('#menu .action-skill');
  if (await skill.isEnabled()) {
    await skill.click();
    await measure(page, `${prefix}-skills`, viewport);
    await page.locator('#skillmenu [data-s="_back"]').click();
  }
  await page.locator('#menu .action-move').click();
  await measure(page, `${prefix}-move`, viewport);
  await page.keyboard.press('Escape');
  const attack = page.locator('#menu .action-attack').first();
  if (await attack.isEnabled()) {
    await attack.click();
    await measure(page, `${prefix}-attack-menu`, viewport);
    await page.locator('#skillmenu [data-ch="_back"]').click();
  }
  await context.close();
}

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await context.addInitScript(() => { localStorage.setItem('rpg-tutorial-seen', '1'); localStorage.setItem('rpg-boss-tutorial-seen', '1'); });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`${viewport.width} campaign: ${error.message}`));
  const frame = await openCampaignQa(page, false);
  const prefix = `${viewport.width}x${viewport.height}-campaign`;
  await measure(page, `${prefix}-normal`, viewport);
  const status = await frame.locator('body').evaluate(() => window.__qaHelpers.showStatusForHudQa('burn', 2));
  if (!status.ok) errors.push(`${prefix}: status QA helper failed`);
  await measure(page, `${prefix}-status`, viewport);
  await frame.locator('#menu .action-skill').click();
  await measure(page, `${prefix}-skills-enabled`, viewport);
  await frame.locator('#skillmenu .combat-skill:not(:disabled)').first().hover();
  await measure(page, `${prefix}-skill-hover`, viewport);
  const allyCells = [[0, 0], [0, 3]];
  if (viewport.width === 620) {
    const placement = await frame.locator('body').evaluate(() => window.__qaHelpers.teleportActiveUnitNextToEnemy());
    if (!placement.ok) errors.push(`${prefix}: ally target QA placement failed ${JSON.stringify(placement)}`);
    else allyCells.unshift([placement.pos.gx, placement.pos.gz]);
  }
  await frame.locator('#skillmenu [data-s="w_salvation"]').click();
  let ally = null;
  const allyAttempts = [];
  for (const [gx, gz] of allyCells) {
    const candidate = await frame.locator('body').evaluate((_element, cell) => window.__qaHelpers.getCellScreenPosition(cell.gx, cell.gz), { gx, gz });
    await page.mouse.move(candidate.screenX, candidate.screenY);
    await page.waitForTimeout(150);
    const preview = frame.locator('#action-preview');
    const visible = await preview.isVisible();
    const target = visible ? await preview.locator('.action-preview__route span').last().textContent() : '';
    allyAttempts.push({ gx, gz, ...candidate, visible, target });
    if (visible && /Marian|Kestrel/.test(target)) { ally = candidate; break; }
  }
  if (!ally) errors.push(`${prefix}: ally preview hidden or target identity missing ${JSON.stringify(allyAttempts)}`);
  await measure(page, `${prefix}-ally-preview`, viewport);
  await page.keyboard.press('Escape');
  await frame.locator('body').evaluate(() => window.__qaHelpers.teleportActiveUnitNextToEnemy());
  await frame.locator('#menu .action-attack').first().click();
  await frame.locator('#skillmenu [data-ch="0"]').click();
  await page.mouse.move(4, Math.round(viewport.height / 2));
  await measure(page, `${prefix}-invalid-target`, viewport);
  const enemy = await frame.locator('body').evaluate(() => window.__qaHelpers.getNearestEnemyScreenPosition());
  const enemyCell = await frame.locator('body').evaluate((_element, cell) => window.__qaHelpers.getCellScreenPosition(cell.gx, cell.gz), enemy);
  await page.mouse.move(enemyCell.screenX, enemyCell.screenY);
  await page.waitForTimeout(150);
  if (!(await frame.locator('#action-preview').isVisible())) errors.push(`${prefix}: enemy preview hidden at ${JSON.stringify(enemyCell)} for ${JSON.stringify(enemy)}`);
  await measure(page, `${prefix}-enemy-preview`, viewport);
  await context.close();

  const bossContext = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await bossContext.addInitScript(() => { localStorage.setItem('rpg-tutorial-seen', '1'); localStorage.setItem('rpg-boss-tutorial-seen', '1'); });
  const bossPage = await bossContext.newPage();
  bossPage.on('pageerror', error => errors.push(`${viewport.width} boss: ${error.message}`));
  await openCampaignQa(bossPage, true);
  await measure(bossPage, `${viewport.width}x${viewport.height}-boss`, viewport);
  await bossContext.close();
}

await browser.close();
await writeFile(resolve(output, 'browser-qa.json'), JSON.stringify({ results, errors }, null, 2) + '\n');
console.log(JSON.stringify({ screenshots: results.length, errors, output }, null, 2));
if (errors.length) process.exitCode = 1;

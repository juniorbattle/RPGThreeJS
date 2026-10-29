// Boots the combat iframe exactly like CombatBridge does (campaign=1 +
// validated postMessage) for a given combat config, then screenshots it.
// usage: node tools/combat-arena/campaign-harness.mjs <combatId> <out.png> [waitMs]
import { chromium } from 'playwright';
const [,, combatId = 'lion_chief', out = 'campaign.png', waitMs = '9000'] = process.argv;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%;background:#000}iframe{border:0;width:100%;height:100%}</style></head><body>
<iframe id="f" src="/legacy-combat.html?campaign=1"></iframe>
<script type="module">
import { combatConfigs } from '/src/game/content.ts';
import { createInitialState } from '/src/game/store.ts';
import { toCombatant } from '/src/game/catalog.ts';
const state = createInitialState();
const config = combatConfigs.get(${JSON.stringify(combatId)});
const message = { type: 'rpg-threejs:combat-initialize', config, clan: state.clan.members.map((u) => toCombatant(u)), inventory: state.inventory.consumables, preferredUnitIds: state.deployment.unitIds, reducedGraphics: false };
addEventListener('message', (e) => {
  if (e.data?.type === 'rpg-threejs:combat-ready') document.getElementById('f').contentWindow.postMessage(message, location.origin);
  if (e.data?.type === 'rpg-threejs:combat-initialized') document.body.dataset.ready = '1';
});
</script></body></html>`;
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });
const logs = [];
page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text()); });
page.on('pageerror', (e) => logs.push('pageerror ' + e.message));
await page.route('**/campaign-harness.html', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: html }));
await page.goto('http://127.0.0.1:5173/campaign-harness.html');
await page.waitForTimeout(+waitMs);
const ready = await page.evaluate(() => document.body.dataset.ready === '1');
await page.screenshot({ path: out });
console.log(JSON.stringify({ combatId, initialized: ready, errors: logs.filter((l) => !/404/.test(l)).slice(0, 8) }));
await browser.close();

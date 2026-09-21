import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const branch = process.argv[2] ?? 'lion-first-trial-combat';
const out = `tools/traversal/qa/world-v1/final-${branch.endsWith('combat') ? 'combat' : 'event'}`;
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1463, height: 823 } });
const errors = [], states = [], captures = new Set();
page.on('pageerror', e => errors.push(String(e)));
await page.goto('http://127.0.0.1:5176/?qa=1&traversal=t0');
const capture = async name => {
  if (captures.has(name)) return;
  captures.add(name);
  await page.screenshot({ path: `${out}/${name}.png` });
  const hide = await page.addStyleTag({ content: '.traversal-world__entities, .traversal-event-panel, .traversal-fork-overlay { visibility: hidden !important }' });
  await page.screenshot({ path: `${out}/${name}-environment.png` });
  await hide.evaluate(e => e.remove());
};
let returned = false;
for (let frame = 0; frame < 800; frame++) {
  await page.waitForTimeout(200);
  const state = await page.evaluate(() => {
    const el = document.querySelector('.traversal-t0');
    return el ? { phase: el.dataset.phase, progress: Number(el.dataset.progress), transition: el.dataset.transition,
      variant: el.dataset.routeVariant, title: el.querySelector('[data-traversal-event-title]')?.textContent } : null;
  });
  if (state && states.at(-1)?.phase !== state.phase) { states.push(state); console.log(state); }
  if (state?.transition) continue;
  if (state?.phase === 'RUNNING') {
    if (state.progress > .23 && state.progress < .28) await capture('ambush-cleared-runtime');
    if (state.progress > .52 && state.progress < .59) await page.locator('[data-traversal-lane="0"]').click();
  }
  if (state?.phase === 'DECISION') {
    const name = state.progress === .09 ? 'merchant-route' : state.progress === .2 ? 'ambush-route'
      : state.progress === .6 ? 'rest-gate' : state.progress === .8 ? 'fork-gate'
      : state.progress === .91 ? `branch-${branch}` : `simple-${state.progress}`;
    await capture(name);
    const skip = page.locator('[data-traversal-skip]:visible');
    if (state.progress === .3 && branch.endsWith('event')) await page.locator('[data-traversal-confirm]').click();
    else if (await skip.count()) await skip.click();
    else await page.locator('[data-traversal-confirm]').click();
    continue;
  }
  if (state?.phase === 'FORK_OVERLAY') {
    await capture('fork-choice');
    await page.locator(`[data-traversal-fork-choice="${branch}"]`).click();
    for (let n = 0; n < 7; n++) {
      states.push(await page.evaluate(() => { const el = document.querySelector('.traversal-t0'); return {
        phase: 'fork-fade', progress: Number(el.dataset.progress), variant: el.dataset.routeVariant,
        opacity: el.style.getPropertyValue('--transition-opacity'), lane: el.dataset.lane }; }));
      await page.waitForTimeout(70);
    }
    continue;
  }
  const dialogueChoice = page.locator('.dialogue__choices button:visible').first();
  if (await dialogueChoice.count()) { await dialogueChoice.click(); continue; }
  const dialogue = page.locator('.dialogue__box:visible');
  if (await dialogue.count()) { await dialogue.click(); continue; }
  const combat = page.frames().find(f => f.url().includes('legacy-combat'));
  if (combat) {
    const tutorialSkip = combat.locator('#tutorial').getByRole('button', { name: 'Passer', exact: true });
    if (await tutorialSkip.isVisible()) { await tutorialSkip.click(); continue; }
    const continueChronicle = combat.getByRole('button', { name: 'Continuer la chronique', exact: true });
    if (await continueChronicle.isVisible()) { await continueChronicle.click(); continue; }
    const victory = combat.locator('[data-qa="victory"]:visible');
    if (await victory.count()) { await victory.click(); await page.waitForTimeout(800); }
  }
  if (!state && await page.locator('.travel-view:visible').count()) {
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${out}/return-travel-${branch}.png` }); returned = true; break;
  }
}
await writeFile(`${out}/route-${branch}.json`, JSON.stringify({ returned, captures: [...captures], states, errors }, null, 2));
await browser.close();
if (!returned) throw new Error('Route did not return to Travel View');

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const out = 'tools/traversal/qa/convergence/contacts';
await mkdir(out, {recursive:true});
const browser = await chromium.launch();
const page = await browser.newPage({viewport:{width:1463,height:823}});
const errors = [], findings = {};
page.on('pageerror', error => errors.push(String(error)));
await page.goto('http://127.0.0.1:5174/tools/traversal/taxonomy-review.html?seed=0');
await page.waitForFunction(() => window.review);
const capture = name => page.screenshot({path:`${out}/${name}.png`});
async function drive(target, lane = 0) {
  await page.evaluate(async ({target,lane}) => {
    const {scene,settle} = window.review;
    for (let i=0;i<2200 && scene.session.routeProgress01<target;i++) {
      settle();
      await Promise.resolve();
      if (scene.session.phase==='DECISION') {
        if (scene.session.routeProgress01===.2) scene.confirmDecision();
        else scene.skipDecision();
        settle();
      }
      scene.moveToLane(lane);
      scene.advance(.05);
    }
    if (scene.session.routeProgress01 < target) throw new Error('Drive target not reached');
  },{target,lane});
}
await page.evaluate(() => {window.review.scene.advance(10);window.review.settle()});
await page.waitForTimeout(350);
await capture('human-merchant');
findings.roadSynchronization = await page.evaluate(() => {
  const {scene} = window.review;
  const actor=scene.element.querySelector('[data-traversal-beat="t0:npc:roadside-merchant"]');
  const place=scene.element.querySelector('[data-world-section="merchant-halt"]');
  const before=[actor.getBoundingClientRect().x,place.getBoundingClientRect().x];
  scene.skipDecision();scene.advance(.5);
  return {actor:actor.getBoundingClientRect().x-before[0],place:place.getBoundingClientRect().x-before[1],
    visible:!actor.hidden, bypassed:scene.session.bypassedBeatIds.includes('t0:npc:roadside-merchant')};
});
assert.ok(Math.abs(findings.roadSynchronization.actor-findings.roadSynchronization.place)<.1);
assert.equal(findings.roadSynchronization.visible,true);
assert.equal(findings.roadSynchronization.bypassed,false);
await capture('merchant-ignore-still-visible');

for (const pickup of [{id:'road-cache',target:.498,lane:1},{id:'gold',target:.548,lane:0}]) {
  await drive(pickup.target,pickup.lane);
  await page.waitForTimeout(350);
  await capture(`${pickup.id}-before-contact`);
  const result = await page.evaluate(id => {
    const {scene,state}=window.review;
    const before=scene.session.routeProgress01;
    const truth=JSON.stringify(state);
    const truck=scene.element.querySelector('.traversal-vehicle').getBoundingClientRect();
    const subject=scene.element.querySelector(`[data-traversal-beat="t0:loot:${id}"]`).getBoundingClientRect();
    scene.advance(.9);
    return {before,after:scene.session.routeProgress01,phase:scene.session.phase,
      collected:scene.session.consumedBeatIds.includes(`t0:loot:${id}`),
      panel:!scene.element.querySelector('[data-traversal-event-panel]').hidden,
      transition:scene.element.dataset.transition??null,
      feedback:scene.element.querySelector('.traversal-pickup-feedback').textContent,
      persistentStateUnchanged:truth===JSON.stringify(state),silhouetteRatio:subject.height/truck.height};
  },pickup.id);
  assert.ok(result.after>result.before);
  assert.equal(result.phase,'RUNNING');assert.equal(result.collected,true);
  assert.equal(result.panel,false);assert.equal(result.transition,null);
  assert.equal(result.persistentStateUnchanged,true);
  assert.ok(!/aperçu|local|debug/i.test(result.feedback));
  findings[pickup.id]=result;
  await page.waitForTimeout(180);
  await capture(`${pickup.id}-moving-collection`);
}
await drive(.67,1);
await page.waitForTimeout(1500);
await capture('obstacle-readable');
await drive(.74,1);
findings.obstacleAvoid = await page.evaluate(() => ({
  bypassed:window.review.scene.session.bypassedBeatIds.includes('t0:obstacle:broken-cart'),
  phase:window.review.scene.session.phase,
  panel:!window.review.scene.element.querySelector('[data-traversal-event-panel]').hidden,
}));
assert.deepEqual(findings.obstacleAvoid,{bypassed:true,phase:'RUNNING',panel:false});
findings.errors=errors;assert.deepEqual(errors,[]);
await writeFile(`${out}/report.json`,JSON.stringify(findings,null,2));
await browser.close();console.log(findings);

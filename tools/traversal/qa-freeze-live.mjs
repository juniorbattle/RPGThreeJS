import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless: true });
const root = 'tools/traversal/qa/freeze/live-final';
await mkdir(root, { recursive: true });
async function run(mode) {
  const out = `${root}/${mode}`; await mkdir(out, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1463, height: 823 }, ...(mode === 'meet-fight' ? { recordVideo: { dir: out, size: { width: 1463, height: 823 } } } : {}) });
  const page = await context.newPage();
  const errors = [], states = [], captures = new Set(), scales = [];
  const started = Date.now();
  page.on('pageerror', e => errors.push(String(e)));
  const capture = async name => {
    if (captures.has(name)) return; captures.add(name);
    await page.screenshot({ path: `${out}/${name}.png` });
  };
  await page.goto('http://127.0.0.1:5182/?qa=1&traversal=t0');
  await page.waitForSelector('.traversal-t0');
  await page.evaluate(() => {
    window.traversalEvidence = [];
    const scene = document.querySelector('.traversal-t0');
    let previous = '';
    const sample = () => {
      if (!scene.isConnected) return;
      const key = [scene.dataset.phase, scene.dataset.transition, scene.dataset.routeVariant].join('|');
      if (key !== previous) {
        window.traversalEvidence.push({phase:scene.dataset.phase, transition:scene.dataset.transition,
          progress:+scene.dataset.progress, variant:scene.dataset.routeVariant,
          opacity:+scene.style.getPropertyValue('--transition-opacity'), time:performance.now()});
        previous = key;
      }
      requestAnimationFrame(sample);
    };
    sample();
  });
  let returned = false, lastPhase, localDone = false, roadCombat = false;
  for (let frame = 0; frame < 1500; frame++) {
    await page.waitForTimeout(150);
    const state = await page.evaluate(() => {
      const el = document.querySelector('.traversal-t0');
      if (!el) return null;
      return { phase: el.dataset.phase, progress: +el.dataset.progress, transition: el.dataset.transition,
        variant: el.dataset.routeVariant, lane: +el.dataset.lane,
        title: el.querySelector('[data-traversal-event-title]')?.textContent,
        category: el.querySelector('[data-traversal-event-panel]')?.dataset.category,
        collected: [...el.querySelectorAll('.is-collected')].map(e => e.dataset.traversalBeat),
        panel: !el.querySelector('[data-traversal-event-panel]').hidden,
        motion: el.dataset.motion };
    });
    if (state && state.phase !== lastPhase) { states.push({...state, seconds:(Date.now()-started)/1000}); console.log(mode, state.phase, state.progress, state.title); lastPhase = state.phase; }
    if (state?.transition) { await capture('transition-' + state.transition); continue; }
    if (state?.phase === 'ARRIVING') { await capture('exit-right'); }
    if (state?.phase === 'RUNNING' && state.progress > .02 && state.progress < .06) await capture('clean-travel');
    if (state?.phase === 'RUNNING') {
      let lane = state.progress < .16 ? (mode === 'avoid' ? 1 : 0)
        : state.progress < .35 ? (mode === 'avoid' ? 0 : 1)
        : state.progress < .52 ? 1 : state.progress < .64 ? 0
        : state.progress < .78 ? 1 : mode === 'ignore-flee' ? 1 : 0;
      const control = page.locator(`[data-traversal-lane="${lane}"]`);
      if (await control.isEnabled() && state.lane !== lane) await control.click();
      for (const id of state.collected) { assert.equal(state.panel, false); await capture(`collect-${id.split(':').at(-1)}`); }
      if (state.progress > .185 && state.progress < .197) await capture('mandatory-approach');
      if (state.progress > .66 && state.progress < .71) {
        assert.equal(await page.locator('[data-category="SIMPLE_OBSTACLE"]').count(), 0);
        await capture('uncluttered-road');
      }
      if (state.progress > .78 && state.progress < .795) await capture('fork-approach');
      if (state.progress > .81 && state.progress < .85) await capture('fork-resumed');
    }
    if (state?.phase === 'DECISION') {
      await page.waitForTimeout(260); // Capture the settled panel, after its short reveal.
      await capture(`decision-${state.progress}`);
      const dimensions = await page.evaluate(() => {
        const truck = document.querySelector('.traversal-vehicle').getBoundingClientRect().height;
        return [...document.querySelectorAll('.traversal-entity:not([hidden])')].map(e => ({ id:e.dataset.traversalBeat,
          category:e.dataset.category, family:e.dataset.scale, ratio:e.getBoundingClientRect().height/truck }));
      }); scales.push(...dimensions);
      const confirm = page.locator('[data-traversal-confirm]'), skip = page.locator('[data-traversal-skip]');
      if (state.category === 'MANDATORY_EVENT') { assert.equal(await confirm.textContent(), 'Continuer'); assert.equal(await skip.isVisible(), false); await confirm.click(); }
        else if (state.category === 'OPTIONAL_COMBAT') {
        assert.equal(await confirm.textContent(), 'Combattre'); assert.equal(await skip.textContent(), 'Fuir');
        if (mode === 'meet-fight' && state.progress === .3) { roadCombat = true; await confirm.click(); } else await skip.click();
      } else {
        assert.equal(await confirm.textContent(), 'Rencontrer'); assert.equal(await skip.textContent(), 'Ignorer');
        if (mode === 'meet-fight') { localDone = true; await confirm.click(); } else {
          await skip.click();
          assert.equal(+(await page.locator('.traversal-t0').getAttribute('data-lane')), state.lane);
          assert.equal(await page.locator('.traversal-t0').getAttribute('data-assisted-bypass'), 'false');
          await capture(`ignored-same-lane-${state.progress}`);
        }
      }
      continue;
    }
    if (state?.phase === 'LOCAL_INTERACTION' && !roadCombat) {
      await capture('merchant-meet'); await page.locator('[data-traversal-confirm]').click(); continue;
    }
    if (state?.phase === 'FORK_OVERLAY') {
      assert.equal(state.panel, false); await capture('fork-direct-choice');
      const branch = mode === 'ignore-flee' ? 'lion-first-trial-combat' : 'lion-first-trial-event';
      await page.locator(`[data-traversal-fork-choice="${branch}"]`).click();
      for (let i=0;i<12;i++) {
        states.push(await page.evaluate(() => {const e=document.querySelector('.traversal-t0');return {phase:'fork-fade',opacity:e.style.getPropertyValue('--transition-opacity'),variant:e.dataset.routeVariant,progress:e.dataset.progress};}));
        await page.waitForTimeout(70);
      }
      assert.equal(await page.locator('[data-world-section="forest-junction"]').count(), 0);
      assert.equal(await page.locator('[data-location-prop="junction-sign"]').count(), 0);
      await capture('fork-reveal');
      continue;
    }
    const choice=page.locator('.dialogue__choices button:visible').first();
    if(await choice.count()){await capture('canonical-dialogue'); await choice.click();continue;}
    const dialogue=page.locator('.dialogue__box:visible');
    if(await dialogue.count()){await dialogue.click();continue;}
    const combat=page.frames().find(f=>f.url().includes('legacy-combat'));
    if(combat){
      const tutorial=combat.locator('#tutorial').getByRole('button',{name:'Passer',exact:true});
      if(await tutorial.isVisible()){await tutorial.click();continue;}
      const done=combat.getByRole('button',{name:'Continuer la chronique',exact:true});
      if(await done.isVisible()){await done.click();roadCombat=false;continue;}
      const victory=combat.locator('[data-qa="victory"]:visible');
      if(await victory.count()){await capture(state?.progress===.3?'random-combat':'mandatory-combat');await victory.click();await page.waitForTimeout(800);}
    }
    if(!state && await page.locator('.travel-view:visible').count()){await page.waitForTimeout(2500);await capture('travel-return');returned=true;break;}
  }
  const telemetry = await page.evaluate(() => window.traversalEvidence);
  let held;
  let returns = 0;
  for (const sample of telemetry) {
    if (['LOCAL_INTERACTION','NODE_HANDOFF','NODE_RESOLUTION'].includes(sample.phase)) held = sample.progress;
    if (sample.transition === 'return' && held !== undefined) {
      assert.equal(sample.progress, held, 'return must reveal the same road position');
      returns++; held = undefined;
    }
  }
  await writeFile(`${out}/report.json`,JSON.stringify({returned,errors,states,scales,telemetry,verifiedReturns:returns,captures:[...captures]},null,2));
  await context.close();
  if (mode === 'meet-fight') await page.video().saveAs(`${out}/journey.webm`);
  assert.equal(returned,true,`${mode} must return to Travel View`); assert.deepEqual(errors,[]);
}
const modes = process.argv.slice(2);
const results=[]; for (const mode of modes.length ? modes : ['meet-fight','ignore-flee','avoid']) { try { await run(mode); results.push({status:'fulfilled'}); } catch(reason) { results.push({status:'rejected',reason}); } }
await browser.close();
for(const r of results) if(r.status==='rejected') console.error(r.reason);
if(results.some(r=>r.status==='rejected')) process.exitCode=1;

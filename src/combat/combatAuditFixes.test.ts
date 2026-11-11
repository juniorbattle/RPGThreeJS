import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { settleActionAp } from './combatTempo';

const runtime = readFileSync(new URL('./legacyCombatRuntime.js', import.meta.url), 'utf8');
const page = readFileSync(new URL('../../legacy-combat.html', import.meta.url), 'utf8');

function sliceFunction(name: string): string {
  const start = runtime.indexOf(`function ${name}(`);
  expect(start).toBeGreaterThan(-1);
  return runtime.slice(start, runtime.indexOf('\n', start));
}

describe('final audit 2026-11-11: combat fixes', () => {
  it('A1: tells skills from weapon attacks and items, so Mutisme blocks every skill and nothing else', () => {
    const isSkillSpec = new Function('SKILLS', `${sliceFunction('isSkillSpec')}; return isSkillSpec;`)(
      { boss_quake: {}, provoke: {} },
    ) as (spec: unknown) => boolean;
    expect(isSkillSpec({ key: 'boss_quake' })).toBe(true);
    expect(isSkillSpec({ key: 'provoke' })).toBe(true);
    expect(isSkillSpec({ key: 'attack' })).toBe(false);
    expect(isSkillSpec({ key: 'potion', item: true })).toBe(false);
    expect(isSkillSpec(null)).toBe(false);
  });

  it('A1: applies Mutisme to the enemy AI, to the action itself and to the clan supports', () => {
    expect(runtime).toContain("const silenced=hasS(u,'silence'),isBE=!!(u.boss||u.elite),forceUlt=isBE&&!silenced&&");
    expect(runtime).toContain('const def=SKILLS[s]; if(silenced||!def||');
    expect(runtime).toContain("function bestSupport(u,stands){ if(hasS(u,'silence'))return null;");
    expect(runtime).toContain("if(isSkillSpec(spec)&&hasS(u,'silence'))return;");
    expect(runtime).toContain("forceUlt=isBE&&!hasS(u,'silence')&&u._ultCooldown===0&&u.ap>=5;");
    expect(runtime).toContain("supDis=hasS(u,'silence')||");
    expect(runtime).toContain("const dis=used||spec.ap>u.ap||hasS(u,'silence');");
  });

  it('A2: the combat school states the rules the engine plays', () => {
    expect(page).not.toContain('2 pour les boss');
    expect(page).not.toMatch(/[ÉE]tourdi/u);
    expect(page).not.toContain('portée 2-4');
    expect(page).toContain('les boss et les élites en regagnent <b>3</b>');
    expect(page).toContain('<b>Furie</b>');
    expect(page).toContain('<b>Essoufflée</b>');
    expect(page).toContain('<b>Brise</b>');
    expect(page).toContain('<b>Entravé</b>');
    expect(page).toContain('<b>Mutisme</b>');
    expect(page).toContain('×1,4 dégâts');
    expect(page).toContain('×1,6 dégâts');
    expect(runtime).toContain('const elanMul=[1.0,1.4,1.6][lvl];');
  });

  it('A2: the school can be reopened from the help panel and Escape closes it', () => {
    expect(page).toContain('data-replay-tutorial');
    expect(runtime).toContain("document.querySelector('[data-replay-tutorial]')?.addEventListener('click',replayTutorial);");
    expect(runtime).toContain("if(tutorialCard){ if(e.key==='Escape'){ e.preventDefault(); if(tutorialCard===dom.tutorial)closeTutorial(); else closeBossTutorial(); } return; }");
    expect(runtime).toContain('function showTutorial(force=false){');
  });

  it('A6: the VFX lab is a development tool only', () => {
    expect(runtime).toContain("const VFX_LAB_ENABLED=import.meta.env.DEV&&campaignParams.get('vfxlab')==='1';");
  });

  it('A8: AP an action gives its own unit is credited after the cost, like a knock-out', () => {
    // A grimoire's +2 PA on a 1 PA attack at 5 / 5 PA: 5 − 1 + 2 = 5, not min(5, 7) − 1 = 4.
    expect(settleActionAp({ ap: 5, maxap: 5, cost: 1, knockOuts: 0, bonusAp: 2 })).toBe(5);
    expect(settleActionAp({ ap: 3, maxap: 5, cost: 2, knockOuts: 1, bonusAp: 2 })).toBe(4);
    expect(runtime).toContain("grantAp(u,2); floatText(u,'+2 PA'");
    expect(runtime).not.toContain('u.ap=Math.min(u.maxap,u.ap+2)');
  });

  it('A8: the floating status names match the unit cards', () => {
    for (const name of ["name:'Régénération'", "name:'Force'", "name:'Malédiction'", "name:'Aveuglement'", "name:'Provocation'"]) {
      expect(runtime).toContain(name);
    }
    expect(runtime).not.toContain("'Malédic.'");
  });
});

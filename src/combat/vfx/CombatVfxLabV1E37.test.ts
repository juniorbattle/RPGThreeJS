import { describe, it, expect } from 'vitest';
import {
  createDefaultLabState,
  getLabActions,
  getHeroActions,
  getVisualSpriteSheetSteps,
  getArtisticState,
  labStepKey,
  getActionCount,
} from './CombatVfxLab';
import type { LabState } from './CombatVfxLab';
import { readFileSync } from 'node:fs';

describe('R2C-HERO60 A1.2.1 — Persistence + Coverage Count Verification', () => {
  const checkpoint = JSON.parse(
    readFileSync('docs/reports/hero60_a1_2_recovered_60of64_pre_codex_completion.json', 'utf-8')
  );
  const recoveredState: LabState = checkpoint.labState;

  it('1. recovered state has 60 QA sources', () => {
    expect(Object.keys(recoveredState.qaSourceByActionStep).length).toBe(60);
  });

  it('2. recovered state has 60 QA overrides', () => {
    expect(Object.keys(recoveredState.qaPresentationByActionStep).length).toBe(60);
  });

  it('3. recovered state has 0 validated', () => {
    expect(Object.keys(recoveredState.validatedByActionStep).length).toBe(0);
  });

  it('4. hero action count is 60', () => {
    const heroActions = getHeroActions();
    expect(heroActions.length).toBe(60);
  });

  it('5. total hero visual spriteSheet steps is 64', () => {
    const heroActions = getHeroActions();
    let total = 0;
    for (const action of heroActions) {
      if (action.sourceStatus === 'NO_VFX') continue;
      total += getVisualSpriteSheetSteps(action).length;
    }
    expect(total).toBe(64);
  });

  it('6. QA working visual steps is 60', () => {
    const heroActions = getHeroActions();
    let qaWorking = 0;
    for (const action of heroActions) {
      if (action.sourceStatus === 'NO_VFX') continue;
      const visualSteps = getVisualSpriteSheetSteps(action);
      for (const vs of visualSteps) {
        const artistic = getArtisticState(recoveredState, action, vs.stepIndex);
        if (artistic === 'QA_WORKING') qaWorking++;
      }
    }
    expect(qaWorking).toBe(60);
  });

  it('7. complete actions is 58/60 (not 56)', () => {
    const heroActions = getHeroActions();
    let complete = 0;
    let incomplete = 0;
    const incompleteActions: { actionKey: string; missingSteps: number[] }[] = [];

    for (const action of heroActions) {
      if (action.sourceStatus === 'NO_VFX') continue;
      const visualSteps = getVisualSpriteSheetSteps(action);
      const missingSteps: number[] = [];
      for (const vs of visualSteps) {
        const key = labStepKey(action.actionKey, vs.stepIndex);
        if (!recoveredState.qaSourceByActionStep[key]) {
          missingSteps.push(vs.stepIndex);
        }
      }
      if (missingSteps.length === 0) {
        complete++;
      } else {
        incomplete++;
        incompleteActions.push({ actionKey: action.actionKey, missingSteps });
      }
    }

    console.log('Complete actions:', complete);
    console.log('Incomplete actions:', incomplete);
    console.log('Incomplete action details:', JSON.stringify(incompleteActions, null, 2));

    expect(complete).toBe(58);
    expect(incomplete).toBe(2);
    expect(incompleteActions).toHaveLength(2);
    
    // Verify the 2 incomplete actions are exactly the expected ones
    const eclipseEntry = incompleteActions.find(a => a.actionKey === 'd_devouring_eclipse');
    expect(eclipseEntry).toBeDefined();
    expect(eclipseEntry!.missingSteps).toEqual([1, 2, 3]);

    const assassinEntry = incompleteActions.find(a => a.actionKey === 'ni_silent_assassin');
    expect(assassinEntry).toBeDefined();
    expect(assassinEntry!.missingSteps).toEqual([1]);
  });

  it('8. exactly 4 missing visual steps', () => {
    const heroActions = getHeroActions();
    let missing = 0;
    for (const action of heroActions) {
      if (action.sourceStatus === 'NO_VFX') continue;
      const visualSteps = getVisualSpriteSheetSteps(action);
      for (const vs of visualSteps) {
        const key = labStepKey(action.actionKey, vs.stepIndex);
        if (!recoveredState.qaSourceByActionStep[key]) {
          missing++;
        }
      }
    }
    expect(missing).toBe(4);
  });

  it('9. no unexpected QA entries (all QA keys belong to hero actions)', () => {
    const heroActionKeys = new Set(getHeroActions().map(a => a.actionKey));
    const qaKeys = Object.keys(recoveredState.qaSourceByActionStep);
    const nonHero = qaKeys.filter(k => {
      const actionKey = k.split('::')[0]!;
      return !heroActionKeys.has(actionKey);
    });
    expect(nonHero).toEqual([]);
  });

  it('10. no QA entries on deferred slots', () => {
    const deferredSlots = [
      'd_devouring_eclipse::1',
      'd_devouring_eclipse::2',
      'd_devouring_eclipse::3',
      'ni_silent_assassin::1',
    ];
    const qaKeys = new Set(Object.keys(recoveredState.qaSourceByActionStep));
    const configured = deferredSlots.filter(s => qaKeys.has(s));
    expect(configured).toEqual([]);
  });

  it('11. all recovered scales >= 2.0', () => {
    const presKeys = Object.keys(recoveredState.qaPresentationByActionStep);
    const below2 = presKeys.filter(k => {
      const pres = recoveredState.qaPresentationByActionStep[k];
      return pres && (pres.scale ?? 0) < 2.0;
    });
    expect(below2).toEqual([]);
  });

  it('12. 60 unique candidate IDs', () => {
    const candidates = Object.values(recoveredState.qaSourceByActionStep);
    const unique = new Set(candidates);
    expect(candidates.length).toBe(60);
    expect(unique.size).toBe(60);
  });

  it('13. 83 total actions preserved', () => {
    expect(getActionCount().total).toBe(83);
  });

  it('14. all QA sources are at stepIndex 0', () => {
    const qaKeys = Object.keys(recoveredState.qaSourceByActionStep);
    const nonZero = qaKeys.filter(k => !k.endsWith('::0'));
    expect(nonZero).toEqual([]);
  });

  it('15. d_devouring_eclipse has 4 visual spriteSheet steps', () => {
    const action = getHeroActions().find(a => a.actionKey === 'd_devouring_eclipse');
    expect(action).toBeDefined();
    const visualSteps = getVisualSpriteSheetSteps(action!);
    expect(visualSteps.length).toBe(4);
    expect(visualSteps.map(vs => vs.stepIndex)).toEqual([0, 1, 2, 3]);
  });

  it('16. ni_silent_assassin has 2 visual spriteSheet steps', () => {
    const action = getHeroActions().find(a => a.actionKey === 'ni_silent_assassin');
    expect(action).toBeDefined();
    const visualSteps = getVisualSpriteSheetSteps(action!);
    expect(visualSteps.length).toBe(2);
    expect(visualSteps.map(vs => vs.stepIndex)).toEqual([0, 1]);
  });
});

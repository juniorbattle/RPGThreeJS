/** OD-2026-11-13-F (Q1): the dialogue effects' game truth, shared by GameApp and the QA drivers. */
import { describe, expect, it } from 'vitest';
import { applyNarrativeEffect } from './narrativeEffects';
import { createInitialState } from './store';
import { resolveSelectedLionFinaleCombat } from './lionFinale';

describe('applyNarrativeEffect', () => {
  it('changes the state and asks the caller only for what it owes: a fight, a chapter beat, an immediate save', () => {
    const state = createInitialState();
    expect(applyNarrativeEffect(state, { type: 'setFlag', key: 'helpedRefugees', value: true })).toEqual({});
    expect(state.flags.helpedRefugees).toBe(true);
    expect(applyNarrativeEffect(state, { type: 'addGold', amount: -1000 })).toEqual({});
    expect(state.gold).toBe(0);
    expect(applyNarrativeEffect(state, { type: 'startCombat', combatId: 'wolf_pack' })).toEqual({ combatId: 'wolf_pack' });
  });

  it('selects the Lion finale once: the selection saves, a second application returns the same boss without its effects', () => {
    const state = createInitialState();
    state.flags = { missionSuccess: true, protectedWitnesses: true, shadowEvidence: true };
    const first = applyNarrativeEffect(state, { type: 'resolveLionFinale', intent: 'request_trial' });
    expect(first).toEqual({ combatId: 'lion_chief', saveNow: true });
    expect(resolveSelectedLionFinaleCombat(state.flags)).toBe('lion_chief');
    const after = structuredClone(state);
    expect(applyNarrativeEffect(state, { type: 'resolveLionFinale', intent: 'claim_recognition' })).toEqual({ combatId: 'lion_chief' });
    expect(state).toEqual(after);
  });

  it('finishes the Lion: the ending is recorded, the plateau closes and its beat is named', () => {
    const state = createInitialState();
    state.flags.serpentGeneralDefeated = true;
    state.run.status = 'completed';
    expect(applyNarrativeEffect(state, { type: 'finishChapter', endingId: 'lion-seal-serpent' })).toEqual({ chapterBeatId: 'lion-seal-serpent' });
    expect(state.endingId).toBe('lion-seal-serpent');
    expect(state.campaign!.chapters.lion).toEqual({ status: 'completed', outcome: 'honour' });
  });
});

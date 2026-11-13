// @vitest-environment happy-dom
/**
 * OD-2026-11-13-F (Q1): whole chronicles, each played by the QA driver from a new chronicle of the current Lion of `dev`
 * to an ending. No fixture and no forced reputation: the Bear continues from the save the Lion writes, the Dragon from
 * the Bear's, and so on, each save written and reloaded by the game's own SaveRepository. Every fight is declared won
 * (the tactical runtime is not played here); every dialogue, effect, refuge, contextual scene and reputation event goes
 * through the game's owners.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { selectPlateauOutcomes } from '../game/campaignRelations';
import { nextEpilogueStep } from '../game/finalAct';
import { continueCampaign, nextPlayablePlateau } from '../game/plateauProgression';
import { SaveRepository } from '../game/store';
import type { GameState } from '../game/types';
import { CHRONICLE_CHAPTERS, CHRONICLE_PLANS, CHRONICLE_SEEDS, playChronicle, type ChroniclePlan } from './fullCampaignChain';

afterEach(() => localStorage.clear());

/** The save the next chapter continues from, written and read back by the game's repository. */
function throughSave(state: GameState): GameState {
  localStorage.clear();
  const saves = new SaveRepository();
  saves.saveAuto(state);
  const loaded = saves.loadLatest();
  if (!loaded) throw new Error('The save did not load back.');
  return loaded;
}

const EXPECTED: Record<keyof typeof CHRONICLE_PLANS, { ending: string; endingId: string; lastFights: readonly string[] }> = {
  respect: { ending: 'respect', endingId: 'ending-respect', lastFights: ['finale_breach'] },
  balance: { ending: 'balance', endingId: 'ending-balance', lastFights: ['finale_breach'] },
  fearLastStand: { ending: 'fear', endingId: 'ending-fear-last-stand', lastFights: ['finale_breach', 'finale_last_stand'] },
  fearFate: { ending: 'fear', endingId: 'ending-fear-fate', lastFights: ['finale_breach'] },
};

describe('a whole chronicle from the current Lion to an ending (OD-2026-11-13-F, Q1)', () => {
  for (const [key, plan] of Object.entries(CHRONICLE_PLANS) as [keyof typeof CHRONICLE_PLANS, ChroniclePlan][]) {
    it(`${plan.name}: Lion → Bear → Dragon → Scorpion → final act, each chapter from the previous one's save`, () => {
      const { chapters, saved } = playChronicle(plan, throughSave);

      // The Lion is a new chronicle of the current dev Lion, closed by its own epilogue.
      const lion = chapters.lion;
      expect(lion.state.run.id).toBe(`lion-${CHRONICLE_SEEDS.lion}`);
      expect(lion.reputationStart).toBe(30);
      expect(lion.fights).toContain(plan.lion === 'honour' ? 'serpent_captain' : 'lion_chief');
      expect(lion.state.endingId).toMatch(plan.lion === 'honour' ? /^lion-seal-serpent/ : /^lion-seal-trial/);
      expect(lion.state.run.status).toBe('completed');

      for (const chapterId of CHRONICLE_CHAPTERS) {
        const played = chapters[chapterId];
        // The save holds exactly the state the chapter left.
        expect(saved[chapterId], `${chapterId} save`).toEqual(played.state);
        expect(played.state.campaign!.chapters[chapterId], chapterId).toEqual(
          chapterId === 'finale' ? { status: 'completed' } : { status: 'completed', outcome: plan[chapterId] });
        expect(played.state.reputation).toBeGreaterThanOrEqual(0);
        expect(played.state.reputation).toBeLessThanOrEqual(100);
      }
      // Each later chapter began from the previous save: its reputation, gold and company carried over.
      for (const [chapterId, previousId] of [['bear', 'lion'], ['dragon', 'bear'], ['scorpion', 'dragon'], ['finale', 'scorpion']] as const) {
        expect(chapters[chapterId].state.run.id, chapterId).toBe(`${chapterId}-${CHRONICLE_SEEDS[chapterId]}`);
        expect(chapters[chapterId].reputationStart, chapterId).toBe(saved[previousId].reputation);
        const carried = saved[previousId].clan.members.map((unit) => unit.id);
        expect(chapters[chapterId].state.clan.members.map((unit) => unit.id).slice(0, carried.length), chapterId).toEqual(carried);
      }

      const end = saved.finale;
      expect(selectPlateauOutcomes(end).map((entry) => entry.outcome)).toEqual([plan.lion, plan.bear, plan.dragon, plan.scorpion]);
      expect(end.campaign!.ending).toBe(EXPECTED[key].ending);
      expect(end.endingId).toBe(EXPECTED[key].endingId);
      expect(end.campaign!.finalAct.stage).toBe('completed');
      expect(end.run.status).toBe('completed');
      expect(chapters.finale.fights.slice(-EXPECTED[key].lastFights.length)).toEqual(EXPECTED[key].lastFights);
      // The chronicle is over: nothing more to play, no chapter to continue into.
      expect(nextEpilogueStep(end)).toBeNull();
      expect(nextPlayablePlateau(end)).toBeNull();
      expect(continueCampaign(structuredClone(end), 1)).toBeNull();
    });
  }

  it('reaches every chapter with a different company story: the honour Lion recruits Garen, the force Lion does not', () => {
    const honour = playChronicle(CHRONICLE_PLANS.respect).chapters.lion.state;
    const force = playChronicle(CHRONICLE_PLANS.fearFate).chapters.lion.state;
    expect(honour.clan.members.map((unit) => unit.definitionId)).toContain('lancer');
    expect(force.clan.members.map((unit) => unit.definitionId)).not.toContain('lancer');
    expect(honour.reputation).toBeGreaterThan(force.reputation);
  });
});

// @vitest-environment happy-dom
/**
 * OD-2026-11-13-F (Q1): a save taken in the middle of a chapter after the Lion, on a chronicle played from the current
 * Lion of `dev`. The save is written and read back by the game's SaveRepository (`migrateState`, `migrateCurrentRoute`):
 * it gives back the same state on the same route, and the chapter resumed from it ends exactly as the same chapter played
 * without a break: same fights, same lines, same final state, nothing replayed.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { requirePlateauCampaign } from '../campaign/plateaux/PlateauRegistry';
import { tournamentBoard } from '../game/finalAct';
import { getRunNode } from '../game/runSystem';
import { SaveRepository } from '../game/store';
import type { GameState } from '../game/types';
import {
  CHRONICLE_PLANS, CHRONICLE_SEEDS, POST_LION_CHAPTERS, chapterScenario, midChapterStop, playChronicle, previousChapter,
  type ChroniclePlan,
} from './fullCampaignChain';
import { playLion, playPlateau, resumeChapter, type PlateauPlaythrough } from './plateauDriver';

afterEach(() => localStorage.clear());

function saveAndReload(state: GameState): GameState {
  localStorage.clear();
  const saves = new SaveRepository();
  saves.saveAuto(state);
  return saves.loadLatest()!;
}

const said = (run: PlateauPlaythrough) => run.lines.map((line) => `${line.dialogueId}:${line.stepId}`);

for (const plan of [CHRONICLE_PLANS.respect, CHRONICLE_PLANS.fearLastStand] as ChroniclePlan[]) {
  describe(`mid-chapter saves after the Lion — ${plan.name} (OD-2026-11-13-F, Q1)`, () => {
    const chronicle = playChronicle(plan);

    for (const chapterId of POST_LION_CHAPTERS) {
      it(`${chapterId}: a save at ${midChapterStop(chapterId)} reloads the same state on the same route and resumes without replay`, () => {
        const scenario = chapterScenario(plan, chapterId);
        const whole = chronicle.chapters[chapterId];
        const half = playPlateau(chapterId, chronicle.saved[previousChapter(chapterId)], scenario, CHRONICLE_SEEDS[chapterId],
          midChapterStop(chapterId));
        expect(half.state.run.status).toBe('active');
        expect(half.state.run.id).toBe(whole.state.run.id);
        expect(half.fights.length).toBeGreaterThan(0);
        expect(half.fights.length).toBeLessThan(whole.fights.length);

        const loaded = saveAndReload(half.state);
        expect(loaded).toEqual(half.state);
        // The route survives the reload untouched: every canonical and optional POI of the chapter, the same current POI.
        const binding = requirePlateauCampaign(chapterId);
        expect(loaded.run.graph.nodes.map((node) => node.id)).toEqual(expect.arrayContaining([...binding.canonicalNodeIds, ...binding.optionalNodeIds]));
        expect(loaded.run.seed).toBe(CHRONICLE_SEEDS[chapterId]);
        expect(getRunNode(loaded.run)?.id).toBe(half.visited.at(-1));

        const rest = resumeChapter(chapterId, loaded, scenario);
        expect([...half.fights, ...rest.fights]).toEqual(whole.fights);
        expect([...said(half), ...said(rest)]).toEqual(said(whole));
        expect(rest.state).toEqual(whole.state);
      });
    }

    it(`final act: a save on the Tournament's board, before ${midChapterStop('tournament')}, resumes on the board`, () => {
      const scenario = chapterScenario(plan, 'finale');
      const whole = chronicle.chapters.finale;
      const half = playPlateau('finale', chronicle.saved.scorpion, scenario, CHRONICLE_SEEDS.finale, midChapterStop('tournament'));
      const board = tournamentBoard(half.state);
      expect(board.entered).toBe(true);
      expect(half.fights).toEqual(['finale_raven_bout', 'finale_wolf_bout']);
      const loaded = saveAndReload(half.state);
      expect(loaded).toEqual(half.state);
      expect(tournamentBoard(loaded)).toEqual(board);
      const rest = resumeChapter('finale', loaded, scenario);
      expect([...half.fights, ...rest.fights]).toEqual(whole.fights);
      expect([...said(half), ...said(rest)]).toEqual(said(whole));
      expect(rest.state).toEqual(whole.state);
    });
  });
}

describe('the Lion itself, saved at its second refuge (OD-2026-11-13-F, Q1)', () => {
  it('reloads the same state and ends the Lion as an unbroken run', () => {
    const scenario = chapterScenario(CHRONICLE_PLANS.respect, 'lion');
    const whole = playLion(scenario, CHRONICLE_SEEDS.lion);
    const half = playLion(scenario, CHRONICLE_SEEDS.lion, 'lion-second-refuge');
    const loaded = saveAndReload(half.state);
    expect(loaded).toEqual(half.state);
    const rest = resumeChapter('lion', loaded, scenario);
    expect([...said(half), ...said(rest)]).toEqual(said(whole));
    expect(rest.state).toEqual(whole.state);
  });
});

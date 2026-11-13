// @vitest-environment happy-dom
/**
 * OD-2026-11-13-F (Q1): the return to the last save after a defeat, in every chapter after the Lion, in a real GameApp.
 *
 * The states come from a chronicle played by the QA driver from the current Lion of `dev`, never from a fixture. A
 * defeat reloads the last save of the same game (same `run.id`, same seed: `SaveRepository.loadRecovery`), never a
 * newer save of another chapter, writes nothing, and resumes only on the player's explicit input: on the map's POI, on
 * the selected boss after a judgement, on the Tournament's board, or on the Fear ending's last stand.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameApp } from './GameApp';
import { pendingPlateauFinaleCombat, plateauFinaleOf } from './plateauProgression';
import { enterPoi, getRunNode, settlePoiNavigation } from './runSystem';
import { SaveRepository } from './store';
import type { CombatConfig, CombatResult, GameState, NarrativeEffect, RunNode } from './types';
import { requirePlateauCampaign } from '../campaign/plateaux/PlateauRegistry';
import {
  CHRONICLE_PLANS, CHRONICLE_SEEDS, chapterScenario, midChapterStop, playChronicle, previousChapter, type PostLionChapterId,
} from '../qa/fullCampaignChain';
import { playPlateau, resumeChapter } from '../qa/plateauDriver';

const AUTO = 'rpg-threejs:autosave:v6:campaign';
afterEach(() => { localStorage.clear(); document.body.replaceChildren(); vi.restoreAllMocks(); });

interface Owner {
  state: GameState;
  resolveCombat(result: CombatResult, node: RunNode, rewards: CombatConfig['rewards']): Promise<void>;
  resolveRunNode(node: RunNode, initial: boolean): Promise<void>;
  playStandaloneCinematic(...args: unknown[]): Promise<void>;
  showTournamentBoard(): Promise<void>;
  startCombat(combatId: string, node: RunNode): Promise<void>;
  applyEffects(effects: NarrativeEffect[]): Promise<void>;
}

const plan = CHRONICLE_PLANS.respect;
const chronicle = playChronicle(plan);
const fear = playChronicle(CHRONICLE_PLANS.fearLastStand);

function mount(state: GameState): { app: GameApp; owner: Owner; root: HTMLElement } {
  const root = document.createElement('div');
  document.body.append(root);
  const app = new GameApp(root, document.createElement('canvas'));
  const owner = app as unknown as Owner;
  owner.state = structuredClone(state);
  vi.spyOn(owner, 'playStandaloneCinematic').mockResolvedValue();
  return { app, owner, root };
}

const loss = (combatId: string): CombatResult => ({ combatId, victory: false, participants: [], unitHealth: {} } as unknown as CombatResult);
const noReward: CombatConfig['rewards'] = { gold: 90, reputation: 2, materials: {} };

/** Progress made since the save, which a defeat must undo: gold spent, a potion used, a POI marked resolved. */
function progressSinceSave(state: GameState): void {
  state.gold = 0;
  state.inventory.consumables.potion = 0;
  state.flags.progressSinceSave = true;
  state.resolvedNodeIds.push('progress-since-save');
}

function midState(chapterId: PostLionChapterId): GameState {
  return playPlateau(chapterId, chronicle.saved[previousChapter(chapterId)], chapterScenario(plan, chapterId),
    CHRONICLE_SEEDS[chapterId], midChapterStop(chapterId)).state;
}

describe('defeat after the Lion returns to the last save of the same game (OD-2026-11-13-F, Q1)', () => {
  for (const chapterId of ['bear', 'dragon', 'scorpion', 'finale'] as const) {
    it(`${chapterId}: a defeat on the route reloads the mid-chapter save, never the previous chapter's newer one`, async () => {
      const mid = midState(chapterId);
      const { app, owner, root } = mount(mid);
      const saves = new SaveRepository();
      saves.saveAuto(owner.state);
      const saved = saves.loadAuto()!;
      const bytes = localStorage.getItem(AUTO);
      // A newer manual save of the chapter before (another run of the same chronicle) must never be taken.
      saves.saveManual(chronicle.saved[previousChapter(chapterId)]);
      expect(saves.loadLatest()!.run.id).not.toBe(saved.run.id);
      progressSinceSave(owner.state);
      const resume = vi.spyOn(owner, 'resolveRunNode').mockResolvedValue();
      await owner.resolveCombat(loss(`${chapterId}-defeat`), getRunNode(owner.state.run)!, noReward);

      expect(owner.state).toEqual(saved);
      expect(owner.state.run.id).toBe(`${chapterId}-${CHRONICLE_SEEDS[chapterId]}`);
      expect(owner.state.run.seed).toBe(CHRONICLE_SEEDS[chapterId]);
      expect(localStorage.getItem(AUTO)).toBe(bytes);
      expect(resume).not.toHaveBeenCalled();
      const button = root.querySelector<HTMLButtonElement>('[data-action=resume-save]')!;
      expect(button).toBe(document.activeElement);
      button.click();
      // The save stood at a resolved refuge: the company returns to the campaign surface, nothing is replayed.
      await vi.waitFor(() => expect(document.body.dataset.campaignSurface).toBe('poi-map'));
      expect(resume).not.toHaveBeenCalled();
      expect(owner.state).toEqual(saved);
      app.dispose();
    });
  }

  for (const chapterId of ['bear', 'dragon', 'scorpion'] as const) {
    it(`${chapterId}: a defeat against the boss the judgement selected resumes on that boss, without a second judgement`, async () => {
      const judgement = requirePlateauCampaign(chapterId).judgementNodeId;
      const before = playPlateau(chapterId, chronicle.saved[previousChapter(chapterId)], chapterScenario(plan, chapterId),
        CHRONICLE_SEEDS[chapterId], judgement).state;
      const { app, owner, root } = mount(before);
      settlePoiNavigation(owner.state);
      expect(enterPoi(owner.state, judgement)?.node.id).toBe(judgement);
      // The judgement's answer, applied through GameApp: it selects the boss and saves at once.
      await owner.applyEffects([{ type: 'resolvePlateauFinale', plateauId: chapterId, intent: 'claim_recognition' }]);
      const boss = pendingPlateauFinaleCombat(owner.state);
      expect([plateauFinaleOf(chapterId)!.combats.honour, plateauFinaleOf(chapterId)!.combats.force]).toContain(boss);
      const saved = new SaveRepository().loadAuto()!;
      expect(saved).toEqual(owner.state);
      progressSinceSave(owner.state);
      const resume = vi.spyOn(owner, 'resolveRunNode').mockResolvedValue();
      await owner.resolveCombat(loss(boss!), getRunNode(owner.state.run)!, noReward);
      expect(owner.state).toEqual(saved);
      root.querySelector<HTMLButtonElement>('[data-action=resume-save]')!.click();
      await vi.waitFor(() => expect(resume).toHaveBeenCalledWith(expect.objectContaining({ id: judgement }), true));
      expect(pendingPlateauFinaleCombat(owner.state)).toBe(boss);
      // Resumed by the driver from the same save, the plateau ends exactly as the unbroken run (one judgement, one boss).
      const rest = resumeChapter(chapterId, saved, chapterScenario(plan, chapterId));
      expect(rest.fights).toEqual([boss]);
      expect(rest.state.campaign!.chapters[chapterId]).toEqual(chronicle.saved[chapterId].campaign!.chapters[chapterId]);
      app.dispose();
    });
  }

  it('final act: a defeat in a Tournament bout resumes on the board, with the bouts already won kept', async () => {
    const onBoard = playPlateau('finale', chronicle.saved.scorpion, chapterScenario(plan, 'finale'), CHRONICLE_SEEDS.finale,
      midChapterStop('tournament')).state;
    const { app, owner, root } = mount(onBoard);
    new SaveRepository().saveAuto(owner.state);
    const saved = new SaveRepository().loadAuto()!;
    progressSinceSave(owner.state);
    const board = vi.spyOn(owner, 'showTournamentBoard').mockResolvedValue();
    const node: RunNode = { id: 'finale-bout-phoenix', type: 'combat', depth: 0, links: [], contentId: 'finale_phoenix_bout', label: 'Champion du Phénix', icon: '⚔', x: 0, z: 0 };
    await owner.resolveCombat(loss('finale_phoenix_bout'), node, noReward);
    expect(owner.state).toEqual(saved);
    expect(owner.state.run.id).toBe(`finale-${CHRONICLE_SEEDS.finale}`);
    root.querySelector<HTMLButtonElement>('[data-action=resume-save]')!.click();
    await vi.waitFor(() => expect(board).toHaveBeenCalled());
    app.dispose();
  });

  it('Fear ending: a defeat in the last stand resumes on the last stand, once the epilogue saved before it', async () => {
    // The breach won, the act closed, the Fear epilogue answered "last stand": GameApp saves before the epilogue's fight.
    const end = fear.saved.finale;
    const beforeStand = structuredClone(end);
    beforeStand.campaign!.finalAct.stage = 'epilogue';
    beforeStand.endingId = 'finale-breach';
    for (const key of ['finaleLastStandWon']) delete beforeStand.flags[key];
    const { app, owner, root } = mount(beforeStand);
    new SaveRepository().saveAuto(owner.state);
    const saved = new SaveRepository().loadAuto()!;
    progressSinceSave(owner.state);
    const stand = vi.spyOn(owner, 'startCombat').mockResolvedValue();
    await owner.resolveCombat(loss('finale_last_stand'), getRunNode(owner.state.run)!, noReward);
    expect(owner.state).toEqual(saved);
    root.querySelector<HTMLButtonElement>('[data-action=resume-save]')!.click();
    await vi.waitFor(() => expect(stand).toHaveBeenCalledWith('finale_last_stand', expect.objectContaining({ id: 'finale-breach' })));
    app.dispose();
  });
});

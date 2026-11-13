// @vitest-environment happy-dom
/**
 * OD-2026-11-13-F (Q1): the real GameApp path after the Lion, from the title's "Continuer" to the chronicle's end panel.
 *
 * The save is the one the current Lion of `dev` writes when the QA driver plays it from a new chronicle. Everything
 * GameApp coordinates runs for real: the title, `continueChronicle`, the resume, the Journey boundary's terminal outcome,
 * `continueIntoNextPlateau`, each plateau's first POI, the map's moves (`choosePoi`), refuges, judgements, the fights'
 * resolution, the Tournament's board, the epilogue steps, the autosaves and the return to the title. Only the leaves
 * that draw are replaced: the dialogue is answered by the QA driver's policy and its effects go through GameApp's own
 * `applyEffects`; the tactical runtime reports a victory; the curtain runs its task at once; the Journey surface answers
 * with its terminal action; the map, refuge services and living tableaux draw nothing.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameApp } from './GameApp';
import { resolveContestOutcome } from './contestResolution';
import { selectPlateauOutcomes } from './campaignRelations';
import { runPlateauId } from './plateauProgression';
import { getPlateau } from '../campaign/plateaux/PlateauRegistry';
import { getRunNode } from './runSystem';
import { SaveRepository } from './store';
import type { CombatResult, DialogueSequence, GameState, NarrativeEffect } from './types';
import { sceneTransition } from '../ui/SceneTransition';
import {
  CHRONICLE_PLANS, POST_LION_CHAPTERS, chapterScenario, playChronicle, type ChroniclePlan,
} from '../qa/fullCampaignChain';
import { chooseAnswer, nextRoutePoi } from '../qa/plateauDriver';

afterEach(() => { localStorage.clear(); document.body.replaceChildren(); vi.restoreAllMocks(); delete document.body.dataset.campaignSurface; });

interface Owner {
  state: GameState;
  mode: string;
  renderTitle(): void;
  choosePoi(nodeId: string): Promise<void>;
  playTournamentStep(): Promise<void>;
  applyEffects(effects: NarrativeEffect[]): Promise<void>;
  playNarrativeDialogue(sequence: DialogueSequence, options: unknown): Promise<void>;
  playLivingTableau(...args: unknown[]): Promise<boolean>;
  playJourneyCinematic(...args: unknown[]): Promise<void>;
  playStandaloneCinematic(...args: unknown[]): Promise<void>;
  runRefugeServices(...args: unknown[]): Promise<void>;
  openManagement(...args: unknown[]): Promise<void>;
  ensureJourneyBoundary(): unknown;
  combat: { start(session: { config: { id: string } }): unknown; close(): void };
  poiMap: { open(...args: unknown[]): void; close(): void; animateTravel(...args: unknown[]): Promise<void> | undefined };
  exploration: { prepareBackground(url: string): Promise<void> };
}

interface Trace {
  dialogues: { chapter: string; id: string }[];
  fights: { chapter: string; id: string }[];
  terminals: { chapter: string; title?: string; caption?: string; continueLabel?: string }[];
  firstScenes: string[];
}

/** A real GameApp with only its drawing leaves replaced (see the file header). */
function mountChronicle(plan: ChroniclePlan, lionEnd: GameState): { app: GameApp; owner: Owner; root: HTMLElement; trace: Trace } {
  vi.spyOn(sceneTransition, 'run').mockImplementation(async (options) => { await options.task(); return true; });
  vi.spyOn(sceneTransition, 'cover').mockResolvedValue(true);
  vi.spyOn(sceneTransition, 'releaseWhenReady').mockImplementation(() => undefined);
  new SaveRepository().saveAuto(lionEnd);
  const root = document.createElement('div');
  document.body.append(root);
  const app = new GameApp(root, document.createElement('canvas'));
  const owner = app as unknown as Owner;
  const trace: Trace = { dialogues: [], fights: [], terminals: [], firstScenes: [] };
  const chapter = () => runPlateauId(owner.state);

  owner.playNarrativeDialogue = async (sequence) => {
    trace.dialogues.push({ chapter: chapter(), id: sequence.id });
    let step = sequence.steps[0];
    const seen = new Set<string>();
    while (step && !seen.has(step.id)) {
      seen.add(step.id);
      await owner.applyEffects(step.effects);
      let next = step.next;
      if (step.choices?.length) {
        const choice = chooseAnswer(owner.state, chapterScenario(plan, chapter()), sequence, step.id, step.choices);
        const outcome = resolveContestOutcome(choice, owner.state);
        if (outcome.type === 'blocked') throw new Error(`Refused answer in ${sequence.id}`);
        await owner.applyEffects(outcome.effects);
        next = outcome.next;
      }
      step = next ? sequence.steps.find((candidate) => candidate.id === next) : undefined;
    }
  };
  vi.spyOn(owner, 'playLivingTableau').mockResolvedValue(false);
  vi.spyOn(owner, 'playJourneyCinematic').mockResolvedValue();
  vi.spyOn(owner, 'playStandaloneCinematic').mockResolvedValue();
  vi.spyOn(owner, 'runRefugeServices').mockResolvedValue();
  vi.spyOn(owner, 'openManagement').mockResolvedValue();
  vi.spyOn(owner.exploration, 'prepareBackground').mockResolvedValue();
  vi.spyOn(owner.poiMap, 'open').mockImplementation(() => undefined);
  vi.spyOn(owner.poiMap, 'animateTravel').mockReturnValue(undefined);
  vi.spyOn(owner.combat, 'close').mockImplementation(() => undefined);
  vi.spyOn(owner.combat, 'start').mockImplementation((session) => {
    trace.fights.push({ chapter: chapter(), id: session.config.id });
    const participants = owner.state.deployment.unitIds;
    const unitHealth = Object.fromEntries(owner.state.clan.members.map((unit) => [unit.id, unit.currentHealth]));
    const result = { combatId: session.config.id, victory: true, participants, unitHealth } as unknown as CombatResult;
    return { ready: Promise.resolve(), result: Promise.resolve(result) };
  });
  const boundary = {
    waitUntilSurfaceReady: () => Promise.resolve(),
    dispose: () => undefined,
    captureBackdrop: () => false,
    markCinematicPresented: () => undefined,
    present: async (request: { available: unknown[]; terminal?: { title: string; caption: string; continueLabel?: string } }) => {
      if (request.available.length) return { kind: 'presentation-continue', id: null };
      trace.terminals.push({ chapter: chapter(), ...request.terminal });
      const before = chapter();
      queueMicrotask(() => { if (chapter() !== before) trace.firstScenes.push(getRunNode(owner.state.run)!.contentId); });
      return { kind: 'terminal', id: null };
    },
  };
  owner.ensureJourneyBoundary = () => boundary;
  return { app, owner, root, trace };
}

/** Plays the map and the Tournament's board as the player would, one decision at a time, until the title returns. */
async function playToTitle(owner: Owner, plan: ChroniclePlan): Promise<void> {
  for (let turn = 0; turn < 600; turn += 1) {
    if (owner.mode === 'TITLE') return;
    const surface = document.body.dataset.campaignSurface;
    if (surface === 'tournament-board') { await owner.playTournamentStep(); continue; }
    if (owner.mode === 'TRAVEL' && surface === 'poi-map') {
      const next = nextRoutePoi(owner.state, chapterScenario(plan, runPlateauId(owner.state)));
      if (!next) throw new Error(`No route POI left on the ${runPlateauId(owner.state)} map at ${owner.state.run.currentNodeId}.`);
      await owner.choosePoi(next);
      continue;
    }
    throw new Error(`Stuck in mode ${owner.mode} on surface ${surface ?? 'none'} at ${owner.state.run.currentNodeId}.`);
  }
  throw new Error('The chronicle did not end.');
}

describe('GameApp after the Lion, from "Continuer" to the end panel (OD-2026-11-13-F, Q1)', () => {
  for (const plan of [CHRONICLE_PLANS.respect, CHRONICLE_PLANS.fearLastStand] as ChroniclePlan[]) {
    it(`${plan.name}: the real lifecycle continues the Lion's save through every chapter to the title`, async () => {
      const driven = playChronicle(plan);
      const errors = vi.spyOn(console, 'error');
      const { app, owner, root, trace } = mountChronicle(plan, driven.saved.lion);
      owner.renderTitle();
      const continueButton = root.querySelector<HTMLButtonElement>('[data-action="continue"]')!;
      expect(continueButton.disabled).toBe(false);
      continueButton.click();
      await vi.waitFor(() => expect(document.body.dataset.campaignSurface).toBe('poi-map'), { timeout: 5000 });
      expect(runPlateauId(owner.state)).toBe('bear');
      await playToTitle(owner, plan);

      // The Lion's end panel, then each chapter's, says where the route goes; the last one names the ending.
      expect(trace.terminals.map((panel) => panel.chapter)).toEqual(['lion', 'bear', 'dragon', 'scorpion', 'finale']);
      expect(trace.terminals.slice(0, 4).map((panel) => panel.continueLabel))
        .toEqual(POST_LION_CHAPTERS.map((chapterId) => `Continuer : ${getPlateau(chapterId).label}`));
      expect(trace.terminals.at(-1)).toMatchObject({ title: expect.any(String), caption: expect.stringContaining('la Voie des Sceaux s’achève') });
      // Each plateau opens on its first POI's scene, played by GameApp right after "Continuer".
      for (const chapterId of ['bear', 'dragon', 'scorpion'] as const) {
        expect(trace.dialogues.find((entry) => entry.chapter === chapterId)?.id).toBe(driven.chapters[chapterId].lines[0]!.dialogueId);
      }
      // The same fights as the QA driver, chapter by chapter: the driver plays what the game plays.
      for (const chapterId of POST_LION_CHAPTERS) {
        expect(trace.fights.filter((fight) => fight.chapter === chapterId).map((fight) => fight.id), chapterId)
          .toEqual(driven.chapters[chapterId].fights);
      }
      expect(trace.fights).toHaveLength(POST_LION_CHAPTERS.reduce((count, chapterId) => count + driven.chapters[chapterId].fights.length, 0));
      // No presentation failure fell back silently (a Journey failure logs an error and restores the map).
      expect(errors).not.toHaveBeenCalled();
      const end = owner.state;
      expect(owner.mode).toBe('TITLE');
      expect(selectPlateauOutcomes(end).map((entry) => entry.outcome)).toEqual([plan.lion, plan.bear, plan.dragon, plan.scorpion]);
      expect(end.campaign!.ending).toBe(driven.saved.finale.campaign!.ending);
      expect(end.endingId).toBe(driven.saved.finale.endingId);
      expect(end.reputation).toBe(driven.saved.finale.reputation);
      expect(end.flags).toEqual(driven.saved.finale.flags);
      expect(end.campaign!.finalAct.stage).toBe('completed');
      // The last autosave is the finished chronicle, and the title offers "Continuer" on it.
      expect(new SaveRepository().loadLatest()!.campaign!.finalAct.stage).toBe('completed');
      expect(root.querySelector<HTMLButtonElement>('[data-action="continue"]')!.disabled).toBe(false);
      app.dispose();
    }, 30000);
  }
});

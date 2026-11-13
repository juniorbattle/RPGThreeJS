// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameApp } from './GameApp';
import { createPlateauRunState } from './runSystem';
import { createInitialState } from './store';
import type { CombatResult, GameState, RunNode } from './types';
import { POST_DEMO_LIVING_BACKDROPS, POST_DEMO_LIVING_TABLEAUX, postDemoBackdropFor } from '../ui/living/postDemoLiving';
import { LivingBackdrop } from '../ui/living/LivingBackdrop';
import { POST_DEMO_FRAME } from '../ui/living/plateauArrivals';

afterEach(() => { vi.restoreAllMocks(); document.body.replaceChildren(); });

type Stub = ReturnType<typeof vi.fn>;
interface Owner {
  state: GameState;
  liveBoardDialogueId: string | null;
  liveEpilogue: boolean;
  resolveRunNode(node: RunNode, initial: boolean): Promise<void>;
  resolveCombat(result: CombatResult, node: RunNode, rewards: { gold: number; reputation: number; materials: Record<string, number> }): Promise<void>;
  playTournamentStep(): Promise<void>;
  playEpilogueStep(step: { kind: 'dialogue'; dialogueId: string }): Promise<void>;
  playDialogue: Stub; playLivingTableau: Stub; playJourneyCinematic: Stub; enterCampaignPresentation: Stub;
}

function plateauState(plateau: 'bear' | 'dragon' | 'scorpion' | 'finale'): GameState {
  const state = createInitialState();
  state.run = createPlateauRunState(plateau, 20261113);
  state.currentNodeId = state.run.currentNodeId;
  state.visitedNodeIds = [...state.run.visitedNodeIds];
  return state;
}

/** A GameApp with only the owners these boundaries call, stubbed (set 1.20.0, "Post-demo moments"). */
function app(state: GameState) {
  return Object.assign(Object.create(GameApp.prototype), {
    state, mode: 'RESULT', pendingCombatId: null, disposed: false, routeCommitInFlight: false,
    liveBoardDialogueId: null, liveEpilogue: false,
    saves: { saveAuto: vi.fn() },
    poiMap: { close: vi.fn() },
    playDialogue: vi.fn(async () => undefined),
    playLivingTableau: vi.fn(async () => true),
    playJourneyCinematic: vi.fn(async () => undefined),
    playStandaloneCinematic: vi.fn(async () => undefined),
    playPostNodeNarrative: vi.fn(async () => false),
    enterCampaignPresentation: vi.fn(async () => undefined),
    enterJourney: vi.fn(async () => undefined),
    disposeJourney: vi.fn(),
    flushPendingCombat: vi.fn(async () => undefined),
    restoreAfterDefeat: vi.fn(),
    setMode: vi.fn(),
  }) as unknown as Owner;
}
const bossNode = (state: GameState): RunNode => state.run.graph.nodes.find((node) => node.type === 'boss')! as RunNode;
const victory = (combatId: string): CombatResult => ({ combatId, victory: true, inventory: {}, participants: [], unitHealth: {} } as unknown as CombatResult);
const noReward = { gold: 0, reputation: 0, materials: {} };

describe('post-demo moments in the game (set 1.20.0)', () => {
  it('registers the thirteen scripts once the Borin mock-up convinced, and the backdrops of their dialogues', () => {
    expect(Object.keys(POST_DEMO_LIVING_TABLEAUX)).toHaveLength(13);
    expect(Object.keys(POST_DEMO_LIVING_BACKDROPS)).toHaveLength(13);
  });

  for (const [plateau, honour, force] of [
    ['bear', ['bear_master_spy', 'bear_master_spy_aftermath', 'bear_honour_moment'], ['bear_borin', 'bear_trial_aftermath', 'bear_force_moment']],
    ['dragon', ['dragon_shadow_shaman', 'dragon_shaman_aftermath', 'dragon_honour_moment'], ['dragon_kaelen', 'dragon_trial_aftermath', 'dragon_force_moment']],
    ['scorpion', ['scorpion_shadow_prophet', 'scorpion_prophet_aftermath', 'scorpion_honour_moment'], ['scorpion_inquisitor', 'scorpion_trial_aftermath', 'scorpion_force_moment']],
  ] as const) {
    it(`plays the ${plateau}'s honour and force outcomes after their post-combat dialogue and before the epilogue`, async () => {
      for (const [combatId, aftermath, momentId] of [honour, force]) {
        const state = plateauState(plateau);
        const owner = app(state);
        await owner.resolveCombat(victory(combatId), bossNode(state), noReward);
        const epilogue = `${plateau}_epilogue`;
        expect(owner.playDialogue.mock.calls.map((call) => call[0])).toEqual([aftermath, epilogue]);
        expect(owner.playLivingTableau).toHaveBeenCalledWith(momentId, epilogue);
        const [after, before] = owner.playDialogue.mock.invocationCallOrder;
        const moment = owner.playLivingTableau.mock.invocationCallOrder[0]!;
        expect(after! < moment && moment < before!).toBe(true);
        // A plateau's outcome leaves no live epilogue: only the final act's breach does.
        expect(owner.liveEpilogue).toBe(false);
      }
    });
  }

  it('lets the arrival open live on the chief’s audience, never on a resume', async () => {
    const live = app(plateauState('bear'));
    const audience = live.state.run.graph.nodes.find((node) => node.contentId === 'bear_audience')! as RunNode;
    await live.resolveRunNode(audience, false);
    expect(live.playDialogue).toHaveBeenCalledWith('bear_audience', audience.label, { live: true });
    const resumed = app(plateauState('bear'));
    await resumed.resolveRunNode(audience, true);
    expect(resumed.playDialogue).toHaveBeenCalledWith('bear_audience', audience.label, { live: false });
  });

  it('opens the betrayal live only after the final was just won, never on a resume', async () => {
    const state = plateauState('finale');
    for (const flag of ['finaleTournamentEntered', 'finaleRavenBoutWon', 'finaleRavenSpared', 'finaleWolfBoutWon', 'finaleWolfSpared',
      'finalePhoenixBoutWon', 'finalePhoenixSpared']) state.flags[flag] = true;
    const owner = app(state);

    await owner.resolveCombat(victory('finale_serpent_final'), { id: 'finale-bout-serpent', type: 'combat', depth: 0, links: [], contentId: 'finale_serpent_final', label: 'Finale', icon: '⚔', x: 0, z: 0 }, noReward);
    expect(owner.liveBoardDialogueId).toBe('finale_betrayal');
    (owner as unknown as { mode: string }).mode = 'TRAVEL';
    await owner.playTournamentStep();
    expect(owner.playDialogue).toHaveBeenCalledWith('finale_betrayal', 'Finale : champion du Serpent', { live: true });
    expect(owner.liveBoardDialogueId).toBeNull();
    // After a reload the same step opens its dialogue directly.
    const resumed = app(state);
    (resumed as unknown as { mode: string }).mode = 'TRAVEL';
    await resumed.playTournamentStep();
    expect(resumed.playDialogue).toHaveBeenCalledWith('finale_betrayal', 'Finale : champion du Serpent', {});
  });

  it('opens an epilogue live only when reached from the breach just won, never on a resume', async () => {
    const state = plateauState('finale');
    const owner = app(state);
    await owner.resolveCombat(victory('finale_breach'), bossNode(state), noReward);
    expect(owner.liveEpilogue).toBe(true);
    await owner.playEpilogueStep({ kind: 'dialogue', dialogueId: 'finale_epilogue_respect' });
    expect(owner.playDialogue).toHaveBeenLastCalledWith('finale_epilogue_respect', expect.any(String), { live: true });
    expect(owner.liveEpilogue).toBe(false);
    const resumed = app(state);
    await resumed.playEpilogueStep({ kind: 'dialogue', dialogueId: 'finale_epilogue_respect' });
    expect(resumed.playDialogue).toHaveBeenLastCalledWith('finale_epilogue_respect', expect.any(String), {});
  });
});

describe('post-demo backdrops', () => {
  it('draw only over the painting they are made for', () => {
    const backdrops = { bear_audience: { image: '/assets/generated/post-demo/bear/scenes/bear_audience.webp', frame: POST_DEMO_FRAME, backdrop: () => () => undefined } };
    expect(postDemoBackdropFor('bear_audience', 'url("/assets/generated/post-demo/bear/scenes/bear_audience.webp")', backdrops)).toBe(backdrops.bear_audience);
    expect(postDemoBackdropFor('bear_audience', 'url("/assets/generated/post-demo/bear/scenes/bear_arrival.webp")', backdrops)).toBeUndefined();
    expect(postDemoBackdropFor('bear_vigil', 'url("/assets/generated/post-demo/bear/scenes/bear_audience.webp")', backdrops)).toBeUndefined();
  });

  it('frame a 3:2 painting as the layer covers it, and keep the Lion’s by default', () => {
    const host = document.createElement('div');
    Object.defineProperty(host, 'clientWidth', { value: 1600 });
    Object.defineProperty(host, 'clientHeight', { value: 900 });
    document.body.append(host);
    const postDemo = new LivingBackdrop(host, () => undefined, false, POST_DEMO_FRAME);
    const camera = postDemo.camera();
    expect(camera.scale).toBeCloseTo(1600 / 1536);
    expect(camera.x).toBeCloseTo(0);
    expect(camera.y).toBeCloseTo((900 - 1024 * (1600 / 1536)) / 2);
    postDemo.dispose();
    const lion = new LivingBackdrop(host, () => undefined, false);
    expect(lion.camera().scale).toBeCloseTo(Math.max(1600 / 1672, 900 / 941));
    lion.dispose();
  });
});

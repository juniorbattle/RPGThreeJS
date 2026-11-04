// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameApp } from './GameApp';
import { createInitialState } from './store';
import type { CombatResult, RunNode } from './types';
import { LIVING_BACKDROPS, LIVING_TABLEAUX } from '../ui/living/livingTableaux';

afterEach(() => { vi.restoreAllMocks(); document.body.replaceChildren(); });

type Stub = ReturnType<typeof vi.fn>;
interface Owner {
  state: ReturnType<typeof createInitialState>;
  resolveRunNode(node: RunNode, initial: boolean): Promise<void>;
  resolveCombat(result: CombatResult, node: RunNode, rewards: { gold: number; reputation: number; materials: Record<string, number> }): Promise<void>;
  playDialogue: Stub; playLivingTableau: Stub; playJourneyCinematic: Stub;
}

/** A GameApp with only the owners these boundaries call, stubbed (set 1.13.0, OD-2026-11-04-A). */
function app(state = createInitialState()) {
  return Object.assign(Object.create(GameApp.prototype), {
    state, mode: 'RESULT', pendingCombatId: null, disposed: false,
    playDialogue: vi.fn(async () => undefined),
    playLivingTableau: vi.fn(async () => true),
    playJourneyCinematic: vi.fn(async () => undefined),
    playStandaloneCinematic: vi.fn(async () => undefined),
    playPostNodeNarrative: vi.fn(async () => false),
    enterCampaignPresentation: vi.fn(async () => undefined),
    flushPendingCombat: vi.fn(async () => undefined),
    restoreAfterDefeat: vi.fn(),
  }) as unknown as Owner;
}
const node = (id: string) => createInitialState().run.graph.nodes.find((candidate) => candidate.id === id)! as RunNode;
const victory = (combatId: string): CombatResult => ({ combatId, victory: true, inventory: {}, participants: [], unitHealth: {} } as unknown as CombatResult);

describe('living tableaux in the game (sets 1.13.0 and 1.14.0)', () => {
  it('names exactly the seven moments and the dialogues each one keeps alive', () => {
    expect(Object.keys(LIVING_TABLEAUX).sort()).toEqual([
      'alaric_audience_arrival', 'bois_clair_arrival', 'bois_clair_sacrificed', 'bois_clair_saved', 'lion_judgement', 'lion_trial_route_ending', 'serpent_route_ending',
    ]);
    expect([...new Set(Object.values(LIVING_BACKDROPS))].sort()).toEqual(Object.keys(LIVING_TABLEAUX).sort());
    const forty = new Set(['lion_judgement', 'serpent_route_ending', 'lion_trial_route_ending']);
    for (const script of Object.values(LIVING_TABLEAUX)) {
      expect(script.backdrop, script.id).toBeTypeOf('function');
      const total = script.shots.reduce((sum, shot) => sum + shot.seconds, 0);
      expect(total, script.id).toBeLessThanOrEqual(forty.has(script.id) ? 40 : 30);
    }
  });

  it('opens the audience live on arrival, and never on a resume', async () => {
    const live = app();
    await live.resolveRunNode(node('lion-audience'), false);
    expect(live.playDialogue).toHaveBeenCalledWith('lion_briefing', 'Audience d’Alaric', { live: true });
    const resumed = app();
    await resumed.resolveRunNode(node('lion-audience'), true);
    expect(resumed.playDialogue).toHaveBeenCalledWith('lion_briefing', 'Audience d’Alaric', { live: false });
  });

  it('plays the Serpent route ending after its aftermath dialogue and before the epilogue, instead of the static still', async () => {
    const owner = app();
    await owner.resolveCombat(victory('serpent_captain'), node('lion-final-judgement'), { gold: 0, reputation: 0, materials: {} });
    expect(owner.playLivingTableau).toHaveBeenCalledWith('serpent_route_ending', 'epilogue');
    expect(owner.playJourneyCinematic).not.toHaveBeenCalledWith('serpent_route_ending', expect.anything());
    const calls = owner.playDialogue.mock.calls.map((call) => call[0]);
    expect(calls).toEqual(['serpent_general_aftermath', 'epilogue']);
    const order = owner.playDialogue.mock.invocationCallOrder;
    const ending = owner.playLivingTableau.mock.invocationCallOrder[0]!;
    expect(order[0]!).toBeLessThan(ending);
    expect(ending).toBeLessThan(order[1]!);
  });

  it('plays the Lion trial route ending after a won trial, and falls back on the static still when it cannot show', async () => {
    const owner = app();
    owner.state.flags.lionTrialRequested = true;
    await owner.resolveCombat(victory('lion_chief'), node('lion-final-judgement'), { gold: 0, reputation: 0, materials: {} });
    expect(owner.playLivingTableau).toHaveBeenCalledWith('lion_trial_route_ending', 'epilogue');
    expect(owner.playDialogue.mock.calls.map((call) => call[0])).toEqual(['lion_trial_aftermath', 'epilogue']);
    const missing = app();
    missing.playLivingTableau.mockResolvedValueOnce(false);
    missing.state.flags.lionTrialRequested = true;
    await missing.resolveCombat(victory('lion_chief'), node('lion-final-judgement'), { gold: 0, reputation: 0, materials: {} });
    expect(missing.playJourneyCinematic).toHaveBeenCalledWith('lion_trial_route_ending', 'Épilogue');
  });

  it('opens the Bois-Clair dialogue live on arrival, and never on a resume', async () => {
    const live = app();
    await live.resolveRunNode(node('lion-village-choice'), false);
    expect(live.playDialogue).toHaveBeenCalledWith('village_choice', 'Bois-Clair assiégé', { live: true });
    const resumed = app();
    await resumed.resolveRunNode(node('lion-village-choice'), true);
    expect(resumed.playDialogue).toHaveBeenCalledWith('village_choice', 'Bois-Clair assiégé', { live: false });
  });

  it('opens the judgement live on arrival, and never on a resume', async () => {
    const live = app();
    await live.resolveRunNode(node('lion-final-judgement'), false);
    expect(live.playDialogue).toHaveBeenCalledWith('lion_finale_judgement', 'Jugement du Sceau', { live: true });
    const resumed = app();
    await resumed.resolveRunNode(node('lion-final-judgement'), true);
    expect(resumed.playDialogue).toHaveBeenCalledWith('lion_finale_judgement', 'Jugement du Sceau', { live: false });
  });

  it('plays the sacrificed outcome after a won raid, before its aftermath, instead of the static journey moment', async () => {
    const owner = app();
    owner.state.flags.missionGreed = true;
    await owner.resolveCombat(victory('village_raid'), node('lion-village-choice'), { gold: 0, reputation: 0, materials: {} });
    expect(owner.playLivingTableau).toHaveBeenCalledWith('bois_clair_sacrificed', 'village_raid_aftermath');
    expect(owner.playJourneyCinematic).not.toHaveBeenCalled();
    expect(owner.playLivingTableau.mock.invocationCallOrder[0]).toBeLessThan(owner.playDialogue.mock.invocationCallOrder[0]!);
    expect(owner.playDialogue).toHaveBeenCalledWith('village_raid_aftermath', expect.anything());
  });

  it('plays the saved outcome after a won defence, and nothing after a defeat', async () => {
    const saved = app();
    saved.state.flags.missionSuccess = true;
    await saved.resolveCombat(victory('village_defense'), node('lion-village-choice'), { gold: 0, reputation: 0, materials: {} });
    expect(saved.playLivingTableau).toHaveBeenCalledWith('bois_clair_saved', 'village_defense_aftermath');
    const lost = app();
    lost.state.flags.missionSuccess = true;
    await lost.resolveCombat({ ...victory('village_defense'), victory: false }, node('lion-village-choice'), { gold: 0, reputation: 0, materials: {} });
    expect(lost.playLivingTableau).not.toHaveBeenCalled();
  });
});

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

describe('living tableaux in the game (set 1.13.0)', () => {
  it('names exactly the four moments and the dialogue each one keeps alive', () => {
    expect(Object.keys(LIVING_TABLEAUX).sort()).toEqual(['bois_clair_arrival', 'bois_clair_sacrificed', 'bois_clair_saved', 'lion_judgement']);
    expect(Object.values(LIVING_BACKDROPS).sort()).toEqual(Object.keys(LIVING_TABLEAUX).sort());
    for (const script of Object.values(LIVING_TABLEAUX)) {
      expect(script.backdrop, script.id).toBeTypeOf('function');
      const total = script.shots.reduce((sum, shot) => sum + shot.seconds, 0);
      expect(total, script.id).toBeLessThanOrEqual(script.id === 'lion_judgement' ? 40 : 30);
    }
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

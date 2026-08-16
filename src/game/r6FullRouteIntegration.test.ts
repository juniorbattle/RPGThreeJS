import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { combatConfigs, dialogues } from './content';
import { ateSeenFlag, evaluateDialogueCondition, type ContextualDialogueDefinition } from './contextualDialogue';
import {
  CONTEXTUAL_ATE_RULES,
  CONTEXTUAL_DIALOGUE_DEFINITIONS,
  resolveGameAteRules,
  resolveGameDialogue,
} from './contextualDialogueContent';
import {
  LION_FINALE_SERPENT_SELECTED_FLAG,
  LION_FINALE_TRIAL_SELECTED_FLAG,
  buildLionContextualDialogue,
  lionBossVictoryFacts,
  resolveLionFinaleExecution,
  resolvePendingLionFinaleCombat,
  resolveSelectedLionFinaleCombat,
} from './lionFinale';
import { resolveLionNarrativeState } from './lionNarrative';
import { resolveLionVerdict } from './lionVerdict';
import { changeReputation } from './reputation';
import {
  getReputationEventOpportunity,
  REPUTATION_EVENT_DEFINITIONS,
  REPUTATION_EVENT_DIALOGUE_DEFINITIONS,
  selectGameReputationEvent,
} from './reputationEventContent';
import { readReputationEventOccurrences, recordReputationEventSelection } from './reputationEventDirector';
import {
  addTemporaryLoot,
  createRunState,
  enterRunNode,
  generateRunGraph,
  getAvailableRunNodes,
  getRunNode,
  secureRunLoot,
} from './runSystem';
import { createUnitInstance } from './catalog';
import { createInitialState } from './store';
import { gameStateSchema, type DialogueSequence, type GameState, type RunNode } from './types';

const LEGACY_COMPATIBILITY_DIALOGUES = new Set([
  'mystery_ambush',
  'mystery_troll_crossing',
  'serpent_duelist_trial',
]);

const ADAPTIVE_EVENT_DIALOGUES = new Set([
  'mystery_help',
  'mystery_treasure',
  'old_shrine_event',
  'mystery_dragon_roost',
  'serpent_informant',
  'mystery_shrine',
]);

const OPTIONAL_COMBAT_IDS = new Set([
  'forest_patrol', 'spider_nest', 'serpent_reprisals', 'serpent_checkpoint',
  'ruins_guardians', 'serpent_hunters', 'serpent_duelist_trial',
  'troll_crossing', 'young_dragon_roost',
]);

function roundTrip(state: GameState): GameState {
  return gameStateSchema.parse(JSON.parse(JSON.stringify(state)));
}

function finishChapterId(sequence: DialogueSequence): string {
  for (const step of sequence.steps) {
    for (const effect of step.effects) {
      if (effect.type === 'finishChapter') return effect.endingId;
    }
  }
  throw new Error(`Dialogue '${sequence.id}' has no finishChapter effect.`);
}

function definitionBase(id: string): DialogueSequence {
  const base = buildLionContextualDialogue(id, createInitialState()) ?? dialogues.get(id);
  if (!base) throw new Error(`Missing contextual base '${id}'.`);
  return base;
}

function expectDefinitionReferences(id: string, definition: ContextualDialogueDefinition): void {
  const base = definitionBase(id);
  const steps = new Map(base.steps.map((step) => [step.id, step]));
  for (const variant of definition.variants ?? []) {
    for (const patch of variant.stepPatches) {
      expect(steps.has(patch.stepId), `${id}:${variant.id}:${patch.stepId}`).toBe(true);
    }
  }
  for (const optional of definition.optionalSteps ?? []) {
    const anchor = steps.get(optional.afterStepId);
    expect(anchor, `${id}:${optional.id}:anchor`).toBeDefined();
    expect(anchor?.choices ?? [], `${id}:${optional.id}:linear anchor`).toHaveLength(0);
    expect(optional.id).toBe(optional.step.id);
    expect(steps.has(optional.id), `${id}:${optional.id}:unique`).toBe(false);
  }
}

type Mandate = 'honour' | 'advance';
type RefugeeOutcome = 'helped' | 'exploited';
type ReserveOutcome = 'village' | 'loot';
type BoisClairOutcome = 'saved' | 'sacrificed';
type WitnessOutcome = 'supportive' | 'unprotected' | 'silenced' | 'none';
type ShadowOutcome = 'none' | 'fragments' | 'evidence';
type DisclosureOutcome = 'undecided' | 'revealed' | 'concealed';

interface GoldenProfile {
  id: string;
  seed: number;
  reputation: number;
  mandate: Mandate;
  refugees: RefugeeOutcome;
  reserve: ReserveOutcome;
  boisClair: BoisClairOutcome;
  witnesses: WitnessOutcome;
  shadow: ShadowOutcome;
  disclosure: DisclosureOutcome;
  cedric: boolean;
  claimedTreasure?: boolean;
  intent?: 'claim_recognition' | 'request_trial';
  expected: {
    conduct: 'honour' | 'uncertain' | 'infamy';
    witness: 'none' | 'supportive' | 'unprotected' | 'silenced';
    stance: 'respect' | 'respect_with_reservations' | 'uncertain' | 'distrust' | 'hostile';
    route: 'serpent_pursuit' | 'lion_trial';
    cause: 'voluntary' | 'rejected_claim' | null;
    endingId: string;
  };
}

interface GoldenRunResult {
  profileId: string;
  adaptiveChoices: Array<{ afterNodeId: string; contentIds: string[]; selected: string }>;
  timeline: string[];
  ateIds: string[];
  reputationEventIds: Array<string | null>;
  snapshots: Record<string, GameState>;
  verdict: ReturnType<typeof resolveLionVerdict>;
  route: 'serpent_pursuit' | 'lion_trial';
  cause: 'voluntary' | 'rejected_claim' | null;
  combatId: 'serpent_captain' | 'lion_chief';
  preDialogueId: string;
  postDialogueId: string;
  endingId: string;
  state: GameState;
}

const GOLDEN_PROFILES: readonly GoldenProfile[] = [
  {
    id: 'pure honour', seed: 6101, reputation: 65, mandate: 'honour', refugees: 'helped', reserve: 'village',
    boisClair: 'saved', witnesses: 'supportive', shadow: 'evidence', disclosure: 'revealed', cedric: true,
    expected: { conduct: 'honour', witness: 'supportive', stance: 'respect', route: 'serpent_pursuit', cause: null, endingId: 'lion-seal-serpent-truth' },
  },
  {
    id: 'real mixed', seed: 6102, reputation: 38, mandate: 'advance', refugees: 'helped', reserve: 'loot',
    boisClair: 'saved', witnesses: 'supportive', shadow: 'evidence', disclosure: 'concealed', cedric: true, claimedTreasure: true,
    expected: { conduct: 'honour', witness: 'supportive', stance: 'respect_with_reservations', route: 'serpent_pursuit', cause: null, endingId: 'lion-seal-serpent' },
  },
  {
    id: 'uncertain', seed: 6103, reputation: 30, mandate: 'advance', refugees: 'helped', reserve: 'loot',
    boisClair: 'saved', witnesses: 'none', shadow: 'fragments', disclosure: 'undecided', cedric: true,
    expected: { conduct: 'uncertain', witness: 'none', stance: 'uncertain', route: 'lion_trial', cause: 'rejected_claim', endingId: 'lion-seal-trial' },
  },
  {
    id: 'infamy', seed: 6104, reputation: 15, mandate: 'advance', refugees: 'exploited', reserve: 'loot',
    boisClair: 'sacrificed', witnesses: 'silenced', shadow: 'fragments', disclosure: 'undecided', cedric: true,
    expected: { conduct: 'infamy', witness: 'silenced', stance: 'hostile', route: 'lion_trial', cause: 'rejected_claim', endingId: 'lion-seal-trial' },
  },
  {
    id: 'high reputation plus infamy', seed: 6105, reputation: 90, mandate: 'advance', refugees: 'exploited', reserve: 'loot',
    boisClair: 'sacrificed', witnesses: 'silenced', shadow: 'fragments', disclosure: 'undecided', cedric: true,
    expected: { conduct: 'infamy', witness: 'silenced', stance: 'hostile', route: 'lion_trial', cause: 'rejected_claim', endingId: 'lion-seal-trial' },
  },
  {
    id: 'low reputation plus honour', seed: 6106, reputation: 10, mandate: 'honour', refugees: 'helped', reserve: 'village',
    boisClair: 'saved', witnesses: 'supportive', shadow: 'evidence', disclosure: 'revealed', cedric: true,
    expected: { conduct: 'honour', witness: 'supportive', stance: 'respect', route: 'serpent_pursuit', cause: null, endingId: 'lion-seal-serpent-truth' },
  },
  {
    id: 'saved village plus silenced witnesses', seed: 6107, reputation: 55, mandate: 'honour', refugees: 'helped', reserve: 'village',
    boisClair: 'saved', witnesses: 'silenced', shadow: 'evidence', disclosure: 'revealed', cedric: true,
    expected: { conduct: 'honour', witness: 'silenced', stance: 'distrust', route: 'lion_trial', cause: 'rejected_claim', endingId: 'lion-seal-trial-truth' },
  },
  {
    id: 'Cedric absent', seed: 6108, reputation: 65, mandate: 'honour', refugees: 'helped', reserve: 'village',
    boisClair: 'saved', witnesses: 'supportive', shadow: 'evidence', disclosure: 'revealed', cedric: false,
    expected: { conduct: 'honour', witness: 'supportive', stance: 'respect', route: 'serpent_pursuit', cause: null, endingId: 'lion-seal-serpent-truth' },
  },
  {
    id: 'Shadow reveal', seed: 6109, reputation: 50, mandate: 'honour', refugees: 'helped', reserve: 'village',
    boisClair: 'saved', witnesses: 'supportive', shadow: 'evidence', disclosure: 'revealed', cedric: true,
    expected: { conduct: 'honour', witness: 'supportive', stance: 'respect', route: 'serpent_pursuit', cause: null, endingId: 'lion-seal-serpent-truth' },
  },
  {
    id: 'Shadow conceal', seed: 6110, reputation: 50, mandate: 'honour', refugees: 'helped', reserve: 'village',
    boisClair: 'saved', witnesses: 'supportive', shadow: 'evidence', disclosure: 'concealed', cedric: true,
    expected: { conduct: 'honour', witness: 'supportive', stance: 'respect', route: 'serpent_pursuit', cause: null, endingId: 'lion-seal-serpent' },
  },
  {
    id: 'voluntary trial', seed: 6111, reputation: 55, mandate: 'honour', refugees: 'helped', reserve: 'village',
    boisClair: 'saved', witnesses: 'supportive', shadow: 'evidence', disclosure: 'revealed', cedric: true, intent: 'request_trial',
    expected: { conduct: 'honour', witness: 'supportive', stance: 'respect', route: 'lion_trial', cause: 'voluntary', endingId: 'lion-seal-trial-truth' },
  },
];

function applyProfileMilestone(state: GameState, profile: GoldenProfile, nodeId: string): void {
  if (nodeId === 'lion-audience') {
    state.flags.lionMissionAccepted = true;
    state.flags[profile.mandate === 'honour' ? 'lionMandateHonour' : 'lionMandateAdvance'] = true;
  }
  if (nodeId === 'lion-nomad-crossroads' && profile.cedric) {
    state.flags.recruitedCedric = true;
    if (!state.clan.members.some((unit) => unit.definitionId === 'rogue')) {
      state.clan.members.push(createUnitInstance('rogue'));
    }
  }
  if (nodeId === 'lion-refugees') {
    state.flags[profile.refugees === 'helped' ? 'helpedRefugees' : 'exploitedRefugees'] = true;
  }
  if (nodeId === 'lion-first-trial-event' && profile.claimedTreasure) state.flags.claimedLostTreasure = true;
  if (nodeId === 'lion-reserve-trail') {
    state.flags[profile.reserve === 'village' ? 'prioritizedVillage' : 'prioritizedLoot'] = true;
  }
  if (nodeId === 'lion-village-choice') {
    state.flags[profile.boisClair === 'saved' ? 'missionSuccess' : 'missionGreed'] = true;
  }
  if (nodeId === 'lion-witnesses') {
    if (profile.witnesses === 'supportive') state.flags.protectedWitnesses = true;
    if (profile.witnesses === 'silenced') state.flags.silencedWitnesses = true;
    if (profile.witnesses === 'unprotected') state.flags.missionGreed = true;
  }
  if (nodeId === 'lion-shadow-signs') {
    if (profile.shadow === 'evidence') state.flags.shadowEvidence = true;
    if (profile.shadow === 'fragments') state.flags.shadowFragments = true;
    if (profile.disclosure === 'revealed') state.flags.shadowRevealed = true;
    if (profile.disclosure === 'concealed') state.flags.shadowConcealed = true;
  }
}

function boundaryName(nodeId: string): string | null {
  if (nodeId === 'lion-opening-ambush') return 'A_after_opening_combat';
  if (nodeId === 'lion-first-refuge') return 'B_first_refuge';
  if (nodeId === 'lion-second-trial-event') return 'C_before_bois_clair';
  if (nodeId === 'lion-village-choice') return 'D_after_bois_clair';
  if (nodeId === 'lion-witnesses') return 'E_after_witnesses';
  if (nodeId === 'lion-shadow-signs') return 'F_after_shadow_signs';
  if (nodeId === 'lion-final-refuge') return 'G_final_refuge';
  return null;
}

function processResolvedNode(
  state: GameState,
  profile: GoldenProfile,
  node: RunNode,
  timeline: string[],
  ateIds: string[],
  eventIds: Array<string | null>,
): void {
  applyProfileMilestone(state, profile, node.id);
  if (node.type === 'combat' || node.id === 'lion-village-choice') {
    addTemporaryLoot(state.run, { gold: 10 });
  }
  if (node.type === 'refuge') secureRunLoot(state);
  if (!state.resolvedNodeIds.includes(node.id)) state.resolvedNodeIds.push(node.id);
  for (const rule of resolveGameAteRules(node.id, state)) {
    timeline.push(`${node.id}:ATE:${rule.id}`);
    ateIds.push(rule.id);
    if (rule.once) state.flags[ateSeenFlag(rule)] = true;
  }
  const selection = selectGameReputationEvent(node.id, state);
  if (selection) {
    eventIds.push(selection.selectedEvent?.id ?? null);
    timeline.push(`${node.id}:R4:${selection.selectedEvent?.id ?? 'NO_EVENT'}`);
    recordReputationEventSelection(state, selection);
  }
}

function runGoldenProfile(profile: GoldenProfile): GoldenRunResult {
  const state = createInitialState();
  state.run = createRunState(profile.seed);
  state.currentNodeId = state.run.currentNodeId;
  state.visitedNodeIds = [...state.run.visitedNodeIds];
  state.reputation = profile.reputation - 1;
  changeReputation(state, 1, 'r6:opening-baseline');
  const timeline: string[] = [];
  const ateIds: string[] = [];
  const reputationEventIds: Array<string | null> = [];
  const adaptiveChoices: GoldenRunResult['adaptiveChoices'] = [];
  const snapshots: Record<string, GameState> = {};

  let current = getRunNode(state.run)!;
  while (current.id !== 'lion-final-judgement') {
    processResolvedNode(state, profile, current, timeline, ateIds, reputationEventIds);
    const boundary = boundaryName(current.id);
    if (boundary) snapshots[boundary] = roundTrip(state);

    const available = getAvailableRunNodes(state);
    expect(available.length, `${profile.id}:${current.id}:progress`).toBeGreaterThan(0);
    const selected = available.find((node) => node.type !== 'combat') ?? available[0]!;
    if (available.length > 1) {
      adaptiveChoices.push({
        afterNodeId: current.id,
        contentIds: available.map((node) => node.contentId),
        selected: selected.contentId,
      });
    }
    const entered = enterRunNode(state.run, selected.id)!;
    state.currentNodeId = entered.id;
    state.visitedNodeIds = [...state.run.visitedNodeIds];
    state.stepCounter += 1;
    current = entered;
    if (current.id === 'lion-final-judgement') {
      snapshots.H_before_alaric_judgement = roundTrip(state);
    }
  }

  const intent = profile.intent ?? 'claim_recognition';
  const execution = resolveLionFinaleExecution(state, intent);
  Object.assign(state.flags, execution.flagChanges);
  if (execution.reputationDelta !== 0) {
    changeReputation(state, execution.reputationDelta, `lion-finale:${execution.trialCause ?? execution.route}`);
  }
  snapshots.I_after_final_route_selection = roundTrip(state);
  expect(resolveSelectedLionFinaleCombat(snapshots.I_after_final_route_selection.flags)).toBe(execution.combatId);

  const bossConfig = combatConfigs.get(execution.combatId)!;
  Object.assign(state.flags, lionBossVictoryFacts(execution.combatId));
  addTemporaryLoot(state.run, { gold: bossConfig.rewards.gold });
  state.run.status = 'completed';
  if (!state.resolvedNodeIds.includes(current.id)) state.resolvedNodeIds.push(current.id);
  secureRunLoot(state);
  snapshots.J_after_final_victory = roundTrip(state);

  const postDialogueId = bossConfig.postCombatDialogueId!;
  expect(resolveGameDialogue(postDialogueId, state)).not.toBeNull();
  const epilogue = resolveGameDialogue('epilogue', state)!.sequence;
  state.endingId = finishChapterId(epilogue);
  const verdict = resolveLionVerdict({ flags: state.flags, reputation: state.reputation });

  return {
    profileId: profile.id,
    adaptiveChoices,
    timeline,
    ateIds,
    reputationEventIds,
    snapshots,
    verdict,
    route: execution.route,
    cause: execution.trialCause,
    combatId: execution.combatId,
    preDialogueId: bossConfig.preCombatDialogueId!,
    postDialogueId,
    endingId: state.endingId,
    state: roundTrip(state),
  };
}

describe('R6 runtime ownership and ordering lock', () => {
  it('keeps authored contextual ATEs before optional R4 events in GameApp', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/game/GameApp.ts'), 'utf8');
    const methodStart = source.indexOf('private async playPostNodeNarrative');
    const methodEnd = source.indexOf('\n  private async applyEffects', methodStart);
    const method = source.slice(methodStart, methodEnd);
    expect(method.indexOf('await this.maybePlayATEs(nodeId)')).toBeGreaterThan(0);
    expect(method.indexOf('await this.maybePlayReputationEvent(nodeId)'))
      .toBeGreaterThan(method.indexOf('await this.maybePlayATEs(nodeId)'));

    const dualTriggerNodes = CONTEXTUAL_ATE_RULES
      .map((rule) => rule.triggerNodeId)
      .filter((nodeId) => getReputationEventOpportunity(nodeId, createInitialState()) !== null);
    expect(new Set(dualTriggerNodes)).toEqual(new Set(['lion-first-refuge', 'lion-village-choice']));
  });

  it('persists and resumes an already-selected finale without reapplying selection effects', () => {
    for (const profile of [GOLDEN_PROFILES[0]!, GOLDEN_PROFILES[3]!, GOLDEN_PROFILES[10]!]) {
      const result = runGoldenProfile(profile);
      const selected = result.snapshots.I_after_final_route_selection!;
      expect(resolveSelectedLionFinaleCombat(selected.flags)).toBe(result.combatId);
      expect(resolvePendingLionFinaleCombat(selected.flags)).toBe(result.combatId);
      expect(resolvePendingLionFinaleCombat(result.snapshots.J_after_final_victory!.flags)).toBeNull();
      expect(roundTrip(selected)).toEqual(selected);
    }

    expect(resolveSelectedLionFinaleCombat({
      [LION_FINALE_SERPENT_SELECTED_FLAG]: true,
      [LION_FINALE_TRIAL_SELECTED_FLAG]: true,
    })).toBe('lion_chief');

    const source = readFileSync(resolve(process.cwd(), 'src/game/GameApp.ts'), 'utf8');
    const finaleCase = source.slice(source.indexOf("case 'resolveLionFinale':"), source.indexOf("case 'finishChapter':"));
    expect(finaleCase.indexOf('resolveSelectedLionFinaleCombat(this.state.flags)'))
      .toBeLessThan(finaleCase.indexOf('resolveLionFinaleExecution(this.state, effect.intent)'));
    expect(finaleCase).toContain('this.saves.saveAuto(this.state)');

    const continueMethod = source.slice(
      source.indexOf('private async continueChronicle'),
      source.indexOf('\n  private setMode', source.indexOf('private async continueChronicle')),
    );
    expect(continueMethod).toContain('resolvePendingLionFinaleCombat(this.state.flags)');
    expect(continueMethod).toContain('pendingFinaleCombat !== null || !this.state.resolvedNodeIds.includes(current.id)');
  });
});

describe('R6 content reachability and reference integrity', () => {
  it('classifies every static dialogue with no unexplained production dead content', () => {
    const production = new Set<string>(['acte_ouverture', 'epilogue']);
    for (const node of generateRunGraph(6100).nodes) {
      if (node.type !== 'combat') production.add(node.contentId);
    }
    for (const id of ADAPTIVE_EVENT_DIALOGUES) production.add(id);
    for (const combat of combatConfigs.values()) {
      production.add(combat.preCombatDialogueId!);
      production.add(combat.postCombatDialogueId!);
    }
    for (const rule of CONTEXTUAL_ATE_RULES) production.add(rule.dialogueId);
    for (const event of REPUTATION_EVENT_DEFINITIONS) production.add(event.dialogueId);
    for (const id of Object.keys(CONTEXTUAL_DIALOGUE_DEFINITIONS)) production.add(id);
    for (const id of Object.keys(REPUTATION_EVENT_DIALOGUE_DEFINITIONS)) production.add(id);

    const unexplained = [...dialogues.keys()].filter((id) => (
      !production.has(id) && !LEGACY_COMPATIBILITY_DIALOGUES.has(id)
    ));
    expect(unexplained).toEqual([]);
    expect([...LEGACY_COMPATIBILITY_DIALOGUES].every((id) => dialogues.has(id))).toBe(true);
    expect(dialogues.size).toBe(71);
  });

  it('validates every combat, ATE, R4, and contextual patch/anchor reference', () => {
    const runNodeIds = new Set(generateRunGraph(6100).nodes.map((node) => node.id));
    expect(combatConfigs.size).toBe(17);
    for (const combat of combatConfigs.values()) {
      expect(combat.preCombatDialogueId, `${combat.id}:pre`).toBeTruthy();
      expect(combat.postCombatDialogueId, `${combat.id}:post`).toBeTruthy();
      expect(resolveGameDialogue(combat.preCombatDialogueId!, createInitialState())).not.toBeNull();
      expect(resolveGameDialogue(combat.postCombatDialogueId!, createInitialState())).not.toBeNull();
    }
    for (const rule of CONTEXTUAL_ATE_RULES) {
      expect(runNodeIds.has(rule.triggerNodeId), rule.id).toBe(true);
      expect(dialogues.has(rule.dialogueId), rule.id).toBe(true);
    }
    for (const event of REPUTATION_EVENT_DEFINITIONS) {
      expect(dialogues.has(event.dialogueId), event.id).toBe(true);
      expect(resolveGameDialogue(event.dialogueId, createInitialState())).not.toBeNull();
    }
    for (const [id, definition] of Object.entries(CONTEXTUAL_DIALOGUE_DEFINITIONS)) {
      expectDefinitionReferences(id, definition);
    }
    for (const [id, definition] of Object.entries(REPUTATION_EVENT_DIALOGUE_DEFINITIONS)) {
      expectDefinitionReferences(id, definition);
    }
  });

  it('keeps all R4 scenes social and incapable of inventing Shadow knowledge or combat', () => {
    for (const event of REPUTATION_EVENT_DEFINITIONS) {
      const sequence = dialogues.get(event.dialogueId)!;
      const effects = sequence.steps.flatMap((step) => [
        ...step.effects,
        ...(step.choices ?? []).flatMap((choice) => choice.effects),
      ]);
      expect(effects.some((effect) => effect.type === 'startCombat'), event.id).toBe(false);
      expect(effects.some((effect) => effect.type === 'setFlag' && [
        'shadowFragments', 'shadowEvidence', 'shadowRevealed', 'shadowConcealed',
      ].includes(effect.key)), event.id).toBe(false);
    }
  });
});

describe('R6 authoritative topology', () => {
  it('keeps the 21-node depth-17 acyclic braid fully reachable with valid joins', () => {
    for (const seed of [0, 1, 6100, 0x7fffffff]) {
      const graph = generateRunGraph(seed);
      const byId = new Map(graph.nodes.map((node) => [node.id, node]));
      expect(graph.nodes).toHaveLength(21);
      expect(Math.max(...graph.nodes.map((node) => node.depth))).toBe(17);
      expect(new Set(graph.nodes.map((node) => node.id)).size).toBe(21);
      const terminal = graph.nodes.filter((node) => node.links.length === 0);
      expect(terminal.map((node) => node.id)).toEqual(['lion-final-judgement']);
      for (const node of graph.nodes) {
        if (node.id !== 'lion-final-judgement') expect(node.links.length, node.id).toBeGreaterThan(0);
        for (const link of node.links) {
          const target = byId.get(link);
          expect(target, `${node.id}->${link}`).toBeDefined();
          expect(target!.depth, `${node.id}->${link}:forward`).toBeGreaterThan(node.depth);
        }
        if (node.type === 'combat') expect(combatConfigs.has(node.contentId), node.id).toBe(true);
        else if (node.type !== 'refuge' && node.type !== 'shop') {
          expect(resolveGameDialogue(node.contentId, createInitialState()), node.id).not.toBeNull();
        }
      }

      const reached = new Set<string>();
      const visit = (id: string) => {
        if (reached.has(id)) return;
        reached.add(id);
        for (const next of byId.get(id)!.links) visit(next);
      };
      visit('lion-camp');
      expect(reached.size).toBe(21);
    }
  });

  it('reveals forward links coherently and preserves valid checkpoints', () => {
    const state = createInitialState();
    while (getRunNode(state.run)!.id !== 'lion-final-judgement') {
      const current = getRunNode(state.run)!;
      const available = getAvailableRunNodes(state);
      const next = available.find((node) => node.type !== 'combat') ?? available[0]!;
      expect(current.links).toContain(next.id);
      expect(enterRunNode(state.run, next.id)?.id).toBe(next.id);
      expect(state.run.revealedNodeIds).toEqual(expect.arrayContaining([next.id, ...next.links]));
      if (next.type === 'refuge') {
        secureRunLoot(state);
        expect(getRunNode(state.run, state.run.checkpointNodeId)?.type).toBe('refuge');
      }
    }
  });
});

describe('R6 deterministic end-to-end golden runs', () => {
  it.each(GOLDEN_PROFILES)('$id reaches the expected route and completed ending', (profile) => {
    const first = runGoldenProfile(profile);
    const second = runGoldenProfile(profile);
    expect(second).toEqual(first);
    expect(first.verdict.conductTier).toBe(profile.expected.conduct);
    expect(first.verdict.witnessState).toBe(profile.expected.witness);
    expect(first.verdict.stance).toBe(profile.expected.stance);
    expect(first.route).toBe(profile.expected.route);
    expect(first.cause).toBe(profile.expected.cause);
    expect(first.endingId).toBe(profile.expected.endingId);
    expect(first.combatId).toBe(first.route === 'serpent_pursuit' ? 'serpent_captain' : 'lion_chief');
    expect(first.preDialogueId).toBe(first.route === 'serpent_pursuit' ? 'serpent_pursuit_pre_combat' : 'pre_lion_chief');
    expect(first.postDialogueId).toBe(first.route === 'serpent_pursuit' ? 'serpent_general_aftermath' : 'lion_trial_aftermath');
    expect(first.state.flags.lionSealAcknowledged).toBe(true);
    expect(first.state.run.status).toBe('completed');
    expect(first.state.endingId).toBe(profile.expected.endingId);
    expect(first.state.resolvedNodeIds).toContain('lion-final-judgement');
    expect(readReputationEventOccurrences(first.state).length).toBeLessThanOrEqual(2);
    expect(new Set(readReputationEventOccurrences(first.state).map((event) => event.eventId)).size)
      .toBe(readReputationEventOccurrences(first.state).length);
    expect(first.adaptiveChoices).toHaveLength(3);
    if (profile.cedric) {
      expect(first.state.clan.members.some((unit) => unit.definitionId === 'rogue')).toBe(true);
    } else {
      expect(first.state.clan.members.some((unit) => unit.definitionId === 'rogue')).toBe(false);
    }
    if (first.route === 'lion_trial') expect(first.state.flags.serpentGeneralDefeated).not.toBe(true);
  });

  it('round-trips every required major campaign save boundary', () => {
    for (const profile of [GOLDEN_PROFILES[0]!, GOLDEN_PROFILES[3]!]) {
      const result = runGoldenProfile(profile);
      expect(Object.keys(result.snapshots).sort()).toEqual([
        'A_after_opening_combat',
        'B_first_refuge',
        'C_before_bois_clair',
        'D_after_bois_clair',
        'E_after_witnesses',
        'F_after_shadow_signs',
        'G_final_refuge',
        'H_before_alaric_judgement',
        'I_after_final_route_selection',
        'J_after_final_victory',
      ]);
      for (const [boundary, snapshot] of Object.entries(result.snapshots)) {
        expect(roundTrip(snapshot), `${profile.id}:${boundary}`).toEqual(snapshot);
        expect(snapshot.version).toBe(6);
        expect(snapshot.currentNodeId).toBe(snapshot.run.currentNodeId);
        expect(snapshot.run.revealedNodeIds.every((id) => getRunNode(snapshot.run, id)), boundary).toBe(true);
        expect(snapshot.run.visitedNodeIds.every((id) => getRunNode(snapshot.run, id)), boundary).toBe(true);
        expect(snapshot.resolvedNodeIds.every((id) => getRunNode(snapshot.run, id)), boundary).toBe(true);
        expect(resolveLionNarrativeState(snapshot.flags)).toEqual(resolveLionNarrativeState(roundTrip(snapshot).flags));
        expect(snapshot.reputationHistory.length).toBeGreaterThan(0);
      }
    }
  });

  it('locks ATE once-only and R4 uniqueness/frequency across save-load', () => {
    const result = runGoldenProfile(GOLDEN_PROFILES[0]!);
    const loaded = roundTrip(result.state);
    for (const rule of CONTEXTUAL_ATE_RULES) {
      if (result.ateIds.includes(rule.id)) {
        expect(resolveGameAteRules(rule.triggerNodeId, loaded).map((entry) => entry.id)).not.toContain(rule.id);
      }
    }
    const occurrences = readReputationEventOccurrences(loaded);
    expect(occurrences.length).toBeLessThanOrEqual(2);
    expect(new Set(occurrences.map((entry) => entry.eventId)).size).toBe(occurrences.length);
    const repeat = selectGameReputationEvent('lion-final-refuge', loaded)!;
    expect(repeat.trace.previousEventCount).toBe(occurrences.length);
    if (repeat.selectedEvent) {
      expect(occurrences.some((entry) => entry.eventId === repeat.selectedEvent!.id)).toBe(false);
    }
  });
});

describe('R6 Bois-Clair and Shadow integration gates', () => {
  it.each([
    { id: 'saved', flags: { missionSuccess: true }, reputation: 30, route: 'serpent_pursuit', saved: true, sacrificed: false },
    { id: 'sacrificed', flags: { missionGreed: true }, reputation: 30, route: 'lion_trial', saved: false, sacrificed: true },
    { id: 'contradictory legacy', flags: { missionSuccess: true, missionGreed: true }, reputation: 30, route: 'lion_trial', saved: true, sacrificed: true },
    { id: 'saved plus minor stains', flags: { missionSuccess: true, helpedRefugees: true, lionMandateAdvance: true, prioritizedLoot: true }, reputation: 30, route: 'serpent_pursuit', saved: true, sacrificed: false },
    { id: 'saved plus silenced witnesses', flags: { missionSuccess: true, helpedRefugees: true, protectedWitnesses: true, silencedWitnesses: true }, reputation: 55, route: 'lion_trial', saved: true, sacrificed: false },
    { id: 'sacrificed plus high reputation', flags: { missionGreed: true }, reputation: 95, route: 'lion_trial', saved: false, sacrificed: true },
  ])('$id preserves the decisive fact through witnesses, R4, refuge, and verdict', ({ flags, reputation, route, saved, sacrificed }) => {
    const state = createInitialState();
    state.flags = Object.fromEntries(
      Object.entries(flags).filter((entry): entry is [string, boolean] => entry[1] !== undefined),
    );
    state.reputation = reputation;
    state.stepCounter = 10;
    const verdict = resolveLionVerdict(state);
    expect(verdict.reasons.includes('saved_bois_clair')).toBe(saved);
    expect(verdict.reasons.includes('sacrificed_bois_clair')).toBe(sacrificed);
    expect(verdict.finalRoute).toBe(route);
    expect(resolveGameDialogue('ate_bois_clair_night_watch', state)).not.toBeNull();
    expect(resolveGameDialogue('witnesses_on_road', state)).not.toBeNull();
    expect(resolveGameDialogue('final_refuge', state)).not.toBeNull();
    const selection = selectGameReputationEvent('lion-village-choice', state)!;
    const trace = new Map(selection.trace.candidates.map((candidate) => [candidate.eventId, candidate]));
    if (sacrificed) {
      expect(trace.get('bois-clair-denunciation')?.status).toBe('eligible');
      expect(trace.get('village-memorial-request')?.status).toBe('rejected');
    }
    if (saved && !sacrificed) {
      expect(trace.get('village-memorial-request')?.status).toBe('eligible');
    }
  });

  it('preserves Shadow knowledge/disclosure precedence and offers disclosure at most once', () => {
    const cases = [
      { flags: {}, knowledge: 'none', disclosure: 'undecided' },
      { flags: { shadowFragments: true }, knowledge: 'fragments', disclosure: 'undecided' },
      { flags: { shadowFragments: true, shadowEvidence: true }, knowledge: 'evidence', disclosure: 'undecided' },
      { flags: { shadowEvidence: true, shadowConcealed: true }, knowledge: 'evidence', disclosure: 'concealed' },
      { flags: { shadowEvidence: true, shadowRevealed: true }, knowledge: 'evidence', disclosure: 'revealed' },
      { flags: { shadowEvidence: true, shadowRevealed: true, shadowConcealed: true }, knowledge: 'evidence', disclosure: 'revealed' },
    ] as const;
    for (const entry of cases) {
      const state = createInitialState();
      state.flags = { ...entry.flags };
      const narrative = resolveLionNarrativeState(state.flags);
      expect(narrative.shadowKnowledge).toBe(entry.knowledge);
      expect(narrative.shadowDisclosure).toBe(entry.disclosure);
      const judgement = resolveGameDialogue('lion_finale_judgement', state)!.sequence;
      const aftermath = resolveGameDialogue('serpent_general_aftermath', state)!.sequence;
      const disclosureScreens = [...judgement.steps, ...aftermath.steps].filter((step) => (
        (step.choices ?? []).some((choice) => choice.effects.some((effect) => (
          effect.type === 'setFlag' && (effect.key === 'shadowRevealed' || effect.key === 'shadowConcealed')
        )))
      ));
      expect(disclosureScreens.length).toBe(entry.knowledge === 'evidence' && entry.disclosure === 'undecided' ? 2 : entry.disclosure === 'undecided' ? 1 : 0);
      // The two undecided/evidence builders are sequential alternatives: the
      // judgement decision makes the later aftermath builder ineligible.
      if (entry.knowledge === 'evidence' && entry.disclosure === 'undecided') {
        state.flags.shadowRevealed = true;
        expect(resolveGameDialogue('serpent_general_aftermath', state)!.sequence.steps[0]!.choices).toHaveLength(0);
      }
    }
  });

  it('keeps the Lion Trial aftermath explicit that the General remains free', () => {
    const state = createInitialState();
    state.flags = { missionGreed: true, shadowEvidence: true, shadowConcealed: true, lionTrialWon: true };
    const aftermath = resolveGameDialogue('lion_trial_aftermath', state)!.sequence.steps.map((step) => step.text).join(' ');
    const epilogue = resolveGameDialogue('epilogue', state)!.sequence.steps.map((step) => step.text).join(' ');
    expect(`${aftermath} ${epilogue}`).toContain('général Serpent demeure');
    expect(state.flags.serpentGeneralDefeated).not.toBe(true);
  });

  it('keeps R4 eligibility bound to authoritative semantic resolvers', () => {
    const state = createInitialState();
    state.flags = { missionSuccess: true, missionGreed: true, protectedWitnesses: true, silencedWitnesses: true };
    const memorial = REPUTATION_EVENT_DEFINITIONS.find((event) => event.id === 'village-memorial-request')!;
    const denunciation = REPUTATION_EVENT_DEFINITIONS.find((event) => event.id === 'bois-clair-denunciation')!;
    expect(evaluateDialogueCondition(memorial.eligibility!, state)).toBe(false);
    expect(evaluateDialogueCondition(denunciation.eligibility!, state)).toBe(true);
  });
});

describe('R6 combat and finale route integration', () => {
  it('keeps adaptive combat framing valid for every production encounter', () => {
    for (const combat of combatConfigs.values()) {
      expect(resolveGameDialogue(combat.preCombatDialogueId!, createInitialState())).not.toBeNull();
      expect(resolveGameDialogue(combat.postCombatDialogueId!, createInitialState())).not.toBeNull();
      if (OPTIONAL_COMBAT_IDS.has(combat.id)) {
        expect(combat.encounterRank).not.toBe('boss');
      }
    }
  });

  it('guarantees exactly one route-specific Seal fact after either final victory', () => {
    for (const combatId of ['serpent_captain', 'lion_chief'] as const) {
      const flags = lionBossVictoryFacts(combatId);
      expect(flags.lionSealAcknowledged).toBe(true);
      expect(flags.serpentGeneralDefeated === true).toBe(combatId === 'serpent_captain');
      expect(flags.lionTrialWon === true).toBe(combatId === 'lion_chief');
      expect(Object.keys(flags).filter((key) => key === 'lionSealAcknowledged')).toHaveLength(1);
    }
  });
});

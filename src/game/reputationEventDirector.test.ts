import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dialogues } from './content';
import { CONTEXTUAL_ATE_RULES, resolveGameDialogue } from './contextualDialogueContent';
import {
  getReputationEventOpportunity,
  REPUTATION_EVENT_DEFINITIONS,
  selectGameReputationEvent,
} from './reputationEventContent';
import {
  readReputationEventOccurrences,
  recordReputationEventSelection,
  selectReputationEvent,
  type ReputationEventDefinition,
  type ReputationEventOpportunity,
  type ReputationEventSelection,
} from './reputationEventDirector';
import { createInitialState } from './store';
import { gameStateSchema, type GameState, type NarrativeEffect } from './types';

function stateAt(reputation = 50, seed = 741): GameState {
  const state = createInitialState();
  state.reputation = reputation;
  state.run.seed = seed;
  state.stepCounter = 10;
  return state;
}

function opportunity(overrides: Partial<ReputationEventOpportunity> = {}): ReputationEventOpportunity {
  return {
    key: 'test-opportunity',
    triggerNodeId: 'test-node',
    step: 10,
    tags: ['social'],
    noEventWeight: 0,
    ...overrides,
  };
}

function event(
  id: string,
  overrides: Partial<ReputationEventDefinition> = {},
): ReputationEventDefinition {
  return {
    id,
    tags: ['test'],
    baseWeight: 10,
    dialogueId: `dialogue-${id}`,
    ...overrides,
  };
}

function candidate(
  selection: ReputationEventSelection,
  eventId: string,
) {
  const trace = selection.trace.candidates.find((entry) => entry.eventId === eventId);
  if (!trace) throw new Error(`Missing candidate trace '${eventId}'.`);
  return trace;
}

function selectedIdsAcrossSeeds(
  definitions: readonly ReputationEventDefinition[],
  testOpportunity: ReputationEventOpportunity,
  reputation = 50,
): Set<string | null> {
  const selected = new Set<string | null>();
  for (let seed = 1; seed <= 300; seed += 1) {
    selected.add(selectReputationEvent(stateAt(reputation, seed), testOpportunity, definitions).selectedEvent?.id ?? null);
  }
  return selected;
}

function allEffects(dialogueId: string): NarrativeEffect[] {
  const sequence = dialogues.get(dialogueId);
  if (!sequence) throw new Error(`Missing pilot dialogue '${dialogueId}'.`);
  return sequence.steps.flatMap((step) => [
    ...step.effects,
    ...(step.choices ?? []).flatMap((choice) => [
      ...choice.effects,
      ...(choice.contest ? [...choice.contest.success.effects, ...choice.contest.failure.effects] : []),
    ]),
  ]);
}

describe('reputation event condition and weighting model', () => {
  it('reuses R3 DialogueCondition and the R1/R2 semantic resolvers', () => {
    const directorSource = readFileSync(resolve(process.cwd(), 'src/game/reputationEventDirector.ts'), 'utf8');
    const contentSource = readFileSync(resolve(process.cwd(), 'src/game/reputationEventContent.ts'), 'utf8');

    expect(directorSource).toContain('evaluateDialogueCondition');
    expect(directorSource).toContain('getReputationRule');
    for (const rawFlag of [
      'missionGreed', 'protectedWitnesses', 'silencedWitnesses',
      'shadowEvidence', 'shadowRevealed', 'shadowConcealed',
    ]) {
      expect(contentSource, `R4 content must not decode ${rawFlag}`).not.toContain(rawFlag);
    }
  });

  it('evaluates authored R3 conditions before entering the weighted pool', () => {
    const definition = event('conditional', {
      eligibility: {
        kind: 'all',
        conditions: [
          { kind: 'flag', key: 'acceptedOffer' },
          { kind: 'publicReputation', min: 40 },
          { kind: 'reputationHistory', sourcePrefix: 'choice:', minMatches: 1 },
        ],
      },
    });
    const state = stateAt(55);
    expect(candidate(selectReputationEvent(state, opportunity(), [definition]), definition.id).status).toBe('rejected');

    state.flags.acceptedOffer = true;
    state.reputationHistory.push({ delta: 4, source: 'choice:help', value: 55 });
    expect(candidate(selectReputationEvent(state, opportunity(), [definition]), definition.id).status).toBe('eligible');
  });

  it('applies low, neutral, and high social reputation modifiers by category', () => {
    const definitions = [
      event('hostile', { reputationCategory: 'hostile' }),
      event('helpful', { reputationCategory: 'helpful' }),
      event('neutral', { reputationCategory: 'neutral' }),
    ];
    const low = selectReputationEvent(stateAt(10), opportunity(), definitions);
    const middle = selectReputationEvent(stateAt(50), opportunity(), definitions);
    const high = selectReputationEvent(stateAt(90), opportunity(), definitions);

    expect(candidate(low, 'hostile').effectiveWeight).toBe(16);
    expect(candidate(middle, 'hostile').effectiveWeight).toBe(10);
    expect(candidate(high, 'hostile').effectiveWeight).toBe(5);
    expect(candidate(low, 'helpful').effectiveWeight).toBe(5.5);
    expect(candidate(middle, 'helpful').effectiveWeight).toBe(10);
    expect(candidate(high, 'helpful').effectiveWeight).toBe(15.5);
    expect(candidate(low, 'neutral').effectiveWeight).toBe(10);
    expect(candidate(high, 'neutral').effectiveWeight).toBe(10);
  });

  it('applies ambush weighting and eligible authored historical modifiers transparently', () => {
    const definition = event('reprisal', {
      reputationCategory: 'hostile',
      useAmbushWeighting: true,
      weightModifiers: [
        { id: 'history', multiplier: 1.25, when: { kind: 'flag', key: 'historyApplies' } },
        { id: 'absent', multiplier: 99, when: { kind: 'flag', key: 'absent' } },
      ],
    });
    const state = stateAt(10);
    state.flags.historyApplies = true;
    const trace = candidate(selectReputationEvent(state, opportunity(), [definition]), definition.id);

    expect(trace.reputationModifier).toBe(1.6);
    expect(trace.ambushModifier).toBe(1.7);
    expect(trace.explicitModifiers).toEqual([{ id: 'history', multiplier: 1.25 }]);
    expect(trace.effectiveWeight).toBe(34);
  });

  it('shifts weighted outcomes across lower, neutral, and higher reputation bands', () => {
    const definitions = [
      event('hostile', { reputationCategory: 'hostile' }),
      event('helpful', { reputationCategory: 'helpful' }),
    ];
    const count = (reputation: number, eventId: string): number => {
      let matches = 0;
      for (let seed = 1; seed <= 1_000; seed += 1) {
        const selected = selectReputationEvent(stateAt(reputation, seed), opportunity(), definitions);
        if (selected.selectedEvent?.id === eventId) matches += 1;
      }
      return matches;
    };

    const lowHostile = count(10, 'hostile');
    const neutralHostile = count(50, 'hostile');
    const highHostile = count(90, 'hostile');
    const lowHelpful = count(10, 'helpful');
    const neutralHelpful = count(50, 'helpful');
    const highHelpful = count(90, 'helpful');

    expect(lowHostile).toBeGreaterThan(neutralHostile);
    expect(neutralHostile).toBeGreaterThan(highHostile);
    expect(lowHelpful).toBeLessThan(neutralHelpful);
    expect(neutralHelpful).toBeLessThan(highHelpful);
  });

  it('keeps decisive negative history eligible even at high public reputation', () => {
    const state = stateAt(95);
    Object.assign(state.flags, { missionGreed: true, exploitedRefugees: true });
    const selection = selectGameReputationEvent('lion-village-choice', state)!;

    expect(candidate(selection, 'bois-clair-denunciation').status).toBe('eligible');
    expect(resolveGameDialogue('rep_event_public_petition', state)!.variantId).toBe('petition-infamy');
    const resolved = resolveGameDialogue('rep_event_bois_clair_denunciation', state)!;
    expect(resolved.variantId).toBe('denunciation-sacrifice');
    expect(resolved.sequence.steps[0]!.text).toContain('choisir les réserves');
    expect(resolved.sequence.steps[0]!.text).toContain('renommée n’effacera pas');
  });

  it('does not invent a serious-history denunciation from low reputation alone', () => {
    const state = stateAt(5);
    Object.assign(state.flags, { missionSuccess: true, helpedRefugees: true });
    const selection = selectGameReputationEvent('lion-village-choice', state)!;

    expect(candidate(selection, 'bois-clair-denunciation').rejectionReasons).toContain('condition_ineligible');
    expect(resolveGameDialogue('rep_event_roadside_intimidation', state)!.variantId).toBe('intimidation-honour');
    expect(resolveGameDialogue('rep_event_roadside_intimidation', state)!.sequence.steps[0]!.text)
      .toContain('actes sur la route sont honorables');
  });

  it('keeps weighted fallback prose coherent outside each event favored social band', () => {
    const low = stateAt(5);
    const high = stateAt(95);

    expect(resolveGameDialogue('rep_event_public_petition', low)!.variantId).toBeNull();
    expect(resolveGameDialogue('rep_event_public_petition', low)!.sequence.steps[0]!.text)
      .toContain('compagnie a les moyens d’agir');
    expect(resolveGameDialogue('rep_event_roadside_intimidation', high)!.variantId).toBeNull();
    expect(resolveGameDialogue('rep_event_roadside_intimidation', high)!.sequence.steps[0]!.text)
      .toContain('toute compagnie visible devient une cible');
  });

  it('honours semantic precedence for contradictory legacy witness and village facts', () => {
    const state = stateAt(80);
    Object.assign(state.flags, {
      missionSuccess: true,
      missionGreed: true,
      protectedWitnesses: true,
      silencedWitnesses: true,
    });
    const selection = selectGameReputationEvent('lion-final-refuge', state)!;
    const denunciation = candidate(selection, 'bois-clair-denunciation');

    expect(denunciation.status).toBe('eligible');
    expect(denunciation.explicitModifiers.map((modifier) => modifier.id)).toEqual([
      'sacrificed-village-pressure',
      'silenced-witnesses-pressure',
    ]);
    expect(resolveGameDialogue('rep_event_bois_clair_denunciation', state)!.variantId).toBe('denunciation-sacrifice');
  });
});

describe('deterministic weighted resolution', () => {
  it('resolves the same saved state and opportunity identically across save/load', () => {
    const state = stateAt(52, 912345);
    const reloaded = gameStateSchema.parse(JSON.parse(JSON.stringify(state)));
    const first = selectReputationEvent(state, opportunity(), REPUTATION_EVENT_DEFINITIONS);
    const second = selectReputationEvent(reloaded, opportunity(), REPUTATION_EVENT_DEFINITIONS);

    expect(second.selectedEvent?.id ?? null).toBe(first.selectedEvent?.id ?? null);
    expect(second.trace).toEqual(first.trace);
  });

  it('is independent of registration order and exposes stable candidate order', () => {
    const definitions = [
      event('z-low', { priority: 5, baseWeight: 3 }),
      event('b-high', { priority: 20, baseWeight: 4 }),
      event('a-high', { priority: 20, baseWeight: 5 }),
    ];
    const first = selectReputationEvent(stateAt(50, 99), opportunity(), definitions);
    const reversed = selectReputationEvent(stateAt(50, 99), opportunity(), [...definitions].reverse());

    expect(first.trace.candidateIds).toEqual(['a-high', 'b-high', 'z-low']);
    expect(reversed.trace.candidateIds).toEqual(first.trace.candidateIds);
    expect(reversed.trace.candidates).toEqual(first.trace.candidates);
    expect(reversed.selectedEvent?.id ?? null).toBe(first.selectedEvent?.id ?? null);
  });

  it('uses different stable seeds for controlled weighted variation', () => {
    const definitions = [event('a'), event('b'), event('c')];
    expect(selectedIdsAcrossSeeds(definitions, opportunity()).size).toBeGreaterThan(1);
    const source = readFileSync(resolve(process.cwd(), 'src/game/reputationEventDirector.ts'), 'utf8');
    expect(source).not.toContain('Math.random');
  });

  it('supports a legitimate deterministic no-event result with eligible candidates', () => {
    const definitions = [event('rare', { baseWeight: 1 })];
    const testOpportunity = opportunity({ noEventWeight: 100 });
    const outcomes = selectedIdsAcrossSeeds(definitions, testOpportunity);

    expect(outcomes).toContain(null);
    const noEventSeed = Array.from({ length: 300 }, (_, index) => index + 1).find((seed) => (
      selectReputationEvent(stateAt(50, seed), testOpportunity, definitions).selectedEvent === null
    ))!;
    const selection = selectReputationEvent(stateAt(50, noEventSeed), testOpportunity, definitions);
    expect(selection.trace.eligibleEventIds).toEqual(['rare']);
    expect(selection.trace.noEventSelected).toBe(true);
    expect(selection.trace.selectedEventId).toBeNull();
  });

  it('returns no event with an accurate rejection trace when nothing is eligible', () => {
    const selection = selectReputationEvent(stateAt(), opportunity({ noEventWeight: 7 }), [
      event('blocked', { eligibility: { kind: 'flag', key: 'never' } }),
      event('weightless', { baseWeight: 0 }),
    ]);

    expect(selection.selectedEvent).toBeNull();
    expect(selection.trace.totalEventWeight).toBe(0);
    expect(selection.trace.rejectedEventIds).toEqual(['blocked', 'weightless']);
    expect(candidate(selection, 'blocked').rejectionReasons).toContain('condition_ineligible');
    expect(candidate(selection, 'weightless').rejectionReasons).toContain('non_positive_base_weight');
  });

  it('rejects duplicate stable event identities', () => {
    expect(() => selectReputationEvent(stateAt(), opportunity(), [event('duplicate'), event('duplicate')]))
      .toThrow("Duplicate reputation event id 'duplicate'.");
  });
});

describe('frequency, persistence, and content boundaries', () => {
  it('records unique consumption in the existing persisted event history only after selection', () => {
    const state = stateAt();
    const definition = event('once', { unique: true, familyId: 'once-family' });
    const first = selectReputationEvent(state, opportunity(), [definition]);
    expect(first.selectedEvent?.id).toBe('once');
    expect(readReputationEventOccurrences(state)).toEqual([]);

    const marker = recordReputationEventSelection(state, first);
    expect(marker).toContain('reputation-director-event|10|test-opportunity|once|once-family');
    const reloaded = gameStateSchema.parse(JSON.parse(JSON.stringify(state)));
    const second = selectReputationEvent(reloaded, opportunity(), [definition]);
    expect(candidate(second, 'once').rejectionReasons).toContain('unique_already_consumed');
    expect(second.selectedEvent).toBeNull();
  });

  it('enforces family cooldown, global frequency spacing, and the per-run budget', () => {
    const state = stateAt();
    const firstOpportunity = opportunity({ key: 'window-one', step: 10 });
    const definitions = [
      event('first', { scope: { opportunityKeys: ['window-one'] }, familyId: 'pressure', cooldownSteps: 4 }),
      event('second', { scope: { opportunityKeys: ['window-two'] }, familyId: 'pressure', cooldownSteps: 4 }),
    ];
    recordReputationEventSelection(state, selectReputationEvent(state, firstOpportunity, definitions));

    const tooSoon = selectReputationEvent(state, opportunity({
      key: 'window-two', step: 12, minimumStepsSinceAnyEvent: 3,
    }), definitions);
    expect(candidate(tooSoon, 'second').rejectionReasons).toEqual([
      'global_frequency_cooldown',
      'family_cooldown',
    ]);

    const budgeted = selectReputationEvent(state, opportunity({
      key: 'window-two', step: 20, maxEventsPerRun: 1,
    }), definitions);
    expect(candidate(budgeted, 'second').rejectionReasons).toContain('opportunity_budget_exhausted');
  });

  it('offers only the three explicitly authored campaign opportunities', () => {
    const state = stateAt();
    expect(getReputationEventOpportunity('lion-first-refuge', state)?.key).toBe('lion-social-window-1');
    expect(getReputationEventOpportunity('lion-village-choice', state)?.key).toBe('lion-social-window-2');
    expect(getReputationEventOpportunity('lion-final-refuge', state)?.key).toBe('lion-social-window-3');
    expect(getReputationEventOpportunity('lion-witnesses', state)).toBeNull();
  });

  it('keeps the R3 ATE registry distinct from the reputation event catalog', () => {
    expect(CONTEXTUAL_ATE_RULES.length).toBeGreaterThan(0);
    expect(CONTEXTUAL_ATE_RULES.some((rule) => rule.dialogueId.startsWith('rep_event_'))).toBe(false);
    expect(REPUTATION_EVENT_DEFINITIONS.some((definition) => definition.dialogueId.startsWith('ate_'))).toBe(false);

    const source = readFileSync(resolve(process.cwd(), 'src/game/GameApp.ts'), 'utf8');
    expect(source).toContain('private async maybePlayATEs');
    expect(source).toContain('private async maybePlayReputationEvent');
    expect(source.indexOf('await this.maybePlayATEs(nodeId)'))
      .toBeLessThan(source.indexOf('await this.maybePlayReputationEvent(nodeId)'));
  });

  it('keeps every pilot social and non-combat while exposing consequence hints', () => {
    for (const definition of REPUTATION_EVENT_DEFINITIONS) {
      expect(dialogues.has(definition.dialogueId)).toBe(true);
      expect(allEffects(definition.dialogueId).some((effect) => effect.type === 'startCombat')).toBe(false);
      expect(definition.metadata?.consequenceHints?.length).toBeGreaterThan(0);
    }
  });

  it('does not add a schema field or misuse combat cooldown storage', () => {
    const initial = createInitialState();
    expect(Object.keys(initial).some((key) => key.toLowerCase().includes('director'))).toBe(false);
    expect(initial.combatCooldowns).toEqual({});

    const source = readFileSync(resolve(process.cwd(), 'src/game/reputationEventDirector.ts'), 'utf8');
    expect(source).not.toContain('combatCooldowns');
  });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dialogues } from './content';
import {
  ateSeenFlag,
  evaluateDialogueCondition,
  resolveContextualDialogue,
  resolveEligibleAteRules,
  type ContextualAteRule,
  type ContextualDialogueDefinition,
  type DialogueCondition,
} from './contextualDialogue';
import {
  CONTEXTUAL_ATE_RULES,
  resolveGameAteRules,
  resolveGameDialogue,
} from './contextualDialogueContent';
import { createInitialState } from './store';
import { dialogueSequenceSchema, gameStateSchema } from './types';
import type { DialogueSequence, GameState } from './types';

function sequence(): DialogueSequence {
  return dialogueSequenceSchema.parse({
    id: 'context-test',
    title: 'Context test',
    steps: [
      { id: '1', speaker: 'A', text: 'Base one', next: '2' },
      { id: '2', speaker: 'B', text: 'Base two', next: null },
    ],
  });
}

function textOf(dialogueId: string, state: Readonly<GameState>, stepId: string): string {
  const resolved = resolveGameDialogue(dialogueId, state);
  if (!resolved) throw new Error(`Missing test dialogue '${dialogueId}'.`);
  const step = resolved.sequence.steps.find((entry) => entry.id === stepId);
  if (!step) throw new Error(`Missing test step '${dialogueId}:${stepId}'.`);
  return step.text;
}

describe('contextual dialogue conditions', () => {
  it('evaluates flags, public reputation, history, encounters, events, and clan facts', () => {
    const state = createInitialState();
    state.flags.previousChoice = true;
    state.reputation = 54;
    state.reputationHistory.push(
      { delta: 8, source: 'choice:refugees', value: 46 },
      { delta: 10, source: 'choice:bois-clair', value: 56 },
    );
    state.resolvedNodeIds.push('lion-village-choice');
    state.visitedNodeIds.push('lion-shadow-signs');
    state.seenUniqueEvents.push('old-road-rumour');

    const condition: DialogueCondition = {
      kind: 'all',
      conditions: [
        { kind: 'flag', key: 'previousChoice' },
        { kind: 'flag', key: 'missingLegacyFlag', value: false },
        { kind: 'publicReputation', min: 45, max: 60 },
        { kind: 'reputationHistory', sourcePrefix: 'choice:', minDelta: 8, minMatches: 2 },
        { kind: 'resolvedNode', nodeId: 'lion-village-choice' },
        { kind: 'visitedNode', nodeId: 'lion-shadow-signs' },
        { kind: 'seenUniqueEvent', eventId: 'old-road-rumour' },
        { kind: 'unitInClan', definitionId: 'warrior' },
      ],
    };

    expect(evaluateDialogueCondition(condition, state)).toBe(true);
    expect(evaluateDialogueCondition({ kind: 'not', condition }, state)).toBe(false);
    expect(evaluateDialogueCondition({
      kind: 'any',
      conditions: [{ kind: 'flag', key: 'absent' }, { kind: 'publicReputation', min: 50 }],
    }, state)).toBe(true);
  });

  it('reuses R1/R2 semantic precedence for contradictory Lion facts', () => {
    const state = createInitialState();
    Object.assign(state.flags, {
      protectedWitnesses: true,
      silencedWitnesses: true,
      shadowEvidence: true,
      shadowFragments: true,
      shadowRevealed: true,
      shadowConcealed: true,
      missionSuccess: true,
      missionGreed: true,
    });

    expect(evaluateDialogueCondition({ kind: 'lionWitness', states: ['silenced'] }, state)).toBe(true);
    expect(evaluateDialogueCondition({ kind: 'lionShadowKnowledge', states: ['evidence'] }, state)).toBe(true);
    expect(evaluateDialogueCondition({ kind: 'lionShadowDisclosure', states: ['revealed'] }, state)).toBe(true);
    expect(evaluateDialogueCondition({ kind: 'lionVerdictReason', reason: 'saved_bois_clair' }, state)).toBe(true);
    expect(evaluateDialogueCondition({ kind: 'lionVerdictReason', reason: 'sacrificed_bois_clair' }, state)).toBe(true);
    expect(evaluateDialogueCondition({ kind: 'lionFinalRoute', routes: ['lion_trial'] }, state)).toBe(true);
  });

  it('contains no duplicate interpretation of decisive R1 Lion flags', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/game/contextualDialogue.ts'), 'utf8');
    expect(source).toContain("resolveLionNarrativeState(state.flags)");
    expect(source).toContain("resolveLionVerdict({ flags: state.flags, reputation: state.reputation })");
    for (const rawFlag of [
      'protectedWitnesses', 'silencedWitnesses', 'missionGreed',
      'shadowEvidence', 'shadowFragments', 'shadowRevealed', 'shadowConcealed',
    ]) {
      expect(source, `contextual resolver must not decode ${rawFlag}`).not.toContain(rawFlag);
    }
  });
});

describe('contextual dialogue resolution', () => {
  it('uses highest priority before declaration order', () => {
    const state = createInitialState();
    state.flags.exact = true;
    const definition: ContextualDialogueDefinition = {
      variants: [
        { id: 'general', priority: 10, when: { kind: 'always' }, stepPatches: [{ stepId: '1', patch: { text: 'General' } }] },
        { id: 'exact', priority: 20, when: { kind: 'flag', key: 'exact' }, stepPatches: [{ stepId: '1', patch: { text: 'Exact' } }] },
      ],
    };

    const resolved = resolveContextualDialogue(sequence(), state, definition);
    expect(resolved.variantId).toBe('exact');
    expect(resolved.sequence.steps[0]!.text).toBe('Exact');
  });

  it('uses declaration order for non-equivalent priority ties', () => {
    const definition: ContextualDialogueDefinition = {
      variants: [
        { id: 'first', priority: 10, when: { kind: 'always' }, stepPatches: [{ stepId: '1', patch: { text: 'First' } }] },
        { id: 'second', priority: 10, when: { kind: 'always' }, stepPatches: [{ stepId: '1', patch: { text: 'Second' } }] },
      ],
    };
    expect(resolveContextualDialogue(sequence(), createInitialState(), definition).variantId).toBe('first');
  });

  it('deterministically selects only within an explicit equivalence group across save/load', () => {
    const state = createInitialState();
    state.run.seed = 741;
    const definition: ContextualDialogueDefinition = {
      variants: [
        { id: 'equivalent-a', priority: 10, equivalenceGroup: 'greeting', when: { kind: 'always' }, stepPatches: [{ stepId: '1', patch: { text: 'Equivalent A' } }] },
        { id: 'equivalent-b', priority: 10, equivalenceGroup: 'greeting', when: { kind: 'always' }, stepPatches: [{ stepId: '1', patch: { text: 'Equivalent B' } }] },
      ],
    };
    const reloaded = gameStateSchema.parse(JSON.parse(JSON.stringify(state)));
    const first = resolveContextualDialogue(sequence(), state, definition);
    const second = resolveContextualDialogue(sequence(), reloaded, definition);

    expect(first.variantId).toMatch(/^equivalent-[ab]$/);
    expect(second.variantId).toBe(first.variantId);
    expect(second.sequence).toEqual(first.sequence);
  });

  it('inserts eligible optional steps in priority order and rewires the linear path', () => {
    const state = createInitialState();
    state.flags.include = true;
    const definition: ContextualDialogueDefinition = {
      optionalSteps: [
        {
          id: 'optional-low', afterStepId: '1', priority: 10,
          when: { kind: 'flag', key: 'include' },
          step: { id: 'optional-low', speaker: 'Low', tag: '', text: 'Low', expression: 'neutral', portrait: '', side: 'center', effects: [], choices: [] },
        },
        {
          id: 'optional-high', afterStepId: '1', priority: 20,
          when: { kind: 'flag', key: 'include' },
          step: { id: 'optional-high', speaker: 'High', tag: '', text: 'High', expression: 'neutral', portrait: '', side: 'center', effects: [], choices: [] },
        },
        {
          id: 'optional-ineligible', afterStepId: '1',
          when: { kind: 'flag', key: 'absent' },
          step: { id: 'optional-ineligible', speaker: 'No', tag: '', text: 'No', expression: 'neutral', portrait: '', side: 'center', effects: [], choices: [] },
        },
      ],
    };
    const resolved = resolveContextualDialogue(sequence(), state, definition);
    const [base, high, low] = resolved.sequence.steps;

    expect(resolved.optionalStepIds).toEqual(['optional-high', 'optional-low']);
    expect(base!.next).toBe('optional-high');
    expect(high!.next).toBe('optional-low');
    expect(low!.next).toBe('2');
    expect(resolved.sequence.steps.some((step) => step.id === 'optional-ineligible')).toBe(false);
  });

  it('keeps legacy sequences without contextual metadata structurally unchanged and immutable', () => {
    const base = sequence();
    const snapshot = structuredClone(base);
    const resolved = resolveContextualDialogue(base, createInitialState());

    expect(resolved.variantId).toBeNull();
    expect(resolved.optionalStepIds).toEqual([]);
    expect(resolved.sequence).toEqual(snapshot);
    expect(resolved.sequence).not.toBe(base);
    expect(base).toEqual(snapshot);
  });
});

describe('R3 pilot dialogue profiles', () => {
  it('distinguishes honourable saved, mixed saved, sacrificed, and contradictory Bois-Clair records', () => {
    const honourable = createInitialState();
    Object.assign(honourable.flags, { missionSuccess: true, helpedRefugees: true });
    expect(resolveGameDialogue('ate_maelor_seal_analysis', honourable)!.variantId).toBe('bois-clair-saved-honour');
    expect(textOf('ate_maelor_seal_analysis', honourable, '2')).toContain('porté les habitants');

    const mixed = createInitialState();
    Object.assign(mixed.flags, { missionSuccess: true, prioritizedLoot: true, lionMandateAdvance: true });
    expect(resolveGameDialogue('ate_maelor_seal_analysis', mixed)!.variantId).toBe('bois-clair-saved-mixed');
    expect(textOf('ate_maelor_seal_analysis', mixed, '2')).toContain('porte aussi des compromis');

    const sacrificed = createInitialState();
    Object.assign(sacrificed.flags, { missionGreed: true, exploitedRefugees: true });
    expect(resolveGameDialogue('ate_maelor_seal_analysis', sacrificed)!.variantId).toBe('bois-clair-sacrificed');
    expect(textOf('ate_maelor_seal_analysis', sacrificed, '2')).toContain('choisi les réserves');

    const contradictory = createInitialState();
    Object.assign(contradictory.flags, { missionSuccess: true, missionGreed: true });
    expect(resolveGameDialogue('ate_maelor_seal_analysis', contradictory)!.variantId).toBe('bois-clair-contradictory-legacy');
    expect(textOf('ate_maelor_seal_analysis', contradictory, '2')).toContain('Deux vérités contradictoires');
  });

  it('distinguishes witness consequences through the R1 witness resolver', () => {
    const supportive = createInitialState();
    supportive.flags.protectedWitnesses = true;
    expect(resolveGameDialogue('ate_lion_council_doubt', supportive)!.variantId).toBe('witnesses-supportive');
    expect(textOf('ate_lion_council_doubt', supportive, '2')).toContain('parler librement');

    const silenced = createInitialState();
    Object.assign(silenced.flags, { protectedWitnesses: true, silencedWitnesses: true });
    expect(resolveGameDialogue('ate_lion_council_doubt', silenced)!.variantId).toBe('witnesses-silenced');
    expect(textOf('ate_lion_council_doubt', silenced, '2')).toContain('se taisent sous la contrainte');
  });

  it('distinguishes definitive Shadow evidence revealed from concealed after R2 resolution', () => {
    const revealed = createInitialState();
    Object.assign(revealed.flags, { missionSuccess: true, shadowEvidence: true, shadowRevealed: true });
    expect(resolveGameDialogue('serpent_pursuit_pre_combat', revealed)!.variantId).toBe('shadow-revealed');
    expect(textOf('serpent_pursuit_pre_combat', revealed, '3')).toContain('Alaric connaît les preuves');

    const concealed = createInitialState();
    Object.assign(concealed.flags, { missionSuccess: true, shadowEvidence: true, shadowConcealed: true });
    expect(resolveGameDialogue('serpent_pursuit_pre_combat', concealed)!.variantId).toBe('shadow-concealed');
    expect(textOf('serpent_pursuit_pre_combat', concealed, '3')).toContain('preuves restent cachées');
  });

  it('keeps Cedric present only when recruited and corrects enemy reports when absent', () => {
    const recruited = createInitialState();
    recruited.flags.recruitedCedric = true;
    const recruitedRefuge = resolveGameDialogue('final_refuge', recruited)!;
    expect(recruitedRefuge.optionalStepIds).toEqual(['r3-cedric-continuity']);
    expect(recruitedRefuge.sequence.steps.some((step) => step.speaker === 'Cedric')).toBe(true);
    expect(resolveGameDialogue('ate_serpent_general_warning', recruited)!.variantId).toBe('cedric-recruited');

    const absent = createInitialState();
    const absentRefuge = resolveGameDialogue('final_refuge', absent)!;
    expect(absentRefuge.optionalStepIds).toEqual([]);
    expect(absentRefuge.sequence.steps.some((step) => step.speaker === 'Cedric')).toBe(false);
    expect(resolveGameDialogue('ate_serpent_scout_report', absent)!.variantId).toBe('cedric-absent');
    expect(textOf('ate_serpent_scout_report', absent, '1')).toContain('Sans guide');
  });

  it('passes existing dialogue content without metadata through unchanged', () => {
    const base = dialogues.get('acte_ouverture')!;
    const resolved = resolveGameDialogue('acte_ouverture', createInitialState())!;
    expect(resolved.variantId).toBeNull();
    expect(resolved.optionalStepIds).toEqual([]);
    expect(resolved.sequence).toEqual(base);
  });
});

describe('contextual ATE rules', () => {
  const testRules: ContextualAteRule[] = [
    { id: 'always', triggerNodeId: 'node', dialogueId: 'a', priority: 10, once: true },
    { id: 'conditional', triggerNodeId: 'node', dialogueId: 'b', priority: 20, once: true, when: { kind: 'flag', key: 'eligible' } },
    { id: 'other-node', triggerNodeId: 'other', dialogueId: 'c', priority: 30, once: true },
  ];

  it('resolves eligibility and stable priority order for the current trigger only', () => {
    const state = createInitialState();
    state.flags.eligible = true;
    expect(resolveEligibleAteRules('node', state, testRules).map((rule) => rule.id)).toEqual([
      'conditional', 'always',
    ]);
  });

  it('preserves once-only behaviour through the existing save-compatible flag key', () => {
    const state = createInitialState();
    const rule = testRules[0]!;
    expect(ateSeenFlag(rule)).toBe('ate:always');
    expect(resolveEligibleAteRules('node', state, testRules).map((entry) => entry.id)).toContain('always');
    state.flags[ateSeenFlag(rule)] = true;
    expect(resolveEligibleAteRules('node', state, testRules).map((entry) => entry.id)).not.toContain('always');
  });

  it('gates Shadow ATEs on semantic knowledge and restores them for evidence or fragments', () => {
    const none = createInitialState();
    expect(resolveGameAteRules('lion-shadow-signs', none).map((rule) => rule.id)).toEqual([]);

    const evidence = createInitialState();
    evidence.flags.shadowEvidence = true;
    expect(resolveGameAteRules('lion-shadow-signs', evidence).map((rule) => rule.id)).toEqual([
      'ate_ruins_awaken', 'ate_serpent_retreat_order',
    ]);

    evidence.flags['ate:ate_ruins_awaken'] = true;
    expect(resolveGameAteRules('lion-shadow-signs', evidence).map((rule) => rule.id)).toEqual([
      'ate_serpent_retreat_order',
    ]);
  });

  it('retains every pre-R3 ATE trigger and dialogue id', () => {
    expect(CONTEXTUAL_ATE_RULES.map((rule) => [rule.triggerNodeId, rule.dialogueId])).toEqual([
      ['lion-opening-ambush', 'ate_alaric_reports'],
      ['lion-nomad-crossroads', 'ate_serpent_scout_report'],
      ['lion-refugees', 'ate_village_fear'],
      ['lion-valmir-road', 'ate_serpent_general_warning'],
      ['lion-village-choice', 'ate_maelor_seal_analysis'],
      ['lion-witnesses', 'ate_lion_council_doubt'],
      ['lion-shadow-signs', 'ate_ruins_awaken'],
      ['lion-shadow-signs', 'ate_serpent_retreat_order'],
    ]);
  });
});

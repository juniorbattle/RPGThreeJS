import { describe, expect, it } from 'vitest';
import { combatConfigs, dialogues } from './content';
import { ateSeenFlag } from './contextualDialogue';
import {
  CONTEXTUAL_ATE_RULES,
  resolveGameAteRules,
  resolveGameDialogue,
} from './contextualDialogueContent';
import { resolveLionFinaleExecution } from './lionFinale';
import { resolveLionVerdict } from './lionVerdict';
import { prologuePanels } from './prologue';
import {
  getReputationEventOpportunity,
  REPUTATION_EVENT_DEFINITIONS,
  selectGameReputationEvent,
} from './reputationEventContent';
import { R5_MEANINGFUL_CHOICE_CLASSIFICATIONS } from './r5NarrativeContent';
import { createInitialState } from './store';
import { gameStateSchema, type DialogueSequence, type GameState } from './types';

function stateWith(flags: Record<string, boolean>, reputation = 30, seed = 7785): GameState {
  const state = createInitialState();
  state.flags = { ...flags };
  state.reputation = reputation;
  state.run.seed = seed;
  return state;
}

function visiblePath(sequence: DialogueSequence, choiceIndex = 0): DialogueSequence['steps'] {
  const byId = new Map(sequence.steps.map((step) => [step.id, step]));
  const path: DialogueSequence['steps'] = [];
  let current = sequence.steps[0];
  const visited = new Set<string>();
  while (current && !visited.has(current.id)) {
    path.push(current);
    visited.add(current.id);
    const next = current.choices?.length
      ? current.choices[Math.min(choiceIndex, current.choices.length - 1)]?.next
      : current.next;
    current = next ? byId.get(next) : undefined;
  }
  return path;
}

function wordCount(value: string): number {
  return value.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

const HONOUR_FLAGS = {
  lionMandateHonour: true,
  helpedRefugees: true,
  prioritizedVillage: true,
  missionSuccess: true,
  protectedWitnesses: true,
  protectedInformant: true,
};

describe('R5 content production boundaries', () => {
  it('keeps topology and combat count stable while framing every production combat', () => {
    expect(combatConfigs.size).toBe(17);
    for (const combat of combatConfigs.values()) {
      expect(combat.preCombatDialogueId, `${combat.id}:pre`).toBeTruthy();
      expect(combat.postCombatDialogueId, `${combat.id}:post`).toBeTruthy();
      expect(dialogues.has(combat.preCombatDialogueId!), `${combat.id}:pre exists`).toBe(true);
      expect(dialogues.has(combat.postCombatDialogueId!), `${combat.id}:post exists`).toBe(true);
    }
  });

  it('registers two short, contextual, once-only refuge ATEs', () => {
    const first = CONTEXTUAL_ATE_RULES.find((rule) => rule.id === 'ate_first_refuge_watch')!;
    const second = CONTEXTUAL_ATE_RULES.find((rule) => rule.id === 'ate_bois_clair_night_watch')!;
    expect(first).toMatchObject({ triggerNodeId: 'lion-first-refuge', once: true });
    expect(second).toMatchObject({ triggerNodeId: 'lion-second-refuge', once: true });

    const state = stateWith({ helpedRefugees: true });
    expect(resolveGameAteRules(first.triggerNodeId, state).map((rule) => rule.id)).toContain(first.id);
    state.flags[ateSeenFlag(first)] = true;
    expect(resolveGameAteRules(first.triggerNodeId, state).map((rule) => rule.id)).not.toContain(first.id);
  });

  it('expands R4 variety without increasing opportunities or per-run frequency', () => {
    expect(REPUTATION_EVENT_DEFINITIONS).toHaveLength(9);
    const categories = REPUTATION_EVENT_DEFINITIONS.map((entry) => entry.reputationCategory);
    expect(categories.filter((entry) => entry === 'hostile').length).toBeGreaterThanOrEqual(3);
    expect(categories.filter((entry) => entry === 'neutral').length).toBeGreaterThanOrEqual(2);
    expect(categories.filter((entry) => entry === 'helpful').length).toBeGreaterThanOrEqual(3);

    const state = stateWith(HONOUR_FLAGS);
    const opportunityIds = ['lion-first-refuge', 'lion-village-choice', 'lion-final-refuge'];
    for (const nodeId of opportunityIds) {
      const opportunity = getReputationEventOpportunity(nodeId, state)!;
      expect(opportunity.maxEventsPerRun).toBe(2);
      expect(opportunity.minimumStepsSinceAnyEvent).toBe(3);
      expect(opportunity.noEventWeight).toBeGreaterThan(0);
    }
    expect(getReputationEventOpportunity('lion-witnesses', state)).toBeNull();
  });

  it('classifies every new meaningful choice as social and never mutates decisive Lion facts', () => {
    const classified = new Set(R5_MEANINGFUL_CHOICE_CLASSIFICATIONS.map((entry) => entry.dialogueId));
    const r5ChoiceDialogueIds = REPUTATION_EVENT_DEFINITIONS
      .map((definition) => definition.dialogueId)
      .filter((id) => id.startsWith('rep_event_'))
      .filter((id) => id.includes('refuge_supply')
        || id.includes('rumour_market')
        || id.includes('fallen_banner')
        || id.includes('village_memorial')
        || id.includes('displaced_family'));
    expect([...classified].sort()).toEqual([...r5ChoiceDialogueIds].sort());
    expect(R5_MEANINGFUL_CHOICE_CLASSIFICATIONS.every((entry) => entry.class === 'B')).toBe(true);

    const decisiveFlags = new Set([
      'missionSuccess', 'missionGreed', 'protectedWitnesses', 'silencedWitnesses',
      'shadowEvidence', 'shadowFragments', 'shadowRevealed', 'shadowConcealed',
      'protectedInformant', 'betrayedInformant', 'liedToAlaric', 'lionTrialRequested',
    ]);
    for (const entry of R5_MEANINGFUL_CHOICE_CLASSIFICATIONS) {
      const step = dialogues.get(entry.dialogueId)!.steps.find((candidate) => candidate.id === entry.stepId)!;
      for (const choice of step.choices ?? []) {
        expect(choice.effects.some((effect) => effect.type === 'startCombat'), entry.dialogueId).toBe(false);
        expect(choice.effects.some((effect) => effect.type === 'setFlag' && decisiveFlags.has(effect.key)), entry.dialogueId).toBe(false);
      }
    }
  });
});

describe('R5 representative semantic profiles A-M', () => {
  const profiles = [
    { id: 'A pure honour', flags: HONOUR_FLAGS, reputation: 55, route: 'serpent_pursuit', tier: 'honour' },
    { id: 'B honour plus minor stains', flags: { ...HONOUR_FLAGS, lionMandateAdvance: true, prioritizedLoot: true }, reputation: 45, route: 'serpent_pursuit', tier: 'honour' },
    { id: 'C real mixed playtest', flags: { lionMandateAdvance: true, claimedLostTreasure: true, prioritizedLoot: true, helpedRefugees: true, missionSuccess: true, protectedWitnesses: true }, reputation: 38, route: 'serpent_pursuit', tier: 'honour' },
    { id: 'D uncertain conduct', flags: { lionMandateAdvance: true, prioritizedLoot: true, missionSuccess: true }, reputation: 30, route: 'lion_trial', tier: 'uncertain' },
    { id: 'E infamy', flags: { exploitedRefugees: true, missionGreed: true, silencedWitnesses: true }, reputation: 20, route: 'lion_trial', tier: 'infamy' },
    { id: 'F high reputation plus infamy', flags: { exploitedRefugees: true, missionGreed: true, silencedWitnesses: true }, reputation: 90, route: 'lion_trial', tier: 'infamy' },
    { id: 'G low reputation plus honour', flags: HONOUR_FLAGS, reputation: 10, route: 'serpent_pursuit', tier: 'honour' },
    { id: 'H saved Bois-Clair plus silenced witnesses', flags: { ...HONOUR_FLAGS, silencedWitnesses: true }, reputation: 55, route: 'lion_trial', tier: 'honour' },
  ] as const;

  it.each(profiles)('$id preserves the R1/R2 verdict', (profile) => {
    const result = resolveLionVerdict({ flags: profile.flags, reputation: profile.reputation });
    expect(result.conductTier).toBe(profile.tier);
    expect(result.finalRoute).toBe(profile.route);
  });

  it('I/J uses Cedric only when recruited across multiple campaign phases', () => {
    const recruited = stateWith({ ...HONOUR_FLAGS, recruitedCedric: true });
    const absent = stateWith(HONOUR_FLAGS);
    for (const dialogueId of ['refugee_trial', 'reserve_trail', 'shadow_signs', 'final_refuge']) {
      const presentResolution = resolveGameDialogue(dialogueId, recruited)!;
      const absentResolution = resolveGameDialogue(dialogueId, absent)!;
      expect(presentResolution.optionalStepIds.some((id) => id.includes('cedric')), dialogueId).toBe(true);
      expect(absentResolution.optionalStepIds.some((id) => id.includes('cedric')), dialogueId).toBe(false);
    }
  });

  it('K/L preserves the single Shadow disclosure and route-aware pre-combat reaction', () => {
    const revealed = resolveGameDialogue('serpent_pursuit_pre_combat', stateWith({
      ...HONOUR_FLAGS, shadowEvidence: true, shadowRevealed: true,
    }))!;
    const concealed = resolveGameDialogue('serpent_pursuit_pre_combat', stateWith({
      ...HONOUR_FLAGS, shadowEvidence: true, shadowConcealed: true,
    }))!;
    expect(revealed.variantId).toBe('shadow-revealed');
    expect(concealed.variantId).toBe('shadow-concealed');
    expect(revealed.sequence.steps.find((step) => step.id === '3')!.text).toContain('Alaric connaît');
    expect(concealed.sequence.steps.find((step) => step.id === '3')!.text).toContain('cachées');
  });

  it('M preserves voluntary Lion Trial as a route choice, not a changed verdict stance', () => {
    const input = { flags: HONOUR_FLAGS, reputation: 55 };
    const before = resolveLionVerdict(input);
    const execution = resolveLionFinaleExecution(input, 'request_trial');
    expect(before.stance).toBe('respect');
    expect(execution.route).toBe('lion_trial');
    expect(execution.combatId).toBe('lion_chief');
    expect(execution.trialCause).toBe('voluntary');
  });

  it('keeps saved/sacrificed and witness reactions semantically distinct', () => {
    const saved = resolveGameDialogue('ate_bois_clair_night_watch', stateWith({ missionSuccess: true }))!;
    const sacrificed = resolveGameDialogue('ate_bois_clair_night_watch', stateWith({ missionGreed: true }))!;
    const silenced = resolveGameDialogue('ate_lion_council_doubt', stateWith({
      missionSuccess: true, protectedWitnesses: true, silencedWitnesses: true,
    }))!;
    expect(saved.variantId).toBe('r5-night-after-rescue');
    expect(sacrificed.variantId).toBe('r5-night-after-sacrifice');
    expect(silenced.variantId).toBe('witnesses-silenced');
  });
});

describe('R5 determinism, save compatibility, and pacing evidence', () => {
  it('resolves R5 contextual dialogue and the expanded R4 pool identically after V6 save/load', () => {
    const state = stateWith({ ...HONOUR_FLAGS, recruitedCedric: true }, 62, 5105);
    state.stepCounter = 13;
    const reloaded = gameStateSchema.parse(JSON.parse(JSON.stringify(state)));
    expect(resolveGameDialogue('ate_first_refuge_watch', reloaded))
      .toEqual(resolveGameDialogue('ate_first_refuge_watch', state));
    expect(selectGameReputationEvent('lion-first-refuge', reloaded))
      .toEqual(selectGameReputationEvent('lion-first-refuge', state));
    expect(reloaded.version).toBe(6);
  });

  it('supports a measured fast route of at least 45 minutes without R4 events', () => {
    const state = stateWith({
      ...HONOUR_FLAGS,
      recruitedCedric: true,
      recruitedLancer: true,
      shadowEvidence: true,
      shadowRevealed: true,
      serpentGeneralDefeated: true,
    }, 55);
    const dialogueIds = [
      'acte_ouverture', 'camp_departure', 'lion_briefing',
      'pre_opening_trail', 'post_opening_trail', 'ate_alaric_reports',
      'mystery_recruit', 'ate_serpent_scout_report', 'refugee_trial', 'ate_village_fear',
      'mystery_help', 'ate_first_refuge_watch', 'reserve_trail',
      'pre_valmir_road', 'post_valmir_road', 'ate_serpent_general_warning',
      'old_shrine_event', 'village_choice', 'pre_village_defense', 'village_defense_aftermath',
      'ate_maelor_seal_analysis', 'ate_bois_clair_night_watch', 'mystery_lancer_recruit',
      'witnesses_on_road', 'ate_lion_council_doubt', 'mystery_dragon_roost',
      'shadow_signs', 'ate_ruins_awaken', 'ate_serpent_retreat_order', 'final_refuge',
      'lion_finale_judgement', 'serpent_pursuit_pre_combat', 'serpent_general_aftermath', 'epilogue',
    ];
    const resolvedPaths = dialogueIds.map((id) => {
      const resolution = resolveGameDialogue(id, state);
      expect(resolution, id).not.toBeNull();
      return visiblePath(resolution!.sequence);
    });
    const dialogueWords = resolvedPaths.flat().reduce((total, step) => total + wordCount(step.text), 0);
    const choiceWords = resolvedPaths.flat().reduce((total, step) => (
      total + (step.choices ?? []).reduce((choiceTotal, choice) => choiceTotal + wordCount(choice.text), 0)
    ), 0);
    const displayedSteps = resolvedPaths.reduce((total, path) => total + path.length, 0);
    const choiceScreens = resolvedPaths.flat().filter((step) => (step.choices?.length ?? 0) > 0).length;
    const prologueWords = prologuePanels.reduce((total, panel) => total + wordCount(`${panel.title} ${panel.body}`), 0);

    // Conservative fast-reader model: 240 wpm, short click/decision pauses,
    // three pre-finale fights plus the boss, three refuges, and map transitions.
    const narrativeSeconds = ((dialogueWords + choiceWords + prologueWords) / 240) * 60
      + displayedSteps * 0.9
      + choiceScreens * 6
      + prologuePanels.length * 1.5;
    const combatSeconds = 4.5 * 60 + 4.5 * 60 + 6.5 * 60 + 7.5 * 60;
    const refugeSeconds = 3 * 45;
    const travelSeconds = 18 * 5;
    const totalMinutes = (narrativeSeconds + combatSeconds + refugeSeconds + travelSeconds) / 60;

    expect(dialogueWords).toBeGreaterThanOrEqual(3_500);
    expect(displayedSteps).toBeGreaterThanOrEqual(120);
    expect(totalMinutes).toBeGreaterThanOrEqual(45);
  });
});

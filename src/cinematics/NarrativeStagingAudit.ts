import { campaignNodes, combatConfigs, dialogues, POST_NODE_ATE } from '../game/content';
import { REPUTATION_EVENT_DEFINITIONS } from '../game/reputationEventContent';
import { resolveGameDialogue } from '../game/contextualDialogueContent';
import { createInitialState } from '../game/store';
import type { DialogueSequence } from '../game/types';
import { DialogueStagingDirector, type DialogueStagingDecision } from './DialogueStagingDirector';
import {
  NARRATIVE_LAYOUT_PROFILES,
  NARRATIVE_LAYOUT_PROFILE_RULES,
  resolveNarrativeDialogueTableau,
  type NarrativeTableauSpec,
} from './NarrativeTableau';

export const CURRENT_DIALOGUE_MEDIA = Object.freeze<Record<string, string>>({
  lion_briefing: 'alaric_audience_arrival',
  village_choice: 'bois_clair_arrival',
  shadow_signs: 'shadow_signs',
  final_refuge: 'final_refuge_dossier',
  lion_finale_judgement: 'lion_judgement',
  pre_opening_trail: 'forest_journey_tension',
});

export interface NarrativeDialogueStagingEntry {
  dialogueId: string;
  reachableContexts: readonly string[];
  tableauId: string;
  tableauFamily: string;
  speakers: readonly string[];
  stepOrder: readonly string[];
  visualPhases: readonly string[];
  steps: readonly {
    stepId: string;
    phaseId: string;
    presentationStrategy: DialogueStagingDecision['presentationStrategy'];
    videoPresentationStrategy: DialogueStagingDecision['presentationStrategy'];
    stillCastOwnership: DialogueStagingDecision['castOwnership'];
    videoCastOwnership: DialogueStagingDecision['castOwnership'];
    layoutProfile: DialogueStagingDecision['layoutProfile'];
    layoutPlacement: DialogueStagingDecision['layoutPlacement'];
    speakerScreenPosition: DialogueStagingDecision['speakerScreenPosition'];
    speakerAssociation: DialogueStagingDecision['speakerAssociation'];
    speakerPhysicalScale: number;
    dialogueSpeakerAssociationResolved: boolean;
    staticScaleOutlier: boolean;
    unresolvedMediaSpeakerConflict: boolean;
    speakerCardPolicy: DialogueStagingDecision['speakerCardPolicy'];
    maxCharactersPerSegment: number;
    maxLines: number;
    maxDisplaySegmentCharacters: number;
    choiceCount: number;
    displaySegmentCount: number;
    effectOwnerCount: number;
    offscreenReason?: string;
    mediaRemasterLater: boolean;
    fullBodyVideoOverlay: boolean;
    speakerCardDuringActiveChoice: false;
    normalCardAllowsScroll: false;
    accidentalFullWidthFallback: false;
    arbitraryCenterFallback: false;
  }[];
  offscreenStrategy: 'NONE' | 'EXPLICIT_PER_STEP';
  choicePresentation: 'NONE' | 'SETUP_THEN_CHOICES_ONLY';
  futureMediaNeed: 'NONE' | 'REMASTER_LATER';
}

export interface NarrativeStagingAudit {
  schemaVersion: 2;
  source: 'CANONICAL_DIALOGUE_SEQUENCE_DATA';
  entries: readonly NarrativeDialogueStagingEntry[];
  summary: {
    totalReachableDialogues: number;
    stagedDialogues: number;
    unmappedDialogues: readonly string[];
    totalDialogueSteps: number;
    stagedDialogueSteps: number;
    unmappedDialogueSteps: readonly string[];
    visualPhaseCount: number;
    totalStagingRecords: number;
    totalDistinctVisualCompositions: number;
    layoutProfiles: readonly string[];
    approvedLayoutProfiles: readonly string[];
    totalApprovedStagingProfiles: number;
    choiceSteps: number;
    choicePurityViolations: number;
    textCapacityViolations: number;
    normalDialogueScrollViolations: number;
    accidentalFullWidthFallbacks: number;
    arbitraryCenterFallbacks: number;
    intentionalOffscreenSteps: number;
    unresolvedMediaSpeakerConflicts: number;
    unresolvedStaticScaleOutliers: number;
    unresolvedDialogueSpeakerAssociations: number;
  };
}

function contextsByDialogueId(): Map<string, Set<string>> {
  const contexts = new Map<string, Set<string>>();
  const add = (dialogueId: string, context: string) => {
    const values = contexts.get(dialogueId) ?? new Set<string>();
    values.add(context);
    contexts.set(dialogueId, values);
  };
  add('acte_ouverture', 'campaign:new-game-prologue');
  add('camp_departure', 'node:lion-camp');
  add('epilogue', 'campaign:lion-route-ending');
  for (const node of campaignNodes) {
    if (node.dialogueId) add(node.dialogueId, `campaign-node:${node.id}`);
  }
  for (const config of combatConfigs.values()) {
    if (config.preCombatDialogueId) add(config.preCombatDialogueId, `pre-combat:${config.id}`);
    if (config.postCombatDialogueId) add(config.postCombatDialogueId, `post-combat:${config.id}`);
  }
  for (const [nodeId, dialogueIds] of Object.entries(POST_NODE_ATE)) {
    for (const dialogueId of dialogueIds) add(dialogueId, `ate-after:${nodeId}`);
  }
  for (const definition of REPUTATION_EVENT_DEFINITIONS) add(definition.dialogueId, `reputation-event:${definition.id}`);
  return contexts;
}

function entryFor(sequence: DialogueSequence, tableau: NarrativeTableauSpec, contexts: readonly string[]): NarrativeDialogueStagingEntry {
  const hasMovingMedia = Boolean(CURRENT_DIALOGUE_MEDIA[sequence.id]);
  const still = new DialogueStagingDirector(sequence, tableau, { mediaMode: 'STILL', hasMovingMedia });
  const video = new DialogueStagingDirector(sequence, tableau, { mediaMode: 'VIDEO', hasMovingMedia });
  const videoByStep = new Map(video.plan.decisions.map((decision) => [decision.stepId, decision]));
  const steps = sequence.steps.map((step) => {
    const decision = still.resolve(step);
    const videoDecision = videoByStep.get(step.id)!;
    return {
      stepId: step.id,
      phaseId: decision.currentVisualState,
      presentationStrategy: decision.presentationStrategy,
      videoPresentationStrategy: videoDecision.presentationStrategy,
      stillCastOwnership: decision.castOwnership,
      videoCastOwnership: videoDecision.castOwnership,
      layoutProfile: decision.layoutProfile,
      layoutPlacement: decision.layoutPlacement,
      speakerScreenPosition: decision.speakerScreenPosition,
      speakerAssociation: decision.speakerAssociation,
      speakerPhysicalScale: decision.speakerPhysicalScale,
      dialogueSpeakerAssociationResolved: Boolean(decision.speakerScreenPosition && decision.speakerAssociation),
      staticScaleOutlier: decision.speakerPhysicalScale < 0.85 || decision.speakerPhysicalScale > 1.15,
      unresolvedMediaSpeakerConflict: videoDecision.presentationStrategy === 'OFFSCREEN_CONTEXTUAL' && !videoDecision.offscreenReason,
      speakerCardPolicy: decision.speakerCardPolicy,
      maxCharactersPerSegment: decision.maxCharactersPerSegment,
      maxLines: decision.maxLines,
      maxDisplaySegmentCharacters: Math.max(...decision.displaySegments.map((segment) => segment.length)),
      choiceCount: step.choices?.length ?? 0,
      displaySegmentCount: decision.displaySegments.length,
      effectOwnerCount: 1,
      ...(videoDecision.offscreenReason ? { offscreenReason: videoDecision.offscreenReason } : {}),
      mediaRemasterLater: videoDecision.mediaRemasterLater,
      fullBodyVideoOverlay: false,
      speakerCardDuringActiveChoice: false as const,
      normalCardAllowsScroll: false as const,
      accidentalFullWidthFallback: false as const,
      arbitraryCenterFallback: false as const,
    };
  });
  return {
    dialogueId: sequence.id,
    reachableContexts: contexts.length ? contexts : ['campaign:reachable-content-pool'],
    tableauId: tableau.id,
    tableauFamily: tableau.family ?? 'FALLBACK',
    speakers: [...new Set(sequence.steps.map((step) => step.actorId ?? `speaker:${step.speaker}`))],
    stepOrder: sequence.steps.map((step) => step.id),
    visualPhases: [...new Set(steps.map((step) => step.phaseId))],
    steps,
    offscreenStrategy: steps.some((step) => step.videoPresentationStrategy === 'OFFSCREEN_CONTEXTUAL') ? 'EXPLICIT_PER_STEP' : 'NONE',
    choicePresentation: steps.some((step) => step.choiceCount) ? 'SETUP_THEN_CHOICES_ONLY' : 'NONE',
    futureMediaNeed: video.plan.decisions.some((decision) => decision.mediaRemasterLater) ? 'REMASTER_LATER' : 'NONE',
  };
}

export function createNarrativeStagingAudit(): NarrativeStagingAudit {
  const contexts = contextsByDialogueId();
  const entries: NarrativeDialogueStagingEntry[] = [];
  const unmappedDialogues: string[] = [];
  const unmappedDialogueSteps: string[] = [];
  for (const sequence of [...dialogues.values()].sort((a, b) => a.id.localeCompare(b.id))) {
    const tableau = resolveNarrativeDialogueTableau(sequence.id, sequence);
    if (!tableau) {
      unmappedDialogues.push(sequence.id);
      unmappedDialogueSteps.push(...sequence.steps.map((step) => `${sequence.id}:${step.id}`));
      continue;
    }
    const entry = entryFor(sequence, tableau, [...(contexts.get(sequence.id) ?? [])]);
    entries.push(entry);
    const mappedSteps = new Set(entry.steps.map((step) => step.stepId));
    for (const step of sequence.steps) if (!mappedSteps.has(step.id)) unmappedDialogueSteps.push(`${sequence.id}:${step.id}`);
  }
  const totalDialogueSteps = [...dialogues.values()].reduce((total, sequence) => total + sequence.steps.length, 0);
  return {
    schemaVersion: 2,
    source: 'CANONICAL_DIALOGUE_SEQUENCE_DATA',
    entries,
    summary: {
      totalReachableDialogues: dialogues.size,
      stagedDialogues: entries.length,
      unmappedDialogues,
      totalDialogueSteps,
      stagedDialogueSteps: totalDialogueSteps - unmappedDialogueSteps.length,
      unmappedDialogueSteps,
      visualPhaseCount: entries.reduce((total, entry) => total + entry.visualPhases.length, 0),
      totalStagingRecords: totalDialogueSteps,
      totalDistinctVisualCompositions: entries.reduce((total, entry) => total + entry.visualPhases.length, 0),
      layoutProfiles: [...new Set(entries.flatMap((entry) => entry.steps.map((step) => step.layoutProfile)))].sort(),
      approvedLayoutProfiles: [...NARRATIVE_LAYOUT_PROFILES],
      totalApprovedStagingProfiles: NARRATIVE_LAYOUT_PROFILES.length,
      choiceSteps: entries.reduce((total, entry) => total + entry.steps.filter((step) => step.choiceCount > 0).length, 0),
      choicePurityViolations: entries.reduce((total, entry) => total + entry.steps.filter((step) => step.choiceCount > 0 && step.speakerCardDuringActiveChoice).length, 0),
      textCapacityViolations: entries.reduce((total, entry) => total + entry.steps.filter((step) => {
        const rule = NARRATIVE_LAYOUT_PROFILE_RULES[step.layoutProfile];
        return step.displaySegmentCount < 1
          || rule.maxCharactersPerSegment !== step.maxCharactersPerSegment
          || rule.maxLines !== step.maxLines
          || (step.maxCharactersPerSegment > 0 && step.maxDisplaySegmentCharacters > step.maxCharactersPerSegment);
      }).length, 0),
      normalDialogueScrollViolations: entries.reduce((total, entry) => total + entry.steps.filter((step) => step.normalCardAllowsScroll).length, 0),
      accidentalFullWidthFallbacks: entries.reduce((total, entry) => total + entry.steps.filter((step) => step.accidentalFullWidthFallback).length, 0),
      arbitraryCenterFallbacks: entries.reduce((total, entry) => total + entry.steps.filter((step) => step.arbitraryCenterFallback).length, 0),
      intentionalOffscreenSteps: entries.reduce((total, entry) => total + entry.steps.filter((step) => step.videoPresentationStrategy === 'OFFSCREEN_CONTEXTUAL').length, 0),
      unresolvedMediaSpeakerConflicts: entries.reduce((total, entry) => total + entry.steps.filter((step) => step.unresolvedMediaSpeakerConflict).length, 0),
      unresolvedStaticScaleOutliers: entries.reduce((total, entry) => total + entry.steps.filter((step) => step.staticScaleOutlier).length, 0),
      unresolvedDialogueSpeakerAssociations: entries.reduce((total, entry) => total + entry.steps.filter((step) => !step.dialogueSpeakerAssociationResolved).length, 0),
    },
  };
}

export function validateNarrativeStagingAudit(audit: NarrativeStagingAudit): string[] {
  const errors: string[] = [];
  if (audit.summary.unmappedDialogues.length) errors.push(`Unmapped dialogues: ${audit.summary.unmappedDialogues.join(', ')}`);
  if (audit.summary.unmappedDialogueSteps.length) errors.push(`Unmapped steps: ${audit.summary.unmappedDialogueSteps.join(', ')}`);
  for (const entry of audit.entries) {
    const sequence = dialogues.get(entry.dialogueId);
    if (!entry.tableauId) errors.push(`${entry.dialogueId}: undefined tableau`);
    if (!sequence) errors.push(`${entry.dialogueId}: missing canonical sequence`);
    if (entry.stepOrder.length !== entry.steps.length) errors.push(`${entry.dialogueId}: step mapping count differs from canonical source`);
    for (const step of entry.steps) {
      const canonicalStep = sequence?.steps.find((candidate) => candidate.id === step.stepId);
      if (!step.phaseId) errors.push(`${entry.dialogueId}:${step.stepId}: undefined phase`);
      if (!step.layoutProfile) errors.push(`${entry.dialogueId}:${step.stepId}: undefined layout`);
      if (!NARRATIVE_LAYOUT_PROFILES.includes(step.layoutProfile)) errors.push(`${entry.dialogueId}:${step.stepId}: unapproved layout profile`);
      if (!step.layoutPlacement) errors.push(`${entry.dialogueId}:${step.stepId}: undefined placement`);
      if (!step.speakerScreenPosition || !step.speakerAssociation || !step.dialogueSpeakerAssociationResolved) {
        errors.push(`${entry.dialogueId}:${step.stepId}: unresolved dialogue/speaker association`);
      }
      if (step.staticScaleOutlier) errors.push(`${entry.dialogueId}:${step.stepId}: unresolved static scale outlier`);
      if (step.unresolvedMediaSpeakerConflict) errors.push(`${entry.dialogueId}:${step.stepId}: unresolved media/speaker conflict`);
      if (!step.presentationStrategy || !step.videoPresentationStrategy) errors.push(`${entry.dialogueId}:${step.stepId}: undefined strategy`);
      if (!step.stillCastOwnership || !step.videoCastOwnership) errors.push(`${entry.dialogueId}:${step.stepId}: undefined media/cast ownership`);
      if (step.effectOwnerCount !== 1) errors.push(`${entry.dialogueId}:${step.stepId}: duplicate effect owner`);
      if (!canonicalStep || step.choiceCount !== (canonicalStep.choices?.length ?? 0)) errors.push(`${entry.dialogueId}:${step.stepId}: choice mapping differs from canonical source`);
      if (step.videoPresentationStrategy === 'OFFSCREEN_CONTEXTUAL' && !step.offscreenReason) errors.push(`${entry.dialogueId}:${step.stepId}: missing offscreen reason`);
      if (step.fullBodyVideoOverlay) errors.push(`${entry.dialogueId}:${step.stepId}: full-body overlay over moving video`);
      if (step.choiceCount > 0 && (step.speakerCardPolicy !== 'SETUP_THEN_CHOICES_ONLY' || step.speakerCardDuringActiveChoice)) {
        errors.push(`${entry.dialogueId}:${step.stepId}: active choice retains a speaker card`);
      }
      if (step.normalCardAllowsScroll) errors.push(`${entry.dialogueId}:${step.stepId}: normal dialogue permits scrolling`);
      if (step.accidentalFullWidthFallback) errors.push(`${entry.dialogueId}:${step.stepId}: accidental full-width fallback`);
      if (step.arbitraryCenterFallback) errors.push(`${entry.dialogueId}:${step.stepId}: arbitrary center fallback`);
      if (step.maxCharactersPerSegment > 0 && step.maxDisplaySegmentCharacters > step.maxCharactersPerSegment) {
        errors.push(`${entry.dialogueId}:${step.stepId}: display segment exceeds profile capacity`);
      }
      if (NARRATIVE_LAYOUT_PROFILE_RULES[step.layoutProfile].maxLines !== step.maxLines) {
        errors.push(`${entry.dialogueId}:${step.stepId}: profile line cap drift`);
      }
    }
  }
  const absent = createInitialState();
  for (const dialogueId of ['shadow_signs', 'final_refuge']) {
    const unresolved = resolveGameDialogue(dialogueId, absent);
    if (unresolved?.sequence.steps.some((step) => step.actorId === 'cedric' || step.actorId === 'lancer')) {
      errors.push(`${dialogueId}: optional recruit staged before recruitment state`);
    }
  }
  const recruited = createInitialState();
  recruited.flags.recruitedCedric = true;
  recruited.flags.recruitedLancer = true;
  const recruitedFinale = resolveGameDialogue('final_refuge', recruited);
  if (!recruitedFinale || !['cedric', 'lancer'].every((actorId) => recruitedFinale.sequence.steps.some((step) => step.actorId === actorId))) {
    errors.push('final_refuge: recruited contextual cast did not resolve');
  } else {
    const tableau = resolveNarrativeDialogueTableau(recruitedFinale.sequence.id, recruitedFinale.sequence);
    if (!tableau || new DialogueStagingDirector(recruitedFinale.sequence, tableau, { mediaMode: 'STILL' }).plan.decisions.length !== recruitedFinale.sequence.steps.length) {
      errors.push('final_refuge: recruited contextual steps are not fully staged');
    }
  }
  return errors;
}

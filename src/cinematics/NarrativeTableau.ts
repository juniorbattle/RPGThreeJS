import type { DialogueSequence } from '../game/types';

export const NARRATIVE_BEAT_KINDS = Object.freeze([
  'VISUAL',
  'SPEAKER_CARD',
  'CINEMATIC_SUBTITLE',
  'HELD_DIALOGUE',
  'SPATIAL_CHOICE',
  'ROUTE_CHOICE',
  'CONTEXT_ACTION',
  'TRANSITION',
  'COMBAT_HANDOFF',
  'WAIT_FOR_INPUT',
] as const);

export type NarrativeBeatKind = typeof NARRATIVE_BEAT_KINDS[number];
export type NarrativeDialogueMode = 'SPEAKER_CARD' | 'CINEMATIC_SUBTITLE' | 'HELD_DIALOGUE' | 'SPATIAL_CHOICE';
export type NarrativeMediaPhase = 'INTRO_MEDIA' | 'REACTION_MEDIA';
export type NarrativeJourneyGrammar = 'SINGLE_ROUTE' | 'TWO_PATH_FORK' | 'APPROACH' | 'DEPARTURE' | 'THREAT' | 'AFTERMATH';
export type NarrativeTransitionKind = 'CROSSFADE' | 'FOREGROUND_WIPE' | 'DEPTH_SHIFT' | 'LIGHT_FADE' | 'ATMOSPHERIC_DISSOLVE' | 'CAMERA_REVEAL';

export interface NarrativeAnchorSpec {
  id: string;
  placement: 'LEFT' | 'CENTER' | 'RIGHT' | 'LOWER_LEFT' | 'LOWER_CENTER' | 'LOWER_RIGHT';
  safeRegion?: Readonly<{ x: number; y: number; width: number; height: number }>;
  routeIndex?: number;
}

export interface NarrativeMediaSpec {
  phase: NarrativeMediaPhase;
  cinematicId: string;
  optional?: boolean;
}

export interface NarrativeOffscreenSpec {
  actorId: string;
  reason: string;
}

export interface NarrativeCastSpec {
  visualActors: readonly string[];
  eventActors: readonly string[];
  playerRepresentatives: readonly string[];
  optionalActors: readonly string[];
  justifiedOffscreen: readonly NarrativeOffscreenSpec[];
}

export interface NarrativeBeatSpec {
  id: string;
  kind: NarrativeBeatKind;
  mediaPhase?: NarrativeMediaPhase;
  dialogueStepId?: string;
  anchorId?: string;
  transition?: NarrativeTransitionKind;
  skippable?: boolean;
}

export interface NarrativeTableauSpec {
  id: string;
  grammar: NarrativeJourneyGrammar;
  presentationKey?: string;
  dialogueId?: string;
  combatIds?: readonly string[];
  media: readonly NarrativeMediaSpec[];
  cast: NarrativeCastSpec;
  anchors: readonly NarrativeAnchorSpec[];
  beats: readonly NarrativeBeatSpec[];
  exit: 'DIALOGUE_SEQUENCE_COMPLETE' | 'ROUTE_COMMIT' | 'COMBAT_HANDOFF' | 'COMBAT_RESULT' | 'RESOLVED_CAMPAIGN_BOUNDARY';
  next: 'RESOLVED_CAMPAIGN_TABLEAU';
  mediaRemasterNeeded?: boolean;
}

export interface DialogueCastAlignment {
  status: 'PASS' | 'PASS_WITH_JUSTIFIED_OFFSCREEN' | 'FAIL';
  requiredSpeakers: readonly string[];
  visuallyCovered: readonly string[];
  justifiedOffscreen: readonly NarrativeOffscreenSpec[];
  unresolved: readonly string[];
}

export const CAMP_DEPARTURE_TABLEAU = Object.freeze<NarrativeTableauSpec>({
  id: 'CAMP_DEPARTURE_TABLEAU',
  grammar: 'SINGLE_ROUTE',
  presentationKey: 'node:lion-camp:arrival',
  media: [{ phase: 'INTRO_MEDIA', cinematicId: 'camp_departure' }],
  cast: {
    visualActors: ['maelor', 'alistair', 'marian'],
    eventActors: ['maelor', 'alistair', 'marian'],
    playerRepresentatives: ['maelor'],
    optionalActors: [],
    justifiedOffscreen: [],
  },
  anchors: [{ id: 'next-step', placement: 'LOWER_RIGHT', safeRegion: { x: 0.73, y: 0.73, width: 0.24, height: 0.23 } }],
  beats: [
    { id: 'departure-visual', kind: 'VISUAL', mediaPhase: 'INTRO_MEDIA', skippable: true },
    { id: 'departure-continue', kind: 'CONTEXT_ACTION', anchorId: 'next-step', skippable: false },
  ],
  exit: 'ROUTE_COMMIT',
  next: 'RESOLVED_CAMPAIGN_TABLEAU',
});

export const ALARIC_AUDIENCE_TABLEAU = Object.freeze<NarrativeTableauSpec>({
  id: 'ALARIC_AUDIENCE_TABLEAU',
  grammar: 'APPROACH',
  dialogueId: 'lion_briefing',
  media: [{ phase: 'INTRO_MEDIA', cinematicId: 'alaric_audience_arrival' }],
  cast: {
    visualActors: ['alaric', 'alistair', 'sage_seraphine', 'maelor'],
    eventActors: ['alaric', 'alistair', 'sage_seraphine', 'maelor'],
    playerRepresentatives: ['sage_seraphine', 'maelor'],
    optionalActors: [],
    justifiedOffscreen: [],
  },
  anchors: [
    { id: 'clan-side', placement: 'LOWER_LEFT', safeRegion: { x: 0.08, y: 0.70, width: 0.38, height: 0.25 } },
    { id: 'lion-side', placement: 'LOWER_RIGHT', safeRegion: { x: 0.54, y: 0.70, width: 0.38, height: 0.25 } },
    { id: 'audience-choice-left', placement: 'LOWER_LEFT', routeIndex: 0 },
    { id: 'audience-choice-right', placement: 'LOWER_RIGHT', routeIndex: 1 },
  ],
  beats: [
    { id: 'audience-arrival', kind: 'VISUAL', mediaPhase: 'INTRO_MEDIA', skippable: true },
    { id: 'alaric-mandate', kind: 'SPEAKER_CARD', dialogueStepId: '1', anchorId: 'lion-side', skippable: false },
    { id: 'alaric-conditions', kind: 'HELD_DIALOGUE', dialogueStepId: '1a', anchorId: 'lion-side', skippable: false },
    { id: 'alistair-answer', kind: 'SPEAKER_CARD', dialogueStepId: '1b', anchorId: 'clan-side', skippable: false },
    { id: 'seraphine-counsel', kind: 'SPEAKER_CARD', dialogueStepId: '2', anchorId: 'clan-side', skippable: false },
    { id: 'maelor-agency', kind: 'SPATIAL_CHOICE', dialogueStepId: '3', anchorId: 'clan-side', skippable: false },
    { id: 'alaric-response-honour', kind: 'CINEMATIC_SUBTITLE', dialogueStepId: '4', anchorId: 'lion-side', skippable: false },
    { id: 'alaric-response-advance', kind: 'CINEMATIC_SUBTITLE', dialogueStepId: '5', anchorId: 'lion-side', skippable: false },
    { id: 'audience-transition', kind: 'TRANSITION', transition: 'ATMOSPHERIC_DISSOLVE', skippable: true },
  ],
  exit: 'DIALOGUE_SEQUENCE_COMPLETE',
  next: 'RESOLVED_CAMPAIGN_TABLEAU',
});

export const FOREST_THREAT_TABLEAU = Object.freeze<NarrativeTableauSpec>({
  id: 'FOREST_THREAT_TABLEAU',
  grammar: 'THREAT',
  dialogueId: 'pre_opening_trail',
  combatIds: ['forest_ambush', 'wolf_pack'],
  media: [{ phase: 'INTRO_MEDIA', cinematicId: 'forest_journey_tension' }],
  cast: {
    visualActors: ['sage_seraphine'],
    eventActors: ['kestrel', 'alistair', 'sage_seraphine'],
    playerRepresentatives: ['sage_seraphine'],
    optionalActors: [],
    justifiedOffscreen: [],
  },
  anchors: [
    { id: 'forest-left', placement: 'LOWER_LEFT' },
    { id: 'forest-right', placement: 'LOWER_RIGHT' },
  ],
  beats: [
    { id: 'forest-pressure', kind: 'VISUAL', mediaPhase: 'INTRO_MEDIA', skippable: true },
    { id: 'kestrel-warning', kind: 'SPEAKER_CARD', dialogueStepId: '1', anchorId: 'forest-left', skippable: false },
    { id: 'alistair-rally', kind: 'HELD_DIALOGUE', dialogueStepId: '2', anchorId: 'forest-left', skippable: false },
    { id: 'seraphine-warning', kind: 'SPEAKER_CARD', dialogueStepId: '3', anchorId: 'forest-left', skippable: false },
    { id: 'forest-combat-handoff', kind: 'COMBAT_HANDOFF', transition: 'FOREGROUND_WIPE', skippable: false },
  ],
  exit: 'COMBAT_HANDOFF',
  next: 'RESOLVED_CAMPAIGN_TABLEAU',
  mediaRemasterNeeded: true,
});

export const FOREST_AFTERMATH_TABLEAU = Object.freeze<NarrativeTableauSpec>({
  id: 'FOREST_AFTERMATH_TABLEAU',
  grammar: 'AFTERMATH',
  dialogueId: 'post_opening_trail',
  media: [],
  cast: {
    visualActors: [],
    eventActors: ['kestrel', 'alistair', 'maelor'],
    playerRepresentatives: ['maelor'],
    optionalActors: [],
    justifiedOffscreen: [],
  },
  anchors: [
    { id: 'aftermath-left', placement: 'LOWER_LEFT' },
    { id: 'aftermath-right', placement: 'LOWER_RIGHT' },
  ],
  beats: [
    { id: 'aftermath-kestrel', kind: 'SPEAKER_CARD', dialogueStepId: '1', anchorId: 'aftermath-left', skippable: false },
    { id: 'aftermath-alistair', kind: 'SPEAKER_CARD', dialogueStepId: '2', anchorId: 'aftermath-left', skippable: false },
    { id: 'aftermath-maelor', kind: 'CINEMATIC_SUBTITLE', dialogueStepId: '3', anchorId: 'aftermath-left', skippable: false },
    { id: 'aftermath-transition', kind: 'TRANSITION', transition: 'LIGHT_FADE', skippable: true },
  ],
  exit: 'COMBAT_RESULT',
  next: 'RESOLVED_CAMPAIGN_TABLEAU',
  mediaRemasterNeeded: true,
});

export const VALMIR_FORK_TABLEAU = Object.freeze<NarrativeTableauSpec>({
  id: 'VALMIR_FORK_TABLEAU',
  grammar: 'TWO_PATH_FORK',
  presentationKey: 'node:lion-valmir-road:arrival',
  media: [{ phase: 'INTRO_MEDIA', cinematicId: 'valmir_route_fork' }],
  cast: {
    visualActors: ['sage_seraphine', 'alistair', 'maelor'],
    eventActors: ['sage_seraphine', 'alistair', 'maelor'],
    playerRepresentatives: ['sage_seraphine', 'maelor'],
    optionalActors: [],
    justifiedOffscreen: [],
  },
  anchors: [
    { id: 'route-left', placement: 'LOWER_LEFT', safeRegion: { x: 0.03, y: 0.66, width: 0.29, height: 0.28 }, routeIndex: 0 },
    { id: 'route-right', placement: 'LOWER_RIGHT', safeRegion: { x: 0.68, y: 0.66, width: 0.29, height: 0.28 }, routeIndex: 1 },
  ],
  beats: [
    { id: 'valmir-arrival', kind: 'VISUAL', mediaPhase: 'INTRO_MEDIA', skippable: true },
    { id: 'valmir-routes', kind: 'ROUTE_CHOICE', anchorId: 'route-left', skippable: false },
    { id: 'valmir-transition', kind: 'TRANSITION', transition: 'DEPTH_SHIFT', skippable: true },
  ],
  exit: 'ROUTE_COMMIT',
  next: 'RESOLVED_CAMPAIGN_TABLEAU',
});

const TABLEAUX_BY_PRESENTATION_KEY = new Map([
  [CAMP_DEPARTURE_TABLEAU.presentationKey!, CAMP_DEPARTURE_TABLEAU],
  [VALMIR_FORK_TABLEAU.presentationKey!, VALMIR_FORK_TABLEAU],
]);

const TABLEAUX_BY_DIALOGUE_ID = new Map([
  [ALARIC_AUDIENCE_TABLEAU.dialogueId!, ALARIC_AUDIENCE_TABLEAU],
  [FOREST_THREAT_TABLEAU.dialogueId!, FOREST_THREAT_TABLEAU],
  [FOREST_AFTERMATH_TABLEAU.dialogueId!, FOREST_AFTERMATH_TABLEAU],
]);

export function resolveNarrativeBoundaryTableau(presentationKey: string): NarrativeTableauSpec | undefined {
  return TABLEAUX_BY_PRESENTATION_KEY.get(presentationKey);
}

export function resolveNarrativeDialogueTableau(dialogueId: string): NarrativeTableauSpec | undefined {
  return TABLEAUX_BY_DIALOGUE_ID.get(dialogueId);
}

export function resolveNarrativeCombatTableau(combatId: string): NarrativeTableauSpec | undefined {
  return [FOREST_THREAT_TABLEAU].find((tableau) => tableau.combatIds?.includes(combatId));
}

export function validateDialogueCast(
  tableau: NarrativeTableauSpec,
  sequence: DialogueSequence,
  additionallyRepresented: readonly string[] = [],
): DialogueCastAlignment {
  const requiredSpeakers = [...new Set(sequence.steps.map((step) => step.actorId ?? `speaker:${step.speaker}`))];
  const represented = new Set([...tableau.cast.visualActors, ...additionallyRepresented]);
  const visuallyCovered = requiredSpeakers.filter((actorId) => represented.has(actorId));
  const offscreenByActor = new Map(tableau.cast.justifiedOffscreen.map((entry) => [entry.actorId, entry]));
  const justifiedOffscreen = requiredSpeakers
    .filter((actorId) => !represented.has(actorId))
    .map((actorId) => offscreenByActor.get(actorId))
    .filter((entry): entry is NarrativeOffscreenSpec => entry !== undefined);
  const justifiedIds = new Set(justifiedOffscreen.map((entry) => entry.actorId));
  const unresolved = requiredSpeakers.filter((actorId) => !represented.has(actorId) && !justifiedIds.has(actorId));
  return {
    status: unresolved.length ? 'FAIL' : justifiedOffscreen.length ? 'PASS_WITH_JUSTIFIED_OFFSCREEN' : 'PASS',
    requiredSpeakers,
    visuallyCovered,
    justifiedOffscreen,
    unresolved,
  };
}

export function isNarrativeBeatInteractive(beat: NarrativeBeatSpec): boolean {
  return ['SPEAKER_CARD', 'HELD_DIALOGUE', 'SPATIAL_CHOICE', 'ROUTE_CHOICE', 'CONTEXT_ACTION', 'COMBAT_HANDOFF', 'WAIT_FOR_INPUT'].includes(beat.kind);
}

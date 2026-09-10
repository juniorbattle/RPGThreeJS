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

export const NARRATIVE_LAYOUT_PROFILES = Object.freeze([
  'DIALOGUE_SIDE_COMPACT',
  'DIALOGUE_TOP_CENTER',
  'DIALOGUE_BOTTOM_BAND_RESERVED',
  'DIALOGUE_SPEAKER_FOCUS',
  'INTRO_CAST_PRESENTATION',
  'ADVISER_EXCHANGE',
  'CHOICE_TWO_PATH_SPATIAL',
  'CHOICE_SINGLE_ROUTE_CONTINUE',
  'HELD_VIDEO_DIALOGUE',
] as const);

export type NarrativeLayoutProfile = typeof NARRATIVE_LAYOUT_PROFILES[number];
export const NARRATIVE_LAYOUT_PLACEMENTS = Object.freeze([
  'LEFT',
  'LEFT_UPPER',
  'CENTER_LOWER',
  'CENTER_UPPER',
  'RIGHT',
  'RIGHT_UPPER',
  'TOP_CENTER',
  'BOTTOM_CENTER',
  'SPATIAL',
  'LOWER_RIGHT',
] as const);
export type NarrativeLayoutPlacement = typeof NARRATIVE_LAYOUT_PLACEMENTS[number];
export const NARRATIVE_SPEAKER_ASSOCIATIONS = Object.freeze([
  'SPEAKER_LEFT_LOWER',
  'SPEAKER_LEFT_UPPER',
  'SPEAKER_CENTER_LOWER',
  'SPEAKER_CENTER_UPPER',
  'SPEAKER_RIGHT_LOWER',
  'SPEAKER_RIGHT_UPPER',
  'SPECIAL_TOP_CENTER',
  'SPECIAL_BOTTOM_BAND',
  'ROUTE_SPATIAL',
  'SINGLE_ROUTE_EDGE',
] as const);
export type NarrativeSpeakerAssociation = typeof NARRATIVE_SPEAKER_ASSOCIATIONS[number];
export type NarrativeDialogueSurfaceMode = 'STATIC_TABLEAU' | 'VIDEO_CUTSCENE';
export type NarrativeChoiceScreenLane = 'LEFT' | 'RIGHT';

export interface NarrativeLayoutProfileRule {
  maxCharactersPerSegment: number;
  maxLines: number;
  choiceOnly: boolean;
  allowsScroll: false;
}

export const NARRATIVE_LAYOUT_PROFILE_RULES: Readonly<Record<NarrativeLayoutProfile, NarrativeLayoutProfileRule>> = Object.freeze({
  DIALOGUE_SIDE_COMPACT: { maxCharactersPerSegment: 168, maxLines: 6, choiceOnly: false, allowsScroll: false },
  DIALOGUE_TOP_CENTER: { maxCharactersPerSegment: 220, maxLines: 5, choiceOnly: false, allowsScroll: false },
  DIALOGUE_BOTTOM_BAND_RESERVED: { maxCharactersPerSegment: 240, maxLines: 4, choiceOnly: false, allowsScroll: false },
  DIALOGUE_SPEAKER_FOCUS: { maxCharactersPerSegment: 190, maxLines: 6, choiceOnly: false, allowsScroll: false },
  INTRO_CAST_PRESENTATION: { maxCharactersPerSegment: 200, maxLines: 5, choiceOnly: false, allowsScroll: false },
  ADVISER_EXCHANGE: { maxCharactersPerSegment: 180, maxLines: 6, choiceOnly: false, allowsScroll: false },
  CHOICE_TWO_PATH_SPATIAL: { maxCharactersPerSegment: 190, maxLines: 5, choiceOnly: true, allowsScroll: false },
  CHOICE_SINGLE_ROUTE_CONTINUE: { maxCharactersPerSegment: 0, maxLines: 0, choiceOnly: true, allowsScroll: false },
  HELD_VIDEO_DIALOGUE: { maxCharactersPerSegment: 210, maxLines: 6, choiceOnly: false, allowsScroll: false },
});
export type NarrativePresentationStrategy =
  | 'IN_SCENE'
  | 'OFFSCREEN_CONTEXTUAL'
  | 'SPEAKER_FOCUS'
  | 'GROUP_SCENE'
  | 'STATIC_RESTAGE'
  | 'MEDIA_PHASE_SWITCH'
  | 'FALLBACK';
export type NarrativeRole =
  | 'CURRENT_SPEAKER'
  | 'LISTENER'
  | 'ADVISER'
  | 'PLAYER_REPRESENTATIVE'
  | 'EVENT_SUBJECT'
  | 'AUTHORITY'
  | 'ESCORT'
  | 'BACKGROUND';
export type NarrativeScreenPosition = 'FAR_LEFT' | 'LEFT' | 'CENTER_LEFT' | 'CENTER' | 'CENTER_RIGHT' | 'RIGHT' | 'FAR_RIGHT';

export interface NarrativeStagedActorSpec {
  actorId: string;
  screenPosition: NarrativeScreenPosition;
  scale: number;
  facing: 'LEFT' | 'RIGHT' | 'FORWARD';
  depth: number;
  narrativeRole: NarrativeRole;
}

export interface NarrativeSafeRegionSpec {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NarrativeVisualPhaseSpec {
  id: string;
  stepIds: readonly string[];
  layoutProfile: NarrativeLayoutProfile;
  layoutPlacement: NarrativeLayoutPlacement;
  staticCast: readonly NarrativeStagedActorSpec[];
  mediaSubjects: readonly string[];
  actorRegions: readonly NarrativeSafeRegionSpec[];
  dialogueSafeZone: NarrativeSafeRegionSpec;
  choiceSafeZones: readonly NarrativeSafeRegionSpec[];
  criticalVisualRegions: readonly NarrativeSafeRegionSpec[];
  negativeSpaceIntent: string;
  cameraIntent: string;
}

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
  phases?: readonly NarrativeVisualPhaseSpec[];
  family?: 'AUDIENCE' | 'JOURNEY' | 'EVENT' | 'ATE' | 'PRE_COMBAT' | 'AFTERMATH' | 'FINALE' | 'FALLBACK';
  stillImage?: string;
  exit: 'DIALOGUE_SEQUENCE_COMPLETE' | 'ROUTE_COMMIT' | 'COMBAT_HANDOFF' | 'COMBAT_RESULT' | 'RESOLVED_CAMPAIGN_BOUNDARY';
  next: 'RESOLVED_CAMPAIGN_TABLEAU';
  mediaRemasterNeeded?: boolean;
}

export function resolveNarrativeChoiceScreenLanes(
  tableau: NarrativeTableauSpec,
  choiceCount: number,
): readonly NarrativeChoiceScreenLane[] | undefined {
  if (choiceCount < 1) return undefined;
  const lanes = Array.from<NarrativeChoiceScreenLane | undefined>({ length: choiceCount });
  for (const anchor of tableau.anchors) {
    if (anchor.routeIndex === undefined || anchor.routeIndex < 0 || anchor.routeIndex >= choiceCount) continue;
    if (anchor.placement === 'LEFT' || anchor.placement === 'LOWER_LEFT') lanes[anchor.routeIndex] = 'LEFT';
    if (anchor.placement === 'RIGHT' || anchor.placement === 'LOWER_RIGHT') lanes[anchor.routeIndex] = 'RIGHT';
  }
  return lanes.every((lane): lane is NarrativeChoiceScreenLane => Boolean(lane)) ? lanes : undefined;
}

export interface DialogueCastAlignment {
  status: 'PASS' | 'PASS_WITH_JUSTIFIED_OFFSCREEN' | 'FAIL';
  requiredSpeakers: readonly string[];
  visuallyCovered: readonly string[];
  justifiedOffscreen: readonly NarrativeOffscreenSpec[];
  unresolved: readonly string[];
}

const SAFE_LEFT = Object.freeze({ x: 0.04, y: 0.48, width: 0.34, height: 0.43 });
const SAFE_CENTER_LOWER = Object.freeze({ x: 0.33, y: 0.48, width: 0.34, height: 0.43 });
const SAFE_RIGHT = Object.freeze({ x: 0.62, y: 0.48, width: 0.34, height: 0.43 });
const SAFE_LOW_LEFT = Object.freeze({ x: 0.04, y: 0.68, width: 0.42, height: 0.27 });
const SAFE_LOW_RIGHT = Object.freeze({ x: 0.54, y: 0.68, width: 0.42, height: 0.27 });
const SAFE_CENTER_WORLD = Object.freeze({ x: 0.34, y: 0.08, width: 0.32, height: 0.62 });

function narrativeRoleFor(actorId: string, speakerId?: string): NarrativeRole {
  if (actorId === speakerId) return 'CURRENT_SPEAKER';
  if (actorId === 'sage_seraphine' || actorId === 'maelor') return 'ADVISER';
  if (actorId === 'alaric') return 'AUTHORITY';
  return 'LISTENER';
}

export function stageActors(actorIds: readonly string[], speakerId?: string): NarrativeStagedActorSpec[] {
  const unique = [...new Set(actorIds)].slice(0, 7);
  const positions: NarrativeScreenPosition[][] = [
    ['CENTER'],
    ['CENTER_LEFT', 'CENTER_RIGHT'],
    ['LEFT', 'CENTER', 'RIGHT'],
    ['FAR_LEFT', 'CENTER_LEFT', 'CENTER_RIGHT', 'FAR_RIGHT'],
    ['FAR_LEFT', 'LEFT', 'CENTER', 'RIGHT', 'FAR_RIGHT'],
    ['FAR_LEFT', 'LEFT', 'CENTER_LEFT', 'CENTER_RIGHT', 'RIGHT', 'FAR_RIGHT'],
    ['FAR_LEFT', 'LEFT', 'CENTER_LEFT', 'CENTER', 'CENTER_RIGHT', 'RIGHT', 'FAR_RIGHT'],
  ];
  const selected = positions[Math.max(0, unique.length - 1)] ?? positions[6]!;
  return unique.map((actorId, index) => ({
    actorId,
    screenPosition: selected[index]!,
    scale: 1,
    facing: index < unique.length / 2 ? 'RIGHT' : index > unique.length / 2 ? 'LEFT' : 'FORWARD',
    depth: actorId === speakerId ? 3 : 2,
    narrativeRole: narrativeRoleFor(actorId, speakerId),
  }));
}

function inferTableauFamily(sequence: DialogueSequence): NonNullable<NarrativeTableauSpec['family']> {
  const id = `${sequence.id} ${sequence.title ?? ''} ${sequence.sceneArtId ?? ''}`.toLowerCase();
  if (sequence.id === 'lion_briefing') return 'AUDIENCE';
  if (sequence.id === 'lion_finale_judgement' || /finale|judgement|trial_aftermath|serpent_general_aftermath|epilogue/.test(id)) return 'FINALE';
  if (sequence.id.startsWith('ate_')) return 'ATE';
  if (sequence.id.startsWith('pre_') || sequence.id.endsWith('_pre_combat')) return 'PRE_COMBAT';
  if (sequence.id.startsWith('post_') || sequence.id.endsWith('_aftermath')) return 'AFTERMATH';
  return 'EVENT';
}

export function resolveNarrativeStepLayout(
  sequence: DialogueSequence,
  step: DialogueSequence['steps'][number],
  family: NonNullable<NarrativeTableauSpec['family']>,
): NarrativeLayoutProfile {
  if (step.choices?.length) return 'CHOICE_TWO_PATH_SPATIAL';
  if (sequence.id === 'acte_ouverture') return 'INTRO_CAST_PRESENTATION';
  if (family === 'PRE_COMBAT') return 'DIALOGUE_BOTTOM_BAND_RESERVED';
  if (family === 'AUDIENCE' || family === 'FINALE') {
    if (step.actorId === 'sage_seraphine' || step.actorId === 'maelor') return 'ADVISER_EXCHANGE';
    return 'DIALOGUE_SPEAKER_FOCUS';
  }
  return 'DIALOGUE_SIDE_COMPACT';
}

export function resolveNarrativeStepPlacement(
  profile: NarrativeLayoutProfile,
  step?: DialogueSequence['steps'][number],
  stagedSpeaker?: NarrativeStagedActorSpec,
): NarrativeLayoutPlacement {
  if (profile === 'CHOICE_TWO_PATH_SPATIAL' && !step) return 'SPATIAL';
  if (profile === 'CHOICE_SINGLE_ROUTE_CONTINUE') return 'LOWER_RIGHT';
  if (profile === 'INTRO_CAST_PRESENTATION' || profile === 'DIALOGUE_TOP_CENTER') return 'TOP_CENTER';
  if (profile === 'DIALOGUE_BOTTOM_BAND_RESERVED') return 'BOTTOM_CENTER';
  if (stagedSpeaker) {
    if (['FAR_LEFT', 'LEFT', 'CENTER_LEFT'].includes(stagedSpeaker.screenPosition)) return 'LEFT';
    if (stagedSpeaker.screenPosition === 'CENTER') return 'CENTER_LOWER';
    return 'RIGHT';
  }
  return step?.side === 'left' ? 'LEFT' : 'RIGHT';
}

/** Static tableaux use the same authored horizontal lane as video, lifted above the enlarged cast. */
export function resolveStaticNarrativeStepPlacement(
  profile: NarrativeLayoutProfile,
  step?: DialogueSequence['steps'][number],
  stagedSpeaker?: NarrativeStagedActorSpec,
): NarrativeLayoutPlacement {
  const speakerAlignedProfile = profile === 'DIALOGUE_BOTTOM_BAND_RESERVED' || profile === 'INTRO_CAST_PRESENTATION';
  const placement = speakerAlignedProfile && stagedSpeaker
    ? resolveNarrativeStepPlacement('DIALOGUE_SIDE_COMPACT', step, stagedSpeaker)
    : resolveNarrativeStepPlacement(profile, step, stagedSpeaker);
  if (placement === 'LEFT') return 'LEFT_UPPER';
  if (placement === 'CENTER_LOWER') return 'CENTER_UPPER';
  if (placement === 'RIGHT') return 'RIGHT_UPPER';
  return placement;
}

export function resolveNarrativeSpeakerAssociation(
  placement: NarrativeLayoutPlacement,
): NarrativeSpeakerAssociation {
  if (placement === 'LEFT') return 'SPEAKER_LEFT_LOWER';
  if (placement === 'LEFT_UPPER') return 'SPEAKER_LEFT_UPPER';
  if (placement === 'CENTER_LOWER') return 'SPEAKER_CENTER_LOWER';
  if (placement === 'CENTER_UPPER') return 'SPEAKER_CENTER_UPPER';
  if (placement === 'RIGHT') return 'SPEAKER_RIGHT_LOWER';
  if (placement === 'RIGHT_UPPER') return 'SPEAKER_RIGHT_UPPER';
  if (placement === 'TOP_CENTER') return 'SPECIAL_TOP_CENTER';
  if (placement === 'BOTTOM_CENTER') return 'SPECIAL_BOTTOM_BAND';
  if (placement === 'LOWER_RIGHT') return 'SINGLE_ROUTE_EDGE';
  return 'ROUTE_SPATIAL';
}

function safeZoneForPlacement(placement: NarrativeLayoutPlacement): NarrativeSafeRegionSpec {
  if (placement === 'LEFT') return SAFE_LEFT;
  if (placement === 'LEFT_UPPER') return { x: 0.04, y: 0.08, width: 0.34, height: 0.34 };
  if (placement === 'CENTER_LOWER') return SAFE_CENTER_LOWER;
  if (placement === 'CENTER_UPPER') return { x: 0.33, y: 0.08, width: 0.34, height: 0.34 };
  if (placement === 'RIGHT_UPPER') return { x: 0.62, y: 0.08, width: 0.34, height: 0.34 };
  if (placement === 'TOP_CENTER') return { x: 0.31, y: 0.08, width: 0.38, height: 0.28 };
  if (placement === 'BOTTOM_CENTER') return { x: 0.28, y: 0.72, width: 0.44, height: 0.23 };
  if (placement === 'SPATIAL') return { x: 0.04, y: 0.68, width: 0.92, height: 0.27 };
  return SAFE_RIGHT;
}

function phaseForStep(
  sequence: DialogueSequence,
  step: DialogueSequence['steps'][number],
  allActors: readonly string[],
  family: NonNullable<NarrativeTableauSpec['family']>,
): NarrativeVisualPhaseSpec {
  const actorId = step.actorId;
  const layoutProfile = resolveNarrativeStepLayout(sequence, step, family);
  const staticCast = stageActors(allActors, actorId);
  const stagedSpeaker = staticCast.find((actor) => actor.actorId === actorId);
  const layoutPlacement = resolveNarrativeStepPlacement(layoutProfile, step, stagedSpeaker);
  const choice = Boolean(step.choices?.length);
  return {
    id: `${sequence.id}:${step.id}:${choice ? 'agency' : 'dialogue'}`,
    stepIds: [step.id],
    layoutProfile,
    layoutPlacement,
    staticCast,
    mediaSubjects: actorId ? [actorId] : [],
    actorRegions: [SAFE_CENTER_WORLD],
    dialogueSafeZone: safeZoneForPlacement(layoutPlacement),
    choiceSafeZones: choice ? [SAFE_LOW_LEFT, SAFE_LOW_RIGHT] : [],
    criticalVisualRegions: [SAFE_CENTER_WORLD],
    negativeSpaceIntent: layoutPlacement === 'LEFT'
      ? 'Protect the left card lane while the speaking group remains readable at centre and right.'
      : layoutPlacement === 'RIGHT'
        ? 'Protect the right card lane while the speaking group remains readable at centre and left.'
        : 'Use the declared composition-safe region without obscuring the primary cast cluster.',
    cameraIntent: family === 'PRE_COMBAT' ? 'Wide threat hold with the danger and company both readable.' : 'Stable illustrated tableau with restrained speaker emphasis.',
  };
}

export function createGenericNarrativeTableau(sequence: DialogueSequence): NarrativeTableauSpec {
  const family = inferTableauFamily(sequence);
  const speakers = [...new Set(sequence.steps.map((step) => step.actorId).filter((id): id is string => Boolean(id)))];
  const firstStep = sequence.steps[0];
  const phase = firstStep ? phaseForStep(sequence, firstStep, speakers, family) : undefined;
  const stableCast = stageActors(speakers);
  const phases = phase ? [{
    ...phase,
    id: `${sequence.id}:tableau`,
    stepIds: sequence.steps.map((step) => step.id),
    staticCast: stableCast,
    mediaSubjects: speakers,
    negativeSpaceIntent: 'Keep one stable illustrated composition while cards and speaker emphasis change within it.',
    cameraIntent: family === 'PRE_COMBAT'
      ? 'One stable wide threat composition until the combat handoff.'
      : 'One stable animated-book composition for the complete dialogue exchange.',
  }] : [];
  const beats: NarrativeBeatSpec[] = sequence.steps.map((step) => ({
    id: `${sequence.id}:${step.id}`,
    kind: step.choices?.length ? 'SPATIAL_CHOICE' : family === 'PRE_COMBAT' ? 'CINEMATIC_SUBTITLE' : 'SPEAKER_CARD',
    dialogueStepId: step.id,
    anchorId: (() => {
      const stagedSpeaker = stableCast.find((actor) => actor.actorId === step.actorId);
      const placement = resolveNarrativeStepPlacement(resolveNarrativeStepLayout(sequence, step, family), step, stagedSpeaker);
      if (placement === 'LEFT') return 'card-left';
      if (placement === 'CENTER_LOWER') return 'card-center';
      if (placement === 'TOP_CENTER') return 'card-top';
      if (placement === 'BOTTOM_CENTER') return 'card-bottom';
      if (placement === 'SPATIAL') return 'choice-left';
      return 'card-right';
    })(),
    skippable: false,
  }));
  const tableau: NarrativeTableauSpec = {
    id: `${sequence.id.toUpperCase()}_TABLEAU`,
    grammar: family === 'PRE_COMBAT' ? 'THREAT' : family === 'AFTERMATH' ? 'AFTERMATH' : 'APPROACH',
    dialogueId: sequence.id,
    family,
    media: [],
    cast: {
      visualActors: speakers,
      eventActors: speakers,
      playerRepresentatives: speakers.filter((id) => id === 'sage_seraphine' || id === 'maelor'),
      optionalActors: [],
      justifiedOffscreen: [],
    },
    anchors: [
      { id: 'card-left', placement: 'LOWER_LEFT', safeRegion: SAFE_LEFT },
      { id: 'card-center', placement: 'LOWER_CENTER', safeRegion: SAFE_CENTER_LOWER },
      { id: 'card-right', placement: 'LOWER_RIGHT', safeRegion: SAFE_RIGHT },
      { id: 'card-top', placement: 'CENTER', safeRegion: { x: 0.31, y: 0.08, width: 0.38, height: 0.28 } },
      { id: 'card-bottom', placement: 'LOWER_CENTER', safeRegion: { x: 0.28, y: 0.72, width: 0.44, height: 0.23 } },
      { id: 'choice-left', placement: 'LOWER_LEFT', safeRegion: SAFE_LOW_LEFT, routeIndex: 0 },
      { id: 'choice-right', placement: 'LOWER_RIGHT', safeRegion: SAFE_LOW_RIGHT, routeIndex: 1 },
    ],
    beats,
    phases,
    exit: family === 'PRE_COMBAT' ? 'COMBAT_HANDOFF' : family === 'AFTERMATH' ? 'COMBAT_RESULT' : 'DIALOGUE_SEQUENCE_COMPLETE',
    next: 'RESOLVED_CAMPAIGN_TABLEAU',
  };
  return Object.freeze(tableau);
}

export function createGenericBoundaryTableau(
  presentationKey: string,
  boundary: 'single' | 'branch' | 'terminal',
): NarrativeTableauSpec {
  const branch = boundary === 'branch';
  const phase: NarrativeVisualPhaseSpec = {
    id: `${presentationKey}:journey`,
    stepIds: [],
    layoutProfile: branch ? 'CHOICE_TWO_PATH_SPATIAL' : 'CHOICE_SINGLE_ROUTE_CONTINUE',
    layoutPlacement: branch ? 'SPATIAL' : 'LOWER_RIGHT',
    staticCast: stageActors(['alistair', 'sage_seraphine', 'maelor']),
    mediaSubjects: ['alistair', 'sage_seraphine', 'maelor'],
    actorRegions: [SAFE_CENTER_WORLD],
    dialogueSafeZone: SAFE_LOW_RIGHT,
    choiceSafeZones: branch ? [SAFE_LOW_LEFT, SAFE_LOW_RIGHT] : [SAFE_LOW_RIGHT],
    criticalVisualRegions: [SAFE_CENTER_WORLD],
    negativeSpaceIntent: branch
      ? 'Keep both route directions readable with the company in the open centre.'
      : 'Keep the destination and company readable while the next-step cue occupies the lower right.',
    cameraIntent: branch ? 'Wide spatial fork.' : 'Wide journey tableau with one onward direction.',
  };
  const tableau: NarrativeTableauSpec = {
    id: `BOUNDARY_${presentationKey.replace(/[^a-z0-9]+/gi, '_').toUpperCase()}_TABLEAU`,
    grammar: branch ? 'TWO_PATH_FORK' : 'SINGLE_ROUTE',
    family: 'JOURNEY',
    presentationKey,
    stillImage: '/assets/backdrops/travel_default.png',
    media: [],
    cast: {
      visualActors: ['alistair', 'sage_seraphine', 'maelor'],
      eventActors: [],
      playerRepresentatives: ['sage_seraphine', 'maelor'],
      optionalActors: [],
      justifiedOffscreen: [],
    },
    anchors: branch
      ? [
        { id: 'route-left', placement: 'LOWER_LEFT', safeRegion: SAFE_LOW_LEFT, routeIndex: 0 },
        { id: 'route-right', placement: 'LOWER_RIGHT', safeRegion: SAFE_LOW_RIGHT, routeIndex: 1 },
      ]
      : [{ id: 'next-step', placement: 'LOWER_RIGHT', safeRegion: SAFE_LOW_RIGHT }],
    beats: branch
      ? [{ id: `${presentationKey}:routes`, kind: 'ROUTE_CHOICE', anchorId: 'route-left', skippable: false }]
      : [{ id: `${presentationKey}:continue`, kind: 'CONTEXT_ACTION', anchorId: 'next-step', skippable: false }],
    phases: [phase],
    exit: boundary === 'terminal' ? 'RESOLVED_CAMPAIGN_BOUNDARY' : 'ROUTE_COMMIT',
    next: 'RESOLVED_CAMPAIGN_TABLEAU',
  };
  return Object.freeze(tableau);
}

export const CAMP_DEPARTURE_TABLEAU = Object.freeze<NarrativeTableauSpec>({
  id: 'CAMP_DEPARTURE_TABLEAU',
  grammar: 'SINGLE_ROUTE',
  presentationKey: 'node:lion-camp:arrival',
  family: 'JOURNEY',
  stillImage: '/assets/generated/lion-phase/dialogue/camp_departure.webp',
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
  phases: [{
    id: 'CAMP_DEPARTURE', stepIds: [], layoutProfile: 'CHOICE_SINGLE_ROUTE_CONTINUE', layoutPlacement: 'LOWER_RIGHT',
    staticCast: stageActors(['alistair', 'marian', 'maelor']), mediaSubjects: ['alistair', 'marian', 'maelor'],
    actorRegions: [SAFE_CENTER_WORLD], dialogueSafeZone: SAFE_LOW_RIGHT, choiceSafeZones: [SAFE_LOW_RIGHT], criticalVisualRegions: [SAFE_CENTER_WORLD],
    negativeSpaceIntent: 'The company owns the central road while the next destination remains clear at lower right.',
    cameraIntent: 'Wide departure tableau with a single onward direction.',
  }],
  exit: 'ROUTE_COMMIT',
  next: 'RESOLVED_CAMPAIGN_TABLEAU',
});

export const ALARIC_AUDIENCE_TABLEAU = Object.freeze<NarrativeTableauSpec>({
  id: 'ALARIC_AUDIENCE_TABLEAU',
  grammar: 'APPROACH',
  dialogueId: 'lion_briefing',
  family: 'AUDIENCE',
  stillImage: '/assets/generated/lion-phase/dialogue/lion_briefing.webp',
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
    { id: 'audience-choice-left', placement: 'LOWER_LEFT', routeIndex: 1 },
    { id: 'audience-choice-right', placement: 'LOWER_RIGHT', routeIndex: 0 },
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
  phases: [
    {
      id: 'AUDIENCE_AUTHORITY',
      stepIds: ['1', '1a'],
      layoutProfile: 'DIALOGUE_SPEAKER_FOCUS', layoutPlacement: 'RIGHT',
      staticCast: stageActors(['sage_seraphine', 'maelor', 'alistair', 'alaric'], 'alaric'),
      mediaSubjects: ['alaric'],
      actorRegions: [SAFE_CENTER_WORLD], dialogueSafeZone: SAFE_RIGHT, choiceSafeZones: [], criticalVisualRegions: [SAFE_CENTER_WORLD],
      negativeSpaceIntent: 'Alaric holds the authority axis while the delegation remains readable opposite a compact right card.',
      cameraIntent: 'Wide audience hold, then restrained Alaric emphasis.',
    },
    {
      id: 'AUDIENCE_COMPANY_RESPONSE',
      stepIds: ['1b'],
      layoutProfile: 'DIALOGUE_SPEAKER_FOCUS', layoutPlacement: 'LEFT',
      staticCast: stageActors(['sage_seraphine', 'maelor', 'alistair', 'alaric'], 'alistair'),
      mediaSubjects: ['alistair'],
      actorRegions: [SAFE_CENTER_WORLD], dialogueSafeZone: SAFE_LEFT, choiceSafeZones: [], criticalVisualRegions: [SAFE_CENTER_WORLD],
      negativeSpaceIntent: 'The company response reads on the left without displacing Alaric from the authority axis.',
      cameraIntent: 'Same room geography with the company subtly promoted.',
    },
    {
      id: 'AUDIENCE_ADVISERS',
      stepIds: ['2'],
      layoutProfile: 'ADVISER_EXCHANGE', layoutPlacement: 'LEFT',
      staticCast: stageActors(['sage_seraphine', 'maelor', 'alistair', 'alaric'], 'sage_seraphine'),
      mediaSubjects: ['sage_seraphine', 'maelor'],
      actorRegions: [SAFE_CENTER_WORLD], dialogueSafeZone: SAFE_LEFT, choiceSafeZones: [], criticalVisualRegions: [SAFE_CENTER_WORLD],
      negativeSpaceIntent: 'Both advisers remain legible while Seraphine receives focus above her compact lower-left card.',
      cameraIntent: 'Stable adviser grouping inside the established audience geography.',
    },
    {
      id: 'AUDIENCE_AGENCY',
      stepIds: ['3'],
      layoutProfile: 'CHOICE_TWO_PATH_SPATIAL', layoutPlacement: 'RIGHT',
      staticCast: stageActors(['sage_seraphine', 'maelor', 'alistair', 'alaric'], 'maelor'),
      mediaSubjects: ['alistair', 'sage_seraphine', 'maelor', 'alaric'],
      actorRegions: [SAFE_CENTER_WORLD], dialogueSafeZone: SAFE_RIGHT, choiceSafeZones: [SAFE_LOW_LEFT, SAFE_LOW_RIGHT], criticalVisualRegions: [SAFE_CENTER_WORLD],
      negativeSpaceIntent: 'Maelor owns the clan-side setup card; the mission follows Alaric on the right while the cautious advance request remains with Maelor on the left.',
      cameraIntent: 'Wide choice hold with semantic option placement and unchanged canonical choice truth.',
    },
    {
      id: 'AUDIENCE_RESPONSE',
      stepIds: ['4', '5'],
      layoutProfile: 'DIALOGUE_SPEAKER_FOCUS', layoutPlacement: 'RIGHT',
      staticCast: stageActors(['sage_seraphine', 'maelor', 'alistair', 'alaric'], 'alaric'),
      mediaSubjects: ['alaric'],
      actorRegions: [SAFE_CENTER_WORLD], dialogueSafeZone: SAFE_RIGHT, choiceSafeZones: [], criticalVisualRegions: [SAFE_CENTER_WORLD],
      negativeSpaceIntent: 'Alaric closes the audience from the same authority axis and card lane used by the mandate.',
      cameraIntent: 'Return to the established Alaric emphasis without a geometry jump.',
    },
  ],
  exit: 'DIALOGUE_SEQUENCE_COMPLETE',
  next: 'RESOLVED_CAMPAIGN_TABLEAU',
});

export const FOREST_THREAT_TABLEAU = Object.freeze<NarrativeTableauSpec>({
  id: 'FOREST_THREAT_TABLEAU',
  grammar: 'THREAT',
  dialogueId: 'pre_opening_trail',
  family: 'PRE_COMBAT',
  stillImage: '/assets/generated/lion-phase/dialogue/forest_fork.webp',
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
  family: 'AFTERMATH',
  stillImage: '/assets/generated/lion-phase/dialogue/forest_fork.webp',
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
  family: 'JOURNEY',
  stillImage: '/assets/generated/lion-phase/dialogue/forest_fork.webp',
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
  phases: [{
    id: 'VALMIR_ROUTE_FORK', stepIds: [], layoutProfile: 'CHOICE_TWO_PATH_SPATIAL', layoutPlacement: 'SPATIAL',
    staticCast: stageActors(['sage_seraphine', 'alistair', 'maelor']), mediaSubjects: ['sage_seraphine', 'alistair', 'maelor'],
    actorRegions: [SAFE_CENTER_WORLD], dialogueSafeZone: SAFE_LOW_RIGHT, choiceSafeZones: [SAFE_LOW_LEFT, SAFE_LOW_RIGHT], criticalVisualRegions: [SAFE_CENTER_WORLD],
    negativeSpaceIntent: 'The company holds the open centre while each route control sits beside its visible path.',
    cameraIntent: 'Wide symmetrical fork without implying a selected route.',
  }],
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

export function resolveNarrativeDialogueTableau(
  dialogueId: string,
  sequence?: DialogueSequence,
): NarrativeTableauSpec | undefined {
  return TABLEAUX_BY_DIALOGUE_ID.get(dialogueId) ?? (sequence ? createGenericNarrativeTableau(sequence) : undefined);
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

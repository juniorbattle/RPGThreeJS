export const NARRATIVE_PRESENTATION_MODES = Object.freeze([
  'CINEMATIC_VIDEO',
  'CINEMATIC_HOLD',
  'TRAVEL_STILL',
  'STATIC_TABLEAU',
] as const);

export type NarrativePresentationMode = typeof NARRATIVE_PRESENTATION_MODES[number];

export const PLAYER_FACING_SURFACE_MODES = Object.freeze([
  ...NARRATIVE_PRESENTATION_MODES,
  'COMBAT',
  'GAMEPLAY_UI',
] as const);

export type PlayerFacingSurfaceMode = typeof PLAYER_FACING_SURFACE_MODES[number];

export const NARRATIVE_VISUAL_FAMILIES = Object.freeze([
  'LION_CAMP',
  'ALARIC_AUDIENCE',
  'FOREST_ROAD',
  'FIRST_REFUGE',
  'VALMIR_ROAD',
  'BOIS_CLAIR',
  'SECOND_REFUGE',
  'WITNESS_ROAD',
  'SHADOW_RUINS',
  'FINAL_REFUGE',
  'LION_JUDGEMENT',
  'SERPENT_FINALE',
  'LION_TRIAL',
] as const);

export type NarrativeVisualFamily = typeof NARRATIVE_VISUAL_FAMILIES[number];

export type NarrativeAssetRole =
  | 'VIDEO_MASTER'
  | 'HOLD_STILL'
  | 'TRAVEL_STILL'
  | 'TABLEAU_BACKGROUND'
  | 'COMBAT_SURFACE'
  | 'GAMEPLAY_SURFACE';

export type NarrativeCastOwnership =
  | 'VIDEO_OWNS_CAST'
  | 'STAGE_OWNS_CAST'
  | 'TRAVEL_SURFACE_OWNS_ENVIRONMENT'
  | 'PRIMARY_GAMEPLAY_SURFACE';

export type PresentationFallbackKind =
  | 'CONTEXT_STATIC'
  | 'VIDEO_POSTER_OR_CONTEXT_STATIC'
  | 'HOLD_FRAME_OR_CONTEXT_STATIC'
  | 'TRAVEL_FAMILY_STATIC'
  | 'TABLEAU_LEGACY_BACKGROUND'
  | 'NONE';

export interface PresentationFallbackPolicy {
  kind: PresentationFallbackKind;
  assetId?: string;
  neverReplaysResolvedEvent: true;
  mutatesGameTruth: false;
}

export type TravelStillSource =
  | Readonly<{ kind: 'STATIC_IMAGE'; assetId: string }>
  | Readonly<{ kind: 'LIVING_STILL'; assetId: string; staticFallbackAssetId: string }>;

export interface HoldContinuityIdentity {
  location: string;
  timeContext: string;
  encounter: string;
  activity: string;
}

export type HoldReleaseRule =
  | 'ON_CONTEXT_CHANGE'
  | 'BEFORE_COMBAT'
  | 'BEFORE_TRAVEL'
  | 'AFTER_AGENCY'
  | 'AT_EPILOGUE_TERMINATION';

/**
 * Presentation metadata resolved after authoritative game content has been selected.
 * It contains no route, reward, combat, save, reputation or dialogue-effect authority.
 */
export interface ResolvedPresentationBeat {
  beatId: string;
  mode: PlayerFacingSurfaceMode;
  visualFamily: NarrativeVisualFamily;
  narrativePurpose: string;

  nodeId?: string;
  edgeId?: string;
  contentId?: string;
  dialogueId?: string;
  combatId?: string;

  assetRole: NarrativeAssetRole;
  assetSlotId: string;
  sourceAsset?: string;
  fallbackAsset?: string;

  cinematicId?: string;
  holdSourceCinematicId?: string;
  holdStillAssetId?: string;
  travelStillSource?: TravelStillSource;
  tableauBackgroundId?: string;

  castOwnership: NarrativeCastOwnership;
  staticCast: readonly string[];
  mediaSubjects: readonly string[];

  hasDialogue: boolean;
  hasChoice: boolean;
  continueOnly: boolean;

  holdContinuity?: HoldContinuityIdentity;
  releaseRule?: HoldReleaseRule;

  preloadRefs: readonly string[];
  fallbackPolicy: PresentationFallbackPolicy;
}

export interface PresentationContextIdentity {
  location: string;
  timeContext: string;
  encounter: string;
  activity: string;
}

export function isNarrativePresentationMode(mode: PlayerFacingSurfaceMode): mode is NarrativePresentationMode {
  return (NARRATIVE_PRESENTATION_MODES as readonly string[]).includes(mode);
}

export function holdContinuityMatches(
  hold: HoldContinuityIdentity | undefined,
  context: PresentationContextIdentity,
): boolean {
  return Boolean(
    hold
    && hold.location === context.location
    && hold.timeContext === context.timeContext
    && hold.encounter === context.encounter
    && hold.activity === context.activity,
  );
}


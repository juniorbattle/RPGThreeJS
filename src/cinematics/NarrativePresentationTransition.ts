import {
  holdContinuityMatches,
  type PlayerFacingSurfaceMode,
  type PresentationContextIdentity,
  type ResolvedPresentationBeat,
} from './NarrativePresentationMode';

export type PresentationLifecyclePhase =
  | 'IDLE'
  | 'PREPARING'
  | 'PLAYING'
  | 'DIALOGUE'
  | 'AGENCY'
  | 'TRANSITIONING'
  | 'RELEASED';

export interface PresentationTransitionCheck {
  allowed: boolean;
  releaseHold: boolean;
  diagnostic?: string;
}

/** Presentation transition policy only; campaign sequencing remains owned by GameApp/RunSystem. */
export function checkPresentationTransition(
  from: ResolvedPresentationBeat,
  to: ResolvedPresentationBeat,
  nextContext?: PresentationContextIdentity,
): PresentationTransitionCheck {
  if (from.mode === 'CINEMATIC_HOLD') {
    const compatible = nextContext ? holdContinuityMatches(from.holdContinuity, nextContext) : false;
    if (to.beatId === from.beatId && compatible) return { allowed: true, releaseHold: false };
    return { allowed: true, releaseHold: true };
  }
  return { allowed: true, releaseHold: false };
}

export function validatePrimarySurface(mode: PlayerFacingSurfaceMode, surfaceCount: number): string | undefined {
  if (mode === 'COMBAT' || mode === 'GAMEPLAY_UI') return surfaceCount === 0
    ? undefined
    : `${mode} cannot retain a NarrativeStage primary surface.`;
  return surfaceCount <= 1 ? undefined : `Multiple primary surfaces mounted for ${mode}.`;
}

export function validateResolvedBeatOwnership(beat: ResolvedPresentationBeat): readonly string[] {
  const diagnostics: string[] = [];
  if ((beat.mode === 'CINEMATIC_VIDEO' || beat.mode === 'CINEMATIC_HOLD') && beat.staticCast.length) {
    diagnostics.push(`${beat.beatId}: static cast duplicates media-owned subjects.`);
  }
  if (beat.mode === 'TRAVEL_STILL' && beat.staticCast.length) {
    diagnostics.push(`${beat.beatId}: Travel Still cannot mount theatrical static cast.`);
  }
  if (beat.mode === 'STATIC_TABLEAU' && !beat.tableauBackgroundId) {
    diagnostics.push(`${beat.beatId}: tableau background identity is missing.`);
  }
  if (beat.mode === 'TRAVEL_STILL' && beat.hasDialogue) {
    diagnostics.push(`${beat.beatId}: dialogue-heavy Travel Still requires explicit review.`);
  }
  return diagnostics;
}

export function isEpilogueHoldContinuityValid(
  endingVideo: ResolvedPresentationBeat | undefined,
  epilogue: ResolvedPresentationBeat,
): boolean {
  return Boolean(
    endingVideo?.mode === 'CINEMATIC_VIDEO'
    && epilogue.mode === 'CINEMATIC_HOLD'
    && epilogue.dialogueId === 'epilogue'
    && endingVideo.visualFamily === epilogue.visualFamily
    && endingVideo.nodeId === epilogue.nodeId,
  );
}

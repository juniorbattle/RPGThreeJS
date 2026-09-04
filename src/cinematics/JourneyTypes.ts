/**
 * Cinematic Journey presentation contracts.
 *
 * This module is presentation-only. It never describes campaign topology, run nodes, dialogue,
 * combat or save data: a Journey session is handed finished presentation objects and reports back
 * which affordance the player pressed. Game truth flows into cinematic presentation, never back.
 */

export type JourneySessionState =
  | 'IDLE'
  | 'PLAYING'
  | 'FREEZE'
  | 'AGENCY'
  | 'TRANSITIONING'
  | 'DISPOSED';

/**
 * Legal presentation transitions.
 *
 * IDLE          nothing is presented (also reached again after a freeze is released).
 * PLAYING       a local cinematic is active.
 * FREEZE        playback settled and its final visual presentation is still mounted.
 * AGENCY        interactive Journey controls are shown over the frozen presentation.
 * TRANSITIONING the player committed an action and the current presentation is leaving.
 * DISPOSED      every DOM node, media element, preload and listener owned by the session is gone.
 */
export const JOURNEY_STATE_TRANSITIONS: Readonly<Record<JourneySessionState, readonly JourneySessionState[]>> = Object.freeze({
  IDLE: Object.freeze<JourneySessionState[]>(['PLAYING', 'AGENCY', 'DISPOSED']),
  PLAYING: Object.freeze<JourneySessionState[]>(['FREEZE', 'DISPOSED']),
  FREEZE: Object.freeze<JourneySessionState[]>(['AGENCY', 'TRANSITIONING', 'PLAYING', 'IDLE', 'DISPOSED']),
  AGENCY: Object.freeze<JourneySessionState[]>(['TRANSITIONING', 'DISPOSED']),
  TRANSITIONING: Object.freeze<JourneySessionState[]>(['PLAYING', 'IDLE', 'DISPOSED']),
  DISPOSED: Object.freeze<JourneySessionState[]>([]),
});

export function canJourneyTransition(from: JourneySessionState, to: JourneySessionState): boolean {
  return JOURNEY_STATE_TRANSITIONS[from].includes(to);
}

/**
 * One player-facing affordance. A CIN-2 adapter maps real campaign data into these objects; the
 * Journey layer only renders them and reports the pressed `id` back to its owner.
 */
export interface JourneyChoicePresentation {
  id: string;
  label: string;
  category?: string;
  difficulty?: string;
  hint?: string;
  risk?: string;
  reward?: string;
  disabled?: boolean;
}

export interface JourneySecondaryActionPresentation {
  id: string;
  label: string;
  disabled?: boolean;
}

/** Generic secondary action IDs reserved for later wiring. CIN-1 wires none of them. */
export const JOURNEY_SECONDARY_ACTION_IDS = Object.freeze([
  'COMPANY', 'ROADMAP', 'SAVE', 'MENU', 'CAMP',
] as const);

export type JourneyWellKnownSecondaryActionId = typeof JOURNEY_SECONDARY_ACTION_IDS[number];

export interface JourneyAgencyPresentation {
  title?: string;
  caption?: string;
  /** Zero choices renders a single continuation affordance; one or more renders route buttons. */
  choices: readonly JourneyChoicePresentation[];
  secondary?: readonly JourneySecondaryActionPresentation[];
  continueLabel?: string;
}

/**
 * `aborted` means no player decision was made — the session was disposed, or agency could not be
 * presented at all. It must never be interpreted as a gameplay choice.
 */
export type JourneyCommitKind = 'choice' | 'continue' | 'secondary' | 'aborted';

export interface JourneyCommit {
  kind: JourneyCommitKind;
  id: string | null;
}

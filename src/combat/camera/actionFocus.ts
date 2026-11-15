/**
 * Graded action focus (2026-11-15). Which in-arena shot an action earns, how
 * the camera eases in and out, and how long the action waits for it.
 *
 * Presentation only (COMBAT_AND_VFX, "Combat Stage retired"): the plan reads the
 * action's catalogued identity (weapon attack, skill, Ultimate, boss signature,
 * Fury strike) and the actor's catalogued rank (boss, elite). It never reads
 * damage, AP, status, hit or outcome, and it never delays the resolution more
 * than the push-in it replaces: an action waits at most `releaseSeconds` (the
 * 0.32 s of today's push-in) while a longer, softer ease keeps going.
 *
 * Levels:
 * - `basic`: weapon attacks and items. Unchanged push-in.
 * - `skill`: ordinary skills of heroes and enemies (a clan support casts a
 *   skill). A light push-in that eases in and out softly.
 * - `marked`: skills of elites and bosses and their Fury strike (set 1.21.0). A
 *   closer focus with a light edge falloff, without the spotlight's title.
 * - `spotlight`: hero Ultimates and boss signatures. The existing spotlight.
 *
 * Reduced motion (the game's setting, set 1.22.0, or the combat's reduced
 * effects): the camera never moves. The beats keep today's reduced timings and
 * only the light (edge falloff, spotlight overlay) may change.
 */
import type { CameraEase, ShotKind } from './CombatCameraDirector';

export type ActionFocusLevel = 'basic' | 'skill' | 'marked' | 'spotlight';

export interface ActionFocusInput {
  /** A weapon attack (`spec.key === 'attack'`), Fury strike included. */
  attack?: boolean;
  /** The Fury strike of a boss or elite (set 1.21.0). */
  fury?: boolean;
  /** A catalogued skill: not a weapon attack or an item. */
  skill?: boolean;
  /** A hero Ultimate (skill presentation `ultimate`). */
  ultimate?: boolean;
  /** A boss signature (visual tier 6), whoever casts it. */
  signature?: boolean;
  actorBoss?: boolean;
  actorElite?: boolean;
  /** An area that reaches more than one unit: the shot frames the whole area. */
  multiTarget?: boolean;
  /** QA spotlight preview. */
  forceSpotlight?: boolean;
  /** The game's reduced motion, or the combat's reduced effects. */
  reduced?: boolean;
}

export interface ActionFocusPlan {
  level: ActionFocusLevel;
  kind: Extract<ShotKind, 'action' | 'aoe' | 'skill' | 'focus' | 'spotlight'>;
  /** False under reduced motion: the camera stays on the tactical overview. */
  moveCamera: boolean;
  /** Duration of the camera's ease toward the shot. */
  enterSeconds: number;
  /** How long the action waits before it plays (never longer than the push-in it replaces). */
  releaseSeconds: number;
  /** Duration of the return to the overview (or of the still beat under reduced motion). */
  exitSeconds: number;
  ease: CameraEase;
  /** Grade vignette while the focus holds; null keeps the arena's own. */
  vignette: number | null;
  /** Arena light while the focus holds (1 = full); null keeps it. */
  arenaDim: number | null;
}

/** Today's push-in, kept for weapon attacks: 0.32 s in, 0.45 s back (0.2 s in under reduced motion). */
export const BASIC_FOCUS = Object.freeze({ enterSeconds: 0.32, exitSeconds: 0.45, reducedReleaseSeconds: 0.2 });
/** Ordinary skills: a longer, softer ease that the action does not wait for. */
export const SKILL_FOCUS = Object.freeze({ enterSeconds: 0.55, exitSeconds: 0.5 });
/** Elite and boss skills, the Fury strike: closer, a light edge falloff and a slightly dimmed arena. */
export const MARKED_FOCUS = Object.freeze({ enterSeconds: 0.65, exitSeconds: 0.55, vignette: 1.4, arenaDim: 0.8 });
/** The existing spotlight's camera timings (its lead-in and overlay stay in the runtime). */
export const SPOTLIGHT_FOCUS = Object.freeze({ enterSeconds: 0.5, exitSeconds: 0.6, reducedReleaseSeconds: 0.3 });

export function actionFocusLevel(input: ActionFocusInput): ActionFocusLevel {
  if (input.forceSpotlight || input.ultimate || input.signature) return 'spotlight';
  const ranked = Boolean(input.actorBoss || input.actorElite);
  if (ranked && (input.skill || (input.attack && input.fury))) return 'marked';
  if (input.skill) return 'skill';
  return 'basic';
}

export function resolveActionFocus(input: ActionFocusInput): ActionFocusPlan {
  const level = actionFocusLevel(input);
  const moveCamera = !input.reduced;
  const area = Boolean(input.multiTarget);
  if (level === 'spotlight') {
    return {
      level, kind: 'spotlight', moveCamera,
      enterSeconds: SPOTLIGHT_FOCUS.enterSeconds,
      releaseSeconds: moveCamera ? SPOTLIGHT_FOCUS.enterSeconds : SPOTLIGHT_FOCUS.reducedReleaseSeconds,
      exitSeconds: SPOTLIGHT_FOCUS.exitSeconds,
      ease: 'cubic', vignette: null, arenaDim: null,
    };
  }
  // Under reduced motion every non-spotlight action keeps today's reduced beats: 0.2 s in, 0.45 s out.
  const reducedRelease = BASIC_FOCUS.reducedReleaseSeconds;
  if (level === 'marked') {
    return {
      level, kind: area ? 'aoe' : 'focus', moveCamera,
      enterSeconds: MARKED_FOCUS.enterSeconds,
      releaseSeconds: moveCamera ? BASIC_FOCUS.enterSeconds : reducedRelease,
      exitSeconds: moveCamera ? MARKED_FOCUS.exitSeconds : BASIC_FOCUS.exitSeconds,
      ease: 'sine', vignette: MARKED_FOCUS.vignette, arenaDim: MARKED_FOCUS.arenaDim,
    };
  }
  if (level === 'skill') {
    return {
      level, kind: area ? 'aoe' : 'skill', moveCamera,
      enterSeconds: SKILL_FOCUS.enterSeconds,
      releaseSeconds: moveCamera ? BASIC_FOCUS.enterSeconds : reducedRelease,
      exitSeconds: moveCamera ? SKILL_FOCUS.exitSeconds : BASIC_FOCUS.exitSeconds,
      ease: 'sine', vignette: null, arenaDim: null,
    };
  }
  return {
    level, kind: area ? 'aoe' : 'action', moveCamera,
    enterSeconds: BASIC_FOCUS.enterSeconds,
    releaseSeconds: moveCamera ? BASIC_FOCUS.enterSeconds : reducedRelease,
    exitSeconds: BASIC_FOCUS.exitSeconds,
    ease: 'cubic', vignette: null, arenaDim: null,
  };
}

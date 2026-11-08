/**
 * Set 1.20.0, post-demo Lot 1 — QA driver of the Bear plateau: the generic plateau driver, from a Lion-end save.
 * QA tooling: it never runs in the game and owns no truth.
 */
import type { GameState } from '../game/types';
import { playPlateau, type PlateauPlaythrough, type PlateauScenario } from './plateauDriver';

export type { FinaleIntent, PlayedLine } from './plateauDriver';
export type BearScenario = PlateauScenario;
export type BearPlaythrough = PlateauPlaythrough;

/** Plays the Bear from a completed Lion run to its epilogue, or up to (not into) `stopBefore`. */
export function playBearPlateau(lionEnd: GameState, scenario: BearScenario, seed = 20261108, stopBefore?: string): BearPlaythrough {
  return playPlateau('bear', lionEnd, scenario, seed, stopBefore);
}

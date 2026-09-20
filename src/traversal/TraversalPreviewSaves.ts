import { SaveRepository } from '../game/store';
import type { GameState } from '../game/types';

/** DEV preview persistence stays in memory; the player's V6 saves are never touched. */
export class TraversalPreviewSaves extends SaveRepository {
  private autoState: GameState | null = null;
  private manualState: GameState | null = null;
  override loadAuto(): GameState | null { return structuredClone(this.autoState); }
  override loadManual(): GameState | null { return structuredClone(this.manualState); }
  override saveAuto(state: GameState): void { this.autoState = structuredClone(state); }
  override saveManual(state: GameState): void { this.manualState = structuredClone(state); }
  override hasSave(): boolean { return Boolean(this.autoState || this.manualState); }
  override clear(): void { this.autoState = null; this.manualState = null; }
}

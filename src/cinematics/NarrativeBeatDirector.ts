import { isNarrativeBeatInteractive, type NarrativeBeatKind, type NarrativeBeatSpec } from './NarrativeTableau';

export type NarrativeBeatDirectorState = 'IDLE' | 'RUNNING' | 'WAITING' | 'COMPLETE' | 'DISPOSED';
export type NarrativeBeatAdvanceReason = 'complete' | 'input';

export interface NarrativeBeatDirectorOptions {
  onBeat?: (beat: NarrativeBeatSpec, index: number) => void;
  onStateChange?: (state: NarrativeBeatDirectorState) => void;
}

export class NarrativeBeatDirector {
  private readonly beats: readonly NarrativeBeatSpec[];
  private readonly onBeat: NarrativeBeatDirectorOptions['onBeat'];
  private readonly onStateChange: NarrativeBeatDirectorOptions['onStateChange'];
  private index = -1;
  private currentState: NarrativeBeatDirectorState = 'IDLE';

  constructor(beats: readonly NarrativeBeatSpec[], options: NarrativeBeatDirectorOptions = {}) {
    this.beats = [...beats];
    this.onBeat = options.onBeat;
    this.onStateChange = options.onStateChange;
  }

  get state(): NarrativeBeatDirectorState {
    return this.currentState;
  }

  get current(): NarrativeBeatSpec | null {
    return this.beats[this.index] ?? null;
  }

  get currentIndex(): number {
    return this.index;
  }

  start(): NarrativeBeatSpec | null {
    if (this.currentState === 'DISPOSED') return null;
    if (!this.beats.length) {
      this.setState('COMPLETE');
      return null;
    }
    if (this.index >= 0) return this.current;
    return this.activate(0);
  }

  advance(reason: NarrativeBeatAdvanceReason = 'complete'): NarrativeBeatSpec | null {
    if (this.currentState === 'DISPOSED' || this.currentState === 'COMPLETE') return null;
    const current = this.current ?? this.start();
    if (!current) return null;
    if (isNarrativeBeatInteractive(current) && reason !== 'input') {
      this.setState('WAITING');
      return current;
    }
    return this.activate(this.index + 1);
  }

  skip(): NarrativeBeatSpec | null {
    if (this.currentState === 'DISPOSED' || this.currentState === 'COMPLETE') return null;
    const current = this.current ?? this.start();
    if (!current) return null;
    if (current.skippable === false || isNarrativeBeatInteractive(current)) {
      this.setState('WAITING');
      return current;
    }
    for (let nextIndex = this.index + 1; nextIndex < this.beats.length; nextIndex += 1) {
      const candidate = this.beats[nextIndex]!;
      if (candidate.skippable === false || isNarrativeBeatInteractive(candidate)) return this.activate(nextIndex);
    }
    return this.activate(this.beats.length);
  }

  seekDialogueStep(stepId: string): NarrativeBeatSpec | null {
    if (this.currentState === 'DISPOSED') return null;
    const nextIndex = this.beats.findIndex((beat) => beat.dialogueStepId === stepId);
    return nextIndex < 0 ? this.current : this.activate(nextIndex);
  }

  seekKind(kind: NarrativeBeatKind): NarrativeBeatSpec | null {
    if (this.currentState === 'DISPOSED') return null;
    const nextIndex = this.beats.findIndex((beat, index) => index >= Math.max(0, this.index) && beat.kind === kind);
    return nextIndex < 0 ? this.current : this.activate(nextIndex);
  }

  dispose(): void {
    if (this.currentState === 'DISPOSED') return;
    this.index = -1;
    this.setState('DISPOSED');
  }

  private activate(index: number): NarrativeBeatSpec | null {
    if (index >= this.beats.length) {
      this.index = this.beats.length;
      this.setState('COMPLETE');
      return null;
    }
    this.index = index;
    const beat = this.beats[index]!;
    this.setState(isNarrativeBeatInteractive(beat) ? 'WAITING' : 'RUNNING');
    this.onBeat?.(beat, index);
    return beat;
  }

  private setState(state: NarrativeBeatDirectorState): void {
    if (state === this.currentState) return;
    this.currentState = state;
    this.onStateChange?.(state);
  }
}

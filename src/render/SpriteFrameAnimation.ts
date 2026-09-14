export interface SpriteFrameAnimationDefinition<State extends string> {
  state: State;
  frames: readonly string[];
  frameDurationMs: number;
  loop: boolean;
  returnState?: State;
}

export interface SpriteFrameSample<State extends string> {
  state: State;
  frameIndex: number;
  frameUrl: string;
  loop: boolean;
}

/**
 * Clock-driven, renderer-agnostic frame selection. Rendering hosts own texture
 * loading and sampling; this controller owns only timing and state transitions.
 */
export class SpriteFrameAnimationController<State extends string> {
  private state: State;
  private startedAtMs: number;

  constructor(
    definitions: readonly SpriteFrameAnimationDefinition<State>[],
    initialState: State,
    startedAtMs = 0,
  ) {
    this.definitions = new Map(definitions.map((definition) => [definition.state, definition]));
    if (!this.definitions.has(initialState)) throw new Error(`Unknown initial animation state '${initialState}'.`);
    for (const definition of definitions) {
      if (definition.frames.length === 0) throw new Error(`Animation '${definition.state}' has no frames.`);
      if (!Number.isFinite(definition.frameDurationMs) || definition.frameDurationMs <= 0) {
        throw new Error(`Animation '${definition.state}' has an invalid frame duration.`);
      }
    }
    this.state = initialState;
    this.startedAtMs = startedAtMs;
  }

  private readonly definitions: ReadonlyMap<State, SpriteFrameAnimationDefinition<State>>;

  play(state: State, nowMs: number, restart = true): void {
    if (!this.definitions.has(state)) throw new Error(`Unknown animation state '${state}'.`);
    if (!restart && state === this.state) return;
    this.state = state;
    this.startedAtMs = nowMs;
  }

  currentState(): State {
    return this.state;
  }

  sample(nowMs: number): SpriteFrameSample<State> {
    let definition = this.definition(this.state);
    let elapsed = Math.max(0, nowMs - this.startedAtMs);
    const duration = definition.frames.length * definition.frameDurationMs;

    if (!definition.loop && elapsed >= duration && definition.returnState) {
      this.state = definition.returnState;
      this.startedAtMs += duration;
      definition = this.definition(this.state);
      elapsed = Math.max(0, nowMs - this.startedAtMs);
    }

    const rawIndex = Math.floor(elapsed / definition.frameDurationMs);
    const frameIndex = definition.loop
      ? rawIndex % definition.frames.length
      : Math.min(definition.frames.length - 1, rawIndex);
    return {
      state: this.state,
      frameIndex,
      frameUrl: definition.frames[frameIndex]!,
      loop: definition.loop,
    };
  }

  private definition(state: State): SpriteFrameAnimationDefinition<State> {
    const definition = this.definitions.get(state);
    if (!definition) throw new Error(`Unknown animation state '${state}'.`);
    return definition;
  }
}

import { describe, expect, it } from 'vitest';
import {
  OPTION_C_ANIMATION_DEFINITIONS,
  OPTION_C_PHASE4B_ASSETS,
  OPTION_C_REQUIRED_IMAGE_URLS,
} from './OptionCPhase4bAssets';

describe('Option C Phase 4B runtime asset contract', () => {
  it('keeps four eight-frame states in the isolated DEV namespace', () => {
    expect(OPTION_C_ANIMATION_DEFINITIONS).toHaveLength(4);
    for (const definition of OPTION_C_ANIMATION_DEFINITIONS) {
      expect(definition.frames).toHaveLength(8);
      expect(definition.frames.every((url) => url.startsWith('/assets/dev/option-c/phase4b/'))).toBe(true);
    }
    expect(OPTION_C_REQUIRED_IMAGE_URLS).toHaveLength(36);
  });

  it('keeps surface-specific Forest Road plates separate', () => {
    expect(new Set(Object.values(OPTION_C_PHASE4B_ASSETS.environments)).size).toBe(4);
    expect(OPTION_C_PHASE4B_ASSETS.environments.tableau).not.toBe(OPTION_C_PHASE4B_ASSETS.environments.travel);
  });

  it('records tuned loop and one-shot semantics', () => {
    const byState = new Map(OPTION_C_ANIMATION_DEFINITIONS.map((definition) => [definition.state, definition]));
    expect(byState.get('idle')).toMatchObject({ frameDurationMs: 190, loop: true });
    expect(byState.get('dash')).toMatchObject({ frameDurationMs: 82, loop: false, returnState: 'idle' });
    expect(byState.get('attack')).toMatchObject({ frameDurationMs: 105, loop: false, returnState: 'idle' });
    expect(byState.get('skill')).toMatchObject({ frameDurationMs: 125, loop: false, returnState: 'idle' });
  });
});

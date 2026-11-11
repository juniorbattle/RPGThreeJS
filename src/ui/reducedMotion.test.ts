// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { onReducedMotionChange, prefersReducedMotion } from './ReducedMotion';

afterEach(() => vi.unstubAllGlobals());

function preference(matches: boolean) {
  const query = new EventTarget();
  Object.assign(query, { matches });
  vi.stubGlobal('matchMedia', vi.fn(() => query));
  return query as EventTarget & { matches: boolean };
}

describe('shared motion preference (in-game setting only since set 1.22.0, OD-2026-11-11-E)', () => {
  it('ignores the OS preference: the game setting alone requests reduced motion', () => {
    preference(true);
    expect(prefersReducedMotion(false)).toBe(false);
    expect(prefersReducedMotion()).toBe(false);
    expect(prefersReducedMotion(true)).toBe(true);
  });

  it('keeps game reduction when the OS requests normal motion', () => {
    preference(false);
    expect(prefersReducedMotion(true)).toBe(true);
    expect(prefersReducedMotion(false)).toBe(false);
  });

  it('no longer reacts to OS changes, and its cleanup stays harmless', () => {
    const query = preference(false);
    const observed: boolean[] = [];
    const dispose = onReducedMotionChange(() => observed.push(prefersReducedMotion(false)));
    query.matches = true;
    query.dispatchEvent(new Event('change'));
    expect(observed).toEqual([]);
    dispose();
    dispose();
  });

  it('keeps the game preference and harmless cleanup when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(prefersReducedMotion(true)).toBe(true);
    expect(prefersReducedMotion(false)).toBe(false);
    expect(() => onReducedMotionChange(() => undefined)()).not.toThrow();
  });
});

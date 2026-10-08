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

describe('shared motion preference', () => {
  it('keeps OS reduction when the game explicitly requests normal graphics', () => {
    preference(true);
    expect(prefersReducedMotion(false)).toBe(true);
  });

  it('keeps game reduction when the OS requests normal motion', () => {
    preference(false);
    expect(prefersReducedMotion(true)).toBe(true);
    expect(prefersReducedMotion(false)).toBe(false);
  });

  it('refreshes the effective preference on OS changes and stops after disposal', () => {
    const query = preference(false);
    const observed: boolean[] = [];
    const dispose = onReducedMotionChange(() => observed.push(prefersReducedMotion(false)));
    query.matches = true;
    query.dispatchEvent(new Event('change'));
    query.matches = false;
    query.dispatchEvent(new Event('change'));
    expect(observed).toEqual([true, false]);
    dispose();
    dispose();
    query.matches = true;
    query.dispatchEvent(new Event('change'));
    expect(observed).toEqual([true, false]);
  });

  it('keeps the game preference and harmless cleanup when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(prefersReducedMotion(true)).toBe(true);
    expect(prefersReducedMotion(false)).toBe(false);
    expect(() => onReducedMotionChange(() => undefined)()).not.toThrow();
  });
});

/**
 * The post-demo combat ambiences (OD-2026-11-07-I, set 1.20.0): the six biomes of the closed list, each deterministic
 * from its definition and seed, each its own, each stopping everything it started. Rendered through the recording
 * audio context (`traceAudio.ts`) on fake timers. Whether they sound right is the operator's ear, in the listening lab.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ARENA_THEMES } from '../../combat/arena/arenaThemes';
import { traceAudio } from '../traceAudio';
import { ambienceForScene, startAmbience, type AmbienceId } from './ambience';
import { POST_DEMO_AMBIENCES, postDemoSeed } from './ambiencePostDemo';

const DEMO: readonly AmbienceId[] = ['forest_route', 'bois_clair_burning', 'lion_sanctum', 'map', 'refuge'];

if (typeof (globalThis as { window?: unknown }).window === 'undefined') (globalThis as { window?: unknown }).window = globalThis;
afterEach(() => { vi.useRealTimers(); });

/** An ambience played for `seconds` of its own clock, then stopped and given two seconds to fade. */
function play(id: AmbienceId, seconds = 90) {
  vi.useFakeTimers({ now: 0 });
  const trace = traceAudio(() => Date.now() / 1000);
  const stop = startAmbience(trace.ctx, trace.ctx.createGain(), id);
  vi.advanceTimersByTime(seconds * 1000);
  stop();
  vi.advanceTimersByTime(2000);
  const pending = vi.getTimerCount();
  vi.useRealTimers();
  return { lines: trace.lines(), digest: trace.digest(), pending };
}

describe('the post-demo combat ambiences', () => {
  it('are the six biomes of the closed list, and every arena plays one of the nine', () => {
    expect(POST_DEMO_AMBIENCES).toEqual(['bear_mountains', 'dragon_peaks', 'scorpion_desert', 'tournament_arena', 'corrupted_capital', 'breach']);
    const allowed = new Set<string>([...DEMO.slice(0, 3), ...POST_DEMO_AMBIENCES]);
    for (const theme of Object.values(ARENA_THEMES)) {
      expect(allowed.has(theme.sound), theme.id).toBe(true);
      expect(ambienceForScene(theme.id), theme.id).toBe(theme.sound);
    }
    // each of the six is played by at least one arena
    expect(new Set(Object.values(ARENA_THEMES).map((theme) => theme.sound))).toEqual(allowed);
  });

  it('are deterministic from their definition and seed', () => {
    for (const id of POST_DEMO_AMBIENCES) expect(play(id, 40).digest, id).toBe(play(id, 40).digest);
  });

  it('are each their own: their own seed, noise and graph, apart from each other and from the demo’s beds', () => {
    const seeds = POST_DEMO_AMBIENCES.map(postDemoSeed);
    expect(new Set(seeds).size).toBe(6);
    for (const id of DEMO) expect(seeds).not.toContain(0xa3b1 + id.length * 977);
    const digests = [...DEMO, ...POST_DEMO_AMBIENCES].map((id) => play(id, 30).digest);
    expect(new Set(digests).size).toBe(11);
  });

  it('keep their accents coming, then stop every source and every timer', () => {
    for (const id of POST_DEMO_AMBIENCES) {
      const { lines, pending } = play(id);
      expect(pending, `${id}: timers left after the stop`).toBe(0);
      const kinds = new Map<string, string>();
      for (const line of lines) { const made = /^#(\d+)=(\w+)\(/.exec(line); if (made) kinds.set(made[1]!, made[2]!); }
      const started = new Map<string, string>();
      const stopped = new Set<string>();
      for (const line of lines) {
        const call = /^#(\d+)\.(start|stop)\((.*)\)$/.exec(line);
        if (!call) continue;
        if (call[2] === 'start') started.set(call[1]!, call[3]!); else stopped.add(call[1]!);
      }
      // every oscillator and noise source ends: by its stop, or by the duration given at its start
      for (const [node, args] of started) {
        expect(['Oscillator', 'BufferSource'], `${id}: #${node}`).toContain(kinds.get(node));
        expect(stopped.has(node) || args.split(',').length === 3, `${id}: #${node} never ends`).toBe(true);
      }
      // ninety seconds bring several rounds of accents beyond the beds
      expect(started.size, id).toBeGreaterThan(60);
    }
  });
});

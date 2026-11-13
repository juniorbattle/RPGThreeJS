/**
 * The demo's sound stays as the operator heard it while the post-demo plateaux get their own ambiences
 * (2026-11-13): the Lion's three combat ambiences and the map and refuge loops, rendered through a recording audio
 * context for two minutes of their own clock (every node, parameter, automation, connection, start, stop and buffer
 * byte), the nine music contexts (their written definitions and two full rounds of the generator), the sample bank
 * and the rooms the music plays through, and every cue of the table (its whole graph), are digested and compared
 * with `lionAudio.digests.json`, recorded on `3be080ab` before the post-demo ambiences were written. Identities added
 * later are not in the record and are not checked here. A deliberate change to one of these sounds updates its line:
 * run this file with `AUDIO_DIGEST_PRINT=1` to print the new digests.
 */
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import recorded from './lionAudio.digests.json';
import { scheduleCue, TABLE_CUE_IDS } from './synthCues';
import { startAmbience, type AmbienceId } from './music/ambience';
import { compute, plan, SAMPLED_INSTRUMENTS } from './music/bank';
import { composePass } from './music/compose';
import { HALLS, impulseResponse, type HallId } from './music/hall';
import { THEMES, type MusicContextId } from './music/themes';
import { digestBytes, digestText, traceAudio } from './traceAudio';

const RECORDED: Readonly<Record<string, string>> = recorded;
const DEMO_AMBIENCES: readonly AmbienceId[] = ['forest_route', 'bois_clair_burning', 'lion_sanctum', 'map', 'refuge'];
const DEMO_CONTEXTS: readonly MusicContextId[] = ['title', 'map', 'refuge', 'tension', 'drama', 'combat', 'boss', 'victory', 'defeat'];
const found: Record<string, string> = {};

if (typeof (globalThis as { window?: unknown }).window === 'undefined') (globalThis as { window?: unknown }).window = globalThis;

/** Two minutes of an ambience on its own clock, then its stop and fade. */
function traceAmbience(id: AmbienceId, seconds = 120): string {
  vi.useFakeTimers({ now: 0 });
  const trace = traceAudio(() => Date.now() / 1000);
  const stop = startAmbience(trace.ctx, trace.ctx.createGain(), id);
  vi.advanceTimersByTime(seconds * 1000);
  stop();
  vi.advanceTimersByTime(2000);
  vi.useRealTimers();
  return trace.digest();
}

const PRINT = Boolean(process.env.AUDIO_DIGEST_PRINT);

/** Renders every recorded identity of a kind (every identity when printing) and compares it with its record. */
function check(prefix: string, ids: readonly string[], render: (id: string) => string): void {
  const keys = Object.keys(RECORDED).filter((key) => key.startsWith(`${prefix}:`));
  for (const id of ids) {
    const key = `${prefix}:${id}`;
    if (PRINT || key in RECORDED) found[key] = render(id);
  }
  if (PRINT) return;
  expect(keys.length, `${prefix}: recorded identities`).toBeGreaterThan(0);
  for (const key of keys) expect(found[key], key).toBe(RECORDED[key]);
}

afterEach(() => { vi.useRealTimers(); });

describe('the demo’s sound', () => {
  afterAll(() => { if (process.env.AUDIO_DIGEST_PRINT) console.log(JSON.stringify(found, null, 2)); });

  it('keeps the Lion’s three combat ambiences and the map and refuge loops identical, node by node', () => {
    check('ambience', DEMO_AMBIENCES, (id) => traceAmbience(id as AmbienceId));
  });

  it('keeps the nine music contexts, the sample bank and the rooms identical', () => {
    check('music', DEMO_CONTEXTS, (id) => {
      const theme = THEMES[id as MusicContextId];
      const rounds = Array.from({ length: theme.form.length * 2 }, (_, pass) => composePass(theme, pass));
      return digestText(JSON.stringify([theme, rounds]));
    });
    const items = plan(SAMPLED_INSTRUMENTS);
    check('bank', items.map((item) => `${item.instrument}.${item.root}.${item.layer}`), (key) => {
      const item = items.find((candidate) => `${candidate.instrument}.${candidate.root}.${candidate.layer}` === key)!;
      return digestBytes(compute(48000, item));
    });
    check('hall', Object.keys(HALLS), (hall) => impulseResponse(48000, hall as HallId).map((channel) => digestBytes(channel)).join('|'));
  });

  it('keeps every cue of the table identical, node by node', () => {
    check('cue', TABLE_CUE_IDS, (id) => {
      const trace = traceAudio(() => 0);
      const noise = trace.ctx.createBuffer(1, 48000 * 3, 48000);
      scheduleCue(trace.ctx, trace.ctx.createGain(), noise, id);
      return trace.digest();
    });
  });
});

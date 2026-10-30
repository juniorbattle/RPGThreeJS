import { describe, expect, it } from 'vitest';
import { COMBAT_SOUND_IDS } from '../ui/GameSoundCatalog';
import { renderSynthCue, scheduleSynthCue, SYNTH_CUE_IDS, SYNTH_CUE_MAX_SECONDS } from './synthCues';

/** A recording stand-in for an audio context: it keeps every scheduled start and stop. */
function recorder() {
  const stops: number[] = [];
  const starts: number[] = [];
  const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = () => ({ connect: (next: unknown) => next });
  const ctx = {
    createOscillator: () => ({ ...node(), type: 'sine', frequency: param(), start: (t: number) => starts.push(t), stop: (t: number) => stops.push(t) }),
    createGain: () => ({ ...node(), gain: param() }),
    createBiquadFilter: () => ({ ...node(), type: 'lowpass', frequency: param(), Q: param() }),
    createBufferSource: () => ({ ...node(), buffer: null, start: (t: number) => starts.push(t), stop: (t: number) => stops.push(t) }),
  };
  return { ctx: ctx as unknown as BaseAudioContext, starts, stops };
}

describe('synthesized combat families', () => {
  it('cover exactly the sixteen approved families, adding none', () => {
    expect([...SYNTH_CUE_IDS].sort()).toEqual([...COMBAT_SOUND_IDS].sort());
  });

  it('schedule every family inside one second', () => {
    for (const id of SYNTH_CUE_IDS) {
      const { ctx, starts, stops } = recorder();
      scheduleSynthCue(ctx, {} as AudioNode, {} as AudioBuffer, id);
      expect(starts.length, id).toBeGreaterThan(0);
      expect(Math.max(...stops), id).toBeLessThanOrEqual(SYNTH_CUE_MAX_SECONDS);
    }
  });

  it('renders nothing where offline audio is unavailable', async () => {
    expect(await renderSynthCue('thrust', 48000)).toBeNull();
  });
});

/**
 * The parent owner's mix (OD-2026-11-01-B): every bus sums into one input, then one final limiter before the output.
 * A compressor catches the peaks and a memoryless shaper holds the ceiling: its curve never leaves -1 dBFS, so the
 * sample peak cannot exceed it whatever comes in. Neither node has any effect below the compressor's threshold.
 */

/** -1 dBFS as a sample value. */
export const LIMITER_CEILING = 10 ** (-1 / 20);
const KNEE = 0.72;
/** The compressor's automatic makeup at these settings, taken back so that a quiet mix passes at unity gain. */
const MAKEUP_TRIM = 0.87;

/** Identity up to the knee, then a soft approach to the ceiling; inputs beyond ±1 stay on the curve's last value. */
export function limiterCurve(size = 4097): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(size);
  const room = LIMITER_CEILING - KNEE;
  for (let i = 0; i < size; i++) {
    const x = (i / (size - 1)) * 2 - 1;
    const a = Math.abs(x);
    curve[i] = Math.sign(x) * (a <= KNEE ? a : KNEE + room * Math.tanh((a - KNEE) / room));
  }
  return curve;
}

export interface MixChain { input: GainNode; dispose(): void }

/** Builds the sum and its limiter on any context (the live one, or an offline render for the peak measure). */
export function createMix(ctx: BaseAudioContext, destination: AudioNode = ctx.destination): MixChain {
  const input = ctx.createGain();
  input.gain.value = MAKEUP_TRIM;
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -3; compressor.knee.value = 3; compressor.ratio.value = 20;
  compressor.attack.value = 0.002; compressor.release.value = 0.12;
  const shaper = ctx.createWaveShaper();
  shaper.curve = limiterCurve();
  shaper.oversample = 'none';
  input.connect(compressor);
  compressor.connect(shaper);
  shaper.connect(destination);
  return {
    input,
    dispose: () => { for (const node of [input, compressor, shaper]) { try { node.disconnect(); } catch { /* already gone */ } } },
  };
}

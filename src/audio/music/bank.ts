/**
 * Sample bank (pure): which notes to compute per sampled instrument (one zone every few semitones, transposed at
 * playback; one or two velocity layers; variants for drums), computing a plan item (run in `bank.worker.ts`), and
 * choosing the sample for a note. Adapted from the RPGCards M13 engine (`src/son/musique/banque.ts`).
 */
import * as I from './instruments';

export type SampledInstrument = 'harp' | 'lute' | 'timpani' | 'drum' | 'frame' | 'cymbal';

export interface Zone {
  /** MIDI pitch of the computed note (drums: variant number). */
  root: number;
  layer: number;
  sr: number;
  data: Float32Array<ArrayBuffer>;
}

export type RawBank = Partial<Record<SampledInstrument, Zone[]>>;

interface PitchedDef { kind: 'notes'; from: number; to: number; step: number; layers: number[]; sr: number; synth: (sr: number, m: number, v: number) => Float32Array<ArrayBuffer> }
interface HitDef { kind: 'hit'; variants: number; synth: (sr: number, v: number) => Float32Array<ArrayBuffer> }

const PITCHED_SR = 32000;
export const DEFS: Readonly<Record<SampledInstrument, PitchedDef | HitDef>> = {
  harp: { kind: 'notes', from: 36, to: 92, step: 4, layers: [0.4, 0.85], sr: PITCHED_SR, synth: I.harp },
  lute: { kind: 'notes', from: 40, to: 80, step: 4, layers: [0.45, 0.85], sr: PITCHED_SR, synth: I.lute },
  timpani: { kind: 'notes', from: 33, to: 57, step: 3, layers: [0.8], sr: PITCHED_SR, synth: I.timpani },
  drum: { kind: 'hit', variants: 2, synth: I.warDrum },
  frame: { kind: 'hit', variants: 2, synth: I.frameDrum },
  cymbal: { kind: 'hit', variants: 2, synth: I.cymbal },
};

export const SAMPLED_INSTRUMENTS = Object.keys(DEFS) as SampledInstrument[];

export interface PlanItem { instrument: SampledInstrument; root: number; layer: number }

/** Samples to compute for these instruments, ordered for small batches. */
export function plan(instruments: readonly SampledInstrument[]): PlanItem[] {
  const out: PlanItem[] = [];
  for (const instrument of instruments) {
    const d = DEFS[instrument];
    if (d.kind === 'notes') for (let m = d.from; m <= d.to; m += d.step) for (const layer of d.layers) out.push({ instrument, root: m, layer });
    else for (let v = 0; v < d.variants; v++) out.push({ instrument, root: v, layer: 1 });
  }
  return out;
}

export const sampleRateOf = (instrument: SampledInstrument, contextRate: number): number => {
  const d = DEFS[instrument];
  return d.kind === 'notes' ? d.sr : contextRate;
};

export function compute(contextRate: number, item: PlanItem): Float32Array<ArrayBuffer> {
  const d = DEFS[item.instrument];
  return d.kind === 'notes' ? d.synth(d.sr, item.root, item.layer) : d.synth(contextRate, item.root);
}

export interface Choice { zone: number; rate: number; gain: number }

/** The sample for a note: nearest zone (transposed by playback rate) on the layer just above the velocity; drums by variant. */
export function choose(zones: readonly { root: number; layer: number }[], instrument: SampledInstrument, m: number, v: number): Choice | null {
  const d = DEFS[instrument];
  if (!zones.length) return null;
  if (d.kind === 'hit') {
    const variant = ((Math.round(m) % d.variants) + d.variants) % d.variants;
    const i = zones.findIndex((z) => z.root === variant);
    return i < 0 ? null : { zone: i, rate: 1, gain: Math.max(0, Math.min(1.2, v)) };
  }
  const layer = d.layers.find((c) => c >= v - 0.05) ?? d.layers[d.layers.length - 1]!;
  let best = -1;
  let distance = Infinity;
  zones.forEach((z, i) => {
    if (z.layer !== layer) return;
    const dd = Math.abs(z.root - m);
    if (dd < distance) { distance = dd; best = i; }
  });
  if (best < 0) return null;
  return { zone: best, rate: 2 ** ((m - zones[best]!.root) / 12), gain: Math.max(0, Math.min(1.3, (v / layer) ** 0.8)) };
}

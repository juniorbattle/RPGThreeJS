/**
 * Computed rooms: a stereo impulse response (decorrelated noise, exponential RT60 decay, highs dying faster, a few
 * early reflections) for a ConvolverNode, computed in the music worker. Adapted from the RPGCards M13 engine (`src/son/musique/effets.ts`).
 */
import { seededRandom } from './theory';

export type HallId = 'hall' | 'chapel' | 'field'
  /** The plateaux's rooms, computed on first need: stone close by, open sky, dry sand, brick streets, the void. */
  | 'cave' | 'sky' | 'dune' | 'city' | 'void';

interface HallDef { rt60: number; predelay: number; bright: number; dark: number; early: number }
export const HALLS: Readonly<Record<HallId, HallDef>> = {
  hall: { rt60: 2.4, predelay: 0.025, bright: 8000, dark: 1800, early: 0.35 },
  chapel: { rt60: 3.6, predelay: 0.035, bright: 7000, dark: 1500, early: 0.3 },
  field: { rt60: 1.4, predelay: 0.02, bright: 7500, dark: 2400, early: 0.45 },
  cave: { rt60: 2.2, predelay: 0.012, bright: 3500, dark: 900, early: 0.55 },
  sky: { rt60: 4.8, predelay: 0.07, bright: 9000, dark: 3000, early: 0.12 },
  dune: { rt60: 0.9, predelay: 0.015, bright: 9000, dark: 3500, early: 0.15 },
  city: { rt60: 2.8, predelay: 0.03, bright: 6500, dark: 1600, early: 0.5 },
  void: { rt60: 7, predelay: 0.08, bright: 2500, dark: 1200, early: 0.05 },
};

export function impulseResponse(sr: number, hall: HallId, seed = 47): [Float32Array<ArrayBuffer>, Float32Array<ArrayBuffer>] {
  const d = HALLS[hall];
  const n = Math.round(sr * (d.rt60 * 1.2 + d.predelay));
  const out: [Float32Array<ArrayBuffer>, Float32Array<ArrayBuffer>] = [new Float32Array(n), new Float32Array(n)];
  const p0 = Math.round(d.predelay * sr);
  for (let c = 0; c < 2; c++) {
    const rng = seededRandom(seed * 7 + c);
    const b = out[c]!;
    let lp = 0;
    for (let i = p0; i < n; i++) {
      const t = (i - p0) / sr;
      const env = Math.exp((-6.91 * t) / d.rt60);
      const fc = d.dark + (d.bright - d.dark) * Math.exp(-t / (d.rt60 * 0.35));
      const a = 1 - Math.exp((-2 * Math.PI * fc) / sr);
      lp += a * ((rng() * 2 - 1) - lp);
      b[i] = lp * env * Math.min(1, (i - p0) / (0.004 * sr));
    }
    for (let k = 0; k < 7; k++) {
      const i = p0 + Math.round((0.004 + rng() * 0.06) * sr);
      if (i < n) b[i]! += (rng() < 0.5 ? -1 : 1) * d.early * (1 - k / 8) * 0.6;
    }
  }
  let e = 0;
  for (const b of out) for (let i = 0; i < n; i++) e += b[i]! * b[i]!;
  const g = (1 / Math.sqrt(e / 2 + 1e-9)) * 0.9;
  for (const b of out) for (let i = 0; i < n; i++) b[i]! *= g;
  return out;
}

/**
 * Music theory (pure): MIDI pitches, modes, diatonic degrees and triads.
 * Adapted from the RPGCards M13 engine (`src/son/musique/theorie.ts`) under OD-2026-10-29-B.
 */

export const freq = (m: number): number => 440 * 2 ** ((m - 69) / 12);
export const pc = (m: number): number => ((m % 12) + 12) % 12;

export type Mode = 'ionian' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'aeolian' | 'harmonicMinor';
export const MODES: Readonly<Record<Mode, readonly number[]>> = {
  ionian: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
};

/** MIDI pitch of a diatonic degree (any integer, negative or beyond the octave) above `tonic`. */
export function degreeToMidi(tonic: number, mode: Mode, degree: number): number {
  const scale = MODES[mode];
  const n = scale.length;
  const oct = Math.floor(degree / n);
  const i = degree - oct * n;
  return tonic + oct * 12 + scale[i]!;
}

/** Triad on `degree` (root, third, fifth by stacked diatonic thirds), as MIDI pitches from `tonic`. */
export function triad(tonic: number, mode: Mode, degree: number): [number, number, number] {
  return [degreeToMidi(tonic, mode, degree), degreeToMidi(tonic, mode, degree + 2), degreeToMidi(tonic, mode, degree + 4)];
}

/**
 * Close voicing of a chord's pitch classes inside [lo, hi], nearest to the previous voicing
 * (smooth voice leading); the first voicing sits near the centre of the range.
 */
export function voiceChord(chord: readonly number[], lo: number, hi: number, previous: readonly number[] | null): number[] {
  const classes = chord.map(pc);
  let best: number[] | null = null;
  let bestScore = Infinity;
  for (let inversion = 0; inversion < classes.length; inversion++) {
    for (let base = lo; base <= hi; base++) {
      if (pc(base) !== classes[inversion]) continue;
      const notes = [base];
      for (let k = 1; k < classes.length; k++) {
        let next = notes[k - 1]! + 1;
        while (pc(next) !== classes[(inversion + k) % classes.length]) next++;
        notes.push(next);
      }
      if (notes[notes.length - 1]! > hi) continue;
      const score = previous && previous.length
        ? notes.reduce((sum, n, i) => sum + Math.abs(n - (previous[Math.min(i, previous.length - 1)] ?? n)), 0)
        : Math.abs(notes.reduce((s, n) => s + n, 0) / notes.length - (lo + hi) / 2);
      if (score < bestScore) { bestScore = score; best = notes; }
    }
  }
  return best ?? chord.map((m) => m);
}

/** Seeded random stream (mulberry32): music never draws from gameplay randomness or `Math.random`. */
export function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let v = Math.imul(s ^ (s >>> 15), 1 | s);
    v = (v + Math.imul(v ^ (v >>> 7), 61 | v)) ^ v;
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
}

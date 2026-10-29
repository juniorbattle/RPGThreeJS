/**
 * The five music contexts (OD-2026-10-29-B): original modal themes written for this project. A theme is written once
 * (progression, melody, layers); the generator in `compose.ts` re-voices and varies it on every pass.
 */
import type { SampledInstrument } from './bank';
import type { HallId } from './hall';
import type { Mode } from './theory';
import type { VoiceInstrument } from './voices';

export type MusicContextId = 'title' | 'map' | 'dialogue' | 'combat' | 'boss';
export const MUSIC_CONTEXTS: readonly MusicContextId[] = ['title', 'map', 'dialogue', 'combat', 'boss'];

/** One melody note: bar, beat inside the bar, diatonic degree from the melody root, duration in beats. */
export type MelodyNote = readonly [bar: number, beat: number, degree: number, beats: number];
/** One percussion hit inside a bar: beat, instrument, variant (drums) or degree (timpani), velocity. */
export type Hit = readonly [beat: number, instrument: 'drum' | 'frame' | 'cymbal' | 'timpani', variantOrDegree: number, velocity: number];

export interface ThemeDef {
  id: MusicContextId;
  bpm: number;
  beatsPerBar: number;
  bars: number;
  /** MIDI tonic of the mode (low register; layers add octaves). */
  tonic: number;
  mode: Mode;
  /** Chord degree per bar. */
  progression: readonly number[];
  /** Bars whose chord takes a raised third (a major dominant in minor modes). */
  raisedThird?: readonly number[];
  melody: { instrument: VoiceInstrument; root: number; notes: readonly MelodyNote[]; velocity: number; restEvery?: number };
  /** A second voice answering the melody (horn calls), on alternate passes. */
  counter?: { instrument: VoiceInstrument; root: number; notes: readonly MelodyNote[]; velocity: number };
  pad?: { instrument: VoiceInstrument; lo: number; hi: number; velocity: number };
  bass?: { instrument: VoiceInstrument | SampledInstrument; octave: number; pattern: 'whole' | 'half' | 'rootFifth'; velocity: number };
  arpeggio?: { instrument: SampledInstrument; lo: number; patterns: readonly (readonly number[])[]; perBeat: number; velocity: number };
  ostinato?: { instrument: VoiceInstrument; lo: number; patterns: readonly (readonly number[])[]; perBeat: number; velocity: number; length: number };
  drums?: { bar: readonly Hit[]; fill: readonly Hit[] };
  hall: HallId;
  send: number;
  gain: number;
}

export const THEMES: Readonly<Record<MusicContextId, ThemeDef>> = {
  // Title — "La Voie des Sceaux": D dorian, slow and wide; harp, strings, a flute that names the theme.
  title: {
    id: 'title', bpm: 68, beatsPerBar: 4, bars: 8, tonic: 38, mode: 'dorian',
    progression: [0, 6, 3, 0, 2, 6, 4, 0],
    melody: {
      instrument: 'flute', root: 62, velocity: 0.55, restEvery: 4,
      notes: [
        [0, 0, 4, 2], [0, 2, 3, 1], [0, 3, 2, 1],
        [1, 0, 1, 3], [1, 3, -1, 1],
        [2, 0, 0, 1], [2, 1, 1, 1], [2, 2, 3, 2],
        [3, 0, 2, 3], [3, 3, 0, 1],
        [4, 0, 2, 2], [4, 2, 4, 1], [4, 3, 5, 1],
        [5, 0, 6, 3], [5, 3, 4, 1],
        [6, 0, 4, 1.5], [6, 1.5, 3, 0.5], [6, 2, 2, 1], [6, 3, 1, 1],
        [7, 0, 0, 4],
      ],
    },
    pad: { instrument: 'strings', lo: 50, hi: 69, velocity: 0.38 },
    bass: { instrument: 'strings', octave: 0, pattern: 'whole', velocity: 0.42 },
    arpeggio: { instrument: 'harp', lo: 50, perBeat: 2, velocity: 0.42, patterns: [[0, 1, 2, 3, 4, 3, 2, 1], [0, 2, 1, 3, 2, 4, 3, 5], [0, 1, 2, 4, 3, 2, 1, 2]] },
    hall: 'hall', send: 0.38, gain: 0.9,
  },
  // Map — the road between POIs: G mixolydian, a walking folk pulse; lute, frame drum, flute.
  map: {
    id: 'map', bpm: 96, beatsPerBar: 4, bars: 8, tonic: 43, mode: 'mixolydian',
    progression: [0, 6, 3, 0, 0, 6, 4, 0],
    melody: {
      instrument: 'flute', root: 67, velocity: 0.5, restEvery: 4,
      notes: [
        [0, 0, 4, 1], [0, 1, 4, 0.5], [0, 1.5, 5, 0.5], [0, 2, 4, 1], [0, 3, 2, 1],
        [1, 0, 3, 1.5], [1, 1.5, 2, 0.5], [1, 2, 1, 1], [1, 3, -1, 1],
        [2, 0, 0, 1], [2, 1, 2, 1], [2, 2, 3, 1], [2, 3, 4, 1],
        [3, 0, 4, 2], [3, 2, 2, 2],
        [4, 0, 7, 1], [4, 1, 6, 0.5], [4, 1.5, 7, 0.5], [4, 2, 8, 1], [4, 3, 7, 1],
        [5, 0, 6, 1.5], [5, 1.5, 5, 0.5], [5, 2, 3, 1], [5, 3, 5, 1],
        [6, 0, 4, 1], [6, 1, 3, 1], [6, 2, 1, 1], [6, 3, -1, 1],
        [7, 0, 0, 4],
      ],
    },
    pad: { instrument: 'strings', lo: 55, hi: 72, velocity: 0.26 },
    bass: { instrument: 'lute', octave: 0, pattern: 'rootFifth', velocity: 0.6 },
    arpeggio: { instrument: 'lute', lo: 55, perBeat: 2, velocity: 0.45, patterns: [[0, 2, 1, 2, 0, 2, 1, 2], [0, 1, 2, 1, 3, 1, 2, 1]] },
    drums: {
      bar: [[0, 'frame', 0, 0.75], [1.5, 'frame', 1, 0.45], [2, 'frame', 0, 0.6], [3, 'frame', 1, 0.5], [3.5, 'frame', 1, 0.35]],
      fill: [[0, 'frame', 0, 0.75], [1, 'frame', 1, 0.45], [2, 'frame', 0, 0.6], [2.5, 'frame', 1, 0.45], [3, 'frame', 1, 0.55], [3.25, 'frame', 1, 0.4], [3.5, 'frame', 1, 0.5], [3.75, 'frame', 1, 0.6]],
    },
    hall: 'field', send: 0.26, gain: 0.85,
  },
  // Dialogue and refuge — F major in three, by the fire: harp and soft strings, a sparse flute, no percussion.
  dialogue: {
    id: 'dialogue', bpm: 60, beatsPerBar: 3, bars: 8, tonic: 41, mode: 'ionian',
    progression: [0, 3, 5, 4, 0, 3, 4, 0],
    melody: {
      instrument: 'flute', root: 65, velocity: 0.38, restEvery: 2,
      notes: [
        [0, 0, 4, 2], [0, 2, 2, 1],
        [1, 0, 3, 3],
        [2, 0, 2, 1], [2, 1, 1, 1], [2, 2, 0, 1],
        [3, 0, 1, 3],
        [4, 0, 4, 1], [4, 1, 5, 1], [4, 2, 4, 1],
        [5, 0, 7, 2], [5, 2, 5, 1],
        [6, 0, 4, 1.5], [6, 1.5, 3, 0.5], [6, 2, 1, 1],
        [7, 0, 0, 3],
      ],
    },
    pad: { instrument: 'strings', lo: 53, hi: 69, velocity: 0.28 },
    bass: { instrument: 'harp', octave: 0, pattern: 'whole', velocity: 0.5 },
    arpeggio: { instrument: 'harp', lo: 57, perBeat: 2, velocity: 0.34, patterns: [[0, 2, 4, 2, 3, 2], [0, 1, 2, 3, 4, 3]] },
    hall: 'chapel', send: 0.34, gain: 0.7,
  },
  // Combat — A minor, driving: staccato strings, war drums, timpani, horn calls.
  combat: {
    id: 'combat', bpm: 132, beatsPerBar: 4, bars: 8, tonic: 33, mode: 'aeolian',
    progression: [0, 0, 5, 6, 0, 0, 3, 4], raisedThird: [7],
    melody: {
      instrument: 'horn', root: 57, velocity: 0.72,
      notes: [
        [2, 0, 0, 1.5], [2, 1.5, 2, 0.5], [2, 2, 4, 2],
        [3, 0, 3, 1.5], [3, 1.5, 4, 0.5], [3, 2, 6, 2],
        [4, 0, 7, 3], [4, 3, 6, 1],
        [5, 0, 4, 1], [5, 1, 5, 1], [5, 2, 4, 1], [5, 3, 2, 1],
        [6, 0, 3, 2], [6, 2, 5, 2],
        [7, 0, 4, 4],
      ],
    },
    counter: { instrument: 'strings', root: 69, velocity: 0.5, notes: [[0, 0, 4, 2], [0, 2, 3, 2], [1, 0, 2, 4], [4, 0, 9, 4], [5, 0, 7, 4], [6, 0, 8, 2], [6, 2, 7, 2], [7, 0, 6, 4]] },
    ostinato: { instrument: 'strings', lo: 45, perBeat: 2, velocity: 0.62, length: 0.42, patterns: [[0, 0, 2, 0, 1, 0, 2, 1], [0, 0, 1, 0, 2, 0, 1, 2]] },
    bass: { instrument: 'timpani', octave: 12, pattern: 'half', velocity: 0.62 },
    drums: {
      bar: [[0, 'drum', 0, 0.9], [1, 'frame', 1, 0.4], [1.5, 'drum', 1, 0.5], [2, 'drum', 0, 0.8], [3, 'frame', 1, 0.45], [3.5, 'drum', 1, 0.55]],
      fill: [[0, 'drum', 0, 0.9], [1, 'drum', 1, 0.5], [2, 'drum', 0, 0.8], [2.5, 'drum', 1, 0.55], [3, 'drum', 1, 0.65], [3.25, 'drum', 1, 0.55], [3.5, 'drum', 1, 0.7], [3.75, 'drum', 1, 0.8]],
    },
    hall: 'hall', send: 0.2, gain: 0.85,
  },
  // Boss — D phrygian, heavy: low brass, choir, timpani, war drums, a cymbal swell into each pass.
  boss: {
    id: 'boss', bpm: 112, beatsPerBar: 4, bars: 8, tonic: 26, mode: 'phrygian',
    progression: [0, 1, 0, 1, 5, 6, 1, 0],
    melody: {
      instrument: 'brass', root: 50, velocity: 0.78,
      notes: [
        [0, 0, 0, 2], [0, 2, 1, 2],
        [1, 0, 2, 3], [1, 3, 1, 1],
        [2, 0, 0, 2], [2, 2, 4, 2],
        [3, 0, 5, 2], [3, 2, 4, 2],
        [4, 0, 5, 1], [4, 1, 4, 1], [4, 2, 3, 1], [4, 3, 2, 1],
        [5, 0, 6, 2], [5, 2, 5, 2],
        [6, 0, 1, 4],
        [7, 0, 0, 4],
      ],
    },
    counter: { instrument: 'horn', root: 62, velocity: 0.6, notes: [[4, 0, 4, 2], [4, 2, 2, 2], [5, 0, 3, 4], [6, 0, 1, 2], [6, 2, 2, 2], [7, 0, 0, 4]] },
    pad: { instrument: 'choir', lo: 50, hi: 69, velocity: 0.5 },
    ostinato: { instrument: 'strings', lo: 38, perBeat: 2, velocity: 0.58, length: 0.36, patterns: [[0, 0, 1, 0, 0, 0, 2, 1], [0, 1, 0, 0, 2, 0, 1, 0]] },
    bass: { instrument: 'timpani', octave: 12, pattern: 'rootFifth', velocity: 0.7 },
    drums: {
      bar: [[0, 'drum', 0, 1], [1.5, 'drum', 0, 0.7], [2, 'drum', 0, 0.9], [3, 'drum', 1, 0.6], [3.5, 'drum', 1, 0.7]],
      fill: [[0, 'drum', 0, 1], [1, 'drum', 0, 0.7], [2, 'drum', 0, 0.9], [2.5, 'drum', 1, 0.6], [3, 'drum', 1, 0.7], [3.25, 'drum', 1, 0.6], [3.5, 'drum', 1, 0.8], [3.75, 'drum', 0, 0.9], [2, 'cymbal', 1, 0.7]],
    },
    hall: 'chapel', send: 0.24, gain: 0.85,
  },
};

/** Seconds per beat and per pass of a theme. */
export const beatSeconds = (theme: ThemeDef): number => 60 / theme.bpm;
export const passSeconds = (theme: ThemeDef): number => theme.bars * theme.beatsPerBar * beatSeconds(theme);

/**
 * The nine music contexts (OD-2026-11-01-B): original pieces written for this project. A track is a form of sections,
 * each with its own tempo, key, mode and metre; `compose.ts` re-voices them on every pass. Every looping track carries
 * a written bridge that leaves the loop by tempo, key or metre, and a return that prepares the way back.
 *
 * The Seals motif (scale degrees 1-5-4-2 of the section's mode) runs through every track, reshaped by its place: whole
 * on the horn at the title, on the harp at the refuge, on low brass against the boss. Camp colours are timbres only:
 * Lion brass and fifths, Serpent semitones and phrygian, Bois-Clair lute, flute and frame drum, Shadow choir and silence.
 * The jazz colour of map and refuge (extended chords, syncopation) is a working assumption awaiting the operator's ear.
 * Techniques come from the references, never a melody or an arrangement.
 */
import type { SampledInstrument } from './bank';
import type { HallId } from './hall';
import type { Mode } from './theory';
import type { VoiceInstrument } from './voices';

export type MusicContextId = 'title' | 'map' | 'refuge' | 'tension' | 'drama' | 'combat' | 'boss' | 'victory' | 'defeat';
export const MUSIC_CONTEXTS: readonly MusicContextId[] = ['title', 'map', 'refuge', 'tension', 'drama', 'combat', 'boss', 'victory', 'defeat'];

/** Scale degrees of the Seals motif, counted from 0. */
export const SEALS_MOTIF: readonly number[] = [0, 4, 3, 1];

export type Instrument = SampledInstrument | VoiceInstrument;
/** Combat keeps both levels of one track on the audio clock and only moves their gains. */
export type Layer = 'reflection' | 'action';

/** One percussion hit inside a bar: beat, instrument, variant (drums) or pitch (timpani), velocity. */
export type Hit = readonly [beat: number, instrument: 'drum' | 'kit' | 'frame' | 'cymbal' | 'timpani' | 'anvil' | 'goblet' | 'zill' | 'bell', variantOrPitch: number, velocity: number];

/** A written line: `A4:1.5 E5:0.5 r:2 | …`, note and beats, bars apart. */
export interface Line { name: string; instrument: Instrument; notes: string; v: number; layer?: Layer; cycles?: 'odd' | 'even'; plain?: boolean }

export interface Section {
  name: string;
  bpm: number;
  /** A written tempo change, from this bar to the end of the section. */
  ramp?: { fromBar: number; bpm: number };
  beatsPerBar: number;
  /** Low MIDI tonic of the section's key. */
  tonic: number;
  mode: Mode;
  /** Bars apart, chords inside a bar sharing it evenly; `r` is a written silence. */
  chords: string;
  lines?: readonly Line[];
  pad?: { instrument: VoiceInstrument; lo: number; hi: number; v: number; layer?: Layer };
  bass?: { instrument: Instrument; base: number; pattern: 'whole' | 'half' | 'rootFifth' | 'pulse' | 'syncopated' | 'walk'; v: number; layer?: Layer };
  arpeggio?: { instrument: SampledInstrument; lo: number; patterns: readonly (readonly number[])[]; perBeat: number; v: number; layer?: Layer };
  ostinato?: { instrument: VoiceInstrument; lo: number; patterns: readonly (readonly number[])[]; perBeat: number; v: number; length: number; layer?: Layer };
  drums?: { bar: readonly Hit[]; fill?: readonly Hit[]; layer?: Layer };
  /** Delay of the off-beat eighths, in beats. */
  swing?: number;
}

export interface ThemeDef {
  id: MusicContextId;
  /**
   * A plateau's own track for this context (`bear/map`, `finale/boss@breach`): it names the track and seeds its
   * variations. The Lion's nine tracks have none, so their variations are seeded as before.
   */
  track?: string;
  sections: readonly Section[];
  /** Section indices in playing order; a one-shot plays them once, a track loops from `loopFrom`. */
  form: readonly number[];
  loopFrom?: number;
  hall: HallId;
  send: number;
  gain: number;
  /** A one-shot piece (fanfares): the form once, then silence. */
  once?: boolean;
  /** High-pass of the track, leaving the low end to the impacts. */
  lowCut?: number;
}

const section = (name: string, bpm: number, beatsPerBar: number, tonic: number, mode: Mode, chords: string, rest: Partial<Section> = {}): Section => ({ name, bpm, beatsPerBar, tonic, mode, chords, ...rest });

// ------------------------------------------------------------ title: the road of the Seals, D dorian

const titleBed: Partial<Section> = {
  pad: { instrument: 'strings', lo: 50, hi: 69, v: 0.32 },
  bass: { instrument: 'strings', base: 38, pattern: 'whole', v: 0.4 },
  arpeggio: { instrument: 'harp', lo: 50, perBeat: 2, v: 0.4, patterns: [[0, 1, 2, 3, 4, 3, 2, 1], [0, 2, 1, 3, 2, 4, 3, 5], [0, 1, 2, 4, 3, 2, 1, 2]] },
};

const title: ThemeDef = {
  id: 'title', hall: 'hall', send: 0.38, gain: 0.9,
  form: [0, 1, 2, 3, 4],
  sections: [
    section('A', 68, 4, 38, 'dorian', 'Dm | G | Dm | C | F | C | G | Am', { ...titleBed,
      lines: [{ name: 'lead', instrument: 'horn', v: 0.56, notes: 'D4:2 A4:2 | G4:1.5 E4:0.5 D4:2 | F4:2 A4:1 G4:1 | E4:1 C4:1 D4:2 | A4:2 C5:1 D5:1 | E5:2 C5:2 | B4:1.5 A4:0.5 G4:2 | A4:4' }],
    }),
    section('A2', 68, 4, 38, 'dorian', 'Dm | G | Dm | C | F | C | G | Dm', { ...titleBed,
      lines: [
        { name: 'lead', instrument: 'reed', v: 0.5, notes: 'D5:2 A5:2 | G5:1.5 E5:0.5 D5:2 | F5:2 A5:1 G5:1 | E5:1 C5:1 D5:2 | F5:1 E5:1 D5:1 C5:1 | E5:2 D5:1 C5:1 | B4:1 C5:1 D5:1 E5:1 | D5:4' },
        { name: 'answer', instrument: 'horn', v: 0.36, cycles: 'odd', notes: 'r:4 | D4:4 | r:4 | C4:4 | r:4 | E4:4 | D4:4 | A3:4' },
      ],
    }),
    // no melody: harp and strings alone
    section('B', 68, 4, 41, 'ionian', 'Fmaj7 | C | Dm7 | Am7 | Bbmaj7 | F | Gm7 | A7', { ...titleBed,
      pad: { instrument: 'strings', lo: 53, hi: 72, v: 0.3 }, arpeggio: { ...titleBed.arpeggio!, v: 0.46 },
    }),
    // the bridge leaves the slow four for a three in B-flat, the flute's one moment
    section('bridge', 90, 3, 34, 'ionian', 'Bbmaj7 | Gm7 | Ebmaj7 | Bbmaj7 | Gm7 | Cm7 | F7 | Bbmaj7', {
      pad: { instrument: 'strings', lo: 53, hi: 72, v: 0.24 },
      bass: { instrument: 'harp', base: 34, pattern: 'whole', v: 0.5 },
      arpeggio: { instrument: 'harp', lo: 53, perBeat: 2, v: 0.32, patterns: [[0, 2, 4, 3, 2, 1], [0, 1, 2, 3, 4, 2]] },
      lines: [{ name: 'lead', instrument: 'flute', v: 0.46, notes: 'D5:2 C5:1 | Bb4:3 | G4:1 Bb4:1 Eb5:1 | D5:3 | Bb4:1 D5:1 G5:1 | Eb5:2 C5:1 | A4:1 C5:1 F5:1 | D5:3' }],
    }),
    // the return slows on the dominant of D, the horn already naming the motif on A
    section('return', 72, 4, 38, 'dorian', 'Gm7 | Eb | A7sus4 | A7', { ramp: { fromBar: 1, bpm: 58 },
      pad: { instrument: 'strings', lo: 50, hi: 69, v: 0.34 },
      bass: { instrument: 'strings', base: 33, pattern: 'whole', v: 0.42 },
      lines: [{ name: 'lead', instrument: 'horn', v: 0.5, notes: 'A4:2 G4:2 | Bb4:2 G4:2 | E4:2 D4:2 | C#4:4' }],
    }),
  ],
};

// ------------------------------------------------------------ map: the road between POIs, G mixolydian, Bois-Clair colours

const walk: readonly Hit[] = [[0, 'frame', 0, 0.7], [1.5, 'frame', 1, 0.42], [2, 'frame', 0, 0.56], [3, 'frame', 1, 0.46], [3.5, 'frame', 1, 0.34]];
const walkFill: readonly Hit[] = [[0, 'frame', 0, 0.7], [1, 'frame', 1, 0.42], [2, 'frame', 0, 0.56], [2.5, 'frame', 1, 0.42], [3, 'frame', 1, 0.5], [3.25, 'frame', 1, 0.38], [3.5, 'frame', 1, 0.46], [3.75, 'frame', 1, 0.56]];
const mapBed: Partial<Section> = {
  swing: 0.07,
  pad: { instrument: 'strings', lo: 55, hi: 72, v: 0.2 },
  bass: { instrument: 'lute', base: 43, pattern: 'syncopated', v: 0.56 },
  arpeggio: { instrument: 'lute', lo: 55, perBeat: 2, v: 0.4, patterns: [[0, 2, 1, 2, 0, 2, 1, 2], [0, 1, 2, 1, 3, 1, 2, 1]] },
  drums: { bar: walk, fill: walkFill },
};

const map: ThemeDef = {
  id: 'map', hall: 'field', send: 0.26, gain: 0.85,
  form: [0, 1, 2, 3, 4],
  sections: [
    section('A', 96, 4, 43, 'mixolydian', 'G | F | C | G | Em7 | Am7 | Dm7 | G', { ...mapBed,
      lines: [{ name: 'lead', instrument: 'lute', v: 0.72, notes: 'G4:1.5 D5:1 C5:0.5 A4:1 | F4:1 G4:0.5 A4:1 C5:1.5 | E5:1.5 D5:0.5 C5:1 G4:1 | B4:1 A4:0.5 G4:2.5 | G4:1 B4:0.5 D5:1 E5:1.5 | C5:1 A4:0.5 C5:1 E5:1.5 | D5:1 F5:0.5 E5:1 C5:0.5 A4:1 | G4:4' }],
    }),
    section('A2', 96, 4, 43, 'mixolydian', 'G | F | C | Em7 | Am7 | Dm7 | F | G', { ...mapBed,
      lines: [{ name: 'lead', instrument: 'flute', v: 0.44, notes: 'G5:2 D5:1 E5:1 | F5:1.5 E5:0.5 C5:2 | E5:1 G5:1 E5:1 C5:1 | B4:2 G4:2 | C5:1 E5:1 A5:1.5 G5:0.5 | F5:1 D5:1 A4:2 | A4:1 C5:1 F5:1 E5:1 | D5:0.5 C5:0.5 B4:1 G4:2' }],
    }),
    // no melody: the walk alone, on seventh chords
    section('B', 96, 4, 40, 'aeolian', 'Em7 | Am7 | Cmaj7 | D7 | Em7 | Am7 | Cmaj7 | D7sus4', { ...mapBed, pad: { instrument: 'strings', lo: 55, hi: 74, v: 0.26 } }),
    // the bridge climbs a minor third to B-flat and drops into a half-time swing, the reed on the motif
    section('bridge', 72, 4, 46, 'ionian', 'Bbmaj7 | Gm7 | Cm7 | F7 | Bbmaj7 | Dm7 | Ebmaj7 | Am7', {
      swing: 0.1,
      pad: { instrument: 'strings', lo: 53, hi: 72, v: 0.22 },
      bass: { instrument: 'pizz', base: 36, pattern: 'walk', v: 0.62 },
      arpeggio: { instrument: 'lute', lo: 58, perBeat: 1, v: 0.3, patterns: [[0, 2, 1, 3]] },
      drums: { bar: [[0, 'frame', 0, 0.5], [2, 'frame', 1, 0.34], [3.5, 'frame', 1, 0.26]] },
      lines: [{ name: 'lead', instrument: 'reed', v: 0.48, notes: 'Bb4:1.5 F5:1 Eb5:0.5 C5:1 | D5:2 Bb4:2 | Eb5:1.5 D5:0.5 C5:2 | A4:2 C5:2 | D5:1.5 F5:0.5 D5:2 | A4:1 C5:1 F5:2 | Eb5:1 D5:1 Bb4:2 | C5:2 A4:2' }],
    }),
    // the walk gathers pace on the dominant of G
    section('return', 80, 4, 43, 'mixolydian', 'D7sus4 | D7', { ramp: { fromBar: 0, bpm: 96 }, swing: 0.07,
      pad: { instrument: 'strings', lo: 55, hi: 72, v: 0.22 },
      bass: { instrument: 'lute', base: 38, pattern: 'half', v: 0.56 },
      drums: { bar: walk, fill: walkFill },
      lines: [{ name: 'lead', instrument: 'flute', v: 0.42, notes: 'A4:1 C5:1 D5:1 G5:1 | F#5:2 C5:1 A4:1' }],
    }),
  ],
};

// ------------------------------------------------------------ refuge: by the fire, F major in three

const refugeBed: Partial<Section> = {
  pad: { instrument: 'strings', lo: 53, hi: 69, v: 0.24 },
  bass: { instrument: 'lute', base: 41, pattern: 'whole', v: 0.46 },
  arpeggio: { instrument: 'lute', lo: 57, perBeat: 2, v: 0.3, patterns: [[0, 2, 3, 2, 3, 2], [0, 1, 2, 3, 2, 1]] },
};

const refuge: ThemeDef = {
  id: 'refuge', hall: 'chapel', send: 0.34, gain: 0.72,
  form: [0, 1, 2, 3, 4],
  sections: [
    section('A', 60, 3, 41, 'ionian', 'Fmaj7 | Dm7 | Bbmaj7 | C7 | Am7 | Dm7 | Gm7 | C7', { ...refugeBed,
      lines: [{ name: 'lead', instrument: 'harp', v: 0.62, plain: true, notes: 'F4:1 C5:1 Bb4:0.5 G4:0.5 | A4:2 F4:1 | D5:1 C5:1 Bb4:1 | G4:2 E4:1 | A4:1 C5:1 E5:1 | F5:1.5 E5:0.5 D5:1 | Bb4:1 D5:1 G5:1 | E5:2 C5:1' }],
    }),
    section('A2', 60, 3, 41, 'ionian', 'Fmaj7 | Dm7 | Bbmaj7 | C7 | Am7 | Dm7 | Gm7 | Fmaj7', { ...refugeBed,
      lines: [
        { name: 'lead', instrument: 'harp', v: 0.56, plain: true, notes: 'F4:1 C5:1 Bb4:0.5 G4:0.5 | A4:2 F4:1 | D5:1 C5:1 Bb4:1 | G4:2 E4:1 | A4:1 C5:1 E5:1 | F5:1 A5:1 G5:1 | E5:1 F5:1 D5:1 | C5:3' },
        { name: 'answer', instrument: 'reed', v: 0.34, cycles: 'odd', notes: 'r:3 | r:1 A4:2 | r:3 | r:1 G4:2 | r:3 | r:1 F5:2 | r:3 | r:1 A4:2' },
      ],
    }),
    // the reed sings over the walking fourths, no harp
    section('B', 60, 3, 41, 'ionian', 'Bbmaj7 | Am7 | Gm7 | Fmaj7 | Bbmaj7 | Am7 | Gm7 | C7', { ...refugeBed,
      lines: [{ name: 'lead', instrument: 'reed', v: 0.4, notes: 'D5:2 C5:1 | C5:2 A4:1 | Bb4:1 A4:1 G4:1 | A4:3 | D5:2 F5:1 | E5:2 C5:1 | Bb4:1 D5:1 G4:1 | C5:3' }],
    }),
    // the fire settles: a chromatic drop to D-flat, the time stretching to four
    section('bridge', 54, 4, 37, 'ionian', 'Dbmaj7 | Bbm7 | Gbmaj7 | Ab7 | Dbmaj7 | Bbm7 | Ebm7 | Ab7', {
      pad: { instrument: 'strings', lo: 53, hi: 72, v: 0.26 },
      bass: { instrument: 'harp', base: 37, pattern: 'whole', v: 0.46 },
      arpeggio: { instrument: 'harp', lo: 56, perBeat: 1, v: 0.3, patterns: [[0, 1, 2, 3]] },
      lines: [{ name: 'lead', instrument: 'flute', v: 0.34, notes: 'F5:2 Eb5:2 | Db5:4 | Bb4:2 Db5:1 Bb4:1 | C5:4 | F5:2 Ab5:2 | Gb5:2 F5:2 | Eb5:1 F5:1 Gb5:2 | C5:4' }],
    }),
    // the return comes back to three and waits on C
    section('return', 60, 3, 41, 'ionian', 'Gm7 | C7sus4 | C7', { ramp: { fromBar: 1, bpm: 52 },
      pad: { instrument: 'strings', lo: 53, hi: 69, v: 0.26 },
      bass: { instrument: 'harp', base: 36, pattern: 'whole', v: 0.46 },
      lines: [{ name: 'lead', instrument: 'harp', v: 0.5, plain: true, notes: 'G4:1 Bb4:1 D5:1 | C5:2 Bb4:1 | E4:3' }],
    }),
  ],
};

// ------------------------------------------------------------ tension: E phrygian, Serpent semitones, a low pulse

const pulse: readonly Hit[] = [[0, 'frame', 0, 0.5], [0.75, 'frame', 0, 0.34], [2, 'frame', 0, 0.46], [2.75, 'frame', 0, 0.3]];
const tensionBed: Partial<Section> = {
  pad: { instrument: 'strings', lo: 52, hi: 66, v: 0.26 },
  bass: { instrument: 'pizz', base: 40, pattern: 'pulse', v: 0.5 },
  drums: { bar: pulse },
};

const tension: ThemeDef = {
  id: 'tension', hall: 'hall', send: 0.3, gain: 1.4, lowCut: 70,
  form: [0, 1, 2, 3, 4],
  sections: [
    section('A', 84, 4, 40, 'phrygian', 'Em | F | Em | F | Dm | Em | F | Em', { ...tensionBed,
      lines: [{ name: 'lead', instrument: 'reed', v: 0.44, notes: 'E4:2 B4:1 A4:1 | F4:3 E4:1 | r:4 | r:2 G4:1 F4:1 | A4:2 F4:2 | G4:1 B4:1 E4:2 | F4:1 A4:1 C5:2 | B4:4' }],
    }),
    section('A2', 84, 4, 40, 'phrygian', 'Em | F | Em | F | Dm | Em | F | Em', { ...tensionBed,
      lines: [
        { name: 'lead', instrument: 'strings', v: 0.42, notes: 'E5:2 B5:1 A5:1 | F5:3 E5:1 | G5:2 F5:2 | E5:3 F5:1 | A5:2 F5:2 | G5:2 E5:2 | F5:1 E5:1 C5:2 | B4:4' },
        { name: 'low', instrument: 'horn', v: 0.34, cycles: 'odd', notes: 'r:4 | C4:4 | r:4 | C4:4 | r:4 | B3:4 | r:4 | B3:4' },
      ],
    }),
    // no melody: only the pulse and the strings
    section('B', 84, 4, 40, 'phrygian', 'Em | F | Am | F | Em | F | Dm | F', { ...tensionBed, pad: { instrument: 'strings', lo: 52, hi: 69, v: 0.3 } }),
    // the bridge slips up a semitone and into five, the ground no longer even
    section('bridge', 92, 5, 41, 'phrygian', 'Fm | Gb | Fm | Gb | Ebm | Fm | Gb | F', {
      pad: { instrument: 'strings', lo: 53, hi: 68, v: 0.28 },
      bass: { instrument: 'pizz', base: 41, pattern: 'half', v: 0.54 },
      drums: { bar: [[0, 'frame', 0, 0.54], [1.5, 'frame', 1, 0.34], [3, 'frame', 0, 0.46], [4, 'frame', 1, 0.3]] },
      lines: [{ name: 'lead', instrument: 'reed', v: 0.44, notes: 'F4:2 C5:1.5 Bb4:1.5 | Gb4:3 F4:2 | Ab4:2 Gb4:1.5 F4:1.5 | Gb4:5 | Eb4:1 Gb4:1 Bb4:3 | Ab4:2 C5:1.5 Bb4:1.5 | Gb4:2 Bb4:1.5 Db5:1.5 | C5:5' }],
    }),
    // the return sinks back on the semitone: F held above E until it gives way
    section('return', 84, 4, 40, 'phrygian', 'Gb | F | F7 | F', {
      pad: { instrument: 'strings', lo: 53, hi: 69, v: 0.3 },
      bass: { instrument: 'pizz', base: 41, pattern: 'pulse', v: 0.5 },
      drums: { bar: pulse },
      lines: [{ name: 'lead', instrument: 'reed', v: 0.4, notes: 'Bb4:2 Gb4:2 | A4:4 | Eb5:2 C5:2 | F4:4' }],
    }),
  ],
};

// ------------------------------------------------------------ drama: C minor, Shadow choir and silence

const drama: ThemeDef = {
  id: 'drama', hall: 'chapel', send: 0.42, gain: 1.16,
  form: [0, 1, 2, 3],
  sections: [
    section('A', 54, 4, 36, 'aeolian', 'Cm | Bb | Fm | r | Cm | Ab | Fm | G7', {
      pad: { instrument: 'choir', lo: 55, hi: 72, v: 0.4 },
      bass: { instrument: 'strings', base: 36, pattern: 'whole', v: 0.4 },
      lines: [{ name: 'lead', instrument: 'horn', v: 0.46, notes: 'C4:2 G4:2 | F4:2 D4:2 | Eb4:2 C4:2 | r:4 | G4:1 C5:1 Eb5:2 | C5:2 Ab4:2 | F4:1 Ab4:1 C5:2 | B4:2 G4:2' }],
    }),
    // no melody: strings answered by silence
    section('B', 54, 4, 36, 'aeolian', 'Ab | r | Fm | r | Eb | r | G7 | r', {
      pad: { instrument: 'strings', lo: 53, hi: 72, v: 0.32 },
      bass: { instrument: 'strings', base: 36, pattern: 'whole', v: 0.38 },
    }),
    // the bridge opens into A-flat major and three: the only light in the piece
    section('bridge', 66, 3, 44, 'ionian', 'Abmaj7 | Fm7 | Dbmaj7 | Eb7 | Abmaj7 | Cm7 | Dbmaj7 | G7', {
      pad: { instrument: 'choir', lo: 56, hi: 72, v: 0.3 },
      bass: { instrument: 'harp', base: 37, pattern: 'whole', v: 0.5 },
      arpeggio: { instrument: 'harp', lo: 56, perBeat: 2, v: 0.28, patterns: [[0, 2, 3, 2, 1, 2]] },
      lines: [{ name: 'lead', instrument: 'strings', v: 0.5, notes: 'C5:2 Eb5:1 | Ab4:3 | F5:2 Eb5:1 | Db5:1 Eb5:2 | Eb5:2 G5:1 | Eb5:3 | F5:1 Ab5:1 F5:1 | D5:3' }],
    }),
    // the light goes out on the dominant, slower and slower
    section('return', 54, 4, 36, 'aeolian', 'Fm | Dm7b5 | G7 | G7b9', { ramp: { fromBar: 1, bpm: 46 },
      pad: { instrument: 'choir', lo: 55, hi: 72, v: 0.38 },
      bass: { instrument: 'strings', base: 31, pattern: 'whole', v: 0.42 },
      lines: [{ name: 'lead', instrument: 'horn', v: 0.42, notes: 'C4:2 Ab3:2 | F3:2 Ab3:2 | D4:2 F4:2 | B3:4' }],
    }),
  ],
};

// ------------------------------------------------------------ combat: A minor, two levels of one track

const COMBAT_CUT = 118;
const beat: readonly Hit[] = [[0, 'kit', 0, 0.72], [0, 'drum', 1, 0.36], [1, 'kit', 2, 0.3], [1.5, 'kit', 2, 0.24], [2, 'kit', 1, 0.5], [3, 'kit', 2, 0.3], [3.5, 'kit', 0, 0.5]];
const beatFill: readonly Hit[] = [[0, 'kit', 0, 0.72], [1, 'kit', 1, 0.34], [2, 'kit', 1, 0.5], [2.5, 'kit', 1, 0.36], [3, 'kit', 1, 0.46], [3.25, 'kit', 1, 0.38], [3.5, 'kit', 1, 0.5], [3.75, 'kit', 1, 0.62]];
const combatBed: Partial<Section> = {
  pad: { instrument: 'strings', lo: 57, hi: 76, v: 0.34, layer: 'reflection' },
  bass: { instrument: 'pizz', base: 45, pattern: 'rootFifth', v: 0.5 },
  arpeggio: { instrument: 'pizz', lo: 57, perBeat: 1, v: 0.42, layer: 'reflection', patterns: [[0, 2, 1, 2]] },
  ostinato: { instrument: 'strings', lo: 57, perBeat: 2, v: 0.52, length: 0.34, layer: 'action', patterns: [[0, 0, 2, 0, 1, 0, 2, 1], [0, 0, 1, 0, 2, 0, 1, 2]] },
  drums: { bar: beat, fill: beatFill, layer: 'action' },
};

const combat: ThemeDef = {
  id: 'combat', hall: 'hall', send: 0.2, gain: 1.5, lowCut: COMBAT_CUT,
  form: [0, 1, 2, 3, 4, 5],
  sections: [
    section('A', 126, 4, 33, 'aeolian', 'Am | Am | F | G | Am | Am | Dm | E7', { ...combatBed,
      lines: [
        { name: 'lead', instrument: 'horn', v: 0.66, layer: 'action', notes: 'A4:1.5 E5:1.5 D5:1 | B4:2 C5:2 | F4:1 A4:1 C5:2 | D5:1.5 B4:0.5 G4:2 | A4:1.5 E5:1.5 D5:1 | C5:1 B4:1 A4:2 | F4:1 A4:1 D5:2 | E5:2 G#4:2' },
        { name: 'calm', instrument: 'reed', v: 0.36, layer: 'reflection', plain: true, notes: 'A4:2 E5:2 | D5:2 B4:2 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4' },
      ],
    }),
    section('A2', 126, 4, 33, 'aeolian', 'Am | Am | F | G | Am | Am | Dm | E7', { ...combatBed,
      lines: [
        { name: 'lead', instrument: 'strings', v: 0.6, layer: 'action', notes: 'E5:1.5 A5:1.5 G5:1 | E5:2 C5:2 | F5:1 E5:1 C5:2 | D5:1.5 G5:0.5 D5:2 | C5:1 E5:1 A5:2 | G5:1 F5:1 E5:2 | F5:1 A5:1 D6:2 | B5:2 G#5:2' },
        { name: 'call', instrument: 'horn', v: 0.5, layer: 'action', cycles: 'odd', notes: 'r:4 | A3:2 E4:2 | r:4 | G3:2 D4:2 | r:4 | A3:2 E4:2 | r:4 | E4:4' },
      ],
    }),
    section('B', 126, 4, 36, 'ionian', 'C | G | Am | Em | F | C | Dm | E7', { ...combatBed,
      bass: { instrument: 'pizz', base: 48, pattern: 'rootFifth', v: 0.5 },
      lines: [
        { name: 'lead', instrument: 'horn', v: 0.62, layer: 'action', notes: 'G4:1 C5:1 E5:2 | D5:1.5 B4:0.5 G4:2 | A4:1 C5:1 E5:2 | B4:2 G4:2 | A4:1 C5:1 F5:2 | E5:1.5 D5:0.5 C5:2 | D5:1 E5:1 F5:2 | E5:4' },
        { name: 'calm', instrument: 'reed', v: 0.32, layer: 'reflection', plain: true, notes: 'r:4 | r:4 | r:4 | r:4 | C5:2 F5:2 | E5:4 | r:4 | r:4' },
      ],
    }),
    // no melody: ostinato and drums on action, one held colour on reflection
    section('C', 126, 4, 33, 'aeolian', 'Am | F | Am | G | Am | F | Dm | E', { ...combatBed }),
    // the bridge halves the drive and climbs to C minor: Lion brass in open fifths
    section('bridge', 96, 4, 36, 'aeolian', 'Cm | Ab | Eb | Bb | Cm | Ab | Fm | G', {
      pad: { instrument: 'strings', lo: 55, hi: 74, v: 0.28, layer: 'reflection' },
      bass: { instrument: 'pizz', base: 48, pattern: 'half', v: 0.52 },
      drums: { bar: [[0, 'kit', 0, 0.6], [2, 'kit', 1, 0.42], [2, 'timpani', 48, 0.42]], layer: 'action' },
      lines: [
        { name: 'lion-low', instrument: 'brass', v: 0.6, layer: 'action', notes: 'C4:2 G4:2 | Ab3:2 Eb4:2 | Eb4:2 Bb4:2 | Bb3:2 F4:2 | C4:1 G4:1 C5:2 | Ab3:1 Eb4:1 Ab4:2 | F3:2 C4:2 | G3:4' },
        { name: 'lion-high', instrument: 'horn', v: 0.52, layer: 'action', notes: 'G4:2 D5:2 | Eb4:2 Bb4:2 | Bb4:2 F5:2 | F4:2 C5:2 | G4:1 D5:1 G4:2 | Eb4:1 Bb4:1 Eb5:2 | C4:2 G4:2 | D4:4' },
        { name: 'calm', instrument: 'reed', v: 0.34, layer: 'reflection', plain: true, notes: 'C5:2 G5:2 | F5:2 D5:2 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4' },
      ],
    }),
    // the return gathers pace back to A minor over its dominant
    section('return', 100, 4, 33, 'aeolian', 'Am | F | Dm | E7', { ramp: { fromBar: 0, bpm: 126 },
      pad: { instrument: 'strings', lo: 57, hi: 76, v: 0.3, layer: 'reflection' },
      bass: { instrument: 'pizz', base: 45, pattern: 'half', v: 0.52 },
      drums: { bar: [[0, 'kit', 0, 0.6], [2, 'kit', 1, 0.44], [3, 'kit', 1, 0.34], [3.5, 'kit', 1, 0.44]], fill: beatFill, layer: 'action' },
      lines: [{ name: 'lead', instrument: 'horn', v: 0.56, notes: 'E4:2 A4:2 | C5:2 A4:2 | F4:1 A4:1 D5:2 | E5:1 D5:1 B4:1 G#4:1' }],
    }),
  ],
};

// ------------------------------------------------------------ boss: D phrygian, orchestra and drums at full drive

const BOSS_CUT = 96;
const drive: readonly Hit[] = [[0, 'kit', 0, 0.82], [0, 'drum', 1, 0.5], [0.5, 'kit', 2, 0.3], [1, 'kit', 1, 0.56], [1.5, 'kit', 0, 0.56], [2, 'kit', 0, 0.74], [2.5, 'kit', 2, 0.3], [3, 'kit', 1, 0.6], [3.5, 'kit', 2, 0.34]];
const driveFill: readonly Hit[] = [[0, 'kit', 0, 0.82], [1, 'kit', 1, 0.5], [2, 'kit', 1, 0.56], [2.5, 'kit', 1, 0.44], [3, 'kit', 1, 0.6], [3.25, 'kit', 1, 0.5], [3.5, 'kit', 1, 0.64], [3.75, 'kit', 1, 0.74], [2, 'cymbal', 1, 0.6]];
const bossBed: Partial<Section> = {
  pad: { instrument: 'choir', lo: 53, hi: 69, v: 0.42 },
  bass: { instrument: 'pizz', base: 38, pattern: 'pulse', v: 0.56, layer: 'action' },
  arpeggio: { instrument: 'pizz', lo: 50, perBeat: 1, v: 0.4, layer: 'reflection', patterns: [[0, 1, 0, 2]] },
  ostinato: { instrument: 'strings', lo: 50, perBeat: 2, v: 0.5, length: 0.3, layer: 'action', patterns: [[0, 0, 1, 0, 0, 0, 2, 1], [0, 1, 0, 0, 2, 0, 1, 0]] },
  drums: { bar: drive, fill: driveFill, layer: 'action' },
};

const boss: ThemeDef = {
  id: 'boss', hall: 'chapel', send: 0.22, gain: 1.08, lowCut: BOSS_CUT,
  form: [0, 1, 2, 3, 4, 5, 6], loopFrom: 1,
  sections: [
    // the entry: at most six seconds, low brass naming the motif over a timpani roll, straight into the drive
    section('entry', 84, 4, 38, 'phrygian', 'D5 | Eb D5', {
      pad: { instrument: 'choir', lo: 50, hi: 69, v: 0.4 },
      drums: { bar: [[0, 'timpani', 38, 0.7], [1, 'timpani', 38, 0.5], [2, 'timpani', 38, 0.6], [3, 'timpani', 38, 0.7], [3.5, 'timpani', 38, 0.8], [2, 'cymbal', 1, 0.7]] },
      lines: [{ name: 'lead', instrument: 'brass', v: 0.74, notes: 'D3:2 A3:2 | G3:1 Eb3:1 D3:2' }],
    }),
    section('A', 138, 4, 38, 'phrygian', 'Dm | Eb | Dm | Eb | Bb | C | Eb | D5', { ...bossBed,
      lines: [
        { name: 'lead', instrument: 'brass', v: 0.74, layer: 'action', notes: 'D4:1.5 A4:1.5 G4:1 | Eb4:2 D4:2 | F4:1 G4:1 A4:2 | Bb4:1.5 A4:0.5 G4:2 | D5:1.5 C5:1.5 Bb4:1 | C5:2 G4:2 | Bb4:1 A4:1 G4:1 Eb4:1 | D4:4' },
        { name: 'calm', instrument: 'horn', v: 0.44, layer: 'reflection', plain: true, notes: 'D4:2 A4:2 | G4:2 Eb4:2 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4' },
      ],
    }),
    section('A2', 138, 4, 38, 'phrygian', 'Dm | Eb | Dm | Eb | Bb | C | Eb | D5', { ...bossBed,
      lines: [
        { name: 'lead', instrument: 'strings', v: 0.6, layer: 'action', notes: 'D5:1.5 A5:1.5 G5:1 | Eb5:2 D5:2 | F5:1 G5:1 A5:2 | Bb5:1.5 A5:0.5 G5:2 | D6:1.5 C6:1.5 Bb5:1 | C6:2 G5:2 | Bb5:1 A5:1 G5:1 Eb5:1 | D5:4' },
        { name: 'call', instrument: 'horn', v: 0.58, layer: 'action', notes: 'r:4 | D4:2 A4:2 | r:4 | Eb4:2 Bb4:2 | r:4 | C4:2 G4:2 | r:4 | D4:4' },
      ],
    }),
    section('B', 138, 4, 43, 'aeolian', 'Gm | Eb | Cm | D | Gm | Eb | Bb | A', { ...bossBed,
      bass: { instrument: 'pizz', base: 43, pattern: 'pulse', v: 0.56, layer: 'action' },
      lines: [
        { name: 'lead', instrument: 'horn', v: 0.66, layer: 'action', notes: 'G4:1 Bb4:1 D5:2 | Eb5:1.5 D5:0.5 Bb4:2 | C5:1 Eb5:1 G5:2 | F#5:2 D5:2 | G4:1 Bb4:1 D5:2 | G5:1.5 F5:0.5 Eb5:2 | D5:1 C5:1 Bb4:2 | A4:4' },
      ],
    }),
    // no melody: the drive alone
    section('C', 138, 4, 38, 'phrygian', 'Dm | Eb | Dm | Eb | Bb | C | Eb | D5', { ...bossBed, pad: { instrument: 'choir', lo: 55, hi: 72, v: 0.36, layer: 'reflection' } }),
    // the bridge turns the pulse into six and climbs to F minor: the Shadow choir takes the line
    section('bridge', 156, 6, 41, 'aeolian', 'Fm | Db | Bbm | C | Fm | Db | Gb | C7', {
      pad: { instrument: 'strings', lo: 56, hi: 72, v: 0.3 },
      bass: { instrument: 'pizz', base: 41, pattern: 'half', v: 0.56 },
      drums: { bar: [[0, 'kit', 0, 0.72], [3, 'kit', 1, 0.56], [4.5, 'kit', 2, 0.3], [5, 'kit', 0, 0.46]], layer: 'action' },
      lines: [{ name: 'lead', instrument: 'choir', v: 0.62, notes: 'F4:3 C5:3 | Db5:3 F5:3 | Bb4:3 Db5:3 | C5:3 E5:3 | F5:3 Ab5:3 | F5:3 Db5:3 | Bb4:3 Gb5:3 | E5:6' }],
    }),
    // the return pulls the brass back onto the semitone above D, then the dominant
    section('return', 118, 4, 38, 'phrygian', 'Eb | Eb D5 | Eb | A7', { ramp: { fromBar: 0, bpm: 138 },
      pad: { instrument: 'choir', lo: 53, hi: 69, v: 0.42 },
      bass: { instrument: 'pizz', base: 39, pattern: 'pulse', v: 0.56 },
      drums: { bar: [[0, 'kit', 0, 0.74], [2, 'kit', 1, 0.56], [3, 'kit', 1, 0.5], [3.5, 'kit', 1, 0.6]], fill: driveFill, layer: 'action' },
      lines: [{ name: 'lead', instrument: 'brass', v: 0.7, notes: 'Eb4:1.5 Bb4:1.5 G4:1 | Eb4:2 D4:2 | G4:1 Bb4:1 Eb5:2 | C#5:2 E4:2' }],
    }),
  ],
};

// ------------------------------------------------------------ fanfares
// Short on purpose: the next surface waits for the fanfare's end (it is never cut), so a long one leaves the music
// behind a player who moves on quickly (operator, 2026-11-03).

const victory: ThemeDef = {
  id: 'victory', hall: 'hall', send: 0.3, gain: 0.82, once: true,
  form: [0],
  sections: [section('fanfare', 112, 4, 41, 'ionian', 'F C | F', {
    pad: { instrument: 'strings', lo: 53, hi: 72, v: 0.36 },
    bass: { instrument: 'timpani', base: 41, pattern: 'half', v: 0.6 },
    lines: [
      { name: 'lead', instrument: 'brass', v: 0.74, notes: 'F4:0.5 C5:0.5 Bb4:0.5 G4:0.5 D5:1 E5:1 | F5:4' },
      { name: 'low', instrument: 'horn', v: 0.56, notes: 'C4:1 F4:1 G4:2 | A4:4' },
    ],
    arpeggio: { instrument: 'harp', lo: 53, perBeat: 4, v: 0.3, patterns: [[0, 1, 2, 3, 4, 5, 6, 5]] },
  })],
};

const defeat: ThemeDef = {
  id: 'defeat', hall: 'chapel', send: 0.42, gain: 1.3, once: true,
  form: [0],
  sections: [section('fanfare', 78, 4, 38, 'aeolian', 'Dm | Bb Dm', {
    pad: { instrument: 'choir', lo: 53, hi: 69, v: 0.4 },
    bass: { instrument: 'strings', base: 38, pattern: 'whole', v: 0.44 },
    lines: [{ name: 'lead', instrument: 'horn', v: 0.48, notes: 'D4:2 A4:1 G4:1 | E4:1 F4:1 D4:2' }],
  })],
};

export const THEMES: Readonly<Record<MusicContextId, ThemeDef>> = { title, map, refuge, tension, drama, combat, boss, victory, defeat };

/** Which section a pass plays: the form once, then its looping part. */
export function sectionIndexAt(theme: ThemeDef, pass: number): number {
  const from = theme.loopFrom ?? 0;
  const length = theme.form.length;
  return theme.form[pass < length ? pass : from + ((pass - from) % (length - from))]!;
}
export const sectionAt = (theme: ThemeDef, pass: number): Section => theme.sections[sectionIndexAt(theme, pass)]!;
/** How many times the form has come round at this pass. */
export const passCycle = (theme: ThemeDef, pass: number): number => Math.floor(pass / theme.form.length);

export const sectionBars = (section: Section): number => section.chords.split('|').length;
export const sectionBeats = (section: Section): number => sectionBars(section) * section.beatsPerBar;

/** Seconds from the section's start to a beat, through its written tempo change. */
export function beatTime(section: Section, beat: number): number {
  const spb = 60 / section.bpm;
  if (!section.ramp) return beat * spb;
  const from = section.ramp.fromBar * section.beatsPerBar;
  if (beat <= from) return beat * spb;
  const span = sectionBeats(section) - from;
  const slope = (section.ramp.bpm - section.bpm) / span;
  return from * spb + (Math.abs(slope) < 1e-9 ? (beat - from) * spb : (60 / slope) * Math.log((section.bpm + slope * (beat - from)) / section.bpm));
}
export const sectionSeconds = (section: Section): number => beatTime(section, sectionBeats(section));
/** One full round of a track's looping form, or a one-shot's length. */
export function formSeconds(theme: ThemeDef): number {
  return theme.form.slice(theme.loopFrom ?? 0).reduce((sum, index) => sum + sectionSeconds(theme.sections[index]!), 0);
}

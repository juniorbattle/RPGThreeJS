/**
 * The Scorpion: sand and ink (sketch, PLATEAU_MUSIC_DRAFT_2026-11-13). Flat, scorched and exact where the Dragon floats:
 * A phrygian with a major third, whose augmented second burns, a limping seven (2+2+3) like a caravan's gait, a hammered
 * dulcimer for the scholars' precision, a breathy reed flute for the wind on the dunes, a goblet drum and copper finger
 * cymbals, a dry room with almost no echo. The Seals motif ends on the lowered second (1-5-4-b2). The Phoenix's flame
 * is the one light, in D major, in the drama's bridge. No frame drum and no lute: those are the Lion's.
 */
import type { Hit, ThemeDef } from '../themes';
import { section, withEntry, type PartMusic } from './score';

// ------------------------------------------------------------ map: the sand tracks, A phrygian dominant in seven

const caravan: readonly Hit[] = [[0, 'goblet', 0, 0.55], [2, 'goblet', 1, 0.32], [4, 'goblet', 0, 0.42], [5, 'goblet', 1, 0.28], [6, 'goblet', 2, 0.28]];
const caravanFill: readonly Hit[] = [[0, 'goblet', 0, 0.55], [2, 'goblet', 1, 0.35], [3, 'goblet', 2, 0.3], [4, 'goblet', 0, 0.45], [5, 'goblet', 1, 0.32], [6, 'goblet', 1, 0.4], [0, 'zill', 0, 0.22]];
const tracks = {
  pad: { instrument: 'strings', lo: 45, hi: 64, v: 0.16 },
  bass: { instrument: 'strings', base: 33, pattern: 'whole', v: 0.36 },
  arpeggio: { instrument: 'dulcimer', lo: 57, perBeat: 1, v: 0.32, patterns: [[0, 2, 1, 2, 0, 3, 2], [0, 1, 2, 3, 2, 1, 0]] },
  drums: { bar: caravan, fill: caravanFill },
} as const;

const map: ThemeDef = {
  id: 'map', track: 'scorpion/map', hall: 'dune', send: 0.2, gain: 1.29,
  form: [0, 1, 2, 3, 4],
  sections: [
    section('A', 180, 7, 45, 'phrygianDominant', 'A | Bb | A | Gm | A | Dm | Bb | A', { ...tracks,
      lines: [{ name: 'lead', instrument: 'ney', v: 0.5, notes: 'A4:2 E5:2 D5:3 | Bb4:4 C#5:1 D5:2 | E5:3 D5:1 C#5:1 Bb4:2 | G4:2 Bb4:2 A4:3 | C#5:2 E5:2 F5:3 | E5:2 D5:2 F5:1 E5:2 | D5:2 C#5:2 Bb4:3 | A4:7' }],
    }),
    // the dulcimer writes the line out, the reed flute answering
    section('A2', 180, 7, 45, 'phrygianDominant', 'A | Bb | A | Gm | A | Dm | Bb | A', { ...tracks,
      lines: [
        { name: 'lead', instrument: 'dulcimer', v: 0.55, notes: 'A5:2 E5:2 D5:3 | Bb4:2 D5:2 F5:3 | E5:2 C#5:2 Bb4:3 | G4:2 Bb4:2 D5:3 | C#5:2 E5:2 A5:3 | F5:2 E5:2 D5:3 | D5:2 C#5:2 Bb4:3 | A4:7' },
        { name: 'answer', instrument: 'ney', v: 0.34, cycles: 'odd', notes: 'r:7 | r:4 F5:3 | r:7 | r:4 D5:3 | r:7 | r:4 A5:3 | r:7 | r:4 E5:3' },
      ],
    }),
    // no melody: the drum and the dulcimer on the drone
    section('B', 180, 7, 45, 'phrygianDominant', 'Dm | C#dim | Dm | A | Gm | Bb | C#dim | A', { ...tracks }),
    // the bridge goes up to D in nine (2+2+2+3): the double reed over copper cymbals, night on the dunes
    section('bridge', 200, 9, 38, 'phrygianDominant', 'D | Eb | D | Cm | D | Gm | Eb | D', {
      pad: { instrument: 'strings', lo: 50, hi: 66, v: 0.2 },
      bass: { instrument: 'strings', base: 38, pattern: 'whole', v: 0.38 },
      drums: { bar: [[0, 'goblet', 0, 0.5], [2, 'goblet', 1, 0.3], [4, 'goblet', 1, 0.3], [6, 'goblet', 0, 0.4], [8, 'goblet', 2, 0.28], [0, 'zill', 1, 0.2]] },
      lines: [{ name: 'lead', instrument: 'reed', v: 0.44, notes: 'D5:2 A5:2 G5:2 Eb5:3 | Eb5:4 D5:2 C5:3 | F#5:2 G5:2 A5:2 F#5:3 | G5:4 Eb5:2 C5:3 | D5:2 F#5:2 A5:2 C6:3 | Bb5:4 A5:2 G5:3 | G5:2 F#5:2 Eb5:2 D5:3 | D5:9' }],
    }),
    // the return slows into the lowered second and waits there
    section('return', 160, 7, 45, 'phrygianDominant', 'Dm | Gm | Bb | Bb', { ramp: { fromBar: 0, bpm: 180 }, ...tracks,
      lines: [{ name: 'lead', instrument: 'ney', v: 0.46, notes: 'F5:2 E5:2 D5:3 | Bb4:2 D5:2 G5:3 | F5:2 E5:2 D5:3 | C#5:4 Bb4:3' }],
    }),
  ],
};

// ------------------------------------------------------------ refuge: the oasis, D harmonic minor under the stars

const oasis = {
  pad: { instrument: 'strings', lo: 50, hi: 66, v: 0.18 },
  bass: { instrument: 'strings', base: 38, pattern: 'whole', v: 0.34 },
  arpeggio: { instrument: 'dulcimer', lo: 57, perBeat: 1, v: 0.26, patterns: [[0, 2, 1, 3, 2, 1, 2], [0, 1, 2, 1, 3, 1, 2]] },
  drums: { bar: [] as readonly Hit[], fill: [[0, 'zill', 0, 0.18]] as readonly Hit[] },
} as const;

const refuge: ThemeDef = {
  id: 'refuge', track: 'scorpion/refuge', hall: 'dune', send: 0.26, gain: 0.91,
  form: [0, 1, 2, 3],
  sections: [
    section('A', 140, 7, 38, 'harmonicMinor', 'Dm | Gm | A | Dm | Bb | Gm | A | A', { ...oasis,
      lines: [{ name: 'lead', instrument: 'ney', v: 0.42, plain: true, notes: 'D5:3 A4:2 F5:2 | G5:4 F5:1 E5:2 | E5:3 C#5:2 A4:2 | F5:2 E5:2 D5:3 | D5:3 F5:2 Bb5:2 | A5:2 G5:2 Bb4:3 | C#5:2 E5:2 G5:3 | A5:7' }],
    }),
    // the dulcimer on the motif
    section('B', 140, 7, 38, 'harmonicMinor', 'Bb | Gm | A | Dm | Bb | Gm | Edim | A', { ...oasis,
      lines: [{ name: 'lead', instrument: 'dulcimer', v: 0.42, plain: true, notes: 'D5:2 A5:2 G5:3 | E5:4 D5:1 E5:2 | C#5:3 A4:2 E5:2 | F5:4 E5:1 D5:2 | D5:2 F5:2 Bb5:3 | A5:2 G5:2 D5:3 | E5:2 G5:2 Bb5:3 | A5:7' }],
    }),
    // the bridge settles into B-flat and an even four
    section('bridge', 60, 4, 46, 'ionian', 'Bbmaj7 | Gm7 | Ebmaj7 | F | Bbmaj7 | Dm7 | Gm7 | A', {
      pad: { instrument: 'strings', lo: 50, hi: 69, v: 0.2 },
      bass: { instrument: 'strings', base: 46, pattern: 'whole', v: 0.34 },
      arpeggio: { instrument: 'dulcimer', lo: 58, perBeat: 1, v: 0.24, patterns: [[0, 1, 2, 3]] },
      lines: [{ name: 'lead', instrument: 'ney', v: 0.36, notes: 'D5:2 F5:2 | Bb4:4 | G5:2 F5:1 Eb5:1 | C5:4 | D5:2 F5:2 | A5:2 F5:2 | G5:2 D5:2 | C#5:4' }],
    }),
    section('return', 140, 7, 38, 'harmonicMinor', 'Gm | Edim | A', { ramp: { fromBar: 1, bpm: 120 }, ...oasis,
      lines: [{ name: 'lead', instrument: 'ney', v: 0.4, plain: true, notes: 'Bb4:2 D5:2 G5:3 | G5:2 E5:2 Bb4:3 | A4:7' }],
    }),
  ],
};

// ------------------------------------------------------------ tension: the records, a clock of copper and skin

const clock: readonly Hit[] = [[0, 'goblet', 0, 0.42], [2, 'goblet', 2, 0.22], [4, 'goblet', 2, 0.22], [6, 'zill', 1, 0.2]];

const tension: ThemeDef = {
  id: 'tension', track: 'scorpion/tension', hall: 'dune', send: 0.24, gain: 1.8, lowCut: 70,
  form: [0, 1, 2, 3],
  sections: [
    section('A', 168, 7, 45, 'phrygianDominant', 'A | Bb | A | Bb | Gm | A | Bb | A', {
      pad: { instrument: 'strings', lo: 45, hi: 62, v: 0.24 },
      bass: { instrument: 'strings', base: 33, pattern: 'whole', v: 0.36 },
      drums: { bar: clock },
      lines: [{ name: 'lead', instrument: 'reed', v: 0.42, notes: 'A4:2 E5:2 D5:3 | Bb4:7 | r:7 | E5:2 F5:2 E5:3 | D5:2 Bb4:2 G4:3 | A4:3 C#5:2 E5:2 | F5:4 E5:3 | D5:4 C#5:3' }],
    }),
    // no melody: the clock and the drone
    section('B', 168, 7, 45, 'phrygianDominant', 'A | Bb | Dm | Bb | A | Bb | Gm | Bb', {
      pad: { instrument: 'strings', lo: 45, hi: 64, v: 0.28 },
      bass: { instrument: 'strings', base: 33, pattern: 'whole', v: 0.36 },
      drums: { bar: clock },
    }),
    // the bridge slips a semitone up into an even four
    section('bridge', 84, 4, 46, 'phrygianDominant', 'Bb | B | Bb | Abm | Bb | Ebm | B | Bb', {
      pad: { instrument: 'strings', lo: 46, hi: 64, v: 0.26 },
      bass: { instrument: 'strings', base: 34, pattern: 'whole', v: 0.36 },
      drums: { bar: [[0, 'goblet', 0, 0.42], [2, 'goblet', 2, 0.24], [3, 'zill', 1, 0.2]] },
      lines: [{ name: 'lead', instrument: 'ney', v: 0.44, notes: 'Bb4:2 F5:2 | Eb5:2 B4:2 | D5:4 | r:4 | F5:2 Gb5:2 | Eb5:4 | D5:2 B4:2 | Bb4:4' }],
    }),
    section('return', 168, 7, 45, 'phrygianDominant', 'Bb | A | Gm | Bb', {
      pad: { instrument: 'strings', lo: 45, hi: 64, v: 0.28 },
      bass: { instrument: 'strings', base: 33, pattern: 'whole', v: 0.36 },
      drums: { bar: clock },
      lines: [{ name: 'lead', instrument: 'reed', v: 0.4, notes: 'D5:4 Bb4:3 | C#5:7 | Bb4:2 D5:2 G5:3 | F5:4 D5:3' }],
    }),
  ],
};

// ------------------------------------------------------------ drama: ink and ashes, the Phoenix's flame in the bridge

const drama: ThemeDef = {
  id: 'drama', track: 'scorpion/drama', hall: 'dune', send: 0.32, gain: 0.86,
  form: [0, 1, 2, 3],
  sections: [
    section('A', 120, 7, 45, 'phrygianDominant', 'A | Dm | Bb | r | A | Gm | Bb | A', {
      pad: { instrument: 'strings', lo: 45, hi: 64, v: 0.3 },
      bass: { instrument: 'strings', base: 33, pattern: 'whole', v: 0.38 },
      lines: [{ name: 'lead', instrument: 'ney', v: 0.5, notes: 'A4:2 E5:2 D5:3 | Bb4:4 A4:3 | D5:2 F5:2 Bb4:3 | r:7 | C#5:2 E5:2 A5:3 | G5:4 F5:1 E5:2 | F5:2 D5:2 Bb4:3 | A4:7' }],
    }),
    // no melody: strings answered by silence
    section('B', 120, 7, 45, 'phrygianDominant', 'Dm | r | Bb | r | Gm | r | A | r', {
      pad: { instrument: 'strings', lo: 45, hi: 64, v: 0.3 },
      bass: { instrument: 'strings', base: 33, pattern: 'whole', v: 0.38 },
    }),
    // the bridge is the Phoenix's flame: D major in three, the only light
    section('bridge', 66, 3, 38, 'ionian', 'D | A | Bm | G | D | A | G | A', {
      pad: { instrument: 'strings', lo: 50, hi: 69, v: 0.28 },
      bass: { instrument: 'strings', base: 38, pattern: 'whole', v: 0.4 },
      arpeggio: { instrument: 'dulcimer', lo: 62, perBeat: 2, v: 0.26, patterns: [[0, 2, 3, 2, 1, 2]] },
      lines: [{ name: 'lead', instrument: 'strings', v: 0.48, notes: 'F#5:2 A5:1 | E5:3 | D5:2 F#5:1 | B4:3 | A4:1 D5:1 F#5:1 | E5:2 C#5:1 | B4:1 D5:1 G5:1 | E5:3' }],
    }),
    section('return', 120, 7, 45, 'phrygianDominant', 'Gm | Dm | Bb', { ramp: { fromBar: 1, bpm: 100 },
      pad: { instrument: 'strings', lo: 45, hi: 64, v: 0.32 },
      bass: { instrument: 'strings', base: 33, pattern: 'whole', v: 0.38 },
      lines: [{ name: 'lead', instrument: 'ney', v: 0.46, notes: 'G4:2 Bb4:2 D5:3 | F5:2 E5:2 D5:3 | C#5:4 Bb4:3' }],
    }),
  ],
};

// ------------------------------------------------------------ combat: the verdict of the sands, two levels in seven

const verdict: readonly Hit[] = [[0, 'goblet', 0, 0.8], [2, 'goblet', 1, 0.45], [4, 'goblet', 0, 0.6], [5, 'goblet', 1, 0.4], [6, 'goblet', 2, 0.45], [0, 'drum', 1, 0.3]];
const verdictFill: readonly Hit[] = [[0, 'goblet', 0, 0.8], [1, 'goblet', 2, 0.4], [2, 'goblet', 1, 0.5], [3, 'goblet', 2, 0.4], [4, 'goblet', 0, 0.6], [5, 'goblet', 1, 0.5], [5.5, 'goblet', 1, 0.4], [6, 'goblet', 1, 0.6], [0, 'zill', 0, 0.35]];
const combatBed = {
  pad: { instrument: 'strings', lo: 57, hi: 72, v: 0.18, layer: 'reflection' },
  bass: { instrument: 'strings', base: 33, pattern: 'whole', v: 0.32 },
  arpeggio: { instrument: 'dulcimer', lo: 57, perBeat: 1, v: 0.18, layer: 'reflection', patterns: [[0, 2, 1, 3, 2, 1, 0]] },
  ostinato: { instrument: 'strings', lo: 57, perBeat: 1, v: 0.5, length: 0.4, layer: 'action', patterns: [[0, 1, 0, 1, 0, 2, 1], [0, 2, 1, 0, 2, 1, 3]] },
  drums: { bar: verdict, fill: verdictFill, layer: 'action' },
} as const;

const combat: ThemeDef = {
  id: 'combat', track: 'scorpion/combat', hall: 'dune', send: 0.16, gain: 1.74, lowCut: 118,
  form: [0, 1, 2, 3, 4, 5],
  sections: [
    section('A', 270, 7, 45, 'phrygianDominant', 'A | A | Bb | A | Dm | Gm | Bb | A', { ...combatBed,
      lines: [
        { name: 'lead', instrument: 'strings', v: 0.6, layer: 'action', notes: 'A4:2 E5:2 D5:3 | Bb4:4 C#5:3 | D5:2 F5:2 Bb5:3 | A5:4 E5:3 | F5:2 E5:2 D5:3 | Bb4:2 D5:2 G5:3 | F5:2 E5:2 D5:3 | C#5:4 A4:3' },
        { name: 'calm', instrument: 'ney', v: 0.3, layer: 'reflection', plain: true, notes: 'A4:7 | E5:7 | r:7 | r:7 | r:7 | r:7 | r:7 | r:7' },
      ],
    }),
    section('A2', 270, 7, 45, 'phrygianDominant', 'A | A | Bb | A | Dm | Gm | Bb | A', { ...combatBed,
      lines: [
        { name: 'lead', instrument: 'brass', v: 0.6, layer: 'action', notes: 'A3:2 E4:2 D4:3 | Bb3:4 C#4:3 | D4:2 F4:2 Bb4:3 | A4:7 | F4:2 E4:2 D4:3 | Bb3:2 D4:2 G4:3 | F4:2 E4:2 D4:3 | E4:7' },
        { name: 'call', instrument: 'reed', v: 0.42, layer: 'action', cycles: 'odd', notes: 'r:7 | A4:4 E5:3 | r:7 | C#5:4 A4:3 | r:7 | G4:4 Bb4:3 | r:7 | A4:7' },
      ],
    }),
    section('B', 270, 7, 38, 'harmonicMinor', 'Dm | Gm | A | Dm | Bb | Gm | Edim | A', { ...combatBed,
      lines: [
        { name: 'lead', instrument: 'horn', v: 0.6, layer: 'action', notes: 'D4:2 A4:2 G4:3 | Bb4:4 G4:3 | A4:2 C#5:2 E5:3 | F5:4 D5:3 | D5:2 F5:2 Bb4:3 | G4:2 Bb4:2 D5:3 | E5:2 G5:2 Bb4:3 | A4:7' },
        { name: 'calm', instrument: 'ney', v: 0.34, layer: 'reflection', plain: true, notes: 'r:7 | r:7 | r:7 | r:7 | D5:7 | Bb4:7 | r:7 | r:7' },
      ],
    }),
    // no melody: ostinato and drums on action, the dulcimer on reflection
    section('C', 270, 7, 45, 'phrygianDominant', 'A | Bb | A | Gm | A | Bb | Gm | A', { ...combatBed }),
    // the bridge leaves the limp for an even four in D: the court of records, low brass over the war drum
    section('bridge', 120, 4, 38, 'phrygianDominant', 'D | Eb | Cm | D | Gm | Eb | Cm | D', {
      pad: { instrument: 'strings', lo: 50, hi: 66, v: 0.28, layer: 'reflection' },
      bass: { instrument: 'pizz', base: 38, pattern: 'half', v: 0.52 },
      drums: { bar: [[0, 'drum', 0, 0.7], [2, 'drum', 0, 0.55], [3, 'goblet', 1, 0.4], [3.5, 'goblet', 1, 0.35], [0, 'timpani', 38, 0.4]], layer: 'action' },
      lines: [
        { name: 'brass', instrument: 'brass', v: 0.6, layer: 'action', notes: 'D3:2 A3:2 | G3:2 Eb3:2 | C3:2 G3:2 | F#3:4 | G3:2 D4:2 | Eb4:2 Bb3:2 | C4:2 Eb4:2 | D4:4' },
        { name: 'horn', instrument: 'horn', v: 0.5, layer: 'action', notes: 'A3:2 D4:2 | Bb3:2 G3:2 | Eb3:2 C4:2 | A3:4 | Bb3:2 G3:2 | G3:2 Eb3:2 | Eb3:2 G3:2 | F#3:4' },
        { name: 'calm', instrument: 'dulcimer', v: 0.36, layer: 'reflection', plain: true, notes: 'D5:4 | Eb5:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4' },
      ],
    }),
    section('return', 220, 7, 45, 'phrygianDominant', 'Dm | Gm | Bb | Bb', { ramp: { fromBar: 0, bpm: 270 },
      pad: { instrument: 'strings', lo: 57, hi: 72, v: 0.18, layer: 'reflection' },
      bass: { instrument: 'strings', base: 33, pattern: 'whole', v: 0.32 },
      drums: { bar: [[0, 'goblet', 0, 0.7], [2, 'goblet', 1, 0.45], [4, 'goblet', 0, 0.6], [6, 'goblet', 1, 0.5]], fill: verdictFill, layer: 'action' },
      lines: [{ name: 'lead', instrument: 'strings', v: 0.56, notes: 'F4:2 A4:2 D5:3 | Bb4:2 D5:2 G5:3 | F5:2 D5:2 Bb4:3 | C#5:4 Bb4:3' }],
    }),
  ],
};

// ------------------------------------------------------------ boss: the register, D phrygian dominant in nine

const register: readonly Hit[] = [[0, 'goblet', 0, 0.85], [2, 'goblet', 1, 0.45], [4, 'goblet', 0, 0.6], [6, 'goblet', 0, 0.7], [7, 'goblet', 1, 0.45], [8, 'goblet', 2, 0.5], [0, 'drum', 0, 0.5], [6, 'drum', 1, 0.35]];
const registerFill: readonly Hit[] = [[0, 'goblet', 0, 0.85], [1, 'goblet', 2, 0.45], [2, 'goblet', 1, 0.5], [3, 'goblet', 2, 0.45], [4, 'goblet', 0, 0.6], [5, 'goblet', 1, 0.5], [6, 'goblet', 0, 0.7], [7, 'goblet', 1, 0.55], [8, 'goblet', 1, 0.65], [0, 'zill', 0, 0.4], [6, 'cymbal', 1, 0.5]];
const bossBed = {
  pad: { instrument: 'strings', lo: 50, hi: 69, v: 0.34 },
  bass: { instrument: 'strings', base: 38, pattern: 'whole', v: 0.4, layer: 'action' },
  arpeggio: { instrument: 'dulcimer', lo: 57, perBeat: 1, v: 0.34, layer: 'reflection', patterns: [[0, 2, 1, 3, 2, 1, 4, 3, 2]] },
  ostinato: { instrument: 'strings', lo: 50, perBeat: 1, v: 0.5, length: 0.32, layer: 'action', patterns: [[0, 1, 0, 1, 0, 2, 0, 1, 2], [0, 2, 0, 1, 0, 2, 1, 0, 3]] },
  drums: { bar: register, fill: registerFill, layer: 'action' },
} as const;

const boss: ThemeDef = {
  id: 'boss', track: 'scorpion/boss', hall: 'dune', send: 0.2, gain: 1.16, lowCut: 96,
  form: [0, 1, 2, 3, 4, 5, 6], loopFrom: 1,
  sections: [
    // the entry (the Phoenix's flame-keepers in their temple): low brass on the motif over a timpani roll
    section('entry', 84, 4, 38, 'phrygianDominant', 'D | Eb D', {
      pad: { instrument: 'strings', lo: 50, hi: 69, v: 0.36 },
      drums: { bar: [[0, 'timpani', 38, 0.7], [1, 'timpani', 38, 0.5], [2, 'timpani', 38, 0.6], [3, 'timpani', 38, 0.7], [3.5, 'timpani', 38, 0.8], [2, 'cymbal', 1, 0.6]] },
      lines: [{ name: 'lead', instrument: 'brass', v: 0.74, notes: 'D3:2 A3:2 | G3:2 Eb3:2' }],
    }),
    section('A', 330, 9, 38, 'phrygianDominant', 'D | Eb | D | Cm | D | Gm | Eb | D', { ...bossBed,
      lines: [
        { name: 'lead', instrument: 'brass', v: 0.72, layer: 'action', notes: 'D4:2 A4:2 G4:2 Eb4:3 | Eb4:4 D4:2 C4:3 | F#4:2 G4:2 A4:2 F#4:3 | G4:4 Eb4:2 C4:3 | D4:2 F#4:2 A4:2 C5:3 | Bb4:4 A4:2 G4:3 | G4:2 F#4:2 Eb4:2 D4:3 | D4:9' },
        { name: 'calm', instrument: 'reed', v: 0.4, layer: 'reflection', plain: true, notes: 'D5:9 | Eb5:9 | r:9 | r:9 | r:9 | r:9 | r:9 | r:9' },
      ],
    }),
    section('A2', 330, 9, 38, 'phrygianDominant', 'D | Eb | D | Cm | D | Gm | Eb | D', { ...bossBed,
      lines: [
        { name: 'lead', instrument: 'strings', v: 0.6, layer: 'action', notes: 'D5:2 A5:2 G5:2 Eb5:3 | Eb5:4 D5:2 C5:3 | F#5:2 G5:2 A5:2 F#5:3 | G5:4 Eb5:2 C5:3 | D5:2 F#5:2 A5:2 C6:3 | Bb5:4 A5:2 G5:3 | G5:2 F#5:2 Eb5:2 D5:3 | D5:9' },
        { name: 'call', instrument: 'horn', v: 0.56, layer: 'action', notes: 'r:9 | D4:4 A4:5 | r:9 | C4:4 G4:5 | r:9 | G3:4 D4:5 | r:9 | D4:9' },
      ],
    }),
    section('B', 330, 9, 43, 'harmonicMinor', 'Gm | Cm | D | Gm | Eb | Cm | Adim | D', { ...bossBed,
      lines: [{ name: 'lead', instrument: 'horn', v: 0.64, layer: 'action', notes: 'G4:2 D5:2 C5:2 A4:3 | Eb5:4 C5:2 G4:3 | F#4:2 A4:2 D5:2 C5:3 | Bb4:4 G4:2 D4:3 | Eb4:2 G4:2 Bb4:2 Eb5:3 | C5:4 G4:2 Eb4:3 | A4:2 C5:2 Eb5:2 C5:3 | D5:9' }],
    }),
    // no melody: the drive alone
    section('C', 330, 9, 38, 'phrygianDominant', 'D | Eb | D | Cm | D | Eb | Gm | D', { ...bossBed, pad: { instrument: 'strings', lo: 53, hi: 72, v: 0.3, layer: 'reflection' } }),
    // the bridge brings back the Scorpion's own seven in A: the double reed sings the motif over the goblet drum
    section('bridge', 280, 7, 45, 'phrygianDominant', 'A | Bb | A | Gm | A | Dm | Bb | A', {
      pad: { instrument: 'strings', lo: 45, hi: 64, v: 0.3 },
      bass: { instrument: 'strings', base: 33, pattern: 'whole', v: 0.38 },
      drums: { bar: verdict, fill: verdictFill, layer: 'action' },
      lines: [{ name: 'lead', instrument: 'reed', v: 0.56, notes: 'A4:2 E5:2 D5:3 | Bb4:4 C#5:3 | E5:2 D5:2 C#5:3 | Bb4:4 A4:3 | C#5:2 E5:2 F5:3 | E5:2 D5:2 F5:3 | D5:2 C#5:2 Bb4:3 | A4:7' }],
    }),
    section('return', 280, 9, 38, 'phrygianDominant', 'Eb | Eb D | Eb | A', { ramp: { fromBar: 0, bpm: 330 },
      pad: { instrument: 'strings', lo: 50, hi: 69, v: 0.34 },
      bass: { instrument: 'strings', base: 38, pattern: 'whole', v: 0.4 },
      drums: { bar: [[0, 'goblet', 0, 0.75], [4, 'goblet', 0, 0.6], [6, 'goblet', 1, 0.5], [8, 'goblet', 1, 0.6]], fill: registerFill, layer: 'action' },
      lines: [{ name: 'lead', instrument: 'brass', v: 0.7, notes: 'Eb4:4 Bb4:5 | Eb4:4 D4:5 | G4:2 Bb4:2 Eb5:2 D5:3 | C#5:4 A4:5' }],
    }),
  ],
};

/** The Grand Inquisitor's own entry in the court of records: copper cymbals, a dulcimer tremolo, the brass on the motif. */
const inquisitor = withEntry(boss, 'scorpion/boss@inquisitor', section('entry', 84, 4, 38, 'phrygianDominant', 'D | Eb D', {
  pad: { instrument: 'strings', lo: 50, hi: 69, v: 0.36 },
  drums: { bar: [[0, 'zill', 0, 0.45], [0, 'timpani', 38, 0.7], [1, 'timpani', 38, 0.5], [2, 'timpani', 38, 0.6], [3, 'timpani', 38, 0.7], [3.5, 'timpani', 38, 0.8], [2, 'zill', 0, 0.4]] },
  lines: [
    { name: 'lead', instrument: 'brass', v: 0.74, notes: 'D3:2 A3:2 | G3:2 Eb3:2' },
    { name: 'tremolo', instrument: 'dulcimer', v: 0.4, plain: true, notes: 'D5:0.5 D5:0.5 D5:0.5 D5:0.5 A5:0.5 A5:0.5 A5:0.5 A5:0.5 | G5:0.5 G5:0.5 G5:0.5 G5:0.5 Eb5:0.5 Eb5:0.5 Eb5:0.5 Eb5:0.5' },
  ],
}));

/** The Shadow prophet's own entry on the crest of the dunes: the Shadows' choir under the reed flute, copper and skin. */
const prophet = withEntry(boss, 'scorpion/boss@prophet', section('entry', 84, 4, 38, 'phrygianDominant', 'D | Eb', {
  pad: { instrument: 'choir', lo: 50, hi: 69, v: 0.44 },
  drums: { bar: [[0, 'zill', 0, 0.4], [2, 'zill', 0, 0.3], [3, 'goblet', 0, 0.6]] },
  lines: [{ name: 'lead', instrument: 'ney', v: 0.56, notes: 'D5:2 A5:2 | G5:2 Eb5:2' }],
}));

export const SCORPION_MUSIC: PartMusic = {
  tracks: { map, refuge, tension, drama, combat, boss },
  scenes: { scorpion_records_court: { boss: inquisitor }, scorpion_dune_crest: { boss: prophet } },
};

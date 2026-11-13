/**
 * The final act: the capital of the clans (sketch, PLATEAU_MUSIC_DRAFT_2026-11-13). The only city of the game, in two
 * faces. The Tournament is ceremonial: E-flat mixolydian, a march with snare and war drum, brass fanfares, and in its B
 * section the clans' banners, two bars each: the Bear's low choir in fifths, the Dragon's flute on the raised fourth,
 * the Scorpion's reed flute on the augmented second, the Lion's horns. After the betrayal the breach is cold ink: the
 * octatonic scale on C, a glass harmonica, the Shadows' choir, a vast dark room. The Seals motif is corrupted there
 * (1-#4-3-b2 in the half-whole scale), and the entity sings it backwards. The city's bells toll in F minor on the map.
 */
import type { Hit, ThemeDef } from '../themes';
import { section, withEntry, type PartMusic } from './score';

// ------------------------------------------------------------ map: the city under the veil, F minor and a bell

const procession: readonly Hit[] = [[0, 'drum', 1, 0.28], [2, 'drum', 1, 0.2]];
const city = {
  pad: { instrument: 'strings', lo: 53, hi: 70, v: 0.24 },
  bass: { instrument: 'strings', base: 41, pattern: 'whole', v: 0.4 },
  arpeggio: { instrument: 'pizz', lo: 53, perBeat: 1, v: 0.3, patterns: [[0, 2, 1, 2], [0, 1, 2, 3]] },
  drums: { bar: procession, fill: [[0, 'bell', 53, 0.34], [2, 'drum', 1, 0.22]] as readonly Hit[] },
} as const;

const map: ThemeDef = {
  id: 'map', track: 'finale/map', hall: 'city', send: 0.3, gain: 1.58,
  form: [0, 1, 2, 3, 4],
  sections: [
    section('A', 80, 4, 41, 'aeolian', 'Fm | Db | Bbm | C | Fm | Ab | Bbm | C', { ...city,
      lines: [{ name: 'lead', instrument: 'horn', v: 0.54, notes: 'F4:2 C5:2 | Bb4:1.5 G4:0.5 Ab4:2 | Bb4:1 Db5:1 F5:2 | E4:4 | F4:1 Ab4:1 C5:2 | Eb5:1.5 Db5:0.5 C5:2 | Db5:1 C5:1 Bb4:1 Ab4:1 | G4:4' }],
    }),
    section('A2', 80, 4, 41, 'aeolian', 'Fm | Db | Bbm | C | Fm | Ab | Bbm | Fm', { ...city,
      lines: [
        { name: 'lead', instrument: 'strings', v: 0.5, notes: 'C5:2 F5:2 | Eb5:1.5 Db5:0.5 C5:2 | Db5:1 F5:1 Bb5:2 | G5:4 | Ab5:1 G5:1 F5:2 | Eb5:1.5 F5:0.5 Ab5:2 | G5:1 F5:1 E5:1 G5:1 | F5:4' },
        { name: 'answer', instrument: 'brass', v: 0.36, cycles: 'odd', notes: 'r:4 | F3:4 | r:4 | C4:4 | r:4 | Ab3:4 | r:4 | C3:4' },
      ],
    }),
    // no melody: the procession and the strings
    section('B', 80, 4, 41, 'aeolian', 'Db | Ab | Bbm | Fm | Db | Eb | Bbm | C', { ...city, pad: { instrument: 'strings', lo: 53, hi: 72, v: 0.28 } }),
    // the bridge remembers the Tournament's day: A-flat in three, brass and bells in the wind
    section('bridge', 108, 3, 44, 'ionian', 'Ab | Eb | Fm | Db | Ab | Eb | Db | Eb', {
      pad: { instrument: 'strings', lo: 56, hi: 72, v: 0.24 },
      bass: { instrument: 'pizz', base: 44, pattern: 'whole', v: 0.5 },
      drums: { bar: [], fill: [[1, 'cymbal', 1, 0.3]] },
      lines: [
        { name: 'brass', instrument: 'brass', v: 0.5, notes: 'Eb4:2 Ab4:1 | G4:2 Eb4:1 | F4:1 Ab4:1 C5:1 | Db5:3 | C5:2 Ab4:1 | Bb4:2 G4:1 | Ab4:1 F4:1 Db4:1 | Eb4:3' },
        { name: 'bells', instrument: 'bell', v: 0.34, notes: 'Ab4:3 | r:3 | C5:3 | r:3 | Eb5:3 | r:3 | Db5:3 | r:3' },
      ],
    }),
    section('return', 80, 4, 41, 'aeolian', 'Bbm | Db | C', { ramp: { fromBar: 1, bpm: 70 }, ...city,
      lines: [{ name: 'lead', instrument: 'horn', v: 0.5, notes: 'Db5:2 Bb4:2 | Ab4:2 F4:2 | E4:4' }],
    }),
  ],
};

// ------------------------------------------------------------ refuge: the last vigil, A-flat in three

const vigil = {
  pad: { instrument: 'strings', lo: 53, hi: 68, v: 0.22 },
  bass: { instrument: 'strings', base: 44, pattern: 'whole', v: 0.38 },
  arpeggio: { instrument: 'pizz', lo: 56, perBeat: 1, v: 0.26, patterns: [[0, 1, 2], [0, 2, 1]] },
} as const;

const refuge: ThemeDef = {
  id: 'refuge', track: 'finale/refuge', hall: 'city', send: 0.32, gain: 1.27,
  form: [0, 1, 2, 3],
  sections: [
    section('A', 60, 3, 44, 'ionian', 'Ab | Fm | Db | Eb | Cm | Fm | Bbm | Eb', { ...vigil,
      lines: [{ name: 'lead', instrument: 'horn', v: 0.42, plain: true, notes: 'Eb4:2 Ab4:1 | C5:2 Ab4:1 | Db5:1 C5:1 Ab4:1 | G4:3 | Eb4:1 G4:1 C5:1 | Ab4:2 F4:1 | F4:1 Ab4:1 Db5:1 | Bb4:3' }],
    }),
    // strings on the motif; the glass already rings outside
    section('B', 60, 3, 44, 'ionian', 'Ab | Bbm | Db | Eb | Db | Ab | Bbm7 | Eb7', { ...vigil,
      lines: [
        { name: 'lead', instrument: 'strings', v: 0.4, plain: true, notes: 'Ab4:2 Eb5:1 | Db5:2 Bb4:1 | Db5:1 F5:1 Db5:1 | Eb5:3 | F5:2 Db5:1 | C5:2 Ab4:1 | Db5:1 C5:1 Bb4:1 | G4:3' },
        { name: 'glass', instrument: 'glass', v: 0.3, notes: 'r:3 | r:3 | r:3 | Bb5:3 | r:3 | r:3 | r:3 | G5:3' },
      ],
    }),
    // the bridge: the city burns outside, C minor in four, the glass alone
    section('bridge', 54, 4, 36, 'aeolian', 'Cm | Ab | Fm | G | Cm | Ab | Db | Eb', {
      pad: { instrument: 'strings', lo: 52, hi: 70, v: 0.24 },
      bass: { instrument: 'strings', base: 36, pattern: 'whole', v: 0.38 },
      lines: [{ name: 'lead', instrument: 'glass', v: 0.36, notes: 'G5:2 Eb5:2 | C5:4 | Ab5:2 F5:2 | D5:4 | G5:2 C6:2 | Ab5:4 | F5:2 Db5:2 | Eb5:4' }],
    }),
    section('return', 60, 3, 44, 'ionian', 'Bbm7 | Eb7sus4 | Eb7', { ramp: { fromBar: 1, bpm: 52 }, ...vigil,
      lines: [{ name: 'lead', instrument: 'horn', v: 0.4, plain: true, notes: 'Db4:1 F4:1 Ab4:1 | Ab4:2 Eb4:1 | G3:3' }],
    }),
  ],
};

// ------------------------------------------------------------ tension: the betrayal, the half-whole scale on C

const alarm: readonly Hit[] = [[0, 'timpani', 36, 0.4], [1.5, 'drum', 1, 0.25], [2, 'timpani', 36, 0.32], [3.5, 'drum', 1, 0.25]];

const tension: ThemeDef = {
  id: 'tension', track: 'finale/tension', hall: 'city', send: 0.3, gain: 1.35, lowCut: 70,
  form: [0, 1, 2, 3],
  sections: [
    section('A', 88, 4, 36, 'octatonic', 'Cm | F#m | Cm | Ebm | Am | Cm | F#m | Cdim7', {
      pad: { instrument: 'strings', lo: 52, hi: 67, v: 0.26 },
      bass: { instrument: 'pizz', base: 36, pattern: 'pulse', v: 0.42 },
      drums: { bar: alarm },
      lines: [{ name: 'lead', instrument: 'horn', v: 0.44, notes: 'C4:1 F#4:1 E4:1 Db4:1 | F#4:2 A4:2 | Eb4:2 C4:2 | r:4 | E4:2 A4:2 | G4:1 Eb4:1 C4:2 | Db4:2 F#4:2 | A3:4' }],
    }),
    // no melody: the alarm and the strings
    section('B', 88, 4, 36, 'octatonic', 'Cm | Ebm | F#m | Am | Cm | Ebm | Am | Cdim7', {
      pad: { instrument: 'strings', lo: 52, hi: 69, v: 0.3 },
      bass: { instrument: 'pizz', base: 36, pattern: 'pulse', v: 0.42 },
      drums: { bar: alarm },
    }),
    // the bridge moves to the scale on D, in five: the double reed whispers
    section('bridge', 100, 5, 38, 'octatonic', 'Dm | Fm | Bm | G#m | Dm | F | B | D', {
      pad: { instrument: 'strings', lo: 53, hi: 69, v: 0.28 },
      bass: { instrument: 'pizz', base: 38, pattern: 'pulse', v: 0.42 },
      drums: { bar: [[0, 'timpani', 38, 0.4], [3, 'timpani', 38, 0.3]] },
      lines: [{ name: 'lead', instrument: 'reed', v: 0.42, notes: 'D5:2 G#5:1 F#5:1 Eb5:1 | F5:3 C5:2 | B4:2 D5:3 | Eb5:5 | A4:2 D5:2 F5:1 | C5:3 A4:2 | B4:1 D#5:1 F#5:3 | D5:5' }],
    }),
    section('return', 88, 4, 36, 'octatonic', 'Ebm | F# | Cdim7 | G', {
      pad: { instrument: 'strings', lo: 52, hi: 69, v: 0.3 },
      bass: { instrument: 'pizz', base: 36, pattern: 'pulse', v: 0.42 },
      drums: { bar: alarm },
      lines: [{ name: 'lead', instrument: 'horn', v: 0.42, notes: 'Bb3:2 F#4:2 | A#3:4 | A3:2 Eb4:2 | D4:4' }],
    }),
  ],
};

// ------------------------------------------------------------ drama: a dawn of ash, F minor and the city's bells

const drama: ThemeDef = {
  id: 'drama', track: 'finale/drama', hall: 'city', send: 0.42, gain: 1.31,
  form: [0, 1, 2, 3],
  sections: [
    section('A', 56, 4, 41, 'aeolian', 'Fm | Db | Bbm | r | Fm | Ab | Bbm | C', {
      pad: { instrument: 'strings', lo: 53, hi: 72, v: 0.32 },
      bass: { instrument: 'strings', base: 41, pattern: 'whole', v: 0.4 },
      drums: { bar: [], fill: [[0, 'bell', 53, 0.3]] },
      lines: [{ name: 'lead', instrument: 'horn', v: 0.46, notes: 'F3:2 C4:2 | Bb3:2 G3:2 | Ab3:2 F3:2 | r:4 | C4:1 F4:1 Ab4:2 | Eb4:2 C4:2 | Db4:1 F4:1 Ab4:2 | E4:2 G4:2' }],
    }),
    // no melody: strings answered by silence
    section('B', 56, 4, 41, 'aeolian', 'Db | r | Bbm | r | Ab | r | C | r', {
      pad: { instrument: 'strings', lo: 53, hi: 72, v: 0.3 },
      bass: { instrument: 'strings', base: 41, pattern: 'whole', v: 0.38 },
    }),
    // the bridge is the dawn: D-flat in three, the bells over the strings
    section('bridge', 66, 3, 37, 'ionian', 'Db | Ab | Bbm | Gb | Db | Ab | Gb | C', {
      pad: { instrument: 'strings', lo: 53, hi: 72, v: 0.28 },
      bass: { instrument: 'strings', base: 37, pattern: 'whole', v: 0.42 },
      lines: [
        { name: 'lead', instrument: 'strings', v: 0.5, notes: 'F5:2 Ab5:1 | Eb5:3 | Db5:2 F5:1 | Bb4:3 | Ab4:1 Db5:1 F5:1 | Eb5:2 C5:1 | Bb4:1 Db5:1 Gb5:1 | E5:3' },
        { name: 'bells', instrument: 'bell', v: 0.32, notes: 'Db5:3 | r:3 | Bb4:3 | r:3 | F5:3 | r:3 | Gb5:3 | C5:3' },
      ],
    }),
    section('return', 56, 4, 41, 'aeolian', 'Bbm | Db | C', { ramp: { fromBar: 1, bpm: 48 },
      pad: { instrument: 'strings', lo: 53, hi: 72, v: 0.32 },
      bass: { instrument: 'strings', base: 41, pattern: 'whole', v: 0.4 },
      lines: [{ name: 'lead', instrument: 'horn', v: 0.44, notes: 'Db4:2 F4:2 | Ab4:2 Db4:2 | E4:4' }],
    }),
  ],
};

// ------------------------------------------------------------ combat: the burning streets, the half-whole scale in two levels

const streets: readonly Hit[] = [[0, 'drum', 0, 0.8], [0.75, 'drum', 1, 0.35], [1.5, 'drum', 0, 0.55], [2, 'timpani', 36, 0.45], [3, 'drum', 1, 0.45], [3.5, 'drum', 1, 0.5]];
const streetsFill: readonly Hit[] = [[0, 'drum', 0, 0.8], [1, 'drum', 1, 0.4], [1.5, 'drum', 0, 0.55], [2, 'drum', 1, 0.45], [2.5, 'drum', 1, 0.5], [3, 'drum', 1, 0.55], [3.5, 'drum', 1, 0.65], [2, 'cymbal', 1, 0.45]];
const combatBed = {
  pad: { instrument: 'glass', lo: 60, hi: 76, v: 0.2, layer: 'reflection' },
  bass: { instrument: 'pizz', base: 36, pattern: 'rootFifth', v: 0.5 },
  arpeggio: { instrument: 'pizz', lo: 55, perBeat: 1, v: 0.26, layer: 'reflection', patterns: [[0, 1, 0, 2]] },
  ostinato: { instrument: 'strings', lo: 55, perBeat: 2, v: 0.52, length: 0.3, layer: 'action', patterns: [[0, 1, 0, 2, 0, 1, 0, 3], [0, 2, 1, 0, 2, 1, 0, 3]] },
  drums: { bar: streets, fill: streetsFill, layer: 'action' },
} as const;

const combat: ThemeDef = {
  id: 'combat', track: 'finale/combat', hall: 'city', send: 0.2, gain: 1.45, lowCut: 118,
  form: [0, 1, 2, 3, 4, 5],
  sections: [
    section('A', 132, 4, 36, 'octatonic', 'Cm | F#m | Cm | Ebm | Am | F# | Cm | Cdim7', { ...combatBed,
      lines: [
        { name: 'lead', instrument: 'brass', v: 0.66, layer: 'action', notes: 'C4:1 F#4:1 E4:1 Db4:1 | C#4:2 F#4:2 | G4:1.5 Eb4:0.5 C4:2 | Bb3:2 Eb4:2 | A3:1 C4:1 E4:2 | F#4:1.5 E4:0.5 C#4:2 | Eb4:1 G4:1 C5:2 | A4:4' },
        { name: 'calm', instrument: 'glass', v: 0.36, layer: 'reflection', plain: true, notes: 'C5:2 F#5:2 | E5:2 Db5:2 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4' },
      ],
    }),
    section('A2', 132, 4, 36, 'octatonic', 'Cm | F#m | Cm | Ebm | Am | F# | Cm | Cdim7', { ...combatBed,
      lines: [
        { name: 'lead', instrument: 'strings', v: 0.6, layer: 'action', notes: 'C5:1 F#5:1 E5:1 Db5:1 | C#5:2 A5:2 | G5:1.5 Eb5:0.5 C5:2 | Bb4:2 Gb5:2 | A4:1 C5:1 E5:2 | F#5:1.5 A#5:0.5 C#6:2 | Eb5:1 G5:1 C6:2 | A5:4' },
        { name: 'call', instrument: 'choir', v: 0.5, layer: 'action', cycles: 'odd', notes: 'r:4 | F#3:4 | r:4 | Eb3:4 | r:4 | F#3:4 | r:4 | A3:4' },
      ],
    }),
    section('B', 132, 4, 39, 'octatonic', 'Ebm | Am | Ebm | F#m | Cm | A | Ebm | Cdim7', { ...combatBed,
      lines: [{ name: 'lead', instrument: 'horn', v: 0.6, layer: 'action', notes: 'Eb4:1 A4:1 G4:1 E4:1 | E4:2 A4:2 | Bb4:1.5 Gb4:0.5 Eb4:2 | C#4:2 F#4:2 | C4:1 Eb4:1 G4:2 | A4:1.5 G4:0.5 E4:2 | Gb4:1 Bb4:1 Eb5:2 | C5:4' }],
    }),
    // no melody: ostinato and drums on action, the glass on reflection
    section('C', 132, 4, 36, 'octatonic', 'Cm | Ebm | F#m | Am | Cm | Ebm | Am | Cdim7', { ...combatBed }),
    // the bridge turns to three on the scale of D: the Shadows' choir over the drums
    section('bridge', 108, 3, 38, 'octatonic', 'Dm | Fm | G#m | Bm | Dm | F | G# | B', {
      pad: { instrument: 'strings', lo: 56, hi: 72, v: 0.28, layer: 'reflection' },
      bass: { instrument: 'pizz', base: 38, pattern: 'whole', v: 0.52 },
      drums: { bar: [[0, 'drum', 0, 0.7], [1, 'drum', 1, 0.4], [2, 'timpani', 38, 0.4]], layer: 'action' },
      lines: [
        { name: 'choir', instrument: 'choir', v: 0.58, layer: 'action', notes: 'D4:2 G#4:1 | F4:3 | Eb4:2 B3:1 | D4:3 | A4:2 F4:1 | C5:2 A4:1 | G#4:1 C5:1 Eb5:1 | D#5:3' },
        { name: 'calm', instrument: 'glass', v: 0.34, layer: 'reflection', plain: true, notes: 'D5:3 | F5:3 | r:3 | r:3 | r:3 | r:3 | r:3 | r:3' },
      ],
    }),
    section('return', 108, 4, 36, 'octatonic', 'Ebm | F# | Cdim7 | G', { ramp: { fromBar: 0, bpm: 132 },
      pad: { instrument: 'glass', lo: 60, hi: 76, v: 0.2, layer: 'reflection' },
      bass: { instrument: 'pizz', base: 36, pattern: 'half', v: 0.52 },
      drums: { bar: [[0, 'drum', 0, 0.6], [2, 'drum', 1, 0.44], [3, 'drum', 1, 0.34], [3.5, 'drum', 1, 0.44]], fill: streetsFill, layer: 'action' },
      lines: [{ name: 'lead', instrument: 'brass', v: 0.56, notes: 'Bb3:2 F#4:2 | A#3:2 C#4:2 | A3:2 Eb4:2 | D4:2 B3:2' }],
    }),
  ],
};

// ------------------------------------------------------------ the Tournament's combat: the Arena of Destinies, E-flat mixolydian

const march: readonly Hit[] = [[0, 'drum', 0, 0.75], [1, 'kit', 1, 0.35], [2, 'drum', 0, 0.6], [3, 'kit', 1, 0.4], [3.5, 'kit', 1, 0.3]];
const marchFill: readonly Hit[] = [[0, 'drum', 0, 0.75], [1, 'kit', 1, 0.4], [2, 'kit', 1, 0.45], [2.5, 'kit', 1, 0.4], [3, 'kit', 1, 0.5], [3.25, 'kit', 1, 0.45], [3.5, 'kit', 1, 0.55], [3.75, 'kit', 1, 0.65], [0, 'cymbal', 0, 0.4]];
const arenaBed = {
  pad: { instrument: 'strings', lo: 55, hi: 74, v: 0.3, layer: 'reflection' },
  bass: { instrument: 'pizz', base: 39, pattern: 'rootFifth', v: 0.5 },
  arpeggio: { instrument: 'pizz', lo: 55, perBeat: 1, v: 0.34, layer: 'reflection', patterns: [[0, 2, 1, 2]] },
  ostinato: { instrument: 'strings', lo: 55, perBeat: 2, v: 0.52, length: 0.32, layer: 'action', patterns: [[0, 0, 2, 0, 1, 0, 2, 1], [0, 2, 1, 2, 0, 2, 1, 3]] },
  drums: { bar: march, fill: marchFill, layer: 'action' },
} as const;

const arena: ThemeDef = {
  id: 'combat', track: 'finale/combat@tournament', hall: 'city', send: 0.2, gain: 1.45, lowCut: 118,
  form: [0, 1, 2, 3, 4, 5],
  sections: [
    section('A', 120, 4, 39, 'mixolydian', 'Eb | Db | Ab | Eb | Cm | Ab | Bb | Bb', { ...arenaBed,
      lines: [
        { name: 'lead', instrument: 'brass', v: 0.68, layer: 'action', notes: 'Eb4:1 Bb4:1 Ab4:1 F4:1 | Db4:2 F4:1 Ab4:1 | C5:1.5 Bb4:0.5 Ab4:2 | G4:2 Eb4:2 | G4:1 C5:1 Eb5:2 | C5:1.5 Ab4:0.5 Eb4:2 | F4:1 Bb4:1 D5:2 | Bb4:4' },
        { name: 'calm', instrument: 'horn', v: 0.36, layer: 'reflection', plain: true, notes: 'Eb4:4 | Bb3:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4' },
      ],
    }),
    section('A2', 120, 4, 39, 'mixolydian', 'Eb | Db | Ab | Eb | Cm | Ab | Bb | Bb', { ...arenaBed,
      lines: [
        { name: 'lead', instrument: 'strings', v: 0.6, layer: 'action', notes: 'Bb4:1 Eb5:1 G5:2 | F5:1.5 Db5:0.5 Ab4:2 | Ab4:1 C5:1 Eb5:2 | Bb4:4 | C5:1 Eb5:1 G5:2 | Ab5:1.5 G5:0.5 Eb5:2 | D5:1 F5:1 Bb5:2 | F5:4' },
        { name: 'call', instrument: 'brass', v: 0.5, layer: 'action', cycles: 'odd', notes: 'r:4 | Db3:2 Ab3:2 | r:4 | Eb3:2 Bb3:2 | r:4 | Ab3:2 Eb4:2 | r:4 | Bb3:4' },
      ],
    }),
    // the clans' banners, two bars each: the Bear, the Dragon, the Scorpion, the Lion
    section('B', 120, 4, 39, 'mixolydian', 'Eb5 | Ab5 | Eb | F | Eb | E | Ab | Bb', { ...arenaBed,
      lines: [
        { name: 'bear', instrument: 'lowChoir', v: 0.6, layer: 'action', notes: 'Eb3:2 Bb3:2 | Ab3:2 F3:2 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4' },
        { name: 'dragon', instrument: 'flute', v: 0.5, layer: 'action', notes: 'r:4 | r:4 | Eb5:1 Bb5:2 A5:1 | F5:2 C6:2 | r:4 | r:4 | r:4 | r:4' },
        { name: 'dragon-bells', instrument: 'bell', v: 0.3, layer: 'action', notes: 'r:4 | r:4 | Eb6:4 | A5:4 | r:4 | r:4 | r:4 | r:4' },
        { name: 'scorpion', instrument: 'ney', v: 0.5, layer: 'action', notes: 'r:4 | r:4 | r:4 | r:4 | Eb5:1 Bb5:1 Ab5:1 E5:1 | G#5:2 E5:2 | r:4 | r:4' },
        { name: 'lion', instrument: 'horn', v: 0.56, layer: 'action', notes: 'r:4 | r:4 | r:4 | r:4 | r:4 | r:4 | Ab3:2 Eb4:2 | Bb3:2 F4:2' },
        { name: 'calm', instrument: 'horn', v: 0.32, layer: 'reflection', plain: true, notes: 'Eb4:4 | r:4 | r:4 | r:4 | r:4 | r:4 | Ab3:4 | Bb3:4' },
      ],
    }),
    // no melody: the march alone
    section('C', 120, 4, 39, 'mixolydian', 'Eb | Db | Eb | Bb | Eb | Db | Ab | Bb', { ...arenaBed }),
    // the bridge turns to three in C minor: the contest hardens
    section('bridge', 132, 3, 36, 'aeolian', 'Cm | Ab | Bb | Eb | Cm | Ab | Fm | G', {
      pad: { instrument: 'strings', lo: 55, hi: 72, v: 0.28, layer: 'reflection' },
      bass: { instrument: 'pizz', base: 36, pattern: 'whole', v: 0.52 },
      drums: { bar: [[0, 'drum', 0, 0.7], [1, 'kit', 1, 0.35], [2, 'kit', 1, 0.4]], layer: 'action' },
      lines: [
        { name: 'brass', instrument: 'brass', v: 0.6, layer: 'action', notes: 'C4:2 G4:1 | Ab4:2 Eb4:1 | F4:2 D4:1 | G4:3 | C5:2 G4:1 | Ab4:2 C5:1 | F4:1 Ab4:1 C5:1 | B4:3' },
        { name: 'horn', instrument: 'horn', v: 0.48, layer: 'action', notes: 'Eb3:3 | C3:3 | D3:3 | Bb2:3 | Eb3:3 | C3:3 | Ab2:3 | G2:3' },
        { name: 'calm', instrument: 'horn', v: 0.32, layer: 'reflection', plain: true, notes: 'C4:3 | Eb4:3 | r:3 | r:3 | r:3 | r:3 | r:3 | r:3' },
      ],
    }),
    section('return', 100, 4, 39, 'mixolydian', 'Ab | Bb | Ab | Bb', { ramp: { fromBar: 0, bpm: 120 },
      pad: { instrument: 'strings', lo: 55, hi: 74, v: 0.28, layer: 'reflection' },
      bass: { instrument: 'pizz', base: 39, pattern: 'half', v: 0.52 },
      drums: { bar: [[0, 'drum', 0, 0.6], [2, 'drum', 0, 0.5], [3, 'kit', 1, 0.4], [3.5, 'kit', 1, 0.45]], fill: marchFill, layer: 'action' },
      lines: [{ name: 'lead', instrument: 'brass', v: 0.6, notes: 'C4:2 Eb4:2 | D4:2 F4:2 | Eb4:1 F4:1 Ab4:2 | Bb4:4' }],
    }),
  ],
};

// ------------------------------------------------------------ the Tournament's final: C minor at full drive, the Serpent's semitone in the bridge

const final: readonly Hit[] = [[0, 'drum', 0, 0.85], [0.5, 'kit', 2, 0.3], [1, 'kit', 1, 0.56], [1.5, 'drum', 0, 0.5], [2, 'drum', 0, 0.74], [2.5, 'kit', 2, 0.3], [3, 'kit', 1, 0.6], [3.5, 'kit', 2, 0.34]];
const finalFill: readonly Hit[] = [[0, 'drum', 0, 0.85], [1, 'kit', 1, 0.5], [2, 'kit', 1, 0.56], [2.5, 'kit', 1, 0.44], [3, 'kit', 1, 0.6], [3.25, 'kit', 1, 0.5], [3.5, 'kit', 1, 0.64], [3.75, 'kit', 1, 0.74], [2, 'cymbal', 1, 0.6]];
const finalBed = {
  pad: { instrument: 'strings', lo: 55, hi: 72, v: 0.34 },
  bass: { instrument: 'pizz', base: 36, pattern: 'pulse', v: 0.54, layer: 'action' },
  arpeggio: { instrument: 'pizz', lo: 55, perBeat: 1, v: 0.38, layer: 'reflection', patterns: [[0, 1, 0, 2]] },
  ostinato: { instrument: 'strings', lo: 55, perBeat: 2, v: 0.5, length: 0.3, layer: 'action', patterns: [[0, 0, 1, 0, 0, 0, 2, 1], [0, 1, 0, 0, 2, 0, 1, 0]] },
  drums: { bar: final, fill: finalFill, layer: 'action' },
} as const;

const arenaFinal: ThemeDef = {
  id: 'boss', track: 'finale/boss@tournament', hall: 'city', send: 0.2, gain: 1.08, lowCut: 96,
  form: [0, 1, 2, 3, 4, 5, 6], loopFrom: 1,
  sections: [
    // the entry: a snare roll and a crash, the brass naming the motif
    section('entry', 92, 4, 36, 'aeolian', 'Cm | Ab G', {
      pad: { instrument: 'strings', lo: 55, hi: 72, v: 0.36 },
      drums: { bar: [[0, 'cymbal', 0, 0.5], [0, 'kit', 1, 0.4], [0.5, 'kit', 1, 0.42], [1, 'kit', 1, 0.44], [1.5, 'kit', 1, 0.46], [2, 'kit', 1, 0.5], [2.5, 'kit', 1, 0.55], [3, 'kit', 1, 0.6], [3.5, 'kit', 1, 0.66]] },
      lines: [{ name: 'lead', instrument: 'brass', v: 0.74, notes: 'C3:2 G3:2 | F3:2 D3:2' }],
    }),
    section('A', 144, 4, 36, 'aeolian', 'Cm | Ab | Bb | Cm | Eb | Bb | Ab | G', { ...finalBed,
      lines: [
        { name: 'lead', instrument: 'brass', v: 0.74, layer: 'action', notes: 'C4:1.5 G4:1.5 F4:1 | D4:2 Eb4:2 | F4:1 Bb4:1 D5:2 | C5:1.5 Bb4:0.5 G4:2 | G4:1 Bb4:1 Eb5:2 | D5:1.5 C5:0.5 Bb4:2 | Ab4:1 C5:1 Eb5:2 | D5:2 B4:2' },
        { name: 'calm', instrument: 'horn', v: 0.44, layer: 'reflection', plain: true, notes: 'C4:2 G4:2 | F4:2 D4:2 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4' },
      ],
    }),
    section('A2', 144, 4, 36, 'aeolian', 'Cm | Ab | Bb | Cm | Eb | Bb | Ab | G', { ...finalBed,
      lines: [
        { name: 'lead', instrument: 'strings', v: 0.6, layer: 'action', notes: 'C5:1.5 G5:1.5 F5:1 | D5:2 Eb5:2 | F5:1 Bb5:1 D6:2 | C6:1.5 Bb5:0.5 G5:2 | G5:1 Bb5:1 Eb6:2 | D6:1.5 C6:0.5 Bb5:2 | Ab5:1 C6:1 Eb6:2 | D6:2 B5:2' },
        { name: 'call', instrument: 'horn', v: 0.58, layer: 'action', notes: 'r:4 | C4:2 G4:2 | r:4 | Bb3:2 F4:2 | r:4 | Eb4:2 Bb4:2 | r:4 | G3:4' },
      ],
    }),
    section('B', 144, 4, 39, 'ionian', 'Eb | Bb | Cm | Ab | Eb | Bb | F | G', { ...finalBed,
      lines: [{ name: 'lead', instrument: 'horn', v: 0.66, layer: 'action', notes: 'Eb4:1 G4:1 Bb4:2 | F4:1.5 D4:0.5 Bb3:2 | C4:1 Eb4:1 G4:2 | Ab4:2 C5:2 | Bb4:1 Eb5:1 G5:2 | F5:1.5 D5:0.5 Bb4:2 | A4:1 C5:1 F5:2 | D5:2 B4:2' }],
    }),
    // no melody: the drive alone
    section('C', 144, 4, 36, 'aeolian', 'Cm | Ab | Cm | Bb | Cm | Ab | Fm | G', { ...finalBed, pad: { instrument: 'strings', lo: 55, hi: 74, v: 0.3, layer: 'reflection' } }),
    // the bridge is the Serpent's: C phrygian in three, the double reed on the semitone
    section('bridge', 160, 3, 36, 'phrygian', 'Cm | Db | Cm | Db | Bbm | Cm | Db | C', {
      pad: { instrument: 'strings', lo: 55, hi: 72, v: 0.3 },
      bass: { instrument: 'pizz', base: 36, pattern: 'whole', v: 0.54 },
      drums: { bar: [[0, 'drum', 0, 0.75], [1, 'kit', 1, 0.45], [2, 'kit', 1, 0.5]], layer: 'action' },
      lines: [{ name: 'lead', instrument: 'reed', v: 0.6, notes: 'C5:2 G5:1 | Ab5:2 Db5:1 | Eb5:1 G5:1 C6:1 | Bb5:2 Ab5:1 | Db5:2 F5:1 | Eb5:2 C5:1 | Db5:1 F5:1 Ab5:1 | G5:3' }],
    }),
    section('return', 120, 4, 36, 'aeolian', 'Ab | Ab G | Ab | G', { ramp: { fromBar: 0, bpm: 144 },
      pad: { instrument: 'strings', lo: 55, hi: 72, v: 0.34 },
      bass: { instrument: 'pizz', base: 36, pattern: 'half', v: 0.54 },
      drums: { bar: [[0, 'drum', 0, 0.74], [2, 'kit', 1, 0.56], [3, 'kit', 1, 0.5], [3.5, 'kit', 1, 0.6]], fill: finalFill, layer: 'action' },
      lines: [{ name: 'lead', instrument: 'brass', v: 0.7, notes: 'Ab3:1.5 Eb4:1.5 C4:1 | Ab3:2 G3:2 | C4:1 Eb4:1 Ab4:2 | G4:2 D4:2' }],
    }),
  ],
};

// ------------------------------------------------------------ boss: the breach, the corrupted motif in five, the entity in the bridge

const breachDrive: readonly Hit[] = [[0, 'drum', 0, 0.85], [1, 'drum', 1, 0.4], [1.5, 'drum', 0, 0.6], [3, 'drum', 0, 0.75], [4, 'drum', 1, 0.5], [4.5, 'drum', 1, 0.55], [0, 'timpani', 36, 0.45]];
const breachFill: readonly Hit[] = [[0, 'drum', 0, 0.85], [1, 'drum', 1, 0.45], [1.5, 'drum', 0, 0.6], [2, 'drum', 1, 0.5], [3, 'drum', 0, 0.75], [3.5, 'drum', 1, 0.55], [4, 'drum', 1, 0.6], [4.5, 'drum', 1, 0.7], [3, 'cymbal', 1, 0.55]];
const breachBed = {
  pad: { instrument: 'choir', lo: 53, hi: 70, v: 0.4 },
  bass: { instrument: 'pizz', base: 36, pattern: 'pulse', v: 0.54, layer: 'action' },
  arpeggio: { instrument: 'bell', lo: 48, perBeat: 0.4, v: 0.3, layer: 'reflection', patterns: [[0, 1]] },
  ostinato: { instrument: 'strings', lo: 55, perBeat: 2, v: 0.52, length: 0.28, layer: 'action', patterns: [[0, 1, 0, 2, 0, 1, 0, 3, 0, 2], [0, 2, 1, 0, 3, 0, 2, 1, 0, 1]] },
  drums: { bar: breachDrive, fill: breachFill, layer: 'action' },
} as const;

const boss: ThemeDef = {
  id: 'boss', track: 'finale/boss', hall: 'void', send: 0.24, gain: 0.95, lowCut: 96,
  form: [0, 1, 2, 3, 4, 5, 6], loopFrom: 1,
  sections: [
    // the entry (the demons' champion in the burning arena): low brass on the corrupted motif, a timpani roll
    section('entry', 84, 4, 36, 'octatonic', 'Cm | F#', {
      pad: { instrument: 'choir', lo: 53, hi: 70, v: 0.42 },
      drums: { bar: [[0, 'timpani', 36, 0.7], [1, 'timpani', 36, 0.5], [2, 'timpani', 36, 0.6], [3, 'timpani', 36, 0.7], [3.5, 'timpani', 36, 0.8], [2, 'cymbal', 1, 0.6]] },
      lines: [{ name: 'lead', instrument: 'brass', v: 0.74, notes: 'C3:2 F#3:2 | E3:2 Db3:2' }],
    }),
    section('A', 150, 5, 36, 'octatonic', 'Cm | F#m | Cm | A | Ebm | Cm | F# | Cdim7', { ...breachBed,
      lines: [
        { name: 'lead', instrument: 'brass', v: 0.74, layer: 'action', notes: 'C4:1 F#4:1 E4:1 Db4:2 | C#4:2 F#4:3 | Eb4:1 G4:1 C5:3 | A4:2 E4:1 C#4:2 | Eb4:1 Gb4:1 Bb4:3 | G4:2 Eb4:1 C4:2 | C#4:1 F#4:1 A#4:3 | A4:5' },
        { name: 'calm', instrument: 'glass', v: 0.4, layer: 'reflection', plain: true, notes: 'C5:3 F#5:2 | E5:3 Db5:2 | r:5 | r:5 | r:5 | r:5 | r:5 | r:5' },
      ],
    }),
    section('A2', 150, 5, 36, 'octatonic', 'Cm | F#m | Cm | A | Ebm | Cm | F# | Cdim7', { ...breachBed,
      lines: [
        { name: 'lead', instrument: 'strings', v: 0.6, layer: 'action', notes: 'C5:1 F#5:1 E5:1 Db5:2 | C#5:2 F#5:3 | Eb5:1 G5:1 C6:3 | A5:2 E5:1 C#5:2 | Eb5:1 Gb5:1 Bb5:3 | G5:2 Eb5:1 C5:2 | C#5:1 F#5:1 A#5:3 | A5:5' },
        { name: 'call', instrument: 'lowChoir', v: 0.5, layer: 'action', notes: 'r:5 | C3:2 F#3:3 | r:5 | A2:2 E3:3 | r:5 | C3:2 G3:3 | r:5 | A2:5' },
      ],
    }),
    section('B', 150, 5, 39, 'octatonic', 'Ebm | A | Ebm | C | F#m | Ebm | A | Cdim7', { ...breachBed,
      lines: [{ name: 'lead', instrument: 'horn', v: 0.64, layer: 'action', notes: 'Eb4:2 Bb4:1 A4:2 | E4:2 C#4:3 | Gb4:1 Bb4:1 Eb5:3 | C5:2 G4:1 E4:2 | F#4:1 A4:1 C#5:3 | Bb4:2 Gb4:1 Eb4:2 | E4:1 A4:1 C#5:3 | C5:5' }],
    }),
    // no melody: the drive alone
    section('C', 150, 5, 36, 'octatonic', 'Cm | F#m | Cm | Ebm | Cm | A | F#m | Cdim7', { ...breachBed, pad: { instrument: 'choir', lo: 55, hi: 72, v: 0.36, layer: 'reflection' } }),
    // the bridge is the entity's: six slow beats, the glass sings the motif backwards over the men's choir, on both levels
    section('bridge', 96, 6, 36, 'octatonic', 'Cdim7 | F# | Cdim7 | A | Cdim7 | Eb | Cdim7 | C', {
      pad: { instrument: 'lowChoir', lo: 43, hi: 60, v: 0.34 },
      bass: { instrument: 'strings', base: 36, pattern: 'whole', v: 0.4 },
      drums: { bar: [[0, 'timpani', 36, 0.35], [3, 'bell', 48, 0.25]], layer: 'action' },
      lines: [
        { name: 'entity', instrument: 'glass', v: 0.6, notes: 'Db5:3 E5:3 | F#5:3 C5:3 | r:6 | Db5:2 E5:2 F#5:2 | C6:6 | r:6 | A5:3 Eb5:3 | C5:6' },
        { name: 'choir', instrument: 'choir', v: 0.5, notes: 'C4:6 | F#3:6 | C4:6 | A3:6 | C4:6 | Eb4:6 | C4:6 | G3:6' },
      ],
    }),
    section('return', 120, 5, 36, 'octatonic', 'Ebm | F# | Cdim7 | G', { ramp: { fromBar: 0, bpm: 150 },
      pad: { instrument: 'choir', lo: 53, hi: 70, v: 0.4 },
      bass: { instrument: 'pizz', base: 36, pattern: 'half', v: 0.54 },
      drums: { bar: [[0, 'drum', 0, 0.75], [1.5, 'drum', 0, 0.6], [3, 'drum', 1, 0.55], [4, 'drum', 1, 0.6]], fill: breachFill, layer: 'action' },
      lines: [{ name: 'lead', instrument: 'brass', v: 0.7, notes: 'Bb3:2 F#4:3 | A#3:2 C#4:3 | A3:2 Eb4:3 | D4:2 B3:3' }],
    }),
  ],
};

/** Maelor's own entry at the heart of the breach: the corrupted motif in the lowest brass, a glass cluster, the great bell. */
const maelor = withEntry(boss, 'finale/boss@maelor', section('entry', 84, 4, 36, 'octatonic', 'Cm | F#', {
  pad: { instrument: 'lowChoir', lo: 43, hi: 60, v: 0.46 },
  drums: { bar: [[0, 'bell', 48, 0.45], [0, 'timpani', 36, 0.7], [1, 'timpani', 36, 0.5], [2, 'timpani', 36, 0.6], [3, 'timpani', 36, 0.75], [3.5, 'timpani', 36, 0.85]] },
  lines: [
    { name: 'lead', instrument: 'brass', v: 0.76, notes: 'C2:2 F#2:2 | E2:2 Db2:2' },
    { name: 'glass', instrument: 'glass', v: 0.4, notes: 'C6:4 | Db6:4' },
  ],
}));

export const FINALE_MUSIC: PartMusic = {
  tracks: { map, refuge, tension, drama, combat, boss },
  scenes: {
    finale_destiny_arena: { combat: arena, boss: arenaFinal },
    finale_breach_heart: { boss: maelor },
  },
};

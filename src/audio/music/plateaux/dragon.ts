/**
 * The Dragon: bronze and clouds (sketch, PLATEAU_MUSIC_DRAFT_2026-11-13). High, open and pale where the Bear is low,
 * closed and dark: D lydian, whose raised fourth floats, a five that never quite lands, bronze bells, a high choir on
 * "ou", the flute above the clouds, strings high and thin, little bass, a vast room with a long echo. The Seals motif
 * takes the raised fourth (1-5-#4-2). No drums of war on the map, no lute and no frame drum: those are the Lion's.
 */
import type { Hit, ThemeDef } from '../themes';
import { section, withEntry, type PartMusic } from './score';

// ------------------------------------------------------------ map: the celestial peaks, D lydian in five

const peaks = {
  pad: { instrument: 'airChoir', lo: 57, hi: 76, v: 0.26 },
  bass: { instrument: 'harp', base: 38, pattern: 'whole', v: 0.42 },
  arpeggio: { instrument: 'harp', lo: 67, perBeat: 1, v: 0.28, patterns: [[0, 2, 4, 3, 1], [0, 1, 3, 2, 4]] },
  drums: { bar: [] as readonly Hit[], fill: [[2, 'cymbal', 1, 0.2]] as readonly Hit[] },
} as const;

const map: ThemeDef = {
  id: 'map', track: 'dragon/map', hall: 'sky', send: 0.34, gain: 0.91,
  form: [0, 1, 2, 3, 4],
  sections: [
    section('A', 96, 5, 38, 'lydian', 'Dmaj7 | E | F#m7 | E | Bm7 | C#m7 | Dmaj9 | Esus4', { ...peaks,
      lines: [
        { name: 'lead', instrument: 'flute', v: 0.46, notes: 'D5:1 A5:2 G#5:1 E5:1 | F#5:2 E5:1 B4:2 | C#5:1.5 E5:0.5 F#5:3 | G#5:2 F#5:1 E5:1 D5:1 | B4:1 D5:1 F#5:2 A5:1 | G#5:2 E5:1 C#5:2 | E5:1 F#5:1 G#5:1 A5:2 | B5:3 A5:2' },
        { name: 'bells', instrument: 'bell', v: 0.4, notes: 'D6:3 r:2 | r:5 | A5:3 r:2 | r:5 | F#5:3 r:2 | r:5 | G#5:3 r:2 | r:5' },
      ],
    }),
    // the high choir takes the line, the flute answering from further up
    section('A2', 96, 5, 38, 'lydian', 'Dmaj7 | E | F#m7 | E | Bm7 | C#m7 | E | Dmaj7', { ...peaks,
      lines: [
        { name: 'lead', instrument: 'airChoir', v: 0.5, notes: 'A4:1 D5:2 C#5:1 B4:1 | C#5:2 B4:1 G#4:2 | A4:1.5 C#5:0.5 E5:3 | E5:2 D5:1 C#5:1 B4:1 | F#4:1 B4:1 D5:2 C#5:1 | E5:2 C#5:1 G#4:2 | B4:1 C#5:1 D5:1 E5:2 | F#5:3 E5:2' },
        { name: 'answer', instrument: 'flute', v: 0.34, cycles: 'odd', notes: 'r:5 | r:3 G#5:2 | r:5 | r:3 E5:2 | r:5 | r:3 C#6:2 | r:5 | r:3 A5:2' },
      ],
    }),
    // no melody: the harp, the choir and a bell from time to time
    section('B', 96, 5, 38, 'lydian', 'Bm9 | C#m7 | Dmaj7 | E | Bm7 | F#m7 | Dmaj7 | Esus4', { ...peaks,
      drums: { bar: [], fill: [[0, 'bell', 76, 0.3], [2, 'cymbal', 1, 0.2]] },
    }),
    // the bridge crosses to F lydian in three, a rope bridge between two needles
    section('bridge', 72, 3, 41, 'lydian', 'Fmaj7 | G | Am7 | G | Fmaj7 | G | Em7 | Esus4', {
      pad: { instrument: 'airChoir', lo: 57, hi: 76, v: 0.28 },
      bass: { instrument: 'harp', base: 41, pattern: 'whole', v: 0.44 },
      arpeggio: { instrument: 'harp', lo: 65, perBeat: 2, v: 0.28, patterns: [[0, 2, 4, 3, 2, 1]] },
      lines: [{ name: 'lead', instrument: 'strings', v: 0.5, notes: 'C5:2 A4:1 | B4:3 | E5:2 C5:1 | D5:3 | A5:2 G5:1 | B5:2 A5:1 | G5:1 E5:1 D5:1 | B4:3' }],
    }),
    section('return', 84, 5, 38, 'lydian', 'Bm7 | Esus4 | E | A', { ramp: { fromBar: 0, bpm: 96 }, ...peaks,
      lines: [{ name: 'lead', instrument: 'flute', v: 0.42, notes: 'F#5:2 D5:1 B4:2 | E5:3 B4:2 | G#4:2 B4:1 E5:2 | C#5:5' }],
    }),
  ],
};

// ------------------------------------------------------------ refuge: the hermitage, incense and a far bell

const hermitage = {
  pad: { instrument: 'airChoir', lo: 57, hi: 74, v: 0.24 },
  bass: { instrument: 'harp', base: 38, pattern: 'whole', v: 0.4 },
  arpeggio: { instrument: 'harp', lo: 62, perBeat: 1, v: 0.26, patterns: [[0, 2, 4, 2, 1], [0, 1, 3, 2, 4]] },
  drums: { bar: [] as readonly Hit[], fill: [[0, 'bell', 74, 0.22]] as readonly Hit[] },
} as const;

const refuge: ThemeDef = {
  id: 'refuge', track: 'dragon/refuge', hall: 'sky', send: 0.36, gain: 0.64,
  form: [0, 1, 2, 3],
  sections: [
    section('A', 76, 5, 38, 'lydian', 'Dmaj7 | E | Dmaj7 | C#m7 | Bm7 | E | F#m7 | Esus4', { ...hermitage,
      lines: [{ name: 'lead', instrument: 'flute', v: 0.4, plain: true, notes: 'A4:2 D5:1 E5:2 | G#5:3 F#5:2 | E5:2 D5:1 C#5:2 | E5:5 | D5:1 F#5:1 A5:3 | G#5:2 E5:3 | C#5:2 A4:1 C#5:2 | B4:5' }],
    }),
    // high strings on the motif, the bells answering
    section('B', 76, 5, 38, 'lydian', 'Bm7 | C#m7 | Dmaj7 | E | Bm7 | C#m7 | Dmaj9 | A', { ...hermitage,
      lines: [
        { name: 'lead', instrument: 'strings', v: 0.38, plain: true, notes: 'D5:3 A5:2 | G#5:3 E5:2 | F#5:2 A5:1 C#6:2 | B5:5 | F#5:2 D5:1 B4:2 | E5:2 G#5:1 B5:2 | A5:2 F#5:1 E5:2 | E5:5' },
        { name: 'bells', instrument: 'bell', v: 0.3, notes: 'r:5 | D6:5 | r:5 | B5:5 | r:5 | E6:5 | r:5 | C#6:5' },
      ],
    }),
    // the bridge drifts down to B-flat lydian in three
    section('bridge', 60, 3, 46, 'lydian', 'Bbmaj7 | C | Dm7 | C | Bbmaj7 | C | Am7 | Asus4', {
      pad: { instrument: 'airChoir', lo: 58, hi: 74, v: 0.24 },
      bass: { instrument: 'harp', base: 46, pattern: 'whole', v: 0.42 },
      lines: [{ name: 'lead', instrument: 'flute', v: 0.36, notes: 'F5:2 D5:1 | E5:3 | A5:2 F5:1 | G5:3 | D5:1 F5:1 A5:1 | C6:2 Bb5:1 | A5:1 E5:1 C5:1 | D5:3' }],
    }),
    section('return', 76, 5, 38, 'lydian', 'Bm7 | Esus4 | A', { ramp: { fromBar: 1, bpm: 64 }, ...hermitage,
      lines: [{ name: 'lead', instrument: 'flute', v: 0.38, plain: true, notes: 'F#5:2 E5:1 D5:2 | B4:3 E5:2 | C#5:5' }],
    }),
  ],
};

// ------------------------------------------------------------ tension: the Wolf's lair, F-sharp minor and a lowered second

const lair: readonly Hit[] = [[0, 'timpani', 42, 0.4], [3, 'timpani', 42, 0.3]];

const tension: ThemeDef = {
  id: 'tension', track: 'dragon/tension', hall: 'sky', send: 0.3, gain: 1.16, lowCut: 70,
  form: [0, 1, 2, 3],
  sections: [
    section('A', 92, 5, 42, 'aeolian', 'F#m | G | F#m | G | Em | F#m | G | C#', {
      pad: { instrument: 'strings', lo: 54, hi: 69, v: 0.26 },
      bass: { instrument: 'pizz', base: 42, pattern: 'pulse', v: 0.42 },
      drums: { bar: lair },
      lines: [{ name: 'lead', instrument: 'horn', v: 0.44, notes: 'F#4:2 C#5:1 B4:1 G#4:1 | G4:3 F#4:2 | r:5 | r:3 A4:1 G4:1 | B4:2 G4:2 E4:1 | A4:1 C#5:1 F#4:3 | G4:1 B4:1 D5:3 | C#5:5' }],
    }),
    // no melody: the pulse and the strings
    section('B', 92, 5, 42, 'aeolian', 'F#m | G | Bm | G | F#m | G | Em | G', {
      pad: { instrument: 'strings', lo: 54, hi: 71, v: 0.3 },
      bass: { instrument: 'pizz', base: 42, pattern: 'pulse', v: 0.42 },
      drums: { bar: lair },
    }),
    // the bridge looks up to G lydian in four: the flute over the timpani
    section('bridge', 100, 4, 43, 'lydian', 'Gmaj7 | A | Gmaj7 | A | Em7 | F#m7 | Gmaj7 | C#7', {
      pad: { instrument: 'airChoir', lo: 57, hi: 74, v: 0.28 },
      bass: { instrument: 'pizz', base: 43, pattern: 'half', v: 0.46 },
      drums: { bar: [[0, 'timpani', 43, 0.4], [2, 'timpani', 43, 0.3]] },
      lines: [{ name: 'lead', instrument: 'flute', v: 0.42, notes: 'B4:2 F#5:2 | E5:2 C#5:2 | D5:4 | r:4 | B4:1 D5:1 F#5:2 | G5:2 E5:2 | A4:2 C#5:2 | G#4:4' }],
    }),
    section('return', 92, 5, 42, 'aeolian', 'G | F#m | G | C#', {
      pad: { instrument: 'strings', lo: 54, hi: 71, v: 0.3 },
      bass: { instrument: 'pizz', base: 42, pattern: 'pulse', v: 0.42 },
      drums: { bar: lair },
      lines: [{ name: 'lead', instrument: 'horn', v: 0.42, notes: 'B4:3 G4:2 | A4:5 | D5:3 B4:2 | G#4:5' }],
    }),
  ],
};

// ------------------------------------------------------------ drama: the broken sky, F-sharp minor in five

const drama: ThemeDef = {
  id: 'drama', track: 'dragon/drama', hall: 'sky', send: 0.42, gain: 1.55,
  form: [0, 1, 2, 3],
  sections: [
    section('A', 66, 5, 42, 'aeolian', 'F#m | D | Bm | r | F#m | D | E | C#', {
      pad: { instrument: 'airChoir', lo: 57, hi: 74, v: 0.36 },
      bass: { instrument: 'strings', base: 42, pattern: 'whole', v: 0.4 },
      lines: [{ name: 'lead', instrument: 'strings', v: 0.48, notes: 'F#4:3 C#5:2 | B4:3 G#4:2 | A4:2 F#4:3 | r:5 | C#5:2 F#5:3 | D5:3 A4:2 | B4:2 G#4:3 | G#4:5' }],
    }),
    // no melody: strings answered by silence
    section('B', 66, 5, 42, 'aeolian', 'D | r | Bm | r | E | r | C# | r', {
      pad: { instrument: 'strings', lo: 54, hi: 71, v: 0.3 },
      bass: { instrument: 'strings', base: 42, pattern: 'whole', v: 0.38 },
    }),
    // the bridge opens into D lydian and three: the flute and the harp, the only light
    section('bridge', 72, 3, 38, 'lydian', 'Dmaj7 | E | C#m7 | F#m | Dmaj7 | E | Bm7 | C#7', {
      pad: { instrument: 'airChoir', lo: 57, hi: 74, v: 0.3 },
      bass: { instrument: 'harp', base: 38, pattern: 'whole', v: 0.46 },
      arpeggio: { instrument: 'harp', lo: 62, perBeat: 2, v: 0.28, patterns: [[0, 2, 3, 2, 1, 2]] },
      lines: [{ name: 'lead', instrument: 'flute', v: 0.44, notes: 'A5:2 F#5:1 | G#5:3 | E5:2 C#5:1 | F#5:3 | A5:1 B5:1 C#6:1 | B5:2 G#5:1 | F#5:1 D5:1 B4:1 | C#5:3' }],
    }),
    section('return', 66, 5, 42, 'aeolian', 'Bm | D | C#', { ramp: { fromBar: 1, bpm: 56 },
      pad: { instrument: 'airChoir', lo: 57, hi: 74, v: 0.36 },
      bass: { instrument: 'strings', base: 42, pattern: 'whole', v: 0.4 },
      lines: [{ name: 'lead', instrument: 'strings', v: 0.44, notes: 'D5:3 B4:2 | A4:2 F#4:3 | G#4:5' }],
    }),
  ],
};

// ------------------------------------------------------------ combat: flight over the peaks, two levels in five

const flight: readonly Hit[] = [[0, 'drum', 0, 0.75], [1.5, 'drum', 1, 0.4], [3, 'drum', 0, 0.6], [4, 'drum', 1, 0.45], [3, 'timpani', 42, 0.35]];
const flightFill: readonly Hit[] = [[0, 'drum', 0, 0.75], [1, 'drum', 1, 0.4], [2, 'drum', 1, 0.45], [3, 'drum', 0, 0.6], [3.5, 'drum', 1, 0.45], [4, 'drum', 1, 0.55], [4.5, 'drum', 1, 0.65], [0, 'bell', 78, 0.3], [3, 'cymbal', 1, 0.45]];
const combatBed = {
  pad: { instrument: 'airChoir', lo: 61, hi: 78, v: 0.11, layer: 'reflection' },
  bass: { instrument: 'pizz', base: 42, pattern: 'rootFifth', v: 0.5 },
  arpeggio: { instrument: 'harp', lo: 61, perBeat: 2, v: 0.07, layer: 'reflection', patterns: [[0, 2, 4, 2, 1, 3, 4, 2, 0, 2]] },
  ostinato: { instrument: 'strings', lo: 61, perBeat: 2, v: 0.52, length: 0.3, layer: 'action', patterns: [[0, 1, 2, 0, 1, 2, 0, 2, 0, 3], [0, 2, 1, 0, 2, 1, 0, 3, 0, 2]] },
  drums: { bar: flight, fill: flightFill, layer: 'action' },
} as const;

const combat: ThemeDef = {
  id: 'combat', track: 'dragon/combat', hall: 'sky', send: 0.18, gain: 1.45, lowCut: 118,
  form: [0, 1, 2, 3, 4, 5],
  sections: [
    section('A', 152, 5, 42, 'aeolian', 'F#m | F#m | D | E | F#m | F#m | Bm | C#', { ...combatBed,
      lines: [
        { name: 'lead', instrument: 'horn', v: 0.64, layer: 'action', notes: 'F#4:1.5 C#5:1.5 B4:1 G#4:1 | A4:2 F#4:3 | D5:1 C#5:1 A4:3 | B4:2 G#4:1 E4:2 | F#4:1.5 C#5:1.5 B4:1 G#4:1 | A4:1 B4:1 C#5:3 | D5:2 F#5:1 D5:2 | C#5:5' },
        { name: 'calm', instrument: 'flute', v: 0.15, layer: 'reflection', plain: true, notes: 'F#5:2 C#6:3 | B5:2 G#5:3 | r:5 | r:5 | r:5 | r:5 | r:5 | r:5' },
      ],
    }),
    section('A2', 152, 5, 42, 'aeolian', 'F#m | F#m | D | E | F#m | F#m | Bm | C#', { ...combatBed,
      lines: [
        { name: 'lead', instrument: 'strings', v: 0.6, layer: 'action', notes: 'C#5:1.5 F#5:1.5 E5:1 C#5:1 | E5:2 C#5:3 | F#5:1 E5:1 D5:3 | E5:2 B4:1 G#4:2 | A4:1 C#5:1 F#5:3 | E5:1 D5:1 C#5:3 | D5:1 F#5:1 B5:3 | G#5:5' },
        { name: 'call', instrument: 'brass', v: 0.5, layer: 'action', cycles: 'odd', notes: 'r:5 | F#3:2 C#4:3 | r:5 | E3:2 B3:3 | r:5 | F#3:2 C#4:3 | r:5 | C#4:5' },
      ],
    }),
    // the B section turns to D lydian: the brass in the open, the bells on reflection
    section('B', 152, 5, 38, 'lydian', 'Dmaj7 | E | C#m7 | F#m | Dmaj7 | E | Bm7 | C#', { ...combatBed,
      lines: [
        { name: 'lead', instrument: 'brass', v: 0.6, layer: 'action', notes: 'A3:1 D4:1 F#4:3 | G#4:2 E4:1 B3:2 | C#4:1 E4:1 G#4:3 | F#4:5 | A4:1 F#4:1 D4:3 | E4:2 G#4:1 B4:2 | D5:2 C#5:1 B4:2 | C#5:5' },
        { name: 'bells', instrument: 'bell', v: 0.16, layer: 'reflection', notes: 'D6:5 | r:5 | r:5 | r:5 | A5:5 | r:5 | r:5 | r:5' },
      ],
    }),
    // no melody: ostinato and drums on action, the harp and the choir on reflection
    section('C', 152, 5, 42, 'aeolian', 'F#m | D | F#m | E | F#m | D | Bm | C#', { ...combatBed }),
    // the bridge stretches the five into seven and rises to A: the high choir sings over the horns
    section('bridge', 132, 7, 45, 'ionian', 'A | E | F#m | D | Bm | C#', {
      pad: { instrument: 'airChoir', lo: 61, hi: 76, v: 0.28, layer: 'reflection' },
      bass: { instrument: 'pizz', base: 45, pattern: 'half', v: 0.52 },
      drums: { bar: [[0, 'drum', 0, 0.7], [2, 'drum', 1, 0.4], [4, 'drum', 0, 0.6], [5.5, 'drum', 1, 0.4], [0, 'timpani', 45, 0.4]], layer: 'action' },
      lines: [
        { name: 'choir', instrument: 'airChoir', v: 0.56, layer: 'action', notes: 'E5:3 C#5:1 A4:3 | B4:4 G#4:3 | A4:2 C#5:2 F#5:3 | F#5:4 D5:3 | D5:2 F#5:2 B5:3 | G#5:7' },
        { name: 'horns', instrument: 'horn', v: 0.5, layer: 'action', notes: 'A3:4 E4:3 | E3:4 B3:3 | F#3:4 C#4:3 | D4:4 A3:3 | B3:4 F#4:3 | C#4:7' },
        { name: 'calm', instrument: 'flute', v: 0.34, layer: 'reflection', plain: true, notes: 'A5:7 | G#5:7 | r:7 | r:7 | r:7 | r:7' },
      ],
    }),
    section('return', 120, 5, 42, 'aeolian', 'D | E | Bm | C#', { ramp: { fromBar: 0, bpm: 152 },
      pad: { instrument: 'airChoir', lo: 61, hi: 78, v: 0.28, layer: 'reflection' },
      bass: { instrument: 'pizz', base: 42, pattern: 'half', v: 0.52 },
      drums: { bar: [[0, 'drum', 0, 0.6], [3, 'drum', 0, 0.5], [4, 'drum', 1, 0.45], [4.5, 'drum', 1, 0.55]], fill: flightFill, layer: 'action' },
      lines: [{ name: 'lead', instrument: 'horn', v: 0.56, notes: 'F#4:2 A4:3 | G#4:2 B4:3 | D5:2 B4:1 F#4:2 | E#4:5' }],
    }),
  ],
};

// ------------------------------------------------------------ boss: the judgement of the sky, C-sharp minor in seven

const judgement: readonly Hit[] = [[0, 'drum', 0, 0.85], [1, 'drum', 1, 0.4], [2, 'drum', 0, 0.6], [3, 'drum', 1, 0.45], [4, 'drum', 0, 0.75], [5, 'drum', 1, 0.4], [6, 'drum', 1, 0.5], [0, 'timpani', 37, 0.45]];
const judgementFill: readonly Hit[] = [[0, 'drum', 0, 0.85], [1, 'drum', 1, 0.45], [2, 'drum', 0, 0.6], [3, 'drum', 1, 0.5], [4, 'drum', 0, 0.75], [5, 'drum', 1, 0.55], [5.5, 'drum', 1, 0.6], [6, 'drum', 1, 0.7], [4, 'cymbal', 1, 0.55], [0, 'bell', 85, 0.3]];
const bossBed = {
  pad: { instrument: 'airChoir', lo: 56, hi: 73, v: 0.4 },
  bass: { instrument: 'pizz', base: 37, pattern: 'pulse', v: 0.54, layer: 'action' },
  arpeggio: { instrument: 'harp', lo: 56, perBeat: 1, v: 0.36, layer: 'reflection', patterns: [[0, 1, 2, 1, 3, 2, 1]] },
  ostinato: { instrument: 'strings', lo: 56, perBeat: 2, v: 0.5, length: 0.28, layer: 'action', patterns: [[0, 0, 1, 0, 2, 0, 1, 0, 0, 2, 0, 1, 2, 1]] },
  drums: { bar: judgement, fill: judgementFill, layer: 'action' },
} as const;

const boss: ThemeDef = {
  id: 'boss', track: 'dragon/boss', hall: 'sky', send: 0.2, gain: 0.94, lowCut: 96,
  form: [0, 1, 2, 3, 4, 5, 6], loopFrom: 1,
  sections: [
    // the entry (the Wolf's chief, the Shadow shaman): low brass on the motif over a timpani roll
    section('entry', 84, 4, 37, 'aeolian', 'C#m | A G#', {
      pad: { instrument: 'airChoir', lo: 56, hi: 73, v: 0.4 },
      drums: { bar: [[0, 'timpani', 37, 0.7], [1, 'timpani', 37, 0.5], [2, 'timpani', 37, 0.6], [3, 'timpani', 37, 0.7], [3.5, 'timpani', 37, 0.8], [2, 'cymbal', 1, 0.6]] },
      lines: [{ name: 'lead', instrument: 'brass', v: 0.74, notes: 'C#3:2 G#3:2 | F#3:2 D#3:2' }],
    }),
    section('A', 168, 7, 37, 'aeolian', 'C#m | A | B | C#m | E | B | A | G#', { ...bossBed,
      lines: [
        { name: 'lead', instrument: 'brass', v: 0.72, layer: 'action', notes: 'C#4:2 G#4:2 F#4:1.5 D#4:1.5 | E4:4 C#4:3 | D#4:2 F#4:2 B4:3 | G#4:4 E4:3 | G#4:2 B4:2 E5:3 | D#5:4 B4:3 | C#5:2 A4:2 E4:3 | D#4:7' },
        { name: 'calm', instrument: 'airChoir', v: 0.42, layer: 'reflection', plain: true, notes: 'C#5:4 G#5:3 | E5:7 | r:7 | r:7 | r:7 | r:7 | r:7 | r:7' },
      ],
    }),
    section('A2', 168, 7, 37, 'aeolian', 'C#m | A | B | C#m | E | B | A | G#', { ...bossBed,
      lines: [
        { name: 'lead', instrument: 'strings', v: 0.6, layer: 'action', notes: 'C#5:2 G#5:2 F#5:1.5 D#5:1.5 | E5:4 C#5:3 | D#5:2 F#5:2 B5:3 | G#5:4 E5:3 | G#5:2 B5:2 E6:3 | D#6:4 B5:3 | C#6:2 A5:2 E5:3 | D#5:7' },
        { name: 'call', instrument: 'horn', v: 0.56, layer: 'action', notes: 'r:7 | C#4:4 G#4:3 | r:7 | B3:4 F#4:3 | r:7 | E4:4 B4:3 | r:7 | G#3:7' },
        { name: 'bells', instrument: 'bell', v: 0.3, layer: 'action', notes: 'C#6:7 | r:7 | r:7 | r:7 | E6:7 | r:7 | r:7 | r:7' },
      ],
    }),
    section('B', 168, 7, 40, 'lydian', 'Emaj7 | F# | D#m7 | C#m7 | Emaj7 | F# | G#m7 | G#', { ...bossBed,
      lines: [{ name: 'lead', instrument: 'horn', v: 0.66, layer: 'action', notes: 'B4:2 E5:2 G#5:3 | A#4:4 C#5:3 | F#4:2 A#4:2 D#5:3 | E5:4 C#5:3 | G#4:2 B4:2 E5:3 | F#5:4 A#4:3 | B4:2 D#5:2 F#5:3 | B#4:7' }],
    }),
    // no melody: the drive alone
    section('C', 168, 7, 37, 'aeolian', 'C#m | A | C#m | B | C#m | A | F#m | G#', { ...bossBed, pad: { instrument: 'airChoir', lo: 59, hi: 76, v: 0.36, layer: 'reflection' } }),
    // the bridge brings back the Dragon's own lydian in five: the high choir sings the motif with the raised fourth
    section('bridge', 150, 5, 38, 'lydian', 'Dmaj7 | E | Dmaj7 | E | Bm7 | C#m7 | Dmaj7 | G#', {
      pad: { instrument: 'strings', lo: 57, hi: 74, v: 0.3 },
      bass: { instrument: 'pizz', base: 38, pattern: 'half', v: 0.54 },
      drums: { bar: [[0, 'drum', 0, 0.75], [1.5, 'drum', 1, 0.4], [3, 'drum', 0, 0.6], [4, 'drum', 1, 0.45]], fill: [[0, 'drum', 0, 0.75], [3, 'drum', 0, 0.6], [4, 'drum', 1, 0.5], [0, 'bell', 86, 0.3]], layer: 'action' },
      lines: [{ name: 'choir', instrument: 'airChoir', v: 0.6, notes: 'D5:1 A5:2 G#5:1 E5:1 | F#5:2 E5:1 B4:2 | D5:1 A5:2 G#5:1 E5:1 | B5:3 G#5:2 | F#5:2 D5:1 B4:2 | E5:2 G#5:1 C#6:2 | A5:2 F#5:1 D5:2 | B#5:5' }],
    }),
    section('return', 140, 7, 37, 'aeolian', 'A | A G# | A | G#', { ramp: { fromBar: 0, bpm: 168 },
      pad: { instrument: 'airChoir', lo: 56, hi: 73, v: 0.4 },
      bass: { instrument: 'pizz', base: 37, pattern: 'half', v: 0.54 },
      drums: { bar: [[0, 'drum', 0, 0.75], [2, 'drum', 1, 0.5], [4, 'drum', 0, 0.6], [6, 'drum', 1, 0.55]], fill: judgementFill, layer: 'action' },
      lines: [{ name: 'lead', instrument: 'brass', v: 0.7, notes: 'A3:4 E4:3 | A3:4 G#3:3 | C#4:2 E4:2 A4:3 | G#4:4 D#4:3' }],
    }),
  ],
};

/** Kaelen's own entry on the esplanade of his hall: a bell cascade, then the brass name the motif in the Dragon's lydian. */
const kaelen = withEntry(boss, 'dragon/boss@kaelen', section('entry', 84, 4, 38, 'lydian', 'Dmaj7 | E', {
  pad: { instrument: 'airChoir', lo: 57, hi: 76, v: 0.44 },
  drums: { bar: [[0, 'bell', 86, 0.5], [0.5, 'bell', 81, 0.42], [1, 'bell', 80, 0.4], [1.5, 'bell', 76, 0.38], [3, 'cymbal', 1, 0.55], [0, 'timpani', 38, 0.6]] },
  lines: [
    { name: 'lead', instrument: 'brass', v: 0.72, notes: 'D3:2 A3:2 | G#3:2 E3:2' },
    { name: 'choir', instrument: 'airChoir', v: 0.5, notes: 'A4:2 D5:2 | B4:2 G#4:2' },
  ],
}));

export const DRAGON_MUSIC: PartMusic = {
  tracks: { map, refuge, tension, drama, combat, boss },
  scenes: { dragon_hall_esplanade: { boss: kaelen } },
};

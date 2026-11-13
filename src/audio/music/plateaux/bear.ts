/**
 * The Bear: granite and embers (sketch, PLATEAU_MUSIC_DRAFT_2026-11-13). Low, heavy and closed where the Lion is open:
 * B-flat aeolian in open fifths without thirds in the pads, a compound six that sways like a load carried uphill, a
 * men's choir on "oh", low brass in parallel fifths, war drums, an anvil and the clank of chains, a stone room close
 * by. The Seals motif (1-5-4-2) is sung low and slow. No lute, no harp, no flute: those are the Lion's.
 */
import type { Hit, ThemeDef } from '../themes';
import { section, withEntry, type PartMusic } from './score';

// ------------------------------------------------------------ map: the climb, B-flat aeolian in a heavy six

const climb: readonly Hit[] = [[0, 'drum', 0, 0.5], [3, 'drum', 1, 0.28]];
const climbFill: readonly Hit[] = [[0, 'drum', 0, 0.5], [3, 'drum', 1, 0.3], [4, 'drum', 1, 0.26], [5, 'anvil', 0, 0.16]];
const mapBed = {
  pad: { instrument: 'lowChoir', lo: 46, hi: 62, v: 0.34 },
  bass: { instrument: 'strings', base: 34, pattern: 'whole', v: 0.4 },
  drums: { bar: climb, fill: climbFill },
} as const;

const map: ThemeDef = {
  id: 'map', track: 'bear/map', hall: 'cave', send: 0.22, gain: 1.73,
  form: [0, 1, 2, 3, 4],
  sections: [
    section('A', 132, 6, 34, 'aeolian', 'Bb5 | Gb5 | Db5 | Ab5 | Bb5 | Gb5 | Eb5 | F5', { ...mapBed,
      lines: [{ name: 'lead', instrument: 'horn', v: 0.56, notes: 'Bb3:3 F4:3 | Eb4:3 C4:3 | Db4:2 Eb4:1 F4:3 | Ab4:3 Gb4:2 F4:1 | F4:2 Db4:1 Bb3:3 | Gb3:2 Ab3:1 Bb3:2 Db4:1 | Eb4:3 Db4:2 C4:1 | F3:6' }],
    }),
    // the men's choir takes the line an octave down, the horn answering on the second round
    section('A2', 132, 6, 34, 'aeolian', 'Bb5 | Gb5 | Db5 | Ab5 | Bb5 | Gb5 | F5 | Bb5', { ...mapBed,
      pad: { instrument: 'strings', lo: 46, hi: 65, v: 0.24 },
      lines: [
        { name: 'lead', instrument: 'lowChoir', v: 0.5, notes: 'Bb2:3 F3:3 | Eb3:3 C3:3 | Db3:2 Eb3:1 F3:3 | Ab3:3 Gb3:2 F3:1 | F3:2 Db3:1 Bb2:3 | Gb2:2 Ab2:1 Bb2:2 Db3:1 | C3:3 Eb3:2 F3:1 | Bb2:6' },
        { name: 'answer', instrument: 'horn', v: 0.36, cycles: 'odd', notes: 'r:6 | Bb3:6 | r:6 | Eb4:6 | r:6 | Db4:6 | r:6 | F3:6' },
      ],
    }),
    // no melody: the drums and the strings, an anvil far off
    section('B', 132, 6, 34, 'aeolian', 'Gb5 | Db5 | Ab5 | Eb5 | Gb5 | Db5 | Eb5 | F5', { ...mapBed, pad: { instrument: 'strings', lo: 46, hi: 65, v: 0.28 } }),
    // the bridge stops the climb: an even four in D-flat, low brass in open fifths
    section('bridge', 66, 4, 37, 'ionian', 'Db5 | Ab5 | Gb5 | Db5 | Bbm | Gb5 | Ab5 | Ab5', {
      pad: { instrument: 'lowChoir', lo: 49, hi: 65, v: 0.3 },
      bass: { instrument: 'strings', base: 37, pattern: 'whole', v: 0.42 },
      drums: { bar: [[0, 'timpani', 37, 0.4]], fill: [[0, 'timpani', 37, 0.4], [2, 'timpani', 44, 0.35]] },
      lines: [
        { name: 'brass', instrument: 'brass', v: 0.5, notes: 'Db3:2 Ab3:2 | Eb3:2 Ab2:2 | Bb2:2 Db3:2 | Ab2:4 | Db3:1 F3:1 Ab3:2 | Gb3:2 F3:2 | Eb3:2 Ab3:2 | Ab3:4' },
        { name: 'fifth', instrument: 'brass', v: 0.4, notes: 'Ab3:2 Eb4:2 | Bb3:2 Eb3:2 | F3:2 Ab3:2 | Eb3:4 | Ab3:1 C4:1 Eb4:2 | Db4:2 C4:2 | Bb3:2 Eb4:2 | Eb4:4' },
      ],
    }),
    // the return takes up the load again on the dominant
    section('return', 108, 6, 34, 'aeolian', 'Gb5 | Ab5 | Eb5 | F5', { ramp: { fromBar: 0, bpm: 132 }, ...mapBed,
      lines: [{ name: 'lead', instrument: 'horn', v: 0.5, notes: 'Gb3:3 Ab3:3 | Bb3:3 C4:3 | Eb4:2 Db4:1 C4:3 | F3:6' }],
    }),
  ],
};

// ------------------------------------------------------------ refuge: the stone hearth, D-flat major

const hearth = {
  pad: { instrument: 'lowChoir', lo: 49, hi: 63, v: 0.26 },
  bass: { instrument: 'strings', base: 37, pattern: 'whole', v: 0.4 },
  arpeggio: { instrument: 'pizz', lo: 49, perBeat: 1, v: 0.28, patterns: [[0, 1, 2, 1, 2, 1], [0, 2, 1, 2, 3, 2]] },
} as const;

const refuge: ThemeDef = {
  id: 'refuge', track: 'bear/refuge', hall: 'cave', send: 0.3, gain: 1.75,
  form: [0, 1, 2, 3],
  sections: [
    section('A', 108, 6, 37, 'ionian', 'Db | Ab | Bbm | Gb | Db | Ab | Gb | Ab', { ...hearth,
      lines: [{ name: 'lead', instrument: 'strings', v: 0.5, plain: true, notes: 'Ab3:3 Db4:3 | C4:2 Bb3:1 Ab3:3 | Bb3:2 Db4:1 F4:3 | Eb4:3 Db4:3 | Ab3:2 Bb3:1 Db4:3 | Eb4:2 F4:1 Eb4:3 | Db4:2 Bb3:1 Gb3:3 | Ab3:6' }],
    }),
    // the horn hums the motif by the fire
    section('B', 108, 6, 37, 'ionian', 'Gb | Db | Ebm | Ab | Gb | Db | Ebm7 | Ab7', { ...hearth,
      lines: [{ name: 'lead', instrument: 'horn', v: 0.42, notes: 'Db4:3 Ab4:3 | Gb4:3 Eb4:3 | Gb4:2 F4:1 Eb4:3 | Eb4:3 C4:3 | Bb3:2 Db4:1 Gb4:3 | F4:2 Eb4:1 Db4:3 | Eb4:2 Gb4:1 Bb4:3 | Ab4:6' }],
    }),
    // outside the stone: an even four in B-flat minor, the choir alone with the strings
    section('bridge', 60, 4, 34, 'aeolian', 'Bbm | Gb | Db | Ab | Bbm | Gb | Ebm | F', {
      pad: { instrument: 'strings', lo: 46, hi: 65, v: 0.26 },
      bass: { instrument: 'strings', base: 34, pattern: 'whole', v: 0.4 },
      lines: [{ name: 'lead', instrument: 'lowChoir', v: 0.5, notes: 'F3:2 Db3:2 | Gb3:4 | Ab3:2 F3:2 | Eb3:4 | Db3:2 F3:2 | Bb3:2 Ab3:2 | Gb3:2 Eb3:2 | C3:4' }],
    }),
    section('return', 108, 6, 37, 'ionian', 'Gb | Ebm7 | Ab', { ramp: { fromBar: 1, bpm: 90 }, ...hearth,
      lines: [{ name: 'lead', instrument: 'strings', v: 0.46, plain: true, notes: 'Bb3:3 Db4:3 | Eb4:2 Db4:1 Bb3:3 | C4:6' }],
    }),
  ],
};

// ------------------------------------------------------------ tension: under the mountain, a heartbeat and chains

const heartbeat: readonly Hit[] = [[0, 'drum', 1, 0.45], [1, 'drum', 1, 0.3], [4, 'anvil', 1, 0.18]];

const tension: ThemeDef = {
  id: 'tension', track: 'bear/tension', hall: 'cave', send: 0.28, gain: 2.24, lowCut: 70,
  form: [0, 1, 2, 3],
  sections: [
    section('A', 150, 6, 34, 'aeolian', 'Bb5 | Bb5 | A5 | Bb5 | Gb5 | F5 | Gb5 | F5', {
      pad: { instrument: 'strings', lo: 46, hi: 62, v: 0.26 },
      bass: { instrument: 'strings', base: 34, pattern: 'whole', v: 0.4 },
      drums: { bar: heartbeat },
      lines: [{ name: 'lead', instrument: 'lowChoir', v: 0.48, notes: 'Bb2:6 | F3:3 Eb3:3 | C3:6 | r:6 | Gb3:3 F3:3 | Eb3:2 Db3:1 C3:3 | Db3:3 Eb3:3 | F3:6' }],
    }),
    // no melody: a tritone under the strings
    section('B', 150, 6, 34, 'aeolian', 'Bb5 | A5 | Bb5 | E5 | Bb5 | A5 | Gb5 | F5', {
      pad: { instrument: 'strings', lo: 46, hi: 62, v: 0.3 },
      bass: { instrument: 'strings', base: 34, pattern: 'whole', v: 0.4 },
      drums: { bar: heartbeat },
    }),
    // the bridge slips a semitone up into an even four
    section('bridge', 72, 4, 35, 'aeolian', 'B5 | C5 | B5 | G5 | B5 | C5 | A5 | F#5', {
      pad: { instrument: 'lowChoir', lo: 47, hi: 62, v: 0.3 },
      bass: { instrument: 'strings', base: 35, pattern: 'whole', v: 0.4 },
      drums: { bar: [[0, 'drum', 1, 0.45], [2, 'drum', 1, 0.35]] },
      lines: [{ name: 'lead', instrument: 'horn', v: 0.44, notes: 'B3:2 F#4:2 | E4:2 C4:2 | D4:4 | r:4 | B3:1 D4:1 F#4:2 | G4:2 E4:2 | A3:2 C4:2 | C#4:4' }],
    }),
    section('return', 150, 6, 34, 'aeolian', 'Gb5 | F5 | Gb5 | F5', {
      pad: { instrument: 'strings', lo: 46, hi: 62, v: 0.3 },
      bass: { instrument: 'strings', base: 34, pattern: 'whole', v: 0.4 },
      drums: { bar: heartbeat },
      lines: [{ name: 'lead', instrument: 'lowChoir', v: 0.46, notes: 'Gb3:3 F3:3 | C3:6 | Db3:3 C3:3 | F2:6' }],
    }),
  ],
};

// ------------------------------------------------------------ drama: the oath, a chant over the strings

const drama: ThemeDef = {
  id: 'drama', track: 'bear/drama', hall: 'cave', send: 0.4, gain: 1.9,
  form: [0, 1, 2, 3],
  sections: [
    section('A', 96, 6, 34, 'aeolian', 'Bbm | Ab | Db | Ab | Bbm | Gb | Ebm | F', {
      pad: { instrument: 'strings', lo: 46, hi: 65, v: 0.3 },
      bass: { instrument: 'strings', base: 34, pattern: 'whole', v: 0.4 },
      lines: [{ name: 'lead', instrument: 'lowChoir', v: 0.55, notes: 'Bb2:3 F3:3 | Eb3:3 C3:3 | Db3:3 F3:3 | Eb3:3 C3:3 | Db3:2 C3:1 Bb2:3 | Gb2:3 Bb2:3 | Eb3:2 Db3:1 C3:3 | F2:6' }],
    }),
    // no melody: strings answered by silence
    section('B', 96, 6, 34, 'aeolian', 'Gb | r | Db | r | Ebm | r | F | r', {
      pad: { instrument: 'strings', lo: 46, hi: 65, v: 0.3 },
      bass: { instrument: 'strings', base: 34, pattern: 'whole', v: 0.38 },
    }),
    // the bridge opens into D-flat and three: a brass chorale, the only light
    section('bridge', 72, 3, 37, 'ionian', 'Db | Ab | Bbm | Gb | Db | Ab | Gb | Ab', {
      pad: { instrument: 'lowChoir', lo: 49, hi: 65, v: 0.3 },
      bass: { instrument: 'strings', base: 37, pattern: 'whole', v: 0.42 },
      lines: [{ name: 'lead', instrument: 'brass', v: 0.46, notes: 'Ab3:2 Db4:1 | C4:3 | Bb3:2 Db4:1 | Bb3:3 | Ab3:1 Bb3:1 Db4:1 | Eb4:2 C4:1 | Db4:1 Bb3:1 Gb3:1 | Ab3:3' }],
    }),
    section('return', 96, 6, 34, 'aeolian', 'Gb | Ebm | F | F', { ramp: { fromBar: 1, bpm: 80 },
      pad: { instrument: 'strings', lo: 46, hi: 65, v: 0.32 },
      bass: { instrument: 'strings', base: 34, pattern: 'whole', v: 0.4 },
      lines: [{ name: 'lead', instrument: 'lowChoir', v: 0.5, notes: 'Gb2:3 Db3:3 | Eb3:3 Gb3:3 | F3:3 C3:3 | A2:6' }],
    }),
  ],
};

// ------------------------------------------------------------ combat: the hammer, two levels of one track

const gallop: readonly Hit[] = [[0, 'drum', 0, 0.8], [2, 'drum', 1, 0.4], [3, 'drum', 0, 0.6], [5, 'drum', 1, 0.45], [3, 'anvil', 1, 0.3]];
const gallopFill: readonly Hit[] = [[0, 'drum', 0, 0.8], [1, 'drum', 1, 0.4], [2, 'drum', 1, 0.45], [3, 'drum', 0, 0.65], [4, 'drum', 1, 0.5], [5, 'drum', 1, 0.6], [0, 'anvil', 0, 0.28]];
const combatBed = {
  pad: { instrument: 'lowChoir', lo: 46, hi: 62, v: 0.32, layer: 'reflection' },
  bass: { instrument: 'pizz', base: 36, pattern: 'rootFifth', v: 0.52 },
  arpeggio: { instrument: 'timpani', lo: 35, perBeat: 1 / 3, v: 0.3, layer: 'reflection', patterns: [[0, 1]] },
  ostinato: { instrument: 'strings', lo: 46, perBeat: 1, v: 0.5, length: 0.4, layer: 'action', patterns: [[0, 0, 1, 0, 0, 2], [0, 1, 0, 2, 1, 0]] },
  drums: { bar: gallop, fill: gallopFill, layer: 'action' },
} as const;

const combat: ThemeDef = {
  id: 'combat', track: 'bear/combat', hall: 'cave', send: 0.18, gain: 1.4, lowCut: 100,
  form: [0, 1, 2, 3, 4, 5],
  sections: [
    section('A', 216, 6, 34, 'aeolian', 'Bb5 | Bb5 | Gb5 | Ab5 | Bb5 | Bb5 | Eb5 | F5', { ...combatBed,
      lines: [
        { name: 'lead', instrument: 'brass', v: 0.66, layer: 'action', notes: 'Bb3:3 F4:3 | Eb4:3 C4:3 | Db4:2 Eb4:1 F4:3 | Eb4:3 Ab3:3 | Bb3:3 F4:3 | Gb4:2 F4:1 Eb4:3 | Gb4:2 F4:1 Eb4:2 Db4:1 | C4:6' },
        { name: 'organum', instrument: 'brass', v: 0.5, layer: 'action', notes: 'Eb3:3 Bb3:3 | Ab3:3 F3:3 | Gb3:2 Ab3:1 Bb3:3 | Ab3:3 Db3:3 | Eb3:3 Bb3:3 | Db4:2 Bb3:1 Ab3:3 | Db4:2 Bb3:1 Ab3:2 Gb3:1 | F3:6' },
        { name: 'calm', instrument: 'horn', v: 0.36, layer: 'reflection', plain: true, notes: 'Bb3:6 | F3:6 | r:6 | r:6 | r:6 | r:6 | r:6 | r:6' },
      ],
    }),
    section('A2', 216, 6, 34, 'aeolian', 'Bb5 | Bb5 | Gb5 | Ab5 | Bb5 | Bb5 | Eb5 | F5', { ...combatBed,
      lines: [
        { name: 'lead', instrument: 'strings', v: 0.6, layer: 'action', notes: 'F4:2 Bb4:1 Db5:3 | C5:2 Bb4:1 Ab4:3 | Gb4:2 Ab4:1 Bb4:3 | C5:3 Eb5:3 | Db5:2 C5:1 Bb4:3 | F5:2 Eb5:1 Db5:3 | Eb5:2 Db5:1 C5:2 Bb4:1 | C5:6' },
        { name: 'call', instrument: 'lowChoir', v: 0.5, layer: 'action', cycles: 'odd', notes: 'r:6 | Bb2:3 F3:3 | r:6 | Ab2:3 Eb3:3 | r:6 | Bb2:3 F3:3 | r:6 | C3:6' },
      ],
    }),
    section('B', 216, 6, 34, 'aeolian', 'Db5 | Ab5 | Gb5 | Db5 | Bbm | Gb5 | Ab5 | F5', { ...combatBed,
      lines: [
        { name: 'lead', instrument: 'horn', v: 0.62, layer: 'action', notes: 'Db4:3 Ab4:3 | Gb4:2 F4:1 Eb4:3 | Db4:2 Eb4:1 Gb4:3 | F4:6 | Db4:2 F4:1 Bb4:3 | Ab4:2 Gb4:1 F4:3 | Eb4:2 F4:1 Ab4:3 | C4:6' },
        { name: 'calm', instrument: 'horn', v: 0.32, layer: 'reflection', plain: true, notes: 'r:6 | r:6 | r:6 | r:6 | Db4:6 | Bb3:6 | r:6 | r:6' },
      ],
    }),
    // no melody: ostinato and drums on action, the choir and the timpani on reflection
    section('C', 216, 6, 34, 'aeolian', 'Bb5 | Gb5 | Bb5 | Ab5 | Bb5 | Gb5 | Eb5 | F5', { ...combatBed }),
    // the bridge drops the gallop for an even four in C minor: the choir chants over timpani
    section('bridge', 92, 4, 36, 'aeolian', 'C5 | Ab5 | Bb5 | C5 | Eb5 | Bb5 | Ab5 | G5', {
      pad: { instrument: 'lowChoir', lo: 48, hi: 64, v: 0.3, layer: 'reflection' },
      bass: { instrument: 'pizz', base: 36, pattern: 'half', v: 0.52 },
      drums: { bar: [[0, 'drum', 0, 0.75], [2, 'timpani', 48, 0.45], [3, 'drum', 1, 0.4]], layer: 'action' },
      lines: [
        { name: 'chant', instrument: 'lowChoir', v: 0.6, layer: 'action', notes: 'C3:2 G3:2 | Ab2:2 Eb3:2 | Bb2:2 F3:2 | C3:4 | Eb3:2 Bb3:2 | F3:2 D3:2 | Eb3:2 C3:2 | G2:4' },
        { name: 'brass', instrument: 'brass', v: 0.55, layer: 'action', notes: 'G3:2 D4:2 | Eb3:2 Bb3:2 | F3:2 C4:2 | G3:4 | Bb3:2 F4:2 | C4:2 Bb3:2 | Bb3:2 G3:2 | D3:4' },
        { name: 'calm', instrument: 'horn', v: 0.34, layer: 'reflection', plain: true, notes: 'C4:4 | Eb4:4 | r:4 | r:4 | r:4 | r:4 | r:4 | r:4' },
      ],
    }),
    section('return', 180, 6, 34, 'aeolian', 'Gb5 | Ab5 | Eb5 | F5', { ramp: { fromBar: 0, bpm: 216 },
      pad: { instrument: 'lowChoir', lo: 46, hi: 62, v: 0.3, layer: 'reflection' },
      bass: { instrument: 'pizz', base: 36, pattern: 'half', v: 0.52 },
      drums: { bar: [[0, 'drum', 0, 0.7], [3, 'drum', 0, 0.55], [4, 'drum', 1, 0.4], [5, 'drum', 1, 0.5]], fill: gallopFill, layer: 'action' },
      lines: [{ name: 'lead', instrument: 'brass', v: 0.6, notes: 'Gb3:3 Db4:3 | Ab3:3 Eb4:3 | Eb4:2 Db4:1 C4:3 | F3:3 C4:3' }],
    }),
  ],
};

// ------------------------------------------------------------ boss: the granite throne, G aeolian at full drive

const throne: readonly Hit[] = [[0, 'drum', 0, 0.85], [1, 'drum', 1, 0.35], [2, 'drum', 1, 0.4], [3, 'drum', 0, 0.7], [4, 'drum', 1, 0.35], [5, 'drum', 1, 0.45], [3, 'anvil', 1, 0.35]];
const throneFill: readonly Hit[] = [[0, 'drum', 0, 0.85], [1, 'drum', 1, 0.45], [2, 'drum', 1, 0.5], [3, 'drum', 0, 0.75], [4, 'drum', 1, 0.55], [5, 'drum', 1, 0.65], [3, 'cymbal', 1, 0.5], [0, 'anvil', 0, 0.3]];
const bossBed = {
  pad: { instrument: 'lowChoir', lo: 43, hi: 62, v: 0.42 },
  bass: { instrument: 'pizz', base: 36, pattern: 'rootFifth', v: 0.56, layer: 'action' },
  arpeggio: { instrument: 'timpani', lo: 35, perBeat: 1 / 3, v: 0.34, layer: 'reflection', patterns: [[0, 1]] },
  ostinato: { instrument: 'strings', lo: 43, perBeat: 1, v: 0.5, length: 0.32, layer: 'action', patterns: [[0, 0, 1, 0, 0, 2], [0, 0, 2, 0, 1, 0]] },
  drums: { bar: throne, fill: throneFill, layer: 'action' },
} as const;

const boss: ThemeDef = {
  id: 'boss', track: 'bear/boss', hall: 'cave', send: 0.2, gain: 1.05, lowCut: 96,
  form: [0, 1, 2, 3, 4, 5, 6], loopFrom: 1,
  sections: [
    // the entry (the Raven's chiefs in the galleries): five seconds of timpani under the motif in low fifths
    section('entry', 144, 6, 43, 'aeolian', 'G5 | Eb5 D5', {
      pad: { instrument: 'lowChoir', lo: 43, hi: 62, v: 0.4 },
      drums: { bar: [[0, 'timpani', 43, 0.7], [1, 'timpani', 43, 0.5], [2, 'timpani', 43, 0.55], [3, 'timpani', 43, 0.65], [4, 'timpani', 43, 0.7], [5, 'timpani', 43, 0.8], [3, 'cymbal', 1, 0.6]] },
      lines: [
        { name: 'lead', instrument: 'brass', v: 0.74, notes: 'G2:3 D3:3 | C3:3 A2:3' },
        { name: 'fifth', instrument: 'brass', v: 0.6, notes: 'D3:3 A3:3 | G3:3 D3:3' },
      ],
    }),
    section('A', 252, 6, 43, 'aeolian', 'G5 | Eb5 | F5 | G5 | Bb5 | F5 | Eb5 | D5', { ...bossBed,
      lines: [
        { name: 'lead', instrument: 'brass', v: 0.74, layer: 'action', notes: 'G3:3 D4:3 | C4:3 A3:3 | F4:3 C4:3 | D4:2 Bb3:1 G3:3 | Bb3:3 F4:3 | F4:2 Eb4:1 D4:3 | Eb4:2 D4:1 C4:2 Bb3:1 | D4:6' },
        { name: 'calm', instrument: 'lowChoir', v: 0.44, layer: 'reflection', plain: true, notes: 'G2:6 | D3:6 | r:6 | r:6 | r:6 | r:6 | r:6 | r:6' },
      ],
    }),
    section('A2', 252, 6, 43, 'aeolian', 'G5 | Eb5 | F5 | G5 | Bb5 | F5 | Eb5 | D5', { ...bossBed,
      lines: [
        { name: 'lead', instrument: 'strings', v: 0.6, layer: 'action', notes: 'G4:3 D5:3 | C5:3 A4:3 | F5:3 C5:3 | D5:2 Bb4:1 G4:3 | Bb4:3 F5:3 | F5:2 Eb5:1 D5:3 | Eb5:2 D5:1 C5:2 Bb4:1 | D5:6' },
        { name: 'call', instrument: 'brass', v: 0.58, layer: 'action', notes: 'r:6 | G3:3 D4:3 | r:6 | F3:3 C4:3 | r:6 | Bb3:3 F4:3 | r:6 | D3:6' },
      ],
    }),
    section('B', 252, 6, 43, 'aeolian', 'Eb5 | Bb5 | Cm | D5 | Eb5 | Bb5 | C5 | D5', { ...bossBed,
      lines: [
        { name: 'lead', instrument: 'horn', v: 0.66, layer: 'action', notes: 'Eb4:3 Bb4:3 | D4:2 C4:1 Bb3:3 | C4:2 Eb4:1 G4:3 | F#4:6 | Eb4:2 G4:1 Bb4:3 | D5:2 C5:1 Bb4:3 | C5:2 Bb4:1 G4:3 | A4:6' },
      ],
    }),
    // no melody: the drive alone
    section('C', 252, 6, 43, 'aeolian', 'G5 | Eb5 | G5 | F5 | G5 | Eb5 | C5 | D5', { ...bossBed, pad: { instrument: 'lowChoir', lo: 46, hi: 65, v: 0.36, layer: 'reflection' } }),
    // the bridge brings the Bear's own key back in an even four: the choir sings the motif over the drums
    section('bridge', 120, 4, 34, 'aeolian', 'Bb5 | Gb5 | Ab5 | Bb5 | Db5 | Ab5 | Gb5 | F5', {
      pad: { instrument: 'strings', lo: 46, hi: 65, v: 0.3 },
      bass: { instrument: 'pizz', base: 36, pattern: 'half', v: 0.56 },
      drums: { bar: [[0, 'drum', 0, 0.8], [1, 'drum', 1, 0.35], [2, 'drum', 0, 0.6], [3, 'drum', 1, 0.4], [3, 'anvil', 1, 0.35]], layer: 'action' },
      lines: [
        { name: 'chant', instrument: 'lowChoir', v: 0.64, notes: 'Bb2:2 F3:2 | Eb3:2 C3:2 | Ab2:2 Eb3:2 | F3:4 | Db3:2 Ab3:2 | Eb3:2 C3:2 | Db3:2 Bb2:2 | C3:4' },
        { name: 'brass', instrument: 'brass', v: 0.56, notes: 'F3:2 C4:2 | Bb3:2 Gb3:2 | Eb3:2 Bb3:2 | C4:4 | Ab3:2 Eb4:2 | Bb3:2 Gb3:2 | Ab3:2 F3:2 | F3:4' },
      ],
    }),
    section('return', 216, 6, 43, 'aeolian', 'Eb5 | Eb5 D5 | Eb5 | D5', { ramp: { fromBar: 0, bpm: 252 },
      pad: { instrument: 'lowChoir', lo: 43, hi: 62, v: 0.42 },
      bass: { instrument: 'pizz', base: 36, pattern: 'half', v: 0.56 },
      drums: { bar: [[0, 'drum', 0, 0.75], [3, 'drum', 0, 0.6], [4, 'drum', 1, 0.5], [5, 'drum', 1, 0.6]], fill: throneFill, layer: 'action' },
      lines: [{ name: 'lead', instrument: 'brass', v: 0.7, notes: 'Eb3:3 Bb3:3 | Eb3:3 D3:3 | G3:2 Bb3:1 Eb4:3 | D4:3 A3:3' }],
    }),
  ],
};

/** Borin's own entry on the terrace of his hall: three hammer strokes, the men's choir and the brass name the motif. */
const borin = withEntry(boss, 'bear/boss@borin', section('entry', 132, 6, 43, 'aeolian', 'G5 | Eb5 D5', {
  pad: { instrument: 'lowChoir', lo: 38, hi: 58, v: 0.46 },
  drums: { bar: [[0, 'anvil', 0, 0.4], [0, 'drum', 0, 0.8], [2, 'anvil', 0, 0.3], [3, 'drum', 0, 0.7], [4, 'anvil', 0, 0.35], [5, 'timpani', 38, 0.6]] },
  lines: [
    { name: 'chant', instrument: 'lowChoir', v: 0.62, notes: 'G2:3 D3:3 | C3:3 A2:3' },
    { name: 'lead', instrument: 'brass', v: 0.7, notes: 'G3:3 D4:3 | C4:3 A3:3' },
  ],
}));

export const BEAR_MUSIC: PartMusic = {
  tracks: { map, refuge, tension, drama, combat, boss },
  scenes: { bear_hall_terrace: { boss: borin } },
};

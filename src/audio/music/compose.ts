/**
 * The generator (pure, seeded): turns a track and a pass number into the note events of one section. Written lines
 * return on every pass, ornamented on odd rounds of the form; the accompaniment is re-voiced and re-patterned from a
 * seed, so no two rounds are identical while the same pass always sounds the same (reproducible renders).
 */
import { chordPitches, MODES, parseChord, parsePitch, pc, seededRandom, voiceChord, type Chord } from './theory';
import { passCycle, sectionAt, sectionBars, sectionIndexAt, type Instrument, type Layer, type Line, type Section, type ThemeDef } from './themes';

export interface MusicEvent {
  /** Start in beats from the section start, and duration in beats. */
  beat: number;
  beats: number;
  m: number;
  v: number;
  instrument: Instrument;
  /** Voice events with the same line form one phrase. */
  line: string;
  /** Reflection or Action of a combat track; shared by both when absent. */
  layer?: Layer;
}

/** One chord of a section; a written silence has no chord. */
export interface HarmonySlot { beat: number; beats: number; chord: Chord | null }

export interface WrittenNote { beat: number; beats: number; m: number }

const clamp01 = (x: number): number => Math.max(0.05, Math.min(1, x));
const hash = (s: string): number => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
const CACHE = new Map<string, readonly WrittenNote[]>();

/** The chords of a section, bar by bar. */
export function harmonyOf(section: Section): HarmonySlot[] {
  const slots: HarmonySlot[] = [];
  section.chords.split('|').forEach((bar, index) => {
    const symbols = bar.trim().split(/\s+/);
    const beats = section.beatsPerBar / symbols.length;
    symbols.forEach((symbol, i) => slots.push({ beat: index * section.beatsPerBar + i * beats, beats, chord: symbol === 'r' ? null : parseChord(symbol) }));
  });
  return slots;
}

/** A written line as notes; `beatsPerBar` lays its bars out, so a short bar shows up in the tests. */
export function parseLine(notes: string, beatsPerBar: number): readonly WrittenNote[] {
  const key = `${beatsPerBar}/${notes}`;
  const cached = CACHE.get(key);
  if (cached) return cached;
  const out: WrittenNote[] = [];
  notes.split('|').forEach((bar, index) => {
    let beat = index * beatsPerBar;
    for (const token of bar.trim().split(/\s+/)) {
      const [name, length] = token.split(':');
      const beats = Number(length);
      if (name !== 'r') out.push({ beat, beats, m: parsePitch(name!) });
      beat += beats;
    }
  });
  CACHE.set(key, out);
  return out;
}

/** Chord tones ascending from `lo`, `count` of them. */
function ladder(chord: Chord, lo: number, count: number): number[] {
  const classes = new Set(chord.intervals.map((i) => pc(chord.root + i)));
  const out: number[] = [];
  for (let m = lo; out.length < count && m < lo + 48; m++) if (classes.has(pc(m))) out.push(m);
  return out;
}

/** The chord root placed in the octave starting at `base`. */
const rootNear = (root: number, base: number): number => base + ((root - pc(base) + 12) % 12);

/** Four voices at most: a ninth chord gives up its fifth, which the bass implies. */
const voicingTones = (chord: Chord): number[] => chordPitches(chord).slice(0, 4);

/** Odd rounds: a passing scale tone between two notes a third apart (the written line stays recognisable). */
function ornament(notes: readonly WrittenNote[], section: Section): WrittenNote[] {
  const scale = MODES[section.mode].map((step) => pc(section.tonic + step));
  const out: WrittenNote[] = [];
  notes.forEach((note, i) => {
    const next = notes[i + 1];
    const gap = next ? next.m - note.m : 0;
    const passing = Math.abs(gap) === 3 || Math.abs(gap) === 4 ? [1, 2].map((s) => note.m + Math.sign(gap) * s).find((m) => scale.includes(pc(m))) : undefined;
    if (next && passing !== undefined && note.beats >= 1 && next.beat === note.beat + note.beats) {
      out.push({ ...note, beats: note.beats - 0.5 }, { beat: note.beat + note.beats - 0.5, beats: 0.5, m: passing });
    } else out.push(note);
  });
  return out;
}

export function composePass(theme: ThemeDef, pass: number, seed = 1): MusicEvent[] {
  const section = sectionAt(theme, pass);
  const cycle = passCycle(theme, pass);
  // a plateau's track seeds from its own name; the Lion's tracks have none and seed exactly as before
  const rng = seededRandom((hash(`${theme.track ?? theme.id}/${sectionIndexAt(theme, pass)}`) ^ Math.imul(pass + 1, 0x9e3779b1) ^ seed) >>> 0);
  const bpb = section.beatsPerBar;
  const bars = sectionBars(section);
  const harmony = harmonyOf(section);
  const events: MusicEvent[] = [];
  const swung = (beat: number) => (section.swing && Math.abs(beat % 1 - 0.5) < 1e-6 ? beat + section.swing : beat);
  const human = (beat: number) => swung(beat) + (beat % 1 === 0 && beat % bpb === 0 ? 0 : (rng() - 0.5) * 0.03);
  const vary = (v: number) => clamp01(v + (rng() - 0.5) * 0.12);

  // pad: one line per voice, tied from chord to chord
  if (section.pad) {
    const pad = section.pad;
    let previous: number[] | null = null;
    for (const slot of harmony) {
      if (!slot.chord) { previous = null; continue; }
      const voicing = voiceChord(voicingTones(slot.chord), pad.lo, pad.hi, previous);
      previous = voicing;
      voicing.forEach((m, i) => events.push({ beat: slot.beat, beats: slot.beats, m, v: pad.v, instrument: pad.instrument, line: `pad-${i}`, layer: pad.layer }));
    }
  }

  // bass
  if (section.bass) {
    const b = section.bass;
    harmony.forEach((slot, i) => {
      if (!slot.chord) return;
      const r = rootNear(slot.chord.root, b.base);
      const fifth = slot.chord.intervals.includes(7) ? rootNear(pc(slot.chord.root + 7), b.base) : r;
      const f = fifth < r ? fifth + 12 : fifth;
      const third = rootNear(pc(slot.chord.root + slot.chord.intervals[1]!), b.base);
      const span = slot.beats, half = span / 2;
      const next = harmony[i + 1]?.chord ?? harmony[0]!.chord;
      const hits: Array<[number, number, number]> = b.pattern === 'whole' ? [[0, r, span]]
        : b.pattern === 'half' ? [[0, r, half], [half, r, half]]
          : b.pattern === 'rootFifth' ? [[0, r, half], [half, rng() < 0.7 ? f : r, half]]
            : b.pattern === 'pulse' ? Array.from({ length: Math.round(span * 2) }, (_, n) => [n / 2, r, 0.5] as [number, number, number])
              : b.pattern === 'syncopated' && span >= 4 ? [[0, r, 1.5], [1.5, f, 1], [2.5, r, 1.5]]
                : b.pattern === 'walk' && span >= 4 ? [[0, r, 1], [1, third, 1], [2, f, 1], [3, (next ? rootNear(next.root, b.base) : r) - 1, 1]]
                  : [[0, r, span]];
      for (const [beat, m, beats] of hits) events.push({ beat: slot.beat + beat, beats, m, v: vary(b.v), instrument: b.instrument, line: 'bass', layer: b.layer });
    });
  }

  // arpeggio (sampled, rings freely)
  if (section.arpeggio) {
    const a = section.arpeggio;
    let pattern = a.patterns[0]!;
    for (const slot of harmony) {
      if (!slot.chord) continue;
      if (Math.floor(slot.beat / bpb) % 2 === 0 && slot.beat % bpb === 0) pattern = a.patterns[Math.floor(rng() * a.patterns.length)]!;
      const tones = ladder(slot.chord, a.lo, 7);
      const steps = Math.round(slot.beats * a.perBeat);
      for (let i = 0; i < steps; i++) {
        const m = tones[pattern[i % pattern.length]! % tones.length]!;
        const accent = i % a.perBeat === 0 ? 1 : 0.82;
        events.push({ beat: human(slot.beat + i / a.perBeat), beats: 2 / a.perBeat, m, v: vary(a.v * accent), instrument: a.instrument, line: 'arpeggio', layer: a.layer });
      }
    }
  }

  // ostinato (one detached voice line)
  if (section.ostinato) {
    const o = section.ostinato;
    harmony.forEach((slot, index) => {
      if (!slot.chord) return;
      const pattern = o.patterns[(index + pass) % o.patterns.length]!;
      const tones = ladder(slot.chord, o.lo, 4);
      const steps = Math.round(slot.beats * o.perBeat);
      for (let i = 0; i < steps; i++) {
        const m = tones[pattern[i % pattern.length]! % tones.length]!;
        events.push({ beat: slot.beat + i / o.perBeat, beats: o.length, m, v: clamp01(o.v * (i % o.perBeat === 0 ? 1 : 0.8)), instrument: o.instrument, line: 'ostinato', layer: o.layer });
      }
    });
  }

  // written lines: melody, answers, calls; odd rounds ornament them
  for (const line of section.lines ?? []) {
    if ((line.cycles === 'odd' && cycle % 2 === 0) || (line.cycles === 'even' && cycle % 2 === 1)) continue;
    pushLine(events, line, section, cycle);
  }

  // percussion: a fill on the last bar most passes
  if (section.drums) {
    const { bar, fill, layer } = section.drums;
    for (let index = 0; index < bars; index++) {
      const hits = fill && index === bars - 1 && rng() < 0.65 ? fill : bar;
      for (const [beat, instrument, variant, v] of hits) {
        events.push({ beat: human(index * bpb + beat), beats: 1, m: variant, v: vary(v), instrument, line: 'drums', layer });
      }
    }
  }

  return events.sort((a, b) => a.beat - b.beat || a.line.localeCompare(b.line));
}

function pushLine(events: MusicEvent[], line: Line, section: Section, cycle: number): void {
  const written = parseLine(line.notes, section.beatsPerBar);
  for (const { beat, beats, m } of cycle % 2 === 1 && !line.plain ? ornament(written, section) : written) {
    events.push({ beat, beats, m, v: clamp01(line.v * (beat % section.beatsPerBar === 0 ? 1.05 : 0.95)), instrument: line.instrument, line: line.name, layer: line.layer });
  }
}

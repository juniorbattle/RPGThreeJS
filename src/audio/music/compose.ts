/**
 * The generator (pure, seeded): turns a theme and a pass number into note events. The written melody returns on
 * every pass, ornamented on odd passes and resting on some; the accompaniment is re-voiced and re-patterned from a
 * seed, so no two passes are identical while the same pass always sounds the same (reproducible renders).
 */
import type { SampledInstrument } from './bank';
import { degreeToMidi, pc, seededRandom, triad, voiceChord } from './theory';
import type { MelodyNote, ThemeDef } from './themes';
import type { VoiceInstrument } from './voices';

export interface MusicEvent {
  /** Start in beats from the pass start, and duration in beats. */
  beat: number;
  beats: number;
  m: number;
  v: number;
  instrument: SampledInstrument | VoiceInstrument;
  /** Voice events with the same line form one phrase. */
  line: string;
}

const clamp01 = (x: number): number => Math.max(0.05, Math.min(1, x));
const hash = (s: string): number => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);

/** The chord of a bar as MIDI pitches (root position from the theme tonic). */
export function chordOfBar(theme: ThemeDef, bar: number): number[] {
  const degree = theme.progression[bar % theme.progression.length]!;
  const [root, third, fifth] = triad(theme.tonic, theme.mode, degree);
  return [root, theme.raisedThird?.includes(bar) ? third + 1 : third, fifth];
}

/** Chord tones ascending from `lo`, `count` of them. */
function ladder(chord: readonly number[], lo: number, count: number): number[] {
  const classes = new Set(chord.map(pc));
  const out: number[] = [];
  for (let m = lo; out.length < count && m < lo + 48; m++) if (classes.has(pc(m))) out.push(m);
  return out;
}

/** The chord root placed in the octave starting at `base`. */
const rootNear = (root: number, base: number): number => base + ((pc(root) - pc(base) + 12) % 12);

/** Odd passes: a passing tone between two notes a third apart (the written melody stays recognisable). */
function ornament(notes: readonly MelodyNote[]): MelodyNote[] {
  const out: MelodyNote[] = [];
  notes.forEach((note, i) => {
    const next = notes[i + 1];
    const [bar, beat, degree, beats] = note;
    if (next && Math.abs(next[2] - degree) === 2 && beats >= 1 && next[0] * 100 + next[1] === bar * 100 + beat + beats) {
      out.push([bar, beat, degree, beats - 0.5], [bar, beat + beats - 0.5, (degree + next[2]) / 2, 0.5]);
    } else out.push(note);
  });
  return out;
}

export function composePass(theme: ThemeDef, pass: number, seed = 1): MusicEvent[] {
  const rng = seededRandom((hash(theme.id) ^ Math.imul(pass + 1, 0x9e3779b1) ^ seed) >>> 0);
  const bpb = theme.beatsPerBar;
  const events: MusicEvent[] = [];
  const human = (beat: number) => beat + (beat % 1 === 0 && beat % bpb === 0 ? 0 : (rng() - 0.5) * 0.03);
  const vary = (v: number) => clamp01(v + (rng() - 0.5) * 0.12);

  // pad: one line per voice, tied from bar to bar
  if (theme.pad) {
    let previous: number[] | null = null;
    for (let bar = 0; bar < theme.bars; bar++) {
      const voicing = voiceChord(chordOfBar(theme, bar), theme.pad.lo, theme.pad.hi, previous);
      previous = voicing;
      voicing.forEach((m, i) => events.push({ beat: bar * bpb, beats: bpb, m, v: theme.pad!.velocity, instrument: theme.pad!.instrument, line: `pad-${i}` }));
    }
  }

  // bass
  if (theme.bass) {
    const b = theme.bass;
    const base = theme.tonic + b.octave;
    for (let bar = 0; bar < theme.bars; bar++) {
      const [root, , fifth] = chordOfBar(theme, bar);
      const r = rootNear(root!, base);
      const f = rootNear(fifth!, base) < r ? rootNear(fifth!, base) + 12 : rootNear(fifth!, base);
      const half = bpb / 2;
      const hits: Array<[number, number, number]> = b.pattern === 'whole' ? [[0, r, bpb]]
        : b.pattern === 'half' ? [[0, r, half], [half, r, half]]
          : [[0, r, half], [half, rng() < 0.7 ? f : r, half]];
      for (const [beat, m, beats] of hits) events.push({ beat: bar * bpb + beat, beats, m, v: vary(b.velocity), instrument: b.instrument, line: 'bass' });
    }
  }

  // arpeggio (sampled, rings freely)
  if (theme.arpeggio) {
    const a = theme.arpeggio;
    let pattern = a.patterns[0]!;
    for (let bar = 0; bar < theme.bars; bar++) {
      if (bar % 2 === 0) pattern = a.patterns[Math.floor(rng() * a.patterns.length)]!;
      const tones = ladder(chordOfBar(theme, bar), a.lo, 7);
      const steps = bpb * a.perBeat;
      for (let i = 0; i < steps; i++) {
        const m = tones[pattern[i % pattern.length]! % tones.length]!;
        const accent = i % a.perBeat === 0 ? 1 : 0.82;
        events.push({ beat: human(bar * bpb + i / a.perBeat), beats: 2 / a.perBeat, m, v: vary(a.velocity * accent), instrument: a.instrument, line: 'arpeggio' });
      }
    }
  }

  // ostinato (one detached voice line)
  if (theme.ostinato) {
    const o = theme.ostinato;
    for (let bar = 0; bar < theme.bars; bar++) {
      const pattern = o.patterns[(bar + pass) % o.patterns.length]!;
      const tones = ladder(chordOfBar(theme, bar), o.lo, 4);
      const steps = bpb * o.perBeat;
      for (let i = 0; i < steps; i++) {
        const m = tones[pattern[i % pattern.length]! % tones.length]!;
        events.push({ beat: bar * bpb + i / o.perBeat, beats: o.length, m, v: clamp01(o.velocity * (i % o.perBeat === 0 ? 1 : 0.8)), instrument: o.instrument, line: 'ostinato' });
      }
    }
  }

  // melody: written, ornamented on odd passes, resting every `restEvery` passes
  const mel = theme.melody;
  const resting = mel.restEvery !== undefined && pass % mel.restEvery === mel.restEvery - 1;
  if (!resting) {
    for (const [bar, beat, degree, beats] of pass % 2 === 1 ? ornament(mel.notes) : mel.notes) {
      const whole = Math.floor(degree);
      const m = degreeToMidi(mel.root, theme.mode, whole) + (degree - whole >= 0.5 ? 1 : 0);
      events.push({ beat: bar * bpb + beat, beats, m, v: clamp01(mel.velocity * (beat === 0 ? 1.05 : 0.95)), instrument: mel.instrument, line: 'melody' });
    }
  }
  if (theme.counter && pass % 2 === 1) {
    const c = theme.counter;
    for (const [bar, beat, degree, beats] of c.notes) {
      events.push({ beat: bar * bpb + beat, beats, m: degreeToMidi(c.root, theme.mode, degree), v: c.velocity, instrument: c.instrument, line: 'counter' });
    }
  }

  // percussion: a fill on the last bar most passes, a crash into every pass after the first
  if (theme.drums) {
    for (let bar = 0; bar < theme.bars; bar++) {
      const hits = bar === theme.bars - 1 && rng() < 0.65 ? theme.drums.fill : theme.drums.bar;
      for (const [beat, instrument, variant, v] of hits) {
        const m = instrument === 'timpani' ? degreeToMidi(theme.tonic + 12, theme.mode, variant) : variant;
        events.push({ beat: human(bar * bpb + beat), beats: 1, m, v: vary(v), instrument, line: 'drums' });
      }
    }
    if (pass > 0 && (theme.id === 'combat' || theme.id === 'boss')) events.push({ beat: 0, beats: 1, m: 0, v: 0.5, instrument: 'cymbal', line: 'drums' });
  }

  return events.sort((a, b) => a.beat - b.beat || a.line.localeCompare(b.line));
}

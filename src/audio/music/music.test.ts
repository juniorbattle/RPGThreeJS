import { describe, expect, it } from 'vitest';
import { ambienceForScene } from './ambience';
import { choose, DEFS, plan, SAMPLED_INSTRUMENTS, type SampledInstrument } from './bank';
import { chordOfBar, composePass } from './compose';
import { harp, timpani, warDrum } from './instruments';
import { MUSIC_CONTEXTS, passSeconds, THEMES } from './themes';
import { degreeToMidi, voiceChord } from './theory';

const SAMPLED = new Set<string>(SAMPLED_INSTRUMENTS);

describe('music themes', () => {
  it('defines the five approved contexts with consistent bars and beats', () => {
    expect(MUSIC_CONTEXTS).toEqual(['title', 'map', 'dialogue', 'combat', 'boss']);
    for (const id of MUSIC_CONTEXTS) {
      const theme = THEMES[id];
      expect(theme.progression).toHaveLength(theme.bars);
      for (const [bar, beat, , beats] of theme.melody.notes) {
        expect(bar).toBeLessThan(theme.bars);
        expect(beat + beats).toBeLessThanOrEqual(theme.beatsPerBar + 1e-9);
      }
      expect(passSeconds(theme)).toBeGreaterThan(10);
      expect(passSeconds(theme)).toBeLessThan(40);
    }
  });

  it('places the melody root on the tonic class of each mode', () => {
    for (const id of MUSIC_CONTEXTS) {
      const theme = THEMES[id];
      expect((theme.melody.root - theme.tonic) % 12).toBe(0);
      if (theme.counter) expect((theme.counter.root - theme.tonic) % 12).toBe(0);
    }
  });
});

describe('the generator', () => {
  it('is reproducible for a given pass and varies from pass to pass', () => {
    for (const id of MUSIC_CONTEXTS) {
      expect(composePass(THEMES[id], 3)).toEqual(composePass(THEMES[id], 3));
      expect(composePass(THEMES[id], 0)).not.toEqual(composePass(THEMES[id], 1));
    }
  });

  it('keeps every event inside its pass and every pitch inside a playable range', () => {
    for (const id of MUSIC_CONTEXTS) {
      const theme = THEMES[id];
      const length = theme.bars * theme.beatsPerBar;
      for (let pass = 0; pass < 6; pass++) {
        for (const e of composePass(theme, pass)) {
          expect(e.beat).toBeGreaterThanOrEqual(-0.02);
          expect(e.beat).toBeLessThan(length);
          expect(e.v).toBeGreaterThan(0);
          expect(e.v).toBeLessThanOrEqual(1);
          if (SAMPLED.has(e.instrument)) {
            const def = DEFS[e.instrument as SampledInstrument];
            if (def.kind === 'notes') { expect(e.m).toBeGreaterThanOrEqual(def.from - 2); expect(e.m).toBeLessThanOrEqual(def.to + 2); }
          } else {
            expect(e.m).toBeGreaterThanOrEqual(26);
            expect(e.m).toBeLessThanOrEqual(96);
          }
        }
      }
    }
  });

  it('brings the written melody back, rests on its resting passes, and answers with the counter on odd passes', () => {
    const title = THEMES.title;
    const melody = (pass: number) => composePass(title, pass).filter((e) => e.line === 'melody');
    expect(melody(0)).toHaveLength(title.melody.notes.length);
    expect(melody(3)).toHaveLength(0);
    expect(melody(1).length).toBeGreaterThanOrEqual(title.melody.notes.length);
    const first = melody(0)[0]!;
    expect(first.m).toBe(degreeToMidi(title.melody.root, title.mode, title.melody.notes[0]![2]));
    const counter = (pass: number) => composePass(THEMES.combat, pass).filter((e) => e.line === 'counter').length;
    expect(counter(0)).toBe(0);
    expect(counter(1)).toBeGreaterThan(0);
  });

  it('raises the third where the theme asks for a major dominant', () => {
    const [root, third] = chordOfBar(THEMES.combat, 7);
    expect(third! - root!).toBe(4);
  });

  it('voices chords with smooth voice leading inside the range', () => {
    const first = voiceChord([50, 53, 57], 50, 69, null);
    const next = voiceChord([48, 52, 55], 50, 69, first);
    for (const m of [...first, ...next]) { expect(m).toBeGreaterThanOrEqual(50); expect(m).toBeLessThanOrEqual(69); }
    const motion = next.reduce((sum, m, i) => sum + Math.abs(m - first[i]!), 0);
    expect(motion).toBeLessThanOrEqual(6);
  });
});

describe('the sample bank and instruments', () => {
  it('plans a bounded bank and picks the nearest zone within two semitones', () => {
    const items = plan(SAMPLED_INSTRUMENTS);
    expect(items.length).toBeGreaterThan(20);
    expect(items.length).toBeLessThan(120);
    const zones = items.filter((i) => i.instrument === 'harp').map((i) => ({ root: i.root, layer: i.layer }));
    const choice = choose(zones, 'harp', 62, 0.4)!;
    expect(Math.abs(Math.log2(choice.rate) * 12)).toBeLessThanOrEqual(2 + 1e-9);
    expect(choose([], 'harp', 62, 0.4)).toBeNull();
  });

  it('computes finite, bounded, audible samples', () => {
    for (const data of [harp(32000, 62, 0.6), timpani(32000, 45, 0.8), warDrum(48000, 0)]) {
      let peak = 0;
      for (const x of data) { expect(Number.isFinite(x)).toBe(true); peak = Math.max(peak, Math.abs(x)); }
      expect(peak).toBeGreaterThan(0.2);
      expect(peak).toBeLessThanOrEqual(1);
    }
  });

  it('maps combat scenes to the arena ambience with the arena fallback', () => {
    expect(ambienceForScene('lion_sanctum')).toBe('lion_sanctum');
    expect(ambienceForScene('bois_clair_burning')).toBe('bois_clair_burning');
    expect(ambienceForScene('unknown_scene')).toBe('forest_route');
  });
});

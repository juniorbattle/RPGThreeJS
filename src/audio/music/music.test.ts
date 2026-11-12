import { describe, expect, it } from 'vitest';
import { ambienceForScene } from './ambience';
import { choose, DEFS, plan, SAMPLED_INSTRUMENTS, type SampledInstrument } from './bank';
import { composePass, harmonyOf, parseLine } from './compose';
import { harp, lute, pizzicato, drumKit, timpani, warDrum } from './instruments';
import { beatTime, formSeconds, MUSIC_CONTEXTS, passCycle, sectionAt, sectionBars, sectionBeats, sectionIndexAt, sectionSeconds, SEALS_MOTIF, THEMES, type MusicContextId, type Section } from './themes';
import { MODES, parseChord, parsePitch, pc, voiceChord } from './theory';

const SAMPLED = new Set<string>(SAMPLED_INSTRUMENTS);
const LOOPING = MUSIC_CONTEXTS.filter((id) => !THEMES[id].once);
const allSections = MUSIC_CONTEXTS.flatMap((id) => THEMES[id].sections.map((section) => ({ id, section })));

/** Scale degree of a pitch in a section's mode, or null outside it. */
function degreeOf(section: Section, m: number): number | null {
  const at = MODES[section.mode].findIndex((step) => pc(section.tonic + step) === pc(m));
  return at < 0 ? null : at;
}
function carriesMotif(section: Section): boolean {
  return (section.lines ?? []).some((line) => {
    const degrees = parseLine(line.notes, section.beatsPerBar).map((note) => degreeOf(section, note.m));
    return degrees.some((_, i) => SEALS_MOTIF.every((degree, k) => degrees[i + k] === degree));
  });
}

describe('the written music', () => {
  it('defines the nine approved contexts', () => {
    expect(MUSIC_CONTEXTS).toEqual(['title', 'map', 'refuge', 'tension', 'drama', 'combat', 'boss', 'victory', 'defeat']);
  });

  it('writes every chord and every line in whole bars', () => {
    for (const { id, section } of allSections) {
      const where = `${id}/${section.name}`;
      expect(harmonyOf(section).at(-1)!.beat + harmonyOf(section).at(-1)!.beats, where).toBe(sectionBeats(section));
      for (const line of section.lines ?? []) {
        const bars = line.notes.split('|');
        expect(bars, `${where}/${line.name}`).toHaveLength(sectionBars(section));
        for (const bar of bars) {
          const beats = bar.trim().split(/\s+/).reduce((sum, token) => sum + Number(token.split(':')[1]), 0);
          expect(beats, `${where}/${line.name}: ${bar}`).toBeCloseTo(section.beatsPerBar);
        }
      }
    }
  });

  it('runs the Seals motif through every track', () => {
    for (const id of MUSIC_CONTEXTS) expect(THEMES[id].sections.some(carriesMotif), id).toBe(true);
  });

  it('writes in every loop a bridge that changes tempo, key or metre, and a return prepared on its way home', () => {
    for (const id of LOOPING) {
      const theme = THEMES[id];
      const bridge = theme.sections.find((section) => section.name === 'bridge')!;
      const home = theme.sections.find((section) => section.name === 'A')!;
      expect(bridge, id).toBeTruthy();
      expect(bridge.bpm !== home.bpm || pc(bridge.tonic) !== pc(home.tonic) || bridge.mode !== home.mode || bridge.beatsPerBar !== home.beatsPerBar, id).toBe(true);
      expect(bridge.lines?.length ?? 0, `${id}: the bridge is written, not a key shift`).toBeGreaterThan(0);
      const last = theme.sections[theme.form.at(-1)!]!;
      const final = harmonyOf(last).filter((slot) => slot.chord).at(-1)!.chord!;
      const toHome = pc(final.root - home.tonic);
      // the dominant, or in the phrygian the chord a semitone above
      expect(toHome === 7 || (home.mode === 'phrygian' && toHome === 1), `${id}: the form ends on ${final.symbol}, home is ${pc(home.tonic)}`).toBe(true);
    }
  });

  it('gives combat and map about a minute and a half, with passages without melody', () => {
    for (const id of ['combat', 'map'] as const) {
      expect(formSeconds(THEMES[id]), id).toBeGreaterThan(80);
      expect(formSeconds(THEMES[id]), id).toBeLessThan(100);
      const silent = THEMES[id].sections.find((section) => !section.lines?.some((line) => line.layer !== 'reflection'));
      expect(silent, `${id}: a passage without melody`).toBeTruthy();
    }
  });

  it('no longer lets the flute lead the loops', () => {
    const lead = (id: MusicContextId) => THEMES[id].sections.find((section) => section.name === 'A')!.lines?.[0]?.instrument;
    expect(LOOPING.filter((id) => lead(id) === 'flute')).toEqual([]);
    expect(new Set(LOOPING.map(lead)).size).toBeGreaterThanOrEqual(4);
  });

  it('keeps fanfares within 8 seconds, the victory short enough not to leave the music behind, and the boss entry within 6', () => {
    for (const id of ['victory', 'defeat'] as const) {
      expect(THEMES[id].once, id).toBe(true);
      expect(sectionSeconds(THEMES[id].sections[0]!), id).toBeLessThan(7.3);
    }
    expect(sectionSeconds(THEMES.victory.sections[0]!)).toBeLessThan(4.5);
    const entry = THEMES.boss.sections[0]!;
    expect(entry.name).toBe('entry');
    expect(sectionSeconds(entry)).toBeLessThanOrEqual(6);
  });

  it('writes both levels into the combat tracks, from one form', () => {
    expect([...new Set(composePass(THEMES.combat, 0).map((event) => event.layer ?? 'shared'))].sort()).toEqual(['action', 'reflection', 'shared']);
    expect(new Set(composePass(THEMES.boss, 1).map((event) => event.layer ?? 'shared'))).toContain('action');
    for (const id of LOOPING.filter((theme) => theme !== 'combat' && theme !== 'boss')) {
      expect(composePass(THEMES[id], 0).every((event) => !event.layer), id).toBe(true);
    }
  });

  it('plays the boss entry once, then loops without it', () => {
    const boss = THEMES.boss;
    expect(sectionAt(boss, 0).name).toBe('entry');
    expect(sectionAt(boss, 1).name).toBe('A');
    expect(sectionAt(boss, boss.form.length).name).toBe('A');
    expect(sectionIndexAt(boss, boss.form.length - 1)).toBe(6);
    expect(passCycle(boss, boss.form.length)).toBe(1);
  });

  it('runs a written tempo change through the section', () => {
    const back = THEMES.combat.sections.find((section) => section.name === 'return')!;
    const flat = sectionBeats(back) * (60 / back.bpm);
    expect(sectionSeconds(back)).toBeLessThan(flat);
    expect(sectionSeconds(back)).toBeGreaterThan(sectionBeats(back) * (60 / back.ramp!.bpm));
    for (let beat = 1; beat < sectionBeats(back); beat++) expect(beatTime(back, beat)).toBeGreaterThan(beatTime(back, beat - 1));
  });

  it('parses written pitches and chords', () => {
    expect(parsePitch('A4')).toBe(69);
    expect(parsePitch('Bb3')).toBe(58);
    expect(parsePitch('F#5')).toBe(78);
    expect(parseChord('Bbmaj7')).toMatchObject({ root: 10, intervals: [0, 4, 7, 11] });
    expect(parseChord('E7')).toMatchObject({ root: 4, intervals: [0, 4, 7, 10] });
    expect(parseChord('F#m7b5').root).toBe(6);
    expect(() => parseChord('H7')).toThrow();
    expect(() => parseChord('Cwhat')).toThrow();
  });
});

describe('the generator', () => {
  it('is reproducible for a given pass and varies from round to round', () => {
    for (const id of MUSIC_CONTEXTS) {
      const theme = THEMES[id];
      expect(composePass(theme, 3)).toEqual(composePass(theme, 3));
      if (!theme.once) expect(composePass(theme, 1)).not.toEqual(composePass(theme, 1 + theme.form.length));
    }
  });

  it('keeps every event inside its section and every pitch inside a playable range', () => {
    for (const id of MUSIC_CONTEXTS) {
      const theme = THEMES[id];
      for (let pass = 0; pass < theme.form.length * 2; pass++) {
        const length = sectionBeats(sectionAt(theme, pass));
        for (const e of composePass(theme, pass)) {
          expect(e.beat, id).toBeGreaterThanOrEqual(-0.02);
          expect(e.beat, id).toBeLessThan(length + 0.1);
          expect(e.v).toBeGreaterThan(0);
          expect(e.v).toBeLessThanOrEqual(1);
          if (SAMPLED.has(e.instrument)) {
            const def = DEFS[e.instrument as SampledInstrument];
            if (def.kind === 'notes') { expect(e.m, `${id}/${e.instrument}`).toBeGreaterThanOrEqual(def.from - 2); expect(e.m, `${id}/${e.instrument}`).toBeLessThanOrEqual(def.to + 2); }
          } else {
            expect(e.m, `${id}/${e.instrument}`).toBeGreaterThanOrEqual(26);
            expect(e.m, `${id}/${e.instrument}`).toBeLessThanOrEqual(96);
          }
        }
      }
    }
  });

  it('writes silence where the score does', () => {
    const b = THEMES.drama.sections.find((section) => section.name === 'B')!;
    const silent = harmonyOf(b).filter((slot) => !slot.chord);
    expect(silent).toHaveLength(4);
    const events = composePass(THEMES.drama, 1);
    for (const slot of silent) expect(events.some((e) => e.beat >= slot.beat && e.beat < slot.beat + slot.beats), `bar at ${slot.beat}`).toBe(false);
  });

  it('brings a written line back and ornaments it on odd rounds', () => {
    const title = THEMES.title;
    const melody = (pass: number) => composePass(title, pass).filter((e) => e.line === 'lead');
    const written = parseLine(title.sections[0]!.lines![0]!.notes, 4);
    expect(melody(0).map((e) => e.m)).toEqual(written.map((note) => note.m));
    expect(melody(title.form.length).length).toBeGreaterThan(written.length);
  });

  it('answers with a call only on odd rounds', () => {
    const combat = THEMES.combat;
    const call = (pass: number) => composePass(combat, pass).filter((e) => e.line === 'call').length;
    expect(call(1)).toBe(0);
    expect(call(1 + combat.form.length)).toBeGreaterThan(0);
  });

  it('voices chords with smooth voice leading inside the range', () => {
    const first = voiceChord([50, 53, 57], 50, 69, null);
    const next = voiceChord([48, 52, 55], 50, 69, first);
    for (const m of [...first, ...next]) { expect(m).toBeGreaterThanOrEqual(50); expect(m).toBeLessThanOrEqual(69); }
    const motion = next.reduce((sum, m, i) => sum + Math.abs(m - first[i]!), 0);
    expect(motion).toBeLessThanOrEqual(6);
  });

  it('keeps pads to three or four voices on extended chords', () => {
    for (const id of ['map', 'refuge', 'title'] as MusicContextId[]) {
      const lines = new Set(composePass(THEMES[id], 2).filter((e) => e.line.startsWith('pad-')).map((e) => e.line));
      expect(lines.size, id).toBeGreaterThanOrEqual(3);
      expect(lines.size, id).toBeLessThanOrEqual(4);
    }
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
    for (const data of [harp(32000, 62, 0.6), lute(32000, 55, 0.5), pizzicato(32000, 52, 0.7), timpani(32000, 45, 0.8), warDrum(48000, 0), drumKit(48000, 0), drumKit(48000, 1), drumKit(48000, 2)]) {
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
    expect(ambienceForScene('map')).toBe('map');
    expect(ambienceForScene('refuge')).toBe('refuge');
    // the Bear's arenas borrow existing beds: no new sound before the operator listens (OD-2026-11-01-B)
    expect(ambienceForScene('bear_mountain_pass')).toBe('forest_route');
    expect(ambienceForScene('bear_mine_galleries')).toBe('lion_sanctum');
    expect(ambienceForScene('bear_hall_terrace')).toBe('lion_sanctum');
  });
});

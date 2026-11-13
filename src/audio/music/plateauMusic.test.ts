import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TABLE_CUE_IDS } from '../../ui/GameSoundCatalog';
import { POST_DEMO_SIGNATURE_SKETCHES } from '../postDemoSignatureSketches';
import { ALL_SAMPLED_INSTRUMENTS, compute, DEFS, plan, SAMPLED_INSTRUMENTS, type SampledInstrument } from './bank';
import { composePass, harmonyOf, parseLine } from './compose';
import { HALLS } from './hall';
import { anvil, bell, dulcimer, goblet, zill } from './instruments';
import { lionFingerprint } from './lionFingerprint';
import { gameMusicWhere, musicPartOf, MUSIC_PARTS, PLATEAU_MUSIC_IN_GAME } from './parts';
import { PART_MUSIC, plateauTracks, trackFor } from './plateauTracks';
import { OWN_CONTEXTS } from './plateaux/score';
import { formSeconds, SEALS_MOTIF, sectionAt, sectionBars, sectionBeats, sectionSeconds, THEMES, type Section, type ThemeDef } from './themes';
import { MODES, pc } from './theory';
import { PROFILES } from './voices';

/**
 * The Lion's music as it stood before the plateaux's sketches (commit 3be080ab): the written tracks and two rounds of
 * what the generator makes of them, the voice profiles, every computed sample and every room.
 */
const LION_FINGERPRINT: Readonly<Record<string, string>> = {
  'track:title': '5ecb9ee152e6fe51', 'track:map': '3708468c7e0e157a', 'track:refuge': '615bc65f2a46a507',
  'track:tension': '945519100bc972ea', 'track:drama': '5f9c0c494c5a85ab', 'track:combat': 'ac2c2f67aecc4c52',
  'track:boss': '51047e2c2a536ff7', 'track:victory': 'c8c45558edf6583a', 'track:defeat': '1b8846266c26890d',
  'voice:strings': 'c1cc511d', 'voice:flute': '67e977a6', 'voice:reed': '9d1f3337', 'voice:horn': '3e80e6fb', 'voice:brass': '24a71d2a', 'voice:choir': '945e6d95',
  'sampled:harp': '9218a22eabbc1cd4', 'sampled:lute': '31be1577f3b7c2b5', 'sampled:pizz': '3ddada220bf221e2', 'sampled:timpani': '6d48d7104319486b',
  'sampled:drum': '7c9de72c15b8424d', 'sampled:kit': '3a18528df52504cb', 'sampled:frame': 'ab28a64abf764de7', 'sampled:cymbal': '44b025e882e75e81',
  'hall:hall': 'dbad244d32126872', 'hall:chapel': '37ab51f3574b688e', 'hall:field': 'aca0f581379646f7',
};

const PARTS = MUSIC_PARTS.filter((part) => part !== 'lion') as Array<Exclude<(typeof MUSIC_PARTS)[number], 'lion'>>;
const TRACKS = plateauTracks();
const SAMPLED = new Set<string>(ALL_SAMPLED_INSTRUMENTS);
const name = (theme: ThemeDef) => theme.track ?? theme.id;

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

describe('the Lion stays as it is', () => {
  it('keeps its tracks, voices, samples and rooms byte-identical', () => {
    expect(lionFingerprint()).toEqual(LION_FINGERPRINT);
  });

  it('keeps the Lion bank the music starts with, and answers every Lion request with the Lion track', () => {
    expect(SAMPLED_INSTRUMENTS).toEqual(['harp', 'lute', 'pizz', 'timpani', 'drum', 'kit', 'frame', 'cymbal']);
    for (const id of Object.keys(THEMES) as Array<keyof typeof THEMES>) {
      expect(trackFor(id)).toBe(THEMES[id]);
      expect(trackFor(id, { part: 'lion', scene: 'lion_sanctum' })).toBe(THEMES[id]);
    }
  });

  it("asks each part's tracks in game since set 1.23.0, and the Lion's everywhere with the switch off", () => {
    expect(PLATEAU_MUSIC_IN_GAME).toBe(true);
    expect(gameMusicWhere('bear_audience')).toEqual({ part: 'bear', scene: null });
    expect(gameMusicWhere('lion_briefing')).toEqual({ part: 'lion', scene: null });
    expect(gameMusicWhere(null)).toEqual({ part: 'lion', scene: null });
    expect(gameMusicWhere('bear_audience', null, false)).toEqual({});
    expect(gameMusicWhere('bear-poi-pass', null, true)).toEqual({ part: 'bear', scene: null });
    expect(gameMusicWhere('finale_destiny_arena', 'finale_destiny_arena', true)).toEqual({ part: 'finale', scene: 'finale_destiny_arena' });
  });
});

describe('the parts of the game', () => {
  it('reads a part only from a durable id prefix', () => {
    expect(musicPartOf('bear-poi-pass')).toBe('bear');
    expect(musicPartOf('bear_audience')).toBe('bear');
    expect(musicPartOf('dragon_hall_esplanade')).toBe('dragon');
    expect(musicPartOf('scorpion-poi-oasis')).toBe('scorpion');
    expect(musicPartOf('finale_destiny_arena')).toBe('finale');
    for (const lion of ['final_refuge', 'post_young_dragon_roost', 'lion_sanctum', 'forest_route', 'acte_ouverture', '', null, undefined]) expect(musicPartOf(lion), String(lion)).toBe('lion');
  });

  it('gives each part its own six tracks and keeps title, victory and defeat shared', () => {
    for (const part of PARTS) {
      for (const context of OWN_CONTEXTS) {
        const theme = trackFor(context, { part });
        expect(theme.id, `${part}/${context}`).toBe(context);
        expect(theme.track, `${part}/${context}`).toBe(`${part}/${context}`);
        expect(theme).not.toBe(THEMES[context]);
      }
      for (const shared of ['title', 'victory', 'defeat'] as const) expect(trackFor(shared, { part })).toBe(THEMES[shared]);
    }
  });

  it('lets a combat scene ask a chief its own entry, and the Tournament its arena', () => {
    expect(trackFor('boss', { part: 'bear', scene: 'bear_hall_terrace' }).track).toBe('bear/boss@borin');
    expect(trackFor('boss', { part: 'bear', scene: 'bear_mine_galleries' }).track).toBe('bear/boss');
    expect(trackFor('boss', { part: 'dragon', scene: 'dragon_hall_esplanade' }).track).toBe('dragon/boss@kaelen');
    expect(trackFor('boss', { part: 'scorpion', scene: 'scorpion_records_court' }).track).toBe('scorpion/boss@inquisitor');
    expect(trackFor('boss', { part: 'scorpion', scene: 'scorpion_dune_crest' }).track).toBe('scorpion/boss@prophet');
    expect(trackFor('boss', { part: 'finale', scene: 'finale_breach_heart' }).track).toBe('finale/boss@maelor');
    expect(trackFor('combat', { part: 'finale', scene: 'finale_destiny_arena' }).track).toBe('finale/combat@tournament');
    expect(trackFor('boss', { part: 'finale', scene: 'finale_destiny_arena' }).track).toBe('finale/boss@tournament');
    expect(trackFor('combat', { part: 'finale', scene: 'finale_burning_streets' }).track).toBe('finale/combat');
    // a chief's entry shares the boss loop of its part
    const borin = trackFor('boss', { part: 'bear', scene: 'bear_hall_terrace' }), bear = trackFor('boss', { part: 'bear' });
    expect(borin.sections.slice(1)).toEqual(bear.sections.slice(1));
    expect(borin.sections[0]).not.toEqual(bear.sections[0]);
  });

  it('keeps every part distinct from the Lion and from the others by metre, mode or room', () => {
    for (const context of ['map', 'combat', 'boss'] as const) {
      const colours = MUSIC_PARTS.map((part) => {
        const theme = trackFor(context, { part });
        const home = sectionAt(theme, theme.loopFrom ?? 0);
        return `${home.beatsPerBar}/${home.mode}/${theme.hall}`;
      });
      expect(new Set(colours).size, `${context}: ${colours.join(', ')}`).toBe(MUSIC_PARTS.length);
    }
    // one room per part, the breach's void apart
    for (const part of PARTS) expect(new Set(OWN_CONTEXTS.map((context) => trackFor(context, { part }).hall).filter((hall) => hall !== 'void')), part).toHaveProperty('size', 1);
  });
});

describe('the plateaux\'s written music', () => {
  it('writes every chord and every line in whole bars', () => {
    for (const theme of TRACKS) for (const section of theme.sections) {
      const where = `${name(theme)}/${section.name}`;
      const last = harmonyOf(section).at(-1)!;
      expect(last.beat + last.beats, where).toBe(sectionBeats(section));
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

  it('runs the Seals motif through every track of every part', () => {
    for (const part of PARTS) for (const context of OWN_CONTEXTS) {
      expect(trackFor(context, { part }).sections.some(carriesMotif), `${part}/${context}`).toBe(true);
    }
  });

  it('writes in every loop a bridge that changes tempo, key or metre, and a return that ends on its way home', () => {
    for (const theme of TRACKS) {
      const home = sectionAt(theme, theme.loopFrom ?? 0);
      const bridge = theme.sections.find((section) => section.name === 'bridge')!;
      expect(bridge, name(theme)).toBeTruthy();
      expect(bridge.bpm !== home.bpm || pc(bridge.tonic) !== pc(home.tonic) || bridge.mode !== home.mode || bridge.beatsPerBar !== home.beatsPerBar, name(theme)).toBe(true);
      expect(bridge.lines?.length ?? 0, name(theme)).toBeGreaterThan(0);
      const final = harmonyOf(theme.sections[theme.form.at(-1)!]!).at(-1)!.chord!;
      const toHome = (pc(final.root) - pc(home.tonic) + 12) % 12;
      // the dominant, or the lowered second where the mode has one (the Scorpion)
      expect(toHome === 7 || (MODES[home.mode][1] === 1 && toHome === 1), `${name(theme)} ends on ${final.symbol}`).toBe(true);
    }
  });

  it('gives map and combat a loop of one to two minutes, with passages without melody', () => {
    for (const part of PARTS) for (const context of ['map', 'combat'] as const) {
      const theme = trackFor(context, { part });
      expect(formSeconds(theme), name(theme)).toBeGreaterThan(60);
      expect(formSeconds(theme), name(theme)).toBeLessThan(120);
      expect(theme.sections.some((section) => !section.lines?.length), `${name(theme)}: a passage without melody`).toBe(true);
    }
  });

  it('keeps every boss entry within 6 seconds, played once before the loop', () => {
    const bosses = TRACKS.filter((theme) => theme.id === 'boss');
    // four parts, and the entries of Borin, Kaelen, the Grand Inquisitor, the prophet, Maelor and the Tournament's final
    expect(bosses.length).toBe(4 + 6);
    for (const theme of bosses) {
      expect(theme.sections[0]!.name, name(theme)).toBe('entry');
      expect(sectionSeconds(theme.sections[0]!), name(theme)).toBeLessThanOrEqual(6);
      expect(theme.loopFrom, name(theme)).toBe(1);
      expect(sectionAt(theme, theme.form.length).name, name(theme)).not.toBe('entry');
    }
  });

  it('writes both levels into combat and boss, and none elsewhere', () => {
    for (const theme of TRACKS) {
      const layers = new Set(theme.sections.flatMap((_, index) => composePass(theme, index).map((event) => event.layer ?? 'shared')));
      if (theme.id === 'combat' || theme.id === 'boss') { expect(layers.has('action'), name(theme)).toBe(true); expect(layers.has('reflection'), name(theme)).toBe(true); }
      else expect([...layers], name(theme)).toEqual(['shared']);
    }
  });

  it('is reproducible, varies from round to round, and never repeats the Lion note for note', () => {
    for (const theme of TRACKS) {
      expect(composePass(theme, 2), name(theme)).toEqual(composePass(theme, 2));
      expect(composePass(theme, 1), name(theme)).not.toEqual(composePass(theme, 1 + theme.form.length));
      expect(composePass(theme, 1), name(theme)).not.toEqual(composePass(THEMES[theme.id], 1));
    }
  });

  it('keeps every event inside its section and every pitch inside its instrument', () => {
    for (const theme of TRACKS) for (let pass = 0; pass <= theme.form.length; pass++) {
      const section = sectionAt(theme, pass);
      for (const e of composePass(theme, pass)) {
        const where = `${name(theme)}/${section.name}/${e.instrument}`;
        expect(e.beat, where).toBeGreaterThanOrEqual(-0.02);
        expect(e.beat, where).toBeLessThan(sectionBeats(section) + 0.1);
        expect(e.v, where).toBeGreaterThan(0);
        expect(e.v, where).toBeLessThanOrEqual(1);
        if (SAMPLED.has(e.instrument)) {
          const def = DEFS[e.instrument as SampledInstrument];
          if (def.kind === 'notes') { expect(e.m, where).toBeGreaterThanOrEqual(def.from - 2); expect(e.m, where).toBeLessThanOrEqual(def.to + 2); }
          else expect(Number.isInteger(e.m) && e.m >= 0 && e.m < def.variants, where).toBe(true);
        } else {
          expect(e.instrument in PROFILES, where).toBe(true);
          expect(e.m, where).toBeGreaterThanOrEqual(26);
          expect(e.m, where).toBeLessThanOrEqual(96);
        }
      }
    }
  });

  it('plays each part in its own room, all of them known', () => {
    for (const theme of TRACKS) expect(theme.hall in HALLS, name(theme)).toBe(true);
    expect(new Set(PARTS.map((part) => trackFor('map', { part }).hall)).size).toBe(PARTS.length);
  });

  it('lists four parts with six tracks and the scene tracks', () => {
    expect(Object.keys(PART_MUSIC)).toEqual(['bear', 'dragon', 'scorpion', 'finale']);
    expect(TRACKS).toHaveLength(4 * 6 + 1 + 1 + 2 + 3);
    expect(new Set(TRACKS.map(name)).size).toBe(TRACKS.length);
  });
});

describe('the post-demo signature sketches', () => {
  it('writes six bosses, each part within 2.5 seconds, outside the closed cue table', () => {
    expect(Object.keys(POST_DEMO_SIGNATURE_SKETCHES)).toEqual(['borin', 'kaelen', 'inquisitor', 'prophet', 'maelor', 'entity']);
    for (const [id, { sketch }] of Object.entries(POST_DEMO_SIGNATURE_SKETCHES)) for (const part of ['charge', 'blow', 'wave'] as const) {
      let end = 0;
      const p = {
        tone: (t: number, _f: number, _type: string, dur: number) => { end = Math.max(end, t + dur); },
        hiss: (t: number, dur: number) => { end = Math.max(end, t + dur); },
        chime: (t: number, notes: readonly number[], step: number, dur: number) => { end = Math.max(end, t + (notes.length - 1) * step + dur); },
      };
      sketch[part](p as never);
      expect(end, `${id}.${part}`).toBeGreaterThan(0.3);
      expect(end, `${id}.${part}`).toBeLessThanOrEqual(2.5);
    }
    // the table stays closed: none of them is an identity of it
    expect(TABLE_CUE_IDS.length).toBe(158);
    expect(TABLE_CUE_IDS.some((id) => /borin|kaelen|inquisitor|prophet|maelor|entity/.test(id))).toBe(false);
  });

  it('keeps the sketches and the plateaux\'s tracks out of the game code, which reads only the part of an id', () => {
    for (const file of ['src/game/GameApp.ts', 'src/combat/CombatBridge.ts', 'src/ui/UiSoundPlayer.ts']) {
      const source = readFileSync(file, 'utf8');
      expect(source, file).not.toMatch(/postDemoSignatureSketches|music\/plateauTracks|music\/plateaux\//);
    }
  });
});

describe('the plateaux\'s instruments', () => {
  it('computes finite, bounded, audible samples', () => {
    for (const data of [bell(32000, 74, 0.8), bell(32000, 50, 0.8), dulcimer(32000, 62, 0.75), anvil(48000, 0), anvil(48000, 1), goblet(48000, 0), goblet(48000, 1), goblet(48000, 2), zill(48000, 0), zill(48000, 1)]) {
      let peak = 0;
      for (const x of data) { expect(Number.isFinite(x)).toBe(true); peak = Math.max(peak, Math.abs(x)); }
      expect(peak).toBeGreaterThan(0.2);
      expect(peak).toBeLessThanOrEqual(1);
    }
  });

  it('keeps the plateaux\'s bank bounded and computes it only on demand', () => {
    const extra = ALL_SAMPLED_INSTRUMENTS.filter((instrument) => !SAMPLED_INSTRUMENTS.includes(instrument));
    expect(extra).toEqual(['bell', 'dulcimer', 'anvil', 'goblet', 'zill']);
    const items = plan(extra);
    expect(items.length).toBeLessThan(40);
    const bytes = items.reduce((sum, item) => sum + compute(48000, item).byteLength, 0);
    expect(bytes).toBeLessThan(12 * 1024 * 1024);
  });
});

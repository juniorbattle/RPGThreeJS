import { describe, expect, it } from 'vitest';
import { ATLAS_STREAMS, buildPlan, CLOSED_INTERIOR_RULE, COVERED_FACE_RULE, heraldryFor, NO_CLAN_RULE, SACRED_OBJECT_RULES } from './finalImages';
import { ATLAS_LAYOUTS, CIVILIAN_IDS, CIVILIAN_REFS, IDENTITY, LIGHT_REFS, STAGED_LOOKS, STAGING } from './finalImagesStaging';

/**
 * The Scorpion's final images, prepared for the operator's validation (OD-2026-11-11-F, F1), with the lessons of the Bear's
 * and the Dragon's redos written into the lines and looks. French source: docs/content/drafts/SCORPION_STAGING_DRAFT_2026-11-12.md.
 * Its own file, so that it does not collide with the tool's own tests (tools/art/finalImages.test.ts).
 */
const S = (key: string) => `scorpion:scene:${key}`;
const HALL = S('scorpion_audience');
const OASIS = S('scorpion_oasis_gathering');
const TEMPLE = S('scorpion_phoenix_temple');
const ASHES = S('scorpion_sacred_ashes');
const VIGIL = S('scorpion_vigil');
const PROPHET_DUNE = S('scorpion_prophet_pre_combat');
const COURTYARD = S('scorpion_inquisitor_pre_combat');

/** The Phoenix's places in the Scorpion's desert: the phoenix's sign, none of the host Scorpion's. */
const PHOENIX_PLACES = [
  S('scorpion_phoenix_faithful'), S('scorpion_sand_riddle'), S('scorpion_warded_path'), S('scorpion_buried_library'), TEMPLE,
  S('scorpion_pre_temple_assault'), S('scorpion_pre_temple_seizure'), S('scorpion_temple_assault_aftermath'),
  S('scorpion_temple_seizure_aftermath'), S('scorpion_prophet_traces'), S('scorpion_temple_witnesses'), ASHES, S('scorpion_corrupted_texts'),
];
/** The Scorpion's own places: its sign, and no phoenix. */
const SCORPION_PLACES = [HALL, S('scorpion_scholars'), OASIS, 'scorpion:refuge:scorpion-first-refuge', S('scorpion_judgement'),
  'scorpion:surface:chronicle-end', COURTYARD, S('scorpion_trial_aftermath')];

describe('Scorpion final images, prepared for the operator’s validation (OD-2026-11-11-F, F1)', () => {
  const plan = buildPlan();
  const scorpion = plan.filter((item) => item.chapter === 'scorpion');
  const backdrops = scorpion.filter((item) => item.kind === 'backdrop');
  const characters = scorpion.filter((item) => item.kind === 'character');
  const find = (id: string) => {
    const item = plan.find((candidate) => candidate.id === id);
    expect(item, id).toBeDefined();
    return item!;
  };

  it('stages all 28 backdrops, each with the Scorpion’s own identity and light-matched references', () => {
    expect(backdrops).toHaveLength(28);
    expect(backdrops.filter((item) => !STAGING[item.id]).map((item) => item.id)).toEqual([]);
    for (const item of backdrops) {
      const staging = STAGING[item.id]!;
      expect(item.prompt, item.id).toContain(staging.line);
      expect(item.prompt, item.id).toContain(IDENTITY.scorpion!);
      expect(item.prompt, item.id).not.toContain('pierre brûlée');
      expect(item.references, item.id).toEqual(LIGHT_REFS[staging.light]);
    }
    // An identity of its own, kept away from the three plateaux already drawn and from purple.
    for (const words of ['Never the Lion’s motifs', 'Never the Bear’s', 'Never the Dragon’s', 'never a purple glow', 'Never purple, violet or magenta anywhere',
      'A Phoenix place shows no scorpion, and a Scorpion place shows no phoenix', 'saffron-orange with a white-hot heart, never crimson']) {
      expect(IDENTITY.scorpion, words).toContain(words);
    }
  });

  it('keeps every closed interior closed, and opens only the Grand Inquisiteur’s hall and the buried library from above', () => {
    const interiors = backdrops.filter((item) => STAGING[item.id]!.light === 'interior');
    const open = interiors.filter((item) => STAGING[item.id]!.skyVisible).map((item) => item.id).sort();
    expect(open).toEqual([S('scorpion_audience'), S('scorpion_buried_library'), S('scorpion_judgement'), 'scorpion:surface:chronicle-end'].sort());
    const closed = interiors.filter((item) => !STAGING[item.id]!.skyVisible);
    expect(closed).toHaveLength(9);
    for (const item of closed) expect(item.prompt, item.id).toContain(CLOSED_INTERIOR_RULE);
    for (const id of open) expect(STAGING[id]!.line, id).toMatch(/no (view of any )?landscape/);
  });

  it('marks every character’s look as a proposal, with a covered face, its combat weapon and nothing that passes for the codex', () => {
    expect(characters).toHaveLength(9);
    for (const item of characters) {
      expect(item.notes, item.id).toMatch(/^PROPOSAL, to confirm: /);
      expect(item.notes, item.id).toBe(STAGED_LOOKS[item.id]);
      expect(item.prompt, item.id).toContain(COVERED_FACE_RULE);
      expect(item.prompt, item.id).toContain(SACRED_OBJECT_RULES.scorpion!);
      expect(item.notes.replace(/\bno book\b/gi, ''), item.id).not.toMatch(/\b(book|codex|tome)\b/i);
      expect(item.notes, item.id).not.toMatch(/beard|bare face|bare-headed/i);
    }
    // Each fighter's look and brief carry the weapon it fights with (src/combat/legacyCombatRuntime.js).
    const weapons: Record<string, [RegExp, string]> = {
      'scorpion:actor:phoenix_guardian_chief': [/spear whose blade burns/, '« Lance de flamme » (a spear)'],
      'scorpion:enemy:phoenix_guardian': [/temple spear/, '« Lance du temple » (a spear)'],
      'scorpion:actor:scorpion_scholar': [/wooden staff in hand/, '« Bâton » (a staff)'],
      'scorpion:actor:grand_inquisitor': [/staff .* the focus of his magic/, 'fights with magic (« Sceau »)'],
      'scorpion:actor:shadow_prophet': [/wave of cold black ink, his weapon/, 'fights with magic (« Onde froide »)'],
      'scorpion:enemy:phoenix_flamekeeper': [/temple’s flame burns .* his weapon/, 'fights with magic (« Flamme du temple »)'],
      'scorpion:enemy:shadow_zealot': [/wave of cold black ink .* the weapon/, 'fights with magic (« Onde froide »)'],
    };
    for (const [id, [look, rule]] of Object.entries(weapons)) {
      expect(find(id).notes, id).toMatch(look);
      expect(find(id).prompt, id).toContain(rule);
    }
  });

  it('points each place shown twice to its first image, as staged', () => {
    const samePlace = Object.fromEntries(backdrops.filter((item) => item.samePlaceAs).map((item) => [item.id, item.samePlaceAs]));
    expect(samePlace).toEqual({
      [S('scorpion_judgement')]: HALL, 'scorpion:surface:chronicle-end': HALL,
      'scorpion:refuge:scorpion-first-refuge': OASIS,
      [S('scorpion_pre_temple_assault')]: TEMPLE, [S('scorpion_pre_temple_seizure')]: TEMPLE,
      [S('scorpion_temple_assault_aftermath')]: TEMPLE, [S('scorpion_temple_seizure_aftermath')]: TEMPLE,
      [S('scorpion_corrupted_texts')]: ASHES,
      'scorpion:refuge:scorpion-final-refuge': VIGIL,
      [S('scorpion_prophet_aftermath')]: PROPHET_DUNE,
      [S('scorpion_trial_aftermath')]: COURTYARD,
    });
    for (const [id, target] of Object.entries(samePlace)) {
      expect(STAGING[target!], id).toBeDefined();
      expect(STAGING[target!]!.samePlaceAs, id).toBeUndefined();
      expect(STAGING[id]!.light === 'interior', id).toBe(STAGING[target!]!.light === 'interior');
    }
  });

  it('gives the Phoenix’s places the phoenix sign and none of the Scorpion’s, and the Scorpion’s places no phoenix', () => {
    for (const id of PHOENIX_PLACES) {
      const item = find(id);
      expect(item.prompt, id).toContain('the Phoenix clan’s people, camps and banners show a phoenix');
      expect(item.prompt, id).toContain('the other clans’ places show none of the Scorpion clan’s carvings, emblems or objects');
      expect(STAGING[id]!.line, id).toMatch(/no scorpion/i);
    }
    for (const id of SCORPION_PLACES) {
      expect(find(id).prompt, id).toContain('shows the Scorpion clan’s sign, a scorpion');
      expect(STAGING[id]!.line, id).toMatch(/no phoenix/i);
    }
    expect([...PHOENIX_PLACES, ...SCORPION_PLACES].length).toBeLessThan(backdrops.length);
  });

  it('gives the caravan shelter, staged with no emblem of any clan, no clan sign at all', () => {
    // Its first image had scorpions carved on its pillars: the host clan's sentence asked for its sign on any carved emblem.
    const shelter = find('scorpion:refuge:scorpion-second-refuge');
    expect(STAGING[shelter.id]!.line).toContain('no emblem of any clan');
    expect(shelter.prompt).toContain(NO_CLAN_RULE);
    expect(shelter.prompt).not.toContain('shows the Scorpion clan’s sign');
    expect(heraldryFor('scorpion', 'A shelter: no emblem of any clan.')).toBe(NO_CLAN_RULE);
    // Only that line says it: every other brief of the plan keeps its clan sentence.
    expect(plan.filter((item) => item.prompt.includes(NO_CLAN_RULE)).map((item) => item.id)).toEqual([shelter.id]);
  });

  it('gives the Prophet, the faithful led astray and the Prophet’s dunes no clan sign, and the Shadows their cold black ink', () => {
    for (const id of ['scorpion:actor:shadow_prophet', 'scorpion:enemy:shadow_zealot', PROPHET_DUNE, S('scorpion_prophet_aftermath')]) {
      const prompt = find(id).prompt;
      expect(prompt, id).toContain('The Shadows belong to no clan');
      expect(prompt, id).not.toContain('a scorpion;');
      expect(prompt, id).not.toContain('show a phoenix');
    }
    for (const id of [PROPHET_DUNE, S('scorpion_prophet_traces'), S('scorpion_corrupted_texts')]) expect(STAGING[id]!.line, id).toContain('cold black ink');
  });

  it('draws the faithful of the Phoenix and the captive as civilians, from civilian references', () => {
    for (const id of ['scorpion:actor:phoenix_faithful', 'scorpion:actor:phoenix_captive']) {
      expect(CIVILIAN_IDS).toContain(id);
      const item = find(id);
      expect(item.references, id).toEqual(CIVILIAN_REFS);
      expect(item.notes, id).toMatch(/civilian .* not a soldier and unarmed/);
      expect(item.prompt, id).not.toContain('In combat it fights');
    }
  });

  it('repaints the three atlases on the Lion layouts, as dry desert maps with no other camp or temple', () => {
    const lion = { 'scorpion:atlas:1': 'lion-opening', 'scorpion:atlas:2': 'bois-clair', 'scorpion:atlas:3': 'judgement' };
    for (const [id, name] of Object.entries(lion)) {
      const layout = ATLAS_LAYOUTS[id]!;
      expect(layout, id).toBeDefined();
      expect(layout.lionAtlas).toBe(`public/assets/generated/lion-phase/poi-lot-e/${name}.png`);
      const item = find(id);
      expect(item.references, id).toEqual([layout.lionAtlas]);
      expect(item.prompt, id).toContain(layout.line);
      expect(item.prompt, id).toContain(IDENTITY.scorpion!);
      // The tool's stream sentence is the desert's own (ATLAS_STREAMS): dry wadis, never icy torrents.
      expect(item.prompt, id).toContain(ATLAS_STREAMS.scorpion!);
      expect(item.prompt, id).not.toMatch(/icy|torrent/i);
      expect(layout.line, id).toMatch(/dry (riverbeds?|ravines)/);
      expect(layout.line, id).toMatch(/No other (camp|temple)/);
    }
    expect(scorpion.filter((item) => item.kind === 'atlas').map((item) => item.id)).toEqual(Object.keys(lion));
  });
});

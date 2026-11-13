import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  ATLAS_STREAMS, buildPlan, CLOSED_INTERIOR_RULE, COVERED_FACE_RULE, NO_CLAN_RULE, NOTHING_BUILT_FAR_RULE, OUT_OF_BREACH_RULE, SACRED_OBJECT_RULES,
} from './finalImages';
import { ATLAS_LAYOUTS, BREACH_CREATURE_IDS, CIVILIAN_IDS, CIVILIAN_REFS, CREATURE_REFS, IDENTITY, LIGHT_REFS, STAGED_LOOKS, STAGING } from './finalImagesStaging';

/**
 * The final act's images, prepared for the operator's validation (OD-2026-11-11-F, F1), with the lessons of the Bear's,
 * the Dragon's and the Scorpion's redos written into the lines and looks. French source:
 * docs/content/drafts/FINALE_STAGING_DRAFT_2026-11-12.md. Its own file, beside the tool's and the Scorpion's tests.
 */
const S = (key: string) => `finale:scene:${key}`;
const ARENA = 'finale:surface:tableau-des-rencontres-du-tournoi';
const CAPITAL_VIEW = S('finale_capital_arrival');
const LAST_HOUSE = S('finale_last_vigil');
const BREACH_HEART = S('finale_breach_confrontation');

/** The Tournament in the Arena of Destinies, from the arrival to the chaos: its crowd stays in the stands. */
const TOURNAMENT = [ARENA, S('finale_arrival'), S('finale_raven_verdict'), S('finale_wolf_verdict'), S('finale_phoenix_verdict'),
  S('finale_pre_serpent_final'), S('finale_betrayal'), S('finale_arena_chaos')];
/** The breach's heart with no banner: the Shadows' place, no clan's. */
const BREACH_PLACES = [BREACH_HEART, S('finale_breach_aftermath'), 'finale:surface:chronicle-end'];
/** Scenes whose banners depend on the run's clan relations: mixed and unreadable, none in the middle. */
const RUN_BANNER_SCENES = [S('finale_allied_rally'), S('finale_epilogue_respect'), S('finale_epilogue_fear'), S('finale_epilogue_balance')];

describe('final act images, prepared for the operator’s validation (OD-2026-11-11-F, F1)', () => {
  const plan = buildPlan();
  const finale = plan.filter((item) => item.chapter === 'finale');
  const backdrops = finale.filter((item) => item.kind === 'backdrop');
  const characters = finale.filter((item) => item.kind === 'character');
  const find = (id: string) => {
    const item = plan.find((candidate) => candidate.id === id);
    expect(item, id).toBeDefined();
    return item!;
  };

  it('stages all 22 backdrops, each with the final act’s own identity and light-matched references', () => {
    expect(backdrops).toHaveLength(22);
    expect(backdrops.filter((item) => !STAGING[item.id]).map((item) => item.id)).toEqual([]);
    for (const item of backdrops) {
      const staging = STAGING[item.id]!;
      expect(item.prompt, item.id).toContain(staging.line);
      expect(item.prompt, item.id).toContain(IDENTITY.finale!);
      // The setting sentence of the provisional briefs gives way to the identity.
      expect(item.prompt, item.id).not.toContain('La capitale des clans');
      expect(item.references, item.id).toEqual(LIGHT_REFS[staging.light]);
    }
    // An identity of its own, kept away from the four looks already in the game and from purple.
    for (const words of ['the only city of the game', 'fired brick', 'blue-black slate', 'the clans’ banners the only bright colours',
      'pure black inside like cold ink', 'thin cold white light', 'Never purple, violet or magenta anywhere', 'Never the Lion’s motifs',
      'Never the Bear’s', 'Never the Dragon’s', 'Never the Scorpion’s']) {
      expect(IDENTITY.finale, words).toContain(words);
    }
  });

  it('opens the one interior, the house of the last vigil, on the breach through a window, and keeps nothing built far away unnamed', () => {
    const interiors = backdrops.filter((item) => STAGING[item.id]!.light === 'interior').map((item) => item.id).sort();
    expect(interiors).toEqual(['finale:refuge:finale-last-refuge', LAST_HOUSE].sort());
    for (const id of interiors) {
      expect(STAGING[id]!.skyVisible, id).toBe(true);
      expect(STAGING[id]!.line, id).toMatch(/window with its shutters half open/);
      expect(find(id).prompt, id).not.toContain(CLOSED_INTERIOR_RULE);
    }
    for (const item of backdrops) expect(item.prompt, item.id).toContain(NOTHING_BUILT_FAR_RULE);
  });

  it('keeps the Tournament’s crowd far away in the stands, and the arena empty after it', () => {
    const crowded = backdrops.filter((item) => STAGING[item.id]!.crowd).map((item) => item.id).sort();
    expect(crowded).toEqual([...TOURNAMENT].sort());
    for (const id of TOURNAMENT) {
      const prompt = find(id).prompt;
      expect(prompt, id).toContain('the only people are the distant crowd in the stands');
      expect(prompt, id).toContain('no characters');
      expect(prompt, id).not.toContain('empty of people');
    }
    expect(STAGING[S('finale_arena_assault_aftermath')]!.line).toContain('The stands are empty');
    // Every other backdrop of the plan keeps the empty-of-people opening.
    for (const item of plan.filter((candidate) => candidate.kind === 'backdrop' && STAGING[candidate.id] && !STAGING[candidate.id]!.crowd)) {
      expect(item.prompt, item.id).toContain('A wide environment tableau, empty of people');
    }
  });

  it('flies every clan’s banner with its own sign over the Tournament, and shows the breach only from the betrayal on', () => {
    for (const id of TOURNAMENT) {
      const prompt = find(id).prompt;
      expect(STAGING[id]!.line, id).toContain('the banners of all the clans, each showing only its own clan’s sign');
      for (const clan of ['Bear', 'Raven', 'Dragon', 'Wolf', 'Scorpion', 'Phoenix', 'Serpent']) {
        expect(prompt, `${id} ${clan}`).toContain(`the ${clan} clan’s people, camps and banners show a`);
      }
    }
    for (const id of TOURNAMENT.slice(0, 6)) expect(STAGING[id]!.line, id).toContain('No breach, no fire, no smoke');
    for (const id of [S('finale_betrayal'), S('finale_arena_chaos'), S('finale_arena_assault_aftermath')]) {
      expect(STAGING[id]!.line, id).toMatch(/breach .*pure black (inside )?like cold ink.* cold white light/);
    }
    // The Raven's champion lost his blades on the sand (« Ses lames ont glissé hors de sa portée »).
    expect(STAGING[S('finale_raven_verdict')]!.line).toContain('two throwing knives lie apart from each other, out of reach');
  });

  it('points each place shown more than once to its first image, as staged', () => {
    const samePlace = Object.fromEntries(backdrops.filter((item) => item.samePlaceAs).map((item) => [item.id, item.samePlaceAs]));
    expect(samePlace).toEqual({
      ...Object.fromEntries([...TOURNAMENT.slice(1), S('finale_arena_assault_aftermath')].map((id) => [id, ARENA])),
      [S('finale_act_end')]: CAPITAL_VIEW,
      'finale:refuge:finale-last-refuge': LAST_HOUSE,
      ...Object.fromEntries([S('finale_breach_aftermath'), 'finale:surface:chronicle-end', S('finale_epilogue_respect'), S('finale_epilogue_fear'),
        S('finale_epilogue_balance'), S('finale_fear_close')].map((id) => [id, BREACH_HEART])),
    });
    for (const [id, target] of Object.entries(samePlace)) {
      expect(STAGING[target!], id).toBeDefined();
      expect(STAGING[target!]!.samePlaceAs, id).toBeUndefined();
      expect(STAGING[id]!.light === 'interior', id).toBe(STAGING[target!]!.light === 'interior');
    }
    // The breach stays far from the arena's gate and a few streets from the last house, as the scenes say.
    for (const id of [CAPITAL_VIEW, S('finale_act_end')]) expect(STAGING[id]!.line, id).toMatch(/far from the viewer, above the rooftops of the lower city/);
    expect(STAGING[LAST_HOUSE]!.line).toContain('a few streets from the breach');
  });

  it('gives the breach’s heart the Shadows’ no-clan rule, and the run’s banners the clans’ own signs only and no place in the middle', () => {
    for (const id of BREACH_PLACES) {
      const prompt = find(id).prompt;
      expect(prompt, id).toContain('The Shadows belong to no clan');
      expect(STAGING[id]!.line, id).toContain('No banner');
    }
    for (const id of RUN_BANNER_SCENES) {
      const line = STAGING[id]!.line;
      expect(line, id).toContain('banners of several clans');
      // The rally's first image invented a tree, a stag and a star, and a purple banner: only the clans' own signs now.
      expect(line, id).toContain('each showing only one of the clans’ own signs');
      expect(line, id).toContain('never any other emblem such as a tree, a stag, a star or a sword, and no purple banner');
      expect(line, id).toContain('none raised above the others and none in the middle');
      // No clan is named as such, so no run's allies are singled out; the company's own banner (an open decision) is never shown.
      expect(find(id).prompt, id).toContain('Any banners mix the signs of several clans; no single emblem dominates.');
      expect(line, id).not.toMatch(/company’s banner|landless clan/);
    }
    // The endings show the breach closing (« La brèche se referme »): their first images copied the open breach of their reference.
    for (const id of RUN_BANNER_SCENES.slice(1)) {
      expect(STAGING[id]!.line, id).toContain('the breach almost closed: no black tear is left in the sky, only a single thin vertical line of cold white light');
    }
    // No final-act line borrows the Scorpion's shelter rule: that brief stays the only one with it.
    for (const item of finale) expect(item.prompt, item.id).not.toContain(NO_CLAN_RULE);
  });

  it('marks every character’s look as a proposal, with a covered face, its combat weapon and nothing that passes for a Seal or the artefact', () => {
    expect(characters).toHaveLength(14);
    for (const item of characters) {
      expect(item.notes, item.id).toMatch(/^PROPOSAL, to confirm: /);
      expect(item.notes, item.id).toBe(STAGED_LOOKS[item.id]);
      expect(item.prompt, item.id).toContain(COVERED_FACE_RULE);
      expect(item.prompt, item.id).toContain(SACRED_OBJECT_RULES.finale!);
      expect(item.notes, item.id).not.toMatch(/medallion|amulet|\borb\b|crystal|relic|\bseal\b|artefact/i);
      expect(item.notes, item.id).not.toMatch(/beard|bare face|bare-headed/i);
    }
    // Each fighter's look carries the weapon it fights with (src/combat/legacyCombatRuntime.js), and its brief says so.
    const weapons: Record<string, [RegExp, string]> = {
      'finale:enemy:raven_champion': [/throwing knife held in each hand, his weapon/, '« Lames de jet » (throwing knives)'],
      'finale:enemy:phoenix_champion': [/temple spear .* his weapon/, '« Lance du temple » (a spear)'],
      'finale:enemy:serpent_champion': [/curved blade .* his weapon/, '« Lame Serpent » (a blade)'],
      'finale:enemy:demon_champion': [/great black claws, his weapon/, '« Griffes » (its own claws)'],
      'finale:enemy:breach_demon': [/black claws on its hands, its weapon/, '« Griffes » (its own claws)'],
      'finale:enemy:demon_brute': [/huge black claws .* its weapon/, '« Griffes » (its own claws)'],
      'finale:enemy:maelor_traitor': [/wave of cold black ink rises, his weapon/, 'fights with magic (« Onde froide »)'],
      'finale:enemy:breach_entity': [/wave of cold black ink, its weapon/, 'fights with magic (« Onde froide »)'],
    };
    for (const [id, [look, rule]] of Object.entries(weapons)) {
      expect(find(id).notes, id).toMatch(look);
      expect(find(id).prompt, id).toContain(rule);
    }
    // A champion's portrait and his sprite are one person: one look for both briefs.
    for (const clan of ['raven', 'phoenix', 'serpent']) {
      expect(STAGED_LOOKS[`finale:actor:finale_${clan}_champion`], clan).toBe(STAGED_LOOKS[`finale:enemy:${clan}_champion`]);
    }
    // The Wolf's champion fights with the Dragon's champion sprite: his portrait names the same throwing knives.
    expect(STAGED_LOOKS['finale:actor:finale_wolf_champion']).toContain('the same elite champion of the Wolf clan');
    expect(STAGED_LOOKS['finale:actor:finale_wolf_champion']).toContain('throwing knives');
    // Each champion shows his own clan's sign.
    for (const [clan, sign] of [['raven', 'raven'], ['phoenix', 'phoenix'], ['serpent', 'serpent']]) {
      expect(find(`finale:enemy:${clan}_champion`).prompt, clan).toContain(`banners show a ${sign}`);
    }
  });

  it('draws the demons and the entity from the beasts’ references, with no clan sign and no face', () => {
    expect(BREACH_CREATURE_IDS).toHaveLength(4);
    for (const id of BREACH_CREATURE_IDS) {
      const item = find(id);
      expect(item.references, id).toEqual(CREATURE_REFS);
      expect(item.prompt, id).toContain(OUT_OF_BREACH_RULE);
      expect(item.prompt, id).not.toContain('Any banners mix');
      expect(item.prompt, id).toContain('In combat it fights');
      expect(item.notes, id).toMatch(/no face|No face/);
      expect(item.notes, id).toContain('Never purple, violet or magenta');
    }
    // Only these four carry the rule.
    expect(plan.filter((item) => item.prompt.includes(OUT_OF_BREACH_RULE)).map((item) => item.id).sort()).toEqual([...BREACH_CREATURE_IDS].sort());
    // Maelor stays the man of his approved portrait, with no artefact and no dagger.
    expect(STAGED_LOOKS['finale:enemy:maelor_traitor']).toContain('the same man as in his approved portrait');
    expect(STAGED_LOOKS['finale:enemy:maelor_traitor']).toContain('No dagger, no book, nothing in his hands');
  });

  it('draws the spectator and the inhabitant of the capital as civilians, from civilian references', () => {
    for (const id of ['finale:actor:finale_civilian', 'finale:actor:finale_citizen']) {
      expect(CIVILIAN_IDS).toContain(id);
      const item = find(id);
      expect(item.references, id).toEqual(CIVILIAN_REFS);
      expect(item.notes, id).toMatch(/civilian .* not a soldier and unarmed/);
      expect(item.prompt, id).not.toContain('In combat it fights');
    }
  });

  it('repaints the single atlas on the Lion layout whose positions its POIs already keep, as a burning city', () => {
    const layout = ATLAS_LAYOUTS['finale:atlas:1']!;
    expect(layout.lionAtlas).toBe('public/assets/generated/lion-phase/poi-lot-e/judgement.png');
    const item = find('finale:atlas:1');
    expect(item.references).toEqual([layout.lionAtlas]);
    expect(item.prompt).toContain(layout.line);
    expect(item.prompt).toContain(IDENTITY.finale!);
    expect(item.prompt).toContain(ATLAS_STREAMS.finale!);
    expect(item.prompt).not.toMatch(/icy|torrent|wadi/i);
    for (const site of ['Arena of Destinies', 'pillaged armoury', 'burning streets', 'collapsed houses', 'abandoned market', 'banners of several clans gather',
      'collapsed street', 'the great square', 'city wall', 'intact brick house', 'the heart of the breach']) {
      expect(layout.line, site).toContain(site);
    }
    expect(layout.line).toContain('No other arena, castle, palace or temple anywhere on this map');
    expect(finale.filter((candidate) => candidate.kind === 'atlas').map((candidate) => candidate.id)).toEqual(['finale:atlas:1']);
  });

  it('leaves the Bear’s, the Dragon’s and the Scorpion’s 125 briefs byte-identical', () => {
    // Fingerprint taken before and after the final act's entries (2026-11-12); a deliberate change to those briefs updates it.
    // 2026-11-13 (OD-2026-11-13-D): four Raven weapons renamed after their masters, so only those four weapon sentences changed.
    const others = plan.filter((item) => item.chapter !== 'finale')
      .map((item) => ({ id: item.id, prompt: item.prompt, notes: item.notes, references: item.references, samePlaceAs: item.samePlaceAs ?? null }));
    expect(others).toHaveLength(125);
    expect(createHash('sha256').update(JSON.stringify(others)).digest('hex')).toBe('cd31cf0bf7e7987a994fbc0c8d434da76c7ffaa242f595818a4edc55051562c2');
  });
});

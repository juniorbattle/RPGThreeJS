import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  appendToLog, ATLAS_STREAMS, buildPlan, CLOSED_INTERIOR_RULE, combatWeaponOf, COVERED_FACE_RULE, heraldryFor, NOTHING_BUILT_FAR_RULE, openAiKey, PILOT_IDS,
  SACRED_OBJECT_RULES, SHADOWS_COLOUR_RULE, weaponRule,
} from './finalImages';
import { ATLAS_LAYOUTS, CREATURE_IDS, CREATURE_REFS, CIVILIAN_REFS, IDENTITY, LIGHT_REFS, STAGING } from './finalImagesStaging';

describe('final images plan (OD-2026-11-11-F, F1)', () => {
  const plan = buildPlan();

  it('briefs every provisional image of the post-demo plateaux once, with style references that exist', () => {
    expect(plan.length).toBeGreaterThan(150);
    expect(new Set(plan.map((item) => item.id)).size).toBe(plan.length);
    for (const item of plan) {
      expect(item.awaitedFinal.length, item.id).toBeGreaterThan(5);
      expect(item.references.length, item.id).toBeGreaterThan(0);
      for (const reference of item.references) expect(existsSync(join(process.cwd(), reference)), reference).toBe(true);
    }
  });

  it('asks for empty landscape backdrops and transparent square characters', () => {
    for (const item of plan) {
      if (item.kind === 'character') {
        expect(item).toMatchObject({ size: '1024x1024', transparent: true });
        expect(item.prompt).toContain('transparent background');
      } else {
        expect(item).toMatchObject({ size: '1536x1024', transparent: false });
      }
      if (item.kind === 'backdrop') expect(item.prompt).toContain('no characters');
    }
  });

  it('keeps the six-image Bear pilot in the plan, with the proposed looks marked for confirmation', () => {
    expect(PILOT_IDS).toHaveLength(6);
    for (const id of PILOT_IDS) expect(plan.some((item) => item.id === id), id).toBe(true);
    expect(plan.find((item) => item.id === 'bear:actor:borin')!.notes).toMatch(/^PROPOSAL, to confirm/);
  });

  it('tells every brief to keep the references’ style but not their Lion heraldry, and names the clan’s own sign', () => {
    for (const item of plan) {
      expect(item.prompt, item.id).toContain('never copy their heraldry');
      if (item.chapter !== 'finale' && !CREATURE_IDS.includes(item.id)) expect(item.prompt, item.id).toMatch(/never a lion\.$/);
    }
    expect(plan.find((item) => item.id === 'bear:scene:bear_audience')!.prompt).toContain('the Bear clan’s sign, a bear');
  });

  it('gives another clan named by a brief its own sign: the Raven in the Bear’s mountains, the Serpent’s champion', () => {
    expect(heraldryFor('bear', 'Sprite de l’éclaireur du Corbeau')).toBe('Each clan keeps its own sign: the Raven clan’s people, camps and banners show a raven; the Bear clan’s own places show a bear, and the other clans’ places show none of the Bear clan’s carvings, emblems or objects; never a lion.');
    expect(heraldryFor('bear', 'Tableau : la salle de l’Ancien Ours Borin')).toBe('Any banner, shield, medallion or carved emblem shows the Bear clan’s sign, a bear; never a lion.');
    expect(heraldryFor('dragon', 'Tableau : les pièges du Loup')).toContain('the Wolf clan’s people, camps and banners show a wolf');
    expect(heraldryFor('finale', 'Sprite de boss du champion du Serpent')).toContain('the Serpent clan’s people, camps and banners show a serpent');
    expect(heraldryFor('scorpion', 'Tableau : le nid de serpents')).not.toContain('Serpent clan');
    expect(plan.find((item) => item.id === 'bear:enemy:raven_scout')!.prompt).toContain('show a raven');
  });

  it('keeps every character’s face covered, the operator’s standing rule (OD-2026-11-11-G)', () => {
    const characters = plan.filter((item) => item.kind === 'character' && !CREATURE_IDS.includes(item.id));
    expect(characters.length).toBeGreaterThan(40);
    for (const item of characters) {
      expect(item.prompt, item.id).toContain(COVERED_FACE_RULE);
      expect(item.notes, item.id).not.toMatch(/beard|bare face|bare-headed/i);
    }
    expect(plan.find((item) => item.id === 'bear:actor:borin')!.notes).toContain('hides his face');
  });

  it('keeps the demo’s technique but not its palette, buildings or landmarks (operator, 2026-11-12)', () => {
    for (const item of plan) expect(item.prompt, item.id).toContain('never copy their heraldry, emblems, banners, palette, architecture, landmarks or composition');
  });

  it('stages every Bear backdrop the first run got wrong, with the Bear’s own identity and light-matched references', () => {
    const backdrops = plan.filter((item) => item.chapter === 'bear' && item.kind === 'backdrop');
    expect(backdrops.filter((item) => !STAGING[item.id]).map((item) => item.id)).toEqual(['bear:scene:bear_raven_camp']);
    for (const [id, staging] of Object.entries(STAGING)) {
      const item = plan.find((candidate) => candidate.id === id);
      expect(item, id).toBeDefined();
      expect(item!.prompt, id).toContain(staging.line);
      expect(item!.prompt, id).toContain(IDENTITY[item!.chapter]!);
      expect(item!.prompt, id).not.toContain('cols enneigés');
      expect(item!.references, id).toEqual(LIGHT_REFS[staging.light]);
      const indoorsRule = 'no snow, no frost, no daylight, no sky';
      if (staging.light === 'interior' && !staging.skyVisible) expect(item!.prompt, id).toContain(indoorsRule);
      else expect(item!.prompt, id).not.toContain(indoorsRule);
    }
    expect(plan.find((item) => item.id === 'bear:scene:bear_judgement')!.samePlaceAs).toBe('bear:scene:bear_audience');
    for (const item of plan.filter((candidate) => candidate.samePlaceAs)) expect(STAGING[item.samePlaceAs!], item.id).toBeDefined();
    expect(plan.find((item) => item.id === 'bear:scene:bear_trial_aftermath')!.samePlaceAs).toBe('bear:scene:bear_borin_pre_combat');
    expect(plan.find((item) => item.id === 'bear:scene:bear_mines_defense_aftermath')!.prompt).toContain('show a raven');
    expect(plan.find((item) => item.id === 'bear:scene:bear_raven_camp')!.prompt).toContain('cols enneigés');
  });

  it('repaints each Bear atlas on the Lion atlas whose POI positions it keeps', () => {
    for (const [id, layout] of Object.entries(ATLAS_LAYOUTS)) {
      const item = plan.find((candidate) => candidate.id === id)!;
      expect(item.references, id).toEqual([layout.lionAtlas]);
      expect(item.prompt, id).toContain('keep exactly the position, width and course of every road');
      expect(item.prompt, id).toContain(layout.line);
      // Each plateau says what the layout's streams become: icy torrents in the Bear's and the Dragon's mountains, the
      // sentence they were generated with, dry wadis in the Scorpion's desert.
      expect(ATLAS_STREAMS[item.chapter], id).toBeDefined();
      expect(item.prompt, id).toContain(`Sites stay open, readable clearings or small settlements. ${ATLAS_STREAMS[item.chapter]} Paint the blurred bands`);
      if (item.chapter === 'bear' || item.chapter === 'dragon') expect(ATLAS_STREAMS[item.chapter], id).toBe('Streams of the layout become icy mountain torrents.');
      else expect(item.prompt, id).not.toContain('icy');
    }
    expect(Object.keys(ATLAS_LAYOUTS)).toEqual(['bear:atlas:1', 'bear:atlas:2', 'bear:atlas:3', 'dragon:atlas:1', 'dragon:atlas:2', 'dragon:atlas:3',
      'scorpion:atlas:1', 'scorpion:atlas:2', 'scorpion:atlas:3', 'finale:atlas:1']);
  });

  it('prepares every Dragon image with its own identity, staging and proposed looks, for the operator to validate', () => {
    const dragon = plan.filter((item) => item.chapter === 'dragon');
    const backdrops = dragon.filter((item) => item.kind === 'backdrop');
    expect(backdrops).toHaveLength(28);
    expect(backdrops.filter((item) => !STAGING[item.id]).map((item) => item.id)).toEqual([]);
    for (const item of dragon.filter((candidate) => candidate.kind === 'character')) {
      expect(item.notes, item.id).toMatch(/^PROPOSAL, to confirm/);
    }
    expect(IDENTITY.dragon).toContain('never a purple glow');
    expect(IDENTITY.dragon).toContain('Never the Bear’s');
    // Kaelen's hall opens onto the sky, unlike the Bear's closed halls; the judgement and the chronicle end share it.
    const hall = plan.find((item) => item.id === 'dragon:scene:dragon_audience')!;
    expect(hall.prompt).not.toContain('no daylight, no sky');
    expect(hall.prompt).toContain('the Dragon clan’s sign, a dragon');
    expect(plan.find((item) => item.id === 'dragon:scene:dragon_judgement')!.samePlaceAs).toBe('dragon:scene:dragon_audience');
    expect(plan.find((item) => item.id === 'dragon:surface:chronicle-end')!.samePlaceAs).toBe('dragon:scene:dragon_audience');
    expect(plan.find((item) => item.id === 'dragon:refuge:dragon-second-refuge')!.prompt).toContain('no daylight, no sky');
    expect(plan.find((item) => item.id === 'dragon:scene:dragon_lair_seizure_aftermath')!.samePlaceAs).toBe('dragon:scene:dragon_wolf_lair');
    expect(plan.find((item) => item.id === 'dragon:scene:dragon_wolf_lair')!.prompt).toContain('show a wolf');
    // The Shadows are no clan: the shaman never wears the host clan's dragon.
    const shaman = plan.find((item) => item.id === 'dragon:actor:shadow_shaman')!;
    expect(shaman.prompt).toContain('The Shadows belong to no clan');
    expect(shaman.prompt).not.toContain('a dragon;');
    expect(plan.find((item) => item.id === 'dragon:actor:wolf_chief')!.prompt).toContain('show a wolf');
    expect(plan.find((item) => item.id === 'dragon:actor:dragon_pilgrim')!.references).toEqual(CIVILIAN_REFS);
    expect(plan.find((item) => item.id === 'dragon:enemy:shadow_wyrm')!.references).toEqual(CREATURE_REFS);
  });

  it('draws the beasts as animals from beast references, and the miner as a civilian', () => {
    for (const id of CREATURE_IDS) {
      const item = plan.find((candidate) => candidate.id === id)!;
      expect(item.references).toEqual(CREATURE_REFS);
      expect(item.prompt).toContain('an animal and not a person');
      expect(item.prompt).not.toContain(COVERED_FACE_RULE);
      expect(item.notes.length).toBeGreaterThan(40);
    }
    const miner = plan.find((item) => item.id === 'bear:actor:bear_miner')!;
    expect(miner.references).toEqual(CIVILIAN_REFS);
    expect(miner.prompt).toContain(COVERED_FACE_RULE);
    expect(miner.notes).toMatch(/not a soldier/);
  });

  it('takes the key from the terminal, else from .env.local, loading nothing but the OPENAI_ variables', () => {
    const saved = process.env.OPENAI_API_KEY;
    const root = mkdtempSync(join(tmpdir(), 'final-images-key-'));
    try {
      delete process.env.OPENAI_API_KEY;
      expect(openAiKey(root)).toBeNull();
      writeFileSync(join(root, '.env.local'), ['OPENAI_API_KEY=test-not-a-real-key', 'OTHER_SECRET=must-stay-unread', ''].join('\n'));
      expect(openAiKey(root)).toEqual({ key: 'test-not-a-real-key', source: 'the project env file (.env.local)' });
      expect(process.env.OTHER_SECRET).toBeUndefined();
      process.env.OPENAI_API_KEY = 'test-terminal-key';
      expect(openAiKey(root)).toEqual({ key: 'test-terminal-key', source: 'the terminal' });
    } finally {
      if (saved === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = saved;
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('never writes the key anywhere', () => {
    const source = readFileSync(join(process.cwd(), 'tools', 'art', 'finalImages.ts'), 'utf8');
    expect(source).toContain("loadEnv('production', root, 'OPENAI_')");
    // The key only travels in the request header: never into the log, the plan or the console.
    expect(source).toContain('headers: { Authorization: `Bearer ${key}` }');
    expect(source).not.toMatch(/(?:log|newEntries)\.push\(\{[^}]*\bkey\b/);
    expect(source).not.toMatch(/console\.(log|error)\([^)]*\bkey\b/);
  });
});

describe('final images tool: fixes learned from the Bear and Dragon runs (2026-11-12)', () => {
  const plan = buildPlan();
  const prompt = (id: string) => plan.find((item) => item.id === id)!.prompt;

  it('appends each run’s entries to log.json, so two runs at once keep each other’s', () => {
    const root = mkdtempSync(join(tmpdir(), 'final-images-log-'));
    const log = join(root, 'log.json');
    try {
      appendToLog(log, []);
      expect(JSON.parse(readFileSync(log, 'utf8'))).toEqual([]);
      // Two runs interleaved, as the Dragon's two passes were: each writes only its new entries, after reading the file.
      appendToLog(log, [{ id: 'first-run:a' }]);
      appendToLog(log, [{ id: 'second-run:a' }]);
      appendToLog(log, [{ id: 'first-run:b' }]);
      appendToLog(log, []);
      expect(JSON.parse(readFileSync(log, 'utf8')).map((entry: { id: string }) => entry.id)).toEqual(['first-run:a', 'second-run:a', 'first-run:b']);
      expect(readdirSync(root)).toEqual(['log.json']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
    // The run no longer rewrites the log from the copy it read at start.
    const source = readFileSync(join(process.cwd(), 'tools', 'art', 'finalImages.ts'), 'utf8');
    expect(source).toContain('appendToLog(logPath, newEntries.splice(0))');
    expect(source).not.toMatch(/writeFileSync\(logPath/);
  });

  it('keeps closed interiors closed and shows nothing built far away outside unless the staging names it', () => {
    for (const [id, staging] of Object.entries(STAGING)) {
      const closed = staging.light === 'interior' && !staging.skyVisible;
      expect(prompt(id).includes(CLOSED_INTERIOR_RULE), id).toBe(closed);
      expect(prompt(id).includes(NOTHING_BUILT_FAR_RULE), id).toBe(!closed);
    }
    expect(prompt('dragon:refuge:dragon-second-refuge')).toContain('no window and no opening onto the outside');
    expect(prompt('dragon:scene:dragon_terrorized_village')).toContain(NOTHING_BUILT_FAR_RULE);
  });

  it('keeps the host clan’s carvings and objects out of another clan’s place', () => {
    expect(prompt('dragon:scene:dragon_wolf_lair')).toContain('the other clans’ places show none of the Dragon clan’s carvings, emblems or objects');
    expect(heraldryFor('scorpion', 'Tableau : le Temple du Phénix')).toContain('the other clans’ places show none of the Scorpion clan’s carvings, emblems or objects');
  });

  it('never draws the Shadows in purple, wherever a brief names them or their corruption', () => {
    for (const id of ['dragon:enemy:shadow_wyrm', 'dragon:actor:shadow_shaman', 'scorpion:actor:shadow_prophet',
      'scorpion:enemy:shadow_zealot', 'scorpion:scene:scorpion_corrupted_texts']) expect(prompt(id), id).toContain(SHADOWS_COLOUR_RULE);
    expect(prompt('bear:scene:bear_arrival')).not.toContain(SHADOWS_COLOUR_RULE);
  });

  it('gives no character anything that could pass for the plateau’s sacred object', () => {
    for (const item of plan.filter((candidate) => candidate.kind === 'character' && !CREATURE_IDS.includes(candidate.id))) {
      const rule = SACRED_OBJECT_RULES[item.chapter];
      if (rule) expect(item.prompt, item.id).toContain(rule);
    }
    expect(prompt('dragon:actor:kaelen')).toContain('nothing that could pass for the Echo Crystal');
    expect(prompt('scorpion:actor:grand_inquisitor')).toContain('nothing that could pass for the Phoenix’s prophetic codex');
    expect(prompt('bear:actor:borin')).not.toContain('could pass for');
  });

  it('puts each unit’s combat weapon in its hands, read from the combat runtime', () => {
    expect(prompt('dragon:enemy:wolf_hunter')).toContain('« Fronde » (a sling): show that weapon clearly in hand');
    expect(prompt('dragon:enemy:wolf_champion')).toContain('« Lames de jet » (throwing knives)');
    expect(prompt('scorpion:actor:phoenix_guardian_chief')).toContain('« Lance de flamme » (a spear)');
    expect(prompt('scorpion:enemy:phoenix_guardian')).toContain('« Lance du temple » (a spear)');
    expect(prompt('scorpion:actor:scorpion_scholar')).toContain('« Bâton » (a staff)');
    expect(prompt('scorpion:actor:grand_inquisitor')).toContain('fights with magic (« Sceau »)');
    expect(prompt('scorpion:actor:shadow_prophet')).toContain('fights with magic (« Onde froide »)');
    expect(prompt('finale:enemy:serpent_champion')).toContain('« Lame Serpent » (a blade)');
    expect(prompt('finale:enemy:demon_brute')).toContain('its own claws');
    // A character who never fights, and a beast, get no weapon sentence.
    expect(prompt('scorpion:actor:phoenix_faithful')).not.toContain('In combat it fights');
    expect(prompt('dragon:enemy:shadow_wyrm')).not.toContain('In combat it fights');
    // A keyed unit wins over a boss line; a boss is found by its chapter's combats and its portrait.
    const source = [
      "  {team:'foe',name:'Boss',portrait:'/assets/x/stand_in.png',weapons:[{name:'Grande hache',type:'phys'}],combatIds:['scorpion_trial']},",
      "  {team:'foe',name:'Other',portrait:'/assets/x/stand_in.png',weapons:[{name:'Fronde',type:'phys'}],combatIds:['bear_trial']},",
      "  guard:{team:'foe',name:'Guard',weapons:[{name:'Lance',type:'phys'}]},",
    ].join('\n');
    expect(combatWeaponOf('scorpion', 'guard', null, source)).toEqual({ name: 'Lance', type: 'phys' });
    expect(combatWeaponOf('scorpion', 'boss', 'stand_in', source)).toEqual({ name: 'Grande hache', type: 'phys' });
    expect(combatWeaponOf('dragon', 'boss', 'stand_in', source)).toBeNull();
    expect(weaponRule({ name: 'Onde froide', type: 'mag' })).toMatch(/^In combat it fights with magic/);
  });
});

describe('final images: looks and combat weapons agree', () => {
  it('draws every character that fights with the weapon of its combat unit (Borin’s hammer, the Bear warrior’s spear)', () => {
    const plan = buildPlan();
    const NOUNS = ['crossbow', 'sling', 'bow', 'spear', 'axe', 'hammer', 'mace', 'sword', 'dagger', 'pickaxe', 'staff', 'knives', 'blade', 'flail'];
    const named = (text: string, noun: string) => new RegExp(`\\b${noun}s?\\b`, 'i').test(text);
    let checked = 0;
    for (const item of plan) {
      const fights = /In combat it fights with « ([^»]+) » \((?:an? )?(?:war )?([^)]+)\)/.exec(item.prompt);
      if (!fights || !item.notes) continue;
      const noun = fights[2]!.split(' ').pop()!;
      // A look that names no weapon leaves it to the weapon sentence; one that names weapons must name this one.
      if (!NOUNS.some((candidate) => named(item.notes, candidate))) continue;
      expect(named(item.notes, noun), `${item.id}: « ${fights[1]} » (${noun}) but the look says: ${item.notes}`).toBe(true);
      checked += 1;
    }
    expect(checked).toBeGreaterThanOrEqual(7);
    const prompt = (id: string) => plan.find((item) => item.id === id)!.prompt;
    expect(prompt('bear:actor:borin')).toContain('« Marteau de l’Ours » (a war hammer)');
    expect(prompt('bear:actor:bear_warrior')).toContain('« Lance de guerre » (a spear)');
  });
});

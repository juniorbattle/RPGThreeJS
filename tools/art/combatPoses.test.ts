import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { units, weaponById } from '../../src/game/catalog';
import { buildPlan, buildPoseBriefs, combatWeaponOf, COVERED_FACE_RULE, poseOut, SHADOWS_COLOUR_RULE } from './finalImages';
import { effectColours, hasFx, POSE_UNITS, POSES, poseReference, poseSize, unitsOf } from './combatPosesTable';

const ROOT = join(__dirname, '..', '..');
// The master-only sheets of tools/pixel-sprites/build_combat_sprites.py, with their height on screen.
const MASTER_ONLY = new Map([...readFileSync(join(ROOT, 'tools/pixel-sprites/build_combat_sprites.py'), 'utf8')
  .matchAll(/^ {4}'([a-z_]+)': \('[^']+', ([\d.]+)\),/gm)].map((m) => [m[1]!, Number(m[2])]));
// Out of scope (draft COMBAT_POSES_SCOPE_2026-11-13): civilians seen only in dialogue, and two archive units no fight uses.
const EXCLUDED = ['raven_messenger', 'bear_miner', 'wolf_envoy', 'wolf_captive', 'dragon_villager', 'dragon_pilgrim',
  'phoenix_faithful', 'phoenix_captive', 'finale_civilian', 'finale_citizen', 'troll', 'undead_champion'];
const HEROES = ['aldric', 'morvan', 'lyra', 'eldwin', 'talon', 'gunnar'];

describe('combat poses of the new units (OD-2026-11-13-A)', () => {
  it('covers the 37 fighters of the master-only sheets and Maelor, and nothing else', () => {
    expect(MASTER_ONLY.size).toBe(49);
    const fighters = [...MASTER_ONLY.keys()].filter((id) => !EXCLUDED.includes(id));
    expect(fighters).toHaveLength(37);
    expect(Object.keys(POSE_UNITS).sort()).toEqual([...fighters, 'maelor'].sort());
    expect(unitsOf('heroes')).toEqual(HEROES);
  });

  it('starts every unit from its validated master, at the height of its former master-only sheet', () => {
    for (const [id, unit] of Object.entries(POSE_UNITS)) {
      expect(existsSync(join(ROOT, unit.master)), id).toBe(true);
      expect(unit.worldHeight, id).toBe(id === 'maelor' ? 4.1 : MASTER_ONLY.get(id));
    }
  });

  it('keeps faces covered, moves right and keeps the Shadows black, in every pose brief', () => {
    for (const brief of buildPoseBriefs(Object.keys(POSE_UNITS), 'pose', () => true)) {
      const unit = POSE_UNITS[brief.unitId]!;
      expect(brief.prompt, brief.unitId).toContain('faces and moves to the RIGHT');
      expect(brief.prompt.includes(COVERED_FACE_RULE), brief.unitId).toBe(unit.body !== 'quadruped');
      expect(brief.prompt.includes(SHADOWS_COLOUR_RULE), brief.unitId).toBe(unit.colour === 'ink');
      expect(brief.prompt, brief.unitId).toContain(unit.weapon);
      expect(brief.prompt, brief.unitId).toMatch(/no visual effects|No other visual effect/);
    }
  });

  it('bakes effects like the demo: both poses for the heroes, every cast, and never a purple effect but Eldwin\'s arcane', () => {
    for (const [id, unit] of Object.entries(POSE_UNITS)) {
      expect(hasFx(unit, 'cast'), id).toBe(true);
      expect(hasFx(unit, 'dash'), id).toBe(false);
      if (HEROES.includes(id)) expect(hasFx(unit, 'attack'), id).toBe(true);
      for (const colour of [unit.colour, unit.castColour].filter(Boolean)) {
        const sentence = effectColours(colour!);
        if (colour === 'arcane') expect(id).toBe('eldwin');
        else expect(sentence, id).toMatch(/never purple|Never purple/);
      }
    }
    // Spears, blunt weapons, slings and claws carry no attack effect, as in the demo.
    for (const id of ['borin', 'raven_miner_chief', 'bear_warrior', 'raven_miner', 'dragon_guardian', 'wolf_hunter',
      'phoenix_guardian', 'phoenix_guardian_chief', 'phoenix_champion', 'corrupted_beast', 'depth_beast', 'demon_brute',
      'demon_champion', 'breach_demon']) expect(hasFx(POSE_UNITS[id]!, 'attack'), id).toBe(false);
  });

  it('draws dash first, then attack and cast with the dash as reference, then edits them for their effects', () => {
    const none = buildPoseBriefs(['borin'], 'pose', () => false);
    expect(none.map((brief) => brief.references)).toEqual(POSES.map((pose) => [poseReference('borin', pose)]));
    expect(none.map((brief) => brief.references[0])).toEqual(['tmp/combat-poses/refs/borin__stand.png', 'tmp/combat-poses/refs/borin__attack.png', 'tmp/combat-poses/refs/borin__stand.png']);
    const withDash = buildPoseBriefs(['borin'], 'pose', () => true);
    expect(withDash.find((brief) => brief.pose === 'attack')!.references).toEqual([poseReference('borin', 'attack'), poseOut('borin', 'dash')]);
    expect(withDash[0]!.prompt).toContain('at exactly the size it has in the first image');
    const fx = buildPoseBriefs(['borin', 'kaelen'], 'fx');
    expect(fx.map((brief) => `${brief.unitId}:${brief.pose}`)).toEqual(['borin:cast', 'kaelen:attack', 'kaelen:cast']);
    expect(fx[0]!.references).toEqual([poseOut('borin', 'cast'), POSE_UNITS.borin!.master]);
    expect(fx[0]!.out).toBe(poseOut('borin', 'cast', true));
    expect(fx[0]!.prompt).toContain('Do not redraw or move it.');
  });

  it('draws every pose on one square canvas, wide only for a four-legged beast', () => {
    for (const pose of POSES) expect(poseSize(POSE_UNITS.lyra!, pose)).toBe('1024x1024');
    for (const pose of POSES) expect(poseSize(POSE_UNITS.shadow_wyrm!, pose)).toBe('1536x1024');
  });

  it('names in combat, for every unit that fights, the weapon its master and its poses draw (OD-2026-11-12-A, OD-2026-11-13-D, OD-2026-11-13-F C5)', () => {
    // The six heroes fight with their class's weapon family (src/game/catalog.ts), whatever tier the forge gives them.
    const HERO_WEAPONS: Record<string, [type: string, noun: RegExp]> = {
      aldric: ['holy_mace', /\bmace\b/], morvan: ['scythe', /\bscythe\b/], lyra: ['rapier', /\brapier\b/],
      eldwin: ['wand', /\bscepter\b/], talon: ['shuriken', /\bshuriken\b/], gunnar: ['hand_cannon', /\bcannon\b/],
    };
    // Every other fighter: the weapon the combat runtime names (src/combat/legacyCombatRuntime.js) and what it holds.
    const WEAPONS: Record<string, [name: string, noun: RegExp]> = {
      borin: ['Marteau de l’Ours', /\bhammer\b/], raven_miner_chief: ['Marteau de guerre', /\bhammer\b/],
      raven_master_spy: ['Épée du Maître Espion', /\bsword\b/], raven_foreman: ['Épée de contremaître', /\bsword\b/],
      corrupted_beast: ['Charge', /\bhorns\b/], depth_beast: ['Jet de pierre', /\bstones?\b/],
      bear_warrior: ['Lance de guerre', /\bspear\b/], raven_scout: ['Épée d’éclaireur', /\bsword\b/], raven_miner: ['Pic de mineur', /\bpick/],
      kaelen: ['Bâton du Dragon', /\bstaff\b/], wolf_chief: ['Grande hache', /\baxe\b/], shadow_shaman: ['Onde froide', /\bmagic\b/],
      wolf_champion: ['Lames de jet', /\bthrowing knives\b/], shadow_wyrm: ['Souffle court', /\bbreath\b/],
      dragon_guardian: ['Lance de milice', /\bspear\b/], wolf_raider: ['Hache courte', /\baxe\b/], wolf_hunter: ['Fronde', /\bsling\b/],
      grand_inquisitor: ['Bâton de l’Inquisiteur', /\bstaff\b/], phoenix_guardian_chief: ['Lance de flamme', /\bspear\b/],
      shadow_prophet: ['Onde froide', /\bmagic\b/], phoenix_flamekeeper: ['Flamme du temple', /\bflame\b/],
      shadow_zealot: ['Onde froide', /\bmagic\b/], phoenix_guardian: ['Lance du temple', /\bspear\b/], scorpion_scholar: ['Bâton', /\bstaff\b/],
      serpent_champion: ['Lame Serpent', /\bblade\b/], demon_champion: ['Griffes', /\bclaws\b/], breach_entity: ['Onde froide', /\bmagic\b/],
      raven_champion: ['Dagues du Corbeau', /\bdaggers?\b/], phoenix_champion: ['Lance du temple', /\bspear\b/],
      demon_brute: ['Griffes', /\bclaws\b/], breach_demon: ['Griffes', /\bclaws\b/], maelor: ['Onde froide', /\bmagic\b/],
    };
    // The corrupted beast, drawn with horns and hooves, charges (« Charge », the operator's choice of 2026-11-13) instead of
    // the « Griffes » this test found (docs/reports/bilan-combat-2026-11-13.md). No gap is left awaiting the operator.
    const AWAITING_OPERATOR = new Set<string>();
    expect(Object.keys({ ...HERO_WEAPONS, ...WEAPONS }).sort()).toEqual(Object.keys(POSE_UNITS).sort());
    for (const [unitId, [type, noun]] of Object.entries(HERO_WEAPONS)) {
      const hero = units.find((unit) => unit.visualProfileId === unitId)!;
      expect(hero.allowedWeaponIds.map((id) => weaponById.get(id)!.type), unitId).toEqual(hero.allowedWeaponIds.map(() => type));
      expect(`${POSE_UNITS[unitId]!.look} ${POSE_UNITS[unitId]!.weapon}`, unitId).toMatch(noun);
    }
    const plan = buildPlan();
    let briefs = 0;
    for (const [unitId, [name, noun]] of Object.entries(WEAPONS)) {
      const unit = POSE_UNITS[unitId]!;
      const chapter = unit.group as Parameters<typeof combatWeaponOf>[0];
      expect(combatWeaponOf(chapter, unitId, unitId === 'maelor' ? 'maelor' : null)?.name, unitId).toBe(name);
      if (AWAITING_OPERATOR.has(unitId)) expect(`${unit.look} ${unit.weapon}`, unitId).not.toMatch(noun);
      else expect(`${unit.look} ${unit.weapon}`, unitId).toMatch(noun);
      // Its final-image brief, when it has a weapon sentence, asks for that same weapon.
      const brief = plan.find((item) => item.kind === 'character' && item.id.endsWith(`:${unitId}`))?.prompt ?? '';
      if (!brief.includes('In combat it fights')) continue;
      expect(brief, unitId).toContain(`« ${name} »`);
      const drawn = /In combat it fights with « [^»]+ » \(([^)]+)\)/.exec(brief)?.[1];
      if (drawn) expect(drawn, unitId).toMatch(noun);
      briefs += 1;
    }
    expect(briefs).toBeGreaterThanOrEqual(20);
  });
});

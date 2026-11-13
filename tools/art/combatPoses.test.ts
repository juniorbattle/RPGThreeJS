import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildPoseBriefs, COVERED_FACE_RULE, poseOut, SHADOWS_COLOUR_RULE } from './finalImages';
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
});

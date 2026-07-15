import { describe, expect, it } from 'vitest';
import { skillById } from '../game/skills';
import {
  HERO_SKILL_IDS,
  SKILL_MOTION_PRESET_IDS,
  SKILL_VFX_PRESET_IDS,
  getSkillPresentation,
} from './skillPresentation';

const heroSkills = HERO_SKILL_IDS.map((id) => {
  const skill = skillById.get(id);
  if (!skill) throw new Error(`Missing hero skill definition: ${id}`);
  return skill;
});

describe('hero skill action contracts', () => {
  it('keeps exactly 48 explicit hero skill presentations', () => {
    expect(HERO_SKILL_IDS).toHaveLength(48);
    expect(new Set(HERO_SKILL_IDS).size).toBe(48);

    for (const skill of heroSkills) {
      const presentation = getSkillPresentation({ key: skill.id });
      expect(presentation).toBeDefined();
      expect(SKILL_MOTION_PRESET_IDS).toContain(presentation?.motionPreset);
      expect(SKILL_VFX_PRESET_IDS).toContain(presentation?.vfxPreset);
    }
  });

  it('gives every hero one action at 2, 3, 4 and 5 AP', () => {
    for (let index = 0; index < HERO_SKILL_IDS.length; index += 4) {
      const costs = heroSkills.slice(index, index + 4).map((skill) => skill.ap);
      expect(costs).toEqual([2, 3, 4, 5]);
    }
  });

  it('marks each five AP hero action as an ultimate presentation without changing its AP', () => {
    for (const skill of heroSkills) {
      const presentation = getSkillPresentation({ key: skill.id });
      expect(presentation?.ultimate).toBe(skill.ap === 5 || undefined);
      expect('ap' in (skill.upgradeLevel1 ?? {})).toBe(false);
      expect('ap' in (skill.upgradeLevel2 ?? {})).toBe(false);
    }
  });

  it('uses explicit contracts for ally targeting, selected revival and special movement', () => {
    expect(skillById.get('e_vigor_rune')).toMatchObject({ targetMode: 'ally' });
    expect(skillById.get('e_transpose')).toMatchObject({
      targetMode: 'ally', mode: 'swap', movePhase: 'before',
    });
    expect(skillById.get('ni_shadow_step')).toMatchObject({
      targetMode: 'enemy', mode: 'strike', movePhase: 'before',
    });
    expect(skillById.get('ni_silent_assassin')).toMatchObject({
      targetMode: 'enemy', mode: 'strike', movePhase: 'before',
    });
    expect(skillById.get('l_haft_recoil')).toMatchObject({ mode: 'retreat', movePhase: 'after' });
    expect(skillById.get('ar_explosive_retreat')).toMatchObject({ mode: 'retreat', movePhase: 'after' });
    expect(skillById.get('p_interpose')).toMatchObject({ mode: 'leap', movePhase: 'before' });
    expect(skillById.get('w_miracle')?.effects?.[0]).toMatchObject({
      kind: 'revive', targetSource: 'selected',
    });
  });

  it('keeps healing, purification and hybrid ultimates as real multi-effect actions', () => {
    expect(skillById.get('w_purify')?.effects).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'heal', targetSource: 'selected' }),
      expect.objectContaining({ kind: 'dispel', dispelType: 'negative', targetSource: 'selected' }),
    ]));
    expect(skillById.get('p_holy_strike')?.effects).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'damage', target: 'enemies' }),
      expect.objectContaining({ kind: 'status', target: 'caster', status: 'barrier' }),
    ]));
    expect(skillById.get('p_radiant_judgement')?.effects).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'damage', target: 'enemies' }),
      expect.objectContaining({ kind: 'heal', target: 'allies' }),
    ]));
    expect(skillById.get('n_teleport')?.upgradeLevel2).toMatchObject({
      additionalStatus: 'barrier', additionalStatusTarget: 'self',
    });
  });
});

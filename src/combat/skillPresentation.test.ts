import { describe, expect, it } from 'vitest';
import { skillById } from '../game/skills';
import { VFX_PRESET_IDS } from './vfx/VfxPresets';
import {
  CINEMATIC_PHASE_TYPES,
  getCinematicPlayablePhases,
  validateCinematicDescriptor,
} from './vfx/VfxSystem';
import type { CinematicDescriptor } from './vfx/VfxTypes';
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

const HERO_ULTIMATE_IDS = [
  'w_lion_surge', 'p_radiant_judgement', 'd_devouring_eclipse',
  'l_firmament_lance', 'n_dark_meteor', 'w_miracle',
  'r_perfect_duality', 'e_absolute_harmony', 'a_zenith_arrow',
  'ni_silent_assassin', 'ro_fault_breaker', 'ar_artillery_barrage',
] as const;

const BOSS_SIGNATURE_IDS = [
  'boss_slam', 'boss_quake', 'boss_apocalypse', 'boss_execution',
  'boss_flurry', 'boss_inferno', 'boss_titan_slam',
] as const;

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

  it('gives every hero ultimate a unique premium identity at visual tier five', () => {
    const presentations = HERO_ULTIMATE_IDS.map((id) => getSkillPresentation({ key: id }));
    expect(presentations).not.toContain(undefined);
    expect(new Set(presentations.map((presentation) => presentation?.vfxPreset)).size).toBe(12);
    for (const presentation of presentations) {
      expect(presentation).toMatchObject({ ultimate: true, visualTier: 5 });
      expect(VFX_PRESET_IDS).toContain(presentation?.vfxPreset);
    }
  });

  it('keeps boss signatures at the highest presentation tier with valid VFX', () => {
    for (const id of BOSS_SIGNATURE_IDS) {
      const presentation = getSkillPresentation({ key: id });
      expect(presentation?.visualTier).toBe(6);
      expect(VFX_PRESET_IDS).toContain(presentation?.vfxPreset);
    }
  });

  it('only references registered motion and VFX presets', () => {
    for (const id of HERO_SKILL_IDS) {
      const presentation = getSkillPresentation({ key: id });
      expect(SKILL_MOTION_PRESET_IDS).toContain(presentation?.motionPreset);
      expect(VFX_PRESET_IDS).toContain(presentation?.vfxPreset);
    }
  });

  it('uses directional and scale-aware visual contracts for V10F priority actions', () => {
    const contracts = [
      ['w_break_guard', 'sword_slash', 'source_to_target', '2ap'],
      ['l_long_thrust', 'thrust_line', 'source_to_target', '2ap'],
      ['l_haft_recoil', 'thrust_line', 'source_to_target', '3ap'],
      ['d_void_step', 'teleport_burst', 'source_to_destination', '3ap'],
      ['n_dark_bolt', 'shadow_lightning_bolt', 'source_to_target', '2ap'],
      ['p_holy_strike', 'holy_strike', 'source_to_target', '2ap'],
      ['a_arrow_rain', 'arrow_rain', 'center_on_aoe_origin', '4ap'],
      ['n_flame_wave', 'shape_cone_blast', 'align_cone', '4ap'],
      ['w_purify', 'support_holy_aura', 'center_on_target', '3ap'],
      ['e_binding_seal', 'root_vines', 'center_on_aoe_origin', '4ap'],
      ['ro_jaw_trap', 'root_vines', 'center_on_target', '4ap'],
      ['ro_tumble', 'leap_impact', 'source_to_destination', '3ap'],
      ['ar_explosive_retreat', 'impact_explosion_large', 'center_on_aoe_origin', '3ap'],
    ] as const;

    for (const [id, vfxPreset, orientation, scaleTier] of contracts) {
      expect(getSkillPresentation({ key: id })).toMatchObject({ vfxPreset, orientation, scaleTier });
      expect(VFX_PRESET_IDS).toContain(vfxPreset);
    }
  });

  it('keeps boss support and pin visuals at boss scale without boss-signature semantics', () => {
    for (const id of ['boss_guard', 'boss_regen', 'boss_fortify'] as const) {
      expect(getSkillPresentation({ key: id })).toMatchObject({ scaleTier: 'boss' });
      expect(getSkillPresentation({ key: id })?.visualTier).not.toBe(6);
    }
    expect(getSkillPresentation({ key: 'boss_pin' })).toMatchObject({
      orientation: 'source_to_target',
      scaleTier: 'boss',
    });
  });

  it('keeps dark lightning distinct from teleport and curse presentation', () => {
    expect(getSkillPresentation({ key: 'enemy_dark_bolt' })).toMatchObject({
      vfxPreset: 'shadow_lightning_bolt',
      orientation: 'source_to_target',
      scaleTier: '2ap',
    });
    expect(getSkillPresentation({ key: 'd_void_step' })?.vfxPreset).toBe('teleport_burst');
    expect(getSkillPresentation({ key: 'n_teleport' })?.vfxPreset).toBe('teleport_burst');
    expect(getSkillPresentation({ key: 'enemy_hex' })?.vfxPreset).toBe('status_curse_mark');
    expect(getSkillPresentation({ key: 'enemy_binding_shot' })).toMatchObject({
      vfxPreset: 'root_vines',
      orientation: 'center_on_target',
      scaleTier: '3ap',
    });
    expect(getSkillPresentation({ key: 'boss_freeze' })).toMatchObject({
      vfxPreset: 'frost_bind',
      orientation: 'center_on_target',
      scaleTier: 'boss',
    });
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

describe('V10G cinematic presentation infrastructure', () => {
  const fixture: CinematicDescriptor = {
    id: 'test_sky_descent_sequence',
    totalMs: 1200,
    impactAtMs: 760,
    phases: [
      { id: 'cast', type: 'cast', startMs: 0, durationMs: 240, preset: 'fireball', anchor: 'caster' },
      { id: 'warn', type: 'prePosition', startMs: 220, durationMs: 260, preset: 'guard_barrier', anchor: 'aoeOrigin' },
      {
        id: 'descent', type: 'travel', startMs: 430, durationMs: 330, preset: 'ultimate_dark_meteor',
        anchor: 'impactPoint', orientation: 'sky_descent',
        skyDescent: { startHeight: 5.5, lateralOffset: { x: 0.8, z: -0.6 } },
      },
      { id: 'impact', type: 'impact', startMs: 760, durationMs: 250, preset: 'impact_explosion_large', anchor: 'impactPoint' },
      {
        id: 'after', type: 'aftermath', startMs: 920, durationMs: 280, preset: 'move_smoke_burst', anchor: 'impactPoint',
        reducedGraphics: { skipSecondary: true },
      },
    ],
  };

  it('validates a fully staged descriptor using existing V10F presets only', () => {
    expect(CINEMATIC_PHASE_TYPES).toEqual(['cast', 'prePosition', 'travel', 'impact', 'aftermath']);
    expect(validateCinematicDescriptor(fixture)).toEqual([]);
  });

  it('rejects missing presets, invalid timing and invalid sky-descent placement', () => {
    const invalid: CinematicDescriptor = {
      ...fixture,
      impactAtMs: 1400,
      phases: [
        { ...fixture.phases[0]!, preset: 'raw/meteor_sheet' },
        { ...fixture.phases[2]!, type: 'impact' },
      ],
    };
    expect(validateCinematicDescriptor(invalid).join(' ')).toMatch(/impactAtMs|Unknown VFX preset|sky_descent/);
  });

  it('keeps all core phases in reduced graphics while allowing secondary aftermath to skip', () => {
    expect(getCinematicPlayablePhases(fixture, false).map((phase) => phase.id)).toEqual([
      'cast', 'warn', 'descent', 'impact', 'after',
    ]);
    expect(getCinematicPlayablePhases(fixture, true).map((phase) => phase.id)).toEqual([
      'cast', 'warn', 'descent', 'impact',
    ]);
  });

  it('leaves every shipped V10F skill on its stable playback until a future V10G lot opts in', () => {
    for (const id of [...HERO_SKILL_IDS, ...BOSS_SIGNATURE_IDS]) {
      expect(getSkillPresentation({ key: id })?.cinematic).toBeUndefined();
    }
  });
});

import { describe, expect, it } from 'vitest';
import {
  BASIC_ATTACK_VFX_MAPPINGS,
  getActionVfxAuditRows,
  getActionVfxChain,
  getActionsUsingSpriteSheet,
  getBasicAttackVfxPreset,
  getMissingOrUpgradeCandidateSprites,
  R3E2_SKILL_VFX_ACTION_IDS,
  R3E3_SKILL_VFX_ACTION_IDS,
  SKILL_VFX_ACTION_IDS,
} from './VfxActionRegistry';
import { HERO_SKILL_IDS, ENEMY_SKILL_IDS } from '../skillPresentation';
import { BASIC_ATTACK_VFX_PRESET_IDS, VFX_PRESET_IDS } from './VfxPresets';
import { VFX_SPRITE_SHEET_IDS } from './VfxSpriteSheets';

describe('VfxActionRegistry — V10G-R2A.6', () => {
  it('produces audit rows for all hero skills, enemy skills, items, feedback, and basic attacks', () => {
    const rows = getActionVfxAuditRows();
    const heroRows = rows.filter((r) => r.actionKind === 'heroSkill');
    const enemyRows = rows.filter((r) => r.actionKind === 'enemySkill');
    const bossRows = rows.filter((r) => r.actionKind === 'bossSkill');
    const itemRows = rows.filter((r) => r.actionKind === 'item');
    const feedbackRows = rows.filter((r) => r.actionKind === 'feedback');
    const basicRows = rows.filter((r) => r.actionKind === 'basicAttack');

    expect(heroRows.length).toBe(HERO_SKILL_IDS.length);
    expect(enemyRows.length + bossRows.length).toBe(ENEMY_SKILL_IDS.length);
    expect(itemRows.length).toBe(5);
    expect(feedbackRows.length).toBe(3);
    expect(basicRows.length).toBe(12);
  });

  it('every audit row resolves to a valid preset in the unified registry', () => {
    const rows = getActionVfxAuditRows();
    for (const row of rows) {
      expect(VFX_PRESET_IDS).toContain(row.presetId);
    }
  });

  it('every audit row is strict spritesheet compliant', () => {
    const rows = getActionVfxAuditRows();
    for (const row of rows) {
      expect(row.strictSpritesheetCompliant).toBe(true);
      expect(row.spriteSheetIds.length).toBeGreaterThan(0);
    }
  });

  it('R2C-C.1: native audit row spriteSheetIds exist in the registry; legacy IDs are unresolved', () => {
    const rows = getActionVfxAuditRows();
    const LEGACY_SPRITE_SHEET_IDS_LOCAL = new Set<string>([
      'basic_arrow_hit_small', 'basic_axe_chop_medium', 'basic_bite_snap_small', 'basic_blade_crescent_medium',
      'basic_body_slam_heavy', 'basic_bolt_hit_small', 'basic_bullet_hit_medium', 'basic_claw_rake_small',
      'basic_dagger_crosscut_small', 'basic_execution_slash_heavy', 'basic_greatsword_cleave_heavy',
      'basic_hammer_crush_heavy', 'basic_horn_ram_medium', 'basic_mace_impact_medium', 'basic_shield_bash_medium',
      'basic_shuriken_cut_small', 'basic_spear_stab_medium', 'basic_staff_strike_small', 'basic_sword_slash_heavy',
      'basic_sword_slash_small', 'basic_tail_whip_medium', 'basic_titan_crush_heavy',
      'skill_wind_slash_swirl_medium', 'skill_holy_radiance_burst_heavy', 'skill_barrier_guard_heavy',
      'skill_barrier_shield_ring_medium', 'skill_void_rune_orb_medium', 'skill_fire_impact_burst_medium',
      'skill_heal_blessing_bloom_heavy', 'skill_holy_sigil_burst_medium', 'skill_support_leaf_burst_medium',
      'skill_arcane_vortex_nova_heavy', 'skill_arcane_orbit_burst_medium', 'skill_arcane_sigil_burst_medium',
      'skill_fire_smoke_explosion_heavy', 'skill_poison_maw_bite_heavy', 'skill_ice_pillar_impact_heavy',
      'skill_fire_vortex_nova_heavy', 'skill_barrier_nature_guard_medium', 'skill_arcane_slash_burst_medium',
      'skill_meteor_impact_burst_heavy', 'skill_holy_light_pillar_medium', 'skill_void_singularity_implosion_ultimate',
      'skill_void_spiral_implosion_medium', 'skill_fire_spark_cluster_medium', 'skill_starburst_impact_medium',
    ]);
    for (const row of rows) {
      for (const id of row.spriteSheetIds) {
        if (LEGACY_SPRITE_SHEET_IDS_LOCAL.has(id)) {
          // Legacy IDs are retired — no longer in the registry
          expect(VFX_SPRITE_SHEET_IDS).not.toContain(id);
        } else {
          // Native IDs must be in the registry
          expect(VFX_SPRITE_SHEET_IDS).toContain(id);
        }
      }
    }
  });

  it('R2C-C.1: audit row runtime filenames match registry (empty for retired legacy)', () => {
    const rows = getActionVfxAuditRows();
    for (const row of rows) {
      expect(row.runtimeFilenames.length).toBe(row.spriteSheetIds.length);
      for (const filename of row.runtimeFilenames) {
        // Native sheets have .png filenames; retired legacy sheets return empty string
        if (filename) expect(filename).toMatch(/\.png$/);
      }
    }
  });

  it('getActionVfxChain returns the correct row for a known action', () => {
    const chain = getActionVfxChain('n_dark_meteor');
    expect(chain).toBeDefined();
    expect(chain!.presetId).toBe('ultimate_dark_meteor');
    expect(chain!.spriteSheetIds).toContain('skill_meteor_impact_burst_heavy');
  });

  it('maps every supported weapon type to exactly one validated basic presentation', () => {
    expect(BASIC_ATTACK_VFX_MAPPINGS).toHaveLength(12);
    expect(BASIC_ATTACK_VFX_MAPPINGS.map((mapping) => mapping.presetId)).toEqual(BASIC_ATTACK_VFX_PRESET_IDS);

    for (const mapping of BASIC_ATTACK_VFX_MAPPINGS) {
      expect(getBasicAttackVfxPreset({ key: 'attack', weaponType: mapping.weaponType })).toBe(mapping.presetId);
      expect(getActionVfxChain(mapping.actionId)?.spriteSheetIds).toEqual([mapping.spriteSheetId]);
    }

    expect(getBasicAttackVfxPreset({ key: 'w_whirl', weaponType: 'greatsword' })).toBeUndefined();
  });

  it('getActionsUsingSpriteSheet returns all actions sharing a sprite', () => {
    const actions = getActionsUsingSpriteSheet('basic_sword_slash_heavy');
    expect(actions.length).toBeGreaterThan(3);
    expect(actions).toContain('w_break_guard');
  });

  it('getMissingOrUpgradeCandidateSprites returns known temporary remaps', () => {
    const candidates = getMissingOrUpgradeCandidateSprites();
    expect(candidates.length).toBeGreaterThanOrEqual(3);
    const presetIds = candidates.map((c) => c.presetId);
    expect(presetIds).toContain('ultimate_radiant_judgement');
    expect(presetIds).not.toContain('boss_inferno');
  });

  it('upgrade candidates have suggested sprite IDs and priorities', () => {
    const candidates = getMissingOrUpgradeCandidateSprites();
    for (const c of candidates) {
      expect(c.upgrade).toBeDefined();
      expect(c.upgrade!.suggestedSpriteId).toBeTruthy();
      expect(['high', 'medium', 'low']).toContain(c.upgrade!.priority);
    }
  });

  it('registers every R3E-2 promoted action against a runtime skill or pilot preset', () => {
    expect(R3E2_SKILL_VFX_ACTION_IDS).toHaveLength(17);
    const pilotRemapped = new Set([
      'w_whirl', 'p_oathwall', 'n_flame_wave',
      'w_salvation', 'w_purify', 'w_sanctuary', 'e_binding_seal',
    ]);
    for (const actionId of R3E2_SKILL_VFX_ACTION_IDS) {
      const chain = getActionVfxChain(actionId);
      expect(chain).toBeDefined();
      if (pilotRemapped.has(actionId)) {
        expect(chain!.presetId).toMatch(/^pilot_/);
        expect(chain!.runtimeFilenames.every((filename) => filename.startsWith('r1_'))).toBe(true);
      } else {
        expect(chain!.presetId).toMatch(/^skill_/);
        // R2C-C.1: legacy skill sheets are retired — filenames may be empty
        const nonEmpty = chain!.runtimeFilenames.filter((f) => f);
        expect(nonEmpty.every((filename) => filename.includes('_skill_'))).toBe(true);
      }
    }
  });

  it('registers every R3E-3 promoted action against a runtime skill preset', () => {
    expect(R3E3_SKILL_VFX_ACTION_IDS).toHaveLength(1);
    expect(SKILL_VFX_ACTION_IDS).toHaveLength(18);
    for (const actionId of R3E3_SKILL_VFX_ACTION_IDS) {
      const chain = getActionVfxChain(actionId);
      expect(chain).toBeDefined();
      expect(chain!.presetId).toMatch(/^skill_/);
      // R2C-C.1: legacy skill sheets are retired — filenames may be empty
      const nonEmpty = chain!.runtimeFilenames.filter((f) => f);
      expect(nonEmpty.every((filename) => filename.includes('_skill_'))).toBe(true);
    }
  });
});

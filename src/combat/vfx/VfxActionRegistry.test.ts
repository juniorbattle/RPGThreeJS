import { describe, expect, it } from 'vitest';
import {
  BASIC_ATTACK_VFX_MAPPINGS,
  getActionVfxAuditRows,
  getActionVfxChain,
  getActionsUsingSpriteSheet,
  getBasicAttackVfxPreset,
  getMissingOrUpgradeCandidateSprites,
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

  it('every audit row spriteSheetId exists in the sprite sheet registry', () => {
    const rows = getActionVfxAuditRows();
    for (const row of rows) {
      for (const id of row.spriteSheetIds) {
        expect(VFX_SPRITE_SHEET_IDS).toContain(id);
      }
    }
  });

  it('every audit row has runtime filenames matching the registry', () => {
    const rows = getActionVfxAuditRows();
    for (const row of rows) {
      expect(row.runtimeFilenames.length).toBe(row.spriteSheetIds.length);
      for (const filename of row.runtimeFilenames) {
        expect(filename).toMatch(/\.png$/);
      }
    }
  });

  it('getActionVfxChain returns the correct row for a known action', () => {
    const chain = getActionVfxChain('n_dark_meteor');
    expect(chain).toBeDefined();
    expect(chain!.presetId).toBe('ultimate_dark_meteor');
    expect(chain!.spriteSheetIds).toContain('meteor_fall');
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
    const actions = getActionsUsingSpriteSheet('slash_arc');
    expect(actions.length).toBeGreaterThan(3);
    expect(actions).toContain('w_break_guard');
  });

  it('getMissingOrUpgradeCandidateSprites returns known temporary remaps', () => {
    const candidates = getMissingOrUpgradeCandidateSprites();
    expect(candidates.length).toBeGreaterThanOrEqual(9);
    const presetIds = candidates.map((c) => c.presetId);
    expect(presetIds).toContain('ultimate_radiant_judgement');
    expect(presetIds).toContain('ultimate_zenith_arrow');
    expect(presetIds).toContain('ultimate_fault_breaker');
    expect(presetIds).toContain('boss_inferno');
  });

  it('upgrade candidates have suggested sprite IDs and priorities', () => {
    const candidates = getMissingOrUpgradeCandidateSprites();
    for (const c of candidates) {
      expect(c.upgrade).toBeDefined();
      expect(c.upgrade!.suggestedSpriteId).toBeTruthy();
      expect(['high', 'medium', 'low']).toContain(c.upgrade!.priority);
    }
  });
});

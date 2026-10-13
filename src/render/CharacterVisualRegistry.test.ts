import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import runtimeManifest from './generated/characterSystemV2Manifest.json';
import {
  listCharacterVisualProfiles,
  resolveCharacterAsset,
  resolveCharacterUnitId,
  resolveCharacterVisualProfile,
} from './CharacterVisualRegistry';

describe('CharacterVisualRegistry', () => {
  it('keeps the generated runtime data byte-equivalent to the public production manifest', () => {
    const publicManifest = JSON.parse(readFileSync(
      join(process.cwd(), 'public', 'assets', 'characters', 'pixel', 'character-system-v2-manifest.json'),
      'utf8',
    ));
    expect(runtimeManifest).toEqual(publicManifest);
  });

  it('makes all 37 promoted masters authoritative for every non-combat role', () => {
    const profiles = listCharacterVisualProfiles();
    expect(profiles).toHaveLength(37);
    for (const profile of profiles) {
      expect(profile.master).toBe(`/assets/characters/pixel/masters/${profile.unitId}.png`);
      expect(profile.full).toBe(profile.master);
      expect(profile.dialogue).toBe(profile.full);
      expect(profile.ui).toBe(profile.full);
    }
    expect(profiles.filter((profile) => profile.combatPoseUnitId)).toHaveLength(27);
    expect(resolveCharacterVisualProfile('village_militia_spearman')?.combatPoseUnitId).toBe('village_militia_spearman');
    expect(resolveCharacterVisualProfile('village_militia_slinger')?.combatPoseUnitId).toBe('village_militia_slinger');
    expect(resolveCharacterVisualProfile('village_militia_brute')?.combatPoseUnitId).toBeUndefined();
  });

  it('resolves role-specific assets instead of overloading portrait', () => {
    expect(resolveCharacterAsset('warrior', 'master')).toBe('/assets/characters/pixel/masters/alistair.png');
    expect(resolveCharacterAsset('warrior', 'dialogue')).toBe('/assets/characters/pixel/masters/alistair.png');
    expect(resolveCharacterAsset('warrior', 'ui')).toBe('/assets/characters/pixel/masters/alistair.png');
    expect(resolveCharacterVisualProfile('kestrel')?.combatPoseUnitId).toBe('archer');
    expect(resolveCharacterUnitId('/assets/characters/pixel/masters/white_mage.png')).toBe('white_mage');
    expect(resolveCharacterUnitId('seraphine')).toBe('sage_seraphine');
    expect(resolveCharacterAsset('seraphine', 'dialogue')).toBe('/assets/characters/pixel/masters/sage_seraphine.png');
  });
});

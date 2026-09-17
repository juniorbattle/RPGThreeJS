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

  it('makes all 25 promoted masters authoritative without replacing full roles', () => {
    const profiles = listCharacterVisualProfiles();
    expect(profiles).toHaveLength(25);
    for (const profile of profiles) {
      expect(profile.master).toBe(`/assets/characters/pixel/masters/${profile.unitId}.png`);
      expect(profile.full).toMatch(/^\/assets\/characters\/pixel\/full\//);
      expect(profile.dialogue).toBe(profile.full);
      expect(profile.ui).toBe(profile.full);
      expect(profile.combatPoseUnitId).toBe(profile.unitId);
    }
  });

  it('resolves role-specific assets instead of overloading portrait', () => {
    expect(resolveCharacterAsset('warrior', 'master')).toBe('/assets/characters/pixel/masters/alistair.png');
    expect(resolveCharacterAsset('warrior', 'dialogue')).toBe('/assets/characters/pixel/full/alistair.png');
    expect(resolveCharacterAsset('warrior', 'ui')).toBe('/assets/characters/pixel/full/alistair.png');
    expect(resolveCharacterVisualProfile('kestrel')?.combatPoseUnitId).toBe('archer');
    expect(resolveCharacterUnitId('/assets/characters/pixel/full/marian.png')).toBe('white_mage');
  });
});

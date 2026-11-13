import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { units } from '../game/catalog';
import { assets } from './assetManifest';

// OD-2026-11-13-F (P2): the portraits of the six heroes met in the post-demo plateaux are their final images.
const SIX_HEROES = ['aldric', 'morvan', 'lyra', 'eldwin', 'talon', 'gunnar'] as const;

describe('final portraits of the six recruitable heroes (OD-2026-11-13-F, P2)', () => {
  it('approves their art and keeps one portrait path for the catalogue, dialogue, profile and combat', () => {
    const visualProfiles = assets.visualProfiles as Record<string, { artStatus?: string; category: string }>;
    const characterProfiles = assets.characterProfiles as Record<string, { full: string; dialogue: string; ui: string }>;
    const dialogueActors = assets.dialogueActors as Record<string, string>;
    const pixelFull = assets.pixelCharactersFull as Record<string, string>;
    for (const id of SIX_HEROES) {
      expect(visualProfiles[id]?.category, id).toBe('playable_hero');
      expect(visualProfiles[id]?.artStatus, id).toBe('approved');
      const portrait = pixelFull[id]!;
      expect(existsSync(join(process.cwd(), 'public', portrait)), portrait).toBe(true);
      expect([characterProfiles[id]?.full, characterProfiles[id]?.dialogue, characterProfiles[id]?.ui, dialogueActors[id]], id)
        .toEqual([portrait, portrait, portrait, portrait]);
      const unit = units.find((candidate) => candidate.visualProfileId === id);
      expect(unit?.portrait, id).toBe(portrait);
    }
  });
});

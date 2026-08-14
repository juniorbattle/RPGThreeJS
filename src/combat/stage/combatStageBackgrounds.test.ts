import { describe, expect, it } from 'vitest';
import { combatStageBackgroundFor } from './combatStageBackgrounds';

describe('combat stage backgrounds', () => {
  it('routes every Lion phase environment to its paired painted stage art', () => {
    const expectedTextures = {
      forest_route: '/assets/generated/lion-phase/combat-stage/forest_route_stage.webp',
      bois_clair_burning:
        '/assets/generated/lion-phase/combat-stage/bois_clair_burning_stage.webp',
      lion_sanctum: '/assets/generated/lion-phase/combat-stage/lion_sanctum_stage.webp',
    } as const;

    for (const [environmentId, texture] of Object.entries(expectedTextures)) {
      const background = combatStageBackgroundFor(environmentId);

      expect(background.id).toContain('stage-painted');
      expect(background.layers).toHaveLength(1);
      expect(background.layers[0]?.texture).toBe(texture);
      expect(background.layers[0]?.parallax).toBe(0);
    }
  });
});

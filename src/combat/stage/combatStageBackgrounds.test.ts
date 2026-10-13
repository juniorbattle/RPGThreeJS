import { describe, expect, it } from 'vitest';
import { combatStageBackgroundFor } from './combatStageBackgrounds';

describe('combat stage backgrounds', () => {
  it('routes every Lion phase environment to its paired painted stage art', () => {
    const expectedTextures = {
      forest_route: '/assets/generated/lion-phase/environments/demo-environment-pack-v1/combat-stage/forest-route-stage.png',
      bois_clair_burning:
        '/assets/generated/lion-phase/environments/demo-environment-pack-v1/combat-stage/bois-clair-burning-stage.png',
      lion_sanctum: '/assets/generated/lion-phase/environments/demo-environment-pack-v1/combat-stage/lion-sanctum-stage.png',
    } as const;

    for (const [environmentId, texture] of Object.entries(expectedTextures)) {
      const background = combatStageBackgroundFor(environmentId);

      expect(background.id).toContain('stage-painted');
      expect(background.layers).toHaveLength(1);
      expect(background.layers[0]?.texture).toBe(texture);
      expect(background.layers[0]?.parallax).toBe(0);
      expect(background.layers[0]?.failOnError).toBe(true);
    }

    expect(combatStageBackgroundFor('forest_route')).toMatchObject({
      combatStageGrounding: { contactShadowOpacity: 0.76, contactShadowScale: 1.2, contactShadowPitch: -1.2 },
      layers: [{ position: [0, 0.18, -8], size: [13.17, 7.4] }],
    });
    expect(combatStageBackgroundFor('bois_clair_burning')).toMatchObject({
      combatStageGrounding: { contactShadowOpacity: 0.82, contactShadowScale: 1.2, contactShadowPitch: -1.2 },
      layers: [{ position: [0, -0.04, -8], size: [13.17, 7.4] }],
    });
    expect(combatStageBackgroundFor('lion_sanctum')).toMatchObject({
      combatStageGrounding: { contactShadowOpacity: 0.76, contactShadowScale: 1.28, contactShadowPitch: -1.2 },
      layers: [{ position: [0, 0.6, -8], size: [13.17, 7.4] }],
    });
  });
});

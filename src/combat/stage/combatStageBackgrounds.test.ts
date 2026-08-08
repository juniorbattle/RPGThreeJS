import { describe, expect, it } from 'vitest';
import { combatStageBackgroundFor } from './combatStageBackgrounds';

describe('combat stage backgrounds', () => {
  it('routes only forest_route to the paired painted stage art', () => {
    const background = combatStageBackgroundFor('forest_route');

    expect(background.id).toBe('forest-route-stage-painted');
    expect(background.layers).toHaveLength(1);
    expect(background.layers[0]?.texture).toBe(
      '/assets/generated/lion-phase/combat-stage/forest_route_stage.webp',
    );
    expect(background.layers[0]?.parallax).toBe(0);
  });

  it('keeps other environments on their explicit stage fallback', () => {
    for (const environmentId of ['bois_clair_burning', 'lion_sanctum'] as const) {
      const background = combatStageBackgroundFor(environmentId);

      expect(background.id).toContain('placeholder');
      expect(background.layers[0]?.texture).toBeUndefined();
    }
  });
});

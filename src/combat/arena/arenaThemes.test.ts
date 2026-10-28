import { describe, expect, it } from 'vitest';
import { ARENA_THEMES, arenaBandProps, arenaThemeFor, propCrowdsPlatform } from './arenaThemes';
import { seeded } from './pixelArt';

describe('procedural combat arena themes', () => {
  it('provides one arena per combat scene and falls back to the forest route', () => {
    expect(Object.keys(ARENA_THEMES).sort()).toEqual(['bois_clair_burning', 'forest_route', 'lion_sanctum']);
    expect(arenaThemeFor('unknown').id).toBe('forest_route');
    expect(arenaThemeFor(undefined).id).toBe('forest_route');
  });

  it('never places decor on or against the 8×4 battle platform', () => {
    for (const theme of Object.values(ARENA_THEMES)) {
      for (const prop of [...theme.props, ...arenaBandProps(theme, seeded(1))]) {
        expect(propCrowdsPlatform(prop), `${theme.id}:${prop.kind}@${prop.x},${prop.z}`).toBe(false);
      }
    }
  });

  it('builds the mid-ground band deterministically and keeps the far-plate gap open', () => {
    for (const theme of Object.values(ARENA_THEMES)) {
      const a = arenaBandProps(theme, seeded(9));
      const b = arenaBandProps(theme, seeded(9));
      expect(a).toEqual(b);
      for (const prop of a) expect(Math.abs(prop.x)).toBeGreaterThanOrEqual(theme.band!.gap);
    }
  });

  it('ships a far plate for every theme', () => {
    for (const theme of Object.values(ARENA_THEMES)) expect(theme.farPlate.file).toMatch(/^\/assets\/generated\/combat-arena\/.+-far\.webp$/);
  });
});

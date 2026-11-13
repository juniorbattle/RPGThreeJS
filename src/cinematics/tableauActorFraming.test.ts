/**
 * Operator remark (2026-11-13): the six recruitable heroes stood about 1.5 times taller than the company in the static
 * dialogue tableaux, because their masters fill a taller canvas. The tableau now shows each hero's master re-framed,
 * without resampling, on the company's canvas convention (tools/art/frame_tableau_actors.py); portraits, the company
 * register and combat keep their pictures.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assets } from '../render/assetManifest';
import { actorImage } from './NarrativeSceneSurface';

const HEROES = ['aldric', 'morvan', 'lyra', 'eldwin', 'talon', 'gunnar'] as const;
const profiles = assets.characterProfiles as Record<string, { full: string; dialogue: string; ui: string; tableau?: string }>;

describe('the recruitable heroes framed like the company in the tableaux (operator remark, 2026-11-13)', () => {
  it('shows each hero’s re-framed picture in the tableau, and keeps its portrait and its master elsewhere', () => {
    for (const hero of HEROES) {
      const tableau = `/assets/characters/pixel/tableau/${hero}.png`;
      expect(profiles[hero]?.tableau, hero).toBe(tableau);
      expect(existsSync(join(process.cwd(), 'public', tableau)), hero).toBe(true);
      expect(actorImage(hero), hero).toBe(tableau);
      expect(profiles[hero]?.ui, hero).toBe(`/assets/characters/pixel/archive/non-demo/${hero}.png`);
    }
  });

  it('leaves every other character’s tableau picture as it was', () => {
    expect(Object.entries(profiles).filter(([, profile]) => profile.tableau).map(([id]) => id).sort()).toEqual([...HEROES].sort());
    expect(actorImage('alistair')).toBe('/assets/characters/pixel/masters/alistair.png');
    expect(actorImage('kestrel')).toBe('/assets/characters/pixel/masters/archer.png');
  });
});

import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { dialogues } from '../../src/game/content';
import { LION_POI_REGIONS } from '../../src/campaign/LionPoiMap';
import { listCombatPoseSets, resolveStrategicUnitVisual } from '../../src/combat/stage/CombatPoseRegistry';
import {
  ALARIC_AUDIENCE_TABLEAU, AUDIENCE_ROAD_DEPARTURE_TABLEAU, CAMP_DEPARTURE_TABLEAU, CHRONICLE_END_TABLEAU,
  FINAL_REFUGE_PREPARATION_TABLEAU, FOREST_AFTERMATH_TABLEAU, FOREST_THREAT_TABLEAU, VALMIR_FORK_TABLEAU,
  resolveNarrativeDialogueTableau,
} from '../../src/cinematics/NarrativeTableau';
import { demoEnvironmentPlateForContext } from '../../src/render/demoEnvironmentPack';
import { assets } from '../../src/render/assetManifest';
import { LIVING_TABLEAUX } from '../../src/ui/living/livingTableaux';

// OD-2026-11-15-A (P1, P2): files kept in the repository but removed from dist/ by vite.config.ts.
const list = JSON.parse(readFileSync('tools/build/production-excluded-public-assets.json', 'utf8')) as {
  groups: { id: string; files: string[] }[];
};
const excluded = list.groups.flatMap((group) => group.files);
const excludedUrls = new Set(excluded.map((file) => `/${file}`));

function expectShipped(urls: Iterable<string | undefined>, where: string): number {
  let checked = 0;
  for (const url of urls) {
    if (!url || !url.startsWith('/assets/')) continue;
    checked += 1;
    expect(excludedUrls.has(url), `${where} requests ${url}, which the build removes`).toBe(false);
    expect(existsSync(`public${url}`), `${where} requests ${url}, which is missing`).toBe(true);
  }
  expect(checked, `no ${where} image checked`).toBeGreaterThan(0);
  return checked;
}

describe('production build exclusions', () => {
  it('lists existing public files once each, and every PNG master has the WebP the game loads', () => {
    expect(new Set(excluded).size).toBe(excluded.length);
    for (const file of excluded) {
      expect(file.startsWith('assets/'), file).toBe(true);
      expect(existsSync(`public/${file}`), file).toBe(true);
    }
    const masters = list.groups.find((group) => group.id === 'png-masters')!.files;
    expect(masters).toHaveLength(29);
    for (const file of masters) expect(existsSync(`public/${file.replace(/\.png$/, '.webp')}`), file).toBe(true);
  });

  it('keeps every dialogue, boundary and living tableau backdrop in the build', () => {
    expect(expectShipped([...dialogues.values()].map((sequence) => resolveNarrativeDialogueTableau(sequence.id, sequence)?.stillImage), 'dialogue tableau')).toBeGreaterThan(50);
    expectShipped([
      CAMP_DEPARTURE_TABLEAU, AUDIENCE_ROAD_DEPARTURE_TABLEAU, ALARIC_AUDIENCE_TABLEAU, FOREST_THREAT_TABLEAU,
      FOREST_AFTERMATH_TABLEAU, VALMIR_FORK_TABLEAU, FINAL_REFUGE_PREPARATION_TABLEAU, CHRONICLE_END_TABLEAU,
    ].map((tableau) => tableau.stillImage), 'boundary tableau');
    expectShipped(Object.values(LIVING_TABLEAUX).flatMap((script) => script.shots.map((shot) => shot.image)), 'living tableau');
    expectShipped(Object.values(assets.prologueScenes), 'opening sequence');
  });

  it('keeps the refuge plates, the Lion atlases and every combat pose that combat reads', () => {
    expectShipped(['node:lion-second-refuge', 'node:lion-final-refuge']
      .map((context) => demoEnvironmentPlateForContext(context, 'HOLD_SOURCE').publicUrl), 'refuge');
    expectShipped(LION_POI_REGIONS.map((region) => region.image), 'Lion atlas');
    expectShipped(listCombatPoseSets().map((set) => resolveStrategicUnitVisual(set.unitId)?.src), 'combat pose');
  });
});

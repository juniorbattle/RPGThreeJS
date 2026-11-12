/**
 * Set 1.20.0 (post-demo): the POI atlas of each built plateau, chosen by the durable ID prefix of the company's POI.
 * Presentation only: positions, region art, trails and the region of a point. RunSystem owns connections and
 * eligibility. A provisional atlas (a draft plateau on reused art) is marked as such on the map.
 */
import { LION_POI_POSITIONS, LION_POI_REGIONS, LION_POI_REGION_EXITS, lionPoiMapPhase, lionPoiPathBends } from '../LionPoiMap';
import {
  BEAR_ATLAS_REGIONS,
  BEAR_POI_POSITIONS,
  BEAR_POI_REGION_EXITS,
  bearPoiMapPhase,
  bearPoiPathBends,
} from './bear/bearPresentation';
import {
  DRAGON_ATLAS_REGIONS,
  DRAGON_POI_POSITIONS,
  DRAGON_POI_REGION_EXITS,
  dragonPoiMapPhase,
  dragonPoiPathBends,
} from './dragon/dragonPresentation';
import {
  SCORPION_ATLAS_REGIONS,
  SCORPION_POI_POSITIONS,
  SCORPION_POI_REGION_EXITS,
  scorpionPoiMapPhase,
  scorpionPoiPathBends,
} from './scorpion/scorpionPresentation';
import {
  FINALE_ATLAS_REGIONS,
  FINALE_POI_POSITIONS,
  FINALE_POI_REGION_EXITS,
  finalePoiMapPhase,
  finalePoiPathBends,
} from './finale/finalePresentation';

export interface PoiAtlasRegion {
  shortTitle: string;
  title: string;
  image: string;
}

export interface PoiAtlas {
  regions: readonly PoiAtlasRegion[];
  positions: Readonly<Record<string, readonly [number, number]>>;
  exits: readonly (readonly [number, number])[];
  phaseOf: (nodeId: string) => number;
  pathBends: (from: string, to: string, region?: number) => readonly (readonly [number, number])[] | undefined;
  /** True while the atlas reuses another plateau's art: the map says so. */
  provisional: boolean;
}

export const LION_POI_ATLAS: PoiAtlas = Object.freeze({
  regions: LION_POI_REGIONS,
  positions: LION_POI_POSITIONS,
  exits: LION_POI_REGION_EXITS,
  phaseOf: lionPoiMapPhase,
  pathBends: lionPoiPathBends,
  provisional: false,
});

export const BEAR_POI_ATLAS: PoiAtlas = Object.freeze({
  regions: BEAR_ATLAS_REGIONS,
  positions: BEAR_POI_POSITIONS,
  exits: BEAR_POI_REGION_EXITS,
  phaseOf: bearPoiMapPhase,
  pathBends: bearPoiPathBends,
  // OD-2026-11-11-F (F1): the Bear's own atlases, on the Lion atlases' layout.
  provisional: false,
});

export const DRAGON_POI_ATLAS: PoiAtlas = Object.freeze({
  regions: DRAGON_ATLAS_REGIONS,
  positions: DRAGON_POI_POSITIONS,
  exits: DRAGON_POI_REGION_EXITS,
  phaseOf: dragonPoiMapPhase,
  pathBends: dragonPoiPathBends,
  // OD-2026-11-11-F (F1): the Dragon's own atlases, on the Lion atlases' layout.
  provisional: false,
});

export const SCORPION_POI_ATLAS: PoiAtlas = Object.freeze({
  regions: SCORPION_ATLAS_REGIONS,
  positions: SCORPION_POI_POSITIONS,
  exits: SCORPION_POI_REGION_EXITS,
  phaseOf: scorpionPoiMapPhase,
  pathBends: scorpionPoiPathBends,
  provisional: true,
});

export const FINALE_POI_ATLAS: PoiAtlas = Object.freeze({
  regions: FINALE_ATLAS_REGIONS,
  positions: FINALE_POI_POSITIONS,
  exits: FINALE_POI_REGION_EXITS,
  phaseOf: finalePoiMapPhase,
  pathBends: finalePoiPathBends,
  provisional: true,
});

/** The atlas of the plateau that owns a POI; every demo POI is the Lion's. */
export function poiAtlasForNode(nodeId: string): PoiAtlas {
  if (nodeId.startsWith('bear-')) return BEAR_POI_ATLAS;
  if (nodeId.startsWith('dragon-')) return DRAGON_POI_ATLAS;
  if (nodeId.startsWith('scorpion-')) return SCORPION_POI_ATLAS;
  if (nodeId.startsWith('finale-')) return FINALE_POI_ATLAS;
  return LION_POI_ATLAS;
}

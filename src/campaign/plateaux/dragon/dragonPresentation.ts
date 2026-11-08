/**
 * Set 1.20.0 (WORLD_AND_CHARACTERS "Provisional images"), post-demo Lot 2 — DRAFT presentation of the Dragon plateau.
 *
 * Every image here is PROVISIONAL: approved Lion backdrops and atlases reused, and existing characters standing in as
 * silhouettes for the Dragon's new characters. None is generated and none is a video. Each is listed with the final
 * image it awaits; the final images form a separate lot led with the operator. A provisional image is not production art
 * and never sets art direction. Presentation only: no game truth.
 */
import { LION_POI_POSITIONS, LION_POI_REGIONS, LION_POI_REGION_EXITS, lionPoiPathBends } from '../../LionPoiMap';
import type { ProvisionalActor, ProvisionalAtlasRegion } from '../bear/bearPresentation';
import { DRAGON_POI_METADATA } from './dragonTopology';

/** The Dragon's POIs stand where their Lion counterparts stand on the reused Lion atlases, as the Bear's do. */
const LION_COUNTERPART: Readonly<Record<string, string>> = Object.freeze({
  'dragon-camp': 'lion-camp', 'dragon-audience': 'lion-audience', 'dragon-opening-ambush': 'lion-opening-ambush',
  'dragon-wolf-envoy': 'lion-nomad-crossroads', 'dragon-terrorized-village': 'lion-refugees',
  'dragon-first-trial-event': 'lion-first-trial-event', 'dragon-first-trial-combat': 'lion-first-trial-combat',
  'dragon-first-refuge': 'lion-first-refuge', 'dragon-captive-wolf': 'lion-reserve-trail', 'dragon-cliff-road': 'lion-valmir-road',
  'dragon-second-trial-event': 'lion-second-trial-event', 'dragon-second-trial-combat': 'lion-second-trial-combat',
  'dragon-wolf-lair': 'lion-village-choice', 'dragon-second-refuge': 'lion-second-refuge', 'dragon-shaman-traces': 'lion-lancer-recruit',
  'dragon-freed-pilgrims': 'lion-witnesses', 'dragon-final-trial-event': 'lion-final-trial-event',
  'dragon-final-trial-combat': 'lion-final-trial-combat', 'dragon-crystal-altar': 'lion-shadow-signs',
  'dragon-final-refuge': 'lion-final-refuge', 'dragon-judgement': 'lion-final-judgement',
  'dragon-poi-foothill-supplies': 'lion-poi-opening-supplies', 'dragon-poi-foothill-wolves': 'lion-poi-opening-patrol',
  'dragon-poi-foothill-beasts': 'lion-poi-opening-wolves', 'dragon-poi-foothill-cache': 'lion-poi-opening-cache',
  'dragon-poi-terrace-supplies': 'lion-poi-valley-supplies', 'dragon-poi-terrace-ravine': 'lion-poi-valley-marsh',
  'dragon-poi-terrace-cache': 'lion-poi-valley-bridge-cache', 'dragon-poi-terrace-raiders': 'lion-poi-valley-serpent',
  'dragon-poi-peak-supplies': 'lion-poi-seal-witness-supplies', 'dragon-poi-peak-hunters': 'lion-poi-seal-hunters',
  'dragon-poi-peak-watch': 'lion-poi-seal-ruin-encounter', 'dragon-poi-peak-reserve': 'lion-poi-seal-ruin-supplies',
});

export const DRAGON_ATLAS_REGIONS: readonly ProvisionalAtlasRegion[] = Object.freeze([
  { shortTitle: 'I · Les contreforts', title: 'Des contreforts à l’ermitage du Dragon', image: LION_POI_REGIONS[0]!.image, provisional: true,
    awaitedFinal: 'Atlas I du Dragon : les contreforts des Pics Célestes jusqu’à l’ermitage' },
  { shortTitle: 'II · Les terrasses', title: 'Les terrasses et le repaire du Loup', image: LION_POI_REGIONS[1]!.image, provisional: true,
    awaitedFinal: 'Atlas II du Dragon : les terrasses, la paroi gravée et le repaire du Loup' },
  { shortTitle: 'III · Les cimes', title: 'Les cimes et le jugement de Kaelen', image: LION_POI_REGIONS[2]!.image, provisional: true,
    awaitedFinal: 'Atlas III du Dragon : les cimes, l’autel du Cristal et la salle de Kaelen' },
]);

export const DRAGON_POI_POSITIONS: Readonly<Record<string, readonly [number, number]>> = Object.freeze(Object.fromEntries(
  Object.entries(LION_COUNTERPART).map(([dragonId, lionId]) => [dragonId, LION_POI_POSITIONS[lionId]!]),
));
export const DRAGON_POI_REGION_EXITS = LION_POI_REGION_EXITS;

/** The reused atlas trails, followed by the Dragon's own edges between the same points. Presentation only. */
export function dragonPoiPathBends(from: string, to: string, region?: number): readonly (readonly [number, number])[] | undefined {
  const lionFrom = LION_COUNTERPART[from];
  const lionTo = LION_COUNTERPART[to];
  return lionFrom && lionTo ? lionPoiPathBends(lionFrom, lionTo, region) : undefined;
}

export function dragonPoiMapPhase(nodeId: string): number {
  return DRAGON_POI_METADATA[nodeId]?.region ?? 0;
}

/** Refuge hubs of the Dragon plateau, on reused Lion refuge plates. */
export const DRAGON_REFUGE_PRESENTATION = Object.freeze({
  'dragon-first-refuge': { environmentContext: 'dialogue:first_refuge_gathering', environmentRole: 'STATIC_TABLEAU' as const,
    eyebrow: 'Halte de la compagnie', description: 'Les moines de l’ermitage laissent le feu à la compagnie. Elle se prépare avant les terrasses.',
    gatheringDialogueId: 'dragon_hermitage_gathering', awaitedFinal: 'Fond de refuge : l’ermitage du Dragon accroché à la paroi' },
  'dragon-second-refuge': { environmentContext: 'node:lion-second-refuge', environmentRole: 'HOLD_SOURCE' as const,
    eyebrow: 'Halte de la compagnie', description: 'L’abri des pèlerins sent la neige et l’encens. La compagnie reprend son souffle.',
    awaitedFinal: 'Fond de refuge : l’abri des pèlerins sous les cimes' },
  'dragon-final-refuge': { environmentContext: 'node:lion-second-refuge', environmentRole: 'HOLD_SOURCE' as const,
    eyebrow: 'Avant le jugement', description: 'Une dernière veillée avant de comparaître devant Kaelen.',
    gatheringDialogueId: 'dragon_vigil', awaitedFinal: 'Fond de refuge : la veillée sur les Pics avant le jugement de Kaelen' },
});

/** Shared surfaces a Dragon run shows on demo art, beyond its scenes, atlases and refuges. */
export const DRAGON_PROVISIONAL_SURFACES: readonly { surface: string; standIn: string; awaitedFinal: string }[] = Object.freeze([
  { surface: 'Fin de chronique (Journey)', standIn: 'salle du jugement du Lion (CHRONICLE_END_TABLEAU)', awaitedFinal: 'Tableau de fin de chronique : la salle de Kaelen après le jugement' },
]);

/** New characters of the Dragon plateau, staged with existing silhouettes until their Character V2 masters exist. */
export const DRAGON_PROVISIONAL_ACTORS: readonly ProvisionalActor[] = Object.freeze([
  { actorId: 'kaelen', standInUnitId: 'survivor', awaitedFinal: 'Master Character V2 de l’Ancien Dragon Kaelen, portrait et sprite de boss' },
  { actorId: 'dragon_guardian', standInUnitId: 'village_militia_spearman', awaitedFinal: 'Sprite et portrait du gardien du Dragon' },
  { actorId: 'dragon_villager', standInUnitId: 'villageois', awaitedFinal: 'Portrait du villageois des contreforts' },
  { actorId: 'dragon_pilgrim', standInUnitId: 'villageoise', awaitedFinal: 'Portrait du pèlerin du Dragon' },
  { actorId: 'wolf_envoy', standInUnitId: 'refugee', awaitedFinal: 'Portrait de l’émissaire du Loup' },
  { actorId: 'wolf_captive', standInUnitId: 'serpent_raider', awaitedFinal: 'Portrait du guerrier du Loup blessé' },
  { actorId: 'wolf_chief', standInUnitId: 'serpent_elite_brute', awaitedFinal: 'Master Character V2 du chef du Clan du Loup, sprite de boss' },
  { actorId: 'shadow_shaman', standInUnitId: 'serpent_oracle', awaitedFinal: 'Master Character V2 du Chaman des Ombres, sprite de boss' },
]);

/** Enemy families of the Dragon plateau and the existing sprites standing in for them in combat. */
export const DRAGON_PROVISIONAL_ENEMIES: readonly { unitId: string; standInPortrait: string; awaitedFinal: string }[] = Object.freeze([
  { unitId: 'wolf_raider', standInPortrait: 'serpent_raider', awaitedFinal: 'Sprite du pillard du Loup' },
  { unitId: 'wolf_hunter', standInPortrait: 'village_militia_slinger', awaitedFinal: 'Sprite du chasseur du Loup' },
  { unitId: 'wolf_champion', standInPortrait: 'serpent_duelist_elite', awaitedFinal: 'Sprite d’élite du champion du Loup' },
  { unitId: 'shadow_wyrm', standInPortrait: 'young_dragon_elite', awaitedFinal: 'Sprite d’élite du wyrm corrompu des cimes' },
  { unitId: 'dragon_guardian', standInPortrait: 'village_militia_spearman', awaitedFinal: 'Sprite du gardien du Dragon' },
  { unitId: 'wolf_chief', standInPortrait: 'serpent_elite_brute', awaitedFinal: 'Sprite de boss du chef du Clan du Loup' },
  { unitId: 'shadow_shaman', standInPortrait: 'serpent_oracle', awaitedFinal: 'Sprite de boss du Chaman des Ombres' },
  { unitId: 'kaelen', standInPortrait: 'seal_guardian', awaitedFinal: 'Sprite de boss de l’Ancien Dragon Kaelen' },
]);

/**
 * Every scene of the Dragon and the approved Lion tableau it borrows until its own final tableau exists: the narrative
 * stage reads `environmentContext` for the scene's still image. Each entry names the final image it awaits.
 */
export const DRAGON_PROVISIONAL_SCENES: Readonly<Record<string, { environmentContext: string; awaitedFinal: string }>> = Object.freeze({
  dragon_arrival: { environmentContext: 'dialogue:post_opening_trail', awaitedFinal: 'Tableau : la compagnie au pied des Pics Célestes' },
  dragon_audience: { environmentContext: 'dialogue:lion_briefing', awaitedFinal: 'Tableau : la salle de l’Ancien Dragon Kaelen' },
  dragon_wolf_envoy: { environmentContext: 'dialogue:mystery_ambush', awaitedFinal: 'Tableau : l’émissaire du Loup sous un drapeau de trêve' },
  dragon_terrorized_village: { environmentContext: 'dialogue:refugee_trial', awaitedFinal: 'Tableau : le hameau barricadé des contreforts' },
  dragon_wolf_traps: { environmentContext: 'dialogue:pre_opening_trail', awaitedFinal: 'Tableau : les collets du Loup sur le sentier des pèlerins' },
  dragon_hermitage_gathering: { environmentContext: 'dialogue:first_refuge_gathering', awaitedFinal: 'Tableau : la compagnie à l’ermitage du Dragon' },
  dragon_captive_wolf: { environmentContext: 'dialogue:mystery_ambush', awaitedFinal: 'Tableau : le guerrier du Loup blessé au bord des terrasses' },
  dragon_crystal_clues: { environmentContext: 'dialogue:mystery_shrine', awaitedFinal: 'Tableau : la paroi gravée par les anciens du Dragon' },
  dragon_wolf_lair: { environmentContext: 'dialogue:shadow_signs', awaitedFinal: 'Tableau : le repaire du Loup et le Cristal sur un autel étranger' },
  dragon_pre_lair_assault: { environmentContext: 'dialogue:pre_ruins_guardians', awaitedFinal: 'Tableau : le chef du Loup devant le Cristal' },
  dragon_lair_assault_aftermath: { environmentContext: 'dialogue:post_ruins_guardians', awaitedFinal: 'Tableau : le Cristal d’Écho repris' },
  dragon_pre_lair_seizure: { environmentContext: 'dialogue:pre_ruins_guardians', awaitedFinal: 'Tableau : le chef du Loup face à une compagnie avide' },
  dragon_lair_seizure_aftermath: { environmentContext: 'dialogue:post_ruins_guardians', awaitedFinal: 'Tableau : le Cristal aux mains de la compagnie' },
  dragon_shaman_traces: { environmentContext: 'dialogue:serpent_informant', awaitedFinal: 'Tableau : la tente du chaman au camp déserté du Loup' },
  dragon_freed_pilgrims: { environmentContext: 'dialogue:witnesses_on_road', awaitedFinal: 'Tableau : les pèlerins libérés du repaire' },
  dragon_young_dragon: { environmentContext: 'dialogue:mystery_dragon_roost', awaitedFinal: 'Tableau : le jeune dragon blessé dans son nid' },
  dragon_crystal_altar: { environmentContext: 'dialogue:shadow_signs', awaitedFinal: 'Tableau : l’autel fendu du Cristal et sa souillure' },
  dragon_vigil: { environmentContext: 'dialogue:final_refuge', awaitedFinal: 'Tableau : la veillée sur les Pics avant le jugement' },
  dragon_judgement: { environmentContext: 'dialogue:lion_finale_judgement', awaitedFinal: 'Tableau : le jugement de Kaelen' },
  dragon_shaman_pre_combat: { environmentContext: 'dialogue:serpent_pursuit_pre_combat', awaitedFinal: 'Tableau : la traque du Chaman des Ombres' },
  dragon_shaman_aftermath: { environmentContext: 'dialogue:serpent_general_aftermath', awaitedFinal: 'Tableau : la chute du Chaman des Ombres' },
  dragon_kaelen_pre_combat: { environmentContext: 'dialogue:pre_lion_chief', awaitedFinal: 'Tableau : Kaelen et ses gardiens face à la compagnie' },
  dragon_trial_aftermath: { environmentContext: 'dialogue:lion_trial_aftermath', awaitedFinal: 'Tableau : l’épreuve du Dragon achevée' },
  dragon_epilogue: { environmentContext: 'dialogue:epilogue', awaitedFinal: 'Tableau : le Sceau du Dragon' },
});

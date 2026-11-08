/**
 * Set 1.20.0 (WORLD_AND_CHARACTERS "Provisional images"), post-demo Lot 1 — DRAFT presentation of the Bear plateau.
 *
 * Every image here is PROVISIONAL: approved Lion backdrops and atlases reused, and existing characters standing in as
 * silhouettes for the Bear's new characters. None is generated and none is a video. Each is listed with the final image
 * it awaits; the final images form a separate lot led with the operator. A provisional image is not production art and
 * never sets art direction. Presentation only: no game truth.
 */
import { LION_POI_POSITIONS, LION_POI_REGIONS, LION_POI_REGION_EXITS, lionPoiPathBends } from '../../LionPoiMap';
import { BEAR_POI_METADATA } from './bearTopology';

/** The Bear's POIs stand where their Lion counterparts stand on the reused Lion atlases. */
const LION_COUNTERPART: Readonly<Record<string, string>> = Object.freeze({
  'bear-camp': 'lion-camp', 'bear-audience': 'lion-audience', 'bear-opening-ambush': 'lion-opening-ambush',
  'bear-raven-messenger': 'lion-nomad-crossroads', 'bear-trapped-miners': 'lion-refugees',
  'bear-first-trial-event': 'lion-first-trial-event', 'bear-first-trial-combat': 'lion-first-trial-combat',
  'bear-first-refuge': 'lion-first-refuge', 'bear-ore-convoy': 'lion-reserve-trail', 'bear-mine-road': 'lion-valmir-road',
  'bear-second-trial-event': 'lion-second-trial-event', 'bear-second-trial-combat': 'lion-second-trial-combat',
  'bear-sacred-mines': 'lion-village-choice', 'bear-second-refuge': 'lion-second-refuge', 'bear-raven-camp': 'lion-lancer-recruit',
  'bear-miners-testimony': 'lion-witnesses', 'bear-final-trial-event': 'lion-final-trial-event',
  'bear-final-trial-combat': 'lion-final-trial-combat', 'bear-dark-vein': 'lion-shadow-signs',
  'bear-final-refuge': 'lion-final-refuge', 'bear-judgement': 'lion-final-judgement',
  'bear-poi-pass-supplies': 'lion-poi-opening-supplies', 'bear-poi-pass-patrol': 'lion-poi-opening-patrol',
  'bear-poi-pass-beasts': 'lion-poi-opening-wolves', 'bear-poi-pass-cache': 'lion-poi-opening-cache',
  'bear-poi-mine-supplies': 'lion-poi-valley-supplies', 'bear-poi-mine-gully': 'lion-poi-valley-marsh',
  'bear-poi-mine-lift-cache': 'lion-poi-valley-bridge-cache', 'bear-poi-mine-ravens': 'lion-poi-valley-serpent',
  'bear-poi-depths-supplies': 'lion-poi-seal-witness-supplies', 'bear-poi-depths-hunters': 'lion-poi-seal-hunters',
  'bear-poi-depths-watch': 'lion-poi-seal-ruin-encounter', 'bear-poi-depths-reserve': 'lion-poi-seal-ruin-supplies',
});

export interface ProvisionalAtlasRegion {
  shortTitle: string;
  title: string;
  image: string;
  provisional: true;
  awaitedFinal: string;
}

export const BEAR_ATLAS_REGIONS: readonly ProvisionalAtlasRegion[] = Object.freeze([
  { shortTitle: 'I · Les cols', title: 'Des cols à l’avant-poste de l’Ours', image: LION_POI_REGIONS[0]!.image, provisional: true,
    awaitedFinal: 'Atlas I de l’Ours : les cols des Montagnes de la Résilience jusqu’à l’avant-poste' },
  { shortTitle: 'II · Les mines', title: 'La route des mines sacrées', image: LION_POI_REGIONS[1]!.image, provisional: true,
    awaitedFinal: 'Atlas II de l’Ours : la route des mines et l’entrée des galeries sacrées' },
  { shortTitle: 'III · Le Sceau', title: 'Les galeries et le jugement de Borin', image: LION_POI_REGIONS[2]!.image, provisional: true,
    awaitedFinal: 'Atlas III de l’Ours : les galeries profondes, le filon sombre et la salle de Borin' },
]);

export const BEAR_POI_POSITIONS: Readonly<Record<string, readonly [number, number]>> = Object.freeze(Object.fromEntries(
  Object.entries(LION_COUNTERPART).map(([bearId, lionId]) => [bearId, LION_POI_POSITIONS[lionId]!]),
));
export const BEAR_POI_REGION_EXITS = LION_POI_REGION_EXITS;

const BEAR_FOR_LION: Readonly<Record<string, string>> = Object.freeze(Object.fromEntries(
  Object.entries(LION_COUNTERPART).map(([bearId, lionId]) => [lionId, bearId]),
));

/** The reused atlas trails, followed by the Bear's own edges between the same points. Presentation only. */
export function bearPoiPathBends(from: string, to: string, region?: number): readonly (readonly [number, number])[] | undefined {
  const lionFrom = LION_COUNTERPART[from];
  const lionTo = LION_COUNTERPART[to];
  return lionFrom && lionTo ? lionPoiPathBends(lionFrom, lionTo, region) : undefined;
}

export function bearPoiMapPhase(nodeId: string): number {
  return BEAR_POI_METADATA[nodeId]?.region ?? 0;
}

export function lionCounterpartOf(bearId: string): string | undefined {
  return LION_COUNTERPART[bearId];
}

export function bearCounterpartOf(lionId: string): string | undefined {
  return BEAR_FOR_LION[lionId];
}

/** Refuge hubs of the Bear plateau, on reused Lion refuge plates. */
export const BEAR_REFUGE_PRESENTATION = Object.freeze({
  'bear-first-refuge': { environmentContext: 'dialogue:first_refuge_gathering', environmentRole: 'STATIC_TABLEAU' as const,
    eyebrow: 'Halte de la compagnie', description: 'Les feux de l’avant-poste tiennent le vent des cols. La compagnie se prépare avant les mines.',
    gatheringDialogueId: 'bear_outpost_gathering' },
  'bear-second-refuge': { environmentContext: 'node:lion-second-refuge', environmentRole: 'HOLD_SOURCE' as const,
    eyebrow: 'Halte de la compagnie', description: 'L’abri des mineurs sent la pierre froide et la fumée. La compagnie reprend son souffle.' },
  'bear-final-refuge': { environmentContext: 'node:lion-second-refuge', environmentRole: 'HOLD_SOURCE' as const,
    eyebrow: 'Avant le jugement', description: 'Une dernière veillée avant de comparaître devant Borin.',
    gatheringDialogueId: 'bear_vigil' },
});

export interface ProvisionalActor {
  actorId: string;
  /** The existing Character V2 unit that stands in for this character until its master exists. */
  standInUnitId: string;
  awaitedFinal: string;
}

/** New characters of the Bear plateau, staged with existing silhouettes until their Character V2 masters exist. */
export const BEAR_PROVISIONAL_ACTORS: readonly ProvisionalActor[] = Object.freeze([
  { actorId: 'borin', standInUnitId: 'village_militia_brute', awaitedFinal: 'Master Character V2 de l’Ancien Ours Borin, portrait et sprite de boss' },
  { actorId: 'bear_warrior', standInUnitId: 'village_militia_spearman', awaitedFinal: 'Sprite et portrait du guerrier de l’Ours' },
  { actorId: 'bear_miner', standInUnitId: 'villageois', awaitedFinal: 'Portrait du mineur de l’Ours' },
  { actorId: 'raven_messenger', standInUnitId: 'serpent_raider', awaitedFinal: 'Portrait du messager du Corbeau' },
  { actorId: 'raven_miner_chief', standInUnitId: 'serpent_elite_brute', awaitedFinal: 'Master Character V2 du chef des mineurs du Corbeau, sprite de boss' },
  { actorId: 'raven_master_spy', standInUnitId: 'serpent_duelist_elite', awaitedFinal: 'Master Character V2 du Maître Espion du Corbeau, sprite de boss' },
]);

/** Enemy families of the Bear plateau and the existing sprites standing in for them in combat. */
export const BEAR_PROVISIONAL_ENEMIES: readonly { unitId: string; standInPortrait: string; awaitedFinal: string }[] = Object.freeze([
  { unitId: 'raven_scout', standInPortrait: 'serpent_raider', awaitedFinal: 'Sprite de l’éclaireur du Corbeau' },
  { unitId: 'raven_miner', standInPortrait: 'serpent_brute', awaitedFinal: 'Sprite du mineur du Corbeau' },
  { unitId: 'raven_foreman', standInPortrait: 'serpent_elite_brute', awaitedFinal: 'Sprite d’élite du contremaître du Corbeau' },
  { unitId: 'corrupted_beast', standInPortrait: 'forest_troll_elite', awaitedFinal: 'Sprite d’élite de la bête corrompue des montagnes' },
  { unitId: 'depth_beast', standInPortrait: 'forest_troll_elite', awaitedFinal: 'Sprite d’élite de la bête des profondeurs' },
  { unitId: 'bear_warrior', standInPortrait: 'village_militia_spearman', awaitedFinal: 'Sprite du guerrier de l’Ours' },
  { unitId: 'raven_miner_chief', standInPortrait: 'serpent_elite_brute', awaitedFinal: 'Sprite de boss du chef des mineurs du Corbeau' },
  { unitId: 'raven_master_spy', standInPortrait: 'serpent_duelist_elite', awaitedFinal: 'Sprite de boss du Maître Espion du Corbeau' },
  { unitId: 'borin', standInPortrait: 'village_militia_brute', awaitedFinal: 'Sprite de boss de l’Ancien Ours Borin' },
]);

/** Dialogue backdrops: approved Lion scenes reused provisionally, keyed by the Bear dialogue that shows them. */
export const BEAR_PROVISIONAL_SCENES: Readonly<Record<string, { sceneArtId: string; awaitedFinal: string }>> = Object.freeze({
  bear_arrival: { sceneArtId: 'forest_fork', awaitedFinal: 'Tableau : la compagnie au pied des Montagnes de la Résilience' },
  bear_audience: { sceneArtId: 'lion_briefing', awaitedFinal: 'Tableau : la salle de l’Ancien Ours Borin' },
  bear_raven_messenger: { sceneArtId: 'mystery_ambush', awaitedFinal: 'Tableau : le messager du Corbeau à l’écart du sentier' },
  bear_trapped_miners: { sceneArtId: 'forest_fork', awaitedFinal: 'Tableau : l’éboulement et les mineurs pris au piège' },
  bear_raven_traps: { sceneArtId: 'forest_fork', awaitedFinal: 'Tableau : les pièges du Corbeau sur le sentier' },
  bear_ore_convoy: { sceneArtId: 'reserve_trail', awaitedFinal: 'Tableau : le convoi de minerai sombre' },
  bear_ancient_relic: { sceneArtId: 'mystery_shrine', awaitedFinal: 'Tableau : la galerie effondrée et l’artefact' },
  bear_sacred_mines: { sceneArtId: 'shadow_signs', awaitedFinal: 'Tableau : l’entrée des mines sacrées occupées par le Corbeau' },
  bear_raven_camp: { sceneArtId: 'mystery_ambush', awaitedFinal: 'Tableau : le campement abandonné du Corbeau' },
  bear_miners_testimony: { sceneArtId: 'witnesses_on_road', awaitedFinal: 'Tableau : les mineurs libérés' },
  bear_mountain_shrine: { sceneArtId: 'mystery_shrine', awaitedFinal: 'Tableau : le sanctuaire de la montagne' },
  bear_dark_vein: { sceneArtId: 'shadow_signs', awaitedFinal: 'Tableau : le filon sombre au fond des galeries' },
  bear_judgement: { sceneArtId: 'lion_finale_judgement', awaitedFinal: 'Tableau : le jugement de Borin' },
  bear_epilogue: { sceneArtId: 'epilogue', awaitedFinal: 'Tableau : le Sceau de l’Ours' },
});

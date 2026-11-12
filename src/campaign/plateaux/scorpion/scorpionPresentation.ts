/**
 * Set 1.20.0 (WORLD_AND_CHARACTERS "Provisional images"), post-demo Lot 3 — presentation of the Scorpion plateau.
 * The plateau is canon (OD-2026-11-08-D).
 *
 * FINAL IMAGES (OD-2026-11-11-F, F1; identity and staging validated by the operator on 2026-11-12, « Validate as is »,
 * batch integrated on his order, « Intègre le Scorpion »): every scene, refuge, atlas, the chronicle end and the
 * Scorpion's nine characters show the plateau's own final images, made by tools/art/finalImages.ts and published by
 * tools/art/publish_final_images.py (provenance in tools/art/provenance/scorpion-final-images.json). Each entry keeps the
 * reused Lion art or stand-in it replaced and the brief it was made from (`awaitedFinal`). The atlases keep the Lion
 * atlases' layout, so the POI positions below stay valid. Presentation only: no game truth.
 */
import { LION_POI_POSITIONS, LION_POI_REGION_EXITS, lionPoiPathBends } from '../../LionPoiMap';
import type { ProvisionalActor, ProvisionalAtlasRegion } from '../bear/bearPresentation';
import { SCORPION_POI_METADATA } from './scorpionTopology';

const FINAL_IMAGES = '/assets/generated/post-demo/scorpion';
const FINAL_CHARACTERS = '/assets/characters/pixel/post-demo/scorpion';

/** The Scorpion's POIs stand where their Lion counterparts stand on the reused Lion atlases, as the Bear's do. */
const LION_COUNTERPART: Readonly<Record<string, string>> = Object.freeze({
  'scorpion-camp': 'lion-camp', 'scorpion-audience': 'lion-audience', 'scorpion-opening-ambush': 'lion-opening-ambush',
  'scorpion-scholars': 'lion-nomad-crossroads', 'scorpion-phoenix-faithful': 'lion-refugees',
  'scorpion-first-trial-event': 'lion-first-trial-event', 'scorpion-first-trial-combat': 'lion-first-trial-combat',
  'scorpion-first-refuge': 'lion-first-refuge', 'scorpion-warded-path': 'lion-reserve-trail', 'scorpion-ruin-road': 'lion-valmir-road',
  'scorpion-second-trial-event': 'lion-second-trial-event', 'scorpion-second-trial-combat': 'lion-second-trial-combat',
  'scorpion-phoenix-temple': 'lion-village-choice', 'scorpion-second-refuge': 'lion-second-refuge', 'scorpion-prophet-traces': 'lion-lancer-recruit',
  'scorpion-temple-witnesses': 'lion-witnesses', 'scorpion-final-trial-event': 'lion-final-trial-event',
  'scorpion-final-trial-combat': 'lion-final-trial-combat', 'scorpion-corrupted-texts': 'lion-shadow-signs',
  'scorpion-final-refuge': 'lion-final-refuge', 'scorpion-judgement': 'lion-final-judgement',
  'scorpion-poi-dune-supplies': 'lion-poi-opening-supplies', 'scorpion-poi-dune-serpents': 'lion-poi-opening-patrol',
  'scorpion-poi-dune-spiders': 'lion-poi-opening-wolves', 'scorpion-poi-dune-cache': 'lion-poi-opening-cache',
  'scorpion-poi-ruin-supplies': 'lion-poi-valley-supplies', 'scorpion-poi-ruin-sentinels': 'lion-poi-valley-marsh',
  'scorpion-poi-ruin-cache': 'lion-poi-valley-bridge-cache', 'scorpion-poi-ruin-serpents': 'lion-poi-valley-serpent',
  'scorpion-poi-sanctum-supplies': 'lion-poi-seal-witness-supplies', 'scorpion-poi-sanctum-guards': 'lion-poi-seal-hunters',
  'scorpion-poi-sanctum-watch': 'lion-poi-seal-ruin-encounter', 'scorpion-poi-sanctum-reserve': 'lion-poi-seal-ruin-supplies',
});

export const SCORPION_ATLAS_REGIONS: readonly ProvisionalAtlasRegion[] = Object.freeze([
  { shortTitle: 'I · Les dunes', title: 'Des dunes à l’oasis des érudits', image: `${FINAL_IMAGES}/atlases/region-1.webp`, provisional: false,
    awaitedFinal: 'Atlas I du Scorpion : les dunes des Déserts Arides jusqu’à l’oasis des érudits' },
  { shortTitle: 'II · Les ruines', title: 'Les ruines et le Temple du Phénix', image: `${FINAL_IMAGES}/atlases/region-2.webp`, provisional: false,
    awaitedFinal: 'Atlas II du Scorpion : les ruines, la bibliothèque ensevelie et le Temple du Phénix' },
  { shortTitle: 'III · Le sanctuaire', title: 'Le sanctuaire et le jugement du Grand Inquisiteur', image: `${FINAL_IMAGES}/atlases/region-3.webp`, provisional: false,
    awaitedFinal: 'Atlas III du Scorpion : le sanctuaire des cendres, les pages souillées et la salle du Grand Inquisiteur' },
]);

export const SCORPION_POI_POSITIONS: Readonly<Record<string, readonly [number, number]>> = Object.freeze(Object.fromEntries(
  Object.entries(LION_COUNTERPART).map(([scorpionId, lionId]) => [scorpionId, LION_POI_POSITIONS[lionId]!]),
));
export const SCORPION_POI_REGION_EXITS = LION_POI_REGION_EXITS;

/** The reused atlas trails, followed by the Scorpion's own edges between the same points. Presentation only. */
export function scorpionPoiPathBends(from: string, to: string, region?: number): readonly (readonly [number, number])[] | undefined {
  const lionFrom = LION_COUNTERPART[from];
  const lionTo = LION_COUNTERPART[to];
  return lionFrom && lionTo ? lionPoiPathBends(lionFrom, lionTo, region) : undefined;
}

export function scorpionPoiMapPhase(nodeId: string): number {
  return SCORPION_POI_METADATA[nodeId]?.region ?? 0;
}

/**
 * Refuge hubs of the Scorpion plateau on their final images (`image`); the Lion refuge plate they replaced still gives the
 * refuge its visual family.
 */
export const SCORPION_REFUGE_PRESENTATION = Object.freeze({
  'scorpion-first-refuge': { environmentContext: 'dialogue:first_refuge_gathering', environmentRole: 'STATIC_TABLEAU' as const,
    eyebrow: 'Halte de la compagnie', description: 'Les érudits de l’oasis partagent l’eau et l’ombre. La compagnie se prépare avant les ruines.',
    gatheringDialogueId: 'scorpion_oasis_gathering', awaitedFinal: 'Fond de refuge : l’oasis des érudits du Scorpion',
    image: `${FINAL_IMAGES}/refuges/scorpion-first-refuge.webp` },
  'scorpion-second-refuge': { environmentContext: 'node:lion-second-refuge', environmentRole: 'HOLD_SOURCE' as const,
    eyebrow: 'Halte de la compagnie', description: 'L’abri des caravanes sent le sable chaud et l’encens. La compagnie reprend son souffle.',
    awaitedFinal: 'Fond de refuge : l’abri des caravanes près du temple', image: `${FINAL_IMAGES}/refuges/scorpion-second-refuge.webp` },
  'scorpion-final-refuge': { environmentContext: 'node:lion-second-refuge', environmentRole: 'HOLD_SOURCE' as const,
    eyebrow: 'Avant le jugement', description: 'Une dernière veillée avant de comparaître devant le Grand Inquisiteur.',
    gatheringDialogueId: 'scorpion_vigil', awaitedFinal: 'Fond de refuge : la veillée au désert avant le jugement du Grand Inquisiteur',
    image: `${FINAL_IMAGES}/refuges/scorpion-final-refuge.webp` },
});

/** The end of a Scorpion chronicle: the Grand Inquisiteur's hall of records after the judgement (the chronicle-end staging). */
export const SCORPION_CHRONICLE_END_IMAGE = `${FINAL_IMAGES}/surfaces/chronicle-end.webp`;

/** Shared surfaces of a Scorpion run beyond its scenes, atlases and refuges, with the demo art they replaced. */
export const SCORPION_PROVISIONAL_SURFACES: readonly { surface: string; standIn: string; awaitedFinal: string; image?: string }[] = Object.freeze([
  { surface: 'Fin de chronique (Journey)', standIn: 'salle du jugement du Lion (CHRONICLE_END_TABLEAU)', awaitedFinal: 'Tableau de fin de chronique : la salle du Grand Inquisiteur après le jugement',
    image: SCORPION_CHRONICLE_END_IMAGE },
]);

/** New characters of the Scorpion plateau, on their final masters; `standInUnitId` keeps the silhouette they replaced. */
export const SCORPION_PROVISIONAL_ACTORS: readonly ProvisionalActor[] = Object.freeze([
  { actorId: 'grand_inquisitor', standInUnitId: 'wounded_merchant', awaitedFinal: 'Master Character V2 du Grand Inquisiteur, portrait et sprite de boss', master: `${FINAL_CHARACTERS}/grand_inquisitor.png` },
  { actorId: 'scorpion_scholar', standInUnitId: 'refugee', awaitedFinal: 'Sprite et portrait de l’érudit du Scorpion', master: `${FINAL_CHARACTERS}/scorpion_scholar.png` },
  { actorId: 'phoenix_faithful', standInUnitId: 'villageoise', awaitedFinal: 'Portrait du fidèle du Phénix', master: `${FINAL_CHARACTERS}/phoenix_faithful.png` },
  { actorId: 'phoenix_captive', standInUnitId: 'villageois', awaitedFinal: 'Portrait du fidèle du Phénix retenu par les érudits', master: `${FINAL_CHARACTERS}/phoenix_captive.png` },
  { actorId: 'phoenix_guardian_chief', standInUnitId: 'serpent_elite_brute', awaitedFinal: 'Master Character V2 du chef des gardiens du Phénix, sprite de boss', master: `${FINAL_CHARACTERS}/phoenix_guardian_chief.png` },
  { actorId: 'shadow_prophet', standInUnitId: 'survivor', awaitedFinal: 'Master Character V2 du Prophète des Ombres, sprite de boss', master: `${FINAL_CHARACTERS}/shadow_prophet.png` },
]);

/** Enemy families of the Scorpion plateau on their final masters; `standInPortrait` keeps the sprite they replaced in combat. */
export const SCORPION_PROVISIONAL_ENEMIES: readonly { unitId: string; standInPortrait: string; awaitedFinal: string; master?: string }[] = Object.freeze([
  { unitId: 'phoenix_guardian', standInPortrait: 'village_militia_spearman', awaitedFinal: 'Sprite du gardien du Phénix', master: `${FINAL_CHARACTERS}/phoenix_guardian.png` },
  { unitId: 'phoenix_flamekeeper', standInPortrait: 'lion_champion', awaitedFinal: 'Sprite d’élite du gardien de flamme du Phénix', master: `${FINAL_CHARACTERS}/phoenix_flamekeeper.png` },
  { unitId: 'shadow_zealot', standInPortrait: 'undead_champion', awaitedFinal: 'Sprite d’élite du fidèle égaré sous l’emprise des Ombres', master: `${FINAL_CHARACTERS}/shadow_zealot.png` },
  { unitId: 'scorpion_scholar', standInPortrait: 'serpent_oracle', awaitedFinal: 'Sprite de l’érudit du Scorpion', master: `${FINAL_CHARACTERS}/scorpion_scholar.png` },
  { unitId: 'phoenix_guardian_chief', standInPortrait: 'serpent_elite_brute', awaitedFinal: 'Sprite de boss du chef des gardiens du Phénix', master: `${FINAL_CHARACTERS}/phoenix_guardian_chief.png` },
  { unitId: 'shadow_prophet', standInPortrait: 'seal_guardian', awaitedFinal: 'Sprite de boss du Prophète des Ombres', master: `${FINAL_CHARACTERS}/shadow_prophet.png` },
  { unitId: 'grand_inquisitor', standInPortrait: 'serpent_duelist_elite', awaitedFinal: 'Sprite de boss du Grand Inquisiteur', master: `${FINAL_CHARACTERS}/grand_inquisitor.png` },
]);

/**
 * Every scene of the Scorpion, keyed by the dialogue that shows it, with its final tableau (`image`, which the narrative
 * stage shows) and the approved Lion tableau it replaced (`environmentContext`).
 */
const SCORPION_SCENE_BRIEFS: Readonly<Record<string, { environmentContext: string; awaitedFinal: string }>> = Object.freeze({
  scorpion_arrival: { environmentContext: 'dialogue:post_opening_trail', awaitedFinal: 'Tableau : la compagnie au bord des Déserts Arides' },
  scorpion_audience: { environmentContext: 'dialogue:lion_briefing', awaitedFinal: 'Tableau : la salle du Grand Inquisiteur' },
  scorpion_scholars: { environmentContext: 'dialogue:mystery_ambush', awaitedFinal: 'Tableau : le camp des érudits du Scorpion et leur prisonnier' },
  scorpion_phoenix_faithful: { environmentContext: 'dialogue:refugee_trial', awaitedFinal: 'Tableau : les fidèles du Phénix sur la route de leur temple' },
  scorpion_sand_riddle: { environmentContext: 'dialogue:mystery_shrine', awaitedFinal: 'Tableau : la porte de pierre et l’énigme des sables' },
  scorpion_oasis_gathering: { environmentContext: 'dialogue:first_refuge_gathering', awaitedFinal: 'Tableau : la compagnie à l’oasis des érudits' },
  scorpion_warded_path: { environmentContext: 'dialogue:old_shrine_event', awaitedFinal: 'Tableau : les sceaux de garde du Phénix sur la route des ruines' },
  scorpion_buried_library: { environmentContext: 'dialogue:mystery_shrine', awaitedFinal: 'Tableau : la bibliothèque ensevelie sous le sable' },
  scorpion_phoenix_temple: { environmentContext: 'dialogue:shadow_signs', awaitedFinal: 'Tableau : le Temple du Phénix et le codex prophétique' },
  scorpion_pre_temple_assault: { environmentContext: 'dialogue:pre_ruins_guardians', awaitedFinal: 'Tableau : le chef des gardiens devant le codex' },
  scorpion_temple_assault_aftermath: { environmentContext: 'dialogue:post_ruins_guardians', awaitedFinal: 'Tableau : le codex pris pour le Grand Inquisiteur' },
  scorpion_pre_temple_seizure: { environmentContext: 'dialogue:pre_ruins_guardians', awaitedFinal: 'Tableau : le chef des gardiens face à une compagnie avide' },
  scorpion_temple_seizure_aftermath: { environmentContext: 'dialogue:post_ruins_guardians', awaitedFinal: 'Tableau : le codex aux mains de la compagnie' },
  scorpion_prophet_traces: { environmentContext: 'dialogue:serpent_informant', awaitedFinal: 'Tableau : la cellule du Prophète à l’écart du temple' },
  scorpion_temple_witnesses: { environmentContext: 'dialogue:witnesses_on_road', awaitedFinal: 'Tableau : les fidèles rescapés du temple' },
  scorpion_sacred_ashes: { environmentContext: 'dialogue:mystery_shrine', awaitedFinal: 'Tableau : le sanctuaire des cendres sacrées' },
  scorpion_corrupted_texts: { environmentContext: 'dialogue:shadow_signs', awaitedFinal: 'Tableau : les pages souillées du codex' },
  scorpion_vigil: { environmentContext: 'dialogue:final_refuge', awaitedFinal: 'Tableau : la veillée au désert avant le jugement' },
  scorpion_judgement: { environmentContext: 'dialogue:lion_finale_judgement', awaitedFinal: 'Tableau : le jugement du Grand Inquisiteur' },
  scorpion_prophet_pre_combat: { environmentContext: 'dialogue:serpent_pursuit_pre_combat', awaitedFinal: 'Tableau : la traque du Prophète des Ombres' },
  scorpion_prophet_aftermath: { environmentContext: 'dialogue:serpent_general_aftermath', awaitedFinal: 'Tableau : la chute du Prophète des Ombres' },
  scorpion_inquisitor_pre_combat: { environmentContext: 'dialogue:pre_lion_chief', awaitedFinal: 'Tableau : le Grand Inquisiteur et ses érudits face à la compagnie' },
  scorpion_trial_aftermath: { environmentContext: 'dialogue:lion_trial_aftermath', awaitedFinal: 'Tableau : l’épreuve du Scorpion achevée' },
  scorpion_epilogue: { environmentContext: 'dialogue:epilogue', awaitedFinal: 'Tableau : le Sceau du Scorpion' },
});

export const SCORPION_PROVISIONAL_SCENES: Readonly<Record<string, { environmentContext: string; awaitedFinal: string; image?: string }>> = Object.freeze(
  Object.fromEntries(Object.entries(SCORPION_SCENE_BRIEFS).map(([key, scene]) => [key, Object.freeze({ ...scene, image: `${FINAL_IMAGES}/scenes/${key}.webp` })])),
);

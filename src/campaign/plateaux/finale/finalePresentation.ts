/**
 * Set 1.20.0 (WORLD_AND_CHARACTERS "Provisional images"), post-demo Lot 4 — presentation of the final act.
 * The act is canon (OD-2026-11-09-A); its images stay provisional until the final-image lot.
 *
 * Every image here is PROVISIONAL: approved Lion backdrops and atlases reused, and existing characters standing in as
 * silhouettes for the final act's new characters. None is generated and none is a video. Each is listed with the final
 * image it awaits; the final images form a separate lot led with the operator. Presentation only: no game truth.
 */
import { LION_POI_REGIONS } from '../../LionPoiMap';
import type { ProvisionalActor, ProvisionalAtlasRegion } from '../bear/bearPresentation';
import { FINALE_POI_METADATA } from './finaleTopology';

/** The capital is a single small map, drawn for now on the Lion's third atlas. */
export const FINALE_ATLAS_REGIONS: readonly ProvisionalAtlasRegion[] = Object.freeze([
  { shortTitle: 'La capitale corrompue', title: 'De l’arène en flammes à la brèche', image: LION_POI_REGIONS[2]!.image, provisional: true,
    awaitedFinal: 'Atlas de la capitale corrompue : l’arène, les rues en flammes, la place des démons et la brèche' },
]);

/** Points placed along the reused atlas's trails. Presentation only. */
export const FINALE_POI_POSITIONS: Readonly<Record<string, readonly [number, number]>> = Object.freeze({
  'finale-arena-gate': [140, 340], 'finale-burning-streets': [365, 245], 'finale-allied-rally': [550, 370],
  'finale-trapped-citizens': [580, 75], 'finale-demon-square': [710, 245], 'finale-last-refuge': [805, 370], 'finale-breach': [885, 130],
  'finale-poi-armoury': [185, 160], 'finale-poi-ruins': [360, 390], 'finale-poi-market': [390, 75], 'finale-poi-reserve': [750, 70],
});
export const FINALE_POI_REGION_EXITS: readonly (readonly [number, number])[] = Object.freeze([]);

export function finalePoiPathBends(): readonly (readonly [number, number])[] | undefined {
  return undefined;
}

export function finalePoiMapPhase(nodeId: string): number {
  return FINALE_POI_METADATA[nodeId]?.region ?? 0;
}

/** The final act's refuge, on a reused Lion refuge plate. */
export const FINALE_REFUGE_PRESENTATION = Object.freeze({
  'finale-last-refuge': { environmentContext: 'node:lion-second-refuge', environmentRole: 'HOLD_SOURCE' as const,
    eyebrow: 'Avant la brèche', description: 'Une maison encore debout, à quelques rues de la brèche. La compagnie s’y prépare une dernière fois.',
    gatheringDialogueId: 'finale_last_vigil', awaitedFinal: 'Fond de refuge : la dernière veillée dans la capitale, avant la brèche' },
});

/** Shared surfaces a final-act run shows on demo art, beyond its scenes, atlas and refuge. */
export const FINALE_PROVISIONAL_SURFACES: readonly { surface: string; standIn: string; awaitedFinal: string }[] = Object.freeze([
  { surface: 'Tableau des rencontres du Tournoi', standIn: 'salle du jugement du Lion (fond du tableau)', awaitedFinal: 'Fond du tableau des rencontres : l’Arène des Destins vue des tribunes' },
  { surface: 'Fin de chronique (Journey)', standIn: 'salle du jugement du Lion (CHRONICLE_END_TABLEAU)', awaitedFinal: 'Tableau de fin de l’acte final : la brèche vaincue, avant les épilogues' },
]);

/** New characters of the final act, staged with existing silhouettes until their Character V2 masters exist. */
export const FINALE_PROVISIONAL_ACTORS: readonly ProvisionalActor[] = Object.freeze([
  { actorId: 'finale_raven_champion', standInUnitId: 'serpent_duelist_elite', awaitedFinal: 'Portrait et sprite d’élite du champion du Corbeau' },
  { actorId: 'finale_wolf_champion', standInUnitId: 'serpent_raider', awaitedFinal: 'Portrait du champion du Loup' },
  { actorId: 'finale_phoenix_champion', standInUnitId: 'lion_champion', awaitedFinal: 'Portrait et sprite d’élite du champion du Phénix' },
  { actorId: 'finale_serpent_champion', standInUnitId: 'serpent_elite_brute', awaitedFinal: 'Master Character V2 du champion du Serpent, sprite de boss et sa forme démoniaque' },
  { actorId: 'finale_civilian', standInUnitId: 'villageoise', awaitedFinal: 'Portrait d’une spectatrice de l’arène' },
  { actorId: 'finale_citizen', standInUnitId: 'villageois', awaitedFinal: 'Portrait d’un habitant de la capitale' },
]);

/** Enemy families of the final act and the existing sprites standing in for them in combat. */
export const FINALE_PROVISIONAL_ENEMIES: readonly { unitId: string; standInPortrait: string; awaitedFinal: string }[] = Object.freeze([
  { unitId: 'raven_champion', standInPortrait: 'serpent_duelist_elite', awaitedFinal: 'Sprite d’élite du champion du Corbeau' },
  { unitId: 'phoenix_champion', standInPortrait: 'lion_champion', awaitedFinal: 'Sprite d’élite du champion du Phénix' },
  { unitId: 'serpent_champion', standInPortrait: 'serpent_elite_brute', awaitedFinal: 'Sprite de boss du champion du Serpent' },
  { unitId: 'demon_champion', standInPortrait: 'troll', awaitedFinal: 'Sprite de boss du champion du Serpent changé en démon' },
  { unitId: 'breach_demon', standInPortrait: 'giant_mygale', awaitedFinal: 'Sprite des démons sortis de la brèche' },
  { unitId: 'demon_brute', standInPortrait: 'forest_troll_elite', awaitedFinal: 'Sprite d’élite du démon massif de la capitale' },
  { unitId: 'maelor_traitor', standInPortrait: 'maelor', awaitedFinal: 'Sprite de boss de Maelor à la brèche' },
  { unitId: 'breach_entity', standInPortrait: 'shrine_apparition', awaitedFinal: 'Sprite de boss de l’entité de la brèche (sans nom tant que l’opérateur n’en décide pas)' },
]);

/**
 * Every scene of the final act and the approved Lion tableau it borrows until its own final tableau exists: the narrative
 * stage reads `environmentContext` for the scene's still image. Each entry names the final image it awaits.
 */
export const FINALE_PROVISIONAL_SCENES: Readonly<Record<string, { environmentContext: string; awaitedFinal: string }>> = Object.freeze({
  finale_arrival: { environmentContext: 'dialogue:lion_briefing', awaitedFinal: 'Tableau : l’Arène des Destins, la compagnie admise avec ses quatre Sceaux' },
  finale_raven_verdict: { environmentContext: 'dialogue:pre_lion_chief', awaitedFinal: 'Tableau : le champion du Corbeau à terre devant les tribunes' },
  finale_wolf_verdict: { environmentContext: 'dialogue:pre_lion_chief', awaitedFinal: 'Tableau : le champion du Loup à terre devant les tribunes' },
  finale_phoenix_verdict: { environmentContext: 'dialogue:pre_lion_chief', awaitedFinal: 'Tableau : le champion du Phénix à terre devant les tribunes' },
  finale_pre_serpent_final: { environmentContext: 'dialogue:pre_lion_chief', awaitedFinal: 'Tableau : la finale du Tournoi, face au champion du Serpent' },
  finale_betrayal: { environmentContext: 'dialogue:shadow_signs', awaitedFinal: 'Tableau vivant : la trahison de Maelor et la brèche qui s’ouvre au cœur de l’arène' },
  finale_arena_chaos: { environmentContext: 'dialogue:shadow_signs', awaitedFinal: 'Tableau : les démons dans l’arène et la foule qui fuit' },
  finale_arena_assault_aftermath: { environmentContext: 'dialogue:post_ruins_guardians', awaitedFinal: 'Tableau : la compagnie quitte l’arène en flammes' },
  finale_capital_arrival: { environmentContext: 'dialogue:post_opening_trail', awaitedFinal: 'Tableau : la capitale corrompue vue depuis les portes de l’arène' },
  finale_allied_rally: { environmentContext: 'dialogue:lion_briefing', awaitedFinal: 'Tableau : le ralliement des clans alliés dans la capitale' },
  finale_trapped_citizens: { environmentContext: 'dialogue:witnesses_on_road', awaitedFinal: 'Tableau : des habitants pris sous les décombres' },
  finale_last_vigil: { environmentContext: 'dialogue:final_refuge', awaitedFinal: 'Tableau : la dernière veillée avant la brèche' },
  finale_breach_confrontation: { environmentContext: 'dialogue:serpent_pursuit_pre_combat', awaitedFinal: 'Tableau : Maelor au cœur de la brèche' },
  finale_breach_aftermath: { environmentContext: 'dialogue:serpent_general_aftermath', awaitedFinal: 'Tableau : la brèche vacille après la chute de l’entité' },
  finale_act_end: { environmentContext: 'dialogue:epilogue', awaitedFinal: 'Tableau : la capitale au matin, avant les épilogues' },
});

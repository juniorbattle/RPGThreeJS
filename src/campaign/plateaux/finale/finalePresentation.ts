/**
 * Set 1.20.0 (WORLD_AND_CHARACTERS "Provisional images"), post-demo Lot 4 — presentation of the final act.
 * The act is canon (OD-2026-11-09-A).
 *
 * FINAL IMAGES (OD-2026-11-11-F, F1; identity and staging validated by the operator on 2026-11-12, « Valider tel quel »,
 * batch integrated on his order of 2026-11-13, « Intègre l’acte final »): every scene, the refuge, the atlas, the
 * Tournament's board, the chronicle end and the final act's characters show its own final images, made by
 * tools/art/finalImages.ts and published by tools/art/publish_final_images.py (provenance in
 * tools/art/provenance/finale-final-images.json). Two characters keep a master that already exists: the Wolf's champion
 * (the Dragon's) and Maelor (his approved master); each champion's portrait is the master of his combat sprite. Each entry
 * keeps the reused Lion art or stand-in it replaced and the brief it was made from (`awaitedFinal`). The atlas keeps the
 * layout of the Lion's third atlas, so the POI positions below stay valid. Presentation only: no game truth.
 */
import type { ProvisionalActor, ProvisionalAtlasRegion } from '../bear/bearPresentation';
import { FINALE_POI_METADATA } from './finaleTopology';

const FINAL_IMAGES = '/assets/generated/post-demo/finale';
const FINAL_CHARACTERS = '/assets/characters/pixel/post-demo/finale';

/** The capital is a single small map, repainted on the layout of the Lion's third atlas. */
export const FINALE_ATLAS_REGIONS: readonly ProvisionalAtlasRegion[] = Object.freeze([
  { shortTitle: 'La capitale corrompue', title: 'De l’arène en flammes à la brèche', image: `${FINAL_IMAGES}/atlases/region-1.webp`, provisional: false,
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

/** The final act's refuge on its final image (`image`); the Lion refuge plate it replaced still gives it its visual family. */
export const FINALE_REFUGE_PRESENTATION = Object.freeze({
  'finale-last-refuge': { environmentContext: 'node:lion-second-refuge', environmentRole: 'HOLD_SOURCE' as const,
    eyebrow: 'Avant la brèche', description: 'Une maison encore debout, à quelques rues de la brèche. La compagnie s’y prépare une dernière fois.',
    gatheringDialogueId: 'finale_last_vigil', awaitedFinal: 'Fond de refuge : la dernière veillée dans la capitale, avant la brèche',
    image: `${FINAL_IMAGES}/refuges/finale-last-refuge.webp` },
});

/** The Tournament's encounter board: the Arena of Destinies seen from its stands. */
export const FINALE_TOURNAMENT_BOARD_IMAGE = `${FINAL_IMAGES}/surfaces/tableau-des-rencontres-du-tournoi.webp`;

/** The end of the final act's chronicle: the heart of the breach after the fight, before the epilogues. */
export const FINALE_CHRONICLE_END_IMAGE = `${FINAL_IMAGES}/surfaces/chronicle-end.webp`;

/** Shared surfaces of a final-act run beyond its scenes, atlas and refuge, with the demo art they replaced. */
export const FINALE_PROVISIONAL_SURFACES: readonly { surface: string; standIn: string; awaitedFinal: string; image?: string }[] = Object.freeze([
  { surface: 'Tableau des rencontres du Tournoi', standIn: 'salle du jugement du Lion (fond du tableau)', awaitedFinal: 'Fond du tableau des rencontres : l’Arène des Destins vue des tribunes',
    image: FINALE_TOURNAMENT_BOARD_IMAGE },
  { surface: 'Fin de chronique (Journey)', standIn: 'salle du jugement du Lion (CHRONICLE_END_TABLEAU)', awaitedFinal: 'Tableau de fin de l’acte final : la brèche vaincue, avant les épilogues',
    image: FINALE_CHRONICLE_END_IMAGE },
]);

/**
 * New characters of the final act, on their final masters; `standInUnitId` keeps the silhouette they replaced. Each
 * champion speaks with the master of his combat sprite, the Wolf's with the Dragon's champion.
 */
export const FINALE_PROVISIONAL_ACTORS: readonly ProvisionalActor[] = Object.freeze([
  { actorId: 'finale_raven_champion', standInUnitId: 'serpent_duelist_elite', awaitedFinal: 'Portrait et sprite d’élite du champion du Corbeau', master: `${FINAL_CHARACTERS}/raven_champion.png` },
  { actorId: 'finale_wolf_champion', standInUnitId: 'serpent_raider', awaitedFinal: 'Portrait du champion du Loup', master: '/assets/characters/pixel/post-demo/dragon/wolf_champion.png' },
  { actorId: 'finale_phoenix_champion', standInUnitId: 'lion_champion', awaitedFinal: 'Portrait et sprite d’élite du champion du Phénix', master: `${FINAL_CHARACTERS}/phoenix_champion.png` },
  { actorId: 'finale_serpent_champion', standInUnitId: 'serpent_elite_brute', awaitedFinal: 'Master Character V2 du champion du Serpent, sprite de boss et sa forme démoniaque', master: `${FINAL_CHARACTERS}/serpent_champion.png` },
  { actorId: 'finale_civilian', standInUnitId: 'villageoise', awaitedFinal: 'Portrait d’une spectatrice de l’arène', master: `${FINAL_CHARACTERS}/finale_civilian.png` },
  { actorId: 'finale_citizen', standInUnitId: 'villageois', awaitedFinal: 'Portrait d’un habitant de la capitale', master: `${FINAL_CHARACTERS}/finale_citizen.png` },
]);

/**
 * Enemy families of the final act on their final masters; `standInPortrait` keeps the sprite they replaced in combat.
 * Maelor keeps his approved master at the breach.
 */
export const FINALE_PROVISIONAL_ENEMIES: readonly { unitId: string; standInPortrait: string; awaitedFinal: string; master?: string }[] = Object.freeze([
  { unitId: 'raven_champion', standInPortrait: 'serpent_duelist_elite', awaitedFinal: 'Sprite d’élite du champion du Corbeau', master: `${FINAL_CHARACTERS}/raven_champion.png` },
  { unitId: 'phoenix_champion', standInPortrait: 'lion_champion', awaitedFinal: 'Sprite d’élite du champion du Phénix', master: `${FINAL_CHARACTERS}/phoenix_champion.png` },
  { unitId: 'serpent_champion', standInPortrait: 'serpent_elite_brute', awaitedFinal: 'Sprite de boss du champion du Serpent', master: `${FINAL_CHARACTERS}/serpent_champion.png` },
  { unitId: 'demon_champion', standInPortrait: 'troll', awaitedFinal: 'Sprite de boss du champion du Serpent changé en démon', master: `${FINAL_CHARACTERS}/demon_champion.png` },
  { unitId: 'breach_demon', standInPortrait: 'giant_mygale', awaitedFinal: 'Sprite des démons sortis de la brèche', master: `${FINAL_CHARACTERS}/breach_demon.png` },
  { unitId: 'demon_brute', standInPortrait: 'forest_troll_elite', awaitedFinal: 'Sprite d’élite du démon massif de la capitale', master: `${FINAL_CHARACTERS}/demon_brute.png` },
  { unitId: 'maelor_traitor', standInPortrait: 'maelor', awaitedFinal: 'Sprite de boss de Maelor à la brèche', master: '/assets/characters/pixel/masters/maelor.png' },
  { unitId: 'breach_entity', standInPortrait: 'shrine_apparition', awaitedFinal: 'Sprite de boss de l’entité de la brèche (sans nom tant que l’opérateur n’en décide pas)', master: `${FINAL_CHARACTERS}/breach_entity.png` },
]);

/**
 * Every scene of the final act, keyed by the dialogue that shows it, with its final tableau (`image`, which the narrative
 * stage shows) and the approved Lion tableau it replaced (`environmentContext`).
 */
const FINALE_SCENE_BRIEFS: Readonly<Record<string, { environmentContext: string; awaitedFinal: string }>> = Object.freeze({
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
  // Lot 5 (endings, canon since OD-2026-11-09-B).
  finale_epilogue_respect: { environmentContext: 'dialogue:epilogue', awaitedFinal: 'Tableau vivant : le Respect, la brèche refermée avec les alliés et les clans rassemblés' },
  finale_epilogue_fear: { environmentContext: 'dialogue:shadow_signs', awaitedFinal: 'Tableau vivant : la Crainte, la compagnie seule devant les bannières des clans' },
  finale_epilogue_balance: { environmentContext: 'dialogue:final_refuge', awaitedFinal: 'Tableau vivant : l’Équilibre, une paix fragile entre les clans' },
  finale_fear_close: { environmentContext: 'dialogue:serpent_general_aftermath', awaitedFinal: 'Tableau : la fin de la Crainte, après le dernier combat ou le destin accepté' },
});

export const FINALE_PROVISIONAL_SCENES: Readonly<Record<string, { environmentContext: string; awaitedFinal: string; image?: string }>> = Object.freeze(
  Object.fromEntries(Object.entries(FINALE_SCENE_BRIEFS).map(([key, scene]) => [key, Object.freeze({ ...scene, image: `${FINAL_IMAGES}/scenes/${key}.webp` })])),
);

/**
 * Set 1.20.0 (PRESENTATION_AND_MEDIA "Post-demo moments"), post-demo Lot 5 — the moment table of the final act, approved
 * with the endings (OD-2026-11-09-B): the Tournament betrayal and the three epilogues, each with the established facts it
 * may show. A moment plays only on an approved painted tableau; while its tableau is provisional, it goes straight to its
 * dialogue. No caption, no choice: the Fear ending's choice stays in its dialogue.
 */
export interface FinaleMoment {
  readonly id: string;
  readonly beforeDialogueId: string;
  readonly maxSeconds: 40;
  readonly facts: readonly string[];
  readonly status: 'proposed' | 'approved';
  readonly tableau: 'provisional' | 'approved';
}

export const FINALE_MOMENTS: readonly FinaleMoment[] = Object.freeze([
  { id: 'finale_betrayal_moment', beforeDialogueId: 'finale_betrayal', maxSeconds: 40, status: 'approved', tableau: 'provisional',
    facts: ['Le champion du Serpent tombe en finale du Tournoi', 'Maelor s’avance au milieu de l’arène, un artefact à la main',
      'La brèche s’ouvre au cœur de l’arène', 'Le champion du Serpent se relève, changé en démon'] },
  { id: 'finale_respect_moment', beforeDialogueId: 'finale_epilogue_respect', maxSeconds: 40, status: 'approved', tableau: 'provisional',
    facts: ['La brèche se referme', 'Les bannières alliées tiennent la ligne autour de la brèche', 'Les clans se rassemblent sous la bannière de la compagnie'] },
  { id: 'finale_fear_moment', beforeDialogueId: 'finale_epilogue_fear', maxSeconds: 40, status: 'approved', tableau: 'provisional',
    facts: ['La brèche se referme', 'La compagnie se tient seule', 'Les bannières des clans approchent'] },
  { id: 'finale_balance_moment', beforeDialogueId: 'finale_epilogue_balance', maxSeconds: 40, status: 'approved', tableau: 'provisional',
    facts: ['La brèche se referme', 'Des bannières à ses côtés, d’autres à distance', 'Le monde tient encore, marqué par le conflit'] },
]);

/** A moment plays only once approved and on an approved tableau; until then, its dialogue plays directly. */
export function finaleMomentPlays(moment: FinaleMoment): boolean {
  return moment.status === 'approved' && moment.tableau === 'approved';
}

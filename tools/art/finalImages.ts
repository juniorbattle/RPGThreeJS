/**
 * Final images through OpenAI (OD-2026-11-11-F, F1). Two steps, run with vite-node:
 *
 *   npx vite-node tools/art/finalImages.ts -- plan
 *     Reads every provisional image the post-demo registries list (their `awaitedFinal`), writes one brief per image to
 *     tmp/final-images/plan.json: kind, size, prompt and style references. No network. The plan can be edited before a
 *     run, for instance to describe a new character's look; `notes` is appended to the prompt.
 *
 *   npx vite-node tools/art/finalImages.ts -- run --pilot          (the six Bear images agreed for the pilot)
 *   npx vite-node tools/art/finalImages.ts -- run --ids id1,id2    (any images of the plan)
 *   npx vite-node tools/art/finalImages.ts -- run --chapter bear   (every image of one chapter not yet generated)
 *     Calls the OpenAI image edit endpoint with the operator's key, OPENAI_API_KEY, taken from the terminal or else from the
 *     project's Git-ignored .env.local (only the OPENAI_ variables are loaded). The tool never prints or stores it. It writes tmp/final-images/out/<id>.png, log.json and review.html (current stand-in
 *     beside the generated image). Nothing is integrated: only images the operator accepts are integrated afterwards.
 *
 *   npx vite-node tools/art/finalImages.ts -- poses --group heroes --step pose|fx   (combat poses, OD-2026-11-13-A)
 *     Draws the three combat poses of the units of tools/art/combatPosesTable.ts (--group or --units id1,id2), then adds
 *     their baked effects (--step fx), into tmp/combat-poses/out/. --poses dash,attack limits the poses, --force redoes them.
 *
 * Options for run: --model <name> (default: the project's earlier approved image model), --quality <low|medium|high> (default high), --force (redo
 * images already generated), --concurrency <1-6> (requests at once, default 1). tmp/ is ignored by Git.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import * as bear from '../../src/campaign/plateaux/bear/bearPresentation';
import * as dragon from '../../src/campaign/plateaux/dragon/dragonPresentation';
import * as scorpion from '../../src/campaign/plateaux/scorpion/scorpionPresentation';
import * as finale from '../../src/campaign/plateaux/finale/finalePresentation';
import { loadEnv } from 'vite';
import { demoEnvironmentPlateForContext } from '../../src/render/demoEnvironmentPack';
import { ATLAS_LAYOUTS, BREACH_CREATURE_IDS, CIVILIAN_IDS, CIVILIAN_REFS, CREATURE_IDS, CREATURE_REFS, IDENTITY, LIGHT_REFS, STAGED_LOOKS, STAGING } from './finalImagesStaging';
import { effectColours, hasFx, POSE_UNITS, POSES, poseReference, poseSize, unitsOf, type PoseGroup, type PoseName } from './combatPosesTable';

type Chapter = 'bear' | 'dragon' | 'scorpion' | 'finale';
type Kind = 'backdrop' | 'atlas' | 'character';

export interface FinalImageBrief {
  id: string;
  chapter: Chapter;
  kind: Kind;
  awaitedFinal: string;
  /** Path (from the repository root) of the provisional image it replaces, when one exists. */
  standIn: string | null;
  size: '1536x1024' | '1024x1024';
  transparent: boolean;
  references: string[];
  prompt: string;
  notes: string;
  /** Another brief of the same place, whose generated image joins the references when it exists. */
  samePlaceAs?: string;
}

const ROOT = resolve(import.meta.dirname ?? '.', '..', '..');
const OUT_DIR = join(ROOT, 'tmp', 'final-images');
const PLAN = join(OUT_DIR, 'plan.json');

/** Settings named by the plateaux' canon text; no new place or lore. */
const SETTINGS: Record<Chapter, string> = {
  bear: 'Les Montagnes de la Résilience, terres du clan de l’Ours : cols enneigés, avant-postes de pierre, galeries de mines sacrées et filon sombre.',
  dragon: 'Les Pics, terres du clan du Dragon : cimes, sentiers de pèlerins, repaire, autel du Cristal d’Écho.',
  scorpion: 'Le désert du clan du Scorpion : temple du Phénix, érudits, sable et pierre brûlée.',
  finale: 'La capitale des clans : l’Arène des Destins, la capitale en flammes, la brèche.',
};

/**
 * The references give the demo's pixel-art technique only (operator, 2026-11-12): each plateau keeps its own palette,
 * building and landmarks, set by its identity and its staging.
 */
const STYLE = 'Modern pixel art, HD-2D fantasy tactical RPG, rich painterly pixel detail, cinematic lighting. Match the pixel-art technique of the reference images: pixel density, outlines, dithering, rendering of light and level of detail. The reference images set the technique only: never copy their heraldry, emblems, banners, palette, architecture, landmarks or composition. No text, no letters, no labels, no UI, no watermark, no frame.';

/**
 * The pilot showed the Lion references' heraldry leaking into Bear images (lion banners, lion medallions): every brief
 * names the clan whose signs the place or person may show. A brief that names another clan (the Raven in the Bear's
 * mountains, the Wolf in the Dragon's peaks, the Phoenix in the Scorpion's desert, the Serpent's champion) gives that
 * clan's people, camps and banners its own sign, and the host clan's places keep theirs.
 */
const CLAN_SIGNS: readonly { name: string; english: string; sign: string }[] = [
  { name: 'Ours', english: 'Bear', sign: 'a bear' },
  { name: 'Corbeau', english: 'Raven', sign: 'a raven' },
  { name: 'Dragon', english: 'Dragon', sign: 'a dragon' },
  { name: 'Loup', english: 'Wolf', sign: 'a wolf' },
  { name: 'Scorpion', english: 'Scorpion', sign: 'a scorpion' },
  { name: 'Phénix', english: 'Phoenix', sign: 'a phoenix' },
  { name: 'Serpent', english: 'Serpent', sign: 'a serpent' },
];
const HOST_CLAN: Record<Chapter, string | null> = { bear: 'Bear', dragon: 'Dragon', scorpion: 'Scorpion', finale: null };
const SHADOWS = /(^|[^\p{L}])(Ombres|Shadows)([^\p{L}]|$)/u;
const namesClan = (text: string, name: string) => new RegExp(`(^|[^\\p{L}])${name}([^\\p{L}]|$)`, 'u').test(text);

/** A place whose staging gives it no clan (the Scorpion's caravan shelter, open to any traveller). */
const NO_CLAN = /no emblem of any clan/i;
export const NO_CLAN_RULE = 'This place belongs to no clan: no banner, shield, medallion, carving, relief or painted emblem of any clan on any wall, pillar or object; never a lion.';
/**
 * The final act's demons and entity (BREACH_CREATURE_IDS) belong to no clan. The finale has no host clan, so its general
 * sentence asks for banners mixing the clans' signs, which a demon's sprite should not carry.
 */
export const OUT_OF_BREACH_RULE = 'What comes out of the breach belongs to no clan: no banner, shield, medallion or emblem of any clan; never a lion.';

export function heraldryFor(chapter: Chapter, awaitedFinal: string): string {
  // The Scorpion's caravan shelter, staged with no emblem of any clan, came out with scorpions carved on its pillars: the
  // host clan's sentence below asked for its sign on any carved emblem.
  if (NO_CLAN.test(awaitedFinal)) return NO_CLAN_RULE;
  const host = CLAN_SIGNS.find((clan) => clan.english === HOST_CLAN[chapter]);
  const others = CLAN_SIGNS.filter((clan) => clan !== host && (namesClan(awaitedFinal, clan.name) || namesClan(awaitedFinal, clan.english)));
  const theirs = others.map((clan) => `the ${clan.english} clan’s people, camps and banners show ${clan.sign}`).join('; ');
  // The Shadows are no clan: a brief naming them and no clan gets no sign (the host clan's would dress the shaman as a Dragon).
  if (!others.length && SHADOWS.test(awaitedFinal)) return 'The Shadows belong to no clan: no banner, shield, medallion or carved emblem of any clan; never a lion.';
  if (!host) return others.length ? `Each clan keeps its own sign: ${theirs}; other banners mix the signs of several clans.` : 'Any banners mix the signs of several clans; no single emblem dominates.';
  if (!others.length) return `Any banner, shield, medallion or carved emblem shows the ${host.english} clan’s sign, ${host.sign}; never a lion.`;
  // The Dragon's first run put the host clan's carved pillars and bronze bells in the Wolf's cave.
  return `Each clan keeps its own sign: ${theirs}; the ${host.english} clan’s own places show ${host.sign}, and the other clans’ places show none of the ${host.english} clan’s carvings, emblems or objects; never a lion.`;
}

/**
 * Generic rules learned from the Dragon's redos (9 in its run, 10 at integration), applied by the tool to every plateau
 * so each new staging does not have to repeat them. The plateau's own lines and looks still say what is specific.
 */
/** The Dragon's pilgrims' shelter, staged closed, opened onto the sky through a window. */
export const CLOSED_INTERIOR_RULE = 'Indoors or underground: a closed space with no window and no opening onto the outside; no snow, no frost, no daylight, no sky.';
/** The Dragon's hamlet showed a fortified town far away; the first Bear run copied the Lion's distant castles. */
export const NOTHING_BUILT_FAR_RULE = 'No castle, fortress, monastery, town or city anywhere in view, even far away on the horizon, unless the staging names it.';
/** The Dragon's wyrm came out with purple veins and eyes. */
export const SHADOWS_COLOUR_RULE = 'The Shadows’ corruption is black like cold, frozen ink: never purple, violet or magenta, no purple glow.';
// \p{L} rather than \w: « souillées » and « corrompu » carry accented letters.
const NAMES_SHADOWS = /(^|[^\p{L}])(Ombres?|Shadows?|corrupt\p{L}*|corromp\p{L}*|souill\p{L}*|dark energy|dark magic)([^\p{L}]|$)/iu;

/**
 * A plateau's sacred object belongs to no character: Kaelen's first sprite held a staff set with a blue crystal that read
 * as the Echo Crystal. Canon objects only (the Dragon's Echo Crystal, the Phoenix's prophetic codex).
 */
export const SACRED_OBJECT_RULES: Readonly<Partial<Record<Chapter, string>>> = Object.freeze({
  dragon: 'The character holds and carries nothing that could pass for the Echo Crystal: no crystal, orb or glowing gem in hand, on a staff or at the belt.',
  scorpion: 'The character holds and carries nothing that could pass for the Phoenix’s prophetic codex: no book, codex, tome or bound pages in hand or at the belt.',
  // The final act's canon objects: the company's four Seals and the artefact Maelor opens the breach with; neither has a
  // canon look, so no character carries anything that could be taken for them.
  finale: 'The character holds and carries nothing that could pass for one of the four Seals or for the artefact Maelor opens the breach with: no seal, medallion, amulet, orb, crystal, gem or glowing relic in hand, on a staff or at the belt.',
});

export interface CombatWeapon { name: string; type: 'phys' | 'mag' }

const RUNTIME = join(ROOT, 'src', 'combat', 'legacyCombatRuntime.js');

/**
 * The weapon a unit fights with in combat, read from the combat runtime (src/combat/legacyCombatRuntime.js): a unit listed
 * by its ID, else a boss of this chapter (listed by name with its combats) whose portrait is the unit's final master or
 * its combat stand-in. The Dragon's hunter was drawn with a bow and its champion with a long sword, while they fight with a
 * sling and throwing blades.
 */
export function combatWeaponOf(chapter: Chapter, unitId: string, standIn: string | null, source: string = readFileSync(RUNTIME, 'utf8')): CombatWeapon | null {
  const weapon = (line: string): CombatWeapon | null => {
    const found = /weapons:\[\{name:'([^']+)'[^}]*?type:'(phys|mag)'/.exec(line);
    return found ? { name: found[1]!, type: found[2] as CombatWeapon['type'] } : null;
  };
  const lines = source.split('\n');
  const keyed = new RegExp(`(^|[\\s{,])${unitId}:\\{`);
  for (const line of lines) if (keyed.test(line) && weapon(line)) return weapon(line);
  const portraits = [`/post-demo/${chapter}/${unitId}.png`, ...(standIn ? [`/${standIn}.png`] : [])];
  for (const line of lines) {
    if (!line.includes(`combatIds:['${chapter}_`)) continue;
    const portrait = /portrait:'([^']+)'/.exec(line)?.[1] ?? '';
    if (portraits.some((ending) => portrait.endsWith(ending)) && weapon(line)) return weapon(line);
  }
  return null;
}

/** English for the weapon words of the combat runtime, so the image model draws the right one. */
const WEAPON_WORDS: readonly [RegExp, string][] = [
  [/lames? de jet/i, 'throwing knives'], [/arbal[eè]te/i, 'a crossbow'], [/fronde/i, 'a sling'], [/\barc\b/i, 'a bow'],
  [/lance/i, 'a spear'], [/hache/i, 'an axe'], [/marteau/i, 'a war hammer'], [/masse/i, 'a mace'], [/[ée]p[ée]e/i, 'a sword'],
  [/\blames?\b/i, 'a blade'], [/dague|couteau/i, 'a dagger'], [/pioche|\bpic\b/i, 'a pickaxe'], [/b[âa]ton/i, 'a staff'],
  [/fl[ée]au/i, 'a flail'],
];
/** Natural weapons: the demons fight with their claws, which no hand holds. */
const NATURAL_WEAPONS = /griffes?|crocs?|serres?/i;

export function weaponRule(weapon: CombatWeapon): string {
  if (NATURAL_WEAPONS.test(weapon.name)) return `In combat it fights with « ${weapon.name} » (its own claws): show them clearly, and no weapon in hand.`;
  const english = WEAPON_WORDS.find(([pattern]) => pattern.test(weapon.name))?.[1];
  if (english) return `In combat it fights with « ${weapon.name} » (${english}): show that weapon clearly in hand, and no other kind of weapon.`;
  return `In combat it fights with magic (« ${weapon.name} »), not with a blade, axe, spear, bow or sling: it carries none of them.`;
}

/** Approved Lion art used as style references (Character V2 masters and approved tableaux). */
const BACKDROP_STYLE_REFS = [
  'public/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/shadow-ruins-tableau.png',
  'public/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/alaric-audience-tableau.png',
];

/**
 * Standing operator rule (OD-2026-11-11-G): no character of the game shows a face. Masks, closed helmets or hoods cover
 * it, as on every approved Character V2 master (Alistair's closed helmet, Elara's shadowed face and two eyes, Maelor's hood).
 */
export const COVERED_FACE_RULE = 'If the character is a person, the face stays fully covered, as for every character of this game: a closed helmet, a mask, or a hood whose shadow hides the face, with at most two small glowing eyes inside the shadow. No visible facial features: no nose, mouth, cheeks, skin of the face, beard or hair on the face.';

/**
 * Looks the canon does not describe, written with the operator in the final-image lot and approved with the Bear's images
 * (OD-2026-11-11-F, F1, integrated 2026-11-12). They go into the brief's notes.
 */
const PROPOSED_LOOKS: Record<string, string> = {
  'bear:actor:borin': 'A human elder chieftain of the Bear clan (a man, not an animal), broad-shouldered and slightly stooped with age, a heavy grey-streaked bear-fur mantle over worn stone-grey armour, a closed helm crowned with a bear’s head that hides his face, a war hammer.',
  'bear:actor:bear_warrior': 'A human warrior of the Bear clan, a closed helmet, fur-lined mail, round wooden shield and spear, mountain colours (stone grey, brown, snow white).',
};
const CHARACTER_STYLE_REFS = [
  'public/assets/characters/pixel/masters/alistair.png',
  'public/assets/characters/pixel/masters/lion_champion.png',
];

/** The six Bear images of the pilot: four backdrops and two character masters. */
export const PILOT_IDS: readonly string[] = Object.freeze([
  'bear:scene:bear_arrival',
  'bear:scene:bear_audience',
  'bear:refuge:bear-first-refuge',
  'bear:surface:chronicle-end',
  'bear:actor:borin',
  'bear:actor:bear_warrior',
]);

function plateOf(context: string): string | null {
  try {
    const plate = demoEnvironmentPlateForContext(context) as { publicUrl?: string };
    return plate.publicUrl ? `public${plate.publicUrl}` : null;
  } catch {
    return null;
  }
}

const masterOf = (unitId: string) => `public/assets/characters/pixel/masters/${unitId}.png`;

/** Sentences joined with spaces, the empty ones left out. */
const sentences = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

/**
 * What the streams of a Lion layout become on each plateau's atlas. The sentence was written for the Bear's mountains and
 * fits the Dragon's peaks; the Scorpion's desert has no water but its oasis; the final act's capital channels its water
 * through the city (validated as is by the operator on 2026-11-12).
 */
export const ATLAS_STREAMS: Readonly<Partial<Record<Chapter, string>>> = Object.freeze({
  bear: 'Streams of the layout become icy mountain torrents.',
  dragon: 'Streams of the layout become icy mountain torrents.',
  scorpion: 'Streams, rivers and waterfalls of the layout become dry wadis: beds of cracked pale clay and sand with no water at all.',
  finale: 'Streams, rivers and waterfalls of the layout become narrow stone-lined channels of dark water stepping down through the city, crossed by its bridges.',
});

/**
 * The opening of a staged backdrop. The Arena of Destinies during the Tournament (`crowd`) keeps its crowd, far away in
 * the stands and never a figure on the ground; every other backdrop stays empty of people.
 */
function emptyOfPeople(staging: { crowd?: boolean }): string {
  return staging.crowd
    ? 'A wide environment tableau with no characters, no creatures and no silhouettes on the arena floor or in the foreground (characters are staged over it as separate sprites); the only people are the distant crowd in the stands, a dense, indistinct mass of tiny figures and specks of colour, never a readable figure.'
    : 'A wide environment tableau, empty of people: no characters, no creatures, no silhouettes (characters are staged over it as separate sprites).';
}

function promptFor(id: string, kind: Kind, chapter: Chapter, awaitedFinal: string, weapon: CombatWeapon | null = null): string {
  const look = PROPOSED_LOOKS[id] ?? STAGED_LOOKS[id] ?? '';
  const shadows = NAMES_SHADOWS.test(`${awaitedFinal} ${STAGING[id]?.line ?? ''} ${look}`) && SHADOWS_COLOUR_RULE;
  if (CREATURE_IDS.includes(id)) {
    return sentences(`${STYLE} One single full-body creature sprite, an animal and not a person: no armour, no clothing, no weapon, no shield, no banner. Three-quarter view, centred, feet near the bottom edge, on a fully transparent background, at the same pixel scale as the reference sprites. Subject: ${awaitedFinal}.`, shadows);
  }
  if (kind === 'character') {
    return sentences(`${STYLE} One single full-body character sprite, standing in a three-quarter view, centred, feet near the bottom edge, on a fully transparent background, at the same pixel scale as the reference sprites. ${COVERED_FACE_RULE} Subject: ${awaitedFinal}.`,
      weapon && weaponRule(weapon), SACRED_OBJECT_RULES[chapter], shadows,
      `Setting of the character: ${SETTINGS[chapter]} ${BREACH_CREATURE_IDS.includes(id) ? OUT_OF_BREACH_RULE : heraldryFor(chapter, awaitedFinal)}`);
  }
  const layout = ATLAS_LAYOUTS[id];
  if (layout) {
    return sentences(`${STYLE} An illustrated top-down region map of a fantasy land, painted like a game atlas, with no lettering. The reference image is this region’s existing map layout: repaint it completely in the identity below, but keep exactly the position, width and course of every road, path and crossing, and every clearing or site where a road meets another, so that map markers placed on the original still fall on the same roads and clearings. Sites stay open, readable clearings or small settlements.`,
      ATLAS_STREAMS[chapter], `Paint the blurred bands at the top and bottom as more terrain. Region: ${layout.line} ${IDENTITY[chapter] ?? SETTINGS[chapter]} ${heraldryFor(chapter, awaitedFinal)}`);
  }
  if (kind === 'atlas') {
    return `${STYLE} An illustrated top-down region map of a fantasy land, painted like a game atlas, with paths and landmarks but no lettering. Region: ${awaitedFinal}. ${SETTINGS[chapter]} ${heraldryFor(chapter, awaitedFinal)}`;
  }
  const staging = STAGING[id];
  if (staging) {
    // A staged backdrop: its own place and light, the plateau's identity instead of the shared setting sentence, and
    // banners only where the staging names them.
    // A closed interior stays closed; an exterior or a hall open onto the sky shows nothing built far away that the
    // staging does not name.
    const closed = staging.light === 'interior' && !staging.skyVisible;
    return sentences(`${STYLE} ${emptyOfPeople(staging)} Keep open, readable ground in the lower third for them. Staging: ${staging.line} ${IDENTITY[chapter] ?? SETTINGS[chapter]}`,
      closed ? CLOSED_INTERIOR_RULE : NOTHING_BUILT_FAR_RULE, shadows,
      `No banners, flags or emblems unless the staging names them. ${heraldryFor(chapter, `${awaitedFinal} ${staging.line}`)}`);
  }
  return sentences(`${STYLE} A wide environment tableau, eye-level establishing view of the place, empty of people: no characters, no creatures, no silhouettes (characters are staged over it as separate sprites). Leave open ground in the lower half for them. Scene: ${awaitedFinal}. ${SETTINGS[chapter]}`,
    shadows, heraldryFor(chapter, awaitedFinal));
}

/** Style references: by light for a staged backdrop, beasts for a creature or a demon, civilians for a civilian. */
function referencesFor(id: string, kind: Kind): readonly string[] {
  if (CREATURE_IDS.includes(id) || BREACH_CREATURE_IDS.includes(id)) return CREATURE_REFS;
  if (CIVILIAN_IDS.includes(id)) return CIVILIAN_REFS;
  if (kind === 'character') return CHARACTER_STYLE_REFS;
  if (ATLAS_LAYOUTS[id]) return [ATLAS_LAYOUTS[id]!.lionAtlas];
  const staging = STAGING[id];
  return staging ? LIGHT_REFS[staging.light] : BACKDROP_STYLE_REFS;
}

function brief(chapter: Chapter, group: string, key: string, kind: Kind, awaitedFinal: string, standIn: string | null,
  combatStandIn: string | null = null): FinalImageBrief {
  const character = kind === 'character';
  const id = `${chapter}:${group}:${key}`;
  // Style references only: the stand-in shows another place or person and would be copied; it stays on the review page.
  const samePlaceAs = STAGING[id]?.samePlaceAs;
  const weapon = character && !CREATURE_IDS.includes(id) ? combatWeaponOf(chapter, key, combatStandIn) : null;
  return {
    id, chapter, kind, awaitedFinal, standIn,
    size: character ? '1024x1024' : '1536x1024', transparent: character,
    references: [...referencesFor(id, kind)], prompt: promptFor(id, kind, chapter, awaitedFinal, weapon),
    notes: PROPOSED_LOOKS[id] ?? STAGED_LOOKS[id] ?? '', ...(samePlaceAs ? { samePlaceAs } : {}),
  };
}

interface PlateauModule {
  scenes: Readonly<Record<string, { environmentContext: string; awaitedFinal: string }>>;
  refuges: Readonly<Record<string, { environmentContext: string; awaitedFinal: string }>>;
  surfaces: readonly { surface: string; awaitedFinal: string }[];
  actors: readonly { actorId: string; standInUnitId: string; awaitedFinal: string }[];
  enemies: readonly { unitId: string; standInPortrait: string; awaitedFinal: string }[];
  atlases: readonly { shortTitle: string; image: string; awaitedFinal: string }[];
}

const PLATEAUX: Record<Chapter, PlateauModule> = {
  bear: { scenes: bear.BEAR_PROVISIONAL_SCENES, refuges: bear.BEAR_REFUGE_PRESENTATION, surfaces: bear.BEAR_PROVISIONAL_SURFACES,
    actors: bear.BEAR_PROVISIONAL_ACTORS, enemies: bear.BEAR_PROVISIONAL_ENEMIES, atlases: bear.BEAR_ATLAS_REGIONS },
  dragon: { scenes: dragon.DRAGON_PROVISIONAL_SCENES, refuges: dragon.DRAGON_REFUGE_PRESENTATION, surfaces: dragon.DRAGON_PROVISIONAL_SURFACES,
    actors: dragon.DRAGON_PROVISIONAL_ACTORS, enemies: dragon.DRAGON_PROVISIONAL_ENEMIES, atlases: dragon.DRAGON_ATLAS_REGIONS },
  scorpion: { scenes: scorpion.SCORPION_PROVISIONAL_SCENES, refuges: scorpion.SCORPION_REFUGE_PRESENTATION, surfaces: scorpion.SCORPION_PROVISIONAL_SURFACES,
    actors: scorpion.SCORPION_PROVISIONAL_ACTORS, enemies: scorpion.SCORPION_PROVISIONAL_ENEMIES, atlases: scorpion.SCORPION_ATLAS_REGIONS },
  finale: { scenes: finale.FINALE_PROVISIONAL_SCENES, refuges: finale.FINALE_REFUGE_PRESENTATION, surfaces: finale.FINALE_PROVISIONAL_SURFACES,
    actors: finale.FINALE_PROVISIONAL_ACTORS, enemies: finale.FINALE_PROVISIONAL_ENEMIES, atlases: finale.FINALE_ATLAS_REGIONS },
};

const slug = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Every provisional image of the post-demo plateaux, one brief each. A character listed as actor and enemy is one brief. */
export function buildPlan(): FinalImageBrief[] {
  const plan: FinalImageBrief[] = [];
  for (const [chapter, module] of Object.entries(PLATEAUX) as [Chapter, PlateauModule][]) {
    for (const [key, scene] of Object.entries(module.scenes)) plan.push(brief(chapter, 'scene', key, 'backdrop', scene.awaitedFinal, plateOf(scene.environmentContext)));
    for (const [key, refuge] of Object.entries(module.refuges)) plan.push(brief(chapter, 'refuge', key, 'backdrop', refuge.awaitedFinal, plateOf(refuge.environmentContext)));
    for (const surface of module.surfaces) {
      const key = /fin de chronique/i.test(surface.surface) ? 'chronicle-end' : slug(surface.surface);
      plan.push(brief(chapter, 'surface', key, 'backdrop', surface.awaitedFinal, null));
    }
    module.atlases.forEach((atlas, index) => plan.push(brief(chapter, 'atlas', String(index + 1), 'atlas', atlas.awaitedFinal, atlas.image ? `public${atlas.image}` : null)));
    const characters = new Set<string>();
    // A boss listed as an actor fights under its enemy entry's stand-in portrait: that is how the combat runtime lists it.
    const combatStandIn = new Map(module.enemies.map((enemy) => [enemy.unitId, enemy.standInPortrait]));
    for (const actor of module.actors) {
      characters.add(actor.actorId);
      plan.push(brief(chapter, 'actor', actor.actorId, 'character', actor.awaitedFinal, masterOf(actor.standInUnitId), combatStandIn.get(actor.actorId) ?? null));
    }
    for (const enemy of module.enemies) {
      if (characters.has(enemy.unitId)) continue;
      characters.add(enemy.unitId);
      plan.push(brief(chapter, 'enemy', enemy.unitId, 'character', enemy.awaitedFinal, masterOf(enemy.standInPortrait), enemy.standInPortrait));
    }
  }
  return plan;
}

/**
 * The operator's OpenAI key: OPENAI_API_KEY from the terminal, else the same variable from the project's env files
 * (.env.local, Git-ignored), read by Vite's own loader with only the OPENAI_ prefix. Returns where it came from, never
 * prints it.
 */
export function openAiKey(root: string = ROOT): { key: string; source: string } | null {
  if (process.env.OPENAI_API_KEY) return { key: process.env.OPENAI_API_KEY, source: 'the terminal' };
  const fromFiles = loadEnv('production', root, 'OPENAI_').OPENAI_API_KEY;
  return fromFiles ? { key: fromFiles, source: 'the project env file (.env.local)' } : null;
}

function readPlan(): FinalImageBrief[] {
  if (!existsSync(PLAN)) throw new Error('No plan yet: run "plan" first.');
  return JSON.parse(readFileSync(PLAN, 'utf8')) as FinalImageBrief[];
}

const fileOf = (id: string) => `${id.replace(/[^a-zA-Z0-9_-]+/g, '__')}.png`;

/**
 * Appends a run's new entries to log.json, reading the file again first. Each run used to rewrite the whole log from the
 * copy it read at start, so two runs at once (two passes of the Dragon) could drop each other's entries. The file is
 * written to a temporary name and renamed over the log, so another run never reads it half written.
 */
export function appendToLog(logPath: string, entries: readonly unknown[]): void {
  if (!entries.length && existsSync(logPath)) return;
  const current = existsSync(logPath) ? JSON.parse(readFileSync(logPath, 'utf8')) as unknown[] : [];
  const temporary = `${logPath}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify([...current, ...entries], null, 2)}\n`);
  renameSync(temporary, logPath);
}

/** The brief's references, plus the generated image of the same place when it exists (Borin's hall from one image to the next). */
function referencesOf(item: FinalImageBrief): string[] {
  const layout = ATLAS_LAYOUTS[item.id];
  if (layout) {
    // The letterboxed layout (tools/art/atlas_layout.py prepare) replaces the Lion atlas it was made from.
    const prepared = ['tmp', 'final-images', 'layouts', fileOf(item.id)].join('/');
    if (!existsSync(join(ROOT, prepared))) throw new Error(`No layout for ${item.id}: run py -3 tools/art/atlas_layout.py prepare ${layout.lionAtlas} ${prepared}`);
    return [prepared];
  }
  const samePlace = item.samePlaceAs ? ['tmp', 'final-images', 'out', fileOf(item.samePlaceAs)].join('/') : null;
  return samePlace && existsSync(join(ROOT, samePlace)) ? [...item.references, samePlace] : [...item.references];
}

async function generate(item: FinalImageBrief, key: string, model: string, quality: string): Promise<Buffer> {
  return requestImage(item.notes ? `${item.prompt} ${item.notes}` : item.prompt, item.size, item.transparent, referencesOf(item), key, model, quality);
}

/** One call to the OpenAI image edit endpoint; references are repository paths. */
async function requestImage(prompt: string, size: string, transparent: boolean, references: readonly string[], key: string, model: string, quality: string): Promise<Buffer> {
  const form = new FormData();
  form.append('model', model);
  form.append('prompt', prompt);
  form.append('size', size);
  form.append('quality', quality);
  form.append('n', '1');
  if (transparent) form.append('background', 'transparent');
  for (const reference of references) {
    const bytes = readFileSync(join(ROOT, reference));
    form.append('image[]', new Blob([bytes], { type: 'image/png' }), reference.split('/').pop());
  }
  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form,
  });
  const body = await response.json() as { data?: { b64_json?: string }[]; error?: { message?: string } };
  if (!response.ok || !body.data?.[0]?.b64_json) throw new Error(`OpenAI ${response.status}: ${body.error?.message ?? 'no image returned'}`);
  return Buffer.from(body.data[0].b64_json, 'base64');
}

/**
 * Combat poses (OD-2026-11-13-A, tools/art/combatPosesTable.ts). Two steps per unit: `pose` draws dash, then attack and
 * cast with the accepted dash as a second reference, all without effects so that their scale can be measured on the
 * master; `fx` adds the baked effect of attack and cast by editing those poses, which leaves the drawing in place.
 * Outputs go to tmp/combat-poses/out/ (ignored by Git); tools/pixel-sprites/normalize_combat_poses.py takes them from there.
 */
export const POSE_DIR = join(ROOT, 'tmp', 'combat-poses');
export const poseOut = (unitId: string, pose: PoseName, fx = false) => ['tmp', 'combat-poses', 'out', `${unitId}__${pose}${fx ? '__fx' : ''}.png`].join('/');

export interface PoseBrief {
  unitId: string;
  pose: PoseName;
  step: 'pose' | 'fx';
  size: '1024x1024' | '1536x1024';
  prompt: string;
  references: string[];
  out: string;
}

const NO_EFFECTS = 'Absolutely no visual effects: no glow, no aura, no light rays, no sparks, no particles, no motion trails, no speed lines, no magic circle, no shadow on the ground. Effects are added later.';
const NO_OTHER_EFFECTS = 'No other visual effect: no glow, no aura, no light rays, no sparks, no particles, no motion trails, no speed lines, no magic circle, no shadow on the ground. Effects are added later.';

export function posePrompt(unitId: string, pose: PoseName, withDash: boolean): string {
  const unit = POSE_UNITS[unitId]!;
  return sentences(STYLE,
    `The first attached image is our own game character: ${unit.look}`,
    withDash && 'The second attached image shows the same character in its dash pose, already accepted: keep exactly the same look.',
    'Draw this exact same character again in a new combat pose. Keep everything identical to the reference: the same body, armour and clothes, the same colours, the same proportions and the same weapon, held the same way.',
    unit.weapon, unit.intrinsic,
    'Keep the character at exactly the size it has in the first image, with its feet on the same ground line near the bottom of the canvas. One single full-body sprite, never cropped, with empty space all around it, on a fully transparent background.',
    unit.body !== 'quadruped' && COVERED_FACE_RULE,
    unit.body === 'person' && 'The helmet, mask or hood stays in place in this pose, even when the head turns or bends.',
    unit.colour === 'ink' && SHADOWS_COLOUR_RULE,
    `Pose: ${unit.actions[pose]}. The character faces and moves to the RIGHT.`,
    unit.intrinsic ? NO_OTHER_EFFECTS : NO_EFFECTS);
}

export function poseFxPrompt(unitId: string, pose: PoseName): string {
  const unit = POSE_UNITS[unitId]!;
  return sentences(STYLE,
    'The first attached image is our own combat pose of this character; the second is its master illustration.',
    'Keep the character exactly as in the first image: the same pose, the same size, the same position on the canvas, the same look and the same weapon. Do not redraw or move it.',
    `Add only one effect attached to the action, drawn in the same pixel-art technique as the character, as on the other combat poses of our game: ${unit.fx[pose as 'attack' | 'cast']}.`,
    effectColours(pose === 'cast' && unit.castColour ? unit.castColour : unit.colour),
    unit.body !== 'quadruped' && COVERED_FACE_RULE,
    'The effect stays close to the character, light and thin, and never hides the character; it stays fully inside the canvas, never cropped. Fully transparent background around the character and the effect; no shadow on the ground, no text.');
}

/** The briefs of one step for some units; `exists` tells which outputs are already there (the dash reference, the poses to edit). */
export function buildPoseBriefs(unitIds: readonly string[], step: 'pose' | 'fx', exists: (path: string) => boolean = (path) => existsSync(join(ROOT, path))): PoseBrief[] {
  return unitIds.flatMap((unitId) => {
    const unit = POSE_UNITS[unitId];
    if (!unit) throw new Error(`Not a pose unit: ${unitId}`);
    return POSES.filter((pose) => step === 'pose' || hasFx(unit, pose)).map((pose): PoseBrief => {
      if (step === 'fx') return { unitId, pose, step, size: poseSize(unit, pose), prompt: poseFxPrompt(unitId, pose), references: [poseOut(unitId, pose), unit.master], out: poseOut(unitId, pose, true) };
      const withDash = pose !== 'dash' && exists(poseOut(unitId, 'dash'));
      const reference = poseReference(unitId, pose);
      return { unitId, pose, step, size: poseSize(unit, pose), prompt: posePrompt(unitId, pose, withDash),
        references: withDash ? [reference, poseOut(unitId, 'dash')] : [reference], out: poseOut(unitId, pose) };
    });
  });
}

/** The table as the normalizer reads it (tmp/combat-poses/units.json): master, height, group and the poses with an effect. */
export function writePoseTable(): void {
  mkdirSync(POSE_DIR, { recursive: true });
  const table = Object.fromEntries(Object.entries(POSE_UNITS).map(([id, unit]) => [id, {
    group: unit.group, master: unit.master, worldHeight: unit.worldHeight, body: unit.body,
    fxPoses: POSES.filter((pose) => hasFx(unit, pose)),
  }]));
  writeFileSync(join(POSE_DIR, 'units.json'), `${JSON.stringify(table, null, 2)}\n`);
}

async function runPoses(args: string[], option: (name: string) => string | undefined): Promise<void> {
  writePoseTable();
  const found = openAiKey();
  if (!found) throw new Error('No OPENAI_API_KEY in this terminal or in .env.local; the tool never prints or stores it.');
  console.log(`OpenAI access: ${found.source} (value never shown).`);
  const group = option('--group') as PoseGroup | undefined;
  const units = group ? unitsOf(group) : (option('--units') ?? '').split(',').map((id) => id.trim()).filter(Boolean);
  if (!units.length) throw new Error('Choose units with --group heroes|bear|dragon|scorpion|finale or --units id1,id2.');
  const step = (option('--step') ?? 'pose') as 'pose' | 'fx';
  const only = option('--poses')?.split(',') as PoseName[] | undefined;
  const model = option('--model') ?? 'gpt-image-2.5-sunburst-2026-09-08';
  const quality = option('--quality') ?? 'high';
  const concurrency = Math.max(1, Math.min(6, Number(option('--concurrency') ?? 4) || 4));
  mkdirSync(join(POSE_DIR, 'out'), { recursive: true });
  const logPath = join(POSE_DIR, 'log.json');
  const pending = (briefs: PoseBrief[]) => briefs.filter((brief) => (!only || only.includes(brief.pose))
    && (args.includes('--force') || !existsSync(join(ROOT, brief.out))));
  let failed = 0;
  const runAll = async (briefs: PoseBrief[]) => {
    let next = 0;
    const worker = async () => {
      while (next < briefs.length) {
        const brief = briefs[next++]!;
        try {
          writeFileSync(join(ROOT, brief.out), await requestImage(brief.prompt, brief.size, true, brief.references, found.key, model, quality));
          appendToLog(logPath, [{ ...brief, model, quality, at: new Date().toISOString() }]);
          console.log(`done: ${brief.out}`);
        } catch (error) {
          failed += 1;
          console.log(`failed: ${brief.out}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, briefs.length) }, worker));
  };
  if (step === 'pose') {
    const missing = units.filter((id) => POSES.some((pose) => !existsSync(join(ROOT, poseReference(id, pose)))));
    if (missing.length) throw new Error(`No reference canvas for ${missing.join(', ')}: run py -3 tools/pixel-sprites/normalize_combat_poses.py --prepare-refs --units ${missing.join(',')}`);
    // Dash first: attack and cast take the accepted dash as their second reference.
    await runAll(pending(buildPoseBriefs(units, 'pose')).filter((brief) => brief.pose === 'dash'));
    await runAll(pending(buildPoseBriefs(units, 'pose')).filter((brief) => brief.pose !== 'dash'));
  } else {
    await runAll(pending(buildPoseBriefs(units, 'fx')).filter((brief) => existsSync(join(ROOT, brief.references[0]!))));
  }
  console.log(`Finished${failed ? ` with ${failed} failed` : ''}. Outputs in tmp/combat-poses/out/.`);
}

function reviewPage(items: FinalImageBrief[]): string {
  const rows = items.map((item) => {
    const out = join(OUT_DIR, 'out', fileOf(item.id));
    const generated = existsSync(out) ? `<img src="out/${fileOf(item.id)}" alt="">` : '<p>Pas encore générée</p>';
    const standIn = item.standIn ? `<img src="../../${item.standIn}" alt="">` : '<p>Aucune image provisoire</p>';
    return `<section><h2>${item.id}</h2><p>${item.awaitedFinal}</p><div class="pair"><figure>${standIn}<figcaption>Provisoire</figcaption></figure><figure>${generated}<figcaption>Générée</figcaption></figure></div></section>`;
  }).join('\n');
  return `<!doctype html><meta charset="utf-8"><title>Images finales : relecture</title><style>body{font:15px system-ui;background:#14161b;color:#e8e9ec;margin:24px}section{margin:0 0 32px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}img{max-width:100%;background:repeating-conic-gradient(#2a2d35 0 25%,#1d2027 0 50%) 0 0/24px 24px}figure{margin:0}h2{font-size:16px;margin:0 0 4px}</style><h1>Images finales : relecture</h1>${rows}`;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((arg) => arg !== '--');
  const command = args[0] ?? 'plan';
  const option = (name: string) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
  mkdirSync(join(OUT_DIR, 'out'), { recursive: true });
  if (command === 'plan') {
    const plan = buildPlan();
    writeFileSync(PLAN, `${JSON.stringify(plan, null, 2)}\n`);
    const counts = plan.reduce<Record<string, number>>((all, item) => ({ ...all, [item.kind]: (all[item.kind] ?? 0) + 1 }), {});
    console.log(`Plan written: ${plan.length} images (${Object.entries(counts).map(([kind, count]) => `${count} ${kind}`).join(', ')}) in tmp/final-images/plan.json`);
    console.log(`Pilot: ${PILOT_IDS.join(', ')}`);
    return;
  }
  if (command === 'poses') return runPoses(args, option);
  if (command === 'poses-table') { writePoseTable(); console.log('Pose table written: tmp/combat-poses/units.json'); return; }
  if (command !== 'run') throw new Error(`Unknown command "${command}": use plan, run or poses.`);
  const found = openAiKey();
  if (!found) throw new Error('No OPENAI_API_KEY in this terminal or in .env.local; the tool never prints or stores it.');
  const key = found.key;
  console.log(`OpenAI access: ${found.source} (value never shown).`);
  const plan = readPlan();
  const chapter = option('--chapter');
  const ids = args.includes('--pilot') ? [...PILOT_IDS]
    : chapter ? plan.filter((item) => item.chapter === chapter).map((item) => item.id)
      : (option('--ids') ?? '').split(',').map((id) => id.trim()).filter(Boolean);
  if (!ids.length) throw new Error('Choose images with --pilot, --chapter bear|dragon|scorpion|finale or --ids id1,id2.');
  const selected = ids.map((id) => { const item = plan.find((candidate) => candidate.id === id); if (!item) throw new Error(`Not in the plan: ${id}`); return item; });
  // The model of the project's earlier approved OpenAI images (tools/cinematics/specs/cin6ea3_pilot_e_image_gate.json).
  const model = option('--model') ?? 'gpt-image-2.5-sunburst-2026-09-08';
  const quality = option('--quality') ?? 'high';
  const logPath = join(OUT_DIR, 'log.json');
  const newEntries: unknown[] = [];
  const pending = selected.filter((item) => {
    const skip = existsSync(join(OUT_DIR, 'out', fileOf(item.id))) && !args.includes('--force');
    if (skip) console.log(`Already generated: ${item.id}`);
    return !skip;
  });
  // A few requests at once (--concurrency, default 1); the log and the review page are rewritten after each image, so an
  // interrupted run keeps what it made.
  const concurrency = Math.max(1, Math.min(6, Number(option('--concurrency') ?? 1) || 1));
  const save = () => {
    appendToLog(logPath, newEntries.splice(0));
    writeFileSync(join(OUT_DIR, 'review.html'), reviewPage(selected));
  };
  let next = 0;
  let failed = 0;
  const worker = async () => {
    while (next < pending.length) {
      const item = pending[next++]!;
      try {
        writeFileSync(join(OUT_DIR, 'out', fileOf(item.id)), await generate(item, key, model, quality));
        newEntries.push({ id: item.id, model, quality, size: item.size, prompt: item.prompt, notes: item.notes, references: referencesOf(item), at: new Date().toISOString() });
        console.log(`done: ${item.id}`);
      } catch (error) {
        failed += 1;
        console.log(`failed: ${item.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
      save();
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, worker));
  save();
  console.log(`Finished: ${pending.length - failed} generated, ${failed} failed. Review page: tmp/final-images/review.html`);
}

// Runs as a command (vite-node); a test that imports buildPlan does not start it.
if (!process.env.VITEST) {
  main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
}

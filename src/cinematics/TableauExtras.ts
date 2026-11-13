/**
 * Silent extras of the ordinary dialogue tableaux (set 1.24.0, PRESENTATION_AND_MEDIA « Tableau extras »,
 * OD-2026-11-13-G): civilians of the scene's own part, drawn from the existing civilian masters only, standing or passing
 * far behind the narrative actors as moving scenery. They have no line, name, role, focus or facing relation; they are
 * never counted as actors, never handed to the staging planner, and never saved. Each dialogue lists its extras against
 * the one painting they were placed on: over any other picture, none show.
 */

export type TableauExtrasPart = 'lion' | 'bear' | 'dragon' | 'scorpion' | 'finale';

const MASTERS = '/assets/characters/pixel/masters';
const POST_DEMO = '/assets/characters/pixel/post-demo';

/**
 * The existing civilian masters of each part, and nothing else: no generated variant, no combatant, no named character.
 * The Lion's village militia are left out: in the story they stand against the company when it silences the witnesses.
 */
export const TABLEAU_EXTRA_SPRITES: Readonly<Record<TableauExtrasPart, Readonly<Record<string, string>>>> = Object.freeze({
  lion: Object.freeze({
    villageois: `${MASTERS}/villageois.png`,
    villageoise: `${MASTERS}/villageoise.png`,
    refugee: `${MASTERS}/refugee.png`,
    refugee_mother: `${MASTERS}/refugee_mother.png`,
    survivor: `${MASTERS}/survivor.png`,
    wounded_merchant: `${MASTERS}/wounded_merchant.png`,
  }),
  bear: Object.freeze({ bear_miner: `${POST_DEMO}/bear/bear_miner.png` }),
  dragon: Object.freeze({ dragon_villager: `${POST_DEMO}/dragon/dragon_villager.png`, dragon_pilgrim: `${POST_DEMO}/dragon/dragon_pilgrim.png` }),
  scorpion: Object.freeze({ phoenix_faithful: `${POST_DEMO}/scorpion/phoenix_faithful.png`, phoenix_captive: `${POST_DEMO}/scorpion/phoenix_captive.png` }),
  finale: Object.freeze({ finale_citizen: `${POST_DEMO}/finale/finale_citizen.png`, finale_civilian: `${POST_DEMO}/finale/finale_civilian.png` }),
});

/** At most twelve extras in one tableau, as in the living tableaux. */
export const TABLEAU_EXTRAS_CAP = 12;

/** Every civilian master is a 512 px square with the feet on row 456 (`tools/art/publish_final_images.py`). */
export const EXTRA_MASTER_SIZE = 512;
export const EXTRA_MASTER_FEET_ROW = 456;

/**
 * One extra, in the painting's own pixels: where the feet stand (`x`, `y`) and how tall the master's square is drawn
 * (`size`). A passer walks to `to` (the same row) in `seconds` and starts again; reduced motion keeps only those who stand.
 */
export interface TableauExtra {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly facing: 'LEFT' | 'RIGHT';
  readonly pass?: { readonly to: number; readonly seconds: number; readonly delay?: number };
}

export interface TableauExtrasEntry {
  readonly part: TableauExtrasPart;
  /** The painting the extras were placed on, as the end of its URL. */
  readonly image: string;
  readonly frame: { readonly width: number; readonly height: number };
  /** The scene's light on them, as a brightness: they stay dimmer than the actors. */
  readonly light: number;
  readonly extras: readonly TableauExtra[];
}

const LION_FRAME = Object.freeze({ width: 1672, height: 941 });
const POST_DEMO_FRAME = Object.freeze({ width: 1536, height: 1024 });
const LION_TABLEAU = 'lion-phase/environments/demo-environment-pack-v1/tableau';

const stand = (id: string, x: number, y: number, size: number, facing: TableauExtra['facing']): TableauExtra => ({ id, x, y, size, facing });
const pass = (id: string, x: number, y: number, size: number, to: number, seconds: number, delay = 0): TableauExtra =>
  ({ id, x, y, size, facing: to < x ? 'LEFT' : 'RIGHT', pass: { to, seconds, delay } });

const lion = (image: string, light: number, extras: readonly TableauExtra[]): TableauExtrasEntry =>
  Object.freeze({ part: 'lion', image, frame: LION_FRAME, light, extras: Object.freeze(extras) });
const postDemo = (part: Exclude<TableauExtrasPart, 'lion'>, dialogueId: string, light: number, extras: readonly TableauExtra[]): TableauExtrasEntry =>
  Object.freeze({ part, image: `post-demo/${part}/scenes/${dialogueId}.webp`, frame: POST_DEMO_FRAME, light, extras: Object.freeze(extras) });

const BURNING = `${LION_TABLEAU}/bois-clair-tableau-burning.png`;

/**
 * The ordinary dialogues dressed with extras, each where its own lines already place civilians on the spot. No extra
 * shows a fact the dialogue does not state, and no dialogue that keeps a place empty or counts its people is dressed.
 */
export const TABLEAU_EXTRAS: Readonly<Record<string, TableauExtrasEntry>> = Object.freeze({
  // Lion. « Une trentaine de personnes avancent sans chariot. »
  refugee_trial: lion(`${LION_TABLEAU}/refugee-road-tableau.png`, 0.92, [
    pass('refugee', 1330, 576, 196, 700, 44),
    pass('villageois', 1330, 590, 202, 700, 44, 22),
    stand('survivor', 1520, 642, 222, 'LEFT'),
    stand('villageoise', 1592, 622, 214, 'LEFT'),
  ]),
  // « Ils emmènent les enfants vers le nord. » The villagers of the arrival sequence, still in the square.
  village_choice: lion(BURNING, 0.9, [
    stand('villageois', 715, 562, 196, 'RIGHT'),
    stand('refugee', 885, 548, 188, 'LEFT'),
    stand('survivor', 1500, 552, 196, 'LEFT'),
  ]),
  // « Des réfugiés sont revenus de la route. »
  ate_village_fear: lion(BURNING, 0.9, [
    stand('survivor', 380, 590, 206, 'RIGHT'),
    stand('villageois', 850, 548, 180, 'LEFT'),
    stand('refugee', 1300, 585, 204, 'LEFT'),
  ]),
  // « Répondez devant ceux qui ont survécu à Bois-Clair. »
  rep_event_bois_clair_denunciation: lion(BURNING, 0.9, [
    stand('villageois', 470, 590, 206, 'RIGHT'),
    stand('villageoise', 590, 576, 200, 'RIGHT'),
    stand('survivor', 1110, 578, 200, 'LEFT'),
    stand('refugee', 1230, 592, 206, 'LEFT'),
  ]),
  // « Nous graverons les noms ici, là où chacun connaît leur voix. »
  rep_event_village_memorial_request: lion(BURNING, 0.9, [
    stand('villageoise', 1130, 580, 200, 'LEFT'),
    stand('villageois', 1240, 592, 206, 'LEFT'),
  ]),
  // « La nuit est tombée, mais personne ne dort. Les survivants dressent des listes. »
  ate_bois_clair_night_watch: lion('lion-phase/environments/corrections/bois-clair-night-watch-v1.png', 0.8, [
    stand('villageois', 900, 575, 196, 'RIGHT'),
    stand('refugee_mother', 1010, 585, 202, 'LEFT'),
    stand('survivor', 1420, 610, 214, 'LEFT'),
  ]),
  // Saved: « Les enfants sont sains et saufs. » The villagers of the saved sequence.
  village_defense_aftermath: lion(`${LION_TABLEAU}/bois-clair-tableau-aftermath-saved.png`, 0.92, [
    stand('villageois', 450, 585, 204, 'RIGHT'),
    stand('refugee_mother', 580, 575, 200, 'RIGHT'),
    stand('refugee', 1120, 575, 198, 'LEFT'),
    stand('survivor', 1240, 590, 206, 'LEFT'),
  ]),
  // Sacrificed: « Mais les villageois… ils ne nous maudiront pas à voix haute. » The villagers of the sacrificed sequence.
  village_raid_aftermath: lion(`${LION_TABLEAU}/bois-clair-tableau-aftermath-sacrificed.png`, 0.85, [
    stand('villageois', 760, 560, 186, 'RIGHT'),
    stand('refugee', 880, 552, 182, 'LEFT'),
    stand('survivor', 1340, 600, 212, 'LEFT'),
  ]),
  // « Les survivants ont dressé leur camp loin du nôtre. »
  witnesses_on_road: lion(`${LION_TABLEAU}/witness-road-tableau.png`, 0.92, [
    stand('villageois', 990, 430, 110, 'LEFT'),
    stand('refugee', 1040, 425, 106, 'LEFT'),
    stand('villageoise', 1090, 435, 112, 'LEFT'),
  ]),

  // Bear. « Nous étions dans les galeries quand le Corbeau les a prises. »
  bear_miners_testimony: postDemo('bear', 'bear_miners_testimony', 0.9, [
    stand('bear_miner', 960, 650, 220, 'LEFT'),
    stand('bear_miner', 1290, 720, 250, 'LEFT'),
  ]),
  // « Les galeries sont à nous de nouveau ! »
  bear_mines_defense_aftermath: postDemo('bear', 'bear_mines_defense_aftermath', 1, [
    stand('bear_miner', 760, 560, 196, 'RIGHT'),
    stand('bear_miner', 880, 575, 202, 'LEFT'),
    stand('bear_miner', 1290, 640, 220, 'LEFT'),
  ]),

  // Dragon. « Des portes barricadées, des enfants cachés dans les granges. »
  dragon_terrorized_village: postDemo('dragon', 'dragon_terrorized_village', 0.9, [
    stand('dragon_villager', 800, 520, 180, 'RIGHT'),
    stand('dragon_villager', 1350, 600, 214, 'LEFT'),
  ]),
  // « Le Loup nous retenait au repaire pour porter ses vivres. »
  dragon_freed_pilgrims: postDemo('dragon', 'dragon_freed_pilgrims', 0.9, [
    stand('dragon_pilgrim', 930, 610, 196, 'LEFT'),
    stand('dragon_pilgrim', 975, 545, 176, 'LEFT'),
  ]),

  // Scorpion. « Des fidèles du Phénix gardent la route de leur temple. »
  scorpion_phoenix_faithful: postDemo('scorpion', 'scorpion_phoenix_faithful', 0.92, [
    stand('phoenix_faithful', 800, 470, 150, 'RIGHT'),
    stand('phoenix_faithful', 1360, 660, 222, 'LEFT'),
    stand('phoenix_faithful', 170, 640, 222, 'RIGHT'),
  ]),
  // « Nous avons fui le temple pendant le combat. »
  scorpion_temple_witnesses: postDemo('scorpion', 'scorpion_temple_witnesses', 0.92, [
    stand('phoenix_faithful', 940, 600, 196, 'LEFT'),
    stand('phoenix_faithful', 1290, 640, 214, 'LEFT'),
  ]),
});

/** The extras of a dialogue, only over the painting they were placed on. */
export function tableauExtrasFor(dialogueId: string | undefined, backgroundImage: string | undefined): TableauExtrasEntry | undefined {
  const entry = dialogueId ? TABLEAU_EXTRAS[dialogueId] : undefined;
  if (!entry || !backgroundImage) return undefined;
  return backgroundImage.includes(entry.image) ? entry : undefined;
}

/** The URL of an extra's master. */
export function tableauExtraSprite(part: TableauExtrasPart, id: string): string | undefined {
  return TABLEAU_EXTRA_SPRITES[part][id];
}

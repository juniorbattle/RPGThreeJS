/**
 * Staging of the final images (OD-2026-11-11-F, F1), validated by the operator on 2026-11-12 with one instruction: keep
 * the demo's pixel-art technique, but give each plateau a visual identity of its own, not a copy of the Lion's images.
 * French source of the lines: docs/content/drafts/BEAR_BACKDROP_STAGING_DRAFT_2026-11-12.md. Places and objects come from
 * the scenes' own lines; times of day and unnamed places are staging choices the operator validated, not canon.
 */

/** The light of a backdrop picks its two style references among the approved Lion tableaux (technique only). */
export type Light = 'day' | 'dusk' | 'nightFire' | 'interior';

const TABLEAU = 'public/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau';
export const LIGHT_REFS: Readonly<Record<Light, readonly string[]>> = Object.freeze({
  day: [`${TABLEAU}/valmir-road-tableau.png`, `${TABLEAU}/witness-road-tableau.png`],
  dusk: [`${TABLEAU}/lion-trial-tableau-aftermath.png`, `${TABLEAU}/roadside-event-tableau.png`],
  nightFire: [`${TABLEAU}/final-refuge-tableau.png`, `${TABLEAU}/second-refuge-night-tableau.png`],
  interior: [`${TABLEAU}/alaric-audience-tableau.png`, `${TABLEAU}/shadow-ruins-tableau.png`],
});

const MASTERS = 'public/assets/characters/pixel/masters';
/** Beasts take beasts as references: with the knights' masters the first run drew both beasts as armoured knights. */
export const CREATURE_REFS: readonly string[] = Object.freeze([`${MASTERS}/wolf.png`, `${MASTERS}/wild_boar.png`]);
export const CIVILIAN_REFS: readonly string[] = Object.freeze([`${MASTERS}/survivor.png`, `${MASTERS}/refugee.png`]);
export const CREATURE_IDS: readonly string[] = Object.freeze(['bear:enemy:corrupted_beast', 'bear:enemy:depth_beast']);
export const CIVILIAN_IDS: readonly string[] = Object.freeze(['bear:actor:bear_miner']);

/**
 * Each plateau's own look. The first Bear run copied the Lion's lowland motifs (waterfalls, aqueducts, distant castles,
 * gold halls) because every brief asked for the references' exact palette. A plateau without an identity yet keeps its
 * setting sentence; each gets one, proposed with its staging, before its run.
 */
export const IDENTITY: Readonly<Record<string, string>> = Object.freeze({
  bear: 'Visual identity of the Bear clan’s mountains, distinct from the Lion’s green lowlands: a harsh high-altitude land of bare granite, scree, ice and wind-driven snow. Palette: cold slate and granite greys, blue-white snow, dark weathered timber, iron and soot black, warm amber only from fires, torches and lanterns, small touches of rust and fur brown. Bear building is massive, low and squat: rough-hewn granite blocks built into and carved out of the living rock, heavy timber props and beams, plank walkways, iron chains and winches, fur hides, angular carved reliefs of bears. Never the Lion’s motifs: no Gothic arches, pointed windows or slender spires, no aqueducts, no waterfalls or rivers, no fairy-tale castles on the horizon, no lush green forest, no red-and-gold.',
});

export interface Staging {
  light: Light;
  line: string;
  /** Another brief showing the same place: its generated image, when it exists, joins the references. */
  samePlaceAs?: string;
}

const HALL = 'bear:scene:bear_audience';

export const STAGING: Readonly<Record<string, Staging>> = Object.freeze({
  'bear:scene:bear_arrival': { light: 'day', line: 'Exterior, cold clear morning. The foot of the mountains: a trail of earth and stones starts climbing toward snowy passes far away, between scattered firs and boulders; snow only on the heights. Wild and empty: no buildings, no structures, no lanterns, no banner anywhere; nobody waits for the company here.' },
  'bear:scene:bear_audience': { light: 'interior', line: 'Interior of the Bear chieftain’s hall, hewn into the mountain rock: a long low hall of rough granite under heavy dark timber beams, a glowing central fire pit, fur hides on the walls, carved bear reliefs on squat pillars, a massive stone seat at the far end. A few Bear banners hang near the seat. Indoors only: no sky, no window onto a landscape.' },
  'bear:scene:bear_raven_messenger': { light: 'day', line: 'Under snow-laden firs away from the trail, grey overcast day: a small clearing of pine needles and melting snow, the trail glimpsed between the trunks in the background. Wild forest only: no building or structure anywhere, even far away; no banner.' },
  'bear:scene:bear_trapped_miners': { light: 'day', line: 'Exterior mountainside by day, dust still settling: the mouth of a mine gallery blocked by a rockfall of big boulders, broken timber props sticking out of it; sacks of ore set on the ground to one side.' },
  'bear:scene:bear_raven_traps': { light: 'day', line: 'A narrow mountain trail between boulders, hard high-altitude daylight, snow along the edges: thin tripwires stretched across the path at ankle height, leather skins of powder tucked under stones. Wild mountainside only: no building or structure anywhere, even far away; no banner.' },
  'bear:scene:bear_outpost_gathering': { light: 'dusk', line: 'The courtyard of a small Bear outpost in a mountain pass at dusk: low walls of rough stone, one squat watchtower, guarded fires in braziers, the wind flattening their smoke. A single Bear banner above the gate. A small outpost, not a fortress or a city.' },
  'bear:refuge:bear-first-refuge': { samePlaceAs: 'bear:scene:bear_outpost_gathering', light: 'nightFire', line: 'The same small Bear outpost in a mountain pass at night: low rough stone walls, one squat watchtower, fires lit in braziers against the wind, the courtyard cleared for the company to rest. A single Bear banner above the gate. Not a fortress or a city.' },
  'bear:scene:bear_ore_convoy': { light: 'day', line: 'Overcast day, seen from a rocky lookout: a mountain road winding down from the mine galleries in hairpin bends to a stone bridge over a dry ravine, a milestone at the roadside, deep cart ruts with a few black stones fallen in them. No carts, no animals.' },
  'bear:scene:bear_ancient_relic': { light: 'interior', line: 'Underground, by the light of a single torch: a mine gallery collapsed long ago, rotten beams, fallen blocks, thick dust. In the middle ground, half buried in the dust, a small statuette of a rearing bear carved in dark stone, set with one red gem. No sky, no hanging crystal, no magic glow.' },
  'bear:scene:bear_sacred_mines': { light: 'day', line: 'Exterior, grey day: the entrance of the Bear’s sacred mine galleries hewn into a cliff face, great carved bears on either side. In front, the Raven’s worksite: tents, winches, empty carts, and Raven banners planted in front of the Bear carvings.' },
  'bear:scene:bear_pre_mines_defense': { light: 'interior', line: 'Deep underground inside the mine, no sky: a large timber-propped mine chamber with rails, a winch above a descending shaft, a barricade of overturned carts and crates, Raven banners nailed over carved Bear reliefs. Torchlight only.' },
  'bear:scene:bear_mines_defense_aftermath': { samePlaceAs: 'bear:scene:bear_pre_mines_defense', light: 'interior', line: 'Deep underground, the same timber-propped mine chamber after the fight, no sky: the barricade broken apart, Raven banners torn down on the floor, the carved Bear reliefs visible again, calm torchlight.' },
  'bear:scene:bear_pre_mines_seizure': { light: 'interior', line: 'Deeper underground, no sky: a Raven barricade of carts and crates across a mine gallery whose rails run down toward the back, where a dull black vein crosses the rock, still small and far away. Torchlight only.' },
  'bear:scene:bear_mines_seizure_aftermath': { samePlaceAs: 'bear:scene:bear_pre_mines_seizure', light: 'interior', line: 'Deep underground, the same gallery after the fight, no sky: the barricade broken, mine carts loaded with black stones, the dull black vein at the back. No banner anywhere.' },
  'bear:refuge:bear-second-refuge': { light: 'interior', line: 'Interior of the miners’ shelter near the galleries: a low room hewn in the rock, a smoky central hearth, straw pallets, tools hanging on the walls, lanterns. Cold stone and smoke. Indoors only: no sky.' },
  'bear:scene:bear_miners_testimony': { light: 'day', line: 'Pale early morning on a mountain trail coming down from the mine galleries toward the valleys: abandoned Raven carts on the roadside, miners’ tools laid on a rock. Open wild slopes: no fortress or town in view.' },
  'bear:scene:bear_mountain_shrine': { light: 'day', line: 'Daylight, wind and light snow: a small stone shrine set against the rock face with a carved bear; at its foot, offerings: miners’ tools, polished stones, a purse of old coins. Intimate and small: no temple, no grand stairway, no other building or structure in view.' },
  'bear:scene:bear_dark_vein': { light: 'interior', line: 'The very bottom of the mine galleries, deep underground, no sky: a rock wall crossed by a dull black vein that swallows the light of the torches set in the timber props; the shadows seem to ripple around it. No crystals, no purple glow.' },
  'bear:scene:bear_vigil': { light: 'nightFire', line: 'Night: a single campfire on a rocky ledge high in the mountains; far across the valley, the lit openings of the Bear chieftain’s hall carved into the mountainside, where the company will be judged tomorrow.' },
  'bear:refuge:bear-final-refuge': { samePlaceAs: 'bear:scene:bear_vigil', light: 'nightFire', line: 'Night: a single campfire on a rocky ledge high in the mountains; far across the valley, the lit openings of the Bear chieftain’s hall carved into the mountainside, where the company will be judged tomorrow.' },
  'bear:scene:bear_judgement': { light: 'interior', samePlaceAs: HALL, line: 'Interior of the Bear chieftain’s hall, the same hall as the audience: rough granite hewn into the rock, heavy timber beams, fur hides, carved bear reliefs, the fire pit burning lower; seen closer to the massive stone seat at the far end. A few Bear banners near the seat. Indoors only: no sky.' },
  'bear:surface:chronicle-end': { light: 'interior', samePlaceAs: HALL, line: 'Interior of the Bear chieftain’s hall after the judgement, the same hall as the audience: empty and quiet, embers glowing in the fire pit, the stone seat empty. Indoors only: no sky, no terrace.' },
  'bear:scene:bear_master_spy_pre_combat': { light: 'dusk', line: 'High galleries near the summits: a mine gallery opening onto the snowy peaks, the wind blowing snow inside, cold dusk light at the opening and torchlight within.' },
  'bear:scene:bear_master_spy_aftermath': { samePlaceAs: 'bear:scene:bear_master_spy_pre_combat', light: 'dusk', line: 'The same high mine gallery opening onto the snowy peaks, after the fight: overturned crates, snow settling, stillness, cold dusk light at the opening.' },
  'bear:scene:bear_borin_pre_combat': { light: 'day', line: 'Daylight: a cleared stone terrace before the Bear chieftain’s hall, open to the sky under the peaks, the hall’s heavy doors set in the rock behind, snow swept to the edges.' },
  'bear:scene:bear_trial_aftermath': { samePlaceAs: 'bear:scene:bear_borin_pre_combat', light: 'dusk', line: 'The same stone terrace before the Bear chieftain’s hall at sunset: trampled snow, broken spears on the ground.' },
  'bear:scene:bear_epilogue': { light: 'dusk', line: 'Dawn over the Mountains of Resilience seen from the high pass, the trail running down toward the distant lowlands. Calm, open and neutral.' },
});

/** Looks of the characters redone with the staging, validated with it (beasts: proposals the canon does not describe). */
export const STAGED_LOOKS: Readonly<Record<string, string>> = Object.freeze({
  'bear:actor:bear_miner': 'A civilian miner of the Bear clan, not a soldier: a leather hood and a cloth wrapped against the dust cover his face, a leather apron over plain wool, a pickaxe on his shoulder, a lantern at his belt, rock dust on his clothes. No armour, no sword, no shield.',
  'bear:enemy:corrupted_beast': 'A great four-legged mountain beast, massive, shaggy and with curved horns, driven mad: black veins showing under its fur, burning eyes, foam at the mouth. Not a bear and not a wolf. Nothing specific to one clan: it must fit any mountain land.',
  'bear:enemy:depth_beast': 'A blind creature of the deep mine galleries, pale-skinned, with long digging claws and a back bristling with shards of black stone.',
});

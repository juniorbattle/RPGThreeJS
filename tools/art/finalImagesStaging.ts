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
export const CREATURE_IDS: readonly string[] = Object.freeze(['bear:enemy:corrupted_beast', 'bear:enemy:depth_beast', 'dragon:enemy:shadow_wyrm']);
export const CIVILIAN_IDS: readonly string[] = Object.freeze(['bear:actor:bear_miner', 'dragon:actor:dragon_villager', 'dragon:actor:dragon_pilgrim']);

/**
 * Each plateau's own look. The first Bear run copied the Lion's lowland motifs (waterfalls, aqueducts, distant castles,
 * gold halls) because every brief asked for the references' exact palette. A plateau without an identity yet keeps its
 * setting sentence; each gets one, proposed with its staging, before its run.
 */
export const IDENTITY: Readonly<Record<string, string>> = Object.freeze({
  bear: 'Visual identity of the Bear clan’s mountains, distinct from the Lion’s green lowlands: a harsh high-altitude land of bare granite, scree, ice and wind-driven snow. Palette: cold slate and granite greys, blue-white snow, dark weathered timber, iron and soot black, warm amber only from fires, torches and lanterns, small touches of rust and fur brown. Bear building is massive, low and squat: rough-hewn granite blocks built into and carved out of the living rock, heavy timber props and beams, plank walkways, iron chains and winches, fur hides, angular carved reliefs of bears. Never the Lion’s motifs: no Gothic arches, pointed windows or slender spires, no aqueducts, no waterfalls or rivers, no fairy-tale castles on the horizon, no lush green forest, no red-and-gold.',
  // Proposed on 2026-11-12 with the Dragon's staging (docs/content/drafts/DRAGON_STAGING_DRAFT_2026-11-12.md), awaiting
  // the operator's validation: high, open, pale and sky-lit where the Bear is low, closed, dark and firelit.
  dragon: 'Visual identity of the Dragon clan’s Celestial Peaks, distinct from the Lion’s green lowlands and from the Bear’s dark granite mountains: the highest mountains of the world, needles of pale rock piercing a sea of clouds, knife-edge ridges, powder snow on the summits, clear thin air; on the foothills, short yellowed grass and wind-twisted pines. Palette: pale limestone (off-white, cream, pale ochre), deep high-altitude blue sky, cloud white, verdigris bronze and touches of jade on carvings and bells, rosy dawns, crisp noon light, steel-blue starry nights, incense smoke and bronze braziers. Dragon building is pale stone clinging to cliff faces or carved into them: hermitages, halls, stepped terraces, stairs cut in the rock, round arches, flat terrace roofs, rope-and-plank bridges between rock needles, bronze bells, carved dragons along walls and pillars, carved inscriptions. Every carved or painted dragon is a winged, four-legged Western dragon, like the young dragon of this game: never a long whiskered serpentine dragon. Dragon interiors open onto the sky through tall openings. The Wolf clan, in the Peaks, lives rough: hide tents and curtains, sharpened stakes, bones and wolf pelts, grey and brown furs, blackened iron. The Shadows’ mark is a black stain oozing like frozen ink, never a purple glow. Never the Lion’s motifs: no Gothic arches, pointed windows or slender spires, no fairy-tale castles, no lush green forest, no red-and-gold. Never the Bear’s: no dark granite, no timber-propped mines, no blizzard, no squat timber-and-iron buildings. No pagodas and no curved roofs: the Dragon lives in the same world as the Lion and the Bear.',
});

export interface Staging {
  light: Light;
  line: string;
  /** Another brief showing the same place: its generated image, when it exists, joins the references. */
  samePlaceAs?: string;
  /** An interior open onto the sky (the Dragon's halls): the indoors rule against sky and daylight does not apply. */
  skyVisible?: boolean;
}

const HALL = 'bear:scene:bear_audience';
const DRAGON_HALL = 'dragon:scene:dragon_audience';
const DRAGON_HERMITAGE = 'dragon:scene:dragon_hermitage_gathering';
const WOLF_LAIR = 'dragon:scene:dragon_wolf_lair';
const DRAGON_VIGIL = 'dragon:scene:dragon_vigil';
const SHAMAN_RIDGE = 'dragon:scene:dragon_shaman_pre_combat';
const DRAGON_ESPLANADE = 'dragon:scene:dragon_kaelen_pre_combat';

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

  // The Dragon, awaiting the operator's validation (docs/content/drafts/DRAGON_STAGING_DRAFT_2026-11-12.md).
  // I · The foothills
  'dragon:scene:dragon_arrival': { light: 'day', line: 'Exterior, clear morning at the foot of the Celestial Peaks: a pilgrims’ trail of steps carved into pale rock starts climbing between pale boulders and wind-twisted pines; far above, needles of pale rock pierce the clouds, the highest mountains the company has ever seen. Wild and empty: no building or structure anywhere, no banner.' },
  [DRAGON_HALL]: { light: 'interior', skyVisible: true, line: 'Interior of the Dragon clan’s great hall, carved into a cliff of pale stone partway up the Peaks: a vast lofty hall whose tall round-arched openings look out over the rock needles and a sea of clouds, carved dragons coiling around the pillars, bronze braziers and thin threads of incense smoke, a broad stone dais at the far end. A few Dragon banners near the dais. Bright daylight through the openings.' },
  'dragon:scene:dragon_wolf_envoy': { light: 'day', line: 'A snowy shelf on the pilgrims’ trail in the foothills, cold daylight: a plain white truce flag on a pole planted in the snow and, far from it, a single axe stuck upright in the snow. Pale rocks and wind-twisted pines around. No building in view; the truce flag bears no emblem and there is no other banner.' },
  'dragon:scene:dragon_terrorized_village': { light: 'dusk', line: 'A small foothill hamlet late in the afternoon: a few low houses of pale stone roofed with stone slabs, doors barricaded with planks, barns shut tight, an empty livestock pen with a broken fence, straw scattered on trampled snow. A hamlet waiting for an attack: no rampart, no banner.' },
  'dragon:scene:dragon_wolf_traps': { light: 'day', line: 'The pilgrims’ trail climbing the foothills by day, steps carved into pale rock under a thin layer of snow: steel snares half hidden in the snow across the steps, small stacked-stone pilgrim cairns along the edge. Wild mountainside: no building or structure in view, no banner.' },
  [DRAGON_HERMITAGE]: { light: 'dusk', line: 'Dusk: a small hermitage of the Dragon clan built of pale stone, clinging to a sheer cliff face and reached by steps carved in the rock; a narrow terrace with a fire for travellers, a bronze bell hanging under a small round arch, a carved dragon above the door, a sea of clouds below turning rose. No banner.' },
  'dragon:refuge:dragon-first-refuge': { samePlaceAs: DRAGON_HERMITAGE, light: 'nightFire', line: 'Night at the same small hermitage of pale stone clinging to a sheer cliff face: the fire burning on the narrow terrace for the company to rest, lit windows, the bronze bell under its small round arch, the carved dragon above the door, stars above a sea of clouds. No banner.' },
  // II · The terraces
  'dragon:scene:dragon_captive_wolf': { light: 'day', line: 'Grey day at the edge of the terraces: stepped terraces cut into the mountainside with dry-stone retaining walls, a ledge above a drop into the clouds, trampled snow with signs of a struggle at the foot of a wall. No building, no banner.' },
  'dragon:scene:dragon_crystal_clues': { light: 'day', line: 'Daylight on the terraces: a tall wall of pale rock covered with ancient carved inscriptions and engravings of dragons around a crystal, worn by the wind; at its foot, a faint glitter of crystal dust in the snow. Carved glyphs only, no readable letters. No building, no banner.' },
  [WOLF_LAIR]: { light: 'interior', line: 'Interior of the Wolf clan’s lair, a great cave dug into the cliff: rough hide curtains, bones and wolf pelts, sharpened stakes, iron braziers, Wolf banners on crude poles. At the far end, on a crude altar of piled stones that is not the Dragon’s, the Echo Crystal shines: a clear crystal glowing a soft icy blue. Firelight and the crystal’s glow only.' },
  'dragon:scene:dragon_pre_lair_assault': { samePlaceAs: WOLF_LAIR, light: 'interior', line: 'Interior of the same Wolf lair, seen closer to the far end: hide curtains, wolf pelts, iron braziers, Wolf banners on crude poles, and the crude altar of piled stones where the Echo Crystal shines a soft icy blue. Firelight and the crystal’s glow only.' },
  'dragon:scene:dragon_pre_lair_seizure': { samePlaceAs: WOLF_LAIR, light: 'interior', line: 'Interior of the same Wolf lair, seen closer to the far end: hide curtains, wolf pelts, iron braziers, Wolf banners on crude poles, and the crude altar of piled stones where the Echo Crystal shines a soft icy blue. Firelight and the crystal’s glow only.' },
  'dragon:scene:dragon_lair_assault_aftermath': { samePlaceAs: WOLF_LAIR, light: 'interior', line: 'Interior of the same Wolf lair after the fight: overturned iron braziers, Wolf banners torn down on the floor, the Echo Crystal still glowing a soft icy blue on the crude altar, and at the back a dark passage leading away.' },
  'dragon:scene:dragon_lair_seizure_aftermath': { samePlaceAs: WOLF_LAIR, light: 'interior', line: 'Interior of the same Wolf lair after the fight: overturned iron braziers, Wolf banners torn down on the floor, the Echo Crystal still glowing a soft icy blue on the crude altar, and at the back a dark passage leading away.' },
  // III · The summits
  'dragon:refuge:dragon-second-refuge': { light: 'interior', line: 'Interior of the pilgrims’ shelter under the summits: a low vaulted room of pale stone with round arches, blankets and straw pallets, small niches with offerings and burning incense sticks whose smoke drifts in the lantern light, a carved dragon on the back wall.' },
  'dragon:scene:dragon_shaman_traces': { light: 'day', line: 'A high camp of the Wolf clan above the lair, abandoned in haste, on an overcast cold day: hide tents left standing or collapsed, cold fire pits, scattered gear, a fallen Wolf banner in the snow. Set apart from the others, one open tent with cold ashes and strange black symbols traced on the ground, not the Wolf’s. No building.' },
  'dragon:scene:dragon_freed_pilgrims': { light: 'day', line: 'Clear morning on a high trail coming down from the Wolf’s lair: abandoned sacks of provisions and cut ropes on steps carved in the pale rock, rock needles and a sea of clouds around. No building, no banner.' },
  'dragon:scene:dragon_young_dragon': { light: 'day', line: 'Daylight high on a rock needle: a dragon’s nest in a hollow of the rock, lined with branches and shed scales, open to the sky above a sea of clouds. Empty: no creature in it. No building, no banner.' },
  'dragon:scene:dragon_crystal_altar': { light: 'dusk', line: 'The summit of the Peaks at cold dusk, above a sea of clouds: the Dragon’s altar of the Crystal, pale stone carved with coiling dragons, open to the sky and empty, split by a crack from which a black stain oozes, frozen like ink. No crystal on it, no purple glow, no banner.' },
  [DRAGON_VIGIL]: { light: 'nightFire', line: 'Night on a high ridge of the Peaks: a single campfire in the lee of a pale boulder, a starry sky, a sea of clouds silvered by the moon below; far below, the lit openings of the Dragon clan’s great hall in the cliff, where the company will be judged tomorrow.' },
  'dragon:refuge:dragon-final-refuge': { samePlaceAs: DRAGON_VIGIL, light: 'nightFire', line: 'Night on a high ridge of the Peaks: a single campfire in the lee of a pale boulder, a starry sky, a sea of clouds silvered by the moon below; far below, the lit openings of the Dragon clan’s great hall in the cliff, where the company will be judged tomorrow.' },
  // Before Kaelen
  'dragon:scene:dragon_judgement': { samePlaceAs: DRAGON_HALL, light: 'interior', skyVisible: true, line: 'Interior of the Dragon clan’s great hall, the same hall as the audience: pale stone, tall round-arched openings onto the rock needles and the clouds, carved dragons coiling around the pillars, bronze braziers burning lower; seen closer to the broad stone dais, late-afternoon light through the openings. A few Dragon banners near the dais.' },
  'dragon:surface:chronicle-end': { samePlaceAs: DRAGON_HALL, light: 'interior', skyVisible: true, line: 'Interior of the Dragon clan’s great hall after the judgement, the same hall as the audience: empty and quiet, bronze braziers cooling, the broad stone dais empty, a sunset sky and clouds through the tall round-arched openings.' },
  [SHAMAN_RIDGE]: { light: 'dusk', line: 'The highest summits at cold dusk: a narrow snowy ridge between rock needles above a sea of clouds, a trail of black stains like frozen ink across the snow and strange black symbols smeared on the rocks, leading up toward the top. No building, no banner.' },
  'dragon:scene:dragon_shaman_aftermath': { samePlaceAs: SHAMAN_RIDGE, light: 'dusk', line: 'The same narrow snowy ridge between rock needles after the fight: the black stains fading from the snow, stillness, the last light over the sea of clouds. No building, no banner.' },
  [DRAGON_ESPLANADE]: { light: 'day', line: 'Daylight: a wide stone esplanade before the Dragon clan’s great hall, on the cliff edge above the clouds, lined with pillars carved with coiling dragons, the hall’s tall round-arched entrance behind.' },
  'dragon:scene:dragon_trial_aftermath': { samePlaceAs: DRAGON_ESPLANADE, light: 'dusk', line: 'The same stone esplanade before the Dragon clan’s great hall at sunset: broken spears on the flagstones, scorch marks on the pale stone, the sea of clouds glowing below.' },
  'dragon:scene:dragon_epilogue': { light: 'dusk', line: 'Dawn: the sun rising over a sea of clouds between the needles of the Celestial Peaks. Calm, open and neutral.' },
});

/** Looks of the characters redone with the staging, validated with it (beasts: proposals the canon does not describe). */
export const STAGED_LOOKS: Readonly<Record<string, string>> = Object.freeze({
  'bear:actor:bear_miner': 'A civilian miner of the Bear clan, not a soldier: a leather hood and a cloth wrapped against the dust cover his face, a leather apron over plain wool, a pickaxe on his shoulder, a lantern at his belt, rock dust on his clothes. No armour, no sword, no shield.',
  'bear:enemy:corrupted_beast': 'A great four-legged mountain beast, massive, shaggy and with curved horns, driven mad: black veins showing under its fur, burning eyes, foam at the mouth. Not a bear and not a wolf. Nothing specific to one clan: it must fit any mountain land.',
  'bear:enemy:depth_beast': 'A blind creature of the deep mine galleries, pale-skinned, with long digging claws and a back bristling with shards of black stone.',
  // The Dragon's characters, PROPOSALS awaiting the operator's validation. Kaelen is a human elder, the operator's choice of
  // 2026-11-12 (« Ancien humain »); the details of his look stay a proposal.
  'dragon:actor:kaelen': 'PROPOSAL, to confirm: the very old human chief of the Dragon clan (a man, not a dragon), tall and thin, a long pale robe embroidered with scales of verdigris bronze, a closed mask-helm of verdigris bronze shaped like a dragon’s head that hides his face, a long staff topped with a coiled dragon.',
  'dragon:actor:dragon_guardian': 'PROPOSAL, to confirm: a guardian warrior of the Dragon clan, a closed bronze helm shaped like a dragon’s head, scale armour of verdigris bronze over pale cloth, a long spear with a broad blade.',
  'dragon:actor:dragon_villager': 'PROPOSAL, to confirm: a civilian villager of the foothills, not a soldier: a hood and a wool scarf cover his face, a sheepskin vest over plain wool, a herder’s staff. No armour, no weapon.',
  'dragon:actor:dragon_pilgrim': 'PROPOSAL, to confirm: a civilian pilgrim of the Dragon, not a soldier: a deep hood and a cloth veil cover the face, a long pale travelling robe, a walking staff, a small bundle on the back. No armour, no weapon.',
  'dragon:actor:wolf_envoy': 'PROPOSAL, to confirm: a warrior of the Wolf clan sent as an envoy: a wolf-pelt hood whose wolf’s head hides his face, grey furs over leather, a plain white truce flag on a pole in his hand and no weapon at all.',
  'dragon:actor:wolf_captive': 'PROPOSAL, to confirm: a wounded warrior of the Wolf clan: a wolf-pelt hood whose wolf’s head hides his face, torn furs and leather, bandages, standing hunched with one hand on his side, no weapon.',
  'dragon:actor:wolf_chief': 'PROPOSAL, to confirm: the chief of the Wolf clan, a massive warrior: a helm crowned with a great wolf’s head and pelt that hides his face, heavy grey furs over blackened iron mail, bone trophies, a great two-handed axe.',
  'dragon:actor:shadow_shaman': 'PROPOSAL, to confirm: a shaman of the Shadows, come from nobody knows where, belonging to no clan: no wolf pelt, no emblem. A tattered dark robe, a deep hood with at most two glowing eyes in its shadow, black streaks like frozen ink on the hands and the hem, strange symbols painted on the robe, a crooked staff. No purple glow.',
  'dragon:enemy:wolf_raider': 'PROPOSAL, to confirm: a raider of the Wolf clan: a wolf-pelt hood that hides the face, furs and leather, a hand axe and a small round shield.',
  'dragon:enemy:wolf_hunter': 'PROPOSAL, to confirm: a hunter of the Wolf clan: a grey fur hood and a cloth mask hide the face, leather and furs, a short bow and a quiver.',
  'dragon:enemy:wolf_champion': 'PROPOSAL, to confirm: an elite champion of the Wolf clan: a closed iron helm with a crest of wolf’s ears, a wolf pelt over the shoulders, chain mail, a long sword.',
  'dragon:enemy:shadow_wyrm': 'PROPOSAL, to confirm: a wyrm of the summits, a long wingless kin of the Western dragons with four short legs and pale scales, no whiskers and no mane, driven mad by a dark energy: black veins like frozen ink running between its scales, burning eyes. Not the young dragon.',
});

/**
 * A plateau's POIs stand at the positions of their Lion counterparts, so its atlas keeps the Lion atlas's layout: the
 * first Bear atlases, drawn freely, put the markers on cliffs and rivers. The Lion atlas, letterboxed by
 * tools/art/atlas_layout.py, is sent as the layout to repaint; the result is cropped back to the Lion atlas's frame.
 */
export const ATLAS_LAYOUTS: Readonly<Record<string, { lionAtlas: string; line: string }>> = Object.freeze({
  'bear:atlas:1': { lionAtlas: 'public/assets/generated/lion-phase/poi-lot-e/lion-opening.png',
    line: 'Region I of the Bear’s mountains: the first passes of the Mountains of Resilience, from the foot of the mountains up to the small Bear outpost in a pass.' },
  'bear:atlas:2': { lionAtlas: 'public/assets/generated/lion-phase/poi-lot-e/bois-clair.png',
    line: 'Region II of the Bear’s mountains: the road of the sacred mines, climbing to the carved entrance of the Bear’s sacred galleries, with winches and mine works along it.' },
  'bear:atlas:3': { lionAtlas: 'public/assets/generated/lion-phase/poi-lot-e/judgement.png',
    line: 'Region III of the Bear’s mountains: the high ground above the deep galleries, with mine shafts and gallery mouths, and the Bear chieftain’s hall carved into a cliff.' },
  'dragon:atlas:1': { lionAtlas: 'public/assets/generated/lion-phase/poi-lot-e/lion-opening.png',
    line: 'Region I of the Celestial Peaks: the foothills, with the pilgrims’ trail climbing from a small barricaded hamlet toward the Dragon clan’s great hall and a hermitage clinging to a cliff.' },
  'dragon:atlas:2': { lionAtlas: 'public/assets/generated/lion-phase/poi-lot-e/bois-clair.png',
    line: 'Region II of the Celestial Peaks: stepped terraces cut along the mountainside, the ridge road, a carved rock wall of the ancients, and the Wolf clan’s lair dug into a cliff behind its stake palisade.' },
  'dragon:atlas:3': { lionAtlas: 'public/assets/generated/lion-phase/poi-lot-e/judgement.png',
    line: 'Region III of the Celestial Peaks: the summits above the clouds, with the Wolf’s abandoned high camp, the pilgrims’ shelter, the cracked altar of the Crystal on the summit, and a Dragon hall carved into a cliff.' },
});

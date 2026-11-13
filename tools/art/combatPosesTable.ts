/**
 * Combat poses of the new units (OD-2026-11-13-A, draft docs/content/drafts/COMBAT_POSES_SCOPE_2026-11-13.md): the 38 units
 * that fight with a master only — the six recruitable heroes, the 31 plateau fighters and Maelor at the breach — each with
 * its look, its weapon, its three generated poses (prepare is its validated master) and the effects baked into attack and
 * cast, as on the demo's poses.
 *
 * Effects follow the demo (characterBoundFx): every cast carries one; an attack carries one for the heroes (the operator's
 * pilot) and, for the others, when the weapon is a blade or magic (spears, bows, blunt weapons and bites have none in the
 * demo). Their colours come from the procedural effect palettes (src/combat/fx/fxPalettes.ts), except for the Shadows and
 * the breach, whose corruption is cold black ink and never purple (the procedural `shadow` palette is purple).
 *
 * Looks describe the approved masters as they are; they invent nothing. Weapons follow the master the player sees: four
 * Raven masters hold a sword or a hammer where the combat runtime names other weapons (listed in the draft's report).
 */
import { FX_PALETTES, type FxElement } from '../../src/combat/fx/fxPalettes';

export type PoseName = 'dash' | 'attack' | 'cast';
export type PoseGroup = 'heroes' | 'bear' | 'dragon' | 'scorpion' | 'finale';
export type PoseBody = 'person' | 'creature' | 'quadruped';
export type EffectColour = FxElement | 'ink' | 'raven' | 'scorpion';

export interface PoseUnit {
  group: PoseGroup;
  /** Repository path of the validated master, which is also the prepare pose. */
  master: string;
  /** Height on screen in metres, the one of today's master-only sheet (build_combat_sprites.py). */
  worldHeight: number;
  body: PoseBody;
  look: string;
  /** What the unit holds, as on its master. */
  weapon: string;
  /** Effects that belong to the master itself (a burning spear tip, ink wisps) and stay in every pose. */
  intrinsic?: string;
  actions: Readonly<Record<PoseName, string>>;
  colour: EffectColour;
  /** Colour of the cast effect when it differs from the attack's (Talon: venom blade, smoke for his shadow step). */
  castColour?: EffectColour;
  /** The baked effect of each pose that carries one. */
  fx: Readonly<Partial<Record<'attack' | 'cast', string>>>;
}

export const POSES: readonly PoseName[] = Object.freeze(['dash', 'attack', 'cast']);

/**
 * Canvas of each generated pose: square, wide only for a four-legged beast. Every pose is drawn from the master placed on
 * that same canvas at a known size (tmp/combat-poses/refs, normalize_combat_poses.py --prepare-refs): the model keeps the
 * size it is given (the Aldric pilot: 0.997 of it for dash and cast), whereas from the bare master it picks its own scale.
 */
export function poseSize(unit: PoseUnit, _pose?: PoseName): '1024x1024' | '1536x1024' {
  return unit.body === 'quadruped' ? '1536x1024' : '1024x1024';
}

/** The reference canvas of a pose: the master placed at a known size, a little to the left for the attack's reach. */
export const poseReference = (unitId: string, pose: PoseName) => ['tmp', 'combat-poses', 'refs', `${unitId}__${pose === 'attack' ? 'attack' : 'stand'}.png`].join('/');

const hex = (element: FxElement) => {
  const p = FX_PALETTES[element];
  return `a bright core (${p.core}), a body of ${p.body} and edges of ${p.edge} fading to ${p.dark}`;
};

/** Colour sentence of an effect. */
export function effectColours(colour: EffectColour): string {
  switch (colour) {
    case 'ink': return 'The effect is cold black ink, like frozen ink, with only a thin cold white rim (#e8f0ff): never purple, violet or magenta, no purple glow.';
    case 'raven': return `The effect is dark raven feathers, black and deep blue-grey, with pale steel glints (${FX_PALETTES.steel.core}, ${FX_PALETTES.steel.body}). Never purple, violet or magenta.`;
    case 'scorpion': return `The effect is warm amber and copper light (${hex('gold')}) with swirling pale desert sand. Never purple, violet or magenta.`;
    case 'arcane': return `The effect is arcane light: ${hex('arcane')}, the colours of his own spells.`;
    default: return `The effect is ${hex(colour)}. Never purple, violet or magenta.`;
  }
}

// Pose families: the same gestures for the same weapons, so a lot reads as one roster.
const spear = (subject: string) => ({
  dash: `a fast forward charge toward the right, the spear levelled forward, ${subject} leaning into the run, the rear leg pushing off the ground`,
  attack: 'a powerful spear thrust toward the right at full reach, the front knee bent and the rear leg straight, the free arm or shield pulled back',
  cast: 'a rallying battle stance: the spear raised high and upright in one hand, the free arm or shield forward, the body squared and braced',
});
const blade = (weaponName: string) => ({
  dash: `a fast forward dash toward the right, the body leaning forward and low, the ${weaponName} held low and back ready to strike, cloak streaming behind`,
  attack: `a wide slashing blow toward the right, the ${weaponName} swung across the body at full reach, the feet planted in a wide stance`,
  cast: `a focused battle stance: the ${weaponName} raised upright before the helm, the free hand open and forward, gathering power`,
});
const hammer = {
  dash: 'a heavy forward charge toward the right, the war hammer held across the body in both hands, the body leaning in',
  attack: 'a crushing two-handed overhead hammer blow, the hammer coming down in front of him toward the right, the knees bent with the weight of the strike',
  cast: 'planting the hammer head on the ground before him with both hands on the haft, the body braced and leaning on it, the head lifted',
};
const staff = (staffName: string) => ({
  dash: `a quick gliding step forward toward the right, robes flowing back, the ${staffName} held forward`,
  attack: `thrusting the ${staffName} forward toward the right at arm's length, casting a spell, the free hand open behind`,
  cast: `raising the ${staffName} high overhead, the free hand open and lifted, channelling a spell, robes stirring`,
});
const handMagic = {
  dash: 'a quick gliding step forward toward the right, the tattered robes trailing behind, both hands low and ready',
  attack: 'thrusting one open clawed hand forward toward the right, casting a spell at arm\'s length, the other hand drawn back',
  cast: 'both arms raised and spread wide, channelling a dark power, the robes lifting around the body',
};
const daggers = {
  dash: 'a very fast, low run toward the right, the body leaning far forward, the blades held back along the forearms',
  attack: 'a quick double strike toward the right: one blade thrust forward at full reach, the other drawn back, the body low and twisted',
  cast: 'a crouched ready stance, the blades crossed before the helm, the weight on the back foot, about to spring',
};
const clawBiped = {
  dash: 'lunging forward toward the right on its hind legs, hunched low, the clawed arms spread forward',
  attack: 'a raking claw swipe toward the right, one clawed arm slashing across at full reach, the other drawn back, the body twisting',
  cast: 'rearing up to full height, the clawed arms spread wide, the head thrown back in a roar',
};

const finale = (id: string) => `public/assets/characters/pixel/post-demo/finale/${id}.png`;
const bear = (id: string) => `public/assets/characters/pixel/post-demo/bear/${id}.png`;
const dragon = (id: string) => `public/assets/characters/pixel/post-demo/dragon/${id}.png`;
const scorpion = (id: string) => `public/assets/characters/pixel/post-demo/scorpion/${id}.png`;
const hero = (id: string) => `public/assets/characters/pixel/archive/non-demo/${id}.png`;

export const POSE_UNITS: Readonly<Record<string, PoseUnit>> = Object.freeze({
  // ---- Heroes: the operator's fixed direction (pilot on Aldric): effects on both attack and cast.
  aldric: { group: 'heroes', master: hero('aldric'), worldHeight: 2.08, body: 'person',
    look: 'Aldric, a paladin hero: a knight in white-and-gold plate armour with a closed golden helm crowned with sun rays, a royal-blue and gold tabard and cape, a blue shield with a gold cross, and a gold flanged mace.',
    weapon: 'He holds the mace in his right hand and the shield on his left arm, as in the reference.',
    actions: {
      dash: 'a fast forward dash toward the right: the body leaning forward and low, the rear leg pushing off the ground, the front leg striding far forward, the shield held in front of the body, the mace held back ready to strike, cape and tabard streaming behind',
      attack: 'a heavy mace blow toward the right: a wide braced stance, the body twisting into the strike, the mace swung forward and down at full reach in front of him, the shield arm pulled back for balance, the cape swinging',
      cast: 'invoking a holy skill: standing firm with the feet apart, the mace raised high overhead toward the sky, the shield held close to the body, the head lifted upward',
    },
    colour: 'holy',
    fx: { attack: 'a bright arc of holy light trailing the mace head along its swing, from behind him to the end of the blow, with a few sparks and small light motes at its tip',
      cast: 'a holy aura: ribbons of light spiralling around his body, thin vertical rays rising around him, small sparkles, and a glowing ring of light on the ground at his feet' } },
  morvan: { group: 'heroes', master: hero('morvan'), worldHeight: 2.12, body: 'person',
    look: 'Morvan, a dark knight hero: spiked black and dark crimson plate armour, a closed black helm with a pointed crest, a long tattered crimson cape, and a long war scythe with a curved blade.',
    weapon: 'He wields the war scythe, as in the reference, and no other weapon. The scythe has one single curved blade, at the top end of its long shaft; the other end of the shaft has no blade.',
    actions: {
      dash: 'a fast forward dash toward the right, the body leaning forward, the scythe held low behind him with its blade trailing, the tattered cape streaming',
      attack: 'a reaping slash toward the right: both hands on the shaft, the scythe swung upward and forward along a diagonal, its single curved blade leading at the upper right end of the shaft while the lower left end of the shaft is a plain butt with no blade, the body twisting into the blow, the feet planted wide',
      cast: 'raising the scythe high overhead in both hands, invoking a dark power, the cape flaring around him, the head lifted',
    },
    colour: 'blood',
    fx: { attack: 'a dark crimson slash trail following the curved blade of the scythe along its whole sweep, with a few drops of red light',
      cast: 'thin ribbons of dark crimson energy coiling around him and the scythe, a few drops of blood-red light rising, and a faint crimson ring on the ground at his feet' } },
  lyra: { group: 'heroes', master: hero('lyra'), worldHeight: 2.02, body: 'person',
    look: 'Lyra, a red mage hero: a long crimson-and-gold coat with a ruffled white collar and wide skirts, a wide crimson hat with a white feather, the face hidden by a dark mask under the hat, crimson boots, and a slender rapier.',
    weapon: 'She holds the rapier in one hand, as in the reference, and casts with the other.',
    actions: {
      dash: 'a quick forward dash toward the right, the body leaning forward, the rapier held forward and low, the coat tails flying behind',
      attack: 'a long fencer\'s lunge toward the right, the rapier thrust forward at full reach, the front knee bent deeply, the free arm raised behind for balance',
      cast: 'standing poised with the rapier held upright before her masked face, the free hand raised high casting a spell, the coat stirring',
    },
    colour: 'blood',
    fx: { attack: 'a bright crimson streak of light running along the rapier and beyond its point, with a few small glowing runes in its wake',
      cast: 'a thin crimson rune circle on the ground at her feet and a few thin ribbons of crimson light rising around her and her raised hand' } },
  eldwin: { group: 'heroes', master: hero('eldwin'), worldHeight: 2.04, body: 'person',
    look: 'Eldwin, an enchanter hero: layered violet, lilac and white robes trimmed with gold, a tall pointed violet hood whose shadow hides the face, and an ornate golden scepter topped with a glowing orb.',
    weapon: 'He holds the golden scepter in one hand, as in the reference, and casts with the other.',
    actions: {
      dash: 'a quick gliding step forward toward the right, the robes flowing back, the scepter held forward, the free hand low',
      attack: 'thrusting the scepter forward toward the right at arm\'s length, the orb leading, casting a spell, the free hand drawn back',
      cast: 'raising the scepter high overhead in one hand, the other hand open and lifted, channelling a spell, the robes stirring around him',
    },
    colour: 'arcane',
    fx: { attack: 'a burst of arcane light leaving the orb of the scepter toward the right, with a few small sparkles',
      cast: 'a few thin ribbons of arcane light spiralling around him, small floating runes, and a faint ring of light on the ground at his feet' } },
  talon: { group: 'heroes', master: hero('talon'), worldHeight: 2.05, body: 'person',
    // OD-2026-11-13-F (T1): Talon's blue turned to dark slate on his portrait and combat sheet (recolor-talon-slate.cjs).
    look: 'Talon, a ninja hero: dark slate-grey cloth and silver steel armour plates, a deep slate-grey hood and a mask covering the face, long slate-grey scarf ends flowing, and a large four-pointed steel shuriken.',
    weapon: 'He throws a large four-pointed steel shuriken, as in the reference, and carries no blade.',
    actions: {
      dash: 'a very fast, low ninja sprint toward the right, the body leaning far forward, one arm back holding the shuriken, the scarf streaming behind',
      attack: 'throwing the shuriken toward the right: the throwing arm extended forward just after the release, the shuriken leaving the hand, the body low and twisted',
      cast: 'a ninja hand-seal stance: crouched low, two fingers of one hand raised before the mask, the other hand holding a shuriken ready',
    },
    colour: 'poison', castColour: 'smoke',
    fx: { attack: 'a thin green venom streak trailing the shuriken as it leaves his hand toward the right',
      cast: 'a few puffs of dark grey smoke curling around him, as if he were about to vanish in a shadow step' } },
  gunnar: { group: 'heroes', master: hero('gunnar'), worldHeight: 2.06, body: 'person',
    look: 'Gunnar, an artillerist hero: a long burnt-orange coat over bronze and brown armour plates, an orange hood and a dark mask covering the face, ammunition belts and pouches, and a heavy brass hand cannon.',
    weapon: 'He fires a heavy brass hand cannon, as in the reference, and carries no blade.',
    actions: {
      dash: 'running forward toward the right, the hand cannon held across the chest in both hands, the coat flapping behind',
      attack: 'firing the hand cannon toward the right with both hands, braced against the recoil, one foot forward, the coat swinging',
      cast: 'lifting a round black grenade in his free hand, ready to throw it, the hand cannon held low in the other hand, the body coiled',
    },
    colour: 'fire',
    fx: { attack: 'a fiery muzzle blast at the mouth of the cannon toward the right, with a puff of smoke and a few sparks',
      cast: 'the lit fuse of the grenade spitting sparks and a small trail of fire and smoke around his raised hand' } },

  // ---- Bear plateau (cast always; attack only for blades and magic, as in the demo).
  borin: { group: 'bear', master: bear('borin'), worldHeight: 4.3, body: 'person',
    look: 'Borin, the elder chieftain of the Bear clan: a heavy grey-and-brown bear-fur mantle over dark steel armour, a closed helm crowned with a bear\'s head, a golden bear medallion and a bear tabard, and a heavy war hammer with a carved stone head.',
    weapon: 'He wields the heavy war hammer in both hands, as in the reference, and no other weapon.',
    actions: hammer, colour: 'earth',
    fx: { cast: 'a burst of dust and small stone chips thrown up around the hammer head, and a ring of cracked earth on the ground at his feet' } },
  raven_miner_chief: { group: 'bear', master: bear('raven_miner_chief'), worldHeight: 4.2, body: 'person',
    look: 'the chief of the Raven miners: dark steel armour under a heavy fur mantle, a closed helm crested with black feathers, a lantern at the belt, a raven tabard, and a heavy war hammer with a raven-carved head.',
    weapon: 'He wields the heavy war hammer in both hands, as in the reference, and no other weapon.',
    actions: hammer, colour: 'earth',
    fx: { cast: 'a burst of dust and small stone chips thrown up around the hammer head, and a ring of cracked earth on the ground at his feet' } },
  raven_master_spy: { group: 'bear', master: bear('raven_master_spy'), worldHeight: 4.1, body: 'person',
    look: 'the Raven\'s master spy: dark steel armour, a hood over a closed helm, a long cloak of black and deep blue feathers, a blue raven tabard, and a long sword.',
    weapon: 'He wields the long sword, as in the reference, and no other weapon.',
    actions: blade('long sword'), colour: 'raven',
    fx: { attack: 'a pale steel slash trail following the sword along its whole swing, with a few dark feathers torn loose',
      cast: 'a swirl of dark raven feathers and pale steel glints circling around him' } },
  raven_foreman: { group: 'bear', master: bear('raven_foreman'), worldHeight: 4.0, body: 'person',
    look: 'a Raven foreman: dark steel armour, a closed helm crested with black feathers, a cloak of black feathers lined with red, a red-and-white raven tabard, and a long sword.',
    weapon: 'He wields the long sword, as in the reference, and no other weapon.',
    actions: blade('long sword'), colour: 'raven',
    fx: { attack: 'a pale steel slash trail following the sword along its whole swing, with a few dark feathers torn loose',
      cast: 'a swirl of dark raven feathers and pale steel glints circling around him' } },
  corrupted_beast: { group: 'bear', master: bear('corrupted_beast'), worldHeight: 3.0, body: 'quadruped',
    look: 'a great four-legged mountain beast, massive and shaggy with tawny fur and large curved ram horns, driven mad: dark red veins under the fur, burning eyes, foam at the mouth. Not a bear and not a wolf.',
    weapon: 'It fights with its horns and hooves: no weapon, no armour, no clothing.',
    actions: {
      dash: 'a galloping charge toward the right, the head lowered with the horns forward, the legs stretched in full stride, the fur streaming',
      attack: 'ramming with its curved horns toward the right, the head driven forward and down, the front hooves lifted off the ground',
      cast: 'rearing up on its hind legs, the head thrown back in a roar, the front legs pawing the air',
    },
    colour: 'poison',
    fx: { cast: 'a thin cloud of sickly green venom breath and spittle around its roaring jaws' } },
  depth_beast: { group: 'bear', master: bear('depth_beast'), worldHeight: 2.7, body: 'quadruped',
    look: 'a blind creature of the deep mine galleries, pale-skinned and hairless, with long digging claws and a back bristling with shards of black stone.',
    weapon: 'It fights with its claws and hurls shards of stone: no weapon, no armour, no clothing.',
    actions: {
      dash: 'scuttling forward fast toward the right, low to the ground, the claws reaching ahead',
      attack: 'rearing on its hind legs and hurling a shard of black stone forward toward the right with one clawed foreleg, the other foreleg braced',
      cast: 'arching its back so that the black stone shards stand up like spines, the claws dug into the ground, the head lowered',
    },
    colour: 'earth',
    fx: { cast: 'a burst of rock dust and small stone chips around its arched back, and a faint ring of cracked earth around its claws' } },
  bear_warrior: { group: 'bear', master: bear('bear_warrior'), worldHeight: 2.2, body: 'person',
    look: 'a warrior of the Bear clan: a closed steel helm, a bear pelt over the shoulders, fur-lined mail, a round wooden shield painted with a bear\'s head, and a long war spear.',
    weapon: 'He holds the long war spear and the round wooden shield, as in the reference.',
    actions: spear('his body'), colour: 'earth',
    fx: { cast: 'a small burst of dust and stone chips at his feet as he braces, and a faint ring of cracked earth on the ground' } },
  raven_scout: { group: 'bear', master: bear('raven_scout'), worldHeight: 2.1, body: 'person',
    look: 'a Raven scout: dark steel armour, a hood over a closed helm, a cloak of black and blue-grey feathers, a raven tabard, and a long sword.',
    weapon: 'He wields the long sword, as in the reference, and no other weapon.',
    actions: blade('long sword'), colour: 'raven',
    fx: { attack: 'a pale steel slash trail following the sword along its whole swing, with a few dark feathers torn loose',
      cast: 'a swirl of dark raven feathers and pale steel glints circling around him' } },
  raven_miner: { group: 'bear', master: bear('raven_miner'), worldHeight: 2.2, body: 'person',
    look: 'a Raven miner: dark steel armour, a closed helm crested with black feathers, a black feather cloak, a raven tabard, a lantern at the belt, and a miner\'s war pick.',
    weapon: 'He wields the miner\'s war pick, as in the reference, and no other weapon.',
    actions: {
      dash: 'a heavy forward run toward the right, the war pick held across the body, the feather cloak streaming',
      attack: 'a downward two-handed strike of the war pick toward the right, the point driving down in front of him, the knees bent',
      cast: 'resting the war pick on his shoulder and raising the lantern in the other hand, braced and alert',
    },
    colour: 'earth',
    fx: { cast: 'a small burst of rock dust and stone chips around him, and a faint ring of cracked earth at his feet' } },

  // ---- Dragon plateau.
  kaelen: { group: 'dragon', master: dragon('kaelen'), worldHeight: 4.3, body: 'person',
    look: 'Kaelen, the ancient elder of the Dragon clan: long cream and jade robes embroidered with gold and green dragon scales, a closed golden dragon-crested helm, and a tall wooden staff topped with a coiled golden dragon.',
    weapon: 'He holds the tall dragon staff, as in the reference, and fights with its magic.',
    actions: staff('dragon staff'), colour: 'ice',
    fx: { attack: 'a burst of icy blue crystal light leaving the head of the staff toward the right, with a few small floating ice-crystal shards',
      cast: 'thin ribbons of icy blue crystal light spiralling around him, small floating ice-crystal shards, and a faint ring of frost on the ground at his feet' } },
  wolf_chief: { group: 'dragon', master: dragon('wolf_chief'), worldHeight: 4.2, body: 'person',
    look: 'the chief of the Wolf clan: a grey wolf pelt with the wolf\'s head worn over a closed steel helm, dark steel armour, a fur mantle, and a great two-handed battle axe.',
    weapon: 'He wields the great two-handed battle axe, as in the reference, and no other weapon.',
    actions: {
      dash: 'a heavy forward charge toward the right, the great axe held across the body in both hands, the fur mantle streaming',
      attack: 'a heavy two-handed overhead chop of the great axe coming down in front of him toward the right, the knees bent with the weight of the blow',
      cast: 'a war cry: the great axe raised high overhead in both hands, the chest thrust forward, the feet planted wide',
    },
    colour: 'blood',
    fx: { attack: 'a crimson slash trail following the blade of the great axe along its whole arc',
      cast: 'a crimson battle aura: thin ribbons of red light rising around him and his raised axe' } },
  shadow_shaman: { group: 'dragon', master: dragon('shadow_shaman'), worldHeight: 4.1, body: 'person',
    look: 'a shaman of the Shadows: tattered black robes marked with pale runes, a deep hood whose shadow hides the face with two small glowing eyes, and a gnarled staff topped with antlers.',
    weapon: 'He holds the gnarled antler staff, as in the reference, and fights with dark magic.',
    actions: staff('antler staff'), colour: 'ink',
    fx: { attack: 'a short stream of cold black ink lashing forward from the staff toward the right',
      cast: 'thin wisps of cold black ink coiling around him and his staff, and a faint dark stain spreading on the ground at his feet' } },
  wolf_champion: { group: 'dragon', master: dragon('wolf_champion'), worldHeight: 4.0, body: 'person',
    look: 'the champion of the Wolf clan: a wolf pelt worn over a closed steel helm, dark steel and chainmail armour, a bandolier of throwing knives across the chest, a blue sash, and a long dagger.',
    weapon: 'He fights with the long dagger and the throwing knives of his bandolier, as in the reference.',
    actions: daggers, colour: 'blood',
    fx: { attack: 'a crimson slash trail following the dagger\'s strike, and a thrown knife streaking forward toward the right',
      cast: 'a crimson battle aura: thin ribbons of red light rising around him' } },
  shadow_wyrm: { group: 'dragon', master: dragon('shadow_wyrm'), worldHeight: 3.0, body: 'quadruped',
    look: 'a long four-legged wyrm covered in pale white-grey scales cracked with black, a spiked crest along the head and neck, and a long tail. Its eyes are never purple.',
    weapon: 'It fights with its jaws and its short breath: no weapon, no armour.',
    actions: {
      dash: 'slithering forward fast toward the right, low to the ground, the long body and tail undulating behind',
      attack: 'lunging its head and neck forward toward the right, the jaws wide open, breathing out',
      cast: 'rearing its head and neck high, the crest raised, the jaws open in a roar, the tail coiled',
    },
    colour: 'ink',
    fx: { attack: 'a short breath of cold black ink pouring from its open jaws toward the right',
      cast: 'thin wisps of cold black ink rising around its raised neck and crest' } },
  dragon_guardian: { group: 'dragon', master: dragon('dragon_guardian'), worldHeight: 2.2, body: 'person',
    look: 'a guardian of the Dragon clan: a closed golden dragon-crested helm, green scale armour under cream and jade robes with a gold dragon embroidery, and a long spear with a curved golden blade.',
    weapon: 'He holds the long spear with the curved golden blade, as in the reference.',
    actions: spear('his body'), colour: 'ice',
    fx: { cast: 'a few thin ribbons of icy blue crystal light rising around him and small ice-crystal shards' } },
  wolf_raider: { group: 'dragon', master: dragon('wolf_raider'), worldHeight: 2.15, body: 'person',
    look: 'a Wolf raider: a wolf pelt with the head worn over the helm, dark armour with red cloth, a round shield painted with a white wolf, and a short axe.',
    weapon: 'He holds the short axe and the round wolf shield, as in the reference.',
    actions: blade('short axe'), colour: 'blood',
    fx: { attack: 'a crimson slash trail following the short axe along its swing',
      cast: 'a crimson battle aura: thin ribbons of red light rising around him' } },
  wolf_hunter: { group: 'dragon', master: dragon('wolf_hunter'), worldHeight: 2.1, body: 'person',
    look: 'a Wolf hunter: a grey wolf-pelt hood and a dark mask covering the face, leather and fur clothes, a pouch of stones at the belt, and a leather sling.',
    weapon: 'He fights with the leather sling, as in the reference, and carries no bow and no blade.',
    actions: {
      dash: 'a fast, low run toward the right, the sling hanging from one hand, the pelt streaming behind',
      attack: 'whirling the sling and releasing toward the right: the throwing arm extended forward after the release, a stone flying from the sling',
      cast: 'drawing a stone from the pouch at his belt, the sling ready in the other hand, crouched and alert',
    },
    colour: 'blood',
    fx: { cast: 'a few thin ribbons of red light rising around him as he readies the shot' } },

  // ---- Scorpion plateau.
  grand_inquisitor: { group: 'scorpion', master: scorpion('grand_inquisitor'), worldHeight: 4.3, body: 'person',
    look: 'the Grand Inquisitor of the Scorpion clan: layered red, rust and cream robes with copper embroidery and scroll cases, a deep red hood and a copper mask hiding the face, and a tall staff topped with a curled copper scorpion tail.',
    weapon: 'He holds the tall scorpion staff, as in the reference, and fights with its magic.',
    actions: staff('scorpion staff'), colour: 'scorpion',
    fx: { attack: 'a burst of amber and copper light leaving the head of the staff toward the right, with a gust of pale sand',
      cast: 'thin ribbons of amber light and swirling pale sand circling around him, and a faint ring of light on the ground at his feet' } },
  phoenix_guardian_chief: { group: 'scorpion', master: scorpion('phoenix_guardian_chief'), worldHeight: 4.2, body: 'person',
    look: 'the chief of the Phoenix guardians: silver plate armour, a closed helm with golden wings, a flowing amber-gold tabard and cape with a phoenix emblem, and a spear whose tip burns with fire.',
    weapon: 'He holds the burning spear, as in the reference, and no other weapon.',
    intrinsic: 'The flame burning at the tip of the spear is part of the weapon and stays in the pose.',
    actions: spear('his body'), colour: 'fire',
    fx: { cast: 'thin ribbons of flame and rising embers around him and his raised spear' } },
  shadow_prophet: { group: 'scorpion', master: scorpion('shadow_prophet'), worldHeight: 4.1, body: 'person',
    look: 'a prophet of the Shadows: tattered grey and black robes, a deep hood whose shadow hides the face with two small glowing eyes, and wisps of black ink curling from one raised hand.',
    weapon: 'He fights with dark magic from his hands and carries no weapon.',
    intrinsic: 'The wisps of black ink curling from his hand belong to the character and stay in the pose.',
    actions: handMagic, colour: 'ink',
    fx: { attack: 'a short stream of cold black ink lashing forward from his open hand toward the right',
      cast: 'thin wisps of cold black ink coiling around him and his raised hands' } },
  phoenix_flamekeeper: { group: 'scorpion', master: scorpion('phoenix_flamekeeper'), worldHeight: 4.0, body: 'person',
    look: 'a flame keeper of the Phoenix: silver plate armour, a closed helm with golden wings, a flowing amber and orange robe, and a tall golden staff crowned with a burning flame.',
    weapon: 'He holds the tall golden flame staff, as in the reference, and fights with its fire.',
    intrinsic: 'The flame burning at the top of the staff is part of the weapon and stays in the pose.',
    actions: staff('flame staff'), colour: 'fire',
    fx: { attack: 'a burst of flame leaving the top of the staff toward the right, with a few embers',
      cast: 'thin ribbons of flame and rising embers spiralling around him' } },
  shadow_zealot: { group: 'scorpion', master: scorpion('shadow_zealot'), worldHeight: 4.0, body: 'person',
    look: 'a faithful of the Phoenix led astray by the Shadows: tattered amber robes stained with black, a deep hood whose shadow hides the face with two small glowing eyes, and wisps of black ink curling from both hands.',
    weapon: 'He fights with dark magic from his hands and carries no weapon.',
    intrinsic: 'The wisps of black ink curling from his hands belong to the character and stay in the pose.',
    actions: handMagic, colour: 'ink',
    fx: { attack: 'a short stream of cold black ink lashing forward from his open hand toward the right',
      cast: 'thin wisps of cold black ink coiling around him and his raised hands' } },
  phoenix_guardian: { group: 'scorpion', master: scorpion('phoenix_guardian'), worldHeight: 2.2, body: 'person',
    look: 'a Phoenix guardian: silver plate armour, a closed helm with golden wings, an amber-gold tabard with a red phoenix emblem, and a long spear.',
    weapon: 'He holds the long spear, as in the reference, and no other weapon.',
    actions: spear('his body'), colour: 'fire',
    fx: { cast: 'a few thin ribbons of flame and rising embers around him' } },
  scorpion_scholar: { group: 'scorpion', master: scorpion('scorpion_scholar'), worldHeight: 2.1, body: 'person',
    look: 'a scholar of the Scorpion clan: cream robes with red and rust patterns, a red hood and mask hiding the face, scroll cases at the belt, and a tall wooden staff with a copper finial.',
    weapon: 'He holds the tall wooden staff, as in the reference, and fights with its magic.',
    actions: staff('wooden staff'), colour: 'scorpion',
    fx: { attack: 'a burst of amber light leaving the head of the staff toward the right, with a gust of pale sand',
      cast: 'thin ribbons of amber light and swirling pale sand circling around him' } },

  // ---- Final act, and Maelor at the breach.
  serpent_champion: { group: 'finale', master: finale('serpent_champion'), worldHeight: 4.2, body: 'person',
    look: 'the champion of the Serpent clan: bronze and dark steel armour with scale mail, a closed serpent-crested helm, a long dark green cape with a golden serpent emblem, and a long wavy serpent blade.',
    weapon: 'He wields the long wavy serpent blade, as in the reference, and no other weapon.',
    actions: blade('wavy serpent blade'), colour: 'poison',
    fx: { attack: 'a venom-green slash trail following the wavy blade along its whole swing, with a few drops of venom',
      cast: 'thin ribbons of venom-green light coiling around him like serpents' } },
  demon_champion: { group: 'finale', master: finale('demon_champion'), worldHeight: 4.0, body: 'creature',
    look: 'the Serpent\'s champion changed into a demon: a hunched demon with a matte black scaly hide and long claws, torn remains of his green cloak and bronze armour, the serpent-crested helm fused to his head, two small glowing white eyes. The hide never glows.',
    weapon: 'It fights with its long claws: no weapon in hand.',
    actions: clawBiped, colour: 'ink',
    fx: { cast: 'thin wisps of cold black ink rising around it as it roars' } },
  breach_entity: { group: 'finale', master: finale('breach_entity'), worldHeight: 4.3, body: 'creature',
    look: 'the unnamed entity of the breach: a hooded wraith made of cold black ink, two small cold white eyes in the shadow of the hood, long thin clawed hands, its body dissolving below into streams of ink with a thin cold white rim.',
    weapon: 'It fights with dark magic from its clawed hands and carries no weapon.',
    intrinsic: 'Its body of flowing ink belongs to the character and stays in every pose.',
    actions: handMagic, colour: 'ink',
    fx: { attack: 'a lash of cold black ink streaming forward from its clawed hand toward the right',
      cast: 'thin streams of cold black ink spiralling up around it' } },
  raven_champion: { group: 'finale', master: finale('raven_champion'), worldHeight: 4.0, body: 'person',
    look: 'the champion of the Raven clan: dark steel armour, a closed helm shaped like a raven\'s beak, a cloak of black and dark blue feathers, and a dagger in each hand.',
    weapon: 'He fights with a dagger in each hand, as in the reference.',
    actions: daggers, colour: 'raven',
    fx: { attack: 'a pale steel slash trail following the leading dagger, with a few dark feathers torn loose',
      cast: 'a swirl of dark raven feathers and pale steel glints circling around him' } },
  phoenix_champion: { group: 'finale', master: finale('phoenix_champion'), worldHeight: 4.0, body: 'person',
    look: 'the champion of the Phoenix clan: silver plate armour, a closed helm with golden wings, a flowing amber-gold tabard and cape with a phoenix emblem, and a long spear whose tip burns.',
    weapon: 'He holds the long burning spear, as in the reference, and no other weapon.',
    intrinsic: 'The flame burning at the tip of the spear is part of the weapon and stays in the pose.',
    actions: spear('his body'), colour: 'fire',
    fx: { cast: 'thin ribbons of flame and rising embers around him and his raised spear' } },
  demon_brute: { group: 'finale', master: finale('demon_brute'), worldHeight: 3.4, body: 'creature',
    look: 'a massive hunched demon of the breach: a cracked black rocky hide with thin pale lines, great curved horns, huge clawed hands, two small glowing white eyes.',
    weapon: 'It fights with its huge claws: no weapon in hand.',
    actions: clawBiped, colour: 'ink',
    fx: { cast: 'thin wisps of cold black ink rising around it as it roars' } },
  breach_demon: { group: 'finale', master: finale('breach_demon'), worldHeight: 1.95, body: 'creature',
    look: 'a gaunt demon of the breach: a thin black body, long curved horns, long clawed fingers, two small glowing white eyes.',
    weapon: 'It fights with its long claws: no weapon in hand.',
    actions: clawBiped, colour: 'ink',
    fx: { cast: 'thin wisps of cold black ink rising around it' } },
  maelor: { group: 'finale', master: 'public/assets/characters/pixel/masters/maelor.png', worldHeight: 4.1, body: 'person',
    look: 'Maelor, the intendant who betrays the clan: a long wine-red and violet coat with gold embroidery over dark leather and bronze armour pieces, a deep hood and a dark mask covering the face, and a book held in one hand.',
    weapon: 'He holds his book and fights with dark magic, as in the reference; he carries no blade in this fight.',
    actions: {
      dash: 'a quick gliding step forward toward the right, the long coat flowing back, the book held close',
      attack: 'thrusting one open hand forward toward the right, casting a spell at arm\'s length, the book held open in the other hand',
      cast: 'raising the open book high in one hand, the other hand lifted, invoking a dark power, the coat stirring',
    },
    colour: 'ink',
    fx: { attack: 'a short stream of cold black ink lashing forward from his open hand toward the right',
      cast: 'thin wisps of cold black ink rising from the open book and coiling around him' } },
});

/** Units of each group, in play order. */
export function unitsOf(group: PoseGroup): string[] {
  return Object.entries(POSE_UNITS).filter(([, unit]) => unit.group === group).map(([id]) => id);
}

/** Whether a pose carries a baked effect. */
export function hasFx(unit: PoseUnit, pose: PoseName): boolean {
  return pose !== 'dash' && Boolean(unit.fx[pose]);
}

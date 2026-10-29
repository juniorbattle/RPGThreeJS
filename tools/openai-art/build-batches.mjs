// Writes the generation specs of the local combat art mission (no API call).
//   node tools/openai-art/build-batches.mjs            → tools/openai-art/batches/*.json
// Then, locally, with OPENAI_API_KEY in .env.local:
//   node tools/openai-art/generate-images.mjs tools/openai-art/batches/combat-hero-anims.json --dry-run
//   node tools/openai-art/generate-images.mjs tools/openai-art/batches/combat-hero-anims.json --only alistair-attack
//
// Batches
//   combat-hero-anims    6 heroes × 5 strips (idle 4, walk 6, attack 6, cast 6, hurt 2 + ko 3) = 30 images
//   combat-arena-plates  3 biomes × 2 layers (far sky/horizon, mid-ground row on a key colour) = 6 images
//   combat-fx-sheets     8 signature effects as 4×4 additive frame sheets on black = 8 images
// Everything is generated FROM the project's own images (masters, poses, approved
// paintings) given as edit inputs, and described in words; no third-party art.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'batches');
mkdirSync(OUT, { recursive: true });
const P = (path) => `public${path}`;

// ------------------------------------------------------------------ heroes

/** Key colour per hero: a flat background colour the character never uses. */
const HEROES = {
  alistair: { label: 'a knight in dark steel plate with a long red cape and a red-and-gold tabard, longsword', key: ['pure green', '#00FF00'] },
  archer: { label: 'a hooded archer in green cloak and leather armour with a longbow and a quiver', key: ['pure magenta', '#FF00FF'] },
  dark_mage: { label: 'a black mage in a deep-blue robe and wide-brimmed hat, holding a grimoire, violet magic in the hand', key: ['pure green', '#00FF00'] },
  lancer: { label: 'a lancer with long teal hair in silver-and-teal armour holding a long spear', key: ['pure magenta', '#FF00FF'] },
  rogue: { label: 'a rogue in a crimson-magenta hooded cloak and dark leathers with two curved daggers', key: ['pure cyan', '#00FFFF'] },
  white_mage: { label: 'a white mage in an ivory-and-gold hooded robe with a golden sun staff', key: ['pure magenta', '#FF00FF'] },
};

const STYLE = [
  'Premium HD pixel art matching the attached reference images exactly: same character, same outfit, same colours, same proportions, same level of detail and the same crisp square pixels with selective dark outlines.',
  'Side view, the character faces RIGHT in every frame. Full body visible in every frame, never cropped. Every frame is drawn at the same scale with both feet resting on one shared horizontal baseline near the bottom of the image.',
  'Absolutely no visual effects: no slash trails, no motion arcs, no glow, no aura, no sparks, no particles, no magic circles, no speed lines, no shadows on the ground. Effects are added later by the game engine.',
];
const NO = 'No text, no letters, no numbers, no frame borders, no grid lines, no labels, no watermark.';

const ANIMS = {
  idle: { frames: 4, ms: [260, 220, 260, 220], loop: true, pose: 'prepare', beats: 'a calm battle-ready breathing loop: 1 neutral stance, 2 chest rises and shoulders lift one pixel, 3 neutral again with cloth settling, 4 slight exhale with the weapon lowering a touch' },
  walk: { frames: 6, ms: [110, 110, 110, 110, 110, 110], loop: true, pose: 'dash', beats: 'a brisk six-frame combat walk cycle to the right: contact, down, passing, up, contact with the other leg, passing; arms and cape swing in counter-motion, head steady' },
  attack: { frames: 6, ms: [90, 90, 70, 60, 140, 160], loop: false, pose: 'attack', beats: 'a weapon attack to the right: 1 guard, 2 anticipation pulling the weapon back, 3 lunge forward, 4 full strike at maximum extension, 5 follow-through, 6 recovery back toward guard' },
  cast: { frames: 6, ms: [110, 110, 120, 220, 160, 160], loop: false, pose: 'cast', beats: 'casting a spell or a war cry: 1 stance, 2 gathering power with the free hand raised, 3 focus with the cape lifting, 4 release with the arm or weapon thrust forward (the strongest pose), 5 hold, 6 lowering back to stance' },
  hurtko: { frames: 5, ms: [90, 180, 160, 160, 420], loop: false, pose: 'prepare', beats: 'frames 1-2: taking a hit (1 flinch backward with the head snapped back, 2 staggered and hunched); frames 3-5: knocked out (3 knees buckling, 4 falling to one knee, 5 collapsed on the ground lying on the side)' },
};

function heroImages() {
  const images = [];
  for (const [unit, hero] of Object.entries(HEROES)) {
    for (const [anim, def] of Object.entries(ANIMS)) {
      const prompt = [
        `The attached images are our own game art of ${hero.label}: the full master illustration and the "${def.pose}" combat pose. Draw a horizontal animation strip of this exact character.`,
        `Exactly ${def.frames} frames in a single row, left to right, evenly spaced across the full width, each frame in its own equal-width column with clear empty background between frames. The animation: ${def.beats}.`,
        ...STYLE,
        `A perfectly flat, uniform ${hero.key[0]} (${hero.key[1]}) background with no shading, no texture, no floor; that colour must not appear anywhere on the character.`,
        NO,
      ].join('\n\n');
      images.push({
        name: `${unit}-${anim}`,
        endpoint: 'edits',
        inputs: [P(`/assets/characters/pixel/masters/${unit}.png`), P(`/assets/characters/pixel/combat/${unit}/${def.pose}.png`)],
        size: '1536x1024',
        quality: 'high',
        prompt,
        meta: { unit, anim, frames: def.frames, ms: def.ms, loop: def.loop, key: hero.key[1] },
      });
    }
  }
  return images;
}

// ------------------------------------------------------------------ arenas

const ARENAS = {
  forest_route: {
    painting: '/assets/generated/lion-phase/environments/demo-environment-pack-v1/strategic/forest-route-strategic.png',
    far: 'a misty mountain valley at dawn: a distant castle on a cliff with an aqueduct, tall waterfalls, layers of dark pine forest fading into blue haze, soft golden light from the upper left, a calm sky with clouds',
    mid: 'a continuous row of ancient mossy forest edge for the middle distance: large leafy oaks and pines, broken stone pillars and a ruined archway overgrown with ivy, ferns and bushes at their feet',
  },
  bois_clair_burning: {
    painting: '/assets/generated/lion-phase/environments/demo-environment-pack-v1/strategic/bois-clair-burning-strategic.png',
    far: 'a village burning at dusk: an orange-red sky full of drifting smoke, a church steeple and timber roofs in flames on a far hill, dark forest silhouettes, embers in the air',
    mid: 'a continuous row of half-timbered village houses for the middle distance, some roofs on fire with smoke columns, wooden fences, carts, barrels and torn red banners with a gold lion',
  },
  lion_sanctum: {
    painting: '/assets/generated/lion-phase/environments/demo-environment-pack-v1/strategic/lion-sanctum-strategic.png',
    far: 'a moonlit night over a ruined royal sanctuary: a great gothic ruin with tall arches on a distant crag, a full moon, deep blue sky with silver clouds, misty waterfalls and pine ridges',
    mid: 'a continuous row of sanctuary ruins for the middle distance: tall pointed arches, broken colonnades, statues, blue banners with a gold lion, candles in niches, dark pines behind',
  },
};

function arenaImages() {
  const images = [];
  for (const [scene, arena] of Object.entries(ARENAS)) {
    images.push({
      name: `${scene}-far`,
      endpoint: 'edits',
      inputs: [P(arena.painting)],
      size: '1536x1024',
      quality: 'high',
      prompt: [
        'Use the attached painting only as a style and palette reference (premium HD pixel-art painting, same light and mood); do not copy its composition and do not include its floor.',
        `ONE wide background layer for a side-on battle scene: ${arena.far}. Only the sky and the far distance: the bottom quarter of the image is soft atmospheric haze where the distant land meets the fog; no ground plane, no road, no foreground objects, no people.`,
        'Seen straight from the front at eye level, wide panoramic composition with interest spread across the whole width; the centre stays readable but uncluttered.',
        NO,
      ].join('\n\n'),
      meta: { scene, layer: 'far', placement: { z: -27, width: 46, bottomY: -2.2 } },
    });
    images.push({
      name: `${scene}-mid`,
      endpoint: 'edits',
      inputs: [P(arena.painting)],
      size: '1536x1024',
      quality: 'high',
      prompt: [
        'Use the attached painting only as a style and palette reference (premium HD pixel-art painting, same light and mood); do not copy its composition.',
        `ONE isolated scenery layer seen straight from the front like an elevation (eye level, no perspective tilt): ${arena.mid}. The objects stand on a common baseline at the bottom edge and fill the whole width as a continuous frieze, varied heights, a gap of open space in the middle third so the far background shows through.`,
        'A perfectly flat, uniform pure magenta (#FF00FF) background behind and between the objects, with no shading, no floor and no cast shadow; magenta must not appear in the objects.',
        NO,
      ].join('\n\n'),
      meta: { scene, layer: 'mid', key: '#FF00FF', placement: { z: -14, width: 40, bottomY: -0.2 } },
    });
  }
  return images;
}

// ------------------------------------------------------------------ fx sheets

const FX = {
  lion_slash: 'a huge golden crescent sword slash with a white-hot edge and sparks',
  holy_pillar: 'a vertical pillar of holy light falling from the sky with feathers of light',
  void_implosion: 'a black-violet void sphere imploding with purple lightning arcs',
  meteor_impact: 'a fiery meteor impact explosion with a shockwave ring and debris',
  ice_burst: 'ice crystals erupting from the ground with frost mist',
  arcane_sigil: 'a rotating magenta arcane sigil circle with runes, seen from the front',
  heal_bloom: 'a soft green-gold healing bloom of light petals rising',
  lightning_strike: 'a forked lightning strike hitting the ground with a flash',
};

function fxImages() {
  return Object.entries(FX).map(([id, desc]) => ({
    name: `fx-${id}`,
    endpoint: 'generations',
    inputs: [],
    size: '1024x1024',
    quality: 'high',
    prompt: [
      `A 4 by 4 grid of 16 animation frames of ${desc}, read left to right then top to bottom: the effect appears, peaks around frame 6 and fades out by frame 16.`,
      'Every frame centred in its equal square cell, same scale and same centre in every cell, generous empty space around the effect inside each cell.',
      'Video-game visual effect in a premium HD-2D style: bright white-hot core, saturated body colour, crisp pixel-art clusters on the edges.',
      'Pure black (#000000) background (the game adds the effect with additive blending), no gradient, no vignette.',
      NO,
    ].join('\n\n'),
    meta: { fx: id, grid: [4, 4], frames: 16, blending: 'additive' },
  }));
}

const batches = {
  'combat-hero-anims': heroImages(),
  'combat-arena-plates': arenaImages(),
  'combat-fx-sheets': fxImages(),
};
for (const [batch, images] of Object.entries(batches)) {
  writeFileSync(join(OUT, `${batch}.json`), JSON.stringify({ batch, images }, null, 2) + '\n');
  console.log(`${batch}: ${images.length} images`);
}

export const CIN3_PROMPT_VERSION = 'cin3-v1';

export const CIN3_PILOTS = Object.freeze({
  lion_judgement: Object.freeze({
    source: 'public/assets/cinematics/source/lion_judgement_source.png',
    environment: 'public/assets/generated/lion-phase/dialogue/lion_finale_judgement.webp',
    characters: Object.freeze([
      'public/assets/characters/pixel/full/alaric.png',
      'public/assets/characters/pixel/full/lion_champion.png',
    ]),
    prompt: `Use the provided first frame as the exact visual and character reference. Animate this existing composition into a restrained premium HD-2D fantasy tactical RPG cinematic inside the Lion judgement hall. Preserve the exact painted hall architecture, composition, palette and perspective. Preserve Alaric exactly as shown: the same head and face identity, armor, clothing, silhouette, colors and equipment. Preserve the Lion Champion exactly as shown. The scene is solemn, ceremonial, authoritative and tense immediately before a major judgement. Alaric remains composed and imposing. The Lion Champion remains secondary and mostly still. Use an extremely slow cinematic push-in, subtle warm torch-light flicker, sparse drifting dust motes, extremely restrained breathing, tiny natural cape and cloth movement, and barely perceptible warm judgement-light variation. Keep movement restrained and do not turn the scene into action. The final second naturally settles toward a visually stable frame suitable for a freeze-frame transition into deterministic RPG dialogue. No speech, lip sync or generated dialogue. No character, face, costume, armor, weapon, architecture or environment redesign. No photorealism, live action, realistic 3D replacement, extra or duplicated characters, combat, attack, dramatic gesture, camera orbit, rapid zoom, hallucinated props, excessive glow, explosion, text, UI, subtitles, watermark, heavy blur, anatomy melting, duplicated limbs or style drift.`,
  }),
  serpent_general_reveal: Object.freeze({
    source: 'public/assets/cinematics/source/serpent_general_reveal_source.png',
    environment: 'public/assets/generated/lion-phase/combat/lion_sanctum.webp',
    characters: Object.freeze([
      'public/assets/characters/pixel/full/serpent_general_boss.png',
    ]),
    prompt: `Use the provided first frame as the exact visual and character reference. Animate this existing composition into a restrained premium HD-2D fantasy tactical RPG boss reveal. Preserve the exact painted Lion Sanctum environment. Preserve the Serpent General exactly as shown: the same head identity, armor, weapon, silhouette, palette and proportions. The Serpent General is imposing and prepared for battle but remains mostly stationary. Use a slow controlled camera push-in, faint floor-level atmospheric mist, a subtle corrupted shadow-green aura breathing behind the boss, sparse dust particles, extremely restrained breathing and minimal cloth movement. Communicate danger and corrupted authority without turning the sequence into combat or moving the boss significantly from the source-frame position. End in a visually stable, powerful boss pose suitable for transition into Three.js tactical combat. No speech. No character, face, armor, weapon or environment redesign. No photorealism, realistic human conversion, full 3D replacement, duplicated weapon, extra limbs or characters, attack, projectile, spell cast, explosion, battle animation, major camera rotation, aggressive zoom, distorted architecture, text, UI, subtitles, watermark, excessive fog, strong motion blur or style drift.`,
  }),
  lion_champion_reveal: Object.freeze({
    source: 'public/assets/cinematics/source/lion_champion_reveal_source.png',
    environment: 'public/assets/generated/lion-phase/combat/lion_sanctum.webp',
    characters: Object.freeze([
      'public/assets/characters/pixel/full/lion_champion.png',
    ]),
    prompt: `Use the provided first frame as the exact visual and character reference. Animate this existing composition into a restrained premium HD-2D fantasy tactical RPG Champion reveal before a formal Lion trial boss battle. Preserve the Lion Champion exactly as shown: the same crowned lion head identity, armor, sword, silhouette, blue-and-gold palette, proportions and Lion faction design. Preserve the exact painted Lion environment shown in the source image. The Champion is disciplined, imposing and completely prepared for battle, but does not attack. Use a restrained slow camera push-in, subtle warm ceremonial light movement, slow floating dust, barely perceptible breathing, minimal cape and cloth movement, and small atmospheric environmental motion. The mood is honour, discipline, danger and ceremonial gravity. End in a clean stable combat-ready pose suitable for transition into Three.js tactical combat. No speech. No photorealism, realistic conversion, full 3D replacement, armor redesign, crown or head redesign, face redesign, weapon replacement, extra weapon, duplicated limbs or character, additional fighter, attack swing, projectile, explosion, large magic effect, rapid movement, camera orbit, environment replacement, text, UI, subtitles, watermark, heavy blur or style drift.`,
  }),
});

export function getCin3Pilot(id) {
  const pilot = CIN3_PILOTS[id];
  if (!pilot) {
    throw new Error(`Unsupported CIN-3 cinematic ID '${id}'. Expected one of: ${Object.keys(CIN3_PILOTS).join(', ')}.`);
  }
  return pilot;
}

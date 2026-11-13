import type { BackgroundSceneConfig } from './BackgroundLayerSystem';
import { assets } from './assetManifest';

function paintedCombatScene(id: string, texture: string, fallback: [string, string]): BackgroundSceneConfig {
  return {
    id,
    enabled: true,
    layers: [
      {
        id: `${id}-painted-backdrop`,
        texture,
        position: [0, -0.28, -30],
        size: [36, 20.25],
        parallax: 0,
        opacity: 1,
        fallback,
        failOnError: true,
      },
    ],
  };
}

/**
 * An arena with no painted backdrop: the coded arena (`src/combat/arena/`) draws its own far plate. The Bear's, the
 * Dragon's, the Scorpion's and the final act's arenas are coded only (OD-2026-11-01-C dropped the arena plates), so none
 * of them falls back on the Lion's forest ruins.
 */
function codedArenaOnly(id: string): BackgroundSceneConfig {
  return { id, enabled: false, layers: [] };
}

export const combatBackgrounds: Record<string, BackgroundSceneConfig> = {
  forest_route: paintedCombatScene('forest-route-painted', assets.combatScenes.forest_route, ['#253044', '#0b111b']),
  bois_clair_burning: paintedCombatScene('bois-clair-burning-painted', assets.combatScenes.bois_clair_burning, ['#4a2219', '#120b0a']),
  lion_sanctum: paintedCombatScene('lion-sanctum-painted', assets.combatScenes.lion_sanctum, ['#2c263b', '#0b0b16']),
  bear_mountain_pass: codedArenaOnly('bear-mountain-pass-coded'),
  bear_mine_galleries: codedArenaOnly('bear-mine-galleries-coded'),
  bear_hall_terrace: codedArenaOnly('bear-hall-terrace-coded'),
  dragon_peak_trail: codedArenaOnly('dragon-peak-trail-coded'),
  dragon_snowy_summit: codedArenaOnly('dragon-snowy-summit-coded'),
  dragon_hall_esplanade: codedArenaOnly('dragon-hall-esplanade-coded'),
  dragon_wolf_cave: codedArenaOnly('dragon-wolf-cave-coded'),
  scorpion_dune_track: codedArenaOnly('scorpion-dune-track-coded'),
  scorpion_dune_crest: codedArenaOnly('scorpion-dune-crest-coded'),
  scorpion_phoenix_ruins: codedArenaOnly('scorpion-phoenix-ruins-coded'),
  scorpion_phoenix_temple: codedArenaOnly('scorpion-phoenix-temple-coded'),
  scorpion_ash_sanctuary: codedArenaOnly('scorpion-ash-sanctuary-coded'),
  scorpion_records_court: codedArenaOnly('scorpion-records-court-coded'),
  finale_destiny_arena: codedArenaOnly('finale-destiny-arena-coded'),
  finale_arena_breach: codedArenaOnly('finale-arena-breach-coded'),
  finale_burning_streets: codedArenaOnly('finale-burning-streets-coded'),
  finale_smoke_square: codedArenaOnly('finale-smoke-square-coded'),
  finale_rampart_reserve: codedArenaOnly('finale-rampart-reserve-coded'),
  finale_breach_heart: codedArenaOnly('finale-breach-heart-coded'),
  finale_breach_scar: codedArenaOnly('finale-breach-scar-coded'),
};

export const forestCombatBackground: BackgroundSceneConfig = {
  id: 'forest-ruins-hybrid-painted',
  enabled: true,
  layers: [
    {
      id: 'combat-painted-backdrop',
      texture: assets.screens.combat.forestRuinsBackdrop,
      position: [0, -0.28, -30],
      size: [36, 20.25],
      parallax: 0,
      opacity: 1,
      fallback: ['#253044', '#0b111b'],
    },
  ],
};

export function combatBackgroundFor(sceneId?: string): BackgroundSceneConfig {
  return sceneId ? combatBackgrounds[sceneId] ?? forestCombatBackground : forestCombatBackground;
}

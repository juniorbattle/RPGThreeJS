const paintedBackdrop = {
  mode: 'hybrid-painted',
  mainImageSlot: 'combat.forestRuinsBackdrop',
  fallback: 'forest-pilot',
  parallaxStrength: 0,
  mainImageMotion: 'none',
  position: [0, -0.28, -30],
  size: [36, 20.25],
  opacity: 1,
};

const farBackground = {
  opacity: 0.12,
  parallaxStrength: 0.004,
};

const midBackground = {
  opacity: 0.06,
  parallaxStrength: 0.008,
};

const foregroundDecor = {
  opacity: 0,
  peripheralOpacity: 0,
  contrast: 0.58,
  saturation: 0.6,
  scale: 0,
  ambientVegetationOpacity: 0,
  lanternIntensity: 0,
  keepOutOfCenter: true,
};

const tacticalArena = {
  position: [0, 0, 0],
  scale: 1.0,
  centerLightOpacity: 0,
  edgeVignetteOpacity: 0,
  terrainSaturation: 0.52,
  terrainBrightness: 1.02,
  groundCoverOpacityIdle: 0,
  groundCoverOpacityTactical: 0,
  groundCoverOpacityDeploy: 0,
};

const gameplayGrid = {
  idleOpacity: 0.34,
  selectedOpacity: 0.58,
  tacticalOpacity: 0.86,
  stageOpacity: 0.14,
  moveTileOpacity: 0.84,
  deployTileOpacity: 0.8,
  rangeTileOpacity: 0.68,
  targetTileOpacity: 0.96,
  hoverTileOpacity: 0.9,
  invalidTileOpacity: 0.38,
};

const ambientMist = {
  globalMistOpacity: 0.03,
  centerWashOpacity: 0.035,
  bloomStrength: 0.28,
  bloomRadius: 0.58,
  bloomThreshold: 0.96,
  tiltShiftStrength: 0.5,
  fogDensity: 0.01,
  godRayOpacity: 0,
  godRayGlowOpacity: 0,
};

const unitPresentation = {
  contactShadowOpacity: 0.96,
  shadowOpacity: 0.94,
  shadowScale: 1.12,
  // Normal foes get a slight scale boost so they feel more imposing
  // without overflowing their 1x1 tile.
  foeSpriteScale: 1.25,
  // Heroes use a slightly reduced scale so they don't feel oversized
  // next to foes on the compact 8x4 arena.
  heroSpriteScale: 1.0,
  // Same principle as largeUnitGroundOffset: hero sprites have
  // transparent padding at the bottom. This sinks the plane so
  // the character's feet rest on the grid.
  heroGroundOffset: 0.05,
  // Every 2x2 opponent uses the same visual scale. Tactical mass comes from
  // the footprint and ring as much as the sprite, so 1.6 keeps both elites
  // and bosses imposing without swallowing the compact 8x4 arena.
  twoByTwoEliteSpriteScale: 2.0,
  twoByTwoBossSpriteScale: 2.0,
  // Large unit sprites have transparent padding at the bottom of the
  // texture. Without a ground offset, the 2.2x scale lifts the visible
  // character off the grid. This fraction of the unscaled sprite height
  // sinks the plane so the character's feet touch the ground.
  largeUnitGroundOffset: 0.2,
  teamRingOpacity: 0.92,
  activeRingOpacity: 1,
  activeRingIntensity: 1,
  activeBaseOpacity: 0.12,
  protectFromFog: true,
};

export const COMBAT_PRESENTATION = {
  backdrop: paintedBackdrop,
  paintedBackdrop,
  farBackground,
  midBackground,
  foregroundDecor,
  tacticalArena,
  edgeVignette: {
    opacity: tacticalArena.edgeVignetteOpacity,
  },
  ambientMist,
  gameplayGrid,
  grade: {
    saturation: 0.93,
    contrast: 1.04,
    vignette: 1.04,
    grain: 0.006,
    warm: [1.02, 1.0, 0.96],
    centerLift: ambientMist.centerWashOpacity,
  },
  camera: {
    fov: 33,
    zoomFovMin: 29,
    zoomFovMax: 38,
    zoomFovStep: 1,
    overviewDistance: 16.2,
    overviewHeight: 6.15,
    baseDistance: 16.2,
    baseHeight: 6.15,
    actionDistance: 10.6,
    actionHeight: 6.7,
    stageDistance: 9.4,
    stageHeight: 3.45,
    targetY: 2.4,
  },
  arena: {
    gridOpacityIdle: gameplayGrid.idleOpacity,
    gridOpacitySelected: gameplayGrid.selectedOpacity,
    gridOpacityTactical: gameplayGrid.tacticalOpacity,
    gridOpacityStage: gameplayGrid.stageOpacity,
    moveTileOpacity: gameplayGrid.moveTileOpacity,
    deployTileOpacity: gameplayGrid.deployTileOpacity,
    rangeTileOpacity: gameplayGrid.rangeTileOpacity,
    targetTileOpacity: gameplayGrid.targetTileOpacity,
    hoverTileOpacity: gameplayGrid.hoverTileOpacity,
    invalidTileOpacity: gameplayGrid.invalidTileOpacity,
    terrainSaturation: tacticalArena.terrainSaturation,
    terrainBrightness: tacticalArena.terrainBrightness,
    centerLightOpacity: tacticalArena.centerLightOpacity,
    edgeVignetteOpacity: tacticalArena.edgeVignetteOpacity,
    groundCoverOpacityIdle: tacticalArena.groundCoverOpacityIdle,
    groundCoverOpacityTactical: tacticalArena.groundCoverOpacityTactical,
    groundCoverOpacityDeploy: tacticalArena.groundCoverOpacityDeploy,
  },
  props: {
    opacity: foregroundDecor.peripheralOpacity,
    contrast: foregroundDecor.contrast,
    saturation: foregroundDecor.saturation,
    scale: foregroundDecor.scale,
    lanternIntensity: foregroundDecor.lanternIntensity,
    ambientVegetationOpacity: foregroundDecor.ambientVegetationOpacity,
    keepOutOfCenter: foregroundDecor.keepOutOfCenter,
  },
  units: unitPresentation,
  background: {
    farOpacity: paintedBackdrop.opacity,
    midOpacity: midBackground.opacity,
    mistOpacity: ambientMist.globalMistOpacity,
    parallaxScale: paintedBackdrop.parallaxStrength,
  },
};

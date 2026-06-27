const travelDefaultBackdrop = new URL('../../assets-source/backdrop/travel_default.png', import.meta.url).href;
const travelCityBackdrop = new URL('../../assets-source/backdrop/travel_city.png', import.meta.url).href;
const travelCastleBackdrop = new URL('../../assets-source/backdrop/travel_castle.png', import.meta.url).href;

export const assets = {
  models: {
    forestKit: '/assets/3d/forest-kit.glb',
  },
  materials: {
    forestGrass: '/assets/3d/forest-kit/materials/grass.webp',
    forestStone: '/assets/3d/forest-kit/materials/stone.webp',
    forestBark: '/assets/3d/forest-kit/materials/bark.webp',
    forestFoliage: '/assets/3d/forest-kit/materials/foliage.webp',
  },
  world: {
    forestFar: '/assets/generated/forest-pilot/forest-dawn-far.webp',
    forestMid: '/assets/generated/forest-pilot/forest-mid.webp',
    forestFore: '/assets/generated/forest-pilot/forest-fore.webp',
    mapBackdrop: '/assets/generated/forest-pilot/world-map.webp',
  },
  portraits: {
    alistair: '/assets/portraits/alistair.png',
    marian: '/assets/portraits/marian.png',
    elara: '/assets/portraits/elara.png',
    kestrel: '/assets/portraits/kestrel.png',
  },
  // Named per-screen background slots.
  screens: {
    title: {
      background: '/assets/generated/forest-pilot/forest-dawn-far.webp',
    },
    travel: {
      background: travelDefaultBackdrop,
      sky: travelDefaultBackdrop,
      mist: '/assets/generated/forest-pilot/forest-mid.webp',
      backdrops: {
        default: travelDefaultBackdrop,
        city: travelCityBackdrop,
        castle: travelCastleBackdrop,
      },
    },
    worldMap: {
      background: '/assets/generated/forest-pilot/world-map.webp',
    },
    dialogue: {
      background: '/assets/generated/forest-pilot/forest-dawn-far.webp',
    },
    exploration: {
      background: '/assets/generated/forest-pilot/forest-dawn-far.webp',
    },
    management: {
      background: '/assets/generated/forest-pilot/forest-dawn-far.webp',
    },
    combat: {
      background: '/assets/generated/combat-painted/forest-ruins-backdrop.png',
      forestRuinsBackdrop: '/assets/generated/combat-painted/forest-ruins-backdrop.png',
      sky: '/assets/generated/forest-pilot/forest-dawn-far.webp',
      distance: '/assets/generated/forest-pilot/forest-mid.webp',
      mist: '/assets/generated/forest-pilot/forest-fore.webp',
    },
  },
} as const;

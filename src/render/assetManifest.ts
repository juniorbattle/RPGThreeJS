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
  // Named per-screen background slots. Swap these to point at dedicated
  // painted illustrations later; they currently reuse the forest pilot art.
  screens: {
    travel: {
      sky: '/assets/generated/forest-pilot/forest-dawn-far.webp',
      mist: '/assets/generated/forest-pilot/forest-mid.webp',
    },
  },
} as const;

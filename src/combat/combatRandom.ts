export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = value + Math.imul(value ^ (value >>> 7), 61 | value) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Owner rolls stay independent of particle count, frame cadence and motion settings.
 * Streams are transient; they are not campaign/save state or a replay guarantee.
 */
export function createCombatRandomStreams(seed: number) {
  const visual = mulberry32(seed);
  const tactical = mulberry32(seed);
  return {
    visual: (min = 0, max = 1) => min + (max - min) * visual(),
    tactical: (min = 0, max = 1) => min + (max - min) * tactical(),
  };
}

import type { FxElement } from './fxPalettes';
import type { FxAnchor, FxStep } from './fxRecipes';

/**
 * Visual weight of an action from its AP cost: the dearer the skill, the
 * bigger, brighter and more layered its FX; ultimates and boss signatures
 * cover the whole battlefield (see fieldFinaleSteps).
 *
 *   AP 0-1  light     basic weapon hits, quick utility
 *   AP 2    standard
 *   AP 3    strong    + ground shockwave
 *   AP 4    heavy     + second wave, light column, hit-stop
 *   AP 5    major     + wide wave and flash
 *   ultimate / boss signature: field-wide finale
 */
export type FxWeight = 'light' | 'standard' | 'strong' | 'heavy' | 'major' | 'ultimate';

export interface FxIntensity {
  weight: FxWeight;
  /** Size, radius and height multiplier. */
  scale: number;
  /** Particle count multiplier. */
  count: number;
  /** Light intensity and flash opacity multiplier. */
  glow: number;
  /** Screen-shake multiplier. */
  shake: number;
  /** Field-wide finale (ultimates and boss signatures). */
  field: boolean;
}

const TABLE: Record<FxWeight, Omit<FxIntensity, 'weight' | 'field'>> = {
  light: { scale: 0.86, count: 0.8, glow: 0.85, shake: 0.8 },
  standard: { scale: 1, count: 1, glow: 1, shake: 1 },
  strong: { scale: 1.16, count: 1.3, glow: 1.2, shake: 1.15 },
  heavy: { scale: 1.32, count: 1.6, glow: 1.45, shake: 1.3 },
  major: { scale: 1.45, count: 1.9, glow: 1.65, shake: 1.42 },
  ultimate: { scale: 1.5, count: 2.1, glow: 1.85, shake: 1.5 },
};

export function fxIntensity(power?: { ap?: number; ultimate?: boolean }): FxIntensity {
  let weight: FxWeight = 'standard';
  if (power?.ultimate) weight = 'ultimate';
  else if (typeof power?.ap === 'number' && Number.isFinite(power.ap)) {
    const ap = power.ap;
    weight = ap <= 1 ? 'light' : ap <= 2 ? 'standard' : ap <= 3 ? 'strong' : ap <= 4 ? 'heavy' : 'major';
  }
  return { weight, ...TABLE[weight], field: weight === 'ultimate' };
}

const SIZE_KEYS = ['size', 'radius', 'height', 'width'] as const;
const COUNT_KEYS = ['count'] as const;

/** Scales one step's parameters (never its timing). */
export function scaleStep(step: FxStep, intensity: FxIntensity): FxStep {
  if (intensity.weight === 'standard' || !step.p) return step;
  const p = { ...step.p };
  const num = (key: string) => (typeof p[key] === 'number' ? (p[key] as number) : undefined);
  switch (step.kind) {
    case 'shake': {
      const m = num('magnitude');
      if (m !== undefined) p.magnitude = Math.min(0.78, m * intensity.shake);
      break;
    }
    case 'flash': {
      const o = num('opacity');
      if (o !== undefined) p.opacity = Math.min(0.34, o * intensity.glow);
      break;
    }
    case 'light': {
      const i = num('intensity'), d = num('distance');
      if (i !== undefined) p.intensity = i * intensity.glow;
      if (d !== undefined) p.distance = d * Math.sqrt(intensity.scale);
      break;
    }
    case 'sfx': {
      const v = num('volume') ?? 1;
      p.volume = Math.min(1.6, v * (0.85 + intensity.scale * 0.15));
      break;
    }
    case 'slowmo': case 'speedLines': case 'punch': break;
    default:
      for (const key of SIZE_KEYS) {
        const v = num(key);
        if (v === undefined) continue;
        // per-cell eruptions keep a cell's footprint (the zone stays exact) and grow in height only
        p[key] = step.cells && key !== 'height' ? v : v * intensity.scale;
      }
      for (const key of COUNT_KEYS) { const v = num(key); if (v !== undefined) p[key] = Math.round(v * (step.kind === 'shards' ? Math.sqrt(intensity.count) : intensity.count)); }
      if (step.kind === 'burst') { const v = num('speed'); if (v !== undefined) p.speed = v * Math.sqrt(intensity.scale); }
      // the pulse marks the most powerful skills only
      if (step.kind === 'circle' && intensity.weight === 'ultimate') p.pulse = true;
  }
  return { ...step, p };
}

/**
 * Extra layers stacked on the impact of 3+ AP actions, so cost reads at a
 * glance even when two skills share a recipe family. `at` is the impact time.
 */
export function apAccentSteps(at: number, element: FxElement, intensity: FxIntensity, area: boolean): FxStep[] {
  const w = intensity.weight;
  if (w === 'light' || w === 'standard' || w === 'ultimate') return [];
  const ground: FxAnchor = area ? 'point' : 'targetGround';
  const chest: FxAnchor = area ? 'point' : 'targetChest';
  const steps: FxStep[] = [
    { at, kind: 'ring', anchor: ground, element, p: { radius: area ? 2.6 : 2.0, duration: 0.5, from: 0.25 } },
    { at, kind: 'burst', anchor: chest, element, p: { count: 18, speed: 3.4, up: 1.6, size: 0.1 } },
  ];
  if (w === 'heavy' || w === 'major') {
    steps.push(
      { at: at + 0.08, kind: 'ring', anchor: ground, element, p: { radius: area ? 3.6 : 2.9, duration: 0.6 } },
      { at, kind: 'pillar', anchor: ground, element, p: { radius: 0.4, height: 4.5, duration: 0.45 } },
      { at, kind: 'slowmo', p: { scale: 0.55, duration: 0.12 } },
      { at, kind: 'sfx', p: { id: 'impact_heavy', volume: 0.9 } },
    );
  }
  if (w === 'major') {
    steps.push(
      { at: at + 0.14, kind: 'ring', anchor: ground, element, p: { radius: area ? 4.8 : 3.8, duration: 0.75 } },
      { at, kind: 'flash', element, p: { opacity: 0.1 } },
      { at, kind: 'motes', anchor: ground, element, p: { count: 30, radius: area ? 1.8 : 1.1, rise: 2.6 } },
    );
  }
  return steps;
}

export interface FxField {
  /** Platform centre on the ground. */
  center: { x: number; y: number; z: number };
  /** Every cell centre of the battle grid, on the ground. */
  cells: ReadonlyArray<{ x: number; y: number; z: number }>;
  halfWidth: number;
  halfDepth: number;
  /** Edge of one grid cell (world units). */
  tile?: number;
}

/** One cell-level beat of a field finale: what erupts on that cell. */
export type FieldBeat = 'flame' | 'pillar' | 'bolt' | 'shards' | 'orb' | 'burst' | 'slash' | 'arrows' | 'blast';

/** The signature eruption of an element when an ultimate floods the field. */
export function fieldBeatFor(element: FxElement): FieldBeat {
  switch (element) {
    case 'fire': return 'flame';
    case 'holy': case 'heal': case 'gold': return 'pillar';
    case 'lightning': return 'bolt';
    case 'earth': case 'blunt': case 'ice': case 'nature': return 'shards';
    case 'shadow': case 'arcane': case 'poison': case 'blood': return 'orb';
    case 'wind': case 'steel': return 'slash';
    default: return 'burst';
  }
}

/**
 * Deterministic subset of the grid for the cell beats: every other cell by
 * distance from the impact (so the whole field is covered evenly), each
 * delayed by its distance so the eruption rolls across the battlefield.
 */
export function fieldWaveCells<T extends { x: number; z: number }>(cells: readonly T[], origin: { x: number; z: number }, max = 16): Array<{ cell: T; delay: number }> {
  const sorted = cells
    .map((cell, i) => ({ cell, i, d: Math.hypot(cell.x - origin.x, cell.z - origin.z) }))
    .sort((a, b) => a.d - b.d || a.i - b.i);
  const step = Math.max(1, Math.round(sorted.length / max));
  return sorted.filter((_, k) => k % step === 0).slice(0, max).map(({ cell, d }) => ({ cell, delay: d * 0.045 }));
}

import { elementForTags, type FxElement } from './fxPalettes';
import type { FieldBeat } from './fxIntensity';

/**
 * Declarative combat FX recipes. A recipe is a timeline of primitive steps
 * placed on anchors (actor, target, AoE centre, sky…). Gameplay is resolved
 * at `impactAt`; when a recipe launches a projectile, steps flagged
 * `afterHit` and the impact itself are shifted by the flight time.
 *
 * Every VFX preset id used by the combat runtime resolves to a recipe here:
 * explicit entries first, then a family chosen from the preset tags.
 */
export type FxAnchor = 'source' | 'sourceChest' | 'sourceGround' | 'target' | 'targetChest' | 'targetGround' | 'point' | 'pointSky' | 'sky';

export type FxStepKind =
  | 'slash' | 'star' | 'burst' | 'ring' | 'circle' | 'pillar' | 'streak' | 'bolt' | 'shards' | 'dome' | 'orb'
  | 'flame' | 'motes' | 'smoke' | 'glow' | 'decal' | 'light' | 'sheet' | 'pulse'
  | 'shake' | 'flash' | 'sfx' | 'slowmo' | 'speedLines' | 'punch';

export interface FxStep {
  at: number;
  kind: FxStepKind;
  anchor?: FxAnchor;
  /** Second anchor for streaks and bolts. */
  to?: FxAnchor;
  /** Repeat on every affected unit (otherwise the first target). */
  each?: boolean;
  /** Repeat on every AoE cell (flames, pillars, shards). */
  cells?: boolean;
  /** Starts after the projectile lands. */
  afterHit?: boolean;
  element?: FxElement;
  p?: Record<string, number | string | boolean>;
}

export interface FxProjectile {
  at: number;
  from: FxAnchor;
  to: FxAnchor;
  element?: FxElement;
  speed?: number;
  size?: number;
  arc?: number;
  streak?: boolean;
  sfx?: string;
}

export interface FxRecipe {
  id: string;
  element: FxElement;
  /**
   * Seconds from start until gameplay resolves. With a projectile it is the
   * offset after the projectile lands (see recipeImpactTime).
   */
  impactAt: number;
  duration: number;
  steps: FxStep[];
  projectile?: FxProjectile;
  /** Ultimate / boss signature: spotlight-grade punctuation. */
  cinematic?: boolean;
  /** Eruption of the field-wide finale when the element's default does not fit (see fieldBeatFor). */
  fieldBeat?: FieldBeat;
  /**
   * Magic school: only magic actions draw rune seals (charge, AoE, field
   * finale). Martial actions never do. Inferred from the steps when absent.
   */
  magic?: boolean;
}

type Steps = FxStep[];
const s = (at: number, kind: FxStepKind, anchor?: FxAnchor, p?: FxStep['p'], extra: Partial<FxStep> = {}): FxStep => ({ at, kind, anchor, p, ...extra });

// ------------------------------------------------------------ families

function hitFeedback(at: number, element: FxElement, weight: number, extra: Partial<FxStep> = {}): Steps {
  return [
    s(at, 'star', 'targetChest', { size: 1.1 + weight * 0.5 }, { element, ...extra }),
    s(at, 'burst', 'targetChest', { count: 14 + weight * 10, speed: 3 + weight, size: 0.09 + weight * 0.02 }, { element, ...extra }),
    s(at, 'light', 'targetChest', { intensity: 10 + weight * 6, duration: 0.35 + weight * 0.1 }, { element, ...extra }),
    s(at, 'shake', undefined, { magnitude: 0.12 + weight * 0.1, duration: 0.14 + weight * 0.06 }, extra),
  ];
}

function slashFamily(id: string, element: FxElement, weight = 1, sfx = 'slash', cuts = 1): FxRecipe {
  const steps: Steps = [s(0, 'sfx', undefined, { id: sfx })];
  for (let i = 0; i < cuts; i++) {
    steps.push(s(0.02 + i * 0.09, 'slash', 'targetChest', { size: 2.4 + weight * 0.6, angle: i % 2 ? 0.75 : -0.5, flip: i % 2 === 1, duration: 0.26 + weight * 0.05 }, { element }));
  }
  steps.push(...hitFeedback(0.09 + (cuts - 1) * 0.09, element, weight));
  steps.push(s(0.1, 'sfx', undefined, { id: 'hit' }));
  return { id, element, impactAt: 0.1 + (cuts - 1) * 0.09, duration: 0.55 + cuts * 0.1, steps };
}

function bluntFamily(id: string, element: FxElement, weight = 1.2): FxRecipe {
  return {
    id, element, impactAt: 0.06, duration: 0.7,
    steps: [
      s(0, 'sfx', undefined, { id: 'blunt' }),
      s(0.04, 'ring', 'targetGround', { radius: 1.3 + weight * 0.3, duration: 0.4 }, { element }),
      s(0.04, 'burst', 'targetGround', { count: 16, speed: 2.4, up: 2.6, gravity: 7, size: 0.1 }, { element: 'earth' }),
      ...hitFeedback(0.05, element, weight),
    ],
  };
}

function thrustFamily(id: string, element: FxElement, weight = 1): FxRecipe {
  return {
    id, element, impactAt: 0.08, duration: 0.6,
    steps: [
      s(0, 'sfx', undefined, { id: 'thrust' }),
      s(0.02, 'streak', 'sourceChest', { width: 0.32 + weight * 0.1, duration: 0.22 }, { to: 'targetChest', element }),
      ...hitFeedback(0.08, element, weight),
    ],
  };
}

function arrowFamily(id: string, element: FxElement = 'steel', weight = 0.8): FxRecipe {
  return {
    id, element, impactAt: 0.02, duration: 0.7,
    projectile: { at: 0.02, from: 'sourceChest', to: 'targetChest', element, speed: 24, size: 0.9, arc: 0.25, streak: true, sfx: 'bow' },
    steps: [...hitFeedback(0, element, weight, { afterHit: true }), s(0, 'sfx', undefined, { id: 'arrow_hit' }, { afterHit: true })],
  };
}

function explosion(at: number, element: FxElement, scale: number, anchor: FxAnchor = 'targetChest', extra: Partial<FxStep> = {}): Steps {
  return [
    s(at, 'orb', anchor, { radius: 0.9 * scale, duration: 0.45 }, { element, ...extra }),
    s(at, 'star', anchor, { size: 1.6 * scale }, { element, ...extra }),
    s(at, 'ring', 'targetGround', { radius: 1.6 * scale, duration: 0.5 }, { element, ...extra }),
    s(at, 'burst', anchor, { count: Math.round(26 * scale), speed: 4.2 * scale, size: 0.11 }, { element, ...extra }),
    s(at + 0.05, 'smoke', anchor, { count: Math.round(10 * scale) }, extra),
    s(at, 'light', anchor, { intensity: 22 * scale, duration: 0.6 }, { element, ...extra }),
    s(at, 'decal', 'targetGround', { radius: 0.9 * scale }, { element, ...extra }),
    s(at, 'shake', undefined, { magnitude: 0.22 * scale, duration: 0.24 }, extra),
    s(at, 'flash', undefined, { opacity: 0.08 * scale }, { element, ...extra }),
    s(at, 'sfx', undefined, { id: element === 'fire' ? 'explosion' : 'magic_hit' }, extra),
  ];
}

function boltFamily(id: string, element: FxElement, scale = 1, seal = true): FxRecipe {
  return {
    id, element, impactAt: 0.02, duration: 1.1,
    projectile: { at: 0.32, from: 'sourceChest', to: 'targetChest', element, speed: 13, size: 0.75 * scale, arc: 0.5, sfx: 'whoosh' },
    steps: [
      s(0, 'sfx', undefined, { id: 'cast' }),
      ...(seal ? [s(0, 'circle', 'sourceGround', { radius: 0.9, duration: 0.6 }, { element })] : []),
      s(0.02, 'glow', 'sourceChest', { size: 1.4, duration: 0.42 }, { element }),
      s(0.05, 'motes', 'source', { count: 14, radius: 0.5 }, { element }),
      ...explosion(0, element, 0.85 * scale, 'targetChest', { afterHit: true }),
    ],
  };
}

function lightningFamily(id: string, element: FxElement = 'lightning'): FxRecipe {
  return {
    id, element, impactAt: 0.34, duration: 0.9,
    steps: [
      s(0, 'sfx', undefined, { id: 'cast' }),
      s(0, 'circle', 'sourceGround', { radius: 0.9, duration: 0.55 }, { element }),
      s(0.3, 'bolt', 'targetChest', { duration: 0.35 }, { element: 'lightning', each: true }),
      s(0.3, 'sfx', undefined, { id: 'thunder' }),
      s(0.32, 'flash', undefined, { opacity: 0.16 }, { element: 'lightning' }),
      ...hitFeedback(0.34, element, 1.2, { each: true }),
      s(0.34, 'ring', 'targetGround', { radius: 1.4 }, { element, each: true }),
    ],
  };
}

function areaFireFamily(id: string, scale = 1, cinematic = false): FxRecipe {
  return {
    id, element: 'fire', impactAt: 0.42, duration: 1.5, cinematic,
    steps: [
      s(0, 'sfx', undefined, { id: 'cast' }),
      s(0, 'circle', 'point', { radius: 1.6 * scale, duration: 1.1 }, { element: 'fire' }),
      s(0.1, 'motes', 'point', { count: 20, radius: 1.2 * scale }, { element: 'fire' }),
      s(0.36, 'sfx', undefined, { id: 'fire_burst' }),
      s(0.38, 'flame', 'targetGround', { width: 1.05, height: 2.6 * scale, duration: 1.0 }, { cells: true }),
      s(0.4, 'ring', 'point', { radius: 2.4 * scale, duration: 0.6 }, { element: 'fire' }),
      s(0.42, 'burst', 'targetChest', { count: 22, speed: 3.2, size: 0.1 }, { element: 'fire', each: true }),
      s(0.42, 'light', 'point', { intensity: 26 * scale, duration: 1.0, distance: 11 }, { element: 'fire' }),
      s(0.42, 'shake', undefined, { magnitude: 0.24 * scale, duration: 0.3 }),
      s(0.5, 'smoke', 'point', { count: 14, spread: 1.2 }),
      s(0.5, 'decal', 'point', { radius: 1.4 * scale }, { element: 'fire' }),
    ],
  };
}

function breathFamily(id: string, element: FxElement = 'fire', cinematic = false): FxRecipe {
  const steps: Steps = [s(0, 'sfx', undefined, { id: 'breath' })];
  for (let i = 0; i < 6; i++) steps.push(s(0.05 + i * 0.07, 'burst', 'sourceChest', { count: 18, speed: 9, cone: 0.5, life: 0.55, size: 0.16, spray: 'target' }, { element }));
  steps.push(s(0.3, 'flame', 'targetGround', { width: 1.0, height: 2, duration: 0.8 }, { cells: true }));
  steps.push(...hitFeedback(0.38, element, 1.2, { each: true }));
  steps.push(s(0.38, 'light', 'point', { intensity: 24, duration: 0.8 }, { element }));
  return { id, element, impactAt: 0.38, duration: 1.2, steps, cinematic };
}

function holyFamily(id: string, element: FxElement = 'holy', scale = 1, cinematic = false): FxRecipe {
  return {
    id, element, impactAt: 0.42, duration: 1.3, cinematic,
    steps: [
      s(0, 'sfx', undefined, { id: 'holy_charge' }),
      s(0, 'circle', 'targetGround', { radius: 1.2 * scale, duration: 1.1 }, { element, each: true }),
      s(0.36, 'pillar', 'targetGround', { radius: 0.6 * scale, duration: 0.85 }, { element, each: true }),
      s(0.38, 'sfx', undefined, { id: 'holy' }),
      s(0.4, 'ring', 'targetGround', { radius: 1.8 * scale }, { element, each: true }),
      s(0.42, 'motes', 'target', { count: 22, radius: 0.6 }, { element, each: true }),
      s(0.42, 'star', 'targetChest', { size: 1.6 * scale }, { element, each: true }),
      s(0.42, 'light', 'targetChest', { intensity: 20 * scale, duration: 0.8 }, { element }),
      s(0.42, 'flash', undefined, { opacity: 0.08 * scale }, { element }),
      s(0.42, 'shake', undefined, { magnitude: 0.12 * scale, duration: 0.2 }),
    ],
  };
}

function healFamily(id: string, element: FxElement = 'heal', scale = 1): FxRecipe {
  return {
    id, element, impactAt: 0.34, duration: 1.3,
    steps: [
      s(0, 'sfx', undefined, { id: 'heal' }),
      s(0, 'circle', 'targetGround', { radius: 1.0 * scale, duration: 1.2, spin: 0.8 }, { element, each: true }),
      s(0.1, 'glow', 'targetChest', { size: 2.2 * scale, duration: 0.9 }, { element, each: true }),
      s(0.15, 'motes', 'target', { count: 26, radius: 0.55, rise: 2.4 }, { element, each: true }),
      s(0.3, 'ring', 'targetGround', { radius: 1.3 * scale, duration: 0.6 }, { element, each: true }),
      s(0.3, 'light', 'targetChest', { intensity: 12, duration: 0.9 }, { element }),
    ],
  };
}

function barrierFamily(id: string, element: FxElement = 'holy', scale = 1): FxRecipe {
  return {
    id, element, impactAt: 0.3, duration: 1.3,
    steps: [
      s(0, 'sfx', undefined, { id: 'shield' }),
      s(0, 'circle', 'targetGround', { radius: 1.1 * scale, duration: 1.1 }, { element, each: true }),
      s(0.2, 'dome', 'targetGround', { radius: 1.05 * scale, duration: 1.05 }, { element, each: true }),
      s(0.28, 'ring', 'targetGround', { radius: 1.5 * scale }, { element, each: true }),
      s(0.3, 'motes', 'target', { count: 14, radius: 0.7 }, { element, each: true }),
      s(0.3, 'light', 'targetChest', { intensity: 10, duration: 0.8 }, { element }),
    ],
  };
}

function curseFamily(id: string, element: FxElement = 'shadow', scale = 1): FxRecipe {
  return {
    id, element, impactAt: 0.4, duration: 1.2,
    steps: [
      s(0, 'sfx', undefined, { id: 'curse' }),
      s(0, 'circle', 'targetGround', { radius: 1.1 * scale, duration: 1.1, spin: -1.6 }, { element, each: true }),
      s(0.05, 'orb', 'targetChest', { radius: 1.2 * scale, duration: 0.45, implode: true, dark: true }, { element, each: true }),
      s(0.1, 'motes', 'target', { count: 18, radius: 0.7, sink: true }, { element, each: true }),
      s(0.4, 'ring', 'targetGround', { radius: 1.5 * scale }, { element, each: true }),
      s(0.4, 'star', 'targetChest', { size: 1.2 }, { element, each: true }),
      s(0.4, 'light', 'targetChest', { intensity: 12, duration: 0.6 }, { element }),
      s(0.4, 'shake', undefined, { magnitude: 0.1, duration: 0.18 }),
    ],
  };
}

function poisonFamily(id: string): FxRecipe {
  return {
    id, element: 'poison', impactAt: 0.1, duration: 0.9,
    steps: [
      s(0, 'sfx', undefined, { id: 'bite' }),
      s(0.02, 'slash', 'targetChest', { size: 1.4, angle: 1.2, duration: 0.22 }, { element: 'poison' }),
      s(0.06, 'slash', 'targetChest', { size: 1.4, angle: -1.9, flip: true, duration: 0.22 }, { element: 'poison' }),
      ...hitFeedback(0.1, 'poison', 0.8),
      s(0.12, 'burst', 'targetChest', { count: 16, speed: 1.2, up: 1.8, gravity: -0.6, soft: true, size: 0.13, life: 0.9 }, { element: 'poison' }),
      s(0.14, 'sfx', undefined, { id: 'poison' }),
    ],
  };
}

function iceFamily(id: string, scale = 1, cinematic = false): FxRecipe {
  return {
    id, element: 'ice', impactAt: 0.36, duration: 1.2, cinematic,
    steps: [
      s(0, 'sfx', undefined, { id: 'cast' }),
      s(0, 'circle', 'targetGround', { radius: 1.1 * scale, duration: 0.9 }, { element: 'ice', each: true }),
      s(0.3, 'shards', 'targetGround', { count: 7, radius: 0.75 * scale, height: 1.5 * scale, duration: 0.95 }, { element: 'ice', each: true }),
      s(0.32, 'sfx', undefined, { id: 'ice' }),
      s(0.34, 'ring', 'targetGround', { radius: 1.6 * scale }, { element: 'ice', each: true }),
      ...hitFeedback(0.36, 'ice', 1, { each: true }),
      s(0.4, 'motes', 'target', { count: 16, radius: 0.8, rise: 0.8 }, { element: 'ice', each: true }),
    ],
  };
}

function rootFamily(id: string, element: FxElement = 'nature'): FxRecipe {
  return {
    id, element, impactAt: 0.3, duration: 1.1,
    steps: [
      s(0, 'sfx', undefined, { id: 'earth' }),
      s(0, 'circle', 'targetGround', { radius: 1.0, duration: 0.9 }, { element, each: true }),
      s(0.22, 'shards', 'targetGround', { count: 8, radius: 0.7, height: 1.1, duration: 0.9 }, { element, each: true }),
      s(0.28, 'burst', 'targetGround', { count: 14, speed: 2, up: 2.4, gravity: 6 }, { element: 'earth', each: true }),
      ...hitFeedback(0.3, element, 0.8, { each: true }),
    ],
  };
}

function windFamily(id: string, element: FxElement = 'wind', cinematic = false): FxRecipe {
  const steps: Steps = [s(0, 'sfx', undefined, { id: 'wind' })];
  for (let i = 0; i < 4; i++) steps.push(s(0.04 + i * 0.07, 'slash', 'sourceChest', { size: 3.2, angle: i * 1.57, duration: 0.3, flip: i % 2 === 1 }, { element }));
  steps.push(s(0.1, 'ring', 'sourceGround', { radius: 2.6, duration: 0.5 }, { element }));
  steps.push(s(0.1, 'burst', 'sourceChest', { count: 24, speed: 4, up: 0.6 }, { element }));
  steps.push(...hitFeedback(0.26, element === 'wind' ? 'steel' : element, 1, { each: true }));
  return { id, element, impactAt: 0.26, duration: 0.8, steps, cinematic };
}

function quakeFamily(id: string, scale = 1, cinematic = false): FxRecipe {
  return {
    id, element: 'earth', impactAt: 0.16, duration: 1.1, cinematic,
    steps: [
      s(0, 'sfx', undefined, { id: 'quake' }),
      s(0.12, 'ring', 'point', { radius: 3 * scale, duration: 0.6 }, { element: 'earth' }),
      s(0.2, 'ring', 'point', { radius: 4.2 * scale, duration: 0.7 }, { element: 'blunt' }),
      s(0.14, 'burst', 'point', { count: 40, speed: 3.6, up: 4.5, gravity: 10, size: 0.16, spread: 1.2 }, { element: 'earth' }),
      s(0.14, 'shards', 'targetGround', { count: 5, radius: 0.6, height: 0.8, duration: 0.7 }, { element: 'earth', each: true }),
      s(0.16, 'star', 'targetChest', { size: 1.4 }, { element: 'blunt', each: true }),
      s(0.16, 'smoke', 'point', { count: 18, spread: 1.6, size: 0.7 }),
      s(0.16, 'decal', 'point', { radius: 2 * scale }, { element: 'earth' }),
      s(0.16, 'shake', undefined, { magnitude: 0.5 * scale, duration: 0.45 }),
      s(0.16, 'light', 'point', { intensity: 16, duration: 0.5 }, { element: 'blunt' }),
    ],
  };
}

function moveFamily(id: string, element: FxElement = 'smoke'): FxRecipe {
  return {
    id, element, impactAt: 0.1, duration: 0.9,
    steps: [
      s(0, 'sfx', undefined, { id: 'teleport' }),
      s(0, 'smoke', 'source', { count: 16, spread: 0.5 }),
      s(0, 'burst', 'sourceChest', { count: 18, speed: 2.2, soft: true }, { element: element === 'smoke' ? 'arcane' : element }),
      s(0.1, 'ring', 'targetGround', { radius: 1.2 }, { element: element === 'smoke' ? 'arcane' : element }),
    ],
  };
}

function leapFamily(id: string): FxRecipe {
  return {
    id, element: 'earth', impactAt: 0.05, duration: 0.8,
    steps: [
      s(0, 'sfx', undefined, { id: 'land' }),
      s(0, 'ring', 'targetGround', { radius: 1.8 }, { element: 'blunt' }),
      s(0, 'burst', 'targetGround', { count: 20, speed: 2.6, up: 1.4, gravity: 6, size: 0.14, soft: true }, { element: 'earth' }),
      s(0, 'shake', undefined, { magnitude: 0.2, duration: 0.2 }),
    ],
  };
}

function arcaneFamily(id: string, scale = 1): FxRecipe {
  return {
    id, element: 'arcane', impactAt: 0.34, duration: 1.1,
    steps: [
      s(0, 'sfx', undefined, { id: 'cast' }),
      s(0, 'circle', 'targetGround', { radius: 1.2 * scale, duration: 1.0, spin: 2.2 }, { element: 'arcane', each: true }),
      s(0.05, 'motes', 'target', { count: 18, radius: 0.9, rise: 1.4 }, { element: 'arcane', each: true }),
      s(0.3, 'orb', 'targetChest', { radius: 0.9 * scale, duration: 0.4 }, { element: 'arcane', each: true }),
      s(0.32, 'sfx', undefined, { id: 'magic_hit' }),
      ...hitFeedback(0.34, 'arcane', 1, { each: true }),
      s(0.34, 'ring', 'targetGround', { radius: 1.6 * scale }, { element: 'arcane', each: true }),
    ],
  };
}

// ------------------------------------------------------------ ultimates & signatures

/**
 * Ultimate / signature build-up. Magic: a pulsing rune seal under the caster.
 * Martial: no seal; a battle aura (heartbeat shock rings, dust kicked up,
 * rising motes) so a sword or bow ultimate never borrows a spell's identity.
 */
function charge(element: FxElement, length = 0.6, magic = true): Steps {
  if (!magic) return [
    s(0, 'sfx', undefined, { id: 'ultimate_charge' }),
    s(0, 'pulse', 'sourceGround', { radius: 2.3, duration: length + 0.45 }, { element }),
    s(0, 'glow', 'sourceChest', { size: 2.3, duration: length + 0.2 }, { element }),
    s(0.02, 'burst', 'sourceGround', { count: 22, speed: 2.6, up: 0.8, gravity: 3, size: 0.13, soft: true }, { element: 'earth' }),
    s(0.05, 'motes', 'source', { count: 34, radius: 0.7, rise: 3.6 }, { element }),
    s(0.1, 'speedLines', undefined, { duration: length + 0.4 }, { element }),
    s(length * 0.8, 'ring', 'sourceGround', { radius: 2.6, duration: 0.4 }, { element }),
  ];
  return [
    s(0, 'sfx', undefined, { id: 'ultimate_charge' }),
    s(0, 'circle', 'sourceGround', { radius: 1.6, duration: length + 0.5, spin: 2.4 }, { element }),
    s(0, 'glow', 'sourceChest', { size: 2.6, duration: length + 0.2 }, { element }),
    s(0.05, 'motes', 'source', { count: 30, radius: 0.9, rise: 3 }, { element }),
    s(0.1, 'speedLines', undefined, { duration: length + 0.4 }, { element }),
    s(length * 0.8, 'ring', 'sourceGround', { radius: 2.4, duration: 0.4 }, { element }),
  ];
}

/** Generated-art layer (tools/openai-art FX sheets); skipped while the sheet is absent. */
const SHEET_FOR: Partial<Record<FxElement, string>> = {
  gold: 'lion_slash', holy: 'holy_pillar', shadow: 'void_implosion', fire: 'meteor_impact',
  ice: 'ice_burst', arcane: 'arcane_sigil', heal: 'heal_bloom', lightning: 'lightning_strike',
};

function cinematicHit(at: number, element: FxElement, scale = 1.3): Steps {
  const sheet = SHEET_FOR[element];
  return [
    ...(sheet ? [s(at, 'sheet', 'targetChest', { id: sheet, size: 4.6 * scale, duration: 0.9 })] : []),
    s(at, 'slowmo', undefined, { scale: 0.3, duration: 0.32 }),
    s(at, 'punch', 'targetChest', { duration: 0.5 }),
    s(at, 'flash', undefined, { opacity: 0.22 }, { element }),
    s(at, 'shake', undefined, { magnitude: 0.42 * scale, duration: 0.42 }),
    s(at, 'light', 'targetChest', { intensity: 34 * scale, duration: 1.0, distance: 13 }, { element }),
  ];
}

const ULTIMATES: Record<string, () => FxRecipe> = {
  ultimate_lion_surge: () => ({
    id: 'ultimate_lion_surge', element: 'gold', impactAt: 0.95, duration: 2.0, cinematic: true,
    steps: [
      ...charge('gold', 0.6, false),
      s(0.7, 'sfx', undefined, { id: 'dash' }),
      s(0.72, 'streak', 'sourceChest', { width: 0.8, duration: 0.35 }, { to: 'targetChest', element: 'gold' }),
      s(0.82, 'slash', 'targetChest', { size: 3.4, angle: -0.6, duration: 0.3 }, { element: 'gold' }),
      s(0.88, 'slash', 'targetChest', { size: 3.4, angle: 0.8, flip: true, duration: 0.3 }, { element: 'gold' }),
      s(0.94, 'slash', 'targetChest', { size: 4, angle: 0.05, duration: 0.32 }, { element: 'steel' }),
      s(0.95, 'sfx', undefined, { id: 'ultimate_hit' }),
      ...cinematicHit(0.95, 'gold', 1.4),
      ...explosion(0.98, 'gold', 1.5),
      s(1.0, 'pillar', 'targetGround', { radius: 1.1, duration: 0.9 }, { element: 'gold' }),
    ],
  }),
  ultimate_radiant_judgement: () => ({
    id: 'ultimate_radiant_judgement', element: 'holy', impactAt: 1.05, duration: 2.2, cinematic: true,
    steps: [
      ...charge('holy', 0.7),
      s(0.6, 'circle', 'point', { radius: 3.2, duration: 1.4, spin: 0.9 }, { element: 'holy' }),
      s(0.9, 'pillar', 'targetGround', { radius: 0.9, duration: 1.0 }, { element: 'holy', each: true }),
      s(0.95, 'pillar', 'point', { radius: 1.6, height: 12, duration: 1.1 }, { element: 'holy' }),
      s(1.0, 'sfx', undefined, { id: 'holy' }),
      s(1.05, 'sfx', undefined, { id: 'ultimate_hit' }),
      ...cinematicHit(1.05, 'holy', 1.4),
      s(1.05, 'star', 'targetChest', { size: 2.6 }, { element: 'holy', each: true }),
      s(1.05, 'ring', 'point', { radius: 4.6, duration: 0.8 }, { element: 'holy' }),
      s(1.1, 'motes', 'point', { count: 40, radius: 2.2, rise: 3.2 }, { element: 'holy' }),
    ],
  }),
  ultimate_devouring_eclipse: () => ({
    id: 'ultimate_devouring_eclipse', element: 'shadow', impactAt: 1.25, duration: 2.4, cinematic: true,
    steps: [
      ...charge('shadow', 0.6),
      s(0.5, 'orb', 'pointSky', { radius: 2.6, duration: 0.8, dark: true }, { element: 'shadow' }),
      s(0.5, 'sfx', undefined, { id: 'void' }),
      s(0.6, 'circle', 'point', { radius: 3.2, duration: 1.6, spin: -1.8 }, { element: 'shadow' }),
      s(0.7, 'motes', 'point', { count: 40, radius: 2.4, sink: true }, { element: 'shadow' }),
      s(1.1, 'orb', 'point', { radius: 3.4, duration: 0.35, implode: true, dark: true }, { element: 'shadow' }),
      s(1.15, 'bolt', 'targetChest', { duration: 0.3 }, { element: 'shadow', each: true }),
      s(1.25, 'sfx', undefined, { id: 'ultimate_hit' }),
      ...cinematicHit(1.25, 'shadow', 1.5),
      ...explosion(1.25, 'shadow', 1.6, 'targetChest', { each: true }),
      s(1.3, 'ring', 'point', { radius: 5, duration: 0.8 }, { element: 'shadow' }),
    ],
  }),
  ultimate_firmament_lance: () => ({
    id: 'ultimate_firmament_lance', element: 'lightning', impactAt: 1.0, duration: 2.0, cinematic: true,
    steps: [
      ...charge('lightning', 0.6, false),
      s(0.75, 'pillar', 'targetGround', { radius: 0.7, height: 14, duration: 0.8 }, { element: 'lightning' }),
      s(0.9, 'bolt', 'targetChest', { duration: 0.4, width: 0.12 }, { element: 'lightning' }),
      s(0.95, 'sfx', undefined, { id: 'thunder' }),
      s(1.0, 'sfx', undefined, { id: 'ultimate_hit' }),
      ...cinematicHit(1.0, 'lightning', 1.4),
      ...explosion(1.0, 'lightning', 1.3),
      s(1.0, 'shards', 'targetGround', { count: 6, radius: 0.9, height: 1.6 }, { element: 'ice' }),
    ],
  }),
  ultimate_dark_meteor: () => ({
    id: 'ultimate_dark_meteor', element: 'fire', impactAt: 0.02, duration: 2.2, cinematic: true,
    projectile: { at: 0.8, from: 'sky', to: 'point', element: 'fire', speed: 16, size: 2.4, arc: 0, sfx: 'meteor' },
    steps: [
      ...charge('shadow', 0.7),
      s(0.6, 'circle', 'point', { radius: 2.8, duration: 1.4, spin: -1.2 }, { element: 'fire' }),
      s(0, 'sfx', undefined, { id: 'ultimate_hit' }, { afterHit: true }),
      ...cinematicHit(0, 'fire', 1.6).map((step) => ({ ...step, afterHit: true })),
      ...explosion(0, 'fire', 2, 'point', { afterHit: true }),
      s(0.05, 'flame', 'targetGround', { width: 1.05, height: 3, duration: 1.1 }, { cells: true, afterHit: true }),
      s(0.1, 'ring', 'point', { radius: 5.2, duration: 0.9 }, { element: 'shadow', afterHit: true }),
    ],
  }),
  ultimate_miracle: () => ({
    id: 'ultimate_miracle', element: 'holy', impactAt: 1.0, duration: 2.2, cinematic: true,
    steps: [
      ...charge('holy', 0.7),
      s(0.7, 'pillar', 'targetGround', { radius: 1.1, height: 14, duration: 1.3 }, { element: 'holy', each: true }),
      s(0.75, 'sfx', undefined, { id: 'miracle' }),
      s(0.8, 'motes', 'target', { count: 40, radius: 0.8, rise: 3 }, { element: 'holy', each: true }),
      s(0.9, 'circle', 'targetGround', { radius: 1.4, duration: 1.2 }, { element: 'heal', each: true }),
      s(1.0, 'ring', 'targetGround', { radius: 2.2 }, { element: 'holy', each: true }),
      s(1.0, 'flash', undefined, { opacity: 0.2 }, { element: 'holy' }),
      s(1.0, 'light', 'targetChest', { intensity: 30, duration: 1.2 }, { element: 'holy' }),
      s(1.0, 'slowmo', undefined, { scale: 0.45, duration: 0.3 }),
    ],
  }),
  ultimate_perfect_duality: () => ({
    id: 'ultimate_perfect_duality', element: 'arcane', impactAt: 0.95, duration: 2.0, cinematic: true, fieldBeat: 'slash',
    steps: [
      ...charge('arcane', 0.6),
      s(0.75, 'slash', 'targetChest', { size: 3.6, angle: -0.7, duration: 0.32 }, { element: 'holy' }),
      s(0.82, 'slash', 'targetChest', { size: 3.6, angle: 0.7, flip: true, duration: 0.32 }, { element: 'shadow' }),
      s(0.9, 'ring', 'targetGround', { radius: 2.6 }, { element: 'holy' }),
      s(0.92, 'ring', 'targetGround', { radius: 2.2 }, { element: 'shadow' }),
      s(0.95, 'sfx', undefined, { id: 'ultimate_hit' }),
      ...cinematicHit(0.95, 'arcane', 1.4),
      ...explosion(0.98, 'arcane', 1.4),
    ],
  }),
  ultimate_absolute_harmony: () => ({
    id: 'ultimate_absolute_harmony', element: 'holy', impactAt: 0.9, duration: 2.0, cinematic: true,
    steps: [
      ...charge('holy', 0.6),
      s(0.6, 'circle', 'point', { radius: 3.6, duration: 1.4, spin: 0.7 }, { element: 'arcane' }),
      s(0.75, 'dome', 'targetGround', { radius: 1.2, duration: 1.3 }, { element: 'holy', each: true }),
      s(0.8, 'motes', 'target', { count: 24, radius: 0.7 }, { element: 'heal', each: true }),
      s(0.85, 'sfx', undefined, { id: 'shield' }),
      s(0.9, 'ring', 'point', { radius: 4.4, duration: 0.8 }, { element: 'holy' }),
      s(0.9, 'flash', undefined, { opacity: 0.14 }, { element: 'holy' }),
      s(0.9, 'light', 'point', { intensity: 24, duration: 1.2 }, { element: 'holy' }),
    ],
  }),
  ultimate_zenith_arrow: () => ({
    id: 'ultimate_zenith_arrow', element: 'gold', impactAt: 1.05, duration: 2.0, cinematic: true, fieldBeat: 'arrows',
    steps: [
      ...charge('gold', 0.55, false),
      s(0.6, 'streak', 'sourceChest', { width: 0.3, duration: 0.3 }, { to: 'sky', element: 'gold' }),
      s(0.6, 'sfx', undefined, { id: 'bow' }),
      s(0.9, 'pillar', 'targetGround', { radius: 0.45, height: 16, duration: 0.6 }, { element: 'gold' }),
      s(1.0, 'streak', 'sky', { width: 0.5, duration: 0.25 }, { to: 'targetChest', element: 'steel' }),
      s(1.05, 'sfx', undefined, { id: 'ultimate_hit' }),
      ...cinematicHit(1.05, 'gold', 1.5),
      ...explosion(1.05, 'gold', 1.3),
    ],
  }),
  ultimate_silent_assassin: () => {
    const steps: Steps = [...charge('shadow', 0.5, false)];
    for (let i = 0; i < 6; i++) {
      steps.push(s(0.6 + i * 0.07, 'slash', 'targetChest', { size: 2.6, angle: (i * 1.3) % 3.1 - 1.5, flip: i % 2 === 1, duration: 0.2 }, { element: i % 2 ? 'blood' : 'shadow' }));
      steps.push(s(0.6 + i * 0.07, 'sfx', undefined, { id: 'slash', pitch: 1 + i * 0.05 }));
    }
    steps.push(s(1.05, 'sfx', undefined, { id: 'ultimate_hit' }));
    steps.push(...cinematicHit(1.05, 'blood', 1.3), ...hitFeedback(1.05, 'blood', 2));
    steps.push(s(1.08, 'burst', 'targetChest', { count: 30, speed: 2, soft: true }, { element: 'poison' }));
    return { id: 'ultimate_silent_assassin', element: 'shadow', impactAt: 1.05, duration: 1.9, cinematic: true, fieldBeat: 'slash', steps };
  },
  ultimate_fault_breaker: () => ({
    id: 'ultimate_fault_breaker', element: 'earth', impactAt: 0.95, duration: 2.0, cinematic: true,
    steps: [
      ...charge('blunt', 0.6, false),
      s(0.8, 'slash', 'targetChest', { size: 3.8, angle: 1.4, duration: 0.25 }, { element: 'blunt' }),
      s(0.95, 'sfx', undefined, { id: 'quake' }),
      s(0.95, 'sfx', undefined, { id: 'ultimate_hit' }),
      ...cinematicHit(0.95, 'blunt', 1.5),
      s(0.95, 'shards', 'targetGround', { count: 9, radius: 1.1, height: 1.6 }, { element: 'earth' }),
      s(0.95, 'ring', 'targetGround', { radius: 4, duration: 0.7 }, { element: 'earth' }),
      s(0.97, 'burst', 'targetChest', { count: 40, speed: 5, up: 3, gravity: 9, size: 0.16 }, { element: 'earth' }),
      s(1.0, 'star', 'targetChest', { size: 3 }, { element: 'steel' }),
      s(1.0, 'decal', 'targetGround', { radius: 2 }, { element: 'earth' }),
    ],
  }),
  ultimate_artillery_barrage: () => {
    const steps: Steps = [...charge('fire', 0.5, false)];
    for (let i = 0; i < 4; i++) {
      steps.push(...explosion(0.7 + i * 0.16, 'fire', 0.9, 'targetChest', { each: true }).map((step) => ({ ...step, p: { ...step.p, jitter: 0.6 } })));
    }
    steps.push(...cinematicHit(1.0, 'fire', 1.3));
    return { id: 'ultimate_artillery_barrage', element: 'fire', impactAt: 1.0, duration: 2.2, cinematic: true, fieldBeat: 'blast', steps };
  },
  boss_apocalypse_v2: () => ({ ...areaFireFamily('boss_apocalypse_v2', 1.5, true), steps: [...charge('fire', 0.5), ...areaFireFamily('x', 1.5).steps.map((step) => ({ ...step, at: step.at + 0.5 })), ...cinematicHit(0.92, 'fire')], impactAt: 0.92, duration: 2.1 }),
  boss_execution: () => ({ ...slashFamily('boss_execution', 'blood', 2.4, 'heavy_slash', 2), cinematic: true, steps: [...charge('blood', 0.5, false), ...slashFamily('x', 'blood', 2.4, 'heavy_slash', 2).steps.map((step) => ({ ...step, at: step.at + 0.55 })), ...cinematicHit(0.73, 'blood')], impactAt: 0.73, duration: 1.6 }),
  boss_flurry: () => ({ ...slashFamily('boss_flurry', 'steel', 1.6, 'slash', 5), cinematic: true }),
  boss_inferno: () => areaFireFamily('boss_inferno', 1.4, true),
  boss_titan_slam: () => quakeFamily('boss_titan_slam', 1.5, true),
};

// ------------------------------------------------------------ explicit presets

const EXPLICIT: Record<string, () => FxRecipe> = {
  ...ULTIMATES,
  generic_hit: () => slashFamily('generic_hit', 'steel', 0.6, 'hit'),
  sword_slash: () => slashFamily('sword_slash', 'steel', 1),
  blunt_impact: () => bluntFamily('blunt_impact', 'blunt'),
  thrust_line: () => thrustFamily('thrust_line', 'steel', 1.1),
  arrow_shot: () => arrowFamily('arrow_shot'),
  arrow_rain: () => {
    const steps: Steps = [s(0, 'sfx', undefined, { id: 'bow' })];
    for (let i = 0; i < 6; i++) steps.push(s(0.25 + i * 0.06, 'streak', 'sky', { width: 0.12, duration: 0.18, jitter: 1.2 }, { to: 'targetChest', element: 'steel', each: true }));
    steps.push(...hitFeedback(0.5, 'steel', 1, { each: true }), s(0.5, 'sfx', undefined, { id: 'arrow_hit' }));
    return { id: 'arrow_rain', element: 'steel', impactAt: 0.5, duration: 1.0, steps };
  },
  fireball: () => boltFamily('fireball', 'fire'),
  dark_bolt: () => boltFamily('dark_bolt', 'shadow'),
  shadow_lightning_bolt: () => lightningFamily('shadow_lightning_bolt', 'shadow'),
  heal_burst: () => healFamily('heal_burst'),
  skill_heal_bloom: () => healFamily('skill_heal_bloom', 'heal', 1.2),
  support_regen_aura: () => healFamily('support_regen_aura', 'nature'),
  bless_aura: () => barrierFamily('bless_aura', 'gold'),
  support_boost_aura: () => barrierFamily('support_boost_aura', 'gold'),
  support_holy_aura: () => holyFamily('support_holy_aura', 'holy', 0.9),
  support_revive_pillar: () => holyFamily('support_revive_pillar', 'holy', 1.1),
  guard_barrier: () => barrierFamily('guard_barrier', 'holy'),
  skill_oathwall: () => barrierFamily('skill_oathwall', 'holy', 1.2),
  skill_boss_guard: () => barrierFamily('skill_boss_guard', 'shadow', 1.4),
  curse_pulse: () => curseFamily('curse_pulse'),
  status_curse_mark: () => curseFamily('status_curse_mark', 'shadow', 0.8),
  caster_roar: () => curseFamily('caster_roar', 'blood', 1.3),
  skill_void_rune: () => curseFamily('skill_void_rune', 'shadow', 1.1),
  poison_bite: () => poisonFamily('poison_bite'),
  skill_poison_maw: () => poisonFamily('skill_poison_maw'),
  root_vines: () => rootFamily('root_vines'),
  frost_bind: () => iceFamily('frost_bind'),
  skill_ice_pillar: () => iceFamily('skill_ice_pillar', 1.3),
  boss_quake: () => quakeFamily('boss_quake', 1.2, true),
  boss_slam: () => quakeFamily('boss_slam', 1.1),
  leap_impact: () => leapFamily('leap_impact'),
  teleport_burst: () => moveFamily('teleport_burst', 'arcane'),
  move_smoke_burst: () => moveFamily('move_smoke_burst', 'smoke'),
  holy_strike: () => ({ ...slashFamily('holy_strike', 'holy', 1.2), steps: [...slashFamily('x', 'holy', 1.2).steps, s(0.1, 'pillar', 'targetGround', { radius: 0.5, duration: 0.6 }, { element: 'holy' })] }),
  skill_holy_radiance: () => holyFamily('skill_holy_radiance'),
  skill_holy_sigil: () => holyFamily('skill_holy_sigil', 'holy', 0.9),
  skill_leaf_sanctuary: () => healFamily('skill_leaf_sanctuary', 'nature', 1.2),
  skill_fire_impact: () => areaFireFamily('skill_fire_impact'),
  skill_fire_smoke: () => ({ id: 'skill_fire_smoke', element: 'fire', impactAt: 0.02, duration: 1.2, projectile: { at: 0.05, from: 'sourceChest', to: 'point', element: 'fire', speed: 11, size: 0.5, arc: 1.4, sfx: 'whoosh' }, steps: explosion(0, 'fire', 1.2, 'point', { afterHit: true }) }),
  skill_boss_inferno: () => areaFireFamily('skill_boss_inferno', 1.4),
  skill_wind_slash_swirl: () => windFamily('skill_wind_slash_swirl'),
  skill_arcane_vortex: () => arcaneFamily('skill_arcane_vortex', 1.3),
  skill_arcane_orbit: () => barrierFamily('skill_arcane_orbit', 'arcane'),
  skill_binding_sigil: () => rootFamily('skill_binding_sigil', 'arcane'),
  skill_arcane_slash_burst: () => slashFamily('skill_arcane_slash_burst', 'arcane', 1.3, 'slash', 2),
  shape_cone_blast: () => breathFamily('shape_cone_blast', 'arcane'),
  impact_explosion_large: () => ({ id: 'impact_explosion_large', element: 'fire', impactAt: 0.1, duration: 1.1, steps: explosion(0.08, 'fire', 1.6, 'point') }),
  enemy_dragon_breath: () => breathFamily('enemy_dragon_breath', 'fire'),
  critical_hit: () => ({
    id: 'critical_hit', element: 'steel', impactAt: 0, duration: 0.6,
    steps: [s(0, 'star', 'targetChest', { size: 2.8 }, { element: 'steel' }), s(0, 'ring', 'targetChest', { radius: 2, ground: false }, { element: 'gold' }), s(0, 'slowmo', undefined, { scale: 0.25, duration: 0.18 }), s(0, 'flash', undefined, { opacity: 0.16 }, { element: 'steel' }), s(0, 'shake', undefined, { magnitude: 0.34, duration: 0.24 }), s(0, 'sfx', undefined, { id: 'crit' })],
  }),
  kill_spark: () => ({
    id: 'kill_spark', element: 'gold', impactAt: 0, duration: 0.9,
    steps: [s(0, 'burst', 'targetChest', { count: 34, speed: 3.6, size: 0.12 }, { element: 'gold' }), s(0, 'ring', 'targetGround', { radius: 1.6 }, { element: 'gold' }), s(0, 'sfx', undefined, { id: 'ko' })],
  }),
  // pilot presets used by the hero skill presentations
  pilot_w_lion_surge: () => ULTIMATES.ultimate_lion_surge!(),
  pilot_d_devouring_eclipse: () => ULTIMATES.ultimate_devouring_eclipse!(),
  pilot_w_charge: () => ({
    id: 'pilot_w_charge', element: 'wind', impactAt: 0.12, duration: 0.8,
    steps: [
      s(0, 'sfx', undefined, { id: 'dash' }),
      s(0, 'streak', 'sourceChest', { width: 0.55, duration: 0.28 }, { to: 'targetChest', element: 'wind' }),
      s(0.04, 'burst', 'sourceGround', { count: 18, speed: 2.4, up: 1, size: 0.13, soft: true }, { element: 'earth' }),
      s(0.1, 'slash', 'targetChest', { size: 2.6, angle: -0.3, duration: 0.28 }, { element: 'steel' }),
      ...hitFeedback(0.12, 'steel', 1.4),
      s(0.12, 'sfx', undefined, { id: 'heavy_slash' }),
    ],
  }),
  pilot_w_whirl: () => windFamily('pilot_w_whirl', 'fire'),
  pilot_n_flame_wave: () => breathFamily('pilot_n_flame_wave', 'fire'),
  pilot_p_oathwall: () => barrierFamily('pilot_p_oathwall', 'holy', 1.3),
  pilot_ni_shadow_step: () => ({
    id: 'pilot_ni_shadow_step', element: 'shadow', impactAt: 0.18, duration: 0.9,
    steps: [...moveFamily('x', 'shadow').steps, s(0.15, 'slash', 'targetChest', { size: 2.4, angle: 0.6, duration: 0.24 }, { element: 'shadow' }), ...hitFeedback(0.18, 'shadow', 1.1), s(0.16, 'sfx', undefined, { id: 'slash' })],
  }),
  pilot_w_salvation: () => healFamily('pilot_w_salvation', 'holy', 1.1),
  pilot_w_purify: () => holyFamily('pilot_w_purify', 'holy', 0.9),
  pilot_w_sanctuary: () => healFamily('pilot_w_sanctuary', 'nature', 1.4),
  pilot_ni_smoke_bomb: () => ({
    id: 'pilot_ni_smoke_bomb', element: 'smoke', impactAt: 0.3, duration: 1.3,
    projectile: { at: 0.02, from: 'sourceChest', to: 'point', element: 'smoke', speed: 10, size: 0.4, arc: 1.2, sfx: 'throw' },
    steps: [
      s(0, 'sfx', undefined, { id: 'teleport' }, { afterHit: true }),
      s(0, 'smoke', 'point', { count: 30, spread: 1.4, size: 0.9 }, { afterHit: true }),
      s(0, 'ring', 'point', { radius: 2.6 }, { element: 'shadow', afterHit: true }),
      s(0.05, 'motes', 'target', { count: 12, radius: 0.6, sink: true }, { element: 'shadow', each: true, afterHit: true }),
    ],
  }),
  pilot_e_binding_seal: () => rootFamily('pilot_e_binding_seal', 'arcane'),
  // basic weapons
  basic_greatsword_hit: () => slashFamily('basic_greatsword_hit', 'steel', 1.6, 'heavy_slash'),
  basic_holy_mace_hit: () => ({ ...bluntFamily('basic_holy_mace_hit', 'holy', 1.1) }),
  basic_scythe_hit: () => slashFamily('basic_scythe_hit', 'shadow', 1.4, 'heavy_slash'),
  basic_long_spear_hit: () => thrustFamily('basic_long_spear_hit', 'steel', 1),
  basic_grimoire_hit: () => boltFamily('basic_grimoire_hit', 'arcane', 0.7, false),
  basic_crosier_hit: () => boltFamily('basic_crosier_hit', 'holy', 0.6, false),
  basic_rapier_hit: () => thrustFamily('basic_rapier_hit', 'steel', 0.7),
  basic_wand_hit: () => boltFamily('basic_wand_hit', 'arcane', 0.6, false),
  basic_longbow_hit: () => arrowFamily('basic_longbow_hit'),
  basic_shuriken_hit: () => ({ ...arrowFamily('basic_shuriken_hit', 'steel', 0.6), projectile: { at: 0.02, from: 'sourceChest', to: 'targetChest', element: 'steel', speed: 20, size: 0.5, arc: 0.1, sfx: 'throw' } }),
  basic_dagger_hit: () => slashFamily('basic_dagger_hit', 'steel', 0.6, 'slash', 2),
  basic_hand_cannon_hit: () => ({ id: 'basic_hand_cannon_hit', element: 'fire', impactAt: 0.02, duration: 0.9, projectile: { at: 0.02, from: 'sourceChest', to: 'targetChest', element: 'fire', speed: 26, size: 0.45, arc: 0.05, sfx: 'cannon' }, steps: explosion(0, 'fire', 0.8, 'targetChest', { afterHit: true }) }),
};

/** Family picked from preset tags when no explicit recipe exists. */
function familyFor(id: string, tags: readonly string[]): FxRecipe {
  const element = elementForTags(tags);
  const cinematic = tags.includes('ultimate') || tags.includes('signature');
  if (tags.includes('heal') || tags.includes('regen')) return healFamily(id, element === 'steel' ? 'heal' : element);
  if (tags.includes('barrier') || tags.includes('shield') || tags.includes('boost')) return barrierFamily(id, element === 'steel' ? 'holy' : element);
  if (tags.includes('cleanse') || tags.includes('revive') || tags.includes('holy')) return holyFamily(id, 'holy', 1, cinematic);
  if (tags.includes('teleport') || tags.includes('smoke') || tags.includes('movement')) return moveFamily(id, element);
  if (tags.includes('landing')) return leapFamily(id);
  if (tags.includes('breath') || tags.includes('cone') || tags.includes('directional')) return breathFamily(id, element === 'steel' ? 'fire' : element, cinematic);
  if (tags.includes('ground') || tags.includes('massive')) return quakeFamily(id, 1.2, cinematic);
  if (tags.includes('lightning')) return lightningFamily(id, element);
  if (element === 'ice') return iceFamily(id, 1, cinematic);
  if (tags.includes('root') || tags.includes('bind')) return rootFamily(id, element === 'steel' ? 'nature' : element);
  if (tags.includes('debuff') || tags.includes('curse') || tags.includes('implosion')) return curseFamily(id, element === 'steel' ? 'shadow' : element);
  if (tags.includes('poison')) return poisonFamily(id);
  if (element === 'fire' && (tags.includes('area') || tags.includes('field'))) return areaFireFamily(id, 1.2, cinematic);
  if (tags.includes('spin') || tags.includes('wind')) return windFamily(id, element === 'steel' ? 'wind' : element, cinematic);
  if (tags.includes('projectile') || tags.includes('ranged')) return tags.includes('magic') ? boltFamily(id, element) : arrowFamily(id, element);
  if (tags.includes('thrust') || tags.includes('line') || tags.includes('dash')) return thrustFamily(id, element, cinematic ? 1.6 : 1);
  if (tags.includes('arcane') || tags.includes('magic')) return arcaneFamily(id);
  if (tags.includes('blunt')) return bluntFamily(id, 'blunt');
  if (tags.includes('explosion') || tags.includes('area')) return { id, element, impactAt: 0.1, duration: 1.0, steps: explosion(0.08, element, 1.3, 'point'), cinematic };
  return slashFamily(id, element, cinematic ? 1.8 : 1, cinematic ? 'heavy_slash' : 'slash', tags.includes('multi-hit') ? 3 : 1);
}

export function resolveFxRecipe(presetId: string, tags: readonly string[] = []): FxRecipe {
  const explicit = EXPLICIT[presetId];
  const recipe = explicit ? explicit() : familyFor(presetId, tags);
  // spells carry seals; a recipe without any seal is martial
  return { ...recipe, id: presetId, magic: recipe.magic ?? recipe.steps.some((step) => step.kind === 'circle') };
}

export function listExplicitFxRecipes(): string[] {
  return Object.keys(EXPLICIT);
}

/** Impact time once a projectile's flight (distance / speed) is known. */
export function recipeImpactTime(recipe: FxRecipe, projectileDistance = 0): number {
  if (!recipe.projectile) return recipe.impactAt;
  const flight = Math.max(0.12, projectileDistance / (recipe.projectile.speed ?? 14));
  return recipe.projectile.at + flight + recipe.impactAt;
}

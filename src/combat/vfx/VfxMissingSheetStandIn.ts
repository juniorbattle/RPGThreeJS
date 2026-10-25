import type { VfxStep, VfxStepType } from './VfxTypes';
import { VFX_SPRITE_SHEETS } from './VfxSpriteSheets';

/**
 * OD-2026-10-25-B lot 0. A preset step whose sprite sheet is no longer registered (legacy art retired by R2C-C-1)
 * keeps its anchor and timing with a procedural stand-in drawn by VfxSystem's own textures, in the tactical view and
 * the Combat Stage alike, until the operator composes the real effect in the lab. The stand-in is a presentation
 * placeholder: it uses no external asset, never counts as coverage, and the gap stays visible in the lab and tests.
 * Resolution reads the registry only; a registered sheet whose PNG is absent from a checkout is not detected here.
 */
export function isVfxSpriteSheetResolved(sheetId: string | undefined): boolean {
  return Boolean(sheetId && Object.prototype.hasOwnProperty.call(VFX_SPRITE_SHEETS, sheetId));
}

/** True when the step would draw nothing because its sprite sheet is not registered. */
export function isMissingSpriteSheetStep(step: VfxStep): boolean {
  return step.type === 'spriteSheet' && !isVfxSpriteSheetResolved(step.spriteSheet);
}

interface StandInStyle {
  readonly type: VfxStepType;
  readonly color: string;
  readonly secondaryColor?: string;
}

// First rule with a matching name token wins: the sheet names describe the retired art (element, then shape).
// Green stays reserved for healing, as in the tactical runtime's own palette.
const STAND_IN_STYLES: readonly (readonly [ReadonlySet<string>, StandInStyle])[] = [
  [new Set(['heal', 'blessing', 'bless', 'leaf', 'support', 'regen']), { type: 'sparkleBurst', color: '#c8ffc0', secondaryColor: '#ffe9a0' }],
  [new Set(['holy', 'radiance', 'light']), { type: 'sparkleBurst', color: '#ffe9a0', secondaryColor: '#fff8e0' }],
  [new Set(['barrier', 'guard', 'shield']), { type: 'groundRing', color: '#9fd8ff' }],
  [new Set(['poison', 'venom', 'maw']), { type: 'smokePuff', color: '#8fdc6a', secondaryColor: '#4f7a3a' }],
  [new Set(['void', 'curse', 'hex', 'shadow']), { type: 'smokePuff', color: '#a57cff', secondaryColor: '#3d2a66' }],
  [new Set(['fire', 'meteor', 'flame', 'inferno']), { type: 'particleBurst', color: '#ffb35a', secondaryColor: '#ff5a2a' }],
  [new Set(['ice', 'frost', 'freeze']), { type: 'particleBurst', color: '#bdf2ff', secondaryColor: '#6fc8ff' }],
  [new Set(['arcane', 'sigil', 'starburst', 'orbit', 'rune']), { type: 'impactStar', color: '#c9a8ff' }],
  [new Set(['slash', 'cleave', 'blade', 'crescent', 'crosscut', 'execution', 'shuriken', 'wind', 'cut']), { type: 'slashArc', color: '#fff4dc' }],
];
const DEFAULT_STYLE: StandInStyle = { type: 'impactStar', color: '#fff0c8' };

function styleFor(sheetId: string): StandInStyle {
  const tokens = sheetId.split('_');
  return STAND_IN_STYLES.find(([names]) => tokens.some((token) => names.has(token)))?.[1] ?? DEFAULT_STYLE;
}

/** Billboard size from the authored sheet scale (sheet frames carry transparent margins), else from the size word. */
function billboardScale(step: VfxStep, sheetId: string): number {
  if (step.scale !== undefined) return Math.min(1.1, Math.max(0.55, step.scale * 0.5));
  const tokens = sheetId.split('_');
  if (tokens.includes('ultimate')) return 1.1;
  if (tokens.includes('heavy')) return 0.85;
  if (tokens.includes('small')) return 0.6;
  return 0.72;
}

/** Engine parameters per stand-in type: particles need a count and a small particle size, rings a radius. */
function shapeFor(type: VfxStepType, step: VfxStep, sheetId: string): Partial<VfxStep> {
  switch (type) {
    case 'particleBurst':
    case 'sparkleBurst':
      return { count: 16, spread: 0.9, scale: 0.45 };
    case 'smokePuff':
      return { count: 12, spread: 0.8, scale: 0.4 };
    case 'groundRing':
      return { radius: 0.75, scale: 1 };
    case 'projectile':
      return { scale: 0.3 };
    default:
      return { scale: billboardScale(step, sheetId) };
  }
}

const warned = new Set<string>();

/** The step VfxSystem should draw: the original, or a procedural stand-in when its sprite sheet is missing. */
export function resolveRenderableVfxStep(step: VfxStep): VfxStep {
  if (!isMissingSpriteSheetStep(step)) return step;
  const sheetId = step.spriteSheet ?? '';
  if (import.meta.env?.DEV && !warned.has(sheetId)) {
    warned.add(sheetId);
    console.warn(`[VFX] Missing sprite sheet ${sheetId || '(none)'}: procedural stand-in until the effect is composed in the lab`);
  }
  const style = step.sheetMode === 'projectile' ? { type: 'projectile' as const, color: DEFAULT_STYLE.color } : styleFor(sheetId);
  return {
    id: step.id,
    type: style.type,
    anchor: step.anchor,
    targetAnchor: step.targetAnchor,
    startTime: step.startTime,
    duration: Math.max(step.duration, 0.3),
    color: style.color,
    secondaryColor: style.secondaryColor,
    // Keeps a cinematic opacity multiplier already applied to the step.
    opacity: Math.min(0.9, step.opacity ?? 0.9),
    heightOffset: step.heightOffset,
    reducedGraphicsMultiplier: step.reducedGraphicsMultiplier ?? 0.7,
    rotation: step.rotation,
    orientation: step.orientation,
    blending: 'additive',
    ...shapeFor(style.type, step, sheetId),
  };
}

/** Test seam: lets a test observe the one-time warning again. */
export function __resetStandInWarnings(): void {
  warned.clear();
}

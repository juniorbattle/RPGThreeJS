export type UnitMotionPresetId =
  | 'move_step'
  | 'melee_light'
  | 'melee_heavy'
  | 'ranged_attack'
  | 'magic_cast'
  | 'heal_cast'
  | 'buff_cast'
  | 'debuff_cast'
  | 'self_aoe'
  | 'move_leap'
  | 'teleport'
  | 'hit_reaction'
  | 'knockout'
  | 'revive';

export interface UnitMotionPreset {
  windup?: number;
  dash?: number;
  recoil?: number;
  cast?: number;
  jumpUp?: number;
  jumpDown?: number;
  hitOut?: number;
  hitBack?: number;
  settle?: number;
  stepHalf?: number;
  windupDistance?: number;
  dashDistance?: number;
  lift?: number;
  jumpHeight?: number;
  hitDistance?: number;
  squash?: number;
  tilt?: number;
  heavy?: boolean;
}

export const UNIT_MOTION_PRESETS: Readonly<Record<UnitMotionPresetId, Readonly<UnitMotionPreset>>> = Object.freeze({
  move_step: Object.freeze({ stepHalf: 0.065, settle: 0.06, lift: 0.08, squash: 0.035, tilt: 0.045 }),
  melee_light: Object.freeze({ windup: 0.09, dash: 0.10, recoil: 0.14, windupDistance: 0.12, dashDistance: 0.34, squash: 0.025 }),
  melee_heavy: Object.freeze({ windup: 0.16, dash: 0.17, recoil: 0.20, windupDistance: 0.20, dashDistance: 0.48, squash: 0.075, heavy: true }),
  ranged_attack: Object.freeze({ windup: 0.11, recoil: 0.18, windupDistance: 0.14, lift: 0.04 }),
  magic_cast: Object.freeze({ cast: 0.22, recoil: 0.24, lift: 0.20, squash: 0.025 }),
  heal_cast: Object.freeze({ cast: 0.20, recoil: 0.25, lift: 0.16, squash: 0.02 }),
  buff_cast: Object.freeze({ cast: 0.20, recoil: 0.25, lift: 0.14, squash: 0.02 }),
  debuff_cast: Object.freeze({ cast: 0.22, recoil: 0.25, lift: 0.17, squash: 0.025 }),
  self_aoe: Object.freeze({ jumpUp: 0.16, jumpDown: 0.16, jumpHeight: 0.30, squash: 0.05 }),
  move_leap: Object.freeze({ jumpUp: 0.19, jumpDown: 0.18, jumpHeight: 1.7, squash: 0.04 }),
  teleport: Object.freeze({ cast: 0.14, recoil: 0.18, lift: 0.10 }),
  hit_reaction: Object.freeze({ hitOut: 0.06, hitBack: 0.12, hitDistance: 0.11, squash: 0.035 }),
  knockout: Object.freeze({ hitOut: 0.08, hitBack: 0.14, hitDistance: 0.16, squash: 0.06 }),
  revive: Object.freeze({ cast: 0.16, recoil: 0.2, lift: 0.22, squash: 0.04, settle: 0.08 }),
});

export interface MotionPoint3 {
  x: number;
  y: number;
  z: number;
}

export interface UnitMotionBaseline {
  group: MotionPoint3;
  spritePosition: MotionPoint3;
  spriteScale: MotionPoint3;
  spriteRotationZ: number;
  outlinePosition?: MotionPoint3;
  outlineScale?: MotionPoint3;
  outlineRotationZ?: number;
}

export interface CanonicalUnitMotionInput {
  group: MotionPoint3;
  baseY: number;
  spriteScaleX: number;
  spriteScaleY: number;
  outlineScaleX?: number;
  outlineScaleY?: number;
}

export function createCanonicalUnitMotionBaseline(input: CanonicalUnitMotionInput): UnitMotionBaseline {
  const baseline: UnitMotionBaseline = {
    group: { ...input.group },
    spritePosition: { x: 0, y: input.baseY, z: 0 },
    spriteScale: { x: input.spriteScaleX, y: input.spriteScaleY, z: 1 },
    spriteRotationZ: 0,
  };
  if (input.outlineScaleX !== undefined && input.outlineScaleY !== undefined) {
    baseline.outlinePosition = { x: 0, y: input.baseY, z: 0 };
    baseline.outlineScale = { x: input.outlineScaleX, y: input.outlineScaleY, z: 1 };
    baseline.outlineRotationZ = 0;
  }
  return baseline;
}

const motionEpochs = new WeakMap<object, number>();

export function beginUnitMotion(owner: object): number {
  const epoch = (motionEpochs.get(owner) ?? 0) + 1;
  motionEpochs.set(owner, epoch);
  return epoch;
}

export function cancelUnitMotion(owner: object): number {
  return beginUnitMotion(owner);
}

export function isUnitMotionCurrent(owner: object, epoch: number): boolean {
  return motionEpochs.get(owner) === epoch;
}

export function onceAsync<T>(callback: () => T | Promise<T>): () => Promise<T> {
  let result: Promise<T> | undefined;
  return () => {
    result ??= Promise.resolve().then(callback);
    return result;
  };
}

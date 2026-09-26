/** Presentation scale for reviewed 2×2 opponents, derived from existing alpha bounds. */
import { resolveStrategicUnitVisual } from './stage/CombatPoseRegistry';

export interface VisibleCombatAsset {
  alphaBoundsPx: { top: number; bottom: number };
  worldUnitsPerPixel: number;
  scaleCorrection: number;
}

export function combatVisibleHeight(asset: VisibleCombatAsset | null | undefined): number {
  if (!asset) return 0;
  const height = (asset.alphaBoundsPx.bottom - asset.alphaBoundsPx.top) * asset.worldUnitsPerPixel * asset.scaleCorrection;
  return Number.isFinite(height) && height > 0 ? height : 0;
}

const HERO_REFERENCE_HEIGHT = combatVisibleHeight(resolveStrategicUnitVisual('alistair'));

export function combatLargeUnitPresenceScale(asset: VisibleCombatAsset | null | undefined, tier: 'elite' | 'boss'): number {
  const visibleHeight = combatVisibleHeight(asset);
  if (!visibleHeight || !HERO_REFERENCE_HEIGHT) return 1;
  const targetRatio = tier === 'boss' ? 2 : 1.85;
  return Math.max(1, Math.min(1.9, HERO_REFERENCE_HEIGHT * targetRatio / visibleHeight));
}

export interface StatusAnchorInput {
  spriteHeight: number;
  scaleY: number;
  spriteY: number;
  size?: number;
  visibleBounds?: {
    sourceSizePx: { width: number; height: number };
    alphaBoundsPx: { left: number; top: number; right: number; bottom: number };
  } | null;
}

export function statusAnchorGap(size = 1): number { return size > 1 ? 0.35 : 0.30; }

/** Local world-space centre for an indicator, computed from the active billboard. */
export function resolveStatusAnchorY(input: StatusAnchorInput): number {
  const height = Number.isFinite(input.spriteHeight) && input.spriteHeight > 0 ? input.spriteHeight : 1;
  const scale = Number.isFinite(input.scaleY) ? Math.abs(input.scaleY) : 1;
  const center = Number.isFinite(input.spriteY) ? input.spriteY : 0;
  const metadata = input.visibleBounds;
  const sourceHeight = metadata?.sourceSizePx.height;
  const top = metadata?.alphaBoundsPx.top;
  const validBounds = Number.isFinite(sourceHeight) && Number.isFinite(top)
    && sourceHeight! > 0 && top! >= 0 && top! < sourceHeight!
    && metadata!.alphaBoundsPx.bottom > top! && metadata!.alphaBoundsPx.bottom <= sourceHeight!;
  const visibleTopRatio = validBounds ? 0.5 - top! / sourceHeight! : 0.5;
  const gap = statusAnchorGap(input.size);
  return center + height * scale * visibleTopRatio + gap;
}

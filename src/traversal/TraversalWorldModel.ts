/** Presentation geography only. No decisions, rewards or collision authority. */
export type TraversalWorldSectionKind = 'FOREST' | 'ENVIRONMENT' | 'CORRIDOR' | 'TRANSITION';

export interface TraversalWorldSection {
  readonly id: string;
  readonly kind: TraversalWorldSectionKind;
  readonly worldStart: number;
  readonly worldEnd: number;
  readonly coreStart: number;
  readonly coreEnd: number;
  readonly asset: string;
  readonly mirror: boolean;
  readonly clearedAsset?: string;
  readonly variantAssets?: Readonly<Record<string, string>>;
  readonly props?: readonly {
    readonly id: string;
    readonly asset: string;
    readonly worldX: number;
    readonly groundPercent: number;
    readonly vehicleHeightRatio: number;
  }[];
}

export interface TraversalWorldPresentation {
  readonly checkpointSections: readonly TraversalWorldSection[];
  readonly routeSections: readonly TraversalWorldSection[];
  readonly routePeriod: number;
  readonly forestAsset: string;
  readonly sectionOverlap: number;
  readonly directionSignPropId?: string;
  readonly resolveWorld: (selectedBranch: string) => readonly TraversalWorldSection[];
}

export function routeWorldCamera(distance: number, sections: readonly TraversalWorldSection[], period: number): number {
  const first = sections[0]?.worldStart;
  if (first === undefined || !Number.isFinite(period) || period <= 0) {
    throw new Error('Traversal route world needs a positive painted period.');
  }
  return ((distance - first) % period + period) % period + first;
}

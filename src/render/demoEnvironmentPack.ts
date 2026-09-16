import productionManifestJson from './data/demo-environment-pack-v1.production.json';

export type DemoEnvironmentSurfaceRole =
  | 'CINEMATIC_SOURCE_ENVIRONMENT'
  | 'COMBAT_STAGE'
  | 'HOLD_SOURCE'
  | 'STATIC_TABLEAU'
  | 'STRATEGIC_COMBAT'
  | 'TRAVEL';

export interface DemoEnvironmentPlate {
  contextId: string;
  assetId: string;
  visualFamily: string;
  surfaceRole: DemoEnvironmentSurfaceRole;
  publicUrl: string;
  sha256: string;
  width: number;
  height: number;
}

interface ProductionAssetRecord {
  assetId: string;
  publicUrl: string;
  surfaceRole: string;
  visualFamily: string;
  sha256: string;
  width: number;
  height: number;
}

interface ProductionPlateBinding {
  assetId: string;
  surfaceRole: DemoEnvironmentSurfaceRole;
  runtimeCandidatePath: string;
}

interface ProductionContextMapping {
  visualFamily: string;
  plates: ProductionPlateBinding[];
}

interface ProductionEnvironmentManifest {
  packId: string;
  status: string;
  productionPublicRoot: string;
  summary: {
    visualFamilyCount: number;
    approvedAssetCount: number;
    promotedAssetCount: number;
    totalContexts: number;
    mappedContexts: number;
    unmappedContexts: number;
    fallbackContexts: number;
    byteIdenticalAssets: number;
  };
  assets: ProductionAssetRecord[];
  mappings: Record<string, ProductionContextMapping>;
}

const productionManifest = productionManifestJson as ProductionEnvironmentManifest;
const assetsById = new Map(productionManifest.assets.map((asset) => [asset.assetId, asset]));

/** Static production metadata only. Importing it never requests or preloads an image. */
export const demoEnvironmentPackSummary = Object.freeze({
  packId: productionManifest.packId,
  status: productionManifest.status,
  ...productionManifest.summary,
});

export function demoEnvironmentContextIds(): readonly string[] {
  return Object.keys(productionManifest.mappings);
}

/** Resolve one approved plate exactly. Missing contexts and roles are errors, never generic fallbacks. */
export function demoEnvironmentPlateForContext(
  contextId: string,
  preferredRole?: DemoEnvironmentSurfaceRole,
): DemoEnvironmentPlate {
  const mapping = productionManifest.mappings[contextId];
  if (!mapping) throw new Error(`No production environment mapping for ${contextId}`);
  const binding = preferredRole
    ? mapping.plates.find((plate) => plate.surfaceRole === preferredRole)
    : mapping.plates[0];
  if (!binding) {
    throw new Error(`No ${preferredRole ?? 'plate'} production environment binding for ${contextId}`);
  }
  const asset = assetsById.get(binding.assetId);
  if (!asset) throw new Error(`Unknown production environment asset ${binding.assetId}`);
  return {
    contextId,
    assetId: asset.assetId,
    visualFamily: mapping.visualFamily,
    surfaceRole: binding.surfaceRole,
    publicUrl: asset.publicUrl,
    sha256: asset.sha256,
    width: asset.width,
    height: asset.height,
  };
}

export function demoEnvironmentUrlForContext(
  contextId: string,
  preferredRole?: DemoEnvironmentSurfaceRole,
): string {
  return demoEnvironmentPlateForContext(contextId, preferredRole).publicUrl;
}

/**
 * Resolve the real TravelView context from the authoritative current node and
 * its available destinations. Branch destinations must share their approved
 * travel plate, which keeps the non-explorable route choice deterministic.
 */
export function demoTravelEnvironment(
  currentNodeId: string,
  destinationNodeIds: readonly string[],
): DemoEnvironmentPlate {
  if (destinationNodeIds.length === 0) {
    return demoEnvironmentPlateForContext(`node:${currentNodeId}`);
  }
  const plates = destinationNodeIds.map((destinationNodeId) =>
    demoEnvironmentPlateForContext(`edge:${currentNodeId}>${destinationNodeId}`),
  );
  const first = plates[0]!;
  if (plates.some((plate) => plate.publicUrl !== first.publicUrl)) {
    throw new Error(`Travel branches from ${currentNodeId} do not share one approved plate`);
  }
  return first;
}

/** Map reviewed `node:*:arrival` boundary keys onto their approved node context. */
export function demoBoundaryEnvironmentUrl(presentationKey: string): string {
  const contextId = presentationKey.endsWith(':arrival')
    ? presentationKey.slice(0, -':arrival'.length)
    : presentationKey;
  return demoEnvironmentUrlForContext(contextId);
}

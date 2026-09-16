import type { OptionCProofSurface } from './OptionCPhase4bAssets';
import type { BackgroundSceneConfig } from '../../render/BackgroundLayerSystem';

export const OPTION_C_ENVIRONMENT_PACK_ID = 'demo-environment-pack-v1';
export const OPTION_C_ENVIRONMENT_PACK_ROOT = `/assets/dev/option-c/phase4b/environment/${OPTION_C_ENVIRONMENT_PACK_ID}/`;
export const OPTION_C_ENVIRONMENT_MAP_URL = `${OPTION_C_ENVIRONMENT_PACK_ROOT}beat-background-map.json`;
export const OPTION_C_ENVIRONMENT_MANIFEST_URL = `${OPTION_C_ENVIRONMENT_PACK_ROOT}manifest.json`;

export type OptionCEnvironmentRole =
  | 'TRAVEL'
  | 'STATIC_TABLEAU'
  | 'STRATEGIC_COMBAT'
  | 'COMBAT_STAGE';

export interface OptionCEnvironmentPlate {
  surfaceRole: string;
  assetId: string;
  runtimeCandidatePath: string;
}

interface OptionCEnvironmentMapping {
  visualFamily: string;
  plates: OptionCEnvironmentPlate[];
}

interface OptionCEnvironmentMap {
  schemaVersion: number;
  packRoot: string;
  mappings: Record<string, OptionCEnvironmentMapping>;
}

interface OptionCEnvironmentManifestAsset {
  assetId: string;
  visualFamily: string;
  surfaceRole: string;
  runtimeCandidatePath: string;
  width: number;
  height: number;
  sha256: string;
  characterFree: boolean;
  uiSafe: boolean;
}

interface OptionCEnvironmentManifest {
  schemaVersion: number;
  packId: string;
  assets: OptionCEnvironmentManifestAsset[];
}

export interface ResolvedOptionCEnvironment {
  contextId: string;
  visualFamily: string;
  surface: OptionCProofSurface;
  surfaceRole: OptionCEnvironmentRole;
  assetId: string;
  url: string;
  width: number;
  height: number;
  sha256: string;
  characterFree: boolean;
  uiSafe: boolean;
}

const ROLE_BY_SURFACE: Readonly<Record<OptionCProofSurface, OptionCEnvironmentRole>> = Object.freeze({
  travel: 'TRAVEL',
  tableau: 'STATIC_TABLEAU',
  strategic: 'STRATEGIC_COMBAT',
  'combat-stage': 'COMBAT_STAGE',
});

const EXPECTED_FAMILIES = Object.freeze([
  'LION_CAMP',
  'ALARIC_AUDIENCE',
  'FOREST_ROAD',
  'FIRST_REFUGE',
  'VALMIR_ROAD',
  'BOIS_CLAIR',
  'SECOND_REFUGE',
  'WITNESS_ROAD',
  'SHADOW_RUINS',
  'FINAL_REFUGE',
  'LION_JUDGEMENT',
  'SERPENT_FINALE',
  'LION_TRIAL',
] as const);

const COMBAT_STAGE_PRESENTATION = Object.freeze({
  forest_route_stage: Object.freeze({
    positionY: 0.18,
    width: 13.17,
    height: 7.4,
    contactShadowOpacity: 0.76,
    contactShadowScale: 1.2,
    contactShadowPitch: -1.2,
  }),
  bois_clair_burning_stage: Object.freeze({
    positionY: -0.04,
    width: 13.17,
    height: 7.4,
    contactShadowOpacity: 0.82,
    contactShadowScale: 1.2,
    contactShadowPitch: -1.2,
  }),
  lion_sanctum_stage: Object.freeze({
    positionY: 0.6,
    width: 13.17,
    height: 7.4,
    contactShadowOpacity: 0.76,
    contactShadowScale: 1.28,
    contactShadowPitch: -1.2,
  }),
});

function assertRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid Option C environment ${label}.`);
  }
}

function runtimeUrl(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const publicPrefix = 'public/';
  if (!normalized.startsWith(publicPrefix)) {
    throw new Error(`Option C environment runtime path is outside public/: ${path}`);
  }
  return `/${normalized.slice(publicPrefix.length)}`;
}

export class OptionCEnvironmentCatalog {
  readonly totalContexts: number;
  readonly mappedContexts: number;
  readonly unmappedContexts = 0;
  readonly fallbackContexts = 0;
  readonly visualFamilies: readonly string[];
  readonly manifestAssetCount: number;

  private readonly contextsBySurface = new Map<OptionCProofSurface, readonly ResolvedOptionCEnvironment[]>();

  constructor(mapValue: unknown, manifestValue: unknown) {
    assertRecord(mapValue, 'beat map');
    assertRecord(manifestValue, 'manifest');
    const map = mapValue as unknown as OptionCEnvironmentMap;
    const manifest = manifestValue as unknown as OptionCEnvironmentManifest;
    if (map.schemaVersion !== 1 || manifest.schemaVersion !== 1) {
      throw new Error('Unsupported Option C environment schema version.');
    }
    if (manifest.packId !== OPTION_C_ENVIRONMENT_PACK_ID) {
      throw new Error(`Unexpected Option C environment pack: ${manifest.packId}`);
    }
    if (!map.mappings || typeof map.mappings !== 'object' || Array.isArray(map.mappings)) {
      throw new Error('Option C environment beat map has no mappings object.');
    }
    if (!Array.isArray(manifest.assets)) {
      throw new Error('Option C environment manifest has no assets array.');
    }

    const manifestById = new Map(manifest.assets.map((asset) => [asset.assetId, asset]));
    if (manifestById.size !== manifest.assets.length) {
      throw new Error('Option C environment manifest contains duplicate asset IDs.');
    }
    this.manifestAssetCount = manifest.assets.length;
    const contexts = Object.entries(map.mappings);
    this.totalContexts = contexts.length;
    this.mappedContexts = contexts.length;
    this.visualFamilies = Object.freeze([...new Set(contexts.map(([, mapping]) => mapping.visualFamily))]);
    for (const family of EXPECTED_FAMILIES) {
      if (!this.visualFamilies.includes(family)) {
        throw new Error(`Option C environment family is missing from the beat map: ${family}`);
      }
    }

    for (const surface of Object.keys(ROLE_BY_SURFACE) as OptionCProofSurface[]) {
      const surfaceRole = ROLE_BY_SURFACE[surface];
      const resolved: ResolvedOptionCEnvironment[] = [];
      for (const [contextId, mapping] of contexts) {
        if (!mapping || typeof mapping.visualFamily !== 'string' || !Array.isArray(mapping.plates)) {
          throw new Error(`Invalid Option C environment mapping: ${contextId}`);
        }
        const matches = mapping.plates.filter((plate) => plate.surfaceRole === surfaceRole);
        if (matches.length > 1) {
          throw new Error(`Ambiguous ${surfaceRole} mapping for ${contextId}.`);
        }
        const plate = matches[0];
        if (!plate) continue;
        const asset = manifestById.get(plate.assetId);
        if (!asset) throw new Error(`Mapped Option C asset is absent from manifest: ${plate.assetId}`);
        if (!asset.runtimeCandidatePath.endsWith(plate.runtimeCandidatePath)) {
          throw new Error(`Mapped path disagrees with manifest for ${plate.assetId}.`);
        }
        if (asset.visualFamily !== mapping.visualFamily) {
          throw new Error(`Mapped family disagrees with manifest for ${plate.assetId}.`);
        }
        if (!asset.characterFree) {
          throw new Error(`Mapped Option C environment is not character-free: ${plate.assetId}`);
        }
        resolved.push(Object.freeze({
          contextId,
          visualFamily: mapping.visualFamily,
          surface,
          surfaceRole,
          assetId: plate.assetId,
          url: runtimeUrl(asset.runtimeCandidatePath),
          width: asset.width,
          height: asset.height,
          sha256: asset.sha256,
          characterFree: asset.characterFree,
          uiSafe: asset.uiSafe,
        }));
      }
      this.contextsBySurface.set(surface, Object.freeze(resolved));
    }
  }

  contextsFor(surface: OptionCProofSurface): readonly ResolvedOptionCEnvironment[] {
    return this.contextsBySurface.get(surface) ?? [];
  }

  resolve(surface: OptionCProofSurface, contextId: string): ResolvedOptionCEnvironment {
    const resolved = this.contextsFor(surface).find((entry) => entry.contextId === contextId);
    if (!resolved) {
      throw new Error(`No ${ROLE_BY_SURFACE[surface]} Option C environment mapping for ${contextId}.`);
    }
    return resolved;
  }

  defaultFor(surface: OptionCProofSurface): ResolvedOptionCEnvironment {
    const preferred = this.contextsFor(surface).find((entry) => (
      (surface === 'travel' && entry.assetId === 'forest_road_travel')
      || (surface === 'tableau' && entry.assetId === 'forest_road_tableau')
      || (surface === 'strategic' && entry.assetId === 'forest_route_strategic')
      || (surface === 'combat-stage' && entry.assetId === 'forest_route_stage')
    ));
    const resolved = preferred ?? this.contextsFor(surface)[0];
    if (!resolved) throw new Error(`Option C environment pack has no ${surface} contexts.`);
    return resolved;
  }

  uniqueAssetsFor(surface: OptionCProofSurface): readonly ResolvedOptionCEnvironment[] {
    const seen = new Set<string>();
    return this.contextsFor(surface).filter((entry) => {
      if (seen.has(entry.assetId)) return false;
      seen.add(entry.assetId);
      return true;
    });
  }
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

async function loadJson(fetcher: FetchLike, url: string): Promise<unknown> {
  const response = await fetcher(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Option C environment metadata request failed (${response.status}): ${url}`);
  return response.json() as Promise<unknown>;
}

export async function loadOptionCEnvironmentCatalog(
  fetcher: FetchLike = globalThis.fetch.bind(globalThis),
): Promise<OptionCEnvironmentCatalog> {
  const [map, manifest] = await Promise.all([
    loadJson(fetcher, OPTION_C_ENVIRONMENT_MAP_URL),
    loadJson(fetcher, OPTION_C_ENVIRONMENT_MANIFEST_URL),
  ]);
  return new OptionCEnvironmentCatalog(map, manifest);
}

export function optionCEnvironmentBackground(
  environment: Pick<ResolvedOptionCEnvironment, 'assetId' | 'surface' | 'url'>,
): BackgroundSceneConfig {
  const combatStage = environment.surface === 'combat-stage';
  if (!combatStage && environment.surface !== 'strategic') {
    throw new Error(`Three.js background requested for non-combat Option C surface: ${environment.surface}`);
  }
  const stagePlate = combatStage
    ? COMBAT_STAGE_PRESENTATION[environment.assetId as keyof typeof COMBAT_STAGE_PRESENTATION]
    : undefined;
  if (combatStage && !stagePlate) {
    throw new Error(`Combat Stage plate has no explicit grounding metadata: ${environment.assetId}`);
  }
  const combatStageGrounding = stagePlate ? {
    contactShadowOpacity: stagePlate.contactShadowOpacity,
    contactShadowScale: stagePlate.contactShadowScale,
    contactShadowPitch: stagePlate.contactShadowPitch,
  } : undefined;
  return {
    id: `option-c-${environment.assetId}`,
    enabled: true,
    ...(combatStageGrounding ? { combatStageGrounding } : {}),
    layers: [{
      id: `option-c-${environment.assetId}-backdrop`,
      texture: environment.url,
      position: stagePlate ? [0, stagePlate.positionY, -8] : [0, -0.28, -30],
      size: stagePlate ? [stagePlate.width, stagePlate.height] : [36, 20.25],
      parallax: 0,
      opacity: 1,
      fallback: ['#1d2b24', '#07100d'],
      failOnError: true,
    }],
  };
}

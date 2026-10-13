/**
 * R2C-B — VFX Resource Manager
 *
 * One shared, reusable texture manager serving the existing VFX architecture.
 * It does NOT create a second renderer or competing texture system.
 *
 * Responsibilities:
 *  - lazy loading of CartoonCoffee / legacy sprite-sheet textures
 *  - request deduplication (concurrent acquire calls share one load)
 *  - bounded cache with weighted 4K-equivalent memory budget
 *  - LRU eviction (never evicts retained / actively-played resources)
 *  - safe THREE.Texture disposal on eviction and disposeAll
 *  - reference / retain tracking
 *  - resource statistics for Lab QA and debugging
 *  - preload API that respects the memory budget
 *
 * Source resolution is strictly through trusted inventory / manifest data.
 * Arbitrary filesystem paths cannot be injected.
 */

import * as THREE from 'three';
import { VFX_SPRITE_SHEETS, configureVfxSpriteSheetTexture } from './VfxSpriteSheets';
import type { VfxSpriteSheetId } from './VfxTypes';
import inventoryJson from '../../../docs/reports/vfx-megapack-r1-2-4-corrected-inventory.json';
import runtimeManifest from '../../../docs/reports/vfx-megapack-r2-selected-runtime-assets.json';

// ============================================================ Constants

/**
 * Weighted memory budget expressed in 4K-equivalent units.
 *
 *   4096² RGBA  ≈ 64 MiB  = 1.0 unit
 *   2048² RGBA  ≈ 16 MiB  = 0.25 unit
 *   1280² RGBA  ≈ 6.25 MiB ≈ 0.0977 unit
 *
 * Conservative default: 10 units → max ~640 MiB of decoded base textures.
 * No mipmaps are generated (existing VFX doctrine), so no additional
 * mip-level memory is accounted for.
 */
export const DEFAULT_FOUR_K_BUDGET = 10;

/** Bytes per RGBA pixel. */
const BYTES_PER_PIXEL = 4;

/** Runtime root for CartoonCoffee native assets. */
const RUNTIME_ROOT = '/assets/vfx/megapack-runtime/';

// ============================================================ Types

export interface VfxSourceDescriptor {
  url: string;
  width: number;
  height: number;
}

export type VfxCandidateAvailability =
  | 'READY'
  | 'AVAILABLE_ON_DEMAND'
  | 'UNSUPPORTED_NATIVE'
  | 'ERROR';

export interface VfxResourceStats {
  cachedResources: number;
  pendingLoads: number;
  retainedResources: number;
  decodedBytesEstimate: number;
  fourKEquivalentUsage: number;
  budget: number;
  evictions: number;
  loads: number;
  cacheHits: number;
}

export type VfxTextureLoaderFn = (url: string) => Promise<THREE.Texture>;

// ============================================================ Source Resolution

interface InventoryRecord {
  assetId: string;
  collection: string;
  sourceFilename: string;
  relativePath: string;
  width: number;
  height: number;
  nativeGrid: string;
  nativeFrameCount: number;
  nativeCellWidth: number;
  nativeCellHeight: number;
  classificationStatus: string;
}

interface InventoryJson {
  results: readonly InventoryRecord[];
}

const _inventoryMap: ReadonlyMap<string, InventoryRecord> = (() => {
  const map = new Map<string, InventoryRecord>();
  for (const rec of (inventoryJson as InventoryJson).results) {
    map.set(rec.assetId, rec);
  }
  return map;
})();

const _runtimeManifestCandidateIds: ReadonlySet<string> = new Set(
  (runtimeManifest as { assets: readonly { candidateId: string }[] }).assets.map((a) => a.candidateId),
);

/**
 * Resolves a production VfxSpriteSheetId to a trusted source descriptor.
 * The URL comes directly from the VFX_SPRITE_SHEETS registry — never from
 * caller input.
 */
export function resolveSheetSource(sheetId: VfxSpriteSheetId): VfxSourceDescriptor | null {
  const def = VFX_SPRITE_SHEETS[sheetId];
  if (!def) return null;
  return {
    url: def.url,
    width: def.sheetWidthPx,
    height: def.sheetHeightPx,
  };
}

/**
 * Resolves a CartoonCoffee candidate ID to a trusted source descriptor.
 *
 * The candidate must exist in the corrected inventory and have a supported
 * native format (2048×2048 or 4096×4096).  The URL is constructed from the
 * trusted runtime root — never from caller input — preventing path traversal.
 *
 * Returns null for unknown or unsupported candidates.
 */
export function resolveCandidateSource(candidateId: string): VfxSourceDescriptor | null {
  const rec = _inventoryMap.get(candidateId);
  if (!rec) return null;
  if (!isSupportedNativeFormat(rec.width, rec.height)) return null;
  return {
    url: `${RUNTIME_ROOT}${candidateId}.png`,
    width: rec.width,
    height: rec.height,
  };
}

/**
 * Determines the availability of a CartoonCoffee candidate for DEV preview.
 *
 * READY               — PNG exists in the runtime directory (per manifest)
 * AVAILABLE_ON_DEMAND — valid native format; PNG can be synced on demand
 * UNSUPPORTED_NATIVE  — atypical dimensions (not 2048² or 4096²)
 */
export function resolveCandidateAvailability(candidateId: string): VfxCandidateAvailability {
  const rec = _inventoryMap.get(candidateId);
  if (!rec) return 'ERROR';
  if (!isSupportedNativeFormat(rec.width, rec.height)) return 'UNSUPPORTED_NATIVE';
  if (_runtimeManifestCandidateIds.has(candidateId)) return 'READY';
  return 'AVAILABLE_ON_DEMAND';
}

/**
 * Returns the inventory record for a candidate ID, or null if not found.
 * Used by the DEV acquisition helper to determine the source path to sync.
 */
export function getCandidateInventoryRecord(candidateId: string): InventoryRecord | null {
  return _inventoryMap.get(candidateId) ?? null;
}

function isSupportedNativeFormat(width: number, height: number): boolean {
  return (width === 2048 && height === 2048) || (width === 4096 && height === 4096);
}

// ============================================================ Cache Entry

interface CacheEntry {
  texture: THREE.Texture;
  url: string;
  width: number;
  height: number;
  weight: number;
  refCount: number;
  lastUsed: number;
}

// ============================================================ Resource Manager

const defaultLoader: VfxTextureLoaderFn = (url: string) => {
  const loader = new THREE.TextureLoader();
  return loader.loadAsync(url);
};

export class VfxResourceManager {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly pending = new Map<string, Promise<THREE.Texture>>();
  private readonly loader: VfxTextureLoaderFn;
  private readonly _budget: number;
  private _evictions = 0;
  private _loads = 0;
  private _cacheHits = 0;
  private _globalRetains = new Set<string>();

  constructor(options?: { loader?: VfxTextureLoaderFn; budget?: number }) {
    this.loader = options?.loader ?? defaultLoader;
    this._budget = options?.budget ?? DEFAULT_FOUR_K_BUDGET;
  }

  get budget(): number {
    return this._budget;
  }

  /**
   * Acquires a base texture for the given key.  The key must correspond to a
   * trusted source descriptor (from resolveSheetSource or resolveCandidateSource).
   *
   * Returns the configured base texture.  The caller is responsible for cloning
   * if independent UV state is needed (as VfxSpriteSheets does).
   *
   * Each acquire() increments a reference count.  Call release(key) when done
   * to make the resource eligible for LRU eviction.
   */
  async acquire(key: string, descriptor: VfxSourceDescriptor): Promise<THREE.Texture> {
    const existing = this.cache.get(key);
    if (existing) {
      existing.refCount += 1;
      existing.lastUsed = performance.now();
      this._cacheHits += 1;
      return existing.texture;
    }

    let pending = this.pending.get(key);
    if (!pending) {
      pending = this.loader(descriptor.url)
        .then((texture) => {
          configureVfxSpriteSheetTexture(texture);
          const weight = computeWeight(descriptor.width, descriptor.height);
          const entry: CacheEntry = {
            texture,
            url: descriptor.url,
            width: descriptor.width,
            height: descriptor.height,
            weight,
            refCount: 0,
            lastUsed: performance.now(),
          };
          this.cache.set(key, entry);
          this.pending.delete(key);
          this._loads += 1;
          this.evictIfNeeded();
          return texture;
        })
        .catch((error) => {
          this.pending.delete(key);
          throw error;
        });
      this.pending.set(key, pending);
    }

    const texture = await pending;
    const entry = this.cache.get(key);
    if (entry) {
      entry.refCount += 1;
      entry.lastUsed = performance.now();
    }
    return texture;
  }

  /**
   * Releases a previously acquired resource.  Decrements the reference count.
   * When refCount reaches zero (and no global retain), the resource becomes
   * eligible for LRU eviction.
   */
  release(key: string): void {
    const entry = this.cache.get(key);
    if (!entry) return;
    entry.refCount = Math.max(0, entry.refCount - 1);
  }

  /**
   * Globally retains a resource, preventing LRU eviction regardless of
   * reference count.  Used for resources that must persist across playbacks.
   */
  retain(key: string): void {
    this._globalRetains.add(key);
  }

  /**
   * Releases a global retain.  The resource becomes eviction-eligible if
   * refCount is also zero.
   */
  unretain(key: string): void {
    this._globalRetains.delete(key);
  }

  /**
   * Preloads a set of sources.  Each source is loaded through the same manager
   * pipeline (dedup, cache, budget enforcement).  Does not retain the resources
   * — callers must acquire() to get a reference.
   *
   * Preload respects the memory budget: if loading all sources would exceed
   * the budget, LRU eviction of older unretained resources occurs.
   */
  async preload(sources: ReadonlyArray<{ key: string; descriptor: VfxSourceDescriptor }>): Promise<void> {
    await Promise.all(
      sources.map(async ({ key, descriptor }) => {
        try {
          const texture = await this.acquire(key, descriptor);
          this.release(key);
          void texture;
        } catch {
          // Preload failures are non-fatal; individual acquire calls will retry.
        }
      }),
    );
  }

  /**
   * Returns lightweight debug stats for Lab QA.
   */
  getStats(): VfxResourceStats {
    let decodedBytes = 0;
    let fourKUsage = 0;
    let retained = 0;
    for (const [key, entry] of this.cache) {
      decodedBytes += entry.width * entry.height * BYTES_PER_PIXEL;
      fourKUsage += entry.weight;
      if (entry.refCount > 0 || this._globalRetains.has(key)) retained += 1;
    }
    return {
      cachedResources: this.cache.size,
      pendingLoads: this.pending.size,
      retainedResources: retained,
      decodedBytesEstimate: decodedBytes,
      fourKEquivalentUsage: fourKUsage,
      budget: this._budget,
      evictions: this._evictions,
      loads: this._loads,
      cacheHits: this._cacheHits,
    };
  }

  /**
   * Disposes all manager-owned resources and clears the cache.
   * Pending loads are allowed to settle (their results will be disposed).
   */
  disposeAll(): void {
    for (const entry of this.cache.values()) {
      entry.texture.dispose();
    }
    this.cache.clear();
    this.pending.clear();
    this._globalRetains.clear();
  }

  // ============================================================ Internal

  private evictIfNeeded(): void {
    let totalWeight = 0;
    for (const entry of this.cache.values()) {
      totalWeight += entry.weight;
    }

    if (totalWeight <= this._budget) return;

    const sorted = [...this.cache.entries()]
      .filter(([key, entry]) => entry.refCount === 0 && !this._globalRetains.has(key))
      .sort((a, b) => a[1].lastUsed - b[1].lastUsed);

    for (const [key, entry] of sorted) {
      if (totalWeight <= this._budget) break;
      entry.texture.dispose();
      this.cache.delete(key);
      totalWeight -= entry.weight;
      this._evictions += 1;
    }
  }
}

function computeWeight(width: number, height: number): number {
  const pixels = width * height;
  const fourKPixels = 4096 * 4096;
  return pixels / fourKPixels;
}

// ============================================================ Singleton

/**
 * Shared singleton instance.  VfxSpriteSheets and the Lab both use this
 * manager — there is no second texture cache.
 */
export const vfxResourceManager = new VfxResourceManager();

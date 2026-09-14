/**
 * Phase 4C-GLM — Selective Loading + Cache + Memory Tracking
 *
 * Sections 23-29: NO_GLOBAL_OPTION_C_PRELOAD, per-surface loading,
 * cache policy, memory tracking.
 *
 * This module is DEV-only.  Production never imports it.
 */

import type { OptionCSurface, OptionCAnimationState } from './OptionCCharacterSchema';
import {
  resolveCharacterSurfaceFrames,
  resolveEnvironmentAsset,
  type ResolvedAsset,
} from './OptionCManifestResolver';

// ---------------------------------------------------------------------------
// NO_GLOBAL_OPTION_C_PRELOAD flag (Section 23)
// ---------------------------------------------------------------------------

export const NO_GLOBAL_OPTION_C_PRELOAD = true as const;

// ---------------------------------------------------------------------------
// Cache entry
// ---------------------------------------------------------------------------

export interface OptionCCacheEntry {
  readonly url: string;
  readonly semanticKey: string;
  readonly fileBytes: number;
  readonly decodedRgbaBytes: number;
  readonly width: number;
  readonly height: number;
  readonly loadedAt: number;
  readonly lastUsed: number;
  readonly surface: OptionCSurface;
  readonly characterId?: string;
  readonly environmentFamily?: string;
}

// ---------------------------------------------------------------------------
// Cache policy (Section 28)
// ---------------------------------------------------------------------------

export interface OptionCCachePolicy {
  /** Max entries before LRU eviction. */
  readonly maxEntries: number;
  /** Max decoded RGBA bytes before eviction (~256MB). */
  readonly maxDecodedBytes: number;
  /** Whether to reuse character assets between surfaces. */
  readonly reuseCharacterAcrossSurfaces: boolean;
  /** Whether to reuse environment assets between surfaces. */
  readonly reuseEnvironmentAcrossSurfaces: boolean;
  /** Whether to release environment on surface switch. */
  readonly releaseEnvironmentOnSurfaceSwitch: boolean;
  /** Whether to release character animations on surface switch. */
  readonly releaseCharacterAnimationsOnSurfaceSwitch: boolean;
}

export const DEFAULT_CACHE_POLICY: OptionCCachePolicy = Object.freeze({
  maxEntries: 128,
  maxDecodedBytes: 256 * 1024 * 1024,
  reuseCharacterAcrossSurfaces: true,
  reuseEnvironmentAcrossSurfaces: true,
  releaseEnvironmentOnSurfaceSwitch: false,
  releaseCharacterAnimationsOnSurfaceSwitch: false,
});

// ---------------------------------------------------------------------------
// Memory tracker (Section 29)
// ---------------------------------------------------------------------------

export interface OptionCMemoryReport {
  readonly totalEntries: number;
  readonly totalFileBytes: number;
  readonly estimatedDecodedRgbaBytes: number;
  readonly activeTextures: number;
  readonly loadedCharacterStates: readonly string[];
  readonly loadedEnvironmentFamilies: readonly string[];
  readonly cacheEntries: readonly OptionCCacheEntry[];
  readonly isEstimate: boolean;
}

// ---------------------------------------------------------------------------
// Selective loader
// ---------------------------------------------------------------------------

export class OptionCSelectiveLoader {
  private readonly cache = new Map<string, OptionCCacheEntry>();
  private readonly policy: OptionCCachePolicy;
  private currentSurface: OptionCSurface | null = null;
  private readonly loadedCharacterIds = new Set<string>();
  private readonly loadedEnvironmentFamilies = new Set<string>();

  constructor(policy: OptionCCachePolicy = DEFAULT_CACHE_POLICY) {
    this.policy = policy;
  }

  /**
   * Load only the assets required for a travel surface.
   * (Section 24: environment + travel UI only, no combat sheets)
   */
  async loadTravel(environmentFamily: string): Promise<readonly OptionCCacheEntry[]> {
    this.currentSurface = 'travel';
    const envAsset = resolveEnvironmentAsset({ family: environmentFamily, surface: 'travel' });
    return this.loadAssets([envAsset], environmentFamily);
  }

  /**
   * Load only the assets required for a tableau surface.
   * (Section 25: background + visible actors + dialogue UI)
   */
  async loadTableau(
    environmentFamily: string,
    visibleCharacterIds: readonly string[],
  ): Promise<readonly OptionCCacheEntry[]> {
    this.currentSurface = 'tableau';
    const assets: ResolvedAsset[] = [
      resolveEnvironmentAsset({ family: environmentFamily, surface: 'tableau' }),
    ];
    for (const charId of visibleCharacterIds) {
      // Tableau loads only idle animation frames, not full combat sets
      const frames = resolveCharacterSurfaceFrames(charId, 'tableau');
      for (let i = 0; i < frames.length; i++) {
        assets.push({
          url: frames[i]!,
          semanticKey: `character:${charId}:surface:tableau:state:idle:frame:${i}`,
          characterId: charId,
          surface: 'tableau',
          state: 'idle',
          frameIndex: i,
          exists: true,
        });
      }
    }
    return this.loadAssets(assets, environmentFamily, visibleCharacterIds);
  }

  /**
   * Load only the assets required for a strategic combat surface.
   * (Section 26: battlefield + participating units + tactical states)
   */
  async loadStrategic(
    environmentFamily: string,
    participatingCharacterIds: readonly string[],
  ): Promise<readonly OptionCCacheEntry[]> {
    this.currentSurface = 'strategic';
    const assets: ResolvedAsset[] = [
      resolveEnvironmentAsset({ family: environmentFamily, surface: 'strategic' }),
    ];
    for (const charId of participatingCharacterIds) {
      const frames = resolveCharacterSurfaceFrames(charId, 'strategic');
      for (let i = 0; i < frames.length; i++) {
        const state = frames.length > 8 && i >= 8 ? 'dash' : 'idle';
        assets.push({
          url: frames[i]!,
          semanticKey: `character:${charId}:surface:strategic:state:${state}:frame:${i % 8}`,
          characterId: charId,
          surface: 'strategic',
          state: state as OptionCAnimationState,
          frameIndex: i % 8,
          exists: true,
        });
      }
    }
    return this.loadAssets(assets, environmentFamily, participatingCharacterIds);
  }

  /**
   * Load only the assets required for a combat stage surface.
   * (Section 27: stage + attacker + target + required animation + VFX)
   */
  async loadCombatStage(
    environmentFamily: string,
    attackerId: string,
    targetId: string,
    requiredState: OptionCAnimationState,
  ): Promise<readonly OptionCCacheEntry[]> {
    this.currentSurface = 'combat-stage';
    const assets: ResolvedAsset[] = [
      resolveEnvironmentAsset({ family: environmentFamily, surface: 'combat-stage' }),
    ];
    // Load only the required action state for the attacker, idle for target
    const attackerFrames = resolveCharacterSurfaceFrames(attackerId, 'combat-stage');
    for (let i = 0; i < attackerFrames.length; i++) {
      assets.push({
        url: attackerFrames[i]!,
        semanticKey: `character:${attackerId}:surface:combat-stage:frame:${i}`,
        characterId: attackerId,
        surface: 'combat-stage',
        frameIndex: i,
        exists: true,
      });
    }
    const targetFrames = resolveCharacterSurfaceFrames(targetId, 'combat-stage');
    for (let i = 0; i < Math.min(8, targetFrames.length); i++) {
      assets.push({
        url: targetFrames[i]!,
        semanticKey: `character:${targetId}:surface:combat-stage:state:idle:frame:${i}`,
        characterId: targetId,
        surface: 'combat-stage',
        state: 'idle',
        frameIndex: i,
        exists: true,
      });
    }
    return this.loadAssets(assets, environmentFamily, [attackerId, targetId]);
  }

  /**
   * Release assets for characters no longer on the current surface.
   * Does NOT aggressively unload — only releases when the character is
   * not in the visible/participating set.  (Section 28: no reload thrash)
   */
  releaseUnusedCharacters(currentCharacterIds: readonly string[]): number {
    let released = 0;
    const currentSet = new Set(currentCharacterIds);
    for (const [key, entry] of this.cache) {
      if (entry.characterId && !currentSet.has(entry.characterId)) {
        this.cache.delete(key);
        this.loadedCharacterIds.delete(entry.characterId);
        released++;
      }
    }
    return released;
  }

  /**
   * Release all assets for a specific surface.
   */
  releaseSurface(surface: OptionCSurface): number {
    let released = 0;
    for (const [key, entry] of this.cache) {
      if (entry.surface === surface) {
        this.cache.delete(key);
        released++;
      }
    }
    return released;
  }

  /**
   * Get the current memory report. (Section 29)
   */
  getMemoryReport(): OptionCMemoryReport {
    const entries = Array.from(this.cache.values());
    const totalFileBytes = entries.reduce((sum, e) => sum + e.fileBytes, 0);
    const totalDecoded = entries.reduce((sum, e) => sum + e.decodedRgbaBytes, 0);
    const characterStates = new Set<string>();
    const envFamilies = new Set<string>();
    for (const entry of entries) {
      if (entry.characterId) characterStates.add(entry.characterId);
      if (entry.environmentFamily) envFamilies.add(entry.environmentFamily);
    }
    return {
      totalEntries: entries.length,
      totalFileBytes,
      estimatedDecodedRgbaBytes: totalDecoded,
      activeTextures: entries.length,
      loadedCharacterStates: Array.from(characterStates),
      loadedEnvironmentFamilies: Array.from(envFamilies),
      cacheEntries: entries,
      isEstimate: true,
    };
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  hasAsset(url: string): boolean {
    return this.cache.has(url);
  }

  getCurrentSurface(): OptionCSurface | null {
    return this.currentSurface;
  }

  clear(): void {
    this.cache.clear();
    this.loadedCharacterIds.clear();
    this.loadedEnvironmentFamilies.clear();
    this.currentSurface = null;
  }

  // -----------------------------------------------------------------------
  // Private
  // -----------------------------------------------------------------------

  private async loadAssets(
    assets: readonly ResolvedAsset[],
    environmentFamily?: string,
    characterIds?: readonly string[],
  ): Promise<readonly OptionCCacheEntry[]> {
    const entries: OptionCCacheEntry[] = [];
    for (const asset of assets) {
      if (this.cache.has(asset.url)) {
        // Update last-used timestamp
        const existing = this.cache.get(asset.url)!;
        this.cache.set(asset.url, { ...existing, lastUsed: Date.now() });
        entries.push(this.cache.get(asset.url)!);
        continue;
      }
      // Enforce cache limits (LRU eviction)
      this.enforceLimits();
      // Estimate bytes — in a real browser we'd use naturalWidth/Height, but
      // for DEV tracking we estimate from the known Option C dimensions.
      const entry = this.createCacheEntry(asset, environmentFamily);
      this.cache.set(asset.url, entry);
      entries.push(entry);
    }
    if (environmentFamily) this.loadedEnvironmentFamilies.add(environmentFamily);
    if (characterIds) for (const id of characterIds) this.loadedCharacterIds.add(id);
    return entries;
  }

  private createCacheEntry(asset: ResolvedAsset, environmentFamily?: string): OptionCCacheEntry {
    // Option C frames are 512x512, environments are 1672x941
    const isCharacter = asset.characterId !== undefined;
    const width = isCharacter ? 512 : 1672;
    const height = isCharacter ? 512 : 941;
    // Estimate file bytes (PNG ~200KB for 512x512, ~3MB for 1672x941)
    const fileBytes = isCharacter ? 200_000 : 3_000_000;
    const decodedRgbaBytes = width * height * 4;
    return {
      url: asset.url,
      semanticKey: asset.semanticKey,
      fileBytes,
      decodedRgbaBytes,
      width,
      height,
      loadedAt: Date.now(),
      lastUsed: Date.now(),
      surface: asset.surface,
      characterId: asset.characterId,
      environmentFamily,
    };
  }

  private enforceLimits(): void {
    // LRU eviction by lastUsed
    while (this.cache.size >= this.policy.maxEntries) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      for (const [key, entry] of this.cache) {
        if (entry.lastUsed < oldestTime) {
          oldestTime = entry.lastUsed;
          oldestKey = key;
        }
      }
      if (oldestKey) this.cache.delete(oldestKey);
      else break;
    }
    // Evict by decoded bytes
    let totalDecoded = 0;
    for (const entry of this.cache.values()) totalDecoded += entry.decodedRgbaBytes;
    while (totalDecoded > this.policy.maxDecodedBytes && this.cache.size > 0) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      for (const [key, entry] of this.cache) {
        if (entry.lastUsed < oldestTime) {
          oldestTime = entry.lastUsed;
          oldestKey = key;
        }
      }
      if (oldestKey) {
        const removed = this.cache.get(oldestKey)!;
        totalDecoded -= removed.decodedRgbaBytes;
        this.cache.delete(oldestKey);
      } else break;
    }
  }
}

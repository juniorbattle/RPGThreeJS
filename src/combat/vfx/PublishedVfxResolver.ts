/**
 * R2C-VFX Composer V2.3 — Action VFX Override Resolver.
 *
 * ONE central resolver for production VFX selection.
 *
 *   resolveActionVfx(actionKey, staticPresetId)
 *     → published registry contains actionKey?
 *         YES → compile semantic published entry → play candidate slots
 *         NO  → use existing static VfxSystem.play(staticPresetId)
 *
 * This module does NOT scatter registry lookups through legacyCombatRuntime.
 * It provides a single `playActionVfx` entry point and a `resolveActionVfxPresetId`
 * for code that only needs the preset ID string.
 */

import type { VfxSystem } from './VfxSystem';
import type { VfxContext, VfxPlayResult } from './VfxTypes';
import {
  getCandidateCadence,
  buildSlotOverrides,
  playCompiledVfxSlots,
  playCompiledBeats,
  playCompiledTechnical,
} from './VfxComposerPlayback';
import {
  compileDraft,
} from './VfxPresetComposer';
import type { CompiledVfxDraft, VfxPresetDraft, VfxRuntimeScaleFactors } from './VfxPresetComposer';
import type { CompiledCasterMotion, UnitMotionRuntimeHooks } from './CasterMotion';
import {
  getPublishedEntry,
  publishedEntryToDraft,
  type PublishedVfxRegistry,
} from './PublishedVfxRegistry';
import publishedRegistryData from './generated/published-vfx-presets.json';

// ============================================================ Registry Loading

const _durableRegistry: PublishedVfxRegistry = publishedRegistryData as PublishedVfxRegistry;

/**
 * DEV-only in-memory overlay. When a publish happens during a dev session,
 * this overlay is updated so the running session can use the new entry
 * without a full page reload. On reload/restart, the durable JSON import
 * is authoritative.
 */
let _devOverlay: PublishedVfxRegistry | null = null;

/**
 * DEV-only: updates the in-memory overlay with a new registry.
 * Called by the publish endpoint response handler.
 */
export function __devUpdateOverlay(registry: PublishedVfxRegistry): void {
  _devOverlay = registry;
}

/**
 * DEV-only: clears the overlay (e.g. after unpublish).
 */
export function __devClearOverlay(): void {
  _devOverlay = null;
}

/**
 * Returns the active registry. In dev mode, the overlay takes priority
 * if set. Otherwise the durable JSON import is authoritative.
 */
export function getActiveRegistry(): PublishedVfxRegistry {
  return _devOverlay ?? _durableRegistry;
}

// ============================================================ Resolver

/**
 * Resolves the effective preset ID for an action.
 * Returns `published_<actionKey>` if published, otherwise the static fallback.
 */
export function resolveActionVfxPresetId(
  actionKey: string,
  staticPresetId: string,
): string {
  const registry = getActiveRegistry();
  const entry = getPublishedEntry(registry, actionKey);
  if (entry) return entry.presetId;
  return staticPresetId;
}

/**
 * Returns true if an action has a published VFX configuration.
 */
export function isActionPublished(actionKey: string): boolean {
  const registry = getActiveRegistry();
  return getPublishedEntry(registry, actionKey) !== null;
}

/**
 * Returns the published draft for an action, or null if not published.
 * The draft can be fed to compileDraft() for production playback.
 */
export function getPublishedDraft(actionKey: string): VfxPresetDraft | null {
  const registry = getActiveRegistry();
  const entry = getPublishedEntry(registry, actionKey);
  if (!entry) return null;
  return publishedEntryToDraft(entry);
}

// ============================================================ Production Playback

export interface PlayActionVfxOptions {
  actionKey: string;
  fallbackPresetId: string;
  context: VfxContext;
  vfxSystem: VfxSystem;
  scaleFactors?: VfxRuntimeScaleFactors;
  /**
   * Installs the published preset's compiled CASTER MOTION on the live Combat
   * Stage. ADDITIVE and OPTIONAL — omitted by every existing caller, and
   * never invoked for a preset that authors no motion.
   */
  unitMotion?: UnitMotionRuntimeHooks;
  applyCasterMotion?: (motion: CompiledCasterMotion) => void;
}

/**
 * Central production VFX playback entry point.
 *
 * If the action is published:
 *   → compile semantic published entry via compileDraft()
 *   → play candidate slots via playLabSpriteSheet (same path as Composer)
 *
 * If not published:
 *   → VfxSystem.play(fallbackPresetId, context) (existing static path)
 */
export function playActionVfx(options: PlayActionVfxOptions): VfxPlayResult {
  const { actionKey, fallbackPresetId, context, vfxSystem, scaleFactors, unitMotion, applyCasterMotion } = options;

  const draft = getPublishedDraft(actionKey);
  if (!draft) {
    return vfxSystem.play(fallbackPresetId, context);
  }

  // Compile the published draft using the SAME resolvers as Composer
  const compiled = compileDraft(draft, {
    includeTechnical: true,
    getCadence: getCandidateCadence,
    ...(scaleFactors ? { scaleFactors } : {}),
  });

  /**
   * Motion is installed immediately before the slot scheduler starts, so the
   * motion clock and the VFX clock share one origin — identical to Composer
   * Stage playback. Guarded so motion-free presets never touch the Stage.
   */
  if (!unitMotion && applyCasterMotion && compiled.casterMotion.hasEffect) {
    applyCasterMotion(compiled.casterMotion);
  }

  return playCompiledPublishedVfx(compiled, context, vfxSystem, unitMotion);
}

/**
 * Plays compiled published VFX using the SAME shared scheduler as the Composer.
 *
 * This guarantees PHASE scheduling parity: slot INVOCATION is delayed by
 * `slot.startTime`, not just the completion await. Technical effects (FLASH,
 * SHAKE, HITSTOP) are applied through context helpers at their scheduled times.
 */
function playCompiledPublishedVfx(
  compiled: CompiledVfxDraft,
  context: VfxContext,
  vfxSystem: VfxSystem,
  unitMotion?: UnitMotionRuntimeHooks,
): VfxPlayResult {
  const linkedRuntime = compiled.casterMotion.hasPresentation ? unitMotion : undefined;
  const vfxPromise = (async () => {
    if (linkedRuntime) {
      linkedRuntime.install(compiled.casterMotion);
      if (!compiled.hasExplicitBeats) {
        await Promise.all(compiled.casterMotion.steps.map((step) => Promise.resolve(linkedRuntime.applyStep(step))));
      }
    }
    if (compiled.hasExplicitBeats) {
      await playCompiledBeats(vfxSystem, compiled, context, false, linkedRuntime);
    } else {
      await playCompiledVfxSlots(vfxSystem, compiled, context, false);
    }
  })();
  const techPromise = playCompiledTechnical(compiled, context);
  const completion = Promise.all([vfxPromise, techPromise])
    .then(() => undefined)
    .finally(() => linkedRuntime?.cleanup());

  return {
    played: compiled.slots.length > 0,
    presetId: compiled.presetId,
    impactTime: compiled.impactTime,
    completion,
  };
}

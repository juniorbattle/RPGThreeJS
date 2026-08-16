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
import { buildLabSheetDefinition } from './VfxSpriteSheets';
import { getCandidateInventoryRecord } from './VfxResourceManager';
import { getCandidateCadence, buildSlotOverrides } from './VfxComposerPlayback';
import {
  compileDraft,
  resolveSlotScale,
  computeFinalDisplayHeight,
} from './VfxPresetComposer';
import type { CompiledVfxDraft, CompiledVfxSlot, VfxPresetDraft, VfxRuntimeScaleFactors } from './VfxPresetComposer';
import {
  getPublishedEntry,
  publishedEntryToDraft,
  publishedPresetId,
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
  const { actionKey, fallbackPresetId, context, vfxSystem, scaleFactors } = options;

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

  return playCompiledPublishedVfx(compiled, context, vfxSystem);
}

/**
 * Plays compiled published VFX slots using the same playLabSpriteSheet
 * path as the Composer. Technical effects are applied through context helpers.
 */
function playCompiledPublishedVfx(
  compiled: CompiledVfxDraft,
  context: VfxContext,
  vfxSystem: VfxSystem,
): VfxPlayResult {
  const slotResults: Array<Promise<void>> = [];
  const technicalPromises: Array<Promise<void>> = [];

  const startTime = performance.now();

  for (const slot of compiled.slots) {
    const record = getCandidateInventoryRecord(slot.candidateId);
    if (!record) {
      console.warn(`[PublishedVfx] Missing inventory record for ${slot.candidateId}, skipping slot.`);
      continue;
    }

    const sheetDef = buildLabSheetDefinition(slot.candidateId, record);
    const step = buildPublishedSlotStep(slot);
    const result = vfxSystem.playLabSpriteSheet(
      slot.candidateId,
      sheetDef,
      step,
      context,
      // Identical override construction as the Composer — no gameplay-only variant.
      buildSlotOverrides(slot),
    );
    slotResults.push(
      new Promise<void>((resolve) => {
        // Delay by startTime, then await completion
        const delayMs = slot.startTime * 1000;
        if (delayMs > 0) {
          setTimeout(() => {
            result.completion.then(resolve).catch(resolve);
          }, delayMs);
        } else {
          result.completion.then(resolve).catch(resolve);
        }
      }),
    );
  }

  // Technical effects through context helpers
  const helpers = context.helpers;
  if (helpers) {
    for (const effect of compiled.technical) {
      technicalPromises.push(
        new Promise<void>((resolve) => {
          const delayMs = effect.startTime * 1000;
          setTimeout(() => {
            if (effect.type === 'screenFlash') {
              helpers.screenFlash?.(effect.color ?? '#ffffff', effect.opacity ?? 0.2);
            } else if (effect.type === 'screenShake') {
              helpers.screenShake?.(effect.scale ?? 0.15, effect.duration);
            }
            resolve();
          }, delayMs);
        }),
      );
    }
  }

  const allPromises = [...slotResults, ...technicalPromises];
  const completion = Promise.all(allPromises).then(() => undefined);

  return {
    played: compiled.slots.length > 0,
    presetId: compiled.presetId,
    impactTime: compiled.impactTime,
    completion,
  };
}

/**
 * Builds a synthetic VfxStep for a compiled published slot.
 * Same shape as the Composer's buildSlotStep.
 */
function buildPublishedSlotStep(slot: CompiledVfxSlot): import('./VfxTypes').VfxStep {
  return {
    id: slot.slotId,
    type: 'spriteSheet',
    anchor: slot.anchor,
    targetAnchor: 'target',
    startTime: 0,
    duration: slot.duration,
    scale: 1,
    opacity: 1,
    orientation: slot.orientation,
    blending: slot.blending,
  };
}

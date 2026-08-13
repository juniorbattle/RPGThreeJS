/**
 * R2C-VFX LAB V2 — Composer draft store + playback.
 *
 * DURABLE STATE MODEL
 * -------------------
 *   repository / exported JSON bundle
 *           ↓  explicit import
 *   in-memory draft store
 *           ↓  SAVE DRAFT
 *   localStorage cache for THAT browser
 *
 * localStorage is a runtime cache, never the only durable source. Drafts are
 * always serializable to portable JSON (see `serializeDraftBundle`).
 *
 * PLAYBACK
 * --------
 *   PLAY VISUALS ONLY — CartoonCoffee visual slots only. No screenFlash,
 *                       screenShake or hitStop. This is the critical debugging
 *                       feature: it proves whether the actual spritesheet is
 *                       visible independently of technical polish.
 *   PLAY FULL PRESET  — visual slots + technical polish.
 *
 * Neither mode mutates production presets, sprite sheet registrations, skill
 * mappings, or gameplay state.
 */

import type { VfxSystem } from './VfxSystem';
import type { VfxContext, VfxStep } from './VfxTypes';
import { buildLabSheetDefinition } from './VfxSpriteSheets';
import { getCandidateInventoryRecord } from './VfxResourceManager';
import {
  compileDraft,
  restoreDraftBundle,
  serializeDraftBundle,
  validateDraft,
} from './VfxPresetComposer';
import type {
  CompiledVfxDraft,
  CompiledVfxSlot,
  VfxNativeCadence,
  VfxPresetDraft,
  VfxRuntimeScaleFactors,
} from './VfxPresetComposer';

// ============================================================ Draft Store

export const COMPOSER_STORAGE_KEY = 'r2c-vfx-composer-drafts';

export interface ComposerStore {
  drafts: Record<string, VfxPresetDraft>;
  selectedActionKey?: string;
}

export function createEmptyComposerStore(): ComposerStore {
  return { drafts: {} };
}

export function getDraft(store: ComposerStore, actionKey: string): VfxPresetDraft | undefined {
  return store.drafts[actionKey];
}

export function putDraft(store: ComposerStore, draft: VfxPresetDraft): ComposerStore {
  return { ...store, drafts: { ...store.drafts, [draft.actionKey]: draft } };
}

export function deleteDraft(store: ComposerStore, actionKey: string): ComposerStore {
  const drafts = { ...store.drafts };
  delete drafts[actionKey];
  return { ...store, drafts };
}

export function setSelectedActionKey(store: ComposerStore, actionKey: string): ComposerStore {
  return { ...store, selectedActionKey: actionKey };
}

export function serializeComposerStore(store: ComposerStore): string {
  return JSON.stringify(store);
}

export function deserializeComposerStore(raw: string): ComposerStore | null {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const rawDrafts = (parsed as { drafts?: unknown }).drafts;
    if (typeof rawDrafts !== 'object' || rawDrafts === null) return null;
    const drafts: Record<string, VfxPresetDraft> = {};
    for (const [actionKey, value] of Object.entries(rawDrafts as Record<string, unknown>)) {
      if (validateDraft(value)) drafts[actionKey] = value;
    }
    const selected = (parsed as { selectedActionKey?: unknown }).selectedActionKey;
    return {
      drafts,
      ...(typeof selected === 'string' ? { selectedActionKey: selected } : {}),
    };
  } catch {
    return null;
  }
}

export function loadComposerStore(storage: Storage): ComposerStore {
  const raw = storage.getItem(COMPOSER_STORAGE_KEY);
  if (raw) {
    const parsed = deserializeComposerStore(raw);
    if (parsed) return parsed;
  }
  return createEmptyComposerStore();
}

export function saveComposerStore(storage: Storage, store: ComposerStore): void {
  storage.setItem(COMPOSER_STORAGE_KEY, serializeComposerStore(store));
}

/** Portable export of every draft in the store. */
export function exportComposerDrafts(store: ComposerStore): string {
  return serializeDraftBundle(store.drafts);
}

export interface ComposerImportResult {
  ok: boolean;
  store?: ComposerStore;
  imported?: number;
  skipped?: string[];
  error?: string;
}

/** Explicit portable import. Merges over existing drafts by actionKey. */
export function importComposerDrafts(store: ComposerStore, raw: string): ComposerImportResult {
  const result = restoreDraftBundle(raw);
  if (!result.ok || !result.drafts) {
    return { ok: false, error: result.error, ...(result.skipped ? { skipped: result.skipped } : {}) };
  }
  return {
    ok: true,
    store: { ...store, drafts: { ...store.drafts, ...result.drafts } },
    imported: Object.keys(result.drafts).length,
    ...(result.skipped ? { skipped: result.skipped } : {}),
  };
}

// ============================================================ Cadence Lookup

/**
 * Native cadence for a CartoonCoffee candidate, read from the corrected
 * inventory. 2048px sources run at 50ms/frame, 4096px at 20ms/frame — the same
 * rule `buildLabSheetDefinition` applies.
 */
export function getCandidateCadence(candidateId: string): VfxNativeCadence | null {
  const record = getCandidateInventoryRecord(candidateId);
  if (!record) return null;
  return {
    frameCount: record.nativeFrameCount,
    frameDurationMs: record.width === 2048 ? 50 : 20,
  };
}

/**
 * True when a slot's source is a real CartoonCoffee inventory candidate and can
 * therefore be rendered by the Composer's candidate playback path.
 *
 * Migrated drafts may still reference a legacy production sprite sheet id when
 * the action never received a megapack candidate. Such a slot would render
 * nothing, so the UI flags it and invites REPLACE instead of failing silently.
 */
export function isSlotPlayable(candidateId: string): boolean {
  return getCandidateInventoryRecord(candidateId) !== null;
}

/** Candidate ids in a draft that cannot be rendered by the Composer. */
export function unplayableSlotCandidates(draft: VfxPresetDraft): string[] {
  return draft.visualSlots
    .filter((slot) => !isSlotPlayable(slot.candidateId))
    .map((slot) => slot.candidateId);
}

// ============================================================ Playback

export type ComposerPlaybackMode = 'visuals_only' | 'full_preset';

export interface ComposerPlaybackSnapshot {
  mode: ComposerPlaybackMode;
  actionKey: string;
  presetId: string;
  choreography: string;
  slotCount: number;
  totalDuration: number;
  technicalEffectCount: number;
  compiled: CompiledVfxDraft;
}

export interface ComposerPlaybackContext {
  vfxSystem: VfxSystem;
  buildContext: (actionKey: string) => VfxContext | null;
  buildStageContext?: (
    actionKey: string,
    playVfx: (context: VfxContext) => Promise<void>,
  ) => Promise<boolean>;
  /** Runtime scale factors for the current action tier. Defaults to neutral. */
  scaleFactors?: VfxRuntimeScaleFactors;
}

let _lastComposerSnapshot: ComposerPlaybackSnapshot | null = null;

export function getLastComposerSnapshot(): ComposerPlaybackSnapshot | null {
  return _lastComposerSnapshot;
}

/**
 * Builds a synthetic single-slot VfxStep for `playLabSpriteSheet`.
 * Neutral scale/opacity of 1 so the compiled overrides fully determine output.
 */
function buildSlotStep(slot: CompiledVfxSlot): VfxStep {
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

const wait = (seconds: number) => new Promise<void>((resolve) => {
  if (seconds <= 0) { resolve(); return; }
  setTimeout(resolve, seconds * 1000);
});

/** Plays every compiled visual slot, honouring the choreography start times. */
async function playCompiledSlots(
  ctx: ComposerPlaybackContext,
  compiled: CompiledVfxDraft,
  context: VfxContext,
): Promise<void> {
  await Promise.all(compiled.slots.map(async (slot) => {
    const record = getCandidateInventoryRecord(slot.candidateId);
    if (!record) return;
    await wait(slot.startTime);
    const sheetDef = buildLabSheetDefinition(slot.candidateId, record);
    const result = ctx.vfxSystem.playLabSpriteSheet(
      slot.candidateId,
      sheetDef,
      buildSlotStep(slot),
      context,
      {
        scale: slot.scale,
        offsetX: slot.offsetX,
        offsetY: slot.offsetY,
        duration: slot.duration,
        opacity: slot.opacity,
        layer: slot.layer,
        blending: slot.blending,
        fadeIn: slot.fadeIn,
        fadeOut: slot.fadeOut,
      },
    );
    await result.completion;
  }));
}

/** Applies compiled technical polish through the runtime helper hooks. */
async function playCompiledTechnical(
  compiled: CompiledVfxDraft,
  context: VfxContext,
): Promise<void> {
  const helpers = context.helpers;
  if (!helpers) return;
  await Promise.all(compiled.technical.map(async (effect) => {
    await wait(effect.startTime);
    if (effect.type === 'screenFlash') {
      helpers.screenFlash?.(effect.color ?? '#ffffff', effect.opacity ?? 0.2);
    } else if (effect.type === 'screenShake') {
      helpers.screenShake?.(effect.scale ?? 0.15, effect.duration);
    }
    // hitStop is a pacing-only effect; the composer records it in the snapshot
    // but never stalls gameplay from the Lab.
  }));
}

export interface ComposerPlaybackResult {
  played: boolean;
  snapshot: ComposerPlaybackSnapshot | null;
  reason?: string;
}

function compileForMode(
  draft: VfxPresetDraft,
  mode: ComposerPlaybackMode,
  scaleFactors?: VfxRuntimeScaleFactors,
): CompiledVfxDraft {
  return compileDraft(draft, {
    includeTechnical: mode === 'full_preset',
    getCadence: getCandidateCadence,
    ...(scaleFactors ? { scaleFactors } : {}),
  });
}

function buildSnapshot(mode: ComposerPlaybackMode, compiled: CompiledVfxDraft): ComposerPlaybackSnapshot {
  return {
    mode,
    actionKey: compiled.actionKey,
    presetId: compiled.presetId,
    choreography: compiled.choreography,
    slotCount: compiled.slots.length,
    totalDuration: compiled.totalDuration,
    technicalEffectCount: compiled.technical.length,
    compiled,
  };
}

/**
 * PLAY VISUALS ONLY — plays only the CartoonCoffee visual slots.
 * Guarantees zero technical effects.
 */
export function playDraftVisualsOnly(
  ctx: ComposerPlaybackContext,
  draft: VfxPresetDraft,
): ComposerPlaybackResult {
  if (draft.visualSlots.length === 0) {
    return { played: false, snapshot: null, reason: 'Draft has no visual spritesheets.' };
  }
  const context = ctx.buildContext(draft.actionKey);
  if (!context) {
    return { played: false, snapshot: null, reason: 'Playback context unavailable.' };
  }
  const compiled = compileForMode(draft, 'visuals_only', ctx.scaleFactors);
  const snapshot = buildSnapshot('visuals_only', compiled);
  _lastComposerSnapshot = snapshot;
  void playCompiledSlots(ctx, compiled, context);
  return { played: true, snapshot };
}

/** PLAY FULL PRESET — visual slots + technical polish. */
export function playDraftFull(
  ctx: ComposerPlaybackContext,
  draft: VfxPresetDraft,
): ComposerPlaybackResult {
  if (draft.visualSlots.length === 0) {
    return { played: false, snapshot: null, reason: 'Draft has no visual spritesheets.' };
  }
  const context = ctx.buildContext(draft.actionKey);
  if (!context) {
    return { played: false, snapshot: null, reason: 'Playback context unavailable.' };
  }
  const compiled = compileForMode(draft, 'full_preset', ctx.scaleFactors);
  const snapshot = buildSnapshot('full_preset', compiled);
  _lastComposerSnapshot = snapshot;
  void Promise.all([
    playCompiledSlots(ctx, compiled, context),
    playCompiledTechnical(compiled, context),
  ]);
  return { played: true, snapshot };
}

/** Plays a draft inside the REAL Combat Stage for full-scene evaluation. */
export async function playDraftInCombatStage(
  ctx: ComposerPlaybackContext,
  draft: VfxPresetDraft,
  mode: ComposerPlaybackMode,
): Promise<ComposerPlaybackResult> {
  if (draft.visualSlots.length === 0) {
    return { played: false, snapshot: null, reason: 'Draft has no visual spritesheets.' };
  }
  if (!ctx.buildStageContext) {
    return { played: false, snapshot: null, reason: 'Combat Stage unavailable.' };
  }
  const compiled = compileForMode(draft, mode, ctx.scaleFactors);
  const snapshot = buildSnapshot(mode, compiled);
  _lastComposerSnapshot = snapshot;

  const playVfx = async (context: VfxContext): Promise<void> => {
    if (mode === 'full_preset') {
      await Promise.all([
        playCompiledSlots(ctx, compiled, context),
        playCompiledTechnical(compiled, context),
      ]);
    } else {
      await playCompiledSlots(ctx, compiled, context);
    }
  };

  const entered = await ctx.buildStageContext(draft.actionKey, playVfx);
  return { played: entered, snapshot: entered ? snapshot : null };
}

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

import type { VfxSystem, VfxLabPlaybackOverrides } from './VfxSystem';
import type { VfxContext, VfxStep } from './VfxTypes';
import { buildLabSheetDefinition } from './VfxSpriteSheets';
import { getCandidateInventoryRecord } from './VfxResourceManager';
import {
  compileDraft,
  restoreDraftBundle,
  serializeDraftBundle,
  validateDraft,
} from './VfxPresetComposer';
import { repairComposerDraftAssignments } from './VfxSourceSuitability';
import type { CompiledCasterMotion } from './CasterMotion';
import { computeFingerprint } from './PublishedVfxRegistry';
import {
  CARTOONCOFFEE_UNIVERSAL_FRAME_DELAY_MS,
} from './VfxPresetComposer';
import type {
  CompiledVfxDraft,
  CompiledVfxSlot,
  CompiledBeat,
  VfxNativeCadence,
  VfxPresetDraft,
  VfxRuntimeScaleFactors,
} from './VfxPresetComposer';
import cadenceIndexData from '../../../docs/reports/vfx-cadence-index.json';

// ============================================================ Draft Store

export const COMPOSER_STORAGE_KEY = 'r2c-vfx-composer-drafts';

// ============================================================ UI Preferences

/**
 * Composer UI preferences — display-mode only. Kept strictly separate from the
 * portable artistic draft schema so that export/import of drafts never carries
 * UI state.
 */
export const COMPOSER_UI_PREFS_KEY = 'r2c-vfx-composer-ui-prefs';

export type ComposerDisplayMode = 'expanded' | 'minimized';

/** V2.6.3 — authoring scope is a UI preference only, never preset data. */
export type ComposerAuthoringScope = 'DEMO' | 'UPCOMING';

export interface ComposerUiPrefs {
  displayMode: ComposerDisplayMode;
  authoringScope: ComposerAuthoringScope;
}

export function loadComposerUiPrefs(storage: Storage): ComposerUiPrefs {
  let displayMode: ComposerDisplayMode = 'expanded';
  let authoringScope: ComposerAuthoringScope = 'DEMO';
  try {
    const raw = storage.getItem(COMPOSER_UI_PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ComposerUiPrefs>;
      if (parsed.displayMode === 'expanded' || parsed.displayMode === 'minimized') {
        displayMode = parsed.displayMode;
      }
      if (parsed.authoringScope === 'DEMO' || parsed.authoringScope === 'UPCOMING') {
        authoringScope = parsed.authoringScope;
      }
    }
  } catch {
    /* fall through to defaults */
  }
  return { displayMode, authoringScope };
}

export function saveComposerUiPrefs(storage: Storage, prefs: ComposerUiPrefs): void {
  storage.setItem(COMPOSER_UI_PREFS_KEY, JSON.stringify(prefs));
}

export interface ComposerStore {
  drafts: Record<string, VfxPresetDraft>;
  selectedActionKey?: string;
  /** V2.6.2 — Authoring workflow metadata: fingerprints recorded at explicit SAVE DRAFT time. */
  savedFingerprints?: Record<string, string>;
}

export function createEmptyComposerStore(): ComposerStore {
  return { drafts: {}, savedFingerprints: {} };
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
  const savedFingerprints = { ...(store.savedFingerprints ?? {}) };
  delete savedFingerprints[actionKey];
  return { ...store, drafts, savedFingerprints };
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
      if (validateDraft(value)) drafts[actionKey] = repairComposerDraftAssignments(value);
    }
    const selected = (parsed as { selectedActionKey?: unknown }).selectedActionKey;
    const rawSavedFps = (parsed as { savedFingerprints?: unknown }).savedFingerprints;
    const savedFingerprints: Record<string, string> = {};
    if (typeof rawSavedFps === 'object' && rawSavedFps !== null) {
      for (const [k, v] of Object.entries(rawSavedFps as Record<string, unknown>)) {
        if (typeof v === 'string') savedFingerprints[k] = v;
      }
    }
    return {
      drafts,
      savedFingerprints,
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
    store: {
      ...store,
      drafts: {
        ...store.drafts,
        ...Object.fromEntries(Object.entries(result.drafts).map(([actionKey, draft]) => [
          actionKey,
          repairComposerDraftAssignments(draft),
        ])),
      },
    },
    imported: Object.keys(result.drafts).length,
    ...(result.skipped ? { skipped: result.skipped } : {}),
  };
}

// ============================================================ V2.6.2 Saved Fingerprint Helpers

/** Records the fingerprint of a draft at explicit SAVE DRAFT time. */
export function recordSavedFingerprint(store: ComposerStore, actionKey: string, draft: VfxPresetDraft): ComposerStore {
  const savedFingerprints = { ...(store.savedFingerprints ?? {}) };
  savedFingerprints[actionKey] = computeFingerprint(draft);
  return { ...store, savedFingerprints };
}

/** Gets the saved fingerprint for an action, or undefined if not explicitly saved. */
export function getSavedFingerprint(store: ComposerStore, actionKey: string): string | undefined {
  return store.savedFingerprints?.[actionKey];
}

/** Clears the saved fingerprint for an action (e.g. after draft deletion). */
export function clearSavedFingerprint(store: ComposerStore, actionKey: string): ComposerStore {
  const savedFingerprints = { ...(store.savedFingerprints ?? {}) };
  delete savedFingerprints[actionKey];
  return { ...store, savedFingerprints };
}

/** Saved status for batch publication eligibility. */
export type SavedStatus = 'NOT_SAVED' | 'READY' | 'MODIFIED_SINCE_SAVE';

/** Derives the saved status of a draft by comparing its current fingerprint to the saved one. */
export function getSavedStatus(store: ComposerStore, actionKey: string, draft: VfxPresetDraft): SavedStatus {
  const savedFp = getSavedFingerprint(store, actionKey);
  if (!savedFp) return 'NOT_SAVED';
  return savedFp === computeFingerprint(draft) ? 'READY' : 'MODIFIED_SINCE_SAVE';
}

// ============================================================ Cadence Lookup

interface CadenceIndexEntry {
  /** GIF preview reference duration in milliseconds (sum of frame delays). */
  referenceDurationMs: number;
  gifFrameCount: number;
  frameDelayMs: number;
  atlasFrameCount: number | null;
  atlasWidth: number;
}

interface CadenceIndexJson {
  generatedAt: string;
  source: string;
  totalCandidates: number;
  universalDelayMs: number;
  fallbackRule: string;
  index: Record<string, CadenceIndexEntry>;
}

const cadenceIndex = cadenceIndexData as CadenceIndexJson;

/**
 * GIF preview reference cadence for a CartoonCoffee candidate. The V2.2.5
 * cadence forensics proved that ALL 1973 CartoonCoffee preview GIFs use
 * 40ms/frame uniformly. The cadence index stores the per-candidate GIF
 * preview reference duration extracted from frame delays.
 *
 * This is a preview-generation reference cadence, not proven to be original
 * CartoonCoffee authoring metadata.
 *
 * For candidates without a GIF preview, falls back to an inferred reference:
 *   atlasFrameCount × 40ms (the universal preview GIF per-frame delay)
 */
export function getCandidateCadence(candidateId: string): VfxNativeCadence | null {
  const record = getCandidateInventoryRecord(candidateId);
  if (!record) return null;

  const entry = cadenceIndex.index[candidateId];
  if (entry && entry.referenceDurationMs > 0) {
    // Use GIF preview reference duration, distributed across all atlas frames.
    // This preserves the reference timing while ensuring every atlas frame is traversed.
    return {
      frameCount: record.nativeFrameCount,
      frameDurationMs: entry.referenceDurationMs / record.nativeFrameCount,
    };
  }

  // Fallback: inferred reference cadence — atlasFrameCount × 40ms
  return {
    frameCount: record.nativeFrameCount,
    frameDurationMs: CARTOONCOFFEE_UNIVERSAL_FRAME_DELAY_MS,
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
  /**
   * Installs a compiled CASTER MOTION plan on the live Combat Stage.
   *
   * ADDITIVE and OPTIONAL: when the host does not provide it, caster motion is
   * simply not presented and every existing playback path is unchanged.
   */
  applyCasterMotion?: (motion: CompiledCasterMotion) => void;
}

let _lastComposerSnapshot: ComposerPlaybackSnapshot | null = null;

export function getLastComposerSnapshot(): ComposerPlaybackSnapshot | null {
  return _lastComposerSnapshot;
}

/**
 * Builds a synthetic single-slot VfxStep for `playLabSpriteSheet`.
 * Neutral scale/opacity of 1 so the compiled overrides fully determine output.
 */
export function buildSlotStep(slot: CompiledVfxSlot): VfxStep {
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

export const wait = (seconds: number) => new Promise<void>((resolve) => {
  if (seconds <= 0) { resolve(); return; }
  setTimeout(resolve, seconds * 1000);
});

/**
 * Runtime overrides for one compiled slot. Shared by the Composer and the
 * published gameplay resolver so both paths are byte-identical.
 */
export function buildSlotOverrides(slot: CompiledVfxSlot): VfxLabPlaybackOverrides {
  return {
    scale: slot.scale,
    offsetX: slot.offsetX,
    offsetY: slot.offsetY,
    duration: slot.duration,
    opacity: slot.opacity,
    layer: slot.layer,
    blending: slot.blending,
    fadeIn: slot.fadeIn,
    fadeOut: slot.fadeOut,
    mirrorX: slot.mirrorX,
    mirrorY: slot.mirrorY,
    autoMirrorHorizontal: slot.autoMirrorHorizontal,
    pivotCenterX: slot.pivotCenterX,
    pivotCenterY: slot.pivotCenterY,
    rotationOffset: slot.rotation,
    directionProfile: slot.aimProfile,
    positionMode: slot.positionMode,
    ...(slot.travelFromAnchor ? { travelFromAnchor: slot.travelFromAnchor } : {}),
    ...(slot.travelToAnchor ? { travelToAnchor: slot.travelToAnchor } : {}),
    ...(slot.trajectoryProfile ? { trajectoryProfile: slot.trajectoryProfile } : {}),
  };
}

/**
 * Plays every compiled visual slot, honouring the resolved phase start times.
 *
 * SHARED SCHEDULER — used by both Composer playback and PublishedVfxResolver.
 * The slot INVOCATION is delayed by `slot.startTime`, not just the completion
 * await. This guarantees PHASE scheduling parity between Composer and production.
 */
export async function playCompiledVfxSlots(
  vfxSystem: VfxSystem,
  compiled: CompiledVfxDraft,
  context: VfxContext,
  strict: boolean = false,
): Promise<void> {
  await Promise.all(compiled.slots.map(async (slot) => {
    const record = getCandidateInventoryRecord(slot.candidateId);
    if (!record) {
      if (strict) throw new Error(`Missing inventory record for candidate ${slot.candidateId}`);
      console.warn(`[VFX] Missing inventory record for ${slot.candidateId}, skipping slot.`);
      return;
    }
    await wait(slot.startTime);
    const sheetDef = buildLabSheetDefinition(slot.candidateId, record);
    const result = vfxSystem.playLabSpriteSheet(
      slot.candidateId,
      sheetDef,
      buildSlotStep(slot),
      context,
      buildSlotOverrides(slot),
      strict ? { strict: true } : undefined,
    );
    await result.completion;
  }));
}

/**
 * V2.7 CHOREOGRAPHY BEAT SCHEDULER — the causal beat-by-beat runtime.
 *
 * For each beat:
 *   1. Start ALL VFX participants simultaneously (no delay between them).
 *   2. Wait for the beat duration (max of all participant durations, including
 *      motion). This is the CAUSAL BARRIER — no participant in beat N+1 can
 *      start before all participants in beat N have completed.
 *   3. Proceed to the next beat.
 *
 * Motion is NOT started here — it is installed once at the beginning via
 * `setCasterMotion` and runs in the Stage's frame loop. The motion steps have
 * beat-assigned startTimes, so they naturally start at beat boundaries.
 *
 * When no explicit beats are authored, this function is not called — the
 * legacy `playCompiledVfxSlots` path is used instead.
 */
export async function playCompiledBeats(
  vfxSystem: VfxSystem,
  compiled: CompiledVfxDraft,
  context: VfxContext,
  strict: boolean = false,
): Promise<void> {
  for (const beat of compiled.compiledBeats) {
    // Start all VFX participants simultaneously at beat start.
    const vfxPromises = beat.vfxSlots.map(async (slot) => {
      const record = getCandidateInventoryRecord(slot.candidateId);
      if (!record) {
        if (strict) throw new Error(`Missing inventory record for candidate ${slot.candidateId}`);
        console.warn(`[VFX] Missing inventory record for ${slot.candidateId}, skipping slot.`);
        return;
      }
      const sheetDef = buildLabSheetDefinition(slot.candidateId, record);
      const result = vfxSystem.playLabSpriteSheet(
        slot.candidateId,
        sheetDef,
        buildSlotStep(slot),
        context,
        buildSlotOverrides(slot),
        strict ? { strict: true } : undefined,
      );
      return result.completion;
    });

    // CAUSAL BARRIER: wait for the longest participant (VFX or motion).
    // VFX promises resolve when their animation completes.
    // wait(beat.duration) covers the motion duration (motion runs in the frame loop).
    await Promise.all([
      Promise.all(vfxPromises),
      wait(beat.duration),
    ]);
  }
}

/** Applies compiled technical effects through the runtime helper hooks. */
export async function playCompiledTechnical(
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
    } else if (effect.type === 'hitStop') {
      // HITSTOP: presentation-only pause. If the helper is absent, fail safely
      // with an async wait-only fallback so timing stays correct without
      // blocking other effects or crashing combat.
      if (helpers.hitStop) {
        await Promise.resolve(helpers.hitStop(effect.duration));
      } else {
        await wait(effect.duration);
      }
    }
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
 *
 * Awaits actual playback completion. Returns played:false if any slot
 * fails to load or render.
 */
export async function playDraftVisualsOnly(
  ctx: ComposerPlaybackContext,
  draft: VfxPresetDraft,
): Promise<ComposerPlaybackResult> {
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
  try {
    if (compiled.hasExplicitBeats) {
      await playCompiledBeats(ctx.vfxSystem, compiled, context, true);
    } else {
      await playCompiledVfxSlots(ctx.vfxSystem, compiled, context, true);
    }
    return { played: true, snapshot };
  } catch (error) {
    return { played: false, snapshot, reason: error instanceof Error ? error.message : 'Playback failed' };
  }
}

/** PLAY FULL PRESET — visual slots + technical polish.
 *
 * Awaits actual playback completion. Returns played:false if any slot
 * or technical effect fails.
 */
export async function playDraftFull(
  ctx: ComposerPlaybackContext,
  draft: VfxPresetDraft,
): Promise<ComposerPlaybackResult> {
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
  try {
    const vfxTask = compiled.hasExplicitBeats
      ? playCompiledBeats(ctx.vfxSystem, compiled, context, true)
      : playCompiledVfxSlots(ctx.vfxSystem, compiled, context, true);
    await Promise.all([vfxTask, playCompiledTechnical(compiled, context)]);
    return { played: true, snapshot };
  } catch (error) {
    return { played: false, snapshot, reason: error instanceof Error ? error.message : 'Playback failed' };
  }
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
    /**
     * The motion clock starts HERE, at the same instant as the visual slot
     * scheduler, so an authored "VFX → MOTION → VFX" sequence plays on one
     * shared timeline. An empty plan is a no-op.
     */
    ctx.applyCasterMotion?.(compiled.casterMotion);
    if (compiled.hasExplicitBeats) {
      // V2.7 BEAT SCHEDULER — causal beat-by-beat execution.
      const vfxTask = playCompiledBeats(ctx.vfxSystem, compiled, context, true);
      if (mode === 'full_preset') {
        await Promise.all([vfxTask, playCompiledTechnical(compiled, context)]);
      } else {
        await vfxTask;
      }
    } else {
      // LEGACY PHASE SCHEDULER — independent slot startTimes. Unchanged.
      if (mode === 'full_preset') {
        await Promise.all([
          playCompiledVfxSlots(ctx.vfxSystem, compiled, context, true),
          playCompiledTechnical(compiled, context),
        ]);
      } else {
        await playCompiledVfxSlots(ctx.vfxSystem, compiled, context, true);
      }
    }
  };

  try {
    const entered = await ctx.buildStageContext(draft.actionKey, playVfx);
    return { played: entered, snapshot: entered ? snapshot : null };
  } catch (error) {
    return { played: false, snapshot, reason: error instanceof Error ? error.message : 'Stage playback failed' };
  }
}

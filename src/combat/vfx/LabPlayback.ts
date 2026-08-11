/**
 * R2C-LAB V1C — Lab Playback orchestrator.
 *
 * Coordinates production, QA override, and validated playback through the real
 * VfxSystem and VfxResourceManager. Does NOT execute gameplay (no damage, AP, turns, AI).
 *
 * The Lab exercises the REAL presentation route:
 *   ACTION → production preset → Stage/Tactical route → VfxSystem → VfxResourceManager
 *
 * For QA override, the target step's source and presentation parameters are
 * replaced with Lab QA state. Other steps remain production.
 *
 * For validated playback, the immutable validated snapshot is used instead of
 * mutable QA working state.
 */

import type { VfxSystem } from './VfxSystem';
import type { VfxContext, VfxStep, VfxPreset } from './VfxTypes';
import { getVfxPreset } from './VfxPresets';
import { VFX_SPRITE_SHEETS, buildLabSheetDefinition } from './VfxSpriteSheets';
import { getCandidateInventoryRecord } from './VfxResourceManager';
import {
  getLabAction,
  getQaSourceId,
  getQaPresentation,
  getProductionPresentation,
  getEffectivePresentation,
  getSelectedVisualStepIndex,
  getValidatedConfig,
} from './CombatVfxLab';
import type { LabState, LabPresentationOverride, LabAction, ValidatedStepConfiguration } from './CombatVfxLab';

export type LabPlaybackMode = 'production' | 'qa' | 'validated' | 'qa_stage';

export interface LabPlaybackSnapshot {
  mode: LabPlaybackMode;
  actionKey: string;
  stepIndex: number;
  source: string;
  route: string;
  direction: string;
  presentation: LabPresentationOverride;
}

export interface LabPlaybackContext {
  vfxSystem: VfxSystem;
  buildContext: (actionKey: string) => VfxContext | null;
  /**
   * DEV-ONLY: Enters the real Combat Stage for forced Stage preview, plays
   * the QA VFX, then exits the Stage cleanly. Returns null if the Stage
   * cannot be entered (e.g. no combat units available).
   *
   * The callback receives a VfxContext built inside the Stage scene/camera
   * and must play the VFX through it. The callback's completion promise is
   * awaited before exiting the Stage.
   */
  buildStageContext?: (actionKey: string, playVfx: (context: VfxContext) => Promise<void>) => Promise<boolean>;
}

let _lastSnapshot: LabPlaybackSnapshot | null = null;

/**
 * Plays the production presentation for the given action.
 * Uses the real production preset, source, route, and presentation parameters.
 * Ignores Lab QA override state.
 */
export function playProduction(
  ctx: LabPlaybackContext,
  state: LabState,
  actionKey: string,
): { played: boolean; snapshot: LabPlaybackSnapshot | null } {
  const action = getLabAction(actionKey);
  if (!action || !action.currentPresetId) {
    return { played: false, snapshot: null };
  }
  const preset = getVfxPreset(action.currentPresetId);
  if (!preset) {
    return { played: false, snapshot: null };
  }
  const context = ctx.buildContext(actionKey);
  if (!context) {
    return { played: false, snapshot: null };
  }
  const stepIndex = getSelectedVisualStepIndex(state, action);
  const step = action.vfxSteps[stepIndex];
  const source = step?.sourceCandidateId ?? step?.spriteSheetId ?? 'none';
  const presentation = step ? getProductionPresentation(step) : {};
  const snapshot: LabPlaybackSnapshot = {
    mode: 'production',
    actionKey,
    stepIndex,
    source,
    route: action.route,
    direction: step?.orientation ?? 'AUTO',
    presentation,
  };
  _lastSnapshot = snapshot;
  const result = ctx.vfxSystem.play(action.currentPresetId, context);
  void result.completion;
  return { played: result.played, snapshot };
}

/**
 * Plays the QA override presentation for the given action's selected step.
 * Uses the same route and context as production, but replaces the target
 * step's source and presentation parameters with Lab QA state.
 *
 * If no QA source is set, falls back to production presentation for that step
 * (but still applies any QA presentation overrides).
 */
export function playQaOverride(
  ctx: LabPlaybackContext,
  state: LabState,
  actionKey: string,
): { played: boolean; snapshot: LabPlaybackSnapshot | null } {
  const action = getLabAction(actionKey);
  if (!action || !action.currentPresetId) {
    return { played: false, snapshot: null };
  }
  const preset = getVfxPreset(action.currentPresetId);
  if (!preset) {
    return { played: false, snapshot: null };
  }
  const context = ctx.buildContext(actionKey);
  if (!context) {
    return { played: false, snapshot: null };
  }
  const stepIndex = getSelectedVisualStepIndex(state, action);
  const step = action.vfxSteps[stepIndex];
  if (!step) {
    return { played: false, snapshot: null };
  }
  const qaSourceId = getQaSourceId(state, actionKey, stepIndex);
  const qaPres = getQaPresentation(state, actionKey, stepIndex);
  const effectivePres = getEffectivePresentation(state, action, stepIndex);
  const snapshot: LabPlaybackSnapshot = {
    mode: 'qa',
    actionKey,
    stepIndex,
    source: qaSourceId ?? step.sourceCandidateId ?? step.spriteSheetId ?? 'none',
    route: action.route,
    direction: effectivePres.direction ?? 'AUTO',
    presentation: effectivePres,
  };
  _lastSnapshot = snapshot;

  // If QA source is a candidate (not in production VFX_SPRITE_SHEETS), use Lab playback
  if (qaSourceId && step.spriteSheetId) {
    const prodSheet = VFX_SPRITE_SHEETS[step.spriteSheetId as keyof typeof VFX_SPRITE_SHEETS];
    if (prodSheet && prodSheet.sourceCandidateId !== qaSourceId) {
      // QA source is a different candidate — use Lab candidate playback
      const invRecord = getCandidateInventoryRecord(qaSourceId);
      if (invRecord) {
        const sheetDef = buildLabSheetDefinition(qaSourceId, invRecord);
        const prodStep = preset.steps[stepIndex];
        if (prodStep) {
          const result = ctx.vfxSystem.playLabSpriteSheet(qaSourceId, sheetDef, prodStep, context, {
            scale: qaPres?.scale,
            offsetX: qaPres?.offsetX,
            offsetY: qaPres?.offsetY,
            duration: qaPres?.duration,
            opacity: qaPres?.opacity,
            layer: qaPres?.layer,
            blending: qaPres?.blending,
            fadeIn: qaPres?.fadeIn,
            fadeOut: qaPres?.fadeOut,
          });
          void result.completion;
          return { played: result.played, snapshot };
        }
      }
    }
  }

  // No QA candidate source, or QA source is a production sheet — play modified preset
  const modifiedPreset = applyQaOverridesToPreset(preset, stepIndex, qaPres);
  const result = ctx.vfxSystem.playPreset(modifiedPreset, context, action.currentPresetId);
  void result.completion;
  return { played: result.played, snapshot };
}

/**
 * Plays the validated configuration for the given action's selected step.
 * Uses the immutable validated snapshot — NOT mutable QA working state.
 * If no validation exists, returns played=false.
 *
 * Uses the same route and context as production. The validated source and
 * presentation parameters are applied through the real VfxSystem.
 */
export function playValidated(
  ctx: LabPlaybackContext,
  state: LabState,
  actionKey: string,
): { played: boolean; snapshot: LabPlaybackSnapshot | null } {
  const action = getLabAction(actionKey);
  if (!action || !action.currentPresetId) {
    return { played: false, snapshot: null };
  }
  const preset = getVfxPreset(action.currentPresetId);
  if (!preset) {
    return { played: false, snapshot: null };
  }
  const context = ctx.buildContext(actionKey);
  if (!context) {
    return { played: false, snapshot: null };
  }
  const stepIndex = getSelectedVisualStepIndex(state, action);
  const step = action.vfxSteps[stepIndex];
  if (!step) {
    return { played: false, snapshot: null };
  }
  const validated = getValidatedConfig(state, actionKey, stepIndex);
  if (!validated) {
    return { played: false, snapshot: null };
  }

  const snapshot: LabPlaybackSnapshot = {
    mode: 'validated',
    actionKey,
    stepIndex,
    source: validated.sourceId,
    route: action.route,
    direction: validated.presentation.direction ?? 'AUTO',
    presentation: validated.presentation,
  };
  _lastSnapshot = snapshot;

  // If validated source differs from production, use Lab candidate playback
  const prodSheet = step.spriteSheetId ? VFX_SPRITE_SHEETS[step.spriteSheetId as keyof typeof VFX_SPRITE_SHEETS] : undefined;
  const prodSourceId = prodSheet?.sourceCandidateId ?? step.sourceCandidateId ?? step.spriteSheetId;

  if (validated.sourceId !== prodSourceId) {
    const invRecord = getCandidateInventoryRecord(validated.sourceId);
    if (invRecord) {
      const sheetDef = buildLabSheetDefinition(validated.sourceId, invRecord);
      const prodStep = preset.steps[stepIndex];
      if (prodStep) {
        const result = ctx.vfxSystem.playLabSpriteSheet(validated.sourceId, sheetDef, prodStep, context, {
          scale: validated.presentation.scale,
          offsetX: validated.presentation.offsetX,
          offsetY: validated.presentation.offsetY,
          duration: validated.presentation.duration,
          opacity: validated.presentation.opacity,
          layer: validated.presentation.layer,
          blending: validated.presentation.blending,
          fadeIn: validated.presentation.fadeIn,
          fadeOut: validated.presentation.fadeOut,
        });
        void result.completion;
        return { played: result.played, snapshot };
      }
    }
  }

  // Validated source is same as production — play with validated presentation overrides
  const modifiedPreset = applyQaOverridesToPreset(preset, stepIndex, validated.presentation);
  const result = ctx.vfxSystem.playPreset(modifiedPreset, context, action.currentPresetId);
  void result.completion;
  return { played: result.played, snapshot };
}

/**
 * Replays the last playback snapshot (production, QA, or validated).
 */
export function replay(
  ctx: LabPlaybackContext,
  state: LabState,
): { played: boolean; snapshot: LabPlaybackSnapshot | null } {
  if (!_lastSnapshot) {
    return { played: false, snapshot: null };
  }
  if (_lastSnapshot.mode === 'production') {
    return playProduction(ctx, state, _lastSnapshot.actionKey);
  }
  if (_lastSnapshot.mode === 'validated') {
    return playValidated(ctx, state, _lastSnapshot.actionKey);
  }
  return playQaOverride(ctx, state, _lastSnapshot.actionKey);
}

/**
 * Returns the last playback snapshot (immutable).
 */
export function getLastPlaybackSnapshot(): LabPlaybackSnapshot | null {
  return _lastSnapshot;
}

/**
 * DEV-ONLY: Plays the current QA configuration inside the REAL Combat Stage,
 * regardless of the action's normal production route.
 *
 * This forces the QA VFX into the Stage scene/camera using the existing
 * CombatStage infrastructure. It does NOT modify production routing, skill
 * metadata, validated configs, or gameplay state.
 *
 * Requires:
 * - ctx.buildStageContext (provided by the runtime)
 * - A QA source for the selected action/step
 *
 * Returns { played: false } if no QA source, no Stage context, or no action.
 */
export async function playQaInCombatStage(
  ctx: LabPlaybackContext,
  state: LabState,
  actionKey: string,
): Promise<{ played: boolean; snapshot: LabPlaybackSnapshot | null }> {
  const action = getLabAction(actionKey);
  if (!action || !action.currentPresetId) {
    return { played: false, snapshot: null };
  }
  const preset = getVfxPreset(action.currentPresetId);
  if (!preset) {
    return { played: false, snapshot: null };
  }
  if (!ctx.buildStageContext) {
    return { played: false, snapshot: null };
  }
  const stepIndex = getSelectedVisualStepIndex(state, action);
  const step = action.vfxSteps[stepIndex];
  if (!step) {
    return { played: false, snapshot: null };
  }
  const qaSourceId = getQaSourceId(state, actionKey, stepIndex);
  if (!qaSourceId) {
    return { played: false, snapshot: null };
  }
  const qaPres = getQaPresentation(state, actionKey, stepIndex);
  const effectivePres = getEffectivePresentation(state, action, stepIndex);
  const snapshot: LabPlaybackSnapshot = {
    mode: 'qa_stage',
    actionKey,
    stepIndex,
    source: qaSourceId,
    route: 'STAGE',
    direction: effectivePres.direction ?? 'AUTO',
    presentation: effectivePres,
  };
  _lastSnapshot = snapshot;

  // Build the VFX play function that will be called inside the Stage context
  const playVfx = async (context: VfxContext): Promise<void> => {
    // If QA source is a candidate (not in production VFX_SPRITE_SHEETS), use Lab playback
    if (qaSourceId && step.spriteSheetId) {
      const prodSheet = VFX_SPRITE_SHEETS[step.spriteSheetId as keyof typeof VFX_SPRITE_SHEETS];
      if (prodSheet && prodSheet.sourceCandidateId !== qaSourceId) {
        const invRecord = getCandidateInventoryRecord(qaSourceId);
        if (invRecord) {
          const sheetDef = buildLabSheetDefinition(qaSourceId, invRecord);
          const prodStep = preset.steps[stepIndex];
          if (prodStep) {
            const result = ctx.vfxSystem.playLabSpriteSheet(qaSourceId, sheetDef, prodStep, context, {
              scale: qaPres?.scale,
              offsetX: qaPres?.offsetX,
              offsetY: qaPres?.offsetY,
              duration: qaPres?.duration,
              opacity: qaPres?.opacity,
              layer: qaPres?.layer,
              blending: qaPres?.blending,
              fadeIn: qaPres?.fadeIn,
              fadeOut: qaPres?.fadeOut,
            });
            await result.completion;
            return;
          }
        }
      }
    }

    // QA source is a production sheet — play with QA presentation overrides
    const modifiedPreset = applyQaOverridesToPreset(preset, stepIndex, qaPres);
    const result = ctx.vfxSystem.playPreset(modifiedPreset, context, action.currentPresetId);
    await result.completion;
  };

  const entered = await ctx.buildStageContext(actionKey, playVfx);
  return { played: entered, snapshot: entered ? snapshot : null };
}

/**
 * Applies QA presentation overrides to a preset's target step.
 * Returns a new preset with the modified step — does not mutate the original.
 */
function applyQaOverridesToPreset(
  preset: VfxPreset,
  stepIndex: number,
  qaPres: LabPresentationOverride | undefined,
): VfxPreset {
  if (!qaPres) return preset;
  const newSteps = preset.steps.map((step, index) => {
    if (index !== stepIndex) return step;
    const newSpritePresentation = {
      ...(step.spritePresentation ?? {}),
      ...(qaPres.scale !== undefined ? { scaleMultiplier: qaPres.scale } : {}),
      ...(qaPres.opacity !== undefined ? { opacityMultiplier: qaPres.opacity } : {}),
      ...(qaPres.fadeIn !== undefined ? { fadeIn: qaPres.fadeIn } : {}),
      ...(qaPres.fadeOut !== undefined ? { fadeOut: qaPres.fadeOut } : {}),
      ...(qaPres.layer !== undefined ? { layer: qaPres.layer } : {}),
      ...(qaPres.blending !== undefined ? { blending: qaPres.blending } : {}),
    };
    return {
      ...step,
      duration: qaPres.duration ?? step.duration,
      anchor: qaPres.anchor ?? step.anchor,
      orientation: qaPres.direction === 'AUTO' ? step.orientation : (qaPres.direction ?? step.orientation),
      spritePresentation: newSpritePresentation,
    } as VfxStep;
  });
  return { ...preset, steps: newSteps };
}

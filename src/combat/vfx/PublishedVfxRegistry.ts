/**
 * R2C-VFX Composer V2.3 — Published VFX Preset Registry.
 *
 * Durable, source-controlled production VFX configuration.
 *
 * ARCHITECTURE
 * ------------
 * The published registry stores SEMANTIC configuration (the same
 * VfxPresetDraft shape used by the Composer), NOT compiled numeric values.
 * At runtime, published entries are fed through the SAME compileDraft(),
 * getCandidateCadence(), and size/timing/placement resolvers as Composer
 * playback. This guarantees timing and size parity.
 *
 * PUBLISHED ID
 * ------------
 * Deterministic: `published_<actionKey>`. No random UUIDs, no timestamps.
 *
 * FINGERPRINT
 * -----------
 * A deterministic hash of the meaningful VFX configuration. Changes when
 * candidateId, slot order, SIZE, TIMING, PLACEMENT, advanced overrides,
 * choreography, or technical polish change. Does NOT change for updatedAt,
 * UI state, or catalogue searches.
 *
 * EMPTY REGISTRY = STATIC FALLBACK
 * --------------------------------
 * When the registry has no entry for an actionKey, production gameplay
 * uses the existing static VfxPresets fallback. This is a hard gate.
 */

import type {
  VfxChoreography,
  VfxPlacementProfile,
  VfxSizeProfile,
  VfxTechnicalPolish,
  VfxTimingProfile,
  VfxSlotAdvancedOverride,
  VfxVisualSlot,
  VfxPresetDraft,
  VfxAimProfile,
  VfxMirrorProfile,
  VfxPivotProfile,
  VfxPositionMode,
  VfxTravelEndpoint,
  VfxSlotImpactFx,
  VfxImpactPower,
  VfxTrajectoryProfile,
} from './VfxPresetComposer';
import {
  VFX_SIZE_PROFILES,
  VFX_TIMING_PROFILES,
  VFX_PLACEMENT_PROFILES,
  VFX_CHOREOGRAPHIES,
  VFX_TECHNICAL_POLISH_LEVELS,
  VFX_AIM_PROFILES,
  VFX_MIRROR_PROFILES,
  VFX_PIVOT_PROFILES,
  VFX_POSITION_MODES,
  VFX_TRAVEL_FROM_ENDPOINTS,
  VFX_TRAVEL_TO_ENDPOINTS,
  VFX_IMPACT_POWERS,
  VFX_TRAJECTORY_PROFILES,
  DEFAULT_AIM_PROFILE,
  DEFAULT_ROTATION_DEGREES,
  DEFAULT_MIRROR_PROFILE,
  DEFAULT_PIVOT_PROFILE,
  DEFAULT_POSITION_MODE,
  DEFAULT_TRAVEL_FROM,
  DEFAULT_TRAVEL_TO,
  DEFAULT_TRAJECTORY_PROFILE,
  DEFAULT_PHASE,
  DEFAULT_IMPACT_POWER,
  MAX_PHASE,
  hasActiveImpactFx,
  resolveSlotDirectionProfile,
  resolveSlotMirrorProfile,
} from './VfxPresetComposer';

// ============================================================ Registry Types

export const PUBLISHED_REGISTRY_SCHEMA_VERSION = 1;

/**
 * Published slot schema.
 *
 * V2.5 adds `positionMode`, `travelFrom`, `travelTo`, `phase` and `impactFx` as
 * ADDITIVE OPTIONAL fields, so `schemaVersion` stays at 1 and every existing
 * publication continues to load and play unchanged. Semantic anchors are stored
 * — never resolved world coordinates.
 */
export interface PublishedVfxSlot {
  id: string;
  candidateId: string;
  sizeProfile: VfxSizeProfile;
  timingProfile: VfxTimingProfile;
  placementProfile: VfxPlacementProfile;
  positionMode?: VfxPositionMode;
  travelFrom?: VfxTravelEndpoint;
  travelTo?: VfxTravelEndpoint;
  trajectoryProfile?: VfxTrajectoryProfile;
  aimProfile?: VfxAimProfile;
  rotationDegrees?: number;
  mirrorProfile?: VfxMirrorProfile;
  pivotProfile?: VfxPivotProfile;
  phase?: number;
  impactFx?: VfxSlotImpactFx;
  advanced?: VfxSlotAdvancedOverride;
}

export interface PublishedVfxEntry {
  actionKey: string;
  presetId: string;
  fingerprint: string;
  visualSlots: PublishedVfxSlot[];
  choreography: VfxChoreography;
  technicalPolish: VfxTechnicalPolish;
  autoPlacement?: Exclude<VfxPlacementProfile, 'AUTO'>;
  tier?: number;
}

export interface PublishedVfxRegistry {
  schemaVersion: number;
  actions: Record<string, PublishedVfxEntry>;
}

// ============================================================ Fingerprint

/**
 * Deterministic fingerprint from meaningful VFX configuration.
 *
 * Included: candidateId, slot order, SIZE, SPEED, POSITION mode, fixed AT
 * anchor, travel FROM/TO, DIRECTION, ROTATION, MIRROR, ORIGIN, PHASE, per-slot
 * FLASH/SHAKE/HITSTOP/POWER, advanced overrides, legacy choreography and legacy
 * technical polish.
 *
 * Excluded: updatedAt, catalogue search, catalogue page, panel minimize state
 * and any other UI state.
 *
 * DEFAULT NORMALIZATION: a missing field and an explicitly-authored default
 * value fingerprint identically. V2.5 fields are therefore only contributed
 * when they are NON-DEFAULT, which additionally guarantees that every existing
 * V2.4 publication keeps its exact stored fingerprint and never falsely reports
 * "MODIFIED SINCE PUBLISH".
 */
export function computeFingerprint(draft: VfxPresetDraft): string {
  const parts: string[] = [
    draft.actionKey,
    draft.choreography,
    draft.technicalPolish,
    draft.autoPlacement ?? '',
    String(draft.tier ?? ''),
  ];

  // Legacy drafts carry no explicit phases; they inherit the choreography, which
  // is already fingerprinted. Only explicitly authored phases add information.
  const phaseAuthored = draft.visualSlots.some(
    (slot) => typeof slot.phase === 'number' && Number.isFinite(slot.phase),
  );

  for (const slot of draft.visualSlots) {
    parts.push(slot.candidateId);
    parts.push(slot.sizeProfile);
    parts.push(slot.timingProfile);
    parts.push(slot.placementProfile);
    // Effective (not raw) transform values, so a TRAVEL slot relying on seeded
    // defaults fingerprints the same as one that spells them out.
    parts.push(resolveSlotDirectionProfile(slot));
    parts.push(String(slot.rotationDegrees ?? DEFAULT_ROTATION_DEGREES));
    parts.push(resolveSlotMirrorProfile(slot));
    parts.push(slot.pivotProfile ?? DEFAULT_PIVOT_PROFILE);
    // ---- V2.5 additive contributions: emitted ONLY when non-default.
    const positionMode = slot.positionMode ?? DEFAULT_POSITION_MODE;
    if (positionMode === 'TRAVEL') {
      parts.push(
        'TRAVEL',
        slot.travelFrom ?? DEFAULT_TRAVEL_FROM,
        slot.travelTo ?? DEFAULT_TRAVEL_TO,
      );
      const trajectory = slot.trajectoryProfile ?? DEFAULT_TRAJECTORY_PROFILE;
      if (trajectory !== DEFAULT_TRAJECTORY_PROFILE) {
        parts.push(`TRJ:${trajectory}`);
      }
    }
    if (phaseAuthored) {
      parts.push(`P${slot.phase ?? DEFAULT_PHASE}`);
    }
    if (hasActiveImpactFx(slot.impactFx)) {
      const fx = slot.impactFx!;
      parts.push(
        `FX${fx.flash ? 'F' : '-'}${fx.shake ? 'S' : '-'}${fx.hitStop ? 'H' : '-'}`,
        fx.power ?? DEFAULT_IMPACT_POWER,
      );
    }
    if (slot.advanced) {
      const adv = slot.advanced;
      parts.push(
        String(adv.scale ?? ''),
        String(adv.duration ?? ''),
        String(adv.opacity ?? ''),
        String(adv.fadeIn ?? ''),
        String(adv.fadeOut ?? ''),
        String(adv.offsetX ?? ''),
        String(adv.offsetY ?? ''),
        adv.layer ?? '',
        adv.blending ?? '',
        adv.orientation ?? '',
        adv.anchor ?? '',
        String(adv.startTime ?? ''),
      );
    } else {
      parts.push('');
    }
  }

  return simpleHash(parts.join('|'));
}

/**
 * Simple deterministic hash. Not cryptographic — just a stable fingerprint
 * for change detection. Uses FNV-1a 32-bit.
 */
function simpleHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // Convert to unsigned 32-bit hex string
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// ============================================================ Published Preset ID

export function publishedPresetId(actionKey: string): string {
  return `published_${actionKey}`;
}

// ============================================================ Draft → Published Entry

/**
 * Converts a Composer draft into a published registry entry.
 * Strips ephemeral fields (updatedAt) and assigns a deterministic presetId.
 */
export function draftToPublishedEntry(draft: VfxPresetDraft): PublishedVfxEntry {
  const { updatedAt: _discarded, ...rest } = draft;
  return {
    ...rest,
    presetId: publishedPresetId(draft.actionKey),
    fingerprint: computeFingerprint(draft),
    visualSlots: draft.visualSlots.map((slot) => {
      const { ...slotRest } = slot;
      return { ...slotRest };
    }),
  };
}

// ============================================================ Published Entry → Draft

/**
 * Converts a published registry entry back into a VfxPresetDraft
 * for compilation by the same compileDraft() used by the Composer.
 */
export function publishedEntryToDraft(entry: PublishedVfxEntry): VfxPresetDraft {
  return {
    actionKey: entry.actionKey,
    presetId: entry.presetId,
    visualSlots: entry.visualSlots as VfxVisualSlot[],
    choreography: entry.choreography,
    technicalPolish: entry.technicalPolish,
    ...(entry.autoPlacement ? { autoPlacement: entry.autoPlacement } : {}),
    ...(entry.tier != null ? { tier: entry.tier } : {}),
  };
}

// ============================================================ Validation

export interface PublishedEntryValidationResult {
  ok: boolean;
  errors: string[];
}

const VALID_SIZE_PROFILES = new Set(VFX_SIZE_PROFILES);
const VALID_TIMING_PROFILES = new Set(VFX_TIMING_PROFILES);
const VALID_PLACEMENT_PROFILES = new Set(VFX_PLACEMENT_PROFILES);
const VALID_CHOREOGRAPHIES = new Set(VFX_CHOREOGRAPHIES);
const VALID_POLISH_LEVELS = new Set(VFX_TECHNICAL_POLISH_LEVELS);

/**
 * Validates a single published entry.
 * Checks: actionKey, presetId, fingerprint, visualSlots, semantic enums,
 * candidate existence (optional), supported atlas format (optional).
 */
export function validatePublishedEntry(
  entry: unknown,
  options?: {
    candidateExists?: (candidateId: string) => boolean;
    isSupportedFormat?: (candidateId: string) => boolean;
  },
): PublishedEntryValidationResult {
  const errors: string[] = [];

  if (typeof entry !== 'object' || entry === null) {
    return { ok: false, errors: ['Entry is not an object.'] };
  }

  const e = entry as Record<string, unknown>;

  if (typeof e.actionKey !== 'string' || e.actionKey.length === 0) {
    errors.push('actionKey must be a non-empty string.');
  }
  if (typeof e.presetId !== 'string' || !e.presetId.startsWith('published_')) {
    errors.push('presetId must start with "published_".');
  }
  if (typeof e.fingerprint !== 'string' || e.fingerprint.length !== 8) {
    errors.push('fingerprint must be an 8-character hex string.');
  }
  if (!VALID_CHOREOGRAPHIES.has(e.choreography as VfxChoreography)) {
    errors.push(`choreography must be one of: ${VFX_CHOREOGRAPHIES.join(', ')}.`);
  }
  if (!VALID_POLISH_LEVELS.has(e.technicalPolish as VfxTechnicalPolish)) {
    errors.push(`technicalPolish must be one of: ${VFX_TECHNICAL_POLISH_LEVELS.join(', ')}.`);
  }

  const VALID_AIM_PROFILES = new Set(VFX_AIM_PROFILES);
  const VALID_MIRROR_PROFILES = new Set(VFX_MIRROR_PROFILES);
  const VALID_PIVOT_PROFILES = new Set(VFX_PIVOT_PROFILES);
  const VALID_POSITION_MODES = new Set(VFX_POSITION_MODES);
  const VALID_TRAVEL_FROM = new Set(VFX_TRAVEL_FROM_ENDPOINTS);
  const VALID_TRAVEL_TO = new Set(VFX_TRAVEL_TO_ENDPOINTS);
  const VALID_IMPACT_POWERS = new Set(VFX_IMPACT_POWERS);
  const VALID_TRAJECTORY_PROFILES = new Set(VFX_TRAJECTORY_PROFILES);

  if (!Array.isArray(e.visualSlots)) {
    errors.push('visualSlots must be an array.');
  } else {
    if (e.visualSlots.length === 0) {
      errors.push('visualSlots must contain at least one slot.');
    }
    for (let i = 0; i < e.visualSlots.length; i++) {
      const slot = e.visualSlots[i] as Record<string, unknown>;
      if (typeof slot !== 'object' || slot === null) {
        errors.push(`Slot ${i} is not an object.`);
        continue;
      }
      if (typeof slot.id !== 'string' || slot.id.length === 0) {
        errors.push(`Slot ${i}: id must be a non-empty string.`);
      }
      if (typeof slot.candidateId !== 'string' || !/^r1_\d+$/.test(slot.candidateId)) {
        errors.push(`Slot ${i}: candidateId must match r1_xxxx format.`);
      } else if (options?.candidateExists && !options.candidateExists(slot.candidateId)) {
        errors.push(`Slot ${i}: candidate ${slot.candidateId} not found in inventory.`);
      } else if (options?.isSupportedFormat && !options.isSupportedFormat(slot.candidateId)) {
        errors.push(`Slot ${i}: candidate ${slot.candidateId} has unsupported atlas format.`);
      }
      if (!VALID_SIZE_PROFILES.has(slot.sizeProfile as VfxSizeProfile)) {
        errors.push(`Slot ${i}: sizeProfile must be one of: ${VFX_SIZE_PROFILES.join(', ')}.`);
      }
      if (!VALID_TIMING_PROFILES.has(slot.timingProfile as VfxTimingProfile)) {
        errors.push(`Slot ${i}: timingProfile must be one of: ${VFX_TIMING_PROFILES.join(', ')}.`);
      }
      if (!VALID_PLACEMENT_PROFILES.has(slot.placementProfile as VfxPlacementProfile)) {
        errors.push(`Slot ${i}: placementProfile must be one of: ${VFX_PLACEMENT_PROFILES.join(', ')}.`);
      }
      if (slot.aimProfile != null && !VALID_AIM_PROFILES.has(slot.aimProfile as VfxAimProfile)) {
        errors.push(`Slot ${i}: aimProfile must be one of: ${VFX_AIM_PROFILES.join(', ')}.`);
      }
      if (slot.rotationDegrees != null && typeof slot.rotationDegrees !== 'number') {
        errors.push(`Slot ${i}: rotationDegrees must be a number.`);
      }
      if (slot.mirrorProfile != null && !VALID_MIRROR_PROFILES.has(slot.mirrorProfile as VfxMirrorProfile)) {
        errors.push(`Slot ${i}: mirrorProfile must be one of: ${VFX_MIRROR_PROFILES.join(', ')}.`);
      }
      if (slot.pivotProfile != null && !VALID_PIVOT_PROFILES.has(slot.pivotProfile as VfxPivotProfile)) {
        errors.push(`Slot ${i}: pivotProfile must be one of: ${VFX_PIVOT_PROFILES.join(', ')}.`);
      }
      if (slot.positionMode != null && !VALID_POSITION_MODES.has(slot.positionMode as VfxPositionMode)) {
        errors.push(`Slot ${i}: positionMode must be one of: ${VFX_POSITION_MODES.join(', ')}.`);
      }
      if (slot.travelFrom != null && !VALID_TRAVEL_FROM.has(slot.travelFrom as VfxTravelEndpoint)) {
        errors.push(`Slot ${i}: travelFrom must be one of: ${VFX_TRAVEL_FROM_ENDPOINTS.join(', ')}.`);
      }
      if (slot.travelTo != null && !VALID_TRAVEL_TO.has(slot.travelTo as VfxTravelEndpoint)) {
        errors.push(`Slot ${i}: travelTo must be one of: ${VFX_TRAVEL_TO_ENDPOINTS.join(', ')}.`);
      }
      if (slot.trajectoryProfile != null && !VALID_TRAJECTORY_PROFILES.has(slot.trajectoryProfile as VfxTrajectoryProfile)) {
        errors.push(`Slot ${i}: trajectoryProfile must be one of: ${VFX_TRAJECTORY_PROFILES.join(', ')}.`);
      }
      if (slot.positionMode === 'TRAVEL' && slot.travelFrom == null && slot.travelTo == null) {
        errors.push(`Slot ${i}: TRAVEL requires travelFrom and/or travelTo.`);
      }
      if (slot.phase != null
        && (typeof slot.phase !== 'number' || !Number.isInteger(slot.phase) || slot.phase < 0 || slot.phase > MAX_PHASE)) {
        errors.push(`Slot ${i}: phase must be an integer between 0 and ${MAX_PHASE}.`);
      }
      if (slot.impactFx != null) {
        if (typeof slot.impactFx !== 'object') {
          errors.push(`Slot ${i}: impactFx must be an object.`);
        } else {
          const fx = slot.impactFx as Record<string, unknown>;
          for (const key of ['flash', 'shake', 'hitStop'] as const) {
            if (fx[key] != null && typeof fx[key] !== 'boolean') {
              errors.push(`Slot ${i}: impactFx.${key} must be a boolean.`);
            }
          }
          if (fx.power != null && !VALID_IMPACT_POWERS.has(fx.power as VfxImpactPower)) {
            errors.push(`Slot ${i}: impactFx.power must be one of: ${VFX_IMPACT_POWERS.join(', ')}.`);
          }
        }
      }
    }
  }

  if (e.autoPlacement != null && !VALID_PLACEMENT_PROFILES.has(e.autoPlacement as VfxPlacementProfile)) {
    errors.push('autoPlacement must be a valid placement profile or absent.');
  }
  if (e.tier != null && (typeof e.tier !== 'number' || e.tier < 1 || e.tier > 6)) {
    errors.push('tier must be a number between 1 and 6, or absent.');
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Validates an entire registry object.
 */
export function validatePublishedRegistry(
  registry: unknown,
  options?: {
    candidateExists?: (candidateId: string) => boolean;
    isSupportedFormat?: (candidateId: string) => boolean;
  },
): PublishedEntryValidationResult {
  const errors: string[] = [];

  if (typeof registry !== 'object' || registry === null) {
    return { ok: false, errors: ['Registry is not an object.'] };
  }

  const r = registry as Record<string, unknown>;
  if (r.schemaVersion !== PUBLISHED_REGISTRY_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${PUBLISHED_REGISTRY_SCHEMA_VERSION}.`);
  }
  if (typeof r.actions !== 'object' || r.actions === null) {
    errors.push('actions must be an object.');
    return { ok: false, errors };
  }

  const actions = r.actions as Record<string, unknown>;
  const actionKeys = Object.keys(actions);

  for (const actionKey of actionKeys) {
    const entry = actions[actionKey];
    const result = validatePublishedEntry(entry, options);
    if (!result.ok) {
      errors.push(`[${actionKey}] ${result.errors.join('; ')}`);
    }
    // Verify actionKey matches entry.actionKey
    if (typeof entry === 'object' && entry !== null) {
      const entryActionKey = (entry as Record<string, unknown>).actionKey;
      if (entryActionKey !== actionKey) {
        errors.push(`[${actionKey}] actionKey mismatch: key=${actionKey}, entry.actionKey=${entryActionKey}`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

// ============================================================ Registry Operations

/**
 * Publishes (or updates) a single action in the registry.
 * Returns a NEW registry object — does not mutate the input.
 */
export function publishEntry(
  registry: PublishedVfxRegistry,
  draft: VfxPresetDraft,
): PublishedVfxRegistry {
  const entry = draftToPublishedEntry(draft);
  return {
    ...registry,
    actions: {
      ...registry.actions,
      [draft.actionKey]: entry,
    },
  };
}

/**
 * Removes a single action from the registry.
 * Returns a NEW registry object — does not mutate the input.
 * If the actionKey is not present, returns the input unchanged.
 */
export function unpublishEntry(
  registry: PublishedVfxRegistry,
  actionKey: string,
): PublishedVfxRegistry {
  if (!(actionKey in registry.actions)) return registry;
  const actions = { ...registry.actions };
  delete actions[actionKey];
  return { ...registry, actions };
}

/**
 * Looks up a published entry for an actionKey.
 * Returns null if not published.
 */
export function getPublishedEntry(
  registry: PublishedVfxRegistry,
  actionKey: string,
): PublishedVfxEntry | null {
  return registry.actions[actionKey] ?? null;
}

/**
 * Compares a draft's fingerprint against the published entry's fingerprint.
 * Returns:
 *   'not_published' — no published entry exists
 *   'published'     — fingerprints match
 *   'modified'      — fingerprints differ
 */
export function compareFingerprint(
  registry: PublishedVfxRegistry,
  draft: VfxPresetDraft,
): 'not_published' | 'published' | 'modified' {
  const entry = getPublishedEntry(registry, draft.actionKey);
  if (!entry) return 'not_published';
  const draftFp = computeFingerprint(draft);
  return draftFp === entry.fingerprint ? 'published' : 'modified';
}

/**
 * Serializes a registry to deterministic JSON.
 * Keys are sorted for stable diffs.
 */
export function serializeRegistry(registry: PublishedVfxRegistry): string {
  const sortedActions: Record<string, PublishedVfxEntry> = {};
  for (const key of Object.keys(registry.actions).sort()) {
    sortedActions[key] = registry.actions[key]!;
  }
  return JSON.stringify(
    { schemaVersion: registry.schemaVersion, actions: sortedActions },
    null,
    2,
  ) + '\n';
}

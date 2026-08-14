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
} from './VfxPresetComposer';
import {
  VFX_SIZE_PROFILES,
  VFX_TIMING_PROFILES,
  VFX_PLACEMENT_PROFILES,
  VFX_CHOREOGRAPHIES,
  VFX_TECHNICAL_POLISH_LEVELS,
} from './VfxPresetComposer';

// ============================================================ Registry Types

export const PUBLISHED_REGISTRY_SCHEMA_VERSION = 1;

export interface PublishedVfxSlot {
  id: string;
  candidateId: string;
  sizeProfile: VfxSizeProfile;
  timingProfile: VfxTimingProfile;
  placementProfile: VfxPlacementProfile;
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
 * Changes when any of: candidateId, slot order, SIZE, TIMING, PLACEMENT,
 * advanced override, choreography, technical polish change.
 * Does NOT change for updatedAt, UI state, catalogue search, display mode.
 */
export function computeFingerprint(draft: VfxPresetDraft): string {
  const parts: string[] = [
    draft.actionKey,
    draft.choreography,
    draft.technicalPolish,
    draft.autoPlacement ?? '',
    String(draft.tier ?? ''),
  ];

  for (const slot of draft.visualSlots) {
    parts.push(slot.candidateId);
    parts.push(slot.sizeProfile);
    parts.push(slot.timingProfile);
    parts.push(slot.placementProfile);
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

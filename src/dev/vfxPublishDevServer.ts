/**
 * DEV-only publish/unpublish logic for the Vite dev server.
 * Handles validation, atomic write, and registry operations.
 */
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import {
  publishEntry,
  unpublishEntry,
  validatePublishedEntry,
  serializeRegistry,
  publishedPresetId,
  type PublishedVfxRegistry,
} from '../combat/vfx/PublishedVfxRegistry';
import { validateDraft, type VfxPresetDraft } from '../combat/vfx/VfxPresetComposer';
import { getCandidateInventoryRecord, resolveCandidateSource } from '../combat/vfx/VfxResourceManager';

const PUBLISHED_REGISTRY_PATH = join(process.cwd(), 'src', 'combat', 'vfx', 'generated', 'published-vfx-presets.json');

function readRegistry(): PublishedVfxRegistry {
  const raw = readFileSync(PUBLISHED_REGISTRY_PATH, 'utf-8');
  return JSON.parse(raw) as PublishedVfxRegistry;
}

function writeRegistryAtomic(registry: PublishedVfxRegistry): void {
  const serialized = serializeRegistry(registry);
  const tempPath = PUBLISHED_REGISTRY_PATH + '.tmp';
  writeFileSync(tempPath, serialized, 'utf-8');
  renameSync(tempPath, PUBLISHED_REGISTRY_PATH);
}

export interface PublishResult {
  ok: boolean;
  error?: string;
  actionKey?: string;
  presetId?: string;
  fingerprint?: string;
  registry?: PublishedVfxRegistry;
}

export function handlePublishRequest(body: string): PublishResult {
  let parsed: { draft?: unknown };
  try {
    parsed = JSON.parse(body);
  } catch {
    return { ok: false, error: 'Invalid JSON body' };
  }

  const draft = parsed.draft;
  if (!draft || typeof draft !== 'object') {
    return { ok: false, error: 'Missing draft in request body' };
  }

  if (!validateDraft(draft)) {
    return { ok: false, error: 'Invalid draft: failed schema validation' };
  }

  const validDraft = draft as VfxPresetDraft;

  for (const slot of validDraft.visualSlots) {
    const rec = getCandidateInventoryRecord(slot.candidateId);
    if (!rec) {
      return { ok: false, error: `Candidate ${slot.candidateId} not found in inventory` };
    }
    if (!resolveCandidateSource(slot.candidateId)) {
      return { ok: false, error: `Candidate ${slot.candidateId} has unsupported atlas format (not 2048x2048 or 4096x4096)` };
    }
  }

  const currentRegistry = readRegistry();
  const newRegistry = publishEntry(currentRegistry, validDraft);

  const entryValidation = validatePublishedEntry(
    newRegistry.actions[validDraft.actionKey],
    {
      candidateExists: (id) => getCandidateInventoryRecord(id) !== null,
      isSupportedFormat: (id) => resolveCandidateSource(id) !== null,
    },
  );
  if (!entryValidation.ok) {
    return { ok: false, error: `Validation failed: ${entryValidation.errors.join('; ')}` };
  }

  try {
    writeRegistryAtomic(newRegistry);
  } catch (writeErr) {
    return { ok: false, error: `Write failed: ${writeErr instanceof Error ? writeErr.message : 'unknown'}` };
  }

  return {
    ok: true,
    actionKey: validDraft.actionKey,
    presetId: publishedPresetId(validDraft.actionKey),
    fingerprint: newRegistry.actions[validDraft.actionKey]!.fingerprint,
    registry: newRegistry,
  };
}

export interface UnpublishResult {
  ok: boolean;
  error?: string;
  actionKey?: string;
  registry?: PublishedVfxRegistry;
}

export function handleUnpublishRequest(body: string): UnpublishResult {
  let parsed: { actionKey?: string };
  try {
    parsed = JSON.parse(body);
  } catch {
    return { ok: false, error: 'Invalid JSON body' };
  }

  const actionKey = parsed.actionKey;
  if (!actionKey || typeof actionKey !== 'string' || actionKey.includes('/') || actionKey.includes('\\') || actionKey.includes('..')) {
    return { ok: false, error: 'Invalid actionKey' };
  }

  const currentRegistry = readRegistry();
  if (!(actionKey in currentRegistry.actions)) {
    return { ok: false, error: `Action ${actionKey} is not published` };
  }

  const newRegistry = unpublishEntry(currentRegistry, actionKey);

  try {
    writeRegistryAtomic(newRegistry);
  } catch (writeErr) {
    return { ok: false, error: `Write failed: ${writeErr instanceof Error ? writeErr.message : 'unknown'}` };
  }

  return {
    ok: true,
    actionKey,
    registry: newRegistry,
  };
}

export interface ResetAllResult {
  ok: boolean;
  error?: string;
  registry?: PublishedVfxRegistry;
  clearedActions?: number;
}

/**
 * V2.6.1 — DEV-only global reset. Atomically writes the canonical empty
 * registry: { schemaVersion: 1, actions: {} }.
 *
 * Uses the same atomic write temp → rename path as publish/unpublish.
 * Does NOT delete the registry file itself.
 */
export function handleResetAllPresetsRequest(): ResetAllResult {
  const currentRegistry = readRegistry();
  const clearedActions = Object.keys(currentRegistry.actions).length;

  const emptyRegistry: PublishedVfxRegistry = {
    schemaVersion: 1,
    actions: {},
  };

  try {
    writeRegistryAtomic(emptyRegistry);
  } catch (writeErr) {
    return { ok: false, error: `Write failed: ${writeErr instanceof Error ? writeErr.message : 'unknown'}` };
  }

  return {
    ok: true,
    registry: emptyRegistry,
    clearedActions,
  };
}

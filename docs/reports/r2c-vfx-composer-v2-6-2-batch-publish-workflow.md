# R2C-VFX Composer V2.6.2 — Batch Publish Workflow

**Date:** 2025-01-09  
**Baseline:** `d591d8cd930c7e0a8269d2be59fa91b88b328dec` (V2.6.1)  
**Status:** Implementation complete, uncommitted

---

## 1. Objective

Implement a batch publish workflow for the VFX Composer that allows users to explicitly save multiple drafts and then publish all saved drafts atomically in one registry write.

## 2. Requirements

- Add explicit saved fingerprint metadata to `ComposerStore` to distinguish explicit saves from autosaves
- SAVE DRAFT must record explicit fingerprint; autosave must not
- Derive saved status per draft for UI display (NOT SAVED, SAVED/READY, MODIFIED SINCE SAVE)
- Batch publish classifies drafts into states: READY_NEW, READY_UPDATE, READY_ALREADY_PUBLISHED, MODIFIED_SINCE_SAVE, NOT_SAVED, BLOCKED
- UI shows saved status badge near SAVE DRAFT
- Global PUBLISH ALL SAVED button with confirmation dialog showing counts and blocking on invalid drafts
- Server endpoint POST `/dev/vfx-publish-all-presets` atomically validates and writes all eligible drafts in one operation or fails entirely
- Individual publish/unpublish/reset workflows remain unchanged
- Backward compatibility: legacy stores without `savedFingerprints` load safely
- No runtime, gameplay, asset, or published preset schema changes

## 3. Implementation

### 3.1 ComposerStore Extension (`VfxComposerPlayback.ts`)

- Added `savedFingerprints?: Record<string, string>` to `ComposerStore` interface
- `createEmptyComposerStore()` now initializes `savedFingerprints: {}`
- `deleteDraft()` now also removes the corresponding saved fingerprint
- `deserializeComposerStore()` parses `savedFingerprints` from legacy JSON, defaulting to `{}` when absent (backward compatible)
- Added helper functions:
  - `recordSavedFingerprint(store, actionKey, draft)` — records fingerprint at SAVE DRAFT time
  - `getSavedFingerprint(store, actionKey)` — retrieves saved fingerprint
  - `clearSavedFingerprint(store, actionKey)` — removes single saved fingerprint
  - `getSavedStatus(store, actionKey, draft)` — derives `NOT_SAVED | READY | MODIFIED_SINCE_SAVE`
  - `SavedStatus` type export

### 3.2 Batch Classification Helper (`BatchPublishPlan.ts` — new file)

Pure, side-effect-free classification module:

- `BatchClassification` type: `READY_NEW | READY_UPDATE | READY_ALREADY_PUBLISHED | MODIFIED_SINCE_SAVE | NOT_SAVED | BLOCKED`
- `BatchEntry` interface: per-draft classification with fingerprints and block reason
- `BatchPublishPlan` interface: entries + summary arrays + eligible list + flags
- `buildBatchPublishPlan(store, registry)` — classifies every draft against the published registry

Classification logic:
1. No saved fingerprint → `NOT_SAVED`
2. Saved fingerprint ≠ current → `MODIFIED_SINCE_SAVE`
3. Saved = current, but draft fails validation or candidate checks → `BLOCKED`
4. Saved = current, published fingerprint matches → `READY_ALREADY_PUBLISHED`
5. Saved = current, published entry exists but fingerprint differs → `READY_UPDATE`
6. Saved = current, no published entry → `READY_NEW`

Eligible for batch: `READY_NEW` + `READY_UPDATE`

### 3.3 Server Endpoint (`vfxPublishDevServer.ts`)

Added `handlePublishAllPresetsRequest(body)`:

1. Parse entire batch from request body (`{ drafts: VfxPresetDraft[] }`)
2. Validate every draft independently (schema + candidate checks)
3. Read current registry ONCE from disk
4. Build complete resulting registry IN MEMORY using `publishEntry`
5. Validate every resulting `PublishedVfxEntry` with `validatePublishedEntry`
6. If ANY error: return failure with errors array, ZERO writes
7. If all valid: ONE atomic registry write (temp → rename)
8. Return final registry + summary (published/updated/unchanged counts)

Added `BatchPublishResult` and `BatchPublishError` interfaces.

### 3.4 Vite Endpoint (`vite.config.ts`)

- Imported `handlePublishAllPresetsRequest`
- Added `POST /dev/vfx-publish-all-presets` middleware
- Returns 200 on success, 400 on validation failure, 405 on wrong method

### 3.5 UI (`CombatVfxComposerPanel.ts`)

- **SAVE DRAFT** button now calls `recordSavedFingerprint` after persist
- **Saved status badge** displayed below SAVE DRAFT:
  - `NOT SAVED FOR BATCH` (gray)
  - `SAVED / READY FOR BATCH` (green)
  - `MODIFIED SINCE SAVE` (orange)
- **PUBLISH ALL SAVED** button added after unpublish, separated by `<hr>`
- **Batch confirmation dialog** (`showBatchPublishConfirmation`):
  - Builds `BatchPublishPlan` from current store + active registry
  - Shows "Nothing to publish" when no eligible and no blocked drafts
  - Shows counts: new publications, updates, already published, modified since save, not saved, blocked
  - Shows blocked details with reasons
  - CONFIRM button disabled when blocked or no eligible
  - On confirm: POST to `/dev/vfx-publish-all-presets` with eligible drafts
  - On success: updates overlay, records saved fingerprints, re-renders
  - On failure: shows error, nothing written
- **Individual publish** now also records saved fingerprint on success
- CSS styles added for saved badge, batch separator, batch button, blocked details

### 3.6 Wiring

- Individual publish success → `recordSavedFingerprint` (draft is now "saved" after publish)
- `deleteDraft` → removes saved fingerprint (already in `VfxComposerPlayback.ts`)
- RESET ALL → `createEmptyComposerStore()` clears `savedFingerprints` (already returns `{ drafts: {}, savedFingerprints: {} }`)
- Import/export of drafts does not touch `savedFingerprints` (imported drafts start as NOT_SAVED)

## 4. Testing

### Test File: `VfxV2_6_2BatchPublish.test.ts` (27 tests)

| Section | Tests | Description |
|---------|-------|-------------|
| 30 — Classification & Saved Fingerprint | 11 | Legacy backward compat, SAVE DRAFT records fingerprint, autosave doesn't update saved FP, NOT_SAVED/READY/MODIFIED states, revert to READY, individual publish marks saved, delete removes FP, RESET clears FP, clearSavedFingerprint |
| 31 — Batch Publish Plan | 3 | Mixed store with all 5 states, empty store, all already published |
| 32 — Atomicity | 4 | Valid+invalid → fail with zero writes, all valid → success, invalid JSON, missing drafts array |
| 33 — Registry Preservation | 1 | Batch updates some actions, others unchanged in final registry |
| 34 — Fingerprint Parity | 1 | Individual publish fingerprint equals batch publish fingerprint for same draft |
| 35 — UI | 7 | PUBLISH ALL SAVED button exists, SAVE DRAFT marks READY, NOT SAVED before save, dialog opens, CANCEL closes, dialog displays counts, empty batch shows "Nothing to publish" |

### Test Infrastructure

Server handler tests use backup/restore pattern for the real published presets JSON file:
- `beforeEach`: backup real file, write test registry
- `afterEach`: restore real file from backup
- Verified: `git diff` on `published-vfx-presets.json` is clean after test run

## 5. Validation Results

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | ✅ Clean (0 errors) |
| `npx vitest run` | ✅ 64 files, 1558 tests passed |
| `npm run build` | ✅ Built in 8.98s |
| `git diff published-vfx-presets.json` | ✅ Clean (no changes) |
| `git status` | 4 modified, 2 new files, no registry changes |

## 6. Files Changed

| File | Status | Lines |
|------|--------|-------|
| `src/combat/vfx/VfxComposerPlayback.ts` | Modified | +48 -3 |
| `src/combat/vfx/CombatVfxComposerPanel.ts` | Modified | +170 |
| `src/dev/vfxPublishDevServer.ts` | Modified | +144 |
| `vite.config.ts` | Modified | +20 -1 |
| `src/combat/vfx/BatchPublishPlan.ts` | New | 115 lines |
| `src/combat/vfx/VfxV2_6_2BatchPublish.test.ts` | New | 500 lines |

## 7. Constraints Held

- ✅ No runtime, gameplay, asset, or published preset schema changes
- ✅ Individual publish/unpublish/reset workflows unchanged
- ✅ Backward compatibility: legacy stores without `savedFingerprints` load safely
- ✅ Atomic server operation: all-or-nothing registry write
- ✅ No commit or push during development
- ✅ Published presets registry file unmodified after tests

## 8. Commit / Push Status

Code is left **uncommitted and unpushed** pending user confirmation.

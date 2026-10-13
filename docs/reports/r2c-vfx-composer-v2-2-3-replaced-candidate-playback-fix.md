# R2C-VFX Composer V2.2.3 — Replaced Candidate Playback Fix

**Date:** 2026-08-13
**Agent:** Devin (GLM 5.2, High Reasoning)
**Mode:** Targeted Composer Playback Bugfix + Real Browser QA

---

## Bug

In the VFX Preset Composer, after replacing a visual slot with a new CartoonCoffee candidate and clicking any Play button, the newly selected spritesheet could not reliably be rendered. Existing previously acquired candidates often worked; new arbitrary catalogue candidates often did not.

## Root Cause (Proven)

The Composer's Play buttons called `playDraftVisualsOnly` / `playDraftFull` / `playDraftInCombatStage` synchronously, which compiled the draft and immediately invoked `playLabSpriteSheet`. That path loads the runtime PNG from:

```
/assets/vfx/megapack-runtime/<candidateId>.png
```

via `VfxResourceManager.acquire()` → `loadLabCandidateTexture()`.

However, arbitrary CartoonCoffee catalogue candidates are `AVAILABLE_ON_DEMAND` — their native PNG does not exist in `public/assets/vfx/megapack-runtime/` until explicitly acquired via `/dev/vfx-acquire`.

The GIF preview shown in the slot card is served from the external Mega Pack preview bridge (`/dev/vfx-preview/<candidateId>`), NOT from the runtime PNG. Therefore a candidate could display a correct GIF preview while failing actual playback because its native PNG was never acquired.

**Network evidence:**
- `GET /dev/vfx-preview/r1_0006` → HTTP 200, 304KB (GIF preview works)
- `GET /assets/vfx/megapack-runtime/r1_0006.png` → HTTP 404 (runtime PNG missing, before fix)

The static runtime manifest (`vfx-megapack-r2-selected-runtime-assets.json`) was also not authoritative — candidates acquired dynamically during a dev session would still appear `AVAILABLE_ON_DEMAND` in the manifest.

## Solution

### 1. Runtime Readiness Pre-Flight (`VfxRuntimeReadiness.ts`)

New module with two exported functions:

- **`ensureCandidateRuntimeReady(candidateId)`** — validates the candidate exists in inventory with supported native format, then:
  1. HEAD checks `/assets/vfx/megapack-runtime/<candidateId>.png`
  2. If HTTP 200 → READY (no acquisition needed)
  3. If missing → POST `/dev/vfx-acquire` with `{ candidateId }`
  4. Verifies acquisition with a second HEAD check
  5. Returns `{ ready, acquired, error? }`

- **`ensureDraftRuntimeReady(draft)`** — collects all unique playable candidates from the draft, runs `ensureCandidateRuntimeReady` on each in parallel, returns aggregate result with `failedCandidates` list.

### 2. In-Flight Deduplication

An in-flight `Map<candidateId, Promise>` ensures only one acquisition request per candidate at a time, even if:
- Multiple Play buttons are clicked rapidly
- The same candidate appears in several slots
- Prefetch and Play preflight run concurrently

### 3. Play Button Pre-Flight Wiring

All three Play buttons now:
1. Capture the **latest** draft via `currentDraft()` (not the render-time snapshot)
2. Disable the button and show "Preparing VFX assets…"
3. Run `ensureDraftRuntimeReady(activeDraft)`
4. If any candidate fails → show "VFX ACQUISITION FAILED: r1_xxxx" and re-enable the button
5. If all ready → compile and play the exact current draft
6. Re-enable the button after completion

### 4. Prefetch on Selection (UX Optimization)

When the user clicks "USE THIS" or "ADD TO PRESET", `ensureCandidateRuntimeReady` is called in the background. Status shows "Preparing r1_1234…" then "r1_1234 ready for playback". This is an optimization only — the authoritative guarantee remains the Play preflight.

### 5. Latest Draft Safety

The Play buttons now call `currentDraft()` at click time instead of using the `draft` parameter captured during `render()`. This ensures PLAY always uses the latest Composer configuration after REPLACE, ADD, SIZE, TIMING, PLACEMENT, CHOREOGRAPHY, or POLISH changes.

### 6. Replacement Semantic Config

`replaceSlotCandidate` already preserves SIZE/TIMING/PLACEMENT profiles. `compileDraft` already queries `getCandidateCadence` using the NEW candidate's inventory record, so numeric duration is automatically recomputed from the new candidate's native cadence. No changes were needed here — verified by tests.

## Candidate Used for Reproduction

- **Candidate:** `r1_0006` (4096×4096, supported native format)
- **Before fix:** `r1_0006.png` not present in `megapack-runtime/` → playback would fail with a console warning and no visible VFX
- **After fix:** Prefetch acquired the PNG automatically; `GET /assets/vfx/megapack-runtime/r1_0006.png` → HTTP 200

## Runtime Acquisition Behavior

| Scenario | Behavior |
|---|---|
| PNG already exists | HEAD 200 → READY, no POST |
| PNG missing | HEAD 404 → POST acquire → HEAD verify → READY |
| Acquisition fails | HEAD 404 → POST fails → explicit failure reported |
| Same candidate concurrent | One in-flight promise, one POST |
| Multiple unique candidates | All prepared in parallel |

## Browser QA Evidence

### QA 1: Health + Preview Bridge
```
Health: {"ok":true,"configured":true,"rootExists":true,"previewDirectoryExists":true,"previewIndexLoaded":true,"resolvedPreviewCount":1974}
r1_0006 GIF: HTTP 200, 304803 bytes
r1_0006 PNG: HTTP 200 (after automatic acquisition)
```

### QA 2: Composer Playback
```
composer exists: true
status after add: r1_0006 ready for playback
status during play: Played visuals only: 2 slot(s), 0 technical effects
status after full: Played full preset: 2 slot(s), 3 technical effect(s)
SIZE buttons: ['LOW', 'MID', 'BIG', 'GIGA']
GIGA active: true
GIF previews loaded: 1/1
bridge error elements: 0
console errors: 0
```

## Tests

15 new tests in `VfxRuntimeReadiness.test.ts`:
- 7 runtime readiness tests (HEAD check, acquisition, verification, dedup, invalid candidate)
- 3 draft readiness tests (multiple candidates, dedup, partial failure)
- 5 replacement semantic tests (candidateId change, profile preservation, compileDraft uses new candidate, GIGA survives, play latest draft snapshot)

2 existing tests updated in `CombatVfxComposerPanel.test.ts` (async + fetch mock for Play preflight).

## Files Changed

| File | Change |
|---|---|
| `src/combat/vfx/VfxRuntimeReadiness.ts` | **NEW** — runtime readiness pre-flight module |
| `src/combat/vfx/VfxRuntimeReadiness.test.ts` | **NEW** — 15 focused tests |
| `src/combat/vfx/CombatVfxComposerPanel.ts` | Wired pre-flight into all 3 Play buttons + prefetch on selection |
| `src/combat/vfx/CombatVfxComposerPanel.test.ts` | Updated 2 Stage tests for async preflight + fetch mocks |

## Regression Safety

- LOW 1.80, MID 2.50, BIG 3.40, GIGA 5.50 — preserved
- opacity 1, no automatic fades — preserved
- Foreground impact layer — preserved
- Source suitability filtering — preserved
- 5 UI indicators hidden from normal catalogue — preserved
- Persistent GIF preview bridge — preserved (health: ok, 1974 previews)
- `/dev/vfx-preview-health` — preserved
- `/dev/vfx-acquire` — preserved
- Portable drafts, localStorage drafts — preserved
- Minimize/expand — preserved
- Choreographies, technical polish — preserved
- Combat Stage — preserved
- Gameplay, damage, AP, AI, economy — unchanged
- VfxResourceManager (lazy loading, dedup, refCount, LRU, memory budget, texture cloning, LinearFilter, ClampToEdge, no mipmaps) — preserved

## Technical Validation

- **Tests:** 1047/1047 PASS
- **Build:** PASS (built in 6.16s)
- **Typecheck:** PASS (via tsc --noEmit in build)
- **git diff --check:** PASS
- **Commit:** NO
- **Push:** NO

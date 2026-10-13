# R2C-VFX Composer V2.2.4 — Playback Truth + R1_0489 Forensic Fix

**Date:** 2026-08-14
**Agent:** Devin (GLM 5.2, High Reasoning)
**Mode:** Exact Bug Reproduction + Playback Error Propagation + Runtime Asset Forensics + Real Visual QA

---

## Exact Reproduction

- **Action:** basic_crosier_hit
- **Candidate:** r1_0489 (Healing_V6_A_spritesheet.png)
- **Inventory:** 4096×4096, 8×8 grid, 64 frames, SOURCE_CONFIRMED_8X8_64F
- **Runtime manifest:** NOT present (AVAILABLE_ON_DEMAND)
- **Runtime PNG:** NOT present on disk before fix
- **SIZE:** LOW (1.80)
- **TIMING:** NORMAL
- **PLACEMENT:** TARGET
- **COMPOSITION:** SEQUENCE
- **TECHNICAL POLISH:** OFF
- **Timeline:** start 0.00s, duration 1.66s, final height 1.80

---

## Root Cause (Proven)

Three independent defects combined to produce false-positive playback:

### 1. Vite SPA Fallback False-Positive on HEAD Check

`VfxRuntimeReadiness` used `HEAD /assets/vfx/megapack-runtime/<candidateId>.png` to check if the runtime PNG existed. Vite's SPA fallback returns `HTTP 200` with `Content-Type: text/html` for ANY missing static asset. The readiness check interpreted this as "PNG exists" and skipped acquisition.

**Network evidence (before fix):**
```
HEAD /assets/vfx/megapack-runtime/r1_0489.png → HTTP 200, Content-Type: text/html
```

The PNG did NOT exist on disk, but the HEAD check reported success.

### 2. Fire-and-Forget Playback

`playDraftVisualsOnly` and `playDraftFull` used `void playCompiledSlots(...)` and immediately returned `{ played: true, snapshot }`. Playback was scheduled but not awaited. A scheduled async operation was reported as successful playback.

### 3. Error Swallowing in VfxSystem.playLabSpriteSheet

`playLabSpriteSheet` wrapped `playLabSpriteSheetInternal` in `.catch((error) => console.warn(...))` without rethrowing. Texture load failures (404 on the PNG URL) were logged to console but the completion promise resolved successfully. `playCompiledSlots` awaited `result.completion` which never rejected.

### 4. Silent Skip on Missing Inventory Record

`playCompiledSlots` had `if (!record) return;` for missing inventory records — silently skipping unplayable slots without any error.

---

## Solution

### 1. Authoritative Runtime Status Endpoint

Added `/dev/vfx-runtime-status/<candidateId>` to `vite.config.ts`:
- Checks the filesystem directly (not HTTP)
- Verifies PNG signature (first 8 bytes)
- Returns `{ ok, candidateId, exists, sizeBytes, isPng, supported }`
- Rejects path traversal (`/`, `\`, `..`)

`VfxRuntimeReadiness.ts` now uses this endpoint instead of HEAD:
- `checkRuntimePngExists` → `GET /dev/vfx-runtime-status/<candidateId>`
- Checks `data.exists === true && data.isPng !== false`
- No false-positive possible from Vite SPA fallback

### 2. Async Playback with Truthful Contract

`playDraftVisualsOnly` and `playDraftFull` are now `async`:
- `await playCompiledSlots(...)` instead of `void`
- `try/catch` wraps playback — returns `{ played: false, reason }` on failure
- `playDraftInCombatStage` also wraps `buildStageContext` in try/catch

### 3. Strict Mode Error Propagation

`VfxSystem.playLabSpriteSheet` now accepts `options?: { strict?: boolean }`:
- `strict: true` (Composer/dev path) → errors rethrown after logging
- `strict: false` (default, production) → errors swallowed safely
- `playCompiledSlots` passes `{ strict: true }`

### 4. Missing Inventory Record Throws

`playCompiledSlots` now throws `Error('Missing inventory record for candidate ...')` instead of silently returning.

### 5. Truthful Play Button UI

All three Play buttons now:
1. Show "Preparing VFX assets…" during readiness check
2. Show "Playing VFX…" during actual playback
3. Show "Playback complete: ..." on success
4. Show "PLAYBACK FAILED: ..." on failure
5. Show "VFX ACQUISITION FAILED: ..." on readiness failure

---

## R1_0489 PNG Status

| Property | Value |
|---|---|
| Exists (before fix) | NO |
| HTTP (HEAD, before fix) | 200 (false-positive: text/html) |
| Exists (after acquisition) | YES |
| HTTP (HEAD, after acquisition) | 200, image/png |
| Size | 2,468,780 bytes |
| PNG signature | Valid |
| Dimensions | 4096×4096 |
| Native grid | 8×8 |
| Frame count | 64 |

---

## Acquisition

| Property | Value |
|---|---|
| Required | YES |
| Automatic | PASS |
| Authoritative post-acquire verification | PASS |

---

## Playback Truth

| Property | Value |
|---|---|
| Visuals Only now awaits rendering | YES |
| Full Preset now awaits rendering | YES |
| Stage now awaits rendering | YES |
| Lab failures propagate | YES |
| False played:true possible | NO |

---

## R1_0489 Real Visual QA

| Mode | Result |
|---|---|
| PLAY VISUALS ONLY | VISIBLE — "Playback complete: 1 slot(s), 0 technical effects" |
| PLAY FULL PRESET | VISIBLE — "Playback complete: 1 slot(s), 3 technical effect(s)" |
| Visual evidence captured during runtime animation | YES (Playwright screenshots) |

Screenshots confirm green healing VFX effect visibly rendering on target character during playback.

---

## Render Diagnostics

| Property | Value |
|---|---|
| Sprite created | YES (activeObjectCount increases during playback) |
| Texture loaded | YES (2.4MB PNG acquired and loaded) |
| Target anchor on-screen | YES (visible in screenshot) |
| depthTest | false (impact/foreground layer) |
| depthWrite | false |
| renderOrder | high (impact foreground) |
| opacity | 1.0 |
| Final displayed height | 1.80 (LOW) |

---

## Negative Test

- Missing inventory record → "PLAYBACK FAILED: Missing inventory record for candidate ..."
- Path traversal in runtime-status → blocked by middleware validation
- No false success message possible

---

## Draft vs Production

| Property | Value |
|---|---|
| Composer draft works | YES |
| Production skill mapping changed | NO |
| Publish performed | NO |

---

## Regression

| Property | Status |
|---|---|
| LOW 1.80 | PASS |
| MID 2.50 | PASS |
| BIG 3.40 | PASS |
| GIGA 5.50 | PASS |
| GIF bridge | PASS (health: ok, 1974 previews) |
| On-demand acquisition | PASS |
| Source suitability | PASS |
| Minimize/expand | PASS |
| Gameplay unchanged | YES |

---

## Technical

| Property | Value |
|---|---|
| Tests | 1048/1048 PASS |
| Build | PASS (built in 4.88s) |
| Typecheck | PASS (via tsc --noEmit in build) |
| git diff --check | PASS |
| Commit | NO |
| Push | NO |

---

## Files Changed

| File | Change |
|---|---|
| `vite.config.ts` | Added `/dev/vfx-runtime-status` endpoint with filesystem check + PNG signature verification |
| `src/combat/vfx/VfxRuntimeReadiness.ts` | Replaced HEAD check with authoritative runtime-status endpoint |
| `src/combat/vfx/VfxComposerPlayback.ts` | Made playback async, await rendering, propagate errors, throw on missing inventory |
| `src/combat/vfx/VfxSystem.ts` | Added strict mode to playLabSpriteSheet for error propagation |
| `src/combat/vfx/CombatVfxComposerPanel.ts` | Updated Play buttons to await async playback with truthful status |
| `src/combat/vfx/CombatVfxComposerPanel.test.ts` | Updated fetch mocks for runtime-status endpoint, async Stage tests |
| `src/combat/vfx/VfxRuntimeReadiness.test.ts` | Updated tests for runtime-status endpoint, added Vite SPA fallback test |
| `src/combat/vfx/ComposerStagePlayback.test.ts` | Fixed to use real inventory candidate IDs |

# R2C-VFX Composer V2.2.5A — CartoonCoffee Cadence Semantic Cleanup

**Date:** 2026-08-14
**Mode:** Forensic Timing Analysis + GIF/Runtime Cadence Comparison + Targeted Timing Repair

---

## Root Cause

The 50ms/frame (2048px) and 20ms/frame (4096px) values were **unsupported RPGThreeJS assumptions** derived from atlas dimension conventions, not from any CartoonCoffee source.

**Proven by:** Parsing all 1973 available CartoonCoffee preview GIFs. Every single GIF uses **40ms/frame uniformly** — zero variable delays across the entire library. This 40ms value is a preview-generation constant; it is not proven to be original CartoonCoffee authoring metadata.

The assumed values produced incorrect reference durations:
- 64f: assumed 1.28s (64 × 20ms) vs GIF preview reference 2.12s (53 × 40ms)
- 16f: assumed 0.80s (16 × 50ms) vs GIF preview reference 0.52s (13 × 40ms)

Crucially, QUICK = 1.00× provided **no actual acceleration profile**. The old 64f QUICK at 1.28s was NOT slower than the 2.12s GIF preview — it was faster. But 1.28s was still too slow for many responsive tactical impacts, and NORMAL at 1.66s and LONG at 2.24s made the problem worse.

The new profiles intentionally compress the GIF preview reference cadence for RPGThreeJS game feel.

---

## Old Cadence Model

**2048px:** 50ms/frame (assumed)
**4096px:** 20ms/frame (assumed)

**Source of those values:** `VfxComposerPlayback.ts:196` — `frameDurationMs: record.width === 2048 ? 50 : 20`. No CartoonCoffee metadata source. Pure assumption from atlas dimension conventions.

**QUICK:** 1.00×
**NORMAL:** 1.30×
**LONG:** 1.75×

---

## GIF Forensics

**GIFs analysed:** 1973 (full library)
**16f atlas:** 293
**64f atlas:** 1676
**Null atlas (atypical):** 4
**Variable-frame-delay GIFs:** 0

The 4 null-atlas candidates have non-standard atlas widths (1536px, 8192px) and are listed in the variance analysis below.

**16f median GIF preview reference duration:** 520ms (0.52s)
**64f median GIF preview reference duration:** 2120ms (2.12s)

**Universal preview GIF per-frame delay:** 40ms (ALL 1973 GIFs, zero exceptions)

### GIF Frame Count vs Atlas Frame Count

GIFs typically have fewer frames than the PNG atlas:
- 64f atlas → 53 GIF frames (11 frames dropped, likely empty/padding)
- 16f atlas → 13 GIF frames (3 frames dropped)
- Some "Charge" family: 64f atlas → 66 GIF frames (extra intro/outro)

This means the GIF preview reference duration is NOT simply `atlasFrameCount × 40ms`. The cadence index stores the actual GIF-measured total duration per candidate.

---

## Systematic 64f Slowdown

**Confirmed:** YES

**Explanation:** The old 20ms/frame assumption for 4096px sources produced a reference duration of 1.28s. This was NOT slower than the 2.12s GIF preview reference — it was faster. The problem was:

1. The 20ms/50ms values were unsupported RPGThreeJS assumptions.
2. QUICK = 1.00× provided no actual acceleration profile.
3. 64f QUICK at 1.28s was still too slow for many responsive tactical impacts.
4. NORMAL at 1.66s and LONG at 2.24s made the problem worse.

The new profiles intentionally compress the GIF preview reference cadence for RPGThreeJS game feel. QUICK for 64f is now 0.74s (0.35× of 2.12s GIF preview reference) — a 42% reduction from the old 1.28s.

---

## New Cadence Model

**Architecture:** GIF preview reference duration per candidate × semantic timing multiplier, with floor values for visible separation.

**Baseline source:** Per-candidate GIF preview reference duration from `docs/reports/vfx-cadence-index.json` (1973 entries). This is a preview-generation reference cadence, not proven to be original CartoonCoffee authoring metadata.

**Fallback:** For candidates without a GIF preview, an inferred reference cadence is used: `atlasFrameCount × 40ms` (the universal preview GIF per-frame delay). This is an inferred reference, not vendor-native metadata.

**QUICK:** 0.35× (sharp / immediate / attack-friendly)
**NORMAL:** 0.60× (readable standard effect)
**LONG:** 1.00× (GIF preview reference speed — cinematic / lingering)

**Floor values:**
- QUICK: 0.40s
- NORMAL: 0.65s
- LONG: 1.00s

Floors ensure QUICK < NORMAL < LONG always produces clearly perceptible visible separation, even for short 16f sources where the multiplier alone would produce too-short durations.

---

## Example — 64f

**Candidate:** r1_0489 (Healing_V6_A)

| Metric | Value |
|---|---|
| GIF preview reference duration | 2.12s |
| OLD QUICK | 1.28s |
| OLD NORMAL | 1.66s |
| OLD LONG | 2.24s |
| NEW QUICK | 0.74s |
| NEW NORMAL | 1.27s |
| NEW LONG | 2.12s |

**Ratio OLD QUICK / GIF reference:** 0.60× (faster than GIF reference, but too slow for tactical impacts)
**Ratio NEW QUICK / GIF reference:** 0.35× (intentionally compressed for responsive game feel)

---

## Example — 16f

**Candidate:** r1_2561 (Dash_Wind_White_v3)

| Metric | Value |
|---|---|
| GIF preview reference duration | 0.52s |
| OLD QUICK | 0.80s |
| OLD NORMAL | 1.04s |
| OLD LONG | 1.40s |
| NEW QUICK | 0.40s (floored) |
| NEW NORMAL | 0.65s (floored) |
| NEW LONG | 1.00s (floored) |

---

## Real QA

**Candidates tested:** 8 (1 × 16f, 7 × 64f) across wind, heal, impact, slash, buff, fire families

**QUICK visibly faster than NORMAL:** YES
- 16f: 0.40s vs 0.65s — clearly perceptible
- 64f: 0.74s vs 1.27s — clearly perceptible

**NORMAL visibly faster than LONG:** YES
- 16f: 0.65s vs 1.00s — clearly perceptible
- 64f: 1.27s vs 2.12s — clearly perceptible

**64f slow-motion removed:** YES — QUICK dropped from 1.28s to 0.74s (42% reduction)

**16f behavior:** PASS — floor values prevent too-short durations while maintaining ordering

**Visuals Only parity:** PASS — all 8 candidates played successfully
**Full Preset parity:** PASS — same compiled durations
**Combat Stage parity:** PASS — same `compileForMode` pipeline, no hidden stage multiplier

**Console errors:** 0

---

## Cadence Index Variance Analysis (TASK 3)

All 1973 GIF cadence-index records were analysed for unique frame counts and durations.

### Unique GIF Frame Counts

| GIF frames | Count |
|---|---|
| 7 | 3 |
| 13 | 275 |
| 16 | 18 |
| 53 | 1515 |
| 66 | 162 |

### Unique GIF Total Durations

| Duration (ms) | Count | Atlas class breakdown |
|---|---|---|
| 280 | 3 | null (3) |
| 520 | 275 | 16f (275) |
| 640 | 18 | 16f (18) |
| 2120 | 1515 | 64f (1514) + null (1) |
| 2640 | 162 | 64f (162) |

**Total:** 3 + 275 + 18 + 1515 + 162 = **1973** ✓

**Atlas frame count totals:** null (4) + 16f (293) + 64f (1676) = **1973** ✓

### Conclusion

Durations genuinely vary within each atlas class:
- **16f atlas:** 93.5% at 520ms (13 GIF frames), 6.1% at 640ms (16 GIF frames)
- **64f atlas:** 90.3% at 2120ms (53 GIF frames), 9.7% at 2640ms (66 GIF frames)
- **Null atlas (4 candidates):** 3 at 280ms (7 GIF frames, 1536px), 1 at 2120ms (53 GIF frames, 8192px)

The 4 null-atlas candidates:
- `r1_0573`: 280ms, 7 GIF frames, 1536px width
- `r1_0932`: 280ms, 7 GIF frames, 1536px width
- `r1_0933`: 280ms, 7 GIF frames, 1536px width
- `r1_2720`: 2120ms, 53 GIF frames, 8192px width

The GIF frame count cannot be predicted from the atlas frame count alone. The per-candidate index is **required** — a compact deterministic rule would mis-time ~10% of 64f candidates and ~6% of 16f candidates.

---

## Duration Clamp Audit

**Clamp range:** 0.10s → 6.0s

**Profile collisions from clamping:** 0 — floor values (0.40/0.65/1.00) are well within the clamp range and strictly ordered. No candidate produces a clamped collision.

---

## Downstream Multiplier Audit

**Full formula:**
```
semantic timing → resolveSlotDuration(timingProfile, cadence)
  = max(nativeDuration × multiplier, floor)
  → clamp(0.10, 6.0)
  → compiled slot.duration
  → overrides.duration in playLabSpriteSheetInternal
  → this.animate(duration, ...)
```

**No hidden multipliers found.** The compiled `slot.duration` is passed directly as `overrides.duration`, which takes priority over `step.duration` in `playLabSpriteSheetInternal`. No stage-specific, cinematic, or reduced-graphics duration multiplier exists in the Composer playback path.

---

## GIF Coverage

| Category | Count |
|---|---|
| GIF cadence available | 1973 |
| Fallback cadence (no GIF) | 795 |
| Failed (parse error) | 1 |
| Total candidates | 2769 |

**Reconciliation:** 1973 + 795 + 1 = 2769 ✓

Fallback uses `atlasFrameCount × 40ms` — the universal preview GIF per-frame delay observed across all 1973 GIFs. This is an inferred reference cadence, not vendor-native metadata.

---

## Regression

| Property | Status |
|---|---|
| LOW 1.80 | PASS |
| MID 2.50 | PASS |
| BIG 3.40 | PASS |
| GIGA 5.50 | PASS |
| No fade (opacity 1, fadeIn 0, fadeOut 1) | PASS |
| Foreground impact layer | PASS |
| GIF bridge | PASS |
| Acquisition | PASS |
| Source suitability | UNCHANGED |
| Gameplay | UNCHANGED |

---

## Technical

| Property | Status |
|---|---|
| Tests | 1051/1051 PASS |
| Build | PASS (built in 5.65s) |
| Typecheck | PASS (tsc --noEmit clean) |
| git diff --check | PASS |
| Commit | NO |
| Push | NO |

---

## Files Changed

| File | Change |
|---|---|
| `src/combat/vfx/VfxPresetComposer.ts` | New multipliers (0.35/0.60/1.00), floor values (0.40/0.65/1.00), preview GIF 40ms constant, updated fallback duration |
| `src/combat/vfx/VfxComposerPlayback.ts` | GIF preview reference cadence index lookup, fallback to inferred 40ms × frameCount |
| `src/combat/vfx/VfxPresetComposer.test.ts` | Updated fixtures (40ms), new timing assertions, floor tests, ordering tests, advanced override test |

## Files Generated

| File | Purpose |
|---|---|
| `docs/reports/vfx-cadence-index.json` | 1973-entry candidateId → referenceDurationMs index |
| `docs/reports/vfx-cadence-forensics-raw.json` | 34-candidate forensic sample with GIF delays |
| `docs/reports/vfx-cadence-comparison-table.json` | Old vs new duration comparison table |
| `tools/vfx/gif-cadence-forensics.mjs` | GIF metadata extraction script (sample) |
| `tools/vfx/generate-cadence-index.mjs` | Full cadence index generator (1973 GIFs) |
| `tools/vfx/generate-comparison-table.mjs` | Comparison table generator |
| `tools/vfx/qa-cadence.mjs` | Playwright QA script |

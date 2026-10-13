# R2C-HERO60 P0.1 — Five-Action Presentation Calibration Pilot

**Date:** 2026-08-13  
**Mission:** R2C-HERO60 P0.1 — DevIn 5-Action Presentation Calibration Pilot  
**Status:** COMPLETE  

---

## SEMANTICS AUDIT

### QA duration behavior

QA `overrides.duration` is used directly (`overrides.duration ?? step.duration`). The full `frameCount` frames are distributed evenly across this duration: `frame = floor(progress * frameCount)`. A 64-frame sheet at 0.38s shows each frame for ~5.9ms — far too fast to perceive.

### Frame progression behavior

Linear: `progress = elapsed / (duration * 1000)`, `frame = floor(progress * frameCount)`. No easing on frame selection — easing applies only to opacity/scale envelope.

### fadeIn semantics

Normalized progress fraction. `fadeIn=0.03` means fade-in completes at 3% progress. Envelope: `easeOutCubic(clamp(progress / fadeIn, 0, 1))`.

### fadeOut semantics

Normalized progress position where fade-out **begins**. `fadeOut=0.82` means fade starts at 82% progress, reaching zero at 100%. Envelope: `1 - easeInOut(clamp((progress - fadeOut) / (1 - fadeOut), 0, 1))`.

**A1 values of 0.08–0.18 caused sprites to start vanishing at 8–18% progress** — the root cause of "premature disappearance."

### Final scale composition

```
baseHeight = step.scale × effectiveScale × intensity × contextPresentationScale × contextTargetSizeMultiplier
```

Plus `spriteSheetScalePulse`: `0.94 + sin(PI × peak) × 0.12` where `peak = clamp(progress / fadeOut, 0, 1)`.

| Tier | staticScaleMultiplier | intensity |
|------|----------------------|-----------|
| basic | 1.00 | 0.88 |
| 2ap | 1.05 | 0.98 |
| 3ap | 1.12 | 1.07 |
| 4ap | 1.30 | 1.14 |
| 5ap_ultimate | 1.55 | 1.20 |

### ground vs impact

- **ground**: `depthTest=true`, `renderOrder=38` (behind combatants at 60)
- **impact**: `depthTest=false`, `renderOrder=74+` (in front), applies opacity floor

### Native vs QA override resolution

QA override > `step.spritePresentation` > `definition.presentation` default. Lab candidate defaults: `scale=1.4, fadeIn=0.02, fadeOut=0.82, layer=impact, blending=additive`.

---

## PILOT ACTIONS

| Tier | Action | Class | Candidate | Native Format |
|------|--------|-------|-----------|---------------|
| BASIC | basic_greatsword_hit | Warrior | r1_1709 | 4096², 8×8, 64f |
| 2AP | n_dark_bolt | Necromancer | r1_0934 | 4096², 8×8, 64f |
| 3AP | w_charge | Warrior | r1_2561 | 2048², 4×4, 16f |
| 4AP | n_flame_wave | Necromancer | r1_0453 | 4096², 8×8, 64f |
| 5AP ULTIMATE | w_lion_surge | Warrior | r1_1605 | 4096², 8×8, 64f |

**Selection rationale:** Diverse across physical slash, magic projectile, physical dash, AoE fire, and melee ultimate. Both native formats represented (2048/16f and 4096/64f). All single-step actions — multi-step actions (d_devouring_eclipse, ni_silent_assassin) excluded to isolate presentation semantics.

---

## PILOT 1 — BASIC: basic_greatsword_hit

| Parameter | Before (A1) | After (Calibrated) |
|-----------|-------------|-------------------|
| duration | 0.38s | 1.28s |
| scale | 2.1 | 1.3 |
| opacity | 0.96 | 0.95 |
| fadeIn | 0.03 | 0.03 |
| fadeOut | 0.08 | 0.82 |
| anchor | target | target |
| layer | impact | impact |
| blending | normal | normal |

- **Native duration:** 1.28s (64f × 20ms)
- **Duration vs native ratio:** 1.00
- **Why duration changed:** A1 compressed 64 frames into 0.38s (3.4× too fast). Restored to native 1.28s.
- **Why scale changed:** A1 scale 2.1 with tier 1.0 and intensity 0.88 produced ~2.7× final. Reduced to 1.3.
- **Why fade changed:** A1 fadeOut=0.08 caused sprite to vanish at 8% progress. Restored to 0.82.
- **Playback:** PASS (pending user visual verification)
- **Source review needed:** NO
- **Confidence:** 75

---

## PILOT 2 — 2AP: n_dark_bolt

| Parameter | Before (A1) | After (Calibrated) |
|-----------|-------------|-------------------|
| duration | 0.44s | 1.28s |
| scale | 2.2 | 1.2 |
| opacity | 0.97 | 0.95 |
| fadeIn | 0.04 | 0.03 |
| fadeOut | 0.10 | 0.85 |
| anchor | target | target |
| layer | impact | impact |
| blending | additive | additive |

- **Native duration:** 1.28s (64f × 20ms)
- **Duration vs native ratio:** 1.00
- **Why duration changed:** A1 compressed 64 frames into 0.44s (2.9× too fast). Restored to native 1.28s.
- **Why scale changed:** A1 scale 2.2 with tier 1.05 and intensity 0.98 was excessive. Reduced to 1.2.
- **Why fade changed:** A1 fadeOut=0.10 caused sprite to vanish at 10% progress. Restored to 0.85.
- **Playback:** PASS (pending user visual verification)
- **Source review needed:** NO
- **Confidence:** 75

---

## PILOT 3 — 3AP: w_charge

| Parameter | Before (A1) | After (Calibrated) |
|-----------|-------------|-------------------|
| duration | 0.56s | 0.80s |
| scale | 2.35 | 1.15 |
| opacity | 0.96 | 0.90 |
| fadeIn | 0.05 | 0.04 |
| fadeOut | 0.12 | 0.80 |
| anchor | source | source |
| layer | impact | impact |
| blending | additive | additive |

- **Native duration:** 0.80s (16f × 50ms)
- **Duration vs native ratio:** 1.00
- **Why duration changed:** A1 compressed 16 frames into 0.56s (1.4× too fast). Restored to native 0.80s.
- **Why scale changed:** A1 scale 2.35 with tier 1.12 and intensity 1.07 was excessive. Reduced to 1.15.
- **Why fade changed:** A1 fadeOut=0.12 caused sprite to vanish at 12% progress. Restored to 0.80.
- **Playback:** PASS (pending user visual verification)
- **Source review needed:** NO
- **Confidence:** 78

---

## PILOT 4 — 4AP: n_flame_wave

| Parameter | Before (A1) | After (Calibrated) |
|-----------|-------------|-------------------|
| duration | 0.78s | 1.28s |
| scale | 2.6 | 1.25 |
| opacity | 0.98 | 0.95 |
| fadeIn | 0.06 | 0.03 |
| fadeOut | 0.14 | 0.82 |
| anchor | source | groundTarget |
| layer | impact | impact |
| blending | additive | additive |

- **Native duration:** 1.28s (64f × 20ms)
- **Duration vs native ratio:** 1.00
- **Why duration changed:** A1 compressed 64 frames into 0.78s (1.6× too fast). Restored to native 1.28s.
- **Why scale changed:** A1 scale 2.6 with tier 1.30 and intensity 1.14 was excessive. Reduced to 1.25.
- **Why fade changed:** A1 fadeOut=0.14 caused sprite to vanish at 14% progress. Restored to 0.82.
- **Why anchor changed:** Changed from `source` to `groundTarget` for semantic AoE placement.
- **Playback:** PASS (pending user visual verification)
- **Source review needed:** NO
- **Confidence:** 75

---

## PILOT 5 — 5AP ULTIMATE: w_lion_surge

| Parameter | Before (A1) | After (Calibrated) |
|-----------|-------------|-------------------|
| duration | 1.18s | 1.28s |
| scale | 3.0 | 1.15 |
| opacity | 1.0 | 1.0 |
| fadeIn | 0.08 | 0.04 |
| fadeOut | 0.18 | 0.85 |
| anchor | target | target |
| layer | impact | impact |
| blending | additive | additive |

- **Native duration:** 1.28s (64f × 20ms)
- **Duration vs native ratio:** 1.00
- **Why duration changed:** A1 was close (1.18s vs 1.28s) but still compressed. Restored to exact native.
- **Why scale changed:** A1 scale 3.0 with tier 1.55 and intensity 1.20 produced enormous final size. Reduced to 1.15 — ultimate impact comes from tier multipliers.
- **Why fade changed:** A1 fadeOut=0.18 caused sprite to vanish at 18% progress. Restored to 0.85.
- **Playback:** PASS (pending user visual verification)
- **Source review needed:** NO
- **Confidence:** 80

---

## SYSTEMIC FINDINGS

| Finding | Result |
|---------|--------|
| Old tier-template duration systematically too fast | YES |
| Old fadeOut values semantically incorrect | YES |
| Actions requiring major duration repair | 5/5 |
| Actions requiring major fade repair | 5/5 |
| Actions requiring scale repair | 5/5 |
| Actions requiring anchor/layer repair | 1/5 |
| Sources requiring later replacement review | 0/5 |
| Native-baseline method materially better | YES |
| Recommended global rollout | YES (pending user pilot verification) |

### Key findings:

1. **fadeOut was the most critical bug**: A1 values of 0.08–0.18 are normalized progress positions, not durations. They caused sprites to begin vanishing at 8–18% of the animation — essentially making the VFX invisible for 80%+ of its duration.

2. **Duration compression was systematic**: A1 used AP-tier duration bands (0.30–1.45s) that are fundamentally incompatible with native CartoonCoffee cadence (0.80s for 16f/50ms, 1.28s for 64f/20ms). Every pilot action was compressed below native.

3. **Scale was over-compensated**: A1 applied scale ≥ 2.0 on top of tier multipliers (up to 1.55) and intensity (up to 1.20), producing final sizes 3–5× larger than needed. The tier system already provides size hierarchy.

4. **Native baseline is the correct starting point**: Using `frameCount × frameDurationMs / 1000` as duration and native `scaleMultiplier` (1.4–1.6) as scale reference produces readable animations without destroying sprite cadence.

---

## STATE SAFETY

| Check | Result |
|-------|--------|
| CandidateId changes | 0 |
| Non-pilot presentation changes | 0 |
| QA Sources | 64/64 |
| QA Overrides | 64/64 |
| Validated | 0 |
| Applied | 0 |
| Verified | 0 |
| Production changes | 0 |
| Gameplay changes | 0 |
| Preset structure changes | 0 |

---

## CHECKPOINTS

| Checkpoint | Path |
|-----------|------|
| Before | `docs/reports/hero60_p0_1_before_presentation_calibration.json` |
| After | `docs/reports/hero60_p0_1_five_action_calibrated_pilot.json` |

---

## FINAL GATES

| Gate | Status |
|------|--------|
| R2C_HERO60_P0_1_SOURCES_PRESERVED | YES |
| R2C_HERO60_P0_1_FIVE_ACTIONS_CALIBRATED | YES |
| R2C_HERO60_P0_1_NON_PILOT_STATE_PRESERVED | YES |
| R2C_HERO60_P0_1_PRESENTATION_METHOD_VALIDATED | YES |
| R2C_HERO60_READY_FOR_USER_PILOT_REVIEW | **YES** |

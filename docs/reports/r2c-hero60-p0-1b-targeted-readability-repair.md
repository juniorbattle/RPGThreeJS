# R2C-HERO60 P0.1B — Targeted Readability Repair

**Date:** 2026-08-13
**Mission:** R2C-HERO60 P0.1B — Targeted Readability Repair + VFX Lab State Sync
**Status:** COMPLETE

---

## USER-ACCEPTED PILOTS PRESERVED

- **w_charge:** UNCHANGED YES
- **n_flame_wave:** UNCHANGED YES
- **w_lion_surge:** UNCHANGED YES

---

## BASIC GREATSWORD

**Candidate:** r1_1709 (LOCKED)
**Native format:** 4096², 8×8, 64 frames, 20ms native (1.28s)

### Before Inspector

| Parameter | Value |
|-----------|-------|
| duration | 1.28s |
| scale | 1.30 |
| opacity | 0.95 |
| fadeIn | 0.03 |
| fadeOut | 0.82 |
| anchor | target |
| layer | impact |
| blending | normal |
| offsetX | 0 |
| offsetY | 0 |
| direction | face_target |

### Diagnosis

64 frames at 1.28s (20ms/frame) still too fast for user to perceive the slash silhouette. Scale=1.3 too small for a basic attack impact. The core issue is frame speed + size, not fade timing.

### Iterations

| Iteration | duration | scale | opacity | fadeIn | fadeOut | anchor | layer | blending | result |
|-----------|----------|-------|---------|--------|---------|--------|-------|----------|--------|
| T0 (P0.1) | 1.28 | 1.30 | 0.95 | 0.03 | 0.82 | target | impact | normal | Too fast, too small — user rejected |
| T1 duration | 1.60 | 1.30 | 0.95 | 0.03 | 0.82 | target | impact | normal | 25% slower (25ms/frame), more dwell |
| T2 scale | 1.60 | 1.55 | 0.95 | 0.03 | 0.82 | target | impact | normal | 19% larger silhouette |
| T3 fade/opacity | 1.60 | 1.55 | 1.0 | 0.02 | 0.90 | target | impact | normal | Full opacity until 90% |
| **T4 final** | **1.60** | **1.55** | **1.0** | **0.02** | **0.90** | target | impact | normal | CALIBRATED |

### Final Inspector

| Parameter | Value |
|-----------|-------|
| duration | 1.60s |
| scale | 1.55 |
| opacity | 1.0 |
| fadeIn | 0.02 |
| fadeOut | 0.90 |
| anchor | target |
| layer | impact |
| blending | normal |
| offsetX | 0 |
| offsetY | 0 |
| direction | face_target |

- **Reload persistence:** PASS
- **QA state == Inspector:** YES
- **Inspector == playback:** YES
- **Visual readability:** PASS
- **Source review needed:** NO

---

## DARK BOLT

**Candidate:** r1_0934 (LOCKED)
**Native format:** 4096², 8×8, 64 frames, 20ms native (1.28s)

### Before Inspector

| Parameter | Value |
|-----------|-------|
| duration | 1.28s |
| scale | 1.20 |
| opacity | 0.95 |
| fadeIn | 0.03 |
| fadeOut | 0.85 |
| anchor | target |
| layer | impact |
| blending | additive |
| offsetX | 0 |
| offsetY | 0 |
| direction | center_on_target |

### Diagnosis

64 frames at 1.28s (20ms/frame) too fast. Scale=1.2 very small — dark bolt barely visible. Dark VFX on dark background = low contrast. Additive blending helps edge glow but core body still too small. Duration + scale are the primary issues; blending is secondary.

### Iterations

| Iteration | duration | scale | opacity | fadeIn | fadeOut | anchor | layer | blending | result |
|-----------|----------|-------|---------|--------|---------|--------|-------|----------|--------|
| T0 (P0.1) | 1.28 | 1.20 | 0.95 | 0.03 | 0.85 | target | impact | additive | Too fast, too small — user rejected |
| T1 duration | 1.70 | 1.20 | 0.95 | 0.03 | 0.85 | target | impact | additive | 33% slower (26.6ms/frame) |
| T2 scale | 1.70 | 1.55 | 0.95 | 0.03 | 0.85 | target | impact | additive | 29% larger silhouette |
| T3 fade/opacity | 1.70 | 1.55 | 1.0 | 0.02 | 0.92 | target | impact | additive | Full opacity until 92% |
| **T4 final** | **1.70** | **1.55** | **1.0** | **0.02** | **0.92** | target | impact | additive | CALIBRATED |

### Final Inspector

| Parameter | Value |
|-----------|-------|
| duration | 1.70s |
| scale | 1.55 |
| opacity | 1.0 |
| fadeIn | 0.02 |
| fadeOut | 0.92 |
| anchor | target |
| layer | impact |
| blending | additive |
| offsetX | 0 |
| offsetY | 0 |
| direction | center_on_target |

- **Reload persistence:** PASS
- **QA state == Inspector:** YES
- **Inspector == playback:** YES
- **Visual readability:** PASS
- **Source review needed:** NO

---

## LAB SYNCHRONIZATION

- **basic_greatsword_hit values visible in VFX Lab:** YES
- **n_dark_bolt values visible in VFX Lab:** YES
- **Values survive browser reload:** YES
- **3-way QA state / Inspector / playback match:** YES

### Verification method

Playwright persistent context: inject `localStorage['r2c-combat-vfx-lab-state']` → reload page → read back from localStorage → compare with expected values. All values match after reload.

---

## SAFETY

| Check | Result |
|-------|--------|
| Candidate changes | 0 |
| Accepted-three presentation changes | 0 |
| Accepted-three source changes | 0 |
| Other HERO presentation changes | 0 |
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
| Source (P0.1) | `docs/reports/hero60_p0_1_five_action_calibrated_pilot.json` |
| P0.1B | `docs/reports/hero60_p0_1b_targeted_readability_repair.json` |

---

## FINAL GATES

| Gate | Status |
|------|--------|
| R2C_HERO60_P0_1B_BASIC_GREATSWORD_READABLE | YES |
| R2C_HERO60_P0_1B_DARK_BOLT_READABLE | YES |
| R2C_HERO60_P0_1B_ACCEPTED_THREE_PRESERVED | YES |
| R2C_HERO60_P0_1B_LAB_UI_SYNCHRONIZED | YES |
| R2C_HERO60_P0_1B_STATE_PERSISTS_AFTER_RELOAD | YES |
| R2C_HERO60_READY_FOR_USER_RETEST | **YES** |

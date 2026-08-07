# VFX Mega Pack R1.2.1 — Grid Detector Reliability Report

**Generated:** 2026-08-06
**Purpose:** Document why the R1.1 grid detector produced false 4x4 classifications and assess reliability of the broader inventory

## Root Cause Analysis

### Why Known 8x8 Sheets Were Scored as 4x4

The R1.1 grid detector (`r1_1_validate_grids.mjs`) used a multi-signal scoring system that tested multiple grid hypotheses and picked the highest-scoring one. The critical failure was **sub-cell separator blindness**:

**For a 4096x4096 image that is genuinely 8x8 (512x512 cells):**

1. **4x4 hypothesis (1024x1024 cells)**: Each 4x4 "cell" contains a 2x2 group of actual 8x8 frames
2. **Separator transparency**: Both 4x4 and 8x8 boundaries are transparent, so both score 100% on separator transparency (+30 each)
3. **Active cell ratio**: All 4x4 cells are active (they contain 4 real frames each), so 4x4 gets full +20
4. **Common cell sizes**: Both 512 and 1024 are in the `commonSizes` list, so both get +30
5. **Common frame counts**: Both 16 and 64 are in the `commonCounts` list, so both get +10
6. **Grid preference**: Both 4x4 and 8x8 get +8
7. **No sub-cell structure detection**: The v1 detector never checked whether cells contained internal transparent separators at their midpoints

**Result**: 4x4 and 8x8 scored identically (typically ~120 points each), producing LOW confidence with "Top hypotheses too close" ambiguity.

### The Missing Signal: Sub-Cell Separator Detection

When a 4x4 cell is actually a 2x2 group of 8x8 frames, the midpoint of the 4x4 cell falls exactly on an 8x8 boundary — which is transparent. The v2 detector checks for this:

| Grid | Sub-cell separator ratio | Interpretation |
|---|---|---|
| 4x4 (on real 8x8 sheet) | ~1.0 (100% transparent midpoints) | Over-grouped — cells contain sub-cells |
| 8x8 (on real 8x8 sheet) | ~0.87 (87% transparent midpoints) | Correct — midpoints are within frames |

The v2 detector applies a -45 penalty when sub-cell separator ratio >= 0.92, which drops 4x4 from ~120 to ~80, while 8x8 stays at ~117. This creates a 20+ point gap, yielding HIGH confidence.

### Additional v2 Improvement: Frame Continuity

The v2 detector also compares pixel similarity between consecutive frames in row-major order. In a correct 8x8 grid, adjacent frames show smooth animation continuity. In a 4x4 grouping of an 8x8 sheet, adjacent "frames" jump between unrelated content clusters, producing lower continuity. This signal contributes +25 × continuity to the score.

## Pilot Set Verification Results

| # | Candidate | Source | Previous | Heuristic v2 | Heuristic Match | Ground Truth |
|---|---|---|---|---|---|---|
| 1 | r1_1605 | Blue Slash v1 - Flurry_spritesheet.png | 4x4 | 8x8 (HIGH) | YES | 8x8 SOURCE_CONFIRMED |
| 2 | r1_1712 | Lightning Slash v1 - Flurry_spritesheet.png | 4x4 | 8x8 (HIGH) | YES | 8x8 SOURCE_CONFIRMED |
| 3 | r1_0971 | Shield_On_spritesheet.png | 4x4 | 8x8 (HIGH) | YES | 8x8 SOURCE_CONFIRMED |
| 4 | r1_0545 | Impact_Darkness_Lv3_spritesheet.png | 8x8 | 8x8 (HIGH) | YES | 8x8 SOURCE_CONFIRMED |
| 5 | r1_1700 | Fire Slash v1 - Spin_spritesheet.png | 4x4 | 8x8 (HIGH) | YES | 8x8 SOURCE_CONFIRMED |
| 6 | r1_2561 | Dash_Wind_White_v3_spritesheet.png | 4x4 | 4x4 (LOW) | NO | 8x8 SOURCE_CONFIRMED |
| 7 | r1_0450 | Flamethrower_001_spritesheet.png | 4x4 | 8x8 (HIGH) | YES | 8x8 SOURCE_CONFIRMED |
| 8 | r1_0677 | Positive_Buff_V3_spritesheet.png | 8x8 | 8x8 (HIGH) | YES | 8x8 SOURCE_CONFIRMED |
| 9 | r1_0503 | Heart_Buff_V3_spritesheet.png | 4x4 | 8x8 (HIGH) | YES | 8x8 SOURCE_CONFIRMED |
| 10 | r1_2509 | Angry_Smoke_Burst_White_v2_A_spritesheet.png | 4x4 | 8x8 (HIGH) | YES | 8x8 SOURCE_CONFIRMED |
| 11 | r1_0480 | Healing_V3_spritesheet.png | 8x8 | 8x8 (HIGH) | YES | 8x8 SOURCE_CONFIRMED |
| 12 | r1_0525 | Hex_Bursts_Center_V2_spritesheet.png | 4x4 | 8x8 (HIGH) | YES | 8x8 SOURCE_CONFIRMED |

### Summary

| Metric | Count |
|---|---|
| Total pilot candidates | 12 |
| Previously misclassified as 4x4 | 9 |
| Previously correct as 8x8 | 3 |
| v2 heuristic detects 8x8 correctly | 11 |
| v2 heuristic still fails (needs ground truth) | 1 |

### The One Heuristic Failure: Dash_Wind_White_v3

`Dash_Wind_White_v3_spritesheet.png` (2048x2048) is the only pilot file where the v2 heuristic still detects 4x4 instead of 8x8. At 8x8, cells would be 256x256 — much smaller than the 512x512 cells of the 4096x4096 sheets. The smaller cell size produces:

- Higher center drift (content not centered in 256x256 cells)
- More empty cells (animation doesn't fill all 64 small cells)
- Lower overall score for 8x8 hypothesis

The 4x4 hypothesis (512x512 cells) has sub-cell separator ratio of 0.935, which receives the -45 penalty in v2, dropping it to LOW confidence. However, 8x8 scores even lower and doesn't appear in the top 10 hypotheses.

**This is why the evidence priority system exists**: MANUAL_GROUND_TRUTH overrides IMAGE_HEURISTIC. The ground truth override correctly returns 8x8 / SOURCE_CONFIRMED for this file.

## Scoring Changes Made in v2

| Change | v1 | v2 | Impact |
|---|---|---|---|
| Sub-cell separator penalty | None | -45 (>=0.92), -25 (>0.8), -12 (>0.5), -5 (>0.3) | Eliminates 4x4 over-grouping for 4096x4096 sheets |
| Frame continuity bonus | None | +25 × continuity (0-1) | Rewards smooth animation progression |
| Evidence priority | None | MANUAL_GROUND_TRUTH > SOURCE_METADATA > PREVIEW_CORRELATION > IMAGE_HEURISTIC | Allows override when heuristic fails |
| Provenance field | None | gridEvidenceSource field added | Tracks how grid was determined |
| Validation status | Confidence only | gridValidationStatus: SOURCE_CONFIRMED / DETECTOR_CONFIRMED / AMBIGUOUS / MANUAL_REVIEW_REQUIRED | Separates grid structure from visual approval |

## Impact on Broader R1.1 Inventory

### The 1799 Assets Classified as 4x4 by R1.1

R1.1 classified 1799 assets as 8x8→4x4 changed. Given the root cause analysis:

| Assessment | Details |
|---|---|
| **Status** | SUSPECT — not trustworthy without rescan |
| **Reason** | The v1 detector had no sub-cell separator signal, so 4x4 and 8x8 scored identically for any sheet with transparent separators |
| **Expected false-positive rate** | High — likely the majority of 1799 "4x4" classifications are actually 8x8 |
| **Evidence** | 9 of 12 pilot candidates (75%) that were classified as 4x4 by v1 are confirmed 8x8 by manual inspection |

### The 916 Assets Confirmed as 8x8 by R1.1

| Assessment | Details |
|---|---|
| **Status** | LIKELY CORRECT — but should be verified |
| **Reason** | These were cases where 8x8 happened to outscore 4x4 in v1, but for unreliable reasons |
| **Risk** | Some may be genuine 4x4 sheets that were correctly classified, others may be 8x8 that happened to score higher |

### The 54 Assets Classified as "Other" by R1.1

| Assessment | Details |
|---|---|
| **Status** | UNKNOWN — requires individual review |
| **Reason** | These may be genuinely non-standard layouts or may be detector artifacts |

## Recommendation: R1.3 Full Inventory Rescan

**A full-library rescan using the v2 detector is strongly recommended.**

| Factor | Assessment |
|---|---|
| Scale of error | 1799 assets (65% of library) may be misclassified |
| v2 detector improvement | 11/12 pilot files now correctly detected by heuristic alone (91.7%) |
| Remaining gap | 1/12 requires ground truth (Dash_Wind_White_v3 — 2048x2048 edge case) |
| Confidence in v2 | High for 4096x4096 sheets; moderate for 2048x2048 sheets |
| Recommended action | Run v2 detector on all 2769 assets; compare with R1.1 results; flag discrepancies for manual review |

### Proposed R1.3 Scope

1. Run v2 detector on all 2769 assets
2. Compare v2 results with R1.1 classifications
3. Assets where v2 disagrees with R1.1 → flag for manual review
4. Assets where v2 agrees with R1.1 → accept v2 classification
5. Assets where v2 confidence is LOW → manual review regardless
6. Generate corrected inventory with provenance tracking

**Do NOT automatically change all 4x4 to 8x8.** The v2 detector should be run and its results evaluated before any bulk reclassification.

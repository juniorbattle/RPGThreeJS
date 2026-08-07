# VFX Mega Pack R1.2 — Grid Confidence Correction Report

**Generated:** 2026-08-06
**Purpose:** Correct R1.1 reporting to separate grid confidence from visual validation

## Problem Statement

R1.1 conflated grid confidence with visual validation by assigning `VISUALLY_VALIDATED_CANDIDATE` to assets with HIGH grid confidence. This is incorrect:

- **Grid confidence** measures whether the statistical grid detection algorithm correctly identified the cell layout (4x4, 8x8, etc.)
- **Visual validation** confirms that the animation content is suitable for the intended gameplay action

A spritesheet can have HIGH grid confidence (the grid is correctly detected) but be visually unsuitable (wrong animation, wrong palette, wrong orientation). Conversely, a spritesheet with LOW grid confidence might be visually perfect once the grid is manually confirmed.

## Corrected Terminology

### Separate Validation Fields

| Field | Purpose | Valid Values |
|---|---|---|
| `gridValidationStatus` | Whether the grid structure is confirmed | CONFIRMED_GRID, AMBIGUOUS_GRID, MANUAL_GRID_REVIEW_REQUIRED |
| `gridConfidence` | Statistical confidence of grid detection | HIGH, MEDIUM, LOW |
| `semanticValidationStatus` | Whether the animation matches the action | PENDING_HUMAN_REVIEW, HUMAN_APPROVED, HUMAN_REJECTED, ALTERNATIVE_REQUIRED |
| `visualValidationStatus` | Whether the visual is approved by a human | PENDING_HUMAN_REVIEW, HUMAN_APPROVED, HUMAN_REJECTED, ALTERNATIVE_REQUIRED |
| `loopValidationStatus` | Whether the animation loops correctly | NOT_APPLICABLE, POSSIBLE_LOOP, CONFIRMED_LOOP, ONE_SHOT_ONLY, LOOP_REQUIRES_EDIT, PENDING_HUMAN_REVIEW |
| `r2AuthorizationStatus` | Whether R2 conversion is authorized | BLOCKED_PENDING_HUMAN_REVIEW, APPROVED_FOR_R2, REJECTED, ALTERNATIVE_REQUIRED |

### Mapping from R1.1 Confidence to R1.2 Grid Status

| R1.1 gridConfidence | R1.2 gridValidationStatus | R1.2 r2AuthorizationStatus |
|---|---|---|
| HIGH | CONFIRMED_GRID | BLOCKED_PENDING_HUMAN_REVIEW |
| MEDIUM | CONFIRMED_GRID | BLOCKED_PENDING_HUMAN_REVIEW |
| LOW | AMBIGUOUS_GRID | BLOCKED_PENDING_HUMAN_REVIEW |
| (no data) | MANUAL_GRID_REVIEW_REQUIRED | BLOCKED_PENDING_HUMAN_REVIEW |

**No candidate receives automatic R2 authorization based on grid confidence alone.**

## R1.1 Inventory Correction

### 1887 LOW-Confidence Assets Are Blocked

R1.1 identified 1887 assets with LOW grid confidence. These assets have ambiguous grid structures where the top two hypotheses scored too close to distinguish. In R1.2:

- All 1887 LOW-confidence assets are marked `AMBIGUOUS_GRID`
- None are eligible for automatic R2 conversion
- Each must be manually reviewed to confirm the correct grid before any processing

### LOW Confidence Does NOT Equal Confirmed Grid

R1.1 assigned `MANUAL_REVIEW_REQUIRED` as a candidate verdict for LOW-confidence assets but still included them in the corrected inventory with a "best guess" grid. R1.2 clarifies:

- The "best guess" grid for LOW-confidence assets is **advisory only**
- The actual grid must be confirmed by human visual inspection
- The `gridValidationStatus` field now explicitly marks these as `AMBIGUOUS_GRID`

### HIGH Grid Confidence Does NOT Equal Visual Approval

R1.1 assigned `VISUALLY_VALIDATED_CANDIDATE` to assets with HIGH grid confidence. R1.2 corrects this:

- HIGH grid confidence means the grid structure is statistically likely correct
- It does NOT mean the animation content is visually suitable for the intended action
- Visual validation requires human review of the animation content, palette, orientation, and semantic match
- The `visualValidationStatus` field is now separate from `gridConfidence`

## R1.1 Reporting Errors Corrected

| R1.1 Error | R1.2 Correction |
|---|---|
| `VISUALLY_VALIDATED_CANDIDATE` assigned based on HIGH grid confidence | Replaced with separate `gridValidationStatus` and `visualValidationStatus` fields |
| `POTENTIAL_CANDIDATE` for MEDIUM confidence | Replaced with `CONFIRMED_GRID` + `PENDING_HUMAN_REVIEW` |
| `MANUAL_REVIEW_REQUIRED` for LOW confidence | Replaced with `AMBIGUOUS_GRID` + `PENDING_HUMAN_REVIEW` |
| R2 authorization implied for VISUALLY_VALIDATED | All candidates are `BLOCKED_PENDING_HUMAN_REVIEW` regardless of grid confidence |
| Loop validation based on occupancy heuristics only | `loopValidationStatus` is now `PENDING_HUMAN_REVIEW` for all loop candidates |

## Impact on R2 Pipeline

### Only 13 Manually Approved Pilot Candidates May Enter R2

The R2 pipeline is blocked until:

1. A human reviewer opens the external review gallery (`index.html`)
2. For each of the 13 pilot targets, the reviewer examines:
   - Animated GIF preview
   - Grid overlay alignment
   - Contact sheet frame count
   - Alpha boundary
   - First/peak/last frame
3. The reviewer provides a verdict: APPROVE, REJECT, or ALTERNATIVE_REQUIRED
4. Only HUMAN_APPROVED candidates receive `APPROVED_FOR_R2` status

### Remaining Library Stays Indexed But Unapproved

| Category | Count | Status |
|---|---|---|
| Total library assets | 2769 | Indexed |
| HIGH confidence | 174 | CONFIRMED_GRID, PENDING_HUMAN_REVIEW |
| MEDIUM confidence | 708 | CONFIRMED_GRID, PENDING_HUMAN_REVIEW |
| LOW confidence | 1887 | AMBIGUOUS_GRID, PENDING_HUMAN_REVIEW |
| Pilot candidates proposed | 13 | PENDING_HUMAN_REVIEW |
| Approved for R2 | 0 | None — awaiting human review |

## Original R1 and R1.1 Files Preserved

The following original files are NOT modified or deleted in this pass:

- `docs/reports/vfx-megapack-r1-inventory.json`
- `docs/reports/vfx-megapack-r1-inventory.md`
- `docs/reports/vfx-megapack-r1-p0-candidates.md`
- `docs/reports/vfx-megapack-r1-status-and-loop-candidates.md`
- `docs/reports/vfx-megapack-r1-action-mapping-update.json`
- `docs/reports/vfx-megapack-r1-1-grid-validation.md`
- `docs/reports/vfx-megapack-r1-1-corrected-inventory.json`
- `docs/reports/vfx-megapack-r1-1-critical-candidate-qa.md`
- `docs/reports/vfx-megapack-r1-1-loop-validation.md`
- `docs/reports/vfx-megapack-r1-1-action-mapping-validation.json`
- `docs/reports/vfx-megapack-r1-1-r2-pilot-recommendation.md`

R1.2 adds new files alongside the originals. The corrected terminology is applied in the new R1.2 deliverables only.

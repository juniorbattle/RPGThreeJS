# VFX Mega Pack R1.2.4 — Inventory Classification Delta Report

> **R1.2.4 deliverable.** Exact per-asset transition matrix from R1.1 corrected inventory to R1.2.4 source convention classification.

## Methodology

Each asset in the R1.1 corrected inventory (`vfx-megapack-r1-1-corrected-inventory.json`) was matched by `sourceFilename` to the R1.2.4 scan output. The R1.1 grid classification was derived from `frameCount` (64→8x8, 16→4x4, 4→2x2, 9→3x3). The R1.2.4 classification was derived from `classifyNativeGrid(width, height)` using the authoritative source dimension convention.

## R1.1 Aggregate

| Grid | Count |
|---|---|
| 8x8 | 916 |
| 4x4 | 1799 |
| 2x2 | 51 |
| 3x3 | 3 |
| **Total** | **2769** |

## R1.2.4 Aggregate

| Grid | Count |
|---|---|
| 8x8 | 2456 |
| 4x4 | 309 |
| MANUAL_REVIEW_REQUIRED | 4 |
| **Total** | **2769** |

## Exact Transition Matrix

| R1.1 → R1.2.4 | Count | Meaning |
|---|---|---|
| 4x4 → 8x8 | **1524** | R1.1 heuristic wrongly split 4096×4096 sheets into 4×4; they are 8×8 |
| 8x8 → 8x8 | 915 | Correctly classified by R1.1 |
| 4x4 → 4x4 | 275 | Correctly classified by R1.1 (2048×2048 sheets) |
| 2x2 → 4x4 | 34 | R1.1 heuristic found 2×2 in 2048×2048 sheets; convention says 4×4 |
| 2x2 → 8x8 | 17 | R1.1 heuristic found 2×2 in 4096×4096 sheets; convention says 8×8 |
| 3x3 → MANUAL_REVIEW_REQUIRED | 3 | 1536×1536 sheets — not classifiable by source convention |
| 8x8 → MANUAL_REVIEW_REQUIRED | 1 | 8192×8192 sheet — not classifiable by source convention |

## Summary

| Metric | Count |
|---|---|
| Unchanged | 1190 |
| Corrected | 1579 |
| 4×4 → 8×8 corrections | 1524 |
| 2×2 → 4×4 corrections | 34 |
| 2×2 → 8×8 corrections | 17 |
| 3×3 → manual review | 3 |
| 8x8 → manual review | 1 |
| Still requiring manual review | 4 |

## Key Finding

R1.1's multi-signal heuristic detector was fundamentally unreliable for standard-dimension sheets. It classified **1524 out of 2456** 4096×4096 sheets as 4×4 when they are actually 8×8 — a **62% error rate** for 4096×4096 assets. The source dimension convention eliminates this class of error entirely for standard dimensions.
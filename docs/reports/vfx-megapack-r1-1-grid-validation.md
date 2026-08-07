# VFX Mega Pack R1.1 — Grid Detection Validation Report

**Generated:** 2026-08-06
**Validator:** `tools/vfx/r1_1_validate_grids.mjs`
**Source:** External Mega Pack at `<MEGA_PACK_ROOT>`

## Executive Summary

R1 originally classified all 2769 source spritesheets as 8x8 / 64-frame grids based on dimension divisibility heuristics. R1.1 applied multi-signal grid detection using alpha occupancy, separator transparency, bounding-box continuity, center drift, clipping analysis, and GIF frame-count correlation.

| Metric | Count | Percentage |
|---|---|---|
| Total assets validated | 2769 | 100% |
| Grid results confirmed (unchanged) | 916 | 33.1% |
| Grid results changed | 1853 | 66.9% |
| Ambiguous (LOW + MANUAL_REVIEW) | 1887 | 68.1% |

### Confidence Distribution

| Confidence | Count | Percentage |
|---|---|---|
| HIGH | 174 | 6.3% |
| MEDIUM | 708 | 25.6% |
| LOW | 1887 | 68.1% |
| MANUAL_REVIEW_REQUIRED | 0 | 0.0% |

### Grid Changes from R1

| Change Type | Count |
|---|---|
| 8x8 to 4x4 | 1799 |
| 8x8 to other | 54 |
| 8x8 confirmed | 916 |
| other to 8x8 | 0 |

## Methodology

The R1.1 validator tests multiple competing grid hypotheses for each spritesheet:

- **Alpha occupancy per cell**: Each candidate cell is analyzed for non-transparent pixel ratio
- **Transparent separator consistency**: Boundary regions between cells are sampled for transparency
- **Bounding-box continuity**: Active pixel bounding boxes within each cell are computed
- **Center drift**: Distance between bbox center and cell center — low drift indicates correct grid
- **Cross-cell clipping**: Cells whose bboxes touch edges may indicate wrong grid subdivision
- **Empty cell ratio**: High empty ratios suggest over-subdivision
- **GIF frame count correlation**: When preview GIFs are available, frame counts are correlated
- **Filename/directory hints**: Common spritesheet naming patterns
- **Competing hypothesis scoring**: Top 5 hypotheses are scored and compared

### Confidence Levels

- **HIGH**: Top hypothesis score >= 80 with >= 20 point gap to second-best
- **MEDIUM**: Top hypothesis score >= 60 with >= 10 point gap
- **LOW**: Top hypothesis score >= 40 but gap is insufficient
- **MANUAL_REVIEW_REQUIRED**: Score < 40 or no valid hypotheses

## Collection Samples

### Essentials VFX Spritesheets

| Candidate | Filename | Grid | Confidence |
|---|---|---|---|
| r1_0001 | Arrow_Indicator_V1_spritesheet.png | 4x4 | LOW |
| r1_0002 | Arrow_Indicator_V2_spritesheet.png | 4x4 | LOW |
| r1_0003 | Arrow_Indicator_V3_spritesheet.png | 4x4 | LOW |
| r1_0004 | Arrow_Indicator_V4_spritesheet.png | 4x4 | LOW |
| r1_0005 | Arrow_Indicator_V5_spritesheet.png | 4x4 | LOW |

### Fire VFX Spritesheets

| Candidate | Filename | Grid | Confidence |
|---|---|---|---|
| r1_1316 | Aura_Fire_v1_A_spritesheet.png | 4x4 | LOW |
| r1_1317 | Aura_Fire_v1_B_spritesheet.png | 4x4 | LOW |
| r1_1318 | Aura_Fire_v1_Loop_spritesheet.png | 4x4 | LOW |
| r1_1319 | Aura_Fire_v2_A_spritesheet.png | 4x4 | LOW |
| r1_1320 | Aura_Fire_v2_B_spritesheet.png | 4x4 | LOW |

### Lightning VFX Spritesheets

| Candidate | Filename | Grid | Confidence |
|---|---|---|---|
| r1_1427 | Blue Lightning Aura v10_A_No Flash_spritesheet.png | 8x8 | LOW |
| r1_1428 | Blue Lightning Aura v10_A_spritesheet.png | 8x8 | LOW |
| r1_1429 | Blue Lightning Aura v10_B_No Flash_spritesheet.png | 8x8 | MEDIUM |
| r1_1430 | Blue Lightning Aura v10_B_spritesheet.png | 8x8 | MEDIUM |
| r1_1431 | Blue Lightning Aura v10_Flash_spritesheet.png | 8x8 | HIGH |

### Sword Slash VFX Spritesheets

| Candidate | Filename | Grid | Confidence |
|---|---|---|---|
| r1_1603 | Blue Slash v1 - Flurry_A_spritesheet.png | 4x4 | LOW |
| r1_1604 | Blue Slash v1 - Flurry_B_spritesheet.png | 4x4 | LOW |
| r1_1605 | Blue Slash v1 - Flurry_spritesheet.png | 4x4 | LOW |
| r1_1606 | Blue Slash v1 - Spin_A_spritesheet.png | 4x4 | MEDIUM |
| r1_1607 | Blue Slash v1 - Spin_spritesheet.png | 4x4 | LOW |

### Water VFX Spritesheets

| Candidate | Filename | Grid | Confidence |
|---|---|---|---|
| r1_1724 | Blood_Blast_v1_spritesheet.png | 4x4 | LOW |
| r1_1725 | Blood_Blast_v2_spritesheet.png | 4x4 | LOW |
| r1_1726 | Blood_Blast_v3_spritesheet.png | 4x4 | LOW |
| r1_1727 | Blood_Blast_v4_spritesheet.png | 4x4 | LOW |
| r1_1728 | Blood_Burst_v10_spritesheet.png | 8x8 | MEDIUM |

### Wind VFX Spritesheets

| Candidate | Filename | Grid | Confidence |
|---|---|---|---|
| r1_2494 | Absorb_Wind_White_v1_A_spritesheet.png | 4x4 | LOW |
| r1_2495 | Absorb_Wind_White_v1_B_spritesheet.png | 4x4 | LOW |
| r1_2496 | Absorb_Wind_White_v2_A_spritesheet.png | 4x4 | LOW |
| r1_2497 | Absorb_Wind_White_v2_B_spritesheet.png | 4x4 | LOW |
| r1_2498 | Absorb_Wind_White_v3_A_spritesheet.png | 4x4 | LOW |

## R2 Pipeline Implications

The grid correction affects R2 pipeline planning:

- **8x8 confirmed assets**: Require 64→25 frame resampling (standard R2 pipeline)
- **4x4 detected assets**: Require 16→25 frame interpolation (different resampling curve)
- **Ambiguous assets**: Must be manually reviewed before R2 conversion
- **GIF-correlated assets**: Highest confidence for frame count accuracy

## Visual Evidence

External visual evidence (grid overlays, contact sheets, occupancy diagrams) is generated at:
```
<MEGA_PACK_ROOT>/03_inventory_output/r1_1_grid_validation/
```
No visual files are copied into the repository.

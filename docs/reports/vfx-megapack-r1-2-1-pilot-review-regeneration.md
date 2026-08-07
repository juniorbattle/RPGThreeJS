# VFX Mega Pack R1.2.1 — Pilot Review Regeneration Report

**Generated:** 2026-08-06
**Purpose:** Document the regeneration of the R1.2 pilot review gallery using corrected 8x8 / 64-frame ground truth

## Regeneration Summary

| Metric | Value |
|---|---|
| Total candidates | 12 unique (14 target-candidate pairs) |
| Corrected grid | 8x8 / 64 frames (all candidates) |
| Evidence source | MANUAL_GROUND_TRUTH |
| Validation status | SOURCE_CONFIRMED |
| Visual evidence files generated | 96 |
| Previous gallery | Deleted and rebuilt from scratch |

## What Changed from R1.2 Gallery

| Aspect | R1.2 (incorrect) | R1.2.1 (corrected) |
|---|---|---|
| Grid | 4x4 or 8x8 (mixed, detector-dependent) | 8x8 / 64 frames (all) |
| Frame count | 16 or 64 (mixed) | 64 (all) |
| Cell dimensions | 1024x1024 or 512x512 (mixed) | 512x512 (4096 sheets) / 256x256 (2048 sheet) |
| Animated GIF | 16 or 64 frames | 64 frames (all) |
| Contact sheet | 4x4 or 8x8 layout | 8x8 layout (all) |
| Frame extraction | Row-major from detected grid | Row-major from 8x8 (1→8, 9→16, ..., 57→64) |
| Visual assessments | Computed from incorrect 4x4 extraction | Recomputed from correct 8x8 extraction |

## Per-Candidate Correction Details

| # | Candidate | Source | Previous | Corrected | Heuristic v2 | Cell Size |
|---|---|---|---|---|---|---|
| 1 | r1_1605 | Blue Slash v1 - Flurry_spritesheet.png | 4x4 (16f) | 8x8 (64f) | 8x8 ✓ | 512x512 |
| 2 | r1_1712 | Lightning Slash v1 - Flurry_spritesheet.png | 4x4 (16f) | 8x8 (64f) | 8x8 ✓ | 512x512 |
| 3 | r1_0971 | Shield_On_spritesheet.png | 4x4 (16f) | 8x8 (64f) | 8x8 ✓ | 512x512 |
| 4 | r1_0545 | Impact_Darkness_Lv3_spritesheet.png | 8x8 (64f) | 8x8 (64f) | 8x8 ✓ | 512x512 |
| 5 | r1_1700 | Fire Slash v1 - Spin_spritesheet.png | 4x4 (16f) | 8x8 (64f) | 8x8 ✓ | 512x512 |
| 6 | r1_2561 | Dash_Wind_White_v3_spritesheet.png | 4x4 (16f) | 8x8 (64f) | 4x4 ✗ | 256x256 |
| 7 | r1_0450 | Flamethrower_001_spritesheet.png | 4x4 (16f) | 8x8 (64f) | 8x8 ✓ | 512x512 |
| 8 | r1_0677 | Positive_Buff_V3_spritesheet.png | 8x8 (64f) | 8x8 (64f) | 8x8 ✓ | 512x512 |
| 9 | r1_0503 | Heart_Buff_V3_spritesheet.png | 4x4 (16f) | 8x8 (64f) | 8x8 ✓ | 512x512 |
| 10 | r1_2509 | Angry_Smoke_Burst_White_v2_A_spritesheet.png | 4x4 (16f) | 8x8 (64f) | 8x8 ✓ | 512x512 |
| 11 | r1_0480 | Healing_V3_spritesheet.png | 8x8 (64f) | 8x8 (64f) | 8x8 ✓ | 512x512 |
| 12 | r1_0525 | Hex_Bursts_Center_V2_spritesheet.png | 4x4 (16f) | 8x8 (64f) | 8x8 ✓ | 512x512 |

## Recomputed Visual Assessments

All visual metrics have been recomputed from correct 8x8 frame extraction. Previous assessments from R1.2 (which used incorrect 4x4 extraction for 9 candidates) are invalidated.

| # | Candidate | Active Frames | Empty Frames | Center Drift | Clipping | Peak Frame |
|---|---|---|---|---|---|---|
| 1 | r1_1605 | 64/64 | 0 (0.0%) | 44.4px | 0 (0.0%) | 24 |
| 2 | r1_1712 | 64/64 | 0 (0.0%) | 35px | 0 (0.0%) | 26 |
| 3 | r1_0971 | 63/64 | 1 (1.6%) | 11.9px | 0 (0.0%) | 21 |
| 4 | r1_0545 | 56/64 | 8 (12.5%) | 14.8px | 0 (0.0%) | 6 |
| 5 | r1_1700 | 64/64 | 0 (0.0%) | 12.7px | 0 (0.0%) | 15 |
| 6 | r1_2561 | 32/64 | 32 (50.0%) | 97.6px | 32 (50.0%) | 38 |
| 7 | r1_0450 | 64/64 | 0 (0.0%) | 12.3px | 0 (0.0%) | 46 |
| 8 | r1_0677 | 49/64 | 15 (23.4%) | 33.3px | 0 (0.0%) | 27 |
| 9 | r1_0503 | 64/64 | 0 (0.0%) | 43.8px | 0 (0.0%) | 27 |
| 10 | r1_2509 | 64/64 | 0 (0.0%) | 54.7px | 0 (0.0%) | 16 |
| 11 | r1_0480 | 61/64 | 3 (4.7%) | 49.5px | 0 (0.0%) | 31 |
| 12 | r1_0525 | 64/64 | 0 (0.0%) | 44.9px | 0 (0.0%) | 17 |

## Evidence Files Generated

Per candidate (8 files each):

- **thumbnail_*.png** — Downscaled source spritesheet (max 512px)
- **grid_overlay_*.png** — 8x8 red grid lines overlaid on source
- **animated_*.gif** — Animated GIF using all 64 native frames
- **contact_sheet_*.png** — 8x8 contact sheet with frame numbers (1-64)
- **alpha_boundary_*.png** — Alpha channel edge detection (frame 1)
- **frame_first_*.png** — First frame extract (frame 1)
- **frame_peak_*.png** — Peak intensity frame extract
- **frame_last_*.png** — Last frame extract (frame 64)

## HTML Review Index

Location: `<MEGA_PACK_ROOT>/03_inventory_output/r1_2_pilot_review/index.html`

The HTML index shows:

- Animated GIF preview (64 frames)
- 8x8 grid overlay
- 64-frame contact sheet
- Alpha boundary
- First / peak / last frame side-by-side
- Full metadata table with corrected grid, heuristic comparison, recomputed visuals
- SOURCE_CONFIRMED / MANUAL_GROUND_TRUTH status
- PENDING_HUMAN_REVIEW visual validation status

## Frame Extraction Order

Row-major order (standard spritesheet convention):

```
 1  2  3  4  5  6  7  8
 9 10 11 12 13 14 15 16
17 18 19 20 21 22 23 24
25 26 27 28 29 30 31 32
33 34 35 36 37 38 39 40
41 42 43 44 45 46 47 48
49 50 51 52 53 54 55 56
57 58 59 60 61 62 63 64
```

No 64→25 retiming has been performed. The gallery shows the native animation faithfully.

## Visual Validation Status

All candidates remain **PENDING_HUMAN_REVIEW**. The grid correction does NOT constitute visual approval. The user must:

1. Open the HTML index from the external review location
2. Examine the animated GIF and 8x8 grid overlay for each candidate
3. Verify the 8x8 grid lines align with actual frame boundaries
4. Confirm the animation reads correctly for the intended action
5. Provide verdict: APPROVE, REJECT, or ALTERNATIVE_REQUIRED

**R2 remains BLOCKED until human approval.**

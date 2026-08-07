# VFX Mega Pack R1.2.4 — Gallery Regeneration and Browser Validation Report

> **R1.2.4 deliverable.** Documents the grid-dynamic gallery regeneration and Playwright browser validation.

## 1. Gallery Regeneration

### Generator Changes

The gallery generator (`tools/vfx/r1_2_1_regenerate_review_gallery.mjs`) was updated to be fully grid-dynamic:

- **`classifyNativeGrid()`** imported and used instead of hardcoded `GRID_COLS = 8, GRID_ROWS = 8`
- **`data-frame-count`** attribute added to each `.vfx-player` container
- **Player JS** reads `frameCount` from `data-frame-count` attribute instead of hardcoded `64`
- **Scrubber `max`** set dynamically per candidate (16 or 64)
- **Counter text** shows `Frame X / 16` or `Frame X / 64` per candidate
- **Debug panel** shows correct total per candidate
- **Contact sheet** uses native grid dimensions (4×4 or 8×8)
- **Grid overlay** uses native grid dimensions
- **Metadata table** shows `Native Grid`, `Cell Dimensions`, `Grid Evidence`, `Grid Status` per candidate

### r1_2561 Correction

| Property | Before (R1.2.3) | After (R1.2.4) |
|---|---|---|
| Source dimensions | 2048×2048 | 2048×2048 |
| Grid | 8×8 (hardcoded) | 4×4 (native) |
| Frame count | 64 | 16 |
| Cell size | 256×256 | 512×512 |
| Extracted frames | frame_001–frame_064 | frame_001–frame_016 |
| Stale files | frame_017–frame_064 present | **Removed** |

The review directory was fully cleared and regenerated, so no stale files remain.

### Output Count

| Metric | R1.2.3 | R1.2.4 |
|---|---|---|
| Total generated files | 864 | 816 |
| Difference | — | -48 (r1_2561: 64→16 frames) |

### Per-Candidate Evidence

For each of the 12 candidates, the following evidence was generated:

- Native extracted PNG frames (512×512, row-major order)
- HTML player with `data-frame-count` attribute
- Animated GIF
- Contact sheet (4×4 or 8×8 grid with frame numbers)
- Grid overlay (4×4 or 8×8)
- Alpha-boundary evidence
- First/peak/last frame PNGs
- Thumbnail
- Metadata in `review_data.json`

## 2. Browser Validation

### Method

Playwright with headless Chromium, testing `file:///` URL.

### Tested Candidates

| Candidate | Grid | Frames | Role |
|---|---|---|---|
| r1_2561 | 4×4 | 16 | 16-frame player validation |
| r1_1605 | 8×8 | 64 | 64-frame player validation |
| r1_0525 | 8×8 | 64 | 64-frame player validation + isolation |

### Test Results

| Test | r1_2561 (16f) | r1_1605 (64f) | r1_0525 (64f) |
|---|---|---|---|
| Container exists | YES | YES | YES |
| Play advances counter | YES | YES | YES |
| src changes during playback | YES | YES | YES |
| Pause freezes counter | YES | YES | YES |
| Scrubber selects target frame | YES (8/16) | YES (32/64) | YES (32/64) |
| src matches frame file | YES | YES | YES |
| Next advances | YES (8→9) | YES (32→33) | YES (32→33) |
| Prev decrements | YES (9→8) | YES (33→32) | YES (33→32) |
| Restart returns to 1 | YES | YES | YES |
| Loop wraps | YES (16→1) | YES (64→1) | YES (64→1) |
| Speed affects rate | YES (1x:7, 2x:13) | YES (1x:7, 2x:13) | YES (1x:7, 2x:13) |
| Debug toggle | YES | YES | YES |

### All 12 Structural Validation

All 12 candidates verified: container exists, 8/8 controls present, src points to valid frame path, counter displays correct total (16 or 64).

### DOM Isolation Test

Played r1_1605 while r1_1712 was paused. r1_1712 counter remained unchanged. **Isolation confirmed.**

### Console Errors

Zero console errors detected.

### Final Summary

```
containerExists: YES (3/3)
playAdvancesCounter: YES (3/3)
srcChanges: YES (3/3)
pauseFreezes: YES (3/3)
scrubberSelects32: YES (3/3)
srcIsFrame32: YES (3/3)
nextAdvances: YES (3/3)
prevDecrements: YES (3/3)
restartReturnsTo1: YES (3/3)
loopWraps: YES (3/3)
speedAffectsRate: YES (3/3)
debugToggleWorks: YES (3/3)
Overall: ALL PASS
```

## 3. GIF vs HTML Frame Order

Both the HTML player and GIF consume the same `frames[]` array, built in row-major order from the same source atlas. The GIF uses downscaled copies (`gifFrames`), while the HTML player uses full-resolution PNG files. Both pipelines read from the identical source array — frame order is guaranteed identical. Differences are resolution only.

## 4. Functional Verdict

| Check | Result |
|---|---|
| r1_2561 player = 16 frames | **YES** |
| r1_2561 native cells = 512×512 | **YES** |
| No stale frames 17–64 | **YES** |
| 16-frame player works | **YES** |
| 64-frame player works | **YES** |
| GIF/HTML order matches | **YES** |
| Browser validation passes | **YES** |
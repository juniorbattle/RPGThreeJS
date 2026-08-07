# VFX Mega Pack R1.2.2 — Gallery Animation Fix

## Summary

The R1.2.1 pilot review gallery had non-functional animated GIF previews. This pass diagnosed the root cause, replaced GIF as the canonical animation source with an offline-native HTML frame player, extracted all 64 native source frames per candidate as individual PNGs, and regenerated the gallery with full playback controls.

## 1. GIF Failure Root Cause

**Root cause: LZW encoding bug in the custom GIF encoder.**

The `lzwEncode` function in `tools/vfx/r1_2_1_regenerate_review_gallery.mjs` had a critical flaw: the bit-buffer flushing loop (`while (bitBuffer.length >= 8)`) was placed **outside** the `emitCode` function. This meant bits accumulated in the buffer but were never flushed to bytes during encoding. Only the final flush at the end of `lzwEncode` produced output, resulting in approximately 1 byte of LZW data per GIF frame instead of the full compressed pixel data.

**Evidence:**
- R1.2.1 GIF file sizes: 1,400–2,200 bytes (suspiciously small for 64-frame animations)
- R1.2.2 GIF file sizes after fix: 28,973–228,011 bytes (correct)
- GIF headers, palette, dimensions, and loop extension were all valid
- The LZW data stream was truncated, causing browsers to fail silently on decode

**Fix:** Moved the `while (bitBuffer.length >= 8)` flush loop **inside** `emitCode` so bits are flushed to bytes as they accumulate. Added a final flush loop at the end of `lzwEncode` to handle any remaining bits in the buffer.

## 2. HTML Frame Player (Canonical Animation Source)

GIF is now secondary. The canonical animation source is an offline-native HTML frame player built with vanilla HTML/CSS/JavaScript — no dependencies, no server, no internet required.

### Player Features

| Feature | Implementation |
|---|---|
| Play | `play(id)` — starts interval-based frame advancement |
| Pause | `pause(id)` — clears interval, freezes current frame |
| Restart | `restartPlayer(id)` — resets to frame 1 |
| Previous Frame | `prevFrame(id)` — decrements frame index |
| Next Frame | `nextFrame(id)` — increments frame index |
| Loop Toggle | `toggleLoop(id)` — enables/disables wrap-around |
| Frame Scrubber | `<input type="range" min="1" max="64">` — click/drag to any frame |
| Current/Total Display | `Frame XX / 64` text display |
| Speed Selection | `<select>` with 0.5x, 1x, 1.5x, 2x options |
| Error Handling | `showError(id, msg)` — visible error for missing frames |

### Defaults

- **Looping:** Enabled
- **Speed:** 1x
- **Initial frame:** Frame 1
- **Auto-playback:** Starts after DOMContentLoaded event
- **Baseline FPS:** 20 (configurable in `review_data.json`)
- **Speed intervals:** 0.5x=100ms, 1x=50ms, 1.5x≈33ms, 2x=25ms

### Offline Compatibility

- All paths are relative (e.g., `r1_1605/frames/frame_001.png`)
- No `fetch()`, AJAX, ES modules, or CDN dependencies
- Works with `file://` protocol — no local server required
- Forward slashes in HTML paths (cross-platform compatible)
- No spaces or special characters in directory names (candidate IDs only)

## 3. PNG Frame Extraction

For each of the 12 pilot candidates, all 64 native source frames were extracted in row-major order:

```
Frame 1  = (row 0, col 0)    Frame 8  = (row 0, col 7)
Frame 9  = (row 1, col 0)    Frame 16 = (row 1, col 7)
...
Frame 57 = (row 7, col 0)    Frame 64 = (row 7, col 7)
```

**Output structure:**
```
r1_2_pilot_review/
  r1_1605/
    frames/
      frame_001.png
      frame_002.png
      ...
      frame_064.png
    thumbnail_r1_1605.png
    grid_overlay_r1_1605.png
    contact_sheet_r1_1605.png
    alpha_boundary_r1_1605.png
    frame_first_r1_1605.png
    frame_peak_r1_1605.png
    frame_last_r1_1605.png
    animated_r1_1605.gif  (secondary)
  r1_1712/
    ...
  index.html
  review_data.json
```

**Properties:**
- 768 total PNG frames (12 candidates × 64 frames)
- Transparency preserved
- No 64→25 conversion (review-only, native resolution)
- Aspect ratio preserved
- No cropping of effect area
- Files remain outside the repository (external Mega Pack directory)

## 4. Directory Naming Fix

**Issue:** Two candidates (`r1_1605` and `r1_1712`) both mapped to target `p0_1`. Using target ID as the directory name caused one candidate to overwrite the other, resulting in only 11 directories and 704 frames instead of 12 directories and 768 frames.

**Fix:** Changed directory naming from target ID (`p0_1`) to candidate ID (`r1_1605`), which is unique per candidate. Updated `targetDir`, `framesDir`, HTML `base` path, and `playerInitData` accordingly.

## 5. GIF Repair (Secondary)

The LZW encoder bug was fixed, making GIF generation functional again. GIF file sizes are now in the 28KB–228KB range, confirming proper LZW compression. However, GIF remains secondary to the HTML frame player. GIF generation failure does not block the gallery.

No external GIF encoder (ffmpeg, ImageMagick, sharp) was added as a dependency. The custom encoder with the LZW fix is sufficient for secondary GIF output.

## 6. Validation Results

### Frame Extraction

| Candidate | Source | Frames | Frame 1 | Frame 9 | Frame 64 | GIF Size |
|---|---|---|---|---|---|---|
| r1_1605 | Blue Slash v1 - Flurry | 64 | ✓ | ✓ | ✓ | 115,987 B |
| r1_1712 | Lightning Slash v1 - Flurry | 64 | ✓ | ✓ | ✓ | 119,162 B |
| r1_0971 | Shield_On | 64 | ✓ | ✓ | ✓ | 116,724 B |
| r1_0545 | Impact_Darkness_Lv3 | 64 | ✓ | ✓ | ✓ | 56,174 B |
| r1_1700 | Fire Slash v1 - Spin | 64 | ✓ | ✓ | ✓ | 228,011 B |
| r1_2561 | Dash_Wind_White_v3 | 64 | ✓ | ✓ | ✓ | 28,973 B |
| r1_0450 | Flamethrower_001 | 64 | ✓ | ✓ | ✓ | 222,678 B |
| r1_0677 | Positive_Buff_V3 | 64 | ✓ | ✓ | ✓ | 37,022 B |
| r1_0503 | Heart_Buff_V3 | 64 | ✓ | ✓ | ✓ | 55,268 B |
| r1_2509 | Angry_Smoke_Burst_White_v2_A | 64 | ✓ | ✓ | ✓ | 48,428 B |
| r1_0480 | Healing_V3 | 64 | ✓ | ✓ | ✓ | 61,468 B |
| r1_0525 | Hex_Bursts_Center_V2 | 64 | ✓ | ✓ | ✓ | 91,722 B |

### HTML Reference Validation

- **108 HTML `src` references** — all resolve to actual files (0 missing)
- **player-data JSON** — valid, 12 entries, each with `candidateId`, `targetDir`, `frameCount=64`, `fps=20`
- **Player controls** — all 8 required functions present in HTML (`play`, `pause`, `restartPlayer`, `prevFrame`, `nextFrame`, `toggleLoop`, `setSpeed`, `scrub`)
- **Scrubber** — `<input type="range" min="1" max="64">` present

### Playback Configuration

- Baseline FPS: 20 (documented, configurable)
- Speeds: [0.5, 1, 1.5, 2]
- Default speed: 1x
- Loop default: enabled
- Frame interval at 1x: 50ms (1000/20)

## 7. Preserved Visual Evidence

All evidence from R1.2.1 is retained alongside the new player:

- **8×8 grid overlay** — shows cell boundaries on the full spritesheet
- **64-frame contact sheet** — all frames in grid layout
- **Alpha-boundary image** — transparency mask visualization
- **First frame** — frame 1 extract
- **Peak frame** — frame with highest alpha occupancy
- **Last frame** — frame 64 extract
- **Thumbnail** — downscaled full sheet (max 512px)
- **Candidate metadata** — source filename, grid confirmation, heuristic detection results

## 8. Files Modified

| File | Change |
|---|---|
| `tools/vfx/r1_2_1_regenerate_review_gallery.mjs` | LZW fix, PNG frame extraction, HTML player, candidate ID directories |
| `src/combat/vfx/galleryAnimationFix.test.ts` | New test file: frame coordinates, extraction order, path generation, player metadata, HTML reference validation |
| `tools/vfx/r1_2_2_validate_gallery.mjs` | New validation script for external gallery output |

## 9. Testing

### Test Coverage

- **Pure logic tests (no external deps):** Row-major coordinate calculation, frame path generation, playback speed math, candidate ID collision avoidance, LZW structure
- **External validation tests (degrade cleanly if Mega Pack unavailable):** 64 frames per candidate, frame ordering, HTML reference resolution, player-data JSON validity, playback config defaults, visual evidence existence, GIF size verification, HTML player controls presence

### Test Results

See R1.2.2 validation section in the final validation output.

## 10. Constraints Honored

- ✅ No R2 conversion begun
- ✅ No runtime VFX modified
- ✅ No gameplay, presets, mappings, UVs, flipY, frame order, R3F pivot, or R3G half-texel behavior changed
- ✅ No commit, no push
- ✅ No commercial pixels embedded in repository
- ✅ No new dependencies added
- ✅ No previously classified 4x4 assets reclassified to 8x8 (ground truth from R1.2.1 retained)
- ✅ No semantic timing differences invented between individual frames
- ✅ Constant review playback interval (20 FPS baseline)

## 11. Remaining Blockers

**None.** Human visual review is unblocked. The user can open `index.html` directly from the external review directory using `file://` protocol with no server required.

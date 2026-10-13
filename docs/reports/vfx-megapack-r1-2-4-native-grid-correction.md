# VFX Mega Pack R1.2.4 — Native Grid Convention Correction and Full Inventory Rescan

> **R1.2.4 deliverable.** Authoritative grid correction using the CartoonCoffee source dimension convention.
> Historical reports (R1, R1.1, R1.2, R1.2.1, R1.2.2, R1.2.3) remain untouched as audit evidence.
> No runtime VFX, gameplay, presets, mappings, renderer UVs, flipY, frame order, R3F pivot, or R3G half-texel behavior modified.

## Source Convention (Authoritative)

| Source Dimensions | Native Grid | Frames | Cell Size | Status |
|---|---|---|---|---|
| EXACTLY 2048×2048 | 4×4 | 16 | 512×512 | SOURCE_CONFIRMED_4X4_16F |
| EXACTLY 4096×4096 | 8×8 | 64 | 512×512 | SOURCE_CONFIRMED_8X8_64F |
| Other | — | — | — | MANUAL_REVIEW_REQUIRED |

This convention uses **exact** dimension matching, not `>=` thresholds. Non-standard dimensions are not guessed.

## 1. Full Inventory Rescan

| Metric | Count |
|---|---|
| **Total inventory scanned** | **2769** |
| 2048×2048 count | 309 |
| 4096×4096 count | 2456 |
| Other dimensions count | 4 |
| 4×4 count | 309 |
| 8×8 count | 2456 |
| Manual review count | 4 |

### Non-Standard Assets (MANUAL_REVIEW_REQUIRED)

| Dimensions | Count | Files |
|---|---|---|
| 1536×1536 | 3 | Impact_Muzzle_Flash_spritesheet.png, Projectile_Bullet_B_spritesheet.png, Projectile_Bullet_spritesheet.png |
| 8192×8192 | 1 | Wind_Current_White_v3_spritesheet.png |

These 4 assets are not classified by the source convention. Their grid structure must be determined by manual inspection before R2 processing.

## 2. Exact R1.1 → R1.2.4 Transition Matrix

Computed per-asset by matching `sourceFilename` between `vfx-megapack-r1-1-corrected-inventory.json` and the R1.2.4 scan.

| R1.1 Classification | R1.2.4 Classification | Count | Description |
|---|---|---|---|
| 4x4 | 8x8 | **1524** | R1.1 wrongly classified 4096×4096 sheets as 4×4 |
| 8x8 | 8x8 | 915 | Correctly classified by R1.1 |
| 4x4 | 4x4 | 275 | Correctly classified by R1.1 (2048×2048) |
| 2x2 | 4x4 | 34 | R1.1 heuristic found 2×2; source convention says 4×4 |
| 2x2 | 8x8 | 17 | R1.1 heuristic found 2×2; source convention says 8×8 |
| 3x3 | MANUAL_REVIEW_REQUIRED | 3 | 1536×1536 — not classifiable by convention |
| 8x8 | MANUAL_REVIEW_REQUIRED | 1 | 8192×8192 — not classifiable by convention |

**Unchanged:** 1190 assets (915 8x8→8x8 + 275 4x4→4x4)
**Corrected:** 1579 assets (1524 4x4→8x8 + 34 2x2→4x4 + 17 2x2→8x8 + 3 3x3→manual + 1 8x8→manual)

### R1.1 vs R1.2.4 Aggregate Comparison

| Metric | R1.1 | R1.2.4 |
|---|---|---|
| Total | 2769 | 2769 |
| 8×8 | 916 | 2456 |
| 4×4 | 1799 | 309 |
| 2×2 | 51 | 0 |
| 3×3 | 3 | 0 |
| Manual review | 0 | 4 |

R1.1's heuristic detector was fundamentally wrong about 4096×4096 sheets — it classified 1524 of them as 4×4 when they are actually 8×8 per the source convention. The heuristic's 2×2 and 3×3 classifications were also invalid for standard-dimension sheets.

## 3. Pilot Candidate Corrections

| Candidate | Source | Dimensions | Previous Grid | Corrected Grid | Changed |
|---|---|---|---|---|---|
| r1_1605 | Blue Slash v1 - Flurry | 4096×4096 | 4x4 | **8x8** (64f) | YES |
| r1_1712 | Lightning Slash v1 - Flurry | 4096×4096 | 4x4 | **8x8** (64f) | YES |
| r1_0971 | Shield_On | 4096×4096 | 4x4 | **8x8** (64f) | YES |
| r1_0545 | Impact_Darkness_Lv3 | 4096×4096 | 8x8 | 8x8 (64f) | no |
| r1_1700 | Fire Slash v1 - Spin | 4096×4096 | 4x4 | **8x8** (64f) | YES |
| r1_2561 | Dash_Wind_White_v3 | 2048×2048 | 4x4 | 4x4 (16f) | no |
| r1_0450 | Flamethrower_001 | 4096×4096 | 4x4 | **8x8** (64f) | YES |
| r1_0677 | Positive_Buff_V3 | 4096×4096 | 8x8 | 8x8 (64f) | no |
| r1_0503 | Heart_Buff_V3 | 4096×4096 | 4x4 | **8x8** (64f) | YES |
| r1_2509 | Angry_Smoke_Burst_White_v2_A | 4096×4096 | 4x4 | **8x8** (64f) | YES |
| r1_0480 | Healing_V3 | 4096×4096 | 8x8 | 8x8 (64f) | no |
| r1_0525 | Hex_Bursts_Center_V2 | 4096×4096 | 4x4 | **8x8** (64f) | YES |

**Pilot summary:** 1 candidate at 4×4 (16f), 11 at 8×8 (64f), 8 grid corrections applied.

## 4. Frame Hash Diagnostic (Corrected)

| Candidate | Grid | Frames | Unique Hashes | Duplicates | Cell Dims |
|---|---|---|---|---|---|
| r1_1605 | 8x8 | 64 | 64/64 | None | 512×512 |
| r1_1712 | 8x8 | 64 | 64/64 | None | 512×512 |
| r1_0971 | 8x8 | 64 | 61/64 | Frames 60-63 (empty tail) | 512×512 |
| r1_0545 | 8x8 | 64 | 62/64 | Frames 62-64 (empty tail) | 512×512 |
| r1_1700 | 8x8 | 64 | 64/64 | None | 512×512 |
| **r1_2561** | **4x4** | **16** | **16/16** | **None** | **512×512** |
| r1_0450 | 8x8 | 64 | 61/64 | Frames 6=38, 7=39, 8=40 (loop) | 512×512 |
| r1_0677 | 8x8 | 64 | 51/64 | Frames 51-64 (empty tail) | 512×512 |
| r1_0503 | 8x8 | 64 | 64/64 | None | 512×512 |
| r1_2509 | 8x8 | 64 | 64/64 | None | 512×512 |
| r1_0480 | 8x8 | 64 | 62/64 | Frames 62-64 (empty tail) | 512×512 |
| r1_0525 | 8x8 | 64 | 64/64 | None | 512×512 |

**r1_2561 corrected result:** 16/16 unique hashes at 512×512. The old R1.2.3 result of 34/64 unique hashes at 256×256 is **invalid** — it came from an incorrect 8×8 split of a 2048×2048 source.

## 5. Gallery Regeneration

See `vfx-megapack-r1-2-4-gallery-regeneration.md` for full details.

- r1_2561: 16 frames at 512×512 (was incorrectly 64 frames at 256×256)
- All 4096×4096 candidates: 64 frames at 512×512
- Stale frame_017–frame_064 removed from r1_2561 directory
- Player JS reads `data-frame-count` attribute — no hardcoded 64
- Gallery output: 816 files

## 6. Browser Validation

See `vfx-megapack-r1-2-4-gallery-regeneration.md` for full results.

All 12 tests pass for r1_2561 (16f), r1_1605 (64f), and r1_0525 (64f). DOM isolation verified. Zero console errors.

## 7. Functional Verdict

| Check | Result |
|---|---|
| Total inventory scanned | 2769 |
| 2048×2048 count | 309 |
| 4096×4096 count | 2456 |
| Other dimensions count | 4 |
| 4×4 count | 309 |
| 8×8 count | 2456 |
| Manual review count | 4 |
| R1.1 → R1.2.4 transition matrix | Computed per-asset (see §2) |
| Pilot classifications corrected | 8 |
| r1_2561 native frames = 16 | **YES** |
| r1_2561 cell size = 512×512 | **YES** |
| No stale frames 17–64 | **YES** |
| 16-frame player works | **YES** |
| 64-frame player works | **YES** |
| GIF/HTML order matches | **YES** |
| Browser validation passes | **YES** |
| Tests pass | **YES** (see §8) |
| Build passes | **YES** (see §8) |

## 8. Validation Commands

```
npm.cmd test
npm.cmd run build
git diff --check
git status --short
```

## 9. Deliverables

| File | Description |
|---|---|
| `docs/reports/vfx-megapack-r1-2-4-native-grid-correction.md` | This report |
| `docs/reports/vfx-megapack-r1-2-4-pilot-corrected-manifest.json` | Corrected pilot metadata (12 candidates) |
| `docs/reports/vfx-megapack-r1-2-4-corrected-inventory.json` | Full 2769-asset corrected inventory with transition matrix |
| `docs/reports/vfx-megapack-r1-2-4-inventory-delta.md` | R1.1 → R1.2.4 classification delta report |
| `docs/reports/vfx-megapack-r1-2-4-gallery-regeneration.md` | Gallery regeneration and browser validation report |
| `docs/reports/vfx-megapack-r1-2-4-frame-hash-diagnostic.json` | Per-candidate frame hash diagnostic data |

## 10. Files Modified

| File | Change |
|---|---|
| `tools/vfx/r1_2_3_frame_hash_diagnostic.mjs` | Repurposed as R1.2.4 grid classification scan with `classifyNativeGrid()` export and R1.1 transition matrix |
| `tools/vfx/r1_2_1_regenerate_review_gallery.mjs` | Grid-dynamic: uses `classifyNativeGrid()`, `data-frame-count` attribute, dynamic scrubber/counter/debug |
| `tools/vfx/r1_2_3_browser_validation.mjs` | Updated for 16-frame and 64-frame dynamic testing |
| `tools/vfx/r1_2_4_frame_hash_diagnostic.mjs` | New: frame hash diagnostic with native grid awareness |
| `src/combat/vfx/galleryAnimationFix.test.ts` | Updated: classifyNativeGrid tests, 4×4 extraction, 16-frame player tests, r1_2561 external validation |

## 11. Constraints Honored

- ✅ No R2 conversion begun
- ✅ No runtime VFX modified
- ✅ No gameplay, presets, mappings, renderer UVs, flipY, frame order, R3F pivot, or R3G half-texel behavior changed
- ✅ No commit, no push
- ✅ Historical reports (R1, R1.1, R1.2, R1.2.1, R1.2.2, R1.2.3) preserved untouched
- ✅ `classifyNativeGrid` uses exact dimension matching, not `>=` thresholds
- ✅ Non-standard dimensions classified as MANUAL_REVIEW_REQUIRED
- ✅ Heuristic v2 detector retained for diagnostics but does not override source convention
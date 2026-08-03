# VFX Mega Pack R0 — Intake & Skill Rework Plan

> **Pre-purchase planning pass.** No runtime code, assets, gameplay, or mappings were modified.
> The Mega Pack has not yet been purchased or imported. All Mega Pack candidate fields are
> `UNASSIGNED_PENDING_R1`. R1 inventory is blocked until commercial files are locally available.
> Source root: `<MEGA_PACK_ROOT>` (configurable, outside `public/assets/`).

## Executive summary

This document is the main report for the VFX Mega Pack R0 intake and skill rework planning
pass. It covers asset taxonomy, conversion pipeline design, metadata schema, current skill
audit findings, Black Mage pilot analysis, and a nine-phase implementation roadmap (R0–R8).

**Key decisions:**
- R0–R5 cover VFX presentation changes only. Gameplay mechanics remain frozen.
- Gameplay and balance changes are deferred to R6 with a separate approval gate.
- No Mega Pack filenames, asset IDs, frame counts, or confirmed visual matches are invented.
- All Mega Pack candidate fields use `UNASSIGNED_PENDING_R1` until R1 indexing.
- No commercial source files are copied into the repository.
- No loop playback fields are added to runtime code during R0 (documented only).

## Deliverables created

| # | File | Purpose |
|---|---|---|
| 1 | `vfx-megapack-r0-current-skill-audit.md` | Full 12-unit × 5-action inventory with KEEP/TUNE/REDESIGN/MERGE/REPLACE classification |
| 2 | `vfx-megapack-r0-black-mage-pilot.md` | Black Mage case study with VFX proposals and deferred R6 gameplay proposals |
| 3 | `vfx-megapack-r0-asset-taxonomy.schema.json` | JSON Schema for `VfxAssetCandidate` metadata |
| 4 | `vfx-megapack-r0-proposed-action-vfx-mappings.json` | 60 hero actions mapped to required visual family, processing type, and change classification |
| 5 | `vfx-megapack-r0-implementation-roadmap.md` | Nine-phase roadmap (R0–R8) with scope/inputs/outputs/tests/QA/rollback/criteria |
| 6 | `vfx-megapack-r0-intake-and-skill-rework-plan.md` | This document — main report |

## Architecture findings

### Current VFX system

The runtime VFX system consists of four layers:

1. **Spritesheet definitions** (`src/combat/vfx/VfxSpriteSheets.ts`) — 46 sheets, all 1280×1280,
   5×5 grid, 25 frames per sheet. R3G UV inset fix at lines 30–67 must be preserved.
2. **VFX presets** (`src/combat/vfx/VfxPresets.ts`) — 824 lines defining preset steps
   (spriteSheet, screenFlash, screenShake, hitStop) with timing, scale, blending, and anchors.
3. **Skill presentation** (`src/combat/skillPresentation.ts`) — Maps each hero action to a
   motion preset, VFX preset, cast style, impact timing, orientation, and scale tier.
4. **VFX types** (`src/combat/vfx/VfxTypes.ts`) — Type system for `VfxSpriteSheetId`,
   `VfxStep`, `VfxPreset`, `VfxOrientation`, `VfxScaleTier`.

### Asset verdicts (R3H)

- **1 PASS**: `skill_void_rune_orb_medium`
- **5 NEEDS_NORMALIZATION**: `skill_arcane_orbit_burst_medium`, `skill_arcane_slash_burst_medium`,
  `skill_barrier_shield_ring_medium`, `skill_fire_spark_cluster_medium`, (1 more)
- **13 MANUAL_REVIEW**: Sheets with minor issues that can be tuned without regeneration
- **27 NEEDS_REGENERATION**: Source composition defects requiring complete regeneration

### P0 spritesheets (must be replaced first)

1. `basic_execution_slash_heavy` — fragments in cells, effective scale ~4.66
2. `skill_barrier_guard_heavy` — source composition defect
3. `skill_meteor_impact_burst_heavy` — effective scale ~4.48, reads as fire
4. `skill_void_singularity_implosion_ultimate` — effective scale ~6.48, additive amplification
5. `skill_wind_slash_swirl_medium` — fragments in cells, effective scale ~3.36

### Semantic VFX mismatches (R3G confirmed)

1. **w_charge** — `blunt_impact` (stationary hammer crush) for a dash action
2. **p_interpose** — `leap_impact` (generic body slam) for a protective leap
3. **n_flame_wave** — `skill_fire_impact` (local burst) for a cone/wave attack

## Asset taxonomy design

The `VfxAssetCandidate` schema (`vfx-megapack-r0-asset-taxonomy.schema.json`) defines
classification fields for each Mega Pack source asset:

- **Source identification**: `sourceCollection`, `sourcePath`, `sourceFilename` (relative to
  `<MEGA_PACK_ROOT>`)
- **Technical properties**: `frameCount`, `frameDimensions`, `alphaAvailability`,
  `animationDuration`, `loopSuitability`
- **Visual classification**: `visualFamily` (32 families), `element` (14 elements), `palette`,
  `direction`, `impactLocation`, `targetShape`, `intensity`
- **Playback metadata**: `playbackMode` (`once` | `loop`), `supportVsOffensive`,
  `groundVsTarget`, `cameraCompatibility`
- **Processing classification**: `classificationTier` (DIRECT_CANDIDATE, RECOLOR_CANDIDATE,
  RETIME_CANDIDATE, CROP_OR_REFRAME, LOOP_CANDIDATE, COMPOSITE_LAYER, REFERENCE_ONLY, REJECT)
- **R1 verification**: `r1VerificationStatus` (UNASSIGNED_PENDING_R1, INSPECTED, VERIFIED,
  REJECTED)

All fields default to `UNASSIGNED_PENDING_R1` or `PENDING_SOURCE_INSPECTION` until R1 indexing.

## Conversion pipeline design

### Non-destructive pipeline stages

```
<MEGA_PACK_ROOT>/source.png
  → validate (format, dimensions, alpha)
  → detect alpha bounds
  → trim empty frames
  → resample to 25 frames
  → stabilize center/baseline
  → resize to 256×256
  → add safe padding (UV bleeding prevention)
  → pack 1280×1280 5×5 grid
  → validate borders (no bleeding, no magenta)
  → generate preview/contact sheet
  → manifest candidate (VfxAssetCandidate metadata)
  → manual QA
  → runtime promotion (copy to public/assets/vfx/runtime/)
```

### Asset type handling

- **One-shot impacts**: Standard pipeline. 25 frames, one play, fade out.
- **Directional travel**: Preserve motion direction during stabilization. May need orientation
  metadata for runtime flipping.
- **Persistent loops**: Test loop seam (first frame ≈ last frame). May need crossfade.
- **Auras**: Loop with fade-in/fade-out. May need `followTarget` metadata.
- **Status effects**: Loop with status-specific visual. May need `loopCount` metadata.
- **Large ultimates**: May need larger cell size (e.g., 384×384 or 512×512) if the effect
  exceeds 256×256 bounds after padding.

### Loop support proposal (documented only, no runtime code changes during R0)

Proposed minimal type additions to `VfxStep` in `VfxTypes.ts`:

```typescript
// PROPOSED — not implemented during R0
playbackMode?: 'once' | 'loop';
loopCount?: number;        // 0 = infinite, N = N loops then stop
followTarget?: boolean;    // sprite follows target position during loop
fpsOverride?: number;      // override default 30 FPS for this step
```

These are documentation-only proposals. No runtime code changes until R2 implementation.

## Current skill audit summary

See `vfx-megapack-r0-current-skill-audit.md` for the full inventory.

- **60 hero actions** audited across 12 units
- **Classification**: KEEP 2, TUNE 28, REDESIGN 3, REPLACE 27
- **6 redundancy pairs** identified (2 MERGE candidates for R6)
- **3 semantic VFX mismatches** confirmed (R3G)
- **5 P0 spritesheets** requiring regeneration (R3H)
- **3 slot structure issues**: Lancer Skill 2, Black Mage Skill 3+Ultimate, White Mage Skill 2

## Black Mage pilot summary

See `vfx-megapack-r0-black-mage-pilot.md` for the full case study.

**Core conflict**: Skill 3 (n_flame_wave, fire cone, burn) and Ultimate (n_dark_meteor,
fire+dark area, burn+curse) both read as fire-based area attacks.

**R0–R5 VFX proposals (presentation only):**
- n_flame_wave: REDESIGN to directional fire wave / cone propagation
- n_dark_meteor: REPLACE with void/dark meteor or gravity implosion (dark palette, not fire)

**R6 gameplay proposals (PROPOSAL_ONLY, separate approval gate):**
- BM-R6-1: Shift n_dark_meteor toward void/dark/gravity, remove burn
- BM-R6-2: Reconsider n_flame_wave element (keep fire or shift to dark)
- BM-R6-3: Slot reordering if both skills shift toward dark/void

## Action-to-VFX mappings summary

See `vfx-megapack-r0-proposed-action-vfx-mappings.json` for the full 60-action mapping.

Each action entry separates:
- **Current gameplay mechanic** — AP, type, range, area, status, element (frozen)
- **Current VFX presentation** — preset, spritesheet, orientation, scaleTier, R3H verdict
- **Proposed R0–R5 VFX presentation** — required visual family, tactical presentation
  requirement, processing type, change classification, Mega Pack candidate ID
  (`UNASSIGNED_PENDING_R1`), Mega Pack category (`UNASSIGNED_PENDING_R1`)
- **Deferred R6 gameplay proposal** — text or null (PROPOSAL_ONLY)
- **Approval status** — `R0_PLANNING` for all entries

## Implementation roadmap summary

See `vfx-megapack-r0-implementation-roadmap.md` for the full nine-phase roadmap.

| Phase | Scope | Status |
|---|---|---|
| R0 | Analysis & planning (this pass) | IN PROGRESS |
| R1 | Mega Pack inventory & indexing | BLOCKED (not purchased) |
| R2 | Automated PNG normalization pipeline | NOT STARTED |
| R3 | Five P0 replacement candidates | NOT STARTED |
| R4 | Five-unit VFX presentation pilot | NOT STARTED |
| R5 | Review & validation (7 dimensions) | NOT STARTED |
| R6 | Global unit skill redesign (gameplay) | NOT STARTED (separate approval) |
| R7 | Full VFX migration | NOT STARTED |
| R8 | Cleanup & removal of obsolete assets | NOT STARTED |

## Files expected to change during implementation (R1–R8, NOT this pass)

- `src/combat/vfx/VfxSpriteSheets.ts` — new spritesheet definitions, updated presentation metadata
- `src/combat/vfx/VfxTypes.ts` — new `VfxSpriteSheetId` entries, possible loop playback fields (R2+)
- `src/combat/vfx/VfxPresets.ts` — new/updated presets, anchor/scale tuning
- `src/combat/skillPresentation.ts` — action-to-preset remapping
- `src/combat/statusPresentation.ts` — status loop VFX (if applicable)
- `public/assets/vfx/runtime/*.png` — new/replacement spritesheets (R3+)
- `public/assets/vfx/normalized_candidates/` — pipeline output staging area (R2, gitignored)
- `src/combat/vfx/VfxSpriteSheets.test.ts` — test updates for new sheets
- `src/combat/vfx/VfxPresets.test.ts` — test updates for new presets
- `src/combat/combatVfxPresentation.test.ts` — test updates for remapped actions

## Files that must remain untouched

- `src/combat/vfx/VfxSpriteSheets.ts` lines 30–67 (R3G UV inset fix, flipY, frame order)
- `src/combat/vfx/VfxTextures.ts` (LinearFilter, ClampToEdgeWrapping, mipmap config)
- `src/game/skills.ts` (gameplay values — frozen until R6 approval)
- `src/game/catalog.ts` (unit stats, weapon stats — frozen until R6 approval)
- `src/game/types.ts` (combat type definitions)
- `src/combat/protocol.ts` (combat protocol schemas)
- `src/combat/legacyCombatRuntime.js` (legacy runtime)
- All existing `public/assets/vfx/runtime/*.png` (not modified in R0)

## Commercial asset safety

- The Mega Pack source root remains configurable as `<MEGA_PACK_ROOT>` and outside `public/assets/`
- No commercial source files are copied, referenced through public runtime paths, or committed
- The R0 documents define taxonomy, schemas, pipeline, and requirements without requiring
  access to the commercial files
- R1 inventory and indexing is blocked until the commercial files are locally available
- All Mega Pack candidate IDs are `UNASSIGNED_PENDING_R1` — no invented filenames, asset IDs,
  frame counts, directories, or confirmed visual matches

## Safety statement

No runtime code, spritesheet definitions, presets, mappings, gameplay values, or PNG files
were modified during this planning pass. Only 6 new documentation/schema/mapping files were
created under `docs/reports/`. All gameplay proposals are PROPOSAL_ONLY until the R6 approval
gate. All Mega Pack candidate fields are `UNASSIGNED_PENDING_R1`. No commercial assets are
copied, referenced through public runtime paths, or committed.

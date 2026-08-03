# VFX Mega Pack R0 — Implementation Roadmap (R0–R8)

> **Pre-purchase planning pass.** No runtime code, assets, gameplay, or mappings were modified.
> The Mega Pack has not yet been purchased or imported. R1 is blocked until commercial files
> are locally available. Source root: `<MEGA_PACK_ROOT>` (configurable, outside `public/assets/`).

## Overview

This is a **nine-phase roadmap** (R0 through R8). Each phase has a defined scope, inputs,
outputs, tests, QA criteria, rollback plan, and exit criteria.

**Key principle**: R0–R5 cover VFX presentation changes only. Gameplay mechanics (AP costs,
damage, elements, statuses, targeting, ranges, area shapes, skill slots, combat rules) remain
frozen. Gameplay and balance changes are deferred to R6 with a separate approval gate.

---

## R0 — Analysis & Planning

| Field | Value |
|---|---|
| **Scope** | Produce complete analysis and planning documentation for Mega Pack integration |
| **Status** | IN PROGRESS |
| **Inputs** | Existing codebase, R3G/R3H audit reports, current skill/preset/spritesheet definitions |
| **Outputs** | 6 deliverables: skill audit, Black Mage pilot, asset taxonomy schema, action-to-VFX mappings JSON, implementation roadmap (this document), main intake report |
| **Tests** | Non-destructive: `npm test`, `npm run build`, `git diff --check`, `git status --short` |
| **QA** | All Mega Pack candidate fields are `UNASSIGNED_PENDING_R1`; no runtime code modified; no commercial assets copied |
| **Rollback** | Delete the 6 new doc files — no runtime changes to revert |
| **Exit criteria** | 6 deliverables created; tests pass; build passes; git diff --check passes |

## R1 — Mega Pack Inventory & Indexing

| Field | Value |
|---|---|
| **Scope** | Purchase, locally import, and index all Mega Pack PNG sequences into a candidate database |
| **Status** | BLOCKED — Mega Pack not yet purchased |
| **Block reason** | Commercial files not yet locally available |
| **Inputs** | `<MEGA_PACK_ROOT>` configured locally; `vfx-megapack-r0-asset-taxonomy.schema.json` schema |
| **Outputs** | Indexed candidate database with `VfxAssetCandidate` metadata for each source PNG sequence; `megaPackCandidateId` values assigned to replace `UNASSIGNED_PENDING_R1` placeholders |
| **Tests** | Schema validation against `vfx-megapack-r0-asset-taxonomy.schema.json`; frame count verification; alpha channel detection |
| **QA** | Every candidate has a classification tier; no source files copied into `public/assets/`; source root remains `<MEGA_PACK_ROOT>` |
| **Rollback** | Delete candidate database JSON; remove `<MEGA_PACK_ROOT>` configuration |
| **Exit criteria** | All source PNG sequences indexed; candidate database validates against schema; `UNASSIGNED_PENDING_R1` placeholders can begin being replaced with real candidate IDs |

## R2 — Automated PNG Normalization Pipeline

| Field | Value |
|---|---|
| **Scope** | Build and validate the non-destructive conversion pipeline: source PNGs → validate → detect alpha bounds → trim empty frames → resample to 25 frames → stabilize center/baseline → resize to 256×256 → add safe padding → pack 1280×1280 5×5 → validate borders → generate preview/contact sheet → manifest candidate |
| **Status** | NOT STARTED (depends on R1) |
| **Inputs** | Indexed candidate database from R1; `<MEGA_PACK_ROOT>` source files |
| **Outputs** | Normalized spritesheet candidates in staging area (NOT `public/assets/vfx/runtime/`); pipeline tooling; manifest JSON |
| **Tests** | Pipeline output validation: 1280×1280 dimensions, 5×5 grid, 25 frames, safe padding, no bleeding, no magenta |
| **QA** | No runtime spritesheets replaced; pipeline is non-destructive; output goes to staging only |
| **Rollback** | Delete staging area and pipeline output; pipeline tooling can remain |
| **Exit criteria** | Pipeline produces valid 1280×1280 5×5 spritesheets from arbitrary PNG sequences; all output validates against existing `VfxSpriteSheets.test.ts` criteria |

**Pipeline stages by asset type:**
- **One-shot impacts**: validate → trim → resample to 25 → resize 256×256 → pad → pack
- **Directional travel**: validate → trim → resample → resize → pad → pack (preserve direction)
- **Persistent loops**: validate → trim → resample → resize → pad → pack (test loop seam)
- **Auras**: validate → trim → resample → resize → pad → pack (test loop seam)
- **Status effects**: validate → trim → resample → resize → pad → pack (test loop seam)
- **Large ultimates**: validate → trim → resample → resize → pad → pack (may need larger cell size)

**Loop support (documented only, no runtime code changes during R0):**
- Proposed minimal type addition to `VfxStep`: `playbackMode?: 'once' | 'loop'`
- Proposed preset metadata: `loopCount?`, `followTarget?`, `fpsOverride?`
- These are documentation-only proposals — no runtime code changes until R2 implementation

## R3 — Five P0 Replacement Candidates

| Field | Value |
|---|---|
| **Scope** | Generate and validate replacement spritesheets for the 5 P0 sheets identified in R3H |
| **Status** | NOT STARTED (depends on R2) |
| **Inputs** | R2 pipeline; R1 candidate database; P0 sheet requirements |
| **Outputs** | 5 new runtime spritesheets in `public/assets/vfx/runtime/`; updated `VfxSpriteSheets.ts` definitions; updated tests |
| **Tests** | `VfxSpriteSheets.test.ts` — all existing tests must pass with new sheets; visual QA comparison |
| **QA** | New sheets must pass: 1280×1280, 5×5, 25 frames, no bleeding, no magenta, safe padding; visual comparison against old sheets |
| **Rollback** | Revert `VfxSpriteSheets.ts` changes; restore old PNG files from git |
| **Exit criteria** | All 5 P0 sheets replaced; all tests pass; visual QA confirms improvement |

**P0 sheets to replace:**
1. `basic_execution_slash_heavy` — slash/heavy family
2. `skill_barrier_guard_heavy` — barrier/shield family
3. `skill_meteor_impact_burst_heavy` — meteor/ultimate family (dark recolor candidate)
4. `skill_void_singularity_implosion_ultimate` — implosion/ultimate family
5. `skill_wind_slash_swirl_medium` — swirl family

## R4 — Five-Unit VFX Presentation Pilot

| Field | Value |
|---|---|
| **Scope** | Implement VFX presentation changes for 5 pilot units: Black Mage, Warrior, Paladin, White Mage, Rogue/Ninja |
| **Status** | NOT STARTED (depends on R3) |
| **Inputs** | R3 P0 replacements; R2 pipeline; R1 candidate database; R0 skill audit and mappings |
| **Outputs** | New/updated spritesheets, presets, and action-to-preset mappings for 5 pilot units (25 actions) |
| **Tests** | `VfxPresets.test.ts`, `skillPresentation.test.ts`, `combatVfxPresentation.test.ts` — all must pass |
| **QA** | Visual readability per action; semantic communication per action; presentation hierarchy preserved |
| **Rollback** | Revert preset and presentation mapping changes; restore old spritesheets from git |
| **Exit criteria** | 5 pilot units have updated VFX; all tests pass; visual QA confirms improvement |

**Critical constraint**: R4 must preserve all current gameplay mechanics, including AP costs,
damage, elements, statuses, targeting, ranges, area shapes, skill slots, and combat rules.
R4 is a **VFX presentation pilot** only.

**Pilot units and focus:**
1. **Black Mage** — fire/darkness identity conflict (n_flame_wave REDESIGN, n_dark_meteor REPLACE)
2. **Warrior** — w_charge semantic mismatch (REDESIGN), w_whirl + w_lion_surge P0 replacements
3. **Paladin** — p_interpose semantic mismatch (REDESIGN), p_oathwall P0 replacement
4. **White Mage** — w_salvation, w_purify, w_sanctuary all NEEDS_REGENERATION
5. **Rogue/Ninja** — ro_jaw_trap semantic mismatch, ni_shadow_step + ni_silent_assassin redundancy

## R5 — Review & Validation

| Field | Value |
|---|---|
| **Scope** | Comprehensive validation of R3–R4 VFX presentation changes across 7 dimensions |
| **Status** | NOT STARTED (depends on R4) |
| **Inputs** | R4 pilot implementation; R0 skill audit; R0 mappings JSON |
| **Outputs** | Validation report with pass/fail per action per dimension; recommendations for R7 |
| **Tests** | Full test suite; visual QA sessions; performance benchmarks |
| **QA** | 7 validation dimensions (see below) |
| **Rollback** | N/A — validation only, no code changes |
| **Exit criteria** | All 7 dimensions validated; no gameplay balance changes implemented; any gameplay/balance proposals remain documentation-only |

**R5 validation dimensions:**
1. **Visual readability** — Can the player distinguish the action's VFX from other actions?
2. **Semantic communication** — Does the VFX communicate the mechanic (cone, line, single, area, status)?
3. **Presentation hierarchy** — Is the scale/impact tier correct (2 AP < 3 AP < 4 AP < 5 AP ultimate)?
4. **Animation timing** — Does the VFX timing match the combat timing (impact, release, landing)?
5. **Camera compatibility** — Does the VFX render correctly in the game's camera projection?
6. **Technical performance** — Does the VFX maintain target FPS with multiple simultaneous effects?
7. **Asset quality** — Do the spritesheets pass all technical criteria (no bleeding, no magenta, safe padding)?

**R5 must NOT implement gameplay balance changes.** Any gameplay or balance proposal remains
documentation-only until the separate R6 approval gate.

## R6 — Global Unit Skill Redesign (Gameplay Changes)

| Field | Value |
|---|---|
| **Scope** | Implement gameplay mechanic changes proposed during R0–R5 |
| **Status** | NOT STARTED — **REQUIRES SEPARATE APPROVAL GATE** |
| **Approval required** | Explicit user approval before any gameplay values are modified |
| **Inputs** | R5 validation report; R0 deferred gameplay proposals; R0 skill audit redundancy findings |
| **Outputs** | Updated `src/game/skills.ts`, `src/game/catalog.ts` with approved gameplay changes |
| **Tests** | Full test suite; gameplay balance validation; combat simulation |
| **QA** | Each approved change validated individually; rollback plan per change |
| **Rollback** | Revert `skills.ts` and `catalog.ts` changes from git |
| **Exit criteria** | All approved gameplay changes implemented; tests pass; balance validation passes |

**R6 proposals from R0 (all PROPOSAL_ONLY until approval):**
- **BM-R6-1**: Shift n_dark_meteor toward void/dark/gravity, remove burn
- **BM-R6-2**: Reconsider n_flame_wave element (keep fire or shift to dark)
- **BM-R6-3**: Black Mage slot reordering if both skills shift toward dark/void
- **LANCER-R6-1**: Convert l_haft_recoil to knockback/retreat utility (merge candidate)
- **NINJA-R6-1**: Convert ni_shadow_step to pure utility teleport (merge candidate)

## R7 — Full VFX Migration

| Field | Value |
|---|---|
| **Scope** | Extend VFX presentation changes to all 12 units (60 hero actions) |
| **Status** | NOT STARTED (depends on R5 and R6) |
| **Inputs** | R5 validation; R6 approved gameplay changes; R2 pipeline; R1 candidate database |
| **Outputs** | All 60 hero actions have updated VFX; all spritesheets replaced or tuned; all presets updated |
| **Tests** | Full test suite; comprehensive visual QA across all units |
| **QA** | Same 7 dimensions as R5, applied to all 60 actions |
| **Rollback** | Revert to R4 state (5 pilot units updated, rest unchanged) |
| **Exit criteria** | All 60 actions have final VFX; all tests pass; all 7 validation dimensions pass |

## R8 — Cleanup & Removal of Obsolete Assets

| Field | Value |
|---|---|
| **Scope** | Remove obsolete spritesheets, presets, and staging artifacts; finalize documentation |
| **Status** | NOT STARTED (depends on R7) |
| **Inputs** | R7 final state; list of obsolete sheets and presets |
| **Outputs** | Clean `public/assets/vfx/runtime/` with only active sheets; clean `VfxSpriteSheets.ts` with only active definitions; final migration report |
| **Tests** | Full test suite; verify no references to removed sheets |
| **QA** | No orphaned references; no unused PNG files; no unused preset IDs |
| **Rollback** | Restore removed files from git |
| **Exit criteria** | No obsolete assets remain; all tests pass; documentation finalized |

---

## Phase dependency graph

```
R0 (this pass) ──► R1 (BLOCKED: Mega Pack not purchased)
                      │
                      ▼
                    R2 (pipeline)
                      │
                      ▼
                    R3 (5 P0 replacements)
                      │
                      ▼
                    R4 (5-unit VFX presentation pilot)
                      │
                      ▼
                    R5 (review & validation)
                      │
                      ├──────────────────► R6 (gameplay redesign — SEPARATE APPROVAL)
                      │                        │
                      ▼                        ▼
                    R7 (full VFX migration) ◄───
                      │
                      ▼
                    R8 (cleanup)
```

## Safety constraints (all phases)

- No commercial Mega Pack source files copied into `public/assets/`
- Source root remains `<MEGA_PACK_ROOT>` (configurable, outside `public/assets/`)
- R3G UV inset fix, flipY, and frame order in `VfxSpriteSheets.ts` lines 30–67 must not be modified
- `VfxTextures.ts` (LinearFilter, ClampToEdgeWrapping, mipmap config) must not be modified
- `src/game/skills.ts` and `src/game/catalog.ts` frozen until R6 approval
- `src/combat/protocol.ts` and `src/combat/legacyCombatRuntime.js` must not be modified
- No loop playback fields added to runtime code during R0 (documented only)

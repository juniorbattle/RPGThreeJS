# VFX-R3E-3 — Corrected Arcane Slash + Runtime Legacy Cleanup

**Date:** 2026-08-01
**Status:** integrated — manual QA pending
**Scope:** presentation-only; no combat-rule change.

## Executive summary

R3E-3 promotes the corrected `purple_skill_arcane_slash_burst_medium` spritesheet
to runtime, maps `r_arcane_blade` to a dedicated arcane slash preset, and removes
13 orphaned legacy PNGs from the runtime directory. The R3E-1 basic library (22
sheets) and R3E-2 skill library (17 sheets) remain frozen and unchanged.

The corrected asset previously failed QC with 409 opaque magenta pixels. After
correction, 30 residual magenta pixels remained — these were cleaned to zero in
the runtime copy. The raw source is untouched.

13 legacy runtime PNGs corresponding to obsolete presets (removed in V10G-R2A)
were deleted, recovering ~9.4 MB of orphaned assets.

## Frozen baseline

- R3E-1 basic runtime library: **22** sheets, preserved unchanged.
- R3E-1 basic action mappings: **12**, preserved unchanged.
- R3E-2 skill runtime library: **17** sheets, preserved unchanged.
- R3E-2 skill presets: **16**, preserved unchanged.
- R3E-2 skill action mappings: **17**, preserved unchanged.
- Existing V1/V2 and premium/ultimate mappings remain available as fallbacks.

## QC of purple_skill_arcane_slash_burst_medium

| Check | Result |
| --- | --- |
| Dimensions | 1280 × 1280 |
| Color type | 6 (RGBA) |
| Bit depth | 8 |
| Frame layout | 5 × 5 / 25 frames |
| Opaque magenta (raw) | 30 pixels (corrected from 409) |
| Opaque magenta (runtime) | 0 pixels (cleaned) |
| Transparent pixels | 951,405 |
| Separator bands | None detected |
| Impact-only | Yes — target-centered, no travel |

**Decision:** QC PASS. Asset promoted to runtime.

## R3E-3 promotion ledger

| Raw file | Runtime sheet ID | Runtime output | Preset |
| --- | --- | --- | --- |
| `purple_skill_arcane_slash_burst_medium_5x5_25f_1280.png` | `skill_arcane_slash_burst_medium` | same filename | `skill_arcane_slash_burst` |

## Action mapping

| actionId | Previous preset | New preset | Reason |
| --- | --- | --- | --- |
| `r_arcane_blade` | `sword_slash` (generic) | `skill_arcane_slash_burst` | "Lame Arcanique" + purple arcane slash = direct semantic match |
| `d_cursed_blade` | `sword_slash` (generic) | `sword_slash` (unchanged) | Curse/shadow theme ≠ arcane; no speculative mapping |

## R3E-3 constants

```ts
R3E3_SKILL_RUNTIME_SPRITE_SHEET_IDS = 1  // skill_arcane_slash_burst_medium
R3E3_SKILL_VFX_PRESET_IDS = 1            // skill_arcane_slash_burst
R3E3_SKILL_VFX_ACTION_IDS = 1            // r_arcane_blade

SKILL_RUNTIME_SPRITE_SHEET_IDS = 18      // R3E-2 (17) + R3E-3 (1)
SKILL_VFX_PRESET_IDS = 17                // R3E-2 (16) + R3E-3 (1)
SKILL_VFX_ACTION_IDS = 18                // R3E-2 (17) + R3E-3 (1)
```

## 25 HOLD_SEMANTIC assets — confirmed outside runtime

All 25 assets remain in `public/assets/vfx/raw/skills/` only. None are:
- copied to `runtime/`
- added to `manifest.json`
- added to `VfxSpriteSheets.ts`
- added to `VfxPresets.ts`
- added to `VfxActionRegistry.ts`
- mapped in `skillPresentation.ts`

## Runtime legacy cleanup

### PNGs deleted (13 orphaned)

| PNG | Obsolete preset | Size |
| --- | --- | --- |
| `bless_field_5x5_25f_1280.png` | `support_bless_field` | 883 KB |
| `burn_mark_5x5_25f_1280.png` | `status_burn_mark` | 961 KB |
| `dark_explosion_5x5_25f_1280.png` | `impact_dark_explosion` | 989 KB |
| `drain_field_5x5_25f_1280.png` | `ultimate_drain_field` | 1.35 MB |
| `eclipse_devour_5x5_25f_1280.png` | `ultimate_eclipse_devour` | 1.03 MB |
| `fault_breaker_5x5_25f_1280.png` | `ultimate_fault_breaker_v2` | 1.10 MB |
| `holy_explosion_5x5_25f_1280.png` | `ultimate_holy_explosion` | 721 KB |
| `judgement_beam_5x5_25f_1280.png` | `ultimate_judgement_beam` | 835 KB |
| `line_blast_5x5_25f_1280.png` | `shape_line_blast` | 361 KB |
| `mace_impact_5x5_25f_1280.png` | `impact_mace` | 830 KB |
| `silence_seal_5x5_25f_1280.png` | `status_silence_seal` | 804 KB |
| `weak_mark_5x5_25f_1280.png` | `status_weak_mark` | 266 KB |
| `zenith_arrow_5x5_25f_1280.png` | `ultimate_zenith_arrow_v2` | 320 KB |

**Total recovered:** ~9.4 MB

### Runtime inventory after cleanup

- 29 legacy fallback sheets (V1/V2 + premium/ultimate)
- 22 R3E-1 basic sheets
- 17 R3E-2 skill sheets
- 1 R3E-3 skill sheet
- **Total:** 69 runtime PNGs + manifest.json

## Presentation contract

- New preset is `spriteSheet` impact-only.
- Sheet is `layer: impact`, never `ground`.
- Uses `anchor: target` and `orientation: center_on_target`.
- No `sheetMode: projectile`, no source-to-target travel, no telegraph, no decal, no camera operation.

## Tests added or modified

| File | Change |
| --- | --- |
| `VfxSpriteSheets.test.ts` | Added R3E-3 QC test (1 sheet, 0 magenta); aggregated SKILL_RUNTIME = 18 |
| `VfxPresets.test.ts` | Added R3E-3 preset test (1 preset, target-only); aggregated SKILL_VFX = 17 |
| `VfxActionRegistry.test.ts` | Added R3E-3 action test (1 action, skill_ preset); aggregated SKILL_VFX_ACTIONS = 18 |
| `skillPresentation.test.ts` | Added `r_arcane_blade` → `skill_arcane_slash_burst` contract; `d_cursed_blade` → `sword_slash` confirmation |

## Commands run

```text
npm.cmd test         PASS — 28 files, 422 tests
npm.cmd run build    PASS — tsc --noEmit and Vite production build
git diff --check     PASS
```

## Exact changed paths

### Code and metadata

- `src/combat/vfx/VfxTypes.ts`
- `src/combat/vfx/VfxSpriteSheets.ts`
- `src/combat/vfx/VfxPresets.ts`
- `src/combat/vfx/VfxActionRegistry.ts`
- `src/combat/skillPresentation.ts`
- `public/assets/vfx/runtime/manifest.json`
- `src/combat/vfx/VfxSpriteSheets.test.ts`
- `src/combat/vfx/VfxPresets.test.ts`
- `src/combat/vfx/VfxActionRegistry.test.ts`
- `src/combat/skillPresentation.test.ts`

### New runtime asset

- `public/assets/vfx/runtime/purple_skill_arcane_slash_burst_medium_5x5_25f_1280.png`

### Deleted runtime assets (13 orphaned)

- `public/assets/vfx/runtime/bless_field_5x5_25f_1280.png`
- `public/assets/vfx/runtime/burn_mark_5x5_25f_1280.png`
- `public/assets/vfx/runtime/dark_explosion_5x5_25f_1280.png`
- `public/assets/vfx/runtime/drain_field_5x5_25f_1280.png`
- `public/assets/vfx/runtime/eclipse_devour_5x5_25f_1280.png`
- `public/assets/vfx/runtime/fault_breaker_5x5_25f_1280.png`
- `public/assets/vfx/runtime/holy_explosion_5x5_25f_1280.png`
- `public/assets/vfx/runtime/judgement_beam_5x5_25f_1280.png`
- `public/assets/vfx/runtime/line_blast_5x5_25f_1280.png`
- `public/assets/vfx/runtime/mace_impact_5x5_25f_1280.png`
- `public/assets/vfx/runtime/silence_seal_5x5_25f_1280.png`
- `public/assets/vfx/runtime/weak_mark_5x5_25f_1280.png`
- `public/assets/vfx/runtime/zenith_arrow_5x5_25f_1280.png`

## Explicit non-goals met

No gameplay, balance, combat rule, AI, targeting, pathfinding, save, economy,
route, narrative or camera logic changed. No raw source file was edited, deleted
or loaded by the runtime. No HOLD_SEMANTIC asset was promoted, renamed, or
modified. Manifest version remains 3.

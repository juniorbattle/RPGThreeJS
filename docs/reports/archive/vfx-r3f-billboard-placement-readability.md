# VFX-R3F — Combat VFX Billboard Placement and Readability Pass

## Executive Summary

R3F corrects the runtime presentation of combat VFX: billboard placement, rotation, scale, frame timing, and target size awareness. All changes are presentation-only — zero gameplay modifications. The pass eliminates dynamic rotation on impact sprites, recentres unit-targeted effects on the target body, stabilises the vertical offset to remove the "rising animation" artifact, increases minimum scales for readability, extends durations to play more sprite-sheet frames, and adds a target-size multiplier for 2x2/boss visibility.

## Problem Initial

- **Rotation dynamique incohérente**: impact sprites rotated based on camera-projected source→target angle, producing inconsistent angles across perspectives
- **Effet pas toujours bien centré**: many unit-targeted effects used ground anchors (`targetGround`, `groundTarget`) instead of body anchors (`target`)
- **Effet parfois trop petit**: `generic_hit` (1.05 effective), `arrow_shot` (1.03), `kill_spark` (1.62) were below readability threshold
- **Impression d'animation montante**: `align: 'bottom'` + `scale * 0.5` offset caused the sprite to rise with the pulsing scale
- **Manque de fluidité**: many presets played only 5–13 frames out of 25 due to short step durations
- **Boss / 2x2 pas assez lisibles**: no scale compensation for larger targets

## Files Modified

1. `src/combat/vfx/VfxSystem.ts` — removed dynamic rotation from billboard impacts, fixed rising animation, added target size multiplier
2. `src/combat/vfx/VfxTypes.ts` — added `targetSizeMultiplier` to `VfxContext`
3. `src/combat/vfx/VfxPresets.ts` — fixed orientations, anchors, scales, durations across all preset arrays
4. `src/combat/skillPresentation.ts` — replaced all `source_to_target`/`align_line`/`align_cone` with `center_on_target`/`center_on_aoe_origin`
5. `src/combat/skillPresentation.test.ts` — updated orientation expectations to match R3F
6. `src/combat/vfx/VfxR3F.test.ts` — new R3F doctrine test file

## Orientation / Rotation Corrected

### VfxSystem.ts
- **Removed `directionalRotation()` call** from `playSpriteSheetBillboard()` — billboard impact sprites no longer receive camera-projected rotation
- `directionalRotation()` preserved for `playSpriteSheetProjectile()` and `playSpriteSheetSkyDescent()` (technical modes)
- `material.rotation` stays at `step.rotation ?? 0` (authored angle preserved)

### skillPresentation.ts — 15 orientations replaced

| Skill | Old Orientation | New Orientation |
|---|---|---|
| `w_break_guard` | `source_to_target` | `center_on_target` |
| `w_lion_surge` | `align_line` | `center_on_target` |
| `d_cursed_blade` | `source_to_target` | `center_on_target` |
| `l_long_thrust` | `source_to_target` | `center_on_target` |
| `l_haft_recoil` | `source_to_target` | `center_on_target` |
| `l_firmament_lance` | `source_to_target` | `center_on_target` |
| `n_dark_bolt` | `source_to_target` | `center_on_target` |
| `a_precise_shot` | `source_to_target` | `center_on_target` |
| `a_zenith_arrow` | `source_to_target` | `center_on_target` |
| `ni_silent_assassin` | `source_to_target` | `center_on_target` |
| `ro_sneak_attack` | `source_to_target` | `center_on_target` |
| `ar_calibrated_shot` | `source_to_target` | `center_on_target` |
| `enemy_dark_bolt` | `source_to_target` | `center_on_target` |
| `enemy_dragon_breath` | `align_cone` | `center_on_aoe_origin` |
| `boss_execution` | `source_to_target` | `center_on_target` |
| `boss_pin` | `source_to_target` | `center_on_target` |

### VfxPresets.ts — 12 basic attack presets
All `orientation: 'source_to_target'` → `orientation: 'center_on_target'`

## Anchors Recentred

| Preset | Old Anchor | New Anchor | Reason |
|---|---|---|---|
| `fireball` | `targetGround` | `target` | Fire impact on body |
| `heal_burst` | `targetGround` | `target` | Heal on body |
| `bless_aura` | `groundTarget` | `target` | Bless aura on unit |
| `curse_pulse` | `groundTarget` | `target` | Curse debuff on unit |
| `support_regen_aura` | `targetGround` | `target` | Regen aura on unit |
| `support_holy_aura` | `targetGround` | `target` | Holy aura on unit |
| `support_boost_aura` | `targetGround` | `target` | Boost aura on unit |

## Ground Effects Conserved

| Preset | Anchor | Justification |
|---|---|---|
| `boss_quake` | `groundTarget` | Ground fracture AoE |
| `root_vines` | `groundTarget` | Root vines from ground |
| `frost_bind` | `groundTarget` | Frost bind on ground |
| `support_revive_pillar` | `targetGround` | Vertical pillar from ground |
| `move_smoke_burst` | `targetGround` | Smoke cloud on ground |
| `boss_apocalypse_v2` | `targetGround` | Apocalypse field AoE |
| `teleport_burst` | `groundTarget` | Teleport ground effect |
| `leap_impact` | `groundTarget` | Landing impact |
| `boss_slam` | `targetGround` | Ground slam AoE |
| `caster_roar` | `sourceGround` | Shockwave from caster |
| `impact_explosion_large` | `targetGround` | Large explosion AoE |
| `guard_barrier` | `targetGround` | Barrier guard |

## Rising Animation Corrected

### Root cause
`VfxSystem.ts:707` — `if (definition.align === 'bottom') sprite.position.y += scale * 0.5;`

The `scale` variable included `spriteSheetScalePulse()` which varied from 0.94 to 1.06, causing the Y offset to oscillate during animation.

### Fix
Replaced `scale * 0.5` with `baseHeight * 0.5` — the stable base scale without pulse modulation. This keeps the offset constant during the animation while preserving the visual intent of `align: 'bottom'` (effects that originate from the ground).

Same fix applied to `playSpriteSheetSkyDescent()`.

## Durations Adjusted

### Main presets

| Preset | Old Duration | New Duration | Old Step | New Step |
|---|---|---|---|---|
| `generic_hit` | 0.32 | 0.60 | 0.23 | 0.50 |
| `sword_slash` | 0.46 | 0.60 | 0.34 | 0.50 |
| `poison_bite` | 0.46 | 0.62 | 0.28 | 0.50 |
| `critical_hit` | 0.34 | 0.55 | 0.28 | 0.50 |
| `holy_strike` | 0.56 | 0.72 | 0.34/0.42 | 0.50/0.55 |
| `arrow_shot` | 0.58 | 0.68 | 0.54 | 0.60 |
| `kill_spark` | 0.72 | 0.82 | 0.48 | 0.60 |
| `thrust_line` | 0.50 | 0.60 | 0.38 | 0.50 |
| `teleport_burst` | 0.46 | 0.60 | 0.43 | 0.55 |
| `leap_impact` | 0.58 | 0.72 | 0.48 | 0.60 |
| `caster_roar` | 0.54 | 0.65 | 0.42 | 0.55 |
| `move_smoke_burst` | 0.48 | 0.60 | 0.42 | 0.55 |
| `boss_slam` | 0.90 | 1.00 | 0.58 | 0.70 |
| `arrow_rain` | 0.76 | 0.80 | 0.54 | 0.65 |

### Basic attack presets

| Category | Old Duration | New Duration |
|---|---|---|
| Small (7 presets) | 0.38 | 0.50 |
| Medium (4 presets) | 0.46 | 0.55 |
| Heavy (1 preset) | 0.55 | 0.60 |

### Premium presets

| Preset | Old Step | New Step |
|---|---|---|
| `ultimate_lion_surge` | 0.50 | 0.60 |
| `ultimate_firmament_lance` | 0.56 | 0.65 |
| `ultimate_zenith_arrow` | 0.54 | 0.65 |
| `ultimate_silent_assassin` (step 2) | 0.34 | 0.50 |
| `ultimate_fault_breaker` | 0.38 | 0.55 |
| `boss_flurry` (3 steps) | 0.42/0.42/0.48 | 0.50/0.50/0.55 |
| `boss_execution` | 0.62 | 0.70 |
| `enemy_dragon_breath` | 0.54 | 0.65 |

## Scales Adjusted

| Preset | Old Scale | New Scale | Old Effective | New Effective |
|---|---|---|---|---|
| `generic_hit` | 0.92 | 1.20 | 1.05 | 1.37 |
| `arrow_shot` | 0.90 | 1.15 | 1.03 | 1.31 |
| `kill_spark` | 1.42 | 1.80 | 1.62 | 2.05 |

## Target Size Multiplier (2x2 / Boss)

Added `targetSizeMultiplier` to `VfxContext` (optional, presentation-only).

### Implementation
- `VfxSystem.ts` — `contextTargetSizeMultiplier()` helper: returns `1.3` if `targetUnit.size > 1`, else `1.0`
- Applied in `playSpriteSheetBillboard()` base height calculation
- Can be overridden via `context.targetSizeMultiplier` for testing

### Values
| Target Size | Multiplier |
|---|---|
| 1x1 | 1.0 |
| 2x2 / boss | 1.3 |

## Tests Added/Modified

### VfxR3F.test.ts (new — 7 doctrine tests)
1. Impact spriteSheet steps never use dynamic-rotation orientations
2. Basic attack VFX use `center_on_target` orientation
3. Unit-centered support/debuff presets use `anchor: target`
4. Ground effects retain ground anchors only when semantically justified
5. SpriteSheet steps meet minimum visual duration for 25-frame sheets
6. `generic_hit`, `arrow_shot`, `kill_spark` meet minimum effective scale
7. `targetSizeMultiplier` is presentation-only

### skillPresentation.test.ts (modified)
- Updated 5 orientation expectations from `source_to_target` to `center_on_target`
- Updated `boss_pin` orientation expectation
- Updated `enemy_dark_bolt` orientation expectation

## QA Manuelle Restante

- Visual confirmation that impact sprites no longer rotate dynamically
- Visual confirmation that the "rising animation" artifact is resolved
- Visual confirmation that 2x2/boss targets have larger VFX
- Visual confirmation that short-duration effects now play more frames
- Visual confirmation that `generic_hit`, `arrow_shot`, `kill_spark` are more visible
- Visual confirmation that ground effects (slam, quake, teleport) still anchor correctly

## Confirmation: Zero Gameplay Changes

No changes to:
- Damage, AP/PA, AI, targeting, status effects
- `src/game/skills.ts`, `src/game/catalog.ts`
- Combat rules, camera, economy, save, narration
- Skill motion presets or cast styles
- `impactTime` values (gameplay timing preserved)
- `vfxPreset` mappings in `skillPresentation.ts` (only `orientation` changed)

## Commands

```powershell
npm.cmd test
npm.cmd run build
git diff --check
git status --short
```

# VFX-R3E-4 — Legacy Runtime Reference Replacement Sweep

## Executive Summary

R3E-4 eliminates all 29 legacy sprite sheet IDs from the VFX runtime. Every preset that previously referenced a deleted legacy PNG has been remapped to a semantically appropriate existing runtime sheet or a newly promoted HOLD_SEMANTIC raw asset. Zero legacy PNGs were restored. Zero gameplay changes. 6 raw assets were promoted to runtime after QC.

## Runtime Inventory

### Before (pre-R3E-4)
- 40 PNGs in runtime (22 R3E-1 basic + 17 R3E-2 skills + 1 R3E-3 arcane slash)
- 29 legacy sheet IDs in registries referencing deleted PNGs
- manifest.json had 69 entries (40 valid + 29 broken)

### After (post-R3E-4)
- 46 PNGs in runtime (40 baseline + 6 promoted)
- 0 legacy sheet IDs
- manifest.json has 46 entries, all with valid PNGs

## 40 PNG Baseline Confirmed

| Category | Count | Status |
|---|---|---|
| R3E-1 basic | 22 | Intact |
| R3E-2 skills | 17 | Intact |
| R3E-3 arcane slash | 1 | Intact |
| **Total baseline** | **40** | **Confirmed** |

## Raw Promoted (6)

| Sheet ID | Raw Filename | QC Status |
|---|---|---|
| `skill_meteor_impact_burst_heavy` | `orange_skill_meteor_impact_burst_heavy_5x5_25f_1280.png` | Passed (1280×1280, RGBA, no magenta) |
| `skill_holy_light_pillar_medium` | `blue_skill_holy_light_pillar_medium_5x5_25f_1280.png` | Passed |
| `skill_void_singularity_implosion_ultimate` | `purpleblack_skill_void_singularity_implosion_ultimate_5x5_25f_1280.png` | Passed |
| `skill_void_spiral_implosion_medium` | `purple_skill_void_spiral_implosion_medium_5x5_25f_1280.png` | Passed |
| `skill_fire_spark_cluster_medium` | `orange_skill_fire_spark_cluster_medium_5x5_25f_1280.png` | Passed |
| `skill_starburst_impact_medium` | `green_skill_starburst_impact_medium_5x5_25f_1280.png` | Passed |

## Legacy IDs Removed (29)

`slash_arc`, `small_impact`, `thrust_line`, `projectile_shot`, `magic_bolt`, `fire_explosion`, `heal_touch`, `buff_pulse`, `barrier_shell`, `teleport_burst`, `shockwave_ring`, `leap_impact`, `artillery_barrage`, `dragon_breath`, `heavy_execution`, `meteor_fall`, `titan_slam`, `curse_mark`, `regen_aura`, `revive_pillar`, `holy_aura`, `boost_aura`, `smoke_burst`, `cone_blast`, `explosion_large`, `apocalypse_field`, `shadow_lightning_bolt`, `root_vines`, `frost_bind`

## Presets Corrected

### Priority A — Existing runtime sheet (14 high-confidence)

| Preset | Legacy Sheet | New Sheet |
|---|---|---|
| `fireball` | `fire_explosion` | `skill_fire_impact_burst_medium` |
| `heal_burst` | `heal_touch` | `skill_heal_blessing_bloom_heavy` |
| `sword_slash` | `slash_arc` | `basic_sword_slash_heavy` |
| `blunt_impact` | `small_impact` | `basic_hammer_crush_heavy` |
| `poison_bite` | `slash_arc` | `skill_poison_maw_bite_heavy` |
| `guard_barrier` | `barrier_shell` | `skill_barrier_guard_heavy` |
| `support_holy_aura` | `holy_aura` | `skill_holy_radiance_burst_heavy` |
| `leap_impact` | `leap_impact` | `basic_body_slam_heavy` |
| `boss_slam` | `leap_impact` | `basic_body_slam_heavy` |
| `ultimate_radiant_judgement` | `holy_aura` | `skill_holy_radiance_burst_heavy` |
| `boss_execution` | `heavy_execution` | `basic_execution_slash_heavy` |
| `boss_titan_slam` | `titan_slam` | `basic_titan_crush_heavy` |
| `thrust_line` | `thrust_line` | `basic_spear_stab_medium` |
| `ultimate_firmament_lance` | `thrust_line` | `basic_spear_stab_medium` |

### Priority A — Ambiguous decisions (12)

| Preset | Legacy Sheet | New Sheet | Notes |
|---|---|---|---|
| `generic_hit` | `small_impact` | `basic_bolt_hit_small` | Generic fallback |
| `kill_spark` | `small_impact` | `basic_bolt_hit_small` | Victory spark |
| `critical_hit` | `slash_arc` | `basic_execution_slash_heavy` | Critical feedback |
| `shadow_lightning_bolt` | `shadow_lightning_bolt` | `skill_void_rune_orb_medium` | Dark/void orb |
| `root_vines` | `root_vines` | `skill_arcane_sigil_burst_medium` | Bind effect |
| `frost_bind` | `frost_bind` | `skill_ice_pillar_impact_heavy` | Frost bind |
| `curse_pulse` | `curse_mark` | `skill_void_rune_orb_medium` | Curse debuff |
| `status_curse_mark` | `curse_mark` | `skill_void_rune_orb_medium` | Curse status |
| `support_boost_aura` | `boost_aura` | `skill_arcane_orbit_burst_medium` | Boost aura |
| `move_smoke_burst` | `smoke_burst` | `skill_void_spiral_implosion_medium` | Smoke/tactical |
| `caster_roar` | `shockwave_ring` | `skill_starburst_impact_medium` | Command wave |
| `shape_cone_blast` | `cone_blast` | `skill_wind_slash_swirl_medium` | Cone blast (QA note) |

### Priority B — Promoted raw (6)

| Preset | Legacy Sheet | New Sheet |
|---|---|---|
| `ultimate_dark_meteor` | `meteor_fall` | `skill_meteor_impact_burst_heavy` |
| `support_revive_pillar` | `revive_pillar` | `skill_holy_light_pillar_medium` |
| `boss_apocalypse_v2` | `apocalypse_field` | `skill_void_singularity_implosion_ultimate` |
| `ultimate_devouring_eclipse` | `apocalypse_field` | `skill_void_singularity_implosion_ultimate` |
| `teleport_burst` | `teleport_burst` | `skill_void_spiral_implosion_medium` |
| `ultimate_artillery_barrage` | `artillery_barrage` | `skill_fire_spark_cluster_medium` |

### Premium presets also corrected

| Preset | Legacy Sheet | New Sheet |
|---|---|---|
| `ultimate_lion_surge` | `slash_arc` | `basic_execution_slash_heavy` |
| `ultimate_miracle` | `holy_aura` | `skill_holy_radiance_burst_heavy` |
| `ultimate_perfect_duality` | `explosion_large` | `skill_fire_vortex_nova_heavy` |
| `ultimate_absolute_harmony` | `holy_aura` | `skill_holy_radiance_burst_heavy` |
| `ultimate_zenith_arrow` | `projectile_shot` | `basic_arrow_hit_small` |
| `ultimate_silent_assassin` | `teleport_burst` + `slash_arc` | `skill_void_spiral_implosion_medium` + `basic_execution_slash_heavy` |
| `ultimate_fault_breaker` | `slash_arc` | `basic_greatsword_cleave_heavy` |
| `enemy_dragon_breath` | `dragon_breath` | `skill_fire_smoke_explosion_heavy` |
| `boss_flurry` | `slash_arc` (×3) | `basic_sword_slash_heavy` (×3) |
| `boss_inferno` | `explosion_large` | `skill_fire_vortex_nova_heavy` |
| `holy_strike` | `slash_arc` + `holy_aura` | `basic_sword_slash_heavy` + `skill_holy_radiance_burst_heavy` |
| `arrow_shot` | `projectile_shot` | `basic_arrow_hit_small` |
| `arrow_rain` | `projectile_shot` | `basic_arrow_hit_small` |
| `dark_bolt` | `magic_bolt` | `skill_void_rune_orb_medium` |
| `bless_aura` | `buff_pulse` | `skill_holy_sigil_burst_medium` |
| `support_regen_aura` | `regen_aura` | `skill_support_leaf_burst_medium` |
| `boss_quake` | `shockwave_ring` | `skill_starburst_impact_medium` |

## Projectile Mode Removed

8 presets had `sheetMode: 'projectile'` removed and converted to impact-only target-centered:

| Preset | Change |
|---|---|
| `arrow_shot` | anchor `source`→`target`, removed `targetAnchor`/`sheetMode` |
| `arrow_rain` | anchor `source`→`target`, removed `targetAnchor`/`sheetMode` |
| `dark_bolt` | anchor `source`→`target`, removed `targetAnchor`/`sheetMode` |
| `shadow_lightning_bolt` | anchor `source`→`target`, removed `targetAnchor`/`sheetMode` |
| `thrust_line` | anchor `source`→`target`, removed `targetAnchor`/`sheetMode` |
| `shape_cone_blast` | anchor `source`→`target`, removed `targetAnchor`/`sheetMode` |
| `ultimate_zenith_arrow` | anchor `source`→`target`, removed `targetAnchor`/`sheetMode` |
| `enemy_dragon_breath` | anchor `source`→`target`, removed `targetAnchor`/`sheetMode` |

All changed to `orientation: 'center_on_target'` where applicable.

## Actions Affected

All hero skills, enemy skills, boss skills, items, and feedback presets that used legacy sheets are now mapped to valid runtime sheets. No action IDs or skill presentation mappings changed.

## UPGRADE_CANDIDATES Updated

Reduced from 9 to 3 entries. Removed candidates for presets that now use semantically appropriate sheets:
- `ultimate_zenith_arrow` — removed (was about `projectile_shot`)
- `ultimate_fault_breaker` — removed (was about `slash_arc`)
- `ultimate_lion_surge` — removed (was about `slash_arc`)
- `critical_hit` — removed (was about `slash_arc`)
- `poison_bite` — removed (was about `slash_arc`)
- `kill_spark` — removed (was about `small_impact`)

Remaining 3 candidates are for presets sharing `skill_holy_radiance_burst_heavy` (visual uniformity concern):
- `ultimate_radiant_judgement` (medium priority)
- `ultimate_miracle` (low priority)
- `ultimate_absolute_harmony` (low priority)

## BASIC_LIBRARY_ONLY Updated

Removed 5 sheets now actively used by presets:
- `basic_body_slam_heavy` (used by `leap_impact`, `boss_slam`)
- `basic_execution_slash_heavy` (used by `critical_hit`, `boss_execution`, `ultimate_lion_surge`, `ultimate_silent_assassin`)
- `basic_hammer_crush_heavy` (used by `blunt_impact`)
- `basic_sword_slash_heavy` (used by `sword_slash`, `holy_strike`, `boss_flurry`)
- `basic_titan_crush_heavy` (used by `boss_titan_slam`)

## Tests Added/Modified

### VfxSpriteSheets.test.ts
- Added `R3E4_PROMOTED_SPRITE_SHEET_IDS` import
- Updated `root_vines`/`frost_bind` magenta test → `skill_void_spiral_implosion_medium`/`skill_ice_pillar_impact_heavy`
- Added R3E-4 QC test (6 promoted sheets: dimensions, RGBA, magenta check)
- Updated `SKILL_RUNTIME_SPRITE_SHEET_IDS` count: 18 → 24

### VfxActionRegistry.test.ts
- `meteor_fall` → `skill_meteor_impact_burst_heavy` in chain test
- `slash_arc` → `basic_sword_slash_heavy` in sprite sharing test
- Upgrade candidates count: 9 → 3
- Removed `ultimate_zenith_arrow` and `ultimate_fault_breaker` from candidate expectations

## Files Modified

1. `src/combat/vfx/VfxTypes.ts` — removed 29 legacy IDs, added 6 new
2. `src/combat/vfx/VfxSpriteSheets.ts` — removed 29 legacy defs, added 6 new defs, updated export arrays
3. `public/assets/vfx/runtime/manifest.json` — removed 29 legacy entries, added 6 new
4. `src/combat/vfx/VfxPresets.ts` — updated all preset steps with new sheet IDs
5. `src/combat/vfx/VfxActionRegistry.ts` — updated UPGRADE_CANDIDATES
6. `src/combat/vfx/VfxSpriteSheets.test.ts` — updated tests
7. `src/combat/vfx/VfxActionRegistry.test.ts` — updated tests
8. 6 PNG files copied from `raw/skills/` to `runtime/`

## Confirmation: Zero Gameplay Changes

No changes to:
- Damage, AP/PA, AI, targeting, status effects
- `src/game/skills.ts`, `src/game/catalog.ts`
- `src/combat/skillPresentation.ts` (action→preset mappings unchanged)
- Combat rules, camera, economy, save, narration

## QA Visual Restante

- `shape_cone_blast` uses `skill_wind_slash_swirl_medium` — visual QA needed to confirm cone-like presentation
- `move_smoke_burst` uses `skill_void_spiral_implosion_medium` — visual QA needed for smoke-like feel
- `caster_roar` uses `skill_starburst_impact_medium` — visual QA needed for shockwave-like feel
- 3 presets share `skill_holy_radiance_burst_heavy` — visual uniformity concern for ultimates
- Projectile travel animation lost on 8 presets — accepted per R3F doctrine

# VFX Mega Pack R1.1 — R2 Pilot Recommendation

**Generated:** 2026-08-06
**Target:** 13–18 animations for limited R2 pilot batch

## Selection Criteria

1. P0 replacement candidates with highest grid confidence
2. Semantic mismatch corrections with confirmed grid structure
3. Status/loop effects from confirmed loop families
4. Diverse visual family coverage
5. Low technical risk for first R2 conversions

## P0 Replacements (5)

| # | Action | Target Sheet | Source | Conversion | Risk | Semantic Conf. | Rollback |
|---|---|---|---|---|---|---|---|
| 1 | w_whirl | skill_wind_slash_swirl_medium | Fire Slash v1 - Spin_spritesheet.png (4x4/16f, POTENTIAL) | 64→25 resample, recolor fire→physical, repack 1280x1280 | low | high | Restore original skill_wind_slash_swirl_medium.png |
| 2 | w_lion_surge | basic_execution_slash_heavy | Blue Slash v1 - Flurry_spritesheet.png (4x4/16f, POTENTIAL) | 64→25 resample, recolor blue→golden, repack 1280x1280 | low | medium | Restore original basic_execution_slash_heavy.png |
| 3 | d_devouring_eclipse | skill_void_singularity_implosion_ultimate | Impact_Darkness_Lv3_spritesheet.png (8x8/64f, POTENTIAL) | 64→25 resample, scale for ultimate, repack 1280x1280 | moderate | high | Restore original skill_void_singularity_implosion_ultimate.png |
| 4 | p_oathwall | skill_barrier_guard_heavy | Shield_On_spritesheet.png (4x4/16f, POTENTIAL) | 64→25 resample, downscale shield ring, repack 1280x1280 | low | high | Restore original skill_barrier_guard_heavy.png |
| 5 | ni_shadow_step | basic_execution_slash_heavy | Lightning Slash v1 - Flurry_spritesheet.png (4x4/16f, POTENTIAL) | 64→25 resample, recolor lightning→shadow, repack 1280x1280 | moderate | medium | Restore original basic_execution_slash_heavy.png |

## Semantic Mismatch Corrections (3)

| # | Action | Target Change | Source | Conversion | Risk | Semantic Conf. | Rollback |
|---|---|---|---|---|---|---|---|
| 1 | w_charge | basic_hammer_crush_heavy → directional dash | Dash_Wind_White_v3_spritesheet.png (4x4/16f, POTENTIAL) | 64→25 resample, recolor wind→physical, directional orientation, repack 1280x1280 | moderate | medium | Restore original basic_hammer_crush_heavy.png |
| 2 | p_interpose | basic_body_slam_heavy → shield impact | Shield_On_spritesheet.png (4x4/16f, POTENTIAL) | 64→25 resample, holy palette, repack 1280x1280 | low | high | Restore original basic_body_slam_heavy.png |
| 3 | n_flame_wave | skill_fire_impact_burst_medium → directional wave | Flamethrower_001_spritesheet.png (4x4/16f, POTENTIAL) | 64→25 resample with CROP_OR_REFRAME, emphasize wave front, repack 1280x1280 | high | medium | Restore original skill_fire_impact_burst_medium.png |

## Status/Loop Effects (5)

| # | Action | Target Sheet | Source | Conversion | Risk | Semantic Conf. | Rollback |
|---|---|---|---|---|---|---|---|
| 1 | w_sanctuary (regen aura) | skill_support_leaf_burst_medium | Positive_Buff_V3_spritesheet.png (8x8/64f, POTENTIAL) | 64→25 loop-aware resample, recolor holy→nature/holy, repack 1280x1280 | moderate | medium | Restore original skill_support_leaf_burst_medium.png |
| 2 | e_vigor_rune (boost buff) | skill_arcane_orbit_burst_medium | Heart_Buff_V3_spritesheet.png (4x4/16f, POTENTIAL) | 64→25 resample, recolor heart→arcane, repack 1280x1280 | moderate | medium | Restore original skill_arcane_orbit_burst_medium.png |
| 3 | ni_smoke_bomb (blind area) | skill_void_spiral_implosion_medium | Angry_Smoke_Burst_White_v2_A_spritesheet.png (4x4/16f, POTENTIAL) | 64→25 loop-aware resample, shadow palette, repack 1280x1280 | moderate | medium | Restore original skill_void_spiral_implosion_medium.png |
| 4 | w_salvation (heal bloom) | skill_heal_blessing_bloom_heavy | Healing_V3_spritesheet.png (8x8/64f, POTENTIAL) | 64→25 resample, holy palette, repack 1280x1280 | low | high | Restore original skill_heal_blessing_bloom_heavy.png |
| 5 | e_binding_seal (root area) | skill_arcane_sigil_burst_medium | Hex_Bursts_Center_V2_spritesheet.png (4x4/16f, POTENTIAL) | 64→25 resample, arcane palette, repack 1280x1280 | low | high | Restore original skill_arcane_sigil_burst_medium.png |

## Pilot Summary

| Category | Count |
|---|---|
| P0 replacements | 5 |
| Semantic mismatch corrections | 3 |
| Status/loop effects | 5 |
| **Total** | **13** |

## Risk Assessment

| Risk Level | Count | Actions |
|---|---|---|
| Low | 6 | w_whirl, w_lion_surge, p_oathwall, p_interpose, w_salvation (heal bloom), e_binding_seal (root area) |
| Moderate | 6 | d_devouring_eclipse, ni_shadow_step, w_charge, w_sanctuary (regen aura), e_vigor_rune (boost buff), ni_smoke_bomb (blind area) |
| High | 1 | n_flame_wave |

## R2 Authorization

R2 pilot may begin for assets with VISUALLY_VALIDATED or POTENTIAL verdicts. All 13 pilot assets have rollback methods defined. No runtime code changes required — only spritesheet PNG replacement.

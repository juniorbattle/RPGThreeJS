# VFX-R2C-SOL Cleaning Audit

## 1. Summary

- Raw PNG files found: **90**
- Files processed: **90**
- PASS: **25**
- WARN: **23**
- FAIL: **42**
- Categories: white (22), gold (22), skills (46)
- Output: `public/assets/vfx/validation/new-batch-cleaned/`
- Active runtime untouched: **yes**

Forty-two source sheets are 1254x1254 despite runtime-oriented names. They were cleaned and retained for visual comparison, but marked FAIL because this pass must not resize them and they do not provide 256x256 frames.

## 2. Input Folders

- `public/assets/vfx/raw/white/`: 22 PNG; non-PNG: .gitkeep
- `public/assets/vfx/raw/gold/`: 22 PNG; non-PNG: .gitkeep
- `public/assets/vfx/raw/skills/`: 46 PNG; non-PNG: .gitkeep

`public/assets/vfx/raw/archived-old/` was excluded and left untouched.

## 3. Cleaning Method

The removed legacy Python pipeline was neither used nor restored. Codex used one temporary, pass-specific Pillow/NumPy helper to inspect and clean the 90 sheets, generate metrics and write this report. The helper was removed after execution and is not part of the project.

The helper applied a conservative chroma-key based on red/blue similarity, green separation and high-value pink detection. It then removed bright separator pixels around the known 5x5 boundaries, cleared the outer four-pixel border, and cleared the small top-left frame-index regions. No source was cropped, resized, reordered or split.

## 4. Cleaning Rules Applied

- Bright and near-magenta background pixels were converted to alpha.
- Edge pixels received conservative partial alpha to protect saturated effect contours.
- Grid separators were detected only near expected 5x5 boundaries.
- Small frame-number/index regions were removed from each cell.
- Transparent pixels had RGB cleared to avoid hidden magenta bleed.
- Outputs remain full-sheet RGBA PNGs at their original dimensions.
- 1280x1280 sheets preserve 5x5 / 25 frames at 256x256.
- 1254x1254 sheets remain 1254x1254 and are not runtime-promotable.

## 5. Per-File Audit Table

| Category | Raw file | spriteSheetId | Dimensions | Magenta | Cleaned output | Occupancy avg / peak | Warnings | Status |
|---|---|---|---:|:---:|---|---:|---|:---:|
| white | `01_white_slash_small_impact_5x5_25f_1280.png` | `white_slash_small_impact` | 1280x1280 | yes | `01_white_slash_small_impact_5x5_25f_1280.png` | 0.0076 / 0.0306 | none | **PASS** |
| white | `02_white_slash_heavy_impact_5x5_25f_1280.png` | `white_slash_heavy_impact` | 1280x1280 | yes | `02_white_slash_heavy_impact_5x5_25f_1280.png` | 0.0510 / 0.1637 | none | **PASS** |
| white | `03_white_pierce_stab_impact_5x5_25f_1280.png` | `white_pierce_stab_impact` | 1280x1280 | yes | `03_white_pierce_stab_impact_5x5_25f_1280.png` | 0.0060 / 0.0489 | 10 frames are effectively empty<br>Very low average frame occupancy; effect may be too small | **WARN** |
| white | `04_white_arrow_hit_impact_5x5_25f_1280.png` | `white_arrow_hit_impact` | 1280x1280 | yes | `04_white_arrow_hit_impact_5x5_25f_1280.png` | 0.0044 / 0.0217 | Very low average frame occupancy; effect may be too small | **WARN** |
| white | `06_white_bite_impact_variant_b_5x5_25f_1280.png` | `white_bite_impact_variant_b` | 1280x1280 | yes | `06_white_bite_impact_variant_b_5x5_25f_1280.png` | 0.0194 / 0.0686 | none | **PASS** |
| white | `06_white_projectile_volley_impact_v01_spritesheet_1280x1280_5x5_25f.png` | `white_projectile_volley_impact_v01` | 1280x1280 | yes | `06_white_projectile_volley_impact_v01_spritesheet_1280x1280_5x5_25f.png` | 0.0158 / 0.1323 | Possible projectile/travel or pre-position sequence; manual doctrine review required | **WARN** |
| white | `07_white_claw_impact_5x5_25f_1280.png` | `white_claw_impact` | 1280x1280 | yes | `07_white_claw_impact_5x5_25f_1280.png` | 0.0150 / 0.0556 | none | **PASS** |
| white | `08_white_charge_body_impact_5x5_25f_1280.png` | `white_charge_body_impact` | 1280x1280 | yes | `08_white_charge_body_impact_5x5_25f_1280.png` | 0.0346 / 0.1373 | none | **PASS** |
| white | `09_white_horn_ram_impact_5x5_25f_1280.png` | `white_horn_ram_impact` | 1280x1280 | yes | `09_white_horn_ram_impact_5x5_25f_1280.png` | 0.0120 / 0.0539 | 10 frames are effectively empty | **WARN** |
| white | `10_white_tail_whip_impact_5x5_25f_1280.png` | `white_tail_whip_impact` | 1280x1280 | yes | `10_white_tail_whip_impact_5x5_25f_1280.png` | 0.0137 / 0.0397 | none | **PASS** |
| white | `11_white_smash_midair_impact_5x5_25f_1280.png` | `white_smash_midair_impact` | 1280x1280 | yes | `11_white_smash_midair_impact_5x5_25f_1280.png` | 0.0152 / 0.0734 | none | **PASS** |
| white | `12_white_bite_impact_variant_c_5x5_25f_1280.png` | `white_bite_impact_variant_c` | 1280x1280 | yes | `12_white_bite_impact_variant_c_5x5_25f_1280.png` | 0.0268 / 0.1376 | none | **PASS** |
| white | `13_white_claw_heavy_impact_5x5_25f_1280.png` | `white_claw_heavy_impact` | 1280x1280 | yes | `13_white_claw_heavy_impact_5x5_25f_1280.png` | 0.0211 / 0.0440 | none | **PASS** |
| white | `14_white_pierce_beam_impact_5x5_25f_1280.png` | `white_pierce_beam_impact` | 1280x1280 | yes | `14_white_pierce_beam_impact_5x5_25f_1280.png` | 0.0164 / 0.0556 | none | **PASS** |
| white | `15_white_pierce_beam_impact_variant_b_5x5_25f_1280.png` | `white_pierce_beam_impact_variant_b` | 1280x1280 | yes | `15_white_pierce_beam_impact_variant_b_5x5_25f_1280.png` | 0.0337 / 0.1079 | none | **PASS** |
| white | `16_white_charge_dash_impact_5x5_25f_1280.png` | `white_charge_dash_impact` | 1280x1280 | yes | `16_white_charge_dash_impact_5x5_25f_1280.png` | 0.0076 / 0.0472 | Possible projectile/travel or pre-position sequence; manual doctrine review required | **WARN** |
| white | `vfx_impact_piercing_bolt_flash_basic_spritesheet.png` | `white_vfx_impact_piercing_bolt_flash_basic` | 1254x1254 | yes | `vfx_impact_piercing_bolt_flash_basic_spritesheet.png` | 0.0170 / 0.0806 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| white | `vfx_impact_piercing_spike_barrage_basic_spritesheet.png` | `white_vfx_impact_piercing_spike_barrage_basic` | 1254x1254 | yes | `vfx_impact_piercing_spike_barrage_basic_spritesheet.png` | 0.0090 / 0.0367 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| white | `vfx_impact_white_bite_crescent_basic_spritesheet.png` | `white_bite_crescent_basic` | 1254x1254 | yes | `vfx_impact_white_bite_crescent_basic_spritesheet.png` | 0.0315 / 0.1474 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| white | `vfx_impact_white_charge_slam_basic_spritesheet.png` | `white_charge_slam_basic` | 1254x1254 | yes | `vfx_impact_white_charge_slam_basic_spritesheet.png` | 0.0273 / 0.1103 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| white | `vfx_impact_white_dash_strike_basic_spritesheet.png` | `white_dash_strike_basic` | 1254x1254 | yes | `vfx_impact_white_dash_strike_basic_spritesheet.png` | 0.0185 / 0.0560 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable<br>Possible projectile/travel or pre-position sequence; manual doctrine review required | **FAIL** |
| white | `vfx_impact_white_slash_burst_basic_spritesheet.png` | `white_slash_burst_basic` | 1254x1254 | yes | `vfx_impact_white_slash_burst_basic_spritesheet.png` | 0.0318 / 0.1079 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| gold | `gold_effect_comet_arc_burst_medium_5x5_25f_1280.png` | `gold_effect_comet_arc_burst_medium` | 1254x1254 | yes | `gold_effect_comet_arc_burst_medium_5x5_25f_1280.png` | 0.0541 / 0.1907 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable<br>Possible projectile/travel or pre-position sequence; manual doctrine review required | **FAIL** |
| gold | `gold_effect_holy_sigil_burst_medium_5x5_25f_1280.png` | `gold_effect_holy_sigil_burst_medium` | 1254x1254 | yes | `gold_effect_holy_sigil_burst_medium_5x5_25f_1280.png` | 0.0900 / 0.2773 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable<br>Possible ground-decal or persistent-field behavior; manual doctrine review required | **FAIL** |
| gold | `gold_effect_projectile_barrier_break_heavy_5x5_25f_1280.png` | `gold_effect_projectile_barrier_break_heavy` | 1254x1254 | yes | `gold_effect_projectile_barrier_break_heavy_5x5_25f_1280.png` | 0.1028 / 0.3278 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable<br>Possible ground-decal or persistent-field behavior; manual doctrine review required<br>Possible projectile/travel or pre-position sequence; manual doctrine review required | **FAIL** |
| gold | `gold_effect_radiance_starburst_medium_5x5_25f_1280.png` | `gold_effect_radiance_starburst_medium` | 1254x1254 | yes | `gold_effect_radiance_starburst_medium_5x5_25f_1280.png` | 0.0576 / 0.2510 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| gold | `gold_effect_radiance_sunburst_medium_5x5_25f_1280.png` | `gold_effect_radiance_sunburst_medium` | 1254x1254 | yes | `gold_effect_radiance_sunburst_medium_5x5_25f_1280.png` | 0.0576 / 0.2510 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| gold | `gold_impact_beast_bite_medium_5x5_25f_1280.png` | `gold_impact_beast_bite_medium` | 1254x1254 | yes | `gold_impact_beast_bite_medium_5x5_25f_1280.png` | 0.1129 / 0.3210 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| gold | `gold_impact_blade_crescent_slash_heavy_5x5_25f_1280.png` | `gold_impact_blade_crescent_slash_heavy` | 1254x1254 | yes | `gold_impact_blade_crescent_slash_heavy_5x5_25f_1280.png` | 0.1354 / 0.3884 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| gold | `gold_impact_blade_crescent_spiral_medium_5x5_25f_1280.png` | `gold_impact_blade_crescent_spiral_medium` | 1254x1254 | yes | `gold_impact_blade_crescent_spiral_medium_5x5_25f_1280.png` | 0.1125 / 0.2924 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| gold | `gold_impact_blade_cross_slash_medium_5x5_25f_1280.png` | `gold_impact_blade_cross_slash_medium` | 1254x1254 | yes | `gold_impact_blade_cross_slash_medium_5x5_25f_1280.png` | 0.1700 / 0.4215 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| gold | `gold_impact_blade_slash_arc_small_5x5_25f_1280.png` | `gold_impact_blade_slash_arc_small` | 1254x1254 | yes | `gold_impact_blade_slash_arc_small_5x5_25f_1280.png` | 0.0598 / 0.2160 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| gold | `gold_impact_claw_rake_medium_5x5_25f_1280.png` | `gold_impact_claw_rake_medium` | 1254x1254 | yes | `gold_impact_claw_rake_medium_5x5_25f_1280.png` | 0.1188 / 0.2761 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| gold | `gold_impact_collision_dual_burst_heavy_5x5_25f_1280.png` | `gold_impact_collision_dual_burst_heavy` | 1254x1254 | yes | `gold_impact_collision_dual_burst_heavy_5x5_25f_1280.png` | 0.1153 / 0.4654 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| gold | `gold_impact_comet_dive_burst_medium_5x5_25f_1280.png` | `gold_impact_comet_dive_burst_medium` | 1254x1254 | yes | `gold_impact_comet_dive_burst_medium_5x5_25f_1280.png` | 0.0827 / 0.2070 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable<br>Possible projectile/travel or pre-position sequence; manual doctrine review required | **FAIL** |
| gold | `gold_impact_explosion_core_burst_heavy_5x5_25f_1280.png` | `gold_impact_explosion_core_burst_heavy` | 1254x1254 | yes | `gold_impact_explosion_core_burst_heavy_5x5_25f_1280.png` | 0.1844 / 0.3915 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| gold | `gold_impact_explosion_fragment_burst_medium_5x5_25f_1280.png` | `gold_impact_explosion_fragment_burst_medium` | 1254x1254 | yes | `gold_impact_explosion_fragment_burst_medium_5x5_25f_1280.png` | 0.1291 / 0.2581 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| gold | `gold_impact_projectile_arrow_burst_medium_5x5_25f_1280.png` | `gold_impact_projectile_arrow_burst_medium` | 1254x1254 | yes | `gold_impact_projectile_arrow_burst_medium_5x5_25f_1280.png` | 0.1416 / 0.3754 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable<br>Possible projectile/travel or pre-position sequence; manual doctrine review required | **FAIL** |
| gold | `gold_impact_projectile_comet_burst_medium_5x5_25f_1280.png` | `gold_impact_projectile_comet_burst_medium` | 1254x1254 | yes | `gold_impact_projectile_comet_burst_medium_5x5_25f_1280.png` | 0.1437 / 0.5046 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable<br>Possible projectile/travel or pre-position sequence; manual doctrine review required | **FAIL** |
| gold | `gold_impact_projectile_lance_burst_small_5x5_25f_1280.png` | `gold_impact_projectile_lance_burst_small` | 1254x1254 | yes | `gold_impact_projectile_lance_burst_small_5x5_25f_1280.png` | 0.0570 / 0.1748 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable<br>Possible projectile/travel or pre-position sequence; manual doctrine review required | **FAIL** |
| gold | `gold_impact_projectile_pierce_burst_medium_5x5_25f_1280.png` | `gold_impact_projectile_pierce_burst_medium` | 1254x1254 | yes | `gold_impact_projectile_pierce_burst_medium_5x5_25f_1280.png` | 0.0640 / 0.2529 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable<br>Possible projectile/travel or pre-position sequence; manual doctrine review required | **FAIL** |
| gold | `slash_cross_impact_5x5_25f_1280.png` | `gold_slash_cross_impact` | 1280x1280 | yes | `slash_cross_impact_5x5_25f_1280.png` | 0.1264 / 0.4155 | none | **PASS** |
| gold | `slash_diagonal_impact_5x5_25f_1280.png` | `gold_slash_diagonal_impact` | 1254x1254 | yes | `slash_diagonal_impact_5x5_25f_1280.png` | 0.1059 / 0.3139 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| gold | `slash_mark_horizontal_5x5_25f_1280.png` | `gold_slash_mark_horizontal` | 1280x1280 | yes | `slash_mark_horizontal_5x5_25f_1280.png` | 0.0669 / 0.1884 | none | **PASS** |
| skills | `blue_skill_lightning_storm_burst_heavy_5x5_25f_1280.png` | `skills_blue_lightning_storm_burst_heavy` | 1254x1254 | yes | `blue_skill_lightning_storm_burst_heavy_5x5_25f_1280.png` | 0.0660 / 0.2135 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| skills | `blue_skill_thunder_orb_burst_heavy_5x5_25f_1280.png` | `skills_blue_thunder_orb_burst_heavy` | 1254x1254 | yes | `blue_skill_thunder_orb_burst_heavy_5x5_25f_1280.png` | 0.1345 / 0.3608 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| skills | `bluegold_skill_holy_radiance_burst_heavy_5x5_25f_1280.png` | `skills_bluegold_holy_radiance_burst_heavy` | 1280x1280 | yes | `bluegold_skill_holy_radiance_burst_heavy_5x5_25f_1280.png` | 0.0925 / 0.2790 | none | **PASS** |
| skills | `bluegold_skill_teleport_astral_beacon_heavy_5x5_25f_1280.png` | `skills_bluegold_teleport_astral_beacon_heavy` | 1280x1280 | yes | `bluegold_skill_teleport_astral_beacon_heavy_5x5_25f_1280.png` | 0.1057 / 0.2843 | Possible ground-decal or persistent-field behavior; manual doctrine review required<br>Possible projectile/travel or pre-position sequence; manual doctrine review required<br>Manual classification required | **WARN** |
| skills | `crimson_skill_blood_nova_burst_heavy_5x5_25f_1280.png` | `skills_crimson_blood_nova_burst_heavy` | 1254x1254 | yes | `crimson_skill_blood_nova_burst_heavy_5x5_25f_1280.png` | 0.1675 / 0.3579 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| skills | `cyan_skill_astral_swirl_burst_medium_5x5_25f_1280.png` | `skills_cyan_astral_swirl_burst_medium` | 1254x1254 | yes | `cyan_skill_astral_swirl_burst_medium_5x5_25f_1280.png` | 0.1025 / 0.3410 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable<br>Manual classification required | **FAIL** |
| skills | `cyan_skill_wind_crescent_vortex_medium_5x5_25f_1280.png` | `skills_cyan_wind_crescent_vortex_medium` | 1254x1254 | yes | `cyan_skill_wind_crescent_vortex_medium_5x5_25f_1280.png` | 0.0531 / 0.1228 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable<br>Manual classification required | **FAIL** |
| skills | `gold_skill_holy_radiance_burst_heavy_5x5_25f_1280.png` | `skills_gold_holy_radiance_burst_heavy` | 1254x1254 | yes | `gold_skill_holy_radiance_burst_heavy_5x5_25f_1280.png` | 0.1364 / 0.3802 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| skills | `gold_skill_solar_halo_burst_heavy_5x5_25f_1280.png` | `skills_gold_solar_halo_burst_heavy` | 1280x1280 | yes | `gold_skill_solar_halo_burst_heavy_5x5_25f_1280.png` | 0.2158 / 0.4881 | Possible ground-decal or persistent-field behavior; manual doctrine review required | **WARN** |
| skills | `gold_skill_solar_starburst_medium_5x5_25f_1280.png` | `skills_gold_solar_starburst_medium` | 1280x1280 | yes | `gold_skill_solar_starburst_medium_5x5_25f_1280.png` | 0.1966 / 0.4109 | none | **PASS** |
| skills | `gold_skill_teleport_beacon_heavy_5x5_25f_1280.png` | `skills_gold_teleport_beacon_heavy` | 1280x1280 | yes | `gold_skill_teleport_beacon_heavy_5x5_25f_1280.png` | 0.1856 / 0.3651 | Possible ground-decal or persistent-field behavior; manual doctrine review required<br>Possible projectile/travel or pre-position sequence; manual doctrine review required<br>Manual classification required<br>Possible per-frame clipping or boundary contact<br>Visible content crosses internal frame boundaries; inspect for residual grid or clipping | **WARN** |
| skills | `green_skill_barrier_guardian_aegis_heavy_5x5_25f_1280.png` | `skills_green_barrier_guardian_aegis_heavy` | 1280x1280 | yes | `green_skill_barrier_guardian_aegis_heavy_5x5_25f_1280.png` | 0.1521 / 0.4231 | Possible ground-decal or persistent-field behavior; manual doctrine review required | **WARN** |
| skills | `green_skill_poison_nova_burst_heavy_5x5_25f_1280.png` | `skills_green_poison_nova_burst_heavy` | 1254x1254 | yes | `green_skill_poison_nova_burst_heavy_5x5_25f_1280.png` | 0.1747 / 0.4320 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| skills | `iceblue_skill_arcane_seal_burst_medium_5x5_25f_1280.png` | `skills_iceblue_arcane_seal_burst_medium` | 1280x1280 | yes | `iceblue_skill_arcane_seal_burst_medium_5x5_25f_1280.png` | 0.0072 / 0.0312 | Possible ground-decal or persistent-field behavior; manual doctrine review required | **WARN** |
| skills | `iceblue_skill_frost_sigil_burst_heavy_5x5_25f_1280.png` | `skills_iceblue_frost_sigil_burst_heavy` | 1254x1254 | yes | `iceblue_skill_frost_sigil_burst_heavy_5x5_25f_1280.png` | 0.1446 / 0.4188 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable<br>Possible ground-decal or persistent-field behavior; manual doctrine review required | **FAIL** |
| skills | `iceblue_skill_holy_star_burst_medium_5x5_25f_1280.png` | `skills_iceblue_holy_star_burst_medium` | 1280x1280 | yes | `iceblue_skill_holy_star_burst_medium_5x5_25f_1280.png` | 0.0267 / 0.1516 | none | **PASS** |
| skills | `iceblue_skill_ice_shard_impact_heavy_5x5_25f_1280.png` | `skills_iceblue_ice_shard_impact_heavy` | 1254x1254 | yes | `iceblue_skill_ice_shard_impact_heavy_5x5_25f_1280.png` | 0.0846 / 0.3266 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| skills | `iceblue_skill_light_pillar_impact_heavy_5x5_25f_1280.png` | `skills_iceblue_light_pillar_impact_heavy` | 1280x1280 | yes | `iceblue_skill_light_pillar_impact_heavy_5x5_25f_1280.png` | 0.0408 / 0.1458 | Possible projectile/travel or pre-position sequence; manual doctrine review required | **WARN** |
| skills | `iceblue_skill_lightning_impact_heavy_5x5_25f_1280.png` | `skills_iceblue_lightning_impact_heavy` | 1280x1280 | yes | `iceblue_skill_lightning_impact_heavy_5x5_25f_1280.png` | 0.0442 / 0.1620 | none | **PASS** |
| skills | `iceblue_skill_pillar_crystal_spike_heavy_5x5_25f_1280.png` | `skills_iceblue_pillar_crystal_spike_heavy` | 1280x1280 | yes | `iceblue_skill_pillar_crystal_spike_heavy_5x5_25f_1280.png` | 0.1130 / 0.3333 | Possible projectile/travel or pre-position sequence; manual doctrine review required | **WARN** |
| skills | `iceblue_skill_star_flash_burst_medium_5x5_25f_1280.png` | `skills_iceblue_star_flash_burst_medium` | 1280x1280 | yes | `iceblue_skill_star_flash_burst_medium_5x5_25f_1280.png` | 0.0267 / 0.1516 | none | **PASS** |
| skills | `magenta_skill_combo_cross_slash_heavy_5x5_25f_1280.png` | `skills_magenta_combo_cross_slash_heavy` | 1280x1280 | yes | `magenta_skill_combo_cross_slash_heavy_5x5_25f_1280.png` | 0.0251 / 0.0525 | none | **PASS** |
| skills | `orange_skill_fire_comet_burst_heavy_5x5_25f_1280.png` | `skills_orange_fire_comet_burst_heavy` | 1254x1254 | yes | `orange_skill_fire_comet_burst_heavy_5x5_25f_1280.png` | 0.1871 / 0.3876 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable<br>Possible projectile/travel or pre-position sequence; manual doctrine review required | **FAIL** |
| skills | `orange_skill_meteor_flame_burst_heavy_5x5_25f_1280.png` | `skills_orange_meteor_flame_burst_heavy` | 1280x1280 | yes | `orange_skill_meteor_flame_burst_heavy_5x5_25f_1280.png` | 0.1750 / 0.4347 | none | **PASS** |
| skills | `orange_skill_spark_nova_burst_heavy_5x5_25f_1280.png` | `skills_orange_spark_nova_burst_heavy` | 1280x1280 | yes | `orange_skill_spark_nova_burst_heavy_5x5_25f_1280.png` | 0.1057 / 0.4462 | Manual classification required | **WARN** |
| skills | `purple_skill_void_implosion_burst_medium_5x5_25f_1280.png` | `skills_purple_void_implosion_burst_medium` | 1254x1254 | yes | `purple_skill_void_implosion_burst_medium_5x5_25f_1280.png` | 0.0728 / 0.2745 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| skills | `purple_skill_void_portal_implosion_heavy_5x5_25f_1280.png` | `skills_purple_void_portal_implosion_heavy` | 1254x1254 | yes | `purple_skill_void_portal_implosion_heavy_5x5_25f_1280.png` | 0.0886 / 0.2741 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable<br>Possible ground-decal or persistent-field behavior; manual doctrine review required | **FAIL** |
| skills | `purpleblack_skill_shadow_smoke_burst_heavy_5x5_25f_1280.png` | `skills_purpleblack_shadow_smoke_burst_heavy` | 1280x1280 | yes | `purpleblack_skill_shadow_smoke_burst_heavy_5x5_25f_1280.png` | 0.1843 / 0.5299 | Smoke-dominant effect; verify that the impact core remains readable | **WARN** |
| skills | `purpleblack_skill_void_portal_implosion_heavy_5x5_25f_1280.png` | `skills_purpleblack_void_portal_implosion_heavy` | 1280x1280 | yes | `purpleblack_skill_void_portal_implosion_heavy_5x5_25f_1280.png` | 0.1102 / 0.2598 | Possible ground-decal or persistent-field behavior; manual doctrine review required | **WARN** |
| skills | `purpleblack_skill_void_singularity_implosion_heavy_5x5_25f_1280.png` | `skills_purpleblack_void_singularity_implosion_heavy` | 1280x1280 | yes | `purpleblack_skill_void_singularity_implosion_heavy_5x5_25f_1280.png` | 0.0986 / 0.2321 | none | **PASS** |
| skills | `rainbow_skill_prism_nova_burst_heavy_5x5_25f_1280.png` | `skills_rainbow_prism_nova_burst_heavy` | 1280x1280 | yes | `rainbow_skill_prism_nova_burst_heavy_5x5_25f_1280.png` | 0.0714 / 0.2184 | Manual classification required | **WARN** |
| skills | `red_skill_inferno_vortex_burst_heavy_5x5_25f_1280.png` | `skills_red_inferno_vortex_burst_heavy` | 1254x1254 | yes | `red_skill_inferno_vortex_burst_heavy_5x5_25f_1280.png` | 0.1881 / 0.4580 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| skills | `sandgold_skill_holy_smoke_flare_heavy_5x5_25f_1280.png` | `skills_sandgold_holy_smoke_flare_heavy` | 1280x1280 | yes | `sandgold_skill_holy_smoke_flare_heavy_5x5_25f_1280.png` | 0.0702 / 0.2480 | Smoke-dominant effect; verify that the impact core remains readable | **WARN** |
| skills | `vfx_impact_shadow_bite_slash_basic_spritesheet.png` | `skills_shadow_bite_slash_basic` | 1254x1254 | yes | `vfx_impact_shadow_bite_slash_basic_spritesheet.png` | 0.0745 / 0.1688 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| skills | `vfx_impact_toxic_bite_burst_basic_spritesheet.png` | `skills_toxic_bite_burst_basic` | 1254x1254 | yes | `vfx_impact_toxic_bite_burst_basic_spritesheet.png` | 0.0827 / 0.2280 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable | **FAIL** |
| skills | `violet_skill_arcane_nova_burst_heavy_5x5_25f_1280.png` | `skills_violet_arcane_nova_burst_heavy` | 1280x1280 | yes | `violet_skill_arcane_nova_burst_heavy_5x5_25f_1280.png` | 0.0674 / 0.1871 | Manual classification required | **WARN** |
| skills | `violet_skill_arcane_stellar_burst_medium_5x5_25f_1280.png` | `skills_violet_arcane_stellar_burst_medium` | 1254x1254 | yes | `violet_skill_arcane_stellar_burst_medium_5x5_25f_1280.png` | 0.0119 / 0.0536 | Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable<br>Manual classification required | **FAIL** |
| skills | `violet_skill_singularity_supernova_heavy_5x5_25f_1280.png` | `skills_violet_singularity_supernova_heavy` | 1280x1280 | yes | `violet_skill_singularity_supernova_heavy_5x5_25f_1280.png` | 0.1121 / 0.3226 | none | **PASS** |
| skills | `violet_skill_teleport_arcane_gate_medium_5x5_25f_1280.png` | `skills_violet_teleport_arcane_gate_medium` | 1280x1280 | yes | `violet_skill_teleport_arcane_gate_medium_5x5_25f_1280.png` | 0.0453 / 0.1373 | Possible projectile/travel or pre-position sequence; manual doctrine review required<br>Manual classification required | **WARN** |
| skills | `whitegreen_skill_floral_bloom_burst_heavy_5x5_25f_1280.png` | `skills_whitegreen_floral_bloom_burst_heavy` | 1280x1280 | yes | `whitegreen_skill_floral_bloom_burst_heavy_5x5_25f_1280.png` | 0.1182 / 0.4251 | none | **PASS** |
| skills | `whitegreen_skill_guardian_aegis_barrier_heavy_5x5_25f_1280.png` | `skills_whitegreen_guardian_aegis_barrier_heavy` | 1280x1280 | yes | `whitegreen_skill_guardian_aegis_barrier_heavy_5x5_25f_1280.png` | 0.1069 / 0.5734 | Possible ground-decal or persistent-field behavior; manual doctrine review required | **WARN** |
| skills | `whitegreen_skill_healing_cross_burst_heavy_5x5_25f_1280.png` | `skills_whitegreen_healing_cross_burst_heavy` | 1280x1280 | yes | `whitegreen_skill_healing_cross_burst_heavy_5x5_25f_1280.png` | 0.1429 / 0.4958 | none | **PASS** |
| skills | `whitegreen_skill_healing_orbit_burst_heavy_5x5_25f_1280.png` | `skills_whitegreen_healing_orbit_burst_heavy` | 1280x1280 | yes | `whitegreen_skill_healing_orbit_burst_heavy_5x5_25f_1280.png` | 0.1246 / 0.4099 | Possible ground-decal or persistent-field behavior; manual doctrine review required | **WARN** |
| skills | `whitegreen_skill_restoration_sigil_burst_heavy_5x5_25f_1280.png` | `skills_whitegreen_restoration_sigil_burst_heavy` | 1280x1280 | yes | `whitegreen_skill_restoration_sigil_burst_heavy_5x5_25f_1280.png` | 0.1174 / 0.3331 | Possible ground-decal or persistent-field behavior; manual doctrine review required | **WARN** |
| skills | `whitegreen_skill_support_seal_burst_heavy_5x5_25f_1280.png` | `skills_whitegreen_support_seal_burst_heavy` | 1280x1280 | yes | `whitegreen_skill_support_seal_burst_heavy_5x5_25f_1280.png` | 0.1148 / 0.3485 | Possible ground-decal or persistent-field behavior; manual doctrine review required | **WARN** |
| skills | `whitegreen_skill_support_starburst_medium_5x5_25f_1280.png` | `skills_whitegreen_support_starburst_medium` | 1280x1280 | yes | `whitegreen_skill_support_starburst_medium_5x5_25f_1280.png` | 0.0663 / 0.2845 | none | **PASS** |

## 6. Failed Files

- `white/vfx_impact_piercing_bolt_flash_basic_spritesheet.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `white/vfx_impact_piercing_spike_barrage_basic_spritesheet.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `white/vfx_impact_white_bite_crescent_basic_spritesheet.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `white/vfx_impact_white_charge_slam_basic_spritesheet.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `white/vfx_impact_white_dash_strike_basic_spritesheet.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable; Possible projectile/travel or pre-position sequence; manual doctrine review required
- `white/vfx_impact_white_slash_burst_basic_spritesheet.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `gold/gold_effect_comet_arc_burst_medium_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable; Possible projectile/travel or pre-position sequence; manual doctrine review required
- `gold/gold_effect_holy_sigil_burst_medium_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable; Possible ground-decal or persistent-field behavior; manual doctrine review required
- `gold/gold_effect_projectile_barrier_break_heavy_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable; Possible ground-decal or persistent-field behavior; manual doctrine review required; Possible projectile/travel or pre-position sequence; manual doctrine review required
- `gold/gold_effect_radiance_starburst_medium_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `gold/gold_effect_radiance_sunburst_medium_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `gold/gold_impact_beast_bite_medium_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `gold/gold_impact_blade_crescent_slash_heavy_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `gold/gold_impact_blade_crescent_spiral_medium_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `gold/gold_impact_blade_cross_slash_medium_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `gold/gold_impact_blade_slash_arc_small_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `gold/gold_impact_claw_rake_medium_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `gold/gold_impact_collision_dual_burst_heavy_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `gold/gold_impact_comet_dive_burst_medium_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable; Possible projectile/travel or pre-position sequence; manual doctrine review required
- `gold/gold_impact_explosion_core_burst_heavy_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `gold/gold_impact_explosion_fragment_burst_medium_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `gold/gold_impact_projectile_arrow_burst_medium_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable; Possible projectile/travel or pre-position sequence; manual doctrine review required
- `gold/gold_impact_projectile_comet_burst_medium_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable; Possible projectile/travel or pre-position sequence; manual doctrine review required
- `gold/gold_impact_projectile_lance_burst_small_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable; Possible projectile/travel or pre-position sequence; manual doctrine review required
- `gold/gold_impact_projectile_pierce_burst_medium_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable; Possible projectile/travel or pre-position sequence; manual doctrine review required
- `gold/slash_diagonal_impact_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `skills/blue_skill_lightning_storm_burst_heavy_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `skills/blue_skill_thunder_orb_burst_heavy_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `skills/crimson_skill_blood_nova_burst_heavy_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `skills/cyan_skill_astral_swirl_burst_medium_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable; Manual classification required
- `skills/cyan_skill_wind_crescent_vortex_medium_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable; Manual classification required
- `skills/gold_skill_holy_radiance_burst_heavy_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `skills/green_skill_poison_nova_burst_heavy_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `skills/iceblue_skill_frost_sigil_burst_heavy_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable; Possible ground-decal or persistent-field behavior; manual doctrine review required
- `skills/iceblue_skill_ice_shard_impact_heavy_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `skills/orange_skill_fire_comet_burst_heavy_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable; Possible projectile/travel or pre-position sequence; manual doctrine review required
- `skills/purple_skill_void_implosion_burst_medium_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `skills/purple_skill_void_portal_implosion_heavy_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable; Possible ground-decal or persistent-field behavior; manual doctrine review required
- `skills/red_skill_inferno_vortex_burst_heavy_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `skills/vfx_impact_shadow_bite_slash_basic_spritesheet.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `skills/vfx_impact_toxic_bite_burst_basic_spritesheet.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable
- `skills/violet_skill_arcane_stellar_burst_medium_5x5_25f_1280.png`: Invalid dimensions 1254x1254 (expected 1280x1280); not runtime-promotable; Manual classification required

## 7. Warning Files

- `white/03_white_pierce_stab_impact_5x5_25f_1280.png`: 10 frames are effectively empty; Very low average frame occupancy; effect may be too small
- `white/04_white_arrow_hit_impact_5x5_25f_1280.png`: Very low average frame occupancy; effect may be too small
- `white/06_white_projectile_volley_impact_v01_spritesheet_1280x1280_5x5_25f.png`: Possible projectile/travel or pre-position sequence; manual doctrine review required
- `white/09_white_horn_ram_impact_5x5_25f_1280.png`: 10 frames are effectively empty
- `white/16_white_charge_dash_impact_5x5_25f_1280.png`: Possible projectile/travel or pre-position sequence; manual doctrine review required
- `skills/bluegold_skill_teleport_astral_beacon_heavy_5x5_25f_1280.png`: Possible ground-decal or persistent-field behavior; manual doctrine review required; Possible projectile/travel or pre-position sequence; manual doctrine review required; Manual classification required
- `skills/gold_skill_solar_halo_burst_heavy_5x5_25f_1280.png`: Possible ground-decal or persistent-field behavior; manual doctrine review required
- `skills/gold_skill_teleport_beacon_heavy_5x5_25f_1280.png`: Possible ground-decal or persistent-field behavior; manual doctrine review required; Possible projectile/travel or pre-position sequence; manual doctrine review required; Manual classification required; Possible per-frame clipping or boundary contact; Visible content crosses internal frame boundaries; inspect for residual grid or clipping
- `skills/green_skill_barrier_guardian_aegis_heavy_5x5_25f_1280.png`: Possible ground-decal or persistent-field behavior; manual doctrine review required
- `skills/iceblue_skill_arcane_seal_burst_medium_5x5_25f_1280.png`: Possible ground-decal or persistent-field behavior; manual doctrine review required
- `skills/iceblue_skill_light_pillar_impact_heavy_5x5_25f_1280.png`: Possible projectile/travel or pre-position sequence; manual doctrine review required
- `skills/iceblue_skill_pillar_crystal_spike_heavy_5x5_25f_1280.png`: Possible projectile/travel or pre-position sequence; manual doctrine review required
- `skills/orange_skill_spark_nova_burst_heavy_5x5_25f_1280.png`: Manual classification required
- `skills/purpleblack_skill_shadow_smoke_burst_heavy_5x5_25f_1280.png`: Smoke-dominant effect; verify that the impact core remains readable
- `skills/purpleblack_skill_void_portal_implosion_heavy_5x5_25f_1280.png`: Possible ground-decal or persistent-field behavior; manual doctrine review required
- `skills/rainbow_skill_prism_nova_burst_heavy_5x5_25f_1280.png`: Manual classification required
- `skills/sandgold_skill_holy_smoke_flare_heavy_5x5_25f_1280.png`: Smoke-dominant effect; verify that the impact core remains readable
- `skills/violet_skill_arcane_nova_burst_heavy_5x5_25f_1280.png`: Manual classification required
- `skills/violet_skill_teleport_arcane_gate_medium_5x5_25f_1280.png`: Possible projectile/travel or pre-position sequence; manual doctrine review required; Manual classification required
- `skills/whitegreen_skill_guardian_aegis_barrier_heavy_5x5_25f_1280.png`: Possible ground-decal or persistent-field behavior; manual doctrine review required
- `skills/whitegreen_skill_healing_orbit_burst_heavy_5x5_25f_1280.png`: Possible ground-decal or persistent-field behavior; manual doctrine review required
- `skills/whitegreen_skill_restoration_sigil_burst_heavy_5x5_25f_1280.png`: Possible ground-decal or persistent-field behavior; manual doctrine review required
- `skills/whitegreen_skill_support_seal_burst_heavy_5x5_25f_1280.png`: Possible ground-decal or persistent-field behavior; manual doctrine review required

## 8. Classification Draft Summary

- Classified entries: **90**
- Role counts: `arrow_hit` 2, `bite` 3, `boss_burst` 1, `charge` 4, `claw` 2, `elite_hit` 8, `empowered_weapon` 7, `finisher_gold` 3, `fire_burst` 3, `heal_burst` 4, `holy_hit` 3, `horn_ram` 1, `ice_shatter` 8, `lightning_burst` 2, `pierce` 5, `poison_burst` 2, `shadow_implosion` 7, `shield_break` 1, `slash_heavy` 1, `slash_small` 2, `smash` 1, `support_aura` 4, `tail_whip` 1, `ultimate_core` 6, `unknown` 9
- Unknown/manual-review roles: **9**
- White sheets default to `primaryImpact`; gold sheets to `secondaryBurst`/`finisherAccent`; skills use status, support, afterburst or boss-signature roles when the filename is explicit.

## 9. Preset Combination Opportunities

These are planning notes only; no preset or runtime wiring was changed.

| Preset | SpriteSheet chain | Timing idea | Likely use | Risk | Notes |
|---|---|---|---|---|---|
| `basic_sword_hit` | `white_slash_small_impact` | Immediate compact impact | Basic sword attack | low | Concept only; runtime wiring is outside this validation pass. |
| `heavy_sword_hit` | `white_slash_heavy_impact` | Single stronger impact | Heavy weapon attack | low | Concept only; runtime wiring is outside this validation pass. |
| `spear_thrust` | `white_pierce_stab_impact` | Directional pierce at contact | Spear/thrust attack | low | Concept only; runtime wiring is outside this validation pass. |
| `monster_claw` | `white_claw_impact` | Short claw impact | Basic beast attack | low | Concept only; runtime wiring is outside this validation pass. |
| `monster_bite` | `white_bite_impact_variant_b` | Short bite impact | Basic beast attack | low | Concept only; runtime wiring is outside this validation pass. |
| `charge_attack` | `white_charge_body_impact` | Contact burst only | Charge collision | medium | Concept only; runtime wiring is outside this validation pass. |
| `heroic_slash` | `white_slash_heavy_impact` → `gold_slash_cross_impact` | Primary hit then 80-120 ms gold accent | Enhanced weapon skill | medium | Concept only; runtime wiring is outside this validation pass. |
| `venom_blade` | `white_slash_small_impact` | Physical hit then poison burst | Poison weapon skill | medium | Missing a validated PASS/WARN candidate; do not implement yet. |
| `frost_pierce` | `white_pierce_stab_impact` → `skills_iceblue_arcane_seal_burst_medium` | Pierce then ice shatter | Frost weapon skill | medium | Concept only; runtime wiring is outside this validation pass. |
| `shadow_cut` | `white_slash_heavy_impact` → `skills_purpleblack_shadow_smoke_burst_heavy` | Heavy slash then void collapse | Shadow finisher | medium | Concept only; runtime wiring is outside this validation pass. |
| `thunder_strike` | `white_slash_small_impact` | Physical hit then lightning burst | Lightning weapon skill | medium | Missing a validated PASS/WARN candidate; do not implement yet. |
| `heal` | `skills_whitegreen_floral_bloom_burst_heavy` | Centered support burst | Healing skill | low | Concept only; runtime wiring is outside this validation pass. |
| `judgement_ultimate` | `skills_bluegold_holy_radiance_burst_heavy` | Holy accent then ultimate core | Judgement ultimate | high | Missing a validated PASS/WARN candidate; do not implement yet. |
| `meteor_burst` | `skills_bluegold_holy_radiance_burst_heavy` | Meteor impact then short afterburst | Ultimate/boss impact | high | Missing a validated PASS/WARN candidate; do not implement yet. |

## 10. Files Created

- 90 cleaned PNG sheets under `public/assets/vfx/validation/new-batch-cleaned/{white,gold,skills}/`.
- `public/assets/vfx/validation/new-batch-cleaned/manifest.draft.json`.
- `public/assets/vfx/validation/new-batch-cleaned/classification.draft.json`.
- `public/assets/vfx/validation/new-batch-cleaned/processing_summary.json`.
- `docs/reports/vfx-r2c-sol-cleaning-audit.md`.
- A temporary pass-specific helper was used and removed; no processor remains in the repository.

## 11. Runtime Safety

- `public/assets/vfx/runtime/manifest.json` was not modified.
- Runtime VFX PNGs were not modified.
- `VfxPresets.ts` was not modified.
- `VfxActionRegistry.ts` was not modified.
- `VfxSpriteSheets.ts` was not modified.
- Gameplay, combat, skills and TypeScript runtime files were not modified.

## 12. Validation

- Processing: temporary Pillow 12.2.0 + NumPy 2.3.5 helper, scoped to this pass.
- `git diff --check`: PASS (no whitespace errors).
- `git status --short`: only the pre-existing untracked `.devin/` folder and this audit report are visible; validation PNG/JSON outputs are intentionally ignored by the repository rules.
- `npm test` / build: not required because no TypeScript, runtime or gameplay file was touched.

## 13. Recommended Next Step

**B. Manual review required before promotion.**

Blocking items: 42 sheets have invalid 1254x1254 dimensions and cannot be promoted without a separately approved normalization or regeneration pass. The 23 WARN sheets require doctrine/visual review for travel, decal, smoke, clipping, occupancy or classification risks.

After manual selection, proceed to **VFX-R2D-SOL — Visual Review + Runtime Promotion Plan** for PASS candidates and individually approved WARN candidates.

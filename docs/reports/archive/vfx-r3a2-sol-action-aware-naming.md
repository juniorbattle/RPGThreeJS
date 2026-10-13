# VFX-R3A.2-SOL Action-Aware VFX Naming Audit

## 1. Summary

- Basics PNG: **20**
- Skills PNG: **43**
- Total raw VFX: **63**
- Combat actions/skills inspected: **94** (12 basic weapon archetypes, 71 skills, 8 consumables, 3 feedback actions)
- Weapon/action families found: greatsword, holy mace, scythe, spear, grimoire, crosier, rapier, wand, bow, shuriken, dagger, hand cannon; physical, magic, support, heal, status, enemy, boss and ultimate actions
- Naming: **0 valid / 6 warn / 57 invalid**
- Technical: **63 PASS / 0 WARN / 0 FAIL**
- Rename recommended: **63**
- Proposed collisions: **0**
- Runtime untouched: **yes**

## 2. Combat Action / Skill Inventory

The repository exposes 12 weapon types for basic attacks. Their runtime action is dynamic (`attack`) and Élan changes its cost from 1 to 3 AP, so this audit models one visual need per weapon without changing that mechanic.

The 71 skill definitions comprise 48 hero skills, 13 boss skills and 10 enemy skills. The inspected families cover weapon impacts, movement, teleport, line/cone/AoE attacks, elemental magic, healing, barrier/support, statuses, ultimates and boss signatures. Eight catalog/runtime consumables and three VFX feedback actions are also represented. Missing owner or semantic data is marked as unknown rather than invented.

## 3. VFX Demand Matrix Summary

Required basic families are slash, pierce, arrow, blunt/smash and magical focus impacts, plus future neutral monster claw/bite/charge/horn/tail impacts. Required skill families are fire, ice, lightning, poison, shadow, void, holy, heal, barrier, support, teleport, meteor, solar, boss and ultimate.

Missing or weakly covered families:

- true spear/pierce impact;
- clearly readable mace/blunt impact;
- neutral monster claw, bite, charge, horn and tail basics;
- dedicated root/vines;
- neutral smoke/control.

Overrepresented families are white/gold magic circles, vortex/nova bursts and nature/barrier variants. They are useful compositing accents but should not replace weapon-specific reads.

## 4. Naming Convention

`[color]_[lotType]_[vfxFamily]_[actionOrEffect]_[intensity]_5x5_25f_1280.png`

- `lotType` is exactly `basic` or `skill`, matching the folder.
- Intensity is exactly `small`, `medium`, `heavy` or `ultimate`.
- Names describe reusable visual semantics, not a hero or skill name unless the sheet is truly signature.

## 5. Per-File Naming Audit

| Folder | Current file | Parsed fields | Proposed file | Linked action needs | Name status | Technical | Rename | Safety | Notes |
|---|---|---|---|---|---|---|---|---|---|
| basics | `white_advanced_arc_comet_burst_heavy_5x5_25f_1280.png` | white/advanced/arc/comet_burst/heavy | `white_basic_arrow_comet_burst_heavy_5x5_25f_1280.png` | basic_attack_shuriken | INVALID_NAME | PASS | yes | manual_review | Source inspection: 1280x1280, RGBA, 2213267 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| basics | `white_advanced_beam_holy_ring_heavy_5x5_25f_1280.png` | white/advanced/beam/holy_ring/heavy | `white_basic_magic_holy_ring_beam_heavy_5x5_25f_1280.png` | none yet | INVALID_NAME | PASS | yes | manual_review | Source inspection: 1280x1280, RGBA, 2156998 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| basics | `white_advanced_beam_shockwave_burst_heavy_5x5_25f_1280.png` | white/advanced/beam/shockwave_burst/heavy | `white_basic_smash_shockwave_burst_heavy_5x5_25f_1280.png` | p_interpose, l_griffon_jump, a_hawk_leap, ro_tumble, boss_slam, boss_quake, boss_titan_slam | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1802849 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| basics | `white_advanced_comet_burst_heavy_5x5_25f_1280.png` | white/advanced/comet/burst/heavy | `white_basic_smash_comet_burst_heavy_5x5_25f_1280.png` | none yet | INVALID_NAME | PASS | yes | manual_review | Source inspection: 1280x1280, RGBA, 2213826 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| basics | `white_advanced_crescent_impact_burst_heavy_5x5_25f_1280.png` | white/advanced/crescent/impact_burst/heavy | `white_basic_smash_crescent_impact_heavy_5x5_25f_1280.png` | ro_fault_breaker | INVALID_NAME | PASS | yes | manual_review | Source inspection: 1280x1280, RGBA, 1756180 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| basics | `white_advanced_crescent_implosion_burst_heavy_5x5_25f_1280.png` | white/advanced/crescent/implosion_burst/heavy | `white_basic_magic_crescent_implosion_heavy_5x5_25f_1280.png` | none yet | INVALID_NAME | PASS | yes | manual_review | Source inspection: 1280x1280, RGBA, 2026377 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| basics | `white_advanced_crescent_slash_burst_heavy_5x5_25f_1280.png` | white/advanced/crescent/slash_burst/heavy | `white_basic_slash_crescent_impact_heavy_5x5_25f_1280.png` | basic_attack_scythe | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1672510 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| basics | `white_advanced_crescent_slash_burst_mid_5x5_25f_1280.png` | white/advanced/crescent/slash_burst/mid | `white_basic_slash_crescent_impact_medium_5x5_25f_1280.png` | none yet | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1897831 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| basics | `white_advanced_holy_cross_burst_heavy_5x5_25f_1280.png` | white/advanced/holy/cross_burst/heavy | `white_basic_magic_holy_cross_burst_heavy_5x5_25f_1280.png` | none yet | INVALID_NAME | PASS | yes | manual_review | Source inspection: 1280x1280, RGBA, 1802118 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| basics | `white_advanced_holy_ring_burst_heavy_5x5_25f_1280.png` | white/advanced/holy/ring_burst/heavy | `white_basic_magic_holy_ring_burst_heavy_5x5_25f_1280.png` | basic_attack_grimoire | INVALID_NAME | PASS | yes | manual_review | Source inspection: 1280x1280, RGBA, 1050794 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| basics | `white_advanced_holy_sigil_burst_heavy_5x5_25f_1280.png` | white/advanced/holy/sigil_burst/heavy | `white_basic_magic_holy_sigil_burst_heavy_5x5_25f_1280.png` | none yet | INVALID_NAME | PASS | yes | manual_review | Source inspection: 1280x1280, RGBA, 2155172 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| basics | `white_advanced_holy_sigil_burst_mid_5x5_25f_1280.png` | white/advanced/holy/sigil_burst/mid | `white_basic_magic_holy_sigil_burst_medium_5x5_25f_1280.png` | basic_attack_crosier, basic_attack_wand | INVALID_NAME | PASS | yes | manual_review | Source inspection: 1280x1280, RGBA, 2089944 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| basics | `white_advanced_projectile_nova_impact_heavy_5x5_25f_1280.png` | white/advanced/projectile/nova_impact/heavy | `white_basic_arrow_nova_impact_heavy_5x5_25f_1280.png` | basic_attack_hand_cannon, a_arrow_rain, a_zenith_arrow, ar_artillery_barrage | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1998147 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| basics | `white_advanced_slash_triple_burst_heavy_5x5_25f_1280.png` | white/advanced/slash/triple_burst/heavy | `white_basic_slash_triple_impact_heavy_5x5_25f_1280.png` | basic_attack_greatsword, w_lion_surge, boss_execution | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1178098 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| basics | `white_basic_comet_impact_burst_mid_5x5_25f_1280.png` | white/basic/comet/impact_burst/mid | `white_basic_smash_comet_impact_medium_5x5_25f_1280.png` | basic_attack_holy_mace, w_charge, enemy_heavy_strike, enemy_crush, generic_hit | WARN_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1611961 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| basics | `white_basic_impact_cross_burst_heavy_5x5_25f_1280.png` | white/basic/impact/cross_burst/heavy | `white_basic_slash_cross_impact_heavy_5x5_25f_1280.png` | basic_attack_rapier, p_holy_strike | WARN_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1833149 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| basics | `white_basic_impact_horizontal_flash_mid_5x5_25f_1280.png` | white/basic/impact/horizontal_flash/mid | `white_basic_slash_horizontal_flash_medium_5x5_25f_1280.png` | basic_attack_long_spear, l_long_thrust, l_haft_recoil, l_firmament_lance | WARN_NAME | PASS | yes | manual_review | Source inspection: 1280x1280, RGBA, 1543288 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| basics | `white_basic_impact_star_burst_heavy_5x5_25f_1280.png` | white/basic/impact/star_burst/heavy | `white_basic_crit_star_burst_heavy_5x5_25f_1280.png` | ni_shadow_step, item_grenade_aveuglante, critical_hit | WARN_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 2127746 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| basics | `white_basic_projectile_arc_burst_heavy_5x5_25f_1280.png` | white/basic/projectile/arc_burst/heavy | `white_basic_arrow_arc_burst_heavy_5x5_25f_1280.png` | basic_attack_longbow, a_precise_shot, a_arrow_rain, ar_calibrated_shot, boss_pin | WARN_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1006317 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| basics | `white_basic_slash_diagonal_cut_mid_5x5_25f_1280.png` | white/basic/slash/diagonal_cut/mid | `white_basic_slash_diagonal_cut_medium_5x5_25f_1280.png` | basic_attack_dagger, w_break_guard, w_whirl, d_cursed_blade, r_arcane_blade, ni_venom_blade, ni_silent_assassin, ro_sneak_attack, boss_flurry | WARN_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 2361936 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `blue_basic_starburst_impact_small_5x5_25f_1280.png` | blue/basic/starburst/impact/small | `blue_skill_arcane_starburst_small_5x5_25f_1280.png` | kill_spark | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 957354 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `blue_magic_arcanesigil_burst_mid_5x5_25f_1280.png` | blue/magic/arcanesigil/burst/mid | `blue_skill_arcane_sigil_burst_medium_5x5_25f_1280.png` | e_vigor_rune, item_ether | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1499627 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `blue_magic_lightningburst_impact_mid_5x5_25f_1280.png` | blue/magic/lightningburst/impact/mid | `blue_skill_lightning_burst_impact_medium_5x5_25f_1280.png` | n_dark_bolt, enemy_dark_bolt | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1542283 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `blue_magic_lightningpillar_impact_mid_5x5_25f_1280.png` | blue/magic/lightningpillar/impact/mid | `blue_skill_lightning_pillar_impact_medium_5x5_25f_1280.png` | n_dark_bolt, enemy_dark_bolt | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1356341 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `blue_support_barrier_guard_heavy_5x5_25f_1280.png` | blue/support/barrier/guard/heavy | `blue_skill_barrier_guard_heavy_5x5_25f_1280.png` | p_oathwall, boss_guard | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 2002939 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `bluegold_ultimate_arcanebeam_large_5x5_25f_1280.png` | bluegold/ultimate/arcanebeam/unknown/large | `bluegold_skill_ultimate_arcane_beam_ultimate_5x5_25f_1280.png` | p_radiant_judgement, l_firmament_lance, a_zenith_arrow | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 2085758 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `bluegold_ultimate_arcaneinvocation_large_5x5_25f_1280.png` | bluegold/ultimate/arcaneinvocation/unknown/large | `bluegold_skill_ultimate_arcane_invocation_ultimate_5x5_25f_1280.png` | w_miracle, e_absolute_harmony, item_revive_vial | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 2030468 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `cyan_magic_arcaneorbit_burst_mid_5x5_25f_1280.png` | cyan/magic/arcaneorbit/burst/mid | `cyan_skill_arcane_orbit_burst_medium_5x5_25f_1280.png` | none yet | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1458767 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `gold_advanced_holy_burst_heavy_5x5_25f_1280.png` | gold/advanced/holy/burst/heavy | `gold_skill_holy_radiance_burst_heavy_5x5_25f_1280.png` | p_holy_strike, p_radiant_judgement, w_purify, w_sanctuary, item_antidote | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1621036 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `gold_advanced_vortex_nova_heavy_5x5_25f_1280.png` | gold/advanced/vortex/nova/heavy | `gold_skill_holy_vortex_nova_heavy_5x5_25f_1280.png` | r_perfect_duality, boss_roar, enemy_taunt, enemy_battle_cry | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 2382845 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `gold_magic_arcanering_fade_mid_5x5_25f_1280.png` | gold/magic/arcanering/fade/mid | `gold_skill_arcane_ring_fade_medium_5x5_25f_1280.png` | none yet | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1332016 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `gold_magic_holysigil_burst_mid_5x5_25f_1280.png` | gold/magic/holysigil/burst/mid | `gold_skill_holy_sigil_burst_medium_5x5_25f_1280.png` | d_blood_pact, boss_fortify | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1727308 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `green_advanced_ice_starburst_impact_mid_5x5_25f_1280.png` | green/advanced/ice/starburst_impact/mid | `green_skill_ice_starburst_impact_medium_5x5_25f_1280.png` | none yet | INVALID_NAME | PASS | yes | manual_review | Source inspection: 1280x1280, RGBA, 1315446 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `green_magic_poisonburst_impact_mid_5x5_25f_1280.png` | green/magic/poisonburst/impact/mid | `green_skill_poison_nova_burst_medium_5x5_25f_1280.png` | none yet | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1941891 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `green_monster_poison_maw_bite_large_5x5_25f_1280.png` | green/monster/poison/maw_bite/large | `green_skill_poison_maw_bite_heavy_5x5_25f_1280.png` | enemy_venom_strike, enemy_dragon_breath | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 2037518 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `green_support_heal_blessing_heavy_5x5_25f_1280.png` | green/support/heal/blessing/heavy | `whitegreen_skill_heal_blessing_bloom_heavy_5x5_25f_1280.png` | w_salvation, w_miracle, item_potion, item_revive_vial | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1993345 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `green_support_nature_guard_burst_mid_5x5_25f_1280.png` | green/support/nature/guard_burst/mid | `green_skill_barrier_nature_guard_medium_5x5_25f_1280.png` | none yet | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1241842 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `green_support_nature_leaf_burst_mid_5x5_25f_1280.png` | green/support/nature/leaf_burst/mid | `green_skill_support_leaf_burst_medium_5x5_25f_1280.png` | boss_regen | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1368556 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `green_support_nature_orb_barrier_mid_5x5_25f_1280.png` | green/support/nature/orb_barrier/mid | `green_skill_barrier_orb_burst_medium_5x5_25f_1280.png` | none yet | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1147543 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `green_support_nature_rune_guard_mid_5x5_25f_1280.png` | green/support/nature/rune_guard/mid | `green_skill_barrier_rune_guard_medium_5x5_25f_1280.png` | e_binding_seal, ro_jaw_trap, enemy_binding_shot, item_grenade_entravante | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1417415 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `green_support_nature_shield_barrier_mid_5x5_25f_1280.png` | green/support/nature/shield_barrier/mid | `green_skill_barrier_shield_burst_medium_5x5_25f_1280.png` | none yet | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1262772 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `green_support_nature_shield_ring_mid_5x5_25f_1280.png` | green/support/nature/shield_ring/mid | `green_skill_barrier_shield_ring_medium_5x5_25f_1280.png` | e_absolute_harmony | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1696384 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `iceblue_magic_icepillar_impact_large_5x5_25f_1280.png` | iceblue/magic/icepillar/impact/large | `iceblue_skill_ice_pillar_impact_heavy_5x5_25f_1280.png` | boss_freeze | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1313588 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `iceblue_magic_iceshard_impact_mid_5x5_25f_1280.png` | iceblue/magic/iceshard/impact/mid | `iceblue_skill_ice_shatter_burst_medium_5x5_25f_1280.png` | none yet | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1332255 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `iceblue_magic_icesigil_burst_mid_5x5_25f_1280.png` | iceblue/magic/icesigil/burst/mid | `iceblue_skill_ice_sigil_burst_medium_5x5_25f_1280.png` | boss_freeze | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1784500 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `iceblue_magic_lightpillar_impact_mid_5x5_25f_1280.png` | iceblue/magic/lightpillar/impact/mid | `iceblue_skill_holy_light_pillar_medium_5x5_25f_1280.png` | none yet | INVALID_NAME | PASS | yes | manual_review | Source inspection: 1280x1280, RGBA, 819247 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `magenta_basic_slashburst_impact_mid_5x5_25f_1280.png` | magenta/basic/slashburst/impact/mid | `purple_skill_arcane_slash_burst_medium_5x5_25f_1280.png` | ni_silent_assassin, boss_execution | INVALID_NAME | PASS | yes | manual_review | Source inspection: 1280x1280, RGBA, 2221012 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `orange_advanced_slash_combo_heavy_5x5_25f_1280.png` | orange/advanced/slash/combo/heavy | `orange_skill_fire_slash_combo_heavy_5x5_25f_1280.png` | boss_flurry | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1370292 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `orange_advanced_smoke_explosion_heavy_5x5_25f_1280.png` | orange/advanced/smoke/explosion/heavy | `orange_skill_fire_smoke_explosion_heavy_5x5_25f_1280.png` | ni_smoke_bomb, enemy_smoke_veil | INVALID_NAME | PASS | yes | manual_review | Source inspection: 1280x1280, RGBA, 2293161 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `orange_advanced_vortex_nova_heavy_5x5_25f_1280.png` | orange/advanced/vortex/nova/heavy | `orange_skill_fire_vortex_nova_heavy_5x5_25f_1280.png` | n_flame_wave, r_scarlet_circle, ar_explosive_retreat, ar_incendiary_grenade, boss_apocalypse, boss_inferno, enemy_dragon_breath, item_grenade_incendiaire | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1841264 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `orange_magic_fireimpact_burst_mid_5x5_25f_1280.png` | orange/magic/fireimpact/burst/mid | `orange_skill_fire_impact_burst_medium_5x5_25f_1280.png` | n_flame_wave, r_scarlet_circle, ar_explosive_retreat, ar_incendiary_grenade, ar_artillery_barrage, item_bomb, item_grenade_incendiaire | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1992932 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `orange_magic_sparkcluster_burst_mid_5x5_25f_1280.png` | orange/magic/sparkcluster/burst/mid | `orange_skill_fire_spark_cluster_medium_5x5_25f_1280.png` | ar_artillery_barrage | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1348571 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `orange_red_impact_energy_spiral_burst_medium_5x5_25f_1280.png` | orange/red/impact/energy_spiral_burst/medium | `orange_skill_fire_energy_spiral_medium_5x5_25f_1280.png` | r_perfect_duality, ro_fault_breaker, boss_quake, boss_titan_slam | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1312929 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `orange_ultimate_holy_solar_ring_burst_large_5x5_25f_1280.png` | orange/ultimate/holy/solar_ring_burst/large | `orange_skill_solar_halo_burst_ultimate_5x5_25f_1280.png` | w_lion_surge | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1980142 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `orange_ultimate_meteor_impact_heavy_5x5_25f_1280.png` | orange/ultimate/meteor/impact/heavy | `orange_skill_meteor_impact_burst_heavy_5x5_25f_1280.png` | n_dark_meteor, boss_inferno | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 2239710 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `palecyan_basic_slashswirl_impact_mid_5x5_25f_1280.png` | palecyan/basic/slashswirl/impact/mid | `cyan_skill_wind_slash_swirl_medium_5x5_25f_1280.png` | none yet | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1237661 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `pink_advanced_vortex_nova_heavy_5x5_25f_1280.png` | pink/advanced/vortex/nova/heavy | `purple_skill_arcane_vortex_nova_heavy_5x5_25f_1280.png` | none yet | INVALID_NAME | PASS | yes | manual_review | Source inspection: 1280x1280, RGBA, 2533095 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `purple_advanced_void_rune_orb_burst_mid_5x5_25f_1280.png` | purple/advanced/void/rune_orb_burst/mid | `purple_skill_void_rune_orb_medium_5x5_25f_1280.png` | enemy_hex | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1296292 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `purple_advanced_void_spiral_implosion_mid_5x5_25f_1280.png` | purple/advanced/void/spiral_implosion/mid | `purple_skill_void_spiral_implosion_medium_5x5_25f_1280.png` | ni_silent_assassin | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 2034861 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `purple_magic_arcaneburst_impact_mid_5x5_25f_1280.png` | purple/magic/arcaneburst/impact/mid | `purple_skill_arcane_impact_burst_medium_5x5_25f_1280.png` | none yet | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1349106 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `purple_monster_shadow_maw_bite_large_5x5_25f_1280.png` | purple/monster/shadow/maw_bite/large | `purple_skill_shadow_maw_bite_heavy_5x5_25f_1280.png` | none yet | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 2030492 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `purple_ultimate_void_arcane_portal_burst_large_5x5_25f_1280.png` | purple/ultimate/void/arcane_portal_burst/large | `purple_skill_void_arcane_portal_ultimate_5x5_25f_1280.png` | d_void_step, d_devouring_eclipse, n_teleport, r_rune_step, e_transpose, boss_apocalypse | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 1651939 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |
| skills | `purpleblue_ultimate_void_cosmic_vortex_implosion_large_5x5_25f_1280.png` | purpleblue/ultimate/void/cosmic_vortex_implosion/large | `purpleblack_skill_void_singularity_implosion_ultimate_5x5_25f_1280.png` | d_devouring_eclipse, n_dark_meteor, boss_apocalypse | INVALID_NAME | PASS | yes | safe | Source inspection: 1280x1280, RGBA, 2633324 bytes, transparent alpha, 25 active 5x5 cells. No file mutation performed. |

## 6. Rename Plan Summary

- Safe renames: **48**
- Manual-review renames: **15**
- Blocked renames: **0**
- Duplicate/collision issues: **0**

No rename is applied. Manual-review entries depend on visual doctrine (for example smoke versus explosion, horizontal flash versus pierce, and ambiguous palette/family semantics).

## 7. Classification Draft Summary

All 20 basics are classified primarily as `primaryImpact`. The 43 skill sheets are classified among `secondaryBurst`, `statusBurst`, `supportBurst`, `bossSignature` and `unknown` for manual-review cases. Each entry records normalized identity, anchor, blend, intended use, linked action needs and composite candidates.

## 8. Basic Attack VFX Rules

- One basic attack = one preset = exactly one `basics` spritesheet.
- A basic attack never uses a `skills` spritesheet.
- AP/power maps to small, medium or heavy visual intensity.
- Basic impacts must remain readable and important from the tactical camera.

## 9. Skill Preset VFX Rules

- One skill = one preset = one to N spritesheets.
- A skill may use skills-only layers, or a basics primary impact plus skills secondary/status/elemental layers.
- Weapon skills should preserve the weapon read before adding elemental or status accents.
- Pure magic, healing and support skills may use skills-only sheets.
- Bosses and ultimates may use longer chains only when timing preserves tactical readability.

## 10. Preset Seed Plan

- `basic_greatsword_hit`: `white_basic_slash_triple_impact_heavy`.
- `basic_holy_mace_hit`: `white_basic_smash_comet_impact_medium`.
- `basic_scythe_hit`: `white_basic_slash_crescent_impact_heavy`.
- `basic_long_spear_hit`: `white_basic_slash_horizontal_flash_medium`.
- `basic_grimoire_hit`: `white_basic_magic_holy_ring_burst_heavy`.
- `r3a2_w_lion_surge`: `white_basic_slash_triple_impact_heavy` → `orange_skill_solar_halo_burst_ultimate`.
- `r3a2_p_holy_strike`: `white_basic_slash_cross_impact_heavy` → `gold_skill_holy_radiance_burst_heavy`.
- `r3a2_p_radiant_judgement`: `gold_skill_holy_radiance_burst_heavy` → `bluegold_skill_ultimate_arcane_beam_ultimate`.
- `r3a2_d_devouring_eclipse`: `purpleblack_skill_void_singularity_implosion_ultimate` → `purple_skill_void_arcane_portal_ultimate`.
- `r3a2_l_firmament_lance`: `white_basic_slash_horizontal_flash_medium` → `bluegold_skill_ultimate_arcane_beam_ultimate`.
- `r3a2_n_dark_bolt`: `blue_skill_lightning_burst_impact_medium` → `blue_skill_lightning_pillar_impact_medium`.
- `r3a2_n_flame_wave`: `orange_skill_fire_impact_burst_medium` → `orange_skill_fire_vortex_nova_heavy`.
- `r3a2_n_dark_meteor`: `orange_skill_meteor_impact_burst_heavy` → `purpleblack_skill_void_singularity_implosion_ultimate`.
- `r3a2_w_miracle`: `whitegreen_skill_heal_blessing_bloom_heavy` → `bluegold_skill_ultimate_arcane_invocation_ultimate`.
- `r3a2_r_scarlet_circle`: `orange_skill_fire_impact_burst_medium` → `orange_skill_fire_vortex_nova_heavy`.
- `r3a2_r_perfect_duality`: `orange_skill_fire_energy_spiral_medium` → `gold_skill_holy_vortex_nova_heavy`.
- `r3a2_e_absolute_harmony`: `bluegold_skill_ultimate_arcane_invocation_ultimate` → `green_skill_barrier_shield_ring_medium`.

All seed IDs come from the normalized proposal inventory. No runtime preset is implemented in this pass.

## 11. Runtime Replacement Implications

The raw assets may later replace or extend the current runtime library only after approved renames, image cleaning, validation, manifest rebuilding and focused QA. The current runtime remains the stable fallback throughout R3A.2.

## 12. Files Created

- `public/assets/vfx/raw/vfx-demand.r3a2.json`
- `public/assets/vfx/raw/rename.r3a2.plan.json`
- `public/assets/vfx/raw/classification.r3a2.draft.json`
- `public/assets/vfx/raw/preset-seed.r3a2.draft.json`
- `docs/reports/vfx-r3a2-sol-action-aware-naming.md`

## 13. Runtime Safety

- Runtime manifest modified: **no**
- Runtime PNG modified: **no**
- `VfxPresets.ts` modified: **no**
- `VfxActionRegistry.ts` modified: **no**
- `VfxSpriteSheets.ts` modified: **no**
- Gameplay files modified: **no**

## 14. Validation

- JSON parsing/schema-shape audit: **PASS**
- Normalized ID reference audit: **PASS**
- Proposed filename collision audit: **PASS (0 collisions)**
- `git diff --check`: **PASS**
- `git status --short`: the R3A.2 report is untracked; the four JSON artifacts exist under `public/assets/vfx/raw/` and are hidden by the repository's existing raw-assets ignore rule. Pre-existing untracked `.devin/` and `docs/reports/vfx-r2c-sol-cleaning-audit.md` were left untouched.
- `npm test/build`: intentionally not run because no TypeScript, runtime or gameplay file is modified

## 15. Recommended Next Step

**B. Manual naming review required before cleaning.**

Review the 15 visually ambiguous proposals, especially the spear proxy, smoke/explosion candidate, ambiguous magic/holy basics and palette-family mismatches. Once approved, proceed to VFX-R3B-SOL to apply approved renames and clean only the accepted sheets into validation.

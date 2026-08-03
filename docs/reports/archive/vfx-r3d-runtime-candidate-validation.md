# R3D - Validation des candidats VFX runtime

Date : 2026-07-31
Portee : `public/assets/vfx/raw/basics/` et `public/assets/vfx/raw/skills/` uniquement.

## Methode

Chaque source a ete inspectee en lecture seule : signature PNG, dimensions, mode RGBA,
presence d'alpha, unicite binaire et lecture de planches de controle. Les 65 fichiers
repondent au format `1280 x 1280`, `5 x 5`, `25 frames`, PNG RGBA. Aucune source ne
mesure `1254 x 1254`, aucun doublon SHA-256 n'a ete detecte, et aucune planche basic
ne presente de fond magenta opaque ou de grille visible.

`PASS` signifie techniquement propre. La decision de promotion est volontairement
separee : R3E-1 ne promeut que les attaques de base. Les sheets de competences restent
brutes pour une passe semantique ulterieure.

## Basics - decisions de runtime

| Source | ID runtime propose | Categorie | Decision | Notes |
| --- | --- | --- | --- | --- |
| `white_basic_arrow_hit_small_5x5_25f_1280.png` | `basic_arrow_hit_small` | projectile | PROMOTE | PASS, petit impact a distance |
| `white_basic_axe_chop_medium_5x5_25f_1280.png` | `basic_axe_chop_medium` | melee | PROMOTE | PASS, reserve monstre/ennemi |
| `white_basic_bite_snap_small_5x5_25f_1280.png` | `basic_bite_snap_small` | creature | PROMOTE | PASS, reserve creature |
| `white_basic_blade_crescent_medium_5x5_25f_1280.png` | `basic_blade_crescent_medium` | melee | PROMOTE | PASS, scythe |
| `white_basic_body_slam_heavy_5x5_25f_1280.png` | `basic_body_slam_heavy` | creature | PROMOTE | PASS, reserve elite/monstre |
| `white_basic_bolt_hit_small_5x5_25f_1280.png` | `basic_bolt_hit_small` | magic | PROMOTE | PASS, grimoire/wand |
| `white_basic_bullet_hit_medium_5x5_25f_1280.png` | `basic_bullet_hit_medium` | projectile | PROMOTE | PASS, hand cannon |
| `white_basic_claw_rake_small_5x5_25f_1280.png` | `basic_claw_rake_small` | creature | PROMOTE | PASS, reserve creature |
| `white_basic_dagger_crosscut_small_5x5_25f_1280.png` | `basic_dagger_crosscut_small` | melee | PROMOTE | PASS, rapier/dagger |
| `white_basic_execution_slash_heavy_5x5_25f_1280.png` | `basic_execution_slash_heavy` | melee | PROMOTE | PASS, reserve elite |
| `white_basic_greatsword_cleave_heavy_5x5_25f_1280.png` | `basic_greatsword_cleave_heavy` | melee | PROMOTE | PASS, greatsword |
| `white_basic_hammer_crush_heavy_5x5_25f_1280.png` | `basic_hammer_crush_heavy` | melee | PROMOTE | PASS, reserve heavy |
| `white_basic_horn_ram_medium_5x5_25f_1280.png` | `basic_horn_ram_medium` | creature | PROMOTE | PASS, reserve creature |
| `white_basic_mace_impact_medium_5x5_25f_1280.png` | `basic_mace_impact_medium` | melee | PROMOTE | PASS, holy mace |
| `white_basic_shield_bash_medium_5x5_25f_1280.png` | `basic_shield_bash_medium` | melee | PROMOTE | PASS, reserve defender |
| `white_basic_shuriken_cut_small_5x5_25f_1280.png` | `basic_shuriken_cut_small` | projectile | PROMOTE | PASS, shuriken |
| `white_basic_spear_stab_medium_5x5_25f_1280.png` | `basic_spear_stab_medium` | melee | PROMOTE | PASS, long spear |
| `white_basic_staff_strike_small_5x5_25f_1280.png` | `basic_staff_strike_small` | melee/magic | PROMOTE | PASS, crosier |
| `white_basic_sword_slash_heavy_5x5_25f_1280.png` | `basic_sword_slash_heavy` | melee | PROMOTE | PASS, reserve heavy |
| `white_basic_sword_slash_small_5x5_25f_1280.png` | `basic_sword_slash_small` | melee | PROMOTE | PASS, reserve standard |
| `white_basic_tail_whip_medium_5x5_25f_1280.png` | `basic_tail_whip_medium` | creature | PROMOTE | PASS, reserve creature |
| `white_basic_titan_crush_heavy_5x5_25f_1280.png` | `basic_titan_crush_heavy` | creature | PROMOTE | PASS, reserve boss/elite |

## Skills - controle technique, conservation brute

| Source | ID propose | Categorie | Decision |
| --- | --- | --- | --- |
| `blue_skill_arcane_sigil_burst_medium_5x5_25f_1280.png` | `arcane_sigil_burst` | arcane | KEEP_RAW |
| `blue_skill_arcane_starburst_small_5x5_25f_1280.png` | `arcane_starburst` | arcane | KEEP_RAW |
| `blue_skill_barrier_guard_heavy_5x5_25f_1280.png` | `barrier_guard` | support | KEEP_RAW |
| `blue_skill_holy_light_pillar_medium_5x5_25f_1280.png` | `holy_light_pillar` | holy | KEEP_RAW |
| `blue_skill_lightning_burst_impact_medium_5x5_25f_1280.png` | `lightning_burst_impact` | lightning | KEEP_RAW |
| `blue_skill_lightning_pillar_impact_medium_5x5_25f_1280.png` | `lightning_pillar_impact` | lightning | KEEP_RAW |
| `bluegold_skill_ultimate_arcane_beam_ultimate_5x5_25f_1280.png` | `ultimate_arcane_beam` | ultimate | KEEP_RAW |
| `bluegold_skill_ultimate_arcane_invocation_ultimate_5x5_25f_1280.png` | `ultimate_arcane_invocation` | ultimate | KEEP_RAW |
| `cyan_skill_arcane_orbit_burst_medium_5x5_25f_1280.png` | `arcane_orbit_burst` | arcane | KEEP_RAW |
| `cyan_skill_wind_slash_swirl_medium_5x5_25f_1280.png` | `wind_slash_swirl` | wind | KEEP_RAW |
| `gold_skill_arcane_ring_fade_medium_5x5_25f_1280.png` | `arcane_ring_fade` | arcane | KEEP_RAW |
| `gold_skill_holy_radiance_burst_heavy_5x5_25f_1280.png` | `holy_radiance_burst` | holy | KEEP_RAW |
| `gold_skill_holy_sigil_burst_medium_5x5_25f_1280.png` | `holy_sigil_burst` | holy | KEEP_RAW |
| `gold_skill_holy_vortex_nova_heavy_5x5_25f_1280.png` | `holy_vortex_nova` | holy | KEEP_RAW |
| `green_skill_barrier_nature_guard_medium_5x5_25f_1280.png` | `barrier_nature_guard` | support | KEEP_RAW |
| `green_skill_barrier_orb_burst_medium_5x5_25f_1280.png` | `barrier_orb_burst` | support | KEEP_RAW |
| `green_skill_barrier_rune_guard_medium_5x5_25f_1280.png` | `barrier_rune_guard` | support | KEEP_RAW |
| `green_skill_barrier_shield_burst_medium_5x5_25f_1280.png` | `barrier_shield_burst` | support | KEEP_RAW |
| `green_skill_barrier_shield_ring_medium_5x5_25f_1280.png` | `barrier_shield_ring` | support | KEEP_RAW |
| `green_skill_poison_maw_bite_heavy_5x5_25f_1280.png` | `poison_maw_bite` | poison | KEEP_RAW |
| `green_skill_poison_nova_burst_medium_5x5_25f_1280.png` | `poison_nova_burst` | poison | KEEP_RAW |
| `green_skill_starburst_impact_medium_5x5_25f_1280.png` | `green_starburst_impact` | nature | KEEP_RAW |
| `green_skill_support_leaf_burst_medium_5x5_25f_1280.png` | `support_leaf_burst` | support | KEEP_RAW |
| `iceblue_skill_ice_pillar_impact_heavy_5x5_25f_1280.png` | `ice_pillar_impact` | ice | KEEP_RAW |
| `iceblue_skill_ice_shatter_burst_medium_5x5_25f_1280.png` | `ice_shatter_burst` | ice | KEEP_RAW |
| `iceblue_skill_ice_sigil_burst_medium_5x5_25f_1280.png` | `ice_sigil_burst` | ice | KEEP_RAW |
| `orange_skill_fire_energy_spiral_medium_5x5_25f_1280.png` | `fire_energy_spiral` | fire | KEEP_RAW |
| `orange_skill_fire_impact_burst_medium_5x5_25f_1280.png` | `fire_impact_burst` | fire | KEEP_RAW |
| `orange_skill_fire_slash_combo_heavy_5x5_25f_1280.png` | `fire_slash_combo` | fire | KEEP_RAW |
| `orange_skill_fire_smoke_explosion_heavy_5x5_25f_1280.png` | `fire_smoke_explosion` | fire | KEEP_RAW |
| `orange_skill_fire_spark_cluster_medium_5x5_25f_1280.png` | `fire_spark_cluster` | fire | KEEP_RAW |
| `orange_skill_fire_vortex_nova_heavy_5x5_25f_1280.png` | `fire_vortex_nova` | fire | KEEP_RAW |
| `orange_skill_meteor_impact_burst_heavy_5x5_25f_1280.png` | `meteor_impact_burst` | fire | KEEP_RAW |
| `orange_skill_solar_halo_burst_ultimate_5x5_25f_1280.png` | `solar_halo_burst` | ultimate | KEEP_RAW |
| `purple_skill_arcane_impact_burst_medium_5x5_25f_1280.png` | `purple_arcane_impact_burst` | arcane | KEEP_RAW |
| `purple_skill_arcane_slash_burst_medium_5x5_25f_1280.png` | `purple_arcane_slash_burst` | arcane | KEEP_RAW |
| `purple_skill_arcane_vortex_nova_heavy_5x5_25f_1280.png` | `purple_arcane_vortex_nova` | arcane | KEEP_RAW |
| `purple_skill_shadow_maw_bite_heavy_5x5_25f_1280.png` | `shadow_maw_bite` | shadow | KEEP_RAW |
| `purple_skill_void_arcane_portal_ultimate_5x5_25f_1280.png` | `void_arcane_portal` | ultimate | KEEP_RAW |
| `purple_skill_void_rune_orb_medium_5x5_25f_1280.png` | `void_rune_orb` | shadow | KEEP_RAW |
| `purple_skill_void_spiral_implosion_medium_5x5_25f_1280.png` | `void_spiral_implosion` | shadow | KEEP_RAW |
| `purpleblack_skill_void_singularity_implosion_ultimate_5x5_25f_1280.png` | `void_singularity_implosion` | ultimate | KEEP_RAW |
| `whitegreen_skill_heal_blessing_bloom_heavy_5x5_25f_1280.png` | `heal_blessing_bloom` | support | KEEP_RAW |

## Conclusions R3D

- 22/22 sheets `basics` : `PASS` et eligibles a la promotion.
- 43/43 sheets `skills` : techniquement propres mais conservees dans `raw/`.
- Les noms historiques attendus par le brouillon R3A2 mais absents du depot sont notes
  `MISSING_ASSET_FOR_RUNTIME_PROMOTION`; R3E-1 utilise uniquement les candidats reels
  ci-dessus, sur un mapping semantique documente.

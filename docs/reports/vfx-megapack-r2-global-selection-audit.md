# VFX Mega Pack R2 — Global Native Spritesheet Selection & Integration Audit

Generated: 2026-08-08T05:40:46.211Z
Mode: audit only — no runtime, gameplay, manifest or commercial asset file was modified.

## Executive decision

The current 15 native pilot sheets are **correctly integrated as a pilot**, but are **not yet the optimal final action library**. The external pack can provide a unique primary visual source for all 60 hero actions under the fixed native grid convention. This is a selection plan, not approval to sync files into the repository.

- Current pilot integration: **yes, technically valid**.
- Current pilot optimality: **no**; the known w_whirl / n_flame_wave reuse is semantically wrong.
- Pilot reuse acceptable: **only temporarily**; it must not survive the R2 action-specific promotion pass.
- Flame Wave current source acceptable: **no**; fire spin is a whirl, not a directional cone.
- Devouring Eclipse source quality: **yes**; its remaining issue is **presentation/sequence/grounding**, not a bad darkness source.
- Major family missing: **no hard blocker**. Teleport variants benefit from procedural staging, but the pack covers the required primary visual families.
- R2 integration gate: **not ready** until visual boards are signed off and a GPU resource budget/lazy loader is decided.

## Exact sheet convention

Only these exact layouts are eligible for automatic R2 selection:

- 2048x2048: 4x4, 16 frames, 512x512 cells.
- 4096x4096: 8x8, 64 frames, 512x512 cells.

This report does not infer a grid from heuristics. Every mapped candidate is resolved against the indexed source asset metadata.

## Current 15 native assets

| Candidate | Runtime ID | Filename | Current role | Verdict |
| --- | --- | --- | --- | --- |
| r1_2561 | megapack_dash_wind_white_v3 | Dash_Wind_White_v3_spritesheet.png | w_charge | KEEP_STRONG |
| r1_1605 | megapack_blue_slash_flurry | Blue Slash v1 - Flurry_spritesheet.png | w_lion_surge | KEEP_STRONG |
| r1_1712 | megapack_lightning_slash_flurry | Lightning Slash v1 - Flurry_spritesheet.png | ni_shadow_step | KEEP_STRONG |
| r1_0971 | megapack_shield_on | Shield_On_spritesheet.png | p_oathwall | KEEP_STRONG |
| r1_0545 | megapack_impact_darkness_lv3 | Impact_Darkness_Lv3_spritesheet.png | d_devouring_eclipse | KEEP_BUT_RETUNE |
| r1_1700 | megapack_fire_slash_spin | Fire Slash v1 - Spin_spritesheet.png | w_whirl | KEEP_FOR_DIFFERENT_ACTION |
| r1_0450 | megapack_flamethrower_001 | Flamethrower_001_spritesheet.png | reserved | RESERVED_FUTURE |
| r1_0677 | megapack_positive_buff_v3 | Positive_Buff_V3_spritesheet.png | w_sanctuary | KEEP_BUT_RETUNE |
| r1_0503 | megapack_heart_buff_v3 | Heart_Buff_V3_spritesheet.png | w_purify | REPLACE_WITH_BETTER_SOURCE |
| r1_2509 | megapack_angry_smoke_burst | Angry_Smoke_Burst_White_v2_A_spritesheet.png | ni_smoke_bomb | KEEP_STRONG |
| r1_0480 | megapack_healing_v3 | Healing_V3_spritesheet.png | w_salvation | KEEP_STRONG |
| r1_0525 | megapack_hex_bursts_center_v2 | Hex_Bursts_Center_V2_spritesheet.png | e_binding_seal | KEEP_STRONG |
| r1_0129 | megapack_charge_darkness_v1_a | Charge_Darkness_v1_A_spritesheet.png | d_devouring_eclipse | KEEP_BUT_RETUNE |
| r1_0544 | megapack_impact_darkness_lv2 | Impact_Darkness_Lv2_spritesheet.png | d_devouring_eclipse | KEEP_BUT_RETUNE |
| r1_0592 | megapack_impact_shockwave_v1 | Impact_Shockwave v2_spritesheet.png | d_devouring_eclipse | KEEP_BUT_RETUNE |

Verdict totals: KEEP_STRONG: 7, KEEP_BUT_RETUNE: 5, KEEP_FOR_DIFFERENT_ACTION: 1, RESERVED_FUTURE: 1, REPLACE_WITH_BETTER_SOURCE: 1.

## Sixty-action R2 candidate selection

The proposed map reserves a distinct **primary** source for every base action and hero skill. Reuse is limited to alternates/backups. 60/60 primaries are unique. **16 candidates remain on a visual-review hold**: they are useful shortlist entries, not promotion-ready assets.

| Action | Display name | Shape | Orientation | Primary | Source | Sheet | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| basic_greatsword_hit | Attaque — espadon | melee_slash | face_target | r1_1709 | Impact_Cut_V6_spritesheet.png | 4096x4096 | REVIEW_REQUIRED |
| basic_holy_mace_hit | Attaque — masse sacrée | radial_impact | center_on_target | r1_0572 | Impact_Light_Lv3_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| basic_scythe_hit | Attaque — faux | melee_slash | face_target | r1_0543 | Impact_Darkness_Lv1_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| basic_long_spear_hit | Attaque — lance longue | thrust | source_to_target | r1_1723 | Stab_V8_spritesheet.png | 2048x2048 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| basic_grimoire_hit | Attaque — grimoire | projectile | source_to_target | r1_0935 | Projectile_Darkness_Ball_Lv2_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| basic_crosier_hit | Attaque — crosier | radial_impact | center_on_target | r1_0483 | Healing_V5_A_Heal_spritesheet.png | 4096x4096 | REVIEW_REQUIRED |
| basic_rapier_hit | Attaque — rapière | thrust | source_to_target | r1_1715 | Lightning Slash v1_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| basic_wand_hit | Attaque — baguette | projectile | source_to_target | r1_0938 | Projectile_Energy_Ball_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| basic_longbow_hit | Attaque — arc long | projectile | source_to_target | r1_0961 | Projectile_Wind_Ball_Lv1_spritesheet.png | 4096x4096 | REVIEW_REQUIRED |
| basic_shuriken_hit | Attaque — shuriken | projectile | source_to_target | r1_1695 | Claw Slash v2_spritesheet.png | 2048x2048 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| basic_dagger_hit | Attaque — dague | melee_slash | face_target | r1_1706 | Impact_Cut_V3_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| basic_hand_cannon_hit | Attaque — canon portatif | projectile | source_to_target | r1_0943 | Projectile_Fire_Ball_Lv4_spritesheet.png | 4096x4096 | REVIEW_REQUIRED |
| w_break_guard | Brise-garde | melee_slash | face_target | r1_0542 | Impact_Cartoon Hit_V6_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| w_charge | Charge | movement | source_to_destination | r1_2561 | Dash_Wind_White_v3_spritesheet.png | 2048x2048 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| w_whirl | Frappe tournoyante | radial_impact | center_on_target | r1_1700 | Fire Slash v1 - Spin_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| w_lion_surge | Assaut du Lion | melee_slash | align_line | r1_1605 | Blue Slash v1 - Flurry_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| p_holy_strike | Frappe sacrée | radial_impact | center_on_target | r1_0571 | Impact_Light_Lv2_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| p_interpose | Interposition | movement | source_to_destination | r1_2599 | Jump_Wind_White_v1_spritesheet.png | 2048x2048 | REVIEW_REQUIRED |
| p_oathwall | Mur du serment | aura | center_on_target | r1_0971 | Shield_On_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| p_radiant_judgement | Jugement radiant | ultimate_overlay | center_on_aoe_origin | r1_1257 | Star_Explosion_V1_A_Star_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| d_cursed_blade | Lame maudite | melee_slash | face_target | r1_0544 | Impact_Darkness_Lv2_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| d_void_step | Pas du vide | movement | source_to_destination | r1_2562 | Dash_Wind_White_v4_spritesheet.png | 2048x2048 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| d_blood_pact | Pacte de sang | aura | center_on_target | r1_1728 | Blood_Burst_v10_spritesheet.png | 4096x4096 | REVIEW_REQUIRED |
| d_devouring_eclipse | Éclipse dévorante | ultimate_overlay | center_on_aoe_origin | r1_0545 | Impact_Darkness_Lv3_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| l_long_thrust | Estoc long | thrust | source_to_target | r1_1716 | Stab_V1_spritesheet.png | 2048x2048 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| l_haft_recoil | Recul de hampe | thrust | source_to_target | r1_1717 | Stab_V2_spritesheet.png | 2048x2048 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| l_griffon_jump | Saut du griffon | radial_impact | center_on_target | r1_2600 | Jump_Wind_White_v2_spritesheet.png | 2048x2048 | REVIEW_REQUIRED |
| l_firmament_lance | Lance du firmament | line | align_line | r1_1718 | Stab_V3_spritesheet.png | 2048x2048 | REVIEW_REQUIRED |
| n_dark_bolt | Éclair noir | projectile | source_to_target | r1_0934 | Projectile_Darkness_Ball_Lv1_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| n_teleport | Téléportation | movement | source_to_destination | r1_2563 | Dash_Wind_White_v5_spritesheet.png | 2048x2048 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| n_flame_wave | Vague de flammes | cone | align_cone | r1_0453 | Flamethrower_002_spritesheet.png | 4096x4096 | REVIEW_REQUIRED |
| n_dark_meteor | Météore noir | ultimate_overlay | center_on_aoe_origin | r1_0437 | Explosion_Fire_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| w_salvation | Salvation | aura | center_on_target | r1_0480 | Healing_V3_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| w_purify | Purification | aura | center_on_target | r1_0485 | Healing_V5_A_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| w_sanctuary | Sanctuaire | field | center_on_aoe_origin | r1_0677 | Positive_Buff_V3_spritesheet.png | 4096x4096 | REVIEW_REQUIRED |
| w_miracle | Miracle | ultimate_overlay | center_on_aoe_origin | r1_0494 | Healing_V7_A_spritesheet.png | 4096x4096 | REVIEW_REQUIRED |
| r_arcane_blade | Lame arcanique | melee_slash | face_target | r1_1644 | Blue Slash v23 - Spin_spritesheet.png | 2048x2048 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| r_rune_step | Pas runique | movement | source_to_destination | r1_2564 | Dash_Wind_White_v6_spritesheet.png | 2048x2048 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| r_scarlet_circle | Cercle écarlate | radial_impact | center_on_aoe_origin | r1_1258 | Star_Explosion_V1_B_Circle_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| r_perfect_duality | Dualité parfaite | ultimate_overlay | center_on_aoe_origin | r1_1259 | Star_Explosion_V1_B_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| e_vigor_rune | Rune de vigueur | aura | center_on_target | r1_0678 | Positive_Buff_V4_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| e_transpose | Transposition | movement | source_to_destination | r1_2565 | Dash_Wind_White_v7_spritesheet.png | 2048x2048 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| e_binding_seal | Sceau entravant | field | center_on_aoe_origin | r1_0525 | Hex_Bursts_Center_V2_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| e_absolute_harmony | Harmonie absolue | ultimate_overlay | center_on_aoe_origin | r1_0679 | Positive_Buff_V5_spritesheet.png | 4096x4096 | REVIEW_REQUIRED |
| a_precise_shot | Tir précis | projectile | source_to_target | r1_0952 | Projectile_Light_Ball_Lv3_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| a_hawk_leap | Bond du faucon | movement | source_to_destination | r1_0707 | Power_Up_v10_A_Wind Rings_spritesheet.png | 4096x4096 | REVIEW_REQUIRED |
| a_arrow_rain | Pluie de flèches | field | center_on_aoe_origin | r1_0004 | Arrow_Indicator_V4_spritesheet.png | 4096x4096 | REVIEW_REQUIRED |
| a_zenith_arrow | Flèche zénith | projectile | source_to_target | r1_0005 | Arrow_Indicator_V5_spritesheet.png | 4096x4096 | REVIEW_REQUIRED |
| ni_venom_blade | Lame venimeuse | melee_slash | face_target | r1_0576 | Impact_Poison_Lv1_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| ni_shadow_step | Pas de l’ombre | movement | source_to_destination | r1_1712 | Lightning Slash v1 - Flurry_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| ni_smoke_bomb | Bombe fumigène | field | center_on_aoe_origin | r1_2509 | Angry_Smoke_Burst_White_v2_A_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| ni_silent_assassin | Assassin silencieux | melee_slash | face_target | r1_1713 | Lightning Slash v1 - Spin_A_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| ro_sneak_attack | Attaque sournoise | melee_slash | face_target | r1_1704 | Impact_Cut_V1_spritesheet.png | 2048x2048 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| ro_tumble | Roulade | movement | source_to_destination | r1_2560 | Dash_Wind_White_v2_spritesheet.png | 2048x2048 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| ro_jaw_trap | Piège à mâchoires | field | center_on_target | r1_0300 | Circle Cut Out_V1_spritesheet.png | 2048x2048 | REVIEW_REQUIRED |
| ro_fault_breaker | Brise-faille | radial_impact | center_on_aoe_origin | r1_0438 | Explosion_Lightning_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| ar_calibrated_shot | Tir calibré | projectile | source_to_target | r1_0942 | Projectile_Fire_Ball_Lv3_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| ar_explosive_retreat | Recul explosif | radial_impact | center_on_target | r1_0430 | Explosion_Bomb_V2_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| ar_incendiary_grenade | Grenade incendiaire | projectile | source_to_target | r1_0431 | Explosion_Bomb_V3_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |
| ar_artillery_barrage | Barrage d’artillerie | ultimate_overlay | center_on_aoe_origin | r1_0432 | Explosion_Bomb_V4_spritesheet.png | 4096x4096 | RECOMMENDED_FOR_MANUAL_VISUAL_GATE |

The full requirement model and the three ranked candidates per action are in [vfx-megapack-r2-60-action-candidate-map.json](vfx-megapack-r2-60-action-candidate-map.json).

### Mandatory visual-review holds

| Action | Display name | Candidate | Why approval is still required |
| --- | --- | --- | --- |
| basic_greatsword_hit | Attaque — espadon | r1_1709 | Impact Cut V6 reads as a compact target hit, not yet as the wide directional cleave expected from a greatsword. |
| basic_crosier_hit | Attaque — crosier | r1_0483 | Healing V5 reads primarily as restoration; it must be compared with a compact holy staff-strike before promotion. |
| basic_longbow_hit | Attaque — arc long | r1_0961 | Wind Ball has travel but no unmistakable arrow silhouette; verify the intended longbow read at tactical scale. |
| basic_hand_cannon_hit | Attaque — canon portatif | r1_0943 | Fire Ball reads as magic unless its firing/impact staging establishes the hand-cannon identity. |
| p_interpose | Interposition | r1_2599 | Jump Wind needs an in-combat check that it reads as protective interception rather than a generic movement puff. |
| d_blood_pact | Pacte de sang | r1_1728 | Blood Burst v10 has low visible occupancy on its contact sheet and must prove a readable self-aura at 4 AP. |
| l_griffon_jump | Saut du griffon | r1_2600 | Jump Wind v2 needs a landing impact layer or stronger source staging to sell an offensive leap. |
| l_firmament_lance | Lance du firmament | r1_1718 | Stab V3 is structurally compatible but does not yet prove an ultimate-scale line identity. |
| n_flame_wave | Vague de flammes | r1_0453 | Flamethrower 002 is the semantic cone candidate, but its native orientation and coverage need runtime visual approval. |
| w_sanctuary | Sanctuaire | r1_0677 | Positive Buff V3 is a useful support layer but may not provide a sufficiently grounded sanctuary field by itself. |
| w_miracle | Miracle | r1_0494 | Healing V7 needs a final visual check for an ultimate-scale miracle rather than a regular heal. |
| e_absolute_harmony | Harmonie absolue | r1_0679 | Positive Buff V5 risks reading like UI arrows instead of a signature harmony ultimate. |
| a_hawk_leap | Bond du faucon | r1_0707 | Wind Rings are a preparatory aura; validate that the full presentation still reads as a moving archer leap. |
| a_arrow_rain | Pluie de flèches | r1_0004 | Arrow Indicator V4 is a targeting-style source, not yet a validated falling-arrow field effect. |
| a_zenith_arrow | Flèche zénith | r1_0005 | Arrow Indicator V5 is a directional marker, not yet a validated signature projectile. |
| ro_jaw_trap | Piège à mâchoires | r1_0300 | Circle Cut Out V1 is only a base marker and does not independently communicate a mechanical jaw trap. |

These holds are deliberate: semantic filename matching is insufficient when an asset reads like a UI marker, a weak local impact, or the wrong combat shape at tactical scale.

## Collision audit

| Family collision | Current state | Risk | Selection decision |
| --- | --- | --- | --- |
| Whirl / Flame Wave | r1_1700 currently reused | Critical semantic collision | Keep r1_1700 only for w_whirl; select r1_0453 for n_flame_wave. |
| Dark Meteor / Devouring Eclipse | darkness assets overlap by family | Moderate palette collision | Meteor uses fire/explosion r1_0437 with a staged dark cast; Eclipse retains r1_0129/r1_0544/r1_0545 sequence. |
| Movement actions | wind/dash family variants | Moderate motion-family collision | Reserve per-action candidates and distinguish through source/destination timing and scale, not shared preset aliases. |
| Holy supports | healing/buff/holy overlap | Low after per-action assignment | Use separate healing, cleanse, sanctuary, miracle and harmony candidates. |
| Slashes / ranged | sword and projectile collections are broad | Low if candidates are reserved | The map keeps each primary candidate unique; reuse is restricted to alternates only. |

## Visual evidence and inspection protocol

Contact sheets must remain external/ignored because they display commercial source PNGs. This audit expects evidence in %TEMP%\rpgthreejs-vfx-megapack-r2-evidence, grouped into current pilot, basics, skills 2 AP, skills 3 AP, skills 4 AP and ultimates. Manual approval must inspect peak-frame readability, source-to-target orientation, grounded anchor, visual occupancy, contrast against the combat scenes and frame continuity.

## Performance and architecture

The candidate map contains 16 2048 sheets and 44 4096 sheets. A decoded RGBA sheet costs approximately 16 MiB or 64 MiB respectively before GPU allocator overhead. A theoretical all-resident sixty-sheet set would be about 3072 MiB, which is not a practical default desktop/mobile budget.

Recommendation: keep the current manifest/registry validation, add a presentation-driven lazy texture cache with per-scene preload, LRU eviction and a bounded residency target before the sixty-action sync. A realistic first target is 8–12 simultaneous native 4K-equivalent textures, plus the existing V1/V2 texture budget. This is an architecture recommendation only; it is intentionally not implemented in this audit.

## Native selection quality

- Basic attacks: the existing generic legacy set is not optimal; the map supplies distinct slash, thrust, projectile and impact candidates for all 12 weapons.
- 2 AP: short and precise source identity; no long-screen overlays.
- 3 AP: mobility keeps distinct trajectory candidates but needs presentation staging to differentiate multiple teleports/dashes.
- 4 AP: action shapes become unmistakable — spin, cone, field, trap, area marker and projectile.
- 5 AP: each ultimate receives a distinct selected source. Staged presentation remains necessary for meteor, judgement, eclipse and artillery to feel cinematic.

## Approval checklist before any R2C integration

1. Review every external contact sheet and mark each primary as approved/replaced/deferred.
2. Confirm the selected primary candidate reads correctly at tactical camera scale and in reduced graphics.
3. Decide the native texture residency budget and lazy-load policy.
4. Promote only approved sources through the existing sync script; never reference raw, preview or external pack paths at runtime.
5. Run action-by-action QA after promotion; do not mass-integrate all sixty candidates in one unreviewed change.

## Explicit non-goals

No gameplay, AP, PA, targeting, AI, VFX runtime behavior, manifests, source art, source PNG copying, or combat rules were changed. This report does not authorize QA4/R2C implementation.

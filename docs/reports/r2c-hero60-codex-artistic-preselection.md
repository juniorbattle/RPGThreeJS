# R2C-HERO60 A1 — Présélection artistique CartoonCoffee

Statut : **prêt pour QA humaine**. La session navigateur réelle a configuré les 60 actions en `QA WORKING`. Aucun candidat n’a été validé, appliqué ou vérifié en production.

## Résultat exécutif

| Mesure | Résultat |
|---|---:|
| Baseline initiale acceptée | OUI |
| Actions analysées | 60 / 60 |
| Attaques basiques | 12 / 12 |
| Compétences | 48 / 48 |
| Étapes visuelles configurées | 60 |
| Candidats uniques | 60 |
| Doublons accidentels | 0 |
| Échelle ≥ 2.0 | 60 |
| Échelle < 2.0 | 0 |
| LOW_CONFIDENCE_SELECTION | 16 |
| PRESET_STRUCTURE_REVIEW | 24 |
| DEDICATED_PRESET_REQUIRED_ON_APPLY | 15 |
| SCALE_FLOOR_CONFLICT | 0 |
| NO_GIF_SELECTED | 0 |
| REUSE_JUSTIFIED | 0 |
| Validé / appliqué / vérifié | 0 / 0 / 0 |
| Changements production | 0 |

## Gate navigateur

- Gate initial : `ARTISTIC CLEAN YES`, `SELECTION CLEAN YES`, `SEMANTIC CLEAN YES`, `CODEX READY YES`.
- Compteurs initiaux : sources/overrides/history/validated/tested/verified/working = `0/0/0/0/0/0/0`.
- État final attendu : `ARTISTIC CLEAN NO`, `SELECTION CLEAN NO`, `SEMANTIC CLEAN NO`.
- Compteurs finaux : `QA SOURCES 60`, `QA OVERRIDES 60`, `QA HISTORY 0`, `QA WORKING VISUAL STEPS 60`.
- Garde-fous : `HERO ARTISTIC 0/60`, `VALIDATED 0`, `APPLY 0`, `VERIFY 0`.
- Checkpoint : état persistant du VFX Lab ; aucun snapshot externe créé et aucun reset effectué.

## Paramètres de calibration

| Tier | Échelle | Durée | Opacité | Fade in | Fade out |
|---|---:|---:|---:|---:|---:|
| BASIC | 2.10 | 0.38 s | 0.96 | 0.03 s | 0.08 s |
| 2AP | 2.20 | 0.44 s | 0.97 | 0.04 s | 0.10 s |
| 3AP | 2.35 | 0.56 s | 0.96 | 0.05 s | 0.12 s |
| 4AP | 2.60 | 0.78 s | 0.98 | 0.06 s | 0.14 s |
| 5AP_ULTIMATE | 3.00 | 1.18 s | 1.00 | 0.08 s | 0.18 s |

Les ancres, couches, mélanges et directions sont adaptés au rôle sémantique de chaque action. Les offsets restent à `0/0` après lecture correcte au centre de masse ; ils ne servent pas à compenser une source inadéquate.

## Guerrier

| Action | Tier | Preset actuel | Candidat QA | Configuration | Score | Drapeaux |
|---|---|---|---|---|---:|---|
| `basic_greatsword_hit`<br>Attaque — espadon | BASIC | `basic_greatsword_hit` | `r1_1709`<br>Impact_Cut_V6_spritesheet.png | 2.10× · 0.38s · target · impact · NORMAL · face_target | 76 | LOW_CONFIDENCE_SELECTION |
| `w_break_guard`<br>Brise-garde | 2AP | `sword_slash` | `r1_0542`<br>Impact_Cartoon Hit_V6_spritesheet.png | 2.20× · 0.44s · target · impact · NORMAL · face_target | 88 | DEDICATED_PRESET_REQUIRED_ON_APPLY |
| `w_charge`<br>Charge du Lion | 3AP | `pilot_w_charge` | `r1_2561`<br>Dash_Wind_White_v3_spritesheet.png | 2.35× · 0.56s · source · impact · ADDITIVE · source_to_destination | 88 | — |
| `w_whirl`<br>Tourbillon | 4AP | `pilot_w_whirl` | `r1_1700`<br>Fire Slash v1 - Spin_spritesheet.png | 2.60× · 0.78s · source · impact · ADDITIVE · center_on_aoe_origin | 88 | PRESET_STRUCTURE_REVIEW |
| `w_lion_surge`<br>Ruée du Lion | 5AP_ULTIMATE | `pilot_w_lion_surge` | `r1_1605`<br>Blue Slash v1 - Flurry_spritesheet.png | 3.00× · 1.18s · target · impact · ADDITIVE · face_target | 92 | PRESET_STRUCTURE_REVIEW |

## Paladin

| Action | Tier | Preset actuel | Candidat QA | Configuration | Score | Drapeaux |
|---|---|---|---|---|---:|---|
| `basic_holy_mace_hit`<br>Attaque — masse sacrée | BASIC | `basic_holy_mace_hit` | `r1_0572`<br>Impact_Light_Lv3_spritesheet.png | 2.10× · 0.38s · target · impact · ADDITIVE · face_target | 88 | — |
| `p_holy_strike`<br>Frappe sacrée | 2AP | `skill_holy_radiance` | `r1_0571`<br>Impact_Light_Lv2_spritesheet.png | 2.20× · 0.44s · target · impact · ADDITIVE · face_target | 88 | — |
| `p_interpose`<br>Interposition | 3AP | `leap_impact` | `r1_2599`<br>Jump_Wind_White_v1_spritesheet.png | 2.35× · 0.56s · source · impact · ADDITIVE · source_to_destination | 76 | LOW_CONFIDENCE_SELECTION<br>DEDICATED_PRESET_REQUIRED_ON_APPLY |
| `p_oathwall`<br>Mur du serment | 4AP | `pilot_p_oathwall` | `r1_0971`<br>Shield_On_spritesheet.png | 2.60× · 0.78s · targetGround · ground · ADDITIVE · center_on_target | 88 | PRESET_STRUCTURE_REVIEW |
| `p_radiant_judgement`<br>Jugement radiant | 5AP_ULTIMATE | `ultimate_radiant_judgement` | `r1_1257`<br>Star_Explosion_V1_A_Star_spritesheet.png | 3.00× · 1.18s · groundTarget · ground · ADDITIVE · center_on_aoe_origin | 92 | PRESET_STRUCTURE_REVIEW |

## Chevalier noir

| Action | Tier | Preset actuel | Candidat QA | Configuration | Score | Drapeaux |
|---|---|---|---|---|---:|---|
| `basic_scythe_hit`<br>Attaque — faux | BASIC | `basic_scythe_hit` | `r1_0543`<br>Impact_Darkness_Lv1_spritesheet.png | 2.10× · 0.38s · target · impact · NORMAL · face_target | 88 | — |
| `d_cursed_blade`<br>Lame maudite | 2AP | `sword_slash` | `r1_0544`<br>Impact_Darkness_Lv2_spritesheet.png | 2.20× · 0.44s · target · impact · NORMAL · face_target | 88 | DEDICATED_PRESET_REQUIRED_ON_APPLY |
| `d_void_step`<br>Pas du néant | 3AP | `teleport_burst` | `r1_2562`<br>Dash_Wind_White_v4_spritesheet.png | 2.35× · 0.56s · source · impact · ADDITIVE · source_to_destination | 88 | DEDICATED_PRESET_REQUIRED_ON_APPLY |
| `d_blood_pact`<br>Pacte de sang | 4AP | `skill_void_rune` | `r1_1728`<br>Blood_Burst_v10_spritesheet.png | 2.60× · 0.78s · source · impact · ADDITIVE · center_on_aoe_origin | 76 | LOW_CONFIDENCE_SELECTION<br>PRESET_STRUCTURE_REVIEW |
| `d_devouring_eclipse`<br>Éclipse dévorante | 5AP_ULTIMATE | `pilot_d_devouring_eclipse` | `r1_0545`<br>Impact_Darkness_Lv3_spritesheet.png | 3.00× · 1.18s · groundTarget · ground · ADDITIVE · center_on_aoe_origin | 92 | PRESET_STRUCTURE_REVIEW |

## Lancier

| Action | Tier | Preset actuel | Candidat QA | Configuration | Score | Drapeaux |
|---|---|---|---|---|---:|---|
| `basic_long_spear_hit`<br>Attaque — lance longue | BASIC | `basic_long_spear_hit` | `r1_1723`<br>Stab_V8_spritesheet.png | 2.10× · 0.38s · target · impact · NORMAL · source_to_target | 88 | — |
| `l_long_thrust`<br>Estoc long | 2AP | `thrust_line` | `r1_1716`<br>Stab_V1_spritesheet.png | 2.20× · 0.44s · target · impact · NORMAL · source_to_target | 88 | DEDICATED_PRESET_REQUIRED_ON_APPLY |
| `l_haft_recoil`<br>Revers de hampe | 3AP | `thrust_line` | `r1_1717`<br>Stab_V2_spritesheet.png | 2.35× · 0.56s · target · impact · NORMAL · source_to_target | 88 | DEDICATED_PRESET_REQUIRED_ON_APPLY |
| `l_griffon_jump`<br>Saut du griffon | 4AP | `leap_impact` | `r1_2600`<br>Jump_Wind_White_v2_spritesheet.png | 2.60× · 0.78s · source · impact · ADDITIVE · source_to_destination | 76 | LOW_CONFIDENCE_SELECTION<br>PRESET_STRUCTURE_REVIEW<br>DEDICATED_PRESET_REQUIRED_ON_APPLY |
| `l_firmament_lance`<br>Lance du firmament | 5AP_ULTIMATE | `ultimate_firmament_lance` | `r1_1718`<br>Stab_V3_spritesheet.png | 3.00× · 1.18s · target · impact · ADDITIVE · face_target | 76 | LOW_CONFIDENCE_SELECTION<br>PRESET_STRUCTURE_REVIEW |

## Mage noir

| Action | Tier | Preset actuel | Candidat QA | Configuration | Score | Drapeaux |
|---|---|---|---|---|---:|---|
| `basic_grimoire_hit`<br>Attaque — grimoire | BASIC | `basic_grimoire_hit` | `r1_0935`<br>Projectile_Darkness_Ball_Lv2_spritesheet.png | 2.10× · 0.38s · target · impact · ADDITIVE · source_to_target | 88 | — |
| `n_dark_bolt`<br>Éclair noir | 2AP | `shadow_lightning_bolt` | `r1_0934`<br>Projectile_Darkness_Ball_Lv1_spritesheet.png | 2.20× · 0.44s · target · impact · ADDITIVE · source_to_target | 88 | — |
| `n_teleport`<br>Téléportation | 3AP | `teleport_burst` | `r1_2563`<br>Dash_Wind_White_v5_spritesheet.png | 2.35× · 0.56s · source · impact · ADDITIVE · source_to_destination | 88 | DEDICATED_PRESET_REQUIRED_ON_APPLY |
| `n_flame_wave`<br>Vague de flammes | 4AP | `pilot_n_flame_wave` | `r1_0453`<br>Flamethrower_002_spritesheet.png | 2.60× · 0.78s · groundTarget · ground · ADDITIVE · center_on_aoe_origin | 76 | LOW_CONFIDENCE_SELECTION<br>PRESET_STRUCTURE_REVIEW |
| `n_dark_meteor`<br>Météore noir | 5AP_ULTIMATE | `ultimate_dark_meteor` | `r1_0437`<br>Explosion_Fire_spritesheet.png | 3.00× · 1.18s · groundTarget · ground · ADDITIVE · center_on_aoe_origin | 92 | PRESET_STRUCTURE_REVIEW |

## Mage blanc

| Action | Tier | Preset actuel | Candidat QA | Configuration | Score | Drapeaux |
|---|---|---|---|---|---:|---|
| `basic_crosier_hit`<br>Attaque — crosier | BASIC | `basic_crosier_hit` | `r1_0483`<br>Healing_V5_A_Heal_spritesheet.png | 2.10× · 0.38s · target · impact · ADDITIVE · face_target | 76 | LOW_CONFIDENCE_SELECTION |
| `w_salvation`<br>Salut | 2AP | `pilot_w_salvation` | `r1_0480`<br>Healing_V3_spritesheet.png | 2.20× · 0.44s · targetGround · ground · ADDITIVE · center_on_target | 88 | — |
| `w_purify`<br>Purification | 3AP | `pilot_w_purify` | `r1_0485`<br>Healing_V5_A_spritesheet.png | 2.35× · 0.56s · targetGround · ground · ADDITIVE · center_on_target | 88 | — |
| `w_sanctuary`<br>Sanctuaire | 4AP | `pilot_w_sanctuary` | `r1_0677`<br>Positive_Buff_V3_spritesheet.png | 2.60× · 0.78s · targetGround · ground · ADDITIVE · center_on_target | 76 | LOW_CONFIDENCE_SELECTION<br>PRESET_STRUCTURE_REVIEW |
| `w_miracle`<br>Miracle | 5AP_ULTIMATE | `ultimate_miracle` | `r1_0494`<br>Healing_V7_A_spritesheet.png | 3.00× · 1.18s · allTargets · ground · ADDITIVE · center_on_target | 76 | LOW_CONFIDENCE_SELECTION<br>PRESET_STRUCTURE_REVIEW |

## Mage rouge

| Action | Tier | Preset actuel | Candidat QA | Configuration | Score | Drapeaux |
|---|---|---|---|---|---:|---|
| `basic_rapier_hit`<br>Attaque — rapière | BASIC | `basic_rapier_hit` | `r1_1715`<br>Lightning Slash v1_spritesheet.png | 2.10× · 0.38s · target · impact · NORMAL · source_to_target | 88 | — |
| `r_arcane_blade`<br>Lame arcanique | 2AP | `skill_arcane_slash_burst` | `r1_1644`<br>Blue Slash v23 - Spin_spritesheet.png | 2.20× · 0.44s · target · impact · ADDITIVE · face_target | 88 | — |
| `r_rune_step`<br>Pas runique | 3AP | `teleport_burst` | `r1_2564`<br>Dash_Wind_White_v6_spritesheet.png | 2.35× · 0.56s · source · impact · ADDITIVE · source_to_destination | 88 | DEDICATED_PRESET_REQUIRED_ON_APPLY |
| `r_scarlet_circle`<br>Cercle écarlate | 4AP | `skill_arcane_vortex` | `r1_1258`<br>Star_Explosion_V1_B_Circle_spritesheet.png | 2.60× · 0.78s · source · impact · ADDITIVE · center_on_aoe_origin | 88 | PRESET_STRUCTURE_REVIEW |
| `r_perfect_duality`<br>Dualité parfaite | 5AP_ULTIMATE | `ultimate_perfect_duality` | `r1_1259`<br>Star_Explosion_V1_B_spritesheet.png | 3.00× · 1.18s · target · impact · ADDITIVE · face_target | 92 | PRESET_STRUCTURE_REVIEW |

## Enchanteur

| Action | Tier | Preset actuel | Candidat QA | Configuration | Score | Drapeaux |
|---|---|---|---|---|---:|---|
| `basic_wand_hit`<br>Attaque — baguette | BASIC | `basic_wand_hit` | `r1_0938`<br>Projectile_Energy_Ball_spritesheet.png | 2.10× · 0.38s · target · impact · ADDITIVE · source_to_target | 88 | — |
| `e_vigor_rune`<br>Rune de vigueur | 2AP | `skill_arcane_orbit` | `r1_0678`<br>Positive_Buff_V4_spritesheet.png | 2.20× · 0.44s · targetGround · ground · ADDITIVE · center_on_target | 88 | — |
| `e_transpose`<br>Transposition | 3AP | `teleport_burst` | `r1_2565`<br>Dash_Wind_White_v7_spritesheet.png | 2.35× · 0.56s · source · impact · ADDITIVE · source_to_destination | 88 | DEDICATED_PRESET_REQUIRED_ON_APPLY |
| `e_binding_seal`<br>Sceau d’entrave | 4AP | `pilot_e_binding_seal` | `r1_0525`<br>Hex_Bursts_Center_V2_spritesheet.png | 2.60× · 0.78s · groundTarget · ground · ADDITIVE · center_on_aoe_origin | 88 | PRESET_STRUCTURE_REVIEW |
| `e_absolute_harmony`<br>Harmonie absolue | 5AP_ULTIMATE | `ultimate_absolute_harmony` | `r1_0679`<br>Positive_Buff_V5_spritesheet.png | 3.00× · 1.18s · allTargets · ground · ADDITIVE · center_on_target | 76 | LOW_CONFIDENCE_SELECTION<br>PRESET_STRUCTURE_REVIEW |

## Archère

| Action | Tier | Preset actuel | Candidat QA | Configuration | Score | Drapeaux |
|---|---|---|---|---|---:|---|
| `basic_longbow_hit`<br>Attaque — arc long | BASIC | `basic_longbow_hit` | `r1_0961`<br>Projectile_Wind_Ball_Lv1_spritesheet.png | 2.10× · 0.38s · target · impact · ADDITIVE · face_target | 76 | LOW_CONFIDENCE_SELECTION |
| `a_precise_shot`<br>Tir précis | 2AP | `arrow_shot` | `r1_0952`<br>Projectile_Light_Ball_Lv3_spritesheet.png | 2.20× · 0.44s · target · impact · ADDITIVE · source_to_target | 88 | DEDICATED_PRESET_REQUIRED_ON_APPLY |
| `a_hawk_leap`<br>Bond du faucon | 3AP | `leap_impact` | `r1_0707`<br>Power_Up_v10_A_Wind Rings_spritesheet.png | 2.35× · 0.56s · source · impact · ADDITIVE · source_to_destination | 76 | LOW_CONFIDENCE_SELECTION<br>DEDICATED_PRESET_REQUIRED_ON_APPLY |
| `a_arrow_rain`<br>Pluie de flèches | 4AP | `arrow_rain` | `r1_0004`<br>Arrow_Indicator_V4_spritesheet.png | 2.60× · 0.78s · groundTarget · ground · ADDITIVE · center_on_aoe_origin | 76 | LOW_CONFIDENCE_SELECTION<br>PRESET_STRUCTURE_REVIEW |
| `a_zenith_arrow`<br>Flèche du zénith | 5AP_ULTIMATE | `ultimate_zenith_arrow` | `r1_0005`<br>Arrow_Indicator_V5_spritesheet.png | 3.00× · 1.18s · target · impact · ADDITIVE · source_to_target | 76 | LOW_CONFIDENCE_SELECTION<br>PRESET_STRUCTURE_REVIEW |

## Ninja

| Action | Tier | Preset actuel | Candidat QA | Configuration | Score | Drapeaux |
|---|---|---|---|---|---:|---|
| `basic_shuriken_hit`<br>Attaque — shuriken | BASIC | `basic_shuriken_hit` | `r1_1695`<br>Claw Slash v2_spritesheet.png | 2.10× · 0.38s · target · impact · NORMAL · face_target | 88 | — |
| `ni_venom_blade`<br>Lame venimeuse | 2AP | `skill_poison_maw` | `r1_0576`<br>Impact_Poison_Lv1_spritesheet.png | 2.20× · 0.44s · target · impact · NORMAL · face_target | 88 | — |
| `ni_shadow_step`<br>Pas de l’ombre | 3AP | `pilot_ni_shadow_step` | `r1_1712`<br>Lightning Slash v1 - Flurry_spritesheet.png | 2.35× · 0.56s · source · impact · ADDITIVE · source_to_destination | 88 | — |
| `ni_smoke_bomb`<br>Bombe fumigène | 4AP | `pilot_ni_smoke_bomb` | `r1_2509`<br>Angry_Smoke_Burst_White_v2_A_spritesheet.png | 2.60× · 0.78s · source · impact · NORMAL · center_on_aoe_origin | 88 | PRESET_STRUCTURE_REVIEW |
| `ni_silent_assassin`<br>Assassin silencieux | 5AP_ULTIMATE | `ultimate_silent_assassin` | `r1_1713`<br>Lightning Slash v1 - Spin_A_spritesheet.png | 3.00× · 1.18s · target · impact · ADDITIVE · face_target | 92 | PRESET_STRUCTURE_REVIEW |

## Voleur

| Action | Tier | Preset actuel | Candidat QA | Configuration | Score | Drapeaux |
|---|---|---|---|---|---:|---|
| `basic_dagger_hit`<br>Attaque — dague | BASIC | `basic_dagger_hit` | `r1_1706`<br>Impact_Cut_V3_spritesheet.png | 2.10× · 0.38s · target · impact · NORMAL · face_target | 88 | — |
| `ro_sneak_attack`<br>Attaque sournoise | 2AP | `sword_slash` | `r1_1704`<br>Impact_Cut_V1_spritesheet.png | 2.20× · 0.44s · target · impact · NORMAL · face_target | 88 | DEDICATED_PRESET_REQUIRED_ON_APPLY |
| `ro_tumble`<br>Roulade | 3AP | `leap_impact` | `r1_2560`<br>Dash_Wind_White_v2_spritesheet.png | 2.35× · 0.56s · source · impact · ADDITIVE · source_to_destination | 88 | DEDICATED_PRESET_REQUIRED_ON_APPLY |
| `ro_jaw_trap`<br>Piège à mâchoires | 4AP | `root_vines` | `r1_0300`<br>Circle Cut Out_V1_spritesheet.png | 2.60× · 0.78s · groundTarget · ground · NORMAL · center_on_aoe_origin | 76 | LOW_CONFIDENCE_SELECTION<br>PRESET_STRUCTURE_REVIEW |
| `ro_fault_breaker`<br>Briseur de faille | 5AP_ULTIMATE | `ultimate_fault_breaker` | `r1_0438`<br>Explosion_Lightning_spritesheet.png | 3.00× · 1.18s · target · impact · ADDITIVE · face_target | 92 | PRESET_STRUCTURE_REVIEW |

## Artificier

| Action | Tier | Preset actuel | Candidat QA | Configuration | Score | Drapeaux |
|---|---|---|---|---|---:|---|
| `basic_hand_cannon_hit`<br>Attaque — canon portatif | BASIC | `basic_hand_cannon_hit` | `r1_0943`<br>Projectile_Fire_Ball_Lv4_spritesheet.png | 2.10× · 0.38s · target · impact · ADDITIVE · source_to_target | 76 | LOW_CONFIDENCE_SELECTION |
| `ar_calibrated_shot`<br>Tir calibré | 2AP | `arrow_shot` | `r1_0942`<br>Projectile_Fire_Ball_Lv3_spritesheet.png | 2.20× · 0.44s · target · impact · ADDITIVE · source_to_target | 88 | DEDICATED_PRESET_REQUIRED_ON_APPLY |
| `ar_explosive_retreat`<br>Retraite explosive | 3AP | `impact_explosion_large` | `r1_0430`<br>Explosion_Bomb_V2_spritesheet.png | 2.35× · 0.56s · source · impact · ADDITIVE · source_to_destination | 88 | — |
| `ar_incendiary_grenade`<br>Grenade incendiaire | 4AP | `skill_fire_smoke` | `r1_0431`<br>Explosion_Bomb_V3_spritesheet.png | 2.60× · 0.78s · groundTarget · ground · ADDITIVE · center_on_aoe_origin | 88 | PRESET_STRUCTURE_REVIEW |
| `ar_artillery_barrage`<br>Barrage d’artillerie | 5AP_ULTIMATE | `ultimate_artillery_barrage` | `r1_0432`<br>Explosion_Bomb_V4_spritesheet.png | 3.00× · 1.18s · groundTarget · ground · ADDITIVE · center_on_aoe_origin | 92 | PRESET_STRUCTURE_REVIEW |

## Ordre de revue humaine

1. Les 16 sélections `LOW_CONFIDENCE_SELECTION`, dont la sémantique ou la composition mérite une comparaison directe.
2. Les 24 actions 4AP/5AP `PRESET_STRUCTURE_REVIEW`, configurées sur leur slot actuel mais recommandées à 2 ou 3 étapes lors d’une future passe structurelle.
3. Les 15 actions `DEDICATED_PRESET_REQUIRED_ON_APPLY`, encore liées à une identité de preset générique partagée en production.

## Garanties de périmètre

- Aucun preset ou mapping de production modifié.
- Aucun registre `VFX_SPRITE_SHEETS` modifié.
- Aucun changement gameplay, Combat Stage ou architecture du VFX Lab.
- Aucun clic sur `VALIDATE CURRENT VFX`, aucune application, aucune vérification production.
- Aucun commit ni push.

Données exhaustives et raisons par action : `r2c-hero60-codex-artistic-preselection.json`.

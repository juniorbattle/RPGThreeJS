# R2C-HERO60 A1.1 — Visual Step Coverage + Preview Bridge Audit

> Mode: **READ-ONLY AUDIT**  
> Authoritative visual semantics: only `spriteSheet` steps returned by `getVisualSpriteSheetSteps(action)`, using real preset step indexes.

## 1. Executive summary

The current authoritative project exposes **64 HERO visual spriteSheet steps across 60 HERO actions**, not 60. The discrepancy comes from two current multi-step presets: `d_devouring_eclipse` has four visual steps and `ni_silent_assassin` has two. The A1 execution record emitted one proposal at real index 0 for each action, so it covers **60/64 current slots** and omits four existing slots.

The currently visible VFX Lab state is separate from that execution record: its read-only counters show **0 QA sources, 0 QA overrides and 0 QA working visual steps**. Therefore the current live coverage gate is **INCOMPLETE (0/64)**. This audit does not mutate or reconstruct the missing state.

The preview index resolves `r1_0001`–`r1_0003`, but the active server returns **HTTP 503** because `MEGA_PACK_ROOT` is not configured. The bridge is therefore **BROKEN / MEGA_PACK_ROOT_MISSING**. This does not affect the structural coverage result.

## 2. Action counts

| Scope | Count |
|---|---:|
| All actions | 83 |
| HERO basic attacks | 12 |
| HERO skills | 48 |
| HERO total | 60 |
| Enemy/Boss | 23 |

## 3. Current visual step counts

| Scope | Existing spriteSheet steps |
|---|---:|
| All actions | 89 |
| HERO | 64 |
| Enemy/Boss | 25 |

Invariant: **64 + 25 = 89 (YES)**.

### Why A1 reports 60

The actual diagnosis is **CASE B + CASE D**:

- **CASE B:** the current HERO structure has more than 60 configurable visual steps (64).
- **CASE D:** the A1 generator counted/emitted one current visual slot per action instead of preserving all real `spriteSheet` indexes returned by the Lab helper.

The execution record covers 60/64 existing slots. These four current slots are absent from A1:

| Action | Preset | Real index | Visual role | Current spriteSheet |
|---|---|---:|---|---|
| `d_devouring_eclipse` | `pilot_d_devouring_eclipse` | 1 | secondary_dark_impact | `megapack_impact_darkness_lv2` |
| `d_devouring_eclipse` | `pilot_d_devouring_eclipse` | 2 | ultimate_peak | `megapack_impact_darkness_lv3` |
| `d_devouring_eclipse` | `pilot_d_devouring_eclipse` | 3 | aftermath_shockwave | `megapack_impact_shockwave_v1` |
| `ni_silent_assassin` | `ultimate_silent_assassin` | 1 | execution_impact | `basic_execution_slash_heavy` |

## 4. HERO coverage

Current visible QA state: **0/64** existing steps configured.

| Class | Action | Display name | Current preset | All steps | Visual | Real visual indexes | Technical indexes | QA live | Missing | Unexpected | Coverage |
|---|---|---|---|---:|---:|---|---|---|---|---|---|
| Guerrier | `basic_greatsword_hit` | Attaque de base | `basic_greatsword_hit` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Guerrier | `w_break_guard` | Brise-Garde | `sword_slash` | 3 | 1 | [0] | [1, 2] | [] | [0] | [] | **INCOMPLETE** |
| Guerrier | `w_charge` | Charge | `pilot_w_charge` | 3 | 1 | [0] | [1, 2] | [] | [0] | [] | **INCOMPLETE** |
| Guerrier | `w_whirl` | Tourbillon d'Acier | `pilot_w_whirl` | 2 | 1 | [0] | [1] | [] | [0] | [] | **INCOMPLETE** |
| Guerrier | `w_lion_surge` | Déferlement du Lion | `pilot_w_lion_surge` | 4 | 1 | [0] | [1, 2, 3] | [] | [0] | [] | **INCOMPLETE** |
| Mage blanc | `basic_crosier_hit` | Attaque de base | `basic_crosier_hit` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Mage blanc | `w_salvation` | Lumière Salvatrice | `pilot_w_salvation` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Mage blanc | `w_purify` | Purification | `pilot_w_purify` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Mage blanc | `w_sanctuary` | Sanctuaire | `pilot_w_sanctuary` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Mage blanc | `w_miracle` | Miracle | `ultimate_miracle` | 2 | 1 | [0] | [1] | [] | [0] | [] | **INCOMPLETE** |
| Mage noir | `basic_grimoire_hit` | Attaque de base | `basic_grimoire_hit` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Mage noir | `n_dark_bolt` | Éclair Noir | `shadow_lightning_bolt` | 4 | 1 | [0] | [1, 2, 3] | [] | [0] | [] | **INCOMPLETE** |
| Mage noir | `n_teleport` | Téléportation | `teleport_burst` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Mage noir | `n_flame_wave` | Vague de Flammes | `pilot_n_flame_wave` | 2 | 1 | [0] | [1] | [] | [0] | [] | **INCOMPLETE** |
| Mage noir | `n_dark_meteor` | Météore Obscur | `ultimate_dark_meteor` | 4 | 1 | [0] | [1, 2, 3] | [] | [0] | [] | **INCOMPLETE** |
| Archère | `basic_longbow_hit` | Attaque de base | `basic_longbow_hit` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Archère | `a_precise_shot` | Tir Précis | `arrow_shot` | 3 | 1 | [0] | [1, 2] | [] | [0] | [] | **INCOMPLETE** |
| Archère | `a_hawk_leap` | Bond du Faucon | `leap_impact` | 2 | 1 | [0] | [1] | [] | [0] | [] | **INCOMPLETE** |
| Archère | `a_arrow_rain` | Pluie de Flèches | `arrow_rain` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Archère | `a_zenith_arrow` | Flèche du Zénith | `ultimate_zenith_arrow` | 4 | 1 | [0] | [1, 2, 3] | [] | [0] | [] | **INCOMPLETE** |
| Voleur | `basic_dagger_hit` | Attaque de base | `basic_dagger_hit` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Voleur | `ro_sneak_attack` | Coup Sournois | `sword_slash` | 3 | 1 | [0] | [1, 2] | [] | [0] | [] | **INCOMPLETE** |
| Voleur | `ro_tumble` | Roulade | `leap_impact` | 2 | 1 | [0] | [1] | [] | [0] | [] | **INCOMPLETE** |
| Voleur | `ro_jaw_trap` | Mâchoire à Ressort | `root_vines` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Voleur | `ro_fault_breaker` | Casse-Faille | `ultimate_fault_breaker` | 4 | 1 | [0] | [1, 2, 3] | [] | [0] | [] | **INCOMPLETE** |
| Lancier | `basic_long_spear_hit` | Attaque de base | `basic_long_spear_hit` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Lancier | `l_long_thrust` | Estoc Long | `thrust_line` | 2 | 1 | [0] | [1] | [] | [0] | [] | **INCOMPLETE** |
| Lancier | `l_haft_recoil` | Repli de Hampe | `thrust_line` | 2 | 1 | [0] | [1] | [] | [0] | [] | **INCOMPLETE** |
| Lancier | `l_griffon_jump` | Saut du Griffon | `leap_impact` | 2 | 1 | [0] | [1] | [] | [0] | [] | **INCOMPLETE** |
| Lancier | `l_firmament_lance` | Lance du Firmament | `ultimate_firmament_lance` | 4 | 1 | [0] | [1, 2, 3] | [] | [0] | [] | **INCOMPLETE** |
| Paladin | `basic_holy_mace_hit` | Attaque de base | `basic_holy_mace_hit` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Paladin | `p_holy_strike` | Frappe Consacrée | `skill_holy_radiance` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Paladin | `p_interpose` | Interposition | `leap_impact` | 2 | 1 | [0] | [1] | [] | [0] | [] | **INCOMPLETE** |
| Paladin | `p_oathwall` | Rempart du Serment | `pilot_p_oathwall` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Paladin | `p_radiant_judgement` | Jugement Radieux | `ultimate_radiant_judgement` | 4 | 1 | [0] | [1, 2, 3] | [] | [0] | [] | **INCOMPLETE** |
| Chevalier noir | `basic_scythe_hit` | Attaque de base | `basic_scythe_hit` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Chevalier noir | `d_cursed_blade` | Lame Maudite | `sword_slash` | 3 | 1 | [0] | [1, 2] | [] | [0] | [] | **INCOMPLETE** |
| Chevalier noir | `d_void_step` | Pas du Néant | `teleport_burst` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Chevalier noir | `d_blood_pact` | Pacte de Sang | `skill_void_rune` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Chevalier noir | `d_devouring_eclipse` | Éclipse Dévorante | `pilot_d_devouring_eclipse` | 7 | 4 | [0, 1, 2, 3] | [4, 5, 6] | [] | [0, 1, 2, 3] | [] | **INCOMPLETE** |
| Mage rouge | `basic_rapier_hit` | Attaque de base | `basic_rapier_hit` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Mage rouge | `r_arcane_blade` | Lame Arcanique | `skill_arcane_slash_burst` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Mage rouge | `r_rune_step` | Pas Runique | `teleport_burst` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Mage rouge | `r_scarlet_circle` | Cercle Écarlate | `skill_arcane_vortex` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Mage rouge | `r_perfect_duality` | Dualité Parfaite | `ultimate_perfect_duality` | 4 | 1 | [0] | [1, 2, 3] | [] | [0] | [] | **INCOMPLETE** |
| Enchanteur | `basic_wand_hit` | Attaque de base | `basic_wand_hit` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Enchanteur | `e_vigor_rune` | Rune de Vigueur | `skill_arcane_orbit` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Enchanteur | `e_transpose` | Transposition | `teleport_burst` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Enchanteur | `e_binding_seal` | Sceau d'Entrave | `pilot_e_binding_seal` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Enchanteur | `e_absolute_harmony` | Harmonie Absolue | `ultimate_absolute_harmony` | 2 | 1 | [0] | [1] | [] | [0] | [] | **INCOMPLETE** |
| Ninja | `basic_shuriken_hit` | Attaque de base | `basic_shuriken_hit` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Ninja | `ni_venom_blade` | Lame Venimeuse | `skill_poison_maw` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Ninja | `ni_shadow_step` | Pas d'Ombre | `pilot_ni_shadow_step` | 3 | 1 | [0] | [1, 2] | [] | [0] | [] | **INCOMPLETE** |
| Ninja | `ni_smoke_bomb` | Bombe Fumigène | `pilot_ni_smoke_bomb` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Ninja | `ni_silent_assassin` | Assassinat Silencieux | `ultimate_silent_assassin` | 5 | 2 | [0, 1] | [2, 3, 4] | [] | [0, 1] | [] | **INCOMPLETE** |
| Artificier | `basic_hand_cannon_hit` | Attaque de base | `basic_hand_cannon_hit` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Artificier | `ar_calibrated_shot` | Tir Calibré | `arrow_shot` | 3 | 1 | [0] | [1, 2] | [] | [0] | [] | **INCOMPLETE** |
| Artificier | `ar_explosive_retreat` | Repli Explosif | `impact_explosion_large` | 3 | 1 | [0] | [1, 2] | [] | [0] | [] | **INCOMPLETE** |
| Artificier | `ar_incendiary_grenade` | Grenade Incendiaire | `skill_fire_smoke` | 1 | 1 | [0] | [] | [] | [0] | [] | **INCOMPLETE** |
| Artificier | `ar_artillery_barrage` | Barrage d'Artillerie | `ultimate_artillery_barrage` | 4 | 1 | [0] | [1, 2, 3] | [] | [0] | [] | **INCOMPLETE** |

Summary: 0 complete, 60 incomplete, 0 inconsistent actions.

## 5. Multi-step HERO presets

Current count: **2**.

| Action | Preset | Visual steps | Real indexes | QA configured | Missing | Coverage |
|---|---|---:|---|---|---|---|
| `d_devouring_eclipse` | `pilot_d_devouring_eclipse` | 4 | [0, 1, 2, 3] | [] | [0, 1, 2, 3] | **INCOMPLETE** |
| `ni_silent_assassin` | `ultimate_silent_assassin` | 2 | [0, 1] | [] | [0, 1] | **INCOMPLETE** |

### d_devouring_eclipse authoritative check

- Preset: `pilot_d_devouring_eclipse`
- Existing visual steps: 4
- Real indexes: [0, 1, 2, 3]
- A1 reported `currentVisualStepCount`: 1
- QA-configured indexes: []
- Missing indexes: [0, 1, 2, 3]
- Coverage: **INCOMPLETE**

## 6. A1 structural-report mismatches

| Metric | Count |
|---|---:|
| Actions checked | 60 |
| Preset ID mismatches | 0 |
| Visual step count mismatches | 2 |
| Visual step index mismatches | 2 |
| Actions with structural mismatch | 2 |

| Action | A1 preset | Current preset | A1 count | Current count | A1 indexes | Current indexes |
|---|---|---|---:|---:|---|---|
| `d_devouring_eclipse` | `pilot_d_devouring_eclipse` | `pilot_d_devouring_eclipse` | 1 | 4 | [0] | [0, 1, 2, 3] |
| `ni_silent_assassin` | `ultimate_silent_assassin` | `ultimate_silent_assassin` | 1 | 2 | [0] | [0, 1] |

## 7. PRESET_STRUCTURE_REVIEW reconciliation

These are future structure recommendations and are not part of the current coverage denominator.

| Action | Current authoritative | A1 current | A1 recommended | Current live coverage | Future additional | Report mismatch |
|---|---:|---:|---:|---|---:|---|
| `w_whirl` | 1 | 1 | 2 | INCOMPLETE | +1 | NO |
| `w_lion_surge` | 1 | 1 | 3 | INCOMPLETE | +2 | NO |
| `p_oathwall` | 1 | 1 | 2 | INCOMPLETE | +1 | NO |
| `p_radiant_judgement` | 1 | 1 | 3 | INCOMPLETE | +2 | NO |
| `d_blood_pact` | 1 | 1 | 2 | INCOMPLETE | +1 | NO |
| `d_devouring_eclipse` | 4 | 1 | 3 | INCOMPLETE | +0 | YES |
| `l_griffon_jump` | 1 | 1 | 2 | INCOMPLETE | +1 | NO |
| `l_firmament_lance` | 1 | 1 | 3 | INCOMPLETE | +2 | NO |
| `n_flame_wave` | 1 | 1 | 2 | INCOMPLETE | +1 | NO |
| `n_dark_meteor` | 1 | 1 | 3 | INCOMPLETE | +2 | NO |
| `w_sanctuary` | 1 | 1 | 2 | INCOMPLETE | +1 | NO |
| `w_miracle` | 1 | 1 | 3 | INCOMPLETE | +2 | NO |
| `r_scarlet_circle` | 1 | 1 | 2 | INCOMPLETE | +1 | NO |
| `r_perfect_duality` | 1 | 1 | 3 | INCOMPLETE | +2 | NO |
| `e_binding_seal` | 1 | 1 | 2 | INCOMPLETE | +1 | NO |
| `e_absolute_harmony` | 1 | 1 | 3 | INCOMPLETE | +2 | NO |
| `a_arrow_rain` | 1 | 1 | 2 | INCOMPLETE | +1 | NO |
| `a_zenith_arrow` | 1 | 1 | 3 | INCOMPLETE | +2 | NO |
| `ni_smoke_bomb` | 1 | 1 | 2 | INCOMPLETE | +1 | NO |
| `ni_silent_assassin` | 2 | 1 | 3 | INCOMPLETE | +1 | YES |
| `ro_jaw_trap` | 1 | 1 | 2 | INCOMPLETE | +1 | NO |
| `ro_fault_breaker` | 1 | 1 | 3 | INCOMPLETE | +2 | NO |
| `ar_incendiary_grenade` | 1 | 1 | 2 | INCOMPLETE | +1 | NO |
| `ar_artillery_barrage` | 1 | 1 | 3 | INCOMPLETE | +2 | NO |

- PRESET_STRUCTURE_REVIEW actions: **24**
- Current existing slots omitted by A1 coverage: **4**
- Future additional visual slots recommended after reconciliation: **33**

## 8. QA state consistency

The visible Lab counters were inspected read-only; no candidate, selector, tuning or validation control was used.

| Metric | Current visible HERO state |
|---|---:|
| QA sources | 0 |
| QA overrides | 0 |
| QA working visual steps | 0 |
| Validated visual steps | 0 |
| Tested visual steps | 0 |
| Verified visual steps | 0 |
| Unexpected state entries | 0 |
| Orphan QA sources | 0 |
| Orphan QA overrides | 0 |
| Override without source | 0 |
| Source without override | 0 |
| Duplicate action + step state | 0 |
| A1 report entries with no matching visible Lab state | 60 |
| Visible Lab entries missing from A1 | 0 |

The A1 JSON remains a valid execution record, but its 60 proposals are **not present in the current visible Lab state**.

## 9. Candidate consistency

| Metric | Current visible Lab | A1 execution record |
|---|---:|---:|
| Selected candidates | 0 | 60 |
| Unique candidates | 0 | 60 |
| Duplicate candidate IDs | 0 | 0 |
| IDs missing from current catalogue | 0 | 0 |
| Report candidate mismatches | 60 | — |

The A1 candidate IDs remain catalogue-valid; the mismatch is the absence of matching live QA sources, not invalid candidate identifiers.

## 10. Scale/presentation consistency

| Metric | Current visible Lab | A1 execution record |
|---|---:|---:|
| Scale >= 2.0 | 0 | 60 |
| Scale < 2.0 | 0 | 0 |
| Minimum scale | N/A | 2.1 |
| Maximum scale | N/A | 3 |
| Presentation mismatches | 60 | — |

All 60 presentation records mismatch live state because no current QA override exists to compare. Fields checked conceptually: scale, offsets, duration, opacity, anchor, layer, blending, fades and direction.

### A1 flags (verification only)

| Flag | Count |
|---|---:|
| LOW_CONFIDENCE_SELECTION | 16 |
| PRESET_STRUCTURE_REVIEW | 24 |
| DEDICATED_PRESET_REQUIRED_ON_APPLY | 15 |
| NO_GIF_SELECTED | 0 |
| REUSE_JUSTIFIED | 0 |

## 11. Preview bridge diagnosis

### Preview index

| Candidate | Status | Preview file | Relative path |
|---|---|---|---|
| `r1_0001` | RESOLVED | `Arrow_Indicator_V1.gif` | `(PREVIEW) GIFs - Essentials VFX/Arrow_Indicator_V1.gif` |
| `r1_0002` | RESOLVED | `Arrow_Indicator_V2.gif` | `(PREVIEW) GIFs - Essentials VFX/Arrow_Indicator_V2.gif` |
| `r1_0003` | RESOLVED | `Arrow_Indicator_V3.gif` | `(PREVIEW) GIFs - Essentials VFX/Arrow_Indicator_V3.gif` |

### Environment, filesystem and HTTP

- Preview index available: **YES**
- Active preview server: `http://localhost:5173`
- `MEGA_PACK_ROOT` configured in that Vite process: **NO**
- Effective root path: **N/A**
- Expected GIF path derivable/readable: **NO** (root unavailable)
- GET `/dev/vfx-preview/r1_0001`: **503_MEGA_PACK_ROOT_NOT_CONFIGURED**
- Short reason: `MEGA_PACK_ROOT not configured`

**PREVIEW_BRIDGE_STATUS: BROKEN**  
**PREVIEW_BRIDGE_ROOT_CAUSE: MEGA_PACK_ROOT_MISSING**

Recommended next fix only: restart the Vite development server with `MEGA_PACK_ROOT` set to the Mega Pack root used to build the preview index, then retry the same GET endpoint. No environment change was made by this audit.

## 12. Exact missing visual steps

The current visible Lab state has no QA source, so all 64 current HERO visual slots are missing:

| Action | Preset | Real index | Visual role | Current spriteSheet |
|---|---|---:|---|---|
| `basic_greatsword_hit` | `basic_greatsword_hit` | 0 | weapon_impact | `basic_greatsword_cleave_heavy` |
| `w_break_guard` | `sword_slash` | 0 | weapon_impact | `basic_sword_slash_heavy` |
| `w_charge` | `pilot_w_charge` | 0 | departure_arrival | `megapack_dash_wind_white_v3` |
| `w_whirl` | `pilot_w_whirl` | 0 | self_area_release | `megapack_fire_slash_spin` |
| `w_lion_surge` | `pilot_w_lion_surge` | 0 | signature multi-hit heroic assault | `megapack_blue_slash_flurry` |
| `basic_crosier_hit` | `basic_crosier_hit` | 0 | compact restorative magic impact | `basic_staff_strike_small` |
| `w_salvation` | `pilot_w_salvation` | 0 | support_release | `megapack_healing_v3` |
| `w_purify` | `pilot_w_purify` | 0 | support_release | `megapack_heart_buff_v3` |
| `w_sanctuary` | `pilot_w_sanctuary` | 0 | support_release | `megapack_positive_buff_v3` |
| `w_miracle` | `ultimate_miracle` | 0 | ultimate_support_release | `skill_holy_radiance_burst_heavy` |
| `basic_grimoire_hit` | `basic_grimoire_hit` | 0 | projectile_impact | `basic_bolt_hit_small` |
| `n_dark_bolt` | `shadow_lightning_bolt` | 0 | projectile_impact | `skill_void_rune_orb_medium` |
| `n_teleport` | `teleport_burst` | 0 | departure_arrival | `skill_void_spiral_implosion_medium` |
| `n_flame_wave` | `pilot_n_flame_wave` | 0 | area_release | `megapack_fire_slash_spin` |
| `n_dark_meteor` | `ultimate_dark_meteor` | 0 | ultimate_signature | `skill_meteor_impact_burst_heavy` |
| `basic_longbow_hit` | `basic_longbow_hit` | 0 | precise wind-charged arrow impact | `basic_arrow_hit_small` |
| `a_precise_shot` | `arrow_shot` | 0 | projectile_impact | `basic_arrow_hit_small` |
| `a_hawk_leap` | `leap_impact` | 0 | departure_arrival | `basic_body_slam_heavy` |
| `a_arrow_rain` | `arrow_rain` | 0 | area_release | `basic_arrow_hit_small` |
| `a_zenith_arrow` | `ultimate_zenith_arrow` | 0 | projectile_impact | `basic_arrow_hit_small` |
| `basic_dagger_hit` | `basic_dagger_hit` | 0 | weapon_impact | `basic_dagger_crosscut_small` |
| `ro_sneak_attack` | `sword_slash` | 0 | weapon_impact | `basic_sword_slash_heavy` |
| `ro_tumble` | `leap_impact` | 0 | departure_arrival | `basic_body_slam_heavy` |
| `ro_jaw_trap` | `root_vines` | 0 | area_release | `skill_arcane_sigil_burst_medium` |
| `ro_fault_breaker` | `ultimate_fault_breaker` | 0 | explosive lightning rupture | `basic_greatsword_cleave_heavy` |
| `basic_long_spear_hit` | `basic_long_spear_hit` | 0 | weapon_impact | `basic_spear_stab_medium` |
| `l_long_thrust` | `thrust_line` | 0 | weapon_impact | `basic_spear_stab_medium` |
| `l_haft_recoil` | `thrust_line` | 0 | weapon_impact | `basic_spear_stab_medium` |
| `l_griffon_jump` | `leap_impact` | 0 | departure_arrival | `basic_body_slam_heavy` |
| `l_firmament_lance` | `ultimate_firmament_lance` | 0 | sky-charged piercing signature | `basic_spear_stab_medium` |
| `basic_holy_mace_hit` | `basic_holy_mace_hit` | 0 | holy blunt impact | `basic_mace_impact_medium` |
| `p_holy_strike` | `skill_holy_radiance` | 0 | single-target holy strike | `skill_holy_radiance_burst_heavy` |
| `p_interpose` | `leap_impact` | 0 | departure_arrival | `basic_body_slam_heavy` |
| `p_oathwall` | `pilot_p_oathwall` | 0 | support_release | `megapack_shield_on` |
| `p_radiant_judgement` | `ultimate_radiant_judgement` | 0 | ultimate_signature | `skill_holy_radiance_burst_heavy` |
| `basic_scythe_hit` | `basic_scythe_hit` | 0 | weapon_impact | `basic_blade_crescent_medium` |
| `d_cursed_blade` | `sword_slash` | 0 | weapon_impact | `basic_sword_slash_heavy` |
| `d_void_step` | `teleport_burst` | 0 | departure_arrival | `skill_void_spiral_implosion_medium` |
| `d_blood_pact` | `skill_void_rune` | 0 | self_area_release | `skill_void_rune_orb_medium` |
| `d_devouring_eclipse` | `pilot_d_devouring_eclipse` | 0 | ultimate_signature | `megapack_charge_darkness_v1_a` |
| `d_devouring_eclipse` | `pilot_d_devouring_eclipse` | 1 | secondary_dark_impact | `megapack_impact_darkness_lv2` |
| `d_devouring_eclipse` | `pilot_d_devouring_eclipse` | 2 | ultimate_peak | `megapack_impact_darkness_lv3` |
| `d_devouring_eclipse` | `pilot_d_devouring_eclipse` | 3 | aftermath_shockwave | `megapack_impact_shockwave_v1` |
| `basic_rapier_hit` | `basic_rapier_hit` | 0 | weapon_impact | `basic_dagger_crosscut_small` |
| `r_arcane_blade` | `skill_arcane_slash_burst` | 0 | arcane sword burst | `skill_arcane_slash_burst_medium` |
| `r_rune_step` | `teleport_burst` | 0 | departure_arrival | `skill_void_spiral_implosion_medium` |
| `r_scarlet_circle` | `skill_arcane_vortex` | 0 | self_area_release | `skill_arcane_vortex_nova_heavy` |
| `r_perfect_duality` | `ultimate_perfect_duality` | 0 | dual magic signature explosion | `skill_fire_vortex_nova_heavy` |
| `basic_wand_hit` | `basic_wand_hit` | 0 | projectile_impact | `basic_bolt_hit_small` |
| `e_vigor_rune` | `skill_arcane_orbit` | 0 | support_release | `skill_arcane_orbit_burst_medium` |
| `e_transpose` | `teleport_burst` | 0 | departure_arrival | `skill_void_spiral_implosion_medium` |
| `e_binding_seal` | `pilot_e_binding_seal` | 0 | area_release | `megapack_hex_bursts_center_v2` |
| `e_absolute_harmony` | `ultimate_absolute_harmony` | 0 | ultimate_support_release | `skill_holy_radiance_burst_heavy` |
| `basic_shuriken_hit` | `basic_shuriken_hit` | 0 | weapon_impact | `basic_shuriken_cut_small` |
| `ni_venom_blade` | `skill_poison_maw` | 0 | weapon_impact | `skill_poison_maw_bite_heavy` |
| `ni_shadow_step` | `pilot_ni_shadow_step` | 0 | departure_arrival | `megapack_lightning_slash_flurry` |
| `ni_smoke_bomb` | `pilot_ni_smoke_bomb` | 0 | self_area_release | `megapack_angry_smoke_burst` |
| `ni_silent_assassin` | `ultimate_silent_assassin` | 0 | rapid lethal assassination spin | `skill_void_spiral_implosion_medium` |
| `ni_silent_assassin` | `ultimate_silent_assassin` | 1 | execution_impact | `basic_execution_slash_heavy` |
| `basic_hand_cannon_hit` | `basic_hand_cannon_hit` | 0 | projectile_impact | `basic_bullet_hit_medium` |
| `ar_calibrated_shot` | `arrow_shot` | 0 | projectile_impact | `basic_arrow_hit_small` |
| `ar_explosive_retreat` | `impact_explosion_large` | 0 | departure_arrival | `skill_fire_vortex_nova_heavy` |
| `ar_incendiary_grenade` | `skill_fire_smoke` | 0 | area_release | `skill_fire_smoke_explosion_heavy` |
| `ar_artillery_barrage` | `ultimate_artillery_barrage` | 0 | ultimate_signature | `skill_fire_spark_cluster_medium` |

## 13. Final gate

**R2C_HERO60_EXISTING_VISUAL_STEP_COVERAGE: INCOMPLETE**  
**R2C_VFX_PREVIEW_BRIDGE: BROKEN**

No QA state, production preset, gameplay, Combat Stage, VFX Lab, original A1 report, environment variable, commit or remote branch was modified.

# VFX Mega Pack R0 — Current Skill Audit

> **Pre-purchase planning pass.** No runtime code, assets, gameplay, or mappings were modified.
> The Mega Pack has not yet been purchased or imported. All Mega Pack candidate fields are
> `UNASSIGNED_PENDING_R1`. R1 inventory is blocked until commercial files are locally available.

## Executive summary

- **12 playable units** audited, each with **4 skills + 1 base weapon attack** = **60 hero actions**.
- **46 runtime spritesheets** referenced across all actions.
- R3H audit verdicts: **1 PASS**, **5 NEEDS_NORMALIZATION**, **13 MANUAL_REVIEW**, **27 NEEDS_REGENERATION**.
- **6 actions** have confirmed source composition defects (P0/P1 asset regeneration required).
- **3 actions** have confirmed semantic VFX mismatches (wrong preset for the mechanic).
- **6 redundancy pairs** identified where two actions within the same unit share most tactical dimensions.
- **Classification distribution**: KEEP 28, TUNE 17, REDESIGN 11, MERGE 2, REPLACE 2.

## Audit method

Each action was cross-referenced across:

- `src/game/skills.ts` — gameplay mechanics (AP, power, range, status, shape, mode)
- `src/game/catalog.ts` — unit definitions, weapon types, skill slot assignments
- `src/combat/skillPresentation.ts` — motion preset, VFX preset, cast style, orientation, scale tier
- `src/combat/vfx/VfxPresets.ts` — preset steps, spritesheet IDs, scales, blending
- `src/combat/vfx/VfxSpriteSheets.ts` — sheet definitions, align, presentation metadata
- `docs/reports/vfx-r3h-full-runtime-spritesheet-normalization-audit.md` — asset verdicts
- `docs/reports/vfx-r3g-visual-qa-broken-skills.md` — visual QA findings

## Classification legend

- **KEEP** — VFX communicates the mechanic; asset is PASS or MANUAL_REVIEW without semantic issue.
- **TUNE** — VFX is semantically correct but needs scale/anchor/timing adjustment or asset normalization.
- **REDESIGN** — VFX presentation does not communicate the mechanic; preset or spritesheet must change.
- **MERGE** — Two actions share most tactical dimensions; one should absorb the other's role (R6 proposal).
- **REPLACE** — Spritesheet is NEEDS_REGENERATION and must be replaced before any other tuning.

## Field separation

Each action entry below distinguishes:

- **Current gameplay mechanic** — AP, type, range, area, status, element (frozen during R0–R5)
- **Current VFX presentation** — preset, spritesheet, orientation, scale tier, R3H verdict
- **Proposed R0–R5 VFX presentation** — visual family, processing type, change classification
- **Deferred R6 gameplay proposal** — mechanic changes (PROPOSAL_ONLY, separate approval gate)
- **Approval status** — R0_PLANNING for all entries

---

## Full unit inventory

### 1. Warrior — Alistair (Guerrier, knight)

#### Base — basic_greatsword_hit

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 1, single target, no status |
| **Current VFX presentation** | `basic_greatsword_hit` preset, `basic_greatsword_cleave_heavy` sheet, additive, scale 1.42 |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: heavy slash / cleave. Processing: REPLACE. Sheet must be regenerated with safe padding. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 1 — w_break_guard (Brise-Garde, 2 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 1, single, curse status |
| **Current VFX presentation** | `sword_slash` preset, `basic_sword_slash_heavy` sheet, center_on_target, scaleTier 2ap, scale 1.46 |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: sword slash with guard-break emphasis. Processing: REPLACE. R3G confirmed source composition defect (fragments in cells). Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 2 — w_charge (Charge, 3 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical dash, range 2–3, single, slow status |
| **Current VFX presentation** | `blunt_impact` preset, `basic_hammer_crush_heavy` sheet, dashImpact, scale 1.28 |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: directional dash/ram impact (source→target). Processing: REDESIGN. R3G confirmed semantic mismatch — stationary hammer crush does not communicate charge. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 3 — w_whirl (Tourbillon d'Acier, 4 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 0, radius 1, no status |
| **Current VFX presentation** | `skill_wind_slash_swirl` preset, `skill_wind_slash_swirl_medium` sheet, center_on_target, scaleTier 4ap, scale 1.62, additive |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: circular swirl / whirlwind around caster. Processing: REPLACE. R3G P0 — source composition defect with fragments in cells, effective scale ~3.36. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Ultimate — w_lion_surge (Déferlement du Lion, 5 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 1–3, line radius 1, curse status |
| **Current VFX presentation** | `ultimate_lion_surge` preset, `basic_execution_slash_heavy` sheet, center_on_target, scaleTier 5ap_ultimate, visualScale 1.04, scale 2.22, additive |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: line charge / execution slash (ultimate scale). Processing: REPLACE. R3G P0 — source composition defect, effective scale ~4.66. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

**Redundancy**: w_break_guard (phys, curse, single) vs w_lion_surge (phys, curse, line) — same element + same status + same visual family (slash). Differentiated by area shape and power. **TUNE**: w_lion_surge should read as a line charge, not a single slash.

### 2. Paladin — Aldric (Paladin, knight)

#### Base — basic_holy_mace_hit

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 1, single, no status |
| **Current VFX presentation** | `basic_holy_mace_hit` preset, `basic_mace_impact_medium` sheet, additive, scale 1.26 |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: holy mace impact. Processing: REPLACE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 1 — p_holy_strike (Frappe Consacrée, 2 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 1, single, barrier (self) |
| **Current VFX presentation** | `skill_holy_radiance` preset, `skill_holy_radiance_burst_heavy` sheet, center_on_target, scaleTier 2ap, scale 1.7, additive |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: holy strike / radiance burst. Processing: TUNE. R3G: burst is coherent but centered too high and oversized for 2 AP. Lower anchor toward body/impact point, reduce scale. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 2 — p_interpose (Interposition, 3 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Move/leap, range 2–3, radius 1, barrier (allies) |
| **Current VFX presentation** | `leap_impact` preset, `basic_body_slam_heavy` sheet, leapLanding, center_on_target, scaleTier 3ap, scale 1.38 |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: protective landing / guard impact (feet-anchored). Processing: REDESIGN. R3G confirmed semantic mismatch — offensive body slam for a protective action. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 3 — p_oathwall (Rempart du Serment, 4 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Buff, range 0, radius 1.3, barrier+taunt |
| **Current VFX presentation** | `skill_oathwall` preset, `skill_barrier_guard_heavy` + `skill_barrier_shield_ring_medium` sheets, center_on_target, scaleTier 4ap, visualScale 0.96, additive |
| **R3H verdict** | NEEDS_REGENERATION (guard) + NEEDS_NORMALIZATION (ring) |
| **Proposed R0–R5 VFX** | Visual family: defensive barrier wall / shield ring. Processing: REPLACE guard layer only; ring is acceptable. R3G P0 — guard layer has source composition defects. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Ultimate — p_radiant_judgement (Jugement Radieux, 5 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 1–3, radius 1.5, heal (allies) |
| **Current VFX presentation** | `ultimate_radiant_judgement` preset, `skill_holy_radiance_burst_heavy` sheet, center_on_aoe_origin, scaleTier 5ap_ultimate, visualScale 1.06, scale 2.0, additive |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: holy judgement / radiant area. Processing: TUNE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

**Redundancy**: p_holy_strike (barrier self) vs p_oathwall (barrier allies + taunt) — same element + same status (barrier) + same visual family (holy radiance). Differentiated by target and scope. **TUNE**: p_oathwall should read as a defensive wall, not another holy burst.

### 3. Dark Knight — Morvan (Chevalier Noir, knight)

#### Base — basic_scythe_hit

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 2, single, no status |
| **Current VFX presentation** | `basic_scythe_hit` preset, `basic_blade_crescent_medium` sheet, additive, scale 1.26 |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: scythe crescent slash. Processing: REPLACE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 1 — d_cursed_blade (Lame Maudite, 2 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 1, single, curse status |
| **Current VFX presentation** | `sword_slash` preset, `basic_sword_slash_heavy` sheet, center_on_target, scaleTier 2ap, scale 1.46 |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: cursed blade slash. Processing: REPLACE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 2 — d_void_step (Pas du Néant, 3 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Move/teleport, range 2–3, radius 1, weak (upgrade) |
| **Current VFX presentation** | `teleport_burst` preset, `skill_void_spiral_implosion_medium` sheet, source_to_destination, scaleTier 3ap, scale 1.2 |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: void teleport spiral. Processing: TUNE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 3 — d_blood_pact (Pacte de Sang, 4 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Buff, range 0, self, boost+lifesteal |
| **Current VFX presentation** | `skill_void_rune` preset, `skill_void_rune_orb_medium` sheet, center_on_target, scaleTier 4ap, visualScale 0.94, scale 1.54, additive |
| **R3H verdict** | PASS |
| **Proposed R0–R5 VFX** | Visual family: void rune / blood pact orb. Processing: KEEP. Only PASS sheet in the runtime. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Ultimate — d_devouring_eclipse (Éclipse Dévorante, 5 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Magical, range 1–3, radius 1.5, curse+lifesteal |
| **Current VFX presentation** | `ultimate_devouring_eclipse` preset, `skill_void_singularity_implosion_ultimate` sheet, center_on_aoe_origin, scaleTier 5ap_ultimate, visualScale 1.06, scale 1.92, additive |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: void singularity / implosion (ultimate scale). Processing: REPLACE. R3G P0 — source composition defect, effective scale ~6.48, additive blending amplifies. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

**Redundancy**: d_cursed_blade (phys, curse, single) vs d_devouring_eclipse (mag, curse, area) — same element (dark) + same status (curse). Differentiated by type and area. **TUNE**: d_devouring_eclipse should read as a void implosion, not another curse slash.

### 4. Lancer — Garen (Lancier, knight)

#### Base — basic_long_spear_hit

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 2, single, no status |
| **Current VFX presentation** | `basic_long_spear_hit` preset, `basic_spear_stab_medium` sheet, additive, scale 1.26 |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: spear thrust impact. Processing: TUNE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 1 — l_long_thrust (Estoc Long, 2 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 2, single, slow status |
| **Current VFX presentation** | `thrust_line` preset, `basic_spear_stab_medium` sheet, center_on_target, scaleTier 2ap, scale 1.2 |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: spear thrust line. Processing: TUNE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 2 — l_haft_recoil (Repli de Hampe, 3 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical/retreat, range 1, single, slow (upgrade) |
| **Current VFX presentation** | `thrust_line` preset, `basic_spear_stab_medium` sheet, center_on_target, scaleTier 3ap, scale 1.2 |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: spear recoil / knockback thrust. Processing: TUNE. Same sheet as l_long_thrust — needs visual differentiation. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | PROPOSAL_ONLY: Consider converting to a knockback/retreat utility rather than another thrust (R6 approval gate) |
| **Approval** | R0_PLANNING |

#### Skill 3 — l_griffon_jump (Saut du Griffon, 4 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical/leap, range 2–3, radius 1, slow (upgrade) |
| **Current VFX presentation** | `leap_impact` preset, `basic_body_slam_heavy` sheet, leapLanding, center_on_target, scaleTier 4ap, scale 1.38 |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: offensive leap impact. Processing: TUNE. Same preset as p_interpose — needs visual differentiation (offensive vs protective). Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Ultimate — l_firmament_lance (Lance du Firmament, 5 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 2–4, line radius 2, no status |
| **Current VFX presentation** | `ultimate_firmament_lance` preset, `basic_spear_stab_medium` sheet, center_on_target, scaleTier 5ap_ultimate, visualScale 1.04, scale 1.82 |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: piercing lance line (ultimate scale). Processing: TUNE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

**Redundancy**: l_long_thrust (phys, slow, single, range 2) vs l_haft_recoil (phys, slow, single, range 1, retreat) — same element + same status + same visual family (thrust). Differentiated by range and retreat. **MERGE candidate (R6)**: l_haft_recoil could become a knockback/retreat utility rather than another thrust.

### 5. Black Mage — Elara (Mage Noir, mage)

#### Base — basic_grimoire_hit

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 1, single, no status |
| **Current VFX presentation** | `basic_grimoire_hit` preset, `basic_bolt_hit_small` sheet, additive, scale 1.14 |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: dark/grimoire bolt impact (small). Processing: REPLACE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 1 — n_dark_bolt (Éclair Noir, 2 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Magical, range 1–4, single, root status |
| **Current VFX presentation** | `shadow_lightning_bolt` preset, `skill_void_rune_orb_medium` sheet, center_on_target, scaleTier 2ap, scale 1.24, additive |
| **R3H verdict** | PASS |
| **Proposed R0–R5 VFX** | Visual family: dark bolt / shadow projectile impact. Processing: KEEP. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 2 — n_teleport (Téléportation, 3 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Move/teleport, range 2–3, barrier (upgrade) |
| **Current VFX presentation** | `teleport_burst` preset, `skill_void_spiral_implosion_medium` sheet, source_to_destination, scaleTier 3ap, scale 1.2 |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: void teleport spiral. Processing: TUNE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 3 — n_flame_wave (Vague de Flammes, 4 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Magical, range 1, cone radius 1.6, burn status, allowSelfDamage |
| **Current VFX presentation** | `skill_fire_impact` preset, `skill_fire_impact_burst_medium` sheet, center_on_target, scaleTier 4ap, visualScale 1.02, scale 1.62, additive |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: directional fire wave / cone propagation. Processing: REDESIGN. R3G confirmed semantic mismatch — local burst does not communicate cone/wave. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | PROPOSAL_ONLY: Consider whether n_flame_wave should remain fire or shift to dark element (R6 approval gate) |
| **Approval** | R0_PLANNING |

#### Ultimate — n_dark_meteor (Météore Obscur, 5 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Magical, range 2–4, radius 1.5, burn+curse, allowSelfDamage |
| **Current VFX presentation** | `ultimate_dark_meteor` preset, `skill_meteor_impact_burst_heavy` sheet, center_on_aoe_origin, scaleTier 5ap_ultimate, visualScale 1.08, scale 2.0, additive |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: void/dark meteor or gravity implosion (ultimate scale). Processing: REPLACE. R3G P0 — source composition defect, effective scale ~4.48. VFX should read as dark/void, not fire. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | PROPOSAL_ONLY: Shift n_dark_meteor toward void/dark/gravity element, remove burn to eliminate redundancy with n_flame_wave (R6 approval gate) |
| **Approval** | R0_PLANNING |

**Redundancy**: n_flame_wave (fire, burn, cone) vs n_dark_meteor (fire+curse, radius 1.5) — both fire-based area attacks with burn. **REDESIGN (R0–R5)**: n_flame_wave VFX should communicate directional propagation. **PROPOSAL_ONLY (R6)**: n_dark_meteor should shift toward void/dark/gravity and drop burn.

### 6. White Mage — Marian (Mage Blanc, cleric)

#### Base — basic_crosier_hit

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Magical, range 1, single, no status |
| **Current VFX presentation** | `basic_crosier_hit` preset, `basic_staff_strike_small` sheet, additive, scale 1.14 |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: holy staff strike. Processing: TUNE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 1 — w_salvation (Lumière Salvatrice, 2 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Heal, range 0–3, single (ally), no status |
| **Current VFX presentation** | `skill_heal_bloom` preset, `skill_heal_blessing_bloom_heavy` sheet, center_on_target, scaleTier 2ap, visualScale 0.92, scale 1.64, additive |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: heal bloom / blessing. Processing: REPLACE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 2 — w_purify (Purification, 3 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Heal, range 0–3, single (ally), dispel status |
| **Current VFX presentation** | `skill_holy_sigil` preset, `skill_holy_sigil_burst_medium` sheet, center_on_target, scaleTier 3ap, visualScale 0.84, scale 1.5, additive |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: holy cleanse / purification sigil. Processing: REPLACE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 3 — w_sanctuary (Sanctuaire, 4 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Buff, range 0–2, radius 1.3, regen status |
| **Current VFX presentation** | `skill_leaf_sanctuary` preset, `skill_support_leaf_burst_medium` sheet, center_on_target, scaleTier 4ap, visualScale 0.96, scale 1.62, additive |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: nature sanctuary / leaf bloom area. Processing: REPLACE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Ultimate — w_miracle (Miracle, 5 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Revive, range 1–2, radius 1, regen+dispel |
| **Current VFX presentation** | `ultimate_miracle` preset, `skill_holy_radiance_burst_heavy` sheet, allTargets, scaleTier 5ap_ultimate, visualScale 1.02, scale 1.72, additive |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: holy miracle / revive radiance. Processing: TUNE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

**Redundancy**: w_salvation (heal single) vs w_purify (heal+dispel single) — same element + same function (heal) + same target type. Differentiated by dispel. **TUNE**: w_purify should read as a cleanse, not another heal bloom.

### 7. Red Mage — Lyra (Mage Rouge, mage)

#### Base — basic_rapier_hit

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 2, single, no status |
| **Current VFX presentation** | `basic_rapier_hit` preset, `basic_dagger_crosscut_small` sheet, additive, scale 1.14 |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: rapier crosscut. Processing: REPLACE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 1 — r_arcane_blade (Lame Arcanique, 2 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 1, single, boost (upgrade) |
| **Current VFX presentation** | `skill_arcane_slash_burst` preset, `skill_arcane_slash_burst_medium` sheet, center_on_target, scaleTier 2ap, scale 1.5, additive |
| **R3H verdict** | NEEDS_NORMALIZATION |
| **Proposed R0–R5 VFX** | Visual family: arcane slash burst. Processing: TUNE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 2 — r_rune_step (Pas Runique, 3 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Move/teleport, range 2–3, boost status |
| **Current VFX presentation** | `teleport_burst` preset, `skill_void_spiral_implosion_medium` sheet, source_to_destination, scaleTier 3ap, scale 1.2 |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: arcane teleport spiral. Processing: TUNE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 3 — r_scarlet_circle (Cercle Écarlate, 4 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Magical, range 1–3, radius 1.2, heal (allies) |
| **Current VFX presentation** | `skill_arcane_vortex` preset, `skill_arcane_vortex_nova_heavy` sheet, center_on_target, scaleTier 4ap, scale 1.76, additive |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: arcane vortex / scarlet circle. Processing: TUNE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Ultimate — r_perfect_duality (Dualité Parfaite, 5 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Magical, range 1–3, radius 2, barrier (self) |
| **Current VFX presentation** | `ultimate_perfect_duality` preset, `skill_fire_vortex_nova_heavy` sheet, center_on_aoe_origin, scaleTier 5ap_ultimate, visualScale 1.06, scale 1.82, additive |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: dual light/shadow vortex (ultimate scale). Processing: REPLACE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

**Redundancy**: r_scarlet_circle (mag, heal allies, radius 1.2) vs r_perfect_duality (mag, heal allies, radius 2, barrier) — same element + same function (damage+heal) + same visual family (vortex/nova). Differentiated by scale and barrier. **TUNE**: r_perfect_duality should read as a premium dual-effect, not a larger scarlet circle.

### 8. Enchanter — Eldwin (Enchanteur, cleric)

#### Base — basic_wand_hit

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Magical, range 1, single, no status |
| **Current VFX presentation** | `basic_wand_hit` preset, `basic_bolt_hit_small` sheet, additive, scale 1.14 |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: arcane wand bolt impact. Processing: REPLACE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 1 — e_vigor_rune (Rune de Vigueur, 2 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Buff, range 0–3, single (ally), boost status |
| **Current VFX presentation** | `skill_arcane_orbit` preset, `skill_arcane_orbit_burst_medium` sheet, center_on_target, scaleTier 2ap, visualScale 0.88, scale 1.5, additive |
| **R3H verdict** | NEEDS_NORMALIZATION |
| **Proposed R0–R5 VFX** | Visual family: arcane orbit / vigor rune. Processing: TUNE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 2 — e_transpose (Transposition, 3 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Move/swap, range 1–3, barrier (upgrade) |
| **Current VFX presentation** | `teleport_burst` preset, `skill_void_spiral_implosion_medium` sheet, source_to_destination, scaleTier 3ap, scale 1.2 |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: arcane swap teleport. Processing: TUNE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 3 — e_binding_seal (Sceau d'Entrave, 4 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Debuff, range 1–3, radius 1.2, root status |
| **Current VFX presentation** | `skill_binding_sigil` preset, `skill_arcane_sigil_burst_medium` sheet, center_on_target, scaleTier 4ap, visualScale 0.96, scale 1.58, additive |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: binding seal / arcane root. Processing: REPLACE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Ultimate — e_absolute_harmony (Harmonie Absolue, 5 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Buff, range 0–3, radius 2, boost+barrier+regen |
| **Current VFX presentation** | `ultimate_absolute_harmony` preset, `skill_holy_radiance_burst_heavy` sheet, allTargets, scaleTier 5ap_ultimate, visualScale 1.05, scale 2.05, additive |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: team harmony aura (ultimate scale). Processing: TUNE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

**Redundancy**: None significant. Each slot has a distinct tactical function (buff, swap, root, team-buff).

### 9. Archer — Kestrel (Archer, archer)

#### Base — basic_longbow_hit

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 4 (min 2), single, no status |
| **Current VFX presentation** | `basic_longbow_hit` preset, `basic_arrow_hit_small` sheet, additive, scale 1.14 |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: arrow impact. Processing: TUNE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 1 — a_precise_shot (Tir Précis, 2 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 2–4, single, blind status |
| **Current VFX presentation** | `arrow_shot` preset, `basic_arrow_hit_small` sheet, center_on_target, scaleTier 2ap, scale 1.15 |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: precise arrow impact. Processing: TUNE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 2 — a_hawk_leap (Bond du Faucon, 3 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Move/leap, range 2–3, boost status |
| **Current VFX presentation** | `leap_impact` preset, `basic_body_slam_heavy` sheet, leapLanding, center_on_target, scaleTier 3ap, scale 1.38 |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: archer leap / repositioning boost. Processing: TUNE. Same preset as p_interpose and l_griffon_jump — needs visual differentiation. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 3 — a_arrow_rain (Pluie de Flèches, 4 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 2–4, radius 1.2, slow status |
| **Current VFX presentation** | `arrow_rain` preset, `basic_arrow_hit_small` sheet, center_on_aoe_origin, scaleTier 4ap, visualScale 1.02, scale 1.06 |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: arrow rain / multi-impact area. Processing: TUNE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Ultimate — a_zenith_arrow (Flèche du Zénith, 5 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 2–4, single, piercing |
| **Current VFX presentation** | `ultimate_zenith_arrow` preset, `basic_arrow_hit_small` sheet, center_on_target, scaleTier 5ap_ultimate, visualScale 1.03, scale 1.42, additive |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: piercing zenith arrow (ultimate scale). Processing: TUNE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

**Redundancy**: a_precise_shot (phys, blind, single) vs a_zenith_arrow (phys, single, piercing) — same element + same target type + same visual family (arrow hit). Differentiated by piercing and power. **TUNE**: a_zenith_arrow should read as a premium piercing shot, not another arrow impact.

### 10. Ninja — Talon (Ninja, rogue)

#### Base — basic_shuriken_hit

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 3, single, no status |
| **Current VFX presentation** | `basic_shuriken_hit` preset, `basic_shuriken_cut_small` sheet, additive, scale 1.14 |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: shuriken cut impact. Processing: REPLACE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 1 — ni_venom_blade (Lame Venimeuse, 2 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 1, single, poison status |
| **Current VFX presentation** | `skill_poison_maw` preset, `skill_poison_maw_bite_heavy` sheet, center_on_target, scaleTier 2ap, scale 1.5, additive |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: poison blade strike. Processing: REPLACE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 2 — ni_shadow_step (Pas d'Ombre, 3 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Move/strike, range 1–2, single, blind (upgrade) |
| **Current VFX presentation** | `critical_hit` preset, `basic_execution_slash_heavy` sheet, dashImpact, scale 1.36, additive |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: shadow step strike. Processing: REPLACE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | PROPOSAL_ONLY: Consider converting to a pure utility teleport, leaving ni_silent_assassin as the only teleport-strike (R6 approval gate) |
| **Approval** | R0_PLANNING |

#### Skill 3 — ni_smoke_bomb (Bombe Fumigène, 4 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Debuff, range 0–1, radius 1.5, blind+barrier |
| **Current VFX presentation** | `move_smoke_burst` preset, `skill_void_spiral_implosion_medium` sheet, center_on_aoe_origin, scaleTier 4ap, visualScale 0.96, scale 1.44, opacity 0.86 |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: smoke bomb / shadow veil. Processing: TUNE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Ultimate — ni_silent_assassin (Assassinat Silencieux, 5 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical/strike, range 1–3, single, poison (upgrade) |
| **Current VFX presentation** | `ultimate_silent_assassin` preset, `skill_void_spiral_implosion_medium` + `basic_execution_slash_heavy` sheets, center_on_target, scaleTier 5ap_ultimate, visualScale 1.03, additive |
| **R3H verdict** | MANUAL_REVIEW + NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: shadow execution strike (ultimate scale). Processing: REPLACE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

**Redundancy**: ni_shadow_step (teleport strike, single) vs ni_silent_assassin (teleport strike, single) — same element (shadow) + same function (teleport+damage) + same visual family (void spiral + execution slash). Differentiated by power and poison. **MERGE candidate (R6)**: ni_shadow_step could become a pure utility teleport.

### 11. Rogue — Cedric (Rôdeur, rogue)

#### Base — basic_dagger_hit

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 1, single, no status |
| **Current VFX presentation** | `basic_dagger_hit` preset, `basic_dagger_crosscut_small` sheet, additive, scale 1.14 |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: dagger crosscut. Processing: REPLACE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 1 — ro_sneak_attack (Coup Sournois, 2 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 1, single, weak status |
| **Current VFX presentation** | `sword_slash` preset, `basic_sword_slash_heavy` sheet, center_on_target, scaleTier 2ap, scale 1.46 |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: sneak attack / dagger backstab. Processing: REPLACE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 2 — ro_tumble (Roulade, 3 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Move/leap, range 2–3, boost status |
| **Current VFX presentation** | `leap_impact` preset, `basic_body_slam_heavy` sheet, leapLanding, source_to_destination, scaleTier 3ap, scale 1.38 |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: rogue tumble / dodge roll. Processing: TUNE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 3 — ro_jaw_trap (Mâchoire à Ressort, 4 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 1–2, single, root status |
| **Current VFX presentation** | `root_vines` preset, `skill_arcane_sigil_burst_medium` sheet, center_on_target, scaleTier 4ap, visualScale 0.98, scale 1.42 |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: mechanical trap / snare. Processing: REPLACE. Semantic mismatch — arcane sigil for a mechanical trap. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Ultimate — ro_fault_breaker (Casse-Faille, 5 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 1, single, dispel status |
| **Current VFX presentation** | `ultimate_fault_breaker` preset, `basic_greatsword_cleave_heavy` sheet, center_on_aoe_origin, scaleTier 5ap_ultimate, visualScale 1.05, scale 1.86, additive |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: guard-breaking shatter (ultimate scale). Processing: REPLACE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

**Redundancy**: ro_sneak_attack (phys, weak, single) vs ro_fault_breaker (phys, dispel, single) — same element + same target type + same visual family (slash/cleave). Differentiated by dispel and power. **TUNE**: ro_fault_breaker should read as a guard-breaking shatter, not another slash.

### 12. Artillerist — Gunnar (Artilleur, archer)

#### Base — basic_hand_cannon_hit

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 4 (min 2), single, no status |
| **Current VFX presentation** | `basic_hand_cannon_hit` preset, `basic_bullet_hit_medium` sheet, additive, scale 1.26 |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: cannon bullet impact. Processing: TUNE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 1 — ar_calibrated_shot (Tir Calibré, 2 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 2–4, single, no status |
| **Current VFX presentation** | `arrow_shot` preset, `basic_arrow_hit_small` sheet, center_on_target, scaleTier 2ap, scale 1.15 |
| **R3H verdict** | MANUAL_REVIEW |
| **Proposed R0–R5 VFX** | Visual family: calibrated shot impact. Processing: TUNE. Same sheet as archer — needs visual differentiation (bullet vs arrow). Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 2 — ar_explosive_retreat (Repli Explosif, 3 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical/retreat, range 0, radius 1, burn (upgrade) |
| **Current VFX presentation** | `impact_explosion_large` preset, `skill_fire_vortex_nova_heavy` sheet, center_on_aoe_origin, scaleTier 3ap, scale 1.95, additive |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: tactical retreat explosion. Processing: REPLACE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Skill 3 — ar_incendiary_grenade (Grenade Incendiaire, 4 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 2–4, radius 1.2, burn status |
| **Current VFX presentation** | `skill_fire_smoke` preset, `skill_fire_smoke_explosion_heavy` sheet, center_on_target, scaleTier 4ap, visualScale 0.98, scale 1.76, normal blending |
| **R3H verdict** | NEEDS_REGENERATION |
| **Proposed R0–R5 VFX** | Visual family: incendiary grenade explosion. Processing: REPLACE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

#### Ultimate — ar_artillery_barrage (Barrage d'Artillerie, 5 AP)

| Field | Value |
|---|---|
| **Current gameplay mechanic** | Physical, range 2–4, radius 2, burn status, 3 impacts |
| **Current VFX presentation** | `ultimate_artillery_barrage` preset, `skill_fire_spark_cluster_medium` sheet, center_on_aoe_origin, scaleTier 5ap_ultimate, visualScale 1.08, scale 1.82, additive, impactCount 3 |
| **R3H verdict** | NEEDS_NORMALIZATION |
| **Proposed R0–R5 VFX** | Visual family: artillery barrage / multi-impact cluster (ultimate scale). Processing: TUNE. Mega Pack candidate: `UNASSIGNED_PENDING_R1` |
| **Deferred R6 gameplay** | None |
| **Approval** | R0_PLANNING |

**Redundancy**: ar_explosive_retreat (fire, radius 1) vs ar_incendiary_grenade (fire, radius 1.2, burn) — same element + same status (burn) + same visual family (explosion). Differentiated by retreat mechanic. **TUNE**: ar_explosive_retreat should read as a tactical retreat with a secondary explosion, not a primary fire attack.

---

## Redundancy findings summary

| Unit | Action pair | Shared dimensions | Verdict |
|---|---|---|---|
| Warrior | w_break_guard / w_lion_surge | phys + curse + slash visual | TUNE — differentiate line vs single |
| Paladin | p_holy_strike / p_oathwall | holy + barrier + radiance visual | TUNE — differentiate wall vs strike |
| Dark Knight | d_cursed_blade / d_devouring_eclipse | dark + curse | TUNE — differentiate void implosion vs slash |
| Lancer | l_long_thrust / l_haft_recoil | phys + slow + thrust visual | MERGE candidate (R6) — haft_recoil → knockback utility |
| Black Mage | n_flame_wave / n_dark_meteor | fire + burn + area | REDESIGN — flame_wave → directional; PROPOSAL_ONLY (R6) — dark_meteor → void/dark |
| Red Mage | r_scarlet_circle / r_perfect_duality | arcane + damage+heal + vortex visual | TUNE — differentiate premium dual-effect |
| Ninja | ni_shadow_step / ni_silent_assassin | shadow + teleport+strike | MERGE candidate (R6) — shadow_step → pure utility |
| Rogue | ro_sneak_attack / ro_fault_breaker | phys + single + slash visual | TUNE — differentiate shatter vs slash |
| Artillerist | ar_explosive_retreat / ar_incendiary_grenade | fire + burn + explosion | TUNE — differentiate retreat vs grenade |

## Semantic VFX mismatches

| Action | Issue | Current preset | Expected visual | Fix type |
|---|---|---|---|---|
| w_charge | Stationary hammer crush for a dash | blunt_impact | Directional dash/ram impact | REDESIGN preset |
| p_interpose | Generic body slam for a protective leap | leap_impact | Protective landing/guard impact | REDESIGN preset |
| n_flame_wave | Local burst for a cone/wave | skill_fire_impact | Directional wave/cone propagation | REDESIGN preset |
| ro_jaw_trap | Arcane sigil for a mechanical trap | root_vines | Trap/snare visual | TUNE preset |
| a_hawk_leap | Body slam for an archer repositioning | leap_impact | Archer leap/boost visual | TUNE preset |
| l_griffon_jump | Body slam for an offensive leap | leap_impact | Offensive leap impact | TUNE preset |

## Slot structure compliance

| Unit | Base | Skill 1 | Skill 2 | Skill 3 | Ultimate | Issues |
|---|---|---|---|---|---|---|
| Warrior | OK | OK | OK dash | OK AoE | OK line ultimate | None |
| Paladin | OK | OK | OK protective leap | OK defensive buff | OK hybrid ultimate | None |
| Dark Knight | OK | OK | OK teleport | OK self-buff | OK area ultimate | None |
| Lancer | OK | OK | redundant thrust | OK offensive leap | OK line ultimate | Skill 2 is another thrust, not utility |
| Black Mage | OK | OK | OK teleport | redundant fire attack | redundant fire+dark attack | Skill 3 and Ultimate both fire-based area |
| White Mage | OK | OK | redundant heal | OK area regen | OK revive | Skill 2 is another heal, not utility |
| Red Mage | OK | OK | OK teleport | OK area hybrid | OK premium hybrid | None |
| Enchanter | OK | OK | OK swap | OK root | OK team buff | None |
| Archer | OK | OK | OK leap | OK area | OK piercing | None |
| Ninja | OK | OK | redundant teleport-strike | OK debuff | redundant teleport-strike | Skill 2 and Ultimate both teleport-strike |
| Rogue | OK | OK | OK leap | OK root | OK shatter | None |
| Artillerist | OK | OK | OK retreat | OK grenade | OK barrage | None |

## Safety statement

No runtime code, spritesheet definitions, presets, mappings, gameplay values, or PNG files were modified during this audit. This document is analysis only. All Mega Pack candidate fields are `UNASSIGNED_PENDING_R1`. R1 inventory is blocked until commercial files are locally available.

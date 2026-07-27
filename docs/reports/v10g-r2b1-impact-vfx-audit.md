# V10G-R2B.1 — Impact-Only Combat VFX Preset Audit & Sprite Planning

**Date**: 2026-07-27
**Status**: Audit only — no runtime code, assets, or gameplay modified
**Predecessor**: V10G-R2A.6 (runtime flattening + unified preset registry)

---

## Core Doctrine

1. **All combat action/skill VFX must be impact-based.** They must act directly on the target unit, target tile, or target AoE center.
2. **No caster-to-target travel animation as the main VFX.** No projectile crossing the battlefield. No launch/travel sequence.
3. **Pre-cast visuals already exist and remain sufficient.** New spritesheets must NOT cover cast circles, charge-up, zone warnings, or pre-launch travel.
4. **Every role follows the same rule** — warrior, archer, mage, healer, support, enemies, bosses. Even ranged attacks resolve as: pre-cast → direct target impact VFX.
5. **A VFX preset may use multiple spritesheets.** 1 skill/action = 1 VFX preset = 1 to N impact spritesheets.
6. **Runtime generic overlays and procedural steps must remain minimized.** Only camera feedback, screen shake, screen flash, approved pre-cast logic, and fallback-only logic where strictly necessary.

### No Ground-Decal / No Floor-Stuck VFX Rule

Generated combat VFX spritesheets must be impact-based but must NOT look like effects glued to the floor.

**Forbidden:**
- Flat ground decals
- Persistent floor traces
- Painted circles stuck to the ground
- Large floor stains
- Permanent cracks drawn like terrain texture
- Ground fields that shift the perceived battle floor
- Effects that look like they belong to the map instead of the attack impact

**Allowed:**
- Vertical pillar hit
- Radial burst centered on target
- Slash impact on target
- Explosion core around target
- Floating rune impact around target
- Short fracture burst that dissipates
- Debris/energy eruption that does not leave a floor decal
- Smoke/dust that dissipates quickly
- Target-centered bind/freeze/root impact

**Special cases:**
- `fault_breaker`, `quake`, `inferno`, `meteor`, and root effects may suggest ground force but must NOT become persistent ground textures. They should read as temporary impact eruptions, not terrain decals. Any crack, root, flame, or frost should rise from the target area and dissipate.

**Naming convention:**
- Prefer: `*_impact`, `*_burst`, `*_pillar`, `*_eruption`, `*_shatter`, `*_core_hit`
- Avoid: `*_field`, `*_ground`, `*_decal`, `*_floor`, `*_trail`

**Animation language:**
appearance → buildup → impact peak → burst → dissipation

**Sprite generation hard constraints:**
- MAGENTA background
- 1280×1280
- 5×5 grid
- 25 frames
- Impact-focused animation
- Centered effect
- No travel from caster to target
- Readable over combat floor
- Large and impactful enough for combat readability

---

## 1. Full Action Audit

### Hero Skills

| Action ID | AP | Role | Current Preset | Current SpriteSheet(s) | Reuse Status | Too Generic? | Recommendation |
|---|---|---|---|---|---|---|---|
| w_break_guard | 2 | Warrior | sword_slash | slash_arc | Shared (13 actions) | Yes — generic slash | Replace with `blade_hit_small` |
| w_charge | 3 | Warrior | blunt_impact | small_impact | Shared (5 actions) | Yes — generic impact | Replace with `blade_hit_heavy` |
| w_whirl | 4 | Warrior | sword_slash | slash_arc | Shared (13 actions) | Yes — generic slash | Split: `blade_combo_cross` |
| w_lion_surge | 5 | Warrior Ultimate | ultimate_lion_surge | slash_arc | Shared (13 actions) | Yes — reuses generic slash | Replace: `lion_surge_slash_burst` |
| p_holy_strike | 2 | Paladin | holy_strike | slash_arc, holy_aura | Shared (13+8 actions) | Partially — dual sprite | Refine: `blade_hit_small` + `holy_strike_burst` |
| p_interpose | 3 | Paladin | leap_impact | leap_impact | Shared (6 actions) | Yes — generic leap | Keep (impact-on-landing is valid) |
| p_oathwall | 4 | Paladin | guard_barrier | barrier_shell | Shared (2 actions) | No — dedicated barrier | Keep |
| p_radiant_judgement | 5 | Paladin Ultimate | ultimate_radiant_judgement | holy_aura | Shared (8 actions) | Yes — reuses support aura | Replace: `holy_judgement_rune_burst` + `judgement_beam_impact` + `holy_judgement_afterburst` |
| d_cursed_blade | 2 | Dark Knight | sword_slash | slash_arc | Shared (13 actions) | Yes — generic slash | Replace with `blade_hit_small` |
| d_void_step | 3 | Dark Knight | teleport_burst | teleport_burst | Shared (6 actions) | No — teleport is valid impact | Keep |
| d_blood_pact | 4 | Dark Knight | bless_aura | buff_pulse | Shared (2 actions) | Partially — generic buff | Keep (self-buff is target-anchored) |
| d_devouring_eclipse | 5 | Dark Knight Ultimate | ultimate_devouring_eclipse | apocalypse_field | Shared (2 actions) | Yes — reuses boss field | Replace: `eclipse_devour_impact` (unused PNG available) |
| l_long_thrust | 2 | Lancer | thrust_line | thrust_line (projectile) | Shared (3 actions) | Yes — travel VFX | Replace with `pierce_impact` |
| l_haft_recoil | 3 | Lancer | thrust_line | thrust_line (projectile) | Shared (3 actions) | Yes — travel VFX | Replace with `pierce_impact` |
| l_griffon_jump | 4 | Lancer | leap_impact | leap_impact | Shared (6 actions) | Yes — generic leap | Keep (impact-on-landing is valid) |
| l_firmament_lance | 5 | Lancer Ultimate | ultimate_firmament_lance | thrust_line (projectile) | Shared (3 actions) | Yes — travel VFX | Replace: `pierce_impact` + `lance_pierce_burst` |
| n_dark_bolt | 2 | Dark Mage | shadow_lightning_bolt | shadow_lightning_bolt (projectile) | Shared (3 actions) | Yes — travel VFX | Replace with `dark_bolt_impact` |
| n_teleport | 3 | Dark Mage | teleport_burst | teleport_burst | Shared (6 actions) | No — teleport is valid impact | Keep |
| n_flame_wave | 4 | Dark Mage | shape_cone_blast | cone_blast (projectile) | Shared (1 action) | Yes — travel VFX | Replace with `fire_burst_medium` |
| n_dark_meteor | 5 | Dark Mage Ultimate | ultimate_dark_meteor | meteor_fall | Shared (1 action) | Partially — sky descent is valid | Refine: `meteor_core_impact` + `meteor_shock_burst` |
| w_salvation | 2 | White Mage | heal_burst | heal_touch | Shared (2 actions) | No — dedicated heal | Keep |
| w_purify | 3 | White Mage | support_holy_aura | holy_aura | Shared (8 actions) | Yes — reuses generic aura | Refine: `holy_purify_burst` |
| w_sanctuary | 4 | White Mage | support_holy_aura | holy_aura | Shared (8 actions) | Yes — reuses generic aura | Refine: `holy_sanctuary_burst` |
| w_miracle | 5 | White Mage Ultimate | ultimate_miracle | holy_aura | Shared (8 actions) | Yes — reuses support aura | Replace: `miracle_heal_column` + `miracle_revival_burst` |
| r_arcane_blade | 2 | Red Mage | sword_slash | slash_arc | Shared (13 actions) | Yes — generic slash | Replace with `blade_hit_small` |
| r_rune_step | 3 | Red Mage | teleport_burst | teleport_burst | Shared (6 actions) | No — teleport is valid impact | Keep |
| r_scarlet_circle | 4 | Red Mage | impact_explosion_large | explosion_large | Shared (7 actions) | Yes — generic explosion | Refine: `explosion_core_burst` |
| r_perfect_duality | 5 | Red Mage Ultimate | ultimate_perfect_duality | explosion_large | Shared (7 actions) | Yes — reuses generic explosion | Replace: `duality_light_burst` + `duality_shadow_burst` |
| e_vigor_rune | 2 | Enchanter | support_boost_aura | boost_aura | Shared (1 action) | No — dedicated boost | Keep |
| e_transpose | 3 | Enchanter | teleport_burst | teleport_burst | Shared (6 actions) | No — teleport is valid impact | Keep |
| e_binding_seal | 4 | Enchanter | root_vines | root_vines | Shared (3 actions) | Partially — dedicated root | Refine: `root_bind_impact` + `root_bind_burst` |
| e_absolute_harmony | 5 | Enchanter Ultimate | ultimate_absolute_harmony | holy_aura | Shared (8 actions) | Yes — reuses support aura | Replace: `harmony_resonance_burst` |
| a_precise_shot | 2 | Archer | arrow_shot | projectile_shot (projectile) | Shared (5 actions) | Yes — travel VFX | Replace with `arrow_hit_small` |
| a_hawk_leap | 3 | Archer | leap_impact | leap_impact | Shared (6 actions) | Yes — generic leap | Keep (impact-on-landing is valid) |
| a_arrow_rain | 4 | Archer | arrow_rain | projectile_shot (projectile) | Shared (5 actions) | Yes — travel VFX | Replace with `arrow_rain_impact` |
| a_zenith_arrow | 5 | Archer Ultimate | ultimate_zenith_arrow | projectile_shot (projectile) | Shared (5 actions) | Yes — travel VFX | Replace: `zenith_arrow_target_impact` + `zenith_arrow_pierce_burst` |
| ni_venom_blade | 2 | Ninja | sword_slash | slash_arc | Shared (13 actions) | Yes — generic slash | Replace: `blade_hit_small` + `poison_burst_small` |
| ni_shadow_step | 3 | Ninja | critical_hit | slash_arc | Shared (13 actions) | Yes — reuses critical feedback | Refine: `critical_impact_flash` |
| ni_smoke_bomb | 4 | Ninja | move_smoke_burst | smoke_burst | Shared (1 action) | No — dedicated smoke | Keep |
| ni_silent_assassin | 5 | Ninja Ultimate | ultimate_silent_assassin | teleport_burst, slash_arc | Shared (6+13 actions) | Partially — teleport+slash combo | Refine: keep teleport_burst + replace slash_arc with `blade_hit_small` |
| ro_sneak_attack | 2 | Rogue | sword_slash | slash_arc | Shared (13 actions) | Yes — generic slash | Replace with `blade_hit_small` |
| ro_tumble | 3 | Rogue | leap_impact | leap_impact | Shared (6 actions) | Yes — generic leap | Keep (impact-on-landing is valid) |
| ro_jaw_trap | 4 | Rogue | root_vines | root_vines | Shared (3 actions) | Partially — dedicated root | Refine: `root_bind_impact` |
| ro_fault_breaker | 5 | Rogue Ultimate | ultimate_fault_breaker | slash_arc | Shared (13 actions) | Yes — reuses generic slash | Replace: `fault_breaker_shatter_burst` (unused PNG available) + `fault_breaker_debris_burst` |
| ar_calibrated_shot | 2 | Artillerist | arrow_shot | projectile_shot (projectile) | Shared (5 actions) | Yes — travel VFX | Replace with `arrow_hit_small` |
| ar_explosive_retreat | 3 | Artillerist | impact_explosion_large | explosion_large | Shared (7 actions) | Yes — generic explosion | Refine: `explosion_core_burst` |
| ar_incendiary_grenade | 4 | Artillerist | impact_explosion_large | explosion_large | Shared (7 actions) | Yes — generic explosion | Refine: `explosion_core_burst` + `fire_burst_medium` |
| ar_artillery_barrage | 5 | Artillerist Ultimate | ultimate_artillery_barrage | artillery_barrage | Shared (1 action) | No — dedicated barrage | Keep (already impact-on-area) |

### Enemy Skills

| Action ID | AP | Category | Current Preset | Current SpriteSheet(s) | Reuse Status | Too Generic? | Recommendation |
|---|---|---|---|---|---|---|---|
| enemy_heavy_strike | 2 | Enemy Melee | blunt_impact | small_impact | Shared (5 actions) | Yes — generic impact | Replace with `blade_hit_heavy` |
| enemy_crush | 3 | Enemy AoE | blunt_impact | small_impact | Shared (5 actions) | Yes — generic impact | Replace with `blade_hit_heavy` |
| enemy_dark_bolt | 2 | Enemy Magic | shadow_lightning_bolt | shadow_lightning_bolt (projectile) | Shared (3 actions) | Yes — travel VFX | Replace with `dark_bolt_impact` |
| enemy_hex | 2 | Enemy Debuff | status_curse_mark | curse_mark | Shared (2 actions) | Partially — dedicated curse | Keep |
| enemy_venom_strike | 2 | Enemy Poison | poison_bite | slash_arc | Shared (13 actions) | Yes — reuses generic slash | Replace: `poison_fang_impact` + `poison_burst_small` |
| enemy_binding_shot | 2 | Enemy Bind | root_vines | root_vines | Shared (3 actions) | Partially — dedicated root | Refine: `root_bind_impact` |
| enemy_smoke_veil | 3 | Enemy Debuff | move_smoke_burst | smoke_burst | Shared (1 action) | No — dedicated smoke | Keep |
| enemy_taunt | 2 | Enemy Debuff | caster_roar | shockwave_ring (sourceGround) | Shared (5 actions) | Yes — VFX on caster | Replace with `command_roar_burst` (anchor on target area) |
| enemy_battle_cry | 3 | Enemy Debuff | caster_roar | shockwave_ring (sourceGround) | Shared (5 actions) | Yes — VFX on caster | Replace with `command_roar_burst` (anchor on target area) |
| enemy_dragon_breath | 3 | Enemy Fire | enemy_dragon_breath | dragon_breath (projectile) | Shared (1 action) | Yes — travel VFX | Replace with `dragon_breath_impact` |

### Boss Skills

| Action ID | AP | Category | Current Preset | Current SpriteSheet(s) | Reuse Status | Too Generic? | Recommendation |
|---|---|---|---|---|---|---|---|
| boss_slam | 5 | Boss Physical | boss_slam | leap_impact | Shared (6 actions) | Yes — generic leap | Keep (impact-on-area is valid, scale is boss-tier) |
| boss_roar | 5 | Boss Debuff | caster_roar | shockwave_ring (sourceGround) | Shared (5 actions) | Yes — VFX on caster | Replace with `command_roar_burst` (anchor on target area) |
| boss_quake | 4 | Boss Physical | boss_quake | shockwave_ring | Shared (5 actions) | Partially — ground ring | Refine: `quake_eruption_burst` (volumetric, not floor decal) |
| boss_guard | 3 | Boss Buff | guard_barrier | barrier_shell | Shared (2 actions) | No — dedicated barrier | Keep |
| boss_apocalypse | 5 | Boss Magic | boss_apocalypse_v2 | apocalypse_field | Shared (2 actions) | Yes — floor field | Replace: `apocalypse_eruption_burst` (volumetric, not floor) |
| boss_regen | 3 | Boss Buff | support_regen_aura | regen_aura | Shared (1 action) | No — dedicated regen | Keep |
| boss_fortify | 3 | Boss Buff | bless_aura | buff_pulse | Shared (2 actions) | Partially — generic buff | Keep (self-buff is target-anchored) |
| boss_freeze | 4 | Boss Magic | frost_bind | frost_bind | Shared (1 action) | Partially — dedicated frost | Refine: `frost_bind_impact` + `frost_shatter_burst` |
| boss_pin | 4 | Boss Ranged | arrow_shot | projectile_shot (projectile) | Shared (5 actions) | Yes — travel VFX | Replace with `arrow_hit_heavy` |
| boss_execution | 5 | Boss Signature | boss_execution | heavy_execution | Shared (1 action) | No — dedicated execution | Keep |
| boss_flurry | 5 | Boss Signature | boss_flurry | slash_arc ×3 | Shared (13 actions) | Yes — reuses generic slash ×3 | Replace: `boss_flurry_impact_1` + `boss_flurry_impact_2` + `blade_hit_heavy` |
| boss_inferno | 5 | Boss Signature | boss_inferno | explosion_large | Shared (7 actions) | Yes — reuses generic explosion | Replace: `inferno_eruption_impact` + `inferno_flame_burst` |
| boss_titan_slam | 5 | Boss Signature | boss_titan_slam | titan_slam | Shared (1 action) | No — dedicated titan slam | Keep (already impact-on-area) |

### Items

| Action ID | AP | Category | Current Preset | Current SpriteSheet(s) | Reuse Status | Too Generic? | Recommendation |
|---|---|---|---|---|---|---|---|
| item_bomb | — | Item | impact_explosion_large | explosion_large | Shared (7 actions) | Yes — generic explosion | Refine: `explosion_core_burst` |
| item_revive_vial | — | Item | support_revive_pillar | revive_pillar | Shared (1 action) | No — dedicated revive | Keep |
| item_potion | — | Item | heal_burst | heal_touch | Shared (2 actions) | No — dedicated heal | Keep |
| item_ether | — | Item | heal_burst | heal_touch | Shared (2 actions) | No — dedicated heal | Keep |
| item_antidote | — | Item | support_holy_aura | holy_aura | Shared (8 actions) | Yes — reuses generic aura | Refine: `holy_purify_burst` |

### Feedback Presets

| Preset ID | Current SpriteSheet(s) | Reuse Status | Too Generic? | Recommendation |
|---|---|---|---|---|
| generic_hit | small_impact | Shared (5 actions) | Yes — fallback only | Keep as fallback |
| critical_hit | slash_arc | Shared (13 actions) | Yes — reuses generic slash | Replace: `critical_impact_flash` |
| kill_spark | small_impact | Shared (5 actions) | Yes — reuses generic impact | Replace: `victory_spark_burst` |

---

## 2. Impact Family Classification

| Family | Actions | Description |
|---|---|---|
| **physical_melee** | w_break_guard, w_charge, w_whirl, w_lion_surge, p_holy_strike, d_cursed_blade, r_arcane_blade, ni_venom_blade, ni_shadow_step, ro_sneak_attack, ro_fault_breaker, enemy_heavy_strike, enemy_crush, enemy_venom_strike, boss_slam, boss_execution, boss_flurry, boss_titan_slam, critical_hit, generic_hit | Blade, blunt, pierce impacts on target |
| **ranged_arrow** | a_precise_shot, a_arrow_rain, a_zenith_arrow, ar_calibrated_shot, boss_pin | Arrow impacts on target (no travel) |
| **sacred_holy** | p_radiant_judgement, w_salvation, w_purify, w_sanctuary, w_miracle, e_absolute_harmony, item_antidote, item_revive_vial | Holy heal, barrier, judgement impacts |
| **dark_arcane** | n_dark_bolt, d_devouring_eclipse, enemy_dark_bolt, enemy_hex, r_perfect_duality | Dark energy, curse, eclipse impacts |
| **fire_explosion** | n_flame_wave, n_dark_meteor, r_scarlet_circle, ar_explosive_retreat, ar_incendiary_grenade, ar_artillery_barrage, enemy_dragon_breath, boss_inferno, boss_apocalypse, item_bomb | Fire, explosion, meteor impacts |
| **nature_binding** | e_binding_seal, ro_jaw_trap, enemy_binding_shot | Root, bind, poison impacts |
| **frost_ice** | boss_freeze | Frost bind, shatter impacts |
| **utility_feedback** | d_void_step, n_teleport, r_rune_step, e_transpose, p_interpose, l_griffon_jump, a_hawk_leap, ro_tumble, ni_smoke_bomb, enemy_smoke_veil, enemy_taunt, enemy_battle_cry, boss_roar, boss_quake, boss_guard, boss_regen, boss_fortify, d_blood_pact, e_vigor_rune, p_oathwall, kill_spark | Teleport, leap, smoke, buff, debuff, command, feedback |

---

## 3. Preset Redesign Plan

### Keep Current Preset (no changes needed)

| Preset | Reason |
|---|---|
| heal_burst | Dedicated heal impact on target — already compliant |
| guard_barrier | Dedicated barrier shell on target — already compliant |
| support_regen_aura | Dedicated regen aura on target — already compliant |
| support_revive_pillar | Dedicated revive pillar on target — already compliant |
| support_boost_aura | Dedicated boost aura on target — already compliant |
| move_smoke_burst | Dedicated smoke burst on target area — already compliant |
| leap_impact | Impact-on-landing is valid doctrine — already compliant |
| teleport_burst | Teleport arrival impact is valid doctrine — already compliant |
| status_curse_mark | Dedicated curse mark on target — already compliant |
| bless_aura | Self-buff pulse on target (self) — already compliant |
| boss_execution | Dedicated heavy execution on target — already compliant |
| boss_titan_slam | Dedicated titan slam on target area — already compliant |
| ultimate_artillery_barrage | Dedicated barrage on target area — already compliant |
| ultimate_silent_assassin | Teleport + slash combo — refine slash_arc only |

### Refine Current Preset (swap spritesheet, keep preset ID)

| Preset | Change | Reason |
|---|---|---|
| sword_slash | Replace `slash_arc` with `blade_hit_small` | Generic slash → dedicated blade impact |
| blunt_impact | Replace `small_impact` with `blade_hit_heavy` | Generic impact → dedicated blunt impact |
| holy_strike | Replace `slash_arc` with `blade_hit_small`, keep `holy_aura` or replace with `holy_strike_burst` | Dual-sprite preset refinement |
| critical_hit | Replace `slash_arc` with `critical_impact_flash` | Generic slash → dedicated critical flash |
| kill_spark | Replace `small_impact` with `victory_spark_burst` | Generic impact → dedicated victory spark |
| poison_bite | Replace `slash_arc` with `poison_fang_impact` + `poison_burst_small` | Generic slash → dedicated poison impact |
| root_vines | Refine `root_vines` to `root_bind_impact` + `root_bind_burst` | Multi-sprite root bind |
| frost_bind | Refine `frost_bind` to `frost_bind_impact` + `frost_shatter_burst` | Multi-sprite frost bind |
| impact_explosion_large | Replace `explosion_large` with `explosion_core_burst` | Generic explosion → dedicated core burst |
| ultimate_dark_meteor | Refine `meteor_fall` to `meteor_core_impact` + `meteor_shock_burst` | Multi-sprite meteor impact |
| boss_quake | Replace `shockwave_ring` with `quake_eruption_burst` | Floor ring → volumetric eruption |
| boss_apocalypse_v2 | Replace `apocalypse_field` with `apocalypse_eruption_burst` | Floor field → volumetric eruption |
| support_holy_aura | Refine `holy_aura` to `holy_purify_burst` or `holy_sanctuary_burst` | Generic aura → dedicated holy burst |

### Split Into Multi-Spritesheet Preset

| Preset | New SpriteSheets | Reason |
|---|---|---|
| w_whirl (sword_slash) | `blade_combo_cross` | Whirl needs cross-slash, not generic slash |
| ar_incendiary_grenade (impact_explosion_large) | `explosion_core_burst` + `fire_burst_medium` | Explosion + fire overlay |
| ni_venom_blade (sword_slash) | `blade_hit_small` + `poison_burst_small` | Blade hit + poison cloud |
| ultimate_silent_assassin | Keep `teleport_burst` + replace `slash_arc` with `blade_hit_small` | Teleport + refined slash |

### Replace With Dedicated Preset (new spritesheets)

| Preset | New SpriteSheet(s) | Reason |
|---|---|---|
| arrow_shot | `arrow_hit_small` | Remove travel, direct target impact |
| arrow_rain | `arrow_rain_impact` | Remove travel, area impact |
| dark_bolt | `dark_bolt_impact` | Remove travel, direct target impact |
| shadow_lightning_bolt | `dark_bolt_impact` | Remove travel, direct target impact |
| thrust_line | `pierce_impact` | Remove travel, direct target impact |
| shape_cone_blast | `fire_burst_medium` | Remove travel, area impact |
| caster_roar | `command_roar_burst` | Move from caster to target area |
| enemy_dragon_breath | `dragon_breath_impact` | Remove travel, area impact |
| ultimate_lion_surge | `lion_surge_slash_burst` | Dedicated golden slash burst |
| ultimate_radiant_judgement | `holy_judgement_rune_burst` + `judgement_beam_impact` + `holy_judgement_afterburst` | 3-sheet ultimate sequence |
| ultimate_devouring_eclipse | `eclipse_devour_impact` | Dedicated eclipse impact (unused PNG available) |
| ultimate_firmament_lance | `pierce_impact` + `lance_pierce_burst` | 2-sheet pierce sequence |
| ultimate_miracle | `miracle_heal_column` + `miracle_revival_burst` | 2-sheet miracle sequence |
| ultimate_perfect_duality | `duality_light_burst` + `duality_shadow_burst` | 2-sheet duality sequence |
| ultimate_absolute_harmony | `harmony_resonance_burst` | Dedicated harmony burst |
| ultimate_zenith_arrow | `zenith_arrow_target_impact` + `zenith_arrow_pierce_burst` | 2-sheet pierce sequence |
| ultimate_fault_breaker | `fault_breaker_shatter_burst` + `fault_breaker_debris_burst` | 2-sheet shatter sequence |
| boss_inferno | `inferno_eruption_impact` + `inferno_flame_burst` | 2-sheet inferno sequence |
| boss_flurry | `boss_flurry_impact_1` + `boss_flurry_impact_2` + `blade_hit_heavy` | 3-sheet flurry sequence |

---

## 4. New Spritesheet Plan

### Naming Convention
- File format: `<spriteSheetId>_5x5_25f_1280.png`
- All names use `snake_case`
- Impact-focused suffixes: `*_impact`, `*_burst`, `*_pillar`, `*_eruption`, `*_shatter`, `*_core_hit`
- Avoid: `*_field`, `*_ground`, `*_decal`, `*_floor`, `*_trail`

### Field Definitions

- **anchorMode**: Where the sprite is anchored — `target` (on target unit center), `targetGround` (on target footprint center), `groundTarget` (on AoE center), `allTargets` (on all target units), `screen` (screen-space feedback)
- **visualMode**: How the effect reads visually — `volumetric_burst`, `vertical_pillar`, `radial_impact`, `slash_impact`, `energy_eruption`, `debris_burst`, `rune_burst`, `smoke_burst`, `spark_burst`, `frost_shatter`, `root_burst`, `light_column`, `shadow_burst`, `fire_eruption`
- **groundDecalRisk**: `low` (clearly volumetric/vertical), `medium` (could lean floor-ward if not careful), `high` (historically floor-stuck, needs explicit care)
- **needsRenameForNoGroundDecal**: `true` if the original suggested name implied a floor effect, `false` otherwise
- **recommendedSpriteName**: Final approved name after addendum rules

### Physical Melee Family (8 spritesheets)

| # | spriteSheetId | Intended Visual Role | Target Preset(s) | Target Action(s) | Priority | anchorMode | visualMode | groundDecalRisk | needsRenameForNoGroundDecal | recommendedSpriteName |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | blade_hit_small | Light blade slash impact on target body | sword_slash (refined) | w_break_guard, d_cursed_blade, r_arcane_blade, ro_sneak_attack, p_holy_strike | high | target | slash_impact | low | false | blade_hit_small |
| 2 | blade_hit_heavy | Heavy blunt/blade impact on target body | blunt_impact (refined) | w_charge, enemy_heavy_strike, enemy_crush, boss_flurry (3rd hit) | high | target | radial_impact | low | false | blade_hit_heavy |
| 3 | blade_combo_cross | Cross-slash whirl impact on target area | w_whirl (split) | w_whirl | medium | groundTarget | slash_impact | low | false | blade_combo_cross |
| 4 | lion_surge_slash_burst | Golden energy slash burst on target line | ultimate_lion_surge (replace) | w_lion_surge | medium | target | volumetric_burst | low | false | lion_surge_slash_burst |
| 5 | fault_breaker_shatter_burst | Ground fracture eruption on target — temporary, not decal | ultimate_fault_breaker (replace) | ro_fault_breaker | high | target | energy_eruption | medium | true | fault_breaker_shatter_burst |
| 6 | fault_breaker_debris_burst | Debris/energy eruption after shatter — dissipates | ultimate_fault_breaker (replace) | ro_fault_breaker | medium | target | debris_burst | low | false | fault_breaker_debris_burst |
| 7 | pierce_impact | Thrust/pierce impact on target body | thrust_line (replace), ultimate_firmament_lance (replace) | l_long_thrust, l_haft_recoil, l_firmament_lance | high | target | slash_impact | low | false | pierce_impact |
| 8 | lance_pierce_burst | Energy pierce burst after lance impact | ultimate_firmament_lance (replace) | l_firmament_lance | medium | target | volumetric_burst | low | false | lance_pierce_burst |

### Ranged Arrow Family (5 spritesheets)

| # | spriteSheetId | Intended Visual Role | Target Preset(s) | Target Action(s) | Priority | anchorMode | visualMode | groundDecalRisk | needsRenameForNoGroundDecal | recommendedSpriteName |
|---|---|---|---|---|---|---|---|---|---|---|
| 9 | arrow_hit_small | Arrow impact burst on target body | arrow_shot (replace) | a_precise_shot, ar_calibrated_shot | high | target | radial_impact | low | false | arrow_hit_small |
| 10 | arrow_hit_heavy | Heavy arrow impact on target body | arrow_shot (split) | boss_pin | medium | target | radial_impact | low | false | arrow_hit_heavy |
| 11 | arrow_rain_impact | Multi-arrow rain impact on area — volumetric, not floor | arrow_rain (replace) | a_arrow_rain | high | groundTarget | volumetric_burst | medium | false | arrow_rain_impact |
| 12 | zenith_arrow_target_impact | Piercing arrow impact on target body | ultimate_zenith_arrow (replace) | a_zenith_arrow | high | target | radial_impact | low | false | zenith_arrow_target_impact |
| 13 | zenith_arrow_pierce_burst | Energy pierce burst after arrow impact | ultimate_zenith_arrow (replace) | a_zenith_arrow | medium | target | volumetric_burst | low | false | zenith_arrow_pierce_burst |

### Sacred / Holy Family (8 spritesheets)

| # | spriteSheetId | Intended Visual Role | Target Preset(s) | Target Action(s) | Priority | anchorMode | visualMode | groundDecalRisk | needsRenameForNoGroundDecal | recommendedSpriteName |
|---|---|---|---|---|---|---|---|---|---|---|
| 14 | holy_judgement_rune_burst | Sacred rune burst floating around target | ultimate_radiant_judgement (replace) | p_radiant_judgement | high | groundTarget | rune_burst | medium | true | holy_judgement_rune_burst |
| 15 | judgement_beam_impact | Vertical light pillar impact on target | ultimate_radiant_judgement (replace) | p_radiant_judgement | high | target | vertical_pillar | low | false | judgement_beam_impact |
| 16 | holy_judgement_afterburst | Holy energy afterburst dissipating | ultimate_radiant_judgement (replace) | p_radiant_judgement | medium | target | volumetric_burst | low | false | holy_judgement_afterburst |
| 17 | holy_strike_burst | Holy energy burst on target after blade hit | holy_strike (refine) | p_holy_strike | medium | target | volumetric_burst | low | false | holy_strike_burst |
| 18 | miracle_heal_column | Vertical healing light column on target | ultimate_miracle (replace) | w_miracle | medium | target | light_column | low | false | miracle_heal_column |
| 19 | miracle_revival_burst | Revival energy burst on target | ultimate_miracle (replace) | w_miracle | medium | target | volumetric_burst | low | false | miracle_revival_burst |
| 20 | harmony_resonance_burst | Harmony resonance wave on all targets | ultimate_absolute_harmony (replace) | e_absolute_harmony | medium | allTargets | volumetric_burst | low | true | harmony_resonance_burst |
| 21 | holy_purify_burst | Holy purification burst on target | support_holy_aura (refine) | w_purify, w_sanctuary, item_antidote | medium | target | volumetric_burst | low | false | holy_purify_burst |

### Dark / Arcane Family (6 spritesheets)

| # | spriteSheetId | Intended Visual Role | Target Preset(s) | Target Action(s) | Priority | anchorMode | visualMode | groundDecalRisk | needsRenameForNoGroundDecal | recommendedSpriteName |
|---|---|---|---|---|---|---|---|---|---|---|
| 22 | dark_bolt_impact | Dark energy impact burst on target | shadow_lightning_bolt (replace), dark_bolt (replace) | n_dark_bolt, enemy_dark_bolt | high | target | radial_impact | low | false | dark_bolt_impact |
| 23 | dark_curse_burst | Curse energy burst on target | curse_pulse (refine) | curse_pulse | low | target | volumetric_burst | low | false | dark_curse_burst |
| 24 | eclipse_devour_impact | Devouring eclipse impact on target area — volumetric | ultimate_devouring_eclipse (replace) | d_devouring_eclipse | medium | groundTarget | energy_eruption | medium | true | eclipse_devour_impact |
| 25 | duality_light_burst | Light half of duality impact on target area | ultimate_perfect_duality (replace) | r_perfect_duality | medium | groundTarget | volumetric_burst | low | false | duality_light_burst |
| 26 | duality_shadow_burst | Shadow half of duality impact on target area | ultimate_perfect_duality (replace) | r_perfect_duality | medium | groundTarget | volumetric_burst | low | false | duality_shadow_burst |
| 27 | apocalypse_eruption_burst | Apocalypse energy eruption on target area — volumetric, not floor | boss_apocalypse_v2 (replace) | boss_apocalypse | medium | groundTarget | energy_eruption | high | true | apocalypse_eruption_burst |

### Fire / Explosion Family (8 spritesheets)

| # | spriteSheetId | Intended Visual Role | Target Preset(s) | Target Action(s) | Priority | anchorMode | visualMode | groundDecalRisk | needsRenameForNoGroundDecal | recommendedSpriteName |
|---|---|---|---|---|---|---|---|---|---|---|
| 28 | explosion_core_burst | Core explosion burst on target area — volumetric | impact_explosion_large (refine) | r_scarlet_circle, ar_explosive_retreat, ar_incendiary_grenade, item_bomb | high | groundTarget | volumetric_burst | medium | false | explosion_core_burst |
| 29 | fire_burst_medium | Cone fire impact on target area — volumetric, not floor | shape_cone_blast (replace), ar_incendiary_grenade (refine) | n_flame_wave, ar_incendiary_grenade | high | groundTarget | fire_eruption | medium | false | fire_burst_medium |
| 30 | inferno_eruption_impact | Boss inferno eruption on target area — volumetric | boss_inferno (replace) | boss_inferno | medium | groundTarget | fire_eruption | high | true | inferno_eruption_impact |
| 31 | inferno_flame_burst | Inferno flame burst after eruption | boss_inferno (replace) | boss_inferno | medium | groundTarget | volumetric_burst | low | false | inferno_flame_burst |
| 32 | meteor_core_impact | Meteor core impact on target area — vertical, not floor | ultimate_dark_meteor (refine) | n_dark_meteor | medium | groundTarget | radial_impact | medium | false | meteor_core_impact |
| 33 | meteor_shock_burst | Meteor shockwave burst after impact | ultimate_dark_meteor (refine) | n_dark_meteor | low | groundTarget | volumetric_burst | low | false | meteor_shock_burst |
| 34 | meteor_smoke_afterhit | Meteor smoke/dust after impact — dissipates | ultimate_dark_meteor (refine) | n_dark_meteor | low | groundTarget | smoke_burst | low | false | meteor_smoke_afterhit |
| 35 | dragon_breath_impact | Dragon breath fire impact on target area — volumetric | enemy_dragon_breath (replace) | enemy_dragon_breath | medium | groundTarget | fire_eruption | medium | false | dragon_breath_impact |

### Nature / Poison Family (4 spritesheets)

| # | spriteSheetId | Intended Visual Role | Target Preset(s) | Target Action(s) | Priority | anchorMode | visualMode | groundDecalRisk | needsRenameForNoGroundDecal | recommendedSpriteName |
|---|---|---|---|---|---|---|---|---|---|---|
| 36 | root_bind_impact | Root bind eruption on target — rises and dissipates | root_vines (refine) | e_binding_seal, ro_jaw_trap, enemy_binding_shot | medium | target | root_burst | medium | false | root_bind_impact |
| 37 | root_bind_burst | Root energy burst after bind — dissipates | root_vines (refine) | e_binding_seal, ro_jaw_trap | low | target | volumetric_burst | low | false | root_bind_burst |
| 38 | poison_fang_impact | Poison fang impact on target body | poison_bite (replace) | enemy_venom_strike, ni_venom_blade | medium | target | radial_impact | low | false | poison_fang_impact |
| 39 | poison_burst_small | Poison cloud burst on target — dissipates | poison_bite (replace) | enemy_venom_strike, ni_venom_blade | low | target | volumetric_burst | low | false | poison_burst_small |

### Frost / Ice Family (2 spritesheets)

| # | spriteSheetId | Intended Visual Role | Target Preset(s) | Target Action(s) | Priority | anchorMode | visualMode | groundDecalRisk | needsRenameForNoGroundDecal | recommendedSpriteName |
|---|---|---|---|---|---|---|---|---|---|---|
| 40 | frost_bind_impact | Frost bind impact on target — crystalline eruption | frost_bind (refine) | boss_freeze | medium | target | frost_shatter | medium | false | frost_bind_impact |
| 41 | frost_shatter_burst | Frost shatter burst after bind — dissipates | frost_bind (refine) | boss_freeze | low | target | volumetric_burst | low | false | frost_shatter_burst |

### Utility / Feedback Family (5 spritesheets)

| # | spriteSheetId | Intended Visual Role | Target Preset(s) | Target Action(s) | Priority | anchorMode | visualMode | groundDecalRisk | needsRenameForNoGroundDecal | recommendedSpriteName |
|---|---|---|---|---|---|---|---|---|---|---|
| 42 | critical_impact_flash | Critical hit flash burst on target | critical_hit (replace) | critical_hit feedback | low | target | spark_burst | low | false | critical_impact_flash |
| 43 | victory_spark_burst | Victory spark burst on target — dissipates | kill_spark (replace) | kill_spark feedback | low | target | spark_burst | low | false | victory_spark_burst |
| 44 | command_roar_burst | Command roar impact on target area — volumetric wave | caster_roar (replace) | enemy_taunt, enemy_battle_cry, boss_roar | medium | groundTarget | volumetric_burst | low | false | command_roar_burst |
| 45 | quake_eruption_burst | Quake eruption on target area — volumetric, not floor ring | boss_quake (refine) | boss_quake | medium | groundTarget | energy_eruption | high | true | quake_eruption_burst |
| 46 | boss_flurry_impact_1 | First flurry blade impact on target | boss_flurry (replace) | boss_flurry | low | target | slash_impact | low | true | boss_flurry_impact_1 |

### Already Usable from Unused PNGs (4 — register immediately, no generation needed)

| # | spriteSheetId | PNG Already Exists | Target Preset(s) | Priority | anchorMode | visualMode | groundDecalRisk | needsRenameForNoGroundDecal | recommendedSpriteName |
|---|---|---|---|---|---|---|---|---|---|
| 47 | judgement_beam_impact | `judgement_beam_5x5_25f_1280.png` ✓ | ultimate_radiant_judgement | high | target | vertical_pillar | low | true | judgement_beam_impact |
| 48 | zenith_arrow_impact | `zenith_arrow_5x5_25f_1280.png` ✓ | ultimate_zenith_arrow | high | target | radial_impact | low | true | zenith_arrow_impact |
| 49 | fault_breaker_shatter_burst | `fault_breaker_5x5_25f_1280.png` ✓ | ultimate_fault_breaker | high | target | energy_eruption | medium | true | fault_breaker_shatter_burst |
| 50 | eclipse_devour_impact | `eclipse_devour_5x5_25f_1280.png` ✓ | ultimate_devouring_eclipse | medium | groundTarget | energy_eruption | medium | true | eclipse_devour_impact |

### Additional Unused PNGs (9 — available for future families, not yet planned)

| PNG Filename | Potential Future Use |
|---|---|
| `holy_explosion_5x5_25f_1280.png` | Sacred holy explosion family backup |
| `dark_explosion_5x5_25f_1280.png` | Dark arcane explosion family backup |
| `mace_impact_5x5_25f_1280.png` | Physical blunt impact family backup |
| `line_blast_5x5_25f_1280.png` | Pierce/lance impact family backup |
| `bless_field_5x5_25f_1280.png` | Sacred support aura backup (rename needed: `bless_burst`) |
| `burn_mark_5x5_25f_1280.png` | Fire burn status impact (rename needed: `burn_impact`) |
| `drain_field_5x5_25f_1280.png` | Dark drain impact (rename needed: `drain_burst`) |
| `silence_seal_5x5_25f_1280.png` | Debuff seal impact (rename needed: `silence_seal_impact`) |
| `weak_mark_5x5_25f_1280.png` | Weak status impact (rename needed: `weak_impact`) |

---

## 5. Distinct Naming Convention

**File format**: `<spriteSheetId>_5x5_25f_1280.png`

**Approved suffixes**: `*_impact`, `*_burst`, `*_pillar`, `*_eruption`, `*_shatter`, `*_core_hit`, `*_core_burst`

**Forbidden suffixes**: `*_field`, `*_ground`, `*_decal`, `*_floor`, `*_trail`

**Renames applied from addendum:**

| Original Suggested Name | Renamed To | Reason |
|---|---|---|
| holy_judgement_mark | holy_judgement_rune_burst | "mark" implies floor decal |
| boss_flurry_blade_1 | boss_flurry_impact_1 | Follow `*_impact` convention |
| boss_flurry_blade_2 | boss_flurry_impact_2 | Follow `*_impact` convention |
| eclipse_devour | eclipse_devour_impact | Add `*_impact` suffix |
| zenith_arrow | zenith_arrow_impact | Add `*_impact` suffix |
| fault_breaker | fault_breaker_shatter_burst | Use `*_shatter_burst` to emphasize temporary eruption |
| judgement_beam | judgement_beam_impact | Add `*_impact` suffix |
| inferno_field | inferno_eruption_impact | "field" implies floor decal |
| apocalypse_field (replacement) | apocalypse_eruption_burst | "field" implies floor decal |
| harmony_resonance_field_hit | harmony_resonance_burst | "field" implies floor decal |
| burning_ground_hit | fire_eruption_impact | "ground" implies floor decal |

---

## 6. Runtime Integration Readiness

When V10G-R2B.2 begins, each new spritesheet integrates via:

### VfxTypes.ts
Add new ID to the `VfxSpriteSheetId` union type:
```typescript
export type VfxSpriteSheetId =
  | 'slash_arc' | 'small_impact' | ... // existing
  | 'blade_hit_small' | 'blade_hit_heavy' | 'pierce_impact' // ... new IDs
```

### VfxSpriteSheets.ts
Add definition entry with `id`, `url`, `rows`, `cols`, `frameCount`, `frameDurationMs`, `align`, `presentation`:
```typescript
blade_hit_small: { id: 'blade_hit_small', url: '/assets/vfx/runtime/blade_hit_small_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.4, opacityMultiplier: 1, fadeIn: 0.04, fadeOut: 0.7, layer: 'impact', blending: 'normal' } },
```

### public/assets/vfx/runtime/manifest.json
Add entry with matching metadata:
```json
{ "id": "blade_hit_small", "url": "/assets/vfx/runtime/blade_hit_small_5x5_25f_1280.png", "rows": 5, "cols": 5, "frameCount": 25, "frameDurationMs": 40, "align": "center", "presentation": { "scaleMultiplier": 1.4, "opacityMultiplier": 1, "fadeIn": 0.04, "fadeOut": 0.7, "layer": "impact", "blending": "normal" } }
```

### VfxPresets.ts
Update preset steps to:
- Reference new `spriteSheet` ID
- Change `sheetMode` from `'projectile'` to `'billboard'` (remove travel)
- Change `anchor` from `'source'` to `'target'` or `'groundTarget'`
- Remove `targetAnchor` and `orientation: 'source_to_target'` for former projectile steps
- Add multi-spriteSheet steps for split presets (ordered by `startTime`)

### VfxActionRegistry.ts
- Remove upgrade candidate metadata for resolved presets
- Update `UPGRADE_CANDIDATES` map as spritesheets are registered

### skillPresentation.ts
- No changes needed — preset IDs stay the same, only their internal spritesheet references change

---

## 7. Priority-Ordered Generation Backlog

### Batch 1a — Doctrine-Violating Travel Replacements (8 sprites)

| Priority | spriteSheetId | Filename | Replaces |
|---|---|---|---|
| high | blade_hit_small | blade_hit_small_5x5_25f_1280.png | slash_arc for 2AP melee |
| high | blade_hit_heavy | blade_hit_heavy_5x5_25f_1280.png | small_impact for blunt |
| high | pierce_impact | pierce_impact_5x5_25f_1280.png | thrust_line projectile |
| high | arrow_hit_small | arrow_hit_small_5x5_25f_1280.png | projectile_shot for 2AP ranged |
| high | arrow_rain_impact | arrow_rain_impact_5x5_25f_1280.png | projectile_shot for arrow rain |
| high | dark_bolt_impact | dark_bolt_impact_5x5_25f_1280.png | shadow_lightning_bolt projectile |
| high | fire_burst_medium | fire_burst_medium_5x5_25f_1280.png | cone_blast projectile |
| medium | command_roar_burst | command_roar_burst_5x5_25f_1280.png | shockwave_ring on caster |

### Batch 1b — High-Priority Ultimate + Feedback (8 sprites)

| Priority | spriteSheetId | Filename | Replaces |
|---|---|---|---|
| high | explosion_core_burst | explosion_core_burst_5x5_25f_1280.png | explosion_large for non-ultimate |
| high | holy_judgement_rune_burst | holy_judgement_rune_burst_5x5_25f_1280.png | holy_aura for ultimate_radiant_judgement |
| high | judgement_beam_impact | judgement_beam_impact_5x5_25f_1280.png | (unused PNG available — register only) |
| high | fault_breaker_shatter_burst | fault_breaker_shatter_burst_5x5_25f_1280.png | (unused PNG available — register only) |
| high | zenith_arrow_target_impact | zenith_arrow_target_impact_5x5_25f_1280.png | projectile_shot for ultimate_zenith_arrow |
| medium | dragon_breath_impact | dragon_breath_impact_5x5_25f_1280.png | dragon_breath projectile |
| medium | arrow_hit_heavy | arrow_hit_heavy_5x5_25f_1280.png | projectile_shot for boss_pin |
| low | critical_impact_flash | critical_impact_flash_5x5_25f_1280.png | slash_arc for critical_hit |

### Batch 2 — Medium-Priority Ultimate Multi-Sheets (18 sprites)

| Priority | spriteSheetId | Filename | For Preset |
|---|---|---|---|
| medium | lion_surge_slash_burst | lion_surge_slash_burst_5x5_25f_1280.png | ultimate_lion_surge |
| medium | fault_breaker_debris_burst | fault_breaker_debris_burst_5x5_25f_1280.png | ultimate_fault_breaker |
| medium | zenith_arrow_pierce_burst | zenith_arrow_pierce_burst_5x5_25f_1280.png | ultimate_zenith_arrow |
| medium | zenith_arrow_impact | zenith_arrow_impact_5x5_25f_1280.png | (unused PNG available — register only) |
| medium | holy_judgement_afterburst | holy_judgement_afterburst_5x5_25f_1280.png | ultimate_radiant_judgement |
| medium | miracle_heal_column | miracle_heal_column_5x5_25f_1280.png | ultimate_miracle |
| medium | miracle_revival_burst | miracle_revival_burst_5x5_25f_1280.png | ultimate_miracle |
| medium | harmony_resonance_burst | harmony_resonance_burst_5x5_25f_1280.png | ultimate_absolute_harmony |
| medium | eclipse_devour_impact | eclipse_devour_impact_5x5_25f_1280.png | (unused PNG available — register only) |
| medium | duality_light_burst | duality_light_burst_5x5_25f_1280.png | ultimate_perfect_duality |
| medium | duality_shadow_burst | duality_shadow_burst_5x5_25f_1280.png | ultimate_perfect_duality |
| medium | inferno_eruption_impact | inferno_eruption_impact_5x5_25f_1280.png | boss_inferno |
| medium | inferno_flame_burst | inferno_flame_burst_5x5_25f_1280.png | boss_inferno |
| medium | meteor_core_impact | meteor_core_impact_5x5_25f_1280.png | ultimate_dark_meteor |
| medium | root_bind_impact | root_bind_impact_5x5_25f_1280.png | root_vines |
| medium | poison_fang_impact | poison_fang_impact_5x5_25f_1280.png | poison_bite |
| medium | frost_bind_impact | frost_bind_impact_5x5_25f_1280.png | frost_bind |
| medium | blade_combo_cross | blade_combo_cross_5x5_25f_1280.png | w_whirl |

### Batch 3 — Low-Priority Polish + Remaining (16 sprites)

| Priority | spriteSheetId | Filename | For Preset |
|---|---|---|---|
| medium | lance_pierce_burst | lance_pierce_burst_5x5_25f_1280.png | ultimate_firmament_lance |
| medium | holy_strike_burst | holy_strike_burst_5x5_25f_1280.png | holy_strike |
| medium | holy_purify_burst | holy_purify_burst_5x5_25f_1280.png | support_holy_aura |
| medium | quake_eruption_burst | quake_eruption_burst_5x5_25f_1280.png | boss_quake |
| medium | apocalypse_eruption_burst | apocalypse_eruption_burst_5x5_25f_1280.png | boss_apocalypse_v2 |
| low | meteor_shock_burst | meteor_shock_burst_5x5_25f_1280.png | ultimate_dark_meteor |
| low | meteor_smoke_afterhit | meteor_smoke_afterhit_5x5_25f_1280.png | ultimate_dark_meteor |
| low | root_bind_burst | root_bind_burst_5x5_25f_1280.png | root_vines |
| low | poison_burst_small | poison_burst_small_5x5_25f_1280.png | poison_bite |
| low | frost_shatter_burst | frost_shatter_burst_5x5_25f_1280.png | frost_bind |
| low | victory_spark_burst | victory_spark_burst_5x5_25f_1280.png | kill_spark |
| low | dark_curse_burst | dark_curse_burst_5x5_25f_1280.png | curse_pulse |
| low | boss_flurry_impact_1 | boss_flurry_impact_1_5x5_25f_1280.png | boss_flurry |
| low | boss_flurry_impact_2 | boss_flurry_impact_2_5x5_25f_1280.png | boss_flurry |

---

## 8. Suggested Batching Order for Generation

1. **Batch 1a** (8 sprites): All doctrine-violating travel replacements — fixes the core "no travel" rule
2. **Batch 1b** (8 sprites): High-priority ultimate + feedback — fixes the most visible reuse problems
3. **Batch 2** (18 sprites): All medium-priority ultimate multi-sheets and family refinements
4. **Batch 3** (14 sprites): Low-priority polish + remaining medium items

**Total new spritesheets to generate**: 46
**Total unused PNGs to register** (no generation needed): 4
**Total spritesheets in final library**: 29 (existing) + 46 (new) + 4 (registered from unused) = 79

---

## 9. Ground-Decal Risk Summary

| Risk Level | Count | Spritesheets |
|---|---|---|
| **high** | 4 | apocalypse_eruption_burst, inferno_eruption_impact, quake_eruption_burst, (apocalypse_field replacement) |
| **medium** | 11 | fault_breaker_shatter_burst, arrow_rain_impact, holy_judgement_rune_burst, eclipse_devour_impact, explosion_core_burst, fire_burst_medium, meteor_core_impact, dragon_breath_impact, root_bind_impact, frost_bind_impact, fault_breaker_shatter_burst (unused PNG) |
| **low** | 35 | All remaining spritesheets |

**Mitigation**: All `high` and `medium` risk spritesheets must be generated with explicit volumetric/vertical animation language. The sprite artist must ensure effects rise from the target area and dissipate, never remaining as flat floor textures.

---

## 10. Validation

- **npm test**: 357 passed (357) — 0 failed (no code changes, report only)
- **npm run build**: built successfully — 0 errors (no code changes, report only)
- **git diff --check**: clean
- **git status**: 1 new file (this report)

---

## 11. Confirmation

- No gameplay changed ✓
- No runtime code modified ✓
- No assets modified or deleted ✓
- No spritesheets generated yet ✓
- No status indicator logic touched ✓
- All doctrine rules applied ✓
- No ground-deal addendum applied ✓
- Multi-spritesheet preset support preserved ✓
- V10G-R2B.2 can begin sprite generation with this plan ✓

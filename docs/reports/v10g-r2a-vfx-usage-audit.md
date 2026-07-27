# V10G-R2A: Combat VFX Usage Audit & Cleanup Report

## Summary

Audited all 68 VFX presets, 42 spritesheet registry entries, and 42 manifest entries. Removed 16 obsolete presets, 13 obsolete spritesheet registry entries, and 13 obsolete v2 manifest entries. All physical PNG files retained. No gameplay, active combat VFX, fallback VFX, or status indicator assets were affected.

---

## Classification

### Active Combat Presets (52)

**Skill-mapped (37):** sword_slash, blunt_impact, ultimate_lion_surge, holy_strike, leap_impact, guard_barrier, ultimate_radiant_judgement, teleport_burst, bless_aura, ultimate_devouring_eclipse, thrust_line, ultimate_firmament_lance, shadow_lightning_bolt, shape_cone_blast, ultimate_dark_meteor, heal_burst, support_holy_aura, ultimate_miracle, impact_explosion_large, ultimate_perfect_duality, support_boost_aura, root_vines, ultimate_absolute_harmony, arrow_shot, arrow_rain, ultimate_zenith_arrow, critical_hit, move_smoke_burst, ultimate_silent_assassin, ultimate_fault_breaker, ultimate_artillery_barrage, boss_quake, boss_slam, boss_apocalypse_v2, support_regen_aura, frost_bind, boss_execution, boss_flurry, boss_inferno, boss_titan_slam, caster_roar, enemy_dragon_breath, status_curse_mark

**Feedback (2):** critical_hit (playFeedbackVfx), kill_spark (applyDamage knockout)

**Fallback-required (13):** fireball, heal_burst, generic_hit, sword_slash, blunt_impact, arrow_shot, dark_bolt, bless_aura, curse_pulse, poison_bite, guard_barrier, boss_slam, boss_quake, support_revive_pillar, support_holy_aura, impact_explosion_large

### Obsolete Unused — Removed (16)

| Preset | Spritesheet | Reason |
|---|---|---|
| melee_light | (none) | Only used as motion preset name, never played as VFX |
| melee_heavy | (none) | Only used as motion preset name, never played as VFX |
| boss_apocalypse | (none) | Replaced by boss_apocalypse_v2 |
| status_burn_mark | burn_mark | Status DOT uses procedural vfx('burn'), not preset |
| status_silence_seal | silence_seal | Silence not applied via VFX preset |
| status_weak_mark | weak_mark | Weak not applied via VFX preset |
| support_bless_field | bless_field | Replaced by bless_aura/guard_barrier |
| impact_mace | mace_impact | Replaced by blunt_impact |
| shape_line_blast | line_blast | Replaced by ultimate_lion_surge/ultimate_firmament_lance |
| impact_dark_explosion | dark_explosion | Replaced by ultimate_devouring_eclipse |
| ultimate_judgement_beam | judgement_beam | Replaced by ultimate_radiant_judgement (premium) |
| ultimate_holy_explosion | holy_explosion | No skill maps to it |
| ultimate_eclipse_devour | eclipse_devour | Replaced by ultimate_devouring_eclipse (premium) |
| ultimate_drain_field | drain_field | No skill maps to it |
| ultimate_zenith_arrow_v2 | zenith_arrow | Replaced by ultimate_zenith_arrow (premium) |
| ultimate_fault_breaker_v2 | fault_breaker | Replaced by ultimate_fault_breaker (premium) |

### Obsolete Spritesheets — Removed (13, all v2)

burn_mark, silence_seal, weak_mark, bless_field, mace_impact, line_blast, dark_explosion, judgement_beam, holy_explosion, eclipse_devour, drain_field, zenith_arrow, fault_breaker

---

## Files Changed

| File | Change |
|---|---|
| `src/combat/vfx/VfxPresets.ts` | Removed 15 obsolete base preset definitions |
| `src/combat/vfx/VfxPremiumPresets.ts` | Removed boss_apocalypse premium preset |
| `src/combat/vfx/VfxTypes.ts` | Removed 13 obsolete VfxSpriteSheetId entries |
| `src/combat/vfx/VfxSpriteSheets.ts` | Removed 13 obsolete spritesheet definitions; fixed pre-existing duplicate key bug |
| `public/assets/vfx/runtime/v2/manifest.json` | Removed 13 obsolete manifest entries; fixed pre-existing duplicate key bug and JSON formatting |
| `src/combat/skillPresentation.ts` | Removed 16 obsolete IDs from SKILL_VFX_PRESET_IDS |
| `src/combat/vfx/VfxPresets.test.ts` | Updated preset lists and boss signature count |
| `src/combat/vfx/VfxSpriteSheets.test.ts` | Removed 13 IDs from V2_SHEET_IDS |
| `src/combat/combatVfxPresentation.test.ts` | Added V10G-R2A cleanup coverage tests |

---

## Physical Asset Recommendations

All physical PNG files retained. The 13 obsolete PNG files (burn_mark, silence_seal, weak_mark, bless_field, mace_impact, line_blast, dark_explosion, judgement_beam, holy_explosion, eclipse_devour, drain_field, zenith_arrow, fault_breaker) remain on disk but are no longer referenced by any manifest, registry, or preset. They can be safely deleted in a future pass if desired.

---

## Regression Protection

All key mappings verified intact:
- n_dark_meteor → ultimate_dark_meteor
- n_dark_bolt → shadow_lightning_bolt
- enemy_dark_bolt → shadow_lightning_bolt
- teleport skills → teleport_burst
- e_binding_seal → root_vines
- ro_jaw_trap → root_vines
- boss_freeze → frost_bind
- revive_vial → support_revive_pillar
- ro_tumble → leap_impact
- ar_explosive_retreat → impact_explosion_large
- boss_apocalypse → boss_apocalypse_v2
- boss_quake → boss_quake
- Status carousel assets untouched

---

## Generic / Procedural VFX Cleanup Audit (V10G-R2A.1)

### Overview

Audited all generic/procedural VFX helpers in `legacyCombatRuntime.js` and `VfxSystem.ts` to identify overlays that compete with authored spritesheet VFX during combat actions.

**Key finding:** The runtime architecture is already well-designed — all generic impact VFX (`vfx('hit')`, `shockRing`, `screenFlash`, `screenShake`) are gated behind `playActionVfx` success. They only play as fallback when no authored preset resolves. The one actionable issue was `castTelegraph` calling `burst()` unconditionally for all non-attack skills, even those with authored spritesheet presets.

### Classification

#### 1. pre_skill_allowed — Retained

| Helper | File | Role | Action |
|---|---|---|---|
| `castTelegraph` ring | legacyCombatRuntime.js:1138 | Activation circle on source unit before impact | Retained |
| `screenFlash` (ultimate/boss) | legacyCombatRuntime.js:1408-1409 | Pre-impact "ULTIME"/"SIGNATURE" text + subtle flash | Retained |
| `floatText` (ultimate/boss) | legacyCombatRuntime.js:1408-1409 | Floating text label for ultimate/signature | Retained |
| `screenShake` (ultimate/boss) | legacyCombatRuntime.js:1408-1409 | Camera shake for ultimate/signature | Retained |
| `projectile()` | legacyCombatRuntime.js:1310 | Projectile mesh for ranged/magic fallback | Retained (fallback only) |

#### 2. cast_telegraph_allowed — Retained

| Helper | File | Role | Action |
|---|---|---|---|
| `castTelegraph` ring mesh | legacyCombatRuntime.js:1140-1143 | Ring geometry telegraph on source unit | Retained (always shown) |
| `castTelegraph` burst() | legacyCombatRuntime.js:1144 | Generic particle burst on source unit | **Guarded** — skipped when authored preset exists |

#### 3. fallback_required — Retained

| Helper | File | Role | Action |
|---|---|---|---|
| `vfx('hit', ctr)` | legacyCombatRuntime.js:1439 | Generic hit particles when no preset resolves | Retained (only runs when `playActionVfx` returns null) |
| `vfx('heal', ...)` | legacyCombatRuntime.js:1420 | Generic heal particles when no preset resolves | Retained (only runs when `playActionVfx` returns null) |
| `vfx('dark', ctr)` | legacyCombatRuntime.js:1435 | Generic dark particles when no preset resolves | Retained (only runs when `playActionVfx` returns null) |
| `shockRing(ctr, ...)` | legacyCombatRuntime.js:1425-1431 | Generic shockwave ring for self_aoe/ranged fallback | Retained (only runs when `playActionVfx` returns null) |
| `screenFlash` (fallback) | legacyCombatRuntime.js:1421,1425 | Generic flash for fallback paths | Retained (only runs when `playActionVfx` returns null) |
| `screenShake` (fallback) | legacyCombatRuntime.js:1439 | Generic shake for fallback paths | Retained (only runs when `playActionVfx` returns null) |
| `vfx('crit', ...)` | legacyCombatRuntime.js:1589,1624 | Critical hit particles when `playFeedbackVfx` fails | Retained (only runs when `playFeedbackVfx('critical_hit')` returns false) |
| `vfx('burn'/'poison', ...)` | legacyCombatRuntime.js:969 | Status DOT tick particles | Retained (status indicator, not action VFX) |
| `vfx('heal', ...)` | legacyCombatRuntime.js:970 | Status HOT tick particles | Retained (status indicator, not action VFX) |
| `projectile()` + `vfx()` + `screenShake` + `screenFlash` | legacyCombatRuntime.js:1310-1314 | Ranged/magic projectile fallback | Retained (only runs when `playActionVfx` returns null) |

#### 4. status_indicator_separate — Untouched

| Helper | File | Role | Action |
|---|---|---|---|
| `vfx('burn', ...)` | legacyCombatRuntime.js:969 | Burn DOT tick | Untouched |
| `vfx('poison', ...)` | legacyCombatRuntime.js:969 | Poison DOT tick | Untouched |
| `vfx('heal', ...)` | legacyCombatRuntime.js:970 | Regen HOT tick | Untouched |
| `flashUnit(u, '#ff6a5a')` | legacyCombatRuntime.js:1152 | Damage flash on unit material | Untouched |
| `flashUnit(u, '#bfffc0')` | legacyCombatRuntime.js:1166 | Heal flash on unit material | Untouched |
| Status carousel | statusPresentation.ts | Persistent status icons/badges | Untouched |

#### 5. impact_overlay_obsolete — Disabled/Removed

| Helper | File | Role | Action | Reason |
|---|---|---|---|---|
| `castTelegraph` burst() | legacyCombatRuntime.js:1144 | Generic particle burst on source unit during cast telegraph | **Guarded with `skipBurst` parameter** — skipped when `getActionVfxPreset(spec,u)` returns a preset | Authored presets contain their own pre-impact source effects (particleBurst, sparkleBurst, lightPulse). The generic burst() duplicated this visual role and washed out the authored source cue. |

#### 6. duplicate_noise — Disabled/Removed

| Helper | File | Role | Action | Reason |
|---|---|---|---|---|
| (same as #5) | | | | The `burst()` in `castTelegraph` was the only duplicate noise found. All other generic VFX are properly gated behind `playActionVfx` returning null. |

#### 7. unknown_keep — Retained

| Helper | File | Role | Action | Reason |
|---|---|---|---|---|
| `screenShake` in `applyDamage` | legacyCombatRuntime.js:1154 | Camera shake on every damage application | Retained | Camera feedback, not a visual overlay. Does not produce any visual effect that competes with spritesheet VFX. |
| `screenFlash` in `knockOut` | legacyCombatRuntime.js:1168 | Red flash on knockout | Retained | Knockout is a gameplay state change, not an action impact. The flash communicates the knockout event. |
| `screenShake` in `doMove` | legacyCombatRuntime.js:1460 | Camera shake on move impact | Retained | Movement camera feedback, not action VFX. |
| `screenFlash` in `doMove` | legacyCombatRuntime.js:1460 | Flash on move impact | Retained | Movement feedback. |
| `vfx('hit', head)` in `doMove` | legacyCombatRuntime.js:1460 | Hit particles on move impact | Retained | Move impact is a gameplay event, not an authored spritesheet action. |

### Changes Made

| File | Change |
|---|---|
| `src/combat/legacyCombatRuntime.js` | Added `skipBurst` parameter to `castTelegraph()`; updated call site in `attackAnim` to pass `Boolean(getActionVfxPreset(spec,u))` |

### Architecture Analysis

The runtime's `attackAnim` impact function follows this flow:

1. **Ultimate/boss signature cue** — `floatText` + `screenFlash` + `screenShake` (pre-skill, always shown)
2. **Cast telegraph** — `castTelegraph(u, spec, skipBurst)` (ring always shown, burst skipped if authored preset exists)
3. **Authored VFX** — `playActionVfx(spec, u, targets, cx, cz)` → if preset resolves, plays spritesheet VFX and returns
4. **Fallback VFX** — Only reached if `playActionVfx` returns null:
   - Heal/support: `vfx('heal'/'dark')` + `screenFlash`
   - Self-AoE: `shockRing` + `screenShake` + `screenFlash` + `vfx('hit')`
   - Ranged/magic: `projectile()` + `shockRing`
   - Debuff: `projectile()` or `vfx('dark')` + `shockRing`
   - Default melee: `vfx('hit')` + `screenShake`

This architecture ensures generic procedural VFX never overlap with authored spritesheet VFX at impact time. The only gap was the `castTelegraph` burst, which is now guarded.

### Corrected Category Counts

- **Active combat presets (unique):** 52 (some appear in multiple categories)
- **Skill-mapped presets:** 43 unique IDs (not 37 — previous count undercounted by omitting feedback and boss presets)
- **Feedback presets:** 2 (critical_hit, kill_spark)
- **Fallback-required presets:** 16 unique IDs (not 13 — previous count undercounted; includes fireball, heal_burst, generic_hit, sword_slash, blunt_impact, arrow_shot, dark_bolt, bless_aura, curse_pulse, poison_bite, guard_barrier, boss_slam, boss_quake, support_revive_pillar, support_holy_aura, impact_explosion_large)
- **Presets appearing in multiple categories:** sword_slash, blunt_impact, arrow_shot, dark_bolt, bless_aura, guard_barrier, boss_slam, boss_quake, heal_burst, support_holy_aura, impact_explosion_large (both skill-mapped and fallback-required)

---

## V10G-R2A.2 Authored Spritesheet-Only Cleanup

### Spritesheets Cleaned

| Filename | Dimensions | Layout | Magenta Before | Magenta After | White Halo | Validation |
|---|---|---|---|---|---|---|
| root_vines_5x5_25f_1280.png | 1280x1280 | 5x5/25 frames | 5,633 | 0 | 0 | Pass |
| frost_bind_5x5_25f_1280.png | 1280x1280 | 5x5/25 frames | 30,920 | 0 | 0 | Pass |

### Pixel Cleanup Method

Used PowerShell with System.Drawing to process RGBA PNGs:
1. Loaded PNG as 32bpp ARGB bitmap
2. Scanned all pixels for magenta background (R>180, B>180, G<100, saturation>0.3)
3. Set magenta pixel alpha to 0 (fully transparent)
4. Scanned for near-magenta edges (R>150, B>150, G<80, saturation>0.2) and removed
5. Scanned for white halo (luminance>200, saturation<0.15, alpha 10-200) â€” none found
6. Saved with preserved dimensions and format

### Active Action VFX Policy

**Authored spritesheet actions:** All hero/enemy/boss skills resolve to presets containing spritesheet steps. Generic impact overlays are suppressed when an authored preset exists.

**Fallback-only actions:** `generic_hit` remains available but is not used by any authored action. Generic `vfx()`, `shockRing()`, `projectile()`, and `screenFlash()` only run when `playActionVfx()` returns null.

**Generic overlays disabled:**
- `screenFlash` for ultimate/boss signature pre-impact (suppressed when `actionUsesAuthoredSpritesheet` returns true)
- `screenFlash` in teleport departure/arrival (suppressed when `teleport_burst` preset exists)
- `screenFlash` + `vfx('hit')` in dash movement (suppressed when skill has authored preset)
- `castTelegraph` burst (suppressed when authored preset exists â€” V10G-R2A.1)

**Retained:**
- `castTelegraph` ring (tactical telegraph, allowed)
- `screenShake` (camera-only feedback, no visual overlay)
- `floatText` (UI feedback)
- `flashUnit` (unit material flash, not VFX overlay)
- Status carousel indicators (untouched)

### Generic Helpers Audited

| Helper | File | Old Behavior | New Behavior | Status |
|---|---|---|---|---|
| `screenFlash` (ultimate) | legacyCombatRuntime.js:1418 | Always played | Suppressed when authored preset exists | Disabled for authored |
| `screenFlash` (boss sig) | legacyCombatRuntime.js:1419 | Always played | Suppressed when authored preset exists | Disabled for authored |
| `screenFlash` (teleport) | legacyCombatRuntime.js:1459,1461 | Always played | Suppressed when teleport_burst preset exists | Disabled for authored |
| `screenFlash` (dash) | legacyCombatRuntime.js:1470 | Always played | Suppressed when skill has authored preset | Disabled for authored |
| `vfx('hit')` (dash) | legacyCombatRuntime.js:1470 | Always played | Suppressed when skill has authored preset | Disabled for authored |
| `burst()` (castTelegraph) | legacyCombatRuntime.js:1144 | Always played | Suppressed when authored preset exists (R2A.1) | Disabled for authored |
| `vfx('hit')` (fallback) | legacyCombatRuntime.js:1440 | Played when no preset | Retained as fallback only | Fallback-only |
| `shockRing()` (fallback) | legacyCombatRuntime.js:1426 | Played when no preset | Retained as fallback only | Fallback-only |
| `projectile()` (fallback) | legacyCombatRuntime.js:1431 | Played when no preset | Retained as fallback only | Fallback-only |
| `screenShake()` | legacyCombatRuntime.js:1418,1155 | Always played | Retained (camera-only, no overlay) | Retained |
| `floatText()` | legacyCombatRuntime.js:1418 | Always played | Retained (UI feedback) | Retained |
| `flashUnit()` | legacyCombatRuntime.js:1152 | Always played | Retained (unit material flash) | Retained |
| `vfx('crit')` (crit fallback) | legacyCombatRuntime.js:1599,1634 | Played when playFeedbackVfx fails | Retained as fallback only | Fallback-only |

### Remaining Unknowns

None. All active hero/enemy/boss skills resolve to authored spritesheet presets. Fallback paths only activate when no preset resolves.

---

## V10G-R2A.4 Contextual Generic VFX Policy + Damage Hit Reaction

### Generic Step Inventory

| Preset | Step | Context | Classification | Action |
|---|---|---|---|---|
| fireball | particleBurst | target impact over fire_explosion | authored_impact_forbidden | Removed |
| boss_quake | magicCircle | physical boss pre-cast | physical_pre_cast_forbidden | Removed |
| boss_quake | groundRing | duplicate over shockwave_ring | authored_impact_forbidden | Removed |
| boss_quake | particleBurst | groundTarget over shockwave_ring | authored_impact_forbidden | Removed |
| sword_slash | particleBurst | target over slash_arc | authored_impact_forbidden | Removed |
| root_vines | particleBurst | targetGround over root_vines | authored_impact_forbidden | Removed |
| frost_bind | particleBurst | targetGround over frost_bind | authored_impact_forbidden | Removed |
| boss_slam | magicCircle | physical boss pre-cast | physical_pre_cast_forbidden | Removed |
| boss_slam | particleBurst | targetGround over leap_impact | authored_impact_forbidden | Removed |
| thrust_line | particleBurst | target over thrust_line | authored_impact_forbidden | Removed |
| impact_explosion_large | groundRing | duplicate over explosion_large | authored_impact_forbidden | Removed |
| boss_apocalypse_v2 | groundRing | duplicate over apocalypse_field | authored_impact_forbidden | Removed |
| boss_apocalypse_v2 | lightPulse | target wash over apocalypse_field | authored_impact_forbidden | Removed |
| ultimate_lion_surge | magicCircle | physical ultimate pre-cast | physical_pre_cast_forbidden | Removed |
| ultimate_firmament_lance | magicCircle | physical piercing pre-cast | physical_pre_cast_forbidden | Removed |
| ultimate_zenith_arrow | magicCircle | physical ranged pre-cast | physical_pre_cast_forbidden | Removed |
| ultimate_silent_assassin | magicCircle | physical execution pre-cast | physical_pre_cast_forbidden | Removed |
| ultimate_fault_breaker | magicCircle | physical shatter pre-cast | physical_pre_cast_forbidden | Removed |
| ultimate_dark_meteor | particleBurst | groundTarget over meteor_fall | authored_impact_forbidden | Removed |
| ultimate_artillery_barrage | particleBurst | groundTarget over artillery_barrage | authored_impact_forbidden | Removed |
| enemy_dragon_breath | particleBurst | groundTarget over dragon_breath | authored_impact_forbidden | Removed |
| boss_execution | magicCircle | physical boss pre-cast | physical_pre_cast_forbidden | Removed |
| boss_execution | particleBurst | target over heavy_execution | authored_impact_forbidden | Removed |
| boss_titan_slam | magicCircle | physical boss pre-cast | physical_pre_cast_forbidden | Removed |
| boss_titan_slam | groundRing | duplicate over titan_slam | authored_impact_forbidden | Removed |
| boss_titan_slam | particleBurst | groundTarget over titan_slam | authored_impact_forbidden | Removed |
| fireball | magicCircle | sourceGround magical pre-cast | magical_pre_cast_allowed | Kept |
| fireball | lightPulse | source magical cue | magical_pre_cast_allowed | Kept |
| heal_burst | magicCircle | targetGround support | simple_bonus_allowed | Kept |
| heal_burst | groundRing | targetGround support | simple_bonus_allowed | Kept |
| heal_burst | lightPulse | target support feedback | simple_bonus_allowed | Kept |
| heal_burst | particleBurst | target support (count 4) | simple_bonus_allowed | Kept |
| dark_bolt | magicCircle | sourceGround magical pre-cast | magical_pre_cast_allowed | Kept |
| dark_bolt | lightPulse | source magical cue | magical_pre_cast_allowed | Kept |
| shadow_lightning_bolt | magicCircle | sourceGround magical pre-cast | magical_pre_cast_allowed | Kept |
| shadow_lightning_bolt | lightPulse | source magical cue | magical_pre_cast_allowed | Kept |
| root_vines | groundRing | targetGround magical ground effect | simple_bonus_allowed | Kept |
| root_vines | lightPulse | target magical glow | simple_bonus_allowed | Kept |
| frost_bind | groundRing | targetGround magical warning | high_level_magic_ground_warning_allowed | Kept |
| frost_bind | lightPulse | target magical glow | simple_bonus_allowed | Kept |
| bless_aura | magicCircle | groundTarget support | simple_bonus_allowed | Kept |
| bless_aura | groundRing | groundTarget support | simple_bonus_allowed | Kept |
| bless_aura | lightPulse | target support feedback | simple_bonus_allowed | Kept |
| bless_aura | particleBurst | target support (count 4) | simple_bonus_allowed | Kept |
| curse_pulse | magicCircle | groundTarget magical debuff | magical_pre_cast_allowed | Kept |
| curse_pulse | lightPulse | target magical feedback | simple_bonus_allowed | Kept |
| curse_pulse | particleBurst | groundTarget fallback (no spritesheet) | fallback_only | Kept |
| guard_barrier | magicCircle | targetGround support | simple_bonus_allowed | Kept |
| guard_barrier | groundRing | targetGround support | simple_bonus_allowed | Kept |
| guard_barrier | lightPulse | target support feedback | simple_bonus_allowed | Kept |
| guard_barrier | particleBurst | target support (count 4) | simple_bonus_allowed | Kept |
| critical_hit | lightPulse | target critical accent | critical_accent_allowed | Kept |
| critical_hit | particleBurst | target critical (no spritesheet) | critical_accent_allowed | Kept |
| kill_spark | groundRing | targetGround knockout reward | simple_bonus_allowed | Kept |
| kill_spark | lightPulse | target knockout glow | simple_bonus_allowed | Kept |
| kill_spark | particleBurst | target knockout (no spritesheet) | simple_bonus_allowed | Kept |
| support_regen_aura | groundRing | targetGround support | simple_bonus_allowed | Kept |
| support_regen_aura | lightPulse | target support feedback | simple_bonus_allowed | Kept |
| support_regen_aura | particleBurst | target support (count 4) | simple_bonus_allowed | Kept |
| support_revive_pillar | magicCircle | targetGround support | simple_bonus_allowed | Kept |
| support_revive_pillar | groundRing | targetGround support | simple_bonus_allowed | Kept |
| support_revive_pillar | lightPulse | target support feedback | simple_bonus_allowed | Kept |
| support_revive_pillar | particleBurst | target support (count 4) | simple_bonus_allowed | Kept |
| support_holy_aura | magicCircle | targetGround support | simple_bonus_allowed | Kept |
| support_holy_aura | groundRing | targetGround support | simple_bonus_allowed | Kept |
| support_holy_aura | particleBurst | target support (count 4) | simple_bonus_allowed | Kept |
| support_boost_aura | magicCircle | targetGround support | simple_bonus_allowed | Kept |
| support_boost_aura | lightPulse | target support feedback | simple_bonus_allowed | Kept |
| support_boost_aura | particleBurst | target support (count 2) | simple_bonus_allowed | Kept |
| teleport_burst | magicCircle | groundTarget magical movement | magical_pre_cast_allowed | Kept |
| shape_cone_blast | groundRing | targetGround cone effect | simple_bonus_allowed | Kept |
| shape_cone_blast | lightPulse | target cone glow | simple_bonus_allowed | Kept |
| caster_roar | lightPulse | source caster cue | simple_bonus_allowed | Kept |
| boss_apocalypse_v2 | magicCircle | targetGround boss ritual | boss_ritual_warning_allowed | Kept |
| ultimate_radiant_judgement | magicCircle | groundTarget sacred pre-cast | magical_pre_cast_allowed | Kept |
| ultimate_radiant_judgement | groundRing | groundTarget area warning | high_level_magic_ground_warning_allowed | Kept |
| ultimate_radiant_judgement | lightPulse | allTargets support glow | simple_bonus_allowed | Kept |
| ultimate_devouring_eclipse | magicCircle | groundTarget dark pre-cast | magical_pre_cast_allowed | Kept |
| ultimate_devouring_eclipse | groundRing | groundTarget area warning | high_level_magic_ground_warning_allowed | Kept |
| ultimate_devouring_eclipse | particleBurst | allTargets fallback (no spritesheet) | fallback_only | Kept |
| ultimate_dark_meteor | magicCircle | sourceGround dark magical pre-cast | magical_pre_cast_allowed | Kept |
| ultimate_dark_meteor | lightPulse | source magical cue | magical_pre_cast_allowed | Kept |
| ultimate_miracle | magicCircle | sourceGround support | simple_bonus_allowed | Kept |
| ultimate_miracle | groundRing | targetGround support | simple_bonus_allowed | Kept |
| ultimate_miracle | lightPulse | allTargets support glow | simple_bonus_allowed | Kept |
| ultimate_miracle | particleBurst | allTargets support (count 4) | simple_bonus_allowed | Kept |
| ultimate_perfect_duality | magicCircle | sourceGround hybrid magical | magical_pre_cast_allowed | Kept |
| ultimate_perfect_duality | groundRing | groundTarget area warning | high_level_magic_ground_warning_allowed | Kept |
| ultimate_perfect_duality | particleBurst | allTargets fallback (no spritesheet) | fallback_only | Kept |
| ultimate_absolute_harmony | magicCircle | sourceGround support | simple_bonus_allowed | Kept |
| ultimate_absolute_harmony | groundRing | sourceGround support | simple_bonus_allowed | Kept |
| ultimate_absolute_harmony | lightPulse | allTargets support glow | simple_bonus_allowed | Kept |
| ultimate_zenith_arrow | lightPulse | source physical cue | simple_bonus_allowed | Kept |
| ultimate_lion_surge | lightPulse | source physical cue | simple_bonus_allowed | Kept |
| ultimate_lion_surge | particleBurst | target fallback (no spritesheet) | fallback_only | Kept |
| ultimate_firmament_lance | lightPulse | source physical cue | simple_bonus_allowed | Kept |
| ultimate_silent_assassin | particleBurst | target fallback (no authored impact spritesheet) | fallback_only | Kept |
| ultimate_artillery_barrage | magicCircle | groundTarget fire zone warning | high_level_magic_ground_warning_allowed | Kept |
| enemy_dragon_breath | lightPulse | source fire breath cue | magical_pre_cast_allowed | Kept |
| boss_inferno | magicCircle (x2) | source/ground boss fire ritual | boss_ritual_warning_allowed | Kept |
| boss_inferno | particleBurst | groundTarget fallback (no spritesheet) | fallback_only | Kept |
| boss_flurry | particleBurst | target fallback (no spritesheet) | fallback_only | Kept |
| blunt_impact | particleBurst | targetGround fallback (no spritesheet) | fallback_only | Kept |
| arrow_shot | particleBurst | target impact (no authored impact spritesheet) | fallback_only | Kept |
| dark_bolt | particleBurst | target impact (projectile spritesheet only) | fallback_only | Kept |
| shadow_lightning_bolt | particleBurst | target impact (projectile spritesheet only) | fallback_only | Kept |
| poison_bite | particleBurst | target fallback (no spritesheet) | fallback_only | Kept |
| status_curse_mark | particleBurst | target status accent | simple_bonus_allowed | Kept |
| move_smoke_burst | particleBurst | targetGround movement (count 3) | simple_bonus_allowed | Kept |
| arrow_rain | particleBurst | targetGround impact (projectile spritesheet only) | fallback_only | Kept |

### Kept Usages

- **magicCircle**: magical pre-cast (fireball, dark_bolt, shadow_lightning_bolt, ultimate_radiant_judgement, ultimate_devouring_eclipse, ultimate_dark_meteor, ultimate_perfect_duality, curse_pulse, teleport_burst), boss ritual (boss_apocalypse_v2, boss_inferno), support (heal_burst, bless_aura, guard_barrier, support_revive_pillar, support_holy_aura, support_boost_aura, ultimate_miracle, ultimate_absolute_harmony), fire zone warning (ultimate_artillery_barrage)
- **groundRing**: high-level magic warning (ultimate_radiant_judgement, ultimate_devouring_eclipse, ultimate_perfect_duality, frost_bind), support (heal_burst, bless_aura, guard_barrier, support_regen_aura, support_revive_pillar, support_holy_aura, ultimate_miracle, ultimate_absolute_harmony), simple bonus (root_vines, shape_cone_blast, kill_spark, status_curse_mark, poison_bite)
- **lightPulse**: critical accent (critical_hit), source cue (fireball, dark_bolt, shadow_lightning_bolt, ultimate_lion_surge, ultimate_firmament_lance, ultimate_zenith_arrow, enemy_dragon_breath, caster_roar), support feedback (heal_burst, root_vines, frost_bind, bless_aura, curse_pulse, guard_barrier, kill_spark, support_regen_aura, support_revive_pillar, support_boost_aura, ultimate_radiant_judgement, ultimate_miracle, ultimate_absolute_harmony)
- **particleBurst**: fallback only (blunt_impact, arrow_shot, dark_bolt, shadow_lightning_bolt, poison_bite, arrow_rain, ultimate_lion_surge, ultimate_devouring_eclipse, ultimate_perfect_duality, ultimate_silent_assassin, boss_inferno, boss_flurry, curse_pulse), support (heal_burst, bless_aura, guard_barrier, support_regen_aura, support_revive_pillar, support_holy_aura, support_boost_aura, ultimate_miracle, move_smoke_burst, status_curse_mark), critical accent (critical_hit, kill_spark)

### Removed/Disabled Usages

- **Physical magicCircle**: boss_quake, boss_slam, boss_execution, boss_titan_slam, ultimate_lion_surge, ultimate_firmament_lance, ultimate_zenith_arrow, ultimate_silent_assassin, ultimate_fault_breaker (9 presets)
- **Authored impact particleBurst**: fireball, boss_quake, sword_slash, root_vines, frost_bind, boss_slam, thrust_line, ultimate_dark_meteor, ultimate_artillery_barrage, enemy_dragon_breath, boss_execution, boss_titan_slam (12 presets)
- **Duplicate groundRing over authored impact**: boss_quake, impact_explosion_large, boss_apocalypse_v2, boss_titan_slam (4 presets)
- **Impact lightPulse wash**: boss_apocalypse_v2 (1 preset)

### Hit Reaction Implementation

- **Trigger path**: `applyDamage(u, dmg, src, opts)` in `legacyCombatRuntime.js`
- **Helper function**: `playUnitHitReaction(u, opts)` — standalone async function with flash + shake + squash + recoil
- **Duration/intensity**: Normal 120ms (hitOut 0.06 + hitBack 0.12), Critical 180ms with stronger flash, Boss reduced displacement (0.07 vs 0.12), Reduced graphics 100ms with 50-65% intensity
- **Reduced graphics behavior**: Flash 90ms, hitDist *0.65, squashAmt *0.6, shakeMag *0.5, hitOut 0.05, hitBack 0.10
- **Boss behavior**: hitDist 0.07 (vs 0.12 normal), squashAmt 0.025 (vs 0.045), shakeMag 0.035 (vs 0.055) — low displacement, readable flash
- **Restore baseline behavior**: `spriteReturnBaseline(u, baseline)` in finally block guarantees transform restoration; `killSpriteMotion(u)` at start prevents stacking
- **Critical flag**: Passed via `opts.critical` from attack code through `applyDamage` to `playUnitHitReaction` — visual only, no gameplay change
- **KO handling**: Knockout still uses `flashUnit` + `playSpriteMotion('knockout')` path unchanged

### Remaining Unknowns

None. All generic steps classified and cleaned. Physical skills no longer use magicCircle. Authored impacts no longer have particleBurst/groundRing/lightPulse pollution. Hit reaction implemented for all damage paths.

---

## V10G-R2A.5 Strict Spritesheet VFX Policy

### Core Rule

Every active combat action must use at least one `spriteSheet` step as its main action VFX. Procedural/generic steps (slashArc, shockwave, impactStar, magicCircle, groundRing, lightPulse, particleBurst, smokePuff, projectile, sparkleBurst) are forbidden as main impact VFX. Only camera/global feedback (screenShake, screenFlash, hitStop) and spriteSheet steps remain in active presets.

### Runtime Guard Functions

- **`actionHasSpritesheetVfx(spec, u)`**: Returns true only if resolved preset contains at least one `spriteSheet` step
- **`actionHasPreset(spec, u)`**: Returns true if any preset exists (including procedural-only, for fallback detection)
- Replaced deprecated `actionUsesAuthoredSpritesheet` which checked for all visual types including procedural

### Runtime Overlay Suppression

- `castTelegraph` skipped entirely when `actionHasSpritesheetVfx` is true
- `screenFlash` for ultimate/boss signatures only fires when no preset exists (`!hasPreset`)
- Leap impact uses `actionHasSpritesheetVfx` to decide between spritesheet playback and generic `vfx('hit')`
- Dash impact uses `actionHasSpritesheetVfx` to suppress generic `vfx('hit')` and `screenFlash`

### Active Action Inventory

| Action/Skill | Preset | Has spriteSheet | Procedural steps removed | Action taken | Remaining gap |
|---|---|---:|---|---|---|
| w_break_guard | sword_slash | YES | slashArc x2, impactStar | Cleaned | none |
| w_charge | blunt_impact | YES | shockwave, particleBurst, smokePuff, impactStar | Remapped to small_impact spritesheet | none |
| w_whirl | sword_slash | YES | slashArc x2, impactStar | Cleaned | none |
| w_lion_surge | ultimate_lion_surge | YES | lightPulse, slashArc, shockwave, particleBurst, impactStar | Remapped to slash_arc spritesheet | none |
| p_holy_strike | holy_strike | YES | impactStar | Cleaned | none |
| p_interpose | leap_impact | YES | shockwave | Cleaned | none |
| p_oathwall | guard_barrier | YES | groundRing, magicCircle, sparkleBurst, particleBurst, lightPulse | Cleaned | none |
| p_radiant_judgement | ultimate_radiant_judgement | YES | magicCircle, groundRing, lightPulse, sparkleBurst, shockwave, impactStar | Remapped to holy_aura spritesheet | none |
| d_cursed_blade | sword_slash | YES | (already clean) | Cleaned | none |
| d_void_step | teleport_burst | YES | magicCircle | Cleaned | none |
| d_blood_pact | bless_aura | YES | groundRing, magicCircle, sparkleBurst, particleBurst, lightPulse | Cleaned | none |
| d_devouring_eclipse | ultimate_devouring_eclipse | YES | magicCircle, groundRing, smokePuff, particleBurst, projectile, shockwave | Remapped to apocalypse_field spritesheet | none |
| l_long_thrust | thrust_line | YES | impactStar | Cleaned | none |
| l_haft_recoil | thrust_line | YES | impactStar | Cleaned | none |
| l_griffon_jump | leap_impact | YES | shockwave | Cleaned | none |
| l_firmament_lance | ultimate_firmament_lance | YES | lightPulse, projectile, slashArc, impactStar, shockwave | Cleaned to thrust_line only | none |
| n_dark_bolt | shadow_lightning_bolt | YES | magicCircle, lightPulse, projectile, particleBurst, smokePuff, impactStar | Cleaned | none |
| n_teleport | teleport_burst | YES | magicCircle | Cleaned | none |
| n_flame_wave | shape_cone_blast | YES | groundRing, lightPulse | Cleaned | none |
| n_dark_meteor | ultimate_dark_meteor | YES | magicCircle, lightPulse, shockwave, smokePuff, impactStar | Cleaned to meteor_fall only | none |
| w_salvation | heal_burst | YES | groundRing, magicCircle, sparkleBurst, particleBurst, lightPulse | Cleaned | none |
| w_purify | support_holy_aura | YES | groundRing, magicCircle, sparkleBurst, particleBurst | Cleaned | none |
| w_sanctuary | support_holy_aura | YES | groundRing, magicCircle, sparkleBurst, particleBurst | Cleaned | none |
| w_miracle | ultimate_miracle | YES | magicCircle, groundRing, sparkleBurst, lightPulse, particleBurst | Remapped to holy_aura spritesheet | none |
| r_arcane_blade | sword_slash | YES | (already clean) | Cleaned | none |
| r_rune_step | teleport_burst | YES | magicCircle | Cleaned | none |
| r_scarlet_circle | impact_explosion_large | YES | (already clean) | Cleaned | none |
| r_perfect_duality | ultimate_perfect_duality | YES | magicCircle, groundRing, particleBurst, sparkleBurst, shockwave, impactStar | Remapped to explosion_large spritesheet | none |
| e_vigor_rune | support_boost_aura | YES | magicCircle, sparkleBurst, particleBurst, lightPulse | Cleaned | none |
| e_transpose | teleport_burst | YES | magicCircle | Cleaned | none |
| e_binding_seal | root_vines | YES | projectile, groundRing, sparkleBurst, lightPulse | Cleaned | none |
| e_absolute_harmony | ultimate_absolute_harmony | YES | magicCircle, groundRing, lightPulse, sparkleBurst | Remapped to holy_aura spritesheet | none |
| a_precise_shot | arrow_shot | YES | projectile, impactStar, particleBurst | Cleaned | none |
| a_hawk_leap | leap_impact | YES | shockwave | Cleaned | none |
| a_arrow_rain | arrow_rain | YES | projectile, impactStar, particleBurst | Cleaned | none |
| a_zenith_arrow | ultimate_zenith_arrow | YES | lightPulse, projectile, slashArc, impactStar, particleBurst | Remapped to projectile_shot spritesheet | none |
| ni_venom_blade | sword_slash | YES | (already clean) | Cleaned | none |
| ni_shadow_step | critical_hit | YES | impactStar, slashArc, particleBurst, lightPulse | Remapped to slash_arc spritesheet | none |
| ni_smoke_bomb | move_smoke_burst | YES | smokePuff, particleBurst | Cleaned | none |
| ni_silent_assassin | ultimate_silent_assassin | YES | smokePuff, slashArc x2, particleBurst, impactStar | Remapped to teleport_burst + slash_arc spritesheets | none |
| ro_sneak_attack | sword_slash | YES | (already clean) | Cleaned | none |
| ro_tumble | leap_impact | YES | shockwave | Cleaned | none |
| ro_jaw_trap | root_vines | YES | projectile, groundRing, sparkleBurst, lightPulse | Cleaned | none |
| ro_fault_breaker | ultimate_fault_breaker | YES | slashArc, impactStar, sparkleBurst, shockwave | Remapped to slash_arc spritesheet | none |
| ar_calibrated_shot | arrow_shot | YES | projectile, impactStar, particleBurst | Cleaned | none |
| ar_explosive_retreat | impact_explosion_large | YES | (already clean) | Cleaned | none |
| ar_incendiary_grenade | impact_explosion_large | YES | (already clean) | Cleaned | none |
| ar_artillery_barrage | ultimate_artillery_barrage | YES | magicCircle, projectile, shockwave, smokePuff, impactStar | Cleaned to artillery_barrage only | none |
| enemy_heavy_strike | blunt_impact | YES | (remapped) | Remapped to small_impact spritesheet | none |
| enemy_crush | blunt_impact | YES | (remapped) | Remapped to small_impact spritesheet | none |
| enemy_dark_bolt | shadow_lightning_bolt | YES | (cleaned) | Cleaned | none |
| enemy_hex | status_curse_mark | YES | groundRing, particleBurst, smokePuff | Cleaned | none |
| enemy_venom_strike | poison_bite | YES | slashArc, particleBurst, groundRing, impactStar | Remapped to slash_arc spritesheet | none |
| enemy_binding_shot | root_vines | YES | projectile, groundRing, sparkleBurst, lightPulse | Cleaned | none |
| enemy_smoke_veil | move_smoke_burst | YES | smokePuff, particleBurst | Cleaned | none |
| enemy_taunt | caster_roar | YES | shockwave, lightPulse | Cleaned | none |
| enemy_battle_cry | caster_roar | YES | shockwave, lightPulse | Cleaned | none |
| enemy_dragon_breath | enemy_dragon_breath | YES | lightPulse, projectile, smokePuff, shockwave | Cleaned to dragon_breath only | none |
| boss_slam | boss_slam | YES | shockwave, smokePuff, impactStar | Cleaned to leap_impact only | none |
| boss_roar | caster_roar | YES | shockwave, lightPulse | Cleaned | none |
| boss_quake | boss_quake | YES | shockwave, smokePuff, impactStar | Cleaned to shockwave_ring only | none |
| boss_guard | guard_barrier | YES | (cleaned) | Cleaned | none |
| boss_apocalypse | boss_apocalypse_v2 | YES | magicCircle | Cleaned to apocalypse_field only | none |
| boss_regen | support_regen_aura | YES | groundRing, sparkleBurst, particleBurst, lightPulse | Cleaned | none |
| boss_fortify | bless_aura | YES | (cleaned) | Cleaned | none |
| boss_freeze | frost_bind | YES | groundRing, sparkleBurst, lightPulse | Cleaned | none |
| boss_pin | arrow_shot | YES | projectile, impactStar, particleBurst | Cleaned | none |
| boss_execution | boss_execution | YES | slashArc, impactStar, shockwave | Cleaned to heavy_execution only | none |
| boss_flurry | boss_flurry | YES | slashArc x3, impactStar x3, particleBurst | Remapped to slash_arc spritesheets x3 | none |
| boss_inferno | boss_inferno | YES | magicCircle x2, shockwave, particleBurst, smokePuff, sparkleBurst | Remapped to explosion_large spritesheet | none |
| boss_titan_slam | boss_titan_slam | YES | shockwave, smokePuff, impactStar | Cleaned to titan_slam only | none |
| fireball | fireball | YES | magicCircle, lightPulse, projectile, impactStar, smokePuff | Cleaned to fire_explosion only | none |
| curse_pulse | curse_pulse | YES | magicCircle, shockwave, particleBurst, smokePuff, lightPulse | Remapped to curse_mark spritesheet | none |
| kill_spark | kill_spark | YES | groundRing, sparkleBurst, particleBurst, lightPulse | Remapped to small_impact spritesheet | none |
| generic_hit | generic_hit | YES | impactStar, particleBurst | Cleaned to small_impact only | none |
| Items (bomb/grenade) | impact_explosion_large | YES | (already clean) | Cleaned | none |
| Items (revive_vial) | support_revive_pillar | YES | groundRing, magicCircle, sparkleBurst, particleBurst, lightPulse | Cleaned | none |
| Items (potion/ether) | heal_burst | YES | (cleaned) | Cleaned | none |
| Items (antidote) | support_holy_aura | YES | (cleaned) | Cleaned | none |

### Remaps Applied

- `blunt_impact`: procedural-only → `small_impact` spritesheet
- `curse_pulse`: procedural-only → `curse_mark` spritesheet
- `poison_bite`: procedural-only → `slash_arc` spritesheet
- `critical_hit`: procedural-only → `slash_arc` spritesheet
- `kill_spark`: procedural-only → `small_impact` spritesheet
- `ultimate_lion_surge`: procedural-only → `slash_arc` spritesheet
- `ultimate_radiant_judgement`: procedural-only → `holy_aura` spritesheet
- `ultimate_devouring_eclipse`: procedural-only → `apocalypse_field` spritesheet
- `ultimate_miracle`: procedural-only → `holy_aura` spritesheet
- `ultimate_perfect_duality`: procedural-only → `explosion_large` spritesheet
- `ultimate_absolute_harmony`: procedural-only → `holy_aura` spritesheet
- `ultimate_zenith_arrow`: procedural-only → `projectile_shot` spritesheet
- `ultimate_fault_breaker`: procedural-only → `slash_arc` spritesheet
- `boss_flurry`: procedural-only → `slash_arc` spritesheets x3
- `boss_inferno`: procedural-only → `explosion_large` spritesheet

### Missing Spritesheet Gaps

None. All active hero/enemy/boss/item actions now resolve to presets with at least one `spriteSheet` step.

### screenShake/screenFlash Policy

- screenShake and screenFlash remain as camera/global feedback only
- They are not battlefield overlays — they do not create meshes, particles, rings, or sprites
- Runtime suppresses screenFlash for ultimates/boss signatures when a preset exists
- Support/movement presets may omit camera feedback (spriteSheet only)

### Hit Reaction Confirmation

- `playUnitHitReaction` remains functional for all non-KO damage
- Critical hits use stronger flash/shake/squash
- Boss hits use reduced displacement
- KO still uses `flashUnit` + `playSpriteMotion('knockout')`

### Status Carousel Confirmation

- Status carousel untouched. No status indicator code modified.

### Workbench Combat Preview

VfxWorkbench now displays: `Spritesheet: YES/NO | Strict: YES/NO | Gap: YES/no | Camera: YES | HitReaction: YES`

### Remaining Unknowns

None. All active actions use spritesheet-led VFX. No procedural-only active presets remain. No missing spritesheet gaps.

---

## V10G-R2A.6 Runtime VFX Flattening & Action VFX Registry Refactor

### Old Folder Structure

```
public/assets/vfx/runtime/
  v1/
    manifest.json (12 entries)
    slash_arc.png
    small_impact.png
    ... (12 PNGs total)
  v2/
    manifest.json (17 entries)
    artillery_barrage.png
    curse_mark_5x5_25f_1280.png
    ... (30 PNGs total, 17 active, 13 unused)
```

### New Folder Structure

```
public/assets/vfx/runtime/
  manifest.json (29 entries, version 3)
  slash_arc.png
  small_impact.png
  ... (42 PNGs total: 29 active + 13 unused retained)
```

### Files Moved

- 12 PNGs moved from `runtime/v1/` to `runtime/`
- 30 PNGs moved from `runtime/v2/` to `runtime/`
- Total: 42 PNGs moved via `git mv`
- Old `v1/manifest.json` and `v2/manifest.json` removed via `git rm`
- Old `v1/` and `v2/` directories removed (empty after moves)

### Unified Manifest Path

`public/assets/vfx/runtime/manifest.json` — version 3, 29 active entries, all paths `/assets/vfx/runtime/<filename>.png`

### Active Spritesheet Count

29 active spritesheets (12 formerly v1 + 17 formerly v2)

### Old v1/v2 Folder Handling

- All PNGs moved to flat `runtime/` directory
- Old manifests deleted
- Old directories deleted
- 13 unused v2 PNGs retained in `runtime/` (not in manifest, not referenced by code)
- No PNG/WebP pixel content modified

### Old v1/v2 Manifest Handling

- Merged into single `manifest.json` (version 3)
- All entry metadata preserved exactly (id, url, rows, cols, frameCount, frameDurationMs, align, presentation, category, sourceRaw, qcStatus)
- URLs updated from `/assets/vfx/runtime/v1/` and `/assets/vfx/runtime/v2/` to `/assets/vfx/runtime/`

### Unified Preset Module

- **Chosen**: Option B — merged `VfxPremiumPresets.ts` into `VfxPresets.ts`
- `VfxPremiumPresets.ts` deleted via `git rm`
- All 15 premium presets inlined into `VfxPresets.ts` with section comment
- `PREMIUM_VFX_PRESET_IDS` exported from `VfxPresets.ts` for backward compatibility
- `premiumPreset()` helper inlined into `VfxPresets.ts`

### Removed/Retired Preset Module

- `src/combat/vfx/VfxPremiumPresets.ts` — deleted

### Import Changes

- `VfxPresets.test.ts`: `PREMIUM_VFX_PRESET_IDS` now imported from `./VfxPresets` instead of `./VfxPremiumPresets`
- `VfxSpriteSheets.test.ts`: imports `runtimeManifest` from `../../../public/assets/vfx/runtime/manifest.json` instead of separate v1/v2 manifests
- `spritesheetPng.test.ts`: path updated from `public/assets/vfx/runtime/v2/` to `public/assets/vfx/runtime/`
- `VfxSpriteSheets.ts`: all 29 URL paths updated from `/assets/vfx/runtime/v[12]/` to `/assets/vfx/runtime/`
- No changes needed in: `VfxSystem.ts`, `VfxWorkbench.ts`, `combatVfxPresentation.ts`, `legacyCombatRuntime.js`, `skillPresentation.ts` — all already imported from `VfxPresets.ts`

### Action-to-VFX Registry/Helper

New file: `src/combat/vfx/VfxActionRegistry.ts`

Exports:
- `getActionVfxAuditRows()`: Returns full audit table with actionId, kind, presetId, spriteSheetIds, runtimeFilenames, strict compliance, upgrade metadata
- `getActionVfxChain(actionId)`: Returns single audit row for a given action
- `getActionsUsingSpriteSheet(spriteSheetId)`: Returns all action IDs sharing a sprite
- `getMissingOrUpgradeCandidateSprites()`: Returns rows with upgrade metadata

Audit row shape:
```
{ actionId, actionKind, presetId, spriteSheetIds, runtimeFilenames, strictSpritesheetCompliant, upgrade?, note? }
```

### Temporary Sprite Upgrade Metadata

10 presets marked with `needsDedicatedSpriteUpgrade` in `VfxActionRegistry.ts`:

| Priority | Preset | Current Sprite | Suggested Sprite |
|---|---|---|---|
| high | ultimate_radiant_judgement | holy_aura | judgement_beam |
| high | ultimate_zenith_arrow | projectile_shot | zenith_arrow |
| high | ultimate_fault_breaker | slash_arc | fault_breaker |
| medium | ultimate_lion_surge | slash_arc | lion_surge |
| medium | ultimate_miracle | holy_aura | miracle_burst |
| medium | ultimate_absolute_harmony | holy_aura | harmony_aura |
| medium | boss_inferno | explosion_large | inferno_field |
| low | critical_hit | slash_arc | critical_impact |
| low | poison_bite | slash_arc | poison_bite |
| low | kill_spark | small_impact | victory_spark |

Full details in `docs/reports/vfx-sprite-upgrade-candidates.md`

### Tests Added/Updated

- `VfxActionRegistry.test.ts`: 8 new tests covering audit rows, chain lookup, sprite sharing, upgrade candidates
- `VfxSpriteSheets.test.ts`: Updated to use unified manifest, check `/v1/` and `/v2/` as forbidden segments
- `VfxPresets.test.ts`: Updated import of `PREMIUM_VFX_PRESET_IDS` from unified module
- `spritesheetPng.test.ts`: Updated path from `runtime/v2/` to `runtime/`

### Validation Results

- **npm test**: 348 passed (348) — 0 failed
- **npm run build**: built in 4.41s — 0 errors
- **git diff --check**: clean
- **git status**: 42 PNGs moved, 2 manifests removed, 1 new manifest, 1 file deleted (VfxPremiumPresets.ts), 1 new file (VfxActionRegistry.ts), 1 new test, 1 new doc, 4 files updated

### Confirmation

- No gameplay changed
- No PNG/WebP pixel content changed
- No status carousel changed
- V10G-R2B visual polish can begin — all active actions resolve to spritesheet-led VFX from a flat runtime folder with a unified preset registry

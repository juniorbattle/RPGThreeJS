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

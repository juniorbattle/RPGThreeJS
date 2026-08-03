# VFX-R3E-2 — Skills Runtime Integration

**Date:** 2026-08-01  
**Status:** integrated — manual QA pending  
**Scope:** presentation-only skill impact sheets; no combat-rule change.

## Executive summary

R3E-2 promotes **17** explicitly re-qualified skill spritesheets from
`public/assets/vfx/raw/skills/` into the stable runtime library. They provide
**16** impact-only presets and **17** action mappings. The R3E-1 basic library
remains untouched: its 22 sheets, 12 action mappings, identifiers, URLs and
mono-sheet behavior were not changed.

Every promoted file is a 1280 x 1280 RGBA PNG with a 5 x 5, 25-frame layout.
All promoted runtime presentation is target-centered, impact-layered and
non-projectile. Raw assets are never loaded at runtime.

One candidate, `purple_skill_arcane_slash_burst_medium_5x5_25f_1280.png`, is
rejected in this pass because current QC detects 409 opaque magenta pixels.
The remaining 25 raw sheets are held for later semantic mapping rather than
being attached to a skill speculatively.

## Frozen baseline

- R3E-1 basic runtime library: **22** sheets, preserved unchanged.
- R3E-1 basic action mappings: **12**, preserved unchanged and mono-sheet.
- Existing V1/V2 and premium/ultimate mappings remain available as fallbacks.
- `legacyCombatRuntime.js`, combat bridge/protocol, skills, catalog, AI,
  targeting, damage, AP/PA, status rules, economy, save state and route data
  were not modified.

## Runtime promotion ledger

| Raw file | Decision | Runtime sheet ID | Runtime output | Preset |
| --- | --- | --- | --- | --- |
| `blue_skill_arcane_sigil_burst_medium_5x5_25f_1280.png` | PROMOTED | `skill_arcane_sigil_burst_medium` | same filename | `skill_binding_sigil` |
| `blue_skill_barrier_guard_heavy_5x5_25f_1280.png` | PROMOTED | `skill_barrier_guard_heavy` | same filename | `skill_oathwall` |
| `cyan_skill_arcane_orbit_burst_medium_5x5_25f_1280.png` | PROMOTED | `skill_arcane_orbit_burst_medium` | same filename | `skill_arcane_orbit` |
| `cyan_skill_wind_slash_swirl_medium_5x5_25f_1280.png` | PROMOTED | `skill_wind_slash_swirl_medium` | same filename | `skill_wind_slash_swirl` |
| `gold_skill_holy_radiance_burst_heavy_5x5_25f_1280.png` | PROMOTED | `skill_holy_radiance_burst_heavy` | same filename | `skill_holy_radiance` |
| `gold_skill_holy_sigil_burst_medium_5x5_25f_1280.png` | PROMOTED | `skill_holy_sigil_burst_medium` | same filename | `skill_holy_sigil` |
| `green_skill_barrier_nature_guard_medium_5x5_25f_1280.png` | PROMOTED | `skill_barrier_nature_guard_medium` | same filename | `skill_boss_guard` |
| `green_skill_barrier_shield_ring_medium_5x5_25f_1280.png` | PROMOTED | `skill_barrier_shield_ring_medium` | same filename | `skill_oathwall` |
| `green_skill_poison_maw_bite_heavy_5x5_25f_1280.png` | PROMOTED | `skill_poison_maw_bite_heavy` | same filename | `skill_poison_maw` |
| `green_skill_support_leaf_burst_medium_5x5_25f_1280.png` | PROMOTED | `skill_support_leaf_burst_medium` | same filename | `skill_leaf_sanctuary` |
| `iceblue_skill_ice_pillar_impact_heavy_5x5_25f_1280.png` | PROMOTED | `skill_ice_pillar_impact_heavy` | same filename | `skill_ice_pillar` |
| `orange_skill_fire_impact_burst_medium_5x5_25f_1280.png` | PROMOTED | `skill_fire_impact_burst_medium` | same filename | `skill_fire_impact` |
| `orange_skill_fire_smoke_explosion_heavy_5x5_25f_1280.png` | PROMOTED | `skill_fire_smoke_explosion_heavy` | same filename | `skill_fire_smoke` |
| `orange_skill_fire_vortex_nova_heavy_5x5_25f_1280.png` | PROMOTED | `skill_fire_vortex_nova_heavy` | same filename | `skill_boss_inferno` |
| `purple_skill_arcane_vortex_nova_heavy_5x5_25f_1280.png` | PROMOTED | `skill_arcane_vortex_nova_heavy` | same filename | `skill_arcane_vortex` |
| `purple_skill_void_rune_orb_medium_5x5_25f_1280.png` | PROMOTED | `skill_void_rune_orb_medium` | same filename | `skill_void_rune` |
| `whitegreen_skill_heal_blessing_bloom_heavy_5x5_25f_1280.png` | PROMOTED | `skill_heal_blessing_bloom_heavy` | same filename | `skill_heal_bloom` |

All outputs are located under `public/assets/vfx/runtime/`. Manifest entries use
the same public `/assets/vfx/runtime/...` URLs and retain the raw source name as
traceability metadata.

## Full raw inventory

| Raw file | R3E-2 decision | Reason |
| --- | --- | --- |
| `bluegold_skill_ultimate_arcane_beam_ultimate_5x5_25f_1280.png` | HOLD_SEMANTIC | Ultimate candidate; preserve validated current mapping until a named action is approved. |
| `bluegold_skill_ultimate_arcane_invocation_ultimate_5x5_25f_1280.png` | HOLD_SEMANTIC | Ultimate candidate; no approved action mapping in this lot. |
| `blue_skill_arcane_sigil_burst_medium_5x5_25f_1280.png` | PROMOTED | Binding-seal impact. |
| `blue_skill_arcane_starburst_small_5x5_25f_1280.png` | HOLD_SEMANTIC | Too generic without an approved unique owner. |
| `blue_skill_barrier_guard_heavy_5x5_25f_1280.png` | PROMOTED | Oathwall front-guard burst. |
| `blue_skill_holy_light_pillar_medium_5x5_25f_1280.png` | HOLD_SEMANTIC | Potential holy support alternate. |
| `blue_skill_lightning_burst_impact_medium_5x5_25f_1280.png` | HOLD_SEMANTIC | Existing lightning coverage remains active. |
| `blue_skill_lightning_pillar_impact_medium_5x5_25f_1280.png` | HOLD_SEMANTIC | Existing lightning coverage remains active. |
| `cyan_skill_arcane_orbit_burst_medium_5x5_25f_1280.png` | PROMOTED | Vigor rune orbit. |
| `cyan_skill_wind_slash_swirl_medium_5x5_25f_1280.png` | PROMOTED | Whirl impact. |
| `gold_skill_arcane_ring_fade_medium_5x5_25f_1280.png` | HOLD_SEMANTIC | Possible ring/zone alternate; no approved owner. |
| `gold_skill_holy_radiance_burst_heavy_5x5_25f_1280.png` | PROMOTED | Holy strike impact. |
| `gold_skill_holy_sigil_burst_medium_5x5_25f_1280.png` | PROMOTED | Purify support impact. |
| `gold_skill_holy_vortex_nova_heavy_5x5_25f_1280.png` | HOLD_SEMANTIC | Potential ultimate support alternate. |
| `green_skill_barrier_nature_guard_medium_5x5_25f_1280.png` | PROMOTED | Boss guard impact. |
| `green_skill_barrier_orb_burst_medium_5x5_25f_1280.png` | HOLD_SEMANTIC | Alternate shield language; no owner selected. |
| `green_skill_barrier_rune_guard_medium_5x5_25f_1280.png` | HOLD_SEMANTIC | Alternate shield language; no owner selected. |
| `green_skill_barrier_shield_burst_medium_5x5_25f_1280.png` | HOLD_SEMANTIC | Alternate shield language; no owner selected. |
| `green_skill_barrier_shield_ring_medium_5x5_25f_1280.png` | PROMOTED | Oathwall protective ring. |
| `green_skill_poison_maw_bite_heavy_5x5_25f_1280.png` | PROMOTED | Venom blade and enemy venom strike. |
| `green_skill_poison_nova_burst_medium_5x5_25f_1280.png` | HOLD_SEMANTIC | Potential poison-area alternate. |
| `green_skill_starburst_impact_medium_5x5_25f_1280.png` | HOLD_SEMANTIC | Generic green impact; no owner selected. |
| `green_skill_support_leaf_burst_medium_5x5_25f_1280.png` | PROMOTED | Sanctuary support bloom. |
| `iceblue_skill_ice_pillar_impact_heavy_5x5_25f_1280.png` | PROMOTED | Boss freeze impact. |
| `iceblue_skill_ice_shatter_burst_medium_5x5_25f_1280.png` | HOLD_SEMANTIC | Potential freeze/shatter alternate. |
| `iceblue_skill_ice_sigil_burst_medium_5x5_25f_1280.png` | HOLD_SEMANTIC | Potential ice control alternate. |
| `orange_skill_fire_energy_spiral_medium_5x5_25f_1280.png` | HOLD_SEMANTIC | Potential fire cast alternate. |
| `orange_skill_fire_impact_burst_medium_5x5_25f_1280.png` | PROMOTED | Flame wave impact. |
| `orange_skill_fire_slash_combo_heavy_5x5_25f_1280.png` | HOLD_SEMANTIC | Potential heavy-fire melee alternate. |
| `orange_skill_fire_smoke_explosion_heavy_5x5_25f_1280.png` | PROMOTED | Incendiary grenade impact. |
| `orange_skill_fire_spark_cluster_medium_5x5_25f_1280.png` | HOLD_SEMANTIC | Potential light-fire alternate. |
| `orange_skill_fire_vortex_nova_heavy_5x5_25f_1280.png` | PROMOTED | Boss inferno impact. |
| `orange_skill_meteor_impact_burst_heavy_5x5_25f_1280.png` | HOLD_SEMANTIC | Existing meteor mapping remains validated and distinct. |
| `orange_skill_solar_halo_burst_ultimate_5x5_25f_1280.png` | HOLD_SEMANTIC | Ultimate candidate; no mapping change in this lot. |
| `purpleblack_skill_void_singularity_implosion_ultimate_5x5_25f_1280.png` | HOLD_SEMANTIC | Ultimate candidate; no mapping change in this lot. |
| `purple_skill_arcane_impact_burst_medium_5x5_25f_1280.png` | HOLD_SEMANTIC | Generic arcane alternate. |
| `purple_skill_arcane_slash_burst_medium_5x5_25f_1280.png` | REJECTED_QC | 409 opaque magenta pixels detected; retain raw, do not load at runtime. |
| `purple_skill_arcane_vortex_nova_heavy_5x5_25f_1280.png` | PROMOTED | Scarlet circle impact. |
| `purple_skill_shadow_maw_bite_heavy_5x5_25f_1280.png` | HOLD_SEMANTIC | Existing shadow bite remains a valid mapping. |
| `purple_skill_void_arcane_portal_ultimate_5x5_25f_1280.png` | HOLD_SEMANTIC | Ultimate candidate; no mapping change in this lot. |
| `purple_skill_void_rune_orb_medium_5x5_25f_1280.png` | PROMOTED | Blood pact impact. |
| `purple_skill_void_spiral_implosion_medium_5x5_25f_1280.png` | HOLD_SEMANTIC | Potential void ultimate alternate. |
| `whitegreen_skill_heal_blessing_bloom_heavy_5x5_25f_1280.png` | PROMOTED | Salvation heal bloom. |

## Action mapping matrix

| actionId | presetId | primary | secondary | third | roles | status | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `w_whirl` | `skill_wind_slash_swirl` | wind slash swirl | — | — | radial impact | active | 4 AP, center target. |
| `p_holy_strike` | `skill_holy_radiance` | holy radiance | — | — | holy impact | active | Existing gameplay unchanged. |
| `p_oathwall` | `skill_oathwall` | barrier guard | shield ring | — | guard burst + protection ring | active | Only R3E-2 two-sheet preset. |
| `d_blood_pact` | `skill_void_rune` | void rune orb | — | — | void impact | active | 4 AP. |
| `n_flame_wave` | `skill_fire_impact` | fire impact burst | — | — | fire impact | active | 4 AP. |
| `w_salvation` | `skill_heal_bloom` | heal blessing bloom | — | — | beneficiary heal | active | Uses actual target anchor. |
| `w_purify` | `skill_holy_sigil` | holy sigil | — | — | cleanse/support impact | active | No status-rule change. |
| `w_sanctuary` | `skill_leaf_sanctuary` | support leaf burst | — | — | sanctuary support | active | 4 AP. |
| `r_scarlet_circle` | `skill_arcane_vortex` | arcane vortex nova | — | — | self/AoE impact | active | Impact-only presentation. |
| `e_vigor_rune` | `skill_arcane_orbit` | arcane orbit burst | — | — | support impact | active | 4 AP. |
| `e_binding_seal` | `skill_binding_sigil` | arcane sigil burst | — | — | binding impact | active | No target-rule change. |
| `ni_venom_blade` | `skill_poison_maw` | poison maw bite | — | — | poison hit | active | Existing poison mechanics retained. |
| `ar_incendiary_grenade` | `skill_fire_smoke` | fire smoke explosion | — | — | grenade impact | active | No projectile mode added. |
| `enemy_venom_strike` | `skill_poison_maw` | poison maw bite | — | — | poison hit | active | Shared visual only. |
| `boss_freeze` | `skill_ice_pillar` | ice pillar impact | — | — | boss freeze impact | active | Boss scale tier remains presentation metadata. |
| `boss_inferno` | `skill_boss_inferno` | fire vortex nova | — | — | boss fire impact | active | Impact layer, no ground decal. |
| `boss_guard` | `skill_boss_guard` | barrier nature guard | — | — | boss guard impact | active | Status/buff rules untouched. |

`d_cursed_blade` and `r_arcane_blade` deliberately retain their existing valid
fallback mappings: the candidate purple slash asset failed QC and was not
substituted with an unrelated visual.

## Presentation contract

- All 16 new presets are explicit `spriteSheet` impact presentations.
- Every new sheet is `layer: impact`, never `ground`.
- Every new sheet uses `anchor: target` and `orientation: center_on_target`.
- No R3E-2 preset uses `sheetMode: projectile`, source-to-target travel, a
  telegraph, a decal, a warning marker or a camera operation.
- Each step declares duration, scale, opacity, blending and reduced-graphics
  multiplier. Each sheet definition declares frame duration, alignment, fade
  profile, scale/opacity multiplier, blending and layer.
- The existing V1/V2 library remains intact and can still serve unchanged
  fallback mappings where no new candidate was approved.

## Validation and regression controls

Automated checks cover:

1. Each promoted PNG exists in `runtime/`, is 1280 x 1280 RGBA, is a 5 x 5
   / 25-frame sheet and contains no detected opaque magenta.
2. R3E-2 sheet IDs, manifest IDs and public URLs remain synchronized and
   unique.
3. R3E-2 presets are target-centered, impact-only, non-projectile and use no
   more than two sheets.
4. The 17 action mappings point to known action IDs and to their promoted
   runtime sheets.
5. R3E-1 basic sheet and mapping checks continue to enforce the frozen
   mono-sheet baseline.
6. `boss_inferno` resolves to the new impact-layer sheet rather than a ground
   decal.

Commands run:

```text
npm.cmd test         PASS — 28 files, 417 tests
npm.cmd run build    PASS — tsc --noEmit and Vite production build
git diff --check     PASS
```

Expected fallback-path console messages in the existing scene-transition and
cinematic-registry tests did not fail the suite.

## Manual QA still required

Open `?qa=1&vfx=1` and verify, in normal and reduced graphics:

- `w_whirl`, `p_holy_strike`, `p_oathwall`, `d_blood_pact`, `n_flame_wave`;
- `w_salvation`, `w_purify`, `w_sanctuary`, `r_scarlet_circle`,
  `e_vigor_rune`, `e_binding_seal`;
- `ni_venom_blade`, `ar_incendiary_grenade`, `enemy_venom_strike`;
- `boss_guard`, `boss_freeze`, `boss_inferno` including a 2 x 2 boss.

Confirm the peak is readable and impactful, each effect clears cleanly, no
raw URL is requested, and R3E-1 basic attacks remain unchanged.

## Exact changed paths

### Code and metadata

- `src/combat/vfx/VfxTypes.ts`
- `src/combat/vfx/VfxSpriteSheets.ts`
- `src/combat/vfx/VfxPresets.ts`
- `src/combat/vfx/VfxActionRegistry.ts`
- `src/combat/skillPresentation.ts`
- `public/assets/vfx/runtime/manifest.json`
- `src/combat/vfx/VfxSpriteSheets.test.ts`
- `src/combat/vfx/VfxPresets.test.ts`
- `src/combat/vfx/VfxActionRegistry.test.ts`
- `src/combat/skillPresentation.test.ts`
- `src/combat/combatVfxPresentation.test.ts`

### New public runtime assets

- `public/assets/vfx/runtime/blue_skill_arcane_sigil_burst_medium_5x5_25f_1280.png`
- `public/assets/vfx/runtime/blue_skill_barrier_guard_heavy_5x5_25f_1280.png`
- `public/assets/vfx/runtime/cyan_skill_arcane_orbit_burst_medium_5x5_25f_1280.png`
- `public/assets/vfx/runtime/cyan_skill_wind_slash_swirl_medium_5x5_25f_1280.png`
- `public/assets/vfx/runtime/gold_skill_holy_radiance_burst_heavy_5x5_25f_1280.png`
- `public/assets/vfx/runtime/gold_skill_holy_sigil_burst_medium_5x5_25f_1280.png`
- `public/assets/vfx/runtime/green_skill_barrier_nature_guard_medium_5x5_25f_1280.png`
- `public/assets/vfx/runtime/green_skill_barrier_shield_ring_medium_5x5_25f_1280.png`
- `public/assets/vfx/runtime/green_skill_poison_maw_bite_heavy_5x5_25f_1280.png`
- `public/assets/vfx/runtime/green_skill_support_leaf_burst_medium_5x5_25f_1280.png`
- `public/assets/vfx/runtime/iceblue_skill_ice_pillar_impact_heavy_5x5_25f_1280.png`
- `public/assets/vfx/runtime/orange_skill_fire_impact_burst_medium_5x5_25f_1280.png`
- `public/assets/vfx/runtime/orange_skill_fire_smoke_explosion_heavy_5x5_25f_1280.png`
- `public/assets/vfx/runtime/orange_skill_fire_vortex_nova_heavy_5x5_25f_1280.png`
- `public/assets/vfx/runtime/purple_skill_arcane_vortex_nova_heavy_5x5_25f_1280.png`
- `public/assets/vfx/runtime/purple_skill_void_rune_orb_medium_5x5_25f_1280.png`
- `public/assets/vfx/runtime/whitegreen_skill_heal_blessing_bloom_heavy_5x5_25f_1280.png`

## Explicit non-goals met

No gameplay, balance, combat rule, AI, targeting, pathfinding, save, economy,
route, narrative or camera logic changed. No source raw file was edited,
deleted or loaded by the runtime. No VFX processing directory was introduced.

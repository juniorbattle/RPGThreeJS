# VFX Mega Pack R1 — P0 Replacement Candidates

> **R1 deliverable 2/5.** Identifies verified Mega Pack source candidates for the 6 P0
> runtime spritesheets flagged in the R3H audit. No runtime code, assets, gameplay,
> presets, mappings, UV, flipY, or frame-order changes. All source files remain external.

## P0 summary

| Priority | Runtime sheet | R3H verdict | Used by | Candidate(s) identified |
|---|---|---|---|---|
| P0 | `basic_execution_slash_heavy` | NEEDS_REGENERATION | boss_execution, ni_shadow_step, ni_silent_assassin, w_lion_surge | `r1_1605`, `r1_1698`, `r1_1712` |
| P0 | `skill_barrier_guard_heavy` | NEEDS_REGENERATION | p_oathwall | `r1_0971` (Shield_On) |
| P0 | `skill_meteor_impact_burst_heavy` | NEEDS_REGENERATION | n_dark_meteor | `r1_0435`, `r1_0436`, `r1_0545` |
| P0 | `skill_void_singularity_implosion_ultimate` | NEEDS_REGENERATION | boss_apocalypse, d_devouring_eclipse | `r1_0545`, `r1_0936` |
| P0 | `skill_wind_slash_swirl_medium` | NEEDS_REGENERATION | w_whirl | `r1_1699`, `r1_1700`, `r1_1713` |
| P0 | `skill_barrier_shield_ring_medium` | NEEDS_NORMALIZATION | p_oathwall | `r1_0971` (Shield_On), retain + downscale |

---

## P0-1: `basic_execution_slash_heavy`

| Field | Value |
|---|---|
| **R3H verdict** | NEEDS_REGENERATION |
| **R3H diagnostic** | bad-source-composition, internal-border-contamination |
| **Used by** | boss_execution, ni_shadow_step, ni_silent_assassin, w_lion_surge |
| **Required visual family** | slash (heavy/ultimate intensity) |
| **Tactical presentation** | Line charge execution slash at ultimate scale; golden/physical palette |

### Top candidates

| Candidate ID | Source filename | Collection | Cell size | Element | Intensity | Direction |
|---|---|---|---|---|---|---|
| `r1_1605` | `Blue Slash v1 - Flurry_spritesheet.png` | Sword Slash | 512×512 | physical | heavy | omnidirectional |
| `r1_1698` | `Fire Slash v1 - Flurry_spritesheet.png` | Sword Slash | 512×512 | physical | heavy | omnidirectional |
| `r1_1712` | `Lightning Slash v1 - Flurry_spritesheet.png` | Sword Slash | 512×512 | physical | heavy | omnidirectional |

### Recommendation

**Primary**: `r1_1605` (Blue Slash v1 - Flurry) — heavy intensity, 512×512 cells, omnidirectional. The "Flurry" variant provides multi-hit visual reading suitable for execution-scale attacks. Physical palette matches the current runtime sheet's white/additive blending.

**Alternatives**: `r1_1698` (Fire Slash) for fire-element variants, `r1_1712` (Lightning Slash) for lightning-element variants. Both are 512×512 heavy intensity.

**R2 processing**: EXTRACT_AND_REPACK — extract 8×8 grid, resample 64→25 frames, resize 512→256, pack 1280×1280 5×5.

---

## P0-2: `skill_barrier_guard_heavy`

| Field | Value |
|---|---|
| **R3H verdict** | NEEDS_REGENERATION |
| **R3H diagnostic** | bad-source-composition, internal-border-contamination |
| **Used by** | p_oathwall |
| **Required visual family** | barrier / shield (defensive, ground-based) |
| **Tactical presentation** | Defensive barrier wall with shield ring; holy palette; 4 AP scale |

### Top candidates

| Candidate ID | Source filename | Collection | Cell size | Element | Intensity | Direction |
|---|---|---|---|---|---|---|
| `r1_0971` | `Shield_On_spritesheet.png` | Essentials | 512×512 | holy | medium | omnidirectional |
| `r1_0970` | `Shield_Off_spritesheet.png` | Essentials | 512×512 | holy | medium | omnidirectional |

### Recommendation

**Primary**: `r1_0971` (Shield_On) — holy element, omnidirectional, 512×512 cells. The "On" variant represents the barrier activation, which is semantically correct for an oathwall cast. Ground-based presentation matches the current `align: 'bottom'` runtime configuration.

**Companion**: `r1_0970` (Shield_Off) can serve as the dismissal/aftermath phase if a two-phase presentation is desired.

**R2 processing**: EXTRACT_AND_REPACK — extract 8×8 grid, resample 64→25 frames, resize 512→256, pack 1280×1280 5×5.

**Note**: The Mega Pack contains no "barrier" or "guard" named assets. Shield_On is the closest semantic match. The companion `skill_barrier_shield_ring_medium` (P0 NEEDS_NORMALIZATION) can be retained with downscale rather than full replacement.

---

## P0-3: `skill_meteor_impact_burst_heavy`

| Field | Value |
|---|---|
| **R3H verdict** | NEEDS_REGENERATION |
| **R3H diagnostic** | bad-source-composition, internal-border-contamination |
| **Used by** | n_dark_meteor |
| **Required visual family** | meteor / explosion (dark/void, downward, ultimate scale) |
| **Tactical presentation** | Void/dark meteor or gravity implosion at ultimate scale; dark/void palette (not fire) |

### Top candidates

| Candidate ID | Source filename | Collection | Cell size | Element | Intensity | Direction |
|---|---|---|---|---|---|---|
| `r1_0435` | `Explosion_Bomb_V7_spritesheet.png` | Essentials | 512×512 | neutral | heavy | omnidirectional |
| `r1_0436` | `Explosion_Bomb_V8_spritesheet.png` | Essentials | 512×512 | neutral | heavy | omnidirectional |
| `r1_0545` | `Impact_Darkness_Lv3_spritesheet.png` | Essentials | 512×512 | dark | heavy | omnidirectional |

### Recommendation

**Primary**: `r1_0545` (Impact_Darkness_Lv3) — dark element, heavy intensity, 512×512 cells. Semantically correct for a dark/void meteor impact. The R0 mapping specifies "dark/void palette (not fire)" and this is the only heavy-intensity dark implosion in the inventory.

**Alternative**: `r1_0435` or `r1_0436` (Explosion_Bomb_V7/V8) — heavy intensity, neutral palette. These can be recolored to dark/void in R2 pipeline (RECOLOR_CANDIDATE). The bomb explosion provides a larger blast radius reading suitable for ultimate scale.

**R2 processing**: EXTRACT_AND_REPACK for `r1_0545`; RECOLOR_CANDIDATE for `r1_0435`/`r1_0436` (requires hue shift to dark/void palette).

**Note**: No "meteor" named assets exist in the Mega Pack. The meteor visual (downward descent + impact) may need to be composed from two layers: a sky-descent travel effect + the ground impact explosion. This is a COMPOSITE_LAYER consideration for R2.

---

## P0-4: `skill_void_singularity_implosion_ultimate`

| Field | Value |
|---|---|
| **R3H verdict** | NEEDS_REGENERATION |
| **R3H diagnostic** | bad-source-composition, internal-border-contamination |
| **Used by** | boss_apocalypse, d_devouring_eclipse |
| **Required visual family** | implosion (dark/void, radial_inward, ultimate scale) |
| **Tactical presentation** | Void singularity implosion at ultimate scale; dark/void palette; 5 AP ultimate |

### Top candidates

| Candidate ID | Source filename | Collection | Cell size | Element | Intensity | Direction |
|---|---|---|---|---|---|---|
| `r1_0545` | `Impact_Darkness_Lv3_spritesheet.png` | Essentials | 512×512 | dark | heavy | omnidirectional |
| `r1_0936` | `Projectile_Darkness_Ball_Lv3_spritesheet.png` | Essentials | 512×512 | dark | heavy | directional_horizontal |

### Recommendation

**Primary**: `r1_0545` (Impact_Darkness_Lv3) — dark element, heavy intensity, 512×512 cells. This is the same candidate recommended for P0-3 (meteor). The Impact_Darkness family reads as a radial implosion/absorption effect, which is semantically correct for a void singularity.

**Alternative**: `r1_0936` (Projectile_Darkness_Ball_Lv3) — dark element, heavy intensity, directional. Could serve as the inbound projectile phase of a two-phase singularity (approach + collapse).

**R2 processing**: EXTRACT_AND_REPACK. May need COMPOSITE_LAYER if a two-phase approach (inbound projectile + implosion impact) is desired for the ultimate presentation.

**Note**: The current runtime sheet has `scaleMultiplier: 2.24` and `layer: 'ground'` — the largest scale in the runtime. The replacement must maintain this ultimate-scale reading. Impact_Darkness_Lv3 at 512×512 cells provides sufficient detail for the 2× downscale to 256×256.

---

## P0-5: `skill_wind_slash_swirl_medium`

| Field | Value |
|---|---|
| **R3H verdict** | NEEDS_REGENERATION |
| **R3H diagnostic** | bad-source-composition, internal-border-contamination |
| **Used by** | w_whirl |
| **Required visual family** | swirl (circular slash whirlwind, radial_outward) |
| **Tactical presentation** | Circular slash whirlwind around caster; physical/wind palette; 4 AP scale |

### Top candidates

| Candidate ID | Source filename | Collection | Cell size | Element | Intensity | Direction |
|---|---|---|---|---|---|---|
| `r1_1699` | `Fire Slash v1 - Spin_A_spritesheet.png` | Sword Slash | 512×512 | physical | medium | radial_outward |
| `r1_1700` | `Fire Slash v1 - Spin_spritesheet.png` | Sword Slash | 512×512 | physical | medium | radial_outward |
| `r1_1713` | `Lightning Slash v1 - Spin_A_spritesheet.png` | Sword Slash | 512×512 | physical | medium | radial_outward |
| `r1_1714` | `Lightning Slash v1 - Spin_spritesheet.png` | Sword Slash | 512×512 | physical | medium | radial_outward |

### Recommendation

**Primary**: `r1_1700` (Fire Slash v1 - Spin) — medium intensity, 512×512 cells, radial_outward direction. The "Spin" variant explicitly reads as a circular slash whirlwind, which is the exact semantic requirement for w_whirl. Despite the "Fire" prefix, the element classification is physical (the slash itself is physical; fire is the visual flair).

**Alternative**: `r1_1714` (Lightning Slash v1 - Spin) for a lightning-themed whirlwind variant.

**R2 processing**: EXTRACT_AND_REPACK — extract 8×8 grid, resample 64→25 frames, resize 512→256, pack 1280×1280 5×5.

**Note**: The current runtime sheet has `scaleMultiplier: 1.62` and `align: 'center'`. The Spin variants are omnidirectional/radial_outward, matching the center-on-target presentation for a self-centered whirlwind.

---

## P0-6: `skill_barrier_shield_ring_medium`

| Field | Value |
|---|---|
| **R3H verdict** | NEEDS_NORMALIZATION |
| **R3H diagnostic** | edge-touch, too-large-for-cell, bottom-baseline-drift |
| **R3H candidate** | PASS_WITH_DOWNSCALE |
| **Used by** | p_oathwall |
| **Required visual family** | barrier (shield ring, ground-based) |

### Recommendation

**Retain and downscale**: The R3H audit classified this sheet as NEEDS_NORMALIZATION with candidate `PASS_WITH_DOWNSCALE`. The core alpha reaches a cell edge in 3 frames and the maximum active bbox is 256×247, exceeding the 240px safe area by 7px. A downscale to ~93% would bring it within safe area.

**No Mega Pack replacement needed**: This sheet can be normalized in-place by the R2 pipeline without sourcing a new asset. The companion `skill_barrier_guard_heavy` (P0-2 above) is the one that needs replacement.

**R2 processing**: CROP_OR_REFRAME — downscale existing runtime sheet to fit within 240px safe area, repack to 1280×1280 5×5.

---

## Semantic mismatch replacements (P1, confirmed in R3G/R3H)

### `w_charge` — Directional dash/ram impact

| Field | Value |
|---|---|
| **Current sheet** | `basic_hammer_crush_heavy` (NEEDS_REGENERATION) |
| **Semantic issue** | wrong-effect-for-preset — stationary hammer crush for a directional dash |
| **Required visual family** | charge (directional_horizontal) |

**Top candidates**:

| Candidate ID | Source filename | Collection | Cell size | Element | Intensity | Direction |
|---|---|---|---|---|---|---|
| `r1_2561` | `Dash_Wind_White_v3_spritesheet.png` | Wind | 256×256 | wind | heavy | directional_horizontal |
| `r1_2560` | `Dash_Wind_White_v2_spritesheet.png` | Wind | 256×256 | wind | medium | directional_horizontal |

**Recommendation**: `r1_2561` (Dash_Wind_White_v3) — heavy intensity, directional_horizontal, 256×256 cells (already at target size). The dash effect reads as forward motion, which is the correct semantic for Charge. Wind element provides a neutral physical-adjacent palette.

### `p_interpose` — Protective landing/guard impact

| Field | Value |
|---|---|
| **Current sheet** | `basic_body_slam_heavy` (MANUAL_REVIEW) |
| **Semantic issue** | wrong-effect-for-preset — generic body slam for a protective leap |
| **Required visual family** | shield (protective, holy) |

**Top candidates**:

| Candidate ID | Source filename | Collection | Cell size | Element | Intensity | Direction |
|---|---|---|---|---|---|---|
| `r1_0971` | `Shield_On_spritesheet.png` | Essentials | 512×512 | holy | medium | omnidirectional |
| `r1_2600` | `Jump_Wind_White_v2_spritesheet.png` | Wind | 256×256 | wind | medium | omnidirectional |

**Recommendation**: `r1_0971` (Shield_On) — holy element, omnidirectional, 512×512. The shield activation reads as a protective effect, which is the correct semantic for Interposition. Alternatively, `r1_2600` (Jump_Wind_White_v2) provides a landing dust cloud that could work as a physical protective landing.

### `n_flame_wave` — Directional fire wave/cone

| Field | Value |
|---|---|
| **Current sheet** | `skill_fire_impact_burst_medium` (NEEDS_REGENERATION) |
| **Semantic issue** | wrong-effect-for-preset — local point burst does not express propagation |
| **Required visual family** | directional_wave (fire, directional_horizontal) |

**Top candidates**:

| Candidate ID | Source filename | Collection | Cell size | Element | Intensity | Direction |
|---|---|---|---|---|---|---|
| `r1_0450` | `Flamethrower_001_spritesheet.png` | Essentials | 512×512 | fire | medium | directional_horizontal |
| `r1_0453` | `Flamethrower_002_spritesheet.png` | Essentials | 512×512 | fire | medium | directional_horizontal |

**Recommendation**: `r1_0450` (Flamethrower_001) — fire element, directional_horizontal, 512×512 cells. The flamethrower effect reads as a directional fire projection, which is the correct semantic for a fire wave/cone. The R2 pipeline can crop or reframe to emphasize the wave front.

**Alternative**: `r1_0942` (Projectile_Fire_Ball_Lv3) — fire element, heavy intensity, directional. Could serve as a fireball wave if the flamethrower is too sustained. However, the flamethrower better expresses the cone/wave propagation requirement.

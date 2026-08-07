# VFX Mega Pack R1 — Status Effect & Loop Candidates

> **R1 deliverable 3/5.** Catalogues Mega Pack source candidates for persistent status
> effects and loop animations. No runtime code, assets, gameplay, presets, mappings, UV,
> flipY, or frame-order changes. All source files remain external.

## Overview

The Mega Pack contains **815 loop-suitable assets** across 13 visual families. This
document catalogues candidates for RPGThreeJS status effects (stun, poison, freeze, burn,
curse, root, blind, slow, weak) and persistent buff/debuff auras that require looping
playback rather than one-shot impacts.

## Loop candidate distribution

| Family | Loop count | Primary elements | Key source families |
|---|---|---|---|
| charge | 205 | neutral, fire, ice, lightning, poison, dark | Charge_Fire/Ice/Lightning/Poison/Darkness, ChargeUp_Energy |
| smoke | 180 | wind, neutral | Angry_Smoke_Burst, Smoke_Rising, Jump_Wind |
| persistent_loop | 112 | neutral, water | Radial_Loop, Bubbles, Foam, Cut_Out |
| aura | 102 | neutral | Aura_V1–V17 (with Single variants) |
| projectile_impact | 90 | water, fire, physical | Water trails, fire trails, blood trails |
| burn | 63 | fire | Fire_Trail, Bonfire, Ground_Fire, Aura_Fire |
| buff | 12 | holy | Positive_Buff_V1–V6, Heart_Buff_V1–V6 |
| shockwave | 12 | neutral, wind | Wind_Shout, Sonar |
| debuff | 6 | dark | Negative_Buff_V1–V6 |
| swirl | 24 | neutral, wind | Tornado, Tornado_Lightning |
| explosion | 6 | neutral | Star_Explosion loop variants |
| stun | 2 | neutral | Stun_Stars_V1, V2 |
| poison | 1 | poison | Poison cloud loop |

---

## Status effect candidates

### Stun

| Candidate ID | Source filename | Cell size | Element | Intensity | Loop | Notes |
|---|---|---|---|---|---|---|
| `r1_1277` | `Stun_Stars_V1_spritesheet.png` | 512×512 | neutral | small | loop | Classic circling stars |
| `r1_1278` | `Stun_Stars_V2_spritesheet.png` | 512×512 | neutral | medium | loop | Larger star burst |

**Recommendation**: `r1_1277` (Stun_Stars_V1) for standard stun, `r1_1278` (V2) for enhanced/extended stun. Both are purpose-built stun loops with neutral palette suitable for recoloring to match any unit.

### Poison

| Candidate ID | Source filename | Cell size | Element | Intensity | Loop | Notes |
|---|---|---|---|---|---|---|
| `r1_0576` | `Impact_Poison_Lv1_spritesheet.png` | 512×512 | poison | small | one_shot | Poison impact with bubbles |
| `r1_0579` | `Impact_Poison_Lv2_spritesheet.png` | 512×512 | poison | medium | one_shot | Medium poison impact |
| `r1_0574` | `Impact_Poison_Lv1_No_Bubbles_spritesheet.png` | 512×512 | poison | small | one_shot | Clean version without bubbles |
| `r1_0575` | `Impact_Poison_Lv1_Red_No_Bubbles_spritesheet.png` | 512×512 | poison | small | one_shot | Red poison variant |
| `r1_0240` | `Charge_Poison_v1_A_Burst Only_spritesheet.png` | 512×512 | poison | small | loop_with_fadeout | Poison charge loop |

**Recommendation**: `r1_0579` (Impact_Poison_Lv2) for poison application impact (one-shot), `r1_0240` (Charge_Poison) for persistent poison aura (loop). The red variant `r1_0575` can be used for venom/enhanced poison differentiation.

### Freeze

| Candidate ID | Source filename | Cell size | Element | Intensity | Loop | Notes |
|---|---|---|---|---|---|---|
| `r1_0564` | `Impact_Ice_Lv1_spritesheet.png` | 512×512 | ice | small | one_shot | Light freeze impact |
| `r1_0565` | `Impact_Ice_Lv2_spritesheet.png` | 512×512 | ice | medium | one_shot | Medium freeze impact |
| `r1_0566` | `Impact_Ice_Lv3_spritesheet.png` | 512×512 | ice | heavy | one_shot | Heavy freeze impact |
| `r1_0180` | `Charge_Ice_v1_A_Burst Only_spritesheet.png` | 512×512 | ice | small | loop_with_fadeout | Ice charge loop |

**Recommendation**: `r1_0566` (Impact_Ice_Lv3) for freeze application (one-shot), `r1_0180` (Charge_Ice) for persistent freeze aura (loop). Three intensity levels provide scale options for different freeze durations.

### Burn

| Candidate ID | Source filename | Cell size | Element | Intensity | Loop | Notes |
|---|---|---|---|---|---|---|
| `r1_1370` | `Fire_Trail_v1_Loop_.png` | 512×512 | fire | small | loop | Fire trail loop |
| `r1_0160` | `Charge_Fire_v1_A_Burst Only_spritesheet.png` | 512×512 | fire | small | loop_with_fadeout | Fire charge loop |

**Recommendation**: `r1_1370` (Fire_Trail_v1_Loop) for persistent burn effect (loop). The fire trail provides a continuous flame visual suitable for burn status display. `r1_0160` (Charge_Fire) as alternative for a more centered burn aura.

### Curse / Weak

| Candidate ID | Source filename | Cell size | Element | Intensity | Loop | Notes |
|---|---|---|---|---|---|---|
| `r1_0623` | `Negative_Buff_V1_spritesheet.png` | 512×512 | dark | small | loop | Dark debuff aura |
| `r1_0624` | `Negative_Buff_V2_spritesheet.png` | 512×512 | dark | medium | loop | Medium debuff aura |
| `r1_0625` | `Negative_Buff_V3_spritesheet.png` | 512×512 | dark | heavy | loop | Heavy debuff aura |
| `r1_0521` | `Hex_Buff_V1_spritesheet.png` | 512×512 | arcane | small | one_shot | Hex application |
| `r1_0524` | `Hex_Bursts_Center_V1_spritesheet.png` | 512×512 | arcane | small | one_shot | Hex burst center |

**Recommendation**: `r1_0625` (Negative_Buff_V3) for curse/weak persistent aura (loop, heavy). `r1_0521` (Hex_Buff_V1) for curse application impact (one-shot). The Negative_Buff family provides 6 intensity variants (V1–V6) for scaling curse effects by severity.

### Root / Bind

| Candidate ID | Source filename | Cell size | Element | Intensity | Loop | Notes |
|---|---|---|---|---|---|---|
| `r1_0524` | `Hex_Bursts_Center_V1_spritesheet.png` | 512×512 | arcane | small | one_shot | Root/bind application |
| `r1_0525` | `Hex_Bursts_Center_V2_spritesheet.png` | 512×512 | arcane | medium | one_shot | Medium root burst |
| `r1_0526` | `Hex_Bursts_Center_V3_spritesheet.png` | 512×512 | arcane | heavy | one_shot | Heavy root burst |

**Recommendation**: `r1_0525` (Hex_Bursts_Center_V2) for root application. The hex burst center reads as a binding/sealing effect. For persistent root display, `r1_0624` (Negative_Buff_V2) can serve as a continuing debuff aura.

### Blind

No dedicated "blind" assets exist in the Mega Pack. Recommended approach:

| Candidate ID | Source filename | Cell size | Element | Intensity | Loop | Notes |
|---|---|---|---|---|---|---|
| `r1_2506` | `Angry_Smoke_Burst_White_v1_A_spritesheet.png` | 512×512 | wind | small | loop | Smoke veil for blind |
| `r1_1277` | `Stun_Stars_V1_spritesheet.png` | 512×512 | neutral | small | loop | Repurposed stun stars for blind |

**Recommendation**: `r1_2506` (Angry_Smoke_Burst) for blind status — the smoke veil reads as obscured vision. Alternatively, a dark recolor of Stun_Stars could work. This is a RECOLOR_CANDIDATE for R2.

### Slow

No dedicated "slow" assets exist. Recommended approach:

| Candidate ID | Source filename | Cell size | Element | Intensity | Loop | Notes |
|---|---|---|---|---|---|---|
| `r1_0180` | `Charge_Ice_v1_A_Burst Only_spritesheet.png` | 512×512 | ice | small | loop_with_fadeout | Ice slow aura |
| `r1_0964` | `Radial_Loop_V1_spritesheet.png` | 512×512 | neutral | small | loop | Generic slow aura |

**Recommendation**: `r1_0180` (Charge_Ice) for slow status — the ice charge loop reads as a chilling effect that slows movement. RECOLOR_CANDIDATE if a non-ice slow is needed.

---

## Buff aura candidates

### Positive buffs (boost, regen, barrier)

| Candidate ID | Source filename | Cell size | Element | Intensity | Loop | Notes |
|---|---|---|---|---|---|---|
| `r1_0675` | `Positive_Buff_V1_spritesheet.png` | 512×512 | holy | small | loop | Light positive buff |
| `r1_0676` | `Positive_Buff_V2_spritesheet.png` | 512×512 | holy | medium | loop | Medium positive buff |
| `r1_0677` | `Positive_Buff_V3_spritesheet.png` | 512×512 | holy | heavy | loop | Heavy positive buff |
| `r1_0501` | `Heart_Buff_V1_spritesheet.png` | 512×512 | holy | small | loop | Heart buff (heal aura) |
| `r1_0503` | `Heart_Buff_V3_spritesheet.png` | 512×512 | holy | heavy | loop | Heavy heart buff |
| `r1_0971` | `Shield_On_spritesheet.png` | 512×512 | holy | medium | one_shot | Barrier activation |

**Recommendation**: `r1_0677` (Positive_Buff_V3) for boost/regen auras (loop, heavy). `r1_0503` (Heart_Buff_V3) for heal-over-time regen specifically. `r1_0971` (Shield_On) for barrier activation (one-shot). Six Positive_Buff variants and six Heart_Buff variants provide wide intensity scaling.

### Charge-up effects (cast preparation)

| Candidate ID | Source filename | Cell size | Element | Intensity | Loop | Notes |
|---|---|---|---|---|---|---|
| `r1_0103` | `ChargeUp_Energy_A_spritesheet_(Legacy).png` | 512×512 | neutral | medium | loop_with_fadeout | Generic charge-up |
| `r1_0160` | `Charge_Fire_v1_A_Burst Only_spritesheet.png` | 512×512 | fire | small | loop_with_fadeout | Fire charge-up |
| `r1_0180` | `Charge_Ice_v1_A_Burst Only_spritesheet.png` | 512×512 | ice | small | loop_with_fadeout | Ice charge-up |
| `r1_0200` | `Charge_Lightning_v1_A_Burst Only_spritesheet.png` | 512×512 | lightning | small | loop_with_fadeout | Lightning charge-up |
| `r1_0120` | `Charge_Darkness_v1_A_Burst Only_spritesheet.png` | 512×512 | dark | small | loop_with_fadeout | Darkness charge-up |
| `r1_0240` | `Charge_Poison_v1_A_Burst Only_spritesheet.png` | 512×512 | poison | small | loop_with_fadeout | Poison charge-up |

**Recommendation**: Element-matched charge-up effects for each unit's ultimate cast preparation. `r1_0103` (ChargeUp_Energy) as a generic fallback. Each element has multiple sub-variants (Burst Only, Center Only, Charge Only, Charge Lines) for COMPOSITE_LAYER assembly in R2.

### Aura (persistent unit aura)

| Candidate ID | Source filename | Cell size | Element | Intensity | Loop | Notes |
|---|---|---|---|---|---|---|
| `r1_0006` | `Aura_V10_Single_spritesheet.png` | 512×512 | neutral | medium | loop | Single-ring aura |
| `r1_0007` | `Aura_V10_spritesheet.png` | 512×512 | neutral | medium | loop | Multi-ring aura |

**Recommendation**: Aura_V1–V17 provide 102 loop-suitable aura variants with "Single" (simpler) and full (multi-ring) versions. These are RECOLOR_CANDIDATES — all are neutral palette and can be tinted to match unit elements in R2.

---

## Loop processing notes

All loop candidates require LOOP_CANDIDATE processing in R2:

1. **Frame selection**: Select 25 frames that form a seamless loop from the 64-frame source
2. **Loop point detection**: Identify the frame where the animation cycles and select a contiguous 25-frame window
3. **Crossfade**: If no clean loop point exists, apply a 2–3 frame crossfade at the loop boundary
4. **No fadeout**: Loop sheets should not have fadeout — the runtime `fadeOut` parameter should be set to 1.0 (no fade) for persistent effects
5. **Reduced graphics**: Loop sheets should have a `reducedGraphicsMultiplier` to avoid overwhelming the screen during sustained effects

## Status effect runtime integration (R5 scope)

Status effect spritesheets will require new `VfxSpriteSheetId` entries and `VfxSpriteSheetDefinition` records in R5. The R1 inventory provides the candidate pool; R2 produces normalized sheets; R5 integrates them into the runtime. No runtime changes occur during R1.

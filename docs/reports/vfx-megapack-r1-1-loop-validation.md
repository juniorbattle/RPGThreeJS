# VFX Mega Pack R1.1 — Loop Candidate Validation Report

**Generated:** 2026-08-06
**Scope:** Representative sample from every loop-related visual family

## Terminology

| Classification | Meaning |
|---|---|
| CONFIRMED_LOOP | First-to-last frame continuity confirmed, suitable for seamless looping |
| POSSIBLE_LOOP | Likely loopable but requires visual confirmation |
| ONE_SHOT_ONLY | Animation has clear start/end, not suitable for looping |
| LOOP_REQUIRES_EDIT | Loop possible but requires frame trimming or fade editing |
| MANUAL_REVIEW_REQUIRED | Insufficient data to classify |

## Heuristic Assessment Method

Loop suitability is assessed using:

- **First-to-last-frame continuity**: High cell occupancy in both first and last cells
- **Center-position continuity**: Low center drift across cells indicates stable positioning
- **Opacity continuity**: Consistent active cell counts suggest sustained visual presence
- **Scale continuity**: Bounding box consistency across cells
- **Absence of restart flash**: No sudden empty-to-full transitions

## Loop Family Samples

### persistent_loop (10 sampled)

| Candidate | Filename | Grid | Confidence | Loop Verdict | First-Last | Center |
|---|---|---|---|---|---|---|
| r1_0001 | Arrow_Indicator_V1_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_0002 | Arrow_Indicator_V2_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_0003 | Arrow_Indicator_V3_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_0004 | Arrow_Indicator_V4_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_0005 | Arrow_Indicator_V5_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_0096 | Bubbles_Burst_Center_V1_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | moderate_drift |
| r1_0097 | Bubbles_Burst_Center_V2_spritesheet.png | 8x8 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | moderate_drift |
| r1_0098 | Bubbles_Burst_V1_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_0099 | Bubbles_Burst_V2_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_0100 | Bubbles_Loop_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |

### aura (10 sampled)

| Candidate | Filename | Grid | Confidence | Loop Verdict | First-Last | Center |
|---|---|---|---|---|---|---|
| r1_0006 | Aura_V10_Single_spritesheet.png | 8x8 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | stable |
| r1_0007 | Aura_V10_spritesheet.png | 8x8 | MEDIUM | CONFIRMED_LOOP | likely_continuous | stable |
| r1_0008 | Aura_V11_Single_spritesheet.png | 8x8 | HIGH | POSSIBLE_LOOP | uncertain | stable |
| r1_0009 | Aura_V11_spritesheet.png | 8x8 | MEDIUM | POSSIBLE_LOOP | uncertain | stable |
| r1_0010 | Aura_V12_Single_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_0011 | Aura_V12_spritesheet.png | 8x8 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | moderate_drift |
| r1_0012 | Aura_V13_Single_spritesheet.png | 8x8 | MEDIUM | CONFIRMED_LOOP | likely_continuous | stable |
| r1_0013 | Aura_V13_spritesheet.png | 8x8 | MEDIUM | CONFIRMED_LOOP | likely_continuous | stable |
| r1_0014 | Aura_V14_Single_spritesheet.png | 8x8 | MEDIUM | CONFIRMED_LOOP | likely_continuous | stable |
| r1_0015 | Aura_V14_spritesheet.png | 8x8 | HIGH | CONFIRMED_LOOP | likely_continuous | moderate_drift |

### charge (10 sampled)

| Candidate | Filename | Grid | Confidence | Loop Verdict | First-Last | Center |
|---|---|---|---|---|---|---|
| r1_0103 | ChargeUp_Energy_A_spritesheet_(Legacy).png | 8x8 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | stable |
| r1_0104 | ChargeUp_Energy_B_Loop_spritesheet_(Legacy).png | 4x4 | MEDIUM | POSSIBLE_LOOP | likely_continuous | moderate_drift |
| r1_0105 | ChargeUp_Energy_B_spritesheet_(Legacy).png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_0106 | ChargeUp_Energy_B_V1_spritesheet_(Legacy).png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_0107 | ChargeUp_Energy_C_Loop_spritesheet_(Legacy).png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_0108 | ChargeUp_Energy_C_spritesheet_(Legacy).png | 4x4 | MEDIUM | POSSIBLE_LOOP | likely_continuous | high_drift |
| r1_0109 | ChargeUp_Energy_C_V1_spritesheet_(Legacy).png | 4x4 | MEDIUM | LOOP_REQUIRES_EDIT | uncertain | high_drift |
| r1_0110 | ChargeUp_Energy_V1_NoParticles_spritesheet_(Legacy).png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | stable |
| r1_0111 | ChargeUp_Energy_V1_Particles_A_spritesheet_(Legacy).png | 8x8 | LOW | MANUAL_REVIEW_REQUIRED | uncertain | moderate_drift |
| r1_0112 | ChargeUp_Energy_V1_Particles_B_spritesheet_(Legacy).png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | moderate_drift |

### buff (10 sampled)

| Candidate | Filename | Grid | Confidence | Loop Verdict | First-Last | Center |
|---|---|---|---|---|---|---|
| r1_0304 | Coins_Cone_V1_A_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | uncertain | high_drift |
| r1_0305 | Coins_Cone_V1_B_spritesheet.png | 8x8 | LOW | MANUAL_REVIEW_REQUIRED | uncertain | high_drift |
| r1_0306 | Coins_Cone_V1_C_spritesheet.png | 8x8 | LOW | MANUAL_REVIEW_REQUIRED | uncertain | high_drift |
| r1_0307 | Coins_Cone_V2_A_MidMoney_spriteheet.png | 8x8 | LOW | MANUAL_REVIEW_REQUIRED | uncertain | high_drift |
| r1_0308 | Coins_Cone_V2_A_spritesheet.png | 8x8 | LOW | MANUAL_REVIEW_REQUIRED | uncertain | high_drift |
| r1_0309 | Coins_Cone_V2_B_MidMoney_spritesheet.png | 8x8 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_0310 | Coins_Cone_V2_B_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_0311 | Coins_Cone_V2_C_MidMoney_spritesheet.png | 8x8 | LOW | MANUAL_REVIEW_REQUIRED | uncertain | high_drift |
| r1_0312 | Coins_Cone_V2_C_spritesheet.png | 8x8 | MEDIUM | POSSIBLE_LOOP | likely_continuous | high_drift |
| r1_0313 | Coins_Cone_V3_A_FastMoney_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | uncertain | high_drift |

### burn (10 sampled)

| Candidate | Filename | Grid | Confidence | Loop Verdict | First-Last | Center |
|---|---|---|---|---|---|---|
| r1_0446 | Fire_Candle_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_0447 | Fire_Fireplace_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | moderate_drift |
| r1_1328 | Bonfire_v1_A_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_1329 | Bonfire_v1_B_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_1330 | Bonfire_v1_Loop_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_1331 | Bonfire_v2_A_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_1332 | Bonfire_v2_B_spritesheet.png | 8x8 | MEDIUM | POSSIBLE_LOOP | likely_continuous | high_drift |
| r1_1333 | Bonfire_v2_Loop_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_1334 | Bonfire_v3_A_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_1335 | Bonfire_v3_B_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |

### smoke (10 sampled)

| Candidate | Filename | Grid | Confidence | Loop Verdict | First-Last | Center |
|---|---|---|---|---|---|---|
| r1_0594 | Impact_Smoke_V1_spritesheet.png | 8x8 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | moderate_drift |
| r1_0595 | Impact_Smoke_V2_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | uncertain | moderate_drift |
| r1_0617 | Jet_Smoke_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | stable |
| r1_0972 | Smoke_Cloud_Burst_Thick_v1_A_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | moderate_drift |
| r1_0973 | Smoke_Cloud_Burst_Thick_v1_B_spritesheet.png | 8x8 | HIGH | CONFIRMED_LOOP | likely_continuous | moderate_drift |
| r1_0974 | Smoke_Cloud_Burst_Thick_v1_C_spritesheet.png | 8x8 | MEDIUM | POSSIBLE_LOOP | likely_continuous | moderate_drift |
| r1_0975 | Smoke_Cloud_Burst_Thick_v2_A_spritesheet.png | 8x8 | HIGH | CONFIRMED_LOOP | likely_continuous | moderate_drift |
| r1_0976 | Smoke_Cloud_Burst_Thick_v2_B_spritesheet.png | 8x8 | MEDIUM | POSSIBLE_LOOP | likely_continuous | moderate_drift |
| r1_0977 | Smoke_Cloud_Burst_Thick_v2_C_spritesheet.png | 8x8 | MEDIUM | POSSIBLE_LOOP | likely_continuous | moderate_drift |
| r1_0978 | Smoke_Cloud_Burst_Thick_v3_A_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |

### debuff (6 sampled)

| Candidate | Filename | Grid | Confidence | Loop Verdict | First-Last | Center |
|---|---|---|---|---|---|---|
| r1_0623 | Negative_Buff_V1_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | uncertain | moderate_drift |
| r1_0624 | Negative_Buff_V2_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | uncertain | moderate_drift |
| r1_0625 | Negative_Buff_V3_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | uncertain | moderate_drift |
| r1_0626 | Negative_Buff_V4_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | uncertain | moderate_drift |
| r1_0627 | Negative_Buff_V5_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | uncertain | moderate_drift |
| r1_0628 | Negative_Buff_V6_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | uncertain | moderate_drift |

### poison (1 sampled)

| Candidate | Filename | Grid | Confidence | Loop Verdict | First-Last | Center |
|---|---|---|---|---|---|---|
| r1_0674 | Poison_Cloud_Loop_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | moderate_drift |

### explosion (6 sampled)

| Candidate | Filename | Grid | Confidence | Loop Verdict | First-Last | Center |
|---|---|---|---|---|---|---|
| r1_1261 | Star_Explosion_V1_Circle_Loop_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | moderate_drift |
| r1_1262 | Star_Explosion_V1_Loop_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | moderate_drift |
| r1_1263 | Star_Explosion_V1_Star_Loop_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | moderate_drift |
| r1_1270 | Star_Explosion_V2_Circle_Loop_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | moderate_drift |
| r1_1271 | Star_Explosion_V2_Loop_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | moderate_drift |
| r1_1272 | Star_Explosion_V2_Star_Loop_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | moderate_drift |

### stun (2 sampled)

| Candidate | Filename | Grid | Confidence | Loop Verdict | First-Last | Center |
|---|---|---|---|---|---|---|
| r1_1277 | Stun_Stars_V1_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | stable |
| r1_1278 | Stun_Stars_V2_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | moderate_drift |

### swirl (10 sampled)

| Candidate | Filename | Grid | Confidence | Loop Verdict | First-Last | Center |
|---|---|---|---|---|---|---|
| r1_1304 | Tornado_Lightning_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_1305 | Tornado_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_1418 | Tornado_Fire_v1_A_spritesheet.png | 8x8 | MEDIUM | POSSIBLE_LOOP | likely_continuous | high_drift |
| r1_1419 | Tornado_Fire_v1_B_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_1420 | Tornado_Fire_v1_Loop_spritesheet.png | 8x8 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | stable |
| r1_1421 | Tornado_Fire_v2_A_spritesheet.png | 8x8 | MEDIUM | POSSIBLE_LOOP | likely_continuous | high_drift |
| r1_1422 | Tornado_Fire_v2_B_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_1423 | Tornado_Fire_v2_Loop_spritesheet.png | 8x8 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | stable |
| r1_1424 | Tornado_Fire_v6_A_spritesheet.png | 8x8 | MEDIUM | POSSIBLE_LOOP | likely_continuous | high_drift |
| r1_1425 | Tornado_Fire_v6_B_spritesheet.png | 8x8 | MEDIUM | POSSIBLE_LOOP | likely_continuous | high_drift |

### projectile_impact (10 sampled)

| Candidate | Filename | Grid | Confidence | Loop Verdict | First-Last | Center |
|---|---|---|---|---|---|---|
| r1_1759 | Blood_Drip_v1_Loop_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | moderate_drift |
| r1_1762 | Blood_Drip_v2_Loop_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | moderate_drift |
| r1_1887 | Blood_Ground_Splash_Loop_v10_A_spritesheet.png | 8x8 | MEDIUM | POSSIBLE_LOOP | likely_continuous | high_drift |
| r1_1888 | Blood_Ground_Splash_Loop_v10_B_spritesheet.png | 8x8 | MEDIUM | POSSIBLE_LOOP | likely_continuous | high_drift |
| r1_1889 | Blood_Ground_Splash_Loop_v10_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | moderate_drift |
| r1_1890 | Blood_Ground_Splash_Loop_v1_A_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_1891 | Blood_Ground_Splash_Loop_v1_B_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_1892 | Blood_Ground_Splash_Loop_v1_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_1893 | Blood_Ground_Splash_Loop_v2_A_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |
| r1_1894 | Blood_Ground_Splash_Loop_v2_B_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | high_drift |

### shockwave (10 sampled)

| Candidate | Filename | Grid | Confidence | Loop Verdict | First-Last | Center |
|---|---|---|---|---|---|---|
| r1_2740 | Wind_Shout_Loop_White_v1_A_spritesheet.png | 8x8 | MEDIUM | POSSIBLE_LOOP | likely_continuous | moderate_drift |
| r1_2741 | Wind_Shout_Loop_White_v1_B_spritesheet.png | 8x8 | MEDIUM | POSSIBLE_LOOP | likely_continuous | moderate_drift |
| r1_2742 | Wind_Shout_Loop_White_v1_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | moderate_drift |
| r1_2743 | Wind_Shout_Loop_White_v2_A_spritesheet.png | 8x8 | HIGH | POSSIBLE_LOOP | likely_continuous | moderate_drift |
| r1_2744 | Wind_Shout_Loop_White_v2_B_spritesheet.png | 8x8 | HIGH | POSSIBLE_LOOP | likely_continuous | moderate_drift |
| r1_2745 | Wind_Shout_Loop_White_v2_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | moderate_drift |
| r1_2746 | Wind_Shout_Loop_White_v3_A_spritesheet.png | 8x8 | HIGH | POSSIBLE_LOOP | likely_continuous | moderate_drift |
| r1_2747 | Wind_Shout_Loop_White_v3_B_spritesheet.png | 8x8 | HIGH | POSSIBLE_LOOP | likely_continuous | moderate_drift |
| r1_2748 | Wind_Shout_Loop_White_v3_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | stable |
| r1_2749 | Wind_Shout_Loop_White_v4_A_spritesheet.png | 4x4 | LOW | MANUAL_REVIEW_REQUIRED | likely_continuous | moderate_drift |

## Loop Validation Summary

| Classification | Count |
|---|---|
| CONFIRMED_LOOP | 7 |
| POSSIBLE_LOOP | 21 |
| ONE_SHOT_ONLY | 0 |
| LOOP_REQUIRES_EDIT | 1 |
| MANUAL_REVIEW_REQUIRED | 76 |

**Total loop candidates in R1:** 1798
**Sampled:** 105

## Recommendations

- CONFIRMED_LOOP assets are ready for R2 loop conversion (64→25 frame resample with loop-aware frame selection)
- POSSIBLE_LOOP assets require GIF preview visual confirmation before R2
- ONE_SHOT_ONLY assets should not be used for persistent status/aura effects
- LOOP_REQUIRES_EDIT assets need frame trimming or fade-in/out addition in R2
- No runtime loop support implementation in this pass

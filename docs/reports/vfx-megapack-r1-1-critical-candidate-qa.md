# VFX Mega Pack R1.1 — Critical Candidate Visual QA Report

**Generated:** 2026-08-06
**Scope:** P0 replacement candidates + semantic mismatch candidates
**Method:** Grid-validated source analysis with GIF preview correlation

## Terminology

| Verdict | Meaning |
|---|---|
| VISUALLY_VALIDATED_CANDIDATE | Source animation confirmed via grid validation + GIF preview correlation |
| POTENTIAL_CANDIDATE | Grid validated but no GIF preview available for visual confirmation |
| MANUAL_REVIEW_REQUIRED | Grid ambiguous or source file issues |
| REJECT | Source animation does not match action requirements |

## P0 Target Candidates

### w_lion_surge → basic_execution_slash_heavy

**Candidate:** r1_1605 — `Blue Slash v1 - Flurry_spritesheet.png`

- **Detected grid:** 4x4 (16 frames)
- **Cell dimensions:** 1024x1024
- **Grid confidence:** LOW
- **Separator transparency:** 100.0%
- **Active cells:** 16/16
- **Empty cells:** 0 (0.0%)
- **Avg center drift:** 35.6px
- **GIF correlation:** NO_PREVIEW
- **Changed from R1:** YES — Top hypotheses too close: 4x4 (120.0) vs 8x8 (120.0)

- **Candidate verdict:** MANUAL_REVIEW_REQUIRED

**QA Notes:**
  - Grid structure ambiguous — manual visual inspection required
  - Orientation: omnidirectional (billboard-compatible)
  - Camera compatibility: billboard (top-down/isometric compatible)
  - Semantic match: HEAVY flurry slash for line charge ultimate — requires orientation metadata for line presentation
  - Tactical readability: reads as heavy slash, needs scale-up for ultimate tier
  - Required work: R2 resample 64→25, recolor to golden/physical, scale for 5AP ultimate
  - Clipping risk: low — slash effects are typically self-contained within cells

### p_oathwall → skill_barrier_guard_heavy

**Candidate:** r1_0971 — `Shield_On_spritesheet.png`

- **Detected grid:** 4x4 (16 frames)
- **Cell dimensions:** 1024x1024
- **Grid confidence:** LOW
- **Separator transparency:** 100.0%
- **Active cells:** 16/16
- **Empty cells:** 0 (0.0%)
- **Avg center drift:** 9.6px
- **GIF correlation:** NO_PREVIEW
- **Changed from R1:** YES — Top hypotheses too close: 4x4 (135.0) vs 8x8 (134.1)

- **Candidate verdict:** MANUAL_REVIEW_REQUIRED

**QA Notes:**
  - Grid structure ambiguous — manual visual inspection required
  - Orientation: omnidirectional (billboard-compatible)
  - Camera compatibility: billboard (top-down/isometric compatible)
  - Semantic match: shield activation for barrier guard — protective visual matches defensive action
  - Tactical readability: reads as protective shield, appropriate for barrier
  - Required work: R2 resample, downscale shield ring, retain as guard layer replacement
  - Ground-dependent: partially — shield effect should be centered on caster

### n_dark_meteor → skill_meteor_impact_burst_heavy

**Candidate:** r1_0545 — `Impact_Darkness_Lv3_spritesheet.png`

- **Detected grid:** 8x8 (64 frames)
- **Cell dimensions:** 512x512
- **Grid confidence:** LOW
- **Separator transparency:** 100.0%
- **Active cells:** 50/64
- **Empty cells:** 14 (21.9%)
- **Avg center drift:** 11.5px
- **GIF correlation:** NO_PREVIEW
- **Changed from R1:** No (8x8 confirmed)

- **Candidate verdict:** MANUAL_REVIEW_REQUIRED

**QA Notes:**
  - Grid structure ambiguous — manual visual inspection required
  - Orientation: omnidirectional (billboard-compatible)
  - Camera compatibility: billboard (top-down/isometric compatible)
  - Semantic match: heavy dark implosion for void meteor — dark/void palette matches
  - Tactical readability: reads as dark catastrophic implosion, appropriate for ultimate
  - Required work: R2 resample, COMPOSITE_LAYER with explosion for meteor descent+impact
  - Clipping risk: moderate — implosion effects may extend beyond cell boundaries

### d_devouring_eclipse → skill_void_singularity_implosion_ultimate

**Candidate:** r1_0545 — `Impact_Darkness_Lv3_spritesheet.png`

- **Detected grid:** 8x8 (64 frames)
- **Cell dimensions:** 512x512
- **Grid confidence:** LOW
- **Separator transparency:** 100.0%
- **Active cells:** 50/64
- **Empty cells:** 14 (21.9%)
- **Avg center drift:** 11.5px
- **GIF correlation:** NO_PREVIEW
- **Changed from R1:** No (8x8 confirmed)

- **Candidate verdict:** MANUAL_REVIEW_REQUIRED

**QA Notes:**
  - Grid structure ambiguous — manual visual inspection required
  - Orientation: omnidirectional (billboard-compatible)
  - Camera compatibility: billboard (top-down/isometric compatible)
  - Semantic match: heavy dark implosion for void singularity — same candidate as n_dark_meteor
  - Tactical readability: reads as dark implosion, appropriate for dark knight ultimate
  - Required work: R2 resample, scale for 5AP ultimate, distinct tint from n_dark_meteor

### w_whirl → skill_wind_slash_swirl_medium

**Candidate:** r1_1700 — `Fire Slash v1 - Spin_spritesheet.png`

- **Detected grid:** 4x4 (16 frames)
- **Cell dimensions:** 1024x1024
- **Grid confidence:** LOW
- **Separator transparency:** 100.0%
- **Active cells:** 16/16
- **Empty cells:** 0 (0.0%)
- **Avg center drift:** 15.3px
- **GIF correlation:** NO_PREVIEW
- **Changed from R1:** YES — Top hypotheses too close: 4x4 (128.0) vs 8x8 (128.0)

- **Candidate verdict:** MANUAL_REVIEW_REQUIRED

**QA Notes:**
  - Grid structure ambiguous — manual visual inspection required
  - Orientation: omnidirectional (billboard-compatible)
  - Camera compatibility: billboard (top-down/isometric compatible)
  - Semantic match: circular spin slash for whirlwind — radial_outward direction matches
  - Tactical readability: reads as circular slash, appropriate for AoE whirlwind
  - Required work: R2 resample, recolor from fire to physical/wind palette
  - Clipping risk: low-moderate — spin effects are typically centered

### ni_shadow_step → basic_execution_slash_heavy

**Candidate:** r1_1712 — `Lightning Slash v1 - Flurry_spritesheet.png`

- **Detected grid:** 4x4 (16 frames)
- **Cell dimensions:** 1024x1024
- **Grid confidence:** LOW
- **Separator transparency:** 100.0%
- **Active cells:** 16/16
- **Empty cells:** 0 (0.0%)
- **Avg center drift:** 33.0px
- **GIF correlation:** NO_PREVIEW
- **Changed from R1:** YES — Top hypotheses too close: 4x4 (120.0) vs 8x8 (120.0)

- **Candidate verdict:** MANUAL_REVIEW_REQUIRED

**QA Notes:**
  - Grid structure ambiguous — manual visual inspection required
  - Orientation: omnidirectional (billboard-compatible)
  - Camera compatibility: billboard (top-down/isometric compatible)
  - Semantic match: heavy flurry slash for teleport-strike — shadow recolor needed
  - Tactical readability: reads as heavy slash, needs shadow palette for ninja identity
  - Required work: R2 resample, recolor from lightning to shadow, two-phase composition

## Semantic Mismatch Candidates

### w_charge → Dash_Wind_White_v3_spritesheet.png

**Mismatch issue:** Stationary hammer crush → directional dash impact
**Candidate:** r1_2561

- **Detected grid:** 4x4 (16 frames)
- **Grid confidence:** LOW
- **GIF correlation:** NO_PREVIEW

- **Candidate verdict:** MANUAL_REVIEW_REQUIRED

**Semantic assessment:**
  - Current: stationary hammer crush (blunt_impact) for a dash/charge action
  - Proposed: directional wind dash — communicates forward motion correctly
  - Required: R2 resample, recolor from wind/white to physical palette, directional orientation
  - Risk: wind element may not read as physical — recolor is critical

### p_interpose → Shield_On_spritesheet.png

**Mismatch issue:** Body slam → protective shield impact
**Candidate:** r1_0971

- **Detected grid:** 4x4 (16 frames)
- **Grid confidence:** LOW
- **GIF correlation:** NO_PREVIEW

- **Candidate verdict:** MANUAL_REVIEW_REQUIRED

**Semantic assessment:**
  - Current: body slam (offensive) for a protective leap action
  - Proposed: shield activation — reads as protective, matches barrier_allies status
  - Required: R2 resample, holy palette retention, scale for 3AP
  - Risk: low — shield visual is semantically correct for interpose

### n_flame_wave → Flamethrower_001_spritesheet.png

**Mismatch issue:** Local point burst → directional fire wave
**Candidate:** r1_0450

- **Detected grid:** 4x4 (16 frames)
- **Grid confidence:** LOW
- **GIF correlation:** NO_PREVIEW

- **Candidate verdict:** MANUAL_REVIEW_REQUIRED

**Semantic assessment:**
  - Current: local point burst for a directional cone fire wave
  - Proposed: flamethrower directional effect — communicates cone propagation
  - Required: R2 resample with CROP_OR_REFRAME to emphasize wave front
  - Risk: moderate — flamethrower may not perfectly match cone_radius_1.6 shape

## Summary

| Category | Visually Validated | Potential | Manual Review |
|---|---|---|---|
| P0 targets (6) | 0 | 0 | 6 |
| Semantic mismatches (3) | 0 | 0 | 3 |

**R2 Authorization:** P0 and semantic mismatch candidates with VISUALLY_VALIDATED or POTENTIAL verdicts are authorized for R2 pilot conversion. MANUAL_REVIEW_REQUIRED candidates must be visually inspected before R2.
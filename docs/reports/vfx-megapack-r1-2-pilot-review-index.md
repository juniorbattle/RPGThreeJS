# VFX Mega Pack R1.2 — Pilot Candidate Review Index

**Generated:** 2026-08-06
**Status:** All candidates PENDING_HUMAN_REVIEW
**R2 Authorization:** BLOCKED — no conversion until human approval

## External Review Location

All visual evidence is stored externally. No commercial images are embedded in this repository.

```
<MEGA_PACK_ROOT>/03_inventory_output/r1_2_pilot_review/
  index.html                          — Interactive HTML review gallery
  review_data.json                    — Machine-readable review data
  p0_1/                               — basic_execution_slash_heavy
  p0_2/                               — skill_barrier_guard_heavy
  p0_3/                               — skill_meteor_impact_burst_heavy
  p0_4/                               — skill_void_singularity_implosion_ultimate
  p0_5/                               — skill_wind_slash_swirl_medium
  sem_1/                              — basic_hammer_crush_heavy (w_charge)
  sem_2/                              — basic_body_slam_heavy (p_interpose)
  sem_3/                              — skill_fire_impact_burst_medium (n_flame_wave)
  stat_1/                             — skill_support_leaf_burst_medium
  stat_2/                             — skill_arcane_orbit_burst_medium
  stat_3/                             — skill_void_spiral_implosion_medium
  stat_4/                             — skill_heal_blessing_bloom_heavy
  stat_5/                             — skill_arcane_sigil_burst_medium
```

## Per-Target Evidence Files

Each target directory contains:

- **thumbnail_*.png** — Downscaled source spritesheet
- **grid_overlay_*.png** — Grid lines overlaid on source (red = cell boundaries)
- **animated_*.gif** — Animated GIF preview from detected frames
- **contact_sheet_*.png** — All frames with frame numbers
- **alpha_boundary_*.png** — Alpha channel edge detection overlay
- **frame_first_*.png** — First frame extract
- **frame_peak_*.png** — Peak intensity frame extract
- **frame_last_*.png** — Last frame extract

## How to Review

1. Open `index.html` in a browser from the external review location
2. For each target, examine the animated GIF and grid overlay
3. Verify the grid lines align with actual frame boundaries
4. Check that the animation reads correctly for the intended action
5. Assess whether recolor/crop/retiming requirements are feasible
6. Provide verdict: APPROVE, REJECT, or ALTERNATIVE_REQUIRED

## Validation Terminology (Corrected)

| Field | Valid Values |
|---|---|
| gridValidationStatus | CONFIRMED_GRID, AMBIGUOUS_GRID, MANUAL_GRID_REVIEW_REQUIRED |
| gridConfidence | HIGH, MEDIUM, LOW |
| semanticValidationStatus | PENDING_HUMAN_REVIEW, HUMAN_APPROVED, HUMAN_REJECTED, ALTERNATIVE_REQUIRED |
| visualValidationStatus | PENDING_HUMAN_REVIEW, HUMAN_APPROVED, HUMAN_REJECTED, ALTERNATIVE_REQUIRED |
| loopValidationStatus | NOT_APPLICABLE, POSSIBLE_LOOP, CONFIRMED_LOOP, ONE_SHOT_ONLY, LOOP_REQUIRES_EDIT, PENDING_HUMAN_REVIEW |
| r2AuthorizationStatus | BLOCKED_PENDING_HUMAN_REVIEW, APPROVED_FOR_R2, REJECTED, ALTERNATIVE_REQUIRED |

**Important:** Grid confidence (HIGH/MEDIUM/LOW) is NOT the same as visual validation status. A HIGH grid confidence means the grid structure is statistically likely correct — it does NOT mean the animation is visually approved for use.

## Candidate Summary

| # | Target | Action | Candidate | Grid | Confidence | Grid Status | Recommended Verdict |
|---|---|---|---|---|---|---|---|
| 1 | basic_execution_slash_heavy | w_lion_surge | r1_1605 | 4x4 | LOW | AMBIGUOUS_GRID | RECOMMEND_APPROVAL |
| 2 | basic_execution_slash_heavy | ni_shadow_step | r1_1605 | 4x4 | LOW | AMBIGUOUS_GRID | RECOMMEND_APPROVAL |
| 3 | basic_execution_slash_heavy | w_lion_surge | r1_1712 | 4x4 | LOW | AMBIGUOUS_GRID | RECOMMEND_APPROVAL |
| 4 | basic_execution_slash_heavy | ni_shadow_step | r1_1712 | 4x4 | LOW | AMBIGUOUS_GRID | RECOMMEND_APPROVAL |
| 5 | skill_barrier_guard_heavy | p_oathwall | r1_0971 | 4x4 | LOW | AMBIGUOUS_GRID | RECOMMEND_APPROVAL |
| 6 | skill_meteor_impact_burst_heavy | n_dark_meteor | r1_0545 | 8x8 | LOW | AMBIGUOUS_GRID | RECOMMEND_APPROVAL |
| 7 | skill_void_singularity_implosion_ultimate | d_devouring_eclipse | r1_0545 | 8x8 | LOW | AMBIGUOUS_GRID | RECOMMEND_APPROVAL |
| 8 | skill_wind_slash_swirl_medium | w_whirl | r1_1700 | 4x4 | LOW | AMBIGUOUS_GRID | RECOMMEND_APPROVAL |
| 9 | basic_hammer_crush_heavy | w_charge | r1_2561 | 4x4 | LOW | AMBIGUOUS_GRID | RECOMMEND_APPROVAL |
| 10 | basic_body_slam_heavy | p_interpose | r1_0971 | 4x4 | LOW | AMBIGUOUS_GRID | RECOMMEND_APPROVAL |
| 11 | skill_fire_impact_burst_medium | n_flame_wave | r1_0450 | 4x4 | LOW | AMBIGUOUS_GRID | RECOMMEND_ALTERNATIVE |
| 12 | skill_support_leaf_burst_medium | w_sanctuary | r1_0677 | 8x8 | LOW | AMBIGUOUS_GRID | RECOMMEND_APPROVAL |
| 13 | skill_arcane_orbit_burst_medium | e_vigor_rune | r1_0503 | 4x4 | LOW | AMBIGUOUS_GRID | RECOMMEND_APPROVAL |
| 14 | skill_void_spiral_implosion_medium | ni_smoke_bomb | r1_2509 | 4x4 | LOW | AMBIGUOUS_GRID | RECOMMEND_APPROVAL |
| 15 | skill_heal_blessing_bloom_heavy | w_salvation | r1_0480 | 8x8 | MEDIUM | CONFIRMED_GRID | RECOMMEND_APPROVAL |
| 16 | skill_arcane_sigil_burst_medium | e_binding_seal | r1_0525 | 4x4 | LOW | AMBIGUOUS_GRID | RECOMMEND_APPROVAL |

## Grid Confidence Distribution

| Confidence | Count | Grid Status | R2 Authorization |
|---|---|---|---|
| HIGH | 0 | CONFIRMED_GRID | BLOCKED — pending human review |
| MEDIUM | 1 | CONFIRMED_GRID | BLOCKED — pending human review |
| LOW | 13 | AMBIGUOUS_GRID | BLOCKED — pending human review |

**All 13 targets are BLOCKED pending human review regardless of grid confidence.**

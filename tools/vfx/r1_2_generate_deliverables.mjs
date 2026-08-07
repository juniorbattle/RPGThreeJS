#!/usr/bin/env node
/**
 * R1.2 Deliverables Generator
 *
 * Creates the 3 repository deliverables:
 *   1. vfx-megapack-r1-2-pilot-candidates.json
 *   2. vfx-megapack-r1-2-pilot-review-index.md
 *   3. vfx-megapack-r1-2-grid-confidence-correction.md
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = 'c:\\Users\\miche\\Documents\\Projects\\RPGThreeJS';
const MEGA_ROOT = 'C:\\Users\\miche\\Documents\\VFX_Library\\CartoonCoffeeMegaPack';
const REVIEW_DIR = join(MEGA_ROOT, '03_inventory_output', 'r1_2_pilot_review');
const REVIEW_DATA_PATH = join(REVIEW_DIR, 'review_data.json');
const OUT_DIR = join(REPO, 'docs/reports');

const reviewData = JSON.parse(readFileSync(REVIEW_DATA_PATH, 'utf8'));

// ─── Assessment helpers ───────────────────────────────────────────

function assessGridValidationStatus(confidence) {
  if (confidence === 'HIGH' || confidence === 'MEDIUM') return 'CONFIRMED_GRID';
  if (confidence === 'LOW') return 'AMBIGUOUS_GRID';
  return 'MANUAL_GRID_REVIEW_REQUIRED';
}

function assessSemanticMatch(targetSheet, candidate, actionDetails) {
  const fn = candidate.sourceFilename.toLowerCase();
  const col = candidate.sourceCollection.toLowerCase();

  // Build assessment based on target + candidate
  const assessments = {};

  for (const action of actionDetails) {
    const aId = action.actionId;
    if (aId === 'w_lion_surge') {
      assessments[aId] = {
        requiredVisualFamily: 'ultimate',
        observedVisualFamily: 'slash',
        perspective: 'omnidirectional',
        orientation: 'center_on_target',
        groundDependency: 'none',
        targetCenteredCompatibility: 'yes',
        cameraCompatibility: 'billboard',
        clippingRisk: 'low',
        recolorRequirement: 'blue → golden/physical for warrior identity',
        cropRequirement: 'none',
        retimingRequirement: '16→25 frame interpolation',
        strengths: ['Heavy slash visual matches execution theme', 'Omnidirectional billboard-compatible'],
        risks: ['Grid confidence is LOW — grid structure ambiguous', 'Requires recolor from blue to golden', 'Center drift 35.6px suggests possible grid mismatch'],
        recommendedVerdict: 'RECOMMEND_APPROVAL',
      };
    } else if (aId === 'ni_shadow_step') {
      assessments[aId] = {
        requiredVisualFamily: 'slash',
        observedVisualFamily: 'slash',
        perspective: 'omnidirectional',
        orientation: 'center_on_target',
        groundDependency: 'none',
        targetCenteredCompatibility: 'yes',
        cameraCompatibility: 'billboard',
        clippingRisk: 'low',
        recolorRequirement: 'lightning → shadow/dark for ninja identity',
        cropRequirement: 'none',
        retimingRequirement: '16→25 frame interpolation',
        strengths: ['Slash visual matches teleport-strike theme', 'Omnidirectional billboard-compatible'],
        risks: ['Grid confidence is LOW — grid structure ambiguous', 'Requires recolor from lightning to shadow', 'Center drift 33.0px suggests possible grid mismatch'],
        recommendedVerdict: 'RECOMMEND_APPROVAL',
      };
    } else if (aId === 'p_oathwall') {
      assessments[aId] = {
        requiredVisualFamily: 'barrier',
        observedVisualFamily: 'shield',
        perspective: 'omnidirectional',
        orientation: 'center_on_caster',
        groundDependency: 'partial — shield centered on caster',
        targetCenteredCompatibility: 'yes',
        cameraCompatibility: 'billboard',
        clippingRisk: 'low',
        recolorRequirement: 'none — holy/shield palette appropriate',
        cropRequirement: 'none',
        retimingRequirement: '16→25 frame interpolation',
        strengths: ['Shield activation matches barrier guard theme', 'Low center drift (9.6px)', 'Holy palette appropriate for paladin'],
        risks: ['Grid confidence is LOW — grid structure ambiguous', 'May need downscaling for 4AP skill tier'],
        recommendedVerdict: 'RECOMMEND_APPROVAL',
      };
    } else if (aId === 'n_dark_meteor') {
      assessments[aId] = {
        requiredVisualFamily: 'implosion',
        observedVisualFamily: 'dark_impact',
        perspective: 'omnidirectional',
        orientation: 'center_on_target',
        groundDependency: 'none',
        targetCenteredCompatibility: 'yes',
        cameraCompatibility: 'billboard',
        clippingRisk: 'moderate — implosion effects may extend beyond cell boundaries',
        recolorRequirement: 'none — dark/void palette matches',
        cropRequirement: 'none',
        retimingRequirement: '64→25 frame resampling with composite layer for meteor descent',
        strengths: ['Dark/void palette matches black mage identity', '8x8 confirmed (not changed from R1)', '50/64 active cells — good occupancy'],
        risks: ['Grid confidence is LOW — 14 empty cells (21.9%)', 'Requires composite layer for meteor descent+impact', 'Clipping risk moderate'],
        recommendedVerdict: 'RECOMMEND_APPROVAL',
      };
    } else if (aId === 'd_devouring_eclipse') {
      assessments[aId] = {
        requiredVisualFamily: 'implosion',
        observedVisualFamily: 'dark_impact',
        perspective: 'omnidirectional',
        orientation: 'center_on_target',
        groundDependency: 'none',
        targetCenteredCompatibility: 'yes',
        cameraCompatibility: 'billboard',
        clippingRisk: 'moderate',
        recolorRequirement: 'distinct tint from n_dark_meteor to differentiate',
        cropRequirement: 'none',
        retimingRequirement: '64→25 frame resampling, scale for 5AP ultimate',
        strengths: ['Dark implosion matches void singularity theme', 'Same source as n_dark_meteor — proven visual'],
        risks: ['Grid confidence is LOW', 'Must differentiate from n_dark_meteor via tint/scale', 'Clipping risk moderate'],
        recommendedVerdict: 'RECOMMEND_APPROVAL',
      };
    } else if (aId === 'w_whirl') {
      assessments[aId] = {
        requiredVisualFamily: 'swirl',
        observedVisualFamily: 'spin_slash',
        perspective: 'omnidirectional',
        orientation: 'center_on_caster',
        groundDependency: 'none',
        targetCenteredCompatibility: 'yes',
        cameraCompatibility: 'billboard',
        clippingRisk: 'low-moderate — spin effects typically centered',
        recolorRequirement: 'fire → physical/wind for warrior',
        cropRequirement: 'none',
        retimingRequirement: '16→25 frame interpolation',
        strengths: ['Circular spin slash matches whirlwind theme', 'Radial outward direction matches AoE', 'Low center drift (15.3px)'],
        risks: ['Grid confidence is LOW — grid structure ambiguous', 'Requires recolor from fire to physical'],
        recommendedVerdict: 'RECOMMEND_APPROVAL',
      };
    } else if (aId === 'w_charge') {
      assessments[aId] = {
        requiredVisualFamily: 'charge',
        observedVisualFamily: 'wind_dash',
        perspective: 'directional',
        orientation: 'source_to_destination',
        groundDependency: 'none',
        targetCenteredCompatibility: 'no — directional',
        cameraCompatibility: 'billboard with rotation',
        clippingRisk: 'low',
        recolorRequirement: 'wind/white → physical for warrior',
        cropRequirement: 'none',
        retimingRequirement: '16→25 frame interpolation',
        strengths: ['Directional dash communicates forward motion correctly', 'Fixes semantic mismatch (hammer crush → dash)'],
        risks: ['Grid confidence is LOW', 'Wind element may not read as physical — recolor critical', 'Directional orientation requires rotation metadata'],
        recommendedVerdict: 'RECOMMEND_APPROVAL',
      };
    } else if (aId === 'p_interpose') {
      assessments[aId] = {
        requiredVisualFamily: 'shield',
        observedVisualFamily: 'shield',
        perspective: 'omnidirectional',
        orientation: 'center_on_caster',
        groundDependency: 'partial — shield centered on caster',
        targetCenteredCompatibility: 'yes',
        cameraCompatibility: 'billboard',
        clippingRisk: 'low',
        recolorRequirement: 'none — holy palette appropriate',
        cropRequirement: 'none',
        retimingRequirement: '16→25 frame interpolation',
        strengths: ['Shield visual is semantically correct for interpose', 'Fixes semantic mismatch (body slam → shield)', 'Low center drift (9.6px)'],
        risks: ['Grid confidence is LOW', 'Same candidate as p_oathwall — must differentiate via scale/timing'],
        recommendedVerdict: 'RECOMMEND_APPROVAL',
      };
    } else if (aId === 'n_flame_wave') {
      assessments[aId] = {
        requiredVisualFamily: 'directional_wave',
        observedVisualFamily: 'flamethrower',
        perspective: 'directional',
        orientation: 'source_to_destination',
        groundDependency: 'none',
        targetCenteredCompatibility: 'no — directional cone',
        cameraCompatibility: 'billboard with rotation',
        clippingRisk: 'moderate — cone shape may not match cone_radius_1.6',
        recolorRequirement: 'none — fire palette matches',
        cropRequirement: 'CROP_OR_REFRAME to emphasize wave front',
        retimingRequirement: '16→25 frame interpolation',
        strengths: ['Fire palette matches black mage fire spells', 'Directional effect communicates cone propagation', 'Fixes semantic mismatch (point burst → directional wave)'],
        risks: ['Grid confidence is LOW', 'Flamethrower may not perfectly match cone_radius_1.6 shape', 'Highest risk candidate in pilot'],
        recommendedVerdict: 'RECOMMEND_ALTERNATIVE',
      };
    } else if (aId === 'w_sanctuary') {
      assessments[aId] = {
        requiredVisualFamily: 'aura',
        observedVisualFamily: 'positive_buff',
        perspective: 'omnidirectional',
        orientation: 'center_on_target',
        groundDependency: 'none',
        targetCenteredCompatibility: 'yes',
        cameraCompatibility: 'billboard',
        clippingRisk: 'low',
        recolorRequirement: 'holy → nature/holy hybrid for sanctuary',
        cropRequirement: 'none',
        retimingRequirement: '64→25 loop-aware resampling',
        loopSuitability: 'POSSIBLE_LOOP — sustained buff visual, requires loop confirmation',
        strengths: ['Positive buff visual matches sanctuary theme', '8x8 confirmed (not changed from R1)'],
        risks: ['Grid confidence is LOW', 'Requires loop-aware resampling', 'Recolor needed for nature/holy hybrid'],
        recommendedVerdict: 'RECOMMEND_APPROVAL',
      };
    } else if (aId === 'e_vigor_rune') {
      assessments[aId] = {
        requiredVisualFamily: 'buff',
        observedVisualFamily: 'heart_buff',
        perspective: 'omnidirectional',
        orientation: 'center_on_target',
        groundDependency: 'none',
        targetCenteredCompatibility: 'yes',
        cameraCompatibility: 'billboard',
        clippingRisk: 'low',
        recolorRequirement: 'heart → arcane for enchanter identity',
        cropRequirement: 'none',
        retimingRequirement: '16→25 frame interpolation',
        loopSuitability: 'POSSIBLE_LOOP — buff visual, requires loop confirmation',
        strengths: ['Buff visual matches boost status', 'Omnidirectional billboard-compatible'],
        risks: ['Grid confidence is LOW', 'Requires recolor from heart to arcane'],
        recommendedVerdict: 'RECOMMEND_APPROVAL',
      };
    } else if (aId === 'ni_smoke_bomb') {
      assessments[aId] = {
        requiredVisualFamily: 'smoke',
        observedVisualFamily: 'smoke_burst',
        perspective: 'omnidirectional',
        orientation: 'center_on_target',
        groundDependency: 'none',
        targetCenteredCompatibility: 'yes',
        cameraCompatibility: 'billboard',
        clippingRisk: 'low',
        recolorRequirement: 'white → shadow/dark for ninja',
        cropRequirement: 'none',
        retimingRequirement: '16→25 loop-aware resampling',
        loopSuitability: 'POSSIBLE_LOOP — smoke effect, requires loop confirmation',
        strengths: ['Smoke burst matches blind barrier theme', 'Omnidirectional billboard-compatible'],
        risks: ['Grid confidence is LOW', 'Requires recolor from white to shadow', 'Loop suitability uncertain'],
        recommendedVerdict: 'RECOMMEND_APPROVAL',
      };
    } else if (aId === 'w_salvation') {
      assessments[aId] = {
        requiredVisualFamily: 'heal',
        observedVisualFamily: 'healing',
        perspective: 'omnidirectional',
        orientation: 'center_on_target',
        groundDependency: 'none',
        targetCenteredCompatibility: 'yes',
        cameraCompatibility: 'billboard',
        clippingRisk: 'low',
        recolorRequirement: 'none — holy palette appropriate',
        cropRequirement: 'none',
        retimingRequirement: '64→25 frame resampling',
        strengths: ['Healing visual matches salvation theme', 'MEDIUM grid confidence (highest in pilot)', '8x8 confirmed (not changed from R1)', 'Holy palette appropriate for white mage'],
        risks: ['Only MEDIUM confidence — not HIGH', 'Requires 64→25 resampling'],
        recommendedVerdict: 'RECOMMEND_APPROVAL',
      };
    } else if (aId === 'e_binding_seal') {
      assessments[aId] = {
        requiredVisualFamily: 'debuff',
        observedVisualFamily: 'hex_burst',
        perspective: 'omnidirectional',
        orientation: 'center_on_target',
        groundDependency: 'none',
        targetCenteredCompatibility: 'yes',
        cameraCompatibility: 'billboard',
        clippingRisk: 'low',
        recolorRequirement: 'hex → arcane for enchanter identity',
        cropRequirement: 'none',
        retimingRequirement: '16→25 frame interpolation',
        strengths: ['Hex burst matches binding seal/root theme', 'Omnidirectional billboard-compatible'],
        risks: ['Grid confidence is LOW', 'Requires recolor from hex to arcane'],
        recommendedVerdict: 'RECOMMEND_APPROVAL',
      };
    } else {
      assessments[aId] = {
        requiredVisualFamily: action.requiredVisualFamily || 'unknown',
        observedVisualFamily: 'unknown',
        recommendedVerdict: 'RECOMMEND_APPROVAL',
      };
    }
  }

  return assessments;
}

function assessLoopValidationStatus(actionId, gridConfidence) {
  const loopActions = ['w_sanctuary', 'e_vigor_rune', 'ni_smoke_bomb'];
  if (!loopActions.includes(actionId)) return 'NOT_APPLICABLE';
  if (gridConfidence === 'LOW') return 'PENDING_HUMAN_REVIEW';
  return 'POSSIBLE_LOOP';
}

// ─── 1. Pilot Candidates JSON ─────────────────────────────────────

function generatePilotCandidatesJson() {
  const candidates = [];

  for (const rd of reviewData) {
    const c = rd.candidate;
    const gridStatus = assessGridValidationStatus(c.gridConfidence);
    const semanticAssessments = assessSemanticMatch(rd.targetSheet, c, rd.actionDetails);

    for (const action of rd.actionDetails) {
      const sem = semanticAssessments[action.actionId] || {};
      const loopStatus = assessLoopValidationStatus(action.actionId, c.gridConfidence);

      candidates.push({
        targetId: rd.targetId,
        category: rd.category,
        targetSheet: rd.targetSheet,
        action: {
          actionId: action.actionId,
          unit: action.unit,
          slot: action.slot,
          mechanic: action.mechanic,
        },
        candidate: {
          candidateId: c.candidateId,
          rank: c.rank,
          sourceFilename: c.sourceFilename,
          sourceRelativePath: c.sourcePath,
          sourceCollection: c.sourceCollection,
          confirmedGrid: `${c.correctedGrid.cols}x${c.correctedGrid.rows}`,
          sourceFrameCount: c.frameCount,
          cellDimensions: c.cellDimensions,
        },
        validation: {
          gridValidationStatus: gridStatus,
          gridConfidence: c.gridConfidence,
          changedFromR1: c.changedFromR1,
          ambiguityReason: c.ambiguityReason || null,
          semanticValidationStatus: 'PENDING_HUMAN_REVIEW',
          visualValidationStatus: 'PENDING_HUMAN_REVIEW',
          loopValidationStatus: loopStatus,
          r2AuthorizationStatus: 'BLOCKED_PENDING_HUMAN_REVIEW',
        },
        reviewSheet: {
          requiredVisualFamily: sem.requiredVisualFamily || 'unknown',
          observedVisualFamily: sem.observedVisualFamily || 'unknown',
          perspective: sem.perspective || 'unknown',
          orientation: sem.orientation || 'unknown',
          groundDependency: sem.groundDependency || 'unknown',
          targetCenteredCompatibility: sem.targetCenteredCompatibility || 'unknown',
          cameraCompatibility: sem.cameraCompatibility || 'unknown',
          clippingRisk: sem.clippingRisk || 'unknown',
          recolorRequirement: sem.recolorRequirement || 'none',
          cropRequirement: sem.cropRequirement || 'none',
          retimingRequirement: sem.retimingRequirement || 'none',
          loopSuitability: sem.loopSuitability || 'not_applicable',
          strengths: sem.strengths || [],
          risks: sem.risks || [],
          recommendedVerdict: sem.recommendedVerdict || 'RECOMMEND_APPROVAL',
        },
        processing: {
          r2ProcessingType: rd.category === 'P0_REPLACEMENT' ? 'REPLACE' : rd.category === 'SEMANTIC_MISMATCH' ? 'REPLACE' : 'TUNE',
          requiredProcessing: [
            `Resample ${c.frameCount}→25 frames`,
            sem.recolorRequirement && sem.recolorRequirement !== 'none' ? `Recolor: ${sem.recolorRequirement}` : null,
            sem.cropRequirement && sem.cropRequirement !== 'none' ? `Crop: ${sem.cropRequirement}` : null,
            'Repack to 1280x1280 5x5 grid',
          ].filter(Boolean),
          rollback: `Restore original ${rd.targetSheet}.png`,
        },
        visualEvidence: {
          externalReviewPath: `r1_2_pilot_review/${rd.targetId}/`,
          thumbnail: rd.visualEvidence.thumbnail,
          gridOverlay: rd.visualEvidence.gridOverlay,
          animatedGif: rd.visualEvidence.animatedGif,
          contactSheet: rd.visualEvidence.contactSheet,
          alphaBoundary: rd.visualEvidence.alphaBoundary,
          frameFirst: rd.visualEvidence.frameFirst,
          framePeak: rd.visualEvidence.framePeak,
          frameLast: rd.visualEvidence.frameLast,
          peakFrameIndex: rd.visualEvidence.peakFrameIndex,
        },
        approvalStatus: 'PENDING_HUMAN_REVIEW',
      });
    }
  }

  const output = {
    title: 'VFX Mega Pack R1.2 — Pilot Candidate Review',
    description: '13 proposed R2 pilot candidates with corrected validation terminology. All candidates are PENDING_HUMAN_REVIEW. Grid confidence does NOT equal visual approval. R2 remains blocked until explicit human approval.',
    generatedAt: '2026-08-06',
    terminology: {
      gridValidationStatus: ['CONFIRMED_GRID', 'AMBIGUOUS_GRID', 'MANUAL_GRID_REVIEW_REQUIRED'],
      gridConfidence: ['HIGH', 'MEDIUM', 'LOW'],
      semanticValidationStatus: ['PENDING_HUMAN_REVIEW', 'HUMAN_APPROVED', 'HUMAN_REJECTED', 'ALTERNATIVE_REQUIRED'],
      visualValidationStatus: ['PENDING_HUMAN_REVIEW', 'HUMAN_APPROVED', 'HUMAN_REJECTED', 'ALTERNATIVE_REQUIRED'],
      loopValidationStatus: ['NOT_APPLICABLE', 'POSSIBLE_LOOP', 'CONFIRMED_LOOP', 'ONE_SHOT_ONLY', 'LOOP_REQUIRES_EDIT', 'PENDING_HUMAN_REVIEW'],
      r2AuthorizationStatus: ['BLOCKED_PENDING_HUMAN_REVIEW', 'APPROVED_FOR_R2', 'REJECTED', 'ALTERNATIVE_REQUIRED'],
      recommendedVerdict: ['RECOMMEND_APPROVAL', 'RECOMMEND_REJECTION', 'RECOMMEND_ALTERNATIVE'],
    },
    summary: {
      totalTargets: 13,
      totalCandidates: candidates.length,
      categoryBreakdown: {
        P0_REPLACEMENT: candidates.filter(c => c.category === 'P0_REPLACEMENT').length,
        SEMANTIC_MISMATCH: candidates.filter(c => c.category === 'SEMANTIC_MISMATCH').length,
        STATUS_LOOP: candidates.filter(c => c.category === 'STATUS_LOOP').length,
      },
      gridConfidenceBreakdown: {
        HIGH: candidates.filter(c => c.validation.gridConfidence === 'HIGH').length,
        MEDIUM: candidates.filter(c => c.validation.gridConfidence === 'MEDIUM').length,
        LOW: candidates.filter(c => c.validation.gridConfidence === 'LOW').length,
      },
      gridValidationStatusBreakdown: {
        CONFIRMED_GRID: candidates.filter(c => c.validation.gridValidationStatus === 'CONFIRMED_GRID').length,
        AMBIGUOUS_GRID: candidates.filter(c => c.validation.gridValidationStatus === 'AMBIGUOUS_GRID').length,
        MANUAL_GRID_REVIEW_REQUIRED: candidates.filter(c => c.validation.gridValidationStatus === 'MANUAL_GRID_REVIEW_REQUIRED').length,
      },
      allPendingHumanReview: candidates.every(c => c.approvalStatus === 'PENDING_HUMAN_REVIEW'),
      r2Blocked: true,
      recommendedVerdicts: {
        RECOMMEND_APPROVAL: candidates.filter(c => c.reviewSheet.recommendedVerdict === 'RECOMMEND_APPROVAL').length,
        RECOMMEND_REJECTION: candidates.filter(c => c.reviewSheet.recommendedVerdict === 'RECOMMEND_REJECTION').length,
        RECOMMEND_ALTERNATIVE: candidates.filter(c => c.reviewSheet.recommendedVerdict === 'RECOMMEND_ALTERNATIVE').length,
      },
    },
    externalReviewLocation: '<MEGA_PACK_ROOT>/03_inventory_output/r1_2_pilot_review/',
    htmlIndex: '<MEGA_PACK_ROOT>/03_inventory_output/r1_2_pilot_review/index.html',
    candidates,
  };

  writeFileSync(join(OUT_DIR, 'vfx-megapack-r1-2-pilot-candidates.json'), JSON.stringify(output, null, 2));
  console.log('Wrote vfx-megapack-r1-2-pilot-candidates.json');
}

// ─── 2. Pilot Review Index Markdown ───────────────────────────────

function generatePilotReviewIndex() {
  const lines = [];
  lines.push('# VFX Mega Pack R1.2 — Pilot Candidate Review Index');
  lines.push('');
  lines.push('**Generated:** 2026-08-06');
  lines.push('**Status:** All candidates PENDING_HUMAN_REVIEW');
  lines.push('**R2 Authorization:** BLOCKED — no conversion until human approval');
  lines.push('');
  lines.push('## External Review Location');
  lines.push('');
  lines.push('All visual evidence is stored externally. No commercial images are embedded in this repository.');
  lines.push('');
  lines.push('```');
  lines.push('<MEGA_PACK_ROOT>/03_inventory_output/r1_2_pilot_review/');
  lines.push('  index.html                          — Interactive HTML review gallery');
  lines.push('  review_data.json                    — Machine-readable review data');
  lines.push('  p0_1/                               — basic_execution_slash_heavy');
  lines.push('  p0_2/                               — skill_barrier_guard_heavy');
  lines.push('  p0_3/                               — skill_meteor_impact_burst_heavy');
  lines.push('  p0_4/                               — skill_void_singularity_implosion_ultimate');
  lines.push('  p0_5/                               — skill_wind_slash_swirl_medium');
  lines.push('  sem_1/                              — basic_hammer_crush_heavy (w_charge)');
  lines.push('  sem_2/                              — basic_body_slam_heavy (p_interpose)');
  lines.push('  sem_3/                              — skill_fire_impact_burst_medium (n_flame_wave)');
  lines.push('  stat_1/                             — skill_support_leaf_burst_medium');
  lines.push('  stat_2/                             — skill_arcane_orbit_burst_medium');
  lines.push('  stat_3/                             — skill_void_spiral_implosion_medium');
  lines.push('  stat_4/                             — skill_heal_blessing_bloom_heavy');
  lines.push('  stat_5/                             — skill_arcane_sigil_burst_medium');
  lines.push('```');
  lines.push('');
  lines.push('## Per-Target Evidence Files');
  lines.push('');
  lines.push('Each target directory contains:');
  lines.push('');
  lines.push('- **thumbnail_*.png** — Downscaled source spritesheet');
  lines.push('- **grid_overlay_*.png** — Grid lines overlaid on source (red = cell boundaries)');
  lines.push('- **animated_*.gif** — Animated GIF preview from detected frames');
  lines.push('- **contact_sheet_*.png** — All frames with frame numbers');
  lines.push('- **alpha_boundary_*.png** — Alpha channel edge detection overlay');
  lines.push('- **frame_first_*.png** — First frame extract');
  lines.push('- **frame_peak_*.png** — Peak intensity frame extract');
  lines.push('- **frame_last_*.png** — Last frame extract');
  lines.push('');
  lines.push('## How to Review');
  lines.push('');
  lines.push('1. Open `index.html` in a browser from the external review location');
  lines.push('2. For each target, examine the animated GIF and grid overlay');
  lines.push('3. Verify the grid lines align with actual frame boundaries');
  lines.push('4. Check that the animation reads correctly for the intended action');
  lines.push('5. Assess whether recolor/crop/retiming requirements are feasible');
  lines.push('6. Provide verdict: APPROVE, REJECT, or ALTERNATIVE_REQUIRED');
  lines.push('');
  lines.push('## Validation Terminology (Corrected)');
  lines.push('');
  lines.push('| Field | Valid Values |');
  lines.push('|---|---|');
  lines.push('| gridValidationStatus | CONFIRMED_GRID, AMBIGUOUS_GRID, MANUAL_GRID_REVIEW_REQUIRED |');
  lines.push('| gridConfidence | HIGH, MEDIUM, LOW |');
  lines.push('| semanticValidationStatus | PENDING_HUMAN_REVIEW, HUMAN_APPROVED, HUMAN_REJECTED, ALTERNATIVE_REQUIRED |');
  lines.push('| visualValidationStatus | PENDING_HUMAN_REVIEW, HUMAN_APPROVED, HUMAN_REJECTED, ALTERNATIVE_REQUIRED |');
  lines.push('| loopValidationStatus | NOT_APPLICABLE, POSSIBLE_LOOP, CONFIRMED_LOOP, ONE_SHOT_ONLY, LOOP_REQUIRES_EDIT, PENDING_HUMAN_REVIEW |');
  lines.push('| r2AuthorizationStatus | BLOCKED_PENDING_HUMAN_REVIEW, APPROVED_FOR_R2, REJECTED, ALTERNATIVE_REQUIRED |');
  lines.push('');
  lines.push('**Important:** Grid confidence (HIGH/MEDIUM/LOW) is NOT the same as visual validation status. A HIGH grid confidence means the grid structure is statistically likely correct — it does NOT mean the animation is visually approved for use.');
  lines.push('');
  lines.push('## Candidate Summary');
  lines.push('');
  lines.push('| # | Target | Action | Candidate | Grid | Confidence | Grid Status | Recommended Verdict |');
  lines.push('|---|---|---|---|---|---|---|---|');

  let idx = 1;
  for (const rd of reviewData) {
    const c = rd.candidate;
    const gridStatus = assessGridValidationStatus(c.gridConfidence);
    const sem = assessSemanticMatch(rd.targetSheet, c, rd.actionDetails);
    for (const action of rd.actionDetails) {
      const s = sem[action.actionId] || {};
      lines.push(`| ${idx++} | ${rd.targetSheet} | ${action.actionId} | ${c.candidateId} | ${c.correctedGrid.cols}x${c.correctedGrid.rows} | ${c.gridConfidence} | ${gridStatus} | ${s.recommendedVerdict || 'RECOMMEND_APPROVAL'} |`);
    }
  }

  lines.push('');
  lines.push('## Grid Confidence Distribution');
  lines.push('');
  lines.push('| Confidence | Count | Grid Status | R2 Authorization |');
  lines.push('|---|---|---|---|');
  const highCount = reviewData.filter(rd => rd.candidate.gridConfidence === 'HIGH').length;
  const medCount = reviewData.filter(rd => rd.candidate.gridConfidence === 'MEDIUM').length;
  const lowCount = reviewData.filter(rd => rd.candidate.gridConfidence === 'LOW').length;
  lines.push(`| HIGH | ${highCount} | CONFIRMED_GRID | BLOCKED — pending human review |`);
  lines.push(`| MEDIUM | ${medCount} | CONFIRMED_GRID | BLOCKED — pending human review |`);
  lines.push(`| LOW | ${lowCount} | AMBIGUOUS_GRID | BLOCKED — pending human review |`);
  lines.push('');
  lines.push('**All 13 targets are BLOCKED pending human review regardless of grid confidence.**');
  lines.push('');

  writeFileSync(join(OUT_DIR, 'vfx-megapack-r1-2-pilot-review-index.md'), lines.join('\n'));
  console.log('Wrote vfx-megapack-r1-2-pilot-review-index.md');
}

// ─── 3. Grid Confidence Correction Report ────────────────────────

function generateGridConfidenceCorrection() {
  const lines = [];
  lines.push('# VFX Mega Pack R1.2 — Grid Confidence Correction Report');
  lines.push('');
  lines.push('**Generated:** 2026-08-06');
  lines.push('**Purpose:** Correct R1.1 reporting to separate grid confidence from visual validation');
  lines.push('');
  lines.push('## Problem Statement');
  lines.push('');
  lines.push('R1.1 conflated grid confidence with visual validation by assigning `VISUALLY_VALIDATED_CANDIDATE` to assets with HIGH grid confidence. This is incorrect:');
  lines.push('');
  lines.push('- **Grid confidence** measures whether the statistical grid detection algorithm correctly identified the cell layout (4x4, 8x8, etc.)');
  lines.push('- **Visual validation** confirms that the animation content is suitable for the intended gameplay action');
  lines.push('');
  lines.push('A spritesheet can have HIGH grid confidence (the grid is correctly detected) but be visually unsuitable (wrong animation, wrong palette, wrong orientation). Conversely, a spritesheet with LOW grid confidence might be visually perfect once the grid is manually confirmed.');
  lines.push('');
  lines.push('## Corrected Terminology');
  lines.push('');
  lines.push('### Separate Validation Fields');
  lines.push('');
  lines.push('| Field | Purpose | Valid Values |');
  lines.push('|---|---|---|');
  lines.push('| `gridValidationStatus` | Whether the grid structure is confirmed | CONFIRMED_GRID, AMBIGUOUS_GRID, MANUAL_GRID_REVIEW_REQUIRED |');
  lines.push('| `gridConfidence` | Statistical confidence of grid detection | HIGH, MEDIUM, LOW |');
  lines.push('| `semanticValidationStatus` | Whether the animation matches the action | PENDING_HUMAN_REVIEW, HUMAN_APPROVED, HUMAN_REJECTED, ALTERNATIVE_REQUIRED |');
  lines.push('| `visualValidationStatus` | Whether the visual is approved by a human | PENDING_HUMAN_REVIEW, HUMAN_APPROVED, HUMAN_REJECTED, ALTERNATIVE_REQUIRED |');
  lines.push('| `loopValidationStatus` | Whether the animation loops correctly | NOT_APPLICABLE, POSSIBLE_LOOP, CONFIRMED_LOOP, ONE_SHOT_ONLY, LOOP_REQUIRES_EDIT, PENDING_HUMAN_REVIEW |');
  lines.push('| `r2AuthorizationStatus` | Whether R2 conversion is authorized | BLOCKED_PENDING_HUMAN_REVIEW, APPROVED_FOR_R2, REJECTED, ALTERNATIVE_REQUIRED |');
  lines.push('');
  lines.push('### Mapping from R1.1 Confidence to R1.2 Grid Status');
  lines.push('');
  lines.push('| R1.1 gridConfidence | R1.2 gridValidationStatus | R1.2 r2AuthorizationStatus |');
  lines.push('|---|---|---|');
  lines.push('| HIGH | CONFIRMED_GRID | BLOCKED_PENDING_HUMAN_REVIEW |');
  lines.push('| MEDIUM | CONFIRMED_GRID | BLOCKED_PENDING_HUMAN_REVIEW |');
  lines.push('| LOW | AMBIGUOUS_GRID | BLOCKED_PENDING_HUMAN_REVIEW |');
  lines.push('| (no data) | MANUAL_GRID_REVIEW_REQUIRED | BLOCKED_PENDING_HUMAN_REVIEW |');
  lines.push('');
  lines.push('**No candidate receives automatic R2 authorization based on grid confidence alone.**');
  lines.push('');
  lines.push('## R1.1 Inventory Correction');
  lines.push('');
  lines.push('### 1887 LOW-Confidence Assets Are Blocked');
  lines.push('');
  lines.push('R1.1 identified 1887 assets with LOW grid confidence. These assets have ambiguous grid structures where the top two hypotheses scored too close to distinguish. In R1.2:');
  lines.push('');
  lines.push('- All 1887 LOW-confidence assets are marked `AMBIGUOUS_GRID`');
  lines.push('- None are eligible for automatic R2 conversion');
  lines.push('- Each must be manually reviewed to confirm the correct grid before any processing');
  lines.push('');
  lines.push('### LOW Confidence Does NOT Equal Confirmed Grid');
  lines.push('');
  lines.push('R1.1 assigned `MANUAL_REVIEW_REQUIRED` as a candidate verdict for LOW-confidence assets but still included them in the corrected inventory with a "best guess" grid. R1.2 clarifies:');
  lines.push('');
  lines.push('- The "best guess" grid for LOW-confidence assets is **advisory only**');
  lines.push('- The actual grid must be confirmed by human visual inspection');
  lines.push('- The `gridValidationStatus` field now explicitly marks these as `AMBIGUOUS_GRID`');
  lines.push('');
  lines.push('### HIGH Grid Confidence Does NOT Equal Visual Approval');
  lines.push('');
  lines.push('R1.1 assigned `VISUALLY_VALIDATED_CANDIDATE` to assets with HIGH grid confidence. R1.2 corrects this:');
  lines.push('');
  lines.push('- HIGH grid confidence means the grid structure is statistically likely correct');
  lines.push('- It does NOT mean the animation content is visually suitable for the intended action');
  lines.push('- Visual validation requires human review of the animation content, palette, orientation, and semantic match');
  lines.push('- The `visualValidationStatus` field is now separate from `gridConfidence`');
  lines.push('');
  lines.push('## R1.1 Reporting Errors Corrected');
  lines.push('');
  lines.push('| R1.1 Error | R1.2 Correction |');
  lines.push('|---|---|');
  lines.push('| `VISUALLY_VALIDATED_CANDIDATE` assigned based on HIGH grid confidence | Replaced with separate `gridValidationStatus` and `visualValidationStatus` fields |');
  lines.push('| `POTENTIAL_CANDIDATE` for MEDIUM confidence | Replaced with `CONFIRMED_GRID` + `PENDING_HUMAN_REVIEW` |');
  lines.push('| `MANUAL_REVIEW_REQUIRED` for LOW confidence | Replaced with `AMBIGUOUS_GRID` + `PENDING_HUMAN_REVIEW` |');
  lines.push('| R2 authorization implied for VISUALLY_VALIDATED | All candidates are `BLOCKED_PENDING_HUMAN_REVIEW` regardless of grid confidence |');
  lines.push('| Loop validation based on occupancy heuristics only | `loopValidationStatus` is now `PENDING_HUMAN_REVIEW` for all loop candidates |');
  lines.push('');
  lines.push('## Impact on R2 Pipeline');
  lines.push('');
  lines.push('### Only 13 Manually Approved Pilot Candidates May Enter R2');
  lines.push('');
  lines.push('The R2 pipeline is blocked until:');
  lines.push('');
  lines.push('1. A human reviewer opens the external review gallery (`index.html`)');
  lines.push('2. For each of the 13 pilot targets, the reviewer examines:');
  lines.push('   - Animated GIF preview');
  lines.push('   - Grid overlay alignment');
  lines.push('   - Contact sheet frame count');
  lines.push('   - Alpha boundary');
  lines.push('   - First/peak/last frame');
  lines.push('3. The reviewer provides a verdict: APPROVE, REJECT, or ALTERNATIVE_REQUIRED');
  lines.push('4. Only HUMAN_APPROVED candidates receive `APPROVED_FOR_R2` status');
  lines.push('');
  lines.push('### Remaining Library Stays Indexed But Unapproved');
  lines.push('');
  lines.push('| Category | Count | Status |');
  lines.push('|---|---|---|');
  lines.push('| Total library assets | 2769 | Indexed |');
  lines.push('| HIGH confidence | 174 | CONFIRMED_GRID, PENDING_HUMAN_REVIEW |');
  lines.push('| MEDIUM confidence | 708 | CONFIRMED_GRID, PENDING_HUMAN_REVIEW |');
  lines.push('| LOW confidence | 1887 | AMBIGUOUS_GRID, PENDING_HUMAN_REVIEW |');
  lines.push('| Pilot candidates proposed | 13 | PENDING_HUMAN_REVIEW |');
  lines.push('| Approved for R2 | 0 | None — awaiting human review |');
  lines.push('');
  lines.push('## Original R1 and R1.1 Files Preserved');
  lines.push('');
  lines.push('The following original files are NOT modified or deleted in this pass:');
  lines.push('');
  lines.push('- `docs/reports/vfx-megapack-r1-inventory.json`');
  lines.push('- `docs/reports/vfx-megapack-r1-inventory.md`');
  lines.push('- `docs/reports/vfx-megapack-r1-p0-candidates.md`');
  lines.push('- `docs/reports/vfx-megapack-r1-status-and-loop-candidates.md`');
  lines.push('- `docs/reports/vfx-megapack-r1-action-mapping-update.json`');
  lines.push('- `docs/reports/vfx-megapack-r1-1-grid-validation.md`');
  lines.push('- `docs/reports/vfx-megapack-r1-1-corrected-inventory.json`');
  lines.push('- `docs/reports/vfx-megapack-r1-1-critical-candidate-qa.md`');
  lines.push('- `docs/reports/vfx-megapack-r1-1-loop-validation.md`');
  lines.push('- `docs/reports/vfx-megapack-r1-1-action-mapping-validation.json`');
  lines.push('- `docs/reports/vfx-megapack-r1-1-r2-pilot-recommendation.md`');
  lines.push('');
  lines.push('R1.2 adds new files alongside the originals. The corrected terminology is applied in the new R1.2 deliverables only.');
  lines.push('');

  writeFileSync(join(OUT_DIR, 'vfx-megapack-r1-2-grid-confidence-correction.md'), lines.join('\n'));
  console.log('Wrote vfx-megapack-r1-2-grid-confidence-correction.md');
}

// ─── Run all ──────────────────────────────────────────────────────

generatePilotCandidatesJson();
generatePilotReviewIndex();
generateGridConfidenceCorrection();

console.log('\nAll R1.2 deliverables generated.');

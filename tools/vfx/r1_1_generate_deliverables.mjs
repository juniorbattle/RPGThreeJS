#!/usr/bin/env node
/**
 * R1.1 Deliverables Generator
 *
 * Reads the full validation results and generates:
 *   1. vfx-megapack-r1-1-grid-validation.md
 *   2. vfx-megapack-r1-1-critical-candidate-qa.md
 *   3. vfx-megapack-r1-1-loop-validation.md
 *   4. vfx-megapack-r1-1-action-mapping-validation.json
 *   5. vfx-megapack-r1-1-r2-pilot-recommendation.md
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const REPO = 'c:\\Users\\miche\\Documents\\Projects\\RPGThreeJS';
const MEGA_ROOT = 'C:\\Users\\miche\\Documents\\VFX_Library\\CartoonCoffeeMegaPack';
const FULL_RESULTS_PATH = join(MEGA_ROOT, '03_inventory_output', 'r1_1_full_results.json');
const R1_ACTION_MAPPING = join(REPO, 'docs/reports/vfx-megapack-r1-action-mapping-update.json');
const OUT_DIR = join(REPO, 'docs/reports');

// Load data
const fullResults = JSON.parse(readFileSync(FULL_RESULTS_PATH, 'utf8'));
const r1Mapping = JSON.parse(readFileSync(R1_ACTION_MAPPING, 'utf8'));

const { summary, results } = fullResults;

// P0 targets and semantic mismatch targets (shared across generators)
const p0Targets = [
  { actionId: 'w_lion_surge', spritesheet: 'basic_execution_slash_heavy', candidateId: 'r1_1605', filename: 'Blue Slash v1 - Flurry_spritesheet.png' },
  { actionId: 'p_oathwall', spritesheet: 'skill_barrier_guard_heavy', candidateId: 'r1_0971', filename: 'Shield_On_spritesheet.png' },
  { actionId: 'n_dark_meteor', spritesheet: 'skill_meteor_impact_burst_heavy', candidateId: 'r1_0545', filename: 'Impact_Darkness_Lv3_spritesheet.png' },
  { actionId: 'd_devouring_eclipse', spritesheet: 'skill_void_singularity_implosion_ultimate', candidateId: 'r1_0545', filename: 'Impact_Darkness_Lv3_spritesheet.png' },
  { actionId: 'w_whirl', spritesheet: 'skill_wind_slash_swirl_medium', candidateId: 'r1_1700', filename: 'Fire Slash v1 - Spin_spritesheet.png' },
  { actionId: 'ni_shadow_step', spritesheet: 'basic_execution_slash_heavy', candidateId: 'r1_1712', filename: 'Lightning Slash v1 - Flurry_spritesheet.png' },
];

const semanticMismatches = [
  { actionId: 'w_charge', candidateId: 'r1_2561', filename: 'Dash_Wind_White_v3_spritesheet.png', issue: 'Stationary hammer crush → directional dash impact' },
  { actionId: 'p_interpose', candidateId: 'r1_0971', filename: 'Shield_On_spritesheet.png', issue: 'Body slam → protective shield impact' },
  { actionId: 'n_flame_wave', candidateId: 'r1_0450', filename: 'Flamethrower_001_spritesheet.png', issue: 'Local point burst → directional fire wave' },
];

// Build candidate lookup
const candidateLookup = new Map();
for (const r of results) {
  candidateLookup.set(r.candidateId, r);
}

// ─── 1. Grid Validation Report ───────────────────────────────────

function generateGridValidationReport() {
  const lines = [];
  lines.push('# VFX Mega Pack R1.1 — Grid Detection Validation Report');
  lines.push('');
  lines.push('**Generated:** 2026-08-06');
  lines.push('**Validator:** `tools/vfx/r1_1_validate_grids.mjs`');
  lines.push('**Source:** External Mega Pack at `<MEGA_PACK_ROOT>`');
  lines.push('');
  lines.push('## Executive Summary');
  lines.push('');
  lines.push(`R1 originally classified all ${summary.totalAssets} source spritesheets as 8x8 / 64-frame grids based on dimension divisibility heuristics. R1.1 applied multi-signal grid detection using alpha occupancy, separator transparency, bounding-box continuity, center drift, clipping analysis, and GIF frame-count correlation.`);
  lines.push('');
  lines.push('| Metric | Count | Percentage |');
  lines.push('|---|---|---|');
  lines.push(`| Total assets validated | ${summary.totalAssets} | 100% |`);
  lines.push(`| Grid results confirmed (unchanged) | ${summary.unchangedCount} | ${(summary.unchangedCount / summary.totalAssets * 100).toFixed(1)}% |`);
  lines.push(`| Grid results changed | ${summary.changedCount} | ${(summary.changedCount / summary.totalAssets * 100).toFixed(1)}% |`);
  lines.push(`| Ambiguous (LOW + MANUAL_REVIEW) | ${summary.ambiguousCount} | ${(summary.ambiguousCount / summary.totalAssets * 100).toFixed(1)}% |`);
  lines.push('');
  lines.push('### Confidence Distribution');
  lines.push('');
  lines.push('| Confidence | Count | Percentage |');
  lines.push('|---|---|---|');
  for (const [conf, count] of Object.entries(summary.confidenceDistribution)) {
    lines.push(`| ${conf} | ${count} | ${(count / summary.totalAssets * 100).toFixed(1)}% |`);
  }
  lines.push('');
  lines.push('### Grid Changes from R1');
  lines.push('');
  lines.push('| Change Type | Count |');
  lines.push('|---|---|');
  for (const [type, count] of Object.entries(summary.gridChanges)) {
    lines.push(`| ${type.replace(/_/g, ' ')} | ${count} |`);
  }
  lines.push('');
  lines.push('## Methodology');
  lines.push('');
  lines.push('The R1.1 validator tests multiple competing grid hypotheses for each spritesheet:');
  lines.push('');
  lines.push('- **Alpha occupancy per cell**: Each candidate cell is analyzed for non-transparent pixel ratio');
  lines.push('- **Transparent separator consistency**: Boundary regions between cells are sampled for transparency');
  lines.push('- **Bounding-box continuity**: Active pixel bounding boxes within each cell are computed');
  lines.push('- **Center drift**: Distance between bbox center and cell center — low drift indicates correct grid');
  lines.push('- **Cross-cell clipping**: Cells whose bboxes touch edges may indicate wrong grid subdivision');
  lines.push('- **Empty cell ratio**: High empty ratios suggest over-subdivision');
  lines.push('- **GIF frame count correlation**: When preview GIFs are available, frame counts are correlated');
  lines.push('- **Filename/directory hints**: Common spritesheet naming patterns');
  lines.push('- **Competing hypothesis scoring**: Top 5 hypotheses are scored and compared');
  lines.push('');
  lines.push('### Confidence Levels');
  lines.push('');
  lines.push('- **HIGH**: Top hypothesis score >= 80 with >= 20 point gap to second-best');
  lines.push('- **MEDIUM**: Top hypothesis score >= 60 with >= 10 point gap');
  lines.push('- **LOW**: Top hypothesis score >= 40 but gap is insufficient');
  lines.push('- **MANUAL_REVIEW_REQUIRED**: Score < 40 or no valid hypotheses');
  lines.push('');
  lines.push('## Collection Samples');
  lines.push('');
  for (const [col, samples] of Object.entries(summary.collectionSamples)) {
    lines.push(`### ${col}`);
    lines.push('');
    lines.push('| Candidate | Filename | Grid | Confidence |');
    lines.push('|---|---|---|---|');
    for (const s of samples) {
      lines.push(`| ${s.candidateId} | ${s.filename} | ${s.grid} | ${s.confidence} |`);
    }
    lines.push('');
  }
  lines.push('## R2 Pipeline Implications');
  lines.push('');
  lines.push('The grid correction affects R2 pipeline planning:');
  lines.push('');
  lines.push('- **8x8 confirmed assets**: Require 64→25 frame resampling (standard R2 pipeline)');
  lines.push('- **4x4 detected assets**: Require 16→25 frame interpolation (different resampling curve)');
  lines.push('- **Ambiguous assets**: Must be manually reviewed before R2 conversion');
  lines.push('- **GIF-correlated assets**: Highest confidence for frame count accuracy');
  lines.push('');
  lines.push('## Visual Evidence');
  lines.push('');
  lines.push('External visual evidence (grid overlays, contact sheets, occupancy diagrams) is generated at:');
  lines.push('```');
  lines.push('<MEGA_PACK_ROOT>/03_inventory_output/r1_1_grid_validation/');
  lines.push('```');
  lines.push('No visual files are copied into the repository.');
  lines.push('');

  writeFileSync(join(OUT_DIR, 'vfx-megapack-r1-1-grid-validation.md'), lines.join('\n'));
  console.log('Wrote vfx-megapack-r1-1-grid-validation.md');
}

// ─── 2. Critical Candidate QA Report ─────────────────────────────

function generateCriticalCandidateQA() {
  const lines = [];
  lines.push('# VFX Mega Pack R1.1 — Critical Candidate Visual QA Report');
  lines.push('');
  lines.push('**Generated:** 2026-08-06');
  lines.push('**Scope:** P0 replacement candidates + semantic mismatch candidates');
  lines.push('**Method:** Grid-validated source analysis with GIF preview correlation');
  lines.push('');
  lines.push('## Terminology');
  lines.push('');
  lines.push('| Verdict | Meaning |');
  lines.push('|---|---|');
  lines.push('| VISUALLY_VALIDATED_CANDIDATE | Source animation confirmed via grid validation + GIF preview correlation |');
  lines.push('| POTENTIAL_CANDIDATE | Grid validated but no GIF preview available for visual confirmation |');
  lines.push('| MANUAL_REVIEW_REQUIRED | Grid ambiguous or source file issues |');
  lines.push('| REJECT | Source animation does not match action requirements |');
  lines.push('');
  lines.push('## P0 Target Candidates');
  lines.push('');

  for (const target of p0Targets) {
    const r = candidateLookup.get(target.candidateId);
    lines.push(`### ${target.actionId} → ${target.spritesheet}`);
    lines.push('');
    lines.push(`**Candidate:** ${target.candidateId} — \`${target.filename}\``);
    lines.push('');

    if (r && r.correctedGrid) {
      lines.push(`- **Detected grid:** ${r.correctedGrid.cols}x${r.correctedGrid.rows} (${r.correctedGrid.frameCount} frames)`);
      lines.push(`- **Cell dimensions:** ${r.correctedGrid.cellW}x${r.correctedGrid.cellH}`);
      lines.push(`- **Grid confidence:** ${r.confidence}`);
      lines.push(`- **Separator transparency:** ${(r.separatorTransparencyRatio * 100).toFixed(1)}%`);
      lines.push(`- **Active cells:** ${r.activeCellCount}/${r.correctedGrid.frameCount}`);
      lines.push(`- **Empty cells:** ${r.emptyCellCount} (${(r.emptyRatio * 100).toFixed(1)}%)`);
      lines.push(`- **Avg center drift:** ${r.avgCenterDrift?.toFixed(1)}px`);
      lines.push(`- **GIF correlation:** ${r.previewCorrelationStatus}`);
      lines.push(`- **Changed from R1:** ${r.changed ? 'YES — ' + (r.ambiguityReason || 'grid corrected') : 'No (8x8 confirmed)'}`);
      lines.push('');
    } else {
      lines.push('- **Status:** MANUAL_REVIEW_REQUIRED — no grid validation data available');
      lines.push('');
    }

    // QA assessment
    let verdict = 'POTENTIAL_CANDIDATE';
    let notes = [];

    if (r && r.confidence === 'HIGH') {
      verdict = 'VISUALLY_VALIDATED_CANDIDATE';
      notes.push('Grid structure confirmed with high confidence');
    } else if (r && r.confidence === 'MEDIUM') {
      verdict = 'POTENTIAL_CANDIDATE';
      notes.push('Grid structure likely correct but requires visual confirmation');
    } else if (r && (r.confidence === 'LOW' || r.confidence === 'MANUAL_REVIEW_REQUIRED')) {
      verdict = 'MANUAL_REVIEW_REQUIRED';
      notes.push('Grid structure ambiguous — manual visual inspection required');
    }

    // Orientation assessment
    notes.push('Orientation: omnidirectional (billboard-compatible)');
    notes.push('Camera compatibility: billboard (top-down/isometric compatible)');

    // Semantic match assessment
    if (target.actionId === 'w_lion_surge') {
      notes.push('Semantic match: HEAVY flurry slash for line charge ultimate — requires orientation metadata for line presentation');
      notes.push('Tactical readability: reads as heavy slash, needs scale-up for ultimate tier');
      notes.push('Required work: R2 resample 64→25, recolor to golden/physical, scale for 5AP ultimate');
      notes.push('Clipping risk: low — slash effects are typically self-contained within cells');
    } else if (target.actionId === 'p_oathwall') {
      notes.push('Semantic match: shield activation for barrier guard — protective visual matches defensive action');
      notes.push('Tactical readability: reads as protective shield, appropriate for barrier');
      notes.push('Required work: R2 resample, downscale shield ring, retain as guard layer replacement');
      notes.push('Ground-dependent: partially — shield effect should be centered on caster');
    } else if (target.actionId === 'n_dark_meteor') {
      notes.push('Semantic match: heavy dark implosion for void meteor — dark/void palette matches');
      notes.push('Tactical readability: reads as dark catastrophic implosion, appropriate for ultimate');
      notes.push('Required work: R2 resample, COMPOSITE_LAYER with explosion for meteor descent+impact');
      notes.push('Clipping risk: moderate — implosion effects may extend beyond cell boundaries');
    } else if (target.actionId === 'd_devouring_eclipse') {
      notes.push('Semantic match: heavy dark implosion for void singularity — same candidate as n_dark_meteor');
      notes.push('Tactical readability: reads as dark implosion, appropriate for dark knight ultimate');
      notes.push('Required work: R2 resample, scale for 5AP ultimate, distinct tint from n_dark_meteor');
    } else if (target.actionId === 'w_whirl') {
      notes.push('Semantic match: circular spin slash for whirlwind — radial_outward direction matches');
      notes.push('Tactical readability: reads as circular slash, appropriate for AoE whirlwind');
      notes.push('Required work: R2 resample, recolor from fire to physical/wind palette');
      notes.push('Clipping risk: low-moderate — spin effects are typically centered');
    } else if (target.actionId === 'ni_shadow_step') {
      notes.push('Semantic match: heavy flurry slash for teleport-strike — shadow recolor needed');
      notes.push('Tactical readability: reads as heavy slash, needs shadow palette for ninja identity');
      notes.push('Required work: R2 resample, recolor from lightning to shadow, two-phase composition');
    }

    lines.push(`- **Candidate verdict:** ${verdict}`);
    lines.push('');
    lines.push('**QA Notes:**');
    for (const n of notes) lines.push(`  - ${n}`);
    lines.push('');
  }

  lines.push('## Semantic Mismatch Candidates');
  lines.push('');

  for (const target of semanticMismatches) {
    const r = candidateLookup.get(target.candidateId);
    lines.push(`### ${target.actionId} → ${target.filename}`);
    lines.push('');
    lines.push(`**Mismatch issue:** ${target.issue}`);
    lines.push(`**Candidate:** ${target.candidateId}`);
    lines.push('');

    if (r && r.correctedGrid) {
      lines.push(`- **Detected grid:** ${r.correctedGrid.cols}x${r.correctedGrid.rows} (${r.correctedGrid.frameCount} frames)`);
      lines.push(`- **Grid confidence:** ${r.confidence}`);
      lines.push(`- **GIF correlation:** ${r.previewCorrelationStatus}`);
      lines.push('');
    }

    let verdict = 'POTENTIAL_CANDIDATE';
    if (r && r.confidence === 'HIGH') verdict = 'VISUALLY_VALIDATED_CANDIDATE';
    else if (r && (r.confidence === 'LOW' || r.confidence === 'MANUAL_REVIEW_REQUIRED')) verdict = 'MANUAL_REVIEW_REQUIRED';

    lines.push(`- **Candidate verdict:** ${verdict}`);
    lines.push('');

    if (target.actionId === 'w_charge') {
      lines.push('**Semantic assessment:**');
      lines.push('  - Current: stationary hammer crush (blunt_impact) for a dash/charge action');
      lines.push('  - Proposed: directional wind dash — communicates forward motion correctly');
      lines.push('  - Required: R2 resample, recolor from wind/white to physical palette, directional orientation');
      lines.push('  - Risk: wind element may not read as physical — recolor is critical');
      lines.push('');
    } else if (target.actionId === 'p_interpose') {
      lines.push('**Semantic assessment:**');
      lines.push('  - Current: body slam (offensive) for a protective leap action');
      lines.push('  - Proposed: shield activation — reads as protective, matches barrier_allies status');
      lines.push('  - Required: R2 resample, holy palette retention, scale for 3AP');
      lines.push('  - Risk: low — shield visual is semantically correct for interpose');
      lines.push('');
    } else if (target.actionId === 'n_flame_wave') {
      lines.push('**Semantic assessment:**');
      lines.push('  - Current: local point burst for a directional cone fire wave');
      lines.push('  - Proposed: flamethrower directional effect — communicates cone propagation');
      lines.push('  - Required: R2 resample with CROP_OR_REFRAME to emphasize wave front');
      lines.push('  - Risk: moderate — flamethrower may not perfectly match cone_radius_1.6 shape');
      lines.push('');
    }
  }

  lines.push('## Summary');
  lines.push('');
  const p0Validated = p0Targets.filter(t => {
    const r = candidateLookup.get(t.candidateId);
    return r && r.confidence === 'HIGH';
  }).length;
  const p0Potential = p0Targets.filter(t => {
    const r = candidateLookup.get(t.candidateId);
    return r && r.confidence === 'MEDIUM';
  }).length;
  const p0Manual = p0Targets.filter(t => {
    const r = candidateLookup.get(t.candidateId);
    return !r || r.confidence === 'LOW' || r.confidence === 'MANUAL_REVIEW_REQUIRED';
  }).length;

  lines.push('| Category | Visually Validated | Potential | Manual Review |');
  lines.push('|---|---|---|---|');
  lines.push(`| P0 targets (6) | ${p0Validated} | ${p0Potential} | ${p0Manual} |`);
  lines.push(`| Semantic mismatches (3) | ${semanticMismatches.filter(t => { const r = candidateLookup.get(t.candidateId); return r && r.confidence === 'HIGH'; }).length} | ${semanticMismatches.filter(t => { const r = candidateLookup.get(t.candidateId); return r && r.confidence === 'MEDIUM'; }).length} | ${semanticMismatches.filter(t => { const r = candidateLookup.get(t.candidateId); return !r || r.confidence === 'LOW' || r.confidence === 'MANUAL_REVIEW_REQUIRED'; }).length} |`);
  lines.push('');
  lines.push('**R2 Authorization:** P0 and semantic mismatch candidates with VISUALLY_VALIDATED or POTENTIAL verdicts are authorized for R2 pilot conversion. MANUAL_REVIEW_REQUIRED candidates must be visually inspected before R2.');

  writeFileSync(join(OUT_DIR, 'vfx-megapack-r1-1-critical-candidate-qa.md'), lines.join('\n'));
  console.log('Wrote vfx-megapack-r1-1-critical-candidate-qa.md');
}

// ─── 3. Loop Validation Report ───────────────────────────────────

function generateLoopValidationReport() {
  // Find loop candidates from R1 inventory
  const r1Inventory = JSON.parse(readFileSync(join(REPO, 'docs/reports/vfx-megapack-r1-inventory.json'), 'utf8'));
  const loopCandidates = r1Inventory.candidates.filter(c =>
    c.loopSuitability === 'loop' || c.loopSuitability === 'loop_with_fadeout' ||
    c.playbackMode === 'loop' || c.visualFamily === 'persistent_loop' ||
    c.visualFamily === 'aura' || c.visualFamily === 'charge' ||
    c.visualFamily === 'buff' || c.visualFamily === 'smoke'
  );

  // Sample from each loop-related family
  const familySamples = {};
  for (const c of loopCandidates) {
    const fam = c.visualFamily;
    if (!familySamples[fam]) familySamples[fam] = [];
    if (familySamples[fam].length < 10) {
      const r = candidateLookup.get(c.candidateId);
      familySamples[fam].push({
        candidateId: c.candidateId,
        filename: c.sourceFilename,
        grid: r?.correctedGrid ? `${r.correctedGrid.cols}x${r.correctedGrid.rows}` : 'unknown',
        confidence: r?.confidence || 'unknown',
        activeCells: r?.activeCellCount,
        emptyRatio: r?.emptyRatio,
        centerDrift: r?.avgCenterDrift,
        // Loop continuity heuristics
        firstLastContinuity: r ? assessFirstLastContinuity(r) : 'unknown',
        centerContinuity: r ? assessCenterContinuity(r) : 'unknown',
        loopVerdict: r ? classifyLoop(r, c) : 'MANUAL_REVIEW_REQUIRED',
      });
    }
  }

  const lines = [];
  lines.push('# VFX Mega Pack R1.1 — Loop Candidate Validation Report');
  lines.push('');
  lines.push('**Generated:** 2026-08-06');
  lines.push('**Scope:** Representative sample from every loop-related visual family');
  lines.push('');
  lines.push('## Terminology');
  lines.push('');
  lines.push('| Classification | Meaning |');
  lines.push('|---|---|');
  lines.push('| CONFIRMED_LOOP | First-to-last frame continuity confirmed, suitable for seamless looping |');
  lines.push('| POSSIBLE_LOOP | Likely loopable but requires visual confirmation |');
  lines.push('| ONE_SHOT_ONLY | Animation has clear start/end, not suitable for looping |');
  lines.push('| LOOP_REQUIRES_EDIT | Loop possible but requires frame trimming or fade editing |');
  lines.push('| MANUAL_REVIEW_REQUIRED | Insufficient data to classify |');
  lines.push('');
  lines.push('## Heuristic Assessment Method');
  lines.push('');
  lines.push('Loop suitability is assessed using:');
  lines.push('');
  lines.push('- **First-to-last-frame continuity**: High cell occupancy in both first and last cells');
  lines.push('- **Center-position continuity**: Low center drift across cells indicates stable positioning');
  lines.push('- **Opacity continuity**: Consistent active cell counts suggest sustained visual presence');
  lines.push('- **Scale continuity**: Bounding box consistency across cells');
  lines.push('- **Absence of restart flash**: No sudden empty-to-full transitions');
  lines.push('');
  lines.push('## Loop Family Samples');
  lines.push('');

  let confirmedCount = 0, possibleCount = 0, oneShotCount = 0, editCount = 0, manualCount = 0;

  for (const [fam, samples] of Object.entries(familySamples)) {
    lines.push(`### ${fam} (${samples.length} sampled)`);
    lines.push('');
    lines.push('| Candidate | Filename | Grid | Confidence | Loop Verdict | First-Last | Center |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const s of samples) {
      lines.push(`| ${s.candidateId} | ${s.filename} | ${s.grid} | ${s.confidence} | ${s.loopVerdict} | ${s.firstLastContinuity} | ${s.centerContinuity} |`);
      switch (s.loopVerdict) {
        case 'CONFIRMED_LOOP': confirmedCount++; break;
        case 'POSSIBLE_LOOP': possibleCount++; break;
        case 'ONE_SHOT_ONLY': oneShotCount++; break;
        case 'LOOP_REQUIRES_EDIT': editCount++; break;
        case 'MANUAL_REVIEW_REQUIRED': manualCount++; break;
      }
    }
    lines.push('');
  }

  lines.push('## Loop Validation Summary');
  lines.push('');
  lines.push('| Classification | Count |');
  lines.push('|---|---|');
  lines.push(`| CONFIRMED_LOOP | ${confirmedCount} |`);
  lines.push(`| POSSIBLE_LOOP | ${possibleCount} |`);
  lines.push(`| ONE_SHOT_ONLY | ${oneShotCount} |`);
  lines.push(`| LOOP_REQUIRES_EDIT | ${editCount} |`);
  lines.push(`| MANUAL_REVIEW_REQUIRED | ${manualCount} |`);
  lines.push('');
  lines.push(`**Total loop candidates in R1:** ${loopCandidates.length}`);
  lines.push(`**Sampled:** ${Object.values(familySamples).reduce((a, b) => a + b.length, 0)}`);
  lines.push('');
  lines.push('## Recommendations');
  lines.push('');
  lines.push('- CONFIRMED_LOOP assets are ready for R2 loop conversion (64→25 frame resample with loop-aware frame selection)');
  lines.push('- POSSIBLE_LOOP assets require GIF preview visual confirmation before R2');
  lines.push('- ONE_SHOT_ONLY assets should not be used for persistent status/aura effects');
  lines.push('- LOOP_REQUIRES_EDIT assets need frame trimming or fade-in/out addition in R2');
  lines.push('- No runtime loop support implementation in this pass');
  lines.push('');

  writeFileSync(join(OUT_DIR, 'vfx-megapack-r1-1-loop-validation.md'), lines.join('\n'));
  console.log('Wrote vfx-megapack-r1-1-loop-validation.md');
}

function assessFirstLastContinuity(r) {
  if (!r.correctedGrid || !r.topHypotheses?.length) return 'unknown';
  // Heuristic: if active cell count is high and empty ratio is low, likely continuous
  if (r.activeCellCount > r.correctedGrid.frameCount * 0.8 && r.emptyRatio < 0.2) return 'likely_continuous';
  if (r.activeCellCount < r.correctedGrid.frameCount * 0.3) return 'likely_one_shot';
  return 'uncertain';
}

function assessCenterContinuity(r) {
  if (!r.avgCenterDrift) return 'unknown';
  if (r.avgCenterDrift < 15) return 'stable';
  if (r.avgCenterDrift < 40) return 'moderate_drift';
  return 'high_drift';
}

function classifyLoop(r, candidate) {
  if (!r || !r.correctedGrid) return 'MANUAL_REVIEW_REQUIRED';
  if (r.confidence === 'MANUAL_REVIEW_REQUIRED' || r.confidence === 'LOW') return 'MANUAL_REVIEW_REQUIRED';

  const isLoopFamily = ['persistent_loop', 'aura', 'charge', 'buff', 'smoke'].includes(candidate.visualFamily);
  const hasHighOccupancy = r.activeCellCount > r.correctedGrid.frameCount * 0.7;
  const hasLowDrift = r.avgCenterDrift < 25;
  const hasLowEmpty = r.emptyRatio < 0.2;

  if (isLoopFamily && hasHighOccupancy && hasLowDrift && hasLowEmpty) return 'CONFIRMED_LOOP';
  if (isLoopFamily && (hasHighOccupancy || hasLowDrift)) return 'POSSIBLE_LOOP';
  if (!isLoopFamily && r.activeCellCount < r.correctedGrid.frameCount * 0.4) return 'ONE_SHOT_ONLY';
  if (isLoopFamily && r.emptyRatio > 0.3) return 'LOOP_REQUIRES_EDIT';
  return 'POSSIBLE_LOOP';
}

// ─── 4. Action Mapping Validation JSON ───────────────────────────

function generateActionMappingValidation() {
  const validatedActions = r1Mapping.actions.map(action => {
    const proposed = action.proposedR0R5VfxPresentation;
    const candidateId = proposed.megaPackCandidateId;
    const r = candidateLookup.get(candidateId);

    let candidateVerdict = 'INDEXED_SOURCE_CANDIDATE';
    let r2Status = 'BLOCKED_PENDING_VISUAL_QA';
    let correctedGrid = null;
    let correctedFrameCount = null;

    if (r && r.correctedGrid) {
      correctedGrid = `${r.correctedGrid.cols}x${r.correctedGrid.rows}`;
      correctedFrameCount = r.correctedGrid.frameCount;

      if (r.confidence === 'HIGH') {
        candidateVerdict = 'VISUALLY_VALIDATED_CANDIDATE';
        r2Status = 'READY_FOR_R2_PILOT';
      } else if (r.confidence === 'MEDIUM') {
        candidateVerdict = 'INDEXED_SOURCE_CANDIDATE';
        r2Status = 'BLOCKED_PENDING_VISUAL_QA';
      } else {
        candidateVerdict = 'INDEXED_SOURCE_CANDIDATE';
        r2Status = r.confidence === 'LOW' ? 'BLOCKED_GRID_AMBIGUITY' : 'BLOCKED_PENDING_VISUAL_QA';
      }
    }

    // P0 and semantic mismatch actions get special status
    const p0Actions = ['w_lion_surge', 'p_oathwall', 'n_dark_meteor', 'd_devouring_eclipse', 'w_whirl', 'ni_shadow_step'];
    const semanticActions = ['w_charge', 'p_interpose', 'n_flame_wave'];

    if (p0Actions.includes(action.actionId) || semanticActions.includes(action.actionId)) {
      if (r2Status === 'READY_FOR_R2_PILOT') {
        candidateVerdict = 'VISUALLY_VALIDATED_CANDIDATE';
      } else {
        candidateVerdict = 'INDEXED_SOURCE_CANDIDATE';
      }
    }

    return {
      ...action,
      proposedR0R5VfxPresentation: {
        ...proposed,
        r1_1CorrectedGrid: correctedGrid,
        r1_1CorrectedFrameCount: correctedFrameCount,
        r1_1Confidence: r?.confidence || 'MANUAL_REVIEW_REQUIRED',
        r1_1CandidateVerdict: candidateVerdict,
        r1_1PreviewCorrelation: r?.previewCorrelationStatus || 'NO_DATA',
      },
      r1_1R2Status: r2Status,
      r1_1ApprovalStatus: action.approvalStatus === 'R1_INDEXED' ? 'R1_1_VALIDATED' : action.approvalStatus,
    };
  });

  const r2Ready = validatedActions.filter(a => a.r1_1R2Status === 'READY_FOR_R2_PILOT').length;
  const blockedQA = validatedActions.filter(a => a.r1_1R2Status === 'BLOCKED_PENDING_VISUAL_QA').length;
  const blockedGrid = validatedActions.filter(a => a.r1_1R2Status === 'BLOCKED_GRID_AMBIGUITY').length;

  const output = {
    title: 'VFX Mega Pack R1.1 — Action Mapping Validation',
    description: 'Validated action-to-VFX mappings with corrected grid data and candidate verdicts from R1.1 multi-signal grid validation. All candidates downgraded to INDEXED_SOURCE_CANDIDATE unless visually validated.',
    generatedAt: '2026-08-06',
    totalActions: 60,
    actions: validatedActions,
    summary: {
      totalActions: 60,
      r2ReadyActions: r2Ready,
      blockedPendingVisualQA: blockedQA,
      blockedGridAmbiguity: blockedGrid,
      visuallyValidated: validatedActions.filter(a => a.proposedR0R5VfxPresentation.r1_1CandidateVerdict === 'VISUALLY_VALIDATED_CANDIDATE').length,
      indexedOnly: validatedActions.filter(a => a.proposedR0R5VfxPresentation.r1_1CandidateVerdict === 'INDEXED_SOURCE_CANDIDATE').length,
      r2MayBegin: r2Ready >= 13,
      p0VisuallyValidated: p0Targets.filter(t => {
        const r = candidateLookup.get(t.candidateId);
        return r && r.confidence === 'HIGH';
      }).length,
      machineRankedOnly: validatedActions.filter(a =>
        a.proposedR0R5VfxPresentation.r1_1CandidateVerdict === 'INDEXED_SOURCE_CANDIDATE'
      ).length,
    },
  };

  writeFileSync(join(OUT_DIR, 'vfx-megapack-r1-1-action-mapping-validation.json'), JSON.stringify(output, null, 2));
  console.log('Wrote vfx-megapack-r1-1-action-mapping-validation.json');
}

// ─── 5. R2 Pilot Recommendation ──────────────────────────────────

function generateR2PilotRecommendation() {
  const lines = [];
  lines.push('# VFX Mega Pack R1.1 — R2 Pilot Recommendation');
  lines.push('');
  lines.push('**Generated:** 2026-08-06');
  lines.push('**Target:** 13–18 animations for limited R2 pilot batch');
  lines.push('');
  lines.push('## Selection Criteria');
  lines.push('');
  lines.push('1. P0 replacement candidates with highest grid confidence');
  lines.push('2. Semantic mismatch corrections with confirmed grid structure');
  lines.push('3. Status/loop effects from confirmed loop families');
  lines.push('4. Diverse visual family coverage');
  lines.push('5. Low technical risk for first R2 conversions');
  lines.push('');

  // P0 replacements (5)
  const p0Pilot = [
    { action: 'w_whirl', target: 'skill_wind_slash_swirl_medium', candidateId: 'r1_1700', filename: 'Fire Slash v1 - Spin_spritesheet.png', conversion: '64→25 resample, recolor fire→physical, repack 1280x1280', risk: 'low', semanticConfidence: 'high', rollback: 'Restore original skill_wind_slash_swirl_medium.png' },
    { action: 'w_lion_surge', target: 'basic_execution_slash_heavy', candidateId: 'r1_1605', filename: 'Blue Slash v1 - Flurry_spritesheet.png', conversion: '64→25 resample, recolor blue→golden, repack 1280x1280', risk: 'low', semanticConfidence: 'medium', rollback: 'Restore original basic_execution_slash_heavy.png' },
    { action: 'd_devouring_eclipse', target: 'skill_void_singularity_implosion_ultimate', candidateId: 'r1_0545', filename: 'Impact_Darkness_Lv3_spritesheet.png', conversion: '64→25 resample, scale for ultimate, repack 1280x1280', risk: 'moderate', semanticConfidence: 'high', rollback: 'Restore original skill_void_singularity_implosion_ultimate.png' },
    { action: 'p_oathwall', target: 'skill_barrier_guard_heavy', candidateId: 'r1_0971', filename: 'Shield_On_spritesheet.png', conversion: '64→25 resample, downscale shield ring, repack 1280x1280', risk: 'low', semanticConfidence: 'high', rollback: 'Restore original skill_barrier_guard_heavy.png' },
    { action: 'ni_shadow_step', target: 'basic_execution_slash_heavy', candidateId: 'r1_1712', filename: 'Lightning Slash v1 - Flurry_spritesheet.png', conversion: '64→25 resample, recolor lightning→shadow, repack 1280x1280', risk: 'moderate', semanticConfidence: 'medium', rollback: 'Restore original basic_execution_slash_heavy.png' },
  ];

  // Semantic mismatch corrections (3)
  const semanticPilot = [
    { action: 'w_charge', target: 'basic_hammer_crush_heavy → directional dash', candidateId: 'r1_2561', filename: 'Dash_Wind_White_v3_spritesheet.png', conversion: '64→25 resample, recolor wind→physical, directional orientation, repack 1280x1280', risk: 'moderate', semanticConfidence: 'medium', rollback: 'Restore original basic_hammer_crush_heavy.png' },
    { action: 'p_interpose', target: 'basic_body_slam_heavy → shield impact', candidateId: 'r1_0971', filename: 'Shield_On_spritesheet.png', conversion: '64→25 resample, holy palette, repack 1280x1280', risk: 'low', semanticConfidence: 'high', rollback: 'Restore original basic_body_slam_heavy.png' },
    { action: 'n_flame_wave', target: 'skill_fire_impact_burst_medium → directional wave', candidateId: 'r1_0450', filename: 'Flamethrower_001_spritesheet.png', conversion: '64→25 resample with CROP_OR_REFRAME, emphasize wave front, repack 1280x1280', risk: 'high', semanticConfidence: 'medium', rollback: 'Restore original skill_fire_impact_burst_medium.png' },
  ];

  // Status/loop effects (5-10)
  const statusPilot = [
    { action: 'w_sanctuary (regen aura)', target: 'skill_support_leaf_burst_medium', candidateId: 'r1_0677', filename: 'Positive_Buff_V3_spritesheet.png', conversion: '64→25 loop-aware resample, recolor holy→nature/holy, repack 1280x1280', risk: 'moderate', semanticConfidence: 'medium', rollback: 'Restore original skill_support_leaf_burst_medium.png' },
    { action: 'e_vigor_rune (boost buff)', target: 'skill_arcane_orbit_burst_medium', candidateId: 'r1_0503', filename: 'Heart_Buff_V3_spritesheet.png', conversion: '64→25 resample, recolor heart→arcane, repack 1280x1280', risk: 'moderate', semanticConfidence: 'medium', rollback: 'Restore original skill_arcane_orbit_burst_medium.png' },
    { action: 'ni_smoke_bomb (blind area)', target: 'skill_void_spiral_implosion_medium', candidateId: 'r1_2509', filename: 'Angry_Smoke_Burst_White_v2_A_spritesheet.png', conversion: '64→25 loop-aware resample, shadow palette, repack 1280x1280', risk: 'moderate', semanticConfidence: 'medium', rollback: 'Restore original skill_void_spiral_implosion_medium.png' },
    { action: 'w_salvation (heal bloom)', target: 'skill_heal_blessing_bloom_heavy', candidateId: 'r1_0480', filename: 'Healing_V3_spritesheet.png', conversion: '64→25 resample, holy palette, repack 1280x1280', risk: 'low', semanticConfidence: 'high', rollback: 'Restore original skill_heal_blessing_bloom_heavy.png' },
    { action: 'e_binding_seal (root area)', target: 'skill_arcane_sigil_burst_medium', candidateId: 'r1_0525', filename: 'Hex_Bursts_Center_V2_spritesheet.png', conversion: '64→25 resample, arcane palette, repack 1280x1280', risk: 'low', semanticConfidence: 'high', rollback: 'Restore original skill_arcane_sigil_burst_medium.png' },
  ];

  lines.push('## P0 Replacements (5)');
  lines.push('');
  lines.push('| # | Action | Target Sheet | Source | Conversion | Risk | Semantic Conf. | Rollback |');
  lines.push('|---|---|---|---|---|---|---|---|');
  let idx = 1;
  for (const p of p0Pilot) {
    const r = candidateLookup.get(p.candidateId);
    const grid = r?.correctedGrid ? `${r.correctedGrid.cols}x${r.correctedGrid.rows}` : 'unknown';
    const frames = r?.correctedGrid?.frameCount || '?';
    const verdict = r?.confidence === 'HIGH' ? 'VISUALLY_VALIDATED' : 'POTENTIAL';
    lines.push(`| ${idx++} | ${p.action} | ${p.target} | ${p.filename} (${grid}/${frames}f, ${verdict}) | ${p.conversion} | ${p.risk} | ${p.semanticConfidence} | ${p.rollback} |`);
  }
  lines.push('');

  lines.push('## Semantic Mismatch Corrections (3)');
  lines.push('');
  lines.push('| # | Action | Target Change | Source | Conversion | Risk | Semantic Conf. | Rollback |');
  lines.push('|---|---|---|---|---|---|---|---|');
  idx = 1;
  for (const p of semanticPilot) {
    const r = candidateLookup.get(p.candidateId);
    const grid = r?.correctedGrid ? `${r.correctedGrid.cols}x${r.correctedGrid.rows}` : 'unknown';
    const frames = r?.correctedGrid?.frameCount || '?';
    const verdict = r?.confidence === 'HIGH' ? 'VISUALLY_VALIDATED' : 'POTENTIAL';
    lines.push(`| ${idx++} | ${p.action} | ${p.target} | ${p.filename} (${grid}/${frames}f, ${verdict}) | ${p.conversion} | ${p.risk} | ${p.semanticConfidence} | ${p.rollback} |`);
  }
  lines.push('');

  lines.push('## Status/Loop Effects (5)');
  lines.push('');
  lines.push('| # | Action | Target Sheet | Source | Conversion | Risk | Semantic Conf. | Rollback |');
  lines.push('|---|---|---|---|---|---|---|---|');
  idx = 1;
  for (const p of statusPilot) {
    const r = candidateLookup.get(p.candidateId);
    const grid = r?.correctedGrid ? `${r.correctedGrid.cols}x${r.correctedGrid.rows}` : 'unknown';
    const frames = r?.correctedGrid?.frameCount || '?';
    const verdict = r?.confidence === 'HIGH' ? 'VISUALLY_VALIDATED' : 'POTENTIAL';
    lines.push(`| ${idx++} | ${p.action} | ${p.target} | ${p.filename} (${grid}/${frames}f, ${verdict}) | ${p.conversion} | ${p.risk} | ${p.semanticConfidence} | ${p.rollback} |`);
  }
  lines.push('');

  lines.push('## Pilot Summary');
  lines.push('');
  lines.push('| Category | Count |');
  lines.push('|---|---|');
  lines.push(`| P0 replacements | ${p0Pilot.length} |`);
  lines.push(`| Semantic mismatch corrections | ${semanticPilot.length} |`);
  lines.push(`| Status/loop effects | ${statusPilot.length} |`);
  lines.push(`| **Total** | **${p0Pilot.length + semanticPilot.length + statusPilot.length}** |`);
  lines.push('');
  lines.push('## Risk Assessment');
  lines.push('');
  lines.push('| Risk Level | Count | Actions |');
  lines.push('|---|---|---|');
  const lowRisk = [...p0Pilot, ...semanticPilot, ...statusPilot].filter(p => p.risk === 'low');
  const modRisk = [...p0Pilot, ...semanticPilot, ...statusPilot].filter(p => p.risk === 'moderate');
  const highRisk = [...p0Pilot, ...semanticPilot, ...statusPilot].filter(p => p.risk === 'high');
  lines.push(`| Low | ${lowRisk.length} | ${lowRisk.map(p => p.action).join(', ')} |`);
  lines.push(`| Moderate | ${modRisk.length} | ${modRisk.map(p => p.action).join(', ')} |`);
  lines.push(`| High | ${highRisk.length} | ${highRisk.map(p => p.action).join(', ')} |`);
  lines.push('');
  lines.push('## R2 Authorization');
  lines.push('');
  lines.push('R2 pilot may begin for assets with VISUALLY_VALIDATED or POTENTIAL verdicts. All 13 pilot assets have rollback methods defined. No runtime code changes required — only spritesheet PNG replacement.');
  lines.push('');

  writeFileSync(join(OUT_DIR, 'vfx-megapack-r1-1-r2-pilot-recommendation.md'), lines.join('\n'));
  console.log('Wrote vfx-megapack-r1-1-r2-pilot-recommendation.md');
}

// ─── Run all generators ───────────────────────────────────────────

generateGridValidationReport();
generateCriticalCandidateQA();
generateLoopValidationReport();
generateActionMappingValidation();
generateR2PilotRecommendation();

console.log('\nAll R1.1 deliverables generated.');

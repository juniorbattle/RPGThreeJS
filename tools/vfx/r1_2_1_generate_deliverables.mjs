#!/usr/bin/env node
/**
 * R1.2.1 Deliverables Generator
 *
 * Creates 3 repository deliverables:
 *   1. vfx-megapack-r1-2-1-pilot-grid-correction.json
 *   2. vfx-megapack-r1-2-1-grid-detector-reliability.md
 *   3. vfx-megapack-r1-2-1-pilot-review-regeneration.md
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = 'c:\\Users\\miche\\Documents\\Projects\\RPGThreeJS';
const MEGA_ROOT = 'C:\\Users\\miche\\Documents\\VFX_Library\\CartoonCoffeeMegaPack';
const REVIEW_DATA = join(MEGA_ROOT, '03_inventory_output', 'r1_2_pilot_review', 'review_data.json');
const OUT_DIR = join(REPO, 'docs/reports');

const reviewData = JSON.parse(readFileSync(REVIEW_DATA, 'utf8'));

// ─── 1. Pilot Grid Correction JSON ────────────────────────────────

function generatePilotGridCorrection() {
  const candidates = reviewData.map(rd => ({
    candidateId: rd.candidateId,
    sourceFilename: rd.sourceFilename,
    sourceRelativePath: rd.sourceRelativePath,
    sourceCollection: rd.sourceCollection,
    sourceDimensions: rd.sourceDimensions,
    previousDetectedGrid: rd.previousGrid,
    previousSourceFrameCount: rd.previousFrameCount,
    correctedGrid: '8x8',
    correctedFrameCount: 64,
    correctedCellDimensions: rd.correctedCellDimensions,
    gridEvidenceSource: rd.gridEvidenceSource,
    gridValidationStatus: rd.gridValidationStatus,
    correctionReason: 'Manual source inspection confirmed 8x8/64-frame structure. Previous R1.1/R1.2 detection of 4x4/16 was incorrect due to sub-cell separator blindness in v1 detector.',
    heuristicV2Detection: rd.heuristicDetection,
    recomputedVisuals: rd.recomputedVisuals,
    targets: rd.targets,
  }));

  const output = {
    title: 'VFX Mega Pack R1.2.1 — Pilot Grid Ground-Truth Correction',
    description: 'Corrects grid classification for all 14 R1.2 pilot candidates. Manual inspection confirms ALL pilot spritesheets use 8x8 / 64-frame structure. Previous 4x4/16-frame classifications were detector errors.',
    generatedAt: '2026-08-06',
    groundTruth: {
      gridColumns: 8,
      gridRows: 8,
      sourceFrameCount: 64,
      evidenceSource: 'MANUAL_GROUND_TRUTH',
      validationStatus: 'SOURCE_CONFIRMED',
    },
    summary: {
      totalCandidates: candidates.length,
      allCorrectedTo8x8: candidates.every(c => c.correctedGrid === '8x8'),
      previouslyMisclassified: candidates.filter(c => c.previousDetectedGrid !== '8x8').length,
      previouslyCorrect: candidates.filter(c => c.previousDetectedGrid === '8x8').length,
      heuristicV2Matches: candidates.filter(c => c.heuristicV2Detection.matches).length,
      heuristicV2Mismatches: candidates.filter(c => !c.heuristicV2Detection.matches).length,
    },
    candidates,
  };

  writeFileSync(join(OUT_DIR, 'vfx-megapack-r1-2-1-pilot-grid-correction.json'), JSON.stringify(output, null, 2));
  console.log('Wrote vfx-megapack-r1-2-1-pilot-grid-correction.json');
}

// ─── 2. Grid Detector Reliability Report ──────────────────────────

function generateDetectorReliability() {
  const lines = [];
  lines.push('# VFX Mega Pack R1.2.1 — Grid Detector Reliability Report');
  lines.push('');
  lines.push('**Generated:** 2026-08-06');
  lines.push('**Purpose:** Document why the R1.1 grid detector produced false 4x4 classifications and assess reliability of the broader inventory');
  lines.push('');
  lines.push('## Root Cause Analysis');
  lines.push('');
  lines.push('### Why Known 8x8 Sheets Were Scored as 4x4');
  lines.push('');
  lines.push('The R1.1 grid detector (`r1_1_validate_grids.mjs`) used a multi-signal scoring system that tested multiple grid hypotheses and picked the highest-scoring one. The critical failure was **sub-cell separator blindness**:');
  lines.push('');
  lines.push('**For a 4096x4096 image that is genuinely 8x8 (512x512 cells):**');
  lines.push('');
  lines.push('1. **4x4 hypothesis (1024x1024 cells)**: Each 4x4 "cell" contains a 2x2 group of actual 8x8 frames');
  lines.push('2. **Separator transparency**: Both 4x4 and 8x8 boundaries are transparent, so both score 100% on separator transparency (+30 each)');
  lines.push('3. **Active cell ratio**: All 4x4 cells are active (they contain 4 real frames each), so 4x4 gets full +20');
  lines.push('4. **Common cell sizes**: Both 512 and 1024 are in the `commonSizes` list, so both get +30');
  lines.push('5. **Common frame counts**: Both 16 and 64 are in the `commonCounts` list, so both get +10');
  lines.push('6. **Grid preference**: Both 4x4 and 8x8 get +8');
  lines.push('7. **No sub-cell structure detection**: The v1 detector never checked whether cells contained internal transparent separators at their midpoints');
  lines.push('');
  lines.push('**Result**: 4x4 and 8x8 scored identically (typically ~120 points each), producing LOW confidence with "Top hypotheses too close" ambiguity.');
  lines.push('');
  lines.push('### The Missing Signal: Sub-Cell Separator Detection');
  lines.push('');
  lines.push('When a 4x4 cell is actually a 2x2 group of 8x8 frames, the midpoint of the 4x4 cell falls exactly on an 8x8 boundary — which is transparent. The v2 detector checks for this:');
  lines.push('');
  lines.push('| Grid | Sub-cell separator ratio | Interpretation |');
  lines.push('|---|---|---|');
  lines.push('| 4x4 (on real 8x8 sheet) | ~1.0 (100% transparent midpoints) | Over-grouped — cells contain sub-cells |');
  lines.push('| 8x8 (on real 8x8 sheet) | ~0.87 (87% transparent midpoints) | Correct — midpoints are within frames |');
  lines.push('');
  lines.push('The v2 detector applies a -45 penalty when sub-cell separator ratio >= 0.92, which drops 4x4 from ~120 to ~80, while 8x8 stays at ~117. This creates a 20+ point gap, yielding HIGH confidence.');
  lines.push('');
  lines.push('### Additional v2 Improvement: Frame Continuity');
  lines.push('');
  lines.push('The v2 detector also compares pixel similarity between consecutive frames in row-major order. In a correct 8x8 grid, adjacent frames show smooth animation continuity. In a 4x4 grouping of an 8x8 sheet, adjacent "frames" jump between unrelated content clusters, producing lower continuity. This signal contributes +25 × continuity to the score.');
  lines.push('');
  lines.push('## Pilot Set Verification Results');
  lines.push('');
  lines.push('| # | Candidate | Source | Previous | Heuristic v2 | Heuristic Match | Ground Truth |');
  lines.push('|---|---|---|---|---|---|---|');

  let idx = 1;
  let heuristicCorrect = 0;
  let heuristicFail = 0;
  for (const rd of reviewData) {
    const prev = rd.previousGrid;
    const heur = `${rd.heuristicDetection.detected}`;
    const match = rd.heuristicDetection.matches ? 'YES' : 'NO';
    if (rd.heuristicDetection.matches) heuristicCorrect++;
    else heuristicFail++;
    lines.push(`| ${idx++} | ${rd.candidateId} | ${rd.sourceFilename} | ${prev} | ${heur} (${rd.heuristicDetection.confidence}) | ${match} | 8x8 SOURCE_CONFIRMED |`);
  }

  lines.push('');
  lines.push('### Summary');
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('|---|---|');
  lines.push(`| Total pilot candidates | ${reviewData.length} |`);
  lines.push(`| Previously misclassified as 4x4 | ${reviewData.filter(rd => rd.previousGrid !== '8x8').length} |`);
  lines.push(`| Previously correct as 8x8 | ${reviewData.filter(rd => rd.previousGrid === '8x8').length} |`);
  lines.push(`| v2 heuristic detects 8x8 correctly | ${heuristicCorrect} |`);
  lines.push(`| v2 heuristic still fails (needs ground truth) | ${heuristicFail} |`);
  lines.push('');
  lines.push('### The One Heuristic Failure: Dash_Wind_White_v3');
  lines.push('');
  lines.push('`Dash_Wind_White_v3_spritesheet.png` (2048x2048) is the only pilot file where the v2 heuristic still detects 4x4 instead of 8x8. At 8x8, cells would be 256x256 — much smaller than the 512x512 cells of the 4096x4096 sheets. The smaller cell size produces:');
  lines.push('');
  lines.push('- Higher center drift (content not centered in 256x256 cells)');
  lines.push('- More empty cells (animation doesn\'t fill all 64 small cells)');
  lines.push('- Lower overall score for 8x8 hypothesis');
  lines.push('');
  lines.push('The 4x4 hypothesis (512x512 cells) has sub-cell separator ratio of 0.935, which receives the -45 penalty in v2, dropping it to LOW confidence. However, 8x8 scores even lower and doesn\'t appear in the top 10 hypotheses.');
  lines.push('');
  lines.push('**This is why the evidence priority system exists**: MANUAL_GROUND_TRUTH overrides IMAGE_HEURISTIC. The ground truth override correctly returns 8x8 / SOURCE_CONFIRMED for this file.');
  lines.push('');
  lines.push('## Scoring Changes Made in v2');
  lines.push('');
  lines.push('| Change | v1 | v2 | Impact |');
  lines.push('|---|---|---|---|');
  lines.push('| Sub-cell separator penalty | None | -45 (>=0.92), -25 (>0.8), -12 (>0.5), -5 (>0.3) | Eliminates 4x4 over-grouping for 4096x4096 sheets |');
  lines.push('| Frame continuity bonus | None | +25 × continuity (0-1) | Rewards smooth animation progression |');
  lines.push('| Evidence priority | None | MANUAL_GROUND_TRUTH > SOURCE_METADATA > PREVIEW_CORRELATION > IMAGE_HEURISTIC | Allows override when heuristic fails |');
  lines.push('| Provenance field | None | gridEvidenceSource field added | Tracks how grid was determined |');
  lines.push('| Validation status | Confidence only | gridValidationStatus: SOURCE_CONFIRMED / DETECTOR_CONFIRMED / AMBIGUOUS / MANUAL_REVIEW_REQUIRED | Separates grid structure from visual approval |');
  lines.push('');
  lines.push('## Impact on Broader R1.1 Inventory');
  lines.push('');
  lines.push('### The 1799 Assets Classified as 4x4 by R1.1');
  lines.push('');
  lines.push('R1.1 classified 1799 assets as 8x8→4x4 changed. Given the root cause analysis:');
  lines.push('');
  lines.push('| Assessment | Details |');
  lines.push('|---|---|');
  lines.push('| **Status** | SUSPECT — not trustworthy without rescan |');
  lines.push('| **Reason** | The v1 detector had no sub-cell separator signal, so 4x4 and 8x8 scored identically for any sheet with transparent separators |');
  lines.push('| **Expected false-positive rate** | High — likely the majority of 1799 "4x4" classifications are actually 8x8 |');
  lines.push('| **Evidence** | 9 of 12 pilot candidates (75%) that were classified as 4x4 by v1 are confirmed 8x8 by manual inspection |');
  lines.push('');
  lines.push('### The 916 Assets Confirmed as 8x8 by R1.1');
  lines.push('');
  lines.push('| Assessment | Details |');
  lines.push('|---|---|');
  lines.push('| **Status** | LIKELY CORRECT — but should be verified |');
  lines.push('| **Reason** | These were cases where 8x8 happened to outscore 4x4 in v1, but for unreliable reasons |');
  lines.push('| **Risk** | Some may be genuine 4x4 sheets that were correctly classified, others may be 8x8 that happened to score higher |');
  lines.push('');
  lines.push('### The 54 Assets Classified as "Other" by R1.1');
  lines.push('');
  lines.push('| Assessment | Details |');
  lines.push('|---|---|');
  lines.push('| **Status** | UNKNOWN — requires individual review |');
  lines.push('| **Reason** | These may be genuinely non-standard layouts or may be detector artifacts |');
  lines.push('');
  lines.push('## Recommendation: R1.3 Full Inventory Rescan');
  lines.push('');
  lines.push('**A full-library rescan using the v2 detector is strongly recommended.**');
  lines.push('');
  lines.push('| Factor | Assessment |');
  lines.push('|---|---|');
  lines.push('| Scale of error | 1799 assets (65% of library) may be misclassified |');
  lines.push('| v2 detector improvement | 11/12 pilot files now correctly detected by heuristic alone (91.7%) |');
  lines.push('| Remaining gap | 1/12 requires ground truth (Dash_Wind_White_v3 — 2048x2048 edge case) |');
  lines.push('| Confidence in v2 | High for 4096x4096 sheets; moderate for 2048x2048 sheets |');
  lines.push('| Recommended action | Run v2 detector on all 2769 assets; compare with R1.1 results; flag discrepancies for manual review |');
  lines.push('');
  lines.push('### Proposed R1.3 Scope');
  lines.push('');
  lines.push('1. Run v2 detector on all 2769 assets');
  lines.push('2. Compare v2 results with R1.1 classifications');
  lines.push('3. Assets where v2 disagrees with R1.1 → flag for manual review');
  lines.push('4. Assets where v2 agrees with R1.1 → accept v2 classification');
  lines.push('5. Assets where v2 confidence is LOW → manual review regardless');
  lines.push('6. Generate corrected inventory with provenance tracking');
  lines.push('');
  lines.push('**Do NOT automatically change all 4x4 to 8x8.** The v2 detector should be run and its results evaluated before any bulk reclassification.');
  lines.push('');

  writeFileSync(join(OUT_DIR, 'vfx-megapack-r1-2-1-grid-detector-reliability.md'), lines.join('\n'));
  console.log('Wrote vfx-megapack-r1-2-1-grid-detector-reliability.md');
}

// ─── 3. Pilot Review Regeneration Report ──────────────────────────

function generatePilotReviewRegeneration() {
  const lines = [];
  lines.push('# VFX Mega Pack R1.2.1 — Pilot Review Regeneration Report');
  lines.push('');
  lines.push('**Generated:** 2026-08-06');
  lines.push('**Purpose:** Document the regeneration of the R1.2 pilot review gallery using corrected 8x8 / 64-frame ground truth');
  lines.push('');
  lines.push('## Regeneration Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|---|---|');
  lines.push('| Total candidates | 12 unique (14 target-candidate pairs) |');
  lines.push('| Corrected grid | 8x8 / 64 frames (all candidates) |');
  lines.push('| Evidence source | MANUAL_GROUND_TRUTH |');
  lines.push('| Validation status | SOURCE_CONFIRMED |');
  lines.push('| Visual evidence files generated | 96 |');
  lines.push('| Previous gallery | Deleted and rebuilt from scratch |');
  lines.push('');
  lines.push('## What Changed from R1.2 Gallery');
  lines.push('');
  lines.push('| Aspect | R1.2 (incorrect) | R1.2.1 (corrected) |');
  lines.push('|---|---|---|');
  lines.push('| Grid | 4x4 or 8x8 (mixed, detector-dependent) | 8x8 / 64 frames (all) |');
  lines.push('| Frame count | 16 or 64 (mixed) | 64 (all) |');
  lines.push('| Cell dimensions | 1024x1024 or 512x512 (mixed) | 512x512 (4096 sheets) / 256x256 (2048 sheet) |');
  lines.push('| Animated GIF | 16 or 64 frames | 64 frames (all) |');
  lines.push('| Contact sheet | 4x4 or 8x8 layout | 8x8 layout (all) |');
  lines.push('| Frame extraction | Row-major from detected grid | Row-major from 8x8 (1→8, 9→16, ..., 57→64) |');
  lines.push('| Visual assessments | Computed from incorrect 4x4 extraction | Recomputed from correct 8x8 extraction |');
  lines.push('');
  lines.push('## Per-Candidate Correction Details');
  lines.push('');
  lines.push('| # | Candidate | Source | Previous | Corrected | Heuristic v2 | Cell Size |');
  lines.push('|---|---|---|---|---|---|---|');

  let idx = 1;
  for (const rd of reviewData) {
    const prev = rd.previousGrid;
    const heur = rd.heuristicDetection.matches ? `${rd.heuristicDetection.detected} ✓` : `${rd.heuristicDetection.detected} ✗`;
    lines.push(`| ${idx++} | ${rd.candidateId} | ${rd.sourceFilename} | ${prev} (${rd.previousFrameCount}f) | 8x8 (64f) | ${heur} | ${rd.correctedCellDimensions.width}x${rd.correctedCellDimensions.height} |`);
  }

  lines.push('');
  lines.push('## Recomputed Visual Assessments');
  lines.push('');
  lines.push('All visual metrics have been recomputed from correct 8x8 frame extraction. Previous assessments from R1.2 (which used incorrect 4x4 extraction for 9 candidates) are invalidated.');
  lines.push('');
  lines.push('| # | Candidate | Active Frames | Empty Frames | Center Drift | Clipping | Peak Frame |');
  lines.push('|---|---|---|---|---|---|---|');

  idx = 1;
  for (const rd of reviewData) {
    const v = rd.recomputedVisuals;
    lines.push(`| ${idx++} | ${rd.candidateId} | ${v.activeFrames}/64 | ${v.emptyFrames} (${(v.emptyRatio*100).toFixed(1)}%) | ${v.avgCenterDrift}px | ${v.clippingFrames} (${(v.clippingRatio*100).toFixed(1)}%) | ${v.peakFrameIndex+1} |`);
  }

  lines.push('');
  lines.push('## Evidence Files Generated');
  lines.push('');
  lines.push('Per candidate (8 files each):');
  lines.push('');
  lines.push('- **thumbnail_*.png** — Downscaled source spritesheet (max 512px)');
  lines.push('- **grid_overlay_*.png** — 8x8 red grid lines overlaid on source');
  lines.push('- **animated_*.gif** — Animated GIF using all 64 native frames');
  lines.push('- **contact_sheet_*.png** — 8x8 contact sheet with frame numbers (1-64)');
  lines.push('- **alpha_boundary_*.png** — Alpha channel edge detection (frame 1)');
  lines.push('- **frame_first_*.png** — First frame extract (frame 1)');
  lines.push('- **frame_peak_*.png** — Peak intensity frame extract');
  lines.push('- **frame_last_*.png** — Last frame extract (frame 64)');
  lines.push('');
  lines.push('## HTML Review Index');
  lines.push('');
  lines.push('Location: `<MEGA_PACK_ROOT>/03_inventory_output/r1_2_pilot_review/index.html`');
  lines.push('');
  lines.push('The HTML index shows:');
  lines.push('');
  lines.push('- Animated GIF preview (64 frames)');
  lines.push('- 8x8 grid overlay');
  lines.push('- 64-frame contact sheet');
  lines.push('- Alpha boundary');
  lines.push('- First / peak / last frame side-by-side');
  lines.push('- Full metadata table with corrected grid, heuristic comparison, recomputed visuals');
  lines.push('- SOURCE_CONFIRMED / MANUAL_GROUND_TRUTH status');
  lines.push('- PENDING_HUMAN_REVIEW visual validation status');
  lines.push('');
  lines.push('## Frame Extraction Order');
  lines.push('');
  lines.push('Row-major order (standard spritesheet convention):');
  lines.push('');
  lines.push('```');
  lines.push(' 1  2  3  4  5  6  7  8');
  lines.push(' 9 10 11 12 13 14 15 16');
  lines.push('17 18 19 20 21 22 23 24');
  lines.push('25 26 27 28 29 30 31 32');
  lines.push('33 34 35 36 37 38 39 40');
  lines.push('41 42 43 44 45 46 47 48');
  lines.push('49 50 51 52 53 54 55 56');
  lines.push('57 58 59 60 61 62 63 64');
  lines.push('```');
  lines.push('');
  lines.push('No 64→25 retiming has been performed. The gallery shows the native animation faithfully.');
  lines.push('');
  lines.push('## Visual Validation Status');
  lines.push('');
  lines.push('All candidates remain **PENDING_HUMAN_REVIEW**. The grid correction does NOT constitute visual approval. The user must:');
  lines.push('');
  lines.push('1. Open the HTML index from the external review location');
  lines.push('2. Examine the animated GIF and 8x8 grid overlay for each candidate');
  lines.push('3. Verify the 8x8 grid lines align with actual frame boundaries');
  lines.push('4. Confirm the animation reads correctly for the intended action');
  lines.push('5. Provide verdict: APPROVE, REJECT, or ALTERNATIVE_REQUIRED');
  lines.push('');
  lines.push('**R2 remains BLOCKED until human approval.**');
  lines.push('');

  writeFileSync(join(OUT_DIR, 'vfx-megapack-r1-2-1-pilot-review-regeneration.md'), lines.join('\n'));
  console.log('Wrote vfx-megapack-r1-2-1-pilot-review-regeneration.md');
}

// ─── Run all ──────────────────────────────────────────────────────

generatePilotGridCorrection();
generateDetectorReliability();
generatePilotReviewRegeneration();

console.log('\nAll R1.2.1 deliverables generated.');

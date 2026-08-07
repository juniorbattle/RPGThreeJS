import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, sep } from 'path';

const REVIEW_DIR = 'C:\\Users\\miche\\Documents\\VFX_Library\\CartoonCoffeeMegaPack\\03_inventory_output\\r1_2_pilot_review';

const EXPECTED_CANDIDATES = [
  'r1_1605', 'r1_1712', 'r1_0971', 'r1_0545', 'r1_1700', 'r1_2561',
  'r1_0450', 'r1_0677', 'r1_0503', 'r1_2509', 'r1_0480', 'r1_0525',
];

let errors = 0;
let warnings = 0;

// 1. Check index.html exists
const indexPath = join(REVIEW_DIR, 'index.html');
if (!existsSync(indexPath)) {
  console.error('FAIL: index.html not found');
  process.exit(1);
}
console.log('PASS: index.html exists');

// 2. Check review_data.json exists
const dataPath = join(REVIEW_DIR, 'review_data.json');
if (!existsSync(dataPath)) {
  console.error('FAIL: review_data.json not found');
  process.exit(1);
}
console.log('PASS: review_data.json exists');

// 3. Check each candidate directory
const reviewData = JSON.parse(readFileSync(dataPath, 'utf8'));
console.log(`\nReview data entries: ${reviewData.length}`);

for (const rd of reviewData) {
  const candDir = join(REVIEW_DIR, rd.candidateId);
  if (!existsSync(candDir)) {
    console.error(`FAIL: Missing directory for ${rd.candidateId}`);
    errors++;
    continue;
  }

  // Check frames directory
  const framesDir = join(candDir, 'frames');
  if (!existsSync(framesDir)) {
    console.error(`FAIL: Missing frames/ directory for ${rd.candidateId}`);
    errors++;
    continue;
  }

  const frameFiles = readdirSync(framesDir).filter(f => f.match(/^frame_\d{3}\.png$/));
  if (frameFiles.length !== 64) {
    console.error(`FAIL: ${rd.candidateId} has ${frameFiles.length} frames, expected 64`);
    errors++;
  }

  // Check frame ordering: frame_001 through frame_064
  for (let i = 1; i <= 64; i++) {
    const fname = `frame_${String(i).padStart(3, '0')}.png`;
    if (!existsSync(join(framesDir, fname))) {
      console.error(`FAIL: ${rd.candidateId} missing ${fname}`);
      errors++;
    }
  }

  // Check visual evidence files
  const ve = rd.visualEvidence;
  const evidenceFiles = [
    ve.thumbnail, ve.gridOverlay, ve.contactSheet, ve.alphaBoundary,
    ve.frameFirst, ve.framePeak, ve.frameLast,
  ];
  for (const ef of evidenceFiles) {
    if (!ef) continue;
    if (!existsSync(join(candDir, ef))) {
      console.error(`FAIL: ${rd.candidateId} missing evidence file: ${ef}`);
      errors++;
    }
  }

  // Check GIF (secondary, should exist but not block)
  if (ve.animatedGif) {
    if (!existsSync(join(candDir, ve.animatedGif))) {
      console.warn(`WARN: ${rd.candidateId} missing GIF: ${ve.animatedGif}`);
      warnings++;
    }
  }

  // Check playback config
  if (!rd.playback || rd.playback.baselineFps !== 20) {
    console.warn(`WARN: ${rd.candidateId} missing or wrong baselineFps`);
    warnings++;
  }
  if (!rd.playback || !rd.playback.speeds || rd.playback.speeds.length < 4) {
    console.warn(`WARN: ${rd.candidateId} missing speed options`);
    warnings++;
  }

  console.log(`PASS: ${rd.candidateId} — 64 frames, evidence files checked`);
}

// 4. Validate HTML references resolve to actual files
const html = readFileSync(indexPath, 'utf8');
const srcRefs = [...html.matchAll(/src="([^"]+)"/g)].map(m => m[1]).filter(s => !s.startsWith('data:'));
let missingHtml = 0;
for (const ref of srcRefs) {
  const fp = join(REVIEW_DIR, ref.replace(/\//g, sep));
  if (!existsSync(fp)) {
    console.error(`FAIL: HTML references missing file: ${ref}`);
    missingHtml++;
    errors++;
  }
}
console.log(`\nHTML src references: ${srcRefs.length}, missing: ${missingHtml}`);

// 5. Check player-data JSON in HTML
const playerDataMatch = html.match(/<script type="application\/json" id="player-data">([\s\S]*?)<\/script>/);
if (!playerDataMatch) {
  console.error('FAIL: player-data JSON block not found in HTML');
  errors++;
} else {
  try {
    const playerData = JSON.parse(playerDataMatch[1]);
    if (playerData.length !== 12) {
      console.error(`FAIL: player-data has ${playerData.length} entries, expected 12`);
      errors++;
    }
    for (const pd of playerData) {
      if (!pd.candidateId || !pd.targetDir || pd.frameCount !== 64) {
        console.error(`FAIL: player-data entry invalid: ${JSON.stringify(pd)}`);
        errors++;
      }
    }
    console.log(`PASS: player-data JSON valid with ${playerData.length} entries`);
  } catch (e) {
    console.error(`FAIL: player-data JSON parse error: ${e.message}`);
    errors++;
  }
}

// 6. Check all expected candidates are present
const foundCandidates = reviewData.map(rd => rd.candidateId);
for (const expected of EXPECTED_CANDIDATES) {
  if (!foundCandidates.includes(expected)) {
    console.error(`FAIL: Expected candidate ${expected} not found in review data`);
    errors++;
  }
}
console.log(`\nExpected candidates: ${EXPECTED_CANDIDATES.length}, found: ${foundCandidates.length}`);

// 7. Check GIF sizes (should be > 5KB with LZW fix)
console.log('\nGIF size check:');
for (const rd of reviewData) {
  const gifPath = join(REVIEW_DIR, rd.candidateId, rd.visualEvidence.animatedGif);
  if (existsSync(gifPath)) {
    const size = statSync(gifPath).size;
    const status = size > 5000 ? 'PASS' : 'FAIL';
    if (status === 'FAIL') errors++;
    console.log(`  ${status}: ${rd.candidateId} GIF = ${size} bytes`);
  }
}

// Summary
console.log(`\n=== VALIDATION SUMMARY ===`);
console.log(`Errors: ${errors}`);
console.log(`Warnings: ${warnings}`);
console.log(`Status: ${errors === 0 ? 'ALL PASS' : 'HAS FAILURES'}`);
process.exit(errors > 0 ? 1 : 0);

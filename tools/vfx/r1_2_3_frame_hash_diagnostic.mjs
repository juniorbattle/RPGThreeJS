#!/usr/bin/env node
/**
 * R1.2.4 Full Inventory Grid Classification Scan
 *
 * Scans all spritesheets in the Mega Pack and classifies them using
 * the authoritative CartoonCoffee source dimension convention:
 *   2048×2048 → 4×4 / 16 frames / 512×512 cells
 *   4096×4096 → 8×8 / 64 frames / 512×512 cells
 *   Other     → MANUAL_REVIEW_REQUIRED
 *
 * Also verifies all 12 pilot candidates and produces corrected manifests.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const MEGA_ROOT = 'C:\\Users\\miche\\Documents\\VFX_Library\\CartoonCoffeeMegaPack';
const EXTRACTED_DIR = join(MEGA_ROOT, '01_extracted');
const OUTPUT_DIR = join(MEGA_ROOT, '03_inventory_output');
const REPO = 'c:\\Users\\miche\\Documents\\Projects\\RPGThreeJS';

// ─── classifyNativeGrid ───────────────────────────────────────────
// Authoritative source convention for CartoonCoffee Mega Pack:
//   EXACTLY 2048×2048 → 4×4 / 16 frames / 512×512 cells
//   EXACTLY 4096×4096 → 8×8 / 64 frames / 512×512 cells
//   Everything else  → MANUAL_REVIEW_REQUIRED

export function classifyNativeGrid(width, height) {
  if (width === 2048 && height === 2048) {
    return {
      grid: '4x4',
      columns: 4,
      rows: 4,
      frameCount: 16,
      cellWidth: 512,
      cellHeight: 512,
      evidence: 'SOURCE_DIMENSION_CONVENTION',
      status: 'SOURCE_CONFIRMED_4X4_16F',
    };
  }
  if (width === 4096 && height === 4096) {
    return {
      grid: '8x8',
      columns: 8,
      rows: 8,
      frameCount: 64,
      cellWidth: 512,
      cellHeight: 512,
      evidence: 'SOURCE_DIMENSION_CONVENTION',
      status: 'SOURCE_CONFIRMED_8X8_64F',
    };
  }
  return {
    grid: null,
    columns: null,
    rows: null,
    frameCount: null,
    cellWidth: null,
    cellHeight: null,
    evidence: 'DIMENSION_MISMATCH',
    status: 'MANUAL_REVIEW_REQUIRED',
  };
}

// ─── PNG dimension reader (lightweight, no full decode) ───────────

function readPngDims(buf) {
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

// ─── Full inventory scan ──────────────────────────────────────────

function scanFullInventory() {
  console.log('=== R1.2.4 Full Inventory Grid Classification Scan ===\n');

  // Load R1.1 CORRECTED inventory for per-asset transition matrix
  const r11Path = join(REPO, 'docs/reports/vfx-megapack-r1-1-corrected-inventory.json');
  const r11Data = JSON.parse(readFileSync(r11Path, 'utf8'));
  const r11ById = {};
  for (const c of r11Data.candidates) {
    const grid = c.frameCount === 64 ? '8x8' : c.frameCount === 16 ? '4x4' : c.frameCount === 4 ? '2x2' : c.frameCount === 9 ? '3x3' : 'other';
    r11ById[c.sourceFilename] = { grid, frameCount: c.frameCount, frameDimensions: c.frameDimensions };
  }

  const results = [];
  const collections = readdirSync(EXTRACTED_DIR).filter(d => {
    try { return readdirSync(join(EXTRACTED_DIR, d)).length > 0; } catch { return false; }
  });

  let totalFiles = 0;
  let count2048 = 0, count4096 = 0, countOther = 0;
  let assetId = 1;

  for (const col of collections) {
    const colDir = join(EXTRACTED_DIR, col);
    const files = readdirSync(colDir).filter(f => f.endsWith('.png')).sort();

    for (const file of files) {
      const fullPath = join(colDir, file);
      try {
        const buf = readFileSync(fullPath);
        const { w, h } = readPngDims(buf);
        const classification = classifyNativeGrid(w, h);

        const r11Entry = r11ById[file];
        const r11Grid = r11Entry ? r11Entry.grid : 'not_found';
        const newGrid = classification.grid || 'MANUAL_REVIEW_REQUIRED';
        const changed = r11Grid !== newGrid;

        const entry = {
          assetId: `r1_${String(assetId).padStart(4, '0')}`,
          collection: col,
          sourceFilename: file,
          relativePath: `01_extracted/${col}/${file}`,
          width: w,
          height: h,
          nativeGrid: classification.grid,
          nativeFrameCount: classification.frameCount,
          nativeCellWidth: classification.cellWidth,
          nativeCellHeight: classification.cellHeight,
          classificationEvidence: classification.evidence,
          classificationStatus: classification.status,
          previousR11Classification: r11Grid,
          previousR11FrameCount: r11Entry ? r11Entry.frameCount : null,
          classificationChanged: changed,
        };
        results.push(entry);
        assetId++;
        totalFiles++;

        if (w === 2048 && h === 2048) count2048++;
        else if (w === 4096 && h === 4096) count4096++;
        else countOther++;
      } catch (e) {
        console.error(`Error reading ${file}: ${e.message}`);
      }
    }
  }

  // Compute exact transition matrix from R1.1 corrected → R1.2.4
  const transitionMatrix = {};
  let unchangedCount = 0, stillManual = 0;
  for (const r of results) {
    if (r.classificationStatus === 'MANUAL_REVIEW_REQUIRED') stillManual++;
    const from = r.previousR11Classification;
    const to = r.nativeGrid || 'MANUAL_REVIEW_REQUIRED';
    const key = `${from}→${to}`;
    if (!transitionMatrix[key]) transitionMatrix[key] = 0;
    transitionMatrix[key]++;
    if (!r.classificationChanged) unchangedCount++;
  }

  // Summary
  console.log(`Total spritesheets scanned: ${totalFiles}`);
  console.log(`\nDimension distribution:`);
  console.log(`  2048×2048 (4×4 / 16f): ${count2048}`);
  console.log(`  4096×4096 (8×8 / 64f): ${count4096}`);
  console.log(`  Other dimensions:       ${countOther}`);
  console.log(`\nExact transition matrix from R1.1 corrected → R1.2.4:`);
  for (const [key, count] of Object.entries(transitionMatrix).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${key}: ${count}`);
  }
  console.log(`\n  Unchanged:              ${unchangedCount}`);
  console.log(`  Still manual review:    ${stillManual}`);

  // R1.1 comparison
  console.log(`\nR1.1 corrected inventory numbers:`);
  console.log(`  8x8: 916, 4x4: 1799, 2x2: 51, 3x3: 3 (total: 2769)`);
  console.log(`R1.2.4 corrected numbers:`);
  console.log(`  8x8: ${count4096}, 4x4: ${count2048}, MANUAL_REVIEW: ${countOther} (total: ${totalFiles})`);

  // List other dimensions
  const others = results.filter(r => r.classificationStatus === 'MANUAL_REVIEW_REQUIRED');
  if (others.length > 0) {
    console.log(`\nOther/unknown dimensions (${others.length}):`);
    const dimGroups = {};
    for (const r of others) {
      const key = `${r.width}x${r.height}`;
      if (!dimGroups[key]) dimGroups[key] = [];
      dimGroups[key].push(r.sourceFilename);
    }
    for (const [dim, files] of Object.entries(dimGroups)) {
      console.log(`  ${dim}: ${files.length} files`);
      if (files.length <= 5) for (const f of files) console.log(`    ${f}`);
      else console.log(`    (first 5: ${files.slice(0, 5).join(', ')}...)`);
    }
  }

  // Write corrected inventory JSON
  const correctedInventory = {
    title: 'VFX Mega Pack R1.2.4 — Corrected Source Inventory',
    description: 'Full inventory reclassified using authoritative CartoonCoffee source dimension convention. 2048×2048→4×4/16f, 4096×4096→8×8/64f, other→MANUAL_REVIEW_REQUIRED.',
    generatedAt: new Date().toISOString().split('T')[0],
    sourceConvention: {
      '2048x2048': { grid: '4x4', frames: 16, cellSize: 512, status: 'SOURCE_CONFIRMED_4X4_16F' },
      '4096x4096': { grid: '8x8', frames: 64, cellSize: 512, status: 'SOURCE_CONFIRMED_8X8_64F' },
      'other': { status: 'MANUAL_REVIEW_REQUIRED' },
    },
    summary: {
      totalAssets: totalFiles,
      count2048x2048: count2048,
      count4096x4096: count4096,
      countOther: countOther,
      unchanged: unchangedCount,
      stillManualReview: stillManual,
      transitionMatrix,
    },
    r11Comparison: {
      r11Total: 2769,
      r11_8x8: 916,
      r11_4x4: 1799,
      r11_2x2: 51,
      r11_3x3: 3,
    },
    results,
  };

  const inventoryPath = join(REPO, 'docs/reports/vfx-megapack-r1-2-4-corrected-inventory.json');
  writeFileSync(inventoryPath, JSON.stringify(correctedInventory, null, 2));
  console.log(`\nCorrected inventory written to: ${inventoryPath}`);

  return { results, count2048, count4096, countOther, unchangedCount, stillManual, transitionMatrix };
}

// ─── Pilot candidate verification ─────────────────────────────────

function verifyPilotCandidates() {
  console.log('\n=== Pilot Candidate Dimension Verification ===\n');

  const pilotJsonPath = join(REPO, 'docs/reports/vfx-megapack-r1-2-pilot-candidates.json');
  const pilotData = JSON.parse(readFileSync(pilotJsonPath, 'utf8'));

  const seen = new Set();
  const pilotResults = [];

  for (const c of pilotData.candidates) {
    const id = c.candidate.candidateId;
    if (seen.has(id)) continue;
    seen.add(id);

    const fullPath = join(MEGA_ROOT, c.candidate.sourceRelativePath);
    if (!existsSync(fullPath)) {
      console.log(`${id}: FILE NOT FOUND — ${c.candidate.sourceRelativePath}`);
      continue;
    }

    const buf = readFileSync(fullPath);
    const { w, h } = readPngDims(buf);
    const classification = classifyNativeGrid(w, h);

    const result = {
      candidateId: id,
      sourceFilename: c.candidate.sourceFilename,
      sourceRelativePath: c.candidate.sourceRelativePath,
      dimensions: `${w}x${h}`,
      previousConfirmedGrid: c.candidate.confirmedGrid,
      correctedGrid: classification.grid,
      correctedFrameCount: classification.frameCount,
      correctedCellWidth: classification.cellWidth,
      correctedCellHeight: classification.cellHeight,
      classificationStatus: classification.status,
      gridChanged: c.candidate.confirmedGrid !== classification.grid,
    };
    pilotResults.push(result);

    const changed = result.gridChanged ? ' *** CHANGED ***' : '';
    console.log(`${id} (${result.sourceFilename}):`);
    console.log(`  Dimensions: ${w}x${h}`);
    console.log(`  Previous grid: ${result.previousConfirmedGrid}`);
    console.log(`  Corrected grid: ${result.correctedGrid} (${result.correctedFrameCount}f, ${result.correctedCellWidth}x${result.correctedCellHeight} cells)${changed}`);
    console.log();
  }

  return pilotResults;
}

// ─── Main ─────────────────────────────────────────────────────────

const inventoryResults = scanFullInventory();
const pilotResults = verifyPilotCandidates();

// Write pilot corrected manifest
const pilotManifest = {
  title: 'VFX Mega Pack R1.2.4 — Pilot Corrected Manifest',
  description: 'Corrected grid classification for all 12 unique pilot candidates based on authoritative source dimension convention.',
  generatedAt: new Date().toISOString().split('T')[0],
  sourceConvention: '2048×2048→4×4/16f, 4096×4096→8×8/64f',
  pilotCandidates: pilotResults,
  summary: {
    totalUniqueCandidates: pilotResults.length,
    count4x4: pilotResults.filter(r => r.correctedGrid === '4x4').length,
    count8x8: pilotResults.filter(r => r.correctedGrid === '8x8').length,
    countOther: pilotResults.filter(r => r.correctedGrid === null).length,
    countChanged: pilotResults.filter(r => r.gridChanged).length,
  },
};

const manifestPath = join(REPO, 'docs/reports/vfx-megapack-r1-2-4-pilot-corrected-manifest.json');
writeFileSync(manifestPath, JSON.stringify(pilotManifest, null, 2));
console.log(`Pilot corrected manifest written to: ${manifestPath}`);

console.log('\n=== Scan Complete ===');

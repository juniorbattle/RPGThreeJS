#!/usr/bin/env node
/**
 * R1.2.4 Frame Hash Diagnostic
 *
 * Reports per-candidate frame hash diagnostics using the corrected
 * native grid classification (4×4/16f or 8×8/64f).
 */

import { readFileSync, existsSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { classifyNativeGrid } from './r1_2_3_frame_hash_diagnostic.mjs';

const MEGA_ROOT = 'C:\\Users\\miche\\Documents\\VFX_Library\\CartoonCoffeeMegaPack';
const REVIEW_DIR = join(MEGA_ROOT, '03_inventory_output', 'r1_2_pilot_review');
const REPO = 'c:\\Users\\miche\\Documents\\Projects\\RPGThreeJS';
const PILOT_JSON = join(REPO, 'docs/reports/vfx-megapack-r1-2-pilot-candidates.json');

const EXPECTED = ['r1_1605','r1_1712','r1_0971','r1_0545','r1_1700','r1_2561','r1_0450','r1_0677','r1_0503','r1_2509','r1_0480','r1_0525'];

function readPngDims(buf) {
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

console.log('=== R1.2.4 Frame Hash Diagnostic (Native Grid) ===\n');

const pilotData = JSON.parse(readFileSync(PILOT_JSON, 'utf8'));
const candidateInfo = {};
const seen = new Set();
for (const c of pilotData.candidates) {
  const id = c.candidate.candidateId;
  if (seen.has(id)) continue;
  seen.add(id);
  candidateInfo[id] = {
    sourceFilename: c.candidate.sourceFilename,
    sourceRelativePath: c.candidate.sourceRelativePath,
  };
}

const results = [];
let allOk = true;

for (const candId of EXPECTED) {
  const info = candidateInfo[candId];
  if (!info) {
    console.log(`${candId}: NOT FOUND in pilot JSON`);
    allOk = false;
    continue;
  }

  // Read source to get dimensions
  const fullPath = join(MEGA_ROOT, info.sourceRelativePath);
  if (!existsSync(fullPath)) {
    console.log(`${candId}: SOURCE FILE NOT FOUND`);
    allOk = false;
    continue;
  }

  const srcBuf = readFileSync(fullPath);
  const { w, h } = readPngDims(srcBuf);
  const grid = classifyNativeGrid(w, h);
  const expectedFrameCount = grid.frameCount;

  const framesDir = join(REVIEW_DIR, candId, 'frames');
  if (!existsSync(framesDir)) {
    console.log(`${candId}: MISSING frames directory`);
    allOk = false;
    continue;
  }

  const files = readdirSync(framesDir).filter(f => f.match(/^frame_\d{3}\.png$/)).sort();
  if (files.length !== expectedFrameCount) {
    console.log(`${candId}: WRONG frame count ${files.length} (expected ${expectedFrameCount})`);
    allOk = false;
    continue;
  }

  const hashes = [];
  const dims = new Set();
  const sampleFrames = expectedFrameCount === 16 ? [1, 4, 5, 8, 9, 16] : [1, 8, 9, 32, 64];

  for (let i = 1; i <= expectedFrameCount; i++) {
    const fname = `frame_${String(i).padStart(3, '0')}.png`;
    const buf = readFileSync(join(framesDir, fname));
    const { w: fw, h: fh } = readPngDims(buf);
    dims.add(`${fw}x${fh}`);
    const hash = createHash('md5').update(buf).digest('hex').substring(0, 12);
    hashes.push({ frame: i, hash, size: buf.length, w: fw, h: fh });
  }

  const uniqueHashes = new Set(hashes.map(h => h.hash));
  const dupGroups = {};
  for (const h of hashes) {
    if (!dupGroups[h.hash]) dupGroups[h.hash] = [];
    dupGroups[h.hash].push(h.frame);
  }
  const dups = Object.entries(dupGroups).filter(([_, frames]) => frames.length > 1);

  // Count empty frames
  let emptyFrames = 0;
  for (const h of hashes) {
    if (h.size < 100) emptyFrames++; // Very small PNG = likely empty/transparent
  }

  const result = {
    candidateId: candId,
    sourceFilename: info.sourceFilename,
    dimensions: `${w}x${h}`,
    grid: grid.grid,
    nativeFrameCount: expectedFrameCount,
    uniqueHashes: uniqueHashes.size,
    duplicateGroups: dups.length,
    emptyFrames,
    frameDimensions: [...dims],
  };
  results.push(result);

  console.log(`${candId} (${info.sourceFilename}):`);
  console.log(`  Dimensions: ${w}x${h}`);
  console.log(`  Grid: ${grid.grid}`);
  console.log(`  Native frame count: ${expectedFrameCount}`);
  console.log(`  Unique hashes: ${uniqueHashes.size} / ${expectedFrameCount}`);
  console.log(`  Frame dimensions: ${[...dims].join(', ')}`);
  if (dups.length > 0) {
    console.log(`  Duplicate groups:`);
    for (const [hash, frames] of dups) {
      console.log(`    ${hash}: frames [${frames.join(',')}]`);
    }
  } else {
    console.log(`  No duplicates detected`);
  }
  console.log(`  Empty frames: ${emptyFrames}`);

  console.log(`  Sample frames:`);
  for (const sf of sampleFrames) {
    const h = hashes[sf - 1];
    console.log(`    Frame ${sf}: hash=${h.hash} size=${h.size} dims=${h.w}x${h.h}`);
  }
  console.log();
}

// Write diagnostic JSON
const outputPath = join(REPO, 'docs/reports/vfx-megapack-r1-2-4-frame-hash-diagnostic.json');
const output = {
  title: 'VFX Mega Pack R1.2.4 — Frame Hash Diagnostic',
  generatedAt: new Date().toISOString().split('T')[0],
  candidates: results,
  summary: {
    totalCandidates: results.length,
    allFrameCountsCorrect: results.every(r => r.nativeFrameCount === 16 || r.nativeFrameCount === 64),
    allDimsCorrect: results.every(r => r.frameDimensions.includes('512x512')),
  },
};
writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(`Diagnostic JSON written to: ${outputPath}`);
console.log(`\n=== Diagnostic Complete — All OK: ${allOk} ===`);
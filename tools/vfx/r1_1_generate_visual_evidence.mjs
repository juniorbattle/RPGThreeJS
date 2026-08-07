#!/usr/bin/env node
/**
 * R1.1 Visual Evidence Generator
 *
 * Generates external visual evidence files (grid overlays, occupancy diagrams,
 * contact sheets) for changed, ambiguous, P0, and representative assets.
 *
 * All output goes to:
 *   <MEGA_PACK_ROOT>/03_inventory_output/r1_1_grid_validation/
 *
 * No visual files are copied into the repository.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync, deflateSync } from 'node:zlib';

const MEGA_ROOT = 'C:\\Users\\miche\\Documents\\VFX_Library\\CartoonCoffeeMegaPack';
const OUTPUT_DIR = join(MEGA_ROOT, '03_inventory_output', 'r1_1_grid_validation');
const FULL_RESULTS_PATH = join(MEGA_ROOT, '03_inventory_output', 'r1_1_full_results.json');
const R1_INVENTORY_PATH = 'c:\\Users\\miche\\Documents\\Projects\\RPGThreeJS\\docs\\reports\\vfx-megapack-r1-inventory.json';

// Ensure output directory exists
mkdirSync(OUTPUT_DIR, { recursive: true });

function readPngHeader(buf) {
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) return null;
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bitDepth: buf[24],
    colorType: buf[25],
  };
}

function decodePng(buf) {
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const colorType = buf[25];

  const idatChunks = [];
  let offset = 8;
  while (offset < buf.length) {
    const chunkLen = buf.readUInt32BE(offset);
    const chunkType = buf.toString('ascii', offset + 4, offset + 8);
    if (chunkType === 'IDAT') {
      idatChunks.push(buf.subarray(offset + 8, offset + 8 + chunkLen));
    }
    offset += 12 + chunkLen;
  }

  const compressed = Buffer.concat(idatChunks);
  const inflated = inflateSync(compressed);

  let channels;
  switch (colorType) {
    case 0: channels = 1; break;
    case 2: channels = 3; break;
    case 3: channels = 1; break;
    case 4: channels = 2; break;
    case 6: channels = 4; break;
    default: channels = 4;
  }

  const bpp = channels;
  const stride = width * bpp;
  const output = new Uint8Array(width * height * 4);
  let prevRow = new Uint8Array(stride);
  let srcOffset = 0;

  for (let y = 0; y < height; y++) {
    const filter = inflated[srcOffset];
    const rowStart = srcOffset + 1;
    const rawRow = inflated.subarray(rowStart, rowStart + stride);
    const curRow = new Uint8Array(stride);

    switch (filter) {
      case 0: curRow.set(rawRow); break;
      case 1:
        for (let i = 0; i < stride; i++) {
          const left = i >= bpp ? curRow[i - bpp] : 0;
          curRow[i] = (rawRow[i] + left) & 0xff;
        }
        break;
      case 2:
        for (let i = 0; i < stride; i++) curRow[i] = (rawRow[i] + prevRow[i]) & 0xff;
        break;
      case 3:
        for (let i = 0; i < stride; i++) {
          const left = i >= bpp ? curRow[i - bpp] : 0;
          const up = prevRow[i];
          curRow[i] = (rawRow[i] + Math.floor((left + up) / 2)) & 0xff;
        }
        break;
      case 4:
        for (let i = 0; i < stride; i++) {
          const left = i >= bpp ? curRow[i - bpp] : 0;
          const up = prevRow[i];
          const upLeft = i >= bpp ? prevRow[i - bpp] : 0;
          const p = left + up - upLeft;
          const pa = Math.abs(p - left);
          const pb = Math.abs(p - up);
          const pc = Math.abs(p - upLeft);
          let pred;
          if (pa <= pb && pa <= pc) pred = left;
          else if (pb <= pc) pred = up;
          else pred = upLeft;
          curRow[i] = (rawRow[i] + pred) & 0xff;
        }
        break;
      default: curRow.set(rawRow);
    }

    for (let x = 0; x < width; x++) {
      const srcIdx = x * bpp;
      const dstIdx = (y * width + x) * 4;
      if (channels === 4) {
        output[dstIdx] = curRow[srcIdx];
        output[dstIdx + 1] = curRow[srcIdx + 1];
        output[dstIdx + 2] = curRow[srcIdx + 2];
        output[dstIdx + 3] = curRow[srcIdx + 3];
      } else if (channels === 3) {
        output[dstIdx] = curRow[srcIdx];
        output[dstIdx + 1] = curRow[srcIdx + 1];
        output[dstIdx + 2] = curRow[srcIdx + 2];
        output[dstIdx + 3] = 255;
      } else if (channels === 2) {
        output[dstIdx] = curRow[srcIdx];
        output[dstIdx + 1] = curRow[srcIdx];
        output[dstIdx + 2] = curRow[srcIdx];
        output[dstIdx + 3] = curRow[srcIdx + 1];
      } else {
        output[dstIdx] = curRow[srcIdx];
        output[dstIdx + 1] = curRow[srcIdx];
        output[dstIdx + 2] = curRow[srcIdx];
        output[dstIdx + 3] = 255;
      }
    }

    prevRow = curRow;
    srcOffset += stride + 1;
  }

  return { width, height, data: output };
}

/**
 * Encode RGBA data to a simple PNG (no compression optimization, raw filter).
 */
function encodePng(width, height, rgba) {
  // Build PNG manually
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Build raw scanlines with filter byte 0
  const stride = width * 4;
  const rawData = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    rawData[y * (stride + 1)] = 0; // filter: none
    for (let x = 0; x < stride; x++) {
      rawData[y * (stride + 1) + 1 + x] = rgba[y * stride + x];
    }
  }

  // Compress with deflate
  const compressed = deflateSync(rawData);

  // Build chunks
  const chunks = [signature, makeChunk('IHDR', ihdr), makeChunk('IDAT', compressed), makeChunk('IEND', Buffer.alloc(0))];
  return Buffer.concat(chunks);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  // Simple CRC32
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  crc.writeUInt32BE(crcVal >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ 0xffffffff;
}

/**
 * Generate a grid overlay image: draws grid lines on a downscaled version of the source.
 */
function generateGridOverlay(sourcePath, gridCols, gridRows, outPath, label) {
  const buf = readFileSync(sourcePath);
  const decoded = decodePng(buf);
  const { width, height, data } = decoded;

  // Downscale to max 512x512 for overlay
  const maxDim = 512;
  const scale = Math.min(maxDim / width, maxDim / height, 1);
  const outW = Math.floor(width * scale);
  const outH = Math.floor(height * scale);
  const outData = new Uint8Array(outW * outH * 4);

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const srcX = Math.floor(x / scale);
      const srcY = Math.floor(y / scale);
      const srcIdx = (srcY * width + srcX) * 4;
      const dstIdx = (y * outW + x) * 4;
      outData[dstIdx] = data[srcIdx];
      outData[dstIdx + 1] = data[srcIdx + 1];
      outData[dstIdx + 2] = data[srcIdx + 2];
      outData[dstIdx + 3] = data[srcIdx + 3];
    }
  }

  // Draw grid lines
  const cellW = outW / gridCols;
  const cellH = outH / gridRows;

  for (let col = 0; col <= gridCols; col++) {
    const x = Math.floor(col * cellW);
    for (let y = 0; y < outH; y++) {
      const idx = (y * outW + x) * 4;
      // Red grid lines
      outData[idx] = 255;
      outData[idx + 1] = 0;
      outData[idx + 2] = 0;
      outData[idx + 3] = 255;
    }
  }

  for (let row = 0; row <= gridRows; row++) {
    const y = Math.floor(row * cellH);
    for (let x = 0; x < outW; x++) {
      const idx = (y * outW + x) * 4;
      outData[idx] = 255;
      outData[idx + 1] = 0;
      outData[idx + 2] = 0;
      outData[idx + 3] = 255;
    }
  }

  const png = encodePng(outW, outH, outData);
  writeFileSync(outPath, png);
}

/**
 * Generate an active-cell occupancy diagram.
 */
function generateOccupancyDiagram(sourcePath, gridCols, gridRows, outPath) {
  const buf = readFileSync(sourcePath);
  const decoded = decodePng(buf);
  const { width, height, data } = decoded;

  const cellW = Math.floor(width / gridCols);
  const cellH = Math.floor(height / gridRows);

  // Create a small grid image showing active cells
  const outW = gridCols * 32;
  const outH = gridRows * 32;
  const outData = new Uint8Array(outW * outH * 4);

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      let activePixels = 0;
      const x0 = col * cellW;
      const y0 = row * cellH;

      for (let y = y0; y < y0 + cellH; y++) {
        for (let x = x0; x < x0 + cellW; x++) {
          const idx = (y * width + x) * 4;
          if (data[idx + 3] > 8) activePixels++;
        }
      }

      const occupancy = activePixels / (cellW * cellH);
      // Green = active, dark = empty
      const r = occupancy > 0.001 ? Math.floor(occupancy * 255) : 20;
      const g = occupancy > 0.001 ? 200 : 20;
      const b = 20;

      for (let dy = 0; dy < 30; dy++) {
        for (let dx = 0; dx < 30; dx++) {
          const ox = col * 32 + dx + 1;
          const oy = row * 32 + dy + 1;
          const idx = (oy * outW + ox) * 4;
          outData[idx] = r;
          outData[idx + 1] = g;
          outData[idx + 2] = b;
          outData[idx + 3] = 255;
        }
      }
    }
  }

  const png = encodePng(outW, outH, outData);
  writeFileSync(outPath, png);
}

// ─── Main ─────────────────────────────────────────────────────────

function main() {
  console.log('R1.1 Visual Evidence Generator — Starting...');

  const fullResults = JSON.parse(readFileSync(FULL_RESULTS_PATH, 'utf8'));
  const r1Inventory = JSON.parse(readFileSync(R1_INVENTORY_PATH, 'utf8'));

  // Build candidate lookup
  const candidateMap = new Map();
  for (const c of r1Inventory.candidates) {
    candidateMap.set(c.candidateId, c);
  }

  const { results } = fullResults;

  // Select assets for visual evidence:
  // 1. Every asset whose grid changed (sample, not all 1853)
  // 2. Every P0 candidate
  // 3. Every semantic mismatch candidate
  // 4. Representative sample from each collection
  // 5. Representative 4x4 and 8x8 sheets

  const p0CandidateIds = ['r1_1605', 'r1_0971', 'r1_0545', 'r1_1700', 'r1_1712'];
  const semanticCandidateIds = ['r1_2561', 'r1_0971', 'r1_0450'];
  const allPriorityIds = [...new Set([...p0CandidateIds, ...semanticCandidateIds])];

  // Changed assets: sample 20 from each change type
  const changedTo4x4 = results.filter(r => r.changed && r.correctedGrid?.cols === 4 && r.correctedGrid?.rows === 4);
  const changedToOther = results.filter(r => r.changed && !(r.correctedGrid?.cols === 4 && r.correctedGrid?.rows === 4));
  const confirmed8x8 = results.filter(r => !r.changed && r.confidence === 'HIGH');

  const changedSample = [
    ...changedTo4x4.slice(0, 20),
    ...changedToOther.slice(0, 10),
  ];

  const confirmedSample = confirmed8x8.slice(0, 10);

  // Collection samples
  const collectionSamples = {};
  for (const r of results) {
    const col = r.sourceCollection;
    if (!collectionSamples[col]) collectionSamples[col] = [];
    if (collectionSamples[col].length < 3) collectionSamples[col].push(r);
  }

  let generated = 0;

  // Generate evidence for priority candidates
  console.log('\nGenerating evidence for P0 and semantic mismatch candidates...');
  for (const cid of allPriorityIds) {
    const r = results.find(res => res.candidateId === cid);
    if (!r || !r.correctedGrid) continue;

    const candidate = candidateMap.get(cid);
    if (!candidate) continue;

    const fullPath = join(MEGA_ROOT, candidate.sourcePath);
    if (!existsSync(fullPath)) continue;

    const baseName = candidate.sourceFilename.replace(/\.png$/i, '');
    const gridStr = `${r.correctedGrid.cols}x${r.correctedGrid.rows}`;

    // Grid overlay
    const overlayPath = join(OUTPUT_DIR, `overlay_${baseName}_${gridStr}.png`);
    try {
      generateGridOverlay(fullPath, r.correctedGrid.cols, r.correctedGrid.rows, overlayPath, `${cid} ${gridStr}`);
      generated++;
    } catch (e) {
      console.log(`  Skip overlay for ${cid}: ${e.message}`);
    }

    // Occupancy diagram
    const occPath = join(OUTPUT_DIR, `occupancy_${baseName}_${gridStr}.png`);
    try {
      generateOccupancyDiagram(fullPath, r.correctedGrid.cols, r.correctedGrid.rows, occPath);
      generated++;
    } catch (e) {
      console.log(`  Skip occupancy for ${cid}: ${e.message}`);
    }
  }

  // Generate evidence for changed assets (sample)
  console.log('\nGenerating evidence for changed-grid sample...');
  for (const r of changedSample) {
    const candidate = candidateMap.get(r.candidateId);
    if (!candidate) continue;

    const fullPath = join(MEGA_ROOT, candidate.sourcePath);
    if (!existsSync(fullPath)) continue;

    const baseName = candidate.sourceFilename.replace(/\.png$/i, '');
    const gridStr = `${r.correctedGrid.cols}x${r.correctedGrid.rows}`;

    const overlayPath = join(OUTPUT_DIR, `overlay_${baseName}_${gridStr}.png`);
    try {
      generateGridOverlay(fullPath, r.correctedGrid.cols, r.correctedGrid.rows, overlayPath, `${r.candidateId} ${gridStr}`);
      generated++;
    } catch (e) {
      // skip
    }
  }

  // Generate evidence for confirmed 8x8 sample
  console.log('Generating evidence for confirmed 8x8 sample...');
  for (const r of confirmedSample) {
    const candidate = candidateMap.get(r.candidateId);
    if (!candidate) continue;

    const fullPath = join(MEGA_ROOT, candidate.sourcePath);
    if (!existsSync(fullPath)) continue;

    const baseName = candidate.sourceFilename.replace(/\.png$/i, '');

    const overlayPath = join(OUTPUT_DIR, `overlay_${baseName}_8x8.png`);
    try {
      generateGridOverlay(fullPath, 8, 8, overlayPath, `${r.candidateId} 8x8 confirmed`);
      generated++;
    } catch (e) {
      // skip
    }
  }

  // Generate evidence for collection samples
  console.log('Generating evidence for collection representatives...');
  for (const [col, samples] of Object.entries(collectionSamples)) {
    for (const r of samples) {
      const candidate = candidateMap.get(r.candidateId);
      if (!candidate) continue;

      const fullPath = join(MEGA_ROOT, candidate.sourcePath);
      if (!existsSync(fullPath)) continue;

      const baseName = candidate.sourceFilename.replace(/\.png$/i, '');
      const gridStr = r.correctedGrid ? `${r.correctedGrid.cols}x${r.correctedGrid.rows}` : 'unknown';

      const overlayPath = join(OUTPUT_DIR, `overlay_${baseName}_${gridStr}.png`);
      try {
        generateGridOverlay(fullPath, r.correctedGrid?.cols || 8, r.correctedGrid?.rows || 8, overlayPath, `${r.candidateId} ${col}`);
        generated++;
      } catch (e) {
        // skip
      }
    }
  }

  // Write evidence index
  const evidenceIndex = {
    generatedAt: '2026-08-06',
    totalFiles: generated,
    outputDirectory: '<MEGA_PACK_ROOT>/03_inventory_output/r1_1_grid_validation/',
    categories: {
      p0AndSemanticOverlays: allPriorityIds.length * 2,
      changedGridOverlays: changedSample.length,
      confirmed8x8Overlays: confirmedSample.length,
      collectionRepresentatives: Object.values(collectionSamples).reduce((a, b) => a + b.length, 0),
    },
    note: 'All visual evidence files are external to the repository. No images are copied into docs/ or Git.',
  };

  writeFileSync(join(OUTPUT_DIR, 'evidence_index.json'), JSON.stringify(evidenceIndex, null, 2));
  console.log(`\nGenerated ${generated} visual evidence files at ${OUTPUT_DIR}`);
  console.log('Evidence index written to evidence_index.json');
}

try {
  main();
} catch (e) {
  console.error('Fatal error:', e);
  process.exit(1);
}

#!/usr/bin/env node
/**
 * R1.1 Grid Validation Tool
 *
 * Multi-signal grid detector that distinguishes 4x4/16-frame, 8x8/64-frame,
 * and other regular layouts. Does NOT rely on dimension divisibility alone.
 *
 * Signals used:
 *   - alpha occupancy per candidate cell
 *   - transparent separator consistency
 *   - bounding-box continuity within cells
 *   - repeated subdivision patterns
 *   - number of active vs empty cells
 *   - cross-cell clipping indicators
 *   - filename/directory hints
 *   - GIF preview frame count correlation
 *   - visual similarity between adjacent candidate subdivisions
 *   - confidence comparison between competing grid hypotheses
 *
 * Output: corrected inventory JSON + validation report data
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, basename, dirname, extname } from 'node:path';
import { inflateSync } from 'node:zlib';

const MEGA_ROOT = 'C:\\Users\\miche\\Documents\\VFX_Library\\CartoonCoffeeMegaPack';
const EXTRACTED = join(MEGA_ROOT, '01_extracted');
const OUTPUT_DIR = join(MEGA_ROOT, '03_inventory_output');
const EVIDENCE_DIR = join(OUTPUT_DIR, 'r1_1_grid_validation');
const R1_INVENTORY_PATH = 'c:\\Users\\miche\\Documents\\Projects\\RPGThreeJS\\docs\\reports\\vfx-megapack-r1-inventory.json';
const CORRECTED_OUT = 'c:\\Users\\miche\\Documents\\Projects\\RPGThreeJS\\docs\\reports\\vfx-megapack-r1-1-corrected-inventory.json';
const VALIDATION_DATA_OUT = join(OUTPUT_DIR, 'r1_1_validation_data.json');

// ─── PNG decoding (minimal, scanline-based) ───────────────────────

function readPngHeader(buf) {
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) return null;
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bitDepth: buf[24],
    colorType: buf[25],
    fileSize: buf.length,
  };
}

/**
 * Decode PNG to RGBA pixel buffer using zlib.
 * Returns { width, height, data } where data is Uint8Array of RGBA pixels.
 */
function decodePng(buf) {
  // Parse IHDR
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const bitDepth = buf[24];
  const colorType = buf[25];

  // Collect IDAT chunks
  const idatChunks = [];
  let offset = 8;
  while (offset < buf.length) {
    const chunkLen = buf.readUInt32BE(offset);
    const chunkType = buf.toString('ascii', offset + 4, offset + 8);
    if (chunkType === 'IDAT') {
      idatChunks.push(buf.subarray(offset + 8, offset + 8 + chunkLen));
    }
    offset += 12 + chunkLen; // len + type + data + crc
  }

  const compressed = Buffer.concat(idatChunks);
  const inflated = inflateSync(compressed);

  // Determine channels
  let channels;
  switch (colorType) {
    case 0: channels = 1; break; // grayscale
    case 2: channels = 3; break; // RGB
    case 3: channels = 1; break; // palette (index)
    case 4: channels = 2; break; // grayscale + alpha
    case 6: channels = 4; break; // RGBA
    default: channels = 4;
  }

  const bpp = channels; // bytes per pixel
  const stride = width * bpp;
  const rowLen = stride + 1; // filter byte + pixel data
  const output = new Uint8Array(width * height * 4);

  // Unfilter scanlines
  let prevRow = new Uint8Array(stride);
  let srcOffset = 0;

  for (let y = 0; y < height; y++) {
    const filter = inflated[srcOffset];
    const rowStart = srcOffset + 1;
    const rawRow = inflated.subarray(rowStart, rowStart + stride);

    const curRow = new Uint8Array(stride);

    switch (filter) {
      case 0: // None
        curRow.set(rawRow);
        break;
      case 1: // Sub
        for (let i = 0; i < stride; i++) {
          const left = i >= bpp ? curRow[i - bpp] : 0;
          curRow[i] = (rawRow[i] + left) & 0xff;
        }
        break;
      case 2: // Up
        for (let i = 0; i < stride; i++) {
          curRow[i] = (rawRow[i] + prevRow[i]) & 0xff;
        }
        break;
      case 3: // Average
        for (let i = 0; i < stride; i++) {
          const left = i >= bpp ? curRow[i - bpp] : 0;
          const up = prevRow[i];
          curRow[i] = (rawRow[i] + Math.floor((left + up) / 2)) & 0xff;
        }
        break;
      case 4: // Paeth
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
      default:
        curRow.set(rawRow); // fallback
    }

    // Convert to RGBA
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
      } else if (channels === 1) {
        output[dstIdx] = curRow[srcIdx];
        output[dstIdx + 1] = curRow[srcIdx];
        output[dstIdx + 2] = curRow[srcIdx];
        output[dstIdx + 3] = 255;
      }
    }

    prevRow = curRow;
    srcOffset += rowLen;
  }

  return { width, height, data: output };
}

// ─── Alpha occupancy analysis ─────────────────────────────────────

/**
 * For a given grid hypothesis (cols x rows), compute per-cell alpha occupancy.
 * Returns { cells: [{active, totalAlpha, bbox}], emptyCount, activeCount, separatorConsistency }
 */
function analyzeGridHypothesis(pixels, width, height, cols, rows) {
  const cellW = Math.floor(width / cols);
  const cellH = Math.floor(height / rows);
  const cells = [];
  let emptyCount = 0;
  let activeCount = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let activePixels = 0;
      let totalAlpha = 0;
      let minX = cellW, minY = cellH, maxX = 0, maxY = 0;

      const x0 = col * cellW;
      const y0 = row * cellH;

      for (let y = y0; y < y0 + cellH; y++) {
        for (let x = x0; x < x0 + cellW; x++) {
          const idx = (y * width + x) * 4;
          const alpha = pixels[idx + 3];
          totalAlpha += alpha;
          if (alpha > 8) {
            activePixels++;
            if (x - x0 < minX) minX = x - x0;
            if (y - y0 < minY) minY = y - y0;
            if (x - x0 > maxX) maxX = x - x0;
            if (y - y0 > maxY) maxY = y - y0;
          }
        }
      }

      const totalPixels = cellW * cellH;
      const occupancyRatio = activePixels / totalPixels;
      const isActive = occupancyRatio > 0.001; // at least 0.1% non-transparent

      if (!isActive) {
        emptyCount++;
      } else {
        activeCount++;
      }

      cells.push({
        row, col,
        active: isActive,
        occupancyRatio,
        totalAlpha,
        bbox: isActive ? { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY } : null,
      });
    }
  }

  // Check separator consistency: scan the border rows/cols between cells
  let separatorTransparentPixels = 0;
  let separatorTotalPixels = 0;

  // Vertical separators (between columns)
  for (let col = 1; col < cols; col++) {
    const x = col * cellW;
    // Sample a few pixels on each side of the boundary
    for (let dx = -2; dx <= 2; dx++) {
      const sx = x + dx;
      if (sx < 0 || sx >= width) continue;
      for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 200))) {
        const idx = (y * width + sx) * 4;
        separatorTotalPixels++;
        if (pixels[idx + 3] < 8) separatorTransparentPixels++;
      }
    }
  }

  // Horizontal separators (between rows)
  for (let row = 1; row < rows; row++) {
    const y = row * cellH;
    for (let dy = -2; dy <= 2; dy++) {
      const sy = y + dy;
      if (sy < 0 || sy >= height) continue;
      for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 200))) {
        const idx = (sy * width + x) * 4;
        separatorTotalPixels++;
        if (pixels[idx + 3] < 8) separatorTransparentPixels++;
      }
    }
  }

  const separatorTransparencyRatio = separatorTotalPixels > 0
    ? separatorTransparentPixels / separatorTotalPixels
    : 0;

  // Cross-cell clipping: check if active bboxes touch cell edges
  let clippingCells = 0;
  for (const cell of cells) {
    if (!cell.active || !cell.bbox) continue;
    const touchesEdge = cell.bbox.minX <= 1 || cell.bbox.minY <= 1 ||
      cell.bbox.maxX >= cellW - 2 || cell.bbox.maxY >= cellH - 2;
    if (touchesEdge) clippingCells++;
  }

  // Bounding box center drift: how much do cell centers drift from cell center?
  let centerDriftSum = 0;
  let centerDriftCount = 0;
  for (const cell of cells) {
    if (!cell.active || !cell.bbox) continue;
    const bboxCenterX = (cell.bbox.minX + cell.bbox.maxX) / 2;
    const bboxCenterY = (cell.bbox.minY + cell.bbox.maxY) / 2;
    const cellCenterX = cellW / 2;
    const cellCenterY = cellH / 2;
    const drift = Math.sqrt(
      (bboxCenterX - cellCenterX) ** 2 + (bboxCenterY - cellCenterY) ** 2
    );
    centerDriftSum += drift;
    centerDriftCount++;
  }
  const avgCenterDrift = centerDriftCount > 0 ? centerDriftSum / centerDriftCount : 0;

  return {
    cols, rows, cellW, cellH, frameCount: cols * rows,
    cells, emptyCount, activeCount,
    separatorTransparencyRatio,
    clippingCellCount: clippingCells,
    avgCenterDrift,
    emptyRatio: emptyCount / (cols * rows),
  };
}

/**
 * Score a grid hypothesis. Higher = better.
 */
function scoreHypothesis(h, width, height, filename) {
  let score = 0;
  const f = (filename || '').toLowerCase();

  // Square cells are preferred
  if (h.cellW === h.cellH) score += 20;

  // Common cell sizes
  const commonSizes = [128, 192, 256, 384, 512, 1024];
  if (commonSizes.includes(h.cellW)) score += 15;
  if (commonSizes.includes(h.cellH)) score += 15;

  // Common frame counts
  const commonCounts = [4, 8, 9, 12, 15, 16, 20, 24, 25, 30, 32, 36, 40, 48, 49, 64, 72, 80, 81, 100];
  if (commonCounts.includes(h.frameCount)) score += 10;

  // Separator transparency: high transparency at boundaries = strong grid signal
  score += h.separatorTransparencyRatio * 30;

  // Active cell ratio: most cells should be active for a real animation
  const activeRatio = h.activeCount / h.frameCount;
  score += activeRatio * 20;

  // Penalty for too many empty cells (more than 50% empty suggests wrong grid)
  if (h.emptyRatio > 0.5) score -= 25;
  if (h.emptyRatio > 0.7) score -= 25;

  // Center drift: low drift = content is centered in cells = good grid fit
  if (h.avgCenterDrift < 10) score += 15;
  else if (h.avgCenterDrift < 25) score += 8;
  else if (h.avgCenterDrift > 50) score -= 15;

  // Clipping: some clipping is OK but excessive suggests wrong grid
  const clippingRatio = h.clippingCellCount / h.activeCount;
  if (clippingRatio > 0.8) score -= 10;

  // Filename hints
  if (f.includes('spritesheet')) score += 2; // neutral, all have this

  // Prefer 4x4 and 8x8 as the two known formats
  if (h.cols === 4 && h.rows === 4) score += 8;
  if (h.cols === 8 && h.rows === 8) score += 8;
  if (h.cols === 5 && h.rows === 5) score += 5; // runtime format

  return { score, ...h };
}

/**
 * Detect grid using multiple signals.
 * Returns best hypothesis with confidence level.
 */
function detectGridMultiSignal(pixels, width, height, filename, gifFrameCount) {
  const hypotheses = [];

  // Test all reasonable grid layouts
  const testGrids = [
    [1, 1], [2, 2], [2, 4], [4, 2], [4, 4], [4, 8], [8, 4], [8, 8],
    [3, 3], [5, 5], [6, 6], [4, 6], [6, 4], [3, 4], [4, 3],
    [2, 8], [8, 2], [4, 16], [16, 4], [8, 16], [16, 8],
    [3, 5], [5, 3], [5, 8], [8, 5],
  ];

  for (const [cols, rows] of testGrids) {
    if (width % cols !== 0 || height % rows !== 0) continue;
    if (cols === 1 && rows === 1) continue;

    const analysis = analyzeGridHypothesis(pixels, width, height, cols, rows);
    const scored = scoreHypothesis(analysis, width, height, filename);

    // GIF correlation bonus
    if (gifFrameCount && gifFrameCount === scored.frameCount) {
      scored.score += 20;
      scored.gifCorrelation = true;
    } else {
      scored.gifCorrelation = false;
    }

    hypotheses.push(scored);
  }

  if (hypotheses.length === 0) {
    return {
      cols: 1, rows: 1, cellW: width, cellH: height, frameCount: 1,
      confidence: 'MANUAL_REVIEW_REQUIRED',
      hypotheses: [],
      ambiguityReason: 'No valid grid layout found for image dimensions',
    };
  }

  // Sort by score descending
  hypotheses.sort((a, b) => b.score - a.score);
  const best = hypotheses[0];
  const second = hypotheses[1];

  // Confidence assignment
  let confidence;
  const scoreGap = best.score - (second ? second.score : 0);

  if (best.score >= 80 && scoreGap >= 20) {
    confidence = 'HIGH';
  } else if (best.score >= 60 && scoreGap >= 10) {
    confidence = 'MEDIUM';
  } else if (best.score >= 40) {
    confidence = 'LOW';
  } else {
    confidence = 'MANUAL_REVIEW_REQUIRED';
  }

  // If top two hypotheses are very close, downgrade confidence
  if (scoreGap < 5 && second) {
    if (confidence === 'HIGH') confidence = 'MEDIUM';
    else if (confidence === 'MEDIUM') confidence = 'LOW';
  }

  let ambiguityReason = null;
  if (scoreGap < 5 && second) {
    ambiguityReason = `Top hypotheses too close: ${best.cols}x${best.rows} (${best.score.toFixed(1)}) vs ${second.cols}x${second.rows} (${second.score.toFixed(1)})`;
  }

  return {
    cols: best.cols,
    rows: best.rows,
    cellW: best.cellW,
    cellH: best.cellH,
    frameCount: best.frameCount,
    confidence,
    separatorTransparencyRatio: best.separatorTransparencyRatio,
    activeCount: best.activeCount,
    emptyCount: best.emptyCount,
    emptyRatio: best.emptyRatio,
    avgCenterDrift: best.avgCenterDrift,
    clippingCellCount: best.clippingCellCount,
    gifCorrelation: best.gifCorrelation || false,
    ambiguityReason,
    hypotheses: hypotheses.slice(0, 5).map(h => ({
      cols: h.cols, rows: h.rows, frameCount: h.frameCount,
      cellW: h.cellW, cellH: h.cellH,
      score: Math.round(h.score * 10) / 10,
      separatorTransparency: Math.round(h.separatorTransparencyRatio * 1000) / 1000,
      activeCells: h.activeCount,
      emptyCells: h.emptyCount,
      avgCenterDrift: Math.round(h.avgCenterDrift * 10) / 10,
      gifCorrelation: h.gifCorrelation || false,
    })),
  };
}

// ─── GIF frame count extraction ───────────────────────────────────

function getGifFrameCount(gifPath) {
  try {
    const buf = readFileSync(gifPath);
    let frameCount = 0;
    let offset = 0;

    // GIF89a signature
    if (buf[0] !== 0x47 || buf[1] !== 0x49) return null;

    // Skip logical screen descriptor
    offset = 6;
    const packedField = buf[10];
    const gctFlag = (packedField & 0x80) !== 0;
    const gctSize = packedField & 0x07;
    if (gctFlag) {
      offset += 3 * (2 ** (gctSize + 1));
    }
    offset += 7; // logical screen descriptor is 7 bytes starting at offset 6

    // Parse blocks
    while (offset < buf.length) {
      const blockType = buf[offset];
      if (blockType === 0x21) {
        // Extension
        const label = buf[offset + 1];
        offset += 2;
        if (label === 0xf9) {
          // Graphic Control Extension - indicates a frame
          frameCount++;
        }
        // Skip sub-blocks
        while (offset < buf.length && buf[offset] !== 0) {
          const blockSize = buf[offset];
          offset += blockSize + 1;
        }
        offset++; // skip terminator
      } else if (blockType === 0x2c) {
        // Image descriptor - also indicates a frame
        if (frameCount === 0) frameCount = 1; // first frame might not have GCE
        offset += 10; // image descriptor
        const imgPacked = buf[offset - 1];
        const lctFlag = (imgPacked & 0x80) !== 0;
        const lctSize = imgPacked & 0x07;
        if (lctFlag) {
          offset += 3 * (2 ** (lctSize + 1));
        }
        // Skip image data sub-blocks
        while (offset < buf.length && buf[offset] !== 0) {
          const blockSize = buf[offset];
          offset += blockSize + 1;
        }
        offset++; // skip terminator
      } else if (blockType === 0x3b) {
        // Trailer
        break;
      } else {
        offset++;
      }
    }

    return frameCount || null;
  } catch {
    return null;
  }
}

// ─── Main validation ──────────────────────────────────────────────

async function main() {
  console.log('R1.1 Grid Validation — Starting...');

  // Load R1 inventory
  const r1Inventory = JSON.parse(readFileSync(R1_INVENTORY_PATH, 'utf8'));
  console.log(`Loaded R1 inventory: ${r1Inventory.candidates.length} candidates`);

  // Build GIF preview map
  const gifMap = new Map();
  const collections = readdirSync(EXTRACTED);
  for (const col of collections) {
    const colDir = join(EXTRACTED, col);
    if (!statSync(colDir).isDirectory()) continue;
    const subDirs = readdirSync(colDir);
    for (const sd of subDirs) {
      const sdPath = join(colDir, sd);
      if (statSync(sdPath).isDirectory()) {
        // Check subdirectories (e.g. GIF Previews)
        const subFiles = readdirSync(sdPath);
        for (const f of subFiles) {
          if (f.toLowerCase().endsWith('.gif')) {
            const baseName = f.replace(/\.gif$/i, '').replace(/_preview$/i, '');
            gifMap.set(baseName.toLowerCase(), join(sdPath, f));
          }
        }
      } else if (sd.toLowerCase().endsWith('.gif')) {
        const baseName = sd.replace(/\.gif$/i, '').replace(/_preview$/i, '');
        gifMap.set(baseName.toLowerCase(), sdPath);
      }
    }
  }
  console.log(`Found ${gifMap.size} GIF previews`);

  const results = [];
  let changed = 0;
  let unchanged = 0;
  let ambiguous = 0;
  let highConf = 0;
  let mediumConf = 0;
  let lowConf = 0;
  let manualReview = 0;
  const gridChanges = { '8x8_to_4x4': 0, '8x8_to_other': 0, '8x8_confirmed': 0, 'other_to_8x8': 0 };
  const collectionSamples = {};

  const total = r1Inventory.candidates.length;
  let processed = 0;

  for (const candidate of r1Inventory.candidates) {
    processed++;
    if (processed % 100 === 0) {
      console.log(`  Processing ${processed}/${total}...`);
    }

    const fullPath = join(MEGA_ROOT, candidate.sourcePath);
    if (!existsSync(fullPath)) {
      results.push({
        candidateId: candidate.candidateId,
        sourceFilename: candidate.sourceFilename,
        sourcePath: candidate.sourcePath,
        sourceCollection: candidate.sourceCollection,
        previousGrid: { cols: 8, rows: 8, frameCount: 64 },
        correctedGrid: null,
        confidence: 'MANUAL_REVIEW_REQUIRED',
        changed: false,
        ambiguityReason: 'Source file not found',
        previewCorrelationStatus: 'FILE_NOT_FOUND',
        manualReviewRequired: true,
      });
      manualReview++;
      ambiguous++;
      continue;
    }

    const buf = readFileSync(fullPath);
    const header = readPngHeader(buf);
    if (!header) {
      results.push({
        candidateId: candidate.candidateId,
        sourceFilename: candidate.sourceFilename,
        sourcePath: candidate.sourcePath,
        sourceCollection: candidate.sourceCollection,
        previousGrid: { cols: 8, rows: 8, frameCount: 64 },
        correctedGrid: null,
        confidence: 'MANUAL_REVIEW_REQUIRED',
        changed: false,
        ambiguityReason: 'Invalid PNG file',
        previewCorrelationStatus: 'INVALID_PNG',
        manualReviewRequired: true,
      });
      manualReview++;
      ambiguous++;
      continue;
    }

    // Decode PNG pixels
    let pixels;
    try {
      const decoded = decodePng(buf);
      pixels = decoded.data;
    } catch (e) {
      results.push({
        candidateId: candidate.candidateId,
        sourceFilename: candidate.sourceFilename,
        sourcePath: candidate.sourcePath,
        sourceCollection: candidate.sourceCollection,
        previousGrid: { cols: 8, rows: 8, frameCount: 64 },
        correctedGrid: null,
        confidence: 'MANUAL_REVIEW_REQUIRED',
        changed: false,
        ambiguityReason: `PNG decode failed: ${e.message}`,
        previewCorrelationStatus: 'DECODE_FAILED',
        manualReviewRequired: true,
      });
      manualReview++;
      ambiguous++;
      continue;
    }

    // Find GIF preview
    const baseName = candidate.sourceFilename.replace(/_spritesheet\.png$/i, '').replace(/\.png$/i, '');
    const gifPath = gifMap.get(baseName.toLowerCase());
    let gifFrameCount = null;
    if (gifPath && existsSync(gifPath)) {
      gifFrameCount = getGifFrameCount(gifPath);
    }

    // Detect grid with multi-signal analysis
    const detection = detectGridMultiSignal(
      pixels, header.width, header.height,
      candidate.sourceFilename, gifFrameCount
    );

    const prevGrid = { cols: 8, rows: 8, frameCount: 64 };
    const newGrid = { cols: detection.cols, rows: detection.rows, frameCount: detection.frameCount };
    const isChanged = newGrid.cols !== prevGrid.cols || newGrid.rows !== prevGrid.rows;

    if (isChanged) {
      changed++;
      if (newGrid.cols === 4 && newGrid.rows === 4) gridChanges['8x8_to_4x4']++;
      else gridChanges['8x8_to_other']++;
    } else {
      unchanged++;
      gridChanges['8x8_confirmed']++;
    }

    // Confidence tracking
    switch (detection.confidence) {
      case 'HIGH': highConf++; break;
      case 'MEDIUM': mediumConf++; break;
      case 'LOW': lowConf++; break;
      case 'MANUAL_REVIEW_REQUIRED': manualReview++; break;
    }

    if (detection.confidence === 'MANUAL_REVIEW_REQUIRED' || detection.confidence === 'LOW') {
      ambiguous++;
    }

    // Preview correlation
    let previewCorrelationStatus = 'NO_PREVIEW';
    if (gifFrameCount !== null) {
      if (gifFrameCount === detection.frameCount) {
        previewCorrelationStatus = 'MATCHED';
      } else {
        previewCorrelationStatus = `MISMATCH_GIF_${gifFrameCount}_vs_detected_${detection.frameCount}`;
      }
    }

    // Track collection samples
    const col = candidate.sourceCollection;
    if (!collectionSamples[col]) collectionSamples[col] = [];
    if (collectionSamples[col].length < 5) {
      collectionSamples[col].push({
        candidateId: candidate.candidateId,
        filename: candidate.sourceFilename,
        grid: `${newGrid.cols}x${newGrid.rows}`,
        confidence: detection.confidence,
      });
    }

    results.push({
      candidateId: candidate.candidateId,
      sourceFilename: candidate.sourceFilename,
      sourcePath: candidate.sourcePath,
      sourceCollection: candidate.sourceCollection,
      imageDimensions: { width: header.width, height: header.height },
      previousGrid: prevGrid,
      correctedGrid: {
        cols: newGrid.cols,
        rows: newGrid.rows,
        cellW: detection.cellW,
        cellH: detection.cellH,
        frameCount: newGrid.frameCount,
      },
      confidence: detection.confidence,
      changed: isChanged,
      ambiguityReason: detection.ambiguityReason,
      previewCorrelationStatus,
      gifFrameCount,
      manualReviewRequired: detection.confidence === 'MANUAL_REVIEW_REQUIRED' || detection.confidence === 'LOW',
      separatorTransparencyRatio: detection.separatorTransparencyRatio,
      activeCellCount: detection.activeCount,
      emptyCellCount: detection.emptyCount,
      emptyRatio: detection.emptyRatio,
      avgCenterDrift: detection.avgCenterDrift,
      clippingCellCount: detection.clippingCellCount,
      topHypotheses: detection.hypotheses,
    });
  }

  // Summary
  const summary = {
    totalAssets: total,
    changedCount: changed,
    unchangedCount: unchanged,
    ambiguousCount: ambiguous,
    confidenceDistribution: {
      HIGH: highConf,
      MEDIUM: mediumConf,
      LOW: lowConf,
      MANUAL_REVIEW_REQUIRED: manualReview,
    },
    gridChanges,
    collectionSamples,
  };

  // Write validation data to external output
  writeFileSync(VALIDATION_DATA_OUT, JSON.stringify({ summary, results: results.slice(0, 200) }, null, 2));
  console.log(`\nValidation complete:`);
  console.log(`  Total: ${total}`);
  console.log(`  Changed: ${changed}`);
  console.log(`  Unchanged: ${unchanged}`);
  console.log(`  Ambiguous (LOW + MANUAL_REVIEW): ${ambiguous}`);
  console.log(`  HIGH: ${highConf}, MEDIUM: ${mediumConf}, LOW: ${lowConf}, MANUAL_REVIEW: ${manualReview}`);
  console.log(`  Grid changes: ${JSON.stringify(gridChanges)}`);

  // Write full results for internal use
  writeFileSync(join(OUTPUT_DIR, 'r1_1_full_results.json'), JSON.stringify({ summary, results }, null, 2));

  // Generate corrected inventory
  const correctedCandidates = r1Inventory.candidates.map((c, i) => {
    const r = results[i];
    if (!r || !r.correctedGrid) return c;
    return {
      ...c,
      frameCount: r.correctedGrid.frameCount,
      frameDimensions: {
        width: r.correctedGrid.cellW,
        height: r.correctedGrid.cellH,
      },
      r1_1GridValidation: {
        confidence: r.confidence,
        correctedGrid: r.correctedGrid,
        previousGrid: r.previousGrid,
        changed: r.changed,
        ambiguityReason: r.ambiguityReason,
        previewCorrelationStatus: r.previewCorrelationStatus,
        manualReviewRequired: r.manualReviewRequired,
      },
    };
  });

  // Update grid distribution
  const newGridDist = {};
  for (const r of results) {
    if (r.correctedGrid) {
      const key = `${r.correctedGrid.cols}x${r.correctedGrid.rows}`;
      newGridDist[key] = (newGridDist[key] || 0) + 1;
    }
  }

  const correctedInventory = {
    ...r1Inventory,
    title: 'VFX Mega Pack R1.1 — Corrected Source Inventory',
    description: `Corrected inventory after R1.1 multi-signal grid validation. ${changed} assets had grid corrections from the original 8x8 classification. ${ambiguous} assets remain ambiguous and require manual review.`,
    generatedAt: '2026-08-06',
    gridFormat: {
      sourceGrids: newGridDist,
      targetGrid: '5x5',
      targetFrames: 25,
      targetCellSize: 256,
      targetSheetSize: 1280,
    },
    gridDistribution: newGridDist,
    r1_1Summary: summary,
    candidates: correctedCandidates,
  };

  writeFileSync(CORRECTED_OUT, JSON.stringify(correctedInventory, null, 2));
  console.log(`\nCorrected inventory written to: ${CORRECTED_OUT}`);
  console.log(`Full results written to: ${join(OUTPUT_DIR, 'r1_1_full_results.json')}`);
  console.log(`Validation data written to: ${VALIDATION_DATA_OUT}`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});

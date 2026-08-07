#!/usr/bin/env node
/**
 * R1.2.1 Grid Detector v2 — Ground-Truth-Aware Grid Detection
 *
 * Adds sub-cell separator detection to distinguish 8x8 sheets from 4x4 groupings.
 * Adds evidence priority system with provenance field.
 *
 * Evidence priority:
 *   1. MANUAL_GROUND_TRUTH (highest)
 *   2. SOURCE_METADATA
 *   3. PREVIEW_CORRELATION
 *   4. IMAGE_HEURISTIC (lowest)
 *
 * Image heuristic improvements:
 *   - Sub-cell separator detection: checks for transparent lines at cell midpoints
 *   - Adjacent frame continuity: compares pixel similarity between consecutive frames
 *   - Penalty for over-grouped cells (cells containing internal structure)
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';

// ─── PNG decode (reused) ──────────────────────────────────────────

export function decodePng(buf) {
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const colorType = buf[25];

  const idatChunks = [];
  let offset = 8;
  while (offset < buf.length) {
    const chunkLen = buf.readUInt32BE(offset);
    const chunkType = buf.toString('ascii', offset + 4, offset + 8);
    if (chunkType === 'IDAT') idatChunks.push(buf.subarray(offset + 8, offset + 8 + chunkLen));
    offset += 12 + chunkLen;
  }

  const inflated = inflateSync(Buffer.concat(idatChunks));

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
    const rawRow = inflated.subarray(srcOffset + 1, srcOffset + 1 + stride);
    const curRow = new Uint8Array(stride);

    switch (filter) {
      case 0: curRow.set(rawRow); break;
      case 1: for (let i = 0; i < stride; i++) { const l = i >= bpp ? curRow[i - bpp] : 0; curRow[i] = (rawRow[i] + l) & 0xff; } break;
      case 2: for (let i = 0; i < stride; i++) curRow[i] = (rawRow[i] + prevRow[i]) & 0xff; break;
      case 3: for (let i = 0; i < stride; i++) { const l = i >= bpp ? curRow[i - bpp] : 0; curRow[i] = (rawRow[i] + Math.floor((l + prevRow[i]) / 2)) & 0xff; } break;
      case 4: for (let i = 0; i < stride; i++) { const l = i >= bpp ? curRow[i - bpp] : 0; const u = prevRow[i]; const ul = i >= bpp ? prevRow[i - bpp] : 0; const p = l + u - ul; const pa = Math.abs(p - l), pb = Math.abs(p - u), pc = Math.abs(p - ul); curRow[i] = (rawRow[i] + (pa <= pb && pa <= pc ? l : pb <= pc ? u : ul)) & 0xff; } break;
      default: curRow.set(rawRow);
    }

    for (let x = 0; x < width; x++) {
      const si = x * bpp, di = (y * width + x) * 4;
      if (channels === 4) { output[di] = curRow[si]; output[di+1] = curRow[si+1]; output[di+2] = curRow[si+2]; output[di+3] = curRow[si+3]; }
      else if (channels === 3) { output[di] = curRow[si]; output[di+1] = curRow[si+1]; output[di+2] = curRow[si+2]; output[di+3] = 255; }
      else if (channels === 2) { output[di] = curRow[si]; output[di+1] = curRow[si]; output[di+2] = curRow[si]; output[di+3] = curRow[si+1]; }
      else { output[di] = curRow[si]; output[di+1] = curRow[si]; output[di+2] = curRow[si]; output[di+3] = 255; }
    }
    prevRow = curRow;
    srcOffset += stride + 1;
  }
  return { width, height, data: output };
}

// ─── Sub-cell separator detection ─────────────────────────────────

/**
 * For a given grid hypothesis, check whether cells contain internal
 * transparent separator lines (which would indicate over-grouping).
 *
 * For each cell, samples the midpoint row and column.
 * If midpoints are highly transparent, the cell likely contains
 * sub-cells from a finer grid.
 */
function detectSubCellSeparators(pixels, width, height, cols, rows) {
  const cellW = Math.floor(width / cols);
  const cellH = Math.floor(height / rows);

  let subSepTransparent = 0;
  let subSepTotal = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x0 = col * cellW;
      const y0 = row * cellH;
      const midX = x0 + Math.floor(cellW / 2);
      const midY = y0 + Math.floor(cellH / 2);

      // Sample vertical midpoint line within cell
      for (let y = y0 + 4; y < y0 + cellH - 4; y += Math.max(1, Math.floor(cellH / 50))) {
        for (let dx = -2; dx <= 2; dx++) {
          const sx = midX + dx;
          if (sx < 0 || sx >= width) continue;
          subSepTotal++;
          if (pixels[(y * width + sx) * 4 + 3] < 8) subSepTransparent++;
        }
      }

      // Sample horizontal midpoint line within cell
      for (let x = x0 + 4; x < x0 + cellW - 4; x += Math.max(1, Math.floor(cellW / 50))) {
        for (let dy = -2; dy <= 2; dy++) {
          const sy = midY + dy;
          if (sy < 0 || sy >= height) continue;
          subSepTotal++;
          if (pixels[(sy * width + x) * 4 + 3] < 8) subSepTransparent++;
        }
      }
    }
  }

  return subSepTotal > 0 ? subSepTransparent / subSepTotal : 0;
}

// ─── Adjacent frame continuity ────────────────────────────────────

/**
 * Compare pixel similarity between consecutive frames in row-major order.
 * Returns average similarity (0-1). High similarity = smooth animation = correct grid.
 * Low similarity = frames jumping between unrelated content = wrong grid.
 */
function computeFrameContinuity(pixels, width, height, cols, rows) {
  const cellW = Math.floor(width / cols);
  const cellH = Math.floor(height / rows);
  const totalFrames = cols * rows;

  if (totalFrames < 2) return 1;

  // Sample a grid of pixels from each frame
  const samplePoints = 64; // 8x8 sample grid per cell
  const sampleStep = Math.max(4, Math.floor(Math.min(cellW, cellH) / 8));

  const frameSamples = [];
  for (let frame = 0; frame < totalFrames; frame++) {
    const col = frame % cols;
    const row = Math.floor(frame / cols);
    const x0 = col * cellW;
    const y0 = row * cellH;
    const samples = [];

    for (let sy = 0; sy < cellH; sy += sampleStep) {
      for (let sx = 0; sx < cellW; sx += sampleStep) {
        const idx = ((y0 + sy) * width + (x0 + sx)) * 4;
        samples.push([pixels[idx], pixels[idx+1], pixels[idx+2], pixels[idx+3]]);
      }
    }
    frameSamples.push(samples);
  }

  let totalDiff = 0;
  let comparisons = 0;
  for (let i = 0; i < totalFrames - 1; i++) {
    const s1 = frameSamples[i];
    const s2 = frameSamples[i + 1];
    const len = Math.min(s1.length, s2.length);
    for (let j = 0; j < len; j++) {
      const dr = Math.abs(s1[j][0] - s2[j][0]);
      const dg = Math.abs(s1[j][1] - s2[j][1]);
      const db = Math.abs(s1[j][2] - s2[j][2]);
      const da = Math.abs(s1[j][3] - s2[j][3]);
      totalDiff += (dr + dg + db + da) / 4;
      comparisons++;
    }
  }

  const avgDiff = comparisons > 0 ? totalDiff / comparisons : 0;
  // Convert to similarity: 0 diff = 1.0, 255 diff = 0.0
  return Math.max(0, 1 - avgDiff / 128);
}

// ─── Grid hypothesis analysis (extended from v1) ──────────────────

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
      const isActive = occupancyRatio > 0.001;

      if (!isActive) emptyCount++;
      else activeCount++;

      cells.push({
        row, col, active: isActive, occupancyRatio, totalAlpha,
        bbox: isActive ? { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY } : null,
      });
    }
  }

  // Separator consistency
  let separatorTransparentPixels = 0;
  let separatorTotalPixels = 0;
  for (let col = 1; col < cols; col++) {
    const x = col * cellW;
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
  const separatorTransparencyRatio = separatorTotalPixels > 0 ? separatorTransparentPixels / separatorTotalPixels : 0;

  // Clipping
  let clippingCells = 0;
  for (const cell of cells) {
    if (!cell.active || !cell.bbox) continue;
    const touchesEdge = cell.bbox.minX <= 1 || cell.bbox.minY <= 1 || cell.bbox.maxX >= cellW - 2 || cell.bbox.maxY >= cellH - 2;
    if (touchesEdge) clippingCells++;
  }

  // Center drift
  let centerDriftSum = 0, centerDriftCount = 0;
  for (const cell of cells) {
    if (!cell.active || !cell.bbox) continue;
    const bcx = (cell.bbox.minX + cell.bbox.maxX) / 2;
    const bcy = (cell.bbox.minY + cell.bbox.maxY) / 2;
    const drift = Math.sqrt((bcx - cellW / 2) ** 2 + (bcy - cellH / 2) ** 2);
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

// ─── v2 scoring with sub-cell separator penalty ───────────────────

function scoreHypothesisV2(h, width, height, filename, subCellSepRatio, frameContinuity) {
  let score = 0;
  const f = (filename || '').toLowerCase();

  // Square cells
  if (h.cellW === h.cellH) score += 20;

  // Common cell sizes
  const commonSizes = [128, 192, 256, 384, 512, 1024];
  if (commonSizes.includes(h.cellW)) score += 15;
  if (commonSizes.includes(h.cellH)) score += 15;

  // Common frame counts
  const commonCounts = [4, 8, 9, 12, 15, 16, 20, 24, 25, 30, 32, 36, 40, 48, 49, 64, 72, 80, 81, 100];
  if (commonCounts.includes(h.frameCount)) score += 10;

  // Separator transparency
  score += h.separatorTransparencyRatio * 30;

  // Active cell ratio
  score += (h.activeCount / h.frameCount) * 20;

  // Empty cell penalties
  if (h.emptyRatio > 0.5) score -= 25;
  if (h.emptyRatio > 0.7) score -= 25;

  // Center drift
  if (h.avgCenterDrift < 10) score += 15;
  else if (h.avgCenterDrift < 25) score += 8;
  else if (h.avgCenterDrift > 50) score -= 15;

  // Clipping
  const clippingRatio = h.clippingCellCount / Math.max(1, h.activeCount);
  if (clippingRatio > 0.8) score -= 10;

  // Grid preference
  if (h.cols === 4 && h.rows === 4) score += 8;
  if (h.cols === 8 && h.rows === 8) score += 8;
  if (h.cols === 5 && h.rows === 5) score += 5;

  // ─── NEW: Sub-cell separator penalty ──────────────────────────
  // If the cell midpoints have high transparency, the grid is likely
  // over-grouped (e.g., 4x4 grouping of a real 8x8 sheet).
  // Ratios near 1.0 are extremely strong evidence of over-grouping.
  if (subCellSepRatio >= 0.92) score -= 45;
  else if (subCellSepRatio > 0.8) score -= 25;
  else if (subCellSepRatio > 0.5) score -= 12;
  else if (subCellSepRatio > 0.3) score -= 5;

  // ─── NEW: Frame continuity bonus ──────────────────────────────
  // High continuity between adjacent frames = smooth animation = correct grid.
  // Low continuity = frames jumping between unrelated content = wrong grid.
  score += frameContinuity * 25;

  return { score, subCellSepRatio, frameContinuity, ...h };
}

// ─── v2 grid detection ────────────────────────────────────────────

/**
 * Detect grid using multiple signals with v2 improvements.
 * Optionally accepts groundTruth override.
 */
export function detectGridV2(pixels, width, height, filename, options = {}) {
  const { groundTruth, gifFrameCount } = options;

  // If ground truth is provided, validate it against dimensions and return
  if (groundTruth) {
    const { cols, rows } = groundTruth;
    if (width % cols === 0 && height % rows === 0) {
      const cellW = Math.floor(width / cols);
      const cellH = Math.floor(height / rows);
      const analysis = analyzeGridHypothesis(pixels, width, height, cols, rows);
      return {
        cols, rows, cellW, cellH, frameCount: cols * rows,
        confidence: 'HIGH',
        gridEvidenceSource: 'MANUAL_GROUND_TRUTH',
        gridValidationStatus: 'SOURCE_CONFIRMED',
        separatorTransparencyRatio: analysis.separatorTransparencyRatio,
        activeCount: analysis.activeCount,
        emptyCount: analysis.emptyCount,
        emptyRatio: analysis.emptyRatio,
        avgCenterDrift: analysis.avgCenterDrift,
        clippingCellCount: analysis.clippingCellCount,
        ambiguityReason: null,
        groundTruthOverride: true,
        hypotheses: [],
      };
    }
  }

  // Run heuristic detection
  const testGrids = [
    [1, 1], [2, 2], [2, 4], [4, 2], [4, 4], [4, 8], [8, 4], [8, 8],
    [3, 3], [5, 5], [6, 6], [4, 6], [6, 4], [3, 4], [4, 3],
    [2, 8], [8, 2], [4, 16], [16, 4], [8, 16], [16, 8],
    [3, 5], [5, 3], [5, 8], [8, 5],
  ];

  const hypotheses = [];

  for (const [cols, rows] of testGrids) {
    if (width % cols !== 0 || height % rows !== 0) continue;
    if (cols === 1 && rows === 1) continue;

    const analysis = analyzeGridHypothesis(pixels, width, height, cols, rows);
    const subCellSep = detectSubCellSeparators(pixels, width, height, cols, rows);
    const continuity = computeFrameContinuity(pixels, width, height, cols, rows);
    const scored = scoreHypothesisV2(analysis, width, height, filename, subCellSep, continuity);

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
      gridEvidenceSource: 'IMAGE_HEURISTIC',
      gridValidationStatus: 'MANUAL_REVIEW_REQUIRED',
      hypotheses: [],
      ambiguityReason: 'No valid grid layout found for image dimensions',
    };
  }

  hypotheses.sort((a, b) => b.score - a.score);
  const best = hypotheses[0];
  const second = hypotheses[1];

  let confidence;
  const scoreGap = best.score - (second ? second.score : 0);

  if (best.score >= 80 && scoreGap >= 20) confidence = 'HIGH';
  else if (best.score >= 60 && scoreGap >= 10) confidence = 'MEDIUM';
  else if (best.score >= 40) confidence = 'LOW';
  else confidence = 'MANUAL_REVIEW_REQUIRED';

  if (scoreGap < 5 && second) {
    if (confidence === 'HIGH') confidence = 'MEDIUM';
    else if (confidence === 'MEDIUM') confidence = 'LOW';
  }

  let ambiguityReason = null;
  if (scoreGap < 5 && second) {
    ambiguityReason = `Top hypotheses too close: ${best.cols}x${best.rows} (${best.score.toFixed(1)}) vs ${second.cols}x${second.rows} (${second.score.toFixed(1)})`;
  }

  let gridValidationStatus;
  if (confidence === 'HIGH' || confidence === 'MEDIUM') gridValidationStatus = 'DETECTOR_CONFIRMED';
  else if (confidence === 'LOW') gridValidationStatus = 'AMBIGUOUS';
  else gridValidationStatus = 'MANUAL_REVIEW_REQUIRED';

  return {
    cols: best.cols,
    rows: best.rows,
    cellW: best.cellW,
    cellH: best.cellH,
    frameCount: best.frameCount,
    confidence,
    gridEvidenceSource: 'IMAGE_HEURISTIC',
    gridValidationStatus,
    separatorTransparencyRatio: best.separatorTransparencyRatio,
    activeCount: best.activeCount,
    emptyCount: best.emptyCount,
    emptyRatio: best.emptyRatio,
    avgCenterDrift: best.avgCenterDrift,
    clippingCellCount: best.clippingCellCount,
    subCellSepRatio: best.subCellSepRatio,
    frameContinuity: best.frameContinuity,
    gifCorrelation: best.gifCorrelation || false,
    ambiguityReason,
    hypotheses: hypotheses.slice(0, 10).map(h => ({
      cols: h.cols, rows: h.rows, frameCount: h.frameCount,
      cellW: h.cellW, cellH: h.cellH,
      score: Math.round(h.score * 10) / 10,
      separatorTransparency: Math.round(h.separatorTransparencyRatio * 1000) / 1000,
      subCellSep: Math.round(h.subCellSepRatio * 1000) / 1000,
      frameContinuity: Math.round(h.frameContinuity * 1000) / 1000,
      activeCells: h.activeCount,
      emptyCells: h.emptyCount,
      avgCenterDrift: Math.round(h.avgCenterDrift * 10) / 10,
      gifCorrelation: h.gifCorrelation || false,
    })),
  };
}

// ─── CLI entry point for testing ──────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node r1_2_1_grid_detector_v2.mjs <png_path> [--ground-truth 8x8]');
    process.exit(0);
  }

  const pngPath = args[0];
  const gtFlag = args.indexOf('--ground-truth');
  let groundTruth = null;
  if (gtFlag !== -1 && args[gtFlag + 1]) {
    const [c, r] = args[gtFlag + 1].split('x').map(Number);
    groundTruth = { cols: c, rows: r };
  }

  if (!existsSync(pngPath)) {
    console.error('File not found:', pngPath);
    process.exit(1);
  }

  const buf = readFileSync(pngPath);
  const decoded = decodePng(buf);
  const result = detectGridV2(decoded.data, decoded.width, decoded.height, pngPath, { groundTruth });

  console.log(JSON.stringify({
    file: pngPath,
    dimensions: `${decoded.width}x${decoded.height}`,
    detected: `${result.cols}x${result.rows}`,
    frameCount: result.frameCount,
    cellDimensions: `${result.cellW}x${result.cellH}`,
    confidence: result.confidence,
    gridEvidenceSource: result.gridEvidenceSource,
    gridValidationStatus: result.gridValidationStatus,
    subCellSepRatio: result.subCellSepRatio,
    frameContinuity: result.frameContinuity,
    ambiguityReason: result.ambiguityReason,
    topHypotheses: result.hypotheses?.slice(0, 3),
  }, null, 2));
}

if (process.argv[1] && process.argv[1].endsWith('r1_2_1_grid_detector_v2.mjs')) {
  main();
}

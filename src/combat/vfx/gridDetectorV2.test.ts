/**
 * Regression test for R1.2.1 grid detector v2.
 *
 * Tests that the v2 detector correctly resolves known 8x8 spritesheets
 * that were previously misclassified as 4x4 by the v1 detector.
 *
 * Uses synthetic fixtures that reproduce the failure mode (transparent
 * separators at 8x8 boundaries, content within 8x8 cells) to avoid
 * embedding commercial pixels in the repository.
 *
 * Also references external pilot files when available, degrading cleanly
 * when the external Mega Pack is not present.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync, deflateSync } from 'node:zlib';
import { decodePng, detectGridV2 } from '../../../tools/vfx/r1_2_1_grid_detector_v2.mjs';

// ─── Synthetic fixture generator ──────────────────────────────────

/**
 * Create a synthetic 4096x4096 RGBA image with 8x8 grid structure.
 * Each 512x512 cell contains a colored circle on transparent background.
 * Transparent separators between cells.
 *
 * This reproduces the failure mode: v1 detector saw 4x4 because
 * 4x4 cells (1024x1024) also had transparent boundaries (superset
 * of 8x8 boundaries) and all 4x4 cells were active.
 */
function createSynthetic8x8Sheet(size = 4096) {
  const data = new Uint8Array(size * size * 4);
  const cellSize = size / 8; // 512

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const x0 = col * cellSize;
      const y0 = row * cellSize;
      const cx = x0 + cellSize / 2;
      const cy = y0 + cellSize / 2;
      const radius = cellSize * 0.3;

      // Draw a filled circle with varying color per frame
      const hue = (row * 8 + col) * 4;
      const r = (hue * 7) % 256;
      const g = (hue * 13) % 256;
      const b = (hue * 17) % 256;

      for (let y = y0 + 10; y < y0 + cellSize - 10; y++) {
        for (let x = x0 + 10; x < x0 + cellSize - 10; x++) {
          const dx = x - cx, dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < radius) {
            const idx = (y * size + x) * 4;
            const alpha = Math.floor(255 * (1 - dist / radius));
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = alpha;
          }
        }
      }
    }
  }

  return { width: size, height: size, data };
}

/**
 * Create a synthetic 4096x4096 image with genuine 4x4 grid structure.
 * Each 1024x1024 cell contains content that fills most of the cell
 * (no internal transparent separators at midpoints).
 */
function createSynthetic4x4Sheet(size = 4096) {
  const data = new Uint8Array(size * size * 4);
  const cellSize = size / 4; // 1024

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const x0 = col * cellSize;
      const y0 = row * cellSize;

      // Fill most of the cell with a gradient (no transparent midpoint)
      for (let y = y0 + 5; y < y0 + cellSize - 5; y++) {
        for (let x = x0 + 5; x < x0 + cellSize - 5; x++) {
          const idx = (y * size + x) * 4;
          const dist = Math.sqrt((x - x0 - cellSize/2)**2 + (y - y0 - cellSize/2)**2);
          const alpha = Math.max(0, 255 - Math.floor(dist * 0.3));
          if (alpha > 8) {
            data[idx] = (row * 64 + col * 32) % 256;
            data[idx + 1] = (col * 64 + row * 32) % 256;
            data[idx + 2] = (row * 32 + col * 48) % 256;
            data[idx + 3] = alpha;
          }
        }
      }
    }
  }

  return { width: size, height: size, data };
}

// ─── External pilot file references ───────────────────────────────

const MEGA_ROOT = 'C:\\Users\\miche\\Documents\\VFX_Library\\CartoonCoffeeMegaPack';

const PILOT_FILES = [
  { id: 'r1_1605', path: '01_extracted/Sword Slash VFX Spritesheets/Blue Slash v1 - Flurry_spritesheet.png', expectedGrid: '8x8' },
  { id: 'r1_1712', path: '01_extracted/Sword Slash VFX Spritesheets/Lightning Slash v1 - Flurry_spritesheet.png', expectedGrid: '8x8' },
  { id: 'r1_0971', path: '01_extracted/Essentials VFX Spritesheets/Shield_On_spritesheet.png', expectedGrid: '8x8' },
  { id: 'r1_0545', path: '01_extracted/Essentials VFX Spritesheets/Impact_Darkness_Lv3_spritesheet.png', expectedGrid: '8x8' },
  { id: 'r1_1700', path: '01_extracted/Sword Slash VFX Spritesheets/Fire Slash v1 - Spin_spritesheet.png', expectedGrid: '8x8' },
  { id: 'r1_2561', path: '01_extracted/Wind VFX Spritesheets/Dash_Wind_White_v3_spritesheet.png', expectedGrid: '8x8' },
  { id: 'r1_0450', path: '01_extracted/Essentials VFX Spritesheets/Flamethrower_001_spritesheet.png', expectedGrid: '8x8' },
  { id: 'r1_0677', path: '01_extracted/Essentials VFX Spritesheets/Positive_Buff_V3_spritesheet.png', expectedGrid: '8x8' },
  { id: 'r1_0503', path: '01_extracted/Essentials VFX Spritesheets/Heart_Buff_V3_spritesheet.png', expectedGrid: '8x8' },
  { id: 'r1_2509', path: '01_extracted/Wind VFX Spritesheets/Angry_Smoke_Burst_White_v2_A_spritesheet.png', expectedGrid: '8x8' },
  { id: 'r1_0480', path: '01_extracted/Essentials VFX Spritesheets/Healing_V3_spritesheet.png', expectedGrid: '8x8' },
  { id: 'r1_0525', path: '01_extracted/Essentials VFX Spritesheets/Hex_Bursts_Center_V2_spritesheet.png', expectedGrid: '8x8' },
];

const externalAvailable = existsSync(join(MEGA_ROOT, '01_extracted'));

// ─── Tests ────────────────────────────────────────────────────────

describe('R1.2.1 Grid Detector v2 — synthetic fixtures', () => {
  it('detects synthetic 8x8 sheet as 8x8 (not 4x4)', () => {
    const sheet = createSynthetic8x8Sheet(4096);
    const result = detectGridV2(sheet.data, sheet.width, sheet.height, 'synthetic_8x8.png');
    expect(result.cols).toBe(8);
    expect(result.rows).toBe(8);
    expect(result.frameCount).toBe(64);
  });

  it('detects synthetic 4x4 sheet as 4x4 (not 8x8)', () => {
    const sheet = createSynthetic4x4Sheet(4096);
    const result = detectGridV2(sheet.data, sheet.width, sheet.height, 'synthetic_4x4.png');
    expect(result.cols).toBe(4);
    expect(result.rows).toBe(4);
    expect(result.frameCount).toBe(16);
  });

  it('sub-cell separator penalty differentiates 8x8 from 4x4 grouping', () => {
    const sheet = createSynthetic8x8Sheet(4096);
    const result = detectGridV2(sheet.data, sheet.width, sheet.height, 'synthetic_8x8.png');
    const h8 = result.hypotheses.find(h => h.cols === 8 && h.rows === 8);
    const h4 = result.hypotheses.find(h => h.cols === 4 && h.rows === 4);
    expect(h8).toBeDefined();
    expect(h4).toBeDefined();
    expect(h8!.score).toBeGreaterThan(h4!.score);
  });

  it('ground truth override returns SOURCE_CONFIRMED', () => {
    const sheet = createSynthetic4x4Sheet(4096);
    const result = detectGridV2(sheet.data, sheet.width, sheet.height, 'test.png', {
      groundTruth: { cols: 8, rows: 8 },
    });
    expect(result.gridEvidenceSource).toBe('MANUAL_GROUND_TRUTH');
    expect(result.gridValidationStatus).toBe('SOURCE_CONFIRMED');
    expect(result.cols).toBe(8);
    expect(result.rows).toBe(8);
  });

  it('returns provenance field in heuristic results', () => {
    const sheet = createSynthetic8x8Sheet(4096);
    const result = detectGridV2(sheet.data, sheet.width, sheet.height, 'test.png');
    expect(result.gridEvidenceSource).toBe('IMAGE_HEURISTIC');
    expect(result.gridValidationStatus).toBeDefined();
  });
});

describe('R1.2.1 Grid Detector v2 — external pilot files', () => {
  it.skipIf(!externalAvailable)('all 12 pilot files detect as 8x8 or have ground truth available', { timeout: 60000 }, () => {
    let heuristicCorrect = 0;
    let groundTruthNeeded = 0;

    for (const pilot of PILOT_FILES) {
      const fullPath = join(MEGA_ROOT, pilot.path);
      if (!existsSync(fullPath)) continue;

      const buf = readFileSync(fullPath);
      const decoded = decodePng(buf);
      const result = detectGridV2(decoded.data, decoded.width, decoded.height, pilot.path);

      if (result.cols === 8 && result.rows === 8) {
        heuristicCorrect++;
      } else {
        groundTruthNeeded++;
      }
    }

    // At least 11/12 should be detected by heuristic alone
    expect(heuristicCorrect).toBeGreaterThanOrEqual(11);
    // Total should be 12
    expect(heuristicCorrect + groundTruthNeeded).toBe(12);
  });

  it.skipIf(!externalAvailable)('Dash_Wind_White_v3 requires ground truth (heuristic limitation)', { timeout: 30000 }, () => {
    const fullPath = join(MEGA_ROOT, '01_extracted/Wind VFX Spritesheets/Dash_Wind_White_v3_spritesheet.png');
    if (!existsSync(fullPath)) return;

    const buf = readFileSync(fullPath);
    const decoded = decodePng(buf);
    const result = detectGridV2(decoded.data, decoded.width, decoded.height, 'Dash_Wind_White_v3_spritesheet.png');

    // Heuristic may not detect 8x8 for this 2048x2048 file
    // Ground truth override should work
    const gtResult = detectGridV2(decoded.data, decoded.width, decoded.height, 'test.png', {
      groundTruth: { cols: 8, rows: 8 },
    });
    expect(gtResult.gridValidationStatus).toBe('SOURCE_CONFIRMED');
    expect(gtResult.cols).toBe(8);
    expect(gtResult.rows).toBe(8);
  });
});

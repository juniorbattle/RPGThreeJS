#!/usr/bin/env node
/**
 * R1.2 Pilot Review Gallery Generator
 *
 * Generates external visual review package for the 13 proposed R2 pilot candidates.
 * For each target: thumbnails, grid overlays, animated GIFs, contact sheets,
 * alpha-boundary overlays, key frame extracts, and HTML review index.
 *
 * All output: <MEGA_PACK_ROOT>/03_inventory_output/r1_2_pilot_review/
 * No commercial images are placed inside the repository.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync, deflateSync } from 'node:zlib';

const MEGA_ROOT = 'C:\\Users\\miche\\Documents\\VFX_Library\\CartoonCoffeeMegaPack';
const REVIEW_DIR = join(MEGA_ROOT, '03_inventory_output', 'r1_2_pilot_review');
const REPO = 'c:\\Users\\miche\\Documents\\Projects\\RPGThreeJS';
const CORRECTED_INV = join(REPO, 'docs/reports/vfx-megapack-r1-1-corrected-inventory.json');

mkdirSync(REVIEW_DIR, { recursive: true });

// ─── 13 Pilot Targets ─────────────────────────────────────────────

const PILOT_TARGETS = [
  // P0 Replacements (5 target sheets, 6 actions)
  {
    targetId: 'p0_1',
    category: 'P0_REPLACEMENT',
    targetSheet: 'basic_execution_slash_heavy',
    actions: ['w_lion_surge', 'ni_shadow_step'],
    actionDetails: [
      { actionId: 'w_lion_surge', unit: 'Warrior', slot: 'ultimate', mechanic: 'Line charge execution slash, 5AP ultimate', requiredVisualFamily: 'ultimate' },
      { actionId: 'ni_shadow_step', unit: 'Ninja', slot: 'skill2', mechanic: 'Shadow step strike, 3AP, teleport-strike', requiredVisualFamily: 'slash' },
    ],
    candidates: [
      { candidateId: 'r1_1605', filename: 'Blue Slash v1 - Flurry_spritesheet.png', rank: 1, forAction: 'w_lion_surge' },
      { candidateId: 'r1_1712', filename: 'Lightning Slash v1 - Flurry_spritesheet.png', rank: 2, forAction: 'ni_shadow_step' },
    ],
  },
  {
    targetId: 'p0_2',
    category: 'P0_REPLACEMENT',
    targetSheet: 'skill_barrier_guard_heavy',
    actions: ['p_oathwall'],
    actionDetails: [
      { actionId: 'p_oathwall', unit: 'Paladin', slot: 'skill3', mechanic: 'Defensive barrier wall with shield ring, 4AP', requiredVisualFamily: 'barrier' },
    ],
    candidates: [
      { candidateId: 'r1_0971', filename: 'Shield_On_spritesheet.png', rank: 1, forAction: 'p_oathwall' },
    ],
  },
  {
    targetId: 'p0_3',
    category: 'P0_REPLACEMENT',
    targetSheet: 'skill_meteor_impact_burst_heavy',
    actions: ['n_dark_meteor'],
    actionDetails: [
      { actionId: 'n_dark_meteor', unit: 'Black Mage', slot: 'ultimate', mechanic: 'Void/dark meteor, 5AP ultimate, radius_1.5', requiredVisualFamily: 'implosion' },
    ],
    candidates: [
      { candidateId: 'r1_0545', filename: 'Impact_Darkness_Lv3_spritesheet.png', rank: 1, forAction: 'n_dark_meteor' },
    ],
  },
  {
    targetId: 'p0_4',
    category: 'P0_REPLACEMENT',
    targetSheet: 'skill_void_singularity_implosion_ultimate',
    actions: ['d_devouring_eclipse'],
    actionDetails: [
      { actionId: 'd_devouring_eclipse', unit: 'Dark Knight', slot: 'ultimate', mechanic: 'Void singularity implosion, 5AP ultimate, radius_1.5', requiredVisualFamily: 'implosion' },
    ],
    candidates: [
      { candidateId: 'r1_0545', filename: 'Impact_Darkness_Lv3_spritesheet.png', rank: 1, forAction: 'd_devouring_eclipse' },
    ],
  },
  {
    targetId: 'p0_5',
    category: 'P0_REPLACEMENT',
    targetSheet: 'skill_wind_slash_swirl_medium',
    actions: ['w_whirl'],
    actionDetails: [
      { actionId: 'w_whirl', unit: 'Warrior', slot: 'skill3', mechanic: 'Circular slash whirlwind, 4AP, radius_1', requiredVisualFamily: 'swirl' },
    ],
    candidates: [
      { candidateId: 'r1_1700', filename: 'Fire Slash v1 - Spin_spritesheet.png', rank: 1, forAction: 'w_whirl' },
    ],
  },
  // Semantic Mismatch Corrections (3)
  {
    targetId: 'sem_1',
    category: 'SEMANTIC_MISMATCH',
    targetSheet: 'basic_hammer_crush_heavy',
    actions: ['w_charge'],
    actionDetails: [
      { actionId: 'w_charge', unit: 'Warrior', slot: 'skill2', mechanic: 'Directional dash/ram, 3AP, range 2-3, slow status', requiredVisualFamily: 'charge' },
    ],
    candidates: [
      { candidateId: 'r1_2561', filename: 'Dash_Wind_White_v3_spritesheet.png', rank: 1, forAction: 'w_charge' },
    ],
  },
  {
    targetId: 'sem_2',
    category: 'SEMANTIC_MISMATCH',
    targetSheet: 'basic_body_slam_heavy',
    actions: ['p_interpose'],
    actionDetails: [
      { actionId: 'p_interpose', unit: 'Paladin', slot: 'skill2', mechanic: 'Protective leap with barrier_allies, 3AP, range 2-3', requiredVisualFamily: 'shield' },
    ],
    candidates: [
      { candidateId: 'r1_0971', filename: 'Shield_On_spritesheet.png', rank: 1, forAction: 'p_interpose' },
    ],
  },
  {
    targetId: 'sem_3',
    category: 'SEMANTIC_MISMATCH',
    targetSheet: 'skill_fire_impact_burst_medium',
    actions: ['n_flame_wave'],
    actionDetails: [
      { actionId: 'n_flame_wave', unit: 'Black Mage', slot: 'skill3', mechanic: 'Directional fire cone, 4AP, cone_radius_1.6, burn', requiredVisualFamily: 'directional_wave' },
    ],
    candidates: [
      { candidateId: 'r1_0450', filename: 'Flamethrower_001_spritesheet.png', rank: 1, forAction: 'n_flame_wave' },
    ],
  },
  // Status/Loop Effects (5)
  {
    targetId: 'stat_1',
    category: 'STATUS_LOOP',
    targetSheet: 'skill_support_leaf_burst_medium',
    actions: ['w_sanctuary'],
    actionDetails: [
      { actionId: 'w_sanctuary', unit: 'White Mage', slot: 'skill3', mechanic: 'Nature sanctuary area regen, 4AP, radius_1.3', requiredVisualFamily: 'aura' },
    ],
    candidates: [
      { candidateId: 'r1_0677', filename: 'Positive_Buff_V3_spritesheet.png', rank: 1, forAction: 'w_sanctuary' },
    ],
  },
  {
    targetId: 'stat_2',
    category: 'STATUS_LOOP',
    targetSheet: 'skill_arcane_orbit_burst_medium',
    actions: ['e_vigor_rune'],
    actionDetails: [
      { actionId: 'e_vigor_rune', unit: 'Enchanter', slot: 'skill1', mechanic: 'Arcane orbit buff on ally, 2AP, boost status', requiredVisualFamily: 'buff' },
    ],
    candidates: [
      { candidateId: 'r1_0503', filename: 'Heart_Buff_V3_spritesheet.png', rank: 1, forAction: 'e_vigor_rune' },
    ],
  },
  {
    targetId: 'stat_3',
    category: 'STATUS_LOOP',
    targetSheet: 'skill_void_spiral_implosion_medium',
    actions: ['ni_smoke_bomb'],
    actionDetails: [
      { actionId: 'ni_smoke_bomb', unit: 'Ninja', slot: 'skill3', mechanic: 'Smoke bomb blind area, 4AP, radius_1.5, blind_barrier', requiredVisualFamily: 'smoke' },
    ],
    candidates: [
      { candidateId: 'r1_2509', filename: 'Angry_Smoke_Burst_White_v2_A_spritesheet.png', rank: 1, forAction: 'ni_smoke_bomb' },
    ],
  },
  {
    targetId: 'stat_4',
    category: 'STATUS_LOOP',
    targetSheet: 'skill_heal_blessing_bloom_heavy',
    actions: ['w_salvation'],
    actionDetails: [
      { actionId: 'w_salvation', unit: 'White Mage', slot: 'skill1', mechanic: 'Heal bloom on ally, 2AP, single_ally', requiredVisualFamily: 'heal' },
    ],
    candidates: [
      { candidateId: 'r1_0480', filename: 'Healing_V3_spritesheet.png', rank: 1, forAction: 'w_salvation' },
    ],
  },
  {
    targetId: 'stat_5',
    category: 'STATUS_LOOP',
    targetSheet: 'skill_arcane_sigil_burst_medium',
    actions: ['e_binding_seal'],
    actionDetails: [
      { actionId: 'e_binding_seal', unit: 'Enchanter', slot: 'skill3', mechanic: 'Binding seal root area, 4AP, radius_1.2, root', requiredVisualFamily: 'debuff' },
    ],
    candidates: [
      { candidateId: 'r1_0525', filename: 'Hex_Bursts_Center_V2_spritesheet.png', rank: 1, forAction: 'e_binding_seal' },
    ],
  },
];

// ─── PNG decode/encode (reused from R1.1) ─────────────────────────

function decodePng(buf) {
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

// CRC32 for PNG encoding
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c; }
function crc32(buf) { let crc = 0xffffffff; for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8); return crc ^ 0xffffffff; }

function makePngChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) { raw[y * (stride + 1)] = 0; for (let x = 0; x < stride; x++) raw[y * (stride + 1) + 1 + x] = rgba[y * stride + x]; }
  const compressed = deflateSync(raw, { level: 6 });
  return Buffer.concat([sig, makePngChunk('IHDR', ihdr), makePngChunk('IDAT', compressed), makePngChunk('IEND', Buffer.alloc(0))]);
}

// ─── GIF encoder (minimal GIF89a with LZW) ────────────────────────

function encodeGif(frames, width, height, delayCs) {
  // Color quantization: build a palette from all frames
  const colorMap = new Map();
  const palette = [];
  palette.push([0, 0, 0]); // index 0 = transparent (black)

  for (const frame of frames) {
    for (let i = 0; i < frame.length; i += 4) {
      const a = frame[i + 3];
      if (a < 128) continue; // transparent
      const r = frame[i] >> 4 << 4, g = frame[i + 1] >> 4 << 4, b = frame[i + 2] >> 4 << 4;
      const key = (r << 16) | (g << 8) | b;
      if (!colorMap.has(key)) {
        if (palette.length >= 256) continue;
        colorMap.set(key, palette.length);
        palette.push([r, g, b]);
      }
    }
  }

  // Pad palette to power of 2
  let palBits = 2;
  while (Math.pow(2, palBits) < palette.length) palBits++;
  if (palBits < 2) palBits = 2;
  const palSize = Math.pow(2, palBits);
  while (palette.length < palSize) palette.push([0, 0, 0]);

  // Build GIF
  const parts = [];
  // Header
  parts.push(Buffer.from('GIF89a'));
  // Logical Screen Descriptor
  const lsd = Buffer.alloc(7);
  lsd.writeUInt16LE(width, 0); lsd.writeUInt16LE(height, 2);
  lsd[4] = 0x80 | ((palBits - 1) << 4) | (palBits - 1); // GCT flag | color resolution | sort | GCT size
  lsd[5] = 0; // background color index
  lsd[6] = 0; // pixel aspect ratio
  parts.push(lsd);
  // Global Color Table
  const gct = Buffer.alloc(palSize * 3);
  for (let i = 0; i < palSize; i++) { gct[i * 3] = palette[i][0]; gct[i * 3 + 1] = palette[i][1]; gct[i * 3 + 2] = palette[i][2]; }
  parts.push(gct);

  // Netscape extension for looping
  parts.push(Buffer.from([0x21, 0xFF, 0x0B, 0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2E, 0x30, 0x03, 0x01, 0x00, 0x00, 0x00]));

  for (const frame of frames) {
    // Graphic Control Extension
    const gce = Buffer.alloc(8);
    gce[0] = 0x21; gce[1] = 0xF9; gce[2] = 4;
    gce[3] = 0x09; // transparent + disposal
    gce.writeUInt16LE(delayCs, 4); // delay in centiseconds
    gce[6] = 0; // transparent color index
    gce[7] = 0;
    parts.push(gce);

    // Image Descriptor
    const id = Buffer.alloc(10);
    id[0] = 0x2C;
    id.writeUInt16LE(0, 1); id.writeUInt16LE(0, 3); // left, top
    id.writeUInt16LE(width, 5); id.writeUInt16LE(height, 7); // width, height
    id[9] = 0; // no local color table
    parts.push(id);

    // LZW compressed image data
    const indices = new Uint8Array(width * height);
    for (let i = 0; i < frame.length; i += 4) {
      const idx = i / 4;
      const a = frame[i + 3];
      if (a < 128) { indices[idx] = 0; continue; }
      const r = frame[i] >> 4 << 4, g = frame[i + 1] >> 4 << 4, b = frame[i + 2] >> 4 << 4;
      const key = (r << 16) | (g << 8) | b;
      indices[idx] = colorMap.get(key) || 0;
    }

    const lzwData = lzwEncode(indices, palBits);
    parts.push(Buffer.from([palBits])); // LZW minimum code size

    // Split into sub-blocks
    let pos = 0;
    while (pos < lzwData.length) {
      const remaining = lzwData.length - pos;
      const blockLen = Math.min(remaining, 255);
      parts.push(Buffer.from([blockLen]));
      parts.push(lzwData.subarray(pos, pos + blockLen));
      pos += blockLen;
    }
    parts.push(Buffer.from([0])); // block terminator
  }

  parts.push(Buffer.from([0x3B])); // trailer
  return Buffer.concat(parts);
}

function lzwEncode(indices, colorBits) {
  const minCodeSize = Math.max(2, colorBits);
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let nextCode = eoiCode + 1;
  let codeSize = minCodeSize + 1;

  const dict = new Map();
  for (let i = 0; i < clearCode; i++) dict.set(String.fromCharCode(i), i);

  const output = [];
  const bitBuffer = [];
  let pos = 0;

  function emitCode(code) {
    for (let i = 0; i < codeSize; i++) {
      bitBuffer.push((code >> i) & 1);
    }
    while (bitBuffer.length >= 8) {
      let byte = 0;
      for (let i = 0; i < 8; i++) byte |= bitBuffer[i] << i;
      output.push(byte);
      bitBuffer.splice(0, 8);
    }
  }

  emitCode(clearCode);
  let w = '';

  for (let i = 0; i < indices.length; i++) {
    const c = String.fromCharCode(indices[i]);
    const wc = w + c;
    if (dict.has(wc)) {
      w = wc;
    } else {
      emitCode(dict.get(w));
      if (nextCode < 4096) {
        dict.set(wc, nextCode);
        nextCode++;
        if (nextCode > (1 << codeSize) && codeSize < 12) codeSize++;
      } else {
        emitCode(clearCode);
        dict.clear();
        for (let j = 0; j < clearCode; j++) dict.set(String.fromCharCode(j), j);
        nextCode = eoiCode + 1;
        codeSize = minCodeSize + 1;
      }
      w = c;
    }
  }

  if (w.length > 0) emitCode(dict.get(w));
  emitCode(eoiCode);

  // Flush remaining bits
  if (bitBuffer.length > 0) {
    let byte = 0;
    for (let i = 0; i < bitBuffer.length; i++) byte |= bitBuffer[i] << i;
    output.push(byte);
  }

  return Buffer.from(output);
}

// ─── Visual evidence generators ───────────────────────────────────

function downscaleRgba(data, srcW, srcH, dstW, dstH) {
  const out = new Uint8Array(dstW * dstH * 4);
  const xRatio = srcW / dstW, yRatio = srcH / dstH;
  for (let y = 0; y < dstH; y++) {
    for (let x = 0; x < dstW; x++) {
      const sx = Math.floor(x * xRatio), sy = Math.floor(y * yRatio);
      const si = (sy * srcW + sx) * 4, di = (y * dstW + x) * 4;
      out[di] = data[si]; out[di+1] = data[si+1]; out[di+2] = data[si+2]; out[di+3] = data[si+3];
    }
  }
  return out;
}

function extractFrame(data, srcW, cellW, cellH, col, row) {
  const frame = new Uint8Array(cellW * cellH * 4);
  for (let y = 0; y < cellH; y++) {
    for (let x = 0; x < cellW; x++) {
      const sx = col * cellW + x, sy = row * cellH + y;
      const si = (sy * srcW + sx) * 4, di = (y * cellW + x) * 4;
      frame[di] = data[si]; frame[di+1] = data[si+1]; frame[di+2] = data[si+2]; frame[di+3] = data[si+3];
    }
  }
  return frame;
}

function drawGridOverlay(data, width, height, cols, rows) {
  const cellW = width / cols, cellH = height / rows;
  const overlay = new Uint8Array(data);
  for (let col = 0; col <= cols; col++) {
    const x = Math.floor(col * cellW);
    for (let y = 0; y < height; y++) {
      const idx = (y * width + Math.min(x, width - 1)) * 4;
      overlay[idx] = 255; overlay[idx+1] = 50; overlay[idx+2] = 50; overlay[idx+3] = 255;
    }
  }
  for (let row = 0; row <= rows; row++) {
    const y = Math.floor(row * cellH);
    for (let x = 0; x < width; x++) {
      const idx = (Math.min(y, height - 1) * width + x) * 4;
      overlay[idx] = 255; overlay[idx+1] = 50; overlay[idx+2] = 50; overlay[idx+3] = 255;
    }
  }
  return overlay;
}

function drawAlphaBoundary(data, width, height) {
  const boundary = new Uint8Array(width * height * 4);
  // Fill with dark background
  for (let i = 0; i < boundary.length; i += 4) {
    boundary[i] = 30; boundary[i+1] = 30; boundary[i+2] = 40; boundary[i+3] = 255;
  }
  // Draw alpha edges in cyan
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const a = data[idx + 3];
      const aRight = data[idx + 4 + 3];
      const aDown = data[(y + 1) * width + x + 4 + 3];
      if (Math.abs(a - aRight) > 50 || Math.abs(a - aDown) > 50) {
        boundary[idx] = 0; boundary[idx+1] = 255; boundary[idx+2] = 255; boundary[idx+3] = 255;
      }
    }
  }
  return boundary;
}

function generateContactSheet(frames, cellW, cellH, cols, rows) {
  const sheetW = cols * cellW, sheetH = rows * cellH;
  const sheet = new Uint8Array(sheetW * sheetH * 4);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const frameIdx = row * cols + col;
      const frame = frames[frameIdx];
      if (!frame) continue;
      for (let y = 0; y < cellH; y++) {
        for (let x = 0; x < cellW; x++) {
          const si = (y * cellW + x) * 4;
          const di = ((row * cellH + y) * sheetW + (col * cellW + x)) * 4;
          sheet[di] = frame[si]; sheet[di+1] = frame[si+1]; sheet[di+2] = frame[si+2]; sheet[di+3] = frame[si+3];
        }
      }
      // Draw frame number
      const numStr = String(frameIdx + 1);
      for (let c = 0; c < numStr.length; c++) {
        drawDigit(sheet, sheetW, col * cellW + 4 + c * 8, row * cellH + 4, numStr[c]);
      }
    }
  }
  return { data: sheet, width: sheetW, height: sheetH };
}

function drawDigit(data, sheetW, x, y, ch) {
  // Simple 5x7 pixel font for digits
  const font = {
    '0': [0b01110,0b10001,0b10011,0b10101,0b11001,0b10001,0b01110],
    '1': [0b00100,0b01100,0b00100,0b00100,0b00100,0b00100,0b01110],
    '2': [0b01110,0b10001,0b00001,0b00010,0b00100,0b01000,0b11111],
    '3': [0b11110,0b00001,0b00001,0b01110,0b00001,0b00001,0b11110],
    '4': [0b00010,0b00110,0b01010,0b10010,0b11111,0b00010,0b00010],
    '5': [0b11111,0b10000,0b11110,0b00001,0b00001,0b10001,0b01110],
    '6': [0b00110,0b01000,0b10000,0b11110,0b10001,0b10001,0b01110],
    '7': [0b11111,0b00001,0b00010,0b00100,0b01000,0b01000,0b01000],
    '8': [0b01110,0b10001,0b10001,0b01110,0b10001,0b10001,0b01110],
    '9': [0b01110,0b10001,0b10001,0b01111,0b00001,0b00010,0b01100],
  };
  const glyph = font[ch];
  if (!glyph) return;
  for (let dy = 0; dy < 7; dy++) {
    for (let dx = 0; dx < 5; dx++) {
      if (glyph[dy] & (1 << (4 - dx))) {
        const idx = ((y + dy) * sheetW + (x + dx)) * 4;
        data[idx] = 255; data[idx+1] = 255; data[idx+2] = 255; data[idx+3] = 255;
      }
    }
  }
}

function findPeakFrame(frames, cellW, cellH) {
  let maxAlpha = 0, peakIdx = 0;
  for (let i = 0; i < frames.length; i++) {
    let alpha = 0;
    for (let j = 3; j < frames[i].length; j += 4) alpha += frames[i][j];
    if (alpha > maxAlpha) { maxAlpha = alpha; peakIdx = i; }
  }
  return peakIdx;
}

// ─── Main ─────────────────────────────────────────────────────────

function main() {
  console.log('R1.2 Pilot Review Gallery Generator — Starting...');

  const correctedInv = JSON.parse(readFileSync(CORRECTED_INV, 'utf8'));
  const candidateMap = new Map();
  for (const c of correctedInv.candidates) candidateMap.set(c.candidateId, c);

  const reviewData = [];

  for (const target of PILOT_TARGETS) {
    console.log(`\nProcessing ${target.targetId}: ${target.targetSheet}`);
    const targetDir = join(REVIEW_DIR, target.targetId);
    mkdirSync(targetDir, { recursive: true });

    for (const cand of target.candidates) {
      const candidate = candidateMap.get(cand.candidateId);
      if (!candidate) { console.log(`  SKIP: ${cand.candidateId} not found`); continue; }

      const fullPath = join(MEGA_ROOT, candidate.sourcePath);
      if (!existsSync(fullPath)) { console.log(`  SKIP: file not found ${fullPath}`); continue; }

      const grid = candidate.r1_1GridValidation?.correctedGrid;
      if (!grid) { console.log(`  SKIP: no grid data`); continue; }

      console.log(`  Candidate ${cand.candidateId}: ${candidate.sourceFilename} (${grid.cols}x${grid.rows})`);

      const buf = readFileSync(fullPath);
      const decoded = decodePng(buf);
      const { width, height, data } = decoded;

      // Extract frames
      const frames = [];
      for (let row = 0; row < grid.rows; row++) {
        for (let col = 0; col < grid.cols; col++) {
          frames.push(extractFrame(data, width, grid.cellW, grid.cellH, col, row));
        }
      }

      // Downscale frames for GIF (max 256px)
      const gifMaxDim = 256;
      const gifScale = Math.min(gifMaxDim / grid.cellW, gifMaxDim / grid.cellH, 1);
      const gifW = Math.floor(grid.cellW * gifScale);
      const gifH = Math.floor(grid.cellH * gifScale);
      const gifFrames = frames.map(f => downscaleRgba(f, grid.cellW, grid.cellH, gifW, gifH));

      // 1. Source thumbnail (downscaled full sheet)
      const thumbMaxDim = 512;
      const thumbScale = Math.min(thumbMaxDim / width, thumbMaxDim / height, 1);
      const thumbW = Math.floor(width * thumbScale);
      const thumbH = Math.floor(height * thumbScale);
      const thumbData = downscaleRgba(data, width, height, thumbW, thumbH);
      writeFileSync(join(targetDir, `thumbnail_${cand.candidateId}.png`), encodePng(thumbW, thumbH, thumbData));

      // 2. Grid overlay
      const overlayData = drawGridOverlay(thumbData, thumbW, thumbH, grid.cols, grid.rows);
      writeFileSync(join(targetDir, `grid_overlay_${cand.candidateId}.png`), encodePng(thumbW, thumbH, overlayData));

      // 3. Animated GIF
      const delayCs = Math.max(2, Math.floor(100 / frames.length));
      const gifData = encodeGif(gifFrames, gifW, gifH, delayCs);
      writeFileSync(join(targetDir, `animated_${cand.candidateId}.gif`), gifData);

      // 4. Contact sheet with frame numbers
      const contactSheet = generateContactSheet(gifFrames, gifW, gifH, grid.cols, grid.rows);
      writeFileSync(join(targetDir, `contact_sheet_${cand.candidateId}.png`), encodePng(contactSheet.width, contactSheet.height, contactSheet.data));

      // 5. Alpha-boundary overlay (on first frame, downscaled)
      const alphaBoundary = drawAlphaBoundary(gifFrames[0], gifW, gifH);
      writeFileSync(join(targetDir, `alpha_boundary_${cand.candidateId}.png`), encodePng(gifW, gifH, alphaBoundary));

      // 6. First, peak, last frame
      const peakIdx = findPeakFrame(gifFrames, gifW, gifH);
      writeFileSync(join(targetDir, `frame_first_${cand.candidateId}.png`), encodePng(gifW, gifH, gifFrames[0]));
      writeFileSync(join(targetDir, `frame_peak_${cand.candidateId}.png`), encodePng(gifW, gifH, gifFrames[peakIdx]));
      writeFileSync(join(targetDir, `frame_last_${cand.candidateId}.png`), encodePng(gifW, gifH, gifFrames[frames.length - 1]));

      // Store review data
      reviewData.push({
        targetId: target.targetId,
        category: target.category,
        targetSheet: target.targetSheet,
        actionDetails: target.actionDetails,
        candidate: {
          candidateId: cand.candidateId,
          rank: cand.rank,
          forAction: cand.forAction,
          sourceFilename: candidate.sourceFilename,
          sourcePath: candidate.sourcePath,
          sourceCollection: candidate.sourceCollection,
          gridConfidence: candidate.r1_1GridValidation?.confidence,
          correctedGrid: grid,
          changedFromR1: candidate.r1_1GridValidation?.changed,
          ambiguityReason: candidate.r1_1GridValidation?.ambiguityReason,
          frameCount: grid.frameCount,
          cellDimensions: { width: grid.cellW, height: grid.cellH },
        },
        visualEvidence: {
          thumbnail: `thumbnail_${cand.candidateId}.png`,
          gridOverlay: `grid_overlay_${cand.candidateId}.png`,
          animatedGif: `animated_${cand.candidateId}.gif`,
          contactSheet: `contact_sheet_${cand.candidateId}.png`,
          alphaBoundary: `alpha_boundary_${cand.candidateId}.png`,
          frameFirst: `frame_first_${cand.candidateId}.png`,
          framePeak: `frame_peak_${cand.candidateId}.png`,
          frameLast: `frame_last_${cand.candidateId}.png`,
          peakFrameIndex: peakIdx,
        },
      });
    }
  }

  // Generate HTML index
  const html = generateHtmlIndex(reviewData);
  writeFileSync(join(REVIEW_DIR, 'index.html'), html);

  // Write review data JSON (external, for reference)
  writeFileSync(join(REVIEW_DIR, 'review_data.json'), JSON.stringify(reviewData, null, 2));

  console.log(`\nGenerated review gallery at ${REVIEW_DIR}`);
  console.log(`HTML index: ${join(REVIEW_DIR, 'index.html')}`);
  console.log(`Review data: ${join(REVIEW_DIR, 'review_data.json')}`);
}

function generateHtmlIndex(reviewData) {
  const lines = [];
  lines.push('<!DOCTYPE html>');
  lines.push('<html lang="en"><head><meta charset="UTF-8">');
  lines.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  lines.push('<title>VFX Mega Pack R1.2 — Pilot Candidate Review</title>');
  lines.push('<style>');
  lines.push('body { font-family: "Segoe UI", system-ui, sans-serif; background: #1a1a2e; color: #e0e0e0; margin: 0; padding: 20px; }');
  lines.push('h1 { color: #00d4ff; border-bottom: 2px solid #00d4ff; padding-bottom: 10px; }');
  lines.push('h2 { color: #ffcc00; margin-top: 40px; }');
  lines.push('h3 { color: #ff9966; }');
  lines.push('.target { background: #16213e; border-radius: 12px; padding: 20px; margin-bottom: 30px; border: 1px solid #333; }');
  lines.push('.candidate { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px; }');
  lines.push('.evidence { background: #0f3460; border-radius: 8px; padding: 15px; }');
  lines.push('.evidence img { max-width: 100%; border-radius: 4px; margin: 5px 0; }');
  lines.push('.metadata { background: #0f3460; border-radius: 8px; padding: 15px; }');
  lines.push('.metadata table { width: 100%; border-collapse: collapse; }');
  lines.push('.metadata td { padding: 4px 8px; border-bottom: 1px solid #333; }');
  lines.push('.metadata td:first-child { color: #00d4ff; font-weight: bold; width: 40%; }');
  lines.push('.verdict { font-size: 1.2em; font-weight: bold; padding: 8px 16px; border-radius: 6px; display: inline-block; }');
  lines.push('.pending { background: #ffcc00; color: #000; }');
  lines.push('.category-tag { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 0.85em; font-weight: bold; }');
  lines.push('.p0 { background: #e74c3c; color: white; }');
  lines.push('.semantic { background: #e67e22; color: white; }');
  lines.push('.status { background: #27ae60; color: white; }');
  lines.push('.warning { background: #c0392b; color: white; padding: 10px; border-radius: 6px; margin: 10px 0; }');
  lines.push('</style></head><body>');
  lines.push('<h1>VFX Mega Pack R1.2 — Pilot Candidate Human Review</h1>');
  lines.push('<div class="warning">All candidates are PENDING_HUMAN_REVIEW. Grid confidence does NOT equal visual approval. No R2 conversion is authorized until explicit human approval.</div>');
  lines.push('<p><strong>Review location:</strong> <code>&lt;MEGA_PACK_ROOT&gt;/03_inventory_output/r1_2_pilot_review/</code></p>');
  lines.push('<p><strong>Total targets:</strong> 13 (5 P0 + 3 semantic + 5 status/loop)</p>');

  for (const rd of reviewData) {
    lines.push(`<div class="target">`);
    lines.push(`<h2>${rd.targetSheet}</h2>`);
    const catClass = rd.category === 'P0_REPLACEMENT' ? 'p0' : rd.category === 'SEMANTIC_MISMATCH' ? 'semantic' : 'status';
    const catLabel = rd.category === 'P0_REPLACEMENT' ? 'P0 REPLACEMENT' : rd.category === 'SEMANTIC_MISMATCH' ? 'SEMANTIC MISMATCH' : 'STATUS/LOOP';
    lines.push(`<span class="category-tag ${catClass}">${catLabel}</span>`);

    // Action details
    lines.push('<h3>Actions</h3><table>');
    for (const a of rd.actionDetails) {
      lines.push(`<tr><td>${a.actionId}</td><td>${a.unit} / ${a.slot} — ${a.mechanic}</td></tr>`);
    }
    lines.push('</table>');

    // Candidate
    const c = rd.candidate;
    lines.push(`<h3>Candidate ${c.candidateId} (Rank ${c.rank})</h3>`);
    lines.push(`<div class="candidate">`);

    // Visual evidence
    lines.push('<div class="evidence">');
    lines.push('<h4>Visual Evidence</h4>');
    const base = `${rd.targetId}/`;
    lines.push(`<p><strong>Animated Preview:</strong><br><img src="${base}${rd.visualEvidence.animatedGif}" alt="Animated preview"></p>`);
    lines.push(`<p><strong>Grid Overlay:</strong><br><img src="${base}${rd.visualEvidence.gridOverlay}" alt="Grid overlay"></p>`);
    lines.push(`<p><strong>Contact Sheet:</strong><br><img src="${base}${rd.visualEvidence.contactSheet}" alt="Contact sheet"></p>`);
    lines.push(`<p><strong>Alpha Boundary:</strong><br><img src="${base}${rd.visualEvidence.alphaBoundary}" alt="Alpha boundary"></p>`);
    lines.push(`<p><strong>First Frame:</strong><br><img src="${base}${rd.visualEvidence.frameFirst}" alt="First frame"></p>`);
    lines.push(`<p><strong>Peak Frame (${rd.visualEvidence.peakFrameIndex + 1}):</strong><br><img src="${base}${rd.visualEvidence.framePeak}" alt="Peak frame"></p>`);
    lines.push(`<p><strong>Last Frame:</strong><br><img src="${base}${rd.visualEvidence.frameLast}" alt="Last frame"></p>`);
    lines.push(`<p><strong>Source Thumbnail:</strong><br><img src="${base}${rd.visualEvidence.thumbnail}" alt="Thumbnail"></p>`);
    lines.push('</div>');

    // Metadata
    lines.push('<div class="metadata">');
    lines.push('<h4>Candidate Metadata</h4><table>');
    lines.push(`<tr><td>Candidate ID</td><td>${c.candidateId}</td></tr>`);
    lines.push(`<tr><td>Source Filename</td><td>${c.sourceFilename}</td></tr>`);
    lines.push(`<tr><td>Collection</td><td>${c.sourceCollection}</td></tr>`);
    lines.push(`<tr><td>Confirmed Grid</td><td>${c.correctedGrid.cols}x${c.correctedGrid.rows}</td></tr>`);
    lines.push(`<tr><td>Source Frame Count</td><td>${c.frameCount}</td></tr>`);
    lines.push(`<tr><td>Cell Dimensions</td><td>${c.cellDimensions.width}x${c.cellDimensions.height}</td></tr>`);
    lines.push(`<tr><td>Grid Confidence</td><td style="color:${c.gridConfidence === 'HIGH' ? '#27ae60' : c.gridConfidence === 'MEDIUM' ? '#f39c12' : '#e74c3c'}">${c.gridConfidence}</td></tr>`);
    lines.push(`<tr><td>Changed from R1</td><td>${c.changedFromR1 ? 'YES' : 'No'}</td></tr>`);
    if (c.ambiguityReason) lines.push(`<tr><td>Ambiguity Reason</td><td>${c.ambiguityReason}</td></tr>`);
    lines.push(`<tr><td>Grid Validation Status</td><td>${c.gridConfidence === 'HIGH' || c.gridConfidence === 'MEDIUM' ? 'CONFIRMED_GRID' : 'AMBIGUOUS_GRID'}</td></tr>`);
    lines.push(`<tr><td>Visual Validation Status</td><td><span class="verdict pending">PENDING_HUMAN_REVIEW</span></td></tr>`);
    lines.push(`<tr><td>R2 Authorization</td><td>BLOCKED — PENDING_HUMAN_REVIEW</td></tr>`);
    lines.push('</table>');
    lines.push('</div>');

    lines.push('</div>'); // candidate
    lines.push('</div>'); // target
  }

  lines.push('<hr><p style="color:#666;font-size:0.85em;">Generated by tools/vfx/r1_2_generate_review_gallery.mjs — R1.2 Pilot Review Gallery Generator. All visual evidence is external to the RPGThreeJS repository.</p>');
  lines.push('</body></html>');

  return lines.join('\n');
}

try {
  main();
} catch (e) {
  console.error('Fatal error:', e);
  process.exit(1);
}

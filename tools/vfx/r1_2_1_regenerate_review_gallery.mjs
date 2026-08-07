#!/usr/bin/env node
/**
 * R1.2.4 Pilot Review Gallery Regenerator (Grid-Dynamic)
 *
 * Regenerates the entire R1.2 review gallery using the authoritative
 * CartoonCoffee source dimension convention:
 *   2048×2048 → 4×4 / 16 frames / 512×512 cells
 *   4096×4096 → 8×8 / 64 frames / 512×512 cells
 *
 * All output: <MEGA_PACK_ROOT>/03_inventory_output/r1_2_pilot_review/
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync, deflateSync } from 'node:zlib';
import { decodePng, detectGridV2 } from './r1_2_1_grid_detector_v2.mjs';
import { classifyNativeGrid } from './r1_2_3_frame_hash_diagnostic.mjs';

const MEGA_ROOT = 'C:\\Users\\miche\\Documents\\VFX_Library\\CartoonCoffeeMegaPack';
const REVIEW_DIR = join(MEGA_ROOT, '03_inventory_output', 'r1_2_pilot_review');
const REPO = 'c:\\Users\\miche\\Documents\\Projects\\RPGThreeJS';
const PILOT_JSON = join(REPO, 'docs/reports/vfx-megapack-r1-2-pilot-candidates.json');

// CRC32 + PNG encode (reused)
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c; }
function crc32(buf) { let crc = 0xffffffff; for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8); return crc ^ 0xffffffff; }
function makePngChunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0); const t = Buffer.from(type, 'ascii'); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(Buffer.concat([t, data])) >>> 0, 0); return Buffer.concat([len, t, data, c]); }
function encodePng(w, h, rgba) { const sig = Buffer.from([137,80,78,71,13,10,26,10]); const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w,0); ihdr.writeUInt32BE(h,4); ihdr[8]=8; ihdr[9]=6; const stride=w*4; const raw=Buffer.alloc(h*(stride+1)); for(let y=0;y<h;y++){raw[y*(stride+1)]=0; for(let x=0;x<stride;x++) raw[y*(stride+1)+1+x]=rgba[y*stride+x];} return Buffer.concat([sig, makePngChunk('IHDR',ihdr), makePngChunk('IDAT',deflateSync(raw,{level:6})), makePngChunk('IEND',Buffer.alloc(0))]); }

// GIF encode (reused from R1.2)
function encodeGif(frames, width, height, delayCs) {
  const colorMap = new Map(); const palette = [[0,0,0]];
  for (const frame of frames) { for (let i=0;i<frame.length;i+=4) { const a=frame[i+3]; if(a<128) continue; const r=frame[i]>>4<<4,g=frame[i+1]>>4<<4,b=frame[i+2]>>4<<4; const key=(r<<16)|(g<<8)|b; if(!colorMap.has(key)){if(palette.length>=256) continue; colorMap.set(key,palette.length); palette.push([r,g,b]);} } }
  let palBits=2; while(Math.pow(2,palBits)<palette.length) palBits++; if(palBits<2) palBits=2; const palSize=Math.pow(2,palBits); while(palette.length<palSize) palette.push([0,0,0]);
  const parts=[]; parts.push(Buffer.from('GIF89a'));
  const lsd=Buffer.alloc(7); lsd.writeUInt16LE(width,0); lsd.writeUInt16LE(height,2); lsd[4]=0x80|((palBits-1)<<4)|(palBits-1); parts.push(lsd);
  const gct=Buffer.alloc(palSize*3); for(let i=0;i<palSize;i++){gct[i*3]=palette[i][0];gct[i*3+1]=palette[i][1];gct[i*3+2]=palette[i][2];} parts.push(gct);
  parts.push(Buffer.from([0x21,0xFF,0x0B,0x4E,0x45,0x54,0x53,0x43,0x41,0x50,0x45,0x32,0x2E,0x30,0x03,0x01,0x00,0x00,0x00]));
  for (const frame of frames) {
    const gce=Buffer.alloc(8); gce[0]=0x21;gce[1]=0xF9;gce[2]=4;gce[3]=0x09;gce.writeUInt16LE(delayCs,4);gce[6]=0;gce[7]=0; parts.push(gce);
    const id=Buffer.alloc(10); id[0]=0x2C; id.writeUInt16LE(0,1);id.writeUInt16LE(0,3);id.writeUInt16LE(width,5);id.writeUInt16LE(height,7); parts.push(id);
    const indices=new Uint8Array(width*height); for(let i=0;i<frame.length;i+=4){const idx=i/4;const a=frame[i+3];if(a<128){indices[idx]=0;continue;}const r=frame[i]>>4<<4,g=frame[i+1]>>4<<4,b=frame[i+2]>>4<<4;const key=(r<<16)|(g<<8)|b;indices[idx]=colorMap.get(key)||0;}
    const lzwData=lzwEncode(indices,palBits); parts.push(Buffer.from([palBits]));
    let pos=0; while(pos<lzwData.length){const rem=lzwData.length-pos;const bl=Math.min(rem,255);parts.push(Buffer.from([bl]));parts.push(lzwData.subarray(pos,pos+bl));pos+=bl;} parts.push(Buffer.from([0]));
  }
  parts.push(Buffer.from([0x3B])); return Buffer.concat(parts);
}
function lzwEncode(indices,colorBits){const minCodeSize=Math.max(2,colorBits);const clearCode=1<<minCodeSize;const eoiCode=clearCode+1;let nextCode=eoiCode+1;let codeSize=minCodeSize+1;const dict=new Map();for(let i=0;i<clearCode;i++)dict.set(String.fromCharCode(i),i);const output=[];const bitBuffer=[];function emitCode(code){for(let i=0;i<codeSize;i++)bitBuffer.push((code>>i)&1);while(bitBuffer.length>=8){let byte=0;for(let i=0;i<8;i++)byte|=bitBuffer[i]<<i;output.push(byte);bitBuffer.splice(0,8);}}emitCode(clearCode);let w='';for(let i=0;i<indices.length;i++){const c=String.fromCharCode(indices[i]);const wc=w+c;if(dict.has(wc)){w=wc;}else{emitCode(dict.get(w));if(nextCode<4096){dict.set(wc,nextCode);nextCode++;if(nextCode>(1<<codeSize)&&codeSize<12)codeSize++;}else{emitCode(clearCode);dict.clear();for(let j=0;j<clearCode;j++)dict.set(String.fromCharCode(j),j);nextCode=eoiCode+1;codeSize=minCodeSize+1;}w=c;}}if(w.length>0)emitCode(dict.get(w));emitCode(eoiCode);while(bitBuffer.length>0){let byte=0;for(let i=0;i<Math.min(8,bitBuffer.length);i++)byte|=bitBuffer[i]<<i;output.push(byte);bitBuffer.splice(0,8);}return Buffer.from(output);}

// Visual helpers (reused)
function downscaleRgba(data, srcW, srcH, dstW, dstH) { const out=new Uint8Array(dstW*dstH*4); const xR=srcW/dstW,yR=srcH/dstH; for(let y=0;y<dstH;y++)for(let x=0;x<dstW;x++){const sx=Math.floor(x*xR),sy=Math.floor(y*yR);const si=(sy*srcW+sx)*4,di=(y*dstW+x)*4;out[di]=data[si];out[di+1]=data[si+1];out[di+2]=data[si+2];out[di+3]=data[si+3];} return out; }
function extractFrame(data, srcW, cellW, cellH, col, row) { const frame=new Uint8Array(cellW*cellH*4); for(let y=0;y<cellH;y++)for(let x=0;x<cellW;x++){const sx=col*cellW+x,sy=row*cellH+y;const si=(sy*srcW+sx)*4,di=(y*cellW+x)*4;frame[di]=data[si];frame[di+1]=data[si+1];frame[di+2]=data[si+2];frame[di+3]=data[si+3];} return frame; }
function drawGridOverlay(data, width, height, cols, rows) { const cellW=width/cols,cellH=height/rows; const overlay=new Uint8Array(data); for(let col=0;col<=cols;col++){const x=Math.floor(col*cellW);for(let y=0;y<height;y++){const idx=(y*width+Math.min(x,width-1))*4;overlay[idx]=255;overlay[idx+1]=50;overlay[idx+2]=50;overlay[idx+3]=255;}} for(let row=0;row<=rows;row++){const y=Math.floor(row*cellH);for(let x=0;x<width;x++){const idx=(Math.min(y,height-1)*width+x)*4;overlay[idx]=255;overlay[idx+1]=50;overlay[idx+2]=50;overlay[idx+3]=255;}} return overlay; }
function drawAlphaBoundary(data, width, height) { const b=new Uint8Array(width*height*4); for(let i=0;i<b.length;i+=4){b[i]=30;b[i+1]=30;b[i+2]=40;b[i+3]=255;} for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){const idx=(y*width+x)*4;const a=data[idx+3],aR=data[idx+4+3],aD=data[(y+1)*width+x+4+3];if(Math.abs(a-aR)>50||Math.abs(a-aD)>50){b[idx]=0;b[idx+1]=255;b[idx+2]=255;b[idx+3]=255;}} return b; }
function findPeakFrame(frames) { let maxA=0,peak=0; for(let i=0;i<frames.length;i++){let a=0;for(let j=3;j<frames[i].length;j+=4)a+=frames[i][j];if(a>maxA){maxA=a;peak=i;}} return peak; }

function drawDigit(data, sheetW, x, y, ch) {
  const font = {
    '0':[0b01110,0b10001,0b10011,0b10101,0b11001,0b10001,0b01110],'1':[0b00100,0b01100,0b00100,0b00100,0b00100,0b00100,0b01110],
    '2':[0b01110,0b10001,0b00001,0b00010,0b00100,0b01000,0b11111],'3':[0b11110,0b00001,0b00001,0b01110,0b00001,0b00001,0b11110],
    '4':[0b00010,0b00110,0b01010,0b10010,0b11111,0b00010,0b00010],'5':[0b11111,0b10000,0b11110,0b00001,0b00001,0b10001,0b01110],
    '6':[0b00110,0b01000,0b10000,0b11110,0b10001,0b10001,0b01110],'7':[0b11111,0b00001,0b00010,0b00100,0b01000,0b01000,0b01000],
    '8':[0b01110,0b10001,0b10001,0b01110,0b10001,0b10001,0b01110],'9':[0b01110,0b10001,0b10001,0b01111,0b00001,0b00010,0b01100],
  };
  const glyph = font[ch]; if (!glyph) return;
  for (let dy=0;dy<7;dy++) for (let dx=0;dx<5;dx++) if (glyph[dy]&(1<<(4-dx))) { const idx=((y+dy)*sheetW+(x+dx))*4; data[idx]=255;data[idx+1]=255;data[idx+2]=255;data[idx+3]=255; }
}

function generateContactSheet(frames, cellW, cellH, cols, rows) {
  const sheetW=cols*cellW, sheetH=rows*cellH; const sheet=new Uint8Array(sheetW*sheetH*4);
  for (let row=0;row<rows;row++) for (let col=0;col<cols;col++) {
    const fi=row*cols+col; const frame=frames[fi]; if(!frame) continue;
    for (let y=0;y<cellH;y++) for (let x=0;x<cellW;x++) { const si=(y*cellW+x)*4; const di=((row*cellH+y)*sheetW+(col*cellW+x))*4; sheet[di]=frame[si];sheet[di+1]=frame[si+1];sheet[di+2]=frame[si+2];sheet[di+3]=frame[si+3]; }
    const numStr=String(fi+1); for (let c=0;c<numStr.length;c++) drawDigit(sheet,sheetW,col*cellW+4+c*8,row*cellH+4,numStr[c]);
  }
  return { data: sheet, width: sheetW, height: sheetH };
}

// ─── Main ─────────────────────────────────────────────────────────

function main() {
  console.log('R1.2.4 Pilot Review Gallery Regenerator — Starting...');
  console.log('Using authoritative source dimension convention: 2048→4×4/16f, 4096→8×8/64f.\n');

  // Clear and recreate review directory
  if (existsSync(REVIEW_DIR)) rmSync(REVIEW_DIR, { recursive: true, force: true });
  mkdirSync(REVIEW_DIR, { recursive: true });

  const pilotData = JSON.parse(readFileSync(PILOT_JSON, 'utf8'));

  // Extract unique candidates
  const seen = new Set();
  const uniqueCandidates = [];
  for (const c of pilotData.candidates) {
    const id = c.candidate.candidateId;
    if (!seen.has(id)) {
      seen.add(id);
      uniqueCandidates.push({
        candidateId: id,
        sourceFilename: c.candidate.sourceFilename,
        sourceRelativePath: c.candidate.sourceRelativePath,
        sourceCollection: c.candidate.sourceCollection,
        previousGrid: c.candidate.confirmedGrid,
        previousFrameCount: c.candidate.sourceFrameCount,
        targets: pilotData.candidates.filter(x => x.candidate.candidateId === id).map(x => ({
          targetId: x.targetId, targetSheet: x.targetSheet, actionId: x.action.actionId,
          category: x.category,
        })),
      });
    }
  }

  console.log(`Found ${uniqueCandidates.length} unique pilot candidates.\n`);

  const reviewData = [];
  let generated = 0;

  for (const cand of uniqueCandidates) {
    const fullPath = join(MEGA_ROOT, cand.sourceRelativePath);
    if (!existsSync(fullPath)) { console.log(`SKIP: ${cand.candidateId} — file not found`); continue; }

    console.log(`Processing ${cand.candidateId}: ${cand.sourceFilename}`);

    const buf = readFileSync(fullPath);
    const decoded = decodePng(buf);
    const { width, height, data } = decoded;

    // Classify grid from source dimensions (authoritative convention)
    const gridInfo = classifyNativeGrid(width, height);
    if (!gridInfo.grid) {
      console.log(`SKIP: ${cand.candidateId} — unsupported dimensions ${width}x${height} (MANUAL_REVIEW_REQUIRED)`);
      continue;
    }
    const GRID_COLS = gridInfo.columns;
    const GRID_ROWS = gridInfo.rows;
    const cellW = gridInfo.cellWidth;
    const cellH = gridInfo.cellHeight;
    const frameCount = gridInfo.frameCount;

    // Also run v2 detector for diagnostics (does not override source convention)
    const heuristicResult = detectGridV2(data, width, height, cand.sourceFilename);
    const heuristicMatch = heuristicResult.cols === GRID_COLS && heuristicResult.rows === GRID_ROWS;

    // Extract all 64 frames in row-major order
    const frames = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        frames.push(extractFrame(data, width, cellW, cellH, col, row));
      }
    }

    // Downscale for GIF (max 256px)
    const gifScale = Math.min(256 / cellW, 256 / cellH, 1);
    const gifW = Math.floor(cellW * gifScale);
    const gifH = Math.floor(cellH * gifScale);
    const gifFrames = frames.map(f => downscaleRgba(f, cellW, cellH, gifW, gifH));

    // Target directory: use candidate ID (unique per candidate, avoids collision)
    const targetDir = join(REVIEW_DIR, cand.candidateId);
    mkdirSync(targetDir, { recursive: true });

    // 1. Thumbnail (downscaled full sheet, max 512)
    const thumbScale = Math.min(512 / width, 512 / height, 1);
    const thumbW = Math.floor(width * thumbScale);
    const thumbH = Math.floor(height * thumbScale);
    const thumbData = downscaleRgba(data, width, height, thumbW, thumbH);
    writeFileSync(join(targetDir, `thumbnail_${cand.candidateId}.png`), encodePng(thumbW, thumbH, thumbData));
    generated++;

    // 2. Grid overlay (4x4 or 8x8 depending on source)
    const overlayData = drawGridOverlay(thumbData, thumbW, thumbH, GRID_COLS, GRID_ROWS);
    writeFileSync(join(targetDir, `grid_overlay_${cand.candidateId}.png`), encodePng(thumbW, thumbH, overlayData));
    generated++;

    // 3. Animated GIF using all 64 native frames (secondary — fixed LZW)
    const delayCs = Math.max(2, Math.floor(100 / frameCount));
    writeFileSync(join(targetDir, `animated_${cand.candidateId}.gif`), encodeGif(gifFrames, gifW, gifH, delayCs));
    generated++;

    // 3b. Extract 64 full-resolution PNG frames for HTML player (canonical animation)
    const framesDir = join(targetDir, 'frames');
    mkdirSync(framesDir, { recursive: true });
    for (let i = 0; i < frameCount; i++) {
      const frameNum = String(i + 1).padStart(3, '0');
      writeFileSync(join(framesDir, `frame_${frameNum}.png`), encodePng(cellW, cellH, frames[i]));
      generated++;
    }

    // 4. Contact sheet (native grid with frame numbers)
    const contactSheet = generateContactSheet(gifFrames, gifW, gifH, GRID_COLS, GRID_ROWS);
    writeFileSync(join(targetDir, `contact_sheet_${cand.candidateId}.png`), encodePng(contactSheet.width, contactSheet.height, contactSheet.data));
    generated++;

    // 5. Alpha boundary (first frame)
    const alphaBoundary = drawAlphaBoundary(gifFrames[0], gifW, gifH);
    writeFileSync(join(targetDir, `alpha_boundary_${cand.candidateId}.png`), encodePng(gifW, gifH, alphaBoundary));
    generated++;

    // 6. First, peak, last frame
    const peakIdx = findPeakFrame(gifFrames);
    writeFileSync(join(targetDir, `frame_first_${cand.candidateId}.png`), encodePng(gifW, gifH, gifFrames[0]));
    writeFileSync(join(targetDir, `frame_peak_${cand.candidateId}.png`), encodePng(gifW, gifH, gifFrames[peakIdx]));
    writeFileSync(join(targetDir, `frame_last_${cand.candidateId}.png`), encodePng(gifW, gifH, gifFrames[frameCount - 1]));
    generated += 3;

    // Compute recomputed visual metrics from correct 8x8 extraction
    let totalAlpha = 0, activePixels = 0;
    let minX = cellW, minY = cellH, maxX = 0, maxY = 0;
    for (const frame of frames) {
      for (let i = 0; i < frame.length; i += 4) {
        const a = frame[i + 3];
        totalAlpha += a;
        if (a > 8) {
          activePixels++;
          const px = (i / 4) % cellW, py = Math.floor((i / 4) / cellW);
          if (px < minX) minX = px; if (py < minY) minY = py;
          if (px > maxX) maxX = px; if (py > maxY) maxY = py;
        }
      }
    }

    // Center drift across all 64 frames
    let driftSum = 0, driftCount = 0;
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const frame = frames[row * GRID_COLS + col];
        let fMinX = cellW, fMinY = cellH, fMaxX = 0, fMaxY = 0, fActive = 0;
        for (let y = 0; y < cellH; y++) {
          for (let x = 0; x < cellW; x++) {
            const idx = (y * cellW + x) * 4;
            if (frame[idx + 3] > 8) {
              fActive++;
              if (x < fMinX) fMinX = x; if (y < fMinY) fMinY = y;
              if (x > fMaxX) fMaxX = x; if (y > fMaxY) fMaxY = y;
            }
          }
        }
        if (fActive > 0) {
          const bcx = (fMinX + fMaxX) / 2, bcy = (fMinY + fMaxY) / 2;
          const drift = Math.sqrt((bcx - cellW/2)**2 + (bcy - cellH/2)**2);
          driftSum += drift; driftCount++;
        }
      }
    }
    const avgCenterDrift = driftCount > 0 ? driftSum / driftCount : 0;

    // Edge contact (clipping)
    let clippingFrames = 0;
    for (const frame of frames) {
      let fMinX = cellW, fMinY = cellH, fMaxX = 0, fMaxY = 0, fActive = 0;
      for (let y = 0; y < cellH; y++) {
        for (let x = 0; x < cellW; x++) {
          const idx = (y * cellW + x) * 4;
          if (frame[idx + 3] > 8) {
            fActive++;
            if (x < fMinX) fMinX = x; if (y < fMinY) fMinY = y;
            if (x > fMaxX) fMaxX = x; if (y > fMaxY) fMaxY = y;
          }
        }
      }
      if (fActive > 0 && (fMinX <= 2 || fMinY <= 2 || fMaxX >= cellW - 3 || fMaxY >= cellH - 3)) clippingFrames++;
    }

    // Empty frames
    let emptyFrames = 0;
    for (const frame of frames) {
      let fActive = 0;
      for (let i = 3; i < frame.length; i += 4) if (frame[i] > 8) fActive++;
      if (fActive === 0) emptyFrames++;
    }

    reviewData.push({
      candidateId: cand.candidateId,
      sourceFilename: cand.sourceFilename,
      sourceRelativePath: cand.sourceRelativePath,
      sourceCollection: cand.sourceCollection,
      sourceDimensions: { width, height },
      nativeGrid: { cols: GRID_COLS, rows: GRID_ROWS, frameCount, grid: gridInfo.grid },
      nativeCellDimensions: { width: cellW, height: cellH },
      previousGrid: cand.previousGrid,
      previousFrameCount: cand.previousFrameCount,
      gridEvidenceSource: gridInfo.evidence,
      gridValidationStatus: gridInfo.status,
      heuristicDetection: {
        detected: `${heuristicResult.cols}x${heuristicResult.rows}`,
        confidence: heuristicResult.confidence,
        matches: heuristicMatch,
        subCellSepRatio: heuristicResult.subCellSepRatio,
        frameContinuity: heuristicResult.frameContinuity,
      },
      recomputedVisuals: {
        peakFrameIndex: peakIdx,
        activeFrames: frameCount - emptyFrames,
        emptyFrames,
        emptyRatio: emptyFrames / frameCount,
        avgCenterDrift: Math.round(avgCenterDrift * 10) / 10,
        clippingFrames,
        clippingRatio: Math.round(clippingFrames / frameCount * 100) / 100,
        alphaBounds: { minX, minY, maxX, maxY },
      },
      targets: cand.targets,
      visualEvidence: {
        thumbnail: `thumbnail_${cand.candidateId}.png`,
        gridOverlay: `grid_overlay_${cand.candidateId}.png`,
        animatedGif: `animated_${cand.candidateId}.gif`,
        contactSheet: `contact_sheet_${cand.candidateId}.png`,
        alphaBoundary: `alpha_boundary_${cand.candidateId}.png`,
        frameFirst: `frame_first_${cand.candidateId}.png`,
        framePeak: `frame_peak_${cand.candidateId}.png`,
        frameLast: `frame_last_${cand.candidateId}.png`,
        framesDir: `${cand.candidateId}/frames/`,
        frameCount,
        framePattern: 'frame_NNN.png',
      },
      playback: {
        baselineFps: 20,
        speeds: [0.5, 1, 1.5, 2],
        defaultSpeed: 1,
        loopDefault: true,
      },
    });
  }

  // Generate HTML index
  const html = generateHtmlIndex(reviewData);
  writeFileSync(join(REVIEW_DIR, 'index.html'), html);
  writeFileSync(join(REVIEW_DIR, 'review_data.json'), JSON.stringify(reviewData, null, 2));

  console.log(`\nGenerated ${generated} visual evidence files.`);
  console.log(`Review gallery at: ${REVIEW_DIR}`);
}

function generateHtmlIndex(reviewData) {
  const fps = reviewData[0]?.playback?.baselineFps || 20;
  const speeds = reviewData[0]?.playback?.speeds || [0.5, 1, 1.5, 2];
  const speedOptions = speeds.map(s => `<option value="${s}"${s===1?' selected':''}>${s}x</option>`).join('');

  const lines = [];
  lines.push('<!DOCTYPE html>');
  lines.push('<html lang="en"><head><meta charset="UTF-8">');
  lines.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  lines.push('<title>VFX Mega Pack R1.2.4 — Pilot Review (HTML Frame Player)</title>');
  lines.push('<style>');
  lines.push('*{box-sizing:border-box}');
  lines.push('body{font-family:"Segoe UI",system-ui,sans-serif;background:#1a1a2e;color:#e0e0e0;margin:0;padding:20px;}');
  lines.push('h1{color:#00d4ff;border-bottom:2px solid #00d4ff;padding-bottom:10px;}');
  lines.push('h2{color:#ffcc00;margin-top:0;}');
  lines.push('h3{color:#00d4ff;margin-top:20px;}');
  lines.push('.candidate{background:#16213e;border-radius:12px;padding:20px;margin-bottom:30px;border:1px solid #333;}');
  lines.push('.evidence{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:15px;}');
  lines.push('.evidence img{max-width:100%;border-radius:4px;margin:5px 0;}');
  lines.push('.metadata table{width:100%;border-collapse:collapse;}');
  lines.push('.metadata td{padding:4px 8px;border-bottom:1px solid #333;}');
  lines.push('.metadata td:first-child{color:#00d4ff;font-weight:bold;width:45%;}');
  lines.push('.ground-truth{background:#27ae60;color:white;padding:6px 14px;border-radius:6px;display:inline-block;font-weight:bold;font-size:0.9em;}');
  lines.push('.heuristic-match{color:#27ae60;}.heuristic-mismatch{color:#e74c3c;font-weight:bold;}');
  // Player styles
  lines.push('.vfx-player{background:#0d1117;border-radius:10px;padding:15px;margin:10px 0;}');
  lines.push('.vfx-player .frame-display{text-align:center;margin-bottom:10px;min-height:200px;display:flex;align-items:center;justify-content:center;}');
  lines.push('.vfx-player .frame-display img{max-width:100%;max-height:400px;border:1px solid #444;border-radius:4px;image-rendering:pixelated;}');
  lines.push('.vfx-player .controls{display:flex;flex-wrap:wrap;gap:8px;align-items:center;}');
  lines.push('.vfx-player .controls button{background:#2563eb;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:0.9em;}');
  lines.push('.vfx-player .controls button:hover{background:#1d4ed8;}');
  lines.push('.vfx-player .controls button:active{background:#1e40af;}');
  lines.push('.vfx-player .controls select{background:#1e293b;color:#e0e0e0;border:1px solid #444;padding:6px;border-radius:6px;}');
  lines.push('.vfx-player .controls input[type=range]{flex:1;min-width:150px;accent-color:#00d4ff;}');
  lines.push('.vfx-player .frame-counter{font-weight:bold;color:#00d4ff;min-width:120px;text-align:center;}');
  lines.push('.vfx-player .error-msg{background:#7f1d1d;color:#fecaca;padding:10px 15px;border-radius:6px;margin:10px 0;display:none;font-weight:bold;}');
  lines.push('.vfx-player .debug-panel{background:#1a1a2e;border:1px solid #333;border-radius:6px;padding:8px 12px;margin-top:8px;font-family:monospace;font-size:0.8em;color:#888;display:none;}');
  lines.push('.vfx-player .debug-panel.visible{display:block;}');
  lines.push('.vfx-player .debug-toggle{background:#333;color:#aaa;border:1px solid #555;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.8em;margin-left:auto;}');
  lines.push('.target-section{background:#1a2540;border-radius:8px;padding:12px;margin:8px 0;border-left:3px solid #00d4ff;}');
  lines.push('.target-section h4{color:#00d4ff;margin:0 0 8px 0;}');
  lines.push('.nav{position:sticky;top:0;background:#1a1a2e;padding:10px 0;z-index:100;border-bottom:1px solid #333;}');
  lines.push('.nav a{color:#00d4ff;text-decoration:none;margin-right:15px;font-size:0.85em;}');
  lines.push('.nav a:hover{text-decoration:underline;}');
  lines.push('</style></head><body>');

  // Header
  lines.push('<h1>VFX Mega Pack R1.2.4 — Pilot Review (HTML Frame Player)</h1>');
  lines.push('<div style="background:#27ae60;color:white;padding:15px;border-radius:8px;margin:10px 0;">');
  lines.push('<strong>NATIVE GRID CONVENTION:</strong> 2048×2048→4×4/16f, 4096×4096→8×8/64f. Each candidate uses its native grid. HTML frame player is canonical. GIF is secondary reference. Full-resolution 512×512 extracted frames.');
  lines.push('</div>');
  lines.push(`<p><strong>Playback baseline:</strong> ${fps} FPS (constant interval). Speed controls modify this. This is review playback only — does NOT define final runtime timing.</p>`);
  lines.push('<p><strong>Frame extraction order:</strong> Row-major. 4×4: 1→4, 5→8, 9→12, 13→16. 8×8: 1→8, 9→16, ..., 57→64. Native animation shown faithfully.</p>');
  lines.push(`<p><strong>Candidates:</strong> ${reviewData.length} unique | <strong>Targets:</strong> ${reviewData.reduce((s,r)=>s+r.targets.length,0)} total</p>`);

  // Navigation
  lines.push('<div class="nav">');
  for (const rd of reviewData) {
    const safeId = rd.candidateId.replace(/[^a-zA-Z0-9]/g, '_');
    lines.push(`<a href="#${safeId}">${rd.candidateId}</a>`);
  }
  lines.push('</div>');

  // Per-candidate sections
  for (const rd of reviewData) {
    const safeId = rd.candidateId.replace(/[^a-zA-Z0-9]/g, '_');
    const base = `${rd.candidateId}/`;
    const heurClass = rd.heuristicDetection.matches ? 'heuristic-match' : 'heuristic-mismatch';

    lines.push(`<div class="candidate" id="${safeId}">`);
    lines.push(`<h2>${rd.sourceFilename}</h2>`);
    const fc = rd.nativeGrid.frameCount;
    const gridLabel = rd.nativeGrid.grid;
    lines.push(`<span class="ground-truth">SOURCE_CONFIRMED ${gridLabel} / ${fc} frames (${rd.gridValidationStatus})</span>`);
    lines.push(`<p>Heuristic v2: <span class="${heurClass}">${rd.heuristicDetection.detected} (${rd.heuristicDetection.confidence}) \u2014 ${rd.heuristicDetection.matches ? 'matches' : 'DOES NOT match ground truth'}</span></p>`);

    // Animation Player — HTML frame player (canonical)
    lines.push('<div class="vfx-player" data-candidate-id="' + safeId + '" data-frame-count="' + fc + '">');
    lines.push('<div class="frame-display">');
    lines.push(`<img class="player-img" src="${base}frames/frame_001.png" alt="Frame 1">`);
    lines.push('</div>');
    lines.push('<div class="error-msg"></div>');
    lines.push('<div class="controls">');
    lines.push('<button class="btn-play">\u25B6 Play</button>');
    lines.push('<button class="btn-pause">\u23F8 Pause</button>');
    lines.push('<button class="btn-restart">\u21BB Restart</button>');
    lines.push('<button class="btn-prev">\u25C0 Prev</button>');
    lines.push('<button class="btn-next">\u25B6 Next</button>');
    lines.push('<button class="btn-loop">Loop: ON</button>');
    lines.push(`<select class="sel-speed">${speedOptions}</select>`);
    lines.push(`<input type="range" min="1" max="${fc}" value="1" class="scrubber">`);
    lines.push(`<span class="frame-counter">Frame 1 / ${fc}</span>`);
    lines.push('<button class="debug-toggle">Debug</button>');
    lines.push('</div>');
    lines.push('<div class="debug-panel">');
    lines.push(`<div class="dbg-frame">frame: 1 / ${fc}</div>`);
    lines.push('<div class="dbg-src">src: frame_001.png</div>');
    lines.push('<div class="dbg-playing">playing: false</div>');
    lines.push(`<div class="dbg-loaded">loaded: 0 / ${fc}</div>`);
    lines.push('</div>');
    lines.push('</div>');

    // Evidence and metadata
    lines.push('<div class="evidence">');
    lines.push('<div>');
    lines.push(`<p><strong>${gridLabel} Grid Overlay:</strong><br><img src="${base}${rd.visualEvidence.gridOverlay}" alt="Grid overlay"></p>`);
    lines.push(`<p><strong>${fc}-Frame Contact Sheet:</strong><br><img src="${base}${rd.visualEvidence.contactSheet}" alt="Contact sheet"></p>`);
    lines.push(`<p><strong>Alpha Boundary (frame 1):</strong><br><img src="${base}${rd.visualEvidence.alphaBoundary}" alt="Alpha boundary"></p>`);
    lines.push(`<table><tr><td>First (1)</td><td>Peak (${rd.recomputedVisuals.peakFrameIndex+1})</td><td>Last (${fc})</td></tr>`);
    lines.push(`<tr><td><img src="${base}${rd.visualEvidence.frameFirst}" alt="First"></td>`);
    lines.push(`<td><img src="${base}${rd.visualEvidence.framePeak}" alt="Peak"></td>`);
    lines.push(`<td><img src="${base}${rd.visualEvidence.frameLast}" alt="Last"></td></tr></table>`);
    lines.push(`<p><strong>Source Thumbnail:</strong><br><img src="${base}${rd.visualEvidence.thumbnail}" alt="Thumbnail"></p>`);
    lines.push(`<p><strong>GIF (secondary):</strong><br><img src="${base}${rd.visualEvidence.animatedGif}" alt="GIF" onerror="this.parentElement.innerHTML='<em>GIF unavailable</em>'"></p>`);
    lines.push('</div>');

    lines.push('<div class="metadata">');
    lines.push('<h3>Metadata</h3><table>');
    lines.push(`<tr><td>Candidate ID</td><td>${rd.candidateId}</td></tr>`);
    lines.push(`<tr><td>Source Path</td><td>${rd.sourceRelativePath}</td></tr>`);
    lines.push(`<tr><td>Collection</td><td>${rd.sourceCollection}</td></tr>`);
    lines.push(`<tr><td>Source Dimensions</td><td>${rd.sourceDimensions.width}x${rd.sourceDimensions.height}</td></tr>`);
    lines.push(`<tr><td>Native Grid</td><td>${gridLabel} (${fc} frames)</td></tr>`);
    lines.push(`<tr><td>Cell Dimensions</td><td>${rd.nativeCellDimensions.width}x${rd.nativeCellDimensions.height}</td></tr>`);
    lines.push(`<tr><td>Previous Grid (R1.2)</td><td>${rd.previousGrid} (${rd.previousFrameCount} frames)</td></tr>`);
    lines.push(`<tr><td>Grid Evidence</td><td>${rd.gridEvidenceSource}</td></tr>`);
    lines.push(`<tr><td>Grid Status</td><td>${rd.gridValidationStatus}</td></tr>`);
    lines.push(`<tr><td>Heuristic v2</td><td>${rd.heuristicDetection.detected} (${rd.heuristicDetection.confidence})</td></tr>`);
    lines.push(`<tr><td>Active Frames</td><td>${rd.recomputedVisuals.activeFrames}/${fc}</td></tr>`);
    lines.push(`<tr><td>Empty Frames</td><td>${rd.recomputedVisuals.emptyFrames} (${(rd.recomputedVisuals.emptyRatio*100).toFixed(1)}%)</td></tr>`);
    lines.push(`<tr><td>Avg Center Drift</td><td>${rd.recomputedVisuals.avgCenterDrift}px</td></tr>`);
    lines.push(`<tr><td>Clipping Frames</td><td>${rd.recomputedVisuals.clippingFrames} (${(rd.recomputedVisuals.clippingRatio*100).toFixed(1)}%)</td></tr>`);
    lines.push(`<tr><td>Peak Frame</td><td>${rd.recomputedVisuals.peakFrameIndex+1}</td></tr>`);
    lines.push(`<tr><td>Playback FPS</td><td>${rd.playback.baselineFps} (review only)</td></tr>`);
    lines.push(`<tr><td>Visual Validation</td><td>PENDING_HUMAN_REVIEW</td></tr>`);
    lines.push(`<tr><td>R2 Authorization</td><td>BLOCKED_PENDING_HUMAN_REVIEW</td></tr>`);
    lines.push('</table>');

    // Per-target semantic sections
    lines.push('<h3>Target Semantic Review</h3>');
    for (const t of rd.targets) {
      lines.push('<div class="target-section">');
      lines.push(`<h4>${t.targetId}: ${t.targetSheet}</h4>`);
      lines.push(`<table><tr><td>Action</td><td>${t.actionId}</td></tr>`);
      lines.push(`<tr><td>Category</td><td>${t.category}</td></tr>`);
      lines.push(`<tr><td>Recommendation</td><td>PENDING_HUMAN_REVIEW</td></tr>`);
      lines.push(`<tr><td>Notes</td><td>Review animation above for semantic fit with ${t.targetSheet}. Consider perspective, timing, and visual clarity for ${t.actionId}.</td></tr>`);
      lines.push('</table></div>');
    }
    lines.push('</div>'); // metadata

    lines.push('</div>'); // evidence
    lines.push('</div>'); // candidate
  }

  // Player JavaScript — minimal robust implementation (vanilla, no dependencies)
  lines.push('<script>');
  lines.push(`(function(){`);
  lines.push(`const FPS=${fps};`);
  lines.push(`const SPEEDS=${JSON.stringify(speeds)};`);
  lines.push(`function pad3(n){return String(n).padStart(3,'0');}`);
  lines.push(`function initPlayer(container){`);
  lines.push(`const candidateId=container.getAttribute('data-candidate-id');`);
  lines.push(`const dir=candidateId+'/frames/';`);
  lines.push(`const frameCount=parseInt(container.getAttribute('data-frame-count'),10)||64;`);
  lines.push(`const framePaths=[];`);
  lines.push(`for(let i=1;i<=frameCount;i++){framePaths.push(dir+'frame_'+pad3(i)+'.png');}`);
  lines.push(`const img=container.querySelector('.player-img');`);
  lines.push(`const counter=container.querySelector('.frame-counter');`);
  lines.push(`const scrubber=container.querySelector('.scrubber');`);
  lines.push(`const errBox=container.querySelector('.error-msg');`);
  lines.push(`const btnPlay=container.querySelector('.btn-play');`);
  lines.push(`const btnPause=container.querySelector('.btn-pause');`);
  lines.push(`const btnRestart=container.querySelector('.btn-restart');`);
  lines.push(`const btnPrev=container.querySelector('.btn-prev');`);
  lines.push(`const btnNext=container.querySelector('.btn-next');`);
  lines.push(`const btnLoop=container.querySelector('.btn-loop');`);
  lines.push(`const selSpeed=container.querySelector('.sel-speed');`);
  lines.push(`const dbgToggle=container.querySelector('.debug-toggle');`);
  lines.push(`const dbgPanel=container.querySelector('.debug-panel');`);
  lines.push(`const dbgFrame=container.querySelector('.dbg-frame');`);
  lines.push(`const dbgSrc=container.querySelector('.dbg-src');`);
  lines.push(`const dbgPlaying=container.querySelector('.dbg-playing');`);
  lines.push(`const dbgLoaded=container.querySelector('.dbg-loaded');`);
  lines.push(`let currentFrame=1;let playing=false;let loop=true;let speed=1;let timerId=null;let loadedCount=0;`);
  lines.push(`function showFrame(idx){`);
  lines.push(`if(idx<1)idx=1;if(idx>frameCount)idx=frameCount;`);
  lines.push(`currentFrame=idx;`);
  lines.push(`img.src=framePaths[idx-1];`);
  lines.push(`counter.textContent='Frame '+idx+' / '+frameCount;`);
  lines.push(`scrubber.value=idx;`);
  lines.push(`updateDebug();`);
  lines.push(`}`);
  lines.push(`function updateDebug(){`);
  lines.push(`dbgFrame.textContent='frame: '+currentFrame+' / '+frameCount;`);
  lines.push(`dbgSrc.textContent='src: frame_'+pad3(currentFrame)+'.png';`);
  lines.push(`dbgPlaying.textContent='playing: '+playing;`);
  lines.push(`dbgLoaded.textContent='loaded: '+loadedCount+' / '+frameCount;`);
  lines.push(`}`);
  lines.push(`function startTimer(){`);
  lines.push(`if(timerId)clearInterval(timerId);`);
  lines.push(`const interval=Math.round(1000/(FPS*speed));`);
  lines.push(`timerId=setInterval(function(){`);
  lines.push(`let n=currentFrame+1;`);
  lines.push(`if(n>frameCount){if(loop){n=1;}else{pause();return;}}`);
  lines.push(`showFrame(n);`);
  lines.push(`},interval);}`);
  lines.push(`function play(){if(playing)return;playing=true;btnPlay.textContent='\\u23F8 Playing';startTimer();updateDebug();}`);
  lines.push(`function pause(){playing=false;if(timerId){clearInterval(timerId);timerId=null;}btnPlay.textContent='\\u25B6 Play';updateDebug();}`);
  lines.push(`function restart(){const wasPlaying=playing;pause();showFrame(1);if(wasPlaying)play();}`);
  lines.push(`function prev(){pause();let n=currentFrame-1;if(n<1)n=frameCount;showFrame(n);}`);
  lines.push(`function next(){pause();let n=currentFrame+1;if(n>frameCount)n=1;showFrame(n);}`);
  lines.push(`function scrub(val){pause();showFrame(parseInt(val,10));}`);
  lines.push(`function toggleLoop(){loop=!loop;btnLoop.textContent='Loop: '+(loop?'ON':'OFF');}`);
  lines.push(`function setSpeed(val){speed=parseFloat(val);if(playing){startTimer();}updateDebug();}`);
  lines.push(`function toggleDebug(){dbgPanel.classList.toggle('visible');}`);
  lines.push(`function showError(msg){errBox.style.display='block';errBox.textContent=msg;}`);
  lines.push(`btnPlay.addEventListener('click',play);`);
  lines.push(`btnPause.addEventListener('click',pause);`);
  lines.push(`btnRestart.addEventListener('click',restart);`);
  lines.push(`btnPrev.addEventListener('click',prev);`);
  lines.push(`btnNext.addEventListener('click',next);`);
  lines.push(`btnLoop.addEventListener('click',toggleLoop);`);
  lines.push(`selSpeed.addEventListener('change',function(){setSpeed(this.value);});`);
  lines.push(`scrubber.addEventListener('input',function(){scrub(this.value);});`);
  lines.push(`dbgToggle.addEventListener('click',toggleDebug);`);
  lines.push(`img.addEventListener('error',function(){showError('Failed to load: '+img.src);});`);
  lines.push(`// Preload as optimization only — never gates playback`);
  lines.push(`for(let i=0;i<frameCount;i++){`);
  lines.push(`const pre=new Image();`);
  lines.push(`pre.onload=function(){loadedCount++;updateDebug();};`);
  lines.push(`pre.onerror=function(){loadedCount++;updateDebug();};`);
  lines.push(`pre.src=framePaths[i];}`);
  lines.push(`// Show frame 1 immediately and auto-play`);
  lines.push(`showFrame(1);`);
  lines.push(`play();`);
  lines.push(`}`);
  lines.push(`window.addEventListener('DOMContentLoaded',function(){`);
  lines.push(`const containers=document.querySelectorAll('.vfx-player');`);
  lines.push(`for(let i=0;i<containers.length;i++){initPlayer(containers[i]);}`);
  lines.push(`});`);
  lines.push(`})();`);
  lines.push('</script>');

  lines.push('<hr><p style="color:#666;font-size:0.85em;">Generated by tools/vfx/r1_2_1_regenerate_review_gallery.mjs — R1.2.4 Native Grid Convention. HTML frame player is canonical. GIF is secondary. All visual evidence is external to the RPGThreeJS repository.</p>');
  lines.push('</body></html>');
  return lines.join('\n');
}

try { main(); } catch(e) { console.error('Fatal:', e); process.exit(1); }

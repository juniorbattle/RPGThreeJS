/**
 * GIF Cadence Forensics — extracts per-frame delays from CartoonCoffee GIF previews.
 *
 * GIF format: frame delays are stored in Graphics Control Extension (GCE) blocks
 * as unsigned 16-bit integers in units of 1/100th second (centiseconds).
 * A delay of 0 means "as fast as possible" — browsers typically render at ~10cs (100ms).
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MEGA_PACK_ROOT = 'C:/Users/miche/Documents/VFX_Library/CartoonCoffeeMegaPack';
const PREVIEW_INDEX_PATH = './docs/reports/vfx-megapack-preview-index.json';
const INVENTORY_PATH = './docs/reports/vfx-megapack-r1-2-4-corrected-inventory.json';

function parseGifFrameDelays(buffer) {
  const delays = [];
  let offset = 0;

  const signature = buffer.toString('ascii', 0, 6);
  if (!signature.startsWith('GIF')) throw new Error(`Not a GIF: ${signature}`);
  offset = 6;

  const width = buffer.readUInt16LE(offset);
  const height = buffer.readUInt16LE(offset + 2);
  const packed = buffer[offset + 4];
  const gctSize = packed & 0x80 ? Math.pow(2, (packed & 0x07) + 1) : 0;
  offset += 7;
  if (gctSize > 0) offset += gctSize * 3;

  while (offset < buffer.length) {
    const blockType = buffer[offset];

    if (blockType === 0x21) {
      const label = buffer[offset + 1];
      offset += 2;

      if (label === 0xF9) {
        offset += 1; // block size byte
        offset += 1; // packed
        const delayCs = buffer.readUInt16LE(offset);
        delays.push(delayCs * 10);
        offset += 2;
        offset += 1; // transparent color index
        offset += 1; // terminator
      } else {
        while (offset < buffer.length && buffer[offset] !== 0x00) {
          offset += 1 + buffer[offset];
        }
        offset += 1;
      }
    } else if (blockType === 0x2C) {
      offset += 10;
      const imgPacked = buffer[offset - 1];
      const lctSize = imgPacked & 0x80 ? Math.pow(2, (imgPacked & 0x07) + 1) : 0;
      if (lctSize > 0) offset += lctSize * 3;
      offset += 1; // LZW min code size
      while (offset < buffer.length && buffer[offset] !== 0x00) {
        offset += 1 + buffer[offset];
      }
      offset += 1;
    } else if (blockType === 0x3B) {
      break;
    } else {
      offset += 1;
    }
  }

  return { delays, width, height };
}

const previewIndex = JSON.parse(readFileSync(PREVIEW_INDEX_PATH, 'utf-8'));
const inventory = JSON.parse(readFileSync(INVENTORY_PATH, 'utf-8'));

const invMap = new Map();
for (const rec of inventory.results) {
  invMap.set(rec.assetId, rec);
}

// Representative sample: 16f + 64f across visual families
const SAMPLE_IDS = [
  'r1_0489', 'r1_2561', 'r1_0545', 'r1_0450', 'r1_1700',
  'r1_1605', 'r1_1712', 'r1_0971', 'r1_0480', 'r1_0503',
  'r1_0677', 'r1_2509', 'r1_0525', 'r1_0001', 'r1_0006',
  'r1_0010', 'r1_0020', 'r1_0030', 'r1_0040', 'r1_0050',
  'r1_0060', 'r1_0070', 'r1_0080', 'r1_0090', 'r1_0100',
  'r1_0110', 'r1_0120', 'r1_0130', 'r1_0140', 'r1_0150',
  'r1_0160', 'r1_0170', 'r1_0180', 'r1_0190', 'r1_0200',
];

const results = [];

for (const candidateId of SAMPLE_IDS) {
  const invRec = invMap.get(candidateId);
  const previewEntry = previewIndex.index[candidateId];

  if (!invRec) { console.log(`SKIP ${candidateId}: not in inventory`); continue; }
  if (!previewEntry || previewEntry.status !== 'RESOLVED' || !previewEntry.previewRelativePath) {
    console.log(`SKIP ${candidateId}: no GIF preview`);
    continue;
  }

  const gifPath = join(MEGA_PACK_ROOT, '02_previews', previewEntry.previewRelativePath.replace(/\\/g, '/'));
  if (!existsSync(gifPath)) { console.log(`SKIP ${candidateId}: GIF not found`); continue; }

  const buffer = readFileSync(gifPath);
  let parsed;
  try { parsed = parseGifFrameDelays(buffer); }
  catch (e) { console.log(`SKIP ${candidateId}: parse error: ${e.message}`); continue; }

  const { delays, width: gw, height: gh } = parsed;
  const totalMs = delays.reduce((s, d) => s + d, 0);
  const totalS = totalMs / 1000;
  const fc = delays.length;
  const avgMs = fc > 0 ? totalMs / fc : 0;
  const fps = totalMs > 0 ? fc / totalS : 0;
  const uniqueDelays = [...new Set(delays)];
  const hasVar = uniqueDelays.length > 1;

  const assumedMs = invRec.width === 2048 ? 50 : 20;
  const assumedS = (invRec.nativeFrameCount * assumedMs) / 1000;

  const oldQ = Math.round(assumedS * 1.00 * 1000) / 1000;
  const oldN = Math.round(assumedS * 1.30 * 1000) / 1000;
  const oldL = Math.round(assumedS * 1.75 * 1000) / 1000;

  const ratio = totalS > 0 ? Math.round((assumedS / totalS) * 100) / 100 : null;

  results.push({
    candidateId,
    sourceFilename: invRec.sourceFilename,
    collection: invRec.collection,
    pngDimensions: `${invRec.width}x${invRec.height}`,
    pngGrid: invRec.nativeGrid,
    pngFrameCount: invRec.nativeFrameCount,
    gifDimensions: `${gw}x${gh}`,
    gifFrameCount: fc,
    gifDelays: delays,
    gifUniqueDelays: uniqueDelays,
    gifHasVariableDelays: hasVar,
    gifTotalDurationMs: totalMs,
    gifTotalDurationS: Math.round(totalS * 1000) / 1000,
    gifAvgDelayMs: Math.round(avgMs * 100) / 100,
    gifEffectiveFps: Math.round(fps * 100) / 100,
    assumedFrameDurationMs: assumedMs,
    assumedNativeDurationS: Math.round(assumedS * 1000) / 1000,
    oldQuick: oldQ,
    oldNormal: oldN,
    oldLong: oldL,
    ratioAssumedVsGif: ratio,
  });

  console.log(`${candidateId} | ${invRec.sourceFilename.substring(0, 35).padEnd(35)} | ${String(invRec.nativeFrameCount).padStart(2)}f | GIF: ${String(fc).padStart(2)}f ${totalS.toFixed(3)}s | assumed: ${assumedS.toFixed(3)}s | ratio: ${ratio ? ratio.toFixed(2) : 'N/A'}x${hasVar ? ' | VAR' : ''}`);
}

const d16 = results.filter(r => r.pngFrameCount === 16).map(r => r.gifTotalDurationS);
const d64 = results.filter(r => r.pngFrameCount === 64).map(r => r.gifTotalDurationS);

function median(a) { if (!a.length) return null; const s = [...a].sort((x,y)=>x-y); const m = Math.floor(s.length/2); return s.length%2 ? s[m] : (s[m-1]+s[m])/2; }
function mean(a) { return a.length ? a.reduce((x,y)=>x+y,0)/a.length : null; }
function range(a) { return a.length ? { min: Math.min(...a), max: Math.max(...a) } : null; }

const stats = {
  totalAnalyzed: results.length,
  count16f: d16.length,
  count64f: d64.length,
  variableDelayCount: results.filter(r => r.gifHasVariableDelays).length,
  median16f: median(d16),
  mean16f: mean(d16),
  range16f: range(d16),
  median64f: median(d64),
  mean64f: mean(d64),
  range64f: range(d64),
};

console.log('\n=== STATISTICS ===');
console.log(JSON.stringify(stats, null, 2));

writeFileSync('./docs/reports/vfx-cadence-forensics-raw.json', JSON.stringify({ stats, results }, null, 2));
console.log(`\nWrote ${results.length} analyses to docs/reports/vfx-cadence-forensics-raw.json`);

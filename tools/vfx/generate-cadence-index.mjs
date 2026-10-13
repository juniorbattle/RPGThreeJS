/**
 * Generate full cadence index from ALL available CartoonCoffee GIF previews.
 * Parses every resolved GIF, extracts frame delays, and produces a compact
 * candidateId → authoredDurationMs index for runtime consumption.
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MEGA_PACK_ROOT = 'C:/Users/miche/Documents/VFX_Library/CartoonCoffeeMegaPack';
const PREVIEW_INDEX_PATH = './docs/reports/vfx-megapack-preview-index.json';
const INVENTORY_PATH = './docs/reports/vfx-megapack-r1-2-4-corrected-inventory.json';

function parseGifFrameDelays(buffer) {
  const delays = [];
  let offset = 6; // skip GIF header
  const packed = buffer[offset + 4];
  const gctSize = packed & 0x80 ? Math.pow(2, (packed & 0x07) + 1) : 0;
  offset += 7;
  if (gctSize > 0) offset += gctSize * 3;

  while (offset < buffer.length) {
    const bt = buffer[offset];
    if (bt === 0x21) {
      const label = buffer[offset + 1];
      offset += 2;
      if (label === 0xF9) {
        offset += 1;
        offset += 1;
        delays.push(buffer.readUInt16LE(offset) * 10);
        offset += 2;
        offset += 1;
        offset += 1;
      } else {
        while (offset < buffer.length && buffer[offset] !== 0x00) offset += 1 + buffer[offset];
        offset += 1;
      }
    } else if (bt === 0x2C) {
      offset += 10;
      const ip = buffer[offset - 1];
      const lct = ip & 0x80 ? Math.pow(2, (ip & 0x07) + 1) : 0;
      if (lct > 0) offset += lct * 3;
      offset += 1;
      while (offset < buffer.length && buffer[offset] !== 0x00) offset += 1 + buffer[offset];
      offset += 1;
    } else if (bt === 0x3B) break;
    else offset += 1;
  }
  return delays;
}

const previewIndex = JSON.parse(readFileSync(PREVIEW_INDEX_PATH, 'utf-8'));
const inventory = JSON.parse(readFileSync(INVENTORY_PATH, 'utf-8'));
const invMap = new Map();
for (const rec of inventory.results) invMap.set(rec.assetId, rec);

const cadenceIndex = {};
let parsed = 0, skipped = 0, failed = 0;
const allDelays = new Map();
let delay40count = 0, otherDelayCount = 0;

for (const [candidateId, entry] of Object.entries(previewIndex.index)) {
  if (entry.status !== 'RESOLVED' || !entry.previewRelativePath) { skipped++; continue; }
  const invRec = invMap.get(candidateId);
  if (!invRec) { skipped++; continue; }

  const gifPath = join(MEGA_PACK_ROOT, '02_previews', entry.previewRelativePath.replace(/\\/g, '/'));
  if (!existsSync(gifPath)) { skipped++; continue; }

  let delays;
  try { delays = parseGifFrameDelays(readFileSync(gifPath)); }
  catch { failed++; continue; }

  if (delays.length === 0) { failed++; continue; }

  const totalMs = delays.reduce((s, d) => s + d, 0);
  const uniqueDelays = [...new Set(delays)];

  // Track delay distribution
  for (const d of uniqueDelays) {
    allDelays.set(d, (allDelays.get(d) ?? 0) + 1);
  }
  if (uniqueDelays.length === 1 && uniqueDelays[0] === 40) delay40count++;
  else otherDelayCount++;

  cadenceIndex[candidateId] = {
    referenceDurationMs: totalMs,
    gifFrameCount: delays.length,
    frameDelayMs: uniqueDelays.length === 1 ? uniqueDelays[0] : -1, // -1 = variable
    atlasFrameCount: invRec.nativeFrameCount,
    atlasWidth: invRec.width,
  };
  parsed++;
}

console.log(`Parsed: ${parsed}, Skipped: ${skipped}, Failed: ${failed}`);
console.log(`Uniform 40ms: ${delay40count}, Other: ${otherDelayCount}`);
console.log(`Delay distribution:`);
for (const [delay, count] of [...allDelays.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${delay}ms: ${count} candidates`);
}

// Compute fallback statistics
const durations = Object.values(cadenceIndex).map(c => c.authoredDurationMs);
const d16 = durations.filter((_, i) => Object.values(cadenceIndex)[i]?.atlasFrameCount === 16);
const d64 = durations.filter((_, i) => Object.values(cadenceIndex)[i]?.atlasFrameCount === 64);

function median(a) { if (!a.length) return 0; const s = [...a].sort((x,y)=>x-y); const m = Math.floor(s.length/2); return s.length%2 ? s[m] : (s[m-1]+s[m])/2; }
function mean(a) { return a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0; }

console.log(`\n16f: n=${d16.length}, median=${median(d16)}ms, mean=${Math.round(mean(d16))}ms`);
console.log(`64f: n=${d64.length}, median=${median(d64)}ms, mean=${Math.round(mean(d64))}ms`);

writeFileSync('./docs/reports/vfx-cadence-index.json', JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: 'CartoonCoffee Mega Pack GIF previews (preview-generation reference, not proven vendor-native metadata)',
  totalCandidates: parsed,
  universalDelayMs: 40,
  fallbackRule: 'atlasFrameCount × 40ms (inferred reference cadence)',
  index: cadenceIndex,
}, null, 2));

console.log(`\nWrote cadence index to docs/reports/vfx-cadence-index.json (${parsed} entries)`);

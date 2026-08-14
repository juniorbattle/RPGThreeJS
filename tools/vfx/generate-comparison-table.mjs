/**
 * Generate the V2.2.5 cadence comparison table for the report.
 * Computes old vs new durations for all sampled candidates.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const forensics = JSON.parse(readFileSync('./docs/reports/vfx-cadence-forensics-raw.json', 'utf-8'));
const cadenceIndex = JSON.parse(readFileSync('./docs/reports/vfx-cadence-index.json', 'utf-8'));

const OLD_MULT = { QUICK: 1.00, NORMAL: 1.30, LONG: 1.75 };
const NEW_MULT = { QUICK: 0.35, NORMAL: 0.60, LONG: 1.00 };
const NEW_FLOOR = { QUICK: 0.40, NORMAL: 0.65, LONG: 1.00 };
const CLAMP = { min: 0.10, max: 6.0 };

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

const table = [];
for (const r of forensics.results) {
  const gifDur = r.gifTotalDurationS;
  const oldNative = r.assumedNativeDurationS;
  const newBaseline = gifDur; // GIF-authored duration is the new baseline

  // Old durations
  const oldQ = clamp(Math.round(oldNative * OLD_MULT.QUICK * 1000) / 1000, CLAMP.min, CLAMP.max);
  const oldN = clamp(Math.round(oldNative * OLD_MULT.NORMAL * 1000) / 1000, CLAMP.min, CLAMP.max);
  const oldL = clamp(Math.round(oldNative * OLD_MULT.LONG * 1000) / 1000, CLAMP.min, CLAMP.max);

  // New durations (using GIF-authored baseline + floor)
  const newQ = clamp(Math.max(Math.round(newBaseline * NEW_MULT.QUICK * 1000) / 1000, NEW_FLOOR.QUICK), CLAMP.min, CLAMP.max);
  const newN = clamp(Math.max(Math.round(newBaseline * NEW_MULT.NORMAL * 1000) / 1000, NEW_FLOOR.NORMAL), CLAMP.min, CLAMP.max);
  const newL = clamp(Math.max(Math.round(newBaseline * NEW_MULT.LONG * 1000) / 1000, NEW_FLOOR.LONG), CLAMP.min, CLAMP.max);

  table.push({
    candidateId: r.candidateId,
    sourceFilename: r.sourceFilename,
    pngFrameCount: r.pngFrameCount,
    gifDurationS: gifDur,
    oldAssumedNativeS: oldNative,
    oldQuick: oldQ,
    oldNormal: oldN,
    oldLong: oldL,
    newBaselineS: newBaseline,
    newQuick: newQ,
    newNormal: newN,
    newLong: newL,
    ratioOldQuickVsGif: oldNative > 0 ? Math.round((oldQ / gifDur) * 100) / 100 : null,
    ratioNewQuickVsGif: Math.round((newQ / gifDur) * 100) / 100,
  });
}

writeFileSync('./docs/reports/vfx-cadence-comparison-table.json', JSON.stringify(table, null, 2));

// Print summary
console.log('candidateId         | gifDur | oldQ  | oldN  | oldL  | newQ  | newN  | newL  | ratioOld | ratioNew');
console.log('-'.repeat(120));
for (const t of table.slice(0, 15)) {
  console.log(
    `${t.candidateId.padEnd(19)} | ${t.gifDurationS.toFixed(2)}s | ${t.oldQuick.toFixed(2)}s | ${t.oldNormal.toFixed(2)}s | ${t.oldLong.toFixed(2)}s | ${t.newQuick.toFixed(2)}s | ${t.newNormal.toFixed(2)}s | ${t.newLong.toFixed(2)}s | ${t.ratioOldQuickVsGif?.toFixed(2) ?? 'N/A'}x | ${t.ratioNewQuickVsGif.toFixed(2)}x`
  );
}
console.log(`\nWrote ${table.length} entries to docs/reports/vfx-cadence-comparison-table.json`);

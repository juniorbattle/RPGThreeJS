// Renders the whole cue table in Chromium (dev server on 5173) and measures it: duration, PCM peak, budget, determinism,
// and how long the main thread is held by the slowest render task. Usage: node tools/audio/measure-cues.mjs
import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
const result = await page.evaluate(async () => {
  const { renderCue, TABLE_CUE_IDS, cueMaxSeconds, cuePeakTarget } = await import('/src/audio/synthCues.ts');
  const { CUE_TABLE_MAX_BYTES } = await import('/src/audio/cueTable.ts');
  const long = [];
  const observer = new PerformanceObserver((list) => { for (const entry of list.getEntries()) long.push(entry.duration); });
  try { observer.observe({ entryTypes: ['longtask'] }); } catch { /* not available */ }
  const rate = 48000;
  const rows = [];
  let bytes = 0, slowestGraph = 0, worstPeak = 0, longest = 0, overLimit = [], total = 0;
  for (const id of TABLE_CUE_IDS) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    const started = performance.now();
    const buffer = await renderCue(id, rate);
    total += performance.now() - started;
    if (!buffer) { rows.push(`${id}: not rendered`); continue; }
    const data = buffer.getChannelData(0);
    let peak = 0;
    for (const x of data) peak = Math.max(peak, Math.abs(x));
    worstPeak = Math.max(worstPeak, peak);
    bytes += buffer.length * 4;
    longest = Math.max(longest, buffer.duration);
    if (buffer.duration > cueMaxSeconds(id)) overLimit.push(id);
  }
  // the same render twice gives the same samples, within rounding (-140 dBFS)
  const pick = TABLE_CUE_IDS.filter((_, i) => i % 23 === 0);
  let deterministic = true;
  for (const id of pick) {
    const [a, b] = [await renderCue(id, rate), await renderCue(id, rate)];
    const x = a.getChannelData(0), y = b.getChannelData(0);
    if (x.length !== y.length || x.some((v, i) => Math.abs(v - y[i]) > 1e-7)) deterministic = false;
  }
  await new Promise((resolve) => setTimeout(resolve, 200));
  observer.disconnect();
  return { count: TABLE_CUE_IDS.length, missing: rows, bytes, budget: CUE_TABLE_MAX_BYTES, worstPeak, target: cuePeakTarget(), longest, overLimit, renderMsTotal: Math.round(total), longTasks: long.map(Math.round), deterministic };
});
console.log(JSON.stringify(result, null, 1));
console.log(errors[0] ?? 'no page errors');
await browser.close();
const ok = !result.missing.length && !result.overLimit.length && result.bytes <= result.budget && result.worstPeak <= result.target + 1e-6 && result.deterministic;
process.exit(ok ? 0 : 1);

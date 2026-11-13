// Offline measure of the final limiter (OD-2026-11-01-B): sample peak of the loudest mix, and gain of a quiet mix.
// Needs the dev server on 5173 (BASE_URL overrides it). Usage: node tools/audio/limiter-peak.mjs
import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
const page = await browser.newPage();
await page.goto(process.env.BASE_URL ?? 'http://localhost:5173/', { waitUntil: 'domcontentloaded' });
const result = await page.evaluate(async () => {
  const { createMix, LIMITER_CEILING } = await import('/src/audio/mix.ts');
  const rate = 48000, seconds = 3;
  const render = async (build) => {
    const ctx = new OfflineAudioContext(2, rate * seconds, rate);
    const mix = createMix(ctx);
    build(ctx, mix.input);
    const out = await ctx.startRendering();
    let peak = 0, rms = 0;
    const skip = rate * 0.5;
    for (let c = 0; c < 2; c++) {
      const data = out.getChannelData(c);
      for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
      for (let i = skip; i < data.length; i++) rms += data[i] * data[i];
    }
    return { peak, rms: Math.sqrt(rms / (2 * (rate * seconds - skip))) };
  };
  const sine = (ctx, dest, f, gain) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; g.gain.value = gain; o.connect(g).connect(dest); o.start(); };
  const quiet = await render((ctx, input) => sine(ctx, input, 220, 0.1));
  // the worst case: music at maximum volume and four voices at their PCM peak, all in phase at the same instant
  const loud = await render((ctx, input) => { sine(ctx, input, 110, 0.75); for (let i = 0; i < 4; i++) sine(ctx, input, 110, 0.22); });
  const over = await render((ctx, input) => sine(ctx, input, 97, 4));
  return { ceiling: LIMITER_CEILING, quietGain: quiet.rms / (0.1 / Math.SQRT2), loudPeak: loud.peak, overPeak: over.peak };
});
const db = (v) => (20 * Math.log10(v)).toFixed(2);
console.log(`ceiling ${db(result.ceiling)} dBFS | quiet mix gain ${db(result.quietGain)} dB | loudest mix peak ${db(result.loudPeak)} dBFS | +12 dB overload peak ${db(result.overPeak)} dBFS`);
await browser.close();
process.exit(result.loudPeak <= result.ceiling && result.overPeak <= result.ceiling ? 0 : 1);

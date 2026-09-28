/** Built-app activation proof for the DEV-gated T0 Route Reward art. */
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { preview } from 'vite';

const output = process.argv.find(arg => arg.startsWith('--output='))?.slice('--output='.length)
  ?? 'docs/reports/traversal-t0-route-reward-art-1-browser/production-off';
const port = 5220;
const pouchPath = '/assets/generated/lion-phase/traversal/t0/reward/coin-pouch.png';
const server = await preview({ preview: { host: '127.0.0.1', port, strictPort: true } });
const browser = await chromium.launch({ headless: true });
const report = { task: 'TRAVERSAL-T0-ROUTE-REWARD-ART-1', build: 'Vite production preview',
  checks: [], errors: [] };

try {
  for (const [name, query] of [
    ['default', '?qa=1&traversal=t0'],
    ['dev-flag-in-production', '?qa=1&traversal=t0&traversalReward=1'],
  ]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });
    let pouchRequests = 0;
    page.on('pageerror', error => report.errors.push(`${name}: ${error.message}`));
    page.on('response', response => {
      if (response.url().endsWith(pouchPath)) pouchRequests++;
    });
    await page.route('**/assets/game-*.js', async route => {
      const response = await route.fetch();
      const source = await response.text();
      const pattern = /const ([A-Za-z_$][\w$]*)=new [A-Za-z_$][\w$]*\([^;]+?\);window\.addEventListener\("pagehide",\(\)=>\1\.dispose/;
      if (!pattern.test(source)) throw new Error('Built GameApp bootstrap hook could not be located.');
      await route.fulfill({ response, body: source.replace(pattern, (match, appName) =>
        match.replace(';window.addEventListener', `;window.__routeQaApp=${appName};window.addEventListener`)) });
    });
    await page.goto(`http://127.0.0.1:${port}/${query}`);
    await page.waitForSelector('.title-screen', { timeout: 30000 });
    await page.evaluate(async () => {
      const app = window.__routeQaApp;
      app.qaEnabled = true;
      app.traversalT0QaEnabled = true;
      await app.startTraversalT0Qa();
    });
    await page.waitForSelector('.traversal-route-risk', { timeout: 30000 });
    await page.waitForTimeout(150);
    const state = await page.evaluate(() => ({
      sceneCount: document.querySelectorAll('.traversal-t0').length,
      riskRendererCount: document.querySelectorAll('.traversal-route-risk').length,
      rewardRendererCount: document.querySelectorAll('.traversal-route-reward').length,
      rewardPickupCount: document.querySelectorAll('[data-reward-pickup]').length,
    }));
    const check = { name, query, ...state, pouchRequests };
    report.checks.push(check);
    if (state.sceneCount !== 1 || state.riskRendererCount !== 1
      || state.rewardRendererCount !== 0 || state.rewardPickupCount !== 0 || pouchRequests !== 0)
      report.errors.push(`${name}: production activation contract failed`);
    await page.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
}

await mkdir(output, { recursive: true });
await writeFile(`${output}/reward-activation.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.errors.length) throw new Error('Production Route Reward activation QA failed.');

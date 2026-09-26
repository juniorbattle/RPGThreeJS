/** Labeled contact sheets of existing plates for TRAVERSAL-REMAINING-LEGS-AUDIT-1. Read-only over assets. */
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const output = 'docs/reports/traversal-remaining-legs-audit-1-browser';
const ENV = 'public/assets/generated/lion-phase/environments/demo-environment-pack-v1';
const T0 = 'public/assets/generated/lion-phase/traversal/t0';
const sheets = {
  'asset-sheet-t0-world-reference': [
    `${T0}/world-v1/forest-road.png`, `${T0}/world-v1/forest-junction.png`, `${T0}/world-v1/opening-ambush.png`,
    `${T0}/world-v1/reference-convergence/nomad-waystation.png`, `${T0}/depth-v1/clearance/merchant-halt.png`,
    `${T0}/depth-v1/clearance/refugee-halt.png`, `${T0}/depth-v1/clearance/damaged-caravan.png`, `${T0}/world-v1/ruined-outpost.png`,
  ],
  'asset-sheet-t1-bois-clair': [
    `${ENV}/tableau/first-refuge-tableau.png`, `${ENV}/travel/first-refuge-travel.png`, `${ENV}/tableau/valmir-road-tableau.png`,
    `${ENV}/tableau/old-shrine-tableau.png`, `${ENV}/tableau/forest-road-tableau.png`, `${ENV}/tableau/forest-ambush-area-tableau.png`,
    `${ENV}/tableau/bois-clair-tableau-burning.png`, `${ENV}/tableau/bois-clair-tableau-aftermath-saved.png`,
    `${ENV}/tableau/bois-clair-tableau-aftermath-sacrificed.png`,
  ],
  'asset-sheet-t3-t4-final': [
    `${ENV}/tableau/second-refuge-night-tableau.png`, `${ENV}/travel/second-refuge-morning-travel.png`, `${ENV}/tableau/witness-road-tableau.png`,
    `${ENV}/tableau/dragon-roost-area.png`, `${ENV}/travel/shadow-ruins-approach.png`, `${ENV}/tableau/shadow-ruins-tableau.png`,
    `${ENV}/tableau/final-refuge-tableau.png`, `${ENV}/travel/lion-judgement-approach.png`, `${ENV}/tableau/lion-judgement-tableau.png`,
  ],
};

const browser = await chromium.launch({ headless: true });
try {
  for (const [name, files] of Object.entries(sheets)) {
    const cells = await Promise.all(files.map(async file => {
      const data = (await readFile(file)).toString('base64');
      const label = file.replace(/^public/, '');
      return `<figure><img src="data:image/png;base64,${data}"><figcaption>${label}</figcaption></figure>`;
    }));
    const page = await browser.newPage({ viewport: { width: 1800, height: 1200 }, deviceScaleFactor: 1 });
    await page.setContent(`<style>body{margin:0;background:#111;color:#eee;font:13px sans-serif;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px}
      figure{margin:0}img{width:100%;display:block}figcaption{padding:3px 0;word-break:break-all}</style>${cells.join('')}`);
    await page.waitForFunction(() => [...document.images].every(image => image.complete));
    await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
    await page.close();
    console.log('sheet', name);
  }
} finally {
  await browser.close();
}

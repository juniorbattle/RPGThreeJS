import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
const page = await browser.newPage({viewport:{width:1463,height:823}});
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
await page.goto('http://127.0.0.1:5175/?qa=1&traversal=t0');
await page.waitForSelector('.title-screen');
const result = {production:true, query:'?qa=1&traversal=t0',
  traversalCount:await page.locator('.traversal-t0').count(),
  titleVisible:await page.locator('.title-screen').isVisible(), errors};
assert.equal(result.traversalCount,0);
assert.equal(result.titleVisible,true);
assert.deepEqual(errors,[]);
await page.screenshot({path:'tools/traversal/qa/convergence/production-disabled.png'});
await writeFile('tools/traversal/qa/convergence/production-gate.json',JSON.stringify(result,null,2));
await browser.close();
console.log(result);

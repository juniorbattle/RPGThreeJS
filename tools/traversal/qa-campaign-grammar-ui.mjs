/** Companion for visual combat QA: DOM inspection and ordinary mouse/menu inputs only. */
import { chromium } from 'playwright';
import { appendFile } from 'node:fs/promises';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const page = browser.contexts()[0].pages()[0];
const command = JSON.parse(process.argv[2] ?? '{}');
const frame = command.combat ? page.frames().find(frame => frame.url().includes('legacy-combat')) : page.mainFrame();
if (!frame) throw new Error('Requested visible frame is absent.');
for (const action of command.actions ?? [command]) {
  if (action.strongest) await frame.locator('[data-ch]:not(.dis)').filter({ hasText: /^Attaque/ }).last().evaluate(element => element.click());
  if (action.selector) await frame.locator(action.selector).first().evaluate(element => {
    if (!element.classList.contains('dis') && !element.disabled) element.click();
  });
  if (action.key) await frame.locator('body').press(action.key);
  if (action.x !== undefined) await page.mouse.click(action.x, action.y);
  if (action.wait) await page.waitForTimeout(Math.min(action.wait, 3000));
}
await appendFile('docs/reports/t0-campaign-grammar-browser/ui-actions.jsonl', `${JSON.stringify(command)}\n`);
console.log((await frame.locator('body').innerText()).slice(-6000));
console.log(await frame.locator('button:visible').evaluateAll(buttons => buttons.map(button => ({
  text: button.textContent, id: button.id, data: { ...button.dataset }, disabled: button.disabled,
}))));
await page.screenshot({ path: 'docs/reports/t0-campaign-grammar-browser/current.png' });
await browser.close();

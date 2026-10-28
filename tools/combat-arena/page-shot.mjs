// Screenshot any dev page (full page) once body[data-ready] is set.
import { chromium } from 'playwright';
const [,, url, out, width = '1600'] = process.argv;
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: +width, height: 900 } });
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(url);
await page.waitForSelector('body[data-ready="1"]', { timeout: 60000 }).catch(() => errors.push('not ready'));
await page.waitForTimeout(500);
await page.screenshot({ path: out, fullPage: true });
if (errors.length) console.log(errors.join('\n'));
await browser.close();

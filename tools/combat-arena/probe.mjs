import { chromium } from 'playwright';
const [,, url, expr] = process.argv;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport:{ width:1440, height:810 } });
await page.goto(url, { waitUntil:'domcontentloaded' });
await page.waitForTimeout(7000);
console.log(JSON.stringify(await page.evaluate(expr), null, 1));
await browser.close();

import { chromium } from 'playwright';
const [,, url, out, waitMs='6000', action=''] = process.argv;
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport:{ width:1440, height:810 } });
const logs=[];
page.on('console', m => { if(['error','warning'].includes(m.type())) logs.push(m.type()+': '+m.text()); });
page.on('response', r => { if (r.status() >= 400) logs.push('http '+r.status()+' '+r.url()); });
page.on('pageerror', e => logs.push('pageerror: '+e.message+' '+(e.stack||'').split('\n').slice(1,4).join(' | ')));
await page.goto(url, { waitUntil:'domcontentloaded' });
await page.waitForTimeout(+waitMs);
if(action){ await page.evaluate(action).catch(e=>logs.push('action: '+e.message)); await page.waitForTimeout(2500); }
await page.screenshot({ path: out });
console.log(logs.slice(0,20).join('\n'));
await browser.close();

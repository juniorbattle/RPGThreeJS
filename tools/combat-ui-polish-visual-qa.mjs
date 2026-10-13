import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve('docs/reports/combat-ui-system-1-polish-browser');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });

const portraits = [
  ['Alistair', 'alistair'], ['Kestrel / Archer', 'archer'], ['White Mage', 'white_mage'], ['Dark Mage', 'dark_mage'],
  ['Serpent Raider', 'serpent_raider'], ['Serpent Brute', 'serpent_brute'], ['Serpent Oracle', 'serpent_oracle'],
  ['Serpent Duelist Elite', 'serpent_duelist_elite'], ['Serpent Elite Brute', 'serpent_elite_brute'],
  ['Serpent General Boss', 'serpent_general_boss'], ['Lion Champion Boss', 'lion_champion'],
  ['Wolf', 'wolf'], ['Forest Badger', 'forest_badger'], ['Wild Boar', 'wild_boar'],
  ['Young Dragon Elite', 'young_dragon_elite'], ['Alaric', 'alaric'],
];

const sheetHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;padding:20px;background:#07131f;color:#fff1d2;font:14px Georgia,serif}
  h1{margin:0 0 5px;color:#ffe4ad;font-size:24px}p{margin:0 0 15px;color:#cad5d5;font:12px Arial,sans-serif}
  .header,.row{display:grid;grid-template-columns:225px 150px 150px 150px 1fr;align-items:center;gap:12px}
  .header{padding:8px 12px;border:1px solid #b88d4d;background:#152c3b;font-size:13px;color:#ffe4ad}
  .row{min-height:99px;padding:7px 12px;border:1px solid #755c3d;border-top:0;background:linear-gradient(110deg,#102536,#061522)}
  .name{font-weight:700}.name small{display:block;margin-top:5px;color:#b6c4cc;font:11px Arial,sans-serif}
  .source{width:80px;height:80px;object-fit:contain;background:#0b1925;border:1px solid #634e34}
  .frame{position:relative;overflow:hidden;background:radial-gradient(circle at 50% 25%,#334b5b,#091724 72%);border:1px solid #e3bb79;box-shadow:inset 0 0 0 2px #a87a3d88,0 0 9px #ddad6170}
  .card{width:58px;height:62px}.turn{width:34px;height:34px}
  .frame img{display:block;width:100%;height:100%;object-fit:cover;object-position:center;padding:0}
  .before.upper-body img{transform:scale(2.2);transform-origin:50% 30%}
  .before.creature img{transform:scale(1.55);transform-origin:62% 70%}
  .after img{transform:translate(var(--combat-portrait-x,0%),var(--combat-portrait-y,0%)) scale(var(--combat-portrait-scale,1));transform-origin:center}
  .after.upper-body{--combat-portrait-scale:3.3;--combat-portrait-x:0%;--combat-portrait-y:42%}
  .after.creature{--combat-portrait-scale:2.35;--combat-portrait-x:-12%;--combat-portrait-y:-37%}
  .after.elite{--combat-portrait-scale:2.7;--combat-portrait-x:0%;--combat-portrait-y:37%}
  .sample{display:flex;align-items:center;gap:12px}.meta{font:11px Arial,sans-serif;color:#c2d0d2}
</style></head><body><h1>Combat portrait review — canonical masters</h1><p>Full 512×512 source · approved COMBAT-UI-SYSTEM-1 crop · premium crop at actual card and turn-order sizes. Art files are unchanged.</p>
<div class="header"><span>Identity</span><span>Canonical source</span><span>Before · card</span><span>Final · card</span><span>Final · turn order / crop metadata</span></div><div id="rows"></div>
<script type="module">
import { combatPortraitFraming } from '/src/combat/combatHudPresentation.ts';
const portraits=${JSON.stringify(portraits)};
document.getElementById('rows').innerHTML=portraits.map(([label,id])=>{
  const src='/assets/characters/pixel/masters/'+id+'.png';
  const {crop,style}=combatPortraitFraming(src);
  return '<div class="row"><div class="name">'+label+'<small>'+id+'.png</small></div><img class="source" src="'+src+'" alt=""><div class="frame card before '+crop+'"><img src="'+src+'" alt=""></div><div class="frame card after '+crop+'"><img src="'+src+'" alt=""'+style+'></div><div class="sample"><div class="frame turn after '+crop+'"><img src="'+src+'" alt=""'+style+'></div><span class="meta">'+crop+' · '+(style.match(/scale:([0-9.]+)/)?.[1]??'default')+'</span></div></div>';
}).join('');
document.body.dataset.ready='yes';
</script></body></html>`;

const page = await browser.newPage({ viewport: { width: 900, height: 1760 }, deviceScaleFactor: 2 });
await page.route('**/combat-portrait-sheet', route => route.fulfill({ status: 200, contentType: 'text/html', body: sheetHtml }));
await page.goto('http://127.0.0.1:5173/combat-portrait-sheet', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('body[data-ready="yes"]');
await page.locator('.row img').first().waitFor();
await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
await page.screenshot({ path: resolve(output, 'portrait-contact-sheet.png'), fullPage: true });
await page.close();

const comparisons = [
  ['Desktop normal', '1440x810-normal.jpg'],
  ['Desktop skills', '1440x810-campaign-skills-enabled.jpg'],
  ['Desktop target preview', '1440x810-campaign-enemy-preview.jpg'],
  ['Mobile normal', '390x844-normal.jpg'],
];
const comparisonRows = await Promise.all(comparisons.map(async ([label, file]) => {
  const before = await readFile(resolve('docs/reports/combat-ui-system-1-browser', file));
  const after = await readFile(resolve(output, file));
  return { label, before: `data:image/jpeg;base64,${before.toString('base64')}`, after: `data:image/jpeg;base64,${after.toString('base64')}` };
}));
const comparisonHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;padding:18px;background:#06111c;color:#fff1d2;font:14px Georgia,serif}
  h1{font-size:25px;color:#ffe4ad;margin:0 0 5px}p{font:12px Arial,sans-serif;color:#c5d2d4;margin:0 0 16px}
  h2{font-size:18px;margin:16px 0 7px;color:#ffdfa0}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  figure{margin:0;padding:7px;background:#112636;border:1px solid #b68a4e}figcaption{font:700 12px Arial,sans-serif;color:#f5d296;margin-bottom:6px}
  img{display:block;width:100%;height:auto;object-fit:contain;background:#000}
</style></head><body><h1>Combat HUD — visual intensity comparison</h1><p>Same runtime states and viewport dimensions. Left: approved COMBAT-UI-SYSTEM-1 baseline. Right: final premium polish.</p>
${comparisonRows.map(({label,before,after})=>`<h2>${label}</h2><div class="pair"><figure><figcaption>Before · 6bb44de</figcaption><img src="${before}"></figure><figure><figcaption>After · premium polish</figcaption><img src="${after}"></figure></div>`).join('')}</body></html>`;
const compare = await browser.newPage({ viewport: { width: 1480, height: 900 }, deviceScaleFactor: 1 });
await compare.setContent(comparisonHtml, { waitUntil: 'load' });
await compare.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
await compare.screenshot({ path: resolve(output, 'before-after-comparison.png'), fullPage: true });

const details = [
  { label: 'Portrait and unit card', file: '1440x810-campaign-skills-enabled.jpg', width: 1440, x: 8, y: 520, w: 270, h: 285, scale: 1.45 },
  { label: 'Skill panel and selected action', file: '1440x810-campaign-skills-enabled.jpg', width: 1440, x: 520, y: 525, w: 400, h: 280, scale: 1.2 },
  { label: 'Turn order and phase marker', file: '1440x810-campaign-skills-enabled.jpg', width: 1440, x: 585, y: 4, w: 275, h: 102, scale: 1.6 },
  { label: 'Target preview', file: '1440x810-campaign-enemy-preview.jpg', width: 1440, x: 610, y: 106, w: 225, h: 84, scale: 1.8 },
  { label: 'Mobile portrait and actions', file: '390x844-normal.jpg', width: 390, x: 0, y: 575, w: 390, h: 269, scale: 1.1 },
];
const detailRows = await Promise.all(details.map(async detail => {
  const before = await readFile(resolve('docs/reports/combat-ui-system-1-browser', detail.file));
  const after = await readFile(resolve(output, detail.file));
  return { ...detail, before: `data:image/jpeg;base64,${before.toString('base64')}`, after: `data:image/jpeg;base64,${after.toString('base64')}` };
}));
const detailHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;padding:18px;background:#06111c;color:#fff1d2;font:14px Georgia,serif}
  h1{font-size:25px;color:#ffe4ad;margin:0 0 5px}p{font:12px Arial,sans-serif;color:#c5d2d4;margin:0 0 16px}
  h2{font-size:18px;margin:16px 0 7px;color:#ffdfa0}.pair{display:flex;gap:14px}
  figure{margin:0;padding:7px;background:#112636;border:1px solid #b68a4e}figcaption{font:700 12px Arial,sans-serif;color:#f5d296;margin-bottom:6px}
  .crop{position:relative;overflow:hidden;background:#000}.crop img{position:absolute;display:block;max-width:none;height:auto}
</style></head><body><h1>Combat HUD — detail comparison</h1><p>Identical source screenshots and crop rectangles at larger display scale.</p>
${detailRows.map(({label,before,after,width,x,y,w,h,scale})=>`<h2>${label}</h2><div class="pair">${[['Before · 6bb44de',before],['After · premium polish',after]].map(([caption,src])=>`<figure><figcaption>${caption}</figcaption><div class="crop" style="width:${Math.round(w*scale)}px;height:${Math.round(h*scale)}px"><img src="${src}" style="width:${Math.round(width*scale)}px;left:-${Math.round(x*scale)}px;top:-${Math.round(y*scale)}px"></div></figure>`).join('')}</div>`).join('')}</body></html>`;
const detailPage = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
await detailPage.setContent(detailHtml, { waitUntil: 'load' });
await detailPage.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
await detailPage.screenshot({ path: resolve(output, 'before-after-details.png'), fullPage: true });

const beforeQa = JSON.parse(await readFile(resolve('docs/reports/combat-ui-system-1-browser/browser-qa.json')));
const afterQa = JSON.parse(await readFile(resolve(output, 'browser-qa.json')));
const afterByName = new Map(afterQa.results.map(result => [result.name, result]));
const surfaces = ['turnbar', 'objective', 'panel', 'menu', 'skillmenu', 'action-preview'];
const footprint = beforeQa.results.flatMap(before => {
  const after = afterByName.get(before.name);
  if (!after) return [];
  return surfaces.flatMap(surface => {
    const oldBox = before.boxes[surface], newBox = after.boxes[surface];
    if (!oldBox || !newBox) return [];
    return [{ state: before.name, surface, before: [oldBox.width, oldBox.height], after: [newBox.width, newBox.height], delta: [newBox.width - oldBox.width, newBox.height - oldBox.height] }];
  });
});
const growth = footprint.filter(entry => entry.delta.some(value => value > 0));
await writeFile(resolve(output, 'footprint-comparison.json'), JSON.stringify({ footprint, growth }, null, 2) + '\n');
await browser.close();
console.log(JSON.stringify({ contactSheet: resolve(output, 'portrait-contact-sheet.png'), comparison: resolve(output, 'before-after-comparison.png'), details: resolve(output, 'before-after-details.png'), footprintGrowth: growth }, null, 2));
if (growth.length) process.exitCode = 1;

import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const base = resolve('docs/reports/combat-ui-system-1-polish-browser');
const output = resolve('docs/reports/combat-ui-system-1-master-browser');
const runtimeSource = await readFile(resolve('src/combat/legacyCombatRuntime.js'), 'utf8');
const recruitSource = await readFile(resolve('src/game/catalog.ts'), 'utf8');
const portraitFields = [...(runtimeSource + recruitSource).matchAll(/portrait\s*:\s*'([^']+\.png)'/g)].map(match => match[1]);
const bossPortraits = [...runtimeSource.matchAll(/(?:serpent_captain|serpent_general_boss|alaric|lion_chief):'([^']+\.png)'/g)].map(match => match[1]);
const portraits = [...new Set([...portraitFields, ...bossPortraits])].sort();
await writeFile(resolve(output, 'portrait-census.json'), JSON.stringify(portraits, null, 2) + '\n');
const before = JSON.parse(await readFile(resolve(base, 'browser-qa.json'), 'utf8'));
const after = JSON.parse(await readFile(resolve(output, 'browser-qa.json'), 'utf8'));
const browser = await chromium.launch({ headless: true });

const sheetHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;padding:18px;background:#061522;color:#f8e9cb;font:13px Georgia,serif}
h1{margin:0 0 5px;font-size:24px}p{margin:0 0 14px;color:#c4d0d5;font:12px Arial,sans-serif}
.head,.row{display:grid;grid-template-columns:174px 115px 92px 92px 92px 92px 155px;align-items:center;gap:8px}
.head{padding:9px;background:#1b3444;border:1px solid #b89359;font:700 11px Arial,sans-serif;color:#ffe2a8}
.row{height:91px;padding:7px 9px;border:1px solid #756349;border-top:0;background:linear-gradient(95deg,#142b3c,#081724)}
.identity{font-weight:700;overflow-wrap:anywhere}.path{font:10px/1.2 Arial,sans-serif;color:#c5d6db;overflow-wrap:anywhere}
.master{width:65px;height:75px;object-fit:contain;background:#0b1c2a}
.sample{display:flex;align-items:center;gap:5px;font:10px Arial,sans-serif;color:#b8c9d0}
.frame{flex:none;position:relative;overflow:hidden;border:1px solid #e3bb79;background:radial-gradient(circle at 50% 28%,#294052,#081624 72%)}
.desktop-card{width:58px;height:62px}.desktop-turn{width:40px;height:40px}.mobile-card{width:47px;height:55px}.mobile-turn{width:31px;height:31px}
.frame img{display:block;width:100%;height:100%;object-fit:cover;object-position:center;padding:0;transform:translate(var(--combat-portrait-x,0%),var(--combat-portrait-y,0%)) scale(var(--combat-portrait-scale,1));transform-origin:center center;filter:contrast(1.08) saturate(1.1)}
.frame.upper-body{--combat-portrait-scale:3.3;--combat-portrait-x:0%;--combat-portrait-y:42%}.frame.creature{--combat-portrait-scale:2.35;--combat-portrait-x:-12%;--combat-portrait-y:-37%}.frame.elite{--combat-portrait-scale:2.7;--combat-portrait-x:0%;--combat-portrait-y:37%}
</style></head><body><h1>Combat portrait contact sheet V2 · 36 runtime identities</h1><p>Canonical sources and four frames at their production dimensions: desktop card 58×62, desktop turn 40×40, mobile card 47×55, mobile turn 31×31. Metadata is combat-only CSS; source pixels are unchanged.</p>
<div class="head"><span>Identity</span><span>Canonical master</span><span>Desktop card</span><span>Desktop turn</span><span>Mobile card</span><span>Mobile turn</span><span>Scale / X / Y</span></div><div id="rows"></div>
<script type="module">
import { combatPortraitFraming, COMBAT_PORTRAIT_FRAMING } from '/src/combat/combatHudPresentation.ts';
const paths=${JSON.stringify(portraits)};
document.getElementById('rows').innerHTML=paths.map(path=>{
  const name=path.split('/').pop().replace('.png','').replaceAll('_',' ');
  const {crop,style}=combatPortraitFraming(path);
  const meta=COMBAT_PORTRAIT_FRAMING[path];
  const sample=kind=>'<div class="sample"><div class="frame '+kind+' '+crop+'"><img src="'+path+'" alt=""'+style+'></div></div>';
  return '<div class="row"><div class="identity">'+name+'</div><div class="sample"><img class="master" src="'+path+'" alt=""><span class="path">'+path.replace('/assets/characters/pixel/','')+'</span></div>'+sample('desktop-card')+sample('desktop-turn')+sample('mobile-card')+sample('mobile-turn')+'<div class="path">'+meta.scale+' / '+meta.x+'% / '+meta.y+'%</div></div>';
}).join('');
document.body.dataset.ready='yes';
</script></body></html>`;
const sheet = await browser.newPage({ viewport: { width: 940, height: 1200 }, deviceScaleFactor: 1 });
await sheet.route('**/combat-portrait-sheet-v2', route => route.fulfill({ status: 200, contentType: 'text/html', body: sheetHtml }));
await sheet.goto('http://127.0.0.1:5173/combat-portrait-sheet-v2', { waitUntil: 'domcontentloaded' });
await sheet.waitForSelector('body[data-ready="yes"]');
const decoded = await sheet.evaluate(async () => Promise.all([...document.images].map(async img => { try { await img.decode(); return true; } catch { return false; } })));
if (decoded.some(ok => !ok)) throw new Error(`${decoded.filter(ok => !ok).length} contact-sheet portraits failed to decode`);
await sheet.screenshot({ path: resolve(output, 'portrait-contact-sheet-v2.png'), fullPage: true });
await sheet.setViewportSize({ width: 940, height: 4000 });
for (let group = 0; group < 3; group++) {
  const rows = sheet.locator('.row');
  const start = await rows.nth(group * 12).boundingBox();
  await sheet.screenshot({ path: resolve(output, `portrait-contact-sheet-v2-${group + 1}.png`), clip: { x: 18, y: start.y, width: 902, height: 12 * 91 } });
}
await sheet.close();

const comparisons = [
  ['desktop-normal', '1440x810-normal.jpg'],
  ['desktop-selected-action', '1440x810-move.jpg'],
  ['desktop-skills', '1440x810-campaign-skills-enabled.jpg'],
  ['desktop-target-preview', '1440x810-campaign-enemy-preview.jpg'],
  ['mobile-normal', '390x844-normal.jpg'],
];
for (const [name, file] of comparisons) {
  const old = (await readFile(resolve(base, file))).toString('base64');
  const next = (await readFile(resolve(output, file))).toString('base64');
  const width = name === 'mobile-normal' ? 390 : 1440;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:16px;background:#071522;color:#ffe6b4;font:15px Georgia,serif}h1{margin:0 0 12px;font-size:22px}.pair{display:flex;gap:12px}figure{margin:0;padding:7px;border:1px solid #aa864f;background:#173041}figcaption{margin-bottom:6px}img{display:block;width:${width}px;height:auto}</style></head><body><h1>${name.replaceAll('-', ' ')}</h1><div class="pair"><figure><figcaption>Before · ee43a525</figcaption><img src="data:image/jpeg;base64,${old}"></figure><figure><figcaption>After · master pass</figcaption><img src="data:image/jpeg;base64,${next}"></figure></div></body></html>`;
  const page = await browser.newPage({ viewport: { width: width * 2 + 64, height: 900 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => Promise.all([...document.images].map(img => img.decode())));
  await page.screenshot({ path: resolve(output, `before-after-${name}.png`), fullPage: true });
  await page.close();
}

const beforeByName = new Map(before.results.map(result => [result.name, result]));
const afterByName = new Map(after.results.map(result => [result.name, result]));
const surfaceStates = {
  turnbar: 'normal', hint: 'normal', panel: 'normal', menu: 'normal', objective: 'normal',
  skillmenu: 'campaign-skills-enabled', 'action-preview': 'campaign-enemy-preview',
};
const viewportNames = ['1440x810', '1366x768', '620x780', '390x844'];
const round = number => Math.round(number * 100) / 100;
const area = box => box ? box.width * box.height : 0;
function unionArea(boxes, clip) {
  const rects = boxes.filter(Boolean).map(box => ({
    x1: Math.max(box.x, clip.x), x2: Math.min(box.right, clip.right),
    y1: Math.max(box.y, clip.y), y2: Math.min(box.bottom, clip.bottom),
  })).filter(box => box.x2 > box.x1 && box.y2 > box.y1);
  const xs = [...new Set(rects.flatMap(box => [box.x1, box.x2]))].sort((a,b) => a-b);
  let total = 0;
  for (let i = 0; i < xs.length - 1; i++) {
    const intervals = rects.filter(box => box.x1 < xs[i+1] && box.x2 > xs[i]).map(box => [box.y1, box.y2]).sort((a,b) => a[0]-b[0]);
    let start = -1, end = -1, covered = 0;
    for (const [y1,y2] of intervals) {
      if (y1 > end) { if (end > start) covered += end-start; start=y1; end=y2; }
      else end = Math.max(end,y2);
    }
    if (end > start) covered += end-start;
    total += (xs[i+1]-xs[i])*covered;
  }
  return total;
}
const geometry = viewportNames.map(viewport => {
  const [width,height] = viewport.split('x').map(Number);
  const full = { x:0, y:0, right:width, bottom:height };
  const center = { x:width*.25, y:height*.25, right:width*.75, bottom:height*.75 };
  const surface = Object.fromEntries(Object.entries(surfaceStates).map(([key,state]) => {
    const name = `${viewport}-${state}`;
    const old = beforeByName.get(name)?.boxes[key];
    const next = afterByName.get(name)?.boxes[key];
    if (!old || !next) return [key, null];
    return [key, {
      before: [old.width,old.height], after: [next.width,next.height],
      widthDeltaPct: round((next.width/old.width-1)*100),
      heightDeltaPct: round((next.height/old.height-1)*100),
      screenAreaBeforePct: round(area(old)/(width*height)*100),
      screenAreaAfterPct: round(area(next)/(width*height)*100),
      screenAreaDeltaPct: round((area(next)-area(old))/(width*height)*100),
      surfaceAreaDeltaPct: round((area(next)/area(old)-1)*100),
    }];
  }));
  const persistent = ['turnbar','hint','objective','log','panel','menu','help','settings-btn'];
  const occupancy = version => {
    const result = (version === 'before' ? beforeByName : afterByName).get(`${viewport}-normal`);
    const boxes = persistent.map(id => result?.boxes[id]);
    return { viewportPct: round(unionArea(boxes,full)/(width*height)*100), centerPct: round(unionArea(boxes,center)/(width*height*.25)*100) };
  };
  return { viewport, surface, persistentHud: { before: occupancy('before'), after: occupancy('after') } };
});
const desktop = geometry.filter(item => Number(item.viewport.split('x')[0]) > 700);
for (const item of desktop) {
  if (item.surface.turnbar.widthDeltaPct > 15 || item.surface.turnbar.heightDeltaPct > 15 || item.surface.menu.widthDeltaPct > 15 || item.surface.menu.heightDeltaPct > 15 || item.surface.panel.widthDeltaPct > 10) {
    throw new Error(`${item.viewport}: exceeded controlled desktop growth budget`);
  }
}
await writeFile(resolve(output, 'master-geometry.json'), JSON.stringify({ geometry, collisionErrors: after.errors.filter(error => error.includes('overlap')).length, qaErrors: after.errors }, null, 2) + '\n');
await browser.close();
console.log(JSON.stringify({ portraits: portraits.length, contactSheet: resolve(output, 'portrait-contact-sheet-v2.png'), comparisons: comparisons.map(([name]) => `before-after-${name}.png`), geometry: resolve(output, 'master-geometry.json'), qaErrors: after.errors }, null, 2));

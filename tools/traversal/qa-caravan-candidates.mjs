import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const out = 'tools/traversal/qa/caravan-depth/candidates';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1463, height: 823 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
const results = [];
for (const name of ['expedition', 'mechanical', 'armored']) {
  await page.goto('http://127.0.0.1:5184/tools/traversal/taxonomy-review.html');
  await page.waitForFunction(() => window.review);
  const src = `/assets/generated/lion-phase/traversal/t0/vehicle/traversal-caravan/candidates/${name}.png`;
  const bounds = await page.evaluate(async src => {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    const pixels = ctx.getImageData(0, 0, c.width, c.height).data;
    let left = c.width, right = 0, top = c.height, bottom = 0, transparent = 0;
    for(let y=0;y<c.height;y++) for(let x=0;x<c.width;x++) {
      const a=pixels[(y*c.width+x)*4+3]; if(a===0)transparent++;
      if(a>8){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
    }
    const vehicle=document.querySelector('.traversal-vehicle');
    vehicle.querySelectorAll('.traversal-vehicle__wheel').forEach(e=>e.remove());
    const art=vehicle.querySelector('.traversal-vehicle__art');
    const width=right-left,height=bottom-top;
    vehicle.style.aspectRatio=`${width} / ${height}`;
    img.style.cssText=`width:${c.width/width*100}%;height:${c.height/height*100}%;left:${-left/width*100}%;top:${-top/height*100}%`;
    img.className='traversal-vehicle__art';art.replaceWith(img);
    await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));
    return {width:c.width,height:c.height,left,right,top,bottom,transparent};
  },src);
  assert.ok(bounds.transparent > bounds.width*bounds.height*.1, `${name} must have actual alpha`);
  for(const lane of [0,1]) {
    await page.evaluate(lane=>{const s=window.review.scene;s.controller.advanceTo(.05);s.moveToLane(lane);s.updateWorldTransforms();},lane);
    await page.waitForTimeout(500);
    await page.screenshot({path:`${out}/${name}-${lane===0?'upper':'lower'}.png`});
  }
  await page.evaluate(()=>{const s=window.review.scene;s.moveToLane(0);s.advance(20);window.review.settle();});
  await page.waitForTimeout(500);
  await page.screenshot({path:`${out}/${name}-merchant.png`});
  const sha256=createHash('sha256').update(await readFile(`public${src}`)).digest('hex');
  results.push({name,src,bounds,sha256,status:'candidate',source:'built-in image_gen'});
}
assert.deepEqual(errors,[]);
await writeFile(`${out}/comparison.json`,JSON.stringify({results,errors},null,2));
await browser.close();
console.log(JSON.stringify(results,null,2));

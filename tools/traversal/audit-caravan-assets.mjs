import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root='/assets/generated/lion-phase/traversal/t0/';
const entries=[
 ['vehicle/traversal-caravan/candidates/expedition.png','A: covered expedition caravan','exec-a78c241c-d23d-43f9-8a4e-34e864d0db8f.png','candidate'],
 ['vehicle/traversal-caravan/candidates/mechanical.png','B: reinforced mechanical road wagon, wheel texture source','exec-28d33ba3-49fd-4127-a31e-67f12ef72976.png','selected'],
 ['vehicle/traversal-caravan/candidates/armored.png','C: compact armored travel caravan','exec-b947f6c8-02ad-4317-b646-2c54e5f2b378.png','candidate'],
 ['vehicle/traversal-caravan/chassis.png','Selected B chassis without road wheels for independent rotation','exec-09bf033b-7f85-438b-82d1-3a0841f04f92.png','selected'],
 ['depth-v1/foreground/ferns.png','Near-camera organic fern occlusion','exec-8fb482e9-466b-48e3-a56d-d30d903a27f9.png','selected'],
 ['depth-v1/foreground/roots.png','Low root and flower grouping; sparse foreground rhythm','exec-c7126fae-fdba-44bb-977b-1fbe583b1d3f.png','selected'],
 ['depth-v1/clearance/merchant-halt.png','Remove two foreground supply piles from lower travel corridor','exec-7d4800f6-e473-4752-a52a-64d2d8939d22.png','selected'],
 ['depth-v1/clearance/refugee-halt.png','Remove foreground cart fragments and supplies from lower corridor','exec-064f1e2b-c9d5-45fd-8687-8f89678d63e6.png','selected'],
 ['depth-v1/clearance/damaged-caravan.png','Remove foreground wreckage from lower corridor; keep upper wreck','exec-c0eb2043-a4cc-4680-96e8-27512a9e30c6.png','selected'],
];
const browser=await chromium.launch({headless:true});const page=await browser.newPage();
await page.goto('http://127.0.0.1:5182/tools/traversal/taxonomy-review.html');
const assets=[];
for(const [path,intent,source,status] of entries){
 const runtimePath=root+path;
 const bounds=await page.evaluate(async src=>{
  const i=new Image();i.src=src;await i.decode();const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;
  const ctx=c.getContext('2d');ctx.drawImage(i,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data;
  let left=c.width,top=c.height,right=0,bottom=0,transparent=0;
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const a=data[(y*c.width+x)*4+3];if(a===0)transparent++;if(a>8){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);}}
  return{width:c.width,height:c.height,left,top,right,bottom,transparent};
 },runtimePath);
 const sha256=createHash('sha256').update(await readFile(`public${runtimePath}`)).digest('hex');
 assets.push({runtimePath,intent,generator:'built-in image_gen',source:`C:/Users/miche/.codex/generated_images/01a0c5d7-7f3e-7ee2-9ed0-69fc84b070a5/${source}`,status,active:status==='selected',sha256,bounds});
}
await browser.close();
await writeFile('tools/traversal/qa/caravan-depth/asset-provenance.json',JSON.stringify({baseline:'7cfccfe37e6d5721db96748080b9552d4b4f32fb',assets},null,2));
console.log(JSON.stringify(assets.map(a=>({path:a.runtimePath,bounds:a.bounds})),null,2));

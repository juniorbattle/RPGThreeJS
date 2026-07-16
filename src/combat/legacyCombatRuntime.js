import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { UnitFocusController } from './UnitFocusController';
import { combatInitializeMessageSchema } from './protocol';
import { canStartDeployment, normalizeDeploymentLimit, orderDeploymentCandidates } from './deploymentRules';
import { getUnitVisualState } from './unitVisualState';
import { BackgroundLayerSystem } from '../render/BackgroundLayerSystem';
import { combatBackgroundFor } from '../render/combatBackgrounds';
import { COMBAT_PRESENTATION } from './combatPresentationConfig.js';
import { VfxSystem } from './vfx/VfxSystem';
import { installVfxWorkbench } from './vfx/VfxWorkbench';
import { skillById as SKILL_MAP } from '../game/skills';
import { getSkillPresentation } from './skillPresentation';

// ============================= CONFIG & UTILS =============================
const CFG = {
  W:8, D:4, TILE:1.18*COMBAT_PRESENTATION.tacticalArena.scale,
  COL:{ grassA:0x5d7650, grassB:0x536f49, dirt:0x5c4635, stone:0x85877a, stone2:0x646b66,
        water:0x2f6fa6, wood:0x574029, sky1:0x2a3a6a, sky2:0xe9a86a, move:0xb5c6ad, foe:0xd88461, ally:0x94bdd2, path:0xe4d294 }
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const easeOutCubic=p=>1-Math.pow(1-p,3);
const easeInOut=p=>p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
function mulberry32(s){return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
let RNG=mulberry32(20260615);
const rnd=(a=0,b=1)=>a+(b-a)*RNG();
const rint=(a,b)=>Math.floor(rnd(a,b+1));
const byId=id=>document.getElementById(id);
const dom={ ui:byId('ui'), turnbar:byId('turnbar'), hint:byId('hint'), panel:byId('panel'),
  menu:byId('menu'), skillmenu:byId('skillmenu'), actionPreview:byId('action-preview'), log:byId('log'), help:byId('help'),
  objective:byId('objective'), settingsBtn:byId('settings-btn'), settings:byId('settings'),
  fx:byId('fx'), banner:byId('banner'), loading:byId('loading'), tutorial:byId('tutorial'), bossTutorial:byId('boss-tutorial') };
const campaignParams=new URLSearchParams(location.search);
const CAMPAIGN_MODE=campaignParams.get('campaign')==='1'&&window.parent!==window;
let QA_ENABLED=false;
let COMBAT_ID='standalone';
let COMBAT_SCENE_ID='forest_route';
let COMBAT_OBJECTIVE='Vaincre tous les ennemis.';
let COMBAT_LABEL='Combat tactique';
let COMBAT_REWARD_TEXT='';
let MAX_PLAYER_UNITS=4;
let CAMPAIGN_SQUAD=[];
let CAMPAIGN_INVENTORY={};
let PREFERRED_UNIT_IDS=[];
let IS_BOSS_COMBAT=false;
let BOSS_SPAWNED=false;
let ENCOUNTER_ENEMY_VISUAL_IDS=[];
let ENCOUNTER_BOSS_VISUAL_ID='';
let ENCOUNTER_ESCORT_VISUAL_IDS=[];
const SCENE_AMBIENCE={
  forest_route:{fog:0x52635c,density:0.012,count:96,color:0xf3d983,size:0.082,opacity:0.5,area:[9.2,5.1],y:[0.28,3.55],rise:[0.05,0.15],drift:0.34,glow:0.1,glowColor:0xd8f0a8,mistColor:0xb9d7bd,mistOpacity:0.16,rayColor:0xf3d29a,rayOpacity:0.09},
  bois_clair_burning:{fog:0x5a3c32,density:0.014,count:132,color:0xffa24f,size:0.09,opacity:0.62,area:[9.6,5.5],y:[0.16,4.4],rise:[0.14,0.38],drift:0.52,glow:0.22,glowColor:0xff8136,mistColor:0x8b5f46,mistOpacity:0.2,rayColor:0xff9a3f,rayOpacity:0.15},
  lion_sanctum:{fog:0x4d445e,density:0.011,count:118,color:0xf7d98d,size:0.084,opacity:0.56,area:[9.1,5.2],y:[0.24,3.9],rise:[0.06,0.19],drift:0.28,glow:0.2,glowColor:0xd9b86a,mistColor:0xd3b978,mistOpacity:0.17,rayColor:0xffe1a1,rayOpacity:0.12},
};
let REDUCED_GRAPHICS=campaignParams.get('reduced')==='1';
function campaignUnitHealth(){
  const out={};
  for(const u of G.deployedUnits||[]) out[u.campaignId||u.name]=Math.max(0,Math.round(u.alive?u.hp:0));
  return out;
}
const notifyCampaignResult=victory=>window.parent.postMessage({
  type:'rpg-threejs:combat-result',victory,combatId:COMBAT_ID,inventory:G.inv,
  participants:G.deployedUnits.map(u=>u.campaignId||u.name),
  unitHealth:campaignUnitHealth()
},location.origin);

// ============================= GAME STATE =============================
const G = {
  units:[], tilesMesh:[], grid:[], order:[], turnIdx:0, round:1,
  mode:'idle', active:null, selected:null, pinnedUnit:null, hover:null, hoverUnit:null,
  movedThisTurn:false, actedThisTurn:false, movedBeforeAct:false, skillMovedThisTurn:false, pending:null, busy:false, over:false, inv:{},
  basicAttacksThisTurn:0, itemsUsedThisTurn:0,
  rosterDefs:[],selectedDeployId:null,deployPage:0,deployedUnits:[]
};
window.G = G;
const unitFocus=new UnitFocusController();

// ============================= TWEENS =============================
const tweens=[];
function tween(obj,to,dur,ease,onDone){
  const from={}; for(const k in to) from[k]=obj[k];
  const o={obj,to,from,dur:dur||0.3,ease:ease||easeOutCubic,t:0,onDone};
  tweens.push(o); return o;
}
function tweenP(obj,to,dur,ease){ return new Promise(r=>tween(obj,to,dur,ease,r)); }
function wait(s){ return new Promise(r=>setTimeout(r,s*1000)); }
function updateTweens(dt){
  for(let i=tweens.length-1;i>=0;i--){
    const o=tweens[i]; o.t+=dt; const p=clamp(o.t/o.dur,0,1), e=o.ease(p);
    for(const k in o.to) o.obj[k]=lerp(o.from[k],o.to[k],e);
    if(p>=1){ tweens.splice(i,1); o.onDone&&o.onDone(); }
  }
}

// ============================= RENDERER / SCENE / CAMERA =============================
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=0.98;
document.body.appendChild(renderer.domElement);
window.__COMBAT_RENDERER=renderer;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x111923);
scene.fog=new THREE.FogExp2(0x52635c, COMBAT_PRESENTATION.ambientMist.fogDensity);
const combatVfxSystem=new VfxSystem();

const camera=new THREE.PerspectiveCamera(COMBAT_PRESENTATION.camera.fov, innerWidth/innerHeight, 0.1, 200);
const cam={ yaw:0, dist:COMBAT_PRESENTATION.camera.baseDistance, height:COMBAT_PRESENTATION.camera.baseHeight, tx:0, ty:COMBAT_PRESENTATION.camera.targetY, tz:0 };
function applyCam(){
  const x=Math.sin(cam.yaw)*cam.dist, z=Math.cos(cam.yaw)*cam.dist;
  let sx=0,sy=0; if(G.shake&&G.shake.t<G.shake.dur){ const k=(1-G.shake.t/G.shake.dur)*G.shake.mag; sx=(Math.random()*2-1)*k; sy=(Math.random()*2-1)*k; }
  camera.position.set(cam.tx+x+sx, cam.ty+cam.height+sy, cam.tz+z);
  camera.lookAt(cam.tx,cam.ty,cam.tz);
}
applyCam();

// Lights
scene.add(new THREE.HemisphereLight(0xcfd8ca,0x313d36,0.86));
const sun=new THREE.DirectionalLight(0xffead1,1.78);
sun.position.set(-9,15,9); sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera,{left:-13,right:13,top:9,bottom:-9,near:1,far:60});
sun.shadow.bias=-0.0004; sun.shadow.normalBias=0.025;
scene.add(sun);
const fill=new THREE.DirectionalLight(0xd5b184,0.48); fill.position.set(10,6,8); scene.add(fill);

// ============================= POST-PROCESSING (HD-2D) =============================
const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),COMBAT_PRESENTATION.ambientMist.bloomStrength,COMBAT_PRESENTATION.ambientMist.bloomRadius,COMBAT_PRESENTATION.ambientMist.bloomThreshold);
composer.addPass(bloom);

const TiltShift={ uniforms:{ tDiffuse:{value:null}, w:{value:1/innerWidth}, h:{value:1/innerHeight},
    focus:{value:0.52}, range:{value:0.22}, strength:{value:2.6} },
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`uniform sampler2D tDiffuse;uniform float w,h,focus,range,strength;varying vec2 vUv;
  void main(){
    float d=clamp((abs(vUv.y-focus)-range)/range,0.0,1.0); float b=d*d*strength;
    vec2 oh=vec2(w*b,0.0),ov=vec2(0.0,h*b);
    vec4 hc=texture2D(tDiffuse,vUv)*0.2270
      +(texture2D(tDiffuse,vUv+oh*1.3846)+texture2D(tDiffuse,vUv-oh*1.3846))*0.3162
      +(texture2D(tDiffuse,vUv+oh*3.2307)+texture2D(tDiffuse,vUv-oh*3.2307))*0.0703;
    vec4 vc=texture2D(tDiffuse,vUv)*0.2270
      +(texture2D(tDiffuse,vUv+ov*1.3846)+texture2D(tDiffuse,vUv-ov*1.3846))*0.3162
      +(texture2D(tDiffuse,vUv+ov*3.2307)+texture2D(tDiffuse,vUv-ov*3.2307))*0.0703;
    gl_FragColor=(hc+vc)*0.5;
  }`};
const tiltPass=new ShaderPass(TiltShift); TiltShift.uniforms.strength.value=COMBAT_PRESENTATION.ambientMist.tiltShiftStrength; composer.addPass(tiltPass);

const Grade={ uniforms:{ tDiffuse:{value:null}, time:{value:0}, sat:{value:COMBAT_PRESENTATION.grade.saturation}, con:{value:COMBAT_PRESENTATION.grade.contrast},
    warm:{value:new THREE.Vector3(...COMBAT_PRESENTATION.grade.warm)}, vig:{value:COMBAT_PRESENTATION.grade.vignette}, lift:{value:COMBAT_PRESENTATION.grade.centerLift}, grain:{value:COMBAT_PRESENTATION.grade.grain} },
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`uniform sampler2D tDiffuse;uniform float time,sat,con,vig,lift,grain;uniform vec3 warm;varying vec2 vUv;
  void main(){
    vec4 c=texture2D(tDiffuse,vUv);
    c.rgb=(c.rgb-0.5)*con+0.5;
    float l=dot(c.rgb,vec3(0.299,0.587,0.114));
    c.rgb=mix(vec3(l),c.rgb,sat)*warm;
    vec2 q=vUv-0.5; float d=dot(q,q);
    c.rgb+=lift*smoothstep(0.44,0.0,d)*vec3(1.0,0.88,0.62);
    c.rgb*=clamp(1.0-d*vig,0.0,1.0);
    float g=fract(sin(dot(vUv+time*0.0007,vec2(12.9898,78.233)))*43758.5453);
    c.rgb+=(g-0.5)*grain;
    gl_FragColor=c;
  }`};
const gradePass=new ShaderPass(Grade); composer.addPass(gradePass);
composer.addPass(new OutputPass());

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight); composer.setSize(innerWidth,innerHeight);
  bloom.setSize(innerWidth,innerHeight);
  TiltShift.uniforms.w.value=1/innerWidth; TiltShift.uniforms.h.value=1/innerHeight;
});

// ============================= PROCEDURAL PIXEL-ART SPRITES =============================
const PAL={
  knight:{skin:'#f0c39b',hair:'#6b4a2a',c1:'#4f63b5',c2:'#2f3c78',acc:'#d9b25a',metal:'#d2d8ea',wpn:'sword',head:'helm'},
  archer:{skin:'#f0c39b',hair:'#caa24a',c1:'#4f9f5e',c2:'#2f6b3c',acc:'#caa05a',metal:'#cfd6e6',wpn:'bow',head:'hood-light'},
  mage:{skin:'#f0c39b',hair:'#3a2a55',c1:'#7a4fb0',c2:'#4d2f78',acc:'#f4d98b',metal:'#e6c2ff',wpn:'staff',head:'hat'},
  cleric:{skin:'#f0c39b',hair:'#b06a3a',c1:'#ece6d4',c2:'#c9bfa0',acc:'#d9b25a',metal:'#fff3c4',wpn:'mace',head:'hair'},
  brigand:{skin:'#d9a87a',hair:'#2a2a2a',c1:'#7a3636',c2:'#4d2222',acc:'#8a6a3a',metal:'#c2c8d6',wpn:'dagger',head:'hair'},
  brute:{skin:'#cf9a6a',hair:'#3a2a1a',c1:'#6a5638',c2:'#473722',acc:'#9a3030',metal:'#b9bfcf',wpn:'club',head:'bald'},
  darkmage:{skin:'#caa6c2',hair:'#150f24',c1:'#3a2a60',c2:'#221842',acc:'#b06aff',metal:'#c79bff',wpn:'staff',head:'darkhood'},
  rogue:{skin:'#f0c39b',hair:'#caa24a',c1:'#8a7a5a',c2:'#5a4a3a',acc:'#c9a05a',metal:'#cfd6e6',wpn:'dagger',head:'hood-light'}
};
const SPR={};
const externalSpriteCache=new Map();
function drawUnit(kind){
  const GW=22,GH=30,S=8,P=PAL[kind];
  const cv=document.createElement('canvas'); cv.width=GW*S; cv.height=GH*S;
  const x=cv.getContext('2d'); x.imageSmoothingEnabled=false;
  const R=(a,b,w,h,c)=>{x.fillStyle=c;x.fillRect(a*S,b*S,w*S,h*S);};
  const sh=(a,b,w,h)=>{x.fillStyle='rgba(0,0,0,.22)';x.fillRect(a*S,b*S,w*S,h*S);};
  // legs + boots
  R(8,19,3,7,P.c2); R(11,19,3,7,P.c2); R(8,25,3,1,'#23202b'); R(11,25,3,1,'#23202b');
  // arms
  R(5,11,2,7,P.c1); R(15,11,2,7,P.c1); R(5,17,2,2,P.skin); R(15,17,2,2,P.skin);
  // torso
  R(7,11,8,8,P.c1); sh(7,16,8,3); R(7,17,8,1,P.acc);
  // chest emblem
  R(10,12,2,3,P.acc);
  // head
  R(7,3,8,8,P.skin); sh(7,9,8,2);
  // eyes
  R(9,6,1,2,'#241a14'); R(13,6,1,2,'#241a14');
  // headgear
  if(P.head==='helm'){R(6,2,10,3,P.metal);R(6,5,10,1,P.metal);R(6,6,1,4,P.metal);R(15,6,1,4,P.metal);R(8,4,6,1,'#9aa3bd');}
  else if(P.head==='hat'){R(5,1,12,2,P.c1);R(7,-0,8,1,P.c1);R(8,0,6,2,P.c2);R(6,2,10,1,P.acc);}
  else if(P.head==='hood-light'){R(5,1,12,4,P.c1);R(6,5,2,5,P.c1);R(14,5,2,5,P.c1);}
  else if(P.head==='darkhood'){R(5,0,12,6,P.c1);R(6,6,2,5,P.c1);R(14,6,2,5,P.c1);x.fillStyle='rgba(0,0,0,.45)';x.fillRect(7*S,5*S,8*S,4*S);R(9,7,1,2,'#c79bff');R(13,7,1,2,'#c79bff');}
  else if(P.head==='bald'){R(6,2,10,3,P.skin);}
  else {R(5,1,12,4,P.hair);R(6,4,1,3,P.hair);R(15,4,1,3,P.hair);}
  // weapon
  if(P.wpn==='sword'){R(16,4,1,11,P.metal);R(17,5,1,8,'#aeb6cd');R(15,14,3,1,P.acc);R(16,15,1,3,P.c2);}
  else if(P.wpn==='bow'){R(4,7,1,12,P.acc);R(5,7,1,2,P.acc);R(5,17,1,2,P.acc);x.strokeStyle='#e7e0c6';x.lineWidth=S*0.4;x.beginPath();x.moveTo(4.5*S,7*S);x.lineTo(4.5*S,19*S);x.stroke();}
  else if(P.wpn==='staff'){R(16,3,1,15,P.c2);const og=x.createRadialGradient(16.5*S,3*S,1,16.5*S,3*S,3.5*S);og.addColorStop(0,'#ffffff');og.addColorStop(.5,P.metal);og.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=og;x.fillRect(13*S,0,8*S,7*S);}
  else if(P.wpn==='mace'){R(16,7,1,11,P.c2);R(15,5,3,3,P.metal);R(15,4,3,1,P.acc);}
  else if(P.wpn==='dagger'){R(16,11,1,5,P.metal);R(15,15,3,1,P.acc);}
  else if(P.wpn==='club'){R(16,6,2,12,P.c2);R(15,5,4,4,'#7a6038');}
  return {cv,GW,GH,S};
}
function texFromCanvas(cv){ const t=new THREE.CanvasTexture(cv); t.magFilter=THREE.NearestFilter; t.minFilter=THREE.NearestFilter; t.colorSpace=THREE.SRGBColorSpace; t.generateMipmaps=false; return t; }
function uiPortraitFor(path){ return typeof path==='string'&&path.includes('/assets/characters/pixel/full/')?path.replace('/full/','/ui/'):path; }
const EXTERNAL_SPRITE_HEIGHTS={
  '/assets/characters/pixel/full/serpent_raider.png':1.76,
  '/assets/characters/pixel/full/serpent_brute.png':1.76,
  '/assets/characters/pixel/full/serpent_oracle.png':1.76,
  '/assets/characters/pixel/full/serpent_elite_raider.png':2.04,
  '/assets/characters/pixel/full/serpent_elite_brute.png':2.2,
  '/assets/characters/pixel/full/serpent_duelist_elite.png':2.08,
  '/assets/characters/pixel/full/serpent_general_boss.png':2.42,
  '/assets/characters/pixel/full/wolf.png':1.42,
  '/assets/characters/pixel/full/venom_serpent.png':1.48,
  '/assets/characters/pixel/full/forest_spider.png':1.34,
  '/assets/characters/pixel/full/forest_badger.png':1.32,
  '/assets/characters/pixel/full/marsh_toad.png':1.36,
  '/assets/characters/pixel/full/cave_rat.png':1.24,
  '/assets/characters/pixel/full/wild_boar.png':1.42,
  '/assets/characters/pixel/full/goblin.png':1.72,
  '/assets/characters/pixel/full/skeleton.png':1.9,
  '/assets/characters/pixel/full/troll.png':2.3,
  '/assets/characters/pixel/full/young_wyrm.png':2.18,
  '/assets/characters/pixel/full/forest_troll_elite.png':2.3,
  '/assets/characters/pixel/full/young_dragon_elite.png':2.22,
  '/assets/characters/pixel/full/undead_champion.png':2.18,
  '/assets/characters/pixel/full/boss_serpent_captain.png':2.42,
  '/assets/characters/pixel/full/alaric.png':2.42,
  '/assets/characters/pixel/full/lion_champion.png':2.08,
  '/assets/characters/pixel/full/seal_guardian.png':2.05,
  '/assets/characters/pixel/full/lancer.png':2.12
};
async function preloadExternalSprites(){
  const urls=[...new Set([
    ...CAMPAIGN_SQUAD.map(unit=>unit&&unit.portrait),
    ...DEFS.map(unit=>unit&&unit.portrait),
    ...BOSS_DEFS.map(unit=>unit&&unit.portrait),
    ...Object.values(BOSS_PORTRAITS),
    ...Object.values(BOSS_ESCORTS).flat().map(unit=>unit&&unit.portrait),
    ...Object.values(VISUAL_UNIT_TEMPLATES).map(unit=>unit&&unit.portrait)
  ].filter(url=>typeof url==='string'&&url.startsWith('/assets/characters/pixel/full/')))];
  if(!urls.length)return;
  await Promise.all(urls.map(async url=>{
    if(externalSpriteCache.has(url))return;
    try{
      const tex=await new THREE.TextureLoader().loadAsync(url);
      tex.colorSpace=THREE.SRGBColorSpace; tex.magFilter=THREE.NearestFilter; tex.minFilter=THREE.LinearFilter; tex.generateMipmaps=false;
      const img=tex.image||{width:640,height:768},h=EXTERNAL_SPRITE_HEIGHTS[url]||2.08,w=Math.min(2.18,Math.max(1.08,img.width/img.height*h));
      externalSpriteCache.set(url,{tex,w,h,ar:w/h,portrait:url,external:true});
    }catch(err){ console.warn('Sprite externe indisponible',url,err); }
  }));
}
function outlineCanvas(cv,S,c){ const w=cv.width,h=cv.height; const sd=cv.getContext('2d').getImageData(0,0,w,h).data;
  const out=document.createElement('canvas'); out.width=w; out.height=h; const o=out.getContext('2d'); o.imageSmoothingEnabled=false;
  const od=o.createImageData(w,h), dd=od.data; const A=(x,y)=>(x<0||y<0||x>=w||y>=h)?0:sd[(y*w+x)*4+3];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){ const i=(y*w+x)*4; if(sd[i+3]<=40 && (A(x-S,y)>40||A(x+S,y)>40||A(x,y-S)>40||A(x,y+S)>40)){ dd[i]=c[0];dd[i+1]=c[1];dd[i+2]=c[2];dd[i+3]=255; } }
  o.putImageData(od,0,0); o.drawImage(cv,0,0); return out; }
function buildSprites(){
  for(const k in PAL){
    const {cv,GW,S}=drawUnit(k); const ocv=outlineCanvas(cv,S,[22,16,30]);
    SPR[k]={ tex:texFromCanvas(ocv), w:GW/30*1.9, h:1.9, ar:GW/30 };
    const pc=document.createElement('canvas'); pc.width=14*S; pc.height=20*S;
    const px=pc.getContext('2d'); px.imageSmoothingEnabled=false;
    px.fillStyle='#1a1f30'; px.fillRect(0,0,pc.width,pc.height);
    px.drawImage(ocv, 4*S,1*S,14*S,20*S, 0,0,14*S,20*S);
    SPR[k].portrait=pc.toDataURL();
  }
}

// ============================= WORLD / MAP =============================
const worldRoot=new THREE.Group(); scene.add(worldRoot);
const hlGroup=new THREE.Group(); scene.add(hlGroup);
const G_timeMats=[];
const wX=gx=>(gx-(CFG.W-1)/2)*CFG.TILE;
const wZ=gz=>(gz-(CFG.D-1)/2)*CFG.TILE;
const tileTop=(gx,gz)=> (G.grid[gx]&&G.grid[gx][gz])?G.grid[gx][gz].topY:0;
const inBounds=(gx,gz)=>gx>=0&&gz>=0&&gx<CFG.W&&gz<CFG.D;
const cellAt=(gx,gz)=>inBounds(gx,gz)?G.grid[gx][gz]:null;

function mat(top,side){ return [side,side,top,side,side,side]; }
function makeShortGrassGeometry(){
  const positions=[],indices=[];
  const blades=[
    [-.12,-.08,.15,-.025],[.08,-.1,.18,.025],[-.04,.08,.14,-.045],[.13,.06,.12,.045]
  ];
  for(const [x,z,h,bend] of blades){
    const base=positions.length/3,w=.038;
    positions.push(x-w,0,z,x+w,0,z,x+bend,h,z);
    indices.push(base,base+1,base+2);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setIndex(indices); geo.computeVertexNormals(); return geo;
}
function buildPlayableGrass(){
  const random=mulberry32(42817), placements=[];
  for(let gx=0;gx<CFG.W;gx++)for(let gz=0;gz<CFG.D;gz++){
    const c=cellAt(gx,gz); if(!c||!c.walkable)continue;
    const density=(gx<1||gx>=CFG.W-1||gz===0||gz>=CFG.D-1)?1:0;
    for(let i=0;i<density;i++)placements.push({
      x:wX(gx)+(random()-.5)*.76,y:c.topY+.012,z:wZ(gz)+(random()-.5)*.76,
      r:random()*Math.PI*2,s:.68+random()*.78,col:random()
    });
  }
  const mat=new THREE.MeshBasicMaterial({color:0x71865d,side:THREE.DoubleSide,transparent:true,opacity:COMBAT_PRESENTATION.arena.groundCoverOpacityIdle,vertexColors:true});
  const grass=new THREE.InstancedMesh(makeShortGrassGeometry(),mat,placements.length);
  const tr=new THREE.Object3D();
  placements.forEach((p,i)=>{ tr.position.set(p.x,p.y,p.z);tr.rotation.set(0,p.r,(p.col-.5)*.1);tr.scale.set(p.s,p.s,p.s);tr.updateMatrix();grass.setMatrixAt(i,tr.matrix);
    grass.setColorAt(i,new THREE.Color().setHSL(.24+p.col*.025,.28,.26+p.col*.08)); });
  grass.instanceMatrix.needsUpdate=true;if(grass.instanceColor)grass.instanceColor.needsUpdate=true;grass.receiveShadow=true;grass.renderOrder=1;
  worldRoot.add(grass);G.groundCover=grass;
}
function buildGridOverlay(){
  const positions=[],y=.04,zLen=CFG.D*CFG.TILE,xLen=CFG.W*CFG.TILE;
  const underMat=new THREE.MeshBasicMaterial({color:0x261b0f,transparent:true,opacity:.46,depthWrite:false,depthTest:false,side:THREE.DoubleSide,fog:false,toneMapped:false});
  const coreMat=new THREE.MeshBasicMaterial({color:0xd1ba83,transparent:true,opacity:.76,depthWrite:false,depthTest:false,side:THREE.DoubleSide,fog:false,toneMapped:false});
  const glowMat=new THREE.MeshBasicMaterial({color:0xd9c08a,transparent:true,opacity:.16,depthWrite:false,depthTest:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,fog:false,toneMapped:false});
  const knotMat=new THREE.MeshBasicMaterial({color:0xd8bf86,transparent:true,opacity:.52,depthWrite:false,depthTest:false,side:THREE.DoubleSide,fog:false,toneMapped:false});
  const underX=new THREE.PlaneGeometry(xLen+.08,.052),coreX=new THREE.PlaneGeometry(xLen+.04,.019),glowX=new THREE.PlaneGeometry(xLen+.12,.088),underZ=new THREE.PlaneGeometry(.052,zLen+.08),coreZ=new THREE.PlaneGeometry(.019,zLen+.04),glowZ=new THREE.PlaneGeometry(.088,zLen+.12),knotGeo=new THREE.PlaneGeometry(.058,.058);
  G.gridBandUnderMaterial=underMat; G.gridBandCoreMaterial=coreMat; G.gridBandGlowMaterial=glowMat; G.gridKnotMaterial=knotMat;
  const addBand=(geo,mat,x,z,order)=>{ const m=new THREE.Mesh(geo,mat); m.rotation.x=-Math.PI/2; m.position.set(x,y,z); m.renderOrder=order; worldRoot.add(m); return m; };
  for(let i=0;i<=CFG.D;i++){ const z=(i-CFG.D/2)*CFG.TILE; addBand(glowX,glowMat,0,z,3.05); addBand(underX,underMat,0,z,3.1); addBand(coreX,coreMat,0,z,3.18); }
  for(let i=0;i<=CFG.W;i++){ const x=(i-CFG.W/2)*CFG.TILE; addBand(glowZ,glowMat,x,0,3.05); addBand(underZ,underMat,x,0,3.1); addBand(coreZ,coreMat,x,0,3.18); }
  for(let gx=0;gx<CFG.W;gx++)for(let gz=0;gz<CFG.D;gz++){ const c=cellAt(gx,gz);if(!c||c.water)continue; const x=wX(gx),z=wZ(gz),h=.486; positions.push(x-h,y+.01,z-h,x+h,y+.01,z-h,x+h,y+.01,z-h,x+h,y+.01,z+h,x+h,y+.01,z+h,x-h,y+.01,z+h,x-h,y+.01,z+h,x-h,y+.01,z-h); }
  for(let ix=0;ix<=CFG.W;ix++)for(let iz=0;iz<=CFG.D;iz++){ const k=new THREE.Mesh(knotGeo,knotMat); k.rotation.x=-Math.PI/2; k.rotation.z=Math.PI/4; k.position.set((ix-CFG.W/2)*CFG.TILE,y+.012,(iz-CFG.D/2)*CFG.TILE); k.renderOrder=3.26; worldRoot.add(k); }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const material=new THREE.LineBasicMaterial({color:0xc7ad74,transparent:true,opacity:.045,depthWrite:false,depthTest:false,fog:false,toneMapped:false});
  const lines=new THREE.LineSegments(geo,material);lines.renderOrder=3.28;worldRoot.add(lines);G.gridLines=lines;
}
async function buildWorld(){
  G.backgroundLayers=new BackgroundLayerSystem(scene);
  await G.backgroundLayers.load(combatBackgroundFor(COMBAT_SCENE_ID));
  G.environment=buildSceneAmbience(COMBAT_SCENE_ID);
  const pickMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,color:0x000000});
  const geoCache={};
  for(let gx=0;gx<CFG.W;gx++){ G.grid[gx]=[];
    for(let gz=0;gz<CFG.D;gz++){
      const water=false;
      const lv=0;
      const top=0, bh=.04, key='pick';
      const geo=geoCache[key]||(geoCache[key]=new RoundedBoxGeometry(CFG.TILE*0.98,bh,CFG.TILE*0.98,2,0.035));
      const m=new THREE.Mesh(geo,pickMaterial);
      m.position.set(wX(gx), top-bh/2 - (water?0.05:0), wZ(gz));
      m.receiveShadow=false; m.castShadow=false;
      m.userData={gx,gz}; worldRoot.add(m);
      G.tilesMesh.push(m);
      G.grid[gx][gz]={gx,gz,walkable:true,topY:top,mesh:m,occupant:null};
    }
  }
  buildGridOverlay();
}

function makeRayTex(){ const c=document.createElement('canvas'); c.width=256; c.height=256; const x=c.getContext('2d'); x.clearRect(0,0,256,256);
  for(let i=0;i<7;i++){ const cx=18+i*34+rnd(-8,8), w=10+rnd(0,16);
    const g=x.createLinearGradient(0,0,0,256); g.addColorStop(0,'rgba(255,226,165,0)'); g.addColorStop(0.16,'rgba(255,214,150,0.55)'); g.addColorStop(0.55,'rgba(255,200,130,0.28)'); g.addColorStop(1,'rgba(255,190,120,0)');
    x.fillStyle=g; x.save(); x.translate(cx,0); x.transform(1,0,-0.4,1,0,0); x.fillRect(-w/2,0,w,256); x.restore(); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.colorSpace=THREE.SRGBColorSpace; return t; }
function makeGlowTex(){ const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d'); const g=x.createRadialGradient(64,64,2,64,64,64); g.addColorStop(0,'rgba(255,242,205,0.95)'); g.addColorStop(0.32,'rgba(255,212,142,0.5)'); g.addColorStop(1,'rgba(255,190,120,0)'); x.fillStyle=g; x.fillRect(0,0,128,128); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t; }
function buildGodRays(){ G.rays=[]; const baseTex=makeRayTex();
  const addShaft=(w,h,px,py,pz,rotZ,op,spd,uScale)=>{ const m=baseTex.clone(); m.needsUpdate=true; m.repeat.set(uScale,1);
    const mat=new THREE.MeshBasicMaterial({map:m,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,opacity:op,color:0xe8c493});
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat); mesh.position.set(px,py,pz); mesh.rotation.z=rotZ; mesh.renderOrder=2; scene.add(mesh);
    G.rays.push({mat,map:m,base:op,spd,pulse:rnd(0.35,0.7),amp:op*0.45,ph:rnd(0,6.28)}); };
  addShaft(48,30,-4,9.5,-12,0.16,COMBAT_PRESENTATION.ambientMist.godRayOpacity,0.003,1.0);
  addShaft(42,28,-1,8.6,-9,0.30,COMBAT_PRESENTATION.ambientMist.godRayOpacity*0.72,0.005,1.6);
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.MeshBasicMaterial({map:makeGlowTex(),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,opacity:COMBAT_PRESENTATION.ambientMist.godRayGlowOpacity}));
  glow.position.set(-7,11.5,-15); glow.renderOrder=1; scene.add(glow);
  G.rays.push({mat:glow.material,map:null,base:COMBAT_PRESENTATION.ambientMist.godRayGlowOpacity,spd:0,pulse:0.5,amp:COMBAT_PRESENTATION.ambientMist.godRayGlowOpacity*0.28,ph:1.5}); }
function toneObject(obj){ obj.traverse(child=>{ if(!(child instanceof THREE.Mesh)||!child.material)return; const list=Array.isArray(child.material)?child.material:[child.material]; const toned=list.map(material=>{ const clone=material.clone(); if(clone.color){ const hsl={}; clone.color.getHSL(hsl); clone.color.setHSL(hsl.h,hsl.s*COMBAT_PRESENTATION.props.saturation,hsl.l*COMBAT_PRESENTATION.props.contrast); } clone.transparent=true; clone.opacity=COMBAT_PRESENTATION.props.opacity; clone.depthWrite=false; return clone; }); child.material=Array.isArray(child.material)?toned:toned[0]; }); return obj; }
function buildProps(){
  const place=(obj,x,z,rotation=0,scale=1)=>{ toneObject(obj); obj.position.set(x,-.02,z);obj.rotation.y=rotation;obj.scale.setScalar(scale*COMBAT_PRESENTATION.props.scale);obj.castShadow=true;obj.receiveShadow=true;worldRoot.add(obj); };
  place(createForestStump(),-5.15,-2.75,.25,.86);
  place(createForestStump(),5.08,2.72,-.4,.72);
  place(createMossyRock(1),-5.18,2.52,.4,.82);
  place(createMossyRock(2),5.18,-2.58,-.2,.78);
  place(createBrokenColumn(),-3.85,-3.22,.35,.66);
  place(createBrokenColumn(),3.98,3.18,-.25,.62);
  place(createLanternPost(),-5.18,-.48,0,.64);
  place(createLanternPost(),5.15,.66,Math.PI,.64);
}

function buildDust(){
  const N=64, pos=new Float32Array(N*3), spd=[];
  for(let i=0;i<N;i++){ pos[i*3]=rnd(-9,9); pos[i*3+1]=rnd(.3,7); pos[i*3+2]=rnd(-5,6); spd.push(rnd(.05,.2)); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const dust=new THREE.Points(g,new THREE.PointsMaterial({color:0xd8c091,size:.052,transparent:true,opacity:.28,depthWrite:false}));
  scene.add(dust); G.dust={mesh:dust,spd,N};
}

function makeSoftParticleTex(){
  const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d');
  const g=x.createRadialGradient(32,32,1,32,32,31);
  g.addColorStop(0,'rgba(255,255,255,0.92)'); g.addColorStop(0.42,'rgba(255,255,255,0.34)'); g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g; x.fillRect(0,0,64,64);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function makeHazeTex(){
  const c=document.createElement('canvas'); c.width=512; c.height=192; const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,192);
  g.addColorStop(0,'rgba(255,255,255,0)');
  g.addColorStop(0.35,'rgba(255,255,255,0.22)');
  g.addColorStop(0.62,'rgba(255,255,255,0.38)');
  g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g; x.fillRect(0,0,512,192);
  for(let i=0;i<18;i++){
    const cx=rnd(0,512), cy=rnd(36,156), rx=rnd(38,94), ry=rnd(10,28);
    const p=x.createRadialGradient(cx,cy,1,cx,cy,rx);
    p.addColorStop(0,`rgba(255,255,255,${rnd(.12,.28)})`);
    p.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=p; x.beginPath(); x.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); x.fill();
  }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=THREE.RepeatWrapping; t.wrapT=THREE.ClampToEdgeWrapping; return t;
}
function buildSceneAmbience(sceneId){
  const p=SCENE_AMBIENCE[sceneId]||SCENE_AMBIENCE.forest_route;
  scene.fog=new THREE.FogExp2(p.fog,p.density);
  const pos=new Float32Array(p.count*3),spd=[],phase=[];
  for(let i=0;i<p.count;i++){
    pos[i*3]=rnd(-p.area[0],p.area[0]); pos[i*3+1]=rnd(p.y[0],p.y[1]); pos[i*3+2]=rnd(-p.area[1],p.area[1]);
    spd.push(rnd(p.rise[0],p.rise[1])); phase.push(rnd(0,Math.PI*2));
  }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const mat=new THREE.PointsMaterial({map:makeSoftParticleTex(),color:p.color,size:p.size,transparent:true,opacity:p.opacity,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,fog:false,toneMapped:false});
  const points=new THREE.Points(geo,mat); points.name='SceneAmbienceParticles'; points.renderOrder=1; points.raycast=()=>{}; scene.add(points);
  const glowMat=new THREE.MeshBasicMaterial({map:makeGlowTex(),color:p.glowColor,transparent:true,opacity:p.glow,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,fog:false,toneMapped:false});
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(24,15),glowMat); glow.name='SceneAmbienceGlow'; glow.position.set(0,2,-8); glow.renderOrder=-5; glow.raycast=()=>{}; scene.add(glow);
  const hazeTex=makeHazeTex();
  const hazeMat=new THREE.MeshBasicMaterial({map:hazeTex,color:p.mistColor,transparent:true,opacity:p.mistOpacity,depthWrite:false,depthTest:false,blending:THREE.NormalBlending,fog:false,toneMapped:false});
  const haze=new THREE.Mesh(new THREE.PlaneGeometry(18,5.2),hazeMat); haze.name='SceneAmbienceHaze'; haze.position.set(0,1.12,-4.9); haze.renderOrder=-4; haze.raycast=()=>{}; scene.add(haze);
  const rayTex=makeRayTex();
  const rayMat=new THREE.MeshBasicMaterial({map:rayTex,color:p.rayColor,transparent:true,opacity:p.rayOpacity,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,fog:false,toneMapped:false});
  const rays=new THREE.Mesh(new THREE.PlaneGeometry(20,10),rayMat); rays.name='SceneAmbienceRays'; rays.position.set(-1.4,4.6,-7.4); rays.rotation.z=-0.08; rays.renderOrder=-4.5; rays.raycast=()=>{}; scene.add(rays);
  return {update(t,dt,reduced){
    const attr=geo.attributes.position;
    points.visible=!reduced; mat.opacity=reduced?0:p.opacity*(0.86+Math.sin(t*1.1)*0.14);
    haze.visible=true; hazeMat.opacity=reduced?p.mistOpacity*0.34:p.mistOpacity*(0.82+Math.sin(t*0.42)*0.18);
    glow.visible=true; glowMat.opacity=reduced?p.glow*0.3:p.glow*(0.78+Math.sin(t*0.72)*0.22);
    rays.visible=!reduced; rayMat.opacity=reduced?0:p.rayOpacity*(0.72+Math.sin(t*0.5)*0.28);
    hazeTex.offset.x=(hazeTex.offset.x+dt*0.006)%1;
    rayTex.offset.y=(rayTex.offset.y+dt*0.004)%1;
    if(reduced)return;
    for(let i=0;i<p.count;i++){
      let y=attr.getY(i)+spd[i]*dt;
      if(y>p.y[1]){ y=p.y[0]; attr.setX(i,rnd(-p.area[0],p.area[0])); attr.setZ(i,rnd(-p.area[1],p.area[1])); }
      attr.setY(i,y);
      attr.setX(i,attr.getX(i)+Math.sin(t*0.72+phase[i])*p.drift*dt*0.1);
      attr.setZ(i,attr.getZ(i)+Math.cos(t*0.36+phase[i])*p.drift*dt*0.035);
    }
    attr.needsUpdate=true;
  }};
}

// ---- highlights ----
const hlGeo=new THREE.PlaneGeometry(CFG.TILE*0.94,CFG.TILE*0.94);
const targetRingGeo=new THREE.RingGeometry(0.42,0.54,72);
const hlMeshes=[];
let hlTex=null,hlTextures={};
function buildTileTex(fillA,fillB,strokeA,strokeB,cornerA,glowA,lw=1.45,cornerLen=13){ const s=96,c=document.createElement('canvas');c.width=c.height=s;const x=c.getContext('2d');
  const pad=10,w=s-pad*2,r=13;
  const rr=(px,py,pw,ph,rad)=>{x.beginPath();x.moveTo(px+rad,py);x.arcTo(px+pw,py,px+pw,py+ph,rad);x.arcTo(px+pw,py+ph,px,py+ph,rad);x.arcTo(px,py+ph,px,py,rad);x.arcTo(px,py,px+pw,py,rad);x.closePath();};
  const grad=x.createLinearGradient(0,pad,0,pad+w); grad.addColorStop(0,fillA); grad.addColorStop(0.58,fillB); grad.addColorStop(1,'rgba(255,246,218,0.04)');
  x.fillStyle=grad; rr(pad,pad,w,w,r); x.fill();
  x.shadowColor='rgba(12,8,3,.58)'; x.shadowBlur=0; x.lineWidth=lw+3.2; x.strokeStyle='rgba(14,10,5,.62)'; rr(pad+1,pad+1,w-2,w-2,r-1); x.stroke();
  x.shadowColor=glowA; x.shadowBlur=10; x.lineWidth=lw; x.strokeStyle=strokeA; rr(pad+2,pad+2,w-4,w-4,r-2); x.stroke();
  x.shadowBlur=0; x.lineWidth=Math.max(1.4,lw+.2); x.strokeStyle=strokeB; rr(pad+6,pad+6,w-12,w-12,r-5); x.stroke();
  x.lineWidth=2.2; x.strokeStyle=cornerA;
  const corners=[[pad+7,pad+7,1,1],[pad+w-7,pad+7,-1,1],[pad+7,pad+w-7,1,-1],[pad+w-7,pad+w-7,-1,-1]];
  for(const [cx,cy,sx,sy] of corners){ x.beginPath(); x.moveTo(cx,cy+sy*(cornerLen+3)); x.lineTo(cx,cy); x.lineTo(cx+sx*(cornerLen+3),cy); x.stroke(); }
  const t=new THREE.CanvasTexture(c); t.anisotropy=4; t.needsUpdate=true; return t; }
function makeTileTex(){ hlTextures={
  range:buildTileTex('rgba(255,250,240,0.22)','rgba(220,215,200,0.10)','rgba(255,248,232,0.9)','rgba(80,78,68,0.88)','rgba(255,245,220,0.9)','rgba(240,235,210,0.6)',2.2,18),
  move:buildTileTex('rgba(214,246,232,0.42)','rgba(93,178,157,0.22)','rgba(230,255,242,1)','rgba(48,116,112,0.98)','rgba(240,255,236,1)','rgba(136,235,205,0.9)',3.15,25),
  hover:buildTileTex('rgba(255,250,220,0.52)','rgba(231,215,155,0.32)','rgba(255,248,195,1)','rgba(92,83,46,1)','rgba(255,252,200,1)','rgba(248,228,160,0.98)',3.6,28),
  target:buildTileTex('rgba(255,198,150,0.62)','rgba(200,70,56,0.38)','rgba(255,222,165,1)','rgba(110,30,26,1)','rgba(255,200,130,1)','rgba(255,120,80,1)',3.8,28),
  target_ally:buildTileTex('rgba(210,255,220,0.52)','rgba(110,200,130,0.32)','rgba(230,255,238,1)','rgba(40,100,60,1)','rgba(230,255,232,1)','rgba(150,240,170,0.98)',3.5,26),
  aoe:buildTileTex('rgba(255,250,240,0.30)','rgba(220,215,200,0.14)','rgba(255,248,232,0.92)','rgba(80,78,68,0.85)','rgba(255,245,220,0.92)','rgba(240,235,210,0.65)',2.4,18),
  invalid:buildTileTex('rgba(160,156,122,0.15)','rgba(94,98,83,0.07)','rgba(186,186,148,0.78)','rgba(63,68,54,0.66)','rgba(176,176,132,0.7)','rgba(130,130,104,0.26)',1.9,15)
}; hlTex=hlTextures.range; }
function clearHL(){ for(const m of hlMeshes){ hlGroup.remove(m); m.material.dispose(); } hlMeshes.length=0; }
function addHL(gx,gz,color,op=0.45,kind='range'){ const c=cellAt(gx,gz); if(!c)return; const boost=kind==='target'||kind==='target_ally'?1.28:(kind==='hover'?1.24:(kind==='move'?1.22:(kind==='aoe'?1.10:(kind==='invalid'?1.08:1.14)))),finalOp=Math.min(1,op*boost);
  const m=new THREE.Mesh(hlGeo,new THREE.MeshBasicMaterial({map:hlTextures[kind]||hlTex,color,transparent:true,opacity:finalOp,depthWrite:false,depthTest:false,side:THREE.DoubleSide,blending:THREE.NormalBlending,fog:false,toneMapped:false}));
  const ro=kind==='hover'?10:(kind==='target'||kind==='target_ally'?9:(kind==='aoe'?8.5:8)),yOff=kind==='hover'?0.072:(kind==='target'||kind==='target_ally'?0.070:0.068);
  m.rotation.x=-Math.PI/2; m.position.set(wX(gx),c.topY+yOff,wZ(gz)); m.renderOrder=ro; m.userData.baseOp=finalOp; m.userData.pulse=kind==='target'||kind==='target_ally'||kind==='hover'?0.018:(kind==='aoe'?0.028:(kind==='invalid'?0.006:0.012)); hlGroup.add(m); hlMeshes.push(m); return m; }
function addRingHL(gx,gz,color,op=0.62,ringScale=1,cgx=null,cgz=null){ const c=cellAt(gx,gz); if(!c)return;
  const px=cgx!=null?wX(cgx):wX(gx), pz=cgz!=null?wZ(cgz):wZ(gz);
  const u=new THREE.Mesh(targetRingGeo,new THREE.MeshBasicMaterial({color:0x0a0603,transparent:true,opacity:Math.min(.76,op*.76),depthWrite:false,depthTest:false,side:THREE.DoubleSide,blending:THREE.NormalBlending,fog:false,toneMapped:false}));
  u.rotation.x=-Math.PI/2; u.position.set(px,c.topY+0.094,pz); u.renderOrder=9.5; u.scale.setScalar(ringScale); u.userData.baseOp=Math.min(.76,op*.76); u.userData.pulse=0.026; hlGroup.add(u); hlMeshes.push(u);
  const m=new THREE.Mesh(targetRingGeo,new THREE.MeshBasicMaterial({color,transparent:true,opacity:Math.min(1,op*1.12),depthWrite:false,depthTest:false,side:THREE.DoubleSide,blending:THREE.NormalBlending,fog:false,toneMapped:false}));
  m.rotation.x=-Math.PI/2; m.position.set(px,c.topY+0.100,pz); m.renderOrder=10; m.scale.setScalar(ringScale); m.userData.baseOp=Math.min(1,op*1.12); m.userData.pulse=0.04; hlGroup.add(m); hlMeshes.push(m); return m; }
function cellKey(gx,gz){ return gx+','+gz; }
function addInvalidTiles(valid,skipActive=false){ for(let gx=0;gx<CFG.W;gx++)for(let gz=0;gz<CFG.D;gz++){ if(valid.has(cellKey(gx,gz)))continue; if(skipActive&&G.active&&G.active.gx===gx&&G.active.gz===gz)continue; addHL(gx,gz,0x7d8066,COMBAT_PRESENTATION.arena.invalidTileOpacity,'invalid'); } }

// cursor ring
let cursorMesh=null,cursorUnderMesh=null;
function buildCursor(){ const ug=new THREE.RingGeometry(0.34,0.54,72),g=new THREE.RingGeometry(0.39,0.5,72); cursorUnderMesh=new THREE.Mesh(ug,new THREE.MeshBasicMaterial({color:0x080604,transparent:true,opacity:.62,side:THREE.DoubleSide,depthWrite:false,fog:false,toneMapped:false})); cursorUnderMesh.rotation.x=-Math.PI/2; cursorUnderMesh.visible=false; scene.add(cursorUnderMesh); cursorMesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xfff0c8,transparent:true,opacity:.96,side:THREE.DoubleSide,depthWrite:false,fog:false,toneMapped:false})); cursorMesh.rotation.x=-Math.PI/2; cursorMesh.visible=false; scene.add(cursorMesh); }
function hoverState(c){ if(!c)return'invalid'; if(G.mode==='deploy')return G.deployZone&&G.deployZone.some(z=>z.gx===c.gx&&z.gz===c.gz)?'move':'invalid'; if(G.mode==='move')return G.reach&&G.reach.list.some(t=>t.gx===c.gx&&t.gz===c.gz)&&!(G.active&&G.active.gx===c.gx&&G.active.gz===c.gz)?'move':'invalid'; if(G.mode==='target'){ if(!G.pending||!G.pending.keys.has(cellKey(c.gx,c.gz)))return'invalid'; const occ=c.occupant; if(!occ||!G.active)return'hover'; const sp=G.pending.spec; if(sp&&(sp.heal||sp.support||sp.revive||sp.cure))return occ.team===G.active.team?'target_ally':'hover'; return occ.team!==G.active.team?'target':'hover'; } return c.occupant&&G.active&&c.occupant.team!==G.active.team?'target':'hover'; }
function moveCursor(gx,gz){ const c=cellAt(gx,gz); if(!c){cursorMesh.visible=false;if(cursorUnderMesh)cursorUnderMesh.visible=false;return;} const st=hoverState(c),col=st==='target'?0xff7364:(st==='target_ally'?0x7edf7a:(st==='move'?0x82dfff:(st==='invalid'?0xb7ad83:0xfff0c8))),op=st==='invalid' ? COMBAT_PRESENTATION.arena.invalidTileOpacity+.2 : (st==='target'||st==='target_ally' ? 1 : .95),sc=st==='target'||st==='target_ally'?1.26:(st==='invalid'?1:1.12); cursorMesh.visible=true; cursorMesh.material.color.setHex(col); cursorMesh.material.opacity=op; cursorMesh.scale.setScalar(sc); cursorMesh.position.set(wX(gx),c.topY+0.06,wZ(gz)); cursorMesh.renderOrder=11; if(cursorUnderMesh){cursorUnderMesh.visible=true; cursorUnderMesh.material.opacity=st==='invalid' ? .46 : .66; cursorUnderMesh.scale.setScalar(sc); cursorUnderMesh.position.copy(cursorMesh.position);} }

// ============================= SKILLS =============================
// Legacy skill definitions for enemy/boss units not yet migrated to the new class system.
const LEGACY_SKILLS={
  whirl:{name:'Coup Tournoyant',ap:4,type:'phys',power:12,range:[0,0],radius:1,self:true,offensive:true,acc:0.95,desc:'Frappe les unités autour du lanceur, sans toucher le lanceur.'},
  bulwark:{name:'Rempart',ap:3,type:'buff',power:0,range:[0,0],radius:1.3,self:true,support:true,status:'barrier',statusTurns:3,desc:'Barrière : +END aux alliés proches (3 tours).'},
  provoke:{name:'Provocation',ap:3,type:'debuff',power:0,range:[1,2],radius:1.5,offensive:true,acc:1,status:'taunt',statusTurns:2,desc:'Force les ennemis proches à vous cibler (2 tours).'},
  weaken:{name:'Flèche Affaiblissante',ap:3,type:'phys',power:7,range:[2,3],radius:0,offensive:true,acc:0.9,status:'slow',statusTurns:2,desc:'Tir unique + Ralentissement.'},
  blind_shot:{name:'Tir Aveuglant',ap:4,type:'phys',power:6,range:[2,4],radius:0,offensive:true,acc:0.9,status:'blind',statusTurns:3,desc:'Tir qui réduit la précision (3 tours).'},
  pierce_shot:{name:'Tir Perçant',ap:4,type:'phys',power:11,range:[2,4],radius:1,shape:'line',offensive:true,acc:0.9,desc:'Flèche traversante alignée sur la cible (ligne).'},
  fireball:{name:'Boule de Feu',ap:5,type:'mag',power:16,range:[2,4],radius:1,offensive:true,acc:0.85,status:'burn',statusTurns:2,desc:'Explosion de feu en zone (touche les alliés).'},
  flame_wave:{name:'Vague de Flammes',ap:4,type:'mag',power:13,range:[1,1],radius:1.6,shape:'cone',offensive:true,acc:0.9,status:'burn',statusTurns:2,desc:'Cône de feu devant le lanceur (touche les alliés).'},
  bolt:{name:'Éclair Sombre',ap:5,type:'mag',power:12,range:[1,4],radius:1,offensive:true,acc:0.9,desc:'Décharge magique en zone.'},
  curse:{name:'Malédiction',ap:3,type:'debuff',power:0,range:[1,4],radius:1,offensive:true,acc:1,status:'curse',statusTurns:3,desc:'Réduit la défense (END) des ennemis (zone, 3 tours).'},
  heal:{name:'Lumière Salvatrice',ap:3,type:'heal',power:1.2,range:[0,3],radius:1,support:true,desc:'Soigne les alliés dans la zone.'},
  regen:{name:'Régénération',ap:4,type:'buff',power:0,range:[0,3],radius:1,support:true,status:'regen',statusTurns:3,desc:'Régénère les PV des alliés chaque tour (3 tours).'},
  bless:{name:'Bénédiction',ap:4,type:'buff',power:0,range:[0,3],radius:1,support:true,status:'boost',statusTurns:3,desc:'+FOR/+MAG aux alliés (3 tours).'},
  revive:{name:'Résurrection',ap:5,type:'revive',power:0.5,range:[1,1],radius:0,support:true,desc:'Relève un allié K.O. à 50% PV.'},
  heavy:{name:'Coup Lourd',ap:4,type:'phys',power:11,range:[1,1],radius:1,offensive:true,acc:0.95,status:'stun',statusTurns:1,desc:'Choc de zone qui étourdit (1 tour).'},
  blink:{name:'Clignotement',ap:3,type:'move',mode:'teleport',dest:true,range:[2,3],radius:0,desc:'Se repositionne instantanément sur une case libre.'},
  leap:{name:'Bond',ap:3,type:'move',mode:'leap',dest:true,range:[2,3],radius:0,desc:'Repositionnement rapide vers une case libre.'},
  charge:{name:'Charge',ap:4,type:'move',mode:'dash',dest:true,range:[2,3],radius:0,power:8,impact:{status:'stun',statusTurns:1},desc:'Charge en ligne droite et etourdit pres de l arrivee.'},
};
// Build SKILLS: start with legacy fallbacks, then override with new SkillDefinitions from skills.ts
const SKILLS={...LEGACY_SKILLS};
for(const [id,def] of SKILL_MAP){ SKILLS[id]={...def,desc:def.description}; }

// ============================= UNIT DEFINITIONS =============================
const DEFS=[
  {team:'player',kind:'knight', name:'Chevalier',className:'Guerrier',portrait:'/assets/characters/pixel/full/alistair.png',hp:140,str:20,mag:3, end:18,dex:9, cha:10,mov:2, weapons:[{name:'Épée',icon:'⚔️',type:'phys',min:1,max:1,power:10,crit:0.10,acc:0.95}], skills:['w_break_guard','w_charge','w_whirl','w_lion_surge'], gx:0,gz:0},
  {team:'player',kind:'cleric', name:'Clerc',className:'Mage Blanc',portrait:'/assets/characters/pixel/full/marian.png',    hp:100,str:6, mag:22,end:10,dex:11,cha:18,mov:2, weapons:[{name:'Masse',icon:'🔨',type:'phys',min:1,max:1,power:8,crit:0.06,acc:0.92}], skills:['w_salvation','w_purify','w_sanctuary','w_miracle'], gx:0,gz:1},
  {team:'player',kind:'mage',   name:'Mage',className:'Mage Noir',portrait:'/assets/characters/pixel/full/elara.png',     hp:75, str:5, mag:28,end:7, dex:12,cha:14,mov:2, weapons:[{name:'Bâton',icon:'🪄',type:'mag',min:1,max:2,power:8,crit:0.06,acc:0.95}], skills:['n_dark_bolt','n_teleport','n_flame_wave','n_dark_meteor'], gx:1,gz:2},
  {team:'player',kind:'archer', name:'Archère',className:'Archer',portrait:'/assets/characters/pixel/full/kestrel.png',  hp:90, str:14,mag:3, end:9, dex:22,cha:10,mov:3, weapons:[{name:'Arc',icon:'🏹',type:'phys',min:2,max:4,power:9,crit:0.10,acc:0.92}], skills:['a_precise_shot','a_hawk_leap','a_arrow_rain','a_zenith_arrow'], gx:1,gz:3},
  {team:'player',kind:'knight', name:'Paladin',className:'Paladin',portrait:'/assets/characters/pixel/full/lion_champion.png',hp:140,str:16,mag:14,end:17,dex:9, cha:14,mov:2,weapons:[{name:'Lame sainte',icon:'⚔',type:'phys',min:1,max:1,power:10,crit:0.06,acc:0.93}],skills:['p_holy_strike','p_interpose','p_oathwall','p_radiant_judgement'],gx:0,gz:2},
  {team:'player',kind:'darkmage',name:'Chevalier Noir',className:'Chevalier Noir',portrait:'/assets/characters/pixel/full/maelor.png',hp:130,str:18,mag:15,end:14,dex:11,cha:8,mov:2,weapons:[{name:'Lame maudite',icon:'⚔',type:'phys',min:1,max:1,power:11,crit:0.08,acc:0.92}],skills:['d_cursed_blade','d_void_step','d_blood_pact','d_devouring_eclipse'],gx:0,gz:3},
  {team:'player',kind:'mage',   name:'Mage Rouge',className:'Mage Rouge',portrait:'/assets/characters/pixel/full/seraphine.png',hp:90,str:12,mag:21,end:9, dex:13,cha:14,mov:2,weapons:[{name:'Bâton rouge',icon:'✦',type:'mag',min:1,max:2,power:9,crit:0.06,acc:0.95}],skills:['r_arcane_blade','r_rune_step','r_scarlet_circle','r_perfect_duality'],gx:1,gz:0},
  {team:'player',kind:'cleric', name:'Enchanteur',className:'Enchanteur',portrait:'/assets/characters/pixel/full/chroniqueur.png',hp:85,str:5,mag:23,end:9, dex:12,cha:20,mov:2,weapons:[{name:'Sceau',icon:'✦',type:'mag',min:1,max:2,power:7,crit:0.04,acc:0.94}],skills:['e_vigor_rune','e_transpose','e_binding_seal','e_absolute_harmony'],gx:1,gz:1},
  {team:'player',kind:'rogue',  name:'Ninja',className:'Ninja',portrait:'/assets/characters/pixel/full/seal_guardian.png',hp:100,str:15,mag:10,end:10,dex:26,cha:10,mov:3,weapons:[{name:'Dague',icon:'†',type:'phys',min:1,max:1,power:8,crit:0.20,acc:0.95}],skills:['ni_venom_blade','ni_shadow_step','ni_smoke_bomb','ni_silent_assassin'],gx:2,gz:0},
  {team:'player',kind:'archer', name:'Artilleur',className:'Artilleur',portrait:'/assets/characters/pixel/full/fallback_hero.png',hp:100,str:15,mag:4,end:11,dex:19,cha:8,mov:2,weapons:[{name:'Arbalète',icon:'⌁',type:'phys',min:2,max:4,power:10,crit:0.08,acc:0.93}],skills:['ar_calibrated_shot','ar_explosive_retreat','ar_incendiary_grenade','ar_artillery_barrage'],gx:2,gz:1},
  {team:'foe',kind:'brigand', name:'Brigand',className:'Brigand',portrait:'/assets/characters/pixel/full/serpent_raider.png',  hp:85, str:13,mag:3, end:10,dex:16,cha:6, mov:2, weapons:[{name:'Dague',icon:'🗡️',type:'phys',min:1,max:1,power:9,crit:0.18,acc:0.95}], skills:[], ai:'aggressive', gx:6,gz:0},
  {team:'foe',kind:'brigand', name:'Brigand',className:'Brigand',portrait:'/assets/characters/pixel/full/serpent_raider.png',  hp:85, str:13,mag:3, end:10,dex:16,cha:6, mov:2, weapons:[{name:'Dague',icon:'🗡️',type:'phys',min:1,max:1,power:9,crit:0.18,acc:0.95}], skills:[], ai:'aggressive', gx:6,gz:3},
  {team:'foe',kind:'brute',   name:'Brute',className:'Brute',portrait:'/assets/characters/pixel/full/serpent_brute.png',    hp:130,str:19,mag:3, end:17,dex:6, cha:5, mov:2, weapons:[{name:'Massue',icon:'🏏',type:'phys',min:1,max:1,power:13,crit:0.05,acc:0.85}], skills:['enemy_heavy_strike'], ai:'guardian', gx:7,gz:1},
  {team:'foe',kind:'darkmage',name:'Mage Noir',className:'Mage Noir',portrait:'/assets/characters/pixel/full/serpent_oracle.png',hp:75, str:4, mag:20,end:9, dex:12,cha:8, mov:2, weapons:[{name:'Bâton',icon:'🪄',type:'mag',min:1,max:3,power:8,crit:0.05,acc:0.95}], skills:['enemy_dark_bolt','enemy_hex'], ai:'cautious', gx:7,gz:2}
];

const BOSS_DEFS=[
  {team:'foe',kind:'brute',name:'Général Serpent',className:'Général Serpent',portrait:'/assets/characters/pixel/full/serpent_general_boss.png',hp:450,str:30,mag:8,end:24,dex:9,cha:12,mov:0,weapons:[{name:'Lame Serpent',icon:'⚔️',type:'phys',min:1,max:2,power:18,crit:0.08,acc:0.9}],skills:['enemy_hex','boss_guard','boss_quake','boss_titan_slam'],ai:'aggressive',gx:5,gz:1,size:2,immobile:true,boss:true},
  {team:'foe',kind:'knight',name:'Vieux Lion Alaric',className:'Vieux Lion Alaric',portrait:'/assets/characters/pixel/full/alaric.png',hp:520,str:28,mag:6,end:27,dex:10,cha:16,mov:0,weapons:[{name:'Lame du Lion',icon:'⚔️',type:'phys',min:1,max:2,power:16,crit:0.06,acc:0.92}],skills:['enemy_heavy_strike','boss_guard','boss_quake','boss_apocalypse'],ai:'guardian',gx:5,gz:1,size:2,immobile:true,boss:true}
];
// The 2x2 footprint occupies the rightmost two columns (6 and 7).
for(const bossDef of BOSS_DEFS){ bossDef.gx=6; bossDef.gz=1; }

const BOSS_PORTRAITS={
  serpent_captain:'/assets/characters/pixel/full/serpent_general_boss.png',
  serpent_general_boss:'/assets/characters/pixel/full/serpent_general_boss.png',
  alaric:'/assets/characters/pixel/full/alaric.png',
  lion_chief:'/assets/characters/pixel/full/alaric.png'
};
const BOSS_ESCORTS={
  serpent_captain:[
    {team:'foe',kind:'brigand', name:'Garde Serpent',className:'Garde Serpent',portrait:'/assets/characters/pixel/full/serpent_raider.png',hp:95,str:15,mag:3,end:12,dex:14,cha:6,mov:2,weapons:[{name:'Dague',icon:'†',type:'phys',min:1,max:1,power:9,crit:0.18,acc:0.95}],skills:[],ai:'aggressive',gx:7,gz:0},
    {team:'foe',kind:'brigand', name:'Garde Serpent',className:'Garde Serpent',portrait:'/assets/characters/pixel/full/serpent_raider.png',hp:95,str:15,mag:3,end:12,dex:14,cha:6,mov:2,weapons:[{name:'Dague',icon:'†',type:'phys',min:1,max:1,power:9,crit:0.18,acc:0.95}],skills:[],ai:'aggressive',gx:7,gz:3},
    {team:'foe',kind:'darkmage',name:'Oracle Serpent',className:'Oracle Serpent',portrait:'/assets/characters/pixel/full/serpent_oracle.png',hp:75,str:4,mag:20,end:9,dex:12,cha:8,mov:2,weapons:[{name:'Bâton',icon:'✦',type:'mag',min:1,max:3,power:8,crit:0.05,acc:0.95}],skills:['enemy_dark_bolt','enemy_hex'],ai:'cautious',gx:4,gz:3}
  ],
  lion_chief:[
    {team:'foe',kind:'knight',name:'Champion du Lion',className:'Champion du Lion',portrait:'/assets/characters/pixel/full/alaric.png',hp:120,str:20,mag:3,end:18,dex:8,cha:9,mov:2,weapons:[{name:'Lame',icon:'⚔',type:'phys',min:1,max:1,power:12,crit:0.08,acc:0.92}],skills:['enemy_heavy_strike'],ai:'guardian',gx:7,gz:0},
    {team:'foe',kind:'darkmage',name:'Gardien du Sceau',className:'Gardien du Sceau',portrait:'/assets/characters/pixel/full/shrine_apparition.png',hp:90,str:6,mag:20,end:11,dex:10,cha:16,mov:2,weapons:[{name:'Sceau',icon:'✦',type:'mag',min:1,max:3,power:8,crit:0.04,acc:0.94}],skills:['enemy_hex','boss_guard'],ai:'cautious',gx:7,gz:3}
  ]
};

const VISUAL_UNIT_TEMPLATES={
  serpent_raider:{team:'foe',kind:'brigand', name:'Pillard Serpent',className:'Pillard Serpent',portrait:'/assets/characters/pixel/full/serpent_raider.png',hp:85,str:13,mag:3,end:10,dex:16,cha:6,mov:2,weapons:[{name:'Dague',icon:'†',type:'phys',min:1,max:1,power:9,crit:0.18,acc:0.95}],skills:['enemy_binding_shot'],ai:'aggressive'},
  serpent_brute:{team:'foe',kind:'brute',name:'Brute Serpent',className:'Brute Serpent',portrait:'/assets/characters/pixel/full/serpent_brute.png',hp:130,str:19,mag:3,end:17,dex:6,cha:5,mov:2,weapons:[{name:'Massue',icon:'◆',type:'phys',min:1,max:1,power:13,crit:0.05,acc:0.85}],skills:['enemy_heavy_strike'],ai:'guardian'},
  serpent_oracle:{team:'foe',kind:'darkmage',name:'Oracle Serpent',className:'Oracle Serpent',portrait:'/assets/characters/pixel/full/serpent_oracle.png',hp:75,str:4,mag:20,end:9,dex:12,cha:8,mov:2,weapons:[{name:'Bâton',icon:'✦',type:'mag',min:1,max:3,power:8,crit:0.05,acc:0.95}],skills:['enemy_dark_bolt','enemy_hex'],ai:'cautious'},
  serpent_elite_raider:{team:'foe',kind:'brigand', name:'Duelliste Serpent',className:'Duelliste Serpent',portrait:'/assets/characters/pixel/full/serpent_elite_raider.png',hp:300,str:22,mag:5,end:14,dex:20,cha:8,mov:0,weapons:[{name:'Lames volantes',icon:'†',type:'phys',min:2,max:3,power:13,crit:0.22,acc:0.95}],skills:['enemy_binding_shot','boss_fortify','boss_pin','boss_flurry'],ai:'aggressive',size:2,immobile:true,elite:true},
  serpent_elite_brute:{team:'foe',kind:'brute',name:'Massacreur Serpent',className:'Massacreur Serpent',portrait:'/assets/characters/pixel/full/serpent_elite_brute.png',hp:380,str:28,mag:3,end:23,dex:5,cha:7,mov:0,weapons:[{name:'Lance-masse',icon:'◆',type:'phys',min:2,max:3,power:17,crit:0.06,acc:0.84}],skills:['enemy_venom_strike','boss_guard','boss_quake','boss_slam'],ai:'guardian',size:2,immobile:true,elite:true},
  serpent_duelist_elite:{team:'foe',kind:'brigand',name:'Duelliste Serpent',className:'Duelliste Serpent',portrait:'/assets/characters/pixel/full/serpent_duelist_elite.png',hp:320,str:23,mag:5,end:15,dex:22,cha:8,mov:0,weapons:[{name:'Lames de jet',icon:'†',type:'phys',min:2,max:4,power:14,crit:0.24,acc:0.96}],skills:['enemy_binding_shot','boss_fortify','boss_pin','boss_flurry'],ai:'aggressive',size:2,immobile:true,elite:true},
  wolf:{team:'foe',kind:'brigand',name:'Loup',className:'Loup',portrait:'/assets/characters/pixel/full/wolf.png',hp:80,str:13,mag:2,end:9,dex:20,cha:4,mov:3,weapons:[{name:'Morsure',icon:'◆',type:'phys',min:1,max:1,power:10,crit:0.12,acc:0.94}],skills:[],ai:'aggressive'},
  venom_serpent:{team:'foe',kind:'brigand',name:'Serpent venimeux',className:'Serpent venimeux',portrait:'/assets/characters/pixel/full/venom_serpent.png',hp:90,str:12,mag:6,end:10,dex:15,cha:4,mov:2,weapons:[{name:'Crochets',icon:'◆',type:'phys',min:1,max:1,power:9,crit:0.1,acc:0.93}],skills:['enemy_venom_strike','enemy_hex'],ai:'cautious'},
  forest_spider:{team:'foe',kind:'brigand',name:'Araignee forestiere',className:'Araignee forestiere',portrait:'/assets/characters/pixel/full/forest_spider.png',hp:68,str:11,mag:4,end:8,dex:19,cha:3,mov:3,weapons:[{name:'Mandibules',icon:'◆',type:'phys',min:1,max:1,power:8,crit:0.12,acc:0.93}],skills:['enemy_binding_shot'],ai:'aggressive'},
  forest_badger:{team:'foe',kind:'brigand',name:'Blaireau',className:'Blaireau',portrait:'/assets/characters/pixel/full/forest_badger.png',hp:88,str:14,mag:2,end:13,dex:12,cha:3,mov:2,weapons:[{name:'Griffes',icon:'◆',type:'phys',min:1,max:1,power:10,crit:0.1,acc:0.92}],skills:[],ai:'aggressive'},
  marsh_toad:{team:'foe',kind:'brute',name:'Crapaud toxique',className:'Crapaud toxique',portrait:'/assets/characters/pixel/full/marsh_toad.png',hp:108,str:13,mag:8,end:16,dex:6,cha:3,mov:2,weapons:[{name:'Langue lourde',icon:'◆',type:'phys',min:1,max:2,power:8,crit:0.04,acc:0.88}],skills:['enemy_venom_strike'],ai:'guardian'},
  cave_rat:{team:'foe',kind:'brigand',name:'Rat geant',className:'Rat geant',portrait:'/assets/characters/pixel/full/cave_rat.png',hp:65,str:10,mag:2,end:7,dex:22,cha:2,mov:3,weapons:[{name:'Morsure',icon:'◆',type:'phys',min:1,max:1,power:8,crit:0.16,acc:0.94}],skills:[],ai:'aggressive'},
  wild_boar:{team:'foe',kind:'brute',name:'Sanglier',className:'Sanglier',portrait:'/assets/characters/pixel/full/wild_boar.png',hp:116,str:18,mag:2,end:16,dex:8,cha:3,mov:2,weapons:[{name:'Charge',icon:'◆',type:'phys',min:1,max:1,power:12,crit:0.08,acc:0.9}],skills:['enemy_heavy_strike'],ai:'guardian'},
  goblin:{team:'foe',kind:'brigand',name:'Gobelin',className:'Gobelin',portrait:'/assets/characters/pixel/full/goblin.png',hp:70,str:11,mag:3,end:8,dex:18,cha:5,mov:3,weapons:[{name:'Lance rouillée',icon:'↟',type:'phys',min:1,max:2,power:8,crit:0.08,acc:0.9}],skills:[],ai:'aggressive'},
  skeleton:{team:'foe',kind:'knight',name:'Squelette',className:'Squelette',portrait:'/assets/characters/pixel/full/skeleton.png',hp:105,str:16,mag:3,end:15,dex:8,cha:3,mov:2,weapons:[{name:'Épée rouillée',icon:'⚔',type:'phys',min:1,max:1,power:10,crit:0.05,acc:0.88}],skills:['enemy_heavy_strike'],ai:'guardian'},
  troll:{team:'foe',kind:'brute',name:'Troll',className:'Troll',portrait:'/assets/characters/pixel/full/troll.png',hp:190,str:25,mag:2,end:23,dex:4,cha:4,mov:2,weapons:[{name:'Tronc',icon:'◆',type:'phys',min:1,max:1,power:16,crit:0.04,acc:0.82}],skills:['enemy_heavy_strike','enemy_crush'],ai:'guardian'},
  young_wyrm:{team:'foe',kind:'brute',name:'Jeune Wyrm',className:'Jeune Wyrm',portrait:'/assets/characters/pixel/full/young_wyrm.png',hp:160,str:22,mag:16,end:18,dex:10,cha:8,mov:2,weapons:[{name:'Souffle court',icon:'✦',type:'mag',min:1,max:2,power:14,crit:0.06,acc:0.88}],skills:['enemy_dark_bolt','enemy_dragon_breath'],ai:'cautious'},
  forest_troll_elite:{team:'foe',kind:'brute',name:'Troll forestier',className:'Troll forestier',portrait:'/assets/characters/pixel/full/forest_troll_elite.png',hp:420,str:30,mag:2,end:25,dex:5,cha:5,mov:0,weapons:[{name:'Jet de pierre',icon:'◆',type:'phys',min:2,max:4,power:18,crit:0.04,acc:0.84}],skills:['enemy_hex','boss_guard','boss_quake','boss_slam'],ai:'guardian',size:2,immobile:true,elite:true},
  young_dragon_elite:{team:'foe',kind:'brute',name:'Jeune dragon',className:'Jeune dragon',portrait:'/assets/characters/pixel/full/young_dragon_elite.png',hp:400,str:24,mag:20,end:20,dex:12,cha:10,mov:0,weapons:[{name:'Souffle emeraude',icon:'✦',type:'mag',min:2,max:4,power:17,crit:0.07,acc:0.9}],skills:['enemy_hex','boss_regen','boss_freeze','boss_inferno'],ai:'cautious',size:2,immobile:true,elite:true},
  undead_champion:{team:'foe',kind:'knight',name:'Champion mort-vivant',className:'Champion mort-vivant',portrait:'/assets/characters/pixel/full/undead_champion.png',hp:350,str:26,mag:8,end:23,dex:8,cha:6,mov:0,weapons:[{name:'Onde froide',icon:'✦',type:'mag',min:2,max:3,power:15,crit:0.08,acc:0.9}],skills:['enemy_hex','boss_guard','boss_quake','boss_execution'],ai:'guardian',size:2,immobile:true,elite:true},
  lion_champion:{team:'foe',kind:'knight',name:'Champion du Lion',className:'Champion du Lion',portrait:'/assets/characters/pixel/full/lion_champion.png',hp:120,str:20,mag:3,end:18,dex:8,cha:9,mov:2,weapons:[{name:'Lame',icon:'⚔',type:'phys',min:1,max:1,power:12,crit:0.08,acc:0.92}],skills:['enemy_heavy_strike','enemy_battle_cry'],ai:'guardian'},
  seal_guardian:{team:'foe',kind:'darkmage',name:'Gardien du Sceau',className:'Gardien du Sceau',portrait:'/assets/characters/pixel/full/seal_guardian.png',hp:90,str:6,mag:20,end:11,dex:10,cha:16,mov:2,weapons:[{name:'Sceau',icon:'✦',type:'mag',min:1,max:3,power:8,crit:0.04,acc:0.94}],skills:['enemy_hex','boss_guard'],ai:'cautious'}
};
const ENEMY_VISUAL_POSITIONS=[[6,0],[7,1],[6,3],[7,2]];
// Large enemies reserve the outer two columns. Escorts stay to the left so
// the boss remains the focal point instead of being visually buried.
const ESCORT_VISUAL_POSITIONS=[[5,0],[5,3],[4,1]];
function unitDefFromVisual(id,index,positions=ENEMY_VISUAL_POSITIONS){
  const base=VISUAL_UNIT_TEMPLATES[id];
  if(!base)return null;
  const [gx,gz]=positions[index%positions.length];
  return {...base,gx,gz,weapons:base.weapons.map(weapon=>({...weapon})),skills:base.skills.slice()};
}

// ============================= STATUS EFFECTS =============================
const STATUS={
  burn:   {name:'Brûlure', col:'#ff9a52', dot:u=>Math.ceil(u.maxhp*0.06)+8},
  poison: {name:'Poison',  col:'#9bd45a', dot:u=>Math.ceil(u.maxhp*0.05)+6},
  regen:  {name:'Régén.',  col:'#7ed957', hot:u=>Math.ceil(u.maxhp*0.08)+6},
  slow:   {name:'Ralenti', col:'#7fd0ff', dex:0.65},
  boost:  {name:'Force+',  col:'#ffd27a', str:1.4, mag:1.4},
  weak:   {name:'Affaibli',col:'#c9a0ff', str:0.75, mag:0.75},
  barrier:{name:'Barrière',col:'#9fe7ff', end:1.4},
  curse:  {name:'Malédic.',col:'#b06aff', end:0.7},
  stun:   {name:'Étourdi', col:'#ffe066', dmgTaken:1.25, skip:true},
  blind:  {name:'Aveuglé', col:'#8aa0b8', acc:-0.4},
  root:   {name:'Entravé', col:'#c98a52', noMove:true},
  silence:{name:'Mutisme', col:'#d08ad0', noSkill:true},
  taunt:  {name:'Provoqué',col:'#ff7a3a'}
};
const ITEMS={
  potion:  {name:'Potion',  effect:'heal', flatHeal:55, range:[0,1], radius:0,   desc:'Rend 55 PV à un allié proche.'},
  ether:   {name:'Éther',   effect:'ap',   apRestore:3, range:[0,1], radius:0,   desc:'Rend 3 AP à un allié proche.'},
  antidote:{name:'Antidote',effect:'cure',              range:[0,1], radius:0,   desc:'Dissipe les altérations négatives d’un allié.'},
  bomb:    {name:'Bombe',   effect:'bomb', flatDmg:42,  range:[1,4], radius:1.2, desc:'Explosion de zone : dégâts aux unités touchées.'}
};
function isNegative(s){ return !['regen','boost','barrier'].includes(s); }
function hasS(u,s){ return (u.statuses[s]||0)>0; }
function statMul(u,key){ let m=1; for(const s in u.statuses){ const d=STATUS[s]; if(d&&u.statuses[s]>0&&d[key]!=null) m*=d[key]; } return m; }
function effSTR(u){ return u.str*statMul(u,'str'); }
function effMAG(u){ return u.mag*statMul(u,'mag'); }
function effEND(u){ return u.end*statMul(u,'end') + Math.min(u.gardeAP||0, 5) * 3; }
function dmgTakenMul(u){ let m=1; for(const s in u.statuses){ const d=STATUS[s]; if(d&&u.statuses[s]>0&&d.dmgTaken) m*=d.dmgTaken; } return m; }

// ---- blob shadow + selectors ----
let blobTex=null, selRing=null, selRingUnder=null, hoverRing=null, hoverRingUnder=null, faceArrow=null, selBase=null, baseTex=null;
function makeBlobTex(){ const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');
  const g=x.createRadialGradient(32,36,2,32,36,29);g.addColorStop(0,'rgba(0,0,0,.92)');g.addColorStop(.34,'rgba(0,0,0,.64)');g.addColorStop(.72,'rgba(0,0,0,.2)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);
  blobTex=new THREE.CanvasTexture(c); }
function makeBaseTex(){ const s=128,c=document.createElement('canvas');c.width=c.height=s;const x=c.getContext('2d');
  const g=x.createRadialGradient(64,64,18,64,64,62); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(.55,'rgba(255,255,255,0)'); g.addColorStop(.7,'rgba(255,255,255,.42)'); g.addColorStop(.82,'rgba(255,255,255,.2)'); g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g; x.fillRect(0,0,s,s); baseTex=new THREE.CanvasTexture(c); }
function buildSelectors(){
  selBase=new THREE.Mesh(new THREE.PlaneGeometry(2.12,2.12),new THREE.MeshBasicMaterial({map:baseTex,color:0xffefc4,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
  selBase.rotation.x=-Math.PI/2; selBase.visible=false; scene.add(selBase);
  selRingUnder=new THREE.Mesh(new THREE.RingGeometry(0.42,0.68,72),new THREE.MeshBasicMaterial({color:0x080604,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,fog:false,toneMapped:false}));
  selRingUnder.rotation.x=-Math.PI/2; selRingUnder.visible=false; scene.add(selRingUnder);
  selRing=new THREE.Mesh(new THREE.RingGeometry(0.47,0.64,72),new THREE.MeshBasicMaterial({color:0xffefc4,transparent:true,opacity:COMBAT_PRESENTATION.units.activeRingOpacity,side:THREE.DoubleSide,depthWrite:false,fog:false,toneMapped:false}));
  selRing.rotation.x=-Math.PI/2; selRing.visible=false; scene.add(selRing);
  hoverRingUnder=new THREE.Mesh(new THREE.RingGeometry(0.45,0.64,64),new THREE.MeshBasicMaterial({color:0x080604,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,fog:false,toneMapped:false}));
  hoverRingUnder.rotation.x=-Math.PI/2; hoverRingUnder.visible=false; scene.add(hoverRingUnder);
  hoverRing=new THREE.Mesh(new THREE.RingGeometry(0.49,0.61,64),new THREE.MeshBasicMaterial({color:0xffefc4,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,fog:false,toneMapped:false}));
  hoverRing.rotation.x=-Math.PI/2; hoverRing.visible=false; scene.add(hoverRing);
  faceArrow=new THREE.Mesh(new THREE.ConeGeometry(0.15,0.32,4),new THREE.MeshBasicMaterial({color:0xffefc4,transparent:true,opacity:.92,depthWrite:false,fog:false,toneMapped:false}));
  faceArrow.rotation.x=Math.PI/2; faceArrow.visible=false; scene.add(faceArrow);
}
function updateSelectors(){
  const u=G.active;
  if(u&&u.alive&&G.mode!=='ai'&&!G.over&&!G.stage){ const top=u.cell().topY,col=0xffefc4;
    const ux=u.size>1?bossCenterGX(u):u.gx, uz=u.size>1?bossCenterGZ(u):u.gz, ss=u.size>1?u.size:1;
    const k=0.5+0.5*Math.sin(performance.now()*0.0032);
    const rs=(1+0.018*k)*ss;
    if(selRingUnder){ selRingUnder.visible=true; selRingUnder.material.opacity=.58+0.08*k; selRingUnder.scale.set(rs,rs,rs); selRingUnder.position.set(wX(ux),top+0.059,wZ(uz)); }
    selRing.visible=true; selRing.material.color.setHex(col); selRing.material.opacity=COMBAT_PRESENTATION.units.activeRingOpacity*(0.9+0.1*k); selRing.scale.set(rs,rs,rs); selRing.position.set(wX(ux),top+0.063,wZ(uz));
    selBase.visible=true; selBase.material.color.setHex(col); selBase.material.opacity=COMBAT_PRESENTATION.units.activeBaseOpacity*(0.62+0.1*k); const sc=(1+0.02*k)*ss; selBase.scale.set(sc,sc,sc); selBase.position.set(wX(ux),top+0.044,wZ(uz));
    faceArrow.visible=true; faceArrow.material.color.setHex(col); const a=Math.atan2(u.facing.dx,u.facing.dz);
    faceArrow.position.set(wX(ux)+u.facing.dx*0.62*ss,top+0.07,wZ(uz)+u.facing.dz*0.62*ss);
    faceArrow.rotation.z=-a; }
  else { selRing.visible=false; if(selRingUnder)selRingUnder.visible=false; faceArrow.visible=false; if(selBase)selBase.visible=false; }
  const h=G.hoverUnit&&G.hoverUnit.alive&&!G.stage&&!G.over&&G.hoverUnit!==G.active?G.hoverUnit:null;
  if(h&&hoverRing){ const top=h.cell().topY,col=h.team==='player'?0x69d7ff:0xff5f52,hx=h.size>1?bossCenterGX(h):h.gx,hz=h.size>1?bossCenterGZ(h):h.gz,hs=h.size>1?h.size:1; if(hoverRingUnder){ hoverRingUnder.visible=true; hoverRingUnder.material.opacity=.58; hoverRingUnder.scale.set(hs,hs,hs); hoverRingUnder.position.set(wX(hx),top+0.062,wZ(hz)); } hoverRing.visible=true; hoverRing.material.color.setHex(col); hoverRing.material.opacity=h.team==='player'?0.92:0.96; hoverRing.scale.set(hs,hs,hs); hoverRing.position.set(wX(hx),top+0.066,wZ(hz)); }
  else { if(hoverRing)hoverRing.visible=false; if(hoverRingUnder)hoverRingUnder.visible=false; }
}

// ============================= UNIT FACTORY =============================
let UID=0;
function bossCells(u){ const s=u.size||1; const out=[]; for(let dx=0;dx<s;dx++)for(let dz=0;dz<s;dz++){ const c=cellAt(u.gx+dx,u.gz+dz); if(c)out.push(c); } return out; }
function bossCenterGX(u){ return u.gx+(u.size||1)/2-0.5; }
function bossCenterGZ(u){ return u.gz+(u.size||1)/2-0.5; }
function occupyBossCells(u){ for(const c of bossCells(u)){ c.occupant=u; c.walkable=false; } }
function clearBossCells(u){ for(const c of bossCells(u)){ if(c.occupant===u)c.occupant=null; c.walkable=true; } }
function largeUnitSpriteScale(u){
  if((u.size||1)<=1)return 1;
  return u.boss
    ? COMBAT_PRESENTATION.units.twoByTwoBossSpriteScale
    : COMBAT_PRESENTATION.units.twoByTwoEliteSpriteScale;
}
function resetUnitSpriteScale(u){
  const spriteScale=largeUnitSpriteScale(u),outlineScale=spriteScale*1.1;
  const visualFacing=u.visualFacingX||u.facing?.dx||(u.team==='player'?1:-1);
  const sourceFacing=u.spriteFacing||1;
  const scaleX=sourceFacing*(visualFacing<0?-spriteScale:spriteScale);
  u.spr.scale.set(scaleX,spriteScale,1);
  if(u.outline)u.outline.scale.set(scaleX<0?-outlineScale:outlineScale,outlineScale,1);
}
function createUnit(def){
  const s=externalSpriteCache.get(def.portrait)||SPR[def.kind];
  const grp=new THREE.Group();
  const shadowScale=COMBAT_PRESENTATION.units.shadowScale;
  const blob=new THREE.Mesh(new THREE.PlaneGeometry(1.32*shadowScale,1.32*0.5*shadowScale),new THREE.MeshBasicMaterial({map:blobTex,transparent:true,depthWrite:false,opacity:COMBAT_PRESENTATION.units.shadowOpacity,fog:false,toneMapped:false}));
  blob.rotation.x=-Math.PI/2; blob.position.y=0.04; grp.add(blob);
  const ringColor=def.team==='player'?0x69d7ff:0xff5f52;
  const teamGlow=new THREE.Mesh(new THREE.PlaneGeometry(1.5,1.5),new THREE.MeshBasicMaterial({map:baseTex,color:ringColor,transparent:true,opacity:def.team==='player'?0.16:0.18,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,fog:false,toneMapped:false}));
  teamGlow.rotation.x=-Math.PI/2; teamGlow.position.y=0.046; grp.add(teamGlow);
  const teamRingUnder=new THREE.Mesh(new THREE.RingGeometry(0.38,0.59,72),new THREE.MeshBasicMaterial({color:0x080604,transparent:true,opacity:.54,side:THREE.DoubleSide,depthWrite:false,fog:false,toneMapped:false}));
  teamRingUnder.rotation.x=-Math.PI/2; teamRingUnder.position.y=0.052; grp.add(teamRingUnder);
  const teamRing=new THREE.Mesh(new THREE.RingGeometry(0.435,0.555,72),new THREE.MeshBasicMaterial({color:ringColor,transparent:true,opacity:COMBAT_PRESENTATION.units.teamRingOpacity,side:THREE.DoubleSide,depthWrite:false,fog:false,toneMapped:false}));
  teamRing.rotation.x=-Math.PI/2; teamRing.position.y=0.058; grp.add(teamRing);
  const outlineMat=new THREE.MeshBasicMaterial({map:s.tex,color:0x03050a,transparent:true,opacity:0.44,alphaTest:0.05,depthWrite:false,side:THREE.DoubleSide,fog:false,toneMapped:false});
  const outline=new THREE.Mesh(new THREE.PlaneGeometry(s.w,s.h),outlineMat);
  outline.position.y=s.h*0.5; outline.scale.set(1.1,1.1,1); outline.renderOrder=5; grp.add(outline);
  const mat=new THREE.MeshBasicMaterial({map:s.tex,transparent:true,alphaTest:0.05,depthWrite:false,side:THREE.DoubleSide,fog:false,toneMapped:false});
  const spr=new THREE.Mesh(new THREE.PlaneGeometry(s.w,s.h),mat);
  spr.position.y=s.h*0.5; spr.renderOrder=6; grp.add(spr);
  scene.add(grp);
  const u={
    id:++UID, campaignId:def.campaignId||null, portrait:def.portrait||'', team:def.team, kind:def.kind, name:def.name, className:def.className||'',
    maxhp:def.maxhp||def.hp, hp:Math.min(def.hp,def.maxhp||def.hp), str:def.str, mag:def.mag, end:def.end, dex:def.dex, cha:def.cha,
    mov:def.mov, weapons:def.weapons, skills:def.skills.slice(), skillUpgrades:def.skillUpgrades||{}, ai:def.ai||'aggressive',
    ap:0, maxap:5, gx:def.gx, gz:def.gz, alive:true, statuses:{}, gardeAP:0, _souffle:false, _ultCooldown:5,
    size:def.size||1, immobile:!!def.immobile, boss:!!def.boss, elite:!!def.elite,
    // All sprites are authored facing right. Foes are mirrored via
    // visualFacingX so they face the player team at combat start.
    spriteFacing:def.spriteFacing??1,
    facing:def.team==='player'?{dx:1,dz:0}:{dx:-1,dz:0},
    visualFacingX:def.team==='player'?1:-1,
    grp, spr, outline, mat, blob, teamGlow, teamRingUnder, teamRing, baseY:s.h*0.5,
    cell(){ return cellAt(this.gx,this.gz); }
  };
  const spriteScale=largeUnitSpriteScale(u);
  if(u.size>1){ blob.scale.set(u.size,u.size,1); teamGlow.scale.set(u.size,u.size,1); teamRing.scale.set(u.size,u.size,1); if(teamRingUnder)teamRingUnder.scale.set(u.size,u.size,1); u.baseY=s.h*0.5*spriteScale; spr.position.y=u.baseY; outline.position.y=u.baseY; }
  resetUnitSpriteScale(u);
  placeUnit(u,def.gx,def.gz,true);
  G.units.push(u);
  return u;
}

function campaignDef(payload,index){
  const stats=payload.stats||{};
  const maxhp=stats.maxHealth||100;
  const startHp=Math.max(0,Math.min(maxhp,Math.round(payload.currentHealth!=null?payload.currentHealth:maxhp)));
  const icons={sword:'⚔',dagger:'†',axe:'◆',spear:'↟',bow:'⌁',staff:'✦',mace:'✚'};
  return {
    team:'player',kind:payload.kind||'knight',name:payload.name||'Allié',className:payload.className||'',
    hp:startHp,maxhp,str:stats.strength||10,mag:stats.magic||5,end:stats.endurance||10,
    dex:stats.dexterity||10,cha:stats.charisma||10,mov:Math.min(3,stats.moveRange||2),
    id:payload.id,campaignId:payload.id,portrait:payload.portrait||'',
    weapons:(payload.weapons||[]).map(weapon=>({
      name:weapon.name||'Arme',icon:icons[weapon.type]||'⚔',type:weapon.type==='staff'?'mag':'phys',
      min:weapon.minRange||1,max:weapon.range||1,power:Math.max(7,Math.round((weapon.damage||14)*0.40)),
      crit:Math.max(0.03,(weapon.critBonus||5)/100),
      acc:Math.max(0.55,Math.min(0.99,0.9+(weapon.accuracyBonus||0)/100)),
    })),
    skills:(payload.skills||[]).filter(id=>SKILLS[id]),
    skillUpgrades:payload.skillUpgrades||{},
    gx:index%2,gz:index%CFG.D,
  };
}
function placeUnit(u,gx,gz,instant){
  if(u.size>1){ clearBossCells(u); u.gx=gx; u.gz=gz; occupyBossCells(u); const cgx=bossCenterGX(u),cgz=bossCenterGZ(u); const c=cellAt(gx,gz); if(instant)u.grp.position.set(wX(cgx),c.topY,wZ(cgz)); return; }
  if(u.cell()&&u.cell().occupant===u) u.cell().occupant=null;
  u.gx=gx; u.gz=gz; const c=cellAt(gx,gz); c.occupant=u;
  if(instant){ u.grp.position.set(wX(gx),c.topY,wZ(gz)); }
}
function setFacing(u,tx,tz){ const dx=tx-u.gx, dz=tz-u.gz; if(dx===0&&dz===0)return;
  if(Math.abs(dx)>=Math.abs(dz)) u.facing={dx:Math.sign(dx),dz:0}; else u.facing={dx:0,dz:Math.sign(dz)};
  if(u.facing.dx!==0)u.visualFacingX=u.facing.dx;
  resetUnitSpriteScale(u); }

function spawnUnits(){
  if(!IS_BOSS_COMBAT){
    if(ENCOUNTER_ENEMY_VISUAL_IDS.length){
      const eliteIds=ENCOUNTER_ENEMY_VISUAL_IDS.filter(id=>VISUAL_UNIT_TEMPLATES[id]?.elite);
      const normalIds=ENCOUNTER_ENEMY_VISUAL_IDS.filter(id=>!VISUAL_UNIT_TEMPLATES[id]?.elite);
      if(eliteIds.length){
        const eliteDef=VISUAL_UNIT_TEMPLATES[eliteIds[0]];
        if(eliteDef) createUnit({...eliteDef,gx:6,gz:1,weapons:eliteDef.weapons.map(w=>({...w})),skills:eliteDef.skills.slice()});
        normalIds
          .map((id,index)=>unitDefFromVisual(id,index,ESCORT_VISUAL_POSITIONS))
          .filter(Boolean)
          .forEach(def=>createUnit(def));
      } else {
        ENCOUNTER_ENEMY_VISUAL_IDS
          .map((id,index)=>unitDefFromVisual(id,index))
          .filter(Boolean)
          .forEach(def=>createUnit(def));
      }
    } else {
      for(const d of DEFS) if(d.team!=='player') createUnit(d);
    }
  }
  if(IS_BOSS_COMBAT&&!BOSS_SPAWNED){
    const bossDef=BOSS_DEFS.find(b=>COMBAT_ID==='lion_chief'&&b.name.includes('Alaric'))||BOSS_DEFS[0];
    if(ENCOUNTER_ESCORT_VISUAL_IDS.length){
      // A boss is the encounter's only major opponent. Ignore any accidental
      // elite escort so a malformed content entry cannot create boss + elite.
      ENCOUNTER_ESCORT_VISUAL_IDS.filter(id=>!VISUAL_UNIT_TEMPLATES[id]?.elite)
        .map((id,index)=>unitDefFromVisual(id,index,ESCORT_VISUAL_POSITIONS))
        .filter(Boolean)
        .forEach(def=>createUnit(def));
    } else {
      (BOSS_ESCORTS[COMBAT_ID]||[]).forEach((escort,index)=>{
        const [gx,gz]=ESCORT_VISUAL_POSITIONS[index%ESCORT_VISUAL_POSITIONS.length];
        createUnit({...escort,gx,gz});
      });
    }
    if(bossDef){ createUnit({...bossDef,portrait:BOSS_PORTRAITS[ENCOUNTER_BOSS_VISUAL_ID]||BOSS_PORTRAITS[COMBAT_ID]||bossDef.portrait,gx:6,gz:1,size:2,immobile:true,boss:true}); BOSS_SPAWNED=true; }
  }
}

// ============================= TURN SYSTEM & PATHFINDING =============================
const gdist=(a,b)=>Math.abs(a.gx-b.gx)+Math.abs(a.gz-b.gz);
const eud=(x1,z1,x2,z2)=>Math.hypot(x1-x2,z1-z2);
function effDEX(u){ return u.dex*statMul(u,'dex'); }
function effCHA(u){ return u.cha*statMul(u,'cha'); }
function aliveUnits(team){ return G.units.filter(u=>u.alive&&(!team||u.team===team)); }
const neighbors=(gx,gz)=>[[gx+1,gz],[gx-1,gz],[gx,gz+1],[gx,gz-1]];
function canStep(from,to,u){ if(!to||!to.walkable)return false; if(to.occupant&&to.occupant!==u&&to.occupant.team!==u.team)return false; return true; }
function computeReach(u){ const dist={}, prev={}; const s=u.gx+','+u.gz; dist[s]=0; const q=[[u.gx,u.gz]];
  while(q.length){ const [cx,cz]=q.shift(); const cc=cellAt(cx,cz); const d=dist[cx+','+cz]; if(d>=u.mov)continue;
    for(const [nx,nz] of neighbors(cx,cz)){ const nc=cellAt(nx,nz); if(!nc)continue; const k=nx+','+nz; if(k in dist)continue; if(!canStep(cc,nc,u))continue; dist[k]=d+1; prev[k]=[cx,cz]; q.push([nx,nz]); } }
  return {dist,prev}; }
function reachableStand(u){ const {dist,prev}=computeReach(u); const list=[]; for(const k in dist){ const [gx,gz]=k.split(',').map(Number); const c=cellAt(gx,gz); if(c&&(!c.occupant||c.occupant===u)) list.push({gx,gz,d:dist[k]}); } return {list,dist,prev}; }
function buildPath(prev,u,gx,gz){ const path=[]; const s=u.gx+','+u.gz; let k=gx+','+gz; let guard=0; while(k!==s&&guard++<200){ const [x,z]=k.split(',').map(Number); path.unshift([x,z]); const p=prev[k]; if(!p)break; k=p[0]+','+p[1]; } return path; }
async function moveAlong(u,path){ if(!path.length)return; G.busy=true; clearHL(); for(const [gx,gz] of path){ const c=cellAt(gx,gz); setFacing(u,gx,gz); await tweenP(u.grp.position,{x:wX(gx),y:c.topY,z:wZ(gz)},0.13,easeInOut); } const last=path[path.length-1]; placeUnit(u,last[0],last[1]); G.busy=false; }

function tickStatusDamage(u){ return (async()=>{
  for(const s in u.statuses){ const d=STATUS[s]; if(!d){ delete u.statuses[s]; continue; }
    if(d.dot){ const dmg=d.dot(u); floatText(u,'-'+dmg,d.col); vfx(s==='burn'?'burn':'poison',u.grp.position.clone().add(new THREE.Vector3(0,1,0))); await applyDamage(u,dmg); if(G.over||!u.alive)return; await wait(0.12); }
    else if(d.hot){ applyHeal(u,d.hot(u)); vfx('heal',u.grp.position.clone().add(new THREE.Vector3(0,1,0))); await wait(0.1); } }
})(); }
function statusSkips(u){ for(const s in u.statuses){ const d=STATUS[s]; if(d&&d.skip&&u.statuses[s]>0)return d; } return null; }
function tickStatusDuration(u){ for(const s in u.statuses){ u.statuses[s]--; if(u.statuses[s]<=0)delete u.statuses[s]; } }

function buildOrder(){ return aliveUnits().sort((a,b)=> (effDEX(b)-effDEX(a)) || (a.team===b.team? a.id-b.id : (a.team==='player'?-1:1))); }
function startRound(){ if(checkEnd())return; G.round++; G.order=buildOrder(); G.turnIdx=-1; logMsg('— Manche '+G.round+' —'); nextTurn(); }
function nextTurn(){ if(G.over||checkEnd())return; G.turnIdx++; if(G.turnIdx>=G.order.length){ startRound(); return; } const u=G.order[G.turnIdx]; if(!u||!u.alive){ nextTurn(); return; } beginTurn(u); }
async function beginTurn(u){ if(G.over)return; G.active=u; G.pinnedUnit=null; hideActionPreview(); G.movedThisTurn=false; G.actedThisTurn=false; G.movedBeforeAct=false; G.skillMovedThisTurn=false; G.basicAttacksThisTurn=0; G.itemsUsedThisTurn=0; G.startGX=u.gx; G.startGZ=u.gz; u._usedUtility=false;
  const regen=(u.boss||u.elite)?2:1; u.ap=Math.min(u.maxap,u.ap+regen); u._souffle=false; u.gardeAP=0;
  if(regen>0) setTimeout(()=>{ if(u.alive)floatText(u,'+'+regen+' AP','#7fd0ff'); },120);
  refreshTurnbar(); selectUnit(u); focusCam(u);
  await tickStatusDamage(u); if(G.over)return; if(!u.alive){ nextTurn(); return; }
  const sk=statusSkips(u); tickStatusDuration(u); if(!hasS(u,'taunt'))u._taunter=null; refreshPanel(u);
  if(sk){ if((u.boss||u.elite)&&u._ultCooldown<5)u._ultCooldown=5; floatText(u,sk.name.toUpperCase()+' !',sk.col,true); logMsg(u.name+' est '+sk.name.toLowerCase()+' — tour passé.'); await wait(0.7); if(G.over)return; nextTurn(); return; }
  if(u._ultCooldown>0)u._ultCooldown--;
  if(u.team==='player'){ G.mode='menu'; setHint(u.name+' — à vous de jouer'); openActionMenu(); }
  else { G.mode='ai'; closeMenus(); setHint(u.name+' (ennemi)…'); await wait(0.35); await aiTurn(u); }
}
function endTurn(){ if(G.busy||G.over)return; const u=G.active;
  if(u&&u.alive){
    if(u.ap>=1){ u.ap=Math.min(u.maxap,u.ap+1); u._souffle=true; floatText(u,'SOUFFLE +1 AP','#7fd0ff',true); logMsg(u.name+' reprend son souffle (+1 AP).'); }
    else u._souffle=false;
    u.gardeAP=u.ap;
    if(u.gardeAP>0){ const bonus=Math.min(u.gardeAP,5)*3; setTimeout(()=>{ if(u.alive)floatText(u,'GARDE +'+bonus+' END','#9fe7ff'); },380); }
  }
  unitFocus.restore(); hideActionPreview(); closeMenus(); clearHL(); G.pending=null; G.mode='idle'; nextTurn(); }
function checkEnd(){ if(G.over)return true; if(aliveUnits('foe').length===0){ winWave(); return true; } if(aliveUnits('player').length===0){ endGame(false); return true; } return false; }

// ============================= COMBAT & AOE =============================
function worldToScreen(v){ const p=v.clone().project(camera); return {x:(p.x*0.5+0.5)*innerWidth,y:(-p.y*0.5+0.5)*innerHeight}; }
function floatText(u,txt,color,big){ const el=document.createElement('div'); el.className='float'; el.textContent=txt; el.style.color=color||'#fff'; if(big)el.style.fontSize='26px';
  dom.fx.appendChild(el); const start=performance.now(), dur=1.05;
  const base=(u.grp?u.grp.position.clone():new THREE.Vector3(wX(u.gx),0,wZ(u.gz))); base.y+=2.5; base.x+=rnd(-0.2,0.2);
  (function a(){ const e=Math.min(1,(performance.now()-start)/(dur*1000)); const wp=base.clone(); wp.y+=e*1.0; const s=worldToScreen(wp); el.style.left=s.x+'px'; el.style.top=s.y+'px'; el.style.opacity=(1-e*e); if(e<1)requestAnimationFrame(a); else el.remove(); })(); }
function flashUnit(u,color){ u.mat.color.set(color); setTimeout(()=>u.alive&&u.mat.color.set('#ffffff'),140); }
const VFX_GEO={spark:new THREE.SphereGeometry(1,6,6),ring:new THREE.RingGeometry(0.1,0.34,28)};
function disposeVFXMesh(m){ if(!m)return; scene.remove(m); if(m.material)m.material.dispose(); if(m.geometry&&m.geometry!==VFX_GEO.spark&&m.geometry!==VFX_GEO.ring)m.geometry.dispose(); }
function shockRing(pos,radius,color){ const m=new THREE.Mesh(VFX_GEO.ring,new THREE.MeshBasicMaterial({color:color||0xfff0b0,transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false,fog:false,toneMapped:false})); m.rotation.x=-Math.PI/2; m.position.copy(pos); m.position.y+=0.05; scene.add(m); const sc=Math.max(1,radius)*2.6; tween(m.scale,{x:sc,y:sc},0.45,easeOutCubic); tween(m.material,{opacity:0},0.45,easeOutCubic,()=>disposeVFXMesh(m)); }
function burst(pos,col){ const count=REDUCED_GRAPHICS?6:12; for(let i=0;i<count;i++){ const p=new THREE.Mesh(VFX_GEO.spark,new THREE.MeshBasicMaterial({color:col,transparent:true,fog:false,toneMapped:false})); p.scale.setScalar(0.07); p.position.copy(pos); scene.add(p); const d=new THREE.Vector3(rnd(-1,1),rnd(0.1,1),rnd(-1,1)).multiplyScalar(rnd(0.4,0.9)); tween(p.position,{x:pos.x+d.x,y:pos.y+d.y,z:pos.z+d.z},0.45,easeOutCubic); tween(p.material,{opacity:0},0.45,easeOutCubic,()=>disposeVFXMesh(p)); } }
function screenShake(mag,dur){ const scale=REDUCED_GRAPHICS?0.58:1; mag*=scale; dur*=REDUCED_GRAPHICS?0.8:1; if(!G.shake||G.shake.t>=G.shake.dur||mag>=G.shake.mag) G.shake={mag,dur,t:0}; }
function screenFlash(color,a){ const el=document.createElement('div'); el.style.cssText='position:fixed;inset:0;z-index:18;pointer-events:none;background:'+(color||'#ffffff'); el.style.opacity=a||0.4; document.body.appendChild(el); const s=performance.now(); (function f(){ const e=(performance.now()-s)/200; el.style.opacity=String((a||0.4)*(1-e)); if(e<1)requestAnimationFrame(f); else el.remove(); })(); }
function vfx(type,pos){ const C={fire:{c:0xff8a3a,n:18,up:1.3,smoke:1},dark:{c:0xb06aff,n:18,up:1.1,smoke:1},heal:{c:0x7ed957,n:16,up:1.7,smoke:0},arrow:{c:0xffe08a,n:9,up:0.6,smoke:0},hit:{c:0xffe7a6,n:13,up:0.8,smoke:0},burn:{c:0xff5a2a,n:10,up:0.9,smoke:0},poison:{c:0x8bc24a,n:10,up:-0.4,smoke:0},buff:{c:0xffd27a,n:12,up:1.2,smoke:0},debuff:{c:0x8a4fcf,n:12,up:0.4,smoke:0},crit:{c:0xfff3b0,n:16,up:1.0,smoke:0}}[type]||{c:0xffffff,n:10,up:0.7,smoke:0};
  const count=REDUCED_GRAPHICS?Math.max(4,Math.ceil(C.n*0.55)):C.n;
  for(let i=0;i<count;i++){ const p=new THREE.Mesh(VFX_GEO.spark,new THREE.MeshBasicMaterial({color:C.c,transparent:true,fog:false,toneMapped:false})); p.scale.setScalar(rnd(0.05,0.12)); p.position.copy(pos); scene.add(p); const dy=C.up<0?rnd(-0.8,-0.2)*Math.abs(C.up):rnd(0.2,1)*C.up; const d=new THREE.Vector3(rnd(-1,1),dy,rnd(-1,1)).multiplyScalar(rnd(0.5,1.15)); tween(p.position,{x:pos.x+d.x,y:pos.y+d.y,z:pos.z+d.z},rnd(0.3,0.6),easeOutCubic); tween(p.material,{opacity:0},0.52,easeOutCubic,()=>disposeVFXMesh(p)); }
  if(C.smoke){ const smokeCount=REDUCED_GRAPHICS?3:6; for(let i=0;i<smokeCount;i++){ const sm=new THREE.Mesh(VFX_GEO.spark,new THREE.MeshBasicMaterial({color:0x2a2630,transparent:true,opacity:.5,fog:false,toneMapped:false})); sm.scale.setScalar(rnd(0.14,0.24)); sm.position.copy(pos); sm.position.x+=rnd(-0.3,0.3); scene.add(sm); tween(sm.position,{y:pos.y+1.5},0.85,easeOutCubic); tween(sm.material,{opacity:0},0.85,easeOutCubic,()=>disposeVFXMesh(sm)); } } }

// ============================= SPRITE MOTION =============================
// Fixed billboard sprites stay static assets. These small runtime motions give
// attacks weight while preserving the authoritative grid position and rules.
const SPRITE_MOTION_PRESETS=Object.freeze({
  melee_light:{windup:0.09,dash:0.10,recoil:0.14,windupDistance:0.12,dashDistance:0.34,squash:0.025},
  melee_heavy:{windup:0.16,dash:0.17,recoil:0.20,windupDistance:0.20,dashDistance:0.48,squash:0.075,heavy:true},
  ranged_attack:{windup:0.11,recoil:0.18,windupDistance:0.14,lift:0.04},
  magic_cast:{cast:0.22,recoil:0.24,lift:0.20,squash:0.025},
  heal_cast:{cast:0.20,recoil:0.25,lift:0.16,squash:0.02},
  buff_cast:{cast:0.20,recoil:0.25,lift:0.14,squash:0.02},
  debuff_cast:{cast:0.22,recoil:0.25,lift:0.17,squash:0.025},
  self_aoe:{jumpUp:0.16,jumpDown:0.16,jumpHeight:0.30,squash:0.05},
  move_leap:{jumpUp:0.19,jumpDown:0.18,jumpHeight:1.7,squash:0.04},
  teleport:{cast:0.14,recoil:0.18,lift:0.10},
  hit_reaction:{hitOut:0.06,hitBack:0.12,hitDistance:0.11,squash:0.035},
  knockout:{hitOut:0.08,hitBack:0.14,hitDistance:0.16,squash:0.06}
});
function getActionMotionPreset(spec={}){
  const presentation=getSkillPresentation(spec);
  if(presentation)return presentation.motionPreset;
  if(spec.type==='move'){
    if(spec.mode==='teleport')return 'teleport';
    if(spec.mode==='leap')return 'move_leap';
    return spec.mode==='dash'?'melee_heavy':'melee_light';
  }
  if(spec.heal||spec.revive)return 'heal_cast';
  if(spec.self&&spec.offensive)return 'self_aoe';
  if(spec.key==='boss_slam'||spec.key==='heavy'||spec.key==='charge'||(spec.type==='phys'&&(spec.power||0)>=15))return 'melee_heavy';
  if(spec.type==='debuff'||spec.key==='curse'||spec.key==='boss_roar'||spec.key==='provoke'||spec.key==='weaken')return 'debuff_cast';
  if(spec.support||spec.apRestore||spec.cure||spec.key==='bless'||spec.key==='regen'||spec.key==='bulwark'||spec.key==='boss_guard')return 'buff_cast';
  if(spec.type==='mag'||spec.key==='fireball'||spec.key==='bolt'||spec.key==='boss_quake'||spec.key==='flame_wave')return 'magic_cast';
  if((spec.range&&spec.range[1]>1)||spec.type==='ranged')return 'ranged_attack';
  return 'melee_light';
}
function motionBaseline(u){ return {group:u.grp.position.clone(),sprZ:u.spr.rotation.z,outlineZ:u.outline?u.outline.rotation.z:0}; }
function killSpriteMotion(u){ if(!u)return; for(const obj of [u.grp&&u.grp.position,u.spr&&u.spr.position,u.spr&&u.spr.scale,u.spr&&u.spr.rotation,u.outline&&u.outline.position,u.outline&&u.outline.scale,u.outline&&u.outline.rotation])if(obj)killTweens(obj); }
function spriteReturnBaseline(u,baseline){ if(!u||!baseline)return; killSpriteMotion(u); u.grp.position.copy(baseline.group); u.spr.position.x=0; u.spr.position.y=u.baseY; u.spr.position.z=0; u.spr.rotation.z=baseline.sprZ||0; if(u.outline){ u.outline.position.x=0; u.outline.position.y=u.baseY; u.outline.position.z=0; u.outline.rotation.z=baseline.outlineZ||0; } resetUnitSpriteScale(u); u._motionPlaying=false; }
function motionDirection(u,context={},away=false){
  let target=context.target||null,tx,tz;
  if(context.reaction&&context.source)target=context.source;
  if(target&&target.grp){ tx=target.grp.position.x; tz=target.grp.position.z; }
  else if(Number.isFinite(context.cx)&&Number.isFinite(context.cz)){ tx=wX(context.cx); tz=wZ(context.cz); }
  let dx=Number.isFinite(tx)?tx-u.grp.position.x:(u.facing?.dx||u.visualFacingX||1);
  let dz=Number.isFinite(tz)?tz-u.grp.position.z:(u.facing?.dz||0);
  if(away){ dx=-dx; dz=-dz; }
  const len=Math.hypot(dx,dz)||1;
  return {x:dx/len,z:dz/len};
}
function spriteScaleSign(mesh){ return mesh&&mesh.scale.x<0?-1:1; }
async function spriteSquash(u,amount,duration){
  if(!amount)return; const spriteScale=largeUnitSpriteScale(u),outlineScale=spriteScale*1.1;
  const spriteSign=spriteScaleSign(u.spr),outlineSign=spriteScaleSign(u.outline);
  const sqY=spriteScale*(1-amount),sqX=spriteScale*(1+amount*0.45);
  const osqY=outlineScale*(1-amount),osqX=outlineScale*(1+amount*0.45);
  const forward=[tweenP(u.spr.scale,{x:spriteSign*sqX,y:sqY},duration,easeOutCubic)];
  if(u.outline)forward.push(tweenP(u.outline.scale,{x:outlineSign*osqX,y:osqY},duration,easeOutCubic));
  await Promise.all(forward);
  const back=[tweenP(u.spr.scale,{x:spriteSign*spriteScale,y:spriteScale},duration,easeInOut)];
  if(u.outline)back.push(tweenP(u.outline.scale,{x:outlineSign*outlineScale,y:outlineScale},duration,easeInOut));
  await Promise.all(back);
}
async function spriteWindup(u,baseline,direction,preset){ const d=(preset.windupDistance||0.12)*(u.size>1?1.08:1); await tweenP(u.grp.position,{x:baseline.group.x-direction.x*d,y:baseline.group.y,z:baseline.group.z-direction.z*d},preset.windup||0.1,easeOutCubic); }
async function spriteDash(u,baseline,direction,preset){ const d=(preset.dashDistance||0.34)*(u.size>1?1.08:1); await tweenP(u.grp.position,{x:baseline.group.x+direction.x*d,y:baseline.group.y,z:baseline.group.z+direction.z*d},preset.dash||0.1,easeOutCubic); }
async function spriteRecoil(u,baseline,duration){ await tweenP(u.grp.position,{x:baseline.group.x,y:baseline.group.y,z:baseline.group.z},duration||0.14,easeInOut); }
async function spriteJump(u,baseline,preset){ await tweenP(u.grp.position,{x:baseline.group.x,y:baseline.group.y+(preset.jumpHeight||0.3),z:baseline.group.z},preset.jumpUp||0.16,easeOutCubic); await tweenP(u.grp.position,{x:baseline.group.x,y:baseline.group.y,z:baseline.group.z},preset.jumpDown||0.16,easeInOut); }
async function spriteCastLift(u,baseline,preset){ await tweenP(u.grp.position,{x:baseline.group.x,y:baseline.group.y+(preset.lift||0.16),z:baseline.group.z},preset.cast||0.2,easeOutCubic); }
async function spriteHitShake(u,magnitude,duration){ const x=(magnitude||0.05)*spriteScaleSign(u.spr); const a=(duration||0.16); await tweenP(u.spr.position,{x:x},a*0.32,easeOutCubic); await tweenP(u.spr.position,{x:-x*0.42},a*0.30,easeInOut); await tweenP(u.spr.position,{x:0},a*0.38,easeOutCubic); }
async function playSpriteMotion(u,presetId,context={}){
  if(!u||!u.grp||!u.spr){ if(typeof context.onImpact==='function')await context.onImpact(); return; }
  const preset=SPRITE_MOTION_PRESETS[presetId]||SPRITE_MOTION_PRESETS.melee_light;
  const baseline=motionBaseline(u);
  // The action pipeline owns G.busy/G.stage; motion only consumes that state
  // and never changes it, so staged camera/VFX remain in sync with the action.
  killSpriteMotion(u); u._motionPlaying=true;
  const direction=motionDirection(u,context,false);
  const impact=async()=>{ if(typeof context.onImpact==='function')await context.onImpact(); };
  try{
    if(presetId==='melee_light'||presetId==='melee_heavy'){
      const squash=spriteSquash(u,preset.squash,preset.windup*0.45);
      await spriteWindup(u,baseline,direction,preset); await squash;
      await spriteDash(u,baseline,direction,preset); await impact();
      await spriteRecoil(u,baseline,preset.recoil);
    } else if(presetId==='ranged_attack'){
      await spriteWindup(u,baseline,direction,preset); await impact();
      await spriteRecoil(u,baseline,preset.recoil);
    } else if(presetId==='magic_cast'||presetId==='heal_cast'||presetId==='buff_cast'||presetId==='debuff_cast'||presetId==='teleport'){
      const squash=spriteSquash(u,preset.squash,(preset.cast||0.16)*0.4);
      await spriteCastLift(u,baseline,preset); await squash; await impact();
      await spriteRecoil(u,baseline,preset.recoil);
    } else if(presetId==='self_aoe'||presetId==='move_leap'){
      const squash=spriteSquash(u,preset.squash,(preset.jumpUp||0.16)*0.4);
      await spriteJump(u,baseline,preset); await squash; await impact();
    } else if(presetId==='hit_reaction'||presetId==='knockout'){
      const away=motionDirection(u,{...context,reaction:true},true);
      const d=(preset.hitDistance||0.11)*(u.size>1?1.08:1);
      const shake=spriteHitShake(u,d*0.55,(preset.hitOut||0.06)+(preset.hitBack||0.12));
      const squash=spriteSquash(u,preset.squash,(preset.hitOut||0.06)*0.55);
      await tweenP(u.grp.position,{x:baseline.group.x+away.x*d,y:baseline.group.y,z:baseline.group.z+away.z*d},preset.hitOut||0.06,easeOutCubic);
      await Promise.all([shake,squash]); await spriteRecoil(u,baseline,preset.hitBack||0.12); await impact();
    } else await impact();
  } finally { spriteReturnBaseline(u,baseline); }
}

function orientMult(att,tgt){ const ax=(att.size>1?bossCenterGX(att):att.gx)-tgt.gx, az=(att.size>1?bossCenterGZ(att):att.gz)-tgt.gz; const len=Math.hypot(ax,az)||1; const d=tgt.facing.dx*(ax/len)+tgt.facing.dz*(az/len); if(d>0.55)return{m:1.0,lab:'face'}; if(d<-0.55)return{m:1.3,lab:'DOS'}; return{m:1.15,lab:'flanc'}; }
function computeDamage(att,tgt,spec){ const K=12, isMag=spec.type==='mag'; const atkStat=isMag?effMAG(att):effSTR(att); let def=Math.max(1,effEND(tgt)+Math.floor((isMag?effMAG(tgt):effSTR(tgt))/4)); if(spec.elanPierce) def=Math.max(1,def*(1-spec.elanPierce)); if(spec.penetration) def=Math.max(1,def*(1-spec.penetration)); const o=orientMult(att,tgt); let d=Math.sqrt(spec.power*K*atkStat/def)*2*o.m*dmgTakenMul(tgt)*rnd(0.92,1.08); if(spec.elanMul) d*=spec.elanMul; return {dmg:Math.max(1,Math.round(d)),lab:o.lab}; }
const FX_COL={phys:0xff7a4a,mag:0xb06aff,heal:0x7ed957,buff:0xffd27a,debuff:0xb06aff,move:0x5ad1ff};
function fxColor(spec){ return FX_COL[spec.heal?'heal':(spec.revive?'heal':spec.type)]||0xfff0b0; }
function castTelegraph(u,spec){ const c=u.cell(); if(!c)return; const col=fxColor(spec);
  const ux=u.size>1?bossCenterGX(u):u.gx, uz=u.size>1?bossCenterGZ(u):u.gz;
  const m=new THREE.Mesh(new THREE.RingGeometry(0.30,0.46,40),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));
  m.rotation.x=-Math.PI/2; m.position.set(wX(ux),c.topY+0.06,wZ(uz)); m.scale.set(0.55,0.55,0.55); scene.add(m);
  tween(m.scale,{x:1.7,y:1.7,z:1.7},0.5,easeOutCubic);
  tween(m.material,{opacity:.9},0.12,easeOutCubic,()=>tween(m.material,{opacity:0},0.36,easeOutCubic,()=>{ scene.remove(m); m.geometry.dispose(); m.material.dispose(); }));
  burst(new THREE.Vector3(wX(ux),c.topY+0.5,wZ(uz)),col); }
function critChance(att,tgt,spec){ const base=(spec&&spec.crit!=null)?spec.crit*100:5; return cl(base+Math.max(0,(effDEX(att)-effDEX(tgt))/2),1,90)/100; }
function rollHit(att,tgt,spec){ if(spec.support||spec.heal||spec.revive)return true; let acc=(spec.acc!=null?spec.acc:0.9)*100+Math.floor(effDEX(att)/2)-Math.floor(effDEX(tgt)/3); if(hasS(att,'blind'))acc-=30; return Math.random()*100<cl(acc,5,95); }

async function applyDamage(u,dmg,src){
  u.hp=Math.max(0,u.hp-dmg);
  const willKnockOut=u.hp<=0&&u.alive;
  if(willKnockOut)playFeedbackVfx('kill_spark',src,u);
  flashUnit(u,'#ff6a5a');
  await playSpriteMotion(u,willKnockOut?'knockout':'hit_reaction',{source:src});
  screenShake(willKnockOut?0.26:0.16,willKnockOut?0.2:0.16);
  refreshPanel(u);
  if(willKnockOut){
    await knockOut(u,src);
    if(src&&src.alive){
      src.ap=Math.min(src.maxap,src.ap+1);
      if(src===G.active){ G.basicAttacksThisTurn=0; G.itemsUsedThisTurn=0; }
      floatText(src,'+1 AP','#7fd0ff',true); refreshPanel(src);
    }
    checkEnd();
  }
}
function applyHeal(u,amt){ if(!u.alive)return; u.hp=Math.min(u.maxhp,u.hp+amt); floatText(u,'+'+amt,'#7ed957'); flashUnit(u,'#bfffc0'); refreshPanel(u); }
function applyStatus(t,st,turns){ const d=STATUS[st]; if(!d)return; t.statuses[st]=Math.max(t.statuses[st]||0,turns||2); floatText(t,(d.name||st).toUpperCase(),d.col||'#fff'); refreshPanel(t); }
async function knockOut(u,src){ u.alive=false; u.downed=true; const state=getUnitVisualState(u.team,u.alive,u.downed); if(u.size>1)clearBossCells(u); else { const c=u.cell(); if(c&&c.occupant===u)c.occupant=null; } floatText(u,'K.O.','#ff5a4a',true); logMsg(u.name+' est K.O. !'); screenShake(0.5,0.4); screenFlash('#ff5a4a',0.22); tween(u.spr.scale,{y:0.32},0.4,easeOutCubic); tween(u.spr.rotation,{z:(u.facing.dx<0?-1:1)*1.15},0.4); tween(u.mat,{opacity:state.bodyOpacity},0.4); tween(u.blob.material,{opacity:state.shadowOpacity},0.4); if(u.teamRing)tween(u.teamRing.material,{opacity:0},0.4); refreshTurnbar(); await wait(0.42); u.grp.visible=state.visible; }
function reviveUnit(u,hp){ u.alive=true; u.downed=false; u.hp=hp; u.statuses={}; u.grp.visible=true; if(u.size>1)occupyBossCells(u); else { const c=u.cell(); if(c&&c.occupant&&c.occupant!==u){ const f=freeNear(u.gx,u.gz); if(f){ u.gx=f.gx; u.gz=f.gz; } } const nc=cellAt(u.gx,u.gz); if(nc&&!nc.occupant)nc.occupant=u; if(nc)u.grp.position.set(wX(u.gx),nc.topY,wZ(u.gz)); } resetUnitSpriteScale(u); u.spr.rotation.z=0; u.mat.opacity=1; u.mat.color.set('#ffffff'); u.blob.material.opacity=COMBAT_PRESENTATION.units.shadowOpacity; if(u.teamRing)u.teamRing.material.opacity=COMBAT_PRESENTATION.units.teamRingOpacity; floatText(u,'+'+hp,'#7ed957',true); logMsg(u.name+' est relevé !'); refreshTurnbar(); }

function skillUpgradeLevel(u,skillId){ return Math.max(0,Math.min(2,Math.floor((u.skillUpgrades&&u.skillUpgrades[skillId])||0))); }
function applySkillUpgrade(u,skillId,spec){
  const level=skillUpgradeLevel(u,skillId); if(!level)return spec;
  const out={...spec,range:spec.range?[...spec.range]:spec.range,effects:spec.effects?.map(effect=>({...effect})),upgradeLevel:level};
  const def=SKILLS[skillId];
  // New per-skill upgrade system: apply upgradeLevel1, then upgradeLevel2
  if(def&&def.upgradeLevel1){
    const ups=[def.upgradeLevel1,def.upgradeLevel2].filter(Boolean).slice(0,level);
    for(const up of ups){
      if(up.powerBonus&&(out.power||0)>0) out.power+=up.powerBonus;
      if(up.powerBonus&&out.effects)for(const effect of out.effects)if(effect.kind==='damage'&&typeof effect.power==='number')effect.power+=up.powerBonus;
      if(up.statusTurnsBonus&&out.statusTurns!=null) out.statusTurns+=up.statusTurnsBonus;
      if(up.statusTurnsBonus&&out.effects)for(const effect of out.effects)if(effect.statusTurns!=null)effect.statusTurns+=up.statusTurnsBonus;
      if(up.radiusBonus&&out.radius!=null) out.radius+=up.radiusBonus;
      if(up.rangeBonus&&out.range) out.range=[out.range[0],out.range[1]+up.rangeBonus];
      if(up.accuracyBonus&&out.acc) out.acc=Math.min(0.99,out.acc+up.accuracyBonus);
      if(up.penetrationBonus) out.penetration=(out.penetration||0)+up.penetrationBonus;
      if(up.healMultiplier&&(out.heal||out.revive)) out.power*=1+up.healMultiplier;
      if(up.healMultiplier&&out.effects)for(const effect of out.effects)if(effect.kind==='heal'&&typeof effect.power==='number')effect.power*=1+up.healMultiplier;
      if(up.revivePercent!=null&&out.revive) out.power=up.revivePercent;
      if(up.critBonus) out.crit=(out.crit||0)+up.critBonus;
      if(up.hpCostReduction&&out.hpCostPercent) out.hpCostPercent=Math.max(0,out.hpCostPercent-up.hpCostReduction);
      if(up.hpCostReduction&&out.effects)for(const effect of out.effects)if(effect.kind==='hp_cost'&&effect.hpCostPercent)effect.hpCostPercent=Math.max(0,effect.hpCostPercent-up.hpCostReduction);
      if(up.lifestealBonus&&out.lifestealPercent) out.lifestealPercent+=up.lifestealBonus;
      if(up.lifestealBonus&&out.effects)for(const effect of out.effects)if(effect.kind==='lifesteal'&&effect.lifestealPercent)effect.lifestealPercent+=up.lifestealBonus;
      if(up.additionalStatus){ out.additionalStatus=up.additionalStatus; out.additionalStatusTurns=up.additionalStatusTurns||1; out.additionalStatusTarget=up.additionalStatusTarget||'enemies'; }
      if(up.selfHealPercent) out.selfHealPercent=up.selfHealPercent;
      if(up.minRangeReduction&&out.range) out.range=[Math.max(0,out.range[0]-up.minRangeReduction),out.range[1]];
      if(up.stealBuffs) out.stealBuffs=true;
      if(up.dispelAllies) out.dispelAllies=true;
    }
    return out;
  }
  // Legacy generic upgrade fallback for old skills without per-skill upgrades
  if(out.heal) out.power*=level===1?1.1:1.2;
  else if(out.revive) out.power=level===1?0.6:0.7;
  else if((out.power||0)>0) out.power+=level===1?2:4;
  if(out.statusTurns) out.statusTurns+=1;
  if(level>=2&&out.radius&&out.radius>0) out.radius+=0.25;
  if(out.dest&&out.range) out.range=[out.range[0],out.range[1]+level];
  return out;
}
function getSpec(u,which,wi,charge){ if(which==='attack'){ const w=(u.weapons&&u.weapons[wi||0])||(u.weapons&&u.weapons[0])||{name:'Attaque',type:'phys',min:1,max:1,power:8,crit:0.05,acc:0.9};
    const lvl=Math.max(0,Math.min(2,charge||0));
    const apCost=(lvl+1)+G.basicAttacksThisTurn;
    const elanMul=[1.0,1.4,1.6][lvl];
    const elanPierce=[0,0,0.5][lvl];
    const acc=lvl>=2?Math.min(0.99,w.acc+0.10):w.acc;
    const labels=['Attaque','Attaque+','Attaque++'];
    return {key:'attack',wi:(wi||0),charge:lvl,name:labels[lvl],icon:w.icon,ap:apCost,type:w.type,power:w.power,range:[w.min,w.max],radius:0,offensive:true,self:false,acc,crit:w.crit,elanMul,elanPierce}; }
  const s=SKILLS[which]; return applySkillUpgrade(u,which,{key:which,name:s.name,icon:s.icon,ap:s.ap,type:s.type,power:s.power||0,range:s.self?[0,0]:s.range,radius:s.radius,shape:s.shape,mode:s.mode,dest:!!s.dest,targetMode:s.targetMode,movePhase:s.movePhase,impact:s.impact,status:s.status,statusTurns:s.statusTurns,acc:s.acc,support:!!s.support,offensive:!!s.offensive,self:!!s.self,heal:s.type==='heal',revive:s.type==='revive',penetration:s.penetration,crit:s.crit,effects:s.effects,flatHeal:s.flatHeal,flatDmg:s.flatDmg,apRestore:s.apRestore,cure:s.cure,allowSelfDamage:s.allowSelfDamage,hpCostPercent:s.hpCostPercent,lifestealPercent:s.lifestealPercent,damageMultiplier:s.damageMultiplier,bonusVsSize:s.bonusVsSize,bonusVsAfflicted:s.bonusVsAfflicted}); }
function unitAtTargetCell(u,spec,gx,gz){
  if(spec.revive)return G.units.find(x=>!x.alive&&x.downed&&x.team===u.team&&x.gx===gx&&x.gz===gz)||null;
  const target=cellAt(gx,gz)?.occupant||null;
  if(!target||!target.alive)return null;
  if(spec.targetMode==='ally')return target.team===u.team?target:null;
  if(spec.targetMode==='enemy')return target.team!==u.team?target:null;
  return target;
}
function selectedTargetsForAction(u,spec,cx,cz){ const target=unitAtTargetCell(u,spec,cx,cz); return target?[target]:[]; }
function areaUnits(u,spec,cx,cz){ const out=new Set(); for(const [gx,gz] of aoeCells(u,spec,cx,cz)){ const target=cellAt(gx,gz)?.occupant; if(target&&target.alive&&canAffectUnit(u,spec,target))out.add(target); } return [...out]; }
function rangeCells(u,spec){
  if(spec.self)return [{gx:u.gx,gz:u.gz}];
  const ux=u.size>1?bossCenterGX(u):u.gx, uz=u.size>1?bossCenterGZ(u):u.gz, out=[];
  for(let gx=0;gx<CFG.W;gx++)for(let gz=0;gz<CFG.D;gz++){
    const md=Math.abs(gx-ux)+Math.abs(gz-uz); if(md<spec.range[0]||md>spec.range[1])continue;
    if(spec.revive||spec.targetMode==='ally'||spec.targetMode==='enemy'){
      if(!unitAtTargetCell(u,spec,gx,gz))continue;
      out.push({gx,gz}); continue;
    }
    if(spec.item&&spec.support){ const oc=cellAt(gx,gz)?.occupant; if(!(oc&&oc.alive&&oc.team===u.team))continue; }
    if(spec.dest){ const dc=cellAt(gx,gz); if(!dc||!dc.walkable||(dc.occupant&&dc.occupant!==u))continue; if(spec.mode==='dash'&&gx!==u.gx&&gz!==u.gz)continue; if(spec.mode==='dash'&&!clearLine(u,gx,gz))continue; }
    out.push({gx,gz});
  }
  return out;
}
function clearLine(u,gx,gz){ const dx=Math.sign(gx-u.gx), dz=Math.sign(gz-u.gz); let x=u.gx+dx, z=u.gz+dz, g=0; while((x!==gx||z!==gz)&&g++<40){ const c=cellAt(x,z); if(!c||!c.walkable||c.occupant)return false; x+=dx; z+=dz; } return true; }
function aoeTiles(cx,cz,radius){ const out=[],R=radius+0.001; for(let gx=Math.ceil(cx-radius);gx<=Math.floor(cx+radius);gx++)for(let gz=Math.ceil(cz-radius);gz<=Math.floor(cz+radius);gz++){ if(inBounds(gx,gz)&&eud(gx,gz,cx,cz)<=R)out.push([gx,gz]); } if(!out.length&&inBounds(cx,cz))out.push([cx,cz]); return out; }
function dirTo(u,cx,cz){ const ux=u.size>1?bossCenterGX(u):u.gx, uz=u.size>1?bossCenterGZ(u):u.gz; const dx=cx-ux, dz=cz-uz; if(Math.abs(dx)>=Math.abs(dz)) return {dx:Math.sign(dx)||(u.facing.dx||1),dz:0}; return {dx:0,dz:Math.sign(dz)||1}; }
function lineCells(u,cx,cz,radius){ const d=dirTo(u,cx,cz); const R=Math.max(1,Math.round(radius)); const out=[]; for(let i=-1;i<=R;i++){ const gx=cx+d.dx*i, gz=cz+d.dz*i; if(inBounds(gx,gz))out.push([gx,gz]); } return out.length?out:[[cx,cz]]; }
function coneCells(u,cx,cz,radius){ const d=dirTo(u,cx,cz); const R=radius+0.001; const out=[]; for(let gx=Math.ceil(cx-radius);gx<=Math.floor(cx+radius);gx++)for(let gz=Math.ceil(cz-radius);gz<=Math.floor(cz+radius);gz++){ if(!inBounds(gx,gz)||eud(gx,gz,cx,cz)>R)continue; const vx=gx-cx,vz=gz-cz; if(vx===0&&vz===0){out.push([gx,gz]);continue;} if((vx*d.dx+vz*d.dz)/Math.hypot(vx,vz)>=0.34)out.push([gx,gz]); } return out.length?out:[[cx,cz]]; }
function aoeCells(u,spec,cx,cz){ const sh=spec.shape||'circle'; if(sh==='line')return lineCells(u,cx,cz,spec.radius); if(sh==='cone')return coneCells(u,cx,cz,spec.radius); return aoeTiles(cx,cz,spec.radius); }
function canAffectUnit(caster,spec,target){ if(!target)return false; if(spec.offensive&&target===caster&&!spec.allowSelfDamage)return false; return true; }
function affectedUnits(u,spec,cx,cz){
  if(spec.revive||spec.targetMode==='ally'||spec.targetMode==='enemy')return selectedTargetsForAction(u,spec,cx,cz);
  const targets=areaUnits(u,spec,cx,cz);
  if(spec.heal||spec.support)return targets.filter(t=>t.team===u.team);
  return targets;
}
function effectTargets(u,spec,cx,cz,effect,context={}){
  let all;
  if(effect.targetSource==='selected'||effect.kind==='revive')all=context.selectedTargets||selectedTargetsForAction(u,spec,cx,cz);
  else all=areaUnits(u,spec,cx,cz);
  if(effect.kind!=='revive')all=all.filter(target=>target.alive);
  const t=effect.target;
  if(t==='caster'||t==='self')return [u];
  if(t==='allies')return all.filter(target=>target.team===u.team);
  if(t==='enemies')return all.filter(target=>target.team!==u.team);
  if(t==='all')return all;
  return all;
}
function previewAccuracy(att,tgt,spec){ if(spec.support||spec.heal||spec.revive)return 100; let acc=(spec.acc!=null?spec.acc:0.9)*100+Math.floor(effDEX(att)/2)-Math.floor(effDEX(tgt)/3); if(hasS(att,'blind'))acc-=30; return Math.round(cl(acc,5,95)); }
function previewPower(att,tgt,spec){ if(spec.heal)return Math.max(1,(spec.flatHeal!=null?spec.flatHeal:Math.round(effMAG(att)*spec.power))+Math.floor(effCHA(att)/4)); if(spec.apRestore)return spec.apRestore; if((spec.power||0)<=0)return 0; if(spec.flatDmg)return Math.max(1,Math.round(spec.flatDmg)); const K=12,isMag=spec.type==='mag'; const atk=isMag?effMAG(att):effSTR(att); let def=Math.max(1,effEND(tgt)+Math.floor((isMag?effMAG(tgt):effSTR(tgt))/4)); if(spec.elanPierce) def=Math.max(1,def*(1-spec.elanPierce)); if(spec.penetration) def=Math.max(1,def*(1-spec.penetration)); let d=Math.sqrt(spec.power*K*atk/def)*2*orientMult(att,tgt).m*dmgTakenMul(tgt); if(spec.elanMul) d*=spec.elanMul; if(spec.damageMultiplier)d*=spec.damageMultiplier; if(spec.bonusVsSize&&tgt.size>1)d*=spec.bonusVsSize; if(spec.bonusVsAfflicted&&Object.keys(tgt.statuses).some(s=>isNegative(s)))d*=spec.bonusVsAfflicted; return Math.max(1,Math.round(d)); }
function hideActionPreview(){ dom.actionPreview.classList.add('hidden'); dom.actionPreview.innerHTML=''; }
function showActionPreview(att,spec,targets,cx,cz){ const primary=targets[0]||null; const helpful=Boolean(spec.heal||spec.support||spec.revive||spec.apRestore||spec.cure); const alliesHit=targets.filter(t=>t.team===att.team&&!helpful).length; const estimate=primary?previewPower(att,primary,spec):0; const accuracy=primary?previewAccuracy(att,primary,spec):null; const valueLabel=spec.heal?'Soin':spec.apRestore?'AP':'Dégâts'; const targetLabel=primary?primary.name:(spec.type==='move'?('Case '+cx+','+cz):(helpful?'Ciblez un allié':'Ciblez un ennemi'));
  dom.actionPreview.innerHTML='<div class="action-preview__unit"><small>Lanceur</small><b>'+att.name+'</b></div><span class="action-preview__arrow">→</span><div class="action-preview__act"><small>'+((helpful)?'Soutien':'Action')+'</small><b>'+(spec.icon||'✦')+' '+spec.name+'</b>'+(estimate?'<em>'+valueLabel+' ~'+estimate+(accuracy!=null&&!helpful?' · '+accuracy+'%':'')+'</em>':'')+'</div><span class="action-preview__arrow">→</span><div class="action-preview__unit"><small>Cible'+(targets.length>1?'s':'')+'</small><b>'+targetLabel+(targets.length>1?' ×'+targets.length:'')+'</b></div>'+(alliesHit?'<strong class="action-preview__warning">⚠ '+alliesHit+' allié'+(alliesHit>1?'s':'')+' touché'+(alliesHit>1?'s':'')+'</strong>':'');
  dom.actionPreview.classList.toggle('is-helpful',helpful); dom.actionPreview.classList.remove('hidden'); }

async function projectile(u,cx,cz,spec){ const isDark=u.kind==='darkmage'; const isHeal=spec.heal||spec.revive; const isBuff=spec.support&&!isHeal&&!spec.offensive; const col=isHeal?0x7ed957:(isBuff?0xffd27a:(spec.type==='mag'?(isDark?0xb06aff:0xff8a3a):0xffe08a));
  const m=new THREE.Mesh(new THREE.SphereGeometry(spec.type==='mag'?0.2:0.13,10,10),new THREE.MeshBasicMaterial({color:col,fog:false,toneMapped:false})); const s=u.grp.position.clone(); s.y+=1.3; s.x+=u.facing.dx*0.4; m.position.copy(s); scene.add(m);
  const e=new THREE.Vector3(wX(cx),tileTop(cx,cz)+0.7,wZ(cz)); await tweenP(m.position,{x:e.x,y:e.y,z:e.z},0.26,easeInOut); disposeVFXMesh(m);
  vfx(isHeal?'heal':(isBuff?'buff':(spec.type==='mag'?(isDark?'dark':'fire'):'arrow')),e);
  if(spec.type==='mag'){ screenShake(0.4,0.3); screenFlash(isDark?'#7a4fff':'#ff8a3a',0.2); } }
function normalizeVfxSearchText(value){ return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function actionVfxSearchText(spec={},u=null){
  const weapon=u&&u.weapons&&u.weapons[(spec.wi||0)]||u&&u.weapons&&u.weapons[0];
  return normalizeVfxSearchText([spec.key,spec.name,spec.status,spec.type,weapon&&weapon.name,u&&u.name,u&&u.kind].filter(Boolean).join(' '));
}
function vfxTextIncludes(text,terms){ return terms.some(term=>text.includes(term)); }
function getActionVfxPreset(spec={},u=null){
  const presentation=getSkillPresentation(spec);
  if(presentation)return presentation.vfxPreset;
  const text=actionVfxSearchText(spec,u);
  if(spec.key==='boss_quake')return 'boss_quake';
  if(spec.key==='boss_slam')return 'boss_slam';
  if(spec.key==='fireball'||spec.key==='flame_wave'||vfxTextIncludes(text,['feu','flamme','ardent']))return 'fireball';
  if(spec.heal||spec.revive)return 'heal_burst';
  if(spec.key==='bulwark'||spec.key==='boss_guard'||spec.status==='barrier')return 'guard_barrier';
  if(spec.key==='bless'||spec.key==='regen'||spec.apRestore||spec.cure)return 'bless_aura';
  if(spec.type==='debuff'||spec.key==='curse'||spec.key==='provoke'||spec.key==='boss_roar')return 'curse_pulse';
  if(vfxTextIncludes(text,['poison','venin','venimeux','venom','toxique','crochet']))return 'poison_bite';
  if(spec.type==='mag')return 'dark_bolt';
  if(spec.type==='phys'&&spec.range&&spec.range[1]>1)return 'arrow_shot';
  if(spec.key==='whirl')return 'sword_slash';
  if(spec.key==='heavy'||spec.key==='charge'||vfxTextIncludes(text,['masse','massue','marteau','tronc','pierre','lourd']))return 'blunt_impact';
  if(spec.offensive&&spec.type==='phys')return 'sword_slash';
  if(spec.offensive)return 'generic_hit';
  if(spec.support)return 'bless_aura';
  return null;
}
function makeActionVfxContext(u,targets,cx,cz){
  return {
    scene,camera,sourceUnit:u,targetUnits:targets,
    targetPoint:new THREE.Vector3(wX(cx),tileTop(cx,cz),wZ(cz)),
    reducedGraphics:REDUCED_GRAPHICS,
    helpers:{wait,screenShake,screenFlash,floatText,wX,wZ,tileTop}
  };
}
function playActionVfx(spec,u,targets,cx,cz){
  const presetId=getActionVfxPreset(spec,u);
  if(!presetId)return null;
  const perTarget=presetId==='heal_burst'||presetId==='bless_aura'||presetId==='guard_barrier';
  const visualTargets=(perTarget&&targets.length>1)?targets.map(target=>[target]):[targets];
  const results=visualTargets.map(group=>combatVfxSystem.play(presetId,makeActionVfxContext(u,group,cx,cz))).filter(result=>result.played);
  if(!results.length)return null;
  const completion=Promise.all(results.map(result=>result.completion)).then(()=>undefined);
  void completion.catch(error=>console.warn('[CombatVfx] Action playback failed safely.',error));
  return {played:true,presetId,impactTime:Math.max(...results.map(result=>result.impactTime)),completion};
}
function playFeedbackVfx(presetId,source,target){
  if(!target)return false;
  const cx=target.size>1?bossCenterGX(target):target.gx, cz=target.size>1?bossCenterGZ(target):target.gz;
  const result=combatVfxSystem.play(presetId,makeActionVfxContext(source,[target],cx,cz));
  if(!result.played)return false;
  void result.completion.catch(error=>console.warn('[CombatVfx] Feedback playback failed safely.',error));
  return true;
}
async function attackAnim(u,spec,cx,cz,targets=[]){ const ctr=new THREE.Vector3(wX(cx),tileTop(cx,cz)+0.6,wZ(cz)); const presentation=getSkillPresentation(spec),preset=getActionMotionPreset(spec),isUltimate=Boolean(presentation?.ultimate),impactCount=presentation?.impactCount||1;
  const impact=async()=>{
    if(isUltimate){ floatText(u,'ULTIME','#ffd86a',true); screenFlash('#fff0b0',0.12); screenShake(0.26,0.16); }
    if(spec.key!=='attack')castTelegraph(u,spec);
    const generated=playActionVfx(spec,u,targets,cx,cz);
    if(generated){ for(let i=1;i<impactCount;i++){ await wait(0.08); playActionVfx(spec,u,targets,cx,cz); } await wait(generated.impactTime); return; }
    if(spec.heal||spec.revive||spec.support||spec.apRestore||spec.cure){
      const type=(spec.type==='debuff')?'dark':'heal';
      for(const [gx,gz] of aoeCells(u,spec,cx,cz))vfx(type,new THREE.Vector3(wX(gx),tileTop(gx,gz)+0.6,wZ(gz)));
      screenFlash(spec.type==='debuff'?'#8d5cff':'#bfffc0',0.14);
      return;
    }
    if(preset==='self_aoe'){
      shockRing(ctr,spec.radius,spec.type==='mag'?0xff8a3a:0xfff0b0); screenShake(0.42,0.32); screenFlash('#fff0b0',0.16);
      for(const [gx,gz] of aoeCells(u,spec,cx,cz))vfx('hit',new THREE.Vector3(wX(gx),tileTop(gx,gz)+0.6,wZ(gz)));
      return;
    }
    if(preset==='magic_cast'||preset==='ranged_attack'){
      await projectile(u,cx,cz,spec);
      if(spec.radius>=1)shockRing(ctr,spec.radius,spec.type==='mag'?0xff8a3a:0xfff0b0);
      return;
    }
    if(preset==='debuff_cast'){
      if(spec.range&&spec.range[1]>1)await projectile(u,cx,cz,spec); else vfx('dark',ctr);
      if(spec.radius>=1)shockRing(ctr,spec.radius,0xb06aff);
      return;
    }
    vfx('hit',ctr); screenShake(preset==='melee_heavy'?0.46:0.32,preset==='melee_heavy'?0.28:0.22);
  };
  await playSpriteMotion(u,preset,{cx,cz,spec,target:targets[0],onImpact:impact});
}
async function doMove(u,spec,cx,cz){ setFacing(u,cx,cz); const c=cellAt(cx,cz); const dest=new THREE.Vector3(wX(cx),c.topY,wZ(cz)); const head=dest.clone().add(new THREE.Vector3(0,0.9,0));
  const motion=SPRITE_MOTION_PRESETS[getActionMotionPreset(spec)]||SPRITE_MOTION_PRESETS.melee_light;
  actionCam(head); logMsg(u.name+' → '+spec.name);
  if(spec.mode==='teleport'){ vfx('dark',u.grp.position.clone().add(new THREE.Vector3(0,0.9,0))); screenFlash('#b9a0ff',0.14); await tweenP(u.mat,{opacity:0},motion.cast,easeOutCubic); placeUnit(u,cx,cz,true); vfx('dark',head); screenFlash('#9fe7ff',0.16); await tweenP(u.mat,{opacity:1},motion.recoil,easeOutCubic); }
  else if(spec.mode==='leap'){ const from=u.grp.position.clone(); placeUnit(u,cx,cz); await tweenP(u.grp.position,{x:(from.x+dest.x)/2,y:Math.max(from.y,dest.y)+motion.jumpHeight,z:(from.z+dest.z)/2},motion.jumpUp,easeOutCubic); await tweenP(u.grp.position,{x:dest.x,y:dest.y,z:dest.z},motion.jumpDown,easeInOut); vfx('hit',head); screenShake(0.32,0.22); }
  else { placeUnit(u,cx,cz); await tweenP(u.grp.position,{x:dest.x,y:dest.y,z:dest.z},motion.dash||0.2,easeOutCubic); screenShake(0.5,0.3); screenFlash('#fff0b0',0.16); vfx('hit',head);
    if(spec.impact){ const hits=aliveUnits().filter(t=>t.team!==u.team&&(Math.abs(t.gx-cx)+Math.abs(t.gz-cz)===1)); for(const t of hits){ const {dmg}=computeDamage(u,t,{type:'phys',power:spec.power||8}); floatText(t,'-'+dmg,'#ffffff',true); await applyDamage(t,dmg,u); if(G.over)break; if(t.alive&&spec.impact.status)applyStatus(t,spec.impact.status,spec.impact.statusTurns); await wait(0.06); } } }
  await wait(0.12); }
function unitCenter(u){ return {gx:u.size>1?bossCenterGX(u):u.gx,gz:u.size>1?bossCenterGZ(u):u.gz}; }
function isFreeSkillTile(gx,gz){ const c=cellAt(gx,gz); return !!(c&&c.walkable&&!c.occupant); }
function findStrikeDestination(u,target){
  if(!target)return null;
  const from=unitCenter(u), to=unitCenter(target), awayX=Math.sign(to.gx-from.gx)||1, awayZ=Math.sign(to.gz-from.gz), options=[], seen=new Set();
  const footprint=target.size>1?bossCells(target):[target.cell()];
  for(const cell of footprint)for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const gx=cell.gx+dx,gz=cell.gz+dz,key=gx+','+gz;
    if(!seen.has(key)&&isFreeSkillTile(gx,gz)){ seen.add(key); options.push({gx,gz}); }
  }
  const score=option=>((option.gx-to.gx)*awayX+(option.gz-to.gz)*awayZ)*4-Math.abs(option.gx-from.gx)-Math.abs(option.gz-from.gz);
  return options.sort((a,b)=>score(b)-score(a))[0]||null;
}
function findRetreatDestination(u,threat,distance=1){
  const from=unitCenter(u), other=threat?unitCenter(threat):null;
  let dx=other?Math.sign(from.gx-other.gx):-(u.facing?.dx||1), dz=other?Math.sign(from.gz-other.gz):-(u.facing?.dz||0);
  if(Math.abs(dx)>=Math.abs(dz)){ dx=dx||-(u.facing?.dx||1); dz=0; } else { dz=dz||-(u.facing?.dz||1); dx=0; }
  for(let step=distance;step>=1;step--){ const gx=u.gx+dx*step,gz=u.gz+dz*step; if(isFreeSkillTile(gx,gz))return {gx,gz}; }
  const candidates=[];
  for(const [cx,cz] of [[1,0],[-1,0],[0,1],[0,-1]]){ const gx=u.gx+cx,gz=u.gz+cz; if(isFreeSkillTile(gx,gz))candidates.push({gx,gz}); }
  if(!candidates.length)return null;
  const score=option=>other?Math.abs(option.gx-other.gx)+Math.abs(option.gz-other.gz):0;
  return candidates.sort((a,b)=>score(b)-score(a))[0];
}
async function swapUnits(a,b){
  if(!a||!b||a.size>1||b.size>1)return false;
  const aCell=a.cell(),bCell=b.cell(); if(!aCell||!bCell)return false;
  const aPos={gx:a.gx,gz:a.gz},bPos={gx:b.gx,gz:b.gz};
  killSpriteMotion(a); killSpriteMotion(b);
  await Promise.all([tweenP(a.mat,{opacity:0.2},0.12,easeOutCubic),tweenP(b.mat,{opacity:0.2},0.12,easeOutCubic)]);
  aCell.occupant=b; bCell.occupant=a;
  a.gx=bPos.gx; a.gz=bPos.gz; b.gx=aPos.gx; b.gz=aPos.gz;
  a.grp.position.set(wX(a.gx),bCell.topY,wZ(a.gz)); b.grp.position.set(wX(b.gx),aCell.topY,wZ(b.gz));
  vfx('dark',a.grp.position.clone().add(new THREE.Vector3(0,0.85,0))); vfx('dark',b.grp.position.clone().add(new THREE.Vector3(0,0.85,0)));
  await Promise.all([tweenP(a.mat,{opacity:1},0.14,easeOutCubic),tweenP(b.mat,{opacity:1},0.14,easeOutCubic)]);
  return true;
}
async function performSkillMovement(u,spec,cx,cz,context={}){
  const selected=(context.selectedTargets||[])[0]||null;
  if(spec.mode==='swap'){
    if(!await swapUnits(u,selected)){ toast('Échange impossible'); return false; }
    return true;
  }
  if(spec.mode==='strike'){
    const dest=findStrikeDestination(u,selected);
    if(!dest){ toast('Aucune case libre derrière la cible'); return false; }
    await doMove(u,{...spec,type:'move',mode:'teleport',dest:true,impact:null,ap:0},dest.gx,dest.gz);
    if(selected){ const center=unitCenter(selected); setFacing(u,center.gx,center.gz); }
    return true;
  }
  if(spec.mode==='retreat'){
    const threat=selected||aliveUnits().filter(target=>target.team!==u.team).sort((a,b)=>{ const ac=unitCenter(a),bc=unitCenter(b); return Math.abs(ac.gx-u.gx)+Math.abs(ac.gz-u.gz)-Math.abs(bc.gx-u.gx)-Math.abs(bc.gz-u.gz); })[0]||null;
    const dest=findRetreatDestination(u,threat,1);
    if(!dest){ toast('Aucun repli possible'); return false; }
    await doMove(u,{...spec,type:'move',mode:'leap',dest:true,impact:null,ap:0},dest.gx,dest.gz);
    if(threat){ const center=unitCenter(threat); setFacing(u,center.gx,center.gz); }
    return true;
  }
  if(spec.dest){ await doMove(u,spec,cx,cz); return true; }
  return false;
}
function applyAdditionalStatus(u,spec,cx,cz,context={}){
  if(!spec.additionalStatus)return;
  const selected=context.selectedTargets||[];
  let targets=[];
  switch(spec.additionalStatusTarget||'enemies'){
    case 'self': targets=[u]; break;
    case 'selected': targets=selected; break;
    case 'casterAndSelected': targets=[u,...selected]; break;
    case 'allies': targets=areaUnits(u,spec,cx,cz).filter(target=>target.team===u.team); break;
    case 'enemies': targets=areaUnits(u,spec,cx,cz).filter(target=>target.team!==u.team); break;
    default: targets=areaUnits(u,spec,cx,cz).filter(target=>target.team!==u.team); break;
  }
  for(const target of [...new Set(targets)])if(target&&target.alive){ applyStatus(target,spec.additionalStatus,spec.additionalStatusTurns||1); if(spec.additionalStatus==='taunt')target._taunter=u; }
}
async function executeAction(u,spec,cx,cz){ unitFocus.restore(); hideActionPreview(); G.busy=true; closeMenus(); clearHL();
  const context={origin:{gx:u.gx,gz:u.gz},selectedTargets:selectedTargetsForAction(u,spec,cx,cz)};
  const isStandaloneMove=spec.type==='move'&&(!spec.effects||spec.effects.length===0)&&!['swap','strike','retreat'].includes(spec.mode);
  if(isStandaloneMove){ await doMove(u,spec,cx,cz); applyAdditionalStatus(u,spec,cx,cz,context); if(spec.ap>0)u.ap=Math.max(0,u.ap-spec.ap); G.skillMovedThisTurn=true; if(G.movedThisTurn)G.movedBeforeAct=true; G.startGX=u.gx; G.startGZ=u.gz; refreshPanel(u); restoreCam(); G.busy=false; checkEnd(); return; }
  const hasSkillMovement=Boolean(spec.dest||spec.mode==='swap'||spec.mode==='strike'||spec.mode==='retreat'),moveBefore=hasSkillMovement&&spec.movePhase==='before';
  let impactCx=cx,impactCz=cz;
  if(moveBefore){ const moved=await performSkillMovement(u,spec,cx,cz,context); if(!moved){ restoreCam(); G.busy=false; return; } G.skillMovedThisTurn=true; if(G.movedThisTurn)G.movedBeforeAct=true; G.startGX=u.gx; G.startGZ=u.gz; if(spec.mode!=='strike'&&spec.mode!=='swap'){ impactCx=u.gx; impactCz=u.gz; } }
  if(!spec.self){ const target=context.selectedTargets[0]; if(target){ const center=unitCenter(target); setFacing(u,center.gx,center.gz); } else setFacing(u,impactCx,impactCz); }
  const targets=context.selectedTargets.length&&(spec.revive||spec.targetMode==='ally'||spec.targetMode==='enemy')?context.selectedTargets:affectedUnits(u,spec,impactCx,impactCz);
  logMsg(u.name+' → '+spec.name);
  await combatStageEnter(u,targets,spec);
  await attackAnim(u,spec,impactCx,impactCz,targets);
  if(spec.item&&spec.itemId)G.inv[spec.itemId]=Math.max(0,(G.inv[spec.itemId]||0)-1);
  // Process effects[] if present (multi-effect system)
  if(spec.effects&&spec.effects.length){
    let totalDamageDealt=0;
    for(const eff of spec.effects){
      if(eff.kind==='move'){ await doMove(u,{...spec,mode:eff.moveMode||spec.mode,type:'move',ap:0},impactCx,impactCz); G.skillMovedThisTurn=true; if(G.movedThisTurn)G.movedBeforeAct=true; G.startGX=u.gx; G.startGZ=u.gz; continue; }
      if(eff.kind==='hp_cost'){ if(eff.target==='caster'||eff.target==='self'){ const cost=Math.round(u.maxhp*(eff.hpCostPercent||0)); u.hp=Math.max(1,u.hp-cost); floatText(u,'-'+cost,'#ff5a4a',true); refreshPanel(u); } continue; }
      const etgts=effectTargets(u,spec,impactCx,impactCz,eff,context);
      if(eff.kind==='damage'){
        for(const t of etgts){ if(!rollHit(u,t,spec)){ floatText(t,'RATÉ','#cfd6e6'); continue; }
          const dmgSpec={type:eff.damageType||spec.type,power:eff.power||spec.power,penetration:eff.penetration||spec.penetration,crit:spec.crit,elanPierce:spec.elanPierce,elanMul:spec.elanMul};
          const crit=!spec.flatDmg&&Math.random()<critChance(u,t,spec); let {dmg,lab}=computeDamage(u,t,dmgSpec); if(crit)dmg=Math.round(dmg*1.5);
          if(spec.damageMultiplier)dmg=Math.round(dmg*spec.damageMultiplier);
          if(spec.bonusVsSize&&t.size>1)dmg=Math.round(dmg*spec.bonusVsSize);
          if(spec.bonusVsAfflicted&&Object.keys(t.statuses).some(s=>isNegative(s)))dmg=Math.round(dmg*spec.bonusVsAfflicted);
          floatText(t,(crit?'✦ ':'')+'-'+dmg,crit?'#ffd700':'#ffffff',lab==='DOS'||crit);
          if(crit){ if(!playFeedbackVfx('critical_hit',u,t)){ screenShake(0.5,0.3); screenFlash('#fff3b0',0.18); vfx('crit',t.grp.position.clone().add(new THREE.Vector3(0,1,0))); } logMsg('Coup critique !'); }
          await applyDamage(t,dmg,u); totalDamageDealt+=dmg; if(G.over)break;
          if(t.alive&&eff.status){ applyStatus(t,eff.status,eff.statusTurns); if(eff.status==='taunt')t._taunter=u; }
        }
      } else if(eff.kind==='heal'){
        for(const t of etgts){ const amt=(eff.flatHeal!=null?eff.flatHeal:Math.round(effMAG(u)*(eff.power||spec.power||1)))+Math.floor(effCHA(u)/4); applyHeal(t,amt); }
      } else if(eff.kind==='status'){
        for(const t of etgts){ applyStatus(t,eff.status,eff.statusTurns); if(eff.status==='taunt')t._taunter=u; }
      } else if(eff.kind==='revive'){
        for(const t of etgts){ if(!t.alive&&t.downed)reviveUnit(t,Math.round(t.maxhp*(spec.power||0.5))); }
      } else if(eff.kind==='dispel'){
        for(const t of etgts){ let n=0; for(const s in t.statuses){ const neg=isNegative(s),pos=!neg; if((eff.dispelType==='negative'&&neg)||(eff.dispelType==='positive'&&pos)||(eff.dispelType==='all')){ delete t.statuses[s]; n++; } } floatText(t,n?'PURIFIÉ':'—',n?'#7ed957':'#cfd6e6',true); refreshPanel(t); }
      } else if(eff.kind==='lifesteal'){
        // processed after all damage effects
      } else if(eff.kind==='ap_restore'){
        for(const t of etgts){ t.ap=Math.min(t.maxap,t.ap+(eff.apRestore||spec.apRestore||1)); floatText(t,'+'+(eff.apRestore||spec.apRestore||1)+' AP','#7fd0ff',true); flashUnit(t,'#bfe0ff'); refreshPanel(t); }
      }
      await wait(0.1);
    }
    // Lifesteal processing: heal caster based on total damage dealt
    const lsEffect=spec.effects.find(e=>e.kind==='lifesteal');
    if(lsEffect&&totalDamageDealt>0&&u.alive){ const lsPct=lsEffect.lifestealPercent||0; const healAmt=Math.round(totalDamageDealt*lsPct); if(healAmt>0){ applyHeal(u,healAmt); } }
  } else if(spec.heal){ for(const t of targets)applyHeal(t,(spec.flatHeal!=null?spec.flatHeal:Math.round(effMAG(u)*spec.power))+Math.floor(effCHA(u)/4)); await wait(0.25); }
  else if(spec.revive){ for(const t of targets)reviveUnit(t,Math.round(t.maxhp*spec.power)); await wait(0.25); }
  else if(spec.apRestore){ for(const t of targets){ t.ap=Math.min(t.maxap,t.ap+spec.apRestore); floatText(t,'+'+spec.apRestore+' AP','#7fd0ff',true); flashUnit(t,'#bfe0ff'); refreshPanel(t); } await wait(0.25); }
  else if(spec.cure){ for(const t of targets){ let n=0; for(const s in t.statuses){ if(isNegative(s)){ delete t.statuses[s]; n++; } } floatText(t,n?'PURIFIÉ':'—',n?'#7ed957':'#cfd6e6',true); flashUnit(t,'#bfffc0'); refreshPanel(t); } await wait(0.25); }
  else { for(const t of targets){ const friendly=t.team===u.team;
      if((spec.power||0)<=0){ if(rollHit(u,t,spec)){ if(spec.status){ applyStatus(t,spec.status,spec.statusTurns); if(spec.status==='taunt')t._taunter=u; } } else floatText(t,'RATÉ','#cfd6e6'); continue; }
      if(!rollHit(u,t,spec)){ floatText(t,'RATÉ','#cfd6e6'); await wait(0.05); continue; }
      const crit=!spec.flatDmg&&Math.random()<critChance(u,t,spec); let {dmg,lab}=spec.flatDmg?{dmg:Math.max(1,Math.round(spec.flatDmg*rnd(0.85,1.15))),lab:'face'}:computeDamage(u,t,spec); if(crit)dmg=Math.round(dmg*1.5);
      if(!spec.flatDmg){ if(spec.damageMultiplier)dmg=Math.round(dmg*spec.damageMultiplier); if(spec.bonusVsSize&&t.size>1)dmg=Math.round(dmg*spec.bonusVsSize); if(spec.bonusVsAfflicted&&Object.keys(t.statuses).some(s=>isNegative(s)))dmg=Math.round(dmg*spec.bonusVsAfflicted); }
      floatText(t,(crit?'✦ ':'')+'-'+dmg,crit?'#ffd700':(friendly?'#ffd27a':'#ffffff'),lab==='DOS'||crit);
      if(crit){
        if(!playFeedbackVfx('critical_hit',u,t)){ screenShake(0.5,0.3); screenFlash('#fff3b0',0.18); vfx('crit',t.grp.position.clone().add(new THREE.Vector3(0,1,0))); }
        logMsg('Coup critique !');
      }
      if(lab==='DOS')floatText({grp:{position:t.grp.position.clone().add(new THREE.Vector3(0,0.3,0))},gx:t.gx,gz:t.gz},'DOS !','#ff5a4a');
      await applyDamage(t,dmg,u); if(G.over)break; if(t.alive&&spec.status){ applyStatus(t,spec.status,spec.statusTurns); if(spec.status==='taunt')t._taunter=u; } } await wait(0.15); }
  if(hasSkillMovement&&!moveBefore){ const moved=await performSkillMovement(u,spec,cx,cz,context); if(moved){G.skillMovedThisTurn=true; if(G.movedThisTurn)G.movedBeforeAct=true; G.startGX=u.gx; G.startGZ=u.gz;} }
  applyAdditionalStatus(u,spec,impactCx,impactCz,context);
  // Post-action upgrade effects
  if(spec.selfHealPercent&&u.alive){ const healAmt=Math.round(u.maxhp*spec.selfHealPercent); if(healAmt>0)applyHeal(u,healAmt); }
  if(spec.dispelAllies){ const allies=G.units.filter(t=>t.alive&&t.team===u.team); for(const t of allies){ let n=0; for(const s in t.statuses){ if(isNegative(s)){ delete t.statuses[s]; n++; } } if(n)floatText(t,'PURIFIÉ','#7ed957',true); refreshPanel(t); } }
  if(spec.stealBuffs){ for(const t of targets){ if(t.alive&&t.team!==u.team){ for(const s in t.statuses){ if(!isNegative(s)){ u.statuses[s]=t.statuses[s]; delete t.statuses[s]; } } refreshPanel(t); } } refreshPanel(u); }
  if(spec.ap>0)u.ap=Math.max(0,u.ap-spec.ap);
  if(spec.key==='attack'){ G.basicAttacksThisTurn++; } if(spec.item){ G.itemsUsedThisTurn++; }
  if(G.movedThisTurn)G.movedBeforeAct=true; refreshPanel(u); await combatStageExit(); G.busy=false; checkEnd();
}

// ============================= ENEMY AI =============================
function skillHasDamage(spec){ if(spec.offensive&&(spec.power||0)>0)return true; if(spec.effects&&spec.effects.some(e=>e.kind==='damage'))return true; return false; }
function skillHasSupport(spec){ if(spec.heal||spec.support||spec.cure||spec.apRestore)return true; if(spec.effects&&spec.effects.some(e=>e.kind==='heal'||e.kind==='status'||e.kind==='dispel'||e.kind==='ap_restore'))return true; return false; }
function simAt(u,st){ return Object.assign(Object.create(Object.getPrototypeOf(u)),u,{gx:st.gx,gz:st.gz}); }
function nearestDist(st,arr){ let m=1e9; for(const a of arr){ const d=Math.abs(st.gx-a.gx)+Math.abs(st.gz-a.gz); if(d<m)m=d; } return m; }
function bestOffense(u,stands,taunter){ const specs=[]; const isBE=!!(u.boss||u.elite),saving=isBE&&u._ultCooldown===0&&u.ap<5,forceUlt=isBE&&u._ultCooldown===0&&u.ap>=5,onCD=isBE&&u._ultCooldown>0; (u.weapons||[]).forEach((w,i)=>{ for(let ch=0;ch<3;ch++){ const s=getSpec(u,'attack',i,ch); if(s.ap<=u.ap&&!(saving&&s.ap>=4)&&!(forceUlt&&s.ap<5)&&!(onCD&&s.ap>=5))specs.push(s); } }); specs.push(...u.skills.filter(s=>{ const def=SKILLS[s]; if(!def||!(def.offensive||(def.effects&&def.effects.some(e=>e.kind==='damage')))||def.ap>u.ap)return false; if(saving&&def.ap>=4)return false; if(forceUlt&&def.ap<5)return false; if(onCD&&def.ap>=5)return false; return true; }).map(s=>getSpec(u,s))); let best=null;
  for(const st of stands){ const sim=simAt(u,st);
    for(const spec of specs){ for(const c of rangeCells(sim,spec)){ const aff=affectedUnits(sim,spec,c.gx,c.gz);
      const en=aff.filter(t=>t.team!==u.team), al=aff.filter(t=>t.team===u.team&&t!==u);
      if(!en.length)continue; let score=-st.d*0.6-spec.ap*1.5;
      for(const t of en){ const {dmg}=computeDamage(sim,t,spec); score+=dmg+(dmg>=t.hp?70:0); }
      for(const t of al){ const {dmg}=computeDamage(sim,t,spec); score-=dmg*1.6; }
      if(taunter&&en.includes(taunter))score+=50;
      if(en.length>1)score+=8*en.length;
      if(spec.status&&en.length>0){ const newT=en.filter(t=>!hasS(t,spec.status)); const sv={stun:30,curse:15,weak:15,blind:12,root:10,burn:8,poison:8,slow:8}[spec.status]||5; score+=sv*newT.length; }
      if(!best||score>best.score) best={score,st,spec,cx:c.gx,cz:c.gz}; } } }
  return best; }
function bestSupport(u,stands){ const supSpecs=u.skills.map(s=>getSpec(u,s)).filter(s=>skillHasSupport(s)&&s.ap<=u.ap); if(!supSpecs.length)return null;
  const allies=aliveUnits(u.team).filter(a=>a!==u); const wounded=[u,...allies].filter(a=>a.alive&&a.hp<a.maxhp*0.75);
  let best=null;
  for(const spec of supSpecs){ for(const st of stands){ const sim=simAt(u,st);
    if(spec.self&&spec.status){ const foes=aliveUnits('player').filter(f=>f.alive); const threat=foes.filter(f=>Math.abs(f.gx-sim.gx)+Math.abs(f.gz-sim.gz)<=3).length; let sc=threat*8+(u.hp<u.maxhp*0.5?15:0); if(!hasS(u,spec.status)&&sc>0){ if(!best||sc>best.score)best={score:sc,st,spec,cx:sim.gx,cz:sim.gz}; } continue; }
    if(!wounded.length)continue;
    for(const c of rangeCells(sim,spec)){ const aff=affectedUnits(sim,spec,c.gx,c.gz).filter(t=>wounded.includes(t)); if(!aff.length)continue;
      let sc=aff.length*10 - st.d*0.4 + aff.reduce((m,t)=>m+(1-t.hp/t.maxhp),0)*8;
      if(spec.cure){ const neg=aff.filter(t=>Object.keys(t.statuses).some(s=>isNegative(s)&&hasS(t,s))); if(neg.length)sc+=neg.length*6; }
      if(!best||sc>best.score) best={score:sc,spec,cx:c.gx,cz:c.gz}; } } }
  return best; }
function bestItem(u,stands){ if(u.ap<(1+G.itemsUsedThisTurn))return null; const allies=aliveUnits(u.team); let best=null;
  for(const id in ITEMS){ if((G.inv[id]||0)<=0)continue; const spec=itemSpec(id); if(spec.ap>u.ap)continue;
    for(const st of stands){ const sim=simAt(u,st);
      for(const c of rangeCells(sim,spec)){ const aff=affectedUnits(sim,spec,c.gx,c.gz); if(!aff.length)continue;
        let sc=0;
        if(spec.heal){ const w=aff.filter(t=>t.team===u.team&&t.alive&&t.hp<t.maxhp*0.6); if(!w.length)continue; sc=w.reduce((m,t)=>m+(1-t.hp/t.maxhp),0)*12; }
        else if(spec.apRestore){ const w=aff.filter(t=>t.team===u.team&&t.alive&&t.ap<t.maxap-1); if(!w.length)continue; sc=w.length*8+w.reduce((m,t)=>m+(t.maxap-t.ap)*0.5,0); }
        else if(spec.cure){ const w=aff.filter(t=>t.team===u.team&&t.alive&&Object.keys(t.statuses).some(s=>isNegative(s)&&hasS(t,s))); if(!w.length)continue; sc=w.length*10; }
        else if(spec.offensive){ const en=aff.filter(t=>t.team!==u.team); if(!en.length)continue; sc=en.reduce((m,t)=>m+(spec.flatDmg||0),0)*0.8; }
        if(sc>0&&(!best||sc>best.score)) best={score:sc,spec,cx:c.gx,cz:c.gz}; } } }
  return best; }
async function aiTurn(u){
  if(G.over)return;
  const foes=aliveUnits('player'); if(!foes.length){ endTurn(); return; }
  const allies=aliveUnits('foe').filter(a=>a!==u);
  const prof=u.ai||'aggressive';
  const taunter=(hasS(u,'taunt')&&u._taunter&&u._taunter.alive)?u._taunter:null;
  const {list,prev}=reachableStand(u);
  const stands=[{gx:u.gx,gz:u.gz,d:0},...list];

  // MOVEMENT: evaluate best position considering offense AND support
  const atkStands=(prof==='camper'||u.immobile)?[{gx:u.gx,gz:u.gz,d:0}]:stands;
  const best=bestOffense(u,atkStands,taunter);
  const supBefore=bestSupport(u,atkStands);
  // Healer prioritizes support position; others prioritize offense
  let moveTarget=null;
  if(prof==='healer'&&supBefore&&(!best||supBefore.score>best.score*0.5)){ moveTarget=supBefore; }
  else if(best&&best.score>0){ moveTarget=best; }
  if(moveTarget){
    // Find which stand the moveTarget came from
    const moveSt=atkStands.find(st=>{ const sim=simAt(u,st); return rangeCells(sim,moveTarget.spec).some(c=>c.gx===moveTarget.cx&&c.gz===moveTarget.cz); });
    if(moveSt&&(moveSt.gx!==u.gx||moveSt.gz!==u.gz)){ await moveAlong(u,buildPath(prev,u,moveSt.gx,moveSt.gz)); await wait(0.15); }
  } else {
    let tgt=foes[0],bd=1e9; for(const f of foes){ const d=gdist(u,f); if(d<bd){bd=d;tgt=f;} }
    if(taunter)tgt=taunter;
    if(prof==='camper'||u.immobile){ setFacing(u,tgt.gx,tgt.gz); await wait(0.2); endTurn(); return; }
    const lowHP=u.hp<u.maxhp*0.3; let pick=stands[0],bestSc=-1e9;
    for(const st of stands){ const dN=Math.abs(st.gx-tgt.gx)+Math.abs(st.gz-tgt.gz); let sc;
      if(prof==='cautious'){ sc = lowHP ? dN - st.d*0.1 : -Math.abs(dN-4)*1.2 - st.d*0.05; }
      else if(prof==='healer'){ sc = -dN*0.4 - st.d*0.05 - (allies.length?nearestDist(st,allies)*0.6:0); }
      else if(prof==='guardian'){ sc = -dN - st.d*0.05 - (allies.length?nearestDist(st,allies)*0.3:0); }
      else { sc = -dN - st.d*0.1; }
      if(sc>bestSc){ bestSc=sc; pick=st; } }
    if(pick&&(pick.gx!==u.gx||pick.gz!==u.gz)) await moveAlong(u,buildPath(prev,u,pick.gx,pick.gz));
    setFacing(u,tgt.gx,tgt.gz); await wait(0.25); endTurn(); return;
  }

  // ACTION LOOP: evaluate offense, support, and items each iteration
  let safety=0;
  const here=[{gx:u.gx,gz:u.gz,d:0}];
  while(!G.over&&u.alive&&safety++<4){
    const actBest=bestOffense(u,here,taunter);
    const supBest=bestSupport(u,here);
    const itmBest=bestItem(u,here);
    // Priority: healer prefers support; low-HP units prefer items; otherwise offense
    let pick=null;
    const isBE=!!(u.boss||u.elite),forceUlt=isBE&&u._ultCooldown===0&&u.ap>=5;
    const utilPhase=(isBE&&!forceUlt&&!u._usedUtility&&u.ap>=2)||(prof==='cautious'&&!u._usedUtility&&u.ap>=2);
    if(forceUlt&&actBest&&actBest.score>0){ pick={type:'offense',best:actBest}; }
    else if(utilPhase&&supBest&&supBest.score>10&&Math.random()<(isBE?0.4:0.25)){ pick={type:'support',best:supBest}; }
    else if(prof==='healer'&&supBest&&supBest.score>5){ pick={type:'support',best:supBest}; }
    else if(u.hp<u.maxhp*0.3&&itmBest&&itmBest.score>5){ pick={type:'item',best:itmBest}; }
    else if(actBest&&actBest.score>0){ pick={type:'offense',best:actBest}; }
    else if(supBest&&supBest.score>0){ pick={type:'support',best:supBest}; }
    else if(itmBest&&itmBest.score>0){ pick={type:'item',best:itmBest}; }
    if(!pick)break;
    const spec=pick.best.spec;
    if(spec.ap>u.ap)break;
    if(spec.ap>=5&&(u.boss||u.elite)&&u._ultCooldown>0)break;
    if(pick.type==='support')u._usedUtility=true;
    await executeAction(u,spec,pick.best.cx,pick.best.cz); await wait(0.2);
    if(spec.ap>=5&&(u.boss||u.elite))u._ultCooldown=5;
    if((u.boss||u.elite)&&u._ultCooldown===0&&u.ap<5)break;
  }
  endTurn();
}

// ============================= CAMERA CONTROL =============================
const camBase={dist:COMBAT_PRESENTATION.camera.baseDistance,height:COMBAT_PRESENTATION.camera.baseHeight};
const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
function killTweens(obj){ for(let i=tweens.length-1;i>=0;i--) if(tweens[i].obj===obj) tweens.splice(i,1); }
function focusCam(u){ if(!u)return; killTweens(cam); tween(cam,{tx:0,ty:COMBAT_PRESENTATION.camera.targetY,tz:0,dist:camBase.dist,height:camBase.height},0.35,easeInOut); }
function actionCam(v){ killTweens(cam); tween(cam,{tx:0,ty:COMBAT_PRESENTATION.camera.targetY,tz:0,dist:camBase.dist,height:camBase.height},0.25,easeOutCubic); }
function restoreCam(){ killTweens(cam); tween(cam,{tx:0,ty:COMBAT_PRESENTATION.camera.targetY,tz:0,dist:camBase.dist,height:camBase.height},0.35,easeInOut); }
// ---- Combat stage : focus cinématique attaquant/cible ----
let stageVigEl=null, stageTitleEl=null;
function buildStageOverlay(){ stageVigEl=document.createElement('div'); stageVigEl.id='stagevig'; document.body.appendChild(stageVigEl);
  stageTitleEl=document.createElement('div'); stageTitleEl.id='stagetitle'; stageTitleEl.innerHTML='<b></b><small></small>'; document.body.appendChild(stageTitleEl); }
function stageFrame(att,targets){ killTweens(cam); tween(cam,{tx:0,ty:COMBAT_PRESENTATION.camera.targetY,tz:0,dist:camBase.dist,height:camBase.height,yaw:cam.yaw},0.25,easeInOut); }
async function combatStageEnter(att,targets,spec){ hideActionPreview(); G.stage=true; G._stagePrevYaw=cam.yaw; if(!stageTitleEl)buildStageOverlay();
  const inv=new Set([att]); for(const t of targets)inv.add(t); G._stageFaded=[];
  for(const o of G.units){ if(inv.has(o))continue; o._opSnap={mat:o.mat.opacity,blob:o.blob.material.opacity,vis:o.grp.visible};
    tween(o.mat,{opacity:0},0.2,easeOutCubic,()=>{ if(o._opSnap)o.grp.visible=false; }); tween(o.blob.material,{opacity:0},0.2,easeOutCubic); G._stageFaded.push(o); }
  if(selRing)selRing.visible=false; if(faceArrow)faceArrow.visible=false;
  stageFrame(att,targets); tween(Grade.uniforms.vig,{value:1.36},0.42,easeInOut);
  const etgt=targets.find(t=>t!==att&&t.team!==att.team);
  stageTitleEl.querySelector('b').textContent=spec.name||'Action';
  stageTitleEl.querySelector('small').textContent=att.name+(etgt?'  \u2192  '+etgt.name:'');
  stageVigEl.classList.add('on'); stageTitleEl.classList.add('on'); dom.ui.classList.add('staging'); await wait(0.22); }
async function combatStageExit(){ killTweens(cam);
  tween(cam,{tx:0,ty:COMBAT_PRESENTATION.camera.targetY,tz:0,dist:camBase.dist,height:camBase.height,yaw:(G._stagePrevYaw!=null?G._stagePrevYaw:cam.yaw)},0.35,easeInOut);
  tween(Grade.uniforms.vig,{value:COMBAT_PRESENTATION.grade.vignette},0.5,easeInOut);
  if(stageVigEl)stageVigEl.classList.remove('on'); if(stageTitleEl)stageTitleEl.classList.remove('on'); if(dom.ui)dom.ui.classList.remove('staging');
  if(G._stageFaded){ for(const o of G._stageFaded){ if(o._opSnap){ const state=getUnitVisualState(o.team,o.alive,o.downed); o.grp.visible=state.visible&&o._opSnap.vis; if(state.visible){ tween(o.mat,{opacity:o.alive?o._opSnap.mat:state.bodyOpacity},0.3,easeOutCubic); tween(o.blob.material,{opacity:o.alive?o._opSnap.blob:state.shadowOpacity},0.3,easeOutCubic); } delete o._opSnap; } } G._stageFaded=null; }
  G.stage=false; await wait(0.32); }
function rotateCam(d){ killTweens(cam); tween(cam,{yaw:cl(cam.yaw+d,-0.48,0.48)},0.3,easeInOut); }

// ============================= INPUT =============================
const ray=new THREE.Raycaster(), ndc=new THREE.Vector2();
function pickCell(ev){ ndc.x=(ev.clientX/innerWidth)*2-1; ndc.y=-(ev.clientY/innerHeight)*2+1; ray.setFromCamera(ndc,camera);
  const hits=ray.intersectObjects(G.tilesMesh,false); if(!hits.length)return null; const m=hits[0].object; return cellAt(m.userData.gx,m.userData.gz); }
function pickUnit(ev){ const c=pickCell(ev); return (c&&c.occupant&&c.occupant.alive)?c.occupant:null; }

function drawReach(){ clearHL(); const keys=new Set(G.reach.list.map(t=>cellKey(t.gx,t.gz))); addInvalidTiles(keys,true); for(const t of G.reach.list){ if(t.gx===G.active.gx&&t.gz===G.active.gz)continue; addHL(t.gx,t.gz,CFG.COL.move,COMBAT_PRESENTATION.arena.moveTileOpacity,'move'); } }
function enterMove(){ if(G.movedThisTurn||G.busy)return; if(G.active.immobile){ toast('Immobile — deplacement impossible'); return; } if(hasS(G.active,'root')){ toast('Entravé — déplacement impossible'); return; } G.mode='move'; G.reach=reachableStand(G.active); unitFocus.focus(G.units,G.active); closeMenus(false); drawReach(); setHint('Déplacement — choisissez une case'); }
function drawRange(){ hideActionPreview(); clearHL(); const sp=G.pending.spec,keys=new Set(G.pending.centers.map(c=>cellKey(c.gx,c.gz))); addInvalidTiles(keys,false); const helpful=Boolean(sp.heal||sp.support||sp.revive||sp.cure); const rangeCol=helpful?0x6aff7a:0xff6a5a; for(const c of G.pending.centers) addHL(c.gx,c.gz,rangeCol,COMBAT_PRESENTATION.arena.rangeTileOpacity,'range');
  for(const c of G.pending.centers){ const occ=cellAt(c.gx,c.gz)?.occupant; if(!occ||!occ.alive||!G.active)continue; const isAlly=occ.team===G.active.team; if(helpful&&!isAlly)continue; if(!helpful&&isAlly)continue;
    const tk=helpful?'target_ally':'target',tc=helpful?0x7edf7a:CFG.COL.foe; addHL(c.gx,c.gz,tc,COMBAT_PRESENTATION.arena.targetTileOpacity,tk);
    const sc=occ.size>1?occ.size:1,cgx=occ.size>1?bossCenterGX(occ):c.gx,cgz=occ.size>1?bossCenterGZ(occ):c.gz; addRingHL(c.gx,c.gz,tc,COMBAT_PRESENTATION.arena.targetTileOpacity+.22,sc,cgx,cgz); } }
function previewAt(cx,cz){ drawRange(); const sp=G.pending.spec,hoverCell=cellAt(cx,cz),hoverOcc=hoverCell&&hoverCell.occupant,helpful=Boolean(sp.heal||sp.support||sp.revive||sp.cure),hoverEnemy=hoverOcc&&G.active&&hoverOcc.team!==G.active.team,hoverAlly=hoverOcc&&G.active&&hoverOcc.team===G.active.team&&helpful; addHL(cx,cz,hoverEnemy?CFG.COL.foe:(hoverAlly?0x7edf7a:0xf7edcf),COMBAT_PRESENTATION.arena.hoverTileOpacity,hoverEnemy?'target':(hoverAlly?'target_ally':'hover')); if(hoverEnemy)addRingHL(cx,cz,CFG.COL.foe,COMBAT_PRESENTATION.arena.targetTileOpacity+.22); if(hoverAlly)addRingHL(cx,cz,0x7edf7a,COMBAT_PRESENTATION.arena.targetTileOpacity+.22);
  const targets=affectedUnits(G.active,sp,cx,cz); unitFocus.preview(targets); showActionPreview(G.active,sp,targets,cx,cz);
  for(const [gx,gz] of aoeCells(G.active,sp,cx,cz)){ const occ=cellAt(gx,gz)?.occupant; const aoeCol=helpful?0x6aff7a:0xff6a5a; let col=sp.type==='move'?CFG.COL.move:aoeCol,op=COMBAT_PRESENTATION.arena.rangeTileOpacity,kind='aoe';
    if(occ&&G.active&&occ===G.active&&sp.offensive&&!sp.allowSelfDamage){ addHL(gx,gz,0xf7edcf,COMBAT_PRESENTATION.arena.rangeTileOpacity*.72,'range'); continue; }
    if(occ&&occ.alive){ const isAlly=occ.team===G.active.team; if(helpful&&isAlly){ col=0x7edf7a; op=COMBAT_PRESENTATION.arena.targetTileOpacity; kind='target_ally'; } else if(!helpful&&!isAlly){ col=CFG.COL.foe; op=COMBAT_PRESENTATION.arena.targetTileOpacity; kind='target'; } else if(!helpful&&isAlly){ col=0xff9a52; op=COMBAT_PRESENTATION.arena.rangeTileOpacity*.8; kind='aoe'; } else { col=aoeCol; op=COMBAT_PRESENTATION.arena.rangeTileOpacity; kind='aoe'; } }
    else if(sp.revive){ const ko=G.units.find(x=>!x.alive&&x.downed&&x.gx===gx&&x.gz===gz); if(ko){col=0x7edf7a;op=COMBAT_PRESENTATION.arena.targetTileOpacity;kind='target_ally';} }
    addHL(gx,gz,col,op,kind); if(occ&&occ.alive&&G.active&&occ.team!==G.active.team&&!helpful)addRingHL(gx,gz,CFG.COL.foe,COMBAT_PRESENTATION.arena.targetTileOpacity+.18); if(occ&&occ.alive&&G.active&&occ.team===G.active.team&&helpful)addRingHL(gx,gz,0x7edf7a,COMBAT_PRESENTATION.arena.targetTileOpacity+.18); } }
function enterTarget(spec){ if(G.busy)return;
  if(spec.ap>G.active.ap){ toast('AP insuffisants'); return; }
  const centers=rangeCells(G.active,spec); if(!centers.length){ toast('Aucune cible à portée'); return; }
  G.mode='target'; G.pending={spec,centers,keys:new Set(centers.map(c=>c.gx+','+c.gz))}; closeMenus(false);
  const validTargets=[...new Set(centers.flatMap(c=>affectedUnits(G.active,spec,c.gx,c.gz)))];
  unitFocus.focus(G.units,G.active,validTargets);
  if(spec.self) previewAt(G.active.gx,G.active.gz); else drawRange();
  setHint((spec.self?'Action':(spec.type==='move'?'Déplacement':'Ciblage'))+' — '+spec.name); }
function cancelToMenu(){ if(G.busy)return; if(G.mode==='move'||G.mode==='target'){ unitFocus.restore(); hideActionPreview(); G.pending=null; clearHL(); G.mode='menu'; openActionMenu(); setHint(G.active.name+' — à vous de jouer'); } }

async function doExecute(spec,cx,cz){ await executeAction(G.active,spec,cx,cz); afterSub(); }
function afterSub(){ unitFocus.restore(); hideActionPreview(); if(G.over)return; G.mode='menu'; selectUnit(G.active); openActionMenu();
  const u=G.active;
  const nextAtkCost=G.basicAttacksThisTurn+1;
  const canAct = (u.ap>=nextAtkCost) || u.skills.some(s=>getSpec(u,s).ap<=u.ap) || (u.ap>=(G.itemsUsedThisTurn+1) && invCount()>0);
  if(!canAct && G.movedThisTurn) setHint('Tour terminé — Entrée pour attendre'); else setHint(u.name+' — choisissez une action'); }
function undoMove(){ if(G.busy||!G.movedThisTurn||G.movedBeforeAct||G.startGX==null)return; unitFocus.restore(); const u=G.active; placeUnit(u,G.startGX,G.startGZ,true); G.movedThisTurn=false; clearHL(); G.mode='menu'; selectUnit(u); openActionMenu(); setHint(u.name+' — déplacement annulé'); }

function transientInspect(u){ if(!u)return; const key=u.campaignId||u.id||u.name; if(statsPanelKey!==key){statsPanelKey=key;statsPanelExpanded=false;} G.selected=u; renderPanel(u); }
function restoreInspection(){ const fallback=(G.pinnedUnit&&G.pinnedUnit.alive?G.pinnedUnit:G.active); if(fallback)transientInspect(fallback); }
function onPointerMove(ev){ if(G.busy||G.over)return; const c=pickCell(ev); const hoveredUnit=(c&&c.occupant&&c.occupant.alive)?c.occupant:null; G.hover=c; G.hoverUnit=hoveredUnit; if(c)moveCursor(c.gx,c.gz); else if(cursorMesh)cursorMesh.visible=false;
  if(G.mode==='target'){ const sp=G.pending.spec; const targetCell=hoveredUnit?.cell?.()||c; if(sp.self)previewAt(G.active.gx,G.active.gz); else if(targetCell&&G.pending.keys.has(targetCell.gx+','+targetCell.gz)){ previewAt(targetCell.gx,targetCell.gz); const target=affectedUnits(G.active,sp,targetCell.gx,targetCell.gz)[0]||hoveredUnit; if(target)transientInspect(target); } else { drawRange(); restoreInspection(); } }
  else if((G.mode==='menu'||G.mode==='idle')&&hoveredUnit)transientInspect(hoveredUnit);
  else if((G.mode==='menu'||G.mode==='idle')&&c?.occupant?.alive)transientInspect(c.occupant);
  else if(G.mode==='menu'||G.mode==='idle')restoreInspection(); }
async function onClick(ev){ if(G.over)return; if(ev.button!==0){ cancelToMenu(); return; } if(G.busy)return; const c=pickCell(ev);
  if(G.mode==='deploy'){ if(c&&inZone(c.gx,c.gz)){
    if(c.occupant&&c.occupant.team==='player'){
      const occupant=c.occupant,occupantId=occupant.campaignId||occupant.name;
      if(G.selectedDeployId&&G.selectedDeployId!==occupantId){ removeUnit(occupant); const nu=deployUnit(c.gx,c.gz); if(nu)selectUnit(nu); }
      else { G.selectedDeployId=occupantId; removeUnit(occupant); const def=deployDefById(occupantId); if(def)selectUnitData(def); }
    } else if(!c.occupant&&G.selectedDeployId){ const nu=deployUnit(c.gx,c.gz); if(nu)selectUnit(nu); }
    drawDeployZone(); openDeployMenu(); setHint(G.deployedUnits.length+' / '+MAX_PLAYER_UNITS+' unités placées');
  } return; }
  if(G.mode==='move'){ if(c&&(c.gx!==G.active.gx||c.gz!==G.active.gz)&&G.reach.list.some(t=>t.gx===c.gx&&t.gz===c.gz)){ G.movedThisTurn=true; await moveAlong(G.active,buildPath(G.reach.prev,G.active,c.gx,c.gz)); afterSub(); } return; }
  if(G.mode==='target'){ const sp=G.pending.spec; if(sp.self){ await doExecute(sp,G.active.gx,G.active.gz); return; } if(c&&G.pending.keys.has(c.gx+','+c.gz)) await doExecute(sp,c.gx,c.gz); return; }
  if((G.mode==='menu'||G.mode==='idle')&&c&&c.occupant){ G.pinnedUnit=c.occupant.alive?c.occupant:null; selectUnit(c.occupant); }
}

function bindInput(){ const el=renderer.domElement;
  el.addEventListener('pointermove',onPointerMove);
  el.addEventListener('pointerdown',onClick);
  el.addEventListener('contextmenu',e=>{ e.preventDefault(); cancelToMenu(); });
  addEventListener('wheel',e=>{ e.preventDefault(); camera.fov=cl(camera.fov+Math.sign(e.deltaY)*COMBAT_PRESENTATION.camera.zoomFovStep,COMBAT_PRESENTATION.camera.zoomFovMin,COMBAT_PRESENTATION.camera.zoomFovMax); camera.updateProjectionMatrix(); },{passive:false});
  addEventListener('keydown',e=>{ const k=e.key.toLowerCase();
    if(k==='q')rotateCam(0.2); else if(k==='e')rotateCam(-0.2);
    else if(k==='escape')cancelToMenu();
    else if(k==='enter'&&G.mode==='menu'&&!G.busy)endTurn();
    else if(k==='m'&&G.mode==='menu')enterMove();
    else if(k==='u'&&G.mode==='menu')undoMove();
    else if(k==='a'&&G.mode==='menu')openElanMenu(0);
  });
}

// ============================= UI (HUD) =============================
const ROLE={knight:'Guerrier',cleric:'Mage Blanc',mage:'Mage Noir',archer:'Archer',brigand:'Brigand',brute:'Brute',darkmage:'Mage Noir'};
const ESC_MAP={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
function escHTML(v){ return String(v==null?'':v).replace(/[&<>"']/g,ch=>ESC_MAP[ch]); }
function teamLabel(team){ return team==='player'?'Allié':'Ennemi'; }
function setHint(t){ const text=String(t||''),parts=text.split(/\s+[—–·]\s+/); if(parts.length>1){ const lead=parts.shift(); dom.hint.innerHTML='<span class="hint__lead">'+escHTML(lead)+'</span><span class="hint__sep">—</span><span class="hint__copy">'+escHTML(parts.join(' — '))+'</span>'; } else dom.hint.innerHTML='<span class="hint__copy">'+escHTML(text)+'</span>'; }
function toast(t){ setHint('⚠ '+t); }
// ---- Objective (compact / collapsible) ----
function renderObjective(){ if(!dom.objective)return; dom.objective.classList.remove('hidden');
  const foes=G.units.filter(u=>u.team==='foe'),foeAlive=aliveUnits('foe').length,foeDone=Math.max(0,foes.length-foeAlive),deploying=G.mode==='deploy'||!G.round;
  const playerAlive=aliveUnits('player').length,playerTotal=G.deployedUnits.length||G.units.filter(u=>u.team==='player').length||MAX_PLAYER_UNITS;
  const squadLabel=deploying?'Unités placées':'Escouade debout',squadValue=deploying?(G.deployedUnits.length+' / '+MAX_PLAYER_UNITS):(playerAlive+' / '+playerTotal),roundLabel=deploying?'Déploiement':'Manche '+G.round;
  const openAttr=deploying?' open':'';
  dom.objective.innerHTML='<details'+openAttr+'><summary><span class="obj__eyebrow">Objectif</span><span class="obj__label">'+escHTML(COMBAT_LABEL||'Combat tactique')+'</span><span class="obj__summary"><b>'+foeDone+'/'+foes.length+'</b><i>'+squadValue+'</i></span><i class="obj__chevron" aria-hidden="true"></i></summary><div class="obj__body"><p class="obj__text">'+escHTML(COMBAT_OBJECTIVE)+'</p><div class="obj__section">Sous-objectifs</div><div class="obj__sub"><span>Ennemis neutralisés</span><b>'+foeDone+' / '+foes.length+'</b></div><div class="obj__sub"><span>'+squadLabel+'</span><b>'+squadValue+'</b></div><div class="obj__round"><span>Manche actuelle</span><b>'+roundLabel+'</b></div></div></details>'; }
// ---- Settings (gear) : purely visual toggles, no rules touched ----
function applyGraphics(){ document.body.classList.toggle('reduced-graphics',REDUCED_GRAPHICS); if(typeof bloom!=='undefined'&&bloom)bloom.enabled=!REDUCED_GRAPHICS; if(typeof tiltPass!=='undefined'&&tiltPass)tiltPass.enabled=!REDUCED_GRAPHICS; }
function renderSettings(){ if(!dom.settings)return;
  dom.settings.innerHTML='<div class="settings__ttl">Réglages</div>'+
    '<button class="settings__row" type="button" data-s="fxhd" role="menuitemcheckbox" aria-checked="'+(!REDUCED_GRAPHICS)+'"><span>Effets HD</span><i class="settings__sw'+(!REDUCED_GRAPHICS?' on':'')+'"></i></button>'+
    '<button class="settings__row" type="button" data-s="help" role="menuitem"><span>Aide & commandes</span><i class="settings__hint">?</i></button>';
  dom.settings.querySelector('[data-s="fxhd"]').onclick=()=>{ REDUCED_GRAPHICS=!REDUCED_GRAPHICS; applyGraphics(); renderSettings(); };
  dom.settings.querySelector('[data-s="help"]').onclick=()=>{ const d=dom.help&&dom.help.querySelector('details'); if(d)d.open=true; toggleSettings(false); };
}
function toggleSettings(show){ if(!dom.settings)return; const open=(show==null)?dom.settings.classList.contains('hidden'):show;
  if(open){ renderSettings(); dom.settings.classList.remove('hidden'); } else dom.settings.classList.add('hidden');
  if(dom.settingsBtn)dom.settingsBtn.classList.toggle('is-open',open); }
function initLogPanel(){ if(!dom.log||dom.log.dataset.ready)return; dom.log.innerHTML='<button type="button" class="log-toggle" aria-expanded="false"><span>Journal</span><b>0</b></button><div class="log-body"></div>'; dom.log.dataset.ready='1'; dom.log.classList.add('is-collapsed'); dom.log.classList.remove('is-open','hidden'); const button=dom.log.querySelector('.log-toggle'); if(button)button.onclick=()=>toggleLogPanel(); }
function toggleLogPanel(show){ if(!dom.log)return; initLogPanel(); const open=show==null?dom.log.classList.contains('is-collapsed'):show; dom.log.classList.toggle('is-collapsed',!open); dom.log.classList.toggle('is-open',open); const button=dom.log.querySelector('.log-toggle'); if(button)button.setAttribute('aria-expanded',open?'true':'false'); }
function initHud(){ if(dom.settingsBtn)dom.settingsBtn.onclick=()=>toggleSettings();
  addEventListener('pointerdown',(e)=>{ if(dom.settings&&!dom.settings.classList.contains('hidden')&&!dom.settings.contains(e.target)&&e.target!==dom.settingsBtn)toggleSettings(false); },true);
  initLogPanel(); renderObjective(); }
function logMsg(t){ initLogPanel(); const body=dom.log.querySelector('.log-body')||dom.log,d=document.createElement('div'); d.className='l'; d.textContent=t; body.appendChild(d); while(body.children.length>7)body.removeChild(body.firstChild); const count=dom.log.querySelector('.log-toggle b'); if(count)count.textContent=body.children.length; dom.log.classList.remove('hidden'); }
let statsPanelKey=null, statsPanelExpanded=false;
function selectUnit(u){ const key=u.campaignId||u.id||u.name; if(statsPanelKey!==key){statsPanelKey=key;statsPanelExpanded=false;} G.selected=u; renderPanel(u); }
function refreshPanel(u){ if(u&&u===G.selected)renderPanel(u); }
function apPipsHTML(u){ let pips=''; for(let i=0;i<u.maxap;i++)pips+='<i class="'+(i<u.ap?'on':'')+'"></i>'; return '<div class="du-ap"><div class="du-ap__pips">'+pips+'</div></div>'; }
function statBarsHTML(u){ const ST=[['⚔','FOR',Math.round(effSTR(u))],['✦','MAG',Math.round(effMAG(u))],['◈','END',Math.round(effEND(u))],['◎','DEX',Math.round(effDEX(u))],['✧','CHA',Math.round(effCHA(u))],['◆','MOV',u.mov]];
  let h='<div class="du-stats">'; for(const [ico,k,v] of ST)h+='<div class="du-stat"><i>'+ico+'</i><span>'+k+'</span><b>'+v+'</b></div>'; return h+'</div>'; }
function statsDetailsHTML(u){ return '<button type="button" class="stats-toggle" aria-expanded="'+(statsPanelExpanded?'true':'false')+'"><span>'+(statsPanelExpanded?'Masquer':'Afficher')+' stats</span><b>'+(statsPanelExpanded?'−':'+')+'</b></button>'+(statsPanelExpanded?statBarsHTML(u):''); }
function bindStatsToggle(u){ const button=dom.panel.querySelector('.stats-toggle'); if(!button)return; button.onclick=()=>{statsPanelExpanded=!statsPanelExpanded;renderPanel(u);}; }
function renderPanel(u){ dom.panel.classList.remove('hidden'); dom.panel.dataset.team=u.team; const hpp=Math.max(0,Math.round(u.hp/u.maxhp*100)),portrait=uiPortraitFor(u.portrait)||(SPR[u.kind]&&SPR[u.kind].portrait?SPR[u.kind].portrait:'');
  let tags=''; for(const s in u.statuses){ const d=STATUS[s]; if(!d)continue; tags+='<span class="tag" style="color:'+d.col+';border-color:'+d.col+'">'+escHTML(d.name)+' '+u.statuses[s]+'</span>'; } if(!u.alive)tags+='<span class="tag" style="color:#ff5a4a;border-color:#ff5a4a">K.O.</span>';
  dom.panel.innerHTML='<div class="details-unit"><div class="du-top"><div class="du-portrait">'+(portrait?'<img src="'+portrait+'" alt="">':'<span>'+escHTML(u.name.charAt(0))+'</span>')+'</div><div class="du-id"><div class="du-head"><span>'+escHTML(u.className||u.name||'')+'</span></div><div class="nm">'+escHTML(u.name)+'</div>'+apPipsHTML(u)+'</div><div class="du-team"><b class="team-badge">'+teamLabel(u.team)+'</b></div></div>'+
   '<div class="du-hp"><div class="unit-row"><span>PV</span><b>'+u.hp+' / '+u.maxhp+'</b></div><div class="bar"><i style="width:'+hpp+'%"></i><span>'+hpp+'%</span></div></div>'+
   statsDetailsHTML(u)+(tags?'<div class="status-row">'+tags+'</div>':'')+'</div>';
  bindStatsToggle(u); }
function refreshTurnbar(){ dom.turnbar.classList.remove('hidden'); renderObjective(); const order=G.order.length?G.order:G.units;
  const chip=u=>{ const cls=['chip'],portrait=uiPortraitFor(u.portrait)||(SPR[u.kind]&&SPR[u.kind].portrait?SPR[u.kind].portrait:''); if(u.team==='player')cls.push('ally'); if(u.team==='foe')cls.push('foe'); if(u===G.active)cls.push('active'); if(!u.alive)cls.push('dead'); return '<div class="'+cls.join(' ')+'" title="'+escHTML(u.name)+'"><div class="chip__portrait">'+(portrait?'<img src="'+portrait+'" alt="">':'')+'</div><div class="chip__name">'+escHTML(u.name.slice(0,8))+'</div></div>'; };
  const step=G.order.length&&G.turnIdx>=0?(G.turnIdx+1)+' / '+G.order.length:'Préparation';
  dom.turnbar.innerHTML='<div class="turn-center pixel"><span>Tour</span><b>'+(G.round||1)+'</b><em>'+escHTML(step)+'</em></div><div class="turn-sequence"><div class="turn-chips">'+order.map(chip).join('')+'</div></div>'; }
function closeMenus(){ dom.menu.classList.add('hidden'); dom.skillmenu.classList.add('hidden'); }
function tipFor(u,b){ const a=b.dataset.a;
  if(a==='move')return 'Déplacer · MOV '+u.mov;
  if(a==='undo')return 'Annuler le déplacement (U)';
  if(a==='attack'){ const w=u.weapons[+b.dataset.wi||0]; const n=G.basicAttacksThisTurn; return w.name+' · portée '+w.min+'-'+w.max+' · puiss '+w.power+' · crit '+Math.round(w.crit*100)+'% · préc '+Math.round(w.acc*100)+'% · 3 niveaux d\'Élan'+(n>0?' · escalade +'+n+' PA':''); }
  if(a==='skill')return 'Compétences · '+u.ap+' AP';
  if(a==='item')return 'Objets · sac ×'+invCount()+' · dès '+(G.itemsUsedThisTurn+1)+' AP';
  if(a==='wait')return 'Attendre · fin de tour'; return ''; }
function openActionMenu(){ const u=G.active; if(!u||u.team!=='player'||G.over){ closeMenus(); return; }
  dom.menu.classList.remove('hidden'); dom.skillmenu.classList.add('hidden');
  const md=G.movedThisTurn;
  const n=G.basicAttacksThisTurn;
  const atkDis = u.ap<1+n;
  const atkSub = 'Élan · dès '+(1+n)+' AP';
  const sklDis = !u.skills.length || hasS(u,'silence') || !u.skills.some(s=>getSpec(u,s).ap<=u.ap);
  const itmDis = u.ap<(G.itemsUsedThisTurn+1) || invCount()<=0;
  const ico=(a,icon,label,sub,dot,dis,extra)=>'<div class="ico action-'+a+(dis?' dis':'')+'" role="button" aria-disabled="'+(dis?'true':'false')+'" data-a="'+a+'"'+(extra||'')+' style="--action-accent:'+dot+'"><div class="c"><span>'+icon+'</span></div><div class="tx"><b>'+escHTML(label)+'</b><small>'+escHTML(sub)+'</small></div><div class="dot"></div></div>';
  let h = (md&&!G.movedBeforeAct) ? ico('undo','↩','Annuler','Déplacement','#f59e0b',false) : ico('move','◆','Déplacer','MOV '+u.mov,'#55d4ff',md||hasS(u,'root')||u.immobile);
  (u.weapons||[]).forEach((w,i)=>{ h+=ico('attack',w.icon||'⚔','Attaque',atkSub,'#ff6b58',atkDis,' data-wi="'+i+'"'); });
  h+=ico('skill','✦','Compétence',u.ap+' AP','#b78cff',sklDis);
  h+=ico('item','◈','Objet','Sac ×'+invCount()+' · dès '+(G.itemsUsedThisTurn+1)+' AP','#f09ac9',itmDis);
  h+=ico('wait','⌛','Attendre','Fin du tour','#d0ba82',false);
  h+='<div class="lbl"></div>';
  dom.menu.innerHTML=h;
  const lbl=dom.menu.querySelector('.lbl');
  dom.menu.querySelectorAll('.ico').forEach(b=>{ b.onclick=()=>onMenu(b.dataset.a,b);
    b.onmouseenter=()=>{ lbl.textContent=tipFor(u,b); lbl.classList.add('on'); };
    b.onmouseleave=()=>{ lbl.classList.remove('on'); }; }); }
function onMenu(a,b){ if(b.classList.contains('dis'))return; const u=G.active; selectUnit(u);
  if(a==='move')enterMove(); else if(a==='undo')undoMove(); else if(a==='attack')openElanMenu(+b.dataset.wi||0); else if(a==='skill')openSkillMenu(); else if(a==='item')openItemMenu(); else if(a==='wait')endTurn(); }
function openElanMenu(wi){ const u=G.active; if(!u)return; dom.skillmenu.classList.remove('hidden'); const n=G.basicAttacksThisTurn;
  let h='<div class="ttl">Élan — '+u.ap+' AP'+(n>0?' · escalade +'+n+' PA':'')+'</div>';
  for(let ch=0;ch<3;ch++){ const sp=getSpec(u,'attack',wi,ch); const dis=sp.ap>u.ap?'dis':'';
    const info='×'+sp.elanMul.toFixed(1)+(sp.elanPierce?' · perce '+Math.round(sp.elanPierce*100)+'% END':'')+(ch>=2?' · préc +10%':'');
    h+='<div class="btn '+dis+'" data-ch="'+ch+'" title="Coût '+sp.ap+' AP · dégâts '+info+'">'+sp.name+' <small>'+sp.ap+' AP · '+info+'</small></div>'; }
  h+='<div class="btn" data-ch="_back">Retour</div>';
  dom.skillmenu.innerHTML=h; dom.skillmenu.querySelectorAll('.btn').forEach(b=>b.onclick=()=>{ if(b.classList.contains('dis'))return; const ch=b.dataset.ch; if(ch==='_back'){ dom.skillmenu.classList.add('hidden'); return; } enterTarget(getSpec(u,'attack',wi,+ch)); }); }
function openSkillMenu(){ const u=G.active; dom.skillmenu.classList.remove('hidden'); let h='<div class="ttl">Compétences — '+u.ap+' AP</div>';
  for(const id of u.skills){ const s=SKILLS[id], sp=getSpec(u,id); const isRevive=sp.revive||(s.type==='revive'); const dis=(sp.ap>u.ap||(isRevive&&!G.units.some(x=>!x.alive&&x.downed&&x.team===u.team)))?'dis':'';
    h+='<div class="btn '+dis+'" data-s="'+id+'" title="'+s.desc+'">'+sp.name+(sp.upgradeLevel?' +'+sp.upgradeLevel:'')+' <small>'+sp.ap+' AP</small></div>'; }
  h+='<div class="btn" data-s="_back">Retour</div>';
  dom.skillmenu.innerHTML=h; dom.skillmenu.querySelectorAll('.btn').forEach(b=>b.onclick=()=>{ if(b.classList.contains('dis'))return; const id=b.dataset.s; if(id==='_back'){ dom.skillmenu.classList.add('hidden'); return; } enterTarget(getSpec(u,id)); }); }
function itemSpec(id){ const it=ITEMS[id]; const base={key:'item',itemId:id,name:it.name,ap:1+G.itemsUsedThisTurn,range:it.range,radius:it.radius||0,self:false,item:true,desc:it.desc};
  if(it.effect==='heal')  return Object.assign(base,{type:'heal',power:0,heal:true,support:true,flatHeal:it.flatHeal});
  if(it.effect==='ap')    return Object.assign(base,{type:'buff',power:0,support:true,apRestore:it.apRestore});
  if(it.effect==='cure')  return Object.assign(base,{type:'buff',power:0,support:true,cure:true});
  if(it.effect==='bomb')  return Object.assign(base,{type:'mag', power:0,offensive:true,acc:1,flatDmg:it.flatDmg});
  return base; }
function invCount(){ let n=0; for(const k in G.inv)n+=G.inv[k]; return n; }
function openItemMenu(){ const u=G.active; dom.skillmenu.classList.remove('hidden'); const nextCost=G.itemsUsedThisTurn+1; let h='<div class="ttl">Objets — sac commun · '+u.ap+' AP</div>'; let any=false;
  for(const id in ITEMS){ const n=G.inv[id]||0; const it=ITEMS[id]; const dis=n<=0||u.ap<nextCost; if(n>0)any=true; h+='<div class="btn '+(dis?'dis':'')+'" data-i="'+id+'" title="'+it.desc+'">'+it.name+' <small>×'+n+' · '+nextCost+' AP</small></div>'; }
  if(!any)h+='<div class="btn dis">Sac vide</div>';
  h+='<div class="btn" data-i="_back">Retour</div>';
  dom.skillmenu.innerHTML=h; dom.skillmenu.querySelectorAll('.btn').forEach(b=>b.onclick=()=>{ if(b.classList.contains('dis'))return; const id=b.dataset.i; if(id==='_back'){ dom.skillmenu.classList.add('hidden'); return; } enterTarget(itemSpec(id)); }); }
// ============================= WAVES =============================
function freeNear(gx,gz){ const c=cellAt(gx,gz); if(c&&c.walkable&&!c.occupant)return c; for(let r=1;r<=7;r++)for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){ if(Math.abs(dx)+Math.abs(dz)!==r)continue; const cc=cellAt(gx+dx,gz+dz); if(cc&&cc.walkable&&!cc.occupant)return cc; } return null; }
function spawnWave(wave){ const k=1+0.18*(wave-1); const foes=DEFS.filter(d=>d.team==='foe'); const list=foes.slice();
  if(wave%2===0&&list.length<4)list.push(Object.assign({},foes[0],{name:'Renfort',gx:5,gz:0}));
  for(const d of list){ const cell=freeNear(d.gx,d.gz); if(!cell)continue; createUnit(Object.assign({},d,{gx:cell.gx,gz:cell.gz,hp:Math.round(d.hp*k),str:Math.round(d.str*k),mag:Math.round(d.mag*k),end:Math.round(d.end*k)})); } }
function startNextWave(){ G.wave++;
  for(const u of G.units.filter(x=>x.team==='foe')) removeUnit(u);
  for(const u of G.units.filter(x=>x.team==='player')){
    if(!u.alive){ const cur=u.cell(); if(!cur||(cur.occupant&&cur.occupant!==u)){ const f=(G.deployZone||[]).find(z=>!z.occupant); if(f){ u.gx=f.gx; u.gz=f.gz; } } reviveUnit(u,u.maxhp); }
    else u.hp=u.maxhp;
    u.statuses={}; u.ap=0; u._taunter=null; u.mat.color.set('#ffffff'); u.mat.opacity=1; resetUnitSpriteScale(u); u.spr.rotation.z=0; u.blob.material.opacity=COMBAT_PRESENTATION.units.shadowOpacity; if(u.teamRing)u.teamRing.material.opacity=COMBAT_PRESENTATION.units.teamRingOpacity;
    placeUnit(u,u.gx,u.gz,true); refreshPanel(u); }
  spawnWave(G.wave); G.over=false; G.round=0; G.mode='idle'; logMsg('— Vague '+G.wave+' approche ! —'); startRound(); }
function resultRowsHTML(){ const rows=G.deployedUnits.map(u=>'<li class="combat-result__unit '+(u.alive?'':'is-ko')+'"><span>'+escHTML(u.name)+'</span><b>'+(u.alive?'Debout':'K.O.')+'</b></li>').join('');
  return rows||'<li class="combat-result__unit"><span>Escouade</span><b>—</b></li>'; }
function combatRewardText(rewards){
  if(!rewards)return '';
  const parts=[];
  if(rewards.gold)parts.push('+'+rewards.gold+' or');
  const gems=rewards.materials&&rewards.materials.red_gem||0;
  if(gems)parts.push('+'+gems+' gemme'+(gems>1?'s':''));
  if(rewards.reputation)parts.push((rewards.reputation>0?'+':'')+rewards.reputation+' réputation');
  return parts.join(' · ');
}
function showCombatResult(tone,title,subtitle,buttonLabel,onClick,meta){
  dom.banner.className='combat-result-overlay combat-result-overlay--'+tone;
  dom.banner.innerHTML='<section class="combat-result-card panel" role="dialog" aria-modal="true" aria-label="'+escHTML(title)+'">'+
    '<p class="combat-result__kicker">'+(tone==='victory'?'Chronique victorieuse':'Route brisée')+'</p>'+
    '<h1 class="pixel">'+escHTML(title)+'</h1>'+
    '<p class="combat-result__subtitle">'+escHTML(subtitle)+'</p>'+
    (meta?'<div class="combat-result__meta">'+meta+'</div>':'')+
    '<ul class="combat-result__squad">'+resultRowsHTML()+'</ul>'+
    '<button class="btn combat-result__button" id="combat-result-action" type="button">'+escHTML(buttonLabel)+'</button>'+
    '</section>';
  byId('combat-result-action').onclick=onClick;
}
function winWave(){ if(G.over)return; G.over=true; G.mode='over'; closeMenus(); clearHL(); if(selRing)selRing.visible=false; if(faceArrow)faceArrow.visible=false;
  logMsg('— Vague '+G.wave+' vaincue ! —');
  if(CAMPAIGN_MODE){
    const reward=COMBAT_REWARD_TEXT?'<span>Butin de combat</span><b>'+escHTML(COMBAT_REWARD_TEXT)+'</b>':'';
    showCombatResult('victory','Victoire',COMBAT_LABEL,'Continuer la chronique',()=>notifyCampaignResult(true),'<span>Objectif sécurisé</span><b>'+escHTML(COMBAT_OBJECTIVE)+'</b>'+reward);
  } else {
    showCombatResult('victory','Vague '+G.wave+' vaincue','La formation tient encore la ligne.','Vague '+(G.wave+1)+' ▶',()=>{ dom.banner.className='hidden'; startNextWave(); },'<span>Mode escarmouche</span><b>Renforts imminents</b>');
  } }
function endGame(win){ if(G.over)return; G.over=true; G.mode='over'; closeMenus(); clearHL(); if(selRing)selRing.visible=false; if(faceArrow)faceArrow.visible=false;
  showCombatResult(win?'victory':'defeat',win?'Victoire':'Défaite',win?'Élyndra est sauvée !':'Votre équipe a été vaincue…',CAMPAIGN_MODE?'Revenir à la carte':'Rejouer',()=>CAMPAIGN_MODE?notifyCampaignResult(Boolean(win)):location.reload(),win?'<span>Issue</span><b>Combat terminé</b>':'<span>Checkpoint</span><b>Retour au dernier refuge</b>');
  logMsg(win?'— VICTOIRE —':'— DÉFAITE —'); }

// ============================= RENDER LOOP =============================
let _last=performance.now(), _t=0;
function animate(){ requestAnimationFrame(animate);
  const now=performance.now(); const dt=Math.min(0.05,(now-_last)/1000); _last=now; _t+=dt;
  updateTweens(dt); if(G.shake)G.shake.t+=dt; applyCam();
  for(const u of G.units){ const dx=camera.position.x-u.grp.position.x, dz=camera.position.z-u.grp.position.z; u.spr.rotation.y=Math.atan2(dx,dz); if(u.outline){ u.outline.rotation.y=u.spr.rotation.y; u.outline.material.opacity=Math.max(0.16,u.mat.opacity*0.44); }
    if(u.teamRing){ const isActive=u===G.active&&!G.stage&&!G.over,isHover=G.hoverUnit===u,isTarget=G.mode==='target'&&G.pending&&G.pending.keys.has(cellKey(u.gx,u.gz))&&G.active&&u.team!==G.active.team; u.teamRing.material.opacity=Math.min(1,COMBAT_PRESENTATION.units.teamRingOpacity*(isActive?1.16:(isTarget?1.12:(isHover?1.08:0.94)))); if(u.teamRingUnder)u.teamRingUnder.material.opacity=isActive ? .68 : (isTarget ? .64 : (isHover ? .6 : .5)); if(u.teamGlow)u.teamGlow.material.opacity=isActive ? .28 : (isTarget ? .25 : (isHover ? .22 : (u.team==='player' ? .15 : .17))); }
    if(u.alive&&(u.boss||u.elite)&&u.ap>=3&&u._ultCooldown<=1){ const p=0.5+0.5*Math.sin(_t*6); u.teamRing.material.color.setRGB(1,0.373-0.248*p,0.322-0.197*p); if(u.teamGlow){ u.teamGlow.material.color.setRGB(1,0.373-0.248*p,0.322-0.197*p); u.teamGlow.material.opacity=0.17+0.15*p; } }
    else if((u.boss||u.elite)&&u.teamRing){ u.teamRing.material.color.setHex(0xff5f52); if(u.teamGlow)u.teamGlow.material.color.setHex(0xff5f52); }
    if(u.alive) u.spr.position.y=u.baseY+(u===G.active?Math.sin(_t*3.2)*0.05:0); }
  Grade.uniforms.time.value=_t*1000;
  for(const m of G_timeMats) if(m.uniforms&&m.uniforms.t) m.uniforms.t.value=_t;
  if(G.dust){ G.dust.mesh.visible=!REDUCED_GRAPHICS; const p=G.dust.mesh.geometry.attributes.position; for(let i=0;i<G.dust.N;i++){ let y=p.getY(i)+G.dust.spd[i]*dt; if(y>7.5)y=0.3; p.setY(i,y); p.setX(i,p.getX(i)+Math.sin(_t+i)*0.0016); } p.needsUpdate=true; }
  if(G.environment)G.environment.update(_t,dt,REDUCED_GRAPHICS);
  if(G.backgroundLayers)G.backgroundLayers.update(dt,camera,REDUCED_GRAPHICS);
  if(G.groundCover){
    const tactical=G.mode==='move'||G.mode==='target';
    G.groundCover.material.opacity=REDUCED_GRAPHICS ? .18 : (tactical ? COMBAT_PRESENTATION.arena.groundCoverOpacityTactical : (G.mode==='deploy' ? COMBAT_PRESENTATION.arena.groundCoverOpacityDeploy : COMBAT_PRESENTATION.arena.groundCoverOpacityIdle));
    G.groundCover.visible=!G.stage;
  }
  if(G.gridLines){
    const tactical=G.mode==='deploy'||G.mode==='move'||G.mode==='target',selected=G.active&&(G.mode==='menu'||G.mode==='idle');
    const gridOp=G.stage ? COMBAT_PRESENTATION.arena.gridOpacityStage : (tactical ? COMBAT_PRESENTATION.arena.gridOpacityTactical : (selected ? COMBAT_PRESENTATION.arena.gridOpacitySelected : COMBAT_PRESENTATION.arena.gridOpacityIdle));
    G.gridLines.material.opacity=Math.min(.24,gridOp*.34);
    if(G.gridBandUnderMaterial)G.gridBandUnderMaterial.opacity=G.stage ? .16 : (tactical ? .66 : (selected ? .52 : .38));
    if(G.gridBandCoreMaterial)G.gridBandCoreMaterial.opacity=G.stage ? .2 : (tactical ? .94 : (selected ? .8 : .64));
    if(G.gridBandGlowMaterial)G.gridBandGlowMaterial.opacity=G.stage ? .04 : (tactical ? .26 : (selected ? .18 : .12));
    if(G.gridKnotMaterial)G.gridKnotMaterial.opacity=G.stage ? .12 : (tactical ? .72 : (selected ? .58 : .44));
  }
  if(hlMeshes.length){ for(const m of hlMeshes){ if(REDUCED_GRAPHICS){ m.material.opacity=m.userData.baseOp||0.28; } else { const p=m.userData.pulse||0.08,k=1-p+p*Math.sin(_t*4.2); m.material.opacity=(m.userData.baseOp||0.28)*k; } } }
  if(G.rays){ for(const r of G.rays){ if(r.map)r.map.offset.x=(r.map.offset.x+r.spd*dt)%1; r.mat.opacity=REDUCED_GRAPHICS?0:Math.max(0,r.base+Math.sin(_t*r.pulse+r.ph)*r.amp); } }
  updateSelectors();
  composer.render();
  window.__COMBAT_DIAGNOSTICS={
    drawCalls:renderer.info.render.calls,
    triangles:renderer.info.render.triangles,
    geometries:renderer.info.memory.geometries,
    textures:renderer.info.memory.textures,
    reducedGraphics:REDUCED_GRAPHICS,
    units:G.units.length,
    grid:{width:CFG.W,depth:CFG.D,walkable:G.grid.flat().filter(c=>c&&c.walkable).length,blocked:G.grid.flat().filter(c=>c&&!c.walkable).length},
  };
}

// ============================= DEPLOYMENT =============================
function inZone(gx,gz){ return G.deployZone.some(z=>z.gx===gx&&z.gz===gz); }
function computeDeployZone(){ G.deployZone=[]; for(let gx=0;gx<=1;gx++)for(let gz=0;gz<CFG.D;gz++){ const c=cellAt(gx,gz); if(c&&c.walkable)G.deployZone.push(c); } }
function overviewCam(){ killTweens(cam); tween(cam,{tx:0,ty:COMBAT_PRESENTATION.camera.targetY,tz:0,dist:COMBAT_PRESENTATION.camera.overviewDistance,height:COMBAT_PRESENTATION.camera.overviewHeight},0.6,easeInOut); }
function drawDeployZone(){ clearHL(); const keys=new Set(G.deployZone.map(c=>cellKey(c.gx,c.gz))); addInvalidTiles(keys,false); for(const c of G.deployZone){ if(c.occupant){ addHL(c.gx,c.gz,CFG.COL.ally,COMBAT_PRESENTATION.arena.deployTileOpacity*.5,'range'); continue; } addHL(c.gx,c.gz,CFG.COL.move,COMBAT_PRESENTATION.arena.deployTileOpacity,'move'); } }
function playerDefinitions(){
  if(CAMPAIGN_MODE&&CAMPAIGN_SQUAD.length) return orderDeploymentCandidates(CAMPAIGN_SQUAD.map(campaignDef),PREFERRED_UNIT_IDS);
  return DEFS.filter(d=>d.team==='player').map((d,index)=>Object.assign({id:'standalone-'+index},d));
}
function removeUnit(u){ if(u.size>1)clearBossCells(u); else { const c=u.cell&&u.cell(); if(c&&c.occupant===u)c.occupant=null; } if(u.grp)scene.remove(u.grp); const i=G.units.indexOf(u); if(i>=0)G.units.splice(i,1); const d=G.deployedUnits.indexOf(u); if(d>=0)G.deployedUnits.splice(d,1); }
function deployDefById(id){ return G.rosterDefs.find(d=>(d.campaignId||d.name)===id); }
function deployedById(id){ return G.deployedUnits.find(u=>(u.campaignId||u.name)===id); }
function deployedIds(){ return new Set(G.deployedUnits.map(u=>u.campaignId||u.name)); }
function deployUnit(gx,gz,id=G.selectedDeployId){
  const def=deployDefById(id); if(!def)return null;
  const previous=deployedById(id);
  if(previous){ placeUnit(previous,gx,gz,true); return previous; }
  if(G.deployedUnits.length>=MAX_PLAYER_UNITS){ toast('Limite de '+MAX_PLAYER_UNITS+' unités atteinte'); return null; }
  const u=createUnit(Object.assign({},def,{gx,gz})); G.deployedUnits.push(u); return u;
}
function resetDeploy(){
  for(const u of G.deployedUnits.slice())removeUnit(u);
  G.selectedDeployId=null; dom.panel.classList.add('hidden','deploy-preview');
  drawDeployZone(); openDeployMenu(); setHint('Déploiement — choisissez une unité puis une case disponible');
}
function autoDeploy(){
  for(const u of G.deployedUnits.slice())removeUnit(u);
  const preferred=PREFERRED_UNIT_IDS.map(deployDefById).filter(Boolean);
  const rest=G.rosterDefs.filter(d=>!preferred.includes(d));
  const picks=[...preferred,...rest].slice(0,MAX_PLAYER_UNITS);
  const formation=[[0,0],[0,3],[1,1],[1,2]].map(([gx,gz])=>cellAt(gx,gz)).filter(Boolean);
  for(const def of picks){ const c=formation.find(z=>!z.occupant)||G.deployZone.find(z=>!z.occupant); if(!c)break; deployUnit(c.gx,c.gz,def.campaignId||def.name); }
  drawDeployZone(); openDeployMenu(); setHint(G.deployedUnits.length+' / '+MAX_PLAYER_UNITS+' unités prêtes');
}
function beginBattle(){ if(!canStartDeployment(G.deployedUnits.length,MAX_PLAYER_UNITS))return; G.mode='idle'; dom.menu.classList.remove('deploy-roster'); dom.panel.classList.remove('deploy-preview'); clearHL(); closeMenus(); refreshTurnbar(); startRound(); }
function deploymentCard(def){
  const id=def.campaignId||def.name,active=G.selectedDeployId===id,deployed=deployedIds().has(id);
  const portrait=def.portrait?'<img src="'+uiPortraitFor(def.portrait)+'" alt="">':'<span class="deploy-avatar">'+def.name.charAt(0)+'</span>';
  return '<button type="button" class="deploy-card '+(active?'is-selected ':'')+(deployed?'is-deployed':'')+'" data-unit="'+id+'">'+
    portrait+'<span><b>'+def.name+'</b><small>'+escHTML(def.className||def.name||'')+'</small></span>'+
    '<i>'+(deployed?'EN JEU':'+')+'</i></button>';
}
function openDeployMenu(){
  renderObjective(); dom.menu.classList.remove('hidden'); dom.menu.classList.add('deploy-roster'); dom.skillmenu.classList.add('hidden');
  const size=4,pages=Math.max(1,Math.ceil(G.rosterDefs.length/size)); G.deployPage=cl(G.deployPage,0,pages-1);
  const visible=G.rosterDefs.slice(G.deployPage*size,G.deployPage*size+size);
  dom.menu.innerHTML='<div class="deploy-head"><span>DÉPLOIEMENT</span><b>'+G.deployedUnits.length+' / '+MAX_PLAYER_UNITS+'</b></div>'+
    '<div class="deploy-list">'+visible.map(deploymentCard).join('')+'</div>'+
    '<div class="deploy-pages"><button data-d="prev" '+(G.deployPage===0?'disabled':'')+'>‹</button><span>'+(G.deployPage+1)+' / '+pages+'</span><button data-d="next" '+(G.deployPage>=pages-1?'disabled':'')+'>›</button></div>'+
    '<div class="deploy-actions"><button data-d="auto">Auto</button><button data-d="reset" '+(!G.deployedUnits.length?'disabled':'')+'>Retirer tout</button>'+
    '<button class="deploy-start" data-d="start" '+(!G.deployedUnits.length?'disabled':'')+'>Lancer le combat</button></div>';
  dom.menu.querySelectorAll('[data-unit]').forEach(b=>b.onclick=()=>{ G.selectedDeployId=b.dataset.unit; openDeployMenu(); const d=deployDefById(G.selectedDeployId); if(d)selectUnitData(d); setHint('Placez « '+(d?.name||'unité')+' » sur une case disponible'); });
  dom.menu.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>onDeploy(b.dataset.d,b));
}
function renderDefinitionPanel(def){ const key=def.campaignId||def.name; if(statsPanelKey!==key){statsPanelKey=key;statsPanelExpanded=false;} const preview=Object.assign({statuses:{}},def),portrait=uiPortraitFor(preview.portrait)||(SPR[preview.kind]&&SPR[preview.kind].portrait?SPR[preview.kind].portrait:''),hp=preview.hp||preview.maxhp||0; dom.panel.dataset.team='player'; dom.panel.classList.remove('hidden'); dom.panel.innerHTML='<div class="details-unit"><div class="du-top"><div class="du-portrait">'+(portrait?'<img src="'+portrait+'" alt="">':'<span>'+escHTML(preview.name.charAt(0))+'</span>')+'</div><div class="du-id"><div class="du-head"><span>'+escHTML(preview.className||preview.name||'')+'</span></div><div class="nm">'+escHTML(preview.name)+'</div></div><div class="du-team"><b class="team-badge">Déploiement</b></div></div><div class="du-hp"><div class="unit-row"><span>PV</span><b>'+hp+'</b></div><div class="bar"><i style="width:100%"></i><span>'+hp+' PV</span></div></div>'+statsDetailsHTML(preview)+'</div>'; const button=dom.panel.querySelector('.stats-toggle'); if(button)button.onclick=()=>{statsPanelExpanded=!statsPanelExpanded;renderDefinitionPanel(def);}; }
function selectUnitData(def){ dom.panel.classList.add('deploy-preview'); const preview=deployedById(def.campaignId||def.name); if(preview)selectUnit(preview); else renderDefinitionPanel(def); }
function onDeploy(a,b){ if(b.disabled)return; if(a==='auto')autoDeploy(); else if(a==='reset')resetDeploy(); else if(a==='start')beginBattle(); else if(a==='prev'){G.deployPage--;openDeployMenu();}else if(a==='next'){G.deployPage++;openDeployMenu();} }
function startDeployment(){
  G.mode='deploy'; G.deployedUnits=[]; G.rosterDefs=playerDefinitions(); G.deployPage=0;
  G.selectedDeployId=null;
  computeDeployZone(); overviewCam(); drawDeployZone(); dom.help.classList.remove('hidden'); dom.panel.classList.add('hidden','deploy-preview');
  setHint('Déploiement — choisissez une unité puis une case disponible'); openDeployMenu();
}

// ============================= TUTORIAL =============================
let TUTORIAL_SEEN=false;
try{ TUTORIAL_SEEN=localStorage.getItem('rpg-tutorial-seen')==='1'; }catch(e){}
let tutorialPage=0;
const TUTORIAL_PAGES=4;

function buildTutorialDots(){
  if(!dom.tutorial)return;
  const dots=dom.tutorial.querySelector('.tutorial-dots');
  if(!dots)return;
  dots.innerHTML='';
  for(let i=0;i<TUTORIAL_PAGES;i++){
    const d=document.createElement('div');
    d.className='tutorial-dot'+(i===tutorialPage?' active':'');
    dots.appendChild(d);
  }
}
function tutGoTo(idx){
  if(!dom.tutorial)return;
  tutorialPage=idx;
  dom.tutorial.querySelectorAll('.tutorial-page').forEach(p=>p.classList.toggle('active',+p.dataset.page===idx));
  buildTutorialDots();
  const nextBtn=dom.tutorial.querySelector('[data-action="next"]');
  const startBtn=dom.tutorial.querySelector('[data-action="start"]');
  if(nextBtn)nextBtn.classList.toggle('hidden',idx>=TUTORIAL_PAGES-1);
  if(startBtn)startBtn.classList.toggle('hidden',idx<TUTORIAL_PAGES-1);
}
function closeTutorial(){
  if(!dom.tutorial)return;
  dom.tutorial.classList.add('hidden');
  try{ localStorage.setItem('rpg-tutorial-seen','1'); }catch(e){}
  if(bossTutorialQueued){
    bossTutorialQueued=false;
    dom.bossTutorial.classList.remove('hidden');
    dom.bossTutorial.querySelector('[data-action="start"]')?.addEventListener('click',closeBossTutorial);
  }
}
function showTutorial(){
  if(!dom.tutorial||TUTORIAL_SEEN)return;
  dom.tutorial.classList.remove('hidden');
  tutGoTo(0);
  dom.tutorial.querySelector('[data-action="next"]')?.addEventListener('click',()=>{
    if(tutorialPage<TUTORIAL_PAGES-1)tutGoTo(tutorialPage+1);
  });
  dom.tutorial.querySelector('[data-action="skip"]')?.addEventListener('click',closeTutorial);
  dom.tutorial.querySelector('[data-action="start"]')?.addEventListener('click',closeTutorial);
}

let BOSS_TUTORIAL_SEEN=false;
try{ BOSS_TUTORIAL_SEEN=localStorage.getItem('rpg-boss-tutorial-seen')==='1'; }catch(e){}
let bossTutorialQueued=false;
function closeBossTutorial(){
  if(!dom.bossTutorial)return;
  dom.bossTutorial.classList.add('hidden');
  try{ localStorage.setItem('rpg-boss-tutorial-seen','1'); }catch(e){}
}
function showBossTutorial(){
  if(!dom.bossTutorial||BOSS_TUTORIAL_SEEN)return;
  const isElite=ENCOUNTER_ENEMY_VISUAL_IDS.some(id=>VISUAL_UNIT_TEMPLATES[id]?.elite);
  if(!IS_BOSS_COMBAT&&!isElite)return;
  if(!dom.tutorial||dom.tutorial.classList.contains('hidden')){
    dom.bossTutorial.classList.remove('hidden');
    dom.bossTutorial.querySelector('[data-action="start"]')?.addEventListener('click',closeBossTutorial);
  } else {
    bossTutorialQueued=true;
  }
}

// ============================= DEVELOPMENT QA =============================
function qaPrepareCombat(){
  if(G.mode!=='deploy')return;
  autoDeploy();
  beginBattle();
}
function mountQaControls(){
  if(!QA_ENABLED||byId('qa-combat-controls'))return;
  const controls=document.createElement('aside');
  controls.id='qa-combat-controls';
  controls.setAttribute('aria-label','Outils QA de combat');
  controls.innerHTML='<b>QA combat</b><span>Session isolée</span><div><button type="button" data-qa="prepare">Auto-déployer</button><button type="button" data-qa="victory">Victoire</button><button type="button" data-qa="defeat">Défaite</button></div>';
  controls.querySelector('[data-qa="prepare"]').onclick=()=>qaPrepareCombat();
  controls.querySelector('[data-qa="victory"]').onclick=()=>{ if(!G.over){ qaPrepareCombat(); winWave(); } };
  controls.querySelector('[data-qa="defeat"]').onclick=()=>{ if(!G.over){ qaPrepareCombat(); endGame(false); } };
  document.body.appendChild(controls);
}

// ============================= INIT & BOOT =============================
async function initGame(){
  G.inv=CAMPAIGN_MODE?{...CAMPAIGN_INVENTORY}:{potion:3,ether:1,antidote:2,bomb:2}; G.wave=1; G.round=0; G.over=false;
  await buildWorld(); makeBlobTex(); makeBaseTex(); makeTileTex(); buildSelectors(); buildCursor(); spawnUnits();
  initHud();
  logMsg(CAMPAIGN_MODE?COMBAT_OBJECTIVE:'Préparez votre formation, puis lancez la bataille.');
  startDeployment();
  mountQaControls();
  showTutorial();
  showBossTutorial();
}

function vfxWorkbenchContext(targetMode){
  const source=(G.active&&G.active.alive?G.active:null)||aliveUnits('player')[0]||aliveUnits()[0];
  if(!source)return null;
  let target=null;
  if(targetMode==='active')target=source;
  else if(targetMode==='hovered')target=G.hoverUnit&&G.hoverUnit.alive?G.hoverUnit:null;
  else target=(G.hoverUnit&&G.hoverUnit.alive?G.hoverUnit:null)||aliveUnits(source.team==='player'?'foe':'player')[0]||source;
  if(!target)return null;
  const tx=target.size>1?bossCenterGX(target):target.gx, tz=target.size>1?bossCenterGZ(target):target.gz;
  return makeActionVfxContext(source,[target],tx,tz);
}

async function main(){ document.body.classList.toggle('reduced-graphics',REDUCED_GRAPHICS); buildSprites(); await preloadExternalSprites(); await initGame(); bindInput(); installVfxWorkbench({system:combatVfxSystem,getContext:vfxWorkbenchContext}); bloom.enabled=!REDUCED_GRAPHICS; tiltPass.enabled=!REDUCED_GRAPHICS; animate(); dom.loading.style.display='none'; }

window.addEventListener('error',()=>{ if(dom.loading&&dom.loading.style.display!=='none') dom.loading.innerHTML='<div style="color:#ff8a7a;max-width:540px;text-align:center;line-height:26px">Échec du chargement de Three.js.<br>Vérifiez votre connexion internet puis rechargez la page.<br><span style="color:#9fb0d0">La page doit être servie via un serveur local (http://), pas ouverte directement depuis le disque.</span></div>'; });
window.addEventListener('unhandledrejection',e=>console.error(e.reason));
function bootCampaign(message){
  COMBAT_ID=message.config.id; COMBAT_SCENE_ID=message.config.sceneId||'forest_route'; COMBAT_OBJECTIVE=message.config.objective; COMBAT_LABEL=message.config.encounterLabel;
  COMBAT_REWARD_TEXT=combatRewardText(message.config.rewards);
  MAX_PLAYER_UNITS=normalizeDeploymentLimit(message.config.maxPlayerUnits); CAMPAIGN_SQUAD=message.clan; CAMPAIGN_INVENTORY=message.inventory;
  PREFERRED_UNIT_IDS=message.preferredUnitIds; REDUCED_GRAPHICS=message.reducedGraphics;
  QA_ENABLED=campaignParams.get('qa')==='1'&&message.devQa===true;
  IS_BOSS_COMBAT=!!message.config.isBoss; BOSS_SPAWNED=false;
  ENCOUNTER_ENEMY_VISUAL_IDS=Array.isArray(message.config.enemyVisualIds)?message.config.enemyVisualIds:[];
  ENCOUNTER_BOSS_VISUAL_ID=message.config.bossVisualId||'';
  ENCOUNTER_ESCORT_VISUAL_IDS=Array.isArray(message.config.escortVisualIds)?message.config.escortVisualIds:[];
  main().then(()=>{ window.__BOOTED=true; }).catch(err=>{ console.error(err); dom.loading.innerHTML='<div style="color:#ff8a7a">Erreur : '+(err&&err.message||err)+'</div>'; });
}
if(CAMPAIGN_MODE){
  addEventListener('message',event=>{ if(event.source!==window.parent||event.origin!==location.origin)return; const parsed=combatInitializeMessageSchema.safeParse(event.data); if(parsed.success&&!window.__BOOTED)bootCampaign(parsed.data); });
  window.parent.postMessage({type:'rpg-threejs:combat-ready'},location.origin);
}else main().then(()=>{ window.__BOOTED=true; }).catch(err=>{ console.error(err); dom.loading.innerHTML='<div style="color:#ff8a7a">Erreur : '+(err&&err.message||err)+'</div>'; });

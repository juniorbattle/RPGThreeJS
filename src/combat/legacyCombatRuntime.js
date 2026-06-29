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
import { forestCombatBackground } from '../render/combatBackgrounds';
import { COMBAT_PRESENTATION } from './combatPresentationConfig.js';

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
  fx:byId('fx'), banner:byId('banner'), loading:byId('loading') };
const campaignParams=new URLSearchParams(location.search);
const CAMPAIGN_MODE=campaignParams.get('campaign')==='1'&&window.parent!==window;
let COMBAT_ID='standalone';
let COMBAT_OBJECTIVE='Vaincre tous les ennemis.';
let COMBAT_LABEL='Combat tactique';
let MAX_PLAYER_UNITS=4;
let CAMPAIGN_SQUAD=[];
let CAMPAIGN_INVENTORY={};
let PREFERRED_UNIT_IDS=[];
let REDUCED_GRAPHICS=campaignParams.get('reduced')==='1';
const notifyCampaignResult=victory=>window.parent.postMessage({
  type:'rpg-threejs:combat-result',victory,combatId:COMBAT_ID,inventory:G.inv,
  participants:G.deployedUnits.map(u=>u.campaignId||u.name)
},location.origin);

// ============================= GAME STATE =============================
const G = {
  units:[], tilesMesh:[], grid:[], order:[], turnIdx:0, round:1,
  mode:'idle', active:null, selected:null, pinnedUnit:null, hover:null, hoverUnit:null,
  movedThisTurn:false, actedThisTurn:false, pending:null, busy:false, over:false, inv:{},
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
  darkmage:{skin:'#caa6c2',hair:'#150f24',c1:'#3a2a60',c2:'#221842',acc:'#b06aff',metal:'#c79bff',wpn:'staff',head:'darkhood'}
};
const SPR={};
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
  await G.backgroundLayers.load(forestCombatBackground);
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
  x.shadowColor='rgba(12,8,3,.48)'; x.shadowBlur=0; x.lineWidth=lw+2.4; x.strokeStyle='rgba(14,10,5,.52)'; rr(pad+1,pad+1,w-2,w-2,r-1); x.stroke();
  x.shadowColor=glowA; x.shadowBlur=8; x.lineWidth=lw; x.strokeStyle=strokeA; rr(pad+2,pad+2,w-4,w-4,r-2); x.stroke();
  x.shadowBlur=0; x.lineWidth=Math.max(1.2,lw-.1); x.strokeStyle=strokeB; rr(pad+6,pad+6,w-12,w-12,r-5); x.stroke();
  x.lineWidth=1.8; x.strokeStyle=cornerA;
  const corners=[[pad+7,pad+7,1,1],[pad+w-7,pad+7,-1,1],[pad+7,pad+w-7,1,-1],[pad+w-7,pad+w-7,-1,-1]];
  for(const [cx,cy,sx,sy] of corners){ x.beginPath(); x.moveTo(cx,cy+sy*cornerLen); x.lineTo(cx,cy); x.lineTo(cx+sx*cornerLen,cy); x.stroke(); }
  const t=new THREE.CanvasTexture(c); t.anisotropy=4; t.needsUpdate=true; return t; }
function makeTileTex(){ hlTextures={
  range:buildTileTex('rgba(255,246,218,0.3)','rgba(186,177,128,0.14)','rgba(255,239,174,1)','rgba(97,92,61,0.92)','rgba(255,235,164,1)','rgba(226,211,146,0.82)',2.95,23),
  move:buildTileTex('rgba(214,246,232,0.42)','rgba(93,178,157,0.22)','rgba(230,255,242,1)','rgba(48,116,112,0.98)','rgba(240,255,236,1)','rgba(136,235,205,0.9)',3.15,25),
  hover:buildTileTex('rgba(255,250,220,0.46)','rgba(221,207,145,0.25)','rgba(255,247,190,1)','rgba(92,83,46,1)','rgba(255,250,196,1)','rgba(245,223,150,0.94)',3.25,26),
  target:buildTileTex('rgba(255,204,162,0.54)','rgba(198,66,58,0.3)','rgba(255,226,172,1)','rgba(118,32,28,1)','rgba(255,202,132,1)','rgba(255,126,92,0.98)',3.35,26),
  invalid:buildTileTex('rgba(160,156,122,0.15)','rgba(94,98,83,0.07)','rgba(186,186,148,0.78)','rgba(63,68,54,0.66)','rgba(176,176,132,0.7)','rgba(130,130,104,0.26)',1.9,15)
}; hlTex=hlTextures.range; }
function clearHL(){ for(const m of hlMeshes){ hlGroup.remove(m); m.material.dispose(); } hlMeshes.length=0; }
function addHL(gx,gz,color,op=0.45,kind='range'){ const c=cellAt(gx,gz); if(!c)return; const boost=kind==='move'||kind==='hover'||kind==='target'?1.22:(kind==='invalid'?1.08:1.14),finalOp=Math.min(1,op*boost);
  const m=new THREE.Mesh(hlGeo,new THREE.MeshBasicMaterial({map:hlTextures[kind]||hlTex,color,transparent:true,opacity:finalOp,depthWrite:false,depthTest:false,side:THREE.DoubleSide,blending:THREE.NormalBlending,fog:false,toneMapped:false}));
  m.rotation.x=-Math.PI/2; m.position.set(wX(gx),c.topY+0.068,wZ(gz)); m.renderOrder=8; m.userData.baseOp=finalOp; m.userData.pulse=kind==='target'||kind==='hover'?0.018:(kind==='invalid'?0.006:0.012); hlGroup.add(m); hlMeshes.push(m); return m; }
function addRingHL(gx,gz,color,op=0.62){ const c=cellAt(gx,gz); if(!c)return;
  const u=new THREE.Mesh(targetRingGeo,new THREE.MeshBasicMaterial({color:0x0a0603,transparent:true,opacity:Math.min(.72,op*.72),depthWrite:false,depthTest:false,side:THREE.DoubleSide,blending:THREE.NormalBlending,fog:false,toneMapped:false}));
  u.rotation.x=-Math.PI/2; u.position.set(wX(gx),c.topY+0.092,wZ(gz)); u.renderOrder=8.9; u.userData.baseOp=Math.min(.72,op*.72); u.userData.pulse=0.026; hlGroup.add(u); hlMeshes.push(u);
  const m=new THREE.Mesh(targetRingGeo,new THREE.MeshBasicMaterial({color,transparent:true,opacity:Math.min(1,op*1.08),depthWrite:false,depthTest:false,side:THREE.DoubleSide,blending:THREE.NormalBlending,fog:false,toneMapped:false}));
  m.rotation.x=-Math.PI/2; m.position.set(wX(gx),c.topY+0.098,wZ(gz)); m.renderOrder=9; m.userData.baseOp=Math.min(1,op*1.08); m.userData.pulse=0.04; hlGroup.add(m); hlMeshes.push(m); return m; }
function cellKey(gx,gz){ return gx+','+gz; }
function addInvalidTiles(valid,skipActive=false){ for(let gx=0;gx<CFG.W;gx++)for(let gz=0;gz<CFG.D;gz++){ if(valid.has(cellKey(gx,gz)))continue; if(skipActive&&G.active&&G.active.gx===gx&&G.active.gz===gz)continue; addHL(gx,gz,0x7d8066,COMBAT_PRESENTATION.arena.invalidTileOpacity,'invalid'); } }

// cursor ring
let cursorMesh=null,cursorUnderMesh=null;
function buildCursor(){ const ug=new THREE.RingGeometry(0.34,0.54,72),g=new THREE.RingGeometry(0.39,0.5,72); cursorUnderMesh=new THREE.Mesh(ug,new THREE.MeshBasicMaterial({color:0x080604,transparent:true,opacity:.62,side:THREE.DoubleSide,depthWrite:false,fog:false,toneMapped:false})); cursorUnderMesh.rotation.x=-Math.PI/2; cursorUnderMesh.visible=false; scene.add(cursorUnderMesh); cursorMesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xfff0c8,transparent:true,opacity:.96,side:THREE.DoubleSide,depthWrite:false,fog:false,toneMapped:false})); cursorMesh.rotation.x=-Math.PI/2; cursorMesh.visible=false; scene.add(cursorMesh); }
function hoverState(c){ if(!c)return'invalid'; if(G.mode==='deploy')return G.deployZone&&G.deployZone.some(z=>z.gx===c.gx&&z.gz===c.gz)?'move':'invalid'; if(G.mode==='move')return G.reach&&G.reach.list.some(t=>t.gx===c.gx&&t.gz===c.gz)&&!(G.active&&G.active.gx===c.gx&&G.active.gz===c.gz)?'move':'invalid'; if(G.mode==='target'){ if(!G.pending||!G.pending.keys.has(cellKey(c.gx,c.gz)))return'invalid'; const occ=c.occupant; return occ&&G.active&&occ.team!==G.active.team?'target':'hover'; } return c.occupant&&G.active&&c.occupant.team!==G.active.team?'target':'hover'; }
function moveCursor(gx,gz){ const c=cellAt(gx,gz); if(!c){cursorMesh.visible=false;if(cursorUnderMesh)cursorUnderMesh.visible=false;return;} const st=hoverState(c),col=st==='target'?0xff7364:(st==='move'?0x82dfff:(st==='invalid'?0xb7ad83:0xfff0c8)),op=st==='invalid' ? COMBAT_PRESENTATION.arena.invalidTileOpacity+.2 : (st==='target' ? 1 : .95),sc=st==='target'?1.26:(st==='invalid'?1:1.12); cursorMesh.visible=true; cursorMesh.material.color.setHex(col); cursorMesh.material.opacity=op; cursorMesh.scale.setScalar(sc); cursorMesh.position.set(wX(gx),c.topY+0.06,wZ(gz)); if(cursorUnderMesh){cursorUnderMesh.visible=true; cursorUnderMesh.material.opacity=st==='invalid' ? .46 : .66; cursorUnderMesh.scale.setScalar(sc); cursorUnderMesh.position.copy(cursorMesh.position);} }

// ============================= SKILLS =============================
const SKILLS={
  whirl:{name:'Coup Tournoyant',ap:2,type:'phys',power:9,range:[0,0],radius:1,self:true,offensive:true,acc:0.95,desc:'Frappe les unités autour du lanceur, sans toucher le lanceur.'},
  bulwark:{name:'Rempart',ap:2,type:'buff',power:0,range:[0,0],radius:1.3,self:true,support:true,status:'barrier',statusTurns:3,desc:'Barrière : +END aux alliés proches (3 tours).'},
  provoke:{name:'Provocation',ap:1,type:'debuff',power:0,range:[1,2],radius:1.2,offensive:true,acc:1,status:'taunt',statusTurns:2,desc:'Force les ennemis proches à vous cibler (2 tours).'},
  weaken:{name:'Flèche Affaiblissante',ap:1,type:'phys',power:7,range:[2,3],radius:0,offensive:true,acc:0.9,status:'slow',statusTurns:2,desc:'Tir unique + Ralentissement.'},
  blind_shot:{name:'Tir Aveuglant',ap:2,type:'phys',power:6,range:[2,4],radius:0,offensive:true,acc:0.9,status:'blind',statusTurns:3,desc:'Tir qui réduit la précision (3 tours).'},
  pierce_shot:{name:'Tir Perçant',ap:2,type:'phys',power:9,range:[2,4],radius:1,shape:'line',offensive:true,acc:0.9,desc:'Flèche traversante alignée sur la cible (ligne).'},
  fireball:{name:'Boule de Feu',ap:3,type:'mag',power:13,range:[2,4],radius:1,offensive:true,acc:0.85,status:'burn',statusTurns:2,desc:'Explosion de feu en zone (touche les alliés).'},
  flame_wave:{name:'Vague de Flammes',ap:3,type:'mag',power:11,range:[1,1],radius:1.6,shape:'cone',offensive:true,acc:0.9,status:'burn',statusTurns:2,desc:'Cône de feu devant le lanceur (touche les alliés).'},
  bolt:{name:'Éclair Sombre',ap:3,type:'mag',power:12,range:[1,4],radius:1,offensive:true,acc:0.9,desc:'Décharge magique en zone.'},
  curse:{name:'Malédiction',ap:2,type:'debuff',power:0,range:[1,4],radius:1,offensive:true,acc:1,status:'curse',statusTurns:3,desc:'Réduit la défense (END) des ennemis (zone, 3 tours).'},
  heal:{name:'Lumière Salvatrice',ap:2,type:'heal',power:1.2,range:[0,3],radius:1,support:true,desc:'Soigne les alliés dans la zone.'},
  regen:{name:'Régénération',ap:2,type:'buff',power:0,range:[0,3],radius:1,support:true,status:'regen',statusTurns:3,desc:'Régénère les PV des alliés chaque tour (3 tours).'},
  bless:{name:'Bénédiction',ap:2,type:'buff',power:0,range:[0,3],radius:1,support:true,status:'boost',statusTurns:3,desc:'+FOR/+MAG aux alliés (3 tours).'},
  revive:{name:'Résurrection',ap:4,type:'revive',power:0.5,range:[1,1],radius:0,support:true,desc:'Relève un allié K.O. à 50% PV.'},
  heavy:{name:'Coup Lourd',ap:2,type:'phys',power:11,range:[1,1],radius:1,offensive:true,acc:0.95,status:'stun',statusTurns:1,desc:'Choc de zone qui étourdit (1 tour).'},
  blink:{name:'Clignotement',ap:2,type:'move',mode:'teleport',dest:true,range:[2,3],radius:0,desc:'Se repositionne instantanément sur une case libre.'},
  leap:{name:'Bond',ap:1,type:'move',mode:'leap',dest:true,range:[2,3],radius:0,desc:'Repositionnement rapide vers une case libre.'},
  charge:{name:'Charge',ap:2,type:'move',mode:'dash',dest:true,range:[2,3],radius:0,power:8,impact:{status:'stun',statusTurns:1},desc:'Fonce en ligne droite et étourdit près de l’arrivée.'}
};

// ============================= UNIT DEFINITIONS =============================
const DEFS=[
  {team:'player',kind:'knight', name:'Chevalier',hp:130,str:24,mag:4, end:20,dex:9, cha:10,mov:2, weapons:[{name:'Épée',icon:'⚔️',type:'phys',min:1,max:1,power:10,crit:0.10,acc:0.95},{name:'Hache',icon:'🪓',type:'phys',min:1,max:1,power:15,crit:0.16,acc:0.80}], skills:['whirl','bulwark','provoke','charge'], gx:0,gz:0},
  {team:'player',kind:'cleric', name:'Clerc',    hp:90, str:8, mag:20,end:13,dex:11,cha:18,mov:2, weapons:[{name:'Masse',icon:'🔨',type:'phys',min:1,max:1,power:8,crit:0.06,acc:0.92}], skills:['heal','regen','bless','revive'], gx:0,gz:1},
  {team:'player',kind:'mage',   name:'Mage',     hp:70, str:4, mag:26,end:9, dex:12,cha:10,mov:2, weapons:[{name:'Bâton',icon:'🪄',type:'mag',min:1,max:2,power:8,crit:0.06,acc:0.95}], skills:['fireball','curse','flame_wave','blink'], gx:1,gz:2},
  {team:'player',kind:'archer', name:'Archère',  hp:80, str:18,mag:5, end:11,dex:18,cha:9, mov:3, weapons:[{name:'Dague',icon:'🗡️',type:'phys',min:1,max:1,power:8,crit:0.22,acc:0.95},{name:'Arc',icon:'🏹',type:'phys',min:2,max:4,power:9,crit:0.10,acc:0.92}], skills:['weaken','blind_shot','pierce_shot','leap'], gx:1,gz:3},
  {team:'foe',kind:'brigand', name:'Brigand',  hp:90, str:18,mag:4, end:11,dex:14,cha:6, mov:2, weapons:[{name:'Dague',icon:'🗡️',type:'phys',min:1,max:1,power:9,crit:0.18,acc:0.95}], skills:[], ai:'aggressive', gx:6,gz:0},
  {team:'foe',kind:'brigand', name:'Brigand',  hp:90, str:18,mag:4, end:11,dex:14,cha:6, mov:2, weapons:[{name:'Dague',icon:'🗡️',type:'phys',min:1,max:1,power:9,crit:0.18,acc:0.95}], skills:[], ai:'aggressive', gx:6,gz:3},
  {team:'foe',kind:'brute',   name:'Brute',    hp:130,str:22,mag:4, end:16,dex:7, cha:5, mov:2, weapons:[{name:'Massue',icon:'🏏',type:'phys',min:1,max:1,power:13,crit:0.05,acc:0.85}], skills:['heavy'], ai:'guardian', gx:7,gz:1},
  {team:'foe',kind:'darkmage',name:'Mage Noir',hp:70, str:4, mag:22,end:10,dex:12,cha:8, mov:2, weapons:[{name:'Bâton',icon:'🪄',type:'mag',min:1,max:3,power:8,crit:0.05,acc:0.95}], skills:['bolt','curse'], ai:'cautious', gx:7,gz:2}
];

// ============================= STATUS EFFECTS =============================
const STATUS={
  burn:   {name:'Brûlure', col:'#ff9a52', dot:u=>Math.ceil(u.maxhp*0.06)+8},
  poison: {name:'Poison',  col:'#9bd45a', dot:u=>Math.ceil(u.maxhp*0.05)+6},
  regen:  {name:'Régén.',  col:'#7ed957', hot:u=>Math.ceil(u.maxhp*0.08)+6},
  slow:   {name:'Ralenti', col:'#7fd0ff', dex:0.65},
  boost:  {name:'Force+',  col:'#ffd27a', str:1.3, mag:1.3},
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
  ether:   {name:'Éther',   effect:'ap',   apRestore:2, range:[0,1], radius:0,   desc:'Rend 2 AP à un allié proche.'},
  antidote:{name:'Antidote',effect:'cure',              range:[0,1], radius:0,   desc:'Dissipe les altérations négatives d’un allié.'},
  bomb:    {name:'Bombe',   effect:'bomb', flatDmg:42,  range:[1,4], radius:1.2, desc:'Explosion de zone : dégâts aux unités touchées.'}
};
function isNegative(s){ return !['regen','boost','barrier'].includes(s); }
function hasS(u,s){ return (u.statuses[s]||0)>0; }
function statMul(u,key){ let m=1; for(const s in u.statuses){ const d=STATUS[s]; if(d&&u.statuses[s]>0&&d[key]!=null) m*=d[key]; } return m; }
function effSTR(u){ return u.str*statMul(u,'str'); }
function effMAG(u){ return u.mag*statMul(u,'mag'); }
function effEND(u){ return u.end*statMul(u,'end'); }
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
    const k=0.5+0.5*Math.sin(performance.now()*0.0032);
    const rs=1+0.018*k;
    if(selRingUnder){ selRingUnder.visible=true; selRingUnder.material.opacity=.58+0.08*k; selRingUnder.scale.set(rs,rs,rs); selRingUnder.position.set(wX(u.gx),top+0.059,wZ(u.gz)); }
    selRing.visible=true; selRing.material.color.setHex(col); selRing.material.opacity=COMBAT_PRESENTATION.units.activeRingOpacity*(0.9+0.1*k); selRing.scale.set(rs,rs,rs); selRing.position.set(wX(u.gx),top+0.063,wZ(u.gz));
    selBase.visible=true; selBase.material.color.setHex(col); selBase.material.opacity=COMBAT_PRESENTATION.units.activeBaseOpacity*(0.62+0.1*k); const sc=1+0.02*k; selBase.scale.set(sc,sc,sc); selBase.position.set(wX(u.gx),top+0.044,wZ(u.gz));
    faceArrow.visible=true; faceArrow.material.color.setHex(col); const a=Math.atan2(u.facing.dx,u.facing.dz);
    faceArrow.position.set(wX(u.gx)+u.facing.dx*0.62,top+0.07,wZ(u.gz)+u.facing.dz*0.62);
    faceArrow.rotation.z=-a; }
  else { selRing.visible=false; if(selRingUnder)selRingUnder.visible=false; faceArrow.visible=false; if(selBase)selBase.visible=false; }
  const h=G.hoverUnit&&G.hoverUnit.alive&&!G.stage&&!G.over&&G.hoverUnit!==G.active?G.hoverUnit:null;
  if(h&&hoverRing){ const top=h.cell().topY,col=h.team==='player'?0x69d7ff:0xff5f52; if(hoverRingUnder){ hoverRingUnder.visible=true; hoverRingUnder.material.opacity=.58; hoverRingUnder.position.set(wX(h.gx),top+0.062,wZ(h.gz)); } hoverRing.visible=true; hoverRing.material.color.setHex(col); hoverRing.material.opacity=h.team==='player'?0.92:0.96; hoverRing.position.set(wX(h.gx),top+0.066,wZ(h.gz)); }
  else { if(hoverRing)hoverRing.visible=false; if(hoverRingUnder)hoverRingUnder.visible=false; }
}

// ============================= UNIT FACTORY =============================
let UID=0;
function createUnit(def){
  const s=SPR[def.kind];
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
    id:++UID, campaignId:def.campaignId||null, portrait:def.portrait||'', team:def.team, kind:def.kind, name:def.name,
    maxhp:def.hp, hp:def.hp, str:def.str, mag:def.mag, end:def.end, dex:def.dex, cha:def.cha,
    mov:def.mov, weapons:def.weapons, skills:def.skills.slice(), ai:def.ai||'aggressive',
    ap:0, maxap:5, gx:def.gx, gz:def.gz, alive:true, statuses:{},
    facing:def.team==='player'?{dx:1,dz:0}:{dx:-1,dz:0},
    grp, spr, outline, mat, blob, teamGlow, teamRingUnder, teamRing, baseY:s.h*0.5,
    cell(){ return cellAt(this.gx,this.gz); }
  };
  spr.scale.x=u.facing.dx<0?-1:1; outline.scale.x=u.facing.dx<0?-1.1:1.1;
  placeUnit(u,def.gx,def.gz,true);
  G.units.push(u);
  return u;
}

function campaignDef(payload,index){
  const stats=payload.stats||{};
  const icons={sword:'⚔',dagger:'†',axe:'◆',spear:'↟',bow:'⌁',staff:'✦',mace:'✚'};
  return {
    team:'player',kind:payload.kind||'knight',name:payload.name||'Allié',
    hp:stats.maxHealth||100,str:stats.strength||10,mag:stats.magic||5,end:stats.endurance||10,
    dex:stats.dexterity||10,cha:stats.charisma||10,mov:Math.min(3,stats.moveRange||2),
    id:payload.id,campaignId:payload.id,portrait:payload.portrait||'',
    weapons:(payload.weapons||[]).map(weapon=>({
      name:weapon.name||'Arme',icon:icons[weapon.type]||'⚔',type:weapon.type==='staff'?'mag':'phys',
      min:weapon.minRange||1,max:weapon.range||1,power:Math.max(7,Math.round((weapon.damage||14)*0.55)),
      crit:Math.max(0.03,(weapon.critBonus||5)/100),
      acc:Math.max(0.55,Math.min(0.99,0.9+(weapon.accuracyBonus||0)/100)),
    })),
    skills:(payload.skills||[]).filter(id=>SKILLS[id]),
    gx:index%2,gz:index%CFG.D,
  };
}
function placeUnit(u,gx,gz,instant){
  if(u.cell()&&u.cell().occupant===u) u.cell().occupant=null;
  u.gx=gx; u.gz=gz; const c=cellAt(gx,gz); c.occupant=u;
  if(instant){ u.grp.position.set(wX(gx),c.topY,wZ(gz)); }
}
function setFacing(u,tx,tz){ const dx=tx-u.gx, dz=tz-u.gz; if(dx===0&&dz===0)return;
  if(Math.abs(dx)>=Math.abs(dz)) u.facing={dx:Math.sign(dx),dz:0}; else u.facing={dx:0,dz:Math.sign(dz)};
  u.spr.scale.x=u.facing.dx<0?-1:(u.facing.dx>0?1:u.spr.scale.x); if(u.outline)u.outline.scale.x=u.spr.scale.x<0?-1.1:1.1; }

function spawnUnits(){ for(const d of DEFS) if(d.team!=='player') createUnit(d); }

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
    if(d.dot){ const dmg=d.dot(u); floatText(u,'-'+dmg,d.col); await applyDamage(u,dmg); if(G.over||!u.alive)return; await wait(0.12); }
    else if(d.hot){ applyHeal(u,d.hot(u)); await wait(0.1); } }
})(); }
function statusSkips(u){ for(const s in u.statuses){ const d=STATUS[s]; if(d&&d.skip&&u.statuses[s]>0)return d; } return null; }
function tickStatusDuration(u){ for(const s in u.statuses){ u.statuses[s]--; if(u.statuses[s]<=0)delete u.statuses[s]; } }

function buildOrder(){ return aliveUnits().sort((a,b)=> (effDEX(b)-effDEX(a)) || (a.team===b.team? a.id-b.id : (a.team==='player'?-1:1))); }
function startRound(){ if(checkEnd())return; G.round++; G.order=buildOrder(); G.turnIdx=-1; logMsg('— Manche '+G.round+' —'); nextTurn(); }
function nextTurn(){ if(G.over||checkEnd())return; G.turnIdx++; if(G.turnIdx>=G.order.length){ startRound(); return; } const u=G.order[G.turnIdx]; if(!u||!u.alive){ nextTurn(); return; } beginTurn(u); }
async function beginTurn(u){ if(G.over)return; G.active=u; G.pinnedUnit=null; hideActionPreview(); G.movedThisTurn=false; G.actedThisTurn=false; G.startGX=u.gx; G.startGZ=u.gz;
  u.ap=Math.min(u.maxap,u.ap+1);
  refreshTurnbar(); selectUnit(u); focusCam(u);
  await tickStatusDamage(u); if(G.over)return; if(!u.alive){ nextTurn(); return; }
  const sk=statusSkips(u); tickStatusDuration(u); if(!hasS(u,'taunt'))u._taunter=null; refreshPanel(u);
  if(sk){ floatText(u,sk.name.toUpperCase()+' !',sk.col,true); logMsg(u.name+' est '+sk.name.toLowerCase()+' — tour passé.'); await wait(0.7); if(G.over)return; nextTurn(); return; }
  if(u.team==='player'){ G.mode='menu'; setHint(u.name+' — à vous de jouer'); openActionMenu(); }
  else { G.mode='ai'; closeMenus(); setHint(u.name+' (ennemi)…'); await wait(0.35); await aiTurn(u); }
}
function endTurn(){ if(G.busy||G.over)return; unitFocus.restore(); hideActionPreview(); closeMenus(); clearHL(); G.pending=null; G.mode='idle'; nextTurn(); }
function checkEnd(){ if(G.over)return true; if(aliveUnits('foe').length===0){ winWave(); return true; } if(aliveUnits('player').length===0){ endGame(false); return true; } return false; }

// ============================= COMBAT & AOE =============================
function worldToScreen(v){ const p=v.clone().project(camera); return {x:(p.x*0.5+0.5)*innerWidth,y:(-p.y*0.5+0.5)*innerHeight}; }
function floatText(u,txt,color,big){ const el=document.createElement('div'); el.className='float'; el.textContent=txt; el.style.color=color||'#fff'; if(big)el.style.fontSize='26px';
  dom.fx.appendChild(el); const start=performance.now(), dur=1.05;
  const base=(u.grp?u.grp.position.clone():new THREE.Vector3(wX(u.gx),0,wZ(u.gz))); base.y+=2.5; base.x+=rnd(-0.2,0.2);
  (function a(){ const e=Math.min(1,(performance.now()-start)/(dur*1000)); const wp=base.clone(); wp.y+=e*1.0; const s=worldToScreen(wp); el.style.left=s.x+'px'; el.style.top=s.y+'px'; el.style.opacity=(1-e*e); if(e<1)requestAnimationFrame(a); else el.remove(); })(); }
function flashUnit(u,color){ u.mat.color.set(color); setTimeout(()=>u.alive&&u.mat.color.set('#ffffff'),140); }
function shockRing(pos,radius,color){ const m=new THREE.Mesh(new THREE.RingGeometry(0.1,0.34,28),new THREE.MeshBasicMaterial({color:color||0xfff0b0,transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false})); m.rotation.x=-Math.PI/2; m.position.copy(pos); m.position.y+=0.05; scene.add(m); const sc=Math.max(1,radius)*2.6; tween(m.scale,{x:sc,y:sc},0.45,easeOutCubic); tween(m.material,{opacity:0},0.45,easeOutCubic,()=>scene.remove(m)); }
function burst(pos,col){ for(let i=0;i<12;i++){ const p=new THREE.Mesh(new THREE.SphereGeometry(0.07,6,6),new THREE.MeshBasicMaterial({color:col,transparent:true})); p.position.copy(pos); scene.add(p); const d=new THREE.Vector3(rnd(-1,1),rnd(0.1,1),rnd(-1,1)).multiplyScalar(rnd(0.4,0.9)); tween(p.position,{x:pos.x+d.x,y:pos.y+d.y,z:pos.z+d.z},0.45,easeOutCubic); tween(p.material,{opacity:0},0.45,easeOutCubic,()=>scene.remove(p)); } }
function screenShake(mag,dur){ if(!G.shake||G.shake.t>=G.shake.dur||mag>=G.shake.mag) G.shake={mag,dur,t:0}; }
function screenFlash(color,a){ const el=document.createElement('div'); el.style.cssText='position:fixed;inset:0;z-index:18;pointer-events:none;background:'+(color||'#ffffff'); el.style.opacity=a||0.4; document.body.appendChild(el); const s=performance.now(); (function f(){ const e=(performance.now()-s)/200; el.style.opacity=String((a||0.4)*(1-e)); if(e<1)requestAnimationFrame(f); else el.remove(); })(); }
function vfx(type,pos){ const C={fire:{c:0xff8a3a,n:18,up:1.3,smoke:1},dark:{c:0xb06aff,n:18,up:1.1,smoke:1},heal:{c:0x7ed957,n:16,up:1.7,smoke:0},arrow:{c:0xffe08a,n:9,up:0.6,smoke:0},hit:{c:0xffe7a6,n:13,up:0.8,smoke:0}}[type]||{c:0xffffff,n:10,up:0.7,smoke:0};
  for(let i=0;i<C.n;i++){ const p=new THREE.Mesh(new THREE.SphereGeometry(rnd(0.05,0.12),6,6),new THREE.MeshBasicMaterial({color:C.c,transparent:true})); p.position.copy(pos); scene.add(p); const d=new THREE.Vector3(rnd(-1,1),rnd(0.2,1)*C.up,rnd(-1,1)).multiplyScalar(rnd(0.5,1.15)); tween(p.position,{x:pos.x+d.x,y:pos.y+d.y,z:pos.z+d.z},rnd(0.4,0.7),easeOutCubic); tween(p.material,{opacity:0},0.62,easeOutCubic,()=>scene.remove(p)); }
  if(C.smoke){ for(let i=0;i<6;i++){ const sm=new THREE.Mesh(new THREE.SphereGeometry(rnd(0.14,0.24),6,6),new THREE.MeshBasicMaterial({color:0x2a2630,transparent:true,opacity:.5})); sm.position.copy(pos); sm.position.x+=rnd(-0.3,0.3); scene.add(sm); tween(sm.position,{y:pos.y+1.5},0.85,easeOutCubic); tween(sm.material,{opacity:0},0.85,easeOutCubic,()=>scene.remove(sm)); } } }

function orientMult(att,tgt){ const ax=att.gx-tgt.gx, az=att.gz-tgt.gz; const len=Math.hypot(ax,az)||1; const d=tgt.facing.dx*(ax/len)+tgt.facing.dz*(az/len); if(d>0.55)return{m:1.0,lab:'face'}; if(d<-0.55)return{m:1.3,lab:'DOS'}; return{m:1.15,lab:'flanc'}; }
function computeDamage(att,tgt,spec){ const K=15, isMag=spec.type==='mag'; const atkStat=isMag?effMAG(att):effSTR(att); const def=Math.max(1,effEND(tgt)+Math.floor((isMag?effMAG(tgt):effSTR(tgt))/4)); const o=orientMult(att,tgt); let d=Math.sqrt(spec.power*K*atkStat/def)*2*o.m*dmgTakenMul(tgt)*rnd(0.92,1.08); return {dmg:Math.max(1,Math.round(d)),lab:o.lab}; }
const FX_COL={phys:0xff7a4a,mag:0xb06aff,heal:0x7ed957,buff:0xffd27a,debuff:0xb06aff,move:0x5ad1ff};
function fxColor(spec){ return FX_COL[spec.heal?'heal':(spec.revive?'heal':spec.type)]||0xfff0b0; }
function castTelegraph(u,spec){ const c=u.cell(); if(!c)return; const col=fxColor(spec);
  const m=new THREE.Mesh(new THREE.RingGeometry(0.30,0.46,40),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));
  m.rotation.x=-Math.PI/2; m.position.set(wX(u.gx),c.topY+0.06,wZ(u.gz)); m.scale.set(0.55,0.55,0.55); scene.add(m);
  tween(m.scale,{x:1.7,y:1.7,z:1.7},0.5,easeOutCubic);
  tween(m.material,{opacity:.9},0.12,easeOutCubic,()=>tween(m.material,{opacity:0},0.36,easeOutCubic,()=>{ scene.remove(m); m.geometry.dispose(); m.material.dispose(); }));
  burst(new THREE.Vector3(wX(u.gx),c.topY+0.5,wZ(u.gz)),col); }
function critChance(att,tgt,spec){ const base=(spec&&spec.crit!=null)?spec.crit*100:5; return cl(base+Math.max(0,(effDEX(att)-effDEX(tgt))/2),1,90)/100; }
function rollHit(att,tgt,spec){ if(spec.support||spec.heal||spec.revive)return true; let acc=(spec.acc!=null?spec.acc:0.9)*100+Math.floor(effDEX(att)/2)-Math.floor(effDEX(tgt)/3); if(hasS(att,'blind'))acc-=30; return Math.random()*100<cl(acc,5,95); }

async function applyDamage(u,dmg,src){ u.hp=Math.max(0,u.hp-dmg); flashUnit(u,'#ff6a5a'); if(u.spr){ const dir=u.facing.dx<0?-1:1; killTweens(u.spr.position); u.spr.position.x=0; tween(u.spr.position,{x:0.16*dir},0.05,easeOutCubic,()=>tween(u.spr.position,{x:0},0.14,easeOutCubic)); } screenShake(0.16,0.16); refreshPanel(u); if(u.hp<=0&&u.alive){ await knockOut(u,src); checkEnd(); } }
function applyHeal(u,amt){ if(!u.alive)return; u.hp=Math.min(u.maxhp,u.hp+amt); floatText(u,'+'+amt,'#7ed957'); flashUnit(u,'#bfffc0'); refreshPanel(u); }
function applyStatus(t,st,turns){ const d=STATUS[st]; if(!d)return; t.statuses[st]=Math.max(t.statuses[st]||0,turns||2); floatText(t,(d.name||st).toUpperCase(),d.col||'#fff'); refreshPanel(t); }
async function knockOut(u,src){ u.alive=false; u.downed=true; const state=getUnitVisualState(u.team,u.alive,u.downed); const c=u.cell(); if(c&&c.occupant===u)c.occupant=null; floatText(u,'K.O.','#ff5a4a',true); logMsg(u.name+' est K.O. !'); screenShake(0.5,0.4); screenFlash('#ff5a4a',0.22); tween(u.spr.scale,{y:0.32},0.4,easeOutCubic); tween(u.spr.rotation,{z:(u.facing.dx<0?-1:1)*1.15},0.4); tween(u.mat,{opacity:state.bodyOpacity},0.4); tween(u.blob.material,{opacity:state.shadowOpacity},0.4); if(u.teamRing)tween(u.teamRing.material,{opacity:0},0.4); refreshTurnbar(); await wait(0.42); u.grp.visible=state.visible; }
function reviveUnit(u,hp){ u.alive=true; u.downed=false; u.hp=hp; u.statuses={}; u.grp.visible=true; const c=u.cell(); if(c&&!c.occupant)c.occupant=u; u.spr.scale.y=1; u.spr.rotation.z=0; u.mat.opacity=1; u.mat.color.set('#ffffff'); u.blob.material.opacity=COMBAT_PRESENTATION.units.shadowOpacity; if(u.teamRing)u.teamRing.material.opacity=COMBAT_PRESENTATION.units.teamRingOpacity; floatText(u,'+'+hp,'#7ed957',true); logMsg(u.name+' est relevé !'); refreshTurnbar(); }

function getSpec(u,which,wi){ if(which==='attack'){ const w=(u.weapons&&u.weapons[wi||0])||(u.weapons&&u.weapons[0])||{name:'Attaque',type:'phys',min:1,max:1,power:8,crit:0.05,acc:0.9}; return {key:'attack',wi:(wi||0),name:w.name,icon:w.icon,ap:0,type:w.type,power:w.power,range:[w.min,w.max],radius:0,offensive:true,self:false,acc:w.acc,crit:w.crit}; }
  const s=SKILLS[which]; return {key:which,name:s.name,ap:s.ap,type:s.type,power:s.power||0,range:s.self?[0,0]:s.range,radius:s.radius,shape:s.shape,mode:s.mode,dest:!!s.dest,impact:s.impact,status:s.status,statusTurns:s.statusTurns,acc:s.acc,support:!!s.support,offensive:!!s.offensive,self:!!s.self,heal:s.type==='heal',revive:s.type==='revive'}; }
function rangeCells(u,spec){ if(spec.self)return [{gx:u.gx,gz:u.gz}]; const out=[]; for(let gx=0;gx<CFG.W;gx++)for(let gz=0;gz<CFG.D;gz++){ const md=Math.abs(gx-u.gx)+Math.abs(gz-u.gz); if(md<spec.range[0]||md>spec.range[1])continue; if(spec.revive){ if(!G.units.some(x=>!x.alive&&x.downed&&x.team===u.team&&x.gx===gx&&x.gz===gz))continue; } if(spec.item&&spec.support){ const oc=cellAt(gx,gz)?.occupant; if(!(oc&&oc.alive&&oc.team===u.team))continue; } if(spec.dest){ const dc=cellAt(gx,gz); if(!dc||!dc.walkable||(dc.occupant&&dc.occupant!==u))continue; if(spec.mode==='dash'&&gx!==u.gx&&gz!==u.gz)continue; if(spec.mode==='dash'&&!clearLine(u,gx,gz))continue; } out.push({gx,gz}); } return out; }
function clearLine(u,gx,gz){ const dx=Math.sign(gx-u.gx), dz=Math.sign(gz-u.gz); let x=u.gx+dx, z=u.gz+dz, g=0; while((x!==gx||z!==gz)&&g++<40){ const c=cellAt(x,z); if(!c||!c.walkable||c.occupant)return false; x+=dx; z+=dz; } return true; }
function aoeTiles(cx,cz,radius){ const out=[],R=radius+0.001; for(let gx=Math.ceil(cx-radius);gx<=Math.floor(cx+radius);gx++)for(let gz=Math.ceil(cz-radius);gz<=Math.floor(cz+radius);gz++){ if(inBounds(gx,gz)&&eud(gx,gz,cx,cz)<=R)out.push([gx,gz]); } if(!out.length&&inBounds(cx,cz))out.push([cx,cz]); return out; }
function dirTo(u,cx,cz){ const dx=cx-u.gx, dz=cz-u.gz; if(Math.abs(dx)>=Math.abs(dz)) return {dx:Math.sign(dx)||(u.facing.dx||1),dz:0}; return {dx:0,dz:Math.sign(dz)||1}; }
function lineCells(u,cx,cz,radius){ const d=dirTo(u,cx,cz); const R=Math.max(1,Math.round(radius)); const out=[]; for(let i=-1;i<=R;i++){ const gx=cx+d.dx*i, gz=cz+d.dz*i; if(inBounds(gx,gz))out.push([gx,gz]); } return out.length?out:[[cx,cz]]; }
function coneCells(u,cx,cz,radius){ const d=dirTo(u,cx,cz); const R=radius+0.001; const out=[]; for(let gx=Math.ceil(cx-radius);gx<=Math.floor(cx+radius);gx++)for(let gz=Math.ceil(cz-radius);gz<=Math.floor(cz+radius);gz++){ if(!inBounds(gx,gz)||eud(gx,gz,cx,cz)>R)continue; const vx=gx-cx,vz=gz-cz; if(vx===0&&vz===0){out.push([gx,gz]);continue;} if((vx*d.dx+vz*d.dz)/Math.hypot(vx,vz)>=0.34)out.push([gx,gz]); } return out.length?out:[[cx,cz]]; }
function aoeCells(u,spec,cx,cz){ const sh=spec.shape||'circle'; if(sh==='line')return lineCells(u,cx,cz,spec.radius); if(sh==='cone')return coneCells(u,cx,cz,spec.radius); return aoeTiles(cx,cz,spec.radius); }
function canAffectUnit(caster,spec,target){ if(!target)return false; if(spec.offensive&&target===caster&&!spec.allowSelfDamage)return false; return true; }
function affectedUnits(u,spec,cx,cz){ if(spec.revive){ const ko=G.units.find(x=>!x.alive&&x.downed&&x.team===u.team&&x.gx===cx&&x.gz===cz); return ko?[ko]:[]; } const set=[]; for(const [gx,gz] of aoeCells(u,spec,cx,cz)){ const c=cellAt(gx,gz); if(c&&c.occupant&&c.occupant.alive&&canAffectUnit(u,spec,c.occupant))set.push(c.occupant); } if(spec.heal||spec.support)return set.filter(t=>t.team===u.team); return set; }
function previewAccuracy(att,tgt,spec){ if(spec.support||spec.heal||spec.revive)return 100; let acc=(spec.acc!=null?spec.acc:0.9)*100+Math.floor(effDEX(att)/2)-Math.floor(effDEX(tgt)/3); if(hasS(att,'blind'))acc-=30; return Math.round(cl(acc,5,95)); }
function previewPower(att,tgt,spec){ if(spec.heal)return Math.max(1,(spec.flatHeal!=null?spec.flatHeal:Math.round(effMAG(att)*spec.power))+Math.floor(effCHA(att)/4)); if(spec.apRestore)return spec.apRestore; if((spec.power||0)<=0)return 0; if(spec.flatDmg)return Math.max(1,Math.round(spec.flatDmg)); const K=15,isMag=spec.type==='mag'; const atk=isMag?effMAG(att):effSTR(att); const def=Math.max(1,effEND(tgt)+Math.floor((isMag?effMAG(tgt):effSTR(tgt))/4)); return Math.max(1,Math.round(Math.sqrt(spec.power*K*atk/def)*2*orientMult(att,tgt).m*dmgTakenMul(tgt))); }
function hideActionPreview(){ dom.actionPreview.classList.add('hidden'); dom.actionPreview.innerHTML=''; }
function showActionPreview(att,spec,targets,cx,cz){ const primary=targets[0]||null; const helpful=Boolean(spec.heal||spec.support||spec.revive||spec.apRestore||spec.cure); const alliesHit=targets.filter(t=>t.team===att.team&&!helpful).length; const estimate=primary?previewPower(att,primary,spec):0; const accuracy=primary?previewAccuracy(att,primary,spec):null; const valueLabel=spec.heal?'Soin':spec.apRestore?'AP':'Dégâts'; const targetLabel=primary?primary.name:(spec.type==='move'?('Case '+cx+','+cz):'Aucune cible');
  dom.actionPreview.innerHTML='<div class="action-preview__unit"><small>Lanceur</small><b>'+att.name+'</b></div><span class="action-preview__arrow">→</span><div class="action-preview__act"><small>'+((helpful)?'Soutien':'Action')+'</small><b>'+(spec.icon||'✦')+' '+spec.name+'</b>'+(estimate?'<em>'+valueLabel+' ~'+estimate+(accuracy!=null&&!helpful?' · '+accuracy+'%':'')+'</em>':'')+'</div><span class="action-preview__arrow">→</span><div class="action-preview__unit"><small>Cible'+(targets.length>1?'s':'')+'</small><b>'+targetLabel+(targets.length>1?' ×'+targets.length:'')+'</b></div>'+(alliesHit?'<strong class="action-preview__warning">⚠ '+alliesHit+' allié'+(alliesHit>1?'s':'')+' touché'+(alliesHit>1?'s':'')+'</strong>':'');
  dom.actionPreview.classList.toggle('is-helpful',helpful); dom.actionPreview.classList.remove('hidden'); }

async function projectile(u,cx,cz,spec){ const isDark=u.kind==='darkmage'; const col=spec.type==='mag'?(isDark?0xb06aff:0xff8a3a):0xffe08a;
  const m=new THREE.Mesh(new THREE.SphereGeometry(spec.type==='mag'?0.2:0.13,10,10),new THREE.MeshBasicMaterial({color:col})); const s=u.grp.position.clone(); s.y+=1.3; s.x+=u.facing.dx*0.4; m.position.copy(s); scene.add(m);
  const e=new THREE.Vector3(wX(cx),tileTop(cx,cz)+0.7,wZ(cz)); await tweenP(m.position,{x:e.x,y:e.y,z:e.z},0.26,easeInOut); scene.remove(m);
  vfx(spec.type==='mag'?(isDark?'dark':'fire'):'arrow',e);
  if(spec.type==='mag'){ screenShake(0.4,0.3); screenFlash(isDark?'#7a4fff':'#ff8a3a',0.2); } }
async function attackAnim(u,spec,cx,cz){ const from=u.grp.position.clone(); const ctr=new THREE.Vector3(wX(cx),tileTop(cx,cz)+0.6,wZ(cz));
  if(spec.heal||spec.revive||spec.support){ await tweenP(u.grp.position,{y:from.y+0.24},0.14,easeOutCubic); for(const [gx,gz] of aoeCells(u,spec,cx,cz)) vfx('heal',new THREE.Vector3(wX(gx),tileTop(gx,gz)+0.6,wZ(gz))); screenFlash('#bfffc0',0.14); await tweenP(u.grp.position,{y:from.y},0.18); return; }
  if(spec.self){ await tweenP(u.grp.position,{y:from.y+0.34},0.13,easeOutCubic); await tweenP(u.grp.position,{y:from.y},0.08,easeInOut); shockRing(ctr,spec.radius,spec.type==='mag'?0xff8a3a:0xfff0b0); screenShake(0.42,0.32); screenFlash('#fff0b0',0.16); for(const [gx,gz] of aoeCells(u,spec,cx,cz)) vfx('hit',new THREE.Vector3(wX(gx),tileTop(gx,gz)+0.6,wZ(gz))); return; }
  if(spec.type==='mag'||spec.range[1]>1){ await tweenP(u.grp.position,{x:from.x-u.facing.dx*0.2,y:from.y+0.05},0.12,easeOutCubic); await projectile(u,cx,cz,spec); if(spec.radius>=1)shockRing(ctr,spec.radius,spec.type==='mag'?0xff8a3a:0xfff0b0); await tweenP(u.grp.position,{x:from.x,y:from.y},0.12,easeOutCubic); }
  else { await tweenP(u.grp.position,{x:from.x-u.facing.dx*0.18,z:from.z-u.facing.dz*0.18},0.1,easeOutCubic); await tweenP(u.grp.position,{x:lerp(from.x,ctr.x,0.5),z:lerp(from.z,ctr.z,0.5)},0.07,easeOutCubic); vfx('hit',ctr); screenShake(0.36,0.24); await tweenP(u.grp.position,{x:from.x,z:from.z},0.13,easeOutCubic); }
}
async function doMove(u,spec,cx,cz){ setFacing(u,cx,cz); const c=cellAt(cx,cz); const dest=new THREE.Vector3(wX(cx),c.topY,wZ(cz)); const head=dest.clone().add(new THREE.Vector3(0,0.9,0));
  actionCam(head); logMsg(u.name+' → '+spec.name);
  if(spec.mode==='teleport'){ vfx('dark',u.grp.position.clone().add(new THREE.Vector3(0,0.9,0))); screenFlash('#b9a0ff',0.14); await tweenP(u.mat,{opacity:0},0.16,easeOutCubic); placeUnit(u,cx,cz,true); vfx('dark',head); screenFlash('#9fe7ff',0.16); await tweenP(u.mat,{opacity:1},0.2,easeOutCubic); }
  else if(spec.mode==='leap'){ const from=u.grp.position.clone(); placeUnit(u,cx,cz); await tweenP(u.grp.position,{x:(from.x+dest.x)/2,y:Math.max(from.y,dest.y)+1.7,z:(from.z+dest.z)/2},0.19,easeOutCubic); await tweenP(u.grp.position,{x:dest.x,y:dest.y,z:dest.z},0.18,easeInOut); vfx('hit',head); screenShake(0.32,0.22); }
  else { placeUnit(u,cx,cz); await tweenP(u.grp.position,{x:dest.x,y:dest.y,z:dest.z},0.2,easeOutCubic); screenShake(0.5,0.3); screenFlash('#fff0b0',0.16); vfx('hit',head);
    if(spec.impact){ const hits=aliveUnits().filter(t=>t.team!==u.team&&(Math.abs(t.gx-cx)+Math.abs(t.gz-cz)===1)); for(const t of hits){ const {dmg}=computeDamage(u,t,{type:'phys',power:spec.power||8}); floatText(t,'-'+dmg,'#ffffff',true); await applyDamage(t,dmg,u); if(G.over)break; if(t.alive&&spec.impact.status)applyStatus(t,spec.impact.status,spec.impact.statusTurns); await wait(0.06); } } }
  await wait(0.12); }
async function executeAction(u,spec,cx,cz){ unitFocus.restore(); hideActionPreview(); G.busy=true; closeMenus(); clearHL();
  if(spec.type==='move'){ await doMove(u,spec,cx,cz); if(spec.ap>0)u.ap=Math.max(0,u.ap-spec.ap); G.actedThisTurn=true; G.movedThisTurn=true; refreshPanel(u); restoreCam(); G.busy=false; checkEnd(); return; }
  if(!spec.self)setFacing(u,cx,cz);
  const targets=affectedUnits(u,spec,cx,cz);
  logMsg(u.name+' → '+spec.name);
  await combatStageEnter(u,targets,spec);
  if(spec.key!=='attack')castTelegraph(u,spec);
  await attackAnim(u,spec,cx,cz);
  if(spec.item&&spec.itemId)G.inv[spec.itemId]=Math.max(0,(G.inv[spec.itemId]||0)-1);
  if(spec.heal){ for(const t of targets)applyHeal(t,(spec.flatHeal!=null?spec.flatHeal:Math.round(effMAG(u)*spec.power))+Math.floor(effCHA(u)/4)); await wait(0.25); }
  else if(spec.revive){ for(const t of targets)reviveUnit(t,Math.round(t.maxhp*spec.power)); await wait(0.25); }
  else if(spec.apRestore){ for(const t of targets){ t.ap=Math.min(t.maxap,t.ap+spec.apRestore); floatText(t,'+'+spec.apRestore+' AP','#7fd0ff',true); flashUnit(t,'#bfe0ff'); refreshPanel(t); } await wait(0.25); }
  else if(spec.cure){ for(const t of targets){ let n=0; for(const s in t.statuses){ if(isNegative(s)){ delete t.statuses[s]; n++; } } floatText(t,n?'PURIFIÉ':'—',n?'#7ed957':'#cfd6e6',true); flashUnit(t,'#bfffc0'); refreshPanel(t); } await wait(0.25); }
  else { for(const t of targets){ const friendly=t.team===u.team;
      if((spec.power||0)<=0){ if(rollHit(u,t,spec)){ if(spec.status){ applyStatus(t,spec.status,spec.statusTurns); if(spec.status==='taunt')t._taunter=u; } } else floatText(t,'RATÉ','#cfd6e6'); continue; }
      if(!rollHit(u,t,spec)){ floatText(t,'RATÉ','#cfd6e6'); await wait(0.05); continue; }
      const crit=!spec.flatDmg&&Math.random()<critChance(u,t,spec); let {dmg,lab}=spec.flatDmg?{dmg:Math.max(1,Math.round(spec.flatDmg*rnd(0.85,1.15))),lab:'face'}:computeDamage(u,t,spec); if(crit)dmg=Math.round(dmg*1.5);
      floatText(t,(crit?'✦ ':'')+'-'+dmg,crit?'#ffd700':(friendly?'#ffd27a':'#ffffff'),lab==='DOS'||crit);
      if(crit){ screenShake(0.5,0.3); screenFlash('#fff3b0',0.18); logMsg('Coup critique !'); }
      if(lab==='DOS')floatText({grp:{position:t.grp.position.clone().add(new THREE.Vector3(0,0.3,0))},gx:t.gx,gz:t.gz},'DOS !','#ff5a4a');
      await applyDamage(t,dmg,u); if(G.over)break; if(t.alive&&spec.status){ applyStatus(t,spec.status,spec.statusTurns); if(spec.status==='taunt')t._taunter=u; } } await wait(0.15); }
  if(spec.ap>0)u.ap=Math.max(0,u.ap-spec.ap);
  G.actedThisTurn=true; refreshPanel(u); await combatStageExit(); G.busy=false; checkEnd();
}

// ============================= ENEMY AI =============================
function simAt(u,st){ return Object.assign(Object.create(Object.getPrototypeOf(u)),u,{gx:st.gx,gz:st.gz}); }
function nearestDist(st,arr){ let m=1e9; for(const a of arr){ const d=Math.abs(st.gx-a.gx)+Math.abs(st.gz-a.gz); if(d<m)m=d; } return m; }
function bestOffense(u,stands,taunter){ const specs=[...(u.weapons||[]).map((w,i)=>getSpec(u,'attack',i)), ...u.skills.filter(s=>SKILLS[s].offensive&&SKILLS[s].ap<=u.ap).map(s=>getSpec(u,s))]; let best=null;
  for(const st of stands){ const sim=simAt(u,st);
    for(const spec of specs){ for(const c of rangeCells(sim,spec)){ const aff=affectedUnits(sim,spec,c.gx,c.gz);
      const en=aff.filter(t=>t.team!==u.team), al=aff.filter(t=>t.team===u.team&&t!==u);
      if(!en.length)continue; let score=-st.d*0.6;
      for(const t of en){ const {dmg}=computeDamage(sim,t,spec); score+=dmg+(dmg>=t.hp?70:0); }
      for(const t of al){ const {dmg}=computeDamage(sim,t,spec); score-=dmg*1.6; }
      if(taunter&&en.includes(taunter))score+=50;
      if(!best||score>best.score) best={score,st,spec,cx:c.gx,cz:c.gz}; } } }
  return best; }
async function aiTurn(u){
  if(G.over)return;
  const foes=aliveUnits('player'); if(!foes.length){ endTurn(); return; }
  const allies=aliveUnits('foe').filter(a=>a!==u);
  const prof=u.ai||'aggressive';
  const taunter=(hasS(u,'taunt')&&u._taunter&&u._taunter.alive)?u._taunter:null;
  const {list,prev}=reachableStand(u);
  const stands=[{gx:u.gx,gz:u.gz,d:0},...list];

  // SOIGNEUR : priorité aux soins/buffs d'un allié blessé
  if(prof==='healer'){ const supSpecs=u.skills.map(s=>getSpec(u,s)).filter(s=>(s.heal||s.support)&&s.ap<=u.ap);
    const wounded=[u,...allies].filter(a=>a.alive&&a.hp<a.maxhp*0.75);
    if(supSpecs.length&&wounded.length){ const healSpec=supSpecs.find(s=>s.heal)||supSpecs[0]; let pickH=null;
      for(const st of stands){ const sim=simAt(u,st); for(const c of rangeCells(sim,healSpec)){ const aff=affectedUnits(sim,healSpec,c.gx,c.gz).filter(t=>wounded.includes(t)); if(!aff.length)continue; const sc=aff.length*10 - st.d*0.4 + aff.reduce((m,t)=>m+(1-t.hp/t.maxhp),0)*8; if(!pickH||sc>pickH.score)pickH={score:sc,st,cx:c.gx,cz:c.gz}; } }
      if(pickH){ if(pickH.st.gx!==u.gx||pickH.st.gz!==u.gz){ await moveAlong(u,buildPath(prev,u,pickH.st.gx,pickH.st.gz)); await wait(0.12);} await executeAction(u,healSpec,pickH.cx,pickH.cz); await wait(0.18); endTurn(); return; } } }

  // OFFENSE : meilleure attaque possible (le campeur reste sur place)
  const atkStands = prof==='camper' ? [{gx:u.gx,gz:u.gz,d:0}] : stands;
  const best=bestOffense(u,atkStands,taunter);
  if(best&&best.score>0){
    if(best.st.gx!==u.gx||best.st.gz!==u.gz){ await moveAlong(u,buildPath(prev,u,best.st.gx,best.st.gz)); await wait(0.15); }
    await executeAction(u,best.spec,best.cx,best.cz); await wait(0.2); endTurn(); return;
  }

  // Pas d'attaque possible : repositionnement selon le profil
  let tgt=foes[0],bd=1e9; for(const f of foes){ const d=gdist(u,f); if(d<bd){bd=d;tgt=f;} }
  if(taunter)tgt=taunter;
  if(prof==='camper'){ setFacing(u,tgt.gx,tgt.gz); await wait(0.2); endTurn(); return; }
  const lowHP=u.hp<u.maxhp*0.3; let pick=stands[0],bestSc=-1e9;
  for(const st of stands){ const dN=Math.abs(st.gx-tgt.gx)+Math.abs(st.gz-tgt.gz); let sc;
    if(prof==='cautious'){ sc = lowHP ? dN - st.d*0.1 : -Math.abs(dN-4)*1.2 - st.d*0.05; }
    else if(prof==='healer'){ sc = -dN*0.4 - st.d*0.05 - (allies.length?nearestDist(st,allies)*0.6:0); }
    else if(prof==='guardian'){ sc = -dN - st.d*0.05 - (allies.length?nearestDist(st,allies)*0.3:0); }
    else { sc = -dN - st.d*0.1; }
    if(sc>bestSc){ bestSc=sc; pick=st; } }
  if(pick&&(pick.gx!==u.gx||pick.gz!==u.gz)) await moveAlong(u,buildPath(prev,u,pick.gx,pick.gz));
  setFacing(u,tgt.gx,tgt.gz); await wait(0.25); endTurn();
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
function pickUnit(ev){ ndc.x=(ev.clientX/innerWidth)*2-1; ndc.y=-(ev.clientY/innerHeight)*2+1; ray.setFromCamera(ndc,camera);
  const living=G.units.filter(u=>u.alive&&u.grp.visible); const bySprite=new Map(living.map(u=>[u.spr,u])); const hits=ray.intersectObjects([...bySprite.keys()],false); return hits.length?(bySprite.get(hits[0].object)||null):null; }

function drawReach(){ clearHL(); const keys=new Set(G.reach.list.map(t=>cellKey(t.gx,t.gz))); addInvalidTiles(keys,true); for(const t of G.reach.list){ if(t.gx===G.active.gx&&t.gz===G.active.gz)continue; addHL(t.gx,t.gz,CFG.COL.move,COMBAT_PRESENTATION.arena.moveTileOpacity,'move'); } }
function enterMove(){ if(G.movedThisTurn||G.busy)return; if(hasS(G.active,'root')){ toast('Entravé — déplacement impossible'); return; } G.mode='move'; G.reach=reachableStand(G.active); unitFocus.focus(G.units,G.active); closeMenus(false); drawReach(); setHint('Déplacement — choisissez une case'); }
function drawRange(){ hideActionPreview(); clearHL(); const keys=new Set(G.pending.centers.map(c=>cellKey(c.gx,c.gz))); addInvalidTiles(keys,false); for(const c of G.pending.centers) addHL(c.gx,c.gz,CFG.COL.path,COMBAT_PRESENTATION.arena.rangeTileOpacity,'range'); }
function previewAt(cx,cz){ drawRange(); const sp=G.pending.spec,hoverCell=cellAt(cx,cz),hoverOcc=hoverCell&&hoverCell.occupant,hoverEnemy=hoverOcc&&G.active&&hoverOcc.team!==G.active.team; addHL(cx,cz,hoverEnemy?CFG.COL.foe:0xf7edcf,COMBAT_PRESENTATION.arena.hoverTileOpacity,hoverEnemy?'target':'hover'); if(hoverEnemy)addRingHL(cx,cz,CFG.COL.foe,COMBAT_PRESENTATION.arena.targetTileOpacity+.22);
  const targets=affectedUnits(G.active,sp,cx,cz); unitFocus.preview(targets); showActionPreview(G.active,sp,targets,cx,cz);
  for(const [gx,gz] of aoeCells(G.active,sp,cx,cz)){ const occ=cellAt(gx,gz)?.occupant; let col=sp.type==='move'?CFG.COL.move:CFG.COL.path,op=COMBAT_PRESENTATION.arena.targetTileOpacity,kind=sp.type==='move'?'move':'hover';
    if(occ&&G.active&&occ===G.active&&sp.offensive&&!sp.allowSelfDamage){ addHL(gx,gz,0xf7edcf,COMBAT_PRESENTATION.arena.rangeTileOpacity*.72,'range'); continue; }
    if(occ&&occ.alive){ col=(sp.heal||sp.revive)?0x7ed957:(occ.team===G.active.team?CFG.COL.ally:CFG.COL.foe); op=COMBAT_PRESENTATION.arena.targetTileOpacity+(occ.team===G.active.team?0.02:0.1); kind=occ.team===G.active.team?'hover':'target'; }
    else if(sp.revive){ const ko=G.units.find(x=>!x.alive&&x.downed&&x.gx===gx&&x.gz===gz); if(ko){col=0x7ed957;op=COMBAT_PRESENTATION.arena.targetTileOpacity+.08;kind='hover';} }
    addHL(gx,gz,col,op,kind); if(occ&&occ.alive&&G.active&&occ.team!==G.active.team)addRingHL(gx,gz,CFG.COL.foe,COMBAT_PRESENTATION.arena.targetTileOpacity+.18); } }
function enterTarget(spec){ if(G.busy)return; if(G.actedThisTurn){ toast('Action déjà utilisée'); return; } if(spec.ap>G.active.ap){ toast('AP insuffisants'); return; }
  const centers=rangeCells(G.active,spec); if(!centers.length){ toast('Aucune cible à portée'); return; }
  G.mode='target'; G.pending={spec,centers,keys:new Set(centers.map(c=>c.gx+','+c.gz))}; closeMenus(false);
  const validTargets=[...new Set(centers.flatMap(c=>affectedUnits(G.active,spec,c.gx,c.gz)))];
  unitFocus.focus(G.units,G.active,validTargets);
  if(spec.self) previewAt(G.active.gx,G.active.gz); else drawRange();
  setHint((spec.self?'Action':(spec.type==='move'?'Déplacement':'Ciblage'))+' — '+spec.name); }
function cancelToMenu(){ if(G.busy)return; if(G.mode==='move'||G.mode==='target'){ unitFocus.restore(); hideActionPreview(); G.pending=null; clearHL(); G.mode='menu'; openActionMenu(); setHint(G.active.name+' — à vous de jouer'); } }

async function doExecute(spec,cx,cz){ await executeAction(G.active,spec,cx,cz); afterSub(); }
function afterSub(){ unitFocus.restore(); hideActionPreview(); if(G.over)return; G.mode='menu'; selectUnit(G.active); openActionMenu();
  if(G.movedThisTurn&&G.actedThisTurn) setHint('Tour terminé — Entrée pour attendre'); else setHint(G.active.name+' — choisissez une action'); }
function undoMove(){ if(G.busy||!G.movedThisTurn||G.actedThisTurn||G.startGX==null)return; unitFocus.restore(); const u=G.active; placeUnit(u,G.startGX,G.startGZ,true); G.movedThisTurn=false; clearHL(); G.mode='menu'; selectUnit(u); openActionMenu(); setHint(u.name+' — déplacement annulé'); }

function transientInspect(u){ if(!u)return; const key=u.campaignId||u.id||u.name; if(statsPanelKey!==key){statsPanelKey=key;statsPanelExpanded=false;} G.selected=u; renderPanel(u); }
function restoreInspection(){ const fallback=(G.pinnedUnit&&G.pinnedUnit.alive?G.pinnedUnit:G.active); if(fallback)transientInspect(fallback); }
function onPointerMove(ev){ if(G.busy||G.over)return; const hoveredUnit=pickUnit(ev); const c=pickCell(ev); G.hover=c; G.hoverUnit=hoveredUnit||(c&&c.occupant&&c.occupant.alive?c.occupant:null); if(c)moveCursor(c.gx,c.gz); else if(cursorMesh)cursorMesh.visible=false;
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
    else if(k==='a'&&G.mode==='menu')enterTarget(getSpec(G.active,'attack'));
  });
}

// ============================= UI (HUD) =============================
const ROLE={knight:'Chevalier · Tank',cleric:'Clerc · Soutien',mage:'Mage · Zone',archer:'Archère · Distance',brigand:'Brigand',brute:'Brute',darkmage:'Mage Noir'};
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
function renderPanel(u){ dom.panel.classList.remove('hidden'); dom.panel.dataset.team=u.team; const hpp=Math.max(0,Math.round(u.hp/u.maxhp*100)),portrait=SPR[u.kind]&&SPR[u.kind].portrait?SPR[u.kind].portrait:'';
  let tags=''; for(const s in u.statuses){ const d=STATUS[s]; if(!d)continue; tags+='<span class="tag" style="color:'+d.col+';border-color:'+d.col+'">'+escHTML(d.name)+' '+u.statuses[s]+'</span>'; } if(!u.alive)tags+='<span class="tag" style="color:#ff5a4a;border-color:#ff5a4a">K.O.</span>';
  dom.panel.innerHTML='<div class="details-unit"><div class="du-top"><div class="du-portrait">'+(portrait?'<img src="'+portrait+'" alt="">':'<span>'+escHTML(u.name.charAt(0))+'</span>')+'</div><div class="du-id"><div class="du-head"><span>'+(u===G.active?'Actif':'Inspection')+'</span></div><div class="nm">'+escHTML(u.name)+'</div>'+apPipsHTML(u)+'</div><div class="du-team"><b class="team-badge">'+teamLabel(u.team)+'</b></div></div>'+
   '<div class="du-hp"><div class="unit-row"><span>PV</span><b>'+u.hp+' / '+u.maxhp+'</b></div><div class="bar"><i style="width:'+hpp+'%"></i><span>'+hpp+'%</span></div></div>'+
   statsDetailsHTML(u)+(tags?'<div class="status-row">'+tags+'</div>':'')+'</div>';
  bindStatsToggle(u); }
function refreshTurnbar(){ dom.turnbar.classList.remove('hidden'); renderObjective(); const order=G.order.length?G.order:G.units;
  const chip=u=>{ const cls=['chip']; if(u.team==='player')cls.push('ally'); if(u.team==='foe')cls.push('foe'); if(u===G.active)cls.push('active'); if(!u.alive)cls.push('dead'); return '<div class="'+cls.join(' ')+'" title="'+escHTML(u.name)+'"><div class="chip__portrait"><img src="'+SPR[u.kind].portrait+'" alt=""></div><div class="chip__name">'+escHTML(u.name.slice(0,8))+'</div></div>'; };
  const step=G.order.length&&G.turnIdx>=0?(G.turnIdx+1)+' / '+G.order.length:'Préparation';
  dom.turnbar.innerHTML='<div class="turn-center pixel"><span>Tour</span><b>'+(G.round||1)+'</b><em>'+escHTML(step)+'</em></div><div class="turn-sequence"><div class="turn-chips">'+order.map(chip).join('')+'</div></div>'; }
function closeMenus(){ dom.menu.classList.add('hidden'); dom.skillmenu.classList.add('hidden'); }
function tipFor(u,b){ const a=b.dataset.a;
  if(a==='move')return 'Déplacer · MOV '+u.mov;
  if(a==='undo')return 'Annuler le déplacement (U)';
  if(a==='attack'){ const w=u.weapons[+b.dataset.wi||0]; return w.name+' · portée '+w.min+'-'+w.max+' · puiss '+w.power+' · crit '+Math.round(w.crit*100)+'% · préc '+Math.round(w.acc*100)+'%'; }
  if(a==='skill')return 'Compétences · '+u.ap+' AP';
  if(a==='item')return 'Objets · sac ×'+invCount();
  if(a==='wait')return 'Attendre · fin de tour'; return ''; }
function openActionMenu(){ const u=G.active; if(!u||u.team!=='player'||G.over){ closeMenus(); return; }
  dom.menu.classList.remove('hidden'); dom.skillmenu.classList.add('hidden');
  const md=G.movedThisTurn, ad=G.actedThisTurn;
  const ico=(a,icon,label,sub,dot,dis,extra)=>'<div class="ico action-'+a+(dis?' dis':'')+'" role="button" aria-disabled="'+(dis?'true':'false')+'" data-a="'+a+'"'+(extra||'')+' style="--action-accent:'+dot+'"><div class="c"><span>'+icon+'</span></div><div class="tx"><b>'+escHTML(label)+'</b><small>'+escHTML(sub)+'</small></div><div class="dot"></div></div>';
  let h = (md&&!ad) ? ico('undo','↩','Annuler','Déplacement','#f59e0b',false) : ico('move','◆','Déplacer','MOV '+u.mov,'#55d4ff',md||hasS(u,'root'));
  (u.weapons||[]).forEach((w,i)=>{ h+=ico('attack',w.icon||'⚔','Attaquer',w.name||('Arme '+(i+1)),'#ff6b58',ad,' data-wi="'+i+'"'); });
  h+=ico('skill','✦','Compétence',u.ap+' AP','#b78cff',ad||!u.skills.length||hasS(u,'silence'));
  h+=ico('item','◈','Objet','Sac ×'+invCount(),'#f09ac9',ad||invCount()<=0);
  h+=ico('wait','⌛','Attendre','Fin du tour','#d0ba82',false);
  h+='<div class="lbl"></div>';
  dom.menu.innerHTML=h;
  const lbl=dom.menu.querySelector('.lbl');
  dom.menu.querySelectorAll('.ico').forEach(b=>{ b.onclick=()=>onMenu(b.dataset.a,b);
    b.onmouseenter=()=>{ lbl.textContent=tipFor(u,b); lbl.classList.add('on'); };
    b.onmouseleave=()=>{ lbl.classList.remove('on'); }; }); }
function onMenu(a,b){ if(b.classList.contains('dis'))return; const u=G.active;
  if(a==='move')enterMove(); else if(a==='undo')undoMove(); else if(a==='attack')enterTarget(getSpec(u,'attack',+b.dataset.wi||0)); else if(a==='skill')openSkillMenu(); else if(a==='item')openItemMenu(); else if(a==='wait')endTurn(); }
function openSkillMenu(){ const u=G.active; dom.skillmenu.classList.remove('hidden'); let h='<div class="ttl">Compétences — '+u.ap+' AP</div>';
  for(const id of u.skills){ const s=SKILLS[id]; const dis=(s.ap>u.ap||(id==='revive'&&!G.units.some(x=>!x.alive&&x.downed&&x.team===u.team)))?'dis':'';
    h+='<div class="btn '+dis+'" data-s="'+id+'" title="'+s.desc+'">'+s.name+' <small>'+s.ap+' AP</small></div>'; }
  h+='<div class="btn" data-s="_back">Retour</div>';
  dom.skillmenu.innerHTML=h; dom.skillmenu.querySelectorAll('.btn').forEach(b=>b.onclick=()=>{ if(b.classList.contains('dis'))return; const id=b.dataset.s; if(id==='_back'){ dom.skillmenu.classList.add('hidden'); return; } enterTarget(getSpec(u,id)); }); }
function itemSpec(id){ const it=ITEMS[id]; const base={key:'item',itemId:id,name:it.name,ap:0,range:it.range,radius:it.radius||0,self:false,item:true,desc:it.desc};
  if(it.effect==='heal')  return Object.assign(base,{type:'heal',power:0,heal:true,support:true,flatHeal:it.flatHeal});
  if(it.effect==='ap')    return Object.assign(base,{type:'buff',power:0,support:true,apRestore:it.apRestore});
  if(it.effect==='cure')  return Object.assign(base,{type:'buff',power:0,support:true,cure:true});
  if(it.effect==='bomb')  return Object.assign(base,{type:'mag', power:0,offensive:true,acc:1,flatDmg:it.flatDmg});
  return base; }
function invCount(){ let n=0; for(const k in G.inv)n+=G.inv[k]; return n; }
function openItemMenu(){ const u=G.active; dom.skillmenu.classList.remove('hidden'); let h='<div class="ttl">Objets — sac commun</div>'; let any=false;
  for(const id in ITEMS){ const n=G.inv[id]||0; const it=ITEMS[id]; if(n>0)any=true; h+='<div class="btn '+(n<=0?'dis':'')+'" data-i="'+id+'" title="'+it.desc+'">'+it.name+' <small>×'+n+'</small></div>'; }
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
    u.statuses={}; u.ap=0; u._taunter=null; u.mat.color.set('#ffffff'); u.mat.opacity=1; u.spr.scale.set(u.facing.dx<0?-1:1,1,1); u.spr.rotation.z=0; u.blob.material.opacity=COMBAT_PRESENTATION.units.shadowOpacity; if(u.teamRing)u.teamRing.material.opacity=COMBAT_PRESENTATION.units.teamRingOpacity;
    placeUnit(u,u.gx,u.gz,true); refreshPanel(u); }
  spawnWave(G.wave); G.over=false; G.round=0; G.mode='idle'; logMsg('— Vague '+G.wave+' approche ! —'); startRound(); }
function resultRowsHTML(){ const rows=G.deployedUnits.map(u=>'<li class="combat-result__unit '+(u.alive?'':'is-ko')+'"><span>'+escHTML(u.name)+'</span><b>'+(u.alive?'Debout':'K.O.')+'</b></li>').join('');
  return rows||'<li class="combat-result__unit"><span>Escouade</span><b>—</b></li>'; }
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
    showCombatResult('victory','Victoire',COMBAT_LABEL,'Continuer la chronique',()=>notifyCampaignResult(true),'<span>Objectif sécurisé</span><b>'+escHTML(COMBAT_OBJECTIVE)+'</b>');
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
  if(hlMeshes.length){ for(const m of hlMeshes){ const p=m.userData.pulse||0.08,k=1-p+p*Math.sin(_t*4.2); m.material.opacity=(m.userData.baseOp||0.28)*k; } }
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
function removeUnit(u){ const c=u.cell&&u.cell(); if(c&&c.occupant===u)c.occupant=null; if(u.grp)scene.remove(u.grp); const i=G.units.indexOf(u); if(i>=0)G.units.splice(i,1); const d=G.deployedUnits.indexOf(u); if(d>=0)G.deployedUnits.splice(d,1); }
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
  const portrait=def.portrait?'<img src="'+def.portrait+'" alt="">':'<span class="deploy-avatar">'+def.name.charAt(0)+'</span>';
  return '<button type="button" class="deploy-card '+(active?'is-selected ':'')+(deployed?'is-deployed':'')+'" data-unit="'+id+'">'+
    portrait+'<span><b>'+def.name+'</b><small>'+def.weapons.length+' arme'+(def.weapons.length>1?'s':'')+'</small></span>'+
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
function renderDefinitionPanel(def){ const key=def.campaignId||def.name; if(statsPanelKey!==key){statsPanelKey=key;statsPanelExpanded=false;} const preview=Object.assign({statuses:{}},def),portrait=preview.portrait||(SPR[preview.kind]&&SPR[preview.kind].portrait?SPR[preview.kind].portrait:''),hp=preview.hp||preview.maxhp||0; dom.panel.dataset.team='player'; dom.panel.classList.remove('hidden'); dom.panel.innerHTML='<div class="details-unit"><div class="du-top"><div class="du-portrait">'+(portrait?'<img src="'+portrait+'" alt="">':'<span>'+escHTML(preview.name.charAt(0))+'</span>')+'</div><div class="du-id"><div class="du-head"><span>Sélection</span></div><div class="nm">'+escHTML(preview.name)+'</div></div><div class="du-team"><b class="team-badge">Déploiement</b></div></div><div class="du-hp"><div class="unit-row"><span>PV</span><b>'+hp+'</b></div><div class="bar"><i style="width:100%"></i><span>'+hp+' PV</span></div></div>'+statsDetailsHTML(preview)+'</div>'; const button=dom.panel.querySelector('.stats-toggle'); if(button)button.onclick=()=>{statsPanelExpanded=!statsPanelExpanded;renderDefinitionPanel(def);}; }
function selectUnitData(def){ dom.panel.classList.add('deploy-preview'); const preview=deployedById(def.campaignId||def.name); if(preview)selectUnit(preview); else renderDefinitionPanel(def); }
function onDeploy(a,b){ if(b.disabled)return; if(a==='auto')autoDeploy(); else if(a==='reset')resetDeploy(); else if(a==='start')beginBattle(); else if(a==='prev'){G.deployPage--;openDeployMenu();}else if(a==='next'){G.deployPage++;openDeployMenu();} }
function startDeployment(){
  G.mode='deploy'; G.deployedUnits=[]; G.rosterDefs=playerDefinitions(); G.deployPage=0;
  G.selectedDeployId=null;
  computeDeployZone(); overviewCam(); drawDeployZone(); dom.help.classList.remove('hidden'); dom.panel.classList.add('hidden','deploy-preview');
  setHint('Déploiement — choisissez une unité puis une case disponible'); openDeployMenu();
}

// ============================= INIT & BOOT =============================
async function initGame(){
  G.inv=CAMPAIGN_MODE?{...CAMPAIGN_INVENTORY}:{potion:3,ether:1,antidote:2,bomb:2}; G.wave=1; G.round=0; G.over=false;
  await buildWorld(); makeBlobTex(); makeBaseTex(); makeTileTex(); buildSelectors(); buildCursor(); spawnUnits();
  initHud();
  logMsg(CAMPAIGN_MODE?COMBAT_OBJECTIVE:'Préparez votre formation, puis lancez la bataille.');
  startDeployment();
}
async function main(){ document.body.classList.toggle('reduced-graphics',REDUCED_GRAPHICS); buildSprites(); await initGame(); bindInput(); bloom.enabled=!REDUCED_GRAPHICS; tiltPass.enabled=!REDUCED_GRAPHICS; animate(); dom.loading.style.display='none'; }

window.addEventListener('error',()=>{ if(dom.loading&&dom.loading.style.display!=='none') dom.loading.innerHTML='<div style="color:#ff8a7a;max-width:540px;text-align:center;line-height:26px">Échec du chargement de Three.js.<br>Vérifiez votre connexion internet puis rechargez la page.<br><span style="color:#9fb0d0">La page doit être servie via un serveur local (http://), pas ouverte directement depuis le disque.</span></div>'; });
window.addEventListener('unhandledrejection',e=>console.error(e.reason));
function bootCampaign(message){
  COMBAT_ID=message.config.id; COMBAT_OBJECTIVE=message.config.objective; COMBAT_LABEL=message.config.encounterLabel;
  MAX_PLAYER_UNITS=normalizeDeploymentLimit(message.config.maxPlayerUnits); CAMPAIGN_SQUAD=message.clan; CAMPAIGN_INVENTORY=message.inventory;
  PREFERRED_UNIT_IDS=message.preferredUnitIds; REDUCED_GRAPHICS=message.reducedGraphics;
  main().then(()=>{ window.__BOOTED=true; }).catch(err=>{ console.error(err); dom.loading.innerHTML='<div style="color:#ff8a7a">Erreur : '+(err&&err.message||err)+'</div>'; });
}
if(CAMPAIGN_MODE){
  addEventListener('message',event=>{ if(event.source!==window.parent||event.origin!==location.origin)return; const parsed=combatInitializeMessageSchema.safeParse(event.data); if(parsed.success&&!window.__BOOTED)bootCampaign(parsed.data); });
  window.parent.postMessage({type:'rpg-threejs:combat-ready'},location.origin);
}else main().then(()=>{ window.__BOOTED=true; }).catch(err=>{ console.error(err); dom.loading.innerHTML='<div style="color:#ff8a7a">Erreur : '+(err&&err.message||err)+'</div>'; });

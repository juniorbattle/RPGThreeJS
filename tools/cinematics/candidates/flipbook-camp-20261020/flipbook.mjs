// Each display slot is a complete, newly generated image. No transformed/in-between frames.
const $=id=>document.getElementById(id);
const paths=Array.from({length:18},(_,i)=>i===0?'base-v1.png':`frame-${String(i).padStart(3,'0')}.png`);
const images=[],reduce=matchMedia('(prefers-reduced-motion: reduce)');
let index=0,fps=6,playing=false,ready=false,raf=0,start=0;
const format=n=>n.toFixed(2).replace('.',',');
const say=text=>{$('status').textContent=text};
function render(){
 const picture=$('picture');
 if(picture.getAttribute('src')!==paths[index])picture.setAttribute('src',paths[index]);
 picture.alt=`Dessin ${index+1} sur18 du nouveau flipbook du camp`;
 $('number').textContent=`${String(index+1).padStart(2,'0')} / 18`;
 $('seek').value=String(index);$('seek').setAttribute('aria-valuetext',`Dessin ${index+1} sur18`);
 $('time').textContent=`${format(index/fps)} / ${format(18/fps)} s`;
 $('play').textContent=playing?'Pause':index===17?'Relire le flipbook':'Lire le flipbook';
 $('play').disabled=$('previous').disabled=$('next').disabled=!ready;
}
function pause(text){playing=false;cancelAnimationFrame(raf);raf=0;render();if(text)say(text)}
function tick(now){
 if(!playing)return;
 const frame=Math.floor((now-start)/(1000/fps));
 if(frame>=18){index=17;pause('Fin de la séquence. Vous pouvez la relire ou feuilleter les dessins.');return}
 index=Math.max(0,frame);render();raf=requestAnimationFrame(tick);
}
function toggle(){
 if(playing){pause('Lecture en pause.');return}
 if(!ready)return;
 if(index===17)index=0;
 playing=true;start=performance.now()-index*1000/fps;render();say(`Lecture des 18 dessins à${fps}images/seconde, sur demande.`);raf=requestAnimationFrame(tick);
}
function go(frame){pause();index=Math.max(0,Math.min(17,frame));render();say(`Dessin ${index+1} sur18, en pause.`)}
$('play').addEventListener('click',toggle);
$('previous').addEventListener('click',()=>go(index-1));$('next').addEventListener('click',()=>go(index+1));
$('seek').addEventListener('input',event=>go(Number(event.target.value)));
$('fps').addEventListener('change',event=>{pause();fps=Number(event.target.value);render();say(`Cadence${fps}images/seconde, en pause.`)});
document.addEventListener('keydown',event=>{
 if(/^(INPUT|SELECT|BUTTON|SUMMARY|TEXTAREA)$/.test(event.target.tagName)||event.altKey||event.ctrlKey||event.metaKey)return;
 if(event.code==='Space'){event.preventDefault();toggle()}
 if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();go(event.key==='Home'?0:event.key==='End'?17:index+(event.key==='ArrowLeft'?-1:1))}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause('Lecture suspendue pendant que cet aperçu est masqué.')});window.addEventListener('pagehide',()=>pause());
function reflectReduction(){
 $('motion-note').hidden=!reduce.matches;
 if(playing)pause('Réglage de mouvement modifié : lecture suspendue, feuilletage toujours disponible.');
}
reduce.addEventListener('change',reflectReduction);reflectReduction();
try{
 await Promise.all(paths.map((path,i)=>new Promise((resolve,reject)=>{const img=new Image();images[i]=img;img.onload=async()=>{try{await img.decode();resolve()}catch(error){reject(error)}};img.onerror=()=>reject(new Error(path));img.src=path})));
 ready=true;
 for(let i=0;i<18;i++){
  const button=document.createElement('button');button.setAttribute('aria-label',`Afficher le dessin${i+1}`);
  const thumb=document.createElement('img');thumb.src=paths[i];thumb.alt='';thumb.loading='lazy';
  const label=document.createElement('span');label.textContent=String(i+1).padStart(2,'0');button.append(thumb,label);button.addEventListener('click',()=>go(i));$('thumbnails').append(button);
 }
 render();say('Prêt · 18 dessins · lecture 6 i/s sur demande · flèches pour feuilleter.');
}catch(error){
 pause();$('error').hidden=false;$('error').textContent='Un dessin est indisponible. Rechargez cet aperçu pour réessayer.';say('Chargement incomplet : lecture désactivée, aucun dessin manquant remplacé.');
}

const $=id=>document.getElementById(id);
// Versioned offline extension of reader-v1: per-shot incoming cut/dissolve and caption-free historical comparison.
const historical=new URLSearchParams(location.search).has('historical');
const sequence=await (await fetch(historical?'../v1/sequence.json':'sequence.json')).json();
if(historical){sequence.stages=sequence.stages.map(s=>({...s,path:'../v1/'+s.path}));$('version-label').textContent='Bois-Clair sacrifié · historique v1';}
const shots=sequence.stages,total=sequence.totalSeconds,count=shots.length;
$('seek').max=String(total);
const reduce=matchMedia('(prefers-reduced-motion: reduce)'),images=[];
let time=0,playing=false,ready=false,start=0,raf=0;
const index=()=>{const found=shots.findIndex(s=>time<s.start+s.duration);return found<0?shots.length-1:found};
function render(){
 const i=index(),shot=shots[i];if($('picture').getAttribute('src')!==shot.path)$('picture').src=shot.path;
 const fadeDuration=reduce.matches?sequence.reducedFadeSeconds:sequence.normalFadeSeconds;
 const cut=i<shots.length-1&&shots[i+1].transition==='cut';
 const progress=i===shots.length-1||cut?0:Math.min(1,Math.max(0,(time-(shot.start+shot.duration-fadeDuration))/fadeDuration));
 const blend=progress*progress*(3-2*progress),incoming=$('incoming');
 if(i<shots.length-1&&incoming.getAttribute('src')!==shots[i+1].path)incoming.src=shots[i+1].path;
 // Opaque outgoing image underneath the incoming layer avoids a black dip.
 // Timeline-driven opacity means pause, seek and hidden suspend freeze the dissolve too.
 $('picture').style.opacity='1';incoming.style.opacity=String(blend);
 $('picture').alt=`Plan ${i+1}`;$('number').textContent=`0${i+1} / ${String(count).padStart(2,'0')}`;$('title').textContent='';$('description').textContent='';
 $('time').textContent=`${time.toFixed(1).replace('.',',')} / ${total.toFixed(1).replace('.',',')} s`;$('seek').value=String(time);$('seek').setAttribute('aria-valuetext',`${Math.round(time)} secondes, plan ${i+1} sur ${count}`);
 $('play').textContent=playing?'Pause':time>=total?'Relire le montage':'Lire le montage';
 for(const id of ['play','previous','next','seek'])$(id).disabled=!ready;
 [...$('shots').children].forEach((b,n)=>b.setAttribute('aria-current',String(n===i)));
}
function pause(message){playing=false;cancelAnimationFrame(raf);raf=0;render();if(message)$('status').textContent=message}
function tick(now){if(!playing)return;time=Math.min(total,(now-start)/1000);render();if(time>=total){pause('Fin du montage. Vous pouvez le relire ou choisir un plan.');return}raf=requestAnimationFrame(tick)}
function toggle(){if(playing){pause('Lecture en pause.');return}if(!ready)return;if(time>=total)time=0;playing=true;start=performance.now()-time*1000;render();$('status').textContent=`Lecture des ${count} étapes, sur demande.`;raf=requestAnimationFrame(tick)}
function seek(value){pause();time=Math.min(total,Math.max(0,value));render();$('status').textContent=`Plan ${index()+1} sur ${count}, en pause.`}
function go(i){seek(shots[Math.max(0,Math.min(shots.length-1,i))].start)}
$('play').addEventListener('click',toggle);$('previous').addEventListener('click',()=>go(index()-1));$('next').addEventListener('click',()=>go(index()+1));$('seek').addEventListener('input',e=>seek(Number(e.target.value)));
document.addEventListener('keydown',e=>{if(/^(INPUT|BUTTON|SELECT|SUMMARY|TEXTAREA)$/.test(e.target.tagName)||e.altKey||e.ctrlKey||e.metaKey)return;if(e.code==='Space'){e.preventDefault();toggle()}if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();go(e.key==='Home'?0:e.key==='End'?shots.length-1:index()+(e.key==='ArrowLeft'?-1:1))}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause('Lecture suspendue pendant que cet aperçu est masqué.')});window.addEventListener('pagehide',()=>pause());
function reduction(){ $('motion-note').hidden=!reduce.matches;if(playing)pause('Préférence de mouvement modifiée : lecture en pause.') }reduce.addEventListener('change',reduction);reduction();
try{
 await Promise.all(shots.map((s,i)=>new Promise((resolve,reject)=>{const image=new Image();images[i]=image;image.onload=async()=>{try{await image.decode();resolve()}catch(error){reject(error)}};image.onerror=()=>reject(new Error(s.path));image.src=s.path})));
 ready=true;shots.forEach((s,i)=>{const b=document.createElement('button');b.setAttribute('aria-label',`Plan ${i+1}`);const image=document.createElement('img');image.src=s.path;image.alt='';const label=document.createElement('span');label.textContent=`0${i+1}`;b.append(image,label);b.addEventListener('click',()=>go(i));$('shots').append(b)});
 render();$('status').textContent=`Prêt · ${count} étapes · lecture de ${total} secondes ou navigation avec les flèches.`;
}catch(error){pause();$('error').hidden=false;$('error').textContent='Une illustration est indisponible. Rechargez cet aperçu pour réessayer.';$('status').textContent='Chargement incomplet : lecture désactivée.'}

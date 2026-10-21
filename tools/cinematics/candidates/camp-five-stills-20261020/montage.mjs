const $=id=>document.getElementById(id);
const shots=[
 {title:'Le camp, avant le départ',description:'Très large · le lieu',start:0,duration:4},
 {title:'Ce que chacun porte',description:'Plan rapproché · les préparatifs',start:4,duration:3},
 {title:'Dans l’allée',description:'Ensemble trois-quarts · le trio',start:7,duration:5},
 {title:'Un regard partagé',description:'Plan rapproché · les regards',start:12,duration:4},
 {title:'Avant de franchir la porte',description:'Plan large · l’arrêt avant le dialogue',start:16,duration:4}
].map((s,i)=>({...s,path:`shot-0${i+1}.png`}));
const reduce=matchMedia('(prefers-reduced-motion: reduce)'),images=[];
let time=0,playing=false,ready=false,start=0,raf=0;
const index=()=>time<4?0:time<7?1:time<12?2:time<16?3:4;
function render(){
 const i=index(),shot=shots[i];if($('picture').getAttribute('src')!==shot.path)$('picture').src=shot.path;
 const fadeDuration=reduce.matches?.8:1.2;
 const progress=i===4?0:Math.min(1,Math.max(0,(time-(shot.start+shot.duration-fadeDuration))/fadeDuration));
 const blend=progress*progress*(3-2*progress),incoming=$('incoming');
 if(i<4&&incoming.getAttribute('src')!==shots[i+1].path)incoming.src=shots[i+1].path;
 // Opaque outgoing image underneath the incoming layer avoids a black dip.
 // Timeline-driven opacity means pause, seek and hidden suspend freeze the dissolve too.
 $('picture').style.opacity='1';incoming.style.opacity=String(blend);
 $('picture').alt=shot.title;$('number').textContent=`0${i+1} / 05`;$('title').textContent=shot.title;$('description').textContent=shot.description;
 $('time').textContent=`${time.toFixed(1).replace('.',',')} / 20,0 s`;$('seek').value=String(time);$('seek').setAttribute('aria-valuetext',`${Math.round(time)} secondes, plan ${i+1} sur 5`);
 $('play').textContent=playing?'Pause':time>=20?'Relire le montage':'Lire le montage';
 for(const id of ['play','previous','next','seek'])$(id).disabled=!ready;
 [...$('shots').children].forEach((b,n)=>b.setAttribute('aria-current',String(n===i)));
}
function pause(message){playing=false;cancelAnimationFrame(raf);raf=0;render();if(message)$('status').textContent=message}
function tick(now){if(!playing)return;time=Math.min(20,(now-start)/1000);render();if(time>=20){pause('Fin du montage. Vous pouvez le relire ou choisir un plan.');return}raf=requestAnimationFrame(tick)}
function toggle(){if(playing){pause('Lecture en pause.');return}if(!ready)return;if(time>=20)time=0;playing=true;start=performance.now()-time*1000;render();$('status').textContent='Lecture des cinq plans, sur demande.';raf=requestAnimationFrame(tick)}
function seek(value){pause();time=Math.min(20,Math.max(0,value));render();$('status').textContent=`Plan ${index()+1} sur 5, en pause.`}
function go(i){seek(shots[Math.max(0,Math.min(4,i))].start)}
$('play').addEventListener('click',toggle);$('previous').addEventListener('click',()=>go(index()-1));$('next').addEventListener('click',()=>go(index()+1));$('seek').addEventListener('input',e=>seek(Number(e.target.value)));
document.addEventListener('keydown',e=>{if(/^(INPUT|BUTTON|SELECT|SUMMARY|TEXTAREA)$/.test(e.target.tagName)||e.altKey||e.ctrlKey||e.metaKey)return;if(e.code==='Space'){e.preventDefault();toggle()}if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();go(e.key==='Home'?0:e.key==='End'?4:index()+(e.key==='ArrowLeft'?-1:1))}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause('Lecture suspendue pendant que cet aperçu est masqué.')});window.addEventListener('pagehide',()=>pause());
function reduction(){ $('motion-note').hidden=!reduce.matches;if(playing)pause('Préférence de mouvement modifiée : lecture en pause.') }reduce.addEventListener('change',reduction);reduction();
try{
 await Promise.all(shots.map((s,i)=>new Promise((resolve,reject)=>{const image=new Image();images[i]=image;image.onload=async()=>{try{await image.decode();resolve()}catch(error){reject(error)}};image.onerror=()=>reject(new Error(s.path));image.src=s.path})));
 ready=true;shots.forEach((s,i)=>{const b=document.createElement('button');b.setAttribute('aria-label',`Plan ${i+1} : ${s.title}`);const image=document.createElement('img');image.src=s.path;image.alt='';const label=document.createElement('span');label.textContent=`0${i+1} · ${s.title}`;b.append(image,label);b.addEventListener('click',()=>go(i));$('shots').append(b)});
 render();$('status').textContent='Prêt · cinq plans · lecture de 20 secondes ou navigation avec les flèches.';
}catch(error){pause();$('error').hidden=false;$('error').textContent='Une illustration est indisponible. Rechargez cet aperçu pour réessayer.';$('status').textContent='Chargement incomplet : lecture désactivée.'}

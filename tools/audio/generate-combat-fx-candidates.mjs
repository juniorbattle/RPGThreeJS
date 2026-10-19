/** Offline, original synthetic candidates. Never imported by the game; no provider or sampled recording. */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const output = resolve(process.argv[2] ?? 'public/assets/audio/combat-fx-v1');
if (existsSync(output)) throw new Error('Choose a new candidate directory; never overwrite a reviewed pack');
const rate = 48000, tau = 2 * Math.PI;
let seed = 0x71ca902d;
function noise() { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 0xffffffff * 2 - 1; }
function tone(t, start, frequency, decay, gain = 1, slide = 0) {
  const u = t - start;
  return u < 0 ? 0 : gain * Math.exp(-u / decay) * Math.sin(tau * (frequency * u + slide * u * u / 2));
}
const definitions = [
 {id:'step',label:'Pas tactique',seconds:.11,target:.12,use:'Une étape animée, cadence bornée ; aucun trajet physique sur la carte.',sample:(t,n)=>tone(t,0,110,.016,.6)+n*Math.exp(-t/.018)*.7},
 {id:'light-blade',label:'Lame légère',seconds:.18,target:.16,use:'Départ réel de frappe légère, distinct du résultat.',sample:(t,n)=>n*Math.sin(Math.PI*t/.18)*Math.exp(-t/.07)*.7+tone(t,0,720,.035,.2,-2000)},
 {id:'heavy-weapon',label:'Arme lourde',seconds:.28,target:.18,use:'Départ de frappe lourde ; ne prouve pas une touche.',sample:(t,n)=>n*Math.sin(Math.PI*t/.28)*Math.exp(-t/.09)*.65+tone(t,0,130,.06,.8,-100)},
 {id:'thrust',label:'Estoc de lance',seconds:.21,target:.16,use:'Estoc exécuté, sans nouvelle règle de portée.',sample:(t,n)=>n*Math.exp(-t/.045)*.6+tone(t,0,970,.035,.35,-2300)},
 {id:'bow-release',label:'Lâcher de flèche',seconds:.2,target:.15,use:'Départ de projectile existant.',sample:(t,n)=>tone(t,0,270,.055,.8,-300)+n*Math.exp(-t/.03)*.3},
 {id:'magic-cast',label:'Départ magique',seconds:.34,target:.16,use:'Action magique lancée ; aucune attente audio.',sample:(t,n)=>tone(t,0,220,.1,.65,1700)+tone(t,.03,440,.08,.3,1500)+n*Math.exp(-t/.07)*.08},
 {id:'magic-impact',label:'Impact magique',seconds:.29,target:.18,use:'Dégâts magiques réellement appliqués.',sample:(t,n)=>tone(t,0,180,.065,.65,-300)+tone(t,0,870,.04,.3,-1100)+n*Math.exp(-t/.05)*.55},
 {id:'physical-impact',label:'Impact physique',seconds:.17,target:.18,use:'Dégâts réels ; pas un clic de ciblage.',sample:(t,n)=>tone(t,0,115,.03,.8,-100)+tone(t,0,730,.015,.25)+n*Math.exp(-t/.017)*.8},
 {id:'miss',label:'Raté',seconds:.24,target:.13,use:'Branche ratée existante, sans son de touche réussie.',sample:(t,n)=>n*Math.sin(Math.PI*t/.24)*Math.exp(-t/.065)*.6+tone(t,0,390,.04,.15,-900)},
 {id:'critical',label:'Accent critique',seconds:.3,target:.19,use:'Critique déjà résolu, prioritaire sur impact générique.',sample:(t,n)=>tone(t,0,145,.04,.8)+tone(t,.018,1220,.06,.5)+tone(t,.018,1910,.035,.2)+n*Math.exp(-t/.025)*.65},
 {id:'status-negative',label:'Altération appliquée',seconds:.31,target:.14,use:'Présence ou durée de malus réellement changée.',sample:(t,n)=>tone(t,0,310,.075,.7,-700)+tone(t,0,337,.05,.3,-600)+n*Math.exp(-t/.03)*.08},
 {id:'support',label:'Soutien effectif',seconds:.34,target:.14,use:'Bonus, PA ou purification réellement appliqués.',sample:t=>tone(t,0,420,.075,.7,250)+tone(t,.04,840,.08,.25,400)},
 {id:'knockout',label:'K.O.',seconds:.43,target:.18,use:'Transition vivant vers K.O. ; aucune voix.',sample:(t,n)=>tone(t,0,150,.1,.9,-170)+tone(t,.045,72,.09,.45)+n*Math.exp(-t/.045)*.35},
 {id:'player-turn',label:'À vous de jouer',seconds:.18,target:.11,use:'Main rendue au joueur, pas chaque tour ennemi.',sample:t=>tone(t,0,520,.035,.7)+tone(t,.035,780,.04,.35)},
 {id:'victory',label:'Victoire',seconds:.68,target:.17,use:'Court effet de résultat, pas une musique ni une récompense.',sample:t=>tone(t,0,392,.07,.55)+tone(t,.07,587.3,.09,.5)+tone(t,.16,784,.11,.45)},
 {id:'defeat',label:'Défaite',seconds:.64,target:.16,use:'Issue réelle, sans modifier la restauration de sauvegarde.',sample:t=>tone(t,0,330,.07,.6)+tone(t,.075,247,.09,.55)+tone(t,.17,165,.12,.4)},
];
function wave(samples) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24); buffer.writeUInt32LE(rate * 2, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36); buffer.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((value, index) => buffer.writeInt16LE(Math.round(value * 32767), 44 + index * 2));
  return buffer;
}
mkdirSync(output, { recursive: true });
const candidates = [], playlist = [];
for (const definition of definitions) {
  const samples = Array.from({ length: Math.round(definition.seconds * rate) }, (_, i) => {
    const t = i / rate;
    return definition.sample(t, noise()) * Math.min(1, t / 0.003, (definition.seconds - t - 1 / rate) / 0.008);
  });
  const maximum = Math.max(...samples.map(Math.abs));
  for (let i = 0; i < samples.length; i++) samples[i] *= definition.target / maximum;
  const bytes = wave(samples), file = `${definition.id}.wav`;
  writeFileSync(resolve(output, file), bytes, { flag: 'wx' });
  const decoded = samples.map((_, i) => bytes.readInt16LE(44 + i * 2) / 32768);
  if (!decoded.every(Number.isFinite) || decoded[0] !== 0 || decoded.at(-1) !== 0) throw new Error(`Invalid boundary ${file}`);
  const peak = Math.max(...decoded.map(Math.abs)), rms = Math.sqrt(decoded.reduce((a, n) => a + n * n, 0) / decoded.length);
  if (peak >= 0.25 || rms <= 0 || bytes.readUInt32LE(40) !== decoded.length * 2) throw new Error(`Invalid PCM ${file}`);
  candidates.push({ id: definition.id, label: definition.label, use: definition.use, file, seconds: definition.seconds,
    bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), peakDbfs: 20 * Math.log10(peak), rmsDbfs: 20 * Math.log10(rms) });
  playlist.push(...samples, ...Array(rate).fill(0));
}
writeFileSync(resolve(output, 'preview-all.wav'), wave(playlist), { flag: 'wx' });
const manifest = { status: 'COMBAT_CANDIDATES_ART_ACCEPTANCE_PENDING', generatedAt: new Date().toISOString(),
  method: 'Original deterministic modal oscillators and seeded noise, PCM16 mono 48000Hz; no model, provider, external samples or recordings',
  generator: 'tools/audio/generate-combat-fx-candidates.mjs', generatorSha256: createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),
  authority: 'OD-2026-10-19-B direct Okay go: bounded16family combat FX production candidates',
  limits: 'Bounded combat candidates authorized for integration under set1.7.0; operator artistic acceptance pending. No music, voices, ambient loops, Ultimates or cinematic audio.', candidates };
writeFileSync(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
writeFileSync(resolve(output, 'index.html'), `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>RPGThreeJS — Écoute des sons FX candidats</title><style>body{margin:0;background:#101f2b;color:#f4e6c9;font:18px system-ui;line-height:1.5}main{max-width:850px;margin:32px auto;padding:24px}button,input{font:inherit}button{padding:12px;background:#e2c589;color:#15232c;border:0;border-radius:5px;cursor:pointer}button:focus-visible,input:focus-visible{outline:3px solid #99e2ec;outline-offset:4px}li{padding:18px 0;border-bottom:1px solid #536270}small{display:block;color:#c7d1d9}audio{max-width:100%;margin-top:8px}a{color:#b9e6ed}</style><main><h1>Sons FX — premier lot à écouter</h1><p>Seize candidats de combat synthétisés localement et intégrés dans le lot dédié. Acceptation artistique encore ouverte. Les timbres, niveaux et répétitions restent à juger à l’écoute.</p><p><button id="all">Écouter les seize</button> <button id="stop">Arrêter</button></p><label>Volume <input id="volume" type="range" min="0" max="1" step="0.05" value="0.5"></label><p id="status" role="status">Lecture uniquement sur demande.</p><ol>${candidates.map(c => `<li><b>${c.label}</b> · ${Math.round(c.seconds * 1000)} ms<small>${c.use}</small><audio controls preload="none" src="${c.file}"></audio></li>`).join('')}</ol><p>Musique, voix et ambiances restent hors de ce lot. <a href="manifest.json">Provenance et mesures PCM</a></p></main><script>const sounds=[...document.querySelectorAll('audio')],volume=document.querySelector('#volume'),status=document.querySelector('#status');let generation=0;const stop=()=>{generation++;sounds.forEach(a=>{a.pause();a.currentTime=0});status.textContent='Lecture arrêtée.'};sounds.forEach((a,i)=>{a.volume=Number(volume.value);a.addEventListener('play',()=>{sounds.forEach(b=>{if(b!==a)b.pause()});status.textContent=a.closest('li').querySelector('b').textContent})});volume.oninput=()=>sounds.forEach(a=>a.volume=Number(volume.value));document.querySelector('#stop').onclick=stop;document.querySelector('#all').onclick=async()=>{stop();const token=generation;for(const a of sounds){if(token!==generation)break;a.currentTime=0;try{const ended=new Promise(r=>{a.addEventListener('ended',r,{once:true});a.addEventListener('pause',r,{once:true});a.addEventListener('error',r,{once:true})});await a.play();await ended}catch{status.textContent='Lecture indisponible : utilisez les lecteurs individuels.';break}}};document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});</script></html>`, { flag: 'wx' });
console.log(JSON.stringify({ output, candidates: candidates.length, status: manifest.status, peaksDbfs: candidates.map(c => [c.id, +c.peakDbfs.toFixed(2)]) }));

/** Offline, original synthetic candidates. Never imported by the game; no provider or sampled recording. */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const output = resolve(process.argv[2] ?? 'docs/media/audio/ui-fx-candidates-v1');
if (existsSync(output)) throw new Error('Choose a new candidate directory; never overwrite a reviewed pack');
const rate = 48000, tau = 2 * Math.PI;
let seed = 0x71ca902d;
function noise() { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 0xffffffff * 2 - 1; }
function tone(t, start, frequency, decay, gain = 1, slide = 0) {
  const u = t - start;
  return u < 0 ? 0 : gain * Math.exp(-u / decay) * Math.sin(tau * (frequency * u + slide * u * u / 2));
}
const definitions = [
  { id: 'navigate', label: 'Sélection', seconds: 0.075, target: 0.12, use: 'Changement explicite de POI ou onglet ; aucun survol ni focus automatique.',
    sample: (t, n) => tone(t, 0, 460, 0.014) + tone(t, 0, 1320, 0.009, 0.25) + n * Math.exp(-t / 0.006) * 0.18 },
  { id: 'confirm', label: 'Confirmer', seconds: 0.19, target: 0.20, use: 'Action acceptée et ouverture volontaire ; pas une promesse de sauvegarde.',
    sample: (t, n) => tone(t, 0, 580, 0.03) + tone(t, 0.028, 870, 0.043, 0.5) + n * Math.exp(-t / 0.005) * 0.16 },
  { id: 'back', label: 'Retour', seconds: 0.15, target: 0.16, use: 'Fermeture volontaire, Échap ou retour ; pas une annulation de faits déjà validés.',
    sample: (t, n) => tone(t, 0, 620, 0.025, 0.65, -1100) + tone(t, 0.022, 390, 0.027, 0.55) + n * Math.exp(-t / 0.022) * 0.1 },
  { id: 'refused', label: 'Action refusée', seconds: 0.22, target: 0.18, use: 'Refus explicite avec message visible ; jamais une simple arrivée du focus sur un bouton désactivé.',
    sample: (t, n) => tone(t, 0, 190, 0.028) + tone(t, 0.085, 180, 0.026, 0.7) + n * Math.exp(-t / 0.006) * 0.1 },
  { id: 'saved', label: 'Sauvegarde réussie', seconds: 0.34, target: 0.19, use: 'Confirmation manuelle après écriture réellement réussie ; autosauvegardes silencieuses.',
    sample: t => tone(t, 0, 660, 0.048, 0.7) + tone(t, 0.07, 990, 0.065, 0.6) + tone(t, 0.07, 1980, 0.025, 0.1) },
  { id: 'reward', label: 'Butin reçu', seconds: 0.46, target: 0.21, use: 'Affichage initial du résultat déjà accordé ; pas au rendu, à la fermeture ou au rechargement.',
    sample: t => tone(t, 0, 523.25, 0.05, 0.65) + tone(t, 0.065, 659.25, 0.055, 0.6) + tone(t, 0.13, 783.99, 0.075, 0.55) },
  { id: 'recover', label: 'Soins effectués', seconds: 0.43, target: 0.18, use: 'Potion ou repos réellement réussi ; ne déclenche aucun soin.',
    sample: (t, n) => tone(t, 0, 380, 0.09, 0.65, 680) + tone(t, 0.05, 760, 0.08, 0.22, 900) + n * Math.exp(-t / 0.065) * 0.025 },
  { id: 'travel-start', label: 'Départ sur la carte', seconds: 0.23, target: 0.17, use: 'Déplacement accepté, une seule fois au départ ; pas de boucle ni son simulant une route physique.',
    sample: (t, n) => tone(t, 0, 165, 0.022, 0.7) + tone(t, 0.09, 205, 0.022, 0.5) + n * (Math.exp(-t / 0.014) + (t >= 0.09 ? Math.exp(-(t - 0.09) / 0.012) * 0.6 : 0)) * 0.24 },
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
const manifest = { status: 'OFFLINE_CANDIDATES_NOT_RUNTIME_ACCEPTANCE', generatedAt: new Date().toISOString(),
  method: 'Original deterministic modal oscillators and seeded noise, PCM16 mono 48000Hz; no model, provider, external samples or recordings',
  generator: 'tools/audio/generate-ui-fx-candidates.mjs', generatorSha256: createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),
  authority: 'Direct operator request 2026-10-18: audit concrete FX needs and locations, generate simple sounds if possible',
  limits: 'Candidate listening only. Audio remains DEFERRED in game pending dedicated production exception. No music, voices, ambient loops or cinematic audio changes.', candidates };
writeFileSync(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
writeFileSync(resolve(output, 'index.html'), `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>RPGThreeJS — Écoute des sons FX candidats</title><style>body{margin:0;background:#101f2b;color:#f4e6c9;font:18px system-ui;line-height:1.5}main{max-width:850px;margin:32px auto;padding:24px}button,input{font:inherit}button{padding:12px;background:#e2c589;color:#15232c;border:0;border-radius:5px;cursor:pointer}button:focus-visible,input:focus-visible{outline:3px solid #99e2ec;outline-offset:4px}li{padding:18px 0;border-bottom:1px solid #536270}small{display:block;color:#c7d1d9}audio{max-width:100%;margin-top:8px}a{color:#b9e6ed}</style><main><h1>Sons FX — premier lot à écouter</h1><p>Huit candidats courts, synthétisés localement. Aucun son n’est activé dans le jeu. Les timbres, niveaux et répétitions restent à juger à l’écoute.</p><p><button id="all">Écouter les huit</button> <button id="stop">Arrêter</button></p><label>Volume <input id="volume" type="range" min="0" max="1" step="0.05" value="0.5"></label><p id="status" role="status">Lecture uniquement sur demande.</p><ol>${candidates.map(c => `<li><b>${c.label}</b> · ${Math.round(c.seconds * 1000)} ms<small>${c.use}</small><audio controls preload="none" src="${c.file}"></audio></li>`).join('')}</ol><p>Musique, voix, ambiances et sons de combat : lots séparés. <a href="manifest.json">Provenance et mesures PCM</a></p></main><script>const sounds=[...document.querySelectorAll('audio')],volume=document.querySelector('#volume'),status=document.querySelector('#status');let generation=0;const stop=()=>{generation++;sounds.forEach(a=>{a.pause();a.currentTime=0});status.textContent='Lecture arrêtée.'};sounds.forEach((a,i)=>{a.volume=Number(volume.value);a.addEventListener('play',()=>{sounds.forEach(b=>{if(b!==a)b.pause()});status.textContent=a.closest('li').querySelector('b').textContent})});volume.oninput=()=>sounds.forEach(a=>a.volume=Number(volume.value));document.querySelector('#stop').onclick=stop;document.querySelector('#all').onclick=async()=>{stop();const token=generation;for(const a of sounds){if(token!==generation)break;a.currentTime=0;try{const ended=new Promise(r=>{a.addEventListener('ended',r,{once:true});a.addEventListener('pause',r,{once:true});a.addEventListener('error',r,{once:true})});await a.play();await ended}catch{status.textContent='Lecture indisponible : utilisez les lecteurs individuels.';break}}};document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});</script></html>`, { flag: 'wx' });
console.log(JSON.stringify({ output, candidates: candidates.length, status: manifest.status, peaksDbfs: candidates.map(c => [c.id, +c.peakDbfs.toFixed(2)]) }));

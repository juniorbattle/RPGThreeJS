// Offline editorial study. No game imports, persistence, generation or truth writes.
const $ = (id) => document.getElementById(id);
const sources = {
  camp: '../../../../public/assets/generated/lion-phase/environments/demo-environment-pack-v1/cinematic-source/lion-camp-cinematic-source.png',
  entry: '../manual-p03-20261020/p03-support-v3.png',
  stop: '../manual-p03-20261020/p03-stop-v1.png',
};
const shots = [
  { start: 0, duration: 4, source: 'camp', crop: [0, 0, 1672, 941], title: 'Le camp', note: 'Une vue d’ensemble pour installer le lieu.' },
  { start: 4, duration: 3, source: 'entry', crop: [520, 260, 440, 247.5], title: 'Le détail', note: 'Le même instant, un autre cadre : le livre et l’équipement.' },
  { start: 7, duration: 5, source: 'entry', crop: [0, 0, 1672, 941], title: 'Le trio', note: 'Le groupe dans le camp. La pose reste une image fixe.' },
  { start: 12, duration: 4, source: 'stop', crop: [0, 0, 1672, 941], title: 'L’arrêt', note: 'Ellipse vers la pose d’arrêt, avant le dialogue existant.' },
];
const video = $('candidate'), seek = $('seek'), play = $('play'), image = $('scene-image');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let mode = 'images', imageTime = 0, playing = false, ready = false, raf = 0, previousTick = 0, currentSource = '';
let imageFailure = false, videoFailure = false, motionPreference = true;
const total = () => mode === 'images' ? 16 : (Number.isFinite(video.duration) ? video.duration : 10.125);
const time = () => mode === 'images' ? imageTime : video.currentTime;
const selectedShot = () => Math.max(0, shots.findLastIndex((shot) => imageTime >= shot.start));
const format = (value) => value.toFixed(1).replace('.', ',');
const announce = (message) => { $('play-status').textContent = message; };

function render() {
  seek.max = String(total());
  seek.value = String(time());
  seek.setAttribute('aria-valuetext', `${format(time())} secondes sur ${format(total())}`);
  $('clock').textContent = `${format(time())} / ${format(total())} s`;
  play.textContent = playing ? 'Pause' : time() >= total() ? 'Relire' : 'Lire le montage';
  if (mode === 'video' && !playing && time() < total()) play.textContent = 'Lire la vidéo';
  play.disabled = mode === 'images' ? !ready || imageFailure : videoFailure;
  $('previous').disabled = $('next').disabled = mode !== 'images' || !ready;
  if (mode !== 'images') return;
  const index = selectedShot(), shot = shots[index];
  if (currentSource !== shot.source) { image.setAttribute('href', sources[shot.source]); currentSource = shot.source; }
  const phase = Math.min(1, Math.max(0, (imageTime - shot.start) / shot.duration));
  // Small whole-image framing only. Never animate actors or substitute this for gait.
  const push = $('camera-motion').checked && !reduced.matches ? 1 + 0.018 * (phase * phase * (3 - 2 * phase)) : 1;
  const [x, y, w, h] = shot.crop, width = w / push, height = h / push;
  $('illustration').setAttribute('viewBox', [x + (w - width) / 2, y + (h - height) / 2, width, height].join(' '));
  $('scene-title').textContent = `${shot.title} — image fixe, ${shot.note}`;
  $('shot-number').textContent = `0${index + 1} / 04`;
  $('shot-label').textContent = shot.title;
  $('shot-note').textContent = shot.note;
  document.querySelectorAll('[data-shot]').forEach((button, i) => {
    if (i === index) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
  });
}

function pause(message) {
  playing = false;
  cancelAnimationFrame(raf);
  raf = 0;
  video.pause();
  render();
  if (message) announce(message);
}

function tick(now) {
  if (!playing || mode !== 'images') return;
  imageTime = Math.min(16, imageTime + (now - previousTick) / 1000);
  previousTick = now;
  render();
  if (imageTime >= 16) { pause('Fin du montage. Vous pouvez le relire ou comparer avec la vidéo05.'); return; }
  raf = requestAnimationFrame(tick);
}

async function togglePlay() {
  if (playing) { pause('Lecture en pause.'); return; }
  if (play.disabled) return;
  if (time() >= total()) { if (mode === 'images') imageTime = 0; else video.currentTime = 0; }
  if (mode === 'video') {
    // Set before awaiting, so switching surfaces while play() resolves still pauses it.
    playing = true;
    try { video.playbackRate = 1; await video.play(); }
    catch { pause('Lecture vidéo indisponible. Le montage illustré reste accessible.'); return; }
    if (mode !== 'video' || !playing) { video.pause(); return; }
  } else {
    playing = true;
    previousTick = performance.now();
    raf = requestAnimationFrame(tick);
  }
  render();
  announce(mode === 'images' ? 'Lecture du montage illustré.' : 'Lecture du candidat05 à vitesse normale.');
}

function changeMode(next) {
  if (next === mode) return;
  pause();
  mode = next;
  // A preload can fail before module listeners attach. Inspect the native media state too.
  if (mode === 'video') videoFailure ||= Boolean(video.error || video.networkState === video.NETWORK_NO_SOURCE);
  $('illustration').toggleAttribute('hidden', mode !== 'images');
  video.hidden = mode !== 'video';
  $('images-mode').setAttribute('aria-pressed', String(mode === 'images'));
  $('video-mode').setAttribute('aria-pressed', String(mode === 'video'));
  document.querySelector('.chapters').hidden = mode !== 'images';
  document.querySelector('.motion-option').hidden = mode !== 'images';
  const failed = mode === 'images' ? imageFailure : videoFailure;
  $('media-error').hidden = !failed;
  $('media-error').textContent = mode === 'images' ? 'Une image est indisponible. Réessayez en rechargeant cet aperçu.' : 'Vidéo locale indisponible. Le montage illustré reste accessible.';
  if (mode === 'video') {
    $('shot-number').textContent = 'VIDÉO 05';
    $('shot-label').textContent = 'Le pilote continu';
    $('shot-note').textContent = 'Original silencieux · 1× · marche non validée.';
  }
  render();
  announce(mode === 'images' ? 'Montage illustré sélectionné, en pause.' : 'Candidat05 sélectionné, en pause.');
}

function goToShot(index) {
  pause();
  imageTime = shots[Math.max(0, Math.min(shots.length - 1, index))].start;
  render();
  announce(`Plan ${selectedShot() + 1} : ${shots[selectedShot()].title}.`);
}
play.addEventListener('click', togglePlay);
$('images-mode').addEventListener('click', () => changeMode('images'));
$('video-mode').addEventListener('click', () => changeMode('video'));
$('previous').addEventListener('click', () => goToShot(selectedShot() - 1));
$('next').addEventListener('click', () => goToShot(selectedShot() + 1));
document.querySelectorAll('[data-shot]').forEach((button) => button.addEventListener('click', () => goToShot(Number(button.dataset.shot))));
seek.addEventListener('input', () => { const target = Number(seek.value); pause(); if (mode === 'images') imageTime = target; else video.currentTime = target; render(); });
$('camera-motion').addEventListener('change', () => { motionPreference = $('camera-motion').checked; render(); });
function reflectReduction() {
  $('camera-motion').disabled = reduced.matches;
  $('camera-motion').checked = !reduced.matches && motionPreference;
  $('motion-label').textContent = reduced.matches ? 'Cadrages fixes (système)' : 'Recadrage doux';
  $('camera-motion').closest('label').title = reduced.matches ? 'Réduction des mouvements du système active : cadrages fixes.' : 'Déplacement léger du cadre entier, sans animation des personnages.';
  render();
}
reduced.addEventListener('change', reflectReduction);
video.addEventListener('timeupdate', () => { if (mode === 'video') render(); });
video.addEventListener('loadedmetadata', () => { if (mode === 'video') render(); });
video.addEventListener('ended', () => { if (mode === 'video') pause('Fin du candidat05.'); });
function handleVideoError() {
  videoFailure = true;
  if (mode === 'video') { pause(); $('media-error').hidden = false; $('media-error').textContent = 'Vidéo locale indisponible. Le montage illustré reste accessible.'; }
}
video.addEventListener('error', handleVideoError);
video.querySelector('source').addEventListener('error', handleVideoError);
document.addEventListener('visibilitychange', () => { if (document.hidden) pause('Lecture suspendue lorsque cet aperçu est masqué.'); });
window.addEventListener('pagehide', () => pause());
document.addEventListener('keydown', (event) => {
  if (/^(INPUT|BUTTON|SUMMARY|SELECT|TEXTAREA)$/u.test(event.target.tagName) || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.code === 'Space') { event.preventDefault(); togglePlay(); }
  if (mode === 'images' && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    goToShot(event.key === 'Home' ? 0 : event.key === 'End' ? 3 : selectedShot() + (event.key === 'ArrowLeft' ? -1 : 1));
  }
});

reflectReduction();
try {
  await Promise.all(Object.values(sources).map((src) => new Promise((resolve, reject) => {
    const img = new Image(); img.onload = resolve; img.onerror = reject; img.src = src;
  })));
  ready = true;
  render();
  announce('Prêt · 16 s proposées · Espace pour lire, flèches pour changer de plan.');
} catch {
  imageFailure = true;
  if (mode === 'images') {
    $('media-error').hidden = false;
    $('media-error').textContent = 'Une image est indisponible. Réessayez en rechargeant cet aperçu.';
  }
  announce('Image manquante ; la comparaison vidéo reste sélectionnable.');
  render();
}

/**
 * Measurement and frame-strip probe for the runtime cinematics (living tableaux and the opening), OD-2026-11-14-A. Dev
 * only, served by the Vite dev server: it imports the real scripts and painters, steps them on a fixed clock, records
 * where every figure is drawn (by wrapping FigureCast.draw and ExtraCrowd.draw), and composes frames the way the player
 * does. Run with measure.mjs and strips.mjs against a running dev server (BASE, default http://localhost:5186).
 */
import { ExtraCrowd, FigureCast, type Extra, type Placed, type DepthScale } from '../../src/ui/living/livingFigures';
import { cameraAt, OPENING_FRAME, OPENING_SHOTS, OPENING_CAST, OPENING_ADVISERS, OPENING_POLE_CRACKS_AT, OPENING_POLE_LANDS_AT, OPENING_BARS_OPEN_AT, OPENING_ACTOR_FADE_AT, type ImageFrame, type ViewCamera } from '../../src/ui/opening/openingShots';
import { LIVING_TABLEAUX } from '../../src/ui/living/livingTableaux';
import { POST_DEMO_LIVING_TABLEAUX } from '../../src/ui/living/postDemoLiving';
import { LivingTableauPlayer, type LivingScript, type LivingShot } from '../../src/ui/living/LivingTableauPlayer';
import { OpeningSequence } from '../../src/ui/opening/OpeningSequence';
import { createShotPainter, type SheetBook, type ShotPainter } from '../../src/ui/opening/openingPainters';

const smooth = (v: number) => { const x = Math.min(1, Math.max(0, v)); return x * x * (3 - 2 * x); };
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

interface Rec { figs: Array<{ key: string; id: string; x: number; y: number; shown: number; kind: 'actor' | 'extra'; h: number }> }
let REC: Rec | null = null;

const castDraw = FigureCast.prototype.draw;
FigureCast.prototype.draw = function (props: CanvasRenderingContext2D, cast: readonly Placed[], seconds: number) {
  if (REC) {
    const seen = new Map<string, number>();
    for (const f of cast) { const n = seen.get(f.id) ?? 0; seen.set(f.id, n + 1); REC.figs.push({ key: `a:${f.id}#${n}`, id: f.id, x: f.x, y: f.y, shown: f.shown, kind: 'actor', h: f.art.entry.cell[1] * f.scale }); }
  }
  return castDraw.call(this, props, cast, seconds);
};
const crowdDraw = ExtraCrowd.prototype.draw;
ExtraCrowd.prototype.draw = function (props: CanvasRenderingContext2D, extras: readonly Extra[], seconds: number, dt: number, reduced: boolean, depth: DepthScale) {
  if (REC) extras.forEach((extra, index) => {
    const standing = extra.from[0] === extra.to[0] && extra.from[1] === extra.to[1];
    if (reduced && !standing) return;
    const p = (seconds - extra.at) / extra.seconds;
    if (!standing && (p <= 0 || p >= 1)) return;
    const q = clamp01(p);
    const x = extra.from[0] + (extra.to[0] - extra.from[0]) * q, y = extra.from[1] + (extra.to[1] - extra.from[1]) * q;
    const shown = standing ? smooth((seconds - (reduced ? extra.at * 0.45 : extra.at)) / 1.2) : smooth(p / 0.12) * smooth((1 - p) / 0.18);
    const art = (this as unknown as { sheets: Map<string, { entry: { cell: [number, number] } }> }).sheets.get(extra.id); REC!.figs.push({ key: `e:${index}`, id: extra.id, x, y, shown, kind: 'extra', h: (art?.entry.cell[1] ?? 0) * depth(y) * 1.3 });
  });
  return crowdDraw.call(this, props, extras, seconds, dt, reduced, depth);
};

const W = 1366, H = 768;
const BAR = Math.max(H * 0.11, (H - W / 2) / 2);

export const SCRIPTS: Record<string, LivingScript> = { ...LIVING_TABLEAUX, ...POST_DEMO_LIVING_TABLEAUX };

async function sheetsOf(script: LivingScript, reduced: boolean): Promise<SheetBook> {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-99999px;top:0;width:10px;height:10px;overflow:hidden;visibility:hidden';
  document.body.append(host);
  const player = new LivingTableauPlayer(host);
  void player.open(script, { reducedMotion: reduced });
  await player.ready;
  const sheets = new Map((player as unknown as { sheets: Map<string, unknown> }).sheets) as unknown as SheetBook;
  player.close();
  host.remove();
  return sheets;
}

let openingSheets: SheetBook | null = null;
async function sheetsOfOpening(): Promise<SheetBook> {
  if (openingSheets) return openingSheets;
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-99999px;top:0;width:10px;height:10px;overflow:hidden;visibility:hidden';
  document.body.append(host);
  const sequence = new OpeningSequence(host);
  void sequence.open({ reducedMotion: false });
  await (sequence as unknown as { ready: Promise<void> }).ready;
  openingSheets = new Map((sequence as unknown as { sheets: Map<string, unknown> }).sheets) as unknown as SheetBook;
  sequence.close();
  host.remove();
  return openingSheets;
}

/** Screen speed of the picture under the camera: the fastest of the four view corners, in px/s. */
function cameraSpeed(a: ViewCamera, b: ViewCamera, dt: number): number {
  let best = 0;
  for (const [cx, cy] of [[0, BAR], [W, BAR], [0, H - BAR], [W, H - BAR], [W / 2, H / 2]] as const) {
    const px = (cx - a.x) / a.scale, py = (cy - a.y) / a.scale;
    const nx = b.x + px * b.scale, ny = b.y + py * b.scale;
    best = Math.max(best, Math.hypot(nx - cx, ny - cy) / dt);
  }
  return best;
}

type ShotWithScene = LivingShot & { scene?: { turn?: { alpha(s: number): number }; gust?: (s: number) => number } };

export interface ShotMeasure {
  script: string; shot: string; index: number; seconds: number;
  firstFigure: { t: number; label: string } | null;
  firstMove: { t: number; label: string } | null;
  firstCamera: number | null;
  firstLight: { t: number; label: string } | null;
  firstEvent: { t: number; label: string } | null;
  events: Array<{ t: number; label: string }>;
  gaps: Array<[number, number]>;
  gapsWithCamera: Array<[number, number]>;
  peakCamera: number;
}

const FPS = 30;
const MOVE_PX_S = 8, CAMERA_PX_S = 15, SHOWN_MIN = 0.3;

function visibleOnScreen(x: number, y: number, camera: ViewCamera): { sx: number; sy: number; on: boolean } {
  const sx = camera.x + x * camera.scale, sy = camera.y + y * camera.scale;
  return { sx, sy, on: sx >= 0 && sx <= W && sy >= BAR + 10 && sy <= H - BAR + 70 };
}

function gapsOf(active: boolean[], seconds: number, min = 2): Array<[number, number]> {
  const gaps: Array<[number, number]> = [];
  let start = -1;
  for (let i = 0; i <= active.length; i += 1) {
    const on = i < active.length ? active[i] : true;
    if (!on && start < 0) start = i;
    if (on && start >= 0) {
      const a = start / FPS, b = Math.min(seconds, i / FPS);
      if (b - a >= min) gaps.push([+a.toFixed(2), +b.toFixed(2)]);
      start = -1;
    }
  }
  return gaps;
}

/** Steps one shot of a living tableau on a fixed clock and lists what visibly happens. */
export async function measureScript(id: string, reduced = false): Promise<ShotMeasure[]> {
  const script = SCRIPTS[id]!;
  const sheets = await sheetsOf(script, reduced);
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const out: ShotMeasure[] = [];
  script.shots.forEach((shot, index) => {
    const painter = script.painter(shot.id, sheets);
    const scene = (shot as ShotWithScene).scene;
    const steps = Math.round(shot.seconds * FPS);
    const states = new Map<string, { visible: boolean; sx: number; sy: number; shown: number; appeared: boolean; moving: boolean }>();
    const events: Array<{ t: number; label: string }> = [];
    const figureActive: boolean[] = [];
    const cameraActive: boolean[] = [];
    let prevCam: ViewCamera | null = null, prevTurn = scene?.turn?.alpha(0) ?? 0, prevGust = scene?.gust?.(0) ?? 1;
    let peak = 0;
    for (let i = 0; i < steps; i += 1) {
      const t = i / FPS;
      const camera = cameraAt(shot, reduced ? 1 : t / shot.seconds, W, H, BAR, shot.frame);
      REC = { figs: [] };
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      painter({ ctx, width: W, height: H, seconds: t, dt: 1 / FPS, camera, reduced });
      const rec = REC; REC = null;
      let active = false;
      for (const f of rec.figs) {
        const { sx, sy, on } = visibleOnScreen(f.x, f.y, camera);
        const visible = on && f.shown >= SHOWN_MIN && f.h * camera.scale >= 30;
        const prev = states.get(f.key);
        const label = `${f.kind === 'extra' ? 'figurant ' : ''}${f.id}`;
        const state = prev ?? { visible: false, sx, sy, shown: f.shown, appeared: false, moving: false };
        if (visible && !state.appeared) { state.appeared = true; events.push({ t: +t.toFixed(2), label: `${label} apparaît` }); }
        const rising = prev ? f.shown - prev.shown > 0.004 : false;
        state.visible = visible; state.shown = f.shown;
        // Moving in image space (walking), not carried by the camera.
        const imageMove = (state as unknown as { ix?: number; iy?: number });
        const imgSpeed = imageMove.ix === undefined ? 0 : Math.hypot(f.x - imageMove.ix, f.y - (imageMove.iy ?? f.y)) * camera.scale * FPS;
        imageMove.ix = f.x; imageMove.iy = f.y;
        const moving = visible && imgSpeed > MOVE_PX_S;
        if (moving && !state.moving && state.appeared && !events.some(e => e.label.startsWith(label) && e.label.endsWith('marche'))) events.push({ t: +t.toFixed(2), label: `${label} marche` });
        state.moving = moving;
        if (visible && (moving || rising)) active = true;
        states.set(f.key, state);
      }
      const turn = scene?.turn?.alpha(t) ?? 0, gust = scene?.gust?.(t) ?? 1;
      if (i > 0 && (Math.abs(turn - prevTurn) * FPS > 0.02 && turn > 0.02)) { active = true; if (!events.some(e => e.label === 'la lumière tourne')) events.push({ t: +t.toFixed(2), label: 'la lumière tourne' }); }
      if (i > 0 && Math.abs(gust - prevGust) * FPS > 0.08) { active = true; if (!events.some(e => e.label === 'le vent monte')) events.push({ t: +t.toFixed(2), label: 'le vent monte' }); }
      prevTurn = turn; prevGust = gust;
      const cam = prevCam ? cameraSpeed(prevCam, camera, 1 / FPS) : 0;
      peak = Math.max(peak, cam);
      prevCam = camera;
      figureActive.push(active);
      cameraActive.push(active || cam >= CAMERA_PX_S);
    }
    const camT = (() => { let p: ViewCamera | null = null; for (let i = 0; i < steps; i += 1) { const c = cameraAt(shot, reduced ? 1 : i / FPS / shot.seconds, W, H, BAR, shot.frame); if (p && cameraSpeed(p, c, 1 / FPS) >= CAMERA_PX_S) return +(i / FPS).toFixed(2); p = c; } return null; })();
    events.sort((a, b) => a.t - b.t);
    const firstFigure = events.find(e => e.label.endsWith('apparaît')) ?? null;
    const firstMove = events.find(e => e.label.endsWith('marche')) ?? null;
    const firstLight = events.find(e => e.label === 'la lumière tourne' || e.label === 'le vent monte') ?? null;
    const candidates = [events[0], camT !== null ? { t: camT, label: 'la caméra se voit bouger' } : undefined].filter(Boolean) as Array<{ t: number; label: string }>;
    candidates.sort((a, b) => a.t - b.t);
    out.push({
      script: id, shot: shot.id, index, seconds: shot.seconds, firstFigure, firstMove, firstCamera: camT, firstLight,
      firstEvent: candidates[0] ?? null, events, gaps: gapsOf(figureActive, shot.seconds), gapsWithCamera: gapsOf(cameraActive, shot.seconds), peakCamera: Math.round(peak),
    });
  });
  return out;
}

/** The opening's events, read from its own constants (its painters draw their figures themselves), plus its camera. */
export function measureOpening(): ShotMeasure[] {
  const march = [0, 0.6, 1.2, 1.9, 2.7, 3.4, 4.2, 5, 5.9, 6.8, 7.6, 8.5];
  const extra: Record<string, Array<{ t: number; label: string }>> = {
    prologue_fall: [{ t: OPENING_POLE_CRACKS_AT, label: 'la hampe se brise' }, { t: OPENING_POLE_LANDS_AT, label: 'la bannière tombe au sol' }],
    prologue_seals: [],
    prologue_lion: march.map((t, k) => ({ t: Math.max(0.05, t), label: `pillard ${k + 1} sort de la porte` })),
    prologue_shadow: [{ t: 0.05, label: 'silhouettes sur l’aqueduc (en marche dès l’image 1)' }, { t: 1.2, label: 'les marques s’allument' }],
    prologue_departure: [
      ...OPENING_CAST.map(h => ({ t: h.at, label: `${h.id} entre` })),
      { t: OPENING_ACTOR_FADE_AT, label: 'les héros s’effacent' },
      ...OPENING_ADVISERS.map(h => ({ t: h.at, label: `${h.id} apparaît` })),
      { t: OPENING_BARS_OPEN_AT, label: 'les bandes s’ouvrent' },
    ],
  };
  return OPENING_SHOTS.map((shot, index) => {
    const events = [...shot.lines.map(l => ({ t: l.at, label: `légende « ${l.text.slice(0, 28)}… »` })), ...(extra[shot.id] ?? [])].sort((a, b) => a.t - b.t);
    let camT: number | null = null, prev: ViewCamera | null = null, peak = 0;
    const steps = Math.round(shot.seconds * FPS);
    const camActive: boolean[] = [];
    for (let i = 0; i < steps; i += 1) {
      const c = cameraAt(shot, i / FPS / shot.seconds, W, H, BAR);
      const s = prev ? cameraSpeed(prev, c, 1 / FPS) : 0;
      peak = Math.max(peak, s);
      if (camT === null && s >= CAMERA_PX_S) camT = +(i / FPS).toFixed(2);
      camActive.push(s >= CAMERA_PX_S);
      prev = c;
    }
    // Activity: an event lasts 1.5 s; a march or a walk lasts as long as it moves.
    const active = Array.from({ length: steps }, (_, i) => {
      const t = i / FPS;
      if (shot.id === 'prologue_lion' || shot.id === 'prologue_shadow') return true;
      if (shot.id === 'prologue_departure' && t >= 0.4 && t <= 6.5) return true;
      return events.some(e => t >= e.t && t <= e.t + 1.5);
    });
    const candidates = [events[0], camT !== null ? { t: camT, label: 'la caméra se voit bouger' } : undefined].filter(Boolean) as Array<{ t: number; label: string }>;
    candidates.sort((a, b) => a.t - b.t);
    return {
      script: 'opening', shot: shot.id, index, seconds: shot.seconds,
      firstFigure: events.find(e => !e.label.startsWith('légende')) ?? null, firstMove: null, firstCamera: camT, firstLight: null,
      firstEvent: candidates[0] ?? null, events, gaps: gapsOf(active, shot.seconds), gapsWithCamera: gapsOf(active.map((a, i) => a || camActive[i]!), shot.seconds), peakCamera: Math.round(peak),
    };
  });
}

// ——— Frame strips ———

const bezier = (x: number) => {
  // CSS `ease` = cubic-bezier(.25,.1,.25,1), solved for x by bisection.
  const bx = (t: number) => 3 * (1 - t) ** 2 * t * 0.25 + 3 * (1 - t) * t ** 2 * 0.25 + t ** 3;
  const by = (t: number) => 3 * (1 - t) ** 2 * t * 0.1 + 3 * (1 - t) * t ** 2 * 1 + t ** 3;
  let lo = 0, hi = 1;
  for (let k = 0; k < 30; k += 1) { const mid = (lo + hi) / 2; if (bx(mid) < x) lo = mid; else hi = mid; }
  return by((lo + hi) / 2);
};
/** The shared black veil at the start of a shot: down for 0.05 s, then lifted over 0.5 s (living-tableau.css). */
const veilAt = (t: number) => (t < 0.05 ? 1 : 1 - bezier(clamp01((t - 0.05) / 0.5)));

const images = new Map<string, Promise<HTMLImageElement>>();
function image(url: string): Promise<HTMLImageElement> {
  let p = images.get(url);
  if (!p) { p = new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = url; }); images.set(url, p); }
  return p;
}

function composite(out: CanvasRenderingContext2D, plate: HTMLImageElement, frame: ImageFrame, camera: ViewCamera, vanishing: { x: number; y: number }, progress: number, painted: HTMLCanvasElement, t: number, caption = '') {
  out.setTransform(1, 0, 0, 1, 0, 0);
  out.fillStyle = '#04050a';
  out.fillRect(0, 0, W, H);
  out.drawImage(plate, camera.x, camera.y, frame.width * camera.scale, frame.height * camera.scale);
  // The near layer: the same picture a little larger from the vanishing point, masked to its lower band.
  const near = document.createElement('canvas'); near.width = W; near.height = H;
  const n = near.getContext('2d')!;
  const scale = camera.scale * (1 + 0.05 * progress);
  const ax = camera.x + vanishing.x * camera.scale, ay = camera.y + vanishing.y * camera.scale;
  const nx = ax - vanishing.x * scale, ny = ay - vanishing.y * scale;
  n.drawImage(plate, nx, ny, frame.width * scale, frame.height * scale);
  const g = n.createLinearGradient(0, ny + frame.height * scale * 0.7, 0, ny + frame.height * scale * 0.84);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
  n.globalCompositeOperation = 'destination-in'; n.fillStyle = g; n.fillRect(0, 0, W, H);
  out.drawImage(near, 0, 0);
  out.drawImage(painted, 0, 0);
  // Vignette: radial-gradient(ellipse at 50% 50%, transparent 54%, rgba(2,3,8,.62) 100%).
  out.save();
  out.translate(W / 2, H / 2); out.scale(1, H / W);
  const r = (W / 2) * Math.SQRT2;
  const v = out.createRadialGradient(0, 0, 0, 0, 0, r);
  v.addColorStop(0.54, 'rgba(2,3,8,0)'); v.addColorStop(1, 'rgba(2,3,8,.62)');
  out.fillStyle = v; out.fillRect(-W, -W, 2 * W, 2 * W);
  out.restore();
  out.fillStyle = `rgba(4,5,10,${veilAt(t)})`;
  out.fillRect(0, 0, W, H);
  out.fillStyle = '#04050a';
  out.fillRect(0, 0, W, BAR); out.fillRect(0, H - BAR, W, BAR);
  if (caption) {
    out.fillStyle = '#efe5cf'; out.font = '20px Inter, sans-serif'; out.textAlign = 'center'; out.textBaseline = 'middle';
    out.fillText(caption.length > 90 ? `${caption.slice(0, 88)}…` : caption, W / 2, H - BAR / 2);
  }
}

/** Frames of one shot at the given seconds, the painter stepped from 0 at 60 fps; JPEG data URLs at `thumb` width. */
export async function framesOf(id: string, shotIndex: number, times: readonly number[], reduced = false, thumb = 456): Promise<string[]> {
  const opening = id === 'opening';
  const script = opening ? null : SCRIPTS[id]!;
  const shot = opening ? OPENING_SHOTS[shotIndex]! : script!.shots[shotIndex]!;
  const sheets = opening ? await sheetsOfOpening() : await sheetsOf(script!, reduced);
  const painter: ShotPainter = opening ? createShotPainter(OPENING_SHOTS[shotIndex]!.id, sheets) : script!.painter(shot.id, sheets);
  const plate = await image(shot.image);
  const frame = (shot as LivingShot).frame ?? OPENING_FRAME;
  const vanishing = (shot as LivingShot).vanishing ?? { x: 836, y: 470 };
  const painted = document.createElement('canvas'); painted.width = W; painted.height = H;
  const p = painted.getContext('2d')!;
  const out = document.createElement('canvas'); out.width = W; out.height = H;
  const o = out.getContext('2d')!;
  const small = document.createElement('canvas'); small.width = thumb; small.height = Math.round(thumb * H / W);
  const s = small.getContext('2d')!;
  const urls: string[] = [];
  const sorted = [...times].sort((a, b) => a - b);
  const dt = 1 / 60;
  let t = 0, k = 0;
  while (k < sorted.length) {
    const progress = reduced ? 1 : Math.min(1, t / shot.seconds);
    const camera = cameraAt(shot, progress, W, H, BAR, frame);
    p.setTransform(1, 0, 0, 1, 0, 0); p.clearRect(0, 0, W, H);
    painter({ ctx: p, width: W, height: H, seconds: t, dt, camera, reduced });
    if (t + 1e-6 >= sorted[k]!) {
      const caption = opening ? (reduced ? (shot as typeof OPENING_SHOTS[number]).lines.map(l => l.text).join(' ') : (shot as typeof OPENING_SHOTS[number]).lines.filter(l => l.at <= t).at(-1)?.text ?? '') : '';
      composite(o, plate, frame, camera, vanishing, progress, painted, t, caption);
      s.drawImage(out, 0, 0, small.width, small.height);
      urls.push(small.toDataURL('image/jpeg', 0.82));
      k += 1;
    }
    t += dt;
  }
  return urls;
}

export const ALL_IDS = () => ['opening', ...Object.keys(SCRIPTS)];
export function shotsOf(id: string): Array<{ id: string; seconds: number }> {
  return id === 'opening' ? OPENING_SHOTS.map(s => ({ id: s.id, seconds: s.seconds })) : SCRIPTS[id]!.shots.map(s => ({ id: s.id, seconds: s.seconds }));
}
export const labelOf = (id: string) => (id === 'opening' ? 'Ouverture (55 s)' : SCRIPTS[id]!.label);

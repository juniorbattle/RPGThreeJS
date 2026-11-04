import type { SheetArt, SheetBook, ShotPainter } from '../opening/openingPainters';
import { arrive, contactShadow, drawFrame, embers, paintedFires, paintLights, snap, softPuff, tintedCanvas, VILLAGE, VILLAGE_FIRES } from '../opening/openingPainters';
import { clamp01, flicker, glow, GRAIN, PixelFire, PropLayer, seeded, smooth } from '../opening/openingLayer';
import { assets } from '../../render/assetManifest';
import type { LivingScript } from './LivingTableauPlayer';

/**
 * `bois_clair_arrival`, before `village_choice` (set 1.13.0, OD-2026-11-04-A). Only what is established before the
 * dialogue: "Bois-Clair brûle sous les torches des Serpents" (Alaric's briefing). The company comes in through the gap
 * of the broken fence in front of the square; raiders with torches pass at the back; the villager who opens the
 * dialogue steps out, without a gesture that would speak before her line. No children, captives, coffers, chapel or
 * wells: the dialogue says those first. No caption.
 */
const IMAGE = (assets.prologueScenes as Record<string, string>).prologue_lion ?? '';

interface Walker { id: string; at: number; from: readonly [number, number]; to: readonly [number, number]; facing: 'LEFT' | 'RIGHT'; speed: number }

/** Three heroes and the villager: four narrative actors, the cast of the dialogue's first segment. */
export const ARRIVAL_ACTORS: readonly Walker[] = [
  { id: 'alistair', at: 0.5, from: [1250, 905], to: [1078, 668], facing: 'LEFT', speed: 70 },
  { id: 'marian', at: 1.1, from: [1350, 930], to: [1196, 652], facing: 'LEFT', speed: 70 },
  { id: 'kestrel', at: 1.7, from: [1150, 945], to: [964, 690], facing: 'LEFT', speed: 70 },
  { id: 'villageoise', at: 6.4, from: [520, 634], to: [660, 640], facing: 'RIGHT', speed: 60 },
];

/** Raiders with torches coming out of the gate and crossing the square, then passing at its back once the company is there, always in front of the cart they pass: extras, never actors. */
export const ARRIVAL_EXTRAS: ReadonlyArray<{ shot: string; at: number; from: readonly [number, number]; to: readonly [number, number]; torch: boolean }> = [
  { shot: 'arrival_village', at: 0.3, from: [930, 440], to: [560, 600], torch: true },
  { shot: 'arrival_village', at: 1.6, from: [950, 438], to: [1180, 610], torch: true },
  { shot: 'arrival_village', at: 3.0, from: [420, 580], to: [880, 620], torch: false },
  { shot: 'arrival_village', at: 4.4, from: [940, 440], to: [700, 640], torch: true },
  { shot: 'arrival_square', at: 0.2, from: [940, 434], to: [690, 500], torch: true },
  { shot: 'arrival_square', at: 3.2, from: [950, 434], to: [1035, 515], torch: true },
  { shot: 'arrival_square', at: 7.5, from: [930, 436], to: [740, 506], torch: false },
];

/** The painting's perspective, read from its cobbles and fence: the same rule as the opening's march, carried past the square towards the viewer. */
const depthScale = (y: number) => Math.max(0.36, 0.42 + 1.63 * (y - 436) / 264);
/** The village burns at the back: everything on the square is lit from behind. */
const BACKLIGHT = { x: 948, y: 330 };

interface Placed { art: SheetArt; id: string; x: number; y: number; scale: number; pose: string; flip: boolean; shown: number }

function placeWalker(walker: Walker, index: number, art: SheetArt, t: number, reduced: boolean): Placed {
  const [fx, fy] = walker.from, [tx, ty] = walker.to;
  const duration = Math.hypot(tx - fx, ty - fy) / walker.speed, since = t - walker.at;
  const p = reduced ? 1 : clamp01(since / duration);
  const x = fx + (tx - fx) * arrive(p), y = fy + (ty - fy) * arrive(p);
  const shown = reduced ? smooth((t - walker.at * 0.45) / 0.9) : smooth(since / 0.6);
  const stride = (Math.hypot(x - fx, y - fy) / 46) * Math.PI;
  const walking = p > 0 && p < 1;
  const idle = art.entry.anims.idle;
  let pose = 'idle';
  if (walking) pose = Math.sin(stride) > 0 ? 'idle' : 'idle_b';
  else if (idle) {
    const cycle = idle.ms.reduce((sum, ms) => sum + ms, 0);
    let at = ((t + index * 0.37) * 1000) % cycle;
    pose = idle.frames.find((_, k) => (at -= idle.ms[k]!) < 0) ?? 'idle';
  }
  const lift = walking ? Math.round(Math.abs(Math.sin(stride))) * GRAIN : 0;
  return { art, id: walker.id, x: snap(x), y: snap(y) - lift, scale: depthScale(y), pose, flip: walker.facing === 'LEFT', shown };
}

function castShadow(ctx: CanvasRenderingContext2D, figure: Placed, source: CanvasImageSource): void {
  const dx = figure.x - BACKLIGHT.x, dy = figure.y - BACKLIGHT.y, length = Math.hypot(dx, dy) || 1, reach = 0.42;
  const [cellWidth, cellHeight] = figure.art.entry.cell, [anchorX, anchorY] = figure.art.entry.anchor;
  const column = Math.max(0, figure.art.entry.cells.indexOf(figure.pose));
  ctx.save();
  ctx.translate(figure.x, figure.y);
  ctx.transform(1, 0, (-dx / length) * reach, (-dy / length) * reach, 0, 0);
  ctx.scale(figure.flip ? -figure.scale : figure.scale, figure.scale);
  ctx.drawImage(source, column * cellWidth, 0, cellWidth, cellHeight, -anchorX, -anchorY, cellWidth, cellHeight);
  ctx.restore();
}

/** The fires, the smoke over the roofs, the embers and the raiders passing: shared by both shots. */
function villageLife(sheets: SheetBook, shot: string, reduced: () => boolean) {
  const fires = paintedFires(VILLAGE_FIRES, 3301);
  const puff = softPuff([34, 22, 26]);
  const random = seeded(4417);
  const plumes = Array.from({ length: 30 }, () => ({ x: 860 + random() * 780, y: 110 + random() * 240, size: 90 + random() * 200, speed: 7 + random() * 12, phase: random() }));
  const torches = [0, 1, 2].map((index) => new PixelFire(7, 12, 811 + index * 31, 0.5));
  const raider = sheets.get('serpent_raider');
  const dark = raider ? tintedCanvas(raider.image, 'rgba(38,14,8,.6)') : null;
  return {
    fires,
    sky(frame: Parameters<ShotPainter>[0]) {
      const { ctx, camera, seconds } = frame;
      paintLights(frame, VILLAGE);
      for (const plume of plumes) {
        const rise = (plume.phase + (seconds * plume.speed) / 300) % 1;
        ctx.globalAlpha = 0.16 * Math.sin(rise * Math.PI);
        const size = plume.size * camera.scale * (1 + rise * 0.8);
        ctx.drawImage(puff, camera.x + (plume.x - 90 * rise) * camera.scale - size / 2, camera.y + (plume.y - 180 * rise) * camera.scale - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    },
    /** The raiders of this shot, in image pixels on the prop layer. Under reduced motion they do not pass. */
    raiders(props: CanvasRenderingContext2D, seconds: number, dt: number) {
      for (const torch of torches) torch.advance(dt);
      if (!raider || !dark || reduced()) return;
      ARRIVAL_EXTRAS.filter((extra) => extra.shot === shot).forEach((extra, index) => {
        const p = (seconds - extra.at) / 7;
        if (p <= 0 || p >= 1) return;
        const x = extra.from[0] + (extra.to[0] - extra.from[0]) * p, y = extra.from[1] + (extra.to[1] - extra.from[1]) * p;
        const shown = smooth(p / 0.12) * smooth((1 - p) / 0.18), scale = depthScale(y);
        const step = seconds * 4 + index * 1.3;
        props.globalAlpha = shown;
        contactShadow(props, x, y, 18 * scale, 0.4);
        drawFrame(props, raider.entry, dark, Math.sin(step) > 0 ? 'idle' : 'idle_b', snap(x), snap(y) - Math.round(Math.abs(Math.sin(step))) * GRAIN, scale, extra.to[0] < extra.from[0]);
        if (extra.torch) {
          const tx = x + (extra.to[0] < extra.from[0] ? -1 : 1) * 24 * scale, ty = y - 74 * scale;
          props.fillStyle = 'rgb(30,16,10)';
          props.fillRect(tx - Math.max(1, scale) / 2, ty, Math.max(1, scale), 30 * scale);
          torches[index % torches.length]!.draw(props, tx, ty + 2 * scale, Math.max(GRAIN, Math.round(scale * 2)), shown);
        }
        props.globalAlpha = 1;
      });
    },
  };
}

function villagePainter(sheets: SheetBook, reduced: { value: boolean }): ShotPainter {
  const life = villageLife(sheets, 'arrival_village', () => reduced.value);
  const layer = new PropLayer();
  const sparks = embers(150, 12051);
  return (frame) => {
    reduced.value = frame.reduced;
    life.sky(frame);
    life.fires(frame);
    const props = layer.begin();
    if (props) { life.raiders(props, frame.seconds, frame.dt); layer.present(frame.ctx, frame.camera); }
    sparks.paint(frame);
  };
}

function squarePainter(sheets: SheetBook, reduced: { value: boolean }): ShotPainter {
  const life = villageLife(sheets, 'arrival_square', () => reduced.value);
  const layer = new PropLayer();
  const sparks = embers(120, 12061), near = embers(24, 3317);
  const lit = document.createElement('canvas');
  const litCtx = lit.getContext('2d');
  const looks = new Map<string, { warm: CanvasImageSource; dark: CanvasImageSource }>();
  const lookOf = (figure: Placed) => {
    let look = looks.get(figure.id);
    if (!look) { look = { warm: tintedCanvas(figure.art.image, 'rgb(255,170,90)'), dark: tintedCanvas(figure.art.image, 'rgb(8,6,12)') }; looks.set(figure.id, look); }
    return look;
  };
  /** Lit from behind by the burning village: warm along the top, the side facing the viewer in the dusk, darks kept. */
  const lightFigure = (figure: Placed, seconds: number): HTMLCanvasElement => {
    const { entry, image } = figure.art;
    const [width, height] = entry.cell;
    lit.width = width;
    lit.height = height;
    if (!litCtx) return lit;
    const column = Math.max(0, entry.cells.indexOf(figure.pose));
    const draw = () => {
      litCtx.save();
      if (figure.flip) { litCtx.translate(width, 0); litCtx.scale(-1, 1); }
      litCtx.drawImage(image, column * width, 0, width, height, 0, 0, width, height);
      litCtx.restore();
    };
    draw();
    const glowing = 0.9 + 0.1 * flicker(seconds, 3);
    const light = litCtx.createLinearGradient(0, 0, 0, height);
    light.addColorStop(0, `rgb(${Math.round(250 * glowing)},${Math.round(176 * glowing)},128)`);
    light.addColorStop(0.45, `rgb(${Math.round(196 * glowing)},${Math.round(138 * glowing)},118)`);
    light.addColorStop(1, 'rgb(110,88,104)');
    litCtx.globalCompositeOperation = 'multiply';
    litCtx.fillStyle = light;
    litCtx.fillRect(0, 0, width, height);
    litCtx.globalCompositeOperation = 'destination-in';
    draw();
    litCtx.globalCompositeOperation = 'source-over';
    return lit;
  };
  return (frame) => {
    const { ctx, camera, seconds, dt } = frame;
    reduced.value = frame.reduced;
    life.sky(frame);
    life.fires(frame);
    const props = layer.begin();
    if (props) {
      life.raiders(props, seconds, dt);
      const cast = ARRIVAL_ACTORS.flatMap((walker, index) => {
        const art = sheets.get(walker.id);
        const placed = art ? placeWalker(walker, index, art, seconds, frame.reduced) : null;
        return placed && placed.shown > 0.001 ? [placed] : [];
      }).sort((a, b) => a.y - b.y);
      for (const figure of cast) {
        const [width, height] = figure.art.entry.cell, [anchorX, anchorY] = figure.art.entry.anchor, s = figure.scale;
        props.globalAlpha = figure.shown;
        props.drawImage(lightFigure(figure, seconds), figure.x - (figure.flip ? width - anchorX : anchorX) * s, figure.y - anchorY * s, width * s, height * s);
      }
      props.globalAlpha = 1;
      if (cast.length) {
        props.save();
        // Behind each figure: the fire's edge along the top, then its shadow thrown towards the viewer.
        props.globalCompositeOperation = 'destination-over';
        for (const figure of cast) {
          props.globalAlpha = figure.shown ** 3 * 0.8 * flicker(seconds, 2);
          drawFrame(props, figure.art.entry, lookOf(figure).warm, figure.pose, figure.x, figure.y - GRAIN, figure.scale, figure.flip);
        }
        for (const figure of cast) {
          props.globalAlpha = figure.shown * 0.32;
          castShadow(props, figure, lookOf(figure).dark);
          props.globalAlpha = 1;
          contactShadow(props, figure.x, figure.y + 1, 15 * figure.scale, 0.5 * figure.shown);
        }
        props.restore();
      }
      layer.present(ctx, camera);
    }
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, frame.width * 0.5, frame.height * 0.2, frame.width * 0.75, [190, 66, 20], 0.05 + 0.03 * flicker(seconds, 13));
    ctx.globalCompositeOperation = 'source-over';
    sparks.paint(frame);
    near.paint(frame, 0.9);
  };
}

export const BOIS_CLAIR_ARRIVAL: LivingScript = {
  id: 'bois_clair_arrival',
  label: 'Arrivée à Bois-Clair',
  shots: [
    // The hill and the roofs burn; the camera comes down to the gate. A different path from the opening's shot of this tableau.
    { id: 'arrival_village', image: IMAGE, seconds: 9, from: { x: 1010, y: 250, zoom: 1.32 }, to: { x: 930, y: 410, zoom: 1.14 }, vanishing: { x: 948, y: 430 } },
    // The square, from the gap in the fence: the company comes in, the villager steps out.
    { id: 'arrival_square', image: IMAGE, seconds: 14, from: { x: 1010, y: 660, zoom: 1.12 }, to: { x: 900, y: 610, zoom: 1.04 }, vanishing: { x: 948, y: 430 } },
  ],
  sheets: ['alistair', 'marian', 'kestrel', 'serpent_raider'],
  portraits: ['villageoise'],
  painter(shotId, sheets) {
    const reduced = { value: false };
    return shotId === 'arrival_village' ? villagePainter(sheets, reduced) : squarePainter(sheets, reduced);
  },
};

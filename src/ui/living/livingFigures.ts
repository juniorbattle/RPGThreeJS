import type { SheetArt, SheetBook } from '../opening/openingPainters';
import { arrive, contactShadow, drawFrame, snap, tintedCanvas } from '../opening/openingPainters';
import { clamp01, flicker, GRAIN, PixelFire, smooth, type Rgb } from '../opening/openingLayer';

/**
 * Figures of the living tableaux (set 1.13.0), drawn in image pixels on a prop layer: narrative actors who walk to
 * their place and breathe there, lit by the scene, and extras who pass or stand as moving scenery.
 */

/**
 * A narrative actor: where they start, where they stop, and when. Under reduced motion they fade in where they stop.
 * `stature` brings a figure drawn from a larger sheet back to its height among the others: a post-demo chief comes from a
 * boss sheet two cells high, and stands in a tableau as a tall man, not a giant.
 */
export interface Walker { id: string; at: number; from: readonly [number, number]; to: readonly [number, number]; facing: 'LEFT' | 'RIGHT'; speed: number; stature?: number }

/** An extra: no dialogue, focus or facing relation, drawn behind the actors. `from` equal to `to` stands in place. */
export interface Extra { id: string; at: number; seconds: number; from: readonly [number, number]; to: readonly [number, number]; torch?: boolean; pace?: number }

export interface Placed { art: SheetArt; id: string; x: number; y: number; scale: number; pose: string; flip: boolean; shown: number }

export type DepthScale = (y: number) => number;

/**
 * How tall every figure of a living tableau stands against its painted scene, on top of the scene's own depth scale:
 * actors and extras alike, so a crowd keeps its proportions. Raised after the operator's PC playtest (2026-11-06), when
 * the heroes read too small on the route endings.
 */
export const LIVING_STATURE = 1.3;

function idlePose(art: SheetArt, t: number, index: number): string {
  const idle = art.entry.anims.idle;
  if (!idle) return 'idle';
  const cycle = idle.ms.reduce((sum, ms) => sum + ms, 0);
  let at = ((t + index * 0.37) * 1000) % cycle;
  return idle.frames.find((_, k) => (at -= idle.ms[k]!) < 0) ?? 'idle';
}

export function placeWalker(walker: Walker, index: number, art: SheetArt, t: number, reduced: boolean, depth: DepthScale): Placed {
  const [fx, fy] = walker.from, [tx, ty] = walker.to;
  const duration = Math.hypot(tx - fx, ty - fy) / walker.speed, since = t - walker.at;
  const p = reduced || duration === 0 ? 1 : clamp01(since / duration);
  const x = fx + (tx - fx) * arrive(p), y = fy + (ty - fy) * arrive(p);
  const shown = reduced ? smooth((t - walker.at * 0.45) / 0.9) : smooth(since / 0.6);
  // A step every so many pixels walked, in proportion to the figure's size on screen.
  const scale = depth(y) * LIVING_STATURE * (walker.stature ?? 1);
  const stride = (Math.hypot(x - fx, y - fy) / (28 * scale)) * Math.PI;
  const walking = p > 0 && p < 1;
  const pose = walking ? (Math.sin(stride) > 0 ? 'idle' : 'idle_b') : idlePose(art, t, index);
  const lift = walking ? Math.round(Math.abs(Math.sin(stride))) * GRAIN : 0;
  return { art, id: walker.id, x: snap(x), y: snap(y) - lift, scale, pose, flip: walker.facing === 'LEFT', shown };
}

/** How the scene lights its actors: a multiply gradient from top to bottom, the edge colour behind, and where shadows fall from. */
export interface FigureLight { top: Rgb; middle: Rgb; bottom: Rgb; rim: Rgb; rimAlpha: number; rimOffset: readonly [number, number]; shadowFrom: { x: number; y: number }; shadowReach: number; shadowAlpha: number }

export class FigureCast {
  private readonly lit = document.createElement('canvas');
  private readonly litCtx = this.lit.getContext('2d');
  private readonly looks = new Map<string, { rim: CanvasImageSource; dark: CanvasImageSource }>();

  constructor(private readonly light: FigureLight) {}

  private lookOf(figure: Placed) {
    let look = this.looks.get(figure.id);
    if (!look) {
      const [r, g, b] = this.light.rim;
      look = { rim: tintedCanvas(figure.art.image, `rgb(${r},${g},${b})`), dark: tintedCanvas(figure.art.image, 'rgb(8,6,12)') };
      this.looks.set(figure.id, look);
    }
    return look;
  }

  /** The figure's frame in the scene's light, multiplied so the pixel art keeps its darks, then cut back to the figure. */
  private lightFigure(figure: Placed, seconds: number): HTMLCanvasElement {
    const { entry, image } = figure.art;
    const [width, height] = entry.cell;
    const { lit, litCtx } = this;
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
    const glowing = 0.92 + 0.08 * flicker(seconds, 3);
    const tone = ([r, g, b]: Rgb, k: number) => `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b)})`;
    const gradient = litCtx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, tone(this.light.top, glowing));
    gradient.addColorStop(0.45, tone(this.light.middle, glowing));
    gradient.addColorStop(1, tone(this.light.bottom, 1));
    litCtx.globalCompositeOperation = 'multiply';
    litCtx.fillStyle = gradient;
    litCtx.fillRect(0, 0, width, height);
    litCtx.globalCompositeOperation = 'destination-in';
    draw();
    litCtx.globalCompositeOperation = 'source-over';
    return lit;
  }

  private castShadow(ctx: CanvasRenderingContext2D, figure: Placed): void {
    const { x: sx, y: sy } = this.light.shadowFrom;
    const dx = figure.x - sx, dy = figure.y - sy, length = Math.hypot(dx, dy) || 1, reach = this.light.shadowReach;
    const [cellWidth, cellHeight] = figure.art.entry.cell, [anchorX, anchorY] = figure.art.entry.anchor;
    const column = Math.max(0, figure.art.entry.cells.indexOf(figure.pose));
    ctx.save();
    ctx.translate(figure.x, figure.y);
    ctx.transform(1, 0, (-dx / length) * reach, (-dy / length) * reach, 0, 0);
    ctx.scale(figure.flip ? -figure.scale : figure.scale, figure.scale);
    ctx.drawImage(this.lookOf(figure).dark, column * cellWidth, 0, cellWidth, cellHeight, -anchorX, -anchorY, cellWidth, cellHeight);
    ctx.restore();
  }

  /** Draws the actors back to front, then, behind them, their edge light, their shadow on the ground and their contact shadow. */
  draw(props: CanvasRenderingContext2D, cast: readonly Placed[], seconds: number): void {
    const sorted = [...cast].sort((a, b) => a.y - b.y);
    for (const figure of sorted) {
      const [width, height] = figure.art.entry.cell, [anchorX, anchorY] = figure.art.entry.anchor, s = figure.scale;
      props.globalAlpha = figure.shown;
      props.drawImage(this.lightFigure(figure, seconds), figure.x - (figure.flip ? width - anchorX : anchorX) * s, figure.y - anchorY * s, width * s, height * s);
    }
    props.globalAlpha = 1;
    if (!sorted.length) return;
    props.save();
    props.globalCompositeOperation = 'destination-over';
    const [ox, oy] = this.light.rimOffset;
    for (const figure of sorted) {
      props.globalAlpha = figure.shown ** 3 * this.light.rimAlpha * flicker(seconds, 2);
      drawFrame(props, figure.art.entry, this.lookOf(figure).rim, figure.pose, figure.x + ox * GRAIN, figure.y + oy * GRAIN, figure.scale, figure.flip);
    }
    for (const figure of sorted) {
      props.globalAlpha = figure.shown * this.light.shadowAlpha;
      this.castShadow(props, figure);
      props.globalAlpha = 1;
      contactShadow(props, figure.x, figure.y + 1, 15 * figure.scale, 0.5 * figure.shown);
    }
    props.restore();
  }
}

/** The narrative actors at this second, ready for `FigureCast.draw`. */
export function placeCast(walkers: readonly Walker[], sheets: SheetBook, t: number, reduced: boolean, depth: DepthScale): Placed[] {
  return walkers.flatMap((walker, index) => {
    const art = sheets.get(walker.id);
    const placed = art ? placeWalker(walker, index, art, t, reduced, depth) : null;
    return placed && placed.shown > 0.001 ? [placed] : [];
  });
}

/**
 * Extras as dark silhouettes against the scene's light: passing ones walk for `seconds` and fade at both ends,
 * standing ones breathe where they are. Under reduced motion, passers do not pass; those who stand still show.
 */
export class ExtraCrowd {
  private readonly darks = new Map<string, CanvasImageSource>();
  private readonly torches = [0, 1, 2].map((index) => new PixelFire(7, 12, 911 + index * 31, 0.5));

  constructor(private readonly sheets: SheetBook, private readonly tint: string) {}

  private darkOf(id: string): { art: SheetArt; dark: CanvasImageSource } | null {
    const art = this.sheets.get(id);
    if (!art) return null;
    let dark = this.darks.get(id);
    if (!dark) { dark = tintedCanvas(art.image, this.tint); this.darks.set(id, dark); }
    return { art, dark };
  }

  draw(props: CanvasRenderingContext2D, extras: readonly Extra[], seconds: number, dt: number, reduced: boolean, depth: DepthScale): void {
    for (const torch of this.torches) torch.advance(dt);
    extras.forEach((extra, index) => {
      const look = this.darkOf(extra.id);
      if (!look) return;
      const standing = extra.from[0] === extra.to[0] && extra.from[1] === extra.to[1];
      if (reduced && !standing) return;
      const p = (seconds - extra.at) / extra.seconds;
      if (!standing && (p <= 0 || p >= 1)) return;
      const q = clamp01(p);
      const x = extra.from[0] + (extra.to[0] - extra.from[0]) * q, y = extra.from[1] + (extra.to[1] - extra.from[1]) * q;
      const shown = standing ? smooth((seconds - (reduced ? extra.at * 0.45 : extra.at)) / 1.2) : smooth(p / 0.12) * smooth((1 - p) / 0.18);
      if (shown <= 0.001) return;
      const scale = depth(y) * LIVING_STATURE, step = seconds * (extra.pace ?? 4) + index * 1.3;
      const flip = extra.to[0] < extra.from[0];
      const pose = standing ? idlePose(look.art, seconds, index) : Math.sin(step) > 0 ? 'idle' : 'idle_b';
      const lift = standing ? 0 : Math.round(Math.abs(Math.sin(step))) * GRAIN;
      props.globalAlpha = shown;
      contactShadow(props, x, y, 16 * scale, 0.36);
      drawFrame(props, look.art.entry, look.dark, pose, snap(x), snap(y) - lift, scale, flip);
      if (extra.torch) {
        const tx = x + (flip ? -1 : 1) * 24 * scale, ty = y - 74 * scale;
        props.fillStyle = 'rgb(30,16,10)';
        props.fillRect(tx - Math.max(1, scale) / 2, ty, Math.max(1, scale), 30 * scale);
        this.torches[index % this.torches.length]!.draw(props, tx, ty + 2 * scale, Math.max(GRAIN, Math.round(scale * 2)), shown);
      }
      props.globalAlpha = 1;
    });
  }
}

import type { PaintFrame } from '../opening/openingPainters';
import { softPuff } from '../opening/openingPainters';
import { glow, GRAIN, PropLayer, seeded, type Rgb } from '../opening/openingLayer';

/**
 * Weather and light for the living tableaux of set 1.14.0 (OD-2026-11-04-B), in image pixels: clouds and mist that
 * drift, a slow celestial glow, shafts of daylight, and painted banners that stir. Presentation only; under reduced
 * motion light and wind keep moving in place, as the contract allows.
 */

export interface Region { x0: number; x1: number; y0: number; y1: number }

/** Soft puffs drifting sideways across a region and wrapping round it: clouds over a sky, mist over a valley. */
export function driftingPuffs(options: { seed: number; count: number; region: Region; size: readonly [number, number]; speed: number; color: Rgb; alpha: number; rise?: number }) {
  const puff = softPuff(options.color);
  const random = seeded(options.seed);
  const { x0, x1, y0, y1 } = options.region;
  const span = x1 - x0;
  const puffs = Array.from({ length: options.count }, () => ({
    x: random() * span, y: y0 + random() * (y1 - y0), size: options.size[0] + random() * (options.size[1] - options.size[0]),
    speed: options.speed * (0.6 + random() * 0.8), phase: random() * 6,
  }));
  return ({ ctx, camera, seconds }: PaintFrame, amount = 1) => {
    for (const p of puffs) {
      const x = x0 + ((p.x + seconds * p.speed) % span + span) % span;
      const edge = Math.min(1, (x - x0) / (span * 0.15), (x1 - x) / (span * 0.15));
      ctx.globalAlpha = Math.max(0, options.alpha * amount * edge * (0.75 + 0.25 * Math.sin(seconds * 0.4 + p.phase)));
      const size = p.size * camera.scale;
      const y = p.y - (options.rise ?? 0) * Math.sin(seconds * 0.2 + p.phase);
      ctx.drawImage(puff, camera.x + x * camera.scale - size / 2, camera.y + y * camera.scale - size * 0.3, size, size * 0.6);
    }
    ctx.globalAlpha = 1;
  };
}

/** Puffs that rise and fade from a source: the spray at the foot of a waterfall. */
export function risingSpray(options: { seed: number; count: number; x: number; y: number; spread: number; height: number; size: number; color: Rgb; alpha: number }) {
  const puff = softPuff(options.color);
  const random = seeded(options.seed);
  const puffs = Array.from({ length: options.count }, () => ({ dx: (random() - 0.5) * options.spread, phase: random(), speed: 0.05 + random() * 0.06 }));
  return ({ ctx, camera, seconds }: PaintFrame) => {
    for (const p of puffs) {
      const rise = (p.phase + seconds * p.speed) % 1;
      ctx.globalAlpha = options.alpha * Math.sin(rise * Math.PI);
      const size = options.size * camera.scale * (0.6 + rise);
      ctx.drawImage(puff, camera.x + (options.x + p.dx * (1 + rise)) * camera.scale - size / 2, camera.y + (options.y - options.height * rise) * camera.scale - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
  };
}

/** A moon or a setting sun: a glow that breathes slowly, never the fast flicker of a flame. */
export function celestialGlow(x: number, y: number, radius: number, color: Rgb, power: number) {
  return ({ ctx, camera, seconds }: PaintFrame) => {
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, camera.x + x * camera.scale, camera.y + y * camera.scale, radius * camera.scale, color, power * (0.86 + 0.14 * Math.sin(seconds * 0.5)));
    ctx.globalCompositeOperation = 'source-over';
  };
}

export interface Shaft { top: readonly [number, number]; bottom: readonly [number, number]; width: readonly [number, number] }

/** Shafts of daylight through high windows, widening as they fall, breathing slowly. */
export function lightShafts(shafts: readonly Shaft[], color: Rgb, alpha: number) {
  const [r, g, b] = color;
  return ({ ctx, camera, seconds }: PaintFrame) => {
    ctx.globalCompositeOperation = 'lighter';
    shafts.forEach((shaft, index) => {
      const at = (x: number, y: number) => [camera.x + x * camera.scale, camera.y + y * camera.scale] as const;
      const [tx, ty] = at(...shaft.top), [bx, by] = at(...shaft.bottom);
      const tw = shaft.width[0] * camera.scale / 2, bw = shaft.width[1] * camera.scale / 2;
      const strength = alpha * (0.7 + 0.3 * Math.sin(seconds * 0.35 + index * 1.9));
      const gradient = ctx.createLinearGradient(tx, ty, bx, by);
      gradient.addColorStop(0, `rgba(${r},${g},${b},${strength})`);
      gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(tx - tw, ty);
      ctx.lineTo(tx + tw, ty);
      ctx.lineTo(bx + bw, by);
      ctx.lineTo(bx - bw, by);
      ctx.closePath();
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
  };
}

export interface Banner { x: number; y: number; width: number; height: number; amplitude: number }

/**
 * Painted banners stirring in the wind: the picture's own cloth, redrawn row by row and shifted by a wave that grows
 * from the pole to the hem. A few pixels at most, on the tableau's grain, so the painting stays the painting.
 */
export function bannerSway(src: string, banners: readonly Banner[], seed: number) {
  const image = new Image();
  image.src = src;
  const layer = new PropLayer();
  return ({ ctx, camera, seconds }: PaintFrame) => {
    if (!image.complete || !image.naturalWidth) return;
    const props = layer.begin();
    if (!props) return;
    const k = image.naturalWidth / 1672;
    banners.forEach((banner, index) => {
      for (let row = 0; row < banner.height; row += GRAIN) {
        const reach = row / banner.height;
        const shift = Math.round(banner.amplitude * reach * Math.sin(seconds * 1.4 + row * 0.03 + seed + index * 1.7));
        if (shift === 0) continue;
        props.drawImage(image, banner.x * k, (banner.y + row) * k, banner.width * k, GRAIN * k, banner.x + shift, banner.y + row, banner.width, GRAIN);
      }
    });
    layer.present(ctx, camera);
  };
}

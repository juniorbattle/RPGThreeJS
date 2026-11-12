import { bayer, makeNoise, mixRgb, PixelCanvas, ramp, rgb, seeded, type Rgb } from './pixelArt';
import type { ArenaTheme } from './arenaThemes';

/**
 * Far plates painted in code, for the arenas that have no painted plate (OD-2026-11-01-C dropped the arena plates):
 * the Bear's snowy peaks under a clear sky, and the dark back wall of its mine galleries. Pixel art in the decor's
 * language (flat tone clusters, a dither only where two tones meet), shown with nearest filtering.
 */

const clamp = (v: number) => Math.max(0, Math.min(1, v));

/** Picks one of a few flat tones; an ordered dither only in a narrow band where two tones meet. */
function pick(tones: readonly Rgb[], level: number, x: number, y: number): Rgb {
  const max = tones.length - 1;
  const v = clamp(level) * max;
  const lo = Math.floor(v), frac = v - lo;
  const step = frac > 0.66 || (frac > 0.34 && bayer(x, y) < (frac - 0.34) / 0.32) ? 1 : 0;
  return tones[Math.min(max, lo + step)] ?? tones[0]!;
}

/** Fades the plate's foot into transparency with a dither (the ridge lines and the ground meet it there). */
function fadeFoot(pc: PixelCanvas, from: number): void {
  for (let y = Math.floor(pc.height * from); y < pc.height; y++) {
    const t = (y - pc.height * from) / (pc.height * (1 - from));
    for (let x = 0; x < pc.width; x++) if (bayer(x, y) < t) pc.set(x, y, [0, 0, 0], 0);
  }
}

interface Range { top: number; spread: number; spacing: number; haze: number; snow: number; seed: number }
interface Peak { x: number; y: number; left: number; right: number; drift: number }

/**
 * The Bear's mountains seen from a high pass: a clear sky in flat bands with a few wisps, then three ranges of granite
 * peaks, far to near. Each peak's face left of its ridge takes the light (the arena's key comes from the upper left),
 * the other falls into blue shadow; snow caps the summits and runs down the couloirs, and each range sinks a little
 * more into the haze.
 */
export function drawPeaksPlate(theme: ArenaTheme, seed = 7): PixelCanvas {
  const W = 960, H = 300;
  const pal = theme.palette;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const haze = rgb(theme.background);
  const skyTop = mixRgb(haze, rgb('#4d6d9b'), 0.8);
  const sky = [0, 0.22, 0.45, 0.7, 1].map((t) => mixRgb(skyTop, haze, t));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) pc.set(x, y, pick(sky, y / (H * 0.6), x, y));
  // wisps of high cloud
  const cloud = makeNoise(rng, 16);
  for (let y = 8; y < H * 0.34; y++) for (let x = 0; x < W; x++) {
    const v = cloud(x / 60, y / 7) * (1 - y / (H * 0.34));
    if (v > 0.55) pc.set(x, y, mixRgb(pc.get(x, y) as unknown as Rgb, rgb('#f4f7fb'), v > 0.66 ? 0.7 : 0.35));
  }
  const snowLit = ramp(pal.moss, 1), snowShade = mixRgb(ramp(pal.moss, 0.2), rgb('#6a82aa'), 0.35);
  const rockLit = ramp(pal.stone, 0.62), rockShade = mixRgb(ramp(pal.stone, 0.12), rgb('#34466a'), 0.3);
  const ranges: Range[] = [
    { top: 0.24, spread: 0.12, spacing: 120, haze: 0.55, snow: 0.3, seed: 1 },
    { top: 0.36, spread: 0.16, spacing: 92, haze: 0.28, snow: 0.2, seed: 2 },
    { top: 0.6, spread: 0.08, spacing: 70, haze: 0.08, snow: 0.08, seed: 3 },
  ];
  for (const range of ranges) {
    const r = seeded(seed * 31 + range.seed);
    const fine = makeNoise(r, 64), streak = makeNoise(r, 64);
    const peaks: Peak[] = [];
    for (let x = -range.spacing; x < W + range.spacing; x += range.spacing * (0.7 + r() * 0.6)) {
      peaks.push({ x, y: H * (range.top + (r() - 0.3) * range.spread), left: 0.55 + r() * 0.6, right: 0.6 + r() * 0.7, drift: (r() - 0.5) * 0.5 });
    }
    // tallest first: each lower peak stands in front and cuts the one behind along its own slopes
    for (const peak of [...peaks].sort((p, q) => p.y - q.y)) {
      const reachL = (H - peak.y) / peak.left, reachR = (H - peak.y) / peak.right;
      for (let x = Math.max(0, Math.floor(peak.x - reachL)); x < Math.min(W, Math.ceil(peak.x + reachR)); x++) {
        const top = peak.y + Math.abs(x - peak.x) * (x < peak.x ? peak.left : peak.right) + (fine(x / 5, peak.x) - 0.5) * 5;
        for (let y = Math.max(0, Math.floor(top)); y < H * 0.9; y++) {
          const below = y - peak.y;
          const ridge = peak.x + below * peak.drift + (fine(peak.x / 7, y / 9) - 0.5) * 10;
          const couloir = streak(x / 5 - y / 14, y / 26) > 0.66; // gullies running down and to the side
          const lit = x < ridge;
          const snowy = below / H < range.snow * (0.7 + fine(x / 30, 4) * 0.6) || (couloir && below / H < range.snow * 2.2);
          const light = (lit ? 0.85 : 0.18) + (couloir ? (lit ? -0.3 : 0.25) : 0) + (fine(x / 3, y / 3) - 0.5) * 0.2;
          const tones = snowy ? [snowShade, mixRgb(snowShade, snowLit, 0.55), snowLit] : [rockShade, mixRgb(rockShade, rockLit, 0.5), rockLit];
          pc.set(x, y, mixRgb(pick(tones, light, x, y), haze, Math.min(0.85, range.haze + ((y - top) / H) * 0.6)));
        }
      }
    }
  }
  fadeFoot(pc, 0.8);
  return pc;
}

/**
 * The back wall of the Bear's mine chamber: hewn granite in rough strata, two timber scaffolds with their walkways,
 * gallery mouths framed in timber and a few lanterns; it falls into darkness toward the vault. No sky.
 */
export function drawCavePlate(theme: ArenaTheme, seed = 11): PixelCanvas {
  const W = 640, H = 220;
  const pal = theme.palette;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const n = makeNoise(rng, 32), fine = makeNoise(rng, 64);
  const black = rgb('#050506');
  const rock = [black, rgb(pal.stoneDark[1]), rgb(pal.stone[0]), rgb(pal.stone[1]), rgb(pal.stone[2])];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ledge = Math.abs(((y + n(x / 30, 1) * 16) % 22) - 11) < 1.2; // strata ledges
    const vault = clamp((y / H - 0.12) / 0.5); // darkness toward the vault
    const level = (0.38 + (n(x / 12, y / 9) - 0.5) * 0.34 + (fine(x / 3, y / 3) - 0.5) * 0.14 - (ledge ? 0.22 : 0)) * vault;
    pc.set(x, y, pick(rock, level, x, y));
  }
  const wood = pal.wood.map((c) => rgb(c));
  const beam = (x0: number, y0: number, w: number, h: number) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) pc.set(x, y, wood[y === y0 || x === x0 ? 2 : (x + y) % 9 === 0 ? 0 : 1] ?? black);
  };
  const glow = (cx: number, cy: number) => {
    for (let y = cy - 14; y <= cy + 14; y++) for (let x = cx - 14; x <= cx + 14; x++) {
      const d = Math.hypot(x - cx, (y - cy) * 1.1) / 14;
      if (d < 1 && bayer(x, y) < (1 - d) * 0.55) pc.set(x, y, mixRgb(pc.get(x, y) as unknown as Rgb, rgb('#d98a3a'), 0.45 * (1 - d)));
    }
    pc.set(cx, cy, rgb('#fff1b8')); pc.set(cx, cy + 1, rgb('#ffbf6a')); pc.set(cx + 1, cy, rgb('#ffbf6a'));
  };
  // gallery mouths framed in timber
  for (const [cx, w, h] of [[150, 46, 54], [470, 52, 58]] as const) {
    const top = H - 70 - h;
    for (let y = top; y < H - 70; y++) for (let x = cx - w / 2; x < cx + w / 2; x++) pc.set(x, y, black);
    beam(cx - w / 2 - 6, top, 6, h); beam(cx + w / 2, top, 6, h); beam(cx - w / 2 - 10, top - 6, w + 20, 6);
    glow(cx - w / 2 - 12, top + 10);
  }
  // scaffolds: walkways on posts with their braces
  for (const [x0, x1, y] of [[40, 300, 92], [330, 610, 76], [250, 420, 128]] as const) {
    beam(x0, y, x1 - x0, 4);
    for (let x = x0 + 6; x < x1; x += 52) { beam(x, y + 4, 4, 64); for (let t = 0; t < 14; t++) pc.set(x + 4 + t, y + 4 + t, wood[1] ?? black); }
    glow(x0 + Math.round(rng() * (x1 - x0)), y - 6);
  }
  fadeFoot(pc, 0.78);
  return pc;
}

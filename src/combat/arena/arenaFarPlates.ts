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
 * The Dragon's peaks seen across the sea of clouds: a sky in flat bands (a clear day, or a dusk warming toward the
 * horizon), a far range of snowy summits sunk in haze, then rock needles of pale limestone rising out of the clouds in
 * two ranks, lit on their left, a twisted pine clinging to some tops, and the cloud sea filling the foot of the plate.
 */
export function drawCloudsPlate(theme: ArenaTheme, seed = 13, dusk = false): PixelCanvas {
  const W = 960, H = 300;
  const pal = theme.palette;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const haze = rgb(theme.background);
  const zenith = dusk ? rgb('#4a4f86') : mixRgb(haze, rgb('#4f72a6'), 0.85);
  const horizon = dusk ? rgb('#f2b98c') : haze;
  const sky = [0, 0.25, 0.5, 0.75, 1].map((t) => mixRgb(zenith, horizon, t));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) pc.set(x, y, pick(sky, y / (H * 0.58), x, y));
  // a few long wisps, rose at dusk
  const wisp = makeNoise(rng, 16);
  const wispTone = dusk ? rgb('#f6c9b4') : rgb('#f4f7fb');
  for (let y = 10; y < H * 0.3; y++) for (let x = 0; x < W; x++) {
    const v = wisp(x / 70, y / 6) * (1 - y / (H * 0.3));
    if (v > 0.56) pc.set(x, y, mixRgb(pc.get(x, y) as unknown as Rgb, wispTone, v > 0.66 ? 0.6 : 0.3));
  }
  const snowLit = mixRgb(ramp(pal.moss, 1), dusk ? rgb('#ffd2b0') : rgb('#ffffff'), 0.35), snowShade = mixRgb(ramp(pal.moss, 0.25), rgb(dusk ? '#7a6a9e' : '#6a82aa'), 0.4);
  // the far range of snowy summits, sunk in haze
  {
    const r = seeded(seed * 17 + 3);
    const fine = makeNoise(r, 64);
    const peaks: Array<{ x: number; y: number; l: number; rr: number }> = [];
    for (let x = -60; x < W + 60; x += 70 + r() * 70) peaks.push({ x, y: H * (0.3 + r() * 0.1), l: 0.7 + r() * 0.5, rr: 0.8 + r() * 0.5 });
    for (const p of [...peaks].sort((a, b) => a.y - b.y)) {
      for (let x = Math.max(0, Math.floor(p.x - (H - p.y) / p.l)); x < Math.min(W, Math.ceil(p.x + (H - p.y) / p.rr)); x++) {
        const top = p.y + Math.abs(x - p.x) * (x < p.x ? p.l : p.rr) + (fine(x / 5, p.x) - 0.5) * 4;
        for (let y = Math.max(0, Math.floor(top)); y < H * 0.62; y++) {
          const lit = x < p.x + (y - p.y) * 0.2;
          const snowy = (y - p.y) / H < 0.1 + fine(x / 20, 3) * 0.06;
          const tones = snowy ? [snowShade, snowLit] : [mixRgb(ramp(pal.stone, 0.2), haze, 0.3), mixRgb(ramp(pal.stone, 0.6), haze, 0.3)];
          pc.set(x, y, mixRgb(pick(tones, lit ? 0.9 : 0.1, x, y), haze, 0.55 + ((y - top) / H) * 0.5));
        }
      }
    }
  }
  // rock needles: tall pillars with rounded, broken tops, far rank then near rank
  const rockLit = mixRgb(ramp(pal.stone, 0.85), dusk ? rgb('#ffc9a0') : rgb('#ffffff'), 0.2), rockMid = ramp(pal.stone, 0.5);
  const rockShade = mixRgb(ramp(pal.stone, 0.15), rgb(dusk ? '#4e4470' : '#3c4c70'), 0.35);
  const foliage = rgb(pal.foliage[2]);
  for (const rank of [{ top: 0.3, h: 0.34, spacing: 62, haze: 0.5, w: [10, 22], seed: 1 }, { top: 0.22, h: 0.4, spacing: 96, haze: 0.18, w: [16, 34], seed: 2 }]) {
    const r = seeded(seed * 31 + rank.seed);
    const fine = makeNoise(r, 64);
    for (let cx = r() * rank.spacing; cx < W; cx += rank.spacing * (0.6 + r() * 0.8)) {
      if (rank.seed === 2 && Math.abs(cx - W / 2) < 90) continue; // the centre stays open over the clouds
      const half = (rank.w[0]! + r() * (rank.w[1]! - rank.w[0]!)) / 2;
      const peakY = H * (rank.top + r() * rank.h * 0.5);
      for (let y = Math.floor(peakY); y < H * 0.8; y++) {
        const t = (y - peakY) / (H * 0.8 - peakY);
        const w = half * (0.55 + Math.min(1, t * 3) * 0.45) * (1 + (fine(cx / 9, y / 12) - 0.5) * 0.3);
        const round = y - peakY < half * 0.6 ? Math.sqrt(Math.max(0, 1 - ((half * 0.6 - (y - peakY)) / (half * 0.6)) ** 2)) : 1;
        for (let x = Math.floor(cx - w * round); x <= Math.ceil(cx + w * round); x++) {
          if (x < 0 || x >= W) continue;
          const u = (x - (cx - w)) / (2 * w);
          const runnel = fine(x / 3, y / 14) > 0.66;
          const light = u < 0.38 ? 0.9 : u < 0.6 ? 0.5 : 0.12;
          const c = pick([rockShade, rockMid, rockLit], runnel ? light - 0.35 : light, x, y);
          pc.set(x, y, mixRgb(c, haze, Math.min(0.8, rank.haze + t * 0.35)));
        }
      }
      // a twisted pine clinging to some tops
      if (r() < 0.5) for (let k = 0; k < 3; k++) {
        const py = Math.floor(peakY) - 1 - k, pw = Math.round(half * 0.7) - k * 2;
        for (let x = Math.round(cx - pw * 0.4); x <= Math.round(cx + pw); x++) pc.set(x, py, mixRgb(foliage, haze, rank.haze));
      }
    }
  }
  // the sea of clouds: rows of rounded cumulus, far to near, each puff lit on its upper left and blue in its hollows
  const cloudLit = dusk ? rgb('#ffe6d2') : rgb('#fbfcfe'), cloudMid = dusk ? rgb('#e8c6c4') : rgb('#e1e8f0'), cloudShade = dusk ? rgb('#a495b6') : rgb('#aebbcc');
  const cr = seeded(seed * 7 + 5);
  for (let row = 0; row < 4; row++) {
    const base = H * (0.58 + row * 0.06), size = 10 + row * 6;
    for (let cx = -size + cr() * size; cx < W + size; cx += size * (0.9 + cr() * 0.7)) {
      const r = size * (0.7 + cr() * 0.6), cy = base - r * 0.35 + (cr() - 0.5) * 6;
      for (let y = Math.max(0, Math.floor(cy - r)); y < H; y++) for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(W - 1, Math.ceil(cx + r)); x++) {
        const dx = (x - cx) / r, dy = (y - cy) / r;
        if (dy < 0 ? dx * dx + dy * dy > 1 : Math.abs(dx) > 1) continue;
        const light = dy < 0 ? 0.95 - dx * 0.35 - (1 + dy) * 0.3 : 0.45 - dy * 0.5;
        pc.set(x, y, pick([cloudShade, cloudMid, cloudLit], light, x, y));
      }
    }
  }
  fadeFoot(pc, 0.86);
  return pc;
}

/**
 * The back of the Wolf's cave: rough rock falling into darkness, stalactites hanging from the vault, a passage running
 * deeper, hides hung across two recesses and the glow of a few fires. No timber, no carving.
 */
export function drawLairPlate(theme: ArenaTheme, seed = 17): PixelCanvas {
  const W = 640, H = 220;
  const pal = theme.palette;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const n = makeNoise(rng, 32), fine = makeNoise(rng, 64);
  const black = rgb('#060505');
  const rock = [black, rgb(pal.stoneDark[1]), rgb(pal.stone[0]), rgb(pal.stone[1]), rgb(pal.stone[2])];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const vault = clamp((y / H - 0.1) / 0.55);
    const level = (0.4 + (n(x / 14, y / 10) - 0.5) * 0.4 + (fine(x / 3, y / 3) - 0.5) * 0.16) * vault;
    pc.set(x, y, pick(rock, level, x, y));
  }
  // stalactites hanging from the vault
  for (let x = 4; x < W; x += 10 + Math.floor(rng() * 22)) {
    const len = 16 + rng() * 44, w = 3 + rng() * 5;
    for (let y = 0; y < len; y++) {
      const half = w * (1 - y / len);
      for (let dx = -Math.ceil(half); dx <= Math.ceil(half); dx++) {
        if (Math.abs(dx) > half) continue;
        const lit = dx < -half * 0.3 ? 0.5 : dx < half * 0.3 ? 0.3 : 0.12;
        pc.set(x + dx, y, pick(rock, lit * clamp(0.4 + y / len), x + dx, y));
      }
    }
  }
  const glow = (cx: number, cy: number, r: number) => {
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
      const d = Math.hypot(x - cx, (y - cy) * 1.1) / r;
      if (d < 1 && bayer(x, y) < (1 - d) * 0.6) pc.set(x, y, mixRgb(pc.get(x, y) as unknown as Rgb, rgb('#d9822e'), 0.5 * (1 - d)));
    }
    pc.set(cx, cy, rgb('#fff0b4')); pc.set(cx, cy + 1, rgb('#ffb45e')); pc.set(cx + 1, cy, rgb('#ffb45e')); pc.set(cx - 1, cy, rgb('#e07a30'));
  };
  // the passage running deeper, a little firelight at its mouth
  {
    const cx = 420, top = H - 150;
    for (let y = top; y < H - 60; y++) {
      const half = 30 * Math.sqrt(clamp((y - top) / 40)) + (fine(cx / 5, y / 4) - 0.5) * 4;
      for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) pc.set(x, y, black);
    }
    glow(cx - 40, H - 96, 16);
  }
  // hides hung across two recesses, on their poles
  const leather = ['#140e09', '#21170e', '#312215', '#432f1d'].map((c) => rgb(c));
  for (const [x0, w, y0, h] of [[110, 70, 90, 66], [520, 58, 84, 70]] as const) {
    for (let x = x0 - 4; x < x0 + w + 4; x++) { pc.set(x, y0 - 2, leather[0]!); pc.set(x, y0 - 1, leather[2]!); }
    for (let x = x0; x < x0 + w; x++) {
      const hang = h - Math.abs(Math.sin(x * 0.21 + x0)) * 10 - fine(x / 2, 5) * 6;
      for (let y = y0; y < y0 + hang; y++) {
        const fold = Math.sin(x * 0.35 + n(x / 9, y / 20) * 3) * 0.3;
        pc.set(x, y, pick(leather, 0.45 + fold + (fine(x / 4, y / 6) - 0.5) * 0.4 - (y - y0) / h * 0.25, x, y));
      }
    }
    glow(x0 + w + 16, y0 + 18, 14);
  }
  glow(260, H - 110, 18);
  fadeFoot(pc, 0.78);
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

// ---------------------------------------------------------------- the Arid Deserts

/** The desert's red sandstone seen far off: lit face, mid tone, shade. */
const MESA = { lit: rgb('#b8784c'), mid: rgb('#8a5434'), shade: rgb('#5a3424') };

/** A soft glow of `color` around (cx, cy), stretched `sx` times wider than tall, dithered toward its edge. */
function sunGlow(pc: PixelCanvas, cx: number, cy: number, r: number, sx: number, color: Rgb, strength: number): void {
  for (let y = Math.max(0, Math.floor(cy - r)); y < Math.min(pc.height, Math.ceil(cy + r)); y++) {
    for (let x = Math.max(0, Math.floor(cx - r * sx)); x < Math.min(pc.width, Math.ceil(cx + r * sx)); x++) {
      const d = Math.hypot((x - cx) / sx, y - cy) / r;
      if (d < 1 && bayer(x, y) < (1 - d) * 1.2) pc.set(x, y, mixRgb(pc.get(x, y) as unknown as Rgb, color, strength * (1 - d) * (1 - d)));
    }
  }
}

/**
 * The Arid Deserts seen from the dunes: a sky almost white with heat by day (pale blue only at the zenith), or at dusk a
 * warm blue-black over copper and amber with the sun sinking on the left; flat-topped mesas of red sandstone sunk in the
 * haze, then three rows of dunes rising to sharp crests, lit on the face left of each crest, shaded in the lee (blue at
 * dusk); a shimmer of heat over the far dunes by day. `ruins` adds the Phoenix's broken columns and wall stubs on the
 * nearer crests, away from the centre.
 */
export function drawDunesPlate(theme: ArenaTheme, seed = 19, mode: 'day' | 'dusk' | 'ruins' = 'day'): PixelCanvas {
  const W = 960, H = 300;
  const pal = theme.palette;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const dusk = mode === 'dusk';
  const haze = rgb(theme.background);
  const zenith = dusk ? rgb('#2e3a5c') : mixRgb(haze, rgb('#8eacd0'), 0.55);
  const horizon = dusk ? rgb('#f0a560') : mixRgb(haze, rgb('#ffffff'), 0.3);
  const sky = [0, 0.16, 0.32, 0.48, 0.64, 0.8, 1].map((t) => mixRgb(zenith, horizon, t));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) pc.set(x, y, pick(sky, y / (H * 0.74), x, y));
  if (dusk) {
    const sx = W * 0.2, sy = H * 0.69;
    sunGlow(pc, sx, sy, 90, 3.4, rgb('#ffc27a'), 0.7);
    for (let y = Math.floor(sy - 20); y <= sy + 20; y++) for (let x = Math.floor(sx - 20); x <= sx + 20; x++) {
      const d = Math.hypot(x - sx, y - sy);
      if (d < 18) pc.set(x, y, d < 13 ? rgb('#fff2cc') : rgb('#ffd08a'));
    }
  }
  // a few long wisps, copper at dusk
  const wisp = makeNoise(rng, 16);
  const wispTone = dusk ? rgb('#f2b07a') : rgb('#fbf8f0');
  for (let y = 12; y < H * 0.3; y++) for (let x = 0; x < W; x++) {
    const v = wisp(x / 80, y / 5) * (1 - y / (H * 0.3));
    if (v > 0.6) pc.set(x, y, mixRgb(pc.get(x, y) as unknown as Rgb, wispTone, v > 0.68 ? 0.5 : 0.25));
  }
  // the far mesas: flat tops, steep banded faces lit on the left, talus slopes at their feet
  const shade = dusk ? mixRgb(MESA.shade, rgb('#3e4a70'), 0.4) : MESA.shade;
  const lit = dusk ? mixRgb(MESA.lit, rgb('#ffb070'), 0.3) : MESA.lit;
  {
    const r = seeded(seed * 13 + 5);
    const fine = makeNoise(r, 64);
    for (let cx = r() * 120; cx < W + 80; cx += 150 + r() * 160) {
      const half = 16 + r() * 30, topY = H * (0.64 + r() * 0.03), baseY = H * 0.74;
      for (let x = Math.max(0, Math.floor(cx - half - 50)); x < Math.min(W, Math.ceil(cx + half + 50)); x++) {
        const off = Math.abs(x - cx) - half;
        const top = off < 0 ? topY + (fine(x / 6, cx) - 0.5) * 3 : topY + 6 + off * 1.1;
        for (let y = Math.max(0, Math.floor(top)); y < baseY; y++) {
          const band = (y + Math.round(fine(x / 30, 2) * 4)) % 8 === 0;
          const face = x < cx - half * 0.2 ? 0.85 : 0.25; // a lit face and a face in shade
          const c = pick([shade, MESA.mid, lit], off > 0 ? face * 0.7 : band ? face - 0.3 : face, x, y);
          pc.set(x, y, mixRgb(c, haze, 0.5 + ((y - top) / H) * 0.4));
        }
      }
    }
  }
  if (!dusk) for (let y = Math.floor(H * 0.7); y < H * 0.76; y++) {
    const t = 1 - Math.abs(y - H * 0.73) / (H * 0.03);
    for (let x = 0; x < W; x++) if (bayer(x + (y % 3), y) < t * 0.28) pc.set(x, y, mixRgb(pc.get(x, y) as unknown as Rgb, haze, 0.6));
  }
  // three rows of dunes, far to near
  const sandLit = dusk ? mixRgb(ramp(pal.moss, 1), rgb('#ffb070'), 0.45) : ramp(pal.moss, 0.95);
  const sandMid = dusk ? mixRgb(ramp(pal.moss, 0.55), rgb('#c07a5a'), 0.3) : ramp(pal.moss, 0.6);
  const sandShade = dusk ? mixRgb(ramp(pal.moss, 0.1), rgb('#4a5680'), 0.55) : mixRgb(ramp(pal.moss, 0.15), rgb('#7a8aa8'), 0.22);
  const ruinCrests: Array<{ x: number; y: number }> = [];
  [{ base: 0.73, amp: 0.03, haze: 0.5, spacing: 70, s: 1 }, { base: 0.79, amp: 0.05, haze: 0.28, spacing: 110, s: 2 }, { base: 0.86, amp: 0.07, haze: 0.08, spacing: 160, s: 3 }].forEach((row) => {
    const r = seeded(seed * 31 + row.s);
    const fine = makeNoise(r, 64);
    const tone = (light: number, x: number, y: number) => mixRgb(pick([sandShade, sandMid, sandLit], light, x, y), haze, row.haze);
    // the floor of the row, between the dunes
    const floor = Math.round(H * (row.base + row.amp * 0.9));
    for (let y = floor; y < H; y++) for (let x = 0; x < W; x++) pc.set(x, y, tone(0.5 - ((y - floor) / H) * 0.6 + (fine(x / 4, y / 3) - 0.5) * 0.1, x, y));
    // overlapping crescents, left to right: a gentle windward slope lit from the left up to a sharp crest, and the lee
    // in shade under it, its edge slanting down and back from the crest
    const crests: Array<{ x: number; y: number }> = [];
    for (let cx = -row.spacing * 0.5 + r() * row.spacing * 0.4; cx < W + row.spacing; cx += row.spacing * (0.55 + r() * 0.6)) {
      const w = row.spacing * (1.1 + r() * 0.6), cy = H * (row.base - row.amp * (0.3 + r() * 0.5)), depth = floor - cy + 4, lean = 1.2 + r() * 0.8;
      crests.push({ x: cx, y: cy });
      for (let x = Math.max(0, Math.floor(cx - w)); x < Math.min(W, Math.ceil(cx + w * 0.5)); x++) {
        const windward = x < cx, t = windward ? (cx - x) / w : (x - cx) / (w * 0.5);
        const top = cy + depth * (windward ? Math.pow(t, 2.4) : Math.pow(t, 0.6));
        for (let y = Math.floor(top); y <= floor + 2; y++) {
          const lee = x > cx - (y - cy) * lean;
          const light = (lee ? 0.18 : 0.88 - t * 0.2) - ((y - cy) / H) * 0.5 + (fine(x / 4, y / 3) - 0.5) * 0.1;
          pc.set(x, y, tone(light, x, y));
        }
      }
    }
    if (row.s === 2) for (const fx of [0.12, 0.27, 0.72, 0.87]) {
      const near = crests.reduce((best, c) => (Math.abs(c.x - W * fx) < Math.abs(best.x - W * fx) ? c : best), crests[0]!);
      ruinCrests.push({ x: Math.round(near.x), y: Math.round(near.y) });
    }
  });
  if (mode === 'ruins') {
    const ashLit = mixRgb(ramp(pal.stone, 0.85), haze, 0.3), ashShade = mixRgb(ramp(pal.stone, 0.25), haze, 0.3);
    const r = seeded(seed * 7 + 3);
    ruinCrests.forEach(({ x: cx, y: base }, i) => {
      if (i % 2 === 0) {
        // a broken round column, its top jagged
        const w = 6 + Math.round(r() * 4), h = 26 + Math.round(r() * 30);
        for (let x = cx - w; x <= cx + w; x++) {
          const top = base - h + Math.round(Math.abs(Math.sin(x * 1.7 + i)) * 4);
          for (let y = top; y < base + 4; y++) pc.set(x, y, x < cx ? ashLit : ashShade);
        }
      } else {
        // a stub of wall, its courses broken off unevenly
        const w = 22 + Math.round(r() * 16), h = 10 + Math.round(r() * 8);
        for (let x = cx - w; x <= cx + w; x++) {
          const top = base - h + Math.round(Math.abs(Math.sin(x * 0.45 + i)) * 5);
          for (let y = top; y < base + 3; y++) pc.set(x, y, (y - top) % 5 === 0 ? ashShade : x < cx - w * 0.4 ? ashLit : mixRgb(ashLit, ashShade, 0.5));
        }
      }
    });
  }
  fadeFoot(pc, 0.9);
  return pc;
}

/**
 * The far end of the Phoenix's nave: darkness above, two colonnades of round columns receding toward the back wall,
 * saffron hangings between them, the back wall lined with niches whose lamps burn, and the floor lit by them. No window.
 */
export function drawNavePlate(theme: ArenaTheme, seed = 23): PixelCanvas {
  const W = 640, H = 220;
  const pal = theme.palette;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const n = makeNoise(rng, 32), fine = makeNoise(rng, 64);
  const black = rgb('#0a0706');
  const dark = [black, rgb(pal.stoneDark[0]), rgb(pal.stoneDark[1]), rgb(pal.stone[0]), rgb(pal.stone[1])];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const low = clamp((y / H - 0.25) / 0.6);
    pc.set(x, y, pick(dark, (0.3 + (n(x / 16, y / 10) - 0.5) * 0.3 + (fine(x / 3, y / 3) - 0.5) * 0.12) * low, x, y));
  }
  const flame = (cx: number, cy: number, r: number) => {
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
      const d = Math.hypot(x - cx, (y - cy) * 1.2) / r;
      if (d < 1 && bayer(x, y) < (1 - d) * 0.7) pc.set(x, y, mixRgb(pc.get(x, y) as unknown as Rgb, rgb('#e8902e'), 0.55 * (1 - d)));
    }
    pc.set(cx, cy, rgb('#fff4dc')); pc.set(cx, cy + 1, rgb('#ffb44a')); pc.set(cx, cy - 1, rgb('#f2a63a'));
  };
  // the back wall at the end of the nave: dressed courses and a row of niches, each with its lamp
  const wallTop = 70, wallBase = 168;
  for (let y = wallTop; y < wallBase; y++) for (let x = 230; x < 410; x++) {
    const course = (y - wallTop) % 9 === 0 || (x + Math.floor((y - wallTop) / 9) * 7) % 22 === 0;
    pc.set(x, y, pick(dark, course ? 0.35 : 0.62 + (fine(x / 3, y / 3) - 0.5) * 0.15, x, y));
  }
  for (let i = 0; i < 5; i++) {
    const cx = 250 + i * 35, top = 112;
    for (let y = top; y < top + 22; y++) for (let x = cx - 6; x <= cx + 6; x++) pc.set(x, y, y > top + 15 ? mixRgb(black, rgb('#a8642a'), (y - top - 15) / 8) : black);
    flame(cx, top + 18, 8);
  }
  // the colonnades, far to near on both sides, a saffron hanging between each pair
  const cloth = pal.cloth.map((c) => rgb(c));
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const offset = 104 + t * t * 196, w = Math.round(6 + t * 16), base = Math.round(wallBase + 4 + t * 44), top = Math.round(wallTop - 30 - t * 60);
    for (const side of [-1, 1]) {
      const cx = W / 2 + side * offset;
      if (i > 0) {
        const prev = W / 2 + side * (104 + ((i - 1) / 5) ** 2 * 196);
        const x0 = Math.round(Math.min(prev, cx) + w * 0.8), x1 = Math.round(Math.max(prev, cx) - w * 0.8);
        for (let x = x0; x < x1; x++) for (let y = top + 10; y < base - 26 - Math.abs(Math.sin(x * 0.4)) * 4; y++) {
          const fold = Math.sin(x * 0.5) * 0.25;
          pc.set(x, y, pick(cloth, 0.4 + fold - (y - top) / (base - top) * 0.3 + t * 0.2, x, y));
        }
      }
      for (let x = Math.round(cx - w); x <= Math.round(cx + w); x++) for (let y = Math.max(0, top); y < base; y++) {
        const u = (x - (cx - w)) / (2 * w);
        const towardCentre = side > 0 ? 1 - u : u; // lit on the side facing the nave's lamps
        pc.set(x, y, pick(dark, (0.25 + towardCentre * 0.6) * clamp((y - top + 40) / 120) + (fine(x / 2, y / 6) - 0.5) * 0.08, x, y));
      }
      flame(Math.round(cx - side * (w + 6)), base - 8, 7 + i);
    }
  }
  fadeFoot(pc, 0.8);
  return pc;
}

/**
 * The back of the Phoenix's sanctuary dug into the rock: red-brown rock hewn with chisel marks, falling into darkness
 * toward the vault, a row of niches blackened by the smoke of old lamps, and the low red glow of the embers on the
 * floor. No carving here, no stalactite, no hide.
 */
export function drawSanctuaryPlate(theme: ArenaTheme, seed = 29): PixelCanvas {
  const W = 640, H = 220;
  const pal = theme.palette;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const n = makeNoise(rng, 32), fine = makeNoise(rng, 64);
  const black = rgb('#070403');
  const rock = [black, rgb(pal.stoneDark[1]), rgb(pal.stone[0]), rgb(pal.stone[1]), rgb(pal.stone[2])];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const vault = clamp((y / H - 0.12) / 0.55);
    const chisel = (x * 2 + y * 3) % 11 === 0 && fine(x / 4, y / 4) > 0.5; // tool marks of the hewing
    const level = (0.4 + (n(x / 12, y / 9) - 0.5) * 0.36 + (fine(x / 3, y / 3) - 0.5) * 0.12 - (chisel ? 0.18 : 0)) * vault;
    pc.set(x, y, pick(rock, level, x, y));
  }
  for (const cx of [90, 200, 440, 560]) {
    const top = 98 + Math.round(rng() * 10);
    for (let y = top; y < top + 26; y++) for (let x = cx - 7; x <= cx + 7; x++) pc.set(x, y, black);
    // the soot of old lamps licking up from the niche
    for (let y = top - 30; y < top; y++) for (let x = cx - 9; x <= cx + 9; x++) {
      const t = (top - y) / 30;
      if (bayer(x, y) < (1 - t) * (1 - Math.abs(x - cx) / 10) * 0.9) pc.set(x, y, mixRgb(pc.get(x, y) as unknown as Rgb, black, 0.7));
    }
  }
  // the embers' glow on the floor and the foot of the walls
  for (let y = 120; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot((x - W / 2) / 3.2, y - (H - 30)) / 90;
    if (d < 1 && bayer(x, y) < (1 - d) * 0.8) pc.set(x, y, mixRgb(pc.get(x, y) as unknown as Rgb, rgb('#a83a18'), 0.45 * (1 - d)));
  }
  fadeFoot(pc, 0.78);
  return pc;
}

/**
 * The sky over the walled court of the Grand Inquisiteur's house of records: a pale sky white with heat at the horizon,
 * and at its foot only the court's own outer wall of ochre mud brick, its stepped parapet and a few dark copper
 * scorpion finials. No tower, no spire, no roof beyond.
 */
export function drawCourtPlate(theme: ArenaTheme, seed = 31): PixelCanvas {
  const W = 960, H = 300;
  const pal = theme.palette;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const fine = makeNoise(rng, 64);
  const haze = rgb(theme.background);
  const zenith = mixRgb(haze, rgb('#92b0d4'), 0.5), horizon = mixRgb(haze, rgb('#ffffff'), 0.35);
  const sky = [0, 0.3, 0.6, 1].map((t) => mixRgb(zenith, horizon, t));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) pc.set(x, y, pick(sky, y / (H * 0.7), x, y));
  sunGlow(pc, W * 0.18, 0, 140, 2, rgb('#fffaf0'), 0.6);
  const wallTop = Math.round(H * 0.7);
  const plaster = pal.plaster.map((c) => rgb(c));
  const copper = rgb('#5e3420');
  for (let x = 0; x < W; x++) {
    const merlon = Math.floor(x / 18) % 2 === 0;
    const top = wallTop - (merlon ? 6 : 0) - (merlon && x % 18 >= 6 && x % 18 < 12 ? 3 : 0); // stepped merlons
    for (let y = top; y < H; y++) {
      const level = 0.62 - (y - top < 2 ? -0.18 : 0) - (y === wallTop + 6 ? 0.25 : 0) + (fine(x / 4, y / 4) - 0.5) * 0.16;
      pc.set(x, y, mixRgb(pick(plaster, level, x, y), haze, 0.22));
    }
  }
  for (let x = 40 + Math.round(rng() * 40); x < W; x += 150 + Math.round(rng() * 90)) {
    const top = wallTop - 9;
    for (let y = top - 8; y < top; y++) pc.set(x, y, copper);
    pc.set(x + 1, top - 8, copper); pc.set(x + 2, top - 7, copper); pc.set(x + 2, top - 6, copper); pc.set(x + 1, top - 5, copper); // the curled tail
  }
  fadeFoot(pc, 0.9);
  return pc;
}

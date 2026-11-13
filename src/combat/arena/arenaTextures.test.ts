import { describe, expect, it } from 'vitest';
import { ARENA_THEMES, CLAN_BANNER_COLOURS } from './arenaThemes';
import { createFireMaterial } from './arenaProps';
import {
  archWindowTextures, bannerTexture, bearReliefTexture, breachTearTexture, brickTexture, columnTexture, dragonReliefTexture, dragonShape, driedInkTexture, inkStainTexture,
  lionReliefTexture, phoenixReliefTexture, phoenixShape, plasterTexture, ravenShape, scorpionReliefTexture, scorpionShape, serpentShape, standsTexture, wardCircleTexture,
  windowTextures, wolfShape,
} from './arenaTextures';
import type { PixelCanvas } from './pixelArt';

/** Every opaque texel of a canvas. */
function texels(pc: PixelCanvas): Array<[number, number, number]> {
  const out: Array<[number, number, number]> = [];
  for (let y = 0; y < pc.height; y++) for (let x = 0; x < pc.width; x++) { const [r, g, b, a] = pc.get(x, y); if (a) out.push([r, g, b]); }
  return out;
}
const isPurple = ([r, g, b]: [number, number, number]) => r - g > 12 && b - g > 12;

const pal = ARENA_THEMES.lion_sanctum.palette;

describe('arena pixel textures', () => {
  it('paints the house lion in gold on the banner and on the stele, with an emissive mask holding only the gold', () => {
    const banner = bannerTexture(pal, 4);
    expect([banner.width, banner.height]).toEqual([40, 80]);
    const { face, gold } = lionReliefTexture(pal, 61);
    let glowing = 0;
    for (let y = 0; y < gold.height; y++) for (let x = 0; x < gold.width; x++) {
      const [r, g, b] = gold.get(x, y);
      if (r + g + b > 0) {
        glowing++;
        // a glowing texel is warm gold, never the grey stone of the panel
        expect(r).toBeGreaterThan(b);
      }
    }
    expect(glowing).toBeGreaterThan(250);
    expect(glowing).toBeLessThan(face.width * face.height * 0.5);
  });

  it('lights only the panes of the house windows, never their frame', () => {
    for (const burning of [false, true]) {
      const { face, glow } = windowTextures(burning);
      expect([glow.width, glow.height]).toEqual([face.width, face.height]);
      let lit = 0;
      for (let y = 0; y < glow.height; y++) for (let x = 0; x < glow.width; x++) {
        const frame = x === 0 || y === 0 || x === glow.width - 1 || y === glow.height - 1;
        if (glow.get(x, y)[0] > 0) { lit++; expect(frame).toBe(false); }
      }
      expect(lit).toBeGreaterThan(40);
    }
  });

  it('soots the plaster of burning houses', () => {
    const mean = (burning: boolean) => {
      const pc = plasterTexture(pal, 51, burning);
      let sum = 0;
      for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) sum += pc.get(x, y)[0];
      return sum / 1024;
    };
    expect(mean(true)).toBeLessThan(mean(false));
  });

  it('paints the Bear’s sign on its banners in bone on slate, never the lion and never gold', () => {
    const bearPal = ARENA_THEMES.bear_mountain_pass.palette;
    const bear = bannerTexture(bearPal, 1, false, 'bear');
    const lion = bannerTexture(bearPal, 1);
    expect([bear.width, bear.height]).toEqual([40, 80]);
    let differs = 0, warm = 0;
    for (let y = 0; y < 80; y++) for (let x = 0; x < 40; x++) {
      const [r, g, b, a] = bear.get(x, y);
      if (a && r - b > 30 && g - b > 15) warm++;
      if (bear.get(x, y).join() !== lion.get(x, y).join()) differs++;
    }
    expect(warm).toBe(0);
    expect(differs).toBeGreaterThan(200);
    // the lion’s banner is unchanged by the emblem parameter
    expect(bannerTexture(pal, 4).data).toEqual(bannerTexture(pal, 4, false, 'lion').data);
  });

  it('carves the Bear’s relief in grey stone only (no gold, no glow)', () => {
    const relief = bearReliefTexture(ARENA_THEMES.bear_hall_terrace.palette, 70);
    expect([relief.width, relief.height]).toEqual([40, 72]);
    for (let y = 0; y < relief.height; y++) for (let x = 0; x < relief.width; x++) {
      const [r, g, b] = relief.get(x, y);
      expect(r - b).toBeLessThan(10);
      expect(Math.abs(r - g)).toBeLessThan(12);
    }
  });

  it('draws the Dragon’s sign as a winged dragon on four legs, never a serpent', () => {
    let wing = 0;
    for (let y = 0; y < 34; y++) for (let x = 0; x < 26; x++) if (dragonShape(x + 0.5, y + 0.5) >= 2) wing++;
    expect(wing).toBeGreaterThan(60);
    // just under the body, the four legs (and the tail behind them) cross the row as separate strokes
    let runs = 0, inside = false;
    for (let x = 0; x < 26; x += 0.25) {
      const solid = dragonShape(x, 27) === 1;
      if (solid && !inside) runs++;
      inside = solid;
    }
    expect(runs).toBeGreaterThanOrEqual(4);
    // the wolf's sign is a head with its ears and fangs, not the dragon
    let differs = 0;
    for (let y = 0; y < 34; y++) for (let x = 0; x < 26; x++) if (Boolean(wolfShape(x + 0.5, y + 0.5)) !== Boolean(dragonShape(x + 0.5, y + 0.5))) differs++;
    expect(differs).toBeGreaterThan(150);
  });

  it('paints the Dragon’s banners in jade and the Wolf’s in soot and bone, never the Lion’s gold', () => {
    const dragonPal = ARENA_THEMES.dragon_peak_trail.palette, wolfPal = ARENA_THEMES.dragon_wolf_cave.palette;
    const gold = (r: number, g: number, b: number) => r - b > 40 && g - b > 25;
    for (const [banner, other] of [[bannerTexture(dragonPal, 1, false, 'dragon'), bannerTexture(dragonPal, 1)], [bannerTexture(wolfPal, 7, false, 'wolf'), bannerTexture(wolfPal, 7, false, 'bear')]] as const) {
      expect([banner.width, banner.height]).toEqual([40, 80]);
      let differs = 0;
      for (let y = 0; y < 80; y++) for (let x = 0; x < 40; x++) {
        const [r, g, b, a] = banner.get(x, y);
        if (a) expect(gold(r, g, b), `${x},${y}`).toBe(false);
        if (banner.get(x, y).join() !== other.get(x, y).join()) differs++;
      }
      // neither the lion's banner nor the bear's
      expect(differs).toBeGreaterThan(200);
    }
    // the dragon's cloth is jade: greener and bluer than it is red
    let jade = 0;
    const dragon = bannerTexture(dragonPal, 1, false, 'dragon');
    for (let y = 8; y < 60; y++) for (let x = 5; x < 35; x++) { const [r, g, b] = dragon.get(x, y); if (g > r + 15 && b > r + 10) jade++; }
    expect(jade).toBeGreaterThan(600);
  });

  it('carves the Dragon’s relief in limestone with a verdigris inlay, no gold and no glow', () => {
    const relief = dragonReliefTexture(ARENA_THEMES.dragon_hall_esplanade.palette, 90);
    expect([relief.width, relief.height]).toEqual([40, 72]);
    let verdigris = 0;
    for (let y = 0; y < relief.height; y++) for (let x = 0; x < relief.width; x++) {
      const [r, g, b] = relief.get(x, y);
      expect(r - b > 40 && g - b > 25, `${x},${y}`).toBe(false);
      if (g > r + 20) verdigris++;
    }
    expect(verdigris).toBeGreaterThan(100);
  });

  it('draws the Scorpion’s sign with two open pincers and a raised stinger, and the Phoenix’s with spread wings over its flames', () => {
    const grid = (shape: (px: number, py: number) => number) => {
      const cells: number[] = [];
      for (let y = 0; y < 34; y++) for (let x = 0; x < 26; x++) cells.push(shape(x + 0.5, y + 0.5));
      return cells;
    };
    const scorpion = grid(scorpionShape), phoenix = grid(phoenixShape);
    // the pincers: two separate claws across the top rows, the stinger on its own
    let runs = 0, inside = false;
    for (let x = 0; x < 26; x += 0.25) { const solid = scorpionShape(x, 4.4) === 1; if (solid && !inside) runs++; inside = solid; }
    expect(runs).toBe(2);
    expect(scorpion.filter((p) => p === 3).length).toBeGreaterThan(3);
    // the phoenix's wings span nearly the whole grid, its flames fill the foot
    const wingRow = Array.from({ length: 26 }, (_, x) => phoenixShape(x + 0.5, 9.5)).filter(Boolean).length;
    expect(wingRow).toBeGreaterThan(14);
    expect(phoenix.slice(28 * 26).filter((p) => p === 3).length).toBeGreaterThan(40);
    // two different signs, and neither is the dragon or the wolf
    for (const other of [scorpion, grid(dragonShape), grid(wolfShape)]) {
      expect(phoenix.filter((p, i) => Boolean(p) !== Boolean(other[i])).length).toBeGreaterThan(150);
    }
    expect(scorpion.filter((p, i) => Boolean(p) !== Boolean(grid(dragonShape)[i])).length).toBeGreaterThan(150);
  });

  it('paints the Scorpion’s banner in linen on umber and the Phoenix’s hanging in saffron, neither the lion’s, never purple', () => {
    const desert = ARENA_THEMES.scorpion_dune_track.palette, temple = ARENA_THEMES.scorpion_phoenix_temple.palette;
    const scorpion = bannerTexture(desert, 1, false, 'scorpion'), phoenix = bannerTexture(temple, 1, false, 'phoenix');
    for (const [banner, lion] of [[scorpion, bannerTexture(desert, 1)], [phoenix, bannerTexture(temple, 1)]] as const) {
      expect([banner.width, banner.height]).toEqual([40, 80]);
      let differs = 0;
      for (let y = 0; y < 80; y++) for (let x = 0; x < 40; x++) if (banner.get(x, y).join() !== lion.get(x, y).join()) differs++;
      expect(differs).toBeGreaterThan(200);
      for (const texel of texels(banner)) expect(isPurple(texel)).toBe(false);
    }
    // the scorpion's cloth is umber, never the Lion's crimson; the phoenix's is saffron, an orange-yellow
    let crimson = 0, saffron = 0;
    for (let y = 20; y < 60; y++) for (let x = 5; x < 35; x++) {
      const [r, g] = scorpion.get(x, y); if (r - g > 50) crimson++;
      const [pr, pg, pb] = phoenix.get(x, y); if (pr > 180 && pg - pb > 60) saffron++;
    }
    expect(crimson).toBe(0);
    expect(saffron).toBeGreaterThan(300);
  });

  it('carves the Phoenix in ash sandstone with an old saffron pigment on its flames, and the Scorpion in ochre clay stained copper', () => {
    const relief = phoenixReliefTexture(ARENA_THEMES.scorpion_phoenix_ruins.palette, 100);
    expect([relief.width, relief.height]).toEqual([40, 72]);
    const pigment = texels(relief).filter(([r, g, b]) => r - b > 60 && g - b > 25).length;
    expect(pigment).toBeGreaterThan(40);
    // smoke-darkened in the sanctuary
    const sootMean = (pc: PixelCanvas) => texels(pc).reduce((sum, [r]) => sum + r, 0) / (pc.width * pc.height);
    const sanctuary = ARENA_THEMES.scorpion_ash_sanctuary.palette;
    expect(sootMean(phoenixReliefTexture(sanctuary, 100, true))).toBeLessThan(sootMean(phoenixReliefTexture(sanctuary, 100)));
    const lintel = scorpionReliefTexture(ARENA_THEMES.scorpion_records_court.palette, 96);
    expect([lintel.width, lintel.height]).toEqual([48, 40]);
    for (const texel of [...texels(relief), ...texels(lintel)]) expect(isPurple(texel)).toBe(false);
  });

  it('traces the ward circles in saffron and white, and the Shadows’ ink in cold black, never a purple glow', () => {
    const ward = texels(wardCircleTexture(1));
    expect(ward.length).toBeGreaterThan(400);
    for (const [r, g, b] of ward) {
      expect(r).toBeGreaterThan(150);
      expect(r - b).toBeGreaterThan(0);
      expect(g - b).toBeGreaterThanOrEqual(0);
    }
    for (const seed of [0, 1, 2]) {
      const ink = texels(inkStainTexture(seed));
      expect(ink.length).toBeGreaterThan(300);
      for (const [r, g, b] of ink) {
        expect(r + g + b).toBeLessThan(170);
        expect(r).toBeLessThanOrEqual(g); // cold: never warmer in red than in green
      }
    }
  });

  it('burns the Phoenix’s flame saffron round a white heart, leaving every other flame as it was', () => {
    const plain = createFireMaterial(1, [40, 60]), again = createFireMaterial(1, [40, 60]), saffron = createFireMaterial(1, [40, 60], 1.55, { saffron: true });
    expect(plain.fragmentShader).toBe(again.fragmentShader);
    expect(plain.fragmentShader).toContain('vec4(0.86, 0.27, 0.08, 0.78)');
    expect(saffron.fragmentShader).not.toContain('vec4(0.86, 0.27, 0.08, 0.78)');
    expect(saffron.fragmentShader).toContain('if (f > 0.7) c = vec4(1.0, 1.0, 0.95, 1.0);');
    expect(saffron.fragmentShader).not.toContain('vec4(1.0, 0.97, 0.84, 1.0)');
  });

  it('draws the Raven’s sign as a standing raven and the Serpent’s as a coiled serpent with no legs or wings, unlike every other sign', () => {
    const grid = (shape: (px: number, py: number) => number) => {
      const cells: number[] = [];
      for (let y = 0; y < 34; y++) for (let x = 0; x < 26; x++) cells.push(shape(x + 0.5, y + 0.5));
      return cells;
    };
    const raven = grid(ravenShape), serpent = grid(serpentShape);
    expect(raven.filter(Boolean).length).toBeGreaterThan(180);
    expect(serpent.filter(Boolean).length).toBeGreaterThan(180);
    // the raven stands on two legs: two separate strokes cross the row under its body and tail
    let runs = 0, inside = false;
    for (let x = 0; x < 26; x += 0.25) { const solid = ravenShape(x, 28.2) > 0; if (solid && !inside) runs++; inside = solid; }
    expect(runs).toBe(2);
    // the serpent's coils fill its foot from side to side, its forked tongue reaches out on the left
    expect(Array.from({ length: 26 }, (_, x) => serpentShape(x + 0.5, 30)).filter(Boolean).length).toBeGreaterThan(16);
    expect(serpent.filter((p) => p === 3).length).toBeGreaterThan(2);
    for (const other of [scorpionShape, phoenixShape, dragonShape, wolfShape].map(grid)) {
      expect(raven.filter((p, i) => Boolean(p) !== Boolean(other[i])).length).toBeGreaterThan(150);
      expect(serpent.filter((p, i) => Boolean(p) !== Boolean(other[i])).length).toBeGreaterThan(150);
    }
    expect(raven.filter((p, i) => Boolean(p) !== Boolean(serpent[i])).length).toBeGreaterThan(150);
  });

  it('paints every clan’s banner in its own colours, the Raven’s in steel blue and the Serpent’s in green, and burns them the lion’s way', () => {
    const city = ARENA_THEMES.finale_destiny_arena.palette;
    const clan = (emblem: keyof typeof CLAN_BANNER_COLOURS, burning = false) => bannerTexture({ ...city, ...CLAN_BANNER_COLOURS[emblem] }, 3, burning, emblem);
    const raven = clan('raven'), serpent = clan('serpent');
    let blue = 0, green = 0;
    for (let y = 20; y < 60; y++) for (let x = 5; x < 35; x++) {
      const [r, g, b] = raven.get(x, y); if (b > r + 8) blue++;
      const [sr, sg, sb] = serpent.get(x, y); if (sg > sr + 6 && sg >= sb) green++;
    }
    expect(blue).toBeGreaterThan(400);
    expect(green).toBeGreaterThan(400);
    for (const emblem of Object.keys(CLAN_BANNER_COLOURS) as Array<keyof typeof CLAN_BANNER_COLOURS>) {
      const whole = clan(emblem), burnt = clan(emblem, true);
      for (const texel of texels(whole)) expect(isPurple(texel), emblem).toBe(false);
      // burning tears holes in its hem and leaves a glowing edge
      expect(texels(burnt).length, emblem).toBeLessThan(texels(whole).length);
      expect(texels(burnt).some(([r, g, b]) => r > 240 && g > 120 && b < 80), emblem).toBe(true);
    }
  });

  it('lays the capital’s brick red to rust in pale mortar, sooting it on demand, and seats the stands’ crowd with no face, never purple', () => {
    const city = ARENA_THEMES.finale_destiny_arena.palette;
    const clean = brickTexture(city, 600), sooty = brickTexture(city, 600, 0.4);
    expect([clean.width, clean.height]).toEqual([32, 32]);
    const red = texels(clean).filter(([r, g, b]) => r - g > 30 && r - b > 30).length;
    expect(red).toBeGreaterThan(500);
    const mean = (pc: PixelCanvas) => texels(pc).reduce((sum, [r, g, b]) => sum + r + g + b, 0) / texels(pc).length;
    expect(mean(sooty)).toBeLessThan(mean(clean));
    // seamless: the first and last columns and rows continue each other's courses (both mortar or both brick)
    const isMortar = (pc: PixelCanvas, x: number, y: number) => { const [r, g, b] = pc.get(x, y); return Math.abs(r - b) < 16 && Math.abs(r - g) < 16; };
    let breaks = 0;
    for (let y = 0; y < 32; y++) if (isMortar(clean, 0, y) !== isMortar(clean, 31, y) && y % 4 === 3) breaks++;
    expect(breaks).toBe(0);
    const full = standsTexture(city, 620, true), empty = standsTexture(city, 620, false);
    let differs = 0;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) if (full.get(x, y).join() !== empty.get(x, y).join()) differs++;
    expect(differs).toBeGreaterThan(300);
    // no skin tone in the crowd: hoods, caps and the shadow under them
    const skin = texels(full).filter(([r, g, b]) => r > 170 && r - b > 40 && g - b > 20 && r - g < 60).length;
    expect(skin).toBe(0);
    for (const pc of [clean, sooty, full, empty, archWindowTextures(city, false).face, archWindowTextures(city, true).face]) {
      for (const texel of texels(pc)) expect(isPurple(texel)).toBe(false);
    }
  });

  it('opens the breach as a void of cold black ink with a thin cold white rim, and leaves only dull dried ink where it closed', () => {
    const tear = breachTearTexture(1);
    expect([tear.width, tear.height]).toEqual([80, 320]);
    const all = texels(tear);
    const black = all.filter(([r, g, b]) => r + g + b < 30).length, white = all.filter(([r, g, b]) => r > 220 && g > 220 && b > 230).length;
    expect(black).toBeGreaterThan(white * 4);
    expect(white).toBeGreaterThan(300);
    for (const texel of all) {
      expect(isPurple(texel)).toBe(false);
      expect(texel[0]).toBeLessThanOrEqual(texel[2]); // cold: never warmer in red than in blue
    }
    for (const seed of [0, 1, 2]) {
      const scar = texels(driedInkTexture(seed));
      expect(scar.length).toBeGreaterThan(800);
      for (const [r, g, b] of scar) {
        expect(Math.max(r, g, b)).toBeLessThan(120); // a dull grey, nothing glows
        expect(r).toBeLessThanOrEqual(g);
      }
    }
  });

  it('wraps the fluted column texture seamlessly (four whole flutes per repeat)', () => {
    const column = columnTexture(pal, 300);
    expect(column.width % 8).toBe(0);
    expect(column.height).toBe(64);
  });
});

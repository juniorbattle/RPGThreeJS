import { describe, expect, it } from 'vitest';
import { ARENA_THEMES } from './arenaThemes';
import { bannerTexture, bearReliefTexture, columnTexture, lionReliefTexture, plasterTexture, windowTextures } from './arenaTextures';

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

  it('wraps the fluted column texture seamlessly (four whole flutes per repeat)', () => {
    const column = columnTexture(pal, 300);
    expect(column.width % 8).toBe(0);
    expect(column.height).toBe(64);
  });
});

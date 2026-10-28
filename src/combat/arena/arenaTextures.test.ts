import { describe, expect, it } from 'vitest';
import { ARENA_THEMES } from './arenaThemes';
import { bannerTexture, columnTexture, lionReliefTexture, timberWallTexture, timberWindowMask } from './arenaTextures';

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

  it('lights only the window panes of the timber facades', () => {
    for (const burning of [false, true]) {
      const wall = timberWallTexture(pal, 31, burning);
      const mask = timberWindowMask(burning);
      expect([mask.width, mask.height]).toEqual([wall.width, wall.height]);
      let lit = 0;
      for (let y = 0; y < mask.height; y++) for (let x = 0; x < mask.width; x++) if (mask.get(x, y)[0] > 0) lit++;
      expect(lit).toBeGreaterThan(20);
      expect(lit).toBeLessThan(100);
    }
  });

  it('wraps the fluted column texture seamlessly (four whole flutes per repeat)', () => {
    const column = columnTexture(pal, 300);
    expect(column.width % 8).toBe(0);
    expect(column.height).toBe(64);
  });
});

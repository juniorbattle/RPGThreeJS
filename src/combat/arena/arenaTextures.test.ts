import { describe, expect, it } from 'vitest';
import { ARENA_THEMES } from './arenaThemes';
import { bannerTexture, bearReliefTexture, columnTexture, dragonReliefTexture, dragonShape, lionReliefTexture, plasterTexture, windowTextures, wolfShape } from './arenaTextures';

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

  it('wraps the fluted column texture seamlessly (four whole flutes per repeat)', () => {
    const column = columnTexture(pal, 300);
    expect(column.width % 8).toBe(0);
    expect(column.height).toBe(64);
  });
});

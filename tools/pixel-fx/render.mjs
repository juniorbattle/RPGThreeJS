// Renders the hand-written pixel effects into frame sheets and registers them.
// usage: node tools/pixel-fx/render.mjs [--preview-only]
// Colours come from src/combat/fx/fxPalettes.ts, the same palettes as the procedural FX.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Canvas, encodePng } from './core.mjs';
import { PIXEL_EFFECTS } from './effects.mjs';

const PX_PER_UNIT = 40;
const OUT_DIR = 'public/assets/generated/combat-fx';
const REGISTRY = 'src/render/generated/combatFxSheets.json';
const PREVIEW_DIR = 'tmp/pixel-fx';
const previewOnly = process.argv.includes('--preview-only');

function readPalettes() {
  const source = readFileSync('src/combat/fx/fxPalettes.ts', 'utf8');
  const palettes = {};
  for (const [, element, body] of source.matchAll(/^\s+(\w+): \{ (core: '#[^}]+) \},$/gm)) {
    palettes[element] = Object.fromEntries([...body.matchAll(/(\w+): '(#[0-9a-f]{6})'/g)].map((m) => [m[1], m[2]]));
  }
  return palettes;
}

function renderSheet(effect, palettes) {
  const [cols, rows] = effect.grid;
  const size = effect.frameSize, count = cols * rows;
  const sheet = new Canvas(cols * size, rows * size);
  for (let i = 0; i < count; i++) {
    const frame = new Canvas(size, size);
    effect.draw(frame, i, count, palettes);
    frame.blit(sheet, (i % cols) * size, Math.floor(i / cols) * size);
  }
  return sheet;
}

/** The sheet on an arena-like ground, with frame borders, to judge it by eye. */
function preview(sheet, effect) {
  const out = new Canvas(sheet.width, sheet.height);
  for (let i = 0; i < out.rgba.length; i += 4) out.rgba.set([44, 54, 42, 255], i);
  sheet.blit(out, 0, 0);
  for (let i = 1; i < effect.grid[0]; i++) for (let y = 0; y < out.height; y++) out.plot(i * effect.frameSize, y, '#000000');
  for (let i = 1; i < effect.grid[1]; i++) for (let x = 0; x < out.width; x++) out.plot(x, i * effect.frameSize, '#000000');
  return out;
}

const palettes = readPalettes();
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(PREVIEW_DIR, { recursive: true });
const registry = JSON.parse(readFileSync(REGISTRY, 'utf8'));
for (const effect of PIXEL_EFFECTS) {
  const sheet = renderSheet(effect, palettes);
  const [cols, rows] = effect.grid;
  writeFileSync(resolve(PREVIEW_DIR, `${effect.id}.png`), encodePng(preview(sheet, effect)));
  if (previewOnly) continue;
  const png = encodePng(sheet);
  writeFileSync(resolve(OUT_DIR, `${effect.id}.png`), png);
  registry.sheets[effect.id] = {
    file: `/assets/generated/combat-fx/${effect.id}.png`,
    grid: [cols, rows],
    frames: cols * rows,
    pixel: true,
    worldSize: effect.frameSize / PX_PER_UNIT,
    pivotY: effect.pivotY,
  };
  console.log(`${effect.id}: ${sheet.width}x${sheet.height}, ${(png.length / 1024).toFixed(0)} KB`);
}
if (!previewOnly) writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + '\n');

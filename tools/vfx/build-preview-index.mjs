/**
 * R2C-LAB V1D.2 — Deterministic GIF preview index builder.
 *
 * Scans 02_previews/ recursively and maps each inventory candidate
 * to an exact existing GIF file using normalized basename matching.
 *
 * Usage: node tools/vfx/build-preview-index.mjs
 *
 * Output: docs/reports/vfx-megapack-preview-index.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const INVENTORY_PATH = path.join(projectRoot, 'docs', 'reports', 'vfx-megapack-r1-2-4-corrected-inventory.json');
const OUTPUT_PATH = path.join(projectRoot, 'docs', 'reports', 'vfx-megapack-preview-index.json');

/**
 * Normalize a filename to its base form for matching.
 * Strips extension, _spritesheet suffix, lowercases, trims.
 */
function normalizeBase(filename) {
  return filename
    .replace(/_spritesheet\.(png|gif)$/i, '')
    .replace(/\.(png|gif)$/i, '')
    .trim()
    .toLowerCase();
}

/**
 * Recursively scan a directory for .gif files.
 * Returns array of { filename, relPath, folder, absPath }
 */
function scanGifs(dir, rel = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let gifs = [];
  for (const e of entries) {
    if (e.isDirectory()) {
      gifs = gifs.concat(scanGifs(path.join(dir, e.name), path.join(rel, e.name)));
    } else if (e.name.toLowerCase().endsWith('.gif')) {
      gifs.push({
        filename: e.name,
        relPath: path.join(rel, e.name).replace(/\\/g, '/'),
        folder: rel.replace(/\\/g, '/'),
        absPath: path.join(dir, e.name),
      });
    }
  }
  return gifs;
}

/**
 * Find matching GIFs for an inventory base name.
 * Match rules (case-insensitive):
 *   1. Exact: gifBase === inventoryBase
 *   2. Variant: gifBase starts with inventoryBase + '_'
 * Among multiple matches, prefer:
 *   a. Exact match (no suffix)
 *   b. Shortest gifBase (fewest variant characters)
 *   c. If still tied, mark AMBIGUOUS
 */
function findMatches(inventoryBase, gifIndex) {
  const exact = [];
  const variants = [];

  for (const gif of gifIndex) {
    const gifBase = normalizeBase(gif.filename);
    if (gifBase === inventoryBase) {
      exact.push({ ...gif, gifBase, suffixLength: 0 });
    } else if (gifBase.startsWith(inventoryBase + '_')) {
      variants.push({ ...gif, gifBase, suffixLength: gifBase.length - inventoryBase.length });
    }
  }

  return { exact, variants };
}

/**
 * Pick the best match from exact + variant matches.
 * Returns { status, gif } where status is 'RESOLVED' | 'AMBIGUOUS' | 'NO_GIF'
 */
function pickBest(exact, variants, inventoryBase) {
  if (exact.length === 1) {
    return { status: 'RESOLVED', gif: exact[0] };
  }
  if (exact.length > 1) {
    // Multiple exact matches — truly ambiguous
    return { status: 'AMBIGUOUS', gif: null, candidates: exact };
  }

  if (variants.length === 0) {
    return { status: 'NO_GIF', gif: null };
  }

  if (variants.length === 1) {
    return { status: 'RESOLVED', gif: variants[0] };
  }

  // Multiple variants — prefer shortest suffix
  const minSuffix = Math.min(...variants.map(v => v.suffixLength));
  const shortest = variants.filter(v => v.suffixLength === minSuffix);

  if (shortest.length === 1) {
    return { status: 'RESOLVED', gif: shortest[0] };
  }

  // Still tied — try preferring _1 suffix over _A, _B
  const preferOrder = ['_1', '_a', '_b', '_no flash', '_loop'];
  for (const pref of preferOrder) {
    const preferred = shortest.filter(v => v.gifBase.endsWith(inventoryBase + pref) || v.gifBase === inventoryBase + pref);
    if (preferred.length === 1) {
      return { status: 'RESOLVED', gif: preferred[0] };
    }
  }

  // Cannot disambiguate
  return { status: 'AMBIGUOUS', gif: null, candidates: shortest };
}

function main() {
  const megaPackRoot = process.env.MEGA_PACK_ROOT;
  if (!megaPackRoot) {
    console.error('MEGA_PACK_ROOT not set');
    process.exit(1);
  }

  const previewRoot = path.join(megaPackRoot, '02_previews');
  if (!fs.existsSync(previewRoot)) {
    console.error('Preview root not found:', previewRoot);
    process.exit(1);
  }

  console.log('Scanning', previewRoot, '...');
  const allGifs = scanGifs(previewRoot);
  console.log('Found', allGifs.length, 'GIF files');

  const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf-8'));
  console.log('Inventory has', inventory.results.length, 'candidates');

  const index = {};
  let resolved = 0;
  let noGif = 0;
  let ambiguous = 0;

  for (const rec of inventory.results) {
    const inventoryBase = normalizeBase(rec.sourceFilename);
    const { exact, variants } = findMatches(inventoryBase, allGifs);
    const result = pickBest(exact, variants, inventoryBase);

    if (result.status === 'RESOLVED') {
      index[rec.assetId] = {
        status: 'RESOLVED',
        previewFilename: result.gif.filename,
        previewRelativePath: result.gif.relPath,
        previewFolder: result.gif.folder,
      };
      resolved++;
    } else if (result.status === 'AMBIGUOUS') {
      index[rec.assetId] = {
        status: 'AMBIGUOUS',
        previewFilename: null,
        previewRelativePath: null,
        previewFolder: null,
        candidates: (result.candidates || []).map(c => c.filename),
      };
      ambiguous++;
    } else {
      index[rec.assetId] = {
        status: 'NO_GIF',
        previewFilename: null,
        previewRelativePath: null,
        previewFolder: null,
      };
      noGif++;
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    totalGifs: allGifs.length,
    totalCandidates: inventory.results.length,
    counts: {
      resolved,
      noGif,
      ambiguous,
    },
    index,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log('Preview index written to', OUTPUT_PATH);
  console.log('Counts: resolved=%d, noGif=%d, ambiguous=%d, total=%d', resolved, noGif, ambiguous, resolved + noGif + ambiguous);

  // Verify specific candidates
  for (const id of ['r1_1605', 'r1_1642']) {
    const entry = index[id];
    if (entry) {
      console.log('  %s: %s → %s', id, entry.status, entry.previewFilename || '—');
    }
  }
}

main();

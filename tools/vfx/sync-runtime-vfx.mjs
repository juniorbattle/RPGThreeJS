#!/usr/bin/env node
/**
 * VFX Mega Pack R2 — Selected Asset Sync
 *
 * Copies ONLY selected native CartoonCoffee assets from <MEGA_PACK_ROOT>
 * to public/assets/vfx/megapack-runtime/.
 *
 * Commercial PNGs are gitignored and never committed.
 *
 * Usage:
 *   MEGA_PACK_ROOT=/path/to/cartooncoffee node tools/vfx/sync-runtime-vfx.mjs
 *   npm run vfx:sync-runtime
 *
 * Skips cleanly when MEGA_PACK_ROOT is not set or unavailable.
 */

import { createReadStream, createWriteStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const MANIFEST_PATH = join(PROJECT_ROOT, 'docs', 'reports', 'vfx-megapack-r2-selected-runtime-assets.json');
const DEST_ROOT = join(PROJECT_ROOT, 'public', 'assets', 'vfx', 'megapack-runtime');

function readPngDimensions(filePath) {
  return new Promise((resolve, reject) => {
    const stream = createReadStream(filePath, { start: 0, end: 24 });
    stream.on('error', reject);
    stream.on('data', (chunk) => {
      stream.destroy();
      if (chunk.length < 24) {
        reject(new Error('PNG header too short'));
        return;
      }
      const sig = chunk.toString('hex', 0, 8);
      if (sig !== '89504e470d0a1a0a') {
        reject(new Error('Not a valid PNG file'));
        return;
      }
      const width = chunk.readUInt32BE(16);
      const height = chunk.readUInt32BE(20);
      resolve({ width, height });
    });
  });
}

function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function copyFile(src, dst) {
  return new Promise((resolve, reject) => {
    const srcStream = createReadStream(src);
    const dstStream = createWriteStream(dst);
    srcStream.on('error', reject);
    dstStream.on('error', reject);
    dstStream.on('finish', () => resolve());
    srcStream.pipe(dstStream);
  });
}

async function main() {
  const megaPackRoot = process.env.MEGA_PACK_ROOT;
  if (!megaPackRoot) {
    console.error('[vfx:sync-runtime] MEGA_PACK_ROOT environment variable not set.');
    console.error('[vfx:sync-runtime] Skipping sync. Set MEGA_PACK_ROOT to your CartoonCoffee pack root.');
    process.exit(0);
  }

  if (!existsSync(megaPackRoot)) {
    console.error(`[vfx:sync-runtime] MEGA_PACK_ROOT path does not exist: ${megaPackRoot}`);
    console.error('[vfx:sync-runtime] Skipping sync.');
    process.exit(0);
  }

  const manifest = JSON.parse(
    await import('node:fs').then((fs) => fs.readFileSync(MANIFEST_PATH, 'utf-8')),
  );

  if (!manifest.assets || !Array.isArray(manifest.assets)) {
    console.error('[vfx:sync-runtime] Invalid manifest: missing assets array.');
    process.exit(1);
  }

  console.log(`[vfx:sync-runtime] Syncing ${manifest.assets.length} selected assets from ${megaPackRoot}`);
  console.log(`[vfx:sync-runtime] Destination: ${DEST_ROOT}`);

  if (!existsSync(DEST_ROOT)) {
    mkdirSync(DEST_ROOT, { recursive: true });
    console.log(`[vfx:sync-runtime] Created destination directory.`);
  }

  let copied = 0;
  let skipped = 0;
  let missing = 0;
  let mismatched = 0;
  const errors = [];

  for (const asset of manifest.assets) {
    const srcPath = join(megaPackRoot, asset.sourceRelativePath);
    const dstPath = join(DEST_ROOT, asset.destinationFilename);

    if (!existsSync(srcPath)) {
      console.warn(`[vfx:sync-runtime] MISSING: ${asset.candidateId} — ${asset.sourceRelativePath}`);
      missing++;
      continue;
    }

    try {
      const { width, height } = await readPngDimensions(srcPath);
      if (width !== asset.expectedWidth || height !== asset.expectedHeight) {
        console.error(`[vfx:sync-runtime] DIMENSION MISMATCH: ${asset.candidateId} — expected ${asset.expectedWidth}x${asset.expectedHeight}, got ${width}x${height}`);
        mismatched++;
        errors.push(`${asset.candidateId}: dimension mismatch`);
        continue;
      }

      if (width % asset.cols !== 0 || height % asset.rows !== 0) {
        console.error(`[vfx:sync-runtime] GRID MISMATCH: ${asset.candidateId} — ${width}x${height} not divisible by ${asset.cols}x${asset.rows}`);
        mismatched++;
        errors.push(`${asset.candidateId}: grid mismatch`);
        continue;
      }

      const srcStat = statSync(srcPath);
      let needCopy = true;
      if (existsSync(dstPath)) {
        const dstStat = statSync(dstPath);
        if (srcStat.size === dstStat.size) {
          needCopy = false;
        }
      }

      if (needCopy) {
        await copyFile(srcPath, dstPath);
        console.log(`[vfx:sync-runtime] COPIED: ${asset.candidateId} → ${asset.destinationFilename}`);
        copied++;
      } else {
        console.log(`[vfx:sync-runtime] SKIP (up to date): ${asset.candidateId}`);
        skipped++;
      }
    } catch (err) {
      console.error(`[vfx:sync-runtime] ERROR: ${asset.candidateId} — ${err.message}`);
      errors.push(`${asset.candidateId}: ${err.message}`);
    }
  }

  console.log('');
  console.log(`[vfx:sync-runtime] Summary: ${copied} copied, ${skipped} skipped, ${missing} missing, ${mismatched} mismatched`);
  if (errors.length > 0) {
    console.error('[vfx:sync-runtime] Errors:');
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[vfx:sync-runtime] Fatal error:', err);
  process.exit(1);
});

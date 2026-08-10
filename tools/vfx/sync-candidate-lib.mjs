/**
 * Shared single-candidate sync logic.
 *
 * Used by both:
 *  - tools/vfx/sync-candidate.mjs (CLI)
 *  - Vite dev middleware (browser-to-dev acquisition bridge)
 *
 * This ensures candidate validation, source lookup, destination logic,
 * and native metadata checks are identical across both paths.
 */

import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const PROJECT_ROOT = resolve(__dirname, '..', '..');
export const MANIFEST_PATH = join(PROJECT_ROOT, 'docs', 'reports', 'vfx-megapack-r1-2-4-corrected-inventory.json');
export const DEST_ROOT = join(PROJECT_ROOT, 'public', 'assets', 'vfx', 'megapack-runtime');

/**
 * Reads PNG dimensions from the first 24 bytes of the file header.
 */
export function readPngDimensions(filePath) {
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

/**
 * Loads the corrected inventory JSON.
 */
export function loadInventory() {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
}

/**
 * Validates a candidate ID against the inventory.
 * Returns the inventory record or null.
 */
export function validateCandidate(inventory, candidateId) {
  if (!candidateId || typeof candidateId !== 'string') return null;
  // Prevent path traversal — candidateId must be a simple asset ID
  if (candidateId.includes('/') || candidateId.includes('\\') || candidateId.includes('..')) return null;
  const record = inventory.results.find((r) => r.assetId === candidateId);
  if (!record) return null;
  return record;
}

/**
 * Checks if a candidate has a supported native format (2048x2048 or 4096x4096).
 */
export function isSupportedNativeFormat(width, height) {
  return (width === 2048 && height === 2048) || (width === 4096 && height === 4096);
}

/**
 * Syncs a single candidate from MEGA_PACK_ROOT to the runtime directory.
 *
 * Returns:
 *  { ok: true, candidateId, url, width, height, copied: boolean } on success
 *  { ok: false, error: string } on failure
 */
export async function syncSingleCandidate({ megaPackRoot, inventory, candidateId, destRoot = DEST_ROOT }) {
  const record = validateCandidate(inventory, candidateId);
  if (!record) {
    return { ok: false, error: `Candidate ${candidateId} not found in inventory.` };
  }

  if (!isSupportedNativeFormat(record.width, record.height)) {
    return { ok: false, error: `Candidate ${candidateId} has unsupported native format (${record.width}x${record.height}). Only 2048x2048 and 4096x4096 are supported.` };
  }

  if (!megaPackRoot || !existsSync(megaPackRoot)) {
    return { ok: false, error: 'MEGA_PACK_ROOT not set or does not exist.' };
  }

  const srcPath = join(megaPackRoot, record.relativePath);
  const dstPath = join(destRoot, `${candidateId}.png`);

  if (!existsSync(srcPath)) {
    return { ok: false, error: `Source file missing: ${candidateId} — ${record.relativePath}` };
  }

  try {
    const { width, height } = await readPngDimensions(srcPath);
    if (width !== record.width || height !== record.height) {
      return { ok: false, error: `Dimension mismatch: ${candidateId} — expected ${record.width}x${record.height}, got ${width}x${height}` };
    }

    if (!existsSync(destRoot)) {
      mkdirSync(destRoot, { recursive: true });
    }

    let copied = false;
    if (existsSync(dstPath)) {
      const srcStat = statSync(srcPath);
      const dstStat = statSync(dstPath);
      if (srcStat.size !== dstStat.size) {
        await copyFile(srcPath, dstPath);
        copied = true;
      }
    } else {
      await copyFile(srcPath, dstPath);
      copied = true;
    }

    return {
      ok: true,
      candidateId,
      url: `/assets/vfx/megapack-runtime/${candidateId}.png`,
      width,
      height,
      copied,
    };
  } catch (err) {
    return { ok: false, error: `Error syncing ${candidateId}: ${err.message}` };
  }
}

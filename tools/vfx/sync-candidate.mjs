#!/usr/bin/env node
/**
 * VFX Mega Pack R2C-B — On-Demand Single-Candidate Sync (CLI)
 *
 * Copies ONE selected CartoonCoffee asset from <MEGA_PACK_ROOT> to
 * public/assets/vfx/megapack-runtime/ for DEV preview.
 *
 * Commercial PNGs are gitignored and never committed.
 *
 * Usage:
 *   MEGA_PACK_ROOT=/path/to/cartooncoffee node tools/vfx/sync-candidate.mjs r1_0001
 *   MEGA_PACK_ROOT=/path/to/cartooncoffee npm run vfx:sync-candidate -- r1_0001
 *
 * Skips cleanly when MEGA_PACK_ROOT is not set or unavailable.
 */

import { loadInventory, syncSingleCandidate, DEST_ROOT } from './sync-candidate-lib.mjs';

async function main() {
  const candidateId = process.argv[2];
  if (!candidateId) {
    console.error('[vfx:sync-candidate] Usage: node tools/vfx/sync-candidate.mjs <candidateId>');
    console.error('[vfx:sync-candidate] Example: node tools/vfx/sync-candidate.mjs r1_0001');
    process.exit(1);
  }

  const megaPackRoot = process.env.MEGA_PACK_ROOT;
  if (!megaPackRoot) {
    console.error('[vfx:sync-candidate] MEGA_PACK_ROOT environment variable not set.');
    console.error('[vfx:sync-candidate] Skipping. Set MEGA_PACK_ROOT to your CartoonCoffee pack root.');
    process.exit(0);
  }

  const inventory = loadInventory();
  const result = await syncSingleCandidate({ megaPackRoot, inventory, candidateId, destRoot: DEST_ROOT });

  if (!result.ok) {
    console.error(`[vfx:sync-candidate] ${result.error}`);
    process.exit(1);
  }

  if (result.copied) {
    console.log(`[vfx:sync-candidate] COPIED: ${result.candidateId} → ${result.candidateId}.png`);
  } else {
    console.log(`[vfx:sync-candidate] SKIP (up to date): ${result.candidateId}`);
  }
  console.log(`[vfx:sync-candidate] Dimensions: ${result.width}x${result.height}`);
  console.log(`[vfx:sync-candidate] URL: ${result.url}`);
}

main().catch((err) => {
  console.error('[vfx:sync-candidate] Fatal error:', err);
  process.exit(1);
});

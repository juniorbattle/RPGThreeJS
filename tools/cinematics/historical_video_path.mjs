import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const INVENTORY_PATH = 'tools/cinematics/archive/retired-video-masters/inventory.json';

function inventory(projectRoot) {
  return JSON.parse(readFileSync(resolve(projectRoot, INVENTORY_PATH), 'utf8'));
}

/** Resolve a CIN-6 historical master without making it a shipped asset. */
export function historicalVideoPath(projectRoot, id) {
  const retired = inventory(projectRoot).masters.find((master) => master.id === id);
  return resolve(projectRoot, retired?.archivePath ?? `public/assets/cinematics/${id}.mp4`);
}

/** Verify every retired byte against the pre-migration Git tree before allowing its old path in a historical audit. */
export function verifiedRetiredOriginalPaths(projectRoot) {
  const archived = inventory(projectRoot);
  if (archived.schemaVersion !== 1 || archived.masters.length !== 23) throw new Error('Invalid retired video inventory.');
  const originals = new Set();
  for (const master of archived.masters) {
    if (!/^[a-z0-9_]+$/.test(master.id)
      || master.originalPath !== `public/assets/cinematics/${master.id}.mp4`
      || master.archivePath !== `tools/cinematics/archive/retired-video-masters/${master.id}.mp4`) {
      throw new Error(`Invalid retired video path: ${master.id}`);
    }
    const path = resolve(projectRoot, master.archivePath);
    if (!existsSync(path) || existsSync(resolve(projectRoot, master.originalPath))) {
      throw new Error(`Retired video must exist only in the archive: ${master.id}`);
    }
    const bytes = readFileSync(path);
    const sha = createHash('sha256').update(bytes).digest('hex');
    const blob = execFileSync('git', ['hash-object', path], { cwd: projectRoot, encoding: 'utf8' }).trim();
    const originalBlob = execFileSync('git', ['rev-parse', `${archived.sourceCommit}:${master.originalPath}`], { cwd: projectRoot, encoding: 'utf8' }).trim();
    if (bytes.length !== master.bytes || sha !== master.sha256 || blob !== master.gitBlob || blob !== originalBlob) {
      throw new Error(`Retired video bytes changed: ${master.id}`);
    }
    originals.add(master.originalPath);
  }
  return originals;
}

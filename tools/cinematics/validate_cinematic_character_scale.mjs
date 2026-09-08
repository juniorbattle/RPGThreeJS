import { access, readdir, readFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const SCALE_METADATA_PATH = 'tools/cinematics/specs/cinematic_character_scale.json';
export const SCALE_FRAMINGS = Object.freeze(['WIDE', 'MEDIUM', 'CLOSE']);

async function sha256(path) {
  const bytes = await readFile(path);
  return createHash('sha256').update(bytes).digest('hex');
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export async function validateCinematicCharacterScale(input, options = {}) {
  const projectRoot = resolve(options.projectRoot ?? process.cwd());
  const errors = [];
  if (!isRecord(input)) return { valid: false, errors: ['Scale metadata must be an object.'], profileCount: 0 };
  if (input.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  if (input.canonicalFacing !== 'SCREEN_RIGHT') errors.push('canonicalFacing must be SCREEN_RIGHT.');
  if (input.canonicalRoot !== 'public/assets/characters/pixel/full/') errors.push('canonicalRoot must identify the immutable full-character directory.');
  for (const framing of SCALE_FRAMINGS) {
    const value = input.framingProfiles?.[framing]?.referenceVisibleBodyHeightPx;
    if (!Number.isInteger(value) || value < 64 || value > 1400) errors.push(`framingProfiles.${framing} must define a valid referenceVisibleBodyHeightPx.`);
  }
  if (!Array.isArray(input.characters) || !input.characters.length) errors.push('characters must be a non-empty array.');
  const ids = new Set();
  const assets = new Set();
  for (const [index, character] of (input.characters ?? []).entries()) {
    const label = `characters[${index}]`;
    if (!/^[a-z0-9_-]+$/u.test(character?.id ?? '')) errors.push(`${label}.id is invalid.`);
    else if (ids.has(character.id)) errors.push(`${label}.id duplicates '${character.id}'.`);
    else ids.add(character.id);
    if (typeof character?.asset !== 'string' || !character.asset.startsWith(input.canonicalRoot ?? '')) errors.push(`${label}.asset is outside canonicalRoot.`);
    else if (assets.has(character.asset)) errors.push(`${label}.asset duplicates '${character.asset}'.`);
    else assets.add(character.asset);
    if (!Number.isFinite(character?.relativeStature) || character.relativeStature <= 0) errors.push(`${label}.relativeStature must be positive.`);
    for (const key of ['sourceWidth', 'sourceHeight', 'visibleBodyWidth', 'visibleBodyHeight']) {
      if (!Number.isInteger(character?.[key]) || character[key] <= 0) errors.push(`${label}.${key} must be a positive integer.`);
    }
    const bounds = character?.alphaBounds;
    if (!isRecord(bounds) || bounds.left < 0 || bounds.top < 0 || bounds.right > character.sourceWidth || bounds.bottom > character.sourceHeight || bounds.left >= bounds.right || bounds.top >= bounds.bottom) {
      errors.push(`${label}.alphaBounds must remain inside the source frame.`);
    }
    const foot = character?.footAnchor;
    if (!isRecord(foot) || foot.normalizedX < 0 || foot.normalizedX > 1 || foot.normalizedY < 0 || foot.normalizedY > 1 || foot.sourceY !== bounds?.bottom - 1) {
      errors.push(`${label}.footAnchor is invalid.`);
    }
    if (typeof character?.sourceSha256 !== 'string' || !/^[a-f0-9]{64}$/u.test(character.sourceSha256)) errors.push(`${label}.sourceSha256 is invalid.`);
    if (typeof character?.asset === 'string') {
      const path = resolve(projectRoot, character.asset);
      const rel = relative(resolve(projectRoot, input.canonicalRoot ?? ''), path);
      if (rel.startsWith('..') || isAbsolute(rel)) errors.push(`${label}.asset escapes canonicalRoot.`);
      else {
        try {
          await access(path);
          if (await sha256(path) !== character.sourceSha256) errors.push(`${label}.sourceSha256 no longer matches the canonical file.`);
        } catch {
          errors.push(`${label}.asset does not exist.`);
        }
      }
    }
  }

  const canonicalDir = resolve(projectRoot, input.canonicalRoot ?? 'missing');
  try {
    const canonicalPngs = (await readdir(canonicalDir)).filter((name) => name.endsWith('.png')).sort();
    const recordedPngs = [...assets].map((asset) => asset.split('/').at(-1)).sort();
    if (JSON.stringify(canonicalPngs) !== JSON.stringify(recordedPngs)) errors.push('Scale metadata must cover every canonical full-character PNG exactly once.');
  } catch {
    errors.push('canonicalRoot does not exist.');
  }
  return { valid: errors.length === 0, errors, profileCount: ids.size };
}

export async function loadAndValidateCinematicCharacterScale(projectRoot = process.cwd()) {
  const path = resolve(projectRoot, SCALE_METADATA_PATH);
  const input = JSON.parse(await readFile(path, 'utf8'));
  return { input, result: await validateCinematicCharacterScale(input, { projectRoot }) };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const { result } = await loadAndValidateCinematicCharacterScale();
  if (!result.valid) {
    for (const error of result.errors) console.error(`ERROR: ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${result.profileCount} cinematic character scale profiles are valid and canonical hashes are unchanged.`);
  }
}

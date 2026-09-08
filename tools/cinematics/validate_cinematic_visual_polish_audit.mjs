import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { probeMedia } from './cin4_media.mjs';

export const VISUAL_POLISH_AUDIT_PATH = 'tools/cinematics/specs/cinematic_visual_polish_audit.json';
export const VISUAL_POLISH_CRITERIA = Object.freeze([
  'CASTING', 'PLAYER_REPRESENTATION', 'IDENTITY', 'FACING', 'SCALE', 'RELATIVE_HEIGHT',
  'CAMERA_DISTANCE', 'STAGING', 'GROUNDING', 'LOCOMOTION', 'SLIDING', 'ENVIRONMENT_MOTION',
  'PARALLAX', 'WORLD_INTEGRATION', 'CROSS_VIDEO_CONTINUITY', 'SAFE_ZONE', 'FINAL_FRAME', 'GAME_TRUTH',
]);
const CLASSIFICATIONS = new Set(['KEEP', 'POLISH_RUNTIME', 'REMASTER_MEDIA']);
const SEVERITIES = new Set(['LOW', 'MEDIUM', 'HIGH']);
const SCORES = new Set(['PASS', 'WARN', 'FAIL', 'NOT_APPLICABLE']);

function hash(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export async function validateCinematicVisualPolishAudit(input, options = {}) {
  const projectRoot = resolve(options.projectRoot ?? process.cwd());
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { valid: false, errors: ['Audit must be an object.'], entryCount: 0 };
  if (input.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  if (JSON.stringify(input.criteriaOrder) !== JSON.stringify(VISUAL_POLISH_CRITERIA)) errors.push('criteriaOrder must match the CIN-6.6 review contract.');
  if (!Array.isArray(input.entries)) errors.push('entries must be an array.');

  const manifest = JSON.parse(await readFile(resolve(projectRoot, 'public/assets/cinematics/manifest.json'), 'utf8'));
  const production = manifest.cinematics.filter((entry) => entry.sources?.[0]?.src?.endsWith('.mp4'));
  const expectedIds = production.map((entry) => entry.id);
  const ids = new Set();
  const counts = { KEEP: 0, POLISH_RUNTIME: 0, REMASTER_MEDIA: 0 };
  let blockerCount = 0;
  for (const [index, entry] of (input.entries ?? []).entries()) {
    const label = `entries[${index}]`;
    if (!expectedIds.includes(entry?.runtimeId)) errors.push(`${label}.runtimeId is not a production manifest ID.`);
    else if (ids.has(entry.runtimeId)) errors.push(`${label}.runtimeId duplicates '${entry.runtimeId}'.`);
    else ids.add(entry.runtimeId);
    if (!CLASSIFICATIONS.has(entry?.classification)) errors.push(`${label}.classification is invalid.`);
    else counts[entry.classification] += 1;
    if (!SEVERITIES.has(entry?.severity)) errors.push(`${label}.severity is invalid.`);
    if (!Array.isArray(entry?.issues) || entry.issues.some((issue) => !/^[A-Z0-9_]+$/u.test(issue))) errors.push(`${label}.issues must contain stable issue codes.`);
    if (!Array.isArray(entry?.criteriaScores) || entry.criteriaScores.length !== VISUAL_POLISH_CRITERIA.length || entry.criteriaScores.some((score) => !SCORES.has(score))) {
      errors.push(`${label}.criteriaScores must score every review criterion.`);
    }
    if (typeof entry?.recommendedAction !== 'string' || !entry.recommendedAction.trim()) errors.push(`${label}.recommendedAction is required.`);
    if (typeof entry?.cin6cBlocker !== 'boolean') errors.push(`${label}.cin6cBlocker must be boolean.`);
    else if (entry.cin6cBlocker) blockerCount += 1;
    if (entry?.classification === 'KEEP' && ((entry.issues?.length ?? 0) !== 0 || entry.criteriaScores?.includes('FAIL'))) errors.push(`${label} KEEP entries cannot contain media failure findings.`);
    if (entry?.classification === 'REMASTER_MEDIA' && (!(entry.issues?.length > 0) || !entry.criteriaScores?.includes('FAIL'))) errors.push(`${label} REMASTER_MEDIA entries require an exact issue and failed criterion.`);

    const manifestEntry = production.find((candidate) => candidate.id === entry?.runtimeId);
    if (manifestEntry) {
      const mediaPath = resolve(projectRoot, 'public', manifestEntry.sources[0].src.replace(/^\//u, ''));
      const bytes = await readFile(mediaPath);
      if (entry.sha256 !== hash(bytes)) errors.push(`${label}.sha256 does not match the production master.`);
      const report = await probeMedia(mediaPath, projectRoot, options.ffprobe);
      if (Math.abs(Number(entry.durationSeconds) - report.durationSeconds) > 0.05) errors.push(`${label}.durationSeconds does not match ffprobe.`);
    }
  }
  if (JSON.stringify([...ids]) !== JSON.stringify(expectedIds)) errors.push('Audit entries must cover every production master exactly once and in manifest order.');
  const expectedSummary = {
    totalProductionMasters: production.length,
    keep: counts.KEEP,
    polishRuntime: counts.POLISH_RUNTIME,
    remasterMedia: counts.REMASTER_MEDIA,
    cin6cBlockers: blockerCount,
  };
  if (JSON.stringify(input.summary) !== JSON.stringify(expectedSummary)) errors.push('summary does not match the audited entries.');
  return { valid: errors.length === 0, errors, entryCount: ids.size, summary: expectedSummary };
}

export async function loadAndValidateCinematicVisualPolishAudit(projectRoot = process.cwd()) {
  const input = JSON.parse(await readFile(resolve(projectRoot, VISUAL_POLISH_AUDIT_PATH), 'utf8'));
  return { input, result: await validateCinematicVisualPolishAudit(input, { projectRoot }) };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const { result } = await loadAndValidateCinematicVisualPolishAudit();
  if (!result.valid) {
    for (const error of result.errors) console.error(`ERROR: ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${result.entryCount} production masters audited (${result.summary.keep} KEEP, ${result.summary.polishRuntime} POLISH_RUNTIME, ${result.summary.remasterMedia} REMASTER_MEDIA; ${result.summary.cin6cBlockers} CIN-6C blockers).`);
  }
}

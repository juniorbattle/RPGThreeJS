#!/usr/bin/env node
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { assertWithin, findProjectRoot, loadSpecShot, parseArgs, probeMedia, sampleFrameStats, sequenceRoot, sha256, shotRoot, technicalErrors } from './cin4_media.mjs';

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = await findProjectRoot();
  const { spec, shot } = await loadSpecShot(projectRoot, args.spec, args.shot, false);
  const input = resolve(projectRoot, args.input ?? '');
  const kind = args.kind ?? 'candidate';
  if (!['candidate', 'master', 'sequence'].includes(kind)) throw new Error('--kind must be candidate, master, or sequence.');
  if (kind === 'sequence') {
    const production = resolve(projectRoot, 'public', 'assets', 'cinematics', `${spec.cinematicId}.mp4`);
    if (input !== production) assertWithin(sequenceRoot(projectRoot, spec), input, '--input');
  }
  else {
    if (!shot) throw new Error('--shot is required unless --kind sequence is used.');
    assertWithin(shotRoot(projectRoot, spec, shot), input, '--input');
  }
  await access(input);
  const expectedDuration = kind === 'sequence' ? spec.shots.reduce((sum, entry) => sum + entry.durationSeconds, 0) : (kind === 'master' ? shot.durationSeconds : null);
  const report = await probeMedia(input, projectRoot, args.ffprobe);
  const frameStats = await sampleFrameStats(input, projectRoot, { ffmpeg: args.ffmpeg, timestamp: Math.max(0, (report.durationSeconds ?? 0) - 0.05) });
  const errors = technicalErrors(report, expectedDuration, kind !== 'candidate');
  if (kind === 'candidate' && ![[1920, 1080], [2560, 1440]].some(([width, height]) => report.width === width && report.height === height)) {
    errors.push('2K candidate dimensions must be 2560x1440 or 1920x1080');
  }
  if (!frameStats.nonblack) errors.push('last sampled frame must be nonblack');
  if (!frameStats.nonblank) errors.push('last sampled frame must be nonblank');
  console.log(JSON.stringify({ kind, shotId: shot?.shotId ?? null, path: input, sha256: await sha256(input), report, lastFrameStats: frameStats, validation: errors.length ? 'FAIL' : 'PASS', errors }, null, 2));
  if (errors.length) process.exitCode = 1;
}

main().catch((error) => { console.error(`ERROR: ${error.message}`); process.exitCode = 1; });

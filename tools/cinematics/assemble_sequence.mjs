#!/usr/bin/env node
import { access, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { findMediaTool } from './ffmpeg_tools.mjs';
import { analyzeRgb, compareRgb, findProjectRoot, loadSpecShot, parseArgs, probeMedia, readFrameRgb, run, sequenceRoot, sha256, technicalErrors, validateAssemblyEvidence } from './cin4_media.mjs';

async function refuse(path) {
  try { await access(path); throw new Error(`Refusing to overwrite existing artifact: ${path}`); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = await findProjectRoot();
  const { spec } = await loadSpecShot(projectRoot, args.spec, null, true);
  if (spec.shots.length !== 3) throw new Error('CIN-4 pilot assembly requires exactly three ordered shots.');
  const root = sequenceRoot(projectRoot, spec);
  const inputs = [];
  const shotEvidence = [];
  for (const shot of spec.shots) {
    const path = resolve(root, shot.shotId, 'shot_master.mp4');
    const metadataPath = resolve(root, shot.shotId, 'shot_master.metadata.json');
    await Promise.all([access(path), access(metadataPath)]);
    const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
    if (metadata.shotId !== shot.shotId || metadata.outputSha256 !== await sha256(path)) throw new Error(`Master metadata mismatch for ${shot.shotId}.`);
    const report = await probeMedia(path, projectRoot, args.ffprobe);
    const errors = technicalErrors(report, shot.durationSeconds, true);
    if (errors.length) throw new Error(`${shot.shotId} master failed validation: ${errors.join('; ')}`);
    inputs.push(path);
    shotEvidence.push({ shotId: shot.shotId, durationSeconds: shot.durationSeconds, path: relative(projectRoot, path).replaceAll('\\', '/'), sha256: await sha256(path) });
  }
  const output = resolve(root, `${spec.sequenceId}_candidate.mp4`);
  const partial = resolve(root, `${spec.sequenceId}_candidate.part.mp4`);
  const metadataPath = resolve(root, `${spec.sequenceId}_assembly.metadata.json`);
  await Promise.all([output, partial, metadataPath].map(refuse));
  const ffmpeg = await findMediaTool('ffmpeg', projectRoot, args.ffmpeg);
  const inputArgs = inputs.flatMap((path) => ['-i', path]);
  const labels = inputs.map((_, index) => `[${index}:v:0]`).join('');
  try {
    await run(ffmpeg, ['-hide_banner', '-nostdin', ...inputArgs, '-filter_complex', `${labels}concat=n=${inputs.length}:v=1:a=0,setsar=1,format=yuv420p[v]`, '-map', '[v]', '-an', '-map_metadata', '-1', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-g', '48', '-movflags', '+faststart', partial]);
    await rename(partial, output);
  } catch (error) {
    await rm(partial, { force: true });
    throw error;
  }
  const duration = spec.shots.reduce((sum, shot) => sum + shot.durationSeconds, 0);
  const report = await probeMedia(output, projectRoot, args.ffprobe);
  const errors = technicalErrors(report, duration, true);
  const boundaries = [];
  let boundary = 0;
  for (let index = 0; index < spec.shots.length - 1; index += 1) {
    const shot = spec.shots[index];
    boundary += shot.durationSeconds;
    const beforeRgb = await readFrameRgb(inputs[index], projectRoot, { ffmpeg: args.ffmpeg, timestamp: shot.durationSeconds - 1 / 24 });
    const afterRgb = await readFrameRgb(inputs[index + 1], projectRoot, { ffmpeg: args.ffmpeg, timestamp: 0 });
    const before = analyzeRgb(beforeRgb);
    const after = analyzeRgb(afterRgb);
    if (!before.nonblack || !before.nonblank || !after.nonblack || !after.nonblank) errors.push(`boundary at ${boundary}s contains a black or blank seam frame`);
    const frameDifference = compareRgb(beforeRgb, afterRgb);
    if (shot.continuityOut === 'LAST_FRAME' && frameDifference.meanAbsoluteDifference > 12) errors.push(`LAST_FRAME chain at ${boundary}s exceeds continuity difference threshold`);
    boundaries.push({ atSeconds: boundary, continuityOut: shot.continuityOut, before, after, frameDifference });
  }
  if (errors.length) throw new Error(`Assembly validation failed: ${errors.join('; ')}`);
  const metadata = {
    schemaVersion: 1, sequenceId: spec.sequenceId, cinematicId: spec.cinematicId, tier: spec.tier,
    editorialOrder: spec.shots.map((shot) => shot.shotId), transitions: ['CUT', 'CUT'], expectedDurationSeconds: duration,
    shots: shotEvidence, outputPath: relative(projectRoot, output).replaceAll('\\', '/'), outputSha256: await sha256(output), report, boundaryFrameStatistics: boundaries,
  };
  const evidenceErrors = validateAssemblyEvidence(spec, metadata);
  if (evidenceErrors.length) throw new Error(`Assembly evidence failed: ${evidenceErrors.join('; ')}`);
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ validation: 'PASS', ...metadata }, null, 2));
}

main().catch((error) => { console.error(`ERROR: ${error.message}`); process.exitCode = 1; });

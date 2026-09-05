#!/usr/bin/env node
import { access, rename, rm, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { findMediaTool } from './ffmpeg_tools.mjs';
import { assertWithin, findProjectRoot, loadSpecShot, parseArgs, probeMedia, run, sha256, shotRoot, technicalErrors } from './cin4_media.mjs';

async function refuse(path) {
  try { await access(path); throw new Error(`Refusing to overwrite existing artifact: ${path}`); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = await findProjectRoot();
  const { spec, shot } = await loadSpecShot(projectRoot, args.spec, args.shot, false);
  const root = shotRoot(projectRoot, spec, shot);
  const input = resolve(projectRoot, args.input ?? '');
  assertWithin(root, input, '--input');
  await access(input);
  const output = resolve(root, 'shot_master.mp4');
  const partial = resolve(root, 'shot_master.part.mp4');
  const metadataPath = resolve(root, 'shot_master.metadata.json');
  await Promise.all([output, partial, metadataPath].map(refuse));
  const ffmpeg = await findMediaTool('ffmpeg', projectRoot, args.ffmpeg);
  const duration = shot.durationSeconds;
  try {
    await run(ffmpeg, [
      '-hide_banner', '-nostdin', '-i', input,
      '-map', '0:v:0', '-an', '-map_metadata', '-1',
      '-vf', `scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=24,tpad=stop_mode=clone:stop_duration=${duration},trim=duration=${duration},setpts=PTS-STARTPTS`,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-g', '48', '-movflags', '+faststart', partial,
    ]);
    await rename(partial, output);
  } catch (error) {
    await rm(partial, { force: true });
    throw error;
  }
  const report = await probeMedia(output, projectRoot, args.ffprobe);
  const errors = technicalErrors(report, duration, true);
  if (errors.length) throw new Error(`Master validation failed: ${errors.join('; ')}`);
  const metadata = {
    schemaVersion: 1, sequenceId: spec.sequenceId, cinematicId: spec.cinematicId, tier: spec.tier, shotId: shot.shotId,
    sourceCandidatePath: relative(projectRoot, input).replaceAll('\\', '/'), sourceCandidateSha256: await sha256(input),
    outputPath: relative(projectRoot, output).replaceAll('\\', '/'), outputSha256: await sha256(output), report,
  };
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ validation: 'PASS', ...metadata }, null, 2));
}

main().catch((error) => { console.error(`ERROR: ${error.message}`); process.exitCode = 1; });

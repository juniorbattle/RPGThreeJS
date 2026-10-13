#!/usr/bin/env node
import { access, mkdir, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { findMediaTool } from './ffmpeg_tools.mjs';
import {
  assertWithin,
  findProjectRoot,
  loadSpecShot,
  parseArgs,
  probeMedia,
  run,
  sha256,
  shotRoot,
} from './cin4_media.mjs';

async function refuse(path) {
  try {
    await access(path);
    throw new Error(`Refusing to overwrite review artifact: ${path}`);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = await findProjectRoot();
  const { spec, shot } = await loadSpecShot(projectRoot, args.spec, args.shot, true);
  const root = shotRoot(projectRoot, spec, shot);
  const input = resolve(projectRoot, args.input ?? '');
  assertWithin(root, input, '--input');
  await access(input);
  const label = args.label;
  if (!/^[a-z0-9_-]+$/u.test(label ?? '')) throw new Error('--label must be a stable lowercase label.');
  const outputDir = resolve(root, `review_${label}`);
  const metadataPath = resolve(outputDir, 'review.metadata.json');
  await mkdir(outputDir, { recursive: true });
  await refuse(metadataPath);

  const report = await probeMedia(input, projectRoot, args.ffprobe);
  const duration = report.durationSeconds;
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Could not determine candidate duration.');
  const samples = [
    ['first', 0],
    ['p25', duration * 0.25],
    ['p50', duration * 0.5],
    ['p75', duration * 0.75],
    ['last', Math.max(0, duration - 0.1)],
  ];
  const ffmpeg = await findMediaTool('ffmpeg', projectRoot, args.ffmpeg);
  const frames = [];
  for (const [frameLabel, timestamp] of samples) {
    const output = resolve(outputDir, `${frameLabel}.png`);
    await refuse(output);
    await run(ffmpeg, [
      '-hide_banner', '-loglevel', 'error', '-nostdin',
      '-ss', Number(timestamp).toFixed(6), '-i', input,
      '-frames:v', '1', '-vf', 'scale=960:540:flags=lanczos', output,
    ]);
    frames.push({
      label: frameLabel,
      timestampSeconds: Number(timestamp.toFixed(6)),
      path: relative(projectRoot, output).replaceAll('\\', '/'),
      sha256: await sha256(output),
    });
  }
  const metadata = {
    schemaVersion: 1,
    cinematicId: spec.cinematicId,
    shotId: shot.shotId,
    label,
    inputPath: relative(projectRoot, input).replaceAll('\\', '/'),
    inputSha256: await sha256(input),
    report,
    frames,
  };
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ validation: 'CAPTURED', ...metadata }, null, 2));
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
});

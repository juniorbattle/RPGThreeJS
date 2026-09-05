#!/usr/bin/env node
import { access, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { findMediaTool } from './ffmpeg_tools.mjs';
import { analyzeRgb, assertWithin, capture, findProjectRoot, loadSpecShot, parseArgs, run, sha256, shotRoot, validateLastFrameEvidence } from './cin4_media.mjs';

async function refuse(path) {
  try { await access(path); throw new Error(`Refusing to overwrite existing artifact: ${path}`); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = await findProjectRoot();
  const { spec, shot } = await loadSpecShot(projectRoot, args.spec, args.shot, false);
  const root = shotRoot(projectRoot, spec, shot);
  const input = resolve(projectRoot, args.input ?? resolve(root, 'shot_master.mp4'));
  assertWithin(root, input, '--input');
  await access(input);
  const output = resolve(root, 'last_frame.png');
  const partial = resolve(root, 'last_frame.part.png');
  const metadataPath = resolve(root, 'last_frame.metadata.json');
  await Promise.all([output, partial, metadataPath].map(refuse));
  const ffprobe = await findMediaTool('ffprobe', projectRoot, args.ffprobe);
  const framesResult = JSON.parse(await capture(ffprobe, ['-v', 'error', '-select_streams', 'v:0', '-show_frames', '-show_entries', 'frame=best_effort_timestamp_time,width,height', '-of', 'json', input]));
  const frames = (framesResult.frames ?? []).filter((frame) => frame.width && frame.height);
  if (!frames.length) throw new Error('No decoded video frames found.');
  const exactFrameIndex = frames.length - 1;
  const frame = frames[exactFrameIndex];
  const ffmpeg = await findMediaTool('ffmpeg', projectRoot, args.ffmpeg);
  try {
    await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-i', input, '-vf', `select=eq(n\\,${exactFrameIndex})`, '-fps_mode', 'vfr', '-frames:v', '1', partial]);
    await rename(partial, output);
  } catch (error) {
    await rm(partial, { force: true });
    throw error;
  }
  const png = await readFile(output);
  if (!png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('Extracted last frame is not PNG.');
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (width !== 1920 || height !== 1080) throw new Error(`Extracted last frame must be 1920x1080, received ${width}x${height}.`);
  const rgb = await capture(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-i', output, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { binary: true });
  const statistics = analyzeRgb(rgb);
  if (!statistics.nonblack || !statistics.nonblank) throw new Error('Extracted last frame failed nonblack/nonblank validation.');
  const metadata = {
    schemaVersion: 1, sequenceId: spec.sequenceId, cinematicId: spec.cinematicId, shotId: shot.shotId,
    sourceVideoPath: relative(projectRoot, input).replaceAll('\\', '/'), sourceVideoSha256: await sha256(input),
    exactFrameIndex, decodedFrameCount: frames.length, bestEffortTimestampSeconds: Number(frame.best_effort_timestamp_time),
    outputPath: relative(projectRoot, output).replaceAll('\\', '/'), outputSha256: await sha256(output), width, height, statistics,
  };
  const evidenceErrors = validateLastFrameEvidence(metadata);
  if (evidenceErrors.length) throw new Error(`Last-frame evidence failed: ${evidenceErrors.join('; ')}`);
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ validation: 'PASS', ...metadata }, null, 2));
}

main().catch((error) => { console.error(`ERROR: ${error.message}`); process.exitCode = 1; });

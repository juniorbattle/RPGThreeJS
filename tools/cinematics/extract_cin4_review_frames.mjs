#!/usr/bin/env node
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { findMediaTool } from './ffmpeg_tools.mjs';
import { assertWithin, capture, findProjectRoot, loadSpecShot, parseArgs, run, sha256, shotRoot } from './cin4_media.mjs';

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = await findProjectRoot();
  const { spec, shot } = await loadSpecShot(projectRoot, args.spec, args.shot, false);
  const root = shotRoot(projectRoot, spec, shot);
  const input = resolve(projectRoot, args.input ?? resolve(root, 'shot_master.mp4'));
  assertWithin(root, input, '--input');
  await access(input);
  const outputDir = resolve(root, args.output ?? 'review_frames');
  assertWithin(root, outputDir, '--output');
  await mkdir(outputDir, { recursive: true });
  const ffprobe = await findMediaTool('ffprobe', projectRoot, args.ffprobe);
  const framesResult = JSON.parse(await capture(ffprobe, ['-v', 'error', '-select_streams', 'v:0', '-show_frames', '-show_entries', 'frame=best_effort_timestamp_time,width,height', '-of', 'json', input]));
  const frames = (framesResult.frames ?? []).filter((frame) => frame.width && frame.height);
  if (!frames.length) throw new Error('No decoded frames found.');
  const selections = [
    ['first', 0], ['p25', Math.round((frames.length - 1) * 0.25)], ['p50', Math.round((frames.length - 1) * 0.5)],
    ['p75', Math.round((frames.length - 1) * 0.75)], ['last', frames.length - 1],
  ];
  const ffmpeg = await findMediaTool('ffmpeg', projectRoot, args.ffmpeg);
  const manifest = { schemaVersion: 1, sequenceId: spec.sequenceId, shotId: shot.shotId, inputPath: relative(projectRoot, input).replaceAll('\\', '/'), inputSha256: await sha256(input), decodedFrameCount: frames.length, frames: [] };
  for (const [label, index] of selections) {
    const output = resolve(outputDir, `${label}.png`);
    try { await access(output); throw new Error(`Refusing to overwrite review frame: ${output}`); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
    await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-i', input, '-vf', `select=eq(n\\,${index}),scale=960:540:flags=lanczos`, '-fps_mode', 'vfr', '-frames:v', '1', output]);
    manifest.frames.push({ label, exactFrameIndex: index, timestampSeconds: Number(frames[index].best_effort_timestamp_time), path: relative(projectRoot, output).replaceAll('\\', '/'), sha256: await sha256(output) });
  }
  const manifestPath = resolve(outputDir, 'review_frames.metadata.json');
  try { await access(manifestPath); throw new Error(`Refusing to overwrite review metadata: ${manifestPath}`); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`Extracted exact first/25/50/75/last frames to ${relative(projectRoot, outputDir).replaceAll('\\', '/')} (ignored).`);
}

main().catch((error) => { console.error(`ERROR: ${error.message}`); process.exitCode = 1; });

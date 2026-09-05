#!/usr/bin/env node
import { access, mkdir, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { findMediaTool } from './ffmpeg_tools.mjs';
import { assertWithin, findProjectRoot, loadSpecShot, parseArgs, probeMedia, run, sequenceRoot, sha256 } from './cin4_media.mjs';

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = await findProjectRoot();
  const { spec } = await loadSpecShot(projectRoot, args.spec, null, true);
  const label = args.label;
  if (!/^[a-z0-9_-]+$/u.test(label ?? '')) throw new Error('--label must be a stable lowercase label.');
  const input = resolve(projectRoot, args.input ?? '');
  const production = resolve(projectRoot, 'public', 'assets', 'cinematics', `${spec.cinematicId}.mp4`);
  if (input !== production) assertWithin(sequenceRoot(projectRoot, spec), input, '--input');
  await access(input);
  const outputDir = resolve(sequenceRoot(projectRoot, spec), `review_${label}`);
  await mkdir(outputDir, { recursive: true });
  const metadataPath = resolve(outputDir, 'sequence_review.metadata.json');
  try { await access(metadataPath); throw new Error(`Refusing to overwrite review metadata: ${metadataPath}`); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
  const report = await probeMedia(input, projectRoot, args.ffprobe);
  const duration = report.durationSeconds;
  const isCandidate = Math.abs(duration - spec.shots.reduce((sum, shot) => sum + shot.durationSeconds, 0)) < 0.1;
  let selections;
  if (isCandidate) {
    let boundary = 0;
    selections = [['start', 0]];
    for (const [index, shot] of spec.shots.entries()) {
      selections.push([`${shot.shotId}_mid`, boundary + shot.durationSeconds / 2]);
      boundary += shot.durationSeconds;
      selections.push([`${shot.shotId}_end`, Math.max(0, boundary - 1 / 24)]);
      if (index < spec.shots.length - 1) selections.push([`${spec.shots[index + 1].shotId}_start`, boundary]);
    }
  } else {
    selections = [['start', 0], ['p25', duration * 0.25], ['p50', duration * 0.5], ['p75', duration * 0.75], ['end', Math.max(0, duration - 1 / 24)]];
  }
  const ffmpeg = await findMediaTool('ffmpeg', projectRoot, args.ffmpeg);
  const frames = [];
  for (const [frameLabel, timestamp] of selections) {
    const output = resolve(outputDir, `${String(frames.length).padStart(2, '0')}_${frameLabel}.png`);
    try { await access(output); throw new Error(`Refusing to overwrite review frame: ${output}`); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
    await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-ss', Number(timestamp).toFixed(6), '-i', input, '-frames:v', '1', '-vf', 'scale=960:540:flags=lanczos', output]);
    frames.push({ label: frameLabel, timestampSeconds: Number(timestamp.toFixed(6)), path: relative(projectRoot, output).replaceAll('\\', '/'), sha256: await sha256(output) });
  }
  const metadata = { schemaVersion: 1, sequenceId: spec.sequenceId, label, inputPath: relative(projectRoot, input).replaceAll('\\', '/'), inputSha256: await sha256(input), report, frames };
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  console.log(`Extracted ${frames.length} ${label} review frames to ${relative(projectRoot, outputDir).replaceAll('\\', '/')} (ignored).`);
}

main().catch((error) => { console.error(`ERROR: ${error.message}`); process.exitCode = 1; });

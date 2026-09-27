/** Trim the two real-time browser recordings into focused Lot A review clips. */
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { findMediaTool } from './cinematics/ffmpeg_tools.mjs';

const run = promisify(execFile);
const output = resolve('docs/reports/traversal-t0-route-checkpoints-1-shared-world-full-browser');
const gallery = JSON.parse(await readFile(resolve(output, 'gallery-index.json'), 'utf8'));
const ffmpeg = await findMediaTool('ffmpeg', process.cwd());
const ffprobe = await findMediaTool('ffprobe', process.cwd());
const clips = [];

for (const spec of [
  { runId: 'branch-a', file: 'webm-a-route-3-refugees-fork-route-5a.webm',
    sequence: 'Route 3 → Refugees Aider → Route 4 → Fork → Route 5A' },
  { runId: 'branch-b', file: 'webm-b-fork-route-5b-combat-route-6-arrival.webm',
    sequence: 'Fork → Route 5B → branch combat → Route 6 → Arrival → Journey agency' },
]) {
  const recordedRun = gallery.runs.find(item => item.id === spec.runId);
  if (!recordedRun?.complete || !recordedRun.clipStartMs || !recordedRun.clipEndMs)
    throw new Error(`${spec.runId} has no complete capture window.`);
  const input = resolve(output, `raw-${spec.runId}.webm`);
  const target = resolve(output, spec.file);
  // Playwright begins recording before makePage finishes navigation; leave the short
  // lead-in and tail so the first and last requested moments remain inspectable.
  const startSeconds = Math.max(0, recordedRun.clipStartMs / 1000 - 2);
  const durationSeconds = (recordedRun.clipEndMs - recordedRun.clipStartMs) / 1000 + 10;
  await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
    '-i', input, '-ss', String(startSeconds),
    ...(spec.runId === 'branch-a' ? ['-t', String(durationSeconds)] : []),
    '-an', '-c:v', 'libvpx-vp9', '-deadline', 'realtime', '-cpu-used', '6',
    '-b:v', '0', '-crf', '32', '-row-mt', '1', target], { maxBuffer: 1024 * 1024 });
  const { stdout } = await run(ffprobe, ['-v', 'error', '-show_entries',
    'format=duration:stream=codec_name,width,height', '-of', 'json', target]);
  const probe = JSON.parse(stdout);
  const duration = Number(probe.format?.duration);
  if (!Number.isFinite(duration) || duration < 30 || !probe.streams?.some(stream =>
    stream.codec_name === 'vp9' && stream.width === 960 && stream.height === 540))
    throw new Error(`${spec.file} has invalid video metadata.`);
  clips.push({ file: spec.file, run: spec.runId, sequence: spec.sequence,
    sourceStartSeconds: startSeconds, requestedDurationSeconds: durationSeconds,
    durationSeconds: duration, codec: 'vp9', width: 960, height: 540 });
  await unlink(input);
  console.log(`${spec.file}: ${duration.toFixed(1)}s`);
}

await writeFile(resolve(output, 'video-qa.json'), `${JSON.stringify({ clips }, null, 2)}\n`);

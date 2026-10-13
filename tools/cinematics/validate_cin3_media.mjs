#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCin3Pilot } from './cin3_config.mjs';
import { findMediaTool } from './ffmpeg_tools.mjs';

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || !value || value.startsWith('--')) throw new Error(`Expected --name value; received '${key ?? ''}'.`);
    options[key.slice(2)] = value;
    index += 1;
  }
  return options;
}

async function findProjectRoot(start) {
  let current = resolve(start);
  for (;;) {
    try {
      await access(resolve(current, 'package.json'));
      return current;
    } catch {
      const parent = resolve(current, '..');
      if (parent === current) throw new Error('Could not locate the RPGThreeJS repository root.');
      current = parent;
    }
  }
}

async function capture(command, args) {
  return new Promise((resolveCapture, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.once('error', reject);
    child.once('exit', (code) => code === 0
      ? resolveCapture(Buffer.concat(stdout).toString('utf8'))
      : reject(new Error(`ffprobe exited with code ${code}: ${Buffer.concat(stderr).toString('utf8').slice(0, 1_000)}`)));
  });
}

async function sha256(path) {
  const hash = createHash('sha256');
  await new Promise((resolveHash, reject) => {
    const stream = createReadStream(path);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.once('end', resolveHash);
    stream.once('error', reject);
  });
  return hash.digest('hex');
}

function numericDuration(probe) {
  const value = Number(probe.format?.duration ?? probe.streams?.find((stream) => stream.codec_type === 'video')?.duration);
  return Number.isFinite(value) ? value : null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = await findProjectRoot(dirname(fileURLToPath(import.meta.url)));
  const id = args.id;
  getCin3Pilot(id);
  const input = resolve(projectRoot, args.input ?? '');
  await access(input);
  const kind = args.kind ?? 'candidate';
  if (!['candidate', 'final'].includes(kind)) throw new Error('--kind must be candidate or final.');
  if (kind === 'final' && input !== resolve(projectRoot, 'public', 'assets', 'cinematics', `${id}.mp4`)) {
    throw new Error('--kind final must point to the authorized production media path.');
  }

  const ffprobe = await findMediaTool('ffprobe', projectRoot, args.ffprobe);
  const probe = JSON.parse(await capture(ffprobe, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', input]));
  const video = probe.streams?.find((stream) => stream.codec_type === 'video');
  const audio = probe.streams?.find((stream) => stream.codec_type === 'audio');
  if (!video) throw new Error('No video stream found.');
  const rotation = Number(video.tags?.rotate ?? video.side_data_list?.find((entry) => entry.rotation !== undefined)?.rotation ?? 0);
  const fileStat = await stat(input);
  const report = {
    id,
    path: input,
    bytes: fileStat.size,
    sha256: await sha256(input),
    container: probe.format?.format_name ?? null,
    codec: video.codec_name ?? null,
    profile: video.profile ?? null,
    pixelFormat: video.pix_fmt ?? null,
    width: video.width ?? null,
    height: video.height ?? null,
    sampleAspectRatio: video.sample_aspect_ratio ?? null,
    displayAspectRatio: video.display_aspect_ratio ?? null,
    averageFrameRate: video.avg_frame_rate ?? null,
    durationSeconds: numericDuration(probe),
    audioStream: Boolean(audio),
    audioCodec: audio?.codec_name ?? null,
    rotation,
  };

  const errors = [];
  if (!String(report.container).includes('mp4')) errors.push('container must include mp4');
  if (!report.durationSeconds || report.durationSeconds <= 0) errors.push('duration must be positive');
  if (rotation !== 0) errors.push('rotation metadata must be zero');
  if (kind === 'final') {
    if (report.codec !== 'h264') errors.push('codec must be h264');
    if (report.pixelFormat !== 'yuv420p') errors.push('pixel format must be yuv420p');
    if (report.width !== 1920 || report.height !== 1080) errors.push('dimensions must be 1920x1080');
    if (report.displayAspectRatio !== '16:9') errors.push('display aspect ratio must be 16:9');
    if (report.audioStream) errors.push('final CIN-3 media must be silent');
  }
  console.log(JSON.stringify({ ...report, validation: errors.length ? 'FAIL' : 'PASS', errors }, null, 2));
  if (errors.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
});

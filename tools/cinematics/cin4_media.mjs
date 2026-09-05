import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateShotSpec } from './cin4_shot_spec.mjs';
import { findMediaTool } from './ffmpeg_tools.mjs';

export function parseArgs(argv) {
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

export async function findProjectRoot(start = dirname(fileURLToPath(import.meta.url))) {
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

export function assertWithin(base, target, label) {
  const rel = relative(base, target);
  if (rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))) return;
  throw new Error(`${label} must remain inside ${base}.`);
}

export async function sha256(path) {
  const hash = createHash('sha256');
  await new Promise((resolveHash, reject) => {
    const stream = createReadStream(path);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.once('end', resolveHash);
    stream.once('error', reject);
  });
  return hash.digest('hex');
}

export async function capture(command, args, options = {}) {
  return new Promise((resolveCapture, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.once('error', reject);
    child.once('exit', (code) => {
      const out = Buffer.concat(stdout);
      const err = Buffer.concat(stderr).toString('utf8');
      if (code === 0) resolveCapture(options.binary ? out : out.toString('utf8'));
      else reject(new Error(`${command} exited with code ${code}: ${err.slice(0, 2_000)}`));
    });
  });
}

export async function run(command, args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', windowsHide: true });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolveRun() : reject(new Error(`${command} exited with code ${code}.`)));
  });
}

export async function loadSpecShot(projectRoot, specArgument, shotId, requireSources = false) {
  if (!specArgument) throw new Error('--spec is required.');
  const specPath = resolve(projectRoot, specArgument);
  const spec = JSON.parse(await readFile(specPath, 'utf8'));
  const validation = await validateShotSpec(spec, { projectRoot, requireSources });
  if (!validation.valid) throw new Error(`CIN-4 shot spec is invalid: ${validation.errors.join(' ')}`);
  const shot = shotId ? spec.shots.find((entry) => entry.shotId === shotId) : null;
  if (shotId && !shot) throw new Error(`Unknown shot '${shotId}'.`);
  return { spec, shot, specPath, warnings: validation.warnings };
}

export function sequenceRoot(projectRoot, spec) {
  return resolve(projectRoot, 'tmp', 'cinematics', 'cin4', spec.sequenceId);
}

export function shotRoot(projectRoot, spec, shot) {
  return resolve(sequenceRoot(projectRoot, spec), shot.shotId);
}

export async function probeMedia(input, projectRoot, explicitFfprobe) {
  const ffprobe = await findMediaTool('ffprobe', projectRoot, explicitFfprobe);
  const probe = JSON.parse(await capture(ffprobe, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', input]));
  const video = probe.streams?.find((stream) => stream.codec_type === 'video');
  const audio = probe.streams?.find((stream) => stream.codec_type === 'audio');
  if (!video) throw new Error('No video stream found.');
  const duration = Number(probe.format?.duration ?? video.duration);
  const rotation = Number(video.tags?.rotate ?? video.side_data_list?.find((entry) => entry.rotation !== undefined)?.rotation ?? 0);
  return {
    container: probe.format?.format_name ?? null,
    codec: video.codec_name ?? null,
    profile: video.profile ?? null,
    pixelFormat: video.pix_fmt ?? null,
    width: video.width ?? null,
    height: video.height ?? null,
    sampleAspectRatio: video.sample_aspect_ratio ?? null,
    displayAspectRatio: video.display_aspect_ratio ?? null,
    averageFrameRate: video.avg_frame_rate ?? null,
    durationSeconds: Number.isFinite(duration) ? duration : null,
    audioStream: Boolean(audio),
    rotation,
  };
}

export function analyzeRgb(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 3 || buffer.length % 3 !== 0) throw new Error('RGB frame buffer is invalid.');
  let sum = 0;
  let sumSquares = 0;
  let minimum = 255;
  let maximum = 0;
  let darkChannels = 0;
  for (const value of buffer) {
    sum += value;
    sumSquares += value * value;
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
    if (value <= 5) darkChannels += 1;
  }
  const mean = sum / buffer.length;
  const standardDeviation = Math.sqrt(Math.max(0, sumSquares / buffer.length - mean * mean));
  const darkFraction = darkChannels / buffer.length;
  return {
    mean: Number(mean.toFixed(3)),
    standardDeviation: Number(standardDeviation.toFixed(3)),
    minimum,
    maximum,
    darkFraction: Number(darkFraction.toFixed(6)),
    nonblack: mean > 5 && darkFraction < 0.99,
    nonblank: maximum - minimum > 8 && standardDeviation > 2,
  };
}

export function compareRgb(left, right) {
  if (!Buffer.isBuffer(left) || !Buffer.isBuffer(right) || left.length !== right.length || left.length === 0) throw new Error('RGB frames must have matching nonzero lengths.');
  let absoluteDifference = 0;
  let changedChannels = 0;
  for (let index = 0; index < left.length; index += 1) {
    const difference = Math.abs(left[index] - right[index]);
    absoluteDifference += difference;
    if (difference > 8) changedChannels += 1;
  }
  return {
    meanAbsoluteDifference: Number((absoluteDifference / left.length).toFixed(4)),
    changedChannelFraction: Number((changedChannels / left.length).toFixed(6)),
  };
}

export function validateLastFrameEvidence(metadata) {
  const errors = [];
  if (!Number.isInteger(metadata?.exactFrameIndex) || metadata.exactFrameIndex < 0) errors.push('exactFrameIndex must be nonnegative');
  if (!Number.isInteger(metadata?.decodedFrameCount) || metadata.decodedFrameCount !== metadata.exactFrameIndex + 1) errors.push('exact frame must be the final decoded frame');
  if (metadata?.width !== 1920 || metadata?.height !== 1080) errors.push('last frame must be 1920x1080');
  if (!/^[a-f0-9]{64}$/u.test(metadata?.outputSha256 ?? '')) errors.push('outputSha256 must be a SHA-256 hash');
  if (!/^[a-f0-9]{64}$/u.test(metadata?.sourceVideoSha256 ?? '')) errors.push('sourceVideoSha256 must be a SHA-256 hash');
  if (metadata?.statistics?.nonblack !== true) errors.push('last frame must be nonblack');
  if (metadata?.statistics?.nonblank !== true) errors.push('last frame must be nonblank');
  return errors;
}

export function validateChainProof(shot, chainMetadata, actualSourceSha256) {
  const errors = [];
  if (shot?.source?.type !== 'CHAIN_SOURCE') errors.push('shot must use CHAIN_SOURCE');
  if (chainMetadata?.shotId !== shot?.source?.fromShotId) errors.push('chain predecessor shot ID must match');
  if (chainMetadata?.outputSha256 !== actualSourceSha256) errors.push('chain source SHA must match extracted-frame metadata');
  errors.push(...validateLastFrameEvidence(chainMetadata));
  return errors;
}

export function validateAssemblyEvidence(spec, metadata) {
  const expectedOrder = spec.shots.map((shot) => shot.shotId);
  const expectedDuration = spec.shots.reduce((sum, shot) => sum + shot.durationSeconds, 0);
  const errors = [];
  if (JSON.stringify(metadata?.editorialOrder) !== JSON.stringify(expectedOrder)) errors.push('editorialOrder must match spec shot order');
  if (metadata?.expectedDurationSeconds !== expectedDuration) errors.push('expectedDurationSeconds must equal spec duration');
  if (JSON.stringify(metadata?.shots?.map((shot) => shot.shotId)) !== JSON.stringify(expectedOrder)) errors.push('master evidence order must match spec shot order');
  if (!/^[a-f0-9]{64}$/u.test(metadata?.outputSha256 ?? '')) errors.push('assembly outputSha256 must be a SHA-256 hash');
  return errors;
}

export async function readFrameRgb(input, projectRoot, options = {}) {
  const ffmpeg = await findMediaTool('ffmpeg', projectRoot, options.ffmpeg);
  const args = ['-hide_banner', '-loglevel', 'error', '-nostdin'];
  if (Number.isFinite(options.timestamp)) args.push('-ss', Number(options.timestamp).toFixed(6));
  args.push('-i', input, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1');
  return capture(ffmpeg, args, { binary: true });
}

export async function sampleFrameStats(input, projectRoot, options = {}) {
  return analyzeRgb(await readFrameRgb(input, projectRoot, options));
}

export function technicalErrors(report, expectedDuration, strict = true) {
  const errors = [];
  if (!String(report.container).includes('mp4')) errors.push('container must include mp4');
  if (!report.durationSeconds || report.durationSeconds <= 0) errors.push('duration must be positive');
  if (expectedDuration && Math.abs(report.durationSeconds - expectedDuration) > 0.09) errors.push(`duration must be ${expectedDuration}s (+/-0.09s)`);
  if (report.rotation !== 0) errors.push('rotation metadata must be zero');
  if (strict) {
    if (report.width !== 1920 || report.height !== 1080) errors.push('dimensions must be 1920x1080');
    if (report.codec !== 'h264') errors.push('codec must be h264');
    if (report.pixelFormat !== 'yuv420p') errors.push('pixel format must be yuv420p');
    if (report.averageFrameRate !== '24/1') errors.push('average frame rate must be 24/1');
    if (report.audioStream) errors.push('media must be silent');
  }
  return errors;
}

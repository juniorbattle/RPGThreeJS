#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { findMediaTool } from './ffmpeg_tools.mjs';

const GOLD_IDS = Object.freeze([
  'alaric_audience_arrival',
  'camp_departure',
  'valmir_route_fork',
]);

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) throw new Error(`Unexpected argument '${token}'.`);
    if (token === '--gold') {
      args.gold = true;
      continue;
    }
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Expected a value after '${token}'.`);
    args[token.slice(2)] = value;
    index += 1;
  }
  return args;
}

function assertWithin(base, target, label) {
  const rel = relative(base, target);
  if (rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))) return;
  throw new Error(`${label} must remain inside ${base}.`);
}

function run(command, args, { captureBinary = false } = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.once('error', reject);
    child.once('exit', (code) => {
      const out = Buffer.concat(stdout);
      const err = Buffer.concat(stderr).toString('utf8');
      if (code !== 0) {
        reject(new Error(`${command} exited with code ${code}: ${err.slice(0, 2_000)}`));
        return;
      }
      resolveRun({ stdout: captureBinary ? out : out.toString('utf8'), stderr: err });
    });
  });
}

async function sha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

async function extractFrame(ffmpeg, input, timestamp, output, scale = '1920:1080') {
  await run(ffmpeg, [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
    '-ss', timestamp.toFixed(6), '-i', input,
    '-frames:v', '1', '-vf', `scale=${scale}:flags=lanczos`, output,
  ]);
}

async function analyzeOne({ id, input, outputRoot, ffmpeg, ffprobe }) {
  const outputDir = resolve(outputRoot, id);
  assertWithin(outputRoot, outputDir, 'analysis output');
  await mkdir(resolve(outputDir, 'frames'), { recursive: true });
  await mkdir(resolve(outputDir, 'strip'), { recursive: true });

  const probeResult = await run(ffprobe, [
    '-v', 'error', '-show_streams', '-show_format', '-count_frames', '-of', 'json', input,
  ]);
  const probe = JSON.parse(probeResult.stdout);
  const video = probe.streams.find((stream) => stream.codec_type === 'video');
  const audio = probe.streams.find((stream) => stream.codec_type === 'audio');
  const duration = Number(probe.format?.duration ?? video?.duration);
  const [fpsNum, fpsDen] = String(video?.avg_frame_rate ?? '0/1').split('/').map(Number);
  const fps = fpsDen ? fpsNum / fpsDen : 0;
  if (!video || !Number.isFinite(duration) || duration <= 0 || !Number.isFinite(fps) || fps <= 0) {
    throw new Error(`${id}: invalid video metadata.`);
  }

  const strongestFractions = {
    alaric_audience_arrival: 0.58,
    camp_departure: 0.42,
    valmir_route_fork: 0.62,
  };
  const frameDuration = 1 / fps;
  const selected = [
    ['opening', 0],
    ['early', duration * 0.16],
    ['middle', duration * 0.5],
    ['integration', duration * (strongestFractions[id] ?? 0.6)],
    ['late', duration * 0.84],
    // Seeking exactly one nominal frame before the container duration can land
    // beyond the final decoded frame on variable or rounded timestamps. This is
    // the late review sample; exact last-frame evidence is extracted separately
    // by decoded frame index with extract_last_frame.mjs.
    ['final', Math.max(0, duration - Math.max(frameDuration * 2, 0.08))],
  ];
  const selectedFrames = [];
  for (const [label, timestamp] of selected) {
    const output = resolve(outputDir, 'frames', `${label}.png`);
    await extractFrame(ffmpeg, input, timestamp, output);
    selectedFrames.push({
      label,
      timestampSeconds: Number(timestamp.toFixed(6)),
      path: relative(process.cwd(), output).replaceAll('\\', '/'),
      sha256: await sha256(output),
    });
  }

  const stripFrames = [];
  for (let index = 0; index < 12; index += 1) {
    const timestamp = Math.min(duration - frameDuration, duration * ((index + 0.5) / 12));
    const output = resolve(outputDir, 'strip', `${String(index + 1).padStart(2, '0')}.png`);
    await extractFrame(ffmpeg, input, timestamp, output, '640:360');
    stripFrames.push({
      label: `t${String(index + 1).padStart(2, '0')}`,
      timestampSeconds: Number(timestamp.toFixed(6)),
      path: relative(process.cwd(), output).replaceAll('\\', '/'),
      sha256: await sha256(output),
    });
  }

  const sceneResult = await run(ffmpeg, [
    '-hide_banner', '-nostdin', '-i', input,
    '-filter:v', "select='gt(scene,0.35)',showinfo", '-an', '-f', 'null', '-',
  ]);
  const sceneCandidates = [...sceneResult.stderr.matchAll(/pts_time:([0-9]+(?:\.[0-9]+)?)/gu)]
    .map((match) => Number(match[1]))
    .filter((value, index, values) => Number.isFinite(value) && (index === 0 || Math.abs(value - values[index - 1]) > frameDuration));

  const result = {
    schemaVersion: 1,
    id,
    source: relative(process.cwd(), input).replaceAll('\\', '/'),
    sourceSha256: await sha256(input),
    probe: {
      codec: video.codec_name,
      profile: video.profile,
      pixelFormat: video.pix_fmt,
      width: video.width,
      height: video.height,
      fps: Number(fps.toFixed(6)),
      durationSeconds: Number(duration.toFixed(6)),
      frameCount: Number(video.nb_read_frames ?? video.nb_frames ?? 0),
      audioStreams: audio ? 1 : 0,
    },
    selectedFrames,
    stripFrames,
    automatedContinuity: {
      method: 'ffmpeg scene score threshold 0.35; candidates require human classification',
      threshold: 0.35,
      detectedCutCandidates: sceneCandidates,
      internalCutCount: 'HUMAN_REVIEW_REQUIRED',
    },
  };
  await writeFile(resolve(outputDir, 'analysis.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = process.cwd();
  const outputRoot = resolve(projectRoot, args.output ?? 'tmp/cinematics/cin6ea/gold');
  const allowedOutputRoot = resolve(projectRoot, 'tmp', 'cinematics', 'cin6ea');
  assertWithin(allowedOutputRoot, outputRoot, '--output');
  await mkdir(outputRoot, { recursive: true });
  const ffmpeg = await findMediaTool('ffmpeg', projectRoot, args.ffmpeg);
  const ffprobe = await findMediaTool('ffprobe', projectRoot, args.ffprobe);

  let inputs;
  if (args.gold) {
    const manifest = JSON.parse(await readFile(resolve(projectRoot, 'public/assets/cinematics/manifest.json'), 'utf8'));
    inputs = GOLD_IDS.map((id) => {
      const entry = manifest.cinematics.find((candidate) => candidate.id === id);
      if (!entry?.sources?.[0]?.src) throw new Error(`${id}: production manifest source missing.`);
      return { id, input: resolve(projectRoot, `public${entry.sources[0].src}`) };
    });
  } else {
    if (!args.id || !args.input) throw new Error('Use --gold or provide --id and --input.');
    inputs = [{ id: args.id, input: resolve(projectRoot, args.input) }];
  }

  const results = [];
  for (const input of inputs) {
    await access(input.input);
    results.push(await analyzeOne({ ...input, outputRoot, ffmpeg, ffprobe }));
  }
  const summary = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    analyses: results.map((entry) => ({
      id: entry.id,
      source: entry.source,
      sourceSha256: entry.sourceSha256,
      probe: entry.probe,
      analysis: `${relative(projectRoot, resolve(outputRoot, entry.id, 'analysis.json')).replaceAll('\\', '/')}`,
    })),
  };
  await writeFile(resolve(outputRoot, 'gold_analysis_index.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
});

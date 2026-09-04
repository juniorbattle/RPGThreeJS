#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { access, mkdir } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
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

function assertWithin(base, target, label) {
  const rel = relative(base, target);
  if (rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))) return;
  throw new Error(`${label} must remain inside ${base}.`);
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
      : reject(new Error(`${command} exited with code ${code}: ${Buffer.concat(stderr).toString('utf8').slice(0, 1_000)}`)));
  });
}

async function run(command, args) {
  await new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { stdio: 'ignore', windowsHide: true });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolveRun() : reject(new Error(`${command} exited with code ${code}.`)));
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = await findProjectRoot(dirname(fileURLToPath(import.meta.url)));
  const id = args.id;
  getCin3Pilot(id);
  const input = resolve(projectRoot, args.input ?? '');
  await access(input);
  const candidateRoot = resolve(projectRoot, 'tmp', 'cinematics', 'cin3', id);
  assertWithin(candidateRoot, input, '--input');
  const outputDir = resolve(projectRoot, args.output ?? resolve(dirname(input), 'review_frames'));
  assertWithin(candidateRoot, outputDir, '--output');
  await mkdir(outputDir, { recursive: true });

  const ffmpeg = await findMediaTool('ffmpeg', projectRoot, args.ffmpeg);
  const ffprobe = await findMediaTool('ffprobe', projectRoot, args.ffprobe);
  const duration = Number((await capture(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', input])).trim());
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Could not determine candidate duration.');
  const frames = [
    ['first', Math.min(0.04, duration / 2)],
    ['p25', duration * 0.25],
    ['p50', duration * 0.5],
    ['p75', duration * 0.75],
    ['last', Math.max(0, duration - 0.05)],
  ];
  for (const [label, timestamp] of frames) {
    const output = resolve(outputDir, `${label}.png`);
    try {
      await access(output);
      throw new Error(`Refusing to overwrite review frame: ${output}`);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
    await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-ss', timestamp.toFixed(3), '-i', input, '-frames:v', '1', '-vf', 'scale=960:-2:flags=lanczos', output]);
  }
  console.log(`Extracted first/25/50/75/last frames to ${relative(projectRoot, outputDir).replaceAll('\\', '/')} (ignored).`);
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
});

#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { access, mkdir, rename, rm } from 'node:fs/promises';
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

async function run(command, args) {
  await new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', windowsHide: true });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolveRun() : reject(new Error(`${command} exited with code ${code}.`)));
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = await findProjectRoot(dirname(fileURLToPath(import.meta.url)));
  const id = args.id;
  getCin3Pilot(id);
  const candidateRoot = resolve(projectRoot, 'tmp', 'cinematics', 'cin3', id);
  const input = resolve(projectRoot, args.input ?? '');
  assertWithin(candidateRoot, input, '--input');
  await access(input);

  const finalPath = resolve(projectRoot, 'public', 'assets', 'cinematics', `${id}.mp4`);
  const output = resolve(projectRoot, args.output ?? finalPath);
  if (output !== finalPath) throw new Error(`--output must be the authorized production path ${finalPath}.`);
  try {
    await access(output);
    throw new Error(`Refusing to overwrite existing production media: ${output}`);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  const hold = Number(args['append-hold'] ?? 0);
  if (!Number.isFinite(hold) || hold < 0 || hold > 0.6) throw new Error('--append-hold must be between 0 and 0.6 seconds.');
  const ffmpeg = await findMediaTool('ffmpeg', projectRoot, args.ffmpeg);
  await mkdir(dirname(output), { recursive: true });
  const partial = `${output}.part.mp4`;
  const filters = [
    'scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos',
    'pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black',
    'setsar=1',
    'fps=24',
  ];
  if (hold > 0) filters.push(`tpad=stop_mode=clone:stop_duration=${hold}`);

  try {
    await run(ffmpeg, [
      '-hide_banner', '-nostdin', '-i', input,
      '-map', '0:v:0', '-an', '-map_metadata', '-1',
      '-vf', filters.join(','),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
      '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-g', '48',
      '-movflags', '+faststart',
      partial,
    ]);
    await rename(partial, output);
  } catch (error) {
    await rm(partial, { force: true });
    throw error;
  }
  console.log(`Mastered ${relative(projectRoot, output).replaceAll('\\', '/')} with silent H.264/yuv420p 1920x1080 at 24 fps.`);
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
});

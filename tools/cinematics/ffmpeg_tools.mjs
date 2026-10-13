import { access } from 'node:fs/promises';
import { delimiter, join, resolve } from 'node:path';

async function isExecutable(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function findMediaTool(name, projectRoot, explicitPath) {
  const executable = process.platform === 'win32' ? `${name}.exe` : name;
  const candidates = [
    explicitPath,
    process.env[name === 'ffmpeg' ? 'FFMPEG_PATH' : 'FFPROBE_PATH'],
    ...String(process.env.PATH ?? '').split(delimiter).filter(Boolean).map((entry) => join(entry, executable)),
    join(projectRoot, 'tmp', 'cinematics', 'toolchain', 'node_modules', 'ffmpeg-static', executable),
    join(projectRoot, 'tmp', 'cinematics', 'toolchain', 'node_modules', 'ffprobe-static', 'bin', process.platform, process.arch === 'x64' ? 'x64' : process.arch, executable),
  ].filter(Boolean).map((entry) => resolve(entry));

  for (const candidate of candidates) {
    if (await isExecutable(candidate)) return candidate;
  }
  throw new Error(`${name} was not found. Put it on PATH, set ${name === 'ffmpeg' ? 'FFMPEG_PATH' : 'FFPROBE_PATH'}, or install the ignored CIN-3 toolchain under tmp/cinematics/toolchain.`);
}

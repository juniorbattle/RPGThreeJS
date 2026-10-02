#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { assertWithin, capture, loadSpecShot, parseArgs, probeMedia, sha256, shotRoot } from './cin4_media.mjs';
import { findMediaTool } from './ffmpeg_tools.mjs';

const args = parseArgs(process.argv.slice(2));
const root = process.cwd();
const { spec, shot } = await loadSpecShot(root, args.spec, args.shot);
const input = resolve(args.input);
assertWithin(shotRoot(root, spec, shot), input, '--input');
const output = resolve(args.output);
assertWithin(resolve('tmp/cinematics/eight-slot-remaster'), output, '--output');
// Never overwrite an earlier reviewed frame set.
await mkdir(output, { recursive: false });
const ffmpeg = await findMediaTool('ffmpeg', root);
const media = await probeMedia(input, root);
const duration = Math.min(shot.durationSeconds, media.durationSeconds);
const frames = [];
for (const [label, seconds] of [['first', 0], ['initiation', duration / 8], ['stride', duration / 4], ['middle', duration / 2], ['progression', duration * 3 / 4], ['final', Math.max(0, duration - 0.1)]]) {
  const path = resolve(output, `${label}.png`);
  await capture(ffmpeg, ['-v', 'error', '-ss', String(seconds), '-i', input, '-frames:v', '1', path]);
  frames.push({ label, seconds, path: relative(root, path).replaceAll('\\', '/'), sha256: await sha256(path) });
}
const samples = Math.ceil(duration);
const rows = Math.ceil(samples / 3);
await capture(ffmpeg, ['-v', 'error', '-i', input, '-t', String(duration), '-vf', `fps=1,scale=640:360,tile=3x${rows}`, '-frames:v', '1', resolve(output, 'contact-sheet.png')]);
const rgbPath = resolve(output, 'motion.rgb');
await capture(ffmpeg, ['-v', 'error', '-i', input, '-t', String(duration), '-vf', 'fps=2,scale=320:180', '-pix_fmt', 'rgb24', '-f', 'rawvideo', rgbPath]);
const rgb = await readFile(rgbPath), size = 320 * 180 * 3, motion = [];
const regions = { world: { x: 0, y: 0, w: 320, h: 60 }, actors: { x: 64, y: 55, w: 150, h: 88 } };
for (let n = 1; n < Math.floor(rgb.length / size); n++) {
  const entry = { seconds: n / 2 };
  for (const [label, r] of Object.entries(regions)) {
    let sum = 0, count = 0;
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) for (let c = 0; c < 3; c++) {
      const i = (y * 320 + x) * 3 + c;
      sum += Math.abs(rgb[n * size + i] - rgb[(n - 1) * size + i]); count++;
    }
    entry[`${label}MeanAbsoluteDelta`] = Number((sum / count).toFixed(3));
  }
  motion.push(entry);
}
const result = {
  recordedAt: new Date().toISOString(), slot: spec.cinematicId, shot: shot.shotId,
  input: relative(root, input).replaceAll('\\', '/'), sha256: await sha256(input), media,
  authoredBlockDurationSeconds: shot.durationSeconds, durationDeltaSeconds: media.durationSeconds - shot.durationSeconds,
  frames, motion, contactSheetPaddingTiles: rows * 3 - samples,
  scope: 'DECODED_FRAME_DIFFERENCES_ARE_DIAGNOSTIC_ONLY_CAMERA_MOTION_CAN_CAUSE_THEM;_ARTISTIC_REVIEW_REQUIRED',
};
await writeFile(resolve(output, 'probe-and-motion.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ media, frames: frames.length, motionSamples: motion.length, sha256: result.sha256 }));

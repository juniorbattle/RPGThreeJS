#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { isAbsolute, relative, resolve } from 'node:path';
import { findMediaTool } from './ffmpeg_tools.mjs';

// Existing-media evidence only. Never writes into public/ or alters a source clip.
const root = process.cwd();
const brief = JSON.parse(await readFile(resolve(root, 'tools/cinematics/specs/production_eight_slot_remaster_brief.json'), 'utf8'));
const manifest = JSON.parse(await readFile(resolve(root, brief.productionSource), 'utf8'));
const output = resolve(process.env.CIN8_PROBE_OUTPUT ?? 'tmp/cinematics/eight-slot-remaster/source-probe');
const rel = relative(resolve(root, 'tmp/cinematics/eight-slot-remaster'), output);
if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Output must stay in ignored tmp/cinematics/eight-slot-remaster.');
try { await access(output); throw new Error(`Refusing to overwrite existing evidence: ${output}`); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const sources = manifest.cinematics ?? manifest;
const videos = sources.filter((entry) => entry.sources?.length);
if (videos.length !== 8 || brief.slots.length !== 8 || videos.some((entry) => !brief.slots.some((slot) => slot.id === entry.id))) {
  throw new Error('Production manifest and brief must identify exactly the same eight videos.');
}
const ffprobe = await findMediaTool('ffprobe', root);
const ffmpeg = await findMediaTool('ffmpeg', root);
await mkdir(output, { recursive: true });
function capture(command, args) {
  return new Promise((accept, reject) => {
    const child = spawn(command, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const stdout = [], stderr = [];
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? accept(Buffer.concat(stdout).toString('utf8'))
      : reject(new Error(`${command}: ${Buffer.concat(stderr).toString('utf8').slice(0, 1000)}`)));
  });
}
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const report = { schemaVersion: 1, recordedAt: new Date().toISOString(), purpose: 'READ_ONLY_EXISTING_SOURCE_AUDIT',
  tools: { ffmpeg: relative(root, ffmpeg).replaceAll('\\', '/'), ffprobe: relative(root, ffprobe).replaceAll('\\', '/') }, slots: [] };
for (const slot of brief.slots) {
  const source = resolve(root, `public${slot.currentDescriptor.sources[0].src}`);
  const before = await readFile(source);
  if (hash(before) !== slot.sourceSha256 || before.length !== slot.sourceByteSize) throw new Error(`Source changed since inventory: ${slot.id}`);
  const probe = JSON.parse(await capture(ffprobe, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', source]));
  const stream = probe.streams.find((entry) => entry.codec_type === 'video');
  if (!stream) throw new Error(`No video stream: ${slot.id}`);
  const decoded = JSON.parse(await capture(ffprobe, ['-v', 'error', '-select_streams', 'v:0', '-show_frames',
    '-show_entries', 'frame=best_effort_timestamp_time,width,height', '-of', 'json', source]));
  const frames = decoded.frames.filter((frame) => frame.width && frame.height);
  if (!frames.length) throw new Error(`No decoded frames: ${slot.id}`);
  const frameEvidence = [];
  for (const [label, index] of [['first', 0], ['middle', Math.floor(frames.length / 2)], ['final', frames.length - 1]]) {
    const path = resolve(output, `${slot.id}-${label}.png`);
    await capture(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-i', source,
      '-vf', `select=eq(n\\,${index})`, '-fps_mode', 'vfr', '-frames:v', '1', path]);
    const bytes = await readFile(path);
    frameEvidence.push({ label, decodedFrameIndex: index, timestampSeconds: Number(frames[index].best_effort_timestamp_time),
      path: relative(root, path).replaceAll('\\', '/'), sha256: hash(bytes), width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) });
  }
  if (hash(await readFile(source)) !== slot.sourceSha256) throw new Error(`Source mutated during probe: ${slot.id}`);
  const measuredDurationMs = Math.round(Number(stream.duration ?? probe.format.duration) * 1000);
  report.slots.push({ id: slot.id, source: relative(root, source).replaceAll('\\', '/'), sourceSha256: slot.sourceSha256,
    sourceBytes: before.length, codec: stream.codec_name, pixelFormat: stream.pix_fmt, width: stream.width, height: stream.height,
    frameRate: stream.avg_frame_rate, decodedFrameCount: frames.length, measuredDurationMs,
    descriptorDurationMs: slot.currentDurationMs, durationDeltaMs: measuredDurationMs - slot.currentDurationMs,
    audioStreams: probe.streams.filter((entry) => entry.codec_type === 'audio').map((entry) => ({ codec: entry.codec_name, channels: entry.channels })),
    frameEvidence });
  console.log(`${slot.id}: ${stream.width}x${stream.height}, ${stream.codec_name}, ${measuredDurationMs}ms, ${frames.length} decoded frames; source hash preserved`);
}
await writeFile(resolve(output, 'source-probe.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Eight-slot source audit: ${relative(root, output)} (ignored).`);

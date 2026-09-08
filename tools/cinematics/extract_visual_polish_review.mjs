#!/usr/bin/env node
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, relative, resolve } from 'node:path';
import { findMediaTool } from './ffmpeg_tools.mjs';
import { findProjectRoot, parseArgs, probeMedia, run, sha256 } from './cin4_media.mjs';

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = await findProjectRoot();
  const manifestPath = resolve(projectRoot, 'public/assets/cinematics/manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const outputRoot = resolve(projectRoot, args.output ?? 'tmp/cinematics/cin66/visual-polish-audit');
  const metadataPath = resolve(outputRoot, 'visual-polish-review.metadata.json');
  await mkdir(outputRoot, { recursive: true });
  try {
    await access(metadataPath);
    throw new Error(`Refusing to overwrite existing review metadata: ${metadataPath}`);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  const ffmpeg = await findMediaTool('ffmpeg', projectRoot, args.ffmpeg);
  const productions = manifest.cinematics.filter((entry) => entry.sources?.[0]?.src?.endsWith('.mp4'));
  const entries = [];
  for (const entry of productions) {
    if (!/^[a-z0-9_-]+$/u.test(entry.id)) throw new Error(`Unsafe runtime ID '${entry.id}'.`);
    const sourcePath = resolve(projectRoot, 'public', entry.sources[0].src.replace(/^\//u, ''));
    await access(sourcePath);
    const report = await probeMedia(sourcePath, projectRoot, args.ffprobe);
    const outputDir = resolve(outputRoot, entry.id);
    await mkdir(outputDir, { recursive: true });
    const duration = report.durationSeconds;
    const samples = [
      ['first', 0],
      ['p25', duration * 0.25],
      ['p50', duration * 0.5],
      ['p75', duration * 0.75],
      ['last', Math.max(0, duration - 1 / 24)],
    ];
    const frames = [];
    for (const [label, timestamp] of samples) {
      const outputPath = resolve(outputDir, `${label}.png`);
      try {
        await access(outputPath);
        throw new Error(`Refusing to overwrite existing review frame: ${outputPath}`);
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
      }
      await run(ffmpeg, [
        '-hide_banner', '-loglevel', 'error', '-nostdin',
        '-ss', Number(timestamp).toFixed(6), '-i', sourcePath,
        '-frames:v', '1', '-vf', 'scale=640:360:flags=lanczos', outputPath,
      ]);
      frames.push({
        label,
        timestampSeconds: Number(timestamp.toFixed(6)),
        path: relative(projectRoot, outputPath).replaceAll('\\', '/'),
        sha256: await sha256(outputPath),
      });
    }
    entries.push({
      runtimeId: entry.id,
      sourcePath: relative(projectRoot, sourcePath).replaceAll('\\', '/'),
      sourceFile: basename(sourcePath),
      sourceSha256: await sha256(sourcePath),
      report,
      frames,
    });
    console.log(`Extracted ${entry.id} (${duration.toFixed(3)}s).`);
  }
  const metadata = { schemaVersion: 1, productionMasterCount: entries.length, entries };
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${relative(projectRoot, metadataPath).replaceAll('\\', '/')} for ${entries.length} production masters.`);
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
});

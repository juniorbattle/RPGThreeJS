#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { access, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { CIN3_PILOTS, CIN3_PROMPT_VERSION, getCin3Pilot } from './cin3_config.mjs';

const API_ORIGIN = 'https://api.minimax.io';
const CREATE_ENDPOINT = `${API_ORIGIN}/v2/video_generation`;
const QUERY_ENDPOINT = `${API_ORIGIN}/v2/query/video_generation`;
const MODEL = 'MiniMax-H3';
const POLL_INTERVAL_MS = 10_000;

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key?.startsWith('--')) throw new Error(`Unexpected argument '${key}'.`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${key}.`);
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
      await access(resolve(current, 'public', 'assets', 'cinematics'));
      return current;
    } catch {
      const parent = resolve(current, '..');
      if (parent === current) throw new Error('Could not locate the RPGThreeJS repository root.');
      current = parent;
    }
  }
}

function loadApiKey(contents) {
  for (const rawLine of contents.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = /^(?:export\s+)?MINIMAX_API_KEY\s*=\s*(.*)$/u.exec(line);
    if (!match) continue;
    let value = match[1].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (value) return value;
  }
  throw new Error('MINIMAX_API_KEY is missing or empty in repository-root .env.local.');
}

function assertWithin(base, target, label) {
  const rel = relative(base, target);
  if (rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))) return;
  throw new Error(`${label} must remain inside ${base}.`);
}

function parsePositiveInteger(value, label) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${label} must be a positive integer.`);
  return parsed;
}

function sanitizeError(value, apiKey) {
  return String(value instanceof Error ? value.message : value)
    .replaceAll(apiKey, '[REDACTED]')
    .replace(/Bearer\s+[^\s"']+/giu, 'Bearer [REDACTED]')
    .replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/giu, '[IMAGE_DATA_REDACTED]')
    .slice(0, 2_000);
}

async function fetchJson(url, init, apiKey, timeoutMs = 60_000) {
  const signal = AbortSignal.timeout(timeoutMs);
  const response = await fetch(url, { ...init, signal });
  const body = await response.text();
  let json;
  try {
    json = body ? JSON.parse(body) : {};
  } catch {
    throw new Error(`MiniMax returned non-JSON HTTP ${response.status}.`);
  }
  if (!response.ok) {
    const detail = json?.error?.message ?? json?.message ?? `HTTP ${response.status}`;
    const rateHint = response.status === 429 ? ' Wait for the provider retry window, then rerun the same numbered attempt.' : '';
    throw new Error(`MiniMax request failed: ${detail}.${rateHint}`);
  }
  return json;
}

function safeUsage(task) {
  const usage = task?.usage;
  if (!usage || typeof usage !== 'object') return undefined;
  const safe = {};
  for (const field of ['total_seconds', 'input_seconds', 'output_seconds', 'input_image_count', 'input_audio_seconds', 'total_tokens', 'prompt_tokens', 'completion_tokens']) {
    if (typeof usage[field] === 'number') safe[field] = usage[field];
  }
  return Object.keys(safe).length ? safe : undefined;
}

async function sleep(ms) {
  await new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

async function writeMetadata(path, metadata) {
  await writeFile(path, `${JSON.stringify(metadata, null, 2)}\n`, { encoding: 'utf8' });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = await findProjectRoot(dirname(fileURLToPath(import.meta.url)));
  const id = args.id;
  const pilot = getCin3Pilot(id);
  const duration = parsePositiveInteger(args.duration ?? '8', '--duration');
  if (duration < 4 || duration > 15) throw new Error('--duration must be between 4 and 15 seconds for MiniMax-H3.');
  const resolution = args.resolution ?? '2K';
  if (!['768P', '2K'].includes(resolution)) throw new Error('--resolution must be 768P or 2K.');
  const attempt = parsePositiveInteger(args.attempt, '--attempt');
  if (attempt > 3) throw new Error('CIN-3 allows at most three autonomous attempts per cinematic. Report the first three defects before a fourth attempt.');

  const expectedSource = resolve(projectRoot, pilot.source);
  const source = resolve(projectRoot, args.source ?? pilot.source);
  if (source !== expectedSource) throw new Error(`--source for ${id} must be the canonical CIN-3 source ${pilot.source}.`);
  const sourceBytes = await readFile(source);
  if (sourceBytes.length > 30 * 1024 * 1024) throw new Error('Source image exceeds the MiniMax-H3 30 MB image limit.');
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!sourceBytes.subarray(0, 8).equals(pngSignature)) throw new Error('CIN-3 source must be a valid PNG.');
  const width = sourceBytes.readUInt32BE(16);
  const height = sourceBytes.readUInt32BE(20);
  if (width !== 1920 || height !== 1080) throw new Error(`CIN-3 source must be 1920x1080; received ${width}x${height}.`);

  const candidateRoot = resolve(projectRoot, 'tmp', 'cinematics', 'cin3', id);
  const defaultName = `candidate_${String(attempt).padStart(2, '0')}_raw.mp4`;
  const output = resolve(projectRoot, args.output ?? resolve(candidateRoot, defaultName));
  assertWithin(candidateRoot, output, '--output');
  const metadataPath = output.replace(/\.mp4$/iu, '.metadata.json');
  if (metadataPath === output) throw new Error('--output must end in .mp4.');
  for (const path of [output, metadataPath, `${output}.part`]) {
    try {
      await access(path);
      throw new Error(`Refusing to overwrite existing candidate artifact: ${path}`);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  await mkdir(candidateRoot, { recursive: true });
  await mkdir(dirname(output), { recursive: true });

  const apiKey = loadApiKey(await readFile(resolve(projectRoot, '.env.local'), 'utf8'));
  const sourceSha256 = createHash('sha256').update(sourceBytes).digest('hex');
  const promptSha256 = createHash('sha256').update(pilot.prompt, 'utf8').digest('hex');
  const startedAt = new Date().toISOString();
  const metadata = {
    cinematicId: id,
    sourcePath: relative(projectRoot, source).replaceAll('\\', '/'),
    sourceSha256,
    canonicalCharacterSources: pilot.characters,
    environmentSource: pilot.environment,
    provider: 'MiniMax Open Platform Direct API',
    apiEndpoint: '/v2/video_generation',
    model: MODEL,
    generationMode: 'image-to-video / first-frame',
    sourceTransport: 'data:image/png;base64',
    resolution,
    duration,
    attempt,
    promptVersion: CIN3_PROMPT_VERSION,
    promptSha256,
    outputCandidatePath: relative(projectRoot, output).replaceAll('\\', '/'),
    startedAt,
    status: 'submitting',
  };
  await writeMetadata(metadataPath, metadata);

  try {
    console.log(`Submitting ${id} attempt ${attempt} to ${MODEL} (${resolution}, ${duration}s).`);
    const created = await fetchJson(CREATE_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        content: [
          { type: 'text', text: pilot.prompt },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${sourceBytes.toString('base64')}` }, role: 'first_frame' },
        ],
        resolution,
        duration,
        ratio: 'adaptive',
      }),
    }, apiKey);
    const taskId = String(created.task_id ?? '');
    if (!taskId) throw new Error('MiniMax create response did not include task_id.');
    metadata.taskId = taskId;
    metadata.status = 'queued';
    await writeMetadata(metadataPath, metadata);
    console.log(`Task accepted (${taskId}). Polling every ${POLL_INTERVAL_MS / 1_000}s.`);

    const timeoutMinutes = Number(args['timeout-minutes'] ?? 45);
    if (!Number.isFinite(timeoutMinutes) || timeoutMinutes <= 0 || timeoutMinutes > 120) throw new Error('--timeout-minutes must be greater than 0 and no more than 120.');
    const deadline = Date.now() + timeoutMinutes * 60_000;
    let completedTask;
    let lastStatus = '';
    while (Date.now() < deadline) {
      await sleep(POLL_INTERVAL_MS);
      try {
        const queried = await fetchJson(`${QUERY_ENDPOINT}/${encodeURIComponent(taskId)}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        }, apiKey);
        const task = queried.task;
        const status = String(task?.status ?? '').toLowerCase();
        if (!status) throw new Error('MiniMax query response did not include task.status.');
        if (status !== lastStatus) {
          console.log(`Task status: ${status}.`);
          lastStatus = status;
          metadata.status = status;
          metadata.usage = safeUsage(task);
          await writeMetadata(metadataPath, metadata);
        }
        if (status === 'succeeded') {
          completedTask = task;
          break;
        }
        if (status === 'failed' || status === 'cancelled') {
          throw new Error(`MiniMax task ended with status '${status}'.`);
        }
      } catch (error) {
        if (/rate limit/iu.test(String(error))) {
          console.log('Query rate limited; retaining the task and waiting for the next polling interval.');
          continue;
        }
        throw error;
      }
    }
    if (!completedTask) throw new Error(`MiniMax task timed out after ${timeoutMinutes} minutes.`);
    const downloadUrl = completedTask?.content?.url;
    if (typeof downloadUrl !== 'string' || !downloadUrl.startsWith('https://')) {
      throw new Error('Succeeded MiniMax task did not include a valid HTTPS output URL.');
    }

    console.log('Downloading generated candidate to ignored local storage.');
    const response = await fetch(downloadUrl, { signal: AbortSignal.timeout(10 * 60_000) });
    if (!response.ok || !response.body) throw new Error(`Candidate download failed with HTTP ${response.status}.`);
    await pipeline(Readable.fromWeb(response.body), createWriteStream(`${output}.part`, { flags: 'wx' }));
    await rename(`${output}.part`, output);
    const outputStat = await stat(output);
    const outputSha256 = createHash('sha256').update(await readFile(output)).digest('hex');
    metadata.status = 'downloaded';
    metadata.completedAt = new Date().toISOString();
    metadata.usage = safeUsage(completedTask);
    metadata.outputBytes = outputStat.size;
    metadata.outputSha256 = outputSha256;
    await writeMetadata(metadataPath, metadata);
    console.log(`Candidate saved: ${relative(projectRoot, output).replaceAll('\\', '/')} (${outputStat.size} bytes, SHA-256 ${outputSha256}).`);
  } catch (error) {
    await rm(`${output}.part`, { force: true });
    metadata.status = 'failed';
    metadata.completedAt = new Date().toISOString();
    metadata.error = sanitizeError(error, apiKey);
    await writeMetadata(metadataPath, metadata);
    throw new Error(metadata.error);
  }
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
});

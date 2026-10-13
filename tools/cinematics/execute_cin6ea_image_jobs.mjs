import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';

const ROOT = process.cwd();
const MODEL = 'gpt-image-2.5-sunburst-2026-09-08';
const QUALITY = 'max';
const ENDPOINT = 'https://api.openai.com/v1/images/edits';
const REQUEST_SIZE = '1920x1088';
const REVIEW_SIZE = '1920x1080';
const MANIFEST_PATH = resolve(ROOT, 'tools/cinematics/specs/cin6ea_compiled_prompt_manifest.json');
const DEFAULT_OUTPUT_ROOT = resolve(ROOT, 'tmp/cinematics/cin6ea/execution/images');

function argumentsMap(argv) {
  const result = { jobs: [], outputRoot: DEFAULT_OUTPUT_ROOT, recoverRaw: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--job') result.jobs.push(argv[++index]);
    else if (value === '--jobs') result.jobs.push(...argv[++index].split(',').map((item) => item.trim()).filter(Boolean));
    else if (value === '--output-root') result.outputRoot = resolve(ROOT, argv[++index]);
    else if (value === '--recover-raw') result.recoverRaw = true;
    else throw new Error(`Unknown argument '${value}'.`);
  }
  if (!result.jobs.length) throw new Error('Provide at least one --job or --jobs value.');
  return result;
}

function parseEnv(text) {
  const env = new Map();
  for (const line of text.split(/\r?\n/u)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/u);
    if (!match) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env.set(match[1], value);
  }
  return env;
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function mimeType(path) {
  const extension = extname(path).toLowerCase();
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.webp') return 'image/webp';
  return 'image/png';
}

function safeApiError(response, body) {
  const error = body?.error ?? {};
  return {
    httpStatus: response.status,
    errorType: typeof error.type === 'string' ? error.type : 'unknown',
    errorCode: typeof error.code === 'string' ? error.code : null,
    errorMessage: typeof error.message === 'string' ? error.message.slice(0, 1_000) : 'Image API request failed.',
  };
}

function cropToReviewFrame(rawPath, outputPath) {
  const preferred = process.env.CIN6EA_PYTHON;
  const candidates = [preferred, 'python', 'python3'].filter(Boolean);
  const code = [
    'from PIL import Image',
    'import sys',
    'source, target = sys.argv[1], sys.argv[2]',
    'with Image.open(source) as image:',
    '    assert image.size == (1920, 1088), image.size',
    '    image.crop((0, 4, 1920, 1084)).save(target)',
  ].join('\n');
  for (const command of candidates) {
    const result = spawnSync(command, ['-c', code, rawPath, outputPath], { encoding: 'utf8' });
    if (!result.error && result.status === 0) return;
  }
  throw new Error('Could not run the deterministic 1920x1088 to 1920x1080 center crop.');
}

async function executeJob(job, apiKey, outputRoot, recoverRaw) {
  if (job.model !== MODEL || job.exactModelSnapshot !== MODEL || job.quality !== QUALITY) {
    throw new Error(`${job.assetCandidateId}: compiled model or quality lock does not match CIN-6E-A.1.`);
  }
  if (job.endpoint !== '/v1/images/edits' || job.generationType !== 'edit') {
    throw new Error(`${job.assetCandidateId}: only the locked image edit path is supported.`);
  }

  const outputDir = resolve(outputRoot, job.assetCandidateId);
  await mkdir(outputDir, { recursive: true });
  const finalPath = resolve(outputDir, `${job.assetCandidateId}.png`);
  const rawPath = resolve(outputDir, `${job.assetCandidateId}_raw_1920x1088.png`);
  const provenancePath = resolve(outputDir, 'provenance.json');
  const promptPath = resolve(outputDir, 'prompt.txt');
  try {
    await readFile(finalPath);
    throw new Error(`${job.assetCandidateId}: output already exists; refusing to overwrite.`);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  const referenceHashes = {};
  for (const referencePath of job.referencePaths) {
    const absolute = resolve(ROOT, referencePath);
    const bytes = await readFile(absolute);
    referenceHashes[referencePath] = sha256(bytes);
  }

  let rawBytes;
  let usage = null;
  let generationTimestamp;
  let recovery = null;
  if (recoverRaw) {
    rawBytes = await readFile(rawPath);
    generationTimestamp = (await stat(rawPath)).mtime.toISOString();
    recovery = {
      mode: 'LOCAL_POSTPROCESS_FROM_EXISTING_API_RAW_OUTPUT',
      reason: 'The API response was written successfully; the original run failed only because its Python crop command was unavailable.',
      additionalApiCalls: 0,
    };
  } else {
    const form = new FormData();
    form.append('model', MODEL);
    form.append('quality', QUALITY);
    form.append('size', REQUEST_SIZE);
    form.append('prompt', job.prompt);
    for (const referencePath of job.referencePaths) {
      const bytes = await readFile(resolve(ROOT, referencePath));
      form.append('image[]', new Blob([bytes], { type: mimeType(referencePath) }), basename(referencePath));
    }

    const startedAt = new Date().toISOString();
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const safe = { assetCandidateId: job.assetCandidateId, startedAt, ...safeApiError(response, body) };
      await writeFile(resolve(outputDir, 'generation-error.json'), `${JSON.stringify(safe, null, 2)}\n`);
      throw new Error(`${job.assetCandidateId}: Image API returned HTTP ${response.status}.`);
    }
    const encoded = body?.data?.[0]?.b64_json;
    if (typeof encoded !== 'string' || !encoded.length) throw new Error(`${job.assetCandidateId}: response did not contain image bytes.`);
    rawBytes = Buffer.from(encoded, 'base64');
    await writeFile(rawPath, rawBytes);
    usage = body.usage ?? null;
    generationTimestamp = new Date().toISOString();
  }
  cropToReviewFrame(rawPath, finalPath);
  const outputBytes = await readFile(finalPath);
  const provenance = {
    assetCandidateId: job.assetCandidateId,
    endpoint: '/v1/images/edits',
    generationType: 'edit',
    model: MODEL,
    exactModelSnapshot: MODEL,
    quality: QUALITY,
    requestedSize: REQUEST_SIZE,
    deliveredSize: REQUEST_SIZE,
    finalReviewSize: REVIEW_SIZE,
    postprocess: 'center crop y=4..1084; no resampling',
    generationTimestamp,
    promptSpecPath: job.promptSpecPath,
    promptSha256: job.promptSha256,
    referencePaths: job.referencePaths,
    referenceSha256: referenceHashes,
    rawOutputPath: rawPath.slice(ROOT.length + 1).replaceAll('\\', '/'),
    rawOutputSha256: sha256(rawBytes),
    outputPath: finalPath.slice(ROOT.length + 1).replaceAll('\\', '/'),
    outputSha256: sha256(outputBytes),
    usage,
    recovery,
  };
  await writeFile(promptPath, job.prompt, 'utf8');
  await writeFile(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    assetCandidateId: job.assetCandidateId,
    status: 'GENERATED',
    outputPath: provenance.outputPath,
    outputSha256: provenance.outputSha256,
  }));
  return provenance;
}

const options = argumentsMap(process.argv.slice(2));
const localEnv = parseEnv(await readFile(resolve(ROOT, '.env.local'), 'utf8'));
const apiKey = process.env.OPENAI_API_KEY ?? localEnv.get('OPENAI_API_KEY');
if (!apiKey && !options.recoverRaw) throw new Error('OPENAI_API_KEY is absent or unreadable.');
const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
const byId = new Map(manifest.jobs.map((job) => [job.assetCandidateId, job]));
const jobs = options.jobs.map((id) => {
  const job = byId.get(id);
  if (!job) throw new Error(`Unknown compiled CIN-6E-A image job '${id}'.`);
  return job;
});

await mkdir(options.outputRoot, { recursive: true });
const run = {
  exactModelSnapshot: MODEL,
  quality: QUALITY,
  endpoint: '/v1/images/edits',
  executionMode: options.recoverRaw ? 'RECOVER_EXISTING_RAW' : 'API_GENERATION',
  startedAt: new Date().toISOString(),
  jobs: [],
};
for (const job of jobs) {
  try {
    const provenance = await executeJob(job, apiKey, options.outputRoot, options.recoverRaw);
    run.jobs.push({ assetCandidateId: job.assetCandidateId, status: 'GENERATED', provenance });
  } catch (error) {
    run.jobs.push({ assetCandidateId: job.assetCandidateId, status: 'FAILED', error: error instanceof Error ? error.message : String(error) });
    run.finishedAt = new Date().toISOString();
    await writeFile(resolve(options.outputRoot, 'last-run.json'), `${JSON.stringify(run, null, 2)}\n`, 'utf8');
    throw error;
  }
}
run.finishedAt = new Date().toISOString();
await writeFile(resolve(options.outputRoot, 'last-run.json'), `${JSON.stringify(run, null, 2)}\n`, 'utf8');

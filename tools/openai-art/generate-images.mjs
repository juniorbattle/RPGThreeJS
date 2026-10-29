// Local-only image generation with OpenAI gpt-image-2 (combat art mission).
// Port of the RPGCards generator (tools/m09-generer-images.mjs): the key is
// read at run time from `.env.local` at the repository root (gitignored),
// never printed, never written anywhere else, never bundled (no VITE_ var).
// One image per call, in spec order; a refused call stops the batch. Raw
// outputs go to `art-gen/<batch>/` (gitignored) with `provenance.json`
// (model, endpoint, params, full prompt, input hashes, output hash, usage).
//
// Usage:
//   node tools/openai-art/generate-images.mjs <spec.json> [--only <name>] [--dry-run]
// Spec: { "batch": "<folder>", "images": [{ "name", "endpoint": "edits" | "generations",
//          "inputs": [repo-relative paths], "prompt", "size", "quality", "background"? }] }
// Env: RPG_ENV_FILE (default <repo>/.env.local), RPG_ART_GEN (default <repo>/art-gen)
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MODEL = 'gpt-image-2';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const specPath = args.find((a) => !a.startsWith('--'));
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const dryRun = args.includes('--dry-run');
if (!specPath) throw new Error('usage: node tools/openai-art/generate-images.mjs <spec.json> [--only <name>] [--dry-run]');
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const envFile = process.env.RPG_ENV_FILE || join(ROOT, '.env.local');
const outDir = join(process.env.RPG_ART_GEN || join(ROOT, 'art-gen'), spec.batch);
const sha = (b) => createHash('sha256').update(b).digest('hex');

/** Reads the key without ever printing it; when missing only variable NAMES are reported. */
function readKey() {
  if (!existsSync(envFile)) throw new Error(`key file missing: ${envFile}`);
  const vars = new Map();
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (m) vars.set(m[1], m[2].replace(/^['"]|['"]$/g, ''));
  }
  const key = vars.get('OPENAI_API_KEY');
  if (!key) throw new Error(`OPENAI_API_KEY missing from ${basename(envFile)} (present: ${[...vars.keys()].join(', ') || 'none'})`);
  return key;
}

const selected = spec.images.filter((im) => !only || im.name === only);
if (dryRun) {
  for (const im of selected) {
    console.log(`— ${im.name} [${im.endpoint}, ${im.size}, ${im.quality}] inputs: ${(im.inputs ?? []).join(', ') || 'none'}`);
    for (const p of im.inputs ?? []) if (!existsSync(join(ROOT, p))) console.log(`  ! missing input ${p}`);
    console.log(im.prompt.split('\n\n').map((para) => `  ${para}`).join('\n'));
  }
  console.log(`${selected.length} image(s) would be generated into ${outDir}`);
  process.exit(0);
}

const key = readKey();
mkdirSync(outDir, { recursive: true });
const logPath = join(outDir, 'provenance.json');
const log = existsSync(logPath) ? JSON.parse(readFileSync(logPath, 'utf8')) : { batch: spec.batch, images: [] };
for (const im of selected) {
  if (existsSync(join(outDir, `${im.name}.png`)) && !args.includes('--force')) { console.log(`skip ${im.name} (exists; --force to regenerate)`); continue; }
  const inputs = (im.inputs ?? []).map((p) => { const b = readFileSync(join(ROOT, p)); return { path: p, sha256: sha(b), bytes: b.length, buf: b }; });
  const params = { model: MODEL, size: im.size, quality: im.quality, background: im.background, output_format: 'png', n: 1 };
  const t0 = Date.now();
  let res;
  if (im.endpoint === 'edits') {
    const fd = new FormData();
    for (const [k, v] of Object.entries(params)) if (v !== undefined) fd.append(k, String(v));
    fd.append('prompt', im.prompt);
    for (const i of inputs) fd.append('image[]', new Blob([i.buf], { type: 'image/png' }), basename(i.path));
    res = await fetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: fd });
  } else {
    res = await fetch('https://api.openai.com/v1/images/generations', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...params, prompt: im.prompt }) });
  }
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.data?.[0]?.b64_json) {
    console.error(`FAILED ${im.name}: HTTP ${res.status} ${body?.error?.message ?? '(unreadable response)'}`);
    process.exit(1);
  }
  const png = Buffer.from(body.data[0].b64_json, 'base64');
  const file = `${im.name}.png`;
  writeFileSync(join(outDir, file), png);
  const entry = {
    name: im.name, file, model: MODEL, endpoint: `/v1/images/${im.endpoint}`, params, prompt: im.prompt,
    inputs: inputs.map(({ path, sha256, bytes }) => ({ path, sha256, bytes })),
    output: { sha256: sha(png), bytes: png.length, width: png.readUInt32BE(16), height: png.readUInt32BE(20) },
    meta: im.meta ?? null, usage: body.usage ?? null, created: body.created ?? null,
    date: new Date().toISOString(), durationMs: Date.now() - t0,
  };
  log.images = log.images.filter((x) => x.name !== im.name).concat(entry);
  writeFileSync(logPath, JSON.stringify(log, null, 2));
  console.log(`OK ${im.name}: ${entry.output.width}×${entry.output.height}, ${png.length} bytes, ${entry.durationMs} ms`);
}

#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFile as execFileCallback } from 'node:child_process';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);
const root = process.cwd();
const out = resolve(root, 'tmp/cinematics/cin6ea/audits/cin6ea2-audit.json');
const baseline = '6683c6d3898db0216549c43f7d25c7d8fd46d70d';
const protectedPrefixes = [
  'src/game/runSystem.ts',
  'src/game/lionNarrative.ts',
  'src/ui/DialogueView.ts',
  'src/ui/TravelView.ts',
  'src/combat/',
  'src/vfx/',
  'public/assets/characters/pixel/archive/non-demo/',
  'public/assets/cinematics/',
];
const textExtensions = new Set(['.js', '.mjs', '.ts', '.tsx', '.json', '.md', '.html', '.css', '.py', '.txt']);

async function git(args, options = {}) {
  const result = await execFile('git', args, { cwd: root, windowsHide: true, maxBuffer: 64 * 1024 * 1024, ...options });
  return result.stdout;
}

function normalize(path) {
  return path.replaceAll('\\', '/');
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function listFiles(path) {
  const files = [];
  try {
    const entries = await readdir(path, { withFileTypes: true });
    for (const entry of entries) {
      const child = resolve(path, entry.name);
      if (entry.isDirectory()) files.push(...await listFiles(child));
      else if (entry.isFile()) files.push(child);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return files;
}

async function main() {
  const branch = (await git(['branch', '--show-current'])).trim();
  const head = (await git(['rev-parse', 'HEAD'])).trim();
  const originMain = (await git(['rev-parse', 'origin/main'])).trim();
  const statusLines = (await git(['status', '--porcelain=v1', '--untracked-files=all']))
    .split(/\r?\n/u).filter(Boolean);
  const changedPaths = statusLines.map((line) => normalize(line.slice(3).replace(/^"|"$/gu, '')));
  const protectedChanges = changedPaths.filter((path) => protectedPrefixes.some((prefix) => path === prefix || path.startsWith(prefix)));

  const productionPaths = (await git(['ls-files', 'public/assets/cinematics']))
    .split(/\r?\n/u).filter((path) => path.endsWith('.mp4'));
  const productionHashes = [];
  for (const path of productionPaths) {
    const worktreeBytes = await readFile(resolve(root, path));
    const { stdout: headBytes } = await execFile('git', ['show', `HEAD:${path}`], {
      cwd: root,
      windowsHide: true,
      encoding: 'buffer',
      maxBuffer: 256 * 1024 * 1024,
    });
    productionHashes.push({ path, currentSha256: sha256(worktreeBytes), baselineSha256: sha256(headBytes), unchanged: Buffer.compare(worktreeBytes, headBytes) === 0 });
  }
  const manifestPath = 'public/assets/cinematics/manifest.json';
  const manifestBytes = await readFile(resolve(root, manifestPath));
  const { stdout: manifestHeadBytes } = await execFile('git', ['show', `HEAD:${manifestPath}`], {
    cwd: root,
    windowsHide: true,
    encoding: 'buffer',
    maxBuffer: 16 * 1024 * 1024,
  });
  const normalizedManifestBytes = Buffer.from(manifestBytes.toString('utf8').replaceAll('\r\n', '\n'));
  const normalizedManifestHeadBytes = Buffer.from(manifestHeadBytes.toString('utf8').replaceAll('\r\n', '\n'));

  const env = await readFile(resolve(root, '.env.local'), 'utf8');
  const keyMatch = /^MINIMAX_API_KEY\s*=\s*["']?([^\r\n"']+)/mu.exec(env);
  if (!keyMatch?.[1]) throw new Error('MINIMAX_API_KEY missing for secret audit.');
  const secret = Buffer.from(keyMatch[1].trim());
  const untracked = (await git(['ls-files', '--others', '--exclude-standard']))
    .split(/\r?\n/u).filter(Boolean).map((path) => resolve(root, path));
  const ignoredEvidence = [
    ...(await listFiles(resolve(root, 'tmp/cinematics/cin4/cin6ea2_pilot_c_camp_continuous'))),
    ...(await listFiles(resolve(root, 'tmp/cinematics/cin4/cin6ea2_pilot_e_cedric_continuous'))),
    ...(await listFiles(resolve(root, 'tmp/cinematics/cin4/cin6ea2_pilot_f_shadow_continuous'))),
    ...(await listFiles(resolve(root, 'tmp/cinematics/cin6ea/dynamic'))),
  ];
  const secretScope = [...new Set([...untracked, ...ignoredEvidence])];
  const secretLeaks = [];
  for (const path of secretScope) {
    const bytes = await readFile(path);
    if (bytes.includes(secret)) secretLeaks.push(normalize(relative(root, path)));
  }

  const whitespaceFailures = [];
  for (const path of untracked) {
    if (!textExtensions.has(extname(path).toLowerCase())) continue;
    const contents = await readFile(path, 'utf8');
    if (/\r?[ \t]+$/mu.test(contents)) whitespaceFailures.push({ path: normalize(relative(root, path)), reason: 'trailing whitespace' });
    if (contents && !contents.endsWith('\n')) whitespaceFailures.push({ path: normalize(relative(root, path)), reason: 'missing final newline' });
  }
  await git(['diff', '--check']);

  const viewer = resolve(root, 'tmp/cinematics/cin6ea/review/index.html');
  const pdf = resolve(root, 'output/pdf/CIN-6E-A.2 Continuous Video Fidelity Gate.pdf');
  await access(viewer);

  const report = {
    schemaVersion: 1,
    mission: 'CIN-6E-A.2',
    baseline,
    branch,
    head,
    originMain,
    continuationMode: head === baseline && originMain === baseline && branch === 'main' ? 'PASS' : 'FAIL',
    worktreeState: statusLines.length ? 'EXPECTED_UNCOMMITTED_CIN_6E_A_WORK_PRESENT' : 'UNEXPECTED_CLEAN',
    secretAudit: { status: secretLeaks.length ? 'FAIL' : 'PASS', scannedFiles: secretScope.length, leaks: secretLeaks },
    protectedPathAudit: { status: protectedChanges.length ? 'FAIL' : 'PASS', changes: protectedChanges },
    productionMediaHashAudit: {
      status: productionHashes.every((entry) => entry.unchanged) ? 'PASS' : 'FAIL',
      unchanged: productionHashes.filter((entry) => entry.unchanged).length,
      total: productionHashes.length,
      entries: productionHashes,
    },
    productionManifestHashAudit: {
      status: Buffer.compare(normalizedManifestBytes, normalizedManifestHeadBytes) === 0 ? 'PASS' : 'FAIL',
      comparison: 'UTF-8 content normalized to LF to ignore checkout-only CRLF conversion',
      currentSha256: sha256(normalizedManifestBytes),
      baselineSha256: sha256(normalizedManifestHeadBytes),
    },
    diffAudit: { status: whitespaceFailures.length ? 'FAIL' : 'PASS', untrackedTextFailures: whitespaceFailures },
    deliverables: {
      viewer: normalize(relative(root, viewer)),
      pdf: normalize(relative(root, pdf)),
      pdfState: 'GENERATED_ON_DEMAND',
      pdfBuilder: 'tools/cinematics/build_cin6ea2_pdf.py',
    },
  };
  await mkdir(resolve(out, '..'), { recursive: true });
  await writeFile(out, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    continuationMode: report.continuationMode,
    worktreeState: report.worktreeState,
    secretAudit: report.secretAudit,
    protectedPathAudit: report.protectedPathAudit,
    productionMediaHashAudit: { status: report.productionMediaHashAudit.status, unchanged: report.productionMediaHashAudit.unchanged, total: report.productionMediaHashAudit.total },
    productionManifestHashAudit: report.productionManifestHashAudit,
    diffAudit: report.diffAudit,
    report: normalize(relative(root, out)),
  }, null, 2));
  if ([report.continuationMode, report.secretAudit.status, report.protectedPathAudit.status,
    report.productionMediaHashAudit.status, report.productionManifestHashAudit.status, report.diffAudit.status].includes('FAIL')) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
});

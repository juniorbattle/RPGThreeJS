import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createNarrativeStagingAudit, validateNarrativeStagingAudit } from '../../src/cinematics/NarrativeStagingAudit';

const audit = createNarrativeStagingAudit();
const errors = validateNarrativeStagingAudit(audit);
const outputPath = resolve(process.cwd(), 'tools/cinematics/specs/narrative_dialogue_staging.json');

if (process.argv.includes('--write')) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(audit, null, 2)}\n`, 'utf8');
}

if (errors.length) {
  console.error(JSON.stringify({ ok: false, errors, summary: audit.summary }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ ok: true, outputPath, summary: audit.summary }, null, 2));
}


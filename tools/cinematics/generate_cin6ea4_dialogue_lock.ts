/// <reference types="node" />
/**
 * Writes the Lion dialogue presentation lock, `src/cinematics/FinalDialoguePresentation.generated.ts`, from
 * `dialoguePresentationLock.ts`. `npm run cinematics:generate-dialogue-lock` writes it; add `-- --check` to only
 * compare it with a regeneration (exit code 1 when they differ).
 *
 * Until 2026-09-18 this script also wrote the CIN-6E-A.4R audits and reports (`tools/cinematics/specs/final_*.json`,
 * `docs/reports/cin-6e-a-4*`). Those files are dated evidence: it no longer rewrites them (the former writer is in
 * the history of this file, `e749b822`).
 */
import { readFile, writeFile } from 'node:fs/promises';
import {
  DIALOGUE_PRESENTATION_LOCK_FILE,
  DIALOGUE_PRESENTATION_LOCK_PATH,
  buildDialoguePresentationLock,
  renderDialoguePresentationLock,
  validateDialoguePresentationLock,
  type DialoguePresentationLockReference,
} from './dialoguePresentationLock';

async function committedReference(): Promise<DialoguePresentationLockReference> {
  try {
    return await import('../../src/cinematics/FinalDialoguePresentation.generated');
  } catch {
    return {};
  }
}

const lock = buildDialoguePresentationLock(await committedReference());
const errors = validateDialoguePresentationLock(lock);
if (errors.length) {
  console.error(JSON.stringify({ ok: false, errors }, null, 2));
  process.exit(1);
}
const text = renderDialoguePresentationLock(lock);
const current = await readFile(DIALOGUE_PRESENTATION_LOCK_FILE, 'utf8').then((value) => value.replace(/\r\n/g, '\n'), () => '');
const summary = {
  output: DIALOGUE_PRESENTATION_LOCK_PATH,
  canonicalPlans: Object.keys(lock.plans).length,
  runtimeVariants: Object.values(lock.runtimePlans).reduce((total, byShape) => total + Object.keys(byShape).length, 0),
  segments: [...Object.values(lock.plans), ...Object.values(lock.runtimePlans).flatMap((byShape) => Object.values(byShape))]
    .reduce((total, plan) => total + plan.segments.length, 0),
  upToDate: current === text,
};
if (process.argv.includes('--check')) {
  console.log(JSON.stringify({ ok: summary.upToDate, ...summary }, null, 2));
  if (!summary.upToDate) process.exitCode = 1;
} else {
  if (!summary.upToDate) await writeFile(DIALOGUE_PRESENTATION_LOCK_FILE, text);
  console.log(JSON.stringify({ ok: true, written: !summary.upToDate, ...summary }, null, 2));
}

#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DIALOGUE_CAST_AUDIT_PATH = 'tools/cinematics/specs/cinematic_dialogue_cast_audit.json';
export const DIALOGUE_CLASSIFICATIONS = Object.freeze(['AGENCY_DIALOGUE', 'CINEMATIC_DIALOGUE']);
export const TEXT_CLASSIFICATIONS = Object.freeze(['CINEMATIC_DIALOGUE', 'VISUAL_REPLACEABLE', 'REDUNDANT_EXPOSITION']);
const EXPECTED = Object.freeze({
  camp_departure: 'camp_departure',
  lion_briefing: 'alaric_audience_arrival',
  village_choice: 'bois_clair_arrival',
  shadow_signs: 'shadow_signs',
  final_refuge: 'final_refuge_dossier',
  lion_finale_judgement: 'lion_judgement',
});

const isStringArray = (value) => Array.isArray(value) && value.every((entry) => typeof entry === 'string' && entry.length > 0);

export async function validateCinematicDialogueCastAudit(input, options = {}) {
  const projectRoot = options.projectRoot ?? process.cwd();
  const errors = [];
  if (input?.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  if (!Array.isArray(input?.entries)) return { valid: false, errors: [...errors, 'entries must be an array.'], entryCount: 0 };
  const seen = new Set();
  for (const entry of input.entries) {
    if (!entry?.dialogueId || seen.has(entry.dialogueId)) errors.push(`dialogueId '${entry?.dialogueId}' is missing or duplicated.`);
    seen.add(entry?.dialogueId);
    if (EXPECTED[entry?.dialogueId] !== entry?.cinematicId) errors.push(`${entry?.dialogueId} must map to ${EXPECTED[entry?.dialogueId]}.`);
    for (const field of ['speakers', 'requiredCast', 'visibleCinematicCast', 'missingSpeakers', 'unjustifiedVisibleCharacters', 'playerRepresentatives']) {
      if (!isStringArray(entry?.[field])) errors.push(`${entry?.dialogueId}.${field} must be a string array.`);
    }
    if (!DIALOGUE_CLASSIFICATIONS.includes(entry?.classification)) errors.push(`${entry?.dialogueId}.classification is invalid.`);
    if (entry?.aligned && (entry.missingSpeakers.length || entry.unjustifiedVisibleCharacters.length || !entry.playerRepresentationCorrect)) {
      errors.push(`${entry.dialogueId} cannot be aligned while unresolved cast mismatches remain.`);
    }
    for (const actor of entry?.justifiedOffscreenActors ?? []) if (!actor?.id || !actor?.reason) errors.push(`${entry.dialogueId} has an an offscreen actor reason.`);
    const uncovered = entry.speakers.filter((speaker) => !entry.visibleCinematicCast.includes(speaker) && !(entry.justifiedOffscreenActors ?? []).some((actor) => actor.id === speaker) && !entry.missingSpeakers.includes(speaker));
    if (uncovered.length) errors.push(`${entry.dialogueId} leaves speakers unaudited: ${uncovered.join(', ')}.`);
  }
  if (seen.size !== Object.keys(EXPECTED).length || Object.keys(EXPECTED).some((id) => !seen.has(id))) errors.push('entries must exhaustively cover the six cinematic-linked dialogues.');
  const audience = input.entries.find((entry) => entry.dialogueId === 'lion_briefing');
  if (audience?.playerRepresentatives?.join(',') !== 'sage_seraphine,maelor') errors.push('lion_briefing must use the two core advisers as player representatives.');
  for (const item of input.textReductionCandidates ?? []) if (!TEXT_CLASSIFICATIONS.includes(item?.classification)) errors.push(`${item?.dialogId}.text reduction classification is invalid.`);
  const summary = input.summary ?? {};
  if (summary.totalCinematicLinkedDialogues !== input.entries.length) errors.push('summary.totalCinematicLinkedDialogues drifted.');
  if (summary.aligned !== input.entries.filter((entry) => entry.aligned).length) errors.push('summary.aligned drifted.');
  if (summary.mismatchesFound !== input.entries.filter((entry) => !entry.aligned).length) errors.push('summary.mismatchesFound drifted.');
  if (summary.dialogueTruthChanged !== false) errors.push('dialogueTruthChanged must remain false.');
  const content = await readFile(resolve(projectRoot, 'src/game/content.ts'), 'utf8');
  for (const id of seen) if (!content.includes(`id: '${id}'`)) errors.push(`Dialogue '${id}' does not exist in repository truth.`);
  return { valid: errors.length === 0, errors, entryCount: input.entries.length };
}

async function main() {
  const projectRoot = process.cwd();
  await access(resolve(projectRoot, DIALOGUE_CAST_AUDIT_PATH));
  const input = JSON.parse(await readFile(resolve(projectRoot, DIALOGUE_CAST_AUDIT_PATH), 'utf8'));
  const result = await validateCinematicDialogueCastAudit(input, { projectRoot });
  if (!result.valid) throw new Error(result.errors.join('\n'));
  console.log(`PASS: ${result.entryCount} cinematic-linked dialogues have deterministic cast audits.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(`ERROR: ${error.message}`); process.exitCode = 1; });

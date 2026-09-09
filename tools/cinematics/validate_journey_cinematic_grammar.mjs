#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const JOURNEY_GRAMMAR_PATH = 'tools/cinematics/specs/journey_cinematic_grammar.json';
export const JOURNEY_FAMILIES = Object.freeze(['JOURNEY_SINGLE_ROUTE', 'JOURNEY_TWO_PATH_FORK', 'JOURNEY_APPROACH', 'JOURNEY_DEPARTURE', 'JOURNEY_THREAT']);

export function validateJourneyCinematicGrammar(input) {
  const errors = [];
  if (input?.SchemaVersion === 1) errors.push('schemaVersion casing is invalid.');
  if (input?.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  if (input?.doctrine !== 'FUNCTIONAL_REUSABLE_JOURNEY_CINEMATICS') errors.push('Journey doctrine is invalid.');
  if (input?.canonicalFacing !== 'SCREEN_RIGHT') errors.push('canonicalFacing must remain SCREEN_RIGHT.');
  if (!Array.isArray(input?.families)) return { valid: false, errors: [...errors, 'families must be an array.'], familyCount: 0 };
  const ids = input.families.map((family) => family.id);
  if (new Set(ids).size !== ids.length) errors.push('Journey family IDs must be unique.');
  if (JOURNEY_FAMILIES.some((id) => !ids.includes(id)) || ids.length !== JOURNEY_FAMILIES.length) errors.push('All five Journey grammar families are required exactly once.');
  for (const family of input.families) {
    for (const field of ['castExpectation', 'reuseConstraints', 'finalFrameSemantics']) if (typeof family?.[field] !== 'string' || !family[field]) errors.push(`${family.id}.${field} is required.`);
    for (const field of ['cameraIntent', 'motionIntent', 'safeZoneExpectations', 'environmentRequirements']) if (!Array.isArray(family?.[field]) || !family[field].length) errors.push(`${family.id}.${field} must be non-empty.`);
  }
  const fork = input.families.find((family) => family.id === 'JOURNEY_TWO_PATH_FORK');
  if (fork?.authoritativeRouteCount !== 2) errors.push('TWO_PATH_FORK must have exactly two authoritative routes.');
  for (const zone of ['LEFT_ROUTE_SAFE_ZONE', 'RIGHT_ROUTE_SAFE_ZONE', 'CENTER_GROUP_SAFE_ZONE']) if (!fork?.safeZoneExpectations?.includes(zone)) errors.push(`TWO_PATH_FORK requires ${zone}.`);
  const single = input.families.find((family) => family.id === 'JOURNEY_SINGLE_ROUTE');
  if (single?.authoritativeRouteCount !== 1) errors.push('SINGLE_ROUTE must have exactly one authoritative route.');
  return { valid: errors.length === 0, errors, familyCount: input.families.length };
}

async function main() {
  const input = JSON.parse(await readFile(resolve(process.cwd(), JOURNEY_GRAMMAR_PATH), 'utf8'));
  const result = validateJourneyCinematicGrammar(input);
  if (!result.valid) throw new Error(result.errors.join('\n'));
  console.log(`PASS: ${result.familyCount} Journey cinematic grammar families are valid.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(`ERROR: ${error.message}`); process.exitCode = 1; });

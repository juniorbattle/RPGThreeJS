#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CONTINUITY_BIBLE_PATH = 'tools/cinematics/specs/cinematic_continuity_bible.json';
const REQUIRED_ENVIRONMENTS = ['forest_route', 'lion_camp', 'lion_audience', 'bois_clair', 'refuges', 'ruins', 'shrine'];

export async function validateCinematicContinuityBible(input, options = {}) {
  const projectRoot = options.projectRoot ?? process.cwd();
  const errors = [];
  if (input?.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  if (input?.canonicalFacing !== 'SCREEN_RIGHT') errors.push('canonicalFacing must remain SCREEN_RIGHT.');
  if (!Array.isArray(input?.characters) || !Array.isArray(input?.environments)) return { valid: false, errors: [...errors, 'characters and environments must be arrays.'] };
  const scale = JSON.parse(await readFile(resolve(projectRoot, 'tools/cinematics/specs/cinematic_character_scale.json'), 'utf8'));
  const scaleById = new Map(scale.characters.map((character) => [character.id, character]));
  const characterIds = new Set();
  for (const character of input.characters) {
    if (!character?.id || characterIds.has(character.id)) errors.push(`Character '${character?.id}' is missing or duplicated.`);
    characterIds.add(character?.id);
    const expected = scaleById.get(character.id);
    if (!expected) errors.push(`${character.id} lacks canonical scale metadata.`);
    else if (expected.asset !== character.canonicalSource || expected.relativeStature !== character.relativeStature) errors.push(`${character.id} diverges from canonical source or stature.`);
    try { await access(resolve(projectRoot, character.canonicalSource)); } catch { errors.push(`${character.id} canonical source is missing.`); }
    for (const field of ['equipment', 'weapon', 'faction', 'role', 'visualNotes']) if (typeof character?.[field] !== 'string' || !character[field]) errors.push(`${character.id}.${field} is required.`);
  }
  const environmentIds = input.environments.map((environment) => environment.id);
  for (const id of REQUIRED_ENVIRONMENTS) if (!environmentIds.includes(id)) errors.push(`Environment family '${id}' is missing.`);
  for (const environment of input.environments) {
    for (const path of environment.referenceAssets ?? []) try { await access(resolve(projectRoot, path)); } catch { errors.push(`${environment.id} reference '${path}' is missing.`); }
    for (const field of ['palette', 'landmarks', 'allowedVariation']) if (!Array.isArray(environment?.[field]) || !environment[field].length) errors.push(`${environment.id}.${field} must be non-empty.`);
  }
  return { valid: errors.length === 0, errors, characterCount: input.characters.length, environmentCount: input.environments.length };
}

async function main() {
  const projectRoot = process.cwd();
  const input = JSON.parse(await readFile(resolve(projectRoot, CONTINUITY_BIBLE_PATH), 'utf8'));
  const result = await validateCinematicContinuityBible(input, { projectRoot });
  if (!result.valid) throw new Error(result.errors.join('\n'));
  console.log(`PASS: continuity bible covers ${result.characterCount} characters and ${result.environmentCount} environments.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(`ERROR: ${error.message}`); process.exitCode = 1; });

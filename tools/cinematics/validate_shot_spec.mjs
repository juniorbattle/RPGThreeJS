#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildShotPrompt, validateShotSpec } from './cin4_shot_spec.mjs';

async function findProjectRoot(start) {
  let current = resolve(start);
  for (;;) {
    try {
      await readFile(resolve(current, 'package.json'));
      return current;
    } catch {
      const parent = resolve(current, '..');
      if (parent === current) throw new Error('Could not locate the RPGThreeJS repository root.');
      current = parent;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const specIndex = args.indexOf('--spec');
  if (specIndex === -1 || !args[specIndex + 1]) throw new Error('Usage: validate_shot_spec.mjs --spec <path> [--require-sources] [--prompts]');
  const projectRoot = await findProjectRoot(dirname(fileURLToPath(import.meta.url)));
  const specPath = resolve(projectRoot, args[specIndex + 1]);
  const spec = JSON.parse(await readFile(specPath, 'utf8'));
  const result = await validateShotSpec(spec, { projectRoot, requireSources: args.includes('--require-sources') });
  const output = {
    spec: specPath,
    sequenceId: spec.sequenceId,
    cinematicId: spec.cinematicId,
    tier: spec.tier,
    shotCount: spec.shots?.length ?? 0,
    durationSeconds: spec.shots?.reduce((total, shot) => total + Number(shot.durationSeconds ?? 0), 0) ?? 0,
    validation: result.valid ? 'PASS' : 'FAIL',
    warnings: result.warnings,
    errors: result.errors,
    ...(args.includes('--prompts') && result.valid ? {
      prompts: Object.fromEntries(spec.shots.map((shot) => [shot.shotId, buildShotPrompt(spec, shot)])),
    } : {}),
  };
  console.log(JSON.stringify(output, null, 2));
  if (!result.valid) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
});

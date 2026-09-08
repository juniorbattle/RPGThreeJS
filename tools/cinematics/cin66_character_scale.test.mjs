import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadAndValidateCinematicCharacterScale, validateCinematicCharacterScale } from './validate_cinematic_character_scale.mjs';

const projectRoot = process.cwd();

describe('CIN-6.6 deterministic character scale registry', () => {
  it('covers every immutable canonical full character with valid alpha and foot metadata', async () => {
    const { input, result } = await loadAndValidateCinematicCharacterScale(projectRoot);
    const files = (await readdir(resolve(projectRoot, input.canonicalRoot))).filter((name) => name.endsWith('.png'));
    expect(result).toEqual({ valid: true, errors: [], profileCount: files.length });
    expect(input.characters.every((entry) => entry.visibleBodyHeight === entry.alphaBounds.bottom - entry.alphaBounds.top)).toBe(true);
    expect(input.characters.every((entry) => entry.footAnchor.sourceY === entry.alphaBounds.bottom - 1)).toBe(true);
  });

  it('records canonical hashes so normalization cannot silently overwrite source art', async () => {
    const { input } = await loadAndValidateCinematicCharacterScale(projectRoot);
    expect(input.characters.every((entry) => /^[a-f0-9]{64}$/u.test(entry.sourceSha256))).toBe(true);
    const raw = await readFile(resolve(projectRoot, 'tools/cinematics/normalize_character_sources.py'), 'utf8');
    expect(raw).not.toMatch(/\.save\(path/);
    expect(raw).toContain('REVIEW_ROOT');
  });

  it('rejects uniform or invalid scale data and duplicate IDs', async () => {
    const { input } = await loadAndValidateCinematicCharacterScale(projectRoot);
    const broken = structuredClone(input);
    broken.characters[1].id = broken.characters[0].id;
    broken.characters[2].relativeStature = 0;
    const result = await validateCinematicCharacterScale(broken, { projectRoot });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('duplicates'))).toBe(true);
    expect(result.errors.some((error) => error.includes('relativeStature'))).toBe(true);
  });

  it('preserves character-specific stature on one review canvas', async () => {
    const { input } = await loadAndValidateCinematicCharacterScale(projectRoot);
    const byId = new Map(input.characters.map((entry) => [entry.id, entry]));
    expect(input.reviewConvention.physicalHeightPolicy).toContain('never uniform');
    expect(byId.get('lion_champion').relativeStature).toBeGreaterThan(byId.get('kestrel').relativeStature);
    expect(byId.get('cave_rat').relativeStature).toBeLessThan(byId.get('alistair').relativeStature);
  });
});

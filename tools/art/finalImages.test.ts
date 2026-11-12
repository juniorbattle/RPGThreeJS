import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildPlan, PILOT_IDS } from './finalImages';

describe('final images plan (OD-2026-11-11-F, F1)', () => {
  const plan = buildPlan();

  it('briefs every provisional image of the post-demo plateaux once, with style references that exist', () => {
    expect(plan.length).toBeGreaterThan(150);
    expect(new Set(plan.map((item) => item.id)).size).toBe(plan.length);
    for (const item of plan) {
      expect(item.awaitedFinal.length, item.id).toBeGreaterThan(5);
      expect(item.references.length, item.id).toBeGreaterThan(0);
      for (const reference of item.references) expect(existsSync(join(process.cwd(), reference)), reference).toBe(true);
    }
  });

  it('asks for empty landscape backdrops and transparent square characters', () => {
    for (const item of plan) {
      if (item.kind === 'character') {
        expect(item).toMatchObject({ size: '1024x1024', transparent: true });
        expect(item.prompt).toContain('transparent background');
      } else {
        expect(item).toMatchObject({ size: '1536x1024', transparent: false });
      }
      if (item.kind === 'backdrop') expect(item.prompt).toContain('no characters');
    }
  });

  it('keeps the six-image Bear pilot in the plan, with the proposed looks marked for confirmation', () => {
    expect(PILOT_IDS).toHaveLength(6);
    for (const id of PILOT_IDS) expect(plan.some((item) => item.id === id), id).toBe(true);
    expect(plan.find((item) => item.id === 'bear:actor:borin')!.notes).toMatch(/^PROPOSAL, to confirm/);
  });

  it('reads the key from the environment only and never writes it anywhere', () => {
    const source = readFileSync(join(process.cwd(), 'tools', 'art', 'finalImages.ts'), 'utf8');
    expect(source).toContain('process.env.OPENAI_API_KEY');
    // The key only travels in the request header: never into the log, the plan or the console.
    expect(source).toContain('headers: { Authorization: `Bearer ${key}` }');
    expect(source).not.toMatch(/log\.push\(\{[^}]*\bkey\b/);
    expect(source).not.toMatch(/console\.(log|error)\([^)]*\bkey\b/);
  });
});

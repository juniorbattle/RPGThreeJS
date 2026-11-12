import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildPlan, COVERED_FACE_RULE, heraldryFor, openAiKey, PILOT_IDS } from './finalImages';

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

  it('tells every brief to keep the references’ style but not their Lion heraldry, and names the clan’s own sign', () => {
    for (const item of plan) {
      expect(item.prompt, item.id).toContain('never copy their heraldry');
      if (item.chapter !== 'finale') expect(item.prompt, item.id).toMatch(/never a lion\.$/);
    }
    expect(plan.find((item) => item.id === 'bear:scene:bear_audience')!.prompt).toContain('the Bear clan’s sign, a bear');
  });

  it('gives another clan named by a brief its own sign: the Raven in the Bear’s mountains, the Serpent’s champion', () => {
    expect(heraldryFor('bear', 'Sprite de l’éclaireur du Corbeau')).toBe('Each clan keeps its own sign: the Raven clan’s people, camps and banners show a raven; the Bear clan’s own places show a bear; never a lion.');
    expect(heraldryFor('bear', 'Tableau : la salle de l’Ancien Ours Borin')).toBe('Any banner, shield, medallion or carved emblem shows the Bear clan’s sign, a bear; never a lion.');
    expect(heraldryFor('dragon', 'Tableau : les pièges du Loup')).toContain('the Wolf clan’s people, camps and banners show a wolf');
    expect(heraldryFor('finale', 'Sprite de boss du champion du Serpent')).toContain('the Serpent clan’s people, camps and banners show a serpent');
    expect(heraldryFor('scorpion', 'Tableau : le nid de serpents')).not.toContain('Serpent clan');
    expect(plan.find((item) => item.id === 'bear:enemy:raven_scout')!.prompt).toContain('show a raven');
  });

  it('keeps every character’s face covered, the operator’s standing rule (OD-2026-11-11-G)', () => {
    const characters = plan.filter((item) => item.kind === 'character');
    expect(characters.length).toBeGreaterThan(40);
    for (const item of characters) {
      expect(item.prompt, item.id).toContain(COVERED_FACE_RULE);
      expect(item.notes, item.id).not.toMatch(/beard|bare face|bare-headed/i);
    }
    expect(plan.find((item) => item.id === 'bear:actor:borin')!.notes).toContain('hides his face');
  });

  it('takes the key from the terminal, else from .env.local, loading nothing but the OPENAI_ variables', () => {
    const saved = process.env.OPENAI_API_KEY;
    const root = mkdtempSync(join(tmpdir(), 'final-images-key-'));
    try {
      delete process.env.OPENAI_API_KEY;
      expect(openAiKey(root)).toBeNull();
      writeFileSync(join(root, '.env.local'), ['OPENAI_API_KEY=test-not-a-real-key', 'OTHER_SECRET=must-stay-unread', ''].join('\n'));
      expect(openAiKey(root)).toEqual({ key: 'test-not-a-real-key', source: 'the project env file (.env.local)' });
      expect(process.env.OTHER_SECRET).toBeUndefined();
      process.env.OPENAI_API_KEY = 'test-terminal-key';
      expect(openAiKey(root)).toEqual({ key: 'test-terminal-key', source: 'the terminal' });
    } finally {
      if (saved === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = saved;
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('never writes the key anywhere', () => {
    const source = readFileSync(join(process.cwd(), 'tools', 'art', 'finalImages.ts'), 'utf8');
    expect(source).toContain("loadEnv('production', root, 'OPENAI_')");
    // The key only travels in the request header: never into the log, the plan or the console.
    expect(source).toContain('headers: { Authorization: `Bearer ${key}` }');
    expect(source).not.toMatch(/log\.push\(\{[^}]*\bkey\b/);
    expect(source).not.toMatch(/console\.(log|error)\([^)]*\bkey\b/);
  });
});

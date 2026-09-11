import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateShotSpec } from './cin4_shot_spec.mjs';
import { probeMedia, technicalErrors } from './cin4_media.mjs';

const root = process.cwd();
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));

const P1 = Object.freeze({
  cedric_encounter: 5,
  garen_encounter: 5,
  serpent_road_tension: 8,
  shrine_reveal_context: 5,
  injured_merchant_encounter: 5,
  abandoned_cart_reveal: 5,
  spider_nest_reveal: 5,
  troll_crossing_reveal: 5,
  serpent_duelist_reveal: 5,
  young_dragon_encounter: 5,
  serpent_informant_encounter: 5,
});

describe('CIN-6C P1 adaptive cinematic production', () => {
  it('ships exactly eleven new local production descriptors', () => {
    const manifest = readJson('public/assets/cinematics/manifest.json');
    const ids = manifest.cinematics.map((entry) => entry.id);
    expect(ids).toHaveLength(32);
    expect(new Set(ids).size).toBe(32);
    expect(Object.keys(P1)).toHaveLength(11);
    for (const [id, seconds] of Object.entries(P1)) {
      const descriptor = manifest.cinematics.find((entry) => entry.id === id);
      expect(descriptor, id).toBeDefined();
      expect(descriptor.placeholderOnly).not.toBe(true);
      expect(descriptor.sources).toEqual([{ src: `/assets/cinematics/${id}.mp4`, type: 'video/mp4' }]);
      expect(descriptor.durationMs).toBe(seconds * 1000);
      expect(descriptor.fallbackText.length).toBeGreaterThan(0);
      expect(descriptor.sources[0].src).not.toMatch(/^https?:/i);
    }
  });

  it('validates every deterministic I2V source spec', async () => {
    for (const id of Object.keys(P1)) {
      const spec = readJson(`tools/cinematics/specs/cin6c/${id}.json`);
      expect(spec.cinematicId).toBe(id);
      expect(spec.resolution).toBe('2K');
      expect(spec.shots).toHaveLength(1);
      expect(spec.shots[0].durationSeconds).toBe(P1[id]);
      expect(spec.shots[0].source.type).toBe('ROOT_SOURCE');
      expect(spec.shots[0].characters.every((character) => (
        character.asset.startsWith('public/assets/characters/pixel/full/')
      ))).toBe(true);
      expect((await validateShotSpec(spec, { projectRoot: root })).errors, id).toEqual([]);
    }
  });

  it('decodes all eleven silent 1080p production masters', async () => {
    for (const [id, seconds] of Object.entries(P1)) {
      const path = resolve(root, `public/assets/cinematics/${id}.mp4`);
      expect(existsSync(path), id).toBe(true);
      const report = await probeMedia(path, root);
      expect(technicalErrors(report, seconds, true), id).toEqual([]);
    }
  }, 120_000);

  it('keeps selection presentation-only and layered after existing CIN-6A mappings', () => {
    const presentation = readFileSync(resolve(root, 'src/cinematics/Cin6aPresentation.ts'), 'utf8');
    const gameApp = readFileSync(resolve(root, 'src/game/GameApp.ts'), 'utf8');
    const runSystem = readFileSync(resolve(root, 'src/game/runSystem.ts'), 'utf8');
    for (const id of Object.keys(P1)) expect(presentation).toContain(`'${id}'`);
    expect(gameApp).toContain('resolveCin6aJourneyTrigger({ hook: \'beforeDialogue\', dialogueId })');
    expect(gameApp).toContain('resolveCin6cJourneyTrigger({ hook: \'beforeDialogue\', dialogueId }, { flags: this.state.flags })');
    expect(gameApp).toContain('resolveCin6cJourneyTrigger(\n          { hook: \'beforeCombat\', combatId }');
    expect(presentation).not.toMatch(/enterRunNode|applyEffects|saveAuto|state\.[A-Za-z]/);
    expect(runSystem).not.toContain('resolveCin6cJourneyTrigger');
  });

  it('contains no runtime MiniMax or remote-media dependency', () => {
    const runtimeFiles = [
      'src/cinematics/Cin6aPresentation.ts',
      'src/journey/JourneyPresentationResolver.ts',
      'src/game/GameApp.ts',
      'public/assets/cinematics/manifest.json',
    ].map((path) => readFileSync(resolve(root, path), 'utf8')).join('\n');
    expect(runtimeFiles).not.toMatch(/api\.minimax|MINIMAX_API_KEY|https?:\/\/[^\s"']+\.mp4/i);
  });
});

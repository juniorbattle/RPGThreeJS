import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateShotSpec } from './cin4_shot_spec.mjs';

const root = process.cwd();
const load = async (id) => JSON.parse(await readFile(resolve(root, `tools/cinematics/specs/cin6a/${id}.json`), 'utf8'));

describe('CIN-6.6 pilot casting, scale and safe-zone specs', () => {
  it('makes the guaranteed company and Lion factions readable in the Audience', async () => {
    const spec = await load('alaric_audience_arrival');
    expect((await validateShotSpec(spec, { projectRoot: root })).valid).toBe(true);
    expect(spec.cast.sceneType).toBe('HIGH_STAKES_DIPLOMACY');
    expect(spec.cast.playerFaction.representatives).toEqual(['sage_seraphine', 'maelor']);
    expect(spec.cast.supportingPlayerCast).toEqual(['alistair']);
    expect(spec.cast.externalFaction.representatives).toEqual(['alaric']);
    expect(spec.cast.justifiedOffscreenActors).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'lion_champion' }),
    ]));
    expect(spec.cast.optionalCharactersExcluded).toEqual(['cedric', 'lancer']);
    expect(new Set(spec.shots.at(-1).characters.filter((character) => character.requiredForNarrativeRead).map((character) => character.id))).toEqual(
      new Set(['sage_seraphine', 'maelor', 'alistair', 'alaric']),
    );
    expect(spec.shots.at(-1).dialogueSafeZone).toEqual({ x: 0.08, y: 0.74, width: 0.84, height: 0.22 });
  });

  it('uses structured scale profiles instead of hand-authored pilot pixel heights', async () => {
    for (const id of ['alaric_audience_arrival', 'camp_departure']) {
      const spec = await load(id);
      for (const character of spec.shots.flatMap((shot) => shot.characters)) {
        expect(character.heightPx).toBeUndefined();
        expect(character.scale.framing).toMatch(/^(WIDE|MEDIUM|CLOSE)$/u);
        expect(character.scale.perspective).toBeGreaterThan(0);
      }
    }
  });

  it('replaces long sliding with a bounded grounded step and an authored agency safe zone', async () => {
    const spec = await load('camp_departure');
    expect((await validateShotSpec(spec, { projectRoot: root })).valid).toBe(true);
    const final = spec.shots.at(-1);
    expect(final.characters.find((character) => character.id === 'alistair').action).toBe('STEP_FORWARD');
    expect(final.characters.some((character) => character.action === 'WALK_SLOW')).toBe(false);
    expect(final.promptIntent).toContain('under four percent of frame width');
    expect(final.nextStepUiSafeZone).toEqual({ x: 0.73, y: 0.73, width: 0.24, height: 0.23 });
  });

  it('rejects high-stakes adviser omission and invalid safe zones', async () => {
    const spec = await load('alaric_audience_arrival');
    spec.cast.playerFaction.representatives = [];
    spec.shots[2].dialogueSafeZone.x = 0.9;
    expect((await validateShotSpec(spec, { projectRoot: root })).errors).toEqual(expect.arrayContaining([
      'HIGH_STAKES_DIPLOMACY requires a player representative or a documented waiver.',
      'HIGH_STAKES_DIPLOMACY requires exactly two player advisers.',
      'shots[2].dialogueSafeZone must remain inside the frame horizontally.',
    ]));
  });

  it('requires integrated source-generation contracts on every V3 shot', async () => {
    const spec = await load('alaric_audience_arrival');
    for (const shot of spec.shots) {
      expect(shot.source.integration.method).toBe('OPENAI_BUILT_IN_IMAGE_GEN_EDIT');
      expect(shot.source.integration.qualityGates).toEqual(expect.arrayContaining(['NO_COLLAGE_LOOK', 'WORLD_INTEGRATION']));
    }
    delete spec.shots[1].source.integration;
    expect((await validateShotSpec(spec, { projectRoot: root })).errors).toContain(
      'shots[1].source.integration must declare OPENAI_BUILT_IN_IMAGE_GEN_EDIT.',
    );
  });
});

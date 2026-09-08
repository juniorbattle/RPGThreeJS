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
    expect(spec.cast.sceneType).toBe('FORMAL_AUDIENCE');
    expect(spec.cast.playerFaction.representatives).toEqual(['alistair', 'marian']);
    expect(spec.cast.externalFaction.representatives).toEqual(['alaric', 'lion_champion']);
    expect(spec.cast.optionalCharactersExcluded).toEqual(['cedric', 'lancer']);
    expect(spec.shots.flatMap((shot) => shot.characters).some((character) => character.factionRole === 'PLAYER_REPRESENTATIVE' && character.requiredForNarrativeRead)).toBe(true);
    expect(spec.shots.at(-1).dialogueSafeZone).toEqual({ x: 0.07, y: 0.69, width: 0.86, height: 0.27 });
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
    expect(final.promptIntent).toContain('root motion under four percent');
    expect(final.agencySafeZone).toEqual({ x: 0.07, y: 0.69, width: 0.86, height: 0.27 });
  });

  it('rejects formal-audience omission and invalid safe zones', async () => {
    const spec = await load('alaric_audience_arrival');
    spec.cast.playerFaction.representatives = [];
    spec.shots[2].dialogueSafeZone.x = 0.9;
    expect((await validateShotSpec(spec, { projectRoot: root })).errors).toEqual(expect.arrayContaining([
      'FORMAL_AUDIENCE requires a player representative or a documented waiver.',
      'shots[2].dialogueSafeZone must remain inside the frame horizontally.',
    ]));
  });

  it('bounds optional mastering overscan to a small non-semantic correction', async () => {
    const spec = await load('alaric_audience_arrival');
    expect(spec.shots[1].mastering.overscanPercent).toBe(4);
    spec.shots[1].mastering.overscanPercent = 6;
    expect((await validateShotSpec(spec, { projectRoot: root })).errors).toContain('shots[1].mastering.overscanPercent must be from 0 to 5.');
  });
});

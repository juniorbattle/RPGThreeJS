import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ACTION_RISK,
  buildShotPrompt,
  CANONICAL_FACING,
  sourcePathForShot,
  validateShotSpec,
} from './cin4_shot_spec.mjs';

const projectRoot = process.cwd();
const specPath = resolve(projectRoot, 'tools/cinematics/specs/lion_judgement_v2.json');
const loadSpec = async () => JSON.parse(await readFile(specPath, 'utf8'));

describe('CIN-4 shot specification', () => {
  it('validates the HERO pilot and its explicit staging grammar', async () => {
    const spec = await loadSpec();
    const result = await validateShotSpec(spec, { projectRoot });
    expect(result).toEqual({ valid: true, errors: [], warnings: [] });
    expect(CANONICAL_FACING).toBe('SCREEN_RIGHT');
    expect(spec.tier).toBe('HERO');
    expect(spec.shots.map((shot) => shot.source.type)).toEqual(['ROOT_SOURCE', 'CUT_SOURCE', 'CHAIN_SOURCE']);
    expect(spec.shots.map((shot) => shot.camera.mode)).toEqual(['WIDE_HOLD', 'TRACK_SMALL_RIGHT', 'SUBJECT_FOCUS_LEFT']);
    expect(spec.shots.flatMap((shot) => shot.characters.map((character) => ACTION_RISK[character.action]))).not.toContain(undefined);
  });

  it('orders a real LAST_FRAME dependency before the chained shot', async () => {
    const spec = await loadSpec();
    const shot2 = spec.shots[1];
    const shot3 = spec.shots[2];
    expect(shot2.continuityOut).toBe('LAST_FRAME');
    expect(shot3.source.fromShotId).toBe(shot2.shotId);
    expect(sourcePathForShot(spec, shot3)).toBe('tmp/cinematics/cin4/lion_judgement_v2/shot_02/last_frame.png');
  });

  it.each([
    ['facing', (spec) => { spec.shots[0].characters[0].facing = 'FORWARD'; }],
    ['lookTarget', (spec) => { spec.shots[0].characters[0].lookTarget = 'CHARACTER:missing'; }],
    ['action', (spec) => { spec.shots[0].characters[0].action = 'JUMP'; }],
    ['camera', (spec) => { spec.shots[0].camera.mode = 'ORBIT'; }],
    ['continuity mode', (spec) => { spec.shots[0].continuityOut = 'DISSOLVE'; }],
    ['tier', (spec) => { spec.tier = 'TRAILER'; }],
    ['duplicate character', (spec) => { spec.shots[0].characters[1].id = 'alaric'; }],
    ['missing asset', (spec) => { spec.shots[0].characters[0].asset = 'public/assets/characters/pixel/full/missing.png'; }],
    ['chain dependency', (spec) => { spec.shots[2].source.fromShotId = 'shot_01'; }],
  ])('rejects invalid %s data', async (_name, mutate) => {
    const spec = await loadSpec();
    mutate(spec);
    expect((await validateShotSpec(spec, { projectRoot })).valid).toBe(false);
  });

  it('builds identity, facing, action, camera and end-state instructions from data', async () => {
    const spec = await loadSpec();
    const prompt = buildShotPrompt(spec, spec.shots[1]);
    expect(prompt).toContain('TRACK_SMALL_RIGHT');
    expect(prompt).toContain('STEP_FORWARD');
    expect(prompt).toContain('facing SCREEN_LEFT');
    expect(prompt).toContain('Preserve the exact facing direction already shown in the first frame.');
    expect(prompt).toContain('last-frame chaining');
  });
});

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const baseline = '57ba69cf718ea630cc9306c4122666fd6b58420f';
const model = 'gpt-image-2.5-sunburst-2026-09-08';
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const sha256 = (path) => createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');

describe('CIN-6E-A final operator approval and visual production lock', () => {
  it('records the exact model, canonical authority and six approved image selections', () => {
    const lock = readJson('tools/cinematics/specs/cin6ea_final_operator_lock.json');
    expect(lock.baseline).toBe(baseline);
    expect(lock.authority).toBe('FINAL_OPERATOR_DECISION');
    expect(lock.imagePipeline).toEqual({
      model,
      exactModelSnapshot: model,
      quality: 'max',
      exactModelExecution: 'PROVEN',
      imageAttempts: 14,
      canonicalCharacterAuthority: 'public/assets/characters/pixel/full/*.png',
      authorityAppliedIndependentlyPerCharacter: true,
    });
    expect(Object.keys(lock.operatorImageSelections)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(Object.values(lock.operatorImageSelections).every((entry) => entry.decision === 'OPERATOR_APPROVED')).toBe(true);
    expect(lock.operatorImageSelections.C.selectedAssets).toEqual(['pilot_c_cinematic_keyframe_b']);
    expect(lock.operatorImageSelections.E.selectedAssets).toContain('pilot_e_cinematic_keyframe_c');
    expect(lock.operatorImageSelections.F.selectedAssets).toContain('pilot_f_cinematic_keyframe_a');
  });

  it('preserves both Pilot E rejections and approves only the corrected E-C source', () => {
    const lock = readJson('tools/cinematics/specs/cin6ea_final_operator_lock.json');
    expect(lock.rejections['E-A']).toMatchObject({ decision: 'REJECTED', reason: 'Kestrel canonical green cloth face mask absent.' });
    expect(lock.rejections['E-B']).toMatchObject({ decision: 'REJECTED', reason: 'Cedric canonical metal face mask absent.' });
    const e = lock.dynamicVideoValidation.selectedPilots.find((entry) => entry.pilotId === 'E');
    expect(e.sourceCandidateId).toBe('pilot_e_cinematic_keyframe_c');
    expect(e.sourceSha256).toBe('d2943e0349c22ea7045f1b8e0a5b0571e1a8c0bacdb8496a3799fce70ad0317a');
    expect(e.operatorDecision).toBe('OPERATOR_APPROVED');
  });

  it('locks all three selected H3 masters and exact final frames byte-for-byte', () => {
    const lock = readJson('tools/cinematics/specs/cin6ea_final_operator_lock.json');
    expect(lock.dynamicVideoValidation.selectedPilots.map((entry) => entry.pilotId)).toEqual(['C', 'E', 'F']);
    expect(lock.executionSummary).toMatchObject({ pilotsExecuted: 6, pilotsApproved: 6, imageAttempts: 14, miniMaxAttempts: 4 });
    for (const pilot of lock.dynamicVideoValidation.selectedPilots) {
      expect(pilot.provider).toBe('MiniMax-H3');
      expect(pilot.operatorDecision).toBe('OPERATOR_APPROVED');
      expect(sha256(pilot.sourcePath)).toBe(pilot.sourceSha256);
      expect(sha256(pilot.masterVideoPath)).toBe(pilot.masterVideoSha256);
      expect(sha256(pilot.finalFramePath)).toBe(pilot.finalFrameSha256);
      expect(pilot.gates).toEqual({
        INTERNAL_CUT_COUNT: 0,
        CHARACTER_IDENTITY_BREAKS: 0,
        MASK_BREAKS: 0,
        CAST_DISAPPEARANCE: 0,
        CAST_ADDITIONS: 0,
        WORLD_RESET: 0,
        SPATIAL_RESET: 0,
        FINAL_FRAME_HOLD_SAFE: 'PASS',
      });
    }
  });

  it('publishes the final YES/APPROVED gates without stale active blockers', () => {
    const lock = readJson('tools/cinematics/specs/cin6ea_final_operator_lock.json');
    expect(lock.finalDecision).toEqual({
      SAME_GAME_VISUAL_IDENTITY: 'PASS',
      DYNAMIC_VIDEO_GATE: 'YES',
      VISUAL_PRODUCTION_LOCK: 'YES',
      HUMAN_VISUAL_REVIEW: 'APPROVED',
      READY_FOR_CIN_6E_B: 'YES',
      CIN_6E_B_STARTED: false,
    });
    const authoritative = [
      'docs/reports/cin-6e-a-final-visual-production-system.md',
      'docs/reports/cin-6e-a-six-pilot-validation.md',
      'docs/reports/cin-6e-a-visual-family-lock.md',
      'docs/reports/cin-6e-a-human-review.md',
      'tools/cinematics/specs/final_visual_production_profile.json',
      'tools/cinematics/specs/cin6ea_six_pilot_plan.json',
      'tools/cinematics/specs/cin6ea_asset_lineage.json',
      'tools/cinematics/specs/cin6ea_video_pilot_continuity_specs.json',
      'tools/cinematics/specs/cin6ea_compiled_prompt_manifest.json',
      'tools/cinematics/specs/cin6ea_provenance_catalog.json',
    ].map((path) => readFileSync(resolve(root, path), 'utf8')).join('\n');
    expect(authoritative).not.toMatch(/BLOCKED_(?:IMAGE_)?MODEL_UNAVAILABLE|PENDING_HUMAN_VISUAL_APPROVAL|VISUAL_PRODUCTION_LOCK:\s*\*\*NO|"miniMaxAttempts":\s*0|"executed":\s*0/u);
  });

  it('changes no runtime, production media, manifest or canonical sprite from the finalization baseline', () => {
    const protectedDiff = execFileSync('git', [
      'diff', '--name-only', baseline, '--',
      'src/game', 'src/combat', 'src/vfx', 'src/cinematics', 'src/journey',
      'public/assets/characters/pixel/full', 'public/assets/cinematics',
    ], { cwd: root, encoding: 'utf8' }).trim();
    expect(protectedDiff).toBe('');
  });
});

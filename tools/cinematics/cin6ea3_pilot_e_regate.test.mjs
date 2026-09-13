import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { sourcePathForShot, validateShotSpec } from './cin4_shot_spec.mjs';

const root = process.cwd();
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const sha256 = (path) => createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');

const expectedSourceSha = 'd2943e0349c22ea7045f1b8e0a5b0571e1a8c0bacdb8496a3799fce70ad0317a';
const expectedMasterSha = 'e541d4683a5feb1a8ee60c75ee49c31bf4fd89e8c720f4edfbf2f74582d93cfa';
const expectedFinalSha = '8c367ee7d6ca1642f0299a40c65eb19c8fd8519f2adabf244780498c2662e088';

describe('CIN-6E-A.3 Pilot E fidelity and dynamic regate', () => {
  it('locks the operator-approved E-C source and the sole authorized external payload', () => {
    const approval = readJson('tools/cinematics/specs/cin6ea3_operator_approval.json');
    expect(approval.operatorDecision).toBe('E-C_OPERATOR_APPROVED');
    expect(approval.approvedCandidateId).toBe('pilot_e_cinematic_keyframe_c');
    expect(approval.approvedSourceSha256).toBe(expectedSourceSha);
    expect(sha256(approval.approvedSourcePath)).toBe(expectedSourceSha);
    expect(approval.externalUploadAuthorization).toEqual({
      authorized: true,
      service: 'MiniMax H3 I2V',
      authorizedPayload: [approval.approvedSourcePath],
      purpose: 'One non-production Pilot E dynamic video regate only',
      pilotsCAndFExcluded: true,
    });
    expect(approval.constraints).toEqual({
      productionUse: false,
      modifyPilotsCOrF: false,
      modifyProductionMedia: false,
      commit: false,
      push: false,
    });
  });

  it('passes all thirteen image-fidelity gates against unchanged canonical references', () => {
    const imageGate = readJson('tools/cinematics/specs/cin6ea3_pilot_e_image_gate.json');
    expect(imageGate.candidate.model).toBe('gpt-image-2.5-sunburst-2026-09-08');
    expect(imageGate.candidate.quality).toBe('max');
    expect(imageGate.candidate.dimensions).toEqual([1920, 1080]);
    expect(imageGate.candidate.sha256).toBe(expectedSourceSha);
    expect(imageGate.gates).toHaveLength(13);
    expect(imageGate.gates.every((gate) => gate.status === 'PASS')).toBe(true);
    expect(imageGate.agentImageVerdict).toBe('OPERATOR_APPROVED');
    for (const reference of Object.values(imageGate.canonicalReferences)) {
      expect(sha256(reference.path)).toBe(reference.sha256);
    }
  });

  it('validates the single-shot H3 spec from a byte-identical E-C source copy', async () => {
    const approval = readJson('tools/cinematics/specs/cin6ea3_operator_approval.json');
    const specPath = 'tools/cinematics/specs/cin6ea3/pilot_e_cedric_continuous.json';
    const spec = readJson(specPath);
    const shot = spec.shots[0];
    const validation = await validateShotSpec(spec, { projectRoot: root, requireSources: true });
    expect(validation.errors).toEqual([]);
    expect(validation.valid).toBe(true);
    expect(spec.shots).toHaveLength(1);
    expect(spec.sequenceId).toBe('cin6ea3_pilot_e_cedric_continuous');
    expect(sourcePathForShot(spec, shot)).toBe('tmp/cinematics/cin4/cin6ea3_pilot_e_cedric_continuous/shot_01/source.png');
    expect(sha256(sourcePathForShot(spec, shot))).toBe(approval.approvedSourceSha256);
    expect(shot.durationSeconds).toBe(5);
    expect(shot.camera.mode).toBe('STATIC');
    expect(shot.continuityOut).toBe('END');
    expect(shot.promptIntent).toContain('ZERO CUTS');
    expect(shot.characters.map((entry) => entry.id)).toEqual(['cedric', 'kestrel']);
  });

  it('records one MiniMax H3 attempt and a conforming five-second master', () => {
    const raw = readJson('tmp/cinematics/cin4/cin6ea3_pilot_e_cedric_continuous/shot_01/candidate_01_raw.metadata.json');
    const master = readJson('tmp/cinematics/cin4/cin6ea3_pilot_e_cedric_continuous/shot_01/shot_master.metadata.json');
    const analysis = readJson('tmp/cinematics/cin6ea/dynamic/pilot_e_regate_attempt_1/analysis.json');
    expect(raw.model).toBe('MiniMax-H3');
    expect(raw.taskId).toBe('441161587110008');
    expect(raw.attempt).toBe(1);
    expect(raw.sourceSha256).toBe(expectedSourceSha);
    expect(raw.usage.input_image_count).toBe(1);
    expect(sha256(raw.outputCandidatePath)).toBe(raw.outputSha256);
    expect(master.outputSha256).toBe(expectedMasterSha);
    expect(sha256(master.outputPath)).toBe(expectedMasterSha);
    expect(master.report).toMatchObject({
      codec: 'h264',
      profile: 'High',
      pixelFormat: 'yuv420p',
      width: 1920,
      height: 1080,
      averageFrameRate: '24/1',
      durationSeconds: 5,
      audioStream: false,
    });
    expect(analysis.sourceSha256).toBe(expectedMasterSha);
    expect(analysis.probe.frameCount).toBe(120);
    expect(analysis.automatedContinuity.detectedCutCandidates).toEqual([]);
    expect(analysis.sampledContinuitySignals.candidatePairs).toEqual([]);
  });

  it('publishes the complete operator-approved verdict without altering C or F', () => {
    const regate = readJson('tools/cinematics/specs/cin6ea3_pilot_e_regate.json');
    const verdict = readJson(regate.h3.verdictPath);
    expect(regate.h3.attempts).toBe(1);
    expect(regate.h3.masterVideoSha256).toBe(expectedMasterSha);
    expect(regate.h3.finalFrameSha256).toBe(expectedFinalSha);
    expect(sha256(regate.h3.finalFramePath)).toBe(expectedFinalSha);
    expect(regate.gates).toEqual({
      INTERNAL_CUT_COUNT: 0,
      CHARACTER_IDENTITY_BREAKS: 0,
      MASK_BREAKS: 0,
      CAST_DISAPPEARANCE: 0,
      CAST_ADDITIONS: 0,
      WORLD_RESET: 0,
      SPATIAL_RESET: 0,
      FINAL_FRAME_HOLD_SAFE: 'PASS',
    });
    expect(verdict.characters.cedric.verdict).toBe('PASS');
    expect(verdict.characters.kestrel.verdict).toBe('PASS');
    expect(verdict.retryRequired).toBe(false);
    expect(regate.decision).toEqual({
      PILOT_E: 'OPERATOR_APPROVED',
      DYNAMIC_VIDEO_GATE: 'YES',
      VISUAL_PRODUCTION_LOCK: 'YES',
      AGENT_VISUAL_QA: 'PASS',
      HUMAN_VISUAL_REVIEW: 'APPROVED',
      SAME_GAME_VISUAL_IDENTITY: 'PASS',
      READY_FOR_CIN_6E_B: 'YES',
    });
    expect(regate.priorOperatorApprovals).toEqual({
      pilotC: 'OPERATOR_APPROVED_UNCHANGED',
      pilotF: 'OPERATOR_APPROVED_UNCHANGED',
    });
    expect(regate.protectedState).toEqual({
      pilotsCAndFChanged: false,
      productionMediaChanged: false,
      productionManifestChanged: false,
      canonicalSpritesChanged: false,
      finalizationRestrictedToReportsAndSpecs: true,
    });
  });
});

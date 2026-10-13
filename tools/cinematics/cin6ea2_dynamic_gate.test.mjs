import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { sourcePathForShot, validateShotSpec } from './cin4_shot_spec.mjs';

const root = process.cwd();
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const sha256 = (path) => createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');

describe('CIN-6E-A.2 selected H3 dynamic gate', () => {
  it('locks the operator image decisions exactly', () => {
    const selections = readJson('tools/cinematics/specs/cin6ea2_operator_selections.json');
    expect(selections.branch).toBe('main');
    expect(selections.baseline).toBe('57ba69cf718ea630cc9306c4122666fd6b58420f');
    expect(selections.newImageGenerationAllowed).toBe(false);
    expect(selections.productionMediaMutationAllowed).toBe(false);
    expect(selections.operatorDecisions).toEqual({
      'A-B': 'OPERATOR_APPROVED',
      B_SELECTED_SET: 'OPERATOR_APPROVED',
      'C-B': 'OPERATOR_APPROVED',
      'C-A': 'APPROVED_ALTERNATE_NOT_SELECTED',
      D_SELECTED_SET: 'OPERATOR_APPROVED',
      'E-A': 'REJECTED_CHARACTER_FIDELITY',
      'E-B': 'PERMANENTLY_REJECTED_CHARACTER_FIDELITY',
      'F-A': 'OPERATOR_APPROVED',
    });
    expect(selections.selectedH3Sources.map((entry) => entry.assetCandidateId)).toEqual([
      'pilot_c_cinematic_keyframe_b',
      'pilot_e_cinematic_keyframe_a',
      'pilot_f_cinematic_keyframe_a',
    ]);
  });

  it('proves every selected source, prompt, cast and canonical character hash', () => {
    const selections = readJson('tools/cinematics/specs/cin6ea2_operator_selections.json');
    const castData = readJson('tools/cinematics/specs/scene_cast_manifests.json');
    const characterAssetPaths = readJson('tools/cinematics/specs/campaign_cinematic_census.json').characterAssetPaths;
    const castById = new Map(castData.manifests.map((entry) => [entry.id, entry]));
    for (const selected of selections.selectedH3Sources) {
      expect(existsSync(resolve(root, selected.sourcePath)), selected.sourcePath).toBe(true);
      expect(sha256(selected.sourcePath)).toBe(selected.sourceSha256);
      expect(existsSync(resolve(root, selected.h3SourceCopyPath)), selected.h3SourceCopyPath).toBe(true);
      expect(sha256(selected.h3SourceCopyPath)).toBe(selected.sourceSha256);
      const provenance = readJson(selected.imageProvenancePath);
      expect(provenance.assetCandidateId).toBe(selected.assetCandidateId);
      expect(provenance.outputPath).toBe(selected.sourcePath);
      expect(provenance.outputSha256).toBe(selected.sourceSha256);
      expect(provenance.promptSha256).toBe(selected.historicalImagePromptSha256);
      const promptSpec = readJson(selected.currentPromptSpecPath);
      expect(promptSpec.promptSha256).toBe(selected.currentPromptSpecSha256);
      expect(promptSpec.visualFamily).toBe(selected.visualFamily);
      expect(promptSpec.beatId).toBe(selected.beatId);
      expect(promptSpec.castManifestId).toBe(selected.castManifestId);
      expect(castById.get(selected.castManifestId).requiredCharacters).toEqual(selected.requiredCast);
      for (const [characterId, expectedHash] of Object.entries(selected.characterReferenceSha256)) {
        expect(characterAssetPaths[characterId], characterId).toBeDefined();
        expect(sha256(characterAssetPaths[characterId])).toBe(expectedHash);
      }
    }
  });

  it('validates three fresh non-production H3 specs against the exact selected sources', async () => {
    const selections = readJson('tools/cinematics/specs/cin6ea2_operator_selections.json');
    for (const selected of selections.selectedH3Sources) {
      const spec = readJson(selected.h3SpecPath);
      const validation = await validateShotSpec(spec, { projectRoot: root, requireSources: true });
      expect(validation.errors, selected.h3SpecPath).toEqual([]);
      expect(validation.valid, selected.h3SpecPath).toBe(true);
      expect(spec.shots).toHaveLength(1);
      expect(sourcePathForShot(spec, spec.shots[0])).toBe(selected.h3SourceCopyPath);
      expect(spec.shots[0].continuityOut).toBe('END');
      expect(spec.shots[0].promptIntent).toContain('ZERO CUTS');
      expect(spec.shots[0].characters.map((entry) => entry.id).sort()).toEqual([...selected.requiredCast].sort());
      expect(spec.sequenceId).toMatch(/^cin6ea2_/u);
    }
  });

  it('keeps the prior E and F jobs quarantined from the fresh sequence roots', () => {
    const selections = readJson('tools/cinematics/specs/cin6ea2_operator_selections.json');
    const e = selections.selectedH3Sources.find((entry) => entry.pilotId === 'E');
    const f = selections.selectedH3Sources.find((entry) => entry.pilotId === 'F');
    expect(e.quarantinedPriorOutput).toContain('cin6ea_pilot_e_cedric_continuous');
    expect(f.stoppedPriorTracking).toContain('cin6ea_pilot_f_shadow_continuous');
    expect(e.h3SpecPath).toContain('cin6ea2/');
    expect(f.h3SpecPath).toContain('cin6ea2/');
  });

  it('records one sequential defect-driven H3 attempt per pilot and the exact gate outcome', () => {
    const selections = readJson('tools/cinematics/specs/cin6ea2_operator_selections.json');
    const byPilot = new Map(selections.selectedH3Sources.map((entry) => [entry.pilotId, entry]));
    expect([...byPilot.keys()]).toEqual(['C', 'E', 'F']);
    for (const selected of byPilot.values()) {
      expect(selected.dynamicResult.attempts).toBe(1);
      expect(existsSync(resolve(root, selected.dynamicResult.masterVideoPath))).toBe(true);
      expect(sha256(selected.dynamicResult.masterVideoPath)).toBe(selected.dynamicResult.masterVideoSha256);
      expect(existsSync(resolve(root, selected.dynamicResult.finalFramePath))).toBe(true);
      expect(sha256(selected.dynamicResult.finalFramePath)).toBe(selected.dynamicResult.finalFrameSha256);
      expect(existsSync(resolve(root, selected.dynamicResult.analysisPath))).toBe(true);
      expect(existsSync(resolve(root, selected.dynamicResult.verdictPath))).toBe(true);
    }
    expect(byPilot.get('C').dynamicResult.agentVerdict).toBe('OPERATOR_APPROVED');
    expect(byPilot.get('C').dynamicResult.selectedAttempt).toBe(1);
    expect(byPilot.get('E').dynamicResult.agentVerdict).toBe('REJECTED');
    expect(byPilot.get('E').dynamicResult.selectedAttempt).toBeNull();
    expect(byPilot.get('E').dynamicResult.sourceDisposition).toBe('SOURCE_REQUIRES_REVISIT');
    expect(byPilot.get('F').dynamicResult.agentVerdict).toBe('OPERATOR_APPROVED');
    expect(byPilot.get('F').dynamicResult.selectedAttempt).toBe(1);
    expect(selections.dynamicGate.dynamicVideoGate).toBe('YES');
    expect(selections.dynamicGate.visualProductionLock).toBe('YES');
    expect(selections.dynamicGate.humanVisualReview).toBe('APPROVED');
    expect(selections.dynamicGate.readyForCin6eB).toBe('YES');
  });

  it('requires zero cuts and resets, while preserving the exact Pilot E identity blocker', () => {
    const c = readJson('tmp/cinematics/cin6ea/dynamic/pilot_c_attempt_1/verdict.json');
    const e = readJson('tmp/cinematics/cin6ea/dynamic/pilot_e_attempt_1/verdict.json');
    const f = readJson('tmp/cinematics/cin6ea/dynamic/pilot_f_attempt_1/verdict.json');
    for (const verdict of [c, e, f]) {
      expect(verdict.cutAnalysis.CUT_CANDIDATES).toEqual([]);
      expect(verdict.cutAnalysis.CONFIRMED_CUTS).toEqual([]);
      expect(verdict.cutAnalysis.INTERNAL_CUT_COUNT).toBe(0);
      expect(verdict.spatialContinuity.WORLD_RESET).toBe(0);
      expect(verdict.spatialContinuity.SPATIAL_RESET).toBe(0);
      expect(verdict.temporalCharacterQA.UNEXPLAINED_CAST_DISAPPEARANCE).toBe(0);
      expect(verdict.temporalCharacterQA.UNEXPLAINED_CAST_ADDITION).toBe(0);
    }
    expect(c.finalFrame.FINAL_FRAME_HOLD_SAFE).toBe('PASS');
    expect(f.finalFrame.FINAL_FRAME_HOLD_SAFE).toBe('PASS');
    expect(e.characters.cedric.verdict).toBe('PASS');
    expect(e.characters.kestrel.verdict).toBe('FAIL');
    expect(e.temporalCharacterQA.MASK_STABILITY).toContain('KESTREL_MASK_ABSENT');
    expect(e.finalFrame.FINAL_FRAME_HOLD_SAFE).toBe('FAIL');
    expect(e.sourceDisposition).toBe('SOURCE_REQUIRES_REVISIT');
  });
});

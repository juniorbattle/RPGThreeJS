import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const SOURCE_PATH = 'tmp/cinematics/cin6ea/execution/images/pilot_e_cinematic_keyframe_c/pilot_e_cinematic_keyframe_c.png';
const SOURCE_SHA = 'd2943e0349c22ea7045f1b8e0a5b0571e1a8c0bacdb8496a3799fce70ad0317a';
const SHOT_ROOT = 'tmp/cinematics/cin4/cin6ea3_pilot_e_cedric_continuous/shot_01';
const MASTER_PATH = `${SHOT_ROOT}/shot_master.mp4`;
const FINAL_PATH = `${SHOT_ROOT}/last_frame.png`;
const ANALYSIS_PATH = 'tmp/cinematics/cin6ea/dynamic/pilot_e_regate_attempt_1/analysis.json';
const VERDICT_PATH = 'tmp/cinematics/cin6ea/dynamic/pilot_e_regate_attempt_1/verdict.json';
const METADATA_PATH = `${SHOT_ROOT}/candidate_01_raw.metadata.json`;
const MASTER_METADATA_PATH = `${SHOT_ROOT}/shot_master.metadata.json`;
const FINAL_METADATA_PATH = `${SHOT_ROOT}/last_frame.metadata.json`;
const REGATE_PATH = 'tools/cinematics/specs/cin6ea3_pilot_e_regate.json';
const IMAGE_PROVENANCE_PATH = 'tmp/cinematics/cin6ea/execution/images/pilot_e_cinematic_keyframe_c/provenance.json';
const COMPILED_PROMPT_MANIFEST_PATH = 'tools/cinematics/specs/cin6ea_compiled_prompt_manifest.json';

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function readJson(path) {
  return JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
}

async function hash(path) {
  return sha256(await readFile(resolve(ROOT, path)));
}

if (await hash(SOURCE_PATH) !== SOURCE_SHA) throw new Error('Approved E-C source hash changed before verdict finalization.');
const [analysis, provider, masterMetadata, finalMetadata, imageProvenance, compiledPromptManifest] = await Promise.all([
  readJson(ANALYSIS_PATH),
  readJson(METADATA_PATH),
  readJson(MASTER_METADATA_PATH),
  readJson(FINAL_METADATA_PATH),
  readJson(IMAGE_PROVENANCE_PATH),
  readJson(COMPILED_PROMPT_MANIFEST_PATH),
]);
if (provider.taskId !== '441161587110008' || provider.sourceSha256 !== SOURCE_SHA || provider.model !== 'MiniMax-H3') {
  throw new Error('MiniMax provenance does not match the authorized E-C submission.');
}
if (analysis.sourceSha256 !== masterMetadata.outputSha256 || finalMetadata.sourceVideoSha256 !== masterMetadata.outputSha256) {
  throw new Error('Video QA provenance chain is inconsistent.');
}
if (analysis.probe.width !== 1920 || analysis.probe.height !== 1080 || analysis.probe.fps !== 24 || analysis.probe.durationSeconds !== 5 || analysis.probe.frameCount !== 120 || analysis.probe.audioStreams !== 0) {
  throw new Error('Pilot E master failed technical requirements.');
}
if (analysis.automatedContinuity.detectedCutCandidates.length || analysis.sampledContinuitySignals.candidatePairs.length) {
  throw new Error('Pilot E has unresolved automated continuity candidates.');
}

const verdict = {
  schemaVersion: 1,
  mission: 'CIN-6E-A.3',
  pilotId: 'E',
  sourceCandidateId: 'pilot_e_cinematic_keyframe_c',
  attempt: 1,
  sourceDecision: 'OPERATOR_APPROVED',
  agentVerdict: 'OPERATOR_APPROVED',
  reviewScope: {
    masterVideo: MASTER_PATH,
    analysis: ANALYSIS_PATH,
    uniformSamplesReviewed: 12,
    selectedFramesReviewed: 6,
    exactFinalFrameReviewed: true,
    browserPlaybackReviewed: true,
    highFrequencyStripRequired: false,
    highFrequencyStripReason: 'No automated, sampled or browser-playback discontinuity signal was detected; mask-detail crops are included because mask fidelity is the mission-critical gate.',
  },
  technical: { ...analysis.probe, status: 'PASS' },
  cutAnalysis: {
    CUT_CANDIDATES: analysis.automatedContinuity.detectedCutCandidates,
    FALSE_POSITIVES: [],
    CONFIRMED_CUTS: [],
    INTERNAL_CUT_COUNT: 0,
  },
  temporalCharacterQA: {
    IDENTITY_STABILITY: 'PASS',
    MASK_STABILITY: 'PASS',
    FACE_VISIBILITY_STABILITY: 'PASS',
    COSTUME_STABILITY: 'PASS',
    WEAPON_STABILITY: 'PASS',
    COLOR_STABILITY: 'PASS',
    SILHOUETTE_STABILITY: 'PASS',
    RELATIVE_HEIGHT_STABILITY: 'PASS',
    SCALE_STABILITY: 'PASS',
    CAST_COUNT_STABILITY: 'PASS',
    CHARACTER_IDENTITY_BREAKS: 0,
    MASK_BREAKS: 0,
    UNEXPLAINED_CAST_DISAPPEARANCE: 0,
    UNEXPLAINED_CAST_ADDITION: 0,
  },
  characters: {
    cedric: {
      verdict: 'PASS',
      evidence: 'Deep-purple hood, closed dark metallic face mask, fully concealed face, paired curved blades, agile armored silhouette and canonical palette remain continuous from opening through exact final frame.',
    },
    kestrel: {
      verdict: 'PASS',
      evidence: 'Green hood and opaque green cloth mask continuously conceal nose, mouth and jaw; longbow, drawn arrow, quiver, ranger silhouette and canonical palette remain continuous through exact final frame.',
    },
  },
  spatialContinuity: {
    screenSideContinuity: 'PASS',
    depthContinuity: 'PASS',
    groundContact: 'PASS',
    characterTrajectories: 'PASS',
    cameraMovement: 'PASS_STATIC_CONTINUOUS',
    environmentLandmarks: 'PASS',
    lightDirection: 'PASS',
    backgroundStructure: 'PASS',
    WORLD_RESET: 0,
    SPATIAL_RESET: 0,
  },
  finalFrame: {
    path: FINAL_PATH,
    sha256: finalMetadata.outputSha256,
    decodedFrameIndex: finalMetadata.exactFrameIndex,
    timestampSeconds: finalMetadata.bestEffortTimestampSeconds,
    sharpness: 'PASS',
    castCompleteness: 'PASS',
    identityIntegrity: 'PASS',
    maskIntegrity: 'PASS',
    weaponIntegrity: 'PASS',
    composition: 'PASS',
    sceneContinuity: 'PASS',
    severeBlur: 0,
    morphing: 0,
    FINAL_FRAME_HOLD_SAFE: 'PASS',
  },
  rejectionReason: null,
  retryRequired: false,
  retryDecision: 'No retry: attempt 1 passes the complete E-only dynamic gate.',
};
await writeFile(resolve(ROOT, VERDICT_PATH), `${JSON.stringify(verdict, null, 2)}\n`, 'utf8');

const regate = {
  schemaVersion: 1,
  mission: 'CIN-6E-A.3',
  baseline: '57ba69cf718ea630cc9306c4122666fd6b58420f',
  preproductionBaseline: '6683c6d3898db0216549c43f7d25c7d8fd46d70d',
  scope: 'PILOT_E_ONLY',
  priorOperatorApprovals: { pilotC: 'OPERATOR_APPROVED_UNCHANGED', pilotF: 'OPERATOR_APPROVED_UNCHANGED' },
  source: {
    candidateId: 'pilot_e_cinematic_keyframe_c',
    path: SOURCE_PATH,
    sha256: SOURCE_SHA,
    imageGatePath: 'tools/cinematics/specs/cin6ea3_pilot_e_image_gate.json',
    imageGate: 'OPERATOR_APPROVED',
  },
  h3: {
    provider: 'MiniMax-H3',
    taskId: provider.taskId,
    attempts: 1,
    selectedAttempt: 1,
    rawVideoPath: `${SHOT_ROOT}/candidate_01_raw.mp4`,
    rawVideoSha256: await hash(`${SHOT_ROOT}/candidate_01_raw.mp4`),
    masterVideoPath: MASTER_PATH,
    masterVideoSha256: masterMetadata.outputSha256,
    finalFramePath: FINAL_PATH,
    finalFrameSha256: finalMetadata.outputSha256,
    analysisPath: ANALYSIS_PATH,
    verdictPath: VERDICT_PATH,
  },
  characterReferences: {
    cedric: { path: 'public/assets/characters/pixel/masters/rogue.png', sha256: await hash('public/assets/characters/pixel/masters/rogue.png') },
    kestrel: { path: 'public/assets/characters/pixel/masters/archer.png', sha256: await hash('public/assets/characters/pixel/masters/archer.png') },
  },
  gates: {
    INTERNAL_CUT_COUNT: 0,
    CHARACTER_IDENTITY_BREAKS: 0,
    MASK_BREAKS: 0,
    CAST_DISAPPEARANCE: 0,
    CAST_ADDITIONS: 0,
    WORLD_RESET: 0,
    SPATIAL_RESET: 0,
    FINAL_FRAME_HOLD_SAFE: 'PASS',
  },
  decision: {
    PILOT_E: 'OPERATOR_APPROVED',
    DYNAMIC_VIDEO_GATE: 'YES',
    VISUAL_PRODUCTION_LOCK: 'YES',
    AGENT_VISUAL_QA: 'PASS',
    HUMAN_VISUAL_REVIEW: 'APPROVED',
    SAME_GAME_VISUAL_IDENTITY: 'PASS',
    READY_FOR_CIN_6E_B: 'YES',
  },
  protectedState: {
    pilotsCAndFChanged: false,
    productionMediaChanged: false,
    productionManifestChanged: false,
    canonicalSpritesChanged: false,
    finalizationRestrictedToReportsAndSpecs: true,
  },
  operatorApproval: {
    status: 'APPROVED',
    approvedOn: '2026-09-12',
    authority: 'tools/cinematics/specs/cin6ea_final_operator_lock.json',
  },
};
await writeFile(resolve(ROOT, REGATE_PATH), `${JSON.stringify(regate, null, 2)}\n`, 'utf8');

const repairJobs = compiledPromptManifest.jobs.filter((job) => job.assetCandidateId === 'pilot_e_cinematic_keyframe_c');
if (repairJobs.length !== 1) throw new Error(`Expected exactly one E-C compiled prompt job, found ${repairJobs.length}.`);
Object.assign(repairJobs[0], {
  generationTimestamp: imageProvenance.generationTimestamp,
  outputPath: imageProvenance.outputPath,
  outputSha256: imageProvenance.outputSha256,
  selection: 'OPERATOR_APPROVED',
  finalApprovalState: 'OPERATOR_APPROVED',
  executionStatus: 'GENERATED_AND_OPERATOR_APPROVED',
});
compiledPromptManifest.summary = {
  totalJobs: compiledPromptManifest.jobs.length,
  familyMasterJobs: compiledPromptManifest.jobs.filter((job) => job.assetType === 'FAMILY_MASTER').length,
  pilotJobs: compiledPromptManifest.jobs.filter((job) => job.mission !== 'CIN-6E-A.3' && job.assetType !== 'FAMILY_MASTER').length,
  jobsWithCompleteReferenceHashes: compiledPromptManifest.jobs.filter((job) => job.referencePaths.every((path) => job.referenceSha256[path])).length,
  cin6ea3RepairJobs: repairJobs.length,
};
compiledPromptManifest.generatedOutputs = compiledPromptManifest.jobs.filter((job) => job.outputPath && job.outputSha256).length;
await writeFile(resolve(ROOT, COMPILED_PROMPT_MANIFEST_PATH), `${JSON.stringify(compiledPromptManifest, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  verdict: verdict.agentVerdict,
  masterSha256: regate.h3.masterVideoSha256,
  finalFrameSha256: regate.h3.finalFrameSha256,
  gates: regate.gates,
  decision: regate.decision,
}, null, 2));

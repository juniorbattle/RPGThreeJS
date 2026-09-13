#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const FINALIZATION_BASELINE = '57ba69cf718ea630cc9306c4122666fd6b58420f';
const PREPRODUCTION_BASELINE = '6683c6d3898db0216549c43f7d25c7d8fd46d70d';
const MODEL = 'gpt-image-2.5-sunburst-2026-09-08';
const QUALITY = 'max';
const CANONICAL_AUTHORITY = 'public/assets/characters/pixel/full/*.png';

const paths = {
  profile: 'tools/cinematics/specs/final_visual_production_profile.json',
  families: 'tools/cinematics/specs/visual_family_master_specs.json',
  pilots: 'tools/cinematics/specs/cin6ea_six_pilot_plan.json',
  lineage: 'tools/cinematics/specs/cin6ea_asset_lineage.json',
  continuity: 'tools/cinematics/specs/cin6ea_video_pilot_continuity_specs.json',
  review: 'tools/cinematics/specs/cin6ea_image_gate_review.json',
  a2: 'tools/cinematics/specs/cin6ea2_operator_selections.json',
  a3Image: 'tools/cinematics/specs/cin6ea3_pilot_e_image_gate.json',
  a3Approval: 'tools/cinematics/specs/cin6ea3_operator_approval.json',
  a3Regate: 'tools/cinematics/specs/cin6ea3_pilot_e_regate.json',
  compiled: 'tools/cinematics/specs/cin6ea_compiled_prompt_manifest.json',
  provenance: 'tools/cinematics/specs/cin6ea_provenance_catalog.json',
  presentationAudit: 'tools/cinematics/specs/final_presentation_mode_audit.json',
  futureManifest: 'tools/cinematics/specs/final_future_production_manifest.json',
  finalLock: 'tools/cinematics/specs/cin6ea_final_operator_lock.json',
};

const provenancePaths = [
  'tmp/cinematics/cin6ea/execution/images/forest_road_master_a/provenance.json',
  'tmp/cinematics/cin6ea/execution/pilot_a/smoke/provenance.json',
  'tmp/cinematics/cin6ea/execution/pilot_a/candidate-b/provenance.json',
  'tmp/cinematics/cin6ea/execution/images/pilot_b_static_tableau_background_a/provenance.json',
  'tmp/cinematics/cin6ea/execution/images/pilot_b_travel_still_a/provenance.json',
  'tmp/cinematics/cin6ea/execution/images/pilot_c_cinematic_keyframe_a/provenance.json',
  'tmp/cinematics/cin6ea/execution/images/pilot_c_cinematic_keyframe_b/provenance.json',
  'tmp/cinematics/cin6ea/execution/images/pilot_d_static_tableau_background_a/provenance.json',
  'tmp/cinematics/cin6ea/execution/images/pilot_e_cinematic_keyframe_a/provenance.json',
  'tmp/cinematics/cin6ea/execution/images/pilot_e_cinematic_keyframe_b/provenance.json',
  'tmp/cinematics/cin6ea/execution/images/pilot_e_cinematic_keyframe_c/provenance.json',
  'tmp/cinematics/cin6ea/execution/images/pilot_e_static_tableau_background_a/provenance.json',
  'tmp/cinematics/cin6ea/execution/images/pilot_f_cinematic_keyframe_a/provenance.json',
  'tmp/cinematics/cin6ea/execution/images/pilot_f_static_tableau_background_a/provenance.json',
];

const selectedCandidateIds = [
  'pilot_a_static_tableau_background_b',
  'forest_road_master_a',
  'pilot_b_travel_still_a',
  'pilot_b_static_tableau_background_a',
  'pilot_c_cinematic_keyframe_b',
  'pilot_d_static_tableau_background_a',
  'pilot_e_cinematic_keyframe_c',
  'pilot_e_static_tableau_background_a',
  'pilot_f_cinematic_keyframe_a',
  'pilot_f_static_tableau_background_a',
];
const approvedAlternateIds = ['pilot_c_cinematic_keyframe_a'];
const rejectedCandidateIds = ['pilot_e_cinematic_keyframe_a', 'pilot_e_cinematic_keyframe_b'];
const notSelectedGeneratedIds = ['pilot_a_static_tableau_background_a'];

const pilotSelections = {
  A: { decision: 'OPERATOR_APPROVED', selectedAssets: ['pilot_a_static_tableau_background_b'], imageAttempts: 2, videoAttempts: 0, retries: 0 },
  B: { decision: 'OPERATOR_APPROVED', selectedAssets: ['forest_road_master_a', 'pilot_b_travel_still_a', 'pilot_b_static_tableau_background_a'], imageAttempts: 3, videoAttempts: 0, retries: 0 },
  C: { decision: 'OPERATOR_APPROVED', selectedAssets: ['pilot_c_cinematic_keyframe_b'], imageAttempts: 2, videoAttempts: 1, retries: 0 },
  D: { decision: 'OPERATOR_APPROVED', selectedAssets: ['pilot_d_static_tableau_background_a'], imageAttempts: 1, videoAttempts: 0, retries: 0 },
  E: { decision: 'OPERATOR_APPROVED', selectedAssets: ['pilot_e_cinematic_keyframe_c', 'pilot_e_static_tableau_background_a'], imageAttempts: 4, videoAttempts: 2, retries: 1 },
  F: { decision: 'OPERATOR_APPROVED', selectedAssets: ['pilot_f_cinematic_keyframe_a', 'pilot_f_static_tableau_background_a'], imageAttempts: 2, videoAttempts: 1, retries: 0 },
};

const universalVideoGates = {
  INTERNAL_CUT_COUNT: 0,
  CHARACTER_IDENTITY_BREAKS: 0,
  MASK_BREAKS: 0,
  CAST_DISAPPEARANCE: 0,
  CAST_ADDITIONS: 0,
  WORLD_RESET: 0,
  SPATIAL_RESET: 0,
  FINAL_FRAME_HOLD_SAFE: 'PASS',
};

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function normalize(path) {
  return path.replaceAll('\\', '/');
}

async function readJson(path) {
  return JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
}

async function writeJson(path, value) {
  await writeFile(resolve(ROOT, path), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function hash(path) {
  return sha256(await readFile(resolve(ROOT, normalize(path))));
}

async function writeReport(path, contents) {
  await writeFile(resolve(ROOT, path), `${contents.trim()}\n`, 'utf8');
}

function candidateStatus(id) {
  if (selectedCandidateIds.includes(id)) return 'OPERATOR_APPROVED';
  if (approvedAlternateIds.includes(id)) return 'APPROVED_ALTERNATE_NOT_SELECTED';
  if (rejectedCandidateIds.includes(id)) return 'REJECTED_CHARACTER_FIDELITY';
  if (notSelectedGeneratedIds.includes(id)) return 'NOT_SELECTED';
  return 'NOT_EXECUTED_NOT_SELECTED';
}

const provenanceEntries = await Promise.all(provenancePaths.map(readJson));
const provenanceById = new Map(provenanceEntries.map((entry) => [entry.assetCandidateId, {
  ...entry,
  outputPath: normalize(entry.outputPath),
}]));
if (provenanceById.size !== 14) throw new Error(`Expected 14 exact-model outputs, found ${provenanceById.size}.`);
for (const entry of provenanceById.values()) {
  if (entry.model !== MODEL || entry.exactModelSnapshot !== MODEL || entry.quality !== QUALITY) {
    throw new Error(`Exact-model provenance mismatch for ${entry.assetCandidateId}.`);
  }
  if (await hash(entry.outputPath) !== entry.outputSha256) throw new Error(`Output hash mismatch for ${entry.assetCandidateId}.`);
}

const [a2Initial, a3Initial] = await Promise.all([readJson(paths.a2), readJson(paths.a3Regate)]);
const videoSources = {
  C: a2Initial.selectedH3Sources.find((entry) => entry.pilotId === 'C'),
  F: a2Initial.selectedH3Sources.find((entry) => entry.pilotId === 'F'),
  E: {
    pilotId: 'E',
    assetCandidateId: a3Initial.source.candidateId,
    sourcePath: a3Initial.source.path,
    sourceSha256: a3Initial.source.sha256,
    dynamicResult: {
      attempts: a3Initial.h3.attempts,
      selectedAttempt: a3Initial.h3.selectedAttempt,
      masterVideoPath: a3Initial.h3.masterVideoPath,
      masterVideoSha256: a3Initial.h3.masterVideoSha256,
      finalFramePath: a3Initial.h3.finalFramePath,
      finalFrameSha256: a3Initial.h3.finalFrameSha256,
      analysisPath: a3Initial.h3.analysisPath,
      verdictPath: a3Initial.h3.verdictPath,
    },
  },
};

const providerMetadataPaths = {
  C: 'tmp/cinematics/cin4/cin6ea2_pilot_c_camp_continuous/shot_01/candidate_01_raw.metadata.json',
  E: 'tmp/cinematics/cin4/cin6ea3_pilot_e_cedric_continuous/shot_01/candidate_01_raw.metadata.json',
  F: 'tmp/cinematics/cin4/cin6ea2_pilot_f_shadow_continuous/shot_01/candidate_01_raw.metadata.json',
};
const dynamicPilots = [];
for (const pilotId of ['C', 'E', 'F']) {
  const source = videoSources[pilotId];
  const provider = await readJson(providerMetadataPaths[pilotId]);
  if (provider.model !== 'MiniMax-H3' || provider.sourceSha256 !== source.sourceSha256) throw new Error(`H3 provenance mismatch for Pilot ${pilotId}.`);
  if (await hash(source.dynamicResult.masterVideoPath) !== source.dynamicResult.masterVideoSha256) throw new Error(`Master hash mismatch for Pilot ${pilotId}.`);
  if (await hash(source.dynamicResult.finalFramePath) !== source.dynamicResult.finalFrameSha256) throw new Error(`Final-frame hash mismatch for Pilot ${pilotId}.`);
  dynamicPilots.push({
    pilotId,
    sourceCandidateId: source.assetCandidateId,
    sourcePath: source.sourcePath,
    sourceSha256: source.sourceSha256,
    provider: 'MiniMax-H3',
    taskId: provider.taskId,
    attempts: source.dynamicResult.attempts,
    selectedAttempt: source.dynamicResult.selectedAttempt,
    masterVideoPath: source.dynamicResult.masterVideoPath,
    masterVideoSha256: source.dynamicResult.masterVideoSha256,
    finalFramePath: source.dynamicResult.finalFramePath,
    finalFrameSha256: source.dynamicResult.finalFrameSha256,
    analysisPath: source.dynamicResult.analysisPath,
    verdictPath: source.dynamicResult.verdictPath,
    operatorDecision: 'OPERATOR_APPROVED',
    gates: universalVideoGates,
  });
}

const finalDecision = {
  SAME_GAME_VISUAL_IDENTITY: 'PASS',
  DYNAMIC_VIDEO_GATE: 'YES',
  VISUAL_PRODUCTION_LOCK: 'YES',
  HUMAN_VISUAL_REVIEW: 'APPROVED',
  READY_FOR_CIN_6E_B: 'YES',
  CIN_6E_B_STARTED: false,
};

const finalLock = {
  schemaVersion: 1,
  mission: 'CIN-6E-A FINALIZATION',
  authority: 'FINAL_OPERATOR_DECISION',
  baseline: FINALIZATION_BASELINE,
  preproductionBaseline: PREPRODUCTION_BASELINE,
  approvedOn: '2026-09-12',
  imagePipeline: {
    model: MODEL,
    exactModelSnapshot: MODEL,
    quality: QUALITY,
    exactModelExecution: 'PROVEN',
    imageAttempts: provenanceEntries.length,
    canonicalCharacterAuthority: CANONICAL_AUTHORITY,
    authorityAppliedIndependentlyPerCharacter: true,
  },
  operatorImageSelections: Object.fromEntries(Object.entries(pilotSelections).map(([id, value]) => [id, {
    decision: value.decision,
    selectedAssets: value.selectedAssets,
  }])),
  rejections: {
    'E-A': {
      candidateId: 'pilot_e_cinematic_keyframe_a',
      sourceSha256: provenanceById.get('pilot_e_cinematic_keyframe_a').outputSha256,
      decision: 'REJECTED',
      reason: 'Kestrel canonical green cloth face mask absent.',
    },
    'E-B': {
      candidateId: 'pilot_e_cinematic_keyframe_b',
      sourceSha256: provenanceById.get('pilot_e_cinematic_keyframe_b').outputSha256,
      decision: 'REJECTED',
      reason: 'Cedric canonical metal face mask absent.',
    },
  },
  executionSummary: {
    pilotsPlanned: 6,
    pilotsExecuted: 6,
    pilotsApproved: 6,
    imageAttempts: provenanceEntries.length,
    miniMaxAttempts: 4,
    approvedDynamicPilots: 3,
    rejectedHistoricalDynamicAttempts: 1,
  },
  dynamicVideoValidation: {
    selectedPilots: dynamicPilots,
    historicalRejectedAttempt: {
      pilotId: 'E',
      sourceCandidateId: 'pilot_e_cinematic_keyframe_a',
      taskId: '441071801028925',
      decision: 'REJECTED_SOURCE_FIDELITY',
      reason: 'Kestrel canonical green cloth face mask absent from the immutable E-A source.',
    },
    gates: universalVideoGates,
  },
  finalDecision,
  protectedState: {
    productionMediaChanged: false,
    productionManifestChanged: false,
    travelViewProductionDefault: true,
    runSystemChanged: false,
    saveSchemaChanged: false,
    dialogueTruthChanged: false,
    choicesOrRoutesChanged: false,
    combatChanged: false,
    vfxChanged: false,
    canonicalSpritesChanged: false,
  },
  validationRecord: 'tools/cinematics/specs/cin6ea_final_validation.json',
};
await writeJson(paths.finalLock, finalLock);

const profile = await readJson(paths.profile);
profile.baseline = FINALIZATION_BASELINE;
profile.preproductionBaseline = PREPRODUCTION_BASELINE;
profile.imagePipeline = {
  ...profile.imagePipeline,
  available: true,
  exactModelExecution: 'PROVEN',
  executedModel: MODEL,
  executedQuality: QUALITY,
  imageAttempts: provenanceEntries.length,
  blocker: null,
};
profile.videoPipeline = {
  ...profile.videoPipeline,
  attempted: true,
  totalAttempts: 4,
  selectedPilotsOperatorApproved: ['C', 'E-C', 'F'],
  blockedBy: null,
};
profile.canonicalCharacterAuthority = CANONICAL_AUTHORITY;
profile.finalDecision = finalDecision;
await writeJson(paths.profile, profile);

const families = await readJson(paths.families);
families.baseline = FINALIZATION_BASELINE;
families.preproductionBaseline = PREPRODUCTION_BASELINE;
families.generationStatus = 'EXACT_MODEL_EXECUTION_PROVEN_FOR_OPERATOR_VALIDATION_SET';
families.sameGameVisualIdentity = 'PASS';
families.visualProductionLock = 'YES';
families.operatorDecision = 'APPROVED';
families.note = 'The 13 family definitions are locked. Family-master candidates not used by the six-pilot validation remain future production work, without a model-capability blocker.';
for (const family of families.families) {
  for (const candidate of family.familyMasterCandidates) {
    const provenance = provenanceById.get(candidate.id);
    candidate.status = provenance ? candidateStatus(candidate.id) : 'NOT_EXECUTED_NOT_SELECTED';
    candidate.selected = selectedCandidateIds.includes(candidate.id);
    if (provenance) {
      candidate.outputPath = provenance.outputPath;
      candidate.outputSha256 = provenance.outputSha256;
    }
  }
  const selected = family.familyMasterCandidates.find((entry) => entry.selected);
  family.provisionalPreferredCandidate = selected?.id ?? null;
  family.humanApproval = selected ? 'OPERATOR_APPROVED' : 'VISUAL_LANGUAGE_LOCK_APPROVED';
}
await writeJson(paths.families, families);

const pilots = await readJson(paths.pilots);
pilots.baseline = FINALIZATION_BASELINE;
pilots.preproductionBaseline = PREPRODUCTION_BASELINE;
for (const pilot of pilots.pilots) {
  const selected = pilotSelections[pilot.id];
  pilot.status = 'OPERATOR_APPROVED';
  pilot.imageAttempts = selected.imageAttempts;
  pilot.videoAttempts = selected.videoAttempts;
  pilot.retries = selected.retries;
  pilot.pass = true;
  pilot.operatorDecision = selected.decision;
  pilot.selectedAssets = selected.selectedAssets;
  delete pilot.blocker;
}
pilots.summary = { planned: 6, executed: 6, passed: 6, blocked: 0, imageAttempts: 14, miniMaxAttempts: 4, retries: 1 };
pilots.finalDecision = finalDecision;
await writeJson(paths.pilots, pilots);

const lineage = await readJson(paths.lineage);
lineage.baseline = FINALIZATION_BASELINE;
lineage.preproductionBaseline = PREPRODUCTION_BASELINE;
for (const pilot of lineage.pilots) {
  pilot.status = 'OPERATOR_APPROVED';
  pilot.selectedAssets = pilotSelections[pilot.pilot].selectedAssets;
}
lineage.finalDecision = finalDecision;
await writeJson(paths.lineage, lineage);

const continuity = await readJson(paths.continuity);
continuity.baseline = FINALIZATION_BASELINE;
continuity.preproductionBaseline = PREPRODUCTION_BASELINE;
for (const spec of continuity.specs) {
  const result = dynamicPilots.find((entry) => entry.pilotId === spec.pilotId);
  spec.status = 'OPERATOR_APPROVED';
  spec.result = {
    sourceCandidateId: result.sourceCandidateId,
    masterVideoPath: result.masterVideoPath,
    masterVideoSha256: result.masterVideoSha256,
    finalFramePath: result.finalFramePath,
    finalFrameSha256: result.finalFrameSha256,
    gates: universalVideoGates,
  };
}
continuity.finalDecision = finalDecision;
await writeJson(paths.continuity, continuity);

const review = await readJson(paths.review);
review.baseline = FINALIZATION_BASELINE;
review.preproductionBaseline = PREPRODUCTION_BASELINE;
review.reviewTitle = 'CIN-6E-A Final Operator-Approved Visual Production Lock';
review.referencePolicy.operatorGate = 'Operator image and dynamic-video review complete. Pilots A-F are approved; E-C supersedes rejected E-A and E-B.';
review.executionState = {
  imageGeneration: 'EXACT_MODEL_EXECUTION_PROVEN',
  imageAttempts: 14,
  videoGeneration: 'COMPLETE_C_E_C_F',
  miniMaxAttempts: 4,
  finalizationCommit: 'AUTHORIZED',
  finalizationPush: 'AUTHORIZED_TO_ORIGIN_MAIN',
  notes: [
    'E-A remains rejected because Kestrel lacks the canonical green cloth mask.',
    'E-B remains rejected because Cedric lacks the canonical metal face mask.',
    'E-C is the operator-approved replacement source and video.',
  ],
};
const byPilot = new Map(review.pilots.map((entry) => [entry.id, entry]));
for (const asset of byPilot.get('C').assets) {
  if (asset.id === 'pilot_c_cinematic_keyframe_b') asset.status = 'OPERATOR_APPROVED';
}
for (const asset of byPilot.get('F').assets) {
  if (asset.id === 'pilot_f_cinematic_keyframe_a') asset.status = 'OPERATOR_APPROVED';
}
const pilotE = byPilot.get('E');
pilotE.summary = 'E-C is the approved Cedric/Kestrel encounter source. E-A and E-B remain visible as rejected identity evidence.';
for (const asset of pilotE.assets) {
  if (asset.id === 'pilot_e_cinematic_keyframe_a') asset.status = 'REJECTED_CHARACTER_FIDELITY';
}
if (!pilotE.assets.some((asset) => asset.id === 'pilot_e_cinematic_keyframe_c')) {
  pilotE.assets.unshift({
    id: 'pilot_e_cinematic_keyframe_c',
    kind: 'CINEMATIC_KEYFRAME',
    status: 'OPERATOR_APPROVED',
    image: provenanceById.get('pilot_e_cinematic_keyframe_c').outputPath,
    characters: ['cedric', 'kestrel'],
    reason: 'Cedric retains the closed metal mask and paired blades; Kestrel retains the opaque green cloth mask, longbow, arrow and quiver.',
  });
}
review.finalDecision = finalDecision;
await writeJson(paths.review, review);

const a2 = a2Initial;
a2.baseline = FINALIZATION_BASELINE;
a2.preproductionBaseline = PREPRODUCTION_BASELINE;
a2.supersededBy = paths.finalLock;
a2.operatorDecisions = {
  ...a2.operatorDecisions,
  'C-B': 'OPERATOR_APPROVED',
  'E-A': 'REJECTED_CHARACTER_FIDELITY',
  'F-A': 'OPERATOR_APPROVED',
};
for (const source of a2.selectedH3Sources) {
  if (source.pilotId === 'C' || source.pilotId === 'F') {
    source.operatorDecision = 'OPERATOR_APPROVED';
    source.dynamicResult.agentVerdict = 'OPERATOR_APPROVED';
  }
}
a2.dynamicGate = {
  status: 'SUPERSEDED_BY_FINAL_OPERATOR_LOCK',
  historicalRejectedSource: 'pilot_e_cinematic_keyframe_a',
  replacementSource: 'pilot_e_cinematic_keyframe_c',
  dynamicVideoGate: 'YES',
  visualProductionLock: 'YES',
  agentVisualQa: 'PASS',
  humanVisualReview: 'APPROVED',
  sameGameVisualIdentity: 'PASS',
  readyForCin6eB: 'YES',
  blocker: null,
  note: 'The A.2 E-A failure remains historical evidence; the A.3 E-C replacement passed and was operator-approved.',
};
await writeJson(paths.a2, a2);

const a3Image = await readJson(paths.a3Image);
a3Image.baseline = FINALIZATION_BASELINE;
a3Image.preproductionBaseline = PREPRODUCTION_BASELINE;
a3Image.agentImageVerdict = 'OPERATOR_APPROVED';
a3Image.h3Submission = 'COMPLETED_OPERATOR_APPROVED';
a3Image.videoGenerationStarted = true;
a3Image.videoGenerationStatus = 'OPERATOR_APPROVED';
a3Image.finalDecision = finalDecision;
await writeJson(paths.a3Image, a3Image);

const a3Approval = await readJson(paths.a3Approval);
a3Approval.baseline = FINALIZATION_BASELINE;
a3Approval.preproductionBaseline = PREPRODUCTION_BASELINE;
a3Approval.finalVideoOperatorApproval = {
  status: 'OPERATOR_APPROVED',
  approvedOn: '2026-09-12',
  masterVideoSha256: videoSources.E.dynamicResult.masterVideoSha256,
  finalFrameSha256: videoSources.E.dynamicResult.finalFrameSha256,
};
a3Approval.finalDecision = finalDecision;
await writeJson(paths.a3Approval, a3Approval);

const a3 = a3Initial;
a3.baseline = FINALIZATION_BASELINE;
a3.preproductionBaseline = PREPRODUCTION_BASELINE;
a3.priorOperatorApprovals = { pilotC: 'OPERATOR_APPROVED_UNCHANGED', pilotF: 'OPERATOR_APPROVED_UNCHANGED' };
a3.decision = {
  PILOT_E: 'OPERATOR_APPROVED',
  DYNAMIC_VIDEO_GATE: 'YES',
  VISUAL_PRODUCTION_LOCK: 'YES',
  AGENT_VISUAL_QA: 'PASS',
  HUMAN_VISUAL_REVIEW: 'APPROVED',
  SAME_GAME_VISUAL_IDENTITY: 'PASS',
  READY_FOR_CIN_6E_B: 'YES',
};
delete a3.protectedState.commit;
delete a3.protectedState.push;
a3.protectedState.finalizationRestrictedToReportsAndSpecs = true;
a3.operatorApproval = { status: 'APPROVED', approvedOn: '2026-09-12', authority: paths.finalLock };
await writeJson(paths.a3Regate, a3);

const compiled = await readJson(paths.compiled);
compiled.baseline = FINALIZATION_BASELINE;
compiled.preproductionBaseline = PREPRODUCTION_BASELINE;
compiled.executionStatus = 'EXACT_MODEL_EXECUTION_PROVEN_SELECTED_PIPELINE_COMPLETE';
compiled.generatedOutputs = provenanceEntries.length;
compiled.selectedCandidates = selectedCandidateIds.length;
compiled.selectedCandidateIds = selectedCandidateIds;
compiled.approvedAlternates = approvedAlternateIds.length;
compiled.approvedAlternateIds = approvedAlternateIds;
compiled.rejectedCandidates = rejectedCandidateIds.length;
compiled.rejectedCandidateIds = rejectedCandidateIds;
for (const job of compiled.jobs) {
  const provenance = provenanceById.get(job.assetCandidateId);
  const status = candidateStatus(job.assetCandidateId);
  job.selection = status;
  job.finalApprovalState = status;
  if (provenance) {
    job.generationTimestamp = provenance.generationTimestamp;
    job.outputPath = provenance.outputPath;
    job.outputSha256 = provenance.outputSha256;
    job.executionStatus = 'GENERATED';
  } else {
    job.generationTimestamp = null;
    job.outputPath = null;
    job.outputSha256 = null;
    job.executionStatus = 'NOT_EXECUTED_NOT_SELECTED';
  }
}
compiled.summary = {
  totalJobs: compiled.jobs.length,
  familyMasterJobs: compiled.jobs.filter((job) => job.assetType === 'FAMILY_MASTER').length,
  pilotJobs: compiled.jobs.filter((job) => job.mission !== 'CIN-6E-A.3' && job.assetType !== 'FAMILY_MASTER').length,
  jobsWithCompleteReferenceHashes: compiled.jobs.filter((job) => job.referencePaths.every((path) => job.referenceSha256[path])).length,
  cin6ea3RepairJobs: compiled.jobs.filter((job) => job.mission === 'CIN-6E-A.3').length,
  generatedOutputs: provenanceEntries.length,
};
compiled.finalDecision = finalDecision;
await writeJson(paths.compiled, compiled);

const provenance = await readJson(paths.provenance);
provenance.baseline = FINALIZATION_BASELINE;
provenance.preproductionBaseline = PREPRODUCTION_BASELINE;
const catalogById = new Map(provenance.candidates.map((entry) => [entry.assetCandidateId, entry]));
for (const job of compiled.jobs) {
  if (!catalogById.has(job.assetCandidateId)) {
    provenance.candidates.push(structuredClone(job));
    catalogById.set(job.assetCandidateId, provenance.candidates.at(-1));
  }
}
for (const candidate of provenance.candidates) {
  const job = compiled.jobs.find((entry) => entry.assetCandidateId === candidate.assetCandidateId);
  Object.assign(candidate, {
    generationTimestamp: job.generationTimestamp,
    outputPath: job.outputPath,
    outputSha256: job.outputSha256,
    selection: job.selection,
    finalApprovalState: job.finalApprovalState,
    executionStatus: job.executionStatus,
  });
}
provenance.status = 'EXACT_MODEL_EXECUTION_PROVEN; FINAL_OPERATOR_LOCK_APPROVED';
provenance.summary = {
  compiledRecords: provenance.candidates.length,
  generatedOutputs: provenanceEntries.length,
  selectedCandidates: selectedCandidateIds.length,
  approvedAlternates: approvedAlternateIds.length,
  rejectedCandidates: rejectedCandidateIds.length,
  exactModelExecution: 'PROVEN',
};
provenance.finalDecision = finalDecision;
await writeJson(paths.provenance, provenance);

const presentationAudit = await readJson(paths.presentationAudit);
presentationAudit.cin6eaFinalizationBaseline = FINALIZATION_BASELINE;
presentationAudit.invariants = {
  ...presentationAudit.invariants,
  mediaChanged: false,
  productionMediaChanged: false,
  newNonProductionValidationMediaGenerated: true,
  newMediaGenerated: true,
  minimaxAttempts: 4,
  imageGenerationAttempts: provenanceEntries.length,
};
presentationAudit.cin6eaFinalDecision = finalDecision;
await writeJson(paths.presentationAudit, presentationAudit);

const futureManifest = await readJson(paths.futureManifest);
futureManifest.baseline = FINALIZATION_BASELINE;
futureManifest.preproductionBaseline = PREPRODUCTION_BASELINE;
futureManifest.policy = 'CIN-6E-B handoff is authorized by the operator-approved CIN-6E-A visual production lock; CIN-6E-B has not started.';
futureManifest.cin6eaFinalDecision = finalDecision;
await writeJson(paths.futureManifest, futureManifest);

await writeReport('docs/reports/cin-6e-a-final-visual-production-system.md', `
# CIN-6E-A Final Visual Production System

Finalization baseline: \`${FINALIZATION_BASELINE}\`
Preproduction baseline: \`${PREPRODUCTION_BASELINE}\`

CIN-6E-A is complete and operator-approved. The validation assets remain non-production evidence; TravelView remains the production default and NarrativeStage remains DEV-selectable. No production media, production manifest, canonical sprite, RunSystem, save schema, dialogue truth, choice or route truth, combat, or VFX asset was changed.

## Proven execution

- Image model: \`${MODEL}\`
- Quality: \`${QUALITY}\`
- Exact-model execution: **PROVEN**
- Canonical character authority: \`${CANONICAL_AUTHORITY}\`, applied independently per character
- Image attempts: **14**
- MiniMax-H3 attempts: **4** total, including the rejected historical E-A attempt and its approved E-C replacement

## Operator image selections

- Pilot A: background B — **APPROVED**
- Pilot B: selected Forest Road set — **APPROVED**
- Pilot C: C-B — **APPROVED**
- Pilot D: selected Second Refuge set — **APPROVED**
- Pilot E: E-C — **APPROVED**
- Pilot F: F-A — **APPROVED**

E-A remains rejected because Kestrel's canonical green cloth mask is absent. E-B remains rejected because Cedric's canonical metal face mask is absent.

## Dynamic validation

Pilots C, E-C, and F are **OPERATOR_APPROVED**. Each selected master has zero internal cuts, identity breaks, mask breaks, unexplained cast removals or additions, world resets, and spatial resets. Each exact final frame is HOLD-safe.

## Final decision

- SAME_GAME_VISUAL_IDENTITY: **PASS**
- DYNAMIC_VIDEO_GATE: **YES**
- VISUAL_PRODUCTION_LOCK: **YES**
- HUMAN_VISUAL_REVIEW: **APPROVED**
- READY_FOR_CIN_6E_B: **YES**
- CIN_6E_B_STARTED: **NO**

The authoritative machine-readable decision is \`${paths.finalLock}\`. CIN-6E-B may start only as a separate mission.
`);

await writeReport('docs/reports/cin-6e-a-six-pilot-validation.md', `
# CIN-6E-A Six Pilot Validation

Finalization baseline: \`${FINALIZATION_BASELINE}\`

| Pilot | Approved image selection | Image attempts | MiniMax attempts | Final result |
|---|---|---:|---:|---|
| A | background B | 2 | 0 | OPERATOR_APPROVED |
| B | selected Forest Road set | 3 | 0 | OPERATOR_APPROVED |
| C | C-B | 2 | 1 | OPERATOR_APPROVED |
| D | selected Second Refuge set | 1 | 0 | OPERATOR_APPROVED |
| E | E-C | 4 | 2 | OPERATOR_APPROVED |
| F | F-A | 2 | 1 | OPERATOR_APPROVED |

Totals: **6/6 executed**, **6/6 approved**, **14 image attempts**, and **4 MiniMax-H3 attempts**. E-A and E-B remain explicit rejected identity evidence; E-C is the approved replacement. The selected dynamic pilots C, E-C, and F pass every continuity and final-frame gate.
`);

await writeReport('docs/reports/cin-6e-a-visual-family-lock.md', `
# CIN-6E-A Visual Family Lock

Finalization baseline: \`${FINALIZATION_BASELINE}\`

The 13 visual-family definitions remain the production grammar for location identity, architecture, landmarks, ground, palette, light, atmosphere, depth, material, camera, weather, motion, and forbidden drift. Exact-model execution was proven at \`${QUALITY}\` quality, and the six-pilot operator review establishes **SAME_GAME_VISUAL_IDENTITY = PASS**.

Family-master candidates outside the six-pilot validation set remain future CIN-6E-B production work. They are unexecuted and unselected, with no model-capability blocker. **VISUAL_PRODUCTION_LOCK = YES** and **READY_FOR_CIN_6E_B = YES**.
`);

await writeReport('docs/reports/cin-6e-a-human-review.md', `
# CIN-6E-A Human Review

Finalization baseline: \`${FINALIZATION_BASELINE}\`

The CIN-6E-A.1, A.2, and A.3 image and video evidence was reviewed by the operator. Pilots A-F are approved. Dynamic pilots C, E-C, and F are approved with zero cuts, identity or mask breaks, cast changes, world resets, or spatial resets, and all final frames are HOLD-safe.

E-A remains rejected because Kestrel's canonical green cloth mask is absent. E-B remains rejected because Cedric's canonical metal face mask is absent. E-C replaces both as the approved Pilot E source and H3 result.

- HUMAN_VISUAL_REVIEW: **APPROVED**
- SAME_GAME_VISUAL_IDENTITY: **PASS**
- VISUAL_PRODUCTION_LOCK: **YES**
- READY_FOR_CIN_6E_B: **YES**

The local evidence viewer remains at \`tmp/cinematics/cin6ea/review/index.html\`.
`);

await writeReport('docs/reports/cin-6e-a-character-fidelity.md', `
# CIN-6E-A Character Fidelity

Finalization baseline: \`${FINALIZATION_BASELINE}\`

All 22 character production cards remain backed by canonical full-sprite SHA-256 hashes and QC alpha bounds. The absolute authority is \`${CANONICAL_AUTHORITY}\`, applied independently per character. Static tableaux continue to use canonical runtime sprites unchanged.

The six-pilot review passed character fidelity. For the selected dynamic pilots C, E-C, and F, identity breaks and mask breaks are both zero. The E-A and E-B rejections prove that canonical face concealment remains a hard gate: E-A exposes Kestrel's lower face, while E-B loses Cedric's metal mask. Approved E-C restores both canonical masks.
`);

await writeReport('docs/reports/cin-6e-a-gold-visual-dna.md', `
# CIN-6E-A GOLD Visual DNA

Finalization baseline: \`${FINALIZATION_BASELINE}\`

The GOLD references remain \`alaric_audience_arrival\`, \`camp_departure\`, and \`valmir_route_fork\`. Their camera, ground, palette, lighting, depth, hierarchy, KEEP, IMPROVE, NEVER, source hashes, forensic frames, and continuity signals remain recorded in \`tools/cinematics/specs/gold_visual_dna.json\`.

The operator-approved pilots apply this grammar as one game world. **SAME_GAME_VISUAL_IDENTITY = PASS**. The selected H3 pilots improve on the reference continuity defects by preserving one physical shot with zero editorial cuts and HOLD-safe endpoints.
`);

console.log(JSON.stringify({
  finalLock: paths.finalLock,
  imageAttempts: provenanceEntries.length,
  miniMaxAttempts: 4,
  selectedDynamicPilots: dynamicPilots.map((entry) => entry.pilotId),
  finalDecision,
}, null, 2));

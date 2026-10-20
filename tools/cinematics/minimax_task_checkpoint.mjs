// A resumed job must be the exact previously submitted candidate, never a new paid request.
export const MANUAL_CAMP_DECISION_PATH = 'docs/autonomy/MANUAL_CAMP_CONTINUATION_OPERATOR_DECISION_2026-10-19.md';
export const MANUAL_P03_DECISION_PATH = 'docs/autonomy/MANUAL_P03_CANDIDATE05_OPERATOR_DECISION_2026-10-20.md';
// This is one operator-approved payload, not a configurable extension of the attempt cap.
export const P03_REQUEST = Object.freeze({
  cinematicId: 'camp_departure', sequenceId: 'production_manual_p03_20261020', shotId: 'shot_p03',
  model: 'MiniMax-H3', attempt: 5, duration: 10, resolution: '2K',
  sourcePath: 'tmp/cinematics/cin4/production_manual_p03_20261020/shot_p03/source.png',
  sourceSha256: '0fd6533213c77bc5e95094fe254f8c7f9d64fec1a52e95d7a917dc9fe9e56068',
  sourceWidth: 1672, sourceHeight: 941,
  lastFramePath: 'tools/cinematics/candidates/manual-p03-20261020/p03-stop-v1.png',
  lastFrameSha256: '63744ae86d599e80a78feb39fd6b1c9f07653d5a3b3ea5e81c61db023885ecfa',
  lastFrameWidth: 1672, lastFrameHeight: 941,
  promptPath: 'tools/cinematics/candidates/manual-p03-20261020/pilot-motion-prompt.txt',
  promptSha256: 'cc0abd436a2ad4377e383038c5ff6c5cccfb7da65f8f56d2928afcf510a66bbb',
  outputCandidatePath: 'tmp/cinematics/cin4/production_manual_p03_20261020/shot_p03/candidate_05_raw.mp4',
  budgetUsd: 1.5, estimatedCostUsd: 1.3, maxPaidTasks: 1, automaticPaidRetries: 0,
});

// OD-2026-10-19-D permits exactly one manually engaged continuation, never an autonomous cap reset.
export function assertAttemptAuthorized(attempt, authorization, expected = {}, decisionText = '') {
  const refusal = 'The cinematic pipeline allows at most three autonomous attempts per shot. Report the first three defects before a fourth attempt.';
  if (attempt === 5) {
    if (!authorization || authorization.schemaVersion !== 1 || authorization.manualOnly !== true
        || authorization.operatorDecisionId !== 'OD-2026-10-20-C'
        || authorization.decisionPath !== MANUAL_P03_DECISION_PATH
        || !decisionText.includes('`MANUAL_CAMP_P03_CANDIDATE_05_APPROVED`')) throw new Error(refusal);
    for (const [field, value] of Object.entries(P03_REQUEST)) {
      if (authorization[field] !== value || expected[field] !== value) throw new Error(`Manual P03 authorization mismatch: ${field}.`);
    }
    for (const field of ['specSha256', 'decisionSha256']) {
      if (!/^[a-f0-9]{64}$/u.test(expected[field] ?? '') || authorization[field] !== expected[field]) throw new Error(`Manual P03 authorization mismatch: ${field}.`);
    }
    return;
  }
  if (!Number.isInteger(attempt) || attempt < 1 || attempt > 4) throw new Error(refusal);
  if (attempt <= 3) {
    if (authorization) throw new Error('Manual camp authorization applies only to attempt04.');
    return;
  }
  if (!authorization || authorization.schemaVersion !== 1 || authorization.manualOnly !== true
      || authorization.operatorDecisionId !== 'OD-2026-10-19-D'
      || authorization.decisionPath !== MANUAL_CAMP_DECISION_PATH
      || authorization.cinematicId !== 'camp_departure' || authorization.attempt !== 4
      || authorization.duration !== 12 || authorization.resolution !== '2K'
      || !decisionText.includes('`MANUAL_CAMP_CANDIDATE_04_APPROVED`')) throw new Error(refusal);
  for (const field of ['cinematicId', 'sequenceId', 'shotId', 'model', 'attempt', 'duration', 'resolution', 'sourceSha256', 'promptSha256', 'outputCandidatePath', 'decisionSha256']) {
    if (!expected[field] || authorization[field] !== expected[field]) throw new Error(`Manual authorization mismatch: ${field}.`);
  }
  for (const field of ['sourceSha256', 'promptSha256', 'decisionSha256']) {
    if (!/^[a-f0-9]{64}$/u.test(authorization[field])) throw new Error(`Manual authorization invalid hash: ${field}.`);
  }
}

export function assertResumableTask(saved, expected) {
  if (!saved || !/^\d+$/u.test(saved.taskId ?? '')) throw new Error('Resume requires a recorded MiniMax task ID.');
  if (saved.status === 'downloaded') throw new Error('Candidate already downloaded; inspect the existing artifact.');
  const fields = ['cinematicId', 'sequenceId', 'shotId', 'model', 'attempt', 'duration', 'resolution', 'sourceSha256', 'promptSha256', 'outputCandidatePath', 'manualAuthorizationPath', 'manualAuthorizationSha256', 'manualDecisionSha256'];
  if (expected.attempt === 5 || saved.attempt === 5) fields.push(...Object.keys(P03_REQUEST), 'specSha256');
  for (const field of new Set(fields)) {
    if (saved[field] !== expected[field]) throw new Error(`Resume checkpoint mismatch: ${field}. Restore the submitted spec/source and reuse its existing task.`);
  }
  return saved.taskId;
}

// A resumed job must be the exact previously submitted candidate, never a new paid request.
export const MANUAL_CAMP_DECISION_PATH = 'docs/autonomy/MANUAL_CAMP_CONTINUATION_OPERATOR_DECISION_2026-10-19.md';

// OD-2026-10-19-D permits exactly one manually engaged continuation, never an autonomous cap reset.
export function assertAttemptAuthorized(attempt, authorization, expected = {}, decisionText = '') {
  const refusal = 'The cinematic pipeline allows at most three autonomous attempts per shot. Report the first three defects before a fourth attempt.';
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
  for (const field of ['cinematicId', 'sequenceId', 'shotId', 'model', 'attempt', 'duration', 'resolution', 'sourceSha256', 'promptSha256', 'outputCandidatePath', 'manualAuthorizationPath', 'manualAuthorizationSha256', 'manualDecisionSha256']) {
    if (saved[field] !== expected[field]) throw new Error(`Resume checkpoint mismatch: ${field}. Restore the submitted spec/source and reuse its existing task.`);
  }
  return saved.taskId;
}

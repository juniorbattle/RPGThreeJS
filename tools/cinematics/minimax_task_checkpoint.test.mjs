import { describe, expect, it } from 'vitest';
import { assertAttemptAuthorized, assertResumableTask, MANUAL_CAMP_DECISION_PATH } from './minimax_task_checkpoint.mjs';

const expected = { cinematicId: 'camp_departure', sequenceId: 'camp', shotId: 'shot_01', model: 'MiniMax-H3', attempt: 2, duration: 12, resolution: '2K', sourceSha256: 'source', promptSha256: 'prompt', outputCandidatePath: 'tmp/cinematics/camp/candidate_02_raw.mp4' };
const checkpoint = () => ({ ...expected, taskId: '447917133545949', status: 'pending_resume' });

describe('MiniMax task continuation', () => {
  it('reuses the accepted task after timeout with the exact source, prompt and output', () => {
    expect(assertResumableTask(checkpoint(), expected)).toBe('447917133545949');
  });
  it.each(Object.keys(expected))('rejects changed %s before authentication or submission', (field) => {
    expect(() => assertResumableTask({ ...checkpoint(), [field]: 'changed' }, expected)).toThrow(`mismatch: ${field}`);
  });
  it('refuses an unsubmitted checkpoint or an already downloaded candidate', () => {
    expect(() => assertResumableTask({ ...checkpoint(), taskId: null }, expected)).toThrow('recorded MiniMax task ID');
    expect(() => assertResumableTask({ ...checkpoint(), status: 'downloaded' }, expected)).toThrow('already downloaded');
  });
});

describe('explicit manual camp04 exception', () => {
  const request = { ...expected, sequenceId: 'production_manual_camp_20261019', attempt: 4,
    sourceSha256: 'a'.repeat(64), promptSha256: 'b'.repeat(64), decisionSha256: 'c'.repeat(64),
    outputCandidatePath: 'tmp/cinematics/cin4/production_manual_camp_20261019/shot_01/candidate_04_raw.mp4' };
  const authorization = () => ({ schemaVersion: 1, manualOnly: true, operatorDecisionId: 'OD-2026-10-19-D', decisionPath: MANUAL_CAMP_DECISION_PATH, ...request });
  const decision = '`MANUAL_CAMP_CANDIDATE_04_APPROVED`';
  it.each([1, 2, 3])('retains the unmodified default cap for attempt%i', (attempt) => {
    expect(() => assertAttemptAuthorized(attempt)).not.toThrow();
    expect(() => assertAttemptAuthorized(attempt, authorization())).toThrow('only to attempt04');
  });
  it('requires explicit marked and exactly bound authorization for04', () => {
    expect(() => assertAttemptAuthorized(4)).toThrow('three autonomous attempts');
    expect(() => assertAttemptAuthorized(4, authorization(), request, decision)).not.toThrow();
    expect(() => assertAttemptAuthorized(4, authorization(), request, '')).toThrow('three autonomous attempts');
  });
  it.each([0, -1, 1.5, 5, 6, NaN])('rejects attempt%s even with the manual04 record', (attempt) => {
    expect(() => assertAttemptAuthorized(attempt, authorization(), request, decision)).toThrow('three autonomous attempts');
  });
  it.each(['schemaVersion', 'manualOnly', 'operatorDecisionId', 'decisionPath', ...Object.keys(request)])('rejects changed authorization %s', (field) => {
    expect(() => assertAttemptAuthorized(4, { ...authorization(), [field]: 'changed' }, request, decision)).toThrow();
  });
  it.each(['sourceSha256', 'promptSha256', 'decisionSha256'])('rejects malformed %s even when matching the request', (field) => {
    expect(() => assertAttemptAuthorized(4, { ...authorization(), [field]: 'invalid' }, { ...request, [field]: 'invalid' }, decision)).toThrow('invalid hash');
  });
  it.each(['manualAuthorizationPath', 'manualAuthorizationSha256', 'manualDecisionSha256'])('refuses changed resume %s without affecting legacy checkpoints', (field) => {
    const bound = { ...request, manualAuthorizationPath: 'tools/cinematics/specs/manual-camp-20261019/candidate-04-authorization.json', manualAuthorizationSha256: 'd'.repeat(64), manualDecisionSha256: request.decisionSha256 };
    const saved = { ...bound, taskId: '447917133545949', status: 'pending_resume' };
    expect(assertResumableTask(saved, bound)).toBe(saved.taskId);
    expect(() => assertResumableTask({ ...saved, [field]: 'changed' }, bound)).toThrow(`mismatch: ${field}`);
    expect(assertResumableTask(checkpoint(), expected)).toBe('447917133545949');
  });
});

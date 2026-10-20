import { describe, expect, it } from 'vitest';
import { assertAttemptAuthorized, assertResumableTask, MANUAL_CAMP_DECISION_PATH, MANUAL_P03_DECISION_PATH, P03_REQUEST } from './minimax_task_checkpoint.mjs';
import { buildGenerationRequest, validateLastFrame, writeMetadata } from './minimax_h3_generate.mjs';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

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

describe('single manually approved P03 candidate05', () => {
  const request = { ...P03_REQUEST, specSha256: 'd'.repeat(64), decisionSha256: 'e'.repeat(64) };
  const authorization = () => ({ schemaVersion: 1, manualOnly: true, operatorDecisionId: 'OD-2026-10-20-C', decisionPath: MANUAL_P03_DECISION_PATH, ...request });
  const decision = '`MANUAL_CAMP_P03_CANDIDATE_05_APPROVED`';
  it('allows only the explicit05 payload and rejects missing or crossed decisions', () => {
    expect(() => assertAttemptAuthorized(5, authorization(), request, decision)).not.toThrow();
    expect(() => assertAttemptAuthorized(5)).toThrow();
    expect(() => assertAttemptAuthorized(5, authorization(), request, '`MANUAL_CAMP_CANDIDATE_04_APPROVED`')).toThrow();
    expect(() => assertAttemptAuthorized(4, authorization(), request, decision)).toThrow();
    expect(() => assertAttemptAuthorized(6, authorization(), request, decision)).toThrow();
  });
  it.each(['schemaVersion', 'manualOnly', 'operatorDecisionId', 'decisionPath', ...Object.keys(request)])('rejects tampered authorization %s', (field) => {
    expect(() => assertAttemptAuthorized(5, { ...authorization(), [field]: 'changed' }, request, decision)).toThrow();
  });
  it.each(Object.keys(P03_REQUEST))('rejects a mutually edited request/authorization %s', (field) => {
    expect(() => assertAttemptAuthorized(5, { ...authorization(), [field]: 'changed' }, { ...request, [field]: 'changed' }, decision)).toThrow();
  });
  const resumeRequest = { ...P03_REQUEST, specSha256: request.specSha256, manualDecisionSha256: request.decisionSha256,
    manualAuthorizationPath: 'tools/cinematics/specs/manual-p03-20261020/candidate-05-authorization.json', manualAuthorizationSha256: 'f'.repeat(64) };
  it.each(Object.keys(resumeRequest))('resume refuses changed or removed %s', (field) => {
    const saved = { ...resumeRequest, taskId: '123456', status: 'pending_resume' };
    expect(assertResumableTask(saved, resumeRequest)).toBe('123456');
    expect(() => assertResumableTask({ ...saved, [field]: 'changed' }, resumeRequest)).toThrow();
    expect(() => assertResumableTask({ ...saved, [field]: undefined }, resumeRequest)).toThrow();
  });
  it('sends approved text unchanged and first/last image roles in the actual request builder', async () => {
    const prompt = await readFile(P03_REQUEST.promptPath, 'utf8');
    const sourceBytes = await readFile('tools/cinematics/candidates/manual-p03-20261020/p03-support-v3.png');
    const lastFrameBytes = await readFile(P03_REQUEST.lastFramePath);
    validateLastFrame(lastFrameBytes, { width: 1672, height: 941, sha256: P03_REQUEST.lastFrameSha256 });
    expect(() => validateLastFrame(lastFrameBytes, { width: 1920, height: 1080, sha256: P03_REQUEST.lastFrameSha256 })).toThrow();
    expect(() => validateLastFrame(sourceBytes, { width: 1672, height: 941, sha256: P03_REQUEST.lastFrameSha256 })).toThrow();
    const body = JSON.parse(JSON.stringify(buildGenerationRequest({ prompt, sourceBytes, lastFrameBytes, resolution: '2K', duration: 10 })));
    expect(createHash('sha256').update(body.content[0].text).digest('hex')).toBe(P03_REQUEST.promptSha256);
    expect(body.content.slice(1).map((entry) => entry.role)).toEqual(['first_frame', 'last_frame']);
    for (const [index, hash] of [[1, P03_REQUEST.sourceSha256], [2, P03_REQUEST.lastFrameSha256]]) {
      expect(createHash('sha256').update(Buffer.from(body.content[index].image_url.url.split(',')[1], 'base64')).digest('hex')).toBe(hash);
    }
    expect(body).toMatchObject({ model: 'MiniMax-H3', duration: 10, resolution: '2K', ratio: 'adaptive' });
    expect(buildGenerationRequest({ prompt, sourceBytes, resolution: '2K', duration: 12 }).content).toHaveLength(2);
  });
  it('reserves a new submission exclusively and preserves an uncertain POST checkpoint', async () => {
    const directory = await mkdtemp(resolve(tmpdir(), 'p03-reservation-'));
    const path = resolve(directory, 'candidate.metadata.json');
    try {
      await writeMetadata(path, { status: 'submitting' }, true);
      await expect(writeMetadata(path, { taskId: 'unwanted-new-task' }, true)).rejects.toMatchObject({ code: 'EEXIST' });
      const saved = JSON.parse(await readFile(path, 'utf8'));
      expect(saved).toEqual({ status: 'submitting' });
      expect(() => assertResumableTask(saved, request)).toThrow('recorded MiniMax task ID');
    } finally { await rm(directory, { recursive: true, force: true }); }
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

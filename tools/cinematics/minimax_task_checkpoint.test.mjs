import { describe, expect, it } from 'vitest';
import { assertResumableTask } from './minimax_task_checkpoint.mjs';

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

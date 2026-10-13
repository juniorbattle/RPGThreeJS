// A resumed job must be the exact previously submitted candidate, never a new paid request.
export function assertResumableTask(saved, expected) {
  if (!saved || !/^\d+$/u.test(saved.taskId ?? '')) throw new Error('Resume requires a recorded MiniMax task ID.');
  if (saved.status === 'downloaded') throw new Error('Candidate already downloaded; inspect the existing artifact.');
  for (const field of ['cinematicId', 'sequenceId', 'shotId', 'model', 'attempt', 'duration', 'resolution', 'sourceSha256', 'promptSha256', 'outputCandidatePath']) {
    if (saved[field] !== expected[field]) throw new Error(`Resume checkpoint mismatch: ${field}. Restore the submitted spec/source and reuse its existing task.`);
  }
  return saved.taskId;
}

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeRgb, assertWithin, compareRgb, technicalErrors, validateAssemblyEvidence, validateChainProof, validateLastFrameEvidence } from './cin4_media.mjs';

describe('CIN-4 media invariants', () => {
  it('rejects black and blank RGB frames', () => {
    expect(analyzeRgb(Buffer.alloc(300)).nonblack).toBe(false);
    expect(analyzeRgb(Buffer.alloc(300, 128)).nonblank).toBe(false);
  });

  it('accepts a varied nonblack RGB frame', () => {
    const stats = analyzeRgb(Buffer.from([0, 20, 40, 80, 140, 220, 12, 60, 180]));
    expect(stats.nonblack).toBe(true);
    expect(stats.nonblank).toBe(true);
  });

  it('measures exact and changed frame continuity', () => {
    const frame = Buffer.from([0, 20, 40, 80, 140, 220]);
    expect(compareRgb(frame, Buffer.from(frame))).toEqual({ meanAbsoluteDifference: 0, changedChannelFraction: 0 });
    expect(compareRgb(frame, Buffer.from([10, 20, 40, 80, 140, 200])).meanAbsoluteDifference).toBe(5);
  });

  it('guards artifact containment', () => {
    expect(() => assertWithin('C:\\repo\\tmp', 'C:\\repo\\tmp\\shot\\video.mp4', 'artifact')).not.toThrow();
    expect(() => assertWithin('C:\\repo\\tmp', 'C:\\repo\\public\\video.mp4', 'artifact')).toThrow(/inside/u);
  });

  it('enforces final technical and duration constraints', () => {
    const valid = { container: 'mov,mp4', durationSeconds: 6, width: 1920, height: 1080, rotation: 0, codec: 'h264', pixelFormat: 'yuv420p', averageFrameRate: '24/1', audioStream: false };
    expect(technicalErrors(valid, 6, true)).toEqual([]);
    expect(technicalErrors({ ...valid, audioStream: true, durationSeconds: 5.5 }, 6, true)).toEqual(expect.arrayContaining(['duration must be 6s (+/-0.09s)', 'media must be silent']));
  });

  it('validates exact extracted final-frame evidence and chain provenance', () => {
    const hash = 'a'.repeat(64);
    const metadata = { shotId: 'shot_02', exactFrameIndex: 143, decodedFrameCount: 144, width: 1920, height: 1080, outputSha256: hash, sourceVideoSha256: 'b'.repeat(64), statistics: { nonblack: true, nonblank: true } };
    const shot = { source: { type: 'CHAIN_SOURCE', fromShotId: 'shot_02' } };
    expect(validateLastFrameEvidence(metadata)).toEqual([]);
    expect(validateChainProof(shot, metadata, hash)).toEqual([]);
    expect(validateChainProof(shot, metadata, 'c'.repeat(64))).toContain('chain source SHA must match extracted-frame metadata');
  });

  it('validates sequence ordering and assembler metadata', () => {
    const spec = { shots: [{ shotId: 'shot_01', durationSeconds: 5 }, { shotId: 'shot_02', durationSeconds: 6 }, { shotId: 'shot_03', durationSeconds: 6 }] };
    const metadata = { editorialOrder: ['shot_01', 'shot_02', 'shot_03'], expectedDurationSeconds: 17, shots: spec.shots, outputSha256: 'd'.repeat(64) };
    expect(validateAssemblyEvidence(spec, metadata)).toEqual([]);
    expect(validateAssemblyEvidence(spec, { ...metadata, editorialOrder: [...metadata.editorialOrder].reverse() })).toContain('editorialOrder must match spec shot order');
  });

  it('supports two-shot sequence assembly without a fixed three-shot assumption', async () => {
    const source = await readFile(resolve(process.cwd(), 'tools/cinematics/assemble_sequence.mjs'), 'utf8');
    expect(source).toContain("if (spec.shots.length < 2)");
    expect(source).toContain("concat=n=${inputs.length}");
    expect(source).toContain("Array(spec.shots.length - 1).fill('CUT')");
    expect(source).not.toContain('requires exactly three ordered shots');
  });
});

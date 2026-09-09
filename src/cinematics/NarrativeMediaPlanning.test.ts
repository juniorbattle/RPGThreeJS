import { describe, expect, it } from 'vitest';
import manifest from '../../public/assets/cinematics/manifest.json';
import plan from '../../tools/cinematics/specs/narrative_media_remaster_queue.json';

describe('NarrativeStage current-media planning', () => {
  it('classifies every production cinematic exactly once', () => {
    const productionIds = manifest.cinematics.filter((entry) => !entry.placeholderOnly).map((entry) => entry.id).sort();
    const classified = Object.values(plan.classifications).flat().sort();
    expect(classified).toEqual(productionIds);
    expect(new Set(classified).size).toBe(classified.length);
  });

  it('turns every remaster classification into a complete planning record without generating media', () => {
    expect(plan.queue.map((entry) => entry.cinematicId).sort()).toEqual([...plan.classifications.NEEDS_FUTURE_REMASTER].sort());
    for (const entry of plan.queue) {
      expect(entry.currentProblem).not.toBe('');
      expect(entry.requiredMediaSubjects.length).toBeGreaterThan(0);
      expect(entry.recommendedShotCount).toBeGreaterThan(0);
      expect(entry.recommendedCameraAngles.length).toBeGreaterThan(0);
      expect(entry.negativeSpaceTarget).not.toBe('');
    }
    expect(plan.policy).toBe('PLAN_ONLY_NO_MEDIA_GENERATION');
  });
});

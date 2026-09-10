import { describe, expect, it } from 'vitest';
import { createNarrativeStagingAudit, validateNarrativeStagingAudit } from './NarrativeStagingAudit';

describe('Narrative dialogue staging audit', () => {
  it('maps every reachable Lion-demo dialogue and step', () => {
    const audit = createNarrativeStagingAudit();
    expect(validateNarrativeStagingAudit(audit)).toEqual([]);
    expect(audit.summary.totalReachableDialogues).toBe(71);
    expect(audit.summary.stagedDialogues).toBe(audit.summary.totalReachableDialogues);
    expect(audit.summary.stagedDialogueSteps).toBe(audit.summary.totalDialogueSteps);
    expect(audit.summary.totalDialogueSteps).toBe(247);
    expect(audit.summary.unmappedDialogues).toEqual([]);
    expect(audit.summary.unmappedDialogueSteps).toEqual([]);
    expect(audit.summary.totalStagingRecords).toBe(audit.summary.totalDialogueSteps);
    expect(audit.summary.totalDistinctVisualCompositions).toBeLessThan(audit.summary.totalStagingRecords);
    expect(audit.summary.totalApprovedStagingProfiles).toBe(9);
    expect(audit.summary.approvedLayoutProfiles).toEqual([
      'DIALOGUE_SIDE_COMPACT',
      'DIALOGUE_TOP_CENTER',
      'DIALOGUE_BOTTOM_BAND_RESERVED',
      'DIALOGUE_SPEAKER_FOCUS',
      'INTRO_CAST_PRESENTATION',
      'ADVISER_EXCHANGE',
      'CHOICE_TWO_PATH_SPATIAL',
      'CHOICE_SINGLE_ROUTE_CONTINUE',
      'HELD_VIDEO_DIALOGUE',
    ]);
    expect(audit.summary.choiceSteps).toBeGreaterThan(0);
    expect(audit.summary.choicePurityViolations).toBe(0);
    expect(audit.summary.textCapacityViolations).toBe(0);
    expect(audit.summary.normalDialogueScrollViolations).toBe(0);
    expect(audit.summary.accidentalFullWidthFallbacks).toBe(0);
    expect(audit.summary.arbitraryCenterFallbacks).toBe(0);
    expect(audit.summary.unresolvedMediaSpeakerConflicts).toBe(0);
    expect(audit.summary.unresolvedStaticScaleOutliers).toBe(0);
    expect(audit.summary.unresolvedDialogueSpeakerAssociations).toBe(0);
    expect(audit.summary.staticUpperPlacementViolations).toBe(0);
    expect(audit.summary.videoPlacementRegressions).toBe(0);
  });

  it('keeps composition phases stable while cards may move and owns each canonical step exactly once', () => {
    const audit = createNarrativeStagingAudit();
    for (const entry of audit.entries) {
      expect(entry.steps.map((step) => step.stepId)).toEqual(entry.stepOrder);
      expect(entry.steps.every((step) => step.effectOwnerCount === 1)).toBe(true);
      expect(entry.steps.every((step) => step.maxCharactersPerSegment === 0 || step.maxDisplaySegmentCharacters <= step.maxCharactersPerSegment)).toBe(true);
      expect(entry.steps.filter((step) => step.choiceCount > 0).every((step) => step.speakerCardPolicy === 'SETUP_THEN_CHOICES_ONLY')).toBe(true);
      expect(entry.steps.every((step) => step.dialogueSpeakerAssociationResolved && step.videoDialogueSpeakerAssociationResolved && !step.staticScaleOutlier)).toBe(true);
      expect(entry.steps.every((step) => step.dialogueSurfaceMode === 'STATIC_TABLEAU')).toBe(true);
      expect(entry.visualPhases.length).toBeLessThanOrEqual(entry.steps.length);
    }
  });
});

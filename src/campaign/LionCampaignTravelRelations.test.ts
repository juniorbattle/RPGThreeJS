import { describe, expect, it } from 'vitest';
import {
  LION_MAJOR_CAMPAIGN_TRANSITIONS,
  LION_TRAVERSAL_LEGS,
  auditLionTravelRelations,
} from './LionCampaignTravelRelations';

describe('LionCampaignTravelRelations', () => {
  it('defines exactly T0-T4 as playable traversal legs', () => {
    expect(LION_TRAVERSAL_LEGS.map((leg) => leg.id)).toEqual(['T0', 'T1', 'T2', 'T3', 'T4']);
  });

  it('keeps camp/audience and final-refuge/judgement outside playable traversal', () => {
    expect(LION_MAJOR_CAMPAIGN_TRANSITIONS).toEqual([
      expect.objectContaining({ fromNodeId: 'lion-camp', toNodeId: 'lion-audience' }),
      expect.objectContaining({ fromNodeId: 'lion-final-refuge', toNodeId: 'lion-final-judgement' }),
    ]);
  });

  it('places every route interruption in one and only one traversal leg', () => {
    const ids = LION_TRAVERSAL_LEGS.flatMap((leg) => leg.stages.flatMap((stage) => stage.nodeIds));
    expect(ids).toHaveLength(13);
    expect(new Set(ids).size).toBe(13);
  });

  it('preserves RunSystem forks as alternative stages instead of deciding them', () => {
    expect(LION_TRAVERSAL_LEGS.find((leg) => leg.id === 'T0')?.stages.at(-1)?.nodeIds)
      .toEqual(['lion-first-trial-event', 'lion-first-trial-combat']);
    expect(LION_TRAVERSAL_LEGS.find((leg) => leg.id === 'T1')?.stages.at(-1)?.nodeIds)
      .toEqual(['lion-second-trial-event', 'lion-second-trial-combat']);
    expect(LION_TRAVERSAL_LEGS.find((leg) => leg.id === 'T3')?.stages.at(-1)?.nodeIds)
      .toEqual(['lion-final-trial-event', 'lion-final-trial-combat']);
  });

  it('preserves stage modes after runtime freezing', () => {
    expect(LION_TRAVERSAL_LEGS.find((leg) => leg.id === 'T0')?.stages.map((stage) => stage.mode))
      .toEqual(['MANDATORY_INTERRUPT', 'MANDATORY_INTERRUPT', 'OPTIONAL_INTERRUPT', 'IN_TRAVERSAL_FORK']);
    expect(LION_TRAVERSAL_LEGS.find((leg) => leg.id === 'T1')?.stages.at(-1)?.forkPresentation?.surface)
      .toBe('TRAVERSAL_OVERLAY');
  });

  it('keeps every fork inside the live traversal surface', () => {
    const forkStages = LION_TRAVERSAL_LEGS
      .flatMap((leg) => leg.stages)
      .filter((stage) => stage.mode === 'IN_TRAVERSAL_FORK');

    expect(forkStages).toHaveLength(3);
    for (const stage of forkStages) {
      expect(stage.forkPresentation).toEqual({
        surface: 'TRAVERSAL_OVERLAY',
        keepTraversalMounted: true,
        edgeTreatment: 'TRANSLUCENT_OPAQUE_EDGES',
        choicePlacement: 'RIGHT_CHOICE_RAIL',
        locomotionWhileChoosing: 'SLOW_OR_HOLD',
      });
    }
  });

  it('has no structural travel-relation debt', () => {
    expect(auditLionTravelRelations()).toEqual([]);
  });
});

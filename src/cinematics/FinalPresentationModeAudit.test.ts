import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { combatConfigs, dialogues, POST_NODE_ATE } from '../game/content';
import { generateRunGraph } from '../game/runSystem';

function readJson(path: string): any {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
}

const MODES = [
  'CINEMATIC_VIDEO',
  'CINEMATIC_HOLD',
  'TRAVEL_STILL',
  'STATIC_TABLEAU',
  'COMBAT',
  'GAMEPLAY_UI',
];

describe('CIN-6D.5 final presentation mode audit', () => {
  it('classifies every player-facing audit unit under the six-value mode vocabulary', () => {
    const audit = readJson('tools/cinematics/specs/final_presentation_mode_audit.json');
    expect(audit.modeEnum).toEqual(MODES);
    expect(audit.summary.playerFacingBeats).toBe(144);
    expect(audit.beats).toHaveLength(144);
    expect(audit.summary.playerFacingBeatsUnclassified).toBe(0);
    expect(audit.beats.every((beat: any) => MODES.includes(beat.targetPresentationMode))).toBe(true);
    expect(audit.summary.targetModes).toEqual({
      CINEMATIC_VIDEO: 29,
      CINEMATIC_HOLD: 28,
      TRAVEL_STILL: 19,
      STATIC_TABLEAU: 49,
      COMBAT: 17,
      GAMEPLAY_UI: 2,
    });
    expect(Object.values(audit.summary.targetModes).reduce((sum: number, value: any) => sum + value, 0)).toBe(144);
  });

  it('covers all authoritative nodes and reachable edges', () => {
    const audit = readJson('tools/cinematics/specs/final_presentation_mode_audit.json');
    const graph = generateRunGraph(6100);
    const edgeIds = graph.nodes.flatMap((node) => node.links.map((target) => `${node.id}>${target}`));
    expect(audit.summary.nodes).toBe(21);
    expect(audit.summary.edges).toBe(23);
    expect(audit.nodeCoverage.map((entry: any) => entry.nodeId)).toEqual(graph.nodes.map((node) => node.id));
    expect(audit.nodeCoverage.every((entry: any) => entry.beatIds.length > 0)).toBe(true);
    expect(audit.edgeAudit.map((entry: any) => entry.edgeId)).toEqual(edgeIds);
    expect(audit.edgeAudit.every((entry: any) => entry.targetMode && entry.playerVisiblePause)).toBe(true);
  });

  it('contextualizes every dialogue, choice state and ATE', () => {
    const audit = readJson('tools/cinematics/specs/final_presentation_mode_audit.json');
    const choiceIds = [...dialogues.values()].flatMap((sequence) => sequence.steps
      .filter((step) => (step.choices?.length ?? 0) > 0)
      .map((step) => `${sequence.id}:${step.id}`));
    const ateIds = Object.values(POST_NODE_ATE).flat();
    expect(audit.summary.dialogues).toBe(71);
    expect(audit.summary.dialogueSteps).toBe(247);
    expect(audit.dialogueCoverage.map((entry: any) => entry.dialogueId)).toEqual([...dialogues.keys()].sort());
    expect(audit.summary.choices).toBe(28);
    expect(audit.choiceAudit.map((entry: any) => entry.choiceStateId)).toEqual(choiceIds.sort());
    expect(audit.choiceAudit.every((entry: any) => ['CINEMATIC_HOLD', 'STATIC_TABLEAU'].includes(entry.visualOwner))).toBe(true);
    expect(audit.choiceAudit.every((entry: any) => entry.canonicalSemanticsPreserved)).toBe(true);
    expect(audit.summary.ate).toBe(10);
    expect(audit.ateAudit.map((entry: any) => entry.dialogueId).sort()).toEqual(ateIds.sort());
    expect(audit.ateAudit.every((entry: any) => entry.targetPresentationMode === 'STATIC_TABLEAU')).toBe(true);
  });

  it('audits all production videos without changing their CIN-6D hashes', () => {
    const audit = readJson('tools/cinematics/specs/final_presentation_mode_audit.json');
    const manifest = readJson('public/assets/cinematics/manifest.json');
    const productionIds = manifest.cinematics.filter((entry: any) => !entry.placeholderOnly).map((entry: any) => entry.id);
    expect(audit.summary.productionVideos).toBe(31);
    expect(audit.productionVideoAudit.map((entry: any) => entry.runtimeId)).toEqual(productionIds);
    expect(audit.productionVideoAudit.every((entry: any) => entry.hashMatchesCin6d)).toBe(true);
    expect(audit.summary.existingVideosRetained).toBe(29);
    expect(audit.summary.existingVideosSemanticallyUnnecessary).toBe(2);
    expect(audit.productionVideoAudit.filter((entry: any) => !entry.shouldRemainVideo).map((entry: any) => entry.runtimeId)).toEqual([
      'first_refuge_departure',
      'second_refuge_departure',
    ]);
    expect(audit.summary.holdExtractionsNeeded).toBe(25);
  });

  it('records every field required by the master matrix', () => {
    const audit = readJson('tools/cinematics/specs/final_presentation_mode_audit.json');
    const required = [
      'beatId', 'nodeId', 'edgeId', 'contentId', 'dialogueId', 'combatId', 'beatKind',
      'currentPresentation', 'targetPresentationMode', 'currentAsset', 'targetAssetRole',
      'location', 'timeContext', 'activity', 'cast', 'speakerOwnership', 'heroRepresentation',
      'advisers', 'externalCast', 'hasDialogue', 'hasChoice', 'hasCombat', 'previousBeat',
      'nextBeat', 'contextContinuity', 'holdAllowed', 'reason', 'currentIssue',
      'futureMediaAction', 'priority', 'disposition',
    ];
    expect(audit.beats.every((beat: any) => required.every((field) => Object.prototype.hasOwnProperty.call(beat, field)))).toBe(true);
    expect(audit.beats.every((beat: any) => beat.reason && beat.previousBeat && beat.nextBeat)).toBe(true);
    expect(audit.beats.filter((beat: any) => beat.targetPresentationMode === 'COMBAT')).toHaveLength(combatConfigs.size);
  });

  it('locks travel stills, tableau backgrounds, families and next-mission requirements', () => {
    const audit = readJson('tools/cinematics/specs/final_presentation_mode_audit.json');
    const families = readJson('tools/cinematics/specs/final_visual_family_plan.json');
    expect(audit.summary.newTravelStillsNeeded).toBe(14);
    expect(audit.travelStillAudit).toHaveLength(14);
    expect(audit.travelStillAudit.every((entry: any) => entry.newAssetRequired && entry.uiSafeZone)).toBe(true);
    expect(audit.summary.tableauBackgroundsReusable).toBe(2);
    expect(audit.summary.tableauBackgroundsRequiringRework).toBe(47);
    expect(audit.tableauBackgroundAudit).toHaveLength(49);
    expect(audit.tableauCastAudit).toHaveLength(49);
    expect(audit.tableauCastAudit.every((entry: any) => !entry.missingSpeaker && !entry.futureRecruitShownUnconditionally && !entry.impossibleCast)).toBe(true);
    expect(audit.tableauCastAudit.every((entry: any) => entry.speakers.length && entry.targetCast.length)).toBe(true);
    expect(audit.summary.livingStillCandidates).toBe(10);
    expect(audit.summary.runtimeFeaturesRequired).toBe(10);
    expect(audit.runtimeRequirements).toHaveLength(10);
    expect(audit.visualPipelineRequirements).toHaveLength(8);
    expect(audit.summary.visualFamilies).toBe(13);
    expect(families.families).toHaveLength(13);
    expect(families.families.every((family: any) => family.lighting && family.cameraLanguage && family.environmentLandmarks.length)).toBe(true);
  });

  it('separates Audience hold, road travel and forest threat explicitly', () => {
    const audit = readJson('tools/cinematics/specs/final_presentation_mode_audit.json');
    expect(audit.audienceToRoad).toEqual([
      'CINEMATIC_VIDEO: alaric_audience_arrival',
      'CINEMATIC_HOLD: audience dialogue and mission choice',
      'release hold after audience resolution',
      'TRAVEL_STILL: audience_road_departure',
      'CINEMATIC_VIDEO: forest_journey_tension',
      'CINEMATIC_HOLD: immediate pre-combat dialogue',
      'COMBAT',
      'STATIC_TABLEAU: post-combat discussion',
    ]);
    expect(audit.edgeAudit.find((entry: any) => entry.edgeId === 'lion-audience>lion-opening-ambush')).toMatchObject({
      currentMode: 'STATIC_TABLEAU',
      targetMode: 'TRAVEL_STILL',
      travelStillId: 'audience_road_departure',
    });
  });

  it('remains a planning-only artifact with every protected system unchanged', () => {
    const audit = readJson('tools/cinematics/specs/final_presentation_mode_audit.json');
    expect(audit.invariants).toEqual({
      gameTruthChanged: false,
      runSystemChanged: false,
      saveSchemaChanged: false,
      combatRuntimeChanged: false,
      vfxChanged: false,
      runtimePresentationChanged: false,
      mediaChanged: false,
      newMediaGenerated: false,
      minimaxAttempts: 0,
      imageGenerationAttempts: 0,
    });
  });
});

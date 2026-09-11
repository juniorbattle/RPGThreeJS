import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dialogues } from '../game/content';
import { generateRunGraph } from '../game/runSystem';
import { AUDIENCE_ROAD_DEPARTURE_TABLEAU, resolveNarrativeChoiceScreenLanes, ALARIC_AUDIENCE_TABLEAU } from './NarrativeTableau';

function readJson(path: string): any {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
}

describe('CIN-6D final narrative continuity lock', () => {
  it('covers every authoritative node and edge with the full presentation taxonomy', () => {
    const spec = readJson('tools/cinematics/specs/final_narrative_continuity.json');
    const graph = generateRunGraph(6100);
    const liveEdges = graph.nodes.flatMap((node) => node.links.map((target) => `${node.id}>${target}`));
    expect(spec.summary).toEqual({ nodes: 21, edges: 23, maxDepth: 17 });
    expect(spec.nodes.map((node: any) => node.nodeId)).toEqual(graph.nodes.map((node) => node.id));
    expect(spec.edges.map((edge: any) => edge.edgeId)).toEqual(liveEdges);
    expect(spec.edges.every((edge: any) => edge.requiresExplicitPresentation && !edge.stalePriorHoldAllowed)).toBe(true);
    expect(new Set(spec.beatTaxonomy)).toEqual(new Set([
      'ARRIVAL', 'ENCOUNTER', 'DIALOGUE', 'DECISION', 'DEPARTURE', 'TRAVEL', 'THREAT',
      'PRE_COMBAT', 'COMBAT', 'POST_COMBAT', 'AFTERMATH', 'REFUGE_ARRIVAL',
      'REFUGE_MANAGEMENT', 'REFUGE_DEPARTURE', 'REVELATION', 'JUDGEMENT', 'ENDING', 'EPILOGUE',
    ]));
  });

  it('audits all dialogue steps and all actionable choices with no unresolved content item', () => {
    const audit = readJson('tools/cinematics/specs/final_dialogue_quality_audit.json');
    const liveSteps = [...dialogues.values()].reduce((total, dialogue) => total + dialogue.steps.length, 0);
    const auditedSteps = audit.entries.flatMap((entry: any) => entry.classifications);
    expect(audit.summary.dialogues).toBe(dialogues.size);
    expect(audit.summary.steps).toBe(liveSteps);
    expect(audit.summary).toMatchObject({
      dialogues: 71, steps: 247, actionableChoiceStates: 28,
      KEEP: 243, POLISH: 4, MOVE: 0, CONDITIONALIZE: 0, CHANGE_SPEAKER: 0,
      REMOVE_REDUNDANT_LINE: 0, ADD_TRANSITION_LINE: 0, CONTENT_BUG: 0, REVIEW: 0,
    });
    expect(auditedSteps).toHaveLength(247);
    expect(audit.exactPolish).toHaveLength(4);
    expect(audit.exactPolish.every((entry: any) => entry.canonicalTextPreserved)).toBe(true);
  });

  it('classifies all current production masters and the one missing post-audience beat', () => {
    const plan = readJson('tools/cinematics/specs/final_cinematic_remaster_queue.json');
    const manifest = readJson('public/assets/cinematics/manifest.json');
    const productionIds = manifest.cinematics.filter((entry: any) => !entry.placeholderOnly).map((entry: any) => entry.id);
    expect(plan.existingProductionMasters.map((entry: any) => entry.runtimeId)).toEqual(productionIds);
    expect(plan.existingProductionMasters).toHaveLength(31);
    expect(plan.summary).toEqual({
      KEEP_AS_IS: 14, REMASTER_VISUAL: 12, TRIM_OR_REASSEMBLE: 0,
      PRESENTATION_FIX_ONLY: 0, REMOVE_FROM_RUNTIME: 0, REPLACE_BY_REUSE: 5,
      REVIEW: 0, NEW_MEDIA_REQUIRED: 1,
    });
    expect(plan.missingRequiredMedia).toEqual([
      expect.objectContaining({ runtimeId: 'audience_road_departure', needsNewMedia: true }),
    ]);
  });

  it('keeps Audience truth and geometry while changing only the following presentation', () => {
    const audience = dialogues.get('lion_briefing')!;
    const agency = audience.steps.find((step) => step.id === '3')!;
    expect(agency.choices?.map((choice) => choice.text)).toEqual([
      'Accepter la mission d’Alaric.',
      'Accepter, mais réclamer une avance.',
    ]);
    expect(resolveNarrativeChoiceScreenLanes(ALARIC_AUDIENCE_TABLEAU, 2)).toEqual(['RIGHT', 'LEFT']);
    expect(AUDIENCE_ROAD_DEPARTURE_TABLEAU.presentationKey).toBe('edge:lion-audience>lion-opening-ambush');
    expect(AUDIENCE_ROAD_DEPARTURE_TABLEAU.cast.visualActors).not.toContain('alaric');
  });

  it('makes cross-context backdrop preservation opt-in', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/game/GameApp.ts'), 'utf8');
    const start = source.indexOf('private async playNarrativeDialogue');
    const end = source.indexOf('\n  private async playClassicDialogue', start);
    const method = source.slice(start, end);
    expect(method).toContain('options.preserveBackdrop === true');
    expect(method).not.toContain('options.preserveBackdrop !== false');
    expect(method).not.toContain('options.preserveBackdrop === false ? {}');
  });
});

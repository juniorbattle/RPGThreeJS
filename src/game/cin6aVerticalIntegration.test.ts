import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { VIDEO_CINEMATIC_TRIGGERS } from '../cinematics/CinematicTriggers';
import { JOURNEY_PRESENTATION_MAP } from '../journey/JourneyPresentationResolver';

const SOURCE = readFileSync(resolve(process.cwd(), 'src/game/GameApp.ts'), 'utf8');

function method(name: string): string {
  const start = SOURCE.indexOf(name);
  expect(start, `missing ${name}`).toBeGreaterThan(-1);
  const next = SOURCE.indexOf('\n  private ', start + name.length);
  return SOURCE.slice(start, next === -1 ? SOURCE.length : next);
}

describe('CIN-6A vertical integration seams', () => {
  it('gates lifecycle video playback to approved production slots', () => {
    expect(VIDEO_CINEMATIC_TRIGGERS).toEqual({
      beforeDialogue: { lion_finale_judgement: 'lion_judgement' },
      beforeCombat: {},
      afterCombat: {},
      chapterBeat: {},
    });
    const interlude = method('private cinematicInterlude');
    expect(interlude).toContain('resolveVideoCinematicTrigger(trigger)');
    expect(interlude).toContain('resolveCin6aJourneyTrigger(trigger) ?? resolveCin6cJourneyTrigger(trigger, { flags: this.state.flags })');
    expect(interlude).toContain('!isApprovedProductionVideo(id)');
    expect(method('private async playJourneyCinematic')).toContain('!isApprovedProductionVideo(id)');
  });

  it('maps the reviewed CIN-6A boundaries plus the CIN-6D static audience-road release', () => {
    expect(JOURNEY_PRESENTATION_MAP).toEqual({
      'node:lion-camp:arrival': null,
      'edge:lion-audience>lion-opening-ambush': null,
      'node:lion-refugees:arrival': null,
      'node:lion-valmir-road:arrival': null,
      'node:lion-witnesses:arrival': null,
    });
    const journey = method('private async runJourneyBoundary');
    expect(journey).toContain('currentNodeId: current?.id ?? null');
    expect(journey).toContain('available = getAvailableRunNodes(this.state)');
    expect(journey).toContain('await this.commitRunNodeChoice(outcome.id)');
  });

  it('plays first-refuge arrival before management and resolves both departures at the post-Continue boundary', () => {
    const resolveNode = method('private async resolveRunNode');
    const start = resolveNode.indexOf("if (node.type === 'refuge')");
    expect(start).toBeGreaterThan(-1);
    const refuge = resolveNode.slice(start, resolveNode.indexOf("if (node.type === 'shop')", start));
    // The services loop is shared with the final refuge since set 1.15.0 (runRefugeServices).
    const services = method('private async runRefugeServices');
    expect(refuge.indexOf('resolveCin6aRefugeArrival(node.id)')).toBeGreaterThan(-1);
    expect(refuge.indexOf('resolveCin6aRefugeArrival(node.id)')).toBeLessThan(refuge.indexOf('await this.runRefugeServices('));
    expect(services).toContain('this.exploration.open');
    expect(refuge).not.toContain('resolveCin6aRefugeDeparture(node.id)');
    expect(services).toContain("if (action === 'continue') break");
    expect(refuge.indexOf('await this.runRefugeServices(')).toBeLessThan(refuge.indexOf('this.markResolved(node.id)'));
    expect(refuge.indexOf('this.markResolved(node.id)')).toBeLessThan(refuge.indexOf('this.enterCampaignPresentation()'));
    for (const gameplay of ["action === 'rest'", "action === 'shop'", "action === 'clan'", "action === 'skills'"]) {
      expect(services).toContain(gameplay);
    }
  });

  it('selects state-specific aftermath after deterministic victory facts and before consequence dialogue', () => {
    const combat = method('private async resolveCombat');
    // Set 1.20.0: the plateau's victory facts, which are the Lion's boss facts for every Lion fight (plateauProgression.test.ts).
    const facts = combat.indexOf('Object.assign(this.state.flags, combatVictoryFacts(result.combatId))');
    const aftermath = combat.indexOf('resolveCin6aBoisClairAftermath');
    const postDialogue = combat.lastIndexOf('bossConfig?.postCombatDialogueId') > -1
      ? combat.indexOf('const combatConfig = anyCombatConfig(result.combatId)')
      : -1;
    expect(facts).toBeGreaterThan(-1);
    expect(aftermath).toBeGreaterThan(facts);
    expect(postDialogue).toBeGreaterThan(aftermath);
  });

  it('places the mutually exclusive route ending after existing aftermath and before deterministic epilogue', () => {
    const combat = method('private async resolveCombat');
    const bossAftermath = combat.indexOf('bossConfig.postCombatDialogueId');
    const ending = combat.indexOf('resolveCin6aSerpentEnding');
    const lionEnding = combat.indexOf('resolveCin6bLionTrialEnding');
    // Set 1.20.0: the plateau's epilogue, which is 'epilogue' for every Lion run (plateauProgression.test.ts).
    const epilogue = combat.indexOf('await this.playDialogue(plateauEpilogueDialogueId(this.state))');
    expect(bossAftermath).toBeGreaterThan(-1);
    expect(ending).toBeGreaterThan(bossAftermath);
    expect(lionEnding).toBeGreaterThan(bossAftermath);
    expect(epilogue).toBeGreaterThan(ending);
    expect(epilogue).toBeGreaterThan(lionEnding);
  });

  it('does not add a second route commit or game-truth mutation path', () => {
    expect(SOURCE.split('enterRunNode(')).toHaveLength(2);
    expect(SOURCE.split('private async commitRunNodeChoice')).toHaveLength(2);
    const presentation = readFileSync(resolve(process.cwd(), 'src/cinematics/Cin6aPresentation.ts'), 'utf8');
    expect(presentation).not.toMatch(/state\.|flags\[[^\]]+\]\s*=|enterRunNode|startCombat|applyEffects|saveAuto/);
  });

  it('keeps campaign combat QA controls behind the explicit DEV golden-path selector', () => {
    expect(SOURCE).toContain("new URLSearchParams(window.location.search).get('cin6a') === 'golden'");
    expect(SOURCE).toContain("this.campaignPresentation === 'journey'");
    expect(method('private async startCombat')).toContain('devQa: this.cin6aGoldenQaEnabled');
  });
});

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
  it('keeps the three global production triggers unchanged and confines new lifecycle clips to Journey', () => {
    expect(VIDEO_CINEMATIC_TRIGGERS).toEqual({
      beforeDialogue: { lion_finale_judgement: 'lion_judgement' },
      beforeCombat: { serpent_captain: 'serpent_general_reveal', lion_chief: 'lion_champion_reveal' },
      afterCombat: {},
      chapterBeat: {},
    });
    const interlude = method('private cinematicInterlude');
    expect(interlude).toContain('resolveVideoCinematicTrigger(trigger)');
    expect(interlude).toContain('this.usesJourneyPresentation() ? resolveCin6aJourneyTrigger(trigger) : undefined');
    expect(method('private async playJourneyCinematic')).toContain('if (!id || !this.usesJourneyPresentation()) return');
  });

  it('maps the initial continuation and all three real route-freeze boundaries from RunNode identity', () => {
    expect(JOURNEY_PRESENTATION_MAP).toEqual({
      'node:lion-camp:arrival': 'camp_departure',
      'node:lion-refugees:arrival': 'refugees_approach',
      'node:lion-valmir-road:arrival': 'valmir_route_fork',
      'node:lion-witnesses:arrival': 'witnesses_encounter',
    });
    const journey = method('private async runJourneyBoundary');
    expect(journey).toContain('currentNodeId: current?.id ?? null');
    expect(journey).toContain('available = getAvailableRunNodes(this.state)');
    expect(journey).toContain('await this.commitRunNodeChoice(outcome.id)');
  });

  it('plays first-refuge arrival before management and both departures only after real Continue', () => {
    const resolveNode = method('private async resolveRunNode');
    const refuge = resolveNode.slice(0, resolveNode.indexOf("if (node.type === 'shop')"));
    expect(refuge.indexOf('resolveCin6aRefugeArrival(node.id)')).toBeLessThan(refuge.indexOf('this.exploration.open'));
    expect(refuge.indexOf("if (action === 'continue') break")).toBeLessThan(refuge.indexOf('resolveCin6aRefugeDeparture(node.id)'));
    expect(refuge.indexOf('resolveCin6aRefugeDeparture(node.id)')).toBeLessThan(refuge.indexOf('this.markResolved(node.id)'));
    for (const gameplay of ["action === 'rest'", "action === 'shop'", "action === 'clan'", "action === 'skills'"]) {
      expect(refuge).toContain(gameplay);
    }
  });

  it('selects saved aftermath after deterministic victory facts and before consequence dialogue', () => {
    const combat = method('private async resolveCombat');
    const facts = combat.indexOf('Object.assign(this.state.flags, lionBossVictoryFacts(result.combatId))');
    const aftermath = combat.indexOf('resolveCin6aBoisClairAftermath');
    const postDialogue = combat.lastIndexOf('bossConfig?.postCombatDialogueId') > -1
      ? combat.indexOf('const combatConfig = combatConfigs.get(result.combatId)')
      : -1;
    expect(facts).toBeGreaterThan(-1);
    expect(aftermath).toBeGreaterThan(facts);
    expect(postDialogue).toBeGreaterThan(aftermath);
  });

  it('places the Serpent ending after existing aftermath and before deterministic epilogue', () => {
    const combat = method('private async resolveCombat');
    const bossAftermath = combat.indexOf('bossConfig.postCombatDialogueId');
    const ending = combat.indexOf('resolveCin6aSerpentEnding');
    const epilogue = combat.indexOf("await this.playDialogue('epilogue')");
    expect(bossAftermath).toBeGreaterThan(-1);
    expect(ending).toBeGreaterThan(bossAftermath);
    expect(epilogue).toBeGreaterThan(ending);
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

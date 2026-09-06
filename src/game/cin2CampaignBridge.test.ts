import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { VIDEO_CINEMATIC_TRIGGERS } from '../cinematics/CinematicTriggers';
import { parseVideoCinematicManifest } from '../cinematics/CinematicRegistry';
import { getAvailableRunNodes, getRunNode } from './runSystem';
import { createInitialState } from './store';

const SOURCE = readFileSync(resolve(process.cwd(), 'src/game/GameApp.ts'), 'utf8');

function method(name: string): string {
  const start = SOURCE.indexOf(name);
  expect(start, `missing ${name}`).toBeGreaterThan(-1);
  const next = SOURCE.indexOf('\n  private ', start + name.length);
  return SOURCE.slice(start, next === -1 ? SOURCE.length : next);
}

function occurrences(needle: string): number {
  return SOURCE.split(needle).length - 1;
}

describe('CIN-2 campaign presentation bridge', () => {
  it('routes every surface through one authoritative route commit function', () => {
    // RunSystem entry exists exactly once in the whole app controller.
    expect(occurrences('enterRunNode(')).toBe(1);
    expect(occurrences('this.state.stepCounter += 1')).toBe(1);
    expect(occurrences('this.state.visitedNodeIds = [...this.state.run.visitedNodeIds]')).toBe(1);
    expect(occurrences('this.state.seenUniqueEvents.push(')).toBe(1);
    expect(occurrences('private async commitRunNodeChoice')).toBe(1);

    const commit = method('private async commitRunNodeChoice');
    expect(commit).toContain('evaluateRouteCommit({');
    expect(commit).toContain('enterRunNode(this.state.run, node.id)');
    expect(commit).toContain('this.state.currentNodeId = entered.id');
    expect(commit).toContain('this.state.visitedNodeIds = [...this.state.run.visitedNodeIds]');
    expect(commit).toContain('this.state.seenUniqueEvents.push(entered.contentId)');
    expect(commit).toContain('this.state.stepCounter += 1');
    expect(commit).toContain('await this.resolveRunNode(entered, false)');
    expect(commit).toContain('this.routeCommitInFlight = true');
    expect(commit).toContain('this.routeCommitInFlight = false');
    expect(commit.indexOf('this.routeCommitInFlight = false'))
      .toBeLessThan(commit.indexOf('await this.resolveRunNode(entered, false)'));

    // TravelView selection delegates instead of duplicating the sequence.
    const choose = method('private async chooseRunNode');
    expect(choose).toContain('this.commitRunNodeChoice(node.id)');
    expect(choose).not.toContain('enterRunNode');
    expect(choose).not.toContain('stepCounter');
    expect(SOURCE).toContain('onSelect: (node) => this.chooseRunNode(node)');

    // Journey selection delegates to the very same function.
    expect(method('private async runJourneyBoundary')).toContain('await this.commitRunNodeChoice(outcome.id)');
  });

  it('guards route commitment by mode through the shared pure guard', () => {
    const guard = readFileSync(resolve(process.cwd(), 'src/journey/RouteCommitGuard.ts'), 'utf8');
    expect(guard).toContain("['TRAVEL', 'JOURNEY']");
    expect(SOURCE).toContain("import { evaluateRouteCommit } from '../journey/RouteCommitGuard'");
    // No scattered ad-hoc travel-only mode check remains in the commit path.
    expect(method('private async commitRunNodeChoice')).not.toContain("this.mode !== 'TRAVEL'");
  });

  it('returns every campaign boundary through the presentation facade', () => {
    expect(occurrences('private async enterCampaignPresentation')).toBe(1);
    // enterTravel() is reachable only from the facade's travel branch and the failure fallback.
    expect(occurrences('await this.enterTravel();')).toBe(2);
    expect(method('private async enterCampaignPresentation')).toContain('await this.enterJourney()');
    expect(method('private async failJourneyToTravel')).toContain('await this.enterTravel()');
    // Every post-node/return path uses the facade.
    expect(occurrences('await this.enterCampaignPresentation();')).toBeGreaterThanOrEqual(9);

    const resolveNode = method('private async resolveRunNode');
    expect(resolveNode).not.toContain('enterTravel');
    expect(method('private async resolveCombat')).not.toContain('enterTravel');
    expect(method('private async flushPendingCombat')).not.toContain('enterTravel');
  });

  it('keeps the R6 post-node ordering with the presentation strictly last', () => {
    const postNode = method('private async playPostNodeNarrative');
    expect(postNode.indexOf('await this.maybePlayATEs(nodeId)')).toBeGreaterThan(-1);
    expect(postNode.indexOf('await this.maybePlayReputationEvent(nodeId)'))
      .toBeGreaterThan(postNode.indexOf('await this.maybePlayATEs(nodeId)'));
    // No presentation may be inserted between ATE and R4.
    expect(postNode).not.toContain('enterCampaignPresentation');
    expect(postNode).not.toContain('enterJourney');
    expect(postNode).not.toContain('enterTravel');

    const combat = method('private async resolveCombat');
    expect(combat.indexOf('await this.playPostNodeNarrative(node.id)'))
      .toBeLessThan(combat.lastIndexOf('await this.enterCampaignPresentation()'));
  });

  it('keeps combat internals and dialogue resolution untouched by the bridge', () => {
    for (const forbidden of ['CombatStage', 'CasterMotion', 'applyDamage', 'combatAi', 'enemyAi']) {
      expect(SOURCE).not.toContain(forbidden);
    }
    const journeySources = ['JourneyCampaignBoundary', 'JourneyRunNodeAdapter', 'JourneyPresentationResolver', 'RouteCommitGuard', 'JourneyPresentationPolicy'];
    for (const name of journeySources) {
      const code = readFileSync(resolve(process.cwd(), `src/journey/${name}.ts`), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      expect(code).not.toMatch(/enterRunNode|resolveRunNode|applyEffects|saveAuto|saveManual|startCombat|playDialogue/);
    }
  });

  it('wires Journey secondary actions to the systems that already own them', () => {
    const actions = SOURCE.slice(SOURCE.indexOf('const JOURNEY_SECONDARY_ACTIONS'), SOURCE.indexOf('JOURNEY_MAX_REJECTIONS'));
    expect(actions).toContain("id: 'COMPANY'");
    expect(actions).toContain("id: 'SAVE'");
    expect(actions).toContain("id: 'MENU'");
    expect(actions).not.toContain("id: 'CAMP'");
    expect(actions).not.toContain("id: 'ROADMAP'");

    const secondary = method('private async handleJourneySecondary');
    expect(secondary).toContain('this.saves.saveManual(this.state)');
    expect(secondary).toContain("this.openManagement('clan', undefined, 'temporary', false)");
    expect(secondary).toContain('this.renderTitle()');
    // A secondary action can never enter a route.
    expect(secondary).not.toContain('commitRunNodeChoice');
    expect(secondary).not.toContain('enterRunNode');
    expect(secondary).not.toContain('stepCounter');
  });

  it('restores the same Journey boundary after management without advancing the run', () => {
    const management = method('private async openManagement');
    expect(management).toContain("this.mode !== 'JOURNEY'");
    expect(management).not.toContain('stepCounter');
    expect(management).not.toContain('enterRunNode');
    expect(management).not.toContain('markResolved');
    // Option B: the loop re-presents the boundary from unchanged route state.
    const journeyLoop = method('private async runJourneyBoundary');
    expect(journeyLoop).toContain('getAvailableRunNodes(this.state)');
    expect(journeyLoop).toContain('if (await this.handleJourneySecondary(outcome.id)) continue;');
  });

  it('falls back to TravelView on catastrophic Journey failure without recursing', () => {
    const fail = method('private async failJourneyToTravel');
    expect(fail).toContain('this.journeyUnavailable = true');
    expect(fail).toContain('this.disposeJourney()');
    expect(fail).toContain('await this.enterTravel()');
    expect(fail).not.toContain('enterCampaignPresentation');
    expect(fail).not.toContain('enterJourney');
    expect(SOURCE).toContain("this.campaignPresentation === 'journey' && !this.journeyUnavailable");
    // A rejected commit cannot spin forever.
    expect(SOURCE).toContain('JOURNEY_MAX_REJECTIONS');
    expect(method('private async runJourneyBoundary')).toContain('rejections >= JOURNEY_MAX_REJECTIONS');
  });

  it('disposes Journey-owned resources on every exit path', () => {
    for (const name of ['dispose(): void', 'private renderTitle', 'private showTravel', 'private async continueChronicle']) {
      expect(method(name)).toContain('disposeJourney()');
    }
    expect(method('private disposeJourney')).toContain('this.journeyBoundary?.dispose()');
  });

  it('starts a new chronicle identically under both presentation policies', () => {
    const chronicle = method('private async startNewChronicle');
    expect(chronicle).toContain('this.saves.clear()');
    expect(chronicle).toContain('this.state = createInitialState()');
    expect(chronicle).toContain('this.state.flags.prologueSeen = false');
    expect(chronicle).toContain('rpg-tutorial-seen');
    expect(chronicle).toContain("await this.playDialogue('acte_ouverture')");
    expect(chronicle).toContain('await this.enterCampaignPresentation()');
    expect(chronicle).not.toContain('enterTravel');
    expect(chronicle).not.toContain('enterJourney');
  });

  it('resumes a reload without replaying a committed route or a durable finale', () => {
    const chronicle = method('private async continueChronicle');
    expect(chronicle).toContain('resolvePendingLionFinaleCombat(this.state.flags)');
    expect(chronicle).toContain('!this.state.resolvedNodeIds.includes(current.id)');
    expect(chronicle).toContain('await this.resolveRunNode(current, true)');
    expect(chronicle).toContain('await this.enterCampaignPresentation()');
    // No campaign surface is mounted before the resume profile is known.
    expect(chronicle).not.toContain('this.showTravel()');
    expect(chronicle).not.toContain('this.travel.open()');
    // The resolve branch returns, so a resumed node never also presents a boundary.
    expect(chronicle.indexOf('await this.resolveRunNode(current, true)'))
      .toBeLessThan(chronicle.indexOf('await this.enterCampaignPresentation()'));
    expect(chronicle).toContain('return;');
  });

  it('keeps refuge gameplay unchanged and lion-final-refuge a story node', () => {
    const resolveNode = method('private async resolveRunNode');
    const refuge = resolveNode.slice(0, resolveNode.indexOf("if (node.type === 'shop')"));
    for (const expected of ['refugeSecured:', 'secureRunLoot(this.state)', "action === 'rest'", "action === 'shop'", "action === 'clan'", "action === 'skills'", "action === 'continue'"]) {
      expect(refuge).toContain(expected);
    }
    expect(refuge).toContain('await this.enterCampaignPresentation()');

    // lion-final-refuge is narrative, not one of the managed refuge nodes.
    const state = createInitialState();
    const finalRefuge = getRunNode(state.run, 'lion-final-refuge');
    expect(finalRefuge?.type).toBe('story');
    expect(finalRefuge?.type).not.toBe('refuge');
    expect(state.run.graph.nodes.some((node) => node.type === 'refuge')).toBe(true);
  });

  it('exposes the real route shapes CIN-2 presents', () => {
    const state = createInitialState();
    const at = (nodeId: string) => {
      state.run.currentNodeId = nodeId;
      state.currentNodeId = nodeId;
      return getAvailableRunNodes(state);
    };
    expect(at('lion-refugees').map((node) => node.id))
      .toEqual(['lion-first-trial-event', 'lion-first-trial-combat']);
    expect(at('lion-nomad-crossroads')).toHaveLength(1);
    expect(at('lion-final-judgement')).toHaveLength(0);
  });

  it('keeps CIN-6A Journey media separate from the three global CIN-3 production triggers', () => {
    expect(VIDEO_CINEMATIC_TRIGGERS.beforeDialogue).toEqual({
      lion_finale_judgement: 'lion_judgement',
    });
    expect(VIDEO_CINEMATIC_TRIGGERS.beforeCombat).toEqual({
      serpent_captain: 'serpent_general_reveal',
      lion_chief: 'lion_champion_reveal',
    });
    expect(VIDEO_CINEMATIC_TRIGGERS.afterCombat).toEqual({});
    expect(VIDEO_CINEMATIC_TRIGGERS.chapterBeat).toEqual({});

    const manifestPath = resolve(process.cwd(), 'public/assets/cinematics/manifest.json');
    const manifest = parseVideoCinematicManifest(JSON.parse(readFileSync(manifestPath, 'utf8')));
    expect(manifest?.cinematics.map((descriptor) => descriptor.id)).toEqual([
      'qa-placeholder',
      'lion_judgement',
      'serpent_general_reveal',
      'lion_champion_reveal',
      'forest_journey_tension',
      'camp_departure',
      'alaric_audience_arrival',
      'refugees_approach',
      'first_refuge_arrival',
      'first_refuge_departure',
      'valmir_route_fork',
      'bois_clair_arrival',
      'bois_clair_saved',
      'second_refuge_departure',
      'witnesses_encounter',
      'ruins_approach_context',
      'shadow_signs',
      'final_refuge_dossier',
      'serpent_route_ending',
    ]);

    // CIN-6A adds its fifteen approved local masters and preserves all three CIN-3 binaries.
    const videos: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.(mp4|webm|mov|m4v)$/i.test(entry)) videos.push(full);
      }
    };
    walk(resolve(process.cwd(), 'public'));
    expect(videos.map((path) => path.replaceAll('\\', '/').split('/').at(-1)).sort()).toEqual([
      'alaric_audience_arrival.mp4',
      'bois_clair_arrival.mp4',
      'bois_clair_saved.mp4',
      'camp_departure.mp4',
      'final_refuge_dossier.mp4',
      'first_refuge_arrival.mp4',
      'first_refuge_departure.mp4',
      'forest_journey_tension.mp4',
      'lion_champion_reveal.mp4',
      'lion_judgement.mp4',
      'refugees_approach.mp4',
      'ruins_approach_context.mp4',
      'second_refuge_departure.mp4',
      'serpent_general_reveal.mp4',
      'serpent_route_ending.mp4',
      'shadow_signs.mp4',
      'valmir_route_fork.mp4',
      'witnesses_encounter.mp4',
    ]);
  });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { combatConfigs, dialogues } from './content';
import { getAvailableRunNodes } from './runSystem';
import { createInitialState } from './store';
import { resolveCampaignPresentation } from '../journey/JourneyPresentationPolicy';

const SOURCE = readFileSync(resolve(process.cwd(), 'src/game/GameApp.ts'), 'utf8');
const STAGE = readFileSync(resolve(process.cwd(), 'src/cinematics/NarrativeStage.ts'), 'utf8');
const TABLEAUX = readFileSync(resolve(process.cwd(), 'src/cinematics/NarrativeTableau.ts'), 'utf8');

function method(name: string): string {
  const start = SOURCE.indexOf(name);
  expect(start, `missing ${name}`).toBeGreaterThan(-1);
  const next = SOURCE.indexOf('\n  private ', start + name.length);
  return SOURCE.slice(start, next === -1 ? SOURCE.length : next);
}

describe('CIN-6.7 NarrativeStage campaign integration', () => {
  it('keeps production on TravelView and accepts both DEV selectors', () => {
    expect(resolveCampaignPresentation({ search: '', dev: true })).toBe('travel');
    expect(resolveCampaignPresentation({ search: '?journey=cinematic', dev: true })).toBe('journey');
    expect(resolveCampaignPresentation({ search: '?presentation=narrative', dev: true })).toBe('journey');
    expect(resolveCampaignPresentation({ search: '?presentation=narrative', dev: false })).toBe('travel');
    expect(SOURCE).toContain('private readonly travel: TravelView');
    expect(SOURCE).toContain('this.travel = new TravelView({');
    expect(method('private async failJourneyToTravel')).toContain('await this.enterTravel()');
  });

  it('presents route boundaries in NARRATIVE mode without changing RunSystem options', () => {
    const enter = method('private async enterJourney');
    expect(enter).toContain("this.setMode('NARRATIVE')");
    expect(enter).not.toContain("this.setMode('TRAVEL')");
    const boundary = method('private async runJourneyBoundary');
    expect(boundary).toContain("while (this.mode === 'NARRATIVE')");
    expect(boundary).toContain('available = getAvailableRunNodes(this.state)');
    expect(boundary).toContain('await this.commitRunNodeChoice(outcome.id)');
    expect(SOURCE.split('enterRunNode(')).toHaveLength(2);
  });

  it('keeps Camp Departure as one lightweight authoritative successor', () => {
    const state = createInitialState();
    expect(state.run.currentNodeId).toBe('lion-camp');
    expect(getAvailableRunNodes(state).map(({ id, label }) => ({ id, label }))).toEqual([
      { id: 'lion-audience', label: 'Audience d’Alaric' },
    ]);
    expect(TABLEAUX).toContain("presentationKey: 'node:lion-camp:arrival'");
    expect(TABLEAUX).not.toContain("label: 'Audience d’Alaric'");
  });

  it('keeps the Valmir fork option order and semantics authoritative', () => {
    const state = createInitialState();
    state.run.currentNodeId = 'lion-valmir-road';
    state.currentNodeId = 'lion-valmir-road';
    expect(getAvailableRunNodes(state).map(({ id, label }) => ({ id, label }))).toEqual([
      { id: 'lion-second-trial-event', label: 'Vieux sanctuaire' },
      { id: 'lion-second-trial-combat', label: 'Barrage renforcé' },
    ]);
    expect(TABLEAUX).toContain("presentationKey: 'node:lion-valmir-road:arrival'");
    expect(TABLEAUX).not.toContain("label: 'Vieux sanctuaire'");
    expect(TABLEAUX).not.toContain("label: 'Barrage renforcé'");
  });

  it('separates reveal video, held dialogue and static tableau ownership', () => {
    const dialogue = method('private async playNarrativeDialogue');
    expect(dialogue).toContain('createNarrativeDialogueResolver(sequence, options.tableau, {');
    expect(dialogue).toContain('mediaMode: this.narrativeMediaMode');
    expect(dialogue).toContain("hasMovingMedia: presentationBeat?.mode === 'CINEMATIC_HOLD'");
    expect(dialogue).toContain('validateDialogueCast(');
    expect(dialogue).toContain('await stage.presentCinematicBeat(videoBeat');
    expect(dialogue).toContain('await stage.enterCinematicHold(presentationBeat');
    expect(dialogue).toContain('stage.releaseFreeze()');
    expect(dialogue).toContain("mode: 'narrative-stage'");
    expect(dialogue).toContain('root: stage.dialogueLayer');
    expect(STAGE).not.toMatch(/GameState|enterRunNode|combatConfigs|applyEffects|changeReputation|SaveRepository/);
  });

  it('combines the real forest threat media and pre-combat dialogue before clean combat', () => {
    for (const combatId of ['forest_ambush', 'wolf_pack']) {
      const config = combatConfigs.get(combatId)!;
      expect(config.preCombatDialogueId).toBe('pre_opening_trail');
      expect(config.postCombatDialogueId).toBe('post_opening_trail');
    }
    const start = method('private async startCombat');
    expect(start).toContain("resolveCin6aJourneyTrigger({ hook: 'beforeCombat', combatId })");
    expect(start).toContain("resolveCin6cJourneyTrigger(\n          { hook: 'beforeCombat', combatId }");
    expect(start).toContain('await this.playDialogue(config.preCombatDialogueId, node.label, {');
    expect(start).toContain('preserveBackdrop: false');
    expect(start).toContain('this.activeNarrativeStage?.prepareGlobalHandoff()');
    const task = start.slice(start.indexOf('task: async () => {'));
    expect(task.indexOf('this.disposeJourney()')).toBeLessThan(task.indexOf("this.setMode('COMBAT')"));
    expect(task.indexOf('this.disposeNarrativeStage()')).toBeLessThan(task.indexOf("this.setMode('COMBAT')"));
    expect(task).toContain('this.chrome.replaceChildren()');
  });

  it('keeps the prior narrative surface under the shared transition for journey and combat handoffs', () => {
    const journey = method('private async enterJourney');
    expect(journey.indexOf('this.activeNarrativeStage?.prepareGlobalHandoff()')).toBeLessThan(journey.indexOf('await sceneTransition.run({'));
    const task = journey.slice(journey.indexOf('task: async () => {'));
    expect(task.indexOf('this.disposeNarrativeStage()')).toBeLessThan(task.indexOf("this.setMode('NARRATIVE')"));
    expect(STAGE).toContain("this.element.classList.add('narrative-stage--handoff')");
    expect(STAGE).toContain("this.element.dataset.narrativeInteraction = 'LOCKED'");
  });

  it('returns victory immediately to canonical aftermath and then NarrativeStage', () => {
    expect(dialogues.get('post_opening_trail')?.steps.map((step) => step.actorId)).toEqual(['kestrel', 'alistair', 'maelor']);
    const resolveCombat = method('private async resolveCombat');
    const progress = resolveCombat.indexOf('applyCombatProgress(this.state, result, encounterLimit)');
    const rewards = resolveCombat.indexOf('addTemporaryLoot(this.state.run, { gold: rewards.gold })');
    const resolved = resolveCombat.indexOf('this.markResolved(node.id)');
    const postDialogue = resolveCombat.lastIndexOf('await this.playDialogue(combatConfig.postCombatDialogueId, node.label)');
    const nextStage = resolveCombat.lastIndexOf('await this.enterCampaignPresentation()');
    expect(progress).toBeGreaterThan(-1);
    expect(rewards).toBeGreaterThan(progress);
    expect(resolved).toBeGreaterThan(rewards);
    expect(postDialogue).toBeGreaterThan(resolved);
    expect(nextStage).toBeGreaterThan(postDialogue);
    expect(resolveCombat).not.toContain('this.showTravel()');
    expect(resolveCombat).not.toContain('this.enterTravel()');
  });

  it('keeps defeat on the authoritative checkpoint rule', () => {
    const resolveCombat = method('private async resolveCombat');
    const defeat = resolveCombat.slice(resolveCombat.indexOf('if (!result.victory)'), resolveCombat.indexOf('const encounterLimit'));
    expect(defeat).toContain('this.state = this.saves.loadAuto() ?? this.state');
    expect(defeat).toContain('failRunToCheckpoint(this.state)');
    expect(defeat).toContain('this.saves.saveAuto(this.state)');
    expect(defeat).toContain('await this.enterCampaignPresentation()');
    expect(defeat).not.toContain('this.enterTravel()');
  });

  it('does not duplicate combat result, reward, dialogue effect, or route commit owners', () => {
    expect(SOURCE.match(/private async resolveCombat\(/g)).toHaveLength(1);
    expect(SOURCE.match(/applyCombatProgress\(this\.state, result, encounterLimit\)/g)).toHaveLength(1);
    expect(SOURCE.match(/private async applyEffects\(/g)).toHaveLength(1);
    expect(SOURCE.match(/private async commitRunNodeChoice\(/g)).toHaveLength(1);
    expect(STAGE).not.toMatch(/CombatResult|NarrativeEffect|RunNode|DialogueChoice/);
  });
});

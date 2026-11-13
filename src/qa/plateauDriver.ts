/**
 * Set 1.20.0, post-demo — QA driver of a chronicle chapter: the Lion, the Bear, the Dragon, the Scorpion, the final act.
 *
 * Plays a chapter through the real owners: RunSystem for movement, refuges, guardians, the closing of the plateau and
 * the campaign record; the game's dialogue resolution for every scene, state-built ones included; the plateau finale
 * for the judgement. Since OD-2026-11-13-F (Q1) it applies every dialogue effect through `applyNarrativeEffect`, the
 * function GameApp applies, resolves each answer as the dialogue view does (`resolveContestOutcome`) and follows
 * GameApp's order for a POI: its content, then its contextual scenes, then the Lion's reputation event. The Lion is
 * played from a new chronicle, the later chapters from the save the previous one leaves. It stands in for the tactical
 * runtime only by declaring each fight won. A policy chooses each answer by the durable fact it records, so a scenario
 * reads as the choices a player makes.
 *
 * QA tooling: it never runs in the game and owns no truth.
 */
import { combatVictoryFacts, continueCampaign, pendingPlateauFinaleCombat, plateauEpilogueDialogueId, plateauFinaleOf, runPlateauId } from '../game/plateauProgression';
import { resolveGameAteRules, resolveGameDialogue } from '../game/contextualDialogueContent';
import { ateSeenFlag } from '../game/contextualDialogue';
import { isChoiceBlocked, resolveContestOutcome } from '../game/contestResolution';
import { selectGameReputationEvent } from '../game/reputationEventContent';
import { recordReputationEventSelection } from '../game/reputationEventDirector';
import { anyCombatConfig, playableCombatConfig } from '../game/playableContent';
import { changeReputation, getReputationRule } from '../game/reputation';
import { applyNarrativeEffect } from '../game/narrativeEffects';
import { createPoiChestAdapter } from '../game/poiContentAdapters';
import { createInitialState } from '../game/store';
import { resolveRefugePresentation } from '../ui/RefugePresentation';
import {
  commitPoiEliteFight,
  createRunState,
  creditRunReward,
  enterPoi,
  getRunNode,
  isPoiNeutralized,
  resolvePoiEliteVictory,
  secureRunLoot,
  selectPoiMap,
  settlePoiNavigation,
  travelToResolvedPoi,
} from '../game/runSystem';
import { requirePlateauCampaign, type CampaignChapterId } from '../campaign/plateaux/PlateauRegistry';
import {
  finalActCombatConfig, isEpilogueCombat, isTournamentNodeId, nextEpilogueStep, nextTournamentStep, tournamentBoard,
} from '../game/finalAct';
import { FINALE_TOURNAMENT_ARRIVAL, type TournamentEntry } from '../campaign/plateaux/finale/finaleTournament';
import finaleMap from '../campaign/consequences/finale.consequences.json';
import lionMap from '../campaign/consequences/lion.consequences.json';
import type { CombatConfig, DialogueChoice, DialogueSequence, GameState, NarrativeEffect, RunNode } from '../game/types';

/** A chapter the driver plays: the Lion, a post-demo Seal plateau, or the final act. */
export type DrivenChapterId = CampaignChapterId;

export type FinaleIntent = 'claim_recognition' | 'request_trial';

export interface PlateauScenario {
  name: string;
  /** For a dialogue, the fact its answer must record; otherwise the default preference applies. */
  answers?: Readonly<Record<string, string>>;
  /** Preferred facts, in order, when a dialogue has no explicit answer. */
  prefer: 'merit' | 'greed';
  intent: FinaleIntent;
  /** Optional guardian chests to take on the way, after the route POI that opens them. */
  guardianChests?: readonly string[];
  /** A fork's branch by its prefix (`dragon-second-trial`, or `finale-fork`), when it differs from the preference's default. */
  forks?: Readonly<Record<string, 'event' | 'combat'>>;
  /** QA only (Lot 5): runs once the breach is won, before the act closes and R4 reads the reputation; for the gauge's limits. */
  beforeClosing?: (state: GameState) => void;
}

export interface PlayedLine { dialogueId: string; stepId: string; speaker: string; text: string }

export interface PlateauPlaythrough {
  state: GameState;
  lines: PlayedLine[];
  decisions: { dialogueId: string; stepId: string; text: string }[];
  fights: string[];
  /** Every fight as RunSystem prepared it before the tactical runtime (the final act's supports and enemy-clan foes). */
  configs: CombatConfig[];
  /** The Lion's reputation events (R4) played after a POI, as GameApp plays them. */
  reputationEvents: string[];
  /** The route POIs in the order the company entered them. */
  visited: string[];
  reputationStart: number;
}

function flagsSetBy(choice: DialogueChoice): string[] {
  return choice.effects.flatMap((effect) => effect.type === 'setFlag' && effect.value ? [effect.key] : []);
}

const choosesIntent = (choice: DialogueChoice, intent: FinaleIntent) => choice.effects.some((effect) =>
  (effect.type === 'resolvePlateauFinale' || effect.type === 'resolveLionFinale') && effect.intent === intent);

/** The honour and force facts a consequence map names for its chapter's major choices. */
function pathFacts(map: { majorChoices: readonly { options: readonly { path: string; sets: readonly string[] }[] }[] }, path: string): Set<string> {
  return new Set(map.majorChoices.flatMap((choice) => choice.options).filter((option) => option.path === path).flatMap((option) => option.sets));
}

interface PolicyFacts { merits: ReadonlySet<string>; greed: ReadonlySet<string> }
const POLICY_FACTS = new Map<DrivenChapterId, PolicyFacts>();

/** The facts each policy prefers in a chapter: its honour and its force facts. */
function policyFacts(chapterId: DrivenChapterId): PolicyFacts {
  const known = POLICY_FACTS.get(chapterId);
  if (known) return known;
  let facts: PolicyFacts;
  if (chapterId === 'finale' || chapterId === 'lion') {
    // The Lion's and the final act's consequence maps name the facts of each policy in their honour and force options.
    const map = chapterId === 'lion' ? lionMap : finaleMap;
    facts = { merits: pathFacts(map, 'honour'), greed: pathFacts(map, 'force') };
  } else {
    const finale = plateauFinaleOf(chapterId)!;
    facts = {
      merits: new Set([...finale.deeds.filter((deed) => deed.kind === 'merit').map((deed) => deed.flag),
        finale.honourFact, finale.witnesses.supportiveFlag, finale.evidence.flag]),
      greed: new Set([...finale.deeds.filter((deed) => deed.kind !== 'merit').map((deed) => deed.flag),
        ...finale.forceFacts, finale.witnesses.silencedFlag]),
    };
  }
  POLICY_FACTS.set(chapterId, facts);
  return facts;
}

/**
 * The answer a scenario gives at a dialogue step: the judgement's intent, an explicit answer, else the first open answer
 * that records a fact of its preference. An answer the dialogue view would refuse is never chosen; a contested answer is
 * chosen only while it is open.
 */
export function chooseAnswer(state: GameState, scenario: PlateauScenario, sequence: DialogueSequence, stepId: string,
  choices: readonly DialogueChoice[]): DialogueChoice {
  const open = choices.filter((choice) => !isChoiceBlocked(choice, state));
  if (!open.length) throw new Error(`No available answer in ${sequence.id}:${stepId}`);
  const finaleChoice = open.find((choice) => choosesIntent(choice, scenario.intent));
  if (finaleChoice) return finaleChoice;
  const wanted = scenario.answers?.[sequence.id];
  if (wanted) {
    const answer = open.find((choice) => flagsSetBy(choice).includes(wanted));
    if (!answer) throw new Error(`${sequence.id}: no available answer records '${wanted}'`);
    return answer;
  }
  const { merits, greed } = policyFacts(runPlateauId(state));
  const preferred = scenario.prefer === 'merit' ? merits : greed;
  return open.find((choice) => flagsSetBy(choice).some((flag) => preferred.has(flag))) ?? open[0]!;
}

/** A fork whose branches share no prefix (the final act's): the event for merit, the fight for greed. */
function forkByType(state: GameState, scenario: PlateauScenario, nodeIds: readonly string[], key: string): string {
  const branches = selectPoiMap(state).nodes.filter((node) => node.canMove && nodeIds.includes(node.id));
  const wanted = scenario.forks?.[key] ?? (scenario.prefer === 'merit' ? 'event' : 'combat');
  return branches.find((node) => node.kind === wanted || (wanted === 'combat' && node.kind === 'elite'))?.id
    ?? branches.find((node) => (wanted === 'event') === (node.kind !== 'combat'))?.id ?? branches[0]!.id;
}

/** A fork: the first branch RunSystem lets the company move to that the scenario's policy would take. */
function forkBranch(state: GameState, scenario: PlateauScenario, prefix: string): string {
  const branches = selectPoiMap(state).nodes.filter((node) => node.canMove && node.id.startsWith(prefix)).map((node) => node.id);
  const event = branches.find((id) => id.endsWith('-event'));
  const combat = branches.find((id) => id.endsWith('-combat'));
  const wanted = scenario.forks?.[prefix.replace(/-$/, '')] ?? (scenario.prefer === 'merit' ? 'event' : 'combat');
  return (wanted === 'event' ? event : combat) ?? branches[0]!;
}

/** The POI a route step names for this scenario: the step's own POI, or the branch it takes at a fork. */
function stepPoi(state: GameState, scenario: PlateauScenario, step: string | readonly string[]): string {
  if (Array.isArray(step)) return forkByType(state, scenario, step, 'finale-fork');
  return (step as string).endsWith('-trial') ? forkBranch(state, scenario, `${step}-`) : step as string;
}

/** The route POI a scenario moves to next on the map of the current chapter, or null once the route is resolved. */
export function nextRoutePoi(state: GameState, scenario: PlateauScenario): string | null {
  const chapterId = runPlateauId(state);
  const step = playOrder(state, chapterId).find((candidate) => !stepResolved(state, candidate));
  return step === undefined ? null : stepPoi(state, scenario, step);
}

class PlateauDriver {
  readonly lines: PlayedLine[] = [];
  readonly decisions: PlateauPlaythrough['decisions'] = [];
  readonly fights: string[] = [];
  readonly configs: CombatConfig[] = [];
  readonly reputationEvents: string[] = [];
  readonly visited: string[] = [];
  private pendingCombatId: string | null = null;

  constructor(private readonly state: GameState, private readonly scenario: PlateauScenario) {}

  /** As GameApp: the state change is the game's own; a fight an effect names waits for the dialogue's end. */
  private applyEffects(effects: readonly NarrativeEffect[]): void {
    for (const effect of effects) {
      const outcome = applyNarrativeEffect(this.state, effect);
      if (outcome.combatId !== undefined) this.pendingCombatId = outcome.combatId;
    }
  }

  playDialogue(dialogueId: string): void {
    const resolved = resolveGameDialogue(dialogueId, this.state);
    if (!resolved) throw new Error(`Missing dialogue '${dialogueId}'`);
    const sequence = resolved.sequence;
    let step = sequence.steps[0];
    const seen = new Set<string>();
    while (step && !seen.has(step.id)) {
      seen.add(step.id);
      this.lines.push({ dialogueId, stepId: step.id, speaker: step.speaker, text: step.text });
      this.applyEffects(step.effects);
      let next = step.next;
      if (step.choices?.length) {
        const choice = chooseAnswer(this.state, this.scenario, sequence, step.id, step.choices);
        this.decisions.push({ dialogueId, stepId: step.id, text: choice.text });
        const outcome = resolveContestOutcome(choice, this.state);
        if (outcome.type === 'blocked') throw new Error(`${dialogueId}:${step.id}: the chosen answer is refused`);
        this.applyEffects(outcome.effects);
        next = outcome.next;
      }
      step = next ? sequence.steps.find((candidate) => candidate.id === next) : undefined;
    }
  }

  /** A won fight, resolved as GameApp resolves it: pre-combat scene, rewards, victory facts, aftermath. */
  private fight(combatId: string, node: RunNode): void {
    const playable = playableCombatConfig(combatId);
    if (!playable) throw new Error(`Missing fight '${combatId}'`);
    const config = finalActCombatConfig(this.state, playable);
    if (config.preCombatDialogueId) {
      this.playDialogue(config.preCombatDialogueId);
      if (this.pendingCombatId) { this.flush(node); return; }
    }
    this.fights.push(combatId);
    this.configs.push(config);
    // As GameApp: a Tournament fight belongs to the board, the Fear ending's last stand to the epilogue, not to the map.
    const onBoard = isTournamentNodeId(node.id);
    const inEpilogue = isEpilogueCombat(combatId);
    if (!onBoard && !inEpilogue) this.state.currentNodeId = node.id;
    creditRunReward(this.state, { gold: config.rewards.gold });
    for (const [itemId, quantity] of Object.entries(config.rewards.materials ?? {})) {
      creditRunReward(this.state, { category: 'materials', itemId, quantity });
    }
    changeReputation(this.state, config.rewards.reputation, `combat:${combatId}`);
    Object.assign(this.state.flags, combatVictoryFacts(combatId));
    if (inEpilogue) return;
    if (!onBoard) this.markResolved(node.id);
    if (node.type === 'boss') {
      this.state.run.status = 'completed';
      secureRunLoot(this.state);
      if (config.postCombatDialogueId) {
        this.playDialogue(config.postCombatDialogueId);
        if (this.pendingCombatId) { this.flush(node); return; }
      }
      this.scenario.beforeClosing?.(this.state);
      this.playDialogue(plateauEpilogueDialogueId(this.state));
      this.playEpilogue(node);
      return;
    }
    if (config.postCombatDialogueId) {
      this.playDialogue(config.postCombatDialogueId);
      if (this.pendingCombatId) { this.flush(node); return; }
    }
    // A Tournament fight returns to the board, which names the next step itself.
    if (!onBoard) this.postNode(node);
  }

  /** As GameApp (Lot 5): each epilogue step RunSystem names, until the chronicle closes. */
  private playEpilogue(node: RunNode): void {
    for (let guard = 0; guard < 8; guard += 1) {
      const step = nextEpilogueStep(this.state);
      if (!step) return;
      if (step.kind === 'combat') this.fight(step.combatId, node);
      else this.playDialogue(step.dialogueId);
    }
    throw new Error('The epilogue did not close.');
  }

  /** The fight a dialogue named, as GameApp's flushPendingCombat. Returns true when one was fought. */
  private flush(node: RunNode): boolean {
    const combatId = this.pendingCombatId;
    this.pendingCombatId = null;
    if (!combatId) return false;
    this.fight(combatId, node);
    return true;
  }

  private markResolved(nodeId: string): void {
    if (!this.state.resolvedNodeIds.includes(nodeId)) this.state.resolvedNodeIds.push(nodeId);
  }

  /** As GameApp's playPostNodeNarrative: the contextual scenes, then the reputation event, each of which may lead to a fight. */
  private postNode(node: RunNode): void {
    for (const rule of resolveGameAteRules(node.id, this.state)) {
      this.playDialogue(rule.dialogueId);
      if (rule.once) this.state.flags[ateSeenFlag(rule)] = true;
    }
    if (this.flush(node)) return;
    const selection = selectGameReputationEvent(node.id, this.state);
    if (selection?.selectedEvent) {
      this.playDialogue(selection.selectedEvent.dialogueId);
      recordReputationEventSelection(this.state, selection);
      this.reputationEvents.push(selection.selectedEvent.dialogueId);
    }
    this.flush(node);
  }

  /** As GameApp's resolveRunNode for an entered POI: a chest, a refuge, a fight, or its scene. */
  resolveNode(node: RunNode): void {
    const pendingFinale = node.type === 'boss' ? pendingPlateauFinaleCombat(this.state) : null;
    if (node.type !== 'refuge' && !pendingFinale
      && (this.state.resolvedNodeIds.includes(node.id) || isPoiNeutralized(this.state, node.id))) return;
    if (node.type === 'chest') { createPoiChestAdapter()(this.state, node.id); return; }
    if (node.type === 'refuge') {
      const securedFlag = `refugeSecured:${node.id}`;
      if (!this.state.flags[securedFlag]) {
        if (getReputationRule(this.state.reputation).min >= 60) {
          creditRunReward(this.state, { category: 'consumables', itemId: 'potion', quantity: 1 });
        }
        secureRunLoot(this.state);
        this.state.flags[securedFlag] = true;
      }
      const gathering = resolveRefugePresentation(node)?.gatheringDialogueId;
      if (gathering && !this.state.flags[`clanArrival:${node.id}`]) {
        this.playDialogue(gathering);
        this.state.flags[`clanArrival:${node.id}`] = true;
      }
      this.markResolved(node.id);
      this.postNode(node);
      return;
    }
    if (node.type === 'shop') { this.markResolved(node.id); return; }
    if (pendingFinale) { this.fight(pendingFinale, node); return; }
    if ((node.type === 'combat' || node.type === 'boss') && anyCombatConfig(node.contentId)) { this.fight(node.contentId, node); return; }
    this.playDialogue(node.contentId);
    if (this.flush(node)) return;
    this.markResolved(node.id);
    this.postNode(node);
  }

  /** Arrives at a POI through RunSystem and resolves its content as GameApp routes it by type. */
  visit(nodeId: string): void {
    settlePoiNavigation(this.state);
    const entered = enterPoi(this.state, nodeId) ?? travelToResolvedPoi(this.state, nodeId);
    if (!entered) throw new Error(`RunSystem refused ${nodeId} from ${this.state.run.currentNodeId}`);
    this.state.currentNodeId = this.state.run.currentNodeId;
    if ('interception' in entered && entered.interception) {
      const encounter = this.state.run.poiExpedition!.encounter!;
      const combatId = commitPoiEliteFight(this.state, encounter.id)!;
      this.fights.push(combatId);
      if (!resolvePoiEliteVictory(this.state, encounter.id, { combatId, victory: true, participants: [], unitHealth: {} })) {
        throw new Error(`Guardian victory refused at ${nodeId}`);
      }
      this.visit(nodeId);
      return;
    }
    this.visited.push(nodeId);
    // As GameApp: an arrival that activates nothing (a resolved POI, refuges aside) is only a place to stand.
    if (!entered.activate) return;
    this.resolveNode(entered.node);
  }

  /** A post-demo plateau's first POI, played on arrival as GameApp plays it after the campaign continues. */
  arrive(): void {
    this.resolveNode(getRunNode(this.state.run)!);
  }

  /** As GameApp's opening once the prologue ends: the act's opening scene and the camp's departure, then the map. */
  openLion(): void {
    this.state.flags.prologueSeen = true;
    this.playDialogue('acte_ouverture');
    this.playDialogue(getRunNode(this.state.run)!.contentId);
  }

  /**
   * The final act's Tournament, played as GameApp plays its board: its opening scene once, then each step RunSystem names
   * next (a fight, the scene that opens an entry, the scene after a won fight), up to (not into) `stopBefore`.
   * Returns false when it stopped early.
   */
  playTournament(stopBefore?: string): boolean {
    if (!tournamentBoard(this.state).entered) this.playDialogue(FINALE_TOURNAMENT_ARRIVAL.dialogueId);
    for (let step = nextTournamentStep(this.state); step; step = nextTournamentStep(this.state)) {
      if (step.entry.nodeId === stopBefore) return false;
      const node = boardNode(step.entry);
      if (step.action === 'fight') { this.fight(step.entry.combatId, node); continue; }
      this.playDialogue(step.action === 'opening' ? step.entry.openingDialogueId! : step.entry.afterDialogueId!);
      this.flush(node);
    }
    return true;
  }
}

/** A Tournament entry as the place its fight and scenes happen (not a POI). */
function boardNode(entry: TournamentEntry): RunNode {
  return { id: entry.nodeId, type: 'combat', depth: 0, links: [], contentId: entry.combatId, label: entry.label, icon: '⚔', x: 0, z: 0 };
}

/**
 * The route in play order, read from the run's own graph without its optional POIs: one entry per depth, a fork named
 * by its common prefix (`bear-first-trial`) or its nodes.
 */
function playOrder(state: GameState, chapterId: DrivenChapterId): (string | readonly string[])[] {
  const optional = new Set(requirePlateauCampaign(chapterId).optionalNodeIds);
  const route = state.run.graph.nodes.filter((node) => !optional.has(node.id));
  const depths = [...new Set(route.map((node) => node.depth))].sort((a, b) => a - b).slice(1);
  return depths.map((depth) => {
    const nodes = route.filter((node) => node.depth === depth);
    if (nodes.length === 1) return nodes[0]!.id;
    return nodes.every((node) => /-(event|combat)$/.test(node.id)) ? nodes[0]!.id.replace(/-(event|combat)$/, '') : nodes.map((node) => node.id);
  });
}

/** The guardian chest each route POI opens: the chest a guardian holds, after the route POI it requires. */
function chestsAfter(chapterId: DrivenChapterId): Record<string, string> {
  const topology = requirePlateauCampaign(chapterId).topology;
  return Object.fromEntries(topology.guardians.flatMap((guardian) => {
    const chest = topology.optionalPois.find((poi) => poi.id === guardian.spawnPosition);
    const opener = chest?.prerequisiteResolved[0];
    return chest && opener ? [[opener, chest.id]] : [];
  }));
}

/** A route step the saved state already resolved: its POI, or one branch of its fork. */
function stepResolved(state: GameState, step: string | readonly string[]): boolean {
  const ids = Array.isArray(step) ? step : [step as string, `${step}-event`, `${step}-combat`];
  return ids.some((id) => state.resolvedNodeIds.includes(id));
}

/** Walks the chapter's route past the steps already resolved, up to (not into) `stopBefore`. */
function walkRoute(driver: PlateauDriver, state: GameState, chapterId: DrivenChapterId, scenario: PlateauScenario, stopBefore?: string): void {
  const chests = chestsAfter(chapterId);
  for (const step of playOrder(state, chapterId)) {
    if (step === stopBefore || (Array.isArray(step) && step.includes(stopBefore ?? ''))) break;
    if (stepResolved(state, step)) continue;
    driver.visit(stepPoi(state, scenario, step));
    const chest = typeof step === 'string' ? chests[step] : undefined;
    if (chest && scenario.guardianChests?.includes(chest)) {
      driver.visit(chest);
      driver.visit(step as string);
    }
  }
}

/** The chapter as it stands when GameApp next returns to the campaign surface and saves: the map settled first. */
function playthrough(driver: PlateauDriver, state: GameState, reputationStart: number): PlateauPlaythrough {
  settlePoiNavigation(state);
  return { state, lines: driver.lines, decisions: driver.decisions, fights: driver.fights, configs: driver.configs,
    reputationEvents: driver.reputationEvents, visited: driver.visited, reputationStart };
}

/**
 * Plays the Lion from a new chronicle, as GameApp starts one, to its epilogue under a scenario, or up to (not into)
 * `stopBefore`. The finished state is the one GameApp saves as the chronicle ends; the Bear continues from it.
 */
export function playLion(scenario: PlateauScenario, seed = 20261113, stopBefore?: string): PlateauPlaythrough {
  const state = createInitialState();
  const run = createRunState(seed);
  Object.assign(state, { run, currentNodeId: run.currentNodeId, visitedNodeIds: [...run.visitedNodeIds] });
  const reputationStart = state.reputation;
  const driver = new PlateauDriver(state, scenario);
  driver.openLion();
  walkRoute(driver, state, 'lion', scenario, stopBefore);
  return playthrough(driver, state, reputationStart);
}

/**
 * Plays a post-demo chapter from the completed run of the previous one to its epilogue under a scenario, or up to (not
 * into) `stopBefore`, which leaves a mid-plateau state to save and resume.
 */
export function playPlateau(chapterId: Exclude<DrivenChapterId, 'lion'>, previousEnd: GameState, scenario: PlateauScenario, seed = 20261108,
  stopBefore?: string): PlateauPlaythrough {
  const state = structuredClone(previousEnd);
  if (!continueCampaign(state, seed)) throw new Error(`The campaign did not continue into ${chapterId}.`);
  if (!state.run.id.startsWith(`${chapterId}-`)) throw new Error(`The campaign continued into ${state.run.id}, not ${chapterId}.`);
  const reputationStart = state.reputation;
  const driver = new PlateauDriver(state, scenario);
  // The final act opens on its Tournament; the capital's first POI follows once the arena is left.
  if (chapterId === 'finale' && !driver.playTournament(stopBefore)) return playthrough(driver, state, reputationStart);
  driver.arrive();
  walkRoute(driver, state, chapterId, scenario, stopBefore);
  return playthrough(driver, state, reputationStart);
}

/**
 * Resumes a chapter from a state saved mid-route (a reload of `playPlateau(…, stopBefore)` or `playLion(…, stopBefore)`),
 * as GameApp's resumeSavedCampaign does: an unresolved current POI (or a selected finale boss) plays first, then the
 * route goes on from the first step the save has not resolved, with the same scenario.
 */
export function resumeChapter(chapterId: DrivenChapterId, saved: GameState, scenario: PlateauScenario): PlateauPlaythrough {
  const state = structuredClone(saved);
  const reputationStart = state.reputation;
  const driver = new PlateauDriver(state, scenario);
  if (chapterId === 'finale' && !driver.playTournament()) return playthrough(driver, state, reputationStart);
  const current = getRunNode(state.run);
  if (current && (current.depth > 0 || chapterId !== 'lion')
    && (pendingPlateauFinaleCombat(state) !== null || (!state.resolvedNodeIds.includes(current.id)
      && !isPoiNeutralized(state, current.id) && !state.run.bypassedRouteNodeIds?.includes(current.id)))) {
    driver.resolveNode(current);
  }
  walkRoute(driver, state, chapterId, scenario);
  return playthrough(driver, state, reputationStart);
}

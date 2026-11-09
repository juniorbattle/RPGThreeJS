/**
 * Set 1.20.0, post-demo — QA driver of a built post-demo chapter (the Bear, the Dragon, the Scorpion, the final act).
 *
 * Plays a plateau from the end of the previous one to its epilogue through the real owners: RunSystem for movement, refuges,
 * guardians, the closing of the plateau and the campaign record; the game's dialogue resolution for every scene,
 * state-built ones included; the plateau finale for the judgement. It applies dialogue effects and fight rewards as
 * GameApp does, and stands in for the tactical runtime only by declaring each fight won. A policy chooses each answer
 * by the durable fact it records, so a scenario reads as the choices a player makes.
 *
 * QA tooling: it never runs in the game and owns no truth.
 */
import { combatVictoryFacts, completePlateauChronicle, continueCampaign, plateauEpilogueDialogueId, plateauFinaleOf } from '../game/plateauProgression';
import { resolvePlateauFinaleExecution, resolvePendingPlateauFinaleCombat } from '../game/plateauFinale';
import { resolveGameAteRules, resolveGameDialogue } from '../game/contextualDialogueContent';
import { selectGameReputationEvent } from '../game/reputationEventContent';
import { playableCombatConfig } from '../game/playableContent';
import { getItemCategory } from '../game/catalog';
import { changeReputation } from '../game/reputation';
import { createPoiChestAdapter } from '../game/poiContentAdapters';
import { POST_DEMO_REFUGE_GATHERINGS } from '../campaign/plateaux/postDemoRefuges';
import {
  commitPoiEliteFight,
  creditRunReward,
  enterPoi,
  getRunNode,
  resolvePoiEliteVictory,
  secureRunLoot,
  selectPoiMap,
  setClanRelation,
  settlePoiNavigation,
  travelToResolvedPoi,
} from '../game/runSystem';
import { requirePlateauCampaign } from '../campaign/plateaux/PlateauRegistry';
import type { PostDemoSealPlateauId } from '../game/plateauFinale';
import {
  completeCampaignEnding, finalActCombatConfig, isEpilogueCombat, isTournamentNodeId, nextEpilogueStep, nextTournamentStep, tournamentBoard,
} from '../game/finalAct';
import { FINALE_TOURNAMENT_ARRIVAL, type TournamentEntry } from '../campaign/plateaux/finale/finaleTournament';
import finaleMap from '../campaign/consequences/finale.consequences.json';
import type { CombatConfig, DialogueChoice, DialogueSequence, GameState, NarrativeEffect, RunNode } from '../game/types';

/** A post-demo chapter the driver plays: a Seal plateau, or the final act. */
export type DrivenChapterId = PostDemoSealPlateauId | 'finale';

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
  reputationStart: number;
}

function flagsSetBy(choice: DialogueChoice): string[] {
  return choice.effects.flatMap((effect) => effect.type === 'setFlag' && effect.value ? [effect.key] : []);
}

function available(choice: DialogueChoice, state: GameState): boolean {
  return !(choice.requiresGold !== undefined && state.gold < choice.requiresGold)
    && !(choice.requiresFlag !== undefined && !state.flags[choice.requiresFlag])
    && !(choice.excludesFlag !== undefined && state.flags[choice.excludesFlag])
    && !(choice.requiresReputationMin !== undefined && state.reputation < choice.requiresReputationMin)
    && !(choice.requiresReputationMax !== undefined && state.reputation > choice.requiresReputationMax);
}

class PlateauDriver {
  readonly lines: PlayedLine[] = [];
  readonly decisions: PlateauPlaythrough['decisions'] = [];
  readonly fights: string[] = [];
  readonly configs: CombatConfig[] = [];
  private pendingCombatId: string | null = null;
  private readonly merits: ReadonlySet<string>;
  private readonly greed: ReadonlySet<string>;

  constructor(private readonly state: GameState, private readonly scenario: PlateauScenario,
    private readonly chapterId: DrivenChapterId) {
    if (chapterId === 'finale') {
      // The final act has no judgement: its consequence map's honour and force options name the facts of each policy.
      const options = finaleMap.majorChoices.flatMap((choice) => choice.options);
      this.merits = new Set(options.filter((option) => option.path === 'honour').flatMap((option) => option.sets));
      this.greed = new Set(options.filter((option) => option.path === 'force').flatMap((option) => option.sets));
      return;
    }
    const finale = plateauFinaleOf(chapterId)!;
    this.merits = new Set([...finale.deeds.filter((deed) => deed.kind === 'merit').map((deed) => deed.flag),
      finale.honourFact, finale.witnesses.supportiveFlag, finale.evidence.flag]);
    this.greed = new Set([...finale.deeds.filter((deed) => deed.kind !== 'merit').map((deed) => deed.flag),
      ...finale.forceFacts, finale.witnesses.silencedFlag]);
  }

  private choose(sequence: DialogueSequence, stepId: string, choices: readonly DialogueChoice[]): DialogueChoice {
    const open = choices.filter((choice) => available(choice, this.state));
    if (!open.length) throw new Error(`No available answer in ${sequence.id}:${stepId}`);
    const finaleChoice = open.find((choice) => choice.effects.some((effect) =>
      effect.type === 'resolvePlateauFinale' && effect.intent === this.scenario.intent));
    if (finaleChoice) return finaleChoice;
    const wanted = this.scenario.answers?.[sequence.id];
    if (wanted) {
      const answer = open.find((choice) => flagsSetBy(choice).includes(wanted));
      if (!answer) throw new Error(`${sequence.id}: no available answer records '${wanted}'`);
      return answer;
    }
    const preferred = this.scenario.prefer === 'merit' ? this.merits : this.greed;
    return open.find((choice) => flagsSetBy(choice).some((flag) => preferred.has(flag))) ?? open[0]!;
  }

  private applyEffects(effects: readonly NarrativeEffect[]): void {
    for (const effect of effects) {
      switch (effect.type) {
        case 'setFlag': this.state.flags[effect.key] = effect.value; break;
        case 'addGold':
          if (effect.amount >= 0) creditRunReward(this.state, { gold: effect.amount });
          else this.state.gold = Math.max(0, this.state.gold - Math.abs(effect.amount));
          break;
        case 'addReputation': changeReputation(this.state, effect.amount, 'narrative'); break;
        case 'addItem':
          creditRunReward(this.state, { category: getItemCategory(effect.itemId) ?? 'consumables', itemId: effect.itemId, quantity: effect.quantity });
          break;
        case 'startCombat': this.pendingCombatId = effect.combatId; break;
        case 'setClanRelation': setClanRelation(this.state, effect.clan, effect.stance, effect.cause); break;
        case 'resolvePlateauFinale': {
          const finale = plateauFinaleOf(effect.plateauId)!;
          const existing = resolvePendingPlateauFinaleCombat(finale, this.state.flags);
          if (existing) { this.pendingCombatId = existing; break; }
          const execution = resolvePlateauFinaleExecution(finale, this.state, effect.intent);
          Object.assign(this.state.flags, execution.flagChanges);
          if (execution.reputationDelta) changeReputation(this.state, execution.reputationDelta, `${effect.plateauId}-finale`);
          this.pendingCombatId = execution.combatId;
          break;
        }
        case 'completePlateau': completePlateauChronicle(this.state, effect.plateauId); break;
        case 'completeEpilogue': completeCampaignEnding(this.state); break;
        default: throw new Error(`The Bear driver does not expect a '${effect.type}' effect.`);
      }
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
        const choice = this.choose(sequence, step.id, step.choices);
        this.decisions.push({ dialogueId, stepId: step.id, text: choice.text });
        this.applyEffects(choice.effects);
        next = choice.next;
      }
      step = next ? sequence.steps.find((candidate) => candidate.id === next) : undefined;
    }
  }

  /** A won fight, resolved as GameApp resolves it: pre-combat scene, rewards, victory facts, aftermath. */
  private fight(combatId: string, node: RunNode): void {
    const playable = playableCombatConfig(combatId);
    if (!playable) throw new Error(`Missing fight '${combatId}'`);
    const config = finalActCombatConfig(this.state, playable);
    if (config.preCombatDialogueId) this.playDialogue(config.preCombatDialogueId);
    this.fights.push(combatId);
    this.configs.push(config);
    creditRunReward(this.state, { gold: config.rewards.gold });
    for (const [itemId, quantity] of Object.entries(config.rewards.materials ?? {})) {
      creditRunReward(this.state, { category: 'materials', itemId, quantity });
    }
    changeReputation(this.state, config.rewards.reputation, `combat:${combatId}`);
    Object.assign(this.state.flags, combatVictoryFacts(combatId));
    // As GameApp: the Fear ending's last stand belongs to the epilogue, after the run has ended (Lot 5).
    if (isEpilogueCombat(combatId)) return;
    // As GameApp: a Tournament fight belongs to the board, not to the map.
    if (!isTournamentNodeId(node.id)) this.markResolved(node.id);
    if (node.type === 'boss') {
      this.state.run.status = 'completed';
      secureRunLoot(this.state);
      if (config.postCombatDialogueId) this.playDialogue(config.postCombatDialogueId);
      this.scenario.beforeClosing?.(this.state);
      this.playDialogue(plateauEpilogueDialogueId(this.state));
      this.playEpilogue(node);
      return;
    }
    if (config.postCombatDialogueId) this.playDialogue(config.postCombatDialogueId);
    this.flush(node);
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

  private flush(node: RunNode): void {
    const combatId = this.pendingCombatId;
    this.pendingCombatId = null;
    if (combatId) this.fight(combatId, node);
  }

  private markResolved(nodeId: string): void {
    if (!this.state.resolvedNodeIds.includes(nodeId)) this.state.resolvedNodeIds.push(nodeId);
  }

  private postNode(node: RunNode): void {
    for (const rule of resolveGameAteRules(node.id, this.state)) this.playDialogue(rule.dialogueId);
    const event = selectGameReputationEvent(node.id, this.state);
    if (event?.selectedEvent) throw new Error(`A Lion reputation event fired at ${node.id}`);
  }

  /** Arrives at a POI through RunSystem and resolves its content as GameApp routes it by type. */
  visit(nodeId: string): void {
    settlePoiNavigation(this.state);
    const entered = enterPoi(this.state, nodeId) ?? travelToResolvedPoi(this.state, nodeId);
    if (!entered) throw new Error(`RunSystem refused ${nodeId} from ${this.state.run.currentNodeId}`);
    this.state.currentNodeId = this.state.run.currentNodeId;
    const node = getRunNode(this.state.run, nodeId)!;
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
    // As GameApp: a resolved POI (refuges aside) is only a place to stand; its content never plays again.
    if (node.type !== 'refuge' && this.state.resolvedNodeIds.includes(node.id)) return;
    if (node.type === 'chest') { createPoiChestAdapter()(this.state, node.id); return; }
    if (node.type === 'refuge') {
      if (!this.state.flags[`refugeSecured:${node.id}`]) { secureRunLoot(this.state); this.state.flags[`refugeSecured:${node.id}`] = true; }
      const gathering = POST_DEMO_REFUGE_GATHERINGS[this.chapterId]?.[node.id];
      if (gathering && !this.state.flags[`clanArrival:${node.id}`]) {
        this.playDialogue(gathering);
        this.state.flags[`clanArrival:${node.id}`] = true;
      }
      this.markResolved(node.id);
      this.postNode(node);
      return;
    }
    if ((node.type === 'combat' || node.type === 'boss') && playableCombatConfig(node.contentId)) { this.fight(node.contentId, node); this.postNode(node); return; }
    this.playDialogue(node.contentId);
    if (this.pendingCombatId) { this.flush(node); this.postNode(node); return; }
    this.markResolved(node.id);
    this.postNode(node);
  }

  /** The plateau's first POI, played on arrival as GameApp plays it after the campaign continues. */
  arrive(): void {
    const start = getRunNode(this.state.run)!;
    this.playDialogue(start.contentId);
    this.markResolved(start.id);
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

  /** A fork whose branches share no prefix (the final act's): the event for merit, the fight for greed. */
  forkByType(nodeIds: readonly string[], key: string): string {
    const branches = selectPoiMap(this.state).nodes.filter((node) => node.canMove && nodeIds.includes(node.id));
    const wanted = this.scenario.forks?.[key] ?? (this.scenario.prefer === 'merit' ? 'event' : 'combat');
    return branches.find((node) => node.kind === wanted || (wanted === 'combat' && node.kind === 'elite'))?.id
      ?? branches.find((node) => (wanted === 'event') === (node.kind !== 'combat'))?.id ?? branches[0]!.id;
  }

  /** A fork: the first branch RunSystem lets the company move to that the scenario's policy would take. */
  forkBranch(prefix: string): string {
    const branches = selectPoiMap(this.state).nodes.filter((node) => node.canMove && node.id.startsWith(prefix)).map((node) => node.id);
    const event = branches.find((id) => id.endsWith('-event'));
    const combat = branches.find((id) => id.endsWith('-combat'));
    const wanted = this.scenario.forks?.[prefix.replace(/-$/, '')] ?? (this.scenario.prefer === 'merit' ? 'event' : 'combat');
    return (wanted === 'event' ? event : combat) ?? branches[0]!;
  }
}

/** A Tournament entry as the place its fight and scenes happen (not a POI). */
function boardNode(entry: TournamentEntry): RunNode {
  return { id: entry.nodeId, type: 'combat', depth: 0, links: [], contentId: entry.combatId, label: entry.label, icon: '⚔', x: 0, z: 0 };
}

/** The route in play order: one entry per depth, a fork named by its common prefix (`bear-first-trial`) or its nodes. */
function playOrder(chapterId: DrivenChapterId): (string | readonly string[])[] {
  const route = requirePlateauCampaign(chapterId).topology.route ?? [];
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

/**
 * Plays a plateau from the completed run of the previous one to its epilogue under a scenario, or up to (not into)
 * `stopBefore`, which leaves a mid-plateau state to save and resume.
 */
export function playPlateau(chapterId: DrivenChapterId, previousEnd: GameState, scenario: PlateauScenario, seed = 20261108,
  stopBefore?: string): PlateauPlaythrough {
  const state = structuredClone(previousEnd);
  if (!continueCampaign(state, seed)) throw new Error(`The campaign did not continue into ${chapterId}.`);
  if (!state.run.id.startsWith(`${chapterId}-`)) throw new Error(`The campaign continued into ${state.run.id}, not ${chapterId}.`);
  const reputationStart = state.reputation;
  const driver = new PlateauDriver(state, scenario, chapterId);
  const chests = chestsAfter(chapterId);
  const done = (): PlateauPlaythrough => ({ state, lines: driver.lines, decisions: driver.decisions, fights: driver.fights,
    configs: driver.configs, reputationStart });
  // The final act opens on its Tournament; the capital's first POI follows once the arena is left.
  if (chapterId === 'finale' && !driver.playTournament(stopBefore)) return done();
  driver.arrive();
  for (const step of playOrder(chapterId)) {
    if (step === stopBefore || (Array.isArray(step) && step.includes(stopBefore ?? ''))) break;
    const nodeId = Array.isArray(step) ? driver.forkByType(step, 'finale-fork')
      : (step as string).endsWith('-trial') ? driver.forkBranch(`${step}-`) : step as string;
    driver.visit(nodeId);
    const chest = typeof step === 'string' ? chests[step] : undefined;
    if (chest && scenario.guardianChests?.includes(chest)) {
      driver.visit(chest);
      driver.visit(step as string);
    }
  }
  return done();
}

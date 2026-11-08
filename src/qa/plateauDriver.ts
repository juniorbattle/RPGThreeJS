/**
 * Set 1.20.0, post-demo — QA driver of a built post-demo plateau (the Bear, the Dragon).
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
import type { DialogueChoice, DialogueSequence, GameState, NarrativeEffect, RunNode } from '../game/types';

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
  /** A fork's branch by its prefix (`dragon-second-trial`), when it differs from the preference's default. */
  forks?: Readonly<Record<string, 'event' | 'combat'>>;
}

export interface PlayedLine { dialogueId: string; stepId: string; speaker: string; text: string }

export interface PlateauPlaythrough {
  state: GameState;
  lines: PlayedLine[];
  decisions: { dialogueId: string; stepId: string; text: string }[];
  fights: string[];
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
  private pendingCombatId: string | null = null;
  private readonly merits: ReadonlySet<string>;
  private readonly greed: ReadonlySet<string>;

  constructor(private readonly state: GameState, private readonly scenario: PlateauScenario,
    private readonly chapterId: PostDemoSealPlateauId) {
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
    const config = playableCombatConfig(combatId);
    if (!config) throw new Error(`Missing fight '${combatId}'`);
    if (config.preCombatDialogueId) this.playDialogue(config.preCombatDialogueId);
    this.fights.push(combatId);
    creditRunReward(this.state, { gold: config.rewards.gold });
    for (const [itemId, quantity] of Object.entries(config.rewards.materials ?? {})) {
      creditRunReward(this.state, { category: 'materials', itemId, quantity });
    }
    changeReputation(this.state, config.rewards.reputation, `combat:${combatId}`);
    Object.assign(this.state.flags, combatVictoryFacts(combatId));
    this.markResolved(node.id);
    if (node.type === 'boss') {
      this.state.run.status = 'completed';
      secureRunLoot(this.state);
      if (config.postCombatDialogueId) this.playDialogue(config.postCombatDialogueId);
      this.playDialogue(plateauEpilogueDialogueId(this.state));
      return;
    }
    if (config.postCombatDialogueId) this.playDialogue(config.postCombatDialogueId);
    this.flush(node);
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
    if (node.type === 'combat' && playableCombatConfig(node.contentId)) { this.fight(node.contentId, node); this.postNode(node); return; }
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

  /** A fork: the first branch RunSystem lets the company move to that the scenario's policy would take. */
  forkBranch(prefix: string): string {
    const branches = selectPoiMap(this.state).nodes.filter((node) => node.canMove && node.id.startsWith(prefix)).map((node) => node.id);
    const event = branches.find((id) => id.endsWith('-event'));
    const combat = branches.find((id) => id.endsWith('-combat'));
    const wanted = this.scenario.forks?.[prefix.replace(/-$/, '')] ?? (this.scenario.prefer === 'merit' ? 'event' : 'combat');
    return (wanted === 'event' ? event : combat) ?? branches[0]!;
  }
}

/** The route in play order: one entry per depth, a fork named by its common prefix (`bear-first-trial`). */
function playOrder(chapterId: PostDemoSealPlateauId): string[] {
  const route = requirePlateauCampaign(chapterId).topology.route ?? [];
  const depths = [...new Set(route.map((node) => node.depth))].sort((a, b) => a - b).slice(1);
  return depths.map((depth) => {
    const nodes = route.filter((node) => node.depth === depth);
    return nodes.length > 1 ? nodes[0]!.id.replace(/-(event|combat)$/, '') : nodes[0]!.id;
  });
}

/** The guardian chest each route POI opens: the chest a guardian holds, after the route POI it requires. */
function chestsAfter(chapterId: PostDemoSealPlateauId): Record<string, string> {
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
export function playPlateau(chapterId: PostDemoSealPlateauId, previousEnd: GameState, scenario: PlateauScenario, seed = 20261108,
  stopBefore?: string): PlateauPlaythrough {
  const state = structuredClone(previousEnd);
  if (!continueCampaign(state, seed)) throw new Error(`The campaign did not continue into ${chapterId}.`);
  if (!state.run.id.startsWith(`${chapterId}-`)) throw new Error(`The campaign continued into ${state.run.id}, not ${chapterId}.`);
  const reputationStart = state.reputation;
  const driver = new PlateauDriver(state, scenario, chapterId);
  const chests = chestsAfter(chapterId);
  driver.arrive();
  for (const step of playOrder(chapterId)) {
    if (step === stopBefore) break;
    const nodeId = step.endsWith('-trial') ? driver.forkBranch(`${step}-`) : step;
    driver.visit(nodeId);
    const chest = chests[step];
    if (chest && scenario.guardianChests?.includes(chest)) {
      driver.visit(chest);
      driver.visit(step);
    }
  }
  return { state, lines: driver.lines, decisions: driver.decisions, fights: driver.fights, reputationStart };
}

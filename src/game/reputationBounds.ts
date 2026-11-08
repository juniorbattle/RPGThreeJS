/**
 * Set 1.20.0 (CAMPAIGN_AND_STATE "Calibration", AUTHORING_AND_QA "reputation bounds test"), post-demo Lot 0.
 *
 * Reads the Lion's reputation amounts and thresholds from its content, proposes their post-demo recalibration and
 * computes the bounds a run can reach, so the bounds test fails when content or calibration stops meeting the targets:
 * only a perfect run reaches 100, at the end of the game; a consistent honour run reaches Renowned (80) around the third
 * plateau.
 *
 * The calibration was approved in the Lot 0 package (OD-2026-11-08-A) and the game plays it (`lionReputationCalibration`,
 * `playableContent`). It changes amounts and thresholds only, never a choice, outcome, route or line, never rewrites a
 * saved value; the frozen demo keeps its values through a Git tag. Read-only analysis of authored content.
 */
import { combatConfigs, dialogues, POST_NODE_ATE } from './content';
import { buildLionContextualDialogue, lionBossVictoryFacts, resolveLionFinaleExecution } from './lionFinale';
import { LION_CALIBRATED_THRESHOLDS, LION_REPUTATION_CALIBRATION, calibrateLionAmount } from './lionReputationCalibration';
import { resolveOptionalEncounterIgnoreConsequence } from './OptionalEncounterConsequencePolicy';
import { REPUTATION_EVENT_DEFINITIONS } from './reputationEventContent';
import { generateRunGraph, lionRouteContentCandidates } from './runSystem';
import { createInitialState } from './store';
import { LION_CANONICAL_POI_IDS, LOT_E_ELITES, LOT_E_POIS } from '../campaign/LionPoiAuthoring';
import {
  REPUTATION_BUDGETS,
  CAMPAIGN_CHAPTER_IDS,
  getPlateau,
  requirePlateauCampaign,
  type CampaignChapterId,
} from '../campaign/plateaux/PlateauRegistry';
import { POST_DEMO_REFUGE_GATHERINGS } from '../campaign/plateaux/postDemoRefuges';
import type { CombatConfig, DialogueSequence, GameState, NarrativeEffect, RunNodeType } from './types';
import { resolvePlateauFinaleExecution } from './plateauFinale';
import { combatVictoryFacts, plateauFinaleOf } from './plateauProgression';
import { getPostDemoCombat, resolvePostDemoDialogue } from './postDemoContent';

export const REPUTATION_START = 30;
export const REPUTATION_MAX = 100;
export const RENOWNED_THRESHOLD = 80;

export type ReputationSourceKind = 'choice' | 'contest_failure' | 'step' | 'combat' | 'finale' | 'consequence';

export interface ReputationSource {
  id: string;
  kind: ReputationSourceKind;
  amount: number;
  /** Combat rank, for combat rewards. */
  rank?: CombatConfig['encounterRank'];
  label: string;
}

export interface ReputationThreshold {
  id: string;
  value: number;
  label: string;
  origin: 'content' | 'code';
}

/**
 * Reputation thresholds written in code rather than content, with their demo values. The game compares with their
 * calibrated values (`LION_ALARIC_THRESHOLDS`); the bounds test checks that these files compare reputation with those
 * constants only, so a new threshold cannot slip past the calibration.
 */
export const LION_CODE_REPUTATION_THRESHOLDS: readonly ReputationThreshold[] = Object.freeze([
  Object.freeze({
    id: 'code:alaric_credible', value: 45, origin: 'code' as const,
    label: 'Crédibilité devant Alaric (contexte crédible, soutien de la poursuite, première marge de bluff)',
  }),
  Object.freeze({
    id: 'code:alaric_high', value: 70, origin: 'code' as const,
    label: 'Grande crédibilité devant Alaric (contexte haut, seconde marge de bluff)',
  }),
]);
export const LION_CODE_THRESHOLD_FILES = Object.freeze(['src/game/lionVerdict.ts', 'src/game/lionFinale.ts']);

export interface ReputationCalibration {
  id: string;
  status: 'demo' | 'proposed' | 'approved';
  amount: (source: ReputationSource) => number;
  threshold: (threshold: ReputationThreshold) => number;
}

/** The demo's values, unchanged. The frozen demo build keeps them. */
export const DEMO_LION_REPUTATION: ReputationCalibration = Object.freeze({
  id: 'demo',
  status: 'demo' as const,
  amount: (source: ReputationSource) => source.amount,
  threshold: (threshold: ReputationThreshold) => threshold.value,
});

/** The approved scale for the Lion's amounts and for the distance of its thresholds from the starting 30. */
export const LION_POST_DEMO_SCALE = LION_REPUTATION_CALIBRATION.scale;

/** The decision's "same proportion" for a threshold: it keeps its distance from the starting 30, scaled by 0.3. */
export function proportionalLionThreshold(value: number): number {
  return Math.round(REPUTATION_START + LION_POST_DEMO_SCALE * (value - REPUTATION_START));
}

/**
 * Approved calibrated thresholds (OD-2026-11-08-A): for each, the integer near its proportional value that changes the
 * fewest current verdicts over every reachable run (`compareLionThresholds`). Cedric 27 (no reachable run affected
 * between 24 and 29), Garen 24 (8 states, against 17 for the proportional 26), witness escort 35 (7 states), Alaric's
 * credibility 33 and 42 (76 states, against 83 for 35 and 42). Every threshold of the ledger must have an entry.
 */
export const LION_POST_DEMO_THRESHOLDS = LION_CALIBRATED_THRESHOLDS;

/** The approved post-demo calibration of the Lion (OD-2026-11-08-A), the one the game plays. */
export const LION_POST_DEMO_REPUTATION: ReputationCalibration = Object.freeze({
  id: LION_REPUTATION_CALIBRATION.id,
  status: LION_REPUTATION_CALIBRATION.status,
  amount: (source: ReputationSource) => calibrateLionAmount(source),
  threshold: (threshold: ReputationThreshold) => {
    const value = LION_CALIBRATED_THRESHOLDS[threshold.id];
    if (value === undefined) throw new Error(`No calibrated value for reputation threshold '${threshold.id}'.`);
    return value;
  },
});

// ---------------------------------------------------------------------------------------------------------------------
// Walking content

interface Gate { thresholdId: string; value: number }

/** One way through a piece of content: the player's decisions, the reputation it moves, the gates it passed. */
export interface ContentPath {
  decisions: string[];
  delta: number;
  sources: string[];
  gates: Gate[];
  /** Gates whose failure branch this path took (a contest's failure outcome). */
  failedGates: Gate[];
  /** Flags set along the way, so state-built dialogues further on see the decisions already taken. */
  flags: Record<string, boolean>;
}

/**
 * The content a walk reads. The Lion's is the default; a post-demo plateau reads its own registry, authored at the
 * post-demo scale, so it is walked with `POST_DEMO_AUTHORED_REPUTATION` and never recalibrated.
 */
export interface WalkContent {
  dialogue: (id: string, state: GameState) => DialogueSequence | undefined;
  combat: (id: string) => CombatConfig | undefined;
  victoryFacts: (combatId: string) => Readonly<Record<string, boolean>>;
}

export const LION_WALK_CONTENT: WalkContent = Object.freeze({
  dialogue: (id: string, state: GameState) => buildLionContextualDialogue(id, state) ?? dialogues.get(id),
  combat: (id: string) => combatConfigs.get(id),
  victoryFacts: lionBossVictoryFacts,
});

export const POST_DEMO_WALK_CONTENT: WalkContent = Object.freeze({
  dialogue: (id: string, state: GameState) => resolvePostDemoDialogue(id, state),
  combat: (id: string) => getPostDemoCombat(id),
  victoryFacts: combatVictoryFacts,
});

interface WalkContext {
  calibration: ReputationCalibration;
  /** Defaults to the Lion's content. */
  content?: WalkContent;
  /** Reputation on entry, when known: a gated choice then takes its pass or failure branch as the game would. */
  reputation?: number;
  /** State used to build the Lion's state-built dialogues (judgement, aftermaths). */
  state: GameState;
  ledger?: Map<string, ReputationSource>;
  thresholds?: Map<string, ReputationThreshold>;
}

export const EMPTY_PATH: ContentPath = Object.freeze({ decisions: [], delta: 0, sources: [], gates: [], failedGates: [], flags: {} }) as ContentPath;

function withFlags(path: ContentPath, flags: Readonly<Record<string, boolean>>): ContentPath {
  return { ...path, flags: { ...path.flags, ...flags } };
}

function withSource(path: ContentPath, source: ReputationSource, context: WalkContext): ContentPath {
  context.ledger?.set(source.id, source);
  return { ...path, delta: path.delta + context.calibration.amount(source), sources: [...path.sources, source.id] };
}

function stateAt(path: ContentPath, context: WalkContext): GameState {
  const reputation = context.reputation === undefined ? context.state.reputation
    : Math.max(0, Math.min(REPUTATION_MAX, context.reputation + path.delta));
  return { ...context.state, flags: { ...context.state.flags, ...path.flags }, reputation };
}

function resolveDialogue(id: string, state: GameState, context?: WalkContext): DialogueSequence | undefined {
  return (context?.content ?? LION_WALK_CONTENT).dialogue(id, state);
}

/** A fight's content: its pre-combat dialogue, its reward and the facts of a boss victory, then its aftermath. */
function runCombat(combatId: string, context: WalkContext, depth: number, entry: ContentPath): ContentPath[] {
  const content = context.content ?? LION_WALK_CONTENT;
  const config = content.combat(combatId);
  if (!config) return [entry];
  const afterPre = config.preCombatDialogueId ? runDialogue(config.preCombatDialogueId, context, depth + 1, entry) : [entry];
  const afterVictory = afterPre.map((path) => {
    const rewarded = config.rewards.reputation
      ? withSource(path, { id: `combat:${combatId}`, kind: 'combat', amount: config.rewards.reputation,
        rank: config.encounterRank, label: config.encounterLabel }, context)
      : path;
    return withFlags(rewarded, content.victoryFacts(combatId));
  });
  return config.postCombatDialogueId
    ? afterVictory.flatMap((path) => runDialogue(config.postCombatDialogueId!, context, depth + 1, path))
    : afterVictory;
}

function applyEffects(effects: readonly NarrativeEffect[], prefix: string, label: string, context: WalkContext,
  depth: number, entry: ContentPath): ContentPath[] {
  let paths: ContentPath[] = [entry];
  for (const effect of effects) {
    if (effect.type === 'setFlag') {
      paths = paths.map((path) => withFlags(path, { [effect.key]: effect.value }));
    } else if (effect.type === 'addReputation') {
      const kind: ReputationSourceKind = prefix.startsWith('contest:') ? 'contest_failure'
        : prefix.startsWith('step:') ? 'step' : 'choice';
      paths = paths.map((path) => withSource(path, { id: prefix, kind, amount: effect.amount, label }, context));
    } else if (effect.type === 'startCombat') {
      paths = paths.flatMap((path) => runCombat(effect.combatId, context, depth, path));
    } else if (effect.type === 'resolveLionFinale') {
      paths = paths.flatMap((path) => {
        const execution = resolveLionFinaleExecution(stateAt(path, context), effect.intent);
        const cause = execution.trialCause ? `${execution.route}:${execution.trialCause}` : execution.route;
        const decided = withFlags(execution.reputationDelta
          ? withSource(path, { id: `finale:${cause}`, kind: 'finale', amount: execution.reputationDelta,
            label: `Issue du jugement (${cause})` }, context)
          : path, execution.flagChanges);
        return runCombat(execution.combatId, context, depth, decided);
      });
    } else if (effect.type === 'resolvePlateauFinale') {
      const finale = plateauFinaleOf(effect.plateauId);
      if (!finale) throw new Error(`No finale for plateau '${effect.plateauId}'.`);
      paths = paths.flatMap((path) => {
        const execution = resolvePlateauFinaleExecution(finale, stateAt(path, context), effect.intent);
        const cause = execution.trialCause ? `${execution.route}:${execution.trialCause}` : execution.route;
        const decided = withFlags(execution.reputationDelta
          ? withSource(path, { id: `finale:${effect.plateauId}:${cause}`, kind: 'finale', amount: execution.reputationDelta,
            label: `Issue du jugement de ${effect.plateauId} (${cause})` }, context)
          : path, execution.flagChanges);
        return runCombat(execution.combatId, context, depth, decided);
      });
    }
  }
  return paths;
}

/** Every way through a dialogue from an entry path, following `next` links, each choice and a contest's failure. */
function runDialogue(dialogueId: string, context: WalkContext, depth: number, entry: ContentPath): ContentPath[] {
  const sequence = resolveDialogue(dialogueId, stateAt(entry, context), context);
  if (!sequence || depth > 6) return [entry];
  const results: ContentPath[] = [];
  const visit = (stepId: string | null | undefined, acc: ContentPath, seen: ReadonlySet<string>) => {
    const step = stepId ? sequence.steps.find((candidate) => candidate.id === stepId) : undefined;
    if (!step || seen.has(step.id)) {
      results.push(acc);
      return;
    }
    const nextSeen = new Set([...seen, step.id]);
    const label = `${sequence.title ?? sequence.id} · ${step.speaker}`;
    const afterStep = applyEffects(step.effects, `step:${sequence.id}:${step.id}`, label, context, depth, acc);
    if (!step.choices?.length) {
      for (const path of afterStep) visit(step.next, path, nextSeen);
      return;
    }
    step.choices.forEach((choice, index) => {
      const decision = `${sequence.id}:${step.id}:${index}`;
      const choiceLabel = `${sequence.title ?? sequence.id} · « ${choice.text} »`;
      const gate = choice.requiresReputationMin;
      const threshold: ReputationThreshold | null = gate === undefined ? null
        : { id: `gate:${decision}`, value: gate, origin: 'content', label: choiceLabel };
      if (threshold) context.thresholds?.set(threshold.id, threshold);
      const calibrated = threshold ? context.calibration.threshold(threshold) : 0;
      for (const base of afterStep) {
        const decided: ContentPath = { ...base, decisions: [...base.decisions, decision] };
        const known = context.reputation !== undefined;
        const passes = !threshold || !known || stateAt(base, context).reputation >= calibrated;
        if (passes) {
          const gated = threshold ? { ...decided, gates: [...decided.gates, { thresholdId: threshold.id, value: calibrated }] } : decided;
          for (const path of applyEffects(choice.effects, `choice:${decision}`, choiceLabel, context, depth, gated)) {
            visit(choice.next, path, nextSeen);
          }
        }
        if (threshold && choice.contest && (!known || !passes)) {
          const failed = { ...decided, failedGates: [...decided.failedGates, { thresholdId: threshold.id, value: calibrated }] };
          for (const path of applyEffects(choice.contest.failure.effects, `contest:${decision}`, choiceLabel, context, depth, failed)) {
            visit(choice.contest.failure.next, path, nextSeen);
          }
        }
      }
    });
  };
  visit(sequence.steps[0]?.id, entry, new Set());
  return results;
}

/** Every way through a dialogue, from an empty path. */
export function dialoguePaths(dialogueId: string, context: WalkContext): ContentPath[] {
  return runDialogue(dialogueId, context, 0, EMPTY_PATH);
}

/** Every way through a fight's content, from an empty path. */
export function combatPaths(combatId: string, context: WalkContext): ContentPath[] {
  return runCombat(combatId, context, 0, EMPTY_PATH);
}

/** Every way through one canonical node's content, as RunSystem routes it by type, then its echo dialogues. */
export function nodeContentPaths(nodeId: string, candidate: { contentId: string; type: RunNodeType }, context: WalkContext): ContentPath[] {
  const main = candidate.type === 'combat' ? combatPaths(candidate.contentId, context)
    : resolveDialogue(candidate.contentId, context.state, context) ? dialoguePaths(candidate.contentId, context) : [EMPTY_PATH];
  return (POST_NODE_ATE[nodeId] ?? []).reduce(
    (paths, ateId) => paths.flatMap((path) => runDialogue(ateId, context, 0, path)), main);
}

// ---------------------------------------------------------------------------------------------------------------------
// States used to build the Lion's state-built dialogues

/** A perfect honour company at the judgement: every merit, the Shadow evidence, high reputation. */
export function perfectHonourJudgementState(): GameState {
  const state = createInitialState();
  Object.assign(state.flags, {
    lionMandateHonour: true, helpedRefugees: true, helpedMerchant: true, missionSuccess: true, prioritizedVillage: true,
    preservedShrine: true, protectedWitnesses: true, protectedInformant: true, shadowEvidence: true,
    recruitedCedric: true, recruitedLancer: true,
  });
  state.reputation = REPUTATION_MAX;
  return state;
}

/** A greedy company at the judgement, to reach the force-path content. */
export function greedJudgementState(): GameState {
  const state = createInitialState();
  Object.assign(state.flags, { lionMandateAdvance: true, exploitedRefugees: true, missionGreed: true, desecratedShrine: true });
  state.reputation = 5;
  return state;
}

// ---------------------------------------------------------------------------------------------------------------------
// Ledger

export interface LionReputationLedger {
  sources: ReputationSource[];
  thresholds: ReputationThreshold[];
}

/** Every reputation amount and threshold of the Lion's content, from its dialogues, fights, judgement and optional POIs. */
export function collectLionReputationLedger(): LionReputationLedger {
  const ledger = new Map<string, ReputationSource>();
  const thresholds = new Map<string, ReputationThreshold>();
  for (const state of [perfectHonourJudgementState(), greedJudgementState()]) {
    const context: WalkContext = { calibration: DEMO_LION_REPUTATION, state, ledger, thresholds };
    for (const id of dialogues.keys()) dialoguePaths(id, context);
    dialoguePaths('lion_finale_judgement', context);
    for (const id of combatConfigs.keys()) combatPaths(id, context);
    for (const intent of ['claim_recognition', 'request_trial'] as const) {
      applyEffects([{ type: 'resolveLionFinale', intent }], 'finale', 'Jugement', context, 0, EMPTY_PATH);
    }
  }
  // Authored opt-outs of the opening leg (RunSystem `bypassPoi`): ignoring the refugees or the wounded merchant.
  for (const node of generateRunGraph(1).nodes) {
    for (const { contentId } of lionRouteContentCandidates(node.id)) {
      const ignore = resolveOptionalEncounterIgnoreConsequence('T0', { id: node.id, contentId });
      if (!ignore?.reputation) continue;
      const id = `consequence:ignore:${node.id}`;
      ledger.set(id, { id, kind: 'consequence', amount: ignore.reputation, label: `${node.label} ignoré (${ignore.flag})` });
    }
  }
  for (const threshold of LION_CODE_REPUTATION_THRESHOLDS) thresholds.set(threshold.id, threshold);
  return {
    sources: [...ledger.values()].filter((source) => source.amount !== 0).sort((a, b) => a.id.localeCompare(b.id)),
    thresholds: [...thresholds.values()].sort((a, b) => a.id.localeCompare(b.id)),
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Bounds

export interface NodeBound {
  depth: number;
  nodeIds: string[];
  /** Best gain at this step, over every branch and drawn variant. */
  max: number;
  /** Best gain at this step under its least favourable drawn variants: what a consistent honour player is sure of. */
  floor: number;
  /** Worst result at this step, over every branch, variant and choice. */
  min: number;
  bestSources: string[];
  floorGates: Gate[];
}

export interface LionReputationBounds {
  calibrationId: string;
  nodes: NodeBound[];
  canonicalMax: number;
  canonicalFloor: number;
  /** Lowest total of the canonical route: every worst choice and variant. */
  canonicalMin: number;
  optionalMax: number;
  socialMax: number;
  /** Perfect run: every best choice and variant, every optional fight and guardian, the two best refuge events. */
  perfectMax: number;
  /** Consistent honour run: the best choice everywhere, least favourable variants, no optional content, no event. */
  honourFloor: number;
  /** First canonical node where a perfect run reaches 100, or null if it never does in the Lion. */
  perfectReaches100At: string | null;
  /** Gates on the consistent honour path that its running reputation fails. Empty when every gate holds. */
  failedHonourGates: { nodeIds: string[]; thresholdId: string; value: number; reputation: number }[];
}

function best(paths: readonly ContentPath[]): ContentPath {
  return paths.reduce((top, path) => path.delta > top.delta ? path : top, paths[0] ?? EMPTY_PATH);
}

function canonicalDepths(): { depth: number; nodeIds: string[] }[] {
  const nodes = generateRunGraph(1).nodes.filter((node) => LION_CANONICAL_POI_IDS.includes(node.id));
  const depths = [...new Set(nodes.map((node) => node.depth))].sort((a, b) => a - b);
  return depths.map((depth) => ({ depth, nodeIds: nodes.filter((node) => node.depth === depth).map((node) => node.id) }));
}

export function computeLionReputationBounds(calibration: ReputationCalibration): LionReputationBounds {
  const nodes: NodeBound[] = [];
  for (const { depth, nodeIds } of canonicalDepths()) {
    const state = perfectHonourJudgementState();
    const context: WalkContext = { calibration, state };
    // Each branch of a fork: its best path per drawn variant.
    const everyPath = nodeIds.flatMap((nodeId) => lionRouteContentCandidates(nodeId)
      .flatMap((candidate) => nodeContentPaths(nodeId, candidate, context)));
    const min = Math.min(...everyPath.map((path) => path.delta));
    const branches = nodeIds.map((nodeId) => lionRouteContentCandidates(nodeId)
      .map((candidate) => best(nodeContentPaths(nodeId, candidate, context))));
    const allBest = branches.flat();
    const top = best(allBest);
    // min over variants of max over branches = max over branches of their least favourable variant.
    const floorPerBranch = branches.map((variants) => variants.reduce((low, path) => path.delta < low.delta ? path : low, variants[0]!));
    const floor = best(floorPerBranch);
    nodes.push({ depth, nodeIds, max: top.delta, floor: floor.delta, min, bestSources: top.sources, floorGates: floor.gates });
  }
  const canonicalMax = nodes.reduce((sum, node) => sum + node.max, 0);
  const canonicalFloor = nodes.reduce((sum, node) => sum + node.floor, 0);
  const canonicalMin = nodes.reduce((sum, node) => sum + node.min, 0);

  const optionalContext: WalkContext = { calibration, state: perfectHonourJudgementState() };
  const optionalMax = [
    ...LOT_E_POIS.filter((poi) => poi.combat).map((poi) => Math.max(...poi.combat!.variants
      .map((variant) => best(combatPaths(variant.id, optionalContext)).delta))),
    ...LOT_E_ELITES.map((elite) => best(combatPaths(elite.combat.id, optionalContext)).delta),
  ].reduce((sum, value) => sum + Math.max(0, value), 0);

  const eventGains = REPUTATION_EVENT_DEFINITIONS
    .map((definition) => best(dialoguePaths(definition.dialogueId, optionalContext)).delta)
    .sort((a, b) => b - a);
  const socialMax = eventGains.slice(0, 2).reduce((sum, value) => sum + Math.max(0, value), 0);

  let running = REPUTATION_START;
  let perfectReaches100At: string | null = null;
  let floorRunning = REPUTATION_START;
  const failedHonourGates: LionReputationBounds['failedHonourGates'] = [];
  for (const node of nodes) {
    for (const gate of node.floorGates) {
      if (floorRunning < gate.value) failedHonourGates.push({ nodeIds: node.nodeIds, ...gate, reputation: floorRunning });
    }
    running += node.max;
    floorRunning += node.floor;
    if (perfectReaches100At === null && running + optionalMax + socialMax >= REPUTATION_MAX) {
      perfectReaches100At = node.nodeIds.join(' | ');
    }
  }
  return {
    calibrationId: calibration.id,
    nodes,
    canonicalMax,
    canonicalFloor,
    canonicalMin,
    optionalMax,
    socialMax,
    perfectMax: canonicalMax + optionalMax + socialMax,
    honourFloor: canonicalFloor,
    perfectReaches100At,
    failedHonourGates,
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Post-demo plateaux, measured from their own content

/** Post-demo content is authored at the post-demo scale (OD-2026-11-08-A): its amounts and thresholds count as written. */
export const POST_DEMO_AUTHORED_REPUTATION: ReputationCalibration = Object.freeze({
  id: 'post-demo-authored',
  status: 'approved' as const,
  amount: (source: ReputationSource) => source.amount,
  threshold: (threshold: ReputationThreshold) => threshold.value,
});

/** A perfect honour company at a post-demo judgement: the Lion's honour, every merit of the plateau, high reputation. */
export function perfectHonourPlateauState(chapterId: CampaignChapterId): GameState {
  const state = perfectHonourJudgementState();
  const finale = plateauFinaleOf(chapterId);
  if (!finale) throw new Error(`Plateau '${chapterId}' has no finale.`);
  state.flags.serpentGeneralDefeated = true;
  for (const deed of finale.deeds) if (deed.kind === 'merit') state.flags[deed.flag] = true;
  state.flags[finale.honourFact] = true;
  state.flags[finale.witnesses.supportiveFlag] = true;
  state.flags[finale.evidence.flag] = true;
  return state;
}

/** A greedy company at a post-demo judgement, to reach its force-path content. */
export function greedPlateauState(chapterId: CampaignChapterId): GameState {
  const state = greedJudgementState();
  const finale = plateauFinaleOf(chapterId);
  if (!finale) throw new Error(`Plateau '${chapterId}' has no finale.`);
  state.flags.lionTrialWon = true;
  for (const deed of finale.deeds) if (deed.kind !== 'merit') state.flags[deed.flag] = true;
  return state;
}

export type PlateauReputationBounds = Omit<LionReputationBounds, 'calibrationId'> & { chapterId: CampaignChapterId };

/**
 * A built post-demo plateau's bounds, measured as the Lion's are: per canonical depth the best branch, the least
 * favourable branch a consistent honour run is sure of, the worst result; then its optional fights and guardians. Its
 * refuges hold no reputation event yet, so it has no social gain. Read-only analysis of authored content.
 */
export function computePlateauReputationBounds(chapterId: Exclude<CampaignChapterId, 'lion' | 'finale'>): PlateauReputationBounds {
  const topology = requirePlateauCampaign(chapterId).topology;
  const route = topology.route ?? [];
  const gatherings = POST_DEMO_REFUGE_GATHERINGS[chapterId] ?? {};
  const context: WalkContext = { calibration: POST_DEMO_AUTHORED_REPUTATION, content: POST_DEMO_WALK_CONTENT,
    state: perfectHonourPlateauState(chapterId) };
  const greedContext: WalkContext = { ...context, state: greedPlateauState(chapterId) };
  const pathsOf = (node: (typeof route)[number], walk: WalkContext) => {
    if (node.type === 'refuge') return gatherings[node.id] ? dialoguePaths(gatherings[node.id]!, walk) : [EMPTY_PATH];
    return nodeContentPaths(node.id, { contentId: node.contentId, type: node.type }, walk);
  };
  const depths = [...new Set(route.map((node) => node.depth))].sort((a, b) => a - b);
  const nodes: NodeBound[] = depths.map((depth) => {
    const atDepth = route.filter((node) => node.depth === depth);
    const branches = atDepth.map((node) => best(pathsOf(node, context)));
    const top = best(branches);
    const min = Math.min(...atDepth.flatMap((node) => [...pathsOf(node, context), ...pathsOf(node, greedContext)]).map((path) => path.delta));
    // A post-demo route node has one content and no drawn variant, so a consistent honour run is sure of its best
    // branch at every fork: its floor is the step's best gain.
    return { depth, nodeIds: atDepth.map((node) => node.id), max: top.delta, floor: top.delta,
      min, bestSources: top.sources, floorGates: top.gates };
  });
  const canonicalMax = nodes.reduce((sum, node) => sum + node.max, 0);
  const canonicalFloor = nodes.reduce((sum, node) => sum + node.floor, 0);
  const canonicalMin = nodes.reduce((sum, node) => sum + node.min, 0);
  const optionalMax = [
    ...topology.optionalPois.filter((poi) => poi.combat).map((poi) => Math.max(...poi.combat!.variants
      .map((variant) => best(combatPaths(variant.id, context)).delta))),
    ...topology.guardians.map((guardian) => best(combatPaths(guardian.combat.id, context)).delta),
  ].reduce((sum, value) => sum + Math.max(0, value), 0);
  const failedHonourGates: PlateauReputationBounds['failedHonourGates'] = [];
  let floorRunning = REPUTATION_START;
  for (const node of nodes) {
    for (const gate of node.floorGates) {
      if (floorRunning < gate.value) failedHonourGates.push({ nodeIds: node.nodeIds, ...gate, reputation: floorRunning });
    }
    floorRunning += node.floor;
  }
  return {
    chapterId,
    nodes,
    canonicalMax,
    canonicalFloor,
    canonicalMin,
    optionalMax,
    socialMax: 0,
    perfectMax: canonicalMax + optionalMax,
    honourFloor: canonicalFloor,
    perfectReaches100At: null,
    failedHonourGates,
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Where the calibration changes a threshold's verdict

export interface GateDivergence {
  thresholdId: string;
  nodeIds: string[];
  demoValue: number;
  calibratedValue: number;
  /** Distinct (demo, calibrated) reputation pairs a run can hold when it reaches the gate. */
  reachableStates: number;
  /** Pairs where the gate opens with the demo values and stays closed with the calibration. */
  closedByCalibration: number;
  /** Pairs where the gate stays closed with the demo values and opens with the calibration. */
  openedByCalibration: number;
}

export interface JudgementDivergence {
  reachableStates: number;
  /** Alaric's credibility tier (0 below 45, 1 from 45, 2 from 70, or their calibrated values), demo against calibrated. */
  tierMatrix: Record<string, number>;
  divergentStates: number;
}

export interface LionThresholdComparison {
  gates: GateDivergence[];
  judgement: JudgementDivergence;
}

function validFor(path: ContentPath, reputation: number): boolean {
  return path.gates.every((gate) => reputation >= gate.value) && path.failedGates.every((gate) => reputation < gate.value);
}

const clamp = (value: number) => Math.max(0, Math.min(REPUTATION_MAX, value));

/**
 * Follows every run of the canonical route under both value sets at once (the same decisions, each world taking the
 * branch its own gates open) and counts where a gate or Alaric's credibility tier differs. Optional POIs and refuge
 * events, which add at most a few points, are left out; any drawn variant may meet any reputation, an over-estimate.
 */
export function compareLionThresholds(calibration: ReputationCalibration): LionThresholdComparison {
  const depths = canonicalDepths();
  const state = perfectHonourJudgementState();
  let states = new Set<string>([`${REPUTATION_START}|${REPUTATION_START}`]);
  const gateStats = new Map<string, GateDivergence>();
  const gateSeen = new Map<string, Set<string>>();
  const credible = LION_CODE_REPUTATION_THRESHOLDS.find((entry) => entry.id === 'code:alaric_credible')!;
  const high = LION_CODE_REPUTATION_THRESHOLDS.find((entry) => entry.id === 'code:alaric_high')!;
  for (const { nodeIds } of depths.slice(0, -1)) {
    const options = nodeIds.flatMap((nodeId) => lionRouteContentCandidates(nodeId).map((candidate) => ({
      nodeId,
      demo: nodeContentPaths(nodeId, candidate, { calibration: DEMO_LION_REPUTATION, state }),
      calibrated: nodeContentPaths(nodeId, candidate, { calibration, state }),
    })));
    const next = new Set<string>();
    for (const key of states) {
      const [demoRep, calRep] = key.split('|').map(Number) as [number, number];
      for (const option of options) {
        const demoPaths = option.demo.filter((path) => validFor(path, demoRep));
        const calPaths = option.calibrated.filter((path) => validFor(path, calRep));
        const byDecision = new Map(calPaths.map((path) => [path.decisions.join('>'), path]));
        for (const demoPath of demoPaths) {
          const calPath = byDecision.get(demoPath.decisions.join('>'));
          if (!calPath) continue;
          for (const gate of [...demoPath.gates, ...demoPath.failedGates]) {
            let stat = gateStats.get(gate.thresholdId);
            if (!stat) {
              const calibratedGate = [...calPath.gates, ...calPath.failedGates].find((entry) => entry.thresholdId === gate.thresholdId);
              stat = { thresholdId: gate.thresholdId, nodeIds: [option.nodeId], demoValue: gate.value,
                calibratedValue: calibratedGate?.value ?? gate.value, reachableStates: 0, closedByCalibration: 0, openedByCalibration: 0 };
              gateStats.set(gate.thresholdId, stat);
              gateSeen.set(gate.thresholdId, new Set());
            }
            const seen = gateSeen.get(gate.thresholdId)!;
            if (seen.has(key)) continue;
            seen.add(key);
            stat.reachableStates += 1;
            const demoOpen = demoRep >= stat.demoValue;
            const calOpen = calRep >= stat.calibratedValue;
            if (demoOpen && !calOpen) stat.closedByCalibration += 1;
            if (!demoOpen && calOpen) stat.openedByCalibration += 1;
          }
          next.add(`${clamp(demoRep + demoPath.delta)}|${clamp(calRep + calPath.delta)}`);
        }
      }
    }
    states = next;
  }
  const tier = (value: number, credibleAt: number, highAt: number) => value >= highAt ? 2 : value >= credibleAt ? 1 : 0;
  const tierMatrix: Record<string, number> = {};
  let divergentStates = 0;
  for (const key of states) {
    const [demoRep, calRep] = key.split('|').map(Number) as [number, number];
    const demoTier = tier(demoRep, credible.value, high.value);
    const calTier = tier(calRep, calibration.threshold(credible), calibration.threshold(high));
    tierMatrix[`${demoTier}->${calTier}`] = (tierMatrix[`${demoTier}->${calTier}`] ?? 0) + 1;
    if (demoTier !== calTier) divergentStates += 1;
  }
  return {
    gates: [...gateStats.values()].sort((a, b) => a.thresholdId.localeCompare(b.thresholdId)),
    judgement: { reachableStates: states.size, tierMatrix, divergentStates },
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Whole-game projection

export interface CampaignReputationProjection {
  chapters: { id: CampaignChapterId; perfectMax: number; honourFloor: number; measured: boolean;
    perfectAfter: number; honourAfter: number }[];
  perfectTotal: number;
  /** Chapter in which a perfect run first reaches 100. */
  perfectReaches100In: CampaignChapterId | null;
  /** Chapter in which a consistent honour run first reaches Renowned (80). */
  honourReachesRenownedIn: CampaignChapterId | null;
}

/**
 * The Lion measured from its content under a calibration, each built post-demo plateau measured from its own content,
 * and the chapters not built yet at their approved budgets.
 */
export function projectCampaignReputation(calibration: ReputationCalibration): CampaignReputationProjection {
  const lion = computeLionReputationBounds(calibration);
  const measuredOf = (id: CampaignChapterId): { perfectMax: number; honourFloor: number } | null => {
    if (id === 'lion') return lion;
    if (id === 'finale' || !getPlateau(id).campaign) return null;
    return computePlateauReputationBounds(id);
  };
  let perfect = REPUTATION_START;
  let honour = REPUTATION_START;
  let perfectReaches100In: CampaignChapterId | null = null;
  let honourReachesRenownedIn: CampaignChapterId | null = null;
  const chapters = CAMPAIGN_CHAPTER_IDS.map((id) => {
    const bounds = measuredOf(id);
    const measured = bounds !== null;
    const perfectMax = bounds?.perfectMax ?? REPUTATION_BUDGETS[id].perfectMax;
    const honourFloor = bounds?.honourFloor ?? REPUTATION_BUDGETS[id].honourFloor;
    perfect += perfectMax;
    honour += honourFloor;
    if (perfectReaches100In === null && perfect >= REPUTATION_MAX) perfectReaches100In = id;
    if (honourReachesRenownedIn === null && honour >= RENOWNED_THRESHOLD) honourReachesRenownedIn = id;
    return { id, perfectMax, honourFloor, measured, perfectAfter: perfect, honourAfter: honour };
  });
  return {
    chapters,
    perfectTotal: chapters.reduce((sum, chapter) => sum + chapter.perfectMax, 0),
    perfectReaches100In,
    honourReachesRenownedIn,
  };
}

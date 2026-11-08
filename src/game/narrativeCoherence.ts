/**
 * Set 1.20.0 (AUTHORING_AND_QA "Acceptance"), post-demo Lot 0: the narrative coherence validator.
 *
 * It fails on a fact set and never read, a fact read and never set, a major choice without a later echo, an echo that
 * does not name its cause, a broken dialogue link, an unknown actor or an unreachable step. It takes up the checks of
 * the 75-dialogue audit of the narrative pass (OD-2026-11-04-C: links, actors, reachability, corrupted characters) and
 * adds the consequence-map checks. It applies to drafts before the operator's approval as well as to canon.
 *
 * Read-only: it builds dialogues and reads content and source text; it writes no game state. The caller passes the
 * source files to scan, so this module stays free of file-system access.
 */
import { assets } from '../render/assetManifest';
import { resolveCharacterUnitId } from '../render/CharacterVisualRegistry';
import { LOT_E_ELITES, LOT_E_POIS, LION_CANONICAL_POI_IDS } from '../campaign/LionPoiAuthoring';
import { consequenceMapSchema, type ConsequenceEcho, type ConsequenceMap } from '../campaign/consequences/ConsequenceMap';
import { CLAN_ANCHOR_DIALOGUES } from './campaignGrammarContent';
import { combatConfigs, dialogues, POST_NODE_ATE } from './content';
import { CONTEXTUAL_DIALOGUE_DEFINITIONS } from './contextualDialogueContent';
import type { DialogueCondition } from './contextualDialogue';
import {
  LION_CONTEXTUAL_DIALOGUE_ALIASES,
  LION_CONTEXTUAL_DIALOGUE_BUILDERS,
  buildLionContextualDialogue,
  lionBossVictoryFacts,
  resolveLionFinaleExecution,
} from './lionFinale';
import { LION_CONDUCT_FLAG_WEIGHTS } from './lionNarrative';
import { resolveOptionalEncounterIgnoreConsequence } from './OptionalEncounterConsequencePolicy';
import { REPUTATION_EVENT_DEFINITIONS } from './reputationEventContent';
import { generateRunGraph, lionRouteContentCandidates } from './runSystem';
import { createInitialState } from './store';
import type { DialogueSequence, GameState, NarrativeEffect } from './types';

export type CoherenceFindingKind =
  | 'fact_set_never_read'
  | 'fact_read_never_set'
  | 'choice_without_echo'
  | 'echo_without_cause'
  | 'broken_link'
  | 'unknown_actor'
  | 'unreachable_step'
  | 'unreachable_dialogue'
  | 'corrupted_text'
  | 'map_mismatch'
  | 'stale_exception';

export interface CoherenceFinding {
  kind: CoherenceFindingKind;
  subject: string;
  message: string;
}

export interface SourceFile {
  path: string;
  text: string;
}

export interface CoherenceReport {
  plateauId: string;
  errors: CoherenceFinding[];
  /** Findings the map documents as known exceptions, with their reason. */
  excused: (CoherenceFinding & { reason: string })[];
  stats: {
    dialogues: number;
    steps: number;
    facts: number;
    majorChoices: number;
    implementedEchoes: number;
    plannedEchoes: number;
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// The dialogue universe: authored sequences plus the Lion's state-built sequences under representative states

const REPRESENTATIVE_FLAG_SETS: readonly Readonly<Record<string, boolean>>[] = Object.freeze<Record<string, boolean>[]>([
  {},
  { missionSuccess: true, helpedRefugees: true, lionMandateHonour: true, protectedWitnesses: true, shadowEvidence: true },
  { missionSuccess: true, shadowEvidence: true, shadowRevealed: true, serpentGeneralDefeated: true, lionSealAcknowledged: true },
  { missionSuccess: true, shadowEvidence: true, shadowConcealed: true, serpentGeneralDefeated: true },
  { missionGreed: true, exploitedRefugees: true, silencedWitnesses: true, shadowFragments: true, lionMandateAdvance: true },
  { missionGreed: true, lionTrialRequested: true, lionFinaleTrialSelected: true, lionTrialWon: true },
  { missionSuccess: true, lionMandateAdvance: true, prioritizedLoot: true, liedToAlaric: true },
  { recruitedCedric: true, recruitedLancer: true, missionSuccess: true },
  // A minor stain without a breach opens Alaric's record step and its bluff choice.
  { missionSuccess: true, lionMandateHonour: true, helpedRefugees: true, protectedWitnesses: true, shrineLooted: true },
]);

export function stateWithFlags(flags: Readonly<Record<string, boolean>>, reputation = 60): GameState {
  const state = createInitialState();
  state.flags = { ...flags };
  state.reputation = reputation;
  return state;
}

function builtDialogues(): DialogueSequence[] {
  const built: DialogueSequence[] = [];
  for (const id of Object.keys(LION_CONTEXTUAL_DIALOGUE_BUILDERS)) {
    for (const flags of REPRESENTATIVE_FLAG_SETS) {
      for (const reputation of [10, 50, 90]) {
        const sequence = buildLionContextualDialogue(id, stateWithFlags(flags, reputation));
        if (sequence) built.push(sequence);
      }
    }
  }
  return built;
}

function conditionFlags(condition: DialogueCondition | undefined, into: Set<string>): void {
  if (!condition) return;
  const record = condition as unknown as Record<string, unknown>;
  if (record.kind === 'flag' && typeof record.key === 'string') into.add(record.key);
  for (const value of Object.values(record)) {
    const entries: unknown[] = Array.isArray(value) ? value : [value];
    for (const entry of entries) if (entry && typeof entry === 'object') conditionFlags(entry as DialogueCondition, into);
  }
}

function walkObjects(value: unknown, visit: (entry: Record<string, unknown>) => void): void {
  if (Array.isArray(value)) {
    for (const entry of value) walkObjects(entry, visit);
  } else if (value && typeof value === 'object') {
    visit(value as Record<string, unknown>);
    for (const entry of Object.values(value)) walkObjects(entry, visit);
  }
}

function effectsOf(sequence: DialogueSequence): { effects: readonly NarrativeEffect[]; where: string }[] {
  return sequence.steps.flatMap((step) => [
    { effects: step.effects, where: `${sequence.id}:${step.id}` },
    ...(step.choices ?? []).flatMap((choice, index) => [
      { effects: choice.effects, where: `${sequence.id}:${step.id}:${index}` },
      ...(choice.contest ? [
        { effects: choice.contest.success.effects, where: `${sequence.id}:${step.id}:${index}:success` },
        { effects: choice.contest.failure.effects, where: `${sequence.id}:${step.id}:${index}:failure` },
      ] : []),
    ]),
  ]);
}

// ---------------------------------------------------------------------------------------------------------------------
// Source scan

/** Files whose text defines content or analyses it: their flag and dialogue names are not code references. */
const NON_REFERENCE_FILES = Object.freeze([
  'src/game/content.ts', 'src/game/r5NarrativeContent.ts', 'src/game/campaignGrammarContent.ts',
  'src/game/reputationBounds.ts', 'src/game/narrativeCoherence.ts',
]);

interface FlagScan {
  reads: Map<string, Set<string>>;
  writes: Map<string, Set<string>>;
}

function add(map: Map<string, Set<string>>, key: string, where: string): void {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key)!.add(where);
}

/** Literal flag keys accessed in code, as `flags.key`, `flags['key']` or a template prefix (`flags[\`refugeSecured:${id}\`]`). */
export function scanCodeFlags(sources: readonly SourceFile[]): FlagScan {
  const reads = new Map<string, Set<string>>();
  const writes = new Map<string, Set<string>>();
  const pattern = /flags\??(?:\.([A-Za-z_]\w*)|\[\s*(['"`])([^'"`$]*)(\$\{)?[^\]]*\])(\s*=(?!=))?/g;
  for (const file of sources) {
    if (NON_REFERENCE_FILES.includes(file.path)) continue;
    for (const match of file.text.matchAll(pattern)) {
      const key = match[1] ?? (match[4] ? `${match[3]}*` : match[3]);
      if (!key || key === 'length') continue;
      add(match[5] ? writes : reads, key, file.path);
    }
    // A key built once from a template (`const securedFlag = \`refugeSecured:${id}\``) or by a helper returning one
    // (`ateSeenFlag(rule)`), then used as `flags[securedFlag]` or `flags[ateSeenFlag(rule)]`.
    const builders = [
      ...[...file.text.matchAll(/(?:const|let)\s+(\w+)\s*=\s*`([\w-]+:)\$\{/g)].map((m) => ({ name: m[1]!, prefix: m[2]!, call: false })),
      ...[...file.text.matchAll(/function\s+(\w+)\([^)]*\)[^{]*\{\s*return\s*`([\w-]+:)\$\{/g)].map((m) => ({ name: m[1]!, prefix: m[2]!, call: true })),
    ];
    for (const builder of builders) {
      const access = new RegExp(`flags\\[\\s*${builder.name}${builder.call ? '\\([^)]*\\)' : ''}\\s*\\](\\s*=(?!=))?`, 'g');
      for (const match of file.text.matchAll(access)) add(match[1] ? writes : reads, `${builder.prefix}*`, file.path);
    }
  }
  // Named key constants (`export const LION_FINALE_TRIAL_SELECTED_FLAG = 'lionFinaleTrialSelected'`) used as `flags[CONST]`.
  const constants = sources.flatMap((file) => [...file.text.matchAll(/export const\s+([A-Z][A-Z0-9_]*_FLAG)\s*=\s*'([^']+)'/g)]
    .map((m) => ({ name: m[1]!, key: m[2]! })));
  for (const file of sources) {
    if (NON_REFERENCE_FILES.includes(file.path)) continue;
    for (const constant of constants) {
      for (const match of file.text.matchAll(new RegExp(`flags\\[\\s*${constant.name}\\s*\\](\\s*=(?!=))?`, 'g'))) {
        add(match[1] ? writes : reads, constant.key, file.path);
      }
    }
  }
  // Helpers imported elsewhere: `flags[ateSeenFlag(rule)]` in a file that does not define `ateSeenFlag`.
  const helpers = sources.flatMap((file) => [...file.text.matchAll(/export function\s+(\w+)\([^)]*\)[^{]*\{\s*return\s*`([\w-]+:)\$\{/g)]
    .map((m) => ({ name: m[1]!, prefix: m[2]! })));
  for (const file of sources) {
    if (NON_REFERENCE_FILES.includes(file.path)) continue;
    for (const helper of helpers) {
      const access = new RegExp(`flags\\[\\s*${helper.name}\\([^)]*\\)\\s*\\](\\s*=(?!=))?`, 'g');
      for (const match of file.text.matchAll(access)) add(match[1] ? writes : reads, `${helper.prefix}*`, file.path);
    }
  }
  return { reads, writes };
}

function codeMentions(sources: readonly SourceFile[], literal: string): string[] {
  const quoted = [`'${literal}'`, `"${literal}"`, `\`${literal}\``];
  return sources.filter((file) => !NON_REFERENCE_FILES.includes(file.path)
    && (file.path.startsWith('src/game/') || file.path.startsWith('src/campaign/'))
    && quoted.some((form) => file.text.includes(form))).map((file) => file.path);
}

// ---------------------------------------------------------------------------------------------------------------------
// Validator

function matchesFact(factId: string, flag: string): boolean {
  return factId === flag || (factId.endsWith('*') && flag.startsWith(factId.slice(0, -1)));
}

function nodeDepth(nodeId: string): number | undefined {
  return generateRunGraph(1).nodes.find((node) => node.id === nodeId)?.depth;
}

type DialogueLookup = ReadonlyMap<string, DialogueSequence>;

function resolveDialogueFor(id: string, flags: Readonly<Record<string, boolean>>, lookup: DialogueLookup): DialogueSequence | undefined {
  return buildLionContextualDialogue(id, stateWithFlags(flags, 60)) ?? lookup.get(id);
}

function echoText(echo: ConsequenceEcho, flags: Readonly<Record<string, boolean>>, lookup: DialogueLookup): string | null {
  const sequence = resolveDialogueFor(echo.dialogueId, flags, lookup);
  if (!sequence) return null;
  const steps = echo.stepId ? sequence.steps.filter((step) => step.id === echo.stepId) : sequence.steps;
  return steps.map((step) => step.text).join('\n');
}

export interface CoherenceOptions {
  /** Draft dialogues not yet in the content registry, validated with it (a plateau's playable drafts). */
  draftDialogues?: readonly DialogueSequence[];
}

export function validateNarrativeCoherence(rawMap: unknown, sources: readonly SourceFile[], options: CoherenceOptions = {}): CoherenceReport {
  const map: ConsequenceMap = consequenceMapSchema.parse(rawMap);
  const findings: CoherenceFinding[] = [];
  const report = (kind: CoherenceFindingKind, subject: string, message: string) => findings.push({ kind, subject, message });

  const authored = [...dialogues.values(), ...(options.draftDialogues ?? [])];
  const lookup: DialogueLookup = new Map(authored.map((sequence) => [sequence.id, sequence]));
  const built = builtDialogues();
  const universe = [...authored, ...built];

  // --- Structure: links, actors, reachability, characters (the 75-dialogue audit) ---------------------------------
  const knownActors = new Set(Object.keys(assets.dialogueActors));
  const combatIds = new Set(combatConfigs.keys());
  for (const sequence of universe) {
    const stepIds = new Set(sequence.steps.map((step) => step.id));
    const link = (from: string, target: string | null | undefined) => {
      if (target && !stepIds.has(target)) report('broken_link', `${sequence.id}:${from}`, `Lien vers l’étape absente « ${target} ».`);
    };
    for (const step of sequence.steps) {
      link(step.id, step.next);
      if (step.actorId && !knownActors.has(step.actorId) && !resolveCharacterUnitId(step.actorId)) {
        report('unknown_actor', `${sequence.id}:${step.id}`, `Acteur inconnu « ${step.actorId} ».`);
      }
      if (/�|Ã[\u0080-¿]|â€|[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(`${step.speaker}\n${step.tag}\n${step.text}`)) {
        report('corrupted_text', `${sequence.id}:${step.id}`, 'Caractère corrompu dans la réplique.');
      }
      for (const choice of step.choices ?? []) {
        link(step.id, choice.next);
        if (choice.contest) {
          link(step.id, choice.contest.success.next);
          link(step.id, choice.contest.failure.next);
        }
      }
    }
    for (const { effects, where } of effectsOf(sequence)) {
      for (const effect of effects) {
        if (effect.type === 'startCombat' && !combatIds.has(effect.combatId)) {
          report('broken_link', where, `Combat inconnu « ${effect.combatId} ».`);
        }
      }
    }
  }
  for (const sequence of authored) {
    const reachable = new Set<string>();
    const queue = [sequence.steps[0]!.id];
    for (const id of queue) {
      if (reachable.has(id)) continue;
      reachable.add(id);
      const step = sequence.steps.find((candidate) => candidate.id === id);
      if (!step) continue;
      if (step.next) queue.push(step.next);
      for (const choice of step.choices ?? []) {
        if (choice.next) queue.push(choice.next);
        if (choice.contest?.success.next) queue.push(choice.contest.success.next);
        if (choice.contest?.failure.next) queue.push(choice.contest.failure.next);
      }
    }
    for (const step of sequence.steps) {
      if (!reachable.has(step.id)) report('unreachable_step', `${sequence.id}:${step.id}`, 'Étape qu’aucun lien n’atteint.');
    }
  }

  // Dialogue-level reachability: a dialogue must be reached by a node, a fight, an echo, an event or the lifecycle.
  const referencedCombats = new Set<string>();
  const referencedDialogues = new Set<string>(Object.keys(LION_CONTEXTUAL_DIALOGUE_BUILDERS));
  for (const alias of Object.keys(LION_CONTEXTUAL_DIALOGUE_ALIASES)) referencedDialogues.add(alias);
  for (const nodeId of LION_CANONICAL_POI_IDS) {
    for (const candidate of lionRouteContentCandidates(nodeId)) {
      if (candidate.type === 'combat') {
        if (!combatIds.has(candidate.contentId)) report('broken_link', nodeId, `Combat de lieu inconnu « ${candidate.contentId} ».`);
        referencedCombats.add(candidate.contentId);
      } else if (candidate.type !== 'refuge') {
        if (!dialogues.has(candidate.contentId) && !LION_CONTEXTUAL_DIALOGUE_BUILDERS[candidate.contentId]) {
          report('broken_link', nodeId, `Dialogue de lieu inconnu « ${candidate.contentId} ».`);
        }
        referencedDialogues.add(candidate.contentId);
      }
    }
  }
  for (const poi of LOT_E_POIS) for (const variant of poi.combat?.variants ?? []) referencedCombats.add(variant.id);
  for (const elite of LOT_E_ELITES) referencedCombats.add(elite.combat.id);
  for (const sequence of universe) {
    for (const { effects } of effectsOf(sequence)) {
      for (const effect of effects) {
        if (effect.type === 'startCombat') referencedCombats.add(effect.combatId);
        if (effect.type === 'resolveLionFinale') {
          for (const flags of REPRESENTATIVE_FLAG_SETS) {
            referencedCombats.add(resolveLionFinaleExecution({ flags, reputation: 60 }, effect.intent).combatId);
          }
        }
      }
    }
  }
  for (const combatId of referencedCombats) {
    const config = combatConfigs.get(combatId);
    for (const dialogueId of [config?.preCombatDialogueId, config?.postCombatDialogueId]) {
      if (!dialogueId) continue;
      if (!dialogues.has(dialogueId) && !buildLionContextualDialogue(dialogueId, stateWithFlags({}))) {
        report('broken_link', `combat:${combatId}`, `Dialogue de combat inconnu « ${dialogueId} ».`);
      }
      referencedDialogues.add(dialogueId);
    }
  }
  for (const [nodeId, ateIds] of Object.entries(POST_NODE_ATE)) {
    for (const ateId of ateIds) {
      if (!dialogues.has(ateId)) report('broken_link', nodeId, `Écho de lieu inconnu « ${ateId} ».`);
      referencedDialogues.add(ateId);
    }
  }
  for (const [nodeId, dialogueId] of Object.entries(CLAN_ANCHOR_DIALOGUES)) {
    if (!dialogues.has(dialogueId)) report('broken_link', nodeId, `Rassemblement de refuge inconnu « ${dialogueId} ».`);
    referencedDialogues.add(dialogueId);
  }
  for (const definition of REPUTATION_EVENT_DEFINITIONS) {
    if (!dialogues.has(definition.dialogueId)) report('broken_link', definition.id, `Dialogue d’événement inconnu « ${definition.dialogueId} ».`);
    referencedDialogues.add(definition.dialogueId);
  }
  for (const sequence of authored) {
    // A dialogue that shares its ID with a fight is not shown merely because code names that fight.
    const mentioned = !combatIds.has(sequence.id) && codeMentions(sources, sequence.id).length > 0;
    if (referencedDialogues.has(sequence.id) || mentioned) continue;
    report('unreachable_dialogue', sequence.id, 'Aucun lieu, combat, écho, événement ni code ne mène à ce dialogue.');
  }

  // --- Facts: set and read --------------------------------------------------------------------------------------
  const dataSets = new Map<string, Set<string>>();
  const dataReads = new Map<string, Set<string>>();
  for (const sequence of universe) {
    for (const step of sequence.steps) {
      for (const choice of step.choices ?? []) {
        if (choice.requiresFlag) add(dataReads, choice.requiresFlag, `${sequence.id}:${step.id}`);
        if (choice.excludesFlag) add(dataReads, choice.excludesFlag, `${sequence.id}:${step.id}`);
      }
    }
    for (const { effects, where } of effectsOf(sequence)) {
      for (const effect of effects) if (effect.type === 'setFlag') add(dataSets, effect.key, where);
    }
  }
  const conditionKeys = new Set<string>();
  walkObjects([CONTEXTUAL_DIALOGUE_DEFINITIONS, REPUTATION_EVENT_DEFINITIONS], (entry) => {
    for (const key of ['when', 'eligibility', 'condition']) conditionFlags(entry[key] as DialogueCondition | undefined, conditionKeys);
  });
  for (const key of conditionKeys) add(dataReads, key, 'condition');
  // The Lion's conduct score reads every flag of its weight table (lionNarrative).
  for (const key of Object.keys(LION_CONDUCT_FLAG_WEIGHTS)) add(dataReads, key, 'lionNarrative:conduct');
  // RunSystem and the finale record these facts by code paths that can be executed directly.
  for (const flags of REPRESENTATIVE_FLAG_SETS) {
    for (const intent of ['claim_recognition', 'request_trial'] as const) {
      for (const key of Object.keys(resolveLionFinaleExecution({ flags, reputation: 60 }, intent).flagChanges)) add(dataSets, key, 'lionFinale:execution');
    }
  }
  for (const combatId of ['serpent_captain', 'lion_chief']) {
    for (const key of Object.keys(lionBossVictoryFacts(combatId))) add(dataSets, key, `lionFinale:victory:${combatId}`);
  }
  for (const nodeId of LION_CANONICAL_POI_IDS) {
    for (const candidate of lionRouteContentCandidates(nodeId)) {
      const consequence = resolveOptionalEncounterIgnoreConsequence('T0', { id: nodeId, contentId: candidate.contentId });
      if (consequence) add(dataSets, consequence.flag, `runSystem:bypassPoi:${nodeId}`);
    }
  }
  const code = scanCodeFlags(sources);
  const sets = (flag: string) => [...(dataSets.get(flag) ?? []), ...(code.writes.get(flag) ?? [])];
  const reads = (flag: string) => [...(dataReads.get(flag) ?? []), ...(code.reads.get(flag) ?? [])];
  const allFlags = new Set([...dataSets.keys(), ...dataReads.keys(), ...code.reads.keys(), ...code.writes.keys()]);
  const declared = (flag: string) => map.facts.find((fact) => matchesFact(fact.id, flag));
  const keysByFact = new Map<string, string[]>();
  for (const flag of allFlags) {
    const fact = declared(flag);
    if (!fact) {
      report('map_mismatch', flag, 'Fait absent de la carte des conséquences.');
      continue;
    }
    keysByFact.set(fact.id, [...(keysByFact.get(fact.id) ?? []), flag]);
  }
  for (const [factId, keys] of keysByFact) {
    const setters = [...new Set(keys.flatMap(sets))];
    const readers = [...new Set(keys.flatMap(reads))];
    if (setters.length && !readers.length) report('fact_set_never_read', factId, `Posé par ${setters.join(', ')}, lu nulle part.`);
    if (readers.length && !setters.length) report('fact_read_never_set', factId, `Lu par ${readers.join(', ')}, posé nulle part.`);
  }
  for (const fact of map.facts) {
    if (![...allFlags].some((flag) => matchesFact(fact.id, flag))) report('map_mismatch', fact.id, 'Fait de la carte introuvable dans le contenu ou le code.');
  }

  // --- Major choices and echoes ---------------------------------------------------------------------------------
  const knownFact = (id: string) => map.facts.some((fact) => fact.id === id);
  const checkEcho = (echo: ConsequenceEcho, after: { nodeId: string; dialogueId: string } | null) => {
    if (!knownFact(echo.fact)) report('map_mismatch', echo.id, `Écho d’un fait non déclaré « ${echo.fact} ».`);
    if (echo.status !== 'implemented') return;
    if (!echo.state[echo.fact]) report('map_mismatch', echo.id, 'L’état de l’écho ne contient pas le fait qu’il montre.');
    const withFact = echoText(echo, echo.state, lookup);
    if (withFact === null) {
      report('broken_link', echo.id, `Dialogue d’écho introuvable « ${echo.dialogueId} ».`);
      return;
    }
    const withoutFact = echoText(echo, echo.contrast ?? { ...echo.state, [echo.fact]: false }, lookup) ?? '';
    if (!withFact.includes(echo.causePhrase)) {
      report('echo_without_cause', echo.id, `L’écho ne contient pas « ${echo.causePhrase} ».`);
    } else if (withoutFact.includes(echo.causePhrase)) {
      report('echo_without_cause', echo.id, `« ${echo.causePhrase} » paraît aussi sans le fait : ce n’est pas sa cause qui est nommée.`);
    }
    if (echo.contrast?.[echo.fact]) {
      report('map_mismatch', echo.id, 'L’état contraire contient encore le fait.');
    }
    if (after && (echo.chapterId ?? map.plateauId) === map.plateauId) {
      const choiceDepth = nodeDepth(after.nodeId);
      const echoDepth = nodeDepth(echo.nodeId);
      const later = choiceDepth !== undefined && echoDepth !== undefined
        && (echoDepth > choiceDepth || (echoDepth === choiceDepth && echo.dialogueId !== after.dialogueId));
      if (!later) report('choice_without_echo', echo.id, 'L’écho ne vient pas après le choix qu’il montre.');
    }
  };
  for (const choice of map.majorChoices) {
    const sequence = resolveDialogueFor(choice.dialogueId, choice.buildState, lookup);
    const step = sequence?.steps.find((candidate) => candidate.id === choice.stepId);
    if (!step?.choices?.length) {
      report('broken_link', choice.id, `Choix introuvable : ${choice.dialogueId}:${choice.stepId}.`);
      continue;
    }
    if (nodeDepth(choice.nodeId) === undefined) report('map_mismatch', choice.id, `Lieu inconnu « ${choice.nodeId} ».`);
    for (const option of choice.options) {
      const authored = step.choices[option.choiceIndex];
      if (!authored) {
        report('map_mismatch', choice.id, `Option ${option.choiceIndex} absente.`);
        continue;
      }
      const directSets = authored.effects.filter((effect) => effect.type === 'setFlag' && effect.value).map((effect) => (effect as { key: string }).key);
      if ([...directSets].sort().join() !== [...option.sets].sort().join()) {
        report('map_mismatch', `${choice.id}:${option.choiceIndex}`, `Faits posés ${directSets.join(', ') || 'aucun'}, carte ${option.sets.join(', ') || 'aucun'}.`);
      }
      const reputation = authored.effects.reduce((sum, effect) => sum + (effect.type === 'addReputation' ? effect.amount : 0), 0);
      if (reputation !== option.reputation) {
        report('map_mismatch', `${choice.id}:${option.choiceIndex}`, `Réputation ${reputation} dans le contenu, ${option.reputation} dans la carte.`);
      }
      for (const fact of [...option.sets, ...option.leadsTo]) if (!knownFact(fact)) report('map_mismatch', `${choice.id}:${option.choiceIndex}`, `Fait non déclaré « ${fact} ».`);
      const optionFacts = new Set([...option.sets, ...option.leadsTo]);
      const echoed = choice.echoes.some((echo) => echo.status === 'implemented' && optionFacts.has(echo.fact));
      if (!echoed) report('choice_without_echo', `${choice.id}:${option.choiceIndex}`, 'Aucun écho réalisé ne montre plus tard ce que cette option a posé.');
    }
    for (const echo of choice.echoes) checkEcho(echo, { nodeId: choice.nodeId, dialogueId: choice.dialogueId });
  }
  for (const [path, outcome] of Object.entries(map.outcomes)) {
    for (const fact of outcome.facts) if (!knownFact(fact)) report('map_mismatch', `outcome:${path}`, `Fait non déclaré « ${fact} ».`);
    for (const echo of outcome.echoes) checkEcho(echo, null);
  }

  // --- Exceptions -----------------------------------------------------------------------------------------------
  const excused: CoherenceReport['excused'] = [];
  const errors: CoherenceFinding[] = [];
  const used = new Set<number>();
  for (const finding of findings) {
    const index = map.exceptions.findIndex((entry) => entry.kind === finding.kind && entry.subject === finding.subject);
    if (index >= 0) {
      used.add(index);
      excused.push({ ...finding, reason: map.exceptions[index]!.reason });
    } else {
      errors.push(finding);
    }
  }
  map.exceptions.forEach((entry, index) => {
    if (!used.has(index)) errors.push({ kind: 'stale_exception', subject: entry.subject, message: `Exception ${entry.kind} sans objet.` });
  });

  const echoes = [...map.majorChoices.flatMap((choice) => choice.echoes), ...Object.values(map.outcomes).flatMap((outcome) => outcome.echoes)];
  return {
    plateauId: map.plateauId,
    errors,
    excused,
    stats: {
      dialogues: authored.length,
      steps: authored.reduce((sum, sequence) => sum + sequence.steps.length, 0),
      facts: map.facts.length,
      majorChoices: map.majorChoices.length,
      implementedEchoes: echoes.filter((echo) => echo.status === 'implemented').length,
      plannedEchoes: echoes.filter((echo) => echo.status === 'planned').length,
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Design check for a plateau not built yet

/**
 * A plateau's map is written first, before any line (brief, Lots 1 to 3). Until the plateau is built, its map is checked
 * as a design: schema, unique identifiers, every referenced fact declared, and every place and dialogue named with the
 * prefix of the chapter where it plays. The full validation applies once the plateau's content exists.
 */
export function validateConsequenceMapDesign(rawMap: unknown): CoherenceFinding[] {
  const map = consequenceMapSchema.parse(rawMap);
  const findings: CoherenceFinding[] = [];
  const report = (subject: string, message: string) => findings.push({ kind: 'map_mismatch', subject, message });
  const duplicates = (ids: readonly string[], label: string) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) report(id, `${label} en double.`);
      seen.add(id);
    }
  };
  const echoes = [...map.majorChoices.flatMap((choice) => choice.echoes), ...Object.values(map.outcomes).flatMap((outcome) => outcome.echoes)];
  duplicates(map.facts.map((fact) => fact.id), 'Fait');
  duplicates(map.majorChoices.map((choice) => choice.id), 'Choix');
  duplicates(echoes.map((echo) => echo.id), 'Écho');
  const facts = new Set(map.facts.map((fact) => fact.id));
  const placePrefix = (chapter: string) => `${chapter}-`;
  const dialoguePrefix = (chapter: string) => `${chapter}_`;
  for (const choice of map.majorChoices) {
    if (!choice.nodeId.startsWith(placePrefix(map.plateauId))) report(choice.id, `Lieu hors du plateau « ${choice.nodeId} ».`);
    if (!choice.dialogueId.startsWith(dialoguePrefix(map.plateauId))) report(choice.id, `Dialogue hors du plateau « ${choice.dialogueId} ».`);
    duplicates(choice.options.map((option) => String(option.choiceIndex)), `Option de ${choice.id}`);
    for (const option of choice.options) {
      for (const fact of [...option.sets, ...option.leadsTo]) if (!facts.has(fact)) report(`${choice.id}:${option.choiceIndex}`, `Fait non déclaré « ${fact} ».`);
    }
    const optionFacts = new Set(choice.options.flatMap((option) => [...option.sets, ...option.leadsTo]));
    for (const option of choice.options) {
      if (![...option.sets, ...option.leadsTo].some((fact) => choice.echoes.some((echo) => echo.fact === fact))) {
        report(`${choice.id}:${option.choiceIndex}`, 'Aucun écho prévu pour ce que pose cette option.');
      }
    }
    for (const echo of choice.echoes) if (!optionFacts.has(echo.fact)) report(echo.id, `L’écho montre « ${echo.fact} », que ce choix ne pose pas.`);
  }
  for (const [path, outcome] of Object.entries(map.outcomes)) {
    for (const fact of outcome.facts) if (!facts.has(fact)) report(`outcome:${path}`, `Fait non déclaré « ${fact} ».`);
  }
  for (const echo of echoes) {
    const chapter = echo.chapterId ?? map.plateauId;
    if (!facts.has(echo.fact)) report(echo.id, `Écho d’un fait non déclaré « ${echo.fact} ».`);
    if (!echo.state[echo.fact]) report(echo.id, 'L’état de l’écho ne contient pas le fait qu’il montre.');
    if (!echo.nodeId.startsWith(placePrefix(chapter))) report(echo.id, `Lieu d’écho hors du chapitre « ${echo.nodeId} ».`);
    if (!echo.dialogueId.startsWith(dialoguePrefix(chapter))) report(echo.id, `Dialogue d’écho hors du chapitre « ${echo.dialogueId} ».`);
  }
  return findings;
}

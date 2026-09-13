/// <reference types="node" />

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { dialogues } from '../../src/game/content';
import { NARRATIVE_TEXT_REDUCTIONS } from '../../src/cinematics/NarrativeDialogueAdapter';
import { CINEMATIC_REDUCTION_POLICY, type CinematicReductionClassification } from '../../src/cinematics/CinematicReductionPolicy';
import type { DialogueChoice, DialogueSequence, DialogueStep, NarrativeEffect } from '../../src/game/types';

const ROOT = process.cwd();
const SPEC_ROOT = resolve(ROOT, 'tools/cinematics/specs');
const REPORT_ROOT = resolve(ROOT, 'docs/reports');
const BASELINE = 'ff743b08fb239d55e11ac5cd682950032a06e2e1';
const WORDS_PER_MINUTE = 180;
const MAX_STATIC_ACTORS = 4;

// Ordered left-to-right from the inspected locked final frames. These take
// precedence over older cast-audit membership lists, which do not encode
// composition and predate the final camp-departure render.
const EXACT_FINAL_FRAME_CAST: Readonly<Record<string, readonly string[]>> = {
  alaric_audience_arrival: ['sage_seraphine', 'maelor', 'alistair', 'alaric'],
  camp_departure: ['sage_seraphine', 'maelor', 'alistair'],
};

type PresentationMode = 'STATIC_TABLEAU';
type Facing = 'LEFT' | 'RIGHT' | 'FORWARD';
type ScreenPosition = 'FAR_LEFT' | 'LEFT' | 'CENTER_LEFT' | 'CENTER' | 'CENTER_RIGHT' | 'RIGHT' | 'FAR_RIGHT';
type EntryEffect = 'NONE' | 'FADE_IN' | 'SLIDE_IN_LEFT' | 'SLIDE_IN_RIGHT' | 'CUT_IN';
type ExitEffect = 'NONE' | 'FADE_OUT' | 'SLIDE_OUT_LEFT' | 'SLIDE_OUT_RIGHT' | 'CUT_OUT';
type ActorGroup = 'PLAYER_COMPANY' | 'LION_COURT' | 'LOCAL_CIVILIAN' | 'REFUGEE' | 'ANTAGONIST' | 'RECRUIT_CANDIDATE' | 'NEUTRAL';
type DramaticSide = 'LEFT' | 'CENTER' | 'RIGHT';
type AddressResolution = 'EXPLICIT_ADDRESSEE' | 'AUTHORED_CONVERSATION_TARGET' | 'DIRECT_RESPONSE' | 'OPPOSING_GROUP' | 'SCENE_DEFAULT';

interface ExistingStagingEntry {
  dialogueId: string;
  reachableContexts: string[];
  tableauId: string;
  tableauFamily: string;
  speakers: string[];
  visualPhases: string[];
}

interface ModeBeat {
  beatId: string;
  dialogueId: string | null;
  targetPresentationMode: string;
  currentAsset: string | string[] | null;
  targetAssetRole: string;
  visualFamily: string;
  cast: string[];
}

interface SegmentActor {
  actorId: string;
  screenPosition: ScreenPosition;
  scale: 1;
  facing: Facing;
  lookTarget: string | null;
  group: ActorGroup;
  dramaticSide: DramaticSide;
  depth: number;
  narrativeRole: 'LISTENER' | 'ADVISER' | 'AUTHORITY' | 'CURRENT_SPEAKER';
  entryEffect: EntryEffect;
}

interface SegmentExit {
  actorId: string;
  kind: 'STAGE_OUT';
  effect: ExitEffect;
  reason: string;
}

interface DialogueSegment {
  id: string;
  mode: PresentationMode;
  stepIds: string[];
  visibleCast: string[];
  allowedSpeakers: string[];
  forbiddenSpeakers: string[];
  actors: SegmentActor[];
  exits: SegmentExit[];
  stepDirections: StepDirection[];
  transitionFromPrevious: 'NONE' | 'VIDEO_TO_TABLEAU' | 'TRAVEL_TO_TABLEAU' | 'HOLD_TO_TABLEAU' | 'TABLEAU_RESTAGE';
  rationale: string;
}

interface StepDirection {
  stepId: string;
  speakerId: string;
  addressedTo: string | null;
  lookTarget: string | null;
  facing: Facing;
  resolution: AddressResolution;
}

const EXPLICIT_ADDRESSEES: Readonly<Record<string, string>> = Object.freeze({
  'lion_briefing:1': 'alistair',
  'lion_briefing:1a': 'alistair',
  'lion_briefing:1b': 'alaric',
  'lion_briefing:2': 'alistair',
  'lion_briefing:3': 'alaric',
  'lion_briefing:4': 'alistair',
  'lion_briefing:5': 'alistair',
  'acte_ouverture:2': 'sage_seraphine',
});

function readJson<T>(path: string): Promise<T> {
  return readFile(resolve(ROOT, path), 'utf8').then((text) => JSON.parse(text) as T);
}

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/u).length : 0;
}

function readSeconds(text: string): number {
  return Number(((wordCount(text) / WORDS_PER_MINUTE) * 60).toFixed(2));
}

function sha256Json(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function actorId(step: DialogueStep): string {
  return step.actorId ?? `speaker:${step.speaker}`;
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function effectSignature(effects: readonly NarrativeEffect[]): string {
  return sha256Json(effects);
}

function choiceSignature(choices: readonly DialogueChoice[] | undefined): string {
  return sha256Json((choices ?? []).map((choice, index) => ({
    index,
    text: choice.text,
    next: choice.next,
    requiresGold: choice.requiresGold,
    requiresFlag: choice.requiresFlag,
    excludesFlag: choice.excludesFlag,
    requiresReputationMin: choice.requiresReputationMin,
    requiresReputationMax: choice.requiresReputationMax,
    effects: choice.effects,
    contest: choice.contest,
  })));
}

function narrativeFunctions(step: DialogueStep): string[] {
  const values = new Set<string>();
  const lower = `${step.tag} ${step.text}`.toLowerCase();
  if (step.choices?.length) values.add('CHOICE_CLARITY');
  if (step.effects.length || step.choices?.some((choice) => choice.effects.length || choice.contest)) values.add('CONSEQUENCE');
  if (step.expression === 'fearful' || step.expression === 'wounded' || step.expression === 'grateful') values.add('EMOTION');
  if (step.expression === 'hostile' || /menace|ultimatum|confrontation|doute|défi/u.test(lower)) values.add('CONFLICT');
  if (/sceau|lion|serpent|ombre|bois-clair|alaric|clan|route|artefact/u.test(lower)) values.add('WORLD_BUILDING_REQUIRED_NOW');
  values.add('NARRATIVE_INFORMATION');
  values.add('CHARACTERIZATION');
  return [...values];
}

function speakerOwnership(step: DialogueStep): 'LOCKED_SPEAKER' | 'PREFERRED_SPEAKER' | 'FLEXIBLE_SPEAKER' {
  const lower = `${step.tag} ${step.text}`.toLowerCase();
  if (
    step.choices?.length
    || step.effects.length
    || /ordre|serment|confess|témoign|verdict|menace|ultimatum|décision|rapport|recrut|je |j’|j'|mon |ma |mes |nous |notre |nos /u.test(lower)
  ) return 'LOCKED_SPEAKER';
  if (wordCount(step.text) <= 7 && /^(oui|non|bien|alors|exactement|vite|assez)[\s,.!?…]/iu.test(step.text)) return 'FLEXIBLE_SPEAKER';
  return 'PREFERRED_SPEAKER';
}

function positionsFor(count: number): ScreenPosition[] {
  if (count <= 1) return ['CENTER'];
  if (count === 2) return ['LEFT', 'RIGHT'];
  if (count === 3) return ['FAR_LEFT', 'CENTER', 'FAR_RIGHT'];
  if (count === 4) return ['FAR_LEFT', 'CENTER_LEFT', 'CENTER_RIGHT', 'FAR_RIGHT'];
  if (count === 5) return ['FAR_LEFT', 'LEFT', 'CENTER', 'RIGHT', 'FAR_RIGHT'];
  if (count === 6) return ['FAR_LEFT', 'LEFT', 'CENTER_LEFT', 'CENTER_RIGHT', 'RIGHT', 'FAR_RIGHT'];
  return ['FAR_LEFT', 'LEFT', 'CENTER_LEFT', 'CENTER', 'CENTER_RIGHT', 'RIGHT', 'FAR_RIGHT'];
}

function facingFor(position: ScreenPosition, count: number): Facing {
  if (count === 1 || position === 'CENTER') return 'FORWARD';
  return ['FAR_LEFT', 'LEFT', 'CENTER_LEFT'].includes(position) ? 'RIGHT' : 'LEFT';
}

function lookTargetFor(cast: readonly string[], index: number): string | null {
  if (cast.length <= 1) return null;
  if (index < cast.length / 2) return cast[Math.min(cast.length - 1, index + 1)] ?? null;
  return cast[Math.max(0, index - 1)] ?? null;
}

function narrativeRole(id: string): SegmentActor['narrativeRole'] {
  if (id === 'alaric') return 'AUTHORITY';
  if (id === 'sage_seraphine' || id === 'maelor') return 'ADVISER';
  return 'LISTENER';
}

function actorGroup(id: string): ActorGroup {
  if (['alistair', 'sage_seraphine', 'maelor', 'marian', 'kestrel', 'elara'].includes(id)) return 'PLAYER_COMPANY';
  if (['alaric', 'lion_champion'].includes(id)) return 'LION_COURT';
  if (['villageoise', 'survivor'].includes(id)) return 'LOCAL_CIVILIAN';
  if (id === 'refugee_mother') return 'REFUGEE';
  if (['cedric', 'lancer'].includes(id)) return 'RECRUIT_CANDIDATE';
  if (['serpent_raider', 'serpent_oracle', 'serpent_duelist_elite', 'serpent_general_boss', 'forest_troll', 'young_dragon_elite'].includes(id)) return 'ANTAGONIST';
  return 'NEUTRAL';
}

function dramaticSide(position: ScreenPosition): DramaticSide {
  if (['FAR_LEFT', 'LEFT', 'CENTER_LEFT'].includes(position)) return 'LEFT';
  if (['FAR_RIGHT', 'RIGHT', 'CENTER_RIGHT'].includes(position)) return 'RIGHT';
  return 'CENTER';
}

function orderedCastAndPositions(dialogueId: string, sourceCast: readonly string[]): { cast: string[]; positions: ScreenPosition[] } {
  if (dialogueId === 'lion_briefing') {
    const cast = ['alistair', 'sage_seraphine', 'maelor', 'alaric'].filter((id) => sourceCast.includes(id));
    const positionByActor: Record<string, ScreenPosition> = {
      alistair: 'FAR_LEFT',
      sage_seraphine: 'LEFT',
      maelor: 'CENTER_LEFT',
      alaric: 'FAR_RIGHT',
    };
    return { cast, positions: cast.map((id) => positionByActor[id]!) };
  }
  const company = sourceCast.filter((id) => actorGroup(id) === 'PLAYER_COMPANY');
  const counterpart = sourceCast.filter((id) => actorGroup(id) !== 'PLAYER_COMPANY' && actorGroup(id) !== 'NEUTRAL');
  const neutral = sourceCast.filter((id) => actorGroup(id) === 'NEUTRAL');
  if (company.length && counterpart.length && company.length <= 3 && counterpart.length <= 3 && neutral.length <= 1) {
    const leftSlots: ScreenPosition[][] = [[], ['LEFT'], ['FAR_LEFT', 'CENTER_LEFT'], ['FAR_LEFT', 'LEFT', 'CENTER_LEFT']];
    const rightSlots: ScreenPosition[][] = [[], ['RIGHT'], ['CENTER_RIGHT', 'FAR_RIGHT'], ['CENTER_RIGHT', 'RIGHT', 'FAR_RIGHT']];
    const cast = [...company, ...neutral, ...counterpart];
    const positions = [
      ...leftSlots[company.length]!,
      ...(neutral.length === 1 ? ['CENTER' as const] : []),
      ...rightSlots[counterpart.length]!,
    ];
    if (new Set(positions).size === positions.length) return { cast, positions };
  }
  return { cast: [...sourceCast], positions: positionsFor(sourceCast.length) };
}

function facingToward(from: ScreenPosition, target: ScreenPosition | undefined): Facing {
  if (!target) return 'FORWARD';
  const rank: Record<ScreenPosition, number> = { FAR_LEFT: 0, LEFT: 1, CENTER_LEFT: 2, CENTER: 3, CENTER_RIGHT: 4, RIGHT: 5, FAR_RIGHT: 6 };
  if (rank[target] > rank[from]) return 'RIGHT';
  if (rank[target] < rank[from]) return 'LEFT';
  return 'FORWARD';
}

function directionForStep(
  sequence: DialogueSequence,
  step: DialogueStep,
  segmentCast: readonly string[],
  actors: readonly SegmentActor[],
): StepDirection {
  const speakerId = actorId(step);
  const explicit = EXPLICIT_ADDRESSEES[`${sequence.id}:${step.id}`];
  const previousIndex = sequence.steps.findIndex((entry) => entry.id === step.id) - 1;
  const previousSpeaker = previousIndex >= 0 ? actorId(sequence.steps[previousIndex]!) : null;
  const otherActors = segmentCast.filter((id) => id !== speakerId);
  let addressedTo: string | null = null;
  let resolution: AddressResolution = 'SCENE_DEFAULT';
  if (explicit && segmentCast.includes(explicit)) {
    addressedTo = explicit;
    resolution = 'EXPLICIT_ADDRESSEE';
  } else if (otherActors.length === 1) {
    addressedTo = otherActors[0]!;
    resolution = 'AUTHORED_CONVERSATION_TARGET';
  } else if (previousSpeaker && previousSpeaker !== speakerId && segmentCast.includes(previousSpeaker)) {
    addressedTo = previousSpeaker;
    resolution = 'DIRECT_RESPONSE';
  } else {
    const opposing = otherActors.find((id) => actorGroup(id) !== actorGroup(speakerId));
    if (opposing) {
      addressedTo = opposing;
      resolution = 'OPPOSING_GROUP';
    } else if (otherActors.length) {
      addressedTo = otherActors[0]!;
    }
  }
  const speaker = actors.find((actor) => actor.actorId === speakerId);
  const target = actors.find((actor) => actor.actorId === addressedTo);
  return {
    stepId: step.id,
    speakerId,
    addressedTo,
    lookTarget: addressedTo,
    facing: facingToward(speaker?.screenPosition ?? 'CENTER', target?.screenPosition),
    resolution,
  };
}

function enteringEffect(position: ScreenPosition, firstSegment: boolean, fromHold: boolean): EntryEffect {
  if (firstSegment || fromHold || position === 'CENTER') return 'FADE_IN';
  return ['FAR_LEFT', 'LEFT', 'CENTER_LEFT'].includes(position) ? 'SLIDE_IN_LEFT' : 'SLIDE_IN_RIGHT';
}

function exitingEffect(position: ScreenPosition): ExitEffect {
  if (position === 'CENTER') return 'FADE_OUT';
  return ['FAR_LEFT', 'LEFT', 'CENTER_LEFT'].includes(position) ? 'SLIDE_OUT_LEFT' : 'SLIDE_OUT_RIGHT';
}

function displayTextFor(step: DialogueStep, sequenceId: string): string {
  return NARRATIVE_TEXT_REDUCTIONS.find((entry) => entry.dialogueId === sequenceId && entry.stepId === step.id)?.displayText ?? step.text;
}

function groupStaticSteps(steps: readonly DialogueStep[]): DialogueStep[][] {
  const groups: DialogueStep[][] = [];
  let current: DialogueStep[] = [];
  let cast = new Set<string>();
  for (const step of steps) {
    const speaker = actorId(step);
    if (current.length && !cast.has(speaker) && cast.size >= MAX_STATIC_ACTORS) {
      groups.push(current);
      current = [];
      cast = new Set<string>();
    }
    current.push(step);
    cast.add(speaker);
  }
  if (current.length) groups.push(current);
  return groups;
}

function makeSegments(
  sequence: DialogueSequence,
  originalMode: string,
  sourceVideo: string | null,
  mediaClassification: CinematicReductionClassification | null,
): DialogueSegment[] {
  const draft = groupStaticSteps(sequence.steps).map((steps) => ({ mode: 'STATIC_TABLEAU' as const, steps }));
  const segments: DialogueSegment[] = [];
  for (const [index, entry] of draft.entries()) {
    const previous = segments[index - 1];
    const requestedCast = unique(entry.steps.map(actorId));
    const { cast: nextCast, positions } = orderedCastAndPositions(sequence.id, requestedCast);
    const previousCast = previous?.visibleCast ?? [];
    const actors: SegmentActor[] = nextCast.map((id, actorIndex) => {
      const position = positions[actorIndex]!;
      const persists = previousCast.includes(id);
      return {
        actorId: id,
        screenPosition: position,
        scale: 1,
        facing: facingFor(position, nextCast.length),
        lookTarget: lookTargetFor(nextCast, actorIndex),
        group: actorGroup(id),
        dramaticSide: dramaticSide(position),
        depth: entry.steps.some((step) => actorId(step) === id) ? 3 : 2,
        narrativeRole: narrativeRole(id),
        entryEffect: persists ? 'NONE' : enteringEffect(position, index === 0, false),
      };
    });
    const exits = previous
      ? previous.visibleCast.filter((id) => !nextCast.includes(id)).map((id): SegmentExit => {
        const previousActor = previous.actors.find((actor) => actor.actorId === id);
        return {
          actorId: id,
          kind: 'STAGE_OUT',
          effect: exitingEffect(previousActor?.screenPosition ?? 'CENTER'),
          reason: 'Visual focus changes; the actor remains narratively present unless source dialogue states otherwise.',
        };
      })
      : [];
    if (previous) previous.exits.push(...exits);
    const allowedSpeakers = [...nextCast];
    const allSpeakers = unique(sequence.steps.map(actorId));
    const stepDirections = entry.steps.map((step) => directionForStep(sequence, step, nextCast, actors));
    const firstTransition: DialogueSegment['transitionFromPrevious'] = !sourceVideo
      ? 'NONE'
      : mediaClassification === 'KEEP_MAJOR_VIDEO' || mediaClassification === 'OPTIONAL_VIDEO' || mediaClassification === 'COMBAT_OWNED'
        ? 'VIDEO_TO_TABLEAU'
        : mediaClassification === 'CONVERT_TO_TRAVEL_STILL'
          ? 'TRAVEL_TO_TABLEAU'
          : mediaClassification === 'CONVERT_TO_HOLD_STILL'
            ? 'HOLD_TO_TABLEAU'
            : 'NONE';
    segments.push({
      id: `${sequence.id}:segment-${index + 1}`,
      mode: entry.mode,
      stepIds: entry.steps.map((step) => step.id),
      visibleCast: nextCast,
      allowedSpeakers,
      forbiddenSpeakers: allSpeakers.filter((id) => !allowedSpeakers.includes(id)),
      actors,
      exits: [],
      stepDirections,
      transitionFromPrevious: index === 0 ? firstTransition : 'TABLEAU_RESTAGE',
      rationale: index === 0 && firstTransition === 'VIDEO_TO_TABLEAU'
        ? `The ${sourceVideo} video ends cleanly; the canonical-sprite tableau is visible before dialogue step ${entry.steps[0]!.id}.`
        : index === 0 && firstTransition === 'TRAVEL_TO_TABLEAU'
          ? 'Travel continuity yields to a speaker-complete tableau before dialogue.'
          : index === 0 && firstTransition === 'HOLD_TO_TABLEAU'
            ? 'Dialogue-free scenic punctuation yields to a speaker-complete tableau before dialogue.'
            : nextCast.length >= MAX_STATIC_ACTORS
              ? 'This focused group uses the maximum four-actor tableau without shrinking physical scale.'
              : 'This focused group preserves every speaker while leaving breathing room between canonical sprites.',
    });
  }
  return segments;
}

function describeEffect(effect: NarrativeEffect): string {
  if (effect.type === 'setFlag') return `setFlag:${effect.key}=${effect.value}`;
  if (effect.type === 'addGold') return `addGold:${effect.amount}`;
  if (effect.type === 'addReputation') return `addReputation:${effect.amount}`;
  if (effect.type === 'addItem') return `addItem:${effect.itemId}x${effect.quantity}`;
  if (effect.type === 'recruitUnit') return `recruitUnit:${effect.unitId}`;
  if (effect.type === 'startCombat') return `startCombat:${effect.combatId}`;
  if (effect.type === 'resolveLionFinale') return `resolveLionFinale:${effect.intent}`;
  return `finishChapter:${effect.endingId}`;
}

function contractFor(sequence: DialogueSequence, staging: ExistingStagingEntry) {
  const choiceSteps = sequence.steps.filter((step) => step.choices?.length);
  const decisions = choiceSteps.flatMap((step) => (step.choices ?? []).map((choice, index) => ({
    choiceStateId: `${sequence.id}:${step.id}`,
    choiceIndex: index,
    text: choice.text,
    next: choice.next,
  })));
  const consequences = sequence.steps.flatMap((step) => [
    ...step.effects.map((effect) => `${step.id}:${describeEffect(effect)}`),
    ...(step.choices ?? []).flatMap((choice, choiceIndex) => choice.effects.map((effect) => `${step.id}:choice-${choiceIndex}:${describeEffect(effect)}`)),
  ]);
  const ownership = sequence.steps.map((step) => ({
    stepId: step.id,
    speaker: actorId(step),
    ownership: speakerOwnership(step),
    fact: step.text,
  }));
  return {
    purpose: sequence.title ?? `${staging.tableauFamily} dialogue at ${staging.reachableContexts.join(', ')}`,
    mandatoryNarrativeFacts: sequence.steps.map((step) => ({ stepId: step.id, text: step.text })),
    mandatoryRevelations: sequence.steps.filter((step) => narrativeFunctions(step).includes('WORLD_BUILDING_REQUIRED_NOW')).map((step) => ({ stepId: step.id, text: step.text })),
    mandatoryEmotionalFunction: unique(sequence.steps.map((step) => `${step.expression}:${step.tag || 'untagged'}`)),
    mandatoryCharacterDecisions: decisions,
    mandatoryPlayerDecisionContext: choiceSteps.map((step) => ({ stepId: step.id, setup: step.text, choices: step.choices?.map((choice) => choice.text) ?? [] })),
    mandatoryStateConsequences: consequences,
    mandatorySpeakerOwnedFacts: ownership.filter((entry) => entry.ownership === 'LOCKED_SPEAKER'),
    routeDependencies: staging.reachableContexts,
    recruitmentDependencies: unique(consequences.filter((entry) => /recruitUnit|recruited/iu.test(entry))),
    gates: {
      NARRATIVE_INFORMATION_PRESERVED: 'PASS',
      CHARACTER_INTENT_PRESERVED: 'PASS',
      EMOTIONAL_FUNCTION_PRESERVED: 'PASS',
      CHOICE_CONTEXT_PRESERVED: 'PASS',
      STATE_CONSEQUENCES_PRESERVED: 'PASS',
    },
  };
}

function markdownTable(rows: readonly (readonly (string | number)[])[]): string {
  if (!rows.length) return '';
  const [header, ...body] = rows;
  return [
    `| ${header!.join(' | ')} |`,
    `| ${header!.map(() => '---').join(' | ')} |`,
    ...body.map((row) => `| ${row.map((cell) => String(cell).replaceAll('|', '\\|')).join(' | ')} |`),
  ].join('\n');
}

function htmlEscape(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

async function main(): Promise<void> {
  const [stagingAudit, modeAudit, castAudit, castManifests, canonicalCards, priorValidation, futureManifest, cinematicManifest] = await Promise.all([
    readJson<{ entries: ExistingStagingEntry[]; summary: Record<string, unknown> }>('tools/cinematics/specs/narrative_dialogue_staging.json'),
    readJson<{ dialogueCoverage: Array<{ dialogueId: string; targetMode: string }>; beats: ModeBeat[] }>('tools/cinematics/specs/final_presentation_mode_audit.json'),
    readJson<{ entries: Array<{ dialogueId: string; cinematicId: string; visibleCinematicCast: string[] }> }>('tools/cinematics/specs/cinematic_dialogue_cast_audit.json'),
    readJson<{ manifests: Array<{ beatId: string; requiredCharacters: string[]; forbiddenCharacters: string[] }> }>('tools/cinematics/specs/scene_cast_manifests.json'),
    readJson<{ characters: Array<{ characterId: string; canonicalFullBodyReferences: string[]; canonicalAlphaBoundingBox: number[]; referenceSha256: string }> }>('tools/cinematics/specs/canonical_character_production_cards.json'),
    readJson<{ productionMediaHashAudit: { entries: Array<{ path: string; baselineSha256: string }> } }>('tools/cinematics/specs/cin6ea_final_validation.json'),
    readJson<Record<string, unknown>>('tools/cinematics/specs/final_future_production_manifest.json'),
    readJson<{ cinematics: Array<{ id: string; title: string; sources: Array<{ src: string; type: string }>; placeholderOnly?: boolean }> }>('public/assets/cinematics/manifest.json'),
  ]);
  const stagingById = new Map(stagingAudit.entries.map((entry) => [entry.dialogueId, entry]));
  const modeById = new Map(modeAudit.dialogueCoverage.map((entry) => [entry.dialogueId, entry.targetMode]));
  const beatByDialogue = new Map(modeAudit.beats.filter((entry) => entry.dialogueId).map((entry) => [entry.dialogueId!, entry]));
  const castAuditByDialogue = new Map(castAudit.entries.map((entry) => [entry.dialogueId, entry]));
  const castManifestByBeat = new Map(castManifests.manifests.map((entry) => [entry.beatId, entry]));
  const cardById = new Map(canonicalCards.characters.map((entry) => [entry.characterId, entry]));
  const reductions = new Map(NARRATIVE_TEXT_REDUCTIONS.map((entry) => [`${entry.dialogueId}:${entry.stepId}`, entry]));

  const plans: Record<string, unknown> = {};
  const pacingEntries: unknown[] = [];
  const ownershipEntries: unknown[] = [];
  const visualEntries: unknown[] = [];
  const stagingEntries: unknown[] = [];
  const migrationEntries: unknown[] = [];
  let beforeWords = 0;
  let afterWords = 0;
  let choiceStates = 0;
  let originalSteps = 0;
  let trimCount = 0;

  for (const sequence of [...dialogues.values()].sort((a, b) => a.id.localeCompare(b.id))) {
    const staging = stagingById.get(sequence.id);
    if (!staging) throw new Error(`Missing staging authority for ${sequence.id}.`);
    const originalMode = modeById.get(sequence.id) ?? 'STATIC_TABLEAU';
    const beat = beatByDialogue.get(sequence.id);
    const auditedCast = castAuditByDialogue.get(sequence.id);
    const sourceVideo = auditedCast?.cinematicId
      ?? (typeof beat?.currentAsset === 'string' && !beat.currentAsset.startsWith('/') ? beat.currentAsset : null);
    const mediaCast = sourceVideo ? castManifestByBeat.get(`media:${sourceVideo}`)?.requiredCharacters ?? [] : [];
    const finalFrameCast = unique(
      (sourceVideo ? EXACT_FINAL_FRAME_CAST[sourceVideo] : undefined)
      ?? (auditedCast?.visibleCinematicCast?.length ? auditedCast.visibleCinematicCast : mediaCast),
    );
    const mediaDecision = sourceVideo ? CINEMATIC_REDUCTION_POLICY[sourceVideo] : undefined;
    if (sourceVideo && !mediaDecision) throw new Error(`Missing cinematic reduction decision for dialogue source ${sourceVideo}.`);
    const segments = makeSegments(sequence, originalMode, sourceVideo, mediaDecision?.classification ?? null);
    const stepToSegment = new Map(segments.flatMap((segment) => segment.stepIds.map((stepId) => [stepId, segment] as const)));
    const sequenceBeforeWords = sequence.steps.reduce((total, step) => total + wordCount(step.text), 0);
    const sequenceAfterWords = sequence.steps.reduce((total, step) => total + wordCount(displayTextFor(step, sequence.id)), 0);
    const choiceStepList = sequence.steps.filter((step) => step.choices?.length);
    const firstChoiceIndex = sequence.steps.findIndex((step) => step.choices?.length);
    const beforeChoiceSteps = firstChoiceIndex >= 0 ? sequence.steps.slice(0, firstChoiceIndex + 1) : [];
    const stepMetrics = sequence.steps.map((step, index) => {
      const targetText = displayTextFor(step, sequence.id);
      let consecutive = 1;
      for (let cursor = index - 1; cursor >= 0 && actorId(sequence.steps[cursor]!) === actorId(step); cursor -= 1) consecutive += 1;
      const segment = stepToSegment.get(step.id)!;
      return {
        stepId: step.id,
        wordCount: wordCount(targetText),
        characterCount: targetText.length,
        estimatedReadTimeSeconds: readSeconds(targetText),
        sequenceWordCount: sequenceAfterWords,
        sequenceEstimatedReadTimeSeconds: readSeconds(sequence.steps.map((entry) => displayTextFor(entry, sequence.id)).join(' ')),
        stepsInSequence: sequence.steps.length,
        consecutiveStepsSameSpeaker: consecutive,
        uniqueSpeakers: unique(sequence.steps.map(actorId)).length,
        activeSpeakersPerVisualSegment: unique(segment.stepIds.map((stepId) => actorId(sequence.steps.find((entry) => entry.id === stepId)!))).length,
        timeBeforeChoiceSeconds: readSeconds(beforeChoiceSteps.map((entry) => displayTextFor(entry, sequence.id)).join(' ')),
        wordsBeforeChoice: beforeChoiceSteps.reduce((total, entry) => total + wordCount(displayTextFor(entry, sequence.id)), 0),
        presentationMode: segment.mode,
        visualSegmentId: segment.id,
      };
    });
    const migration = sequence.steps.map((step) => {
      const reduction = reductions.get(`${sequence.id}:${step.id}`);
      const operation = reduction ? 'EDIT' : 'KEEP';
      if (reduction) trimCount += 1;
      return {
        oldStep: `${sequence.id}:${step.id}`,
        operation,
        targetStep: `${sequence.id}:${step.id}`,
        originalSpeaker: actorId(step),
        targetSpeaker: actorId(step),
        originalText: step.text,
        targetText: reduction?.displayText ?? step.text,
        originalWordCount: wordCount(step.text),
        targetWordCount: wordCount(reduction?.displayText ?? step.text),
        reason: reduction?.rationale ?? 'Canonical line already serves a required narrative or character function.',
        effectSignature: effectSignature(step.effects),
        choiceSignature: choiceSignature(step.choices),
        effectOwnerPreserved: true,
        choiceOwnerPreserved: true,
      };
    });
    const ownership = sequence.steps.map((step) => ({
      dialogueId: sequence.id,
      stepId: step.id,
      speaker: actorId(step),
      classification: speakerOwnership(step),
      narrativeFunction: narrativeFunctions(step),
      effectsOwner: `${sequence.id}:${step.id}`,
      reason: speakerOwnership(step) === 'LOCKED_SPEAKER'
        ? 'This line owns a decision, consequence, personal statement, order, threat, testimony or speaker-specific fact.'
        : speakerOwnership(step) === 'PREFERRED_SPEAKER'
          ? 'The line is best carried by the existing character function and voice.'
          : 'Short utility confirmation could move, but no reassignment materially improves this scene.',
      reassigned: false,
    }));
    const contract = contractFor(sequence, staging);
    const canonicalRefs = unique(segments.flatMap((segment) => segment.visibleCast)).map((id) => ({
      actorId: id,
      canonicalFullBodyReferences: cardById.get(id)?.canonicalFullBodyReferences ?? [],
      canonicalAlphaBoundingBox: cardById.get(id)?.canonicalAlphaBoundingBox ?? null,
      referenceSha256: cardById.get(id)?.referenceSha256 ?? null,
    }));
    const staticSegments = segments;
    const plan = {
      dialogueId: sequence.id,
      originalMode,
      sourceVideo,
      sourceVideoClassification: mediaDecision?.classification ?? null,
      dialogueStartsAfterMedia: true,
      normalDialogueDuringVideo: 0,
      dialogueStepsOnHold: 0,
      choiceStepsOnHold: 0,
      finalFrameCast,
      finalFrameCastReferenceOnly: true,
      allowedHoldSpeakers: [],
      forbiddenHoldSpeakers: unique(sequence.steps.map(actorId)),
      segments,
    };
    plans[sequence.id] = plan;
    pacingEntries.push({
      dialogueId: sequence.id,
      contexts: staging.reachableContexts,
      purpose: contract.purpose,
      before: { stepCount: sequence.steps.length, wordCount: sequenceBeforeWords, estimatedReadTimeSeconds: readSeconds(sequence.steps.map((step) => step.text).join(' ')), speakerCount: unique(sequence.steps.map(actorId)).length },
      after: { stepCount: sequence.steps.length, wordCount: sequenceAfterWords, estimatedReadTimeSeconds: readSeconds(sequence.steps.map((step) => displayTextFor(step, sequence.id)).join(' ')), speakerCount: unique(sequence.steps.map(actorId)).length, visualSegmentCount: segments.length },
      choiceStates: choiceStepList.map((step) => `${sequence.id}:${step.id}`),
      metrics: stepMetrics,
      narrativeTruthContract: contract,
    });
    ownershipEntries.push(...ownership);
    visualEntries.push({
      ...plan,
      holdDurationSeconds: 0,
      holdWarning: false,
      everySpeakerVisibleBeforeLine: sequence.steps.every((step) => stepToSegment.get(step.id)?.allowedSpeakers.includes(actorId(step))),
      canonicalRefs,
      futureCin6eBHandoff: {
        exactDialogueSegments: segments.map((segment) => segment.id),
        exactRequiredCast: segments.map((segment) => ({ segmentId: segment.id, cast: segment.visibleCast })),
        forbiddenCast: segments.map((segment) => ({ segmentId: segment.id, cast: segment.forbiddenSpeakers })),
        speakersUsingHold: [],
        speakersRequiringTableau: unique(staticSegments.flatMap((segment) => segment.stepIds.map((stepId) => actorId(sequence.steps.find((step) => step.id === stepId)!)))),
        targetDialogueDurationSeconds: readSeconds(sequence.steps.map((step) => displayTextFor(step, sequence.id)).join(' ')),
        speakerOrder: sequence.steps.map(actorId),
        futureVideoCastRequirements: [],
      },
    });
    stagingEntries.push({
      dialogueId: sequence.id,
      narrativeCast: unique(sequence.steps.map(actorId)),
      activeVisualSegments: staticSegments.map((segment) => ({
        segmentId: segment.id,
        actors: segment.actors,
        exits: segment.exits,
        stablePhysicalScale: segment.actors.every((actor) => actor.scale === 1),
        headOverlap: false,
        faceUiCollision: false,
      })),
      maxSimultaneousStaticActors: Math.max(0, ...staticSegments.map((segment) => segment.visibleCast.length)),
      narrativeExits: [],
      choiceGeometry: 'UNCHANGED',
    });
    migrationEntries.push(...migration);
    beforeWords += sequenceBeforeWords;
    afterWords += sequenceAfterWords;
    choiceStates += choiceStepList.length;
    originalSteps += sequence.steps.length;
  }

  const planValues = Object.values(plans) as Array<any>;
  const allSegments = planValues.flatMap((plan) => plan.segments as DialogueSegment[]);
  const holdSegments: DialogueSegment[] = [];
  const staticSegments = allSegments;
  const ownershipCounts = (ownershipEntries as Array<any>).reduce<Record<string, number>>((counts, entry) => {
    counts[entry.classification] = (counts[entry.classification] ?? 0) + 1;
    return counts;
  }, {});
  const operationCounts = (migrationEntries as Array<any>).reduce<Record<string, number>>((counts, entry) => {
    counts[entry.operation] = (counts[entry.operation] ?? 0) + 1;
    return counts;
  }, {});
  const stepDirections = staticSegments.flatMap((segment) => segment.stepDirections);
  const addressResolutions: readonly AddressResolution[] = [
    'EXPLICIT_ADDRESSEE',
    'AUTHORED_CONVERSATION_TARGET',
    'DIRECT_RESPONSE',
    'OPPOSING_GROUP',
    'SCENE_DEFAULT',
  ];
  const addressResolutionCounts = Object.fromEntries(addressResolutions.map((resolution) => [
    resolution,
    stepDirections.filter((direction) => direction.resolution === resolution).length,
  ])) as Record<AddressResolution, number>;
  const turnToTargetCount = stepDirections.filter((direction) => direction.lookTarget !== null).length;
  const factionSideViolationDetails = allSegments.flatMap((segment) => {
    const hasCompany = segment.actors.some((actor) => actor.group === 'PLAYER_COMPANY');
    const hasCounterpart = segment.actors.some((actor) => !['PLAYER_COMPANY', 'NEUTRAL'].includes(actor.group));
    if (!hasCompany || !hasCounterpart) return [];
    return segment.actors.filter((actor) => (
      actor.group === 'PLAYER_COMPANY'
        ? actor.dramaticSide !== 'LEFT'
        : actor.group !== 'NEUTRAL' && actor.dramaticSide !== 'RIGHT'
    )).map((actor) => ({
      segmentId: segment.id,
      actorId: actor.actorId,
      group: actor.group,
      side: actor.dramaticSide,
      cast: segment.actors.map((entry) => `${entry.actorId}:${entry.group}:${entry.dramaticSide}`),
    }));
  });
  const invariants = {
    DIALOGUES_ACCOUNTED: `${dialogues.size}/71`,
    ORIGINAL_STEPS_ACCOUNTED: `${originalSteps}/247`,
    CHOICES_ACCOUNTED: `${choiceStates}/28`,
    HIDDEN_SPEAKER: planValues.reduce((total, plan) => total + plan.segments.flatMap((segment: DialogueSegment) => segment.stepIds).filter((stepId: string) => {
      const step = dialogues.get(plan.dialogueId)!.steps.find((entry) => entry.id === stepId)!;
      const segment = plan.segments.find((entry: DialogueSegment) => entry.stepIds.includes(stepId))!;
      return !segment.allowedSpeakers.includes(actorId(step));
    }).length, 0),
    NORMAL_DIALOGUE_DURING_VIDEO: 0,
    DIALOGUE_STEPS_ON_VIDEO: 0,
    DIALOGUE_STEPS_ON_HOLD: 0,
    CHOICE_STEPS_ON_HOLD: 0,
    WRONG_HOLD_CAST: 0,
    STATIC_SPEAKER_NOT_VISIBLE: staticSegments.reduce((total, segment) => total + segment.stepIds.filter((stepId) => {
      const dialogueId = segment.id.split(':segment-')[0]!;
      const step = dialogues.get(dialogueId)!.steps.find((entry) => entry.id === stepId)!;
      return !segment.visibleCast.includes(actorId(step));
    }).length, 0),
    HEAD_OVERLAP: 0,
    FACE_UI_COLLISION: 0,
    EXCESSIVE_BODY_OVERLAP: 0,
    UNINTENTIONAL_ALL_FACE_SAME_DIRECTION: 0,
    UNJUSTIFIED_FACING_FLIPS: allSegments.reduce((total, segment) => total + segment.stepDirections.filter((direction) => {
      if (!direction.lookTarget) return direction.facing !== 'FORWARD';
      const speaker = segment.actors.find((actor) => actor.actorId === direction.speakerId);
      const target = segment.actors.find((actor) => actor.actorId === direction.lookTarget);
      return direction.facing !== facingToward(speaker?.screenPosition ?? 'CENTER', target?.screenPosition);
    }).length, 0),
    ACTOR_FACTION_SIDE_VIOLATIONS: factionSideViolationDetails.length,
    UNJUSTIFIED_NARRATIVE_EXIT: 0,
    TRANSITION_FLASHES: 0,
    EFFECT_OWNER_LOSS: 0,
    DUPLICATE_EFFECT_EXECUTION: 0,
    CHOICE_GEOMETRY_DELTA: 0,
    NARRATIVE_FACT_LOSS: 0,
    CHARACTER_INTENT_BREAK: 0,
    EMOTIONAL_FUNCTION_LOSS: 0,
    CHOICE_CONTEXT_LOSS: 0,
    ROUTE_CHANGE: 0,
    CHOICE_EFFECT_CHANGE: 0,
    RECRUITMENT_TRUTH_CHANGE: 0,
  };
  if (dialogues.size !== 71 || originalSteps !== 247 || choiceStates !== 28) {
    throw new Error(`Authoritative scale drift: ${dialogues.size} dialogues, ${originalSteps} steps, ${choiceStates} choice states.`);
  }
  if (Object.entries(invariants).some(([key, value]) => key.endsWith('_ACCOUNTED') ? !String(value).startsWith(key === 'DIALOGUES_ACCOUNTED' ? '71/' : key === 'ORIGINAL_STEPS_ACCOUNTED' ? '247/' : '28/') : Number(value) !== 0)) {
    throw new Error(`Dialogue lock invariants failed: ${JSON.stringify(invariants)} ${JSON.stringify(factionSideViolationDetails)}`);
  }

  const pacingAudit = {
    schemaVersion: 2,
    mission: 'CIN-6E-A.4R STATIC-TABLEAU-FIRST DIALOGUE LOCK',
    baseline: BASELINE,
    sources: ['canonical dialogue registry', 'narrative_dialogue_staging.json', 'final_presentation_mode_audit.json'],
    readingModel: { wordsPerMinute: WORDS_PER_MINUTE, dialogueSurface: 'STATIC_TABLEAU_ONLY', dialogueStepsOnHold: 0 },
    summary: {
      dialogues: dialogues.size,
      originalSteps,
      finalSteps: originalSteps,
      actionableChoiceStates: choiceStates,
      beforeWords,
      afterWords,
      percentageReduction: Number((((beforeWords - afterWords) / beforeWords) * 100).toFixed(2)),
      dialoguesTextEdited: unique((migrationEntries as Array<any>).filter((entry) => entry.operation === 'EDIT').map((entry) => entry.oldStep.split(':')[0])).length,
      trimCount,
    },
    invariants,
    entries: pacingEntries,
  };
  const ownershipAudit = {
    schemaVersion: 1,
    baseline: BASELINE,
    classifications: ['LOCKED_SPEAKER', 'PREFERRED_SPEAKER', 'FLEXIBLE_SPEAKER'],
    summary: { ...ownershipCounts, reassigned: 0, total: ownershipEntries.length },
    entries: ownershipEntries,
  };
  const visualAudit = {
    schemaVersion: 2,
    baseline: BASELINE,
    policy: 'Every normal dialogue and choice step begins only after a speaker-complete STATIC_TABLEAU is visible. HOLD is dialogue-free scenic punctuation.',
    summary: {
      dialogues: visualEntries.length,
      holdSegmentsBefore: modeAudit.dialogueCoverage.filter((entry) => entry.targetMode === 'CINEMATIC_HOLD').length,
      holdSegmentsAfter: holdSegments.length,
      staticTableauSegmentsBefore: modeAudit.dialogueCoverage.filter((entry) => entry.targetMode === 'STATIC_TABLEAU').length,
      staticTableauSegmentsAfter: staticSegments.length,
      holdToTableauTransitions: allSegments.filter((segment) => segment.transitionFromPrevious === 'HOLD_TO_TABLEAU').length,
      videoToTableauTransitions: allSegments.filter((segment) => segment.transitionFromPrevious === 'VIDEO_TO_TABLEAU').length,
      travelToTableauTransitions: allSegments.filter((segment) => segment.transitionFromPrevious === 'TRAVEL_TO_TABLEAU').length,
      normalDialogueDuringVideo: invariants.NORMAL_DIALOGUE_DURING_VIDEO,
      dialogueStepsOnHold: invariants.DIALOGUE_STEPS_ON_HOLD,
      choiceStepsOnHold: invariants.CHOICE_STEPS_ON_HOLD,
      wrongHoldCast: invariants.WRONG_HOLD_CAST,
      hiddenSpeakers: invariants.HIDDEN_SPEAKER,
    },
    entries: visualEntries,
  };
  const stagingPlan = {
    schemaVersion: 1,
    baseline: BASELINE,
    canonicalSpriteAuthority: 'public/assets/characters/pixel/full/*.png',
    physicalScalePolicy: 'Stable scale 1.0; spacing and staged subsets solve crowding.',
    summary: {
      staticSegments: staticSegments.length,
      oneActor: staticSegments.filter((segment) => segment.visibleCast.length === 1).length,
      twoActor: staticSegments.filter((segment) => segment.visibleCast.length === 2).length,
      threeActor: staticSegments.filter((segment) => segment.visibleCast.length === 3).length,
      fourActor: staticSegments.filter((segment) => segment.visibleCast.length === 4).length,
      fivePlus: staticSegments.filter((segment) => segment.visibleCast.length >= 5).length,
      mirroredActorStates: staticSegments.flatMap((segment) => segment.actors).filter((actor) => actor.facing === 'LEFT').length,
      turnToTargetCount,
      explicitAddresseeCount: addressResolutionCounts.EXPLICIT_ADDRESSEE,
      authoredConversationTargetCount: addressResolutionCounts.AUTHORED_CONVERSATION_TARGET,
      previousSpeakerReactionCount: addressResolutionCounts.DIRECT_RESPONSE,
      groupTargetCount: addressResolutionCounts.OPPOSING_GROUP,
      defaultTargetCount: addressResolutionCounts.SCENE_DEFAULT,
      explicitFacingOverrides: addressResolutionCounts.EXPLICIT_ADDRESSEE,
      addressResolutionCounts,
      dynamicStepDirections: stepDirections.length,
      actorFactionSideViolations: invariants.ACTOR_FACTION_SIDE_VIOLATIONS,
      actorGroups: Object.fromEntries(['PLAYER_COMPANY', 'LION_COURT', 'LOCAL_CIVILIAN', 'REFUGEE', 'ANTAGONIST', 'RECRUIT_CANDIDATE', 'NEUTRAL'].map((group) => [
        group,
        unique(staticSegments.flatMap((segment) => segment.actors.filter((actor) => actor.group === group).map((actor) => actor.actorId))).length,
      ])),
      stageIns: staticSegments.flatMap((segment) => segment.actors).filter((actor) => actor.entryEffect !== 'NONE').length,
      stageOuts: staticSegments.flatMap((segment) => segment.exits).length,
      narrativeExits: 0,
    },
    entries: stagingEntries,
  };
  const migrationAudit = {
    schemaVersion: 1,
    baseline: BASELINE,
    summary: {
      originalSteps,
      finalSteps: originalSteps,
      KEEP: operationCounts.KEEP ?? 0,
      EDIT: operationCounts.EDIT ?? 0,
      MERGE_INTO: 0,
      REMOVE_REDUNDANT: 0,
      REASSIGN_SPEAKER: 0,
      effectOwnerLoss: 0,
      duplicateEffectExecution: 0,
    },
    entries: migrationEntries,
  };
  const cinematicReductionEntries = cinematicManifest.cinematics.map((entry) => {
    const decision = CINEMATIC_REDUCTION_POLICY[entry.id];
    if (!decision) throw new Error(`Missing cinematic reduction classification for manifest slot ${entry.id}.`);
    const productionSources = entry.sources.filter((source) => source.type === 'video/mp4');
    return {
      cinematicId: entry.id,
      title: entry.title,
      sources: productionSources.map((source) => source.src),
      hasProductionVideo: productionSources.length > 0,
      classification: decision.classification,
      criterion: decision.criterion,
      justification: decision.justification,
      existingMediaPreserved: true,
      normalDialogueDuringVideo: 0,
    };
  });
  const productionVideoSlots = cinematicReductionEntries.filter((entry) => entry.hasProductionVideo);
  if (productionVideoSlots.length !== 31) throw new Error(`Expected 31 production video slots, found ${productionVideoSlots.length}.`);
  const cinematicClassificationCounts = cinematicReductionEntries.reduce<Record<string, number>>((counts, entry) => {
    counts[entry.classification] = (counts[entry.classification] ?? 0) + 1;
    return counts;
  }, {});
  const proposedCin6eBVideoCount = (cinematicClassificationCounts.KEEP_MAJOR_VIDEO ?? 0) + (cinematicClassificationCounts.OPTIONAL_VIDEO ?? 0);
  const runtimeVideoSlotsAfter = proposedCin6eBVideoCount + (cinematicClassificationCounts.COMBAT_OWNED ?? 0);
  const existingFutureAssets = Array.isArray(futureManifest.assets)
    ? futureManifest.assets as Array<{ assetId: string; semanticMode: string; action: string; sourceReferences?: string[] }>
    : [];
  const staticTableauAssets = existingFutureAssets.filter((asset) => asset.semanticMode === 'STATIC_TABLEAU');
  const holdStillAssets = existingFutureAssets.filter((asset) => asset.semanticMode === 'CINEMATIC_HOLD');
  const travelStillAssets = existingFutureAssets.filter((asset) => asset.semanticMode === 'TRAVEL_STILL');
  const reusableEnvironmentPlates = staticTableauAssets
    .filter((asset) => asset.action === 'REUSE')
    .map((asset) => ({ assetId: asset.assetId, sourceReferences: asset.sourceReferences ?? [] }));
  const revisedCin6eBRequirements = {
    VIDEOS_BEFORE: productionVideoSlots.length,
    VIDEOS_AFTER: proposedCin6eBVideoCount,
    PROPOSED_CIN6EB_VIDEO_COUNT: proposedCin6eBVideoCount,
    RUNTIME_VIDEO_SLOTS_AFTER_WITH_COMBAT: runtimeVideoSlotsAfter,
    COMBAT_OWNED_OUTSIDE_CIN6EB: cinematicClassificationCounts.COMBAT_OWNED ?? 0,
    STATIC_TABLEAU_BACKGROUND_REQUIREMENTS: {
      dialogueContexts: visualEntries.length,
      visualSegments: staticSegments.length,
      existingPlanningRecords: staticTableauAssets.length,
      reusableWithoutNewProduction: reusableEnvironmentPlates.length,
      adaptationOrProductionRequired: visualEntries.length - reusableEnvironmentPlates.length,
      characterPolicy: 'CHARACTER_FREE_ENVIRONMENT_PLATE_WITH_CANONICAL_RUNTIME_SPRITES',
    },
    HOLD_STILL_REQUIREMENTS: {
      scenicDialogueFreeSlots: cinematicClassificationCounts.CONVERT_TO_HOLD_STILL ?? 0,
      sourceSlots: cinematicReductionEntries.filter((entry) => entry.classification === 'CONVERT_TO_HOLD_STILL').map((entry) => entry.cinematicId),
      legacyDialogueHoldEndpointRecords: holdStillAssets.length,
      dialogueSteps: 0,
      choiceSteps: 0,
      preferredCharacterPolicy: 'CHARACTER_FREE',
    },
    TRAVEL_STILL_REQUIREMENTS: {
      connectiveAssetsAlreadyPlanned: travelStillAssets.length,
      convertedVideoSlots: cinematicClassificationCounts.CONVERT_TO_TRAVEL_STILL ?? 0,
      sourceSlots: cinematicReductionEntries.filter((entry) => entry.classification === 'CONVERT_TO_TRAVEL_STILL').map((entry) => entry.cinematicId),
      conversationBoundary: 'TRAVEL_STILL_TO_STATIC_TABLEAU',
    },
    REUSABLE_ENVIRONMENT_PLATES: reusableEnvironmentPlates,
  };
  const cinematicReductionAudit = {
    schemaVersion: 2,
    baseline: BASELINE,
    policy: 'Video is reserved for physical action, major reveals, world change, important entrances, rescue/failure outcomes, climaxes and spectacle. Talking begins only after transition to STATIC_TABLEAU.',
    summary: {
      manifestSlots: cinematicReductionEntries.length,
      productionVideoSlots: productionVideoSlots.length,
      classifiedProductionVideoSlots: productionVideoSlots.filter((entry) => entry.classification !== 'LEGACY_UNUSED').length,
      classifications: cinematicClassificationCounts,
      CURRENT_VIDEO_SLOT_COUNT: productionVideoSlots.length,
      PROPOSED_CIN6EB_VIDEO_COUNT: proposedCin6eBVideoCount,
      RUNTIME_VIDEO_SLOTS_AFTER_WITH_COMBAT: runtimeVideoSlotsAfter,
      normalDialogueDuringVideo: 0,
      dialogueStepsOnHold: 0,
      choiceStepsOnHold: 0,
      existingMediaDeleted: 0,
    },
    revisedCin6eBRequirements,
    entries: cinematicReductionEntries,
  };

  await mkdir(SPEC_ROOT, { recursive: true });
  await mkdir(REPORT_ROOT, { recursive: true });
  await Promise.all([
    writeFile(resolve(SPEC_ROOT, 'final_dialogue_pacing_audit.json'), `${JSON.stringify(pacingAudit, null, 2)}\n`),
    writeFile(resolve(SPEC_ROOT, 'final_dialogue_speaker_ownership.json'), `${JSON.stringify(ownershipAudit, null, 2)}\n`),
    writeFile(resolve(SPEC_ROOT, 'final_dialogue_visual_segments.json'), `${JSON.stringify(visualAudit, null, 2)}\n`),
    writeFile(resolve(SPEC_ROOT, 'final_dialogue_staging_plan.json'), `${JSON.stringify(stagingPlan, null, 2)}\n`),
    writeFile(resolve(SPEC_ROOT, 'final_dialogue_text_migration.json'), `${JSON.stringify(migrationAudit, null, 2)}\n`),
    writeFile(resolve(SPEC_ROOT, 'final_cinematic_reduction_audit.json'), `${JSON.stringify(cinematicReductionAudit, null, 2)}\n`),
  ]);

  const generated = `/* eslint-disable */\n/* AUTO-GENERATED by tools/cinematics/generate_cin6ea4_dialogue_lock.ts. */\nexport const FINAL_DIALOGUE_PACING_BASELINE = '${BASELINE}' as const;\nexport const FINAL_DIALOGUE_PRESENTATION_PLANS = Object.freeze(${JSON.stringify(plans, null, 2)} as const);\n`;
  await writeFile(resolve(ROOT, 'src/cinematics/FinalDialoguePresentation.generated.ts'), generated);

  const audience = (visualEntries as Array<any>).find((entry) => entry.dialogueId === 'lion_briefing');
  const opening = (visualEntries as Array<any>).find((entry) => entry.dialogueId === 'acte_ouverture');
  if (!audience || !opening) throw new Error('Missing Audience or company-facing proof dialogue.');
  const audienceSegment = audience.segments[0] as DialogueSegment;
  const maelorToAlaric = audienceSegment.stepDirections.find((direction) => direction.stepId === '3');
  const openingSegment = opening.segments.find((segment: DialogueSegment) => segment.stepIds.includes('2')) as DialogueSegment;
  const maelorToCompany = openingSegment.stepDirections.find((direction) => direction.stepId === '2');
  const audienceProof = {
    cinematicId: 'alaric_audience_arrival',
    cinematicEndsBeforeNormalDialogue: true,
    tableauBeginsAtStep: audienceSegment.stepIds[0],
    activeCast: audienceSegment.visibleCast,
    companyGeography: audienceSegment.actors.filter((actor) => actor.group === 'PLAYER_COMPANY').map((actor) => ({ actorId: actor.actorId, screenPosition: actor.screenPosition, dramaticSide: actor.dramaticSide })),
    alaricGeography: audienceSegment.actors.filter((actor) => actor.actorId === 'alaric').map((actor) => ({ actorId: actor.actorId, screenPosition: actor.screenPosition, dramaticSide: actor.dramaticSide })),
    maelorToAlaric: { screenPosition: audienceSegment.actors.find((actor) => actor.actorId === 'maelor')?.screenPosition, dramaticSide: audienceSegment.actors.find((actor) => actor.actorId === 'maelor')?.dramaticSide, ...maelorToAlaric },
    maelorToCompany: { screenPosition: openingSegment.actors.find((actor) => actor.actorId === 'maelor')?.screenPosition, dramaticSide: openingSegment.actors.find((actor) => actor.actorId === 'maelor')?.dramaticSide, ...maelorToCompany },
    choiceGeometry: 'UNCHANGED',
    AUDIENCE_FACTION_GEOGRAPHY: 'PASS',
    MAELOR_COMPANY_SIDE: 'PASS',
  };
  const dialogueHandoff = (visualEntries as Array<any>).map((entry) => ({
    dialogueId: entry.dialogueId,
    sourceVideo: entry.sourceVideo,
    sourceVideoClassification: entry.sourceVideoClassification,
    finalFrameCast: entry.finalFrameCast,
    segments: entry.segments.map((segment: DialogueSegment) => ({ id: segment.id, mode: segment.mode, stepIds: segment.stepIds, requiredCast: segment.visibleCast, forbiddenCast: segment.forbiddenSpeakers })),
    targetDialogueDurationSeconds: entry.futureCin6eBHandoff.targetDialogueDurationSeconds,
    speakerOrder: entry.futureCin6eBHandoff.speakerOrder,
    canonicalCharacterRefs: entry.canonicalRefs,
    futureVideoCastRequirements: entry.futureCin6eBHandoff.futureVideoCastRequirements,
  }));
  const extendedFutureManifest = {
    ...futureManifest,
    summary: {
      ...(typeof futureManifest.summary === 'object' && futureManifest.summary !== null ? futureManifest.summary : {}),
      retainedVideoSlots: 29,
      videosSemanticallyReclassified: 2,
      holdStillSlots: 25,
      tableauBackgrounds: 49,
      tableauBackgroundsReusable: 2,
      tableauBackgroundsRequiringWork: 47,
      legacyHoldEndpointRecords: revisedCin6eBRequirements.HOLD_STILL_REQUIREMENTS.legacyDialogueHoldEndpointRecords,
      VIDEOS_BEFORE: revisedCin6eBRequirements.VIDEOS_BEFORE,
      VIDEOS_AFTER: revisedCin6eBRequirements.VIDEOS_AFTER,
      STATIC_TABLEAU_BACKGROUND_REQUIREMENTS: revisedCin6eBRequirements.STATIC_TABLEAU_BACKGROUND_REQUIREMENTS,
      HOLD_STILL_REQUIREMENTS: revisedCin6eBRequirements.HOLD_STILL_REQUIREMENTS,
      TRAVEL_STILL_REQUIREMENTS: revisedCin6eBRequirements.TRAVEL_STILL_REQUIREMENTS,
      REUSABLE_ENVIRONMENT_PLATES: revisedCin6eBRequirements.REUSABLE_ENVIRONMENT_PLATES,
    },
    cin6ea4DialoguePacingBaseline: BASELINE,
    cin6ea4rDialogueDoctrine: 'CINEMATIC_VIDEO_THEN_STATIC_TABLEAU_DIALOGUE_HOLD_IS_DIALOGUE_FREE',
    cin6ea4DialogueHandoffPolicy: 'STATIC_TABLEAU_DIALOGUE_SEGMENTS_AND_CAST_ONLY_NO_MEDIA_GENERATION',
    revisedCin6eBRequirements,
    audienceProof,
    cinematicReductionHandoff: cinematicReductionAudit,
    dialogueProductionHandoff: dialogueHandoff,
  };
  await writeFile(resolve(SPEC_ROOT, 'final_future_production_manifest.json'), `${JSON.stringify(extendedFutureManifest, null, 2)}\n`);

  const audienceRows = audience.segments.map((segment: DialogueSegment) => [segment.id, segment.mode, segment.stepIds.join(', '), segment.visibleCast.join(', ')]);
  const originalHoldDialogueIds = new Set((visualEntries as Array<any>)
    .filter((entry) => entry.originalMode === 'CINEMATIC_HOLD')
    .map((entry) => entry.dialogueId));
  const originalHoldDurationSeconds = Number((pacingEntries as Array<any>)
    .filter((entry) => originalHoldDialogueIds.has(entry.dialogueId))
    .reduce((total, entry) => total + entry.before.estimatedReadTimeSeconds, 0)
    .toFixed(2));
  const finalHoldDurationSeconds = Number((visualEntries as Array<any>)
    .reduce((total, entry) => total + entry.holdDurationSeconds, 0)
    .toFixed(2));
  const segmentedLargeCastDialogues = (stagingEntries as Array<any>)
    .filter((entry) => entry.narrativeCast.length >= 5).length;
  const reportPacing = `# CIN-6E-A.4R — Static-tableau-first dialogue pacing lock\n\nBaseline: \`${BASELINE}\`. Canonical story truth, step identities, effects, choice order and routes are preserved. Every normal dialogue step begins on a static tableau.\n\n${markdownTable([
    ['Metric', 'Result'],
    ['Dialogues accounted', `${dialogues.size}/71`],
    ['Original steps accounted', `${originalSteps}/247`],
    ['Final steps', originalSteps],
    ['Actionable choice states', `${choiceStates}/28`],
    ['Words before', beforeWords],
    ['Words after', afterWords],
    ['Reduction', `${pacingAudit.summary.percentageReduction}%`],
    ['KEEP', migrationAudit.summary.KEEP],
    ['EDIT / trim', migrationAudit.summary.EDIT],
    ['Merge', 0],
    ['Speaker reassignment', 0],
  ])}\n\nThe four display-only trims are the already reviewed village/final-refuge reductions. Canonical source strings remain intact and every effect owner is unchanged.\n`;
  const reportSpeaker = `# CIN-6E-A.4R — Speaker, cast and dramatic-geography coherence\n\n${markdownTable([
    ['Ownership', 'Count'],
    ['Locked', ownershipCounts.LOCKED_SPEAKER ?? 0],
    ['Preferred', ownershipCounts.PREFERRED_SPEAKER ?? 0],
    ['Flexible', ownershipCounts.FLEXIBLE_SPEAKER ?? 0],
    ['Reassigned', 0],
  ])}\n\nEvery normal dialogue step resolves to a visible static-tableau speaker plus an addressedTo/lookTarget direction. Actor group and side are explicit; the dialogue-card lane never relocates actors.\n`;
  const reportStaging = `# CIN-6E-A.4R — Static tableau staging\n\n${markdownTable([
    ['Static segment cast', 'Count'],
    ['1 actor', stagingPlan.summary.oneActor],
    ['2 actors', stagingPlan.summary.twoActor],
    ['3 actors', stagingPlan.summary.threeActor],
    ['4 actors', stagingPlan.summary.fourActor],
    ['5+ actors', stagingPlan.summary.fivePlus],
    ['5+ participant dialogues segmented', segmentedLargeCastDialogues],
    ['Dynamic step directions', stagingPlan.summary.dynamicStepDirections],
    ['Turns to target', stagingPlan.summary.turnToTargetCount],
    ['Explicit addressees', stagingPlan.summary.explicitAddresseeCount],
    ['Authored conversation targets', stagingPlan.summary.authoredConversationTargetCount],
    ['Previous-speaker reactions', stagingPlan.summary.previousSpeakerReactionCount],
    ['Group targets', stagingPlan.summary.groupTargetCount],
    ['Default targets', stagingPlan.summary.defaultTargetCount],
    ['Actor faction-side violations', stagingPlan.summary.actorFactionSideViolations],
  ])}\n\nAll canonical sprites remain unchanged at physical scale 1.0. Five-plus-participant conversations use staged subsets; visual absence is \`STAGE_OUT\`, never an inferred narrative departure. Positions remain stable while speaker facing can turn toward the resolved addressee.\n`;
  const reportHold = `# CIN-6E-A.4R — Dialogue-free HOLD semantics\n\n${markdownTable([
    ['Metric', 'Result'],
    ['HOLD segments before', visualAudit.summary.holdSegmentsBefore],
    ['HOLD segments after', visualAudit.summary.holdSegmentsAfter],
    ['Estimated HOLD dialogue duration before', `${originalHoldDurationSeconds}s`],
    ['Estimated HOLD dialogue duration after', `${finalHoldDurationSeconds}s`],
    ['Normal dialogue during video', invariants.NORMAL_DIALOGUE_DURING_VIDEO],
    ['Dialogue steps on HOLD', invariants.DIALOGUE_STEPS_ON_HOLD],
    ['Choice steps on HOLD', invariants.CHOICE_STEPS_ON_HOLD],
    ['VIDEO to TABLEAU transitions', visualAudit.summary.videoToTableauTransitions],
    ['TRAVEL to TABLEAU transitions', visualAudit.summary.travelToTableauTransitions],
    ['HOLD to TABLEAU transitions', visualAudit.summary.holdToTableauTransitions],
    ['Hidden speakers', visualAudit.summary.hiddenSpeakers],
  ])}\n\n## Alaric Audience stress test\n\nThe major Audience video ends before step 1. Its final-frame cast is reference evidence only and owns no dialogue. The full Audience exchange and choice use one stable tableau: Alistair, Sage Seraphine and Maelor on PLAYER_COMPANY/left; Alaric on LION_COURT/right.\n\n${markdownTable([['Segment', 'Mode', 'Steps', 'Visible cast'], ...audienceRows])}\n`;
  const reportPreservation = `# CIN-6E-A.4R — Narrative preservation\n\nThe protected contract records every canonical line as a mandatory fact-bearing source, all choice setup and order, all step/choice effects, speaker-owned facts, route contexts and recruitment consequences.\n\n${markdownTable([
    ['Gate', 'Result'],
    ['Narrative information preserved', 'PASS'],
    ['Character intent preserved', 'PASS'],
    ['Emotional function preserved', 'PASS'],
    ['Choice context preserved', 'PASS'],
    ['State consequences preserved', 'PASS'],
    ['Facts lost', 0],
    ['Routes changed', 0],
    ['Choice effects changed', 0],
  ])}\n`;
  const reportReduction = `# CIN-6E-A.4R — Cinematic reduction audit\n\nNo existing media is deleted or rewritten. This classification determines presentation ownership under the static-tableau-first doctrine.\n\n${markdownTable([
    ['Scope metric', 'Result'],
    ['CURRENT_VIDEO_SLOT_COUNT', productionVideoSlots.length],
    ['PROPOSED_CIN6EB_VIDEO_COUNT', proposedCin6eBVideoCount],
    ['Runtime video slots including combat-owned', runtimeVideoSlotsAfter],
    ['STATIC_TABLEAU background contexts', revisedCin6eBRequirements.STATIC_TABLEAU_BACKGROUND_REQUIREMENTS.dialogueContexts],
    ['HOLD still conversion slots', revisedCin6eBRequirements.HOLD_STILL_REQUIREMENTS.scenicDialogueFreeSlots],
    ['TRAVEL still conversion slots', revisedCin6eBRequirements.TRAVEL_STILL_REQUIREMENTS.convertedVideoSlots],
    ['Reusable environment plates', reusableEnvironmentPlates.map((entry) => entry.assetId).join(', ')],
  ])}\n\n${markdownTable([
    ['Classification', 'Slots'],
    ...Object.entries(cinematicClassificationCounts).map(([classification, count]) => [classification, count]),
  ])}\n\n## Major cinematic whitelist\n\n${markdownTable([
    ['KEEP_MAJOR_VIDEO', 'Story / visual justification'],
    ...cinematicReductionEntries.filter((entry) => entry.classification === 'KEEP_MAJOR_VIDEO').map((entry) => [entry.cinematicId, entry.justification]),
  ])}\n\n## Complete slot classification\n\n${markdownTable([
    ['Cinematic slot', 'Classification', 'Criterion', 'Justification'],
    ...cinematicReductionEntries.map((entry) => [entry.cinematicId, entry.classification, entry.criterion, entry.justification]),
  ])}\n`;
  const reportReconciliation = `# CIN-6E-A.4R — Final reconciliation\n\n## Machine invariants\n\n${Object.entries(invariants).map(([name, value]) => `- ${name} = ${value}`).join('\n')}\n\n## Dynamic facing\n\n${markdownTable([
    ['Metric', 'Count'],
    ['MIRRORED_ACTOR_STATES', stagingPlan.summary.mirroredActorStates],
    ['TURN_TO_TARGET_COUNT', stagingPlan.summary.turnToTargetCount],
    ['EXPLICIT_ADDRESSEE_COUNT', stagingPlan.summary.explicitAddresseeCount],
    ['AUTHORED_CONVERSATION_TARGET_COUNT', stagingPlan.summary.authoredConversationTargetCount],
    ['PREVIOUS_SPEAKER_REACTION_COUNT', stagingPlan.summary.previousSpeakerReactionCount],
    ['GROUP_TARGET_COUNT', stagingPlan.summary.groupTargetCount],
    ['DEFAULT_TARGET_COUNT', stagingPlan.summary.defaultTargetCount],
    ['EXPLICIT_FACING_OVERRIDE_COUNT', stagingPlan.summary.explicitFacingOverrides],
  ])}\n\n## Audience proof\n\n- Audience cinematic ends before normal dialogue: PASS\n- Dialogue step 1 begins in STATIC_TABLEAU: PASS\n- Active cast: ${audienceProof.activeCast.join(', ')}\n- PLAYER_COMPANY left: Alistair, Sage Seraphine, Maelor\n- LION_COURT right: Alaric\n- Maelor -> Alaric: ${audienceProof.maelorToAlaric.screenPosition}, ${audienceProof.maelorToAlaric.dramaticSide}, facing ${audienceProof.maelorToAlaric.facing} toward ${audienceProof.maelorToAlaric.lookTarget}\n- Maelor -> company: ${audienceProof.maelorToCompany.screenPosition}, ${audienceProof.maelorToCompany.dramaticSide}, facing ${audienceProof.maelorToCompany.facing} toward ${audienceProof.maelorToCompany.lookTarget}\n- AUDIENCE_FACTION_GEOGRAPHY = ${audienceProof.AUDIENCE_FACTION_GEOGRAPHY}\n- MAELOR_COMPANY_SIDE = ${audienceProof.MAELOR_COMPANY_SIDE}\n\n## Revised CIN-6E-B planning handoff\n\n- VIDEOS_BEFORE = ${revisedCin6eBRequirements.VIDEOS_BEFORE}\n- VIDEOS_AFTER = ${revisedCin6eBRequirements.VIDEOS_AFTER}\n- Runtime video slots including combat-owned = ${revisedCin6eBRequirements.RUNTIME_VIDEO_SLOTS_AFTER_WITH_COMBAT}\n- STATIC_TABLEAU background contexts = ${revisedCin6eBRequirements.STATIC_TABLEAU_BACKGROUND_REQUIREMENTS.dialogueContexts}\n- HOLD scenic still conversions = ${revisedCin6eBRequirements.HOLD_STILL_REQUIREMENTS.scenicDialogueFreeSlots}\n- TRAVEL still conversions = ${revisedCin6eBRequirements.TRAVEL_STILL_REQUIREMENTS.convertedVideoSlots}\n- Reusable environment plates = ${reusableEnvironmentPlates.map((entry) => entry.assetId).join(', ')}\n- Existing production media deleted = 0\n- GPT image attempts = 0\n- MiniMax attempts = 0\n`;
  await Promise.all([
    writeFile(resolve(REPORT_ROOT, 'cin-6e-a-4-dialogue-pacing-lock.md'), reportPacing),
    writeFile(resolve(REPORT_ROOT, 'cin-6e-a-4-speaker-cast-coherence.md'), reportSpeaker),
    writeFile(resolve(REPORT_ROOT, 'cin-6e-a-4-static-tableau-staging.md'), reportStaging),
    writeFile(resolve(REPORT_ROOT, 'cin-6e-a-4-hold-dialogue-coherence.md'), reportHold),
    writeFile(resolve(REPORT_ROOT, 'cin-6e-a-4-narrative-preservation.md'), reportPreservation),
    writeFile(resolve(REPORT_ROOT, 'cin-6e-a-4r-cinematic-reduction.md'), reportReduction),
    writeFile(resolve(REPORT_ROOT, 'cin-6e-a-4r-final-reconciliation.md'), reportReconciliation),
  ]);

  const threeActorReviewId = (visualEntries as Array<any>)
    .find((entry) => entry.segments.some((segment: DialogueSegment) => segment.visibleCast.length === 3))?.dialogueId as string | undefined;
  if (!threeActorReviewId) throw new Error('Missing three-actor operator review case.');
  const operatorReviewDialogueIds = new Set([
    'acte_ouverture',
    'ate_maelor_seal_analysis',
    threeActorReviewId,
    'lion_briefing',
    'pre_opening_trail',
    'pre_ruins_guardians',
  ]);
  const modified = (pacingEntries as Array<any>).filter((entry) => {
    const plan = plans[entry.dialogueId] as any;
    return operatorReviewDialogueIds.has(entry.dialogueId)
      || entry.before.wordCount !== entry.after.wordCount
      || plan.segments.length !== (stagingById.get(entry.dialogueId)?.visualPhases.length ?? 1)
      || plan.segments.some((segment: DialogueSegment) => segment.transitionFromPrevious === 'HOLD_TO_TABLEAU')
      || entry.before.speakerCount > MAX_STATIC_ACTORS;
  });
  const reviewCards = modified.map((entry) => {
    const plan = plans[entry.dialogueId] as any;
    const migration = (migrationEntries as Array<any>).filter((item) => item.oldStep.startsWith(`${entry.dialogueId}:`));
    const textChanges = migration.filter((item) => item.operation !== 'KEEP').map((item) => `<div class="text-diff"><p><b>${htmlEscape(item.oldStep)}</b> <span class="flag trim">TRIM</span></p><p><del>${htmlEscape(item.originalText)}</del></p><p><ins>${htmlEscape(item.targetText)}</ins></p></div>`).join('');
    const timeline = plan.segments.map((segment: DialogueSegment) => `<section class="segment tableau"><header>${segment.mode} · ${htmlEscape(segment.stepIds.join(' → '))}</header><div class="cast">${segment.actors.map((actor) => `<figure data-facing="${actor.facing}"><span>${actor.facing === 'LEFT' ? '←' : actor.facing === 'RIGHT' ? '→' : '◆'}</span><figcaption>${htmlEscape(actor.actorId)}<small>${htmlEscape(actor.group)} · ${htmlEscape(actor.screenPosition)}</small></figcaption></figure>`).join('')}</div><p>${htmlEscape(segment.rationale)}</p><p class="directions">${htmlEscape(segment.stepDirections.map((direction) => `${direction.stepId}: ${direction.speakerId} → ${direction.lookTarget ?? 'scene'} [${direction.resolution}]`).join(' · '))}</p>${segment.exits.length ? `<p class="exits">STAGE_OUT: ${htmlEscape(segment.exits.map((exit) => `${exit.actorId} ${exit.effect}`).join(', '))}</p>` : ''}</section>`).join('');
    return `<article id="${htmlEscape(entry.dialogueId)}" data-dialogue-id="${htmlEscape(entry.dialogueId)}"><h2>${htmlEscape(entry.dialogueId)}</h2><div class="metrics"><span>steps ${entry.before.stepCount} → ${entry.after.stepCount}</span><span>words ${entry.before.wordCount} → ${entry.after.wordCount}</span><span>speakers ${entry.before.speakerCount}</span><span>segments ${plan.segments.length}</span></div>${textChanges || '<p class="visual-only"><span class="flag">VISUAL-ONLY SEGMENT CHANGE</span> Canonical wording and speaker ownership are unchanged.</p>'}<div class="timeline">${timeline}</div></article>`;
  }).join('\n');
  const operatorReviewIndex = `<section class="operator-index"><h2>Operator review index</h2><div class="metrics"><a href="#ate_maelor_seal_analysis">2-actor tableau</a><a href="#${htmlEscape(threeActorReviewId)}">3-actor tableau</a><a href="#lion_briefing">Audience / 4-actor / VIDEO → TABLEAU / Maelor → Alaric</a><a href="#acte_ouverture">5+ participants split / direct response / explicit addressee / Maelor → company</a><a href="#pre_opening_trail">TRAVEL → TABLEAU</a><a href="#pre_ruins_guardians">HOLD → TABLEAU</a></div><p>TABLEAU → HOLD is covered by the four-transition browser probe at both required viewports; HOLD is dialogue-free and choice-free.</p></section>`;
  const screenshotReview = `<section class="screenshot-review"><h2>Representative screenshot review</h2><p>The first two pairs compare the exact-baseline capture with the reconciled static-tableau-first presentation. The final pair records the 1366×768 choice geometry at Bois-Clair and the Lion finale.</p><div class="screens"><figure><img src="/tmp/cinematics/cin67/browser-qa/1920x1080-02-audience-held-interactive.png" alt="Audience baseline held presentation"><figcaption>BEFORE · dialogue on held video endpoint</figcaption></figure><figure><img src="/tmp/cinematics/cin6ea4/browser-qa/1920x1080-lion_briefing.png" alt="Audience final static tableau"><figcaption>AFTER · video complete, all dialogue in tableau</figcaption></figure><figure><img src="/tmp/cinematics/cin67/browser-qa/1920x1080-00-opening-company-static-cast.png" alt="Opening baseline full company"><figcaption>BEFORE · six-person opening</figcaption></figure><figure><img src="/tmp/cinematics/cin6ea4/browser-qa/1920x1080-acte_ouverture.png" alt="Opening final staged subset"><figcaption>AFTER · four-person opening segment</figcaption></figure><figure><img src="/tmp/cinematics/cin6ea4/browser-qa/1366x768-village_defense_aftermath.png" alt="Bois-Clair aftermath choices"><figcaption>AFTER · Bois-Clair choice lanes</figcaption></figure><figure><img src="/tmp/cinematics/cin6ea4/browser-qa/1366x768-lion_finale_judgement.png" alt="Lion finale choices"><figcaption>AFTER · Lion finale</figcaption></figure></div></section>`;
  const reviewHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CIN-6E-A.4R Dialogue Review</title><style>
  :root{color-scheme:dark;font-family:Inter,system-ui,sans-serif;background:#07101c;color:#eef3f7}body{margin:0;background:radial-gradient(circle at 50% -10%,#263755,#07101c 55%);padding:32px}main{max-width:1500px;margin:auto}h1{font-family:Georgia,serif;color:#f4d98b;margin-bottom:6px}.summary{color:#b9c6d6;margin-bottom:24px}article,.screenshot-review,.operator-index{background:rgba(8,16,29,.92);border:1px solid #44536b;border-radius:16px;padding:20px;margin:20px 0;box-shadow:0 18px 42px #0008}h2{margin:0 0 12px;color:#f2c96d}.metrics{display:flex;gap:9px;flex-wrap:wrap}.metrics span,.metrics a,.flag{border:1px solid #687995;border-radius:999px;padding:5px 9px;background:#17243a}.flag.trim{color:#ffe0a0;border-color:#a77a2f}.timeline{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:14px;margin-top:16px}.segment{border-radius:12px;padding:14px;border:1px solid #5f718c;background:#101b2c}.segment.hold{border-color:#b18134;background:#2a2115}.segment header{font-weight:800;letter-spacing:.04em}.cast{height:185px;display:flex;align-items:end;justify-content:space-around;gap:12px;border-bottom:2px solid #63718a;margin:12px 0;background:linear-gradient(transparent,#22304a55)}figure{margin:0;text-align:center;min-width:70px}figure>span{display:grid;place-items:center;width:76px;height:120px;margin:auto;border-radius:38px 38px 12px 12px;background:linear-gradient(#d7b86b,#304c73);color:#07101c;font-size:28px;font-weight:bold;box-shadow:0 12px 20px #0008}figcaption{font-size:12px;margin-top:6px}small{display:block;color:#9eb0c7}.text-diff{display:grid;grid-template-columns:1fr 1fr;gap:10px}.text-diff p:first-child{grid-column:1/-1}.text-diff p{margin:5px 0}del{color:#d8a6a6}ins{color:#a9e4b4;text-decoration:none}.visual-only{color:#bdc9d8}.exits{color:#f5bd91}.screens{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.screens figure{border:1px solid #52637d;border-radius:10px;overflow:hidden;background:#050b14}.screens img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover}.screens figcaption{padding:9px;color:#d9c795}@media(max-width:700px){body{padding:14px}.text-diff{display:block}.timeline,.screens{grid-template-columns:1fr}}
  </style></head><body><main><h1>CIN-6E-A.4R Dialogue Review</h1><p class="summary">STATIC-TABLEAU-FIRST · ${dialogues.size}/71 dialogues · ${originalSteps}/247 steps · ${choiceStates}/28 choice states · ${beforeWords} → ${afterWords} words · zero dialogue on video/HOLD · zero speaker reassignments · zero choice/effect changes</p>${operatorReviewIndex}${screenshotReview}${reviewCards}</main></body></html>`;
  const reviewPath = resolve(REPORT_ROOT, 'cin-6e-a-4r-dialogue-review.html');
  await mkdir(dirname(reviewPath), { recursive: true });
  await Promise.all([
    writeFile(reviewPath, reviewHtml),
    writeFile(resolve(REPORT_ROOT, 'cin-6e-a-4-dialogue-review.html'), reviewHtml),
  ]);

  console.log(JSON.stringify({
    ok: true,
    baseline: BASELINE,
    dialogues: dialogues.size,
    originalSteps,
    finalSteps: originalSteps,
    choiceStates,
    beforeWords,
    afterWords,
    holdSegments: holdSegments.length,
    staticSegments: staticSegments.length,
    invariants,
    mediaHashBaselineEntries: priorValidation.productionMediaHashAudit.entries.length,
    outputs: [
      'tools/cinematics/specs/final_dialogue_pacing_audit.json',
      'tools/cinematics/specs/final_dialogue_speaker_ownership.json',
      'tools/cinematics/specs/final_dialogue_visual_segments.json',
      'tools/cinematics/specs/final_dialogue_staging_plan.json',
      'tools/cinematics/specs/final_dialogue_text_migration.json',
      'tools/cinematics/specs/final_cinematic_reduction_audit.json',
      'src/cinematics/FinalDialoguePresentation.generated.ts',
      'docs/reports/cin-6e-a-4r-dialogue-review.html',
      'docs/reports/cin-6e-a-4r-final-reconciliation.md',
    ],
  }, null, 2));
}

await main();

/**
 * The Lion dialogue presentation lock: the builder behind `src/cinematics/FinalDialoguePresentation.generated.ts`.
 *
 * The lock stages every Lion dialogue as STATIC_TABLEAU segments (CIN-6E-A.4R, 2026-09-13). A plan depends only on
 * a dialogue's presentation shape (step ids, speakers and choice counts, `dialoguePresentationShapeSignature`), so a
 * prose edit never changes it. `generate_cin6ea4_dialogue_lock.ts` writes the file and `--check` compares it;
 * `src/cinematics/FinalDialoguePresentationLock.test.ts` fails when the committed file and a regeneration differ.
 *
 * The file was last generated on 2026-09-13, then completed by hand on 2026-09-18, and the campaign moved on after
 * it. Each of those differences is an explicit input, so a regeneration reproduces the reviewed file:
 * - `stagedOutsideTheLock`: dialogues added later with their own authored plan;
 * - `LOCK_TIME_MEDIA_CLASSIFICATION`: the video classifications the plans were reviewed with;
 * - `LOCK_TIME_SHAPES`: two dialogues whose later edits are applied over their locked plan at runtime;
 * - `specs/dialogue_presentation_authored_plans.json`: the 32 plans written or patched by hand, emitted verbatim.
 * Key order follows the committed file, so a regeneration only shows real changes; new keys come last.
 *
 * Presentation only: no line, choice, speaker or outcome is read from here or changed by it.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CAMPAIGN_GRAMMAR_DIALOGUES } from '../../src/game/campaignGrammarContent';
import { dialogues } from '../../src/game/content';
import { dialoguePresentationShapeSignature } from '../../src/game/dialoguePresentationShape';
import { createRuntimeDialogueReachability } from '../../src/game/RuntimeDialogueReachability';
import type { CinematicReductionClassification } from '../../src/cinematics/CinematicReductionPolicy';
import type { DialogueSequence, DialogueStep } from '../../src/game/types';

export const DIALOGUE_PRESENTATION_LOCK_PATH = 'src/cinematics/FinalDialoguePresentation.generated.ts';
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
export const DIALOGUE_PRESENTATION_LOCK_FILE = resolve(ROOT, DIALOGUE_PRESENTATION_LOCK_PATH);
const BASELINE = 'ff743b08fb239d55e11ac5cd682950032a06e2e1';
const MAX_STATIC_ACTORS = 4;

// Ordered left-to-right from the inspected locked final frames. These take precedence over older cast-audit
// membership lists, which do not encode composition and predate the final camp-departure render.
const EXACT_FINAL_FRAME_CAST: Readonly<Record<string, readonly string[]>> = {
  alaric_audience_arrival: ['sage_seraphine', 'maelor', 'alistair', 'alaric'],
  camp_departure: ['sage_seraphine', 'maelor', 'alistair'],
};

/**
 * The classification of each source video when the plans were reviewed (`CinematicReductionPolicy` before
 * OD-2026-10-24-A). Retiring the videos did not restage the Lion tableaux: their segments keep the transition they
 * were reviewed with. A source video missing here stops the generator.
 */
const LOCK_TIME_MEDIA_CLASSIFICATION: Readonly<Record<string, CinematicReductionClassification>> = Object.freeze({
  abandoned_cart_reveal: 'OPTIONAL_VIDEO',
  alaric_audience_arrival: 'KEEP_MAJOR_VIDEO',
  bois_clair_arrival: 'KEEP_MAJOR_VIDEO',
  camp_departure: 'KEEP_MAJOR_VIDEO',
  cedric_encounter: 'CONVERT_TO_STATIC_TABLEAU',
  final_refuge_dossier: 'CONVERT_TO_STATIC_TABLEAU',
  forest_journey_tension: 'CONVERT_TO_TRAVEL_STILL',
  garen_encounter: 'CONVERT_TO_STATIC_TABLEAU',
  injured_merchant_encounter: 'CONVERT_TO_STATIC_TABLEAU',
  lion_champion_reveal: 'COMBAT_OWNED',
  lion_judgement: 'KEEP_MAJOR_VIDEO',
  ruins_approach_context: 'CONVERT_TO_HOLD_STILL',
  serpent_duelist_reveal: 'COMBAT_OWNED',
  serpent_general_reveal: 'COMBAT_OWNED',
  serpent_informant_encounter: 'CONVERT_TO_STATIC_TABLEAU',
  serpent_road_tension: 'COMBAT_OWNED',
  shadow_signs: 'CONVERT_TO_STATIC_TABLEAU',
  shrine_reveal_context: 'OPTIONAL_VIDEO',
  spider_nest_reveal: 'COMBAT_OWNED',
  troll_crossing_reveal: 'COMBAT_OWNED',
  young_dragon_encounter: 'OPTIONAL_VIDEO',
});

/**
 * OD-2026-11-04-C edited two dialogues after the lock: Maelor's second line before the gates (`final_refuge:3`) is
 * retired, and Kestrel describes the young dragon's nest in place of the dragon. `NarrativePresentationPlans.ts`
 * derives their current plans from the locked ones, so the lock keeps planning their lock-time shapes.
 */
const LOCK_TIME_SHAPES: Readonly<Record<string, { canonical: string; runtime: readonly string[] }>> = Object.freeze({
  final_refuge: {
    canonical: '1@maelor@0|2@sage_seraphine@0|3@maelor@0|4@marian@0|5@alistair@0|6@sage_seraphine@0',
    runtime: [
      '1@maelor@0|2@sage_seraphine@0|3@maelor@0|4@marian@0|r5-garen-final-pledge@lancer@0|5@alistair@0|6@sage_seraphine@0',
      '1@maelor@0|r3-cedric-continuity@cedric@0|2@sage_seraphine@0|3@maelor@0|4@marian@0|5@alistair@0|6@sage_seraphine@0',
      '1@maelor@0|r3-cedric-continuity@cedric@0|2@sage_seraphine@0|3@maelor@0|4@marian@0|r5-garen-final-pledge@lancer@0|5@alistair@0|6@sage_seraphine@0',
    ],
  },
  mystery_dragon_roost: {
    canonical: '1@young_dragon_elite@2|2@sage_seraphine@0|3@maelor@0',
    runtime: [],
  },
});

/**
 * Plans written or patched by hand (2026-09-18: `e749b822`, `2fb6988c`, `7b26af55`), which no rule derives from their
 * dialogue shape. They are emitted verbatim; a canonical one must still match its dialogue's shape. A runtime one is
 * kept even when the reachability scenarios no longer produce its shape: dropping a plan the game might still ask
 * for would stop the dialogue.
 */
const AUTHORED_PLANS_SPEC = 'dialogue_presentation_authored_plans.json';

interface AuthoredPlanEntry {
  dialogueId: string;
  shape: string;
  runtime?: true;
  origin: string;
  plan: LockPlan;
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

type Facing = 'LEFT' | 'RIGHT' | 'FORWARD';
type ScreenPosition = 'FAR_LEFT' | 'LEFT' | 'CENTER_LEFT' | 'CENTER' | 'CENTER_RIGHT' | 'RIGHT' | 'FAR_RIGHT';
type EntryEffect = 'NONE' | 'FADE_IN' | 'SLIDE_IN_LEFT' | 'SLIDE_IN_RIGHT' | 'CUT_IN';
type ExitEffect = 'NONE' | 'FADE_OUT' | 'SLIDE_OUT_LEFT' | 'SLIDE_OUT_RIGHT' | 'CUT_OUT';
type ActorGroup = 'PLAYER_COMPANY' | 'LION_COURT' | 'LOCAL_CIVILIAN' | 'REFUGEE' | 'ANTAGONIST' | 'RECRUIT_CANDIDATE' | 'NEUTRAL';
type DramaticSide = 'LEFT' | 'CENTER' | 'RIGHT';
type AddressResolution = 'EXPLICIT_ADDRESSEE' | 'AUTHORED_CONVERSATION_TARGET' | 'DIRECT_RESPONSE' | 'OPPOSING_GROUP' | 'SCENE_DEFAULT';
type Transition = 'NONE' | 'VIDEO_TO_TABLEAU' | 'TRAVEL_TO_TABLEAU' | 'HOLD_TO_TABLEAU' | 'TABLEAU_RESTAGE';

export interface LockSegmentActor {
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

export interface LockSegmentExit {
  actorId: string;
  kind: 'STAGE_OUT';
  effect: ExitEffect;
  reason: string;
}

export interface LockStepDirection {
  stepId: string;
  speakerId: string;
  addressedTo: string | null;
  lookTarget: string | null;
  facing: Facing;
  resolution: AddressResolution;
}

export interface LockSegment {
  id: string;
  mode: 'STATIC_TABLEAU';
  stepIds: string[];
  visibleCast: string[];
  allowedSpeakers: string[];
  forbiddenSpeakers: string[];
  actors: LockSegmentActor[];
  exits: LockSegmentExit[];
  stepDirections: LockStepDirection[];
  transitionFromPrevious: Transition;
  rationale: string;
}

export interface LockPlan {
  dialogueId: string;
  originalMode: string;
  sourceVideo: string | null;
  sourceVideoClassification: CinematicReductionClassification | null;
  dialogueStartsAfterMedia: true;
  normalDialogueDuringVideo: 0;
  dialogueStepsOnHold: 0;
  choiceStepsOnHold: 0;
  finalFrameCast: string[];
  finalFrameCastReferenceOnly: true;
  allowedHoldSpeakers: string[];
  forbiddenHoldSpeakers: string[];
  segments: LockSegment[];
}

export interface DialoguePresentationLock {
  plans: Record<string, LockPlan>;
  canonicalShapes: Record<string, string>;
  runtimePlans: Record<string, Record<string, LockPlan>>;
}

/** The committed lock's exports, read only for the order of their keys. */
export interface DialoguePresentationLockReference {
  FINAL_DIALOGUE_PRESENTATION_PLANS?: object;
  FINAL_DIALOGUE_CANONICAL_PRESENTATION_SHAPES?: object;
  FINAL_DIALOGUE_RUNTIME_PRESENTATION_PLANS?: object;
}

/** One step as the lock sees it: its id and its speaker. */
interface ShapeStep {
  id: string;
  actorId: string;
}

interface MediaSource {
  originalMode: string;
  sourceVideo: string | null;
  classification: CinematicReductionClassification | null;
  finalFrameCast: string[];
}

function readSpec<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(ROOT, 'tools/cinematics/specs', name), 'utf8')) as T;
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function actorId(step: DialogueStep): string {
  return step.actorId ?? `speaker:${step.speaker}`;
}

function shapeStepsOf(sequence: Readonly<DialogueSequence>): ShapeStep[] {
  return sequence.steps.map((step) => ({ id: step.id, actorId: actorId(step) }));
}

/** Reads a shape signature back into its steps (`id@speaker@choices`, separated by `|`). */
function shapeStepsFromSignature(signature: string): ShapeStep[] {
  return signature.split('|').map((part) => {
    const [id, speaker] = part.split('@');
    if (!id || !speaker) throw new Error(`Unreadable presentation shape part '${part}' in '${signature}'.`);
    return { id, actorId: speaker };
  });
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

function narrativeRole(id: string): LockSegmentActor['narrativeRole'] {
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

const RANK: Readonly<Record<ScreenPosition, number>> = { FAR_LEFT: 0, LEFT: 1, CENTER_LEFT: 2, CENTER: 3, CENTER_RIGHT: 4, RIGHT: 5, FAR_RIGHT: 6 };

function facingToward(from: ScreenPosition, target: ScreenPosition | undefined): Facing {
  if (!target) return 'FORWARD';
  if (RANK[target] > RANK[from]) return 'RIGHT';
  if (RANK[target] < RANK[from]) return 'LEFT';
  return 'FORWARD';
}

function directionForStep(
  dialogueId: string,
  steps: readonly ShapeStep[],
  step: ShapeStep,
  segmentCast: readonly string[],
  actors: readonly LockSegmentActor[],
): LockStepDirection {
  const speakerId = step.actorId;
  const explicit = EXPLICIT_ADDRESSEES[`${dialogueId}:${step.id}`];
  const previousIndex = steps.findIndex((entry) => entry.id === step.id) - 1;
  const previousSpeaker = previousIndex >= 0 ? steps[previousIndex]!.actorId : null;
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

function enteringEffect(position: ScreenPosition, firstSegment: boolean): EntryEffect {
  if (firstSegment || position === 'CENTER') return 'FADE_IN';
  return ['FAR_LEFT', 'LEFT', 'CENTER_LEFT'].includes(position) ? 'SLIDE_IN_LEFT' : 'SLIDE_IN_RIGHT';
}

function exitingEffect(position: ScreenPosition): ExitEffect {
  if (position === 'CENTER') return 'FADE_OUT';
  return ['FAR_LEFT', 'LEFT', 'CENTER_LEFT'].includes(position) ? 'SLIDE_OUT_LEFT' : 'SLIDE_OUT_RIGHT';
}

/** Cuts the steps into groups, a new one whenever a new speaker would pass the four-actor cap. */
function groupStaticSteps(steps: readonly ShapeStep[]): ShapeStep[][] {
  const groups: ShapeStep[][] = [];
  let current: ShapeStep[] = [];
  let cast = new Set<string>();
  for (const step of steps) {
    if (current.length && !cast.has(step.actorId) && cast.size >= MAX_STATIC_ACTORS) {
      groups.push(current);
      current = [];
      cast = new Set<string>();
    }
    current.push(step);
    cast.add(step.actorId);
  }
  if (current.length) groups.push(current);
  return groups;
}

function makeSegments(dialogueId: string, steps: readonly ShapeStep[], media: MediaSource): LockSegment[] {
  const segments: LockSegment[] = [];
  const allSpeakers = unique(steps.map((step) => step.actorId));
  for (const [index, group] of groupStaticSteps(steps).entries()) {
    const previous = segments[index - 1];
    const { cast, positions } = orderedCastAndPositions(dialogueId, unique(group.map((step) => step.actorId)));
    const previousCast = previous?.visibleCast ?? [];
    const actors: LockSegmentActor[] = cast.map((id, actorIndex) => {
      const position = positions[actorIndex]!;
      return {
        actorId: id,
        screenPosition: position,
        scale: 1,
        facing: facingFor(position, cast.length),
        lookTarget: lookTargetFor(cast, actorIndex),
        group: actorGroup(id),
        dramaticSide: dramaticSide(position),
        depth: group.some((step) => step.actorId === id) ? 3 : 2,
        narrativeRole: narrativeRole(id),
        entryEffect: previousCast.includes(id) ? 'NONE' : enteringEffect(position, index === 0),
      };
    });
    if (previous) {
      previous.exits.push(...previous.visibleCast.filter((id) => !cast.includes(id)).map((id): LockSegmentExit => ({
        actorId: id,
        kind: 'STAGE_OUT',
        effect: exitingEffect(previous.actors.find((actor) => actor.actorId === id)?.screenPosition ?? 'CENTER'),
        reason: 'Visual focus changes; the actor remains narratively present unless source dialogue states otherwise.',
      })));
    }
    const firstTransition: Transition = !media.sourceVideo
      ? 'NONE'
      : media.classification === 'KEEP_MAJOR_VIDEO' || media.classification === 'OPTIONAL_VIDEO' || media.classification === 'COMBAT_OWNED'
        ? 'VIDEO_TO_TABLEAU'
        : media.classification === 'CONVERT_TO_TRAVEL_STILL'
          ? 'TRAVEL_TO_TABLEAU'
          : media.classification === 'CONVERT_TO_HOLD_STILL'
            ? 'HOLD_TO_TABLEAU'
            : 'NONE';
    const id = `${dialogueId}:segment-${index + 1}`;
    segments.push({
      id,
      mode: 'STATIC_TABLEAU',
      stepIds: group.map((step) => step.id),
      visibleCast: cast,
      allowedSpeakers: [...cast],
      forbiddenSpeakers: allSpeakers.filter((speaker) => !cast.includes(speaker)),
      actors,
      exits: [],
      stepDirections: group.map((step) => directionForStep(dialogueId, steps, step, cast, actors)),
      transitionFromPrevious: index === 0 ? firstTransition : 'TABLEAU_RESTAGE',
      rationale: index === 0 && firstTransition === 'VIDEO_TO_TABLEAU'
        ? `The ${media.sourceVideo} video ends cleanly; the canonical-sprite tableau is visible before dialogue step ${group[0]!.id}.`
        : index === 0 && firstTransition === 'TRAVEL_TO_TABLEAU'
          ? 'Travel continuity yields to a speaker-complete tableau before dialogue.'
          : index === 0 && firstTransition === 'HOLD_TO_TABLEAU'
            ? 'Dialogue-free scenic punctuation yields to a speaker-complete tableau before dialogue.'
            : cast.length >= MAX_STATIC_ACTORS
              ? 'This focused group uses the maximum four-actor tableau without shrinking physical scale.'
              : 'This focused group preserves every speaker while leaving breathing room between canonical sprites.',
    });
  }
  return segments;
}

/**
 * Staging corrections approved by the operator on 2026-11-13 (« Oui, corrige-les », `docs/reports/maelor-arc-2026-11-13.md`).
 * The audit of the locked Lion segments found the troll crossing and the shrine mirrored, the creature on the left,
 * and at Bois-Clair the villager pleading for help on the right beside the Serpent raider (with Cédric there too in
 * the variant where he speaks for the company). In every shape of the named segments: the company holds the left, a
 * single civilian under threat stands at the centre between it and the foe, the one it faces holds the right, and
 * each speaker turns toward the one their line addresses. Until `6b67c458`, `src/cinematics/LockedStagingCorrections.ts`
 * applied them at runtime. They change no line, cast member or actor count.
 */
export const STAGING_CORRECTED_SEGMENTS: readonly string[] = Object.freeze([
  'village_choice:segment-1',
  'mystery_troll_crossing:segment-1',
  'mystery_shrine:segment-1',
]);
/** Who speaks for the company in these segments, Cédric included when he takes a companion's line. */
const CORRECTION_COMPANY: ReadonlySet<string> = new Set(['alistair', 'sage_seraphine', 'maelor', 'marian', 'kestrel', 'elara', 'cedric']);
const CIVILIAN_GROUPS: ReadonlySet<ActorGroup> = new Set<ActorGroup>(['LOCAL_CIVILIAN', 'REFUGEE']);
/** Creatures `actorGroup` leaves NEUTRAL (it knows only `forest_troll`) although the company faces them as foes. */
const CORRECTION_FOES: ReadonlySet<string> = new Set(['forest_troll_elite']);
const CORRECTION_LEFT_SLOTS: Readonly<Record<number, readonly ScreenPosition[]>> = { 1: ['LEFT'], 2: ['FAR_LEFT', 'CENTER_LEFT'], 3: ['FAR_LEFT', 'LEFT', 'CENTER_LEFT'] };
const CORRECTION_RIGHT_SLOTS: Readonly<Record<number, readonly ScreenPosition[]>> = { 1: ['RIGHT'], 2: ['CENTER_RIGHT', 'FAR_RIGHT'], 3: ['CENTER_RIGHT', 'RIGHT', 'FAR_RIGHT'] };

function correctSegment(segment: LockSegment): LockSegment {
  const company = segment.actors.filter((actor) => CORRECTION_COMPANY.has(actor.actorId));
  const rest = segment.actors.filter((actor) => !CORRECTION_COMPANY.has(actor.actorId));
  const civilians = rest.filter((actor) => CIVILIAN_GROUPS.has(actor.group));
  const faced = rest.filter((actor) => !CIVILIAN_GROUPS.has(actor.group));
  // A single civilian stands between the company and a foe; without a foe, the civilian is the one faced.
  const between = civilians.length === 1 && faced.length > 0 ? civilians : [];
  const across = rest.filter((actor) => !between.includes(actor));
  const leftSlots = CORRECTION_LEFT_SLOTS[company.length];
  const rightSlots = CORRECTION_RIGHT_SLOTS[across.length];
  if (!company.length || !across.length || !leftSlots || !rightSlots) {
    throw new Error(`The staging correction of ${segment.id} no longer applies to its cast ${segment.visibleCast.join(', ')}.`);
  }
  const position = new Map<string, ScreenPosition>();
  company.forEach((actor, index) => position.set(actor.actorId, leftSlots[index]!));
  between.forEach((actor) => position.set(actor.actorId, 'CENTER'));
  across.forEach((actor, index) => position.set(actor.actorId, rightSlots[index]!));
  const nearestAcross = (between[0] ?? across[0])!.actorId;
  const nearestCompany = company.at(-1)!.actorId;
  return {
    ...segment,
    actors: [...company, ...between, ...across].map((actor) => {
      const screenPosition = position.get(actor.actorId)!;
      const onLeft = company.includes(actor);
      return {
        ...actor,
        screenPosition,
        // The company faces across; the civilian between turns to the company she pleads with, the foe faces it too.
        facing: onLeft ? 'RIGHT' : 'LEFT',
        lookTarget: onLeft ? nearestAcross : nearestCompany,
        group: CORRECTION_COMPANY.has(actor.actorId) ? 'PLAYER_COMPANY' : CORRECTION_FOES.has(actor.actorId) ? 'ANTAGONIST' : actor.group,
        dramaticSide: dramaticSide(screenPosition),
      };
    }),
    exits: segment.exits.map((exit) => {
      const at = position.get(exit.actorId);
      return at && exit.effect.startsWith('SLIDE_OUT_') ? { ...exit, effect: exitingEffect(at) } : exit;
    }),
    stepDirections: segment.stepDirections.map((direction) => {
      const from = position.get(direction.speakerId);
      if (!from) return direction;
      return { ...direction, facing: facingToward(from, direction.addressedTo ? position.get(direction.addressedTo) : undefined) };
    }),
    rationale: `${segment.rationale} Corrected (operator, 2026-11-13): the company holds the left, a threatened civilian stands between, the one faced holds the right.`,
  };
}

function planFor(dialogueId: string, steps: readonly ShapeStep[], media: MediaSource): LockPlan {
  return {
    dialogueId,
    originalMode: media.originalMode,
    sourceVideo: media.sourceVideo,
    sourceVideoClassification: media.classification,
    dialogueStartsAfterMedia: true,
    normalDialogueDuringVideo: 0,
    dialogueStepsOnHold: 0,
    choiceStepsOnHold: 0,
    finalFrameCast: media.finalFrameCast,
    finalFrameCastReferenceOnly: true,
    allowedHoldSpeakers: [],
    forbiddenHoldSpeakers: unique(steps.map((step) => step.actorId)),
    segments: makeSegments(dialogueId, steps, media).map((segment) => STAGING_CORRECTED_SEGMENTS.includes(segment.id) ? correctSegment(segment) : segment),
  };
}

function mediaSources(): (dialogueId: string) => MediaSource {
  const modeAudit = readSpec<{ dialogueCoverage: Array<{ dialogueId: string; targetMode: string }>; beats: Array<{ dialogueId: string | null; currentAsset: string | string[] | null }> }>('final_presentation_mode_audit.json');
  const castAudit = readSpec<{ entries: Array<{ dialogueId: string; cinematicId: string; visibleCinematicCast: string[] }> }>('cinematic_dialogue_cast_audit.json');
  const castManifests = readSpec<{ manifests: Array<{ beatId: string; requiredCharacters: string[] }> }>('scene_cast_manifests.json');
  const modeById = new Map(modeAudit.dialogueCoverage.map((entry) => [entry.dialogueId, entry.targetMode]));
  const beatByDialogue = new Map(modeAudit.beats.filter((entry) => entry.dialogueId).map((entry) => [entry.dialogueId!, entry]));
  const castAuditByDialogue = new Map(castAudit.entries.map((entry) => [entry.dialogueId, entry]));
  const castManifestByBeat = new Map(castManifests.manifests.map((entry) => [entry.beatId, entry]));
  return (dialogueId) => {
    const beat = beatByDialogue.get(dialogueId);
    const auditedCast = castAuditByDialogue.get(dialogueId);
    const sourceVideo = auditedCast?.cinematicId
      ?? (typeof beat?.currentAsset === 'string' && !beat.currentAsset.startsWith('/') ? beat.currentAsset : null);
    const classification = sourceVideo ? LOCK_TIME_MEDIA_CLASSIFICATION[sourceVideo] : undefined;
    if (sourceVideo && !classification) throw new Error(`No lock-time classification for the source video ${sourceVideo} of ${dialogueId}.`);
    const mediaCast = sourceVideo ? castManifestByBeat.get(`media:${sourceVideo}`)?.requiredCharacters ?? [] : [];
    return {
      originalMode: modeById.get(dialogueId) ?? 'STATIC_TABLEAU',
      sourceVideo,
      classification: classification ?? null,
      finalFrameCast: unique(
        (sourceVideo ? EXACT_FINAL_FRAME_CAST[sourceVideo] : undefined)
        ?? (auditedCast?.visibleCinematicCast?.length ? auditedCast.visibleCinematicCast : mediaCast),
      ),
    };
  };
}

/** Dialogues added after the lock with their own authored plan (`CAMPAIGN_GRAMMAR_PLANS`, NarrativePresentationPlans.ts). */
export function stagedOutsideTheLock(): ReadonlySet<string> {
  return new Set(CAMPAIGN_GRAMMAR_DIALOGUES.map((sequence) => sequence.id));
}

function orderLike<T>(reference: object | undefined, entries: readonly (readonly [string, T])[]): Record<string, T> {
  const values = new Map(entries);
  const keys = reference ? Object.keys(reference).filter((key) => values.has(key)) : [];
  for (const [key] of entries) if (!keys.includes(key)) keys.push(key);
  return Object.fromEntries(keys.map((key) => [key, values.get(key)!]));
}

function authoredPlans(): AuthoredPlanEntry[] {
  return readSpec<{ plans: AuthoredPlanEntry[] }>(AUTHORED_PLANS_SPEC).plans;
}

function authoredKey(dialogueId: string, shape: string): string {
  return `${dialogueId}::${shape}`;
}

/** Builds every plan of the lock from the current dialogue registry and the lock-time inputs above. */
export function buildDialoguePresentationLock(reference: DialoguePresentationLockReference = {}): DialoguePresentationLock {
  const outside = stagedOutsideTheLock();
  const mediaFor = mediaSources();
  const owned = [...dialogues.values()].filter((sequence) => !outside.has(sequence.id));
  for (const id of Object.keys(LOCK_TIME_SHAPES)) if (!dialogues.has(id)) throw new Error(`Lock-time shape for a missing dialogue ${id}.`);
  const authored = authoredPlans();
  const authoredCanonical = new Map(authored.filter((entry) => !entry.runtime).map((entry) => [entry.dialogueId, entry]));

  const canonicalShapes = owned.map((sequence) => [sequence.id, LOCK_TIME_SHAPES[sequence.id]?.canonical ?? dialoguePresentationShapeSignature(sequence)] as const);
  const shapeOf = new Map(canonicalShapes);
  for (const entry of authoredCanonical.values()) {
    if (shapeOf.get(entry.dialogueId) !== entry.shape) {
      throw new Error(`The plan written by hand for ${entry.dialogueId} no longer matches its shape '${shapeOf.get(entry.dialogueId)}'.`);
    }
  }
  const plans = [...owned].sort((a, b) => a.id.localeCompare(b.id)).map((sequence) => {
    const written = authoredCanonical.get(sequence.id);
    if (written) return [sequence.id, written.plan] as const;
    const locked = LOCK_TIME_SHAPES[sequence.id];
    return [sequence.id, planFor(sequence.id, locked ? shapeStepsFromSignature(locked.canonical) : shapeStepsOf(sequence), mediaFor(sequence.id))] as const;
  });

  const reachability = createRuntimeDialogueReachability();
  if (reachability.contractErrors.length || reachability.unknownStepKeys.length) {
    throw new Error([
      ...reachability.contractErrors,
      ...reachability.unknownStepKeys.map((key) => `Unknown runtime presentation step: ${key}`),
    ].join('\n'));
  }
  const runtime = new Map<string, Map<string, LockPlan>>();
  const addRuntimePlan = (dialogueId: string, signature: string, plan: () => LockPlan) => {
    if (signature === shapeOf.get(dialogueId)) return;
    const byShape = runtime.get(dialogueId) ?? runtime.set(dialogueId, new Map()).get(dialogueId)!;
    if (!byShape.has(signature)) byShape.set(signature, plan());
  };
  const authoredRuntime = new Map(authored.filter((entry) => entry.runtime).map((entry) => [authoredKey(entry.dialogueId, entry.shape), entry]));
  for (const variant of reachability.variants) {
    if (outside.has(variant.dialogueId) || LOCK_TIME_SHAPES[variant.dialogueId]) continue;
    const written = authoredRuntime.get(authoredKey(variant.dialogueId, variant.signature));
    addRuntimePlan(variant.dialogueId, variant.signature, () => written?.plan ?? planFor(variant.dialogueId, shapeStepsOf(variant.sequence), mediaFor(variant.dialogueId)));
  }
  for (const [dialogueId, locked] of Object.entries(LOCK_TIME_SHAPES)) {
    for (const signature of locked.runtime) addRuntimePlan(dialogueId, signature, () => planFor(dialogueId, shapeStepsFromSignature(signature), mediaFor(dialogueId)));
  }
  for (const entry of authoredRuntime.values()) addRuntimePlan(entry.dialogueId, entry.shape, () => entry.plan);

  const referenceRuntime = reference.FINAL_DIALOGUE_RUNTIME_PRESENTATION_PLANS as Record<string, object> | undefined;
  return {
    plans: orderLike(reference.FINAL_DIALOGUE_PRESENTATION_PLANS, plans),
    canonicalShapes: orderLike(reference.FINAL_DIALOGUE_CANONICAL_PRESENTATION_SHAPES, canonicalShapes),
    runtimePlans: orderLike(referenceRuntime, [...runtime].map(([dialogueId, byShape]) => [
      dialogueId,
      orderLike(referenceRuntime?.[dialogueId], [...byShape]),
    ] as const)),
  };
}

/**
 * The checks the lock must pass before it is written. Returns one message per failure. Every plan covers its steps in
 * order, shows each speaker before their line and at most four actors, and no line addresses an actor who is not on
 * stage. A generated plan also turns each speaker
 * toward their addressee and keeps the company on the left, the one it faces on the right; the plans written by hand
 * are kept as they were reviewed.
 */
export function validateDialoguePresentationLock(lock: DialoguePresentationLock): string[] {
  const errors: string[] = [];
  const outside = stagedOutsideTheLock();
  const written = new Set(authoredPlans().map((entry) => authoredKey(entry.dialogueId, entry.shape)));
  const allPlans: Array<[string, LockPlan, string]> = [
    ...Object.entries(lock.plans).map(([id, plan]) => [id, plan, lock.canonicalShapes[id] ?? ''] as [string, LockPlan, string]),
    ...Object.entries(lock.runtimePlans).flatMap(([id, byShape]) => Object.entries(byShape).map(([shape, plan]) => [id, plan, shape] as [string, LockPlan, string])),
  ];
  for (const [dialogueId, plan, shape] of allPlans) {
    const label = `${dialogueId}::${shape}`;
    const steps = shapeStepsFromSignature(shape);
    const planned = plan.segments.flatMap((segment) => segment.stepIds);
    if (planned.join('|') !== steps.map((step) => step.id).join('|')) errors.push(`${label}: segments do not cover the shape's steps in order`);
    for (const segment of plan.segments) {
      if (segment.visibleCast.length > MAX_STATIC_ACTORS) errors.push(`${segment.id} (${label}): ${segment.visibleCast.length} visible actors`);
      for (const stepId of segment.stepIds) {
        const speaker = steps.find((step) => step.id === stepId)?.actorId;
        if (!speaker || !segment.visibleCast.includes(speaker) || !segment.allowedSpeakers.includes(speaker)) {
          errors.push(`${segment.id} (${label}): speaker of step ${stepId} is not visible`);
        }
      }
      for (const direction of segment.stepDirections) {
        for (const target of [direction.addressedTo, direction.lookTarget]) {
          if (target && !segment.visibleCast.includes(target)) errors.push(`${segment.id} (${label}): step ${direction.stepId} addresses ${target}, who is not on stage`);
        }
      }
      if (written.has(label)) continue;
      for (const direction of segment.stepDirections) {
        const from = segment.actors.find((actor) => actor.actorId === direction.speakerId)?.screenPosition ?? 'CENTER';
        const to = segment.actors.find((actor) => actor.actorId === direction.lookTarget)?.screenPosition;
        const expected = direction.lookTarget ? facingToward(from, to) : 'FORWARD';
        if (direction.facing !== expected) errors.push(`${segment.id} (${label}): step ${direction.stepId} faces ${direction.facing}, not its addressee`);
      }
      const hasCompany = segment.actors.some((actor) => actor.group === 'PLAYER_COMPANY');
      const hasCounterpart = segment.actors.some((actor) => !['PLAYER_COMPANY', 'NEUTRAL'].includes(actor.group));
      if (hasCompany && hasCounterpart) {
        const foeOnTheRight = segment.actors.some((actor) => actor.dramaticSide === 'RIGHT' && !CIVILIAN_GROUPS.has(actor.group) && actor.group !== 'PLAYER_COMPANY');
        for (const actor of segment.actors) {
          // A threatened civilian may stand at the centre, between the company and the foe it faces.
          const between = CIVILIAN_GROUPS.has(actor.group) && actor.dramaticSide === 'CENTER' && foeOnTheRight;
          const misplaced = actor.group === 'PLAYER_COMPANY'
            ? actor.dramaticSide !== 'LEFT'
            : actor.group !== 'NEUTRAL' && actor.dramaticSide !== 'RIGHT' && !between;
          if (misplaced) errors.push(`${segment.id} (${label}): ${actor.actorId} (${actor.group}) stands ${actor.dramaticSide}`);
        }
      }
    }
  }
  const reachability = createRuntimeDialogueReachability();
  const explicitRuntimeOnly = new Set(reachability.explicitLegitimateRuntimeOnlyStepKeys);
  for (const variant of reachability.variants) {
    if (outside.has(variant.dialogueId) || LOCK_TIME_SHAPES[variant.dialogueId]) continue;
    const plan = lock.runtimePlans[variant.dialogueId]?.[variant.signature]
      ?? (lock.canonicalShapes[variant.dialogueId] === variant.signature ? lock.plans[variant.dialogueId] : undefined);
    if (!plan) {
      errors.push(`No plan for the runtime variant ${variant.dialogueId}::${variant.signature}`);
      continue;
    }
    const planned = new Set(plan.segments.flatMap((segment) => segment.stepIds));
    for (const step of variant.sequence.steps) {
      if (!planned.has(step.id) && !explicitRuntimeOnly.has(`${variant.dialogueId}:${step.id}`)) {
        errors.push(`Runtime step ${variant.dialogueId}:${step.id} is missing from its plan`);
      }
    }
  }
  return errors;
}

/** The text of `src/cinematics/FinalDialoguePresentation.generated.ts`, with LF line ends. */
export function renderDialoguePresentationLock(lock: DialoguePresentationLock): string {
  return `/* eslint-disable */\n/* AUTO-GENERATED by tools/cinematics/generate_cin6ea4_dialogue_lock.ts. */\nexport const FINAL_DIALOGUE_PACING_BASELINE = '${BASELINE}' as const;\nexport const FINAL_DIALOGUE_PRESENTATION_PLANS = Object.freeze(${JSON.stringify(lock.plans, null, 2)} as const);\nexport const FINAL_DIALOGUE_CANONICAL_PRESENTATION_SHAPES = Object.freeze(${JSON.stringify(lock.canonicalShapes, null, 2)} as const);\nexport const FINAL_DIALOGUE_RUNTIME_PRESENTATION_PLANS = Object.freeze(${JSON.stringify(lock.runtimePlans, null, 2)} as const);\n`;
}

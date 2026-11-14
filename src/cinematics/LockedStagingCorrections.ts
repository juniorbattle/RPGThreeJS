/**
 * Authored staging corrections over the locked Lion plans (`FinalDialoguePresentation.generated.ts`).
 *
 * Operator remark of 2026-11-13: « de maniere general on doit bien positionner les personnages durant les static
 * dialogue car c'est parfois confus et mal etabli ». After a read-only audit of the 80 locked Lion segments (report
 * `docs/reports/maelor-arc-2026-11-13.md`), the operator answered « Oui, corrige-les ». The audit found these:
 * - the troll crossing and the shrine were mirrored and split, the creature on the left and the company cut in two;
 * - at Bois-Clair, the villager pleading for help stood on the right beside the Serpent raider, and in the variant
 *   where Cédric speaks for the company, Cédric stood there too.
 *
 * Their generator (`tools/cinematics/generate_cin6ea4_dialogue_lock.ts`) no longer runs: it stops on dialogues added
 * after it. The locked file is therefore not edited by hand. These corrections apply when a plan is resolved, and
 * only to the segments named here, in every shape of their dialogue. The company holds the left. A civilian under
 * threat stands between the company and the foe. The one the company faces holds the right. Each speaker turns toward
 * the one their line addresses.
 *
 * Presentation only: no line, choice, cast member, actor count or fact changes.
 */
import type { FinalDialoguePresentationPlan, FinalDialoguePresentationSegment } from './DialoguePresentationSegments';
import type { NarrativeScreenPosition } from './NarrativeTableau';

/** The locked segments corrected here, by segment id. */
export const LOCKED_STAGING_CORRECTED_SEGMENTS: readonly string[] = Object.freeze([
  'village_choice:segment-1',
  'mystery_troll_crossing:segment-1',
  'mystery_shrine:segment-1',
]);

/** Who speaks for the company in these segments, Cédric included when he takes a companion's line. */
const COMPANY: ReadonlySet<string> = new Set(['alistair', 'sage_seraphine', 'maelor', 'marian', 'kestrel', 'elara', 'cedric']);
const CIVILIAN_GROUPS: ReadonlySet<string> = new Set(['LOCAL_CIVILIAN', 'REFUGEE']);
/** Creatures the locked plans left NEUTRAL although the company faces them as foes. */
const FOES: ReadonlySet<string> = new Set(['forest_troll_elite']);

const LEFT_SLOTS: Readonly<Record<number, readonly NarrativeScreenPosition[]>> = Object.freeze({
  1: ['LEFT'], 2: ['FAR_LEFT', 'CENTER_LEFT'], 3: ['FAR_LEFT', 'LEFT', 'CENTER_LEFT'],
});
const RIGHT_SLOTS: Readonly<Record<number, readonly NarrativeScreenPosition[]>> = Object.freeze({
  1: ['RIGHT'], 2: ['CENTER_RIGHT', 'FAR_RIGHT'], 3: ['CENTER_RIGHT', 'RIGHT', 'FAR_RIGHT'],
});
const RANK: Readonly<Record<NarrativeScreenPosition, number>> = Object.freeze({
  FAR_LEFT: 0, LEFT: 1, CENTER_LEFT: 2, CENTER: 3, CENTER_RIGHT: 4, RIGHT: 5, FAR_RIGHT: 6,
});

type Actor = FinalDialoguePresentationSegment['actors'][number];

function facingToward(from: NarrativeScreenPosition, to: NarrativeScreenPosition | undefined): 'LEFT' | 'RIGHT' | 'FORWARD' {
  if (!to || RANK[to] === RANK[from]) return 'FORWARD';
  return RANK[to] > RANK[from] ? 'RIGHT' : 'LEFT';
}

function dramaticSideOf(position: NarrativeScreenPosition): 'LEFT' | 'CENTER' | 'RIGHT' {
  return RANK[position] < 3 ? 'LEFT' : RANK[position] > 3 ? 'RIGHT' : 'CENTER';
}

function correctSegment(segment: FinalDialoguePresentationSegment): FinalDialoguePresentationSegment {
  const company = segment.actors.filter((actor) => COMPANY.has(actor.actorId));
  const rest = segment.actors.filter((actor) => !COMPANY.has(actor.actorId));
  const civilians = rest.filter((actor) => CIVILIAN_GROUPS.has(actor.group));
  const facing = rest.filter((actor) => !CIVILIAN_GROUPS.has(actor.group));
  // A single civilian stands between the company and a foe; without a foe, the civilian is the one faced.
  const between = civilians.length === 1 && facing.length > 0 ? civilians : [];
  const across = [...rest.filter((actor) => !between.includes(actor))];
  const leftSlots = LEFT_SLOTS[company.length];
  const rightSlots = RIGHT_SLOTS[across.length];
  if (!company.length || !across.length || !leftSlots || !rightSlots) return segment;

  const position = new Map<string, NarrativeScreenPosition>();
  company.forEach((actor, index) => position.set(actor.actorId, leftSlots[index]!));
  between.forEach((actor) => position.set(actor.actorId, 'CENTER'));
  across.forEach((actor, index) => position.set(actor.actorId, rightSlots[index]!));
  const nearestAcross = (between[0] ?? across[0])!.actorId;
  const nearestCompany = company.at(-1)!.actorId;

  const actors: Actor[] = [...company, ...between, ...across].map((actor) => {
    const screenPosition = position.get(actor.actorId)!;
    const onLeft = company.includes(actor);
    return {
      ...actor,
      screenPosition,
      // The company faces across; the civilian between turns to the company she pleads with, the foe faces it too.
      facing: onLeft ? 'RIGHT' : 'LEFT',
      lookTarget: onLeft ? nearestAcross : nearestCompany,
      group: COMPANY.has(actor.actorId) ? 'PLAYER_COMPANY' : FOES.has(actor.actorId) ? 'ANTAGONIST' : actor.group,
      dramaticSide: dramaticSideOf(screenPosition),
    };
  });
  const exits = segment.exits.map((exit) => {
    const at = position.get(exit.actorId);
    if (!at || !exit.effect.startsWith('SLIDE_OUT_')) return exit;
    return { ...exit, effect: RANK[at] < 3 ? 'SLIDE_OUT_LEFT' as const : RANK[at] > 3 ? 'SLIDE_OUT_RIGHT' as const : 'FADE_OUT' as const };
  });
  const stepDirections = segment.stepDirections.map((direction) => {
    const from = position.get(direction.speakerId);
    if (!from) return direction;
    return { ...direction, facing: facingToward(from, direction.addressedTo ? position.get(direction.addressedTo) : undefined) };
  });
  return {
    ...segment,
    actors,
    exits,
    stepDirections,
    rationale: `${segment.rationale} Corrected (operator, 2026-11-13): the company holds the left, a threatened civilian stands between, the one faced holds the right.`,
  };
}

/** The plan with its named segments corrected; any other plan is returned as it is. */
export function correctLockedStaging(plan: FinalDialoguePresentationPlan): FinalDialoguePresentationPlan {
  if (!plan.segments.some((segment) => LOCKED_STAGING_CORRECTED_SEGMENTS.includes(segment.id))) return plan;
  return {
    ...plan,
    segments: plan.segments.map((segment) => LOCKED_STAGING_CORRECTED_SEGMENTS.includes(segment.id) ? correctSegment(segment) : segment),
  };
}

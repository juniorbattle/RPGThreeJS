/**
 * Set 1.20.0 (CAMPAIGN_AND_STATE, roadmap §2.3), post-demo Lot 1: the judgement of a post-demo Seal plateau.
 *
 * Each plateau ends as the Lion does: its chief weighs the company's deeds (merits, breaches and minor stains read from
 * saved facts), its witnesses, its evidence of the Shadows and its credibility, then the company claims the Seal or
 * asks for the chief's trial. The honour path leads to its second boss, the Shadow agent the roadmap names; the force
 * path to the chief and his guards. Every scene names the facts it judges, as Alaric's judgement does. The Lion keeps its
 * own engine (`lionFinale.ts`); this one is generic and reads a plateau's definition. It decides from facts only.
 */
import { dialogueSequenceSchema, type DialogueChoice, type DialogueSequence, type DialogueStep, type GameState, type NarrativeEffect } from './types';

export type PlateauConductTier = 'honour' | 'uncertain' | 'infamy';
export type PlateauFinalRoute = 'honour' | 'force';

export interface PlateauSpeaker {
  speaker: string;
  actorId: string;
  side: 'left' | 'right';
}

/** A judged deed: its flag, its weight in the verdict and the words that name it. */
export interface PlateauDeed {
  flag: string;
  kind: 'merit' | 'breach' | 'stain';
  severity: 'decisive' | 'important' | 'minor';
  phrase: string;
}

/** The post-demo Seal plateaux; the Lion keeps its own finale engine. */
export type PostDemoSealPlateauId = 'bear' | 'dragon' | 'scorpion';

export interface PlateauFinaleDefinition {
  plateauId: PostDemoSealPlateauId;
  judgementDialogueId: string;
  epilogueDialogueId: string;
  judgementSceneArtId: string;
  epilogueSceneArtId: string;
  chief: PlateauSpeaker;
  sage: PlateauSpeaker;
  steward: PlateauSpeaker;
  guard: PlateauSpeaker;
  conductWeights: Readonly<Record<string, number>>;
  deeds: readonly PlateauDeed[];
  /** Any of these facts sends the company to the trial whatever else it did. */
  forceFacts: readonly string[];
  /** The fact the honour path needs, the plateau's Bois-Clair. */
  honourFact: string;
  outcome: { lines: readonly { flag: string; text: string }[]; noneText: string };
  witnesses: { supportiveFlag: string; silencedFlag: string; supportive: string; silenced: string; none: string };
  evidence: { flag: string; text: string };
  /** Reputation from which the chief finds the company credible, and highly credible (R3, credibility before a chief). */
  credibility: { credible: number; high: number };
  opening: string;
  intent: string;
  meritsLead: string;
  breachesLead: string;
  stainsLead: string;
  flags: { trialRequested: string; honourSelected: string; trialSelected: string; seal: string };
  combats: { honour: string; force: string };
  victoryFacts: Readonly<Record<string, Readonly<Record<string, boolean>>>>;
  reputation: { honourClaim: number; voluntaryTrial: number; rejectedClaim: number };
  epilogue: { honour: string; force: string; evidence: string; noEvidence: string; chronicle: string };
}

export interface PlateauVerdict {
  conductScore: number;
  conductTier: PlateauConductTier;
  merits: PlateauDeed[];
  breaches: PlateauDeed[];
  stains: PlateauDeed[];
  witnessState: 'supportive' | 'silenced' | 'none';
  hasEvidence: boolean;
  credibility: 'high' | 'credible' | 'low';
  route: PlateauFinalRoute;
}

export function plateauConductScore(definition: PlateauFinaleDefinition, flags: Readonly<Record<string, boolean>>): number {
  return Object.entries(definition.conductWeights).reduce((score, [flag, weight]) => score + (flags[flag] ? weight : 0), 0);
}

export function resolvePlateauVerdict(definition: PlateauFinaleDefinition, input: { flags: Readonly<Record<string, boolean>>; reputation: number }): PlateauVerdict {
  const { flags } = input;
  const conductScore = plateauConductScore(definition, flags);
  const conductTier: PlateauConductTier = conductScore >= 2 ? 'honour' : conductScore <= -2 ? 'infamy' : 'uncertain';
  const held = definition.deeds.filter((deed) => flags[deed.flag]);
  const witnessState = flags[definition.witnesses.silencedFlag] ? 'silenced'
    : flags[definition.witnesses.supportiveFlag] ? 'supportive' : 'none';
  const hasEvidence = Boolean(flags[definition.evidence.flag]);
  const credibility = input.reputation >= definition.credibility.high ? 'high'
    : input.reputation >= definition.credibility.credible ? 'credible' : 'low';
  let route: PlateauFinalRoute;
  if (flags[definition.flags.trialRequested]) route = 'force';
  else if (definition.forceFacts.some((flag) => flags[flag]) || !flags[definition.honourFact]) route = 'force';
  else if (conductTier === 'infamy' || witnessState === 'silenced') route = 'force';
  else if (conductTier === 'honour') route = 'honour';
  else route = witnessState === 'supportive' || hasEvidence || credibility !== 'low' ? 'honour' : 'force';
  return {
    conductScore,
    conductTier,
    merits: held.filter((deed) => deed.kind === 'merit'),
    breaches: held.filter((deed) => deed.kind === 'breach'),
    stains: held.filter((deed) => deed.kind === 'stain'),
    witnessState,
    hasEvidence,
    credibility,
    route,
  };
}

export interface PlateauFinaleExecution {
  route: PlateauFinalRoute;
  trialCause: 'voluntary' | 'rejected_claim' | null;
  combatId: string;
  flagChanges: Readonly<Record<string, boolean>>;
  reputationDelta: number;
}

export function resolvePlateauFinaleExecution(definition: PlateauFinaleDefinition, state: Pick<GameState, 'flags' | 'reputation'>,
  intent: 'claim_recognition' | 'request_trial'): PlateauFinaleExecution {
  const voluntary = intent === 'request_trial';
  const verdict = resolvePlateauVerdict(definition, { flags: { ...state.flags, [definition.flags.trialRequested]: voluntary }, reputation: state.reputation });
  const { honourSelected, trialSelected, trialRequested } = definition.flags;
  if (!voluntary && verdict.route === 'honour') {
    return { route: 'honour', trialCause: null, combatId: definition.combats.honour,
      flagChanges: { [trialRequested]: false, [honourSelected]: true, [trialSelected]: false }, reputationDelta: definition.reputation.honourClaim };
  }
  return { route: 'force', trialCause: voluntary ? 'voluntary' : 'rejected_claim', combatId: definition.combats.force,
    flagChanges: { [trialRequested]: voluntary, [honourSelected]: false, [trialSelected]: true },
    reputationDelta: voluntary ? definition.reputation.voluntaryTrial : definition.reputation.rejectedClaim };
}

/** The finale fight still owed after a reload: the selected route's boss, until its victory fact is recorded. */
export function resolvePendingPlateauFinaleCombat(definition: PlateauFinaleDefinition, flags: Readonly<Record<string, boolean>>): string | null {
  if (flags[definition.flags.trialSelected]) {
    return Object.keys(definition.victoryFacts[definition.combats.force] ?? {}).some((flag) => flag !== definition.flags.seal && flags[flag])
      ? null : definition.combats.force;
  }
  if (flags[definition.flags.honourSelected]) {
    return Object.keys(definition.victoryFacts[definition.combats.honour] ?? {}).some((flag) => flag !== definition.flags.seal && flags[flag])
      ? null : definition.combats.honour;
  }
  return null;
}

export function plateauVictoryFacts(definition: PlateauFinaleDefinition, combatId: string): Readonly<Record<string, boolean>> {
  return definition.victoryFacts[combatId] ?? {};
}

function listFrench(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} et ${items.at(-1)}`;
}

function makeStep(id: string, who: PlateauSpeaker, text: string, options: { tag: string; expression?: DialogueStep['expression'];
  next?: string | null; effects?: NarrativeEffect[]; choices?: DialogueChoice[] }): DialogueStep {
  return { id, speaker: who.speaker, actorId: who.actorId, text, tag: options.tag, expression: options.expression ?? 'neutral',
    portrait: '', side: who.side, next: options.next ?? null, effects: options.effects ?? [], choices: options.choices ?? [] };
}

function chain(steps: DialogueStep[]): DialogueStep[] {
  for (let index = 0; index < steps.length - 1; index += 1) {
    const step = steps[index]!;
    if (!step.choices?.length && step.next === null) step.next = steps[index + 1]!.id;
  }
  return steps;
}

/** The chief's judgement, built from saved facts: every deed it weighs is named in its own words. */
export function buildPlateauJudgement(definition: PlateauFinaleDefinition, state: Readonly<GameState>): DialogueSequence {
  const verdict = resolvePlateauVerdict(definition, state);
  const steps: DialogueStep[] = [makeStep('open', definition.chief, definition.opening, { tag: 'Jugement', expression: 'stern' })];
  const outcome = definition.outcome.lines.find((line) => state.flags[line.flag]);
  steps.push(makeStep('outcome', definition.chief, outcome?.text ?? definition.outcome.noneText,
    { tag: 'Les mines', expression: outcome ? 'neutral' : 'stern' }));
  const merits = verdict.merits.filter((deed) => deed.flag !== definition.honourFact).map((deed) => deed.phrase);
  if (merits.length) steps.push(makeStep('merits', definition.sage, `${definition.meritsLead} ${listFrench(merits)}.`, { tag: 'Mérites', expression: 'stern' }));
  const breaches = verdict.breaches.filter((deed) => !definition.outcome.lines.some((line) => line.flag === deed.flag)).map((deed) => deed.phrase);
  if (breaches.length) steps.push(makeStep('breaches', definition.guard, `${definition.breachesLead} ${listFrench(breaches)}.`, { tag: 'Manquements', expression: 'hostile' }));
  const stains = verdict.stains.map((deed) => deed.phrase);
  if (stains.length) steps.push(makeStep('stains', definition.steward, `${definition.stainsLead} ${listFrench(stains)}.`, { tag: 'Réserves' }));
  const witnessText = definition.witnesses[verdict.witnessState];
  steps.push(makeStep('witnesses', definition.chief, witnessText, { tag: 'Témoins', expression: verdict.witnessState === 'silenced' ? 'hostile' : 'stern' }));
  if (verdict.hasEvidence) steps.push(makeStep('shadow', definition.sage, definition.evidence.text, { tag: 'Ombres', expression: 'mystical' }));
  steps.push(makeStep('intent', definition.chief, definition.intent, {
    tag: 'Intention', expression: 'stern',
    choices: [
      { text: 'Assumer nos actes et réclamer le Sceau.', next: null,
        effects: [{ type: 'resolvePlateauFinale', plateauId: definition.plateauId, intent: 'claim_recognition' }],
        outcomePreview: { mode: 'hidden', hints: [] } },
      { text: `Demander l’épreuve de ${definition.plateauId === 'bear' ? 'l’Ours' : definition.plateauId}.`, next: null,
        effects: [{ type: 'resolvePlateauFinale', plateauId: definition.plateauId, intent: 'request_trial' }],
        outcomePreview: { mode: 'soft', hints: ['Le Sceau sera jugé par la force'] } },
    ],
  }));
  return dialogueSequenceSchema.parse({ id: definition.judgementDialogueId, sceneArtId: definition.judgementSceneArtId, steps: chain(steps) });
}

/** The plateau's epilogue: its route, what became of its evidence, then the closing of the plateau. */
export function buildPlateauEpilogue(definition: PlateauFinaleDefinition, state: Readonly<GameState>): DialogueSequence {
  const honour = Object.keys(definition.victoryFacts[definition.combats.honour] ?? {})
    .some((flag) => flag !== definition.flags.seal && state.flags[flag]);
  const steps = chain([
    makeStep('route', definition.sage, honour ? definition.epilogue.honour : definition.epilogue.force, { tag: 'Bilan', expression: 'mystical' }),
    makeStep('ore', definition.steward, state.flags[definition.evidence.flag] ? definition.epilogue.evidence : definition.epilogue.noEvidence,
      { tag: 'Conséquence' }),
    makeStep('chronicle', definition.sage, definition.epilogue.chronicle, {
      tag: 'Chronique', expression: 'stern', effects: [{ type: 'completePlateau', plateauId: definition.plateauId }],
    }),
  ]);
  return dialogueSequenceSchema.parse({ id: definition.epilogueDialogueId, sceneArtId: definition.epilogueSceneArtId, steps });
}

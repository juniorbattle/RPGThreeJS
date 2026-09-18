import { dialogueSequenceSchema } from './types';
import type {
  DialogueChoice,
  DialogueExpression,
  DialogueSequence,
  DialogueStep,
  GameState,
  NarrativeEffect,
} from './types';
import {
  resolveLionVerdict,
  type LionFinalRoute,
  type LionVerdict,
  type LionVerdictFact,
  type LionVerdictInput,
} from './lionVerdict';

export type LionFinaleIntent = 'claim_recognition' | 'request_trial';
export type LionTrialCause = 'voluntary' | 'rejected_claim';

export interface LionFinaleExecution {
  verdict: LionVerdict;
  route: LionFinalRoute;
  trialCause: LionTrialCause | null;
  combatId: 'serpent_captain' | 'lion_chief';
  flagChanges: Readonly<Record<string, boolean>>;
  reputationDelta: number;
}

export const LION_FINALE_SERPENT_SELECTED_FLAG = 'lionFinaleSerpentPursuitSelected';
export const LION_FINALE_TRIAL_SELECTED_FLAG = 'lionFinaleTrialSelected';

export function resolveSelectedLionFinaleCombat(
  flags: Readonly<Record<string, boolean>>,
): LionFinaleExecution['combatId'] | null {
  // Trial wins contradictory/corrupt selection state because it is the
  // fail-safe route: it grants no recognition before the martial proof.
  if (flags[LION_FINALE_TRIAL_SELECTED_FLAG]) return 'lion_chief';
  if (flags[LION_FINALE_SERPENT_SELECTED_FLAG]) return 'serpent_captain';
  return null;
}

export function resolvePendingLionFinaleCombat(
  flags: Readonly<Record<string, boolean>>,
): LionFinaleExecution['combatId'] | null {
  const selected = resolveSelectedLionFinaleCombat(flags);
  if (selected === 'serpent_captain' && flags.serpentGeneralDefeated) return null;
  if (selected === 'lion_chief' && flags.lionTrialWon) return null;
  return selected;
}

interface StepOptions {
  tag?: string;
  expression?: DialogueExpression;
  side?: 'left' | 'right' | 'center' | 'none';
  next?: string | null;
  effects?: NarrativeEffect[];
  choices?: DialogueChoice[];
}

function makeStep(
  id: string,
  speaker: string,
  actorId: string,
  text: string,
  options: StepOptions = {},
): DialogueStep {
  return {
    id,
    speaker,
    actorId,
    text,
    tag: options.tag ?? '',
    expression: options.expression ?? 'neutral',
    portrait: '',
    side: options.side ?? 'center',
    next: options.next ?? null,
    effects: options.effects ?? [],
    choices: options.choices ?? [],
  };
}

function sequence(id: string, sceneArtId: string, steps: DialogueStep[]): DialogueSequence {
  return dialogueSequenceSchema.parse({ id, sceneArtId, steps });
}

function sourceOf(state: Readonly<GameState>): LionVerdictInput {
  return { flags: state.flags, reputation: state.reputation };
}

export function resolveLionFinaleExecution(
  source: LionVerdictInput,
  intent: LionFinaleIntent,
): LionFinaleExecution {
  const voluntary = intent === 'request_trial';
  const flags = { ...source.flags, lionTrialRequested: voluntary };
  const verdict = resolveLionVerdict({ ...source, flags });
  const route = voluntary ? 'lion_trial' : verdict.finalRoute;
  if (route === 'serpent_pursuit') {
    return {
      verdict,
      route,
      trialCause: null,
      combatId: 'serpent_captain',
      flagChanges: {
        lionTrialRequested: false,
        lionSealHonour: true,
        lionSealAcknowledged: true,
        [LION_FINALE_SERPENT_SELECTED_FLAG]: true,
        [LION_FINALE_TRIAL_SELECTED_FLAG]: false,
      },
      reputationDelta: 2,
    };
  }

  const trialCause: LionTrialCause = voluntary ? 'voluntary' : 'rejected_claim';
  return {
    verdict,
    route,
    trialCause,
    combatId: 'lion_chief',
    flagChanges: voluntary
      ? {
          lionTrialRequested: true,
          [LION_FINALE_SERPENT_SELECTED_FLAG]: false,
          [LION_FINALE_TRIAL_SELECTED_FLAG]: true,
        }
      : {
          lionTrialRequested: false,
          alaricDoubt: true,
          [LION_FINALE_SERPENT_SELECTED_FLAG]: false,
          [LION_FINALE_TRIAL_SELECTED_FLAG]: true,
        },
    reputationDelta: voluntary ? -2 : 0,
  };
}

export function lionBossVictoryFacts(combatId: string): Readonly<Record<string, boolean>> {
  if (combatId === 'serpent_captain') {
    return {
      serpentGeneralDefeated: true,
      shadowEvidence: true,
      lionSealAcknowledged: true,
    };
  }
  if (combatId === 'lion_chief') {
    return {
      lionTrialWon: true,
      lionSealAcknowledged: true,
    };
  }
  return {};
}

export function resolveCompletedLionRoute(flags: Readonly<Record<string, boolean>>): LionFinalRoute {
  if (flags.serpentGeneralDefeated) return 'serpent_pursuit';
  if (flags.lionTrialWon) return 'lion_trial';
  return flags.lionTrialRequested ? 'lion_trial' : 'serpent_pursuit';
}

const MERIT_TEXT: Readonly<Record<string, string>> = {
  helped_refugees: 'vous avez nourri les réfugiés de la route',
  accepted_lion_mandate: 'vous avez accepté le mandat sans marchander',
  helped_merchant: 'vous avez secouru le marchand blessé',
  returned_lost_cargo: 'vous avez rendu le chargement perdu',
  prioritized_village: 'vous avez dirigé les réserves vers le village',
  preserved_shrine: 'vous avez respecté le sanctuaire',
  supportive_witnesses: 'les témoins de Bois-Clair soutiennent votre récit',
  protected_informant: 'vous avez protégé l’informateur Serpent',
  revealed_shadow_evidence: 'vous avez confié les preuves des Ombres au Lion',
};

const BREACH_TEXT: Readonly<Record<string, string>> = {
  silenced_witnesses: 'des témoins ont été réduits au silence',
  betrayed_informant: 'l’informateur placé sur votre route a été vendu',
  exploited_refugees: 'les réfugiés ont payé votre passage',
  desecrated_shrine: 'un sanctuaire a été profané',
  brazen_lie_to_alaric: 'vous avez nié des faits établis devant Alaric',
  lied_to_alaric: 'vous avez tenté de déformer des faits devant cette cour',
};

const STAIN_TEXT: Readonly<Record<string, string>> = {
  requested_advance: 'l’avance réclamée avant votre départ',
  claimed_lost_cargo: 'le chargement perdu gardé pour votre clan',
  abandoned_merchant: 'le marchand laissé sur la route',
  looted_shrine: 'les reliques prises au vieux sanctuaire',
  prioritized_loot: 'les réserves détournées avant Bois-Clair',
  broke_shadow_altar: 'l’autel brisé pour ses fragments',
};

function factPhrases(facts: readonly LionVerdictFact[], dictionary: Readonly<Record<string, string>>): string[] {
  return facts.map((entry) => dictionary[entry.id]).filter((entry): entry is string => Boolean(entry));
}

function listFrench(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} et ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} et ${items.at(-1)}`;
}

export interface AlaricBluffAssessment {
  succeeds: boolean;
  minorStainCount: number;
  credibilityAllowance: number;
  reason: 'serious_fact' | 'too_many_traces' | 'insufficient_credibility' | 'plausible_framing';
}

/**
 * Alaric can accept a rhetorical bluff only when the dispute concerns minor,
 * plausibly interpretable route decisions. Reputation buys the benefit of the
 * doubt; free witnesses can reinforce it. Neither can erase a serious fact.
 */
export function assessAlaricBluff(verdict: LionVerdict): AlaricBluffAssessment {
  if (verdict.majorBreaches.length > 0) {
    return {
      succeeds: false,
      minorStainCount: verdict.minorStains.length,
      credibilityAllowance: 0,
      reason: 'serious_fact',
    };
  }

  const reputationAllowance = verdict.reputation >= 70 ? 2 : verdict.reputation >= 45 ? 1 : 0;
  const witnessAllowance = verdict.witnessState === 'supportive' ? 1 : 0;
  const credibilityAllowance = Math.min(2, reputationAllowance + witnessAllowance);
  const minorStainCount = verdict.minorStains.length;

  if (credibilityAllowance === 0) {
    return { succeeds: false, minorStainCount, credibilityAllowance, reason: 'insufficient_credibility' };
  }
  if (minorStainCount === 0 || minorStainCount > credibilityAllowance) {
    return { succeeds: false, minorStainCount, credibilityAllowance, reason: 'too_many_traces' };
  }
  return { succeeds: true, minorStainCount, credibilityAllowance, reason: 'plausible_framing' };
}

function shadowChoiceEffects(disclosure: 'revealed' | 'concealed'): NarrativeEffect[] {
  if (disclosure === 'revealed') {
    return [
      { type: 'setFlag', key: 'shadowConcealed', value: false },
      { type: 'setFlag', key: 'shadowRevealed', value: true },
      { type: 'addReputation', amount: 4 },
    ];
  }
  return [
    { type: 'setFlag', key: 'shadowRevealed', value: false },
    { type: 'setFlag', key: 'shadowConcealed', value: true },
  ];
}

function outcomeText(verdict: LionVerdict): string {
  const saved = verdict.reasons.includes('saved_bois_clair');
  const sacrificed = verdict.reasons.includes('sacrificed_bois_clair');
  if (saved && sacrificed) {
    return 'Bois-Clair porte deux traces impossibles à confondre : des habitants sauvés et des réserves prises à leur place. Le Lion ne transformera pas l’une en excuse pour effacer l’autre.';
  }
  if (saved) {
    return 'Bois-Clair tient encore parce que, lorsque le village s’est ouvert en deux, votre compagnie a choisi le vieux pont et ramené les captifs. Les rumeurs peuvent discuter votre nom ; elles ne peuvent pas rendre ces personnes à nouveau prisonnières.';
  }
  if (sacrificed) {
    return 'À Bois-Clair, vous avez tenu la porte basse pendant que les captifs partaient vers le nord. Les réserves ont survécu à cette décision. Ceux qui sont partis avec les Serpents aussi.';
  }
  return 'Bois-Clair ne peut pas témoigner d’un secours que votre compagnie n’a pas accompli. Sans ce fait, je ne bâtirai pas une reconnaissance sur ce que vous dites que vous auriez pu devenir.';
}

function witnessText(verdict: LionVerdict): string {
  switch (verdict.witnessState) {
    case 'supportive':
      return 'Les survivants sont venus avec leurs propres signes et leurs propres mots. Ils ne vous appartiennent pas — et précisément pour cela, leur témoignage compte.';
    case 'silenced':
      return 'Les survivants qui auraient dû parler arrivent derrière un silence imposé par vos lames. Ne me demandez pas de traiter cette absence comme si personne n’avait rien vu.';
    case 'unprotected':
      return 'Les survivants ont choisi leur propre route plutôt que votre escorte. Ils parleront peut-être encore, mais vous ne pouvez pas présenter leur distance comme un soutien.';
    case 'none':
      return 'Aucune voix indépendante n’est venue fermer les trous de votre récit. Il ne reste donc que les traces : ce qui a brûlé, ce qui a été sauvé et ce que vos comptes ne peuvent pas expliquer.';
  }
}

function shadowStep(verdict: LionVerdict, next: string): DialogueStep | null {
  if (verdict.shadowKnowledge === 'evidence' && verdict.shadowDisclosure === 'undecided') {
    return makeStep(
      'shadow',
      'Chef Alaric',
      'alaric',
      'Séraphine porte des preuves qui dépassent cette guerre de clans. Les déposerez-vous devant le Lion, ou les garderez-vous au sein de votre compagnie ?',
      {
        tag: 'Ombres', expression: 'stern', side: 'right',
        choices: [
          {
            text: 'Révéler les preuves des Ombres.', next,
            effects: shadowChoiceEffects('revealed'),
            outcomePreview: { mode: 'soft', hints: ['Le Lion apprendra la menace', 'Votre parole gagnera en crédibilité'] },
          },
          {
            text: 'Conserver les preuves au sein du clan.', next,
            effects: shadowChoiceEffects('concealed'),
            outcomePreview: { mode: 'hidden', hints: [] },
          },
        ],
      },
    );
  }
  if (verdict.shadowKnowledge === 'evidence' && verdict.shadowDisclosure === 'revealed') {
    return makeStep('shadow', 'Chef Alaric', 'alaric', 'Les preuves des Ombres sont déjà entre mes mains. Cette vérité donne du poids à votre avertissement, pas une absolution pour vos autres actes.', {
      tag: 'Ombres', expression: 'stern', side: 'right', next,
    });
  }
  if (verdict.shadowKnowledge === 'evidence' && verdict.shadowDisclosure === 'concealed') {
    return makeStep('shadow', 'Sage Séraphine', 'sage_seraphine', 'Notre compagnie ne déposera aucune autre preuve devant cette cour. Ce silence nous appartient, avec tout ce qu’il nous coûtera.', {
      tag: 'Secret', expression: 'mystical', side: 'left', next,
    });
  }
  if (verdict.shadowKnowledge === 'fragments') {
    return makeStep('shadow', 'Sage Séraphine', 'sage_seraphine', 'Nous n’avons que des fragments et des signes. Ils inquiètent, mais ils ne suffisent pas encore à établir la vérité devant le Lion.', {
      tag: 'Fragments', expression: 'mystical', side: 'left', next,
    });
  }
  return null;
}

export function buildLionFinaleJudgement(state: Readonly<GameState>): DialogueSequence {
  const verdict = resolveLionVerdict(sourceOf(state));
  const steps: DialogueStep[] = [];
  const hasContradiction = verdict.majorBreaches.length > 0 || verdict.minorStains.length > 0;
  const bluff = assessAlaricBluff(verdict);

  steps.push(makeStep(
    'open',
    'Chef Alaric',
    'alaric',
    'Je vous ai vus partir avec un nom en ruine et une mission assez simple pour tenir en une phrase. Vous revenez avec des morts, des témoins, des dettes, des preuves et des gens qui ne racontent pas tous la même histoire. C’est cela que le Lion va juger.',
    { tag: 'Ouverture', expression: 'stern', side: 'right', next: hasContradiction && !state.flags.liedToAlaric && !state.flags.alaricBluffSucceeded ? 'record' : 'outcome' },
  ));

  if (hasContradiction && !state.flags.liedToAlaric && !state.flags.alaricBluffSucceeded) {
    steps.push(makeStep(
      'record',
      'Chef Alaric',
      'alaric',
      'Il y a dans votre route des actes que vous défendrez volontiers et d’autres que personne ici ne peut ignorer. Vous pouvez entrer dans ce jugement avec eux — ou commencer par me mentir.',
      {
        tag: 'Déposition', expression: 'stern', side: 'right',
        choices: [
          { text: 'Assumer le dossier sans le falsifier.', next: 'outcome', effects: [] },
          {
            text: 'Présenter nos écarts comme des nécessités de route.',
            next: bluff.succeeds ? 'bluff-accepted' : 'lie-rebuked',
            effects: bluff.succeeds
              ? [{ type: 'setFlag', key: 'alaricBluffSucceeded', value: true }]
              : [{ type: 'setFlag', key: 'liedToAlaric', value: true }],
            outcomePreview: { mode: 'hidden', hints: [] },
          },
          {
            text: 'Nier les accusations et affirmer que les rapports mentent.',
            next: 'brazen-lie-rebuked',
            effects: [
              { type: 'setFlag', key: 'liedToAlaric', value: true },
              { type: 'setFlag', key: 'brazenLieToAlaric', value: true },
            ],
            outcomePreview: { mode: 'hidden', hints: [] },
          },
        ],
      },
    ));
    if (bluff.succeeds) {
      steps.push(makeStep(
        'bluff-accepted',
        'Chef Alaric',
        'alaric',
        bluff.minorStainCount === 1
          ? 'Je connais le fait que vous essayez de replacer dans son contexte. Il n’est pas effacé, mais votre réputation et les voix qui vous accompagnent rendent cette lecture plausible. Je l’entendrai comme un écart de route, pas comme la preuve d’une conduite entière.'
          : 'Votre nom et les témoignages qui l’accompagnent vous donnent assez de crédit pour que j’accepte cette lecture des faits mineurs. Ne confondez pas ce bénéfice du doute avec l’oubli : je juge votre route, pas la version la plus flatteuse de celle-ci.',
        { tag: 'Bénéfice du doute', expression: 'neutral', side: 'right', next: 'outcome' },
      ));
    } else {
      steps.push(makeStep(
        'lie-rebuked',
        'Champion du Lion',
        'lion_champion',
        bluff.reason === 'serious_fact'
          ? 'Vous essayez de présenter une rupture comme un simple détour. Ici, les faits sont trop lourds et les voix trop précises pour que votre réputation change leur nature. Ce n’est plus de l’interprétation : c’est un mensonge.'
          : bluff.reason === 'too_many_traces'
            ? 'Une tache peut se discuter. Plusieurs traces qui racontent la même habitude, beaucoup moins. Votre nom vous achète une audience, pas le droit de transformer une répétition en accident.'
            : 'Votre réputation vous donne assez de crédit pour être entendu, pas assez pour effacer ce que les rapports peuvent encore établir. Vous venez de dépenser ce crédit en essayant de les réduire à des détails.',
        { tag: 'Mensonge', expression: 'hostile', side: 'right', next: 'outcome' },
      ));
    }
    steps.push(makeStep(
      'brazen-lie-rebuked',
      'Chef Alaric',
      'alaric',
      'Assez. Vous ne discutez plus l’interprétation des faits : vous niez des rapports, des témoins et des traces que plusieurs voix indépendantes ont déjà confirmés. Vous me demandez de choisir votre version contre tout ce qui se tient devant moi. À cet instant, ce n’est plus seulement votre route que je mets en doute — c’est votre parole. Le Lion ne vous reconnaîtra pas sur cette base.',
      { tag: 'Rupture de confiance', expression: 'hostile', side: 'right', next: 'outcome' },
    ));
  }

  steps.push(makeStep('outcome', 'Chef Alaric', 'alaric', outcomeText(verdict), {
    tag: 'Bois-Clair', expression: verdict.reasons.includes('saved_bois_clair') ? 'neutral' : 'stern', side: 'right',
  }));

  const supportingMerits = factPhrases(
    verdict.majorMerits.filter((entry) => entry.id !== 'saved_bois_clair' && entry.id !== 'supportive_witnesses'),
    MERIT_TEXT,
  );
  if (supportingMerits.length > 0) {
    steps.push(makeStep('merits', 'Sage Séraphine', 'sage_seraphine', `Il y a aussi ceci, et personne ici n’a le droit de le réduire à une bonne réputation : ${listFrench(supportingMerits)}. Des personnes ont vécu différemment parce que ces décisions ont été prises.`, {
      tag: 'Mérites', expression: 'stern', side: 'left',
    }));
  }

  const breaches = factPhrases(
    verdict.majorBreaches.filter((entry) => entry.id !== 'sacrificed_bois_clair'),
    BREACH_TEXT,
  );
  if (breaches.length > 0) {
    steps.push(makeStep('breaches', 'Champion du Lion', 'lion_champion', `Et le Lion ne fermera pas les yeux sur ce qui demeure grave : ${listFrench(breaches)}. Un acte héroïque peut peser lourd ; il ne transforme pas ces faits en autre chose.`, {
      tag: 'Brèches', expression: 'hostile', side: 'right',
    }));
  }

  const stains = factPhrases(verdict.minorStains, STAIN_TEXT);
  if (stains.length > 0) {
    steps.push(makeStep('stains', 'Intendant Maelor', 'maelor', `Mes comptes gardent aussi ${listFrench(stains)}. Rien de cela n’est imaginaire, mais tout n’a pas le même poids. Si nous avons appris quelque chose sur cette route, c’est qu’un registre honnête doit savoir distinguer une tache d’une rupture.`, {
      tag: 'Réserves', expression: 'neutral', side: 'left',
    }));
  }

  steps.push(makeStep('witnesses', 'Chef Alaric', 'alaric', witnessText(verdict), {
    tag: 'Témoins', expression: verdict.witnessState === 'silenced' ? 'hostile' : 'stern', side: 'right',
  }));

  const shadow = shadowStep(verdict, 'intent');
  if (shadow) steps.push(shadow);
  steps.push(makeStep(
    'intent',
    'Chef Alaric',
    'alaric',
    'Vous ne pouvez plus modifier la route qui mène jusqu’ici. Vous pouvez seulement choisir ce que vous demandez au Lion en la regardant telle qu’elle est. Parlez.',
    {
      tag: 'Intention', expression: 'stern', side: 'right',
      choices: [
        {
          text: 'Assumer nos actes et réclamer le Sceau.', next: null,
          effects: [{ type: 'resolveLionFinale', intent: 'claim_recognition' }],
          outcomePreview: { mode: 'hidden', hints: [] },
        },
        {
          text: 'Demander l’épreuve du Lion.', next: null,
          effects: [{ type: 'resolveLionFinale', intent: 'request_trial' }],
          outcomePreview: { mode: 'soft', hints: ['Le Sceau sera jugé par la loi martiale du Lion'] },
        },
      ],
    },
  ));

  for (let index = 0; index < steps.length - 1; index += 1) {
    const current = steps[index]!;
    if ((current.choices?.length ?? 0) === 0 && current.next === null) current.next = steps[index + 1]!.id;
  }
  return sequence('lion_finale_judgement', 'lion_finale_judgement', steps);
}

export function buildSerpentPursuitPreCombat(state: Readonly<GameState>): DialogueSequence {
  const verdict = resolveLionVerdict(sourceOf(state));
  const recognition = verdict.stance === 'respect'
    ? 'Vous avez accompli le mandat sans demander au Lion d’oublier ce qu’il a vu. Je reconnais votre clan sans réserve. Le Sceau sera vôtre si vous terminez maintenant ce que les Serpents ont commencé.'
    : verdict.stance === 'respect_with_reservations'
      ? 'Je n’oublie ni vos compromis ni vos fautes. Mais Bois-Clair tient, des voix libres soutiennent ce qui mérite de l’être et votre route forme un ensemble que le Lion peut reconnaître — avec ses réserves.'
      : 'Votre route reste difficile à résumer proprement. Tant mieux. Les faits qui vous soutiennent suffisent à la reconnaissance ; le reste vous suivra. Poursuivez le général et ramenez son artefact.';
  return sequence('serpent_pursuit_pre_combat', 'lion_finale_judgement', [
    makeStep('1', 'Chef Alaric', 'alaric', recognition, { tag: 'Verdict', expression: 'stern', side: 'right', next: '2' }),
    makeStep('2', 'Général Serpent', 'serpent_general_boss', 'Alors le Lion vous envoie finir sa guerre. Venez donc reprendre l’artefact — et découvrez ce qui vous observe derrière nos bannières.', { tag: 'Confrontation', expression: 'hostile', side: 'right', next: '3' }),
    makeStep('3', 'Sage Séraphine', 'sage_seraphine', 'L’artefact pulse entre ses mains. Le vaincre décidera du Sceau, mais aussi de ce que nous saurons réellement des Ombres.', { tag: 'Mise en garde', expression: 'mystical', side: 'left' }),
  ]);
}

export function buildLionTrialPreCombat(state: Readonly<GameState>): DialogueSequence {
  const voluntary = state.flags.lionTrialRequested === true;
  const opening = voluntary
    ? 'Vous avez demandé l’épreuve en pleine connaissance de votre dossier. Le Lion honore ce choix : sa loi martiale décidera du Sceau.'
    : 'Votre demande de reconnaissance ne peut être accordée au vu du dossier complet. Pourtant, la loi du Lion offre encore une voie : vaincre son champion.';
  const cause = voluntary
    ? 'Cette épreuve n’est pas un châtiment. Vous l’avez choisie, et son résultat liera mon clan.'
    : 'Cette épreuve n’effacera pas vos actes. Elle décidera seulement si vous pouvez porter le Sceau malgré eux.';
  return sequence('pre_lion_chief', 'lion_finale_judgement', [
    makeStep('1', 'Chef Alaric', 'alaric', opening, { tag: voluntary ? 'Épreuve demandée' : 'Reconnaissance refusée', expression: 'stern', side: 'right', next: '2' }),
    makeStep('2', 'Chef Alaric', 'alaric', cause, { tag: 'Loi du Lion', expression: 'stern', side: 'right', next: '3' }),
    makeStep('3', 'Champion du Lion', 'lion_champion', 'Si vous tombez, le Sceau reste ici. Si vous tenez, il sera vôtre et Alaric acceptera le jugement. En garde.', { tag: 'Engagement', expression: 'hostile', side: 'right' }),
  ]);
}

export function buildSerpentGeneralAftermath(state: Readonly<GameState>): DialogueSequence {
  const verdict = resolveLionVerdict(sourceOf(state));
  const steps = [makeStep(
    '1',
    'Sage Séraphine',
    'sage_seraphine',
    'Le général Serpent est vaincu. L’artefact récupéré porte une marque des Ombres qu’aucun artisan Serpent n’aurait pu forger. Nous tenons enfin une preuve entière.',
    { tag: 'Artefact récupéré', expression: 'mystical', side: 'left' },
  )];
  if (verdict.shadowDisclosure === 'undecided') {
    steps[0]!.choices = [
      {
        text: 'Confier la preuve à Alaric.', next: '2',
        effects: shadowChoiceEffects('revealed'),
        outcomePreview: { mode: 'soft', hints: ['Le Lion apprendra la menace', 'Votre parole gagnera en crédibilité'] },
      },
      {
        text: 'Garder l’artefact et taire sa nature.', next: '3',
        effects: shadowChoiceEffects('concealed'),
        outcomePreview: { mode: 'hidden', hints: [] },
      },
    ];
  } else {
    steps[0]!.next = verdict.shadowDisclosure === 'revealed' ? '2' : '3';
  }
  steps.push(
    makeStep('2', 'Chef Alaric', 'alaric', 'La preuve confirme votre avertissement. Le Lion mettra ses éclaireurs à votre disposition ; cette menace dépasse désormais notre guerre contre les Serpents.', { tag: 'Alliance', expression: 'stern', side: 'right' }),
    makeStep('3', 'Intendant Maelor', 'maelor', 'Le Lion nous a reconnus, mais l’artefact et son secret resteront avec nous. La cour ne peut condamner une vérité qu’elle ne connaît pas.', { tag: 'Secret', expression: 'neutral', side: 'left' }),
  );
  return sequence('serpent_general_aftermath', 'lion_finale_judgement', steps);
}

export function buildLionTrialAftermath(state: Readonly<GameState>): DialogueSequence {
  const voluntary = state.flags.lionTrialRequested === true;
  const shadowKnowledge = resolveLionVerdict(sourceOf(state)).shadowKnowledge;
  const shadowLine = shadowKnowledge === 'evidence'
    ? 'Les preuves des Ombres que vous portez restent ce qu’elles étaient avant l’épreuve. Le général Serpent, lui, demeure en fuite avec ses propres secrets.'
    : shadowKnowledge === 'fragments'
      ? 'Vos fragments parlent d’une menace plus ancienne, mais le général Serpent demeure en fuite. Cette guerre n’est pas terminée.'
      : 'Le général Serpent demeure en fuite et la menace des Ombres reste sans preuve. Le Sceau est gagné ; la guerre, elle, ne l’est pas.';
  return sequence('lion_trial_aftermath', 'lion_finale_judgement', [
    makeStep('1', 'Chef Alaric', 'alaric', voluntary
      ? 'Vous avez demandé la loi du Lion et vous l’avez accomplie. Mon champion est vaincu ; le Sceau est à vous, sans autre dette de sang.'
      : 'Mon champion est vaincu. Votre reconnaissance avait été refusée, mais la loi martiale est sans appel : vous avez gagné le Sceau et j’accepte son jugement.', {
      tag: 'Sceau gagné', expression: 'grateful', side: 'right', next: '2',
    }),
    makeStep('2', 'Sage Séraphine', 'sage_seraphine', shadowLine, { tag: 'Menace ouverte', expression: 'mystical', side: 'left' }),
  ]);
}

export function buildLionEpilogue(state: Readonly<GameState>): DialogueSequence {
  const route = resolveCompletedLionRoute(state.flags);
  const verdict = resolveLionVerdict(sourceOf(state));
  const revealed = verdict.shadowDisclosure === 'revealed';
  const endingId = route === 'serpent_pursuit'
    ? revealed ? 'lion-seal-serpent-truth' : 'lion-seal-serpent'
    : revealed ? 'lion-seal-trial-truth' : 'lion-seal-trial';

  const routeText = route === 'serpent_pursuit'
    ? 'Le Sceau du Lion repose entre vos mains. Alaric a reconnu votre clan, le général Serpent est tombé, et l’artefact des Ombres a été arraché à sa fuite.'
    : 'Le Sceau du Lion repose entre vos mains. Vous l’avez gagné selon la loi martiale du clan ; Alaric accepte le résultat, tandis que le général Serpent demeure libre.';
  let shadowText: string;
  if (revealed) {
    shadowText = route === 'serpent_pursuit'
      ? 'Le Lion connaît maintenant la nature de l’artefact récupéré. Ses éclaireurs se préparent à chercher ceux qui guidaient les Serpents depuis l’ombre.'
      : verdict.shadowKnowledge === 'evidence'
        ? 'Le Lion connaît les preuves que vous aviez apportées avant l’épreuve. Elles nourrissent une alliance prudente, même si le général et ses secrets restent hors d’atteinte.'
        : verdict.shadowKnowledge === 'fragments'
          ? 'Le Lion connaît les fragments et l’avertissement que vous avez partagés. Ils inquiètent Alaric, sans encore révéler toute la menace.'
          : 'Le Lion a entendu votre avertissement, mais aucune preuve ne l’étaye encore. Le général et ses secrets restent hors d’atteinte.';
  } else if (verdict.shadowDisclosure === 'concealed') {
    shadowText = route === 'serpent_pursuit'
      ? 'L’artefact récupéré reste le secret de votre compagnie. Le Lion célèbre la victoire sans savoir quelle menace ancienne se cachait derrière elle.'
      : verdict.shadowKnowledge === 'evidence'
        ? 'Les preuves des Ombres restent le secret de votre compagnie. Le Lion respecte le duel, mais ignore encore l’étendue de la menace qui accompagne les Serpents.'
        : verdict.shadowKnowledge === 'fragments'
          ? 'Les fragments et leurs signes restent le secret de votre compagnie. Le Lion respecte le duel, mais demeure aveugle à ce pressentiment.'
          : 'Vous n’avez révélé aucune connaissance des Ombres. Le Lion respecte le duel, tandis que la guerre Serpent demeure sa seule menace certaine.';
  } else {
    shadowText = route === 'serpent_pursuit'
      ? 'La preuve est entière, mais aucune parole définitive n’a encore quitté votre compagnie. Ce silence provisoire pèsera sur la route suivante.'
      : 'Les signes des Ombres demeurent incomplets ou inconnus. Le Lion a honoré l’épreuve, tandis que la menace Serpent reste ouverte.';
  }

  return sequence('epilogue', 'epilogue', [
    makeStep('1', 'Sage Séraphine', 'sage_seraphine', routeText, { tag: 'Bilan', expression: 'mystical', side: 'left', next: '2' }),
    makeStep('2', 'Intendant Maelor', 'maelor', shadowText, { tag: revealed ? 'Vérité' : 'Conséquence', expression: 'neutral', side: 'left', next: '3' }),
    makeStep('3', 'Sage Séraphine', 'sage_seraphine', 'Le premier Sceau est acquis. Ce n’est pas la fin de cette route : c’est la première preuve de ce que notre clan choisit de devenir quand personne ne peut choisir à sa place.', {
      tag: 'Chronique', expression: 'stern', side: 'left',
      effects: [{ type: 'finishChapter', endingId }],
    }),
  ]);
}

export function buildLionContextualDialogue(
  dialogueId: string,
  state: Readonly<GameState>,
): DialogueSequence | null {
  const canonicalDialogueId = LION_CONTEXTUAL_DIALOGUE_ALIASES[dialogueId] ?? dialogueId;
  const builder = LION_CONTEXTUAL_DIALOGUE_BUILDERS[canonicalDialogueId];
  return builder?.(state) ?? null;
}

type LionContextualDialogueBuilder = (state: Readonly<GameState>) => DialogueSequence;

/**
 * Authoritative registry for state-built dialogue sequences. Keeping resolver
 * ownership and presentation reachability in one keyed registry prevents a
 * new dynamic dialogue from bypassing the campaign-wide coverage census.
 */
export const LION_CONTEXTUAL_DIALOGUE_BUILDERS: Readonly<Record<string, LionContextualDialogueBuilder>> = Object.freeze({
  lion_finale_judgement: buildLionFinaleJudgement,
  serpent_pursuit_pre_combat: buildSerpentPursuitPreCombat,
  pre_lion_chief: buildLionTrialPreCombat,
  serpent_general_aftermath: buildSerpentGeneralAftermath,
  lion_trial_aftermath: buildLionTrialAftermath,
  epilogue: buildLionEpilogue,
});

/** Resolver-input aliases never create a distinct runtime presentation ID. */
export const LION_CONTEXTUAL_DIALOGUE_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  serpent_general_pre_combat: 'serpent_pursuit_pre_combat',
});

/**
 * Declared step envelope for every state-built sequence. The census must find
 * every declared step in a real resolved state and rejects any resolved step
 * that is absent from this contract.
 */
export const LION_CONTEXTUAL_DIALOGUE_STEP_CONTRACTS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  lion_finale_judgement: Object.freeze([
    'open',
    'record',
    'lie-rebuked',
    'bluff-accepted',
    'brazen-lie-rebuked',
    'outcome',
    'merits',
    'breaches',
    'stains',
    'witnesses',
    'shadow',
    'intent',
  ]),
  serpent_pursuit_pre_combat: Object.freeze(['1', '2', '3']),
  pre_lion_chief: Object.freeze(['1', '2', '3']),
  serpent_general_aftermath: Object.freeze(['1', '2', '3']),
  lion_trial_aftermath: Object.freeze(['1', '2']),
  epilogue: Object.freeze(['1', '2', '3']),
});

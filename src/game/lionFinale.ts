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
  lied_to_alaric: 'vous avez menti devant cette cour',
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
    return 'Deux récits de Bois-Clair survivent dans vos traces : le village sauvé et ses réserves sacrifiées. Pour le Lion, la faute la plus grave demeure inscrite malgré le salut des habitants.';
  }
  if (saved) {
    return 'Bois-Clair tient encore. Quand le village brûlait, votre compagnie s’est placée entre ses habitants et les Serpents. Cet acte pèse plus lourd que les rumeurs de la route.';
  }
  if (sacrificed) {
    return 'À Bois-Clair, vous avez choisi les réserves pendant que le village payait le prix. Ni l’or ni la renommée ne peuvent effacer cette décision.';
  }
  return 'Bois-Clair n’a pas été sauvé par votre compagnie. Sans ce fait décisif, le Lion ne peut reconnaître votre demande sur de simples promesses.';
}

function witnessText(verdict: LionVerdict): string {
  switch (verdict.witnessState) {
    case 'supportive':
      return 'Les survivants ont parlé librement. Leur témoignage confirme ce que vos actes ont laissé à Bois-Clair.';
    case 'silenced':
      return 'Les survivants se taisent parce que leur voix a été étouffée. Le Lion ne confondra pas la peur avec un témoignage favorable.';
    case 'unprotected':
      return 'Les survivants sont arrivés sans votre protection. Leur absence de soutien laisse votre récit sans appui direct.';
    case 'none':
      return 'Aucun témoignage décisif n’est venu soutenir votre récit. Alaric doit donc s’en remettre aux traces laissées sur la route.';
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

  steps.push(makeStep(
    'open',
    'Chef Alaric',
    'alaric',
    'Le Lion ne donne pas son Sceau à une réputation ni à une dernière phrase. Il pèse Bois-Clair, les voix qui ont survécu, vos choix sur la route et les preuves que vous apportez.',
    { tag: 'Ouverture', expression: 'stern', side: 'right', next: hasContradiction && !state.flags.liedToAlaric ? 'record' : 'outcome' },
  ));

  if (hasContradiction && !state.flags.liedToAlaric) {
    steps.push(makeStep(
      'record',
      'Chef Alaric',
      'alaric',
      'Votre dossier porte des mérites et des taches. Parlerez-vous avec eux, ou prétendrez-vous que votre conduite fut irréprochable ?',
      {
        tag: 'Déposition', expression: 'stern', side: 'right',
        choices: [
          { text: 'Assumer le dossier sans le falsifier.', next: 'outcome', effects: [] },
          {
            text: 'Affirmer que notre conduite fut irréprochable.', next: 'lie-rebuked',
            effects: [{ type: 'setFlag', key: 'liedToAlaric', value: true }],
            outcomePreview: { mode: 'hidden', hints: [] },
          },
        ],
      },
    ));
    steps.push(makeStep(
      'lie-rebuked',
      'Champion du Lion',
      'lion_champion',
      'Les rapports sont déjà sur cette table. Mentir maintenant n’effacera rien ; cela ajoutera seulement votre parole brisée au reste.',
      { tag: 'Mensonge', expression: 'hostile', side: 'right', next: 'outcome' },
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
    steps.push(makeStep('merits', 'Sage Séraphine', 'sage_seraphine', `Le dossier porte aussi ceci : ${listFrench(supportingMerits)}. Ces actes ne sont ni oubliés ni confondus avec la renommée.`, {
      tag: 'Mérites', expression: 'stern', side: 'left',
    }));
  }

  const breaches = factPhrases(
    verdict.majorBreaches.filter((entry) => entry.id !== 'sacrificed_bois_clair'),
    BREACH_TEXT,
  );
  if (breaches.length > 0) {
    steps.push(makeStep('breaches', 'Champion du Lion', 'lion_champion', `Le Lion n’écarte pas davantage les fautes graves : ${listFrench(breaches)}. Elles exigent une réponse, même après un acte héroïque.`, {
      tag: 'Brèches', expression: 'hostile', side: 'right',
    }));
  }

  const stains = factPhrases(verdict.minorStains, STAIN_TEXT);
  if (stains.length > 0) {
    steps.push(makeStep('stains', 'Intendant Maelor', 'maelor', `Alaric se souvient de ${listFrench(stains)}. Ce sont des taches réelles ; elles ne valent pourtant pas, à elles seules, le sort de Bois-Clair.`, {
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
    'Voilà le dossier complet. Dites maintenant ce que vous demandez au Lion — et assumez la voie qui suivra.',
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
    ? 'Votre conduite a répondu au mandat. Le Lion vous reconnaît sans réserve : le Sceau sera vôtre, si vous arrêtez maintenant le général Serpent.'
    : verdict.stance === 'respect_with_reservations'
      ? 'Je n’oublie ni vos compromis ni vos fautes. Mais Bois-Clair et les voix qui vous soutiennent pèsent davantage. Le Lion vous reconnaît avec ses réserves.'
      : 'Votre dossier demeure partagé, mais les faits qui vous soutiennent suffisent. Le Lion vous reconnaît ; poursuivez le général et ramenez son artefact.';
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
    makeStep('3', 'Sage Séraphine', 'sage_seraphine', 'Le premier Sceau est acquis. Mais la manière dont vous l’avez obtenu a déjà dessiné la prochaine guerre.', {
      tag: 'Chronique', expression: 'stern', side: 'left',
      effects: [{ type: 'finishChapter', endingId }],
    }),
  ]);
}

export function buildLionContextualDialogue(
  dialogueId: string,
  state: Readonly<GameState>,
): DialogueSequence | null {
  switch (dialogueId) {
    case 'lion_finale_judgement': return buildLionFinaleJudgement(state);
    case 'serpent_pursuit_pre_combat':
    case 'serpent_general_pre_combat': return buildSerpentPursuitPreCombat(state);
    case 'pre_lion_chief': return buildLionTrialPreCombat(state);
    case 'serpent_general_aftermath': return buildSerpentGeneralAftermath(state);
    case 'lion_trial_aftermath': return buildLionTrialAftermath(state);
    case 'epilogue': return buildLionEpilogue(state);
    default: return null;
  }
}

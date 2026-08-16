import { dialogues, POST_NODE_ATE } from './content';
import {
  resolveContextualDialogue,
  resolveEligibleAteRules,
  type ContextualAteRule,
  type ContextualDialogueDefinition,
  type DialogueCondition,
  type ResolvedContextualDialogue,
} from './contextualDialogue';
import { buildLionContextualDialogue } from './lionFinale';
import { REPUTATION_EVENT_DIALOGUE_DEFINITIONS } from './reputationEventContent';
import type { DialogueExpression, DialogueStep, GameState } from './types';

const always: DialogueCondition = { kind: 'always' };
const flag = (key: string, value = true): DialogueCondition => ({ kind: 'flag', key, value });
const verdictReason = (reason: string): DialogueCondition => ({ kind: 'lionVerdictReason', reason });
const conduct = (...tiers: Array<'honour' | 'uncertain' | 'infamy'>): DialogueCondition => ({
  kind: 'lionConduct', tiers,
});
const witness = (...states: Array<'none' | 'supportive' | 'unprotected' | 'silenced'>): DialogueCondition => ({
  kind: 'lionWitness', states,
});
const shadowKnowledge = (...states: Array<'none' | 'fragments' | 'evidence'>): DialogueCondition => ({
  kind: 'lionShadowKnowledge', states,
});
const shadowDisclosure = (...states: Array<'undecided' | 'revealed' | 'concealed'>): DialogueCondition => ({
  kind: 'lionShadowDisclosure', states,
});
const all = (...conditions: DialogueCondition[]): DialogueCondition => ({ kind: 'all', conditions });

function contextualStep(
  id: string,
  speaker: string,
  actorId: string,
  text: string,
  options: { tag: string; expression?: DialogueExpression; side?: 'left' | 'right' | 'center' | 'none' },
): Omit<DialogueStep, 'next'> {
  return {
    id,
    speaker,
    actorId,
    expression: options.expression ?? 'neutral',
    tag: options.tag,
    text,
    portrait: '',
    side: options.side ?? 'center',
    effects: [],
    choices: [],
  };
}

export const CONTEXTUAL_DIALOGUE_DEFINITIONS: Readonly<Record<string, ContextualDialogueDefinition>> = {
  refugee_trial: {
    optionalSteps: [
      {
        id: 'r5-cedric-refugee-route',
        priority: 100,
        afterStepId: '0b',
        when: flag('recruitedCedric'),
        step: contextualStep(
          'r5-cedric-refugee-route',
          'Cedric',
          'cedric',
          'Je peux marquer pour eux le gué derrière les saules. Cela ne remplit pas leurs sacs et ne remplace pas notre décision, mais le détour évite deux postes Serpent avant le refuge.',
          { tag: 'Chemin possible', expression: 'stern', side: 'right' },
        ),
      },
    ],
  },
  reserve_trail: {
    optionalSteps: [
      {
        id: 'r5-cedric-convoy-reading',
        priority: 100,
        afterStepId: '0b',
        when: flag('recruitedCedric'),
        step: contextualStep(
          'r5-cedric-convoy-reading',
          'Cedric',
          'cedric',
          'Leur escorte changera au prochain vallon. Si nous frappons, je peux gagner quelques minutes, pas les rendre. Si nous continuons, je peux au moins marquer le convoi pour les Lions.',
          { tag: 'Éclaireur du convoi', expression: 'neutral', side: 'right' },
        ),
      },
    ],
  },
  village_choice: {
    variants: [
      {
        id: 'r5-cedric-at-bois-clair',
        priority: 100,
        when: flag('recruitedCedric'),
        stepPatches: [{
          stepId: '2a',
          patch: {
            speaker: 'Cedric',
            actorId: 'cedric',
            expression: 'stern',
            side: 'right',
            text: 'Ils ont préparé ce partage avant notre arrivée. Les captifs partiront par le vieux pont ; les coffres, par la porte basse. Je peux ouvrir une approche, pas tenir les deux avec cette compagnie.',
          },
        }],
      },
    ],
  },
  witnesses_on_road: {
    variants: [
      {
        id: 'r5-witnesses-contradictory-legacy',
        priority: 400,
        when: all(verdictReason('saved_bois_clair'), verdictReason('sacrificed_bois_clair')),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Les récits de Bois-Clair se contredisent : certains nous disent sauvés, d’autres abandonnés pour les réserves. Nous porterons cette contradiction devant Alaric sans vous laisser choisir la version utile.' },
        }],
      },
      {
        id: 'r5-witnesses-after-sacrifice',
        priority: 300,
        when: verdictReason('sacrificed_bois_clair'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Nous avons vu votre compagnie choisir les réserves pendant que les familles fuyaient. Nos mots vous précéderont devant Alaric, même si votre renommée raconte une histoire plus commode.' },
        }],
      },
      {
        id: 'r5-witnesses-after-rescue',
        priority: 200,
        when: verdictReason('saved_bois_clair'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Nous avons vu votre compagnie ouvrir le pont et ramener nos familles. Nos mots vous précéderont devant Alaric, mais ils resteront les nôtres : un acte juste ne nous oblige pas à devenir vos partisans.' },
        }],
      },
    ],
  },
  shadow_signs: {
    optionalSteps: [
      {
        id: 'r5-cedric-shadow-evidence',
        priority: 200,
        afterStepId: '2a',
        when: flag('recruitedCedric'),
        step: contextualStep(
          'r5-cedric-shadow-evidence',
          'Cedric',
          'cedric',
          'J’ai suivi des caisses Serpent jusqu’à une ruine semblable il y a deux hivers. Aucun porteur n’en est ressorti. Si cette pierre reste entière, elle expliquera peut-être la piste que j’ai alors choisi d’abandonner.',
          { tag: 'Piste retrouvée', expression: 'stern', side: 'right' },
        ),
      },
      {
        id: 'r5-garen-shadow-evidence',
        priority: 100,
        afterStepId: '2a',
        when: flag('recruitedLancer'),
        step: contextualStep(
          'r5-garen-shadow-evidence',
          'Garen',
          'lancer',
          'À Bois-Clair, nous pensions combattre de simples pillards. Je garderai cette preuve avec vous. Si quelqu’un les guide depuis ces ruines, ma lance suivra la vérité aussi loin que notre serment.',
          { tag: 'Lance de Bois-Clair', expression: 'stern', side: 'right' },
        ),
      },
      {
        id: 'r5-cedric-shadow-fragments',
        priority: 200,
        afterStepId: '3a',
        when: flag('recruitedCedric'),
        step: contextualStep(
          'r5-cedric-shadow-fragments',
          'Cedric',
          'cedric',
          'J’ai suivi des caisses Serpent jusqu’à une ruine semblable il y a deux hivers. Ces fragments confirment la piste, sans me dire où elle finit. Cette fois, je ne détournerai pas les yeux.',
          { tag: 'Piste fragmentée', expression: 'stern', side: 'right' },
        ),
      },
      {
        id: 'r5-garen-shadow-fragments',
        priority: 100,
        afterStepId: '3a',
        when: flag('recruitedLancer'),
        step: contextualStep(
          'r5-garen-shadow-fragments',
          'Garen',
          'lancer',
          'À Bois-Clair, nous pensions combattre de simples pillards. Même brisée, cette marque prouve au moins que leur guerre cache autre chose. Ma lance n’oubliera pas cette limite.',
          { tag: 'Lance de Bois-Clair', expression: 'stern', side: 'right' },
        ),
      },
    ],
  },
  ate_first_refuge_watch: {
    variants: [
      {
        id: 'r5-refuge-after-exploitation',
        priority: 200,
        when: flag('exploitedRefugees'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Les feux sont bas. Une famille arrivée après nous raconte que notre compagnie a pris son information et son or avant de la laisser sur la route. Le refuge écoute cette version avec une attention que notre bannière ne peut pas commander.' },
        }],
      },
      {
        id: 'r5-refuge-after-aid',
        priority: 100,
        when: flag('helpedRefugees'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Les feux sont bas. Les familles que nous avons aidées viennent d’atteindre les palissades ; elles partagent le reste de nos portions et racontent que la bannière déchue a ralenti pour elles.' },
        }],
      },
    ],
    optionalSteps: [
      {
        id: 'r5-cedric-first-watch',
        priority: 100,
        afterStepId: '3',
        when: flag('recruitedCedric'),
        step: contextualStep(
          'r5-cedric-first-watch',
          'Cedric',
          'cedric',
          'Ils ne testent pas seulement le mur. Deux éclaireurs cherchent la marque que j’ai laissée au carrefour. Je prendrai la première veille ; si mon ancien réseau nous suit, je veux être celui qui le voit venir.',
          { tag: 'Première veille', expression: 'stern', side: 'right' },
        ),
      },
    ],
  },
  ate_bois_clair_night_watch: {
    variants: [
      {
        id: 'r5-night-contradictory-legacy',
        priority: 400,
        when: all(verdictReason('saved_bois_clair'), verdictReason('sacrificed_bois_clair')),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'La nuit est tombée sur des registres impossibles : Bois-Clair y apparaît à la fois secouru et abandonné aux réserves. Cette contradiction appartient au dossier désormais ; personne ne doit la lisser pour rendre notre route plus simple.' },
        }],
      },
      {
        id: 'r5-night-after-sacrifice',
        priority: 300,
        when: verdictReason('sacrificed_bois_clair'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'La nuit est tombée, mais personne ne dort. Les réserves sont sous notre garde tandis que des familles cherchent encore les leurs au nord. Votre décision est écrite entre chaque coffre et chaque nom manquant.' },
        }],
      },
      {
        id: 'r5-night-after-rescue',
        priority: 200,
        when: verdictReason('saved_bois_clair'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'La nuit est tombée, mais personne ne dort. Les familles ramenées du vieux pont dressent la liste des absents tandis que les réserves brûlent encore au sud. Le village tient, et le coût du secours reste visible.' },
        }],
      },
    ],
  },
  ate_serpent_scout_report: {
    variants: [
      {
        id: 'cedric-absent',
        priority: 100,
        when: flag('recruitedCedric', false),
        stepPatches: [
          {
            stepId: '1',
            patch: { text: 'Général. La compagnie franchit le carrefour. Sans guide, ils ont tout de même repéré les lanternes vertes qui balisent nos embuscades.' },
          },
          {
            stepId: '3',
            patch: { text: 'Ils apprennent seuls. Bien. Envoyez les brutes au pont. On verra si leur instinct suffit quand la piste se refermera sur eux.' },
          },
        ],
      },
    ],
  },
  ate_serpent_general_warning: {
    variants: [
      {
        id: 'cedric-absent',
        priority: 100,
        when: flag('recruitedCedric', false),
        stepPatches: [
          {
            stepId: '2',
            patch: { text: 'Une compagnie organisée, sans rôdeur pour lui ouvrir la piste. Ils apprennent donc seuls — trop vite pour de simples mercenaires. Qui les envoie ?' },
          },
        ],
      },
      {
        id: 'cedric-recruited',
        priority: 100,
        when: flag('recruitedCedric'),
        stepPatches: [
          {
            stepId: '2',
            patch: { text: 'Une compagnie organisée. Cedric leur ouvre la piste ; il connaît nos lanternes et nos détours. Ils apprennent vite — trop vite pour des mercenaires. Qui les envoie ?' },
          },
        ],
      },
    ],
  },
  ate_maelor_seal_analysis: {
    variants: [
      {
        id: 'bois-clair-contradictory-legacy',
        priority: 400,
        when: all(verdictReason('saved_bois_clair'), verdictReason('sacrificed_bois_clair')),
        stepPatches: [{
          stepId: '2',
          patch: { text: 'Deux vérités contradictoires remontent de Bois-Clair : les habitants sauvés et les réserves choisies à leur place. Le Sceau gardera les deux traces ; aucune ne doit effacer l’autre.' },
        }],
      },
      {
        id: 'bois-clair-sacrificed',
        priority: 300,
        when: verdictReason('sacrificed_bois_clair'),
        stepPatches: [{
          stepId: '2',
          patch: { text: 'Même d’ici, je sens le poids de Bois-Clair. La compagnie a choisi les réserves pendant que les habitants payaient le prix. Le Sceau n’oubliera pas ce calcul.' },
        }],
      },
      {
        id: 'bois-clair-saved-honour',
        priority: 200,
        when: all(verdictReason('saved_bois_clair'), conduct('honour')),
        stepPatches: [{
          stepId: '2',
          patch: { text: 'Même d’ici, je le sens : ils ont porté les habitants de Bois-Clair avant eux-mêmes. Leur conduite et le village sauvé résonnent d’une seule voix dans le Sceau.' },
        }],
      },
      {
        id: 'bois-clair-saved-mixed',
        priority: 100,
        when: verdictReason('saved_bois_clair'),
        stepPatches: [{
          stepId: '2',
          patch: { text: 'Bois-Clair est sauvé, mais la route qui y mène porte aussi des compromis. Le Sceau distingue l’acte décisif des taches qui l’entourent ; il gardera les deux.' },
        }],
      },
    ],
  },
  ate_lion_council_doubt: {
    variants: [
      {
        id: 'witnesses-silenced',
        priority: 400,
        when: witness('silenced'),
        stepPatches: [
          { stepId: '2', patch: { text: 'Bois-Clair a vu ce qu’ils ont fait, mais ses survivants se taisent sous la contrainte. Ce silence est déjà une réponse, et le Lion ne le prendra pas pour un acquittement.' } },
          { stepId: '3', patch: { text: 'Alors leur dossier porte une voix étouffée. Qu’ils viennent quand même : le Sceau ne sera pas remis à ceux qui achètent le silence.' } },
        ],
      },
      {
        id: 'witnesses-supportive',
        priority: 300,
        when: witness('supportive'),
        stepPatches: [
          { stepId: '2', patch: { text: 'Les survivants de Bois-Clair ont choisi de parler librement. Ils ne demandent ni faveur ni vengeance : ils apportent des faits. Le Lion les entendra.' } },
          { stepId: '3', patch: { text: 'Des témoins libres, alors. Leur parole n’offre pas le Sceau, mais elle interdit que nous jugions ces étrangers sur de simples rumeurs.' } },
        ],
      },
      {
        id: 'witnesses-unprotected',
        priority: 200,
        when: witness('unprotected'),
        stepPatches: [
          { stepId: '2', patch: { text: 'Les survivants de Bois-Clair ont pris la route sans leur protection. Leurs mots viendront peut-être, mais la compagnie ne pourra pas les compter comme un soutien acquis.' } },
        ],
      },
      {
        id: 'witnesses-none',
        priority: 100,
        when: witness('none'),
        stepPatches: [
          { stepId: '2', patch: { text: 'Bois-Clair a vu ce qu’ils ont fait, mais aucun témoignage décisif ne nous est encore parvenu. Je jugerai les traces de la route, pas une voix que nous n’avons pas.' } },
        ],
      },
    ],
  },
  ate_serpent_retreat_order: {
    variants: [
      {
        id: 'shadow-evidence',
        priority: 200,
        when: shadowKnowledge('evidence'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Ils ont préservé les marques des Ombres intactes. Ce ne sont plus des soupçons : ils transportent une preuve que le Lion pourra lire.' },
        }],
      },
      {
        id: 'shadow-fragments',
        priority: 100,
        when: shadowKnowledge('fragments'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Ils ont brisé l’autel et emporté ses fragments. Leur preuve est incomplète, mais quelqu’un parmi eux comprend déjà ce que nous cachons.' },
        }],
      },
    ],
  },
  final_refuge: {
    optionalSteps: [
      {
        id: 'r3-cedric-continuity',
        priority: 100,
        afterStepId: '1',
        when: flag('recruitedCedric'),
        step: contextualStep(
          'r3-cedric-continuity',
          'Cedric',
          'cedric',
          'Depuis le carrefour, je vous ai guidés par les passages que les Serpents croyaient secrets. Devant Alaric, je répondrai de chaque piste que je vous ai ouverte.',
          { tag: 'Éclaireur', expression: 'stern', side: 'right' },
        ),
      },
      {
        id: 'r5-garen-final-pledge',
        priority: 90,
        afterStepId: '4',
        when: flag('recruitedLancer'),
        step: contextualStep(
          'r5-garen-final-pledge',
          'Garen',
          'lancer',
          'Je viens de Bois-Clair et j’entre pourtant avec votre compagnie. Ce n’est pas un acquittement offert d’avance. C’est ma décision de voir ce que votre bannière fera du jugement qu’elle réclame.',
          { tag: 'Lance témoin', expression: 'stern', side: 'right' },
        ),
      },
    ],
  },
  serpent_pursuit_pre_combat: {
    variants: [
      {
        id: 'shadow-revealed',
        priority: 200,
        when: all(shadowKnowledge('evidence'), shadowDisclosure('revealed')),
        stepPatches: [{
          stepId: '3',
          patch: { text: 'Alaric connaît les preuves que nous avons déposées. Vaincre le général décidera du Sceau — et donnera au Lion une cible réelle derrière les Ombres.' },
        }],
      },
      {
        id: 'shadow-concealed',
        priority: 200,
        when: all(shadowKnowledge('evidence'), shadowDisclosure('concealed')),
        stepPatches: [{
          stepId: '3',
          patch: { text: 'Nos preuves restent cachées au Lion. Vaincre le général décidera du Sceau, mais nous porterons seuls la vérité des Ombres au-delà de ce combat.' },
        }],
      },
    ],
  },
  pre_lion_chief: {
    variants: [
      {
        id: 'shadow-revealed',
        priority: 200,
        when: all(shadowKnowledge('evidence'), shadowDisclosure('revealed')),
        stepPatches: [{
          stepId: '2',
          patch: { text: 'Cette épreuve décidera seulement du Sceau. Les preuves des Ombres que vous avez révélées restent vraies, quel que soit votre dossier devant le Lion.' },
        }],
      },
      {
        id: 'shadow-concealed',
        priority: 200,
        when: all(shadowKnowledge('evidence'), shadowDisclosure('concealed')),
        stepPatches: [{
          stepId: '2',
          patch: { text: 'Cette épreuve décidera seulement du Sceau. Les preuves que vous gardez cachées ne pèseront pas dans le jugement du Lion.' },
        }],
      },
    ],
  },
};

const ATE_ELIGIBILITY: Readonly<Record<string, DialogueCondition>> = {
  ate_ruins_awaken: shadowKnowledge('fragments', 'evidence'),
  ate_serpent_retreat_order: shadowKnowledge('fragments', 'evidence'),
};

export const CONTEXTUAL_ATE_RULES: readonly ContextualAteRule[] = Object.entries(POST_NODE_ATE)
  .flatMap(([triggerNodeId, dialogueIds]) => dialogueIds.map((dialogueId, index) => ({
    id: dialogueId,
    triggerNodeId,
    dialogueId,
    priority: 100 - index,
    once: true,
    when: ATE_ELIGIBILITY[dialogueId] ?? always,
  })));

export function resolveGameDialogue(
  dialogueId: string,
  state: Readonly<GameState>,
): ResolvedContextualDialogue | null {
  const base = buildLionContextualDialogue(dialogueId, state) ?? dialogues.get(dialogueId);
  if (!base) return null;
  const definition = CONTEXTUAL_DIALOGUE_DEFINITIONS[dialogueId]
    ?? REPUTATION_EVENT_DIALOGUE_DEFINITIONS[dialogueId];
  return resolveContextualDialogue(base, state, definition);
}

export function resolveGameAteRules(
  triggerNodeId: string,
  state: Readonly<GameState>,
): ContextualAteRule[] {
  return resolveEligibleAteRules(triggerNodeId, state, CONTEXTUAL_ATE_RULES);
}

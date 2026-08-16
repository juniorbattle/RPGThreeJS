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
  return resolveContextualDialogue(base, state, CONTEXTUAL_DIALOGUE_DEFINITIONS[dialogueId]);
}

export function resolveGameAteRules(
  triggerNodeId: string,
  state: Readonly<GameState>,
): ContextualAteRule[] {
  return resolveEligibleAteRules(triggerNodeId, state, CONTEXTUAL_ATE_RULES);
}

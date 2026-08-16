import type {
  ContextualDialogueDefinition,
  DialogueCondition,
} from './contextualDialogue';
import {
  selectReputationEvent,
  type ReputationEventDefinition,
  type ReputationEventOpportunity,
  type ReputationEventSelection,
} from './reputationEventDirector';
import type { GameState } from './types';

const conduct = (...tiers: Array<'honour' | 'uncertain' | 'infamy'>): DialogueCondition => ({
  kind: 'lionConduct', tiers,
});
const witness = (...states: Array<'none' | 'supportive' | 'unprotected' | 'silenced'>): DialogueCondition => ({
  kind: 'lionWitness', states,
});
const verdictReason = (reason: string): DialogueCondition => ({ kind: 'lionVerdictReason', reason });
const flag = (key: string, value = true): DialogueCondition => ({ kind: 'flag', key, value });
const publicReputation = (min?: number, max?: number): DialogueCondition => ({
  kind: 'publicReputation',
  ...(min === undefined ? {} : { min }),
  ...(max === undefined ? {} : { max }),
});
const any = (...conditions: DialogueCondition[]): DialogueCondition => ({ kind: 'any', conditions });
const all = (...conditions: DialogueCondition[]): DialogueCondition => ({ kind: 'all', conditions });
const not = (condition: DialogueCondition): DialogueCondition => ({ kind: 'not', condition });

const SERIOUS_NEGATIVE_HISTORY = any(
  conduct('infamy'),
  witness('silenced'),
  verdictReason('sacrificed_bois_clair'),
  verdictReason('betrayed_informant'),
);

export const REPUTATION_EVENT_DEFINITIONS: readonly ReputationEventDefinition[] = [
  {
    id: 'roadside-intimidation',
    tags: ['social', 'hostility', 'road'],
    baseWeight: 10,
    scope: { requiredOpportunityTags: ['social'] },
    unique: true,
    familyId: 'roadside-pressure',
    cooldownSteps: 4,
    dialogueId: 'rep_event_roadside_intimidation',
    reputationCategory: 'hostile',
    priority: 10,
    metadata: {
      consequenceHints: ['Public response', 'Gold or reputation consequence'],
      contentTags: ['low-reputation-pilot'],
    },
  },
  {
    id: 'brokered-information',
    tags: ['social', 'negotiation', 'information'],
    baseWeight: 8,
    scope: { requiredOpportunityTags: ['social'] },
    unique: true,
    familyId: 'roadside-opportunity',
    cooldownSteps: 3,
    dialogueId: 'rep_event_brokered_information',
    reputationCategory: 'neutral',
    priority: 5,
    metadata: {
      consequenceHints: ['Optional gold cost', 'Historical information choice'],
      contentTags: ['neutral-reputation-pilot'],
    },
  },
  {
    id: 'public-petition',
    tags: ['social', 'request', 'public-pressure'],
    baseWeight: 10,
    scope: { requiredOpportunityTags: ['social'] },
    unique: true,
    familyId: 'public-expectation',
    cooldownSteps: 3,
    dialogueId: 'rep_event_public_petition',
    reputationCategory: 'helpful',
    priority: 5,
    metadata: {
      consequenceHints: ['Costly request', 'Public reputation consequence'],
      contentTags: ['high-reputation-pilot'],
    },
  },
  {
    id: 'bois-clair-denunciation',
    tags: ['social', 'denunciation', 'history'],
    baseWeight: 12,
    scope: {
      triggerNodeIds: ['lion-village-choice', 'lion-final-refuge'],
      requiredOpportunityTags: ['social'],
    },
    eligibility: SERIOUS_NEGATIVE_HISTORY,
    unique: true,
    familyId: 'roadside-pressure',
    cooldownSteps: 4,
    dialogueId: 'rep_event_bois_clair_denunciation',
    reputationCategory: 'hostile',
    priority: 20,
    weightModifiers: [
      { id: 'silenced-witnesses-pressure', multiplier: 1.25, when: witness('silenced') },
      { id: 'sacrificed-village-pressure', multiplier: 1.2, when: verdictReason('sacrificed_bois_clair') },
    ],
    metadata: {
      consequenceHints: ['Concrete historical accusation', 'Reparation or public response'],
      contentTags: ['conduct-eligibility-pilot'],
    },
  },
  {
    id: 'refuge-supply-offer',
    tags: ['social', 'refuge', 'supplies'],
    baseWeight: 8,
    scope: {
      triggerNodeIds: ['lion-first-refuge'],
      requiredOpportunityTags: ['social', 'refuge'],
    },
    unique: true,
    familyId: 'roadside-opportunity',
    cooldownSteps: 3,
    dialogueId: 'rep_event_refuge_supply_offer',
    reputationCategory: 'helpful',
    priority: 6,
    metadata: {
      consequenceHints: ['Limited supply allocation', 'Gold or public response'],
      contentTags: ['r5-social-variety', 'choice-class-b'],
    },
  },
  {
    id: 'serpent-rumour-market',
    tags: ['social', 'information', 'road'],
    baseWeight: 8,
    scope: {
      triggerNodeIds: ['lion-first-refuge', 'lion-village-choice'],
      requiredOpportunityTags: ['social'],
    },
    unique: true,
    familyId: 'roadside-opportunity',
    cooldownSteps: 3,
    dialogueId: 'rep_event_serpent_rumour_market',
    reputationCategory: 'neutral',
    priority: 5,
    metadata: {
      consequenceHints: ['Information purchase or public story', 'No Lion fact changes'],
      contentTags: ['r5-social-variety', 'choice-class-b'],
    },
  },
  {
    id: 'fallen-banner-claimant',
    tags: ['social', 'politics', 'public-pressure'],
    baseWeight: 7,
    scope: {
      triggerNodeIds: ['lion-final-refuge'],
      requiredOpportunityTags: ['social', 'camp'],
    },
    unique: true,
    familyId: 'public-expectation',
    cooldownSteps: 3,
    dialogueId: 'rep_event_fallen_banner_claimant',
    reputationCategory: 'helpful',
    priority: 6,
    metadata: {
      consequenceHints: ['Political sponsorship', 'No Lion verdict effect'],
      contentTags: ['r5-social-variety', 'choice-class-b'],
    },
  },
  {
    id: 'village-memorial-request',
    tags: ['social', 'bois-clair', 'request', 'history'],
    baseWeight: 9,
    scope: {
      triggerNodeIds: ['lion-village-choice', 'lion-final-refuge'],
      requiredOpportunityTags: ['social', 'bois-clair'],
    },
    eligibility: all(
      verdictReason('saved_bois_clair'),
      not(verdictReason('sacrificed_bois_clair')),
    ),
    unique: true,
    familyId: 'public-expectation',
    cooldownSteps: 3,
    dialogueId: 'rep_event_village_memorial_request',
    reputationCategory: 'helpful',
    priority: 12,
    metadata: {
      consequenceHints: ['Public memorial response', 'Bois-Clair fact remains dominant'],
      contentTags: ['r5-social-variety', 'choice-class-b'],
    },
  },
  {
    id: 'displaced-family-demand',
    tags: ['social', 'hostility', 'history', 'refugees'],
    baseWeight: 9,
    scope: {
      triggerNodeIds: ['lion-village-choice', 'lion-final-refuge'],
      requiredOpportunityTags: ['social'],
    },
    eligibility: any(
      flag('exploitedRefugees'),
      flag('abandonedMerchant'),
      verdictReason('sacrificed_bois_clair'),
    ),
    unique: true,
    familyId: 'roadside-pressure',
    cooldownSteps: 4,
    dialogueId: 'rep_event_displaced_family_demand',
    reputationCategory: 'hostile',
    priority: 14,
    metadata: {
      consequenceHints: ['Concrete social grievance', 'Acknowledgement cannot rewrite history'],
      contentTags: ['r5-social-variety', 'choice-class-b'],
    },
  },
];

type ReputationEventOpportunityTemplate = Omit<ReputationEventOpportunity, 'step'>;

const REPUTATION_EVENT_OPPORTUNITY_TEMPLATES: Readonly<Record<string, ReputationEventOpportunityTemplate>> = {
  'lion-first-refuge': {
    key: 'lion-social-window-1',
    triggerNodeId: 'lion-first-refuge',
    tags: ['social', 'road', 'refuge'],
    noEventWeight: 12,
    maxEventsPerRun: 2,
    minimumStepsSinceAnyEvent: 3,
  },
  'lion-village-choice': {
    key: 'lion-social-window-2',
    triggerNodeId: 'lion-village-choice',
    tags: ['social', 'road', 'bois-clair'],
    noEventWeight: 12,
    maxEventsPerRun: 2,
    minimumStepsSinceAnyEvent: 3,
  },
  'lion-final-refuge': {
    key: 'lion-social-window-3',
    triggerNodeId: 'lion-final-refuge',
    tags: ['social', 'camp', 'bois-clair'],
    noEventWeight: 14,
    maxEventsPerRun: 2,
    minimumStepsSinceAnyEvent: 3,
  },
};

export const REPUTATION_EVENT_DIALOGUE_DEFINITIONS: Readonly<Record<string, ContextualDialogueDefinition>> = {
  rep_event_refuge_supply_offer: {
    variants: [
      {
        id: 'supply-offer-after-aid',
        priority: 200,
        when: flag('helpedRefugees'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Les familles que vous avez aidées viennent d’arriver. Grâce à ce qu’elles racontent, le refuge peut vous céder une caisse de remèdes à prix réduit — ou la garder pour les voyageurs qui suivront votre route.' },
        }],
      },
      {
        id: 'supply-offer-after-exploitation',
        priority: 100,
        when: flag('exploitedRefugees'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Des familles disent que votre compagnie leur a pris plus qu’elle n’a donné. Le refuge vous propose pourtant une caisse de remèdes à prix réduit — ou la possibilité publique de la laisser à ceux qui arriveront après.' },
        }],
      },
    ],
  },
  rep_event_serpent_rumour_market: {
    variants: [
      {
        id: 'rumour-with-cedric',
        priority: 100,
        when: flag('recruitedCedric'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Cedric connaît mes tarifs et moi ses anciennes routes. Je vends ce que les Serpents répètent : vingt pièces pour écouter, ou une vérité de votre compagnie en échange.' },
        }],
      },
    ],
  },
  rep_event_fallen_banner_claimant: {
    variants: [
      {
        id: 'claimant-after-infamy',
        priority: 200,
        when: conduct('infamy'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Votre nom remonte dans les conversations, accompagné de récits difficiles. Mon maître peut rendre votre retour plus présentable s’il est cité dans votre première proclamation après le Sceau.' },
        }],
      },
      {
        id: 'claimant-after-honour',
        priority: 100,
        when: conduct('honour'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Vos actes rendent de nouveau votre bannière fréquentable. Mon maître peut déclarer publiquement qu’il vous a toujours soutenus, si votre première proclamation après le Sceau cite sa maison.' },
        }],
      },
    ],
  },
  rep_event_village_memorial_request: {
    variants: [
      {
        id: 'memorial-with-supportive-witnesses',
        priority: 200,
        when: witness('supportive'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Les témoins marcheront librement avec vous et porteront les faits. Je vous confie autre chose : la liste des morts de Bois-Clair. Faites-la lire au camp, ou aidez-nous à graver les noms ici.' },
        }],
      },
      {
        id: 'memorial-after-silence',
        priority: 100,
        when: witness('silenced'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Les voix vivantes ont été réduites au silence, mais les morts ne négocient pas. Portez leurs noms jusqu’au camp du Lion, ou financez la pierre qui les gardera ici.' },
        }],
      },
    ],
  },
  rep_event_displaced_family_demand: {
    variants: [
      {
        id: 'demand-after-bois-clair-sacrifice',
        priority: 300,
        when: verdictReason('sacrificed_bois_clair'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'À Bois-Clair, votre compagnie avait les moyens d’aider, mais elle a choisi les réserves. Je ne demande pas que vous réécriviez ce fait. Je demande ce que vous faites maintenant pour les familles déplacées.' },
        }],
      },
      {
        id: 'demand-after-refugee-exploitation',
        priority: 200,
        when: flag('exploitedRefugees'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Vous avez pris l’information et l’or de familles qui n’avaient déjà presque rien. Je ne demande pas que vous réécriviez la route. Je demande ce que vous faites maintenant pour leur prochain convoi.' },
        }],
      },
      {
        id: 'demand-after-abandonment',
        priority: 100,
        when: flag('abandonedMerchant'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Le marchand que vous avez laissé derrière a atteint un refuge blessé. Je ne demande pas une excuse qui change le passé. Je demande ce que votre compagnie fait maintenant pour ceux qui empruntent la même route.' },
        }],
      },
    ],
  },
  rep_event_roadside_intimidation: {
    variants: [
      {
        id: 'intimidation-infamy',
        priority: 200,
        when: conduct('infamy'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Votre nom vous précède, et les récits ne parlent pas de héros. Sur cette route, beaucoup pensent pouvoir vous traiter comme vous avez traité les autres. Payez, ou répondez devant témoins.' },
        }],
      },
      {
        id: 'intimidation-honour',
        priority: 100,
        when: conduct('honour'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Vos actes sur la route sont honorables. Cela n’empêche pas ces hommes de voir dans votre bannière une cible. Payez, ou défendez-la devant témoins.' },
        }],
      },
      {
        id: 'intimidation-low-standing',
        priority: 50,
        when: publicReputation(undefined, 19),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Votre bannière déchue ne fait plus peur à grand monde. Payez le passage, ou défendez votre nom devant tous ceux qui regardent.' },
        }],
      },
    ],
  },
  rep_event_public_petition: {
    variants: [
      {
        id: 'petition-infamy',
        priority: 200,
        when: conduct('infamy'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Votre renommée remplit les tavernes, même si les récits de votre conduite nous inquiètent. Puisque tout le monde vous regarde, aiderez-vous quand même nos familles à franchir la route ?' },
        }],
      },
      {
        id: 'petition-honour',
        priority: 100,
        when: conduct('honour'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'On dit que votre compagnie place encore les vivants avant son intérêt. Cette réputation crée des attentes : nos familles ont besoin de provisions pour franchir la route.' },
        }],
      },
      {
        id: 'petition-public-standing',
        priority: 50,
        when: publicReputation(60),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Votre nom ouvre les portes et attire les regards. Nos familles ont besoin de provisions pour franchir la route. Que vaut cette renommée quand on vous demande d’en porter le coût ?' },
        }],
      },
    ],
  },
  rep_event_bois_clair_denunciation: {
    variants: [
      {
        id: 'denunciation-sacrifice',
        priority: 300,
        when: verdictReason('sacrificed_bois_clair'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Je viens de Bois-Clair. J’ai vu votre compagnie choisir les réserves pendant que nos familles fuyaient les flammes. Votre renommée n’effacera pas ce fait. Que répondez-vous devant ceux qui ont survécu ?' },
        }],
      },
      {
        id: 'denunciation-silenced',
        priority: 200,
        when: witness('silenced'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Les témoins de Bois-Clair se taisent parce que leur parole a été étouffée. Je parlerai à leur place. Votre renommée n’achète pas notre silence.' },
        }],
      },
      {
        id: 'denunciation-infamy',
        priority: 100,
        when: conduct('infamy'),
        stepPatches: [{
          stepId: '1',
          patch: { text: 'Les récits de la route portent votre bannière et trop de gens blessés. Votre renommée attire les regards ; elle ne transforme pas ces traces en actes honorables.' },
        }],
      },
    ],
  },
};

export function getReputationEventOpportunity(
  triggerNodeId: string,
  state: Readonly<GameState>,
): ReputationEventOpportunity | null {
  const template = REPUTATION_EVENT_OPPORTUNITY_TEMPLATES[triggerNodeId];
  return template ? { ...template, tags: [...template.tags], step: state.stepCounter } : null;
}

export function selectGameReputationEvent(
  triggerNodeId: string,
  state: Readonly<GameState>,
): ReputationEventSelection | null {
  const opportunity = getReputationEventOpportunity(triggerNodeId, state);
  return opportunity
    ? selectReputationEvent(state, opportunity, REPUTATION_EVENT_DEFINITIONS)
    : null;
}

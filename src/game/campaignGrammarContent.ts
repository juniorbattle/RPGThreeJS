import { dialogueSequenceSchema } from './types';

/** Presentation aliases reuse reviewed plates; replacing art does not change campaign logic. */
export const CAMPAIGN_GRAMMAR_PRESENTATIONS: Readonly<Record<string, { environmentContext: string; backgroundId: string }>> = {
  roadside_peddler: { environmentContext: 'dialogue:mystery_recruit', backgroundId: 'roadside_peddler_environment' },
  first_refuge_gathering: { environmentContext: 'dialogue:ate_first_refuge_watch', backgroundId: 'clan_anchor_environment' },
};

export const CAMPAIGN_GRAMMAR_DIALOGUES = [
  dialogueSequenceSchema.parse({
    id: 'roadside_peddler', title: 'Une colporteuse sur la route', sceneArtId: 'mystery_recruit',
    steps: [
      { id: '1', speaker: 'Colporteuse', actorId: 'villageoise', side: 'left',
        text: 'Je voyage d’un abri à l’autre avec mes ballots. Je fais halte ici pour resserrer mes sangles ; tout va bien.', next: '2' },
      { id: '2', speaker: 'Colporteuse', actorId: 'villageoise', side: 'left',
        text: 'Le refuge est plus loin sur cette route. Gardez vos provisions à portée de main et restez groupés dans les bois.', next: '3' },
      { id: '3', speaker: 'Alistair', actorId: 'alistair', side: 'right',
        text: 'Merci pour ces nouvelles. Bonne route à vous.',
        choices: [{ text: 'Saluer la colporteuse et reprendre la route.', next: null, effects: [] }] },
    ],
  }),
  dialogueSequenceSchema.parse({
    id: 'first_refuge_gathering', title: 'La compagnie au refuge', sceneArtId: 'lion_briefing',
    steps: [
      { id: '1', speaker: 'Alistair', actorId: 'alistair', side: 'left',
        text: 'Nous sommes arrivés. Rassemblons-nous à l’abri ; la route nous a assez dispersés pour aujourd’hui.', next: '2' },
      { id: '2', speaker: 'Maelor', actorId: 'maelor', side: 'right',
        text: 'Ce que nous avons rapporté est en sûreté. Prenons le temps de compter nos réserves et de regarder qui a besoin de repos.', next: '3' },
      { id: '3', speaker: 'Alistair', actorId: 'alistair', side: 'left',
        text: 'Ce refuge nous donne un peu de répit. Soignons les blessés et préparons la suite ensemble.', next: null },
    ],
  }),
];

export const TRAVERSAL_LOCAL_NARRATIVES: Readonly<Record<string, string>> = {
  't0:npc:roadside-merchant': 'roadside_peddler',
};
export const CLAN_ANCHOR_DIALOGUES: Readonly<Record<string, string>> = {
  'lion-first-refuge': 'first_refuge_gathering',
};

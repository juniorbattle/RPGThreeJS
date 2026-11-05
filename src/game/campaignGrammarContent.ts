import { dialogueSequenceSchema } from './types';

/** Presentation aliases reuse reviewed plates; replacing art does not change campaign logic. */
export const CAMPAIGN_GRAMMAR_PRESENTATIONS: Readonly<Record<string, { environmentContext: string; backgroundId: string }>> = {
  roadside_peddler: { environmentContext: 'dialogue:mystery_recruit', backgroundId: 'roadside_peddler_environment' },
  first_refuge_gathering: { environmentContext: 'dialogue:first_refuge_gathering', backgroundId: 'first_refuge_gathering_environment' },
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
      { id: '1', speaker: 'Alistair', actorId: 'alistair', side: 'left', expression: 'stern', tag: 'Refuge du Lion',
        text: 'Des palissades, des feux et des voyageurs à l’abri. Pour la première fois depuis l’audience, personne ne nous guette depuis les talus. Rassemblons-nous ; ce répit ne durera pas.', next: '2' },
      { id: '2', speaker: 'Intendant Maelor', actorId: 'maelor', side: 'right', tag: 'Comptes du soir',
        text: 'J’ai mis à l’abri ce que nous avons rapporté de la route. Comptons nos réserves ce soir : à Bois-Clair, personne n’aura le temps de compter.', next: '3' },
      { id: '3', speaker: 'Alistair', actorId: 'alistair', side: 'left', expression: 'stern', tag: 'Avant Bois-Clair',
        text: 'Soignez les blessés et faites reprendre les lames. Bois-Clair brûle encore ; demain, il faudra marcher vite.', next: null },
    ],
  }),
];

export const CLAN_ANCHOR_DIALOGUES: Readonly<Record<string, string>> = {
  'lion-first-refuge': 'first_refuge_gathering',
};

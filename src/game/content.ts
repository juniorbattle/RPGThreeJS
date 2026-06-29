import {
  campaignNodeSchema,
  combatConfigSchema,
  dialogueSequenceSchema,
  type CampaignNode,
  type CombatConfig,
  type DialogueSequence,
} from './types';

const rawNodes: CampaignNode[] = [
  { id: 'lion-camp', type: 'start', x: -7, z: 0, icon: '◆', label: 'Camp du Lion', links: ['lion-audience'], dialogueId: 'camp_departure' },
  { id: 'lion-audience', type: 'story', x: -5.2, z: 0, icon: '♛', label: 'Audience d’Alaric', links: ['lion-refugees', 'lion-veiled-path'], dialogueId: 'lion_briefing' },
  { id: 'lion-refugees', type: 'mystery', x: -3.7, z: -1.1, icon: '◇', label: 'Route des réfugiés', links: ['lion-first-refuge'], dialogueId: 'refugee_trial' },
  { id: 'lion-veiled-path', type: 'mystery', x: -3.7, z: 1.1, icon: '?', label: 'Sentier voilé', links: ['lion-first-refuge'], mysteryPoolId: 'lion' },
  { id: 'lion-first-refuge', type: 'story', x: -1.9, z: 0, icon: '⌂', label: 'Refuge du Lion', links: ['lion-valmir-road', 'lion-reserve-trail'] },
  { id: 'lion-valmir-road', type: 'random-combat', x: -0.8, z: -0.8, icon: '⚔', label: 'Route de Bois-Clair', links: ['lion-village-choice'], combatId: 'road_to_valmir' },
  { id: 'lion-reserve-trail', type: 'mystery', x: -0.8, z: 0.8, icon: '◇', label: 'Chemin des réserves', links: ['lion-village-choice'], dialogueId: 'reserve_trail' },
  { id: 'lion-village-choice', type: 'story', x: 0, z: 0, icon: '⌂', label: 'Bois-Clair assiégé', links: ['lion-second-refuge'], dialogueId: 'village_choice' },
  { id: 'lion-second-refuge', type: 'story', x: 1.9, z: 0, icon: '⌂', label: 'Dernier feu du Lion', links: ['lion-witnesses', 'lion-shadow-signs'] },
  { id: 'lion-witnesses', type: 'mystery', x: 3.1, z: -0.8, icon: '◇', label: 'Témoins de Valmir', links: ['lion-final-judgement'], dialogueId: 'witnesses_on_road' },
  { id: 'lion-shadow-signs', type: 'mystery', x: 3.1, z: 0.8, icon: '?', label: 'Signes des Ombres', links: ['lion-final-judgement'], dialogueId: 'shadow_signs' },
  { id: 'lion-final-judgement', type: 'boss', x: 4.2, z: 0, icon: '♛', label: 'Jugement du Sceau', links: [], dialogueId: 'lion_finale_judgement' },
];

const rawCombats: CombatConfig[] = [
  { id: 'village_defense', objective: 'Repoussez les pillards et protégez Bois-Clair.', encounterLabel: 'Défense de Bois-Clair', maxPlayerUnits: 4, rewards: { gold: 140, reputation: 10 } },
  { id: 'village_raid', objective: 'Éliminez les témoins et sécurisez les coffres.', encounterLabel: 'Raid sur Bois-Clair', maxPlayerUnits: 4, rewards: { gold: 300, reputation: -15 } },
  { id: 'forest_patrol', objective: 'Éliminez la patrouille Serpent avant qu’elle ne donne l’alerte.', encounterLabel: 'Patrouille Serpent', maxPlayerUnits: 4, rewards: { gold: 90, reputation: 2 } },
  { id: 'forest_ambush', objective: 'Survivez à l’embuscade dans le sous-bois.', encounterLabel: 'Embuscade', maxPlayerUnits: 4, rewards: { gold: 75, reputation: 4 } },
  { id: 'serpent_checkpoint', objective: 'Forcez le barrage Serpent sans laisser de messager s’échapper.', encounterLabel: 'Barrage des Serpents', maxPlayerUnits: 4, rewards: { gold: 120, reputation: 3 } },
  { id: 'road_to_valmir', objective: 'Ouvrez la route de Bois-Clair avant que le village ne tombe.', encounterLabel: 'Route de Bois-Clair', maxPlayerUnits: 4, rewards: { gold: 100, reputation: 4 } },
  { id: 'serpent_captain', objective: 'Traquez le capitaine Serpent et exposez l’artefact des Ombres.', encounterLabel: 'Capitaine Serpent', maxPlayerUnits: 4, rewards: { gold: 180, reputation: 12 } },
  { id: 'lion_chief', objective: 'Survivez à la colère du Vieux Lion.', encounterLabel: 'Duel pour le Sceau', maxPlayerUnits: 4, rewards: { gold: 0, reputation: -10 } },
];

const rawDialogues: DialogueSequence[] = [
  {
    id: 'camp_departure',
    steps: [
      { id: '1', speaker: 'Chroniqueur', tag: 'CAMP DU LION', text: 'La compagnie attend l’aube. Au-delà des feux, les routes se divisent déjà entre honneur, profit et survie.', portrait: '✦', side: 'center', next: null, effects: [], choices: [] },
    ],
  },
  {
    id: 'lion_briefing',
    steps: [
      { id: '1', speaker: 'Chef Alaric', tag: 'VIEUX LION', text: 'Votre clan réclame une place parmi les grands. Alors prouvez-le. Bois-Clair brûle sous les torches des Serpents.', portrait: '/assets/portraits/alistair.png', side: 'right', next: '2', effects: [], choices: [] },
      { id: '2', speaker: 'Conseillère Elara', tag: 'SAGE', text: 'Secourir les faibles restaurera plus que votre nom. Mais les Serpents ne frappent jamais sans un second piège.', portrait: '/assets/portraits/elara.png', side: 'left', next: '3', effects: [], choices: [] },
      { id: '3', speaker: 'Intendant Maelor', tag: 'LE FOU', text: 'Ou bien laissez les coffres parler. Un clan ruiné ne rachète pas son honneur avec de belles paroles.', portrait: '/assets/portraits/marian.png', side: 'left', effects: [], choices: [
        { text: 'Accepter la mission d’Alaric.', next: '4', effects: [{ type: 'setFlag', key: 'lionMissionAccepted', value: true }, { type: 'addReputation', amount: 3 }] },
        { text: 'Accepter, mais réclamer une avance.', next: '5', effects: [{ type: 'setFlag', key: 'lionMissionAccepted', value: true }, { type: 'addGold', amount: 60 }, { type: 'addReputation', amount: -3 }] },
      ] },
      { id: '4', speaker: 'Chef Alaric', tag: 'SERMENT', text: 'Alors marchez. Revenez avec Bois-Clair debout, et le Sceau du Lion entendra votre nom.', portrait: '/assets/portraits/alistair.png', side: 'right', next: null, effects: [{ type: 'setFlag', key: 'chapterStarted', value: true }], choices: [] },
      { id: '5', speaker: 'Chef Alaric', tag: 'SERMENT FRAGILE', text: 'Vous négociez vite pour un clan qui demande confiance. Prenez l’or. Mais chaque pièce pèsera dans mon jugement.', portrait: '/assets/portraits/alistair.png', side: 'right', next: null, effects: [{ type: 'setFlag', key: 'chapterStarted', value: true }, { type: 'setFlag', key: 'alaricDoubt', value: true }], choices: [] },
    ],
  },
  {
    id: 'lion_intro',
    steps: [
      { id: '1', speaker: 'Intendant Maelor', tag: 'CLAN DU LION', text: 'Les éclaireurs confirment que les Serpents marchent sur Bois-Clair. Le Chef vous attend.', portrait: '/assets/portraits/marian.png', side: 'left', next: '2', effects: [], choices: [] },
      { id: '2', speaker: 'Chef Alaric', tag: 'PORTEUR DU LION', text: 'Prouvez que votre compagnie mérite de marcher sous notre bannière. Sauvez le village et revenez avec l’honneur intact.', portrait: '/assets/portraits/alistair.png', side: 'right', next: null, effects: [{ type: 'setFlag', key: 'chapterStarted', value: true }], choices: [] },
    ],
  },
  {
    id: 'lion_oath',
    steps: [
      { id: '1', speaker: 'Chef Alaric', tag: 'SERMENT', text: 'Quel principe guidera votre commandement lorsque la route exigera un sacrifice ?', portrait: '/assets/portraits/alistair.png', side: 'right', effects: [], choices: [
        { text: 'L’honneur avant le profit.', next: '2', effects: [{ type: 'addReputation', amount: 5 }, { type: 'setFlag', key: 'honourOath', value: true }] },
        { text: 'La victoire justifie les moyens.', next: '3', effects: [{ type: 'addGold', amount: 50 }, { type: 'setFlag', key: 'pragmaticOath', value: true }] },
      ] },
      { id: '2', speaker: 'Conseillère Elara', tag: 'SAGE', text: 'Alors les habitants verront en vous un rempart.', portrait: '/assets/portraits/elara.png', side: 'left', next: null, effects: [], choices: [] },
      { id: '3', speaker: 'Intendant Maelor', tag: 'STRATÈGE', text: 'Une réponse froide. Peut-être est-ce précisément ce dont cette guerre a besoin.', portrait: '/assets/portraits/marian.png', side: 'left', next: null, effects: [], choices: [] },
    ],
  },
  {
    id: 'refugee_trial',
    steps: [
      { id: '1', speaker: 'Mère réfugiée', tag: 'ROUTE DES RÉFUGIÉS', text: 'Les Serpents ont pris nos vivres. Les enfants ne tiendront pas jusqu’au refuge. Partagerez-vous vos réserves ?', portrait: '/assets/portraits/marian.png', side: 'left', effects: [], choices: [
        { text: 'Partager vos réserves — 40 or.', next: '2', requiresGold: 40, effects: [{ type: 'addGold', amount: -40 }, { type: 'addReputation', amount: 8 }, { type: 'setFlag', key: 'helpedRefugees', value: true }] },
        { text: 'Prendre l’information et continuer.', next: '3', effects: [{ type: 'addGold', amount: 40 }, { type: 'addReputation', amount: -8 }, { type: 'setFlag', key: 'exploitedRefugees', value: true }] },
      ] },
      { id: '2', speaker: 'Mère réfugiée', tag: 'GRATITUDE', text: 'Que le Lion se souvienne de vous. Une piste évite les guetteurs au nord.', portrait: '/assets/portraits/marian.png', side: 'left', next: null, effects: [{ type: 'addItem', itemId: 'potion', quantity: 1 }], choices: [] },
      { id: '3', speaker: 'Intendant Maelor', tag: 'CALCUL', text: 'Ils survivront peut-être. Vous, au moins, avez gagné de quoi survivre sûrement.', portrait: '/assets/portraits/marian.png', side: 'left', next: null, effects: [], choices: [] },
    ],
  },
  {
    id: 'reserve_trail',
    steps: [
      { id: '1', speaker: 'Éclaireur du Lion', tag: 'CHEMIN DES RÉSERVES', text: 'Un convoi Serpent transporte les coffres de Bois-Clair. L’intercepter enrichira la compagnie, mais retardera le secours.', portrait: '/assets/portraits/kestrel.png', side: 'right', effects: [], choices: [
        { text: 'Frapper le convoi et saisir les réserves.', next: '2', effects: [{ type: 'addGold', amount: 120 }, { type: 'addReputation', amount: -6 }, { type: 'setFlag', key: 'prioritizedLoot', value: true }] },
        { text: 'Marquer le convoi et continuer vers le village.', next: '3', effects: [{ type: 'addReputation', amount: 4 }, { type: 'setFlag', key: 'prioritizedVillage', value: true }] },
      ] },
      { id: '2', speaker: 'Intendant Maelor', tag: 'BUTIN', text: 'Une bourse pleine vaut parfois mieux qu’une chanson de gratitude.', portrait: '/assets/portraits/marian.png', side: 'left', next: null, effects: [{ type: 'addItem', itemId: 'bomb', quantity: 1 }], choices: [] },
      { id: '3', speaker: 'Conseillère Elara', tag: 'URGENCE', text: 'Les coffres peuvent attendre. Les vivants, non.', portrait: '/assets/portraits/elara.png', side: 'left', next: null, effects: [], choices: [] },
    ],
  },
  {
    id: 'village_choice',
    steps: [
      { id: '1', speaker: 'Villageoise de Bois-Clair', tag: 'EN DÉTRESSE', text: 'Ils emmènent les enfants vers le nord. Les coffres du village brûlent déjà. Qu’allez-vous sauver ?', portrait: '/assets/portraits/marian.png', side: 'left', effects: [], choices: [
        { text: 'Sauver les habitants.', next: '2', effects: [{ type: 'setFlag', key: 'missionSuccess', value: true }, { type: 'addReputation', amount: 10 }, { type: 'startCombat', combatId: 'village_defense' }] },
        { text: 'Sécuriser les réserves.', next: '3', effects: [{ type: 'setFlag', key: 'missionSuccess', value: false }, { type: 'setFlag', key: 'missionGreed', value: true }, { type: 'addGold', amount: 200 }, { type: 'addReputation', amount: -10 }, { type: 'startCombat', combatId: 'village_raid' }] },
      ] },
      { id: '2', speaker: 'Villageoise de Bois-Clair', tag: 'BOIS-CLAIR', text: 'Merci ! Le vieux pont mène directement à leurs positions.', portrait: '/assets/portraits/marian.png', side: 'left', next: null, effects: [], choices: [] },
      { id: '3', speaker: 'Villageoise de Bois-Clair', tag: 'BOIS-CLAIR', text: 'Prenez l’or si vous le voulez... mais ne prétendez plus être nos protecteurs.', portrait: '/assets/portraits/marian.png', side: 'left', next: null, effects: [], choices: [] },
    ],
  },
  {
    id: 'mystery_recruit',
    steps: [
      { id: '1', speaker: 'Cedric', tag: 'ÉCLAIREUR NOMADE', text: 'Je connais les passages des Serpents. Cinquante pièces, et mon arc rejoint votre compagnie.', portrait: '/assets/portraits/kestrel.png', side: 'right', effects: [], choices: [
        { text: 'Recruter Cedric — 50 or', next: '2', requiresGold: 50, effects: [{ type: 'addGold', amount: -50 }, { type: 'recruitUnit', unitId: 'cedric' }, { type: 'addReputation', amount: 3 }] },
        { text: 'Décliner.', next: '3', effects: [] },
      ] },
      { id: '2', speaker: 'Cedric', tag: 'NOUVEL ALLIÉ', text: 'Marché conclu. Je vous montrerai où frapper.', portrait: '/assets/portraits/kestrel.png', side: 'right', next: null, effects: [], choices: [] },
      { id: '3', speaker: 'Cedric', tag: 'ÉCLAIREUR NOMADE', text: 'Alors évitez les lanternes vertes. Elles marquent leurs embuscades.', portrait: '/assets/portraits/kestrel.png', side: 'right', next: null, effects: [], choices: [] },
    ],
  },
  {
    id: 'mystery_help',
    steps: [
      { id: '1', speaker: 'Marchand blessé', tag: 'QUÊTE SECONDAIRE', text: 'Mon chariot est brisé et les loups approchent. Pouvez-vous partager quelques provisions ?', portrait: '▣', side: 'left', effects: [], choices: [
        { text: 'L’aider — 30 or', next: '2', requiresGold: 30, effects: [{ type: 'addGold', amount: -30 }, { type: 'addReputation', amount: 8 }, { type: 'setFlag', key: 'helpedMerchant', value: true }] },
        { text: 'Continuer la route.', next: '3', effects: [{ type: 'addReputation', amount: -2 }] },
      ] },
      { id: '2', speaker: 'Marchand blessé', tag: 'ALLIÉ', text: 'Je ferai parvenir des potions au refuge. Vous avez ma parole.', portrait: '▣', side: 'left', next: null, effects: [{ type: 'addItem', itemId: 'potion', quantity: 1 }], choices: [] },
      { id: '3', speaker: 'Marchand blessé', tag: 'ABANDONNÉ', text: 'Allez... Je trouverai bien une autre âme charitable.', portrait: '▣', side: 'left', next: null, effects: [], choices: [] },
    ],
  },
  {
    id: 'mystery_ambush',
    steps: [
      { id: '1', speaker: 'Pillard Serpent', tag: 'EMBUSCADE', text: 'Vous avez suivi exactement le chemin que nous avions préparé.', portrait: '/assets/portraits/kestrel.png', side: 'right', next: null, effects: [{ type: 'startCombat', combatId: 'forest_ambush' }], choices: [] },
    ],
  },
  {
    id: 'mystery_treasure',
    steps: [
      { id: '1', speaker: 'Coffre abandonné', tag: 'TRÉSOR', text: 'Sous les racines, vous découvrez une bourse intacte et une potion scellée.', portrait: '▣', side: 'center', next: null, effects: [{ type: 'addGold', amount: 100 }, { type: 'addItem', itemId: 'potion', quantity: 1 }], choices: [] },
    ],
  },
  {
    id: 'mystery_shrine',
    steps: [
      { id: '1', speaker: 'Autel ancien', tag: 'MYSTÈRE', text: 'Le sceau gravé dans la pierre réagit à votre présence. Une chaleur calme traverse la compagnie.', portrait: '✦', side: 'center', next: null, effects: [{ type: 'addReputation', amount: 4 }, { type: 'setFlag', key: 'shrineBlessing', value: true }], choices: [] },
    ],
  },
  {
    id: 'witnesses_on_road',
    steps: [
      { id: '1', speaker: 'Survivant de Bois-Clair', tag: 'TÉMOINS', text: 'Nous avons vu ce que vous avez choisi au village. Nos mots vous précéderont devant Alaric.', portrait: '/assets/portraits/marian.png', side: 'left', effects: [], choices: [
        { text: 'Protéger les témoins jusqu’au camp.', next: '2', requiresReputationMin: 45, blockedText: 'Ils refusent votre escorte.', effects: [{ type: 'addReputation', amount: 5 }, { type: 'setFlag', key: 'protectedWitnesses', value: true }] },
        { text: 'Acheter leur silence.', next: '3', requiresGold: 80, effects: [{ type: 'addGold', amount: -80 }, { type: 'addReputation', amount: -5 }, { type: 'setFlag', key: 'silencedWitnesses', value: true }] },
      ] },
      { id: '2', speaker: 'Survivant de Bois-Clair', tag: 'PAROLE SAUVÉE', text: 'Alors nous parlerons. Pas pour vous flatter, mais parce que la vérité doit survivre.', portrait: '/assets/portraits/marian.png', side: 'left', next: null, effects: [], choices: [] },
      { id: '3', speaker: 'Intendant Maelor', tag: 'SILENCE', text: 'La vérité coûte cher. Heureusement, le silence a un prix plus simple.', portrait: '/assets/portraits/marian.png', side: 'left', next: null, effects: [], choices: [] },
    ],
  },
  {
    id: 'shadow_signs',
    steps: [
      { id: '1', speaker: 'Conseillère Elara', tag: 'OMBRES SILENCIEUSES', text: 'Ces marques ne sont pas du Serpent. Quelqu’un guide leurs raids avec une magie ancienne.', portrait: '/assets/portraits/elara.png', side: 'left', effects: [], choices: [
        { text: 'Préserver les preuves pour Alaric.', next: '2', effects: [{ type: 'addReputation', amount: 5 }, { type: 'setFlag', key: 'shadowEvidence', value: true }] },
        { text: 'Briser l’autel et récupérer les fragments.', next: '3', effects: [{ type: 'addItem', itemId: 'iron_ore', quantity: 2 }, { type: 'addReputation', amount: -2 }, { type: 'setFlag', key: 'shadowFragments', value: true }] },
      ] },
      { id: '2', speaker: 'Conseillère Elara', tag: 'PREUVE', text: 'Avec ceci, Alaric verra que son conflit dépasse les frontières du Lion.', portrait: '/assets/portraits/elara.png', side: 'left', next: null, effects: [], choices: [] },
      { id: '3', speaker: 'Intendant Maelor', tag: 'ARTEFACT', text: 'La preuve convainc les chefs. Les fragments arment les survivants.', portrait: '/assets/portraits/marian.png', side: 'left', next: null, effects: [], choices: [] },
    ],
  },
  {
    id: 'lion_finale_judgement',
    steps: [
      { id: '1', speaker: 'Chef Alaric', tag: 'JUGEMENT DU LION', text: 'Bois-Clair porte votre réponse. Dites-moi maintenant comment votre clan réclame le Sceau du Lion.', portrait: '/assets/portraits/alistair.png', side: 'right', effects: [], choices: [
        { text: 'Présenter les survivants et les preuves.', next: '2', requiresFlag: 'missionSuccess', requiresReputationMin: 55, blockedText: 'Alaric exige plus que des paroles.', effects: [{ type: 'addReputation', amount: 8 }, { type: 'setFlag', key: 'lionSealHonour', value: true }, { type: 'startCombat', combatId: 'serpent_captain' }] },
        { text: 'Demander l’épreuve du Lion.', next: '3', effects: [{ type: 'addReputation', amount: -6 }, { type: 'setFlag', key: 'lionTrialRequested', value: true }, { type: 'startCombat', combatId: 'lion_chief' }] },
      ] },
      { id: '2', speaker: 'Chef Alaric', tag: 'RESPECT', text: 'Alors le Lion vous reconnaît. Mais le capitaine Serpent fuit avec un artefact des Ombres. Finissez ce que vous avez commencé.', portrait: '/assets/portraits/alistair.png', side: 'right', next: null, effects: [], choices: [] },
      { id: '3', speaker: 'Chef Alaric', tag: 'DÉFI', text: 'Vous demandez le Sceau sans être certain que l’honneur vous le donne. Alors prenez-le si votre lame le mérite.', portrait: '/assets/portraits/alistair.png', side: 'right', next: null, effects: [], choices: [] },
    ],
  },
  {
    id: 'finale',
    steps: [
      { id: '1', speaker: 'Chef Alaric', tag: 'JUGEMENT', text: 'Vos actes à Bois-Clair parlent plus fort que votre serment. Approchez et recevez mon jugement.', portrait: '/assets/portraits/alistair.png', side: 'right', next: null, effects: [], choices: [] },
    ],
  },
  {
    id: 'epilogue',
    steps: [
      { id: '1', speaker: 'Chroniqueur', tag: 'ÉPILOGUE', text: 'Le premier Sceau répond enfin à l’appel. Mais au-delà des montagnes, le Serpent rassemble déjà ses armées, et les Ombres connaissent votre nom.', portrait: '✦', side: 'center', next: null, effects: [{ type: 'finishChapter', endingId: 'lion-seal' }], choices: [] },
    ],
  },
];

export const campaignNodes = rawNodes.map((node) => campaignNodeSchema.parse(node));
export const combatConfigs = new Map(rawCombats.map((combat) => {
  const parsed = combatConfigSchema.parse(combat);
  return [parsed.id, parsed];
}));
export const dialogues = new Map(rawDialogues.map((dialogue) => {
  const parsed = dialogueSequenceSchema.parse(dialogue);
  return [parsed.id, parsed];
}));

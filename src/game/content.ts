import {
  campaignNodeSchema,
  combatConfigSchema,
  dialogueSequenceSchema,
  mysteryEventSchema,
  type CampaignNode,
  type CombatConfig,
  type DialogueSequence,
  type MysteryEvent,
} from './types';

const rawNodes: CampaignNode[] = [
  { id: 'camp', type: 'start', x: -7, z: 0, icon: '🚩', label: 'Camp du Lion', links: ['lion'], dialogueId: 'lion_intro' },
  { id: 'lion', type: 'story', x: -4.8, z: 0.4, icon: '🦁', label: 'Serment du Lion', links: ['mystery-a'], dialogueId: 'lion_oath' },
  { id: 'mystery-a', type: 'mystery', x: -2.7, z: 1.25, icon: '?', label: 'Sentier voilé', links: ['village', 'random-a'], mysteryPoolId: 'forest' },
  { id: 'village', type: 'story', x: -0.5, z: 0.25, icon: '⌂', label: 'Valmir', links: ['valmir-market', 'village-battle'], dialogueId: 'village_choice' },
  { id: 'valmir-market', type: 'shop', x: 0.65, z: -0.7, icon: '¤', label: 'Marché de Valmir', links: ['village-battle'], shopId: 'valmir' },
  { id: 'village-battle', type: 'story-combat', x: 1.7, z: 0.7, icon: '⚔', label: 'Lisière assiégée', links: ['mystery-b'], combatId: 'village_defense' },
  { id: 'random-a', type: 'random-combat', x: -0.3, z: 2.35, icon: '⚔', label: 'Patrouilles Serpents', links: ['village'], combatId: 'forest_patrol' },
  { id: 'mystery-b', type: 'mystery', x: 3.8, z: 1.45, icon: '?', label: 'Ruines anciennes', links: ['finale'], mysteryPoolId: 'forest' },
  { id: 'finale', type: 'boss', x: 5.8, z: 0.2, icon: '♛', label: 'Porte du Sceau', links: ['end'], dialogueId: 'finale' },
  { id: 'end', type: 'end', x: 7.6, z: 0, icon: '✦', label: 'Le Sceau du Lion', links: [], dialogueId: 'epilogue' },
];

const rawCombats: CombatConfig[] = [
  { id: 'village_defense', objective: 'Repoussez les pillards et protégez Valmir.', encounterLabel: 'Défense de Valmir', maxPlayerUnits: 5, rewards: { gold: 140, reputation: 10 } },
  { id: 'village_raid', objective: 'Éliminez les témoins et sécurisez les coffres.', encounterLabel: 'Raid sur Valmir', maxPlayerUnits: 4, rewards: { gold: 300, reputation: -15 } },
  { id: 'forest_patrol', objective: 'Éliminez la patrouille Serpent avant qu’elle ne donne l’alerte.', encounterLabel: 'Patrouille Serpent', maxPlayerUnits: 4, rewards: { gold: 90, reputation: 2 } },
  { id: 'forest_ambush', objective: 'Survivez à l’embuscade dans le sous-bois.', encounterLabel: 'Embuscade', maxPlayerUnits: 3, rewards: { gold: 75, reputation: 4 } },
  { id: 'lion_chief', objective: 'Survivez à la colère du Chef du Lion.', encounterLabel: 'Duel pour le Sceau', maxPlayerUnits: 3, rewards: { gold: 0, reputation: 0 } },
];

const rawDialogues: DialogueSequence[] = [
  {
    id: 'lion_intro',
    steps: [
      { id: '1', speaker: 'Intendant Maelor', tag: 'CLAN DU LION', text: 'Les éclaireurs confirment que les Serpents marchent sur Valmir. Le Chef vous attend.', portrait: '/assets/portraits/marian.png', side: 'left', next: '2', effects: [], choices: [] },
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
    id: 'village_choice',
    steps: [
      { id: '1', speaker: 'Villageoise de Valmir', tag: 'EN DÉTRESSE', text: 'Ils emmènent les enfants vers le nord. Les coffres du village brûlent déjà. Qu’allez-vous sauver ?', portrait: '/assets/portraits/marian.png', side: 'left', effects: [], choices: [
        { text: 'Sauver les habitants.', next: '2', effects: [{ type: 'setFlag', key: 'missionSuccess', value: true }, { type: 'addReputation', amount: 10 }, { type: 'startCombat', combatId: 'village_defense' }] },
        { text: 'Sécuriser les réserves.', next: '3', effects: [{ type: 'setFlag', key: 'missionSuccess', value: false }, { type: 'addGold', amount: 200 }, { type: 'addReputation', amount: -10 }, { type: 'startCombat', combatId: 'village_raid' }] },
      ] },
      { id: '2', speaker: 'Villageoise de Valmir', tag: 'VALMIR', text: 'Merci ! Le vieux pont mène directement à leurs positions.', portrait: '/assets/portraits/marian.png', side: 'left', next: null, effects: [], choices: [] },
      { id: '3', speaker: 'Villageoise de Valmir', tag: 'VALMIR', text: 'Prenez l’or si vous le voulez… mais ne prétendez plus être nos protecteurs.', portrait: '/assets/portraits/marian.png', side: 'left', next: null, effects: [], choices: [] },
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
      { id: '1', speaker: 'Marchand blessé', tag: 'QUÊTE SECONDAIRE', text: 'Mon chariot est brisé et les loups approchent. Pouvez-vous partager quelques provisions ?', portrait: '🛒', side: 'left', effects: [], choices: [
        { text: 'L’aider — 30 or', next: '2', requiresGold: 30, effects: [{ type: 'addGold', amount: -30 }, { type: 'addReputation', amount: 8 }, { type: 'setFlag', key: 'helpedMerchant', value: true }] },
        { text: 'Continuer la route.', next: '3', effects: [{ type: 'addReputation', amount: -2 }] },
      ] },
      { id: '2', speaker: 'Marchand blessé', tag: 'ALLIÉ', text: 'Je ferai parvenir des potions à Valmir. Vous avez ma parole.', portrait: '🛒', side: 'left', next: null, effects: [{ type: 'addItem', itemId: 'potion', quantity: 1 }], choices: [] },
      { id: '3', speaker: 'Marchand blessé', tag: 'ABANDONNÉ', text: 'Allez… Je trouverai bien une autre âme charitable.', portrait: '🛒', side: 'left', next: null, effects: [], choices: [] },
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
      { id: '1', speaker: 'Coffre abandonné', tag: 'TRÉSOR', text: 'Sous les racines, vous découvrez une bourse intacte et une potion scellée.', portrait: '🎁', side: 'center', next: null, effects: [{ type: 'addGold', amount: 100 }, { type: 'addItem', itemId: 'potion', quantity: 1 }], choices: [] },
    ],
  },
  {
    id: 'mystery_shrine',
    steps: [
      { id: '1', speaker: 'Autel ancien', tag: 'MYSTÈRE', text: 'Le sceau gravé dans la pierre réagit à votre présence. Une chaleur calme traverse la compagnie.', portrait: '✨', side: 'center', next: null, effects: [{ type: 'addReputation', amount: 4 }, { type: 'setFlag', key: 'shrineBlessing', value: true }], choices: [] },
    ],
  },
  {
    id: 'finale',
    steps: [
      { id: '1', speaker: 'Chef Alaric', tag: 'JUGEMENT', text: 'Vos actes à Valmir parlent plus fort que votre serment. Approchez et recevez mon jugement.', portrait: '/assets/portraits/alistair.png', side: 'right', next: null, effects: [], choices: [] },
    ],
  },
  {
    id: 'epilogue',
    steps: [
      { id: '1', speaker: 'Chroniqueur', tag: 'ÉPILOGUE', text: 'Le premier Sceau répond enfin à l’appel. Mais, au-delà des montagnes, le Serpent rassemble déjà ses armées.', portrait: '✦', side: 'center', next: null, effects: [{ type: 'finishChapter', endingId: 'lion-seal' }], choices: [] },
    ],
  },
];

const rawMysteries: MysteryEvent[] = [
  { id: 'recruit', dialogueId: 'mystery_recruit', weight: 2, unique: true },
  { id: 'help', dialogueId: 'mystery_help', weight: 3, unique: true },
  { id: 'ambush', dialogueId: 'mystery_ambush', weight: 2, unique: false },
  { id: 'treasure', dialogueId: 'mystery_treasure', weight: 2, unique: true },
  { id: 'shrine', dialogueId: 'mystery_shrine', weight: 1, unique: true },
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
export const mysteryPools = new Map<string, MysteryEvent[]>([
  ['forest', rawMysteries.map((event) => mysteryEventSchema.parse(event))],
]);

type DialogueSide = 'left' | 'right' | 'center' | 'none';

function line(
  id: string,
  speaker: string,
  actorId: string,
  expression: string,
  tag: string,
  text: string,
  next: string | null,
  side: DialogueSide = 'left',
) {
  return { id, speaker, actorId, expression, tag, text, side, next, effects: [], choices: [] };
}

/**
 * R5 expands the Lion chapter through the existing dialogue and combat hooks.
 * These are authored content sequences, not a second dialogue resolver.
 */
export const R5_ADDITIONAL_DIALOGUES = [
  {
    id: 'pre_opening_trail',
    sceneArtId: 'forest_fork',
    steps: [
      line('1', 'Kestrel', 'kestrel', 'stern', 'Première piste', 'À peine sortis du camp, les traces se multiplient : sabots affolés, griffes, branches brisées. Les Serpents ont chassé les bêtes vers la route pour que la forêt fasse leur travail à leur place.', '2'),
      line('2', 'Alistair', 'alistair', 'stern', 'Bannière déchue', 'Autrefois, nos éclaireurs auraient nettoyé cette piste avant le passage de la bannière. Aujourd’hui, nous sommes les éclaireurs, l’avant-garde et ce qu’il reste du clan. Alors personne ne recule.', '3'),
      line('3', 'Sage Séraphine', 'sage_seraphine', 'mystical', 'Premier pas', 'Le premier combat ne rendra pas notre nom. Il dira seulement si nous avons encore la force d’avancer. Tenez la ligne, puis souvenez-vous pourquoi Bois-Clair nous attend.', null),
    ],
  },
  {
    id: 'post_opening_trail',
    sceneArtId: 'forest_fork',
    steps: [
      line('1', 'Kestrel', 'kestrel', 'neutral', 'Piste rouverte', 'La meute se disperse et la forêt retrouve son silence. Sous les feuilles, je vois des liens de cuir coupés au couteau : quelqu’un a bien conduit ces bêtes jusqu’à nous.', '2'),
      line('2', 'Alistair', 'alistair', 'stern', 'Première victoire', 'Nos couleurs ont tenu. Ce n’est qu’une piste gagnée, mais chaque membre de la compagnie vient de voir que le clan tombé sait encore former une ligne.', '3'),
      line('3', 'Intendant Maelor', 'maelor', 'neutral', 'La dette continue', 'Ramassez ce qui peut servir et repartons. Une victoire devient vite un luxe si elle nous fait oublier l’incendie au bout de la route.', null),
    ],
  },
  {
    id: 'pre_valmir_road',
    sceneArtId: 'forest_fork',
    steps: [
      line('1', 'Kestrel', 'kestrel', 'stern', 'Route coupée', 'La fumée de Bois-Clair passe maintenant au-dessus des pins. Entre elle et nous, la chaussée est ravagée : bêtes paniquées, chariots renversés et traces Serpent sur chaque talus.', '2'),
      line('2', 'Marian', 'marian', 'fearful', 'Trop proche', 'J’entends des cloches derrière le vent. Elles ne sonnent pas l’office ; elles appellent les habitants aux murs. Chaque minute perdue ici leur coûte une porte, une maison ou une vie.', '3'),
      line('3', 'Intendant Maelor', 'maelor', 'stern', 'Passage forcé', 'Alors nous ne cherchons pas une route parfaite. Nous ouvrons celle-ci. Gardez les remèdes pour ceux qui tomberont, brisez ce qui bloque le passage, et ne laissez rien nous retenir après.', null),
    ],
  },
  {
    id: 'post_valmir_road',
    sceneArtId: 'forest_fork',
    steps: [
      line('1', 'Marian', 'marian', 'neutral', 'Après le fracas', 'Les blessés respirent encore. J’ai pansé ce qui pouvait l’être, mais la fumée s’épaissit. Bois-Clair n’est plus une mission racontée dans une salle : le village est juste derrière cette crête.', '2'),
      line('2', 'Kestrel', 'kestrel', 'stern', 'Signes du siège', 'Des patrouilles Serpent convergent vers le même point. Elles ne pillent pas au hasard ; elles isolent les sorties, poussent les habitants vers le nord et gardent les réserves au sud.', '3'),
      line('3', 'Sage Séraphine', 'sage_seraphine', 'mystical', 'Choix à venir', 'Ils préparent un choix cruel avant même notre arrivée. Marchons avec les yeux ouverts : bientôt, sauver une chose exigera peut-être d’en abandonner une autre.', null),
    ],
  },
  {
    id: 'pre_serpent_patrol',
    sceneArtId: 'forest_fork',
    steps: [
      line('1', 'Kestrel', 'kestrel', 'stern', 'Patrouille en vue', 'Trois Serpents fouillent la route et marquent les arbres pour la troupe suivante. S’ils atteignent leur cor, tout le secteur saura où nous sommes.', '2'),
      line('2', 'Alistair', 'alistair', 'stern', 'Interception', 'Nous les arrêtons ici. Pas pour la gloire : pour que les familles derrière nous gagnent quelques heures sans chasseurs sur leurs traces.', null),
    ],
  },
  {
    id: 'post_serpent_patrol',
    sceneArtId: 'forest_fork',
    steps: [
      line('1', 'Kestrel', 'kestrel', 'neutral', 'Cor silencieux', 'Aucun signal n’est parti. Leurs cartes montrent toutefois des cercles autour de Bois-Clair ; le siège est plus organisé que ne le prétendait le rapport d’Alaric.', '2'),
      line('2', 'Sage Séraphine', 'sage_seraphine', 'stern', 'Temps gagné', 'Alors que ce silence serve aux vivants. Les Serpents remplaceront cette patrouille, mais pas avant que nous ayons repris de l’avance.', null),
    ],
  },
  {
    id: 'pre_spider_nest',
    sceneArtId: 'forest_fork',
    steps: [
      line('1', 'Elara', 'elara', 'mystical', 'Toiles sur la piste', 'La forêt entière vibre sous ces fils. Les Serpents ont jeté des carcasses près du sentier, puis laissé le venin fermer la route à leur place.', '2'),
      line('2', 'Marian', 'marian', 'stern', 'Nid condamné', 'Si nous contournons, les réfugiés tomberont ici après nous. Brûlons le nid sans embraser les pins, et gardez vos distances quand les poches de venin éclateront.', null),
    ],
  },
  {
    id: 'post_spider_nest',
    sceneArtId: 'forest_fork',
    steps: [
      line('1', 'Elara', 'elara', 'neutral', 'Fils rompus', 'Le cœur du nid est détruit. Les petites toiles se relâchent déjà ; avec quelques lames, les prochains voyageurs pourront suivre notre passage.', '2'),
      line('2', 'Intendant Maelor', 'maelor', 'neutral', 'Route utile', 'Une menace de moins derrière nous vaut presque une escorte. Prenez les glandes intactes, marquez le détour sûr, puis reprenons la marche.', null),
    ],
  },
  {
    id: 'pre_serpent_reprisals',
    sceneArtId: 'forest_fork',
    steps: [
      line('1', 'Caporal Serpent', 'serpent_raider', 'hostile', 'Dette de sang', 'La route parle de vous : des ordres contrariés, des hommes humiliés, des biens rendus à ceux que nous avions déjà dépouillés. Le général réclame un exemple.', '2', 'right'),
      line('2', 'Alistair', 'alistair', 'stern', 'Réponse', 'Vous vouliez une bannière à clouer aux arbres. Approchez et découvrez si un clan déchu est vraiment une proie plus facile.', null),
    ],
  },
  {
    id: 'post_serpent_reprisals',
    sceneArtId: 'forest_fork',
    steps: [
      line('1', 'Alistair', 'alistair', 'stern', 'Exemple refusé', 'Ils étaient venus punir la compagnie. Ils repartent en laissant leurs armes et la preuve que le général commence à nous craindre.', '2'),
      line('2', 'Kestrel', 'kestrel', 'neutral', 'Poursuite', 'Les survivants fuient vers Bois-Clair. Ils annonceront notre victoire, mais aussi notre position. Nous devons transformer leur peur en avance.', null),
    ],
  },
  {
    id: 'pre_serpent_checkpoint',
    sceneArtId: 'forest_fork',
    steps: [
      line('1', 'Kestrel', 'kestrel', 'stern', 'Barrage', 'Pieux, boucliers et deux coureurs prêts à partir. Ce poste ne protège rien : il empêche les secours d’atteindre Bois-Clair.', '2'),
      line('2', 'Intendant Maelor', 'maelor', 'stern', 'Aucun messager', 'Brisez le centre avant que les coureurs ne gagnent les bois. Si le général ignore combien nous sommes, notre prochaine décision restera la nôtre.', null),
    ],
  },
  {
    id: 'post_serpent_checkpoint',
    sceneArtId: 'forest_fork',
    steps: [
      line('1', 'Kestrel', 'kestrel', 'neutral', 'Barrage ouvert', 'Les coureurs n’ont pas franchi la lisière. Derrière les pieux, leurs ordres divisent Bois-Clair en deux objectifs : captifs au nord, réserves au sud.', '2'),
      line('2', 'Sage Séraphine', 'sage_seraphine', 'stern', 'Piège dévoilé', 'Voilà le vrai barrage : nous forcer à mesurer des vies contre la survie du clan. La route est ouverte, mais l’épreuve commence seulement.', null),
    ],
  },
  {
    id: 'pre_ruins_guardians',
    sceneArtId: 'shadow_signs',
    steps: [
      line('1', 'Elara', 'elara', 'mystical', 'Ruines troublées', 'Ces créatures ne nichent pas ensemble d’ordinaire. Une pulsation sous les pierres les attire, comme si les ruines donnaient un même ordre à des instincts différents.', '2'),
      line('2', 'Sage Séraphine', 'sage_seraphine', 'stern', 'Passage ancien', 'Nous devons traverser sans détruire les marques gravées. Elles appartiennent peut-être au secret que les Serpents tentent de transporter jusqu’au Sceau.', null),
    ],
  },
  {
    id: 'post_ruins_guardians',
    sceneArtId: 'shadow_signs',
    steps: [
      line('1', 'Elara', 'elara', 'mystical', 'Silence imparfait', 'Les gardiens sont tombés, mais la pulsation demeure. Elle ne venait pas d’eux ; ils n’étaient que les animaux pris dans son courant.', '2'),
      line('2', 'Sage Séraphine', 'sage_seraphine', 'stern', 'Trace des Ombres', 'Ne touchez plus aux pierres avant mon signal. Au-delà de cette salle, nous trouverons peut-être une preuve — ou un piège conçu pour ressembler à une preuve.', null),
    ],
  },
  {
    id: 'post_serpent_hunters',
    sceneArtId: 'mystery_ambush',
    steps: [
      line('1', 'Oracle Serpent', 'serpent_oracle', 'fearful', 'Témoin vivant', 'Ils ne s’arrêteront pas. Le général préfère brûler une route entière plutôt que laisser un seul de ses oracles parler devant le Lion.', '2', 'right'),
      line('2', 'Sage Séraphine', 'sage_seraphine', 'stern', 'Parole gardée', 'Alors nous ferons de votre survie une défaite durable. Restez au centre de la compagnie ; votre témoignage doit atteindre le camp, pas seulement la prochaine embuscade.', null),
    ],
  },
  {
    id: 'post_serpent_duelist_trial',
    sceneArtId: 'serpent_duelist_trial',
    steps: [
      line('1', 'Duelliste Serpent', 'serpent_duelist_elite', 'wounded', 'Masque brisé', 'Le général disait que les clans tombés cherchaient seulement une belle manière de mourir. Vous cherchez donc encore quelque chose à reconstruire.', '2', 'right'),
      line('2', 'Alistair', 'alistair', 'stern', 'Route gagnée', 'Nous reconstruisons en avançant. Garde ta vie et porte-lui cette réponse : la prochaine lame qu’il envoie trouvera la compagnie plus près de lui.', null),
    ],
  },
  {
    id: 'post_troll_crossing',
    sceneArtId: 'mystery_troll_crossing',
    steps: [
      line('1', 'Marian', 'marian', 'neutral', 'Pont libéré', 'Le troll respire encore, mais il ne gardera plus ce passage aujourd’hui. Les sacs volés portent les noms de familles de Bois-Clair.', '2'),
      line('2', 'Intendant Maelor', 'maelor', 'neutral', 'Biens marqués', 'Nous emportons ce qui peut sauver la compagnie et nous rendrons le reste au premier convoi sûr. Même le butin a une histoire ; mieux vaut savoir laquelle.', null),
    ],
  },
  {
    id: 'post_young_dragon_roost',
    sceneArtId: 'mystery_dragon_roost',
    steps: [
      line('1', 'Elara', 'elara', 'mystical', 'Écailles et cendres', 'La bête s’éloigne, blessée, et le nid cesse de luire. Sous les gemmes, les mêmes veines sombres que dans les ruines courent à travers la roche.', '2'),
      line('2', 'Sage Séraphine', 'sage_seraphine', 'stern', 'Résonance', 'Ce combat n’était pas isolé. Quelque chose trouble les créatures autour du Sceau. Prenez les gemmes promises, mais ne confondez pas récompense et réponse.', null),
    ],
  },
  {
    id: 'ate_first_refuge_watch',
    title: 'ATE — La première veille',
    sceneArtId: 'lion_briefing',
    steps: [
      line('1', 'Marian', 'marian', 'neutral', 'Après le refuge', 'Les feux sont bas. Derrière les palissades, les voyageurs échangent déjà des récits sur notre passage. Certains prononcent le nom du clan avec gratitude ; d’autres comptent ce que notre marche leur a coûté.', '2'),
      line('2', 'Alistair', 'alistair', 'stern', 'Nom à reconstruire', 'Notre ancienne bannière faisait taire une salle. Celle-ci doit apprendre à mériter chaque regard. Si nous voulons un avenir, il se bâtira avec les témoins ordinaires de cette route.', '3'),
      line('3', 'Kestrel', 'kestrel', 'neutral', 'Relève', 'Les Serpents testent le mur oriental, sans attaquer. Ils savent que nous sommes ici et veulent mesurer combien de temps nous nous accordons.', '4'),
      line('4', 'Intendant Maelor', 'maelor', 'stern', 'Départ avant l’aube', 'Alors dormez par tours. Au matin, nous laissons derrière nous un refuge plus sûr et devant nous une dette plus urgente : atteindre Bois-Clair avant la seconde fumée.', null),
    ],
  },
  {
    id: 'ate_bois_clair_night_watch',
    title: 'ATE — Les braises de Bois-Clair',
    sceneArtId: 'village_choice',
    steps: [
      line('1', 'Villageoise de Bois-Clair', 'villageoise', 'wounded', 'Après Bois-Clair', 'La nuit est tombée, mais personne ne dort. Les survivants dressent des listes : maisons perdues, familles retrouvées, réserves intactes ou dispersées. Votre décision est écrite entre chaque nom.', '2'),
      line('2', 'Marian', 'marian', 'neutral', 'Ce qui demeure', 'Je peux fermer les blessures. Je ne peux pas décider à la place de ceux qui devront vivre avec ce matin. Ils se souviendront de ce que nous avons protégé — et de ce que nous avons laissé brûler.', '3'),
      line('3', 'Alistair', 'alistair', 'stern', 'Devant la bannière', 'Le clan aussi devra vivre avec ce choix. Reconstruire un nom ne signifie pas effacer sa route ; cela signifie pouvoir la raconter sans détour quand Alaric demandera le prix du Sceau.', '4'),
      line('4', 'Intendant Maelor', 'maelor', 'neutral', 'Aube suivante', 'Les comptes sont faits. Rien de ce que nous dirons demain ne changera cette nuit. Reprenons la marche avec les vivants, les absents et les conséquences à nos côtés.', null),
    ],
  },
  {
    id: 'rep_event_refuge_supply_offer',
    title: 'Les réserves rendues',
    sceneArtId: 'lion_briefing',
    steps: [
      {
        id: '1', speaker: 'Quartier-maître du refuge', actorId: 'survivor', expression: 'neutral', tag: 'Réponse publique',
        text: 'Votre bannière a fait parler sur la route. Le refuge peut vous céder une caisse de remèdes à prix réduit, ou l’envoyer aux familles qui arriveront derrière vous. Votre réponse sera connue avant l’aube.', side: 'left', effects: [],
        choices: [
          { text: 'Acheter la caisse de remèdes — 25 or.', next: '2', requiresGold: 25, effects: [{ type: 'addGold', amount: -25 }, { type: 'addItem', itemId: 'potion', quantity: 1 }, { type: 'setFlag', key: 'r5BoughtRefugeSupplies', value: true }], outcomePreview: { mode: 'exact', hints: ['25 or', '1 potion'] } },
          { text: 'Laisser la caisse aux familles suivantes.', next: '3', effects: [{ type: 'addReputation', amount: 2 }, { type: 'setFlag', key: 'r5LeftRefugeSupplies', value: true }], outcomePreview: { mode: 'soft', hints: ['Soutien public', 'Les voyageurs en profiteront'] } },
        ],
      },
      line('2', 'Quartier-maître du refuge', 'survivor', 'neutral', 'Marché honnête', 'La caisse est à vous. Ce n’est pas un hommage, seulement un prix accordé à une compagnie dont le passage mérite encore d’être observé.', null),
      line('3', 'Quartier-maître du refuge', 'survivor', 'grateful', 'Réserve transmise', 'Je garderai votre nom sur la caisse. Les familles sauront qui a choisi de leur laisser une chance de plus sur la route.', null),
    ],
  },
  {
    id: 'rep_event_serpent_rumour_market',
    title: 'Le prix d’une rumeur',
    sceneArtId: 'mystery_help',
    steps: [
      {
        id: '1', speaker: 'Colporteuse', actorId: 'survivor', expression: 'neutral', tag: 'Rumeur publique',
        text: 'Je vends ce que les routes savent : horaires de patrouille, noms de passeurs, mensonges répétés dans les tavernes. Vingt pièces pour écouter, ou une vérité de votre compagnie en échange.', side: 'left', effects: [],
        choices: [
          { text: 'Payer la rumeur — 20 or.', next: '2', requiresGold: 20, effects: [{ type: 'addGold', amount: -20 }, { type: 'setFlag', key: 'r5BoughtSerpentRumour', value: true }], outcomePreview: { mode: 'exact', hints: ['20 or', 'Information de route'] } },
          { text: 'Raconter publiquement la chute du clan.', next: '3', effects: [{ type: 'addReputation', amount: 1 }, { type: 'setFlag', key: 'r5SharedClanFall', value: true }], outcomePreview: { mode: 'soft', hints: ['Votre histoire circule', 'Aucun fait du Lion ne change'] } },
        ],
      },
      line('2', 'Colporteuse', 'survivor', 'stern', 'Information achetée', 'Le général Serpent déplace ses messagers par paires et brûle leurs ordres après lecture. Ce n’est pas une preuve, mais c’est le comportement d’un homme qui cache plus qu’un siège.', null),
      line('3', 'Colporteuse', 'survivor', 'neutral', 'Histoire échangée', 'Un héritier sans terre qui raconte sa propre défaite : voilà une histoire que les tavernes répéteront. En retour, retenez ceci — les Serpents craignent qu’on lise leurs ordres.', null),
    ],
  },
  {
    id: 'rep_event_fallen_banner_claimant',
    title: 'Un nom à prêter',
    sceneArtId: 'lion_finale_judgement',
    steps: [
      {
        id: '1', speaker: 'Émissaire sans fief', actorId: 'survivor', expression: 'neutral', tag: 'Approche politique',
        text: 'Votre nom remonte dans les conversations. Mon maître peut déclarer publiquement qu’il vous a toujours soutenus. En échange, il veut que votre première proclamation après le Sceau cite sa maison.', side: 'right', effects: [],
        choices: [
          { text: 'Accepter ce soutien public.', next: '2', effects: [{ type: 'addReputation', amount: 2 }, { type: 'setFlag', key: 'r5AcceptedPoliticalSponsor', value: true }], outcomePreview: { mode: 'soft', hints: ['Soutien politique', 'Promesse sociale publique'] } },
          { text: 'Refuser de prêter la chute du clan.', next: '3', effects: [{ type: 'setFlag', key: 'r5RefusedPoliticalSponsor', value: true }], outcomePreview: { mode: 'soft', hints: ['Indépendance préservée', 'Aucun effet sur le verdict du Lion'] } },
        ],
      },
      line('2', 'Émissaire sans fief', 'survivor', 'grateful', 'Alliance annoncée', 'Alors les bonnes personnes apprendront dès ce soir que votre retour n’est pas solitaire. Les anciennes amitiés sont souvent découvertes juste avant une victoire.', null, 'right'),
      line('3', 'Intendant Maelor', 'maelor', 'stern', 'Nom gardé', 'Il voulait acheter une place dans notre relèvement au prix d’une phrase. Nous aurons peut-être besoin d’alliés, mais pas de nouveaux propriétaires.', null),
    ],
  },
  {
    id: 'rep_event_village_memorial_request',
    title: 'Les noms de Bois-Clair',
    sceneArtId: 'village_choice',
    steps: [
      {
        id: '1', speaker: 'Ancienne de Bois-Clair', actorId: 'refugee_mother', expression: 'stern', tag: 'Mémoire publique',
        text: 'Bois-Clair tiendra, mais les noms des morts se perdent déjà entre les rapports. Portez cette liste jusqu’au camp du Lion, ou laissez-nous garder notre deuil loin de votre bannière.', side: 'left', effects: [],
        choices: [
          { text: 'Porter les noms et demander leur lecture.', next: '2', effects: [{ type: 'addReputation', amount: 2 }, { type: 'setFlag', key: 'r5CarriedBoisClairNames', value: true }], outcomePreview: { mode: 'soft', hints: ['Geste mémoriel public', 'Le verdict reste fondé sur les faits'] } },
          { text: 'Financer un mémorial local — 35 or.', next: '3', requiresGold: 35, effects: [{ type: 'addGold', amount: -35 }, { type: 'addReputation', amount: 1 }, { type: 'setFlag', key: 'r5FundedBoisClairMemorial', value: true }], outcomePreview: { mode: 'exact', hints: ['35 or', 'Mémoire laissée au village'] } },
        ],
      },
      line('2', 'Ancienne de Bois-Clair', 'refugee_mother', 'grateful', 'Liste confiée', 'Lisez-les sans transformer leur mort en argument. S’ils entrent avec vous dans la salle du Lion, que ce soit comme des personnes, pas comme une monnaie.', null),
      line('3', 'Ancienne de Bois-Clair', 'refugee_mother', 'neutral', 'Pierre locale', 'Nous graverons les noms ici, là où chacun connaît leur voix. Votre or paiera la pierre ; notre mémoire fera le reste.', null),
    ],
  },
  {
    id: 'rep_event_displaced_family_demand',
    title: 'Ceux laissés derrière',
    sceneArtId: 'refugee_trial',
    steps: [
      {
        id: '1', speaker: 'Père déplacé', actorId: 'survivor', expression: 'stern', tag: 'Conséquence sociale',
        text: 'Des familles disent que votre compagnie avait les moyens d’aider, mais qu’elle a choisi sa bourse ou sa marche. Je ne demande pas que vous réécriviez la route. Je demande ce que vous faites maintenant.', side: 'right', effects: [],
        choices: [
          { text: 'Verser 30 or au convoi déplacé.', next: '2', requiresGold: 30, effects: [{ type: 'addGold', amount: -30 }, { type: 'addReputation', amount: 1 }, { type: 'setFlag', key: 'r5PaidDisplacedFamilies', value: true }], outcomePreview: { mode: 'exact', hints: ['30 or', 'Réponse sociale limitée'] } },
          { text: 'Reconnaître le refus sans acheter l’oubli.', next: '3', effects: [{ type: 'setFlag', key: 'r5AcknowledgedDisplacedFamilies', value: true }], outcomePreview: { mode: 'soft', hints: ['Le fait historique demeure', 'Aucune récompense morale'] } },
        ],
      },
      line('2', 'Père déplacé', 'survivor', 'neutral', 'Aide présente', 'Cet or nourrira le prochain convoi. Il répond à ce soir, pas à hier. Au moins, personne ici ne prétendra que les deux sont la même chose.', null, 'right'),
      line('3', 'Père déplacé', 'survivor', 'stern', 'Réponse gardée', 'Je préfère une vérité dure à une excuse achetée. Nous raconterons que vous avez regardé votre décision en face, sans dire qu’elle fut réparée.', null, 'right'),
    ],
  },
] as const;

export type R5ChoiceClass = 'A' | 'B' | 'C';

/** New meaningful R5 choices are social consequences; none alter Lion Conduct. */
export const R5_MEANINGFUL_CHOICE_CLASSIFICATIONS = [
  { dialogueId: 'rep_event_refuge_supply_offer', stepId: '1', class: 'B', rationale: 'Public allocation of limited refuge supplies.' },
  { dialogueId: 'rep_event_serpent_rumour_market', stepId: '1', class: 'B', rationale: 'Social information exchange with no Lion fact.' },
  { dialogueId: 'rep_event_fallen_banner_claimant', stepId: '1', class: 'B', rationale: 'Political sponsorship and public independence.' },
  { dialogueId: 'rep_event_village_memorial_request', stepId: '1', class: 'B', rationale: 'Public memorial response after the decisive village fact.' },
  { dialogueId: 'rep_event_displaced_family_demand', stepId: '1', class: 'B', rationale: 'Social response that explicitly cannot rewrite history.' },
] as const satisfies readonly {
  dialogueId: string;
  stepId: string;
  class: R5ChoiceClass;
  rationale: string;
}[];

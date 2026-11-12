# Mise en scène des images de l’Ours — brouillon à valider (2026-11-12)

Statut : **PROPOSITION**, à valider par l’opérateur avant toute régénération (OD-2026-11-11-F, F1). Rien n’est intégré au jeu.

## Pourquoi

Le lot de l’Ours (42 images, `tmp/final-images/`) respecte les visages couverts et les signes de clan. En revanche, presque tous les décors montrent la même place enneigée, de nuit, avec bannières et braseros. Les scènes souterraines et la salle de Borin sont dessinées en extérieur. Quatre causes, toutes dans l’outil :

1. **Fiche trop courte.** Chaque fiche de décor tient en une ligne de sujet.
2. **Phrase de décor commune.** Toutes les fiches de l’Ours reçoivent la même phrase (« cols enneigés, avant-postes de pierre, galeries de mines sacrées et filon sombre »), donc chaque image empile tout cela.
3. **Mêmes références, de nuit.** Toutes les fiches ont les deux mêmes références, dont les ruines de l’Ombre, de nuit sous la lune.
4. **Bannières partout.** La règle d’héraldique parle de bannières, et le modèle en met partout.

## Ce que change l’outil

- **Une ligne de mise en scène par décor.** Elle dit le lieu (extérieur, intérieur ou souterrain), la lumière, ce qu’on voit et ce qu’on évite. Elle est tirée des répliques. La phrase de décor commune ne s’applique plus aux décors.
- **Références choisies selon la lumière**, parmi les tableaux approuvés du Lion :
  - jour : la route de Valmir et la route des témoins, plus le vieux sanctuaire pour le sanctuaire ;
  - crépuscule : l’épreuve du Lion et l’événement de bord de route ;
  - nuit au feu : le refuge final et le second refuge de nuit ;
  - intérieur et souterrain : l’audience d’Alaric et le jugement du Lion.

  L’audience de l’Ours générée, si tu la gardes, sert aussi de référence au jugement et à la fin de chronique : la salle de Borin reste la même d’une image à l’autre.
- **Bannières seulement où la ligne en nomme.** Ailleurs, aucun drapeau.
- **Une variante « créature » pour les bêtes.** Elle a ses propres références (loup, sanglier) et ne reçoit pas la règle du visage ni celle de l’héraldique.
- **Une variante « civil » pour le mineur**, avec des références de civils (survivant, réfugiée).

Les mentions **(proposition)** marquent ce que le texte ne dit pas : heure, lieu exact, aspect d’une bête. Ce sont des choix de mise en scène à confirmer, pas du canon.

## Ce qui reste tel quel

- **Audience de Borin.** La salle est en intérieur, avec piliers et bannières de l’Ours. Elle tient.
- **Campement du Corbeau.** On y voit tentes et bannière du Corbeau. Elle tient.
- **Les trois atlas, les six personnages du Corbeau, Borin et le guerrier.** Ils tiennent.

## Décors à refaire (26)

### Le col

1. **Pied des Montagnes** (`bear_arrival`)
   - Lieu : extérieur, jour, matin froid et clair (proposition).
   - On voit : un sentier de terre et de pierres qui commence à grimper vers des cols enneigés au loin, des sapins épars et des rochers. La neige est seulement sur les hauteurs.
   - On évite : rien de construit, aucune bannière. Source : « ici personne ne nous attend ».
2. **Messager du Corbeau** (`bear_raven_messenger`)
   - Lieu : sous-bois de sapins, jour gris et couvert (proposition).
   - On voit : une petite clairière d’aiguilles et de neige fondue, à l’écart du sentier, qu’on aperçoit entre les troncs.
   - On évite : bâtiments et bannières. Source : « sous les sapins, à l’écart du sentier ».
3. **Mineurs pris au piège** (`bear_trapped_miners`)
   - Lieu : flanc de montagne, jour, poussière qui retombe.
   - On voit : l’entrée d’une galerie bouchée par un éboulis de gros blocs, des étais de bois brisés, et des sacs de minerai posés sur le côté.
   - Source : « Leurs sacs de minerai sont là, sur le côté ».
4. **Pièges du Corbeau** (`bear_raven_traps`)
   - Lieu : sentier étroit entre les rochers, jour, lumière dure d’altitude.
   - On voit : de la neige sur les bords, des fils tendus en travers du sentier, des outres de cuir glissées sous des pierres.
   - On évite : bâtiments et bannières. Source : « Des fils tendus en travers du sentier, et de la poudre dans des outres sous les pierres ».
5. **Avant-poste de l’Ours, arrivée** (`bear_outpost_gathering`)
   - Lieu : cour d’un petit avant-poste dans un col, au crépuscule (proposition).
   - On voit : des murs bas de pierre, une tour de guet, des feux gardés dans des braseros, et le vent qui couche la fumée. Une seule bannière de l’Ours, au-dessus de la porte.
   - On évite : une forteresse. C’est un avant-poste, pas une ville. Source : « Des murs de pierre et des feux gardés ».
6. **Refuge de l’avant-poste** (`bear-first-refuge`)
   - Lieu : le même avant-poste, de nuit.
   - On voit : les feux allumés et la cour dégagée pour la halte.
   - Source : « Les feux de l’avant-poste tiennent le vent des cols ».

### La route des mines

7. **Convoi de minerai** (`bear_ore_convoy`)
   - Lieu : jour couvert, vue depuis un surplomb rocheux.
   - On voit : une route qui descend des galeries en lacets jusqu’à un pont de pierre, une borne au bord de la route, des ornières profondes et quelques pierres noires tombées dedans.
   - On évite : les chariots eux-mêmes, qui amèneraient conducteurs et bêtes de trait dans un décor qui doit rester vide. Le convoi n’est pas encore passé. Source : « jusqu’au pont… la dernière borne ».
8. **Galerie effondrée** (`bear_ancient_relic`)
   - Lieu : souterrain, à la lumière d’une torche.
   - On voit : une galerie effondrée depuis longtemps, poutres pourries, blocs tombés, poussière épaisse. Au centre, à moitié enfouie, une statuette d’ours dressé en pierre sombre sertie d’une gemme rouge.
   - On évite : ciel et cristal suspendu. La première image montrait un cristal violet, contraire au texte.
   - Source : « un ours dressé, taillé dans une pierre sombre et sertie d’une gemme rouge ».
9. **Les mines sacrées** (`bear_sacred_mines`)
   - Lieu : extérieur, jour gris (proposition).
   - On voit : l’entrée des galeries sacrées, taillée dans la falaise, avec des ours sculptés de part et d’autre. Devant, le chantier du Corbeau : tentes, treuils, chariots vides, et des bannières du Corbeau plantées devant les sculptures de l’Ours.
   - Source : « Des tentes du Corbeau, des treuils, des chariots ».
10. **Défense des mines** (`bear_pre_mines_defense`)
    - Lieu : souterrain, dans une grande salle de mine étayée.
    - On voit : des rails, un treuil au-dessus d’un puits de descente, une barricade de chariots renversés et de caisses, et des bannières du Corbeau clouées sur des sculptures de l’Ours.
    - Source : « Descendez les chercher ».
11. **Les galeries reprises** (`bear_mines_defense_aftermath`)
    - Lieu : la même salle après le combat.
    - On voit : la barricade défaite, les bannières du Corbeau arrachées et tombées au sol, les sculptures de l’Ours de nouveau visibles, des torches calmes.
12. **Prise du filon** (`bear_pre_mines_seizure`)
    - Lieu : souterrain, plus profond.
    - On voit : une barricade du Corbeau dans une galerie dont les rails descendent vers le fond. Là-bas, une veine noire et mate traverse la roche, encore petite et lointaine.
13. **Le filon pris** (`bear_mines_seizure_aftermath`)
    - Lieu : la même galerie après le combat.
    - On voit : la barricade défaite et des chariots pleins de pierres noires.
    - On évite : toute bannière. La compagnie veut planter la sienne, mais son emblème n’est pas décidé.

### Après les mines

14. **Refuge des mineurs** (`bear-second-refuge`)
    - Lieu : intérieur (proposition), une salle basse taillée dans la roche près des galeries.
    - On voit : un foyer central qui enfume, des paillasses, des outils pendus, des lanternes.
    - Source : « L’abri des mineurs sent la pierre froide et la fumée ».
15. **Mineurs libérés** (`bear_miners_testimony`)
    - Lieu : matin pâle (proposition), sur un sentier qui redescend des galeries vers les vallées. Le texte ne nomme pas le lieu.
    - On voit : des chariots du Corbeau abandonnés sur le bas-côté et des outils de mineur posés sur une pierre.
16. **Sanctuaire de la montagne** (`bear_mountain_shrine`)
    - Lieu : jour, vent, neige légère. Un petit sanctuaire de pierre adossé au rocher, avec un ours sculpté.
    - On voit : à son pied, des outils de mineur, des pierres polies et une bourse de pièces anciennes.
    - On évite : temple et grand escalier. Le lieu reste intime.
    - Source : « des outils de mineur, des pierres polies, une bourse de pièces anciennes ».
17. **Le filon sombre** (`bear_dark_vein`)
    - Lieu : souterrain, tout au fond des galeries.
    - On voit : une paroi où court une veine noire et mate qui ne renvoie pas la lumière des torches fichées dans les étais. L’ombre semble onduler autour.
    - On évite : cristaux et lueur violette.
    - Source : « une veine noire dans la roche, qui ne renvoie pas la lumière des torches ».

### Devant Borin

18. **Veillée avant le Sceau** (`bear_vigil`) et **refuge de la veillée** (`bear-final-refuge`)
    - Lieu : de nuit. Le lieu est une proposition : un feu de camp sur une corniche rocheuse.
    - On voit : au loin, éclairée, la salle où la compagnie comparaîtra demain. Les deux images partagent ce lieu.
    - Source : « Borin nous attend demain ».
19. **Jugement de Borin** (`bear_judgement`)
    - Lieu : intérieur, la même salle que l’audience : piliers de pierre, bannières de l’Ours, siège de Borin au fond.
    - Cadrage : plus près du siège (proposition), braseros bas.
20. **Fin de chronique** (`chronicle-end`)
    - Lieu : la salle de Borin après le jugement.
    - On voit : la salle vide, des braises dans les braseros, le siège vide.
    - On évite : l’extérieur. La première image montrait une terrasse en plein air.
21. **Traque du Maître Espion** (`bear_master_spy_pre_combat`)
    - Lieu : galeries hautes (proposition). Une sortie de mine s’ouvre sur les sommets, et le vent souffle la neige dans la galerie, au crépuscule froid.
    - Source : « fuit vers les hauteurs » ; l’épilogue le dit « tombé dans les galeries ».
22. **Le Maître Espion vaincu** (`bear_master_spy_aftermath`)
    - Lieu : le même lieu, après le combat.
    - On voit : des caisses renversées, la neige qui retombe, le calme.
23. **Épreuve de l’Ours** (`bear_borin_pre_combat`)
    - Lieu : de jour (proposition), une terrasse de pierre dégagée devant la salle de Borin, à ciel ouvert sous les sommets, les portes de la salle derrière.
    - Source : « selon la loi de la montagne », combat en montagne.
24. **Le Sceau arraché** (`bear_trial_aftermath`)
    - Lieu : la même terrasse au coucher du soleil.
    - On voit : de la neige piétinée et des lances brisées.
    - Source : « La montagne l’a vu, mes guerriers aussi ».
25. **Le Sceau de l’Ours** (`bear_epilogue`)
    - Lieu : à l’aube (proposition), sur les Montagnes de la Résilience, vues depuis le col de départ.
    - On voit : le sentier qui redescend vers les plaines.
    - Le décor est neutre, car il sert aux deux issues (alliance ou épreuve).

## Personnages à refaire (3)

26. **Mineur de l’Ours** (`bear_miner`) — proposition.
    - Un mineur civil.
    - Visage couvert par une capuche de cuir et un foulard contre la poussière.
    - Tablier de cuir, pioche à l’épaule, lanterne à la ceinture, poussière de roche.
    - Aucune armure, aucune épée.
27. **Bête corrompue** (`corrupted_beast`) — proposition.
    - Une grande bête de montagne à quatre pattes, massive, au poil hirsute et aux cornes recourbées.
    - Rendue folle : veines noires sous le pelage, yeux brûlants.
    - Ni ours, l’animal du clan, ni loup.
    - Rien de propre à l’Ours non plus, car le Dragon la réutilise (« Bêtes sous l’emprise des Ombres »).
    - Source : « Une bête de la montagne, rendue folle près des galeries ».
28. **Bête des profondeurs** (`depth_beast`) — proposition.
    - Une créature aveugle des galeries profondes, pâle, aux longues griffes de fouisseur.
    - Le dos hérissé d’éclats de pierre noire.
    - Source : « Des créatures corrompues gardent la descente vers le filon ».

Total à régénérer : 29 images, soit 26 décors et 3 personnages (le n° 18 compte pour deux).

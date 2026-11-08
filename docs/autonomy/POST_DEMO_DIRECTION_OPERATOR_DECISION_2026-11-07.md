# Direction de l'après-démo — OD-2026-11-07-I

**APPROVED DECISION.** Le 2026-11-07 au soir, l'opérateur a rempli la [fiche d'arbitrages de l'après-démo](https://claude.ai/artifact/BaMWTQwKLZyTAbovbXxHiW). Ses dix-sept choix suivent les recommandations. Une note accompagne R1. Aucune de ces décisions ne change la démo actuelle ni les contrats.

## Demande

Le 2026-11-07, l'opérateur annonce une longue session cloud pour la suite du jeu, l'après-démo. Avant de la lancer, il veut clarifier trois points : le gain et l'impact de la réputation pendant le jeu, les autres plateaux et la phase finale. La fiche ajoute un quatrième groupe, le cadre de la session cloud.

## Principe de l'opérateur

En confirmant la fiche, l'opérateur rappelle ce qui fait le jeu :

> « la narration doit être structurée et cohérente car c'est le point principal de notre jeu, les choix et les répercussions… en plus de notre système de combat entraînant »

Tout le travail de l'après-démo se juge d'abord à cette aune.
- **Choix et répercussions.**
  - Chaque choix important laisse un fait durable, et ce fait a une répercussion visible plus tard : dans le même plateau, dans un plateau suivant, au Tournoi, dans la phase finale ou à l'épilogue.
  - Aucune répercussion n'arrive sans un choix qui l'explique. La scène qui la montre en nomme la cause, comme le jugement d'Alaric le fait déjà.
- **Structure.** Chaque plateau suit la feuille de route : entrée, exploration, confrontation, voie de l'honneur à deux boss, voie de la force à un boss.
- **Cohérence.**
  - Les faits de la démo priment, comme pour toute la feuille de route (OD-2026-11-04-C).
  - Les personnages gardent leur voix. Le futur retournement de Maelor se prépare par petites touches.
  - Les clans non visités et les démons restent un mystère jusqu'au Tournoi.
- **Combat entraînant.**
  - Chaque plateau apporte des adversaires propres à ses clans, des défis, des gardiens et des boss qui servent son récit.
  - Le système tactique actuel reste le socle.

## Choix de l'opérateur

| Id | Sujet | Choix |
| --- | --- | --- |
| R1 | Ce que mesure la réputation | La jauge reste inchangée, plus une relation par clan (allié, neutre ou ennemi) ; note ci-dessous |
| R2 | Gain et perte | La jauge passe d'un plateau à l'autre sans remise à zéro ; les montants sont plus petits ensuite (voir la correction plus bas) |
| R3 | Ce qu'elle change | Les quatre effets actuels, plus les alliances au Tournoi et à la fin ; aucun bonus de combat |
| R4 | Choix de la fin | Les issues des quatre plateaux décident, la jauge départage, selon la règle de la fiche : trois ou quatre fois l'honneur donnent le Respect, sauf si la jauge est sous 40 (alors l'Équilibre) ; trois ou quatre fois la force donnent la Crainte, sauf si la jauge est à 60 ou plus (alors l'Équilibre) ; deux et deux donnent l'Équilibre |
| P1 | Nombre de plateaux | Trois plateaux après le Lion, pour quatre Sceaux, livrés un par un |
| P2 | Plateau retiré | Le Phénix ; il reste le clan adverse du Scorpion |
| P3 | Ordre | Un ordre fixe : l'Ours, le Dragon, puis le Scorpion |
| P4 | Taille | Le même gabarit que le Lion ; le nombre de lieux suit la durée mesurée sur la démo |
| P5 | Kael et Kaelen | Le chef Scorpion sera renommé ; le nom vient de l'opérateur ou de propositions qu'il valide |
| F1 | Forme de la phase finale | Un acte final en trois temps : le Tournoi en combats d'arène présentés par un tableau des rencontres, la fuite par la capitale corrompue sur une petite carte, le combat final à la brèche |
| F2 | Finale du Tournoi | Le Serpent, toujours ; son champion se change en démon quand la brèche s'ouvre |
| F3 | Alliés | Chaque clan allié apporte un soutien utilisable une fois par combat de la phase finale, et chaque clan ennemi ajoute des adversaires ; les chefs alliés paraissent dans les tableaux, pas comme héros jouables |
| F4 | Le Fou et le chef des Ombres | Maelor s'enfuit par la brèche et devient la première phase du combat final ; l'entité reste sans nom tant que l'opérateur n'en décide pas |
| F5 | Les trois fins | Trois épilogues en tableaux vivants ; dans la Fin de la Crainte, le joueur choisit entre un dernier combat et l'acceptation de son destin |
| S1 | Cadre contractuel | Un amendement-cadre de l'après-démo, approuvé avant la session |
| S2 | Écriture des dialogues | Des brouillons jouables sur dev, écrits depuis la feuille de route seule et validés plateau par plateau ; rien ne devient canon sans l'opérateur |
| S3 | Images | Des images provisoires clairement marquées, et la liste exacte des images à créer ; les images finales forment un lot à part |

## Note sur R1 et vérification

**Note de l'opérateur.** Il veut s'assurer que des choix parfaits permettent d'atteindre 100, ce qu'il pense ne pas être le cas, et demande de le vérifier.

**Vérification.**
- **Méthode.** Le 2026-11-07, un script en lecture seule a calculé, pour chaque dialogue de la démo, le gain et la perte de réputation les plus forts possibles. Il compte les choix, les combats que ces choix lancent et l'issue la plus favorable des épreuves. Il en a fait la somme le long des 21 lieux du chemin canonique du Lion. Le script n'a rien écrit.
- **Gains par lieu, voie de l'honneur :**
  - audience d'Alaric +3, Piste des bêtes +1, Croisement du rôdeur +3, Route des réfugiés +8 ;
  - première bifurcation +4 à +8, Chemin des réserves +4, Route de Bois-Clair +1, seconde bifurcation +2 à +5 ;
  - Bois-Clair assiégé +25 (vieux pont +10, défense +10, refus de toute récompense +5) ;
  - Volontaire de Bois-Clair +3, Témoins +5, troisième bifurcation +3 à +4, Signes des Ombres +5 ;
  - au jugement, preuve des Ombres révélée +4 ; puis poursuite du Serpent +2 et Général Serpent +12.
- **Résultat.**
  - Des choix parfaits atteignent bien 100, et bien avant la fin. La voie de l'honneur offre de +85 à +93 points selon les variantes tirées aux bifurcations, quand il en faut 70 pour passer de 30 à 100.
  - Avec les variantes les plus favorables, la jauge touche 100 dès la troisième bifurcation, juste avant les Signes des Ombres. Avec les moins favorables, au jugement.
  - Ce résultat compte sans les douze lieux facultatifs ni les gardiens, qui ajoutent jusqu'à +6, et sans les événements des refuges.
  - Un joueur d'honneur constant peut donc négliger une quinzaine de points et finir le Lion à 100.
  - À l'opposé, la voie de l'avidité vide la jauge dès Bois-Clair.

**Correction de la recommandation R2.** La fiche disait à la fois « la démo ne change pas » et « le joueur d'honneur atteint Renommé vers le troisième plateau plutôt qu'à la fin du Lion ». Ces deux phrases ne tiennent pas ensemble, puisque le Lion seul mène à 100. Pour que 100 récompense un parcours parfait sur tout le jeu, et pour que Renommé arrive vers le troisième plateau, il faut réduire les montants du Lion et y déplacer ses seuils dans la même proportion : Cedric à 20, escorte des témoins à 45, crédibilité devant Alaric à 45 et 70.

**Moment du réétalonnage.** Le 2026-11-07, l'opérateur a choisi l'après-démo. Le Lion y devient le premier plateau du jeu complet, avec ses montants et ses seuils réétalonnés. La démo garde ses valeurs actuelles pendant le playtest et une fois figée.

**Objectif retenu pour l'étalonnage :**
- un parcours parfait atteint 100 à la fin du jeu, pas avant ;
- un joueur d'honneur constant atteint Renommé vers le troisième plateau ;
- le script de vérification devient un test, qui échoue si ces bornes ne tiennent plus.

## Conséquences

- **Feuille de route.** Son statut est mis à jour avec ces choix : le Phénix ne sera plus un plateau, l'ordre est fixé, le chef Scorpion sera renommé, la forme de l'acte final est arrêtée.
- **Session cloud.**
  - Elle ne démarre qu'une fois le texte de l'amendement-cadre (S1) approuvé et appliqué aux contrats.
  - D'ici là, le gel des contenus, des systèmes et des images nouveaux reste en vigueur, et la démo ne change pas.
- **Brief.** Le brief de la session est écrit dans le dépôt : [POST_DEMO_CLOUD_SESSION_BRIEF.md](POST_DEMO_CLOUD_SESSION_BRIEF.md).
  - Il reprend le principe de l'opérateur, ces dix-sept choix et l'étalonnage de la réputation.
  - Il fixe l'ordre des lots : fondations, l'Ours, le Dragon, le Scorpion, l'acte final, les fins.
  - Il fixe les points où la session s'arrête pour l'opérateur : fin de chaque lot, noms, faits d'histoire, règles hors du cadre.
- **Canon.** Aucun nom, dialogue ou personnage nouveau n'est fixé par cette décision. Le nom du chef Scorpion, l'identité de l'entité et toutes les répliques restent à valider par l'opérateur.

## Amendement-cadre 1.20.0 — texte soumis

État : **PROPOSED**, soumis à l'opérateur le 2026-11-07. Amendement `PRODUCTION-CONTRACTS-POST-DEMO-FRAMEWORK-1`, jeu de contrats 1.20.0. Texte exact : [POST_DEMO_FRAMEWORK_AMENDMENT_1.20.0.patch](POST_DEMO_FRAMEWORK_AMENDMENT_1.20.0.patch).

Une relecture indépendante de contracts-guardian a rendu « PASS WITH WARNINGS ». Ses huit corrections requises sont appliquées :
- les limites du son restent celles du jeu 1.12.0 ;
- le combat final a deux phases seulement ;
- la règle R4 est citée comme choisie ;
- les nouveaux montants du Lion sont d'abord approuvés par l'opérateur ;
- l'extension des moments est explicite ;
- le chef Scorpion est désigné par son titre ;
- la session s'arrête à l'acceptation de chaque plateau ;
- les règles d'affichage propres au Lion sont préservées.

Ses suggestions facultatives (combat contre les clans, ni vidéo ni image générée, validateur appliqué aux brouillons) sont reprises aussi.

Ce que le texte ouvre, contrat par contrat :
- **Constitution.** Trois phrases :
  - la campagne de l'après-démo, en brouillons qui ne deviennent canon qu'à l'approbation de chaque plateau ;
  - le tableau des rencontres du Tournoi, qui n'est pas un second mode de navigation ;
  - les soutiens de clan, qui ne sont ni des Ultimes ni de la progression ;
  - les nouveaux moments de tableaux vivants, sur des tableaux approuvés seulement.
- **CAMPAIGN_AND_STATE.** La portée (trois plateaux dans l'ordre choisi, l'acte final, trois épilogues) et le gabarit du Lion. La règle des brouillons et l'approbation globale de chaque plateau. La réputation et les relations de clan, la règle de fin R4, l'étalonnage du Lion, les faits durables et leur migration, les soutiens, l'acte final.
- **TRAVERSAL.** Chaque plateau a sa carte de lieux en trois régions, avec les mêmes règles que le Lion ; sa taille par défaut est celle du Lion. La capitale est une petite carte de lieux. Le tableau des rencontres présente seulement les combats ; leur ordre appartient à `RunSystem`.
- **WORLD_AND_CHARACTERS.** Les clans et les chefs de la feuille de route, l'entité sans nom, les nouveaux atlas, les images provisoires marquées. Les images finales forment un lot à part.
- **COMBAT_AND_VFX.**
  - Défis et vagues des gardiens pour les nouveaux plateaux.
  - Combat final en deux phases, Maelor puis l'entité, par le chemin sans résultat des vagues.
  - Soutiens de clan utilisables une fois, adversaires ajoutés par les clans ennemis.
  - Signatures procédurales pour les nouvelles compétences et une ambiance par nouveau biome.
  - Les autres sons de boss et toute autre règle nouvelle sont proposés à l'opérateur.
- **PRESENTATION_AND_MEDIA.** Des tableaux vivants pour l'arrivée et les deux issues de chaque plateau, la trahison du Tournoi et les trois épilogues. Chacun ne joue que sur un tableau approuvé et seulement si l'opérateur l'a gardé dans la table des moments. Le choix de la Fin de la Crainte se fait dans le dialogue qui suit le tableau.
- **UI_AND_ACCESSIBILITY.** Les mêmes règles d'accessibilité pour les nouvelles surfaces.
- **AUTHORING_AND_QA.** Le paquet de livraison de chaque plateau. Les conditions d'acceptation, dont le validateur de cohérence narrative et le test des bornes de réputation.
- **AUTONOMOUS_WORK_PROTOCOL.** La branche de la session, son autorité d'écriture bornée, ses arrêts et le brief.

Trois points vont un peu au-delà des dix-sept choix. L'opérateur peut les refuser chacun seul :
1. Les tableaux vivants de l'arrivée et des issues de chaque plateau, et celui de la trahison au Tournoi, précisent les « grands moments » de S1. La fiche ne nommait que les épilogues (F5).
2. Une ambiance sonore par nouveau biome : montagnes de l'Ours, pics du Dragon, désert du Scorpion, arène, capitale, brèche.
3. La table des humeurs musicales peut recevoir les nouveaux dialogues, selon ses règles actuelles.

Après l'accord de l'opérateur, le patch est appliqué tel quel. Viennent ensuite le commit d'amendement, puis un commit opérationnel qui inscrit son SHA comme baseline immuable. La session cloud peut alors partir.

## Limites

- Aucun contrat n'est modifié tant que l'opérateur n'a pas approuvé le texte ; la baseline 74fceb399dea8cd0c187d97350e3a11af6e04d26 reste en vigueur.
- Aucun code ni aucun texte du jeu ne change.

# Après-démo, Lot 0 — fondations

| Champ | Valeur |
| --- | --- |
| TASK | POST-DEMO-LOT-0-FOUNDATIONS |
| DOMAIN | Campagne, état et sauvegardes, réputation, outils de cohérence narrative |
| BASELINE | `25ccd2f2` sur `dev` (jeu de contrats 1.20.0, baseline immuable `6c965169c2dc153cafd5a8609d914cf8de723ff3`) |
| BRANCH | `post-demo` |
| HEAD | `0fb6e746` pour le code ; ce rapport et l'état suivent dans le commit de clôture du lot |
| STATUS | review : en attente de la réponse de l'opérateur (arrêt de fin de lot) |
| MERGED_IN | NONE |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Aucun changement de jeu visible. Le Lion joue comme avant. Une nouvelle partie et toute sauvegarde rechargée portent un enregistrement de campagne versionné (Lion en cours, clans neutres). Aucun étalonnage de réputation n'est appliqué. |
| CANONICAL_DOCS_UPDATED | `docs/content/consequence-map-format.md` (nouveau, proposé) ; `docs/autonomy/AUTONOMOUS_WORK_STATE.md` et `.json` |
| EVIDENCE | Suite vitest et `node:test`, types, build, validateur des contrats, porte du verrou documentaire, `npm run narrative:validate`, `cinematics:validate-narrative-staging` (section 7). Aucune capture : le lot ne change rien à l'écran. |

Session cloud de l'après-démo, run `claude-postdemo-lot0-20261108T0030Z`. Elle suit [le brief](../autonomy/POST_DEMO_CLOUD_SESSION_BRIEF.md) et [OD-2026-11-07-I](../autonomy/POST_DEMO_DIRECTION_OPERATOR_DECISION_2026-11-07.md).

## Résumé

- **Plateaux.** Le Lion passe derrière un registre de plateaux sans changer de comportement. L'Ours, le Dragon, le Scorpion et l'acte final y sont réservés, sans contenu.
- **Sauvegardes.** Les faits durables de l'après-démo vivent dans un enregistrement de campagne versionné, à l'intérieur de la sauvegarde V6. Une sauvegarde de la démo se charge et reprend à son point, sans aucun fait du Lion changé.
- **Relations.** `RunSystem` possède les relations de clan, les issues des plateaux et la règle de fin R4.
- **Réputation.** Un test des bornes est calculé depuis le contenu. Il confirme la mesure du 2026-11-07 et en corrige un chiffre. L'étalonnage du Lion est **proposé, pas appliqué** : il attend ton accord (section 4).
- **Cohérence narrative.** Le format de la carte des conséquences est en place, avec la carte du Lion et un validateur. Le Lion passe le validateur : ses 13 choix majeurs ont tous un écho qui en nomme la cause. Les écarts connus sont listés avec leur raison.

## 1. Registre de plateaux

APPROVED DECISION (P1 à P4), mise en œuvre ici :
- **Le registre.** `src/campaign/plateaux/PlateauRegistry.ts` déclare cinq chapitres dans l'ordre fixe : le Lion, l'Ours, le Dragon, le Scorpion, puis l'acte final. Le plateau du Phénix est retiré ; le Phénix reste le clan adverse du Scorpion.
- **Ce que porte chaque entrée :**
  - le préfixe de ses identifiants durables (`lion-`, `bear-`, `dragon-`, `scorpion-`, `finale-`) ;
  - son clan hôte et son clan rival, sa section de la feuille de route, son statut (`canon`, `draft` ou `planned`) ;
  - son chef. Le chef Scorpion est « Grand Inquisiteur », sans nom tant que tu n'en as pas validé un (P5) ;
  - son budget de réputation (section 4).
- **Le Lion** (`src/campaign/plateaux/lionPlateau.ts`) pointe vers ses tables existantes, sans en recopier une valeur :
  - ses 21 nœuds canoniques et ses 12 facultatifs ;
  - ses refuges, son refuge final et son jugement ;
  - ses trois bifurcations engagées (jeu 1.17.0) et ses combats d'élite ;
  - ses 7 défis, ses 2 gardiens et ses 3 atlas ;
  - la lecture de son issue : la défaite du général Serpent vaut l'honneur, la victoire à l'épreuve vaut la force.
- **RunSystem.** Il lit désormais les bifurcations engagées, les refuges et les combats d'élite à travers le registre (`plateauCampaignForRun`). Le comportement est identique : les 96 tests de navigation du Lion restent verts.
- **Plateaux réservés.** L'Ours, le Dragon, le Scorpion et l'acte final n'ont aucun contenu (`campaign: null`). Ils seront construits un par un, en brouillons.

## 2. Sauvegardes versionnées

- **Choix de forme.** Les relations de clan, la progression et les issues des plateaux, l'acte final et la fin choisie entrent dans un enregistrement `campaign` à version propre (v1), placé dans la sauvegarde V6. C'est le modèle de `run.poiExpedition`.
  - L'enveloppe V6, ses clés de stockage et tous les champs du Lion restent ceux que la démo écrit.
  - Une démo figée qui lit une sauvegarde de l'après-démo ignore cet enregistrement.
  - Les 28 tests et les pilotes de QA qui visent `autosave:v6` restent valables.
- **Migration explicite** (`migrateCampaignProgress`) :
  - sans enregistrement, il est dérivé des faits sauvegardés : le Lion est le chapitre en cours, terminé si la chronique de la démo est finie, avec son issue si une victoire de boss l'a enregistrée ;
  - aucun clan n'est encore rencontré : tous sont neutres ;
  - un enregistrement v1 est gardé tel quel ;
  - un enregistrement inconnu ou abîmé fait refuser la sauvegarde ; elle n'est jamais réécrite en silence.
- **Jamais sauvegardés.** Vagues, phases de boss, soutiens de clan et état visuel n'ont aucun champ : le schéma est strict et un test le vérifie. Le brief listait les « soutiens » parmi les faits durables. Le contrat l'emporte : les soutiens se déduisent des relations sauvegardées avant chaque combat de l'acte final, et leur usage n'est pas sauvegardé.
- **Tests de reprise.** Trois fixtures sont de vraies sauvegardes V6, écrites par le code de `origin/dev` lui-même : milieu du Lion, fin par l'honneur, fin par la force. Pour chacune, le test vérifie :
  - qu'elle se charge depuis la clé de la démo et qu'aucun fait du Lion ne change ;
  - qu'elle reprend sur la carte, avec un déplacement accepté par `RunSystem` ;
  - que l'enregistrement s'écrit puis se relit à l'identique ;
  - qu'une sauvegarde V5 plus ancienne migre aussi.

## 3. Relations de clan, issues et fin

`src/game/campaignRelations.ts`, réexporté par `runSystem.ts`, est le seul à écrire l'enregistrement de campagne.

- **Relations.** Un clan non rencontré se lit neutre. Une relation (alliée, neutre ou ennemie) s'enregistre toujours avec le fait qui la cause, pour qu'une scène plus tardive puisse nommer cette cause. Les clans se listent par relation : les alliés pour les soutiens, les ennemis pour les adversaires ajoutés.
- **Aucun bonus de combat.** Un test le vérifie : les statistiques des unités ne bougent pas.
- **Issues.** Une issue s'enregistre une seule fois et ne change plus. Un plateau ne se ferme qu'avec son issue, puis le chapitre suivant s'ouvre dans l'ordre fixe.
- **R4.** La règle de fin choisie sur la fiche est testée pour les 16 combinaisons d'issues, avec les seuils exacts (39 et 40, 59 et 60). La fin s'enregistre une seule fois.
- **Branchement.** Rien de tout cela n'est encore appelé en jeu : la démo n'a pas de passage du Lion à l'Ours. Le branchement viendra au Lot 1.

## 4. Réputation du Lion : mesure, étalonnage proposé, bornes

### 4.1 La démo, mesurée depuis son contenu

`src/game/reputationBounds.ts` parcourt le contenu comme le jeu le route :
- le dialogue de chaque lieu, ou son combat avec ses dialogues d'avant et d'après ;
- les variantes tirées aux bifurcations ;
- les combats lancés par un choix ;
- le jugement construit par `lionFinale`, avec les drapeaux posés en chemin (la révélation des Ombres n'est offerte qu'une fois) ;
- les lieux facultatifs, les gardiens et les deux meilleurs événements de refuge.

Résultats, valeurs de la démo inchangées :

| Mesure | Démo |
| --- | ---: |
| Voie de l'honneur, variantes les moins favorables | +85 |
| Voie de l'honneur, variantes les plus favorables | +90 |
| Lieux facultatifs et gardiens | +6 |
| Deux meilleurs événements de refuge | +5 |
| Parcours parfait dans le Lion | +101 |
| Pire parcours (avidité partout) | −69 |

- **Ce qui est confirmé.** CURRENT FACT : le Lion seul mène à 100. Un parcours parfait y arrive dès les témoins ; un joueur d'honneur constant, au jugement.
- **Une correction.** La vérification du 2026-11-07 annonçait +85 à +93. Le maximum est **+90** : l'ancien calcul comptait +3 pour `mystery_troll_crossing`, un des quatre dialogues jamais montrés (C8). En jeu, le passage du troll est un lieu de combat qui joue `pre_troll_crossing`, sans réputation.
- **Le test des bornes fige ces valeurs.** La démo garde les siennes.

### 4.2 Étalonnage proposé pour l'après-démo

PROPOSED FUTURE DESIGN, **non appliqué**. Il change des montants et des seuils seulement, jamais un choix, une issue, une route ou une réplique. Il ne réécrit aucune valeur sauvegardée.

**Montants.** Une seule règle :
- chaque montant est multiplié par 0,3 et arrondi ;
- il garde son signe et au moins 1 point : aucun choix ne perd son poids ;
- une victoire ordinaire (+1 d'un combat de rang normal) passe à 0. La réputation suit alors les choix, et les combats facultatifs ne remplissent plus la jauge. Les victoires d'élite et de boss, comme toutes les pertes, gardent une valeur.

| Démo | Proposé |
| ---: | ---: |
| +12 | +4 |
| +10, −10 | +3, −3 |
| −15 | −5 |
| +8, −8 | +2, −2 |
| +6, −6, +5, −5 | ±2 |
| +4, −4, +3, −3, +2, −2, +1, −1 | ±1 |
| +1 d'une victoire ordinaire | 0 |

**Seuils.** Ce sont des valeurs entières proches de la proportion de la décision (30 + 0,3 × (seuil − 30)). Pour chaque seuil, la valeur retenue est celle qui change le moins de verdicts actuels, sur toutes les parties atteignables (section 4.4) :

| Seuil | Démo | Proportion | Proposé | Effet mesuré |
| --- | ---: | ---: | ---: | --- |
| Recrue Cedric | 20 | 27 | **27** | aucune partie touchée, de 24 à 29 |
| Recrue Garen (absent de la liste du 2026-11-07) | 15 | 26 | **24** | 8 états sur 226 changent (17 avec 26) |
| Escorte des témoins | 45 | 35 | **35** | 7 états sur 275 changent (meilleur choix) |
| Crédibilité devant Alaric | 45 | 35 | **33** | voir 4.4 |
| Grande crédibilité devant Alaric | 70 | 42 | **42** | voir 4.4 |

**Résultat pour le Lion :**
- un parcours parfait gagne au plus **+32** et finit à 62 (Respecté) ;
- un joueur d'honneur constant gagne **+27** et finit à 57 (Neutre) ;
- l'avidité partout coûte −24 et vide encore la jauge ;
- le joueur d'honneur constant passe toutes les portes : Cedric à 31, Garen à 45, les témoins à 46 et le jugement à 51, au-dessus du seuil de 42.

Conséquence voulue : les remises de l'échoppe et de la forge et les poids des événements de refuge suivent les cinq paliers inchangés. Ils arrivent donc plus tard dans le jeu complet. Le Renom (80) n'est plus atteint dans le Lion.

### 4.3 Bornes du jeu complet

Budgets proposés pour les plateaux suivants. Ce sont des cibles, que chaque plateau devra tenir une fois construit :

| Chapitre | Parfait | Honneur constant | Cumul parfait | Cumul honneur |
| --- | ---: | ---: | ---: | ---: |
| Lion (mesuré) | 32 | 27 | 62 | 57 |
| Ours | 16 | 13 | 78 | 70 |
| Dragon | 12 | 10 | 90 | **80** |
| Scorpion | 6 | 4 | 96 | 84 |
| Acte final | 4 | 3 | **100** | 87 |

- **Le test vérifie :**
  - un parcours parfait n'atteint 100 que dans l'acte final ; les parfaits totalisent exactement 70, l'écart de 30 à 100 ;
  - un joueur d'honneur constant atteint le Renom au Dragon, pas avant ;
  - les montants baissent de plateau en plateau (R2) ;
  - le budget du Lion dans le registre est sa mesure réelle.
- **Une interprétation à confirmer.** « Vers le troisième plateau » compte le Lion comme premier plateau : c'est le Dragon.

### 4.4 Où l'étalonnage change un jugement d'Alaric

`compareLionThresholds` suit toutes les parties de la route canonique avec les deux jeux de valeurs à la fois. Ce sont les mêmes décisions ; chaque monde ouvre ou ferme ses propres portes. La comparaison compte les états de réputation distincts où un verdict diffère. Ce n'est pas une probabilité de joueur : les lieux facultatifs et les événements sont laissés de côté, et toute variante peut croiser toute réputation.

- **Au jugement.** Sur 633 états atteignables, le palier de crédibilité d'Alaric reste le même dans 557 cas et change dans **76**. Dans le détail, de la démo à l'étalonnage : 30 états passent de faible à crédible, 15 de crédible à faible, 16 de crédible à haut, 15 de haut à crédible. Avec la proportion simple (35 et 42), 83 états changeraient.
- **Où se trouvent ces écarts.** Ils touchent les parties mêlées, ni honneur constant ni avidité. Ils viennent de l'arrondi des petits montants : beaucoup de valeurs différentes deviennent 1. Aucun étalonnage entier ne les supprime tous. Un écart de crédibilité change la ligne de contexte d'Alaric. Pour une conduite incertaine sans témoin ni preuve, il peut aussi changer la route.
- **Les deux voies franches ne bougent pas.** Les parties d'honneur constant et d'avidité gardent leur verdict.

### 4.5 Tableau complet des montants du Lion

Chaque source de réputation du contenu, avec sa valeur dans la démo et sa valeur proposée. Le tableau est généré depuis le code (`collectLionReputationLedger`). Les montants de dialogue sont ceux du choix lui-même ; un combat lancé par un choix compte à sa ligne « victoire ».

| Source | Nature | Démo | Proposé |
| --- | --- | ---: | ---: |
| lion_briefing · « Accepter la mission d’Alaric. » | choix | +3 | +1 |
| lion_briefing · « Accepter, mais réclamer une avance. » | choix | -3 | -1 |
| mystery_recruit · « Recruter Cedric — 50 or. » | choix | +3 | +1 |
| refugee_trial · « Partager nos réserves et leur ouvrir la route — 40 or. » | choix | +8 | +2 |
| refugee_trial · « Vendre l’itinéraire contre leurs 40 dernières pièces. » | choix | -8 | -2 |
| mystery_help · « Laisser 30 or de vivres et remettre le chariot en état. » | choix | +8 | +2 |
| mystery_help · « Garder nos réserves et reprendre la route vers Bois-Clair. » | choix | -2 | -1 |
| mystery_treasure · « Baliser le chariot et rendre le chargement aux réfugiés. » | choix | +4 | +1 |
| mystery_treasure · « Intégrer le chargement aux réserves du clan. » | choix | -4 | -1 |
| reserve_trail · « Frapper le convoi et saisir les réserves. » | choix | -6 | -2 |
| reserve_trail · « Marquer le convoi et continuer vers le village. » | choix | +4 | +1 |
| old_shrine_event · « Entretenir le foyer et laisser le reliquaire intact. » | choix | +2 | +1 |
| old_shrine_event · « Ouvrir le reliquaire et emporter les pièces utiles. » | choix | -3 | -1 |
| serpent_duelist_trial · « Accepter le duel et briser son barrage. » | choix | +2 | +1 |
| serpent_duelist_trial · « Contourner par les ronces — 60 or. » | choix | -2 | -1 |
| mystery_troll_crossing · « Le défier et récupérer les sacs. » | choix | +3 | +1 |
| mystery_troll_crossing · « Lui abandonner une bourse — 80 or. » | choix | -1 | -1 |
| village_choice · « Prendre le vieux pont et extraire les captifs. » | choix | +10 | +3 |
| village_choice · « Prendre la porte basse et emporter les coffres pour le clan. » | choix | -10 | -3 |
| village_defense_aftermath · « Refuser toute récompense. » | choix | +5 | +2 |
| village_raid_aftermath · « Laisser quelques provisions aux villageois. » | choix | +3 | +1 |
| village_raid_aftermath · « Partir avec tout. Ils ne sont pas notre problème. » | choix | -5 | -2 |
| mystery_lancer_recruit · « Accueillir Garen dans la compagnie. » | choix | +3 | +1 |
| mystery_lancer_recruit · « Lui demander de rester protéger Bois-Clair. » | choix | +2 | +1 |
| witnesses_on_road · « Protéger les témoins jusqu’au camp. » | choix | +5 | +2 |
| witnesses_on_road · « Faire taire les témoins, quel qu’en soit le prix. » | choix | -5 | -2 |
| witnesses_on_road · « Protéger les témoins jusqu’au camp. » | échec du gage | -2 | -1 |
| mystery_dragon_roost · « Sceller l’accès, cartographier le nid et poursuivre. » | choix | +4 | +1 |
| mystery_shrine · « Raviver le sceau pour les prochains voyageurs. » | choix | +3 | +1 |
| mystery_shrine · « Rompre le sceau et récupérer l’offrande. » | choix | -4 | -1 |
| serpent_informant · « Protéger l’informateur et affronter ses chasseurs. » | choix | +4 | +1 |
| serpent_informant · « Vendre sa route aux Serpents. » | choix | -6 | -2 |
| shadow_signs · « Stabiliser l’autel et transporter la preuve intacte. » | choix | +5 | +2 |
| shadow_signs · « Démonter l’autel et disperser sa résonance. » | choix | -2 | -1 |
| lion_finale_judgement · « Révéler les preuves des Ombres. » | choix | +4 | +1 |
| serpent_general_aftermath · « Confier la preuve à Alaric. » | choix | +4 | +1 |
| La mémoire de Bois-Clair · « Faire face à l’accusation sans la nier. » | choix | +1 | +1 |
| La mémoire de Bois-Clair · « Verser 50 or aux survivants. » | choix | +2 | +1 |
| Ceux laissés derrière · « Verser 30 or au convoi déplacé. » | choix | +1 | +1 |
| Un nom à prêter · « Accepter ce soutien public. » | choix | +2 | +1 |
| Le poids d’un nom · « Financer les provisions — 35 or. » | choix | +3 | +1 |
| Le poids d’un nom · « Refuser publiquement. » | choix | -1 | -1 |
| Les réserves rendues · « Laisser la caisse aux familles suivantes. » | choix | +2 | +1 |
| Pression sur la route · « Refuser le tribut et tenir la route. » | choix | +1 | +1 |
| Le prix d’une rumeur · « Raconter publiquement la chute du clan. » | choix | +1 | +1 |
| Les noms de Bois-Clair · « Porter les noms et demander leur lecture. » | choix | +2 | +1 |
| Les noms de Bois-Clair · « Financer un mémorial local — 35 or. » | choix | +1 | +1 |
| Issue du jugement (lion_trial:voluntary) | issue du jugement | -2 | -1 |
| Issue du jugement (serpent_pursuit) | issue du jugement | +2 | +1 |
| Garde des ruines | victoire (elite) | +1 | +1 |
| Sentinelle de la vallée | victoire (elite) | +1 | +1 |
| Général Serpent | victoire (boss) | +12 | +4 |
| Duel sous les pins | victoire (elite) | +2 | +1 |
| Passage du troll | victoire (elite) | +2 | +1 |
| Défense de Bois-Clair | victoire (elite) | +10 | +3 |
| Raid sur Bois-Clair | victoire (elite) | -15 | -5 |
| Nid du jeune dragon | victoire (elite) | +2 | +1 |
| Embuscade | victoire (normal) | +1 | +0 |
| Patrouille Serpent | victoire (normal) | +1 | +0 |
| Passage des marais | victoire (normal) | +1 | +0 |
| Patrouille en sous-bois | victoire (normal) | +1 | +0 |
| Patrouille en sous-bois | victoire (normal) | +1 | +0 |
| Meute du détour | victoire (normal) | +1 | +0 |
| Meute du détour | victoire (normal) | +1 | +0 |
| Veille des ruines | victoire (normal) | +1 | +0 |
| Veille des ruines | victoire (normal) | +1 | +0 |
| Détour des marais | victoire (normal) | +1 | +0 |
| Détour des marais | victoire (normal) | +1 | +0 |
| Route de Bois-Clair | victoire (normal) | +1 | +0 |
| Ruines infestées | victoire (normal) | +1 | +0 |
| Barrage des Serpents | victoire (normal) | +1 | +0 |
| Nid venimeux | victoire (normal) | +1 | +0 |
| Affrontement des témoins | victoire (normal) | -2 | -1 |
| Meute affamée | victoire (normal) | +1 | +0 |
| Rencontre sur la route ignoré (abandonedMerchant) | contournement | -2 | -1 |
| Route des réfugiés ignoré (ignoredRefugees) | contournement | -2 | -1 |

## 5. Carte des conséquences et validateur

- **Format.** Il est décrit dans [`docs/content/consequence-map-format.md`](../content/consequence-map-format.md). Schéma : `src/campaign/consequences/ConsequenceMap.ts`, version 1.
- **Carte du Lion.** `src/campaign/consequences/lion.consequences.json` contient :
  - 64 faits, dont 8 marqueurs de déroulé ;
  - 13 choix majeurs : le mandat, les réfugiés, le marchand, le chargement perdu, les réserves, le vieux sanctuaire, Bois-Clair, les témoins, l'autel des voyageurs, l'informateur, l'autel des Ombres, la révélation des Ombres et l'intention au jugement ;
  - 28 échos réalisés : le jugement d'Alaric pour 11 choix, l'épilogue pour les autres ;
  - les deux issues, avec leurs effets de relation **proposés**. L'honneur rend le Lion allié et le Serpent ennemi. La force laisse le Lion neutre (« Alaric accepte le résultat ») et le Serpent ennemi. Le Serpent reste toujours le finaliste du Tournoi (F2).
- **Validateur.** `src/game/narrativeCoherence.ts`, par `npm test` et `npm run narrative:validate`. Il reprend l'audit des 75 dialogues (liens, acteurs, atteignabilité, caractères) et ajoute les règles de la carte. Neuf cas négatifs prouvent qu'il échoue sur chaque règle.
- **Ce que vérifie un écho.** Le validateur construit la scène avec le fait et y trouve la phrase qui nomme la cause. Il la reconstruit sans le fait, et la phrase disparaît.
- **Résultat sur le Lion.** 0 erreur, 29 exceptions motivées :
  - les 4 anciens dialogues jamais montrés de la décision C8 du 2026-11-04 : `roadside_peddler`, `mystery_ambush`, `serpent_duelist_trial`, `mystery_troll_crossing` ;
  - 25 faits posés et jamais relus. Ce sont les candidats naturels aux échos de l'après-démo :
    - les 17 issues d'événements de refuge (`r4*`, `r5*`) ; seule la liste des morts portée a déjà un écho au jugement ;
    - le choix du nid du jeune dragon, lu par la présentation seule ;
    - `alaricDoubt`, posé à l'audience et au rejet de la revendication, que rien ne relit ;
    - le contournement des réfugiés (`ignoredRefugees`) ;
    - `lionSealHonour` et `lionSealAcknowledged`, que la clôture du Lion lira au Lot 1 ;
    - trois marqueurs de déroulé.

## 6. Points à trancher (arrêt du Lot 0)

1. **Montants.** Approuver la règle des montants du Lion (×0,3, signe gardé, au moins 1, victoires ordinaires à 0), ou la modifier.
2. **Seuils.** Approuver les seuils proposés (Cedric 27, Garen 24, témoins 35, crédibilité 33 et 42) ou préférer la proportion simple (27, 26, 35, 35, 42). Le seuil de Garen à 15 manquait à la liste du 2026-11-07 ; il est traité comme les autres.
3. **Troisième plateau.** Confirmer que « Renommé vers le troisième plateau » désigne le Dragon, le Lion comptant comme premier plateau.
4. **Budgets.** Approuver les budgets des plateaux suivants (Ours 16/13, Dragon 12/10, Scorpion 6/4, acte final 4/3).
5. **Relations du Lion.** Approuver ou corriger les effets de relation des issues du Lion :
   - honneur : Lion allié, Serpent ennemi ;
   - force : Lion neutre, Serpent ennemi.
6. **Application de l'étalonnage.** Une fois approuvé, il s'applique sur `post-demo` à toutes les sources du tableau 4.5 et aux cinq seuils. L'aperçu des choix affiche alors les nouveaux montants. Il faudra décider comment la démo figée garde ses valeurs quand un plateau entrera dans `dev`. Proposition : figer la démo par une étiquette avant la première intégration, ou garder un réglage d'édition « démo ou jeu complet » qui vaut « démo » par défaut.
7. **Format de la carte.** Approuver le format de la carte des conséquences avant que la carte de l'Ours ne s'écrive, au début du Lot 1.

## 7. Vérifications

- **`npm test`.** vitest compte 188 fichiers et 3 056 tests : 3 023 passent, 23 sont ignorés et 10 échouent. Ce sont les 10 échecs connus ci-dessous, les mêmes que sur la référence (183 fichiers, 2 985 tests). Le lot ajoute 5 fichiers et 71 tests, tous verts. Tous les nouveaux tests passent : registre 7, enregistrement de campagne 15, relations et R4 24, bornes de réputation 13, cohérence narrative 12.
- **Les 10 échecs connus.** Ils existent déjà sur `origin/dev` intact dans un clone neuf, avant toute modification : `src/combat/vfx/spritesheetPng.test.ts` (5), `tools/cinematics/cin6ea3_pilot_e_regate.test.mjs` (4), `tools/cinematics/cin4_media.test.mjs` (1). Ces tests lisent des fichiers absents du dépôt : PNG megapack non versionnés, sorties ignorées sous `tmp/`, un chemin Windows. Ils ne dépendent pas de ce lot.
- **Autres portes.** `node --test tools/qa/qa-job.test.mjs` : 26 tests sur 26 (lancé à part, car `npm test` s’arrête au premier échec vitest) ; `npx tsc --noEmit` : vert ; `npm run build` : vert ; `npm run contracts:validate` : vert (8 contrats verrouillés) ; porte du verrou documentaire sur `6c965169` : rien d’imprimé ; `npm run narrative:validate` : ok (carte du Lion, 0 erreur) ; `npm run cinematics:validate-narrative-staging` : ok (75 dialogues, 256 étapes).

## 8. Suite

Au Lot 1, après ta réponse :
1. Fusionner `dev` dans `post-demo`.
2. Appliquer l'étalonnage approuvé.
3. Brancher la clôture du Lion vers l'Ours : issue, relations et chapitre suivant.
4. Écrire d'abord la carte des conséquences de l'Ours, avant toute réplique.
5. Construire ensuite le plateau en brouillons.

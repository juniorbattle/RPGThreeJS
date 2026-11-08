# Brief de la session cloud — l'après-démo

Ce brief est écrit pour une longue session Claude qui part de `origin/dev` et construit la suite de « La Voie des Sceaux » après la démo du Lion. Il applique la décision [OD-2026-11-07-I](POST_DEMO_DIRECTION_OPERATOR_DECISION_2026-11-07.md). Il ne remplace ni `AGENTS.md`, ni les contrats, ni les décisions de l'opérateur. En cas d'écart, ces documents priment ; la session le signale et s'arrête sur le point en cause.

## 0. Condition de départ

- **Contrats.** La session ne commence que si `docs/contracts/contracts.manifest.json` porte le jeu 1.20.0 ou plus, c'est-à-dire l'amendement-cadre de l'après-démo approuvé par l'opérateur et appliqué.
  - Sinon, elle s'arrête sans rien modifier et le dit.
  - La porte du verrou documentaire (`git diff --exit-code <baseline> HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md`) se lance avec la baseline immuable que cet amendement inscrit dans `AGENTS.md`.
- **Lectures, dans cet ordre :**
  - `AGENTS.md` ;
  - `docs/game/GAME_CONSTITUTION.md`, puis `docs/contracts/README.md`, le manifeste et chaque contrat concerné ;
  - `docs/autonomy/OPERATOR_DECISIONS.md`, `POST_DEMO_DIRECTION_OPERATOR_DECISION_2026-11-07.md` et ce brief ;
  - `docs/content/feuille_de_route_narrative_condensee.md`, avec son statut en tête ;
  - `docs/autonomy/AUTONOMOUS_WORK_STATE.md`.
- **Branche.** La session travaille sur une branche `post-demo` créée depuis `dev`, et pousse chaque étape verte.
  - Elle ne pousse jamais sur `main`, et sur `dev` seulement quand l'opérateur l'ordonne pour intégrer un plateau accepté.
  - Au début de chaque lot, elle fusionne `dev` dans `post-demo` pour reprendre les corrections de la démo faites en local.
  - Le verrou `.git/codex-autonomy.lock` est local à la machine de l'opérateur et ne s'applique pas dans le cloud. Pendant la session, aucun autre agent n'écrit sur `post-demo`.
- **Secrets.** Aucun secret n'est lu ni écrit : ni `.env*`, ni jeton, ni clé.
  - Aucune image, aucune vidéo ni aucun son n'est généré par un service externe.
  - Les images restent provisoires (section 6), et la musique comme les ambiances restent produites par le code (section 7).

## 1. Le principe de l'opérateur

> « la narration doit être structurée et cohérente car c'est le point principal de notre jeu, les choix et les répercussions… en plus de notre système de combat entraînant »

Chaque plateau se juge d'abord à cette aune :

- **Des choix qui pèsent.**
  - Chaque choix important laisse un fait durable, sauvegardé et possédé par `RunSystem`.
  - Ce fait a au moins une répercussion visible plus tard : dans le même plateau, dans un plateau suivant, au Tournoi, dans la phase finale ou à l'épilogue.
- **Des répercussions expliquées.** Aucune conséquence n'arrive sans un choix qui l'explique. La scène qui la montre en nomme la cause, comme le jugement d'Alaric le fait déjà pour Bois-Clair, les témoins et les Ombres.
- **De la cohérence :**
  - les faits de la démo priment sur la feuille de route ;
  - Alistair, Séraphine (la Sage), Maelor (le futur Fou), Marian, Kestrel et la compagnie gardent leur voix ;
  - les conseils de Maelor s'assombrissent de plateau en plateau, sans le trahir avant le Tournoi ;
  - les démons restent sans nom avant la brèche.
- **Un combat entraînant.**
  - Chaque plateau a ses adversaires, ses défis, ses gardiens et ses boss, au service de son récit.
  - Le système tactique actuel reste le socle : quatre héros au plus, PA, déplacement, paliers d'armes T1 à T3.

## 2. Ce qui est décidé (OD-2026-11-07-I)

### Réputation

- **R1.** La jauge de 0 à 100 ne change pas : départ à 30, cinq paliers, effets actuels.
  - S'y ajoute une relation durable avec chaque clan rencontré : allié, neutre ou ennemi.
  - Elle découle surtout de l'issue de chaque plateau, puis de quelques choix.
- **R2.** La jauge passe d'un plateau à l'autre sans remise à zéro. Les plateaux suivants ont des montants plus petits.
- **Étalonnage, Lot 0.**
  - Les montants du Lion et ses seuils sont réétalonnés dans l'après-démo. La démo figée garde ses valeurs. Les seuils sont aujourd'hui : Cedric à 20, escorte des témoins à 45, crédibilité devant Alaric à 45 et 70.
  - Objectifs : un parcours parfait atteint 100 à la fin du jeu et pas avant ; un joueur d'honneur constant atteint Renommé, 80, vers le troisième plateau.
  - Mesure de départ, 2026-11-07 : le Lion offre aujourd'hui de +85 à +93 points sur la voie de l'honneur et touche 100 avant le jugement.
  - Un test calcule ces bornes à partir du contenu et échoue si elles ne tiennent plus.
- **R3.** Dans chaque plateau, les quatre effets actuels restent :
  - les prix de l'échoppe et de la forge ;
  - les choix verrouillés par la réputation ;
  - la crédibilité devant le chef du plateau, comme devant Alaric ;
  - la couleur des événements des refuges.

  Les relations ajoutent leurs effets au Tournoi et dans la phase finale. La réputation ne donne aucun bonus de statistiques en combat.
- **R4.** La fin suit les issues des quatre plateaux (voie de l'honneur ou voie de la force) :
  - trois ou quatre fois l'honneur donnent le Respect, sauf si la jauge est sous 40 : alors l'Équilibre ;
  - trois ou quatre fois la force donnent la Crainte, sauf si la jauge est à 60 ou plus : alors l'Équilibre ;
  - deux et deux donnent l'Équilibre.

  Dans le Lion, l'honneur correspond à la route `serpent_pursuit`, la force à la route `lion_trial`.

### Plateaux

- **P1.** Trois plateaux après le Lion, pour quatre Sceaux. Ils sont livrés un par un : l'opérateur juge chacun avant que le suivant soit construit.
- **P2 et P3.** L'ordre est fixe :
  - l'Ours contre le Corbeau, dans les Montagnes de la Résilience (§3.2) ;
  - le Dragon contre le Loup, dans les Pics Célestes (§3.3) ;
  - le Scorpion contre le Phénix, dans les Déserts Arides (§3.4).

  Le plateau du Phénix (§3.5) est retiré. Le Phénix reste le clan adverse du Scorpion.
- **P4.** Chaque plateau suit le gabarit du Lion :
  - trois régions de carte de lieux, des refuges et leurs services ;
  - des bifurcations exclusives avec engagement jusqu'à la résolution du chapitre ;
  - des défis à condition et à prime, des gardiens fixes combattus en vagues ;
  - une voie de l'honneur à deux boss et une voie de la force à un boss (§2.3).

  Le nombre de lieux suit la durée de la démo mesurée par l'opérateur. Tant qu'il ne l'a pas donnée, la session prend le gabarit du Lion.
- **P5.** Le chef Scorpion sera renommé. Tant que l'opérateur n'a pas validé un nom, les textes le désignent par son titre, « le Grand Inquisiteur », et jamais par « Kael ».

### Phase finale

- **F1.** Un seul acte final en trois temps :
  - le Tournoi des Grands, en combats d'arène présentés par un tableau des rencontres ;
  - la fuite de l'arène puis la capitale corrompue, sur une petite carte de lieux ;
  - le combat final à la brèche.
- **F2.** L'adversaire de la finale du Tournoi est toujours le Serpent. Son champion se change en démon quand la brèche s'ouvre.
- **F3.** Chaque clan allié apporte un soutien : une aide utilisable une fois par combat de l'acte final, annoncée au déploiement. Chaque clan ennemi ajoute des adversaires. Les chefs alliés paraissent dans les tableaux, pas comme héros jouables. Le détail des aides est soumis à l'opérateur.
- **F4.** Maelor ouvre la brèche au Tournoi, s'enfuit par elle et forme la première phase du combat final. L'entité forme la phase suivante ; elle reste sans nom ni histoire propre tant que l'opérateur n'en décide pas.
- **Tableaux vivants.** Ils ne jouent que sur un tableau approuvé : tant que le tableau est provisoire, le moment passe directement à son dialogue. Chaque plateau propose sa table des moments (arrivée, deux issues), et l'acte final la sienne (trahison au Tournoi, épilogues). L'opérateur l'approuve.
- **F5.** Trois épilogues en tableaux vivants : le Respect, la Crainte et l'Équilibre. Dans la Fin de la Crainte, le joueur choisit entre un dernier combat de survie contre les clans et l'acceptation de son destin.

## 3. L'ordre du travail

Chaque lot se termine vert : suite complète, types, build, validateur des contrats et porte du verrou documentaire. La session pousse sur `post-demo` et met à jour l'état (section 8).

### Lot 0 — Fondations, sans contenu nouveau

1. **Plateaux.** Le code propre au Lion passe derrière un registre de plateaux : identifiants durables, cartes, nœuds canoniques, bifurcations engagées, refuges, défis, gardiens, verdict.
   - Le Lion joue exactement comme avant ; ses tests restent verts.
   - Les nouveaux identifiants ont leur propre préfixe (`bear-`, `dragon-`, `scorpion-`, `finale-`). Aucun identifiant existant ne change.
2. **Sauvegardes.** Les nouveaux faits durables (relations de clan, progression des plateaux, issues, soutiens) entrent dans la sauvegarde versionnée avec une migration testée. Une sauvegarde V6 de la démo se charge et continue. Rien de visuel ni de transitoire n'est sauvegardé.
3. **Relations de clan et réputation.**
   - `RunSystem` possède les relations.
   - Le Lion est réétalonné vers les objectifs de la section 2, et le test des bornes de réputation est écrit.
   - Le réétalonnage change des jugements d'Alaric. Les nouveaux montants et seuils sont donc présentés à l'opérateur dans le paquet du Lot 0.
4. **Outils de cohérence narrative.**
   - **Carte des conséquences.** Chaque plateau a un fichier de données versionné qui relie chaque choix important au fait qu'il pose, à son effet sur la réputation et sur les relations, et aux scènes qui en font écho plus tard.
   - **Validateur.** Il échoue si un fait posé n'est jamais lu, si un fait lu n'est jamais posé, si un choix important n'a aucun écho, ou si un écho ne nomme pas sa cause. Il échoue aussi sur un lien de dialogue rompu, un acteur inconnu ou une étape inatteignable.
   - **Reprise de l'audit.** Ces contrôles reprennent ceux de l'audit des 75 dialogues de la passe narrative du 2026-11-04.
5. **Paquet du Lot 0 :**
   - un rapport ;
   - le tableau des nouveaux montants et seuils du Lion ;
   - le format de la carte des conséquences.

   **Arrêt :** la session attend la réponse de l'opérateur.

### Lots 1, 2 et 3 — l'Ours, le Dragon, le Scorpion

Pour chaque plateau, dans cet ordre :

1. **Carte des conséquences d'abord, avant toute réplique.** Elle couvre :
   - les choix de l'entrée, de l'exploration et de la confrontation ;
   - les déclencheurs des deux voies ;
   - les relations qui en découlent, par exemple le clan hôte allié sur la voie de l'honneur ;
   - les échos prévus dans les plateaux suivants, au Tournoi, dans l'acte final et dans les épilogues ;
   - les échos des plateaux précédents, dont le Lion : Bois-Clair, les témoins, les Ombres, l'avidité.
2. **Carte et rencontres.**
   - Trois régions de lieux, refuges, bifurcations engagées, deux défis au moins et deux gardiens en vagues.
   - Des familles d'ennemis propres au plateau : les clans du §3, la faune et les créatures corrompues qu'il cite.
   - Chaque nouvelle compétence ennemie a sa signature procédurale, comme dans `src/combat/fx/fxSkills.ts`.
3. **Boss.** Sur la voie de l'honneur, le chef du camp adverse, puis l'agent des Ombres que nomme le §3. Sur la voie de la force, le chef du plateau et ses gardes.
4. **Dialogues en brouillons**, écrits depuis la feuille de route et les faits déjà établis seulement.
   - Aucun clan, lieu, personnage, objet ou fait d'histoire qui n'y figure pas. Un manque se signale, il ne s'invente pas.
   - Les brouillons sont jouables sur `post-demo` et reconnaissables comme tels dans le code (une liste ou un marqueur).
5. **Images provisoires** clairement marquées, avec la liste exacte des images finales à créer (section 6).
6. **Vérification.**
   - Les deux voies sont jouées de bout en bout par un pilote de QA.
   - Le validateur de cohérence et le test des bornes de réputation passent.
   - Un contrôle navigateur est fait sur un serveur lancé par la session.
7. **Paquet du plateau :**
   - le rapport ;
   - la carte des conséquences ;
   - la fiche des textes : chaque dialogue, ses choix et leurs effets, pour validation ;
   - la liste des images ;
   - la manière de jouer le plateau depuis une sauvegarde de la fin du Lion ou du plateau précédent.

   **Arrêt :** la session attend que l'opérateur accepte le plateau ou demande des retouches. Aucun texte ne devient canon sans son accord. Sur son ordre, elle intègre le plateau à `dev`.

### Lot 4 — l'acte final

- Le Tournoi : son tableau des rencontres, des combats d'arène contre des clans non visités ou des clans ennemis, et la finale contre le champion Serpent.
- La trahison de Maelor et la brèche.
- La fuite et la capitale corrompue sur une petite carte de lieux.
- Le combat final : Maelor, puis l'entité.
- Les soutiens des clans alliés et les adversaires des clans ennemis.
- Même paquet et même arrêt que pour un plateau.

### Lot 5 — les fins et le parcours complet

- Les trois épilogues en tableaux vivants et le choix de la Fin de la Crainte.
- La règle R4 de bout en bout.
- Des parcours complets simulés (tout honneur, toute force, deux et deux, cas limites de la jauge) qui atteignent chacun la fin attendue.
- Paquet et arrêt.

## 4. Règles d'écriture

- **Sources.**
  - Les sections §2 et §3.2 à §3.4, §3.6 et §3.7 de la feuille de route.
  - Son statut en tête.
  - Les faits de la démo : `src/game/content.ts`, `campaignGrammarContent.ts`, `lionFinale.ts`, `lionVerdict.ts`.
  - La passe narrative, OD-2026-11-04-C.
- **Ce qui reste à l'opérateur :**
  - le nom du chef Scorpion ;
  - le nom et la nature de l'entité ;
  - le Voyageur mystérieux, annoncé « après la démo » mais pas encore cadré ;
  - toute réplique, tout choix, toute issue et toute récompense, qu'il valide par plateau ;
  - toute contradiction de la feuille de route qu'aucune décision ne règle.
- **Forme.**
  - Les répliques suivent la langue de la démo : français, phrases tenues, aucun anachronisme.
  - Quatre acteurs visibles au plus par tableau.
  - Chaque choix montre son aperçu de conséquences, comme dans la démo (`outcomePreview`).
  - Les échos nomment leur cause, comme le jugement d'Alaric.

## 5. Combat

- Le combat tactique résout tout. La présentation (arène, caméra, effets, sons) montre seulement ce qui est résolu.
- Quatre héros au plus.
- Les Ultimes restent fermés tant que l'opérateur n'en décide pas.
- Les défis gardent leur forme : une condition annoncée et une prime, que `RunSystem` crédite. Les gardiens se combattent en vagues de la même formation, sans soin entre les vagues.
- Le combat final a deux phases, Maelor puis l'entité, enchaînées comme les vagues, sans résultat intermédiaire. Des phases pour un autre boss sont une règle nouvelle, à proposer.
- Les soutiens de clan sont des faits de `RunSystem` lus par le combat : utilisables une fois, annoncés au déploiement.
- Toute règle de combat nouvelle reste dans les limites que l'amendement 1.20.0 fixe. Une règle qui en sort est proposée à l'opérateur, pas construite.

## 6. Images

- **Images provisoires.** La session ne génère aucune image.
  - Les plateaux utilisent des images provisoires marquées comme telles dans les registres d'art : décors et atlas du Lion repris ou recadrés, silhouettes, portraits génériques.
  - Les arènes de combat sont dessinées en code, avec une déclinaison par biome.
- **Liste à créer, pour chaque plateau :**
  - trois atlas de carte ;
  - les fonds de tableaux ;
  - les portraits des chefs et des agents des Ombres ;
  - les sprites des familles d'ennemis ;
  - les illustrations des épilogues.

  Les images finales forment un lot à part, mené avec l'opérateur.

## 7. Son

- La musique, les ambiances et les signatures sonores restent produites par le code, dans le cadre des jeux 1.11.0 et 1.12.0.
- L'amendement 1.20.0 ajoute une ambiance par nouveau biome, si l'opérateur l'a gardée.
- La table des sons garde ses limites (160 identités, 32 Mo, 50 ms). Les signatures des nouveaux boss et tout dépassement sont proposés à l'opérateur.
- Aucune voix, aucun fichier externe.

## 8. Suivi et rapports

- **État.** `docs/autonomy/AUTONOMOUS_WORK_STATE.md` et `.json` sont tenus à jour à chaque lot.
- **Rapports.** Chaque lot a son rapport daté dans `docs/reports/`, selon `docs/reports/README.md`.
- **Décisions.** Une décision de l'opérateur entre dans `docs/autonomy/OPERATOR_DECISIONS.md` avec son document daté, jamais une décision de la session.
- **Commits.** Une ligne impérative, puis la ligne `Agent: claude; Run: claude-postdemo-<lot>-<YYYYMMDDTHHMMZ>`, puis la ligne `Co-Authored-By` de Claude.
- **Arrêts.** La session s'arrête et attend l'opérateur :
  - à l'acceptation de chaque plateau et à la fin de chaque lot ;
  - devant un nom, un fait d'histoire ou une contradiction qu'aucune décision ne règle ;
  - devant une règle qui sort de l'amendement 1.20.0 ;
  - devant une opération Git destructive ;
  - devant tout accès qui demanderait un secret.
- **Fin de session.** Elle arrête les serveurs et les tâches qu'elle a lancés.

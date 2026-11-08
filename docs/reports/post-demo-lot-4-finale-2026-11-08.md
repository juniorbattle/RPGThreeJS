# Après-démo, Lot 4 — l’acte final (brouillon jouable)

| Champ | Valeur |
| --- | --- |
| TASK | POST-DEMO-LOT-4-FINALE |
| DOMAIN | Campagne (acte final, passage du Scorpion à l’acte final, relations), tableau des rencontres, contenu brouillon, combat (phases, soutiens, adversaires de clan), présentation provisoire, outils de QA |
| BASELINE | `9adfaf6b` sur `post-demo` (Scorpion accepté, OD-2026-11-08-D ; jeu de contrats 1.20.0, baseline immuable `6c965169c2dc153cafd5a8609d914cf8de723ff3`) |
| BRANCH | `post-demo` |
| HEAD | voir le commit de clôture du lot (ce rapport et l’état) |
| STATUS | brouillon jouable, en attente de l’acceptation de l’opérateur |
| MERGED_IN | NONE |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Sur `post-demo` seulement. À la fin d’une chronique du Scorpion, « Continuer : L’acte final (brouillon) » ouvre l’acte final, qui se joue du Tournoi jusqu’à la brèche. Tout son contenu est marqué brouillon ; toutes ses images sont provisoires et marquées. L’Ours, le Dragon et le Scorpion, acceptés, ne changent pas ; la démo sur `dev` non plus. Les épilogues (Lot 5) ne sont pas construits : après la brèche, la chronique s’arrête avec un enregistrement complet. |
| CANONICAL_DOCS_UPDATED | `docs/autonomy/AUTONOMOUS_WORK_STATE.md` et `.json` ; aucun document canonique de contenu : l’acte final reste un brouillon jusqu’à ton accord. |
| EVIDENCE | Suite vitest et `node:test`, types, build, validateur des contrats, porte du verrou documentaire, `narrative:validate` (Lion, Ours, Dragon, Scorpion, acte final), pilote de QA des deux voies, contrôle navigateur sur un serveur lancé puis arrêté par la session (section 8). Captures dans le dossier de travail de la session, non promues. |

Session cloud de l’après-démo, run `claude-postdemo-lot4-20261108T2245Z`. Elle suit [le brief](../autonomy/POST_DEMO_CLOUD_SESSION_BRIEF.md), [OD-2026-11-07-I](../autonomy/POST_DEMO_DIRECTION_OPERATOR_DECISION_2026-11-07.md) (F1 à F4), [OD-2026-11-08-A](../autonomy/POST_DEMO_LOT_0_OPERATOR_DECISION_2026-11-08.md), [OD-2026-11-08-B](../autonomy/POST_DEMO_LOT_1_OPERATOR_DECISION_2026-11-08.md), [OD-2026-11-08-C](../autonomy/POST_DEMO_LOT_2_OPERATOR_DECISION_2026-11-08.md) et [OD-2026-11-08-D](../autonomy/POST_DEMO_LOT_3_OPERATOR_DECISION_2026-11-08.md).

## Résumé

- **L’acte final est jouable**, en brouillon, en trois temps (§3.6, §3.7) : le Tournoi des Grands sur un tableau des rencontres, la trahison de Maelor et la brèche au cœur de l’arène, puis la fuite par la capitale corrompue jusqu’au combat final en deux phases.
- **La narration d’abord.** La carte des conséquences de l’acte final a été écrite et poussée avant toute réplique (`3d52f321`). Chacun de ses 5 choix est repris plus tard par une scène qui en nomme la cause.
- **Les quatre plateaux reviennent.** Le ralliement nomme chaque chef selon l’issue de son plateau ; la dernière veillée réunit les preuves des Ombres rapportées des quatre plateaux ; la trahison nomme les conseils de Maelor que la compagnie a suivis. 17 échos des cartes du Lion, de l’Ours, du Dragon et du Scorpion sont maintenant en jeu, et plus aucun n’est prévu sans être écrit.
- **Le Tournoi** se joue sur un tableau, pas sur une carte : le Corbeau, le Loup, le Phénix, puis le Serpent en finale (F1). Après chaque combat, relever le champion vaincu fait de son clan un allié inattendu ; l’humilier, comme le pousse Maelor, en fait un ennemi.
- **Les clans pèsent au combat** (F3, proposé) : avant chaque combat de l’acte final, `RunSystem` lit les relations sauvegardées. Chaque clan allié offre un soutien, utilisable une fois ; chaque clan ennemi ajoute un adversaire. Rien de cela n’est sauvegardé.
- **Le combat final a deux phases** : Maelor, puis l’entité qui le suit hors de la brèche, sans nom et sans réplique (F4). C’est le seul combat à phases du jeu.
- **Réputation mesurée** : +4 au mieux, +3 pour une conduite d’honneur constante, le budget prévu. Seule une partie parfaite atteint 100, et seulement ici.
- **Vérifié** : pilote des deux voies depuis des fins du Scorpion jouées par le pilote, validateur complet des cinq cartes, bornes, contrôle navigateur. Deux défauts trouvés et corrigés pendant la vérification (section 8).

## 1. Ce qui est construit

### Le Tournoi des Grands (tableau des rencontres)

| Ordre | Rencontre | Combat | Après le combat |
| --- | --- | --- | --- |
| 1 | Champion du Corbeau | élite : champion du Corbeau et éclaireur | verdict : relever ou humilier |
| 2 | Champion du Loup | élite : champion du Loup et chasseur | verdict |
| 3 | Champion du Phénix | élite : champion du Phénix et gardien | verdict |
| 4 | Finale : champion du Serpent | boss : champion du Serpent et pillard | la trahison de Maelor ; la brèche s’ouvre |
| 5 | La brèche s’ouvre | boss : le champion changé en démon et deux démons | couvrir la fuite des civils ou fuir par les tribunes |

- Le tableau n’est pas une carte des POI ni un second mode de navigation. `RunSystem` le lit dans les faits sauvegardés (`src/game/finalAct.ts`) : chaque rencontre dit son ordre, son état (« Terminé », « Prochain combat », « Verdict à rendre », « À venir ») et son résultat en toutes lettres, jamais par la couleur seule. Un seul bouton mène à l’étape que `RunSystem` nomme ensuite. Boutons natifs (clavier, manette), une colonne à la largeur d’un téléphone.
- Une partie sauvegardée au milieu du Tournoi reprend sur le tableau, à la bonne rencontre.

### La capitale corrompue (petite carte des POI)

| Lieux de la route | Facultatifs | Refuge |
| --- | --- | --- |
| Portes de l’arène, Rues en flammes, Ralliement des clans, puis au choix Habitants sous les décombres ou Place des démons, Dernière veillée, La brèche | Armurerie pillée, Maisons effondrées (combat), Marché abandonné, Réserve des remparts (coffre gardé) | Dernière veillée, avec ses services |

- Mêmes règles que les plateaux : déplacement de proche en proche, chaque lieu une seule fois, une bifurcation engagée, voyage vers les lieux résolus.
- **Gardien** : le Démon des remparts garde la réserve, en deux vagues (défi : 3 héros au plus).
- **Défi** : la Place des démons se gagne sans objets pour la prime.

### Combats et familles

- **Familles** (§3.6, §3.7) : les champions des clans rivaux au Tournoi, le champion du Serpent en finale, les démons sortis de la brèche (sans nom, comme dans la feuille de route), un démon massif dans la capitale, Maelor, puis l’entité.
- **Boss** : le champion du Serpent ; le champion changé en démon ; à la brèche, Maelor (phase 1) puis l’entité de la brèche (phase 2). La deuxième phase entre dès que la première tombe, sans soin entre les deux ; le déploiement l’annonce (« 2 phases »). Aucune nouvelle compétence : chaque ennemi utilise des compétences qui ont déjà leur signature d’effets, et un test le vérifie.
- **Dialogues** : 15 scènes en brouillon, dont 3 construites selon l’état (la trahison, le ralliement, la veillée). Aucun clan, lieu, personnage ou objet nouveau ; la capitale, les hôtes de l’arène et les démons restent sans nom ; l’entité ne dit rien. Texte complet dans [la fiche de texte](post-demo-lot-4-finale-text-sheet-2026-11-08.md).

### Soutiens des clans alliés et adversaires des clans ennemis (F3, proposés)

| Clan | Soutien s’il est allié | Effet (compétence existante, non ultime) | Adversaire s’il est ennemi |
| --- | --- | --- | --- |
| Lion | Lames du Lion | Tourbillon d’Acier (dégâts, 4 PA) | — (jamais ennemi) |
| Ours | Rempart de l’Ours | Rempart du Serment (protection, 4 PA) | guerrier de l’Ours |
| Dragon | Sanctuaire du Dragon | Sanctuaire (soin, 4 PA) | gardien du Dragon |
| Scorpion | Sceau des érudits | Sceau d’Entrave (altération, 4 PA) | érudit du Scorpion |
| Corbeau | Fumée du Corbeau | Bombe Fumigène (altération, 4 PA) | éclaireur du Corbeau |
| Loup | Piège du Loup | Mâchoire à Ressort (dégâts, 4 PA) | pillard du Loup |
| Phénix | Flamme purificatrice | Purification (soin, 3 PA) | gardien du Phénix |
| Serpent | — (toujours finaliste) | — | pillard du Serpent |

- **Soutiens** : au déploiement, la note « Soutiens » liste ceux du combat. En combat, l’action « Soutien » ouvre le menu des soutiens restants ; le héros actif lance celui qu’il choisit, au coût de la compétence en PA. Chacun sert une fois par combat. Au Tournoi, le clan affronté ne soutient pas.
- **Adversaires** : au Tournoi, seul le clan affronté ajoute le sien (un clan ennemi y est un adversaire redoutable, §3.6) ; dans l’arène en flammes, aucun (les démons) ; dans la capitale et à la brèche, tous les clans ennemis, dans l’ordre où la compagnie les a rencontrés, dans la limite des places libres (quatre adversaires, ou un boss et trois escortes).
- Exemples mesurés par le pilote : une compagnie d’honneur a sept alliés et le Serpent pour seul ennemi ; la brèche lui oppose Maelor, un démon et un pillard du Serpent, avec sept soutiens. Une compagnie de force a sept ennemis et le Lion neutre ; les rues en flammes lui opposent deux démons, un guerrier de l’Ours et un éclaireur du Corbeau, sans aucun soutien.

## 2. La carte des conséquences

Fichier : [`src/campaign/consequences/finale.consequences.json`](../../src/campaign/consequences/finale.consequences.json). Statut : brouillon. Écrite et poussée avant toute réplique (commit `3d52f321`).

**Format.** L’acte final n’a pas d’issue d’honneur ou de force comme un plateau : il s’achève à la brèche, et les fins viennent au Lot 5. Le schéma de campagne (`campaignConsequenceMapSchema`) accepte donc une carte sans issues pour l’acte final seulement ; toute autre carte doit toujours en déclarer. Le format v1 ne change pas pour les plateaux.

| Choix majeur | Lieu | Options (fait, réputation, relation) |
| --- | --- | --- |
| Verdict du Corbeau | Tournoi, après le combat | relever le champion (0, Corbeau allié) ; l’humilier (−1, Corbeau ennemi) |
| Verdict du Loup | Tournoi, après le combat | relever (0, Loup allié) ; humilier (−1, Loup ennemi) |
| Verdict du Phénix | Tournoi, après le combat | relever (0, Phénix allié) ; humilier (−1, Phénix ennemi) |
| Les civils | La brèche s’ouvre | couvrir leur fuite (+1) ; fuir par les tribunes (−2) |
| Les habitants | Habitants sous les décombres (branche) | les dégager (+1) ; les laisser (−1) |

**Le verdict l’emporte.** La relation fixée au Tournoi remplace celle des plateaux (cause `finale.tournament.<clan>`) : un Corbeau devenu ennemi à l’Ours peut redevenir allié s’il est relevé ; un Phénix allié par le serment devient ennemi s’il est humilié.

**Échos.** 10 échos en jeu dans l’acte final (le ralliement nomme chaque champion relevé ou humilié ; la veillée nomme les civils et les habitants), 2 prévus pour l’épilogue (Lot 5). **Échos des plateaux** (17, tous en jeu) :

- au ralliement, chaque chef selon l’issue de son plateau : « les guerriers d’Alaric tiennent parole » ou « Alaric garde ses guerriers loin de nous » ; Borin, Kaelen et le Grand Inquisiteur « tiennent parole » ou leurs guerriers « n’ont pas oublié » ;
- à la veillée, les preuves des Ombres : celles confiées à Alaric ou gardées depuis les plaines, l’éclat des mines de l’Ours, l’éclat de la souillure du Cristal, la page souillée du codex ;
- à la trahison, les conseils de Maelor suivis : le filon sombre, le Cristal et le codex gardés pour le clan, la page souillée brûlée.

**Les conseils de Maelor.** À la trahison, Maelor nomme ce que la compagnie a fait sur son conseil, aux plateaux et au Tournoi (« Et dans cette arène encore, les champions du Corbeau, du Loup et du Phénix humiliés devant les clans »). Une compagnie qui ne l’a jamais suivi s’entend dire « Vous ne m’avez jamais écouté ».

## 3. Réputation

| Mesure | Acte final | Budget prévu |
| --- | --- | --- |
| Partie parfaite (route + gardien) | +4 (route +3, gardien +1) | 4 |
| Conduite d’honneur constante | +3 | 3 |
| Pire route | −5 (les choix −6, la victoire à la brèche +1) | — |

Sources : les civils couverts (+1), les habitants dégagés (+1), la victoire à la brèche (+1), le gardien des remparts (+1). Les verdicts ne donnent rien quand on relève le champion : la récompense est l’allié. Projection mesurée sur tout le jeu : honneur constant 57 après le Lion, 71 après l’Ours, 81 après le Dragon, 85 après le Scorpion, **88 à la fin de l’acte final** ; partie parfaite 96 après le Scorpion, **100 seulement à l’acte final**. Le pilote retrouve exactement +4 sur la partie parfaite.

## 4. Passage du Scorpion à l’acte final, et ce qui change ailleurs

- À la fin de l’épilogue du Scorpion, `RunSystem` enregistre l’issue et les relations approuvées du Scorpion, puis l’écran de fin propose « Continuer : L’acte final (brouillon) ». L’acte final s’ouvre sur la scène du Tournoi, puis sur le tableau.
- Quand le Tournoi est fini, la capitale s’ouvre sur sa carte. Après la brèche, `RunSystem` clôt l’acte final (fin `finale-breach`) ; la chronique s’arrête sans suite jusqu’aux épilogues.
- **Validateur de cohérence** : il lit le tableau du Tournoi (ses dialogues, ses combats, ses faits de victoire), le combat d’un lieu de boss et la scène de clôture.
- **Bornes de réputation** : l’outil mesure l’acte final (le tableau d’abord, puis la capitale) ; le test de projection mesure maintenant les cinq chapitres.
- **Pilote de QA commun** : il joue le Tournoi par le tableau et enregistre la configuration de chaque combat (soutiens, adversaires).
- **Fiche de texte** : l’outil imprime le tableau, la scène de clôture, les phases et la table des soutiens et adversaires.
- **Combat** : le moteur sait jouer un combat à deux phases et des soutiens de clan (action « Soutien ») ; les combats existants n’en ont pas et ne changent pas, ce que vérifient leurs tests.
- **Laboratoire QA** : deux boutons « Acte final (brouillon) » s’ajoutent.
- **Cartes du Lion, de l’Ours, du Dragon et du Scorpion** : leurs échos de l’acte final passent de « prévus » à « en jeu ». Aucune réplique de ces plateaux ne change.
- Un type élargi sans effet (`LionPoiAuthoring`, région d’un gardien) et le cadrage de trois portraits provisoires dans l’interface de combat.

## 5. Ce qui reste à décider (fiche)

1. **Accepter l’acte final comme canon**, ou demander des retouches.
2. **Les verdicts du Tournoi** (proposés) : relever le champion fait de son clan un allié ; l’humilier en fait un ennemi (−1), et cette relation remplace celle des plateaux.
3. **Les soutiens des clans alliés** (F3, proposés) : un par clan allié, une fois par combat, par une compétence existante non ultime ; pas de soutien du clan affronté au Tournoi.
4. **Les adversaires des clans ennemis** (proposés) : la règle par combat et la limite des places libres.
5. **La brèche en deux phases**, sans soin entre les deux.
6. **Réputation de l’acte final** : +4 et +3, la répartition décrite à la section 3.

## 6. Images provisoires et images finales attendues

Toutes provisoires et marquées à l’écran ; aucune générée, aucune vidéo. Source : `src/campaign/plateaux/finale/finalePresentation.ts`, vérifiée par un test.

- **Atlas (1)** : la capitale corrompue, de l’arène aux rues en flammes, à la place des démons et à la brèche (aujourd’hui sur le troisième atlas du Lion).
- **Tableaux de scène (15)** : l’Arène des Destins et la compagnie admise avec ses quatre Sceaux ; les champions du Corbeau, du Loup et du Phénix à terre devant les tribunes ; la finale face au champion du Serpent ; la trahison de Maelor et la brèche qui s’ouvre (tableau vivant à étudier) ; les démons dans l’arène et la foule qui fuit ; la compagnie quitte l’arène en flammes ; la capitale vue depuis les portes de l’arène ; le ralliement des clans ; les habitants sous les décombres ; la dernière veillée ; Maelor au cœur de la brèche ; la brèche qui vacille ; la capitale au matin, avant les épilogues.
- **Personnages (6)** : les champions du Corbeau, du Loup et du Phénix (portraits, sprites d’élite) ; le champion du Serpent (master Character V2, sprite de boss et forme démoniaque) ; une spectatrice de l’arène ; un habitant de la capitale.
- **Ennemis (8 sprites)** : champions du Corbeau et du Phénix ; champion du Serpent et sa forme démoniaque ; démons de la brèche ; démon massif ; Maelor à la brèche ; l’entité de la brèche (sans nom tant que tu n’en décides pas).
- **Refuge (1 fond)** : la dernière veillée dans la capitale.
- **Surfaces partagées (2)** : le fond du tableau des rencontres (l’Arène des Destins vue des tribunes) ; la fin de chronique de l’acte final.

## 7. Ce que l’acte final ne fait pas encore

- Les épilogues des clans et la fin R4 viennent au Lot 5 : la scène de clôture dit seulement qu’il reste à refermer la brèche.
- Les soutiens et les adversaires sont proposés : rien n’en est sauvegardé, ils se recalculent avant chaque combat depuis les relations.

## 8. Vérification

| Contrôle | Résultat |
| --- | --- |
| `npx tsc --noEmit` | vert |
| `npx vitest run` | 3 137 réussis, 23 ignorés, 10 échecs connus de la ligne de base (spritesheetPng 5, cin6ea3_pilot_e_regate 4, cin4_media 1), aucun nouveau |
| `node --test tools/qa/qa-job.test.mjs` | 26 sur 26 |
| `npm run build` | vert |
| `npm run contracts:validate` | vert |
| Porte du verrou documentaire | vide |
| `npm run narrative:validate` | Lion, Ours, Dragon, Scorpion et acte final valides, vérification complète, aucune erreur ni exception |
| `npm run cinematics:validate-narrative-staging` | vert |
| Test des bornes | acte final +4 / +3 ; 100 atteint seulement à l’acte final |

**Pilote de QA** (`src/qa/finalePlateauDriver.test.ts`), depuis des fins du Scorpion jouées par le même pilote à partir de fins du Dragon et de l’Ours, elles-mêmes jouées depuis les vraies sauvegardes du Lion :

- le tableau du Tournoi, dans l’ordre, arrêté avant la finale : trois rencontres terminées et « Victoire · champion relevé », la finale à combattre, la brèche à venir ; aucun lieu de la capitale n’est résolu ;
- honneur parfait : sept clans alliés, le Serpent ennemi, +4 ; au Corbeau, les soutiens du Lion, de l’Ours, du Dragon et du Scorpion ; à la brèche, sept soutiens et le pillard du Serpent ; le ralliement, la veillée et la trahison nomment leurs causes ;
- avidité : Maelor nomme les quatre conseils suivis et les trois champions humiliés ; sept clans ennemis, le Lion neutre ; les adversaires des clans remplissent les formations ; la Place des démons est jouée ;
- sauvegarde et reprise au milieu du Tournoi, puis d’un acte final terminé.

**Contrôle navigateur** (serveur de développement lancé puis arrêté par la session, 1440×810 et 390×844), avec des sauvegardes jouées par le pilote : depuis une fin du Scorpion, « Continuer : L’acte final (brouillon) » ; l’arrivée, où Séraphine sent une présence sombre ; le tableau avec ses cinq rencontres, leurs états écrits, le focus sur le bouton « Combattre : Champion du Corbeau » et le badge « Brouillon · image provisoire » ; le premier combat qui démarre ; le tableau en une colonne au téléphone, sans défilement horizontal ; au milieu du Tournoi, trois rencontres terminées ; la réplique du champion du Serpent avant la finale ; le déploiement de la finale avec ses soutiens ; la carte « La capitale corrompue », marquée « Brouillon · carte provisoire » ; la question de Maelor à la brèche ; le déploiement de la brèche avec « 2 phases » et ses soutiens ; le ralliement d’une compagnie de force qui nomme les clans ennemis ; la fin de chronique sans suite. Aucune erreur.

**Défauts trouvés et corrigés pendant la vérification** :

- Les boutons du tableau ne recevaient pas les clics : le cadre du jeu laisse passer le pointeur vers la scène, et le tableau en héritait. Il reçoit maintenant le pointeur (`2ae12455`).
- À la relecture de la fiche de texte : une compagnie d’honneur aux plateaux qui humiliait les champions au Tournoi, sur le conseil de Maelor, s’entendait dire « Vous ne m’avez jamais écouté ». Maelor compte maintenant les champions humiliés parmi ses conseils suivis (`25e9b856`), et un test le vérifie.

Limites : comme pour les plateaux, le combat de campagne tourne trop lentement sur le WebGL logiciel du conteneur pour être piloté jusqu’au bout ; l’action « Soutien » et le passage d’une phase à l’autre sont vérifiés par les tests du moteur de combat, pas en jeu. L’équilibre tactique attend ton test sur PC.

## 9. Jouer l’acte final

- **Dans le jeu** : termine le Scorpion sur `post-demo`, puis « Continuer : L’acte final (brouillon) ».
- **Sans rejouer les plateaux** (développement) : `/?qa=1`, « QA rencontres », puis « Acte final (brouillon) · depuis une fin du Scorpion par l’honneur » ou « … par la force ». Le jeu joue l’Ours, le Dragon et le Scorpion par le pilote depuis une vraie fin du Lion, puis continue normalement.
- Avec `/?qa=1&cin6a=golden`, les combats de la campagne affichent le bouton « Victoire ».

## 10. Fichiers principaux

- Acte final : `src/campaign/plateaux/finale/` (Tournoi, topologie, combats et soutiens, dialogues, liaison, présentation provisoire et tests).
- Vérité : `src/game/finalAct.ts` (tableau, configuration des combats), `src/game/plateauProgression.ts`, `src/game/types.ts` (phases et soutiens d’un combat).
- Présentation : `src/ui/TournamentBoardView.ts`, `src/styles/app.css` ; coordination : `src/game/GameApp.ts`.
- Registres communs : `src/campaign/plateaux/PlateauRegistry.ts`, `postDemoPresentation.ts`, `postDemoRefuges.ts`, `plateauAtlas.ts`, `src/game/postDemoContent.ts`, `src/game/challenges.ts`.
- Combat : `src/combat/legacyCombatRuntime.js`, `src/combat/vfx/DemoVfxActionScope.ts`, `src/combat/combatHudPresentation.ts`, `src/combat/combatBossPhases.test.ts`, `src/campaign/plateaux/postDemoCombatRuntime.test.ts`.
- Cohérence et QA : `src/campaign/consequences/ConsequenceMap.ts`, `src/game/narrativeCoherence.ts`, `src/game/reputationBounds.ts`, `src/qa/plateauDriver.ts`, `src/qa/finalePlateauDriver.test.ts`, `src/qa/postDemoQaSaves.ts`, `tools/narrative/plateau-text-sheet.ts`.

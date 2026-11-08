# Après-démo, Lot 3 — le Scorpion (brouillon jouable)

| Champ | Valeur |
| --- | --- |
| TASK | POST-DEMO-LOT-3-SCORPION |
| DOMAIN | Campagne (plateau, passage du Dragon au Scorpion, relations), contenu brouillon, combat (familles et boss), présentation provisoire, outils de QA |
| BASELINE | `1b854e67` sur `post-demo` (Dragon accepté, OD-2026-11-08-C ; jeu de contrats 1.20.0, baseline immuable `6c965169c2dc153cafd5a8609d914cf8de723ff3`) |
| BRANCH | `post-demo` |
| HEAD | voir le commit de clôture du lot (ce rapport et l’état) |
| STATUS | accepté : le Scorpion est canon depuis [OD-2026-11-08-D](../autonomy/POST_DEMO_LOT_3_OPERATOR_DECISION_2026-11-08.md) ; il reste sur `post-demo` jusqu’à un ordre d’intégration |
| MERGED_IN | NONE |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Sur `post-demo` seulement. À la fin d’une chronique du Dragon, « Continuer : Les Déserts Arides (brouillon) » ouvre le Scorpion, qui se joue de bout en bout. Tout son contenu est marqué brouillon ; toutes ses images sont provisoires et marquées. L’Ours et le Dragon, acceptés, ne changent pas, sauf une étiquette corrigée au jugement du Dragon (section 4) ; la démo sur `dev` non plus. |
| CANONICAL_DOCS_UPDATED | `docs/autonomy/AUTONOMOUS_WORK_STATE.md` et `.json` ; aucun document canonique de contenu : le Scorpion reste un brouillon jusqu’à ton accord. |
| EVIDENCE | Suite vitest et `node:test`, types, build, validateur des contrats, porte du verrou documentaire, `narrative:validate` (Lion, Ours, Dragon, Scorpion), pilote de QA des deux voies, contrôle navigateur sur un serveur lancé par la session (section 7). Captures dans le dossier de travail de la session, non promues. |

Session cloud de l’après-démo, run `claude-postdemo-lot3-20261108T1500Z`. Elle suit [le brief](../autonomy/POST_DEMO_CLOUD_SESSION_BRIEF.md), [OD-2026-11-07-I](../autonomy/POST_DEMO_DIRECTION_OPERATOR_DECISION_2026-11-07.md), [OD-2026-11-08-A](../autonomy/POST_DEMO_LOT_0_OPERATOR_DECISION_2026-11-08.md), [OD-2026-11-08-B](../autonomy/POST_DEMO_LOT_1_OPERATOR_DECISION_2026-11-08.md) et [OD-2026-11-08-C](../autonomy/POST_DEMO_LOT_2_OPERATOR_DECISION_2026-11-08.md).

## Résumé

- **Le plateau est jouable**, en brouillon, à la taille de l’Ours et du Dragon : 21 lieux sur la route, 12 lieux facultatifs, 3 régions, 3 refuges, 3 bifurcations engagées, 6 défis, 2 gardiens en deux vagues, 9 combats de récit, 3 boss.
- **La narration d’abord.** La carte des conséquences a été écrite et poussée avant toute réplique (`a6e5458e`). Elle compte 11 choix majeurs, chacun repris plus tard par une scène qui en nomme la cause.
- **Le chef est nommé par son titre** (P5) : « le Grand Inquisiteur », jamais « Kael » ; un test le vérifie sur la carte, et le contrôle navigateur sur l’audience.
- **Le fil des Ombres.** La page souillée du codex porte la même froideur que l’éclat du filon sombre de l’Ours et la même souillure que l’éclat de l’autel du Cristal ; le fidèle libéré annonce le Prophète ; le Grand Inquisiteur révèle que le codex parle d’un Prophète des Ombres qui manipule les croyances des clans.
- **Deux voies** (§3.4). Honneur : le codex rapporté, le Grand Inquisiteur scelle l’alliance et la compagnie traque le Prophète des Ombres. Force : le codex gardé ou laissé au Phénix sous serment, ou l’épreuve demandée, et le Sceau se prend contre le Grand Inquisiteur et ses érudits.
- **Les relations** suivent l’issue : honneur, Scorpion allié et Phénix ennemi ; force, Scorpion et Phénix ennemis. Un serment juré au Phénix, tenu au temple, garde le Phénix allié.
- **Réputation mesurée** : +6 au mieux, +4 pour une conduite d’honneur constante, exactement le budget prévu. C’est le plus petit des plateaux (R2) : aucun combat de la route ne la fait bouger.
- **Vérifié** : pilote des deux voies depuis de vraies fins du Dragon (cinq scénarios et une reprise), validateur complet des quatre cartes, bornes, et contrôle navigateur sans défaut.

## 1. Ce qui est construit

| Région | Lieux de la route | Refuge |
| --- | --- | --- |
| I · Les dunes | Bord des Déserts Arides, Audience du Grand Inquisiteur, Bêtes des dunes, Érudits du Scorpion, Fidèles du Phénix, puis au choix Énigme des sables ou Éclaireurs du Phénix | Oasis des érudits |
| II · Les ruines | Sceaux de garde, Sentinelles du temple, puis au choix Bibliothèque ensevelie ou Gardien de flamme, Temple du Phénix | Abri des caravanes |
| III · Le sanctuaire | Cellule du Prophète, Fidèles rescapés, puis au choix Cendres sacrées ou Fidèles égarés, Pages souillées | Veillée au désert, puis Jugement du Grand Inquisiteur |

- **Défis** : « Araignées des sables » (initiation, 3 héros au plus), « Gardien de flamme » (aucun objet), « Fidèles égarés » (8 tours au plus), et les deux gardiens (3 héros au plus).
- **Gardiens** : le Gardien de flamme garde la cache des ruines ; le Fidèle égaré garde la réserve du sanctuaire. Chacun se bat en deux vagues.
- **Familles** (§3.4) : gardiens du Phénix et gardien de flamme (élite), créatures du désert (serpents venimeux, araignées, rats), fidèles égarés sous l’emprise des Ombres (élite), érudits du Scorpion sur la voie de la force.
- **Boss** : le chef des gardiens du Phénix au temple (deux variantes : prendre le codex pour le Grand Inquisiteur, ou pour la compagnie) ; le Prophète des Ombres sur la voie de l’honneur ; le Grand Inquisiteur et ses érudits sur la voie de la force. Aucune nouvelle compétence : chaque ennemi utilise des compétences qui ont déjà leur signature d’effets, et un test le vérifie.
- **Dialogues** : 24 scènes en brouillon, écrites depuis le §3.4 et les faits établis seulement. Aucun clan, lieu, personnage ou objet nouveau : le codex prophétique, le Temple du Phénix, ses flammes purificatrices, les érudits du Scorpion, les fidèles du Phénix, les énigmes, les pièges magiques, les textes souillés, le Prophète des Ombres et le Tournoi des Grands viennent de la feuille de route. Texte complet dans [la fiche de texte](post-demo-lot-3-scorpion-text-sheet-2026-11-08.md).

## 2. La carte des conséquences

Fichier : [`src/campaign/consequences/scorpion.consequences.json`](../../src/campaign/consequences/scorpion.consequences.json). Statut : brouillon. Écrite et poussée avant toute réplique (commit `a6e5458e`). Avant d’écrire les répliques, quatre phrases de cause ont été reformulées pour que la sage, l’érudit et l’intendant ne parlent pas à la première personne du Grand Inquisiteur (par exemple « vous avez accepté la requête du Grand Inquisiteur sans marchander »).

| Choix majeur | Lieu | Options (fait, réputation) |
| --- | --- | --- |
| Mandat | Audience du Grand Inquisiteur | rapporter le codex sans marchander (+1) ; exiger de le lire avant lui (−1) |
| Érudits du Scorpion | Érudits du Scorpion | libérer le fidèle du Phénix (0, mérite) ; le leur laisser (−2, 50 or) |
| Serment | Fidèles du Phénix | ne rien promettre (0, mérite) ; jurer de ne pas livrer le codex (0, manquement au jugement) |
| Énigme des sables | branche évènement, région I | chercher la réponse dans les textes (0, mérite) ; briser le mécanisme (−1, 40 or) |
| Sceaux de garde | Sceaux de garde | les lever selon leur rite (0, mérite) ; les briser (−1) |
| Bibliothèque ensevelie | branche évènement, région II | la laisser intacte (0, mérite) ; vendre des rouleaux (−1, 80 or) |
| **Le temple** | Temple du Phénix | prendre le codex pour le Grand Inquisiteur (+1) ; le garder pour le clan (−2, puis −1 au combat) ; le laisser au Phénix, seulement après le serment (−1, Phénix allié) |
| Fidèles rescapés | Fidèles rescapés | les escorter (+1) ; les réduire au silence (−2) |
| Cendres sacrées | branche évènement, région III | les respecter (0, mérite) ; emporter des braises (−1, une gemme rouge) |
| Pages souillées | Pages souillées | sceller la page comme preuve (0, mérite) ; la brûler (−1) |
| Intention au jugement | Jugement du Grand Inquisiteur | réclamer le Sceau ; demander l’épreuve |

**Mérites discrets.** Pour tenir le budget de 6 (R2), sept gestes honorables ne donnent pas de réputation et ne pèsent que dans le jugement : libérer le fidèle, ne rien promettre au Phénix, résoudre l’énigme, lever les sceaux selon leur rite, laisser la bibliothèque, respecter les cendres, sceller la page. Les combats d’élite ne donnent rien non plus ; seuls le mandat, le temple, les témoins, les gardiens et la réclamation font bouger la réputation.

**Le serment.** Jurer au Phénix ne coûte rien sur le moment, mais le Grand Inquisiteur le compte comme un manquement, et il ouvre au temple la troisième réponse : tenir le serment et laisser le codex au Phénix. Rompre le serment reste possible ; le chef des gardiens le rappelle (« serment fait à nos fidèles ») et la sage le nomme (« l’une de ces deux paroles va se briser ici »).

**Échos.** 28 échos en jeu dans le Scorpion (jugement, temple, cellule du Prophète, veillée, épilogue), 3 prévus pour l’acte final. **Échos des plateaux précédents** (4, en jeu) : à l’audience, l’issue du Dragon (« Kaelen vous a confié le Sceau du Dragon » ou « le Sceau du Dragon arraché à Kaelen ») ; à la page souillée, l’éclat du filon sombre de l’Ours et l’éclat de l’autel du Cristal. Les fidèles rescapés rappellent aussi les pèlerins du Dragon, escortés ou réduits au silence.

## 3. Réputation

| Mesure | Scorpion | Budget prévu |
| --- | --- | --- |
| Partie parfaite (route + gardiens) | +6 (route +4, gardiens +2) | 6 |
| Conduite d’honneur constante | +4 | 4 |
| Pire route | −14 | — |

Le pilote retrouve exactement +6 sur la partie parfaite. Projection : honneur constant 57 après le Lion, 71 après l’Ours, 81 après le Dragon (Renommé), 85 après le Scorpion ; partie parfaite 90 après le Dragon, 96 après le Scorpion, 100 seulement à l’acte final. Mesuré par le pilote depuis de vraies sauvegardes : une compagnie d’honneur arrive au Scorpion entre 81 et 85, une compagnie de force vers 18.

## 4. Passage du Dragon au Scorpion, et ce qui change ailleurs

- À la fin de l’épilogue du Dragon, `RunSystem` enregistre l’issue du Dragon et ses relations approuvées, puis l’écran de fin propose « Continuer : Les Déserts Arides (brouillon) ».
- Le Scorpion s’ouvre sur sa scène d’arrivée, puis sur sa carte ; le Scorpion et le Phénix sont rencontrés, neutres. Tous les faits du Lion, de l’Ours et du Dragon passent tels quels.
- À la fin du Scorpion, l’acte final n’étant pas construit, la chronique s’arrête avec un enregistrement complet.
- **Correction au Dragon (canon).** Le jugement commun affichait l’étiquette « Les mines » au-dessus de la phrase de l’issue, même au Dragon. Chaque plateau nomme maintenant la sienne : « Les mines » à l’Ours (inchangé), « Le Cristal » au Dragon, « Le codex » au Scorpion. Aucune réplique ne change.
- **Fiche de texte.** L’outil n’imprimait que l’épilogue de la force ; il imprime maintenant les deux, chacun après la victoire de sa voie. Les fiches de l’Ours et du Dragon, déjà livrées, restent telles quelles (preuves datées) ; les régénérer montre les deux épilogues, sans aucun texte de jeu changé.
- **Laboratoire QA.** Les boutons du Dragon ne disent plus « brouillon » ; deux boutons « Scorpion (brouillon) » s’ajoutent.

## 5. Ce qui reste à décider (fiche)

1. **Accepter le Scorpion comme canon**, ou demander des retouches.
2. **Relations du Scorpion** (proposées) : honneur, Scorpion allié et Phénix ennemi ; force, Scorpion et Phénix ennemis.
3. **Serment au Phénix** : laisser le codex au Phénix après le serment garde le Phénix allié malgré l’issue de force, comme le Corbeau à l’Ours et le Loup au Dragon.
4. **Crédibilité devant le Grand Inquisiteur** (proposée) : crédible à 70, haute à 85 (une conduite d’honneur arrive entre 81 et 85, une conduite de force vers 18).
5. **Mérites discrets** : sept gestes honorables sans réputation, qui ne pèsent que dans le jugement, et aucun combat d’élite qui la fasse bouger, pour tenir le budget de 6.

## 6. Images provisoires et images finales attendues

Toutes provisoires et marquées à l’écran ; aucune générée, aucune vidéo. Source : `src/campaign/plateaux/scorpion/scorpionPresentation.ts`, vérifiée par un test.

- **Atlas (3)** : les dunes des Déserts Arides jusqu’à l’oasis des érudits ; les ruines, la bibliothèque ensevelie et le Temple du Phénix ; le sanctuaire des cendres, les pages souillées et la salle du Grand Inquisiteur.
- **Tableaux de scène (24)** : la compagnie au bord des Déserts Arides ; la salle du Grand Inquisiteur ; le camp des érudits et leur prisonnier ; les fidèles du Phénix sur la route de leur temple ; la porte de pierre et l’énigme des sables ; la compagnie à l’oasis ; les sceaux de garde sur la route des ruines ; la bibliothèque ensevelie ; le Temple du Phénix et le codex ; le chef des gardiens devant le codex ; le codex pris pour le Grand Inquisiteur ; le chef des gardiens face à une compagnie avide ; le codex aux mains de la compagnie ; la cellule du Prophète ; les fidèles rescapés ; le sanctuaire des cendres sacrées ; les pages souillées ; la veillée au désert ; le jugement du Grand Inquisiteur ; la traque du Prophète des Ombres ; sa chute ; le Grand Inquisiteur et ses érudits face à la compagnie ; l’épreuve achevée ; le Sceau du Scorpion.
- **Personnages (6, Character V2)** : le Grand Inquisiteur (master, portrait et sprite de boss) ; l’érudit du Scorpion ; le fidèle du Phénix ; le fidèle retenu par les érudits ; le chef des gardiens du Phénix (master, sprite de boss) ; le Prophète des Ombres (master, sprite de boss).
- **Ennemis (7 sprites)** : gardien du Phénix ; gardien de flamme (élite) ; fidèle égaré (élite) ; érudit du Scorpion ; et les sprites de boss du chef des gardiens, du Prophète et du Grand Inquisiteur.
- **Refuges (3 fonds)** : l’oasis des érudits ; l’abri des caravanes près du temple ; la veillée au désert.
- **Surface partagée (1)** : la fin de chronique du Scorpion, aujourd’hui dans la salle du jugement du Lion.

## 7. Vérification

| Contrôle | Résultat |
| --- | --- |
| `npx tsc --noEmit` | vert |
| `npx vitest run` | 3 107 réussis, 23 ignorés, 10 échecs connus de la ligne de base (spritesheetPng 5, cin6ea3_pilot_e_regate 4, cin4_media 1), aucun nouveau |
| `node --test tools/qa/qa-job.test.mjs` | 26 sur 26 |
| `npm run build` | vert |
| `npm run contracts:validate` | vert |
| Porte du verrou documentaire | vide |
| `npm run narrative:validate` | Lion, Ours, Dragon et Scorpion valides, vérification complète, aucune erreur ni exception |
| `npm run cinematics:validate-narrative-staging` | vert |
| Test des bornes | Scorpion +6 / +4, projet dans les cibles |

**Pilote de QA** (`src/qa/scorpionPlateauDriver.test.ts`), depuis des fins du Dragon jouées par le même pilote à partir de fins de l’Ours, elles-mêmes jouées depuis les vraies sauvegardes du Lion :

- départ : le Dragon allié et le Loup ennemi, le Scorpion et le Phénix neutres, l’audience nomme le Sceau confié par Kaelen ;
- honneur parfait, avec les gardiens : issue honneur, Scorpion allié, Phénix ennemi, +6 ; le jugement nomme chaque mérite tenu, le codex rapporté, les fidèles et la preuve ; la page souillée nomme l’éclat du filon sombre et celui de l’autel du Cristal ; la cellule nomme le fidèle libéré ; la veillée nomme la lampe des fidèles ; l’épilogue dit « Quatre Sceaux » ;
- avidité depuis un Dragon avide : la réclamation est rejetée, épreuve contre le Grand Inquisiteur, Scorpion et Phénix ennemis, l’audience nomme le Sceau arraché à Kaelen ;
- serment et codex laissé au Phénix : issue force, Phénix allié (cause `scorpion.codex`) ;
- honneur puis épreuve demandée : coût de réputation conforme ;
- sauvegarde et reprise d’un Scorpion terminé.

**Contrôle navigateur** (serveur de développement lancé puis arrêté par la session, 1440×810), avec des sauvegardes jouées par le pilote : depuis une fin du Dragon par l’honneur, « Continuer : Les Déserts Arides (brouillon) » ; l’arrivée avec le badge « Brouillon · image provisoire » ; la carte des dunes marquée « Brouillon · carte provisoire », seule l’audience à portée ; l’audience du Grand Inquisiteur, qui nomme le Sceau confié par Kaelen et jamais « Kael », le choix enregistré ; au temple après un serment, les trois réponses, la troisième enregistrée avec le Phénix allié (causes `scorpion.arrival`, `scorpion.codex`) et le chef des gardiens qui rappelle le serment ; la veillée avec la lampe des fidèles et ses services ; le jugement qui nomme le codex rapporté, avec « Demander l’épreuve du Scorpion » ; le combat du Prophète des Ombres qui démarre ; la fin de chronique sans suite. Les trois boss et les familles du Scorpion apparaissent dans le moteur de combat avec les bonnes compétences. Aucune erreur.

Limites : comme pour l’Ours et le Dragon, le combat de campagne tourne trop lentement sur le WebGL logiciel du conteneur pour être piloté jusqu’au bout ; le pilote logique couvre l’issue des combats. L’équilibre tactique attend ton test sur PC.

## 8. Jouer le Scorpion

- **Dans le jeu** : termine le Dragon sur `post-demo`, puis « Continuer : Les Déserts Arides (brouillon) ».
- **Sans rejouer le Lion, l’Ours ni le Dragon** (développement) : `/?qa=1`, « QA rencontres », puis « Scorpion (brouillon) · depuis une fin du Dragon par l’honneur » ou « … par la force ». Le jeu joue l’Ours puis le Dragon par le pilote depuis une vraie fin du Lion, puis continue normalement.
- Le laboratoire liste aussi les combats du Scorpion, marqués « brouillon ». Avec `/?qa=1&cin6a=golden`, les combats de la campagne affichent le bouton « Victoire ».

## 9. Fichiers principaux

- Plateau : `src/campaign/plateaux/scorpion/` (topologie, combats, dialogues, jugement, présentation provisoire, liaison et tests).
- Registres communs : `src/campaign/plateaux/PlateauRegistry.ts`, `postDemoPresentation.ts`, `postDemoRefuges.ts`, `plateauAtlas.ts`, `src/game/postDemoContent.ts`, `src/game/challenges.ts`, `src/game/plateauFinale.ts` (étiquette de l’issue par plateau).
- Combat : `src/combat/legacyCombatRuntime.js`, `src/combat/vfx/DemoVfxActionScope.ts`, `src/campaign/plateaux/postDemoCombatRuntime.test.ts`.
- QA : `src/qa/plateauDriver.ts` (pilote commun), `src/qa/scorpionPlateauDriver.test.ts`, `src/qa/postDemoQaSaves.ts`, `tools/narrative/plateau-text-sheet.ts`.

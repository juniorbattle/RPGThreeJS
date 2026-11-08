# Après-démo, Lot 1 — l’Ours (brouillon jouable)

| Champ | Valeur |
| --- | --- |
| TASK | POST-DEMO-LOT-1-BEAR |
| DOMAIN | Campagne (plateau, transitions, relations), contenu brouillon, combat (familles et boss), présentation provisoire, outils de QA |
| BASELINE | `a75e8b5d` sur `post-demo` (fin du Lot 0 ; jeu de contrats 1.20.0, baseline immuable `6c965169c2dc153cafd5a8609d914cf8de723ff3`) |
| BRANCH | `post-demo` |
| HEAD | voir le commit de clôture du lot (ce rapport et l’état) |
| STATUS | accepté : l’Ours est canon depuis [OD-2026-11-08-B](../autonomy/POST_DEMO_LOT_1_OPERATOR_DECISION_2026-11-08.md) ; il reste sur `post-demo` jusqu’à un ordre d’intégration |
| MERGED_IN | NONE |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Sur `post-demo` seulement. Le Lion joue sous l’étalonnage approuvé (OD-2026-11-08-A). À la fin d’une chronique du Lion, un bouton « Continuer : Les Montagnes de la Résilience (brouillon) » ouvre l’Ours. L’Ours se joue de bout en bout : carte, refuges, rencontres, défis, gardiens, boss, jugement de Borin, épilogue. Tout son contenu est marqué brouillon ; toutes ses images sont provisoires et marquées. La démo sur `dev` est inchangée. |
| CANONICAL_DOCS_UPDATED | `docs/autonomy/AUTONOMOUS_WORK_STATE.md` et `.json` ; aucun document canonique de contenu : l’Ours reste un brouillon jusqu’à ton accord. |
| EVIDENCE | Suite vitest et `node:test`, types, build, validateur des contrats, porte du verrou documentaire, `narrative:validate`, pilote de QA des deux voies, contrôle navigateur sur un serveur lancé par la session (section 7). Captures dans le dossier de travail de la session, non promues. |

Session cloud de l’après-démo, run `claude-postdemo-lot1-20261108T0335Z`. Elle suit [le brief](../autonomy/POST_DEMO_CLOUD_SESSION_BRIEF.md), [OD-2026-11-07-I](../autonomy/POST_DEMO_DIRECTION_OPERATOR_DECISION_2026-11-07.md) et tes réponses au Lot 0 ([OD-2026-11-08-A](../autonomy/POST_DEMO_LOT_0_OPERATOR_DECISION_2026-11-08.md)).

## Résumé

- **Le plateau est jouable**, en brouillon : 21 lieux sur la route, 12 lieux facultatifs, 3 régions, 3 refuges, 3 bifurcations engagées, 6 défis, 2 gardiens en deux vagues, 9 combats de récit, 3 boss.
- **La narration d’abord.** La carte des conséquences a été écrite avant toute réplique. Elle compte 11 choix majeurs ; chacun a un écho qui en nomme la cause, et le validateur le vérifie. Le Lion fait écho dans l’Ours : Borin parle d’Alaric, de Bois-Clair, et la voie suivie au Lion change son accueil.
- **Deux voies.** Honneur : la compagnie défend les galeries, Borin la reconnaît, elle traque le Maître Espion du Corbeau. Force : Borin rejette la réclamation (ou la compagnie demande l’épreuve), et elle prend le Sceau contre Borin et ses guerriers.
- **Les relations** suivent l’issue : honneur, Ours allié et Corbeau ennemi ; force, Ours ennemi et Corbeau ennemi. Un pacte passé avec le Corbeau dans les mines tient contre l’issue.
- **Réputation mesurée** depuis le contenu : +16 au mieux, +14 pour une conduite d’honneur constante. Le budget approuvé était de 16 et 13.
- **Images provisoires**, toutes marquées « Brouillon » à l’écran : décors et atlas du Lion, personnages existants en silhouettes. La liste des images finales est en section 6.
- **Vérifié** : pilote des deux voies (quatre scénarios), validateur, bornes, et un contrôle navigateur qui a trouvé et fait corriger trois défauts de présentation avant ce paquet.

## 1. Ce qui est construit

### Carte et régions

L’Ours suit les règles de navigation du Lion, appliquées par un moteur commun à tout plateau (`PlateauTopology`). Les identifiants commencent tous par `bear-`.

| Région | Lieux de la route | Refuge |
| --- | --- | --- |
| I · Les cols | Pied des Montagnes, Audience de Borin, Bêtes des éboulis, Messager du Corbeau, Mineurs pris au piège, puis au choix Pièges du Corbeau ou Éclaireurs du Corbeau | Avant-poste de l’Ours |
| II · Les mines | Convoi de minerai, Route des mines, puis au choix Galerie effondrée ou Bête corrompue, Les mines sacrées | Refuge des mineurs |
| III · Le Sceau | Campement du Corbeau, Mineurs libérés, puis au choix Sanctuaire de la montagne ou Gardiens des galeries, Le filon sombre | Veillée avant le Sceau, puis Jugement de Borin |

- **Bifurcations engagées** (set 1.17.0) : chaque choix de branche engage la compagnie jusqu’au refuge ou au lieu qui clôt le chapitre (avant-poste, mines sacrées, filon sombre).
- **Lieux facultatifs** : six coffres et six rencontres à deux variantes, sur le modèle du Lot E.
- **Défis** (set 1.18.0) : « Bêtes du détour » (initiation, 3 héros au plus), « Bête corrompue » (aucun objet), « Gardiens des galeries » (8 tours au plus), et les deux gardiens (3 héros au plus).
- **Gardiens** (sets 1.18.0 et 1.19.0) : le Contremaître du Corbeau garde la cache du monte-charge ; la Bête des profondeurs garde la réserve des profondeurs. Chacun se bat en deux vagues.

### Familles d’ennemis et boss

Familles du §3.2 : éclaireurs et mineurs du Corbeau, faune des montagnes (sangliers, blaireaux, rats), créatures corrompues près du filon (bête corrompue, bête des profondeurs, squelettes), guerriers de l’Ours sur la voie de la force.

| Boss | Voie | Combat |
| --- | --- | --- |
| Chef des mineurs du Corbeau | les deux, aux mines (défendre ou saisir) | `bear_mines_defense`, `bear_mines_seizure` |
| Maître Espion du Corbeau | honneur | `bear_master_spy` |
| Ancien Ours Borin et ses guerriers | force | `bear_borin` |

Aucune nouvelle compétence : chaque ennemi et chaque boss utilise des compétences existantes, qui ont toutes leur signature d’effets procédurale. Les attaques naturelles (griffes, pierres, lames de jet) reprennent des recettes existantes. Un test le vérifie.

### Dialogues

24 scènes en brouillon, écrites depuis le §3.2 et les faits déjà établis seulement. Aucun clan, lieu, personnage ou objet nouveau. Elles sont listées comme brouillons dans le code (`isDraftContent`) et à l’écran (« Brouillon · image provisoire »).

Le texte complet est dans [la fiche de texte](post-demo-lot-1-bear-text-sheet-2026-11-08.md) : chaque scène, chaque choix avec ses conditions et ses effets, les scènes construites selon l’état sous chaque état qui les change, chaque combat avec sa récompense et son défi, et ce que Borin pèse au jugement. Elle se régénère avec `npm run narrative:text-sheet -- bear <fichier>`.

## 2. La carte des conséquences

Fichier : [`src/campaign/consequences/bear.consequences.json`](../../src/campaign/consequences/bear.consequences.json). Statut : brouillon.

| Choix majeur | Lieu | Options (fait, réputation) |
| --- | --- | --- |
| Mandat | Audience de Borin | défendre sans condition (+1) ; contre une part du minerai (−1) |
| Offre du Corbeau | Messager du Corbeau | refuser l’or (+1) ; pacte avec le Corbeau (−2) |
| Mineurs pris au piège | Mineurs pris au piège | les dégager (+1) ; les dépouiller (−2) |
| Pièges du Corbeau | branche évènement, région I | les signaler (+1) ; garder la poudre (−1) |
| Convoi de minerai | Convoi de minerai | le signaler (+1) ; le saisir (−1) |
| Artefact | branche évènement, région II | le rendre (+1) ; le garder (−1) |
| **Les mines sacrées** | Les mines sacrées | les rendre à l’Ours (+1, puis +2 au combat) ; garder le filon (−2, puis −2 au combat) ; les abandonner au Corbeau, seulement après le pacte (−3, Corbeau allié) |
| Témoins | Mineurs libérés | les escorter (+1) ; les faire taire (−2) |
| Sanctuaire | branche évènement, région III | respecter les offrandes (+1) ; les prendre (−1) |
| Filon sombre | Le filon sombre | en sceller un éclat comme preuve (+1) ; le briser (−1) |
| Intention au jugement | Jugement de Borin | réclamer le Sceau ; demander l’épreuve |

**Les deux voies.** La voie d’honneur demande d’avoir rendu les galeries, sans fait de force (filon gardé, galeries abandonnées, témoins réduits au silence), et une conduite qui ne soit pas infâme. Si la conduite est incertaine, des témoins libres, la preuve du filon ou une réputation d’au moins 50 suffisent. Sinon, ou si la compagnie demande l’épreuve, c’est la voie de la force.

**Échos.** 27 échos sont en jeu, dans l’Ours : le jugement de Borin nomme chaque acte dans ses propres mots, l’épilogue dit ce qu’est devenue la preuve, l’accueil de Borin dépend de la voie du Lion et de Bois-Clair. 3 échos sont prévus pour l’acte final et restent marqués « prévus » jusqu’au Lot 4.

**Échos du Lion** (8, en jeu) : la voie suivie (Alaric reconnaît le clan, ou le Sceau pris par l’épreuve), Bois-Clair (captifs ramenés ou coffres emportés), et l’avidité au Lion, que Borin a entendue.

## 3. Réputation

Mesurée par le test des bornes, depuis le contenu de l’Ours, avec ses montants tels qu’écrits (échelle de l’après-démo, aucune victoire ordinaire ne compte).

| Mesure | Ours | Budget approuvé |
| --- | --- | --- |
| Partie parfaite (route + gardiens) | +16 (route +14, gardiens +2) | 16 |
| Conduite d’honneur constante | +14 | 13 |
| Pire route | −17 | — |

Le pilote de QA joue la partie parfaite et retrouve exactement +16. Le projet complet reste dans les cibles : seule une partie parfaite atteint 100, et seulement à l’acte final ; une conduite d’honneur constante atteint Renommé (80) au Dragon (71 après l’Ours).

## 4. Passage du Lion à l’Ours

- **Clôture du Lion.** À la fin de l’épilogue du Lion, `RunSystem` enregistre l’issue du Lion et les relations approuvées : honneur, Lion allié et Serpent ennemi ; force, Lion neutre et Serpent ennemi. Une sauvegarde de la démo dont la chronique est finie est close de la même façon au moment de continuer, sans rejouer quoi que ce soit.
- **Continuer.** L’écran de fin de chronique propose « Continuer : Les Montagnes de la Résilience (brouillon) », à côté des actions habituelles. L’Ours s’ouvre sur sa scène d’arrivée, puis sur sa carte. L’Ours et le Corbeau sont rencontrés, neutres.
- **Ce qui passe d’un plateau à l’autre** : tous les faits, la réputation, la compagnie, l’inventaire et l’or. La partie de l’Ours est une nouvelle partie, d’identifiant `bear-…`.
- **Clôture de l’Ours.** L’épilogue de l’Ours enregistre son issue et ses relations. Comme le Dragon n’est pas construit, la chronique s’arrête là, avec un enregistrement complet.

## 5. Ce qui reste à décider (fiche)

1. **Accepter l’Ours comme canon**, ou demander des retouches (textes, choix, combats). Rien ne devient canon sans ton accord.
2. **Relations de l’Ours** (proposées) : honneur, Ours allié et Corbeau ennemi ; force, Ours ennemi et Corbeau ennemi ; un pacte avec le Corbeau qui abandonne les mines garde le Corbeau allié.
3. **Crédibilité devant Borin** (proposée) : crédible à 50, haute à 65. Elle ne joue que lorsque la conduite est incertaine.
4. **Budget de l’Ours** : la conduite d’honneur constante donne 14, le budget disait 13. Recommandation : garder 13 comme plancher (14 le respecte).
5. **Images finales** : la liste de la section 6 forme un lot séparé, à mener avec toi.
6. **Arènes de combat** : les combats de l’Ours utilisent les arènes codées du Lion (forêt et sanctuaire). Une arène codée des montagnes et des galeries serait du travail de code, pas une image ; à décider avec le lot des images.

## 6. Images provisoires et images finales attendues

Toutes les images de l’Ours sont provisoires : décors et atlas approuvés du Lion, réutilisés, et personnages existants en silhouettes. Aucune n’est générée, aucune n’est une vidéo. Chacune est marquée à l’écran et listée ici avec l’image finale qu’elle attend.

**Atlas (3)** : Atlas I de l’Ours, les cols jusqu’à l’avant-poste ; Atlas II, la route des mines et l’entrée des galeries sacrées ; Atlas III, les galeries profondes, le filon sombre et la salle de Borin. Aujourd’hui : les trois atlas du Lion, positions reprises de leurs lieux homologues.

**Tableaux de scène (24)** : la compagnie au pied des Montagnes de la Résilience ; la salle de l’Ancien Ours Borin ; le messager du Corbeau à l’écart du sentier ; l’éboulement et les mineurs pris au piège ; les pièges du Corbeau sur le sentier ; la compagnie à l’avant-poste de l’Ours ; le convoi de minerai sombre ; la galerie effondrée et l’artefact ; l’entrée des mines sacrées occupées par le Corbeau ; le Corbeau retranché dans les galeries ; les galeries rendues à l’Ours ; le Corbeau retranché devant le filon ; le filon sombre aux mains de la compagnie ; le campement abandonné du Corbeau ; les mineurs libérés ; le sanctuaire de la montagne ; le filon sombre au fond des galeries ; la veillée avant le jugement de Borin ; le jugement de Borin ; la traque du Maître Espion du Corbeau ; la chute du Maître Espion ; Borin et ses guerriers face à la compagnie ; l’épreuve de l’Ours achevée ; le Sceau de l’Ours.

**Personnages (6, Character V2)** : l’Ancien Ours Borin (master, portrait et sprite de boss) ; le guerrier de l’Ours (sprite et portrait) ; le mineur de l’Ours (portrait) ; le messager du Corbeau (portrait) ; le chef des mineurs du Corbeau (master, sprite de boss) ; le Maître Espion du Corbeau (master, sprite de boss).

**Ennemis (9 sprites)** : éclaireur du Corbeau ; mineur du Corbeau ; contremaître du Corbeau (élite) ; bête corrompue des montagnes (élite) ; bête des profondeurs (élite) ; guerrier de l’Ours ; et les sprites de boss du chef des mineurs, du Maître Espion et de Borin.

**Refuges (3 fonds)** : l’avant-poste de l’Ours dans les cols ; l’abri des mineurs près des galeries ; la veillée avant le jugement de Borin. Aujourd’hui : les fonds des refuges du Lion, marqués « Brouillon · image provisoire » à l’écran.

**Surface partagée (1)** : la fin de chronique de l’Ours se tient aujourd’hui dans la salle du jugement du Lion ; image attendue : la salle de Borin après le jugement.

La source de cette liste est le registre `src/campaign/plateaux/bear/bearPresentation.ts` ; un test vérifie que chaque scène, atlas, personnage, ennemi, refuge et surface partagée de l’Ours y figure avec son image attendue.

## 7. Vérification

| Contrôle | Résultat |
| --- | --- |
| `npx tsc --noEmit` | vert |
| `npx vitest run` | 3 065 réussis, 23 ignorés, 10 échecs connus de la ligne de base (spritesheetPng 5, cin6ea3_pilot_e_regate 4, cin4_media 1 : fichiers non suivis absents d’un clone frais), aucun nouveau |
| `node --test tools/qa/qa-job.test.mjs` | 26 sur 26 |
| `npm run build` | vert |
| `npm run cinematics:validate-narrative-staging` | vert |
| `npm run contracts:validate` | vert |
| Porte du verrou documentaire | vide |
| `npm run narrative:validate` | Lion et Ours valides, vérification complète, aucune erreur |
| Test des bornes | Ours +16 / +14, projet dans les cibles |
| Pilote de QA (`src/qa/bearPlateauDriver.test.ts`) | 4 scénarios et une reprise de sauvegarde, verts |

**Pilote de QA.** Il joue l’Ours depuis les vraies sauvegardes de fin du Lion, par `RunSystem`, la résolution réelle des dialogues et le jugement réel ; il ne remplace que la tactique, en déclarant chaque combat gagné.

- Honneur parfait, avec les deux gardiens : issue honneur, Ours allié, Corbeau ennemi, +16 ; le jugement nomme chaque mérite, les témoins et la preuve ; l’épilogue dit que Borin a scellé l’alliance.
- Avidité, filon saisi : la réclamation est rejetée, épreuve contre Borin, issue force, Ours et Corbeau ennemis ; le jugement nomme le filon gardé et les témoins réduits au silence.
- Pacte avec le Corbeau, mines abandonnées : issue force, Ours ennemi, Corbeau allié (cause `bear.mines`).
- Honneur, puis épreuve demandée : issue force, coût de réputation conforme.

**Contrôle navigateur** (serveur de développement lancé par la session, Chromium sans tête, 1440×810). Depuis la vraie sauvegarde de fin du Lion par l’honneur :

- l’écran de fin de chronique propose « Continuer : Les Montagnes de la Résilience (brouillon) » ;
- l’arrivée de l’Ours se joue, avec le badge « Brouillon · image provisoire » ;
- la carte de l’Ours s’affiche, marquée « Brouillon · carte provisoire », avec l’audience comme prochaine étape ;
- l’audience se joue : la compagnie à gauche, Borin à droite, quatre acteurs au plus ; le choix enregistre `bearMandateHonour` (+1) ;
- la sauvegarde porte la partie `bear-…`, le Lion allié, le Serpent ennemi, l’Ours et le Corbeau neutres ;
- les trois boss et les familles de l’Ours apparaissent dans le moteur de combat avec les bonnes compétences, sans erreur.

Depuis une sauvegarde de l’Ours arrêtée avant le jugement (produite par le pilote) :

- la carte montre la région III, avec la veillée et le jugement ;
- « Ouvrir le refuge » sur la veillée ouvre les services du refuge (compagnie, échoppe, amélioration, repos), avec le badge brouillon ;
- le jugement de Borin se joue ; il propose « Assumer nos actes et réclamer le Sceau » et « Demander l’épreuve de l’Ours » ; la réclamation retenue enregistre la voie d’honneur, puis le combat contre le Maître Espion du Corbeau démarre.

Depuis une sauvegarde de l’Ours terminée : l’écran « La chronique s’achève ici » s’affiche, sans bouton pour continuer, puisque le Dragon n’est pas construit.

Ce contrôle a trouvé quatre défauts, corrigés avant ce paquet : la scène d’arrivée ne se jouait pas après « Continuer » ; les scènes de l’Ours n’avaient pas de décor ; elles n’avaient pas de plan de mise en scène ; les refuges et la fin de chronique de l’Ours n’étaient pas listés comme images provisoires, et les refuges n’étaient pas marqués à l’écran. Les scènes brouillon ont maintenant un plan statique simple (compagnie à gauche, gens du plateau à droite, quatre acteurs au plus), qui sera remplacé par une mise en scène relue quand le plateau sera accepté.

Limites : dans ce conteneur, le moteur de combat tourne sur un WebGL logiciel ; un combat de campagne y est trop lent pour être piloté jusqu’au bout (captures et clics expirent). Le contrôle navigateur s’arrête donc au démarrage des combats ; leur résolution est couverte par le pilote logique. L’équilibre tactique de l’Ours n’est pas éprouvé et attend ton test sur PC.

## 8. Jouer l’Ours depuis une sauvegarde de fin du Lion

- **Dans le jeu** : termine une chronique du Lion sur `post-demo`. À l’écran de fin, choisis « Continuer : Les Montagnes de la Résilience (brouillon) ». Une sauvegarde de la démo dont la chronique est finie marche aussi : charge-la avec « Continuer » sur l’écran titre.
- **Sans rejouer le Lion** (développement) : lance le serveur de développement, ouvre `/?qa=1`, choisis « QA rencontres », puis « Ours (brouillon) · depuis une fin du Lion par l’honneur » ou « … par la force ». Le jeu charge une vraie sauvegarde de fin du Lion à la place de la sauvegarde automatique, avec une réputation de départ de 57 (honneur) ou 35 (force), puis continue comme une sauvegarde ordinaire.
- **Combats seuls** : le même laboratoire liste maintenant les combats de l’Ours, marqués « brouillon ».
- Avec `/?qa=1&cin6a=golden`, les combats de la campagne affichent les boutons QA du moteur (dont « Victoire »), pour parcourir l’histoire vite.

## 9. Fichiers principaux

- Plateau : `src/campaign/plateaux/bear/` (topologie, combats, dialogues, jugement, présentation provisoire, liaison), `src/campaign/plateaux/PlateauTopology.ts`, `src/campaign/plateaux/plateauAtlas.ts`.
- `RunSystem` : `src/game/runSystem.ts` (moteur de navigation commun), `src/game/plateauProgression.ts` (clôture et passage), `src/game/plateauFinale.ts` (jugement générique), `src/game/postDemoContent.ts` (registre des brouillons).
- Combat : `src/combat/legacyCombatRuntime.js` (modèles et boss de l’Ours), `src/combat/vfx/DemoVfxActionScope.ts` (miroir).
- Présentation : `src/cinematics/PostDemoPresentationPlans.ts`, `src/ui/PoiMapView.ts`, `src/ui/RefugePresentation.ts`, `src/ui/DialogueView.ts`.
- QA : `src/qa/bearPlateauDriver.ts`, `src/qa/postDemoQaSaves.ts`, `tools/narrative/plateau-text-sheet.ts`.

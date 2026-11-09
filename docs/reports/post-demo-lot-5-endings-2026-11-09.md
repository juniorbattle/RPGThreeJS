# Après-démo, Lot 5 — les fins et le parcours complet (brouillon jouable)

| Champ | Valeur |
| --- | --- |
| TASK | POST-DEMO-LOT-5-ENDINGS |
| DOMAIN | Campagne (règle R4 de bout en bout, épilogues, choix de la Fin de la Crainte), contenu brouillon, combat (dernier combat), présentation provisoire et table des moments, validateur de cohérence, outils de QA |
| BASELINE | `f1cd389d` sur `post-demo` (acte final accepté, OD-2026-11-09-A ; jeu de contrats 1.20.0, baseline immuable `6c965169c2dc153cafd5a8609d914cf8de723ff3`) |
| BRANCH | `post-demo` |
| HEAD | voir le commit de clôture du lot (ce rapport et l’état) |
| STATUS | brouillon jouable, en attente de l’acceptation de l’opérateur |
| MERGED_IN | NONE |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Sur `post-demo` seulement. Après la brèche, la chronique ne s’arrête plus : `RunSystem` enregistre la fin que décide R4, puis l’épilogue de cette fin se joue jusqu’à l’écran « Fin de la chronique » qui la nomme. Les fins sont marquées brouillon dans l’acte final canon ; leurs images sont provisoires et marquées. L’Ours, le Dragon, le Scorpion et l’acte final ne changent pas (aucune réplique) ; la démo sur `dev` non plus. |
| CANONICAL_DOCS_UPDATED | `docs/content/consequence-map-format.md` (champ `draftIds`, section 2) ; `docs/autonomy/AUTONOMOUS_WORK_STATE.md` et `.json`. |
| EVIDENCE | Suite vitest et `node:test`, types, build, validateur des contrats, porte du verrou documentaire, `narrative:validate` (cinq cartes), parcours complets simulés, contrôle navigateur sur un serveur lancé puis arrêté par la session (section 7). Captures dans le dossier de travail de la session, non promues. |

Session cloud de l’après-démo, run `claude-postdemo-lot5-20261109T0032Z`. Elle suit [le brief](../autonomy/POST_DEMO_CLOUD_SESSION_BRIEF.md) (Lot 5), [OD-2026-11-07-I](../autonomy/POST_DEMO_DIRECTION_OPERATOR_DECISION_2026-11-07.md) (R4, F5), [OD-2026-11-08-A](../autonomy/POST_DEMO_LOT_0_OPERATOR_DECISION_2026-11-08.md) à [OD-2026-11-09-A](../autonomy/POST_DEMO_LOT_4_OPERATOR_DECISION_2026-11-09.md).

## Résumé

- **Les trois fins se jouent**, en brouillon : le Respect, la Crainte et l’Équilibre (§2.6, §3.7 phase 3, F5). Quand l’acte se clôt après la brèche, `RunSystem` enregistre la fin que décident les issues des quatre plateaux et la jauge (R4), puis nomme chaque étape de l’épilogue jusqu’à la fin de la chronique.
- **La carte d’abord.** Les ajouts aux cartes des conséquences ont été poussés avant toute réplique (`161ab5b5`). Ils comptent 32 échos, tous réalisés dans le contenu : il ne reste plus aucun écho « prévu » dans les cinq cartes du jeu.
- **Chaque fin dit pourquoi.** Séraphine récite les quatre Sceaux, chacun « confié » par son chef ou « arraché » (pour le Lion, « gagné contre son Champion »), ce qui rend R4 lisible. Kestrel nomme les bannières alliées et ennemies telles que les relations sauvegardées les donnent. Marian rappelle les civils de l’arène. L’Équilibre dit s’il vient de deux et deux, ou d’une jauge qui a tempéré un résultat net.
- **La Fin de la Crainte offre son choix** dans le dialogue qui suit le moment (contrat) : se battre seuls contre tous, ou accepter son destin. Conséquences proposées : le combat laisse la compagnie debout mais le clan sans terre rayé des clans ; le destin accepté livre Alistair et laisse vivre le clan, déchu une fois de plus.
- **Le parcours complet est simulé** depuis les vraies sauvegardes de la démo, à travers les trois plateaux et l’acte final : tout honneur, toute force (les deux réponses), deux et deux, trois et un, et les limites de la jauge (39/40, 59/60). Chaque parcours atteint la fin attendue.
- **Vérifié dans le navigateur**, y compris le vrai passage de la brèche à l’épilogue et le dernier combat gagné, jusqu’à l’écran de fin. Aucune erreur.

## 1. Ce qui est construit

### Le déroulé

1. La brèche gagnée, la scène de Maelor tombé, puis la clôture de l’acte (« Refermer la brèche, maintenant… »), inchangées.
2. `RunSystem` clôt l’acte, enregistre la fin (R4) et met l’acte final en épilogue. Ces faits sont durables : une partie sauvegardée ici reprend sur l’épilogue.
3. Le tableau vivant de la fin ne joue pas tant que son tableau est provisoire : la fin passe directement à son dialogue.
4. L’épilogue de la fin se joue. Dans la Crainte : le choix, puis le dernier combat et la scène de clôture, ou directement la scène de clôture.
5. L’écran de fin de la chronique nomme la fin (« Fin de la chronique · Le Respect »), sans suite possible.

### Les scènes (4, en brouillon)

| Scène | Ce qu’elle nomme |
| --- | --- |
| `finale_epilogue_respect` | La brèche refermée tous ensemble ; les bannières alliées ; les quatre Sceaux ; le premier chef allié (Alaric, sinon Borin, Kaelen ou le Grand Inquisiteur) qui appelle les clans à se rassembler sous la bannière de la compagnie ; les civils ; la justice et les sacrifices partagés ; le clan qui retrouve son honneur et devient un pilier de la nouvelle alliance |
| `finale_epilogue_balance` | Un monde qui tient mais marqué ; les bannières à ses côtés et celles qui observent de loin ; les quatre Sceaux ; pourquoi l’Équilibre ; les civils ; une paix fragile à négocier, au prix d’une part de ses idéaux ; le clan qui regagne une part de son honneur |
| `finale_epilogue_fear` | Les Ombres vaincues ; la compagnie seule, ou presque ; les quatre Sceaux ; les civils ; les bannières des clans ennemis qui approchent ; les clans qui exigent qu’on leur livre Alistair ; le choix |
| `finale_fear_close` | Après le dernier combat : « Nous nous sommes battus seuls contre tous », le clan rayé, « Alors nous marcherons sans nom ». Après le destin accepté : « Vous avez accepté votre destin, Alistair, pour que les autres vivent », le clan qui vivra, déchu une fois de plus |

Aucun clan, lieu, personnage ou objet nouveau. L’entité reste sans nom ; la capitale aussi. Les fins reprennent les termes du §2.6 et du §3.7 et les faits de la démo : le clan qui a perdu ses terres et sa place, les quatre Sceaux. Texte complet dans [la fiche de texte](post-demo-lot-5-endings-text-sheet-2026-11-09.md), section « Les fins ».

### Le dernier combat (Fin de la Crainte, premier choix)

« Seuls contre tous » (`finale_last_stand`, élite), dans l’arène provisoire de la brèche. Aucun soutien de clan. Le pillard du Serpent, toujours ennemi, puis les adversaires des autres clans ennemis, dans l’ordre où la compagnie les a rencontrés, quatre au plus. Aucune récompense : la chronique s’achève. Une défaite recharge la dernière sauvegarde, comme partout.

## 2. La carte des conséquences

Les fins s’ajoutent à des cartes déjà canon. Pour qu’elles restent reconnaissables comme brouillon, le format gagne un champ facultatif `draftIds` : la liste des faits, choix et échos ajoutés en brouillon (format 1, toutes les cartes antérieures restent valides ; `docs/content/consequence-map-format.md`). La carte s’écrit d’abord : tant que tous les échos d’un choix en brouillon restent « prévus », le validateur le vérifie comme une conception, puis entièrement dès qu’un écho est réalisé.

| Ajout | Carte | Échos |
| --- | --- | --- |
| Chaque issue nommée dans la récitation des Sceaux des trois épilogues (« le Sceau de l’Ours, que Borin nous a confié » / « arraché à Borin ») | Lion, Ours, Dragon, Scorpion | 24 |
| Les civils de l’arène dans chaque épilogue (« les civils sauvés de l’arène » / « la foule abandonnée de l’arène »), auparavant prévus | Acte final | 6 |
| Le choix de la Fin de la Crainte : `finaleFearLastStand` (puis `finaleLastStandWon`) ou `finaleFearFateAccepted`, chacun nommé dans la scène de clôture | Acte final | 2 |

R4 est déjà une fonction de `RunSystem` depuis le Lot 0 (`resolveCampaignEnding`). La fin lue est celle de la jauge au moment où l’acte se clôt.

## 3. Réputation

Aucune. Les fins ne déplacent pas la jauge ; le dernier combat ne rapporte rien. Les bornes de l’acte final restent +4 et +3 ; l’honneur constant finit à 88, la partie parfaite à 100.

## 4. Ce qui change ailleurs

- **`RunSystem`** (`src/game/finalAct.ts`) : la clôture de l’acte enregistre la fin et met l’acte en épilogue ; `nextEpilogueStep` nomme l’étape suivante ; `completeCampaignEnding` clôt la chronique (identifiants durables `ending-respect`, `ending-balance`, `ending-fear-last-stand`, `ending-fear-fate`) et refuse tant qu’une étape manque. Si l’enregistrement de la campagne n’avait pas ses quatre issues (aucune partie ne le produit), la chronique se fermerait à la brèche, comme avant.
- **Effet de récit** `completeEpilogue`, appliqué par `RunSystem` à la dernière réplique de chaque fin.
- **`GameApp`** coordonne seulement : l’étape que nomme `RunSystem`, le dernier combat hors de la carte, et les mots de l’écran de fin lus dans la fin enregistrée.
- **Journey** : l’écran de fin accepte un sur-titre, un titre et une phrase fournis par la campagne. Il est inchangé ailleurs.
- **Validateur** : le champ `draftIds` et la règle de conception des brouillons ; les épilogues, le dernier combat et son fait de victoire comme références de l’acte final.
- **Pilote de QA** : il joue l’épilogue jusqu’à la fin de la chronique ; un crochet de QA règle la jauge au moment de la clôture pour éprouver ses limites.
- **Laboratoire QA** : trois boutons « Fin (brouillon) · le Respect / la Crainte / l’Équilibre » ouvrent chaque fin au début de son épilogue.
- **Fiche de texte** : une section « Les fins », marquée brouillon, après la clôture de l’acte ; la table des soutiens dit « approuvés, OD-2026-11-09-A ».

## 5. Ce qui reste à décider (fiche)

1. **Accepter les fins comme canon**, ou demander des retouches.
2. **Les conséquences du choix de la Crainte** (proposées) : le combat laisse la compagnie debout mais le clan sans terre rayé des clans (le « ou pire, anéanti » du §2.6) ; le destin accepté livre Alistair et laisse vivre le clan, déchu une fois de plus.
3. **Le dernier combat** (proposé) : seuls contre tous, sans aucun soutien de clan, contre le pillard du Serpent et les adversaires des autres clans ennemis, quatre au plus.
4. **La table des moments de l’acte final** (proposée) : la trahison au Tournoi et les trois épilogues, chacun avec les faits qu’il peut montrer. Elle ne joue que sur des tableaux approuvés.
5. **L’écran de fin** : « Fin de la chronique », le nom de la fin, puis « Quatre Sceaux, la brèche refermée : la Voie des Sceaux s’achève ici. »

**Un oubli à signaler.** Le brief demandait aussi que chaque plateau propose sa table des moments (l’arrivée et ses deux issues). Les Lots 1 à 3 ne l’ont pas fait. Ces moments ne jouent pas aujourd’hui, puisque tous leurs tableaux sont provisoires ; je propose de les soumettre avec le lot des images finales, quand les tableaux approuvés existeront.

## 6. Images provisoires et images finales attendues

Toutes provisoires et marquées à l’écran ; aucune générée, aucune vidéo. Source : `src/campaign/plateaux/finale/finalePresentation.ts`, vérifiée par un test.

- **Tableaux vivants des fins (3)** : le Respect, la brèche refermée avec les alliés et les clans rassemblés ; la Crainte, la compagnie seule devant les bannières des clans ; l’Équilibre, une paix fragile entre les clans. Aujourd’hui sur le tableau de l’épilogue du Lion, des signes des Ombres et du refuge final.
- **Tableau (1)** : la fin de la Crainte, après le dernier combat ou le destin accepté.
- **Table des moments (4)** : la trahison au Tournoi et les trois épilogues ; aucun ne joue tant que son tableau est provisoire.
- Aucun personnage ni ennemi nouveau : le dernier combat reprend les adversaires des clans.

## 7. Vérification

| Contrôle | Résultat |
| --- | --- |
| `npx tsc --noEmit` | vert |
| `npx vitest run` | 3 155 réussis, 23 ignorés, 10 échecs connus de la ligne de base (spritesheetPng 5, cin6ea3_pilot_e_regate 4, cin4_media 1), aucun nouveau |
| `node --test tools/qa/qa-job.test.mjs` | 26 sur 26 |
| `npm run build` | vert |
| `npm run contracts:validate` | vert |
| Porte du verrou documentaire | vide |
| `npm run narrative:validate` | cinq cartes valides, vérification complète ; Lion 48 échos, Ours 41, Dragon 42, Scorpion 39, acte final 18 ; aucun écho prévu |
| `npm run cinematics:validate-narrative-staging` | vert |

**Parcours complets simulés** (`src/qa/campaignEndingsDriver.test.ts`), depuis les vraies sauvegardes de la démo, le Lion terminé, puis l’Ours, le Dragon, le Scorpion et l’acte final joués par le pilote :

- tout honneur : le Respect ; les quatre Sceaux confiés ; sept bannières alliées ; Alaric parle ; les civils sauvés ;
- toute force, dernier combat : la Crainte ; le combat sans soutien contre le pillard du Serpent, le guerrier de l’Ours, l’éclaireur du Corbeau et le gardien du Dragon ; « Nous nous sommes battus seuls contre tous » ; `ending-fear-last-stand` ;
- toute force, destin accepté : `ending-fear-fate`, sans dernier combat ;
- deux et deux : l’Équilibre ; « Deux Sceaux confiés, deux arrachés » ; alliés et ennemis nommés ;
- trois honneurs et une force (le Lion par l’épreuve) : le Respect, « le Sceau du Lion, gagné contre son Champion » ;
- limites de la jauge à la clôture : quatre honneurs à 40 donnent le Respect, à 39 l’Équilibre ; quatre forces à 59 donnent la Crainte, à 60 l’Équilibre, chacun avec la phrase qui le dit ;
- sauvegarde et reprise d’une chronique close ; ouverture de chaque fin pour le laboratoire.

**Contrôle navigateur** (serveur lancé puis arrêté par la session, 1440×810 et 390×844), avec des parties jouées par le pilote :

- Respect depuis le début de l’épilogue : la marque « Brouillon · image provisoire », les Sceaux, les alliés, les civils, puis « Fin de la chronique · Le Respect », sans « Continuer ».
- Crainte, dernier combat : le choix et ses aperçus, les bannières qui approchent ; le combat démarre avec quatre adversaires et sans soutien ; gagné par la commande de QA, puis la scène de clôture et « La Crainte ».
- Crainte, destin accepté : la scène de clôture puis « La Crainte ».
- Équilibre : « Deux Sceaux confiés, deux arrachés », puis « L’Équilibre » ; l’écran de fin tient à la largeur d’un téléphone, sans défilement horizontal.
- **Le vrai passage** depuis une sauvegarde d’avant la brèche : la question de Maelor, le combat gagné, Maelor tombé, la clôture de l’acte, l’épilogue du Respect, l’écran de fin.
- Le bouton de laboratoire « Fin (brouillon) · l’Équilibre » ouvre l’épilogue.
- Aucune erreur.

**Relu et corrigé avant de livrer** : l’Équilibre d’une compagnie sans allié commençait par « D’autres nous observent… » sans les « certaines » qui précèdent ; la première réplique du Respect disait « Elle se referme » sans nommer la brèche.

Limites : le combat de campagne tourne trop lentement sur le WebGL logiciel du conteneur pour être joué à la main ; les combats ont été gagnés par la commande de QA, et l’équilibre tactique du dernier combat attend ton test sur PC.

## 8. Jouer les fins

- **Dans le jeu** : termine l’acte final sur `post-demo` ; la fin dépend de tes quatre issues et de ta réputation.
- **Directement** (développement) : `/?qa=1`, « QA rencontres », puis « Fin (brouillon) · le Respect », « … la Crainte » ou « … l’Équilibre ». Le jeu joue les trois plateaux et l’acte final par le pilote depuis une vraie fin du Lion, puis s’ouvre au début de l’épilogue.
- Avec `/?qa=1&cin6a=golden`, le dernier combat montre la commande de QA « Victoire ».

## 9. Après ce lot

Le brief s’arrête ici : avec ce lot, l’après-démo est complète en brouillon jouable. L’Ours, le Dragon, le Scorpion, l’acte final et ses fins restent sur `post-demo`. Leur intégration à `dev` attend ton ordre explicite et commencera par une étiquette Git sur le dernier commit de la démo (OD-2026-11-08-A, point 6). Les images finales forment un lot à part, mené avec toi.

## 10. Fichiers principaux

- Fins : `src/campaign/plateaux/finale/finaleEpilogues.ts` ; présentation et table des moments : `finalePresentation.ts`.
- Vérité : `src/game/finalAct.ts`, `src/game/campaignRelations.ts` (R4), `src/game/types.ts` (effet `completeEpilogue`).
- Coordination et présentation : `src/game/GameApp.ts`, `src/journey/JourneyRunNodeAdapter.ts`, `src/journey/JourneyCampaignBoundary.ts`.
- Cartes et cohérence : `src/campaign/consequences/*.consequences.json`, `ConsequenceMap.ts`, `src/game/narrativeCoherence.ts`, `docs/content/consequence-map-format.md`.
- QA : `src/qa/plateauDriver.ts`, `src/qa/campaignEndingsDriver.test.ts`, `src/qa/postDemoQaSaves.ts`, `tools/narrative/plateau-text-sheet.ts`.

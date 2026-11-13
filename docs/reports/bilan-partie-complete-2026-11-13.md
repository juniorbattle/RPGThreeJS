# Bilan de fin de conception : la partie complète testée (2026-11-13)

| Champ | Valeur |
| --- | --- |
| TASK | `OD-2026-11-13-F-Q1` (run `claude-bilan-partie-complete-20261113T1645Z`) : prouver que le jeu se joue de bout en bout avant le test de l'opérateur sur PC |
| DOMAIN | Campagne et sauvegardes (tests), coordination `GameApp`, présentation de fin de chronique, outillage QA navigateur |
| BASELINE | `b2830891` sur `dev` (jeu de contrats 1.23.0, baseline immuable `6228a34fd69a01406ecf0fb7168a53f92a267d7b`) |
| BRANCH | worktree `claude/quizzical-franklin-f2b5e9`, publié sur `dev` |
| HEAD | le commit de ce rapport |
| STATUS | merged |
| MERGED_IN | `dev` (`8fe30774`, `bb0d8d2a`, `bbc93f01`, puis le commit de ce rapport) |
| SUPERSEDES | NONE (applique l'arbitrage Q1 de `docs/autonomy/COMPLETENESS_REVIEW_OPERATOR_DECISION_2026-11-13.md` ; répond au §4 de `docs/reports/game-completeness-review-2026-11-13.md`) |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | (1) Les effets de dialogue changent l'état dans `src/game/narrativeEffects.ts` au lieu du `switch` de `GameApp.applyEffects` : même comportement, un seul propriétaire. (2) Après un combat du Tournoi gagné, son dialogue d'après-combat s'ouvre « en direct » : la trahison joue enfin son moment approuvé. (3) La fin de chronique de l'acte final ne montre plus Maelor à côté de la compagnie. (4) Le panneau de fin de chapitre et de chronique est une carte compacte au lieu d'une bande de 1040 px. Aucune règle, aucun texte, aucun choix, aucune récompense, aucune donnée de combat, aucun format de sauvegarde changé. |
| CANONICAL_DOCS_UPDATED | NONE : ni contrat ni document canonique touché ; l'état, `AGENTS.md` et `OPERATOR_DECISIONS.md` restent à la session parente. |
| EVIDENCE | Tests (section 2), `tsc`, build, `npm test`, `contracts:validate`, garde vide (section 6). Navigateur : `tools/full-chronicle-browser-qa.mjs`, rapports machine sous `tmp/full-chronicle/` (ignoré) ; résultat compact et captures choisies promus dans `docs/reports/bilan-partie-complete-2026-11-13/`. |

## Verdict

`CURRENT FACT` : le jeu se joue de bout en bout.

- **Tests.** Le Lion actuel de `dev` se joue depuis une nouvelle chronique et passe à l'Ours par la sauvegarde qu'il écrit. On traverse ensuite le Dragon, le Scorpion et l'acte final jusqu'aux trois fins, y compris les deux réponses de la Peur.
- **Navigateur.** La même partie a été jouée deux fois en entier par de vrais clics, chaque fois jusqu'à une fin, console sans erreur.

Le parcours a révélé trois défauts de présentation, corrigés ici (section 4). Il ne prouve pas l'équilibre des combats : dans le navigateur, chaque combat est gagné par la commande QA du moteur tactique (section 3).

## 1. Ce qui manquait, et ce qui le couvre maintenant

| Manque relevé au §4 du bilan | Couvert par |
| --- | --- |
| Les pilotes partaient des sauvegardes de la démo figée `25ccd2f2`, avec une réputation forcée | `src/qa/fullCampaignPlaythrough.test.ts` : nouvelle chronique du Lion actuel, puis chaque chapitre depuis la sauvegarde que le précédent écrit, écrite et relue par `SaveRepository` |
| `plateauDriver.ts` recopiait le `switch` d'effets de `GameApp` | `src/game/narrativeEffects.ts`, appelé par `GameApp.applyEffects` et par le pilote |
| Aucune sauvegarde prise au milieu d'un plateau | `src/qa/midChapterSaves.test.ts` |
| Le retour après défaite ne couvrait que le Lion | `src/game/postLionDefeatRecovery.test.ts` |
| Le parcours dans `GameApp` après le Lion n'était testé qu'avec un `GameApp` simulé | `src/game/GameAppPostLionChronicle.test.ts` |
| Aucune partie complète dans le navigateur | `tools/full-chronicle-browser-qa.mjs`, section 3 |

### Le pilote suit maintenant le jeu

`src/qa/plateauDriver.ts` reste un outil de QA : il ne tourne jamais dans le jeu. Il joue désormais aussi le Lion (`playLion`), sur sa carte de POI, avec l'ouverture du jeu (`acte_ouverture`, puis le départ du camp). Il reprend une sauvegarde comme `GameApp.resumeSavedCampaign` (`resumeChapter`). Ses écarts avec `GameApp` sont corrigés :

- les réponses passent par `resolveContestOutcome`, comme dans la vue de dialogue ;
- au refuge, la potion offerte à partir de 60 de réputation et la scène de rassemblement viennent de `resolveRefugePresentation` ;
- une scène contextuelle « une fois » pose son drapeau ;
- l'événement de réputation du Lion (R4) se joue après le POI ;
- un combat demandé par la scène d'avant-combat est engagé ;
- la carte est réglée en fin de chapitre, comme avant la sauvegarde du jeu.

Les quatre pilotes de plateau existants et les huit fins du `campaignEndingsDriver` passent sans changement d'attente.

## 2. Les tests

| Fichier | Cas | Ce qu'il prouve |
| --- | --- | --- |
| `src/qa/fullCampaignPlaythrough.test.ts` | 5 | Respect, Équilibre, Peur (dernier carré) et Peur (destin accepté), chacune depuis une nouvelle chronique. Chaque sauvegarde relue est identique à l'état du chapitre. Réputation, or et compagnie passent au chapitre suivant. Les issues des quatre plateaux sont celles du plan. La chronique est close : plus d'épilogue, plus de chapitre. |
| `src/qa/midChapterSaves.test.ts` | 11 | Une sauvegarde au second refuge de l'Ours, du Dragon et du Scorpion, au dernier refuge de la capitale et sur le plateau du Tournoi (avant le Phénix), sur deux plans, plus le Lion à son second refuge. Relue, elle rend le même état sur la même route. Reprise, elle finit le chapitre comme une partie sans coupure : mêmes combats, mêmes répliques, même état final. |
| `src/game/postLionDefeatRecovery.test.ts` | 9 | Dans un vrai `GameApp`, pour l'Ours, le Dragon, le Scorpion et l'acte final. Une défaite recharge la sauvegarde de la même partie (même `run.id`, même graine), jamais une sauvegarde plus récente d'un autre chapitre. Elle n'écrit rien et ne reprend que sur un clic. La reprise se fait aussi sur le boss choisi au jugement (sans second jugement), sur le plateau du Tournoi et sur le dernier carré de la Peur. |
| `src/game/GameAppPostLionChronicle.test.ts` | 2 | Le vrai cycle de `GameApp`, de « Continuer » à l'écran de fin, sur Respect et Peur. Seul le rendu est remplacé : réponses du dialogue, victoire du moteur tactique, rideau immédiat, surface Journey. On obtient les mêmes combats et le même état final que le pilote. Les cinq panneaux de fin de chapitre portent les bons libellés. La trahison et l'épilogue s'ouvrent en direct. Aucune `console.error`. |
| `src/game/narrativeEffects.test.ts` | 3 | Le module d'effets : la finale du Lion se choisit une seule fois et demande la sauvegarde ; la fin de chapitre ferme le plateau. |
| `src/game/GameAppPostDemoMoments.test.ts` | mis à jour | La trahison s'ouvre en direct juste après la finale ; un verdict s'ouvre en direct sans moment. |
| `src/cinematics/NarrativeTableau.test.ts` | +1 | La fin de l'acte final est sans Maelor ; les trois plateaux gardent la distribution du Lion. |
| `src/game/r6FullRouteIntegration.test.ts` | mis à jour | Le garde-fou de texte lit l'ordre « boss déjà choisi, puis exécution » dans `narrativeEffects.ts`, et la sauvegarde immédiate dans `GameApp.applyEffects`. |

### Ce que les parties du pilote montrent (graines fixes)

| Plan | Lion | Ours | Dragon | Scorpion | Acte final | Fin |
| --- | --- | --- | --- | --- | --- | --- |
| Respect | 30 → 59, 5 combats | 59 → 73, 4 | 73 → 83, 6 | 83 → 87, 4 | 87 → 92, 7 | `ending-respect` |
| Équilibre | 30 → 59, 5 | 59 → 73, 4 | 73 → 62, 7 | 62 → 51, 7 | 51 → 56, 7 | `ending-balance` |
| Peur | 30 → 19, 8 | 19 → 7, 7 | 7 → 0, 7 | 0 → 0, 7 | 0 → 1, 9 (dernier carré) | `ending-fear-last-stand` |

## 3. La partie jouée dans le navigateur

**Méthode.**

- Serveur DEV lancé par `preview_start` sur le port 5183, avec une config QA ignorée (`tmp/full-qa.vite.config.ts`). Elle autorise Vite à servir le `node_modules` du dossier principal : le worktree n'en a pas, et les polices répondaient 403.
- Le pilote ne démarre aucun serveur ; aucun job `live.qaJobs` n'était donc à inscrire.
- Chaque pas est un clic sur les contrôles du jeu : écran titre, « Passer » de l'ouverture, case et réponses de chaque dialogue, POI et « Se rendre », « Reprendre la route » au refuge, panneaux Journey, « Suivant » du plateau du Tournoi.
- La réponse et le POI suivant sont choisis par la politique des tests (`chooseAnswer`, `nextRoutePoi`), calculée dans la page sur l'état réel. Le script de démarrage DEV est réécrit au vol uniquement pour exposer l'instance de `GameApp` en lecture.

**Comment les combats sont résolus.** Ils ne sont pas joués coup par coup.

- L'école du combat et la carte de boss sont fermées comme un joueur les ferme (« Passer », « Commencer »).
- Chaque combat est gagné par la commande QA « Victoire » du moteur tactique (DEV, `?qa=1&cin6a=golden`). Elle termine la vague par le chemin normal du moteur, qui envoie un vrai résultat à `GameApp`.
- La carte de résultat « Continuer la chronique » est ensuite cliquée à la souris, après un test de hit montrant qu'elle est au premier plan.
- Les tableaux vivants sont quittés par « Passer » une fois à l'écran.

**Passes.**

| Passe | Commit joué | Départ | Réglages | Résultat |
| --- | --- | --- | --- | --- |
| 1a | `51dff190` | nouvelle chronique, plan Respect | défaut (mouvement non réduit) | fin **Le Respect** en 1 453 s : 5 chapitres, 27 combats, 58 réponses, 115 dialogues, 13 refuges ; console sans erreur, aucune requête en échec |
| 1b | `51dff190` | sauvegarde du Lion actuel, plan Peur | défaut | fin **La Crainte** (dernier carré) en 1 290 s : 30 combats, 31 réponses ; console sans erreur |
| 2 | `bb0d8d2a` | les deux mêmes | défaut et `reducedMotion: 'reduce'` émulé | interrompues à ~570 s par le rechargement de Vite quand j'ai modifié `GameApp.ts` (correction de la trahison) : ce n'est pas un défaut du jeu, et elles ne comptent pas |
| 3a | `bbc93f01` | nouvelle chronique, plan Respect | défaut (mouvement non réduit) | fin **Le Respect** en 1 489 s : 5 chapitres, 26 combats, 58 réponses, 113 dialogues, 13 refuges, 73 déplacements sur la carte ; console sans erreur, aucune requête en échec, aucun contrôle masqué |
| 3b | `bbc93f01` | sauvegarde du Lion actuel, plan Peur (dernier carré) | `reducedMotion: 'reduce'` émulé (réglage du système) | fin **La Crainte** en 1 337 s : 4 chapitres, 30 combats dont le dernier carré, 32 réponses ; console sans erreur, aucune requête en échec |

Le commit final de ce rapport ne diffère de `bbc93f01`, pour le jeu, que par la forme d'un appel (`playDialogue(id, label)` sans option quand l'ouverture n'est pas en direct) : même comportement, alignement de trois tests (section 4).

**Ce que la passe 3 montre, chapitre par chapitre** (3a) :

- **Le Lion.** Ouverture passée, carte, 5 combats (de l’embuscade au Général du Serpent). Bois-Clair, l'audience et le jugement ouvrent leur tableau vivant. Panneau de préparation « Carte de campagne », puis fin de chapitre « Continuer : Les Montagnes de la Résilience ». Réputation 30 à l'arrivée.
- **L'Ours, le Dragon, le Scorpion.** Chacun s'ouvre sur sa scène d'arrivée et son moment, puis sa carte, ses refuges, son jugement, son boss et son moment d'issue (4, 6 et 4 combats ; 7 pour l'acte final). Le panneau de fin de chapitre nomme la partie suivante. Réputation à l'arrivée : 59, 73, 83.
- **L'acte final.** Plateau du Tournoi (sept étapes), puis le moment de la trahison, absent avant la correction (`finale:finale-arena-gate` dans la liste des tableaux vivants). Ensuite la capitale, la brèche, le moment de l'épilogue, et l'écran **Fin de la chronique — Le Respect** : Alistair et Séraphine seuls, sur la carte compacte. « Retour au menu » ramène au titre.

La passe 3b suit le même chemin depuis l'Ours, mouvement réduit émulé, jusqu'à **La Crainte**. Le dernier carré y est combattu, et la réputation tombe de 19 à 0.

**Captures promues** (`docs/reports/bilan-partie-complete-2026-11-13/`, 1440×810, réencodées en JPEG) :

- `01-lion-map` ;
- `02-lion-chapter-end` ;
- `03-bear-map`, `04-dragon-map`, `05-scorpion-map` ;
- `06-finale-capital-map` ;
- `07-end-respect` ;
- `08-end-fear-reduced-motion`.

Avec elles, `browser-result.json`, le résultat machine compact des passes 3a et 3b, avec le résumé des passes 1 et 2. La capture du plateau du Tournoi n'est pas promue : elle a été prise pendant son fondu d'entrée.

## 4. Défauts trouvés et corrigés

1. **La trahison jouait sans son moment.**
   - Cause : le combat de la finale porte `postCombatDialogueId: 'finale_betrayal'` dans `finaleCombat.ts`, et `GameApp.resolveCombat` jouait cette scène tout de suite, sans ouverture en direct. L'étape « après » du plateau, qui devait l'ouvrir en direct avec `finale_betrayal_moment`, la trouvait déjà jouée.
   - Le test unitaire ne le voyait pas : il remplaçait `playDialogue`. Vu dans le navigateur.
   - Correction (`GameApp`) : le dialogue d'après-combat d'un combat du Tournoi gagné en direct s'ouvre en direct. Les verdicts, sans moment, ne changent pas ; l'étape du plateau sert toujours à la reprise après un rechargement.
   - Les quatre combats du Tournoi ont le même dialogue en après-combat et en étape « après » ; `finaleCombat.ts` (fichier du lot récit) n'est pas touché.
2. **Maelor se tenait à côté de la compagnie à la fin de l'acte final.**
   - Signalé par l'opérateur sur une capture de la passe 1a.
   - Cause : chaque fin de chronique de l'après-démo reprend la mise en scène de fin du Lion (`CHRONICLE_END_TABLEAU` : Maelor, Alistair, Séraphine). C'est juste pour le Lion et les trois plateaux, où Maelor est encore l'intendant du clan, mais pas après sa trahison au Tournoi et sa fuite par la brèche.
   - Correction (`NarrativeTableau.ts`) : la fin de l'acte final garde la salle et les places, sans Maelor, déclaré hors champ avec sa raison. Le validateur de mise en scène passe.
3. **Le panneau de fin était une bande de 1040 px.**
   - Demande de l'opérateur : « beaucoup trop large… plus affiné/adapté ».
   - Correction (`app.css`, mode `terminal` de l'overlay Journey) : une carte de 500 px au plus, centrée sous la compagnie, texte centré, bouton à la largeur de son libellé.
   - Mesuré dans le navigateur :
     - 1440×810 : carte de 500×192, « Continuer : Les Montagnes de la Résilience » sur une ligne (378×40) ;
     - 390×844 : carte de 370 px avec marges de 10 px, bouton dans la carte, aucun débordement horizontal.

## 5. Constats pour l'opérateur (pas des défauts)

- **Réputation en sortie de Lion.** Le Lion réel finit à 59 en honneur et 19 en force. Les pilotes de plateau partaient de 57 et de 35 ou 40.
- **Partie « tout force ».** La réputation tombe à 0 dès le Dragon et y reste au Scorpion ; toutes les fins restent atteintes. À juger au test sur PC.
- **Après le lot récit.** Les embranchements de combat N1 et les répliques N2 et N3 attendent la validation de l'opérateur et ne sont pas encore dans le jeu. Les tests de ce lot les traverseront dès leur arrivée, mais la passe navigateur devra être rejouée après.

## 6. Vérification

- `npx tsc --noEmit` : OK.
- `npm run build` : OK, avec l'avertissement habituel sur la taille des morceaux.
- `npm run contracts:validate` : 8 contrats LOCKED validés.
- `npm run cinematics:validate-narrative-staging` : OK.
- Garde `git diff --exit-code 6228a34fd69a01406ecf0fb7168a53f92a267d7b HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md` : vide.
- `npm test`, partie vitest : 245 fichiers sur 248, 3 469 tests réussis, 5 ignorés (garde du megapack, `ebb47016`), 5 échecs. Les 5 échecs sont dans trois tests historiques de `tools/cinematics` (`cin6c_p1_production`, `cin6ea3_pilot_e_regate`, `minimax_task_checkpoint`) qui lisent des médias de `tmp/cinematics/`, ignorés par Git et absents d'un worktree neuf : environnement, pas régression. Les sessions combat et présentation ont relevé les mêmes.
- `npm test`, partie `node --test tools/qa/qa-job.test.mjs` (lancée à part, puisque vitest sort en échec) : 26 sur 26.

## 7. Non fait, limites

- **Combats.** Aucun combat n'a été joué coup par coup ; l'équilibre n'est pas couvert. Les combats des tests sont déclarés gagnés ; ceux du navigateur passent par la commande QA « Victoire ».
- **Pilote du Lion existant.** `tools/demo-continuous-production-qa.mjs`, qui joue de vrais combats dans le Lion, n'a pas été relancé. Il s'inscrit dans `live.qaJobs` de l'état, que cette session ne devait pas modifier ; c'est à la session parente de l'inscrire et de le lancer.
- **Ce que le pilote navigateur ne visite pas.** Ni coffres, ni gardiens, ni échoppe, ni engagement au refuge, ni repos. Les tableaux vivants sont passés, pas regardés jusqu'au bout.
- **Résolutions.** La passe complète est en 1440×810. La carte de fin a été mesurée aussi en 390×844 ; la passe mobile reste celle prévue après le test sur PC.
- **Mouvement réduit.** Il est réglé dans le jeu et n'a pas été testé par ce réglage ; seul le réglage du système (`reducedMotion: 'reduce'`) a été émulé, comme le demande la règle.

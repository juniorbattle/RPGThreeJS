# Mémoire du combat : la croissance par combat (2026-11-15)

| Champ | Valeur |
| --- | --- |
| TASK | `M1` de [OD-2026-11-15-A](../autonomy/PERFORMANCE_OPERATOR_DECISION_2026-11-15.md) (run `claude-combat-memory-20261115T1153Z`) |
| DOMAIN | Outillage de mesure ; mémoire du combat (présentation) |
| BASELINE | `03f34648` sur `dev` (jeu de contrats 1.24.0, baseline `133814bac45cc31c8eda7aa0fa1acb16a9ca7e35`) |
| BRANCH | worktree `claude/combat-memory-2026-11-15`, publié sur `dev` |
| HEAD | le commit de ce rapport |
| STATUS | merged : livré sur `origin/dev` |
| MERGED_IN | `dev` |
| SUPERSEDES | NONE. Corrige le constat mémoire de [performance-2026-11-15.md](performance-2026-11-15.md) (« environ 40 Mo par combat »), qui reste tel quel comme trace. |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | NONE. Aucun fichier du jeu ne change : ni `src/`, ni `legacy-combat.html`, ni la résolution du combat, ni la vérité de jeu, ni les sauvegardes V6. Seuls les outils de mesure changent. |
| CANONICAL_DOCS_UPDATED | NONE. L'état (`nextAction`) et les documents de décision reviennent à la session principale, sur consigne. |
| EVIDENCE | Pilote `tools/perf/measure-performance.mjs` (scénario `leak`) sur le build de production avant et après, réglages par défaut puis `reducedMotion: 'reduce'` émulé ; boucle `tools/perf/combat-frame-loop.mjs` sans session DevTools sur la page ; vidages memory-infra ; bissection du chunk du combat ; instantané du tas. Sorties ignorées sous `tmp/perf/`. Test de garde `tools/perf/devtoolsNetworkBuffers.test.ts`. Limites dans « Ce qui n'est pas vérifié ». |

## La demande

`APPROVED DECISION`. L'audit des performances du 2026-11-15 avait mesuré environ 40 Mo de plus par combat dans le processus de rendu de Chromium (279 → 530 Mo sur cinq combats, dans `partition_alloc`), alors que le tas JS revenait à 7–8 Mo. Pour M1, l'opérateur a choisi, mot à mot : « Tâche dédiée avant la passe mobile ».

## Conclusion

`CURRENT FACT`.

- **Le jeu ne retient rien d'un combat à l'autre.** Mesuré sans aucune session DevTools sur la page, le processus de rendu monte pendant les cinq premiers combats, puis reste plat.
- **Les 40 Mo par combat venaient de l'outil de mesure.** Toute session DevTools qui active le domaine `Network` sans paramètre garde, dans le processus de rendu, le contenu des réponses de la page : scripts, sprites, sons. Elle les garde tant que la page principale vit, avec les tampons par défaut de Chromium.
  - Playwright active ce domaine sur sa propre session de chaque page, et le pilote l'activait une seconde fois sur la sienne.
  - Chaque combat recharge l'iframe du combat, donc toutes ses ressources s'empilaient dans la partition `buffer` de `partition_alloc`.
  - Ni le ramasse-miettes ni une alerte mémoire critique n'y touchent, ce qui collait au constat de l'audit.
- **La correction est dans le pilote.** Il active désormais `Network` avec des tampons nuls, sur ses deux sessions. Mesuré ainsi, le parcours en jeu ne grossit plus : 318 → 303 Mo du premier au cinquième combat, contre +34 Mo par combat avant.

## La reproduction

`CURRENT FACT`. Build de production de `03f34648` (`npm run build`, `vite preview` sur 5189), sauvegardes de `tools/perf/make-perf-saves.ts`, scénario `leak` : le combat des loups est joué 25 s puis abandonné, cinq fois, puis « Reprendre la sauvegarde ». Le pilote force un GC avant chaque point de contrôle.

| Point de contrôle | Processus de rendu, privé | `partition_alloc` | Tas JS |
| --- | --- | --- | --- |
| Carte, avant les combats | 275 Mo | — | 6,1 Mo |
| Après 2 combats | 355 Mo | 273 Mo | 7,3 Mo |
| Après 3 combats | 395 Mo | 311 Mo | 7,5 Mo |
| Après 4 combats | 433 Mo | 345 Mo | 7,6 Mo |
| Après 5 combats | 457 Mo | 372 Mo | 7,5 Mo |
| Après l'alerte mémoire critique | 457 Mo | 372 Mo | 7,6 Mo |

La courbe de l'audit est confirmée : environ +34 Mo par combat, toute la croissance dans `partition_alloc`, le tas JS stable, zéro requête en échec.

## L'isolement

`CURRENT FACT`. Chaque étape répond à une question, preuve à l'appui.

1. **Sans le jeu autour.** Une page vide monte puis retire l'iframe du combat six fois : +18 Mo par cycle, tous dans `partition_alloc/partitions/buffer` (19,8 → 111,4 Mo). Après chaque retrait, il reste 1 document, 5 nœuds, 0 écouteur et 0,9 Mo de tas : l'iframe est bien déchargée et rien ne la retient. La fenêtre du jeu n'y est pour rien.
2. **Sans combat.** La page du combat chargée sans lancer de combat laisse déjà 3,9 Mo par chargement ; `about:blank` ne laisse rien. Bloquer les polices ou le CSS ne change rien. Bloquer le JS supprime presque tout (0,3 Mo).
3. **Sans exécuter notre code.** J'ai servi une copie des chunks avec un `throw` inséré avant la k-ième instruction de premier niveau. Coupés avant leur toute première instruction (le chunk du combat, `GamepadNavigator`, puis `three-core`, évalué en premier), ils laissent toujours 3,8 à 3,9 Mo par chargement. Ce n'est donc pas une instruction du jeu, mais le simple chargement des ressources.
4. **Sans DevTools.** La boucle est rejouée par la page elle-même, dans un Chromium lancé sans pilote, et la mémoire est lue dans le système. Le tableau suivant montre le processus de rendu (privé) après chaque combat complet (scène, sprites, arène, 8 s à l'écran).

| Sessions DevTools sur la page | Combats 1 → 5 | Ensuite | Par combat, seconde moitié |
| --- | --- | --- | --- |
| Aucune | 94 → 159 Mo | 150 à 162 Mo jusqu'au 10ᵉ | +3,0 Mo |
| Aucune, 14 combats (boucle d'investigation) | 93 → 156 Mo | 149 à 164 Mo jusqu'au 14ᵉ | +0,9 Mo |
| `Network.enable` par défaut | 107 → 247 Mo | 271 Mo au 6ᵉ | +28 Mo |
| `Network.enable` avec tampons nuls | 91 → 157 Mo | 154 Mo au 6ᵉ | plat |

   Une seule session brute qui n'active que `Network` reproduit toute la croissance. La même session avec `maxTotalBufferSize: 0` et `maxResourceBufferSize: 0` donne la courbe du navigateur nu. Avec les vidages memory-infra, qui forcent un GC complet dans tous les processus, la boucle sans DevTools reste même plate dès le premier combat (97 → 108 Mo en douze combats), et la partition `buffer` reste vers 4 Mo.

5. **Les pistes de la tâche.**
   - **L'iframe.** `CombatBridge` en crée une neuve à chaque combat et la retire (`remove()`) sous le rideau de sortie (`closeCombatUnderCurtain`). Ses écouteurs de geste sont retirés (`detachGestures`) et les messages sont filtrés par `event.source`. Le document est bien détruit (étape 1) : la remettre à `about:blank` avant le retrait n'apporterait rien.
   - **Les ressources de chaque combat.** Le runtime libère sa scène sur `pagehide` (`disposeCombatRuntime` : boucle d'image annulée, textures, arène, effets, `renderer.dispose()`). Le reste part avec le document.
   - **Les références qui survivent.** Le `bank.worker` de la musique vit dans la fenêtre du jeu et se termine quand la banque est calculée. L'instantané du tas pris après deux combats ne montre aucun document ni aucune fenêtre détachés tenus par le JS, seulement le document de la page et les enveloppes du monde utilitaire de Playwright.

## La correction

`CURRENT FACT`. Outils seulement :

- `tools/perf/devtoolsNetworkBuffers.mjs` récrit, au chargement de Playwright, ses trois appels `Network.enable` sans paramètre pour leur donner des tampons nuls. Le pilote doit donc importer Playwright après ce crochet. Les événements réseau (octets, statuts, échecs) arrivent toujours ; seul `Network.getResponseBody` perd un contenu que les pilotes ne demandent jamais.
- `tools/perf/measure-performance.mjs` :
  - applique ce crochet et active `Network` avec des tampons nuls sur sa propre session CDP ;
  - note le mode dans le rapport (`devtoolsNetworkBuffers`) et signale une erreur si le crochet ne trouve plus les appels ;
  - garde l'ancienne mesure pour comparaison avec `PERF_DEVTOOLS_NETWORK_BUFFERS=default` ;
  - détaille désormais `partition_alloc/partitions/*` dans les vidages memory-infra.
- `tools/perf/combat-frame-loop.mjs` monte et retire l'iframe du combat sans session DevTools sur la page et lit le processus de rendu dans le système. C'est le seul moyen de mesurer le jeu sans l'effet décrit ici ; il garde les variantes `network-default` et `network-zero` pour refaire la preuve. Chromium sans fenêtre laissait parfois l'URL de départ non chargée : l'outil ouvre donc sa page par la cible navigateur.
- Le test de garde `tools/perf/devtoolsNetworkBuffers.test.ts` fige trois points :
  - la réécriture des appels ;
  - leur présence dans le Playwright installé, pour qu'une mise à jour qui les change échoue au lieu de mesurer DevTools en silence ;
  - l'ordre « crochet, puis import » et les tampons nuls de la session du pilote.

## Avant et après, en jeu

`CURRENT FACT`. Même build, mêmes sauvegardes, même scénario `leak`, vidages memory-infra compris.

| Point de contrôle | Avant | Après, réglages par défaut | Après, `reducedMotion: 'reduce'` émulé |
| --- | --- | --- | --- |
| Carte, avant les combats | 275 Mo | 274 Mo | 272 Mo |
| Après 1 combat | — | 318 Mo | 317 Mo |
| Après 2 combats | 355 Mo | 310 Mo | 297 Mo |
| Après 3 combats | 395 Mo | 298 Mo | 315 Mo |
| Après 4 combats | 433 Mo | 315 Mo | 300 Mo |
| Après 5 combats | 457 Mo | 303 Mo | 315 Mo |
| Après l'alerte mémoire critique | 457 Mo | 303 Mo | 304 Mo |
| **Par combat, après le premier** | **+34 Mo** | **−4 Mo** | **0 Mo** |

- **Partition `buffer`.** Après la correction, elle reste entre 162 et 175 Mo en jeu (les ressources de la fenêtre du jeu elle-même), sans croissance.
- **Cible.** Moins de 5 Mo par combat après les premiers : atteinte.
- **Le reste du parcours.** Zéro erreur dans les trois passages : aucune réponse HTTP 400 ou plus, aucune requête en échec, aucune erreur de console ni de page. Les combats tournent à 57–60 images/s.
- **Le parcours joué.** Les trois passages enchaînent chacun cinq combats par de vrais clics : déploiement automatique, attaques, déplacements, abandon, défaite, reprise de la sauvegarde.

## Vérification

`CURRENT FACT`.

- **Tests.**
  - `npx vitest run tools/perf/devtoolsNetworkBuffers.test.ts` : 3 sur 3.
  - `npm test` : 3 589 réussis, 5 ignorés, 5 échecs. Ce sont les échecs hérités de l'environnement du worktree (`tools/cinematics/` : `minimax_task_checkpoint`, `cin6c_p1_production`, `cin6ea3_pilot_e_regate`, qui demandent `ffprobe` et des médias absents), les mêmes que le 2026-11-15 à l'audit. La suite `node:test` donne 26 sur 26.
- **Le pilote mesure toujours le réseau.** Avec des tampons nuls, le scénario `load` compte encore le titre à 1,43 Mo pour 7 requêtes, comme à l'audit, sans erreur.
- **Contrôles.** `npx tsc --noEmit`, `npm run build`, `npm run contracts:validate` et `git diff --check` passent. La garde des contrats (`git diff --exit-code 133814ba… HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md`) est vide.
- **Serveur.** Le serveur de mesure (`vite preview` sur 5189) a été lancé avec `preview_start` et arrêté à la fin.

## Ce qui n'est pas vérifié

`UNDECIDED`.

- **Navigateur habituel de l'opérateur.** Toutes les mesures passent par le Chromium de Playwright, sans fenêtre, avec le vrai GPU. Ni Edge ni Chrome de l'opérateur n'ont été mesurés. Le mécanisme ne joue que lorsqu'un client DevTools active `Network` ; un joueur sans DevTools ouvert n'est pas concerné.
- **Les cinq premiers combats sans GC forcé.** Sans DevTools et sans GC forcé, le processus de rendu prend environ 60 Mo sur les cinq premiers combats avant de plafonner. Cette mémoire se récupère : avec les GC complets des vidages, la courbe est plate dès le premier combat. Je ne l'ai pas observée sous la pression d'un appareil à peu de mémoire ; cela revient à la passe mobile (MB1).
- **Un document de plus, constant.** En jeu, après le premier combat, la page compte 2 documents et 2 cadres au lieu de 1, et ce chiffre ne bouge plus ensuite. Aucune iframe n'est dans le DOM, et le JS ne tient aucun document détaché (instantané du tas). Je n'ai pas trouvé ce qui le garde ; Playwright, attaché à chaque cadre, en est un suspect. Il ne croît pas et n'est pas la croissance de M1.
- **Variante `Runtime` et `Page` seuls.** Une session qui n'active que ces deux domaines n'a pas donné de mesure (délai dépassé). La preuve tient sans elle : le parcours Playwright, qui active `Runtime`, `Page` et le reste, devient plat dès que `Network` a des tampons nuls.
- **Toute la chronique, le mobile.** Seul le combat des loups est mesuré en jeu, plus le combat autonome de la page du combat en boucle.

## Outils

`CURRENT FACT`. Dans `tools/perf/` :

- `measure-performance.mjs` : le pilote, tampons DevTools nuls par défaut ;
- `devtoolsNetworkBuffers.mjs` : le crochet, avec son test de garde ;
- `combat-frame-loop.mjs` : la boucle sans session DevTools sur la page.

Pour refaire la mesure : `npm run build`, `vite preview` sur 5189, puis, depuis Git Bash avec `MSYS_NO_PATHCONV=1` :

- `PERF_BASE_URL=http://localhost:5189 PERF_SCENARIOS=leak node tools/perf/measure-performance.mjs` ;
- `LOOP_N=8 node tools/perf/combat-frame-loop.mjs`.

Ports pris par la boucle : 5193 (synchro) et 9333 (cible navigateur).

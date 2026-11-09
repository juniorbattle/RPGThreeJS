# Après-démo intégrée à `dev` — relais pour la session locale

Run claude-postdemo-integration-20261109T0323Z (agent claude, session cloud de l’après-démo). Contrats 1.20.0, baseline immuable `6c965169c2dc153cafd5a8609d914cf8de723ff3`. Décisions : [OD-2026-11-07-I](../POST_DEMO_DIRECTION_OPERATOR_DECISION_2026-11-07.md), [OD-2026-11-08-A à D](../OPERATOR_DECISIONS.md), [OD-2026-11-09-A](../POST_DEMO_LOT_4_OPERATOR_DECISION_2026-11-09.md), [OD-2026-11-09-B](../POST_DEMO_LOT_5_OPERATOR_DECISION_2026-11-09.md), [OD-2026-11-09-C](../POST_DEMO_INTEGRATION_OPERATOR_DECISION_2026-11-09.md).

## À faire en premier, sur le poste de l’opérateur

La session cloud n’a pas pu pousser l’étiquette de la démo figée : son proxy GitHub refuse les étiquettes (HTTP 403). L’opérateur a choisi d’intégrer d’abord. Depuis la session locale, après `git fetch origin` :

```bash
git tag -a demo-frozen-2026-11-09 25ccd2f2 -m "Demo frozen before the first post-demo integration into dev (OD-2026-11-08-A, point 6)."
```

```bash
git push origin demo-frozen-2026-11-09
```

`25ccd2f2` est le dernier commit de la démo sur `dev` (« Record 6c965169 as the immutable set 1.20.0 baseline… »). L’intégration est une avance rapide : ce commit reste dans l’historique de `dev`.

## Résultat

- `dev` = `post-demo` : 37 commits après `25ccd2f2`, de l’atelier du Lot 0 à ce relais. Aucune fusion, aucune réécriture ; `main` intact.
- **Canon** : l’Ours (Montagnes de la Résilience, contre le Corbeau), le Dragon (Pics Célestes, contre le Loup), le Scorpion (Déserts Arides, contre le Phénix ; le chef reste « le Grand Inquisiteur », P5), l’acte final (Tournoi des Grands sur un tableau des rencontres, trahison de Maelor, capitale corrompue, brèche en deux phases, soutiens et adversaires des clans) et ses trois fins (Respect, Crainte, Équilibre, avec le choix de la Crainte).
- **Le Lion sur `dev`** suit maintenant l’étalonnage de l’après-démo (OD-2026-11-08-A : montants ×0,3, seuils Cedric 27, Garen 24, témoins 35, Alaric 33 et 42) et enregistre son issue et ses relations à la fin de sa chronique. Aucune réplique, aucun choix, aucune route du Lion n’a changé. La démo figée garde ses valeurs sous l’étiquette.
- **Sauvegardes** : une sauvegarde V6 de la démo se charge et continue ; la progression de campagne, les relations de clan, les issues et la fin sont des faits durables, migrés et testés. Rien de visuel ni de transitoire n’est sauvegardé.

## Où est quoi

| Sujet | Fichiers |
| --- | --- |
| Registre des plateaux | `src/campaign/plateaux/PlateauRegistry.ts` (statuts, budgets, liaisons) |
| Un plateau | `src/campaign/plateaux/<bear|dragon|scorpion|finale>/` : topologie, combats, dialogues, jugement ou Tournoi, présentation provisoire, tests |
| Les fins | `src/campaign/plateaux/finale/finaleEpilogues.ts` |
| Vérité | `src/game/campaignRelations.ts` (relations, issues, R4), `plateauProgression.ts`, `plateauFinale.ts`, `finalAct.ts` (tableau, soutiens, épilogue), `campaignProgress*.ts` (sauvegarde) |
| Réputation | `src/game/lionReputationCalibration.ts`, `reputationBounds.ts` (bornes mesurées depuis le contenu) |
| Cartes des conséquences | `src/campaign/consequences/*.consequences.json`, format `docs/content/consequence-map-format.md`, validateur `src/game/narrativeCoherence.ts` (`npm run narrative:validate`) |
| Combat | `src/combat/legacyCombatRuntime.js` (familles, boss, phases de la brèche, action « Soutien ») |
| QA | `src/qa/plateauDriver.ts` (pilote commun), `campaignEndingsDriver.test.ts`, `postDemoQaSaves.ts` ; laboratoire `/?qa=1` > « QA rencontres » : départs Ours, Dragon, Scorpion, Acte final et « Fin · le Respect / la Crainte / l’Équilibre » ; `/?qa=1&cin6a=golden` montre la commande « Victoire » en combat de campagne |
| Fiches de texte | `npm run narrative:text-sheet -- <bear|dragon|scorpion|finale> <sortie.md>` |
| Rapports | `docs/reports/post-demo-lot-0-…` à `post-demo-lot-5-endings-2026-11-09.md`, puis [le rapport d’intégration](../../reports/post-demo-integration-2026-11-09.md) |

## Images finales (Codex, OD-2026-11-09-C)

Toutes les images de l’après-démo sont provisoires et marquées à l’écran. Chaque image provisoire et l’image finale qu’elle attend sont listées dans le code (`awaitedFinal`) et dans la section 6 de chaque rapport de lot :

- `src/campaign/plateaux/bear/bearPresentation.ts`, `dragon/dragonPresentation.ts`, `scorpion/scorpionPresentation.ts`, `finale/finalePresentation.ts` : atlas, tableaux de scène, personnages, ennemis, refuges, surfaces partagées ;
- `src/campaign/plateaux/postDemoPresentation.ts` et `postDemoRefuges.ts` : marques et refuges communs.

Ce qu’il faut savoir avant de remplacer une image :

- Le marquage vient de `provisionalMark` et `hasProvisionalArt` (`src/game/postDemoContent.ts` : toute scène post-démo est marquée « Image provisoire » aujourd’hui) et de `provisional: true` dans les registres d’atlas et de refuges. Intégrer une image finale demande donc aussi de lever la marque de la surface concernée, et d’ajuster les tests de présentation qui l’attendent.
- Les tableaux vivants post-démo ne jouent que sur un tableau peint approuvé et listé dans une table des moments approuvée. Celle de l’acte final est approuvée (`FINALE_MOMENTS`, statut `approved`, tableaux `provisional`). Celles des trois plateaux restent à proposer après les images.
- Aucune vidéo (OD-2026-10-24-A). Quatre acteurs visibles au plus par tableau.

## Vérifications au moment du relais

- `npx tsc --noEmit` vert ; `npm run build` vert ; `npm run contracts:validate` vert ; porte du verrou documentaire vide.
- `npx vitest run` : 3 155 réussis, 23 ignorés, 10 échecs connus qui échouent aussi sur un `dev` intact dans un clone neuf (spritesheetPng 5 : PNG du megapack non suivis ; cin6ea3_pilot_e_regate 4 et cin4_media 1 : sorties ignorées de `tmp/` et un chemin Windows). Sur le poste de l’opérateur, ces tests peuvent passer.
- `node --test tools/qa/qa-job.test.mjs` : 26 sur 26. `npm run narrative:validate` : cinq cartes valides, aucun écho prévu.

## Limites connues

- Dans le conteneur cloud, le combat de campagne tourne sur un WebGL logiciel trop lent pour être joué à la main. Les combats de l’après-démo n’ont été gagnés que par la logique du pilote ou par la commande de QA. **L’équilibre tactique de toute l’après-démo n’est pas éprouvé** : il attend le test final sur PC.
- Le verrou `.git/codex-autonomy.lock` n’existe que sur le poste de l’opérateur ; la session cloud n’a écrit que sur `post-demo` puis, sur ordre, sur `dev`.

## Suite

1. Pousser l’étiquette de la démo figée (ci-dessus).
2. Codex réalise et intègre les images finales.
3. Finalisation : proposer les tables des moments des trois plateaux, et les tableaux vivants sur les tableaux approuvés.
4. Test final de l’opérateur sur PC, puis corrections.

Scheduler PAUSED. `main` protégé. Aucun contrat modifié après la baseline.

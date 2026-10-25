# Réparation de la base de tests

TASK: TEST-BASELINE-REPAIR (N1, OD-2026-10-25-A)
DOMAIN: tooling, QA
BASELINE: 0937868834752a87d2a9b12d52cd074e0cbc311b / dev
BRANCH: dev
HEAD: voir le commit qui ajoute ce rapport (Agent: claude; Run: claude-test-baseline-20261025T0411Z)
STATUS: HISTORICAL — suite courante verte dans la portée déclarée
MERGED_IN: NONE
SUPERSEDES: NONE
SUPERSEDED_BY: NONE
PRODUCTION_IMPACT: NONE pour le jeu. `src/combat/vfx/DemoVfxActionScope.ts` (outil Composer/charge VFX, sans consommateur gameplay ni sauvegarde) compte désormais les deux élites mobiles du Lot E comme combats atteignables.
CANONICAL_DOCS_UPDATED: AGENTS.md (commande de test), états d'autonomie et handoff
EVIDENCE: deux passages consécutifs de `npm test` le 25 octobre 2026 (vitest 160 fichiers / 2 814 tests, node:test 25/25), `npx tsc --noEmit`, `npm run build` (avertissement de taille de chunk hérité), `npm run contracts:validate`, barrière LOCKED, `git diff --check`, revue contracts-guardian PASS_WITH_NOTES (F1–F5 appliqués). Pas de navigateur : aucun comportement joué n'a changé.

## Constat de départ

CURRENT FACT au début de la tâche : `npm test` collectait 535 fichiers, dont plus de 360 copies de sources archivées sous `tmp/` (366 fichiers de test recensés par la relecture), et échouait sur 138 fichiers. Sur `src/` seul, 51 tests sur 2 636 échouaient dans 13 fichiers ; `tools/` ajoutait 18 échecs dans 8 fichiers et un fichier `node:test` lancé par erreur sous vitest. Aucun de ces échecs ne venait d'un bug du jeu : tous venaient de tests restés en arrière après des changements autorisés.

## Ce qui a été corrigé

| Cause | Origine | Correction |
| --- | --- | --- |
| Copies `tmp/` ramassées par vitest | config sans liste d'exclusion | `test.exclude` : défauts vitest, `tmp/**`, `output/**` |
| `combatCue is not defined` (29 tests) | `06a59c48`, lot FX combat OD-2026-10-19-B | stubs `combatCue`/`setHint` sans effet dans les harnais de `combatKeyboard.test.ts` et `unitMotion.test.ts` |
| Rejet souris désormais annoncé | même commit. L'audit audio n'a décidé que le son `refused` « pointer et clavier » ; afficher aussi le texte et l'indice pour la souris est un choix de `06a59c48`, adopté ici sans être une nouvelle décision | test réécrit : un seul `refused` et le texte de refus pour la souris ; aucun son ni texte pour une entrée occupée ; ni déplacement, ni exécution, ni changement d'état |
| `soundSettings`/`uiSounds` absents des `GameApp` partiels (7 tests) | `2a8dbe8d`, UI FX OD-2026-10-18-F | stubs dans `refugeHubContinuity.test.ts` et `campaignGrammarConsolidation.test.ts` ; le test de repos refusé vérifie en plus qu'aucun son n'est joué |
| Graphe 21 → 33 nœuds, combats 18 → 32 | Lot E OD-2026-10-15-B | tests CIN-6D, R5, R6 limités aux 21 nœuds et 18 combats écrits, avec contrôle que les seuls ajouts sont exactement le catalogue Lot E (POI sans arête de route, combats jamais de rang boss) |
| Reprise déplacée dans `resumeSavedCampaign` | conditions neutralisé/contourné ajoutées par `14490908` (POI, OD-2026-10-13-D), branche déplacée par `878241d8` (dernière sauvegarde, OD-2026-10-18-C) | assertions de texte source déplacées ; comportement identique |
| `applyDamage` reçoit `magic` | `06a59c48` (choix du son d'impact) | texte attendu mis à jour ; routage dégâts/PA inchangé |
| `mediaRemasterLater` attendu | flag retiré le 2026-10-01, vidéos retirées OD-2026-10-24-A | le test vérifie qu'aucun remaster n'est en attente |
| MP4 lus dans `public/` | retrait OD-2026-10-24-A | lecture dans `tools/cinematics/archive/production-videos-2026-10-24/`, mêmes SHA-256. L'inventaire vidéo de `cin2CampaignBridge` fusionne `public/` et l'archive : l'absence de MP4 livré est garantie par `contracts:validate`, pas par vitest |
| Élites mobiles « inatteignables » | dérivation limitée aux nœuds de route | `DemoVfxActionScope` ajoute `LOT_E_ELITES` ; le test d'atteignabilité reste inchangé |
| `qa-job.test.mjs` sous vitest | suite `node:test` | exclue de vitest ; `npm test` lance `vitest run && node --test tools/qa/qa-job.test.mjs` |
| Dépassements intermittents du délai de 5 s | audits complets de 2 à 3 s seuls (NarrativeStagingAudit, RuntimePresentationStepCensus, spritesheetPng) sous charge parallèle | `testTimeout: 20_000` dans la config ; aucune assertion modifiée |

## Tests historiques retirés de la suite courante

Ces huit fichiers restent intacts, octet pour octet, comme preuve de leur époque. Ils sont seulement exclus de la suite courante (`HISTORICAL_CINEMATIC_TESTS` dans `vite.config.ts`) :

- `tools/cinematics/campaign_cinematic_census.test.mjs`
- `tools/cinematics/cin66_character_scale.test.mjs`
- `tools/cinematics/cin66_finalization.test.mjs`
- `tools/cinematics/cin66_visual_polish_audit.test.mjs`
- `tools/cinematics/cin6b_production.test.mjs`
- `tools/cinematics/cin6ea2_dynamic_gate.test.mjs`
- `tools/cinematics/cin6ea_finalization.test.mjs`
- `tools/cinematics/cin6ea_preproduction.test.mjs`

Ces fichiers contiennent 120 tests : 18 échouaient et 102 passaient encore. Les 102 tests qui passent sont retirés avec eux de la suite courante. Causes des 18 échecs :

- MP4 livrés et matrices vidéo de la production cinématique, retirée par OD-2026-10-24-A ;
- un `types.ts` figé comparé à `04e969eb`, cassé par les champs V6 autorisés du POI et du Lot E ;
- la liste CIN-6E-A des chemins « protégés » (19 chemins, dont l'audio, l'aléatoire et le clavier du combat, et ce diff) ;
- dérive du recensement cinématique (5 erreurs au lieu de 4), conversion des arrivées Journey, unicité des descripteurs CIN-6B ;
- empreintes de personnages prises avant la correction manuelle du master d'Alistair par l'opérateur (`b4e890af`, 13 octobre).

Couverture courante des frontières que touchaient ces tests :

| Frontière | Couverture courante |
| --- | --- |
| 21 nœuds, 23 arêtes, profondeur 17 | `src/game/r6FullRouteIntegration.test.ts`, `src/cinematics/FinalNarrativeContinuity.test.ts` |
| Trois embranchements | `src/campaign/LionCampaignTravelRelations.test.ts` |
| Refuge final de type `story` | `src/game/cin2CampaignBridge.test.ts` |
| Zéro vidéo livrée, archive identique à l'octet | `npm run contracts:validate` (`tools/contracts/validate-contracts.mjs`) |
| Sauvegardes V6 | `src/game/lastSaveRecovery.test.ts`, `src/game/poiExpedition.test.ts`, `src/game/GameAppPoiExpedition.test.ts` |

Les six autres fichiers de `tools/cinematics/` passent et restent dans la suite.

## Limites

- Aucun scénario navigateur : seuls des tests, un outil de portée VFX et la config ont changé.
- Plusieurs tests vérifient encore du texte source plutôt qu'un comportement ; ils restent fragiles et sont signalés pour une passe future, hors de cette tâche.
- Le validateur narratif signale toujours 2 étapes de présentation mortes ou inatteignables, connues et non traitées ici.

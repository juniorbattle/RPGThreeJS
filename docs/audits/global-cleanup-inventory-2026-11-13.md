# Inventaire de nettoyage du dépôt RPGThreeJS (2026-11-13)

Statut : **lecture seule, aucune suppression**. Soumis à l’opérateur sur la fiche d’arbitrages du lot présentation (2026-11-13) ; rien n’est supprimé avant ses choix, puis dans des commits dédiés. Demande de l'opérateur (OD-2026-11-13-F, remarque « Nettoyage global ») : d'abord un inventaire classé (A supprimable sans risque, B gardé par une règle, C à trancher), soumis à l'opérateur ; les suppressions viendront ensuite, dans des commits dédiés.

Base inspectée : worktree `.claude/worktrees/nifty-pike-5623dd`, HEAD `b6f285d8` (2026-11-13). Seul changement local préexistant : `.claude/launch.json` modifié (pas par cet inventaire).

## Méthode

- Fichiers suivis : `git ls-files`. **4 371 fichiers, 2 401 Mo** sur disque dans l'arbre de travail.
- Tailles et dates : taille sur disque de chaque fichier suivi (script Node), date du dernier commit par groupe (`git log -1 --format=%cs -- <chemins>`).
- Références : un script Node lit tous les fichiers texte suivis de 30 Mo au plus (ts, js, mjs, json, md, html, css, txt, patch, py…). Pour chaque candidat, il cherche le nom de fichier, puis sa racine sans extension, et ventile les fichiers trouvés : `src` production, `src` tests, `tools`, `public`, `docs`, `docs/reports`. Les dossiers sont vérifiés avec `git grep`. Pour `src`, un graphe d'imports approché (expression régulière sur le nom de module) donne les modules qu'aucun code de production n'importe.
- Chemins construits dynamiquement (`${id}.wav`, scènes post-démo, `FINAL_IMAGES`…) : vérifiés à la main pour chaque dossier concerné. Les images post-démo sont toutes référencées par leur racine depuis `src`.
- Garde LOCKED : `git diff --exit-code 6228a34f… HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md` ne sort rien (code 0).
- **Non vérifié** : aucun test, build ni pilote QA lancé. L'état de marche des pilotes Playwright est jugé sur un échantillon de sélecteurs CSS seulement. Une référence dynamique non repérée reste possible : c'est pourquoi ces cas sont classés C, jamais A. `tools/art/**` (autre session) est seulement listé. Les dossiers locaux ignorés par Git (`tmp/`, `output/`, `tools/qa-shots/`, `art-gen/`, worktrees) ne figurent pas dans cet inventaire.

### Deux faits qui changent l'enjeu

1. **L'historique ne maigrit pas.** Le pack Git pèse **5,99 Gio** (`git count-objects -vH`). OD-2026-11-11-E (point C) impose un nettoyage « sans réécrire l'historique Git ». Supprimer des fichiers allège donc seulement l'arbre de travail, les nouveaux checkouts et le build, jamais `.git`. Les doublons exacts ne coûtent rien à Git (un seul blob) : environ 218 Mo de copies identiques dans l'arbre, surtout dans `tools/cinematics/candidates` (64 blobs, 169 Mo).
2. **`public/` part entier dans `dist/`.** Vite copie `public/` en entier. Environ **90 Mo** que le jeu ne lit jamais sont livrés à chaque build : `combat-stage/poses` 41,8 Mo, images du Combat Stage 19,6 Mo, atlas `poi-v2` 11,8 Mo, sources de cinématiques 7,5 Mo, `validation/ready` 3,7 Mo, archive `legacy-full` 2,2 Mo, `preview-all.wav` 1,9 Mo, Traversal 1,5 Mo, JSON 0,4 Mo. Pour les archives protégées, un déplacement hors de `public/` réglerait cela sans rien supprimer, mais il faut une décision de l'opérateur.

## Vue du dépôt par zone

| Zone | Fichiers | Taille | Remarque |
| --- | ---: | ---: | --- |
| `docs/reports/` | 1 644 | 1 074,6 Mo | 194 rapports `.md`, 50 fichiers isolés, 86 dossiers de preuves (dont 29 Traversal : 631 Mo) |
| `tools/cinematics/` | 803 | 891,0 Mo | candidats 530 Mo, archive 356 Mo, specs et scripts 5 Mo |
| `public/assets/` | 672 | 364,3 Mo | produit, plus les reliquats ci-dessous |
| `docs/` (hors reports) | 424 | 42,5 Mo | art-direction 20 Mo, références Traversal 13 Mo, autonomie 4 Mo |
| `tools/pixel-sprites/` | 118 | 18,8 Mo | sources des poses (OD-2026-11-13-A) |
| `src/` | 554 | 8,1 Mo | code et tests |
| `tools/` (autres) | 105 | 1,6 Mo | pilotes QA et outils |
| racine, `.agents`, `.claude`, `.codex` | 51 | < 0,2 Mo | |

## Synthèse par catégorie

| Catégorie | Groupes | Fichiers | Taille | Ce qu'on y gagne |
| --- | ---: | ---: | ---: | --- |
| **A** supprimable sans risque | 3 | 9 | 0,10 Mo | presque rien : quelques scripts jetables |
| **B** gardé par une règle | 21 | 2 974 | 2 014,2 Mo | rien sans une nouvelle décision de l'opérateur |
| **C** à trancher | 17 | 251 | 113,2 Mo | environ 60 Mo retirés du build si l'opérateur suit les recommandations (C1, C3 à C6), environ 80 Mo en ajoutant C2 |
| Hors inventaire (produit actif) | — | 1 137 | ≈ 273 Mo | code, assets lus, outils utilisés, docs canoniques |

En clair : presque tout le volume (2 Go sur 2,4 Go) est protégé par une règle explicite. Le vrai levier de taille demande une décision de principe de l'opérateur : compacter les preuves (règle d'ingénierie 7) ou lever « aucun effacement des candidats » (OD-2026-10-24-A). Sans réécriture de l'historique, ces décisions n'allègent toujours pas `.git`.

## A. Supprimable sans risque

Critères : aucune référence depuis `src`, les tests ou un outil encore utilisé, aucune ligne rouge, et une cible retirée ou un usage unique. Git garde les fichiers.

| Chemin | Fichiers | Taille | Dernier commit | Références (hors lui-même) | Raison |
| --- | ---: | ---: | --- | --- | --- |
| `tools/vfx/generate-comparison-table.mjs`, `tools/vfx/gif-cadence-forensics.mjs`, `tools/vfx/qa-cadence.mjs`, `tools/vfx/qa-publish-gameplay.mjs`, `tools/vfx/audit_runtime_spritesheets.py`, `tools/vfx/test_audit_runtime_spritesheets.py` | 6 | 0,09 Mo | 2026-08-14 | Aucune dans `src`, les tests, `package.json`, les skills ou les docs canoniques. Seulement citées par des rapports historiques. | Diagnostics ponctuels d'août : cadence des GIF du megapack, preuve de publication du Composer « V2.3.2 », audit des anciennes planches `vfx/runtime` (PNG déjà retirés, seul `manifest.json` reste). Les publications du Composer ne jouent plus en combat (OD-2026-10-29-A). Les deux scripts Python ne tournent pas sur l'hôte (pas de Python). Leurs sorties, déjà dans `docs/reports`, restent. **À garder dans `tools/vfx`** : `generate-cadence-index.mjs` (il régénère `docs/reports/vfx-cadence-index.json`, importé par `src`) et les outils des scripts `vfx:*`. |
| `tools/qa-giga-size.mjs`, `tools/qa-preview-bridge.mjs` | 2 | < 0,01 Mo | 2026-08-13 | Aucune, même dans les rapports | Essais Playwright jetables du Composer VFX (`?vfxlab=1`). Le glob du skill qa-evidence ne les couvre pas. Certains de leurs sélecteurs n'existent plus dans `src` (`.cmp-minimized-dock`, `.cmp-cat-next`). |
| `public/assets/3d/.gitkeep` | 1 | 2 o | 2026-06-21 | Un inventaire historique | Marqueur de dossier vide devenu inutile : `3d/` contient déjà `forest-kit.glb` et `forest-kit/`. |

## B. Gardé par une règle

| Chemin | Fichiers | Taille | Dernier commit | Références | Règle et remarque |
| --- | ---: | ---: | --- | --- | --- |
| B1 `docs/reports/*.md` (racine) | 194 | 2,2 Mo | 2026-11-13 | INDEX, docs, état | `docs/reports/README.md`, règle d'ingénierie 6 : rapports = archives historiques. |
| B2 `docs/reports/*/**` (86 dossiers de preuves, dont `evidence/` suivi et `archive/`) | 1 400 | 1 058,8 Mo | 2026-11-11 | Liens des rapports | Ligne rouge rappelée le 2026-11-13 : « archives de médias et de preuves gardés ». Contrainte POI : préserver les preuves historiques. Règles d'ingénierie 7-8. Détail : Traversal retirée 504 fichiers / 631,4 Mo, combat et VFX 334 / 153,9, dialogue 287 / 66,3, cinématiques et Journey 67 / 68,3, UI et refuge 77 / 62,3, POI 42 / 29,2, autres 89 / 47,4. **Levier** : la règle 7 permet de compacter un dossier (un JSON, 5 à 10 captures, le rapport) seulement après accord explicite, réparation des liens et revue d'unicité. Précédent : PROJECT-CONTINUITY-CLEANUP-1. Doublons internes (7 paires dans `traversal-remaining-legs-audit-1-browser`, 3 PNG identiques `hero60*`) : aucun gain Git. |
| B3 `docs/reports/*.json\|png\|html` (racine) | 50 | 13,6 Mo | 2026-09-27 | 4 JSON **importés par du code de production** | Même règle que B2, plus une dépendance de build : `vfx-cadence-index.json` (VfxComposerPlayback), `vfx-megapack-preview-index.json` (VfxPreviewResolver, `vite.config.ts`), `vfx-megapack-r1-2-4-corrected-inventory.json` (CombatVfxComposerPanel, VfxResourceManager), `vfx-megapack-r2-selected-runtime-assets.json` (CombatVfxLab, VfxResourceManager). Ces 4 fichiers font 2,7 Mo. Les supprimer casse `tsc` et le build. |
| B4 `tools/cinematics/candidates/**` | 581 | 530,3 Mo | 2026-10-24 | Docs d'autonomie et handoffs. Aucune dans `src` ou les tests. | OD-2026-10-24-A : « Aucun effacement des candidats/outils/preuves historiques ». Skill cinematics-journey : candidats = preuves, « never delete them ». **Levier** : seule une nouvelle décision de l'opérateur pourrait lever cette règle. C'est le plus gros poste hors preuves. |
| B5 `tools/cinematics/archive/**` | 36 | 355,7 Mo | 2026-10-24 | Tests courants (CinematicRegistry, NarrativePresentationRuntime, VideoRetirement…) | Ligne rouge AGENTS.md (archives de médias), OD-2026-10-24-A (les huit MP4 archivés à l'identique). |
| B6 `tools/cinematics/specs/**` et scripts de `tools/cinematics/` | 186 | 5,0 Mo | 2026-11-11 | Scripts npm (`cinematics:validate-narrative-staging`, `vite-node.config.ts` pour `narrative:*`), specs lues par 8 tests de `src`, 6 tests encore dans la suite | OD-2026-10-24-A (outils historiques gardés). `vite.config.ts` garde les 8 `HISTORICAL_CINEMATIC_TESTS` exclus de la suite « comme preuve » (OD-2026-10-25-A). Contient aussi les 3 scripts MiniMax (`minimax_h3_generate.mjs` sert à générer des vidéos, ce qui est interdit, mais l'outil reste historique ; `minimax_task_checkpoint.test.mjs` tourne dans la suite). |
| B7 `public/assets/cinematics/**` | 6 | 7,5 Mo | 2026-10-24 | `manifest.json` (vide) lu par CinematicRegistry. Les 3 PNG sources ne sont lus que par `tools/cinematics`. | OD-2026-10-24-A. Remarque : les PNG partent dans `dist/` (déplacement possible, au choix de l'opérateur). |
| B8 `public/assets/generated/lion-phase/traversal/**` | 14 | 1,5 Mo | 2026-10-15 | Liens des rapports Traversal | OD-2026-10-15-A, inventaire `poi-v2-dependency-inventory.json` : HISTORICAL_EVIDENCE, « Keep original path for immutable report links ». Livré dans `dist/`. |
| B9 `public/assets/characters/pixel/archive/**` | 29 | 11,0 Mo | 2026-09-17 | `non-demo/` est **lu par la production** (combatHudPresentation, catalog, assetManifest, legacyCombatRuntime, combatPixelSprites.json). `legacy-full/` : aucune. | Dépendance de production, plus ligne rouge (archives de médias) pour `legacy-full/` (7 fichiers, 2,2 Mo, avec manifeste de retrait et SHA). |
| B10 `legacy-combat.html`, `src/combat/legacyCombat.ts`, `src/combat/legacyCombatRuntime.js`, `legacyCombatRuntime.hotfix.test.ts`, `legacyCombatSkillSpec.test.ts` | 5 | 0,3 Mo | 2026-11-13 | `legacy-combat.html` est une entrée du build Vite. Le runtime est importé par `src` (26 tests). | AGENTS.md : les fichiers `legacy*` peuvent être des propriétaires de production. Inventaire fait : tous sont actifs. |
| B11 `docs/autonomy/**` (décisions, état, 8 patchs d'amendement, 144 handoffs, `archive/`) | 277 | 4,3 Mo | 2026-11-13 | AGENTS.md, skills, tests (`AUTONOMOUS_WORK_STATE.*`, `archive/` lus par `qa-job.test.mjs`) | Autorité de niveau 1 (décisions de l'opérateur et fichiers liés), archives de continuité (OD-2026-10-25-A). Les dossiers cinématiques (CAMP_*, ILLUSTRATED_*, MANUAL_*) sont des directions historiques de l'opérateur. |
| B12 `docs/traversal/**`, `docs/TRAVERSAL_T0_FINAL_CONVERGENCE.md` | 7 | 0,03 Mo | 2026-10-03 | `docs/README.md`, AGENTS.md | AGENTS.md : `docs/traversal/` est historique. Contrainte POI. |
| B13 `docs/project/retired-traversal/**` | 13 | 0,2 Mo | 2026-10-15 | `docs/README.md` | OD-2026-10-15-A : trace des décisions de retrait. |
| B14 `docs/audits/project-continuity-*` | 3 | 0,9 Mo | 2026-09-30 | `docs/README.md` | Inventaire précédent soumis à l'opérateur (règle d'ingénierie 8). |
| B15 `docs/content/drafts/**`, `docs/content/feuille_de_route_narrative_condensee.md.pdf` | 12 | 1,9 Mo | 2026-11-13 | `src/campaign/plateaux/heroMeetings.ts`, `tools/art/*` | Textes approuvés mot à mot par l'opérateur et leur source française (ne jamais inventer de canon). Le PDF est le document source de l'opérateur (OD-2026-11-04-C). |
| B16 `docs/media/**` | 12 | 1,2 Mo | 2026-10-20 | `manifest.json` lu par `tools/demo-continuous-production-qa.mjs` | Jeu de sons UI accepté (OD-2026-10-18 / OD-2026-10-19-B). Les 8 wav sont identiques octet pour octet à `public/assets/audio/ui-fx-v1` (aucun gain Git). Le storyboard de cinématique relève d'OD-2026-10-24-A. |
| B17 `.agents/archive/**` | 4 | < 0,01 Mo | 2026-10-25 | AGENTS.md | « Retired profiles live in `.agents/archive/` » (OD-2026-10-25-A). |
| B18 `src/game/__fixtures__/**` | 3 | 0,06 Mo | 2026-11-08 | Tests de sauvegarde | Compatibilité V6. |
| B19 `docs/contracts/**`, `docs/game/GAME_CONSTITUTION.md` | 11 | 0,2 Mo | 2026-11-13 | — | LOCKED, intouchable. Garde vérifiée : aucun écart avec `6228a34f`. |
| B20 `tools/art/**` | 13 | 0,8 Mo | 2026-11-13 | Tests `tools/art/*.test.ts` | Autre session. Rien d'évidemment temporaire vu en surface (non inspecté en détail). |
| B21 `tools/pixel-sprites/**` | 118 | 18,8 Mo | 2026-11-13 | `src/combat/pixel/PixelSpriteSheets.ts`, `src/ui/opening/openingLayer.ts`, `tools/art` | Pipeline actif des poses des 38 unités (OD-2026-11-13-A). |

## C. À trancher par l'opérateur

| Chemin | Fichiers | Taille | Dernier commit | Références | Enjeu | Recommandation |
| --- | ---: | ---: | --- | --- | --- | --- |
| C1 `public/assets/combat-stage/poses/**` | 100 | 41,8 Mo | 2026-09-05 | Aucune dans `src`. `CombatPoseRegistry.test.ts` vérifie au contraire que le registre ne s'en sert **pas**. `legacy-pose-cleanup-plan.json` les classe HISTORICAL_EVIDENCE. | `docs/combat/COMBAT_HD2D.md` les nomme « Assets devenus inutilisés (UNKNOWN_REVIEW) », retrait soumis à l'accord de l'opérateur (règle 8). Anciennes planches 4×1 du Combat Stage retiré, livrées dans `dist/`. Aucun code à toucher. | **Supprimer** (ou déplacer hors de `public/` si l'opérateur y voit une preuve). C'est le plus gros gain de build. |
| C2 Reste du Combat Stage : `lion-phase/combat-stage/*.webp`, `demo-environment-pack-v1/combat-stage/*.png`, `demo-environment-pack-v1/strategic/*.png`, `src/render/combatBackgrounds.ts`, `src/render/BackgroundLayerSystem.ts` | 11 | 19,6 Mo | 2026-11-13 | `combatBackgrounds.ts` n'a aucun importeur, et c'est le seul importeur de `BackgroundLayerSystem.ts`. `assets.combatStageScenes` n'est lu par personne. `assets.combatScenes` (les PNG `strategic`) n'est lu que par `combatBackgrounds.ts` et par `content.test.ts`, qui s'en sert comme registre des scènes valides. Les `.webp` ne sont cités que par des specs cinématiques. Le registre `demo-environment-pack-v1.production.json` déclare ces plaques sous les rôles `STRATEGIC_COMBAT` et `COMBAT_STAGE`, qu'aucun appel de production ne demande (seul `demoEnvironmentPack.test.ts` les cite). | Même note de COMBAT_HD2D.md. Le retrait demande de modifier `assetManifest.ts`, `demo-environment-pack-v1.production.json` et un test : c'est un chantier de code. | Traiter à l'étape « dette technique », en un seul commit avec `npm test` et build. En attendant, garder. |
| C3 `public/assets/generated/lion-phase/poi-v2/**` | 5 | 11,8 Mo | 2026-10-15 | Aucune dans `src` ou `tools`. Provenance citée par `docs/project/LOT_E_ATLAS_PROVENANCE_2026-10-15.json` et 1 rapport. | Atlas « INTEGRATED_CANDIDATE » remplacés par `poi-lot-e` (le seul lu par `LionPoiMap.ts`). Livrés dans `dist/`. | **Supprimer** de `public/` (Git garde l'historique). |
| C4 JSON de génération ou de migration dans `public/` : `characters/pixel/{character-alias-map,full-cleanup-report,legacy-pose-cleanup-plan,master-promotion-report,non-combat-master-census}.json`, `demo-environment-pack-v1/{approved-source-manifest,beat-background-map,demo-environment-census,promotion-manifest}.json` | 9 | 0,4 Mo | 2026-09-18 | Aucune dans le code ou les tests. 0 à 2 citations dans des docs ou rapports. | Comptes rendus de migrations de septembre (Character System V2, pack d'environnement), livrés au joueur. On peut y voir des « preuves », d'où C. Le registre de production est `src/render/data/demo-environment-pack-v1.production.json`. | Supprimer, ou les déplacer vers `docs/` si l'opérateur les tient pour des preuves. |
| C5 `public/assets/audio/combat-fx-v1/preview-all.wav` | 1 | 1,9 Mo | 2026-10-19 | `UiSoundPlayer` charge `${id}.wav` et ne le lit jamais. `tools/audio/analyze.mjs` l'exclut. Le générateur l'écrit avec `flag: 'wx'`. | Fichier d'écoute des candidats acceptés, livré dans `dist/`. Son équivalent UI est rangé dans `docs/media`. | Le déplacer vers `docs/media/audio/` (ou le supprimer). |
| C6 `public/assets/characters/pixel/validation/ready/**` | 4 | 3,7 Mo | 2026-09-13 | Ni le jeu ni la QA (son README le dit) | Trois références historiques Option C (Alistair, Elara, Seraphine), livrées dans `dist/`. | Garder comme références, mais hors de `public/` (sinon les supprimer). |
| C7 Pilotes QA de l'époque UI-SYSTEM-1 : `tools/combat-shell-ui-kit-qa.mjs`, `combat-ui-master-visual-qa.mjs`, `combat-ui-polish-visual-qa.mjs`, `combat-ui-system-1-qa.mjs` | 4 | 0,06 Mo | 2026-09-26 | Seulement le glob générique `tools/combat-*-qa.mjs` du skill qa-evidence (ligne 33) et des rapports | QA visuelle de tâches de septembre, remplacée par `demo-continuous-production-qa.mjs`. Échantillon de sélecteurs encore présents ; fonctionnement non vérifié. | Supprimer, puis ajuster la ligne 33 du skill. |
| C8 Pilotes QA de production combat et galerie UI : `tools/combat-{battlefield-keyboard,card-scroll,grid-hit,keyboard,salvation}-production-qa.mjs`, `tools/ui-kit-system-1-{gallery.html,gallery.ts,qa.mjs}` | 8 | 0,07 Mo | 2026-10-15 | `BATTLEFIELD_KEYBOARD.md`, décision Réglages du 2026-11-05, skill (glob). Galerie classée REHOME_SHARED par l'inventaire du retrait. | Pilotes de régression clavier et combat encore valables d'après l'échantillon de sélecteurs. | Garder. |
| C9 Scripts de revue de `tools/dialogue/` (`analyze-static-tableau-v2-review`, `check-static-tableau-{gallery,geometry}`, `create-*-contact-sheets.py`, `run-{journey-scene,static-tableau-v2}-review`, `gallery-navigation`) et pages de preuve (`static-tableau-v2-proof.*`, `journey-scene-proof.*`) | 12 | 0,06 Mo | 2026-09-24 | Références internes au groupe seulement. `static-tableau-v2-proof.html` a servi le 2026-11-04 (passe narrative). | Scripts de revue ponctuels de septembre ; leurs preuves restent dans `docs/reports`. | Garder les 4 fichiers des pages de preuve. Supprimer les 8 scripts de revue. |
| C10 `tools/combat-arena/{page-shot,soak,trace-ai}.mjs`, `decor-gallery.html` | 4 | 0,01 Mo | 2026-10-28 | Aucune | Outils de débogage de l'arène actuelle (test d'endurance, trace de l'IA). | Garder. |
| C11 `tools/openai-art/**` | 7 | 0,1 Mo | 2026-10-28 | `docs/combat/LOCAL_ART_MISSION.md`, `.gitignore` (`art-gen/`), commentaire de `CombatArena.ts`, brouillon COMBAT_POSES_SCOPE du 2026-11-13 (voie B) | La mission d'art locale n'a plus de lot (OD-2026-11-01-C), mais la voie est encore évoquée pour les poses. | Garder (à revoir avec la session `tools/art`). |
| C12 `tools/traversal/{t1,t3}-production/*.txt` | 6 | 0,01 Mo | 2026-10-01 | `asset-manifest.json` T1 et T3 (HISTORICAL_EVIDENCE) | Prompts des PNG de checkpoints T1 et T3, supprimés lors du retrait. Aucune décision de retrait ne les couvre. | Garder (provenance, poids négligeable). |
| C13 Code apparemment mort : `src/ui/TravelView.ts`, `src/cinematics/CinematicDialogueSession.ts`, `src/combat/vfx/vfxRuntimeRegistry.ts` | 3 | 0,04 Mo | 2026-10-18 | Importés seulement par leurs tests (et par des outils cinématiques historiques pour TravelView). `cin2CampaignBridge.test.ts` vérifie que GameApp ne crée plus de TravelView. | Retrait = suppression de code et de tests (TravelView en a 3). | Reporter à l'étape « dette technique ». |
| C14 Outillage du lab VFX Composer et megapack (DEV) : `tools/vfx/{sync-runtime-vfx,sync-candidate,sync-candidate-lib,validate-published-registry,build-preview-index,generate-cadence-index}.mjs` | 6 | 0,03 Mo | 2026-08-16 | Scripts `vfx:*` de `package.json`, plugin `vite.config.ts` (`sync-candidate-lib`) | Depuis OD-2026-10-29-A, le combat ne joue plus les publications du Composer, mais le lab DEV reste branché. Retirer le lab toucherait `src/combat/vfx` (Composer, Lab), le plugin Vite et les 4 JSON de B3. | Garder. À l'étape dette technique, décider si le lab est retiré ; sinon, déplacer les 4 JSON importés hors de `docs/reports`. |
| C15 `src/combat/vfx/spritesheetPng.test.ts` (bloc megapack) | 1 | 0,01 Mo | 2026-08-11 | Dans la suite | 4 cas lisent `public/assets/vfx/megapack-runtime/` (ignoré par Git, licence locale) : absent de ce worktree. **Vérifié le 2026-11-13** par `npm test` dans ce worktree : les 4 cas échouent sur un clone propre. | Ne pas supprimer : ajouter une garde `skipIf(!existsSync)` (ou retirer les 4 cas). |
| C16 Petits docs isolés : `docs/narrative/judgement-and-accusation-doctrine-draft.md`, `docs/cinematics/storylight-narrative-reference.md`, `docs/audits/asset-bible-sprites.md`, `docs/audits/combat-action-presentation-v2-audit.md` | 4 | 0,04 Mo | 2026-09-18 | Seulement l'inventaire `project-continuity-audit-1.json` et 1 rapport | Notes de doctrine et audits de juillet à septembre. Le brouillon de doctrine du jugement peut servir la passe narrative. | Garder (gain négligeable). |
| C17 `docs/art-direction/option-c/**` et `docs/references/traversal/t0/**` | 66 | 33,5 Mo | 2026-10-01 | 9 docs et 1 outil pour Option C. `docs/traversal` (historique) pour les références T0. Aucune dans `src`. | Direction artistique Option C (6 planches de référence, 17,8 Mo) et références approuvées de la route T0 retirée (13,2 Mo). Les remasters restent gelés. | Garder : références artistiques, hors build. |

## Observations sans suppression

- `docs/README.md` annonçait encore « Current set **1.4.0** » : corrigé en 1.23.0 dans la passe Q2 du même jour.
- `docs/audits/project-continuity-audit-1.md` (et non `docs/README.md`) renvoie vers `tools/project-continuity-audit-1.mjs`, qui n'existe plus à cet endroit (copie texte dans `docs/project/retired-traversal/qa/`).
- Les inventaires T1 et T3 classent `asset-manifest.json` avec la mention « Preserve provenance under docs/project/retired-traversal/ », alors que les fichiers sont restés dans `public/`. Écart sans conséquence.
- Le pack d'environnement de production contient 11 PNG en double exact (tableau, voyage et source de cinématique sous des noms différents), soit environ 31 Mo dans `dist/`. Aucun gain Git ; dédoublonner demande de modifier les registres.

## Commandes utilisées (toutes en lecture)

```sh
git rev-parse --abbrev-ref HEAD; git log -1 --format='%H %cs'; git status --short
git ls-files | awk -F/ '{print $1}' | sort | uniq -c
node sizes.mjs <profondeur> [préfixe]        # git ls-files -z + stat : fichiers et Mo par dossier
node refs.mjs <préfixe> basename|stem <sortie.tsv>   # références par nom ou racine, ventilées src/tools/public/docs/reports
node orphans.mjs                             # modules src sans importeur de production
node group.mjs "<libellé>::<pathspecs>"      # fichiers, Mo, dernier commit d'un groupe
node reports.mjs list                        # docs/reports par type et par famille
git grep -l -F "<chemin ou nom>" -- <zones>  # vérification des références de dossiers
git log -1 --format=%cs -- <chemins>
git ls-files -s | awk ...                    # blobs identiques (doublons)
git diff --exit-code --stat 6228a34fd69a01406ecf0fb7168a53f92a267d7b HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md
git count-objects -vH
```

Les scripts Node sont restés dans le scratchpad de la session (hors dépôt). Aucun fichier du dépôt n'a été modifié.

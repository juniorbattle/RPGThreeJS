# Lot 0 VFX et lab prêt — OD-2026-10-25-B

Run claude-vfx-lot0-20261025T0845Z (agent claude, session interactive). L'opérateur compose les effets dans le lab ; Claude livre le filet de sécurité et prépare le lab. Aucun média, contrat, vérité de combat ni registre publié modifié.

## Résultat

- **Substitut procédural** — `src/combat/vfx/VfxMissingSheetStandIn.ts`, appelé par `VfxSystem.scheduleStep`.
  - Une étape dont la planche n'est plus enregistrée est dessinée par les textures du moteur, à la même ancre et au même moment, en vue tactique comme dans le Combat Stage.
  - Le type se lit sur les mots du nom de la planche : arc, étoile d'impact, étincelles (vert réservé aux soins, or pour le sacré), fumée, particules, anneau au sol.
  - Chaque type a ses propres réglages : nombre, dispersion, taille de particule, rayon. La taille d'un arc ou d'une étoile vient de l'échelle de la planche.
  - L'opacité cinématique est conservée.
  - Avertissement de développement une fois par planche.
- **Repli rétabli** — `actionHasSpritesheetVfx` (`legacyCombatRuntime.js`) ne compte que les planches enregistrées, donc `castTelegraph` revient. Les 3 actions qui marchaient et le chemin des presets publiés ne changent pas.
- **Lab** — `DemoVfxWorkload.ts`, `CombatVfxComposerPanel.ts` :
  - marques ✓ ● ◐ ○ dans la liste ;
  - boutons « ◀ PREV TO COMPOSE » et « NEXT TO COMPOSE ▶ », qui sautent les actions publiées et se désactivent quand tout le reste est publié ;
  - un brouillon pré-rempli d'art retiré reste REMAINING ; mouvement, beats explicites et polish comptent comme travail ;
  - avertissement des emplacements morts mis à jour.
- **Guide** : [docs/project/VFX_COMPOSER_WORKFLOW.md](../../project/VFX_COMPOSER_WORKFLOW.md), lié depuis `docs/README.md`.
- **Décision et rapport** : la décision OD-2026-10-25-B et l'addendum du rapport de couverture sont complétés. Le mode d'auteur et la lecture du contrat (placeholder, pas de couverture) sont à porter sur la prochaine fiche d'arbitrages.

## Vérification

- `VfxMissingSheetStandIn.test.ts` :
  - planches résolues ou retirées ;
  - étapes intactes ;
  - les 39 planches retirées prennent un type procédural ;
  - familles et tailles, vert de soin à part, avertissement unique ;
  - chacune des 34 actions de démo dessine quelque chose et 31 lacunes restent comptées ;
  - intégration `VfxSystem`. Une mutation (substitution retirée) fait échouer le test d'intégration.
- `DemoVfxWorkload.test.ts` : graine retirée, travail non visuel, navigation dans les deux sens avec bouclage.
- `CombatVfxComposerPanel.test.ts` : marques, clics PREV/NEXT, action publiée sautée, boutons désactivés, portée UPCOMING.
- Suites ciblées : `src/combat/stage`, `src/combat/vfx`, `unitMotion`, `combatKeyboard`, `hotfix`, `CombatAudio`.
- Puis `npm test`, `tsc`, `npm run build`, `vfx:validate-published`, `contracts:validate`, gate LOCKED et `git diff --check`, tous verts : 162 fichiers, 2 849 tests, puis node:test 26/26.
- **Chromium** (serveur de dev par `preview_start`, arrêté ensuite) :
  - le lab charge avec 34 actions marquées ○ et 0 en cours ;
  - un clic réel sur NEXT passe à `w_break_guard` ;
  - le service d'aperçu du pack répond `configured: true` (1 974 aperçus) ;
  - dans une scène réelle, les presets `basic_greatsword_hit`, `skill_poison_maw` et `skill_boss_guard` créent leur substitut, et `pilot_w_salvation` garde son sprite.
- Non vérifié : l'aspect à l'écran des substituts, car le panneau ne peignait pas pendant l'essai.

## Revue

`combat-vfx-sprites` : OK avec conditions, rien de bloquant.

Corrigé :
- taille et nombre des substituts ;
- test et commentaire qui en disaient trop ;
- comptage du travail non visuel ;
- vert de soin sur des coups sacrés ;
- opacité cinématique ;
- correspondance sur les mots entiers du nom ;
- libellé PREV ;
- trous de tests.

Laissé en note :
- `isStrictSpritesheetCompliant`, en audit seulement ;
- branche projectile du substitut, inutilisée aujourd'hui ;
- densité des substituts de K.O. et de critique dans un combat à 4 acteurs, à juger par l'opérateur.

## Prochaine action

L'opérateur compose par famille selon le guide. Après chaque série publiée, Claude vérifie : `npm run vfx:validate-published`, tests VFX et stage, un combat de contrôle en mouvement normal et réduit, puis commit sur `dev` du registre publié.

Compteurs : {"runtimeSourceFilesModified":5,"runtimeSourceFilesAdded":1,"gameplayFilesModified":0,"testFilesModified":4,"testFilesAdded":1,"newMedia":0,"imagegenCalls":0,"qaScenarios":1,"newQaJobs":0,"inheritedQaJobs":365,"liveQaJobsAfter":3,"inheritedWipPaths":0,"workflowFiles":5,"productDocumentationFiles":2,"productProgress":1}. Publication normale sur origin autorisée par OD-2026-10-12-A.

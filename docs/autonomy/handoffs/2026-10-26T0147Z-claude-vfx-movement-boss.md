# Lots 4 et 5 VFX publiés — les 34 actions de démo ont un effet — OD-2026-10-25-B

Run claude-vfx-movement-boss-20261026T0147Z (agent claude, session interactive).

## Résultat

- **Les 34 actions de démo ont un effet composé** : 31 publications (lots 1 à 5) et 3 pilotes (`w_charge`, `w_salvation`, `ni_shadow_step`).
- **Lot 4, déplacements** :
  - `a_hawk_leap` : onde au sol + aura positive à l'atterrissage ;
  - `w_charge` et `ni_shadow_step` gardent leurs presets pilotes.
- **Lot 5, signatures de boss**, toutes dans le Stage :

| Signature | Composition | Pose |
| --- | --- | --- |
| boss_slam | Impact Punch (fort) + nuage de poussière épais + onde au sol | fente `attack` |
| boss_quake | onde au sol géante + explosion de fumée + Hit Lv3 (fort) | `attack` tenue |
| boss_flurry | rafale bleue + rafale d'éclairs, puis Hit Lv3 | fente `attack` |
| boss_titan_slam | Impact Punch (fort) + explosion de bombe géante + onde géante | fente `attack` |
| boss_inferno | pilier de feu + gerbe de feu géante (fort), puis feu au sol | `cast` tenue |
| boss_apocalypse | Power Burst géant (fort) + explosion d'éclairs, puis ténèbres géantes | `cast` tenue |

- **Candidats acquis depuis le pack** de l'opérateur par `/dev/vfx-acquire` : `Smoke_Cloud_Burst_Thick`, `Ground_Fire`, `Power_Burst`, `Explosion_Smoke` et `Tornado_Lightning` (ce dernier non utilisé). Ils restent locaux et ne sont pas commités.

## Corrections du runtime

Elles touchent la présentation seulement, dans `legacyCombatRuntime.js`.

- **Publications ignorées aux déplacements.** `playActionVfxAt` (atterrissages, téléportations, arrivée du dash) appelait `combatVfxSystem.play` directement. Il passe désormais par `playPublishedActionVfx` quand l'action est publiée. Sans cela, une composition publiée pour Bond du Faucon ne se serait jamais affichée.
- **Charge sans effet.** La branche dash de `doMove` ne jouait aucun preset, et le repli procédural était coupé dès que le preset pilote se résolvait : la Charge n'affichait qu'une secousse d'écran. Elle joue maintenant l'effet de l'action à l'arrivée.
- `legacyCombatRuntime.hotfix.test.ts` garde ces deux points. Dégâts, PA, statuts, RNG et issue sont inchangés.

## Vérification

- `npm run vfx:validate-published` : PASS (31 actions).
- Tests du runtime (hotfix, `unitMotion`, `combatKeyboard`) : 122/122.
- `npm test` : 162 fichiers, 2 851 tests, puis node:test 26/26.
- tsc, build, contrats, gate LOCKED, `git diff --check` : verts.
- Chromium, dans une scène réelle : les 7 nouvelles actions jouent avec leurs textures, sans erreur, en graphismes normaux et réduits, y compris l'atterrissage sans unité cible.
- Non vérifié en combat réel : la Charge corrigée et le rendu final des signatures.

## Incident de session

Un serveur de dev a été lancé par erreur hors de `preview_start`, sur le port 5174 (PID 28612). Il a seulement servi à acquérir des candidats. Il a été signalé à l'opérateur, puis arrêté à sa demande, après vérification que le PID possédait toujours ce port.

## Prochaine action

Revue opérateur des 31 publications en jeu, en commençant par la Charge et les signatures de boss.

Ensuite, au choix de l'opérateur :
- les attaques de base ennemies et les objets de boutique (clés génériques `attack` et `item`) ;
- la reprise du pilote narratif ;
- Bois-Clair.

Compteurs : {"runtimeSourceFilesModified":1,"gameplayFilesModified":0,"testFilesModified":1,"publishedVfxActions":7,"newMedia":0,"imagegenCalls":0,"qaScenarios":1,"newQaJobs":0,"inheritedQaJobs":365,"liveQaJobsAfter":3,"inheritedWipPaths":0,"workflowFiles":5,"productProgress":1}. Publication normale sur origin autorisée par OD-2026-10-12-A.

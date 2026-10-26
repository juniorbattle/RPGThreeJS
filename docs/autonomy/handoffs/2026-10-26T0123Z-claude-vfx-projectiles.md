# Lot 2 VFX projectiles publié — OD-2026-10-25-B

Run claude-vfx-projectiles-20261026T0123Z (agent claude, session interactive). L'opérateur revoit le lot contact en parallèle ; Claude enchaîne sur les projectiles.

## Résultat

8 actions publiées dans `src/combat/vfx/generated/published-vfx-presets.json`, avec les fonctions du Composer et `handlePublishRequest`. Le constructeur est partagé dans `tmp/claude-probe/compose-lib.ts`, non commité.

| Action | Route | Composition (en séquence) | Pose |
| --- | --- | --- | --- |
| basic_longbow_hit | tactique | Stab V2 en arc bas → Impact Cut V5 | — |
| basic_grimoire_hit | tactique | Darkness Ball Lv1 → Darkness Lv2 | — |
| a_precise_shot | Stage | Charge Energy (visée) → Stab V8 → Shine V2 (éclat aveuglant, flash) | `attack` tenue |
| ar_calibrated_shot | Stage | ChargeUp Energy (visée) → Stab V1 → Hit Lv2 | `attack` tenue |
| n_dark_bolt | Stage | Lightning Ball Lv3 violette → Lightning Lv3 (fort) | `cast` tenue |
| enemy_dark_bolt | Stage | Darkness Ball Lv2 → Darkness Lv2 | `cast` tenue |
| enemy_binding_shot | Stage | Stab V2 → Shockwave v1 au sol (entrave) | `attack` tenue |
| boss_pin | Stage | Stab V8 → Hit Lv3 (fort) → Shockwave v2 au sol | `attack` tenue |

- Le pack n'a pas de flèche : les estocs en déplacement les remplacent, comme dans les choix de l'opérateur en septembre.
- Le projectile porte le retour d'impact (flash, secousse, arrêt). Les dégâts tombent donc à son arrivée : 0,3 s pour une flèche, 0,45 s pour une orbe, 0,6 s avec la visée. Le sprite d'impact démarre au même moment.
- Les durées de trajet sont fixées par `advanced.duration`. Sans cela, l'animation native des orbes repoussait l'impact à 1,8 s.

## Vérification

- `npm run vfx:validate-published` : PASS (17 actions).
- `npm test` : 162 fichiers, 2 850 tests, puis node:test 26/26.
- Build, contrats, gate LOCKED, `git diff --check` : verts.
- Chromium, dans une scène réelle : les 8 actions jouent avec leurs textures, sans erreur, en graphismes normaux et réduits. Les sprites vont bien du devant du lanceur (x 0,3) à la cible (x 4).
- Non jugé : le rendu final en combat.
- Avant publication, le registre a été contrôlé : aucune retouche de l'opérateur n'était en cours.

## Prochaine action

L'opérateur revoit les lots contact et projectiles. Ensuite, Claude compose le lot 3 (soins, bénédictions et altérations) : `basic_crosier_hit`, `e_vigor_rune`, `w_salvation` en finition, `enemy_hex`, `boss_guard`, `boss_regen`, `boss_fortify`, `boss_freeze`.

Compteurs : {"runtimeSourceFilesModified":0,"gameplayFilesModified":0,"testFilesModified":0,"publishedVfxActions":8,"newMedia":0,"imagegenCalls":0,"qaScenarios":1,"newQaJobs":0,"inheritedQaJobs":365,"liveQaJobsAfter":3,"inheritedWipPaths":0,"workflowFiles":5,"productProgress":1}. Publication normale sur origin autorisée par OD-2026-10-12-A.

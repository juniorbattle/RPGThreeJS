# Couverture VFX des actions de combat de la démo

| Champ | Valeur |
| --- | --- |
| `TASK` | combat-vfx-coverage-2026-10-25 |
| `DOMAIN` | combat, VFX |
| `BASELINE` | `dev@3e036189a29efb371a3282f7e39240c55447dafc` |
| `BRANCH` | `dev` |
| `HEAD` | commit de clôture du run `claude-vfx-priority-20261025T0814Z` |
| `STATUS` | review |
| `MERGED_IN` | NONE (travail sur `dev`) |
| `SUPERSEDES` | les chiffres de progression publiée de `r2c-vfx-composer-v2-6-3-demo-scope-workload.md` (13/34, antérieurs à la remise à zéro du registre) |
| `SUPERSEDED_BY` | NONE |
| `PRODUCTION_IMPACT` | NONE (inventaire en lecture seule) |
| `CANONICAL_DOCS_UPDATED` | `docs/autonomy/COMBAT_VFX_PRIORITY_OPERATOR_DECISION_2026-10-25.md` |
| `EVIDENCE` | une sonde `vite-node` non commitée sous `tmp/claude-probe/` lit `getGroupedActionsInScope('DEMO')`, `getVfxPreset` et `VFX_SPRITE_SHEETS` ; lecture du code pour les causes. Aucun navigateur. |

## CURRENT FACT — causes

- `VfxPresets.ts` référence 53 planches distinctes (99 références) ; 14 seulement existent dans `VFX_SPRITE_SHEETS`, toutes natives (`megapack_*`). Les autres sont les planches `basic_*` et `skill_*` retirées par R2C-C-1.
- `VfxSystem.ts:1139-1143` saute une planche introuvable, avec un simple avertissement en développement.
- `actionHasSpritesheetVfx` (`legacyCombatRuntime.js:1589-1597`) répond vrai dès qu'une étape est de type `spriteSheet`, même introuvable. `attackAnim` (`:1692-1696`) n'appelle alors pas `castTelegraph` : le repli procédural disparaît aussi.
- `src/combat/vfx/generated/published-vfx-presets.json` est vide (`{"actions":{}}`) depuis `6c86c96e` (7 septembre).
- Le Combat Stage n'applique que la pose `prepare` (`CombatStage.ts:390`). `dash`, `attack` et `cast` passent par des étapes de mouvement publiées (`CombatStage.ts:653-662`), et il n'en existe aucune.
- Les 171 PNG CartoonCoffee de `public/assets/vfx/megapack-runtime/` sont locaux et ignorés par Git (pack commercial). Un clone propre n'affiche même pas les 3 effets qui fonctionnent.
- Aucun test ne vérifie qu'une action de démo affiche une planche résolue. `isStrictSpritesheetCompliant` (`VfxActionRegistry.ts:159-163`) ne regarde que le type d'étape.

## CURRENT FACT — les 34 actions de démo du lab

Verdict :
- `SPRITE` : la planche se résout et l'effet s'affiche.
- `SKIPPED` : la planche est introuvable et sautée.

La colonne « Autres étapes » donne ce qui reste visible après le saut. Quand elle est vide, le preset ne produit plus rien de visible.

| Groupe | Action | Porteur | Route | Preset | Verdict | Autres étapes |
| --- | --- | --- | --- | --- | --- | --- |
| Héros | basic_greatsword_hit | warrior | TACTICAL | basic_greatsword_hit | SKIPPED | — |
| Héros | w_break_guard | warrior | STAGE | sword_slash | SKIPPED | secousse, arrêt |
| Héros | w_charge | warrior | TACTICAL | pilot_w_charge | SPRITE | secousse, arrêt |
| Héros | basic_crosier_hit | white_mage | TACTICAL | basic_crosier_hit | SKIPPED | — |
| Héros | w_salvation | white_mage | TACTICAL | pilot_w_salvation | SPRITE | — |
| Héros | basic_grimoire_hit | dark_mage | TACTICAL | basic_grimoire_hit | SKIPPED | — |
| Héros | n_dark_bolt | dark_mage | STAGE | shadow_lightning_bolt | SKIPPED | flash, secousse, arrêt |
| Héros | basic_longbow_hit | archer | TACTICAL | basic_longbow_hit | SKIPPED | — |
| Héros | a_precise_shot | archer | STAGE | arrow_shot | SKIPPED | secousse, arrêt |
| Héros | a_hawk_leap | archer | TACTICAL | leap_impact | SKIPPED | secousse |
| Héros (équipement) | d_cursed_blade | dark_knight | STAGE | sword_slash | SKIPPED | secousse, arrêt |
| Héros (équipement) | e_vigor_rune | enchanter | TACTICAL | skill_arcane_orbit | SKIPPED | — |
| Héros (équipement) | ni_shadow_step | ninja | STAGE | pilot_ni_shadow_step | SPRITE | secousse, arrêt |
| Héros (équipement) | ar_calibrated_shot | artillerist | STAGE | arrow_shot | SKIPPED | secousse, arrêt |
| Recrues | basic_dagger_hit | rogue | TACTICAL | basic_dagger_hit | SKIPPED | — |
| Recrues | ro_sneak_attack | rogue | STAGE | sword_slash | SKIPPED | secousse, arrêt |
| Recrues | basic_long_spear_hit | lancer | TACTICAL | basic_long_spear_hit | SKIPPED | — |
| Recrues | l_long_thrust | lancer | STAGE | thrust_line | SKIPPED | secousse |
| Créatures | enemy_venom_strike | — | STAGE | skill_poison_maw | SKIPPED | — |
| Serpents | enemy_heavy_strike | — | STAGE | blunt_impact | SKIPPED | secousse, arrêt |
| Serpents | enemy_dark_bolt | — | STAGE | shadow_lightning_bolt | SKIPPED | flash, secousse, arrêt |
| Serpents | enemy_hex | — | STAGE | status_curse_mark | SKIPPED | — |
| Serpents | enemy_binding_shot | — | STAGE | root_vines | SKIPPED | — |
| Élites, boss | boss_slam | — | STAGE | boss_slam | SKIPPED | flash, secousse, arrêt |
| Élites, boss | boss_quake | — | STAGE | boss_quake | SKIPPED | flash, secousse, arrêt |
| Élites, boss | boss_guard | — | TACTICAL | skill_boss_guard | SKIPPED | — |
| Élites, boss | boss_apocalypse | — | STAGE | boss_apocalypse_v2 | SKIPPED | secousse, arrêt |
| Élites, boss | boss_regen | — | TACTICAL | support_regen_aura | SKIPPED | — |
| Élites, boss | boss_fortify | — | TACTICAL | bless_aura | SKIPPED | — |
| Élites, boss | boss_freeze | — | STAGE | skill_ice_pillar | SKIPPED | — |
| Élites, boss | boss_pin | — | STAGE | arrow_shot | SKIPPED | secousse, arrêt |
| Élites, boss | boss_flurry | — | STAGE | boss_flurry | SKIPPED (0/3) | flash, secousse, arrêt |
| Élites, boss | boss_inferno | — | STAGE | skill_boss_inferno | SKIPPED | — |
| Élites, boss | boss_titan_slam | — | STAGE | boss_titan_slam | SKIPPED | flash, secousse, arrêt |

Total : 34 actions ; 3 `SPRITE`, 31 `SKIPPED`, dont 13 sans aucune autre étape.

Hors lab, mais atteignables en démo :
- les attaques de base ennemies, dont l'effet vient d'une heuristique textuelle (`legacyCombatRuntime.js:1557-1588`), sous la clé publiée générique `attack` ;
- les 8 objets de la boutique, sous la clé unique `item`.

## CURRENT FACT — le lab

Accès : `?vfxlab=1` en développement, avec `devQa` (`CombatBridge.ts:61,67`).
- 83 actions (12 attaques de base, 48 compétences de héros, 23 compétences ennemies ou de boss), avec un filtre DÉMO / À VENIR et un tableau de charge.
- Pour chaque emplacement visuel : candidat, taille, timing, placement, trajectoire, visée, rotation, miroir, pivot, phase, effet d'impact. Pour chaque brouillon : chorégraphie, mouvement du lanceur et de la cible avec pose, beats.
- Lecture, sauvegarde, publication (`src/dev/vfxPublishDevServer.ts`, écriture atomique du JSON), dépublication, publication groupée, export.
- 2 769 candidats au catalogue, 171 synchronisés en local. L'acquisition de nouveaux candidats passe par le serveur de dev (`/dev/vfx-acquire`), qui lit `MEGA_PACK_ROOT` lui-même ; les agents ne lisent jamais `.env*`.
- Reste ouvert dans les rapports : l'interface de chorégraphie par beats (`r2c-vfx-composer-v2-7-caster-motion-choreography.md:100-102`) et la QA navigateur manuelle du filtre de démo (`r2c-vfx-composer-v2-6-3-demo-scope-workload.md:323-324`).

## Addendum — lot 0 (run `claude-vfx-lot0-20261025T0845Z`)

CURRENT FACT, après le lot 0 :
- La couverture ne change pas : 3 actions de démo sur 34 affichent un effet composé.
- Les 31 autres affichent un substitut procédural (`src/combat/vfx/VfxMissingSheetStandIn.ts`) au lieu de rien. Ce placeholder ne compte pas comme couverture.
- `actionHasSpritesheetVfx` ne compte plus que les planches enregistrées, ce qui rétablit `castTelegraph`. Le saut de `Bond du Faucon` passe toujours par le repli propre à `doMove` (`vfx('hit')`), pas par le substitut.
- Les retours génériques dont la planche est retirée affichent aussi le substitut : K.O. (`kill_spark`), critique (`critical_hit`), `generic_hit`, attaques de base ennemies, `teleport_burst`.
- Reste ouvert : `isStrictSpritesheetCompliant` (`VfxActionRegistry.ts`, audit seulement) ne regarde toujours que le type d'étape.
- L'aspect des substituts n'a pas été inspecté à l'écran (panneau du navigateur non peint pendant l'essai). Leur création dans une scène Chromium réelle est vérifiée.

## Addendum — lot 1, contact (run `claude-vfx-contact-20261026T0103Z`)

CURRENT FACT : 12 actions de démo sur 34 ont désormais un effet composé. Ce sont les 3 presets pilotes et 9 publications : `basic_greatsword_hit`, `basic_dagger_hit`, `basic_long_spear_hit`, `w_break_guard`, `d_cursed_blade`, `ro_sneak_attack`, `l_long_thrust`, `enemy_heavy_strike`, `enemy_venom_strike`.

- Les actions du Combat Stage portent une fente en pose `attack` avec retour, sauf Estoc long, qui tient la pose sans avancer.
- Les actions tactiques n'ont que des effets : le mouvement d'unité ne s'applique que dans le Stage.
- Acceptation artistique : opérateur, non inférée.

## Addendum — lot 2, projectiles (run `claude-vfx-projectiles-20261026T0123Z`)

CURRENT FACT : 20 actions de démo sur 34 ont un effet composé. Ce sont les 3 pilotes et 17 publications. Les 8 projectiles ajoutés : `basic_longbow_hit`, `basic_grimoire_hit`, `a_precise_shot`, `ar_calibrated_shot`, `n_dark_bolt`, `enemy_dark_bolt`, `enemy_binding_shot`, `boss_pin`.

Chaque projectile se déplace du devant du lanceur à la cible et porte le retour d'impact, si bien que les dégâts tombent à son arrivée. Les tireurs tiennent la pose `attack`, les mages la pose `cast`. Acceptation artistique : opérateur, non inférée.

# R3E-1 - Integration des attaques de base VFX runtime

Date : 2026-07-31
Statut : valide techniquement

## Portee realisee

Les 22 candidats `basics` valides par R3D sont copies sans transformation vers
`public/assets/vfx/runtime/`. Tous gardent leur nom source explicite et leur format
`1280 x 1280`, RGBA, `5 x 5`, `25 frames`. Les 43 sheets dans `raw/skills/` ne sont
ni copies, ni references par le runtime dans ce lot.

Les seules decisions de raccordement sont visuelles : le calcul des degats, PA,
Souffle, Garde, Elan, cible, IA, pathfinding et regles de combat sont inchanges.

## Douze presets de base raccordes

| Preset | Famille d'arme | Sheet runtime | Taille visuelle |
| --- | --- | --- | --- |
| `basic_greatsword_hit` | `greatsword` | `basic_greatsword_cleave_heavy` | heavy 1.42 |
| `basic_holy_mace_hit` | `holy_mace` | `basic_mace_impact_medium` | medium 1.26 |
| `basic_scythe_hit` | `scythe` | `basic_blade_crescent_medium` | medium 1.26 |
| `basic_long_spear_hit` | `long_spear` | `basic_spear_stab_medium` | medium 1.26 |
| `basic_grimoire_hit` | `grimoire` | `basic_bolt_hit_small` | small 1.14 |
| `basic_crosier_hit` | `crosier` | `basic_staff_strike_small` | small 1.14 |
| `basic_rapier_hit` | `rapier` | `basic_dagger_crosscut_small` | small 1.14 |
| `basic_wand_hit` | `wand` | `basic_bolt_hit_small` | small 1.14 |
| `basic_longbow_hit` | `longbow` | `basic_arrow_hit_small` | small 1.14 |
| `basic_shuriken_hit` | `shuriken` | `basic_shuriken_cut_small` | small 1.14 |
| `basic_dagger_hit` | `dagger` | `basic_dagger_crosscut_small` | small 1.14 |
| `basic_hand_cannon_hit` | `hand_cannon` | `basic_bullet_hit_medium` | medium 1.26 |

Les douze presets ont exactement une etape `spriteSheet`. Les dix autres sheets de
base sont mises a disposition dans le registre pour les futures attaques de monstres
ou ennemis, sans etre dispatches dans R3E-1.

## Fichiers raccordes

- `public/assets/vfx/runtime/manifest.json` : 22 entrees `basic_weapon` runtime-ready.
- `src/combat/vfx/VfxTypes.ts` : IDs de sheets typees.
- `src/combat/vfx/VfxSpriteSheets.ts` : registre des 22 sheets et listes de controle.
- `src/combat/vfx/VfxPresets.ts` : pack de 12 presets d'armes.
- `src/combat/vfx/VfxActionRegistry.ts` : mapping arme -> preset, audit et fallback
  generique pour arme legacy/inconnue.
- `src/combat/legacyCombatRuntime.js` : choix du preset visuel avant le fallback
  existant, sans modification de regle de combat.

## Garde-fous

- URLs runtime limitees a `/assets/vfx/runtime/`.
- Aucune URL runtime vers `raw/`, `validation/`, `processed/`, `rejected/`, `v1/` ou `v2/`.
- Les tests verifient les dimensions RGBA, l'absence de magenta opaque, les IDs uniques,
  la synchronisation manifest/registre, les douze mappings et l'absence de sheet skill
  dans les presets de base.
- Aucun candidat `1254` n'est promu.

## Validation

- `npm.cmd test` : 28 fichiers, 413 tests passes.
- `npm.cmd run build` : passe (`tsc --noEmit` puis `vite build`).
- `git diff --check` : passe, sans erreur de whitespace (les avertissements CRLF de Git sont informatifs).

## Limites volontaires

Les sheets de skill, les previews, l'UI et la QA Lab ne sont pas modifies. Les IDs
R3A2 attendus mais absents de `raw/basics/` sont documentes comme
`MISSING_ASSET_FOR_RUNTIME_PROMOTION` plutot que remplaces par des fichiers imagines.

# Combat Action Presentation Premium VFX V2

## Périmètre verrouillé

Cette passe modifie uniquement la présentation des actions de combat : presets de mouvement, VFX procéduraux, intensité, durée, hit-stop, flash et shake bornés.

- Aucun changement de dégâts, puissance, multiplicateur, pénétration, critique ou précision.
- Aucun changement de PA, Souffle, Garde, Élan, objets ou statistiques.
- Aucun changement d'IA, pathfinding, RunSystem, ReputationSystem, TravelView ou DialogueView.
- Aucun spritesheet, atlas ou nouveau moteur VFX.
- Aucun mouvement de caméra ajouté. Le fond peint, la grille et le cadrage pseudo-prérendu restent fixes.

## Hiérarchie visuelle

| Tier | Actions | Traitement |
| --- | --- | --- |
| 1 | Attaque basique | mouvement et VFX courts, lisibilité maximale |
| 2 | Attaque+ et compétences 2 PA | anticipation et impact légèrement renforcés |
| 3 | Attaque++ et compétences 3 PA | motion plus affirmée, hit-stop et particules modérés |
| 4 | Compétences 4 PA | signature plus large et after-effect plus long |
| 5 | Ultimes héros / compétences 5 PA | preset unique, label ULTIME, impact premium contrôlé |
| 6 | Signatures boss | preset massif, label SIGNATURE, shake/flash plafonnés |

Le tier ajuste uniquement `intensity`, `particleScale`, `durationScale`, la durée/intensité du mouvement et un court temps d'after-effect. Les valeurs sont bornées pour éviter toute dérive visuelle.

## Ultimes héros

| Compétence | Preset dédié |
| --- | --- |
| `w_lion_surge` | `ultimate_lion_surge` |
| `p_radiant_judgement` | `ultimate_radiant_judgement` |
| `d_devouring_eclipse` | `ultimate_devouring_eclipse` |
| `l_firmament_lance` | `ultimate_firmament_lance` |
| `n_dark_meteor` | `ultimate_dark_meteor` |
| `w_miracle` | `ultimate_miracle` |
| `r_perfect_duality` | `ultimate_perfect_duality` |
| `e_absolute_harmony` | `ultimate_absolute_harmony` |
| `a_zenith_arrow` | `ultimate_zenith_arrow` |
| `ni_silent_assassin` | `ultimate_silent_assassin` |
| `ro_fault_breaker` | `ultimate_fault_breaker` |
| `ar_artillery_barrage` | `ultimate_artillery_barrage` |

Chaque ultime conserve son type de mouvement (mêlée, distance, magie, soin ou buff) et dispose d'une palette, d'un rythme et d'une silhouette VFX propres.

## Ennemis et boss

| Compétence | Preset |
| --- | --- |
| `enemy_heavy_strike` | `blunt_impact` |
| `enemy_crush` | `blunt_impact` |
| `enemy_dark_bolt` | `dark_bolt` |
| `enemy_hex` | `curse_pulse` |
| `enemy_venom_strike` | `poison_bite` |
| `enemy_dragon_breath` | `enemy_dragon_breath` |
| `boss_slam` | `boss_slam` |
| `boss_quake` | `boss_quake` |
| `boss_apocalypse` | `boss_apocalypse` |
| `boss_execution` | `boss_execution` |
| `boss_flurry` | `boss_flurry` |
| `boss_inferno` | `boss_inferno` |
| `boss_titan_slam` | `boss_titan_slam` |

Les boss 2x2 utilisent le centre de leur groupe comme ancre VFX. Leur baseline et leur position de grille ne sont pas modifiées.

## Mode graphique réduit

- Les motions principales restent actives.
- Les particules secondaires, la brume procédurale, les flashes et le shake sont réduits par preset.
- L'identité chromatique et la lecture anticipation/impact restent présentes.
- Les budgets déclarés sont vérifiés automatiquement pour chaque preset.

## Matrice QA

- Attaque, Attaque+, Attaque++.
- Compétences héros 2, 3, 4 et 5 PA.
- Les 12 ultimes héros.
- Signatures ennemies et boss prioritaires.
- Scène forêt et village incendié.
- Mode normal et mode graphique réduit.
- Boss 2x2, trois ennemis, cible en bord de grille et groupe de cibles.
- Retour systématique du sprite à sa baseline après mouvement/action.
- Absence de déplacement, rotation, orbite ou dolly de caméra ajouté par cette passe.

## Validation automatique

- Les IDs de presets sont uniques et tous résolus.
- Les 12 ultimes ont 12 presets distincts et le tier visuel 5.
- Les signatures boss principales ont le tier visuel 6.
- Les timelines, textures, budgets de particules et multiplicateurs reduced graphics sont bornés.
- `npm.cmd test`
- `npm.cmd run build`

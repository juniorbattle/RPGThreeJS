# Direction audio livrée sur `dev` — OD-2026-11-01-B

Run claude-audio-direction-20261101T1918Z (agent claude, session interactive). Set 1.12.0, baseline `29aa94862f9cd5f2c73ba9569660ed26c41ceaf8`.

## Résultat

- Amendement appliqué : `29aa9486`, baseline `50394ed4`, branche temporaire supprimée après vérification.
- Lots 2 à 6 sur `dev` : `1df283fe`, `9a4e1895`, `a1bc2071`, `41cb32fa`, `cfda1962`.
- Preuves et limites : [rapport](../../reports/audio-direction-2026-11-01.md). Guide d'écoute : [décision](../AUDIO_DIRECTION_OPERATOR_DECISION_2026-11-01.md).

## Où est quoi

| Sujet | Fichiers |
| --- | --- |
| Partitions | `src/audio/music/themes.ts` : accords et lignes en clair, mesure par mesure |
| Moteur | `compose.ts`, `MusicDirector.ts`, `src/audio/mix.ts` |
| Sons | `src/audio/cueTable.ts` (table fermée), `cueDesigns.ts` (dessins), `synthCues.ts` (rendu) |
| Repères | `src/combat/fx/fxSounds.ts` |
| Humeurs | `src/audio/moods.ts` : toute nouvelle scène doit y être placée, un test l'exige |
| Laboratoire | `src/ui/AudioListeningLab.ts`, en développement seulement |
| Mesures | `tools/audio/` : serveur `rpg-dev` requis, sorties dans `tmp/audio-direction/` |

## À faire

- L'opérateur écoute et renvoie l'avis du laboratoire. Claude retouche : la plupart des retours se règlent dans `themes.ts` ou `cueDesigns.ts`, puis `tools/audio/measure-cues.mjs` et `capture.mjs`.
- `tools/demo-continuous-production-qa.mjs` est adapté aux effets actifs par défaut, mais pas relancé en entier : à vérifier au prochain parcours complet.
- Le message de l'opérateur sur les ponts s'arrêtait sur « mais » : une suite reste possible. Il n'a pas encore nommé de pistes précises.

Scheduler PAUSED. `main` protégé. Aucun contrat modifié après la baseline.

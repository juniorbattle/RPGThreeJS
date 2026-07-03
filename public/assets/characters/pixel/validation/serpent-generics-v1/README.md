# Validation — Serpents génériques V1

Ce dossier est un espace de validation artistique, pas un dossier runtime.

Les fichiers placés ici ne doivent pas être référencés par :

- `src/render/assetManifest.ts`
- `src/combat/legacyCombatRuntime.js`
- `src/game/content.ts`

## Candidats attendus

| ID | Rôle | Exigence principale |
| --- | --- | --- |
| `serpent_raider` | assassin léger | capuche + masque réel, pas de visage identifiable |
| `serpent_brute` | soldat lourd | casque fermé, masse/hache, silhouette massive |
| `serpent_oracle` | caster rituel | masque + robe + bâton, distinct du raider |

## Fichiers de validation

- `serpent-generics-validation-board.png` : planche de comparaison et critères.
- `serpent-generics-brief.json` : contrat machine-readable du lot.

## Promotion

Un candidat validé est promu uniquement après revue visuelle. La promotion consiste à copier ses trois variantes dans :

- `../full/`
- `../dialogue/`
- `../ui/`

Puis à mettre à jour `canonical-character-qc.json` et à exécuter les tests.


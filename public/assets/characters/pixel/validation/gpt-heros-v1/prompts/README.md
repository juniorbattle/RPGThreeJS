# Lot héros — validation manuelle

Ce dossier contient uniquement des candidats hors runtime.

- `raw/` : sources GPT d'origine, conservées sans modification.
- `processed/` : une version chroma-key transparente par candidat, destinée à l'inspection.
- `boards/` : planches comparatives. Les identifiants `H01` à `H12` suivent l'ordre alphabétique des fichiers de `raw/`.
- `rejected/` : à utiliser seulement après une décision explicite de rejet.

Les fichiers de ce lot ne doivent pas être référencés par `full/`, `dialogue/`, `ui/` ou le manifeste tant qu'une sélection n'a pas été validée.

La provenance exacte des prompts n'a pas été reconstituée : aucun prompt n'est inventé dans cette passe.

# Ready — sprites calibrés (validation uniquement)

Ce dossier contient les variantes préparées à partir de `../final/` pour une
future promotion manuelle vers le runtime. Aucun fichier de ce lot n'est encore
référencé par le jeu.

## Gabarits communs

| Usage | Canvas | Baseline |
| --- | ---: | ---: |
| Combat / management (`full`) | 640 × 768 | y = 740 |
| Dialogue (`dialogue`) | 768 × 1024 | y = 966 |
| UI (`ui`) | 384 × 384 | y = 354 |

Les sujets sont découpés sur leur alpha, reconstitués avec une marge sûre puis
alignés sur une baseline commune. Les proportions sont adaptées par catégorie :
humanoïde, créature au sol, créature verticale et élite/boss.

Les quatre élites/boss conservent l'indication de rendu `1.60×` dans
`ready-manifest.json`; cette valeur est une donnée de préparation et ne modifie
pas le runtime actuel.

## Contrôle et promotion

- `boards/` contient les planches comparatives pour `full`, `dialogue` et `ui`.
- `ready-manifest.json` contient les chemins, les gabarits, les bboxes alpha et
  le résultat du contrôle qualité pour chaque sprite.
- Le lot est propre : pas de magenta opaque, coins transparents et aucun sujet
  collé à un bord de canvas.
- Après validation visuelle, seules les variantes retenues devront être copiées
  vers `../../full/`, `../../dialogue/` et `../../ui/`, puis référencées dans le
  manifeste runtime lors d'une passe distincte.

# Générateur local de suppression de fond magenta (spritesheets)

Outil Python **100% local / hors-ligne** pour :
1. Retirer précisément le fond magenta (`#FF00FF`) d'une spritesheet et le
   remplacer par de la vraie transparence (canal alpha), y compris sur les
   bords anti-aliasés (pas de liseré rose résiduel grâce au "despill").
2. Détecter et extraire chaque sprite individuellement, **sans bordure et
   sans fond magenta**, soit automatiquement, soit selon une grille connue.
3. Générer un rapport de contrôle qualité (QC) et une image de debug avec
   les boîtes de détection, pour vérifier visuellement le résultat.

Aucune dépendance externe à installer : `numpy`, `scipy`, `Pillow` sont
déjà présents dans cet environnement. Le script tourne aussi sur votre
machine si ces trois paquets sont installés (`pip install numpy scipy pillow`).

## Utilisation

```bash
# Détection automatique des sprites (aucune grille supposée)
python3 magenta_sprite_extractor.py mon_sheet.png --out sortie/

# Grille connue, ex: personnage 4 directions x 4 frames de marche
python3 magenta_sprite_extractor.py hero_walk.png --out sortie/ \
    --split grid --rows 4 --cols 4

# Traiter tout un dossier de spritesheets d'un coup
python3 magenta_sprite_extractor.py dossier_sheets/ --out sortie/ --recursive
```

Pour chaque image `nom.png`, un sous-dossier `sortie/nom/` est créé avec :
- `nom-sheet-transparent.png` : la feuille complète nettoyée (fond transparent)
- `nom_sprite001.png`, `nom_r0_c0.png`, ... : chaque sprite extrait individuellement
- `nom-debug-boxes.png` : aperçu avec les boîtes de détection (contrôle visuel)
- `nom-report.json` : rapport (dimensions, avertissements, sprites tronqués...)

## Options utiles

| Option | Rôle |
|---|---|
| `--split auto\|grid\|none` | `auto` = détection automatique (défaut) ; `grid` = grille fixe ; `none` = nettoyage seul, pas de découpe |
| `--rows` / `--cols` | Dimensions de la grille (mode `grid`) |
| `--low-thresh` / `--high-thresh` | Sensibilité du keying magenta (défauts 30 / 100). Baissez `low-thresh` si des couleurs proches du rose/magenta de vos sprites sont grignotées ; montez `high-thresh` si des résidus magenta subsistent sur les bords |
| `--no-despill` | Désactive la correction du halo magenta sur les bords anti-aliasés |
| `--dilate` | Rayon (px) de fusion des éléments proches en mode `auto` (utile pour regrouper une épée + un bras, des particules d'effet, etc. dans un même sprite) |
| `--min-area` | Taille minimale (px²) pour qu'un fragment soit considéré comme un sprite en mode `auto` (filtre le bruit / débris) |
| `--component-mode all\|largest` | `largest` ne garde que le plus gros fragment connecté par sprite/case (supprime les résidus isolés) |
| `--margin` | Marge (px) conservée autour de chaque sprite recadré |
| `--no-sheet` / `--no-debug` | Désactive la sauvegarde de la feuille complète / de l'image de contrôle |

## Comment fonctionne la précision

1. **Keying par distance colorimétrique** : chaque pixel est comparé au
   magenta pur (255,0,255). En dessous de `--low-thresh`, il devient
   transparent ; au-dessus de `--high-thresh`, il reste opaque ; entre les
   deux (pixels d'anti-aliasing sur les bords des sprites), l'alpha est
   interpolé en douceur (smoothstep).
2. **Despill** : sur ces pixels de bord à alpha partiel, la couleur
   d'origine est reconstruite mathématiquement en soustrayant la
   contribution du magenta (inversion du mélange alpha), ce qui évite tout
   liseré rose/magenta autour des sprites — même en zoomant.
3. **Détection par composantes connexes** (mode `auto`) ou **découpe en
   grille + recadrage serré** (mode `grid`) : dans les deux cas, le
   recadrage final se fait toujours sur le contenu réel (bounding box des
   pixels non transparents), donc aucune bordure vide ni bande de magenta
   ne subsiste autour des sprites exportés.
4. **QC automatique** : le script signale dans le rapport tout sprite dont
   la boîte touche le bord de l'image (signe possible d'un recadrage
   tronqué), à vérifier manuellement.

## Réglage fin selon vos feuilles

- Si des **couleurs violettes/roses de vos sprites disparaissent** avec le
  fond : baissez `--low-thresh` (ex: 15-20).
- Si un **léger liseré magenta persiste** sur les bords : montez
  `--high-thresh` (ex: 130-150) ou vérifiez que `--no-despill` n'est pas
  activé par erreur.
- Si des **éléments d'un même sprite se retrouvent séparés** (ex: une
  arme détachée du personnage) en mode `auto` : augmentez `--dilate`.
- Si des **résidus de bruit** apparaissent comme faux sprites en mode
  `auto` : augmentez `--min-area`.
- Pour des feuilles à **structure fixe et connue** (ex: 4x4 pour une
  marche 4 directions), préférez `--split grid` avec `--component-mode
  largest`, plus prévisible qu'une détection automatique.

## Test inclus

`test_input/fake_hero_sheet.png` est une feuille synthétique 4x4 (fond
magenta, formes anti-aliasées, un débris de test) utilisée pour valider le
pipeline. Vous pouvez la relancer à tout moment :

```bash
python3 magenta_sprite_extractor.py test_input/fake_hero_sheet.png \
    --out test_output --split grid --rows 4 --cols 4 --component-mode largest
```

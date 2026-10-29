# Mission locale — art de combat généré (OpenAI gpt-image-2)

Baseline : branche `claude/combat-scenes-pixel-art-1v60j4`. Statut : **PROPOSED FUTURE DESIGN** (pipeline prêt, aucune image générée). Contrat runtime : [combat HD-2D](COMBAT_HD2D.md).

La session cloud ne peut pas appeler l'API d'images. Elle a livré un combat jouable entièrement par code : arènes procédurales, sprites pixel tirés des poses existantes, effets et sons synthétisés. Cette mission locale remplace ou enrichit trois familles d'assets, **sans changer une ligne de code runtime**. Chaque traitement écrit dans un contrat que le jeu lit déjà.

| Lot | Images | Ce que ça remplace | Contrat lu par le jeu |
| --- | --- | --- | --- |
| `combat-hero-anims` | 30 (6 héros × 5 bandes) | Images clés des héros tirées des 4 poses → idle 4, marche 6, attaque 6, sort 6, coup 2 + KO 3 | `src/render/generated/combatPixelSprites.json` |
| `combat-arena-plates` | 6 (3 biomes × lointain + intermédiaire) | Plan lointain découpé dans les peintures stratégiques, bande procédurale du plan intermédiaire | `public/assets/generated/combat-arena/far-plates.json`, `src/render/generated/combatArenaPlates.json` |
| `combat-fx-sheets` | 8 (planches 4×4 additives) | Rien : couche ajoutée par-dessus les FX procéduraux des ultimes | `src/render/generated/combatFxSheets.json` |

## 1. Préparer

1. Mettre la clé dans `.env.local` à la racine du dépôt : `OPENAI_API_KEY=…`. Ce fichier est ignoré par git. La clé n'est jamais affichée, jamais écrite ailleurs et jamais embarquée (aucune variable `VITE_`).
2. Régénérer les spécifications si les prompts ont été modifiés : `node tools/openai-art/build-batches.mjs`.
3. Relire chaque prompt sans rien dépenser : `node tools/openai-art/generate-images.mjs tools/openai-art/batches/combat-hero-anims.json --dry-run`.

## 2. Générer (une image d'abord, puis le lot)

```bash
# un essai, à valider à l'œil avant de lancer le reste
node tools/openai-art/generate-images.mjs tools/openai-art/batches/combat-hero-anims.json --only alistair-attack
# le lot complet (les images déjà présentes sont sautées ; --force pour refaire)
node tools/openai-art/generate-images.mjs tools/openai-art/batches/combat-hero-anims.json
node tools/openai-art/generate-images.mjs tools/openai-art/batches/combat-arena-plates.json
node tools/openai-art/generate-images.mjs tools/openai-art/batches/combat-fx-sheets.json
```

- Les bruts vont dans `art-gen/<lot>/` (ignoré par git), avec `provenance.json` : modèle, prompt complet, empreintes des entrées et de la sortie, usage.
- Entrées des héros : leur master **et** la pose de combat correspondante. Ce sont les images du projet, la cohérence avec les dialogues est donc ancrée.
- Fond : une couleur clé unie, choisie pour ne pas apparaître sur le personnage. Vert pour Alistair et le Mage noir, cyan pour la Voleuse, magenta pour les autres. L'API refuse `background: transparent` (leçon RPGCards).

## 3. Traiter

```bash
python3 tools/openai-art/process_hero_strips.py            # toutes les bandes présentes
python3 tools/openai-art/process_hero_strips.py --unit rogue
python3 tools/openai-art/process_arena_assets.py           # plans d'arène + planches FX
npm test && npm run build
```

- **Héros** : retrait de la couleur clé avec dé-mélange des bords, découpe des images par bandes vides (sinon colonnes égales), pied et ancre détectés. Chaque bande est mise à l'échelle sur sa première image (debout), donc à la même densité de 40 px/m que tout le reste. Viennent ensuite la palette commune de 40 couleurs, le contour d'encre et l'assemblage dans la feuille du héros. Un aperçu ×3 est écrit dans `art-gen/combat-hero-anims/preview-<héros>.png`.
- **Plans** : le plan lointain est recadré sur la bande d'horizon que voit la caméra tactique, puis fondu vers le brouillard. Le plan intermédiaire est détouré du magenta et remplace la bande procédurale de son biome.
- **FX** : chaque planche 4×4 sur fond noir devient une couche additive jouée au moment de l'impact des ultimes (`sheet` dans `fxRecipes.ts`). Tant qu'une planche manque, l'étape est simplement sautée.

## 4. Contrôle qualité (à l'œil, pas de validation automatique)

- [ ] Même personnage que le master : visage, couleurs, armes, proportions. Une image ratée est **refaite** (`--only <nom> --force`), jamais retouchée à la main.
- [ ] Aucun effet dessiné dans les images des héros (traînées, auras) : le moteur les ajoute.
- [ ] Les pieds restent sur la même ligne : la marche ne flotte pas, le KO touche le sol.
- [ ] En jeu (`npm run dev`, puis `/legacy-combat.html?qa=1&stageqa=1&scene=<biome>`), les boutons QA jouent l'attaque, les ultimes et la pluie de flèches. Pour les captures : `tools/combat-arena/shots.sh` et `tools/combat-arena/action-shots.mjs`.
- [ ] Budget : 44 images au total. Les réserves se jouent image par image, seulement si une génération ne tient pas.

## 5. Valider puis committer

Committer ensemble les sorties traitées (`public/…`, `src/render/generated/*.json`) et les spécifications. Les bruts `art-gen/` restent locaux, et leur `provenance.json` est la trace d'origine. L'opérateur doit approuver avant tout passage en production.

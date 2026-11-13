# Poses de combat des nouvelles unités : cadrage

Statut : **VALIDÉ** le 2026-11-13 (OD-2026-11-13-A). À « Valides-tu ce périmètre et le pilote sur Aldric ? », tu as répondu « Oui, lance Aldric » ; je lis les six recommandations comme retenues, et tu peux en changer au verdict du pilote. Le pilote d'Aldric est fait (§8) ; le lot attend ton verdict. Brouillon du 2026-11-13 (runs `claude-combat-poses-scope-20261113T0638Z`, `claude-combat-poses-pilot-20261113T0653Z`). Rien n'est intégré.

Ta demande : « les nouveaux personnages/unités utilisés en combat doivent avoir leurs 4 poses nécessaires comme ceux déjà présents ». Ce document dit quelles unités sont concernées, comment les 27 unités de la démo ont eu leurs poses, les méthodes possibles, ce que ça coûte et la décision qu'il te faut prendre. Six questions t'attendent à la fin, chacune avec ma recommandation.

Planche des maîtres groupés selon le périmètre proposé : [`assets/COMBAT_POSES_SCOPE_2026-11-13_masters.jpg`](assets/COMBAT_POSES_SCOPE_2026-11-13_masters.jpg).

## En bref

- **38 unités** reçoivent leurs poses : les 6 héros recrutables, les 31 unités des plateaux qui combattent vraiment, et **Maelor**, qui combat à la brèche sans aucune planche pixel.
- **12 unités sont exclues** : 10 civils qui ne paraissent qu'en dialogue, et 2 unités d'archive (troll, champion mort-vivant) qu'aucun combat n'utilise plus.
- **114 images** au premier passage : la pose `prepare` reprend le maître déjà validé, comme dans la démo, et il reste 3 poses à générer par unité (`dash`, `attack`, `cast`). Avec les reprises, compte 150 à 170 appels.
- **Méthode recommandée** : étendre l'outil des images finales (`tools/art/finalImages.ts`) avec un type « pose ». Le maître sert de référence à chaque appel, la pose `dash` acceptée s'ajoute en référence pour `attack` et `cast`, et l'outil applique déjà les visages couverts, l'arme lue dans le moteur de combat et la couleur des Ombres.
- **Ordre recommandé** : les héros d'abord, puis plateau par plateau dans l'ordre du jeu (Ours, Dragon, Scorpion, acte final avec Maelor). Chaque lot passe par une planche de relecture, ton verdict, puis l'intégration.
- **Décision nécessaire** : un nouvel OD. F1 (OD-2026-11-11-F) couvre les images finales et leurs planches « maître seul », pas les poses. Aucun contrat LOCKED ne bloque, aucun amendement n'est nécessaire.
- **Pilote proposé** : Aldric, 3 images, montrées à côté des 4 poses d'Alistair. Rien n'est intégré.

## 1. Inventaire des 49 planches « maître seul »

Source : `MASTER_ONLY` dans `tools/pixel-sprites/build_combat_sprites.py:56`. `src/render/generated/combatPixelSprites.json` liste 76 planches : 27 ont leurs poses et 49 sont « maître seul » (repos et respiration, le mouvement vient du code). Qui combat a été relevé dans `src/combat/legacyCombatRuntime.js`, les `*Combat.ts` et `*Topology.ts` des plateaux, `finaleCombat.ts` et `src/game/catalog.ts`.

Légende des rôles : **boss** (boss d'un combat ou d'une phase), **élite** (combat d'élite, gardien de coffre ou champion du Tournoi), **troupe** (ennemi ordinaire ou escorte). L'arme est celle du moteur de combat, la même que l'outil des images finales a donnée au maître.

### Héros recrutables (6) : ils combattent

Recrutés aux rencontres des plateaux (`src/campaign/plateaux/heroMeetings.ts`, OD-2026-11-11-F, F2), ils jouent ensuite dans tous les combats de la compagnie. Leurs maîtres sont les anciennes illustrations « full » (640×768, `public/assets/characters/pixel/archive/non-demo/`), déjà en attitude d'action. Les visages sont couverts : casques, capuches, masque.

| Unité | Classe | Arme (catalogue) | Maître |
| --- | --- | --- | --- |
| `aldric` | Paladin | masse et bouclier | `archive/non-demo/aldric.png` |
| `morvan` | Chevalier Noir | faux | `archive/non-demo/morvan.png` |
| `lyra` | Mage Rouge | rapière | `archive/non-demo/lyra.png` |
| `eldwin` | Enchanteur | sceptre | `archive/non-demo/eldwin.png` |
| `talon` | Ninja | shuriken | `archive/non-demo/talon.png` |
| `gunnar` | Artilleur | canon à main | `archive/non-demo/gunnar.png` |

### Ours (9 combattants sur 11)

Maîtres : `public/assets/characters/pixel/post-demo/bear/`, images finales F1 intégrées le 2026-11-12 (`2712bff2`).

| Unité | Rôle | Arme | Où elle combat |
| --- | --- | --- | --- |
| `borin` | boss | Marteau de l'Ours | épreuve de l'Ours |
| `raven_miner_chief` | boss | Pioche de guerre | défense ou prise des mines |
| `raven_master_spy` | boss | Lames de jet | traque du Maître Espion |
| `raven_foreman` | élite | Masse de contremaître | gardien du col |
| `corrupted_beast` | élite (bête) | Griffes | bête corrompue (Ours, Dragon) |
| `depth_beast` | élite (bête) | Jet de pierre | gardiens des galeries, gardien des profondeurs |
| `bear_warrior` | troupe | Lance de guerre | escorte de Borin ; ennemi de clan à l'acte final |
| `raven_scout` | troupe | Lames de jet | éclaireurs, patrouilles ; acte final, Tournoi |
| `raven_miner` | troupe | Pic de mineur | patrouilles, mines, gardien du col |

Exclus : `raven_messenger` et `bear_miner`, présents seulement dans les dialogues et la présentation.

### Dragon (8 combattants sur 12)

Maîtres : `post-demo/dragon/`, intégrés le 2026-11-12 (`69123576`).

| Unité | Rôle | Arme | Où elle combat |
| --- | --- | --- | --- |
| `kaelen` | boss | Sceau (magie) | épreuve de Kaelen |
| `wolf_chief` | boss | Grande hache | assaut du repaire |
| `shadow_shaman` | boss | Onde froide (magie) | Chaman des Ombres |
| `wolf_champion` | élite | Lames de jet | gardien des terrasses ; combat du Tournoi |
| `shadow_wyrm` | élite (bête) | Souffle court (magie) | wyrm corrompu, gardien des cimes |
| `dragon_guardian` | troupe | Lance de milice | escorte de Kaelen ; acte final |
| `wolf_raider` | troupe | Hache courte | patrouilles du Loup ; acte final |
| `wolf_hunter` | troupe | Fronde | éclaireurs du Loup ; Tournoi |

Exclus : `wolf_envoy`, `wolf_captive`, `dragon_villager`, `dragon_pilgrim` (dialogues seulement).

### Scorpion (7 combattants sur 9)

Maîtres : `post-demo/scorpion/`, intégrés le 2026-11-12 (`80db77f1`).

| Unité | Rôle | Arme | Où elle combat |
| --- | --- | --- | --- |
| `grand_inquisitor` | boss | Sceau (magie) | épreuve de l'Inquisiteur |
| `phoenix_guardian_chief` | boss | Lance de flamme | chef des gardiens du Phénix |
| `shadow_prophet` | boss | Onde froide (magie) | Prophète des Ombres |
| `phoenix_flamekeeper` | élite | Flamme du temple (magie) | gardien des ruines |
| `shadow_zealot` | élite | Onde froide (magie) | gardien du sanctuaire |
| `phoenix_guardian` | troupe | Lance du temple | gardes du Phénix, gardiens ; acte final, Tournoi |
| `scorpion_scholar` | troupe | Bâton (magie) | escorte de l'Inquisiteur ; acte final |

Exclus : `phoenix_faithful`, `phoenix_captive` (dialogues seulement).

### Acte final (7 combattants sur 9, plus Maelor)

Maîtres : `post-demo/finale/`, intégrés le 2026-11-13 (`c9f67e9c`).

| Unité | Rôle | Arme | Où elle combat |
| --- | --- | --- | --- |
| `serpent_champion` | boss | Lame Serpent | finale du Tournoi |
| `demon_champion` | boss (démon) | Griffes | le champion changé en démon |
| `breach_entity` | boss (phase 2) | Onde froide (magie) | la brèche, après Maelor |
| `raven_champion` | élite | Lames de jet | combat du Tournoi |
| `phoenix_champion` | élite | Lance du temple | combat du Tournoi |
| `demon_brute` | élite (démon) | Griffes | gardien des remparts, capitale |
| `breach_demon` | troupe (démon) | Griffes | arène, ruines, capitale, brèche |
| **`maelor`** (`maelor_traitor`) | boss (phase 1) | Onde froide (magie) | la brèche |

Exclus : `finale_civilian`, `finale_citizen` (dialogues seulement).

**Maelor, hors des 49.** Son maître (`public/assets/characters/pixel/masters/maelor.png`) n'a aucune planche pixel : `combatPixelSprites.json` ne le contient pas, et `finalePresentation.test.ts:160` le sort exprès de la vérification des planches. D'après le code (`legacyCombatRuntime.js:1111`), il combat donc sur son maître HD, à une autre densité de pixels que toutes les autres unités. Je ne l'ai pas vérifié en jeu. C'est bien une nouvelle unité de combat : je le propose dans le périmètre.

### Archives (2) : exclues

- `troll` : seulement l'ancienne doublure du champion changé en démon (`finalePresentation.ts:85`, champ `standInPortrait`, historique) et le catalogue de `assetManifest.ts`. Aucun combat ne l'utilise.
- `undead_champion` : seulement l'ancienne doublure du fidèle égaré (`scorpionPresentation.ts:104`) et une liste de `DemoVfxActionScope.ts`. Aucun combat ne l'utilise.

Leurs planches restent telles quelles. Les supprimer demanderait d'abord l'inventaire de toutes leurs références (règle des contrats), hors de ce lot.

### Bilan

| Groupe | Combattent | Exclus |
| --- | ---: | ---: |
| Héros | 6 | 0 |
| Ours | 9 | 2 |
| Dragon | 8 | 4 |
| Scorpion | 7 | 2 |
| Acte final | 7 (+ Maelor) | 2 |
| Archives | 0 | 2 |
| **Total** | **37 des 49, + Maelor = 38** | **12** |

Les unités de la démo que les plateaux réutilisent ont déjà leurs poses : sanglier, blaireau, rat, squelette, loup, serpent venimeux, araignée, pillard Serpent, et le jeune wyrm, qui prend la planche du jeune dragon (`CharacterVisualRegistry.ts:57`).

## 2. Comment les 27 unités de la démo ont eu leurs poses

### Génération (Character System V2, septembre 2026)

- **Doctrine** : `docs/art-direction/option-c/character-style-lock/generation-gate.md`. Modèle `gpt-image-2.5-sunburst-2026-09-08`, qualité max, fond uni #FF00FF. Le maître accepté est la seule autorité d'anatomie, et seul un guide géométrique sans rendu peut s'y ajouter. Les poses sont générées dans l'ordre (repos, puis `dash`, puis `attack`, puis `cast`), chacune seulement si la précédente passe. Livraison en 512×512 RGBA.
- **Promotion** : Devin a promu 25 maîtres et 100 poses à l'identique dans `c9cd14c6` (2026-09-17), puis la parité de Garen et les deux miliciens dans `05d81720` (2026-09-18). Total : 27 unités. Les pipelines et les sorties brutes ont été retirés dans REPO-CLEAN-4 (`4a004268`, rapport `docs/reports/repo-clean-4-pre-cinematics-cleanup.md`). Ils restent dans l'historique Git.
- **Retouche récente** : la recoloration de Kestrel en bleu nuit (F3, 2026-11-11) a modifié ses 4 poses et réécrit leurs empreintes. Les sources de poses se retouchent donc sans tout refaire.

### Registre et manifeste

- `src/render/generated/characterSystemV2Manifest.json` : 37 unités, dont 27 avec les 4 poses (108 fichiers de pose). Toutes partagent la même échelle (`worldUnitsPerPixel` 0,00625, `scaleCorrection` 1,0). L'ancre des pieds est en (256, 456) sur 512×512 ; une attaque large passe en 640×512, ancre (320, 456). `characterBoundFx` est vrai sur les `attack` et `cast` qui portent un effet incrusté (traînée de lame, aura).
- `src/combat/stage/CombatPoseRegistry.ts` lit ce manifeste (`COMBAT_POSES = prepare, dash, attack, cast`) et fournit la vue stratégique (la pose `prepare`). Le Combat Stage est retiré (OD-2026-10-29-A) ; le registre reste pour les poses et les profils.
- Fichiers : `public/assets/characters/pixel/combat/<unité>/<pose>.png` (15 Mo pour les 27).

### Planche pixel (`tools/pixel-sprites/build_combat_sprites.py`, depuis `2d29605f`, 2026-10-28)

- Les 4 poses sont réduites à 40 pixels par mètre, la densité commune à toutes les unités.
- Palette partagée de 40 couleurs par unité, plus une couleur de contour.
- L'alpha est tranché à 0,48 et les points isolés sont retirés.
- Une cellule commune est calée sur l'ancre des pieds, et la respiration `idle_b` est dérivée de `prepare`.
- Sortie : 5 cellules (`idle`, `idle_b`, `dash`, `attack`, `cast`) et les animations `idle`, `move`, `windup`, `attack`, `cast`, `hurt` et `ko`.
- Une planche « maître seul » n'a que `idle` et `idle_b`, et toutes ses animations restent sur ces deux cellules : l'attaque est une fente du maître immobile.

### Contrôle qualité (`public/assets/characters/pixel/canonical-character-qc.json`)

Chaque variante est mesurée : boîte alpha, coins transparents, aucun pixel #FF00FF, aucun fond blanc, aucun artefact violet, aucun artefact de sol.

### Affichage en combat

- `legacyCombatRuntime.js:1111` trouve la planche par l'unité, ou par son portrait (champ `aliases` des planches « maître seul »).
- `PixelSpriteRig` (`src/combat/pixel/PixelSpriteMaterial.ts`) affiche la cellule que lui donne `PixelAnimationClock`.
- `playPixelAnim` (`legacyCombatRuntime.js:1438`) lance `move`, `windup`, `attack`, `cast`, `hurt` ou `ko`.
- Le mouvement par code ajoute les intermédiaires.
- OD-2026-10-30-A a retiré l'animation image par image (30 images), pas ces 4 poses-clés : le mouvement par code reste l'animation du jeu.

### Constat utile

Dans la démo, `prepare` est presque le maître : même attitude debout, recalée sur la ligne des pieds (voir Alistair, Garen, le général Serpent). Pour les nouvelles unités, le maître validé peut donc servir de `prepare`, à l'identique. Il ne reste que 3 poses à générer par unité.

### Ce qu'une pose doit satisfaire

1. PNG RGBA, coins transparents, aucun pixel #FF00FF, aucun fond blanc, aucun artefact violet, aucune ombre au sol.
2. La même échelle que le maître sur toutes les poses : un seul facteur par unité, jamais de redimensionnement pose par pose (rejet de la doctrine).
3. Les pieds sur une seule ligne, l'ancre aux pieds : 512×512, ou 640×512 pour une attaque large.
4. Le même côté que le maître ; `dash` et `attack` partent vers l'avant.
5. La même identité : armure, couleurs, proportions, casque ou capuche fermé (OD-2026-11-11-G), et la même arme, dans la même main, que le moteur de combat.
6. Les Ombres jamais violettes, pourpres ni magenta.
7. Après réduction, la même hauteur à l'écran qu'aujourd'hui (Borin 173 px, un guerrier de l'Ours 88 px) et une silhouette lisible.

## 3. Méthodes possibles

### A. Étendre l'outil des images finales, une pose par appel (recommandée)

Il s'agit d'ajouter un type `pose` à `tools/art/finalImages.ts` : un plan des poses, l'exécution, la journalisation et une planche de relecture qui place chaque pose à côté de la même pose d'une unité de la démo.

- **Identité** : le maître est la référence de chaque appel. La pose `dash` acceptée s'ajoute en seconde référence pour `attack` et `cast`, comme l'outil le fait déjà pour les décors qui se répondent (`samePlaceAs`).
- **Arme** : la règle d'arme existe déjà dans l'outil (`combatWeaponOf`, `weaponRule`, lues dans le moteur de combat). On ajoute « même arme, même main, même forme que sur le maître ». Les bêtes et les démons gardent la variante créature (griffes, aucune arme).
- **Visage** : `COVERED_FACE_RULE`, plus « le casque ou la capuche reste fermé même quand la tête tourne ou se penche ».
- **Le reste** : la règle de couleur des Ombres, le style, un fond transparent, la consigne « tourné vers la droite, en entier, pieds sur la ligne du bas, aucun effet ». L'attaque se génère en 1536×1024 pour laisser la place à la lance ou à la faux.
- **Pour** : l'outil a produit les 157 images finales acceptées, avec le même modèle, sur le même compte. Les règles sont dans le code et sous test. Chaque appel est tracé (modèle, prompt, références). Une pose ratée se refait seule, et l'ordre de la doctrine (`dash`, puis `attack`, puis `cast`) est respecté.
- **Contre** : 3 appels par unité. Des poses générées séparément peuvent dériver : un emblème, une teinte, la forme d'une arme. Le fond transparent du modèle peut laisser des franges, qu'un contrôle doit attraper.
- **Risques** : la dérive se voit surtout sur les boss (environ 170 px à l'écran) ; les petites unités (85 à 90 px) l'absorbent. Les armes de jet (lames de jet, fronde, shuriken) sont difficiles à lire en attaque. Une capuche peut s'ouvrir dans une pose d'incantation. L'échelle et la ligne des pieds sont réglées par un normaliseur, jamais pose par pose.

### B. Une bande de 3 poses par appel, par la route `tools/openai-art/`

Cette route reprend `generate-images.mjs` et un découpage dérivé de `process_hero_strips.py`, l'outillage du lot d'animation des héros abandonné par OD-2026-10-30-A et resté en place.

- **Identité** : meilleure cohérence entre les 3 poses, puisqu'elles sont dessinées ensemble.
- **Arme et visage** : les règles sont à recopier à la main dans la spécification ; l'outil ne les connaît pas.
- **Pour** : environ 3 fois moins d'appels (38 au lieu de 114), une palette et une échelle communes.
- **Contre** : des figures plus petites. Les colonnes se chevauchent (lance, faux, cape, portée de l'attaque) et l'échelle varie d'une case à l'autre. La couleur de détourage (#00FF00) se heurte aux verts du Serpent et du Dragon, et laisse des franges. Une case ratée oblige à refaire la bande. Le modèle est figé à `gpt-image-2`, qui n'est pas celui des maîtres. Enfin, c'est la route d'un lot que tu as abandonné.

### C. Aucune génération

On garde le « maître seul » et le mouvement par code, ou on dérive des poses par code (inclinaison, cisaillement du maître). Ça ne coûte rien, mais ça ne répond pas à ta demande, et un cisaillement déforme visiblement le pixel art.

### D. Codex (ChatGPT) à la main (OD-2026-11-09-C)

F1 remplace cette route pour les images finales. Prompts et références n'auraient pas de trace dans le dépôt, et aucune règle ne s'appliquerait d'office. Possible sur demande, pas recommandé.

## 4. Volume et coût

| Lot | Unités | Images (3 par unité) |
| --- | ---: | ---: |
| Héros | 6 | 18 |
| Ours | 9 | 27 |
| Dragon | 8 | 24 |
| Scorpion | 7 | 21 |
| Acte final + Maelor | 8 | 24 |
| **Total** | **38** | **114** |

- **Si `prepare` est aussi générée** : 152 images (Q3).
- **Appels** : les images finales ont pris 242 appels pour 157 images (×1,54), et 51 appels pour les 41 personnages (×1,24), tous en `gpt-image-2.5-sunburst-2026-09-08`, qualité haute. Les poses ajoutent un risque de dérive entre poses : je compte ×1,3 à ×1,5, soit 150 à 170 appels, sur ton compte OpenAI.
- **Passes par lot** : 1) les `dash` du lot ; 2) les `attack` et `cast`, avec la `dash` acceptée en référence ; 3) les reprises. Environ 15 passes pour les 5 lots.
- **Relecture** : une planche par lot (maître et 3 poses de chaque unité, à côté de l'unité de la démo de la même famille), puis ton verdict, puis 2 à 4 combats vérifiés en jeu à l'intégration, comme pour les images finales.

### Ce qui change dans le code (à l'intégration de chaque lot, pas avant)

1. `tools/art/finalImages.ts` : le type `pose` (plan, exécution, planche). L'empreinte des briefs déjà validés reste identique, et le test le vérifie (`finalImagesFinale.test.ts`).
2. Un normaliseur, par exemple `tools/pixel-sprites/normalize_final_poses.py`. Il fait le contrôle (coins, magenta, violet, sol), applique un facteur d'échelle par unité tiré du maître, cale la ligne des pieds et le canevas, et écrit les poses HD avec leurs empreintes.
3. `build_combat_sprites.py` : une table des unités posées remplace leurs lignes de `MASTER_ONLY`, avec `idle` égal au maître. Elle garde `aliases`, sans quoi le moteur ne retrouve pas la planche par le portrait, et garde la hauteur actuelle à l'écran. Elle produit les 5 cellules et les animations par défaut.
4. Maelor : une entrée avec un alias sur `masters/maelor.png`, pour qu'il quitte son maître HD en combat. L'exception de `finalePresentation.test.ts` est mise à jour.
5. Tests : les 4 tests de présentation des plateaux attendent aujourd'hui `masterOnly === true` (`bearPresentation.test.ts:120` et ses équivalents). Ils attendront les cellules `dash`, `attack` et `cast`.
6. **Inchangés** : `CombatPoseRegistry.ts` et `characterSystemV2Manifest.json` (37 unités, 108 poses, figés par leurs tests), le code du moteur (le contrat v1 des planches joue déjà `dash`, `attack` et `cast`), les sauvegardes V6 et toute vérité de jeu.
7. Sources HD : environ 114 PNG, 20 à 28 Mo. Je propose de les garder dans le dépôt hors de `public/`, pour ne pas les livrer : seule la planche pixel sert en jeu.

## 5. Gouvernance

- **Décision nécessaire** : un nouvel OD, daté du jour de ta validation, qui fixe le périmètre, la méthode, l'ordre et le pilote. F1 (OD-2026-11-11-F) couvre les images finales, maîtres et planches « maître seul » compris, mais pas les poses.
- **Rappels de l'OD proposé** :
  - OD-2026-11-11-G (visages couverts) s'applique à chaque pose.
  - OD-2026-10-30-A est inchangé : pas d'animation image par image, 4 poses-clés et le mouvement par code.
  - Le déroulé de F1 s'applique : ta clé lue dans l'environnement ou `.env.local`, jamais affichée ; sorties dans `tmp/`, hors Git ; planche de relecture ; seules les images acceptées sont intégrées.
- **Contrats** : aucun ne bloque, aucun amendement n'est nécessaire.
  - `WORLD_AND_CHARACTERS.md` : « New characters follow the Character V2 family, each with a declared pose and staging role ». Les masters et poses V2 sont le plafond visuel, et un nouveau personnage doit rejoindre cette famille avec une pose déclarée.
  - `COMBAT_AND_VFX.md:65` : les planches pixel de combat « derive from Character System V2 poses or masters », et les maîtres restent l'autorité de la mise en scène narrative.
  - La ligne rouge des cinématiques (aucune image illustrée de cinématique) ne vise pas des poses de combat.
- **Vérifié le 2026-11-13** : `npm run -s contracts:validate` valide les 8 contrats ; la porte `git diff --exit-code 5a61d319… HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md` n'affiche rien.
- **Effets incrustés** : les poses de la démo en portent (`characterBoundFx`). Le registre précise que ce n'est vrai que « for effects approved as physically attached to the actor ». Sans effet incrusté (Q4), rien de plus à approuver, et les effets procéduraux de chaque compétence (OD-2026-11-01-A) ne se doublent pas.

## 6. Pilote proposé (seulement après ton accord)

- **Unité** : Aldric, le premier de l'ordre recommandé. Masse et bouclier, casque fermé : il éprouve à la fois l'identité, l'arme et le visage couvert.
- **Production** : 3 images (`dash`, `attack`, `cast`) avec le modèle des maîtres, `prepare` = son maître, au plus 2 reprises.
- **Rendu** : une planche avec les 4 poses d'Aldric à côté des 4 poses d'Alistair, en HD et réduites en pixel. Rien n'est intégré, et rien ne change dans les outils suivis par Git avant que la méthode soit validée.
- **Autre choix** : le guerrier de l'Ours, représentatif des 31 unités des plateaux (maîtres 512×512 de F1), déjà vu au pilote des images finales.

## 7. Questions

| # | Question | Ma recommandation | Autres choix |
| --- | --- | --- | --- |
| Q1 | Quelles unités ? | Les 37 combattants des 49, plus Maelor : **38**. Les 10 civils et les 2 archives sont exclus. | Sans Maelor (37) ; seulement héros, boss et élites (29). |
| Q2 | Quelle méthode ? | **A** : l'outil des images finales, une pose par appel, maître (et `dash` acceptée) en référence. | B, une bande de 3 poses par appel. |
| Q3 | Faut-il générer `prepare` ? | **Non** : le maître validé sert de `prepare`, comme dans la démo. 114 images. | Générer les 4 poses (152) ; ou seulement une `prepare` plus calme pour les 6 héros, dont le maître est déjà en action (+6). |
| Q4 | Des effets incrustés dans `attack` et `cast` ? | **Aucun** : les effets procéduraux s'en chargent, et ça écarte le risque de lueur violette. | Comme la démo (traînée, aura), à approuver pose par pose. |
| Q5 | Dans quel ordre ? | **Les héros d'abord**, puis l'Ours, le Dragon, le Scorpion et l'acte final avec Maelor. Chaque lot est relu puis intégré avant le suivant. | Plateau par plateau, chaque héros avec le plateau de sa rencontre ; ou les boss et élites de tous les plateaux d'abord. |
| Q6 | Quel pilote ? | **Aldric**, 3 images, à côté d'Alistair. | Le guerrier de l'Ours. |

Note libre :

## 8. Pilote d'Aldric (2026-11-13)

Ta réponse : « Oui, lance Aldric ». Planche : [`assets/COMBAT_POSES_PILOT_ALDRIC_2026-11-13.jpg`](assets/COMBAT_POSES_PILOT_ALDRIC_2026-11-13.jpg).

- **Production** : 3 images, `gpt-image-2.5-sunburst-2026-09-08`, qualité haute, fond transparent. `dash` et `cast` en 1024×1024, `attack` en 1536×1024. Toutes ont pour référence le maître d'Aldric, posé sur le canevas de sortie ; `attack` et `cast` ont en plus la `dash` acceptée. Aucune reprise sur les 2 prévues.
- **Outil** : un script jetable, `tmp/combat-poses-pilot/pilot.ts`, qui reprend les règles de `tools/art/finalImages.ts` (visage couvert, règle d'arme, lecture de la clé jamais affichée) sans le modifier. Les sorties et le journal (prompt, empreintes des références et des images, jetons) sont dans `tmp/combat-poses-pilot/`, ignoré par Git.
- **La planche montre** :
  - les HD d'Aldric (son maître en `prepare`, puis ses 3 poses) au-dessus des 4 poses d'Alistair ;
  - la planche pixel d'Aldric, construite avec les fonctions de `build_combat_sprites.py` : une palette de 41 couleurs, une seule échelle, les pieds alignés, une figure de 84 px (85 aujourd'hui) ;
  - à côté, la planche d'Alistair et la planche « maître seul » actuelle d'Aldric.
- **Ce qui tient** : dans les 3 poses, la même identité (heaume fermé à couronne solaire, armure blanc et or, tabard et cape bleu et or, bouclier bleu à croix d'or, masse à tête en cage), le visage couvert et la même arme. Les poses vont vers la droite, sans aucun effet. Le contrôle donne des coins transparents, aucun pixel magenta et aucun pixel plein sur les bords.
- **Ce qu'il faut savoir** :
  1. **Échelle** : le modèle a dessiné les poses environ 15 % plus petites que le maître (0,80 à 0,87 selon la surface pleine), bien que le maître ait été posé à l'échelle voulue sur le canevas. Un facteur unique pour l'unité (la médiane, 0,846) les ramène à la bonne taille. Le normaliseur du lot fera de même, jamais pose par pose. L'écart entre les poses (±4 %) tient en partie à la cape.
  2. **Repos et incantation se ressemblent** : le maître d'Aldric lève déjà sa masse, et sa pose `cast` aussi. C'est le cas que Q3 évoque pour les héros, dont les maîtres sont en action : une `prepare` plus calme les distinguerait, pour une image de plus par héros.
  3. **Effets** : les poses d'Alistair portent leurs effets (traînée de feu, aura), celles d'Aldric n'en ont pas (Q4). En combat, les effets procéduraux de ses compétences les remplacent.
  4. **Frange** : le fond transparent du modèle laisse un liseré semi-transparent, que le seuil d'alpha du constructeur retire. Rien à reprendre à la main.
- **Rien n'est intégré** : aucune planche du jeu, aucun fichier de `public/` ou de `src/`, aucun outil suivi par Git n'a changé.
- **Suite, après ton verdict** : j'ajoute le type `pose` à l'outil, le normaliseur et la table des unités posées. J'intègre Aldric et le vérifie en combat, puis je lance les cinq autres héros.

# COMBAT-HD2D-1 — Scènes de combat HD-2D, unités pixel, effets et sons procéduraux

| Field | Value |
| --- | --- |
| `TASK` | COMBAT-HD2D-1 |
| `DOMAIN` | combat, media, tooling |
| `BASELINE` | `main @ 00b96f1` |
| `BRANCH` | `claude/combat-scenes-pixel-art-1v60j4` |
| `HEAD` | voir l'historique de la branche (dernier commit de la tâche) |
| `STATUS` | review |
| `MERGED_IN` | NONE |
| `SUPERSEDES` | NONE |
| `SUPERSEDED_BY` | NONE |
| `PRODUCTION_IMPACT` | Présentation du combat canonique (`/legacy-combat.html`) : arène procédurale à la place du fond peint et de la grille superposée, feuilles pixel pour toutes les unités, caméra d'action et projecteur dans l'arène (Combat Stage retiré), effets et sons procéduraux. Règles, IA, protocole et sauvegarde inchangés. |
| `CANONICAL_DOCS_UPDATED` | `docs/combat/COMBAT_HD2D.md` (nouveau), `docs/combat/LOCAL_ART_MISSION.md` (nouveau), `docs/project/CURRENT_STATUS.md`, `docs/README.md` |
| `EVIDENCE` | [`result.json`](combat-hd2d-1/result.json) et 7 captures dans [`combat-hd2d-1/`](combat-hd2d-1/). Portée : Chromium SwiftShader 1440×810, combat autonome et démarrage par le protocole de la campagne. Pas de mesure de performance GPU réelle. Sons vérifiés par les tests de couverture, pas d'écoute. |

## Réalisé (CURRENT FACT)

1. **Arènes procédurales** (`src/combat/arena/`). Une par biome : plateforme de dalles dont les joints forment la grille, sol pixel, architecture 3D aux textures pixel, arbres et buissons en billboards pixel-art, feu et fumée pixel en shaders, lumières scintillantes, brouillard, plan lointain découpé dans les peintures approuvées. Captures [01](combat-hd2d-1/01-before-after-forest.jpg) et [02](combat-hd2d-1/02-arenas-and-campaign-boot.jpg).
2. **Unités pixel-art** (`tools/pixel-sprites/`, `src/combat/pixel/`). 35 feuilles produites depuis les poses ou les masters : une seule taille de pixel pour toutes les unités, héros d'environ 88 px, animations jouées par-dessus le mouvement codé. Capture [06](combat-hd2d-1/06-pixel-sheets.jpg).
3. **Caméra et projecteur** (`src/combat/camera/`). Poussée sur chaque action. Pour les ultimes et signatures : lumière qui baisse, unités qui reculent, bandes noires, titre et plan bas. Combat Stage retiré, avec ses tests. Captures [03](combat-hd2d-1/03-ultimate-lion-surge.jpg), [04](combat-hd2d-1/04-ultimate-dark-meteor.jpg) et [05](combat-hd2d-1/05-ultimate-miracle.jpg).
4. **Effets procéduraux** (`src/combat/fx/`) : une recette pour chaque preset (ultimes et signatures avec charge, ralenti, speed lines, coup de caméra), lumière dynamique sur l'arène. Ils ne dépendent plus du pack CartoonCoffee local.
5. **Sons synthétisés** (`src/combat/audio/`) : un son pour chaque repère d'effet, pas, tour, victoire/défaite, ambiance par biome, réglage on/off.
6. **Pipeline de la mission locale** (`tools/openai-art/`) : générateur gpt-image-2, 44 prompts (bandes d'animation des héros, plans d'arène, planches FX), traitements vers les contrats existants. Testé sur une bande synthétique. [Mission](../combat/LOCAL_ART_MISSION.md).

## Indicateurs de rendu

| Arène | Appels de dessin par image (passe d'ombre comprise) | Triangles | Décors statiques fusionnés |
| --- | --- | --- | --- |
| Route forestière | 308 | 21,8 k | 69 maillages |
| Bois-Clair en flammes | 319 | 23,9 k | 141 maillages |
| Sanctuaire du Lion | 297 | 25,9 k | 158 maillages |

La fusion du décor statique par matériau ramène les appels d'environ 420-540 à environ 300. Sous SwiftShader (rendu logiciel, sans GPU), le combat tourne vers 2,5 images/s. Ce chiffre ne dit rien d'un vrai GPU : un essai de longue durée sur 3 manches d'IA n'a montré ni blocage ni erreur (`tools/combat-arena/trace-ai.mjs`).

## Corrigé en cours de route

- Un sprite pixel atténué sous 50 % disparaissait au lieu de devenir translucent : la découpe alpha se fait désormais sur le texel. Cela touchait le mode déplacement et les témoins du projecteur. Capture [07](combat-hd2d-1/07-move-mode-focus.jpg).

## Reste ouvert (PROPOSED FUTURE DESIGN / UNDECIDED)

- Lancer la mission locale (44 images, validation à l'œil par l'opérateur).
- Faire une passe de performance sur GPU réel, notamment l'arène du village : lumières, fumée, particules.
- Retirer les assets devenus inutiles (`public/assets/combat-stage/poses/`, fonds `combatStageScenes`), après revue des dépendances et accord de l'opérateur.

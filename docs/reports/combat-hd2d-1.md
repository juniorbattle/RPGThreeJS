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
| `EVIDENCE` | [`result.json`](combat-hd2d-1/result.json) et 13 captures dans [`combat-hd2d-1/`](combat-hd2d-1/). Portée : Chromium SwiftShader 1440×810, combat autonome et démarrage par le protocole de la campagne. Pas de mesure de performance GPU réelle. Sons vérifiés par les tests de couverture, pas d'écoute. |

## Réalisé (CURRENT FACT)

1. **Arènes procédurales** (`src/combat/arena/`). Une par biome : plateforme de dalles dont les joints forment la grille, sol pixel, architecture 3D aux textures pixel, arbres et buissons en billboards pixel-art, feu et fumée pixel en shaders, lumières scintillantes, brouillard, plan lointain découpé dans les peintures approuvées. Captures [01](combat-hd2d-1/01-before-after-forest.jpg) et [02](combat-hd2d-1/02-arenas-and-campaign-boot.jpg).
2. **Unités pixel-art** (`tools/pixel-sprites/`, `src/combat/pixel/`). 35 feuilles produites depuis les poses ou les masters : une seule taille de pixel pour toutes les unités, héros d'environ 88 px, animations jouées par-dessus le mouvement codé. Capture [06](combat-hd2d-1/06-pixel-sheets.jpg).
3. **Caméra et projecteur** (`src/combat/camera/`). Poussée sur chaque action. Pour les ultimes et signatures : lumière qui baisse, unités qui reculent, bandes noires, titre et plan bas. Combat Stage retiré, avec ses tests. Captures [03](combat-hd2d-1/03-ultimate-lion-surge.jpg), [04](combat-hd2d-1/04-ultimate-dark-meteor.jpg) et [05](combat-hd2d-1/05-ultimate-miracle.jpg).
4. **Effets procéduraux** (`src/combat/fx/`) : une recette pour chaque preset (ultimes et signatures avec charge, ralenti, speed lines, coup de caméra), lumière dynamique sur l'arène. Ils ne dépendent plus du pack CartoonCoffee local.
5. **Sons synthétisés** (`src/combat/audio/`) : un son pour chaque repère d'effet, pas, tour, victoire/défaite, ambiance par biome, réglage on/off.
6. **Pipeline de la mission locale** (`tools/openai-art/`) : générateur gpt-image-2, 44 prompts (bandes d'animation des héros, plans d'arène, planches FX), traitements vers les contrats existants. Testé sur une bande synthétique. [Mission](../combat/LOCAL_ART_MISSION.md).

## Passe 2 — décor méticuleux et poids des effets (CURRENT FACT)

Demandes de l'opérateur : décors arrière (arbres de la forêt « encore brouillon ») et chaque détail de chaque scène ; effets d'autant plus visibles que la compétence coûte de PA ; ultimes couvrant le terrain.

1. **Végétation** : arbres feuillus en grappes de feuilles à 4-5 tons, pins à étages, dessinés à leur taille d'affichage ; deux lignes d'arbres dans le brouillard ferment l'horizon.
2. **Détails par biome** : colonnes cannelées, tambours tombés et rondins (forêt) ; fenêtres éclairées par masque émissif, meule de foin, charrette chargée, puits, débris calcinés et arbre mort en feu (village) ; stèle du Lion en relief doré et bannières au lion rampant redessiné (sanctuaire). Rayons de lumière et brume basse. Textures tramées seulement aux transitions de tons. Capture [08](combat-hd2d-1/08-decor-pass-arenas.jpg).
3. **Poids des effets selon les PA** (`fxIntensity.ts`) : léger, standard, fort, lourd, majeur, ultime ; tailles, particules, lumière et tremblement suivent le coût, avec des couches d'impact en plus à 3, 4 et 5 PA. Capture [09](combat-hd2d-1/09-fx-ap-weight.jpg).
4. **Ultimes plein terrain** : cercle de runes sous la plateforme, ondes qui dépassent ses bords, vague d'éruptions case par case selon l'élément ou la recette ; la caméra recule sur un plan d'ensemble et le projecteur tient jusqu'à la fin de la vague. Capture [10](combat-hd2d-1/10-ultimates-field-wave.jpg).
5. **Lisibilité** : les effets debout se dessinaient avant les sprites d'unité et étaient cachés par la cible ; ils passent désormais devant. Entailles qui traversent la cible avec une lame sombre dessous, étincelles pixel opaques.
6. **Vérifications** : 17 tests en échec, les mêmes que sur `main` cas par cas (médias locaux absents) ; build OK ; démarrage par le protocole de la campagne sans erreur (`lion_chief`, `village_defense`) ; IA sur 4 manches sans erreur.
7. **Correction de gouvernance** : le verrou CIN-6E-A listait les nouveaux fichiers combat comme non autorisés. Ce test était masqué parce que son fichier échoue déjà sur des médias absents. Les fichiers de la refonte sont maintenant autorisés explicitement, avec la référence à la demande de l'opérateur.

## Passe 3 — maisons, intégration, sceaux et précision (CURRENT FACT)

Retour de l'opérateur : maisons du village en feu « légèrement inférieures », s'assurer que les environnements sont bien générés et intégrés, effets encore à préciser, retirer l'étoile des cercles des compétences signatures et ultimes (identité non voulue) ou la remplacer par un effet de pulsation pour les plus puissantes.

1. **Maisons** : reconstruites en pièces (soubassement, étage en encorbellement, colombages en relief, fenêtres à vitraux avec volets et appuis, porte à linteau, pignons à poinçon, toit en dalles épaisses avec avant-toit, faîtage et rives, cheminée fumante, lanterne murale). En feu : pan de toit ouvert sur des chevrons calcinés, feu derrière une fenêtre, suie. Capture [11](combat-hd2d-1/11-village-houses.jpg).
2. **Intégration** : les décors flottaient de 16 cm (posés à `y = 0` alors que le sol est à `-0,16`) ; ils sont maintenant au sol, avec ombres de contact et herbes au pied des murs (un appel de dessin chacun). Stèles funéraires monolithes gravées au lieu de la texture de briques. Capture [12](combat-hd2d-1/12-ground-integration.jpg).
3. **Génération testée** : `CombatArena.test.ts` construit chaque arène et vérifie chaque accessoire (au sol, hors plateau) et le budget d'appels de dessin. Ce test a révélé que la détection de l'environnement de test ne reconnaissait pas « HappyDOM » : la construction attendait indéfiniment le plan lointain. Corrigé.
4. **Sceaux** : plus d'étoile ; anneaux, glyphes runiques, tirets et perles. Pulsation (deux éclats par battement, anneau de lumière émis) réservée aux ultimes et signatures de boss. Capture [13](combat-hd2d-1/13-seals-pulse-precision.jpg).
5. **Précision des effets** : couleurs en bandes nettes, cases touchées allumées sous les actions de zone (et sous la cible d'un coup lourd), éruptions par case à la largeur d'une case.
6. **Vérifications** : build OK ; démarrage par le protocole de la campagne sans erreur (`village_defense`, `lion_chief`) ; suite complète comparée à `main` cas par cas : aucun nouvel échec. Trois tests de cinématiques dépassent leur délai de 5 s dans ce conteneur, à l'identique sur `main`.

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

- Valider sur GPU réel le rythme de la finale des ultimes (enchaînement coup rapproché, plan d'ensemble, vague) : les captures en rendu logiciel n'en montrent que des images isolées.

- Lancer la mission locale (44 images, validation à l'œil par l'opérateur).
- Faire une passe de performance sur GPU réel, notamment l'arène du village : lumières, fumée, particules.
- Retirer les assets devenus inutiles (`public/assets/combat-stage/poses/`, fonds `combatStageScenes`), après revue des dépendances et accord de l'opérateur.

# Combat HD-2D — contrat de présentation

Baseline : branche `claude/combat-scenes-pixel-art-1v60j4`, partie de `main @ 00b96f1`. Ce document décrit la **présentation** du combat canonique (`/legacy-combat.html`, initialisé par `CombatBridge`). Les règles de combat, l'IA, le protocole `postMessage` et la sauvegarde ne changent pas.

Labels : CURRENT FACT, sauf mention contraire.

## Vue d'ensemble

| Couche | Source | Rôle |
| --- | --- | --- |
| Arène | `src/combat/arena/` | Diorama procédural par biome. Plateforme 8×4 en dalles dont les joints forment la grille, sol pixel, architecture 3D, végétation en billboards pixel-art, feu et fumée pixel en shaders, lumières, plan lointain peint. |
| Unités | `src/combat/pixel/`, `tools/pixel-sprites/` | Feuilles pixel-art à densité unique (40 px/m), animations idle / move / windup / attack / cast / hurt / ko par-dessus le mouvement codé existant. |
| Caméra | `src/combat/camera/CombatCameraDirector.ts` | Vue tactique, poussée courte sur chaque action, plan large pour les zones, **projecteur** pour les ultimes et signatures de boss. |
| Effets | `src/combat/fx/` | Effets procéduraux style Octopath : recettes déclaratives par preset VFX, lumière dynamique, ralenti, speed lines, coup de caméra. |
| Sons | `src/combat/audio/CombatSfx.ts` | Synthèse WebAudio (aucun fichier) : une recette par repère d'effet, pas, tour, victoire/défaite, ambiance par biome. |

Le **Combat Stage** (scène séparée) est retiré. Les actions se jouent dans l'arène. `stage/combatStageProfiles.ts` reste le classificateur utilisé par le VFX Lab.

## Arènes

- Thèmes : `forest_route`, `bois_clair_burning`, `lion_sanctum` (`arenaThemes.ts`). Un `sceneId` inconnu retombe sur la route forestière.
- La plateforme ne déplace aucune case : chaque dessus de dalle reste à `y = 0`, et les cases de sélection (`G.grid`) sont inchangées.
- Le décor ne peut jamais encombrer la plateforme (`propCrowdsPlatform`, testé). La bande du plan intermédiaire et le fouillis au sol sont semés de façon déterministe.
- Textures en pixel art générées à la volée (`arenaTextures.ts`, `arenaSprites.ts`). Densité : 48 texels par dalle, soit environ celle des sprites.
- Plan lointain : bande d'horizon découpée dans les peintures stratégiques approuvées (`tools/combat-arena/build_far_plates.py`), fondue dans le brouillard.
- Lumière : soleil, hémisphère et appoint fixés par thème. Au plus 6 points lumineux scintillants pris dans les demandes des décors (braseros, lanternes, bougies, incendies). `setDim()` assombrit l'arène pendant le projecteur.
- Atmosphère (`shafts`, `mist` dans le thème) : rayons de lumière en shader pixel tramé (soleil à travers la canopée, lune entre les arches) et brume basse qui dérive. Toujours derrière la plateforme (testé), atténués avec l'arène pendant le projecteur.
- Végétation : arbres feuillus en grappes de feuilles, pins à étages, fougères, herbes. Chaque billboard est dessiné à sa taille d'affichage (paliers de 0,2), donc un grand arbre garde la densité du décor. Deux lignes d'arbres dans le brouillard ferment l'horizon.
- Détails par biome : colonnes cannelées et tambours tombés, rondins (forêt) ; maisons à colombages, meule de foin, charrette chargée, puits, débris calcinés, arbre mort en feu, place pavée (village) ; stèle du Lion en relief doré, bannières au lion rampant, stèles funéraires gravées (sanctuaire). Le lion des bannières et de la stèle est le même dessin (`lionPart`).
- Maisons du village : construites en pièces pour que lumière et ombre accrochent chaque poutre. Soubassement de pierre, étage en encorbellement sur abouts de solives, colombages par face (poteaux, lisses, décharges, croix de Saint-André), fenêtres à vitraux avec encadrement, appui et volets, porte avec linteau, pentures et marche, pignons enduits avec poinçon et lucarnes, toit en dalles épaisses avec avant-toit, faîtage et rives, cheminée à chapeau avec fumée, lanterne murale. En feu : suie sur l'enduit, un pan de toit ouvert sur des chevrons calcinés avec flammes, feu derrière une fenêtre, volet pendant. Trois variantes.
- Ancrage au sol : les décors sont posés au niveau du sol (`ARENA_GROUND_Y = -0,16`, le plateau étant surélevé), avec une ombre de contact par accessoire et des touffes d'herbe au pied des murs, chacune cuite en un seul maillage (un appel de dessin). Testé par `CombatArena.test.ts` : chaque accessoire au sol, hors plateau, budget d'appels tenu.
- Graphismes réduits : pas de bande, pas de fouillis, pas de fumée, 2 lumières au plus.
- Budget de rendu : le décor statique (ni billboard, ni animé par sommets, ni effet en shader) est fusionné en une géométrie par matériau à la construction. Cela fait environ 300 appels de dessin par image, passe d'ombre comprise (rapport COMBAT-HD2D-1).

## Unités pixel

- Contrat v1 : `src/render/generated/combatPixelSprites.json` (densité, cellule, ancre au pied, cellules nommées, séquences en ms). Feuilles dans `public/assets/characters/pixel/combat-sprites/`.
- Produites par `tools/pixel-sprites/build_combat_sprites.py` depuis les poses du Character System V2 : réduction par zones, alpha binaire, palette commune de 40 couleurs, contour d'encre, image de respiration. Héros d'environ 88 px, élites et boss à environ 2× la hauteur du héros, mais à la même taille de pixel. Petites créatures relevées à 1,15 m pour rester lisibles. Les unités qui n'ont qu'un master (héros archivés, troll, champion mort-vivant) ont idle + respiration.
- Le matériau garde la sémantique de `MeshBasicMaterial` : `color` pour les teintes de retour, `opacity` pour l'atténuation. Il ajoute un échantillonnage « sharp bilinear », une teinte d'arène et un flash blanc d'impact. La découpe se fait sur l'alpha du texel : une unité atténuée reste translucide.
- Les masters restent l'autorité des dialogues et de la mise en scène narrative. Les feuilles de combat en dérivent.

## Caméra et projecteur

- `shotFor()` : `tactical` (vue de base), `action`, `aoe`, `spotlight`, `impact`, `field` (plan d'ensemble de la finale des ultimes). Le lacet est borné à ±0,24 rad pour que le diorama couvre toujours l'arrière-plan.
- Chaque action : poussée de 0,32 s, puis retour à la vue tactique après résolution.
- Ultime (`presentation.ultimate`) ou signature de boss (tier 6) :
  1. Ouverture du projecteur : la lumière baisse, les autres unités reculent (opacité 0,24), bandes noires et titre, vignette 1,9, plan bas et serré.
  2. La recette d'effet joue d'abord sa **charge** pendant que l'unité tient sa pose de sort.
  3. Le coup tombe à l'impact de la recette, avec ralenti, coup de caméra rapproché et lumière.
  4. La caméra recule sur le plan `field` et la vague de l'ultime traverse tout le terrain ; le projecteur se referme quand elle est passée.
- Le tremblement reste dans l'écran (passe `ImpactShake`). Les changements de tour ne bougent pas la caméra.

## Effets et sons

### Poids visuel selon le coût en PA

Règle : plus une compétence coûte de PA, plus elle se voit ; les ultimes couvrent tout le terrain (`fxIntensity.ts`).

| Poids | Coût | Ce qui change |
| --- | --- | --- |
| léger | 0-1 PA (attaque de base sans élan) | effets à 0,86× |
| standard | 2 PA | recette telle quelle |
| fort | 3 PA | 1,16×, + onde au sol et gerbe à l'impact |
| lourd | 4 PA | 1,32×, + seconde onde, colonne de lumière, arrêt sur image court, son `impact_heavy` |
| majeur | 5 PA | 1,45×, + troisième onde large, flash, particules |
| ultime | ultime ou signature de boss | 1,5× et **finale plein terrain** |

- Le temps d'une recette ne change jamais (l'impact de gameplay reste au même instant). Tailles, rayons, nombres de particules, lumière et tremblement suivent le poids. La charge avant l'impact grandit moins (racine du facteur), pour ne pas masquer l'acteur.
- L'attaque de base compte son niveau d'élan (Attaque = 1, Attaque+ = 2, Attaque++ = 3), pas le surcoût des attaques répétées.
- Finale plein terrain (`FxDirector.fieldFinale`) : un cercle de runes sous toute la plateforme, un flash, puis, quand la caméra s'éloigne, trois ondes qui dépassent les bords, des particules sur tout le terrain et une vague d'éruptions case par case qui part de l'impact (flammes pour le feu, piliers pour le sacré, éclairs, éclats, orbes du vide, entailles selon l'élément). Une recette peut imposer son éruption (`fieldBeat`) : pluie de flèches pour la Flèche du Zénith, explosions pour le Barrage d'Artillerie, entailles pour l'Assassinat Silencieux et la Dualité Parfaite.
- Caméra : coup d'impact rapproché, puis plan `field` (plus large que la vue tactique). Les unités atténuées réapparaissent pour la vague. Le projecteur reste ouvert jusqu'à la fin de la vague (3 s au plus).
- Lisibilité : les effets debout (étoiles, entailles, flammes, piliers, étincelles) se dessinent au-dessus des sprites d'unité et légèrement vers la caméra. Les traces au sol restent sous les pieds. Les entailles traversent la cible, avec une lame sombre dessous pour se détacher de tout fond.
- Sceaux : les cercles de runes sont des anneaux concentriques, une bande de glyphes, un anneau en tirets et des perles, **sans étoile ni polygone** (identité non voulue). Seuls les ultimes et signatures de boss **pulsent** : deux éclats par battement (0,62 s), chacun envoyant un anneau de lumière depuis le bord du sceau ; le grand sceau de la finale pulse aussi.
- Précision : les couleurs des effets sont posées en bandes nettes (pas de dégradé aérographe) ; les cases exactement touchées par une action de zone s'allument (contour et biseau par case), et un coup unique lourd marque la case de sa cible ; les éruptions posées par case (flammes, éclats) gardent la largeur d'une case et ne grandissent qu'en hauteur avec les PA.

- `resolveFxRecipe(presetId, tags)` : recettes explicites pour chaque preset connu (12 ultimes, presets `pilot_*`, signatures de boss, armes de base), sinon une famille choisie par les tags (élément + forme). Tous les presets de `VfxPresets.ts` résolvent (testé).
- L'impact de gameplay (`impactTime`) tombe après le vol du projectile éventuel. Les recettes d'ultime sont `cinematic`.
- Primitives (`FxEngine`) : particules carrées, entailles, étoiles d'impact, anneaux, cercles de runes pixel, piliers, traînées, projectiles, éclairs, éclats, dômes, orbes, flammes, fumée, traces au sol, lumière (pool de 3 lumières fixes, donc pas de recompilation), planches générées (`sheet`, ignorées tant qu'elles manquent).
- Temps FX : `G.timeScale` (ralenti) agit sur les tweens, les animations pixel et les effets. Les `wait()` restent en temps réel.
- Sons : `combatSfx.play(id)` pour chaque repère des recettes (testé). Contexte audio créé au premier geste. `?son=0` le coupe. Le réglage « Effets sonores » est mémorisé (`localStorage`, avec garde).
- Les spritesheets CartoonCoffee (locales, hors dépôt) ne servent plus que de repli quand aucun preset ne résout. Le VFX Lab les utilise toujours.

## QA

- `npm run dev`, puis `/legacy-combat.html?qa=1&stageqa=1&scene=<biome>`. Les boutons QA jouent : attaque, ultimes (Lion, Météore, Miracle, Éclipse), pluie de flèches, vague de flammes, multi-cibles, soin de groupe.
- Galerie FX : `node tools/combat-arena/fx-gallery.mjs <biome> <dossier> "sword_slash@1,sword_slash@5,ultimate_dark_meteor@ult"` joue chaque preset au poids donné, horloge FX figée puis avancée à l'instant voulu (`preset@poids@décalageMs@rayonDeZone`). Aides DEV : `__qaHelpers.fxPreview`, `fxFreeze`, `fxAdvance`, `spotlightState`. `?dtcap=0.5` garde le temps de présentation sur l'horloge réelle en rendu logiciel.
- `tools/combat-arena/shots.sh <dossier>` : les trois arènes. `action-shots.mjs` : images d'une action dans le temps. `campaign-harness.mjs <combatId>` : démarrage réel via le protocole de la campagne. `probe.mjs` : évaluation d'expressions dans la page.
- Art généré en local : [mission locale](LOCAL_ART_MISSION.md).

## Assets devenus inutilisés (UNKNOWN_REVIEW, rien n'est supprimé)

`public/assets/combat-stage/poses/` (43 Mo, anciennes planches 4×1 du Stage), les fonds `combatStageScenes` de `assetManifest.ts` et `src/render/combatBackgrounds.ts` (le combat n'utilise plus `BackgroundLayerSystem`). Leur retrait demande une revue des dépendances et l'accord de l'opérateur (règle d'ingénierie 8).

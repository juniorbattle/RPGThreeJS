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
- Graphismes réduits : pas de bande, pas de fouillis, pas de fumée, 2 lumières au plus.
- Budget de rendu : le décor statique (ni billboard, ni animé par sommets, ni effet en shader) est fusionné en une géométrie par matériau à la construction. Cela fait environ 300 appels de dessin par image, passe d'ombre comprise (rapport COMBAT-HD2D-1).

## Unités pixel

- Contrat v1 : `src/render/generated/combatPixelSprites.json` (densité, cellule, ancre au pied, cellules nommées, séquences en ms). Feuilles dans `public/assets/characters/pixel/combat-sprites/`.
- Produites par `tools/pixel-sprites/build_combat_sprites.py` depuis les poses du Character System V2 : réduction par zones, alpha binaire, palette commune de 40 couleurs, contour d'encre, image de respiration. Héros d'environ 88 px, élites et boss à environ 2× la hauteur du héros, mais à la même taille de pixel. Petites créatures relevées à 1,15 m pour rester lisibles. Les unités qui n'ont qu'un master (héros archivés, troll, champion mort-vivant) ont idle + respiration.
- Le matériau garde la sémantique de `MeshBasicMaterial` : `color` pour les teintes de retour, `opacity` pour l'atténuation. Il ajoute un échantillonnage « sharp bilinear », une teinte d'arène et un flash blanc d'impact. La découpe se fait sur l'alpha du texel : une unité atténuée reste translucide.
- Les masters restent l'autorité des dialogues et de la mise en scène narrative. Les feuilles de combat en dérivent.

## Caméra et projecteur

- `shotFor()` : `tactical` (vue de base), `action`, `aoe`, `spotlight`, `impact`. Le lacet est borné à ±0,24 rad pour que le diorama couvre toujours l'arrière-plan.
- Chaque action : poussée de 0,32 s, puis retour à la vue tactique après résolution.
- Ultime (`presentation.ultimate`) ou signature de boss (tier 6) :
  1. Ouverture du projecteur : la lumière baisse, les autres unités reculent (opacité 0,24), bandes noires et titre, vignette 1,9, plan bas et serré.
  2. La recette d'effet joue d'abord sa **charge** pendant que l'unité tient sa pose de sort.
  3. Le coup tombe à l'impact de la recette, avec ralenti, coup de caméra et lumière.
- Le tremblement reste dans l'écran (passe `ImpactShake`). Les changements de tour ne bougent pas la caméra.

## Effets et sons

- `resolveFxRecipe(presetId, tags)` : recettes explicites pour chaque preset connu (12 ultimes, presets `pilot_*`, signatures de boss, armes de base), sinon une famille choisie par les tags (élément + forme). Tous les presets de `VfxPresets.ts` résolvent (testé).
- L'impact de gameplay (`impactTime`) tombe après le vol du projectile éventuel. Les recettes d'ultime sont `cinematic`.
- Primitives (`FxEngine`) : particules carrées, entailles, étoiles d'impact, anneaux, cercles de runes pixel, piliers, traînées, projectiles, éclairs, éclats, dômes, orbes, flammes, fumée, traces au sol, lumière (pool de 3 lumières fixes, donc pas de recompilation), planches générées (`sheet`, ignorées tant qu'elles manquent).
- Temps FX : `G.timeScale` (ralenti) agit sur les tweens, les animations pixel et les effets. Les `wait()` restent en temps réel.
- Sons : `combatSfx.play(id)` pour chaque repère des recettes (testé). Contexte audio créé au premier geste. `?son=0` le coupe. Le réglage « Effets sonores » est mémorisé (`localStorage`, avec garde).
- Les spritesheets CartoonCoffee (locales, hors dépôt) ne servent plus que de repli quand aucun preset ne résout. Le VFX Lab les utilise toujours.

## QA

- `npm run dev`, puis `/legacy-combat.html?qa=1&stageqa=1&scene=<biome>`. Les boutons QA jouent : attaque, ultimes (Lion, Météore, Miracle, Éclipse), pluie de flèches, vague de flammes, multi-cibles, soin de groupe.
- `tools/combat-arena/shots.sh <dossier>` : les trois arènes. `action-shots.mjs` : images d'une action dans le temps. `campaign-harness.mjs <combatId>` : démarrage réel via le protocole de la campagne. `probe.mjs` : évaluation d'expressions dans la page.
- Art généré en local : [mission locale](LOCAL_ART_MISSION.md).

## Assets devenus inutilisés (UNKNOWN_REVIEW, rien n'est supprimé)

`public/assets/combat-stage/poses/` (43 Mo, anciennes planches 4×1 du Stage), les fonds `combatStageScenes` de `assetManifest.ts` et `src/render/combatBackgrounds.ts` (le combat n'utilise plus `BackgroundLayerSystem`). Leur retrait demande une revue des dépendances et l'accord de l'opérateur (règle d'ingénierie 8).

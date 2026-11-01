# Combat HD-2D — contrat de présentation

Baseline : branche `claude/combat-scenes-pixel-art-1v60j4`, partie de `main @ 00b96f1`, portée sur `dev` par OD-2026-10-29-A : effets procéduraux seuls en combat, sons du contrat conservés. Ce document décrit la **présentation** du combat canonique (`/legacy-combat.html`, initialisé par `CombatBridge`). Les règles de combat, l'IA, le protocole `postMessage` et la sauvegarde ne changent pas.

Labels : CURRENT FACT, sauf mention contraire.

## Vue d'ensemble

| Couche | Source | Rôle |
| --- | --- | --- |
| Arène | `src/combat/arena/` | Diorama procédural par biome. Plateforme 8×4 en dalles dont les joints forment la grille, sol pixel, architecture 3D, végétation en billboards pixel-art, feu et fumée pixel en shaders, lumières, plan lointain peint. |
| Unités | `src/combat/pixel/`, `tools/pixel-sprites/` | Feuilles pixel-art à densité unique (40 px/m), animations idle / move / windup / attack / cast / hurt / ko par-dessus le mouvement codé existant. |
| Caméra | `src/combat/camera/CombatCameraDirector.ts` | Vue tactique, poussée courte sur chaque action, plan large pour les zones, **projecteur** pour les ultimes et signatures de boss. |
| Effets | `src/combat/fx/` | Effets procéduraux style Octopath : recettes déclaratives par preset VFX, lumière dynamique, ralenti, speed lines, coup de caméra. |
| Sons | `src/combat/audio/CombatSfx.ts` | Synthèse WebAudio (aucun fichier). **Non branchée** depuis OD-2026-10-29-A : le combat garde les repères sonores du contrat (`combatCue`). Elle attend l'amendement set 1.11.0, comme l'ambiance par biome. |

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
- Le matériau garde la sémantique de `MeshBasicMaterial` : `color` pour les teintes de retour, `opacity` pour l'atténuation. Il ajoute un échantillonnage « sharp bilinear », une teinte d'arène et un flash blanc d'impact. La découpe se fait sur l'alpha du texel.
- Atténuation lisible (`pixelFocusResponse`) : une opacité basse assombrit et désature le sprite au lieu de le rendre transparent. Une unité atténuée par le focus (0,42) reste couverte à environ 86 %, à environ 67 % de luminosité. La transparence pure la fondait dans un sol de même teinte : brigands verts sur l'herbe de la route forestière, invisibles en mode ciblage. Un fondu vers 0 (K.O., téléportation) reste complet.
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

### Signatures des compétences

Chaque compétence de héros et chaque compétence ennemie utilisée a sa recette écrite à la main (`fxSkills.ts`), jouée telle quelle : ni mise à l'échelle par PA, ni accents d'impact communs, ni finale commune. Une classe possède une couleur et une forme :

| Classe | Couleur | Forme |
| --- | --- | --- |
| Guerrier | or et acier | griffes larges, poussière, ruée au sol |
| Paladin | or blanc sacré | lumière verticale qui tombe, dômes nets |
| Chevalier noir | violet et sang | tout est aspiré vers l'intérieur, puis la vie revient au lanceur |
| Lancier | azur | lignes fines et droites qui transpercent |
| Mage noir | ombre et feu | éclairs, flammes, météore |
| Mage blanc | vert doux | lumière lente qui monte, ni tremblement ni ralenti |
| Mage rouge | écarlate et blanc | deux éléments qui se croisent |
| Enchanteur | violet arcanique | runes en orbite, liens entre alliés |
| Archer | menthe | flèches en aiguille, plumes |
| Ninja | venin et noir | entailles fines et rapides, fumée, presque pas de lumière |
| Voleur | ambre et acier | coups courts, pièges, fissures au sol |
| Artilleur | feu et fumée | flammes de bouche, obus, débris |

Règles, testées dans `fxSkills.test.ts` :

- deux compétences ne partagent jamais la même silhouette ;
- un sceau appartient aux sorts, et il s'éteint sur le coup ;
- une onde au sol apparaît une seule fois, sur le coup : rien de circulaire ne part après l'impact ;
- un sceau ne génère jamais d'anneau de lui-même : chaque anneau est une étape de sa recette ;
- un ultime sur une seule cible reste en gros plan (`punch` avec `hold`), les autres reculent au plan `field`.

Les déplacements (téléportations, bonds, charges, échanges) ont leur propre départ et leur propre arrivée (`skillMoveFxRecipe`).

Sur un grand corps, les recettes s'adaptent (`FxDirector`, vérifié sur les vrais boss) :

- ce qui entoure un corps (dôme, sceau, anneau, éclats, spirale, fumée, flammes) et ce qu'il lance grandit avec sa taille, à partir de 2,4 unités, la hauteur du plus grand héros ;
- un coup (entaille, étoile, orbe, gerbe) et une fissure gardent leur taille écrite, et les particules leur taille de pixel ;
- un souffle part de la gueule (ancre `sourceMouth`) et `reach` règle sa vitesse pour atteindre la cible à toute distance.

Côté ennemis :

- les 20 compétences portées par des unités ont leur signature ; les signatures de boss sont `cinematic`, avec une charge ;
- le Rugissement est la seule exception à l'onde unique : trois ondes de voix partent **avant** le coup ;
- les attaques de base sans arme (morsures, griffes, crochets, langue, charge, pierres, lames jetées, souffles, sceau) sont choisies par le nom de l'arme (`enemyAttackFxRecipe`) ; les autres gardent la recette de leur arme ;
- Provocation, Cri de Guerre et Voile de Fumée ne sont portés par aucune unité : ils gardent une recette partagée.

### Poids visuel selon le coût en PA

Cette échelle ne concerne que les recettes partagées : attaques de base avec arme, objets, et le repli d'une compétence sans signature (`fxIntensity.ts`).

| Poids | Coût | Ce qui change |
| --- | --- | --- |
| léger | 0-1 PA (attaque de base sans élan) | effets à 0,86× |
| standard | 2 PA | recette telle quelle |
| fort | 3 PA | 1,16×, + une onde au sol et une gerbe à l'impact |
| lourd | 4 PA | 1,32×, onde plus large, colonne de lumière, arrêt sur image court, son `impact_heavy` |
| majeur | 5 PA | 1,45×, onde large, flash, particules |
| ultime sans signature | repli | 1,5× et **finale sur les cases touchées** |

- Le temps d'une recette ne change jamais (l'impact de gameplay reste au même instant). Tailles, rayons, nombres de particules, lumière et tremblement suivent le poids. La charge avant l'impact grandit moins (racine du facteur), pour ne pas masquer l'acteur.
- L'attaque de base compte son niveau d'élan (Attaque = 1, Attaque+ = 2, Attaque++ = 3), pas le surcoût des attaques répétées.
- Finale de repli (`FxDirector.fieldFinale`), pour un ultime sans signature : un flash, puis, quand la caméra s'éloigne, une vague d'éruptions case par case qui part de l'impact, seulement sur les cases touchées, sans aucun anneau. Une action à cible unique n'en a pas. Aucune compétence actuelle ne l'utilise.
- Caméra : coup d'impact rapproché, puis plan `field` (plus large que la vue tactique), sauf `hold`. Les unités atténuées réapparaissent à ce moment. Le projecteur reste ouvert jusqu'à la fin de l'effet (3 s au plus).
- Lisibilité : les effets debout (étoiles, entailles, flammes, piliers, étincelles) se dessinent au-dessus des sprites d'unité et légèrement vers la caméra. Les traces au sol restent sous les pieds. Les entailles traversent la cible, avec une lame sombre dessous pour se détacher de tout fond.
- Sceaux : réservés aux **compétences magiques** (une recette est magique si elle trace un sceau ; testé). Les compétences martiales et les attaques de base n'en ont jamais. Le motif : anneaux concentriques, bande de glyphes, anneau en tirets et perles, **sans étoile ni polygone** (identité non voulue).
- Pulsation : plus aucune recette de compétence ne pulse. Un sceau pulsé (repli) s'éclaire sans émettre d'anneau et s'arrête sur le coup.
- Feu (décors et compétences) : pixel art à la densité des unités (40 px/m), silhouette de flamme animée par un bruit déformé qui monte, crête qui se détache en mèches, base arrondie ; cinq bandes rouge-orangé à blanc chaud, **sans contour sombre** (le feu émet de la lumière), tramage d'un texel aux transitions ; halo chaud additif derrière chaque flamme qui éclaire les alentours ; braises montantes. Fumée en pixel art (24 px/m).
- Précision : les couleurs des effets sont posées en bandes nettes (pas de dégradé aérographe) ; les cases exactement touchées par une action de zone s'allument (contour et biseau par case), et un coup unique lourd marque la case de sa cible ; les éruptions posées par case (flammes, éclats) gardent la largeur d'une case et ne grandissent qu'en hauteur avec les PA.

- `resolveFxRecipe(presetId, tags)` : recettes explicites pour chaque preset connu (12 ultimes, presets `pilot_*`, signatures de boss, armes de base), sinon une famille choisie par les tags (élément + forme). Tous les presets de `VfxPresets.ts` résolvent (testé).
- L'impact de gameplay (`impactTime`) tombe après le vol du projectile éventuel. Les recettes d'ultime sont `cinematic`.
- Primitives (`FxEngine`) : particules carrées, particules aspirées (`converge`), orbites (`orbit`), entailles, étoiles d'impact, anneaux (y compris vers l'intérieur), cercles de runes pixel, piliers, traînées, projectiles, volées (`rain`), éclairs, éclats, dômes, orbes, flammes, fumée, fissures (`fissure`), traces au sol, lumière (pool de 3 lumières fixes, donc pas de recompilation), planches générées (`sheet`, ignorées tant qu'elles manquent).
- Temps FX : `G.timeScale` (ralenti) agit sur les tweens, les animations pixel et les effets. Les `wait()` restent en temps réel.
- Sons : `combatSfx.play(id)` pour chaque repère des recettes (testé). Contexte audio créé au premier geste. `?son=0` le coupe. Le réglage « Effets sonores » est mémorisé (`localStorage`, avec garde).
- Les spritesheets CartoonCoffee (locales, hors dépôt) ne servent plus que de repli quand aucun preset ne résout. Le VFX Lab les utilise toujours.

## QA

- `npm run dev`, puis `/legacy-combat.html?qa=1&stageqa=1&scene=<biome>`. Les boutons QA jouent : attaque, les 12 ultimes, pluie de flèches, vague de flammes, multi-cibles, soin de groupe. Une compétence dont la classe n'est pas déployée part du premier héros.
- Galerie FX : `node tools/combat-arena/fx-gallery.mjs <biome> <dossier> "sword_slash@1,sword_slash@5,ultimate_dark_meteor@ult"` joue chaque preset au poids donné, horloge FX figée puis avancée à l'instant voulu (`preset@poids@décalageMs@rayonDeZone`). Aides DEV : `__qaHelpers.fxPreview`, `fxSkill`, `stagePlay`, `fxFreeze`, `fxAdvance`, `spotlightState`.
- Galerie des compétences : `node tools/combat-arena/skill-gallery.mjs <sortie.jpg> "w_whirl,n_flame_wave" "-200,50,300"` (horloge FX figée, vue tactique) et `node tools/combat-arena/skill-play.mjs <sortie.jpg> "w_lion_surge" 12` (action réelle, caméra comprise, images lues sur le canvas). Pour un vrai grand ennemi, les deux prennent en dernier argument `"boss=lion_chief:lion_champion"` ou `"foes=young_dragon_elite"`, après la scène ; dans `skill-play.mjs`, le préfixe `foe:` joue son action depuis sa vraie place.
- `?dtcap=0.5` garde le temps de présentation sur l'horloge réelle en rendu logiciel.
- `tools/combat-arena/shots.sh <dossier>` : les trois arènes. `action-shots.mjs` : images d'une action dans le temps. `campaign-harness.mjs <combatId>` : démarrage réel via le protocole de la campagne. `probe.mjs` : évaluation d'expressions dans la page.
- Art généré en local : [mission locale](LOCAL_ART_MISSION.md).

## Assets devenus inutilisés (UNKNOWN_REVIEW, rien n'est supprimé)

`public/assets/combat-stage/poses/` (43 Mo, anciennes planches 4×1 du Stage), les fonds `combatStageScenes` de `assetManifest.ts` et `src/render/combatBackgrounds.ts` (le combat n'utilise plus `BackgroundLayerSystem`). Leur retrait demande une revue des dépendances et l'accord de l'opérateur (règle d'ingénierie 8).

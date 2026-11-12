# Arènes de combat du Dragon

| Champ | Valeur |
| --- | --- |
| TASK | DRAGON-ARENAS-2026-11-12 |
| DOMAIN | Combat (présentation : arènes codées), plateau du Dragon |
| BASELINE | `69123576` sur `dev` (intégration des images finales du Dragon) ; jeu de contrats 1.22.0, baseline immuable `5a61d319e449e8328fe63449516b554da96f43b7` |
| BRANCH | `claude/dragon-arenas` (créée depuis `origin/dev`), publiée sur `origin/dev` |
| HEAD | `2174b4bb` (code et tests), puis le commit qui porte ce rapport ; `origin/dev` n’avait pas bougé depuis `69123576`, la fusion d’`origin/dev` est vide |
| STATUS | merged |
| MERGED_IN | `origin/dev` (poussée normale, OD-2026-10-12-A) |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Les 25 combats du Dragon jouent dans quatre arènes codées qui lui sont propres au lieu des arènes du Lion : trois sous le signe du Dragon, une sous celui du Loup. Présentation seule : grille, plateforme (`ARENA_PLATFORM`), résolution, récompenses et sauvegardes inchangées ; aucun identifiant de scène n’est sauvegardé. Les arènes du Lion et de l’Ours sont identiques à l’octet ; le Scorpion et l’acte final gardent les arènes du Lion. Aucun son nouveau. |
| CANONICAL_DOCS_UPDATED | NONE : la session principale consigne le résultat dans l’état autonome et les décisions. Aucun contrat, aucun canon, aucun champ de sauvegarde. |
| EVIDENCE | Tests ci-dessous ; laboratoire QA en navigateur (Playwright, 1600 × 900, port 5175). Captures dans `tmp/dragon-arenas/` (dossier ignoré, non promu). |

## 1. Ce qui manquait

Les combats du Dragon empruntaient les arènes du Lion (`dragonCombat.ts` : `PEAKS = 'forest_route'`, `LAIR = 'lion_sanctum'`, de même pour les POI facultatifs et les deux gardiens de `dragonTopology.ts`). Le repaire du Loup, les cimes et plusieurs POI montraient donc les bannières au lion, la stèle au soleil et les arches gothiques du sanctuaire, et le reste la forêt verte du Lion.

## 2. Les quatre arènes

Toutes codées (OD-2026-11-01-C : aucune image générée, aucune plaque), avec les systèmes existants et l’identité validée du Dragon (`IDENTITY.dragon`, lue seulement) : calcaire pâle, mer de nuages et aiguilles rocheuses, neige poudreuse en altitude, herbe rase jaunie et pins tordus par le vent plus bas, bronze vert-de-gris et jade, cloches et braseros de bronze, dragons sculptés toujours ailés et quadrupèdes. Ni lion, ni soleil, ni rouge-et-or, ni arche gothique, ni forêt verte ; ni granit sombre ni mine étayée de l’Ours.

| Arène | Lieu | Combats |
| --- | --- | --- |
| `dragon_peak_trail` | Sentier des terrasses (régions I et II) : dalles de calcaire à l’herbe jaunie dans les joints, murets de pierre sèche, pins tordus, blocs de calcaire, cairns des pèlerins, une stèle au dragon ailé, bannières de jade du Dragon, fines plaques de neige, aiguilles au loin et bancs de nuages à l’horizon | `dragon_wolf_patrol`, `dragon_wolf_scouts`, `dragon_crest_creatures`, `dragon_corrupted_wyrm`, les POI `dragon_poi_foothill_wolves_a/b`, `dragon_poi_foothill_beasts_a/b`, `dragon_poi_terrace_ravine_a/b`, `dragon_poi_terrace_raiders_a/b`, le gardien `dragon_guardian_champion` |
| `dragon_snowy_summit` | Cimes enneigées au couchant (région III, montée vers l’autel) : neige poudreuse, aiguilles coiffées de neige, cloches de bronze sur leurs poteaux, deux braseros de bronze, la stèle au dragon ailé, pins tordus enneigés, bannières du Dragon | `dragon_shadow_touched`, `dragon_shadow_shaman` (sa scène `dragon_shaman_pre_combat` montre une crête enneigée au couchant, cloches et pierres gravées), les POI `dragon_poi_peak_hunters_a/b`, `dragon_poi_peak_watch_a/b`, le gardien `dragon_guardian_wyrm` |
| `dragon_wolf_cave` | Repaire du Loup : caverne brute de calcaire sombre, stalagmites, rideaux de peaux sur leurs perches, pieux taillés avec un crâne de bête, tas d’os, peaux de loup au sol, braseros de fer, caisses, bannières du Loup (tête de loup grondante, os sur noir de suie, ourlet déchiré) ; aucune sculpture de dragon, aucune cloche | `dragon_lair_assault`, `dragon_lair_seizure` |
| `dragon_hall_esplanade` | Esplanade devant la salle de Kaelen : façade taillée dans la falaise, deux piliers au dragon ailé en relief avec bandes de bronze et cloches sur potence, porte profonde où pend la bannière du clan, linteau à gradins (pas d’arche), marches, dragons ailés sur piédestaux, braseros de bronze, balustrades au-dessus des nuages, pins tordus, dalles de calcaire à l’herbe sèche | `dragon_kaelen` (son tableau `dragon_kaelen_pre_combat` le place sur cette esplanade, l’après-combat aussi) |

Le Cristal n’est pas peint dans le repaire : l’arène sert aux deux issues et la présentation ne doit pas montrer un état.

Correspondances sonores sans aucun son nouveau (OD-2026-11-01-B) : chaque arène reprend l’ambiance de l’arène du Lion qu’elle remplace. Le sentier et l’esplanade jouent celle de `forest_route` (ancien `PEAKS`), les cimes et le repaire celle de `lion_sanctum` (ancien `LAIR`), via `ArenaTheme.sound` lu par `ambienceForScene` et `combatAmbienceForScene`. Un seul combat change d’ambiance en changeant de lieu : `dragon_corrupted_wyrm`, qui se tient sur les terrasses (région II) et jouait le sanctuaire, joue désormais la route forestière. Le laboratoire d’écoute l’indique dans ses libellés.

## 3. Ce qui a été ajouté

- `src/combat/arena/arenaThemes.ts` : quatre thèmes, une palette des Pics, quatre styles de dalles (`limestone_flag`, `snowy_limestone`, `dressed_limestone`, `cave_flag`), un sol (`dry_grass_snow`), quinze genres de décor, les signes `dragon` et `wolf`, une frange d’herbe, et deux champs facultatifs dont l’absence reproduit l’existant (`rock` : granit par défaut, calcaire pour le Dragon ; `horizon: 'clouds'`). `DRAGON_ARENA_IDS`.
- `arenaTextures.ts` : le dragon passant ailé sur quatre pattes (grille 26 × 34 du lion et de l’ours), la tête de loup, leurs bannières (jade et vert-de-gris ; suie et os), le relief de calcaire à incrustation vert-de-gris, le calcaire, le bronze vert-de-gris, les peaux, la fourrure de loup.
- `arenaProps.ts` : aiguilles rocheuses, murets de terrasse, cairns, cloches de bronze, braseros de bronze, stèles, dragons sur piédestaux, balustrades, façade de la salle de Kaelen ; stalagmites, rideaux de peaux, pieux, os, peaux de loup.
- `arenaSprites.ts` : pin tordu (neige sur les coussinets en altitude), bancs de nuages, dragon sculpté. `arenaFarPlates.ts` : mer de nuages et aiguilles (jour, couchant), fond de caverne.
- `CombatArena.ts` : horizon de nuages, frange d’herbe, plans lointains codés du Dragon.
- `legacyCombatRuntime.js` : particules des quatre arènes ; `combatBackgrounds.ts` : aucune ne retombe sur le fond peint du Lion.
- `dragonCombat.ts` et `dragonTopology.ts` : chaque combat dans son arène.

À savoir pour la suite : le validateur de cohérence narrative (`src/game/narrativeCoherence.ts`) lit tout accès `flags.<nom>` dans `src/` comme un fait du récit. Un tableau de dalles nommé `flags` dans une texture l’a fait échouer avant d’être renommé `slabs`.

## 4. Vérifications

| Vérification | Résultat |
| --- | --- |
| Portail des documents verrouillés | vide |
| `npm run -s contracts:validate` | 8 contrats, zéro vidéo active |
| `npx tsc --noEmit` | OK |
| `npx vitest run --exclude ".claude/**"` | 3 242 tests passent ; 10 échouent dans 4 fichiers (`spritesheetPng`, trois tests de cinématiques historiques), qui lisent des médias ignorés par Git absents d’un worktree neuf : les mêmes que pour l’Ours, sans lien avec cette tâche |
| `node --test tools/qa/qa-job.test.mjs` | 26/26 |
| `npm run -s build` | OK |
| `git diff --check` | OK |
| Tests d’arène | les dix arènes : décors hors de la plateforme, budget de draw calls, aucune face coplanaire visible depuis les caméras du combat, bannières devant leur mât, texels nets, graphismes réduits ; identité du Dragon (aucun décor du Lion ou de l’Ours, calcaire, jamais rouge-et-or, un dragon sculpté dans chaque arène du Dragon) et du Loup (aucune sculpture ni cloche du Dragon) ; le signe du Dragon a des ailes et quatre pattes ; horizon de nuages sur les Pics, de roche dans la caverne |
| Test des combats du Dragon | les 25 combats du Dragon jouent dans une arène du Dragon, chacun où il se tient ; Ours, Scorpion et acte final gardent leurs arènes ; l’état initial ne contient aucun identifiant de scène |
| Lion et Ours inchangés | comparaison temporaire (non commitée) avant et après : graphe de scène, géométries, matériaux et pixels de chaque texture identiques pour les six arènes, en graphismes complets et réduits |

En navigateur (laboratoire QA, `/?qa=1`, 1600 × 900, Chromium SwiftShader), zéro erreur de page ou de console :

- `tmp/dragon-arenas/combat-dragon_wolf_patrol.png` : sentier des terrasses ;
- `tmp/dragon-arenas/combat-dragon_shadow_shaman.png` : cimes enneigées au couchant ;
- `tmp/dragon-arenas/combat-dragon_lair_assault.png` : repaire du Loup ;
- `tmp/dragon-arenas/combat-dragon_kaelen.png` : esplanade de Kaelen ;
- `tmp/dragon-arenas/combat-lion_chief.png` : sanctuaire du Lion, inchangé (bannières au lion, stèle au soleil, arches) ;
- `tmp/dragon-arenas/combat-dragon_guardian_champion-reduced.png` : le sentier avec `prefers-reduced-motion: reduce` émulé ; l’arène reste complète, le réglage « mouvement réduit » étant interne au jeu et désactivé par défaut ;
- les vues de déploiement correspondantes (`*-deploy.png`).

Non vérifié : le rendu sur le PC de l’opérateur (GPU réel, pas SwiftShader), le réglage « mouvement réduit » du jeu activé en navigateur (graphismes réduits testés en unitaire seulement), les autres combats du Dragon en navigateur (couverts par le test d’affectation), et le mobile. La lecture artistique reste à l’opérateur ; les arènes se règlent dans les données de thème.

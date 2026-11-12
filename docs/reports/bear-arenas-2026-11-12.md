# Arènes de combat de l’Ours

| Champ | Valeur |
| --- | --- |
| TASK | BEAR-ARENAS-2026-11-12 |
| DOMAIN | Combat (présentation : arènes codées), plateau de l’Ours |
| BASELINE | `2712bff2` sur `dev` (intégration des images finales de l’Ours) ; jeu de contrats 1.22.0, baseline immuable `5a61d319e449e8328fe63449516b554da96f43b7` |
| BRANCH | `claude/bear-arenas-045c51` (créée depuis `dev`), publiée sur `origin/dev` |
| HEAD | `7d5e590a` (code et tests), puis le commit qui porte ce rapport |
| STATUS | merged |
| MERGED_IN | `origin/dev` (poussée normale, OD-2026-10-12-A) |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Les 23 combats de l’Ours jouent dans trois arènes codées qui lui sont propres au lieu des arènes du Lion. Présentation seule : grille, plateforme (`ARENA_PLATFORM`), résolution, récompenses et sauvegardes inchangées ; aucun identifiant de scène n’est sauvegardé. Les arènes du Lion, du Dragon, du Scorpion et de l’acte final sont inchangées. Aucun son nouveau. |
| CANONICAL_DOCS_UPDATED | NONE : la session principale consigne le résultat dans l’état autonome et les décisions. Aucun contrat, aucun canon, aucun champ de sauvegarde. |
| EVIDENCE | Tests ci-dessous ; laboratoire QA en navigateur (Playwright, 1600 × 900, port 5175). Captures dans `tmp/bear-arenas/` (dossier ignoré, non promu). |

## 1. Ce qui manquait

Les combats de l’Ours empruntaient les arènes du Lion (`bearCombat.ts` : `MOUNTAIN = 'forest_route'`, `GALLERIES = 'lion_sanctum'`, de même pour les POI facultatifs et les deux gardiens de `bearTopology.ts`). Les galeries montraient donc les bannières au lion, la stèle au soleil et les arches gothiques du sanctuaire, et le col la forêt verte du Lion. Les deux plans lointains peints existants montrent eux aussi une bannière au lion, des cascades et un château gothique : ils ne pouvaient pas servir.

## 2. Les trois arènes

Toutes codées (OD-2026-11-01-C : aucune image générée, aucune plaque), avec les systèmes existants (thèmes, dalles, sols, décors, lumières, brouillard, brume, particules) et l’identité validée pour les images finales de l’Ours : granit, neige poussée par le vent, gris d’ardoise, bois et fer, ambre seulement là où brûle un feu, bâti massif taillé dans la roche, le signe de l’ours (`heraldryFor` : *a bear; never a lion*).

| Arène | Lieu | Combats |
| --- | --- | --- |
| `bear_mountain_pass` | Col enneigé : affleurements de granit, rochers coiffés de neige, congères, sapins enneigés épars, herbe sèche, bannières de l’Ours en bornes du clan, dalles de granit taillé à la neige tassée dans les joints | `bear_pass_beasts`, `bear_raven_scouts`, `bear_raven_patrol`, les POI `bear_poi_pass_patrol_a/b`, `bear_poi_pass_beasts_a/b`, `bear_poi_mine_gully_a/b`, `bear_poi_mine_ravens_a/b`, le gardien `bear_guardian_foreman` |
| `bear_mine_galleries` | Galeries sacrées : salle étayée, cadres de bois et bouches de galeries, treuil au-dessus d’un puits, rails, wagonnets de minerai, tas de minerai, piliers à l’ours sculpté, braseros et lanternes, bannières de l’Ours, plan lointain de paroi rocheuse sans ciel | `bear_corrupted_beast`, `bear_mines_defense`, `bear_mines_seizure`, `bear_gallery_guardians`, `bear_master_spy`, les POI `bear_poi_depths_hunters_a/b`, `bear_poi_depths_watch_a/b`, le gardien `bear_guardian_depths` |
| `bear_hall_terrace` | Parvis de la salle de Borin : façade taillée dans la montagne, lourdes portes de bois cerclées de fer, ours sculptés de part et d’autre, marches, piliers coiffés de neige, braseros, bannières, rambardes de bois, dalles de granit balayées vers les bords | `bear_borin` (son tableau `bear_borin_pre_combat` le place sur ce parvis, l’après-combat aussi) |

Correspondances inchangées pour le son, sans aucun son nouveau (OD-2026-11-01-B) : le col joue l’ambiance et le mappage de `forest_route`, les galeries et le parvis ceux de `lion_sanctum` (`ArenaTheme.sound`, lu par `ambienceForScene` et par `combatAmbienceForScene`, ce dernier pour le module de sons de combat non câblé). Le laboratoire d’écoute l’indique dans ses libellés.

## 3. Ce qui a été ajouté

- `src/combat/arena/arenaThemes.ts` : trois thèmes, deux styles de dalles (`hewn_granite`, `snowy_granite`), trois sols (`snow_scree`, `mine_floor`, `snow_terrace`), onze genres de décor, et des champs facultatifs dont les valeurs par défaut reproduisent le Lion (`emblem`, `snow`, `interior`, `fringe`, `apron`, `farPlate.procedural`, `clutter.gap`), plus `sound` sur chaque thème.
- `arenaTextures.ts` : l’ours dressé de l’Ours sur la grille 26 × 34 du lion (bannière ardoise et os, bande anguleuse, ourlet à trois pointes ; relief de pierre sans or ni lueur), granit, neige, minerai, dalles de granit taillé, sols, parvis dallé.
- `arenaProps.ts` : rochers enneigés, congères, falaises, poutres, cadres de mine, wagonnets, rails, tas de minerai, treuil, piliers à l’ours, porte de la salle ; la neige se pose sur les faces tournées vers le ciel ; sapins enneigés.
- `arenaSprites.ts` : touffes de neige, gravats, lignes de crêtes ; `arenaFarPlates.ts` : plans lointains peints en code (pics enneigés, paroi des galeries).
- `CombatArena.ts` : parvis dallé, frange neige, herbe sèche ou gravats, horizon de crêtes, plan lointain codé.
- `legacyCombatRuntime.js` : particules des trois arènes (neige qui tombe et que le vent emporte, poussière éclairée par les torches).
- `combatBackgrounds.ts` (module sans consommateur) : les arènes de l’Ours déclarent n’avoir aucun fond peint au lieu de retomber sur les ruines forestières du Lion.
- `src/game/content.ts` ne déclare que les combats du Lion : rien à changer.

## 4. Vérifications

| Vérification | Résultat |
| --- | --- |
| Portail des documents verrouillés | vide |
| `npm run -s contracts:validate` | 8 contrats, zéro vidéo active |
| `npx tsc --noEmit` | OK |
| `npx vitest run` | 3 210 tests passent ; 10 échouent dans 4 fichiers (`spritesheetPng`, trois tests de cinématiques historiques), qui lisent des médias ignorés par Git absents d’un worktree neuf (présents dans le checkout principal) : sans lien avec cette tâche |
| `node --test tools/qa/qa-job.test.mjs` | 26/26 lancé seul (un échec quand il tournait en même temps que vitest et le build, non reproduit seul) |
| `npm run -s build` | OK |
| `git diff --check` | OK |
| Tests d’arène | les six arènes : décors au sol hors de la plateforme, budget de draw calls, aucune face coplanaire visible depuis les caméras du combat, bannières devant leur mât, texels nets ; identité de l’Ours (aucun décor propre au Lion, bannière ardoise et os, relief gris) ; graphismes réduits |
| Test des combats de l’Ours | les 23 combats de l’Ours jouent dans une arène de l’Ours, Borin sur le parvis ; Dragon, Scorpion et acte final gardent leurs arènes ; l’état initial ne contient aucun identifiant de scène |
| Lion inchangé | comparaison temporaire (non commitée) entre `HEAD` et cette version : graphe de scène, géométries et pixels de chaque texture identiques pour `forest_route`, `bois_clair_burning` et `lion_sanctum` |

En navigateur (laboratoire QA, `/?qa=1`, 1600 × 900, Chromium SwiftShader), zéro erreur de page ou de console :

- `tmp/bear-arenas/combat-bear_raven_scouts.png` : col enneigé ;
- `tmp/bear-arenas/combat-bear_mines_defense.png` et `combat-bear_guardian_depths.png` : galeries ;
- `tmp/bear-arenas/combat-bear_borin.png` : parvis de la salle de Borin ;
- `tmp/bear-arenas/combat-lion_chief.png` et `combat-forest_patrol.png` : arènes du Lion, inchangées ;
- les vues de déploiement correspondantes (`*-deploy.png`).

Non vérifié : le rendu sur le PC de l’opérateur (GPU réel, pas SwiftShader), le réglage « mouvement réduit » du jeu en navigateur (testé en unitaire seulement), et le mobile. La lecture artistique reste à l’opérateur.

# Arènes de combat du Scorpion

| Champ | Valeur |
| --- | --- |
| TASK | SCORPION-ARENAS-2026-11-12 |
| DOMAIN | Combat (présentation : arènes codées), plateau du Scorpion |
| BASELINE | `2e617c0f` sur `dev` (identité et mise en scène du Scorpion validées) ; `origin/dev` fusionné en cours de tâche à `80db77f1` (intégration des images finales du Scorpion, aucun fichier commun) ; jeu de contrats 1.22.0, baseline immuable `5a61d319e449e8328fe63449516b554da96f43b7` |
| BRANCH | `claude/wizardly-golick-53b32b` (avancée sur `origin/dev`), publiée sur `origin/dev` |
| HEAD | `19ea7224` (code et tests), puis le commit qui porte ce rapport |
| STATUS | merged |
| MERGED_IN | `origin/dev` (poussée normale, OD-2026-10-12-A) |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Les 23 combats du Scorpion jouent dans six arènes codées qui lui sont propres au lieu des arènes du Lion : deux sous le signe du Scorpion, trois sous celui du Phénix, une crête sauvage marquée seulement par l’encre des Ombres. Présentation seule : grille, plateforme (`ARENA_PLATFORM`), résolution, récompenses et sauvegardes inchangées ; aucun identifiant de scène n’est sauvegardé. Les arènes du Lion, de l’Ours et du Dragon sont identiques à l’octet ; l’acte final garde les arènes du Lion. Aucun son nouveau. |
| CANONICAL_DOCS_UPDATED | NONE : la session principale consigne le résultat dans l’état autonome et les décisions. Aucun contrat, aucun canon, aucun champ de sauvegarde. |
| EVIDENCE | Tests ci-dessous ; laboratoire QA en navigateur (Playwright, 1600 × 900, port 5175). Captures dans `tmp/scorpion-arenas/` (dossier ignoré, non promu), copiées hors du worktree dans le dossier de notes partagé de la session parente (`scorpion-arenas-captures/`). |

## 1. Ce qui manquait

Les combats du Scorpion empruntaient les arènes du Lion (`scorpionCombat.ts` : `DUNES = 'forest_route'`, `TEMPLE = 'lion_sanctum'`, de même pour les POI facultatifs et les deux gardiens de `scorpionTopology.ts`). Le temple du Phénix, les ruines et le sanctuaire montraient donc les bannières au lion, la stèle au soleil et les arches gothiques du sanctuaire, et les dunes la forêt verte du Lion.

## 2. Les six arènes

Toutes codées (OD-2026-11-01-C : aucune image générée, aucune plaque), sur l’identité validée du Scorpion (`IDENTITY.scorpion`, lue seulement) et les lignes de mise en scène des scènes qui précèdent chaque combat. Pays plat et brûlé, sable miel et ambre, grès rouge-brun, arbres épineux ; le Scorpion bâtit en terre crue enduite d’ocre, avec des claustras de bois et du lin rayé ; le Phénix en grès taillé couleur de cendre, colonnes rondes et niches sculptées de phénix, lampes allumées en plein jour, cercles de garde, flamme safran au cœur blanc. **Un lieu du Phénix ne montre aucun scorpion, un lieu du Scorpion aucun phénix** (la leçon de la caverne du Loup). Ni lion, ni soleil, ni rouge-et-or, ni arche gothique, ni forêt verte ; ni granit, neige ou mine de l’Ours ; ni calcaire, nuages, bronze vert-de-gris, cloches ou pins du Dragon ; jamais de violet.

| Arène | Lieu | Combats |
| --- | --- | --- |
| `scorpion_dune_track` | Piste des dunes (région I) : dunes de sable ridé, mesas et blocs de grès rouge, arbres épineux, broussailles, un abri de lin rayé des érudits avec ses jarres, deux bannières du Scorpion (scorpion de lin sur brun d’ombre) | `scorpion_dune_beasts`, `scorpion_phoenix_scouts`, les POI `scorpion_poi_dune_serpents_a/b`, `scorpion_poi_dune_spiders_a/b` |
| `scorpion_phoenix_ruins` | Route des ruines du Phénix (région II, ligne `scorpion_warded_path`) : dalles usées noyées de sable, murs de grès cendré écroulés, colonnes rondes debout ou brisées et tambours couchés, un cercle de garde safran en travers de la route, pierres levées au phénix portant leur lampe allumée ; pas de bannière | `scorpion_temple_sentinels`, `scorpion_flamekeeper` (le gardien barre le passage avant le temple), les POI `scorpion_poi_ruin_sentinels_a/b`, `scorpion_poi_ruin_serpents_a/b`, le gardien `scorpion_guardian_flamekeeper` |
| `scorpion_phoenix_temple` | Nef du temple du Phénix (ligne `scorpion_phoenix_temple`) : foyer rond où brûle la grande flamme safran au cœur blanc dans son cercle de garde, colonnes rondes sculptées de phénix, tentures safran au phénix, murs à niches dont les lampes brûlent ; nef close | `scorpion_temple_assault`, `scorpion_temple_seizure` |
| `scorpion_ash_sanctuary` | Sanctuaire des cendres sacrées creusé dans la roche rouge (ligne `scorpion_sacred_ashes`) : grand bassin de cendre grise où rougeoient les braises, phénix sculpté dans la paroi, niches noircies aux lampes froides, taches d’encre noire des Ombres ; pas de bannière | `scorpion_lost_faithful`, le POI `scorpion_poi_sanctum_guards_a/b`, le gardien `scorpion_guardian_zealot` |
| `scorpion_dune_crest` | Crête des dunes au crépuscule (ligne `scorpion_prophet_pre_combat`, « Il s’est enfui dans les dunes ») : dunes profondes, soleil cuivré bas, traînée d’encre noire et froide, feuillets épars dont deux s’envolent ; sauvage, aucun signe de clan, aucune bannière | `scorpion_shadow_prophet`, le POI « Veille des sables » `scorpion_poi_sanctum_watch_a/b` |
| `scorpion_records_court` | Cour de la maison des registres du Grand Inquisiteur (ligne `scorpion_inquisitor_pre_combat`) : dalles cuites au soleil, arcades ombragées de terre crue à claustras, poutres saillantes et épis de cuivre en queue de scorpion, bassin sec, haute porte de la salle des registres sous le scorpion sculpté, une seule bannière du Scorpion au-dessus | `scorpion_inquisitor` |

Le codex n’est pas posé dans la nef : l’arène sert aux deux issues et la présentation ne montre pas un état (comme le Cristal dans le repaire du Loup).

Correspondances sonores sans aucun son nouveau (OD-2026-11-01-B) : chaque arène reprend l’ambiance de l’arène du Lion qu’occupaient la plupart de ses combats. La piste, les ruines et la cour jouent celle de `forest_route` ; le temple, le sanctuaire et la crête celle de `lion_sanctum` (`ArenaTheme.sound`, lu par `ambienceForScene` et `combatAmbienceForScene`). Trois combats changent d’ambiance en changeant de lieu : `scorpion_flamekeeper` (ruines, ancien sanctuaire) passe à la route forestière, `scorpion_inquisitor` (cour) reste à la route forestière, `scorpion_poi_sanctum_watch` (crête) reste au sanctuaire. Le laboratoire d’écoute l’indique dans ses libellés.

## 3. Ce qui a été ajouté

- `src/combat/arena/arenaThemes.ts` : six thèmes, deux palettes (désert, grès cendré du Phénix), deux styles de dalles (`sand_flag`, `dressed_sandstone`), un sol (`desert_sand`), dix-neuf genres de décor, les signes `scorpion` et `phoenix`, une frange `sand`, et trois champs facultatifs dont l’absence reproduit l’existant (`rock: 'sandstone'`, `horizon: 'dunes' | 'none'`, `unlitLamps`). `SCORPION_ARENA_IDS`.
- `arenaTextures.ts` : le scorpion vu de dessus et le phénix aux ailes déployées sur ses flammes (grille 26 × 34 partagée), leurs bannières (lin sur brun d’ombre ; safran et cendre, ourlet en langues de flamme), les reliefs (phénix dans le grès cendré au pigment safran usé, noirci au sanctuaire ; scorpion en terre ocre teinté de cuivre), le grès rouge, le sable, la terre crue, les claustras, le lin rayé, les jarres, les cercles de garde, l’encre des Ombres, les feuillets, la cendre et ses braises, les niches.
- `arenaProps.ts` : dunes, abri des érudits, jarres, arcades et porte des registres, bassin sec, épis de cuivre ; colonnes et tambours du Phénix, murs en ruine, pierres levées et lampes à huile, cercles de garde, foyer de la flamme, murs à niches, bassin de cendre, paroi au phénix ; taches d’encre, feuillets. La flamme safran est une option de `createFireMaterial` : la flamme par défaut garde exactement son shader (test).
- `arenaSprites.ts` : arbre épineux, broussaille, touffe sèche sans fleur, congère de sable, lignes de dunes. `arenaFarPlates.ts` : désert de jour, au crépuscule et avec les ruines (mesas plates, dunes en croissants, brume de chaleur), fond de la nef, fond du sanctuaire, ciel et mur de la cour.
- `CombatArena.ts` : horizon de dunes ou aucun horizon, frange de sable, plans lointains codés du Scorpion.
- `legacyCombatRuntime.js` : particules des six arènes ; `combatBackgrounds.ts` : aucune ne retombe sur le fond peint du Lion.
- `scorpionCombat.ts` et `scorpionTopology.ts` : chaque combat dans son arène.

À savoir pour la suite :
- les touffes d’herbe du Lion (`drawGrass`) peuvent porter une fleur lilas : le désert, qui n’a jamais de violet, utilise ses propres touffes ;
- le cadre de la caméra tactique coupe le plan lointain vers la moitié de sa hauteur ; l’horizon du désert y est donc peint bas, et les ombres des dunes suivent une arête oblique : une séparation verticale ombre/lumière se lit comme des blocs.

## 4. Vérifications

| Vérification | Résultat |
| --- | --- |
| Portail des documents verrouillés | vide |
| `npm run -s contracts:validate` | 8 contrats, zéro vidéo active |
| `npx tsc --noEmit` | OK |
| `npx vitest run` | 3 301 tests passent ; 10 échouent dans 4 fichiers (`spritesheetPng`, trois tests de cinématiques historiques), qui lisent des médias ignorés par Git absents d’un worktree neuf : les mêmes que pour l’Ours et le Dragon, sans lien avec cette tâche |
| `node --test tools/qa/qa-job.test.mjs` (seul) | 26/26 |
| `npm run -s build` | OK |
| `git diff --check` | OK |
| Tests d’arène | les seize arènes : décors hors de la plateforme, budget de draw calls, aucune face coplanaire visible depuis les caméras du combat, bannières devant leur mât (sauf les trois arènes sans bannière de la mise en scène), texels nets, graphismes réduits ; identité du Scorpion et du Phénix (aucun décor du Lion, de l’Ours, du Dragon ou du Loup, grès rouge, jamais de violet dans les couleurs du thème ni dans aucun texel peint, signes du Phénix seulement dans ses lieux, du Scorpion seulement dans les siens, aucun sur la crête, vérifiés sur les données et sur l’arène construite) ; signes, bannières, reliefs, cercles de garde, encre et flamme safran |
| Test des combats du Scorpion (`scorpionCombat.test.ts`) | les 23 combats du Scorpion jouent dans une arène du Scorpion, chacun où il se tient ; l’Ours et le Dragon gardent les leurs, l’acte final ceux du Lion ; l’état initial ne contient aucun identifiant de scène |
| Lion, Ours et Dragon inchangés | comparaison temporaire avec `2e617c0f` (graphe de scène, géométries, matériaux, pixels de chaque texture, données de thème ; graphismes complets et réduits) : identique, contrôlée deux fois ; puis un test permanent, `arenaUnchanged.test.ts`, qui fige l’empreinte de ces dix arènes |

En navigateur (laboratoire QA, `/?qa=1`, 1600 × 900, Chromium SwiftShader), zéro erreur de page ou de console :

- `combat-scorpion_dune_beasts.png` : piste des dunes ;
- `combat-scorpion_temple_sentinels.png` : ruines du Phénix ;
- `combat-scorpion_temple_assault.png` : nef du temple ;
- `combat-scorpion_lost_faithful.png` : sanctuaire des cendres ;
- `combat-scorpion_shadow_prophet.png` : crête des dunes au crépuscule ;
- `combat-scorpion_inquisitor.png` : cour de la maison des registres ;
- `combat-lion_chief.png` : sanctuaire du Lion, inchangé (bannières au lion, stèle au soleil, arches) ;
- `combat-scorpion_temple_assault-reduced.png` : la nef avec `prefers-reduced-motion: reduce` émulé ; l’arène reste complète, le réglage « mouvement réduit » étant interne au jeu et désactivé par défaut ;
- les vues de déploiement correspondantes (`*-deploy.png`).

Non vérifié : le rendu sur le PC de l’opérateur (GPU réel, pas SwiftShader), le réglage « mouvement réduit » du jeu activé en navigateur (graphismes réduits testés en unitaire seulement), les autres combats du Scorpion en navigateur (couverts par le test d’affectation), et le mobile. Dans la cour, le bandeau de tour du combat masque le haut de la bannière tant qu’il est affiché. La lecture artistique reste à l’opérateur ; les arènes se règlent dans les données de thème.

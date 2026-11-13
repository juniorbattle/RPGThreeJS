# Arènes de combat de l’acte final

| Champ | Valeur |
| --- | --- |
| TASK | FINALE-ARENAS-2026-11-13 |
| DOMAIN | Combat (présentation : arènes codées), acte final |
| BASELINE | `c9f67e9c` sur `dev` (intégration des images finales de l’acte final) ; jeu de contrats 1.22.0, baseline immuable `5a61d319e449e8328fe63449516b554da96f43b7` |
| BRANCH | `claude/finale-arenas` (créée depuis `dev`), fusionnée dans `dev` et publiée sur `origin/dev` |
| HEAD | le commit qui porte ce rapport (code, tests et rapport ensemble) |
| STATUS | merged |
| MERGED_IN | `origin/dev` (poussée normale, OD-2026-10-12-A) |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Les douze combats de l’acte final (huit du récit, deux variantes facultatives, le gardien des remparts, le dernier combat de la fin « La Crainte ») jouent dans sept arènes codées qui lui sont propres, au lieu des arènes du Lion. Présentation seule : grille, plateforme (`ARENA_PLATFORM`), résolution, récompenses et sauvegardes inchangées ; aucun identifiant de scène n’est sauvegardé. Les arènes du Lion, de l’Ours, du Dragon et du Scorpion sont identiques à l’octet (test permanent). Aucun son nouveau. |
| CANONICAL_DOCS_UPDATED | `docs/autonomy/IMAGES_RECRUITMENT_ARCHER_OPERATOR_DECISION_2026-11-11.md` (section « Arènes de l’acte final ») ; `docs/autonomy/AUTONOMOUS_WORK_STATE.md` et `.json` (prochaine action). Aucun contrat, aucun canon, aucun champ de sauvegarde. |
| EVIDENCE | Tests ci-dessous ; laboratoire QA en navigateur (`preview_start`, port 5174, 1600 × 900). Captures dans `tmp/finale-arenas/` (dossier ignoré, non promu), copiées hors du worktree dans le dossier de notes partagé de la session parente (`finale-arenas-captures/`). |

## 1. Ce qui manquait

Les combats de l’acte final empruntaient les arènes du Lion : `finaleCombat.ts` (`ARENA = 'lion_sanctum'`, `CAPITAL = 'forest_route'`), le POI « Maisons effondrées » et le gardien des remparts de `finaleTopology.ts`, le dernier combat de `finaleEpilogues.ts`. L’Arène des Destins montrait donc le sanctuaire nocturne du Lion, avec ses arches gothiques, sa stèle au soleil et ses bannières au lion, et la capitale montrait la forêt verte du Lion. Ce sont des motifs que l’identité validée de l’acte final interdit.

## 2. Les sept arènes

Toutes codées (OD-2026-11-01-C : aucune image générée, aucune plaque), sur l’identité validée de l’acte final (`docs/content/drafts/FINALE_STAGING_DRAFT_2026-11-12.md`, « Identité de l’acte final ») et sur les lignes de mise en scène des scènes qui encadrent chaque combat. Les images intégrées n’ont servi que de références de palette et de motifs.

L’acte final est la seule ville du jeu : brique rouge sombre à rouille, chaînages et cordons de pierre grise pâle, toits d’ardoise bleu-noir, fenêtres et portes en plein cintre, volets de bois sombre, balcons et lanternes de fer forgé, rues pavées. Rien des plateaux : ni arc gothique, colombage, forêt ou lanterne de bois du Lion ; ni granit, neige ou mine de l’Ours ; ni calcaire, nuages, bronze, cloches ou pins du Dragon ; ni dune, terre crue, claustra ou phénix sculpté du Scorpion. Jamais de violet. La bannière de la compagnie n’apparaît nulle part : son emblème reste une décision ouverte de l’opérateur.

| Arène | Lieu | Combats |
| --- | --- | --- |
| `finale_destiny_arena` | L’Arène des Destins le jour du Tournoi, sous un voile égal de nuages gris-blanc et une lumière froide et argentée. La piste de sable pâle ratissé. Un muret de pierre pâle avec deux grandes portes en plein cintre à herse. Des gradins de pierre pleins d’une foule lointaine, encapuchonnée, sans visage (OD-2026-11-11-G) et jamais sur le sable. Une galerie d’arcades de brique sur piliers de pierre pâle. La tribune d’honneur sous son auvent rayé de lin écru et de gris ardoise. Huit mâts en une rangée le long du muret, un par clan, chacun aux couleurs et au seul signe de son clan, dans l’ordre de l’image de référence : lion, ours, dragon, scorpion, corbeau, loup, phénix, serpent. | `finale_raven_bout`, `finale_wolf_bout`, `finale_phoenix_bout`, `finale_serpent_final` |
| `finale_arena_breach` | La même arène la nuit de la trahison. Les gradins sont vides, noircis de suie, et brûlent. Une bannière sur deux brûle à son ourlet, la tribune d’honneur brûle sans son auvent, des débris brûlent sur le sable. La brèche se dresse au milieu du sable : une haute déchirure d’encre noire au mince liseré blanc et froid, dont l’encre gagne le sable vers le combat. | `finale_arena_assault` |
| `finale_burning_streets` | Les rues de la capitale qui descendent de l’arène, la nuit où elle brûle. Hautes maisons étroites de brique de trois ou quatre étages, dont plusieurs en feu, une effondrée dans la rue. Lanternes de fer encore allumées, charrette abandonnée, fumée, braises. Au loin, la ville basse et la brèche au-dessus de ses toits. | `finale_burning_streets`, `finale_poi_ruins_a/b` (« Maisons effondrées ») |
| `finale_smoke_square` | La grande place, le lendemain matin sous la fumée. Maisons noircies tout autour, dont une encore en feu et une effondrée. Lanternes éteintes, gravats, poutres calcinées. Une rue quitte la place au fond, vers la brèche. | `finale_demon_square` |
| `finale_rampart_reserve` | Le pied des remparts, près de la réserve, le même jour. Courtine de la même brique avec archères et créneaux couronnés de pierre. Une tour ronde au sommet plat crénelé, jamais de toit conique. L’escalier de pierre qui monte au chemin de ronde. Les tonneaux, caisses et la charrette de la réserve. | `finale_guardian_ramparts` |
| `finale_breach_heart` | Le cœur de la brèche dans la ville basse, avant l’aube. Cratère de pavés éclatés et de dalles soulevées, cerné de maisons effondrées aux murs déchiquetés. La brèche se dresse au fond et son liseré blanc est la lumière principale de la scène (lumière froide). Son encre coule sur les pavés vers le combat. Une maison encore debout garde sa lanterne allumée. Les feux brûlent encore au loin, et l’arène se voit sur sa colline au loin. Pas de bannière. | `finale_breach` (Maelor puis l’entité) |
| `finale_breach_scar` | Le même cratère au crépuscule, une fois la brèche refermée. Plus rien dans l’air : seulement de longues cicatrices d’encre séchée, d’un gris terne et craquelé, et une fumée qui s’amincit. Ni feu ni bannière. | `finale_last_stand` (fin « La Crainte », première réponse) |

### Pourquoi ce découpage

- **Le Tournoi et l’assaut ont chacun leur arène.** Les quatre manches se jouent de jour, devant la foule et sous les huit bannières, sans brèche. L’assaut vient après la trahison : arène vide en feu, brèche sur le sable. Une arène commune aurait contredit l’une des deux mises en scène (`finale_arrival`, verdicts, `finale_arena_assault_aftermath`).
- **La capitale en a trois.** Les rues brûlent la nuit même (`finale_capital_arrival`). La grande place et le gardien viennent après le ralliement, le lendemain matin sous la fumée (`finale_allied_rally` ouvre ces deux nœuds). « Maisons effondrées » est un lieu de ces mêmes rues : il prend leur arène, où une maison s’est effondrée. Le gardien garde la « Réserve des remparts » : il se bat au pied de la courtine, que l’identité décrit en brique avec des tours rondes.
- **La brèche en a deux.** Maelor attend « au cœur de la brèche », avant l’aube, brèche ouverte (`finale_breach_confrontation`). Le dernier combat de la Crainte suit les épilogues, qui commencent tous par « La brèche se referme ». Sa scène, `finale_fear_close`, montre le cratère vide au crépuscule et sert aux deux réponses, dont ce combat. Le jouer sous une brèche ouverte aurait contredit le récit.

### Ambiances empruntées, aucun son nouveau (OD-2026-11-01-B)

Chaque arène emprunte l’un des trois lits existants (`ArenaTheme.sound`, lu par `ambienceForScene` et `combatAmbienceForScene`). Le choix suit ce que le lieu fait entendre, et non plus l’arène du Lion remplacée :

| Arène | Lit emprunté | Avant |
| --- | --- | --- |
| Arène des Destins (jour) | `forest_route` (vent, plein air, oiseaux lointains) : le seul lit de jour sans grillons ni cloche nocturne | `lion_sanctum` |
| Arène en flammes, rues, grande place, remparts | `bois_clair_burning` (grondement des feux, crépitements, effondrement lointain) : la capitale brûle | `lion_sanctum` ou `forest_route` |
| Cœur de la brèche, brèche refermée | `lion_sanctum` (vent de nuit, cloche lointaine), comme avant | `lion_sanctum` |

Le laboratoire d’écoute l’indique dans ses libellés.

## 3. Ce qui a été ajouté

- **`src/combat/arena/arenaThemes.ts`.**
  - Sept thèmes, deux palettes (arène et capitale) et trois styles de dalles (`raked_sand`, `cobbles`, `shattered_paving`) avec leurs trois sols.
  - Douze genres de décor, les signes `raven` et `serpent`, un tablier `cobbles` et un champ facultatif `crowd`.
  - `ArenaProp.emblem` : la bannière d’un mât aux couleurs de son propre clan.
  - `CLAN_BANNER_COLOURS` : les couleurs des huit clans, celles du Lion, de l’Ours, du Dragon, du Loup, du Scorpion et du Phénix reprises de leurs arènes.
  - `ARENA_CLAN_ORDER` et `FINALE_ARENA_IDS`.
- **`arenaTextures.ts`.**
  - Le corbeau dressé de profil et le serpent lové trois fois sur lui-même, sans pattes ni ailes, sur la grille commune 26 × 34, avec leurs bannières : acier pâle sur bleu acier sombre ; bronze terni sur vert profond.
  - Les bannières des autres clans brûlent comme celle du lion (seulement si on le demande ; aucune arène existante ne le demande).
  - La brique avec suie à volonté, le sable ratissé, les pavés intacts ou éclatés avec l’encre dans leurs joints.
  - Les fenêtres et portes en plein cintre, le garde-corps de fer, la herse, les gradins pleins ou vides, la brèche, l’encre séchée, les gravats, l’auvent rayé.
- **`arenaProps.ts`.**
  - Maison de brique : soubassement de pierre, chaînages, cordons, fenêtres, porte, balcon de fer, pignon et toit d’ardoise raide, cheminée. En feu : toit percé, fenêtres embrasées, fumée.
  - Maison effondrée, tas de gravats, dalles soulevées, lanterne de fer (allumée la nuit, éteinte le jour).
  - Pan de gradins (muret, gradins, galerie d’arcades, porte à herse ou tribune d’honneur), en feu à volonté.
  - Mât de clan, courtine, tour ronde, escalier de rempart, brèche (plan non éclairé avec un halo froid et une lumière blanche froide), cicatrice d’encre.
  - `banner()` prend un clan et un mât plus haut. Sans eux, il reste identique.
- **`arenaFarPlates.ts`** : l’autre côté de l’arène, de jour ou de nuit ; la ville vue de ses rues, la nuit ou sous la fumée, avec la brèche au-dessus de la ville basse ; le ciel des remparts ; la ville basse autour de la brèche, avant l’aube ou au crépuscule.
- **`CombatArena.ts`** : distribution des plans lointains, tablier pavé, gradins pleins.
- **`legacyCombatRuntime.js`** : particules des sept arènes. **`combatBackgrounds.ts`** : aucune ne retombe sur le fond peint du Lion.
- **`finaleCombat.ts`, `finaleTopology.ts`, `finaleEpilogues.ts`** : chaque combat dans son arène. **`ambience.ts`, `AudioListeningLab.ts`** : commentaires et libellés.

À savoir pour la suite :

- Deux pans de gradins se chevauchent là où ils se rencontrent. Chaque variante monte donc de quelques centimètres pour que leurs couronnements ne partagent jamais un plan (test de coplanarité).
- Le cadre de la caméra tactique ne montre les décors du fond que jusqu’à environ 6 m de haut. Les maisons et la galerie de l’arène y sont coupées en haut, comme une rue vue d’en haut.
- Sous la lumière basse du crépuscule, la cicatrice d’encre séchée reste discrète sur la terre sombre. Elle se règle dans `driedInkTexture` et les données du thème.

## 4. Vérifications

| Vérification | Résultat |
| --- | --- |
| Portail des documents verrouillés | vide |
| `npm run -s contracts:validate` | 8 contrats, zéro vidéo active |
| `npm run -s narrative:validate` | ok, aucune erreur |
| `npx tsc --noEmit` | OK |
| `npx vitest run` | 3 359 tests passent. 10 échouent dans 4 fichiers (`spritesheetPng` et trois tests de cinématiques historiques) : ils lisent des médias ignorés par Git, absents d’un worktree neuf (ENOENT). Ce sont les mêmes que pour l’Ours, le Dragon et le Scorpion, sans lien avec cette tâche. Un test de cette tâche (seuil de l’encre séchée, éclaircie après la vérification en navigateur) a été corrigé puis repassé. |
| `node --test tools/qa/qa-job.test.mjs` (seul) | 26/26 |
| `npm run -s build` | OK |
| `git diff --check` | OK |
| Tests d’arène | Les 23 arènes : décors hors de la plateforme, budget de draw calls, aucune face coplanaire visible depuis les caméras du combat, bannières devant leur mât (les arènes sans bannière de la mise en scène exceptées), texels nets, graphismes réduits. Identité de l’acte final : aucun décor des plateaux ; brique rouge, ardoise bleu-noir, pierre grise ; jamais de violet, ni dans les couleurs du thème ni dans aucun texel peint ; huit bannières, chaque signe une fois et le lion une seule fois, seulement dans l’Arène des Destins ; seul le Lion en rouge et or ; aucun relief sculpté ; brèche seulement où elle est ouverte ; aucune ligne d’horizon de plateau. Signes, bannières brûlées, brique, foule sans teinte de peau, brèche, encre séchée. |
| Placement des combats (`finaleArenas.test.ts`) | Chaque combat de l’acte final, récit, facultatif, gardien ou fin, joue dans son arène, jamais dans celles du Lion ; les plateaux gardent les leurs ; l’état initial ne contient aucun identifiant de scène. `dragonCombat.test.ts` et `scorpionCombat.test.ts` vérifient désormais que l’acte final a ses propres arènes. |
| Lion, Ours, Dragon et Scorpion inchangés | `arenaUnchanged.test.ts` fige maintenant aussi les six arènes du Scorpion. Leurs empreintes sont relevées sur `dev` (`c9f67e9c`) avant toute modification, et les seize arènes restent identiques (graphe de scène, géométries, matériaux, pixels de chaque texture, données de thème ; graphismes complets et réduits). |

En navigateur (laboratoire QA, `/?qa=1`, 1600 × 900, serveur `preview_start` sur le port 5174), un combat par arène, zéro erreur de page ou de console :

- `combat-finale_raven_bout.jpg` : Arène des Destins, le jour du Tournoi (première capture refaite après avoir agrandi et resserré la foule, qui se lisait comme des rangées d’objets) ;
- `combat-finale_arena_assault.jpg` : l’arène en flammes et la brèche ;
- `combat-finale_burning_streets.jpg` : les rues en flammes ;
- `combat-finale_demon_square.jpg` : la grande place sous la fumée ;
- `combat-finale_guardian_ramparts.jpg` : les remparts et la réserve ;
- `combat-finale_breach.jpg` : le cœur de la brèche ;
- `combat-finale_last_stand.jpg` : le cratère refermé au crépuscule.

**Non vérifié :**

- le rendu sur le PC de l’opérateur (vrai GPU), le réglage « mouvement réduit » du jeu activé en navigateur (graphismes réduits testés en unitaire seulement), le mobile ;
- les autres combats de l’acte final en navigateur, couverts par le test d’affectation ;
- le second temps du combat de la brèche (l’entité) dans l’arène : c’est la même arène.

La lecture artistique reste à l’opérateur : densité de la foule, teinte des rues de nuit, visibilité de la cicatrice d’encre. Les arènes se règlent dans les données de thème.

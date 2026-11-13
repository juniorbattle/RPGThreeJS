# Tableaux vivants de l’après-démo

| Champ | Valeur |
| --- | --- |
| TASK | PLATEAU-MOMENTS-2026-11-13 |
| DOMAIN | Présentation (tableaux vivants), contenu (orateurs des rencontres avec le chef), audio (table des humeurs) |
| BASELINE | `c9f67e9c` sur `dev` (images finales de l’acte final intégrées) ; jeu de contrats 1.22.0, baseline immuable `5a61d319e449e8328fe63449516b554da96f43b7` |
| BRANCH | `claude/plateau-moments` (créée depuis `origin/dev`), fusionnée dans `dev` et publiée sur `origin/dev` à chaque étape |
| HEAD | le commit qui porte ce rapport (scripts, tests et rapport ensemble) |
| STATUS | merged |
| MERGED_IN | `origin/dev` (poussée normale, OD-2026-10-12-A) |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Treize tableaux vivants jouent dans le jeu : l’arrivée et les deux issues de l’Ours, du Dragon et du Scorpion, la trahison au Tournoi et les trois épilogues. Chacun joue à la première ouverture en direct de son moment, jamais après une reprise ou un rechargement, et va droit au dialogue si son image manque. Les dialogues qui les suivent ou les précèdent gardent leur lumière, leur feu et leur temps (fonds animés). Les dialogues de ces moments prennent une humeur musicale existante. Dans chaque plateau, le héros du plateau prend quatre répliques d’Alistair aux rencontres avec le chef (texte inchangé). Aucun champ de sauvegarde, aucune vérité de jeu, aucun son nouveau, aucune image nouvelle. |
| CANONICAL_DOCS_UPDATED | `docs/content/drafts/PLATEAU_MOMENTS_DRAFT_2026-11-13.md` (VALIDÉ, maquette jugée, rotation des héros). Les fichiers d’état et de décisions (`docs/autonomy/**`) restent à la session parente. Aucun contrat. |
| EVIDENCE | Tests ci-dessous ; laboratoire QA en navigateur (Playwright sans tête, serveur de développement sur le port 5176, 1600 × 900). Captures dans `tmp/plateau-moments/` (ignoré, non promu), copiées dans le dossier de notes partagé de la session parente (`plateau-moments-captures/`). |

## 1. Les décisions

- **Le cadre.** Set 1.20.0, « Post-demo moments » (OD-2026-11-07-I), avec les règles des tableaux vivants des sets 1.13.0 et 1.14.0.
- **La proposition.** `PLATEAU_MOMENTS_DRAFT_2026-11-13.md`, validée telle quelle par l’opérateur le 2026-11-13 :
  - les tables des trois plateaux ;
  - la trahison et les épilogues tenus au contrat : une séquence ne montre jamais ce que son dialogue dit en premier ;
  - les clés d’humeur ;
  - les tableaux basculés avec le code ;
  - une maquette d’abord.
- **La maquette.** L’arrivée chez Borin, jugée en mouvement le même jour : « Elle convainc ».
- **La rotation des héros**, ajoutée par l’opérateur le même jour : à chaque plateau, un héros du clan accompagne les conseillers aux rencontres avec le chef, comme Alistair au Lion.
  - Ours : Marian. Dragon : Elara. Scorpion : Kestrel.
  - Acte final : toute la compagnie.
  - Le héros prend la première réplique de l’arrivée, celle d’Alistair à l’audience, « Nous l’assumerons » avant l’épreuve et la première réplique de la veillée. Le texte ne change pas, et Alistair garde les décisions de la route.

## 2. Ce qui joue

| Moment | Avant | Tableau | Ce que montre la séquence |
| --- | --- | --- | --- |
| Arrivée chez Borin | `bear_audience` | salle de Borin | la salle vide au feu ; Borin devant son siège ; Marian, Séraphine et Maelor entrent ; guerriers lointains |
| Ours, honneur | `bear_epilogue`, après `bear_master_spy_aftermath` | haute galerie au crépuscule | soleil, neige, chaînes et treuils ; la compagnie immobile, sans le Maître Espion |
| Ours, force | `bear_epilogue`, après `bear_trial_aftermath` | terrasse au couchant | Borin devant ses portes, deux guerriers ; la compagnie parmi les lances |
| Arrivée chez Kaelen | `dragon_audience` | salle ouverte sur le ciel | nuages, encens, lanternes ; Kaelen entre ses dragons de bronze ; Elara, Séraphine et Maelor entrent ; gardiens lointains |
| Dragon, honneur | `dragon_epilogue`, après `dragon_shaman_aftermath` | arête enneigée | mer de nuages, cloche, encens ; la compagnie immobile, sans le Chaman |
| Dragon, force | `dragon_epilogue`, après `dragon_trial_aftermath` | esplanade au couchant | Kaelen sur ses marches, deux gardiens ; la compagnie face à lui |
| Arrivée chez le Grand Inquisiteur | `scorpion_audience` | salle des archives | rais de soleil et poussière, lampes de cuivre ; l’Inquisiteur devant son siège ; Kestrel, Séraphine et Maelor entrent ; érudits lointains |
| Scorpion, honneur | `scorpion_epilogue`, après `scorpion_prophet_aftermath` | crête de dune | voile de sable, couchant ; la compagnie immobile, sans le Prophète |
| Scorpion, force | `scorpion_epilogue`, après `scorpion_trial_aftermath` | cour des archives | auvents, lanternes ; l’Inquisiteur devant ses portes, deux érudits ; la compagnie |
| Trahison | `finale_betrayal` | l’arène de la finale (`finale_pre_serpent_final`) | bannières des clans, tribunes ; la compagnie sur le sable ; le vent se lève, la lumière se refroidit ; fin avant que Maelor s’avance |
| Respect, Crainte, Équilibre | chaque épilogue | la capitale au matin (`finale_act_end`) | fumées, feux, la brèche encore ouverte qui vacille ; Alistair, Séraphine, Kestrel et Marian face à elle ; fin avant qu’elle se referme |

**Les fonds animés** (sans figure, chacun sur l’image de son propre dialogue) :
- les trois audiences ;
- les six dialogues d’après-combat qui précèdent une issue ;
- le dialogue de la trahison, où l’encre suinte, le liseré tremble et les bannières sont fouettées ;
- les trois épilogues, avec la fumée, les braseros et les bannières.

## 3. Comment c’est fait

- **Cadre 3:2.** Les tableaux de l’après-démo mesurent 1536 × 1024 et ceux du Lion 1672 × 941.
  - Le lecteur, sa caméra, le calque, les feux, les bannières et le fond animé prennent un cadre par image.
  - Leurs valeurs par défaut sont inchangées : les sept tableaux du Lion et l’ouverture ne bougent pas (tests existants).
- **Un peintre commun** (`src/ui/living/postDemoScenes.ts`). Chaque moment est une fiche de scène : feux, lumières, tissus, chaînes et cloches qui ondulent, temps, profondeur, figures.
- **Les chefs.** Ils viennent de planches de boss deux cases sur deux, ramenées à la taille d’un homme massif (stature 0,56).
- **Les gardes.** Près d’un chef, devant ses portes, ils sont éclairés plus sombre que les acteurs, car une silhouette s’y lisait comme une découpe. Au fond d’une salle, ils restent des silhouettes, comme les gardes d’Alaric.
- **Les tables** (`src/campaign/plateaux/postDemoMoments.ts` et les modules de présentation). Elles sont approuvées, et leur tableau est approuvé et lié au registre d’art par un test.
- **Les déclencheurs** (`GameApp`) :
  - arrivée : à l’ouverture en direct de l’audience ;
  - issue : après le dialogue d’après-combat, avant l’épilogue ;
  - trahison : seulement juste après la finale gagnée en direct ;
  - épilogue : seulement en venant de la brèche gagnée.

  Les marqueurs de ces deux derniers cas restent en mémoire, jamais dans une sauvegarde.
- **Les humeurs** (`POST_DEMO_SCENE_MOODS`) :
  - les audiences et la trahison prennent « tension » ;
  - les dialogues d’après-combat et les épilogues prennent « drame ».
- **Le laboratoire QA.** Un bouton par moment (`/?qa=1`, QA rencontres, rangée « Tableaux vivants de l’après-démo »).

## 4. Vérifications

- **Porte et validateurs.**
  - La porte des contrats sur `5a61d319` n’affiche rien.
  - `contracts:validate` passe : 8 contrats, zéro vidéo active.
  - `narrative:validate` répond `ok: true`.
  - `npx tsc --noEmit` passe.
  - `node --test tools/qa/qa-job.test.mjs`, lancé seul : 26/26.
  - `npm run build` et `git diff --check` passent.
- **vitest** : 3393 réussis, 10 échecs connus. Ils viennent des médias ignorés par Git d’un worktree neuf, en 4 fichiers : `spritesheetPng`, `cin6c_p1_production`, `cin6ea3_pilot_e_regate` et `minimax_task_checkpoint`. C’est le même constat que dans les rapports frères.
- **Nouveaux tests** :
  - `src/campaign/plateaux/postDemoMoments.test.ts` : tables, tableaux liés au registre d’art, aucun fait que le dialogue dit en premier ;
  - `src/ui/living/postDemoMoments.test.ts` : les 13 scripts (durée, image et taille, quatre acteurs et douze figurants au plus, figures existantes, héros du plateau, chef immobile, aucun adversaire, fonds sur leur propre image) ;
  - `src/ui/living/plateauArrivals.test.ts` : cadre 3:2, couverture de la vue, plaques du Lion inchangées ;
  - `src/game/GameAppPostDemoMoments.test.ts` : déclencheurs, jamais après une reprise, fond au bon format ;
  - `src/campaign/plateaux/heroRotation.test.ts` : orateurs des rencontres avec le chef ;
  - `src/audio/moods.test.ts` : clés de l’après-démo.
- **Navigateur.** Laboratoire QA, Playwright sans tête, 1600 × 900, serveur de développement sur le port 5176, zéro erreur de page ni de console dans chaque passage.
  - **Les 13 séquences, réglages par défaut**, en temps réel : chaque plan joue, la séquence finit d’elle-même et rend la main au laboratoire.
  - **Les 13, mouvement réduit du jeu activé** : la caméra reste fixe sur le cadrage final de chaque plan, et les figures apparaissent en fondu à leur place. Ce passage a servi au calage.
  - **`reducedMotion: 'reduce'` émulé** (arrivée chez Kaelen, trahison) : le jeu garde son mouvement, comme le veut le set 1.22.0.
  - **L’audience d’Alaric** joue toujours, et Échap ramène au laboratoire.
  - **Les 13 fonds animés**, dessinés sur leur image comme le calque du dialogue la montre.
- **Retouches faites en vérifiant** :
  - les gardes près d’un chef passent de la silhouette à la figure éclairée sombre ;
  - les bannières de la trahison et la brèche des épilogues restent dans le cadre, y compris en mouvement réduit ;
  - les figures des issues d’honneur sont réduites, car elles étaient trop grandes sur l’arête et la crête.
- **Captures sélectionnées** (non promues) : `tmp/plateau-moments/sheet-plateaux-2.png`, `sheet-force.png`, `sheet-honour.png`, `sheet-finale2.png`, `sheet-default-c.png` et `sheet-backdrops.png`.

## 5. Limites et suites

- Non vu : le son en temps réel et un vrai GPU sur le poste de l’opérateur, le mobile, et un parcours de jeu réel jusqu’à chaque moment. Les déclencheurs sont prouvés par des tests du branchement ; les séquences, par le laboratoire QA.
- Les taches d’encre peintes des issues d’honneur restent telles que peintes : le brouillon proposait qu’elles pâlissent.
- Le jugement artistique en mouvement revient à l’opérateur, séquence par séquence. Chaque position, lumière ou durée se retouche dans la fiche de scène.

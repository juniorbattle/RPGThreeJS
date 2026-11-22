# Traduction anglaise : infrastructure, catalogues et premier passage (2026-11-15)

| Champ | Valeur |
| --- | --- |
| TASK | Jouer en français ou en anglais, au choix dans Réglages, [OD-2026-11-15-C](../autonomy/ENGLISH_TRANSLATION_OPERATOR_DECISION_2026-11-15.md) (run `claude-english-translation-20261115T1750Z`) |
| DOMAIN | UI et contenu : tous les textes vus par le joueur, en affichage seul |
| BASELINE | `5ec8664a` sur `dev` (jeu de contrats 1.24.0, baseline `133814bac45cc31c8eda7aa0fa1acb16a9ca7e35`) ; la branche est partie de `901ba350` |
| BRANCH | worktree `claude/english-translation-4912ff`, rebasé sur `dev` |
| HEAD | le commit de ce rapport |
| STATUS | review : livré sur `origin/dev`, à vérifier en jeu par l'opérateur |
| MERGED_IN | `dev` |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Nouveau choix « Langue · Language » dans Réglages › Affichage, gardé hors sauvegarde. En français rien ne change (texte, identifiants et sauvegardes V6 identiques à l'octet). En anglais, le jeu traduit à l'affichage avec des catalogues JSON chargés à la demande. Le protocole `CombatBridge` ne change pas. |
| CANONICAL_DOCS_UPDATED | `docs/content/ENGLISH_TRANSLATION_GUIDE.md` (registre, glossaire, comment le jeu trouve l'anglais) ; `docs/autonomy/OPERATOR_DECISIONS.md` et le fichier de décision (déjà publiés). L'état (`nextAction`) et la priorité d'`AGENTS.md` reviennent à l'orchestrateur. |
| EVIDENCE | Tests vitest (`src/i18n/`, réglages, dialogue), `npx tsc --noEmit`, `npm run build`, `contracts:validate`, `cinematics:validate-narrative-staging`, garde vide ; les quatre chroniques jouées en anglais dans le navigateur (`tools/full-chronicle-browser-qa.mjs`, `FULL_QA_LANGUAGE=en`) et le contrôle du débordement (`tools/i18n/english-overflow-qa.mjs`), sorties ignorées sous `tmp/`. Limites plus bas. |

## La demande

`APPROVED DECISION`. L'opérateur a retenu les 27 recommandations de la fiche (A1 à A8, G1 à G12, R1 à R4, M1 à M3) : le français reste la source et la langue par défaut ; l'anglais rend fidèlement le français existant, sans aucun canon nouveau ; l'héritier est le « vous » qu'on ne voit pas, rendu par « you » sans genre.

## Ce qui est livré

`CURRENT FACT`.

- **Le moteur** (`src/i18n/`). Le texte français est la clé : `tr()` le traduit au moment d'afficher. Les phrases construites passent par des gabarits à trous `{0}`. Quand aucune entrée exacte n'existe, le moteur recompose : phrases collées, gabarits, majuscules, symboles et nombres autour d'un texte connu, listes « a, b et c », morceaux séparés par `·`, `—`, `:`, `;` ou `,`, et morceaux connus posés bout à bout (lignes de compétence, zones, statuts, étiquettes parlées de la carte). Une lecture qui laisse des trous en français cède la place à une qui n'en laisse pas.
- **L'écran.** En anglais, un observateur du DOM traduit textes et attributs lisibles (`aria-label`, `title`, `alt`, `placeholder`) et rend le français en revenant. Les zones `translate="no"` et `data-i18n-skip` sont ignorées. `<html lang>` et le titre de l'onglet suivent. La boîte de dialogue traduit la réplique entière puis la découpe en pages : les segments français coupent des phrases françaises auxquelles aucun anglais ne correspond.
- **Les catalogues** (`src/i18n/en/*.json`, 4 153 textes, chargés seulement en anglais) : interface 679, combat 559, objets et compétences 468, Lion 868, chronique 158, Ours 383, Dragon 357, Scorpion 351, acte final 330. L'extracteur lit l'arbre syntaxique des sources et l'annexe d'écriture des lieux du Lion. Les outils de développement restent en français (M3).
- **Le test de couverture** exige, pour toute phrase française du joueur, une traduction non vide avec les mêmes trous, aucune entrée orpheline ou en double, les formes du glossaire et la typographie anglaise. Un second test passe la fiche de chaque compétence, à chaque niveau et pour les deux camps, et exige qu'aucun mot français ne survive.
- **Le combat.** Le moteur du combat garde ses libellés français en interne ; seuls les points d'affichage traduisent. Les codes de statut du canvas et des pastilles (STG, WND, FRY, ROT, SIL, CRS, BRN, PSN, BLD, WKN, SLW, TNT, RGN, MGT, BAR) viennent d'une table par statut, car le code français `FOR` de Force ne doit pas devenir `STR`. Le combat déjà lancé garde sa langue jusqu'au suivant (A7).
- **Le choix de langue.** Deux boutons, « Français » et « English », chacun écrit dans sa langue, avec l'état pressé. Changer de langue s'applique tout de suite hors combat, dans les deux sens (vérifié sur l'écran titre).

## Vérifié

`CURRENT FACT`, sur le serveur DEV (port 5182) et en test.

- Tests ciblés : `src/i18n/` (19), réglages, dialogue, cinématiques, combat : verts. `tsc`, build (161 Mo), validateurs, `git diff --check` et garde : verts.
- `npm test` : 3 fichiers en échec, 5 tests, tous des tests historiques de cinématiques que je n'ai pas touchés : artefacts absents de `tmp/` dans ce worktree, `ffprobe` introuvable, un `SyntaxError` dans un fichier hors de ce travail. Ils ne tiennent pas à la traduction. Le reste (263 fichiers, 3 624 tests) passe ; la suite `node:test` passe (26).
- **Les quatre chroniques jouées en anglais dans le navigateur**, de l'écran titre à la fin, par le pilote `tools/full-chronicle-browser-qa.mjs` (`FULL_QA_LANGUAGE=en`, vrais clics, combats gagnés par la commande QA) : respect (28 combats, 58 choix), équilibre (30 combats, 51 choix), crainte avec dernier carré (40 combats, 44 choix) et crainte par le destin (39 combats, 44 choix), sans aucune erreur de console. Le pilote relève chaque texte passé au traducteur sans anglais et portant des marques du français. Premier balayage : 78 textes en français au premier combat, puis 43, 6 et 6 sur les chroniques entières. Défauts réels trouvés et corrigés : les répliques de plusieurs phrases (coupées en français avant traduction), les noms des lieux facultatifs du Lion (écrits dans l'annexe JSON, hors de l'extracteur), les étiquettes parlées des repères de la carte (`, voyage rapide possible`, `, position actuelle`, `, vers …`), la liste des bannières de l'épilogue (`celles {0}`), les indications du déploiement (coupées en deux au tiret avant traduction), les puces `, actif` du combat, et deux lignes de Maelor faites d'une amorce et d'une liste française. Après ces corrections : la chronique « crainte par le destin » rejouée en entier et le premier combat du Lion donnent **0 texte resté en français**. Les trois autres chroniques n'ont pas été rejouées en entier après les dernières corrections, qui sont couvertes par des tests.
- **Débordement** (`tools/i18n/english-overflow-qa.mjs`) : titre, Réglages (trois onglets), fin de l'ouverture et quatorze pages de dialogue avec leurs choix, à 1366×768, 620×780 et 390×844, réglages par défaut puis `reducedMotion: 'reduce'` émulé : 114 écrans, aucun défilement latéral, aucun texte hors de l'écran ni rogné.

- **Page M2, validée le 2026-11-19.** Les 49 répliques approuvées mot à mot (confession et indices de Maelor, sort de Maelor aux épilogues, retouches des moments à enjeu, textes de l'héritier) ont été validées en anglais par l'opérateur, 49 sur 49, sans retouche ni note.

## Pas vérifié

- La relecture route par route (cohérence du style et des voix) : le balayage ne vérifie que l'absence de français, pas la qualité de l'anglais.
- Le débordement de la carte, du refuge, de la forge et de l'interface du combat en anglais (le pilote couvre le titre, les Réglages, l'ouverture et les dialogues).
- Le combat joué à la main en anglais (les combats sont gagnés par la commande QA), et le changement de langue depuis le combat.
- L'ensemble des 4 153 textes n'a été relu que par sondage, la traduction ayant été répartie sur plusieurs rédacteurs ; le glossaire et le test de typographie garantissent la cohérence des termes, pas du style.

## À arbitrer ou à signaler

- **Source française d'Elara** (`lion~c1-0073`) : « Je veillerai à ce que nous ne pouvons pas arrêter avec un bouclier » est agrammaticale. Traduite littéralement ; la correction du français reste à l'opérateur. **Corrigée le 2026-11-21** sur l'accord de l'opérateur : « Je m’occuperai de ce que nous ne pouvons pas arrêter avec un bouclier » (anglais : « I will deal with what we cannot stop with a shield »), voir la décision.
- Rendus ambigus, lecture la plus littérale retenue : « Ancien passage » (Old passage), « Constat » (Finding), « Reconnaissance » (Gratitude), « Vous sentir faible » du troll (You smell weak), « distinct(e) » (Separate), « Sceau du Sage » (Sage’s Seal, qui rappelle les Sceaux du récit).

## Suite

`PROPOSED FUTURE DESIGN`. Faire relire l'anglais route par route ; contrôler le débordement de la carte et du combat en anglais ; la même méthode (catalogue par zone et test de couverture) sert à ajouter une troisième langue.

Note de méthode : ne pas modifier `src/` pendant un passage du pilote sur le serveur DEV. Un rechargement à chaud remet le jeu à l'écran titre, et le pilote prend alors le titre pour la fin de la chronique (une première passe « crainte par le destin » a échoué ainsi, à tort).

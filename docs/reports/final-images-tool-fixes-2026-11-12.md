# Corrections de l’outil d’images finales, après l’Ours et le Dragon

| Champ | Valeur |
| --- | --- |
| TASK | FINAL-IMAGES-TOOL-FIXES-2026-11-12 |
| DOMAIN | Outillage (images finales, OD-2026-11-11-F, F1) et configuration des tests |
| BASELINE | `23501ec0` sur `dev` |
| BRANCH | `dev` (checkout principal) |
| HEAD | le commit qui porte ce rapport |
| STATUS | merged |
| MERGED_IN | `origin/dev` (poussée normale, OD-2026-10-12-A) |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | NONE : aucun code du jeu ne change. Les briefs des prochaines générations changent, ainsi que les tests que vitest lance. Les images de l’Ours et du Dragon déjà intégrées ne sont pas touchées. |
| CANONICAL_DOCS_UPDATED | NONE : la session principale reporte ce résultat dans l’état autonome et les décisions. La fiche du Scorpion et `tools/art/finalImagesStaging.ts` reviennent à la session parallèle du Scorpion. |
| EVIDENCE | `npx vitest run tools/art/finalImages.test.ts` (19 tests), suite complète, tsc, build, contrats, validateur narratif (résultats ci-dessous). |

## 1. Journal des générations (`tools/art/finalImages.ts`)

Avant, chaque passe lisait `tmp/final-images/log.json` au démarrage, puis réécrivait tout le fichier depuis cette copie après chaque image. Deux passes lancées en même temps, comme sur le Dragon, pouvaient donc effacer les entrées l’une de l’autre.

Désormais, la passe ne garde en mémoire que ses nouvelles entrées. `appendToLog` relit le fichier, ajoute ces entrées, écrit sous un nom temporaire puis renomme. Une autre passe ne lit donc jamais un fichier à moitié écrit. Un test rejoue deux passes entrelacées.

## 2. Worktrees exclus de vitest (`vite.config.ts`)

`.claude/**` rejoint les exclusions de vitest. Deux fois aujourd’hui, un worktree de session sous `.claude/worktrees/` a fait tourner les tests en double, avec 10 échecs sur des médias ignorés par Git, absents d’un worktree neuf.

## 3. Élites du Scorpion à la publication (`tools/art/publish_final_images.py`)

`ELITES` liste maintenant toutes les unités de taille 2 du Scorpion : `grand_inquisitor`, `phoenix_guardian_chief`, `shadow_prophet`, `phoenix_flamekeeper` et `shadow_zealot`. Elles seront publiées à la taille des élites, ce qui avait manqué pour le Dragon. Le Scorpion n’a pas de bête.

## 4. Règles générales des briefs (`promptFor`, `heraldryFor`)

Ces règles viennent des reprises du Dragon : 9 dans sa passe, 10 à l’intégration. L’outil les applique désormais à tout plateau, sans que chaque ligne de mise en scène ait à les répéter.

| Règle | Où | Leçon |
| --- | --- | --- |
| Les lieux d’un autre clan ne montrent ni sculpture, ni emblème, ni objet du clan hôte | `heraldryFor`, quand un brief nomme un autre clan | Piliers sculptés et cloches du Dragon dans la caverne du Loup |
| En extérieur, ni château, ni forteresse, ni monastère, ni ville en vue, même au loin, sauf si la ligne en nomme un | décors en extérieur, et salles ouvertes sur le ciel | Bourg fortifié derrière le hameau du Dragon ; châteaux du Lion dans la première passe de l’Ours |
| Un intérieur clos reste clos : ni fenêtre ni ouverture | décors en intérieur sans ciel (remplace la règle « Indoors and underground ») | Fenêtre dans l’abri des pèlerins |
| Aucun personnage ne porte d’objet qu’on pourrait prendre pour l’objet sacré du plateau | personnages du Dragon (Cristal d’Écho) et du Scorpion (codex prophétique du Phénix) | Bâton serti d’un cristal bleu de Kaelen |
| Les Ombres et leur corruption sont noires comme une encre gelée, jamais violettes | tout brief dont le titre, la ligne ou l’aspect nomme les Ombres ou une corruption | Veines et yeux violets du wyrm |
| Chaque sprite tient son arme de combat, lue dans `src/combat/legacyCombatRuntime.js` | personnages qui combattent | Arc au lieu de la fronde du chasseur du Loup ; épée au lieu des lames de jet du champion |

**Lecture de l’arme.** Une unité listée par son identifiant est trouvée directement. Un boss est cherché parmi les combats de son chapitre, par son portrait : son maître final ou le portrait provisoire qu’il a en combat. Le nom français de l’arme est traduit pour le modèle : « Fronde » (a sling), « Lance du temple » (a spear), « Lames de jet » (throwing knives), « Bâton » (a staff). Les griffes des démons sont dessinées comme des armes naturelles. Les armes magiques (« Sceau », « Onde froide », « Flamme du temple ») excluent toute lame, hache, lance, arc ou fronde.

Les règles s’insèrent avant le signe de clan, qui termine toujours le brief. Les règles propres aux lignes et aux aspects du Scorpion appartiennent à la session parallèle du Scorpion.

## 5. Ce que la lecture des armes a révélé sur l’Ours déjà intégré

Ce point est à trancher par l’opérateur. Rien n’est changé.

- **Borin** combat avec « Hache de l’Ours » (une hache), mais son aspect validé et son image intégrée lui donnent un marteau de guerre.
- **Le guerrier de l’Ours** combat avec « Hache de guerre », mais son aspect lui donne une lance et un bouclier rond.

C’est le même écart que sur le Dragon. On peut corriger l’image, ce qui demande une reprise et une republication, ou le nom de l’arme dans les données de combat. À la prochaine génération de ces deux personnages, leur brief contiendrait à la fois l’aspect validé et l’arme de combat, qui se contredisent : il faudra trancher d’abord.

## 6. Vérifications

| Vérification | Résultat |
| --- | --- |
| Portail des documents verrouillés | vide |
| `npx vitest run tools/art/finalImages.test.ts` | 19 tests passent, dont 6 nouveaux |
| Suite, contrats, validateur narratif, tsc, build, `git diff --check` | voir le compte rendu de la session ; tous verts avant la poussée |

Le plan régénéré (`npx vite-node tools/art/finalImages.ts plan`) compte toujours 162 briefs. Aucune image n’a été générée.

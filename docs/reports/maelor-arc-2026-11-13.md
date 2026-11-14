# Arc complet de Maelor : confession et indices (2026-11-13)

| Champ | Valeur |
| --- | --- |
| TASK | Arc de Maelor (run `claude-maelor-arc-20261114T0146Z`), sur l'intention de l'opérateur consignée dans [la revue de complétude](../autonomy/COMPLETENESS_REVIEW_OPERATOR_DECISION_2026-11-13.md) |
| DOMAIN | Contenu narratif (dialogues), présentation narrative (mise en scène des dialogues d'après la démo) |
| BASELINE | `c9d37a08` sur `dev` (jeu de contrats 1.24.0, baseline `133814bac45cc31c8eda7aa0fa1acb16a9ca7e35`) |
| BRANCH | worktree `claude/jovial-panini-7c5cd4`, publié sur `dev` |
| HEAD | le commit de ce rapport |
| STATUS | merged : livré sur `origin/dev` |
| MERGED_IN | `dev` |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Texte seulement, plus une règle de mise en scène. **La trahison :** Maelor avoue tout son plan (trois répliques nouvelles, et « Regardez. » complété). **Cinq indices :** au Lion, à l'Ours, au Dragon, au Scorpion et au Tournoi. **Quatre retouches de cohérence.** **La mise en scène des dialogues d'après la démo** suit maintenant le côté sur lequel chaque réplique est écrite. Maelor se tient donc seul face à la compagnie après sa trahison, et Marian, Kestrel et Elara restent du côté de la compagnie. Aucun drapeau, choix, combat, récompense ni champ de sauvegarde ne change, et aucun acteur n'entre dans une scène. Les dialogues du Lion gardent leurs étapes, ce qui respecte le verrou de présentation généré. |
| CANONICAL_DOCS_UPDATED | `docs/content/drafts/MAELOR_ARC_DRAFT_2026-11-13.md` (brouillon validé). Ni contrat, ni `AGENTS.md`, ni état, ni `OPERATOR_DECISIONS.md` : la session parente consigne les validations. |
| EVIDENCE | Tests ciblés et suite complète, `tsc`, build, `narrative:validate`, `cinematics:validate-narrative-staging`, `contracts:validate`, garde vide (section « Vérification »). Navigateur : vrai jeu sur le serveur de dev du port 5185, avec de vrais gestes, labo QA `/?qa=1&cin6a=golden`. Six captures sélectionnées dans `docs/reports/maelor-arc-2026-11-13/`. |

## L'intention de l'opérateur

`APPROVED DECISION`. Mot à mot (2026-11-13) : « on est bien sur une subitlite de maelor qui nous fait comprendre indirectement qu'il est en mission cache et nous avoue a la fin lors de sa trahison tout son plan et la necessite d'integrer notre groupe pour arriver a ses fins donc il est a provoque la chute du clan en conspirant et retournant les autres clans contre nous pour la decheance puis a integrer notre clan dans cette quete de renouveau en determinant que les sceaux seront le success de notre reussite et valeur mais aussi la cle pour ouvrir la faille scelle des demons ».

## Les validations de l'opérateur, mot à mot

`APPROVED DECISION`. Le brouillon (`0d34a862`) a été soumis question par question. L'opérateur a pris chaque fois l'option recommandée :

| Réf. | Question | Réponse |
| --- | --- | --- |
| C1 | La confession à la trahison, quatre répliques | « Oui, telles quelles (Recommandé) » |
| R1 | « À Bois-Clair déjà » au lieu de « Tout a commencé à Bois-Clair » | « Retoucher (Recommandé) » |
| R2 | Alistair à la brèche | « Retoucher (Recommandé) » |
| I1 | Le Lion : Alaric et l'esquive de Maelor | « Oui, les deux (Recommandé) » |
| I2 | L'Ours : Marian | « Oui (Recommandé) » |
| I3 | Le Dragon : Kaelen | « Oui (Recommandé) » |
| I4 | Le Scorpion : les archives et l'esquive | « Discrète (Recommandé) » |
| I5 | Le Tournoi : « Enfin. » | « Oui (Recommandé) » |
| R3 | La dernière veillée : « menés » | « Retoucher (Recommandé) » |
| R4 | Le Maître Espion : « De vos Sceaux, par exemple. » | « Retoucher (Recommandé) » |

Pendant la vérification, l'opérateur a ajouté, sur une capture de la trahison : « dans cette scene maelor doit etre seul face au auxtre vu que c'est une trahison et de maniere general on doit bien positionner les personnages durant les static dialogue car c'est parfois confus et mal etabli ».

## Ce qui est écrit

`CURRENT FACT` (commit `eb917939`).

### La confession (`finale_betrayal`)

Après les répliques de conseils (`advice`), trois étapes nouvelles, puis l'étape de la brèche, qui porte toujours `finaleBreachOpened` :

- Alistair : « Pourquoi nous ? »
- Maelor : « Parce qu’il me fallait un clan à terre. Votre chute, c’est moi : j’ai soufflé à chaque clan ce qu’il voulait croire de vous, et vos alliés ont rompu leurs serments l’un après l’autre. »
- Maelor : « Puis je suis venu tenir vos comptes. Un clan déchu fait tout pour se relever ; je n’avais qu’à faire des Sceaux la mesure de votre valeur. Aucun seigneur ne me les aurait remis. À vous, ils les ont donnés un à un. »
- Maelor : « Vos Sceaux : votre réussite, votre valeur… et la clé de la faille où les démons sont scellés. Regardez. »

### Les indices

- **I1, le Lion** (`lion_briefing`, texte seul, étapes inchangées) :
  - Alaric (1a) : « Je me souviens de votre chute. Vos alliés ont rompu leurs serments l’un après l’autre, comme si on leur avait soufflé les mêmes mots. Ici, je ne demande pas une parade : revenez répondre de vos décisions. Mes éclaireurs, les survivants et le Sceau lui-même distingueront un secours d’un pillage. »
  - Maelor (3) : « Laissons les vieux serments où ils sont : ils ne nourrissent pas une compagnie. Si Alaric exige… », la suite inchangée.
- **I2, l'Ours** (`bear_audience`), Marian : « Nous ne sommes pas venus vider la montagne d’un autre clan. Des clans dressés l’un contre l’autre : c’est ainsi que le nôtre est tombé. »
- **I3, le Dragon** (`dragon_audience`, étape nouvelle `seal`), Kaelen : « Un Sceau ne se vend pas non plus. Ce qu’il ouvre, il peut aussi le refermer, et le Dragon veille à qui il le confie. »
- **I4, le Scorpion** (`scorpion_audience`, étapes nouvelles `archives` et `dodge`) :
  - Grand Inquisiteur : « Nos archives gardent aussi la chute de votre clan. Vos alliés se sont tous retournés contre vous, sur la foi des mêmes rumeurs. Le Scorpion n’a jamais cru à ce hasard-là. »
  - Maelor : « Les archives gardent ce qu’on leur raconte, Grand Inquisiteur. Parlons plutôt du codex. »
- **I5, le Tournoi** (`finale_arrival`), Maelor : « Enfin. Écrasez-les tous, sans pitié. Personne ne se souvient de la manière, seulement de la victoire. »

### Les retouches de cohérence

- **R1**, `finale_betrayal`/boisclair, trois variantes : « À Bois-Clair déjà, … » remplace « Tout a commencé à Bois-Clair. … ». Le test de N2 (`plateauForks.test.ts`) suit.
- **R2**, `finale_breach_confrontation`/3, Alistair : « Tu nous as fait tomber, puis tu as marché avec nous, Maelor. Ici, ça s’arrête. »
- **R3**, `finale_last_vigil`/evidence : « … La même marque, partout où Maelor nous a menés. »
- **R4**, `bear_master_spy_aftermath`/1, Maître Espion : « Le minerai… n’en était qu’une part. Ceux que nous servons ont besoin de bien d’autres choses. De vos Sceaux, par exemple. »

### Ce qui ne change pas

- L'entité reste sans nom. Aucun clan retourné n'est nommé, et le lieu de la faille comme la manière dont les Sceaux l'ouvrent restent tus.
- Le prologue, l'emblème et l'origine d'Alistair, et la scène du premier refuge ne sont pas touchés.
- Aucun dialogue n'est nouveau, donc aucune humeur n'est à ajouter (`src/audio/moods.ts` inchangé, `moods.test.ts` vert).

## La mise en scène des dialogues d'après la démo

`CURRENT FACT` (commit de ce lot).

**La cause.** Tant que leur mise en scène définitive n'est pas revue, toutes les scènes d'après la démo passent par `src/cinematics/PostDemoPresentationPlans.ts`. Ce planificateur rangeait à gauche une liste figée : Séraphine, Maelor et Alistair. Tous les autres allaient à droite. Marian, Kestrel et Elara se retrouvaient ainsi à côté du chef ou de l'ennemi qu'elles affrontaient, comme Kestrel à côté du Grand Inquisiteur (capture 01). À la trahison, Maelor restait du côté de la compagnie (capture 04).

**La correction.** Chaque acteur se tient du côté sur lequel ses répliques sont écrites (`side`), un côté que les données portent déjà partout. La compagnie parle à gauche. Les chefs, les rencontres et les ennemis parlent à droite, et Maelor aussi une fois qu'il a trahi. La liste figée ne sert plus qu'en secours, pour une réplique écrite sans côté. Les acteurs de gauche regardent à droite, ceux de droite à gauche. Le groupe de l'acteur suit son côté : `PLAYER_COMPANY` à gauche, `ANTAGONIST` pour Maelor traître. Une scène où toute la compagnie est du même côté garde la répartition habituelle. La limite de quatre acteurs et le découpage en groupes ne changent pas.

**Ce qui reste hors de ce lot.** Les dialogues du Lion ont leurs plans générés et verrouillés (`FinalDialoguePresentation.generated.ts`) : ce lot ne les touche pas. La remarque générale de l'opérateur sur les dialogues statiques « parfois confus et mal établis » demande une revue scène par scène de ces plans-là. C'est une tâche à part, proposée à l'opérateur.

## Vérification

`CURRENT FACT`.

- **Tests :**
  - `src/campaign/plateaux/maelorArc.test.ts`, 17 tests. Ils fixent chaque réplique mot à mot, l'ordre des étapes dans deux variantes, la mécanique (seule l'étape de la brèche porte un effet, aucun choix), la distribution de chaque scène touchée et les étapes verrouillées du Lion. Ils fixent aussi Maelor seul à droite et tourné vers la compagnie, de son aveu à la brèche, et les héros à gauche aux trois audiences.
  - `plateauForks.test.ts` suit R1. `narrativePass.test.ts`, `visibleActorCap.test.ts` et `moods.test.ts` sont verts.
  - `npx vitest run src/cinematics src/campaign src/ui` : 87 fichiers et 753 tests verts.
- **Suite complète** (`npm test`) : 3522 tests verts avec la mise en scène. Comme sur tout worktree neuf, cinq échecs sont hérités : des tests cinématiques historiques sous `tools/cinematics/` lisent `tmp/cinematics` ou demandent ffprobe. Le fichier `minimax_task_checkpoint.test.mjs` tombe pour la même raison. Le diff ne touche aucun de ces fichiers. `node --test tools/qa/qa-job.test.mjs` : 26/26.
- **Validateurs et garde :**
  - `npx tsc --noEmit` : vert. `npm run build` : vert.
  - `npm run narrative:validate` : aucune erreur.
  - `npm run cinematics:validate-narrative-staging` : `ok`, avec les deux mêmes étapes inaccessibles qu'avant ce lot.
  - `npm run contracts:validate` : vert. Garde contre `133814ba` : vide.
- **Navigateur** (port 5185, vrais clics et touche Entrée, labo QA `/?qa=1&cin6a=golden`, combats passés par le bouton QA « Victoire ») :
  - **Audience du Scorpion**, départ QA « Scorpion · depuis une fin du Dragon par l’honneur ». Les archives puis l'esquive de Maelor sont lues au mot près (I4). Avant la correction de mise en scène, Kestrel se tenait à droite (capture 01). Après, elle est à gauche avec Séraphine et Maelor, le Grand Inquisiteur seul à droite (capture 02).
  - **Trahison, voie de force**, départ QA « Acte final · depuis une fin du Scorpion par la force », les trois champions humiliés. Toutes les répliques sont lues dans l'ordre :
    - la réplique de Bois-Clair commence par « À Bois-Clair déjà » ;
    - les conseils citent le filon, le Cristal, le codex, la page brûlée et les trois champions humiliés ;
    - puis « Pourquoi nous ? », la chute, le plan et « …la clé de la faille où les démons sont scellés. Regardez. » ;
    - après la scène, le tableau passe à « La brèche s’ouvre ».
    - Cette passe a précédé la correction de mise en scène : Maelor y est encore du côté de la compagnie (capture 04).
  - **Trahison, voie d'honneur**, départ QA « Acte final · depuis une fin du Scorpion par l’honneur », les trois champions relevés.
    - « Enfin. » est lu à l'arrivée au Tournoi (I5, capture 03).
    - Aux verdicts, la compagnie est à gauche et le champion seul à droite.
    - À la trahison, la variante « Vous ne m’avez jamais écouté » est suivie de la confession entière. Maelor se tient seul à droite, tourné vers Kestrel, Alistair et Séraphine, la faille entre eux (captures 05 et 06). La brèche s'ouvre ensuite sur le tableau.
- **Non vérifié dans le navigateur :**
  - les indices I1 (Lion), I2 (Ours) et I3 (Dragon), et les retouches R2, R3 et R4 : les tests les fixent ;
  - le mouvement réduit : ce lot ne touche aucune transition.

## Notes

- Le message du commit `0d34a862` (le brouillon) a sa ligne de trailer collée au sujet, faute de ligne vide. Il est publié et n'est pas réécrit (pas de force-push). Les commits suivants ont la forme attendue.
- Le `.claude/launch.json` du worktree a reçu une entrée temporaire pour le port 5185. Il a été remis tel quel et n'est pas commité. Le serveur est arrêté.

# La place d’Alistair : protagoniste ou héros parmi les autres ? (2026-11-14)

| Champ | Valeur |
| --- | --- |
| TASK | `ALISTAIR-ROLE-AUDIT` (run `claude-alistair-role-20261115T0404Z`) |
| DOMAIN | Contenu narratif et mise en scène : prologue, Lion, plateaux de l’après-démo, acte final et ses trois fins |
| BASELINE | `c21c4c32` sur `dev` (jeu de contrats 1.24.0, baseline `133814bac45cc31c8eda7aa0fa1acb16a9ca7e35`) |
| BRANCH | worktree `claude/sharp-yonath-9c7174`, publié sur `dev` |
| HEAD | le commit de ce rapport |
| STATUS | merged : inventaire livré, [fiche d’arbitrages](https://claude.ai/artifact/F7fRCUi47UADQaRnuL5teo) remplie par l’opérateur (toutes les recommandations, sans note), décision [OD-2026-11-14-B](../autonomy/ALISTAIR_ROLE_OPERATOR_DECISION_2026-11-14.md) appliquée sur `dev` |
| MERGED_IN | `dev` |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Fin de la Crainte : trois textes approuvés mot à mot retirent le nom d’Alistair (B1). Après-démo : 37 questions de choix changent d’orateur, sans changer un mot (C1). Le pion de carte et les panneaux de fin des plateaux et de l’acte final montrent le héros de la partie (C2). Huit tags « Clan sans terre » deviennent « Bouclier » (D1). Aucun champ de sauvegarde, aucune vérité de jeu, aucune image ni aucun personnage nouveau. |
| CANONICAL_DOCS_UPDATED | `docs/autonomy/ALISTAIR_ROLE_OPERATOR_DECISION_2026-11-14.md` (nouveau), `docs/autonomy/OPERATOR_DECISIONS.md` (OD-2026-11-14-B, et les amendements d’OD-2026-11-09-B et d’OD-2026-11-13-C), notes d’amendement dans `POST_DEMO_LOT_5_OPERATOR_DECISION_2026-11-09.md` et `PLATEAU_MOMENTS_OPERATOR_DECISION_2026-11-13.md`. |
| EVIDENCE | Extraction par script de toutes les répliques jouables (`tmp/alistair-audit/dump.ts`, ignoré) : 896 étapes de dialogue, scènes construites selon l’état comprises (états initial, d’honneur, de cupidité, et les deux branches de la Crainte). Fiches de texte des quatre parties de l’après-démo (`npm run narrative:text-sheet`). Lecture du code de présentation. Livraison : tests ciblés, suite complète, `narrative:validate`, `cinematics:validate-narrative-staging`, `tsc`, build, contrats et garde ; navigateur sur le labo QA (fin de la Crainte, panneaux de fin de l’Ours et de l’acte final, pion du Dragon), voir « Décision et livraison ». |

## La question

L’opérateur, le 2026-11-14, mot à mot : « j’ai l’impression que certaines cutscenes comme la custscene final mefiant determine que alistair est le protagoniste principaale... cela semble confus car c’est unn heros parmi les autres donc est-il finalement bon de le mettre comme protagonist car tout le monde represente la volonte du joueur et il n’a donc pas de personnage attitre ».

## Réponse courte

`CURRENT FACT`. Le canon a déjà tranché, dès le Lion : **le joueur n’est pas Alistair**. Le jeu s’adresse au joueur en « vous ». Ce « vous » est l’héritier du clan déchu : « Dans la salle de votre père » (Séraphine, prologue), « Un héritier sans terre » (la colporteuse, Lion). C’est lui qui donne les ordres : « Donnez l’ordre », lui dit Alistair à Bois-Clair. Alistair, lui, est « Le bouclier » : il était à la porte quand la bannière est tombée, et il prend la première ligne. Le 2026-11-02, l’opérateur a choisi de « rester sur “vous” » pour le personnage joueur (OD-2026-11-02-A, C4).

`CURRENT FACT`. L’écart vient de l’après-démo, à deux endroits :

1. **Les choix.** Au Lion, les 33 choix sont posés par 24 voix différentes. Alistair n’en pose qu’un : l’adieu à une colporteuse. Dans l’après-démo, il pose **41 des 47 choix**. Dans chacune de ces 41 scènes, il ne dit rien d’autre que la question (« Que faisons-nous ? »). Son nom s’affiche donc au-dessus de presque chaque décision du joueur.
2. **La fin de la Crainte.** La feuille de route dit : « le joueur [...] doit soit se battre seul contre tous, soit accepter son destin ». Le texte écrit a mis Alistair à la place du joueur : les clans exigent qu’on leur livre Alistair, et le joueur choisit « Accepter mon destin » sous le nom d’Alistair. C’est le seul choix à la première personne du singulier de tout le jeu. L’opérateur a accepté cette conséquence le 2026-11-09 (OD-2026-11-09-B, question 2 du Lot 5).

`PROPOSED FUTURE DESIGN`. Recommandation : revenir au canon du Lion. Le joueur reste le « vous », l’héritier jamais montré. Aucun héros n’est son avatar, et Alistair redevient un héros parmi les autres. Coût : trois retouches de texte dans la fin de la Crainte, qui ne font que retirer le nom d’Alistair, et le passage des questions de choix au héros de chaque plateau, sans changer un mot. La fiche d’arbitrages porte ces choix (section « Fiche »).

## Ce que le canon dit du joueur

| Source | Réplique exacte | Ce qu’elle établit |
| --- | --- | --- |
| `acte_ouverture#1`, Séraphine ([content.ts:101](../../src/game/content.ts)) | « Notre clan a perdu ses terres. Dans la salle de votre père, les sièges sont vides ; [...] » | le « vous » est l’enfant du chef déchu |
| `rep_event_serpent_rumour_market#3`, la colporteuse ([r5NarrativeContent.ts:222](../../src/game/r5NarrativeContent.ts)) | « Un héritier sans terre qui raconte sa propre défaite : voilà une histoire que les tavernes répéteront. [...] » | le joueur, qui vient de raconter la chute du clan, est l’héritier |
| `acte_ouverture#3`, Alistair, tag « Le bouclier » ([content.ts:124](../../src/game/content.ts)) | « J’étais à la porte quand notre bannière est tombée. J’aurais pu partir avec les autres. Je suis resté. Sur la route, je prendrai la première ligne [...] » | Alistair est un fidèle resté, la première ligne, pas l’héritier |
| `village_choice#4a`, Alistair ([content.ts:631](../../src/game/content.ts)) | « [...] Donnez l’ordre. Nous ne l’habillerons pas ensuite d’une vertu qu’il n’avait pas ; nous porterons son prix ensemble. » | Alistair demande l’ordre au joueur |
| `village_choice#6b`, Maelor ([content.ts:648](../../src/game/content.ts)) | « J’ai fait mon objection et vous avez tranché. [...] » | c’est le « vous » qui tranche |
| `camp_departure#1`, Maelor | « [...] Nous n’avons que quatre combattants. [...] » | les quatre combattants sont Alistair, Marian, Kestrel et Elara ; l’héritier n’est pas une unité |
| OD-2026-11-02-A, C4 | options proposées : « Rester sur “vous” », « J’écris une phrase », « Donner un nom au personnage » ; choix : « Rester sur “vous” » | l’opérateur garde un joueur sans nom ni visage |
| Feuille de route, §2.6 ([feuille_de_route_narrative_condensee.md:78](../content/feuille_de_route_narrative_condensee.md)) | « le joueur est perçu comme une menace potentielle [...] décident de le sacrifier [...] doit soit se battre seul contre tous, soit accepter son destin. Son clan est à nouveau déchu, ou pire, anéanti. » | la fin de la Crainte vise le joueur, pas un héros |

Aucun contrat LOCKED ne nomme Alistair ni un protagoniste (`docs/contracts/**`, `GAME_CONSTITUTION.md`). Retoucher ces répliques ne demande donc aucun amendement, seulement l’accord mot à mot de l’opérateur.

## Inventaire : où Alistair est mis à part

### 1. La fin de la Crainte (`finale_epilogue_fear`, `finale_fear_close`)

`CURRENT FACT`. C’est le passage qui désigne le plus nettement Alistair comme le personnage du joueur. Sept éléments, dans [finaleEpilogues.ts](../../src/campaign/plateaux/finale/finaleEpilogues.ts) :

| Étape | Qui | Réplique exacte | En quoi elle désigne Alistair |
| --- | --- | --- | --- |
| `finale_epilogue_fear#demand` (l. 226) | Séraphine | « Ils vous craignent plus que la brèche, Alistair. Ils exigent qu’on vous livre, pour acheter leur paix. » | les clans craignent Alistair plus que tout et réclament sa personne |
| `finale_epilogue_fear#choice` (l. 227) | Alistair | « Alors ? » | il tient le choix final de la chronique |
| choix 2 (l. 230) | le joueur | « Accepter mon destin. » | seul choix à la première personne du singulier du jeu, affiché sous le nom d’Alistair : le joueur parle en Alistair |
| aperçu du choix 2 (l. 231) | — | « Alistair se livre aux clans » | la conséquence nomme Alistair |
| `finale_fear_close#fate` (l. 245) | Séraphine | « Vous avez accepté votre destin, Alistair, pour que les autres vivent. » | le destin du joueur est celui d’Alistair |
| `finale_fear_close#clan` (l. 246) | Marian | « Les clans tiendront parole : votre clan vivra, mais déchu, une fois de plus. » | adressé à Alistair, « votre clan » en fait le chef du clan |
| `finale_fear_close#close` (l. 247) | Alistair | « Qu’il vive. C’est assez. » | il conclut son propre sacrifice |

Dans l’autre branche (se battre), seul « Alors nous marcherons sans nom. » revient à Alistair (l. 242). Cette réplique est collective.

### 2. Les deux autres fins et l’acte final

`CURRENT FACT`. Ailleurs dans l’acte final, Alistair parle toujours en « nous ». Deux signaux le distinguent pourtant :

- **Le tag « Clan sans terre ».** Le tag s’affiche sous le nom de l’orateur. Dans les fins, les chefs portent le nom de leur clan (« Le Lion », « L’Ours »), et Alistair porte « Clan sans terre ». On lit donc Alistair comme le chef du clan sans terre. Huit répliques d’Alistair portent ce tag dans l’acte final (tableau ci-dessous). Ailleurs, il ne sert qu’aux rencontres avec un chef : une fois au Lion pour Alistair (`lion_briefing#1b`), et une fois par plateau pour le héros du plateau (`*_audience#alistair`, OD-2026-11-13-C).
- **Le dernier mot.** Alistair clôt la fin du Respect et les deux branches de la Crainte. Kestrel clôt celle de l’Équilibre.

Alistair a 21 répliques dans l’acte final et ses fins : les six questions de choix (section 3) et ces quinze-ci :

| Étape | Tag | Réplique exacte |
| --- | --- | --- |
| `finale_arrival#1` | Tournoi des Grands | « Quatre Sceaux. L’Arène des Destins nous ouvre ses portes, et toutes les bannières des clans flottent au-dessus des tribunes. » |
| `finale_arrival#5` | **Clan sans terre** | « Nous nous souviendrons, nous. » |
| `finale_capital_arrival#1` | Capitale | « La capitale. Des rues entières en flammes, et la brèche ouverte au-dessus des toits. » |
| `finale_breach_confrontation#3` | **Clan sans terre** | « Tu nous as fait tomber, puis tu as marché avec nous, Maelor. Ici, ça s’arrête. » |
| `finale_breach_aftermath#3` | **Clan sans terre** | « Alors il reste une chose à faire. » |
| `finale_pre_serpent_final#2` | Finale | « Alors finissons-en. » |
| `finale_betrayal#why` | **Clan sans terre** | « Pourquoi nous ? » |
| `finale_betrayal#alistair` | **Clan sans terre** | « Maelor ! » |
| `finale_allied_rally#go` | **Clan sans terre** | « Alors avançons. La brèche n’attendra pas. » |
| `finale_last_vigil#1` | Veillée | « La dernière nuit avant la brèche. Plus de Sceau à gagner : seulement ce que nous avons fait pour en arriver là. » |
| `finale_epilogue_respect#alistair` | **Clan sans terre** | « Nous ne reconstruirons pas seuls. Chaque clan portera sa part du fardeau, et la justice vaudra pour tous. » |
| `finale_epilogue_respect#close` | Le Respect | « Alors rentrons. Il y a tant à reconstruire. » |
| `finale_epilogue_balance#peace` | **Clan sans terre** | « Alors il faudra négocier. Une paix fragile vaut mieux qu’une guerre de plus, même si elle nous coûte une part de ce que nous croyions. » |
| `finale_fear_close#close` (branche du destin) | La Crainte | « Qu’il vive. C’est assez. » |
| `finale_fear_close#close` (branche du combat) | La Crainte | « Alors nous marcherons sans nom. » |

L’écran de fin de la chronique ([chronicleEndWords.ts](../../src/game/chronicleEndWords.ts)) ne nomme personne : « Quatre Sceaux, la brèche refermée : la Voie des Sceaux s’achève ici. » Les crédits sont vides tant que l’opérateur ne les a pas écrits ([credits.ts](../../src/ui/credits.ts)).

### 3. Les questions de choix de l’après-démo

`CURRENT FACT`. Qui pose la question du choix, partie par partie (extraction de toutes les étapes à choix) :

| Partie | Étapes à choix | Posées par Alistair | Autres |
| --- | --- | --- | --- |
| Lion | 33 | 1 (l’adieu à la colporteuse) | 24 voix : villageois, réfugiés, Maelor (4), Alaric (4), Séraphine (3), Kestrel, Cedric, ennemis… |
| Ours | 14 | 12 | Borin (2) |
| Dragon | 14 | 12 | Kaelen (2) |
| Scorpion | 13 | 11 | le Grand Inquisiteur (2) |
| Acte final et fins | 6 | 6 | — |

Au Lion, celui qui apporte le dilemme pose la question, et le joueur répond en « vous ». Dans l’après-démo, les conseillers exposent le dilemme, puis Alistair entre dans la scène pour une seule réplique : la question. OD-2026-11-13-C a ensuite écrit la règle telle quelle : « Alistair garde les décisions de la route ».

Ces répliques sont collectives (« Que faisons-nous ? ») ou s’adressent au joueur (« Votre réponse, alors. »). Aucune n’a besoin d’Alistair. Les 41 questions, avec la proposition de l’option C1 (héros du plateau ; à l’acte final, Marian pour les civils, Kestrel pour les habitants, Alistair garde les trois verdicts de l’arène) :

| # | Scène#étape | Réplique d’Alistair | Choix proposés | Proposition C1 |
| --- | --- | --- | --- | --- |
| 1 | `bear_raven_messenger#offer` | « Votre réponse, alors. » | Refuser l’or et prévenir l’Ours. / Prendre la bourse et regarder ailleurs. | Marian |
| 2 | `bear_trapped_miners#choice` | « Décidons, et vite. » | Dégager les mineurs, quel qu’en soit le temps. / Prendre leur minerai et poursuivre. | Marian |
| 3 | `bear_raven_traps#choice` | « Que fait-on de ces pièges ? » | Désarmer les pièges et les signaler aux patrouilles. / Garder la poudre pour la compagnie. | Marian |
| 4 | `bear_ancient_relic#choice` | « Et nous, qu’en faisons-nous ? » | Rendre l’artefact au sanctuaire de l’Ours. / Garder l’artefact. | Marian |
| 5 | `bear_mountain_shrine#choice` | « Que laissons-nous à la montagne ? » | Respecter les offrandes et repartir. / Prendre les offrandes. | Marian |
| 6 | `bear_mountain_shrine#aldric_choice_h` | « Que répondons-nous à Aldric ? » | Accueillir Aldric dans la compagnie. / Décliner. | Marian |
| 7 | `bear_mountain_shrine#aldric_choice_p` | « Que répondons-nous à Aldric ? » | Rendre les 50 or au sanctuaire et accueillir Aldric. / Garder l’or et repartir. | Marian |
| 8 | `bear_ore_convoy#choice` | « Le convoi passe bientôt. » | Marquer le convoi et prévenir Borin. / Saisir le minerai pour le clan. | Marian |
| 9 | `bear_ore_convoy#gunnar_choice` | « Que répondons-nous à Gunnar ? » | Engager Gunnar — 120 or. / Décliner. | Marian |
| 10 | `bear_sacred_mines#choice` | « Les galeries attendent notre réponse. » | Chasser le Corbeau et rendre les galeries à l’Ours. / Chasser le Corbeau et garder le filon sombre pour le clan. / Tenir parole au Corbeau et le laisser finir. | Marian |
| 11 | `bear_miners_testimony#choice` | « Que faisons-nous d’eux ? » | Escorter les mineurs jusqu’à Borin. / Les faire taire, quel qu’en soit le prix. | Marian |
| 12 | `bear_dark_vein#choice` | « Que faisons-nous du filon ? » | En sceller un éclat comme preuve. / Briser le filon. | Marian |
| 13 | `dragon_wolf_envoy#offer` | « Votre réponse, alors. » | Repousser l’émissaire et prévenir Kaelen. / Accepter l’or et le pacte du Loup. | Elara |
| 14 | `dragon_wolf_traps#choice` | « Que fait-on de ces pièges ? » | Désarmer les pièges du sentier des pèlerins. / Les retourner contre les patrouilles du Loup. | Elara |
| 15 | `dragon_wolf_traps#talon_choice` | « Que répondons-nous à Talon ? » | Engager Talon — 150 or. / Décliner. | Elara |
| 16 | `dragon_captive_wolf#choice` | « Que faisons-nous de lui ? » | Soigner ses blessures, l’écouter, puis le relâcher. / Lui arracher ce qu’il sait. | Elara |
| 17 | `dragon_crystal_clues#choice` | « Que faisons-nous de ces inscriptions ? » | Copier les inscriptions pour Kaelen. / Garder pour nous le secret du Cristal. | Elara |
| 18 | `dragon_terrorized_village#choice` | « Que faisons-nous pour ce hameau ? » | Monter la garde et repousser le prochain raid. / Faire payer notre protection. | Elara |
| 19 | `dragon_terrorized_village#lyra_choice_e` | « Que répondons-nous à Lyra ? » | Rendre les 60 or au hameau et accueillir Lyra. / Garder l’or. | Elara |
| 20 | `dragon_terrorized_village#lyra_choice_p` | « Que répondons-nous à Lyra ? » | Accueillir Lyra dans la compagnie. / Décliner. | Elara |
| 21 | `dragon_wolf_lair#choice` | « Le repaire attend notre réponse. » | Prendre le repaire et rapporter le Cristal à Kaelen. / Prendre le repaire et garder le Cristal pour le clan. / Tenir parole au Loup et lui laisser le Cristal. | Elara |
| 22 | `dragon_freed_pilgrims#choice` | « Que faisons-nous d’eux ? » | Escorter les pèlerins jusqu’à Kaelen. / Les faire taire, quel qu’en soit le prix. | Elara |
| 23 | `dragon_crystal_altar#choice` | « Que faisons-nous de cette souillure ? » | En sceller un éclat comme preuve. / L’effacer sur-le-champ. | Elara |
| 24 | `dragon_young_dragon#choice` | « Que faisons-nous ? » | Soigner le jeune dragon. / Prendre ses écailles. | Elara |
| 25 | `scorpion_phoenix_faithful#oath` | « Que leur répondons-nous ? » | Ne rien leur promettre. / Jurer de ne pas livrer le codex au Grand Inquisiteur. | Kestrel |
| 26 | `scorpion_sand_riddle#choice` | « Comment passons-nous ? » | Chercher la réponse dans les textes. / Briser le mécanisme. | Kestrel |
| 27 | `scorpion_warded_path#choice` | « Que faisons-nous de ces sceaux ? » | Les lever selon leur rite. / Les briser sans attendre. | Kestrel |
| 28 | `scorpion_buried_library#choice` | « Que faisons-nous de cette bibliothèque ? » | La laisser intacte. / Emporter des rouleaux pour les vendre. | Kestrel |
| 29 | `scorpion_buried_library#morvan_choice` | « Que répondons-nous à Morvan ? » | Engager Morvan — 180 or. / Décliner. | Kestrel |
| 30 | `scorpion_sacred_ashes#choice` | « Que faisons-nous ? » | Respecter les cendres sacrées. / Emporter des braises. | Kestrel |
| 31 | `scorpion_scholars#choice` | « Que faisons-nous ? » | Libérer le fidèle du Phénix. / Le laisser aux érudits. | Kestrel |
| 32 | `scorpion_scholars#eldwin_choice` | « Que répondons-nous à Eldwin ? » | Accueillir Eldwin dans la compagnie. / Décliner. | Kestrel |
| 33 | `scorpion_phoenix_temple#choice` | « Le temple attend notre réponse. » | Prendre le codex pour le Grand Inquisiteur. / Prendre le codex et le garder pour le clan. / Tenir notre serment et laisser le codex au Phénix. | Kestrel |
| 34 | `scorpion_temple_witnesses#choice` | « Que faisons-nous d’eux ? » | Escorter les fidèles jusqu’au Grand Inquisiteur. / Les réduire au silence, quel qu’en soit le prix. | Kestrel |
| 35 | `scorpion_corrupted_texts#choice` | « Que faisons-nous de cette page ? » | La sceller comme preuve. / La brûler sur-le-champ. | Kestrel |
| 36 | `finale_arena_chaos#choice` | « Que faisons-nous ? » | Couvrir la fuite des civils. / Fuir par les tribunes, sans les attendre. | Marian |
| 37 | `finale_trapped_citizens#choice` | « Que faisons-nous ? » | Dégager les habitants. / Les laisser et gagner la brèche. | Kestrel |
| 38 | `finale_raven_verdict#choice` | « Toute l’arène attend notre geste. » | Relever le champion du Corbeau. / L’humilier devant les clans. | Alistair (inchangé) |
| 39 | `finale_wolf_verdict#choice` | « Toute l’arène attend notre geste. » | Relever le champion du Loup. / L’humilier devant les clans. | Alistair (inchangé) |
| 40 | `finale_phoenix_verdict#choice` | « Toute l’arène attend notre geste. » | Relever le champion du Phénix. / L’humilier devant les clans. | Alistair (inchangé) |
| 41 | `finale_epilogue_fear#choice` | « Alors ? » | Nous battre, seuls contre tous. / Accepter mon destin. | voir B1 |

Deux de ces scènes donneraient deux répliques de suite au même héros, si on applique C1 : `bear_mountain_shrine#choice` et `#aldric_choice_h`, qui suivent une réplique de Marian. Les deux restent lisibles. Dans aucune des 41 scènes le nombre d’orateurs n’augmente : Alistair n’y dit rien d’autre que la question, et quand le héros du plateau parle déjà dans la scène, il y a un orateur de moins.

### 4. La mise en scène

`CURRENT FACT`.

| Surface | Ce qu’on voit | Signal « protagoniste » |
| --- | --- | --- |
| Pion de la carte ([PoiMapView.ts:81](../../src/ui/PoiMapView.ts)) | la figurine d’Alistair, sur toutes les cartes de toutes les parties ; le code la nomme « The company's leader » | **fort** : dans un RPG, le pion de carte se lit comme l’avatar du joueur |
| Questions de choix ([DialogueView.ts](../../src/ui/DialogueView.ts)) | le nom de l’orateur s’affiche au-dessus des boutons de choix | **fort** dans l’après-démo (section 3) |
| Panneau de fin de chapitre et de chronique (`CHRONICLE_END_TABLEAU`, [NarrativeTableau.ts:855](../../src/cinematics/NarrativeTableau.ts)) | Alistair au centre et le plus grand (43 %, échelle 0,86), entre Maelor et Séraphine ; le même panneau sert à la fin du Lion, à la fin de chaque plateau et, sans Maelor, à la fin de l’acte final | **moyen** : sur les plateaux, ce n’est pas le héros du plateau qui s’y tient ; et après « Alistair se livre aux clans », Alistair reste debout sur le panneau final |
| Tableaux vivants du Lion | Alistair entre dans ceux de l’arrivée à Bois-Clair et de son issue, de l’audience et du jugement d’Alaric, et des deux fins de route. Il y accompagne Séraphine et Maelor, parce qu’il parle dans les dialogues qui suivent | faible : il y est le héros du Lion (OD-2026-11-13-C, « comme Alistair au Lion ») |
| Champ `playerRepresentatives` des tableaux du Lion | Alistair y représente le camp du joueur dans trois tableaux (le départ de l’audience, l’arrivée au dernier refuge, la fin de chronique) ; Séraphine et Maelor dans les autres | aucun à l’écran : c’est une donnée d’audit de distribution, qui varie d’une scène à l’autre |
| Tableaux vivants des plateaux | le héros du plateau à la place d’Alistair (test `postDemoMoments.test.ts`) | aucun |
| Tableaux vivants de l’acte final | la trahison (Alistair, Séraphine, Kestrel) et l’aube avant chaque fin (Alistair, Séraphine, Kestrel, Marian) ; Alistair est le premier à paraître, à 0,05 s | faible : il est un des quatre, au plafond de quatre acteurs |
| Portraits et mise en scène des dialogues | chaque orateur a son portrait et son moment de parole ; Alistair n’a aucun traitement à part | aucun |
| Combat | Alistair est l’une des quatre unités du départ ([store.ts:72](../../src/game/store.ts)) ; aucune règle ne l’oblige au déploiement | aucun |
| Écran de fin, crédits | aucun nom | aucun |

Nombre de répliques par partie (compagnie seulement) : Alistair ne parle pas plus que les autres. Séraphine et Maelor parlent davantage partout.

| Partie | Alistair | Séraphine | Maelor | Kestrel | Marian | Elara |
| --- | --- | --- | --- | --- | --- | --- |
| Lion | 23 | 39 | 43 | 24 | 16 | 8 |
| Ours | 13 | 30 | 23 | 16 | 10 | 0 |
| Dragon | 12 | 29 | 21 | 18 | 13 | 4 |
| Scorpion | 11 | 30 | 21 | 20 | 11 | 0 |
| Acte final et fins | 21 | 30 | 12 | 23 | 14 | 0 |

### 5. Le Lion, pour comparaison

`CURRENT FACT`. Au Lion, Alistair a 23 répliques. Il y parle pour la compagnie, en « nous », et n’emploie « je » que dans ses présentations du prologue (« je prendrai la première ligne », « je garde la ligne »). Il porte le tag « Clan sans terre » une seule fois, devant Alaric. Il ne pose aucun choix qui compte, et il demande l’ordre au joueur au moment du plus grand choix du Lion. Une seule réplique s’adresse à lui par son nom : « Je partirai avec vous, Alistair. » (Marian, prologue), entre compagnons. Le Lion n’a donc rien à reprendre.

## Ce qui fait déjà foi

| Décision | Ce qu’elle dit | Effet sur cette question |
| --- | --- | --- |
| OD-2026-11-02-A, C4 ([décision](../autonomy/OPENING_SEQUENCE_OPERATOR_DECISION_2026-11-02.md)) | le personnage joueur reste « vous » ; pas de nom, pas de phrase nouvelle | fonde l’option recommandée : le joueur est le « vous » |
| OD-2026-11-09-B, question 2 ([décision](../autonomy/POST_DEMO_LOT_5_OPERATOR_DECISION_2026-11-09.md)) | « Accepter son destin : Alistair se livre aux clans, et le clan vit, déchu une fois de plus » | à amender si l’opérateur retient B1 ; c’est sa propre décision |
| OD-2026-11-13-C ([décision](../autonomy/PLATEAU_MOMENTS_OPERATOR_DECISION_2026-11-13.md#od-2026-11-13-c--rotation-des-héros)) | à chaque plateau, un héros accompagne les conseillers chez le chef (Ours : Marian ; Dragon : Elara ; Scorpion : Kestrel ; acte final : toute la compagnie, Alistair compris) ; il prend quatre répliques d’Alistair, mot pour mot ; « Alistair garde les décisions de la route » | la rotation existe déjà et fonctionne (test `heroRotation.test.ts`) ; C1 l’étend aux questions de choix et amende la dernière phrase |
| Pilote narratif d’Alistair (OD-2026-10-24-B, en pause depuis OD-2026-10-25-B) | un petit pilote technique d’animation par planches de sprites, choisi parce qu’Alistair est présent au camp et en combat ; l’animation image par image des héros a été abandonnée le 2026-10-30 (OD-2026-10-30-A) | aucun : ce pilote ne fait pas d’Alistair un protagoniste ; il reste gelé |
| Emblème et origine d’Alistair (OD-2026-10-01-B, [décision](../autonomy/CINEMATIC_STRUCTURE_OPERATOR_DECISION_2026-10-01.md)) | l’emblème du lion qu’il porte peut laisser croire à une affiliation ; deux pistes ouvertes : un dessin plus sobre, ou une origine dans la région du Lion (hypothèse à confronter au canon) ; « non urgent » | reste ouvert ; aucune option ci-dessous ne le tranche |

## Options

`PROPOSED FUTURE DESIGN`. Trois cadres possibles. Le coût compte les étapes touchées dans le code.

| Cadre | Ce que voit le joueur | Coût | Risque de canon |
| --- | --- | --- | --- |
| **A. Le « vous » du prologue, l’héritier jamais montré** (recommandé) | Personne n’est son avatar : les héros lui parlent, lui demandent l’ordre et portent sa volonté à tour de rôle. Alistair est le bouclier, un héros parmi les autres. | Fin de la Crainte : 3 étapes, des mots retirés seulement (B1). Questions de choix : 37 étapes changent d’orateur, aucun mot ne change (C1). En option, le pion de carte (C2) et 8 tags (D1). | Faible. On revient au canon du Lion et à la feuille de route (« le joueur »). Seule OD-2026-11-09-B question 2 est amendée, par l’opérateur. |
| B. La compagnie entière, sans personne derrière le « vous » | Pareil à l’écran, mais le « vous » ne désigne plus personne. | Tout le cadre A, plus deux répliques du Lion à retoucher (« Dans la salle de votre père », « Un héritier sans terre »). Et la fin de la Crainte n’a plus personne à livrer : il faudrait la réécrire. | Moyen. Le Lion est la partie la plus aboutie, et sa fin de la Crainte demanderait un fait nouveau. |
| C. Alistair, protagoniste assumé | Alistair est le joueur, partout. | Alistair n’est pas l’héritier (« J’étais à la porte [...] Je suis resté »). Il faudrait réécrire le prologue et l’échange de la colporteuse, défaire la rotation d’OD-2026-11-13-C et trancher son origine. | Fort : on contredit le Lion et on invente une biographie. |

L’option « le joueur incarne le clan, et Alistair n’est qu’un des fondateurs » n’est pas proposée telle quelle : « fondateurs » serait un fait nouveau. Le cadre A dit la même chose avec le canon existant.

Recommandation : **cadre A**. Le canon le porte déjà, l’opérateur l’a choisi pour l’ouverture, et c’est le moins coûteux. Il répond aussi à l’intuition de l’opérateur : chaque héros représente la volonté du joueur, et aucun n’est « son » personnage.

## Brouillons, soumis mot à mot

Rien n’est appliqué avant l’accord de l’opérateur, réplique par réplique.

### B1 — La fin de la Crainte livre le « vous » (cadre A)

| Étape | Aujourd’hui | Brouillon |
| --- | --- | --- |
| `finale_epilogue_fear#demand` (Séraphine) | « Ils vous craignent plus que la brèche, Alistair. Ils exigent qu’on vous livre, pour acheter leur paix. » | « Ils vous craignent plus que la brèche. Ils exigent qu’on vous livre, pour acheter leur paix. » |
| aperçu du choix « Accepter mon destin. » | « Alistair se livre aux clans » | « Vous vous livrez aux clans » |
| `finale_fear_close#fate` (Séraphine) | « Vous avez accepté votre destin, Alistair, pour que les autres vivent. » | « Vous avez accepté votre destin, pour que les autres vivent. » |

Ce qui ne change pas : « Alors ? » d’Alistair, qui se tourne vers le joueur comme à Bois-Clair (« Donnez l’ordre ») ; les deux choix, « Accepter mon destin. » devenant le destin du joueur ; « votre clan vivra » de Marian, qui s’adresse désormais à l’héritier ; « Qu’il vive. C’est assez. » d’Alistair, qui accepte pour la compagnie que le clan vive ; toute la branche du combat. Les drapeaux, les effets et la sauvegarde ne changent pas.

B1 règle aussi un défaut de mise en scène : aujourd’hui, après « Alistair se livre aux clans », Alistair se tient encore au centre du panneau de fin de la chronique. L’héritier, lui, n’est jamais montré.

Variante B2, si l’opérateur veut garder « Alistair se livre » (OD-2026-11-09-B) mais en faire le sacrifice d’un héros, et non celui du joueur. Elle demande une réplique nouvelle, et il faudrait retirer Alistair du panneau de fin dans cette branche :

| Étape | Brouillon B2 |
| --- | --- |
| `finale_epilogue_fear#demand` (Séraphine) | « Ils vous craignent plus que la brèche. Ils exigent qu’on leur livre l’un des nôtres, pour acheter leur paix. » |
| nouvelle étape, Alistair, avant le choix | « J’étais à la porte quand notre bannière est tombée. Je suis resté. Laissez-moi y aller. » |
| choix 2 | « Laisser Alistair se livrer. » (aperçu inchangé : « Alistair se livre aux clans ») |
| `finale_fear_close#fate` (Séraphine) | « Alistair a accepté son destin, pour que les autres vivent. » |
| `finale_fear_close#clan` (Marian) | « Les clans tiendront parole : notre clan vivra, mais déchu, une fois de plus. » |

### C1 — Les questions de choix passent au héros du plateau

Aucun mot ne change : seul l’orateur change, comme pour la rotation du 2026-11-13. Les 35 questions des plateaux, rencontres des héros recrutables comprises, passent au héros du plateau. À l’acte final, `finale_arena_chaos#choice` passe à Marian, qui vient de parler des civils, et `finale_trapped_citizens#choice` à Kestrel, qui a trouvé la rue effondrée. Alistair garde les trois verdicts de l’arène, où il tient la première ligne, et « Alors ? » de la Crainte (B1). Il garde ainsi 4 des 47 questions de l’après-démo, au lieu de 41. Tableau complet en section 3.

Variante, comme au Lion : supprimer les 41 questions et afficher les choix sous la dernière réplique qui expose le dilemme. Elle ne demande aucun mot nouveau, mais retire 41 répliques approuvées, et Maelor porterait alors la plupart des choix.

### C2 — La figure de la compagnie : pion de carte et panneau de fin

Le pion de carte prend la figurine du héros de la partie : Alistair au Lion et à l’acte final, Marian à l’Ours, Elara au Dragon, Kestrel au Scorpion. La partie se lit sur le préfixe de l’identifiant du POI présenté, comme pour la musique (set 1.23.0). Au panneau de fin de chaque plateau, le héros du plateau prend la place d’Alistair. Au panneau de fin de l’acte final, la compagnie se tient comme dans les tableaux vivants des fins : Alistair, Séraphine, Kestrel et Marian. Présentation seule : aucun texte, aucune sauvegarde. Le rendu serait montré dans le navigateur avant d’être gardé. Alternatives : garder Alistair partout, ou une bannière sans emblème pour le pion, qui serait un nouveau dessin soumis à l’acceptation artistique de l’opérateur.

### D1 — Le tag « Clan sans terre » des huit répliques de l’acte final

Brouillon : « Bouclier », le rôle que le prologue lui donne (tag « Le bouclier »), comme Kestrel est « Éclaireuse » et Marian « Soigneuse ». « Clan sans terre » reste aux rencontres avec un chef : `lion_briefing#1b` et les trois `*_audience#alistair`. Étapes : `finale_arrival#5`, `finale_breach_confrontation#3`, `finale_breach_aftermath#3`, `finale_betrayal#why`, `finale_betrayal#alistair`, `finale_allied_rally#go`, `finale_epilogue_respect#alistair`, `finale_epilogue_balance#peace`.

### D2 — Le dernier mot des fins

Recommandation : ne rien changer. Alistair y parle en « nous », à côté de Séraphine, Kestrel et Marian. Une fois B1 appliqué, il n’y est plus mis à part. Alternative, sans changer un mot : la clôture du Respect, « Alors rentrons. Il y a tant à reconstruire. », passe à Marian.

## Observations hors du périmètre

- **Elara n’a aucune réplique dans l’acte final et ses fins**, ni à l’Ours ni au Scorpion, et elle n’entre pas dans les tableaux vivants de l’acte final. OD-2026-11-13-C prévoit pourtant « toute la compagnie » à l’acte final. Ce point relève d’une autre tâche, qui demanderait du texte nouveau.
- Le commentaire du code du pion de carte (« The company's leader ») devra suivre la décision C2. Fait : il parle désormais de la compagnie et du héros de la partie.

## Vérification et limites

- Extraction : 896 étapes, 166 scènes. Les scènes construites selon l’état ont été lues sous les états initial, d’honneur et de cupidité de chaque plateau, et sous les deux branches de la Crainte. Une variante qui ne paraît que dans un autre état peut manquer, et c’est arrivé : la première version de ce rapport et la fiche comptaient 39 questions sur 45, faute d’avoir vu deux questions de rencontre propres à une branche (`lyra_choice_p`, `eldwin_choice`). Le compte est corrigé ici à 41 sur 47, en relisant toutes les définitions dans le code source. Le choix de l’opérateur n’en dépend pas.
- Audit (commit `f2917079`) : garde LOCKED vide, validateur des contrats vert ; aucun test, puisque rien n’avait changé dans le jeu.

## Fiche

[Fiche d’arbitrages « Alistair et le joueur »](https://claude.ai/artifact/F7fRCUi47UADQaRnuL5teo) : A1 (cadre), B1 (fin de la Crainte), C1 (questions de choix), C2 (pion de carte), D1 (tag), D2 (dernier mot des fins), E1 (emblème et origine). Une fois la fiche remplie, les choix iront dans une décision de l’opérateur (OD-2026-11-14-B), puis les textes approuvés seront appliqués, testés (tests ciblés, `narrative:validate`, `cinematics:validate-narrative-staging`, `tsc`, build, contrats) et poussés sur `dev`.

## Décision et livraison

`APPROVED DECISION`. Le 2026-11-14, l’opérateur a écrit « Fiche remplie ». Il a retenu les sept recommandations, sans note : A1 le « vous », l’héritier jamais montré ; B1 te livrer, toi, l’héritier ; C1 le héros du plateau ; C2 le héros de la partie ; D1 « Bouclier » ; D2 ne rien changer ; E1 laisser ouvert. Décision consignée : [OD-2026-11-14-B](../autonomy/ALISTAIR_ROLE_OPERATOR_DECISION_2026-11-14.md).

`CURRENT FACT`. Livré sur `dev` :

- **B1** ([finaleEpilogues.ts](../../src/campaign/plateaux/finale/finaleEpilogues.ts)) : « Ils vous craignent plus que la brèche. Ils exigent qu’on vous livre, pour acheter leur paix. », l’aperçu « Vous vous livrez aux clans », et « Vous avez accepté votre destin, pour que les autres vivent. ». La fin de la Crainte ne nomme plus Alistair, ni dans la demande ni dans la clôture.
- **C1** : les 35 questions des plateaux passent à Marian (Ours, 12), Elara (Dragon, 12) et Kestrel (Scorpion, 11), rencontres des six héros recrutables comprises ([heroMeetings.ts](../../src/campaign/plateaux/heroMeetings.ts)). À l’acte final, Marian pose la question des civils et Kestrel celle des habitants. Alistair garde les trois verdicts et « Alors ? ».
- **C2** : le pion de carte lit la partie sur le préfixe du POI présenté ([PoiMapView.ts](../../src/ui/PoiMapView.ts), `pawnHeroFor`). Le panneau de fin de chaque plateau met son héros à la place d’Alistair, et celui de l’acte final montre Kestrel, Alistair, Séraphine et Marian ([NarrativeTableau.ts](../../src/cinematics/NarrativeTableau.ts)).
- **D1** : « Bouclier » sur les huit répliques ([finaleDialogues.ts](../../src/campaign/plateaux/finale/finaleDialogues.ts), [finaleEpilogues.ts](../../src/campaign/plateaux/finale/finaleEpilogues.ts)).

Vérification :

- **Tests ciblés** : nouveau [alistairRole.test.ts](../../src/campaign/plateaux/alistairRole.test.ts) (8 tests : orateurs des questions par plateau et par rencontre, les quatre questions d’Alistair à l’acte final, les textes exacts de B1, les tags, le pion). Tests mis à jour : `heroRotation`, `campaignEndingsDriver`, `NarrativeTableau`, et les tests de présentation des quatre parties pour le panneau de fin.
- **Suite complète** : seuls restent les 5 échecs connus de la chaîne vidéo retirée, dans `tools/cinematics/` (`ffprobe` et médias absents du worktree), les mêmes que dans [living-openings-2026-11-14.md](living-openings-2026-11-14.md).
- **Suite `node:test`** (`tools/qa/qa-job.test.mjs`) : 26 sur 26 au second passage ; au premier, lancé seul juste après, un test avait échoué sans laisser de trace.
- **Validateurs et build** : `narrative:validate`, `cinematics:validate-narrative-staging`, `tsc --noEmit`, `npm run build`, `contracts:validate`, garde LOCKED vide.
- **Navigateur** (serveur de développement sur le port 5181, labo QA `/?qa=1`, 1366 × 768, aucune erreur de console) : « Fin · la Crainte » montre la demande sans le nom d’Alistair, l’aperçu « Vous vous livrez aux clans », puis « Vous avez accepté votre destin, pour que les autres vivent. ». Le panneau « Fin de la chronique · La Crainte » montre Kestrel, Alistair, Séraphine et Marian sur le sol, au-dessus du cartouche. Le panneau « Fin de chapitre » de l’Ours montre Maelor, Marian et Séraphine. Sur la carte des Pics Célestes, le pion est Elara (`data-pawn-hero="elara"`).
- **Non vérifié** : le rendu sur le poste de l’opérateur et en mouvement réduit (aucune transition n’a changé), les panneaux du Dragon et du Scorpion et les pions de l’Ours et du Scorpion à l’écran (couverts par les tests), et le mobile.

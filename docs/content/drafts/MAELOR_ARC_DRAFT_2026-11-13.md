# Arc de Maelor : brouillon (2026-11-13)

Run `claude-maelor-arc-20261114T0146Z`. Ce brouillon ne change rien dans le jeu. Chaque réplique nouvelle ou retouchée est soumise mot à mot à l'opérateur, question par question, avant d'entrer dans le code.

## L'intention de l'opérateur

Mot à mot (2026-11-13, consignée dans `docs/autonomy/COMPLETENESS_REVIEW_OPERATOR_DECISION_2026-11-13.md`) :

> « on est bien sur une subitlite de maelor qui nous fait comprendre indirectement qu'il est en mission cache et nous avoue a la fin lors de sa trahison tout son plan et la necessite d'integrer notre groupe pour arriver a ses fins donc il est a provoque la chute du clan en conspirant et retournant les autres clans contre nous pour la decheance puis a integrer notre clan dans cette quete de renouveau en determinant que les sceaux seront le success de notre reussite et valeur mais aussi la cle pour ouvrir la faille scelle des demons »

Ce que cela fixe, sans rien ajouter :

1. Maelor a provoqué la chute du clan. Il a conspiré et retourné les autres clans contre lui.
2. Puis il a rejoint le clan déchu dans sa quête de renouveau.
3. Il a fait des Sceaux la mesure de la réussite et de la valeur du clan.
4. Les Sceaux sont aussi la clé de la faille scellée des démons.
5. Il avait besoin du clan pour arriver à ses fins.
6. Il l'avoue en entier à la trahison. Avant, seules des touches discrètes laissent deviner une mission cachée.

## Les limites

- **Aucun fait inventé au-delà de l'intention.** Les clans retournés contre le nôtre ne sont pas nommés. Le lieu de la faille n'est pas dit, ni comment les Sceaux l'ouvrent. L'entité reste sans nom. L'emblème et l'origine d'Alistair, le prologue et la scène du premier refuge restent des décisions ouvertes de l'opérateur : rien n'y touche.
- **Aucune mécanique ne change.** Pas de drapeau, de choix, de scène, de combat, de récompense ou de champ de sauvegarde nouveau. La brèche s'ouvre sur la même étape (`finaleBreachOpened`), Maelor fuit de même et la sauvegarde V6 ne bouge pas.
- **Quatre acteurs visibles au plus.** Chaque réplique nouvelle est dite par un personnage déjà présent dans sa scène.
- **Les dialogues du Lion.** Ils sont figés dans le verrou de présentation généré (`FinalDialoguePresentation.generated.ts`, signature `étape@acteur@choix`). Au Lion, on ne fait donc que retoucher le texte d'étapes existantes, sans en ajouter. Les dialogues d'après la démo ne sont pas dans ce verrou : on peut y ajouter des étapes.
- **Les humeurs.** Elles sont fixées par dialogue (`src/audio/moods.ts`). Aucun dialogue nouveau n'est créé, donc aucune humeur nouvelle n'est nécessaire.

## 1. Inventaire

Relevé automatique des chaînes littérales de `src/` (hors tests et fichiers générés) : 97 répliques de Maelor et 121 autres répliques sur la chute, les Sceaux ou les Ombres. Les répliques construites selon l’état sont listées à la main en 1.3.

### 1.1 Répliques de Maelor

**Lion** (43)

- `src/game/campaignGrammarContent.ts:28` · `first_refuge_gathering`/2 · Intendant Maelor : J’ai mis à l’abri ce que nous avons rapporté de la route. Comptons nos réserves ce soir : à Bois-Clair, personne n’aura le temps de compter.
- `src/game/content.ts:113` · `acte_ouverture`/2 · Intendant Maelor : Pour entrer au Tournoi des Grands, il nous faut les quatre Sceaux des quatre seigneurs. Chacun devra reconnaître nos actes. C’est notre voie pour rendre une place au clan ; aucun d’eux n’a promis de nous rendre celle que nous avons perdue.
- `src/game/content.ts:173` · `acte_ouverture`/7 · Intendant Maelor : Nous irons d’abord trouver Alaric, le Vieux Lion. Bois-Clair brûle sous les Serpents. Son Sceau est le premier que nous cherchons, mais secourir le village ne sera pas un achat : il jugera ce que nous aurons fait, et ce que nous aurons laissé faire.
- `src/game/content.ts:215` · `camp_departure`/1 · Intendant Maelor : Avant de franchir la porte, vérifiez les remèdes et gardez une réserve d’or. Nous n’avons que quatre combattants. Une victoire qui nous laisse incapables de poursuivre ne nous rapproche pas d’Alaric.
- `src/game/content.ts:263` · `camp_departure`/3 · Intendant Maelor : Les refuges nous permettront de reprendre souffle et de mettre nos gains à l’abri. Sur la route, l’or ramassé reste exposé. Ne le dépensez pas en pensée avant d’avoir rejoint le refuge.
- `src/game/content.ts:353` · `lion_briefing`/3 · Intendant Maelor : Un serment ne nourrit pas une compagnie. Si Alaric exige que nous sauvions son village, demander de quoi tenir la route n’est pas une offense : c’est dire honnêtement ce que notre clan peut encore payer.
- `src/game/content.ts:471` · `refugee_trial`/3 · Intendant Maelor : Ils ont acheté un chemin que nous aurions pu leur donner. Quarante pièces ne sauveront pas notre clan ; elles diront seulement jusqu’où nous étions prêts à marchander sa survie.
- `src/game/content.ts:537` · `reserve_trail`/1 · Intendant Maelor : Un convoi Serpent transporte les coffres de Bois-Clair. L’intercepter enrichira la compagnie, mais retardera le secours.
- `src/game/content.ts:551` · `reserve_trail`/2 · Intendant Maelor : Une bourse pleine vaut parfois mieux qu’une chanson de gratitude.
- `src/game/content.ts:611` · `reserve_trail`/3b · Intendant Maelor : Je n’aime pas abandonner une ressource utile. Mais si notre avance empêche Bois-Clair de devenir un champ de cendres, ce sera le meilleur profit de cette route.
- `src/game/content.ts:628` · `village_choice`/4 · Intendant Maelor : Je ne vais pas l’habiller autrement : la porte basse, c’est notre bourse. Les coffres du village partent par là. Si nous les reprenons aux Serpents, ils serviront au clan : avec cet or, nous tenons jusqu’au Sceau. Sans lui, nous arriverons devant Alaric en mendiants.
- `src/game/content.ts:646` · `village_choice`/6b · Intendant Maelor : J’ai fait mon objection et vous avez tranché. Je tiendrai les comptes après la bataille. Pour l’instant, je tiens la ligne avec vous.
- `src/game/content.ts:648` · `village_choice`/7a · Intendant Maelor : La porte basse est moins défendue. Nous frappons vite, sécurisons les coffres et gardons assez de force pour sortir du village. Aucun détour, aucune promesse que nous ne pouvons plus tenir.
- `src/game/content.ts:750` · `serpent_duelist_trial`/3 · Intendant Maelor : La route se referme derrière vous. Le duelliste ne tombe pas, mais nous gagnons quelques heures de vie.
- `src/game/content.ts:772` · `mystery_troll_crossing`/3 · Intendant Maelor : Un prix laid, mais moins laid qu’un cercueil. Nous reviendrons plus lourds de fer.
- `src/game/content.ts:794` · `mystery_dragon_roost`/3 · Intendant Maelor : Un jeune dragon vivant, un nid cartographié et personne de blessé : ce n’est pas abandonner un trésor. C’est refuser de convertir chaque avantage en butin immédiat.
- `src/game/content.ts:807` · `mystery_treasure`/1 · Intendant Maelor : La marque des réfugiés est encore visible sous la boue. Les traces quittent la route vers le ruisseau : leurs propriétaires peuvent être morts… ou chercher encore ce chariot. Ses provisions, elles, couvriraient plusieurs jours de marche.
- `src/game/content.ts:816` · `mystery_treasure`/3 · Intendant Maelor : Faites compter le butin, mais ne l’appelez pas une trouvaille. Les couvertures portent encore des noms. Nous mangerons mieux ce soir en sachant exactement à qui nous avons pris ces jours de survie.
- `src/game/content.ts:838` · `mystery_shrine`/3 · Intendant Maelor : Quatre-vingts pièces aujourd’hui. En échange, chaque marchand, éclaireur ou réfugié qui passera ici paiera désormais le risque à notre place. Ce profit a un coût ; simplement pas pour nous tout de suite.
- `src/game/content.ts:860` · `serpent_informant`/3 · Intendant Maelor : Cent vingt pièces pour un nom et un chemin. Bon prix, si l’on oublie que le prochain informateur saura désormais ce que vaut notre protection. Ce marché nous enrichit une fois et peut nous coûter toutes les suivantes.
- `src/game/content.ts:910` · `witnesses_on_road`/3b · Intendant Maelor : Les veilleurs de Bois-Clair ferment la route et les miliciens prennent position. Il n’y a plus de silence à acheter. Il faudra désormais l’imposer.
- `src/game/content.ts:937` · `shadow_signs`/3 · Intendant Maelor : Si Elara a raison sur cette balise, briser l’autel n’est pas qu’un profit : c’est acheter de la sécurité en sacrifiant la meilleure preuve que nous ayons. Ne confondons pas prudence et victoire.
- `src/game/content.ts:962` · `old_shrine_event`/3 · Intendant Maelor : Le métal servira, oui. Mais si ce foyer protégeait les voyageurs avant nous, nous venons de convertir une sécurité commune en avantage privé. Inscrivez-le dans les comptes aussi.
- `src/game/content.ts:1002` · `post_witness_road_clash`/2 · Intendant Maelor : Alors avançons. Devant Alaric, l’absence de certains témoignages sera elle-même un témoignage.
- `src/game/content.ts:1055` · `village_raid_aftermath`/1 · Intendant Maelor : Les coffres sont à nous. Les Serpents sont dispersés. Mais les villageois… ils ne nous maudiront pas à voix haute. Ils n’osent plus.
- `src/game/content.ts:1065` · `village_raid_aftermath`/3 · Intendant Maelor : Ils survivront. Ils ont survécu à pire. Et nous avons ce qu’il nous faut pour le Sceau.
- `src/game/content.ts:1148` · `ate_maelor_seal_analysis`/1 · Intendant Maelor : J’ai passé des années à traiter les Sceaux comme des leviers : posséder la marque, gagner l’accès, convertir l’accès en pouvoir. Celui-ci réagit autrement. Il semble garder la mémoire de ce qu’on lui fait porter.
- `src/game/content.ts:1150` · `ate_maelor_seal_analysis`/3 · Intendant Maelor : Et si le Sceau conserve vraiment ces traces, ce qui se réveille derrière lui ne trouvera pas seulement un porteur puissant. Il trouvera l’histoire entière du clan. Pour une fois, je ne sais pas quel prix inscrire en face de cela.
- `src/game/content.ts:1170` · `ate_ruins_awaken`/1 · Intendant Maelor : Je déteste les phénomènes qui refusent les comptes simples. La pierre chauffe sans feu, les inscriptions répondent sans mécanisme et chaque mesure change quand le Sceau approche. Nous avons dépassé le domaine où une provision ou une arme règle le problème.
- `src/game/content.ts:1172` · `ate_ruins_awaken`/3 · Intendant Maelor : Alors cessons de parler du Sceau comme d’une récompense. S’il ouvre des portes, certaines donnent peut-être sur des choses qu’aucun clan raisonnable ne devrait réveiller sans savoir comment les refermer.
- `src/game/content.ts:1246` · `rep_event_roadside_intimidation`/2 · Intendant Maelor : Ils ne reculent pas. Les Serpents tirent leurs armes devant témoins. Puisqu’ils veulent faire de notre nom un exemple, répondons sur la route.
- `src/game/content.ts:1247` · `rep_event_roadside_intimidation`/3 · Intendant Maelor : Le passage est libre. La bourse est plus légère, et chacun ici sait désormais quel prix nous avons accepté.
- `src/game/content.ts:1323` · `final_refuge`/1 · Intendant Maelor : Le camp du Lion est en vue. À partir de ces portes, mes comptes ne corrigeront plus rien : Alaric a déjà des rapports, les absents ont déjà des noms et les témoins ont leur propre mémoire. Nous pouvons seulement entrer avec ce que nous avons fait.
- `src/game/lionFinale.ts:429` · `?`/stains · Intendant Maelor : Mes comptes gardent aussi ${listFrench(stains)}. Rien de cela n’est imaginaire, mais tout n’a pas le même poids. Si nous avons appris quelque chose sur cette route, c’est qu’un registre honnête doit savoir distinguer une tache d’une rupture.
- `src/game/lionFinale.ts:525` · `?`/3 · Intendant Maelor : Le Lion nous a reconnus, mais l’artefact et son secret resteront avec nous. La cour ne peut condamner une vérité qu’elle ne connaît pas.
- `src/game/r5NarrativeContent.ts:36` · `post_opening_trail`/3 · Intendant Maelor : Ramassez ce qui peut servir et repartons. Une victoire devient vite un luxe si elle nous fait oublier l’incendie au bout de la route.
- `src/game/r5NarrativeContent.ts:45` · `pre_valmir_road`/3 · Intendant Maelor : Alors nous ne cherchons pas une route parfaite. Nous ouvrons celle-ci. Gardez les remèdes pour ceux qui tomberont, brisez ce qui bloque le passage, et ne laissez rien nous retenir après.
- `src/game/r5NarrativeContent.ts:86` · `post_spider_nest`/2 · Intendant Maelor : Une menace de moins derrière nous vaut presque une escorte. Prenez les glandes intactes, marquez le détour sûr, puis reprenons la marche.
- `src/game/r5NarrativeContent.ts:110` · `pre_serpent_checkpoint`/2 · Intendant Maelor : Brisez le centre avant que les coureurs ne gagnent les bois. Si le général ignore combien nous sommes, notre prochaine décision restera la nôtre.
- `src/game/r5NarrativeContent.ts:158` · `post_troll_crossing`/2 · Intendant Maelor : Nous emportons ce qui peut sauver la compagnie et nous rendrons le reste au premier convoi sûr. Même le butin a une histoire ; mieux vaut savoir laquelle.
- `src/game/r5NarrativeContent.ts:177` · `ate_first_refuge_watch`/4 · Intendant Maelor : Alors dormez par tours. Au matin, nous laissons derrière nous un refuge plus sûr et devant nous une dette plus urgente : atteindre Bois-Clair avant la seconde fumée.
- `src/game/r5NarrativeContent.ts:188` · `ate_bois_clair_night_watch`/4 · Intendant Maelor : Les comptes sont faits. Rien de ce que nous dirons demain ne changera cette nuit. Reprenons la marche avec les vivants, les absents et les conséquences à nos côtés.
- `src/game/r5NarrativeContent.ts:239` · `rep_event_fallen_banner_claimant`/3 · Intendant Maelor : Il voulait acheter une place dans notre relèvement au prix d’une phrase. Nous aurons peut-être besoin d’alliés, mais pas de nouveaux propriétaires.

**Ours** (17)

- `src/campaign/plateaux/bear/bearDialogues.ts:62` · `bear_arrival`/3 · Intendant Maelor : Alors montrons-lui ce que nous valons, et voyons ce que sa montagne peut nous donner en retour.
- `src/campaign/plateaux/bear/bearDialogues.ts:68` · `bear_raven_messenger`/4 · Intendant Maelor : Personne ne saura qui a regardé ailleurs, et la bourse est lourde. Je ne dis pas d’accepter. Je dis seulement que l’honneur de l’Ours ne nous nourrira pas au prochain col.
- `src/campaign/plateaux/bear/bearDialogues.ts:81` · `bear_trapped_miners`/3 · Intendant Maelor : Dégager ces pierres nous coûtera la journée, et le Corbeau ne nous attendra pas. Leurs sacs de minerai sont là, sur le côté. Sous les pierres, ils ne servent plus à personne.
- `src/campaign/plateaux/bear/bearDialogues.ts:92` · `bear_raven_traps`/2 · Intendant Maelor : Cette poudre vaut de l’or dans une forge, et davantage dans un combat. Le Corbeau l’a payée ; nous pourrions au moins la lui reprendre.
- `src/campaign/plateaux/bear/bearDialogues.ts:103` · `bear_outpost_gathering`/2 · Intendant Maelor : Les guerriers de l’Ours ne nous quittent pas des yeux. Un Sceau du Lion pèse peu à cette altitude.
- `src/campaign/plateaux/bear/bearDialogues.ts:109` · `bear_ancient_relic`/3 · Intendant Maelor : Ou pour le vendre. Un artefact pareil ouvrirait bien des portes, loin d’ici.
- `src/campaign/plateaux/bear/bearDialogues.ts:115` · `bear_ancient_relic`/kept · Intendant Maelor : Il voyagera avec nous. Sa gemme paiera une lame, le jour venu.
- `src/campaign/plateaux/bear/bearDialogues.ts:128` · `bear_mines_seizure_aftermath`/1 · Intendant Maelor : Le filon est à nous. Plantons notre bannière à l’entrée ; l’Ours devra traiter avec nous, maintenant.
- `src/campaign/plateaux/bear/bearDialogues.ts:138` · `bear_mountain_shrine`/2 · Intendant Maelor : Personne ne viendra les compter avant des mois. Les offrandes ne nourrissent personne.
- `src/campaign/plateaux/bear/bearDialogues.ts:145` · `bear_mountain_shrine`/plundered · Intendant Maelor : Cinquante pièces. La montagne ne réclamera rien ; ses gardiens, peut-être.
- `src/campaign/plateaux/bear/bearDialogues.ts:150` · `bear_vigil`/3 · Intendant Maelor : Deux Sceaux, bientôt. Plus nous en portons, plus les clans nous regardent comme une menace. Il faudra un jour décider à quoi ils nous servent vraiment.
- `src/campaign/plateaux/bear/bearDialogues.ts:182` · `bear_audience`/maelor · Intendant Maelor : Ou laissons l’Ours et le Corbeau s’user l’un contre l’autre. Deux clans affaiblis devant des mines ouvertes… Je dis seulement ce que tout le monde pensera en voyant ces galeries.
- `src/campaign/plateaux/bear/bearDialogues.ts:208` · `bear_ore_convoy`/maelor · Intendant Maelor : Du minerai volé à l’Ours. Si nous le prenons, personne ne le rendra jamais à Borin de toute façon. Autant qu’il serve à quelqu’un.${greed}
- `src/campaign/plateaux/bear/bearDialogues.ts:228` · `bear_sacred_mines`/maelor · Intendant Maelor : Ou reprenons-les pour nous. Le Corbeau a déjà fait le travail ; il suffirait de changer de bannière à l’entrée.
- `src/campaign/plateaux/bear/bearDialogues.ts:273` · `bear_dark_vein`/maelor · Intendant Maelor : Un tel minerai vaut une fortune, ou une malédiction. Peut-être les deux.
- `src/campaign/plateaux/heroMeetings.ts:89` · `?`/gunnar_maelor · Intendant Maelor : Un homme qui donne son prix avant son nom. Au moins, nous savons ce qu’il vaut.
- `src/campaign/plateaux/heroMeetings.ts:117` · `?`/aldric_maelor · Intendant Maelor : Cinquante pièces pour un chevalier. Le compte est vite fait.

**Dragon** (15)

- `src/campaign/plateaux/dragon/dragonDialogues.ts:66` · `dragon_arrival`/3 · Intendant Maelor : Un clan si sage qu’il n’a besoin de personne. Voyons ce qu’il nous demandera quand même.
- `src/campaign/plateaux/dragon/dragonDialogues.ts:72` · `dragon_wolf_envoy`/4 · Intendant Maelor : Le Dragon et le Loup se disputent ces pics depuis toujours. Qu’ils s’affaiblissent l’un l’autre, et le plus fort au bout sera peut-être celui qui n’a pas choisi trop tôt.
- `src/campaign/plateaux/dragon/dragonDialogues.ts:84` · `dragon_wolf_traps`/2 · Intendant Maelor : Déplaçons-les sur les sentiers du Loup. Ses patrouilles y tomberont, et le repaire sera moins gardé.
- `src/campaign/plateaux/dragon/dragonDialogues.ts:95` · `dragon_hermitage_gathering`/2 · Intendant Maelor : Sans poser de questions, et sans rien nous dire non plus. Le Dragon garde même ses silences.
- `src/campaign/plateaux/dragon/dragonDialogues.ts:101` · `dragon_captive_wolf`/3 · Intendant Maelor : Il dira tout, avec un peu d’encouragement. Le repaire est gardé, et nous ne savons rien de ses défenses.
- `src/campaign/plateaux/dragon/dragonDialogues.ts:113` · `dragon_crystal_clues`/2 · Intendant Maelor : Une arme qui tient des montagnes en équilibre. Ce savoir vaut plus que tout l’or du Loup. Pourquoi le rendre à un clan qui le garde pour lui seul ?
- `src/campaign/plateaux/dragon/dragonDialogues.ts:120` · `dragon_crystal_clues`/hidden · Intendant Maelor : Je garde la copie, et la poussière de cristal au pied de la paroi. Un jour, ce savoir nous servira.
- `src/campaign/plateaux/dragon/dragonDialogues.ts:133` · `dragon_lair_seizure_aftermath`/1 · Intendant Maelor : Le Cristal est à nous. Le Dragon devra traiter avec ceux qui tiennent l’équilibre de ses pics.
- `src/campaign/plateaux/dragon/dragonDialogues.ts:162` · `dragon_terrorized_village`/3 · Intendant Maelor : Ces gens paieraient cher pour dormir tranquilles. Une protection a un prix, et personne d’autre ne la leur offre.
- `src/campaign/plateaux/dragon/dragonDialogues.ts:187` · `dragon_audience`/maelor · Intendant Maelor : Ou laissons le Loup et le Dragon s’user l’un contre l’autre. Le Cristal ira à qui le tiendra à la fin… Je dis seulement ce que chacun pense en regardant ces pics.
- `src/campaign/plateaux/dragon/dragonDialogues.ts:206` · `dragon_wolf_lair`/maelor · Intendant Maelor : Ou reprenons-le pour nous. Celui qui tient le Cristal tient le Dragon.
- `src/campaign/plateaux/dragon/dragonDialogues.ts:228` · `dragon_shaman_traces`/maelor · Intendant Maelor : Celui qui vivait ici est parti avant nous. Il savait que le repaire tomberait.
- `src/campaign/plateaux/dragon/dragonDialogues.ts:295` · `dragon_vigil`/3 · Intendant Maelor : Trois Sceaux, bientôt. Il viendra un jour où quelqu’un voudra savoir à quoi ils nous servent vraiment. J’aimerais avoir la réponse avant lui.
- `src/campaign/plateaux/dragon/dragonDialogues.ts:339` · `dragon_young_dragon`/3 · Intendant Maelor : Ses écailles valent une armure entière chez un bon forgeron. Il ne les sentira pas.
- `src/campaign/plateaux/heroMeetings.ts:173` · `?`/talon_maelor · Intendant Maelor : Enfin quelqu’un qui parle comme un marchand.

**Scorpion** (15)

- `src/campaign/plateaux/scorpion/scorpionDialogues.ts:64` · `scorpion_arrival`/3 · Intendant Maelor : Un clan qui collectionne les secrets. Voyons ce qu’il est prêt à échanger contre les nôtres.
- `src/campaign/plateaux/scorpion/scorpionDialogues.ts:71` · `scorpion_phoenix_faithful`/5 · Intendant Maelor : Un serment ne coûte rien à prononcer. Ce qu’on en fait ensuite, c’est une autre affaire.
- `src/campaign/plateaux/scorpion/scorpionDialogues.ts:83` · `scorpion_sand_riddle`/3 · Intendant Maelor : Le temps, c’est ce qui nous manque. Brisons-le.
- `src/campaign/plateaux/scorpion/scorpionDialogues.ts:93` · `scorpion_oasis_gathering`/2 · Intendant Maelor : Ici, même l’eau a un prix. On nous le dira plus tard.
- `src/campaign/plateaux/scorpion/scorpionDialogues.ts:99` · `scorpion_warded_path`/3 · Intendant Maelor : Ou un bon coup de marteau. Un sceau brisé ne brûle plus personne.
- `src/campaign/plateaux/scorpion/scorpionDialogues.ts:110` · `scorpion_buried_library`/3 · Intendant Maelor : Quelques rouleaux bien choisis valent une fortune chez les érudits du Scorpion. Ils ne demanderont pas d’où ils viennent.
- `src/campaign/plateaux/scorpion/scorpionDialogues.ts:117` · `scorpion_buried_library`/looted · Intendant Maelor : Un érudit du Scorpion campait près des ruines. Il a payé les rouleaux sans discuter, et sans demander d’où ils venaient.
- `src/campaign/plateaux/scorpion/scorpionDialogues.ts:130` · `scorpion_temple_seizure_aftermath`/1 · Intendant Maelor : Le codex est à nous. Le Scorpion et le Phénix devront traiter avec ceux qui le tiennent.
- `src/campaign/plateaux/scorpion/scorpionDialogues.ts:136` · `scorpion_sacred_ashes`/3 · Intendant Maelor : Des braises qui ne s’éteignent jamais. Un forgeron en donnerait une fortune, et un érudit davantage.
- `src/campaign/plateaux/scorpion/scorpionDialogues.ts:172` · `scorpion_scholars`/4 · Intendant Maelor : Laissons les érudits travailler. Ce qu’il dira nous servira autant qu’à eux, et le Scorpion saura que nous ne le gênons pas.
- `src/campaign/plateaux/scorpion/scorpionDialogues.ts:197` · `scorpion_audience`/maelor · Intendant Maelor : Ou lisons ce codex avant tout le monde. Un savoir que tous les clans convoitent vaut plus que n’importe quel Sceau, pour qui sait à qui le vendre… Je dis seulement ce que chacun pense devant ce marché.
- `src/campaign/plateaux/scorpion/scorpionDialogues.ts:218` · `scorpion_phoenix_temple`/maelor · Intendant Maelor : Ou gardons-le. Le seul texte qui parle des Ombres, entre nos mains : le Scorpion devra traiter avec nous, et le Phénix aussi.
- `src/campaign/plateaux/scorpion/scorpionDialogues.ts:240` · `scorpion_prophet_traces`/maelor · Intendant Maelor : Celui qui écrivait ici est parti avant nous. Il savait qu’on viendrait le chercher.
- `src/campaign/plateaux/scorpion/scorpionDialogues.ts:286` · `scorpion_corrupted_texts`/maelor · Intendant Maelor : Une page que personne ne devrait lire. Brûlons-la, et n’en parlons plus.
- `src/campaign/plateaux/scorpion/scorpionDialogues.ts:304` · `scorpion_vigil`/3 · Intendant Maelor : Quatre Sceaux, bientôt. Et un codex qui parle des Ombres… Un jour, quelqu’un voudra savoir ce que nous en avons appris. J’aimerais savoir quoi lui répondre.

**Acte final** (7)

- `src/campaign/plateaux/finale/finaleDialogues.ts:82` · `?`/3 · Intendant Maelor : Humiliez-le devant les clans. Qu’ils sachent tous qui nous sommes. Dans cette arène, la victoire justifie tout.
- `src/campaign/plateaux/finale/finaleDialogues.ts:104` · `finale_arrival`/4 · Intendant Maelor : Écrasez-les tous, sans pitié. Personne ne se souvient de la manière, seulement de la victoire.
- `src/campaign/plateaux/finale/finaleDialogues.ts:171` · `finale_breach_confrontation`/1 · Maelor : Vous voilà. Quatre Sceaux, des clans derrière vous ou contre vous… et toujours la même question : à quoi vous servaient-ils vraiment ?
- `src/campaign/plateaux/finale/finaleDialogues.ts:176` · `finale_breach_confrontation`/4 · Maelor : Alors venez. Je compterai ce qu’il restera de vous.
- `src/campaign/plateaux/finale/finaleDialogues.ts:253` · `finale_betrayal`/reveal · Maelor : Vous avez cherché les Ombres Silencieuses dans chaque clan. Elles marchaient avec vous depuis le premier Sceau.
- `src/campaign/plateaux/finale/finaleDialogues.ts:256` · `finale_betrayal`/breach · Maelor : Regardez.
- `src/campaign/plateaux/finale/finaleDialogues.ts:258` · `finale_betrayal`/flee · Maelor : Nous nous reverrons au cœur de la brèche.

### 1.2 Autres répliques sur la chute, les Sceaux ou les Ombres

**Lion** (64)

- [chute] `src/game/content.ts:101` · `acte_ouverture`/1 · Sage Séraphine : Notre clan a perdu ses terres. Dans la salle de votre père, les sièges sont vides ; ceux qui nous juraient fidélité servent déjà d’autres noms. Nous sommes encore là. Mais porter une lignée ne suffit plus à lui donner une place.
- [chute] `src/game/content.ts:125` · `acte_ouverture`/3 · Alistair : J’étais à la porte quand notre bannière est tombée. J’aurais pu partir avec les autres. Je suis resté. Sur la route, je prendrai la première ligne : Marian ne devrait pas avoir à tenir un ennemi à distance pendant qu’elle referme une plaie.
- [chute, Sceaux] `src/game/content.ts:161` · `acte_ouverture`/6 · Elara : Je veillerai à ce que nous ne pouvons pas arrêter avec un bouclier. Depuis la chute, je sens parfois quelque chose répondre aux Sceaux. Je ne sais pas quoi, et nous ne les avons pas encore obtenus. Je préfère vous dire mon doute que vous vendre une certitude.
- [Sceaux] `src/game/content.ts:185` · `acte_ouverture`/8 · Sage Séraphine : Un Sceau peut rouvrir une porte. Il ne rendra ni les morts ni la confiance perdue. Quand vous demanderez à quelqu’un de croire de nouveau en notre clan, laissez-lui aussi le droit de se souvenir.
- [Sceaux] `src/game/content.ts:305` · `lion_briefing`/1 · Chef Alaric : Votre clan réclame une place parmi les grands. Alors prouvez-le. Bois-Clair brûle sous les torches des Serpents. Sauvez ce qui peut encore l’être, et le Sceau du Lion entendra votre nom.
- [Sceaux] `src/game/content.ts:317` · `lion_briefing`/1a · Chef Alaric : Je ne demande pas une parade. Ouvrez la route, atteignez le village et revenez répondre de vos décisions. Mes éclaireurs, les survivants et le Sceau lui-même distingueront un secours d’un pillage opportuniste.
- [chute] `src/game/content.ts:329` · `lion_briefing`/1b · Alistair : Nous ne réclamons pas que le Lion oublie notre défaite. Donnez-nous la route et nous vous donnerons des actes assez solides pour être jugés.
- [Sceaux] `src/game/content.ts:367` · `lion_briefing`/4 · Chef Alaric : Alors marchez. Revenez avec Bois-Clair debout, et le Sceau du Lion entendra votre nom.
- [Ombres] `src/game/content.ts:694` · `mystery_recruit`/2 · Cedric : Marché conclu. L’ombre et moi, nous vieillissons ensemble. Je vous montrerai où frapper — et où ne pas regarder.
- [Sceaux, Ombres] `src/game/content.ts:793` · `mystery_dragon_roost`/2 · Sage Séraphine : Ses écailles résonnent avec les Sceaux. Ce combat peut nous enrichir, ou nous annoncer aux Ombres.
- [Ombres] `src/game/content.ts:926` · `shadow_signs`/1 · Sage Séraphine : Ces marques ne sont pas du Serpent. Le motif est encore entier : conservé ainsi, il pourrait servir de preuve devant Alaric — mais il rayonne comme une balise. Le démonter disperserait cette résonance au prix d’une vérité impossible à montrer entière.
- [Ombres] `src/game/content.ts:931` · `shadow_signs`/ · (choix) : Démonter l’autel et disperser sa résonance.
- [Ombres] `src/game/content.ts:935` · `shadow_signs`/2a · Elara : Je scelle les bords sans toucher au motif. La preuve restera entière, mais sa présence attirera peut-être ceux qui savent la sentir. À partir d’ici, nous transportons aussi une balise.
- [Sceaux] `src/game/content.ts:970` · `lion_finale_judgement`/ · (choix) : Assumer nos actes et réclamer le Sceau.
- [Ombres] `src/game/content.ts:979` · `serpent_general_aftermath`/1 · Sage Séraphine : Le général Serpent est vaincu. Son artefact livre enfin une preuve entière de l’intervention des Ombres.
- [Sceaux] `src/game/content.ts:986` · `lion_trial_aftermath`/1 · Chef Alaric : Mon champion est vaincu. La loi du Lion est sans appel : le Sceau est à vous et j’accepte son jugement.
- [Sceaux] `src/game/content.ts:1078` · `mystery_lancer_recruit`/1 · Garen : Bois-Clair parle encore de votre passage. Certains y voient une dette. D’autres, une blessure. Moi, je veux savoir quel clan vous bâtirez avec le Sceau.
- [Sceaux] `src/game/content.ts:1095` · `mystery_lancer_recruit`/1 · Sage Séraphine : Le Sceau du Lion repose entre vos mains. La voie qui vous l’a donné déterminera désormais la forme de cette alliance.
- [Sceaux] `src/game/content.ts:1149` · `ate_maelor_seal_analysis`/2 · Sage Séraphine : Alors, pour une fois, nos langages disent presque la même chose. Tu parles de poids ; moi de mémoire. Le Sceau ne récompense pas une vertu abstraite : il répond à ce que la compagnie accepte réellement de porter.
- [chute, Sceaux] `src/game/content.ts:1159` · `ate_lion_council_doubt`/1 · Champion du Lion : Les restes du clan déchu. Et on devrait les croire ? Le Sceau n’est pas un prix qu’on remporte pour avoir tué quelques pillards.
- [Sceaux] `src/game/content.ts:1161` · `ate_lion_council_doubt`/3 · Champion du Lion : Et s’ils échouent ? S’ils prennent l’or et fuient ? Le Sceau tombe dans des mains vides, et le Lion perd la seule chose qui le tient debout.
- [Sceaux] `src/game/content.ts:1171` · `ate_ruins_awaken`/2 · Sage Séraphine : Et je déteste les prophéties qui deviennent exactes trop tôt. Mais tu as raison sur un point : quelque chose écoute. La question n’est plus seulement ce que le Sceau nous donnera, mais ce que son porteur rendra visible.
- [Ombres] `src/game/content.ts:1324` · `final_refuge`/2 · Sage Séraphine : Les ruines chantent encore. Les Ombres se réveillent. Ce jugement ne concernera pas seulement le Lion et le Serpent — quelque chose de plus ancien nous observe.
- [Sceaux] `src/game/content.ts:1325` · `final_refuge`/4 · Marian : Derrière nous, des familles attendent de savoir si le Lion protégera encore ses routes. Devant nous, un chef attend de savoir si notre clan mérite son Sceau. Ce sont deux questions différentes, même si nos réponses se croisent.
- [Sceaux] `src/game/content.ts:1334` · `pre_lion_chief`/1 · Chef Alaric : L’épreuve a été demandée ou imposée selon la loi du Lion. Dans les deux cas, son résultat décidera du Sceau.
- [Sceaux] `src/game/content.ts:1336` · `pre_lion_chief`/3 · Champion du Lion : Je suis la lame du Lion. Si vous tombez, le clan meurt avec vous. Si vous tenez, le Sceau est à vous. Prouvez que vous méritez de le porter.
- [chute] `src/game/contextualDialogueContent.ts:212` · `?`/r5-refuge-after-aid · (définition) : Les feux sont bas. Les familles que nous avons aidées viennent d’atteindre les palissades ; elles partagent le reste de nos portions et racontent que la bannière déchue a ralenti pour elles.
- [Sceaux] `src/game/contextualDialogueContent.ts:316` · `?`/bois-clair-contradictory-legacy · (définition) : Deux vérités contradictoires remontent de Bois-Clair : les habitants sauvés et les réserves choisies à leur place. Le Sceau gardera les deux traces ; aucune ne doit effacer l’autre.
- [Sceaux] `src/game/contextualDialogueContent.ts:325` · `?`/bois-clair-sacrificed · (définition) : Même d’ici, je sens la fracture : ils ont choisi ce qui permettait au village de durer, et des personnes ont payé ce calcul immédiatement. Le Sceau ne simplifiera pas cette contradiction pour nous.
- [Sceaux] `src/game/contextualDialogueContent.ts:334` · `?`/bois-clair-saved-honour · (définition) : Même d’ici, je le sens : ils ont choisi les captifs en sachant qu’ils abandonnaient les réserves et les puits. Le Sceau répond à ce sacrifice, pas à une victoire sans coût.
- [Sceaux] `src/game/contextualDialogueContent.ts:343` · `?`/bois-clair-saved-mixed · (définition) : Bois-Clair tient encore, mais la route qui y mène n’est pas devenue pure pour autant. Le Sceau semble garder les décisions ensemble au lieu de choisir pour nous laquelle mérite d’être oubliée.
- [Sceaux] `src/game/contextualDialogueContent.ts:357` · `?`/witnesses-silenced · (définition) : Alors leur dossier porte une voix étouffée. Qu’ils viennent quand même : le Sceau ne sera pas remis à ceux qui achètent le silence.
- [Sceaux] `src/game/contextualDialogueContent.ts:367` · `?`/bois-clair-contradictory-legacy · (définition) : Alors examinons cette contradiction avant de décider du Sceau. Leur jugement reste à rendre.
- [Sceaux] `src/game/contextualDialogueContent.ts:375` · `?`/witnesses-supportive · (définition) : Les survivants de Bois-Clair ont choisi de parler librement. Leur témoignage compte, mais il ne suffit pas à leur remettre le Sceau.
- [Sceaux] `src/game/contextualDialogueContent.ts:377` · `?`/witnesses-supportive · (définition) : Des témoins libres, alors. Leur parole n’offre pas le Sceau, mais elle interdit que nous jugions ces étrangers sur de simples rumeurs.
- [Sceaux] `src/game/contextualDialogueContent.ts:385` · `?`/witnesses-unprotected · (définition) : Les survivants de Bois-Clair ont pris la route sans la protection de cette compagnie. Voilà une raison concrète de rester prudent avant de leur confier le Sceau.
- [Sceaux] `src/game/contextualDialogueContent.ts:398` · `?`/established-merits-without-testimony · (définition) : Alors gardons ces actes dans le dossier. Ils comptent, sans décider à eux seuls de l’attribution du Sceau.
- [Sceaux] `src/game/contextualDialogueContent.ts:406` · `?`/witnesses-none · (définition) : Aucun témoignage décisif ne nous est encore parvenu. Avant de leur confier le Sceau, il faut examiner les actes de cette compagnie.
- [Sceaux] `src/game/contextualDialogueContent.ts:408` · `?`/witnesses-none · (définition) : L’absence de témoignage ne tranche pas leur dossier. Examinons les traces de leur route avant de décider du Sceau.
- [Ombres] `src/game/contextualDialogueContent.ts:421` · `?`/shadow-evidence · (définition) : Ils ont préservé les marques des Ombres intactes. Ce ne sont plus des soupçons : ils transportent une preuve que le Lion pourra lire.
- [Sceaux, Ombres] `src/game/contextualDialogueContent.ts:473` · `?`/shadow-revealed · (définition) : Alaric connaît les preuves que nous avons déposées. Vaincre le général décidera du Sceau — et donnera au Lion une cible réelle derrière les Ombres.
- [Sceaux, Ombres] `src/game/contextualDialogueContent.ts:482` · `?`/shadow-concealed · (définition) : Nos preuves restent cachées au Lion. Vaincre le général décidera du Sceau, mais nous porterons seuls la vérité des Ombres au-delà de ce combat.
- [Sceaux, Ombres] `src/game/contextualDialogueContent.ts:495` · `?`/shadow-revealed · (définition) : Cette épreuve décidera seulement du Sceau. Les preuves des Ombres que vous avez révélées restent vraies, quel que soit votre dossier devant le Lion.
- [Sceaux] `src/game/contextualDialogueContent.ts:504` · `?`/shadow-concealed · (définition) : Cette épreuve décidera seulement du Sceau. Les preuves que vous gardez cachées ne pèseront pas dans le jugement du Lion.
- [Ombres] `src/game/lionFinale.ts:295` · `?`/ · (définition) : Révéler les preuves des Ombres.
- [Ombres] `src/game/lionFinale.ts:309` · `?`/shadow · Chef Alaric : Les preuves des Ombres sont déjà entre mes mains. Cette vérité donne du poids à votre avertissement, pas une absolution pour vos autres actes.
- [Sceaux] `src/game/lionFinale.ts:449` · `?`/ · (définition) : Assumer nos actes et réclamer le Sceau.
- [Sceaux, Ombres] `src/game/lionFinale.ts:479` · `?`/3 · Sage Séraphine : L’artefact pulse entre ses mains. Le vaincre décidera du Sceau, mais aussi de ce que nous saurons réellement des Ombres.
- [Sceaux] `src/game/lionFinale.ts:494` · `?`/3 · Champion du Lion : Si vous tombez, le Sceau reste ici. Si vous tenez, il sera vôtre et Alaric acceptera le jugement. En garde.
- [Sceaux] `src/game/lionFinale.ts:585` · `?`/3 · Sage Séraphine : Le premier Sceau est acquis. Ce n’est pas la fin de cette route : c’est la première preuve de ce que notre clan choisit de devenir quand personne ne peut choisir à sa place.
- [Sceaux] `src/game/plateauFinale.ts:193` · `?`/ · (choix) : Assumer nos actes et réclamer le Sceau.
- [chute] `src/game/r5NarrativeContent.ts:94` · `pre_serpent_reprisals`/2 · Alistair : Vous vouliez une bannière à clouer aux arbres. Approchez et découvrez si un clan déchu est vraiment une proie plus facile.
- [Sceaux] `src/game/r5NarrativeContent.ts:126` · `pre_ruins_guardians`/2 · Sage Séraphine : Nous devons traverser sans détruire les marques gravées. Elles appartiennent peut-être au secret que les Serpents tentent de transporter jusqu’au Sceau.
- [chute] `src/game/r5NarrativeContent.ts:142` · `post_serpent_hunters`/2 · Sage Séraphine : Alors nous ferons de votre survie une défaite durable. Restez au centre de la compagnie ; votre témoignage doit atteindre le camp, pas seulement la prochaine embuscade.
- [Ombres] `src/game/r5NarrativeContent.ts:165` · `post_young_dragon_roost`/1 · Elara : La bête s’éloigne, blessée, et le nid cesse de luire. Sous les gemmes, les mêmes veines sombres que dans les ruines courent à travers la roche.
- [Sceaux] `src/game/r5NarrativeContent.ts:166` · `post_young_dragon_roost`/2 · Sage Séraphine : Ce combat n’était pas isolé. Quelque chose trouble les créatures autour du Sceau. Prenez les gemmes promises, mais ne confondez pas récompense et réponse.
- [Sceaux] `src/game/r5NarrativeContent.ts:187` · `ate_bois_clair_night_watch`/3 · Alistair : Le clan aussi devra vivre avec ce choix. Reconstruire un nom ne signifie pas effacer sa route ; cela signifie pouvoir la raconter sans détour quand Alaric demandera le prix du Sceau.
- [chute] `src/game/r5NarrativeContent.ts:218` · `rep_event_serpent_rumour_market`/ · (choix) : Raconter publiquement la chute du clan.
- [chute] `src/game/r5NarrativeContent.ts:222` · `rep_event_serpent_rumour_market`/3 · Colporteuse : Un héritier sans terre qui raconte sa propre défaite : voilà une histoire que les tavernes répéteront. En retour, retenez ceci — les Serpents craignent qu’on lise leurs ordres.
- [Sceaux] `src/game/r5NarrativeContent.ts:232` · `rep_event_fallen_banner_claimant`/1 · Émissaire sans fief : Votre nom remonte dans les conversations. Mon maître peut déclarer publiquement qu’il vous a toujours soutenus. En échange, il veut que votre première proclamation après le Sceau cite sa maison.
- [chute] `src/game/r5NarrativeContent.ts:235` · `rep_event_fallen_banner_claimant`/ · (choix) : Refuser de prêter la chute du clan.
- [Sceaux] `src/game/reputationEventContent.ts:289` · `?`/claimant-after-infamy · (définition) : Votre nom remonte dans les conversations, accompagné de récits difficiles. Mon maître peut rendre votre retour plus présentable s’il est cité dans votre première proclamation après le Sceau.
- [Sceaux] `src/game/reputationEventContent.ts:298` · `?`/claimant-after-honour · (définition) : Vos actes rendent de nouveau votre bannière fréquentable. Mon maître peut déclarer publiquement qu’il vous a toujours soutenus, si votre première proclamation après le Sceau cite sa maison.
- [chute] `src/game/reputationEventContent.ts:382` · `?`/intimidation-low-standing · (définition) : Votre bannière déchue ne fait plus peur à grand monde. Les Serpents réclament leur tribut : payez le passage, ou défendez votre nom devant tous ceux qui regardent.

**Ours** (13)

- [Sceaux] `src/campaign/plateaux/bear/bearDialogues.ts:60` · `bear_arrival`/1 · Marian : Les Montagnes de la Résilience. Le Sceau du Lion pèse dans notre coffre, et pourtant ici personne ne nous attend.
- [Sceaux] `src/campaign/plateaux/bear/bearDialogues.ts:61` · `bear_arrival`/2 · Sage Séraphine : Le Clan de l’Ours garde ces pentes depuis plus longtemps que nos chroniques. Il ne juge pas un étranger sur un Sceau, mais sur ce qu’il fait de sa montagne.
- [Sceaux] `src/campaign/plateaux/bear/bearDialogues.ts:67` · `bear_raven_messenger`/3 · Messager du Corbeau : Prenez cette bourse. Montez, regardez ailleurs quand nos chariots passent, et redescendez avec votre Sceau. Personne n’aura à saigner.
- [Ombres] `src/campaign/plateaux/bear/bearDialogues.ts:107` · `bear_ancient_relic`/1 · Kestrel : Cette galerie s’est effondrée il y a longtemps. Sous la poussière, un objet sculpté : un ours dressé, taillé dans une pierre sombre et sertie d’une gemme rouge.
- [Sceaux] `src/campaign/plateaux/bear/bearDialogues.ts:153` · `bear_master_spy_aftermath`/1 · Maître Espion du Corbeau : Le minerai… n’en était qu’une part. Ceux que nous servons ont besoin de bien d’autres choses, et vos Sceaux n’y changeront rien.
- [Ombres] `src/campaign/plateaux/bear/bearDialogues.ts:154` · `bear_master_spy_aftermath`/2 · Sage Séraphine : Les Ombres, encore, derrière un autre clan. Le Corbeau n’était qu’une main de plus.
- [Sceaux] `src/campaign/plateaux/bear/bearDialogues.ts:157` · `bear_trial_aftermath`/1 · Ancien Ours Borin : Le Sceau est à vous. La montagne l’a vu, mes guerriers aussi. Ne revenez pas chercher autre chose ici.
- [Sceaux] `src/campaign/plateaux/bear/bearDialogues.ts:180` · `bear_audience`/request · Ancien Ours Borin : Repoussez le Corbeau hors des galeries, et le Sceau de l’Ours entendra votre nom. Échouez, ou servez-vous en chemin, et la montagne s’en souviendra.
- [Ombres] `src/campaign/plateaux/bear/bearDialogues.ts:278` · `bear_dark_vein`/sealed · Sage Séraphine : Je le scelle dans un coffre doublé de plomb. Borin devra le voir, et d’autres après lui.
- [Sceaux] `src/campaign/plateaux/bear/bearDialogues.ts:286` · `bear_master_spy_pre_combat`/2 · Ancien Ours Borin : Celui qui commandait le Corbeau fuit vers les hauteurs : son Maître Espion. Ramenez-le, ou empêchez-le de revenir, et le Sceau de l’Ours scellera notre alliance.
- [Ombres] `src/campaign/plateaux/bear/bearFinale.ts:51` · `?`/ · (définition) : Vous avez chassé le Corbeau, c’est vrai. Puis vous avez gardé le filon sombre pour votre clan, dans une montagne qui ne vous appartient pas.
- [Ombres] `src/campaign/plateaux/bear/bearFinale.ts:65` · `?`/ · (définition) : Voici l’éclat du filon sombre que nous avons scellé. Il ne ressemble à aucun minerai de cette montagne, Ancien. Ce que le Corbeau creusait ne servait pas seulement le Corbeau.
- [Sceaux] `src/campaign/plateaux/heroMeetings.ts:88` · `?`/gunnar_price · Gunnar : Cent vingt pièces, et mon canon est à vous jusqu’au dernier Sceau.

**Dragon** (11)

- [Sceaux] `src/campaign/plateaux/dragon/dragonDialogues.ts:64` · `dragon_arrival`/1 · Elara : Les Pics Célestes. Deux Sceaux dans notre coffre, et la montagne la plus haute que nous ayons jamais gravie.
- [Sceaux] `src/campaign/plateaux/dragon/dragonDialogues.ts:137` · `dragon_shaman_aftermath`/1 · Chaman des Ombres : Le Cristal… n’était qu’un écho. Ceux que je sers écoutent d’autres échos, partout où vos Sceaux vous mènent.
- [Ombres] `src/campaign/plateaux/dragon/dragonDialogues.ts:138` · `dragon_shaman_aftermath`/2 · Sage Séraphine : Les Ombres, derrière un troisième clan. Le Loup n’était qu’une main de plus, comme le Corbeau avant lui.
- [Sceaux] `src/campaign/plateaux/dragon/dragonDialogues.ts:141` · `dragon_trial_aftermath`/1 · Ancien Dragon Kaelen : Le Sceau est à vous. Les Pics l’ont vu. Ne comptez plus sur la sagesse du Dragon le jour où vous en aurez besoin.
- [Sceaux] `src/campaign/plateaux/dragon/dragonDialogues.ts:185` · `dragon_audience`/request · Ancien Dragon Kaelen : Le Dragon ne demande pas d’aide ; il en accepte, quand elle est digne. Rapportez le Cristal, et le Sceau du Dragon entendra votre nom.
- [Ombres] `src/campaign/plateaux/dragon/dragonDialogues.ts:203` · `dragon_wolf_lair`/pact · Chef du Clan du Loup : Les étrangers de la trêve. Le pacte scellé avec notre émissaire tient toujours ? Alors laissez le Cristal où il est, et partagez les vallées avec nous.
- [Ombres] `src/campaign/plateaux/dragon/dragonDialogues.ts:301` · `dragon_shaman_pre_combat`/1 · Ancien Dragon Kaelen : Le Cristal a été altéré par une énergie sombre. Le Loup ne l’a pas volé pour lui-même : un Chaman des Ombres le tenait sous son influence.
- [Sceaux] `src/campaign/plateaux/dragon/dragonDialogues.ts:302` · `dragon_shaman_pre_combat`/2 · Ancien Dragon Kaelen : Ce chaman s’est enfui vers les cimes. Traquez-le et purgez cette menace, et le Sceau du Dragon scellera notre alliance.
- [Ombres] `src/campaign/plateaux/dragon/dragonDialogues.ts:331` · `dragon_kaelen_pre_combat`/lion · Kestrel : Ce n’est pas le premier jeune dragon que nous croisons. Dans les terres du Lion, nous avions scellé un nid sans y toucher.
- [Ombres] `src/campaign/plateaux/dragon/dragonDialogues.ts:337` · `dragon_young_dragon`/2 · Sage Séraphine : La même énergie sombre que sur les créatures des crêtes. Il peut guérir, si nous l’aidons.
- [Ombres] `src/campaign/plateaux/dragon/dragonFinale.ts:66` · `?`/ · (définition) : Voici l’éclat de la souillure que nous avons scellé près de l’autel. Le Cristal n’a pas seulement été volé, Ancien : une énergie sombre l’a touché.

**Scorpion** (10)

- [Sceaux] `src/campaign/plateaux/scorpion/scorpionDialogues.ts:62` · `scorpion_arrival`/1 · Kestrel : Les Déserts Arides. Trois Sceaux dans notre coffre, et un soleil qui ne pardonne rien.
- [Ombres] `src/campaign/plateaux/scorpion/scorpionDialogues.ts:146` · `scorpion_prophet_aftermath`/2 · Sage Séraphine : Les Ombres, derrière un quatrième clan. Le Phénix n’a pas choisi seul sa haine du Scorpion : on la lui a soufflée.
- [Sceaux] `src/campaign/plateaux/scorpion/scorpionDialogues.ts:149` · `scorpion_trial_aftermath`/1 · Grand Inquisiteur : Le Sceau est à vous. Mes érudits l’ont consigné. Ne comptez plus sur le savoir du Scorpion le jour où vous en aurez besoin.
- [Ombres] `src/campaign/plateaux/scorpion/scorpionDialogues.ts:193` · `scorpion_audience`/open · Grand Inquisiteur : Le Clan du Phénix garde dans son temple un codex prophétique, plus ancien que nos deux clans. Il pourrait révéler la vraie nature des Ombres Silencieuses.
- [Sceaux] `src/campaign/plateaux/scorpion/scorpionDialogues.ts:195` · `scorpion_audience`/request · Grand Inquisiteur : Le Phénix est trop idéaliste pour comprendre ce qu’il garde. Il prie devant ses flammes purificatrices et laisse dormir le seul texte qui pourrait nous armer. Rapportez-moi ce codex, et le Sceau du Scorpion entendra votre nom.
- [Sceaux] `src/campaign/plateaux/scorpion/scorpionDialogues.ts:198` · `scorpion_audience`/alistair · Kestrel : Nous sommes venus chercher un Sceau, pas un savoir à revendre.
- [Ombres] `src/campaign/plateaux/scorpion/scorpionDialogues.ts:310` · `scorpion_prophet_pre_combat`/1 · Grand Inquisiteur : Le codex parle d’un Prophète des Ombres. Il manipule les croyances des clans : il a soufflé au Phénix ses peurs, et peut-être au Scorpion les siennes.
- [Sceaux] `src/campaign/plateaux/scorpion/scorpionDialogues.ts:311` · `scorpion_prophet_pre_combat`/2 · Grand Inquisiteur : Il s’est enfui dans les dunes. Traquez-le, empêchez ses fausses prophéties de se répandre, et le Sceau du Scorpion scellera notre alliance.
- [Ombres] `src/campaign/plateaux/scorpion/scorpionFinale.ts:54` · `?`/ · (définition) : Vous avez pris le codex au Phénix, c’est vrai. Puis vous avez gardé le codex pour votre clan, comme si la vérité sur les Ombres se rangeait dans un coffre.
- [Ombres] `src/campaign/plateaux/scorpion/scorpionFinale.ts:68` · `?`/ · (définition) : Voici la page souillée que nous avons scellée. Les Ombres ne se contentent pas de voler ou de souiller, Grand Inquisiteur : les Ombres écrivent aussi, et elles écrivent dans la foi des autres.

**Acte final** (23)

- [Sceaux] `src/campaign/plateaux/finale/finaleDialogues.ts:100` · `finale_arrival`/1 · Alistair : Quatre Sceaux. L’Arène des Destins nous ouvre ses portes, et toutes les bannières des clans flottent au-dessus des tribunes.
- [Ombres] `src/campaign/plateaux/finale/finaleDialogues.ts:103` · `finale_arrival`/3 · Sage Séraphine : Ne laissez pas l’orgueil choisir à votre place. Ce Tournoi est une épreuve de force, mais aussi de sagesse. Et quelque chose de sombre plane sur cette arène : je le sens depuis que nous avons passé les portes.
- [Ombres] `src/campaign/plateaux/finale/finaleDialogues.ts:139` · `finale_arena_chaos`/1 · Kestrel : Des démons sortent de la brèche. Dans les tribunes, la foule se piétine pour atteindre les portes.
- [Ombres] `src/campaign/plateaux/finale/finaleDialogues.ts:141` · `finale_arena_chaos`/3 · Sage Séraphine : Si nous restons, il faudra tenir l’arène le temps qu’ils passent. Le champion changé en démon ne nous laissera pas partir sans combat.
- [Ombres] `src/campaign/plateaux/finale/finaleDialogues.ts:150` · `finale_arena_assault_aftermath`/1 · Sage Séraphine : Le champion est tombé une seconde fois. La brèche, elle, grandit encore.
- [Ombres] `src/campaign/plateaux/finale/finaleDialogues.ts:154` · `finale_capital_arrival`/1 · Alistair : La capitale. Des rues entières en flammes, et la brèche ouverte au-dessus des toits.
- [Sceaux, Ombres] `src/campaign/plateaux/finale/finaleDialogues.ts:155` · `finale_capital_arrival`/2 · Sage Séraphine : Maelor nous attend au cœur de la brèche. Tout ce que nous avons vu des Ombres, depuis le premier Sceau, mène là.
- [Ombres] `src/campaign/plateaux/finale/finaleDialogues.ts:156` · `finale_capital_arrival`/3 · Kestrel : Les démons tiennent les rues qui descendent de l’arène. Il faudra passer par elles.
- [Ombres] `src/campaign/plateaux/finale/finaleDialogues.ts:159` · `finale_trapped_citizens`/1 · Kestrel : Une rue effondrée. Il y a des voix sous les décombres.
- [Ombres] `src/campaign/plateaux/finale/finaleDialogues.ts:161` · `finale_trapped_citizens`/3 · Sage Séraphine : Chaque heure compte. Mais ce sont ces gens que la brèche dévorera les premiers.
- [Ombres] `src/campaign/plateaux/finale/finaleDialogues.ts:180` · `finale_breach_aftermath`/2 · Sage Séraphine : L’entité est tombée à son tour. La brèche vacille, mais elle est encore ouverte.
- [Ombres] `src/campaign/plateaux/finale/finaleDialogues.ts:185` · `finale_act_end`/1 · Sage Séraphine : Refermer la brèche, maintenant. Ce qui suivra dépendra de tout ce que nous avons fait depuis Bois-Clair.
- [Ombres] `src/campaign/plateaux/finale/finaleDialogues.ts:257` · `finale_betrayal`/champion · Sage Séraphine : La brèche… Elle s’ouvre au cœur de l’arène. Le champion du Serpent se relève, et ce n’est plus un homme.
- [Sceaux] `src/campaign/plateaux/finale/finaleDialogues.ts:261` · `finale_betrayal`/marian · Marian : “Je dis seulement…” Il nous l’a répété à chaque Sceau. C’était pour eux qu’il parlait.
- [Sceaux] `src/campaign/plateaux/finale/finaleDialogues.ts:289` · `finale_pre_serpent_final`/bear · Kestrel : Des guerriers de l’Ours rôdent dans les rues : les guerriers de Borin n’ont pas oublié le Sceau arraché.
- [Ombres] `src/campaign/plateaux/finale/finaleDialogues.ts:313` · `finale_allied_rally`/go · Alistair : Alors avançons. La brèche n’attendra pas.
- [Sceaux, Ombres] `src/campaign/plateaux/finale/finaleDialogues.ts:340` · `finale_last_vigil`/1 · Alistair : La dernière nuit avant la brèche. Plus de Sceau à gagner : seulement ce que nous avons fait pour en arriver là.
- [Sceaux, Ombres] `src/campaign/plateaux/finale/finaleEpilogues.ts:164` · `?`/breach · Sage Séraphine : La brèche se referme. Tous ensemble, maintenant : c’est pour cela que les Sceaux nous ont été donnés.
- [Ombres] `src/campaign/plateaux/finale/finaleEpilogues.ts:172` · `?`/acclaim · Kestrel : Les clans vous acclament. Ils se rassemblent sous votre bannière pour reconstruire ce que la brèche a brûlé.
- [Ombres] `src/campaign/plateaux/finale/finaleEpilogues.ts:197` · `?`/breach · Sage Séraphine : La brèche se referme. Le monde tient encore, mais il ne sera plus jamais le même.
- [Ombres] `src/campaign/plateaux/finale/finaleEpilogues.ts:215` · `?`/breach · Sage Séraphine : La brèche se referme. Les Ombres Silencieuses sont vaincues, et personne ne s’en réjouit avec nous.
- [Ombres] `src/campaign/plateaux/finale/finaleEpilogues.ts:226` · `?`/demand · Sage Séraphine : Ils vous craignent plus que la brèche, Alistair. Ils exigent qu’on vous livre, pour acheter leur paix.
- [chute] `src/campaign/plateaux/finale/finaleEpilogues.ts:246` · `?`/clan · Marian : Les clans tiendront parole : votre clan vivra, mais déchu, une fois de plus.

### 1.3 Répliques construites selon l'état (relevé à la main)

**Maelor**

- `bearDialogues.ts:204` · `bear_ore_convoy`/maelor : suffixe si `missionGreed`, « À Bois-Clair, la bourse du clan nous a tenus debout. Je ne vois pas pourquoi la montagne serait différente. »
- `bearDialogues.ts:251` · `bear_miners_testimony`/maelor :
  - si les mines ont été prises ou abandonnées, « Ils ont vu ce que nous avons fait des galeries. Si nous les laissons descendre, Borin l’entendra de leur bouche. » ;
  - sinon, « Ils parlent beaucoup, et ce qu’ils diront ne nous appartiendra plus une fois en bas. »
- `dragonDialogues.ts:240` · `dragon_freed_pilgrims`/maelor :
  - si le Cristal a été gardé ou laissé au Loup, « Ils ont vu ce que nous avons fait du Cristal. S’ils parlent à Kaelen, nous n’aurons plus rien à expliquer. » ;
  - sinon, « Ils parlent beaucoup, et ce qu’ils diront ne nous appartiendra plus une fois devant Kaelen. »
- `dragonDialogues.ts:270` · `dragon_crystal_altar`/ore :
  - avec l'éclat de l'Ours, « Et c’est la même souillure que l’éclat du filon sombre, dans notre coffre depuis les montagnes de l’Ours. » ;
  - sinon, « Les Ombres ne laissent jamais qu’une trace par endroit. Il faudra les suivre ailleurs. »
- `scorpionDialogues.ts:254` · `scorpion_temple_witnesses`/maelor :
  - si le codex a été gardé ou protégé, « Ils ont vu ce que nous avons fait du codex. S’ils parlent au Grand Inquisiteur, nous n’aurons plus rien à expliquer. » ;
  - sinon, « Des fidèles du Phénix devant le Grand Inquisiteur… Il les écoutera, puis il les gardera. Le Scorpion ne laisse jamais repartir un témoin. »
- `lionFinale.ts:429` et `plateauFinale.ts:185` · jugements, étape `stains` : « Mes comptes gardent aussi … »
- `lionFinale.ts:556-580` · `epilogue`/2, au Lion : la vérité des Ombres, révélée ou tue, selon la route et ce que la compagnie savait (sept variantes, dont « L’artefact récupéré reste le secret de votre compagnie. Le Lion célèbre la victoire sans savoir quelle menace ancienne se cachait derrière elle. »).
- `bearFinale.ts:93`, `dragonFinale.ts:94`, `scorpionFinale.ts:96` · épilogues des plateaux, étape `ore`, avec ou sans preuve :
  - Ours : « L’éclat du filon sombre voyage avec nous, scellé dans un coffre. Encore un poids que les Sceaux nous font porter. Je me demande parfois lequel de ces fardeaux nous mène vraiment quelque part. » ;
  - Dragon : « Chaque Sceau ajoute une pièce à un tableau que je n’aime pas regarder. » ;
  - Scorpion : « Je n’aime pas ce que ce tableau commence à montrer. »
- `finaleDialogues.ts:222-233` · `finale_betrayal`/boisclair, trois variantes (OD-2026-11-13-F, N2) :
  - butin et silence, « Tout a commencé à Bois-Clair. Je vous ai dit que la porte basse était notre bourse, et vous avez emporté les coffres. Puis, quand les survivants ont voulu parler, vous leur avez imposé le silence. » ;
  - butin seul, « Tout a commencé à Bois-Clair. Je vous ai dit que la porte basse était notre bourse, et vous avez emporté les coffres pendant que les captifs partaient au nord. » ;
  - silence seul, « Tout a commencé à Bois-Clair. Quand les survivants ont voulu parler, il n’y avait plus de silence à acheter : vous leur avez imposé le silence. »
- `finaleDialogues.ts:235-246` · `finale_betrayal`/advice, cinq variantes. Les trois premières finissent par « vous avez servi ceux que je sers, et vos Sceaux m’ont ouvert cette arène. » Après Bois-Clair : « Depuis, vous ne m’avez plus écouté. Peu importe : il me suffisait d’entrer avec vous dans cette arène. » Sinon : « Vous ne m’avez jamais écouté. Peu importe : il me suffisait d’entrer avec vous dans cette arène. »

**Sur Maelor**

- `finaleEpilogues.ts:135-137` · son sort, dit par Kestrel dans chaque fin (N3) :
  - Respect, « …les clans ne retiendront de lui qu’un nom qu’on ne prononce plus. » ;
  - Équilibre, « …certains clans se demandent encore combien de ses conseils nous avons suivis. » ;
  - Peur, « Pour les clans, il était des nôtres jusqu’au bout, et c’est aussi pour cela qu’ils nous craignent. »
- `finaleDialogues.ts:327` · `finale_last_vigil`/evidence : « Voici ce que nous savons des Ombres : … La même marque, partout où Maelor nous a suivis. »

### 1.4 Prologue (non modifiable ici)

`src/game/prologue.ts:10` : « Votre nom fut jadis prononcé parmi les grands. Puis vinrent la défaite, les serments rompus et les bannières brisées. » La confession lui donne sa cause, sans le contredire.

### 1.5 Les indices déjà en place

Le jeu porte déjà des indices sur la mission de Maelor. La confession les rend lisibles après coup :

- **Le Lion.**
  - Il pose la quête des Sceaux dès le camp (`acte_ouverture`/2) et dit « celle que nous avons perdue » d'une place qu'il n'a jamais eue.
  - Séraphine : « Un Sceau peut rouvrir une porte. »
  - Elara : « Depuis la chute, je sens parfois quelque chose répondre aux Sceaux. »
  - Les deux scènes de Maelor et Séraphine : « J’ai passé des années à traiter les Sceaux comme des leviers », « ce qui se réveille derrière lui », « S’il ouvre des portes, certaines donnent peut-être sur des choses qu’aucun clan raisonnable ne devrait réveiller ».
  - Le conseil de taire l'artefact des Ombres à Alaric.
- **L'Ours, le Dragon et le Scorpion.**
  - À chaque audience, « laissons X et Y s’user l’un contre l’autre… Je dis seulement… ». C'est la méthode même de la chute.
  - Au repaire du Dragon et à la cellule du Prophète, il sait que l'agent des Ombres était parti avant eux.
  - Il veut lire le codex « avant tout le monde ».
  - Il veut brûler la page souillée.
  - Aux veillées, « à quoi ils nous servent vraiment ».
  - Le Prophète vaincu : « Ceux que je sers n’ont besoin que de mots, et d’un clan prêt à y croire. »

Ce qui manque : un lien entre Maelor et la chute, l'idée qu'il est arrivé après elle, et ce que les Sceaux ouvrent.

## 2. La confession à la trahison

Scène `finale_betrayal` (`src/campaign/plateaux/finale/finaleDialogues.ts:248-263`).

Distribution : Kestrel, Maelor, Séraphine, Alistair et Marian, comme aujourd'hui. Aucun nouvel acteur n'entre. La mise en scène garde ses sous-ensembles de quatre acteurs au plus.

Le principe : la scène monte par paliers. D'abord ce que le joueur a fait sur son conseil (existant). Puis Alistair demande « Pourquoi nous ? ». Maelor avoue alors le plan entier : la chute, son entrée dans le clan, les Sceaux comme mesure, puis comme clé. Il finit sur « Regardez. », qui ouvre la brèche comme aujourd'hui. Au plus fort, Maelor dit trois répliques de suite, contre quatre dans la scène actuelle quand la réplique de Bois-Clair est présente.

**Texte actuel** (étapes, dans l'ordre) :

| Étape | Qui | Texte |
| --- | --- | --- |
| open | Kestrel | Le champion du Serpent tombe… et Maelor s’avance au milieu de l’arène, un artefact à la main. |
| reveal | Maelor | Vous avez cherché les Ombres Silencieuses dans chaque clan. Elles marchaient avec vous depuis le premier Sceau. |
| boisclair (selon l'état) | Maelor | une des trois variantes de Bois-Clair |
| advice | Maelor | une des cinq variantes des conseils suivis |
| breach (`finaleBreachOpened`) | Maelor | Regardez. |
| champion | Séraphine | La brèche… Elle s’ouvre au cœur de l’arène. Le champion du Serpent se relève, et ce n’est plus un homme. |
| flee | Maelor | Nous nous reverrons au cœur de la brèche. |
| alistair | Alistair | Maelor ! |
| marian | Marian | “Je dis seulement…” Il nous l’a répété à chaque Sceau. C’était pour eux qu’il parlait. |

**Texte proposé** (C1). Trois étapes nouvelles entre `advice` et `breach`, et le texte de `breach` complété. Le reste est inchangé.

| Étape | Qui | Texte |
| --- | --- | --- |
| why (nouvelle) | Alistair | Pourquoi nous ? |
| fall (nouvelle) | Maelor | Parce qu’il me fallait un clan à terre. Votre chute, c’est moi : j’ai soufflé à chaque clan ce qu’il voulait croire de vous, et vos alliés ont rompu leurs serments l’un après l’autre. |
| join (nouvelle) | Maelor | Puis je suis venu tenir vos comptes. Un clan déchu fait tout pour se relever ; je n’avais qu’à faire des Sceaux la mesure de votre valeur. Aucun seigneur ne me les aurait remis. À vous, ils les ont donnés un à un. |
| breach (`finaleBreachOpened`, texte retouché) | Maelor | Vos Sceaux : votre réussite, votre valeur… et la clé de la faille où les démons sont scellés. Regardez. |

Ce que chaque réplique sert dans l'intention :

- **« Pourquoi nous ? »** pose la question de la nécessité.
- **« un clan à terre »** répond à cette nécessité.
- **« Votre chute, c’est moi »** dit la conspiration. Les clans retournés n'ont pas de nom. « Soufflé » reprend le verbe des Ombres au Scorpion (« on la lui a soufflée », « il a soufflé au Phénix ses peurs »). Les serments rompus sont ceux du prologue, et « l’un après l’autre » renvoie à l'indice du Lion (I1).
- **« Puis je suis venu tenir vos comptes »** dit l'entrée dans le clan après la chute. C'est l'intendant qui parle.
- **« Un clan déchu fait tout pour se relever »** dit la déchéance et la quête de renouveau.
- **« faire des Sceaux la mesure de votre valeur »** reprend « les sceaux seront le succès de notre réussite et valeur ».
- **« Aucun seigneur ne me les aurait remis »** dit pourquoi il fallait le clan. Les Sceaux jugent les actes (prologue) et sont remis par les seigneurs.
- **« la clé de la faille où les démons sont scellés »** reprend « la clé pour ouvrir la faille scellée des démons ». Le comment n'est pas dit. Les Sceaux restent à la compagnie, qui s'en sert pour refermer la brèche dans les fins : Marian, « Ils nous servaient à refermer ce que tu ouvres », et Séraphine, « c’est pour cela que les Sceaux nous ont été donnés ».

**Variante C1-b** (pour la question 1) : garder « Regardez. » seul, et mettre la clé dans une étape à part, juste avant :

| Étape | Qui | Texte |
| --- | --- | --- |
| key (nouvelle) | Maelor | Vos Sceaux ont fait votre réussite et votre valeur. Ils sont aussi la clé de la faille où les démons sont scellés. |
| breach | Maelor | Regardez. |

Maelor dit alors quatre répliques de suite.

**Exemple joué** (butin à Bois-Clair, filon de l'Ours gardé) :

> Kestrel : Le champion du Serpent tombe… et Maelor s’avance au milieu de l’arène, un artefact à la main.
> Maelor : Vous avez cherché les Ombres Silencieuses dans chaque clan. Elles marchaient avec vous depuis le premier Sceau.
> Maelor : À Bois-Clair déjà, je vous ai dit que la porte basse était notre bourse, et vous avez emporté les coffres pendant que les captifs partaient au nord. *(avec la retouche R1)*
> Maelor : Vous m’avez écouté plus souvent que vous ne le croyez : le filon sombre gardé pour le clan. Chaque fois, vous avez servi ceux que je sers, et vos Sceaux m’ont ouvert cette arène.
> Alistair : Pourquoi nous ?
> Maelor : Parce qu’il me fallait un clan à terre. Votre chute, c’est moi : j’ai soufflé à chaque clan ce qu’il voulait croire de vous, et vos alliés ont rompu leurs serments l’un après l’autre.
> Maelor : Puis je suis venu tenir vos comptes. Un clan déchu fait tout pour se relever ; je n’avais qu’à faire des Sceaux la mesure de votre valeur. Aucun seigneur ne me les aurait remis. À vous, ils les ont donnés un à un.
> Maelor : Vos Sceaux : votre réussite, votre valeur… et la clé de la faille où les démons sont scellés. Regardez.
> Séraphine : La brèche… Elle s’ouvre au cœur de l’arène. Le champion du Serpent se relève, et ce n’est plus un homme.
> Maelor : Nous nous reverrons au cœur de la brèche.
> Alistair : Maelor !
> Marian : “Je dis seulement…” Il nous l’a répété à chaque Sceau. C’était pour eux qu’il parlait.

**Exemple joué** (aucun conseil suivi, rien à Bois-Clair) : la même scène, avec « Vous ne m’avez jamais écouté. Peu importe : il me suffisait d’entrer avec vous dans cette arène. » à la place des deux répliques de conseils. « Pourquoi nous ? » s'y enchaîne aussi bien.

## 3. Les indices discrets

Cinq touches, une par partie. Ce sont des répliques retouchées ou ajoutées dans des dialogues existants, toutes dans des scènes que chaque partie joue (audiences, arrivée au Tournoi). Elles ne créent ni choix, ni scène, ni combat, ni récompense. Elles suivent la progression du jeu :

- au Lion, un chef se souvient que la chute avait quelque chose d'étrange, et Maelor esquive ;
- à l'Ours, un compagnon relie le conseil de Maelor à la manière dont le clan est tombé ;
- au Dragon, un chef dit ce que les Sceaux ouvrent ;
- au Scorpion, des archives disent que la chute n'était pas un hasard, et Maelor esquive de nouveau ;
- au Tournoi, un seul mot de Maelor trahit qu'il attendait ce moment.

### I1. Le Lion : l'audience d'Alaric (`lion_briefing`, `content.ts:296-370`)

Le texte seul change, pas les étapes, à cause du verrou de présentation. La distribution reste la même : Alaric, Alistair, Séraphine et Maelor.

| Étape | Qui | Actuel | Proposé |
| --- | --- | --- | --- |
| 1a | Alaric | Je ne demande pas une parade. Ouvrez la route, atteignez le village et revenez répondre de vos décisions. Mes éclaireurs, les survivants et le Sceau lui-même distingueront un secours d’un pillage opportuniste. | Je me souviens de votre chute. Vos alliés ont rompu leurs serments l’un après l’autre, comme si on leur avait soufflé les mêmes mots. Ici, je ne demande pas une parade : revenez répondre de vos décisions. Mes éclaireurs, les survivants et le Sceau lui-même distingueront un secours d’un pillage. |
| 3 | Maelor | Un serment ne nourrit pas une compagnie. Si Alaric exige que nous sauvions son village, demander de quoi tenir la route n’est pas une offense : c’est dire honnêtement ce que notre clan peut encore payer. | Laissons les vieux serments où ils sont : ils ne nourrissent pas une compagnie. Si Alaric exige que nous sauvions son village, demander de quoi tenir la route n’est pas une offense : c’est dire honnêtement ce que notre clan peut encore payer. |

Alistair répond ensuite, sans changement : « Nous ne réclamons pas que le Lion oublie notre défaite. » Les choix de Maelor restent identiques.

### I2. L'Ours : l'audience de Borin (`bear_audience`, `bearDialogues.ts:183`)

| Étape | Qui | Actuel | Proposé |
| --- | --- | --- | --- |
| alistair | Marian | Nous ne sommes pas venus vider la montagne d’un autre clan. | Nous ne sommes pas venus vider la montagne d’un autre clan. Des clans dressés l’un contre l’autre : c’est ainsi que le nôtre est tombé. |

La réplique répond directement au « laissons l’Ours et le Corbeau s’user l’un contre l’autre » de Maelor.

### I3. Le Dragon : l'audience de Kaelen (`dragon_audience`, `dragonDialogues.ts:188-189`)

Une étape nouvelle de Kaelen, déjà présent, entre la réplique d'Elara et le mandat.

| Étape | Qui | Texte proposé |
| --- | --- | --- |
| seal (nouvelle) | Kaelen | Un Sceau ne se vend pas non plus. Ce qu’il ouvre, il peut aussi le refermer, et le Dragon veille à qui il le confie. |

Elle répond à Elara (« Nous ne sommes pas venus vendre l’équilibre d’un autre clan. »). Elle annonce la clé, et prépare la réponse de Marian à la brèche : « Ils nous servaient à refermer ce que tu ouvres. »

### I4. Le Scorpion : l'audience du Grand Inquisiteur (`scorpion_audience`, `scorpionDialogues.ts:194-195`)

Deux étapes nouvelles, entre le rappel des trois Sceaux et la requête. Les deux personnages sont déjà présents.

| Étape | Qui | Texte proposé |
| --- | --- | --- |
| archives (nouvelle) | Grand Inquisiteur | Nos archives gardent aussi la chute de votre clan. Vos alliés se sont tous retournés contre vous, sur la foi des mêmes rumeurs. Le Scorpion n’a jamais cru à ce hasard-là. |
| dodge (nouvelle) | Maelor | Les archives gardent ce qu’on leur raconte, Grand Inquisiteur. Parlons plutôt du codex. |

La requête suit, sans changement (« Le Phénix est trop idéaliste… »).

**Variante I4-b**, plus appuyée. Elle dit que Maelor n'était pas là avant la chute :

| Étape | Qui | Texte proposé |
| --- | --- | --- |
| archives | Grand Inquisiteur | Nos archives gardent aussi la chute de votre clan. Vos alliés se sont tous retournés contre vous, sur la foi des mêmes rumeurs. Votre intendant, lui, n’y figure nulle part. |
| dodge | Maelor | Un intendant n’entre jamais dans les chroniques, Grand Inquisiteur. Parlons plutôt du codex. |

### I5. L'acte final : l'arrivée au Tournoi (`finale_arrival`, `finaleDialogues.ts:104`)

| Étape | Qui | Actuel | Proposé |
| --- | --- | --- | --- |
| 4 | Maelor | Écrasez-les tous, sans pitié. Personne ne se souvient de la manière, seulement de la victoire. | Enfin. Écrasez-les tous, sans pitié. Personne ne se souvient de la manière, seulement de la victoire. |

« Enfin. » arrive juste après « Quatre Sceaux. L’Arène des Destins nous ouvre ses portes ». À la première écoute, on l'entend comme de l'impatience. À la seconde, comme l'aveu d'une attente.

## 4. La cohérence

Répliques existantes relues contre la confession :

| Réf. | Où | Texte actuel | Lecture | Proposition |
| --- | --- | --- | --- | --- |
| R1 | `finale_betrayal`/boisclair, trois variantes (`finaleDialogues.ts:223-232`) | « Tout a commencé à Bois-Clair. … » | La confession dit que tout a commencé avec la chute. « Tout a commencé à Bois-Clair » la contredit, trois répliques plus tôt. | Remplacer « Tout a commencé à Bois-Clair. Je vous ai dit… » par « À Bois-Clair déjà, je vous ai dit… » (variantes 1 et 2). Remplacer « Tout a commencé à Bois-Clair. Quand les survivants… » par « À Bois-Clair déjà, quand les survivants… » (variante 3). Le reste ne change pas. |
| R2 | `finale_breach_confrontation`/3 (`finaleDialogues.ts:175`) | Alistair : « Tu as marché avec nous depuis le début, Maelor. Ici, ça s’arrête. » | Juste, mais la confession lui donne mieux. | « Tu nous as fait tomber, puis tu as marché avec nous, Maelor. Ici, ça s’arrête. » |
| R3 | `finale_last_vigil`/evidence (`finaleDialogues.ts:327`) | « … La même marque, partout où Maelor nous a suivis. » | Après la confession, la compagnie sait qu'il l'a menée. | « … La même marque, partout où Maelor nous a menés. » |
| R4 | `bear_master_spy_aftermath`/1 (`bearDialogues.ts:153`) | Maître Espion : « Le minerai… n’en était qu’une part. Ceux que nous servons ont besoin de bien d’autres choses, et vos Sceaux n’y changeront rien. » | « Vos Sceaux n’y changeront rien » va contre la confession : les Sceaux sont justement ce que veulent les Ombres. Cette scène ne joue que sur la voie d'honneur. | « Le minerai… n’en était qu’une part. Ceux que nous servons ont besoin de bien d’autres choses. De vos Sceaux, par exemple. » |
| R5 | `finale_betrayal`/reveal | « Elles marchaient avec vous depuis le premier Sceau. » | La confession va plus loin, jusqu'à la chute. La scène monte ainsi par paliers, sans contradiction : la quête du premier Sceau commence au camp, où Maelor est déjà là. | Garder. (Possible : « depuis le premier jour ».) |
| R6 | `acte_ouverture`/6, Elara | « Depuis la chute, je sens parfois quelque chose répondre aux Sceaux. » | Juste. Elle devient un indice après coup : depuis la chute, Maelor est avec eux. | Garder. |
| R7 | `acte_ouverture`/2 et 8, Maelor et Séraphine | « C’est notre voie pour rendre une place au clan… » ; « Un Sceau peut rouvrir une porte. » | Justes. Ce sont des doubles sens. | Garder. |
| R8 | `ate_maelor_seal_analysis`, `ate_ruins_awaken` | « J’ai passé des années à traiter les Sceaux comme des leviers… » ; « S’il ouvre des portes, certaines donnent peut-être sur des choses qu’aucun clan raisonnable ne devrait réveiller… » | Maelor sonde Séraphine et feint l'inquiétude. Ce sont des indices, pas des contradictions. | Garder. |
| R9 | Audiences de l'Ours, du Dragon et du Scorpion | « Je dis seulement… » ; « s’user l’un contre l’autre » | Justes. C'est la méthode de la chute. Marian les reprend à la trahison. | Garder. |
| R10 | `finale_breach_confrontation`/1 et 2b | « …à quoi vous servaient-ils vraiment ? » ; Marian : « Ils nous servaient à refermer ce que tu ouvres. » | Justes. Après l'aveu de la clé, sa question est une provocation, et la réponse de Marian retourne la clé contre lui. | Garder. |
| R11 | Épilogues, sort de Maelor (N3) | Respect, Équilibre, Peur | Justes. Dans la Peur, les clans le croient « des nôtres jusqu’au bout » : ils ignorent qu'il les a retournés contre nous. | Garder. |
| R12 | Alaric (`ate_lion_council_doubt`), veillées, `finale_capital_arrival` | « Pas les noms, pas les serments » ; « à quoi ils nous servent vraiment » ; « depuis le premier Sceau, mène là » | Justes. | Garder. |
| R13 | Prologue | « Puis vinrent la défaite, les serments rompus et les bannières brisées. » | Juste. C'est une décision ouverte de l'opérateur, donc on n'y touche pas. | Garder. |

## 5. Questions à l'opérateur

Une question par décision, chacune avec une recommandation :

1. **C1. La confession** : les trois répliques nouvelles et « Regardez. » complété. Recommandation : oui, telles quelles. Variante : C1-b.
2. **R1. Bois-Clair à la trahison** : « À Bois-Clair déjà ». Recommandation : retoucher.
3. **R2. Alistair à la brèche.** Recommandation : retoucher.
4. **I1. Le Lion** : Alaric et l'esquive de Maelor. Recommandation : oui.
5. **I2. L'Ours** : Marian. Recommandation : oui.
6. **I3. Le Dragon** : Kaelen. Recommandation : oui.
7. **I4. Le Scorpion** : les archives et l'esquive. Recommandation : I4, la plus discrète. Variante : I4-b.
8. **I5. Le Tournoi** : « Enfin. » Recommandation : oui.
9. **R3. La dernière veillée** : « menés ». Recommandation : retoucher.
10. **R4. Le Maître Espion** : « De vos Sceaux, par exemple. » Recommandation : retoucher.

## 6. Après validation

- Écrire les répliques validées.
- Ajouter un test qui fixe le texte, `src/campaign/plateaux/maelorArc.test.ts`, sur le modèle de `narrativePass.test.ts`.
- Mettre à jour les tests qui fixent un texte retouché (R1 est fixé par le test de N2).
- Garder `visibleActorCap.test.ts` au vert.
- Vérifier avec :
  - `narrative:validate`, `cinematics:validate-narrative-staging`, `tsc`, `npm test`, `build`, `contracts:validate` et la garde ;
  - dans le navigateur, avec un vrai geste : la trahison sous deux variantes de choix, et au moins deux indices.

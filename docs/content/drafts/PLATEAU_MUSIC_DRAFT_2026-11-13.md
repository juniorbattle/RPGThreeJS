# Musique propre à chaque plateau : brouillon à valider (2026-11-13)

Statut : **VALIDÉ** par l’opérateur le 2026-11-13, tel quel (« J’écoute et je valide »). Chaque question ci-dessous prend donc sa recommandation (voir « Questions à trancher »), dont l’approbation du texte d’amendement 1.23.0.

**Reste à faire, hors de cette session.** Appliquer l’amendement est une tâche dédiée :
1. relecture indépendante du diff réel ;
2. commit d’amendement des contrats ;
3. décision opérateur dans `docs/autonomy/` ;
4. commit opérationnel qui inscrit la nouvelle baseline immuable.

Ensuite seulement, le jeu demande les pistes des plateaux : `PLATEAU_MUSIC_IN_GAME = true`, puis une vérification dans le navigateur. Jusque-là, le jeu joue la musique du Lion partout.

Tu as demandé : « on va travailler l’ambiance sonore et la musique pour chaque plateau, cela donne une identité propre à chaque partie du jeu ». Ce brouillon propose :
- un verdict sur le contrat, avec le texte d’amendement à approuver ;
- une identité musicale pour l’Ours, le Dragon, le Scorpion et l’acte final, le Lion restant tel quel ;
- leurs pistes complètes, écrites en code et jouables dans le laboratoire d’écoute, dans une section « Esquisses » non branchée au jeu ;
- six signatures de boss, en esquisses rendues hors ligne ;
- les questions que le canon et le contrat laissent ouvertes, chacune avec ma recommandation.

Tu m’as dit de travailler sans m’arrêter jusqu’au bout. J’ai donc écrit toutes les pistes, pas seulement les esquisses minimales (carte et combat), et préparé leur branchement dans le jeu derrière un seul interrupteur, éteint. Rien ne change dans le jeu tant que tu n’as pas écouté et approuvé l’amendement.

Les ambiances de combat des six nouveaux biomes sont l’affaire d’une session parallèle. Ce brouillon ne parle que de la musique et des signatures.

## Verdict sur le contrat

**Il faut un amendement court.** Les combats pourraient presque passer tels quels, mais le texte se lit de deux façons et le reste n’a pas de source autorisée.

Ce que dit le contrat :
- set 1.20.0, `PRESENTATION_AND_MEDIA`, « Post-demo moments », puce « Music » : « The plateaux and the final act reuse the nine music contexts. The mood table may gain keys for new dialogues under its existing rules, and mood is never computed from route, choice, reputation or relations. »
- set 1.12.0, « Audio direction », « Context sources, exhaustively » : « The presentation surface; the scene id and boss flag already handed to CombatBridge; for mood, the existing authored scene or surface id through a presentation-side table, never computed from route, choice, reputation, resources or outcome, and with no new field in campaign content ».

Ce qui passerait tel quel :
- **Combat et boss.** L’identifiant de scène du combat est une source permise (« the scene id and boss flag already handed to CombatBridge »). Il nomme déjà l’ambiance de l’arène. Il nomme aussi le plateau (`bear_…`, `dragon_…`) et même le chef : Borin ne combat que sur `bear_hall_terrace`, Kaelen sur `dragon_hall_esplanade`, le Grand Inquisiteur sur `scorpion_records_court`, le Prophète sur `scorpion_dune_crest`, Maelor et l’entité sur `finale_breach_heart`.
- **Dialogues.** La table des humeurs est indexée par l’identifiant du dialogue, qui porte le préfixe de son plateau.

Ce qui bloque :
- **« reuse the nine music contexts ».** Le contrat distingue un contexte de sa piste (« two levels of the same track », « Sections and levels belong to that one stream »). Lu à la lettre, « réutiliser les neuf contextes » interdit d’en ajouter un dixième, pas de changer la piste d’un contexte. Mais la phrase a été écrite quand l’après-démo devait garder la musique du Lion : le brief de la session cloud dit que la musique « reste produite par le code, dans le cadre des jeux 1.11.0 et 1.12.0 », et la décision OD-2026-11-07-I n’ouvre que la table des humeurs. Deux lectures honnêtes : c’est au contrat de trancher, pas au code.
- **Carte et refuge.** La source permise est « the presentation surface ». La surface de la carte est la même pour tous les plateaux ; seul l’atlas change, choisi par le préfixe de l’identifiant du POI courant (`poiAtlasForNode`). Lire ce préfixe pour la musique est défendable, mais le texte ne le nomme pas.
- **Signatures de boss.** La table fermée des sons compte 158 identités sur 160 (mesuré : 20,5 Mo sur 32). Six boss avec charge, coup et vague font 18 identités : 176, au-delà de la borne, que le set 1.20.0 dit de proposer et non de construire.

Je recommande donc un amendement qui dit les choses une fois pour toutes, plutôt que de brancher les combats seuls sur une lecture discutable.

## Texte d’amendement proposé

Set proposé **1.23.0**, tâche `PRODUCTION-CONTRACTS-PLATEAU-MUSIC-1`. La décision sera numérotée à l’approbation (OD-2026-11-XX) et aura son propre fichier. Ce brouillon suit mes recommandations ; il sera réécrit selon tes choix, puis relu sur le diff réel. Je ne touche à aucun contrat : appliquer l’amendement est une tâche séparée que tu approuves.

Documents touchés :
- `PRESENTATION_AND_MEDIA.md` : la puce « Music » de « Post-demo moments » ;
- `COMBAT_AND_VFX.md` : une puce de « Sound and FX », seulement si tu choisis l’option B des signatures ;
- `AUTHORING_AND_QA.md` : un paragraphe de preuves ;
- `README.md` et `contracts.manifest.json` : métadonnées.

**`PRESENTATION_AND_MEDIA.md`, « Post-demo moments », la puce « Music » devient :**

> - **Music.** 1.23.0: The Lion, the Bear, the Dragon, the Scorpion and the final act each have their own tracks for the POI map, refuge, tension, drama, combat and boss contexts. Title, victory and defeat stay shared, and the Lion's tracks stay as they are. The nine contexts and every other rule of the audio direction section are unchanged. A part is read only from the durable id prefix of what is presented, through a presentation-side table: the POI whose atlas the map shows, the authored dialogue id of the mood table, the combat scene id handed to CombatBridge. It is never computed from route, choice, reputation, relations, resources or outcome, and it is never saved. Within its part, a combat scene may ask its own combat or boss track: a chief's boss entry before the part's shared loop, or the Tournament's arena. A surface or scene without a part plays the Lion's track. New instrument timbres and rooms are synthesized by code under the same rules. The mood table may gain keys for new dialogues under its existing rules, and mood is never computed from route, choice, reputation or relations.

**`COMBAT_AND_VFX.md`, « Post-demo combat », « Sound and FX », une puce ajoutée (option B seulement) :**

> - 1.23.0: The six post-demo bosses, Borin, Kaelen, the Grand Inquisitor, the Shadow prophet, Maelor and the breach's entity, join the eight boss signatures under their rules: charge, blow and wave of at most 2.5 seconds each, at most two of the four voices, never evicting a result cue. Each boss plays a variant of its signature skill's recipe, chosen by its catalogued identity and never by a result. The closed cue table grows to at most 176 identities, within the unchanged 32 MB and 50 ms.

**`AUTHORING_AND_QA.md`, après « Audio direction evidence », un paragraphe :**

> Dedicated `PRODUCTION-CONTRACTS-PLATEAU-MUSIC-1`, set 1.23.0. Required before acceptance, in addition to the audio direction evidence: the Lion's tracks, voices, samples and rooms byte-identical, by a fingerprint test; the part of every presented surface and combat scene, read from its id prefix only; every plateau track under the existing rules of sections, bridges, levels, a boss entry of at most 6 seconds and the fanfare rules; the -1 dBFS peak measured on each part's loudest mix; one browser check with a real gesture through one map, one dialogue, one combat and one boss of each part. The listening lab is the acceptance surface; the operator accepts each part by ear.

**`README.md`, en tête de l’historique :**

> Contract set **1.23.0** / `PRODUCTION-CONTRACTS-PLATEAU-MUSIC-1` / OD-2026-11-XX gives each part of the game its own music: the Bear, the Dragon, the Scorpion and the final act have their own map, refuge, tension, drama, combat and boss tracks, read only from the durable id prefix of the presented surface, dialogue or combat scene, while title, victory and defeat stay shared and the Lion's tracks stay byte-identical (PRESENTATION_AND_MEDIA, AUTHORING_AND_QA). [Option B: the six post-demo bosses join the boss signatures, and the cue table grows to 176 identities within 32 MB (COMBAT_AND_VFX).] Constitution unchanged. Order: independent actual-diff review, operator approval, amendment commit, then a following operational commit that records its SHA as the immutable baseline before the game asks the plateaux's tracks.

Après l’approbation, le branchement tient en une ligne : `PLATEAU_MUSIC_IN_GAME = true` dans `src/audio/music/parts.ts`. Le code qui lit le préfixe est déjà en place dans `GameApp.setMode` et `CombatBridge.start`, inerte tant que l’interrupteur est éteint.

## Le principe commun

Chaque partie garde la grammaire du Lion : des sections avec leur tempo, leur tonalité, leur mode et leur mesure ; un pont écrit et un retour ; deux niveaux en combat (Réflexion et Action) ; une entrée de boss de six secondes au plus ; des fanfares de victoire et de défaite partagées. Le motif des Sceaux (degrés 1-5-4-2) traverse chaque piste, transformé par son plateau.

Chaque partie se distingue des autres par quatre choses à la fois : sa **mesure**, son **mode**, ses **timbres** et sa **salle**. Un test vérifie que carte, combat et boss diffèrent d’une partie à l’autre au moins par la mesure, le mode ou la salle.

| | Mesure | Mode | Timbres | Salle | Motif des Sceaux |
| --- | --- | --- | --- | --- | --- |
| Lion (inchangé) | 4 et 3 | dorien, mixolydien, phrygien des Serpents | luth, flûte, tambour sur cadre, cors en quintes, harpe | salle, chapelle, plein air | entier, au cor |
| Ours | 6 lourd (composé) | éolien sans tierces, quintes à vide | chœur d’hommes, cuivres graves en quintes parallèles, tambours de guerre, enclume, chaînes | roche proche | lent, grave, chanté |
| Dragon | 5 (3+2) | lydien, quarte augmentée | cloches de bronze, chœur aigu « ou », flûte, harpe aiguë, cordes aiguës | ciel immense, long écho | avec la quarte augmentée (1-5-#4-2) |
| Scorpion | 7 boiteux (2+2+3) | phrygien à tierce majeure, seconde augmentée | tympanon, flûte de roseau soufflée, darbouka, cymbalettes de cuivre | sable sec, presque sans écho | finit sur la seconde abaissée (1-5-4-b2) |
| Acte final | 4, marche | Tournoi : mi bémol mixolydien ; Brèche : gamme octatonique sur do | Tournoi : fanfares, caisse claire, bannières des clans ; Brèche : harmonica de verre, chœur des Ombres | ville de brique ; vide pour la brèche | corrompu dans la brèche (1-#4-3-b2), chanté à l’envers par l’entité |

Nouveaux timbres, tous synthétisés par le code : chœur d’hommes, chœur aigu, flûte de roseau, harmonica de verre (voix), cloche de bronze, tympanon, enclume, darbouka, cymbalettes (échantillons calculés). Nouvelles salles : roche, ciel, sable, ville, vide. Ils ne se calculent qu’à la première piste qui en a besoin : le Lion charge exactement ce qu’il chargeait.

## Le Lion, pour référence

Rien ne change. Un test d’empreinte compare, au bit près, ses neuf pistes et deux tours de ce qu’en fait le générateur, ses six voix, chacun de ses échantillons calculés et ses trois salles à leur état du commit `3be080ab`. Le titre et les deux fanfares restent communs à tout le jeu.

## L’Ours : granit et braises

**Écho visuel.** Le granit sombre, le bois noirci, le fer et la suie, la chaleur ambrée des seuls feux : une musique basse, lourde et fermée là où le Lion est ouvert. Les quintes à vide sans tierces sonnent comme la pierre brute ; la mesure à six balance comme une charge qu’on monte ; l’enclume et les chaînes viennent des forges et des treuils.

**Distinct des autres.** Le seul en mesure composée, le seul sans tierces dans l’accompagnement, le plus grave de tous, sans luth, sans harpe et sans flûte.

**Motif.** Si bémol – fa – mi bémol – do, lent, chanté par le chœur d’hommes ou tenu par les cuivres en quintes parallèles.

| Contexte | Piste | Ce qu’on entend |
| --- | --- | --- |
| Carte | « La montée », 6/8 lent, si bémol éolien | cor grave sur le motif, chœur d’hommes en bourdon, tambour de guerre au pas, enclume au loin ; pont en ré bémol à quatre temps, cuivres en quintes |
| Refuge | « Le foyer de pierre », 6/8, ré bémol majeur | cordes graves seules, pizzicati comme un feu, le cor fredonne le motif ; pont dehors, en si bémol mineur |
| Tension | « Sous la montagne », 6/8 | battement de cœur au tambour, chaîne qui cliquette, triton sous les cordes |
| Drame | « Le serment » | le chœur d’hommes chante sur les cordes, le silence répond ; pont en choral de cuivres, seule lumière |
| Combat | « Le marteau », 6/8 rapide | Réflexion : chœur, timbales, cor calme ; Action : galop des tambours de guerre, cordes en ostinato, cuivres en quintes parallèles, chaîne ; pont à quatre temps où le chœur scande |
| Boss | « Le trône de granit », sol éolien | entrée de cinq secondes (timbales et motif en quintes), puis tambours, enclume et chœur à plein ; pont qui ramène la tonalité de l’Ours |
| Entrée de Borin | sur la terrasse de sa salle | trois coups de marteau sur l’enclume, le chœur d’hommes et les cuivres nomment le motif (5,5 s) |

Les chefs du Corbeau dans les galeries (défense et prise des mines, Maître Espion) prennent l’entrée générale de l’Ours.

## Le Dragon : bronze et nuées

**Écho visuel.** Les aiguilles de roche pâle au-dessus d’une mer de nuages, le ciel profond, le bronze vert-de-gris et les cloches, l’encens : une musique haute, ouverte et claire là où l’Ours est grave et sombre. La quarte augmentée du lydien flotte ; la mesure à cinq ne se pose jamais tout à fait, comme un pont de corde entre deux aiguilles ; la salle a l’écho long du ciel.

**Distinct des autres.** Le seul en lydien, le seul à cinq temps, le plus aigu et le plus aéré, presque sans basse ; ni tambour de guerre sur la carte, ni luth, ni tambour sur cadre. Ses dragons sont ceux de l’Occident, comme ses sculptures : aucun cliché d’Extrême-Orient, ni gong ni pentatonique.

**Motif.** Ré – la – sol dièse – mi : le motif des Sceaux prend la quarte augmentée.

| Contexte | Piste | Ce qu’on entend |
| --- | --- | --- |
| Carte | « Les cimes célestes », 5/4, ré lydien | flûte sur le motif, cloches de bronze espacées, chœur aigu, harpe aiguë ; pont en fa lydien à trois temps |
| Refuge | « L’ermitage », 5/4 lent | flûte seule, cordes aiguës sur le motif, une cloche au loin ; pont en si bémol lydien |
| Tension | « Le repaire du Loup », fa dièse mineur | timbales sourdes, cors du Loup, seconde abaissée ; pont vers sol lydien |
| Drame | « Le ciel brisé » | cordes et chœur aigu, le silence répond ; pont en ré lydien, flûte et harpe |
| Combat | « Le vol des cimes », 5/4 rapide | Réflexion : harpe, chœur aigu, flûte ; Action : cordes en ostinato 3+2, tambours, cor, cloche à la fin des phrases ; section B en ré lydien, cuivres ; pont à sept temps où le chœur aigu chante |
| Boss | « Le jugement du ciel », 7/4, do dièse mineur | entrée (cuivres sur le motif, timbales), puis tambours, cuivres et cloches ; pont qui ramène le lydien du Dragon |
| Entrée de Kaelen | sur l’esplanade de sa salle | une cascade de cloches, le chœur aigu, les cuivres nomment le motif en lydien (5,7 s) |

Le chef du Loup et le Chaman des Ombres prennent l’entrée générale du Dragon.

## Le Scorpion : sable et encre

**Écho visuel.** Les dunes plates sous un soleil sans pitié, l’ocre et l’ambre, les érudits qui consignent tout, le cuivre des lampes et des finitions, l’encre : une musique sèche, précise et brûlante. La seconde augmentée brûle ; la mesure à sept boite comme le pas d’une caravane ; le tympanon frappé a la précision d’un greffier ; la flûte de roseau est le vent sur les dunes ; la salle n’a presque pas d’écho, comme le plein désert.

**Distinct des autres.** Le seul à sept temps, le seul en phrygien à tierce majeure (les Serpents du Lion sont en phrygien mineur), le plus sec. Le Phénix, dans le même désert, n’a qu’une lumière : le pont du drame, en ré majeur, sa flamme safran.

**Motif.** La – mi – ré – si bémol : il finit sur la seconde abaissée, couleur d’encre.

| Contexte | Piste | Ce qu’on entend |
| --- | --- | --- |
| Carte | « Les pistes de sable », 7/8, la phrygien à tierce majeure | flûte de roseau sur le motif, tympanon en arpèges 2+2+3, darbouka, bourdon grave ; pont à neuf temps en ré, hautbois sur cymbalettes, la nuit |
| Refuge | « L’oasis », 7/8 lent, ré mineur harmonique | flûte de roseau, tympanon sur le motif ; pont en si bémol à quatre temps |
| Tension | « Les registres » | une horloge de cuivre et de peau, hautbois ; pont un demi-ton au-dessus |
| Drame | « Encre et cendres » | flûte de roseau sur les cordes, le silence répond ; pont : la flamme du Phénix en ré majeur |
| Combat | « Le verdict des sables », 7/8 rapide | Réflexion : tympanon, cordes, flûte de roseau ; Action : darbouka, cordes en ostinato, cuivres, appel du hautbois ; pont à quatre temps : la cour des registres, cuivres graves et tambour de guerre |
| Boss | « Le registre », 9/8, ré phrygien à tierce majeure | entrée (cuivres sur le motif, timbales), puis darbouka, cuivres et cordes ; pont qui ramène le sept du Scorpion |
| Entrée du Grand Inquisiteur | cour des registres | cymbalettes de cuivre, trémolo de tympanon, cuivres sur le motif (5,7 s) |
| Entrée du Prophète des Ombres | crête des dunes | le chœur des Ombres sous la flûte de roseau, cuivre et peau (5,7 s) |

Les gardiens de flamme du Phénix, au temple, prennent l’entrée générale du Scorpion.

## L’acte final : la capitale des clans

**Écho visuel.** La seule ville du jeu, brique rouge et ardoise sous un ciel voilé, les bannières des clans pour seules couleurs vives ; puis l’encre noire et froide de la brèche, le feu des rues. Deux visages, choisis par l’identifiant de scène :
- **le Tournoi**, cérémoniel : mi bémol mixolydien, une marche avec caisse claire et tambour de guerre, des fanfares. Sa section B fait passer les **bannières des clans**, deux mesures chacune : le chœur d’hommes de l’Ours en quintes, la flûte du Dragon sur la quarte augmentée avec ses cloches, la flûte de roseau du Scorpion sur la seconde augmentée, les cors du Lion. Tous les clans se rencontrent dans la musique comme dans l’arène.
- **la Brèche**, froide : la gamme octatonique sur do, symétrique et sans centre, l’harmonica de verre, le chœur des Ombres, une salle immense et sombre.

Les cloches de la ville sonnent en fa mineur sur la carte.

**Motif.** Dans la brèche, il se corrompt : do – fa dièse – mi – ré bémol (1-#4-3-b2). L’entité le chante à l’envers, au verre.

| Contexte | Piste | Ce qu’on entend |
| --- | --- | --- |
| Carte | « La ville sous le voile », 4/4, fa mineur | cor sur le motif, pizzicati comme des pas, tambour de procession, cloche de la ville ; pont : souvenir du jour du Tournoi, la bémol à trois temps |
| Refuge | « La dernière veillée », 3/4, la bémol majeur | cor seul, cordes sur le motif, le verre sonne déjà dehors ; pont : la ville brûle, do mineur, le verre seul |
| Tension | « La trahison », octatonique | alarme de timbales, cor sur le motif corrompu ; pont à cinq temps, le hautbois chuchote |
| Drame | « Une aube de cendre », fa mineur | cor sur les cordes, une cloche ; pont : l’aube, ré bémol, cloches sur les cordes |
| Combat (rues en flammes, place, remparts) | « Les rues en flammes », octatonique | Réflexion : verre, pizzicati ; Action : cordes en ostinato, tambours, cuivres sur le motif corrompu, chœur des Ombres ; pont à trois temps où chante le chœur |
| Combat du Tournoi (arène) | « L’Arène des Destins », mi bémol mixolydien | marche, fanfares, bannières des clans ; pont à trois temps en do mineur |
| Boss du Tournoi (finale contre le champion du Serpent) | « La finale », do mineur | entrée : roulement de caisse claire et cymbale ; pont phrygien, le hautbois des Serpents sur le demi-ton |
| Boss de la brèche (arène en flammes) | « La brèche », 5/4, octatonique | entrée : motif corrompu aux cuivres graves ; pont de l’entité à six temps lents, sur les deux niveaux |
| Entrée de Maelor | cœur de la brèche | motif corrompu aux cuivres les plus graves, grappe de verre, la grande cloche (5,7 s) |

## Les signatures de boss

Le set 1.20.0 demande qu’on te les propose. Je propose deux niveaux.

**A. Signatures musicales, construites.** Chaque chef a sa propre entrée de boss, dans sa partie : Borin, Kaelen, le Grand Inquisiteur, le Prophète des Ombres, Maelor. L’entité n’a pas d’entrée possible : la musique ne connaît pas la phase du combat (seuls le niveau et l’issue lui parviennent). Son motif vit donc dans le pont de la piste de la brèche, entendu sur les deux niveaux. Ces entrées n’ajoutent aucune identité à la table des sons et passent par l’amendement de la musique.

**B. Signatures sonores de la table, en esquisses.** Une charge, un coup et une vague par boss, de 2,5 secondes au plus chacun, sur la grammaire des huit signatures existantes :

| Boss | Charge | Coup | Vague |
| --- | --- | --- | --- |
| Borin | grondement en quintes graves qui monte de la roche | marteau sur l’enclume, un poids sourd | éboulis qui roule, bourdon en quinte |
| Kaelen | battements d’ailes qui s’accélèrent sous un appel lydien | cloche de bronze frappée | rafale de vent, cloches qui descendent |
| Grand Inquisiteur | plume qui gratte de plus en plus vite | sceau lourd frappé sur le cuivre | encre qui s’étale sur la seconde augmentée |
| Prophète des Ombres | murmure aspiré | implosion sombre | bourdon tremblant de la seconde augmentée, sable |
| Maelor | le motif corrompu qui tombe | coup sur le triton, verre fêlé | grappe de verre qui bat, le vide |
| Entité | l’air aspiré dans la déchirure | un choc froid, une note de verre | le motif à l’envers, au verre |

**Bornes.** La table compte 158 identités sur 160 et 20,5 Mo sur 32. Ces 18 identités la porteraient à 176 identités et environ 29 Mo au plus : la borne d’identités est dépassée, celle des octets tient. Il faut donc l’option B de l’amendement. Il faut aussi, côté effets, une variante de recette par boss : aujourd’hui Borin joue `boss_titan_slam`, comme le temple du Phénix ; Kaelen, le Prophète et Maelor jouent `boss_inferno` ; le Grand Inquisiteur et l’entité, `boss_apocalypse`. Une marque sonore étant fixée par sa recette, un boss n’a son propre son que si sa recette lui est propre.

Ces esquisses ne sont pas dans la table et le jeu ne les lit pas. Elles sont rendues hors ligne en WAV pour l’écoute (voir « Comment écouter »).

## Questions à trancher

**Tranchées le 2026-11-13** : tu as validé le brouillon tel quel. Chaque question prend sa recommandation :
- l’amendement 1.23.0 tel que rédigé, puis le branchement d’une ligne (1 A) ;
- les quatre identités telles qu’écrites (2) ;
- les mesures à 5 et à 7 gardées en combat (3 A) ;
- les fanfares et le titre communs (4 A, 5 A) ;
- le Tournoi pour les combats de l’arène seulement, la Brèche partout ailleurs (6 A) ;
- les entrées musicales seules pour les signatures de boss, sans toucher à la table des sons ; l’option B de l’amendement n’est pas retenue (7 A) ;
- le motif de l’entité dans le pont de la brèche (8 A) ;
- les chefs secondaires sur l’entrée générale de leur partie (9 A) ;
- les ambiances de carte et de refuge communes (10 A) ;
- les timbres tels quels, à retoucher un par un si l’un ne convainc pas en jeu (11).

Le texte appliqué sera donc celui de `PRESENTATION_AND_MEDIA`, `AUTHORING_AND_QA`, `README` et du manifeste, sans la puce de `COMBAT_AND_VFX`, et sans la mention de l’option B dans `README`.

1. **Amendement.** A : l’amendement 1.23.0 tel que rédigé, puis le branchement d’une ligne (**recommandé**). B : brancher seulement les combats sur l’identifiant de scène, sans amendement (déconseillé : la lecture de « reuse » est discutable).
2. **Identités.** Valides-tu, à l’oreille, chaque partie telle qu’écrite ? Le laboratoire a une case Bien / À revoir et une note par piste ; l’avis se copie en bas de la fenêtre.
3. **Mesures impaires en combat.** Le Dragon à cinq et le Scorpion à sept sont leur signature, mais un combat long peut fatiguer. A : garder (**recommandé**, à juger à l’oreille). B : repasser leurs combats à quatre temps et garder l’impair sur la carte et au refuge.
4. **Fanfares.** A : victoire et défaite communes à tout le jeu, signal reconnaissable (**recommandé**). B : une fanfare par partie (l’issue du combat et l’identifiant de scène suffisent comme sources).
5. **Titre.** A : commun (**recommandé**). B : un titre par partie n’a pas de sens, l’écran-titre précède la partie.
6. **Les deux visages de l’acte final.** A : le Tournoi pour les combats de l’arène seulement, la Brèche partout ailleurs, carte, refuge et dialogues dans la couleur de la capitale (**recommandé**). B : un refuge et une tension propres au Tournoi, choisis par les identifiants de ses dialogues.
7. **Signatures de boss.** A : les entrées musicales seules pour l’instant (**recommandé**, aucune borne dépassée). B : les 18 signatures de la table, avec l’option B de l’amendement et les variantes de recette. C : les deux.
8. **L’entité.** A : son motif dans le pont de la brèche, sur les deux niveaux (**recommandé**). B : un message de phase du document de combat vers la musique, ce qui demande un amendement de plus.
9. **Entrées des autres boss.** A : les chefs secondaires (Corbeau, Loup, Chaman, gardiens du Phénix, champion des démons) prennent l’entrée générale de leur partie (**recommandé**). B : une entrée chacun.
10. **Ambiances de la carte et du refuge.** Le contrat n’en prévoit qu’une de chaque, communes à tout le jeu. A : les garder communes, la musique porte l’identité (**recommandé**). B : une par plateau, à proposer avec la session des ambiances, par un autre amendement.
11. **Timbres nouveaux.** Chœur d’hommes, chœur aigu, flûte de roseau, harmonica de verre, cloche, tympanon, enclume, darbouka, cymbalettes : un timbre qui ne te convainc pas se retouche seul, sans changer l’écriture.

## Comment écouter

**Sans lancer le jeu.** Les WAV sont dans `tmp/plateau-music/` du worktree (chemin ignoré par Git) :
- `wav/music-<partie>-<contexte>.wav` : chaque piste, et pour le combat les deux niveaux et le pont ;
- `wav/music-<partie>-boss-<chef>.wav` : les entrées de Borin, Kaelen, du Grand Inquisiteur, du Prophète et de Maelor, puis le début de la boucle ; `music-finale-boss-entity.wav` : le pont de l’entité ;
- `wav/music-finale-tournament-*.wav` : le combat du Tournoi, ses bannières et sa finale ;
- `signatures/signature-<boss>.wav` : les six esquisses de signatures (charge, coup, vague) ;
- `lion/` : quatre pistes du Lion enregistrées de la même façon, pour comparer.

Je t’envoie aussi un fichier par partie, qui enchaîne carte, combat (Réflexion puis Action) et boss.

**Dans le laboratoire d’écoute.** `npm run dev`, puis `/?qa=1`, « Laboratoire d’écoute » : la section « Esquisses : identités des plateaux » a une ligne par piste, avec Début, Pont, Entrée et les deux niveaux. Rien n’y est branché au jeu.

## Mesures

Ce que j’ai mesuré, et rien de plus : seule ton oreille juge si c’est juste.

**Le Lion, identique au bit près.** Le test d’empreinte passe : pistes, voix, échantillons et salles inchangés.

**Niveau.** Chaque piste est calibrée sur son équivalent du Lion, en LUFS intégrés, sur un enregistrement du vrai moteur au volume par défaut. Le premier rendu sortait 5 à 8 dB trop bas pour l’Ours, et la Réflexion du Dragon passait au-dessus de son Action ; c’est corrigé :

| Contexte | Lion | Ours | Dragon | Scorpion | Acte final |
| --- | --- | --- | --- | --- | --- |
| Carte | -22,9 | -23,0 | -23,0 | -23,0 | -23,0 |
| Refuge | -26,8 | -26,9 | -26,8 | -26,9 | -26,7 |
| Tension | -25,7 | -25,9 | -25,6 | -25,9 | -25,4 |
| Drame | -26,1 | -26,0 | -26,0 | -26,1 | -26,3 |
| Combat, Réflexion | -26,7 | -27,5 | -26,2 | -26,5 | -26,5 |
| Combat, Action | -22,5 | -22,4 | -22,9 | -22,8 | -23,2 |
| Boss, Action | -22,1 | -22,1 | -22,0 | -22,2 | -22,0 |

Écart le plus grand : 0,8 LU. Le Tournoi (combat -22,8, finale -22,2) et les entrées des chefs (-21,7 à -22,8) sont au même niveau ; le pont de l’entité, plus calme, est à -25,0.

**Limiteur.** Le boss de chaque partie, au niveau Action, à volume de musique maximal, à travers le limiteur final : crête -1,4 dBFS pour l’Ours, -3,0 pour le Dragon, -2,4 pour le Scorpion, -3,4 pour l’acte final. Toutes restent sous le plafond de -1 dBFS.

**Entrées de boss.** Toutes durent au plus 6 secondes : 5,0 s pour l’entrée générale de l’Ours, 5,5 s pour celle de Borin, 5,2 s pour la finale du Tournoi, 5,7 s pour les autres.

**Fil principal.** J’ai joué les 31 pistes l’une après l’autre en basculant les niveaux, les timbres et salles de chaque partie se calculant à la volée : aucune tâche de plus de 50 ms. Trois démarrages à froid : aucune non plus.

**Signatures en esquisse.** Charge de 1,35 à 1,72 s, coup de 0,85 à 2,05 s, vague de 1,65 à 2,30 s : toutes sous 2,5 s. La table des sons reste à 158 identités.

## Ce qui change dans le code

- `src/audio/music/plateaux/{bear,dragon,scorpion,finale}.ts` : les pistes de chaque partie ; `score.ts` : les aides d’écriture.
- `src/audio/music/plateauTracks.ts` : quelle piste joue un contexte, pour une partie et une scène de combat.
- `src/audio/music/parts.ts` : la partie lue au préfixe d’un identifiant, et l’interrupteur `PLATEAU_MUSIC_IN_GAME`, éteint.
- `src/audio/music/{voices,instruments,bank,hall,theory}.ts` : timbres, salles, modes et accords ajoutés à côté de ceux du Lion, qui ne changent pas.
- `src/audio/music/MusicDirector.ts` : la piste choisie par contexte et partie, les timbres et salles d’une partie calculés à sa première piste.
- `src/ui/UiSoundPlayer.ts` : le propriétaire audio transmet la partie ; sans partie, il appelle l’hôte exactement comme avant.
- `src/game/GameApp.ts`, `src/combat/CombatBridge.ts` : la lecture du préfixe, inerte tant que l’interrupteur est éteint.
- `src/ui/AudioListeningLab.ts` : la section « Esquisses ».
- `src/audio/postDemoSignatureSketches.ts` et `tools/audio/render-signature-sketches.mjs` : les esquisses de signatures, hors table, et leur rendu.
- `tools/audio/capture.mjs` : le port et les pistes des plateaux.
- Tests : `src/audio/music/plateauMusic.test.ts` (empreinte du Lion, parties, écriture, bornes) et la section du laboratoire dans `AudioListeningLab.test.ts`.

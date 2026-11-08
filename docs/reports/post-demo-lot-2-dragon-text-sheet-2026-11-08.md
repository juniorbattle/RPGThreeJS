# Fiche de texte — Les Pics Célestes (Ancien Dragon Kaelen) — BROUILLON

Générée par `tools/narrative/plateau-text-sheet.ts` depuis le contenu jouable. Brouillon : rien ici n’est canon avant l’approbation du plateau par l’opérateur.

## Parcours, scènes et combats

## Pied des Pics Célestes — `dragon-camp` (story, profondeur 0)

### Pied des Pics Célestes — `dragon_arrival`

- **Alistair** · Pics Célestes : Les Pics Célestes. Deux Sceaux dans notre coffre, et la montagne la plus haute que nous ayons jamais gravie.
- **Sage Séraphine** · Sage : Le Clan du Dragon garde ici des savoirs plus anciens que tous les clans des plaines. Il écoute peu, et il pèse longtemps ce qu’il entend.
- **Intendant Maelor** · Intendant : Un clan si sage qu’il n’a besoin de personne. Voyons ce qu’il nous demandera quand même.

## Audience de Kaelen — `dragon-audience` (story, profondeur 1)

### Audience de Kaelen — `dragon_audience`

*Construite selon l’état — plateaux précédents par l’honneur, conduite honorable ici (Dragon) :*

- **Ancien Dragon Kaelen** · Ancien Dragon : Le Clan du Loup a volé le Cristal d’Écho. Il tenait l’équilibre de ces pics depuis avant vos chroniques. Sans lui, la montagne se fend, la neige glisse, et les vallées tremblent.
- **Ancien Dragon Kaelen** · Deux Sceaux : Borin vous a confié le Sceau de l’Ours, dit-on, et le Maître Espion du Corbeau ne reverra pas ses montagnes. L’Ours ne donne pas sa parole à la légère. Le Dragon non plus.
- **Ancien Dragon Kaelen** · Requête : Le Dragon ne demande pas d’aide ; il en accepte, quand elle est digne. Rapportez le Cristal, et le Sceau du Dragon entendra votre nom.
- **Sage Séraphine** · Sage : Un artefact qui tient des montagnes ne se manie pas sans danger, Ancien Kaelen. Et un clan qui le vole sait peut-être ce qu’il fait, ou quelqu’un le sait pour lui. Comprenons le Loup avant de le frapper.
- **Intendant Maelor** · Intendant : Ou laissons le Loup et le Dragon s’user l’un contre l’autre. Le Cristal ira à qui le tiendra à la fin… Je dis seulement ce que chacun pense en regardant ces pics.
- **Alistair** · Clan sans terre : Nous ne sommes pas venus vendre l’équilibre d’un autre clan.
- **Ancien Dragon Kaelen** · Mandat : Alors, étrangers. Rapporterez-vous le Cristal d’Écho ?
  - Choix « Rapporter le Cristal sans rien exiger. » (aperçu : Parole claire devant le Dragon ; Kaelen observe votre conduite) → fait `dragonMandateHonour` ; réputation +1
  - Choix « Exiger un prix pour notre aide. » (aperçu : 60 or d’avance ; Le prix pèsera dans le jugement) → fait `dragonMandatePrice` ; +60 or ; réputation -1
- **Ancien Dragon Kaelen** · Parole : Montez, alors. Le repaire du Loup est haut, et le Loup voit loin.
- **Ancien Dragon Kaelen** · Parole chiffrée : Vous chiffrez l’équilibre des Pics comme une marchandise. Prenez votre or. Le Dragon se souviendra de ce qu’il vous a coûté.

*Construite selon l’état — plateaux précédents par la force, conduite avide ici ; plateaux précédents par la force, conduite honorable ici ; pacte avec le Loup :*

- **Ancien Dragon Kaelen** · Ancien Dragon : Le Clan du Loup a volé le Cristal d’Écho. Il tenait l’équilibre de ces pics depuis avant vos chroniques. Sans lui, la montagne se fend, la neige glisse, et les vallées tremblent.
- **Ancien Dragon Kaelen** · Deux Sceaux : On parle aussi du Sceau de l’Ours arraché à Borin par l’épreuve. Les Pics ont de bons yeux, étrangers. Ils regarderont ce que vous ferez ici.
- **Ancien Dragon Kaelen** · Requête : Le Dragon ne demande pas d’aide ; il en accepte, quand elle est digne. Rapportez le Cristal, et le Sceau du Dragon entendra votre nom.
- **Sage Séraphine** · Sage : Un artefact qui tient des montagnes ne se manie pas sans danger, Ancien Kaelen. Et un clan qui le vole sait peut-être ce qu’il fait, ou quelqu’un le sait pour lui. Comprenons le Loup avant de le frapper.
- **Intendant Maelor** · Intendant : Ou laissons le Loup et le Dragon s’user l’un contre l’autre. Le Cristal ira à qui le tiendra à la fin… Je dis seulement ce que chacun pense en regardant ces pics.
- **Alistair** · Clan sans terre : Nous ne sommes pas venus vendre l’équilibre d’un autre clan.
- **Ancien Dragon Kaelen** · Mandat : Alors, étrangers. Rapporterez-vous le Cristal d’Écho ?
  - Choix « Rapporter le Cristal sans rien exiger. » (aperçu : Parole claire devant le Dragon ; Kaelen observe votre conduite) → fait `dragonMandateHonour` ; réputation +1
  - Choix « Exiger un prix pour notre aide. » (aperçu : 60 or d’avance ; Le prix pèsera dans le jugement) → fait `dragonMandatePrice` ; +60 or ; réputation -1
- **Ancien Dragon Kaelen** · Parole : Montez, alors. Le repaire du Loup est haut, et le Loup voit loin.
- **Ancien Dragon Kaelen** · Parole chiffrée : Vous chiffrez l’équilibre des Pics comme une marchandise. Prenez votre or. Le Dragon se souviendra de ce qu’il vous a coûté.

## Patrouille du Loup — `dragon-opening-ambush` (combat, profondeur 2)

- Combat **Patrouille du Loup** (`dragon_wolf_patrol`, normal) : Dispersez la patrouille du Loup qui tient le premier sentier. Ennemis : wolf_raider, wolf, wolf. Récompense : 25 or, réputation 0.

## Émissaire du Loup — `dragon-wolf-envoy` (event, profondeur 3)

### Émissaire du Loup — `dragon_wolf_envoy`

- **Kestrel** · Éclaireuse : Un guerrier du Loup, seul, sous un drapeau de trêve. Il a laissé son arme plantée dans la neige, loin de lui.
- **Émissaire du Loup** · Loup : Le Dragon vous envoie reprendre son Cristal. Le Loup vous propose mieux : ne le reprenez pas. Laissez-le où il est, et le Loup partagera les vallées que le Dragon garde pour lui seul.
- **Émissaire du Loup** · Offre : Prenez cet or en gage. Montez jusqu’au repaire, et le jour venu, souvenez-vous de qui vous a parlé le premier.
- **Intendant Maelor** · Intendant : Le Dragon et le Loup se disputent ces pics depuis toujours. Qu’ils s’affaiblissent l’un l’autre, et le plus fort au bout sera peut-être celui qui n’a pas choisi trop tôt.
- **Sage Séraphine** · Sage : Un clan qui vole un artefact puis achète le silence de ceux qui le cherchent… Je voudrais savoir pourquoi le Loup a eu besoin de ce Cristal, avant de croire à son partage.
- **Alistair** · Réponse : Votre réponse, alors.
  - Choix « Repousser l’émissaire et prévenir Kaelen. » (aperçu : Kaelen saura ce que le Loup a tenté) → fait `dragonWolfOfferRefused`
  - Choix « Accepter l’or et le pacte du Loup. » (aperçu : 90 or ; Un pacte avec le Loup) → fait `dragonWolfPact` ; +90 or ; réputation -2
- **Émissaire du Loup** · Refus : Le Dragon vous remerciera du bout des lèvres. Le Loup, lui, se souviendra de votre réponse.
- **Kestrel** · Éclaireuse : Je fais porter un message à l’ermitage. Kaelen saura qu’un émissaire du Loup descend jusqu’ici.
- **Émissaire du Loup** · Pacte : Alors nous nous reverrons au repaire. Le Loup tient parole à ceux qui la tiennent.

## Hameau terrorisé — `dragon-terrorized-village` (event, profondeur 4)

### Hameau terrorisé — `dragon_terrorized_village`

- **Marian** · Soigneuse : Des portes barricadées, des enfants cachés dans les granges. Ce hameau attend une attaque.
- **Villageois des contreforts** · Contreforts : Le Loup descend chaque nuit depuis la disparition du Cristal. Il prend les bêtes, les réserves, et il revient toujours. Le Dragon reste là-haut.
- **Intendant Maelor** · Intendant : Ces gens paieraient cher pour dormir tranquilles. Une protection a un prix, et personne d’autre ne la leur offre.
- **Sage Séraphine** · Sage : Ils paient déjà le Loup en bêtes et en peur. Leur prendre davantage ferait de nous un deuxième Loup.
- **Alistair** · Décision : Que faisons-nous pour ce hameau ?
  - Choix « Monter la garde et repousser le prochain raid. » (aperçu : Une nuit de garde ; Le hameau protégé) → fait `dragonVillageProtected` ; réputation +1
  - Choix « Faire payer notre protection. » (aperçu : 60 or ; Un hameau qui paie deux fois) → fait `dragonVillageExtorted` ; +60 or ; réputation -2
- **Villageois des contreforts** · Gratitude : Le Loup a vu vos feux et il a tourné bride. C’est la première nuit que nous dormons depuis des semaines.
- **Marian** · Soigneuse : Ils ont vidé leur dernier coffre pour nous. Ils nous regardent comme ils regardent le Loup.

## Pièges du Loup — `dragon-first-trial-event` (event, profondeur 5)

### Pièges du Loup — `dragon_wolf_traps`

- **Kestrel** · Éclaireuse : Des collets d’acier sous la neige, en travers du sentier des pèlerins. Le Loup les a posés pour ceux qui montent prier le Dragon.
- **Intendant Maelor** · Intendant : Déplaçons-les sur les sentiers du Loup. Ses patrouilles y tomberont, et le repaire sera moins gardé.
- **Marian** · Soigneuse : Les pèlerins passent aussi par là. Un collet ne distingue pas un loup d’un enfant.
- **Alistair** · Décision : Que fait-on de ces pièges ?
  - Choix « Désarmer les pièges du sentier des pèlerins. » (aperçu : Le sentier des pèlerins sûr) → fait `dragonTrapsDisarmed` ; réputation +1
  - Choix « Les retourner contre les patrouilles du Loup. » (aperçu : 1 grenade entravante ; Au risque des pèlerins) → fait `dragonTrapsTurned` ; +1 grenade_entravante ; réputation -1
- **Kestrel** · Éclaireuse : Le sentier est sûr. Les pèlerins pourront monter sans regarder où ils posent les pieds.
- **Kestrel** · Éclaireuse : Les collets attendent le Loup, maintenant. J’espère que personne d’autre ne passera par là.

## Éclaireurs du Loup — `dragon-first-trial-combat` (combat, profondeur 5)

- Combat **Éclaireurs du Loup** (`dragon_wolf_scouts`, normal) : Chassez les éclaireurs du Loup avant qu’ils ne préviennent le repaire. Ennemis : wolf_hunter, wolf_raider, wolf. Récompense : 35 or, réputation 0.

## Ermitage des contreforts — `dragon-first-refuge` (refuge, profondeur 6)

### Ermitage des contreforts — `dragon_hermitage_gathering`

- **Alistair** · Ermitage : Un ermitage du Dragon, accroché à la paroi. Les moines nous laissent le feu sans poser de questions.
- **Intendant Maelor** · Intendant : Sans poser de questions, et sans rien nous dire non plus. Le Dragon garde même ses silences.
- **Sage Séraphine** · Sage : Ils prient pour que le Cristal revienne. Reposons-nous ; le repaire du Loup est plus haut que tout ce que nous avons traversé.

## Guerrier du Loup blessé — `dragon-captive-wolf` (event, profondeur 7)

### Guerrier du Loup blessé — `dragon_captive_wolf`

- **Kestrel** · Éclaireuse : Un guerrier du Loup, blessé, abandonné par les siens au bord des terrasses. Il est encore conscient.
- **Guerrier du Loup** · Loup : Achevez-moi ou laissez-moi. Je ne dirai rien du repaire.
- **Intendant Maelor** · Intendant : Il dira tout, avec un peu d’encouragement. Le repaire est gardé, et nous ne savons rien de ses défenses.
- **Sage Séraphine** · Sage : Écoutons-le d’abord. Un clan qui vole un artefact sacré n’agit pas toujours de lui-même ; ce guerrier sait peut-être pourquoi.
- **Alistair** · Décision : Que faisons-nous de lui ?
  - Choix « Soigner ses blessures, l’écouter, puis le relâcher. » (aperçu : Un ennemi épargné ; Peut-être une vérité) → fait `dragonWolfHeard` ; réputation +1
  - Choix « Lui arracher ce qu’il sait. » (aperçu : Les gardes du repaire ; Un acte que les Pics retiendront) → fait `dragonWolfTortured` ; réputation -2
- **Guerrier du Loup** · Aveu : Notre chef n’était pas ainsi, avant. Un chaman est venu d’on ne sait où, et depuis, il n’écoute plus que lui. C’est le chaman qui voulait le Cristal.
- **Sage Séraphine** · Sage : Un chaman venu de nulle part, derrière un clan qui n’agit plus de lui-même. Nous avons déjà vu cela.
- **Marian** · Soigneuse : Il a parlé des gardes et des passages. Il ne parlera plus jamais d’autre chose.

## Créatures des crêtes — `dragon-cliff-road` (combat, profondeur 8)

- Combat **Créatures des crêtes** (`dragon_crest_creatures`, normal) : Repoussez les créatures qui harcèlent la route des terrasses. Ennemis : young_wyrm, wild_boar, cave_rat. Récompense : 40 or, réputation 0, +1 iron_ore.

## Inscriptions du Cristal — `dragon-second-trial-event` (event, profondeur 9)

### Inscriptions du Cristal — `dragon_crystal_clues`

- **Sage Séraphine** · Sage : Une paroi gravée par les anciens du Dragon. Elle parle du Cristal d’Écho : il tient l’équilibre des Pics, mais une main qui saurait le tourner pourrait en faire une arme.
- **Intendant Maelor** · Intendant : Une arme qui tient des montagnes en équilibre. Ce savoir vaut plus que tout l’or du Loup. Pourquoi le rendre à un clan qui le garde pour lui seul ?
- **Marian** · Soigneuse : Parce que ce n’est pas à nous de décider qui tient les montagnes.
- **Alistair** · Décision : Que faisons-nous de ces inscriptions ?
  - Choix « Copier les inscriptions pour Kaelen. » (aperçu : Kaelen saura ce que dit la paroi) → fait `dragonCluesShared`
  - Choix « Garder pour nous le secret du Cristal. » (aperçu : 1 éther (poussière de cristal) ; Un secret gardé pour le clan) → fait `dragonCluesHidden` ; +1 ether ; réputation -1
- **Sage Séraphine** · Sage : Je les recopie trait pour trait. Kaelen saura les lire mieux que nous.
- **Intendant Maelor** · Intendant : Je garde la copie, et la poussière de cristal au pied de la paroi. Un jour, ce savoir nous servira.

## Wyrm corrompu — `dragon-second-trial-combat` (combat, profondeur 9)

- Combat **Wyrm corrompu** (`dragon_corrupted_wyrm`, elite) : Abattez le wyrm rendu fou par une énergie sombre. Ennemis : shadow_wyrm, cave_rat. Récompense : 65 or, réputation +1, +1 iron_ore. Défi : Sans objets, prime 2 gemmes rouges.

## Repaire du Loup — `dragon-wolf-lair` (story, profondeur 10)

### Repaire du Loup — `dragon_wolf_lair`

*Construite selon l’état — plateaux précédents par l’honneur, conduite honorable ici (Dragon) ; plateaux précédents par la force, conduite honorable ici :*

- **Kestrel** · Éclaireuse : Le repaire du Loup, creusé dans la paroi. Le Cristal brille au fond, posé sur un autel qui n’est pas celui du Dragon. Le chef du Loup le garde lui-même.
- **Chef du Clan du Loup** · Loup : Encore des étrangers au service du Dragon. Il a gardé ces pics trop longtemps. Le Cristal ira à qui saura s’en servir.
- **Sage Séraphine** · Sage : Ce Cristal appartient à l’équilibre des Pics, et cet autel n’a rien d’un autel du Loup. Reprenons-le, et rapportons-le à Kaelen.
- **Intendant Maelor** · Intendant : Ou reprenons-le pour nous. Celui qui tient le Cristal tient le Dragon.
- **Alistair** · Décision : Le repaire attend notre réponse.
  - Choix « Prendre le repaire et rapporter le Cristal à Kaelen. » (aperçu : Combat contre le chef du Clan du Loup ; Le Cristal rapporté au Dragon) → fait `dragonCrystalRecovered` ; réputation +1 ; combat `dragon_lair_assault`
  - Choix « Prendre le repaire et garder le Cristal pour le clan. » (aperçu : Combat contre le chef du Clan du Loup ; Le Cristal gardé pour le clan) → fait `dragonCrystalKept` ; réputation -2 ; combat `dragon_lair_seizure`
  - Choix « Tenir parole au Loup et lui laisser le Cristal. » [exige `dragonWolfPact`] (aperçu : 130 or ; Le Loup vous doit une faveur ; Kaelen l’apprendra) → fait `dragonWolfAlliance` ; +130 or ; réputation -3 ; relation wolf → ally (cause `dragon.crystal`)
- **Chef du Clan du Loup** · Loup : Des étrangers qui tiennent parole. Le Loup n’oubliera pas que vous avez choisi le bon côté.
- **Sage Séraphine** · Sage : Et les Pics n’oublieront pas ce que nous avons laissé entre ses mains.

*Construite selon l’état — plateaux précédents par la force, conduite avide ici ; pacte avec le Loup :*

- **Kestrel** · Éclaireuse : Le repaire du Loup, creusé dans la paroi. Le Cristal brille au fond, posé sur un autel qui n’est pas celui du Dragon. Le chef du Loup le garde lui-même.
- **Chef du Clan du Loup** · Loup : Les étrangers de la trêve. Le pacte scellé avec notre émissaire tient toujours ? Alors laissez le Cristal où il est, et partagez les vallées avec nous.
- **Sage Séraphine** · Sage : Ce Cristal appartient à l’équilibre des Pics, et cet autel n’a rien d’un autel du Loup. Reprenons-le, et rapportons-le à Kaelen.
- **Intendant Maelor** · Intendant : Ou reprenons-le pour nous. Celui qui tient le Cristal tient le Dragon.
- **Alistair** · Décision : Le repaire attend notre réponse.
  - Choix « Prendre le repaire et rapporter le Cristal à Kaelen. » (aperçu : Combat contre le chef du Clan du Loup ; Le Cristal rapporté au Dragon) → fait `dragonCrystalRecovered` ; réputation +1 ; combat `dragon_lair_assault`
  - Choix « Prendre le repaire et garder le Cristal pour le clan. » (aperçu : Combat contre le chef du Clan du Loup ; Le Cristal gardé pour le clan) → fait `dragonCrystalKept` ; réputation -2 ; combat `dragon_lair_seizure`
  - Choix « Tenir parole au Loup et lui laisser le Cristal. » [exige `dragonWolfPact`] (aperçu : 130 or ; Le Loup vous doit une faveur ; Kaelen l’apprendra) → fait `dragonWolfAlliance` ; +130 or ; réputation -3 ; relation wolf → ally (cause `dragon.crystal`)
- **Chef du Clan du Loup** · Loup : Des étrangers qui tiennent parole. Le Loup n’oubliera pas que vous avez choisi le bon côté.
- **Sage Séraphine** · Sage : Et les Pics n’oublieront pas ce que nous avons laissé entre ses mains.

### Avant le combat — `dragon_pre_lair_assault`

- **Chef du Clan du Loup** · Loup : Le Dragon envoie des étrangers chercher ce qu’il n’a pas su garder. Venez le prendre.

- Combat **Assaut du repaire** (`dragon_lair_assault`, boss) : Prenez le repaire du Loup et reprenez le Cristal d’Écho pour Kaelen. Ennemis : boss `wolf_chief` avec wolf_raider, wolf_hunter. Récompense : 90 or, réputation 0, +2 iron_ore.

### Après le combat — `dragon_lair_assault_aftermath`

- **Sage Séraphine** · Sage : Le Cristal d’Écho. Il est chaud, et il tremble comme une source sous la glace. Rapportons-le à Kaelen.
- **Kestrel** · Éclaireuse : Le chef est tombé, mais quelqu’un s’est enfui par le fond du repaire. Pas un guerrier du Loup.

### Avant le combat — `dragon_pre_lair_seizure`

- **Chef du Clan du Loup** · Loup : Vous aussi, vous voulez le Cristal pour vous. Au moins, le Loup ne prétend pas servir l’équilibre.

- Combat **Prise du Cristal** (`dragon_lair_seizure`, boss) : Prenez le repaire du Loup et gardez le Cristal d’Écho pour le clan. Ennemis : boss `wolf_chief` avec wolf_raider, wolf_hunter. Récompense : 150 or, réputation -1, +2 iron_ore.

### Après le combat — `dragon_lair_seizure_aftermath`

- **Intendant Maelor** · Intendant : Le Cristal est à nous. Le Dragon devra traiter avec ceux qui tiennent l’équilibre de ses pics.
- **Marian** · Soigneuse : Ou il viendra le reprendre, et nous n’aurons pas le droit de nous en plaindre.

## Abri des pèlerins — `dragon-second-refuge` (refuge, profondeur 11)

## Camp déserté du Loup — `dragon-shaman-traces` (event, profondeur 12)

### Camp déserté du Loup — `dragon_shaman_traces`

*Construite selon l’état — plateaux précédents par l’honneur, conduite honorable ici (Dragon) ; plateaux précédents par la force, conduite honorable ici :*

- **Kestrel** · Éclaireuse : Le camp du Loup, plus haut que le repaire, déserté en hâte. Une tente à l’écart des autres, pleine de cendres froides et de symboles tracés au sol. — *fait `dragonShamanTraceFound`*
- **Sage Séraphine** · Sage : Le guerrier du Loup que vous avez relâché parlait de ce chaman. Il disait vrai : ces symboles ne sont pas ceux du Loup.
- **Intendant Maelor** · Intendant : Celui qui vivait ici est parti avant nous. Il savait que le repaire tomberait.

*Construite selon l’état — plateaux précédents par la force, conduite avide ici ; pacte avec le Loup :*

- **Kestrel** · Éclaireuse : Le camp du Loup, plus haut que le repaire, déserté en hâte. Une tente à l’écart des autres, pleine de cendres froides et de symboles tracés au sol. — *fait `dragonShamanTraceFound`*
- **Sage Séraphine** · Sage : Ces symboles ne sont pas ceux du Loup. Quelqu’un d’autre vivait parmi eux.
- **Intendant Maelor** · Intendant : Celui qui vivait ici est parti avant nous. Il savait que le repaire tomberait.

## Pèlerins libérés — `dragon-freed-pilgrims` (event, profondeur 13)

### Pèlerins libérés — `dragon_freed_pilgrims`

*Construite selon l’état — plateaux précédents par l’honneur, conduite honorable ici (Dragon) ; plateaux précédents par la force, conduite honorable ici :*

- **Pèlerin du Dragon** · Pèlerins du Dragon : Le Loup nous retenait au repaire pour porter ses vivres. Nous avons tout vu : le Cristal, l’autel, l’étranger qui parlait au chef. On dit que vous avez gardé le hameau des contreforts. Nous en venons presque tous.
- **Pèlerin du Dragon** · Témoignage : Nous voulons le dire nous-mêmes à l’Ancien Kaelen.
- **Sage Séraphine** · Sage : Des témoins libres pèsent plus lourd qu’un récit que nous ferions nous-mêmes.
- **Intendant Maelor** · Intendant : Ils parlent beaucoup, et ce qu’ils diront ne nous appartiendra plus une fois devant Kaelen.
- **Alistair** · Décision : Que faisons-nous d’eux ?
  - Choix « Escorter les pèlerins jusqu’à Kaelen. » (aperçu : Des témoins libres devant Kaelen) → fait `dragonPilgrimsProtected` ; réputation +1
  - Choix « Les faire taire, quel qu’en soit le prix. » (aperçu : Aucun témoin devant Kaelen ; Un acte que les Pics retiendront) → fait `dragonPilgrimsSilenced` ; réputation -2
- **Pèlerin du Dragon** · Escorte : Merci. Nous marcherons avec vous, mais nous parlerons pour nous.
- **Marian** · Soigneuse : Ils se taisent. Les Pics, eux, ne se tairont pas.

*Construite selon l’état — plateaux précédents par la force, conduite avide ici ; pacte avec le Loup :*

- **Pèlerin du Dragon** · Pèlerins du Dragon : Le Loup nous retenait au repaire pour porter ses vivres. Nous avons tout vu : le Cristal, l’autel, l’étranger qui parlait au chef.
- **Pèlerin du Dragon** · Témoignage : Nous voulons le dire nous-mêmes à l’Ancien Kaelen.
- **Sage Séraphine** · Sage : Des témoins libres pèsent plus lourd qu’un récit que nous ferions nous-mêmes.
- **Intendant Maelor** · Intendant : Ils ont vu ce que nous avons fait du Cristal. S’ils parlent à Kaelen, nous n’aurons plus rien à expliquer.
- **Alistair** · Décision : Que faisons-nous d’eux ?
  - Choix « Escorter les pèlerins jusqu’à Kaelen. » (aperçu : Des témoins libres devant Kaelen) → fait `dragonPilgrimsProtected` ; réputation +1
  - Choix « Les faire taire, quel qu’en soit le prix. » (aperçu : Aucun témoin devant Kaelen ; Un acte que les Pics retiendront) → fait `dragonPilgrimsSilenced` ; réputation -2
- **Pèlerin du Dragon** · Escorte : Merci. Nous marcherons avec vous, mais nous parlerons pour nous.
- **Marian** · Soigneuse : Ils se taisent. Les Pics, eux, ne se tairont pas.

## Nid du jeune dragon — `dragon-final-trial-event` (event, profondeur 14)

### Nid du jeune dragon — `dragon_young_dragon`

- **Kestrel** · Éclaireuse : Un nid dans la roche. Un jeune dragon, blessé, le flanc noirci par une souillure qui n’est pas une brûlure.
- **Sage Séraphine** · Sage : La même énergie sombre que sur les créatures des crêtes. Il peut guérir, si nous l’aidons.
- **Intendant Maelor** · Intendant : Ses écailles valent une armure entière chez un bon forgeron. Il ne les sentira pas.
- **Alistair** · Décision : Que faisons-nous ?
  - Choix « Soigner le jeune dragon. » (aperçu : Le jeune dragon soigné) → fait `dragonYoungDragonTended`
  - Choix « Prendre ses écailles. » (aperçu : Une gemme rouge ; Un jeune dragon dépouillé) → fait `dragonScalesTaken` ; +1 red_gem ; réputation -1
- **Marian** · Soigneuse : La souillure recule sous mes mains. Il nous regarde partir sans crainte.
- **Marian** · Soigneuse : Il ne se défend même pas. Je ne sais pas ce qui est le pire.

## Bêtes sous l’emprise des Ombres — `dragon-final-trial-combat` (combat, profondeur 14)

- Combat **Bêtes sous l’emprise des Ombres** (`dragon_shadow_touched`, elite) : Frayez-vous un passage parmi les bêtes sous l’emprise des Ombres. Ennemis : corrupted_beast, wolf, wolf. Récompense : 65 or, réputation +1, +1 red_gem. Défi : Victoire en 8 manches, prime 2 gemmes rouges.

## Autel du Cristal — `dragon-crystal-altar` (mystery, profondeur 15)

### Autel du Cristal — `dragon_crystal_altar`

*Construite selon l’état — plateaux précédents par l’honneur, conduite honorable ici (Dragon) :*

- **Kestrel** · Éclaireuse : L’autel du Cristal, au sommet des Pics. La pierre est fendue, et une souillure noire suinte de la fente, comme de l’encre gelée.
- **Sage Séraphine** · Sage : Les inscriptions que nous rapportons à Kaelen parlaient d’une main capable de tourner le Cristal. Cette souillure est la trace de cette main.
- **Sage Séraphine** · Les Ombres : Je ne l’avais jamais vue d’aussi près, mais je sais ce qu’elle annonce.
- **Intendant Maelor** · Intendant : Et c’est la même souillure que l’éclat du filon sombre, dans notre coffre depuis les montagnes de l’Ours.
- **Alistair** · Décision : Que faisons-nous de cette souillure ?
  - Choix « En sceller un éclat comme preuve. » (aperçu : Une preuve à montrer à Kaelen) → fait `dragonShadowEvidence`
  - Choix « L’effacer sur-le-champ. » (aperçu : L’autel nettoyé ; Aucune preuve à montrer) → fait `dragonShadowPurged` ; réputation -1
- **Sage Séraphine** · Sage : Je l’enferme dans un coffre doublé de plomb, comme les autres. Kaelen devra la voir.
- **Kestrel** · Éclaireuse : La souillure fond sous la flamme. L’autel est propre, et nous ne saurons jamais ce qu’elle était.

*Construite selon l’état — plateaux précédents par la force, conduite avide ici ; pacte avec le Loup :*

- **Kestrel** · Éclaireuse : L’autel du Cristal, au sommet des Pics. La pierre est fendue, et une souillure noire suinte de la fente, comme de l’encre gelée.
- **Sage Séraphine** · Sage : Ce que disait la paroi restera entre nous, comme convenu. Mais cette souillure dit la même chose : quelqu’un a voulu tourner le Cristal.
- **Sage Séraphine** · Les Ombres : Je ne l’avais jamais vue d’aussi près, mais je sais ce qu’elle annonce.
- **Intendant Maelor** · Intendant : Les Ombres ne laissent jamais qu’une trace par endroit. Il faudra les suivre ailleurs.
- **Alistair** · Décision : Que faisons-nous de cette souillure ?
  - Choix « En sceller un éclat comme preuve. » (aperçu : Une preuve à montrer à Kaelen) → fait `dragonShadowEvidence`
  - Choix « L’effacer sur-le-champ. » (aperçu : L’autel nettoyé ; Aucune preuve à montrer) → fait `dragonShadowPurged` ; réputation -1
- **Sage Séraphine** · Sage : Je l’enferme dans un coffre doublé de plomb, comme les autres. Kaelen devra la voir.
- **Kestrel** · Éclaireuse : La souillure fond sous la flamme. L’autel est propre, et nous ne saurons jamais ce qu’elle était.

*Construite selon l’état — plateaux précédents par la force, conduite honorable ici :*

- **Kestrel** · Éclaireuse : L’autel du Cristal, au sommet des Pics. La pierre est fendue, et une souillure noire suinte de la fente, comme de l’encre gelée.
- **Sage Séraphine** · Sage : Les inscriptions que nous rapportons à Kaelen parlaient d’une main capable de tourner le Cristal. Cette souillure est la trace de cette main.
- **Sage Séraphine** · Les Ombres : Je ne l’avais jamais vue d’aussi près, mais je sais ce qu’elle annonce.
- **Intendant Maelor** · Intendant : Les Ombres ne laissent jamais qu’une trace par endroit. Il faudra les suivre ailleurs.
- **Alistair** · Décision : Que faisons-nous de cette souillure ?
  - Choix « En sceller un éclat comme preuve. » (aperçu : Une preuve à montrer à Kaelen) → fait `dragonShadowEvidence`
  - Choix « L’effacer sur-le-champ. » (aperçu : L’autel nettoyé ; Aucune preuve à montrer) → fait `dragonShadowPurged` ; réputation -1
- **Sage Séraphine** · Sage : Je l’enferme dans un coffre doublé de plomb, comme les autres. Kaelen devra la voir.
- **Kestrel** · Éclaireuse : La souillure fond sous la flamme. L’autel est propre, et nous ne saurons jamais ce qu’elle était.

## Veillée sur les Pics — `dragon-final-refuge` (refuge, profondeur 16)

### Veillée sur les Pics — `dragon_vigil`

*Construite selon l’état — plateaux précédents par l’honneur, conduite honorable ici (Dragon) ; plateaux précédents par la force, conduite honorable ici :*

- **Alistair** · Veillée : Kaelen nous attend demain. Tout ce que nous avons fait sur ces pics sera posé devant lui.
- **Marian** · Soigneuse : Les gens du hameau ont fait monter du pain et du bois jusqu’ici. Ils n’ont rien demandé en retour.
- **Sage Séraphine** · Sage : Le Dragon pèse lentement. Il ne nous jugera pas sur nos mots, mais sur ce que les Pics ont retenu de nous.
- **Intendant Maelor** · Intendant : Trois Sceaux, bientôt. Il viendra un jour où quelqu’un voudra savoir à quoi ils nous servent vraiment. J’aimerais avoir la réponse avant lui.

*Construite selon l’état — plateaux précédents par la force, conduite avide ici ; pacte avec le Loup :*

- **Alistair** · Veillée : Kaelen nous attend demain. Tout ce que nous avons fait sur ces pics sera posé devant lui.
- **Marian** · Soigneuse : Personne ne monte jusqu’ici. Le froid, ce soir, nous appartient à nous seuls.
- **Sage Séraphine** · Sage : Le Dragon pèse lentement. Il ne nous jugera pas sur nos mots, mais sur ce que les Pics ont retenu de nous.
- **Intendant Maelor** · Intendant : Trois Sceaux, bientôt. Il viendra un jour où quelqu’un voudra savoir à quoi ils nous servent vraiment. J’aimerais avoir la réponse avant lui.

## Jugement de Kaelen — `dragon-judgement` (boss, profondeur 17)

### Jugement de Kaelen — `dragon_judgement`

*Construite selon l’état — plateaux précédents par l’honneur, conduite honorable ici (Dragon) ; plateaux précédents par la force, conduite honorable ici :*

- **Ancien Dragon Kaelen** · Jugement : Vous revenez des cimes. Les Pics ont déjà parlé avant vous : leurs pèlerins, leurs bêtes, leur autel fendu. Je les ai écoutés. Je vous écouterai ensuite.
- **Ancien Dragon Kaelen** · Les mines : Le Cristal d’Écho chante de nouveau sur son autel, parce que vous avez rapporté le Cristal d’Écho aux Pics au lieu d’en chercher le prix.
- **Sage Séraphine** · Mérites : Il y a aussi ceci, Ancien, et les Pics en gardent la trace : vous avez répondu à mon appel sans rien exiger, vous avez repoussé l’émissaire du Loup, vous avez protégé le hameau que le Loup terrorisait, vous avez désarmé les pièges tendus sur le sentier des pèlerins, vous avez écouté le guerrier du Loup au lieu de le briser, vous m’avez rapporté les inscriptions du Cristal et vous avez soigné le jeune dragon blessé.
- **Ancien Dragon Kaelen** · Témoins : Les pèlerins sont venus d’eux-mêmes raconter ce qu’ils ont vu au repaire. Personne ne leur a dicté leurs mots, et c’est pour cela que je les écoute.
- **Sage Séraphine** · Ombres : Voici l’éclat de la souillure que nous avons scellé près de l’autel. Le Cristal n’a pas seulement été volé, Ancien : une énergie sombre l’a touché.
- **Ancien Dragon Kaelen** · Intention : Ce que les Pics ont vu ne changera plus. Dites-moi seulement ce que vous demandez au Dragon.
  - Choix « Assumer nos actes et réclamer le Sceau. » → issue du jugement : réclamer le Sceau
  - Choix « Demander l’épreuve du Dragon. » (aperçu : Le Sceau sera jugé par la force) → issue du jugement : demander l’épreuve

*Construite selon l’état — plateaux précédents par la force, conduite avide ici ; pacte avec le Loup :*

- **Ancien Dragon Kaelen** · Jugement : Vous revenez des cimes. Les Pics ont déjà parlé avant vous : leurs pèlerins, leurs bêtes, leur autel fendu. Je les ai écoutés. Je vous écouterai ensuite.
- **Ancien Dragon Kaelen** · Les mines : Vous avez repris le Cristal au Loup, c’est vrai. Puis vous avez gardé le Cristal d’Écho pour votre clan, comme si l’équilibre des Pics se vendait.
- **Gardien du Dragon** · Manquements : Et le Dragon n’oubliera pas ce qui pèse contre eux : vous avez pactisé avec le Loup, le hameau a payé deux fois, au Loup puis à vous et un guerrier du Loup a été brisé pour quelques mots.
- **Intendant Maelor** · Réserves : Mes comptes gardent aussi le prix exigé pour votre aide, les pièges retournés au risque des pèlerins, le secret du Cristal gardé pour vous, les écailles prises au jeune dragon et la souillure effacée avant qu’on puisse l’étudier.
- **Ancien Dragon Kaelen** · Témoins : Aucun pèlerin n’est venu parler pour vous. Il ne me reste que ce que les Pics ont retenu.
- **Ancien Dragon Kaelen** · Intention : Ce que les Pics ont vu ne changera plus. Dites-moi seulement ce que vous demandez au Dragon.
  - Choix « Assumer nos actes et réclamer le Sceau. » → issue du jugement : réclamer le Sceau
  - Choix « Demander l’épreuve du Dragon. » (aperçu : Le Sceau sera jugé par la force) → issue du jugement : demander l’épreuve

#### Voie d’honneur

### Avant le combat — `dragon_shaman_pre_combat`

*Construite selon l’état — plateaux précédents par l’honneur, conduite honorable ici (Dragon) ; plateaux précédents par la force, conduite avide ici ; plateaux précédents par la force, conduite honorable ici ; pacte avec le Loup :*

- **Ancien Dragon Kaelen** · Ancien Dragon : Le Cristal a été altéré par une énergie sombre. Le Loup ne l’a pas volé pour lui-même : un Chaman des Ombres le tenait sous son influence.
- **Ancien Dragon Kaelen** · Alliance : Ce chaman s’est enfui vers les cimes. Traquez-le et purgez cette menace, et le Sceau du Dragon scellera notre alliance.
- **Sage Séraphine** · Sage : Celui qui tourne le Cristal ne reste jamais près de l’autel. Il faudra aller le chercher.
- **Chaman des Ombres** · Chaman des Ombres : Vous avez rendu au Dragon son jouet. Vous n’avez pas encore compris qui écoute quand le Cristal résonne.

- Combat **Chaman des Ombres** (`dragon_shadow_shaman`, boss) : Traquez le Chaman des Ombres avant qu’il ne quitte les Pics. Ennemis : boss `shadow_shaman` avec wolf_raider, wolf. Récompense : 110 or, réputation +1, +1 red_gem.

### Après le combat — `dragon_shaman_aftermath`

- **Chaman des Ombres** · Vaincu : Le Cristal… n’était qu’un écho. Ceux que je sers écoutent d’autres échos, partout où vos Sceaux vous mènent.
- **Sage Séraphine** · Sage : Les Ombres, derrière un troisième clan. Le Loup n’était qu’une main de plus, comme le Corbeau avant lui.

#### Voie de force

### Avant le combat — `dragon_kaelen_pre_combat`

- **Ancien Dragon Kaelen** · Ancien Dragon : Vous voulez mon Sceau sans le mériter. Alors prouvez votre force à ceux qui gardent l’équilibre : mes gardiens et moi, contre votre compagnie.
- **Alistair** · Épreuve : Nous l’assumerons.

- Combat **Épreuve du Dragon** (`dragon_kaelen`, boss) : Affrontez Kaelen et ses gardiens pour le Sceau du Dragon. Ennemis : boss `kaelen` avec dragon_guardian, dragon_guardian. Récompense : 90 or, réputation 0.

### Après le combat — `dragon_trial_aftermath`

- **Ancien Dragon Kaelen** · Ancien Dragon : Le Sceau est à vous. Les Pics l’ont vu. Ne comptez plus sur la sagesse du Dragon le jour où vous en aurez besoin.

### Épilogue — `dragon_epilogue`

*Construite selon l’état — plateaux précédents par l’honneur, conduite honorable ici (Dragon) ; plateaux précédents par la force, conduite honorable ici :*

- **Sage Séraphine** · Bilan : Le Sceau du Dragon est entre vos mains, mais vous avez pris le Sceau du Dragon par l’épreuve. Les gardiens de Kaelen vous ont laissé passer ; le Dragon n’oubliera pas ce Sceau arraché.
- **Intendant Maelor** · Conséquence : L’éclat de la souillure du Cristal voyage avec nous, scellé avec les autres. Chaque Sceau ajoute une pièce à un tableau que je n’aime pas regarder.
- **Sage Séraphine** · Chronique : Trois Sceaux. Le Tournoi des Grands n’est plus très loin, et chaque clan que nous avons croisé se souviendra de la manière dont nous avons avancé. — *clôture du plateau dragon*

*Construite selon l’état — plateaux précédents par la force, conduite avide ici ; pacte avec le Loup :*

- **Sage Séraphine** · Bilan : Le Sceau du Dragon est entre vos mains, mais vous avez pris le Sceau du Dragon par l’épreuve. Les gardiens de Kaelen vous ont laissé passer ; le Dragon n’oubliera pas ce Sceau arraché.
- **Intendant Maelor** · Conséquence : La souillure est restée là-haut, ou n’est plus. Ce que les Ombres voulaient du Cristal, nous ne le saurons que plus tard.
- **Sage Séraphine** · Chronique : Trois Sceaux. Le Tournoi des Grands n’est plus très loin, et chaque clan que nous avons croisé se souviendra de la manière dont nous avons avancé. — *clôture du plateau dragon*

## Fouilles et gardiens (POI facultatifs)

- **Réserve des contreforts** (`dragon-poi-foothill-supplies`, région 1) : chest
- **Meute des contreforts** (`dragon-poi-foothill-wolves`, région 1) : combat — variantes dragon_poi_foothill_wolves_a, dragon_poi_foothill_wolves_b
  - Combat **Meute des contreforts** (`dragon_poi_foothill_wolves_a`, normal) : Remportez ce combat facultatif. Ennemis : wolf, wolf. Récompense : 30 or, réputation 0.
  - Combat **Meute des contreforts** (`dragon_poi_foothill_wolves_b`, normal) : Remportez ce combat facultatif. Ennemis : wolf, wolf, wolf. Récompense : 30 or, réputation 0.
- **Bêtes du ravin** (`dragon-poi-foothill-beasts`, région 1) : combat — variantes dragon_poi_foothill_beasts_a, dragon_poi_foothill_beasts_b
  - Combat **Bêtes du ravin** (`dragon_poi_foothill_beasts_a`, normal) : Remportez ce combat facultatif. Ennemis : wild_boar, forest_badger. Récompense : 25 or, réputation 0, +1 iron_ore. Défi : 3 héros au plus, prime 1 gemme rouge.
  - Combat **Bêtes du ravin** (`dragon_poi_foothill_beasts_b`, normal) : Remportez ce combat facultatif. Ennemis : wild_boar, wild_boar. Récompense : 25 or, réputation 0, +1 iron_ore. Défi : 3 héros au plus, prime 1 gemme rouge.
- **Cache du sentier** (`dragon-poi-foothill-cache`, région 1) : chest
- **Dépôt des terrasses** (`dragon-poi-terrace-supplies`, région 2) : chest
- **Ravine des crêtes** (`dragon-poi-terrace-ravine`, région 2) : combat — variantes dragon_poi_terrace_ravine_a, dragon_poi_terrace_ravine_b
  - Combat **Ravine des crêtes** (`dragon_poi_terrace_ravine_a`, normal) : Remportez ce combat facultatif. Ennemis : young_wyrm, cave_rat, cave_rat. Récompense : 35 or, réputation 0.
  - Combat **Ravine des crêtes** (`dragon_poi_terrace_ravine_b`, normal) : Remportez ce combat facultatif. Ennemis : wild_boar, young_wyrm. Récompense : 35 or, réputation 0.
- **Cache du Loup** (`dragon-poi-terrace-cache`, région 2) : chest
- **Pillards du Loup** (`dragon-poi-terrace-raiders`, région 2) : combat — variantes dragon_poi_terrace_raiders_a, dragon_poi_terrace_raiders_b
  - Combat **Pillards du Loup** (`dragon_poi_terrace_raiders_a`, normal) : Remportez ce combat facultatif. Ennemis : wolf_raider, wolf. Récompense : 40 or, réputation 0, +1 iron_ore.
  - Combat **Pillards du Loup** (`dragon_poi_terrace_raiders_b`, normal) : Remportez ce combat facultatif. Ennemis : wolf_raider, wolf_hunter. Récompense : 40 or, réputation 0, +1 iron_ore.
- **Réserves des cimes** (`dragon-poi-peak-supplies`, région 3) : chest
- **Chasseurs du Loup** (`dragon-poi-peak-hunters`, région 3) : combat — variantes dragon_poi_peak_hunters_a, dragon_poi_peak_hunters_b
  - Combat **Chasseurs du Loup** (`dragon_poi_peak_hunters_a`, normal) : Remportez ce combat facultatif. Ennemis : wolf_hunter, wolf_raider, wolf. Récompense : 45 or, réputation 0.
  - Combat **Chasseurs du Loup** (`dragon_poi_peak_hunters_b`, normal) : Remportez ce combat facultatif. Ennemis : wolf_raider, wolf_hunter, wolf_raider. Récompense : 45 or, réputation 0.
- **Veille des cimes** (`dragon-poi-peak-watch`, région 3) : combat — variantes dragon_poi_peak_watch_a, dragon_poi_peak_watch_b
  - Combat **Veille des cimes** (`dragon_poi_peak_watch_a`, normal) : Remportez ce combat facultatif. Ennemis : young_wyrm, wolf, wolf. Récompense : 45 or, réputation 0, +1 iron_ore.
  - Combat **Veille des cimes** (`dragon_poi_peak_watch_b`, normal) : Remportez ce combat facultatif. Ennemis : wolf, young_wyrm, wolf. Récompense : 45 or, réputation 0, +1 iron_ore.
- **Réserve des cimes gardée** (`dragon-poi-peak-reserve`, région 3) : chest
- Gardien **Champion du Loup** (`dragon-guardian-terrace`) sur `dragon-poi-terrace-cache`, deux vagues :
  - Combat **Champion du Loup** (`dragon_guardian_champion`, elite) : Affrontez le gardien pour ouvrir son coffre. Ennemis : wolf_champion, wolf_raider, wolf. Récompense : 65 or, réputation +1, +2 iron_ore. Défi : 3 héros au plus, prime 2 gemmes rouges.
- Gardien **Wyrm des cimes** (`dragon-guardian-peak`) sur `dragon-poi-peak-reserve`, deux vagues :
  - Combat **Wyrm des cimes** (`dragon_guardian_wyrm`, elite) : Affrontez le gardien pour ouvrir son coffre. Ennemis : shadow_wyrm, young_wyrm, young_wyrm. Récompense : 75 or, réputation +1, +1 red_gem. Défi : 3 héros au plus, prime 2 gemmes rouges.

## Ce que Kaelen pèse au jugement

| Fait | Nature | Poids | Phrase dite au jugement |
| --- | --- | --- | --- |
| `dragonCrystalRecovered` | merit (decisive) | 2 | vous avez rapporté le Cristal d’Écho aux Pics |
| `dragonMandateHonour` | merit (important) | 1 | vous avez répondu à mon appel sans rien exiger |
| `dragonWolfOfferRefused` | merit (important) | 1 | vous avez repoussé l’émissaire du Loup |
| `dragonVillageProtected` | merit (important) | 1 | vous avez protégé le hameau que le Loup terrorisait |
| `dragonTrapsDisarmed` | merit (minor) | 1 | vous avez désarmé les pièges tendus sur le sentier des pèlerins |
| `dragonWolfHeard` | merit (important) | 1 | vous avez écouté le guerrier du Loup au lieu de le briser |
| `dragonCluesShared` | merit (important) | 1 | vous m’avez rapporté les inscriptions du Cristal |
| `dragonYoungDragonTended` | merit (important) | 1 | vous avez soigné le jeune dragon blessé |
| `dragonCrystalKept` | breach (decisive) | -2 | vous avez gardé le Cristal d’Écho pour votre clan |
| `dragonWolfAlliance` | breach (decisive) | -3 | vous avez laissé le Cristal aux mains du Loup |
| `dragonWolfPact` | breach (decisive) | -2 | vous avez pactisé avec le Loup |
| `dragonVillageExtorted` | breach (important) | -2 | le hameau a payé deux fois, au Loup puis à vous |
| `dragonWolfTortured` | breach (important) | -2 | un guerrier du Loup a été brisé pour quelques mots |
| `dragonMandatePrice` | stain (minor) | -1 | le prix exigé pour votre aide |
| `dragonTrapsTurned` | stain (minor) | -1 | les pièges retournés au risque des pèlerins |
| `dragonCluesHidden` | stain (minor) | -1 | le secret du Cristal gardé pour vous |
| `dragonScalesTaken` | stain (minor) | -1 | les écailles prises au jeune dragon |
| `dragonShadowPurged` | stain (minor) | -1 | la souillure effacée avant qu’on puisse l’étudier |

Crédibilité devant Kaelen (proposée) : crédible à 60, haute à 75. Faits de force : `dragonCrystalKept`, `dragonWolfAlliance`, `dragonPilgrimsSilenced`. Fait d’honneur : `dragonCrystalRecovered`.

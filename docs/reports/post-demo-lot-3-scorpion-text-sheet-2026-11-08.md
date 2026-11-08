# Fiche de texte — Les Déserts Arides (Grand Inquisiteur) — BROUILLON

Générée par `tools/narrative/plateau-text-sheet.ts` depuis le contenu jouable. Brouillon : rien ici n’est canon avant l’approbation du plateau par l’opérateur.

## Parcours, scènes et combats

## Bord des Déserts Arides — `scorpion-camp` (story, profondeur 0)

### Bord des Déserts Arides — `scorpion_arrival`

- **Alistair** · Déserts Arides : Les Déserts Arides. Trois Sceaux dans notre coffre, et un soleil qui ne pardonne rien.
- **Sage Séraphine** · Sage : Le Clan du Scorpion garde ici des secrets plus anciens que ses dunes. Ses érudits savent beaucoup, et ils ne disent jamais tout.
- **Intendant Maelor** · Intendant : Un clan qui collectionne les secrets. Voyons ce qu’il est prêt à échanger contre les nôtres.

## Audience du Grand Inquisiteur — `scorpion-audience` (story, profondeur 1)

### Audience du Grand Inquisiteur — `scorpion_audience`

*Construite selon l’état — plateaux précédents par l’honneur, conduite honorable ici (Scorpion) :*

- **Grand Inquisiteur** · Grand Inquisiteur : Le Clan du Phénix garde dans son temple un codex prophétique, plus ancien que nos deux clans. Il pourrait révéler la vraie nature des Ombres Silencieuses.
- **Grand Inquisiteur** · Trois Sceaux : On dit que Kaelen vous a confié le Sceau du Dragon, et qu’un Chaman des Ombres est tombé sur ses cimes. Le Dragon se trompe rarement. Je vérifierai par moi-même.
- **Grand Inquisiteur** · Requête : Le Phénix est trop idéaliste pour comprendre ce qu’il garde. Il prie devant ses flammes purificatrices et laisse dormir le seul texte qui pourrait nous armer. Rapportez-moi ce codex, et le Sceau du Scorpion entendra votre nom.
- **Sage Séraphine** · Sage : Un savoir interdit l’est rarement sans raison, Grand Inquisiteur. Et un texte lu par un seul clan ne dit que ce que ce clan veut y lire. Cherchons la vérité par nous-mêmes avant de la confier à qui que ce soit.
- **Intendant Maelor** · Intendant : Ou lisons ce codex avant tout le monde. Un savoir que tous les clans convoitent vaut plus que n’importe quel Sceau, pour qui sait à qui le vendre… Je dis seulement ce que chacun pense devant ce marché.
- **Alistair** · Clan sans terre : Nous sommes venus chercher un Sceau, pas un savoir à revendre.
- **Grand Inquisiteur** · Mandat : Alors. Me rapporterez-vous le codex prophétique ?
  - Choix « Rapporter le codex sans marchander. » (aperçu : Parole claire devant le Scorpion ; Le Grand Inquisiteur observe votre conduite) → fait `scorpionMandateHonour` ; réputation +1
  - Choix « Exiger de lire le codex avant lui. » (aperçu : Le codex lu avant lui ; L’exigence pèsera dans le jugement) → fait `scorpionMandateTerms` ; réputation -1
- **Grand Inquisiteur** · Parole : Bien. Le temple est loin, et le Phénix ne prête rien à personne.
- **Grand Inquisiteur** · Parole conditionnée : Vous voulez lire avant moi ce que je cherche depuis des années. Soit. Mes érudits noteront aussi cette exigence.

*Construite selon l’état — plateaux précédents par la force, conduite avide ici ; plateaux précédents par la force, conduite honorable ici ; serment juré au Phénix :*

- **Grand Inquisiteur** · Grand Inquisiteur : Le Clan du Phénix garde dans son temple un codex prophétique, plus ancien que nos deux clans. Il pourrait révéler la vraie nature des Ombres Silencieuses.
- **Grand Inquisiteur** · Trois Sceaux : Mes érudits ont aussi noté le Sceau du Dragon arraché à Kaelen par l’épreuve. Je ne juge pas encore. Je note.
- **Grand Inquisiteur** · Requête : Le Phénix est trop idéaliste pour comprendre ce qu’il garde. Il prie devant ses flammes purificatrices et laisse dormir le seul texte qui pourrait nous armer. Rapportez-moi ce codex, et le Sceau du Scorpion entendra votre nom.
- **Sage Séraphine** · Sage : Un savoir interdit l’est rarement sans raison, Grand Inquisiteur. Et un texte lu par un seul clan ne dit que ce que ce clan veut y lire. Cherchons la vérité par nous-mêmes avant de la confier à qui que ce soit.
- **Intendant Maelor** · Intendant : Ou lisons ce codex avant tout le monde. Un savoir que tous les clans convoitent vaut plus que n’importe quel Sceau, pour qui sait à qui le vendre… Je dis seulement ce que chacun pense devant ce marché.
- **Alistair** · Clan sans terre : Nous sommes venus chercher un Sceau, pas un savoir à revendre.
- **Grand Inquisiteur** · Mandat : Alors. Me rapporterez-vous le codex prophétique ?
  - Choix « Rapporter le codex sans marchander. » (aperçu : Parole claire devant le Scorpion ; Le Grand Inquisiteur observe votre conduite) → fait `scorpionMandateHonour` ; réputation +1
  - Choix « Exiger de lire le codex avant lui. » (aperçu : Le codex lu avant lui ; L’exigence pèsera dans le jugement) → fait `scorpionMandateTerms` ; réputation -1
- **Grand Inquisiteur** · Parole : Bien. Le temple est loin, et le Phénix ne prête rien à personne.
- **Grand Inquisiteur** · Parole conditionnée : Vous voulez lire avant moi ce que je cherche depuis des années. Soit. Mes érudits noteront aussi cette exigence.

## Bêtes des dunes — `scorpion-opening-ambush` (combat, profondeur 2)

- Combat **Bêtes des dunes** (`scorpion_dune_beasts`, normal) : Repoussez les bêtes qui guettent la première piste. Ennemis : venom_serpent, forest_spider, cave_rat. Récompense : 30 or, réputation 0.

## Érudits du Scorpion — `scorpion-scholars` (event, profondeur 3)

### Érudits du Scorpion — `scorpion_scholars`

- **Kestrel** · Éclaireuse : Un camp d’érudits du Scorpion sur la piste du temple. Ils ont attaché un fidèle du Phénix au pied d’une tente, et ils l’interrogent depuis l’aube.
- **Érudit du Scorpion** · Scorpion : Il connaît les passages du temple. Il finira par les dire. Le Grand Inquisiteur nous a laissé le temps qu’il faudra.
- **Fidèle captif** · Phénix : Je ne dirai rien du temple. Faites de moi ce que vous voudrez.
- **Intendant Maelor** · Intendant : Laissons les érudits travailler. Ce qu’il dira nous servira autant qu’à eux, et le Scorpion saura que nous ne le gênons pas.
- **Marian** · Soigneuse : Ils le privent d’eau depuis l’aube. Il ne tiendra pas jusqu’au soir.
- **Alistair** · Décision : Que faisons-nous ?
  - Choix « Libérer le fidèle du Phénix. » (aperçu : Un fidèle libre ; Le Grand Inquisiteur l’apprendra) → fait `scorpionFaithfulFreed`
  - Choix « Le laisser aux érudits. » (aperçu : 50 or des érudits ; Un acte que le Scorpion consignera) → fait `scorpionFaithfulAbandoned` ; +50 or ; réputation -2
- **Fidèle captif** · Aveu : Vous n’êtes pas des leurs ? Alors écoutez : au temple, un étranger parle à nos gardiens depuis des lunes. Il prophétise, et ils l’écoutent.
- **Érudit du Scorpion** · Scorpion : Le Grand Inquisiteur saura qui nous a pris notre témoin.
- **Érudit du Scorpion** · Scorpion : Prenez ceci pour la route. Le Scorpion sait remercier ceux qui ne le gênent pas.
- **Marian** · Soigneuse : Il nous a regardés partir. Je n’oublierai pas ce regard.

## Fidèles du Phénix — `scorpion-phoenix-faithful` (event, profondeur 4)

### Fidèles du Phénix — `scorpion_phoenix_faithful`

- **Kestrel** · Éclaireuse : Des fidèles du Phénix gardent la route de leur temple. Ils ne portent pas d’armes, seulement des lampes allumées en plein jour.
- **Fidèle du Phénix** · Phénix : Vous marchez vers le temple, et nous savons qui vous envoie. Le Scorpion veut notre codex depuis toujours. Il le lirait comme il lit tout : pour s’en servir.
- **Fidèle du Phénix** · Serment : Jurez que vous ne le lui livrerez pas, et le Phénix se souviendra de vous.
- **Sage Séraphine** · Sage : Le Phénix garde ses flammes et ses textes avec la même foi. Un serment ici nous lierait autant qu’une dette. Ne promettons que ce que nous tiendrons.
- **Intendant Maelor** · Intendant : Un serment ne coûte rien à prononcer. Ce qu’on en fait ensuite, c’est une autre affaire.
- **Alistair** · Décision : Que leur répondons-nous ?
  - Choix « Ne rien leur promettre. » (aperçu : Aucune parole donnée au Phénix) → fait `scorpionOathRefused`
  - Choix « Jurer de ne pas livrer le codex au Grand Inquisiteur. » (aperçu : Un serment au Phénix ; Le Grand Inquisiteur l’apprendra) → fait `scorpionPhoenixOath`
- **Fidèle du Phénix** · Phénix : Alors passez. Le Phénix jugera vos actes à son temple, pas vos paroles sur la route.
- **Fidèle du Phénix** · Serment : Le Phénix se souviendra de ce serment. À son temple, nos gardiens le sauront.
- **Sage Séraphine** · Sage : Nous voilà liés. Le Grand Inquisiteur n’aimera pas l’apprendre.

## Énigme des sables — `scorpion-first-trial-event` (event, profondeur 5)

### Énigme des sables — `scorpion_sand_riddle`

- **Sage Séraphine** · Sage : Une porte de pierre, couverte de signes anciens. Une énigme y est gravée ; les textes du Phénix en donnent la réponse à qui prend le temps de les lire.
- **Kestrel** · Éclaireuse : Ou il y a un levier de bronze derrière la pierre, à portée de lame. Le mécanisme céderait en un coup.
- **Intendant Maelor** · Intendant : Le temps, c’est ce qui nous manque. Brisons-le.
- **Alistair** · Décision : Comment passons-nous ?
  - Choix « Chercher la réponse dans les textes. » (aperçu : La porte intacte) → fait `scorpionRiddleSolved`
  - Choix « Briser le mécanisme. » (aperçu : 40 or dans la niche du mécanisme ; Une porte du Phénix brisée) → fait `scorpionRiddleForced` ; +40 or ; réputation -1
- **Sage Séraphine** · Sage : La réponse était dans le troisième texte. La porte s’ouvre sans un bruit, comme si elle nous attendait.
- **Kestrel** · Éclaireuse : Le mécanisme a cédé. Il y avait des pièces dans sa niche, une offrande oubliée. La porte, elle, ne se refermera plus.

## Éclaireurs du Phénix — `scorpion-first-trial-combat` (combat, profondeur 5)

- Combat **Éclaireurs du Phénix** (`scorpion_phoenix_scouts`, normal) : Passez les éclaireurs du Phénix qui gardent le chemin de l’oasis. Ennemis : phoenix_guardian, venom_serpent, phoenix_guardian. Récompense : 40 or, réputation 0.

## Oasis des érudits — `scorpion-first-refuge` (refuge, profondeur 6)

### Oasis des érudits — `scorpion_oasis_gathering`

- **Alistair** · Oasis : Une oasis tenue par les érudits du Scorpion. L’eau est fraîche, et personne ne nous demande rien. Pas encore.
- **Intendant Maelor** · Intendant : Ici, même l’eau a un prix. On nous le dira plus tard.
- **Sage Séraphine** · Sage : Reposons-nous. Les ruines du Phénix commencent derrière ces palmiers, et elles sont gardées.

## Sceaux de garde — `scorpion-warded-path` (event, profondeur 7)

### Sceaux de garde — `scorpion_warded_path`

- **Kestrel** · Éclaireuse : Des sceaux de garde tracés au sol, en travers de la route des ruines. Le premier qui marche dessus s’embrase.
- **Sage Séraphine** · Sage : Ce sont des sceaux du Phénix. Ils se lèvent selon un rite que je sais lire : il y faut du temps, et du respect.
- **Intendant Maelor** · Intendant : Ou un bon coup de marteau. Un sceau brisé ne brûle plus personne.
- **Alistair** · Décision : Que faisons-nous de ces sceaux ?
  - Choix « Les lever selon leur rite. » (aperçu : La route ouverte selon le rite du Phénix) → fait `scorpionWardsRespected`
  - Choix « Les briser sans attendre. » (aperçu : La route ouverte tout de suite ; Des sceaux du Phénix brisés) → fait `scorpionWardsBroken` ; réputation -1
- **Sage Séraphine** · Sage : Les sceaux s’éteignent un à un, sans fumée. Les fidèles du Phénix sauront que quelqu’un a respecté leur rite.
- **Kestrel** · Éclaireuse : Les sceaux ont volé en éclats. La route est ouverte, et noire de suie.

## Sentinelles du temple — `scorpion-ruin-road` (combat, profondeur 8)

- Combat **Sentinelles du temple** (`scorpion_temple_sentinels`, normal) : Ouvrez la route des ruines tenue par les sentinelles du Phénix. Ennemis : phoenix_guardian, phoenix_guardian, venom_serpent. Récompense : 45 or, réputation 0, +1 iron_ore.

## Bibliothèque ensevelie — `scorpion-second-trial-event` (event, profondeur 9)

### Bibliothèque ensevelie — `scorpion_buried_library`

- **Kestrel** · Éclaireuse : Une bibliothèque du Phénix, à moitié ensevelie. Le sable a gardé ses rouleaux mieux que n’importe quel gardien.
- **Sage Séraphine** · Sage : Des siècles de textes. Les déplacer les tuerait ; les lire ici prendrait des années.
- **Intendant Maelor** · Intendant : Quelques rouleaux bien choisis valent une fortune chez les érudits du Scorpion. Ils ne demanderont pas d’où ils viennent.
- **Marian** · Soigneuse : Ce sont les souvenirs d’un clan. On ne vend pas les souvenirs des autres.
- **Alistair** · Décision : Que faisons-nous de cette bibliothèque ?
  - Choix « La laisser intacte. » (aperçu : La bibliothèque laissée au Phénix) → fait `scorpionLibraryRespected`
  - Choix « Emporter des rouleaux pour les vendre. » (aperçu : 80 or ; Des rouleaux du Phénix vendus) → fait `scorpionLibraryLooted` ; +80 or ; réputation -1
- **Sage Séraphine** · Sage : Je recouvre l’entrée de sable. Elle a attendu des siècles ; elle attendra encore.
- **Intendant Maelor** · Intendant : Un érudit du Scorpion campait près des ruines. Il a payé les rouleaux sans discuter, et sans demander d’où ils venaient.

## Gardien de flamme — `scorpion-second-trial-combat` (combat, profondeur 9)

- Combat **Gardien de flamme** (`scorpion_flamekeeper`, elite) : Venez à bout du gardien de flamme du Phénix. Ennemis : phoenix_flamekeeper, phoenix_guardian. Récompense : 70 or, réputation 0, +1 iron_ore. Défi : Sans objets, prime 2 gemmes rouges.

## Temple du Phénix — `scorpion-phoenix-temple` (story, profondeur 10)

### Temple du Phénix — `scorpion_phoenix_temple`

*Construite selon l’état — plateaux précédents par l’honneur, conduite honorable ici (Scorpion) ; plateaux précédents par la force, conduite honorable ici :*

- **Kestrel** · Éclaireuse : Le Temple du Phénix. Une flamme brûle au cœur de la nef, et le codex repose devant elle, gardé par le chef des gardiens en personne.
- **Chef des gardiens du Phénix** · Phénix : Le Scorpion envoie des étrangers prendre ce qu’il n’ose pas réclamer lui-même. Ce codex ne quittera pas sa flamme.
- **Sage Séraphine** · Sage : Le Grand Inquisiteur attend ce codex, et notre parole le lui promet. Mais souvenez-vous : celui qui lira ces pages leur fera dire ce qu’il voudra.
- **Intendant Maelor** · Intendant : Ou gardons-le. Le seul texte qui parle des Ombres, entre nos mains : le Scorpion devra traiter avec nous, et le Phénix aussi.
- **Alistair** · Décision : Le temple attend notre réponse.
  - Choix « Prendre le codex pour le Grand Inquisiteur. » (aperçu : Combat contre le chef des gardiens du Phénix ; Le codex rapporté au Scorpion) → fait `scorpionCodexDelivered` ; réputation +1 ; combat `scorpion_temple_assault`
  - Choix « Prendre le codex et le garder pour le clan. » (aperçu : Combat contre le chef des gardiens du Phénix ; Le codex gardé pour le clan) → fait `scorpionCodexKept` ; réputation -2 ; combat `scorpion_temple_seizure`
  - Choix « Tenir notre serment et laisser le codex au Phénix. » [exige `scorpionPhoenixOath`] (aperçu : Le Phénix vous doit une faveur ; Le Grand Inquisiteur l’apprendra) → fait `scorpionCodexProtected` ; réputation -1 ; relation phoenix → ally (cause `scorpion.codex`)
- **Chef des gardiens du Phénix** · Phénix : Des étrangers qui tiennent parole. Le Phénix n’oubliera pas que vous avez laissé sa flamme en paix.
- **Sage Séraphine** · Sage : Et le Grand Inquisiteur n’oubliera pas que nous revenons les mains vides.

*Construite selon l’état — plateaux précédents par la force, conduite avide ici ; serment juré au Phénix :*

- **Kestrel** · Éclaireuse : Le Temple du Phénix. Une flamme brûle au cœur de la nef, et le codex repose devant elle, gardé par le chef des gardiens en personne.
- **Chef des gardiens du Phénix** · Phénix : Les étrangers du serment fait à nos fidèles. Tenez-le, et laissez le codex à sa flamme. Rompez-le, et le Phénix saura ce que vaut votre parole.
- **Sage Séraphine** · Sage : Nous avons promis ce codex au Grand Inquisiteur, et juré au Phénix de ne pas le lui livrer. L’une de ces deux paroles va se briser ici.
- **Intendant Maelor** · Intendant : Ou gardons-le. Le seul texte qui parle des Ombres, entre nos mains : le Scorpion devra traiter avec nous, et le Phénix aussi.
- **Alistair** · Décision : Le temple attend notre réponse.
  - Choix « Prendre le codex pour le Grand Inquisiteur. » (aperçu : Combat contre le chef des gardiens du Phénix ; Le codex rapporté au Scorpion) → fait `scorpionCodexDelivered` ; réputation +1 ; combat `scorpion_temple_assault`
  - Choix « Prendre le codex et le garder pour le clan. » (aperçu : Combat contre le chef des gardiens du Phénix ; Le codex gardé pour le clan) → fait `scorpionCodexKept` ; réputation -2 ; combat `scorpion_temple_seizure`
  - Choix « Tenir notre serment et laisser le codex au Phénix. » [exige `scorpionPhoenixOath`] (aperçu : Le Phénix vous doit une faveur ; Le Grand Inquisiteur l’apprendra) → fait `scorpionCodexProtected` ; réputation -1 ; relation phoenix → ally (cause `scorpion.codex`)
- **Chef des gardiens du Phénix** · Phénix : Des étrangers qui tiennent parole. Le Phénix n’oubliera pas que vous avez laissé sa flamme en paix.
- **Sage Séraphine** · Sage : Et le Grand Inquisiteur n’oubliera pas que nous revenons les mains vides.

### Avant le combat — `scorpion_pre_temple_assault`

- **Chef des gardiens du Phénix** · Phénix : Le Scorpion lit tout et ne comprend rien. Ce codex ne quittera pas sa flamme tant que je respire.

- Combat **Assaut du temple** (`scorpion_temple_assault`, boss) : Entrez dans le Temple du Phénix et prenez le codex pour le Grand Inquisiteur. Ennemis : boss `phoenix_guardian_chief` avec phoenix_guardian, phoenix_guardian. Récompense : 100 or, réputation 0, +2 iron_ore.

### Après le combat — `scorpion_temple_assault_aftermath`

- **Sage Séraphine** · Sage : Le codex. Ses pages sont chaudes, comme si la flamme les avait lues avant nous. Rapportons-le au Grand Inquisiteur.
- **Kestrel** · Éclaireuse : Le chef des gardiens est tombé. Mais une cellule, à l’écart de la nef, a été vidée en hâte : quelqu’un est parti avant nous.

### Avant le combat — `scorpion_pre_temple_seizure`

- **Chef des gardiens du Phénix** · Phénix : Ni pour le Scorpion, ni pour le Phénix : pour vous seuls. Vous ne valez pas mieux que ceux qui vous envoient.

- Combat **Prise du codex** (`scorpion_temple_seizure`, boss) : Entrez dans le Temple du Phénix et prenez le codex pour le clan. Ennemis : boss `phoenix_guardian_chief` avec phoenix_guardian, phoenix_guardian. Récompense : 160 or, réputation -1, +2 iron_ore.

### Après le combat — `scorpion_temple_seizure_aftermath`

- **Intendant Maelor** · Intendant : Le codex est à nous. Le Scorpion et le Phénix devront traiter avec ceux qui le tiennent.
- **Marian** · Soigneuse : Ou ils s’uniront pour le reprendre, et nous n’aurons pas le droit de nous en plaindre.

## Abri des caravanes — `scorpion-second-refuge` (refuge, profondeur 11)

## Cellule du Prophète — `scorpion-prophet-traces` (event, profondeur 12)

### Cellule du Prophète — `scorpion_prophet_traces`

*Construite selon l’état — plateaux précédents par l’honneur, conduite honorable ici (Scorpion) ; plateaux précédents par la force, conduite honorable ici :*

- **Kestrel** · Éclaireuse : Une cellule à l’écart du temple, vidée en hâte. Des feuillets épars, couverts d’une écriture serrée qui n’est pas celle du Phénix. — *fait `scorpionProphetTraceFound`*
- **Sage Séraphine** · Sage : Le fidèle que vous avez arraché aux érudits parlait de ce prophète. Il disait vrai : ces feuillets sont des prophéties, et aucune n’est du Phénix.
- **Intendant Maelor** · Intendant : Celui qui écrivait ici est parti avant nous. Il savait qu’on viendrait le chercher.

*Construite selon l’état — plateaux précédents par la force, conduite avide ici ; serment juré au Phénix :*

- **Kestrel** · Éclaireuse : Une cellule à l’écart du temple, vidée en hâte. Des feuillets épars, couverts d’une écriture serrée qui n’est pas celle du Phénix. — *fait `scorpionProphetTraceFound`*
- **Sage Séraphine** · Sage : Ces feuillets sont des prophéties, et aucune n’est du Phénix. Quelqu’un vivait ici et parlait à sa place.
- **Intendant Maelor** · Intendant : Celui qui écrivait ici est parti avant nous. Il savait qu’on viendrait le chercher.

## Fidèles rescapés — `scorpion-temple-witnesses` (event, profondeur 13)

### Fidèles rescapés — `scorpion_temple_witnesses`

*Construite selon l’état — plateaux précédents par l’honneur, conduite honorable ici (Scorpion) :*

- **Fidèle du Phénix** · Fidèles rescapés : Nous avons fui le temple pendant le combat. Nous avons tout vu : le codex, la flamme, et l’étranger qui murmurait à nos gardiens des prophéties que personne n’avait jamais lues.
- **Fidèle du Phénix** · Témoignage : Nous voulons le dire nous-mêmes au Grand Inquisiteur. Que le Scorpion sache que le Phénix n’a pas choisi cette haine seul.
- **Sage Séraphine** · Sage : Comme les pèlerins du Dragon, ils veulent parler avec leurs propres mots. Laissons-les marcher avec nous.
- **Intendant Maelor** · Intendant : Des fidèles du Phénix devant le Grand Inquisiteur… Il les écoutera, puis il les gardera. Le Scorpion ne laisse jamais repartir un témoin.
- **Alistair** · Décision : Que faisons-nous d’eux ?
  - Choix « Escorter les fidèles jusqu’au Grand Inquisiteur. » (aperçu : Des témoins libres devant le Grand Inquisiteur) → fait `scorpionWitnessesProtected` ; réputation +1
  - Choix « Les réduire au silence, quel qu’en soit le prix. » (aperçu : Aucun témoin devant le Grand Inquisiteur ; Un acte que le désert retiendra) → fait `scorpionWitnessesSilenced` ; réputation -2
- **Fidèle du Phénix** · Escorte : Merci. Nous marcherons avec vous, mais nous parlerons pour nous.
- **Marian** · Soigneuse : Ils se taisent. Le désert, lui, garde toutes les traces.

*Construite selon l’état — plateaux précédents par la force, conduite avide ici ; serment juré au Phénix :*

- **Fidèle du Phénix** · Fidèles rescapés : Nous avons quitté le temple derrière vous. Ce que nous y voyons depuis des lunes, il faut que quelqu’un l’entende : l’étranger qui murmurait à nos gardiens des prophéties que personne n’avait jamais lues.
- **Fidèle du Phénix** · Témoignage : Nous voulons le dire nous-mêmes au Grand Inquisiteur. Que le Scorpion sache que le Phénix n’a pas choisi cette haine seul.
- **Sage Séraphine** · Sage : Les pèlerins du Dragon se sont tus sous nos lames. Je ne veux pas que le désert en compte d’autres.
- **Intendant Maelor** · Intendant : Ils ont vu ce que nous avons fait du codex. S’ils parlent au Grand Inquisiteur, nous n’aurons plus rien à expliquer.
- **Alistair** · Décision : Que faisons-nous d’eux ?
  - Choix « Escorter les fidèles jusqu’au Grand Inquisiteur. » (aperçu : Des témoins libres devant le Grand Inquisiteur) → fait `scorpionWitnessesProtected` ; réputation +1
  - Choix « Les réduire au silence, quel qu’en soit le prix. » (aperçu : Aucun témoin devant le Grand Inquisiteur ; Un acte que le désert retiendra) → fait `scorpionWitnessesSilenced` ; réputation -2
- **Fidèle du Phénix** · Escorte : Merci. Nous marcherons avec vous, mais nous parlerons pour nous.
- **Marian** · Soigneuse : Ils se taisent. Le désert, lui, garde toutes les traces.

*Construite selon l’état — plateaux précédents par la force, conduite honorable ici :*

- **Fidèle du Phénix** · Fidèles rescapés : Nous avons fui le temple pendant le combat. Nous avons tout vu : le codex, la flamme, et l’étranger qui murmurait à nos gardiens des prophéties que personne n’avait jamais lues.
- **Fidèle du Phénix** · Témoignage : Nous voulons le dire nous-mêmes au Grand Inquisiteur. Que le Scorpion sache que le Phénix n’a pas choisi cette haine seul.
- **Sage Séraphine** · Sage : Les pèlerins du Dragon se sont tus sous nos lames. Je ne veux pas que le désert en compte d’autres.
- **Intendant Maelor** · Intendant : Des fidèles du Phénix devant le Grand Inquisiteur… Il les écoutera, puis il les gardera. Le Scorpion ne laisse jamais repartir un témoin.
- **Alistair** · Décision : Que faisons-nous d’eux ?
  - Choix « Escorter les fidèles jusqu’au Grand Inquisiteur. » (aperçu : Des témoins libres devant le Grand Inquisiteur) → fait `scorpionWitnessesProtected` ; réputation +1
  - Choix « Les réduire au silence, quel qu’en soit le prix. » (aperçu : Aucun témoin devant le Grand Inquisiteur ; Un acte que le désert retiendra) → fait `scorpionWitnessesSilenced` ; réputation -2
- **Fidèle du Phénix** · Escorte : Merci. Nous marcherons avec vous, mais nous parlerons pour nous.
- **Marian** · Soigneuse : Ils se taisent. Le désert, lui, garde toutes les traces.

## Cendres sacrées — `scorpion-final-trial-event` (event, profondeur 14)

### Cendres sacrées — `scorpion_sacred_ashes`

- **Kestrel** · Éclaireuse : Un sanctuaire creusé dans la roche. Les cendres sacrées du Phénix y couvent encore ; des braises rouges luisent sous la cendre grise.
- **Sage Séraphine** · Sage : Les flammes purificatrices du Phénix naissent ici. Ce lieu n’est pas à nous.
- **Intendant Maelor** · Intendant : Des braises qui ne s’éteignent jamais. Un forgeron en donnerait une fortune, et un érudit davantage.
- **Alistair** · Décision : Que faisons-nous ?
  - Choix « Respecter les cendres sacrées. » (aperçu : Le sanctuaire intact) → fait `scorpionAshesRespected`
  - Choix « Emporter des braises. » (aperçu : Une gemme rouge ; Un sanctuaire du Phénix pillé) → fait `scorpionAshesTaken` ; +1 red_gem ; réputation -1
- **Marian** · Soigneuse : Nous repartons sans rien toucher. La chaleur des cendres nous accompagne jusqu’au seuil.
- **Marian** · Soigneuse : Maelor emporte une braise, rouge comme une gemme. Derrière nous, les cendres pâlissent.

## Fidèles égarés — `scorpion-final-trial-combat` (combat, profondeur 14)

- Combat **Fidèles égarés** (`scorpion_lost_faithful`, elite) : Frayez-vous un passage parmi les fidèles égarés sous l’emprise des Ombres. Ennemis : shadow_zealot, venom_serpent, forest_spider. Récompense : 70 or, réputation 0, +1 red_gem. Défi : Victoire en 8 manches, prime 2 gemmes rouges.

## Pages souillées — `scorpion-corrupted-texts` (mystery, profondeur 15)

### Pages souillées — `scorpion_corrupted_texts`

*Construite selon l’état — plateaux précédents par l’honneur, conduite honorable ici (Scorpion) :*

- **Kestrel** · Éclaireuse : Une page arrachée au codex, cachée au fond du sanctuaire. Son encre est noire et froide, et ses lignes ne sont pas des prophéties.
- **Sage Séraphine** · Sage : Quelqu’un a écrit entre les lignes du codex. Pas une prophétie : un ordre, glissé dans la foi des autres.
- **Sage Séraphine** · Les Ombres : Je reconnais cette froideur : c’est celle de l’éclat du filon sombre de l’Ours, dans notre coffre depuis les montagnes. Et c’est la même souillure que l’éclat de l’autel du Cristal, scellé avec les autres.
- **Intendant Maelor** · Intendant : Une page que personne ne devrait lire. Brûlons-la, et n’en parlons plus.
- **Alistair** · Décision : Que faisons-nous de cette page ?
  - Choix « La sceller comme preuve. » (aperçu : Une preuve à montrer au Grand Inquisiteur) → fait `scorpionShadowEvidence`
  - Choix « La brûler sur-le-champ. » (aperçu : La page détruite ; Aucune preuve à montrer) → fait `scorpionShadowBurned` ; réputation -1
- **Sage Séraphine** · Sage : Je l’enferme dans le coffre doublé de plomb, avec les autres. Le Grand Inquisiteur devra la voir.
- **Kestrel** · Éclaireuse : La page se tord dans la flamme sans faire de fumée. Nous ne saurons jamais ce qu’elle ordonnait.

*Construite selon l’état — plateaux précédents par la force, conduite avide ici ; plateaux précédents par la force, conduite honorable ici ; serment juré au Phénix :*

- **Kestrel** · Éclaireuse : Une page arrachée au codex, cachée au fond du sanctuaire. Son encre est noire et froide, et ses lignes ne sont pas des prophéties.
- **Sage Séraphine** · Sage : Quelqu’un a écrit entre les lignes du codex. Pas une prophétie : un ordre, glissé dans la foi des autres.
- **Sage Séraphine** · Les Ombres : Je n’avais jamais vu la marque des Ombres écrite de cette façon. Mais je sais ce qu’elle annonce : elles ont touché à la foi du Phénix.
- **Intendant Maelor** · Intendant : Une page que personne ne devrait lire. Brûlons-la, et n’en parlons plus.
- **Alistair** · Décision : Que faisons-nous de cette page ?
  - Choix « La sceller comme preuve. » (aperçu : Une preuve à montrer au Grand Inquisiteur) → fait `scorpionShadowEvidence`
  - Choix « La brûler sur-le-champ. » (aperçu : La page détruite ; Aucune preuve à montrer) → fait `scorpionShadowBurned` ; réputation -1
- **Sage Séraphine** · Sage : Je l’enferme dans le coffre doublé de plomb, avec les autres. Le Grand Inquisiteur devra la voir.
- **Kestrel** · Éclaireuse : La page se tord dans la flamme sans faire de fumée. Nous ne saurons jamais ce qu’elle ordonnait.

## Veillée au désert — `scorpion-final-refuge` (refuge, profondeur 16)

### Veillée au désert — `scorpion_vigil`

*Construite selon l’état — plateaux précédents par l’honneur, conduite honorable ici (Scorpion) ; plateaux précédents par la force, conduite honorable ici :*

- **Alistair** · Veillée : Le Grand Inquisiteur nous attend demain. Tout ce que nous avons fait dans ce désert sera consigné devant lui.
- **Marian** · Soigneuse : Des fidèles du Phénix ont laissé une lampe à notre porte. Ils n’ont pas dit un mot ; ils savent que nous avons respecté leurs sceaux.
- **Sage Séraphine** · Sage : Le Scorpion n’oublie rien. Il ne nous jugera pas sur nos mots, mais sur ce que ses érudits ont noté de nous.
- **Intendant Maelor** · Intendant : Quatre Sceaux, bientôt. Et un codex qui parle des Ombres… Un jour, quelqu’un voudra savoir ce que nous en avons appris. J’aimerais savoir quoi lui répondre.

*Construite selon l’état — plateaux précédents par la force, conduite avide ici ; serment juré au Phénix :*

- **Alistair** · Veillée : Le Grand Inquisiteur nous attend demain. Tout ce que nous avons fait dans ce désert sera consigné devant lui.
- **Marian** · Soigneuse : Personne ne s’approche de notre feu. Le désert, ce soir, nous laisse seuls.
- **Sage Séraphine** · Sage : Le Scorpion n’oublie rien. Il ne nous jugera pas sur nos mots, mais sur ce que ses érudits ont noté de nous.
- **Intendant Maelor** · Intendant : Quatre Sceaux, bientôt. Et un codex qui parle des Ombres… Un jour, quelqu’un voudra savoir ce que nous en avons appris. J’aimerais savoir quoi lui répondre.

## Jugement du Grand Inquisiteur — `scorpion-judgement` (boss, profondeur 17)

### Jugement du Grand Inquisiteur — `scorpion_judgement`

*Construite selon l’état — plateaux précédents par l’honneur, conduite honorable ici (Scorpion) ; plateaux précédents par la force, conduite honorable ici :*

- **Grand Inquisiteur** · Jugement : Vous revenez du temple. Mes érudits ont noté chacun de vos pas dans ce désert, et le désert a gardé le reste. Je les ai lus. Je vous écouterai ensuite.
- **Grand Inquisiteur** · Le codex : Le codex est sur ma table, parce que vous m’avez rapporté le codex prophétique au lieu de le vendre au plus offrant.
- **Sage Séraphine** · Mérites : Il y a aussi ceci, et les érudits du Scorpion l’ont vu comme nous : vous avez accepté la requête du Grand Inquisiteur sans marchander, vous avez arraché un fidèle du Phénix aux érudits du Scorpion, vous n’avez rien promis au Phénix, vous avez résolu l’énigme des sables sans briser son mécanisme, vous avez levé les sceaux du Phénix selon leur rite, vous avez laissé intacte la bibliothèque ensevelie et vous avez respecté les cendres sacrées.
- **Grand Inquisiteur** · Témoins : Les fidèles rescapés sont venus dire eux-mêmes ce qu’ils ont vu au temple. Des fidèles du Phénix, devant moi, sans qu’on leur dicte un mot : je les ai écoutés.
- **Sage Séraphine** · Ombres : Voici la page souillée que nous avons scellée. Les Ombres ne se contentent pas de voler ou de souiller, Grand Inquisiteur : les Ombres écrivent aussi, et elles écrivent dans la foi des autres.
- **Grand Inquisiteur** · Intention : Ce qui est consigné ne s’efface pas. Dites-moi seulement ce que vous demandez au Scorpion.
  - Choix « Assumer nos actes et réclamer le Sceau. » → issue du jugement : réclamer le Sceau
  - Choix « Demander l’épreuve du Scorpion. » (aperçu : Le Sceau sera jugé par la force) → issue du jugement : demander l’épreuve

*Construite selon l’état — plateaux précédents par la force, conduite avide ici ; serment juré au Phénix :*

- **Grand Inquisiteur** · Jugement : Vous revenez du temple. Mes érudits ont noté chacun de vos pas dans ce désert, et le désert a gardé le reste. Je les ai lus. Je vous écouterai ensuite.
- **Grand Inquisiteur** · Le codex : Vous avez pris le codex au Phénix, c’est vrai. Puis vous avez gardé le codex pour votre clan, comme si la vérité sur les Ombres se rangeait dans un coffre.
- **Érudit du Scorpion** · Manquements : Et nos registres consignent ce qui pèse contre vous, car le Grand Inquisiteur pèse la parole autant que les actes : vous avez juré fidélité au Phénix et vous avez livré un fidèle du Phénix à nos interrogatoires.
- **Intendant Maelor** · Réserves : Mes comptes gardent aussi le droit de lire le codex avant le Grand Inquisiteur, exigé à l’audience, le mécanisme de l’énigme brisé, les sceaux du Phénix brisés sans leur rite, les rouleaux de la bibliothèque vendus, les braises sacrées emportées et la page souillée brûlée avant qu’on puisse l’étudier.
- **Grand Inquisiteur** · Témoins : Aucun fidèle n’est venu parler pour vous. Il ne me reste que ce que mes érudits ont noté.
- **Grand Inquisiteur** · Intention : Ce qui est consigné ne s’efface pas. Dites-moi seulement ce que vous demandez au Scorpion.
  - Choix « Assumer nos actes et réclamer le Sceau. » → issue du jugement : réclamer le Sceau
  - Choix « Demander l’épreuve du Scorpion. » (aperçu : Le Sceau sera jugé par la force) → issue du jugement : demander l’épreuve

#### Voie d’honneur

### Avant le combat — `scorpion_prophet_pre_combat`

*Construite selon l’état — plateaux précédents par l’honneur, conduite honorable ici (Scorpion) ; plateaux précédents par la force, conduite avide ici ; plateaux précédents par la force, conduite honorable ici ; serment juré au Phénix :*

- **Grand Inquisiteur** · Grand Inquisiteur : Le codex parle d’un Prophète des Ombres. Il manipule les croyances des clans : il a soufflé au Phénix ses peurs, et peut-être au Scorpion les siennes.
- **Grand Inquisiteur** · Alliance : Il s’est enfui dans les dunes. Traquez-le, empêchez ses fausses prophéties de se répandre, et le Sceau du Scorpion scellera notre alliance.
- **Sage Séraphine** · Sage : Celui qui écrit les prophéties des autres ne reste jamais près de ses lecteurs. Il faudra aller le chercher.
- **Prophète des Ombres** · Prophète des Ombres : Vous avez rapporté le codex à un clan qui croit lire mieux que les autres. Chaque clan croit cela. C’est pour cela que mes prophéties prennent si bien.

- Combat **Prophète des Ombres** (`scorpion_shadow_prophet`, boss) : Traquez le Prophète des Ombres avant qu’il ne répande d’autres prophéties. Ennemis : boss `shadow_prophet` avec phoenix_guardian, venom_serpent. Récompense : 120 or, réputation 0, +1 red_gem.

### Après le combat — `scorpion_prophet_aftermath`

- **Prophète des Ombres** · Vaincu : Les prophéties… ne sont que des mots. Ceux que je sers n’ont besoin que de mots, et d’un clan prêt à y croire.
- **Sage Séraphine** · Sage : Les Ombres, derrière un quatrième clan. Le Phénix n’a pas choisi seul sa haine du Scorpion : on la lui a soufflée.

#### Voie de force

### Avant le combat — `scorpion_inquisitor_pre_combat`

- **Grand Inquisiteur** · Grand Inquisiteur : Vous voulez mon Sceau par la force plutôt que par ma confiance. Soit. Seule la vérité, même amère, peut sauver ce monde ; voyons ce que vaut la vôtre. Mes érudits et moi, contre votre compagnie.
- **Alistair** · Épreuve : Nous l’assumerons.

- Combat **Épreuve du Scorpion** (`scorpion_inquisitor`, boss) : Affrontez le Grand Inquisiteur et ses érudits pour le Sceau du Scorpion. Ennemis : boss `grand_inquisitor` avec scorpion_scholar, scorpion_scholar. Récompense : 100 or, réputation 0.

### Après le combat — `scorpion_trial_aftermath`

- **Grand Inquisiteur** · Grand Inquisiteur : Le Sceau est à vous. Mes érudits l’ont consigné. Ne comptez plus sur le savoir du Scorpion le jour où vous en aurez besoin.

### Épilogue — `scorpion_epilogue`

*Construite selon l’état — plateaux précédents par l’honneur, conduite honorable ici (Scorpion) ; plateaux précédents par la force, conduite honorable ici :*

- **Sage Séraphine** · Bilan : Le Sceau du Scorpion est entre vos mains : le Grand Inquisiteur a scellé l’alliance du Scorpion, et le Prophète des Ombres est tombé dans les dunes où il semait ses fausses prophéties.
- **Intendant Maelor** · Conséquence : La page souillée voyage avec nous, scellée avec les autres preuves. Les Ombres volent, souillent, et maintenant elles écrivent. Je n’aime pas ce que ce tableau commence à montrer.
- **Sage Séraphine** · Chronique : Quatre Sceaux. La route du Tournoi des Grands est ouverte, et chaque clan que nous avons croisé se souviendra de la manière dont nous l’avons gagnée. — *clôture du plateau scorpion*

*Construite selon l’état — plateaux précédents par la force, conduite avide ici ; serment juré au Phénix :*

- **Sage Séraphine** · Bilan : Le Sceau du Scorpion est entre vos mains, mais vous avez pris le Sceau du Scorpion par l’épreuve. Les érudits du Grand Inquisiteur ont tout consigné ; le Scorpion n’oubliera pas ce Sceau arraché.
- **Intendant Maelor** · Conséquence : La page souillée n’est plus. Ce que les Ombres écrivaient dans le codex, nous ne le lirons jamais.
- **Sage Séraphine** · Chronique : Quatre Sceaux. La route du Tournoi des Grands est ouverte, et chaque clan que nous avons croisé se souviendra de la manière dont nous l’avons gagnée. — *clôture du plateau scorpion*

## Fouilles et gardiens (POI facultatifs)

- **Réserve des dunes** (`scorpion-poi-dune-supplies`, région 1) : chest
- **Nid de serpents** (`scorpion-poi-dune-serpents`, région 1) : combat — variantes scorpion_poi_dune_serpents_a, scorpion_poi_dune_serpents_b
  - Combat **Nid de serpents** (`scorpion_poi_dune_serpents_a`, normal) : Remportez ce combat facultatif. Ennemis : venom_serpent, venom_serpent. Récompense : 35 or, réputation 0.
  - Combat **Nid de serpents** (`scorpion_poi_dune_serpents_b`, normal) : Remportez ce combat facultatif. Ennemis : venom_serpent, cave_rat, venom_serpent. Récompense : 35 or, réputation 0.
- **Araignées des sables** (`scorpion-poi-dune-spiders`, région 1) : combat — variantes scorpion_poi_dune_spiders_a, scorpion_poi_dune_spiders_b
  - Combat **Araignées des sables** (`scorpion_poi_dune_spiders_a`, normal) : Remportez ce combat facultatif. Ennemis : forest_spider, forest_spider. Récompense : 30 or, réputation 0, +1 iron_ore. Défi : 3 héros au plus, prime 1 gemme rouge.
  - Combat **Araignées des sables** (`scorpion_poi_dune_spiders_b`, normal) : Remportez ce combat facultatif. Ennemis : forest_spider, cave_rat. Récompense : 30 or, réputation 0, +1 iron_ore. Défi : 3 héros au plus, prime 1 gemme rouge.
- **Cache de la piste** (`scorpion-poi-dune-cache`, région 1) : chest
- **Dépôt des ruines** (`scorpion-poi-ruin-supplies`, région 2) : chest
- **Ronde du Phénix** (`scorpion-poi-ruin-sentinels`, région 2) : combat — variantes scorpion_poi_ruin_sentinels_a, scorpion_poi_ruin_sentinels_b
  - Combat **Ronde du Phénix** (`scorpion_poi_ruin_sentinels_a`, normal) : Remportez ce combat facultatif. Ennemis : phoenix_guardian, venom_serpent. Récompense : 40 or, réputation 0.
  - Combat **Ronde du Phénix** (`scorpion_poi_ruin_sentinels_b`, normal) : Remportez ce combat facultatif. Ennemis : phoenix_guardian, phoenix_guardian. Récompense : 40 or, réputation 0.
- **Cache des ruines** (`scorpion-poi-ruin-cache`, région 2) : chest
- **Serpents des ruines** (`scorpion-poi-ruin-serpents`, région 2) : combat — variantes scorpion_poi_ruin_serpents_a, scorpion_poi_ruin_serpents_b
  - Combat **Serpents des ruines** (`scorpion_poi_ruin_serpents_a`, normal) : Remportez ce combat facultatif. Ennemis : venom_serpent, forest_spider. Récompense : 45 or, réputation 0, +1 iron_ore.
  - Combat **Serpents des ruines** (`scorpion_poi_ruin_serpents_b`, normal) : Remportez ce combat facultatif. Ennemis : venom_serpent, venom_serpent, cave_rat. Récompense : 45 or, réputation 0, +1 iron_ore.
- **Réserves du sanctuaire** (`scorpion-poi-sanctum-supplies`, région 3) : chest
- **Gardes du sanctuaire** (`scorpion-poi-sanctum-guards`, région 3) : combat — variantes scorpion_poi_sanctum_guards_a, scorpion_poi_sanctum_guards_b
  - Combat **Gardes du sanctuaire** (`scorpion_poi_sanctum_guards_a`, normal) : Remportez ce combat facultatif. Ennemis : phoenix_guardian, phoenix_guardian, venom_serpent. Récompense : 50 or, réputation 0.
  - Combat **Gardes du sanctuaire** (`scorpion_poi_sanctum_guards_b`, normal) : Remportez ce combat facultatif. Ennemis : phoenix_guardian, forest_spider, phoenix_guardian. Récompense : 50 or, réputation 0.
- **Veille des sables** (`scorpion-poi-sanctum-watch`, région 3) : combat — variantes scorpion_poi_sanctum_watch_a, scorpion_poi_sanctum_watch_b
  - Combat **Veille des sables** (`scorpion_poi_sanctum_watch_a`, normal) : Remportez ce combat facultatif. Ennemis : venom_serpent, forest_spider, cave_rat. Récompense : 50 or, réputation 0, +1 iron_ore.
  - Combat **Veille des sables** (`scorpion_poi_sanctum_watch_b`, normal) : Remportez ce combat facultatif. Ennemis : forest_spider, venom_serpent, forest_spider. Récompense : 50 or, réputation 0, +1 iron_ore.
- **Réserve du sanctuaire gardée** (`scorpion-poi-sanctum-reserve`, région 3) : chest
- Gardien **Gardien de flamme** (`scorpion-guardian-ruins`) sur `scorpion-poi-ruin-cache`, deux vagues :
  - Combat **Gardien de flamme** (`scorpion_guardian_flamekeeper`, elite) : Affrontez le gardien pour ouvrir son coffre. Ennemis : phoenix_flamekeeper, phoenix_guardian, venom_serpent. Récompense : 70 or, réputation +1, +2 iron_ore. Défi : 3 héros au plus, prime 2 gemmes rouges.
- Gardien **Fidèle égaré** (`scorpion-guardian-sanctum`) sur `scorpion-poi-sanctum-reserve`, deux vagues :
  - Combat **Fidèle égaré** (`scorpion_guardian_zealot`, elite) : Affrontez le gardien pour ouvrir son coffre. Ennemis : shadow_zealot, phoenix_guardian, forest_spider. Récompense : 80 or, réputation +1, +1 red_gem. Défi : 3 héros au plus, prime 2 gemmes rouges.

## Ce que le Grand Inquisiteur pèse au jugement

| Fait | Nature | Poids | Phrase dite au jugement |
| --- | --- | --- | --- |
| `scorpionCodexDelivered` | merit (decisive) | 2 | vous m’avez rapporté le codex prophétique |
| `scorpionMandateHonour` | merit (important) | 1 | vous avez accepté la requête du Grand Inquisiteur sans marchander |
| `scorpionFaithfulFreed` | merit (important) | 1 | vous avez arraché un fidèle du Phénix aux érudits du Scorpion |
| `scorpionOathRefused` | merit (important) | 1 | vous n’avez rien promis au Phénix |
| `scorpionRiddleSolved` | merit (minor) | 1 | vous avez résolu l’énigme des sables sans briser son mécanisme |
| `scorpionWardsRespected` | merit (minor) | 1 | vous avez levé les sceaux du Phénix selon leur rite |
| `scorpionLibraryRespected` | merit (important) | 1 | vous avez laissé intacte la bibliothèque ensevelie |
| `scorpionAshesRespected` | merit (important) | 1 | vous avez respecté les cendres sacrées |
| `scorpionCodexKept` | breach (decisive) | -2 | vous avez gardé le codex pour votre clan |
| `scorpionCodexProtected` | breach (decisive) | -3 | vous avez laissé le codex au Phénix |
| `scorpionPhoenixOath` | breach (important) | -2 | vous avez juré fidélité au Phénix |
| `scorpionFaithfulAbandoned` | breach (important) | -2 | vous avez livré un fidèle du Phénix à nos interrogatoires |
| `scorpionMandateTerms` | stain (minor) | -1 | le droit de lire le codex avant le Grand Inquisiteur, exigé à l’audience |
| `scorpionRiddleForced` | stain (minor) | -1 | le mécanisme de l’énigme brisé |
| `scorpionWardsBroken` | stain (minor) | -1 | les sceaux du Phénix brisés sans leur rite |
| `scorpionLibraryLooted` | stain (minor) | -1 | les rouleaux de la bibliothèque vendus |
| `scorpionAshesTaken` | stain (minor) | -1 | les braises sacrées emportées |
| `scorpionShadowBurned` | stain (minor) | -1 | la page souillée brûlée avant qu’on puisse l’étudier |

Crédibilité devant le Grand Inquisiteur (proposée) : crédible à 70, haute à 85. Faits de force : `scorpionCodexKept`, `scorpionCodexProtected`, `scorpionWitnessesSilenced`. Fait d’honneur : `scorpionCodexDelivered`.

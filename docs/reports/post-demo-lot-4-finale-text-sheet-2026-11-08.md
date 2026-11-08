# Fiche de texte — L’acte final — BROUILLON

Générée par `tools/narrative/plateau-text-sheet.ts` depuis le contenu jouable. Brouillon : rien ici n’est canon avant l’approbation du plateau par l’opérateur.

## Parcours, scènes et combats

## Le Tournoi des Grands — tableau des rencontres

RunSystem tient l’ordre du tableau et le lit dans les faits sauvegardés. Chaque combat de l’acte final reçoit les soutiens des clans alliés et les adversaires des clans ennemis (voir la dernière section).

### Ouverture du Tournoi — `finale_arrival`

- **Alistair** · Tournoi des Grands : Quatre Sceaux. L’Arène des Destins nous ouvre ses portes, et toutes les bannières des clans flottent au-dessus des tribunes. — *fait `finaleTournamentEntered`*
- **Kestrel** · Éclaireuse : Le Corbeau, le Loup et le Phénix ont envoyé leurs champions. Le Serpent attend en finale, comme toujours.
- **Sage Séraphine** · Sage : Ne laissez pas l’orgueil choisir à votre place. Ce Tournoi est une épreuve de force, mais aussi de sagesse. Et quelque chose de sombre plane sur cette arène : je le sens depuis que nous avons passé les portes.
- **Intendant Maelor** · Intendant : Écrasez-les tous, sans pitié. Personne ne se souvient de la manière, seulement de la victoire.
- **Alistair** · Clan sans terre : Nous nous souviendrons, nous.

## 1. Champion du Corbeau — `finale-bout-raven`

- Combat **Tournoi : le Corbeau** (`finale_raven_bout`, elite) : Battez le champion du Corbeau dans l’arène. Ennemis : raven_champion, raven_scout. Récompense : 60 or, réputation 0.

### Après le combat — `finale_raven_verdict`

- **Kestrel** · Arène : Le champion du Corbeau est à terre. Ses lames ont glissé hors de sa portée.
- **Champion du Corbeau** · Corbeau : Achevez ce que vous avez commencé. Le Corbeau ne demande rien à personne.
- **Intendant Maelor** · Intendant : Humiliez-le devant les clans. Qu’ils sachent tous qui nous sommes. Dans cette arène, la victoire justifie tout.
- **Sage Séraphine** · Sage : Le Tournoi est une épreuve de force, mais aussi de sagesse. Un adversaire relevé devant tous peut devenir un allié.
- **Alistair** · Verdict : Toute l’arène attend notre geste.
  - Choix « Relever le champion du Corbeau. » (aperçu : Le clan du Corbeau s’en souviendra ; Un allié inattendu, peut-être) → fait `finaleRavenSpared` ; relation raven → ally (cause `finale.tournament.raven`)
  - Choix « L’humilier devant les clans. » (aperçu : Les tribunes acclament ; Le clan du Corbeau ne l’oubliera pas) → fait `finaleRavenHumiliated` ; réputation -1 ; relation raven → enemy (cause `finale.tournament.raven`)
- **Champion du Corbeau** · Corbeau : Vous auriez pu m’écraser devant tous. Le Corbeau se souviendra de cette main tendue.
- **Marian** · Soigneuse : Les tribunes ont ri. Le Corbeau, lui, ne rira pas.

## 2. Champion du Loup — `finale-bout-wolf`

- Combat **Tournoi : le Loup** (`finale_wolf_bout`, elite) : Battez le champion du Loup dans l’arène. Ennemis : wolf_champion, wolf_hunter. Récompense : 60 or, réputation 0.

### Après le combat — `finale_wolf_verdict`

- **Kestrel** · Arène : Le champion du Loup ne se relève pas. La foule hurle son nom, ou le nôtre.
- **Champion du Loup** · Loup : Le Loup ne supplie pas. Faites ce que vous avez à faire.
- **Intendant Maelor** · Intendant : Humiliez-le devant les clans. Qu’ils sachent tous qui nous sommes. Dans cette arène, la victoire justifie tout.
- **Sage Séraphine** · Sage : Le Tournoi est une épreuve de force, mais aussi de sagesse. Un adversaire relevé devant tous peut devenir un allié.
- **Alistair** · Verdict : Toute l’arène attend notre geste.
  - Choix « Relever le champion du Loup. » (aperçu : Le clan du Loup s’en souviendra ; Un allié inattendu, peut-être) → fait `finaleWolfSpared` ; relation wolf → ally (cause `finale.tournament.wolf`)
  - Choix « L’humilier devant les clans. » (aperçu : Les tribunes acclament ; Le clan du Loup ne l’oubliera pas) → fait `finaleWolfHumiliated` ; réputation -1 ; relation wolf → enemy (cause `finale.tournament.wolf`)
- **Champion du Loup** · Loup : Un étranger qui relève un loup… Le Loup n’oublie jamais une dette.
- **Marian** · Soigneuse : Il a quitté l’arène sous les huées. Le Loup a de la mémoire.

## 3. Champion du Phénix — `finale-bout-phoenix`

- Combat **Tournoi : le Phénix** (`finale_phoenix_bout`, elite) : Battez le champion du Phénix dans l’arène. Ennemis : phoenix_champion, phoenix_guardian. Récompense : 60 or, réputation 0.

### Après le combat — `finale_phoenix_verdict`

- **Kestrel** · Arène : Le champion du Phénix a posé un genou au sol. Sa flamme vacille encore.
- **Champion du Phénix** · Phénix : Le Phénix renaît de ses cendres. Faites de moi ce que vous voudrez.
- **Intendant Maelor** · Intendant : Humiliez-le devant les clans. Qu’ils sachent tous qui nous sommes. Dans cette arène, la victoire justifie tout.
- **Sage Séraphine** · Sage : Le Tournoi est une épreuve de force, mais aussi de sagesse. Un adversaire relevé devant tous peut devenir un allié.
- **Alistair** · Verdict : Toute l’arène attend notre geste.
  - Choix « Relever le champion du Phénix. » (aperçu : Le clan du Phénix s’en souviendra ; Un allié inattendu, peut-être) → fait `finalePhoenixSpared` ; relation phoenix → ally (cause `finale.tournament.phoenix`)
  - Choix « L’humilier devant les clans. » (aperçu : Les tribunes acclament ; Le clan du Phénix ne l’oubliera pas) → fait `finalePhoenixHumiliated` ; réputation -1 ; relation phoenix → enemy (cause `finale.tournament.phoenix`)
- **Champion du Phénix** · Phénix : Vous m’avez relevé quand vous pouviez me briser. Le Phénix saura ce que vaut votre geste.
- **Marian** · Soigneuse : Ses fidèles ont détourné les yeux. Le Phénix gardera cette honte.

## 4. Finale : champion du Serpent — `finale-bout-serpent`

### Avant le combat — `finale_pre_serpent_final`

- **Champion du Serpent** · Serpent : Depuis les plaines du Lion, le Serpent attend ce combat. Venez chercher votre victoire.
- **Alistair** · Finale : Alors finissons-en.

- Combat **Finale du Tournoi** (`finale_serpent_final`, boss) : Remportez la finale du Tournoi contre le champion du Serpent. Ennemis : boss `serpent_champion` avec serpent_raider. Récompense : 100 or, réputation 0.

### Après le combat — `finale_betrayal`

*Construite selon l’état — plateaux précédents par l’honneur, conduite honorable ici (acte final) :*

- **Kestrel** · Éclaireuse : Le champion du Serpent tombe… et Maelor s’avance au milieu de l’arène, un artefact à la main.
- **Maelor** · Trahison : Vous avez cherché les Ombres Silencieuses dans chaque clan. Elles marchaient avec vous depuis le premier Sceau.
- **Maelor** · Conseils : Vous ne m’avez jamais écouté. Peu importe : il me suffisait d’entrer avec vous dans cette arène.
- **Maelor** · La brèche : Regardez. — *fait `finaleBreachOpened`*
- **Sage Séraphine** · Sage : La brèche… Elle s’ouvre au cœur de l’arène. Le champion du Serpent se relève, et ce n’est plus un homme.
- **Maelor** · Maelor : Nous nous reverrons au cœur de la brèche.
- **Alistair** · Clan sans terre : Maelor !

*Construite selon l’état — plateaux précédents par la force, conduite avide ici :*

- **Kestrel** · Éclaireuse : Le champion du Serpent tombe… et Maelor s’avance au milieu de l’arène, un artefact à la main.
- **Maelor** · Trahison : Vous avez cherché les Ombres Silencieuses dans chaque clan. Elles marchaient avec vous depuis le premier Sceau.
- **Maelor** · Conseils : Vous m’avez écouté plus souvent que vous ne le croyez : le filon sombre gardé pour le clan, le Cristal gardé pour le clan, le codex gardé pour le clan et la page souillée brûlée sur mon conseil. Et dans cette arène encore, les champions du Corbeau, du Loup et du Phénix humiliés devant les clans. Chaque fois, vous avez servi ceux que je sers.
- **Maelor** · La brèche : Regardez. — *fait `finaleBreachOpened`*
- **Sage Séraphine** · Sage : La brèche… Elle s’ouvre au cœur de l’arène. Le champion du Serpent se relève, et ce n’est plus un homme.
- **Maelor** · Maelor : Nous nous reverrons au cœur de la brèche.
- **Alistair** · Clan sans terre : Maelor !

*Construite selon l’état — plateaux précédents par la force, conduite honorable ici :*

- **Kestrel** · Éclaireuse : Le champion du Serpent tombe… et Maelor s’avance au milieu de l’arène, un artefact à la main.
- **Maelor** · Trahison : Vous avez cherché les Ombres Silencieuses dans chaque clan. Elles marchaient avec vous depuis le premier Sceau.
- **Maelor** · Conseils : Vous m’avez écouté plus souvent que vous ne le croyez : le filon sombre gardé pour le clan, le Cristal gardé pour le clan, le codex gardé pour le clan et la page souillée brûlée sur mon conseil. Chaque fois, vous avez servi ceux que je sers.
- **Maelor** · La brèche : Regardez. — *fait `finaleBreachOpened`*
- **Sage Séraphine** · Sage : La brèche… Elle s’ouvre au cœur de l’arène. Le champion du Serpent se relève, et ce n’est plus un homme.
- **Maelor** · Maelor : Nous nous reverrons au cœur de la brèche.
- **Alistair** · Clan sans terre : Maelor !

*Construite selon l’état — plateaux précédents par l’honneur, conduite avide ici :*

- **Kestrel** · Éclaireuse : Le champion du Serpent tombe… et Maelor s’avance au milieu de l’arène, un artefact à la main.
- **Maelor** · Trahison : Vous avez cherché les Ombres Silencieuses dans chaque clan. Elles marchaient avec vous depuis le premier Sceau.
- **Maelor** · Conseils : Dans cette arène, vous m’avez enfin écouté : les champions du Corbeau, du Loup et du Phénix humiliés devant les clans. Vous avez servi ceux que je sers.
- **Maelor** · La brèche : Regardez. — *fait `finaleBreachOpened`*
- **Sage Séraphine** · Sage : La brèche… Elle s’ouvre au cœur de l’arène. Le champion du Serpent se relève, et ce n’est plus un homme.
- **Maelor** · Maelor : Nous nous reverrons au cœur de la brèche.
- **Alistair** · Clan sans terre : Maelor !

## 5. La brèche s’ouvre — `finale-arena-chaos`

### La brèche s’ouvre — `finale_arena_chaos`

- **Kestrel** · Éclaireuse : Des démons sortent de la brèche. Dans les tribunes, la foule se piétine pour atteindre les portes.
- **Marian** · Soigneuse : Les civils ne sortiront jamais seuls. Il faut quelqu’un entre eux et ces choses.
- **Sage Séraphine** · Sage : Si nous restons, il faudra tenir l’arène le temps qu’ils passent. Le champion changé en démon ne nous laissera pas partir sans combat.
- **Alistair** · Décision : Que faisons-nous ?
  - Choix « Couvrir la fuite des civils. » (aperçu : Combat contre le champion changé en démon ; Les civils couverts) → fait `finaleCiviliansProtected` ; réputation +1 ; combat `finale_arena_assault`
  - Choix « Fuir par les tribunes, sans les attendre. » (aperçu : Combat contre le champion changé en démon ; La foule laissée derrière vous) → fait `finaleCiviliansAbandoned` ; réputation -2 ; combat `finale_arena_assault`

- Combat **L’arène en flammes** (`finale_arena_assault`, boss) : Survivez à l’assaut des démons et quittez l’arène. Ennemis : boss `demon_champion` avec breach_demon, breach_demon. Récompense : 0 or, réputation 0.

### Après le combat — `finale_arena_assault_aftermath`

- **Sage Séraphine** · Sage : Le champion est tombé une seconde fois. La brèche, elle, grandit encore.
- **Kestrel** · Éclaireuse : Les portes de l’arène sont libres. Derrière, la capitale brûle.

## La capitale corrompue

## Portes de l’arène — `finale-arena-gate` (story, profondeur 0)

### Portes de l’arène — `finale_capital_arrival`

- **Alistair** · Capitale : La capitale. Des rues entières en flammes, et la brèche ouverte au-dessus des toits.
- **Sage Séraphine** · Sage : Maelor nous attend au cœur de la brèche. Tout ce que nous avons vu des Ombres, depuis le premier Sceau, mène là.
- **Kestrel** · Éclaireuse : Les démons tiennent les rues qui descendent de l’arène. Il faudra passer par elles.

## Rues en flammes — `finale-burning-streets` (combat, profondeur 1)

- Combat **Rues en flammes** (`finale_burning_streets`, normal) : Frayez-vous un chemin dans les rues en flammes. Ennemis : breach_demon, breach_demon. Récompense : 60 or, réputation 0.

## Ralliement des clans — `finale-allied-rally` (story, profondeur 2)

### Ralliement des clans — `finale_allied_rally`

*Construite selon l’état — plateaux précédents par l’honneur, conduite honorable ici (acte final) :*

- **Kestrel** · Éclaireuse : Des bannières se rassemblent à la croisée des rues. Certaines viennent à nous ; d’autres nous attendent.
- **Chef Alaric** · Le Lion : Le Lion n’a pas oublié votre jugement : les guerriers d’Alaric tiennent parole.
- **Ancien Ours Borin** · L’Ours : Vous avez rendu leurs galeries à mes mineurs, et les guerriers de Borin tiennent parole.
- **Ancien Dragon Kaelen** · Le Dragon : Le Dragon pèse longtemps, et il n’oublie pas : les gardiens de Kaelen tiennent parole.
- **Grand Inquisiteur** · Le Scorpion : Mes érudits ont tout consigné, même ceci : les érudits du Grand Inquisiteur tiennent parole.
- **Kestrel** · Le clan du Corbeau : Avec les siens, le champion du Corbeau que vous avez relevé dans l’arène nous rejoint.
- **Kestrel** · Le clan du Loup : Avec les siens, le champion du Loup que vous avez relevé dans l’arène nous rejoint.
- **Kestrel** · Le clan du Phénix : Avec les siens, le champion du Phénix que vous avez relevé dans l’arène nous rejoint.
- **Sage Séraphine** · Sage : Ceux qui marchent avec nous et ceux qui nous attendent dans les rues : chaque clan se souvient de la manière dont nous avons avancé.
- **Alistair** · Clan sans terre : Alors avançons. La brèche n’attendra pas.

*Construite selon l’état — plateaux précédents par la force, conduite avide ici :*

- **Kestrel** · Éclaireuse : Des bannières se rassemblent à la croisée des rues. Certaines viennent à nous ; d’autres nous attendent.
- **Kestrel** · Le Lion : Pas de bannière du Lion. Alaric garde ses guerriers loin de nous.
- **Kestrel** · L’Ours : Des guerriers de l’Ours rôdent dans les rues : les guerriers de Borin n’ont pas oublié le Sceau arraché.
- **Kestrel** · Le Dragon : Des gardiens du Dragon barrent une rue : les gardiens de Kaelen n’ont pas oublié l’épreuve.
- **Kestrel** · Le Scorpion : Des érudits du Scorpion nous observent depuis les toits : les érudits du Grand Inquisiteur n’ont pas oublié.
- **Kestrel** · Le clan du Corbeau : Ses guerriers barrent une rue : ils n’ont pas pardonné le champion du Corbeau humilié devant les clans.
- **Kestrel** · Le clan du Loup : Ses guerriers barrent une rue : ils n’ont pas pardonné le champion du Loup humilié devant les clans.
- **Kestrel** · Le clan du Phénix : Ses guerriers barrent une rue : ils n’ont pas pardonné le champion du Phénix humilié devant les clans.
- **Sage Séraphine** · Sage : Ceux qui marchent avec nous et ceux qui nous attendent dans les rues : chaque clan se souvient de la manière dont nous avons avancé.
- **Alistair** · Clan sans terre : Alors avançons. La brèche n’attendra pas.

*Construite selon l’état — plateaux précédents par la force, conduite honorable ici :*

- **Kestrel** · Éclaireuse : Des bannières se rassemblent à la croisée des rues. Certaines viennent à nous ; d’autres nous attendent.
- **Kestrel** · Le Lion : Pas de bannière du Lion. Alaric garde ses guerriers loin de nous.
- **Kestrel** · L’Ours : Des guerriers de l’Ours rôdent dans les rues : les guerriers de Borin n’ont pas oublié le Sceau arraché.
- **Kestrel** · Le Dragon : Des gardiens du Dragon barrent une rue : les gardiens de Kaelen n’ont pas oublié l’épreuve.
- **Kestrel** · Le Scorpion : Des érudits du Scorpion nous observent depuis les toits : les érudits du Grand Inquisiteur n’ont pas oublié.
- **Kestrel** · Le clan du Corbeau : Avec les siens, le champion du Corbeau que vous avez relevé dans l’arène nous rejoint.
- **Kestrel** · Le clan du Loup : Avec les siens, le champion du Loup que vous avez relevé dans l’arène nous rejoint.
- **Kestrel** · Le clan du Phénix : Avec les siens, le champion du Phénix que vous avez relevé dans l’arène nous rejoint.
- **Sage Séraphine** · Sage : Ceux qui marchent avec nous et ceux qui nous attendent dans les rues : chaque clan se souvient de la manière dont nous avons avancé.
- **Alistair** · Clan sans terre : Alors avançons. La brèche n’attendra pas.

*Construite selon l’état — plateaux précédents par l’honneur, conduite avide ici :*

- **Kestrel** · Éclaireuse : Des bannières se rassemblent à la croisée des rues. Certaines viennent à nous ; d’autres nous attendent.
- **Chef Alaric** · Le Lion : Le Lion n’a pas oublié votre jugement : les guerriers d’Alaric tiennent parole.
- **Ancien Ours Borin** · L’Ours : Vous avez rendu leurs galeries à mes mineurs, et les guerriers de Borin tiennent parole.
- **Ancien Dragon Kaelen** · Le Dragon : Le Dragon pèse longtemps, et il n’oublie pas : les gardiens de Kaelen tiennent parole.
- **Grand Inquisiteur** · Le Scorpion : Mes érudits ont tout consigné, même ceci : les érudits du Grand Inquisiteur tiennent parole.
- **Kestrel** · Le clan du Corbeau : Ses guerriers barrent une rue : ils n’ont pas pardonné le champion du Corbeau humilié devant les clans.
- **Kestrel** · Le clan du Loup : Ses guerriers barrent une rue : ils n’ont pas pardonné le champion du Loup humilié devant les clans.
- **Kestrel** · Le clan du Phénix : Ses guerriers barrent une rue : ils n’ont pas pardonné le champion du Phénix humilié devant les clans.
- **Sage Séraphine** · Sage : Ceux qui marchent avec nous et ceux qui nous attendent dans les rues : chaque clan se souvient de la manière dont nous avons avancé.
- **Alistair** · Clan sans terre : Alors avançons. La brèche n’attendra pas.

## Habitants sous les décombres — `finale-trapped-citizens` (event, profondeur 3)

### Habitants sous les décombres — `finale_trapped_citizens`

- **Kestrel** · Éclaireuse : Une rue effondrée. Il y a des voix sous les décombres.
- **Habitant de la capitale** · Capitale : Par ici ! Ma famille est dessous, je n’arrive pas à soulever les poutres !
- **Sage Séraphine** · Sage : Chaque heure compte. Mais ce sont ces gens que la brèche dévorera les premiers.
- **Marian** · Soigneuse : Donnez-moi une heure. Je les sortirai de là.
- **Alistair** · Décision : Que faisons-nous ?
  - Choix « Dégager les habitants. » (aperçu : Une heure perdue ; Des habitants sauvés) → fait `finaleCitizensFreed` ; réputation +1
  - Choix « Les laisser et gagner la brèche. » (aperçu : La brèche plus tôt ; Des voix laissées derrière vous) → fait `finaleCitizensLeft` ; réputation -1
- **Habitant de la capitale** · Gratitude : Vous êtes restés. Personne d’autre ne l’aurait fait.
- **Marian** · Soigneuse : Leurs voix nous suivent jusqu’au bout de la rue.

## Place des démons — `finale-demon-square` (combat, profondeur 3)

- Combat **Place des démons** (`finale_demon_square`, elite) : Abattez le démon qui tient la grande place. Ennemis : demon_brute, breach_demon. Récompense : 80 or, réputation 0, +1 red_gem. Défi : Sans objets, prime 2 gemmes rouges.

## Dernière veillée — `finale-last-refuge` (refuge, profondeur 4)

### Dernière veillée — `finale_last_vigil`

*Construite selon l’état — plateaux précédents par l’honneur, conduite honorable ici (acte final) :*

- **Alistair** · Veillée : La dernière nuit avant la brèche. Plus de Sceau à gagner : seulement ce que nous avons fait pour en arriver là.
- **Sage Séraphine** · Les Ombres : Voici ce que nous savons des Ombres : les preuves des Ombres confiées à Alaric, l’éclat que vous avez rapporté des mines de l’Ours, l’éclat de la souillure du Cristal et la page souillée du codex. La même marque, partout où Maelor nous a suivis.
- **Marian** · Soigneuse : Des nouvelles des portes : les civils que vous avez couverts dans l’arène ont trouvé refuge hors des murs.
- **Kestrel** · Éclaireuse : Dans la rue effondrée, les habitants que vous avez dégagés des décombres nous ont montré le chemin le plus sûr.
- **Sage Séraphine** · Sage : Demain, Maelor, et ce qu’il sert. Je ne sais pas ce qui attend derrière lui. Je sais seulement que nous y entrerons ensemble.

*Construite selon l’état — plateaux précédents par la force, conduite avide ici :*

- **Alistair** · Veillée : La dernière nuit avant la brèche. Plus de Sceau à gagner : seulement ce que nous avons fait pour en arriver là.
- **Sage Séraphine** · Les Ombres : Voici ce que nous savons des Ombres : les preuves des Ombres que nous gardons depuis les plaines. La même marque, partout où Maelor nous a suivis.
- **Marian** · Soigneuse : Je pense encore à la foule laissée dans les tribunes.
- **Kestrel** · Éclaireuse : Nous sommes passés vite, et je pense encore à tous les habitants laissés sous les décombres.
- **Sage Séraphine** · Sage : Demain, Maelor, et ce qu’il sert. Je ne sais pas ce qui attend derrière lui. Je sais seulement que nous y entrerons ensemble.

*Construite selon l’état — plateaux précédents par la force, conduite honorable ici :*

- **Alistair** · Veillée : La dernière nuit avant la brèche. Plus de Sceau à gagner : seulement ce que nous avons fait pour en arriver là.
- **Sage Séraphine** · Les Ombres : Voici ce que nous savons des Ombres : les preuves des Ombres que nous gardons depuis les plaines. La même marque, partout où Maelor nous a suivis.
- **Marian** · Soigneuse : Des nouvelles des portes : les civils que vous avez couverts dans l’arène ont trouvé refuge hors des murs.
- **Kestrel** · Éclaireuse : Dans la rue effondrée, les habitants que vous avez dégagés des décombres nous ont montré le chemin le plus sûr.
- **Sage Séraphine** · Sage : Demain, Maelor, et ce qu’il sert. Je ne sais pas ce qui attend derrière lui. Je sais seulement que nous y entrerons ensemble.

*Construite selon l’état — plateaux précédents par l’honneur, conduite avide ici :*

- **Alistair** · Veillée : La dernière nuit avant la brèche. Plus de Sceau à gagner : seulement ce que nous avons fait pour en arriver là.
- **Sage Séraphine** · Les Ombres : Voici ce que nous savons des Ombres : les preuves des Ombres confiées à Alaric, l’éclat que vous avez rapporté des mines de l’Ours, l’éclat de la souillure du Cristal et la page souillée du codex. La même marque, partout où Maelor nous a suivis.
- **Marian** · Soigneuse : Je pense encore à la foule laissée dans les tribunes.
- **Kestrel** · Éclaireuse : Nous sommes passés vite, et je pense encore à tous les habitants laissés sous les décombres.
- **Sage Séraphine** · Sage : Demain, Maelor, et ce qu’il sert. Je ne sais pas ce qui attend derrière lui. Je sais seulement que nous y entrerons ensemble.

## La brèche — `finale-breach` (boss, profondeur 5)

### Avant le combat — `finale_breach_confrontation`

- **Maelor** · Maelor : Vous voilà. Quatre Sceaux, des clans derrière vous ou contre vous… et toujours la même question : à quoi vous servaient-ils vraiment ?
- **Sage Séraphine** · Sage : Ce qui se tient derrière lui n’a aucun nom que je connaisse. Il faudra l’abattre quand même.
- **Alistair** · Clan sans terre : Tu as marché avec nous depuis le début, Maelor. Ici, ça s’arrête.
- **Maelor** · Maelor : Alors venez.

- Combat **La brèche** (`finale_breach`, boss) : Abattez Maelor, puis ce qui le suit hors de la brèche. Ennemis : boss `maelor_traitor` avec breach_demon. Phase 2 : L’entité de la brèche, boss `breach_entity` avec breach_demon, breach_demon. Récompense : 0 or, réputation +1.

### Après le combat — `finale_breach_aftermath`

- **Kestrel** · Éclaireuse : Maelor est tombé le premier. Il n’a rien dit de plus.
- **Sage Séraphine** · Sage : L’entité est tombée à son tour. La brèche vacille, mais elle est encore ouverte.
- **Alistair** · Clan sans terre : Alors il reste une chose à faire.

### Clôture de l’acte final — `finale_act_end`

- **Sage Séraphine** · Chronique : Refermer la brèche, maintenant. Ce qui suivra dépendra de tout ce que nous avons fait depuis le premier Sceau. — *clôture du plateau finale*

## Fouilles et gardiens (POI facultatifs)

- **Armurerie pillée** (`finale-poi-armoury`, région 1) : chest
- **Maisons effondrées** (`finale-poi-ruins`, région 1) : combat — variantes finale_poi_ruins_a, finale_poi_ruins_b
  - Combat **Maisons effondrées** (`finale_poi_ruins_a`, normal) : Remportez ce combat facultatif. Ennemis : breach_demon, breach_demon. Récompense : 50 or, réputation 0, +1 iron_ore.
  - Combat **Maisons effondrées** (`finale_poi_ruins_b`, normal) : Remportez ce combat facultatif. Ennemis : breach_demon, cave_rat, breach_demon. Récompense : 50 or, réputation 0, +1 iron_ore.
- **Marché abandonné** (`finale-poi-market`, région 1) : chest
- **Réserve des remparts** (`finale-poi-reserve`, région 1) : chest
- Gardien **Démon des remparts** (`finale-guardian-ramparts`) sur `finale-poi-reserve`, deux vagues :
  - Combat **Démon des remparts** (`finale_guardian_ramparts`, elite) : Affrontez le gardien pour ouvrir son coffre. Ennemis : demon_brute, breach_demon, breach_demon. Récompense : 90 or, réputation +1, +1 red_gem. Défi : 3 héros au plus, prime 2 gemmes rouges.

## Soutiens des clans alliés et adversaires des clans ennemis (proposés)

Avant chaque combat de l’acte final, RunSystem lit les relations sauvegardées : chaque clan allié offre son soutien, utilisable une fois dans le combat (sauf le clan que la compagnie affronte au Tournoi) ; chaque clan ennemi ajoute un adversaire. Rien de cela n’est sauvegardé.

| Clan | Soutien (allié) | Effet (compétence existante) | Adversaire (ennemi) |
| --- | --- | --- | --- |
| Clan du Lion | Lames du Lion | Tourbillon d'Acier (dégâts, 4 PA) : Tournoie et frappe tous les ennemis autour du lanceur. | — (jamais ennemi) |
| Clan de l’Ours | Rempart de l’Ours | Rempart du Serment (protection, 4 PA) : Accorde une barrière aux alliés proches et provoque les ennemis. | `bear_warrior` |
| Clan du Dragon | Sanctuaire du Dragon | Sanctuaire (soin, 4 PA) : Restaure 20% des PV maximum des alliés dans une zone et les régénère. | `dragon_guardian` |
| Clan du Scorpion | Sceau des érudits | Sceau d'Entrave (altération, 4 PA) : Immobilise les ennemis dans une zone. | `scorpion_scholar` |
| Clan du Corbeau | Fumée du Corbeau | Bombe Fumigène (altération, 4 PA) : Aveugle les ennemis dans une zone et se protège d'une barrière. | `raven_scout` |
| Clan du Loup | Piège du Loup | Mâchoire à Ressort (dégâts, 4 PA) : Frappe une cible à distance et l'immobilise. | `wolf_raider` |
| Clan du Phénix | Flamme purificatrice | Purification (soin, 3 PA) : Restaure 20% des PV maximum d'un allié et dissipe ses altérations négatives. | `phoenix_guardian` |
| Clan du Serpent | — | — | `serpent_raider` |

Clans ennemis pris en compte par combat : au Tournoi, le seul clan affronté ; dans l’arène en flammes, aucun ; dans la capitale et à la brèche, tous, dans l’ordre où la compagnie les a rencontrés, dans la limite des places libres (quatre adversaires, ou un boss et trois escortes).

- `finale_raven_bout` : Clan du Corbeau
- `finale_wolf_bout` : Clan du Loup
- `finale_phoenix_bout` : Clan du Phénix
- `finale_serpent_final` : Clan du Serpent
- `finale_arena_assault` : aucun

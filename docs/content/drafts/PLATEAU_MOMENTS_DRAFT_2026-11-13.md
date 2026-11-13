# Tableaux vivants de l’après-démo — brouillon à valider (2026-11-13)

Statut : **À VALIDER**. Rien n’est codé dans le jeu avant ta validation. Seule une maquette, l’arrivée chez Borin, est jouable dans le laboratoire QA (voir « Maquette »).

Tu as demandé que les moments animés soient traités proprement sur tous les plateaux : « cela concerne tous les chapitres/plateaux concernant les moments animés ». Ce brouillon propose donc :
- les tables des moments de l’Ours, du Dragon et du Scorpion, sur le modèle de `FINALE_MOMENTS` ;
- le mouvement de chacun des treize moments, d’après ce que montre son tableau peint ;
- ce que changerait le passage des tableaux de l’après-démo à l’état « approuvé » ;
- une maquette avant les douze autres.

**Cadre.** Le cadre est verrouillé : set 1.20.0, « Post-demo moments », OD-2026-11-07-I, avec les règles des tableaux vivants des sets 1.13.0 et 1.14.0.
- Chaque plateau a trois moments :
  - son arrivée, avant le premier dialogue de son chef ;
  - son issue d’honneur et son issue de force, chacune après son dialogue d’après-combat.
- L’acte final en a quatre : la trahison au Tournoi et les trois épilogues.
- Cela fait **treize moments**. Un joueur en voit huit par partie : trois arrivées, trois issues, la trahison et un épilogue.
- Durée : 30 s au plus, 40 s pour la trahison et les épilogues.
- Ni légende, ni texte nouveau, ni choix dans une séquence.
- Un tableau peint approuvé seulement, jamais une image nouvelle.
- Quatre acteurs du récit au plus. Figurants : douze au plus, derrière les acteurs, sans réplique.
- Un clic ou Entrée passe au plan suivant ; Passer ou Échap mène au dialogue.
- Une séquence ne joue qu’à la première ouverture en direct. Une reprise ou une revisite ouvre le dialogue directement, sans champ de sauvegarde.
- Mouvement réduit : caméra fixe, apparitions en fondu ; le feu, la lumière et le vent restent animés. Depuis le set 1.22.0, seul le réglage du jeu le demande, pas celui du système.
- Musique : l’humeur du dialogue qui suit, par la table existante. Aucun son nouveau.

**Canon.** Chaque fait vient des dialogues, des finales et des présentations des plateaux (`src/campaign/plateaux/{bear,dragon,scorpion,finale}/`). Une séquence ne montre que ce qui est établi à son point de la route, et jamais ce que le dialogue suivant dit en premier. Ce qui n’est qu’un choix de mise en scène est marqué **(proposition)**.

**Visages couverts (OD-2026-11-11-G).** Chaque figure vient d’une planche ou d’un portrait existant et approuvé ; aucun visage n’est dessiné. Les chefs ont déjà le leur couvert :
- Borin, sous un heaume fermé couronné d’un ours ;
- Kaelen, sur ses planches approuvées ;
- le Grand Inquisiteur, sous son masque de cuivre.

## Questions à trancher

1. **Les tables de l’Ours, du Dragon et du Scorpion.**
   - **A. Les valider telles qu’écrites ci-dessous (recommandé).** Elles suivent le modèle du Lion :
     - à l’arrivée, le chef attend debout devant son siège, la compagnie entre et la séquence finit avant qu’il parle, comme l’audience d’Alaric ;
     - à l’issue d’honneur, la compagnie se tient immobile sur les lieux de la traque, sans l’adversaire vaincu, comme la fin de la poursuite Serpent ;
     - à l’issue de force, le chef vaincu se tient devant sa salle, face à la compagnie, comme Alaric sur les marches à la fin de l’épreuve.
   - B. Mêmes tables, mais la compagnie seule aux issues de force, sans le chef.
   - C. Mêmes tables, mais sans les gardes, gardiens ou érudits lointains aux arrivées.
2. **La trahison au Tournoi : un conflit entre la table approuvée et le contrat.** La table approuvée de l’acte final (OD-2026-11-09-B) liste quatre faits :
   - le champion du Serpent tombe ;
   - Maelor s’avance avec un artefact ;
   - la brèche s’ouvre ;
   - le champion se relève, changé en démon.

   Or la première réplique du dialogue `finale_betrayal` dit justement : « Le champion du Serpent tombe… et Maelor s’avance au milieu de l’arène, un artefact à la main ». Séraphine dit ensuite : « La brèche… Elle s’ouvre au cœur de l’arène ». Le contrat interdit à une séquence de montrer ce que le dialogue suivant dit en premier, et il place ce moment « avant le dialogue dans lequel la brèche s’ouvre ». En l’état, trois faits sur quatre ne peuvent pas être montrés.
   - **A. Tenir le contrat (recommandé).**
     - La séquence joue sur l’arène de la finale (`finale_pre_serpent_final`), la même arène, avant la brèche.
     - Elle montre la finale gagnée : la compagnie debout sur le sable, les tribunes pleines, les bannières des clans.
     - Elle finit sur un coup de vent, juste avant que Maelor s’avance.
     - Le dialogue s’ouvre alors sur le tableau de la brèche, au moment où Kestrel parle.
     - La table devient celle de la section « L’acte final », option A.
   - B. Garder les quatre faits approuvés. Il faudrait d’abord un amendement du contrat, que tu approuverais, puisque la règle « jamais ce que le dialogue suivant dit en premier » est verrouillée.
3. **Les trois épilogues : le même conflit.** Les trois épilogues s’ouvrent tous par « La brèche se referme ». Kestrel dit ensuite ce que font les bannières de chaque fin. Ces deux faits ouvrent aussi chaque ligne de la table approuvée. Ce qui est établi avant l’épilogue tient en deux répliques :
   - « La brèche vacille, mais elle est encore ouverte », dans `finale_breach_aftermath` ;
   - « Refermer la brèche, maintenant », dans `finale_act_end`.
   - **A. Tenir le contrat (recommandé).**
     - Chaque épilogue est précédé d’un même souffle sur `finale_act_end` : la capitale au matin, la brèche encore ouverte qui vacille dans le ciel, la compagnie face à elle.
     - La séquence finit avant que la brèche se referme.
     - L’épilogue s’ouvre ensuite sur son propre tableau, la brèche presque close, avec « La brèche se referme ».
     - Les images sont les mêmes pour les trois fins, mais chaque séquence prend l’humeur musicale de son épilogue. Rien ne bifurque avant la première réplique de l’épilogue.
   - B. Garder les faits approuvés sur les tableaux des trois épilogues. Il faudrait le même amendement que pour la trahison.
   - C. Ne jouer aucune séquence avant les épilogues : la table les omet, et ces moments ne jouent pas.
4. **Une maquette d’abord ?**
   - **A. Oui : l’arrivée chez Borin, déjà jouable dans le laboratoire QA (recommandé).** Tu la juges en mouvement avant les douze autres, comme Bois-Clair l’a été (OD-2026-11-04-A). Les raisons sont dans la section « Maquette ».
   - B. Non : les treize séquences d’un coup, jugées ensuite dans le laboratoire QA.
5. **L’humeur musicale des dialogues de l’après-démo.**

   Aujourd’hui, aucun dialogue de l’après-démo n’a de clé dans la table des humeurs (`src/audio/moods.ts`). Tous prennent donc l’humeur « refuge », par défaut, et chaque séquence la prendrait aussi : une trahison sur une musique de refuge.

   Le set 1.20.0 permet d’ajouter des clés pour les nouveaux dialogues, selon les règles existantes et sans son nouveau.
   - **A. Donner une clé aux dialogues qui suivent une séquence (recommandé).** Chacun prend l’humeur de son pendant du Lion :
     - les trois audiences : « tension », comme `lion_briefing` ;
     - les dialogues d’après-combat et les épilogues des plateaux : « drame », comme `serpent_general_aftermath` et `epilogue` ;
     - la trahison : « tension », comme `shadow_signs` ;
     - les trois épilogues de l’acte final : « drame ».
   - B. Laisser « refuge » partout.
6. **Marquer les tableaux de l’après-démo « approuvés ».**
   - **A. Oui, en phase 2, avec le code qui les lit, seulement pour les moments que tu gardes (recommandé).** Le détail est dans la section « Les tableaux provisoires ».
   - B. Non : les moments ne jouent pas.

## L’Ours

Le premier dialogue du chef est `bear_audience`. L’issue d’honneur suit `bear_master_spy_aftermath`, après la victoire `bear_master_spy`. L’issue de force suit `bear_trial_aftermath`, après la victoire `bear_borin`. L’épilogue `bear_epilogue` vient ensuite (`bearFinale.ts`). La forme de la table reprend celle de `FINALE_MOMENTS`, avec deux champs de plus :
- `afterDialogueId` : le dialogue d’après-combat que suit une issue ;
- `sceneId` : la scène dont la séquence emprunte le tableau peint.

```ts
export interface PlateauMoment {
  readonly id: string;
  readonly beforeDialogueId: string;
  readonly afterDialogueId?: string;
  readonly sceneId: string;
  readonly maxSeconds: 30;
  readonly facts: readonly string[];
  readonly status: 'proposed' | 'approved';
  readonly tableau: 'provisional' | 'approved';
}

export const BEAR_MOMENTS: readonly PlateauMoment[] = Object.freeze([
  { id: 'bear_arrival_moment', beforeDialogueId: 'bear_audience', sceneId: 'bear_audience', maxSeconds: 30, status: 'proposed', tableau: 'approved',
    facts: ['La compagnie arrive dans les Montagnes de la Résilience', 'L’Ancien Ours Borin la reçoit dans sa salle taillée dans la montagne'] },
  { id: 'bear_honour_moment', afterDialogueId: 'bear_master_spy_aftermath', beforeDialogueId: 'bear_epilogue', sceneId: 'bear_master_spy_aftermath', maxSeconds: 30,
    status: 'proposed', tableau: 'approved',
    facts: ['Le Maître Espion du Corbeau est vaincu dans les hautes galeries', 'Les Ombres se tenaient derrière le Corbeau'] },
  { id: 'bear_force_moment', afterDialogueId: 'bear_trial_aftermath', beforeDialogueId: 'bear_epilogue', sceneId: 'bear_trial_aftermath', maxSeconds: 30,
    status: 'proposed', tableau: 'approved',
    facts: ['La compagnie a vaincu Borin et ses guerriers selon la loi de la montagne', 'Borin et ses guerriers l’ont vu'] },
]);
```

**Identité en mouvement.** C’est le pays du froid et du feu :
- de la neige poussée par le vent, des chaînes et des treuils qui se balancent ;
- l’ambre des braseros et des torches sur le granit mouillé ;
- ni verdure, ni eau, ni rouge et or.

### Arrivée chez Borin, environ 26 s, maquette

- **Tableau** : `bear_audience`, la salle de Borin taillée dans le roc, sa poutraison sombre, ses lustres de fer, ses braseros et son siège de pierre.
- **Établi** : `bear_arrival`, avec « Les Montagnes de la Résilience » et « Le Clan de l’Ours garde ces pentes ».
- **Plan 1, 10 s.** La salle vide.
  - Les bougies des lustres vacillent ; les deux braseros au pied du siège et les torches des murs brûlent.
  - Quelques étincelles montent, la lueur tremble sur les dalles mouillées et une poussière chaude flotte.
  - Les bannières de l’Ours bougent à peine.
  - La caméra glisse au ras des dalles, des tonneaux du premier plan vers les marches.
- **Plan 2, 16 s.**
  - Borin attend debout devant son siège, en haut des marches.
  - Alistair, Séraphine et Maelor entrent depuis le spectateur et s’arrêtent au pied des marches.
  - Quatre guerriers de l’Ours se tiennent au loin, au pied des piliers : sans lumière, plus petits que la compagnie, figurants **(proposition)**. Aucune réplique ne les établit, comme pour les gardes d’Alaric.
  - La séquence finit avant que Borin parle.
- **Lumière.** Le feu éclaire les personnages par-devant et par en haut, avec un liseré ambré. Leur ombre tombe vers le spectateur.
- **Ce qu’elle ne montre pas** : le Corbeau, les mines, la requête, le Sceau, les rumeurs de Bois-Clair. Borin les dit en premier.
- **Borin** vient de sa planche de combat. C’est une planche de boss, deux cases sur deux : elle est dessinée à une stature réduite, celle d’un homme massif un peu plus grand qu’Alistair, et non d’un géant **(proposition)**.

### Issue d’honneur, après la chute du Maître Espion, environ 28 s

- **Tableau** : `bear_master_spy_aftermath`, une haute galerie ouverte sur les cimes au crépuscule, des caisses renversées, de la neige qui retombe.
- **Établi** : la victoire `bear_master_spy`, puis « Les Ombres, encore, derrière un autre clan ».
- **Plan 1, 12 s.**
  - Le soleil se couche derrière les pics ; les nuages glissent et la brume monte des vallées.
  - La neige traverse l’ouverture en biais.
  - Les chaînes et les crochets des treuils se balancent ; lanternes et braseros vacillent.
  - La caméra descend du soleil vers la galerie.
- **Plan 2, 16 s.**
  - Alistair, Séraphine et Maelor se tiennent immobiles parmi les caisses renversées, face aux cimes. La neige se pose.
  - La caméra recule lentement vers la galerie sombre.
- **Ce qu’elle ne montre pas** :
  - le Maître Espion : son sort n’est pas dit ;
  - Borin, l’alliance, le Sceau et l’éclat du filon sombre : l’épilogue les dit en premier.

### Issue de force, après l’épreuve de l’Ours, environ 28 s

- **Tableau** : `bear_trial_aftermath`, la terrasse de pierre devant la salle de Borin au couchant, avec la neige piétinée et les lances brisées.
- **Établi** : la victoire `bear_borin`, puis « La montagne l’a vu, mes guerriers aussi ».
- **Plan 1, 12 s.**
  - Le couchant sur les pics et la brume des vallées ; le vent soulève la neige au bord de la terrasse.
  - Les braseros s’avivent ; les lances brisées gisent dans la neige.
  - La caméra descend du soleil sur la terrasse.
- **Plan 2, 16 s.**
  - Borin se tient immobile sur la dernière marche, devant les portes closes de sa salle.
  - Deux guerriers de l’Ours encadrent les portes (figurants).
  - Alistair, Séraphine et Maelor se tiennent parmi les lances brisées, face à lui.
  - Personne ne s’écarte, personne ne remet rien.
- **Ce qu’elle ne montre pas** :
  - le Sceau ;
  - les guerriers qui laissent passer la compagnie et le départ : l’épilogue les dit en premier.
- **Variante (question 1 B)** : la compagnie seule.

## Le Dragon

Le premier dialogue du chef est `dragon_audience`. L’issue d’honneur suit `dragon_shaman_aftermath`, après `dragon_shadow_shaman` ; l’issue de force suit `dragon_trial_aftermath`, après `dragon_kaelen`. L’épilogue est `dragon_epilogue`.

```ts
export const DRAGON_MOMENTS: readonly PlateauMoment[] = Object.freeze([
  { id: 'dragon_arrival_moment', beforeDialogueId: 'dragon_audience', sceneId: 'dragon_audience', maxSeconds: 30, status: 'proposed', tableau: 'approved',
    facts: ['La compagnie arrive aux Pics Célestes', 'L’Ancien Dragon Kaelen la reçoit dans sa salle ouverte sur le ciel'] },
  { id: 'dragon_honour_moment', afterDialogueId: 'dragon_shaman_aftermath', beforeDialogueId: 'dragon_epilogue', sceneId: 'dragon_shaman_aftermath', maxSeconds: 30,
    status: 'proposed', tableau: 'approved',
    facts: ['Le Chaman des Ombres est vaincu sur l’arête des cimes', 'Les Ombres se tenaient derrière le Loup'] },
  { id: 'dragon_force_moment', afterDialogueId: 'dragon_trial_aftermath', beforeDialogueId: 'dragon_epilogue', sceneId: 'dragon_trial_aftermath', maxSeconds: 30,
    status: 'proposed', tableau: 'approved',
    facts: ['La compagnie a vaincu Kaelen et ses gardiens sur l’esplanade', 'Les Pics l’ont vu'] },
]);
```

**Identité en mouvement.** C’est l’air clair des hauteurs :
- la mer de nuages qui roule sous les pics ;
- l’encens qui monte des braseros de bronze, les cloches de bronze qui se balancent sans un son, et une neige poudreuse arrachée aux aiguilles ;
- jamais le blizzard ni le granit sombre de l’Ours.

### Arrivée chez Kaelen, environ 26 s

- **Tableau** : `dragon_audience`, une salle de pierre pâle ouverte par de hautes arches sur les pics et la mer de nuages, avec ses colonnes aux dragons, ses lanternes de bronze, son siège au dragon et ses deux dragons de bronze.
- **Établi** : `dragon_arrival`, avec « Les Pics Célestes ».
- **Plan 1, 10 s.**
  - Des nuages passent dans les arches ; plus bas, la mer de nuages roule lentement.
  - Un mince filet d’encens monte des braseros de bronze et s’enroule.
  - Les lanternes de bronze oscillent un peu, et des reflets glissent sur le dallage poli.
  - La caméra glisse sur la rosace du sol vers les marches.
- **Plan 2, 16 s.**
  - Kaelen attend debout devant son siège, entre les deux dragons de bronze.
  - La compagnie entre depuis le spectateur et s’arrête au pied des marches.
  - Quatre gardiens du Dragon se tiennent au loin, près des colonnes (figurants, **proposition**).
  - La séquence finit avant que Kaelen parle.
- **Ce qu’elle ne montre pas** : le Cristal d’Écho, le Loup, le Sceau.

### Issue d’honneur, après la chute du Chaman des Ombres, environ 28 s

- **Tableau** : `dragon_shaman_aftermath`, une arête enneigée entre les aiguilles au crépuscule, avec des taches noires qui pâlissent dans la neige, un encensoir, une cloche et un pont de cordes.
- **Établi** : la victoire `dragon_shadow_shaman`, puis « Les Ombres, derrière un troisième clan ».
- **Plan 1, 12 s.**
  - Le soleil se couche sur la mer de nuages, qui s’embrase et dérive.
  - De la poudreuse est soufflée des aiguilles ; la cloche de droite et le pont de cordes se balancent ; l’encens fume.
  - La caméra descend du soleil vers l’arête.
- **Plan 2, 16 s.**
  - La compagnie se tient immobile sur l’arête.
  - Les taches noires peintes perdent lentement leur éclat.
  - La caméra recule.
- **Ce qu’elle ne montre pas** : le Chaman, Kaelen, le Cristal, le Sceau.

### Issue de force, après l’épreuve du Dragon, environ 28 s

- **Tableau** : `dragon_trial_aftermath`, l’esplanade devant la grande salle au couchant, avec les lances brisées, les brûlures sur la pierre pâle et la mer de nuages embrasée.
- **Établi** : la victoire `dragon_kaelen`, puis « Les Pics l’ont vu ».
- **Plan 1, 12 s.**
  - Le couchant ; la mer de nuages luit et les ponts relient les aiguilles.
  - Les encensoirs fument près des portes et les cloches des colonnes se balancent.
  - La caméra descend du soleil sur l’esplanade.
- **Plan 2, 16 s.**
  - Kaelen se tient sur les marches de sa salle ; deux gardiens encadrent les portes (figurants).
  - La compagnie se tient immobile sur l’esplanade, face à lui.
- **Ce qu’elle ne montre pas** :
  - le Sceau ;
  - les gardiens qui laissent passer la compagnie : l’épilogue le dit en premier.
- **Variante (question 1 B)** : la compagnie seule.

## Le Scorpion

Le premier dialogue du chef est `scorpion_audience`. L’issue d’honneur suit `scorpion_prophet_aftermath`, après `scorpion_shadow_prophet` ; l’issue de force suit `scorpion_trial_aftermath`, après `scorpion_inquisitor`. L’épilogue est `scorpion_epilogue`.

```ts
export const SCORPION_MOMENTS: readonly PlateauMoment[] = Object.freeze([
  { id: 'scorpion_arrival_moment', beforeDialogueId: 'scorpion_audience', sceneId: 'scorpion_audience', maxSeconds: 30, status: 'proposed', tableau: 'approved',
    facts: ['La compagnie arrive aux Déserts Arides', 'Le Grand Inquisiteur la reçoit dans sa salle des archives'] },
  { id: 'scorpion_honour_moment', afterDialogueId: 'scorpion_prophet_aftermath', beforeDialogueId: 'scorpion_epilogue', sceneId: 'scorpion_prophet_aftermath', maxSeconds: 30,
    status: 'proposed', tableau: 'approved',
    facts: ['Le Prophète des Ombres est vaincu sur la crête des dunes', 'Les Ombres se tenaient derrière le Phénix'] },
  { id: 'scorpion_force_moment', afterDialogueId: 'scorpion_trial_aftermath', beforeDialogueId: 'scorpion_epilogue', sceneId: 'scorpion_trial_aftermath', maxSeconds: 30,
    status: 'proposed', tableau: 'approved',
    facts: ['La compagnie a vaincu le Grand Inquisiteur et ses érudits dans la cour', 'Ses érudits ont consigné l’épreuve'] },
]);
```

**Identité en mouvement.** C’est la lumière dure du désert :
- des rais de soleil à travers les moucharabiehs, où tourne la poussière ;
- le sable que le vent arrache aux crêtes, les auvents rayés qui ondulent et les lampes de cuivre ajouré ;
- l’ambre et le cuivre du couchant ;
- l’encre noire pour les Ombres, jamais de violet.

### Arrivée chez le Grand Inquisiteur, environ 26 s

- **Tableau** : `scorpion_audience`, la salle des archives éclairée d’en haut, avec ses casiers à rouleaux, ses échelles, ses lampes de cuivre, son estrade et ses bannières au scorpion.
- **Établi** : `scorpion_arrival`, avec « Les Déserts Arides » et « Ses érudits savent beaucoup ».
- **Plan 1, 10 s.**
  - De durs rais de soleil tombent des moucharabiehs ; la poussière y tourne.
  - Les taches de lumière ajourée glissent très lentement sur le dallage, avec la course du soleil.
  - Les lampes de cuivre oscillent et leurs flammes tremblent.
  - La caméra glisse le long du tapis vers l’estrade.
- **Plan 2, 16 s.**
  - Le Grand Inquisiteur attend debout devant son siège.
  - La compagnie entre depuis le spectateur et s’arrête au pied des marches.
  - Quatre érudits se tiennent au loin, parmi les tables et les rayonnages : immobiles, figurants. Le dialogue d’arrivée les établit comme gens du clan.
  - La séquence finit avant qu’il parle.
- **Ce qu’elle ne montre pas** : le codex du Phénix, le temple, le Sceau.

### Issue d’honneur, après la chute du Prophète des Ombres, environ 28 s

- **Tableau** : `scorpion_prophet_aftermath`, une longue crête de dune au couchant, avec des taches d’encre qui pâlissent et des feuillets à demi ensevelis.
- **Établi** : la victoire `scorpion_shadow_prophet`, puis « Les Ombres, derrière un quatrième clan ».
- **Plan 1, 12 s.**
  - Le soleil se couche sur les dunes et les mesas.
  - Le vent arrache un voile de sable à la crête ; les feuillets peints frémissent.
  - La caméra descend du soleil le long de la crête.
- **Plan 2, 16 s.**
  - La compagnie se tient immobile sur la crête.
  - Les taches d’encre perdent leur éclat ; quelques feuillets se soulèvent et retombent.
- **Ce qu’elle ne montre pas** : le Prophète, le Grand Inquisiteur, le codex, le Sceau.

### Issue de force, après l’épreuve du Scorpion, environ 28 s

- **Tableau** : `scorpion_trial_aftermath`, la cour murée de la maison des archives au couchant, avec les bâtons brisés, les tablettes d’argile éparses, le bassin sec et les portes closes.
- **Établi** : la victoire `scorpion_inquisitor`, puis « Mes érudits l’ont consigné ».
- **Plan 1, 12 s.**
  - Le ciel du couchant au-dessus des murs ; les auvents rayés ondulent et les lanternes des arcades sont allumées.
  - La longue lumière ambrée glisse sur les arcades ; un peu de poussière flotte.
  - La caméra descend du ciel dans la cour.
- **Plan 2, 16 s.**
  - Le Grand Inquisiteur se tient devant les portes closes de sa salle ; deux érudits se tiennent sous les arcades (figurants).
  - La compagnie se tient immobile dans la cour, face à lui.
- **Ce qu’elle ne montre pas** : le Sceau, et rien de ce que dit l’épilogue.
- **Variante (question 1 B)** : la compagnie seule.

## L’acte final

**La table approuvée** (`FINALE_MOMENTS`, `finalePresentation.ts:138`) garde ses quatre moments, leurs places et leur durée de 40 s. Les questions 2 et 3 décident de ce qu’ils montrent.

**Identité en mouvement.**
- Les bannières des huit clans dans le vent, la lumière froide et argentée du Tournoi.
- La brèche : une déchirure d’encre noire au mince liseré blanc et froid.
- Les braises et la fumée noire de la ville en feu, la lumière de cendre de l’aube.
- Jamais de violet.

### Option A, recommandée : la table tenue au contrat

```ts
// La forme de FinaleMoment gagne `sceneId`, puisque ces séquences jouent sur le tableau d’une autre scène que leur dialogue.
export const FINALE_MOMENTS: readonly FinaleMoment[] = Object.freeze([
  { id: 'finale_betrayal_moment', beforeDialogueId: 'finale_betrayal', sceneId: 'finale_pre_serpent_final', maxSeconds: 40, status: 'proposed', tableau: 'approved',
    facts: ['La compagnie remporte la finale du Tournoi contre le champion du Serpent', 'L’Arène des Destins, ses tribunes pleines et les bannières des clans'] },
  { id: 'finale_respect_moment', beforeDialogueId: 'finale_epilogue_respect', sceneId: 'finale_act_end', maxSeconds: 40, status: 'proposed', tableau: 'approved',
    facts: ['La brèche vacille, encore ouverte au-dessus de la capitale', 'La compagnie doit la refermer'] },
  { id: 'finale_fear_moment', beforeDialogueId: 'finale_epilogue_fear', sceneId: 'finale_act_end', maxSeconds: 40, status: 'proposed', tableau: 'approved',
    facts: ['La brèche vacille, encore ouverte au-dessus de la capitale', 'La compagnie doit la refermer'] },
  { id: 'finale_balance_moment', beforeDialogueId: 'finale_epilogue_balance', sceneId: 'finale_act_end', maxSeconds: 40, status: 'proposed', tableau: 'approved',
    facts: ['La brèche vacille, encore ouverte au-dessus de la capitale', 'La compagnie doit la refermer'] },
]);
```

Le statut repasse à `proposed` : ces faits remplacent ceux que tu as approuvés le 2026-11-09, et ta validation les rend `approved`.

**La trahison, environ 30 s.**
- **Tableau** : `finale_pre_serpent_final`, l’arène en fin d’après-midi, vue dans l’axe d’une porte à l’autre, avec les tribunes pleines et les bannières des clans sur leurs mâts.
- **Établi** : la victoire de la finale contre le champion du Serpent.
- **Plan 1, 14 s.**
  - Les bannières bougent sur leurs mâts, de longues ombres couchées sur le sable ratissé, un peu de poussière dans l’air.
  - La caméra descend des bannières vers le sable, dans l’axe.
- **Plan 2, 16 s.**
  - Alistair, Séraphine et Kestrel se tiennent sur le sable, face à la porte du fond.
  - La lumière se refroidit ; un coup de vent soudain fouette les bannières et soulève le sable **(proposition, sans fait nouveau)**.
  - La séquence finit sur ce coup de vent, avant que Maelor s’avance.
  - Le dialogue s’ouvre sur le tableau de la brèche.
- **Ce qu’elle ne montre pas** : Maelor, l’artefact, la brèche, le champion changé en démon. Le dialogue les dit en premier.
- **Le champion vaincu n’apparaît pas**, comme le champion du Lion à la fin de l’épreuve. Variante : à terre au loin, immobile.

**Les épilogues, environ 24 s chacun.**
- **Tableau** : `finale_act_end`, la capitale au matin depuis l’esplanade de l’arène, la brèche, déchirure noire, encore ouverte dans le ciel.
- **Plan 1, 10 s.**
  - Des colonnes de fumée montent et penchent dans le vent ; des feux tremblent dans les rues basses, avec des braises et les braseros de l’esplanade.
  - Haut dans le ciel, la brèche vacille : ses éclaboussures d’encre dérivent et son liseré blanc tremble.
  - La caméra descend de la brèche vers l’esplanade, au-dessus des toits.
- **Plan 2, 14 s.**
  - Alistair, Séraphine, Kestrel et Marian se tiennent sur l’esplanade, face à la brèche.
  - La caméra remonte lentement vers elle.
  - La séquence finit avant que la brèche se referme.
- **Ensuite.** L’épilogue s’ouvre sur son propre tableau avec « La brèche se referme ». Le choix de la Crainte reste dans son dialogue.

### Option B : la table telle qu’approuvée

- Sur le tableau de la trahison : Maelor s’avance avec l’artefact, la brèche s’ouvre et le champion se relève, changé en démon.
- Sur le tableau de chaque épilogue : la brèche se referme et les bannières de la fin font ce qu’elles font.
- Il faudrait un amendement du contrat avant de coder.

### Fond animé

- **Pour les trois plateaux.**
  - Le dialogue qui suit une arrivée garde la lumière, le feu et le temps de son tableau, sans aucune figure.
  - Les dialogues d’après-combat juste avant une issue gardent de même ceux de leur tableau, comme au Lion.
- **Pour l’acte final.**
  - Le dialogue de la trahison garde sur son propre tableau l’encre qui suinte, le liseré qui tremble et les bannières fouettées.
  - Chaque épilogue garde sur le sien la fumée, les braseros et les bannières.
- Un fond ne se dessine que sur l’image pour laquelle il est fait.

## Les tableaux provisoires

Le champ `tableau: 'provisional'` n’est lu qu’à un seul endroit : `finaleMomentPlays()` (`finalePresentation.ts:151`), et cette fonction n’est appelée que par son test (`finalePresentation.test.ts:93` à `97`). Le jeu, lui, ne consulte jamais `FINALE_MOMENTS` : aucun moment de l’acte final n’est branché et aucun script n’existe.

Le registre d’art, qui porte la notion de « provisoire » du contrat (WORLD_AND_CHARACTERS), traite déjà les quatre chapitres comme finaux :
- `POST_DEMO_FINAL_ART_CHAPTERS` (`postDemoPresentation.ts:29`) liste l’Ours, le Dragon, le Scorpion et l’acte final ;
- `hasProvisionalArt()` est donc faux ;
- `provisionalMark()` ne marque plus rien.

Tes ordres d’intégration ont rendu ces images finales : « Oui, intègre-le », puis « Intègre l’acte final » (OD-2026-11-11-F, F1). Les tableaux peuvent donc être tenus pour approuvés.

**Ce que ferait la bascule aujourd’hui.**
- `finaleMomentPlays()` rendrait vrai pour les quatre moments.
- La ligne 93 du test, qui attend `'provisional'` et `false`, échouerait.
- Rien ne jouerait dans le jeu : le champ ne pilote encore rien.

Je n’ai donc rien basculé.

**Proposé pour la phase 2**, dans le même commit que le branchement :
- passer à `approved` le `tableau` des moments que tu gardes ;
- donner aux tables des plateaux `tableau: 'approved'` dès leur création ;
- lier ce champ au registre d’art par un test : approuvé si et seulement si `hasProvisionalArt(beforeDialogueId)` est faux, pour qu’il ne dérive plus ;
- mettre à jour les commentaires qui disent l’inverse (`finalePresentation.ts:124-127` et `150`, `finaleEpilogues.ts:9-10`).

## Maquette : l’arrivée chez Borin

**Pourquoi une maquette d’abord.**
- **Le cadre des images change.** Les tableaux du Lion mesurent 1672 × 941 ; tous ceux de l’après-démo, 1536 × 1024 (3:2). Le lecteur, sa caméra, son calque et ses bannières supposaient 1672 × 941. La maquette leur apprend un cadre par plan. Ses valeurs par défaut sont inchangées, donc les sept tableaux vivants du Lion et l’ouverture ne bougent pas : leurs tests passent tels quels.
- **L’identité est nouvelle.** Pour la première fois, les lumières, les fumées et les figures sont posées sur une peinture de l’après-démo, avec un chef venu d’une planche de boss. Mieux vaut le juger en mouvement sur un moment que le refaire sur treize.
- **C’est le moment le plus proche d’un modèle déjà approuvé** : l’audience d’Alaric. Seules les nouveautés restent donc à juger.

**Où la voir.**
- `/?qa=1`, puis le bouton QA, puis « Maquette · Arrivée chez Borin » dans la rangée des tableaux vivants.
- Elle n’est pas branchée au jeu et ne figure pas dans la liste des moments du jeu (`LIVING_TABLEAUX`).
- Elle prend l’humeur de `bear_audience` par la table existante, soit « refuge » aujourd’hui (question 5).

**Ce qu’elle montre.** Le plan de l’arrivée chez Borin ci-dessus, en 26 s.
- Au plan 1, la caméra part du dallage, devant les tonneaux, et remonte vers les marches. Les braseros, les bougies et les torches vivent ; les bannières bougent à peine.
- Au plan 2, Borin attend devant son siège. La compagnie entre par le bas de l’image et s’arrête au pied des marches. Quatre guerriers se tiennent au fond, en silhouettes sombres.
- Borin a la taille d’un homme massif, et non celle de sa planche de boss.

**Ce qui a été vérifié.** Les captures ont été prises à 1600 × 900, à sept instants de la séquence, dans trois réglages. Elles ne sont pas versionnées.
- **Réglages du navigateur par défaut.** La caméra bouge et les personnages marchent.
- **`reducedMotion: 'reduce'` émulé.** Le jeu garde son mouvement, comme le veut le set 1.22.0 : le réglage du système ne demande plus le mouvement réduit.
- **Mouvement réduit du jeu activé.** La caméra reste fixe sur le cadrage final, et les personnages apparaissent en fondu à leur place.
- Dans les trois cas, la séquence finit d’elle-même et rend la main au laboratoire, sans erreur de page ni de console.
- **Non vu** : le son en temps réel et un vrai GPU sur ton poste.

## Phase 2, après ta validation

1. Coder les tables retenues, puis les scripts des treize moments, ou de ceux que tu gardes, sur le lecteur commun.
2. Les brancher sur les déclencheurs de présentation existants : première ouverture en direct pour les arrivées ; après le dialogue d’après-combat et avant l’épilogue pour les issues, à la place du moment statique de la Journey s’il y en a un ; avant leur dialogue pour l’acte final.
3. Ajouter les fonds animés. Ajouter aussi les clés d’humeur, si tu retiens la question 5 A.
4. Basculer les tableaux approuvés (question 6).
5. Tester avec les réglages par défaut du navigateur et avec `reducedMotion: 'reduce'` émulé ; vérifier dans le laboratoire QA ; écrire un rapport daté.

## Ce qui ne change pas

- Zéro vidéo active, aucune image nouvelle ou générée, aucun son nouveau.
- Aucune légende, aucun choix dans une séquence, aucun champ de sauvegarde, aucune vérité de jeu.
- Les sept tableaux vivants du Lion et l’ouverture gardent leur comportement.
- Les contrats ne sont pas touchés.

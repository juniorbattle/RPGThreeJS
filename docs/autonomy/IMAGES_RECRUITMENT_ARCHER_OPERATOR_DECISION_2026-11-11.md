# Images finales par OpenAI, recrutement, archère — OD-2026-11-11-F

- **Date** : 2026-11-11 au soir (America/Toronto), soit le 2026-11-12 en UTC.
- **Source** :
  - Trois questions de l’opérateur après l’audit final : produire les images avec OpenAI « dans la même logique que ce que nous avons » ; recruter les héros sur la carte ou par une interface de mercenaires ; changer la couleur de l’archère, trop proche des unités du Serpent.
  - La fiche d’arbitrages remplie le même soir : https://claude.ai/artifact/Ciy1GbrdFxu3gB6unVekQy. Les trois choix suivent la recommandation. Ses réponses ont été relues comme des données.
- **Statut** : ACTIVE. Aucun contrat touché. Les images finales forment le lot séparé mené avec l’opérateur (WORLD_AND_CHARACTERS « Provisional images ») ; seule la manière de le produire change pour OD-2026-11-09-C.

## Décisions

`APPROVED DECISION`

| ID | Choix | Note de l’opérateur | Portée |
| --- | --- | --- | --- |
| F1 | Images finales par un script OpenAI dans le dépôt, piloté par Claude, avec un pilote de 6 images d’un seul plateau d’abord. | — | Briefs tirés des registres (`awaitedFinal`) et de la direction artistique, avec en références les images approuvées et les maîtres Character V2. L’opérateur lance le script avec sa propre clé, que Claude ne lit jamais ; le coût passe sur son compte OpenAI. Les sorties arrivent hors Git avec une planche de relecture, et seules les images acceptées sont intégrées. Remplace pour le lot des images finales l’exécution par Codex prévue par OD-2026-11-09-C ; Codex peut toujours y contribuer sur demande. |
| F2 | Recrutement : la rencontre sur la carte, plus une seconde chance au refuge. | « prend aussi en compte les 6 autres heros » | Un héros rencontré mais pas recruté peut être engagé plus tard au refuge contre de l’or, plus cher et aux mêmes conditions de réputation. La note vise les six héros présents dans les données mais jamais recrutables : Aldric (Paladin), Morvan (Chevalier Noir), Lyra (Mage Rouge), Eldwin (Enchanteur), Talon (Ninja), Gunnar (Artilleur). Leur rencontre est à créer : c’est du canon, donc chaque scène sera soumise à l’opérateur. |
| F3 | L’archère Kestrel passe au bleu nuit. | — | Recoloration de son vert en bleu nuit sur son maître pixel, ses sprites et poses de combat, puis dans le brief de ses images finales. Le bleu nuit figure déjà dans sa palette d’identité (`assetManifest.ts`). |

## Livraison (2026-11-11 au soir)

`CURRENT FACT`
- **F3** : Kestrel porte du bleu nuit sur son maître pixel, ses quatre poses et sa planche de sprites de combat. Les empreintes des deux manifestes Character V2 et sa palette d’identité (`night blue, leather brown, antique gold`) suivent. La recoloration ne touche que le vert : le cuir, l’or et l’arc ne bougent pas. Elle est vérifiée en jeu, dans le dialogue d’avant-combat de la patrouille Serpent.
- **F1** : `tools/art/finalImages.ts` est livré avec son test.
  - L’étape **plan**, sans réseau, écrit `tmp/final-images/plan.json` : 162 fiches (106 décors, 10 atlas, 46 personnages).
  - Chaque fiche contient le brief, la taille et des références de style tirées de l’art approuvé du Lion. L’image provisoire n’est jamais envoyée en référence, car c’est un autre lieu ou un autre personnage ; elle figure seulement sur la planche de relecture.
  - Les deux personnages du pilote portent une apparence **proposée**, marquée « PROPOSAL, to confirm » : le canon ne décrit pas encore Borin ni le guerrier de l’Ours.
  - L’étape **run** appelle OpenAI avec la clé `OPENAI_API_KEY`, jamais écrite ni affichée. Elle la prend dans le terminal, sinon dans `.env.local` (ignoré par Git), que l’outil charge lui-même avec le lecteur de Vite, limité aux variables `OPENAI_` : aucun agent n’ouvre le fichier (demande de l’opérateur, 2026-11-11). Elle produit `tmp/final-images/out/`, `log.json` et `review.html`.
- **F2, première partie** : `src/game/refugeRecruitment.ts` et l’entrée « Engager » du refuge (`src/ui/RefugeHireView.ts`). Cedric (80 or au lieu de 50) et Garen (60 or au lieu de gratuit), rencontrés mais pas recrutés, peuvent y être engagés aux conditions de réputation calibrées de leur rencontre. Aucune réplique nouvelle.

## Lancer le pilote d’images

Avec la clé dans `.env.local` (`OPENAI_API_KEY=…`), Claude ou l’opérateur lance, dans un terminal ouvert sur le dépôt (sinon, définir d’abord `$env:OPENAI_API_KEY` dans le terminal) :

```powershell
npx vite-node tools/art/finalImages.ts -- plan
npx vite-node tools/art/finalImages.ts -- run --pilot
```

Le modèle par défaut est celui des images OpenAI déjà approuvées par le projet (`gpt-image-2.5-sunburst-2026-09-08`, d’après `tools/cinematics/specs/cin6ea3_pilot_e_image_gate.json`). Si ton compte ne le propose pas, ajoute par exemple `--model gpt-image-1`. Ouvrir ensuite `tmp/final-images/review.html`. Pour changer une apparence avant de lancer, il suffit de modifier le champ `notes` de la fiche dans `tmp/final-images/plan.json`.

## Règle permanente : visages couverts (OD-2026-11-11-G)

`CURRENT FACT` — Consigne de l’opérateur, à garder pour toujours : « comme nos personnages en totalité, pas de trait facial ; généralement ils ont soit des masques, casques ou simplement des capuches qui couvrent leur visage ; cette règle doit rester ».
- Elle généralise ce que suivent déjà les maîtres Character V2 approuvés : le casque fermé d’Alistair (« No visible face, skin, or hair »), le visage d’Elara dans l’ombre avec deux yeux, la capuche de Maelor, le visage dissimulé de Cedric.
- Toute image de personnage, aujourd’hui ou plus tard, la respecte. Dans `tools/art/finalImages.ts`, chaque fiche de personnage contient `COVERED_FACE_RULE` : visage entièrement couvert par un casque fermé, un masque ou l’ombre d’une capuche, au plus deux petits yeux lumineux dans l’ombre ; ni nez, ni bouche, ni peau du visage, ni barbe. Un test le vérifie pour les 46 fiches.
- L’apparence proposée pour Borin perd sa barbe et prend un heaume fermé surmonté d’une tête d’ours ; le guerrier de l’Ours porte un casque fermé.

## Pilote d’images (2026-11-11, nuit)

`CURRENT FACT` — Claude a lancé le pilote à la demande de l’opérateur. Les six images de l’Ours sont dans `tmp/final-images/out/` (ignoré par Git), avec `log.json` et `review.html`. Rien n’est intégré.
- Modèle par défaut, qualité haute : quatre décors en 1536×1024 et deux personnages en 1024×1024 sur fond transparent. Clé lue dans l’environnement du terminal, jamais affichée.
- Constat : l’héraldique des références du Lion a fui. Les bannières de l’audience montrent un lion dressé, et Borin porte des médaillons à tête de lion (épaules, ceinture, marteau). Le guerrier de l’Ours et les trois autres décors montrent bien l’ours.
- Correction dans l’outil : chaque fiche précise que les références donnent le style seulement, jamais leur héraldique, et nomme le signe du clan du lieu (l’ours, le dragon, le scorpion, jamais le lion ; plusieurs clans pour l’acte final).
- Régénération (accord de l’opérateur, 2026-11-12) de l’audience et de Borin, avec cette correction et la règle des visages couverts (OD-2026-11-11-G). L’audience devient une salle du trône : statue d’ours sur le trône, mosaïque et bannières à l’ours. Borin porte un heaume fermé surmonté d’une tête d’ours ; ses médaillons, son tabard et son marteau montrent l’ours, vérifiés au zoom. Les premières versions sont gardées dans `tmp/final-images/v1-lion-heraldry/`.
- Avis attendu de l’opérateur : les quatre décors se ressemblent beaucoup (place enneigée, montagnes, bannières, braseros). Les apparences proposées pour Borin et le guerrier sont encore à confirmer.

## Lot de l’Ours (2026-11-12)

`CURRENT FACT` — à la demande de l’opérateur (« lance l’Ours »), les 36 images restantes de l’Ours ont été générées, sans échec. Les 42 images de l’Ours sont dans `tmp/final-images/out/`, avec `review.html`. Rien n’est intégré.
- Outil : `--chapter <nom>` choisit toutes les images d’un chapitre pas encore générées ; `--concurrency <1-6>` lance plusieurs requêtes à la fois ; le journal et la page de relecture sont réécrits après chaque image. Chaque clan nommé par une fiche garde son propre signe : le Corbeau chez l’Ours, le Loup chez le Dragon, le Phénix chez le Scorpion, le champion du Serpent.
- Respecté partout : les visages sont couverts (casques, capuches) ; les bannières du Corbeau portent un corbeau là où la fiche le nomme, l’ours ailleurs ; aucun lion.
- Bons : les trois atlas, distincts et lisibles, le troisième montrant les galeries souterraines ; le campement du Corbeau ; la relique ; les personnages du Corbeau (éclaireur, mineur, contremaître, messager, chef des mineurs, Maître Espion), Borin et le guerrier.
- À refaire :
  - les deux bêtes d’élite (bête corrompue, bête des profondeurs), dessinées comme des chevaliers de l’Ours : les fiches de personnage ne distinguent pas une créature d’une personne ;
  - le mineur de l’Ours, dessiné en chevalier à l’épée ;
  - la plupart des 24 scènes et les refuges, qui reprennent la même composition : place enneigée de nuit, montagnes, bannières, braseros. Les scènes souterraines (filon sombre, éboulement, galeries tenues par le Corbeau) et la salle de Borin (veillée, jugement, avant-combat) sont dessinées en extérieur. Cause : la fiche d’un décor n’a qu’une ligne de sujet, le même cadre (« vue d’ensemble à hauteur d’œil, sol libre en bas ») et les deux mêmes références.
- Proposition à confirmer : une ligne de mise en scène par décor (intérieur ou extérieur, heure, éléments tirés des répliques de la scène), soumise à l’opérateur avant de régénérer ; une variante « créature » pour les bêtes.

## Mise en scène et identité de l’Ours (2026-11-12)

`CURRENT FACT` — l’opérateur a validé les mises en scène (`docs/content/drafts/BEAR_BACKDROP_STAGING_DRAFT_2026-11-12.md`), avec une consigne : « il faut pas que tout cela soit trop ressemblant avec les premières images du plateau Lion (démo), il faut que nous apportions une variété ressemblante aux premières images mais qui apporte une identité nouvelle propre à la thématique ».
- **Cause de la ressemblance** : l’outil demandait de copier « exactement » la palette des références du Lion. D’où les cascades, aqueducs et châteaux à l’horizon dans tout le lot, et une audience calquée sur la salle d’Alaric.
- **Règle désormais appliquée par l’outil** :
  - les références ne donnent que la technique du pixel art (densité, contours, tramage, lumière, détail) ;
  - chaque plateau a son identité : pays, palette, bâti, et motifs du Lion interdits (`IDENTITY` dans `tools/art/finalImagesStaging.ts`).
  - Celle de l’Ours : granit nu, neige chassée par le vent, gris froids, bois sombre, fer, ambre des seuls feux ; bâti massif et trapu taillé dans la roche ; ni arcs gothiques, ni aqueducs, ni cascades, ni rouge et or.
- **Outil** :
  - une ligne de mise en scène par décor ;
  - deux références choisies selon la lumière (jour, crépuscule, nuit au feu, intérieur) ;
  - ni neige ni ciel sous terre ;
  - des bannières seulement là où la ligne en nomme ;
  - les lieux qui se répondent prennent l’image déjà générée de leur pendant comme référence de plus : la salle de Borin, avant et après chaque combat, l’avant-poste et son refuge, la veillée et son refuge ;
  - une variante « créature » (références loup et sanglier) et une variante « civil » (survivant, réfugiée).
- **Régénéré : 30 images**, en trois passes, sans échec.
  - Cinq témoins d’abord : audience, filon, arrivée, refuge, bête corrompue.
  - Puis les 22 décors restants, la bête des profondeurs et le mineur.
  - Puis une passe ciblée de 8 images : les paires d’un même lieu et les scènes sauvages où des bâtiments apparaissaient au loin.
  - Restent du premier lot : le campement du Corbeau, les trois atlas et les huit personnages qui tenaient.
  - Les premières versions sont gardées dans `tmp/final-images/out-v1/`, les planches dans `tmp/final-images/sheets/` (anciennes dans `sheets/v1/`).
- **Relecture de Claude** :
  - chaque scène montre son lieu : souterrains sans ciel, salle de Borin en intérieur et la même d’une image à l’autre, sentiers sauvages sans bâtiment ;
  - les heures varient : matin, jour gris, crépuscule, nuit au feu, aube ;
  - la relique est l’ours de pierre sombre à la gemme rouge du texte ;
  - les bêtes sont des bêtes : une grande bête cornue aux veines rougeâtres, une créature pâle hérissée d’éclats noirs ;
  - le mineur est un civil encapuchonné, visage couvert.
- **À l’opérateur** : juger le lot ; rien n’est intégré avant son accord.

## Intégration de l’Ours (2026-11-12)

`CURRENT FACT` — l’opérateur a accepté le lot (« Oui, intègre-le ») : les 42 images de l’Ours sont dans le jeu, et le plateau ne porte plus la marque « Image provisoire ».
- **Atlas refaits avant l’intégration.**
  - Les lieux de l’Ours sont placés aux coordonnées de leurs pendants du Lion. Or les premiers atlas, peints librement et d’avant l’identité de l’Ours, posaient ces lieux sur des falaises et des rivières.
  - `tools/art/atlas_layout.py` met l’atlas du Lion au format du modèle. L’outil le donne comme tracé à repeindre (`ATLAS_LAYOUTS`), puis le résultat est recadré sur le cadre exact de l’atlas du Lion.
  - Superposition vérifiée : routes et repères tombent sur les chemins et les clairières, l’audience sur la salle de l’Ours.
- **Publication** : `tools/art/publish_final_images.py bear`.
  - Décors et atlas en WebP qualité 95 : 26 Mo au lieu de 98 en PNG, comme les plaques d’arène. Ils sont dans `public/assets/generated/post-demo/bear/` (`scenes/`, `refuges/`, `surfaces/`, `atlases/`).
  - Onze maîtres 512×512 à l’échelle Character V2 (pieds ligne 456), dans `public/assets/characters/pixel/post-demo/bear/`.
  - Provenance de chaque fichier (brief, modèle, date, empreinte) dans `tools/art/provenance/bear-final-images.json`.
- **Branchements, présentation seule, sans champ de sauvegarde** :
  - registre de l’Ours, avec `image`, `master` et des atlas non provisoires (`bearPresentation.ts`) ;
  - scène du dialogue (`NarrativeTableau`) ;
  - refuges, dont le fond définitif garde la famille visuelle de la plaque du Lion (`RefugePresentation`) ;
  - fin de chronique de l’Ours : la salle de Borin, avec la mise en scène de la fin du Lion. Avant, c’était un décor de voyage générique.
  - Portraits et figures : `assetManifest` et contrôle qualité des personnages. L’alias vers la silhouette de remplacement est retiré.
  - Planches de combat « maître seul » de `build_combat_sprites.py`, lancé par `py -3` ; modèles de combat sans `provisionalSprite`.
  - Cadrage des vignettes de combat et des portraits de dialogue.
  - La marque provisoire s’arrête pour l’Ours (`POST_DEMO_FINAL_ART_CHAPTERS`).
- **Vérifié dans le navigateur** (serveur `preview_start`, piloté par Playwright) : l’arrivée sur son décor, la carte I sur le nouvel atlas sans « Carte provisoire », l’audience avec Borin et son portrait, la fin de chronique dans la salle de Borin, quatre combats (défense des mines, épreuve de Borin, bête corrompue, bête des profondeurs) avec les nouvelles planches. Aucune erreur de console ni requête en échec.
- **Non vu en jeu** : les refuges (couverts par les tests, fond définitif sans marque).
- **Hors du lot d’images** : les combats de l’Ours se jouent dans les arènes codées du Lion (`forest_route`, `lion_sanctum`), dont le sanctuaire montre des bannières au lion. Réglé le même jour : voir « Arènes de l’Ours ».
- **Tests** : le registre de l’Ours vérifie chaque fichier, l’absence de marque, la fin de chronique, les portraits et les planches ; l’outil vérifie le tracé des atlas. Validation complète verte.

## Arènes de l’Ours (2026-11-12)

`CURRENT FACT` — à la demande de l’opérateur, une session parallèle (worktree, branche `claude/bear-arenas-045c51`) a donné aux combats de l’Ours leurs propres arènes codées. Le travail est poussé sur `dev` (`7d5e590a` pour le code et les tests, rapport `docs/reports/bear-arenas-2026-11-12.md`). L’opérateur l’a validé (« excellent »), puis la session a été archivée.
- **Trois arènes**, toutes codées (OD-2026-11-01-C : ni image générée ni plaque) :
  - `bear_mountain_pass` : le col enneigé ;
  - `bear_mine_galleries` : les galeries de mine ;
  - `bear_hall_terrace` : le parvis de la salle de Borin, pour `bear_borin` seul.
- **Répartition** : les 23 combats de l’Ours, POI et gardiens compris, sont répartis entre ces trois arènes ; la liste figure dans le rapport.
- **Identité de l’Ours** : granit, neige, bois et fer ; l’ours dressé sur chaque bannière et chaque relief ; plans lointains dessinés en code ; aucun motif du Lion.
- **Présentation seule** : grille, plateforme, résolution et sauvegardes sont inchangées. Aucun identifiant de scène n’est sauvegardé.
- **Aucun son nouveau** : le col reprend `forest_route`, les galeries et le parvis reprennent `lion_sanctum`.
- **Les autres arènes** : celles du Lion sont identiques (comparaison du graphe de scène, des géométries et des pixels des textures). Le Dragon, le Scorpion et l’acte final gardent leurs arènes, et un test le vérifie.
- **Vérifié** :
  - dans le navigateur (labo QA, rendu logiciel) : le col, les galeries, le parvis de Borin et le sanctuaire du Lion ;
  - suite complète repassée dans le checkout principal après fusion, au commit du Dragon : 3 344 tests.
- **Reste à juger sur le PC de l’opérateur** :
  - le rendu sur une vraie carte graphique ;
  - le col et le parvis, volontairement clairs et voilés. Sur la capture du col, les ennemis se lisent moins bien, en partie parce que la capture est prise en mode déplacement.

## Préparation du Dragon (2026-11-12)

`PROPOSED FUTURE DESIGN` — l’opérateur a demandé de préparer le Dragon, et de confier les arènes de l’Ours à une session parallèle.
- **Brouillon soumis** : `docs/content/drafts/DRAGON_STAGING_DRAFT_2026-11-12.md`. Il contient :
  - l’identité du Dragon : haut, ouvert, pierre claire et ciel, là où l’Ours est bas, clos, sombre et éclairé au feu ;
  - celle du Loup, et la marque des Ombres ;
  - 28 lignes de mise en scène tirées des répliques, 12 aspects de personnages et 3 tracés d’atlas sur ceux du Lion.
- **Kaelen est un ancien humain** au masque de dragon, et non un véritable dragon : l’opérateur l’a tranché le 2026-11-12 (« Ancien humain »), selon la recommandation. Le détail de son aspect reste à valider avec la fiche.
- **Questions ouvertes** :
  - la couleur du Cristal d’Écho (bleu glacé proposé) ;
  - l’identité elle-même.
- **Outil prêt pour la génération** :
  - les lignes, les aspects et les tracés sont dans `tools/art/finalImagesStaging.ts` ;
  - une ligne peut garder le ciel en intérieur (`skyVisible`) pour les salles ouvertes du Dragon ;
  - une fiche qui nomme les Ombres sans clan ne reçoit aucun signe de clan ;
  - le wyrm est traité en créature, le villageois et le pèlerin en civils.
- **Témoins d’identité** (non intégrés, `tmp/final-images/out/`) : le pied des Pics, l’ermitage, le repaire du Loup. Le premier ermitage montrait un dragon serpentin d’Orient. L’identité demande désormais des dragons d’Occident, ailés comme le jeune dragon du jeu, et l’ermitage est régénéré.
- **Validé** le 2026-11-12 (« Ancien humain », puis « Lance le Dragon »).

## Images du Dragon (2026-11-12)

`CURRENT FACT` — l’opérateur a validé la fiche, Cristal bleu glacé compris. Les 43 images du Dragon sont générées et relues ; aucune n’est intégrée.
- **Trois passes, sans échec** :
  - les quatre lieux que d’autres images reprennent : salle de Kaelen, veillée, arête du Chaman, esplanade de l’épreuve. Ils servent ensuite de référence à leurs paires ;
  - les 31 images indépendantes de ces lieux, en même temps ;
  - une passe de 14 : les 5 images de ces lieux (jugement, fin de chronique, refuge de la veillée, Chaman vaincu, Sceau arraché) et 9 reprises.
- **Les 9 reprises et leurs raisons.** Chaque brief fautif est corrigé dans `tools/art/finalImagesStaging.ts` ; les premières versions sont dans `tmp/final-images/out-v1/`.
  - Les quatre images du repaire avant et après le combat montraient des piliers sculptés de dragons et des cloches de bronze dans la caverne du Loup. La ligne précise désormais : « caverne du Loup, sans sculpture du Dragon, ni pilier, ni cloche ».
  - Le hameau montrait un bourg fortifié au loin. La ligne exclut désormais château, forteresse, monastère et bourg en vue.
  - Le Sceau du Dragon reprenait l’esplanade pavée à mosaïque de l’autel ; c’est désormais un belvédère sauvage.
  - L’abri des pèlerins s’ouvrait sur le ciel par une fenêtre, alors que la fiche le veut clos. Il devient une salle close, sans fenêtre.
  - Kaelen tenait un bâton serti d’un cristal bleu, qu’on aurait pu prendre pour le Cristal d’Écho. Il ne porte plus ni cristal ni gemme.
  - Le wyrm avait des veines et des yeux violets, que l’identité exclut. Il a désormais des veines noires et des yeux pâles, sans violet.
- **Relecture de Claude** :
  - l’identité tient : pierre claire, mer de nuages, bronze vert-de-gris, dragons d’Occident ailés. Aucun motif du Lion ou de l’Ours, aucune pagode ;
  - chaque lieu qui revient reste le même d’une image à l’autre :
    - la salle de Kaelen (audience, jugement, fin de chronique), seul intérieur ouvert sur le ciel ;
    - l’ermitage et son refuge ;
    - le repaire et ses quatre variantes ;
    - la veillée et son refuge ;
    - l’arête du Chaman et l’esplanade de l’épreuve ;
  - le Cristal luit en bleu glacé sur l’autel du repaire. Il manque sur l’autel fendu du sommet, d’où suinte la souillure noire ;
  - les bannières du Loup portent un loup, et le chaman ne porte aucun signe de clan ;
  - tous les visages sont couverts (masques, heaumes, têtes de loup, voiles), sauf le wyrm, dessiné en créature. Kaelen est l’ancien humain choisi, en robe d’écailles et masque-heaume de dragon en bronze ;
  - les trois atlas ont été recadrés sur le cadre du Lion, puis superposés à ses lieux : chaque repère tombe sur une route ou une clairière (`tmp/atlas-check/dragon-*.png`).
- **Points laissés au jugement de l’opérateur** :
  - l’atlas I dessine l’ermitage comme un camp palissadé ;
  - l’atlas III montre un sanctuaire au cristal près du sommet ;
  - les scènes de sentier (pied des Pics, pièges, guerrier blessé, inscriptions, pèlerins) ont des compositions voisines : sentier à gauche, mer de nuages à droite ;
  - la veillée place la salle de Kaelen plus près que « loin en contrebas ».
- **Journal** : `tmp/final-images/log.json` garde l’entrée de chaque image. Deux passes l’ont écrit en même temps ; j’ai vérifié qu’aucune entrée ne s’est perdue.
- **Pour l’intégration, après accord** : `tools/art/publish_final_images.py` devra connaître les élites du Dragon (Kaelen, chef du Loup, Chaman, champion du Loup) et compter le wyrm parmi les bêtes.
- **Planche** : `tmp/final-images/sheets/dragon-review.jpg`.
- **À l’opérateur** : juger le lot. Rien n’est intégré avant son accord.

## Intégration du Dragon (2026-11-12)

`CURRENT FACT` — l’opérateur a demandé : « corrige dans une session puis continue l’intégration du Dragon ». Les 43 images du Dragon sont dans le jeu, et le plateau ne porte plus la marque « Image provisoire ».
- **Corrections, dans une session parallèle** (« Corrections des images du Dragon », même dépôt, sans commit de sa part). Elle a régénéré dix images ; les versions précédentes sont dans `tmp/final-images/out-v2/`.
  - Les quatre points laissés au jugement :
    - l’atlas I montre désormais l’ermitage en pierre sur sa falaise, sans palissade ;
    - l’atlas III n’a plus de sanctuaire au cristal ;
    - les pièges, le guerrier blessé, les inscriptions et les pèlerins ont chacun leur cadrage : les marches vues de près, les terrasses le long de leur bord, la paroi de face, le sentier qui descend vers le spectateur ;
    - la veillée et son refuge mettent la salle de Kaelen loin en contrebas.
  - Deux sprites mis en accord avec l’arme de leur unité en combat, que l’intégration a révélé : le chasseur du Loup tient une fronde (« Fronde ») au lieu d’un arc, et le champion porte des lames de jet (« Lames de jet ») au lieu d’une épée longue. Les données de combat restent inchangées.
  - Les superpositions des atlas I et III sont vérifiées : chaque repère reste sur une route ou une clairière.
- **Publication** : `tools/art/publish_final_images.py dragon`, puis les dix corrections republiées avec `--ids`.
  - Décors et atlas en WebP qualité 95, 27 Mo, dans `public/assets/generated/post-demo/dragon/`.
  - Douze maîtres 512×512, dans `public/assets/characters/pixel/post-demo/dragon/` : élites à la taille des élites (Kaelen, chef du Loup, Chaman, champion du Loup), le wyrm parmi les bêtes.
  - Provenance des 43 fichiers dans `tools/art/provenance/dragon-final-images.json`, chacun sur sa génération la plus récente.
  - Contrôle qualité des douze maîtres propre : ni magenta, ni violet parasite, rien sous la ligne des pieds.
- **Branchements, présentation seule, sans champ de sauvegarde**, comme pour l’Ours :
  - registre du Dragon (`dragonPresentation.ts`, avec `image` et `master`) et atlas non provisoires (`plateauAtlas.ts`) ;
  - fin de chronique du Dragon dans la salle de Kaelen (`POST_DEMO_CHRONICLE_END_IMAGES`) ;
  - marque provisoire retirée (`POST_DEMO_FINAL_ART_CHAPTERS`) ;
  - portraits et figures dans `assetManifest`, et contrôle qualité des personnages ;
  - planches de combat « maître seul » de `build_combat_sprites.py` ;
  - huit modèles de combat sans `provisionalSprite` ;
  - cadrage des vignettes de combat ; portraits de dialogue des grands maîtres recadrés sur le casque.
- **Vérifié dans le navigateur** (serveur `preview_start`, piloté par Playwright), sans erreur de console ni requête en échec :
  - le passage de la fin de l’Ours à l’arrivée du Dragon sur son décor ;
  - la carte I sur le nouvel atlas, sans « Carte provisoire », avant et après la correction ;
  - l’audience avec Kaelen, sa figure et sa carte de dialogue ;
  - la fin de chronique dans la salle de Kaelen ;
  - six combats avec les nouvelles planches et vignettes : assaut du repaire, épreuve de Kaelen, wyrm corrompu, Chaman des Ombres, éclaireurs du Loup, avant et après le nouveau chasseur.
- **Non vu en jeu** : les refuges, couverts par les tests.
- **Hors du lot d’images** : les combats du Dragon se jouaient encore dans les arènes codées du Lion, dont le sanctuaire montre des bannières au lion. Réglé le même jour : voir « Arènes du Dragon ».
- **Tests** : le registre du Dragon vérifie chaque fichier, l’absence de marque, la fin de chronique, les portraits et les planches. Les tests du moteur de combat et du cadrage des vignettes tiennent compte des huit nouveaux portraits.

## Arènes du Dragon (2026-11-12)

`CURRENT FACT` — l’opérateur a lancé la carte proposée (« Arènes codées du Dragon »). Une session parallèle, dans son worktree, a donné aux combats du Dragon leurs propres arènes codées. C’est poussé sur `dev` : `2174b4bb` pour le code et les tests, `1f22aa7b` pour le rapport (`docs/reports/dragon-arenas-2026-11-12.md`).
- **Quatre arènes**, toutes codées (OD-2026-11-01-C : ni image générée ni plaque) :
  - le sentier des terrasses (`dragon_peak_trail`) : patrouille et éclaireurs du Loup, créatures des crêtes, wyrm corrompu, combats facultatifs des contreforts et des terrasses, gardien champion du Loup ;
  - les cimes enneigées au couchant (`dragon_snowy_summit`) : bêtes sous l’emprise des Ombres, Chaman des Ombres, combats facultatifs des cimes, gardien wyrm des cimes ;
  - le repaire du Loup (`dragon_wolf_cave`), sous le signe du Loup, sans sculpture de dragon ni cloche : les deux combats du repaire ;
  - l’esplanade devant la salle de Kaelen (`dragon_hall_esplanade`) : l’épreuve de Kaelen.
- **Identité** : calcaire pâle, herbe jaunie, pins tordus, bronze vert-de-gris, cloches, mer de nuages, et un dragon ailé à quatre pattes sculpté dans chaque arène du Dragon. Aucun motif du Lion.
- **Son** : chaque arène reprend une ambiance existante, aucun son nouveau. Seul le combat du wyrm corrompu change d’ambiance, puisqu’il se tient désormais sur les terrasses.
- **Ce qui ne change pas** : la grille, la plateforme, la résolution des combats et les sauvegardes. Les arènes du Lion et de l’Ours restent identiques à l’octet. Le Scorpion et l’acte final gardent les arènes du Lion, et un test le vérifie.
- **Vérifié** :
  - dans le navigateur de la session : les quatre arènes et un combat du Lion, sans erreur ;
  - dans le dépôt principal, après la fusion : 3 374 tests sans échec, ainsi que les contrats, le validateur narratif, les types et le build. Les 10 échecs vus dans le worktree venaient de médias ignorés par Git, absents d’un worktree neuf.
- **Non vérifié** : le rendu sur un vrai GPU (captures en rendu logiciel), le mouvement réduit du jeu activé, les autres combats du Dragon en jeu (couverts par le test d’affectation) et le mobile. Le jugement artistique revient à l’opérateur.

## Corrections de l’outil d’images (2026-11-12)

`CURRENT FACT` — l’opérateur a demandé de corriger les erreurs et ajustements relevés sur l’Ours et le Dragon. Une session parallèle s’en est chargée dans le dépôt principal : commit `7a67d926`, rapport `docs/reports/final-images-tool-fixes-2026-11-12.md`.
- **Journal des générations** : il est en ajout seul. Chaque passe relit le fichier puis le remplace d’un bloc ; deux passes simultanées ne perdent plus d’entrées.
- **Vitest** exclut `.claude/**`, pour qu’un worktree de session ne fasse plus tourner de tests en double.
- **Publication** : les cinq élites du Scorpion sont à leur taille dans `tools/art/publish_final_images.py`.
- **Six règles générales dans chaque brief**, tirées des 19 reprises du Dragon :
  - aucun signe du clan hôte dans les lieux d’un autre clan ;
  - pas de château, de forteresse, de monastère ni de ville en vue, sauf si la ligne en nomme un ;
  - une salle close n’a ni fenêtre ni ouverture ;
  - aucun personnage ne porte d’objet qu’on pourrait prendre pour l’objet sacré du plateau ;
  - jamais de violet pour les Ombres ;
  - chaque personnage tient son arme de combat, lue dans `legacyCombatRuntime.js`.
- **Armes de l’Ours** (OD-2026-11-12-A). La lecture des armes a montré que Borin et le guerrier de l’Ours combattaient avec des haches, alors que leurs images intégrées montrent un marteau et une lance. L’opérateur a choisi de renommer les armes (« Renommer les armes »), dans le commit `0224bea9` :
  - Borin : « Marteau de l’Ours » ;
  - le guerrier : « Lance de guerre ».

  Seuls le nom et l’icône changent. Un test vérifie désormais que chaque aspect écrit nomme l’arme de combat de son unité.
- **Vérifié** : 3 389 tests après fusion avec la fiche du Scorpion ; le combat de Borin en jeu, sans erreur. La session a été archivée sur la demande de l’opérateur.

## Préparation du Scorpion (2026-11-12)

`CURRENT FACT` — l’opérateur a demandé de préparer le Scorpion avec la méthode du Dragon, en appliquant d’avance toutes les leçons des reprises de l’Ours et du Dragon. Une session parallèle, dans son worktree, a fait ce travail (`4bf11f77`).
- **Validé tel quel** par l’opérateur le 2026-11-12 (« Validate as is »), avant d’avoir vu les témoins d’identité. Chaque question ouverte prend sa recommandation. La génération n’est pas lancée.
- **Fiche** : `docs/content/drafts/SCORPION_STAGING_DRAFT_2026-11-12.md`. Elle contient :
  - **l’identité du Scorpion** : plat, brûlé, ocre et ambre, la terre crue et l’ombre faite contre le soleil. Le Lion est vert et gothique, l’Ours en granit sous la neige, le Dragon en calcaire pâle au-dessus des nuages ;
  - **celle du Phénix** dans le même désert : pierre taillée couleur de cendre, colonnes sculptées de phénix, lampes allumées en plein jour, flamme safran au cœur blanc. Un lieu du Phénix ne montre aucun scorpion, et un lieu du Scorpion aucun phénix ;
  - **la marque des Ombres** : une encre noire et froide, jamais violette ;
  - 28 lignes de mise en scène tirées des répliques, 9 aspects de personnages proposés, chacun avec son arme de combat, et 3 tracés d’atlas sur ceux du Lion.
- **Le chef n’est nommé que par son titre**, « Grand Inquisiteur ».
- **Questions tranchées par la validation** (la recommandation de chacune) :
  - le Grand Inquisiteur est un érudit masqué de cuivre, au bâton à dard de scorpion ;
  - la flamme du Phénix est safran, au cœur blanc ;
  - le codex est relié de cuir gris cendre, avec des fermoirs de bronze, et n’a pas de lueur propre ;
  - la salle du Grand Inquisiteur est une salle des registres éclairée par de hauts claustras ;
  - les fidèles égarés sont des fidèles du Phénix perdus, sans emblème ;
  - les identités restent telles qu’écrites.
- **Outil prêt pour la génération** :
  - les lignes, les aspects et les tracés sont dans `tools/art/finalImagesStaging.ts` ;
  - le fidèle du Phénix et le fidèle captif sont traités en civils ;
  - chaque ligne d’atlas du désert contredit la phrase de l’outil qui change les ruisseaux du tracé en torrents glacés ;
  - tests : `tools/art/finalImagesScorpion.test.ts`.
- **Témoins d’identité : pas encore générés.** Le worktree de la session n’avait pas accès à la clé OpenAI, ni dans le terminal ni dans un `.env.local`, qui n’a pas été copié. Ils se lancent depuis le dépôt principal :

  ```bash
  npx vite-node tools/art/finalImages.ts plan
  npx vite-node tools/art/finalImages.ts run --ids scorpion:scene:scorpion_arrival,scorpion:scene:scorpion_oasis_gathering,scorpion:scene:scorpion_phoenix_temple --concurrency 3
  ```
- **Suite** : générer les trois témoins depuis le dépôt principal, les comparer à l’Ours et au Dragon, puis lancer le lot du Scorpion (28 décors, 9 personnages, 3 atlas), comme pour le Dragon.

## Images du Scorpion (2026-11-12)

`CURRENT FACT` — l’opérateur a validé la fiche telle quelle (« Validate as is »), puis a dit « on enchaîne ». Les 40 images du Scorpion (28 décors, 9 personnages, 3 atlas) sont générées depuis le dépôt principal et relues ; aucune n’est intégrée.
- **Outil, avant la génération** : la phrase des atlas sur les ruisseaux du tracé dépend désormais du plateau (`ATLAS_STREAMS` dans `tools/art/finalImages.ts`).
  - L’Ours et le Dragon gardent mot pour mot leurs torrents glacés : leurs briefs sont identiques à l’octet.
  - Le Scorpion reçoit des oueds secs. Ses trois lignes d’atlas ne contredisent plus l’outil.
- **Témoins d’identité** : le bord du désert, l’oasis et le temple du Phénix tiennent l’identité. Mis à côté de l’Ours et du Dragon intégrés, aucun ne dérive (`tmp/final-images/sheets/scorpion-identity-vs-bear-dragon.jpg`).
- **Génération** :
  - les sept lieux que d’autres images reprennent passent d’abord : la salle des registres, l’oasis, le temple, le sanctuaire des cendres, la veillée, la crête du Prophète et la cour ;
  - en même temps, les 21 images qui ne dépendent d’aucun d’eux ;
  - puis leurs 11 paires.

  Aucun échec d’appel. Le journal garde 47 entrées : 40 images et 7 reprises.
- **Les 7 reprises et leurs raisons.** Les premières versions sont dans `tmp/final-images/out-v1/`. Chaque brief fautif est corrigé dans `tools/art/finalImagesStaging.ts`, ou dans l’outil quand l’outil était en cause.
  - Le sanctuaire des cendres avait une douzaine de lampes allumées et des colonnes bâties, alors que la ligne veut des lampes froides et la seule lueur des braises. La ligne exclut désormais toute flamme et tout pilier. Repris avant que les pages souillées ne s’en servent de référence.
  - Les pages souillées, même lieu, avaient encore deux braseros allumés, et la page déchirée se voyait mal. Elles sont désormais sans flamme, la niche et sa page vues de près.
  - La cour du Grand Inquisiteur avait une fontaine pleine d’eau, des mesas au-dessus de ses murs et un livre sur un lutrin, visible par la porte. Sa ligne et celle de sa suite veulent désormais un bassin sec, des portes closes et le seul ciel au-dessus des arcades. La cour a été reprise avant sa suite.
  - L’abri des caravanes portait deux scorpions sculptés sur ses piliers, alors que la ligne ne veut aucun emblème de clan. La cause était dans l’outil : la phrase de héraldique du clan hôte demandait son signe sur tout emblème sculpté. Une ligne qui dit « no emblem of any clan » reçoit désormais une règle sans aucun clan (`NO_CLAN_RULE`), et l’abri devient une petite salle aux murs nus.
  - La bibliothèque ensevelie avait, au fond, des voûtes en ogive, motif du Lion, et des lampes allumées dans un lieu abandonné. La ligne demande désormais des arcs en plein cintre, des lampes froides et la seule lumière de la brèche.
  - L’épilogue montrait une oasis de palmiers, alors que la ligne veut des dunes sans fin et un seul arbre épineux. Il ne montre plus ni eau ni palmier.
  - Le Grand Inquisiteur portait un heaume d’acier gris à visière, au lieu du masque de cuivre validé. Il porte désormais un masque de cuivre sombre.
- **Relecture de Claude** :
  - l’identité tient : terre crue ocre, dunes et mesas, ombre faite contre le soleil ; le Phénix en pierre couleur de cendre, sa flamme safran au cœur blanc. Aucun motif du Lion, de l’Ours ou du Dragon, et aucun pixel violet dans les images des Ombres ;
  - chaque lieu qui revient reste le même d’une image à l’autre :
    - la salle des registres (audience, jugement, fin de chronique) ;
    - l’oasis et son refuge ;
    - le temple et ses quatre variantes ;
    - les cendres et les pages souillées ;
    - la veillée et le dernier refuge ;
    - la crête du Prophète et sa chute ;
    - la cour de l’épreuve et sa suite ;
  - le codex, relié de cuir gris cendre, repose sur son lutrin avant les combats du temple. Après eux, le lutrin est vide ;
  - aucun scorpion dans les lieux du Phénix, aucun phénix dans ceux du Scorpion ;
  - les intérieurs clos restent clos. Seules la salle des registres et la bibliothèque reçoivent le jour, par en haut ;
  - rien de bâti dans les scènes sauvages ; l’épilogue est un belvédère sauvage ;
  - les scènes de dunes ont chacune leur cadrage ;
  - tous les visages sont couverts, et chacun tient son arme de combat :
    - le Grand Inquisiteur, son bâton à dard de cuivre ;
    - l’érudit, son bâton ;
    - le chef des gardiens, sa lance de flamme ;
    - les gardiens, leur lance du temple ;
    - le gardien de flamme, son bâton à brasier ;
    - le Prophète et le fidèle égaré, l’encre noire de leurs mains.

    Personne ne porte de livre. Le Prophète ne porte aucun signe de clan. Les deux fidèles du Phénix sont des civils, sans arme ;
  - les trois atlas, recadrés sur le cadre du Lion, ont été superposés à ses lieux : chaque repère tombe sur une piste ou une clairière (`tmp/atlas-check/scorpion-*.png`). Chaque site est dessiné comme ses scènes le montrent ; l’oasis est la seule eau.
- **Points laissés au jugement de l’opérateur** :
  - le masque du Grand Inquisiteur est de cuivre, mais garde une forme de heaume à fente ;
  - les trois images de la salle des registres ont presque le même cadrage, et la fin de chronique n’est pas plus sombre que le jugement ;
  - l’atlas I garde un pont de planches au lieu d’une chaussée de pierre ;
  - les ponts de l’atlas III gardent leurs arches, en plein cintre ;
  - la bibliothèque ensevelie et l’abri des caravanes restent plus vastes que « petits ».
- **Pour l’intégration, après accord** : `tools/art/publish_final_images.py scorpion`, puis les mêmes branchements que pour le Dragon.
- **Planche** : `tmp/final-images/sheets/scorpion-review.jpg`.
- **À l’opérateur** : juger le lot. Rien n’est intégré avant son accord.

## Intégration du Scorpion (2026-11-12)

`CURRENT FACT` — l’opérateur a vu la planche et a dit : « Intègre le Scorpion ». Les 40 images du Scorpion sont dans le jeu telles que relues, sans nouvelle reprise, et le plateau ne porte plus la marque « Image provisoire ». Les cinq points laissés à son jugement restent tels quels.
- **Publication** : `tools/art/publish_final_images.py scorpion`.
  - Décors et atlas en WebP qualité 95, 23 Mo, dans `public/assets/generated/post-demo/scorpion/`.
  - Neuf maîtres 512×512, dans `public/assets/characters/pixel/post-demo/scorpion/`. Les élites sont à la taille des élites : Grand Inquisiteur, chef des gardiens, Prophète, gardien de flamme, fidèle égaré.
  - Provenance des 40 fichiers dans `tools/art/provenance/scorpion-final-images.json`, chacun sur sa génération la plus récente.
  - Contrôle qualité des neuf maîtres propre : ni magenta, ni violet parasite, rien sous la ligne des pieds. Les entrées sont ajoutées à `canonical-character-qc.json` dans le format du fichier.
- **Branchements, présentation seule, sans champ de sauvegarde**, comme pour l’Ours et le Dragon :
  - registre du Scorpion (`scorpionPresentation.ts`, avec `image` et `master`) et atlas non provisoires (`plateauAtlas.ts`) ;
  - fin de chronique du Scorpion dans la salle des registres (`POST_DEMO_CHRONICLE_END_IMAGES`) ;
  - marque provisoire retirée (`POST_DEMO_FINAL_ART_CHAPTERS`) ;
  - portraits et figures dans `assetManifest`, et contrôle qualité des personnages ;
  - planches de combat « maître seul » de `build_combat_sprites.py` ;
  - sept modèles de combat sans `provisionalSprite` : les trois boss, gardien, gardien de flamme, fidèle égaré, érudit ;
  - cadrage des vignettes de combat ; portraits de dialogue des grands maîtres recadrés sur le casque.
- **Vérifié dans le navigateur** (serveur `preview_start`), sans erreur de console ni requête en échec :
  - le passage de la fin du Dragon à l’arrivée du Scorpion sur son décor, sans marque provisoire ;
  - la carte I sur le nouvel atlas, sans « Carte provisoire » ;
  - l’audience dans la salle des registres, avec la figure et la carte de dialogue du Grand Inquisiteur ;
  - cinq combats sur leurs nouvelles planches : l’assaut du temple (chef des gardiens et gardiens), le gardien de flamme, le fidèle égaré, le Prophète et l’épreuve du Grand Inquisiteur avec ses érudits.
- **Non vus en jeu** : les refuges et la fin de chronique, couverts par les tests.
- **Hors du lot d’images** : les combats du Scorpion se jouent encore dans les arènes codées du Lion, bannières au lion comprises. Une session parallèle leur donne leurs propres arènes.
- **Tests** : le registre du Scorpion vérifie chaque fichier, l’absence de marque, la fin de chronique, les portraits et les planches. Les tests du moteur de combat et du cadrage des vignettes tiennent compte des sept nouveaux portraits. Le test de l’Ours, qui prenait le Scorpion comme exemple de plateau sans salle de fin de chronique, prend désormais l’acte final.

## Arènes du Scorpion (2026-11-12)

`CURRENT FACT` — l’opérateur a lancé la carte proposée (« Arènes codées du Scorpion »). Une session parallèle, dans son worktree, a donné aux 23 combats du Scorpion leurs propres arènes codées. C’est poussé sur `dev` : `19ea7224` pour le code et les tests, `3b539405` pour le rapport (`docs/reports/scorpion-arenas-2026-11-12.md`). La session avait atteint la limite d’usage en cours de route ; son commit intermédiaire, jamais poussé, est fondu dans `19ea7224`.
- **Six arènes**, toutes codées (OD-2026-11-01-C : ni image générée ni plaque) :
  - la piste des dunes (`scorpion_dune_track`), sous les bannières du Scorpion : bêtes des dunes, éclaireurs du Phénix, combats facultatifs des serpents et araignées des dunes ;
  - les ruines du Phénix (`scorpion_phoenix_ruins`), sans bannière : sentinelles du temple, gardien de flamme, combats facultatifs de la ronde du Phénix et des serpents des ruines, gardien de flamme du POI ;
  - la nef du temple du Phénix (`scorpion_phoenix_temple`), avec la flamme safran au cœur blanc : l’assaut du temple et sa prise. Le codex n’y est pas posé, car l’arène sert aux deux issues ;
  - le sanctuaire des cendres (`scorpion_ash_sanctuary`), sans bannière : fidèles égarés, gardes du sanctuaire, gardien fidèle égaré ;
  - la crête des dunes au crépuscule (`scorpion_dune_crest`), sans signe de clan, avec l’encre noire des Ombres et les feuillets du Prophète : le Prophète des Ombres et la « Veille des sables » ;
  - la cour de la maison des registres (`scorpion_records_court`) : l’épreuve du Grand Inquisiteur.
- **Signes séparés** : le temple, les ruines et le sanctuaire ne montrent que le phénix ; la piste et la cour que le scorpion. Un test le vérifie, un autre qu’aucun texel n’est violet. Aucun motif du Lion.
- **Son** : aucun son nouveau. La piste, les ruines et la cour reprennent l’ambiance de la route forestière ; le temple, le sanctuaire et la crête celle du sanctuaire du Lion.
- **Ce qui ne change pas** : la grille, la plateforme, la résolution des combats et les sauvegardes. Les arènes du Lion, de l’Ours et du Dragon restent identiques à l’octet, contrôlé deux fois, et un nouveau test (`arenaUnchanged.test.ts`) fige leur empreinte. L’acte final garde les arènes du Lion, et un test le vérifie.
- **Vérifié** :
  - dans le navigateur de la session, à 1600 × 900 : un combat par arène et le duel du Lion, sans erreur de page ni de console ;
  - dans le dépôt principal, après la fusion : 3 433 tests sans échec, ainsi que le validateur narratif, les contrats, les types et le build. Les 10 échecs vus dans le worktree venaient de médias ignorés par Git, absents d’un worktree neuf.
- **Non vérifié** : le rendu sur un vrai GPU, le mouvement réduit du jeu activé, les autres combats du Scorpion en jeu (couverts par le test d’affectation) et le mobile. Dans la cour, le bandeau de tour cache le haut de la bannière tant qu’il est affiché. Le jugement artistique revient à l’opérateur.

## Préparation de l’acte final (2026-11-12)

`CURRENT FACT` — une session parallèle a préparé l’acte final dans le dépôt principal, qui a la clé OpenAI, avec la méthode de l’Ours, du Dragon et du Scorpion (`fa35d7ba`). Rien n’est généré au-delà des trois témoins d’identité, et rien n’est intégré.
- **Validé tel quel** par l’opérateur le 2026-11-12 (« Valider tel quel »), après avoir vu les témoins et leur planche. Chaque question ouverte prend sa recommandation, et l’arène est reprise au début du lot pour ses huit signes. La génération du lot attend son ordre.
- **Fiche** : `docs/content/drafts/FINALE_STAGING_DRAFT_2026-11-12.md`, statut « VALIDÉ », avec la marche à suivre du lot (« Lancer le lot »). Elle contient :
  - **l’identité** : la seule ville du jeu, une vieille capitale à remparts en brique rouge cuite, avec des chaînages de pierre pâle et des toits d’ardoise bleu-noir. L’Arène des Destins est un amphithéâtre rond où flottent les bannières des huit clans. Le jour du Tournoi est sous un ciel voilé, les bannières seules en couleurs vives ; viennent ensuite le feu de la ville et la brèche ;
  - **la brèche** : une déchirure d’encre noire et froide au liseré blanc, née au cœur de l’arène, qui grandit jusqu’au-dessus de la ville basse, où est son cœur. C’est la marque des Ombres, jamais violette ;
  - 22 lignes de mise en scène tirées des répliques, 14 aspects de personnages proposés, chacun avec son arme de combat, et l’atlas sur le tracé `judgement` du Lion, dont les points de l’acte final gardent déjà les coordonnées.
- **Onze questions, tranchées par la validation** (la recommandation de chacune) :
  - l’aspect et la place de la brèche ;
  - les démons, faits de l’encre de la brèche ;
  - l’entité, une haute forme d’encre sans visage ;
  - le terrain du Tournoi, un amphithéâtre ;
  - une foule lointaine dans les gradins ;
  - la brique rouge et le ciel voilé ;
  - les champions aux couleurs de leurs clans ;
  - les maîtres existants du champion du Loup et de Maelor repris sans génération, et une seule image par champion ;
  - aucune bannière de la compagnie, puisque l’emblème d’Alistair reste ouvert ;
  - les canaux d’eau sombre de l’atlas ;
  - l’identité telle qu’écrite.
- **Outil**, sans changer un octet des 125 briefs de l’Ours, du Dragon et du Scorpion (vérifié par une empreinte dans les tests) :
  - les entrées dans `tools/art/finalImagesStaging.ts` ;
  - dans `tools/art/finalImages.ts` :
    - la phrase des ruisseaux de l’atlas propre à l’acte final ;
    - la règle de l’objet sacré (les Sceaux et l’artefact de Maelor) ;
    - une règle sans clan et les références de bêtes pour les démons et l’entité ;
    - une exception de foule lointaine, limitée aux huit décors du Tournoi.
  - Tests : `tools/art/finalImagesFinale.test.ts`.
- **Témoins** :
  - les décors choisis : l’arène vue des gradins, la capitale en flammes vue des portes de l’arène, le cœur de la brèche ;
  - deux reprises :
    - l’arène tirait vers le Lion : ciel bleu doré, fanions rouge et or sans clan, toits pointus, aqueduc ;
    - la vue sur la capitale portait une bannière inventée ;
  - leurs lignes sont corrigées, et les premières versions sont dans `tmp/final-images/out-v1/` ;
  - l’identité tient face aux trois plateaux intégrés (`tmp/final-images/sheets/finale-identity-vs-bear-dragon-scorpion.jpg`) ;
  - reste un défaut de détail : la reprise de l’arène a deux loups et pas de lion. Elle est reprise au début du lot.
- **Suite** : sur l’ordre de l’opérateur, le lot de l’acte final se génère, est relu, puis intégré sur son ordre. Il compte 22 décors (2 déjà faits, l’arène à reprendre), 9 personnages et 1 atlas. Le portrait du champion du Loup et le sprite de Maelor reprennent leurs maîtres, et le sprite de chaque champion sert aussi à son portrait.

## Images de l’acte final (2026-11-12)

`CURRENT FACT` — l’opérateur a dit « Lance le lot ». Les 32 images de l’acte final sont générées depuis le dépôt principal et relues ; aucune n’est intégrée.
- **Ce qui est généré** :
  - 22 décors ;
  - 9 personnages ;
  - 1 atlas.

  Selon la recommandation 8 A, deux maîtres sont repris sans génération : le portrait du champion du Loup (`post-demo/dragon/wolf_champion.png`) et le sprite de Maelor (`masters/maelor.png`). Le sprite de chaque champion du Corbeau, du Phénix et du Serpent sert aussi à son portrait.
- **Génération** :
  - deux vagues : d’abord l’arène reprise, la dernière maison et les images qui ne dépendent d’aucun lieu ; ensuite les 16 scènes qui reprennent un lieu ;
  - aucun échec d’appel ;
  - le journal garde 41 entrées pour l’acte final : 32 images et 9 reprises, témoins compris.
- **Les reprises du lot et leurs raisons.** Les versions précédentes sont dans `tmp/final-images/out-v1/`. Chaque brief fautif est corrigé dans `tools/art/finalImagesStaging.ts`.
  - **L’arène**, l’image de référence des huit scènes du Tournoi, est reprise deux fois.
    - Sa deuxième version avait deux loups et pas de lion. La troisième avait sept bannières en haut, toujours sans lion, et deux doublons au premier plan.
    - La cause était en partie dans l’identité : elle interdisait tout rouge et or, donc la bannière du Lion. L’identité fait désormais une exception pour cette seule bannière.
    - La ligne de l’arène veut désormais exactement huit bannières, en une rangée sur le bord du fond et dans un ordre donné, et aucun mât au premier plan.
    - La quatrième version a les huit signes justes ; les sept scènes du Tournoi qui la reprennent aussi.
  - **Le ralliement** inventait des blasons sans clan (un arbre blanc, un cerf, une étoile) et une bannière violette. Il montrait aussi la brèche en losange flottant, du côté de l’arène.
    - Les bannières des scènes qui dépendent de la partie ne portent désormais que les signes des clans, petits, jamais d’autre emblème ni de violet.
    - La vue descend vers la ville basse, où se dresse la brèche.
  - **Le champion changé en démon** avait des fissures rougeoyantes de lave et beaucoup de bronze. Il a désormais une peau noire mate, sans aucune lueur.
  - **Les trois épilogues** recopiaient la brèche grande ouverte de leur image de référence, alors que chacun commence par « La brèche se referme ». Leurs lignes ne veulent plus qu’une mince ligne de lumière blanche, sans colonne noire.
- **Relecture de Claude** :
  - l’identité tient d’un bout à l’autre :
    - l’arène de brique rouge et de pierre pâle sous un ciel voilé, ses huit bannières ;
    - la ville en flammes la nuit ;
    - la brèche d’encre noire au liseré blanc ;
    - les rues effondrées ;
    - la salle de la dernière veillée et sa fenêtre sur la brèche ;
  - aucun motif de l’Ours, du Dragon ni du Scorpion ;
  - au plus 0,11 % de pixels violets, le ciel nocturne ;
  - chaque lieu qui revient reste le même :
    - l’arène et ses huit scènes ;
    - la vue des portes, de nuit puis au matin ;
    - la maison de la veillée et le refuge ;
    - le cœur de la brèche et ses six suites ;
  - la brèche grandit d’une scène à l’autre : étroite à la trahison, plus large dans le chaos, dressée au-dessus des gradins en flammes, puis vacillante, réduite à une couture, refermée en cicatrice à la fin de la Crainte ;
  - les fins montrent chacune leurs faits :
    - le Respect, un cercle de bannières autour du cratère ;
    - la Crainte, le cratère vide et des bannières qui approchent ;
    - l’Équilibre, des bannières proches et d’autres au loin ;
  - aucune bannière de la compagnie ;
  - les visages sont couverts. Chacun tient son arme de combat :
    - le Corbeau, ses lames de jet ;
    - le Phénix, sa lance du temple à la flamme safran ;
    - le Serpent, sa lame courbe ;
    - les démons, leurs griffes ;
    - l’entité, l’encre de ses mains.

    Les démons et l’entité sont noirs d’encre, sans visage, aux yeux blancs. La spectatrice et l’habitant sont des civils, sans arme ;
  - l’atlas, recadré sur le cadre de `judgement`, a été superposé à ses onze points : chaque repère tombe sur une rue ou une place (`tmp/atlas-check/finale-1-markers.png`). On y voit l’arène en bas à gauche, la grande place tachée d’encre, le marché, la maison encore debout et la brèche en haut à droite.
- **Points laissés au jugement de l’opérateur** :
  - dans l’arène de référence, la ville monte derrière l’arène au lieu de descendre la colline, un petit viaduc reste à droite, et la foule du premier plan est lisible ;
  - le ralliement montre encore l’arène au loin, contre sa ligne. Les sept images du cœur de la brèche la montrent aussi, sur la colline, comme le premier témoin ;
  - la brèche qui vacille n’est pas visiblement plus étroite que dans la confrontation ;
  - le recadrage de l’atlas coupe une partie du rempart en haut ;
  - le champion changé en démon garde plus de plaques de bronze que « deux ou trois » ;
  - l’écharpe de l’habitant est rouge plutôt que noircie de suie.
- **Pour l’intégration, après accord** :
  - ajouter les élites de l’acte final, de taille 2 en combat, à `ELITES` dans `tools/art/publish_final_images.py` : les champions du Corbeau, du Phénix et du Serpent, le champion changé en démon, le démon massif et l’entité ;
  - `py -3 tools/art/publish_final_images.py finale`, sans les portraits de champion ni les deux maîtres repris ;
  - les mêmes branchements que pour le Scorpion : le portrait de chaque champion pointe sur le maître de son sprite, et celui du Loup sur le maître du Dragon.
- **Planche** : `tmp/final-images/sheets/finale-review.jpg`.
- **À l’opérateur** : juger le lot. Rien n’est intégré avant son accord.

## Rencontres des six héros (2026-11-11, nuit)

`CURRENT FACT` — l’opérateur a approuvé les répliques mot à mot (« Textes approuvés ») ; le brouillon `docs/content/drafts/SIX_HEROES_MEETINGS_DRAFT_2026-11-11.md` est intégré tel quel.
- `src/campaign/plateaux/heroMeetings.ts` : chaque rencontre se joue juste après une scène de choix existante, sur ses deux issues, sans en changer une réplique.
  - L’Ours : Gunnar l’Artilleur après le Convoi de minerai (120 or) ; Aldric le Paladin après le Sanctuaire de la montagne (réputation 55 ; offrandes pillées : rendre les 50 or).
  - Le Dragon : Lyra la Mage Rouge après le Hameau terrorisé (réputation 45 ; protection payée : rendre les 60 or) ; Talon le Ninja après les Pièges du Loup (150 or).
  - Le Scorpion : Eldwin l’Enchanteur après les Érudits (réputation 60 si le fidèle est libéré ; fermé pour toute la partie s’il est abandonné) ; Morvan le Chevalier Noir après la Bibliothèque ensevelie (180 or, réputation 65 au plus).
- `src/game/refugeRecruitment.ts` : la seconde chance vaut pour les huit héros recrutables. Chacun des six attend au refuge que nomme sa réplique d’adieu, aux conditions de sa rencontre plus le supplément approuvé : Refuge des mineurs (Gunnar, 180 or), Veillée avant le Sceau (Aldric, +60 or), Ermitage des contreforts (Lyra, +60 or), Abri des pèlerins (Talon, 220 or), Oasis des érudits (Eldwin, +80 or), Abri des caravanes (Morvan, 260 or). Cedric et Garen, dont les répliques ne nomment aucun refuge, restent proposés dans n’importe quel refuge.
- Le plafond de recrues de `GameApp` (deux sur tout le jeu) est remplacé par `canRecruit` : un héros recrutable, absent de la compagnie, et une place libre. Les huit recrues possibles, deux par chapitre, plus les quatre du départ, font les 12 membres maximum.
- Les six héros parlent avec leur portrait d’archive (`public/assets/characters/pixel/archive/non-demo/`) jusqu’aux images finales. Les choix de recrutement sous réputation sont exclus du contrôle des bornes de réputation des plateaux ; l’étalonnage du Lion ne change pas.
- Tests : `src/campaign/plateaux/heroMeetings.test.ts` (rencontres reliées aux deux issues, conditions, huit recrues jusqu’à 12, seconde chance au bon refuge). Validateur narratif vert sur les cinq cartes.

## Suite

`PROPOSED FUTURE DESIGN`, à confirmer par l’opérateur :
- **Portraits** : les maîtres Character V2 des six héros entreront dans le lot des images finales, après le pilote.
- **Essai en jeu** : les six rencontres et leurs secondes chances sont à juger lors du test PC final.
- **Dragon, Scorpion, acte final** : chaque chapitre reçoit, avant son lancement, une identité propre et une ligne de mise en scène par décor, soumises à l’opérateur comme pour l’Ours. Le Dragon est intégré depuis le 2026-11-12 ; les 40 images du Scorpion sont générées, relues et intégrées le même jour ; l’identité et la mise en scène de l’acte final sont validées telles quelles le 2026-11-12, et ses 32 images sont générées et relues le même jour, sans être intégrées.
- **Arènes du Scorpion et de l’acte final** : leurs combats jouent encore dans les arènes codées du Lion. Chacun pourra recevoir les siennes, comme l’Ours et le Dragon, à la demande de l’opérateur.

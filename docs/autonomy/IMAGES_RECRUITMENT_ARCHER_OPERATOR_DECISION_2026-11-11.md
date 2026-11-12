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

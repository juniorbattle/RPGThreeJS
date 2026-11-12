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
  - L’étape **run** appelle OpenAI avec la clé lue dans `OPENAI_API_KEY`, jamais écrite ni affichée. Elle produit `tmp/final-images/out/`, `log.json` et `review.html`.
- **F2, première partie** : `src/game/refugeRecruitment.ts` et l’entrée « Engager » du refuge (`src/ui/RefugeHireView.ts`). Cedric (80 or au lieu de 50) et Garen (60 or au lieu de gratuit), rencontrés mais pas recrutés, peuvent y être engagés aux conditions de réputation calibrées de leur rencontre. Aucune réplique nouvelle.

## Lancer le pilote d’images (opérateur)

Dans un terminal PowerShell ouvert sur le dépôt :

```powershell
$env:OPENAI_API_KEY = "<ta clé>"
npx vite-node tools/art/finalImages.ts -- plan
npx vite-node tools/art/finalImages.ts -- run --pilot
```

Le modèle par défaut est celui des images OpenAI déjà approuvées par le projet (`gpt-image-2.5-sunburst-2026-09-08`, d’après `tools/cinematics/specs/cin6ea3_pilot_e_image_gate.json`). Si ton compte ne le propose pas, ajoute par exemple `--model gpt-image-1`. Ouvrir ensuite `tmp/final-images/review.html`. Pour changer une apparence avant de lancer, il suffit de modifier le champ `notes` de la fiche dans `tmp/final-images/plan.json`.

## Suite

`PROPOSED FUTURE DESIGN`, à confirmer par l’opérateur :
- **Rencontres des six héros** : deux par plateau de l’après-démo, chacune avec sa seconde chance au refuge.
  - L’Ours : Gunnar l’Artilleur, près des galeries, et Aldric le Paladin.
  - Le Dragon : Lyra la Mage Rouge et Talon le Ninja.
  - Le Scorpion : Eldwin l’Enchanteur, parmi les érudits, et Morvan le Chevalier Noir.
  - Chaque scène sera écrite en brouillon et soumise mot à mot.
- **Règle à revoir** : le plafond de recrues de `GameApp` (aujourd’hui deux héros recrutés au plus, sur tout le jeu) devra devenir « deux par plateau » ; la compagnie compte au plus 12 membres.
- **Portraits** : leurs maîtres Character V2 entreront dans le lot des images finales, après le pilote.

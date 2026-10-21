# Bois-Clair, arrivée — candidat hors runtime v1

Run `codex-illustrated-audience-20261021T1754Z`, branche dev, source `256cd041d3639c94b070ddaf46f9bad10e342362` (src inchangé depuis ab6a45f). OD-2026-10-21-A/B ; contrats1.8.0. Le montage audience précédent est publié READY_FOR_OPERATOR_REVIEW, sans art/runtime accepté.

## Frontière et références actuelles

- `src/cinematics/Cin6aPresentation.ts:18` : `beforeDialogue village_choice` → `bois_clair_arrival`.
- `src/game/content.ts:619` : la Villageoise parle des enfants emmenés, avant la nuit ; Marian décrit le village divisé et les blessés ; le Pillard menace ensuite. Le choix pont/captifs ou porte basse/réserves apparaît seulement à l'étape5 et lance le combat. Aucun résultat, sauvetage, coffre, eau empoisonnée, combat ou choix n'est joué dans le prélude.
- `src/campaign/LionCampaignStructure.ts:236` : BOIS_CLAIR, cast requis étendu ; utiliser un sous-ensemble de quatre : Alistair, Marian, Villageoise, Pillard Serpent. Cedric est optionnel (`contextualDialogueContent.ts:87`), donc absent de ce candidat générique.
- `src/render/data/demo-environment-pack-v1.production.json:846` et856 : même environnement approuvé `tableau/bois-clair-tableau-burning.png` pour média et dialogue. Image inspectée : crépuscule orange, incendie déjà présent, palissade endommagée, maisons, chapelle/clocher au fond, place humide. Ne pas confondre avec l'ATE de garde nocturne corrigé ensuite ; ni jour plein, ni nuit ajoutée, ni nouvel effondrement.
- Masters V2 inspectés : Alistair, `white_mage` (Marian), Villageoise, Pillard Serpent. Aucun remaster/source/runtime modifié. Épée d'Alistair basse dans la main droite ; bâton solaire de Marian dans sa main droite ; panier de la Villageoise ; lame courte du Pillard basse dans sa main droite.

## Cinq images,18s proposées

1. **Une place sous l'incendie (4s)** : large ; Alistair/Marian à gauche, Villageoise distincte au centre, Pillard à droite éloigné ; lieu et opposition déjà présents, aucun déplacement ni captif ajouté.
2. **S'arrêter au bord de la place (3s)** : moyen héros ; Alistair stabilise son épée basse et Marian s'immobilise, regard vers la place, aucun assaut.
3. **Le panier serré contre soi (3s)** : Villageoise resserre son panier existant, attention vers les héros ; peur retenue, aucune parole, départ ou secours.
4. **Marian lui porte attention (3s)** : relation à deux, Marian tourne sa tête voilée vers la Villageoise, bâton vertical, aucune guérison/magie/prise de main.
5. **Avant l'appel à l'aide (5s)** : retour large quatre acteurs, même géographie ; attention héros/Villageoise lisible, Pillard demeure éloigné/opposé, aucun geste d'ordre. Arrêt avant `village_choice:1`, jamais l'issue d'une branche.

Fondus entiers1s ou0,8sOSreduce, pauses, aucune translation/zoom/morphing ou marche continue revendiquée. Ce run a déjà son unique scénario technique d'audience ; ce second candidat sera enregistré honnêtement en revue technique en attente, avec reprise prioritaire sur les images vertes au prochain run.

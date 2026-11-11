# Retour de jeu du 2026-11-11 : échoppe et forge, achat en quantité et filtres par type

| Champ | Valeur |
| --- | --- |
| `TASK` | `claude-playtest-shop-20261111T0455Z` |
| `DOMAIN` | Gestion au refuge : `src/game/management.ts` (propriétaire de l'achat et de la vente), `src/ui/ManagementView.ts` et `src/ui/shopFilters.ts` (présentation), `src/styles/app.css` |
| `BASELINE` | `4d8e1d0d` sur `dev` |
| `BRANCH` | `playtest-shop` (créée depuis `origin/dev`) |
| `HEAD` | voir `git log playtest-shop` (commits de cette tâche) |
| `STATUS` | review |
| `MERGED_IN` | `NONE` |
| `SUPERSEDES` | `NONE` |
| `SUPERSEDED_BY` | `NONE` |
| `PRODUCTION_IMPACT` | La fiche d'achat et la fiche de vente de l'échoppe proposent une quantité (−, +, Max, touches + et −) bornée par le stock, l'or ou le sac, montrent le prix unitaire, le total et l'or après, puis demandent une seule confirmation. L'achat ou la vente de toute la quantité est atomique et passe par le propriétaire (`buyItems`, `sellItems`). L'échoppe filtre par type (armes, accessoires, consommables, matériaux) et groupe par type sous « Tout ». La forge filtre par type de résultat (armes, accessoires), sépare « Forgeable maintenant » de « Pas encore forgeable » et peut masquer ce qui n'est pas encore forgeable. Le réglage de jeu « mouvement réduit » coupe aussi les transitions du registre. Aucun objet, prix, recette ni champ de sauvegarde nouveau. |
| `CANONICAL_DOCS_UPDATED` | `NONE` : aucune règle de jeu ne change (prix par la réputation, vente à moitié prix du prix de base, stock partagé, OD-2026-11-05-C, OD-2026-11-05-D et OD-2026-11-07-H inchangés) ; l'état vivant sera mis à jour à l'intégration, une autre session travaillant en parallèle sur le combat. |
| `EVIDENCE` | Tests : `src/game/managementQuantity.test.ts` (6), `src/ui/shopFilters.test.ts` (5), `src/ui/ManagementView.test.ts` (5 nouveaux, 18 au total). `npm test` : 3175 réussis, 10 échecs déjà présents sur `dev` sans ce changement (fichiers ignorés `tmp/cinematics/…`, PNG `megapack-runtime` absents du clone, chemin Windows dans `cin4_media`). `npx tsc --noEmit`, `npm run build`, `npm run contracts:validate` et la porte des contrats passent. Navigateur : build de production, sauvegarde V6 amorcée au premier refuge, clavier seul, à 1366×768, 390×844 et 1366×768 avec le réglage de jeu « mouvement réduit » ; résultat `playtest-shop-2026-11-11/browser-result.json`, huit captures et le pilote `playtest-shop-2026-11-11/shop-qa.mjs`. Limite : pas de manette physique ; le chemin manette est couvert par un test qui passe chaque appui par `performGamepadAction`. |

## Le retour

`CURRENT FACT` L'opérateur, ses mots : « pouvoir bien optimiser le shop avec la possibilité d'acheter en multiple des items, par exemple aussi trier par type d'items achetables ou forgeables. »

Avant ce changement, chaque achat ou vente portait sur un seul exemplaire : dix potions demandaient dix fiches et dix confirmations. L'échoppe listait tout le stock à la suite, et la forge mêlait les dix-sept recettes, prêtes ou non.

## Achat et vente en quantité

`CURRENT FACT` Le propriétaire reste `management.ts`. Il gagne :

- `getBuyUnitPrice` : le prix réputation du jour, par exemplaire (`getShopPrice`, inchangé) ;
- `getSellUnitPrice` : la moitié du prix de base, comme avant ;
- `getMaxBuyQuantity` : le plus petit entre le stock et l'or divisé par le prix unitaire ;
- `getMaxSellQuantity` : ce que porte le sac, jamais ce qu'un héros porte ;
- `buyItems` et `sellItems` : la quantité entière ou rien. Le total est le prix unitaire arrondi multiplié par la quantité. À la réputation Renommé, trois potions coûtent 3 × 12 = 36 or, et non l'arrondi de 3 × 11,7. Une quantité nulle, négative, fractionnaire ou au-delà de la limite ne change rien.

`buyItem` et `sellItem` restent et valent une quantité de 1. Aucun champ n'est ajouté à l'état ni à la sauvegarde. La quantité choisie vit dans la fiche ouverte et disparaît avec elle.

Dans la fiche :

- un bloc « Quantité à acheter » ou « Quantité à vendre » apparaît dès que la limite dépasse 1. Toutes les catégories y ont droit : en pratique, armes et accessoires ont un stock de 1, donc seuls les consommables et matériaux le montrent ;
- « − », la valeur, « + » et « Max ×N » sont de vrais boutons d'au moins 44 px de haut ;
- la ligne de limite dit pourquoi : « Jusqu'à 7 : votre or (125) », « tout le stock » ou « tout ce que porte le sac » ;
- le résumé montre le prix unitaire, le total, l'or avant et après, le sac avant et après, et le stock avant et après pour un achat ;
- le bouton principal dit « Acheter ×3 · 51 or » ;
- la confirmation unique dit « Confirmer l'achat de 3 × Potion légère pour 51 or ? Votre or passera de 60 à 9. » ;
- le résultat dit « Acheté : 3 × Potion légère » ;
- après un achat de consommable, « En acheter encore ×N » repasse par la confirmation, à la même quantité ramenée dans la nouvelle limite ;
- « Annuler » dans la confirmation revient à la fiche sans perdre la quantité.

## Filtres et tri

`CURRENT FACT` `src/ui/shopFilters.ts` ne fait que masquer ou ordonner des lignes. Les listes viennent toujours des règles des propriétaires : `isUsefulToCompany` (aucune arme plus faible ni déjà portée, OD-2026-11-07-H), `getForgeRecipes` et `canCraftItem`.

À l'échoppe, en achat comme en vente :

- les boutons de filtre sont « Tout », « Armes », « Accessoires », « Consommables » et « Matériaux », chacun avec son nombre de lignes ;
- un type sans ligne est masqué, sauf s'il est le filtre actif ;
- ce sont des boutons à bascule (`aria-pressed`), nommés « Consommables · 8 articles » ;
- sous « Tout », les lignes sont groupées par type, armes d'abord, avec un intertitre ;
- les étiquettes T1, T2, T3, les prix par la réputation et la mention « Or insuffisant » restent ;
- l'achat et la vente ont chacun leur filtre. Les filtres repartent de « Tout » à chaque ouverture du registre.

À la forge :

- les filtres « Tout », « Armes » et « Accessoires » portent sur le type de résultat ;
- la bascule « Forgeable maintenant » affiche le nombre de recettes prêtes ;
- la liste se lit en deux groupes : « Forgeable maintenant » puis « Pas encore forgeable », ce dernier avec un intertitre gris ;
- la bascule cochée masque le second groupe. Si rien n'est prêt, un message invite à la décocher pour voir ce qui manque.

## Accessibilité

- Clavier : chaque filtre, chaque bouton de quantité et chaque étape de la fiche se prennent à Tab et Entrée. Le focus reste sur le filtre ou le bouton pressé après le rendu. Quand « + » ou « Max » atteint la limite et s'éteint, le focus passe au bouton d'achat ; quand « − » atteint 1, il passe à « + ». Les touches + et − du clavier changent aussi la quantité dans la fiche, et Échap recule d'une étape comme avant.
- Manette : aucun chemin propre. Chaque appui devient la touche du clavier (A pour Entrée, B pour Échap, croix pour les flèches), et un test le vérifie de bout en bout : filtre, ouverture de la fiche, + deux fois, confirmation, achat, retour.
- Lisibilité : à 390 px, les filtres passent sur deux lignes et la bascule de la forge prend toute la largeur. Aucun débordement horizontal à 1366 px ni à 390 px, mesuré par `getBoundingClientRect` sur chaque filtre, chaque bouton de quantité et chaque bouton du pied de fiche. Le texte des filtres fait 12 px, la valeur de quantité 20 px.
- Mouvement réduit : le registre porte `data-reduced-motion`, lu par l'aide partagée `prefersReducedMotion` à partir du réglage de jeu ou de celui du système. Sous ce réglage, les transitions du registre tombent à 0 s (mesuré : 0,15 s en temps normal, 0 s avec le réglage de jeu). Les nouveautés n'ajoutent aucun mouvement.

## Captures

Prises dans un build de production, au premier refuge du Lion, avec 125 or (réputation Méfiant), 3 minerais de fer et quatre potions dans le sac, tout au clavier.

- [`1366x768-1-shop-all.png`](playtest-shop-2026-11-11/1366x768-1-shop-all.png) : l'échoppe en achat. Filtres « Tout 20 · Armes 4 · Accessoires 6 · Consommables 8 · Matériaux 2 », puis l'intertitre « Armes 4 » et les armes T2 avec leurs étiquettes et « Or insuffisant ».
- [`390x844-2-shop-consumables.png`](playtest-shop-2026-11-11/390x844-2-shop-consumables.png) : à 390 px, le filtre « Consommables » pressé, avec son focus visible et les filtres sur deux lignes. Seuls les consommables sont listés.
- [`1366x768-3-fiche-quantity.png`](playtest-shop-2026-11-11/1366x768-3-fiche-quantity.png) : la fiche de la Potion légère après deux appuis sur « + ». Quantité 3, « Max ×7 », la limite « votre or (125) », prix unitaire 17, total 51, or 125 → 74, sac 4 → 7, stock 10 → 7, et le bouton « Acheter ×3 · 51 or ».
- [`390x844-3-fiche-quantity.png`](playtest-shop-2026-11-11/390x844-3-fiche-quantity.png) : la même fiche à 390 px. Les boutons tiennent sur une ligne et le pied de fiche reste collé en bas.
- [`1366x768-4-confirm.png`](playtest-shop-2026-11-11/1366x768-4-confirm.png) : la confirmation unique pour 4 potions (après la touche +), « pour 68 or ? Votre or passera de 125 à 57 », focus sur « Confirmer l'achat ».
- [`1366x768-6-sell-quantity.png`](playtest-shop-2026-11-11/1366x768-6-sell-quantity.png) : la vente des trois minerais après « Max ». « Jusqu'à 3 : tout ce que porte le sac », « Vendre ×3 · 6 or ».
- [`1366x768-7-forge-all.png`](playtest-shop-2026-11-11/1366x768-7-forge-all.png) : la forge, avec les filtres « Tout 17 · Armes 11 · Accessoires 6 », la bascule « Forgeable maintenant 2 » et le groupe « Forgeable maintenant 2 » (Ceinture de Vie et Anneau de Force). « Pas encore forgeable 15 » suit plus bas.
- [`390x844-8-forge-accessories-ready.png`](playtest-shop-2026-11-11/390x844-8-forge-accessories-ready.png) : à 390 px, le filtre « Accessoires » et la bascule cochée (focus visible). Seul le groupe des recettes prêtes reste.

Le résultat machine relève aussi, à chaque taille : or −68, potions +4, stock −4 après la confirmation, les mêmes clés de sauvegarde avant et après, et une sauvegarde identique tant que la quantité seule change. Les seules erreurs de console sont deux 404 sur `favicon.ico`, sans rapport.

## Comment vérifier en jeu

1. Lance une partie et va jusqu'à un refuge (le premier refuge du Lion par exemple) ; tous les refuges ouvrent la même échoppe.
2. Ouvre l'Échoppe. Sous le titre, presse « Consommables » : seuls les consommables restent. Reviens sur « Tout » : les lignes sont groupées par type.
3. Ouvre la Potion légère. Presse « + » ou la touche + : le total, l'or après, le sac et le stock suivent, et rien n'est encore acheté. « Max » s'arrête au plus petit entre ton or et le stock, et la ligne dit lequel.
4. Presse « Acheter ×N », puis « Confirmer l'achat » : une seule confirmation, l'or baisse du total exact affiché.
5. Passe sur « Vendre », ouvre un matériau dont tu as plusieurs exemplaires : même quantité, au prix de vente.
6. Passe sur « Forge » : les recettes prêtes viennent d'abord, sous « Forgeable maintenant ». Coche « Forgeable maintenant » pour masquer le reste, ou filtre « Armes » ou « Accessoires ».
7. À la manette : A sur un filtre, sur « + », sur « Acheter » puis sur « Confirmer » ; B recule d'une étape.
8. Avec « Mouvement réduit » activé dans les réglages du jeu, le registre s'affiche sans transition.

Pour rejouer la vérification navigateur : `npm run build`, puis `node docs/reports/playtest-shop-2026-11-11/shop-qa.mjs`. Dans une session cloud, ajoute `CHROMIUM_PATH=/opt/pw-browsers/chromium`. La sortie va dans `tmp/shop-qa/out/`, qui est ignoré.

## Limites et notes

- `UNDECIDED` La forge ne propose pas de quantité : le retour parle d'acheter en multiple, et chaque recette consomme une arme ou un accessoire porté. Ajouter une quantité à la forge serait un autre choix.
- `CURRENT FACT` Le pilote existant `tools/refuge-production-accessibility-qa.mjs` attend encore qu'Entrée sur une ligne achète directement. C'était vrai avant les fiches d'achat du 2026-11-07, et il était donc déjà en retard avant ce changement. Il n'a pas été relancé ni modifié ici.
- `CURRENT FACT` `docs/autonomy/AUTONOMOUS_WORK_STATE.*` n'est pas touché sur cette branche, comme demandé ; il sera mis à jour à l'intégration.

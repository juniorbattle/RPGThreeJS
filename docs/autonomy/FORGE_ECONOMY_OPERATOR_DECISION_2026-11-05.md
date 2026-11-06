# Or de départ et forge abordable — OD-2026-11-05-C

- **Date** : 2026-11-05 (America/Toronto).
- **Source** : demande de l'opérateur dans la session Claude du 2026-11-05.
  - Il veut s'assurer qu'on gagne assez d'or pour équiper un minimum les unités, sans viser l'équipement complet : l'enjeu entre s'équiper parfaitement et aider les nécessiteux doit rester, mais le joueur ne doit pas être handicapé, surtout au début ; « c'est un juste milieu essentiel ».
  - Après l'audit, il accepte de porter l'or de départ à 250, rappelle que les accessoires comptent aussi, et demande une forge qui propose des armes et des accessoires plus abordables, puisqu'elle dépend déjà des ingrédients.
- **Statut** : ACTIVE ; livré sur `dev` avant le playtest PC. OD-2026-10-16-A réservait tout rééquilibrage de l'économie à l'opérateur : c'est lui qui le demande ici. Le contrat `AUTHORING_AND_QA.md` exige qu'un ajustement soit consigné et relu ; ce document le consigne.

## Constats de l'audit

- L'échoppe n'existe qu'aux deux refuges ; après le second, il n'y a plus d'achat possible.
- Le premier sort de chaque héros (2 PA) est offert. Une arme T1 ne débloque donc aucune compétence : elle apporte des dégâts et des PV. Le deuxième sort (3 PA) demande une arme T2.
- Seuls Alistair (Lame du Lion) et Kestrel (Arc du Vent, Arc d'Éclipse) peuvent obtenir une arme T2, par la forge. Marian, Elara, Cedric et Garen n'ont aucune arme T2 en vente ni en recette : leur deuxième sort reste hors d'atteinte dans la démo. **Résolu par OD-2026-11-05-D** ([Armes T2 et échoppe cohérente](FORGE_T2_SHOP_COHERENCE_OPERATOR_DECISION_2026-11-05.md)).
- L'échoppe n'a qu'un exemplaire de chaque accessoire.
- Avant ce changement, chaque recette de forge coûtait plus que l'objet qu'elle crée.
- La forge ne voyait que les objets du sac : une arme ou un accessoire porté comptait « 0/1 ». Exemple : Alistair qui porte son espadon d'acier ne pouvait plus forger la Lame du Lion.

## Décision

1. **Or de départ** : 250 au lieu de 150, pour une nouvelle chronique. Les sauvegardes existantes gardent leur or.
2. **Recettes d'entrée**, moins chères que l'échoppe, même après revente de l'arme novice :

   | Recette | Ingrédients | Or de base | Prix à l'échoppe |
   | --- | --- | --- | --- |
   | Espadon d'acier | Espadon novice, 2 minerais | 90 | 170 |
   | Crosse sacrée | Crosse novice, 2 minerais | 120 | 220 |
   | Grimoire mystique | Grimoire novice, 2 minerais | 145 | 260 |
   | Arc long | Arc novice, 2 minerais | 120 | 230 |
   | Dague d'acier | Dague novice, 2 minerais | 95 | 170 |
   | Ceinture de Vie | 2 minerais | 40 | 80 |
   | Anneau de Force | 3 minerais | 50 | 100 |
   | Pendentif magique | 3 minerais | 60 | 120 |
   | Bottes d'agilité | 3 minerais | 75 | 150 |

   Le minerai de fer vient des combats, de quelques choix et des 8 minerais de l'échoppe ; c'est lui qui limite la forge. Les gemmes rouges restent réservées aux améliorations de compétences et à l'Arc d'Éclipse.
3. **Recettes d'amélioration** : leur part d'or baisse.
   - Lame du Lion, Arc du Vent et Sceau du Sage : 70.
   - Boucle de Garde : 50.
   - Les quatre variantes T1 à effet : 45.
   - Les trois armes T2 à gemme : 90.
4. **La forge prend d'abord le sac, puis l'équipement porté.**
   - Une arme portée ne compte que si son porteur peut manier l'arme forgée. Celle-ci la remplace sur le héros, qui n'est donc jamais désarmé.
   - Un accessoire porté quitte son emplacement ; un accessoire forgé prend le premier emplacement libéré.
5. **Prix selon la réputation.** L'or de la forge suit le même multiplicateur que l'échoppe : aider rend la forge moins chère, la cupidité la renchérit.
   - L'opérateur ne l'avait pas demandé ; c'est un choix de Claude, pour garder l'équilibre du dilemme. Il se retire en une ligne si l'opérateur le refuse.
6. La forge ne liste plus que les accessoires et les armes qu'un membre de la compagnie peut manier.

## Effet mesuré

Le calcul repose sur les vrais chiffres du jeu (`tmp/economy/calc-forge.ts`, hors suivi). Pour chaque héros, l'équipement minimal visé est une arme T1 et un accessoire.

| Façon de jouer | Avant, refuge 1 | Avant, refuge 2 | Après, refuge 1 | Après, refuge 2 |
| --- | --- | --- | --- | --- |
| Aide tout le monde, route principale | 0/5 armes | 2/5 armes, 1 accessoire | 1/5 arme, 1 accessoire | 3/5 armes, 2 accessoires |
| Aide tout le monde, lieux facultatifs | 1/5, 1 accessoire | 4/5, 2 accessoires | 3/5 | 5/5, 5 accessoires, 130 or de reste |
| Équilibré | 2/5, 1 accessoire | 5/5, 3 accessoires | 4/5 | 5/5, 5 accessoires, environ 390 or de reste |
| Or d'abord | 1/4, 1 accessoire | 4/4, 1 accessoire | 3/4, 1 accessoire | 4/4, 4 accessoires, environ 365 or (prix ×1,35) |

- L'équipement parfait reste un enjeu : armes T2, deux accessoires par héros, Couronne de Sagesse, Sceau du Sage, améliorations de compétences.
- Hypothèses du calcul :
  - tous les combats sont gagnés ;
  - deux blessés se reposent à chaque refuge ;
  - le joueur forge ou achète au moins cher, le minerai manquant étant acheté à l'échoppe ;
  - les potions ne sont pas comptées.
- À surveiller pendant le playtest : un joueur équilibré a déjà quatre armes T1 au premier refuge.

## Livraison

- `src/game/store.ts` : 250 or au départ.
- `src/game/catalog.ts` : neuf recettes d'entrée et parts d'or abaissées.
- `src/game/management.ts`, propriétaire de la vérité :
  - `canCraftItem` et `craftItem` gèrent l'équipement porté et le prix selon la réputation ;
  - nouvelles aides `getForgeIngredients`, `getCraftGoldCost` et `getForgeRecipes`.
- `src/ui/ManagementView.ts`, présentation seulement :
  - prix réel ;
  - ingrédients portés marqués « · porté » ;
  - liste limitée à la compagnie ;
  - nouvelle phrase d'introduction de la forge.
- Aucun changement de schéma V6, d'identifiant durable ou de contrat. Jeu de contrats 1.14.0, baseline `85576d6d9e3af6c8ddc953a1740ecf167592f4a4`.

## Limites

- Garen rejoint la compagnie après le dernier refuge : il n'a ni recette ni achat possible et garde sa lance novice.
- Le pilote de QA `tools/refuge-production-accessibility-qa.mjs`, hors suite, calcule son oracle avec `craftItem` et suit donc la nouvelle règle. Il n'a pas été relancé.

## Vérifications

- Neuf tests de forge dans `src/game/management.test.ts` :
  - 250 or au départ ;
  - recettes d'entrée moins chères que l'échoppe ;
  - amélioration de l'arme portée sur place ;
  - sac avant équipement ;
  - Lame du Lion forgée depuis l'équipement d'Alistair ;
  - accessoire forgé dans l'emplacement libéré ;
  - refus d'une arme que le porteur ne peut pas manier ;
  - prix selon la réputation ;
  - liste limitée à la compagnie.
- Attentes d'or ajustées dans les tests d'expédition et de forge existants.
- Contrôles passés :
  - suite complète : 2 898 tests vitest et 26 tests node ;
  - types et build ;
  - validateur de contrats et barrière des contrats verrouillés.
- Parcours réel sur un serveur de développement à part (port 5181), à 1366 × 768 et 390 × 844, sans erreur de page.
  - Au premier refuge, une compagnie généreuse avec 180 or achète un minerai, puis trempe l'espadon novice d'Alistair.
  - La sauvegarde automatique montre Alistair avec l'espadon d'acier, 85 or, plus de minerai ni d'espadon novice.

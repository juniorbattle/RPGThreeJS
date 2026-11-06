# Une arme T2 pour chaque héros et une échoppe cohérente — OD-2026-11-05-D

- **Date** : 2026-11-05 (America/Toronto).
- **Source** : réponse de l'opérateur dans la session Claude du 2026-11-05, au point ouvert d'OD-2026-11-05-C.
  - Chaque personnage de la démo, recrues comprises, doit pouvoir obtenir une arme T2.
  - L'échoppe doit rester cohérente dans les objets qu'elle propose et dans ses prix.
  - Les combats de POI facultatifs doivent être un enjeu : on peut y gagner de l'argent, au risque de blesser ses héros.
  - Il accepte la forge comme voie, avec les subtilités signalées (Garen arrive après le dernier refuge).
- **Statut** : ACTIVE ; livré sur `dev` avant le playtest PC. Complète OD-2026-11-05-C, dont il résout le point ouvert sur les armes T2.

## Décision

1. **Une recette T2 par héros.** Marian, Elara, Cedric et Garen reçoivent la leur : arme T1 + 1 gemme rouge + 60 or de base.

   | Héros | Recette | Résultat |
   | --- | --- | --- |
   | Marian | Crosse sacrée, gemme rouge | Crosse des Miracles |
   | Elara | Grimoire mystique, gemme rouge | Grimoire des Abysses |
   | Cedric | Dague d'acier, gemme rouge | Dague Crochue |
   | Garen | Lance d'acier, gemme rouge | Lance du Griffon |

   - Alistair (Lame du Lion) et Kestrel (Arc du Vent, Arc d'Éclipse) gardent leurs recettes.
   - Une arme T2 débloque le deuxième sort du héros, à 3 PA.
   - La gemme rouge sert aussi à améliorer les sorts : le choix reste coûteux.
2. **Garen apporte sa propre Lance du Griffon.**
   - Il rejoint la compagnie après le dernier refuge, et le contrat verrouillé `CAMPAIGN_AND_STATE.md` interdit de faire du refuge final une halte avec échoppe. Il n'a donc jamais accès à une forge.
   - Sa lance « suivra votre bannière », dit-il : il arrive avec elle. Aucun texte ni aucun choix ne change.
   - Cedric, recruté avant le premier refuge, reste un novice qu'on équipe aux refuges.
3. **L'échoppe ne vend que pour la démo.**
   - Une nouvelle chronique ne stocke plus que les armes T1 des six héros de la démo.
   - Les armes des autres classes quittent le stock : masse, faux, rapière, sceptre, shuriken et canon.
   - La liste d'achat montre seulement les armes qu'un membre de la compagnie sait manier, y compris sur une ancienne sauvegarde. La liste de vente montre toujours tout ce qu'on porte.
   - Les armes T2 ne se vendent pas : elles sortent de la forge.
4. **Des prix cohérents.**
   - Pour chaque héros, l'arme novice vaut moins que l'arme T1, qui vaut moins que l'arme T2. Une arme T2 vaut environ son arme T1 plus 120.
   - Une recette ne coûte jamais plus que ce que vaut son résultat, en comptant ce qu'elle consomme. Une arme novice compte pour sa valeur de revente, puisqu'on ne peut pas l'acheter.
   - Ajustements de prix :
     - Grimoire des Abysses : 340 → 380.
     - Espadon du Lion : 320 → 340.
     - Arc du Vent : 340 → 430.
     - Sceau du Sage : 310 → 380.
   - Ajustements de la part d'or des recettes :
     - Lame du Lion : 70 → 60.
     - Arc du Vent : 70 → 40.
     - Sceau du Sage : 70 → 50.
   - Les prix des accessoires restent tels quels. La dextérité des Bottes joue sur l'ordre des tours, le critique, la précision et l'esquive, ce qui justifie leur prix plus élevé.

## Effet mesuré

Le calcul repose sur les vrais chiffres du jeu (`tmp/economy/calc-t2.ts`, hors suivi). À chaque refuge, le joueur paie d'abord le repos de deux blessés. Il équipe ensuite chaque héros d'une arme T1 et d'un accessoire, puis achète des armes T2 tant que l'or et les gemmes suivent.

| Façon de jouer | Refuge 1 | Refuge 2 |
| --- | --- | --- |
| Aide tout le monde, route principale | 1 arme T1, 1 accessoire | 3/5 armes T1, aucune T2, 2 accessoires |
| Aide tout le monde, lieux facultatifs | 3/5 armes T1 | 5/5 armes T1, 2/5 armes T2, 5 accessoires |
| Équilibré : combats d'épreuve et lieux facultatifs | 4/5 armes T1 | 5/5 armes T1, 5/5 armes T2, 5 accessoires |
| Or d'abord | 3/4 armes T1, 1 accessoire | 4/4 armes T1, 2/4 armes T2, 4 accessoires (prix ×1,35) |

- **Les combats facultatifs sont l'enjeu voulu.**
  - Un combat de POI rapporte de 80 à 125 or, avec 1 ou 2 minerais et 1 ou 2 gemmes. Une élite rapporte 120 ou 170 or.
  - C'est à peu près le prix d'une arme T2 (60 or et une gemme). Le repos coûte 15 or par héros blessé.
  - Le joueur qui prend ces risques équipe sa compagnie en T2 au second refuge. Celui qui les évite garde des armes T1.
- **L'équipement parfait reste un enjeu** : deux accessoires par héros, Couronne de Sagesse, Sceau du Sage, améliorations de sorts.

## Point ouvert pour l'opérateur

- Après le second refuge, rien ne se dépense : pas d'échoppe, pas de forge, et les améliorations de sorts ne s'ouvrent qu'aux refuges.
- L'or, le minerai et les gemmes de la région III, et donc de ses combats facultatifs, ne servent à rien.
- Ouvrir l'échoppe au refuge final demande un amendement de contrat (`CAMPAIGN_AND_STATE.md`, lignes 21 et 31). L'opérateur décide.

## Livraison

- `src/game/catalog.ts` :
  - quatre recettes T2 ;
  - prix ajustés ;
  - `RECRUIT_WEAPONS` et `createRecruitInstance` : l'arme qu'apporte une recrue.
- `src/game/GameApp.ts` : l'effet de recrutement passe par `createRecruitInstance`.
- `src/game/store.ts` : stock de départ limité aux armes T1 de la démo.
- `src/game/management.ts` : `isUsefulToCompany`, utilisé par la forge et par la liste d'achat.
- `src/ui/ManagementView.ts` : liste d'achat filtrée, présentation seulement.
- Aucun changement de schéma V6, d'identifiant durable, de texte ou de contrat. Jeu de contrats 1.14.0, baseline `85576d6d9e3af6c8ddc953a1740ecf167592f4a4`.
- Effet de bord attendu : les sorts à 3 PA de Marian (Purification), d'Elara (Téléportation), de Cedric (Roulade) et de Garen deviennent jouables dans la démo.
  - Chacun a sa recette d'effet procédural dans `src/combat/fx/fxSkills.ts`.
  - Le laboratoire VFX compte trois manques de plus sur les anciennes planches, que le combat ne joue plus.

## Vérifications

- Tests ajoutés dans `src/game/management.test.ts` :
  - chaque héros de la démo a une arme T2 forgeable ;
  - Garen arrive avec la Lance du Griffon et son sort à 3 PA ;
  - aucune recette ne coûte plus que son résultat ;
  - prix ordonnés novice, T1, T2 ;
  - échoppe limitée aux armes de la compagnie ;
  - stock de départ limité aux armes T1 de la démo.
- Nouveau `src/game/recruitLoadout.test.ts` : les vrais choix de recrutement, appliqués par `GameApp`, donnent la Lance du Griffon à Garen et la dague novice à Cedric.
- Tests du laboratoire VFX mis à jour pour les nouvelles actions de la démo.
- Contrôles passés :
  - suite complète : 2 902 tests vitest et 26 tests node, puis les deux tests de recrutement ;
  - types et build ;
  - validateur de contrats et barrière des contrats verrouillés.
- Parcours réel au second refuge sur un serveur de développement à part (port 5181), à 1366 × 768, sans erreur de page.
  - Situation : une compagnie avec Cedric, une ancienne sauvegarde dont le stock contient encore les armes des autres classes, et Marian portant la Crosse sacrée.
  - L'échoppe n'offre que les cinq armes T1 de la compagnie.
  - La forge montre les six recettes T2 au prix « Respecté ».
  - La Crosse des Miracles se forge sur Marian : 54 or et une gemme.

# Paquet du Lot 0 de l’après-démo — OD-2026-11-08-A

**APPROVED DECISION.** Le 2026-11-08, l’opérateur a rempli la [fiche du Lot 0](https://claude.ai/artifact/GvfWvfHZZfiPb61vDx5rqX). Il a retenu les sept recommandations, sans note. Le paquet est décrit dans le [rapport du Lot 0](../reports/post-demo-lot-0-foundations-2026-11-08.md). La décision applique [OD-2026-11-07-I](POST_DEMO_DIRECTION_OPERATOR_DECISION_2026-11-07.md) dans le cadre du jeu de contrats 1.20.0. Elle ne modifie aucun contrat.

## Choix de l’opérateur

| Point | Sujet | Choix |
| --- | --- | --- |
| 1 | Montants de réputation du Lion dans l’après-démo | Règle proposée : chaque montant est multiplié par 0,3 et arrondi, garde son signe et vaut au moins 1 ; une victoire ordinaire (combat de rang normal) ne donne plus de réputation |
| 2 | Seuils du Lion | Proposés : recrue Cedric 27, recrue Garen 24, escorte des témoins 35, crédibilité devant Alaric 33 et 42 |
| 3 | « Renommé vers le troisième plateau » | Le troisième plateau est le Dragon ; le Lion compte comme premier plateau |
| 4 | Budgets de réputation | Proposés. Le Lion a été mesuré à 32 pour un parcours parfait et 27 pour un honneur constant. Cibles : Ours 16 et 13, Dragon 12 et 10, Scorpion 6 et 4, acte final 4 et 3 |
| 5 | Relations de clan à la fin du Lion | Honneur : le Lion allié, le Serpent ennemi. Force : le Lion neutre, le Serpent ennemi |
| 6 | Démo figée | Une étiquette Git sur `dev`, posée avant la première intégration d’un plateau de l’après-démo |
| 7 | Format de la carte des conséquences | Approuvé ([format](../content/consequence-map-format.md)) |

## Conséquences

- **Étalonnage.** Il s’applique au Lion sur `post-demo`, qui devient le premier plateau du jeu complet.
  - Il change des montants et des seuils seulement. Aucun choix, aucune issue, aucune route ni aucune réplique ne change.
  - Les valeurs déjà sauvegardées ne sont jamais réécrites.
  - Le contenu écrit garde les valeurs de la démo. L’étalonnage est appliqué au moment de jouer, et le test des bornes continue de mesurer la démo à part.
- **Démo figée.** Avant que la session intègre un plateau à `dev`, sur ordre de l’opérateur, elle pose une étiquette sur le dernier commit de la démo. La démo figée garde ses valeurs actuelles.
- **Relations.** Les effets de relation des issues du Lion passent de « proposé » à « approuvé » dans la carte des conséquences du Lion. RunSystem les appliquera à la clôture du Lion.
- **Lot 1.** La session ouvre le Lot 1, l’Ours. La carte des conséquences de l’Ours s’écrit d’abord, avant toute réplique.

## Limites

- Aucun contrat ne change ; la baseline immuable reste `6c965169c2dc153cafd5a8609d914cf8de723ff3`.
- La démo sur `dev` ne change pas.

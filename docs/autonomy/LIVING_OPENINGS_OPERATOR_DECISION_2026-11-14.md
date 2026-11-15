# Cinématiques dès la première seconde — OD-2026-11-14-A

## La demande

Le 2026-11-14, l'opérateur écrit, mot à mot : « Concernant nos cinematics runtimes... sommes nous correct? certaines provenant de la demo doient etre optimiser... par exemple des passage vide ou rien ne se passe au debut avant... on doit s'assurer que nos cinematics soient dynamique et nous montrent des choses interessant des le debut... certaines respectent cette structure ».

Pendant la préparation de la fiche, il ajoute, à propos des plans « salle vide » et « ciel » : « ok mais on ne doit pas etendre trop de temps sur ces parties car on a l'impression que rien ne se passe ».

## La mesure

Un script a mesuré les 21 cinématiques animées par le code : l'ouverture de 55 s (OD-2026-11-02-A), les 7 tableaux vivants de la démo (sets 1.13.0 et 1.14.0) et les 13 de l'après-démo (set 1.20.0). Le script avance les vrais scripts et le vrai lecteur sur une horloge fixe, relève chaque figure là où le lecteur la dessine (au moins 30 px de haut à l'écran) et mesure la vitesse de la caméra en pixels par seconde à 1366 × 768. Un événement est une figure qui entre ou bouge, une touche d'atmosphère (vent, lumière) ou une caméra qui se voit bouger (15 px/s au moins). Un creux est un passage de plus de 2 s sans rien de nouveau.

- L'ouverture et l'arrivée à Bois-Clair accrochent dès la première image, sans creux. Elles servent de modèle.
- 16 des 20 tableaux vivants ouvraient sur un plan sans figure de 10 à 14 s, où seule la caméra bougeait, visible après 0,5 à 2,5 s.
- Plusieurs plans restaient ensuite immobiles de 9 à 16 s une fois la compagnie en place.

Tableaux complets, avant et après : [le rapport](../reports/living-openings-2026-11-14.md).

## La fiche

La fiche d'arbitrages a été publiée en page privée : [Cinématiques dès la première seconde](https://claude.ai/artifact/Cx8sRSCJ4M1fD3hhSodw33). Elle comptait 20 cartes avec, pour chacune, des bandes d'images avant/après à t = 0,25, 0,5, 1, 2 et 4 s. L'opérateur l'a remplie et a répondu « Fiche remplie ». Aucune note n'accompagne les choix.

| Carte | Cinématique | Choix de l'opérateur, mot à mot |
| --- | --- | --- |
| R1 | La règle | « Adopter la règle » |
| D0 | L'ouverture de 55 s | « Tel quel (55 s), c’est le modèle » |
| D1 | L'arrivée à Bois-Clair | « Recommandé : village resserré (23 → 20 s) » |
| D2 | Bois-Clair sauvé | « Recommandé : début vif + creux resserré (20 → 12 s) » |
| D3 | Bois-Clair sacrifié | « Recommandé : début vif + creux resserré (20 → 11 s) » |
| D4 | Le jugement d'Alaric | « Recommandé : début vif + creux resserré (28 → 16 s) » |
| D5 | L'audience d'Alaric | « Recommandé : début vif + creux resserré (26 → 17 s) » |
| D6 | La fin de la poursuite Serpent | « Recommandé : début vif + creux resserré (32 → 19 s) » |
| D7 | La fin de l'épreuve du Lion | « Recommandé : début vif + creux resserré (30 → 18 s) » |
| A1 | L'arrivée chez Borin | « Recommandé : début vif + creux resserré (26 → 17 s) » |
| A2 | L'arrivée chez Kaelen | « Recommandé : début vif + creux resserré (26 → 17 s) » |
| A3 | L'arrivée chez le Grand Inquisiteur | « Recommandé : début vif + creux resserré (26 → 17 s) » |
| I1 | L'Ours, par l'honneur | « Recommandé : début vif + creux resserré (28 → 17 s) » |
| I2 | L'Ours, par la force | « Recommandé : début vif + creux resserré (28 → 17 s) » |
| I3 | Le Dragon, par l'honneur | « Recommandé : début vif + creux resserré (28 → 17 s) » |
| I4 | Le Dragon, par la force | « Recommandé : début vif + creux resserré (28 → 17 s) » |
| I5 | Le Scorpion, par l'honneur | « Recommandé : début vif + creux resserré (28 → 17 s) » |
| I6 | Le Scorpion, par la force | « Recommandé : début vif + creux resserré (28 → 17 s) » |
| F1 | La trahison | « Recommandé : début vif + creux resserré (30 → 18 s) » |
| F2 | Avant les trois épilogues | « Recommandé : début vif + creux resserré (24 → 16 s) » |

## Ce qui est décidé

1. **La règle (R1).** Dans chaque plan d'une cinématique, présente ou future, un premier événement vient avant 0,5 s : une figure qui entre ou bouge, une touche d'atmosphère, ou une caméra qui se voit bouger. Le rideau noir partagé se lève entre 0,05 et 0,55 s, donc l'événement est déjà en cours quand l'image paraît. Aucun passage ne dure plus de 4 s sans rien de nouveau.
2. **L'ouverture (D0).** Elle reste telle quelle (55 s, OD-2026-11-02-A).
3. **Les 19 autres cinématiques.** Elles prennent la version recommandée :
   - **Plans sans figure raccourcis.** Les plans de salle vide et de paysage passent de 10 à 14 s à 5 ou 6 s, sur le même trajet de caméra. La caméra se voit donc bouger dès que le rideau se lève.
   - **Arrivées.** À l'audience d'Alaric et aux trois arrivées des plateaux, le chef attend déjà devant son siège dans le premier plan, avec ses gardes au loin. La salle n'est plus vide.
   - **Vent d'ouverture.** Au premier plan des fins de route et de quatre issues de plateau, le vent est déjà dans les étoffes peintes à la première image, puis il se calme en 2,5 s.
   - **Entrées avancées.** La compagnie, les chefs et les figurants paraissent dès la levée du rideau, au lieu de 0,4 à 2,2 s.
   - **Fins immobiles raccourcies.** Les queues immobiles des plans de la compagnie sont raccourcies. Sur la terrasse de l'épreuve et dans la salle du jugement, la caméra recule un peu plus (jusqu'au zoom 1,0), pour que la fin bouge encore.
   - **Trahison.** Le vent se lève à 5 s au lieu de 7 s, toujours avant que Maelor s'avance.

## Cadre

- **Contrats.** Aucun contrat n'est touché. Les tableaux vivants restent dans les sets 1.13.0, 1.14.0 et 1.20.0. Toutes les durées baissent et restent sous les plafonds : 30 s, et 40 s pour les fins de route, la trahison et les épilogues.
- **Contenu.** Aucune image, aucun texte, aucun personnage ni aucun fait nouveau. Les figures restent celles des tables de moments approuvées : le chef qui attendait au plan 2 attend déjà au plan 1. Le vent est une touche d'atmosphère permise par le médium.
- **Vérité du jeu.** La présentation seule change. Aucun champ de sauvegarde, aucune vérité de jeu.
- **Mouvement réduit.** Il garde la caméra fixe et fait paraître les figures en fondu. Le vent reste animé, comme le contrat le permet.
- **Rideau.** Le rideau noir partagé reste à chaque transition.
- **Mises en scène antérieures.** Cette décision remplace, pour leurs durées et le plan 1 des arrivées, les plans décrits dans [OD-2026-11-04-B](LIVING_TABLEAUX_ENDINGS_OPERATOR_DECISION_2026-11-04.md) (« La salle vide », plans de 10, 12 et 16 s) et dans les tables du [2026-11-13](PLATEAU_MOMENTS_OPERATOR_DECISION_2026-11-13.md). Leurs faits sont inchangés.

# Bois-Clair sacrifié v2 — partition et fiches avant génération

Préparation UTC 2026-10-23T04:28Z, run `codex-pose-pilot-20261023T0425Z`, branche dev, source `734bea704b6c8ad449bf5f5f71d554058c22beff`. Set1.9.0, baseline32c8439f6dea1d09f428c5c081392ab0c700e356. Autorités OD-2026-10-21-A/B et OD-2026-10-23-A/B. Candidat offline seulement ; aucune acceptation artistique ou runtime.

## Faits et frontière

`src/cinematics/Cin6aPresentation.ts:132` sélectionne cette issue seulement après victoire village_raid avec missionGreed=true. `src/game/GameApp.ts:1425` applique progression/récompenses/résolution avant ce montage puis ouvre le dialogue. `src/game/content.ts:1045` : coffres déjà possédés, Serpents dispersés, villageois intimidés. Laisser des provisions ou partir avec tout demeure un choix FUTUR. Le repli et la protection sont des interprétations visuelles autorisées, jamais preuve d'un remords canonique de Maelor ou d'un refus de choix de la Villageoise. Aucun départ, don, transfert, nouvelle victime, témoin, refus verbal, blessure ou gain.

## Analyse des références effectivement inspectées

Masters `public/assets/characters/pixel/masters/maelor.png` et `villageoise.png` : Maelor encapuchonné pourpre/or, visage voilé, livre fermé anatomique gauche ; main droite peut se replier sur son propre avant-bras mais n'offre rien et ne touche pas la Villageoise. Villageoise encapuchonnée bleue, visage couvert ivoire, tablier crème, jupe brune bord rouge, panier anse anatomique gauche et bord/main droite, sacoche opposée. Aucun miroir ni équipement ajouté.

Plaque `public/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/bois-clair-tableau-aftermath-sacrificed.png` : pavés mouillés, place détruite, palissade éventrée au centre gauche, charrette à droite, clocher arrière droit, fumée et lumière basse derrière les collines. Pas de restauration ou changement d'heure. Le lieu est une place ouverte, pas un face-à-face dans un intérieur.

V1 plans01/03/05 inspectés : décor et identités lisibles mais silhouettes essentiellement debout, bras et appuis proches ; v1 ne démontre pas la nouvelle méthode. Plan01 seul est réutilisable comme état INITIAL neutre : il n'a pas à montrer la bascule future. Aucun autre réemploi annoncé avant inspection. V1, raw, lecteurs, preuves et statuts restent intacts.

## Partition corporelle et géographie communes

Deux acteurs maximum. Maelor reste côté écran gauche, Villageoise à droite. Caméra toujours du même côté de leur axe. Aucun déplacement des pieds : positions fixées par01, pivot/poids et contraction du corps possibles sur place. La distance physique reste stable ; la séparation finale est émotionnelle, sans reculer artificiellement les acteurs. Pas de mouvement de caméra dans le lecteur.

Maelor : A debout, livre gauche au flanc, attention droite ; B centre de gravité abaissé par genoux souples, buste nettement replié, épaules rentrées, livre gauche pressé obliquement contre le sternum, droite retenue sur son propre avant-bras ; C conserve cette retenue en regardant la Villageoise, jamais suppliant ou repentant déclaré. Villageoise : A debout panier bas/mi-ventre ; B poids sur l'appui extérieur, buste reculé et torsion de protection, coudes fermés, panier remonté devant le torse, tête encore gauche ; C même ancrage, haut du corps franchement tourné vers écran droit, tête à droite/basse, panier maintenu comme barrière. Pas de marche, geste de refus de choix ou réconciliation.

## Fiches de plans

| Plan | Fonction et source | Acteurs / poseclé | Différence visible et raccord suivant | Géographie / cadrage | Émotion / objets / invariants | Durée / transition d'entrée |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | Installation : dégâts et intimidation déjà résolus, avant content:1045. Réemploi exact v1/shot-01.png. | Deux, état A. | Distance, corps encore verticaux et panier bas permettent de lire le repli de02. | Large entier, Maelor gauche, femme droite, appuis fixes. | Attention retenue, livre gauche fermé, panier gauche/rim droite ; deux visages couverts. | 4s : laisser lire le lieu et les appuis ; départ sans transition. |
| 02 | Tension : retenue corporelle de Maelor, interprétation sans remords canonique. | Maelor dominant, femme conservée à droite comme repère ; Maelor B, femme A. | Buste/genoux/coudes/livre contrastent avec01 ; femme encore verticale rend03 nécessaire. | Plan américain deux acteurs, même côté, aucun déplacement. | Maelor contient sa propre posture ; livre gauche contre sternum, droite sur son propre avant-bras, aucune offre. | 3s, coupe franche : changement de point de vue et de pose, éviter double silhouette. |
| 03 | Réaction protectrice de la Villageoise, vulnérabilité compatible avec intimidation écrite. | Femme B nettement lisible, Maelor B conservé au bord gauche. | Panier du ventre au torse, épaules/coudes fermés et buste en retrait ; sa tête regarde encore gauche, préparant04. | Moyen depuis même côté, accent sur femme sans inverser leur gauche/droite ; appuis hors champ mais non déplacés. | Protection/défiance sans nouvelle agression ; même panier/linge/anse gauche, bord droite, même livre. | 2.5s, coupe : réaction immédiate lisible, pas de fondu entre bras éloignés. |
| 04 | Bascule relationnelle : évitement du rapport visuel, sans refus d'un choix futur. | Femme C, Maelor B maintenu côté gauche. | Haut du corps et tête tournent franchement à droite, panier reste élevé ; différence doit être visible sans texte. | Moyen deux acteurs avec femme dominante, même axe et espace vide entre eux. | Visages couverts ; pas de parole, départ ou bras d'interdiction. Livre et panier restent chez leur propriétaire. | 3.5s, coupe : la rupture d'attention porte le plan ; aucune interpolation corporelle. |
| 05 | Conséquence et raccord avant village_raid_aftermath:1. | Deux, Maelor B et femme C conservés. | Retour large révèle les mêmes appuis et la séparation, sans nouvelle pose nécessaire : fonction forte de conséquence spatiale. | Reprendre exactement le point de vue/échelle/positions de01 et son décor ; buste modifié sur place seulement. | Aucun rapprochement, départ, transfert ou réconciliation. Maelor peut parler ensuite sans que ce plan joue sa réplique. | 5s, coupe motivée vers large puis tenue finale ; le fondu provoquerait un changement d'échelle doublé. |

18secondes proposées au total, durées variées4/3/2.5/3.5/5. Quatre coupes motivées, aucun fondu nécessaire dans cette confrontation ; tenue finale5s. L'amendement autorise plusieurs grammaires, n'impose pas d'utiliser chaque transition. Pas de recadrage animé : aucune information ne l'exige, réduction des mouvements préserve toutes les images fixes.

## Rejet et revue

Inspecter chaque image native, puis chaque paire en comparant les corps à taille comparable, puis ancien/nouveau montage à vitesse normale sans titre ou description. Rejeter si repli02 invisible, panier03 pas franchement protecteur, détournement04 absent, appuis/échelle05 incohérents, objet/main changé, anatomie douteuse ou canon anticipé. Le prompt ne prouve rien. Maximum10initiales/2corrections ciblées dans ce run ; après deux passages sans progrès, blocker précis et aucun retry identique. Seules les images insuffisantes sont corrigées.

Réutiliser le lecteur/driver compatible ; versionner l'adaptation minimale offline pour les coupes et la vue sans légendes. Conserver chargement/ordre/pause horloge+opacité/reprise/clavier/fin/OSreduce/contain44px/console/fallback. Preuve propre v2 obligatoire ; v1 ne l'accepte pas. ART_ACCEPTED demande verdict explicite opérateur images+montage ; RUNTIME_ACCEPTED reste une future tâche dédiée. Ne pas généraliser aux six autres avant ce verdict.

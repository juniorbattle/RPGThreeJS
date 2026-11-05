# Prise en charge de la manette — OD-2026-11-05-A

- **Date** : 2026-11-05 (America/Toronto).
- **Source** : demande de l'opérateur dans la session Claude du 2026-11-05. Il joue d'habitude sur PC avec une manette et demande si le jeu prend en charge les manettes de console (PlayStation, Xbox). Le jeu n'en lisait aucune ; à la question « Ajouter la prise en charge de la manette ? », il répond « Oui, avant le test ».
- **Statut** : ACTIVE ; livrée sur `dev` avant le playtest PC.

## Décision

1. Le jeu se joue à la manette avant le playtest PC, avec les manettes Xbox et PlayStation que Chrome et Edge reconnaissent (correspondance standard, filaire ou Bluetooth).
2. La manette est une présentation : chaque appui passe par le chemin du clavier, déjà exigé par les contrats. Elle ne crée ni ne modifie aucune vérité de jeu, aucune sauvegarde ni aucune règle.
3. Aucun contrat ne change. Le jeu de contrats reste 1.14.0, baseline `85576d6d9e3af6c8ddc953a1740ecf167592f4a4`.

## Commandes

| Bouton | Effet |
| --- | --- |
| Croix directionnelle ou stick gauche | Se déplacer d'une commande à l'autre ; sur la grille de combat, déplacer le curseur ; répétition si on garde appuyé |
| A ou Croix | Valider (la touche Entrée) |
| B ou Rond | Revenir ou annuler (la touche Échap) |
| LB/RB ou L1/R1 | Commande précédente ou suivante (Tabulation) |
| Start ou Options | Atteindre le menu du haut de la carte |

Un avis s'affiche quelques secondes quand une manette se connecte ou se déconnecte. L'aide du combat cite aussi la manette.

## Livraison

- `src/ui/GamepadNavigator.ts` lit la manette à chaque image, dans la page principale et dans le cadre du combat. Seul le cadre qui a le focus agit, donc un appui n'est jamais joué deux fois. Chaque appui envoie la touche du clavier correspondante à la commande qui a le focus. Si aucun écran ne s'en sert, il déplace le focus comme le ferait la Tabulation, vers la commande la plus proche dans la direction choisie, sans sortir d'une fenêtre ouverte.
- Quand rien n'a le focus, le premier appui place seulement le focus, sur la zone d'accueil de l'écran, et n'envoie aucune touche. Un appui égaré ne peut donc pas finir un tour de combat. Pendant le tour ennemi, la zone d'accueil est cachée et l'appui attend.
- Trois indications que seule la manette lit : `data-gamepad-confirm`, `data-gamepad-back` et `data-gamepad-menu`.
  - Sur la carte, A sur une étape amène sur « Se rendre », ou sur « Détails » si l'étape est hors de portée. B ramène sur l'étape, et Start atteint le menu du haut.
  - Le dock du combat est sa zone d'accueil (`data-gamepad-home`).
- Le combat ajoute deux passages de focus, qui servent aussi au clavier et ne changent rien à la souris :
  - au placement, choisir une unité met le curseur sur une case libre, et la poser ramène sur l'unité suivante, puis sur « Lancer le combat » ;
  - Attaquer, Compétences et Objet donnent le focus à la première ligne de leur sous-menu.
- Les deux tutoriels du combat sont marqués comme fenêtres (`role="dialog"`, `aria-modal`). La manette n'agit plus sur le champ de bataille caché derrière eux.
- Un anneau de focus reste visible quand la manette déplace le focus, même après un clic de souris.
- **Défaut corrigé au passage, trouvé en testant.** Après l'audience, la carte présélectionnait le Camp du Lion, qui n'a plus rien à ouvrir, au lieu de l'embuscade. Entre deux étapes requises à égalité, elle préfère désormais celle qui a quelque chose à ouvrir. Cette règle ne touche que la présélection : rien ne bouge avant que le joueur confirme.

## Limites

- Le son démarre après un clic ou une touche du clavier : le navigateur exige un geste réel et ne compte pas forcément l'appui sur une manette. Un clic dans la fenêtre au lancement suffit.
- Les interrupteurs « Effets » et « Musique » de la fenêtre des sons exigent ce même geste réel (règle du jeu 1.12.0). Ils se règlent à la souris ou au clavier ; les curseurs de volume répondent à la manette.
- Le stick droit, les gâchettes et la caméra du combat ne sont pas utilisés. Aucune icône de bouton n'apparaît à l'écran en dehors de l'avis et de l'aide.
- Une manette que le navigateur ne reconnaît pas en correspondance standard peut avoir ses boutons ailleurs.
- La vérification automatique simule une manette standard. Le ressenti avec une vraie manette reste à juger par l'opérateur pendant le playtest PC.

## Vérifications

- 13 tests de la manette (`src/ui/GamepadNavigator.test.ts`) ; le passage de focus du placement (`src/combat/combatKeyboard.test.ts`) ; la présélection après l'audience (`src/ui/PoiMapView.test.ts`).
- Suite complète, types, build, validateur de contrats et barrière des contrats verrouillés.
- Parcours réel sur un serveur de développement à part (port 5181), avec une manette simulée dans un navigateur sans fenêtre, en mouvement normal et en mouvement réduit, sans erreur de page :
  - écran titre, ouverture passée avec B, dialogues et choix ;
  - carte : étape, « Se rendre », menu du haut et Compagnie ;
  - audience, embuscade, tutoriel du combat, placement des quatre unités, lancement, déplacement à la croix, sous-menu d'élan, ciblage, annulation et « Attendre ».

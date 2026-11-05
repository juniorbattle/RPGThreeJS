# Menu de réglages unique — OD-2026-11-05-B

- **Date** : 2026-11-05 (America/Toronto).
- **Source** : demande de l'opérateur dans la session Claude du 2026-11-05 : « fais-moi aussi un véritable menu settings au lieu d'avoir les sons, graphismes, etc. séparés ».
- **Statut** : ACTIVE ; livré sur `dev` avant le playtest PC.

## Décision

1. Un seul menu « Réglages » remplace les réglages dispersés :
   - les « Sons » de l'écran titre et de la carte ;
   - le « Mouvement réduit » de la carte ;
   - les lignes « Effets HD » et « Sons » de l'engrenage du combat.
2. Il s'ouvre depuis trois endroits : le bouton « Réglages » de l'écran titre, celui du menu de la carte, et la ligne « Son, affichage et commandes » de l'engrenage du combat. Il s'affiche alors par-dessus le combat.
3. Il a trois onglets :
   - **Son** : effets sonores et musique, chacun avec son interrupteur et son volume, comme avant ;
   - **Affichage** : le mouvement réduit ; une note dit quand le système demande déjà moins d'animations ;
   - **Commandes** : clavier, manette et raccourcis du combat.
4. Le mouvement réduit devient un choix du joueur gardé sur ce poste, hors des sauvegardes. Une chronique nouvelle ou chargée le reprend, et un combat en cours le suit aussitôt. Il reste désactivé par défaut. La préférence du système s'ajoute toujours, comme l'exigent les contrats.
5. Aucun contrat ne change : les préférences de son restent hors V6, et le son démarre toujours au premier geste réel. Le jeu de contrats reste 1.14.0, baseline `85576d6d9e3af6c8ddc953a1740ecf167592f4a4`.

## Livraison

- `src/ui/UiSoundSettings.ts` devient le menu « Réglages », avec ses onglets ; il garde la fenêtre des sons existante et le piège du focus.
- `src/ui/MotionPreference.ts` garde le choix de mouvement sur ce poste, sous la clé `rpg-threejs:motion-preference:v1`. Une lecture ou une écriture refusée ne bloque rien.
- `src/game/GameApp.ts` ouvre ce menu partout. Après un changement de mouvement fait sur la carte, il redessine la carte puis rend le focus à « Réglages ». Il transmet aussi le changement au combat.
- Le combat reçoit le message strict `rpg-threejs:combat-graphics` (`src/combat/protocol.ts`, `CombatBridge.setReducedGraphics`). C'est de la présentation seulement.
- Hors campagne, le combat isolé de développement garde sa ligne « Effets HD ».
- Le libellé « ⚙ Options » de l'écran titre, qu'on ne pouvait pas ouvrir, est retiré ; le bouton « Réglages » le remplace.
- **Défaut corrigé au passage.** Fermer le menu pouvait relancer sa propre fermeture quand l'écran derrière se redessinait. La restauration du focus ne s'exécute plus qu'une fois.

## Limites

- Deux anciens pilotes de QA visent encore les boutons retirés. `tools/demo-continuous-production-qa.mjs` cible `data-poi-action="motion"` et `"sounds"`, et `tools/combat-keyboard-production-qa.mjs` cible `data-s="fxhd"`. Ils ne font pas partie de la suite actuelle et seraient à adapter avant tout nouvel usage.
- Les interrupteurs de son exigent toujours un clic ou une touche, pas un appui sur la manette ; les curseurs de volume répondent à la manette.

## Vérifications

- Tests du menu et de la préférence (`src/ui/SettingsMenu.test.ts`) ; tests du son mis à jour pour les onglets (`src/ui/UiSoundPlayer.test.ts`) ; tests de la carte.
- Suite complète, types, build, validateur de contrats et barrière des contrats verrouillés.
- Parcours réel sur un serveur de développement à part (port 5181), avec une manette simulée, en mouvement normal et en mouvement réduit du système, sans erreur de page :
  - **écran titre** : ouvrir « Réglages », passer à l'onglet « Affichage » et changer le mouvement ;
  - **nouvelle chronique** : elle reprend ce choix ;
  - **carte** : Start, « Réglages », changement, carte redessinée et sauvegarde automatique à jour ;
  - **combat** : l'engrenage ouvre le menu par-dessus le combat, le changement s'applique tout de suite et le focus revient à l'engrenage.
- Rendu vérifié à 1366 × 768 et à 390 × 844.

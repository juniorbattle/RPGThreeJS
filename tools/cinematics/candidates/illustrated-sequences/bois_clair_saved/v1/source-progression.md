# Bois-Clair sauvé — progression sourcée hors runtime

Run `codex-illustrated-bois-20261021T1854Z`, source dev `59253f373db27356fd1c99add18b37765e72c91d`, contrats1.8.0/baseline0cb95135. OD-2026-10-21-A/B. Les instructions de mouvement du brief vidéo historique ne sont pas exécutées.

`src/cinematics/Cin6aPresentation.ts:132` sélectionne `bois_clair_saved` seulement après victoire `village_defense`, `missionSuccess===true` et `missionGreed!==true`. `src/game/GameApp.ts` appelle ce média après résolution propriétaire et avant le dialogue postcombat. `src/game/content.ts:1022` ouvre `village_defense_aftermath` : les Serpents fuient et les enfants sont saufs. Le choix refuser la récompense/accepter les provisions demeure dans ce dialogue. Ne montrer ni transfert, refus, récompense, guérison, reconstruction ou nouvelle personne. Les enfants restent hors champ, sans fabriquer leur apparence.

Références inspectées : plaque approuvée `public/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/bois-clair-tableau-aftermath-saved.png`, masters `villageoise.png` et `white_mage.png`. Même place humide, palissade brisée au centre, maisons à colombages, clocher au fond à droite, lueur basse orange et fumées résiduelles ; aucune restauration des dégâts. La plaque sauvée fixe la lumière, sans déduire une nouvelle heure de la branche d'arrivée. Marian à gauche regarde à droite ; Villageoise à droite regarde à gauche. Deux personnages seulement, visages couverts V2, aucun figurant. Bâton solaire droit tenu de la main droite de Marian ; main gauche libre. Villageoise garde son panier à son côté anatomique gauche, main gauche sur anse et droite au bord. Aucun miroir des masters.

## Cinq changements lisibles,18s

1. **Le danger est retombé (4s)** : large, lieu endommagé et deux présences immobiles ; Villageoise encore contractée, panier contre le haut de l'abdomen. Aucun ennemi/corps ajouté.
2. **Relâcher les épaules (3s)** : moyen Villageoise, épaules abaissées et tête moins rentrée ; même panier et prises. Premier relâchement visible, pas une nouvelle parole.
3. **Desserrer le panier (3s)** : cadrage mains/torse ; panier descend à la taille, prise droite moins crispée, main gauche garde l'anse. Aucun objet reçu, donné ou exposé comme récompense.
4. **Une attention apaisée (3s)** : moyen à deux ; Villageoise relève la tête vers Marian ; Marian incline légèrement la tête voilée en retour, main gauche libre basse, bâton vertical. Aucun contact, soin, serment ou ordre.
5. **Avant les remerciements (5s)** : large à deux, même axe et mêmes places, panier à la taille et épaules relâchées ; relation disponible pour `village_defense_aftermath:1`. Arrêt avant ses paroles et les deux choix.

Chaque illustration entière est tenue ; fondus1s/0,8sOSreduce, aucune translation/zoom/locomotion revendiquée. Requêtes et sorties brutes conservées. Les six images de l'audience, les cinq de l'arrivée et le camp ne sont pas régénérés. Le scénario unique de ce run concerne l'arrivée ; les nouveaux médias sauvés resteront GENERATED_REVIEW_PENDING jusqu'à leur revue technique dédiée, art final/runtime toujours séparés.

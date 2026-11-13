# Bilan de fin de conception — arbitrages de l'opérateur (OD-2026-11-13-F, 2026-11-13)

Statut : `APPROVED DECISION`. L'opérateur a demandé un bilan concret du jeu complet avant d'écouter la musique : « je veux avant m'assurer que le jeu est a present complet dans son implementation ». Le bilan est dans `docs/reports/game-completeness-review-2026-11-13.md` (`6650543d`). Les 16 arbitrages ont été posés sur une fiche privée (https://claude.ai/artifact/Ai6zMxMLGtzjHUya7ycL45). L'opérateur l'a remplie le 2026-11-13 et a dit « Fiche remplie ». Ses choix ont été relus dans la base de la fiche : chaque recommandation est retenue, sauf C3, où il choisit de créer tout de suite une attaque lourde magique. Aucun contrat n'est touché par ces choix ; un lot qui trouverait un conflit avec un contrat LOCKED s'arrête et le signale.

## Combat

- **C1, corriger.** Le Gardien de flamme et le Champion du Phénix reçoivent une attaque lourde existante à 4 PA à la place de leur Garde : Gel pour le Gardien de flamme, Transpercement pour le Champion. Un test exige l'étape lourde du cycle de 4 tours (OD-2026-11-11-A) chez tous les boss et toutes les élites.
- **C2, corriger.** Le Fidèle égaré prend l'ultime magique Apocalypse à la place d'Exécution.
- **C3, créer maintenant une attaque lourde magique** (contre la recommandation, qui était de juger au test sur PC). Les boss magiques qui frappent sur leur stat faible à l'attaque lourde reçoivent une attaque lourde magique. Ce sont Kaelen, le Grand Inquisiteur et l'Entité ; le Brasier du Démon est à revoir dans le même mouvement. Chaque nouvelle compétence garde :
  - son effet propre (OD-2026-11-01-A) ;
  - des couples attaque lourde et ultime distincts entre boss (B1).

  Le nom et l'effet de chaque nouvelle compétence sont proposés à l'opérateur avant d'entrer dans le jeu.
- **C4, Maelor seulement.** Maelor reçoit une compétence propre pour se distinguer du Prophète des Ombres. Son nom et son effet sont proposés à l'opérateur avant d'entrer dans le jeu. Les kits d'élites recyclés restent tels quels et seront jugés au test sur PC.
- **C5, renommer.** Les noms proposés sont retenus :
  - Kaelen : « Bâton du Dragon » ;
  - le Grand Inquisiteur : « Bâton de l'Inquisiteur » ;
  - le champion du Corbeau : « Dagues du Corbeau ».

  Statistiques, portée et son ne changent pas. Le test arme/image s'étend à toutes les unités.

## Récit

- **N1, un embranchement de combat par plateau.** À l'Ours, au Dragon et au Scorpion, un choix mène à un combat sur une branche et l'évite sur l'autre, à un prix. Il utilise les unités et les arènes existantes. Les trois scènes et leurs répliques sont soumises mot à mot à l'opérateur avant d'être écrites dans le jeu.
- **N2, ajouter les répliques du Lion.** Le discours de trahison de Maelor rappelle les choix du Lion : le butin, le silence des témoins. Les répliques sont soumises mot à mot.
- **N3, une réplique de clôture.** Les épilogues disent le sort de Maelor après la brèche. La réplique est soumise mot à mot.
- **N4, garder.** La fin reste déterminée par les quatre issues de plateau et la réputation. Note de l'opérateur : « Mais il est sure que nous devrons travailler sur cela, le moment venu ». Le poids de l'acte final sur la fin est donc un chantier futur reconnu, hors de ce lot.
- **N5, une trame de rubriques.** Claude propose une trame de crédits par rubriques, sans aucun nom ni rôle. Le texte final reste celui de l'opérateur, mot à mot (`src/ui/credits.ts`).

## Présentation

- **P1, donner l'humeur du Lion.** Les 63 dialogues de l'après-démo dont le pendant au Lion est en tension ou en drame prennent cette humeur (`POST_DEMO_SCENE_MOODS`). Un test exige une humeur décidée pour chaque dialogue de l'après-démo ; les dialogues nouveaux de N1 à N3 en prennent une aussi.
- **P2, définitives.** Les portraits des six héros recrutables (Aldric, Morvan, Lyra, Eldwin, Talon, Gunnar) sont leurs images finales. Le registre cesse de les présenter comme provisoires.
- **P3, image du refuge en cours.** Le registre de compagnie et l'échoppe prennent l'image du refuge de la partie en cours, au lieu de la forêt du Lion.
- **P4, garder.** Le Maître Espion et le Chaman gardent l'entrée de boss de leur partie (décision 9 A).

## Vérification et finition

- **Q1, lancer ce lot maintenant.** Le lot couvre plusieurs points :
  - un test qui enchaîne la fin du Lion actuel vers l'Ours ;
  - des tests de sauvegarde en cours de plateau ;
  - des tests de retour au dernier point de sauvegarde après une défaite, pour chaque plateau ;
  - une partie jouée dans le navigateur par le pilote QA jusqu'à une fin, avec captures.

  Le tout se fait avant le test de l'opérateur sur PC.
- **Q2, nettoyer.** Le nettoyage n'a aucun effet en jeu :
  - les champs figés de l'état (`lastKnownGoodCommit`, `lastPushedCommit`, `activeTask`, bloc `live`) ;
  - les commentaires périmés : images provisoires, « PROPOSAL, to confirm », requête système retirée ;
  - le skill `ui-accessibility` ;
  - `docs/content/DEMO_CONTENT_MAP.md` ;
  - les scénarios QA de Journey qui pointent vers des vidéos retirées.

  L'image de la spectatrice de l'arène reste en réserve, documentée.

## Ordre proposé ensuite

1. Les corrections ci-dessus.
2. La partie complète jouée (Q1).
3. L'écoute de l'opérateur en jouant : musique, ambiances et poses.
4. Le test final sur PC.
5. La passe mobile.
6. La dette technique.

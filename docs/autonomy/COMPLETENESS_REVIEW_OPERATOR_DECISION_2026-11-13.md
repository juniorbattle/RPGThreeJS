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

## Remarques de l'opérateur au lancement des lots (même jour)

L'opérateur a validé le découpage en quatre lots (« sinon pour le reste je valide ton résumé ») et a ajouté quatre remarques. Chacune est transmise à la session concernée.

- **Couleurs de Talon et de Kestrel.** « je constate que le heros ninja et archer ont quasi la meme couleur... a faire attention ». Talon, le ninja, et Kestrel, l'archère, sont tous deux encapuchonnés en bleu nuit. La session de présentation compare leurs silhouettes et propose des options avec captures : décaler la teinte de Talon, décaler celle de Kestrel, ou garder. Rien n'est recoloré sans l'accord de l'opérateur.
- **Grandeur et impact des compétences.** « il faut s'assurer que nos competences soit bien construit dans leur execution et leur effet vfx en respectant la direction de grandeur et impact surtout pour les competences haut niveau/ultimes ». La session de combat proportionne les compétences nouvelles ou changées à leur rang. Elle audite aussi l'échelle base, légère, lourde, ultime de toutes les compétences en jeu : ampleur de l'effet, charge, impact, caméra, son. Les ultimes et les attaques lourdes passent en premier. Elle corrige les effets trop faibles sans toucher aux statistiques ; une retouche qui change l'identité d'une compétence passe d'abord par l'opérateur.
- **Nettoyage global.** « On profitera aussi pour faire un nettoyage globale afin de conserver uniquement l'essentiel car il y a beacuoup d'elements temporaires ». Q2 s'élargit à tout le dépôt, en seconde phase de la session de présentation :
  - d'abord un inventaire classé (supprimable sans risque, gardé par une règle, à trancher), soumis à l'opérateur ;
  - puis les suppressions, dans des commits dédiés.

  Les lignes rouges d'`AGENTS.md` restent : identifiants historiques, moments canoniques et archives de médias et de preuves gardés, fichiers `legacy*` inventoriés avant toute action, contrats intouchés.
- **Récit des moments à enjeu.** « Le recit globale doit etre optimale surtout lors des moments de tensions ou a enjeux marquantes ». La session de récit ajoute à N1, N2 et N3 la dernière passe narrative prévue par la feuille de route. Elle inventorie les moments de forte tension du prologue aux trois fins, puis propose des retouches mot à mot classées par impact (texte actuel, texte proposé). Rien n'entre dans le jeu sans validation, et aucun canon nouveau n'est inventé.

## Ordre proposé ensuite

1. Les corrections ci-dessus.
2. La partie complète jouée (Q1).
3. L'écoute de l'opérateur en jouant : musique, ambiances et poses.
4. Le test final sur PC.
5. La passe mobile.
6. La dette technique.

## Fiche de la seconde phase : couleurs et nettoyage (même jour)

La session de présentation a soumis ses options sur une fiche privée (https://claude.ai/artifact/ScehruYEVzu6FGSRk4h8Js), avec des aperçus calculés et l’inventaire `docs/audits/global-cleanup-inventory-2026-11-13.md`. L’opérateur l’a remplie et a dit « fiche remplie ». Ses choix ont été relus dans la base de la fiche : chaque recommandation est retenue, sans note.

- **T1, Talon ardoise.** Le bleu de Talon passe en gris ardoise sombre sur son portrait et sa planche de combat, par un traitement de palette qui garde son dessin et l’argent de ses plaques. Kestrel garde le bleu nuit choisi le 2026-11-11 (F3).
- **N1, supprimer** les 9 fichiers jetables de la catégorie A de l’inventaire.
- **C1, supprimer** les anciennes poses du Combat Stage (`public/assets/combat-stage/poses/`, 41,8 Mo).
- **C3, supprimer** les atlas POI V2 remplacés (`public/assets/generated/lion-phase/poi-v2/`).
- **C4, déplacer vers `docs/`** les neuf rapports JSON de migration rangés dans `public/`.
- **C5, déplacer vers `docs/media/`** l’écoute `combat-fx-v1/preview-all.wav`.
- **C6, déplacer hors de `public/`** les références Option C (`characters/pixel/validation/ready/`).
- **C7, supprimer** les quatre pilotes QA de l’époque UI-SYSTEM-1 et ajuster le skill qa-evidence.
- **C9, supprimer** les huit scripts de revue de `tools/dialogue` ; les pages de preuve restent.
- **C15, ajouter une garde** aux cas de `spritesheetPng.test.ts` qui lisent les PNG locaux du megapack.
- **Reporter à la dette technique** : reste du Combat Stage, TravelView, CombatSfx, lab du Composer et chaîne de lecture vidéo (C2, C13, C14, C18).
- **Garder** : C8, C10 à C12, C16 et C17.
- **Principes.** Les preuves des rapports ne sont pas compactées (P1). Les candidats cinématiques restent sous OD-2026-10-24-A (P2). L’historique Git n’est pas réécrit.

## Validations du lot combat (même jour)

- **C3 et C4, validés.** Dans la session de combat, à la question « Valides-tu les quatre nouvelles attaques lourdes et le Démon, comme dans le brouillon ? », l'opérateur a répondu « Yes, all four ». Brouillon : `docs/content/drafts/NEW_BOSS_SKILLS_DRAFT_2026-11-13.md`. Entrent en jeu :
  - Kaelen : « Foudre Céleste » (aveugle) ;
  - le Grand Inquisiteur : « Sentence » (Mutisme) ;
  - Maelor : « Serment rompu » (dissipe les effets positifs de la cible) ;
  - l'Entité : « Étreinte de la brèche » (Entravé) ;
  - le Démon : Gel en attaque lourde et Frappe du Titan en ultime.

  Chaque compétence a son effet propre. Un test verrouille les 15 couples attaque lourde + ultime distincts des boss (5572af4b).
- **Grandeur et impact.** Six effets sont remis à l'échelle de leur rang, sans toucher aux statistiques (a9e3dc73). Les captures avant et après sont dans `docs/reports/bilan-combat-2026-11-13.md`.
- **C1, C2 et C5** sont livrés (307b5a19, 2578a659).
- **Démon de la brèche.** À la remarque de l'opérateur sur son encombrement, rapportée par la session de combat, il se tient maintenant centré sur sa case : ses pieds s'ancrent entre ses deux pieds, et sa hauteur passe de 2,2 à 1,95 (3b1a02aa).
- **Encore ouverts pour l'opérateur.**
  - ~~L'arme de la Bête corrompue~~ : tranchée le même jour. À « Renommer l'arme de la Bête corrompue en « Charge » ? », l'opérateur a répondu « Yes, « Charge » ». Elle combat avec « Charge » ◆ au lieu de « Griffes », avec l'effet de coup de bélier, sans changement de statistiques ni de portée (6c60d25d). Le test arme/image n'a plus d'exception.
  - Le libellé « PURIFIÉ », repris de la dissipation existante, s'affiche quand Serment rompu retire les protections d'un héros.

## Validations du lot récit (même jour)

Les textes sont dans `docs/content/drafts/PLATEAU_FORKS_AND_MAELOR_LINES_DRAFT_2026-11-13.md`. Le rapport est `docs/reports/bilan-recit-2026-11-13.md`, livré en dc8b2f58. Le gardien des contrats a relu le plan avant l'implémentation et n'a trouvé aucun conflit. Réponses de l'opérateur, question par question :

- **N1, embranchements de combat : « Valider tel quel »** pour l'Ours, le Dragon et le Scorpion. Trois choix existants lancent maintenant un combat :
  - « Saisir le minerai pour le clan », au convoi de l'Ours ;
  - « Monter la garde et repousser le prochain raid », au hameau du Dragon ;
  - « Libérer le fidèle du Phénix », chez les érudits du Scorpion.

  Après la victoire, la scène se rouvre sur la rencontre du héros de cette branche. Les verdicts, la réputation et la sauvegarde ne changent pas ; trois faits techniques de victoire s'ajoutent.
- **N2, trahison : « Réplique Bois-Clair ».** Maelor rappelle Bois-Clair, avec trois variantes selon les choix du Lion (butin, témoins réduits au silence).
- **N3, clôture : « Varie selon la fin ».** Le sort de Maelor est dit dans chacun des trois épilogues.
- **N5, crédits : « Trame complète ».** La trame compte dix rubriques, sans aucun nom. Rien n'est écrit dans `src/ui/credits.ts` : le texte final viendra de l'opérateur, mot à mot.

La dernière passe narrative sur les moments à forte tension se poursuit dans la même session. Ses propositions seront soumises mot à mot.

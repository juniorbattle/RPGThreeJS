# Décision opérateur : structure cinématique et production indépendante

Décision utilisateur du **1 octobre 2026**, America/Toronto, consignée après le checkpoint `89b931b`. Cette décision plus récente prime sur les instructions de génération récurrente du précédent brief MiniMax.

## Répartition du travail

La création et la direction artistique des vidéos seront travaillées indépendamment des tâches autonomes. Les runs récurrents ne génèrent plus de clips ni de keyframes destinées aux vidéos, ne relancent aucun job MiniMax, ne remasterisent ni ne remplacent les MP4 de production. La permission d'utiliser MiniMax reste acquise pour les travaux vidéo explicitement engagés hors automatisation ; elle ne constitue plus une instruction de génération récurrente.

L'autonomie prépare et consolide la structure pour accueillir les futurs médias : déclencheurs canoniques, slots actuels, ownership cast/surface, montage et handoffs, retour au tableau/dialogue, skip, reduced motion, fallback, chargement, reprise/save et QA des médias existants. Les corrections doivent venir d'un écart observable, préserver dialogues/choix/outcomes/IDs et respecter les contrats LOCKED. Le média candidat non accepté ne doit pas bloquer la QA indépendante de la démo.

Les items 1–7 restent terminés. L'item 8 possède désormais deux livrables distincts : préparation structurelle autonome, et production/acceptation des nouveaux médias **EXTERNAL_MANUAL_WORKSTREAM** (incomplète, hors file récurrente). Après un bilan structurel explicite, l'autonomie poursuit l'item 9 sur les travaux indépendants ; elle ne déclare pas le remaster artistique achevé. Audio reste DEFERRED.

## Prologue et premier refuge

- **Prologue : ajout souhaité à préparer.** Définir prochainement son rôle, son point d'entrée/sortie dans le prologue existant, ses acteurs/environnement et ce qui doit rester interactif. Ne pas inventer de scène, dialogue ou outcome pour remplir le brief.
- **Première scène du premier refuge : option à étudier.** Préciser sa valeur narrative et la transition vers l'agence/consolidation du refuge avant d'en faire un slot obligatoire.

Le contrat actuel autorise exactement huit slots. Cette note enregistre une évolution demandée à préparer, sans modifier le registre ni un contrat LOCKED. Une tâche dédiée d'extension des contrats, avec liste finale et limites approuvées, précédera toute activation d'un prologue vidéo ou d'une vidéo de refuge. Aucun nouvel ID, slot actif, placeholder vidéo ou média n'est créé ici.

## Alistair : décision différée, non urgente

L'utilisateur signale que l'emblème du lion porté par Alistair peut laisser entendre une affiliation. Deux pistes restent ouvertes :

1. Design plus sobre/neutre, avec audit des masters/poses V2 et surfaces concernées avant toute modification artistique.
2. Origine dans la région du Lion et aide apportée au clan par respect pour ses légendes : **hypothèse utilisateur à confronter au canon**, pas biographie adoptée.

Aucun choix n'est tranché. Aucun asset V2 ni texte narratif ne change. L'autonomie ne résout pas cette ambiguïté en inventant une origine ou en effaçant le symbole. Consigner ce point dans le backlog de décision artistique/narrative et le traiter lors d'un travail dédié.

## Conservation et prochaine reprise autonome

Conserver les six candidats, sources, prompts, hashes, reviews et outils du checkpoint `93f8df1`/`89b931b`. Camp reste non accepté après trois tentatives, audience 2 reste un progrès non accepté, Bois-Clair shot 1 reste un bloc limité de 10 secondes ; aucun de ces états n'autorise une promotion. Aucun job fournisseur n'est en attente.

Reprendre **CINEMATIC-STRUCTURE-READINESS** : lire cette décision et les états MD/JSON, réutiliser les preuves de `docs/reports/cinematic-active-motion-1.md` et de la préparation des huit slots ; dresser un bilan des triggers/handoffs/ownership/fallback/skip/reprise accessibles sans nouveau média. Vérifier les écarts structurels réels, puis poursuivre la QA démo indépendante. Ne pas reprendre la génération Bois-Clair shot 2 depuis l'ancien nextAction.

## Conformité de cette décision documentaire

Contract set v1. GAME_CONSTITUTION, WORLD_AND_CHARACTERS, CAMPAIGN/NARRATIVE, PRESENTATION_AND_MEDIA, SAVE, QA_EVIDENCE et REPOSITORY_GOVERNANCE : **PASS pour la conservation**, aucune modification runtime/asset/LOCKED. Extension prologue/refuge : **DEFERRED à une tâche contractuelle dédiée**, aucune déclaration d'implémentation. Art/biographie Alistair : **DECISION_PENDING**, non urgente. Remaster final : incomplet, hors scope récurrent.

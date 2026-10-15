Mission Codex — RPGThreeJS / POI V2 + retrait complet Traversal
Instruction opérateur d'exécution. Lire en entier la pièce jointe RPGThreeJS_CONTRAT_OPERATEUR_POI_V2_ET_RETRAIT_TRAVERSAL_2026-10-15.md. Cette mission n'est pas une simple demande d'audit, de plan ou de retouche esthétique. Tu dois produire des changements réellement jouables sur dev et supprimer à terme le moteur Traversal devenu inutile, avec preuve de non-régression.
0. Etat réel à considérer, et priorité
Au moment de cette directive, origin/dev était à b79063bb4d96636198e93d61b7b3dd1110dab6e2 (à revalider au preflight). POI set 1.2.0 déjà LOCKED, 21 nœuds Lion, PoiMapView, LionPoiMap, selectPoiMap, enterPoi, bypassPoi, cartes en trois panneaux ; parcours natifs et fins de campagne acceptés par périmètre, pas par une validation de tous les contenus. Les coffres ne sont pas déjà placés (APPROVED_POI_CHESTS=[]). L'ancien module physique src/traversal/ et des références GameApp restent présents. Les ressources cinéma/audio sont des travaux séparés.
L'opérateur demande quatre résultats :
1. Une première carte réellement ramifiée APRÈS Croisement du rôdeur, sans passer outre le premier combat ni la rencontre structurante ;
2. Des cartes suivantes organisées par phases, moins linéaires mais sans faux contenu ni densité artificielle ;
3. Un travail visuel substantiel en Option C/Pixel Diorama Fantasy, non un simple réagencement de cercles sur le SVG générique actuel ;
4. La suppression réelle du moteur de Traversal (pas un simple disable), en conservant l'autorité du jeu et les anciennes sauvegardes.
Le produit est prioritaire sur l'outillage. Ne boucle pas sur les tests historiques du Traversal ; ne refais pas de rapports de preuve qui n'apportent aucun résultat jouable.
1. Preflight et gouvernance (une fois, de façon ciblée)
- Vérifie origin/dev, HEAD, working tree, verrou exclusif, éventuel WIP, tâches parallèles et directives en vigueur selon AGENTS.md, les contrats LOCKED et le protocole autonome. Ne touche ni main, ni les autres worktrees, ni l'ordonnanceur en pause.
- Lis docs/project/POI_NAVIGATION.md, docs/contracts/{TRAVERSAL,CAMPAIGN_AND_STATE,WORLD_AND_CHARACTERS,PRESENTATION_AND_MEDIA,UI_AND_ACCESSIBILITY,AUTHORING_AND_QA,AUTONOMOUS_WORK_PROTOCOL}.md, docs/game/GAME_CONSTITUTION.md, le manifeste et la décision POI antérieure. Consulte les rapports natifs récents pour réutiliser les réussites sans les rejouer par automatisme.
- Enregistre une nouvelle décision opérateur dans l'index append-only ; détermine avec guardian les amendements indispensables à 1.2.0 et procède selon la procédure LOCKED, avant les modifications qui contredisent un verrou. Ne fabrique pas de numéro de décision déjà existant ni de statut APPROVED antérieur à la review. L'approbation utilisateur vise cette mission précise, pas de nouveaux événements narratifs ou récompenses arbitraires.
- Dessine un petit diagramme de l'ancien et du nouveau graphe phase 1 (IDs effectifs et connexions, pas une maquette fictive), repère les sauvegardes et mécanismes sensibles. Ce diagnostic doit alimenter les commits produit immédiatement, pas occuper une session entière.
2. Lot A — Recomposer la première carte, résultat jouable obligatoire
2.1 Couloir structurant
Conserve obligatoirement cette séquence causale :
lion-camp → lion-audience [primaire] → lion-opening-ambush [Piste des bêtes : premier combat] → lion-nomad-crossroads [Croisement du rôdeur : rencontre/Cédric].
Interdiction de créer un chemin direct vers lion-first-refuge depuis l'audience ou le croisement qui sauterait le premier combat, le croisement ou l'épreuve obligatoire. Le joueur résout la rencontre de Cédric dans la forme auteurisée ; ne le recrute pas automatiquement si le dialogue lui donne un choix.
2.2 Nouvelle zone de branches
Les embranchements commencent après lion-nomad-crossroads, avant lion-first-refuge.
Tu dois rendre visibles et jouables des trajets réellement différents, en conservant la logique existante :
- lion-refugees (Route des réfugiés) : POI mystère facultatif, choix et coût de bypass existants, revenir dessus possible lorsque compatible ;
- lion-first-trial-event (Rencontre sur la route) et lion-first-trial-combat (Piste contestée) : deux alternatives exclusives de l'épreuve canonique. La résolution de l'une neutralise l'autre ; le simple contournement de réfugiés n'accomplit pas l'épreuve ;
- petits détours de POI coffre / combat ordinaire lorsque l'authoring est vérifié, et seulement une élite si une formation classée élite de difficulté réellement admissible est approuvée pour cette phase. Aucun nouveau combat majeur, boss ou lore imaginé.
Tu peux utiliser des embranchements réversibles ou des détours en cul-de-sac, dès lors que la géographie est claire et que RunSystem valide tous les mouvements. La phase 1 doit rester tutorielle et modérément dense : pas de réseau tentaculaire.
Obligation de preuve : le joueur voit plusieurs voies après le Croisement et peut en sélectionner au moins deux qui ont des contenus/conséquences distincts, puis atteindre le refuge via le vrai parcours autorisé. Un POI résolu n'est jamais réactivé ; une branche incompatible reste neutralisée mais traversable si la géographie l'exige.
2.3 Données de contenu : ne pas inventer des récompenses
Inspecte les contenus réellement existants (src/game/content.ts, les catalogues, LionCampaignStructure, runSystem, contrats et poiContentAdapters).
- Tu peux implémenter les connecteurs et la sélection de combats ordinaires existants, avec formation éligible, assignation déterministe par partie/POI, absence de reroll et résolution unique.
- Pour les coffres, APPROVED_POI_CHESTS=[] : prépare un tableau d'authoring compact indiquant ID stable proposé, connexion, objet/or exact, provenance catalogue et impact économique. Ne crée pas un coffre donnant un gain inventé, et ne réclame pas un PASS de contenu sur une catégorie vide. Laisse la fonctionnalité techniquement utilisable mais inactive jusqu'à validation explicite des montants/placements manquants.
- Même discipline pour une nouvelle élite : config existante réellement elite, difficulté, placement et récompenses vérifiés avant activation.
- Toute nouvelle extension persistante du graphe ou des IDs doit être compatible avec les anciennes V6 et ne pas modifier l'ordre des principaux événements. Si l'ancienne structure ne supporte pas les détours facultatifs, introduis la plus petite couche d'authoring sous l'autorité RunSystem, et teste les migrations.
2.4 Tests minimaux du lot A
- Départ canonique, combat réel, croisement/recrutement, branche, refuge et vrai retour carte ;
- pas de skip des nœuds obligatoires, pas de téléportation distante ;
- retour en arrière et en avant, POI résolu inerte sans nouveaux effets, coffre unique si autorisé, attrib. stable d'ennemi ;
- exclusivité événement/combat, état neutralisé ≠ accompli ;
- réfugiés ignorés puis revisités lorsque compatible, coût de bypass une seule fois ;
- bon refuge, services/récompenses non dupliqués, sauvegarde et reload V6 exacts ;
- une partie réellement jouée avec entrées natives, pas de victoire injectée pour attester du gameplay.
Livraison A : commit produit et capture montrant le nouveau graphe en jeu, avec parcours natif représentatif. Ne passe au nettoyage destructif qu'après une preuve de substitution suffisante.
3. Lot B — Generaliser la composition sur les autres phases
Examine les panneaux en place : lion-first-refuge → Bois-Clair / Second Refuge, puis Second Refuge → lion-shadow-signs → préparation/jugement. Les panneaux actuels répartissent les 21 nœuds d'après le depth (lionPoiMapPhase) : les limites de panneaux sont du layout, pas une raison de modifier la campagne.
- Définis explicitement rôle primaire / structurant / facultatif et région de chaque POI dans les métadonnées auteurisées ; ne transforme pas depth en nouvelle source de vérité.
- Varie la composition d'une carte à l'autre selon la dramaturgie existante. Les cartes ultérieures doivent proposer des détours là où leur contenu et leur causalité le permettent, sans imposer une même fourche à chaque segment.
- Préserve Bois-Clair rescue/sacrifice, épreuves T1/T3 et leurs exclusions, recrutement du lancier, témoins, pré-jugement et les deux fins ; ne déplace pas ces événements hors de leur contexte.
- Un POI secondaire peut être facultatif ou obligatoire ; un refuge déjà débloqué reste ouvert, le Refuge final reste une scène narrative.
- Teste chaque passage de panneau, reprise d'un nœud intermédiaire et retour à un ancien refuge sans rejouer l'histoire.
Livraison B : carte des trois phases cohérente, chemins vérifiés, aucun nouveau jalon forcé ajouté.
4. Lot C — Direction artistique POI, un vrai saut qualitatif
La capture opérateur actuelle est le constat de départ, pas l'objectif final. La référence Tactics Ogre: Reborn porte sur la géographie lisible, pas sur une copie d'asset. La cible demeure RPGThreeJS Option C / Pixel Diorama Fantasy.
Ce que tu dois produire :
- Une géographie de campagne illustrée et cohérente avec les environnements existants, par phase : relief, différences de régions, voies organiques, cours d'eau, repères physiques (camp, audience, refuge, Bois-Clair...), profondeur et palette auteurisée ;
- Une hiérarchie visuelle claire entre primaires, structurants, mystères, coffres, combats, élites et refuges, avec statut résolu/neutralisé et position actuelle ;
- Des étiquettes lisibles sans collisions majeures, courbes de chemins lisibles, viewport desktop et mobile réellement explorables, pan/scroll, focus clavier/tactile, cibles >=44px et réduction de mouvement ;
- Des raccords visuels cohérents avec les tableaux, personnages et décors du jeu, sans coller simplement les sprites ou tableaux sur un fond plat ;
- Avant/après et captures des trois phases, cas clavier et mobile.
Ce qu'il faut éviter : arbres triangulaires en répétition, carte SVG « technique » avec une couleur uniforme, bruit génératif masquant la géographie, symboles illisibles, images AI fantasy hors style, label-spaghetti. Si aucun asset adapté n'existe, écris la spec visuelle précise, réalise le meilleur layout fonctionnel possible et signale art final en attente : ne déclares pas arbitrairement le visuel « approuvé ».
La qualité visuelle sera acceptée par l'opérateur, indépendamment d'un npm run build vert.
5. Lot D — Retirer enfin le moteur Traversal du dépôt
L'objectif est supprimer le module de pilotage, pas simplement régler un flag ou arrêter de l'afficher. La campagne POI doit rester autonome.
5.1 Inventaire réellement exploitable
Un ancien rapport mentionne 669 chemins contenant « Traversal » (incluant historique et ressources). Ne supprime jamais 669 chemins mécaniquement. Produis une matrice de dépendances : chemin, importeurs actifs, runtime nécessaire ?, destination/traitement, preuve. Catégories : DELETE, REHOME_SHARED, KEEP_DURABLE_COMPAT, HISTORICAL_EVIDENCE, REVIEW_UNCERTAIN.
Contrôle au minimum :
- src/traversal/ ; TraversalPresentation, scènes T0/T1/T3, renderer, Risk, Reward, Pursuit, sprites de caravane, preview-saves et leurs tests ;
- GameApp.ts (activeTraversal, lifecycle, forks, hooks, feature gate/QA), TraversalFeaturePolicy.ts, TraversalOptionalConsequencePolicy et callbacks ;
- LionCampaignTravelRelations.ts, anciens champs traversalBranches / IDs T0–T4, runSystem.ts, sauvegardes/migrations V1→V6 ;
- TRAVERSAL_RHYTHM : extraire un utilitaire partagé neutre si toujours utilisé par transitions UI/Journey ;
- TravelView, Journey, cinématiques, familles de décors, asset registries, CSS, build config et scripts de QA ;
- historique : rapports, captures, contrats 1.2.0 et amendements, preuves non modifiables.
5.2 Suppression/réimplantation
1. Extrais/réimplante les rares fonctions partagées réellement nécessaires dans des modules neutres, sans double source de vérité.
2. Détache du GameApp les chemins de conduite et les tests QA de conduite. PoiMapView et RunSystem ne doivent plus dépendre du module physique.
3. Retire les exports, imports, fichiers et assets prouvés orphelins ; conserve les assets encore utilisés par narration/combat/cinématiques/POI, même s'ils vivaient historiquement sous un nom Traversal.
4. Garde les clés durables V6 telles que traversalBranches en compatibilité si nécessaires. Un ancien ID reste un fait historique, pas la justification de conserver une scène de conduite.
5. Les contrats actuellement verrouillés comportent encore un ID historique TRAVERSAL dans les huit contrats du manifeste. Ne supprime pas ce contrat à l'aveugle ; reformule la documentation via l'amendement autorisé et conserve le ledger.
6. Supprime les drivers QA purement Traversal ou archive-les comme preuve suivant le protocole ; convertis les assertions encore pertinentes en tests POI/RunSystem plutôt que d'effacer des protections.
Condition formelle : aucune entrée runtime de production vers src/traversal/, aucune conduite/caravane physique déclenchable, aucun test de route requis pour lancer la démo. La présence résiduelle d'un identifiant historique ne constitue pas un échec ; le maintien d'une ancienne scène cachée ou d'un import actif oui.
5.3 Régressions obligatoires après retrait
- TypeScript, tests ciblés POI/RunSystem/Journey/refuges/combat, build de production ;
- nouveau départ jusqu'au premier refuge ; continuation jusqu'au second refuge ; préparation finale et deux conclusions (réutilise les preuves validées lorsque les sources critiques sont inchangées ; nouveau smoke si altérées) ;
- V6 chargé depuis ancienne version Traversal à plusieurs frontières : route interrompue, événement/fork, combat en attente, refuge, fin ; même faits, gains et choix ;
- défaite : butin temporaire perdu, sécurisé conservé, checkpoint restauré ;
- desktop1366 normal, au moins une largeur mobile390 avec vrai contrôle, clavier, contraste/focus, reduced-motion OS/jeu ;
- aucune réactivation du contenu d'un POI résolu ; aucun accès prématuré à Bois-Clair/jugement ;
- main, huit vidéos, Character V2, audio différé, récompenses et garde-fous de contrats inchangés hors amendement explicite.
Livraison D : diff de suppression documenté, zéro moteur de conduite, vérification du graphe de dépendances et preuve de jeu complet dans les limites déclarées. Si une dépendance bloquante non résolue subsiste, nomme-la précisément et ne détruis pas son fichier jusqu'à migration : pas de faux « 100 % retiré ».
6. Organisation de l'exécution — cadence et checkpoints
- Travaille en lots de production séparables A → B → C / D, avec commits cohérents et non-force push sur origin/dev suivant l'autorisation existante. Les lots C et D peuvent être travaillés dans l'ordre le plus sûr après A/B ; le cleanup n'attend pas indéfiniment une validation esthétique si les invariants techniques sont prouvés.
- Avant chaque lot, fixe un résultat visible ou jouable, pas un nouvel indicateur QA. Reprends les preuves pertinentes, conserve WIP/locks, applique les guardian checks aux zones sensibles.
- Utilise les agents spécialisés au besoin mais pas à des fins de multiplication de rapports. Aucun changement spéculatif « pour produire du code ». Aucun contournement de tests pour obtenir un PASS.
- Une opération de sauvegarde ou de suppression peut être longue : checkpoint de sécurité régulier selon le protocole, reprise déterministe sans écraser les travaux concurrents.
- Ne crée pas de nouveaux outils de QA s'il existe déjà un runner adapté. Une vérification navigateur liée à une modification vaut davantage qu'un nouvel outillage destiné à mesurer la même chose.
7. Retour opérateur attendu, après exécution réelle
Pour chaque livraison, fournis une synthèse courte :
BRANCHE : HEAD / commits publiés, aucun changement main.
PRODUIT : ce qui a effectivement changé et ce que le joueur peut faire en plus.
CARTE : graphe avant/après, branches effectivement ouvertes, contenu et ressources autorisés, nombre de POI réellement ajoutés vs proposés.
VISUEL : captures des 3 phases, différences observables, statut acceptation artistique opérateur ouverte si nécessaire.
CLEANUP : nombre de fichiers supprimés, conservés pour compatibilité, ressources réutilisées, dépendances résiduelles ; état réel du retrait physique.
PREUVES : tests ciblés, vraie partie native, sauvegardes V6, erreurs/limitations.
PROCHAIN CHANTIER : une seule action produit, et décisions d'authoring précises à soumettre si une approbation sur coffre/élite reste manquante.
8. Commandement final
Commence maintenant par le Lot A. Une fois la première phase jouable, généralise le contrat, effectue le travail visuel et supprime l'ancien moteur avec les gates ci-dessus. Je n'attends pas une nouvelle reformulation du plan ou un simple nettoyage documentaire.
Objectif final : une vraie carte de RPG tactique, avec primaire/structurant/secondaire correctement différenciés, embranchements à sens stratégique, belle identité visuelle Option C, réutilisation des systèmes existants, sauvegardes préservées — et aucun Traversal physique restant en production.
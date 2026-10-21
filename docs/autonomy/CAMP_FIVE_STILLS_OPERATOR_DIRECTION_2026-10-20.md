# Camp — cinq illustrations, cinq mises en scène

MANUAL-CAMP-FIVE-STILLS-2026-10-20. Client20octobre2026, UTC 2026-10-21T02:32:27.786Z.

## Demande explicite

« non je veux repartir sur l'idee initial : faire un enchainement d'images de mise en scene comme plusieurs frame d'images qui s'enchainent comme pour simuler notre cinematique mais sans utiiliser comme base une video uniquement avec les outils d'images, on aurait des 5-5 images de divers plans et mises en scene pour reprensenter le moment ». Portée concrète : cinq images complètes avec cadrages distincts, maintenues quelques secondes et reliées par des coupes, pas une marche animée. L'opérateur a écarté le flipbook précédent ; l'avis de retour à la vidéo n'est pas adopté.

## Livraison artistique proposée

1. Le camp, avant le départ : ensemble large, groupe petit dans le lieu.
2. Ce que chacun porte : rapproché Maelor/livre, Marian en second plan.
3. Dans l'allée : trio complet, diagonale de profondeur.
4. Un regard partagé : casque/épaule d'Alistair au premier plan, Maelor/Marian en face.
5. Avant de franchir la porte : groupe arrêté à l'intérieur, composition large autour du feu.

Cinq appels de génération d'images intégré, chaque fois depuis les quatre seules références V2/camp canoniques. Aucun ancien MP4, extrait, image de l'étude illustrée ou du flipbook en input. Originaux et exactes requêtes conservés, copies projet byte-identiques SHA vérifiés. Fichiers : tools/cinematics/candidates/camp-five-stills-20261020 ; requests.json, results.json, provenance.json, cinq shot-0N.png et lecteur HTML/CSS/MJS. Compagnon artistique retrouvé en TXT/provenance conservé comme référence, pas nouveau contrat LOCKED.

Montage de revue proposé :4+3+5+4+4=20s, lecture sur demande et arrêt final, sélection de chaque plan, clavier, pause et curseur. Aucune durée runtime changée ; camp livré12s et traitement28s antérieur conservés. Pas de son, vidéo générée, pan, crop, fondu ou interpolation. Nouveau cadrage généré pour chaque image plutôt qu'un recadrage d'une seule plate.

Toute la scène reste dans LION_CAMP nocturne avant le dialogue existant. Le trio est un sous-ensemble de la compagnie, aucun franchissement, arrivée, nouvelle recrue, canon, événement, choix, gain ou dialogue ajouté. Aucun changement des propriétaires campagne/RunSystem/combat, V6, runtime, huit slots, MP4s, audio ou scheduler. Les anciens essais demeurent historiques intacts.

**Limites** : détails de costume/casque/livre et prises d'équipement varient ; lame du plan01 proche du sol, dégagement non certifié, et main d'épée du plan03 différente de la référence demandée. Aucun raccord d'équipement, géographie, art, marche continue ou appui accepté. Les nouvelles perspectives sont des propositions artistiques. Ces défauts restent visibles et documentés, sans réalignement ou collage pour les cacher.

Aperçu http://127.0.0.1:5456/, PID 13348, loopback à liste fermée de neuf fichiers +favicon204. Prochaine action : regarder ce même montage et juger les cinq compositions et le rythme avant correction ciblée d'un plan.

## Vérification du lecteur — 2026-10-21T02:37:03.762Z

Un seul scénario court du montage hors jeu : PASS11contrôles. Lecture réelle20s, passages aux plans02/03/04/05 à4/7/12/16s, arrêt20s sans boucle ; sélection des cinq images et flèches en pause ; clavier Home/End/flèches et curseur natif0.1s ; pause ; changement OS vers réduction des mouvements suspendant la lecture, sélection manuelle retenue ; images intégralement contenues sans transformation/débordement horizontal, cibles44px à1366×768/620×780/390×844 ; zéro erreur console/page nominale ; illustration manquante = statut explicite et lecture/seek désactivés. Quatre captures inspectées, une capture et un reçu sélectionnés dans le dossier. Le pilote temporaire ignoré est justifié par l'absence de runner existant pour ce lecteur autonome ; pas de nouvel outil QA persistant/job/campagne/save. Le vrai hidden/suspend audio du jeu reste ouvert : ce smoke ne le couvre pas.

Node syntaxe, TypeScript exit0, contracts:validate8contrats/8slots, barrière immuable f4aae63 et statut des chemins LOCKED vides, diff --check PASS. Aucun build ou test de gameplay nécessaire : runtime inchangé. Guardian PASS_SCOPED_ASSETS_AND_PROVENANCE : cinq paires copie/original et quatre inputs canoniques +requêtes/résultats vérifiés indépendamment, aucune divergence. Art/équipement/géographie non acceptés. Revue finale du reçu lecteur séparée en cours.

READY_FOR_PC_ACCEPTANCE conservé sans nouvelle étape de jeu ; mobile après PC, écoute16FX/cinqfamilles natives/vrai hidden et verdicts globaux art/équilibre/matériel restent ouverts. Les339jobs, leurs acceptations et le bloc MD exact sont préservés. Les anciens candidats01–05/flipbook/montage/P03/audio/objets différés restent intacts. Publication normale dev autorisée OD-2026-10-12-A ; aucun contrat LOCKED modifié, huit slots et camp12s livrés inchangés.

Guardian final PASS_SCOPED_CLOSEOUT : UI/ACCESSIBILITY et QA_EVIDENCE clos sur reçu11checks/source/driver/provenance/quatre captures, zéro mismatch, sans replay. Matrice set1.7.0 : GAME_CONSTITUTION PASS portée ; ART_DIRECTION/CHARACTERS/ENVIRONMENTS PASS proposition et provenance, acceptation artistique/équipement/géographie ouverte ; NARRATIVE/CAMPAIGN PASS camp pré-dialogue ; NARRATIVE_PRESENTATION PASS aperçu hors jeu ; UI/ACCESSIBILITY PASS lecteur ; QA_EVIDENCE PASS de portée ; REPOSITORY_GOVERNANCE PASS ; TRAVERSAL/COMBAT/SAVE N/A. Aucun contrat LOCKED changé.

## Retour sur les coupes et correction — 2026-10-21T04:10:05.307Z

L'opérateur conserve l'idée des cinq images mais observe « la coupure est trop brutal ». Correction locale du même lecteur : fondus enchaînés de1.2s (0.8s sous préférence OS de réduction), courbe smoothstep et image sortante opaque en dessous pour éviter un creux au noir. Le temps du montage pilote l'opacité : pause, seek et suspension figent aussi le fondu. Les durées4/3/5/4/4 et20s totales restent proposées ; chaque fondu occupe la fin du plan, sans allongement ni nouvelle image. Navigation manuelle entre plans en pause conservée pour l'inspection. Aucune interpolation spatiale ou animation d'acteur ; un fondu ne certifie pas une marche.

Les cinq PNG bruts et SHA sont inchangés. Ancien reçu des coupes conservé avec provenance commit9695c3e ; nouveau reçu review-receipt-crossfade-v2.json et capture review-crossfade-v2.png. Scénario ciblé PASS6contrôles : quatre fondus observés en temps réel entre les bonnes images, base opaque/images chargées, pause figée, arrêt20s, version OSreduce, sélection manuelle, mêmes géométries contenues1366/620/390, console0. Deux captures inspectées. Gates LOCKED/diff propres, syntaxe JS et validator8/8 PASS. Aucun nouveau job, média généré, runtime ou sauvegarde. Les limites artistiques d'équipement/géographie précédentes demeurent.

Prochaine action unique : regarder ce même montage adouci et juger les transitions et le rythme ; ne pas repartir vers vidéo/flipbook ou régénérer sans nouveau retour.

Guardian crossfade PASS_SCOPED_IMPLEMENTATION : diff3sources, driver6checks et deux captures inspectés, matrice présentation/UI/QA PASS de portée, autres lignes conservées. Condition de clôture effectuée : retour explicite enregistré et nouveau reçu lié aux hashes courants, ancien reçu/capture des coupes conservés comme preuves historiques de9695c3e.

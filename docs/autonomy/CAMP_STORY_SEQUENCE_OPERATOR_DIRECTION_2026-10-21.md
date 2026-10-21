# Camp — déroulement en huit images sur20s

MANUAL-CAMP-STORY-SEQUENCE-2026-10-21, UTC 2026-10-21T06:37:25.120Z. Baseline d76b1947cd76c951040b5a4727ff772681563e23, set1.7.0.

L'opérateur observe une amélioration du fondu puis demande : « il y a du mieux mais sur 20 secondes, je pense que nous pouvons ajouter d'autres images, et l'enchainement d'image doit vraiment raconter quelque chose donc l'enchainement de la situation en cours ». Portée manuelle concrète : huit situations liées plutôt qu'une simple succession de cadrages.

| Temps proposé | Image | État visible / lien recherché | Origine |
|---|---|---|---|
|0–3s|01|Le lieu et le groupe dans le camp|Image fixe01 précédente|
|3–5s|02|Maelor porte le livre|Image fixe02 précédente|
|5–7s|03|Il le ramène contre lui et le retient à deux mains|Nouvelle génération, continuité de02|
|7–9s|04|Marian reprend sa prise sur le bâton ; Maelor conserve le livre|Nouvelle génération|
|9–11s|05|Attention réciproque du groupe|Image fixe04 précédente|
|11–14s|06|Quelques pas locaux vers le regroupement, dans l'allée intérieure|Nouvelle génération, remplace l'ancien portrait de trio|
|14–17s|07|Le groupe est arrêté, toujours dans le camp|Image fixe05 précédente|
|17–20s|08|Orientation vers les compagnons, prêts pour l'échange existant|Nouvelle génération|

Les gestes et l'ellipse marche/arrêt sont des propositions de présentation tirées du traitement camp autorisé, sans ordre, serment, choix, gain, événement, recrue, franchissement ou départ accompli. Maelor ouvre déjà le dialogue courant, src/game/content.ts:214 ; aucun texte modifié ou inscrit dans les images. Le trio reste un sous-ensemble de la compagnie.

Quatre appels imagegen intégré : masters Marian/Maelor/Alistair, source canonique LION_CAMP et une image FIXE du montage précédent par nouveau plan. Quatre images réemployées byte-identiques ; aucune base vidéo/extrait/flipbook. Originaux, requêtes exactes, résultats, inputs et SHA conservés dans tools/cinematics/candidates/camp-story-sequence-20261021. Le montage précédent cinq images reste intact avec sa provenance/acceptation limitée.

20s de revue :3+2+2+2+2+3+3+3. Fondus smoothstep1s/OSreduce0.8s en fin de plan, lecture sur demande, pause figée, pas de boucle ni son ni pan/zoom/pose interpolée. Durées camp12s et proposition28s historiques inchangées, aucun runtime intégré.

**Limites** : l'intention de déroulement n'est pas une acceptation de compréhension/narration. Le seul dessin en pas ne prouve ni marche continue, ancrage ni cycles. Détails de casque/livre/étoffe/voile et prises d'accessoires variables, main d'épée finale08 différente de la référence demandée ; lame01 héritée proche du sol. Géographie reconstruite et ellipses non certifiées. Les défauts ne sont pas corrigés par collage, déplacement logiciel, crop ou interpolation. Aucun art/continuité/équipement/runtime accepté.

Aperçu http://127.0.0.1:5457/, PID 7596, loopback limité aux12fichiers nécessaires +favicon204. Prochaine action : regarder ce même déroulement à vitesse normale et juger si préparation → rapprochement → arrêt → attention avant dialogue se comprend sans explication supplémentaire. Aucune relance automatique ou adoption runtime.

## Vérifications — 2026-10-21T06:43:39.163Z

Un scénario court du lecteur : PASS10contrôles. Sept fondus observés en temps réel entre les huit images attendues, total20s/arrêt final sans boucle ; nouvelles actions03/04/06/08 accessibles à5/7/11/17s ; clavier et flèches alignés ; fondu doux OSreduce/pause figée ; images entièrement contenues et cibles44px sans débordement horizontal à1366×768/620×780/390×844 ; console/page0 ; image06 manquante = lecture désactivée avec statut. Trois captures inspectées ; reçu et capture de déplacement sélectionnés, pilote temporaire/sorties brutes ignorés conservés. Justification : les runners existants de jeu/campagne/vidéo ne ciblent pas ce lecteur autonome, aucun outil QA persistant ni nouveau job.

Types exit0, syntaxe JS, contracts8/8/8slots, barrière LOCKED immuable et worktree protégé vides, diff --check PASS. Aucun build/jeu rejoué : aucun runtime touché. Guardian PASS_SCOPED_ASSETS_AND_STORY_INTENT :8images/origines,7inputs,3records SHA vérifiés sans mismatch. Les changements visibles03/04/06/08 soutiennent la proposition au-delà des légendes, mais raccords/causalité/compréhension restent des ellipses éditoriales à juger. UI/QA encore à rapprocher du reçu final ; aucune acceptation opérateur inférée.

339jobs et acceptations/bloc MD exact préservés, toutes racines historiques/objets différés inchangés. PC global/art/équilibre/matériel/écoute16FX/cinqfamilles natives/vrai hidden restent ouverts ; mobile après PC. Aucun progrès de gameplay compté.

Guardian final PASS_SCOPED_CLOSEOUT : UI/ACCESSIBILITY et QA_EVIDENCE PASS sur reçu10checks et hashes reader/driver/provenance/trois captures sans divergence, pas de replay. Matrice complète : GAME_CONSTITUTION PASS portée ; ART_DIRECTION/CHARACTERS/ENVIRONMENTS PASS proposition/provenance, acceptations artistiques ouvertes ; NARRATIVE/CAMPAIGN PASS préservation ; NARRATIVE_PRESENTATION PASS proposition ; TRAVERSAL/COMBAT/SAVE N/A ; UI/ACCESSIBILITY PASS lecteur ; QA_EVIDENCE PASS de portée ; REPOSITORY_GOVERNANCE PASS. Set1.7.0, aucun LOCKED changé. Compréhension, causalité, art, locomotion et adoption runtime demeurent opérateur.

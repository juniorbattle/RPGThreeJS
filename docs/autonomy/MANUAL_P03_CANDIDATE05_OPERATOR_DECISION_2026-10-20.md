# P03 — autorisation explicite d'un seul candidat camp05

APPROVED DECISION — OD-2026-10-20-C, suite interactive20octobre2026.

Question présentée après [préparation du payload](P03_CONTINUOUS_PILOT05_PROPOSAL_2026-10-20.md) : « Le pilote P03 est préparé : MiniMax H3,10s en2K, images départ/arrivée, un seul essai (~1,30$US, plafond proposé1,50$US hors taxes), sans relance automatique ni remplacement du MP4. Autorises-tu explicitement le candidat camp n°05 et l'exception manuelle correspondante dans la garde ? L'autorisation OD-2026-10-19-D est limitée au n°04. »

Réponse humaine exacte : **« Autoriser un seul candidat05, plafond1,50$US hors taxes »** (option choisie : « Autoriser un seul candidat05, plafond 1,50 $US hors taxes »).

`MANUAL_CAMP_P03_CANDIDATE_05_APPROVED`

Cette réponse autorise **une seule soumission payante** manuelle MiniMax-H3/10s/2K, candidat camp05, avec pose `p03-support-v3.png` comme première image et `p03-stop-v1.png` comme dernière. Le prompt exact approuvé est `tools/cinematics/candidates/manual-p03-20261020/pilot-motion-prompt.txt`, SHA256 `cc0abd436a2ad4377e383038c5ff6c5cccfb7da65f8f56d2928afcf510a66bbb`. Les deux sources/SHA sont dans la proposition ; ne pas renuméroter05 en01/04 ou réinitialiser les tentatives antérieures. Budget maximum1,50$US hors taxes, estimation officielle1,30$US pour ce payload uniquement ; aucune vidéo/audio supplémentaire ni relance payante automatique. Aucun verdict artistique sur les poses ou la vidéo n'est impliqué.

Adaptation autorisée du runner existant : exception05 strictement manuelle, liée à cette décision et aux sources/dernière image/prompt/sortie/modèle/durée/résolution/budget ; `last_frame` optionnel borné pour ce candidat et reprise liée aux deux images. Refus05sansautorisation,06+, usages autonomes et anciens refus04 conservés. Prompt envoyé byte-identique, sans ajout de boilerplate. Réserver le checkpoint exclusivement avant soumission ; toute issue POST incertaine sans taskId impose arrêt, aucune nouvelle soumission. Une tâche existante se reprend seulement par requêtes sur son ID.

Préimplémentation guardian PASS_SCOPED_PREIMPLEMENTATION ; actual-diff review et tests refus/reprise/requête mockée avant accès fournisseur. Usage de la clé locale par le runner, transmission des deux images/prompt à MiniMax, interrogation et téléchargement de cette unique tâche autorisés ; aucun secret ne doit être affiché, copié ou committé. Conserver brut et métadonnées, master de revue silencieux, captures/constats1× et rejets. Pas de remplacement MP4, changement runtime/durée/portrait/audio, neuvième slot, nouveau canon/choix/ressource, modification V6 ou scheduler. Récurrence toujours sans génération/polling ; main protégé. Publication normale des checkpoints cohérents sur dev autorisée OD-2026-10-12-A.

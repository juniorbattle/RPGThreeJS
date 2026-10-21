# Camp — flipbook généré sur une base neuve

APPROVED MANUAL SCOPE — `MANUAL-CAMP-FLIPBOOK-2026-10-20`, date client20octobre2026. L’opérateur corrige explicitement l’essai précédent : « Non je veux que tu partes sur une base saine donc sans te baser sur la video prrecedement genere mais on utilisant les outils de generation image... et on part sur un style flipbook ».

Cette tâche manuelle produit une nouvelle base et des poses successives avec `imagegen` intégré, puis un aperçu flipbook hors jeu. Références initiales : masters V2 Marian/Maelor/Alistair et source canonique LION_CAMP seulement. Aucun candidat, image préparatoire antérieure, MP4, frame extraite ou ancien montage utilisé comme input. Une nouvelle image de cette session peut servir de référence aux poses suivantes. Aucun MiniMax, génération vidéo, nouveau canon, musique, intégration runtime, remplacement de média ou changement LOCKED autorisé par cet essai. Les huit slots et leurs12s camp livrées restent en place. L’adoption finale reste ouverte.

## Production en cours

Nouvelle base `tools/cinematics/candidates/flipbook-camp-20261020/base-v1.png`, entrée canonique seulement. Premier essai de planche3×3 : poses successives mais translation excessive vers le bord droit et lame coupée dans certains panneaux. Correction ciblée insuffisante ; `atlas-a-v1-rejected.png` et `atlas-a-v2-rejected.png` conservées, **écartées du flipbook**. Aucun repositionnement ou alignement de pixels pour les réparer.

Méthode poursuivie : génération séparée de chaque pose depuis la nouvelle base, à pleine résolution, pour mieux contrôler l’amplitude et le cadre. But proposé :18poses à6i/s (~3s), caméra tenue, décor et volumes continus, transferts d’appui et équipement persistant, marche puis arrêt DANS le camp avant dialogue. Ce nombre ne certifie pas des cycles complets ou une locomotion validée. Pas d’interpolation, pan/crop animé, extraction vidéo ou sprites plaqués pour simuler un mouvement.

Préflight propre sur dev, verrou `codex-manual-camp-flipbook-20261020`, baseline `0610d8017c797fac092a489e74daf77e04101dd7`, immutable LOCKED `f4aae63e792025430c16153e1cd329c20745cf6b`, set1.7.0. Guardian PASS_SCOPED_PREIMPLEMENTATION : génération manuelle explicite permise, intégration/adoption non permises. Sources brutes/prompts/provenances et limites seront conservés ;339jobs et faits historiques préservés.

## Livraison — 2026-10-21T02:15:20.357Z

18 dessins complets et distincts : base-v1 puis frame-001 à frame-017, affichés dans cet ordre. 20 appels imagegen intégré au total : une nouvelle base, deux planches rejetées, 17 poses individuelles. Les 18 fichiers affichés sont identiques aux sorties brutes conservées, SHA vérifiés ; aucun recadrage, réalignement, interpolation, sprite ou ancienne vidéo en input. Les références initiales sont uniquement les quatre sources canoniques détaillées dans provenance.json. Chaque pose ultérieure utilise uniquement cette nouvelle base. Les planches rejetées restent exclues.

Aperçu hors jeu : http://127.0.0.1:5455/ (PID 25924, serveur loopback avec liste fermée de fichiers, volontairement conservé). Lecture sur demande, 6 images/seconde, trois secondes, arrêt final ; pause, cadence 4/6/8, flèches, Home/End, curseur et galerie des 18 dessins. Démarrage en pause ; masquer la page ou modifier la préférence OS suspend la lecture. Aucun son ni fichier vidéo créé. Les dimensions brutes 1672×941 et 1671×941 sont conservées et contenues dans le lecteur.

**Limites visuelles** : poses et positions des acteurs sautent entre certains dessins, prises d'équipement et silhouettes varient. Les contacts des pieds, transferts de poids, marche continue et deux cycles complets par acteur ne sont pas certifiés. Les 18 images uniques ne constituent pas une preuve de locomotion. Le style flipbook est présenté pour revue, sans acceptation artistique, géographique, d'équipement, de marche ou d'intégration.

Vérifications : contracts:validate 8 contrats/8 slots ; TypeScript exit0 ; diff --check ; barrière LOCKED immuable vide. Un scénario court du lecteur a passé 11 contrôles, dont lecture réelle jusqu'à l'arrêt à trois secondes, commandes/clavier, pause, changement OS, trois largeurs 1366/620/390 sans débordement horizontal et cibles 44px, galerie, erreur explicite si dessin manquant, console nominale vide. Captures début/fin/étroit inspectées. Le pilote temporaire ignoré est justifié parce que les runners de campagne existants ne ciblent pas cet aperçu HTML autonome ; aucune campagne rejouée, aucun nouveau job QA. Reçu sélectionné et capture de début conservés dans le dossier. Espacement de libellés seulement corrigé après le smoke, sans changement comportemental. Pas de build de production ni tests du gameplay : aucun source runtime touché.

Guardian : PASS_SCOPED_CLOSEOUT, vérification indépendante des 18 SHA et quatre inputs sans divergence, inspection des sources/requêtes/captures/limites. Matrice : constitution, ART_DIRECTION, CHARACTERS, ENVIRONMENTS, NARRATIVE/CAMPAIGN, NARRATIVE_PRESENTATION, UI/ACCESSIBILITY, QA et gouvernance PASS de portée ; COMBAT/SAVE/TRAVERSAL N/A. Pas d'acceptation artistique inférée.

339 jobs, leurs acceptations et le bloc MD exact préservés ; anciennes vidéos/candidats01–05, étude illustrée, P03, V6, audio, objets différés, huit slots et durée camp12s inchangés. Scheduler conservé. Ce travail manuel ne donne aucune autorisation de génération récurrente, nouvelle vidéo payante, adoption générale du flipbook ou remplacement runtime.

**Une prochaine action** : l'opérateur regarde ce même essai à 6 i/s et donne un verdict sur le style flipbook ; cibler ensuite les poses qui sautent si cette direction lui convient. Ne pas relancer une génération/audit sans nouveau retour précis.

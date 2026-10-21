# Camp — flipbook généré sur une base neuve

APPROVED MANUAL SCOPE — `MANUAL-CAMP-FLIPBOOK-2026-10-20`, date client20octobre2026. L’opérateur corrige explicitement l’essai précédent : « Non je veux que tu partes sur une base saine donc sans te baser sur la video prrecedement genere mais on utilisant les outils de generation image... et on part sur un style flipbook ».

Cette tâche manuelle produit une nouvelle base et des poses successives avec `imagegen` intégré, puis un aperçu flipbook hors jeu. Références initiales : masters V2 Marian/Maelor/Alistair et source canonique LION_CAMP seulement. Aucun candidat, image préparatoire antérieure, MP4, frame extraite ou ancien montage utilisé comme input. Une nouvelle image de cette session peut servir de référence aux poses suivantes. Aucun MiniMax, génération vidéo, nouveau canon, musique, intégration runtime, remplacement de média ou changement LOCKED autorisé par cet essai. Les huit slots et leurs12s camp livrées restent en place. L’adoption finale reste ouverte.

## Production en cours

Nouvelle base `tools/cinematics/candidates/flipbook-camp-20261020/base-v1.png`, entrée canonique seulement. Premier essai de planche3×3 : poses successives mais translation excessive vers le bord droit et lame coupée dans certains panneaux. Correction ciblée insuffisante ; `atlas-a-v1-rejected.png` et `atlas-a-v2-rejected.png` conservées, **écartées du flipbook**. Aucun repositionnement ou alignement de pixels pour les réparer.

Méthode poursuivie : génération séparée de chaque pose depuis la nouvelle base, à pleine résolution, pour mieux contrôler l’amplitude et le cadre. But proposé :18poses à6i/s (~3s), caméra tenue, décor et volumes continus, transferts d’appui et équipement persistant, marche puis arrêt DANS le camp avant dialogue. Ce nombre ne certifie pas des cycles complets ou une locomotion validée. Pas d’interpolation, pan/crop animé, extraction vidéo ou sprites plaqués pour simuler un mouvement.

Préflight propre sur dev, verrou `codex-manual-camp-flipbook-20261020`, baseline `0610d8017c797fac092a489e74daf77e04101dd7`, immutable LOCKED `f4aae63e792025430c16153e1cd329c20745cf6b`, set1.7.0. Guardian PASS_SCOPED_PREIMPLEMENTATION : génération manuelle explicite permise, intégration/adoption non permises. Sources brutes/prompts/provenances et limites seront conservés ;339jobs et faits historiques préservés.

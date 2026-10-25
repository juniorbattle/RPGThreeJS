# Lecteur d'animation par frames des acteurs narratifs — pilote OD-2026-10-24-B, côté Claude

Run claude-frame-player-20261025T0709Z (agent claude, session interactive). Étape P2 d'[OD-2026-10-25-A](../CLAUDE_INTEGRATION_AND_CLEANUP_OPERATOR_DECISION_2026-10-25.md) : Claude écrit le lecteur, une session Codex dédiée produit les frames. [Direction](../PLAYABLE_FLOW_SPRITES_VFX_DIRECTION_2026-10-24.md), lignes 40 à 45.

## Résultat

- `src/cinematics/NarrativeActorFrames.ts`, qui contient :
  - le type de liaison (tableau, phases, acteur, frames, cadence) ;
  - le registre `NARRATIVE_ACTOR_FRAME_BINDINGS`, **vide** tant qu'aucun candidat n'est revu ;
  - un validateur : au moins deux frames, cadence finie entre 80 et 2 000 ms, au moins une phase, une seule animation par acteur et par phase ;
  - `NarrativeActorFramePlayer`.
- Le lecteur :
  - ignore toute liaison invalide, même passée directement en option ;
  - une seule horloge par surface, monotone (`performance.now`), active seulement si un acteur lié est monté, visible et autorisé à bouger ;
  - écouteurs (préférence OS, visibilité) posés seulement tant qu'un acteur est animé ;
  - chargement de toutes les frames avant la première image ; une frame est prête dès son événement `load`, le pré-décodage n'est qu'opportuniste ; images gardées en cache (32 au plus) jusqu'au dispose ;
  - seule une vraie erreur (`error` ou décodage rejeté) renvoie au master, et cette frame est retentée au retour de la phase ; une frame qui n'arrive jamais laisse le master, sans horloge ;
  - rien n'est chargé tant que la page est cachée ;
  - le master reste affiché pendant le chargement, si une frame manque, en mouvement réduit (OS ou jeu) et si la couche optionnelle échoue, car toute exception la désactive ;
  - un changement de préférence OS s'applique tout de suite, dans les deux sens ;
  - le master revient et les écouteurs sont retirés au dispose ;
  - il n'écrit qu'un attribut `src` et deux `data-*` sur la figure ; aucun état de jeu, rien en V6, aucun focus ni réplique.
- `NarrativeSceneSurface` :
  - nouvelle option `frameBindings` (par défaut le registre filtré sur le tableau) ;
  - `sync` à la fin de `mountActors`, donc à chaque phase réellement montée, y compris pour un acteur dont le DOM est conservé, jamais pour une phase périmée ni après dispose ;
  - `refresh` après `mount` ; `dispose` avant de vider le cast.
  - Sans liaison, aucun écouteur, timer ni attribut : tous les tableaux actuels sont inchangés.
- Le réglage « mouvement réduit » du jeu ne se change que sur la carte des POI. Chaque `NarrativeStage` le lit à sa création : il ne peut donc pas changer pendant un tableau.

## Vérification

- 19 tests dans `NarrativeActorFrames.test.ts`. Côté lecteur :
  - liaisons invalides, ordre de la boucle sur une seule horloge ;
  - frame manquante puis nouvel essai, erreur de chargement, frames jamais arrivées puis chargées alors que le décodage reste bloqué, chargement abandonné au dispose ;
  - réduction jeu et OS au départ, changement OS dans les deux sens ;
  - page cachée (sans chargement) puis reprise ;
  - acteur détaché, changement, perte et retour de liaison avec DOM conservé ;
  - écouteurs seulement pendant l'animation, échec de la couche optionnelle.

  Côté surface, sur `CAMP_DEPARTURE_TABLEAU` :
  - seul le `src` change (même nœud, autres attributs identiques), spec intacte ;
  - surface préparée détachée puis montée ;
  - phases avec DOM conservé, sortie puis retour d'Alistair ;
  - option de mouvement réduit ;
  - inertie par défaut (ni écouteur, ni timer, ni attribut).
- Deux mutations vérifiées :
  - sans le `refresh` de `mount()`, le test de la surface préparée détachée échoue ;
  - sans la garde, le test d'échec de la couche optionnelle échoue.
- Deux défauts trouvés et corrigés :
  - un acteur prêt pendant qu'il était détaché sautait sa première frame au montage (trouvé par les tests) ;
  - dans une fenêtre qui ne peint pas, Chromium retient `decode()` indéfiniment alors que l'image est chargée en 8 ms. Avec la borne de 750 ms du premier jet, la boucle tombait définitivement sur le master, et `CAMP_DEPARTURE_TABLEAU` n'a qu'une phase. Trouvé à l'essai réel ; la disponibilité repose désormais sur `load`.
- Résultats : `npm test` : 161 fichiers, 2 833 tests, puis node:test 26/26. `tsc`, `npm run build`, `contracts:validate`, `cinematics:validate-narrative-staging`, `git diff --check` et gate LOCKED : verts.
- Essai réel dans Chromium (serveur de dev par `preview_start`, arrêté ensuite). Frames de fixture : le master sous quatre URL, rien de commité.
  - Le panneau signale « mouvement réduit » côté OS : `STILL_REDUCED_MOTION`, master affiché.
  - Préférence simulée à « non », sur la version finale et dans l'état où `decode()` reste bloqué : boucle 0→1→2→3→0 à 250 ms. Bascule à « réduit » : master immédiatement, sans horloge. Retour : la boucle reprend. Après dispose : 0 écouteur.
  - Frame absente : `FALLBACK_MASTER`.

## Revues

`narrative-tableau` et `combat-vfx-sprites` : rien de bloquant. Ce qui a été appliqué :
- écouteurs paresseux, ce qui évite une fuite sur les chemins de `NarrativeStage` qui abandonnent une surface sans dispose ;
- garde de la couche optionnelle ;
- images décodées conservées ;
- échec non mémorisé ;
- cadence finie et bornée dans le lecteur ;
- horloge monotone ;
- aucun chargement en page cachée ;
- tests ajoutés pour chaque trou signalé.

Notes laissées ouvertes :
- Le chargement des frames démarre au montage, en parallèle du décodage du master et du décor. Il ne peut pas retarder la disponibilité, mais il partage la bande passante. À mesurer pendant la passe mobile.
- Une liaison ne fige pas le master dont ses frames dérivent. Ajouter un champ « master attendu » au moment d'écrire la liaison d'Alistair, pour rester sur le master s'il change.
- Les drivers QA qui lisent `img.currentSrc` (`tools/dialogue/run-static-tableau-v2-review.mjs`, `run-journey-scene-review.mjs`) verront la frame affichée. `data-frame-animation` permet de les distinguer.
- Main d'épée et accessoires asymétriques sous le miroir `data-facing="LEFT"` : contrôle artistique sur les vraies frames.

## Prochaine action

Côté opérateur : lancer la session Codex dédiée qui produit `tools/characters/candidates/alistair-idle/v1/` selon la direction. Il faut quatre frames traitées en PNG séparés (une planche 2×2 seule ne suffit pas au lecteur), de même taille 512×512 et de même ancrage des pieds que le master, avec leur provenance.

Ensuite, côté Claude :
- ajouter la liaison `CAMP_DEPARTURE_TABLEAU` / `CAMP_DEPARTURE` / `alistair` au registre, avec le master attendu ;
- vérifier la boucle à taille de jeu, sans flash au changement de frame, et face au miroir ;
- soumettre la comparaison à l'opérateur ;
- puis une action combat complète d'Alistair.

Compteurs : {"runtimeSourceFilesModified":2,"runtimeSourceFilesAdded":1,"gameplayFilesModified":0,"testFilesModified":1,"newMedia":0,"imagegenCalls":0,"qaScenarios":1,"newQaJobs":0,"inheritedQaJobs":365,"liveQaJobsAfter":3,"inheritedWipPaths":0,"workflowFiles":3,"productProgress":1}. Publication normale sur origin autorisée par OD-2026-10-12-A.

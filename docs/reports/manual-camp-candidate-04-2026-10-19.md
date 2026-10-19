# Camp — candidat manuel04 à examiner

| Field | Value |
| --- | --- |
| TASK | MANUAL-CAMP-CANDIDATE-04 / OD-2026-10-19-D |
| DOMAIN | Source intégrée, génération manuelle et contrôle du lecteur |
| BASELINE | dev @ 671c6eebed2872dd8284b3dbe7c55e883bba0d06 |
| BRANCH | dev |
| HEAD | Source/garde : b13279d218ae0f0de3a5500d37ab922da96cdffb ; checkpoint de preuve/clôture dans Git et mémoire d’automatisation |
| STATUS | REVIEW — READY_FOR_OPERATOR_REVIEW ; acceptation artistique et intégration non accordées |
| MERGED_IN | NONE — checkpoint dev direct autorisé |
| SUPERSEDES | NONE — candidats01–03/rejets/provenances et audit du19octobre conservés |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Aucun média/runtime de production modifié ; garde d’outil bornée à la soumission manuelle04 explicitement autorisée |
| CANONICAL_DOCS_UPDATED | Décision manuelle, ledger, remaster, état et handoff |
| EVIDENCE | [Preuve source/média/revue](manual-camp-candidate-04-2026-10-19/proof.json), planche existante décodée et échantillons ; sorties brutes/master/QA dans tmp/cinematics |

**APPROVED DECISION.** Après « Okay Go », l’opérateur a explicitement choisi « Nouvelle série MiniMax : j’autorise explicitement le dépassement du cap pour le camp ». [OD-2026-10-19-D](../autonomy/MANUAL_CAMP_CONTINUATION_OPERATOR_DECISION_2026-10-19.md) engage ce chantier manuel, sans réactiver la génération récurrente ni modifier les contrats ou le scheduler. Les trois anciens essais gardent leur numéro et leur rejet ; le nouveau est04. Une seule nouvelle tâche payante a été soumise, ID454200539038213.

## Média livré pour revue

- [Source corrigée](../../tools/cinematics/candidates/manual-camp-20261019/candidate-04-source.png),1672×941, SHA `ee04113053ce19c88a409cf0789a8abdc1fc828a305272ee83dbe66520a33ed0`, produite avec `imagegen` intégré depuis le camp promu et les trois masters actuels. [Prompt exact](../../tools/cinematics/candidates/manual-camp-20261019/source-prompt.txt) et [provenance](../../tools/cinematics/candidates/manual-camp-20261019/candidate-04-provenance.json) conservés.
- Original MiniMax-H3 : `tmp/cinematics/cin4/production_manual_camp_20261019/shot_01/candidate_04_raw.mp4`,2560×1440/24fps/12,25s,14901521octets, SHA `ed202694fe565915cacbbbf5fc59e7f182a3f16981d684e90a94572514dc4317`. Son audio fournisseur n’est pas activé dans le jeu.
- **Version de revue silencieuse** : [candidate_04_master.mp4](../../tmp/cinematics/cin4/production_manual_camp_20261019/shot_01/candidate_04_master.mp4),1920×1080/24fps/12s, SHA `6258be9b4538ef81596e5eb6b969c62776bcb8c5c67df02c9254201660acc8c2`. Master sans overscan, audio retiré, source plus longue que12s donc pas de queue visuelle à prolonger. Ces MP4 sont volontairement ignorés ; leurs chemins/SHA/provenances sont conservés, jamais régénérés silencieusement s’ils manquent ailleurs.

**CURRENT FACT — revue des échantillons décodés.** Le groupe progresse vers la droite contre les mêmes repères stables ; positions des jambes et des tissus changent, puis une formation posée est visible en fin de séquence. Cette progression est plus explicite que le candidat03 presque immobile. Le livre et la dague de Maelor, le voile et le bâton de Marian, le casque fermé/l’armure/le plastron rouge actuel et l’épée unique d’Alistair restent reconnaissables. Croissant, château/aqueduc, rivière, tentes et ambiance nocturne restent cohérents. Aucun nouvel acteur, événement ou résultat n’est adopté.

La source et les frames ont été inspectées par le reviewer `cinematics-journey` : **READY_FOR_OPERATOR_REVIEW avec conditions**. Ce verdict ne certifie pas une marche parfaite : les images à1/2fps ne prouvent ni deux cycles complets ancrés par acteur, ni l’absence de glissement, ni la qualité à vitesse normale. Les deltas de pixels restent des diagnostics, pas une acceptation du mouvement.

**Points à regarder avant toute sélection :** la pointe de l’épée reste très près du sol pendant l’avance ; sa garde au sol propre n’est pas établie. Les pieds/lame tardifs approchent ou entrent légèrement dans la zone basse réservée de15% ; la visibilité paysage des échantillons n’est pas une certification du cadrage portrait/contrôles pendant tout le clip. Le naturel de la cadence, l’arrêt et la finesse pixel dans le mouvement restent à juger sur la vidéo silencieuse à vitesse normale. Aucun défaut d’identité ou disparition d’équipement justifiant un rejet automatique n’a été démontré dans ces échantillons.

## Garde technique de la tentative04

L’adaptateur existant refusait toute tentative>3. L’exception ajoutée exige04/camp/OD-D/manualOnly, un marqueur de décision fixe et la concordance exacte séquence/shot/modèle/durée/résolution/SHA source/SHA prompt/sortie/SHA décision, **avant** la lecture interne du credential et toute requête. Chemin d’autorisation contenu sous les specs, source valide, non-écrasement et reprise d’un même taskID restent protégés. La reprise lie aussi chemin/SHA de l’autorisation et SHA de la décision ; les anciens checkpoints01–03 sans ces champs restent compatibles.

Par défaut04 refuse toujours ;>04 refuse même avec le document. Ce mécanisme ne transforme pas le choix manuel en permission de génération récurrente. Guardian préimplémentation puis actual-diff **PASS avant soumission** ; les61tests ciblés passent (43cas cap/reprise et18spec), TypeScript exit0, spec/source PASS, contrats8/8+8slots, barrière LOCKED et whitespace PASS. Un libellé méthode de source initialement trop spécifique a été corrigé vers la valeur existante exigée par le validateur, sans changer celui-ci.

## Lecteur et limites de preuve

Le runner existant `run_production_eight_slot_media_qa.mjs` est filtré sur le seul camp et le nouveau master, dans un serveur DEV dédié5445. **11/11cas passent**, receipt final `manual-camp04-player-fixed-20261019` SUCCEEDED/exit0, digest `ccbe83673b5b257482082c033e45a4ab690d2eb5d4d7edd090ecb33f7dc8b71e` ; six critères de concordance/revue éligibles vrais. Lecture naturelle1920, hold390, skip/reduced1920/1366/620/390 et panne média390 : décodeur, horloge, sortie/cleanup et localStorage isolé inchangé. Le runner n’est pas modifié. Son wrapper de receipt reste ignoré.

Premier job conservé FAILED/NOT_ACCEPTED : ses11cas passaient, mais le helper générique exige aussi `errors` au niveau global alors que le runner les conserve par cas. UNE correction du wrapper agrège exactement ces tableaux sans changer le driver ni ses assertions ; même vidéo/paramètres/assertions dans un nouveau dossier. Le résultat original, le receipt échoué et le final restent distincts. Aucun parcours campagne/combat, sauvegarde fabriquée, résultat injecté ou nouvelle acceptationV6 n’est revendiqué.

CapturePC1366 : trois corps/équipements et commandes visibles au moment du skip. **Défaut visuel candidat démontré en portrait390** : Marian est presque entièrement coupée à gauche, bord droit d’Alistair coupé. Le PASS mécanique du skip n’annule pas cette défaillance de composition. Donc candidat prêt pour **revue PC opérateur seulement**, cadrage portrait non accepté et aucune promotion de production. Les réserves sur la lame et les cycles d’appui à vitesse normale restent ouvertes.

Les huit MP4 livrés et les anciens candidats restent inchangés ; les337jobs préexistants et objets différés/audio gardent leur portée. **Deux nouveaux jobs** sont conservés (wrapper échoué puis final), soit **339au total**. Aucun build n’est relancé pour modifier la production : le test est explicitement isolé **DEV**, avec source runtime inchangée et inventaire du build existant déclaré seulement comme contexte du receipt. Pas d’acceptation de campagne, globalPC, portrait/mobile, équilibre, matériel ou audio natif hidden/suspend déduite. La nouvelle vidéo n’est pas promue dans public/assets/cinematics.

## Conformité

Contrats concernés : constitution, WORLD_AND_CHARACTERS, PRESENTATION_AND_MEDIA, AUTHORING_AND_QA, AUTONOMOUS_WORK_PROTOCOL, frontières campagne/UI ; set1.7.0, baseline immuable f4aae63e792025430c16153e1cd329c20745cf6b. Aucune règle LOCKED modifiée.

| Domaine | Verdict pour ce candidat manuel |
| --- | --- |
| GAME_CONSTITUTION | PASS — slot existant, aucun propriétaire de vérité changé |
| ART_DIRECTION | PASS préparation/revue ; acceptation artistique PENDING_OPERATOR |
| CHARACTERS | PASS préparation — références actuelles, provenance et limites temporelles explicites |
| ENVIRONMENTS | PASS préparation — camp nocturne promu, continuité échantillonnée |
| NARRATIVE / CAMPAIGN | PASS conservation — départ seulement, aucun canon inventé |
| NARRATIVE_PRESENTATION | PASS candidat séparé — aucun nouveau droit de hold/dialogue ni intégration runtime |
| TRAVERSAL | N/A — moteur physique absent, POI inchangés |
| COMBAT | N/A — résolution/équilibre inchangés |
| SAVE | PASS conservation — aucun champ ou owner modifié ; preuve lecteur isolée seulement |
| UI / ACCESSIBILITY | PASS technique borné ; portrait390 VISUAL_FAIL, acceptation complète du candidat ouverte |
| QA_EVIDENCE | PASS11cas lecteur isolé/receipt final ; premier échec de wrapper conservé et limites visuelles explicites |
| REPOSITORY_GOVERNANCE | PASS source/garde et sélection de preuve — verrou exclusif, chemins sélectionnés, dev normal ; métadonnée de clôture dans Git/mémoire |

Guardian final : **ACCEPTED_SCOPED_ISOLATED_DEV_PLAYER_ONLY**, après lecture du receipt/résultat/wrapper, vérification du digest et inspection des deux capturesUI. Acceptation de revue enregistrée séparément ; les receipts bruts restent NOT_ACCEPTED. Les réserves mouvement/lame et le défaut portrait restent ouverts. Deux reviewers réutilisés, aucune nouvelle génération après04.

**ONE next action :** regarder le master silencieux à vitesse normale et juger la marche, la pointe d’épée et le cadrage avant toute sélection artistique ou intégration. Aucune seconde nouvelle soumission n’est lancée pour combler ces réserves par inférence.

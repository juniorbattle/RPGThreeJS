# Huit cinématiques existantes : disposition et première correction

| Field | Value |
| --- | --- |
| TASK | CINEMATIC-EIGHT-SLOT-EXISTING-MEDIA-AUDIT / OD-2026-10-19-C |
| DOMAIN | Présentation, médias existants et préparation artistique |
| BASELINE | dev @ 578dc4dca39eeb1ce7818b0572c87368fc11fd2e |
| BRANCH | dev |
| HEAD | Checkpoint contenant ce rapport dans Git ; SHA final dans la mémoire d’automatisation |
| STATUS | COMPLETE_SCOPED — audit et préparation ; remaster artistique EXTERNAL_MANUAL_WORKSTREAM |
| MERGED_IN | NONE — checkpoint direct dev autorisé |
| SUPERSEDES | NONE — audits, prompts, tentatives et acceptations historiques conservés |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | NONE — aucun code, MP4, keyframe, save, audio ou paramètre scheduler modifié |
| CANONICAL_DOCS_UPDATED | CINEMATIC_EIGHT_SLOT_REMASTER.md, CINEMATIC_STRUCTURE_READINESS.md, DEMO_COMPLETION_PLAN.md, état et handoff |
| EVIDENCE | [Inventaire SHA daté](cinematic-existing-audit-2026-10-19/inventory.json), 24 frames sources existantes, anciennes planches/captures et preuves ci-dessous ; aucune nouvelle exécution gameplay |

**CURRENT FACT — 2026-10-19.** Les huit IDs de `ApprovedProductionVideos.ts`, les huit descripteurs avec source du manifeste et les huit entrées du brief concordent exactement. Le neuvième descripteur `qa-placeholder` n’a aucune source et reste réservé au laboratoire. Les huit MP4 totalisent **151935283 octets** ; leurs SHA sont identiques à l’inventaire du 2 octobre. Les 24 frames premier/milieu/fin existent et correspondent à leurs SHA. Elles ont été réinspectées, sans nouvelle extraction. Ce contrôle établit la provenance, pas une acceptation artistique ni un nouveau test de lecture.

Les six masters candidats et leurs six originaux sont présents et correspondent aux SHA des preuves antérieures. Les trois keyframes suivies et leurs provenances sont présentes et concordantes. Parmi les chemins d’évidence examinés, seul `tmp/cinematics/cin4/production_eight_bois_clair_arrival_v1/shot_02/source.png` est absent : c’est un bloc à préparer historiquement, pas un clip perdu dont la production aurait été acceptée. Rien n’a été régénéré.

## Ce qui se conserve et ce qui se corrige

« Conserver en production » signifie garder les octets actuels jusqu’à remplacement explicitement accepté. **Aucune des huit lignes ne vaut PASS artistique.** Les colonnes mouvement distinguent l’observation des frames et les reviews temporelles historiques ; trois images fixes ne certifient pas la fluidité ou la cadence de tout un clip.

| Slot / média actuel et candidat | Identités, décor et continuité constatés | Mouvement / rythme lisible | Défaut démontré et disposition |
| --- | --- | --- | --- |
| `camp_departure`, 12s, SHA `a56678969bfb…`. Trois candidats 12s : masters `5175e7291c30…`, `d078d47f1c18…`, `a1ec6df5632b…` ; preuves active-motion initiale/followup/finale. | Source livrée au couchant ; Maelor visage découvert/livre ouvert et silhouettes historiques, face au camp nocturne promu et aux V2 masqués. Keyframe candidate nocturne cohérente en repères, mais Alistair antérieur au 13 octobre. | Source : changement d’échelle/position entre les échantillons. Candidat1 : marche réelle, livre disparaît/lune dérive ; candidat2 : livre/lune mieux retenus, pixel construction non acceptée ; candidat3 : formation presque au repos, parallaxe malgré caméra demandée fixe. | **Première correction retenue : départ physique nocturne à trois acteurs, détaillé ci-dessous.** Garder le MP4 ; candidats rejetés, cap3 consommé et fermé avec le pipeline actuel. Aucun quatrième essai automatique. |
| `alaric_audience_arrival`, 12s, SHA `b82318058222…`. Deux candidats : `39d496bc38fb…`, `36c89493d842…`. | Source : salle sous tente différente de la salle promue de pierre/vitraux ; Alaric/Maelor/Seraphine dévoilés. Alistair visible en ouverture/fin, absent de l’échantillon médian : raccord à reprendre, sans conclure au mécanisme exact. Candidat2 rétablit l’axe du hall et quatre corps complets ; Alistair ancien. | Historique candidat2 : vrais premiers pas puis écoute ; Alaric debout, équipement/livre conservés. Pixel détail et cadence de cour restent non acceptés. | Conserver le MP4 et candidat2 comme progrès seulement ; reprise manuelle des identités/raccords et de la progression approche→réaction→écoute. Candidat1 rejeté pour papier inventé/équipement perdu/cadrage final. Aucun mandat ni avance présumé. |
| `bois_clair_arrival`, 20s, SHA `a37d39766596…`. Un candidat **shot1 de10s**, master `b0e80d01845f…`. | Source ancienne : place sombre à maisons détruites, Alistair puis voleur/villageoise ; ne prouve pas Cedric recruté. Candidat : rue/palisade/chariot/église/crête ambrés promus, Alistair ancien. Aucun shot2/source intégrée présent. | Review limitée shot1 : vrais pas d’arrivée puis arrêt/attention, feu/fumée indépendants. Capture390×844 : tête/épée/Passer visibles mais bord gauche armure/cape coupé. | Garder le MP4 ; conserver PASS **bloc limité ancien** et le défaut portrait, jamais acceptation20s. Reprise manuelle du cadrage, référence Alistair et raccord à un second bloc encore incomplet. Choix secours/réserves intact. |
| `bois_clair_saved`, 18s, SHA `a57d9ef8ff2f…`. Aucun candidat produit. | Frames livrées : mère/enfant puis ancien Maelor et villageoise dévoilés ; village encore très en flammes. Décor promu sauvé : mêmes repères de rue endommagée, lumière/feux apaisés, aucune reconstruction instantanée. | Frames : changement de cast/composition puis cadrage plus serré ; elles ne prouvent pas une action continue. Cible future : reprise de souffle et réaction à l’aide, sans paiement visualisé. | Garder MP4/branche ; correction artistique manuelle de l’état sauvé, V2 et raccord humain. Le choix des provisions suit, sans donation ni récompense prédécidée. |
| `bois_clair_sacrificed`, 18s, SHA `db07031a3105…`. Aucun candidat produit. | Source : villageoise isolée puis ancien Maelor ; même place en flammes que l’autre résultat. Décor promu sacrifié : ruines/gris/fumée et repères propres, V2 villageoise voilée/Maelor masqué. | Inclinaison de la villageoise et changement de composition observables ; pas de progression physique soutenue certifiée. Cible : contraste lisible réserves préservées/coût humain, sans violence nouvelle. | Garder MP4/conséquence ; distinguer manuellement l’après-raid du sauvetage avec décor/cast promus. Ne représenter ni nouvelle mort ni prise/donation de provisions automatique. |
| `lion_judgement`, 17s, SHA `6ea5b12bb8c9…`. Aucun candidat produit. | Alaric humain dévoilé/Champion à tête de lion dans ancienne salle sombre, contre V2 casqués et salle de jugement promue. Le zoom finit par couper bas des corps/épée dans la frame finale. | Resserrement premier→milieu→fin visible ; aucune preuve de verdict préchoisi dans les samples. Rythme futur : autorité/réaction/suspension, pas surenchère d’action. | **Conserver climax, déclencheur et dialogue dynamique.** Identités/décor/cadrage restent reprise artistique manuelle ; aucun correctif de verdict ni remontage runtime justifié ici. |
| `serpent_route_ending`, 18s, SHA `f1de1f29ccc9…`. Aucun candidat produit. | Seraphine dévoilée, ancien Général à arme d’hast puis agenouillé et signe en anneau au sol, sur camp montagneux ; décor promu : ruines nocturnes/cascade/arches, V2 Général avec bouclier/arme propre. | Abaissement du Général visible ; continuation lumineuse/caméra dans les samples, sans nouvelle review temporelle. Future culmination de victoire déjà résolue, sans exécution. | Garder MP4 et **fallback neutre déjà corrigé** « artefact récupéré ». Reprise manuelle V2/décor ; ne pas donner au signe visuel valeur de design canonique ni imposer détenteur/révélation. |
| `lion_trial_route_ending`, 20s, SHA `34f023ac0313…`. Aucun candidat produit. | Alaric/Champion historiques en camp montagneux, contre terrasse d’épreuve promue, arches/lions/ville et V2 casqués. Dernière frame : inclinaison du Champion. | Reconnaissance/inclinaison observables, puis resserrement ; temporalité détaillée non réévaluée. Cible : résultat de l’épreuve→réaction sobre→transfert épilogue. | Garder MP4 et résultat combat-owned ; reprise artistique manuelle décor/V2. Ni capture du Général, punition universelle, Sceau physique inventé ni révélation obligatoire. |

Les cinq derniers slots ont des specs préparées, **aucun candidat vidéo produit** dans cet ensemble historique. Un cast de référence dans le brief n’impose pas de montrer tous ses membres : quatre acteurs au maximum par composition, présence compatible avec la campagne.

## Dérive de référence à ne pas transmettre au prochain média

Sur les **18 références uniques** du brief (8 décors,10 masters),17 SHA concordent. Seul `public/assets/characters/pixel/masters/alistair.png` a changé : ancien `0c876f783b31e2d21b3fe0657b92a3da8c3a961cb3546a09ccb1aee4fae1b2be`, courant **`84ff7bdc3e2165b39f488fdef6ee8af6ff0bec8c2113b047791b35f62efb0219`**,121109octets. Git rattache exactement avant/après au commit manuel **`b4e890af6fa61287818430b12eed21b4cc2f91fd`**,13octobre, « Update Alistair pixel art with manual corrections » (master + quatre poses).

Les provenances des trois keyframes référencent toutes l’ancien SHA. Elles restent vraies pour leurs sources d’origine ; **ne pas les réécrire avec le nouveau hash**, ni qualifier leurs vidéos de conformes au master courant. Le prochain travail manuel compare silhouette/casque/armure/cape/épée à l’image actuelle. Cette constatation n’adopte aucune origine ou signification d’emblème. Aucun master/pose n’a changé pendant cet audit.

## UNE première correction préparée : le départ du camp

**PROPOSED FUTURE DESIGN — handoff artistique manuel, pas exécution récurrente.** Corriger le défaut `ACTIVE_DEPARTURE_NOT_DELIVERED` du candidat3 : obtenir, dans les12secondes du slot existant, **une marche réellement alternée et ancrée des trois personnages vers la droite**, puis un arrêt lisible, sur le camp nocturne promu et avec le master Alistair courant. C’est le premier événement vidéo rencontré ; sa comparaison V2/décor et ses trois essais donnent une observation suffisante. Le choix ne rouvre pas les autres slots.

Références et exclusions prêtes :

- Décor nocturne : `public/assets/generated/lion-phase/environments/demo-environment-pack-v1/cinematic-source/lion-camp-cinematic-source.png`, SHA `7e2eaba3b2d18d409fb0126a0e4ad9361caa5f61148f2a145b4cd2fbec379c32`. Conserver rue, croissant, château/aqueduc, rivière, tentes et éclairage. Pas d’aube ni nouvelle géographie.
- Masters actuels : Marian/`white_mage.png` SHA `a02a3a3dc9ffc55c1e9ec217a8dab9bed4bce2a33c4edd3b12d0243eae451bda` ; Maelor SHA `7fbd98cb90feae2bd6ce55d0e79e6995178cc285ca7c59b6908f62d77063e2ec` ; Alistair SHA courant ci-dessus. Masques/voiles, bâton étoilé, livre tenu, dague et épée restent identifiables et ne disparaissent pas.
- Keyframe historique `tools/cinematics/candidates/production-eight-slot-remaster/camp_departure/keyframe-v1.png`, SHA `3022c463bd918eaf4acbcf1bbb86be0627c7a6f4a16c663df7585c92154496b5` : **référence de composition ancienne, pas source corrigée prête à soumettre**. Spec `production_camp_departure_v1.json` et prompt v4 du candidat3 restent historiques ; ne pas les exécuter ou changer leur provenance.
- Preuve du problème : [planche candidat3](cinematic-active-motion-1/camp-attempt-03-contact.png), frames à0/1,5/3/6/9/11,9s et master candidat3 dans [l’inventaire](cinematic-existing-audit-2026-10-19/inventory.json). Les séquences1/2 gardent les contre-exemples livre/lune/style. Deltas de pixels ≠ preuve de marche.

| Temps proposé | Action observable à produire manuellement | Critère de revue |
| --- | --- | --- |
| 0–2s | Déplacement du poids puis premier appui, trois corps et équipements lisibles. | Le pied porteur se plante ; aucun simple glissement de la formation. |
| 2–10s | Au moins deux cycles gauche/droite lisibles par acteur dans un déplacement modeste ; cadence différente mais groupe cohérent. Capes/bannières/feu/rivière réagissent indépendamment. | Appuis, transfert de poids et contact au sol visibles à vitesse normale ; livre/bâton/épée stables en identité. Aucun décor réinventé pour simuler la progression. |
| 10–12s | Décélération en formation vivante, silhouettes complètes et fin stable. | Pas d’apparition/disparition, téléportation ou nouveau lieu ; raccord couvert vers le tableau existant. |

Énergie FF9 : une impulsion physique, progression puis réaction/arrêt, avec grandeur portée par la profondeur et les éléments vivants. Un mouvement de caméra motivé pourra accompagner une marche déjà lisible ; il ne remplace jamais les pas. Le prochain chantier manuel doit d’abord choisir une méthode qui maîtrise appuis, identité et pixel construction ; le cap3 interdit de relancer une quatrième soumission identique ou de renuméroter les essais. Aucun choix de pipeline supplémentaire, crédit fournisseur ou production n’est exécuté ici.

Avant toute promotion future : revue artistique séparée à vitesse normale et des frames0/1,5/3/6/9/11,9, comparaison aux masters/décor **courants**, revue du cadrage PC1366×768/1920×1080 ; conserver le défaut portrait connu et la revue mobile finale différée. Sortie attendue12s/1080p/24fps silencieuse. Puis seulement intégration autorisée et un scénario pertinent avec les runners existants : cast vidéo seul, retour STATIC_TABLEAU, focus/skip/release, OS/jeu reduced motion, panne média et repriseV6. Aucun dialogue/choix sur hold ; aucun recrutement/récompense/combat/route ajouté. Le hold ne vaut que pour l’exact moment précédent.

## Runtime et preuves réutilisées

Le reviewer `cinematics-journey` a rapproché les huit triggers du source courant : ouverture→camp ; audience avant `lion_briefing` ; arrivée avant `village_choice` ; sauvegarde/sacrifice après vraie victoire et branche canonique ; jugement avant dialogue dynamique ; fins après combat et aftermath, avant épilogue. Garde approved-ID, libération du freeze avant tableau, bypass reduced motion et récupération bornée sont présents. **Aucun défaut runtime nouveau démontré ; aucun patch spéculatif.** Navigation ordinaire actuelle : carte POI, pas moteur Traversal ; Journey reste aux préparations/terminaisons explicites. Les coordonnées de lignes du brief du2octobre sont historiques.

Réutilisation, avec limites conservées : [préparation](cinematic-eight-slot-remaster-preparation-1.md) :88cas player,24scénarios de production et reprise ciblée fallbackSerpent ; [candidats](cinematic-active-motion-1.md) :55cas player complets camp/audience et4skip Bois partiel ; [structure](cinematic-structure-readiness-1.md) :60scénarios historiques, casV6 seedés et résultats de combat fixtures. Ce ne sont ni une nouvelle campagne native, ni l’acceptation de tous les interruptions/Tab/écrans/versions actuelles. Pas de nouvelle matrice ou browser smoke puisque source et média inchangés.

## Conformité et clôture de portée

Autorités lues : constitution, index/manifeste set1.7.0 et contrats PRESENTATION_AND_MEDIA, WORLD_AND_CHARACTERS, AUTHORING_AND_QA, AUTONOMOUS_WORK_PROTOCOL ; frontières campagne/UI relues par le reviewer. OD-2026-10-19-C et OD-2026-10-01-A/B priment sur les anciennes instructions de génération. Barrière LOCKED contre `f4aae63e792025430c16153e1cd329c20745cf6b` vide ; aucune règle modifiée.

| Domaine | Statut de cet audit |
| --- | --- |
| GAME_CONSTITUTION | PASS — huit IDs et propriétaires inchangés |
| ART_DIRECTION | PASS audit/handoff ; acceptation artistique finale externe, non accordée |
| CHARACTERS | PASS audit — dérive Alistair explicitée, références actuelles figées, canon indécis conservé |
| ENVIRONMENTS | PASS audit —8références SHA identiques ; écarts des médias documentés |
| NARRATIVE / CAMPAIGN | PASS conservation — choix/outcomes inchangés, aucune nouvelle scène |
| NARRATIVE_PRESENTATION | PASS audit — contrôle source/reviewer, limites de preuve historique conservées |
| TRAVERSAL | N/A —33POI conservés, moteur physique non restauré |
| COMBAT | N/A — résolution et équilibre inchangés |
| SAVE | PASS conservation —V6/transient/337jobs inchangés ; aucun nouveau test de reprise revendiqué |
| UI / ACCESSIBILITY | PASS audit — limites portrait/Tab/OS explicites ; aucune acceptation globale inférée |
| QA_EVIDENCE | PASS audit — SHA courants et captures réutilisées, aucune ancienne preuve réécrite |
| REPOSITORY_GOVERNANCE | PASS audit — verrou exclusif, chemins sélectionnés, snapshot publié ; publication normale dev OD-2026-10-12-A vérifiée à la clôture |

Vérifications de clôture : TypeScript `--noEmit` exit0 ; contrats8/8 et8slots ; barrière LOCKED et chemins protégés vides ; `git diff --check` PASS. Contrôles SHA et conservation exacte des337jobs/blocMD/objets différés/audio PASS. Reviewer cinématique : OK_WITH_CONDITIONS ; guardian indépendant : PASS pour audit/publication documentaire, sans correctif requis. Aucun test unitaire, build ou scénario browser relancé pour ce runtime inchangé. Compteurs : source0/tests0/media0/keyframes0/QAtools persistants0/jobs0/browser0/étape jouée0 ;1rapport,1inventaireJSON sélectionné,3docs canoniques,4workflow ; WIP hérité0.

Le remaster reste **incomplet/externe**, ce qui n’empêche pas de terminer cet audit demandé. Les8UI FX et le décor nocturne acceptés, le combat FX4d69c23/ACCEPTED_SCOPED, ses5familles non jouées et truehidden/suspend ouverts, l’intégralité des337jobs et objets différés gardent leurs portées. PC global/art/balance/matériel restent opérateur ; mobile après stabilitéPC. Aucun nouveau chantier musical déduit.

Prochaine action produit : **dans le chantier manuel, préparer le départ du camp décrit ci-dessus avec Alistair courant et une méthode de marche contrôlable ; aucune quatrième tentative du pipeline plafonné.** La récurrence ne répète pas cet audit sans nouveau média, défaut joueur ou verdict opérateur.

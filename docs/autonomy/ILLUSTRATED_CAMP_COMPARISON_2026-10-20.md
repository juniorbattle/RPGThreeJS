# Le camp — essai de cinématique illustrée

CURRENT FACT — prototype de comparaison indépendant du jeu, 20octobre2026 (America/Toronto). Baseline `dev` : `0b4d46c6e5de2250b3ba0e066e20f7e1c81268a7`. Run `codex-manual-camp-illustrated-20261020`.

## Autorisation manuelle bornée

`MANUAL-ILLUSTRATED-CAMP-2026-10-20` : l’opérateur envisage un enchaînement d’images de mise en scène à la place des vidéos et répond **« Okay go »** à la proposition d’un court essai illustré du camp, pour comparer les deux directions avant de choisir. Cette autorisation couvre cet aperçu hors runtime avec les images existantes. Elle ne décide pas le remplacement des huit vidéos, une doctrine nouvelle, une modification LOCKED, de nouveaux dessins ou un autre essai MiniMax. L’autorisation candidat05 reste consommée ; tous ses artefacts et limites sont conservés.

[Ouvrir le comparatif local](http://127.0.0.1:5454/) · [Source HTML](../../tools/cinematics/candidates/illustrated-camp-20261020/index.html) · [Provenance](../../tools/cinematics/candidates/illustrated-camp-20261020/provenance.json).

## Montage livré

| Temps proposé | Composition | Source et traitement |
| --- | --- | --- |
| 0–4s | Le camp | Source nocturne LION_CAMP existante, cadre entier |
| 4–7s | Le détail | Recadrage numérique de support-v3 : livre et équipement |
| 7–12s | Le trio | Même support-v3, trois corps entiers |
| 12–16s | L’arrêt | Coupe elliptique vers stop-v1, toujours dans le camp |

Quatre compositions issues de **trois images existantes**, toutes inchangées : aucun nouveau dessin ou angle filmé. Le gros plan agrandit une région de440×247,5pixels ; sa douceur ne constitue pas une résolution finale. Les corps restent intégrés à leurs images, sans sprites plaqués, déformation de pose ou interpolation entre silhouettes. Le recadrage optionnel déplace le cadre entier jusqu’à1,8%, puis reste figé en pause. La réduction des mouvements du système impose des cadrages fixes. Les coupes racontent une ellipse ; elles ne prouvent ni marche continue, ni appuis, ni transferts de poids ou continuité géographique exacte. Aucun dialogue, choix, événement, récompense, recrue ou franchissement ajouté.

Les16s sont une **proposition éditoriale de cet essai**. Elles ne modifient ni les12s du camp livré, ni la proposition historique28s. La fin garde l’image d’arrêt dans cet aperçu uniquement ; le prototype ne joue pas de dialogue, n’intègre pas de hold au jeu et ne pilote aucun handoff de campagne.

Les onglets Images / Vidéo05 changent de surface en mettant l’ancienne lecture en pause ; une seule surface reste visible. La copie silencieuse de05 garde ses10,125s et son rythme original. Elle est optionnelle et locale, avec son SHA dans la provenance. L’aperçu reste utilisable si elle manque. Aucun son, génération, polling ou export MP4 dans ce chantier. Aucun stockage ou import de gameplay.

## Vérifications et limites

`node --check study.mjs`, `npx tsc --noEmit`, `npm run contracts:validate` : PASS ; huit contrats/huit slots. Barrière Git baseline LOCKED et statut protégé vides, `git diff --check` PASS. Sources/prototype liés par SHA256 ; attributs -text pour garder les empreintes lors de publication Windows.

Un scénario navigateur court propre à cet artefact, sorties ignorées dans `tmp/cinematics/illustrated-camp-20261020/check-fixed/` : **12 observations/assertions PASS**, lecture réelle des16s/quatre plans puis arrêt, seek/clavier, pause, comparaison exclusive, OS-only réduction,1366×768/620×780/390×844 sans débordement horizontal et boutons≥44px, image/vidéo manquante. Zéro erreur console/page sur le chemin nominal. Captures inspectées : ensemble, détail, trio, arrêt et narrow-reduced ; le résultat fixe et ses captures restent disponibles. Ce n’est pas une validation mobile ou gameplay.

La première exécution, conservée dans `check/`, a échoué sur la vidéo absente : l’échec du préchargement pouvait précéder les écouteurs du module. Correction minimale dans l’aperçu : inspecter aussi le `networkState` natif lors de la sélection Vidéo05. Même scénario rejoué, assertions inchangées, dossier séparé. Aucun assouplissement ni nouveau runner QA persistant. Les runners existants ciblent les surfaces du jeu, pas cet HTML indépendant ; le contrôle temporaire utilise Playwright pour cet artefact seulement.

Guardian **PASS_SCOPED_PROTOTYPE** avant, **PASS_SCOPED_ACTUAL_ARTIFACT** après : quatre fichiers et trois sources vérifiés par SHA, contrôles/reçu/captures inspectés, aucun blocage. Le reviewer n’a pas rejoué le scénario ; les limites restent explicites.

| Domaine | Conformité et portée |
| --- | --- |
| GAME_CONSTITUTION | PASS : essai hors jeu, autorités inchangées |
| ART_DIRECTION | PASS expérimentation ; acceptation artistique ouverte |
| CHARACTERS | PASS préservation des trois sources ; aucune nouvelle identité |
| ENVIRONMENTS | PASS famille camp existante ; raccord géographique non accepté |
| NARRATIVE / CAMPAIGN | PASS : trio dans le camp avant dialogue, aucun canon ajouté |
| NARRATIVE_PRESENTATION | PASS : ellipse explicite, huit slots inchangés |
| TRAVERSAL | N/A : moteur retiré |
| COMBAT | N/A |
| SAVE | N/A : V6 non touché |
| UI / ACCESSIBILITY | PASS limité aux contrôles de cet aperçu |
| QA_EVIDENCE | PASS : scénario court, provenance et limites conservées |
| REPOSITORY_GOVERNANCE | PASS : verrou, dev, publication OD-2026-10-12-A |

Autorités lues : constitution, index/manifeste1.7.0, AUTONOMOUS_WORK_PROTOCOL, WORLD_AND_CHARACTERS, CAMPAIGN_AND_STATE, PRESENTATION_AND_MEDIA, UI_AND_ACCESSIBILITY, AUTHORING_AND_QA ; décisions opérateur/protocole multi-agent. Aucun LOCKED modifié depuis `f4aae63e792025430c16153e1cd329c20745cf6b`. L’adoption définitive d’une nouvelle doctrine média demanderait sa tâche dédiée ; ce prototype n’en tient pas lieu.

## Continuité

12chemins :3sources d’aperçu/1provenance/2preuves sélectionnées/6workflow-décision. Runtime0, image/vidéo/son générés0, nouvelle tâche fournisseur0, nouveau job QA0, gameplay joué0, WIP hérité0.339jobs, blocMDQA et racines historiques/P03/audio/différés préservés. Le défaut de lame et les cycles non démontrés de05 ne sont pas clôturés par cet essai. PC global, équilibre, art et matériel restent ouverts ; mobile après stabilité PC.

Serveur local en lecture seule PID30916, port5454, huit fichiers en liste fermée ; laissé pour comparaison. Aperçus5452/PID22960 et5453/PID9228 conservés. Aucun worker QA encore actif après le scénario. Scheduler inchangé.

**UNE prochaine action : regarder les16s dans Images, comparer avec Vidéo05, puis donner un verdict sur la direction illustrée et un défaut précis de rythme/cadrage s’il y en a.** Aucune adoption ou nouvelle génération inférée.

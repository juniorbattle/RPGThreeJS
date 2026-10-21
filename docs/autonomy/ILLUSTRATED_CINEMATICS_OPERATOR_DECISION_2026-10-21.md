# Montages narratifs illustrés — OD-2026-10-21-A

> **Exécution actuelle : [OD-2026-10-21-B](ILLUSTRATED_AUTOMATION_EXECUTION_2026-10-21.md)**. L’opérateur a activé la tâche puis demandé son déblocage complet. Les mentions PAUSED/configuration seulement de la configuration initiale ci-dessous sont historiques ; les runs planifiés exécutent désormais la file illustrée approuvée. Portée, contrats et limites de la présente décision inchangés.

Décision opérateur explicite du21octobre2026, après revue du camp livré dans `tools/cinematics/candidates/camp-story-continuity-20261021` (livraison b48c2d0, clôture0dc5c7a).

> « Ok ta mise en structure est bonne. on valide et on va faire pareil pour les autres cinematiques en conservant cette logique de conception. prepapre la tache planifie pour qu'il continue seul de maniere autonome »

La question complémentaire exposait la règle LOCKED qui réserve le travail artistique aux sessions manuelles et demandait un amendement dédié limité aux montages illustrés des huit scènes existantes, sans vidéo/MiniMax, sans événements nouveaux ni remplacement automatique dans le jeu. Réponse humaine : **« Autoriser cet amendement ciblé »**. Cette réponse autorise `PRODUCTION-CONTRACTS-ILLUSTRATED-CANDIDATES-1`, set1.8.0 ; revue indépendante du diff, commit de l'amendement puis baseline immuable dans un commit opérationnel suivant.

## Validation et limites

La **structure et la logique de conception** du camp sont validées : situation établie → gestes de préparation → attention partagée → regroupement intérieur → arrêt → disponibilité avant le dialogue existant. Le camp corrigé devient la référence de méthode, conservée byte-identique. Ses huit images/20s sont un exemple concret, pas une règle universelle. Cette validation ne certifie pas chaque détail d'équipement, une locomotion continue, une clairance physique3D, tous les autres médias ou leur intégration runtime. Les anciens constats et reçus restent historiquement exacts ; cette nouvelle décision ne réécrit pas leurs acceptations.

## Périmètre autonome autorisé

Produire des **candidats hors runtime** pour les sept autres scènes déjà autorisées, avec l'outil imagegen intégré uniquement, à partir des masters V2, environnements approuvés et faits écrits actuels. Chaque image apporte un état ou geste narratif lisible ; varier le cadre pour servir cette progression. Fondus doux et pauses utiles, pas de faux déplacement continu par translation, morphing ou sprites. Aucun MP4 ni image extraite d'une vidéo comme base, aucun flipbook rejeté, aucun appel/polling MiniMax, aucune keyframe destinée à une vidéo. Aucun outil/API payant alternatif ou secret à lire en cas d'indisponibilité.

Les images/cast sont intégrés dans chaque illustration ; maximum quatre personnages narratifs visibles par composition, sous-ensemble motivé si nécessaire, aucun figurant nouveau pour remplir le cadre. Préserver identités, proportions, tenues, mains anatomiques, équipement, axe/regards, place, heure, lumière, état du lieu et branche résolue. Réutiliser les références canoniques de chaque scène ; le camp fournit une méthode, pas un décor universel. Ne jamais inventer dialogue, ordre, serment, arrivée, événement, recrutement, récompense, choix ou lore. Le dernier plan respecte le raccord exact vers la suite déjà écrite, sans en jouer les choix. Les deux issues Bois-Clair et les fins demeurent séparées et conditionnelles à leurs propres faits canoniques.

Aucune adoption runtime : ne modifier ni `src/`, `public/`, registres/manifestes de production, durées livrées, MP4, V6 ou audio pour livrer ces propositions. Les huit IDs restent fermés ; pas de prologue, refuge, neuvième slot ou cinématique routinière. L'acceptation artistique finale et toute intégration restent distinctes. La nouvelle exception remplace seulement l'exclusion récurrente des candidats illustrés ; les vidéos et leur remaster restent externes/manuels.

## File et conduite du travail

1. `alaric_audience_arrival`
2. `bois_clair_arrival`
3. `bois_clair_saved`
4. `bois_clair_sacrificed`
5. `lion_judgement`
6. `serpent_route_ending`
7. `lion_trial_route_ending`

Au prochain run activé : reprendre l'audience d'Alaric, lire son déclencheur et `lion_briefing` dans la source actuelle ; identifier le lieu, les acteurs et la frontière avant choix/mandat/avance. Écrire une courte succession de plans causaux sourcée puis générer les illustrations de ce premier montage. Ne pas réauditer les huit slots ni reproduire P03/le camp. Les anciens briefs vidéo sont des index de sources à vérifier, jamais des ordres de caméra/mouvement/génération à relancer.

Une scène à la fois ; achever un montage consultable, inspecté et publié, puis marquer `READY_FOR_OPERATOR_REVIEW` et passer à la suivante sans attendre une validation routinière de chaque plan. Adapter nombre/durée à la scène, avec cible initiale5–10images et20s proposée, plutôt que huit vignettes décoratives imposées. Au plus dix images initiales et deux corrections ciblées par scène dans un run ; si le résultat reste inadéquat, checkpoint précis `NEEDS_CORRECTION`, poursuivre la correction bornée au prochain run avec nouvelle information, ou avancer une autre scène indépendante. Aucun retry identique ni acceptation automatique. Après deux passages sans progrès visuel, consigner le défaut et déplacer la scène à `BLOCKED` jusqu'à un fait nouveau, sans diagnostic récurrent.

Conserver chaque sortie brute et chaque variante, requête exacte, références et SHA, identité/version du lecteur, source narrative/branche, séquence/durées, observations et limites. Copier les assets projet dans un nouveau dossier par scène/version sous `tools/cinematics/candidates/illustrated-sequences/`, avec `index.html`, images, timeline, provenance et preuve compacte. Reprendre exactement un travail partiel plutôt que régénérer les plans déjà verts. Une galerie commune indexe les montages et leurs statuts réels ; une version partielle n'est jamais présentée comme finie.

Réutiliser le lecteur camp et les assertions compatibles du pilote existant. Avant preuve, identifier les changements et assertions ; adapter les durées/nombres à la scène sans affaiblir chargement, ordre, arrêt final, pause/reprise, clavier, réduction OS, cadrage et absence d'erreurs. Au plus un scénario pertinent par run, sauf correction directe de sa propre régression. Inspecter les images à taille lisible et les raccords à vitesse normale, pas seulement les légendes ou miniatures. La revue narrative doit expliquer ce que chaque image fait avancer sans dépendre des légendes. Pas de campagne rejouée, faux outcome ou sauvegarde fabriquée.

Budget de run inchangé75min/cadence90min, checkpoint au plus15min et heartbeat10min, verrou/protocole/Git/reçus préservés. Aucun besoin de remplir la durée une fois la sous-tâche cohérente livrée. Si imagegen intégré indisponible : checkpoint `BLOCKED_IMAGE_TOOL`/`PAUSED_FOR_CREDITS` selon cause, aucun fallback/API, et ne pas rediagnostiquer sans information nouvelle. Le compagnon artistique P03 a été récupéré/transcrit et rapproché dans [P03_COMPANION_RECONCILIATION_2026-10-20.md](cinematics/P03_COMPANION_RECONCILIATION_2026-10-20.md) ; conserver ce rapprochement et son statut de référence non-LOCKED. Ne pas relancer sa recherche ni recréer l'ancien blocage « document absent ». Les nouveaux candidats partent du canon/V2/environnements disponibles.

## Configuration et suite

Mettre à jour **l'automation existante** `rpgthreejs-auto-dev-90m`, son prompt dans `RECURRING_RUN_PROMPT.md`, l'état MD/JSON et le handoff. Garder son modèle, raisonnement, projet, environnement local, cadence et notifications. **PAUSED est conservé** : « préparer » n'est pas une instruction de réactivation ; l'opérateur garde ce contrôle. Cette session configure et amende, sans lancer de production d'images ni la tâche. Une fois activée, la tâche dispose de l'autorisation nécessaire pour produire les sept montages autonomement dans ce périmètre.

339jobs QA et acceptations, candidats vidéo01–05, Bois-Clair incomplet, anciens essais illustrés, toutes racines historiques et objets différés conservés. Lot E/équilibre/atlas et PC global ne sont pas acceptés par cette décision. Écoute16FX, cinq familles natives et vrai hidden/suspend restent ouverts ; mobile après stabilitéPC. Pas de Traversal physique, pas de main/force/PR. Publication normale `origin/dev` autorisée par OD-2026-10-12-A.

## Revue de l'amendement avant commit

Guardian indépendant : **PASS_AMENDMENT_ACTUAL_DIFF**, après correction du statut du compagnon P03 récupéré. Constitution et sept autres contrats inchangés ; seul PRESENTATION_AND_MEDIA reçoit l'exception fonctionnelle, README/manifeste la tracent. `contracts:validate` : huit contrats LOCKED/huit slots ; diff --check et contrôle exact des trois chemins contractuels PASS. Ce run dédié change explicitement une règle LOCKED approuvée ; ce n'est pas une déclaration « aucune règle LOCKED modifiée ». La baseline1.7.0 reste historique et son successeur sera le SHA du commit de cet amendement, enregistré dans le checkpoint opérationnel suivant.

Matrice : GAME_CONSTITUTION PASS préservation ; ART_DIRECTION PASS candidats/art final séparés ; CHARACTERS PASS V2/équipement/quatre acteurs ; ENVIRONMENTS PASS familles/contexte ; NARRATIVE/CAMPAIGN PASS aucune vérité créée ; NARRATIVE_PRESENTATION PASS exception exacte ; TRAVERSAL et COMBAT N/A ; SAVE PASS V6/propriétaires ; UI/ACCESSIBILITY PASS portée transitions/agence ; QA_EVIDENCE PASS exigences de provenance/inspection ; REPOSITORY_GOVERNANCE PASS approbation directe/revue indépendante/séquence baseline. Aucune génération, scène jouée ou adoption runtime durant cette configuration.

Amendement revu committé et publié sous **`0cb95135fe31cd3b30ec1e6a4b8041c0ae0ea3aa`**. Le checkpoint opérationnel suivant établit ce SHA comme baseline immuable1.8.0 dans AGENTS, protocole, compétences, plan et prompt ; f4aae63 reste la baseline historique1.7.0. Le prompt est enregistré via l'outil de l'application et rapproché octet de texte pour octet de texte du fichier canonique (hors fin de fichier) ; statut PAUSED, cadence90min et autres paramètres conservés.339jobs,85racines non opérationnelles et blocMDQA exacts,8SHA des images du camp préservés. Aucun changement src/public/ancien candidat/constitution ; gates nouvellebaseline vides.

Revue opérationnelle finale : **PASS_CONFIG_CLOSEOUT** ; prompt/plan/baseline/handoff contrôlés, contradiction historique de reprise immédiate retirée du prompt final. L’activation demeure exclusivement opérateur et le statut PAUSED est conservé. Les gates de la nouvelle baseline sont vides ; aucune autre règle LOCKED modifiée.

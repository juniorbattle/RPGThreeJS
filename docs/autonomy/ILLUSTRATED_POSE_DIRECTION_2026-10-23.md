# Direction de réalisation illustrée et pilote de poses

Décisions **OD-2026-10-23-A/B**. [L'approbation explicite des coupes franches](ILLUSTRATED_EDITING_AMENDMENT_2026-10-23.md) complète la demande initiale. L'opérateur a fourni la [proposition intégrale](ILLUSTRATED_ART_DIRECTION_SOURCE_2026-10-23.md), puis demandé : « met a jour la tache recurrente ». Cette décision configure l'automatisation existante ; elle ne lance pas de génération dans la session de configuration et ne change pas son activation.

## Priorité et verdict retenu

Les poses trop proches, micro-gestes et recadrages descriptifs justifient une nouvelle réalisation des candidats. Les sept versions actuelles restent accessibles comme références historiques et preuves techniques, avec leurs véritables identités v1/v2, leurs35images,126secondes proposées, prompts, variantes, SHA, lecteurs et reçus. Leur statut READY historique ne constitue pas une acceptation artistique ou une proximité avec l'art final. La [synthèse antérieure](../../tools/cinematics/candidates/illustrated-sequences/review-index.md) reste intacte. Le camp conserve sa validation structurelle historique et n'est pas régénéré.

## Exécution du prochain run déclenché

1. Préflight, verrou exclusif, synchronisation non destructive et lecture des sources actuelles.
2. Préparer le seul pilote `bois_clair_sacrificed`, dans une nouvelle version (`v2` si libre), après victoire `village_raid` avec `missionGreed=true`, avant `village_raid_aftermath:1` et le choix des provisions.
3. Examiner CharacterV2, décor approuvé, ancienne version et faits de campagne ; écrire une progression causale sourcée, une partition de poses et les fiches de plans avant génération.
4. Produire/corriger uniquement les illustrations insuffisantes, via imagegen intégré, puis un montage offline à rythme motivé et sa preuve propre. Chaque nouvelle version conserve raw, variantes, demandes/résultats exacts et SHA inputs/outputs.
5. Comparer ancienne et nouvelle versions à vitesse normale sans titres ni descriptions. Présenter le pilote avec limites et revue des images autant que du montage.
6. **Attendre l'acceptation artistique explicite de la méthode par l'opérateur avant la généralisation aux six autres scènes.** READY, preuve technique, revue agent et validation du camp ne franchissent pas ce jalon. Aucun nouveau go routinier entre les plans du pilote.

Les six scènes restent ensuite audience, arrivée Bois-Clair, Bois-Clair sauvé, jugement du Lion, fin Serpent et fin de l'épreuve du Lion. Chacune garde ses sources, frontière, découpage et rythme propres. En attente du verdict du pilote, ne pas régénérer une autre scène ni répéter une synthèse ou des diagnostics inchangés.

## Grammaire artistique

Chaque image a une fonction dramatique visible : installation, tension, réaction, bascule, conséquence ou raccord. Comparer les silhouettes à taille comparable, appuis, buste, membres, objet et relations spatiales. Deux changements corporels sont un repère, pas un quota ; une seule évolution expressive peut suffire. L'immobilité peut porter une autorité ou un contraste dramatique, notamment Alaric au jugement. Pas de gesticulation artificielle, de pose contradictoire avec la condition du personnage ni de geste revendiqué absent de l'image.

Chaque fiche précise fonction, source/frontière, acteurs, poseclé, changement depuis le plan précédent, géographie/axe, cadrage, émotion compatible, équipement/main porteuse, invariants, durée/transition et raccord suivant. La progression doit se comprendre sans légende. Pour le pilote : distance dans la place détruite, retenue de Maelor et de son livre, panier-barrière de la Villageoise, évitement du regard, séparation finale avant dialogue. Cette interprétation ne crée aucun nouvel événement, choix, transfert, départ ou conséquence canonique.

## Montage conforme à la proposition — set1.9.0

La proposition intégrale reste la référence. L'opérateur confirme : « Oui nous partons avec des coupes franches en respectant strictement la proposition transmise recemment ». Le [contrat amendé](../contracts/PRESENTATION_AND_MEDIA.md) autorise désormais les coupes franches motivées, les fondus de l'image entière pour ellipse/retombée, les pauses finales et des durées adaptées à chaque plan. Ne pas uniformiser les transitions ; une coupe est préférable à une double silhouette gênante entre poses nettement différentes. Aucun fondu ne cache un défaut d'image.

Un recadrage très discret de l'image entière peut être étudié uniquement si son apport réel à la lecture est documenté et qu'une alternative de réduction des mouvements conserve toute l'information. Aucun zoom automatique, faux travelling, morphing, interpolation, personnage découpé/glissé ou marche simulée. Le cadrage d'une nouvelle illustration fixe reste libre dans les contraintes géographiques. Les durées et déclencheurs de production demeurent inchangés.

## Revue et statuts

Revoir chaque image, chaque paire de plans puis le montage complet sans assistance textuelle. Garder toutes les assertions pertinentes du lecteur réutilisé : chargement, ordre, pause horloge/opacité, reprise, clavier, fin, réduction OS, cadrage, commandes44px, console et image absente. Une adaptation nécessaire reste minimale, versionnée et offline ; vérifier le type de transition réellement choisi, ne pas modifier les anciens lecteurs ou affaiblir les garanties de leurs preuves. Une preuve technique n'accepte pas l'art.

Pour les nouvelles versions, distinguer `GENERATED`, `TECHNICALLY_VERIFIED`, `ART_REVIEW_PENDING`, `ART_NEEDS_CORRECTION`, `READY_FOR_OPERATOR_REVIEW`, `ART_ACCEPTED` et `RUNTIME_ACCEPTED`, par états ou dimensions explicites. ART_ACCEPTED demande un verdict opérateur ; RUNTIME_ACCEPTED demande une adoption future séparée. Ne pas réécrire les reçus ou acceptations historiques pour les convertir à cette grille.

## Limites conservées

Set1.9.0 / baseline immuable `32c8439f6dea1d09f428c5c081392ab0c700e356`. Set1.8.0/0cb95135 reste historique. Exception OD-2026-10-21-A/B complétée par l'amendement dédié OD-2026-10-23-B seulement : imagegen intégré, candidats hors runtime, huit IDs existants/sept scènes, CharacterV2, quatre acteurs et décors approuvés. Maximum10images initiales et2corrections ciblées par scène/run ; deux passages sans progrès visuel imposent un blocage précis, sans retry identique. Les autres scènes ne servent pas à contourner le jalon du pilote.

Aucun src/public/registre/manifest/déclencheur/durée de production, MP4/vidéo/keyframe/MiniMax/audio, canon/choix/outcome/récompense, V6, combat ou POI changé. Aucun nouveau slot, génération du camp ou restauration de Traversal. Tous les355jobs/acceptations du checkpoint antérieur, dont339originels, objets différés et preuves sont conservés. PC global/équilibre/atlas/matériel et mobile aprèsPC restent séparés.

## Configuration et conformité

Préserver la tâche `rpgthreejs-auto-dev-90m`, cadence90min, modèle `gpt-6.1-sol`, raisonnement `high`, projet/cwd local, notifications et statut réellement enregistré **PAUSED**. La demande met à jour le contenu ; elle n'est pas une demande de réactivation. Appliquer via l'outil officiel et vérifier le prompt enregistré contre RECURRING_RUN_PROMPT.md. Lorsqu'un futur run est effectivement déclenché, exécuter le pilote sans transformer cette session de configuration en blocage permanent.

Revue indépendante du diff contractuel dédié : **PASS_AMENDMENT_ACTUAL_DIFF**. La prérevue initiale1.8.0 avec coupes différées reste historique et est remplacée sur cette règle par l'amendement1.9.0 explicitement autorisé. Constitution, WORLD_AND_CHARACTERS, CAMPAIGN_AND_STATE, PRESENTATION_AND_MEDIA, AUTHORING_AND_QA et AUTONOMOUS_WORK_PROTOCOL lus ; manifeste/index consultés. Seule la règle de transitions/direction offline est amendée ; aucun changement d'autorité de présentation ou de vérité de jeu.

| Ligne | Statut | Portée |
| --- | --- | --- |
| GAME_CONSTITUTION | PASS | Configuration et candidats offline uniquement. |
| ART_DIRECTION | PASS | Pixel Diorama Fantasy/HD-2D et priorité au jeu corporel. |
| CHARACTERS | PASS | V2, proportions, mains et équipement protégés. |
| ENVIRONMENTS | PASS | Familles approuvées, état de branche et géographie préservés. |
| NARRATIVE / CAMPAIGN | PASS | Sources actuelles et frontière avant provisions obligatoires. |
| NARRATIVE_PRESENTATION | PASS | Coupes/fondus/pauses motivés, recadrage discret borné, jalon pilote explicite. |
| TRAVERSAL | N/A | Moteur physique retiré, aucun changement. |
| COMBAT | N/A | Aucun changement. |
| SAVE | PASS | Aucun changement V6 ou état visuel sérialisé. |
| UI / ACCESSIBILITY | PASS | Aucun lecteur modifié maintenant, assertions et réduction conservées. |
| QA_EVIDENCE | PASS | Preuves historiques immuables, future preuve propre au pilote. |
| REPOSITORY_GOVERNANCE | PASS | Verrou, gates LOCKED, configuration seule, publication normale dev. |

La vérification de clôture et l'égalité des paramètres sont consignées dans le handoff de configuration. Aucune génération, nouvelle preuve browser, acceptation artistique ou adoption runtime n'est revendiquée par cette décision.

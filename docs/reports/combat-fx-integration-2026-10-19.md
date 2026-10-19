# Sons du combat — intégration bornée

| Field | Value |
| --- | --- |
| TASK | COMBAT-AUDIO-BOUNDED-EXECUTION |
| DOMAIN | Combat, UI, audio, accessibilité |
| BASELINE | `53bfd488028280f6f14583401d39b31a3a56f5f7` sur dev |
| BRANCH | dev |
| HEAD | Source initiale `06a59c48c86b02ff16eeb4df821c7d47a04f63c3` ; correction focus `4d69c23405c64ff9cad5391a0f5a053f5a1aa246` |
| STATUS | ACCEPTED_SCOPED_NATIVE ; QA du lot complet et acceptation artistique ouvertes |
| MERGED_IN | NONE ; publication directe dev autorisée |
| SUPERSEDES | NONE ; met en œuvre le lot de l'audit sans réécrire les preuves historiques |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Le combat de campagne partage les sons/réglages parent, présente les actions résolues et restaure son contrôle natif après réglages |
| CANONICAL_DOCS_UPDATED | CURRENT_STATUS, PC_PLAYTEST, état/handoff et décisions ; set1.7.0 consacré avant runtime |
| EVIDENCE | Tests ciblés et build ; jobs native1559 et focus-fixed1605, portée finale ci-dessous |

## Autorisation et ordre des commits

APPROVED DECISION : « Okay go ! » après l'audit approfondi. [OD-2026-10-19-B](../autonomy/COMBAT_FX_OPERATOR_DECISION_2026-10-19.md) autorise ce lot dédié, seize candidats originaux et les raccords recensés. Guardian indépendant sur le diff effectif : PASS, puis commit amendement `f4aae63e792025430c16153e1cd329c20745cf6b` / set1.7.0, baseline opérationnelle `782e834`, puis source. Aucune activation runtime avant cette séquence. La barrière normale compare désormais à f4aae63 ; les huit IDs de contrats et huit vidéos sont inchangés.

La génération locale et l'intégration des nouveaux sons sont autorisées. Leur **acceptation artistique reste opérateur**. Les huit WAV UI précédemment acceptés sont conservés byte-identiques. Les seize nouvelles familles ne sont jamais présentées comme déjà acceptées à l'écoute.

## Comportement livré

- Un seul `UiSoundPlayer` parent ; mêmes préférences activer/couper/volume hors GameState/V6 et vidéo, défaut silencieux. Le menu Sons est accessible depuis les réglages du vrai combat iframe. Pas de deuxième consentement ou lecteur indépendant.
- `CombatBridge` observe les véritables pointerdown/keydown trusted du document iframe courant. Le relais audio strict valide source, origine, session, ID et identité d'événement ; il ne reçoit ni dégâts ni ressources ni résultat. Les messages ne sont jamais utilisés comme preuve de geste.
- Déploiement, ouverture des menus, choix de cible, refus expliqués, annulation, fin de tour et retours utilisent les clics UI adaptés. Les départs d'arme/magie et les branches réelles dégâts/raté/critique/soin/statut/K.O./tour/résultat émettent leurs effets. Joueurs et ennemis partagent les propriétaires tactiques existants.
- Seize fichiers courts : pas, lame légère, arme lourde, estoc, arc, départ/impact magique, impact physique, raté, critique, malus, soutien, K.O., tour joueur, victoire et défaite. Recover est réutilisé uniquement après gain réel de PV/réanimation. Aucun son ne produit son effet de jeu.
- Déduplication par session/action/phase/cible ; cadence par famille et pas≥120ms ; maximum4voix total/2UI ; résultat/K.O./critique prioritaires ; gain de voix0,55 en combat. Les pics PCM≤0,2 donnent une somme bornée≤0,44 avant volume maître. Aucun événement différé dans une file.
- Les sons absents ou indécodables sont abandonnés sans bloquer l'action. Aucune cue sur init, reload, préférence restaurée, focus automatique, rendu ou aperçu. Le close de session détache les gestes, coupe ses voix et ferme son panneau de réglages. La vraie mise en arrière-plan garde la politique stop/suspend précédente ; sa preuve native reste ouverte.
- Compléments hors combat : ouvertures et sortie du refuge, choix combat/repli/Continuer d'un coffre, sous-onglets Acheter/Vendre/Craft, Menu/mouvement réduit/Attendre de carte. Pas de nouveau feedback de sauvegarde automatique ou de récompense rejouée.

Les calculs de PA/dégâts, le RNG tactique, les statuts, récompenses, formations, sauvegardes et issues restent inchangés. L'audio n'est jamais attendu par une promesse tactique. Les actions Ultimate existantes sont silencieuses côté nouveaux raccords ; leur gameplay n'est pas modifié. Les outils/laboratoires standalone ne reçoivent pas un bouton Sons inopérant.

## Médias et provenance

Générateur : [generate-combat-fx-candidates.mjs](../../tools/audio/generate-combat-fx-candidates.mjs). Oscillateurs et bruit déterministes originaux, PCM16 mono48kHz, sans fournisseur, modèle, sample externe ou enregistrement. Manifestes/durées/mesures/SHA et page d'écoute dans [combat-fx-v1](../../public/assets/audio/combat-fx-v1/index.html). Les16fichiers sont≤1s, avec bords nuls et pics≤0,2. Le générateur, les seize SHA et les huit UI inchangés ont été vérifiés indépendamment. L'exécution native contrôle aussi les seize réponses HTTP contre ce manifeste.

La page d'écoute est disponible avec le jeu à `/assets/audio/combat-fx-v1/index.html`, lecture volontaire seulement. Musique, voix, boucles d'ambiance, Ultimates et audio vidéo/cinématique restent hors de ce lot.

## Vérifications mécaniques

- 127tests source distincts dans12fichiers sur les runs ciblés : lecteur/réglages12, bridge2, emitter/mapping3, protocole17, hotfix-runtime42, compétence3, RNG6, gestion9, refuge6, dialogue POI2, GameAppPoi19, lastSaveRecovery6. Après correction focus, les14tests lecteur/bridge et19GameApp voisins ont été revérifiés, types/build aussi.
- Un ancien test de source cherchait littéralement `{critical:crit}`. Il exige maintenant l'appel contenant à la fois ce flag et la métadonnée de présentation magic ; aucune assertion de critique retirée.
- Helper QA : 25tests distincts passent dans le full24/25 puis la reprise isolée2/2 du worker détaché et du nouveau mode. L'échec transitoire du worker n'est pas effacé ; sa cause n'est pas attribuée au produit. Le refus sandbox d'écrire `.git/config` dans les fixtures temporaires est séparé du résultat hôte.
- TypeScript et build production PASS,8MP4 ; contracts:validate8/8+8slots ; diff --check et barrière LOCKED vides après la baseline dédiée.
- Le helper n'active le nouveau scénario qu'avec ses entrées gagnées et son combat facultatif borné. Les modes de vérification concurrents sont refusés ; aucun runner permanent supplémentaire.

## Scénarios natifs et correction démontrée

Lignée : `tmp/demo/lot-e-complete-patrol-0002/results.json`, reçu SUCCEEDED/exit0/provenance stable/digest vérifié et sauvegarde `earned-expedition-checkpoint-v6.json` exactement égale à l'état resumed. La seed vient d'une vraie victoire de patrouille, pas d'un run partiel/FAILED. Les anciens combats hérités sont distincts de la nouvelle bataille.

`combat-fx-native-1559` : échec conservé, avant toute action tactique, sur « Settings did not restore the native combat opener ». L'iframe reprenait le focus parent mais son bouton interne n'était plus actif. Le pilote avait déjà validé les16SHA HTTP et utilisé les potions gagnées via les menus. Un premier démarrage sans la variable DEMO_QA_JOB_ID s'était arrêté avant création de reçu ; le job enregistré a ensuite été lancé correctement, sans remplacement d'output.

Correction produit : le panneau parent libère d'abord inert puis invoque un callback qui vérifie iframe/session/document/opener encore courants et restaure le bouton exact. Fermer le combat ferme aussi ce panneau. Tests ciblés nouveaux, source `4d69c23`, assertions et pilote inchangés. Le second scénario est justifié uniquement pour cette régression propre ; il reprend la seed SUCCEEDED originale.

`combat-fx-native-focus-fixed-1605` : SUCCEEDED/exit0/provenanceStable et six indicateurs d’éligibilité vrais ; revue contracts-guardian ACCEPTED_SCOPED. Victoire réelle en6manches/32actions à `lion-poi-opening-wolves` / `poi_opening_wolves_a`, +80or/+1réputation/+1gemme rouge/+1minerai selon les valeurs approuvées, retour carte345or et rechargement exact.239démarrages natifs AudioBufferSource, dont231 pendant la session combat ;15IDs comprenant11nouvelles familles. Pic observé2voix, limite source/unitaire4. La préparation native a consommé deux potions déjà gagnées, Elara2→57PV et Kestrel1→56PV ; la bataille a aussi produit soins, raté, critiques, K.O. et victoire réels. Le scénario ferme/rouvre les réglages par vraies touches, change effectivement de héros sous mute puis volume0, restaure le volume, et poursuit le seul combat facultatif `lion-poi-opening-wolves`. La suspension volontaire de l'AudioContext suivie d'une vraie touche iframe vérifie le raccord de geste ; **elle ne constitue pas une preuve de visibilité hidden**. Aucune injection de PA, équipement, PV ou issue.

## Limites conservées

La preuve native hidden/suspend du lot UI précédent reste OPEN/NOT_OBSERVED_PLATFORM ; aucun événement de visibilité synthétique ni équivalence par disposal. Les essais actuels ne redémontrent pas toute la campagne ou tous les seize timbres avec chaque héros. La mécanique unitaire, une action native observée et l'acceptation artistique sont trois portées distinctes.

Inspection des captures : le panneau partagé et le retour clavier tactique affichent bien leurs contrôles et acteurs. La capture automatique `actual-impact` est noire hors titre, comme celle de la baseline patrouille déjà conservée. Elle n'est pas promue et ne prouve pas la visibilité ou la chorégraphie Stage ; cette comparaison ne suffit pas non plus à conclure à une nouvelle régression visuelle. Aucune acceptation d'impact artistique n'est inférée de cette preuve audio. La suspension directe du contexte dans le pilote est explicitement limitée à la présentation et ne touche aucun propriétaire gameplay.

L'audit reste utile pour la finition suivante : titre/prologue, certains refus de gestion, journal/aide/tutoriel combat et mouvements avancés gardent des emplacements silencieux. Aucun son continu sur survol/scroll/animation automatique n'est demandé. Pas d'acceptation globale PC, mobile, matérielle, équilibre ou cinématique inférée.

## Preuve compacte et captures sélectionnées

[Provenance, résultat et portée](combat-fx-integration-2026-10-19/proof.json). Les trois captures inspectées sont [réglages partagés](combat-fx-integration-2026-10-19/shared-combat-settings.png), [contrôles tactiques](combat-fx-integration-2026-10-19/native-tactical-controls.png) et [victoire](combat-fx-integration-2026-10-19/native-victory.png). Les cinq familles non jouées nativement ici sont estoc, départ/impact magique, soutien et défaite : elles ont leurs WAV/hashes et raccords source, pas une nouvelle acceptation native.

## Revue finale

**ACCEPTED_SCOPED — contracts-guardian indépendant**. Dix-huit empreintes, arbre source, lignée gagnée, paramètres/assertions inchangés, six indicateurs d'éligibilité et trois captures inspectés. Réglages/geste iframe/mute/volume0/focus/disposal, une victoire native et rechargement exact sont acceptés dans leur portée PC1366 normale. Le reçu brut conserve NOT_ACCEPTED ; le verdict relu figure séparément dans proof.json. L'échec1559 demeure FAILED/NOT_ACCEPTED.

| Domaine | Verdict |
| --- | --- |
| Constitution et gouvernance | PASS — exception bornée, gates vides et validator8/8 |
| Combat / campagne / sauvegarde | PASS — résolution native, lignée et V6 exacts |
| UI / accessibilité / présentation | PASS scoped — réglages et focus natifs |
| ART_DIRECTION | PASS technique ; artistique opérateur ouvert |
| CHARACTERS / ENVIRONMENTS | N/A |
| TRAVERSAL | PASS — navigation POI existante |
| QA_EVIDENCE | BLOCKED lot complet — hidden réel et cinq familles non jouées |

fullFeatureAcceptance reste false. Aucun PASS Stage/art issu de la capture d'impact noire ; matériel, équilibre et acceptation globale PC restent ouverts.

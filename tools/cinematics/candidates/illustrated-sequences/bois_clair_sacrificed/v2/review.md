# Pilote Bois-Clair sacrifié v2 — techniquement vérifié

Run codex-pose-pilot-20261023T0425Z. Nouvelle version séparée sous set1.9.0 ; v1 et les sept livraisons historiques restent intactes. Quatre illustrations initiales, une correction ciblée, cinq raw conservés et01 historique réutilisé. Aucune vidéo, audio ou adoption en jeu.

## Images natives et paires réellement inspectées

| Plan / paire | Ce qui se voit | Limite réelle |
| --- | --- | --- |
| 01 | Place brûlée, deux silhouettes verticales éloignées, livre à gauche de Maelor et panier bas chez la femme. | Réemploi exact v1shot01 pour l'état initial, pas acceptation de la méthode historique entière. |
| 01→02 | Maelor baisse tête/buste et ferme les deux avant-bras sur son livre. La femme reste verticale. | Plan large conservé, genoux pas visiblement fléchis malgré demande ; ne pas revendiquer ce geste absent. |
| 02→03 | La femme remonte le panier, ferme les épaules et se penche légèrement vers son appui extérieur. | Première variante rejetée pour prise de l'anse ambiguë/inversée. Correction1 clarifie gauche à l'anse/droite au bord ; appui élargi sur place, pas pieds pixel-fixes. |
| 03→04 | Le cadre rapproché montre franchement le capuchon et l'attention vers écran droit, loin de Maelor. Livre et panier restent chez leurs propriétaires. | Panier légèrement abaissé et torse moins tourné que demandé. Pas de « panier haut inchangé » ou de rotation45° revendiquée. Retrait de tête suffisant selon revue ciblée guardian. |
| 04→05 | Retour large ; même distance et échelle, même retrait d'attention, Maelor replié, panier toujours tenu devant elle. | Plis/bordures et menus détails du sol varient ; aucune continuité corporelle animée ou parfaite fixité pixel revendiquée. |

Les plans02/03 gardent le même cadrage large que01 ; leur raison d'être est le jeu corporel distinct, pas un recadrage.04 porte le changement de point de vue et la rupture visuelle ;05 fait lire sa conséquence spatiale. Le dernier plan reste avant village_raid_aftermath:1 et les deux choix de provisions. Aucun remords canonique, refus de choix, départ, don ou gain n'est joué.

Prérevue indépendante : **PASS_PREGEN_SCOPED**. Revue réelle02/03/04 : **PASS visuel ciblé canon/continuité**, pas verdict artistique opérateur.05 et le montage ont reçu PASS_CONTRACTS_PRESENTATION_AND_TECHNICAL_SCOPED après inspection réelle et du reçu.

## Lecteur et preuve

Copie locale du lecteur `reader-v1/montage.mjs` : seulement transition d'entrée `cut` et comparaison historique sans titres/descriptions de plans. Navigation, chargement préalable, horloge/opacité, pause/reprise, clavier, fin, OSreduce, contain,44px et erreur d'image restent vérifiés. V1 utilise toujours ses médias/durées/fondus exacts dans cette vue comparative, sans changer son lecteur ou son reçu.

Durées4/3/2.5/3.5/5secondes, quatre coupes franches, tenue finale5s ; total18s proposé. Aucune information n'exige recadrage animé ou fondu, donc aucun mouvement caméra. La préférence OS conserve toutes les informations fixes et ne lance jamais la lecture.

Statuts : **GENERATED**, **TECHNICALLY_VERIFIED**, **ART_REVIEW_PENDING**, **READY_FOR_OPERATOR_REVIEW**. ART_ACCEPTED et RUNTIME_ACCEPTED absents. Preuve propre v2 PASS11contrôles : quatre coupes4/7/9.5/13s, durée18s, pause horloge/opacité/reprise/clavier, OSreduce, contain/44px1366/620/390, console et fallback manquant. Comparaison historique18s/quatre fondus sans légendes rejouée dans le même scénario. Premier reçu FAILED conservé ; correction minimale attend la notificationOS, aucune assertion retirée. Résultat SUCCEEDED/NOT_ACCEPTED brut conservé, eligible/stable/current/digest/request vrais au sync. [Lecteur nouveau](index.html), [comparaison v1 sans légendes](index.html?historical=1), [storyboard préparé avant génération](storyboard.md), [provenance](provenance.json).

Une fois cohérent et techniquement vérifié, attendre l'acceptation artistique explicite opérateur sur images ET montage/méthode avant de produire les six autres scènes. Aucun READY agent, camp ou reçu technique ne franchit ce jalon.


## Comparaison perceptuelle et retour opérateur

V1 situe correctement le village, mais ses silhouettes verticales et ses cadres proches portent une progression corporelle faible ; le fondu de2→3 donne une impression optique de mouvement, également observable dans le screenshot IAB à9.7s. V2 ajoute bras/livre repliés, protection et évitement franchement lisibles, avec un accent sec sur04 et une tenue finale. Cette appréciation agent reste distincte de la compréhension et de l’acceptation artistiques humaines.

Le retour direct opérateur sur la **v1 affichée**,23octobre, demande plus d’images et davantage de cet effet de transition. [Décision de reprise](../../../../../../docs/autonomy/ILLUSTRATED_DISSOLVE_FEEDBACK_2026-10-23.md) : nouvelle v3 séparée du seul pilote. Ce retour ne déclare pas la nouvelle méthode artistiquement acceptée. V2 et sa preuve sont préservés.

## Conformité scoped

Set1.9.0/baseline32c8439f6dea1d09f428c5c081392ab0c700e356. Constitution, WORLD_AND_CHARACTERS, CAMPAIGN_AND_STATE, PRESENTATION_AND_MEDIA, UI_AND_ACCESSIBILITY, AUTHORING_AND_QA, AUTONOMOUS_WORK_PROTOCOL et manifeste lus. Aucune règle LOCKED modifiée, gates baseline/working vides ; validator8contrats/8slots PASS.

| Ligne | Statut | Preuve |
| --- | --- | --- |
| GAME_CONSTITUTION | PASS | Offline, propriétaires inchangés. |
| ART_DIRECTION | PASS | Poses distinctes, limites réelles déclarées, art final opérateur. |
| CHARACTERS | PASS | Deux V2, mains/objets/tenues maintenus. |
| ENVIRONMENTS | PASS | Place détruite, lumière/axe maintenus. |
| NARRATIVE / CAMPAIGN | PASS | Avant dialogue1 et choix ; aucun canon créé. |
| NARRATIVE_PRESENTATION | PASS | Coupes4/7/9.5/13s, final18s. |
| TRAVERSAL | N/A | Aucun changement. |
| COMBAT | N/A | Aucun changement. |
| SAVE | PASS | V6 inchangé. |
| UI / ACCESSIBILITY | PASS | Pause/reprise/clavier/OSreduce/contain44px. |
| QA_EVIDENCE | PASS | Reçu exact, échec conservé,11contrôles, captures inspectées. |
| REPOSITORY_GOVERNANCE | PASS | dev, historique et jalon opérateur conservés. |

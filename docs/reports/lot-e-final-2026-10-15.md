# Lot E Final — exploration, économie et élites mobiles

| Field | Value |
| --- | --- |
| TASK | POI-LOT-E-FINAL |
| DOMAIN | Campagne, contenu, combat, sauvegarde V6, interface et atlas |
| BASELINE | `4c80196cf2eb87097f063f4f312756044f5a5e47` sur dev |
| BRANCH | dev |
| HEAD | Code produit : `c706f31a0ac5b172cc1fe74e432559f30c077a88` ; exécution native finale/pilote : `45fdb478bf465acc07de50948a664183896d2e2c` ; livraison documentaire dans l’historique Git |
| STATUS | COMPLETE_SCOPED — critères techniques et parcours natif complets ; acceptation artistique et équilibre ressenti réservés au playtest opérateur |
| MERGED_IN | NONE — checkpoints directement publiés sur origin/dev |
| SUPERSEDES | Proposition inactive V1 « 4/5/5, élites statiques », remplacée par le catalogue Lot E approuvé ; les rapports POI antérieurs gardent leur portée historique |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | 12 POI facultatifs, 6 coffres, 6 rencontres ordinaires à 2 variantes déterministes, 2 élites mobiles indépendantes, 3 atlas révisés |
| CANONICAL_DOCS_UPDATED | `POI_NAVIGATION.md`, `POI_V2_ART_AND_AUTHORING.md`, `CURRENT_STATUS.md`, index documentaires ; décision et annexes Lot E approuvées |
| EVIDENCE | [Résultat compact et provenance](evidence/lot-e-final-2026-10-15/results.json), dix captures sélectionnées ; sorties brutes ignorées dans `tmp/demo/lot-e-*` |

**CURRENT FACT — 2026-10-16T15:29:46.093Z.** E1–E5 sont implémentés et les parcours natifs sont vérifiés dans les portées ci-dessous. Une lignée complétiste partie de la nouvelle campagne atteint la vraie fin `lion-seal-serpent-truth` : **12/12 nouveaux POI résolus, 6/6 coffres ouverts une fois, 6 combats ordinaires Lot E et 2 élites gagnés**, plus les quatre combats canoniques ouverture/Valmir/village/boss. Aucun résultat tactique n’est injecté. Les 21 IDs canoniques, les faits V6, les propriétaires de vérité et le moteur tactique existant sont conservés ; le Traversal physique reste supprimé.

## Produit livré

Le réseau contient 33 destinations, quatre ajouts facultatifs par région. Les connexions approuvées sont réversibles sous prérequis canoniques ; le graphe dirigé de récupération d’origine reste intact. L’ouverture impose audience, vraie victoire initiale puis Croisement ; les épreuves exclusives, Valmir, Bois-Clair, témoins, préparation et jugement gardent leurs verrous. Un détour ignoré reste non résolu, une alternative neutralisée reste inactive, un refuge réutilisé ne répète ni récompense ni soin gratuit.

RunSystem attribue chaque coffre au butin temporaire et résout son ID ; GameApp persiste cet état avant l’affichage. Les six formations ont chacune deux configurations propres au Lot E, fixées par `run.seed + poiId` et conservées après revisite, défaite et recharge. Elles réemploient les ennemis, scènes et propriétés tactiques existants sans rejouer de dialogue ou de flag canonique.

La Sentinelle de la vallée patrouille ; le Gardien du Sceau poursuit à portée bornée. Leurs deux IDs persistants sont distincts des 33 POI. Chaque mouvement validé ou attente explicite donne au plus une arête à la menace, après fermeture de l’activité. Carte, dialogue, combat, focus et reload ne créent aucun tour. Le modal propose Combat/Repli : interception frontale avant déplacement, repli arrière vers l’origine sûre adjacente, contestation sans impasse si ce retour manque. Une victoire crédite seulement l’élite et son état `defeated`, sans résoudre le POI sous-jacent. Une défaite utilise le checkpoint et la perte de butin existants.

L’interface expose position, intention et passage contesté, avec clavier spatial, défilement tactile, focus contenu/restauré et cibles d’atlas/modal d’au moins 44 px. Les préférences OS et jeu désactivent indépendamment l’animation des menaces. Le bandeau 390 px replie ses libellés. La forge affiche désormais les matériaux permanents déjà requis par les recettes.

L’ajout V6 est idempotent : nœuds manquants et registre versionné d’expédition, sans reconstruire les 21 événements ni réinterpréter leurs choix, affectations, ressources, recrutement, checkpoint, fin ou anciens `traversalBranches`. Les sauvegardes terminées restent terminées. Aucun état visuel n’est sérialisé.

## Parcours natifs et sauvegardes

Les succès exigent un receipt final SUCCEEDED/exit 0, un hash de résultat exact, une provenance stable source/pilote/build/entrées, zéro erreur console et l’égalité du propriétaire, de l’autosave et de la sauvegarde reprise. Chaque continuation charge seulement le résultat réussi précédent. Les segments antérieurs conservent leur SHA propre : ils ne sont pas présentés comme des exécutions du dernier build.

| Parcours | Résultat observé |
| --- | --- |
| Complétiste, lignée de sept segments | 12 vraies victoires : 6 ordinaires Lot E, 2 élites, 4 canoniques. 12 nouveaux POI et 6 coffres terminés. Fin réelle, reload V6 terminal exact, retour au menu au clavier avec Continue focalisé et octets de sauvegarde inchangés. **1167 or sécurisé, 100 réputation, butin temporaire vide.** Dernier segment PC 1366×768, réduction du jeu activée. |
| Entraide et exploration modérée | Six nouveaux POI : trois combats et trois coffres ; deux élites évitées avec replis front/arrière et attente. Vraies victoires Chasseurs et Capitaine Serpent ; fin/reload/menu exacts à **850 or, 100 réputation**. Compact 620, réduction du jeu. |
| Sans détour Lot E | Ouverture fraîche PC 1366×768 normale jusqu’au premier refuge ; continuation terminale distincte depuis une ancienne V6 gagnée, tactile 390/OS. Vraie victoire du Capitaine, fin/reload/menu exacts à **560 or, 100 réputation**. Aucun nouveau combat Lot E attribué à ce parcours. |
| Ancienne V6 à 21 nœuds | Reprise authentique au premier refuge : migration additive 21→33, faits canoniques exactement conservés ; vraies victoires Valmir et village puis second refuge, **290 or, 83 réputation**. Tactile 390×844/OS. |
| Défaite volontaire réellement jouée | Un héros déployé et deux attentes tactiques natives : perte de **210 or et des objets temporaires**, conservation des **20 or permanents**, retour au premier refuge ; trois états V6 attendus/récupérés/rechargés identiques. Aucun outcome forcé. |
| Interruption | Modal élite arrière/contesté rechargé sans choix ni tour supplémentaires ; coffre des témoins rechargé avant acquittement puis une seconde fois : grant et settlement uniques, faits canoniques exacts. |

La lignée complétiste certifiée est `complete-patrol-0002 → complete-I-0003 → complete-marsh-0001 → complete-valley-loop-0002 → complete-II-0005 → complete-III-0003 → complete-ending-0003` (préfixe `lot-e-`). La Sentinelle est gagnée en **32 actions** et le Gardien en **35**, avec Marian/Alistair/Cédric préparés par les vrais menus. Les chasseurs et le boss finaux prennent respectivement **58 / 74 actions**. Les configurations, récompenses exactes et états `defeated` sont vérifiés indépendamment ; le moteur existant fournit les dégâts, PA, KO et résultats.

**39 jobs Lot E enregistrés : 20 succès scoped, 19 autres sorties non acceptées**, dont interruptions et une inscription jamais lancée. Les résultats bruts restent conservés ; aucun échec/partiel n’alimente une continuation. Les corrections du pilote portent sur dialogues réellement visibles, variantes canoniques autorisées, stock fini et récupération conditionnée par les faits sauvegardés. Une tentative perdue contre la Sentinelle avec l’équipe novice et une défaite contre les Chasseurs en repartant avec deux membres à 1 PV sont conservées comme échecs. La continuation certifiée paie son retour/repos et choisit son équipe dans les menus ; les statistiques n’ont pas été affaiblies.

## Économie mesurée

Le catalogue approuvé donne, pour tout le facultatif gagné, **980 or bruts** : combats ordinaires 590, coffres 100, élites 290. Il ajoute +6 réputation, 10 gemmes rouges, 13 minerais de fer et sept consommables ; les gains passent par le butin temporaire et les sécurisations existantes. Ce maximum brut ne constitue pas le solde net d’une partie.

| Nouvelle campagne, arrivée au premier refuge | Or sécurisé | Dépenses canoniques communes |
| --- | ---: | --- |
| Directe | 110 | Cédric 50, réfugiés 40, marchand 30 |
| Modérée : meute + cache | 205 | Identiques ; +80 combat et +15 coffre |
| Complétiste : quatre POI I | 290 | Identiques ; +85 patrouille, +80 meute, +15 cache |

Ces parties partent de 150 or et gagnent 80 dans l’ouverture. Le complétiste paie ensuite une offre canonique de remèdes à 25 or : **290→265**, avec une potion temporaire supplémentaire. L’ordre des choix et le directeur social peuvent différer ; les écarts de réputation ne sont pas attribués au seul Lot E. Les soldes de fin 560/850/1167 viennent de lignées, dépenses et graines différentes : ils prouvent des parcours possibles, pas une comparaison contrôlée d’équilibrage.

Préparation native complétiste : achat de l’acier à **153 or** avec réputation 63, vente de la lame novice **45**, repos payant dont **15** après l’élite. Au second refuge, le stock d’acier est réellement épuisé : rachat de la lame novice **70**, échange d’équipement pour remettre l’acier acquis dans l’inventaire, forge de Braise **80 or + 2 fers + cet acier**, vente novice **45**, repos **15** ; solde **592→472**. Aucun soin n’est attribué par l’équipement et aucun stock n’est recréé.

Après les ruines et avant la fin, les retours natifs supplémentaires au second refuge débitent **30 + 30 or** de repos. Les allers-retours conservent décisions, formations, checkpoint, butin et événements résolus, et n’accordent aucun nouveau gain de refuge. L’équipe du Sceau est composée dans l’interface des héros vivants disponibles, dont le lancier recruté.

Les boutiques conservent leurs multiplicateurs de réputation ; le repos conserve 15 or par membre blessé. **La forge conserve ses recettes à coût fixe**, conformément au contrat opérateur §6 : la formule plus large du prompt ne crée pas un multiplicateur absent du système. Aucun prix, choix, seuil ou gain canonique n’est modifié. Le playtest doit encore juger marge financière, coût des détours, difficulté des formations et intérêt relatif de l’aide.

## Vérifications techniques et corrections constatées

**277 tests ciblés distincts / 16 fichiers**, TypeScript et build de production passent. Le total réunit 269 tests puis les huit tests UI de management ; les 57 tests de management répétés ne sont pas comptés deux fois. Les 19 tests du helper QA passent sur l’hôte. Aucun PASS de suite globale n’est revendiqué.

Les tests couvrent les douze variantes, attribution unique, récompenses, prérequis et neutralisation, V6 ancien/courant/terminal, victoire/défaite, collisions dans les deux sens, attente, repli, sauvegarde et reprise. La preuve bornée épuise les 16 masques de résolution par zone d’élite, collisions, issues et reloads, avec continuation vers une vraie épreuve canonique. Les 11 tests GameApp vérifient le handoff/lifecycle ; les résultats tactiques mockés de ces tests ne sont pas comptés comme victoires natives.

Le test natif de reload a découvert un vrai défaut : `pagehide → dispose → fermeture du modal` résolvait tardivement un repli et écrasait l’autosave ; le coffre avait une continuation tardive analogue. L’instance se marque maintenant détruite avant fermeture et ignore ces continuations. Deux reproductions échouent avant correction ; les trois régressions front/arrière/coffre passent après. Les reprises natives réussies confirment la correction.

Set **1.4.0** : amendement dédié `f9d8fde3f721fdf8da4b1e56a56bc51f20f2fef8`, revu avant runtime. Les quatre références de gouvernance refusées initialement par le contrôle automatique ont été modifiées seulement après l’accord explicite limité de l’opérateur. Les gates Git LOCKED sont silencieuses ; validator **8 contrats / 8 slots**. Constitution, huit MP4, tactique, canon, V6 et retrait physique sont préservés. Main reste `00b96f1b502539618790b1c0d8d642f86d3dcf7f` ; publication normale sur origin/dev, sous OD-2026-10-12-A et la mission explicite. Automatisation inchangée/pausée.

Revue indépendante guardian : PASS_SCOPED. QA native indépendante : PASS_SCOPED. Les captures 1920 des trois cartes ont été inspectées après correction des routes, des sorties sur terre et du chevauchement d’étiquettes. Les preuves 1366/620/390 couvrent les contrôles retenus, le pan/tactile et des échantillons actifs de menace avec mouvement normal, OS réduit et jeu réduit ; elles ne certifient pas tous les appareils ni chaque contrôle tactique hérité.

## Atlas et remise à l’opérateur

Trois fonds PNG versionnés ont été révisés avec l’outil intégré de génération d’images, depuis les références V2 inspectées. Les anciens fichiers restent présents. [Provenance d’authoring](../project/LOT_E_ATLAS_PROVENANCE_2026-10-15.json) : prompts, références, dimensions, sorties et hashes. Les connexions, marqueurs et menaces restent des overlays dérivés ; la peinture ne décide aucune collision ou progression.

| Carte I | Carte II | Carte III |
| --- | --- | --- |
| [Capture comparable](evidence/lot-e-final-2026-10-15/atlas-I.png) | [Capture comparable](evidence/lot-e-final-2026-10-15/atlas-II.png) | [Capture comparable](evidence/lot-e-final-2026-10-15/atlas-III.png) |

**Accepté techniquement dans ces portées :** authoring complet, graphe, économie appliquée, sauvegardes, combats réellement joués, élites, coffre/repli/interruption, trois cartes intégrées, interfaces testées et fin complétiste. **À faire par l’opérateur :** acceptation artistique des trois cartes, confort sur matériel réel, équilibre ressenti et acceptation globale de la démo. Les travaux antérieurement différés sur compétences/clavier/tableau ne sont pas requalifiés comme terminés par ce lot.

Fichiers depuis le baseline : workflowAndCanonicalDocs 19 (7 ajouts, 12 modifications) ; lockedAmendment 8 (0 ajouts, 8 modifications) ; artResources 3 (3 ajouts, 0 modifications) ; runtimeSource 15 (3 ajouts, 12 modifications) ; sourceTests 10 (3 ajouts, 7 modifications) ; existingQaTools 2 (0 ajouts, 2 modifications) ; selectedEvidence 11 (11 ajouts, 0 modifications). L’inventaire exhaustif des chemins ajoutés/modifiés figure dans le résultat compact ; **aucun fichier supprimé dans Lot E** (le retrait Traversal appartient au lot précédent). Les 271 anciens jobs et les objets différés sont conservés à l’identique. Les sorties temporaires ne sont pas nettoyées et les preuves sélectionnées ne sont pas écrasées.

# Traversal T0 — caravane et profondeur HD-2D

Base conservée : `campaign-structure-1`, `7cfccfe37e6d5721db96748080b9552d4b4f32fb`.
Livraison locale, sans commit ni push. La revue visuelle de l’opérateur reste disponible dans [review.html](review.html).

1. **Concepts explorés.** Trois images originales générées avec l’outil intégré `image_gen` : A, caravane d’expédition à toile arquée ; B, wagon mécanique renforcé ; C, caravane compacte renforcée à fenêtres. Chaque candidat possède une vraie transparence alpha et des captures Chromium sur voie haute, voie basse et arrêt marchand. Sources isolées conservées dans `public/assets/generated/lion-phase/traversal/t0/vehicle/traversal-caravan/candidates/`.

2. **Concept retenu.** B, wagon mécanique renforcé. Sa caisse de voyage horizontale, ses provisions, sa cabine ouverte vide et sa transmission apparente communiquent le voyage autonome. À hauteur égale, il mesure environ 392 px de large au viewport 1463 × 823, contre environ 302 px pour l’ancien véhicule ; le point d’ancrage, les voies et les seuils de contact ne changent pas. Son avant laisse une distance lisible au marchand.

3. **Candidats écartés.** A possède une bonne silhouette de caravane mais sa proue évoque davantage un véhicule hippomobile et cache la propulsion. C privilégie une caisse habitable fermée ; ses fenêtres et sa silhouette de petite roulotte expriment moins bien l’ingénierie autonome. Les trois ont été comparés dans T0, pas seulement sur fond transparent. Les captures finales de comparaison incluent le nouveau premier plan.

4. **Contraintes visuelles.** Revue des sprites et des captures en jeu : quatre roues de route discernables, cabine vide, absence de cheval, d’occupants, de drapeau, d’emblème et d’héraldique sur le véhicule. Aucun capot dominant, calandre, phare automobile, benne de pickup ou silhouette de Jeep. Les engrenages sous la caisse représentent la transmission, pas des roues supplémentaires. Ces contraintes artistiques ont une preuve visuelle ; les tests unitaires ne prétendent pas reconnaître des personnes ou une silhouette automobile dans un PNG.

5. **Assets runtime.** Châssis : `/assets/generated/lion-phase/traversal/t0/vehicle/traversal-caravan/chassis.png`. Texture des quatre roues : faces peintes échantillonnées dans `candidates/mechanical.png`, même dossier. Le châssis sans roues est une extraction générée du candidat B. Aucun ancien master n’est écrasé. `TRAVERSAL_T0_ASSETS.vehicle` référence le nouveau châssis.

6. **Roues et suspension.** `TraversalCaravan.ts` centralise canvas, bornes enregistrées, quatre centres, rayons elliptiques, couche proche/lointaine et texture source. Les quatre rotors sont indépendants ; deux passent derrière le châssis, deux devant. La face est normalisée avant rotation puis projetée dans son ellipse, évitant une variation de diamètre au cours du tour. L’angle utilise la distance physique et le rayon affiché au viewport courant ; une circonférence produit un tour. Les roues restent ancrées au sol ; seul le châssis oscille. L’amplitude diminue avec la vitesse et revient à zéro à l’arrêt. Ombre, poussière, freinage, reprise, entrée et sortie restent dans la famille de transitions existante.

7. **Architecture des plans.** `TraversalDepth.ts` déclare `road-world → road-actors → foreground-occlusion → foreground-extreme → markers → ui`. Les conteneurs possèdent des ordres explicites, indépendants de l’ordre d’insertion. Les peintures forêt/route acceptées restent réunies dans `road-world` : aucune découpe générale ni nouvelle architecture du monde. Le rangement interne des sujets par voie est conservé.

8. **Premier plan.** Deux sprites réutilisables : fougères et racines basses avec petites pierres/fleurs. Vingt-huit groupes à coordonnées fixes sur le trajet, cinq ou six à proximité du viewport ; les autres sont masqués. Les racines se trouvent sur le talus côté caméra, au-delà de la ligne de sol de la voie basse. Aucun masque rectangulaire ni bande opaque ne produit l’occlusion. Les groupes utilisent le même déplacement que la route ; l’encadrement extrême conserve son facteur 1,22. Leurs positions ne dépendent pas de la voie choisie.

9. **Occlusion du véhicule.** Les frondes passent devant le bas des roues sur la voie basse. Les ouvertures laissent régulièrement voir les quatre contacts. L’enveloppe verticale de recouvrement mesurée dans les captures atteint environ 17,8 % de la hauteur du véhicule en 1463 × 823 et 15,1 % en 960 × 720. Il s’agit d’une enveloppe locale de silhouette, pas d’un pourcentage de pixels totalement cachés. Cabine, caisse et majorité des roues restent exposées. Aucun recouvrement de la voie haute dans les échantillons contrôlés.

10. **Occlusion des acteurs.** Les patrouilleurs et loups de la voie basse ont les pieds/pattes localement couverts, avec torse et menace visibles. `runtime/*-qa-lower-human.png` montre également un marchand repositionné uniquement par le script de QA sur la voie basse ; les autres acteurs sont cachés dans cette preuve. Aucun PNJ n’est ajouté au contenu T0. Les marqueurs sont des ancres de présentation séparées, synchronisées avec le sujet et affichées au-dessus de l’occlusion.

11. **Changements de voie.** Six transitions répétées par viewport sont enregistrées dans `runtime/*-depth-review.webm`. L’animation verticale existante traverse le premier plan fixe. Le plan des acteurs reste à 20, celui du premier plan à 30 ; aucun changement de z-index n’intervient avec la voie. Les contrôles enregistrent aussi l’identité et les positions inchangées des plantes pendant les transitions.

12. **Dégagement physique.** Trois dérivés `depth-v1/clearance/` retirent les piles de caisses, sacs, roues détachées, tapis et débris du bas des scènes marchand, réfugiés et caravane endommagée. Leur identité supérieure est conservée. Les sources world-v1 originales restent byte-identiques. Le relais nomade, la forêt, le carrefour et l’avant-poste présentent déjà un corridor libre. L’embuscade conserve son obstruction intentionnelle : le véhicule s’arrête avant, puis la variante dégagée existante apparaît après résolution. La vérification porte sur la largeur et les roues de la nouvelle caravane, pas uniquement son centre.

13. **Grammaire narrative.** Marchand, Cédric, réfugiés et blessé restent sur la voie haute ; événements obligatoires centrés ; combats aléatoires sur voie basse. `TraversalT0Route.ts` n’est pas modifié. Contrôles ciblés dans `targeted/report.json`, parcours réels dans `live-final/`.

14. **Ignorer.** Conserve exactement la voie et reprend le mouvement ; lieu et acteur restent visibles pendant le passage. Le bypass est enregistré au seuil existant. Les tests conservent les espions interdisant tout appel de déplacement automatique ; les contrôles Chromium vérifient aussi l’absence d’assistance.

15. **Fuir.** Le changement de voie assisté et son verrou jusqu’au passage sont préservés. Combat réel vérifié dans `meet-fight` et `lower-review`, fuite dans `ignore-flee`, évitement par voie dans `avoid` et `upper-review`. Les libellés Combattre/Fuir restent distincts de Rencontrer/Ignorer.

16. **Obstacle.** Aucun `SIMPLE_OBSTACLE` actif réintroduit. La catégorie générique reste disponible ; le vieux beat broken-cart demeure absent. Les débris narratifs supérieurs et l’obstruction de l’embuscade restent des éléments du monde accepté.

17. **Échelle humaine.** Aucun rétrécissement : les personnages narratifs conservent `.78` de la hauteur visible du véhicule. Mesures Chromium : environ `.7800` sur grand écran et `.77996` en 960 × 720. Captures `targeted/*-subject-*` et `wounded-person-narrow.png` avec marqueurs masqués pour juger les sujets eux-mêmes.

18. **Raccords.** Composition acceptée conservée : image entrante fondue sur voisin opaque, marges forestières à la même échelle et ratio natif 1536/1024. Aucune déformation pour masquer les raccords. Audit des neuf frontières principales et des frontières de branches, avec captures normales, contraste accentué et défilement sans acteurs ni nouveau feuillage dans `seams/`. Les neuf terrains actifs sont entièrement opaques. Les différences de texture peintes restent visibles comme variations du sol ; aucune prétention à une continuité photographique parfaite.

19. **Branches A/B.** A révèle l’approche forestière et la caravane endommagée ; B révèle l’avant-poste en ruines. `targeted/` contient approche, sélection, couverture intégrale, première révélation et reprise pour les deux branches. Au milieu couvert, opacité 1, l’ancien carrefour et son panneau sont absents. L’autorité du choix reste RunSystem. Les plantes gardent des coordonnées routières stables pendant le remontage couvert.

20. **Preuves voie haute.** Parcours complet enregistré `live-final/upper-review/journey.webm`, depuis l’entrée jusqu’à TravelView. Captures supplémentaires à onze progressions dans `runtime/`, viewport principal et viewport étroit. Marchand, relais de Cédric, réfugiés, embranchement et blessé restent intégrés.

21. **Preuves voie basse.** Parcours complet `live-final/lower-review/journey.webm`, avec combat aléatoire et arrivée TravelView. Captures aux mêmes onze progressions, montrant alternance de groupes et d’ouvertures. Coffre, or et renfort demeurent anticipables ; collecte par contact, sans panneau ni arrêt supplémentaire.

22. **Enregistrements des transitions.** `runtime/1463-depth-review.webm` et `runtime/960-depth-review.webm` contiennent les changements de voie. Les parcours réels enregistrent également entrée, arrêts, reprises, retour après combat et sortie droite. Les retours sont audités à voie et progression exactes dans `final-audit.json`.

23. **Comparaisons des véhicules.** Galerie `review.html` : boutons sprite isolé, voie haute, voie basse, marchand. Neuf captures candidat/scène dans `candidates/`, avec dimensions, alpha et SHA-256 dans `comparison.json`. Prompts manuels conservés dans `generation-prompts.json` et `component-prompts.json`. Génération intégrée uniquement ; aucun recours API/CLI.

24. **Tests ciblés.** 55 tests Traversal/autorité/retour passent dans la suite finale. Les contrats ajoutés vérifient quatre roues animées, bornes et contacts, rayon/rotation aux deux viewports, disponibilité RGBA, ordre des plans, séparation des plantes et beats, coordonnées de route stables. Les tests existants vérifient autorité, voies, Ignore/Flee, forks et retour. Résultats détaillés dans `final-audit.json`.

25. **Suite complète.** Relance finale : **2 466 tests passés, zéro échec, 145 fichiers**. Résultats dans `full-tests.json` et `final-audit.json`. Une première exécution avait passé 2 465 tests ; seul le test Flee avait dépassé cinq secondes sous charge Chromium. Il passait isolément. Son délai est porté à dix secondes pour cette simulation de plus de cinquante secondes de route avec DOM complet ; aucune assertion supprimée ou désactivée. Commande finale : `node node_modules/vitest/vitest.mjs run --maxWorkers=1 --minWorkers=1 --reporter=json --outputFile=tools/traversal/qa/caravan-depth/full-tests.json`.

26. **TypeScript.** `node node_modules/typescript/bin/tsc --noEmit` passe ; le build exécute également le typecheck.

27. **Build.** `npm run build` passe. Avertissement de taille des chunks Vite existant, aucune erreur de compilation. Le build de production est ouvert dans Chromium pour le contrôle du verrou.

28. **Diff et intégrité.** `git diff --check` passe. `audit-caravan-final.mjs` confirme les neuf masters world-v1 byte-identiques à la base via SHA-256, vérifie les neuf nouveaux assets et l’absence de changements dans les autorités campagne/jeu/combat et CharacterVisualRegistry. Toutes les images sources générées sont conservées ; aucune régénération silencieuse d’un master.

29. **Production.** `enabled: false`, `designAssetsReady: false`, `rolloutLegIds: ['T0']`. `release-check.json` prouve zéro surface Traversal et l’écran titre visible dans le build de production, même avec la query de QA. T0 reste la seule route de cette passe.

30. **Limites intentionnelles.** Qualification Chromium desktop 1463 × 823 et 960 × 720 ; aucune revendication portrait/mobile. Occlusion clairsemée et locale, pas constante. Les peintures acceptées restent plates à l’intérieur de leur plan ; aucune simulation 3D ni nouvelle collision n’est ajoutée. L’évaluation artistique finale est proposée à l’opérateur par les captures et le jeu local. Les nouvelles variantes de dégagement sont des dérivés explicitement documentés, pas des masters remplacés.

31. **Migration différée.** La sortie reste `Traversal → accélération → sortie droite → fondu → TravelView`. La prochaine mission pourra viser `semantic campaign presentation boundary → NarrativePresentationResolver → CINEMATIC_VIDEO / CINEMATIC_HOLD / TRAVEL_STILL / STATIC_TABLEAU / GAMEPLAY_UI / COMBAT`, puis réserver TravelView au fallback/récupération/debug. Rien de cette migration n’est implémenté ici.

32. **Version control.** HEAD reste `7cfccfe37e6d5721db96748080b9552d4b4f32fb`. Travail non committé, non poussé. Les éléments QA non suivis préexistants sont conservés.

## Reproduction

Lancer `node tools/traversal/qa-server.mjs 5184`. Pour les scripts hérités, définir `TRAVERSAL_QA_ROOT=tools/traversal/qa/caravan-depth` et `TRAVERSAL_QA_PORT=5184` avant `qa-freeze-live.mjs`, `qa-freeze-targeted.mjs`, `qa-freeze-seams.mjs seams` ou `qa-freeze-release.mjs`. Les scripts `qa-caravan-candidates.mjs` et `qa-caravan-depth.mjs` utilisent 5184. Les simulations de présentation n’ajoutent aucun contenu canonique ; les parcours `qa-freeze-live.mjs` utilisent le jeu réel et ses handoffs.

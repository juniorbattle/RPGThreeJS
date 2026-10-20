# Camp P03 — dossier de réalisation du pilote

> **Suite interactive manuelle du20octobre :** compagnon retrouvé puis rapproché ; [keyframe v2 et étude des quatre poses de coupe maintenant proposés](MANUAL_CAMP_P03_STILLS_REVIEW_2026-10-20.md) sous autorisation directe « go ». Les raccords/appuis ne sont pas validés ; aucun rendu continu ou G2 accepté. Le texte préparatoire ci-dessous conserve sa portée historique ; la récurrence ne génère pas de média.

> **Revue complémentaire :** la même revue contient désormais v3 (talon libre/bâton/lame corrigés), un arrêt proposé et une simulation de cadrage à image commune par coupe. Aucune continuité de marche, parallaxe ou phase filmée n'est certifiée ; prochaine revue opérateur sur ces poses et leur phase commune. [Proposition de pilote05](P03_CONTINUOUS_PILOT05_PROPOSAL_2026-10-20.md) désormais préparée, exception manuelle et budget encore à autoriser ; aucune vidéo lancée.

**PROPOSED FUTURE DESIGN — préparation livrée, 20 octobre 2026.** Tâche `CAMP-P03-REALIZATION-DOSSIER`, [OD-2026-10-20-B](RECURRING_CAMP_P03_OPERATOR_DECISION_2026-10-20.md), baseline `dev@18482498925b70f0f26abf1233a842bcc86ce94e`. Document de réalisation pour le chantier artistique manuel ; aucun fichier de soumission fournisseur. Les valeurs de mise en scène ci-dessous sont des propositions à éprouver, pas des mesures d'un rendu existant.

Le défaut à résoudre est le **glissement observé par l'opérateur sur le candidat04**. Ses poses/relations restent utiles ; sa marche n'est pas artistiquement acceptée. Le retour « Ok excelllent » porte sur le traitement/storyboard28s ; il ne certifie ni locomotion, ni perspective filmique, ni animatique G2, ni portrait runtime. Ce dossier approfondit uniquement P03 et ses deux raccords ; il ne refait pas les quatre panneaux ni l'audit des huit slots.

## 1. Périmètre et moment exact

P03 occupe **12–22s** du [montage proposé28s](CAMP_DEPARTURE_28S_STORYBOARD_2026-10-20.md) : pilote continu proposé de **10s**, à vitesse normale, sans coupe interne. Le [storyboard structuré](../../tools/cinematics/specs/manual-camp-20261020/storyboard-28s.json) reste non exécutable. Le descripteur camp livré reste12s ; aucun allongement runtime n'est réalisé ou accepté ici.

Chronologie vérifiée dans la source de cette baseline :

- `src/game/GameApp.ts:1499–1526` : prologue → `acte_ouverture` → `playDialogue('camp_departure', …, { cinematicId: 'camp_departure' })` → entrée campagne.
- `GameApp.ts:1223–1244` : en mode vidéo, prélude attendu avant `presentDialogueTableau` puis `openDialogue`. La sortie future du montage complet devra donc rendre la main au STATIC_TABLEAU existant, sans imposer de nouveau hold.
- `src/game/content.ts:205–217` : la première réplique commence « Avant de franchir la porte ». **Tous les déplacements de P03 restent dans l'allée intérieure du camp**, avant la limite de départ. Ni porte franchie, ni arrivée ailleurs.
- `src/campaign/LionCampaignStructure.ts:76–91` : `lion-camp`, famille `LION_CAMP`, distribution Maelor/Alistair/Marian/Séraphine/Kestrel. Le trio cadré est un sous-ensemble ; il ne raconte ni une compagnie réduite à trois ni une nouvelle recrue.

Une marche locale de rassemblement, gestes sur équipement déjà porté et regards suffisent. Aucun ordre inédit, texte/voix, salut rituel, combat, effet magique, récompense, coût, soin, choix ou fait canonique nouveau. Alaric n'est pas ajouté. La dérive de l'ancien conseil d'or au dialogue étape3 reste recensée dans le traitement ; ce dossier ne modifie pas ce texte.

## 2. Références verrouillées pour ce travail

**CURRENT FACT :** les six SHA256 ci-dessous ont été recalculés le20octobre2026 et correspondent au storyboard. Les cinq images ont été inspectées. Leur rôle est identité/géographie/style ; aucune n'est automatiquement le premier photogramme de P03.

| Référence | Chemin et SHA256 | Usage / provenance |
| --- | --- | --- |
| Marian V2 | `public/assets/characters/pixel/masters/white_mage.png` — `a02a3a3dc9ffc55c1e9ec217a8dab9bed4bce2a33c4edd3b12d0243eae451bda` | Master promu ; voile clair, robe ivoire/or/bleu, bâton solaire, visage couvert. |
| Maelor V2 | `public/assets/characters/pixel/masters/maelor.png` — `7fbd98cb90feae2bd6ce55d0e79e6995178cc285ca7c59b6908f62d77063e2ec` | Master promu ; capuche/visage couvert, violet/or, livre porté et dague existante à la ceinture. |
| Alistair V2 | `public/assets/characters/pixel/masters/alistair.png` — `84ff7bdc3e2165b39f488fdef6ee8af6ff0bec8c2113b047791b35f62efb0219` | Master actuel ; casque fermé, armure sombre/or, cape rouge, une épée. Conserver le plastron actuel sans interpréter son emblème/origine. |
| Camp nocturne promu | `public/assets/generated/lion-phase/environments/demo-environment-pack-v1/cinematic-source/lion-camp-cinematic-source.png` — `7e2eaba3b2d18d409fb0126a0e4ad9361caa5f61148f2a145b4cd2fbec379c32` |1672×941 ; `lion_camp_cinematic_source`, famille `LION_CAMP`, rôle `CINEMATIC_SOURCE_ENVIRONMENT` dans `src/render/data/demo-environment-pack-v1.production.json`. |
| Composition candidat04 | `tools/cinematics/candidates/manual-camp-20261019/candidate-04-source.png` — `ee04113053ce19c88a409cf0789a8abdc1fc828a305272ee83dbe66520a33ed0` |1672×941 ; source manuelle datée19octobre20:19:42Z, provenance voisine `candidate-04-provenance.json`. Identités, lumière et relations utiles ; appuis/lame/angle à corriger pour P03. |
| Plan fourni v1 | `docs/autonomy/cinematics/reference-minimax-production-plan-v1-2026-10-13.txt` — `c4de6c3e7ed260f297ee6b00e4f87e047133cadc9bfa990887038f3e41d14783` | Archive exacte du plan artistique fourni ; document non LOCKED, pas une autorisation de génération. |

Autorité V2 : `src/render/generated/characterSystemV2Manifest.json` (`PROMOTED`, `masterAuthority`) et mappings `src/render/assetManifest.ts`. Le registre d'environnements rapproche la source de développement Option C/phase4b et sa promotion. La provenance candidat04 énumère ces mêmes quatre sources SHA ; ne pas substituer un ancien Alistair ou extraire un personnage aplati de cette composition.

Les candidats01–04, les blocs Bois-Clair incomplets, leurs prompts/receipts/rejets et les huit MP4 restent conservés. Ce dossier n'utilise aucune prolongation, boucle, interpolation ou version ralentie de la marche04 comme base acceptée.

## 3. Géographie de travail et perspective à établir

**Constats de référence :** le feu et les tentes proches sont à gauche, les tentes/lanternes et une roue à droite, l'allée s'ouvre en profondeur, avec rivière, aqueduc/château et croissant lointains. Les repères distants identifient le lieu ; ils ne mesurent pas les contacts au sol. Le château n'est pas une propriété de la compagnie.

**Implantation proposée, non topographie canonique :** un trajet local vers la droite dans l'allée dégagée, devant les tentes ; son extrémité reste intérieure et hors de tout seuil. Choisir un segment praticable de quelques mètres, sans traverser feu, caisses, cordages, herbe dense ou mobilier. Marian reste à gauche/arrière, Maelor au milieu, Alistair à droite/avant ; léger décalage en profondeur, sans former une ligne rigide. La caméra observe leur trois-quarts avant depuis le même côté du trajet que P02/P04. Ne pas inverser l'axe au montage.

Avant tout futur keyframe, l'artiste devra établir une petite implantation de travail, avec :

1. origine et fin intérieures du trajet, emprise caméra, sens gauche→droite et côté d'axe commun aux raccords ;
2. projection cohérente du plan du sol, horizon et volumes des tentes/objets connus, échelle relative des trois acteurs ;
3. trois repères proches persistants : A au voisinage de la première semelle, B près d'un appui au milieu du trajet, C près de l'arrêt, choisis parmi irrégularités de terre/pierres déjà visibles ou leur reconstitution cohérente ; aucun marquage narratif ajouté ;
4. continuité des tentes/foyers vus sous le nouvel angle, silhouettes trois-quarts des V2, ombres de contact et hauteur réelle de lame ;
5. zones encore inconnues : côtés cachés des acteurs/objets et arrière des tentes. Les concevoir et les faire revoir, sans prétendre les avoir extraits ou validés depuis la plate actuelle.

La référence ne fournit ni reconstruction3D, ni focale calibrée, ni vues arrière acceptées. Ne pas faire pivoter artificiellement la plate ni y coller les masters pour simuler cet angle. Garder la famille pixel-art moderne/HD-2D : volumes, matières et éclairage incarnés, sans bascule photoréaliste/anime/3D générique.

## 4. Cadre et caméra du pilote

Cadre paysage16:9, corps entiers trois-quarts, caméra à hauteur de hanches, perception35–40mm **indicative**. Le triangle de profondeur doit laisser lire les six pieds au fil de leurs appuis, pas aligner les jambes les unes derrière les autres. La robe peut couvrir le haut des jambes de Marian ; chaque semelle doit réapparaître lors du contact et du passage. Ne pas relever ou raccourcir magiquement sa tenue.

Proposition de composition à vérifier sur tout le trajet : sommet du bâton sous y=8% ou plus bas, corps dans x=10–90%, point le plus bas des pieds/de la lame au-dessus de y=82%. Les15% inférieurs restent réservés aux commandes, avec une marge additionnelle. Ce sont des guides de composition, pas une assertion runtime. Dimensionner le cadre sur **l'enveloppe complète du déplacement**, pas sur la pose de départ. Garder les silhouettes suffisamment grandes pour juger genoux/chevilles à taille PC.

Caméra tenue de t=0 à4s au minimum. Un accompagnement discret de4 à8s est seulement optionnel, plus lent que les acteurs et avec les repères proches toujours visibles. Pour ce premier pilote, conserver le cadre fixe pendant10s est préférable si la lisibilité le permet. Aucun zoom, panoramique d'évitement, tremblement, gros plan, coupe interne ou flou ne peut masquer les appuis. Si l'accompagnement est retenu, faire lire au moins une alternance complète par acteur pendant la portion fixe et deux cycles complets sur l'ensemble.

Le déplacement du décor, une distance en pixels ou la parallaxe des étoiles ne prouvent pas la marche. Évaluer le pied **relativement à sa surface de sol proche**, en compensant la caméra lorsque nécessaire. Une caméra fixe ne suffit pas non plus si les semelles glissent.

Portrait : garder comme proposition future le cadre16:9 entier contenu, commandes séparées ; ne pas certifier ce mode ni modifier le runtime. Le recadrage central9:16 qui a coupé les personnages du candidat04 reste un échec connu.

## 5. Partition physique continue — temps locaux P03

Un cycle complet signifie **contact gauche → contact droit → contact gauche suivant**, avec balancements/intervalles lisibles ; compter deux cycles exige trois contacts gauches et deux droits, sans compter la simple pose initiale comme cycle. Le relevé de revue pourra commencer par le pied opposé si sa phase est explicitement nommée. Les temps sont des cibles de jeu, pas une chorégraphie mécanique imposée au rendu.

| Temps local / montage | Action et observation recherchée |
| --- | --- |
|0–0,5s /12–12,5s | Reprendre le report de poids amorcé par P02, bassin porté par l'appui ; pied libre encore identifiable. Pas de saut entre deux positions de groupe. |
|0,5–2s /12,5–14s | Initiation légèrement décalée : Alistair ouvre, Maelor puis Marian suivent sans réaction/ordre narratif ajouté. Bassin se déplace sur l'appui, talon se libère, genou fléchit, pied libre dégage le sol puis se pose. Chaque départ doit finir assez tôt pour permettre les cycles ci-dessous. |
|2–4s /14–16s | Première alternance en cadre tenu : impulsion, passage, contact opposé puis transfert. La semelle chargée reste au même repère tandis que le corps avance ; la longueur de pas explique la distance. Aucun acteur ne reste figé pendant que la formation translate. |
|4–8s /16–20s | Poursuivre au moins deux cycles complets par acteur, décalés et continus. Objectif de lecture : un premier G→D→G entre environ1,5–4,5s et un second entre4,5–7,5s, à adapter à chaque départ. Marian a des pas plus retenus, Alistair une charge d'armure perceptible, Maelor protège le livre ; aucun rythme commun artificiel. Pas d'accéléré ou ralenti pour faire tenir le quota. |
|8–9,6s /20–21,6s | Décélération : foulée raccourcie, bassin freiné au-dessus du dernier pied posé, deuxième pied rejoint une position d'équilibre. Le pied porteur ne voyage pas vers l'arrière sous un torse immobile. |
|9,6–10s /21,6–22s | Appuis et masse stabilisés, respiration/cape seulement en extinction. Réserver cette courte fin pour lire l'arrêt. Raccord P04 sur le même état ; P04 peut laisser finir le mouvement secondaire, pas déplacer des racines déjà arrêtées. |

Le jeu des bras/épaules suit les transferts ; l'armure, le livre et les tissus ont une inertie sobre. Les capes retardent puis se déposent ; elles ne servent pas de rideau permanent sur les pieds. Pas de semelle flottante, d'ombre détachée, de genou verrouillé pendant une translation, de pied qui change de taille ou d'étirement de jambe pour rattraper le sol. Ne pas rejeter une marche juste pour une variation organique de durée ; rejeter tout cycle illisible ou triché. Si10s ne permet pas initiation, deux cycles et arrêt lisibles, revoir la partition du pilote au chantier manuel avant production, sans modifier automatiquement28s ou12s.

Fonction dramatique de P03, rapprochée du compagnon retrouvé (§§2/4/8) : faire sentir la mise en mouvement et le poids de ce groupe avant sa préparation dialoguée. La progression vient du démarrage décalé, de la marche incarnée puis de l'arrêt commun ; le dernier transfert de masse, suivi de la retombée des tissus, fournit l'accent visuel de raccord. L'image mémorable reste à obtenir et à juger sur le rendu : aucun nouvel incident, ordre, salut ou effet spectaculaire n'est ajouté pour la fabriquer. Le cadre tenu est une contrainte du pilote de locomotion, pas une interdiction de caméra cinématographique pour le montage final.

## 6. Continuité des acteurs et des objets

Relever les côtés **anatomiques**, jamais seulement gauche/droite de l'image, sur le futur angle. Dans les masters examinés : livre de Maelor à sa gauche (droite image), bâton de Marian à sa droite (gauche image), épée d'Alistair à sa droite (gauche image). Confirmer ces attaches lors de la revue du keyframe, sans miroir automatique.

| Acteur | Début, marche, arrêt et raccords |
| --- | --- |
| Marian | Même voile/robe/ornements, bâton unique dans la même main. Décoller son extrémité pour avancer, la reposer sobrement ; lorsqu'elle touche, elle reste à son point de sol jusqu'au relevé. Ni quatrième jambe qui patine, ni bâton extensible. Deux semelles discernables aux contacts malgré la robe. |
| Maelor | Livre fermé stabilisé contre le corps, même main, fermoir/orientation/épaisseur conservés ; pas de passage de main, duplication ou ouverture. Dague reste attachée à sa ceinture, aucune arme tirée. Bras libre et bassin compensent la marche sans faire flotter le livre. |
| Alistair | Casque/plastron/cape actuels, une épée dans la même main. Corriger la pose de lame pour une garde au sol nette, en avant/à l'extérieur de la trajectoire des jambes et de la cape ; aucun nouveau fourreau. Pointe visible et séparée du sol même au point bas de l'oscillation. Cape suit derrière sans traversée de lame. |

Pour chacun, renseigner une ligne début/milieu/fin et chaque coupe : pied porteur, pied libre, main/objet, orientation de tête/buste, position relative, lumière. Rien ne disparaît derrière une occlusion puis réapparaît changé. Les ornements existants restent du design, pas une nouvelle explication de lore. Aucun équipement gagné ou changé par cette action de présentation.

## 7. Brief du futur keyframe filmique — à réaliser séparément

**Brief non soumis :** représenter la première fraction de P03 dans l'allée intérieure du camp nocturne LION_CAMP,16:9, trois corps V2 entiers sous un angle trois-quarts avant à hauteur de hanches. Marian à gauche/arrière, Maelor intermédiaire, Alistair à droite/avant ; six pieds dégagés des objets du décor. Maelor tient son livre fermé, Marian son bâton, Alistair son épée hors du sol/cape. Un report de poids préparatoire lisible, sans pose de course ni départ accompli. Recréer les acteurs et les volumes de ce lieu avec lumière chaude des foyers à gauche et profondeur bleue nocturne, matières et vocabulaire pixelHD2D des références. Conserver les repères connus, sans nouvelle architecture ou emblème expliqué. Prévoir l'espace vers la droite pour le trajet et la marge basse des commandes.

Le futur premier photogramme doit correspondre à la phase d'entrée choisie, avec vraie perspective des chaussures, bassin, mains/objets et ombres au sol. Une belle pose seule ne promet pas la locomotion. Faire revoir séparément cette image, l'implantation et les intentions de raccord ; aucune image n'est produite par ce dossier. Ne soumettre ni master sprite, ni plate latérale, ni panneau schématique en les appelant keyframe filmique.

Le modèle, les limites de durée/références, le coût, le budget, les paramètres et un éventuel découpage fournisseur seront vérifiés **au moment de la production manuelle autorisée**. Aucun prompt payable, identifiant de tâche, crédit consommé, polling ou tentative05 n'est créé ici ; l'exception manuelle04 n'est pas étendue. Musique, voix, ambiance et audio vidéo demeurent DEFERRED ; revue silencieuse.

## 8. Raccords à préparer avec l'artiste

**Entrée P02→P03,12s :** même côté d'axe et lumière ; livre fermé/main identique, bâton et épée dans leurs mains initiales. P02 finit sur l'amorce du report de bassin ; P03 commence avant que le pied libre ait déjà parcouru une distance inexpliquée. Le changement de focale révèle les pieds sans couper la phase porteuse. Prévoir une fiche des deux poses limitrophes ; elle ne prouve pas les images intermédiaires.

**Sortie P03→P04,22s :** conserver ordre Marian/Maelor/Alistair, décalage de profondeur, trajet gauche→droite et position locale d'arrêt. Couper après le dernier contact et la stabilisation du bassin ; le cadre plus large de P04 retrouve les mêmes appuis. Les tissus peuvent achever leur retombée22–24s. Aucun saut de lieu ou franchissement implicite. La fin28s reste pré-dialogue, à l'intérieur ; pas de hold/dialogue inédit ni d'agence supprimée.

Les poses limitrophes devront être dessinées ou rendues puis revues lors de l'atelier manuel. Leur absence actuelle est explicitement reconnue : ce texte prépare leurs contraintes, sans livrer une animatique acceptée.

## 9. Grille de revue du futur rendu continu

Tous les résultats sont **NOT_RUN / NON OBSERVÉ** aujourd'hui. Première lecture intégrale silencieuse à1×, sans interruption ; deuxième lecture1× centrée sur un acteur à la fois. Ensuite seulement ralenti et photogrammes pour localiser un défaut. Conserver fichier brut, durée/cadence/résolution, SHA, version du brief, références et paramètres de production, ainsi que les rejets. Un export monté ou recadré seul ne suffit pas.

| Critère | Relevé exigé pour Marian, Maelor et Alistair séparément | Motif de correction/refus |
| --- | --- | --- |
| Continuité réelle |10s continues à vitesse normale ; caméra fixe initiale ≥4s ; aucun segment éludé | Coupe, ralenti/prolongation04, boucle ou travelling cachant la marche. |
| Initiation | Horodatage du transfert, levée du pied libre, premier contact et prise de charge | Translation du bassin sans libération/pose du pied. |
| Deux cycles chacun | Remplir G1, D1, G2, D2, G3 (ou inverse), avec temps et repère de sol ; aucune case déduite d'une autre personne | Moins de deux cycles, pieds cachés sur plusieurs phases ou cycle inventé par une coupe. |
| Appuis | Repères A/B/C proches et persistants ; pied chargé fixé pendant l'avancée du bassin, ombre de contact cohérente | Pied qui patine, flotte, saute ou change d'échelle ; pixels bruts sans compensation caméra. |
| Poids / allure | Flexion/extension, impulsion et longueur de pas accordées au déplacement ; décalage individuel | Formation translatée en bloc, torse flottant ou cadence mécaniquement identique. |
| Arrêt | Horodatage du dernier contact et fin de transfert ; racines stables en fin de plan | Glissement résiduel ou arrêt brutal sans freinage. |
| Objets / vêtements | Début/milieu/fin et raccords : mêmes mains, nombre, attaches, livre fermé, bâton posé/relevé, lame séparée du sol et de la cape | Mutation, disparition, traversée, livre transféré ou lame plantée. |
| Lecture du cadre | Corps/bâton/lame/pieds lisibles sur toute la trajectoire, au-dessus des commandes | Recadrage/occlusion empêchant le jugement, même si une assertion de bounds passe. |
| Lieu / montage | Même famille nuit, axe, lumière, repères, arrêt intérieur et raccords préparés | Nouvelle porte franchie, nouveau lieu/acteur/événement/effet, canon anticipé. |
| Style / décision | Acteurs intégrés au volume, identité V2 et jugement artistique opérateur explicite | Collage sprite/plate, style substitué ou simple SUCCEEDED présenté comme acceptation. |
| Intention sonore / statut | Fiche de repères ci-dessous ; revue de marche silencieuse ; provenance/licence et approbation à obtenir séparément pour tout futur son | Son manquant présenté comme intégré, licence présumée ou musique masquant une marche non convaincante. |

Une case non observable reste **NON ÉVALUABLE**, jamais PASS. Une mesure/détection peut aider à retrouver une frame ; aucun seuil de pixels, schéma ou QA technique ne remplace le jugement continu à vitesse normale. Si le pilote échoue, conserver rendu et raison, changer une hypothèse précise (angle, partition, géométrie ou méthode) avant toute nouvelle demande manuelle autorisée. Ne pas lancer P01/P02/P04 en série pour contourner un P03 non convaincant. Acceptation artistique puis intégration technique restent des décisions distinctes.

## 10. Compagnon artistique retrouvé et rapproché — suite manuelle du20octobre

Référence exacte retrouvée dans la **Bibliothèque ChatGPT** : **`RPGThreeJS_CONTRAT_ARTISTIQUE_CINEMATIQUES_v1_2026-10-13.md`**, version1.0 du13octobre. L'opérateur a demandé « go » sur la récupération et la confrontation à P03. Le texte intégral visible est conservé en [transcription UTF-8](cinematics/RPGThreeJS_CONTRAT_ARTISTIQUE_CINEMATIQUES_v1_2026-10-13.txt), avec [provenance et comparaison détaillée](cinematics/P03_COMPANION_RECONCILIATION_2026-10-20.md). Il s'agit d'une référence artistique non LOCKED ; aucune nouvelle autorisation de génération ou d'intégration n'en est déduite.

La recherche locale précédente reste exacte dans son périmètre historique ; l'espace distant qui n'avait pas été consulté a maintenant fourni le document. L'export du fichier original n'a pas abouti : la copie est une transcription du texte rendu dans l'éditeur, contrôlée intégralement, pas une archive des octets Markdown d'origine. Ni le document distant ni ses cases d'acceptation n'ont été modifiés.

Rapprochement accompli : scènes non verbales, acteurs physiques issus des identités V2, lieu recréé en profondeur, identité Option C, accessoires persistants, caméra motivée, canon/agence préservés, durées exploratoires et contrôle artistique distinct du flux technique concordent avec P03. Le document ne fournit pas de nouveau storyboard précis et n'accepte aucun rendu. La liberté de travelling/montage qu'il décrit ne remplace pas la continuité exigée pour ce pilote. Sa mention générale d'audio différé est datée du13octobre : les exceptions UI/combat set1.7.0 actuelles restent acquises ; musique/voix/ambiance/audio vidéo demeurent différés. Aucun conflit LOCKED nécessitant une modification n'a été identifié pour cette préparation.

**Complément d'intentions sonores — papier seulement, aucun son créé ou activé :** 0–2s, premier appui et mise en charge ; 2–8s, contacts de semelles sur terre, froissement retenu de robe/cape, léger poids d'armure et tenue du livre ; 8–10s, dernier contact et retombée des tissus, respiration dramatique avant P04. Ne pas ajouter bruit d'impact d'épée, livre qui s'ouvre, dialogue, magie ou événement hors champ. Feu/vent déjà représentés pourraient soutenir le lieu dans un futur travail sonore dédié. Une éventuelle continuité musicale originale relierait P02/P03/P04 sans accent à chaque pas ; aucune piste, composition, licence ou acceptation n'est acquise. Le futur rendu de locomotion sera d'abord revu silencieusement à1× ; le son ne peut en corriger ni masquer les appuis. Modèle, budget, génération et chaîne sonore restent à traiter dans leurs autorisations manuelles respectives.

## 11. Portée de livraison et passage de relais

**Préparation indépendante complète ; compagnon récupéré et rapproché ; production artistique future à ses portes manuelles.** Aucun jeu joué, rendu produit, appui démontré ou nouveau verdict artistique/runtime. Les339jobs et leurs acceptations, V6, économies/élites/atlas, cinq familles natives et vrai hidden/suspend audio encore ouverts, audio `4d69c23` / `ACCEPTED_SCOPED`, critères PC et mobile après stabilité PC sont conservés.

Une prochaine action : **atelier artistique manuel : préparer pour revue le keyframe filmique d'entrée P03 et ses poses de raccord P02/P04, à partir de l'implantation et des références du dossier rapproché**. La récupération est close ; le présent « go » n'a pas lancé de génération. Sans nouvelle autorisation manuelle de production ni défaut PC indépendant déjà autorisé et démontré, conserver ce checkpoint ; ne pas refaire la recherche, le dossier, le storyboard ou l'audit.

Conformité de préparation : set1.7.0, baseline LOCKED `f4aae63e792025430c16153e1cd329c20745cf6b`. Contrats lus : constitution, index/manifeste, WORLD_AND_CHARACTERS, CAMPAIGN_AND_STATE, PRESENTATION_AND_MEDIA, UI_AND_ACCESSIBILITY, AUTHORING_AND_QA, AUTONOMOUS_WORK_PROTOCOL. Matrice et vérifications de clôture dans le [handoff](handoffs/2026-10-20T1545Z-codex-p03-dossier.md). Aucun contrat, source runtime, descripteur/durée, média, audio ou réglage de scheduler modifié.

Suite manuelle de récupération/rapprochement : [handoff courant](handoffs/2026-10-20T1725Z-codex-p03-companion.md), matrice et provenance dans la comparaison liée en §10. La livraison initiale ci-dessus conserve sa portée historique.

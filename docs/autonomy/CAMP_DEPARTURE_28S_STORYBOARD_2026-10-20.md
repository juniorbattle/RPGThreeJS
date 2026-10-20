# Camp du Lion — traitement et storyboard28s

**PROPOSED FUTURE DESIGN — v1, 20octobre2026. À examiner ; ni storyboard artistiquement accepté, ni master produit.** [Autorisation de préparation OD-2026-10-20-A](CAMP_STORYBOARD_OPERATOR_DECISION_2026-10-20.md). Baseline : dev `5b5b00427e7c9c4d15117155b62c6f5a80dfd198`.

[Ouvrir le storyboard et sa lecture chronométrée](../media/cinematics/camp-departure-28s/storyboard.html). Les panneaux sont des schémas originaux de cadrage, pas des keyframes filmés ni une preuve de locomotion. [Découpage structuré non exécutable](../../tools/cinematics/specs/manual-camp-20261020/storyboard-28s.json).

## Intention

Faire sentir le poids d'une petite compagnie qui se prépare à quitter un camp immense et vivant. Courbe : **lieu → personnes → effort partagé → ampleur du voyage**. La force vient des changements d'échelle, du déplacement physique et d'une image finale composée ; aucun combat, révélation ou effet magique ajouté. L'énergie FF9 guide le rythme et les raccords, sans reprendre ses scènes ou ses assets. Le rendu reste pixel-art moderne/HD-2D : profondeur, éclairage intégré et volume des acteurs, jamais des sprites découpés glissés sur une plate, ni un remplacement photoréaliste ou3D générique.

28secondes est une hypothèse de montage :6+6+10+6. Le rythme devra se défendre sans musique. Ne pas ralentir/étirer le candidat04, boucler sa marche ou masquer un défaut derrière des coupes rapides. Les trois acteurs de sa composition restent des références utiles de poses et de relations, pas une animation réutilisable acceptée.

## Fiche de vérité

| Champ | Source / contrainte actuelle |
| --- | --- |
| Slot | `camp_departure`, l'un des huit IDs ; aucun nouvel ID runtime |
| Avant | `GameApp.startNewChronicle` : prologue puis `acte_ouverture` |
| Après | `playDialogue('camp_departure', …, { cinematicId: 'camp_departure' })`, puis entrée campagne ; pas une audience ou un combat |
| Moment | Le dialogue commence « Avant de franchir la porte » ; mouvement local **dans** le camp, rassemblement avant la limite. Ne pas montrer le franchissement ou une compagnie déjà partie |
| Distribution | LionCampaignStructure `lion-camp` : Maelor, Alistair, Marian, Séraphine, Kestrel. Cadrer seulement Marian/Maelor/Alistair est un sous-ensemble ; leur présence ne signifie jamais « trois seuls membres » ou recrutement des autres |
| Décor | Famille LION_CAMP nocturne promue : tentes, feu/lanternes, rue, rivière, aqueduc/château et croissant. Le château distant n'est pas une forteresse possédée par la compagnie |
| Présentation seule | Rassemblement, regards, poids/équilibre et gestes sur équipement déjà porté. Aucun gain, dépense, soin, changement d'équipement, commande de route ou choix résolu |
| Hors cadre | Kestrel/Séraphine restent disponibles au dialogue. Ni apparition obligée d'Alaric, ni Cedric/Garen, ni guetteur inventé, ni transport pilotable |
| Dialogue | Aucun texte ni voix dans la vidéo ; garder intégralement le dialogue interactif et sa temporalité |

**Dérive indépendante constatée, non modifiée ici :** l'étape3 du dialogue contient encore l'ancien conseil d'or exposé jusqu'au refuge ; la doctrine set1.5.0 attribue les gains immédiatement et recharge la dernière vraie sauvegarde. Le storyboard ne représente ni ne reprend ce conseil. Une éventuelle correction factuelle de ce texte est un chantier distinct, pas un changement de canon glissé dans ce livrable.

## Les quatre plans

### P01 — Le lieu nous dépasse ·0–6s

**Cadre :** ensemble à hauteur humaine, perception28–35mm indicative, profondeur depuis les piquets/cordages déjà présents vers la rue puis les repères distants. Les acteurs ne sont pas une frise frontale ; trio dans le tiers médian, perspectives compatibles avec la source promue.

**Action :**0–2s laisser lire le camp ;2–5s courte avancée caméra en diagonale, les cordages de premier plan s'écartent réellement des plans lointains ;5–6s retrouver clairement les trois silhouettes. Feu, tissus et lumière vivent sobrement, sans tempête, nouvelle météo ou spectacle autonome. Les pieds restent posés tant que les acteurs ne démarrent pas.

**Raccord :** la diagonale mène au livre porté par Maelor ; coupe vers le même côté de son épaule, même lumière chaude à gauche et lune froide en profondeur. Le mouvement caméra révèle les personnes et le volume ; il ne simule pas une marche.

### P02 — Ce que chacun porte ·6–12s

**Cadre :** plan moyen trois-quarts, perception50mm ; livre/main de Maelor au premier niveau, bâton de Marian lisible, silhouette d'Alistair en profondeur. Visages couverts et identité conservés. Ne pas pousser jusqu'à un gros plan qui efface les attaches des objets.

**Action :**6–8s Maelor stabilise contre son corps le livre déjà porté, sans l'ouvrir ni le faire changer de main ;8–10s Marian resserre sa prise existante sur le bâton et reporte son poids ;10–12s Alistair oriente son buste/regard vers la direction du rassemblement. Réactions sobres, pas de salut, serment ou ordre inédit. L'épée reste dans la main actuelle, tenue visiblement au-dessus du sol ; ne pas inventer fourreau, nouvelle arme ou accessoire.

**Raccord :** maintenir la direction écran gauche→droite, puis coupe sur l'amorce d'un appui visible, et non sur un pied déjà déplacé artificiellement. Le livre garde même main, orientation et fermoir. Un bref arrêt permet de lire les appuis avant P03.

### P03 — Le poids du premier pas ·12–22s

**Cadre :** plan d'ensemble trois-quarts à hauteur de hanches, perception35–40mm. Trois corps et tout le contact au sol visibles, avec une marge sous pieds et lame. Premier passage caméra **verrouillée** pendant environ4s, puis accompagnement discret plus lent que les acteurs. Pas de travelling latéral qui cache un tapis roulant.

**Action :**12–14s démarrage : report du bassin, pied libre se lève, premier contact ;14–20s quelques mètres dans l'allée intérieure, **au moins deux cycles gauche/droite complets par acteur**, observables sans occlusion prolongée. Départs légèrement décalés, longueur de pas propre à chacun ; aucune translation rigide de la formation.20–22s décélération : pas plus court, dernier pied posé, transfert de masse terminé. Capes et livre réagissent avec un retard cohérent, sans remplacer le mouvement des jambes.

**Raccord :** couper après un contact et une phase corporelle identifiables, conserver positions relatives et sens gauche→droite dans P04. Ne pas sauter temporellement au-delà de la porte. L'appui et la fin du mouvement doivent exister dans un rendu continu ; un montage ne suffit pas à les certifier.

### P04 — Avant le seuil ·22–28s

**Cadre :** ensemble plus large depuis le même côté de l'axe, perception28–35mm ; reprise des tentes et repères de P01. Léger recul ou dévoilement motivé jusqu'à26s, puis composition stabilisée. Le camp et la distance donnent l'ampleur ; aucun nouvel horizon reconstruit sans référence.

**Action :**22–24s fin de l'arrêt du trio à un point de rassemblement **intérieur** ;24–26s regards orientés vers la continuation de l'allée, livre et bâton toujours en main ;26–28s respiration vivante, aucun corps ne glisse après l'arrêt. La limite de départ reste devant eux/hors champ. Aucune barrière nouvelle créée pour dramatiser la scène.

**Image de sortie :** trois silhouettes et leurs équipements lisibles, marge des commandes réservée, lieu/moment compatibles avec le tableau de préparation. Ne pas imposer un hold sur cette image comme support du dialogue : le lecteur doit rendre la main au STATIC_TABLEAU existant, sans montage runtime modifié dans ce chantier.

## Continuité et production future

| Invariant | Contrôle par plan / raccord |
| --- | --- |
| Géographie | Un axe de déplacement intérieur, caméra du même côté ; relever plan au sol et correspondances des repères avant les keyframes. Ne pas générer un angle inversé depuis la même plate comme s'il était connu |
| Identités | Marian voilée/bâton ; Maelor couvert/livre et dague conservés ; Alistair casqué/armure et plastron actuels/une épée. Pas de nouvel emblème ou origine déduite |
| Objets | Main, nombre, orientation, attaches et trajectoires relevés début/milieu/fin, aussi de part et d'autre de chaque coupe. Le livre ne disparaît jamais ; la lame ne traverse ni sol ni cape |
| Lumière | Nuit continue, croissant stable, foyers chauds contre profondeur bleue ; pas de lever de soleil ou météo événementielle |
| Style | Volumes incarnés dans l'espace tout en gardant la ligne V2/pixelHD2D ; pas de calques de sprites ni lissage illustratif incontrôlé |
| Cadrage PC |16:9 ; conserver pieds/épée au-dessus de la zone basse15% réservée et éviter les bords latéraux. Vérifier au montage, pas seulement sur le premier photogramme |
| Portrait | Hypothèse de présentation : cadre16:9 **entier contenu** dans le viewport portrait, avec espaces autour et commandes séparées. Pas de crop central9:16 coupant les acteurs. Ce storyboard n'implémente ni n'accepte ce futur comportement runtime |
| Audio | Intention de courbe seulement ; revue silencieuse. Musique/voix/ambiances/audio vidéo restent DEFERRED ; aucun asset ou mix demandé ici |

**Sources conservées :** [plan fourni v1](cinematics/reference-minimax-production-plan-v1-2026-10-13.txt), SHA dans le JSON ; [source candidate04](../../tools/cinematics/candidates/manual-camp-20261019/candidate-04-source.png), utile pour composition/identités, pas photogramme automatiquement repris ; masters V2 courants et camp promu, chemins/SHA dans le JSON. Les nouvelles perspectives devront être conçues puis examinées ; la plate latérale ne suffit pas à les approuver. Le contrat artistique compagnon nommé par le plan reste NON RETROUVÉ ; ne pas prétendre l'avoir appliqué ou validé.

## Critères contre le glissement

1. Observer le rendu continu à vitesse normale, puis au ralenti/frames. Fixer plusieurs repères de sol proches des pieds ; compenser le mouvement caméra avec ces repères, jamais avec les étoiles ou une mesure brute des pixels.
2. Pendant l'appui, le pied reste au même endroit du sol pendant que le bassin avance au-dessus ; pendant le balancement, la jambe libre se déplace et dégage le sol. Refuser le même glissement de l'appui répété sur deux pas, une plante qui flotte ou une formation déplacée comme un bloc.
3. Lire pour **chaque** acteur deux cycles complets : appui gauche, passage, appui droit, passage. Ombre/contact, poids du bassin, flexion du genou, impulsion et longueur de pas doivent s'accorder avec la distance parcourue. Aucun seuil numérique ne remplace le jugement visuel.
4. Vérifier aussi initiation et arrêt, robe de Marian, maintien du livre de Maelor et garde au sol de l'épée d'Alistair. Un bâton n'est pas une quatrième jambe qui patine ; sa pose/soulèvement accompagne la marche sans s'étirer.
5. Si le plan échoue, conserver son rendu/rejet et changer une hypothèse précise (angle, rythme, géométrie ou méthode). Pas de nouvelles soumissions identiques ou d'allongement pour masquer le défaut.

## Passage à l'étape suivante

Ce livrable couvre le **traitement et le storyboard schématique**. Les cadrages, gestes et durées restent à examiner. Sa lecture chronométrée ne constitue pas une animatique filmique ou une acceptation G2, et aucun schéma n'est une image à soumettre au fournisseur.

Après revue du découpage et récupération/rapprochement du compagnon artistique : préparer d'abord **le seul plan pilote P03**, avec keyframe réellement cinématographique approuvé et raccords dessinés. La génération, le modèle, le budget et le découpage en jobs seront préparés/vérifiés au moment de cette production séparée ; aucun manifeste payable, prompt de soumission ou tentative05 n'est créé ici. Si P03 ne démontre pas les appuis, ne pas produire les trois autres plans en série. Acceptation artistique opérateur puis intégration technique demeurent séparées.

## Vérification de cette livraison

Documentation/prototype uniquement ; source runtime, huit médias, manifests, anciens candidats/receipts et contrats byte-identiques. Vérification : somme28s, continuité0–28 sans trou, quatre plans non exécutables, liens et SHA de références, lecture/pause/navigation clavier/fin28s du board, layout1366/390 et mode portrait entier, diff whitespace/LOCKED/validator. Aucun parcours campagne, test de marche réel, build jeu ou nouvelle QA gameplay revendiqué.

| Domaine | Conformité de la préparation |
| --- | --- |
| GAME_CONSTITUTION | PASS — présentation proposée, aucun nouveau droit de vérité |
| ART_DIRECTION / CHARACTERS / ENVIRONMENTS | PASS préparation — références V2/nocturnes conservées ; nouveaux angles NON ACCEPTÉS |
| NARRATIVE / CAMPAIGN | PASS préparation — sous-ensemble de cast, seuil non franchi avant dialogue |
| NARRATIVE_PRESENTATION | PASS préparation — un slot existant ; tableau/hold/agence conservés |
| TRAVERSAL / COMBAT | N/A — aucun moteur/équilibre/résolution modifié |
| SAVE | PASS conservation — aucune écriture/schéma nouveau |
| UI / ACCESSIBILITY | PASS prototype seulement — commandes clavier et cadre entier ; aucun PASS runtime portrait inféré |
| QA_EVIDENCE | PASS limites — board schématique et vérifications documentaires, aucune preuve de locomotion |
| REPOSITORY_GOVERNANCE | PASS — verrou propre, chemins explicites, publication normale dev autorisée |

Autorités : constitution, index/manifeste1.7.0, WORLD_AND_CHARACTERS, CAMPAIGN_AND_STATE, PRESENTATION_AND_MEDIA, AUTHORING_AND_QA, AUTONOMOUS_WORK_PROTOCOL ; baseline LOCKED `f4aae63e792025430c16153e1cd329c20745cf6b`. Aucune règle LOCKED modifiée. Revues indépendantes `cinematics-journey` et `contracts-guardian` : **PASS préparation seulement**, source courante relue, aucune acceptation artistique/G2/runtime déduite. Vérification Playwright du board : quatre plans/28s, six SHA de référence et deux liens, lecture/pause/seek clavier/fin28s,1366×900 et390×844 en reduced motion sans débordement, cadre16:9 entier contenu et commandes44px. Captures et résultat restent ignorés dans `tmp/cinematics/manual-camp-20261020/board-review/` ; inspection visuelle des deux captures effectuée. Aucun nouveau job de campagne ou build. Les schémas n'établissent aucune qualité de mouvement ou lisibilité du futur média sur téléphone.

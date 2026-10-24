# Fluidité de jeu, personnages animés et VFX

**OD-2026-10-24-B — direction opérateur ; plan de réalisation proposé.** Continuité de [OD24-A](CINEMATIC_RETIREMENT_OPERATOR_DECISION_2026-10-24.md), sans retour des vidéos. Source examinée : `dev@d049bda36e2bae4af0c1e1edc9a3a2e332ce799f`, contrats1.10.0/baseline da69ec63bff1bc35f4b2b03feffe94cbd9cad0d5.

L’opérateur souhaite une expérience cohérente, fluide et intéressante entre dialogue, choix et combat, avec amélioration et optimisation. Les vidéos visaient le dynamisme mais compliquent la réalisation. Il envisage des spritesheets pour animer les personnages en combat et hors combat, avec les VFX de combat restant à terminer. Cette direction ne constitue ni une acceptation artistique de ressources encore inexistantes, ni une preuve de leur intégration runtime.

## Résultat joueur recherché

Comprendre la situation, choisir, voir une action lisible et ses conséquences, puis retrouver rapidement la main. L’animation soutient ce parcours : elle ne compense pas une composition confuse, une transition cassée ou un choix difficile à lire. Garder les temps de lecture et de décision contrôlés par le joueur ; éviter les boucles distrayantes et les longues présentations systématiques.

## Ce que le code possède déjà

| Capacité actuelle | Source | Limite constatée |
| --- | --- | --- |
| Quatre poses combat `prepare`, `dash`, `attack`, `cast`, ancrage/échelle et fallback | `CombatPoseRegistry.ts`, `CombatPoseVisual.ts` | Des poses distinctes, pas quatre frames successives d’une animation |
| Mouvements d’attaque, tir, magie, réaction, K.O. et reprise | `unitMotion.ts`, `CombatStage.ts` | Transformations et changements de pose ; cela ne démontre pas un personnage animé par spritesheet |
| Personnages narratifs issus du master V2, phases de composition et EXIT/BREATH/ENTRY | `NarrativeSceneSurface.ts`, `NarrativeTableau.ts` | Pas de définition d’animation narrative par frames/cadence/boucle dans ces phases |
| Moteur VFX, spritesheets, presets et lien aux actions | `VfxSystem.ts`, `VfxSpriteSheets.ts`, `VfxActionRegistry.ts` | Catalogue final et qualité par action à finir ; présence du moteur différente d’acceptation visuelle |
| Composer et résolution d’overrides publiés | `PublishedVfxResolver.ts`, `generated/published-vfx-presets.json` | Registre d’overrides actuellement vide ; les presets VFX de base restent le fallback, les VFX ne sont donc pas tous absents |

`STATIC_TABLEAU` impose composition interactive, cast et agence ; il n’impose pas une immobilité absolue. Revue indépendante PASS_CADRAGE_SCOPED : un petit cycle local conforme V2 est compatible avec1.10.0, sans amendement. Les VFX observent une action résolue, jamais un second calcul de dégâts/AP/statuts. Les outils portant `legacy` restent des propriétaires de production à conserver.

## Progression bornée

1. **Fluidité du passage joué.** Examiner les raccords dialogue → choix → déploiement/combat → résultat → dialogue de conséquence → carte, avec le bon décor, les mêmes personnages et les faits déjà résolus. Réutiliser les preuves compatibles ; corriger une observation concrète plutôt que rejouer toute la campagne. Le retrait vidéo ne prouve actuellement que l’ouverture/camp/audience native, pas la fluidité de tous les combats ou fins.
2. **Un personnage pilote.** Alistair est présent au camp et en combat, dispose d’un master V2 et des quatre poses combat. Préparer une petite animation de repos hors combat, puis vérifier sa lecture à taille de jeu. Cette référence commune permet ensuite un essai combat distinct, sans lancer tout le casting.
3. **Une action complète en combat.** Sur une attaque de base existante d’Alistair : anticipation courte, exécution, impact/réaction et retour à une position stable. Synchroniser pose, effet de contact et retour visuel sur la même action résolue. Garder le rythme du tour ; les déplacements tactiques suivent leurs propriétaires existants. Réutiliser d’abord les poses/VFX actuels, compléter seulement le manque démontré.
4. **VFX puis extension utile.** Traiter contact physique, projectile, soin et statut selon leur présence réelle dans la démo, une action/famille à la fois. Examiner taille, ancrage, cadence, lisibilité de la cible/PV, fin de l’effet et retour des contrôles. Le Composer existe déjà : pas de nouvel éditeur. Étendre aux héros/ennemis puis aux attitudes narratives lorsque le pilote apporte une amélioration visible.

Ces étapes se complètent ; finir la totalité des animations de personnages n’est pas un préalable artificiel au premier effet de combat. Les tests de lecteur ne décident pas de l’art. Aucun nouvel arrêt d’approbation routinière n’est ajouté ; acceptation artistique finale et playtest global restent opérateur.

## Premier livrable concret : Alistair au camp

**Proposition technique :** une spritesheet2×2 de quatre frames de repos discret, un seul acteur animé dans une phase existante de `camp_departure`. Ce nombre est un point de départ, pas une norme pour chaque action. Préserver les pieds au sol, l’épée en main, l’armure rigide, le casque, la cape rouge et les proportions ; petit jeu du buste/de la cape, sans marche, changement de place ni nouvel événement. Comparer avec le master fixe ; si l’effet est invisible ou attire trop l’œil pendant la lecture, revoir sa fonction plutôt qu’accumuler des frames.

Master inspecté : `public/assets/characters/pixel/masters/alistair.png`, 512×512, SHA256 réel `84ff7bdc3e2165b39f488fdef6ee8af6ff0bec8c2113b047791b35f62efb0219`, identique au fichier commité à la source examinée. Le manifeste V2 déclare historiquement `0c876f783b31e2d21b3fe0657b92a3da8c3a961cb3546a09ccb1aee4fae1b2be` : cette métadonnée diffère des octets actuels et ne constitue pas leur empreinte vérifiée. Master et manifeste sont préservés ; la provenance du futur candidat doit utiliser les octets effectivement fournis. Les poses combat restent des références distinctes ; ne pas les faire défiler comme une boucle de repos.

- Préparer références visibles, partition de frames, ancrage commun et silhouette à l’échelle de jeu avant génération. Conserver les masters/promotions actuels ; nouveau candidat séparé sous `tools/characters/candidates/alistair-idle/v1/`, versionné avec requête exacte, sources/SHA, brut, frames traitées et comparaison. Ce candidat de personnage ne rejoint pas la file cinématique retirée.
- Pour ce candidat raster, utiliser `generate2dsprite` et imagegen intégré, puis uniquement le traitement déterministe de découpe/transparence/alignement/QC. Pas de vidéo, extraction de frames vidéo, morphing ou remaster global. L’outil de sprite ne définit ni canon ni critères d’acceptation.
- Prévoir une définition d’animation visuelle optionnelle et un fallback vers le master. Le rendu narratif appartient à `NarrativeSceneSurface` ; préparer les images avant affichage, activer/changer l’apparence au changement de phase, y compris pour un acteur dont le DOM est conservé, et libérer au dispose. Les poses combat et leurs textures gardent leur propriétaire séparé ; réutiliser le descripteur/horloge seulement lorsque les deux rendus s’y prêtent.
- Conserver cadre, taille et ancrage des pieds entre frames ; pas de découpe d’arme/cape, jitter, glissement ou dérive de palette. Vérifier les mains et accessoires asymétriques face au miroir horizontal actuel.
- Une horloge bornée, sans timer indépendant permanent par acteur ; cadence explicite, chargement à la demande/cache borné, arrêt lorsque caché ou démonté. OS ou jeu réduit : image fixe informative, changement de préférence pris en compte immédiatement. Aucun état d’animation dans V6.
- La boucle n’avance aucune réplique, ne choisit rien, ne retarde pas un combat et ne possède pas le focus. En cas d’image manquante, le master demeure utilisable. Quatre acteurs visibles maximum dans le tableau ; une seule surface et mêmes choix/textes.

**Vérification future du pilote :** examen des quatre frames et de la boucle réelle à taille de jeu ; tests utiles du lecteur (ordre, arrêt, fallback, changement OS/jeu, changement de phase et dispose), types/contrats puis un seul scénario pertinent réutilisé. Observer texte/choix/clavier, identité, pied/objets et confort visuel. Ce document n’est pas une preuve GENERATED, TECHNICALLY_VERIFIED, ART_ACCEPTED ou RUNTIME_ACCEPTED de ce pilote : aucune image ni intégration n’a été produite dans cette préparation.

## Travail narratif conservé et limites

Le [plan statique de Bois-Clair](STATIC_NARRATIVE_FINISHING_PLAN_2026-10-24.md) demeure : Maelor et l’habitante doivent avoir des rapports lisibles, des destinataires/regards clairs et un décor cohérent. Les poses expressives liées à leurs phases viendront après examen des ressources nécessaires ; ne pas reprendre automatiquement la chorégraphie du pilote cinématique abandonné. Une respiration ne raconte pas seule la rupture morale.

Zéro vidéo active, huit IDs historiques et archives conservés ; aucun retour de la simulation Traversal ou marche sur l’atlas. Préserver canon, dialogues/choix/outcomes, V6, RunSystem/combat, récompenses/coûts, équilibre et climax d’Alaric. Aucun nouveau son, musique, voix, ambiance ou Ultimate. PC puis mobile. Scheduler réellement enregistré PAUSED/90min et tous réglages inchangés.

**Prochaine action unique :** préparer le candidat de repos quatre frames d’Alistair à partir du master inspecté, avec fiche de frames/ancrage et comparaison dans le tableau du camp ; avancer ensuite selon le résultat visuel, sans déploiement à tout le casting.

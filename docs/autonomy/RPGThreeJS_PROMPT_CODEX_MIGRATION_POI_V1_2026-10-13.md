# Prompt Codex — RPGThreeJS : remplacer Traversal par la carte POI

**À transmettre à Codex dans la session du dépôt `juniorbattle/RPGThreeJS`.**

---

## Directive opérateur explicite — décision approuvée

Je valide un changement structurel de RPGThreeJS : **le Traversal jouable est abandonné au profit d'une carte de campagne POI comme unique navigation de production**. Cette décision supersède la doctrine T0/T1/T3 du contrat en vigueur **uniquement sur le sujet de la navigation**. Elle ne retire aucun contenu canonique. Je t'autorise explicitement à effectuer **une tâche dédiée d'amendement des contrats verrouillés**, avant les changements de production nécessaires, en respectant notre procédure guardian/version/baseline. Ne demande pas de confirmation de routine de la décision déjà exprimée ; signale toute véritable incompatibilité de canon ou de sauvegarde non résoluble sans une décision supplémentaire.

Le contrat détaillé est joint sous `RPGThreeJS_CONTRAT_OPERATEUR_CARTE_POI_V1_2026-10-13.md`. **Lis-le intégralement.** Il fait autorité comme directive opérateur pour cette mission avant son enregistrement dans le dépôt. Son existence en pièce jointe ou dans la Bibliothèque **n'implique pas qu'il soit déjà intégré à GitHub**.

### Mission, pas exercice de planification

L'objectif est **une carte POI fonctionnelle dans le vrai jeu** au terme du premier lot : Audience d'Alaric → premier refuge, avec retour arrière, contenu existant, résolution une fois, embranchements narratifs cohérents et refuge réutilisable.

Ne remets pas un nouveau plan à la place du code. Ne supprime pas massivement le Traversal avant que sa relève fonctionne. N'invente ni scènes, ni choix, ni combats, ni montants de coffre pour peupler artificiellement la carte.

## 1. Preflight et autorité

- Vérifie le HEAD actuel de `origin/dev` et la situation locale, le verrou `.git/codex-autonomy.lock`, les autres agents/runs, états MD/JSON, WIP et preuves ; **un écrivain actif conserve la priorité**. Si le lock est actif, arrête-toi proprement et prépare le handoff sans écraser son travail. Respecte les règles de takeover et de snapshots.
- Lis `AGENTS.md`, le ledger `docs/autonomy/OPERATOR_DECISIONS.md`, `docs/game/GAME_CONSTITUTION.md`, `docs/contracts/README.md`, `contracts.manifest.json`, les huit contrats concernés et l'état autonome.
- Notre ancien ordre « finir la démo PC par Traversal » devient **supersédé pour le parcours physique de navigation**, mais ne perds pas les progrès de gameplay/combat/clavier déjà réalisés ; adapte les objectifs à la nouvelle carte.
- Évite `main`, changements destructifs, contournement de garde et modification de sources sensibles sans review. Les publications normales et cohérentes vers `origin/dev` restent autorisées selon les décisions existantes. Ne réactive pas toi-même l'automatisation si elle est en pause.

## 2. Tâche A — amendement contractuel dédié (en premier)

Enregistre la nouvelle décision de carte POI dans un fichier propre de `docs/autonomy/` et dans le ledger append-only, avec un nouvel identifiant non conflictuel, la date du 13 octobre 2026 et la référence de cette mission. Marque la doctrine Traversal antérieure **SUPERSEDED sur son périmètre de navigation**, sans réécrire les anciennes preuves.

Amende les textes verrouillés nécessaires dans la tâche **dédiée** : Constitution, TRAVERSAL (ou successeur MAP_NAVIGATION si le manifeste conserve une traçabilité explicite), CAMPAIGN_AND_STATE, PRESENTATION_AND_MEDIA, UI/ACCESSIBILITY, AUTHORING_AND_QA, index/manifest et baseline des garde-fous pertinents. Ce nouvel amendement doit avoir une version/autorité/un SHA de référence **réellement vérifiés**, pas un faux PASS en changeant une assertion. Revue `contracts-guardian` avant intégration. Préserve tous les invariants hors navigation (V6, authority, 8 videos, audio différé, Character V2, etc.).

**Livrable A :** décision + contrat approuvé et validé sur `dev`, proprement traçable. Ne reste pas ici pour plusieurs sessions si les règles sont claires : passe à la mise en œuvre jouable.

## 3. Tâche B — audit ciblé des points d'intégration, puis implémentation

Inspecte uniquement les propriétaires réellement utiles :

- `src/campaign/LionCampaignStructure.ts` : 21 nœuds, rôles et attentes canoniques ;
- `src/campaign/LionCampaignTravelRelations.ts` : étapes et embranchements à préserver ;
- `src/game/runSystem.ts` : graphe existant, sélecteurs des successeurs, disponibilités, visite/résolution/bypass, loot, branches et récompenses ;
- `src/game/types.ts`, `src/game/store.ts` : V6, migrations, état durable et compatibilité ;
- `src/game/GameApp.ts` : handoff entre Journey, tableaux, combats, refuges et ancien Traversal ;
- `src/ui/TravelView.ts`, `src/journey/*` : surfaces réutilisables ;
- `src/cinematics/NarrativeStage.ts`, `src/combat/CombatBridge.ts`, gestion/refuge existants.

Ne reconstruis pas le graphe de campagne à partir de zéro ; les 21 nœuds et leurs contenus autorisés constituent la source du premier slice. Garde les responsabilités de vérité chez RunSystem/campagne/combat/save. La carte est **présentation et sélection** : chaque clic doit être revérifié côté autorité.

Construis une carte géographique lisible à partir des vraies connexions. Privilégie une implémentation sobre, facilement extensible, compatible clavier/focus et réduction d'animation. Réutilise les conventions Option C et les composants pertinents au lieu de mettre en place un nouveau framework.

## 4. Premier slice de production exigé

Parcours :

`lion-audience` → `lion-opening-ambush` → `lion-nomad-crossroads` → `lion-refugees` (facultatif) → branche exclusive `lion-first-trial-event` **ou** `lion-first-trial-combat` → `lion-first-refuge`.

Respecte l'ordre/les effets actuels et les bypass canoniques. Présente la portion comme **un graphe de POI à embranchements**, sans recréer les routes physiques T0. Les mystères ouvrent les **tableaux/dialogues existants** ; les combats passent par **la vraie autorité tactique** ; le refuge ouvre son **vrai panel de gestion**.

Le slice doit montrer en production :

1. sélection et déplacement de POI uniquement sur liens accessibles ;
2. affichage lisible des statuts disponible, résolu, verrouillé, neutralisé, refuge réutilisable ;
3. entrée du véritable dialogue de Cédric et retour carte ;
4. bataille d'embuscade via combat réel, puis retour carte après victoire ;
5. réfugiés : résolution ou contournement légitime, sans fausse récompense ;
6. choix de la branche event/combat ; l'alternative incompatible devient non activable **sans être marquée accomplie** ;
7. passage sur un ancien POI résolu : aucune scène, loot, réputation, vidéo ou combat répété ;
8. retour en arrière réel, puis navigation vers un chemin encore autorisé ;
9. arrivée au premier refuge, ouverture répétée du hub et sauvegarde/rechargement V6 ;
10. aucune entrée anticipée dans le contenu primaire suivant sans conditions canoniques.

Lorsqu'un embranchement refuse un retour parce qu'un effet canonique le rend incompatible, documente ce refus au lieu de désactiver aveuglément tous les embranchements alternatifs.

## 5. Modèle de POI à usage unique et cas futurs

Prévois la distinction **available / locked / resolved / neutralized**, avec refuge réutilisable. Un POI peut être visité ou traversé sans déclencher de nouveau contenu si déjà résolu. Les POI facultatifs compatibles restent accessibles en retour arrière ; ne modélise pas « visité » comme synonyme universel de « résolu ».

Les futurs coffres affichent un popup direct et ne créditent or/items qu'une fois par propriétaire d'inventaire ; conserver la boucle de butin temporaire/sécurisé existante. Les combats ordinaires/élites ouvrent des configurations tactiques réellement définies ; les pools variables sont stabilisés et persistés afin d'éviter le reroll/re-farming. Pour le premier slice, **ne créer aucun faux coffre ni combat élite non autorisé**. Prévoir les adaptateurs correspondants avec tests ciblés, puis attendre les emplacements/contenus validés pour les activer en campagne.

## 6. Sécurité et compatibilité des sauvegardes

Conserver tous les anciens IDs, parcours canoniques, effets, flags, recrutement, ressources, cinématiques approuvées et conséquences. Examiner V6 avant de modifier `visitedNodeIds`, `resolvedNodeIds`, `traversalBranches`, `currentNodeId`, checkpoints et variantes adaptatives. Utiliser les faits existants pour dériver un état POI chaque fois que possible ; si de nouveaux faits durables sont indispensables, créer une migration de sauvegarde testée avec reprise.

Faire fonctionner nouvelles parties et sauvegardes antérieures à la migration : au minimum arrivée à l'audience, progression secondaire résolue, refuge atteint, embranchement choisi ; vérifier que l'ouverture d'un ancien save de Traversal ne rejoue pas ou ne corrompt pas la progression. Ne pas inventer un résultat d'affrontement pour convertir une sauvegarde interrompue.

## 7. Tests et preuves — uniquement ce qui démontre un jeu fonctionnel

Avant navigateur : tests purs de graphe et états (disponibilité, backtracking, exclusivité, no-repeat, refuge), compatibilité V6, TypeScript, contrats/immutabilité, tests ciblés des propriétaires touchés.

Ensuite une **validation navigateur production desktop représentative** : actions natives de la carte, vrai dialogue, vrai combat ou état de combat conservé authentiquement, retour, embranchement, refuge et reload. Différencie nettement : test qui injecte un résultat de combat = preuve du raccord seulement ; gameplay joué nativement = preuve plus forte.

Les captures démontrent une carte géographique lisible, pas un organigramme technique ou une maquette non fonctionnelle. Un jeu réduit au précédent écran Journey avec les boutons renommés « POI » ne satisfait pas la demande.

Ne boucle pas sur de nouvelles corrections de test sans progrès jouable. Pas de remplacement opportuniste de la vraie QA par des assertions relâchées.

## 8. Tâche C — suite et nettoyage, après acceptation du slice

Une fois le slice réellement jouable et sauvegardable : préparer la généralisation aux autres segments Lion, y compris les continuations narratives anciennement T2/T4, puis tests complets des branches et fins. Conserver la production déjà validée sur d'autres systèmes. **Ne supprimer le moteur Traversal, ses assets et ses QA spécifiques qu'après passage effectif aux POI et audit des références**, en conservant les preuves historiques.

L'ancien Traversal ne reste pas comme alternative de navigation dans le jeu final.

## 9. Compte rendu opérateur exigé

Réponds avec :

- **Décision/contrat amendé :** ID, version, commits, review.
- **Ce qui est réellement jouable :** dernier POI atteint, contenu ouvert, allers-retours et refuge.
- **V6 / compatibilité :** sauvegardes testées, migration éventuelle, limites.
- **Code produit :** fichiers modifiés et changements métier.
- **Preuve :** tests ciblés, navigateur, limites des fixtures.
- **Blocage exact :** seulement s'il empêche un critère.
- **Prochaine action produit :** une tâche prioritaire concrète.

Ne clos pas le projet après l'amendement documentaire ou une carte statique. **Le livrable attendu est le premier tronçon jouable sur `dev`, dans les limites d'une exécution sûre.** Si une frontière sensible nécessite une décision supplémentaire, indique exactement laquelle, préserve les travaux et avance sur les sous-tâches indépendantes autorisées.

---

**Instruction finale :** la carte POI devient l'architecture de navigation de RPGThreeJS. Commence par l'amendement dédié, puis implémente le vrai slice Audience d'Alaric → Premier refuge. Ne relance pas de chantier de polish Traversal, ne crée aucun nouveau lore et ne remplace pas la preuve jouable par un nouveau plan.

# Transmission aux prochaines exécutions — OD-2026-10-13-B

Statut : ACTIVE POUR LA PROCHAINE EXÉCUTION PROGRAMMÉE. Source : directive jointe par l’opérateur, puis clarification dans le même chat01a0f5ba-db22-7412-b3ad-a3429d76cad6 : « non l’idée est que tu indiques à notre tâche récurrente de bien préparer la suite de nos prompts et non commencer à travailler ». Cette précision est prioritaire : ce chat configure uniquement la reprise future, ne lance pas le chantier produit et ne réactive pas l’automatisation. Le plan OD-2026-10-13-A reste inchangé et approuvé.

Le texte opérateur ci-dessous est reproduit intégralement. Ses demandes d’exécution concernent le prochain run après réactivation manuelle. La limite20min vise l’investigation infructueuse, pas une partie qui progresse ou le développement utile. Le format de bilan de sa section10 s’applique aux prochains retours de production.

---

# RPGThreeJS — DIRECTIVE OPÉRATEUR : PRIORITÉ À LA DÉMO JOUABLE

## 1. Mission

La phase de structuration du projet est suffisamment avancée. Nous disposons désormais d'une Constitution, de contrats verrouillés, d'une campagne canonique, des Traversals T0/T1/T3 intégrés, d'un système de combat et de narration, ainsi que d'une infrastructure multi-agents et QA.

**Ta mission prioritaire est désormais de terminer une démo PC réellement jouable, puis de préparer sa livraison pour mon playtest final.**

Cette instruction est une directive d'exécution, pas une demande de nouvelle étude, de nouveau plan ou de refonte de nos outils.

Le plan `docs/autonomy/DEMO_COMPLETION_PLAN.md`, décision `OD-2026-10-13-A`, est déjà approuvé. Applique-le maintenant.

Ne consacre pas une nouvelle session à modifier ce plan ou le prompt récurrent. Ne réactive pas toi-même l'automatisation actuellement en pause.

## 2. Changement de priorité opérationnelle

À partir de maintenant :

**PRODUCT FIRST — QA SUPPORTS PRODUCT.**

La mesure principale du progrès n'est plus le nombre de commits, de tests, de captures, de rapports ou de validations techniques.

Elle est la progression réelle du jeu vers une expérience complète.

Un résultat concret peut être :

- une portion supplémentaire de campagne traversée avec succès par les contrôles natifs ;
- un combat canonique réellement remporté ou perdu avec ses conséquences correctement appliquées ;
- un blocage reproductible corrigé dans le code de production ;
- une fonctionnalité autorisée rendue jouable et vérifiée ;
- une sauvegarde/reprise de campagne validée à une nouvelle frontière ;
- une défaillance d'interface ou de contrôle corrigée et constatée en jeu.

Une preuve déjà acceptée ne devient pas un nouveau chantier simplement parce qu'un test plus précis serait possible.

Ne modifie jamais artificiellement le produit pour satisfaire un indicateur d'activité.

## 3. Objectif immédiat : atteindre le second refuge par la campagne PC

Commence sur la branche `dev` actuelle.

Effectue le preflight et acquiers le verrou exclusif selon notre protocole existant. Préserve le WIP et toutes les preuves historiques.

Examine brièvement :

- `second-refuge-native-desktop-1521`, son échec et ses dernières actions natives ;
- le checkpoint du premier refuge issu de `reward-label-native-desktop-0603` ;
- les contraintes du pilote `tools/demo-continuous-production-qa.mjs` ;
- les sources réellement impliquées dans l'obstacle au trajet vers le second refuge.

**Le but est de franchir cette portion de campagne, pas de perfectionner davantage le pilote.**

Vérifie d'abord si le blocage est dû à une erreur du jeu, à une stratégie d'entrée du pilote ou à une limite de temps.

Un timeout ne prouve pas un défaut de gameplay.

Si un défaut du produit est démontré, corrige-le à sa source, avec les tests directement concernés.

Si le problème vient uniquement d'une mauvaise politique d'entrée du pilote, applique la plus petite correction supportée, sans truquer le combat, les résultats ni les assertions.

Réutilise ensuite le pilote existant pour une exécution PC en 1366×768, mouvement normal, route de sauvetage canonique.

### Critère de réussite

Atteindre `lion-second-refuge` à travers les interactions natives, avec :

1. progression canonique correcte ;
2. combats résolus par le véritable moteur tactique ;
3. conséquences, ressources et recrutement préservés ;
4. sauvegarde V6 correcte ;
5. rechargement exact de l'état obtenu ;
6. aucune résolution implicite d'un choix encore ouvert.

Si un checkpoint de premier refuge déjà obtenu par gameplay natif peut être réutilisé avec sa provenance complète et vérifiée, utilise-le. Sinon, repars d'une entrée indépendamment validée.

N'utilise jamais une sauvegarde partielle provenant d'une exécution échouée comme preuve acceptée.

## 4. Après le second refuge : progresser vers une fin jouable

Dès qu'un checkpoint valable est disponible, enchaîne vers les segments encore non validés de la campagne Lion.

L'objectif suivant est de traverser :

- les événements du reste de la campagne ;
- les combats nécessaires ;
- les décisions et conséquences des embranchements ;
- la préparation avant le jugement ;
- le jugement d'Alaric ;
- une conclusion canonique complète.

Vérifie les sauvegardes et reprises aux frontières pertinentes.

Ne prétends pas qu'une route est validée uniquement parce que le système sait injecter une victoire de combat.

Une démo terminée doit permettre au joueur de progresser réellement avec les systèmes du jeu.

Les autres branches canoniques doivent rester fonctionnelles et faire l'objet des validations complémentaires nécessaires, sans exiger de rejouer toutes les routes pour chaque correction isolée.

## 5. Si la campagne est bloquée : travailler sur une autre fonctionnalité réelle

Un blocage ne doit pas paralyser l'intégralité du développement.

Limite l'investigation répétée d'une même frontière sans nouvelle information à environ 20 minutes. Ce plafond concerne l'investigation infructueuse, pas le développement utile ni une partie qui progresse normalement.

Si aucune correction justifiée n'est identifiable :

1. enregistre précisément le blocage et la preuve manquante ;
2. conserve le point de reprise ;
3. passe immédiatement à un autre chantier indépendant déjà autorisé ;
4. effectue une modification fonctionnelle justifiée et sa validation ciblée si le problème est reproductible.

Priorités indépendantes :

**A. Combat et compétences.** Vérifier que les six héros utilisent effectivement leur première compétence avec leur équipement initial. Préserver les règles AP, les équipements supérieurs et les Ultimates non activés. Corriger uniquement les défauts démontrés.

**B. Contrôles tactiques.** Achever les travaux clavier différés : déplacement, sélection de cible, validation/refus d'action, retour, focus, menus et commandes natives. Réutiliser le WIP existant.

**C. Pursuit.** Vérifier les rencontres ordinaires autorisées, la collision, le combat, la victoire/défaite et le retour à la même route. Respecter les dix mappings déjà présents ; ne pas rouvrir leur ancien blocage.

**D. Continuité narrative et présentation.** Corriger les problèmes démontrés qui affectent la compréhension de l'histoire, les transitions ou les interactions. Regrouper les vérifications purement visuelles à la passe de présentation prévue.

Ne retourne pas automatiquement à un test isolé T0 de fade, d'opacité ou de timing déjà étudié. Ne réouvre un tel point qu'en présence d'un défaut nouveau et concret qui empêche la progression ou la validation du produit.

## 6. Méthode de travail attendue

Pour chaque tâche, détermine avant toute QA :

**Quel problème le joueur rencontre-t-il ?**

**Quelle correction ou capacité produit est visée ?**

**Quelle observation suffira à vérifier le résultat ?**

Ensuite :

1. inspecte les sources et preuves directement pertinentes ;
2. modifie le minimum nécessaire lorsqu'un changement est justifié ;
3. exécute les vérifications mécaniques ciblées ;
4. effectue au plus un nouveau scénario navigateur pertinent, sauf échec directement causé par le changement et nécessitant une correction ;
5. constate le résultat jouable ;
6. publie le checkpoint cohérent sur `origin/dev`, dans les limites des autorisations existantes ;
7. reprends la prochaine tâche produit.

Conserve les contrôles obligatoires : TypeScript, tests concernés, contrats, protection Git, QA sensible et review indépendante quand la modification le justifie.

Ne crée aucun nouveau framework QA ou outil de mesure si un outil existant permet déjà d'observer le comportement recherché.

Les diagnostics détaillés restent dans leurs emplacements appropriés. Les handoffs doivent être courts, exploitables et à jour.

Les 75 minutes de travail sécurisé et la cadence existante restent applicables. La fin d'une session ne doit pas interrompre une opération de façon dangereuse.

## 7. Règle anti-boucle

Si deux sessions successives n'ont produit que des changements QA, de preuves ou de workflow sans nouvelle étape jouable acceptée :

**La session suivante doit traiter un problème produit démontré ou une fonctionnalité produit indépendante encore incomplète.**

Ne génère pas un nouveau plan pour résoudre l'absence d'avancement.

Ne modifie pas artificiellement une source, n'affaiblis pas les tests et n'invente pas un PASS.

Si tout un domaine est bloqué par une dépendance extérieure, isole-le et avance sur le reste.

Un blocage externe comme l'illustration nocturne de Bois-Clair ne doit pas empêcher les tests des mécaniques indépendantes. Réutilise les fallbacks existants autorisés, sans prétendre que la direction artistique finale est acceptée.

## 8. Rôle des agents spécialisés

Utilise nos agents spécialisés comme des moyens d'accélérer la production, pas comme un système de validations répétitives.

- Orchestrateur : sélectionne, implémente et termine la tâche produit.
- Spécialiste de domaine : intervient lorsqu'une expertise ciblée améliore la correction.
- Contracts Guardian : contrôle les frontières sensibles et les grandes validations.
- QA Runner : produit la preuve minimale correspondant au critère recherché.

Ne sollicite pas systématiquement tous les agents pour une modification mineure.

Préserve un seul écrivain par worktree et les procédures de verrouillage/handoff.

## 9. Invariants non négociables

Ne change pas les décisions fondamentales déjà verrouillées :

- `GAME_CONSTITUTION.md` et les huit contrats LOCKED version 1.1.0 ;
- campagne, branches, dialogues et conséquences canoniques hors correction explicitement autorisée ;
- autorité de `RunSystem`, du combat et des sauvegardes ;
- compatibilité V6 et identifiants durables ;
- séparation entre gameplay et présentation ;
- huit slots cinématiques approuvés ;
- absence de nouveau lore ou de nouveaux événements non autorisés ;
- audio différé et remaster vidéo dans son chantier manuel indépendant ;
- branche `main` protégée ;
- historique des preuves et WIP préservé.

Tu disposes déjà de l'autorisation opérateur permanente de publication normale sur `origin/dev` pour les checkpoints conformes. N'engage pas de nouvelles demandes de confirmation de routine.

## 10. Format du prochain retour opérateur

Je ne veux pas un nouveau long compte rendu d'instrumentation.

Après exécution, fournis uniquement un bilan opérationnel clair :

**ÉTAT DE LA DÉMO PC**
- Dernière étape réellement atteinte en jeu :
- Combats réellement joués :
- Dernière sauvegarde V6 vérifiée :
- Prochaine frontière jouable :

**PRODUCTION EFFECTUÉE**
- Modifications concrètes du jeu :
- Nouveau résultat jouable ou vérification réellement acquise :
- Fichiers de production modifiés :
- Vérifications pertinentes :

**BLOCAGES**
- Défaut précis restant :
- Preuve ou condition manquante :
- Ce qui est externe et peut être différé :

**PROCHAINE ACTION PRODUIT**
- Une seule action prioritaire, directement exécutable.

Indique séparément le nombre de fichiers produit, QA/preuves et workflow modifiés. Aucun progrès produit ne doit être revendiqué à partir d'un simple commit documentaire.

## 11. Instruction finale

**Exécute maintenant le premier chantier produit de ce plan. Ne réponds pas en réécrivant le plan.**

Je veux que la branche `dev` converge vers une démo PC complète, jouable, vérifiable et prête pour mon playtest.

Ne sacrifie ni la qualité ni les contrats pour aller plus vite. Mais ne confonds plus approfondissement des diagnostics et progression du jeu.

**La priorité est de terminer RPGThreeJS en tant qu'expérience jouable, pas de terminer son système de QA.**
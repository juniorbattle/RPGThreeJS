# RPGThreeJS — Contrat opérateur de navigation par carte POI

**Version :** 1.0 — décision de conception approuvée dans la conversation du 13 octobre 2026
**Statut :** décision opérateur à enregistrer dans le dépôt ; **pas encore amendement GitHub effectif**
**Périmètre :** campagne Lion, navigation, points d'intérêt, transitions et sauvegardes
**Objectif :** remplacer intégralement le Traversal jouable, sans refondre les contenus narratifs ni tactiques existants.

## 1. Décision fondamentale

RPGThreeJS est un RPG narratif tactique dont la navigation principale se fait par **une carte de campagne illustrée en réseau de POI**. Les POI primaires portent les grands événements canoniques (notamment audience d'Alaric, Bois-Clair, jugement d'Alaric). Les embranchements entre ces étapes accueillent les POI secondaires : mystères, événements d'aide, recrutements, embuscades, rencontres du clan Serpent, combats ordinaires, élites et coffres. Les refuges débloqués restent accessibles et réutilisables.

Le **Traversal jouable (routes latérales, caravane pilotable, voies, Risk/Reward/Pursuit physiques, obstacles et transitions Route/Checkpoint)** quitte la direction de production. Il ne devient pas une seconde option permanente, ni une minigame exceptionnelle à conserver par défaut. Les événements canoniques actuellement déclenchés par Traversal sont **représentés par des POI**, sans modification tacite de leurs effets.

La carte constitue **l'interface d'accès aux systèmes existants** : `RunSystem`/campagne pour les droits et effets, `NarrativeStage`/`STATIC_TABLEAU` pour les événements narratifs, `CombatBridge`/combat tactique pour les affrontements, UI de récompense/inventaire pour les coffres, `ManagementView` et panels de refuge pour les hubs. La carte ne crée ni règles de combat ni récit parallèle.

## 2. Structure par phases et catégories

### POI primaires — grands jalons

Les grands événements déjà scénarisés marquent les étapes de l'histoire et les limites de phase. Ils peuvent présenter vidéo approuvée, tableau narratif, dialogue, décision, combat et conséquences selon les propriétaires actuels. À titre d'exemples : audience d'Alaric, Bois-Clair et jugement d'Alaric. Le camp et les autres ancres existantes sont conservés selon leur rôle canonique.

Leur accès respecte les faits, conditions et séquences déjà approuvés. **La liberté de déplacement ne signifie pas qu'un événement futur peut être déclenché avant sa condition narrative.** Un jalon accompli reste franchissable mais sa cinématique, son dialogue et ses récompenses à usage unique ne se rejouent pas.

### POI secondaires — branches et opportunités

- **Mystère / aide / recrutement / rencontre scénarisée :** le `STATIC_TABLEAU` et le dialogue existants, avec leurs choix/effets, sont réutilisés ; seuls l'entrée et le retour à la carte changent.
- **Combat ordinaire / rencontre variable :** indication sobre sur la carte, puis véritable CombatBridge et configuration de combat existante. Une variation aléatoire ne doit pas produire une formation fictive ni emprunter les conséquences d'un autre événement.
- **Élite :** avertissement distinct de danger, puis configuration d'élite **déjà autorisée** et combat existant ; ne jamais renommer arbitrairement un combat normal en élite.
- **Coffre :** popup direct (or/items), quantité et catalogue approuvés, attribution par le propriétaire d'inventaire, **une seule fois**. Aucun nouveau modèle économique ne découle de la carte.
- **Refuge :** POI réutilisable une fois débloqué, ouvrant le véritable hub existant (repos, soin, achat/vente, équipement, compétences, craft et préparation selon les fonctionnalités disponibles). Ne pas réexécuter sa scène d'arrivée et ne pas transformer par inadvertance le refuge final narratif en hub de gestion.

Les noms/types sont un **contrat de comportement**, pas la déclaration que tous les nouveaux POI et leurs récompenses sont déjà auteurisés. Le premier lot n'invente ni nouveaux nœuds de récit, ni formation, ni coffre à montant arbitraire. Les futurs POI secondaires additionnels exigent configuration et validation de leurs contenus réels.

## 3. Déplacement, retour en arrière et états

- Déplacement libre **sur les arêtes connectées et débloquées**. Le joueur peut revenir en arrière et emprunter un chemin non exploré après avoir franchi un événement majeur, si aucune condition canonique ne l'interdit.
- Les connexions et jalons fermés par la progression restent verrouillés. Pas de téléportation ni de saut d'événements obligatoires par un clic sur une destination éloignée.
- Un POI **résolu** est traversable et visible, mais ne réactive aucun dialogue, combat, cinématique, butin ni réputation. Une visite ultérieure ne modifie pas la vérité du jeu.
- Un POI **neutralisé/exclu** par une autre décision est traversable si sa géographie reste accessible, mais inactif : il n'est **pas** enregistré comme vaincu, accompli, récompensé ou recruté.
- Un POI **facultatif disponible** peut être ignoré puis visité plus tard si les faits et les embranchements le permettent. Ignorer un événement conserve les conséquences canonisées d'un bypass lorsqu'elles existent ; ce n'est pas systématiquement équivalent à le résoudre.
- Un POI **verrouillé** n'est pas activable. Un POI **non révélé** peut être caché ou représenté sans révéler son contenu ; pas d'obligation de dévoiler tous les nœuds dès le départ.
- **Exception répétable : refuge débloqué**, dont les services normaux restent accessibles aux revisites ; les décisions narratives d'entrée ne sont pas répétées.
- L'état sélectionné/en déplacement peut être éphémère ; les faits de résolution, exclusion, contenu attribué et récompenses doivent suivre des propriétaires durables.

### Neutralisation conditionnelle

Déclarer les dépendances de façon vérifiable : si la résolution du POI A rend le POI B narrativement incompatible, B passe dans l'état **neutralisé**, sans obtenir son contenu ou sa récompense. Ne pas neutraliser une branche entière au seul motif qu'elle est parallèle : seules les incompatibilités **réellement canonisées ou explicitement approuvées** doivent fermer leurs POI. Préserver toute option compatible encore accessible.

### Rencontres aléatoires et anti-farming

Une rencontre associée à un POI reçoit une formation **éligible** parmi les configurations existantes. Le contenu choisi doit être stable pour cette partie/ce POI lorsqu'il devient accessible ou lorsqu'il est déclenché, afin qu'un aller-retour/rechargement ne permette pas de reroll abusif. Après résolution, aucun respawn ni nouvelle récompense à ce POI. Après défaite, appliquer la reprise/défaite existante : **ne pas marquer une victoire fictive**.

### Récompenses et économie

Coffres et combats n'octroient leur récompense qu'une fois. Conserver explicitement la distinction existante **butin temporaire / or sécurisé au refuge** là où elle s'applique. Ne pas créditer directement l'or sécurisé depuis l'UI de carte par commodité. Les modalités exactes des futurs coffres sont à configurer selon les règles d'inventaire existantes avant activation.

## 4. Sources et responsabilités canoniques

À la consultation du 13 octobre 2026, `dev` utilise notamment :

- `src/campaign/LionCampaignStructure.ts` : **21 nœuds canoniques**, rôles, environnement, attentes de progression ;
- `src/campaign/LionCampaignTravelRelations.ts` : anciens legs T0/T1/T3, événements obligatoires/facultatifs et embranchements ; T2/T4 historiques ;
- `src/game/runSystem.ts` : graphe, contenu adaptatif, transitions, faits, récompenses et accessibilité ; ses sélecteurs actuels sont orientés vers les successeurs plutôt que vers une libre circulation arrière ;
- `src/game/GameApp.ts` : coordination des écrans, des scènes, des entrées/résolutions et des sauvegardes ;
- `src/journey/*` et `src/ui/TravelView.ts` : surfaces et adaptateurs de navigation à auditer/réutiliser avant création d'un moteur concurrent ;
- `src/cinematics/NarrativeStage.ts`, `src/combat/CombatBridge.ts`, `src/ui/ManagementView.ts` : sorties existantes des POI.

Ne jamais faire de l'écran de carte le propriétaire des branches, des récompenses, des dommages, de la résolution tactique ou de la sauvegarde. La carte affiche le résultat des sélecteurs autoritaires et transmet seulement les intentions du joueur ; `RunSystem` revalide chaque interaction.

**Important :** l'ancienne sémantique `START_TRAVERSAL`, `TRAVERSAL_INTERRUPT`, `RESUME_TRAVERSAL`, `TRAVERSAL_OVERLAY` et `traversalBranches` doit être migrée ou adaptée sans casser les identifiants persistants ni les événements. L'ancien trajet physique ne doit pas être simulé invisiblement comme dépendance permanente de la nouvelle carte.

## 5. Compatibilité V6 et non-répétition

- Conserver les identifiants de nœuds déjà persistés, le graphe historique et les choix narratifs durables.
- Auditer les champs `visitedNodeIds`, `resolvedNodeIds`, branches, récompenses, currentNodeId, checkpoint et état de sauvegarde avant modification. Séparer proprement **résolu** et **neutralisé** dans la logique durable ; réutiliser les champs existants s'ils suffisent, sinon définir une migration explicitement testée.
- Reprendre les anciennes sauvegardes aux limites de phase et, dans la mesure du possible, depuis les checkpoints/interruptions de Traversal en les mappant sur des POI sans rejouer la vérité canonique. Toute incompatibilité résiduelle doit être documentée et soumise à décision, jamais corrigée en effaçant silencieusement la progression.
- Tester le rechargement d'un POI résolu, d'une branche neutralisée, d'un refuge revisité, d'un combat terminé et d'un combat perdu, ainsi que l'accès à un primaire à venir.
- Le joueur peut traverser un POI résolu, mais ne doit ni relancer la même cinématique ni dupliquer or, item, réputation, recrutement ou victoire.

## 6. Premier lot jouable : Audience d'Alaric → Premier refuge

Un **vertical slice production** utilise les vrais IDs et contenus de la portion T0 préexistante :

1. Audience d'Alaric comme **POI primaire** / point de départ de la carte concernée ;
2. embuscade d'ouverture (**combat**) ;
3. rencontre Cédric / carrefour nomade (**mystère/recrutement**) ;
4. réfugiés (**facultatif**, respecter bypass et conséquences existantes) ;
5. embranchement existant `lion-first-trial-event` / `lion-first-trial-combat` avec disponibilité et exclusivité garanties ;
6. premier refuge (**hub réutilisable**, une fois débloqué).

Le slice doit démontrer **visuellement et dans le vrai runtime** : carte lisible, liens corrects, sélection souris/clavier, activation du combat réel, retour après victoire, tableau existant, option facultative ignorée ou résolue, embranchement excluant uniquement le POI incompatible, passage sur POI résolu sans effet, retour arrière effectif, refuge et sauvegarde/rechargement V6 exacts.

**Pas de faux POI coffre/élite** pour cocher une case : leur traitement doit être défini et testé mécaniquement, mais leur placement et leurs récompenses additionnels exigent validation de contenu. Ne pas ajouter une formation ou un événement uniquement pour remplir le dessin de carte.

L'intégration doit conserver la suite de campagne hors du slice en état fonctionnel. Durant le remplacement progressif, un mécanisme de compatibilité interne temporaire est permis, mais **pas deux modes de navigation permanents** proposés au joueur.

## 7. Travaux de migration et de retrait

**Étape A — décision et amendement contrôlé.** Ajouter un enregistrement opérateur spécifique au ledger, amender `GAME_CONSTITUTION.md`, les contrats concernés (`TRAVERSAL`, `CAMPAIGN_AND_STATE`, `PRESENTATION_AND_MEDIA`, UI/accessibilité, auteur/QA si pertinent), index/manifest/version et protections Git, **dans une tâche contractuelle dédiée** avec review guardian. L'ancienne doctrine Traversal est explicitement supersédée ; le reste reste LOCKED. Cet acte exige la décision présente et ne doit pas être maquillé en tâche d'implémentation ordinaire.

**Étape B — slice production.** Introduire ou adapter un modèle de carte POI avec positions, connexions et statuts, préférentiellement dérivé du graphe réel et de ses propriétaires ; réutiliser tout adaptateur existant pertinent ; implémenter navigation arrière, non-répétition, neutralisation et accès au refuge. Tests ciblés + navigateur desktop réel, puis QA V6.

**Étape C — généralisation.** Connecter les autres sections Lion (dont la continuité narrative T2/T4), reprendre les mêmes règles, compléter les POI secondaires réellement autorisés. Vérifier la campagne et ses deux fins sans contournement des combats.

**Étape D — suppression de l'ancien système.** Une fois le parcours carte fonctionnel et sa compatibilité validée, identifier les références du moteur Traversal, des outils QA et des assets, supprimer ceux qui sont réellement orphelins ; archiver la preuve historique et préserver les ressources réutilisées par des scènes/visuels non Traversal. Pas de suppression prématurée.

## 8. Direction visuelle et accessibilité

Carte **géographique auteurisée** lisible, inspirée dans sa grammaire des cartes tactiques illustrées et non dans une reproduction littérale d'une œuvre. Respect de l'Option C / HD-2D / Pixel Diorama Fantasy (palette, silhouettes, relief, chemins et toponymes). Différencier primaire, mystère, combat, élite, coffre et refuge ; distinguer disponible, actif, résolu, neutralisé, verrouillé. Ne pas construire un moteur de déplacement physique. Transitions sobres, pas de panoramique superflu. Clavier, focus visible, hit areas, tailles d'écran et réduction des animations compatibles avec les règles existantes.

## 9. Conditions de sortie de la première migration

- Sur `dev`, sans toucher `main` et sans conflit avec un écrivain actif.
- Nouvelle carte POI **effectivement jouable**, pas simplement un prototype graphique, un mock ou un rapport.
- Audience → premier refuge accessible avec les vrais contenus, conséquences et interactions ; rétro-navigation possible.
- Résolution unique, neutralisation cohérente et refuge répétable prouvés.
- Aucune mutation de la vérité de campagne par la présentation.
- V6 nouveau/parcours existant testé, sans perte silencieuse de progression ; bugs ou limites résiduelles honnêtement identifiés.
- Contrats mis à jour selon décision opérateur et baseline contractuelle protégée par la procédure officielle ; QA limitée aux critères réellement concernés.
- Aucun décompte de commits/tests ne remplace le constat d'une progression jouable.

## 10. Autorité, limites et suivi

Cette décision de conception **remplace la doctrine Traversal** pour la future production. Elle ne change pas les autres choix approuvés : gameplay tactique canonique, personnages V2, STATIC_TABLEAU, huit vidéos, remaster vidéo indépendant, audio différé, refuges actuels, compatibilité des sauvegardes, publication normale `origin/dev`, `main` protégé, protocole multi-agents. La décision ne prouve ni la migration accomplie ni l'amendement déjà intégré à GitHub.

**Prochaine action :** demander à Codex d'enregistrer cette décision dans le dépôt sous un identifiant unique déterminé après consultation du ledger, d'exécuter la tâche d'amendement verrouillé puis de livrer le slice jouable. Ne pas réactiver l'automatisation depuis cette conversation.

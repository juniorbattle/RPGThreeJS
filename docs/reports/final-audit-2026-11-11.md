# Audit final du gameplay et de la structure du projet

| Champ | Valeur |
| --- | --- |
| TASK | FINAL-AUDIT-2026-11-11 |
| DOMAIN | Campagne et narration, combat tactique, progression et économie, interface et accessibilité, structure du code et du dépôt |
| BASELINE | `6d528545` sur `dev` (jeu de contrats 1.21.0, baseline immuable `470216d179e2cf6e2840e0c48f4f431a5dbb65d4`) |
| BRANCH | `dev` |
| HEAD | le commit de ce rapport |
| STATUS | merged : constats livrés à l’opérateur le 2026-11-11 ; les défauts A1 à A8 sont corrigés le même jour sur son accord (section « Corrections appliquées ») ; B1 à B10 attendent ses arbitrages |
| MERGED_IN | NONE (rapport seul) |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Audit en lecture seule, puis les corrections A1 à A8 (section « Corrections appliquées ») : règles du Mutisme, textes et accès de l’École du combat, confirmation de « Nouvelle chronique », rideau partagé, garde du labo VFX et contenu de `dist`, clé de stockage des sauvegardes, petits défauts. Aucun champ de sauvegarde nouveau, aucun canon nouveau. |
| CANONICAL_DOCS_UPDATED | `docs/autonomy/AUTONOMOUS_WORK_STATE.md` et `.json` (nextAction, remainingWork). Contrats inchangés. |
| EVIDENCE | Vérification complète sur le poste de l’opérateur (ci-dessous) ; passe navigateur sur `localhost:5174` (titre, ouverture, premiers dialogues, labo de rencontres, entrée dans le combat du Général Serpent, console sans erreur) ; cinq audits de lecture du code en parallèle (narration, combat, progression, interface, structure), dont les constats marqués « vérifié » ont été recontrôlés dans le code ou à l’écran. Page de synthèse privée de l’opérateur : https://claude.ai/artifact/Nd5v8dgZyMTAsVUg5nJPuw |

## Verdict

**CURRENT FACT.** Le jeu est complet et techniquement sain : toute la vérification passe, aucune anomalie bloquante, et l’arc narratif tient du prologue aux trois fins. Il n’est pas encore déclaré validé. Huit lots de défauts sûrs, sans canon nouveau (A1 à A8), sont à corriger avant le test final. Dix arbitrages (B1 à B10) relèvent de l’opérateur. Les quatre principaux sont l’identité des boss, la montée de difficulté, l’économie après le Lion et la portée des choix entre plateaux. La dette technique (C1 à C5) peut attendre la validation.

Vérification : garde des contrats vide ; `contracts:validate` (8 contrats, zéro vidéo active) ; `narrative:validate` (5 cartes, 39 échos, 0 erreur) ; `tsc --noEmit` ; vitest 3263/3263 (216 fichiers) ; tests node 26/26 ; `npm run build` réussi (avertissement : morceaux de plus de 500 ko).

Limites : aucun tour de combat joué, car le panneau du navigateur était trop petit. B2, B4 et B6 sont des estimations tirées des données ou d’une simulation. Aucune partie complète n’a été jouée et le mobile n’a pas été testé.

## A. Défauts à corriger (aucun canon nouveau)

| ID | Gravité | Constat | Preuve |
| --- | --- | --- | --- |
| A1 | Majeur, vérifié | Le Mutisme ne bloque pas les ennemis : un boss sous Mutisme lance son attaque lourde et son ultime. Côté héros, les soutiens de clan restent utilisables sous Mutisme. | `legacyCombatRuntime.js:2181` (`bestOffense`) ; seules les lignes 2294 et 2589 lisent `silence` |
| A2 | Majeur, vérifié à l’écran | Le tutoriel de combat contredit le jeu. Il annonce 2 PA de régénération pour boss et élites (le code en donne 3) et ne dit rien de la Furie. Il cite « Étourdi », qui n’existe plus. Il décrit l’Onde de Choc comme magique et étourdissante, alors que c’est une frappe physique qui maudit. Il annonce une portée de boss de 2 à 4, au lieu de 7 au plus. Brisé, Essoufflé, Entravé et Mutisme ne sont pas expliqués. Le tutoriel ne peut pas être rouvert. | `legacy-combat.html:56, 96, 127–134` ; `skills.ts:67` ; `combatTempo.ts:36` |
| A3 | Majeur, vérifié | « Nouvelle chronique » efface toutes les sauvegardes sans confirmation. | `GameApp.ts:1867` ; `store.ts:324–328` |
| A4 | Majeur, garde vérifiée, à reproduire | Une seconde transition demandée pendant un rideau est ignorée en silence, et le rideau ne bloque pas le clavier. Si le joueur valide une route de combat pendant le rideau de voyage, `await combatStarted` ne se résout jamais. | `SceneTransition.ts:50` ; `JourneyOverlay.ts:114` ; `GameApp.ts:1768` |
| A5 | Majeur | Plusieurs changements d’écran se font en coupure sèche, sans le rideau partagé : sortie de combat, retours au titre, dialogue vers carte. Le rideau ne suit que la préférence de Windows (`@media`), pas le réglage du jeu. | `CombatBridge.ts:167–169` ; `GameApp.ts:238, 911, 942–956, 1130, 1914` ; `app.css:2716–2721` |
| A6 | Majeur, vérifié | `?vfxlab=1` ouvre le labo VFX en production, sans garde `import.meta.env.DEV`. Le build copie dans `dist` le pack d’effets commercial ignoré par Git (402 Mo), d’où un risque de licence au déploiement. | `legacyCombatRuntime.js:120` ; `vite.config.ts:94` ; `.gitignore:18` |
| A7 | Mineur | La démo figée utilise la même clé de sauvegarde. Ouverte sur la même adresse, elle reconstruit une sauvegarde de l’après-démo en route du Lion, puis l’écrase. | `store.ts:24` ; tag `demo-frozen-2026-11-09` |
| A8 | Mineur | Petits défauts : la carte affiche encore « Voyage rapide · 1 tour ». Le choix à 40 or de `village_raid_aftermath` n’exige pas d’or. Une unité Brisée garde ses statuts un tour de trop. Les +2 PA du grimoire sont perdus au plafond. Un même statut porte deux noms (texte flottant et fiche). Échap dans le tutoriel ramène au menu. Faute « personne blessé ». | `PoiMapView.ts:136, 163` ; `legacyCombatRuntime.js:1281, 2130, 846–859, 2503` ; `statusPresentation.ts:119` ; `content.ts:794` |

## B. Arbitrages de l’opérateur

| ID | Constat | Preuve |
| --- | --- | --- |
| B1 | Aucun boss n’a d’identité de jeu. Les 15 boss sont des unités 2×2 immobiles sur la même case, aux kits recyclés : Général Serpent, Borin et Champion du Serpent ont le même kit, et le Maître Espion a celui de quatre élites. Le Chef des gardiens du Phénix et l’Entité n’ont pas d’attaque lourde : le tour 2 de leur cycle est vide. | `legacyCombatRuntime.js:739–770` |
| B2 | La difficulté ne monte presque pas entre plateaux (estimation) : PV des boss de 450 à 620, ennemis normaux entre 65 et 130 PV partout, aucun multiplicateur par plateau, alors que les héros progressent. | `spawnUnits`, `types.ts:120–160` |
| B3 | La CHARGE n’a pas de parade : briser un boss exige 0 PA, or il en garde au moins 3 pendant la charge. Le badge ne montre ni cible ni zone. La réserve de PA donne aussi aux boss une Garde presque permanente, de +9 à +15 END. | `legacyCombatRuntime.js:890, 2168, 1295` ; `bossIntentPresentation.ts:28–34` |
| B4 | Certains ultimes reposent sur la statistique faible du boss (estimation). L’Apocalypse du Champion du Lion fait environ 26 dégâts, contre environ 47 pour son attaque lourde. Même cas pour le Chaman, le Prophète et le Chef des gardiens du Phénix. | données des unités |
| B5 | L’économie s’arrête après le Lion. Une seule échoppe (`valmir`) sert tout le jeu, et son stock n’est jamais renouvelé. Environ 3 600 or sont gagnés après le Lion, pour presque rien à acheter. Les armes plafonnent, l’ultime à 5 PA ne s’ouvre jamais, et aucun objet, recette ou compagnon n’arrive après le Lion. | `GameApp.ts:1415` ; `store.ts:68–80` ; `catalog.ts:26–84, 584` |
| B6 | Atteindre 100 de réputation dépend du tirage des événements sociaux : selon une simulation, environ 20 à 30 % des graines plafonnent un joueur parfait à 98 ou 99. Au-delà de 80, rien ne change mécaniquement. | `reputationBounds.ts:448–451` ; `reputationEventDirector.ts:305–325` |
| B7 | La portée des choix entre plateaux est faible (canon, textes à approuver). Au Tournoi, le verdict ignore une alliance antérieure avec le Corbeau, le Loup ou le Phénix et réécrit la relation (vérifié). Le jeune dragon du Lion n’est pas rappelé au Dragon. La crédibilité calculée aux jugements de l’Ours, du Dragon et du Scorpion n’est jamais dite. Environ 20 choix du Lion n’ont pas d’écho, et leurs exceptions sont périmées. | `finaleDialogues.ts:62–80` ; `dragonPresentation.ts:120` ; `plateauFinale.ts:92–93` ; `lion.consequences.json` |
| B8 | Le mouvement réduit suit encore Windows. C’est conforme au contrat verrouillé (`UI_AND_ACCESSIBILITY.md:39, 43`), mais contraire à la règle générale de l’opérateur. Le changer demande un amendement. | `ReducedMotion.ts:2–3` ; `UiSoundSettings.ts:14, 31` |
| B9 | Confort : pas d’écran de crédits ni de sortie de combat. La sauvegarde manuelle reste sans effet visible, car « Continuer » charge la sauvegarde automatique. Pas d’avance rapide ni d’historique en dialogue. | `GameApp.ts:1923` ; `store.ts:304–308` |
| B10 | La passe mobile, déjà prévue, n’est pas commencée. Un toucher déclenche l’attaque sans aperçu, beaucoup de textes font 8 à 10 px, et les défauts à 390 px sont connus. | `legacyCombatRuntime.js:2488, 2497` ; `combat-hud.css` |

## C. Dette technique (après validation)

- **C1.** Les règles du combat vivent dans `legacyCombatRuntime.js`, 3 297 lignes non importables. Environ 230 assertions de combat vérifient le texte source et non le comportement. Il faut extraire les règles pures en modules TS testés.
- **C2.** `GameApp.ts` (1 986 lignes) porte des règles qu’AGENTS.md réserve au propriétaire de la vérité : effets narratifs (or, drapeaux, recrues), plafond de recrues, potion du refuge à 60 de réputation (`GameApp.ts:1300–1307, 1601–1638`).
- **C3.** Le morceau `combat` pèse 2,9 Mo, dont environ 2,8 Mo de JSON importés depuis `docs/reports` par l’outillage VFX retiré. Les dialogues finaux générés (609 Ko) sont chargés au démarrage.
- **C4.** Du code retiré est encore livré : `TravelView`, la chaîne de lecture vidéo (zéro emplacement), `CombatSfx`, les poses de la Combat Stage (42 Mo copiés dans `dist`), `tools/traversal`.
- **C5.** Le dépôt suit 2,28 Go de fichiers et `.git` pèse 6 Go. `docs/autonomy` compte 272 fichiers, et 12 jeux de contrats sont empilés. Les docs canoniques sont périmées : `DEMO_CONTENT_MAP.md` cite encore huit vidéos et `main@6ff5f4c`. Une réécriture d’historique demanderait l’accord de l’opérateur.

## Suite proposée

1. Lot de corrections A1 à A8, sur accord de l’opérateur.
2. Fiche d’arbitrages B1 à B10, avec les répliques de B7 à approuver mot à mot.
3. Lot des décisions.
4. Images finales (Codex), finalisation, puis test final sur PC.
5. Passe mobile, puis nettoyage C1 à C5.

## Corrections appliquées (A1 à A8, 2026-11-11, sur l’accord de l’opérateur)

**APPROVED DECISION.** L’opérateur a répondu « Oui, corrige A1–A8 ». Aucun contrat ni canon n’est modifié. Le seul texte de dialogue touché est la faute de A8.

- **A1.** `isSkillSpec` distingue les compétences des attaques d’arme et des objets. Sous Mutisme :
  - `bestOffense` n’offre que les attaques d’arme, sans ultime forcé ;
  - `bestSupport` ne renvoie rien ;
  - la boucle d’IA ne retient plus un ultime prêt ;
  - `executeActionCore` refuse toute compétence ;
  - le bouton et le menu des soutiens de clan sont désactivés.
- **A2.** `legacy-combat.html` :
  - régénération à 1 PA, et 3 pour les boss et les élites ;
  - +1 PA par élimination ;
  - Élan à ×1,0 / ×1,4 / ×1,6 (+10 % de précision et moitié de la défense ignorée au niveau 3) ;
  - liste réelle des altérations, avec Entravé et Mutisme, et une section « Essoufflé et Brisé » ;
  - fiche des boss : portée jusqu’à 7 cases, réserve et badge, attaque lourde et ultime décrits sans liste périmée, section « Furie ».

  Dans l’aide du combat, « Revoir l’École du combat » rouvre le tutoriel, suivi de la fiche des boss dans un combat de boss ou d’élite. Les écouteurs sont liés une seule fois. Échap ferme la fiche ouverte au lieu d’annuler l’action. Le panneau d’aide recevait `pointer-events: none` de `#ui` et ne s’ouvrait pas à la souris : il a désormais `pointer-events: auto`.
- **A3.** Avec une sauvegarde présente, « Nouvelle chronique » ouvre une confirmation (`role="alertdialog"`). Le focus est sur « Garder ma chronique » ; Échap garde aussi la chronique. Seul « Effacer et commencer » efface.
- **A4.** `SceneTransition` bloque `keydown` et `keyup` en capture tant que le rideau couvre, hors interlude. Le navigateur de manette envoie un `keydown` annulable avant son clic. `run()` renvoie `false` quand une transition est déjà en cours. `startCombat` et `fightPoiElite` montent alors le combat directement au lieu d’attendre indéfiniment.
- **A5.** `SceneTransition.cover()`, `releaseWhenReady()` et `release()` gèrent un rideau tenu :
  - Sortie de combat : `CombatBridge` garde le cadre au résultat (`holdOnResult`). GameApp couvre (« Victoire » ou « Défaite »), ferme le combat sous le noir, puis le rideau se lève quand la surface suivante pose son mode (`setMode`) ou qu’une transition suivante le reprend. Il tombe au plus tard après 6 s.
  - Retours au titre depuis le jeu : ils passent sous le rideau.
  - Dialogue vers carte : fondu de 460 ms, immédiat en mouvement réduit.
  - Réglage du jeu : la classe `body.motion-reduced` le transmet aux animations CSS (rideau, Journey, scène narrative, tournoi, entrées d’écran), à côté de la requête média de l’OS, que le contrat garde (voir B8).
- **A6.** `VFX_LAB_ENABLED` exige `import.meta.env.DEV`. Le plugin `exclude-local-only-public-assets` retire `assets/vfx/megapack-runtime` de `dist` après le build : 270 Mo contre 671 Mo.
- **A7.** Ce build écrit `rpg-threejs:autosave:v6:campaign` et `rpg-threejs:manual:v6:campaign`. Il lit encore les clés V6 partagées, puis les plus anciennes. « Nouvelle chronique » efface toutes ces clés. Les tests et les quatre pilotes QA qui lisent la sauvegarde suivent la nouvelle clé.
- **A8.**
  - La carte ne dit plus « 1 tour ».
  - « Laisser quelques provisions » exige 40 or.
  - Un tour sauté compte pour toutes les altérations (`tickStatusDuration`).
  - Les PA qu’une action donne à son auteur (grimoire, rendu de PA sur soi) sont crédités après le coût (`grantAp`, `settleActionAp` avec `bonusAp`).
  - Le texte flottant, la Compagnie et le catalogue disent Régénération, Force, Malédiction, Aveuglement et Provocation, comme les fiches.
  - « personne de blessé ».

Vérification :
- garde des contrats vide, `contracts:validate` et `narrative:validate` sans erreur ;
- `tsc` ; vitest 3279/3279 (218 fichiers), puis 1774/1774 sur `src/combat` et `src/ui` après le correctif du panneau d’aide ; tests node 26/26 ; build ;
- nouveaux tests : `src/combat/combatAuditFixes.test.ts`, `src/game/newChronicleConfirm.test.ts`, les gardes du rideau dans `src/ui/SceneTransition.test.ts`, et la sauvegarde partagée dans `src/game/campaignProgress.test.ts`.

Navigateur sur `localhost:5174` :
- la confirmation de « Nouvelle chronique » prend le focus, et Échap garde la chronique ;
- dans le combat du Général Serpent : nouvelle fiche des boss, Échap la ferme sans annuler le déploiement, et « Revoir l’École du combat » au clic rouvre le tutoriel puis la fiche des boss ;
- console sans erreur, hors la reconnexion WebSocket du serveur de développement après son redémarrage.

Non vérifié à la main : la sortie d’un vrai combat de campagne sous le rideau (couverte par les tests unitaires du rideau et par les tests GameApp existants).

# Audit de l'ouverture du jeu

| Champ | Valeur |
| --- | --- |
| `TASK` | `OPENING-AUDIT-2026-11-02` |
| `DOMAIN` | Présentation, récit, média |
| `BASELINE` | `dev @ 44eefb82` |
| `BRANCH` | `dev` |
| `HEAD` | Commit de ce rapport |
| `STATUS` | Review, en attente des arbitrages de l'opérateur |
| `MERGED_IN` | `NONE` (`dev` seulement) |
| `SUPERSEDES` | `NONE` |
| `SUPERSEDED_BY` | `NONE` |
| `PRODUCTION_IMPACT` | `NONE` : aucun code du jeu modifié |
| `CANONICAL_DOCS_UPDATED` | `NONE` : tout ce qui est proposé ici reste une proposition tant que l'opérateur n'a pas tranché |
| `EVIDENCE` | Partie jouée de bout en bout avec Playwright, captures et page d'essai de l'arène dans `tmp/opening-audit/` (ignoré). Limites en section 9 |

Demande de l'opérateur, 2026-11-02 : voir s'il faut des cutscenes en jeu, en commençant par le prologue, pour mieux présenter le jeu, la situation globale et personnelle, les enjeux, les objectifs et la mission, avec un audit préalable.

## 1. Verdict

`CURRENT FACT` L'ouverture dure 3 min 36 s à 4 min 42 s de lecture pure, sans un seul choix, et elle raconte plusieurs fois la même chose. Le problème vient autant du découpage que de l'absence d'animation.

`CURRENT FACT` Le meilleur atout est déjà là et le prologue ne s'en sert pas : 24 fonds de tableau en pixel art et les grands personnages de dialogue. Les cinq panneaux restent le seul moment peint et assombri de l'ouverture.

`CURRENT FACT` Une scène en jeu est techniquement possible : l'arène, les sprites et le bloom ont tourné hors du document de combat, dans une page d'essai de 80 lignes. Le rendu en plan moyen est fort. Les gros plans ne marchent pas.

`PROPOSED FUTURE DESIGN` Une maquette hors jeu de 50 à 60 secondes, mêlant tableaux et un plan d'arène, avant toute décision d'intégration. Elle ne touche ni au jeu ni aux contrats, et l'opérateur juge sur pièces.

## 2. L'ouverture aujourd'hui

`CURRENT FACT` `GameApp.startNewChronicle` enchaîne :

| Étape | Écrans | Mots | Forme |
| --- | --- | --- | --- |
| `PrologueView`, cinq panneaux | 5 | 167 | Image peinte assombrie, grande carte de texte, un clic par panneau |
| `acte_ouverture` | 9 | 378 | Tableau du camp, quatre acteurs, dialogue |
| `camp_departure` | 7 | 243 | Même camp, consignes de jeu et mise en garde |
| **Total** | **21** | **788** | **Aucun choix avant la carte** |

Temps de lecture, sur le modèle du test `r5NarrativeExpansion` (240 mots par minute, 0,9 s par clic) : 3 min 36 s. À 180 mots par minute : 4 min 42 s.

## 3. Ce qui se répète, manque ou se contredit

`CURRENT FACT`

| Constat | Détail |
| --- | --- |
| Doublons | Panneau 1 et `content.ts:100` (clan perdu), panneau 2 et `:112` (Sceaux), panneau 3 et `:172` (Alaric, Bois-Clair), panneau 5 et `:196` (le départ). |
| Audience anticipée | Le panneau 3 reprend presque mot pour mot la demande qu'Alaric fait plus tard à l'audience (`content.ts:304`). Le joueur l'entend deux fois, et la première fois sans Alaric. |
| Objectif presque absent | « Tournoi des Grands » n'apparaît qu'une fois dans tout `src/` (`content.ts:112`). Les « quatre Sceaux des quatre seigneurs » aussi. Le prologue ne les nomme pas. |
| Chronologie | Le panneau 5 dit « À l'aube, la compagnie quitte le camp ». Viennent ensuite une scène de nuit au camp, « Alors partons », puis « Avant de franchir la porte ». |
| Personnel | Les enjeux personnels existent : Alistair à la porte, les réserves de Marian, le doute d'Elara. Ils arrivent après le prologue. « Votre père » n'apparaît qu'une fois (`content.ts:100`), et le canon ne dit rien de plus du personnage joueur. |
| Style | Le contrat vise le pixel art et le HD-2D (`WORLD_AND_CHARACTERS.md`). Les panneaux sont peints, sombres, à demi couverts par la carte, puis on passe à un autre style. |

Les images des panneaux ne servent que de repli pour les dialogues d'ouverture : le joueur voit réellement le tableau du camp, pas `camp_departure.webp`.

## 4. Ce que disent les contrats

Lecture indépendante du set 1.12.0 par `contracts-guardian`. Gate LOCKED vide, `contracts:validate` vert. Les citations ci-dessous ont été relues pour les points décisifs.

| Voie | Permise aujourd'hui | Décision opérateur | Amendement |
| --- | --- | --- | --- |
| 1. Panneaux animés | Le mécanisme, oui | Oui, hors des trois chantiers | Non si le texte et les images ne changent pas |
| 2. Tableaux animés | Le mécanisme, oui | Oui : rôle du prologue et distribution sont ouverts | Non |
| 3. Scène dans l'arène | Pas clairement | Oui | Probable : constitution, `PRESENTATION_AND_MEDIA`, `COMBAT_AND_VFX`, `AUTHORING_AND_QA` |
| Alléger le texte | Non | Une tâche narrative explicite | Non, sans fait nouveau |

Points qui pèsent :

- **Pour la voie 3.** `PRESENTATION_AND_MEDIA.md:34` n'interdit que la lecture vidéo, le préchargement, les holds et les MP4.
- **Contre la voie 3.** La décision du 24 octobre « abandonne le concept de cinématique ». `PRESENTATION_AND_MEDIA.md:36` : « Stop new cinematic ». `COMBAT_AND_VFX.md:27` : les masters restent l'autorité de la mise en scène narrative.
- **Défilement automatique.** `STATIC_NARRATIVE_FINISHING_PLAN_2026-10-24.md:7` demande d'« éviter de remplacer les vidéos par une succession automatique d'images ». C'est un plan, pas un contrat, mais il vise la voie 1 comme la voie 2 si elles défilent seules.
- **Son.** Le texte ne peut pas attendre la musique : l'audio ne porte aucune information nécessaire et échoue en silence (`UI_AND_ACCESSIBILITY.md:45`, `PRESENTATION_AND_MEDIA.md:77`).
- **Calendrier.** OD-2026-11-01-C ferme la conception au playtest PC, puis ouvre une passe narrative à cadrer. Le gel des nouveaux systèmes et contenus tombe seulement sur demande de l'opérateur, ce qui est le cas ici.

Texte : retirer ou déplacer des phrases n'invente pas de canon, mais touche à un texte d'auteur, donc à une tâche narrative explicite (`CAMPAIGN_AND_STATE.md:17`). Couper à l'intérieur d'une réplique reste sûr. Supprimer ou déplacer une réplique casse la signature `id@actorId@choices` jusqu'à régénération (`FinalDialoguePresentation.generated.ts:7824`). `content.test.ts:232` exige cinq panneaux, et `r5NarrativeExpansion.test.ts:253` garde des planchers de mots dont la marge n'a pas été mesurée.

## 5. Les trois voies, sur le code réel

`CURRENT FACT` Page d'essai `tmp/opening-audit/arena-spike.html`, 80 lignes : `CombatArena`, quatre `PixelSpriteRig`, lumières, composition et bloom, sans combat. Aucune erreur. Construction de 0,2 à 0,3 s, 2,2 s au premier chargement, en rendu logiciel sur serveur de développement.

| Voie | Force | Limite | À créer |
| --- | --- | --- | --- |
| 1. Panneaux animés | Le moins de code | Reste un diaporama, images peintes floues au zoom | Minuteur, reprises CSS |
| 2. Tableaux animés | 24 fonds pixel, grands personnages nets, même style que la suite | Fonds d'une seule couche, donc pas de vraie profondeur. Zoom modeste : fonds de 1672 px | Lecteur de séquence, entrées et marches d'acteurs par code, effets de particules |
| 3. Scène dans l'arène | Vraie profondeur, feu et bannières vivants, le moteur du jeu lui-même | Trois décors. Pas de gros plan. Plateau et trous de ciel visibles selon l'angle. Aucun geste narratif | Hôte de rendu, lecteur, plans bornés, retouches de décor, repli sans WebGL, libération mémoire, amendement |

`CURRENT FACT` Feuilles de sprites animées : les quatre héros et les Serpents en ont une, dans les états repos, déplacement, élan, attaque, sort, coup reçu, K.O. Maelor et Séraphine n'en ont pas. Alaric reste à vérifier, peut-être sous `lion_champion`. Eux n'existent que comme grands personnages de dialogue.

Note de cohérence : l'essai montre la compagnie à Bois-Clair pour juger le rendu, mais elle n'y est pas au prologue. Une scène devrait y montrer les Serpents, sans elle (`WORLD_AND_CHARACTERS.md`, vérité de l'environnement).

## 6. Script proposé

`PROPOSED FUTURE DESIGN` Environ 52 secondes et 91 mots, contre 167. Toutes les phrases existent déjà.

| Plan | Durée | Image | Texte existant | Source |
| --- | --- | --- | --- | --- |
| Le clan déchu | 9 s | Noir, une bannière déchirée sans emblème tombe | « Votre nom fut jadis prononcé parmi les grands. Puis vinrent la défaite, les serments rompus et les bannières brisées. » | Panneau 1 |
| Les Sceaux | 10 s | Tableau d'audience, lente avancée | « Les Sceaux ne répondent ni aux titres ni au sang. Ils jugent les actes. » puis « Pour entrer au Tournoi des Grands, il nous faut les quatre Sceaux des quatre seigneurs. » | Panneau 2, `content.ts:112` |
| Bois-Clair | 12 s | Arène en feu, Serpents qui avancent, sans la compagnie | « Bois-Clair brûle sous les torches des Serpents. » | Panneau 3 |
| L'ombre | 9 s | `shadow-ruins-tableau` | « Des marques anciennes apparaissent dans la cendre, et des silhouettes sans bannière marchent derrière les clans comme une seconde guerre. » | Panneau 4 |
| La compagnie | 12 s | `lion-camp-tableau`, les quatre héros entrent | « Chaque détour peut sauver une vie, remplir un coffre, attirer une recrue ou réveiller un danger. » | Panneau 5 |

La séquence finit au camp, de nuit, sur le fond exact d'`acte_ouverture` : le dialogue enchaîne sans coupure. La demande d'Alaric reste à l'audience.

## 7. Défauts trouvés

`CURRENT FACT` Indépendants de toute décision sur les cutscenes :

| Défaut | Preuve |
| --- | --- |
| La brume du prologue boucle sans fin, sans respecter le mouvement réduit | `app.css:225`, aucune règle dans les blocs `prefers-reduced-motion`, contre `UI_AND_ACCESSIBILITY.md:25` |
| Recharger pendant le prologue saute le prologue et `acte_ouverture` | La sauvegarde est écrite avant le prologue (`GameApp.ts:1525`). `prologueSeen` est écrit mais jamais lu. Lu dans le code, pas reproduit |
| Image manquante sans repli | `PrologueView.ts:79`, contre `PRESENTATION_AND_MEDIA.md:34` |

## 8. Ce que toute version devra tenir

Passer à tout moment, avec le clic, Entrée, Espace et Échap. Mouvement réduit du système et du jeu. Repli si une image ou WebGL manque. Texte indépendant du son, sur sa propre horloge. Aucun nouveau drapeau de sauvegarde, aucun état visuel sérialisé. `acte_ouverture`, les cinq identifiants de panneaux et l'appel `camp_departure` conservés. Quatre acteurs au plus. Contexte musical `drama` conservé.

## 9. Limites

- Le mouvement de l'arène n'a pas été vu : seules des images fixes ont été prises, sans bascule de netteté ni ambiance, et avec des valeurs de brouillard approchées.
- Aucun chiffre n'a été pris sur vraie carte graphique.
- Les temps de lecture sont un modèle, pas une mesure sur un joueur.
- La marge des planchers de `r5NarrativeExpansion` n'a pas été mesurée.
- La lecture des contrats est celle d'un relecteur et la mienne : un amendement éventuel aurait sa propre revue.

## 10. Décisions attendues

Regroupées dans la [fiche d'arbitrages](https://claude.ai/artifact/RcD47SFx3tf9cxvm8fATeU) : principe de la maquette, moment de l'intégration, forme, défilement, durée, objectif affiché, doublons, chronologie, personnage joueur, bannière du clan, défauts.

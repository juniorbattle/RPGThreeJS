# Bilan de fin de conception, lot combat (2026-11-13)

| Champ | Valeur |
| --- | --- |
| TASK | `COMPLETENESS-REVIEW-COMBAT-2026-11-13` (run `claude-bilan-combat-20261113T1644Z`) |
| DOMAIN | Combat tactique (données des unités, compétences, effets procéduraux), outils d'images et de planches de combat |
| BASELINE | `b2830891` sur `dev` (jeu de contrats 1.23.0, baseline immuable `6228a34fd69a01406ecf0fb7168a53f92a267d7b`) |
| BRANCH | `dev` (worktree `wizardly-golick-53b32b`, poussé sur `origin/dev`) |
| HEAD | le commit de ce rapport |
| STATUS | merged : tout est sur `origin/dev` |
| MERGED_IN | `origin/dev` (`307b5a19`, `2578a659`, `41bda162`, `a44184dc`, `7274f9ec`, `e300e2c2` et le commit de ce rapport) |
| SUPERSEDES | NONE (applique le §2 de `game-completeness-review-2026-11-13.md`) |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Voir « Ce qui change en jeu ». Aucun champ de sauvegarde ; aucun contrat touché. |
| CANONICAL_DOCS_UPDATED | `docs/content/drafts/NEW_BOSS_SKILLS_DRAFT_2026-11-13.md` (validations de l'opérateur). La décision et l'état sont consignés par la session parente. |
| EVIDENCE | Tests, `tsc`, build, contrats et garde (« Vérifications »). Captures promues dans `docs/reports/bilan-combat-2026-11-13/` : galerie de compétences avant/après et nouvelles attaques lourdes. Les galeries jouent les effets par script, horloge figée ; les combats ont été vus à la main, avec de vrais clics. |

## Décisions appliquées

`APPROVED DECISION` OD-2026-11-13-F, C1 à C5 (`docs/autonomy/COMPLETENESS_REVIEW_OPERATOR_DECISION_2026-11-13.md`), plus la remarque de l'opérateur au lancement des lots, « grandeur et impact ».

Validations de l'opérateur dans cette session :
- **C3 et C4.** À « Valides-tu les quatre nouvelles attaques lourdes et le Démon, comme dans le brouillon ? », il a répondu « Yes, all four ».
- **Démon de la brèche.** Il a signalé : « le demon semble prendre beaucoup de place sur la zone de tuile ( il depasse sa zone ) », puis « si c'est un demon qui se deplace sur la grid combat il est trop large ou sinon son sprite n'est pas suffisamment optimale ».
- **Bête corrompue.** À « Renommer l'arme de la Bête corrompue en « Charge » ? », il a répondu « Yes, « Charge » ».

## Ce qui change en jeu

1. **C1.** Le Gardien de flamme a Gel et le Champion du Phénix a Transpercement, à la place de leur Garde. Leur cycle de 4 tours retrouve son attaque lourde.
2. **C2.** Le Fidèle égaré a Apocalypse à la place d'Exécution.
3. **C5.** Kaelen porte « Bâton du Dragon », le Grand Inquisiteur « Bâton de l'Inquisiteur » et le champion du Corbeau « Dagues du Corbeau ».
   - Les icônes ne changent pas, d'après les images : ✦ pour les bâtons, † pour les dagues.
   - Statistiques, portée et son sont identiques.
   - Les trois armes gardent l'effet de leur ancien nom : les deux bâtons gardent celui du sceau. Le champion du Corbeau garde ses lames lancées, et son image montre aussi des couteaux de lancer en bandoulière.
   - Le nom d'une arme ennemie ne s'affiche pas en combat : l'attaque de base se lit « Attaque » avec l'icône.
4. **C3 et C4.** Quatre attaques lourdes magiques nouvelles, réglées comme Gel : 4 PA, portée 0 à 7, puissance 16 ×1,2, précision 0,85.

   | Boss | Compétence | Statut | Son |
   | --- | --- | --- | --- |
   | Kaelen | « Foudre Céleste » | Aveuglement | `fx.cast.arcane.h` |
   | Grand Inquisiteur | « Sentence » | Mutisme | `fx.cast.fire.h` |
   | Maelor | « Serment rompu » | dissipe les effets positifs de la cible | `fx.cast.blood.h` |
   | Entité de la brèche | « Étreinte de la brèche » | Entravé | `fx.cast.ice.h` |

   - Chacune a sa recette d'effet propre, à l'échelle d'une attaque lourde : impact vers 0,4 s, tremblement 0,3, sans ralenti ni caméra d'ultime.
   - **Le Démon** passe à Gel + Frappe du Titan : son ultime frappe sur sa FOR 30.
   - Les 15 couples attaque lourde + ultime sont tous différents ; Maelor ne partage plus le couple du Prophète.
5. **IA.** Un effet qui vise les ennemis (la dissipation de Serment rompu) ne compte plus comme un soutien. Sinon, Maelor pouvait la lancer sur ses alliés.
6. **Grandeur et impact.** Six effets étaient en dessous de leur rang ; ils sont renforcés sans toucher aux statistiques :
   - Rafale Mortelle : elle prend une charge, et son dernier coup a désormais le poids d'un ultime ;
   - Transpercement et Gel ;
   - Pluie de Flèches et Sceau de Lien ;
   - Vague de Flammes, qui prend des braises d'ombre pour ne plus ressembler au souffle des dragons.
7. **Bête corrompue.** Elle combat avec « Charge » ◆ au lieu de « Griffes », comme son image (cornes et sabots).
   - Statistiques et portée identiques.
   - Effet de coup de bélier du sanglier. Le son au lancement ne change pas ; la marque sonore à l'impact suit l'effet (coup lourd, terre).
   - Le test arme/image couvre maintenant les 38 unités, sans exception.
8. **Démon de la brèche.** Il est recentré sur sa case et un peu plus bas (2,2 → 1,95).
   - L'ancre de ses pieds passe entre ses deux pieds, au lieu de rester sous la griffe la plus basse.
   - Sa silhouette passe de 1,6 à 1,4 case de large, le centre à 3 px de l'ancre au lieu de 22.

## Audit grandeur et impact

`CURRENT FACT` Les 68 compétences en jeu ont été mesurées par rang : durée, instant d'impact, charge, tremblement, lumière, particules, caméra, son. Les recettes sont jouées telles qu'écrites, sans mise à l'échelle par le coût en PA.

| Rang | Durée méd. | Tremblement méd. | Particules méd. | Caméra | Son |
| --- | --- | --- | --- | --- | --- |
| Légère (2 PA) | 0,85 s | 0,14 | 16 | fixe | composé, léger |
| Légère (3 PA) | 0,95 s | 0,20 | 10 | fixe | composé, moyen |
| Lourde (4 PA) | 1,2 s | 0,22 | 30 | fixe | composé, lourd |
| Ultime (5 PA) | 1,9 s | 0,56 | 84 | gros plan, ralenti, charge | signature |

- **L'échelle d'ensemble tient.** Tous les ultimes ont gros plan, charge et son signature. Toutes les attaques lourdes ont le son lourd.
- **Écarts corrigés** : les six effets du point 6 ci-dessus. Captures : `audit-boss-avant.jpg` et `audit-boss-apres.jpg`, `audit-heros-avant.jpg` et `audit-heros-apres.jpg`.
- **Laissés tels quels, par conception :**
  - les ultimes de soutien (Miracle, Harmonie absolue), sans tremblement : « calme » du Mage Blanc ;
  - la Bombe Fumigène et l'Assassin silencieux, peu lumineux : le Ninja est fait de fumée ;
  - Rugissement : aucune unité ne l'utilise.
- **Ressemblances.** La plus forte était Vague de Flammes contre Souffle de Dragon (0,83) ; elle est corrigée. Les autres paires proches sont un héros et un ennemi de même famille (lames venimeuses).

## Vérifié dans le navigateur, avec de vrais clics

| Combat | Ce qui a été vu | Mouvement |
| --- | --- | --- |
| Gardien de flamme | Gel en manche 2 (5 → 1 PA) | normal |
| Fidèles égarés | Gel en manche 2, puis Apocalypse en manche 4, avec le gros plan d'ultime | normal |
| Tournoi : le Corbeau | Transpercement en manche 2 ; « Dagues du Corbeau » † lu dans l'état du jeu | réduit |
| Tournoi : le Phénix | Transpercement en manche 2 | normal |
| Kaelen | Foudre Céleste en manche 2 ; « Bâton du Dragon » ✦ | normal |
| Grand Inquisiteur | Sentence en manche 2, Elara sous Mutisme (Compétences grisé) ; « Bâton de l'Inquisiteur » ✦ | normal |
| La brèche | Maelor : Serment rompu en manche 2. Entité : Étreinte de la brèche, Kestrel −36 PV et Entravé. Démon de la brèche recentré, aussi en déplacement | réduit |
| L'arène en flammes | Le Démon joue Gel en manche 2 ; son kit est Gel + Frappe du Titan | normal |

- **Console** : aucune erreur.
- **Bête corrompue** : « Charge » ◆ lu dans l'état du jeu. En quatre manches, elle a joué Onde de Choc puis gardé sa CHARGE, sans attaque de base.
- **Non vu en jeu :**
  - l'attaque de base « Dagues du Corbeau », faute de héros à portée ; l'égalité des recettes est testée ;
  - la Frappe du Titan du Démon en manche 4 ; c'est un ultime existant, déjà vu chez Borin ;
  - l'attaque de base « Charge » de la Bête corrompue ; l'effet est celui du sanglier, fixé par un test.

## Vérifications

- **Tests ciblés** : tous verts sur les fichiers demandés (`fxSkills`, `postDemoCombatRuntime`, `skillsPass`, `DemoVfxActionScope`, `combatPoses`), plus `combatBossTempo`, `cues`, `skillPresentation`, `combatVfxPresentation`, `VfxResourceManager` et `tools/art`.
- **Tests nouveaux** :
  - l'attaque lourde chez les 32 boss et élites ;
  - les 15 couples distincts, sur la stat forte ;
  - le tri des soutiens de l'IA ;
  - l'arme de combat comparée à l'image et aux poses, pour les 38 unités qui combattent ;
  - les armes renommées gardent leur effet.
- **Suite et build :**
  - `npx tsc --noEmit` : vert.
  - `npm run build` : réussi, avec l'avertissement habituel sur les morceaux de plus de 500 ko.
  - vitest : 3 438 tests passent. Les 10 échecs ont tous une cause ENOENT : ils lisent des médias ignorés par Git, absents de ce worktree (`public/assets/vfx/megapack-runtime/`, `tmp/cinematics/`). Ce sont les mêmes 4 fichiers avant et après mes changements.
  - node:test : 26/26 à la seconde exécution. Le test du travailleur QA détaché (délai de 3 s) a échoué une fois sous la charge du build ; il passe seul.
- **Contrats** : `npm run contracts:validate` vert ; la garde `git diff --exit-code 6228a34f… HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md` est vide.
- **Table des sons** : toujours 158 identités sur 160. Aucune signature nouvelle.

## Hors combat : registre et portrait de l'orateur (ajout du même jour)

La session de récit a donné aux six héros recrutables une pose de repos dans les tableaux, sur l'accord de l'opérateur (champ `tableau` de `characterProfiles`). Ce lot a vérifié le résultat et cherché les autres écrans hors combat.

- **Tableaux** : les six héros mesurent de 46 à 49 vh, avec 8 vh sous les pieds, comme les héros de la démo (48 à 53 vh). Vérifié dans `dragon_wolf_traps`, `bear_mountain_shrine` et `scorpion_buried_library`, en normal et en mouvement réduit. Rien à rééchantillonner. Les autres personnages de l'après-démo suivent déjà la règle de la démo. Aucun des six héros ne figure dans un tableau vivant.
- **Deux écrans montraient encore le master d'action** :
  - le registre de compagnie (portrait en pied et vignette) ;
  - le portrait de l'orateur dans la boîte de dialogue, qui coupait le chapeau de Lyra et la tête de Gunnar, et où la faux de Morvan remplissait le cadre.
- **Décision de l'opérateur**, sur les captures avant/après : « Oui, les deux ».
- **Changement** :
  - `ManagementView.ts` lit d'abord `tableau`, pour le portrait en pied comme pour la vignette. La vignette prend le cadrage `upper-body` des héros de la compagnie, et la figure est marquée `REST_POSE_FULL_BODY`.
  - `DialoguePortrait.ts` lit d'abord `tableau`, avec le cadrage par défaut, réglé pour les toiles de la compagnie.
  - Le combat garde son master (`ui`) et ses planches.
- **Tests** : `CharacterUiIntegration.test.ts` vérifie le registre (clic sur chaque héros) et le portrait de l'orateur pour les six héros et pour Alistair. Le commentaire de `tableauActorFraming.test.ts` est mis à jour.
- **Navigateur** : vrais clics sur chaque héros dans le registre, et une vraie réplique de chaque rencontre jouée par `DialogueView`, en normal et en mouvement réduit. Le rendu est identique dans les deux modes.
- **Preuves** : `bilan-combat-2026-11-13/hors-combat-registre-avant-apres.jpg`, `hors-combat-registre-apres.jpg`, `hors-combat-portrait-orateur-avant.jpg` (simulation calculée à partir du CSS exact) et `hors-combat-portrait-orateur-apres.jpg`.
- **Vérifications** :
  - `npx tsc --noEmit`, `npm run build`, `npm run contracts:validate` et la garde des contrats : verts.
  - node:test : 26/26.
  - vitest : 3 487 tests passent. Les 6 échecs sont tous dans 3 fichiers historiques de `tools/cinematics/`. Ils lisent des médias ignorés par Git (`tmp/cinematics/`) ou cherchent ffprobe, absents de ce worktree. Aucun ne touche à ce changement.
- **Reste tel quel** : le portrait de scène de l'ancien mode de dialogue, qui lit `dialogue`. Il ne s'affiche que hors scène narrative, et les rencontres se jouent sur leur tableau.

## Ouvert

- **Le libellé « PURIFIÉ »**, en vert, s'affiche quand Serment rompu retire les protections d'un héros. C'est le libellé existant de la dissipation, le même que pour Casse-Faille. Un libellé propre, par exemple « DISSIPÉ », demanderait un texte nouveau, donc l'accord de l'opérateur.
- **Les boss larges débordent de leurs 2×2** jusqu'à 1,5 à 1,6 fois, comme le Général Serpent de la démo, qui fait référence. Rien n'est changé sans retour de l'opérateur.

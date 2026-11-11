# Test PC de l’opérateur : trois retours sur le combat tactique

| Champ | Valeur |
| --- | --- |
| TASK | PLAYTEST-COMBAT-2026-11-11 |
| DOMAIN | Combat tactique (résolution et IA), présentation du combat |
| BASELINE | `4d8e1d0d` sur `dev` (jeu de contrats 1.20.0, baseline immuable `6c965169c2dc153cafd5a8609d914cf8de723ff3`) |
| BRANCH | `playtest-combat` |
| HEAD | le commit de ce rapport, sur `playtest-combat` |
| STATUS | review : en attente du test de l’opérateur et de l’intégration à `dev` |
| MERGED_IN | NONE |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Le +1 PA d’une élimination est crédité après le coût de l’action. Boss et élites suivent un cycle de 4 tours (action légère, attaque lourde, CHARGE, ultime) avec réserve de PA, régénèrent 3 PA et entrent en Furie sous la moitié de leurs PV (jeu de contrats 1.21.0). « Brisé » fait sauter un tour et non plus deux. En choisissant une case, les autres unités restent lisibles (0,62) et le chemin survolé est tracé. |
| CANONICAL_DOCS_UPDATED | Amendement 1.21.0 (`PRODUCTION-CONTRACTS-BOSS-FURY-1`, OD-2026-11-11-B) : `docs/contracts/COMBAT_AND_VFX.md`, `UI_AND_ACCESSIBILITY.md`, `README.md`, `contracts.manifest.json`, `docs/autonomy/OPERATOR_DECISIONS.md`, `docs/autonomy/BOSS_TEMPO_AND_FURY_OPERATOR_DECISION_2026-11-11.md` ; puis la baseline `470216d1` dans `AGENTS.md`, les skills, `MULTI_AGENT_PROTOCOL.md`, `RECURRING_RUN_PROMPT.md` et `docs/project/CURRENT_STATUS.md`. Aucun texte de canon, aucun champ de sauvegarde. L’état autonome (`docs/autonomy/AUTONOMOUS_WORK_STATE.*`) sera mis à jour à l’intégration, car une autre session travaille en parallèle sur l’échoppe. |
| EVIDENCE | Tests unitaires (ci-dessous), trace d’un vrai combat de boss dans le laboratoire QA, captures de la sélection en jeu (`docs/reports/evidence/playtest-combat-2026-11-11/`, dossier ignoré, non promu). |

## 1. Le PA rendu à l’élimination (défaut, corrigé)

**CURRENT FACT, avant.** `applyDamage` créditait le +1 PA au moment de l’élimination, pendant l’action, avec un plafond au maximum de PA. `executeActionCore` déduisait le coût de l’action seulement à la fin. À 5 / 5 PA, une attaque++ à 3 PA qui tue donnait : 5 + 1 plafonné à 5, puis 5 − 3 = **2**. Le PA gagné était perdu sous le plafond. Le même ordre annulait en partie la remise à zéro de l’escalade : l’élimination remettait le compteur d’attaques à 0, puis la fin de l’action le repassait à 1 (et pareil pour le compteur d’objets).

**Correction.** L’action ouvre un règlement (`G.actionSettlement`). Une élimination marquée par l’unité qui agit y est comptée, puis payée après le coût, par `settleActionAp` (`src/combat/combatTempo.ts`) : 5 − 3 + 1 = **3**. La remise à zéro de l’escalade d’attaque et du coût des objets, déjà voulue par le code, s’applique désormais après le décompte de l’action. Une élimination hors de sa propre action (riposte, effet d’un autre) est créditée immédiatement, comme avant. Si une action s’arrête sans payer, le PA de l’élimination reste dû (`settleUnpaidKnockOuts`). Les boss et élites suivent la même règle. Le « +1 PA » flottant s’affiche toujours au moment du coup.

Test : `src/combat/combatKillAp.test.ts` (cas exact du test PC, crédit hors action, action non payée, câblage des quatre paiements).

## 2. Boss et élites inactifs, trop souvent essoufflés ou brisés (corrigé dans les règles existantes)

> **Suite.** Le cycle de 5 tours décrit ci-dessous a été remplacé le même jour par le cycle de 4 tours décidé par l’opérateur (section 4).

**CURRENT FACT, le schéma défini dans le code.** Chaque boss et élite a une recharge d’ultime de 5 tours (`_ultCooldown`). Un avertissement « CHARGE » apparaît quand la recharge vaut ≤ 1 et que l’unité a ≥ 3 PA, puis « ULTIME » à recharge 0 et ≥ 5 PA (`bossIntentPresentation.ts`). Chaque kit a une attaque lourde à 4 PA (Onde de Choc, Gel, Transpercement) et un ultime à 5 PA, qui est la signature du boss. L’unité régénère 2 PA par tour et reprend son souffle (+1 PA) si elle finit son tour avec des PA.

**Pourquoi le schéma n’était pas suivi.**
1. L’IA dépensait tout dès qu’elle pouvait : elle finissait souvent son tour à 0 PA. Elle était alors **Essoufflée** pendant le tour des héros (+20 % de critique pour eux), et un critique la rendait **Brisée**.
2. « Brisé » est appliqué pour 1 tour, mais `applyStatus` élève toute durée de 1 à 2 : le boss perdait **deux** tours.
3. Chaque tour sauté remettait la recharge de l’ultime à 5. Un boss brisé repartait de zéro et n’atteignait jamais son ultime.
4. À recharge 0 sans les 5 PA, l’IA bloquait les actions à 4 PA mais dépensait encore 1 à 3 PA, ce qui retardait l’ultime.

**Correction.**
- **Cycle de cinq tours avec réserve de PA** (`bossApReserve`, `src/combat/combatTempo.ts`, branché dans `bestOffense` et `bestSupport`). L’IA ne dépense que ce qui dépasse la réserve utile à l’étape suivante :

  | Recharge | Rôle | Réserve en fin de tour |
  | --- | --- | --- |
  | 4 | actions légères | 1 PA |
  | 3 | actions légères, prépare la lourde | 2 PA |
  | 2 | **attaque lourde** (4 PA), favorisée par l’IA | 1 PA |
  | 1 | **charge** : « CHARGE » reste affiché | 3 PA |
  | 0 | **ultime** (5 PA), tenu tant qu’il n’a pas de cible, jamais échangé contre une action mineure | tout |

  Le boss ne finit plus un tour à 0 PA, sauf juste après son ultime : la fenêtre « Essoufflé » devient une ouverture lisible, une fois par cycle.
- **« Brisé » fait sauter exactement le tour pour lequel il est appliqué.** Les états qui font sauter un tour ne sont plus doublés ; les autres gardent leur durée minimale de 2. Cela vaut pour toute unité, puisque la règle des états est commune. Briser un boss pendant sa charge interrompt toujours son ultime : c’est la contre-attaque du joueur, inchangée.
- Rien d’autre ne change : régénération, souffle, coûts, dégâts, statistiques, portées et kits restent les mêmes.

**Preuve.**
- `src/combat/combatBossTempo.test.ts` simule le cycle avec les fonctions du moteur. Pour les 15 kits de boss et d’élite qui ont un ultime : ultime aux tours 5 et 10, aucun tour fini à 0 PA hors ultime, « CHARGE » visible le tour d’avant, et « Brisé » qui ne saute qu’un tour.
- Trace d’un vrai combat dans le laboratoire QA (`/legacy-combat.html?qa=1&boss=bear_borin`, les héros passent leur tour) : Ancien Ours Borin joue Onde de Choc aux manches 3 et 8 et Frappe du Titan (ultime) aux manches 5 et 10. Il finit chaque autre tour avec 2 à 5 PA. Aucun Essoufflé ni Brisé hors de la fenêtre d’après l’ultime.
- Limite : aux tours « légers », un boss immobile dont les héros restent hors de portée (attaques de base de 1-2 cases, Frappe lourde au contact) garde ses PA. Il n’a légitimement rien à frapper.

### Attaquer deux fois par tour : proposition (validée ensuite, section 4)

**CURRENT FACT.** Dans les règles actuelles, une unité, boss compris, peut déjà enchaîner plusieurs actions dans un tour tant que ses PA le permettent (deuxième attaque de base à +1 PA d’escalade). La réserve laisse ce cas se produire quand le budget du tour le permet. C’est rare, à 2 PA de régénération par tour.

**PROPOSED FUTURE DESIGN, non construit.** Une deuxième attaque *gratuite* ou un deuxième tour est une règle de combat nouvelle. COMBAT_AND_VFX, section 1.20.0 : « Any other new combat rule […] is proposed to the operator, not built. » Il faut donc un amendement de contrat dédié (et une ligne dans UI_AND_ACCESSIBILITY pour l’annoncer en texte). Proposition précise, à valider ou corriger :

> **Furie (boss et élites).** Sous la moitié de ses PV, une fois par tour, quand une action offensive d’un boss ou d’une élite est résolue, il enchaîne une **attaque de base gratuite** (0 PA, sans escalade) sur une cible à portée, s’il en a une. Elle peut rater, critiquer, tuer et rendre son PA comme une attaque normale. Elle n’a pas lieu le tour de l’ultime, ni s’il est Brisé, Entravé ou Muet. Le passage en Furie est annoncé en texte (journal, état « Furie » sur l’unité, lisible sans couleur), sans son ni effet nouveau. Rien n’est sauvegardé.

Variantes possibles : seuil à 50 % des PV ou dès le début du combat ; élites incluses ou boss seuls ; deux tours par manche au lieu d’une attaque gratuite (plus lourd, déconseillé).

## 3. Lisibilité des cibles et des déplacements (présentation seulement)

- **Constat mesuré.** Le moteur estompe à 0,42 (`COMBAT_PRESENTATION.units.focusDimOpacity`) toute unité qui n’est ni active, ni survolée, ni cible valide. La réponse des sprites pixel est non linéaire (`pixelFocusResponse` : ≈ 38 % de couverture, teinte assombrie et désaturée). Sur les captures, une unité à 0,42 a presque disparu, et on ne voit plus que son anneau. C’est le bon effet pour un **ciblage** : seules les cibles valides (0,82) et celle survolée (1) restent nettes. Je n’ai donc pas renforcé cet estompage. Un essai à 0,30 les rendait totalement invisibles, et il a été abandonné.
- **Déplacement : le vrai défaut.** Le même 0,42 s’appliquait en choisissant une case : alliés et ennemis disparaissaient, alors qu’il faut les voir pour lire les obstacles et les angles d’attaque de dos (« DOS ! »). Les autres unités passent à **0,62** pendant le choix d’une case (≈ 65 % de couverture, en retrait mais lisibles ; nouveau réglage `focusMoveDimOpacity`). L’unité survolée revient à 1.
- **Chemin du déplacement.** La case survolée affiche **le chemin exact** du déplacement, calculé par la même carte d’accessibilité et le même `buildPath` que le mouvement réel, tracé en ivoire doré, bien distinct des cases de portée sarcelle, avec la destination en surbrillance. On lit l’angle d’arrivée avant de valider. Le clavier et la manette suivent le même chemin, puisque le curseur appelle le même survol.
- Correction associée : après un survol, l’estompage reprenait la valeur générale au lieu de celle de l’action en cours ; il garde désormais celle de l’action.
- **Pas de mouvement de caméra**, par choix :
  - COMBAT_AND_VFX borne le cadrage, l’arène devant toujours remplir le fond.
  - Le mouvement réduit du jeu s’active par le réglage du jeu **ou** par celui du système (`prefersReducedMotion`) ; ton PC, animations Windows coupées, est donc toujours en mouvement réduit, où une caméra doit rester fixe.
  - L’estompage et le chemin sont statiques et valent dans les deux modes ; les pulsations des cases sont déjà figées en mouvement réduit.
- Rien de ceci ne touche la résolution : aucune modification de PA, de dégâts ou de légalité dans les chemins de sélection (test).

Tests : `src/combat/UnitFocusController.test.ts` (estompage du déplacement, niveau conservé après un survol) et `src/combat/combatSelectionReadability.test.ts` (chemin exact, redessin seulement quand la case change, aucun chemin vers une case inaccessible, couverture du déplacement > 60 % et du ciblage < 45 %, aucun appel de résolution ni de caméra).

Captures (dossier ignoré `docs/reports/evidence/playtest-combat-2026-11-11/`, 1366 × 768) : `move-path-*.png` (déplacement, case (3,1) survolée à la souris depuis (1,2) : chemin doré par (2,2) et (3,2), autres unités à 0,62), `target-*.png` (ciblage d’une attaque) et `move-*.png` (essai abandonné à 0,36, gardé pour la comparaison), pour trois cas : sans réduction (`normal`), réglage du jeu (`game-reduced`, `&reduced=1`) et mouvement réduit du système émulé (`os-reduced`, `reducedMotion: 'reduce'`).

## 4. Suite du 2026-11-11 : décisions de l’opérateur

L’opérateur a répondu au rapport : cycle de 4 tours, Furie validée, régénération de 3 PA pour les boss et élites, amendement et construction dans cette session ([décision](../autonomy/BOSS_TEMPO_AND_FURY_OPERATOR_DECISION_2026-11-11.md)).

**OD-2026-11-11-A, cycle de 4 tours, sans amendement** (aucun contrat ne fixe ces valeurs ; vérifié par contracts-guardian).
- Le cycle est : action légère, attaque lourde, « CHARGE », ultime. La recharge de l’ultime vaut 4 au début du combat, après l’ultime et après un tour sauté (`BOSS_ULTIMATE_COOLDOWN`, `src/combat/combatTempo.ts`).
- Boss et élites régénèrent 3 PA par tour (`BOSS_ELITE_AP_REGEN`). Avec 2 PA, l’action légère suivie de l’attaque lourde juste après un ultime laissait le boss à 0 PA, donc Essoufflé.
- Le tutoriel « Boss & Élites » dit 3 PA et décrit le cycle.

| Recharge | Rôle | Réserve en fin de tour |
| --- | --- | --- |
| 3 | action légère | 1 PA |
| 2 | **attaque lourde** (4 PA), favorisée | 1 PA |
| 1 | **CHARGE**, action légère possible en gardant 3 PA | 3 PA |
| 0 | **ultime** | tout |

**OD-2026-11-11-B, Furie, amendement 1.21.0.**
- L’amendement `PRODUCTION-CONTRACTS-BOSS-FURY-1` touche COMBAT_AND_VFX et UI_AND_ACCESSIBILITY, plus l’historique et le manifeste. La relecture de contracts-guardian a donné PASS WITH WARNINGS ; ses précisions sont reprises dans le texte.
- Commit `470216d1` ; baseline immuable inscrite ensuite dans les documents opérationnels. Porte désormais : `git diff --exit-code 470216d179e2cf6e2840e0c48f4f431a5dbb65d4 HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md`.
- La règle : un boss ou une élite strictement sous la moitié de ses PV maximum, une fois par tour au plus, après la première action offensive qu’il résout dans ce tour, enchaîne une attaque de base gratuite, sans se déplacer, sur une cible à portée.
  - L’attaque coûte 0 PA, n’entre pas dans l’escalade et se résout normalement (raté, critique, élimination et son +1 PA).
  - Jamais le tour de l’ultime, ni après un soutien, ni si l’unité est Brisée, Entravée ou Muette.
- Code : `isInFury`, `furyStrikeAllowed` (`combatTempo.ts`), et `bestFuryAttack` et `furyStrike` dans le moteur. L’IA ne choisit que la cible.
- Texte : un état dérivé « Furie » (code FUR) sur l’unité et dans sa fiche, et deux lignes de journal (« … entre en Furie ! », « … — Furie : attaque supplémentaire. »). Aucun son, effet ou champ de sauvegarde nouveau.

**Preuve.**
- `src/combat/combatBossTempo.test.ts`, cycle de 4 tours : ultimes aux tours 4, 8 et 12 ; lourdes aux tours 2, 6 et 10 ; « CHARGE » visible aux tours 3, 7 et 11 avec au moins 3 PA gardés. Pour tous les kits de boss et d’élite, aucun tour fini à 0 PA hors ultime.
- `src/combat/combatFury.test.ts` couvre :
  - le seuil de PV ;
  - une seule attaque par tour ;
  - les exclusions ;
  - le coût nul hors escalade ;
  - la résolution par le chemin normal des actions ;
  - l’annonce en texte.
- Trace d’un vrai combat dans le laboratoire QA (`/legacy-combat.html?qa=1&boss=bear_borin`). Borin a été mis à 243 / 540 PV et le Chevalier placé à portée par le script QA ; les héros passent leur tour :
  - manche 1 : Attaque+, puis Furie ;
  - manche 2 : Onde de Choc, puis Furie ;
  - manche 3 (CHARGE) : Attaque+, puis Furie ;
  - manche 4 : Frappe du Titan, sans Furie ;
  - manche 5 : Garde (soutien), sans Furie ;
  - manche 6 : Onde de Choc ;
  - manche 8 : Frappe du Titan.
  La ligne « entre en Furie » n’apparaît pas dans cette trace, parce que les PV ont été réglés directement sans dégâts ; le test la couvre.

## Comment vérifier en jeu

1. **PA à l’élimination.** Un héros à 5 / 5 PA lance une attaque de niveau 3 (3 PA) qui tue : il doit rester à **3 PA**, et sa prochaine attaque de base repart au coût de base.
2. **Boss.** `/?qa=1` → « QA rencontres » → un boss, par exemple Ancien Ours Borin. Sur une dizaine de manches :
   - action légère au 1er tour du boss, attaque lourde au 2e, « CHARGE » au 3e, ultime au 4e, puis tous les quatre tours ;
   - Essoufflé seulement juste après l’ultime, et un Brisé ne fait sauter qu’un tour ;
   - sous la moitié de ses PV, l’état « Furie » s’affiche et le boss enchaîne une attaque gratuite après sa première action offensive du tour, jamais le tour de son ultime.
3. **Lisibilité.** Choisis Déplacement : les autres unités passent en retrait sans disparaître, et le chemin vers la case survolée se dessine. Choisis une attaque ou une compétence : seules les cibles valides restent nettes, et celle survolée est pleinement visible. À vérifier aussi avec le réglage « mouvement réduit » du jeu, et sur ton PC tel quel (réduction par le système).

## Vérifications

- Tests unitaires du combat : tous verts, sauf 5 tests préexistants de `src/combat/vfx/spritesheetPng.test.ts`. Ils lisent `public/assets/vfx/megapack-runtime/`, des PNG commerciaux synchronisés localement et jamais commités (`.gitignore`), absents d’un clone neuf ; ils échouent de même sur `4d8e1d0d`.
- `npm test` (relancé après la Furie) : 3 184 tests passent, 23 sont ignorés, 10 échouent dans 3 fichiers, tous préexistants et environnementaux. Je n’ai touché à aucun de ces fichiers ni à `tools/`.
  - `src/combat/vfx/spritesheetPng.test.ts` (5) : PNG commerciaux locaux, voir ci-dessus.
  - `tools/cinematics/cin4_media.test.mjs` (1) : le test attend un chemin Windows `C:…`.
  - `tools/cinematics/cin6ea3_pilot_e_regate.test.mjs` (4) : médias sous `tmp/`, ignorés et absents du clone.
- `npx tsc --noEmit` : vert. `npm run build` : vert. `npm run contracts:validate` : 8 contrats, 8 identifiants historiques, zéro vidéo active, archives identiques.
- Porte : vide sur `6c965169` avant l’amendement ; vide sur la nouvelle baseline `470216d179e2cf6e2840e0c48f4f431a5dbb65d4` après.

## Conformité

| Ligne | Verdict | Preuve |
| --- | --- | --- |
| GAME_CONSTITUTION | PASS | Inchangée ; le combat tactique reste seul maître de la résolution (Furie comprise) ; la présentation n’invente rien. |
| COMBAT | PASS | Corrections dans le moteur existant ; la seule règle nouvelle, la Furie, est construite après l’amendement 1.21.0 demandé par l’opérateur (OD-2026-11-11-B), relu par contracts-guardian ; cycle et régénération sans amendement (OD-2026-11-11-A). |
| SAVE | PASS | Aucun champ ajouté ; le règlement, le profil de cycle et la Furie (déduite des PV) sont transitoires. |
| UI / ACCESSIBILITY | PASS | États en texte (CHARGE, ULTIME, Brisé, Essoufflé, Furie) ; journal de la Furie ; estompage et chemin statiques, valables en mouvement réduit. |
| NARRATIVE / CAMPAIGN | N/A | Aucun texte ni canon touché. |
| REPOSITORY_GOVERNANCE | PASS | Branche `playtest-combat` depuis `origin/dev` ; ni `main` ni `dev` ; amendement dédié puis commit de baseline séparé ; porte vide sur `470216d1` ; état autonome inchangé (à mettre à jour à l’intégration avec le jeu 1.21.0). |

# Passe de qualité sur les compétences et attaques du combat

| Champ | Valeur |
| --- | --- |
| TASK | PLAYTEST-SKILLS-2026-11-11 |
| DOMAIN | Combat tactique (définitions, exécution, textes et aperçus des actions), fiche du héros |
| BASELINE | `4d8e1d0d` sur `dev`, puis `origin/playtest-combat` fusionnée en avance rapide (`d1bfdb10`) avant toute modification du runtime ; jeu de contrats 1.20.0, baseline immuable `6c965169c2dc153cafd5a8609d914cf8de723ff3` |
| BRANCH | `playtest-skills` |
| HEAD | le commit de ce rapport, sur `playtest-skills` |
| STATUS | review : en attente de ton test et de tes décisions, puis de l’intégration à `dev` |
| MERGED_IN | NONE |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Sept actions mal exécutées corrigées (Lame Arcanique +2, Rempart du Serment, cinq améliorations de zone sans effet, Charge, Repli Explosif). Le menu de combat, la fiche du héros et l’écran d’amélioration affichent une fiche chiffrée générée depuis la définition réelle, au niveau du héros. Aperçus et infobulles corrigés. Textes réécrits. États « Racines » et « Silence » renommés « Entravé » et « Mutisme ». |
| CANONICAL_DOCS_UPDATED | NONE : aucun contrat, aucun texte de canon narratif, aucun champ de sauvegarde. L’état autonome (`docs/autonomy/AUTONOMOUS_WORK_STATE.*`) et l’index des rapports seront mis à jour à l’intégration, car deux autres sessions travaillent en parallèle. |
| EVIDENCE | Tests unitaires ci-dessous (dont une comparaison automatique de chaque compétence à chaque niveau avec le vrai `getSpec` du runtime). Laboratoire QA du combat (`/legacy-combat.html?qa=1`) : menu des compétences à 1366 × 768 sans et avec mouvement réduit du jeu (`&reduced=1`), et à 390 × 844 ; zéro erreur console, aucun débordement horizontal. Captures et `result.json` dans `docs/reports/evidence/playtest-skills-2026-11-11/` (dossier ignoré, non promu). |

## 1. Ce qui a été vérifié

Pour chaque action, quatre choses ont été comparées :

1. **La définition** : `src/game/skills.ts`, le catalogue des armes et des accessoires qui remplacent une compétence (`src/game/catalog.ts`), les unités ennemies (`src/combat/legacyCombatRuntime.js`, `DEFS`, `BOSS_DEFS`, `VISUAL_UNIT_TEMPLATES`) et les soutiens de clan (`src/campaign/plateaux/finale/finaleCombat.ts`).
2. **L’exécution** dans le runtime : `getSpec` et `applySkillUpgrade` (niveaux d’amélioration), `executeActionCore` (dégâts, soins, états, effets multiples), `doMove` (bonds, téléportations, charge), `performSkillMovement` (frappe-éclair, repli, échange), `applyAdditionalStatus`, et le ciblage (`rangeCells`, `aoeCells`, `affectedUnits`, `effectTargets`).
3. **Le texte affiché** : nom, description, aperçu au survol (`showActionPreview`, `previewPower`, `previewAccuracy`), infobulles du menu (`tipFor`), menu de combat (`openSkillMenu`, `openElanMenu`, `openSupportMenu`), fiche du héros et écran d’amélioration (`src/ui/ManagementView.ts`).
4. **La signature FX** (`src/combat/fx/fxSkills.ts`) : chaque compétence de héros a sa recette, sur l’action ou sur le déplacement, et chaque compétence ennemie en usage a la sienne (`fxSkills.test.ts`). Aucune recette ne manque. Seules les trois compétences ennemies que personne ne porte (Voile de Fumée, Provocation, Cri de Guerre) n’en ont pas, comme prévu.

Règles du runtime à connaître pour lire le tableau (constatées dans le code, inchangées) :

- **Tir ami des zones offensives.** Une zone offensive sans liste d’effets touche toutes les unités de la zone sauf le lanceur, alliés compris (`affectedUnits`). L’aperçu avertit déjà (« ⚠ 1 allié touché ») et l’IA pénalise ces tirs (`bestOffense`). Les compétences à liste d’effets ne visent que les ennemis.
- **Durée des états.** Un état de N tours dure N tours de la cible (décompte en fin de son tour, `tickStatusDuration`). Une durée demandée de 1 devient 2, sauf pour un état qui fait passer un tour (`applyStatus`, après le travail de `playtest-combat`).
- **Valeurs des états.** Brûlure : 6 % des PV max + 8 par tour. Poison : 5 % + 6. Régénération : 8 % + 6 de soin. Ralenti : DEX −35 %. Force : FOR et MAG +40 %. Affaibli : FOR et MAG −25 %. Barrière : END +40 %. Malédiction : END −30 %. Aveuglement : précision −30. Entravé : ne peut plus se déplacer. Provocation : doit attaquer le lanceur.
- Les compétences à 5 PA sont les Ultimes : fermées, jamais proposées en jeu, ni dans le menu de combat ni sur la fiche.

## 2. Inventaire

Légende de la colonne « Suite » :

- **Corrigé** : l’exécution suit la définition.
- **Texte** : le texte dit désormais ce que fait l’action.
- **Décision Dn** : ambigu, le texte dit la vérité en attendant ton choix (section 5).
- **OK** : conforme, sauf texte précisé.

Pour toutes les compétences de héros ouvertes, le menu de combat, la fiche du héros et l’écran d’amélioration affichent désormais une **fiche chiffrée générée depuis la définition**, au niveau d’amélioration du héros (section 3.2). Les lignes ci-dessous ne le répètent pas.

### 2.1 Héros (paliers T1 à 2 PA, T2 à 3 PA, T3 à 4 PA)

| Action | Défaut constaté | Preuve | Suite |
| --- | --- | --- | --- |
| Brise-Garde (Guerrier T1) | Texte obscur : « réduit temporairement sa défense », sans durée ni valeur. Améliorations « Dégâts augmentés », « Effet prolongé ». | `skills.ts:5` | Texte |
| Charge (Guerrier T2) | **Mal exécutée** : ×1,10 de dégâts déclaré, jamais appliqué à l’impact. Texte faux : « charge vers une cible ». En réalité, il fonce sur une case libre en ligne droite et frappe chaque ennemi adjacent à l’arrivée, sans jet de précision, en le ralentissant. Amélioration 2 « Ralentit la cible au contact » **sans effet** : c’est déjà inclus. | `skills.ts:6`, `doMove` (`legacyCombatRuntime.js:1919`, bloc `if(spec.impact)`) | Corrigé (+10 %) ; Texte ; Décision D3 |
| Tourbillon d’Acier (Guerrier T3) | Texte faux : « tous les ennemis autour du lanceur ». La compétence frappe aussi les alliés adjacents. Amélioration 2 « Zone élargie » **sans effet** : le rayon passe de 1 à 1,25, ce qui n’ajoute aucune case. | `skills.ts:7`, `affectedUnits`, test `skillsPass` | Corrigé (rayon 1,5 : +4 diagonales) ; Texte ; Décision D1 |
| Anneau de Force (accessoire) | Brise-Garde devient Lame Maudite : mêmes nombres, autre nom et autre FX. | `catalog.ts:87` | OK |
| Espadon du Lion (Guerrier T3) | Tourbillon devient Rempart du Serment : voir le Paladin. | `catalog.ts:30` | OK |
| Frappe Consacrée (Paladin T1) | Texte sans durée de barrière. Elle se lance aussi sur une case vide, pour la seule barrière. | `skills.ts:10` | Texte ; Décision D9 |
| Interposition (Paladin T2) | Conforme. Le texte omettait que le Paladin reçoit lui aussi la barrière. | `skills.ts:11` | OK, texte précisé |
| Rempart du Serment (Paladin T3) | **Mal exécutée** : « provoque les ennemis » posait la Provocation sur le Paladin lui-même. Elle était sans effet, car l’IA ne lit la provocation que sur l’unité provoquée (`aiTurn`). Le défaut touchait aussi l’Espadon du Lion et le soutien « Rempart de l’Ours ». Texte de l’amélioration 2 fautif (« Dissipe les altérations alliés ») ; elle purifie en fait tous les alliés du terrain. | `skills.ts:12`, `effectTargets`, test `skillsPass` | Corrigé (ennemis adjacents provoqués 2 tours) ; Texte |
| Lame Maudite (Chevalier Noir T1) | Conforme ; texte sans durée. | `skills.ts:15` | OK, texte précisé |
| Pas du Néant (Chevalier Noir T2) | Conforme ; texte sans portée. | `skills.ts:16` | OK, texte précisé |
| Pacte de Sang (Chevalier Noir T3) | **Non configurée** : « vole la vie de ses ennemis ». Le vol de vie ne compte que les dégâts de la même action, et la compétence n’en inflige aucun, donc il vaut toujours 0. L’amélioration 2 « Vol de vie renforcé » était sans effet. | `skills.ts:17`, `executeActionCore` (traitement `lifesteal`) | Effet inerte retiré de la définition ; Texte (sacrifie 15 % des PV, Force 2 tours) ; Décision D2 |
| Estoc Long (Lancier T1) | Texte obscur : « la déstabilise ». C’est un Ralenti de 2 tours, à exactement 2 cases. | `skills.ts:20` | Texte |
| Repli de Hampe (Lancier T2) | Conforme. Une case vide à portée est aussi une cible valide : 3 PA pour un simple déplacement (cible « hybride », `allowsEmptyTileHybridTarget`). | `skills.ts:21` | Indiqué dans la fiche ; Décision D10 |
| Saut du Griffon (Lancier T3) | Texte faux : « bondit sur les ennemis ». Il bondit sur une case libre puis frappe les unités adjacentes, alliés compris. Amélioration 2 « Ralentit la cible centrale » : elle ralentit tous les ennemis de la zone. | `skills.ts:22` | Texte ; Décision D1 |
| Attaque de base, lance | L’infobulle disait « portée 1-2 » et la carte d’arme « Portée 2 ». En réalité, une case au contact, diagonales comprises (`getSpec`, `extendedMelee`). | `legacyCombatRuntime.js:1605`, `tipFor`, `ManagementView` | Texte ; Décision D6 |
| Éclair Noir (Mage Noir T1) | Texte « fige sur place » sans durée : c’est Entravé, 2 tours. | `skills.ts:25` | Texte |
| Téléportation (Mage Noir T2) | Conforme. | `skills.ts:26` | OK |
| Vague de Flammes (Mage Noir T3) | Amélioration 2 « Cône élargi » **sans effet** sur la zone : le rayon passe de 1,6 à 1,9, ce qui n’ajoute aucune case. La brûlure prolongée fonctionnait. Le lanceur ne peut pas être dans le cône. | `skills.ts:27`, test `skillsPass` | Corrigé (rayon 2,0 : +1 case devant) ; Décision D7 |
| Grimoire mystique (Mage Noir T2) | Remplace l’Ultime Météore par Vague de Flammes, déjà possédée. Sans effet aujourd’hui ; il ferait perdre une compétence le jour où les Ultimes ouvriront. | `catalog.ts:45` | Noté, rien à faire tant que les Ultimes sont fermés |
| Lumière Salvatrice (Mage Blanc T1) | Le texte figeait « 40 % » alors que +1 et +2 donnent 55 % et 70 %. | `skills.ts:30` | Texte (le chiffre passe dans la fiche par niveau) |
| Purification (Mage Blanc T2) | Aperçu faux : soin estimé à MAG × 0 + CHA/4 au lieu de 20 % des PV max. Amélioration 2 « et zone » **sans effet** : les effets ne visaient que la cible. | `skills.ts:31`, `previewPower`, `effectTargets` | Corrigé (aperçu exact ; +2 soigne et purifie les alliés adjacents à la cible) |
| Sanctuaire (Mage Blanc T3) | Conforme ; texte sans durée de Régénération. | `skills.ts:32` | OK, texte précisé |
| Sceau du Sage (accessoire) | Purification (3 PA, T2) devient Rune de Vigueur (2 PA). La règle des paliers ouvre alors la Rune dès T1 : le Mage Blanc gagne une deuxième compétence en T1 et perd Purification. | `catalog.ts:92`, `isSkillUnlockedForHero` | Décision D8 |
| Attaque de base, crosse | Elle soigne un allié (MAG × 0,5), mais l’aperçu affichait « ⚠ 1 allié touché » et une estimation de dégâts. | `showActionPreview` | Corrigé (aperçu « Soin ») |
| Lame Arcanique (Mage Rouge T1) | **Mal exécutée** : l’amélioration 2 « Renforce le lanceur » donnait Force à l’ennemi frappé, car la cible par défaut d’un état ajouté est « ennemis ». | `skills.ts:35`, `applyAdditionalStatus`, test `skillsPass` | Corrigé |
| Pas Runique (Mage Rouge T2) | Conforme. | `skills.ts:36` | OK |
| Cercle Écarlate (Mage Rouge T3) | L’amélioration 1 « Dégâts et soin améliorés » n’améliore que les dégâts. | `skills.ts:37` | Texte ; Décision D5 |
| Attaque de base, rapière | Magique à 2 cases (don Lame Hybride), mais l’aperçu l’estimait en physique. | `previewPower` | Corrigé |
| Rune de Vigueur (Enchanteur T1) | Conforme ; texte sans durée. | `skills.ts:40` | OK, texte précisé |
| Transposition (Enchanteur T2) | Conforme. | `skills.ts:41` | OK |
| Sceau d’Entrave (Enchanteur T3) | Texte : « immobilise les ennemis ». Il entrave aussi les alliés de la zone. | `skills.ts:42` | Texte ; Décision D1 |
| Tir Précis (Archère T1) | Texte « altère la vision » : c’est un Aveuglement de 2 tours (précision −30). | `skills.ts:45` | Texte |
| Bond du Faucon (Archère T2) | Texte faux : « renforce son prochain tir ». Il donne Force 2 tours, à toutes ses attaques. | `skills.ts:46` | Texte |
| Pluie de Flèches (Archère T3) | Texte : « ralentit les ennemis ». Elle touche et ralentit aussi les alliés de la zone. | `skills.ts:47` | Texte ; Décision D1 |
| Arc long (T2) et Arc du Vent (T3) | Tir Précis devient Tir Calibré (+1 puissance) ; Bond du Faucon devient Pas d’Ombre. | `catalog.ts:61-62` | OK |
| Attaque de base, arc | Le +5 de précision à portée maximale (don inné) manquait à l’aperçu. | `previewAccuracy` | Corrigé |
| Lame Venimeuse (Ninja T1) | Conforme. | `skills.ts:50` | OK |
| Pas d’Ombre (Ninja T2) | Conforme : derrière la cible si la case est libre, sinon à côté. Sur une case vide, simple téléportation. | `skills.ts:51`, `findStrikeDestination` | OK, texte précisé |
| Bombe Fumigène (Ninja T3) | Amélioration 1 « Zone élargie » **sans effet** : le rayon passe de 1,5 à 1,75, ce qui n’ajoute aucune case. | `skills.ts:52` | Corrigé (rayon 2 : +4 cases) |
| Coup Sournois (Voleuse T1) | Le texte omettait l’Affaibli. « Plus fort par derrière » est la règle commune (+30 % de dos). Amélioration 2 « Critique garanti par derrière » : en réalité +80 % sous tous les angles, plafonné à 90 %. | `skills.ts:55`, `critChance` | Texte ; Décision D4 |
| Roulade (Voleuse T2) | Texte faux : « renforce son prochain coup ». Elle donne Force 2 tours. | `skills.ts:56` | Texte |
| Mâchoire à Ressort (Voleuse T3) | Amélioration 2 « Petite zone » **sans effet** : sans rayon de base, le bonus de rayon était ignoré. | `skills.ts:57`, `applySkillUpgrade` | Corrigé (cible et 4 cases adjacentes, alliés compris) |
| Attaque de base, dague | Le ×1,45 de dos (don inné) manquait à l’aperçu. | `previewPower` | Corrigé |
| Tir Calibré (Artilleur T1) | Conforme ; même texte que Tir Précis. | `skills.ts:60` | OK, texte précisé |
| Repli Explosif (Artilleur T2) | **Mal exécutée** : la compétence se cible elle-même, et le repli prenait donc le lanceur pour la menace. Il reculait à l’opposé de son orientation, parfois vers l’ennemi, et finissait dos aux ennemis (+30 % de dégâts reçus). | `performSkillMovement` (`legacyCombatRuntime.js:1985`), test `skillsPass` | Corrigé (il recule loin de l’ennemi le plus proche et lui fait face) |
| Grenade Incendiaire (Artilleur T3) | Conforme ; elle avertit déjà du tir ami. Le lanceur ne peut être touché qu’avec la zone de l’amélioration 2. | `skills.ts:62` | OK, fiche exacte |
| Attaque de base (toutes) | La fiche du héros disait « Attaque de base, 1 PA ». En réalité, l’Élan coûte 1, 2 ou 3 PA (×1, ×1,4, ×1,6 ; au niveau 3, +10 % de précision et 50 % de la défense ignorée), avec +1 PA à chaque attaque de plus dans le tour, jusqu’à une élimination. | `getSpec`, `ManagementView` | Texte |
| Menu de combat | Les descriptions étaient coupées à deux lignes (`-webkit-line-clamp:2`) : les plus longues finissaient en « … ». | `combat-hud.css:99` | Descriptions ramenées à 85 caractères au plus ; la fiche n’est pas coupée |
| États sur l’unité | La pastille disait « Racines » et « Silence », le texte flottant « ENTRAVÉ » et « MUTISME ». | `statusPresentation.ts`, `STATUS` | Pastilles renommées « Entravé » et « Mutisme » |
| Soutiens de clan (acte final) | Ils réutilisent sept compétences de héros. Les corrections de Tourbillon, Rempart, Sanctuaire, Sceau d’Entrave, Bombe Fumigène, Mâchoire et Purification s’y appliquent. | `finaleCombat.ts:98-104` | Infobulle du menu des soutiens avec la fiche |

**Ultimes (fermés, non joués).** Ils sont comparés au runtime par le test automatique. Défauts relevés pour le jour de leur ouverture :

- Déferlement du Lion maudit toutes les unités touchées de la ligne, pas « la cible principale ».
- Jugement Radieux soigne les alliés de la zone visée (portée 1-3), pas ceux autour du Paladin comme « alliés proches » le laisse croire.
- Flèche du Zénith +2, « Critique assuré contre une cible isolée », donne +90 % sans condition.
- Barrage d’Artillerie +2, « Dernier impact enflamme », double une brûlure déjà présente.
- Météore Obscur brûle aussi les alliés de la zone.

Rien n’a été modifié dans les Ultimes.

### 2.2 Ennemis (démo du Lion, Ours, Dragon, Scorpion, acte final)

Dix-neuf compétences ennemies sont en usage, sur 62 définitions d’unités ennemies (4 unités de base, 15 boss et 43 modèles de rencontre). Leurs descriptions ne sont affichées nulle part en jeu : seul le nom apparaît, dans le journal et sur le titre de l’action. Elles ont été corrigées quand elles étaient fausses, pour que la définition reste juste.

| Action | Défaut constaté | Preuve | Suite |
| --- | --- | --- | --- |
| Frappe Lourde (30 unités) | « peut ralentir » : en réalité, elle ralentit à coup sûr quand elle touche. | `skills.ts:79` | Texte |
| Écrasement (Troll) | « les ennemis autour » : elle frappe toutes les unités adjacentes, alliés du Troll compris. | `skills.ts:80` | Texte ; Décision D1 |
| Tir Entravant (17 unités) | Le texte ne disait pas qu’il n’inflige aucun dégât. | `skills.ts:84` | Texte |
| Frappe Sismique, Apocalypse, Frappe du Titan | « toute la grille », « ralentit toute la grille » : ce sont des zones de 5, 49 et 21 cases autour du point visé, à portée 7. | `skills.ts:65,69,77` | Texte |
| Brasier Infernal | « Brûlure prolongée » est faux : la brûlure dure 2 tours. Le second état « burn » de la définition n’était jamais lu. | `skills.ts:76`, `getSpec` | Texte ; champ mort retiré |
| Onde de Choc, Gel, Transpercement, Exécution, Rafale Mortelle, Garde, Régénération, Fortification, Éclair Sombre, Maléfice, Frappe Venimeuse, Souffle de Dragon | Conformes. Textes harmonisés : « entrave », portée longue. | `skills.ts:67-83, 88` | OK |
| Rugissement, Voile de Fumée, Provocation, Cri de Guerre | Portés par aucune unité. Les trois derniers n’ont pas de FX, comme prévu. | test `fxSkills` | Textes corrigés, pas d’autre suite |
| Attaques de base ennemies | Chacune a sa signature : par le nom de l’arme (Morsure, Griffes, souffles…) ou par l’effet de son type d’arme. | `fxSkills.ts` `ENEMY_ATTACKS` | OK |

## 3. Corrections

### 3.1 Exécution (avec test)

| Correction | Fichiers | Test |
| --- | --- | --- |
| Lame Arcanique +2 : Force pour le lanceur | `skills.ts` (`additionalStatusTarget:'self'`) | `skillsPass.test.ts` « Lame Arcanique +2… » |
| Rempart du Serment : Provocation sur les ennemis adjacents | `skills.ts` (effet `target:'enemies'`) | `skillsPass.test.ts` « Rempart du Serment… » |
| Zones d’amélioration qui gagnent vraiment des cases : Tourbillon +2, Bombe Fumigène +1, Vague de Flammes +2, Mâchoire à Ressort +2, Purification +2 | `skills.ts` | `skillsPass.test.ts` « every zone upgrade… », « Purification +2… », « Mâchoire… », « Tourbillon… » |
| Charge : ×1,10 appliqué à l’impact | `legacyCombatRuntime.js` `doMove` | `skillsPass.test.ts` « Charge applies… » |
| Repli Explosif : recule loin de l’ennemi le plus proche et lui fait face | `legacyCombatRuntime.js` `performSkillMovement` | `skillsPass.test.ts` « Repli Explosif… » |
| Pacte de Sang et Brasier Infernal : champs inertes retirés (aucun changement de jeu) | `skills.ts` | comparaison `getSpec` de `skillFacts.test.ts` |

### 3.2 Textes, aperçus et fiche chiffrée (avec test)

- **Fiche chiffrée** (`src/game/skillFacts.ts`). Une ligne par compétence : cible et portée, zone (nombre de cases, alliés compris ou non), dégâts (type, puissance, bonus), soins, états avec durée et effet, effets annexes. Par exemple, Brise-Garde au niveau 2 donne : « Portée 1 · Dégâts physiques, puissance 12 · Malédiction 3 tours (END −30 %) ».
  - En combat, la fiche décrit la spec que le runtime résout vraiment (`openSkillMenu`, `openSupportMenu`).
  - Hors combat, elle décrit un miroir de `getSpec` et `applySkillUpgrade`. Un test exige que ce miroir donne exactement le même résultat que le runtime, pour chaque compétence et chaque niveau.
  - Tests : `skillFacts.test.ts` (miroir, zones comptées comme `aoeCells`, noms et valeurs des états, règle des durées, tir ami annoncé partout où il existe et seulement là, descriptions de 85 caractères au plus) et `skillsPass.test.ts` (menu de combat).
- **Fiche du héros et écran d’amélioration** : la fiche au niveau du héros, et pour l’amélioration, la ligne « Actuel » et la ligne « Prochain », chacune chiffrée. L’Attaque de base est décrite avec l’Élan. Test : `ManagementView.test.ts` « states each open skill in numbers… ».
- **Aperçus** : estimation de Purification, crosse sur un allié, arc à portée maximale, dague de dos, rapière à distance. Test : `skillsPass.test.ts` « preview and tooltip fixes… ».
- **Lance** : infobulle d’attaque et carte d’arme indiquent « 1 (diagonales comprises) ». Tests : `skillsPass.test.ts` et `ManagementView.test.ts` « gives a long spear… ».
- **Descriptions et améliorations réécrites** : les 36 compétences de héros ouvertes et 16 descriptions ennemies. Une description dit ce que fait l’action, qui elle touche et quels états elle pose. Les chiffres qui changent avec les améliorations vivent dans la fiche, et les espaces insécables gardent ensemble « 30 % » et « 2 tours ».

### 3.3 Changements d’équilibre, signalés

Aucun coût ni puissance de base n’a changé. Ces corrections changent toutefois ce que le joueur obtient :

- Améliorations de zone qui ne faisaient rien :
  - Tourbillon +2 : 4 cases puis 8 ;
  - Bombe Fumigène +1 : 9 cases puis 13 ;
  - Vague de Flammes +2 : 4 cases puis 5 ;
  - Mâchoire +2 : 1 case puis 5 ;
  - Purification +2 : la cible puis la cible et ses alliés adjacents.
- Charge : +10 % de dégâts, la valeur que sa définition et son aperçu annonçaient déjà.
- Rempart du Serment provoque réellement les ennemis adjacents.
- Lame Arcanique +2 renforce le lanceur et non plus l’ennemi.
- Repli Explosif ne tourne plus le dos à l’ennemi.

## 4. Zones communes avec `playtest-combat` (`src/combat/legacyCombatRuntime.js`)

`origin/playtest-combat` (`d1bfdb10`) a été fusionnée avant toute modification. Mes changements dans ce fichier tiennent en 10 lignes ajoutées et 8 retirées, dans des fonctions que `playtest-combat` n’a pas touchées :

- l’import de `describeSkillFacts` ;
- `previewAccuracy`, `previewPower`, la nouvelle `isCrosierAllyHeal` et `showActionPreview` (aperçu au survol) ;
- `doMove`, une ligne dans le bloc d’impact de la charge ;
- `performSkillMovement`, une ligne (la menace du repli) ;
- `tipFor`, la portée de l’attaque ;
- `openSkillMenu` et `openSupportMenu`, la fiche.

`playtest-combat` a modifié `applyDamage`, le règlement des PA, `executeAction`, l’IA (`aiTurn`, `bestOffense`), l’estompage des unités et le tracé du déplacement. Aucune ligne n’est commune. Le point le plus proche : leur test `combatKillAp.test.ts` compte cinq occurrences de `payActionCost(u,spec)`, et je n’en ai ajouté aucune.

## 5. En attente de ta décision

Pour chaque point, le texte dit aujourd’hui la vérité sur le comportement actuel. Rien n’est construit avant ton choix.

- **D1. Tir ami des zones offensives.**
  - Concerne Tourbillon, Saut du Griffon, Pluie de Flèches, Sceau d’Entrave et Mâchoire +2.
  - Concerne aussi les zones des boss, qui touchent leurs escortes.
  - **A**, garder : les textes l’annoncent désormais, l’aperçu avertit, l’IA l’évite.
  - **B**, épargner les alliés, sauf pour les quatre compétences écrites « peut toucher les alliés » (Vague de Flammes, Grenade, et deux Ultimes).
  - Recommandation : B pour les héros. C’était l’intention lisible des textes d’origine, et cela rend ces quatre compétences plus franches.
- **D2. Pacte de Sang.**
  - **A**, garder « sacrifie 15 % des PV pour Force 2 tours ».
  - **B**, ajouter un état « Vol de vie » de N tours : ses attaques rendent X % des dégâts infligés. C’est un état nouveau, donc une règle de combat nouvelle à te proposer (COMBAT_AND_VFX 1.20.0), pas à construire seul.
  - Recommandation : A, avec une amélioration 2 utile, Force prolongée, déjà en place.
- **D3. Charge +2.**
  - **A**, la base perd le ralentissement et +2 l’ajoute, comme le disaient les textes d’origine.
  - **B**, la base garde le ralentissement et +2 reçoit un autre effet existant (par exemple puissance +2).
  - Recommandation : B. Elle ne retire rien au joueur.
- **D4. Coup Sournois +2.**
  - **A**, garder +80 % de critique sous tous les angles, plafonné à 90 %.
  - **B**, limiter le bonus aux coups portés de dos, comme le texte d’origine (petit ajout dans le calcul du critique).
  - Recommandation : B.
- **D5. Cercle Écarlate +1.**
  - **A**, dégâts seuls.
  - **B**, ajouter un bonus de soin : +4 PV, à l’échelle des +10 des Ultimes qui soignent 20 à 25 PV.
- **D6. Attaque de base de la lance.**
  - **A**, garder le contact, diagonales comprises (comportement actuel, voulu par le code). Les descriptions des lances (« frapper à distance », « longue portée ») restent alors à réécrire.
  - **B**, portée 1-2 de l’arme, comme la faux et la rapière.
  - Recommandation : A, qui laisse à l’Estoc Long son rôle de frappe à 2 cases.
- **D7. Vague de Flammes +2.**
  - **A**, +1 case droit devant (fait).
  - **B**, rayon 2,3 : +5 cases, un cône vraiment plus large.
- **D8. Sceau du Sage.**
  - **A**, tel quel : la Rune de Vigueur s’ouvre dès T1, Purification est perdue.
  - **B**, une compétence remplaçante garde le palier de celle qu’elle remplace.
- **D9. Attaque monocible validée sur une case vide.** Elle dépense ses PA pour rien. Frappe Consacrée s’en sert pour une barrière seule.
  - **A**, garder.
  - **B**, refuser la validation sans cible (« Aucune cible »), sauf pour les zones, les déplacements et les effets sur soi.
  - Recommandation : B.
- **D10. Repli de Hampe sur une case vide.** C’est un déplacement seul pour 3 PA.
  - **A**, garder.
  - **B**, réserver la cible « case vide » aux téléportations (Pas d’Ombre).

## 6. Comment vérifier en jeu

1. **Menu de combat.** Ouvre « Compétences » : sous chaque description, une ligne dorée donne la portée, la zone, les dégâts et les états avec leur durée, au niveau d’amélioration du héros. La même ligne figure sur la fiche du héros (Compagnie) et dans « Amélioration » (« Actuel » et « Prochain »).
2. **Rempart du Serment** (Paladin T3, ou Guerrier avec l’Espadon du Lion) près d’un ennemi : l’ennemi porte « Provocation » et attaque le Paladin à son tour.
3. **Lame Arcanique +2** : Lyra gagne « Force », l’ennemi frappé non.
4. **Repli Explosif** dos tourné à un ennemi : Gunnar recule loin de lui et le regarde.
5. **Purification +2** sur un allié collé à un autre allié : les deux sont soignés et purifiés. L’aperçu annonce 20 % (35 %, 50 %) des PV max.
6. **Attaque de base de la crosse** sur un allié : l’aperçu dit « Soin », sans avertissement d’allié touché.
7. À refaire avec le réglage « mouvement réduit » du jeu. Le menu est le même, et aucun effet animé n’a été ajouté.

## 7. Vérifications

- **Tests ciblés : verts.**
  - `src/game/skillFacts.test.ts` (7)
  - `src/combat/skillsPass.test.ts` (14)
  - `src/ui/ManagementView.test.ts` (15)
  - `src/combat/skillPresentation.test.ts` (18)
  - `src/combat/combatHudPresentation.test.ts` (16)
  - `src/combat/statusPresentation.test.ts` (21)
- **Les nouveaux tests échouent sur l’ancien code** (15 sur 21), puis passent sur le nouveau. Les 6 autres sont des contrôles de cohérence, verts dans les deux cas.
- **Test mis à jour :** `skillPresentation.test.ts` figeait `targetSource:'selected'` sur Purification. Ce champ est retiré pour que sa zone +2 fonctionne ; le comportement de base est identique et prouvé aux niveaux 0 et 1.
- **`npm test` : 3 201 tests passent, 23 sont ignorés, 10 échouent dans 3 fichiers.** Tous préexistants et environnementaux, déjà décrits par `playtest-combat`, et je n’ai touché à aucun d’eux :
  - `src/combat/vfx/spritesheetPng.test.ts` (5) : PNG commerciaux locaux, absents d’un clone neuf ;
  - `tools/cinematics/cin4_media.test.mjs` (1) : chemin Windows `C:…` attendu ;
  - `tools/cinematics/cin6ea3_pilot_e_regate.test.mjs` (4) : médias sous `tmp/`, absents.

  Comme `vitest` sort en erreur, j’ai lancé la suite `node:test` à part : `node --test tools/qa/qa-job.test.mjs`, 26 sur 26.
- **`npx tsc --noEmit` : vert.**
- **`npm run build` : vert,** avec l’avertissement hérité sur la taille des morceaux.
- **`npm run contracts:validate` :** 8 contrats verrouillés, 8 identifiants historiques, zéro vidéo active, archives identiques.
- **Porte :** `git diff --exit-code 6c965169c2dc153cafd5a8609d914cf8de723ff3 HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md` n’imprime rien.
- **Laboratoire QA** (`vite` sur le port 5197, que j’ai démarré puis arrêté, PID 7262), `/legacy-combat.html?qa=1` dans Chromium :
  - menu des compétences à 1366 × 768, sans et avec `&reduced=1`, et à 390 × 844 ;
  - fiche présente sous chaque compétence, aucune ligne de fiche coupée, aucun débordement horizontal, zéro erreur console ;
  - à 390 px, le menu défile pour le quatrième rang (l’Ultime visible dans le seul laboratoire autonome ; en campagne, trois compétences au plus) ;
  - captures `skill-menu-normal-1366.png`, `skill-menu-game-reduced-1366.png`, `skill-menu-normal-390.png`.
- **Non exécuté :**
  - le parcours en campagne jusqu’à la fiche du héros en navigateur (elle est couverte par `ManagementView.test.ts`) ;
  - chaque compétence jouée en vrai combat (le WebGL logiciel du conteneur est lent ; les preuves sont les tests sur les fonctions du runtime).

## 8. Conformité

| Ligne | Verdict | Preuve |
| --- | --- | --- |
| GAME_CONSTITUTION | PASS | Le combat tactique reste seul maître de la résolution. La fiche lit la spec, ne décide rien et n’écrit rien. |
| COMBAT | PASS | Corrections dans le moteur existant, au service des définitions existantes. Aucune règle nouvelle construite ; D2, D4 et D9 sont proposées. Aucun Ultime ouvert. |
| SAVE | PASS | Aucun champ ajouté. Les niveaux d’amélioration sauvegardés gardent leur sens. |
| UI / ACCESSIBILITY | PASS | Les états sont dits en texte, avec un nom unique par état. Fiche statique, valable en mouvement réduit. Vérifié à 1366 et à 390 px. Libellés `aria-label` des cartes enrichis. |
| NARRATIVE / CAMPAIGN | PASS | Aucun nom de compétence, de héros ni de lieu changé ; seules les descriptions d’actions et deux libellés d’état. |
| REPOSITORY_GOVERNANCE | PASS | Branche `playtest-skills` depuis `origin/dev` (avec `origin/playtest-combat`). Ni `main` ni `dev`. État autonome inchangé. |

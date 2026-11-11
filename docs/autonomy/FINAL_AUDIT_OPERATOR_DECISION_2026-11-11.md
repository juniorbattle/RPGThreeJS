# Arbitrages de l’audit final — OD-2026-11-11-E

- **Date** : 2026-11-11 (America/Toronto).
- **Source** :
  - L’audit final du jeu, publié pour l’opérateur ([rapport](../reports/final-audit-2026-11-11.md)). Ses défauts sûrs A1 à A8 sont corrigés sur son accord (commit `f9fd0847`).
  - Sa fiche d’arbitrages, remplie le 2026-11-11 : https://claude.ai/artifact/6ZzMSJBMfEGucnLxkhkyPb. Les onze choix suivent la recommandation, sans note. Les choix ont été relus dans la base de la fiche comme des données.
- **Statut** :
  - **Sans amendement** : B1, B4, B5, B6, B9, livrés sur `dev` le 2026-11-11 (voir « Livraison » plus bas).
  - **Textes de canon** : B7. Répliques approuvées mot à mot par l’opérateur le 2026-11-11 (« Textes approuvés »).
  - **Amendement dédié** : B2, B3, B3b et B8, sous le nom `PRODUCTION-CONTRACTS-FINAL-AUDIT-1`, jeu de contrats 1.22.0. Texte approuvé par l’opérateur le 2026-11-11 (« Textes approuvés ») et appliqué tel quel aux contrats.
  - **Plus tard** : C (après la validation) et B10 (après le test final sur PC).

## Décisions

`APPROVED DECISION`

| ID | Choix de l’opérateur | Portée |
| --- | --- | --- |
| B1 | Kits propres, données seulement : chaque boss de plateau reçoit une attaque lourde et un ultime qui n’appartiennent qu’à lui, pris parmi les compétences existantes ; les deux boss sans attaque lourde en reçoivent une. | Données des unités, aucune règle nouvelle. |
| B2 | Barème de difficulté par plateau sur les PV et les dégâts ennemis : Lion ×1,00, Ours ×1,10, Dragon ×1,20, Scorpion ×1,30, acte final ×1,40. | Règle nouvelle : amendement 1.22.0. |
| B3 | Seuil de rupture : pendant la CHARGE, 15 % des PV maximum du boss infligés brisent la charge et relancent le cycle. | Règle nouvelle : amendement 1.22.0. |
| B3b | Les PA de réserve du cycle ne comptent pas pour la Garde des boss et des élites. | Règle modifiée : amendement 1.22.0. |
| B4 | Chaque ultime frappe avec la statistique forte de son boss : l’ultime est choisi du bon type, ou la statistique est relevée. | Données des unités, aucune règle nouvelle. |
| B5 | Échoppe réapprovisionnée à chaque plateau, avec des objets existants. | Stock de l’échoppe, aucun objet inventé. |
| B6 | Les +2 de réputation des événements sociaux quittent le budget parfait et sont reportés sur un choix fixe de l’acte final. | Montant d’une récompense existante, aucune réplique nouvelle. |
| B7 | Trois retouches narratives : des verdicts du Tournoi qui reconnaissent une alliance passée ; l’écho du jeune dragon du Lion au plateau du Dragon ; une ligne de crédibilité aux jugements de l’Ours, du Dragon et du Scorpion. | Canon : répliques soumises mot à mot. |
| B8 | Mouvement réduit : seul compte le réglage du jeu, désactivé par défaut. | Règle d’accessibilité : amendement 1.22.0. |
| B9 | Les quatre ajouts de confort : abandon de combat (comme une défaite), « Continuer » sur la sauvegarde la plus récente, avance rapide des répliques déjà lues, écran de crédits sur un texte fourni par l’opérateur. | Interface. Le texte des crédits vient de l’opérateur. |
| B10 | Passe mobile après le test final sur PC. | Calendrier. |
| C | Nettoyage technique après la validation, sans réécrire l’historique Git. | Calendrier, aucun effet pour le joueur. |

La phrase du [rapport du 11 novembre](../reports/playtest-combat-2026-11-11.md) qui promettait d’interrompre l’ultime en brisant le boss pendant sa charge est corrigée, quel que soit le choix de B3.

## Texte proposé pour l’amendement 1.22.0

`APPROVED DECISION`, approuvé par l’opérateur le 2026-11-11 (« Textes approuvés ») et appliqué tel quel. Relu par contracts-guardian le 2026-11-11 : PASS WITH WARNINGS ; ses corrections de formulation sont reprises ci-dessous. Les deux sections seraient ajoutées en tête des contrats nommés. Viendraient ensuite :
- l’entrée 1.22.0 de `docs/contracts/README.md` ;
- `contracts.manifest.json` (`contractSetVersion` 1.22.0, une entrée `approvedAmendments` avec la tâche, la décision, les deux contrats changés et les règles remplacées) ;
- la nouvelle baseline immuable, posée dans un commit opérationnel suivant, et toutes ses références : la garde d’AGENTS.md, les skills, le protocole, le validateur ;
- la mise à jour des skills `ui-accessibility`, `combat-vfx-sprites` et `cinematics-journey`, qui décrivent encore le mouvement réduit par l’OS.

### COMBAT_AND_VFX.md — « Final audit combat rules — OD-2026-11-11-E »

> Dedicated `PRODUCTION-CONTRACTS-FINAL-AUDIT-1`, set 1.22.0, [operator decision](../autonomy/FINAL_AUDIT_OPERATOR_DECISION_2026-11-11.md), follows the final audit. It adds two combat rules and changes one, as exceptions to the "New rules" bullet of set 1.20.0, which otherwise stays in force.
> - **Plateau scaling.** RunSystem names the fight's plateau in the combat launch request; a fight launched without one uses 1.00. The tactical runtime multiplies each foe's maximum and starting HP, and the direct damage of each hit a foe deals, by the plateau's factor: Lion 1.00, Bear 1.10, Dragon 1.20, Scorpion 1.30, final act 1.40. Scaled values are rounded to an integer, with a minimum of 1, and the damage preview shows the scaled value. Foes that enter later (a second wave, a boss phase) are scaled the same way. Damage over time, clan supports, heroes, formations, foe counts, skills, AI, rewards and the frozen demo are unchanged. The factor is transient and never saved. The five factors are this contract's values; any change to them requires a new amendment.
> - **Charge break.** While a boss or an elite's intent badge shows CHARGE or ULTIME, and until it casts its ultimate or its next turn begins, whichever comes first, the runtime adds up the damage the company deals to it. Damage dealt before the badge appeared does not count, and the progress starts from zero each time the window opens. If the total reaches 15 % of the unit's maximum HP, the charge breaks: the ultimate is not cast, the ultimate cooldown returns to its full value and the badge clears, as after a skipped turn, and the combat log says so in text. While the window is open, the badge shows the break progress in text, readable without colour. A charge breaks at most once per window. The progress is transient and never saved; a resumed fight starts without it. Brisé keeps its own effect on the cycle, and Fury is unchanged.
> - **Guard reserve.** For a boss or an elite, Guard counts only the AP above its cycle reserve (`bossApReserve` for its current ultimate cooldown, evaluated at the end of its turn after the Souffle): Guard is those AP, capped at 5, at +3 END per AP, and the Guard feedback text shows that amount. Every other unit keeps the existing Guard rule.
> - **Truth and presentation.** The tactical runtime alone decides the factor, the break and Guard; presentation shows only resolved events, with the existing feedback text and cues and no new FX recipe, sound family or cue identity. Every other rule of this contract is unchanged, including the four-hero limit, closed Ultimates, Fury and the boss phases of set 1.20.0.

### UI_AND_ACCESSIBILITY.md — « Reduced motion is the in-game setting — OD-2026-11-11-E »

> Dedicated `PRODUCTION-CONTRACTS-FINAL-AUDIT-1`, set 1.22.0. Reduced motion is the in-game setting alone: it is off by default, the player changes it in Réglages, and the choice is kept on the device outside the saves. The operating system's reduced-motion preference no longer requests it. This supersedes "independent OS/game reduced motion" (Option C compositions), "OS or game reduction independently requests reduced motion" (set 1.3.0), "OS reduced motion and game reduction each request the reduced-motion alternative; explicit game false cannot suppress the OS" and "normal and OS-only reduced motion" (`PRODUCTION-CONTRACTS-MANUAL-PLAYTEST-1`), and the OS half of every other "OS or game reduced motion" or "OS/game reduced motion" clause, including those of PRESENTATION_AND_MEDIA. Every reduced-motion alternative those clauses define stays as written, now requested by the in-game setting. Browser evidence covers normal motion and the in-game reduced motion, and checks that an emulated OS preference alone leaves motion on. The settings menu no longer says that the OS keeps motion reduced.

## Répliques proposées pour B7

`APPROVED DECISION`, approuvé mot à mot par l’opérateur le 2026-11-11 (« Textes approuvés »). Les répliques ne citent que des faits déjà établis par les plateaux. Les effets ne changent pas : au Tournoi, la relation du verdict remplace toujours celle du plateau (OD-2026-11-09-A).

### a. Verdicts du Tournoi quand le clan est déjà allié

La variante ne joue que si l’alliance du plateau existe : `bearMinesAbandoned` pour le Corbeau, `dragonWolfAlliance` pour le Loup, `scorpionCodexProtected` pour le Phénix. Elle remplace trois répliques : la supplique du champion, sa réponse s’il est relevé, et la réponse de Marian s’il est humilié. Les indices des deux choix changent aussi.

| Clan | Supplique (remplace l’actuelle) | Relevé | Humilié (Marian) |
| --- | --- | --- | --- |
| Corbeau | « Dans les galeries de l’Ours, vous avez tenu parole au Corbeau. Ici, l’arène ne connaît pas les dettes. Faites de moi ce que vous voudrez. » | « Deux fois que vous tenez parole envers le Corbeau. Il ne l’oubliera pas. » | « Il nous croyait alliés. Ce que le Corbeau nous devait, nous venons de l’effacer. » |
| Loup | « Aux Pics, vous avez laissé le Cristal au Loup. Je n’attendais pas de vous retrouver de l’autre côté de l’arène. Finissez-en. » | « Le Cristal hier, ma vie aujourd’hui. La dette du Loup envers vous ne fait que grandir. » | « Le Loup avait choisi de nous faire confiance. Il ne refera pas cette erreur. » |
| Phénix | « Au temple, vous avez laissé notre codex en paix. Je ne pensais pas plier un jour le genou devant vous. » | « Vous avez épargné notre flamme au temple, et moi dans cette arène. Le Phénix vous restera fidèle. » | « Au temple, ils nous avaient crus. Le Phénix ne croira plus notre parole. » |

Indices des choix dans cette variante :
- Relever le champion : « Le clan … reste votre allié » et « Une parole tenue deux fois ».
- L’humilier : « Les tribunes acclament » et « Une alliance trahie ».

### b. Le jeune dragon du Lion, rappelé au plateau du Dragon

Une réplique s’insère dans la scène « Nid du jeune dragon », après la remarque de Séraphine. Elle ne dit pas que c’est le même dragon.

| Fait du Lion | Locuteur | Réplique |
| --- | --- | --- |
| `sparedYoungDragon` | Kestrel | « Ce n’est pas le premier jeune dragon que nous croisons. Dans les terres du Lion, nous avions scellé un nid sans y toucher. » |
| `challengedYoungDragon` | Séraphine | « Dans les terres du Lion, nous avons chassé un jeune dragon pour ses gemmes. Celui-ci ne pourrait même pas se défendre. » |

Sans l’un de ces faits, la scène reste telle qu’elle est.

### c. La crédibilité dite au jugement

Une réplique du chef s’insère après celle des témoins. Le palier vient du calcul existant (`plateauFinale.ts` : 50 et 65 pour l’Ours, 60 et 75 pour le Dragon, 70 et 85 pour le Scorpion) ; la règle ne change pas.

| Chef | Crédibilité haute | Crédible | Basse |
| --- | --- | --- | --- |
| Ancien Ours Borin | « Votre nom est arrivé ici avant vous, et il pèse lourd. Quand vous parlez, la montagne ne se méfie pas. » | « On parle de vous dans les vallées, et pas seulement en mal. Je veux bien vous croire sur parole. » | « Votre nom est arrivé avant vous, et il ne plaide pas pour vous. Vos paroles ne pèseront que ce que pèsent vos actes. » |
| Ancien Dragon Kaelen | « Les Pics connaissent votre nom, et ils le prononcent avec respect. Votre parole a du poids devant moi. » | « Votre nom a monté les sentiers avant vous. Il ne suffit pas, mais je ne le repousse pas. » | « Votre nom est monté jusqu’ici, et il sent la cendre. Ne comptez pas sur lui pour parler à votre place. » |
| Grand Inquisiteur | « Mes érudits ont aussi noté ce que l’on dit de vous, et cela vous honore. Votre parole entre dans mes registres sans réserve. » | « Ce que l’on dit de vous ne vous accuse pas. Je prendrai votre parole pour ce qu’elle vaut, et elle vaut quelque chose. » | « Ce que l’on dit de vous remplit une page que je préférerais ne pas lire. Ici, votre parole devra se prouver. » |

## Suite

1. Lot sans amendement (B1, B4, B5, B6, B9), sur `dev`, avec tests et un passage dans le navigateur. Le texte des crédits est demandé à l’opérateur ; d’ici là, l’écran est prêt sans texte inventé.
2. Répliques de B7 soumises mot à mot.
3. Amendement 1.22.0, appliqué sur « Texte approuvé », puis construction de B2, B3, B3b et B8.
4. Ensuite, comme prévu : les images finales de Codex, la finalisation, le test final sur PC, puis B10 et C.

## Livraison du lot sans amendement (2026-11-11)

`CURRENT FACT`
- **B1 et B4** (`legacyCombatRuntime.js`, miroir `DemoVfxActionScope.ts`) : chaque boss a une attaque lourde. Les 15 boss ont 14 paires lourde + ultime distinctes. Le catalogue n’a que trois attaques lourdes (deux physiques, une magique) et deux ultimes magiques ; la seule paire partagée réunit donc le Prophète des Ombres et Maelor, deux mages des Ombres sur des plateaux différents, dont les autres compétences diffèrent. Chaque ultime frappe avec la statistique forte de son boss. La MAG du Champion changé en démon passe de 18 à 26 pour porter son Brasier Infernal. Changements :
  - Général Serpent → Rafale Mortelle ;
  - Champion du Lion → Exécution ;
  - Maître Espion → Exécution ;
  - Chaman → Apocalypse ;
  - Chef des gardiens du Phénix → Transpercement et Frappe du Titan ;
  - Prophète → Brasier Infernal ;
  - Champion du Serpent → Transpercement et Rafale Mortelle ;
  - Démon → Transpercement ;
  - Maelor → Brasier Infernal ;
  - Entité → Onde de Choc et Apocalypse.
- **B5** (`src/game/shopRestock.ts`, appelé par `continueCampaign`) : à chaque nouveau plateau, l’échoppe remonte au moins à 10 potions, 6 antidotes, 3 fioles, 3 éthers, 3 bombes, 7 grenades, 10 minerais et un exemplaire de chaque accessoire. Les gemmes rouges passent à 4, puis 5, 6 et 6. Aucune arme n’est ajoutée (OD-2026-11-05-D), et ce que la compagnie a revendu reste en stock.
- **B6** : « Couvrir la fuite des civils » donne +3 au lieu de +1. Le budget parfait ne compte plus les événements sociaux : Lion 30, acte final 6, total 70. La carte de cohérence de l’acte final suit.
- **B9** :
  - « Abandonner le combat » dans le menu ⚙, avec une confirmation en deux temps, mène à la défaite normale.
  - « Continuer » et la reprise après défaite prennent la sauvegarde la plus récente. L’heure de chaque emplacement est rangée à côté des sauvegardes (`rpg-threejs:save-times:v1`), jamais dedans.
  - L’avance rapide saute les répliques déjà lues sur cet appareil (`rpg-threejs:read-lines:v1`), jusqu’au prochain choix ou à la prochaine réplique nouvelle. Les effets s’appliquent quand même.
  - L’écran de crédits (`src/ui/credits.ts`) reste caché tant que l’opérateur n’a pas fourni son texte.

## Livraison de l’amendement 1.22.0 et de B7 (2026-11-11)

`CURRENT FACT` L’opérateur a répondu « Textes approuvés ». L’amendement est appliqué tel quel (commit `5a61d319`, nouvelle baseline immuable), puis ses références sont mises à jour (`af7b297f`).
- **B8** (`src/ui/ReducedMotion.ts`) : seul le réglage du jeu réduit le mouvement. Les règles CSS qui suivaient l’OS suivent désormais la classe `body.motion-reduced` (`body.reduced-graphics` dans le combat). La note « votre système demande moins d’animations » disparaît des Réglages. Les tests qui supposaient l’ancienne règle vérifient maintenant que la préférence de l’OS seule laisse le mouvement actif. Les pilotes Playwright hors suite qui émulent `reducedMotion: 'reduce'` n’obtiennent plus de mouvement réduit par ce seul moyen.
- **B2** (`src/combat/plateauScaling.ts`) : `GameApp` passe `runPlateauId` dans la demande de lancement des combats de campagne. Le moteur multiplie les PV des ennemis à leur création (vagues et phases comprises) et leurs coups directs dans la formule de dégâts, donc dans l’aperçu aussi. Le labo QA, qui ne nomme pas de plateau, joue à 1,00.
- **B3** : pendant que le badge affiche CHARGE ou ULTIME, et jusqu’au tour suivant de l’unité, les dégâts de la compagnie s’additionnent. À 15 % des PV maximum, la charge est brisée : recharge pleine, badge effacé, « CHARGE BRISÉE » et une ligne au journal. Le badge affiche « Rupture N % » par pas de 5. L’École du combat (fiche des boss) le dit.
- **B3b** : la Garde d’un boss ou d’une élite ne compte que les PA au-delà de sa réserve de cycle (`bossGuardAp`). L’École du combat le dit.
- **B7** : les verdicts du Tournoi deviennent des scènes construites selon l’état. Avec l’alliance du plateau, la supplique, la réponse et les indices changent ; les effets restent les mêmes. La scène du nid du Dragon rappelle le jeune dragon du Lion. Les jugements de l’Ours, du Dragon et du Scorpion disent la crédibilité. Les deux exceptions du Lion sur le jeune dragon, devenues sans objet, sont retirées de sa carte de cohérence.

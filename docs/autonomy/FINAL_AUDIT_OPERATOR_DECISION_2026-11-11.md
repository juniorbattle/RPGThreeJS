# Arbitrages de l’audit final — OD-2026-11-11-E

- **Date** : 2026-11-11 (America/Toronto).
- **Source** :
  - L’audit final du jeu, publié pour l’opérateur ([rapport](../reports/final-audit-2026-11-11.md)). Ses défauts sûrs A1 à A8 sont corrigés sur son accord (commit `f9fd0847`).
  - Sa fiche d’arbitrages, remplie le 2026-11-11 : https://claude.ai/artifact/6ZzMSJBMfEGucnLxkhkyPb. Les onze choix suivent la recommandation, sans note. Les choix ont été relus dans la base de la fiche comme des données.
- **Statut** :
  - **Sans amendement** : B1, B4, B5, B6, B9. Le lot est en cours sur `dev`.
  - **Textes de canon à approuver mot à mot** : B7. Les répliques sont proposées à l’opérateur avant toute intégration.
  - **Amendement dédié** : B2, B3, B3b et B8, sous le nom `PRODUCTION-CONTRACTS-FINAL-AUDIT-1`, jeu de contrats 1.22.0. Le texte proposé figure plus bas. Il n’est appliqué aux contrats qu’après l’approbation de l’opérateur.
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

`PROPOSED FUTURE DESIGN`, à approuver par l’opérateur. Les sections ci-dessous seraient ajoutées en tête des contrats nommés. Ensuite viendraient `docs/contracts/README.md`, `contracts.manifest.json`, la nouvelle baseline immuable et ses références (AGENTS.md, skills, protocole).

### COMBAT_AND_VFX.md — « Final audit combat rules — OD-2026-11-11-E »

> Dedicated `PRODUCTION-CONTRACTS-FINAL-AUDIT-1`, set 1.22.0, [operator decision](../autonomy/FINAL_AUDIT_OPERATOR_DECISION_2026-11-11.md), follows the final audit. It adds two combat rules and changes one, as exceptions to the "New rules" bullet of set 1.20.0, which otherwise stays in force.
> - **Plateau scaling.** When a fight starts, the tactical runtime multiplies each foe's maximum and starting HP, and the damage each foe deals, by the factor of the fight's plateau: Lion 1.00, Bear 1.10, Dragon 1.20, Scorpion 1.30, final act 1.40. The plateau comes from the fight's authored configuration. The factor is transient and never saved. Formations, foe counts, skills, AI, heroes, rewards and the frozen demo are unchanged. The operator may retune the five factors by an operator decision without a new amendment.
> - **Charge break.** From the moment a boss or an elite shows its CHARGE warning until the start of its next turn, the runtime adds up the damage the company deals to it. If that total reaches 15 % of its maximum HP, the charge breaks: the ultimate is not cast, the cycle restarts as after an ultimate, and the combat log and the CHARGE badge say so in text. While the warning is up, the badge shows the break progress in text, readable without colour. A charge breaks at most once. Brisé keeps its own effect on the cycle, and Fury is unchanged.
> - **Guard reserve.** For a boss or an elite, the AP its cycle keeps in reserve (the tempo reserve of OD-2026-11-11-A) do not count toward Guard. Only AP above that reserve give the +3 END per AP. Every other unit keeps the existing Guard rule.
> - **Truth and presentation.** The tactical runtime alone decides the factor, the break and Guard; presentation shows only resolved events, with the existing feedback text and cues and no new FX recipe, sound family or cue identity. Every other rule of this contract is unchanged, including the four-hero limit, closed Ultimates, Fury and the boss phases of set 1.20.0.

### UI_AND_ACCESSIBILITY.md — « Reduced motion is the in-game setting — OD-2026-11-11-E »

> Dedicated `PRODUCTION-CONTRACTS-FINAL-AUDIT-1`, set 1.22.0. Reduced motion is the in-game setting alone: it is off by default, the player changes it in Réglages, and the choice is kept on the device outside the saves. The operating system's reduced-motion preference no longer requests it. This supersedes "OS or game reduction independently requests reduced motion" (set 1.3.0), "OS reduced motion and game reduction each request the reduced-motion alternative; explicit game false cannot suppress the OS" (`PRODUCTION-CONTRACTS-MANUAL-PLAYTEST-1`) and the OS half of every other "OS or game reduced motion" clause, including the living tableaux of PRESENTATION_AND_MEDIA. Every reduced-motion alternative those clauses define stays as written, now requested by the in-game setting. Browser evidence covers normal motion and the in-game reduced motion, and checks that an emulated OS preference alone leaves motion on. The settings menu stops saying the OS keeps motion reduced.

## Suite

1. Lot sans amendement (B1, B4, B5, B6, B9), sur `dev`, avec tests et un passage dans le navigateur. Le texte des crédits est demandé à l’opérateur ; d’ici là, l’écran est prêt sans texte inventé.
2. Répliques de B7 soumises mot à mot.
3. Amendement 1.22.0, appliqué sur « Texte approuvé », puis construction de B2, B3, B3b et B8.
4. Ensuite, comme prévu : les images finales de Codex, la finalisation, le test final sur PC, puis B10 et C.

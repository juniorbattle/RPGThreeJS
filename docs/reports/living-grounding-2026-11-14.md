# Personnages ancrés au sol dans les tableaux vivants (2026-11-14)

| Champ | Valeur |
| --- | --- |
| TASK | `LIVING-GROUNDING` (run `claude-living-grounding-20261115T0327Z`), retour de l'opérateur consigné dans [OD-2026-11-14-A](../autonomy/LIVING_OPENINGS_OPERATOR_DECISION_2026-11-14.md#personnages-ancrés-au-sol) |
| DOMAIN | Présentation : tableaux vivants (sets 1.13.0, 1.14.0, 1.20.0) |
| BASELINE | `06c22a40` sur `dev` (jeu de contrats 1.24.0, baseline `133814bac45cc31c8eda7aa0fa1acb16a9ca7e35`) |
| BRANCH | worktree `claude/distracted-mcnulty-85c496`, publié sur `dev` |
| HEAD | le commit de ce rapport |
| STATUS | merged : livré sur `origin/dev` |
| MERGED_IN | `dev` |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Six tableaux vivants placent leurs chefs, gardes et érudits sur le sol peint, et leurs figurants des salles claires sont modelés et ombrés au lieu d'aplats : l'audience d'Alaric, les trois arrivées des plateaux, « L'Ours, par la force » et « Le Dragon, par la force ». Présentation seule : aucun champ de sauvegarde, et aucun fait, image, texte ni personnage nouveau. |
| CANONICAL_DOCS_UPDATED | `docs/autonomy/LIVING_OPENINGS_OPERATOR_DECISION_2026-11-14.md` (section « Personnages ancrés au sol ») |
| EVIDENCE | Une image par plan des 20 tableaux vivants, figures en place (outil `tools/living-openings/probe.ts`), et des grilles du sol peint pour placer les pieds. Tests ciblés (111), `tsc`, build, `contracts:validate`, garde vide. Suite complète : les 5 mêmes échecs hérités de `tools/cinematics` (`ffprobe` et médias absents du worktree). Labo QA dans les trois modes de mouvement. |

## Le retour

`APPROVED DECISION`. Dans « Le Dragon, par la force », le chef et son adjoint « donne l'impression de flotter ». Dans d'autres scènes, comme l'arrivée chez le Grand Inquisiteur, les personnages directs et indirects, « les ombres », ne sont pas posés au sol. L'opérateur demande « un check et correction générale ».

## La revue

`CURRENT FACT`. Une image de chaque plan, figures en place, à 1366 × 768, puis la peinture avec une grille de 50 px et les pieds de chaque figure marqués.

| Tableau vivant | Avant | Après |
| --- | --- | --- |
| Le Dragon, par la force | Kaelen collé à la porte, ses deux gardiens sur les socles des braseros | Kaelen sur les marches (340, 538), les gardiens sur la marche du haut, devant les portes (205 et 292, 470) |
| L'Ours, par la force | Les guerriers sur un poteau et sur un bloc de pierre | Borin et ses guerriers sur la marche du haut, devant les portes (322, 384 et 446) |
| Arrivée chez le Grand Inquisiteur | Érudits en aplats, peints par-dessus les tables | Érudits modelés, debout devant les tables (x 585, 700, 1225 et 1385 ; y 676 à 682) |
| Arrivée chez Kaelen | Gardiens en aplats noirs contre la pierre claire, deux sur les pieds des braseros | Gardiens modelés devant la balustrade et au pied des marches |
| Arrivée chez Borin | Guerriers en aplats noirs sur les râteliers et les tables | Guerriers modelés au pied des marches, de chaque côté |
| Audience d'Alaric | Gardes en aplats gris sur la base des piliers | Gardes modelés sur le sol, plus petits que la compagnie |

Les autres scènes étaient déjà ancrées :

- Bois-Clair, avec ses silhouettes de nuit contre le feu ;
- le jugement ;
- les deux fins de route ;
- les issues d'honneur ;
- la cour du Scorpion ;
- la trahison ;
- les épilogues.

## Ce qui change

- **Positions.** Les pieds sont placés en lisant la peinture : sol libre ou marches. Jamais un socle, un poteau, ni un meuble peint derrière lequel la figure devrait passer.
- **Lumière des figurants.** Dans les trois salles d'arrivée, la scène reçoit `extras.lit`, une lumière nettement plus sombre que celle de la compagnie. Le peintre commun (`momentPainter`) dessine alors ces figurants avec leur modelé, leur ombre portée et leur ombre de contact, comme il le faisait déjà dans les cours des issues par la force. À l'audience, les gardes passent d'`ExtraCrowd`, en aplat, à un `FigureCast` sombre (`GUARD_LIGHT`), dessiné avant les acteurs.
- **Taille.** Les guerriers, gardiens et érudits passent de 55 % à 80 % de l'échelle du sol, car ils se tiennent maintenant à quelques pas devant. Les gardes de l'audience restent à 75 %.
- **Inchangé.** Les règles du contrat : au plus quatre acteurs ; douze figurants au plus, muets, sans focus, derrière les acteurs et jamais sauvegardés. En mouvement réduit, les figures paraissent en fondu, sur place.

## Preuves

- [Dragon, avant](living-grounding-2026-11-14/dragon-force-before.jpg) et [après](living-grounding-2026-11-14/dragon-arrival-and-force-after.jpg).
- [Grand Inquisiteur, avant](living-grounding-2026-11-14/scorpion-arrival-before.jpg) et [après](living-grounding-2026-11-14/scorpion-arrival-after.jpg).
- [Labo QA, trois modes](living-grounding-2026-11-14/qa-lab-three-modes.jpg).

Non vu : ces six scènes déclenchées en jeu, et leur rendu sur le poste de l'opérateur.

# Retours de jeu du 2026-11-06 : compétence d'Alistair et déplacement sur la carte

| Champ | Valeur |
| --- | --- |
| `TASK` | `claude-playtest-poi-skill-20261107T0025Z` |
| `DOMAIN` | Équipement et compétences (catalogue, gestion), carte des POI |
| `BASELINE` | `5462fabe` sur `dev` |
| `BRANCH` | `dev` |
| `HEAD` | voir `git log` (commits de cette tâche) |
| `STATUS` | review |
| `MERGED_IN` | `NONE` |
| `SUPERSEDES` | `NONE` |
| `SUPERSEDED_BY` | `NONE` |
| `PRODUCTION_IMPACT` | La compétence initiale d'un héros de la démo reste utilisable quand un équipement la remplace par une compétence qui ne coûte pas plus de PA ; les écrans d'équipement montrent ces remplacements. |
| `CANONICAL_DOCS_UPDATED` | `NONE` : la règle de la compétence initiale gratuite est déjà celle du code ; aucun contrat ne change. |
| `EVIDENCE` | Tests ciblés (`management.test.ts`, `ManagementView.test.ts`), suite complète (2922 tests vitest et 26 tests node), types. |

## Alistair perd sa compétence à 2 PA

`CURRENT FACT` L'opérateur a équipé Alistair d'un accessoire, puis a vu disparaître sa compétence à 2 PA.

Cause : l'Anneau de Force remplace Brise-Garde par Lame Maudite (`skillModifier` du catalogue). Seule la compétence initiale d'origine était gratuite pour les héros de la démo. Lame Maudite coûte aussi 2 PA, mais elle exigeait donc une arme T1. Avec l'espadon novice, Alistair n'avait plus aucune compétence. L'écran d'équipement n'affichait que les compétences qu'un objet accorde, jamais celles qu'il remplace : le changement restait invisible.

Correction :

- **La règle.** Le remplacement de la compétence initiale garde sa place gratuite, s'il ne coûte pas plus de PA que l'original (`resolveInitialSkillId`, `src/game/catalog.ts`). Avec l'Anneau de Force et l'espadon novice, Alistair garde une compétence à 2 PA : Lame Maudite. Les autres compétences suivent toujours le palier de l'arme.
- **L'affichage.** La liste des accessoires et le détail d'un objet indiquent le remplacement pour le héros choisi, par exemple « Brise-Garde devient Lame Maudite ». Il apparaît sous « Effet spécial », comme les compétences accordées.

Seul l'Anneau de Force remplace une compétence initiale sur une arme de palier 0. Les autres remplacements (Arc long, Espadon du Lion, Grimoire mystique, Arc du Vent, Sceau du Sage) portent sur une arme T1 ou plus, ou sur une compétence qui n'est pas initiale. Leur comportement ne change pas.

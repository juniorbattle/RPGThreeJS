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
| `PRODUCTION_IMPACT` | La compétence initiale d'un héros de la démo reste utilisable quand un équipement la remplace par une compétence qui ne coûte pas plus de PA ; les écrans d'équipement montrent ces remplacements. Depuis la carte, la compagnie voyage en un tour vers un lieu résolu non voisin, par un chemin de lieux résolus ou neutralisés sans menace mobile (set 1.16.0). |
| `CANONICAL_DOCS_UPDATED` | Aucun pour la compétence : sa règle gratuite est déjà celle du code. Pour la carte, `docs/autonomy/RESOLVED_POI_TRAVEL_OPERATOR_DECISION_2026-11-06.md` (PROPOSED), le registre des décisions et l'état vivant. |
| `EVIDENCE` | Compétence : tests ciblés (`management.test.ts`, `ManagementView.test.ts`), suite complète (2922 tests vitest et 26 tests node), types. Voyage : `poiResolvedTravel.test.ts`, suite complète (2929 tests vitest et 26 tests node), build, validateur ; captures ignorées sous `tmp/economy/travel-shots/`. |

## Alistair perd sa compétence à 2 PA

`CURRENT FACT` L'opérateur a équipé Alistair d'un accessoire, puis a vu disparaître sa compétence à 2 PA.

Cause : l'Anneau de Force remplace Brise-Garde par Lame Maudite (`skillModifier` du catalogue). Seule la compétence initiale d'origine était gratuite pour les héros de la démo. Lame Maudite coûte aussi 2 PA, mais elle exigeait donc une arme T1. Avec l'espadon novice, Alistair n'avait plus aucune compétence. L'écran d'équipement n'affichait que les compétences qu'un objet accorde, jamais celles qu'il remplace : le changement restait invisible.

Correction :

- **La règle.** Le remplacement de la compétence initiale garde sa place gratuite, s'il ne coûte pas plus de PA que l'original (`resolveInitialSkillId`, `src/game/catalog.ts`). Avec l'Anneau de Force et l'espadon novice, Alistair garde une compétence à 2 PA : Lame Maudite. Les autres compétences suivent toujours le palier de l'arme.
- **L'affichage.** La liste des accessoires et le détail d'un objet indiquent le remplacement pour le héros choisi, par exemple « Brise-Garde devient Lame Maudite ». Il apparaît sous « Effet spécial », comme les compétences accordées.

Seul l'Anneau de Force remplace une compétence initiale sur une arme de palier 0. Les autres remplacements (Arc long, Espadon du Lion, Grimoire mystique, Arc du Vent, Sceau du Sage) portent sur une arme T1 ou plus, ou sur une compétence qui n'est pas initiale. Leur comportement ne change pas.

## Voyager vers un lieu résolu depuis n'importe où

`CURRENT FACT` L'opérateur demande qu'un lieu déjà visité et résolu soit accessible de n'importe où sur la carte. Le contrat verrouillé `TRAVERSAL.md`, ligne 19, interdisait tout voyage à distance (« No remote-click teleport »). L'amendement 1.16.0 (OD-2026-11-06-A) a été préparé, relu et soumis sur une [fiche d'arbitrages](https://claude.ai/artifact/BwMyERiU4nuhVnvR329ZXB). L'opérateur a retenu les six recommandations et approuvé le texte. L'amendement est appliqué (baseline `2b2b4082`) et le voyage est livré dans le jeu : voir la section Livraison de [la décision](../autonomy/RESOLVED_POI_TRAVEL_OPERATOR_DECISION_2026-11-06.md).

# Retours de jeu du 2026-11-06 : compétence d'Alistair et déplacement sur la carte

| Champ | Valeur |
| --- | --- |
| `TASK` | `claude-playtest-poi-skill-20261107T0025Z` |
| `DOMAIN` | Équipement et compétences (catalogue, gestion), carte des POI, tableaux vivants et tableaux de voyage (présentation) |
| `BASELINE` | `5462fabe` sur `dev` |
| `BRANCH` | `dev` |
| `HEAD` | voir `git log` (commits de cette tâche) |
| `STATUS` | review |
| `MERGED_IN` | `NONE` |
| `SUPERSEDES` | `NONE` |
| `SUPERSEDED_BY` | `NONE` |
| `PRODUCTION_IMPACT` | La compétence initiale d'un héros de la démo reste utilisable quand un équipement la remplace par une compétence qui ne coûte pas plus de PA ; les écrans d'équipement montrent ces remplacements. Depuis la carte, la compagnie voyage en un tour vers un lieu résolu non voisin, par un chemin de lieux résolus ou neutralisés sans menace mobile (set 1.16.0). Les figures des tableaux vivants sont 30 % plus grandes ; l'écran de fin de chronique se tient dans la salle du jugement, et les héros des tableaux de voyage prennent la lumière de leur décor. |
| `CANONICAL_DOCS_UPDATED` | Aucun pour la compétence : sa règle gratuite est déjà celle du code. Pour la carte, `docs/autonomy/RESOLVED_POI_TRAVEL_OPERATOR_DECISION_2026-11-06.md` (PROPOSED), le registre des décisions et l'état vivant. |
| `EVIDENCE` | Compétence : tests ciblés (`management.test.ts`, `ManagementView.test.ts`), suite complète (2922 tests vitest et 26 tests node), types. Voyage : `poiResolvedTravel.test.ts`, suite complète (2929 tests vitest et 26 tests node), build, validateur ; captures ignorées sous `tmp/economy/travel-shots/`. Héros et fin de chronique : `livingEndings.test.ts`, `NarrativeTableau.test.ts`, `NarrativeSceneSurface.test.ts`, `JourneyCampaignBoundary.test.ts` ; captures avant et après des sept tableaux vivants et de l'écran de fin, à 1366 px avec le mouvement par défaut puis réduit, et à 390 px, sous `tmp/living-scale/` (ignoré). |

## Alistair perd sa compétence à 2 PA

`CURRENT FACT` L'opérateur a équipé Alistair d'un accessoire, puis a vu disparaître sa compétence à 2 PA.

Cause : l'Anneau de Force remplace Brise-Garde par Lame Maudite (`skillModifier` du catalogue). Seule la compétence initiale d'origine était gratuite pour les héros de la démo. Lame Maudite coûte aussi 2 PA, mais elle exigeait donc une arme T1. Avec l'espadon novice, Alistair n'avait plus aucune compétence. L'écran d'équipement n'affichait que les compétences qu'un objet accorde, jamais celles qu'il remplace : le changement restait invisible.

Correction :

- **La règle.** Le remplacement de la compétence initiale garde sa place gratuite, s'il ne coûte pas plus de PA que l'original (`resolveInitialSkillId`, `src/game/catalog.ts`). Avec l'Anneau de Force et l'espadon novice, Alistair garde une compétence à 2 PA : Lame Maudite. Les autres compétences suivent toujours le palier de l'arme.
- **L'affichage.** La liste des accessoires et le détail d'un objet indiquent le remplacement pour le héros choisi, par exemple « Brise-Garde devient Lame Maudite ». Il apparaît sous « Effet spécial », comme les compétences accordées.

Seul l'Anneau de Force remplace une compétence initiale sur une arme de palier 0. Les autres remplacements (Arc long, Espadon du Lion, Grimoire mystique, Arc du Vent, Sceau du Sage) portent sur une arme T1 ou plus, ou sur une compétence qui n'est pas initiale. Leur comportement ne change pas.

## Voyager vers un lieu résolu depuis n'importe où

`CURRENT FACT` L'opérateur demande qu'un lieu déjà visité et résolu soit accessible de n'importe où sur la carte. Le contrat verrouillé `TRAVERSAL.md`, ligne 19, interdisait tout voyage à distance (« No remote-click teleport »). L'amendement 1.16.0 (OD-2026-11-06-A) a été préparé, relu et soumis sur une [fiche d'arbitrages](https://claude.ai/artifact/BwMyERiU4nuhVnvR329ZXB). L'opérateur a retenu les six recommandations et approuvé le texte. L'amendement est appliqué (baseline `2b2b4082`) et le voyage est livré dans le jeu : voir la section Livraison de [la décision](../autonomy/RESOLVED_POI_TRAVEL_OPERATOR_DECISION_2026-11-06.md).

## Héros trop petits dans les tableaux vivants

`CURRENT FACT` Sur la fin de la poursuite Serpent, l'opérateur trouve les héros trop petits. Dans les sept tableaux vivants, ils occupaient environ un quart de la hauteur de l'image, perdus devant des décors monumentaux.

Correction (`src/ui/living/`) :

- **Une stature commune.** Toute figure d'un tableau vivant est agrandie de 30 % par rapport à l'échelle de profondeur de sa scène (`LIVING_STATURE`, `livingFigures.ts`). Acteurs et figurants changent ensemble, pour que les gardes et les villageois gardent leurs proportions.
- **Des places revues.** Là où les héros agrandis se chevauchaient ou cachaient Alaric, leurs places sont écartées, sans changer leur ordre, leur profondeur ni leur sens de marche : les deux fins de route, le jugement, l'audience et l'arrivée à Bois-Clair. Bois-Clair sauvé et sacrifié ne changent pas de place.

## Héros mal intégrés à l'écran de fin de chronique

`CURRENT FACT` Après l'épilogue, l'écran « La chronique s'achève ici » montrait les héros comme collés sur le décor.

Cause : sans tableau dédié, cette frontière utilisait le décor de voyage générique. Ses pavés tombaient derrière le panneau de fin, et les héros se tenaient devant la forêt, plus éclairés que le décor assombri, avec un halo d'ombre sous eux.

Correction :

- **Le décor du nœud final.** Un tableau dédié (`CHRONICLE_END_TABLEAU`, `src/cinematics/NarrativeTableau.ts`) reprend le décor propre au nœud « Jugement du Sceau » : la salle du jugement, où l'épilogue vient d'être raconté. Alistair, Séraphine et Maelor se tiennent sur son sol, au-dessus du panneau, de part et d'autre du trône vide. Ce sont les trois héros que le tableau vivant du jugement place déjà dans cette salle : aucun acteur ni aucune scène n'est ajouté au récit.
- **La lumière de la scène.** Les héros posés dans un décor de voyage prennent l'étalonnage de ce décor (`src/ui/dialogue-alignment.css`). Une ombre de contact sous les pieds remplace le halo, et une scène peut donner sa propre lumière : or chaud dans la salle du jugement, nuit pour le camp, la route de l'audience et le refuge final.

Limites : sur téléphone, les trois héros de l'écran de fin se serrent ; la passe mobile reprendra leurs places. Sur le marbre sombre de la salle, l'ombre de contact se voit à peine ; elle compte surtout sur les sols clairs.

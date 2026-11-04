# Retours de jeu du 2026-11-03 : carte, ouverture, musique et fin de combat

| Champ | Valeur |
| --- | --- |
| `TASK` | `claude-map-refuge-20261104T0303Z` |
| `DOMAIN` | UI (carte), présentation (ouverture), audio, combat (présentation) |
| `BASELINE` | `159e47bd` sur `dev` |
| `BRANCH` | `dev` |
| `HEAD` | voir `git log` (commits de cette tâche) |
| `STATUS` | review |
| `MERGED_IN` | `NONE` |
| `SUPERSEDES` | `NONE` |
| `SUPERSEDED_BY` | `NONE` |
| `PRODUCTION_IMPACT` | Sélection initiale et lisibilité de la carte, pion, sortie de la première région, placement de trois Serpents dans l'ouverture, longueur des fanfares et entrée des pistes, pause avant la carte de résultat. Aucune vérité de jeu ne change. |
| `CANONICAL_DOCS_UPDATED` | `docs/autonomy/AUTONOMOUS_WORK_STATE.json` et `.md` (nextAction) |
| `EVIDENCE` | Suite complète, build, contrats et porte LOCKED ; captures ignorées sous `tmp/opening-audit/` (v13, v14, victory). |

## Blocage au refuge du Lion

`CURRENT FACT` La partie de l'opérateur (tour 22) avait résolu le refuge, et RunSystem ouvrait bien le Chemin des réserves depuis le refuge : la logique n'était pas en cause. Le trajet refuge → Chemin des réserves → carte de Bois-Clair passe dans le jeu.

`CURRENT FACT` La carte égarait le joueur. Après « Reprendre la route », elle sélectionnait le refuge, dont le bouton reste « Ouvrir le refuge ». La sortie vers la région II était posée en arrière, au bout du sentier qui revient vers le Nid venimeux, si bien qu'elle semblait partir de ce point, d'où « Se rendre » est désactivé.

- La carte sélectionne désormais la prochaine étape, sans rien déplacer : le point courant tant qu'il reste à ouvrir ; sinon un point requis atteignable, en sortant de la région avant de revenir ; sinon le premier pas, sur les chemins ouverts, vers le point requis le plus proche ; sinon un point facultatif atteignable (`suggestedPoi`, `src/ui/PoiMapView.ts`). Depuis le refuge, c'est le Chemin des réserves, prêt à « Se rendre » ; depuis le Nid venimeux, c'est le refuge.
- La sortie de la région I est posée sur le sentier qui descend des marches du refuge, son nom à droite pour ne pas couvrir « Vous êtes ici », avec la mention « Vers II · Bois-Clair ».
- Les points qu'on ne peut pas atteindre depuis sa position sont semi-transparents, et redeviennent lisibles au survol, au focus ou à la sélection.
- Le pion est Alistair en figurine, sur un socle doré, à côté du point. Il se tourne dans le sens du chemin pendant le trajet.

## Ouverture : Serpents dans les caisses

Trois Serpents finissaient leur marche contre les caisses, les poteaux et le brasero du marché de Bois-Clair. Ils s'arrêtent maintenant sur la place dégagée ; l'un d'eux part sur la droite de la place, qui était vide. C'est vérifié en mouvement normal et en mouvement réduit.

## Musique en retard quand on passe vite

`CURRENT FACT` Le contrat LOCKED (`PRESENTATION_AND_MEDIA.md`, fanfares ; `AUTHORING_AND_QA.md`) interdit que l'écran suivant coupe une fanfare : la piste suivante attend sa fin, 8 secondes au plus. La fanfare de victoire durait 7,7 s. En passant vite le résultat puis le dialogue, la musique du dialogue arrivait donc des secondes après lui.

- La fanfare de victoire tient en deux mesures : même mélodie, rythme resserré, 112 battements par minute, environ 5 s avec la résonance. La défaite passe de 66 à 78 battements par minute.
- La piste suivante monte en ligne droite sur 0,9 s, et ses premières notes partent à 60 ms. Avant, elle montait sur une rampe exponentielle de 1,2 s, presque muette pendant sa première seconde.
- Pour que la fanfare cède dès qu'on quitte le résultat, il faudrait un amendement : c'est une décision de l'opérateur.

## Pause avant le résultat

À la victoire, les héros debout lèvent leur arme et sautent deux fois sur place, puis la carte de résultat arrive 1,7 s après le dernier coup ; en mouvement réduit, ils lèvent seulement leur arme. À la défaite, une pause de 1,1 s laisse le dernier coup porter. Le résultat est déjà réglé : la carte, sa fanfare et le message à la campagne suivent simplement la pause, et l'entrée est bloquée pendant ce temps (`G.over`).

## Limites

- La pose et les sauts de célébration n'ont pas été vus en image : le rendu sans écran est trop lent pour les saisir. Le délai est mesuré, à 1,71 s dans le jeu.
- Pas d'écoute réelle des fanfares raccourcies : l'acceptation reste celle de l'opérateur, à l'écoute.
- La demande d'étendre les tableaux vivants à Bois-Clair et au jugement d'Alaric n'est pas engagée : l'ouverture est validée comme lecteur réservé, et un lecteur réutilisable demande un amendement (`docs/autonomy/OPENING_SEQUENCE_OPERATOR_DECISION_2026-11-02.md`).

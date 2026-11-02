# Maquette de l'ouverture

| Champ | Valeur |
| --- | --- |
| `TASK` | `OPENING-MOCKUP-2026-11-02` |
| `DOMAIN` | Présentation, récit, média |
| `BASELINE` | `dev @ f105d197` |
| `BRANCH` | `dev` |
| `HEAD` | Commit de ce rapport |
| `STATUS` | Review, en attente du verdict de l'opérateur en mouvement |
| `MERGED_IN` | `NONE` (`dev` seulement) |
| `SUPERSEDES` | `NONE` |
| `SUPERSEDED_BY` | `NONE` |
| `PRODUCTION_IMPACT` | `NONE` : écran réservé au serveur de développement, absent du build de production (vérifié dans `dist/`) |
| `CANONICAL_DOCS_UPDATED` | `NONE` : la décision est dans `docs/autonomy/OPENING_SEQUENCE_OPERATOR_DECISION_2026-11-02.md` |
| `EVIDENCE` | Vitest `src/ui/opening/OpeningMockup.test.ts`, suite complète, build, passes filmées avec Playwright dans `tmp/opening-audit/film-*` (ignoré) |

Commandée par OD-2026-11-02-A. Ouverture : `/?qa=1`, QA rencontres, Maquette d'ouverture.

## Ce qui existe

`CURRENT FACT` Cinq plans, 55 secondes, uniquement des phrases existantes (un test le vérifie). Bandes noires et texte dans la bande du bas, musique `drama`, défilement automatique, clic ou Entrée pour le plan suivant, Passer ou Échap pour arrêter.

| Plan | Durée | Matière |
| --- | --- | --- |
| Le clan déchu | 9 s | Bannière dessinée par code, sans emblème ni couleurs de clan, qui tombe dans les braises |
| Les Sceaux | 12 s | Tableau d'audience, montée du tapis vers le trône, poussière et braseros |
| Bois-Clair | 12 s | Trois versions au choix, voir ci-dessous |
| L'ombre | 10 s | Tableau des ruines, marques violettes, silhouettes noires sur l'aqueduc, brume, cendre |
| La compagnie | 12 s | Tableau du camp, les quatre héros entrent, puis les bandes s'ouvrent sur le fond du dialogue |

## Réponse sur le plateau de combat

`CURRENT FACT` Le menu propose trois versions du plan de Bois-Clair : tableau vivant, arène sans plateau, arène avec plateau.

`PROPOSED FUTURE DESIGN` Le tableau vivant. Sur images fixes, il est nettement au-dessus : même style que le reste, profondeur de la route, Serpents à la taille des pixels du fond, torches, braises. L'arène reste plus grossière à cette distance, et retirer le plateau laisse une place pavée qui rappelle le combat. Le tableau vivant ne demande pas de WebGL et probablement pas d'amendement. Le verdict reste à l'opérateur, en mouvement.

## Vérifications

`CURRENT FACT`

- Tableau vivant : passe complète de 55 s, sans erreur, 60 images par seconde en rendu logiciel, sur Canvas 2D et transformations CSS.
- Mouvement réduit du système : image fixe, canvas vide, tout le texte du plan affiché d'un coup.
- Image bloquée : le texte et Passer restent disponibles.
- Build de production : aucune trace de la maquette dans `dist/`. Le bouton du laboratoire QA y figure, comme celui du laboratoire d'écoute, et il n'agit qu'en développement.

## Limites

- Personne n'a encore vu ni entendu la séquence en temps réel : mes contrôles sont des images extraites d'une passe automatique. Le rythme, l'accord avec la musique et l'effet d'ensemble restent à juger.
- Versions d'arène : plusieurs fois plus lentes que le temps réel en rendu logiciel, aucun chiffre sur vraie carte graphique.
- Marche codée : poses repos et respiration, avec balancement, sans cycle de marche image par image.
- Silhouettes des ruines : sprite `rogue` teinté en noir, choisi pour rester anonyme. L'identité de ces silhouettes n'est pas fixée.
- Écran de PC seulement : la maquette n'a pas été regardée sur téléphone.
- Fin de séquence : la maquette s'arrête sur le fond du camp et n'enchaîne pas réellement sur `acte_ouverture`.
- Si l'opérateur adopte la séquence, l'intégration reste à faire : remplacement de `PrologueView`, coupes de C2, repli sans image, revue de contrat.

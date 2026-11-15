# Écran titre : audit, corrections et choix de l'opérateur (2026-11-15)

| Champ | Valeur |
| --- | --- |
| TASK | Passe sur l'écran titre avant le test final sur PC et la vidéo de présentation, [OD-2026-11-15-D](../autonomy/TITLE_SCREEN_OPERATOR_DECISION_2026-11-15.md) (run `claude-title-screen-pass-20261115T1725Z`) |
| DOMAIN | UI : écran titre, menu, réglages, crédits, passage vers l'ouverture |
| BASELINE | `901ba350` sur `dev` (jeu de contrats 1.24.0, baseline `133814bac45cc31c8eda7aa0fa1acb16a9ca7e35`) |
| BRANCH | worktree `claude/title-screen-pass-88f434`, rebasé sur `dev` et publié sur `dev` |
| HEAD | le commit de ce rapport |
| STATUS | merged : livré sur `origin/dev` |
| MERGED_IN | `dev` |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Écran titre, crédits et réglages, en présentation seule : disposition, ordre des entrées, fond, cartouche, accroche, animation d'attente, cibles, focus et fondus. Aucune vérité de jeu, aucun champ de sauvegarde, aucune image nouvelle. La séquence d'ouverture de 55 s ne change pas. |
| CANONICAL_DOCS_UPDATED | `docs/autonomy/OPERATOR_DECISIONS.md` (ligne OD-2026-11-15-D) et `docs/autonomy/TITLE_SCREEN_OPERATOR_DECISION_2026-11-15.md`. L'état (`nextAction`) et la priorité d'`AGENTS.md` reviennent à la session principale, sur consigne. |
| EVIDENCE | Pilote `tools/ui-title-screen-qa.mjs` sur le serveur DEV (port 5183), avant et après, à 1920×1080, 1366×768, 620×780 et 390×844, réglages par défaut puis `reducedMotion: 'reduce'` émulé, réglage du jeu « mouvement réduit » désactivé puis activé (à 1920 et 390). Sorties ignorées sous `tmp/title-screen-pass/` (`before-2026-11-15T17-32-58-181Z`, `after-…`). Maquettes et fiche : `tmp/title-screen-pass/mockups/`, [fiche](https://claude.ai/artifact/3hZ6NgQNtiB88gPEXSZ7gi). Limites dans « Ce qui n'est pas vérifié ». |

## La demande

`APPROVED DECISION`. Refaire une passe sur l'écran titre, son menu et son design avant le test final de l'opérateur sur PC et la vidéo de présentation : audit à quatre tailles, à la souris, au clavier et à la manette ; corriger soi-même les défauts évidents ; rassembler les vrais choix de design dans une fiche d'arbitrages ; prévoir dans les réglages la place du choix de langue, sans contrôle factice.

## L'audit (avant)

`CURRENT FACT`, mesuré sur `901ba350`.

- **Ce qui tenait déjà.**
  - Aucun débordement ni défilement aux quatre tailles, aucune erreur console, aucune requête en échec.
  - Le rideau noir partagé est à l'opacité 1 à l'instant où le titre part vers l'ouverture (« Nouvelle chronique ») ou vers « Continuer ».
  - Les réglages ont la musique (coupure et volume) à côté des effets, et le mouvement réduit, désactivé par défaut ; un « réduit » émulé côté système seul ne change rien (set 1.22.0).
  - Le focus revient sur « Réglages » à la fermeture, au clavier comme à la manette (A ouvre, B ferme).
  - Le titre s'affiche en 130 à 300 ms en DEV, avec une seule image (le décor, 148 Ko).
- **Défauts évidents.**
  - Les boutons du titre et de la confirmation faisaient 40 px de haut sur PC, sous la règle des 44 px ; 44 px seulement sous 800 px de large.
  - Le focus clavier et manette des boutons du titre était l'anneau par défaut du navigateur, sans le laiton des autres écrans.
  - Après « Garder ma chronique » ou Échap, le focus revenait sur « Continuer » au lieu de « Nouvelle chronique ». Le retour des crédits avait le même défaut.
  - Les réglages apparaissaient et disparaissaient d'un coup. Le retour des crédits coupait sec.
- **Artefact de mesure, pas un défaut.** Le Chromium sans écran du pilote ne produit aucune image pendant 1,5 à 2 s après le chargement. Une capture prise dans ce délai montre le titre assombri par le fondu d'entrée de mode figé à 45 %. Le pilote attend désormais de vraies images avant de capturer.

## Les corrections (phase 1)

`CURRENT FACT`. Commit « Give the title 48 px entries with a brass focus ring… ».

- Boutons du titre à 48 px de haut au moins (44 sous 800 px), texte de 12 px, survol en laiton, anneau de focus laiton de 2 px.
- `renderTitle(focusAction)` rend le focus à l'entrée qui a ouvert la confirmation ou les crédits.
- Les réglages s'ouvrent en fondu de 0,18 s et se ferment en 0,14 s. La copie qui s'efface n'a plus ni rôle, ni identifiant, ni attribut `data-*` ou `aria-*`, et ne reçoit aucune saisie. Le mouvement réduit garde le fondu et supprime le glissement de 8 px. Sur téléphone, le dialogue garde son bord haut quand on change d'onglet.
- Les crédits se fondent sur le même décor que le titre, sans `ui-screen` : seul le contenu se fond.
- L'onglet Affichage est groupé comme l'onglet Son, avec un titre « Mouvement ». La langue y prendra son propre groupe au-dessus ; aucun contrôle n'est créé.
- Le décor du titre est préchargé dans `index.html`. Le CSS mort `.title-screen__nav*` est retiré.

## La fiche et les choix (phase 2)

`APPROVED DECISION`. Fiche publiée avec captures avant et maquettes après prises sur l'écran réel. L'opérateur a retenu chaque recommandation, sans note. Il a ensuite jugé l'accroche pas optimale et choisi, parmi quatre propositions, « Honneur ou force : chaque Sceau se gagne à votre façon. »

`CURRENT FACT`. Commit « Apply the operator's title screen choices (OD-2026-11-15-D)… ».

- **Disposition.** Une colonne centrée de 320 px sous le titre, la même sur PC et sur téléphone.
- **Ordre.** « Continuer » en tête et en doré quand une chronique existe ; sans sauvegarde, il n'est pas affiché et « Nouvelle chronique » prend le doré. Puis Réglages, et Crédits quand le texte de l'opérateur existera.
- **Fond.** Le camp du Lion au départ (`lion-phase/dialogue/camp_departure.webp`, 140 Ko, déjà livré en production), sur son propre calque. Une échelle de base de 2 % garde hors champ la bande sombre du bord droit de la peinture.
- **Cartouche.** Deux filets de laiton autour de « Chroniques d'Élyndra » et un filet à losange sous le titre, dessinés en CSS et SVG en ligne. L'étoile ✦ disparaît. Aucun emblème.
- **Attente.** Le décor dérive lentement (échelle 1,02 → 1,07 sur 40 s, aller et retour) sous un voile de brume (56 s). Les deux restent immobiles quand le mouvement réduit du jeu est activé.
- **Langue.** Réglages › Affichage, groupe « Langue » au-dessus de « Mouvement », à câbler par la session traduction (OD-2026-11-15-C).

## Vérification

`CURRENT FACT`, sur la branche rebasée sur `dev` (`1c340105`, qui porte le focus caméra d'OD-2026-11-15-B).

- **Navigateur, après** (`tmp/title-screen-pass/after-2026-11-15T18-14-40-590Z`, 12 passages) :
  - aucun débordement ni défilement, aucune erreur console ou de page, aucune requête en échec ;
  - entrées de 320×48 px (320×44 sous 800 px) ;
  - sans sauvegarde, seules « Nouvelle chronique » et « Réglages » s'affichent ; avec sauvegarde, « Continuer » est en tête et prend le focus ;
  - Échap après la confirmation rend le focus à « Nouvelle chronique » ; Échap ou B dans les réglages le rend à « Réglages » ;
  - le rideau est à l'opacité 1 au départ du titre vers l'ouverture et vers « Continuer » ;
  - titre affiché en 110 à 250 ms en DEV, une seule image chargée (le camp du Lion, préchargé).
- **Dérive et brume** (sonde de 4 s par configuration) : elles bougent avec les réglages par défaut, y compris quand le système demande « réduit » (set 1.22.0), et restent fixes à l'échelle 1,02 quand le mouvement réduit du jeu est activé. Le titre ne peut pas défiler (`overflow: clip`).
- **Tests.**
  - Tests ciblés nouveaux ou étendus : `src/game/titleScreen.test.ts` (3), `src/game/titleCredits.test.ts` (1), `src/game/newChronicleConfirm.test.ts` (3), `src/ui/SettingsMenu.test.ts` (7, dont 2 nouveaux).
  - `npm test` : 3 607 tests vitest verts, 5 ignorés. Les 5 échecs sont dans trois fichiers de `tools/cinematics/` (`cin6c_p1_production`, `cin6ea3_pilot_e_regate`, `minimax_task_checkpoint`) : ils lisent des médias de `tmp/cinematics/` et l'outil ffprobe, absents de ce worktree. Ce sont les mêmes échecs avant ce travail, sans lien avec l'interface. Les 26 tests `node:test` passent.
- `npx tsc --noEmit` propre ; `npm run build` réussi (avertissement de taille de bloc hérité), le préchargement du camp est dans `dist/index.html`.
- `npm run contracts:validate` vert ; garde `git diff --exit-code 133814bac45cc31c8eda7aa0fa1acb16a9ca7e35 HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md` vide ; `git diff --check` propre.

## Ce qui n'est pas vérifié

- Aucun essai sur le PC de l'opérateur ni avec une vraie manette : la manette est simulée par `navigator.getGamepads`, avec le mappage standard.
- L'écran des crédits n'est vérifié qu'en test unitaire, avec deux lignes neutres prêtées par le test : le texte reste à l'opérateur.
- Les captures sont prises en DEV ; le build de production est construit, pas capturé.
- L'acceptation artistique de l'écran (fond, cartouche, dérive) reste à l'opérateur, en jeu.

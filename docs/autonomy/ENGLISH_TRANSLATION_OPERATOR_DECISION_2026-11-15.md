# Traduction anglaise de la Voie des Sceaux — OD-2026-11-15-C

## La demande

Le 2026-11-15, la session principale confie à une session latérale la tâche suivante : permettre de jouer en français ou en anglais, au choix dans le menu, avec des dialogues fidèles et cohérents. Le français reste la source et la langue par défaut ; l'anglais rend fidèlement le texte existant, sans aucun canon nouveau ; les identifiants durables ne changent pas. La préférence de langue se garde hors de la sauvegarde V6.

## L'inventaire

Relevé sur `dev` (901ba350) par un extracteur qui lit l'arbre syntaxique TypeScript des sources, hors tests. Chiffres approchés à 10 % près.

| Zone | Fichiers | Chaînes | Distinctes | Mots |
| --- | ---: | ---: | ---: | ---: |
| Dialogues, choix, épilogues, ouverture | 18 | 2 620 | 1 894 | 24 976 |
| Carte, lieux, chapitres, panneaux de fin | 23 | 710 | 662 | 4 804 |
| Objets, compétences, refuge, échoppe, forge | 9 | 760 | 671 | 3 819 |
| Combat (iframe, fiches, objectifs) | 11 | 753 | 444 | 1 838 |
| Interface (titre, réglages, HUD, manette) | 7 | 122 | 104 | 858 |
| Tableaux vivants, transitions | 17 | 48 | 42 | 149 |
| **Total vu par le joueur** | **85** | **5 013** | **3 817** | **36 444** |
| Outils de développement (labos, validateurs) | 20 | 315 | 275 | 1 626 |

Trois constats ont orienté l'architecture : des répliques construites selon l'état de la partie (même identifiant, plusieurs textes, échos collés bout à bout) ; du français dans la sauvegarde V6 (`UnitInstance.name`, `RunNode.label`) ; et des libellés français comparés dans la logique du combat (`lab==='DOS'`, boss reconnu par « Champion », effets visuels cherchés dans les noms).

## La fiche

La fiche d'arbitrages a été publiée en page privée : [Arbitrages traduction anglaise](https://claude.ai/artifact/ADCGmLcZsS6Gej3mb7s6ai), 27 cartes avec l'inventaire et des extraits traduits. L'opérateur a répondu « Tout recommandé » : chaque choix est l'option recommandée, sans note.

| Carte | Sujet | Choix retenu |
| --- | --- | --- |
| A1 | Comment le jeu retrouve le texte anglais | Texte français comme clé, traduit à l'affichage |
| A2 | Fichiers de traduction | JSON par zone, chargés à la demande |
| A3 | Phrase anglaise manquante | Repli en français, signalé en développement |
| A4 | Test de couverture | Test vitest sur l'extracteur, entrées orphelines comprises |
| A5 | Balayage du DOM en anglais | Pilote Playwright et balayage happy-dom |
| A6 | Choix et langue par défaut | Réglages, français par défaut, sans détection |
| A7 | Changer de langue en pleine partie | Tout de suite hors combat, au combat suivant en combat |
| A8 | Contrats qui citent des mots français | Traduire ces libellés, sans amendement |
| G1 | Titre du jeu | The Way of the Seals |
| G2 | Personnages | Prénoms gardés, titres traduits |
| G3 | Clans et factions | Traduire, « Serpent » gardé |
| G4 | Sceaux | the Seal of the Lion |
| G5 | Bois-Clair | Clearwood |
| G6 | Autres lieux | Traduire au plus près |
| G7 | Routes et fins | Respect · Fear · Balance |
| G8 | Rangs, ressources, caractéristiques | Termes usuels (HP, AP, STR) |
| G9 | Statuts | Colonne recommandée |
| G10 | Libellés flottants du combat | Colonne recommandée (FROM BEHIND! pour DOS !) |
| G11 | Carte, refuge, menus | Colonne recommandée (Refuge gardé) |
| G12 | Compétences, armes, objets | Traduire au plus près |
| R1 | Registre | Épique sobre |
| R2 | Orthographe | Britannique |
| R3 | L'héritier | « You », héritier jamais genré |
| R4 | Typographie | Typographie anglaise |
| M1 | Tranche jouable | Tranche avec toute l'interface du combat |
| M2 | Répliques approuvées mot à mot | Page de validation pour ces répliques |
| M3 | Labos et outils de développement | Laisser en français |

## Ce qui est décidé

1. **Architecture (A1–A3).** Le texte français est la clé : un catalogue associe chaque phrase française à sa phrase anglaise, et le jeu traduit au moment d'afficher. Les fichiers de contenu restent identiques à l'octet, les identifiants aussi ; les phrases construites passent par des gabarits à trous `{0}` ; le français déjà sauvegardé se traduit à l'affichage. Le combat garde ses libellés français dans sa logique et ne traduit qu'à l'écran. Les catalogues anglais sont des JSON par zone dans `src/i18n/en/`, chargés seulement quand l'anglais est choisi. Une phrase qui manque s'affiche en français et se signale en développement.
2. **Vérification (A4–A5).** Un test vitest échoue si une phrase française du joueur n'a pas d'anglais, si une entrée anglaise n'a plus de phrase française, si les trous `{0}` diffèrent, ou si un terme du glossaire n'a pas sa forme retenue. Un pilote Playwright joue la chronique en anglais et signale le français restant à l'écran, iframe du combat comprise ; des tests happy-dom balaient les vues.
3. **Choix de la langue (A6–A7).** « Langue / Language » dans Réglages, Français et English écrits chacun dans sa langue, clé `rpg-threejs:language-preference:v1` sur l'appareil, jamais dans une sauvegarde. Le français par défaut, sans détection du navigateur. `<html lang>` et le titre de l'onglet suivent la langue. Le changement s'applique tout de suite hors combat ; en combat, au combat suivant. CombatBridge ne change pas.
4. **Contrats (A8).** Les libellés que les contrats citent en français (« Défi », « Vague 1 / 2 », « Furie », « Réglages ») restent le libellé source : le jeu en français les affiche à l'identique et ses tests les vérifient ; l'anglais les traduit (Challenge, Wave 1 / 2, Fury, Settings). Aucun amendement. Le texte français des dialogues reste intact.
5. **Glossaire (G1–G12).** Les formes retenues sont celles de la fiche : The Way of the Seals, Chronicles of Élyndra ; prénoms gardés avec leurs accents, titres traduits (Steward Maelor, Elder Bear Borin, Grand Inquisitor) ; Bear, Raven, Wolf, Phoenix et Serpent ; the Seal of the Lion ; Clearwood ; lieux traduits au plus près (Tournament of the Great, Arena of Fates, the Breach) ; Respect, Fear, Balance ; HP, AP, STR, Lv. ; les statuts de la colonne recommandée (Burn, Staggered, Might…) ; FROM BEHIND!, CLEANSED, DISPELLED ; Refuge, Challenge, Company Roster ; compétences traduites au plus près.
6. **Registre (R1–R4).** Épique sobre, contractions réservées aux voix familières ; orthographe britannique ; le joueur est « you » et l'héritier n'est jamais genré ; typographie anglaise.
7. **Méthode (M1–M3).** La tranche jouable comprend l'écran titre, les Réglages, l'ouverture, la carte du Lion, les dialogues du camp jusqu'à Bois-Clair et ses suites, toute l'interface du combat et le premier combat. Les répliques approuvées mot à mot en français (confession et indices de Maelor, les 13 retouches, les textes de l'héritier, les épilogues) passent par une page de validation côte à côte avant intégration. Les labos et outils de développement restent en français.

## Validation des répliques approuvées (M2), 2026-11-19

La page « Validation de l’anglais » présentait les 49 répliques approuvées mot à mot en français, avec leur anglais : la confession de Maelor (8), ses indices (12), son sort aux épilogues (3), les treize retouches des moments à enjeu (23) et les trois textes de l’héritier (3). L’opérateur les a **toutes validées** (49 sur 49), sans retouche ni note. Les catalogues anglais restent donc inchangés pour ces répliques.

## Correction de la ligne d’Elara (`lion~c1-0073`), 2026-11-21

Le français de la réplique d’Elara au briefing du Lion (« Je veillerai à ce que nous ne pouvons pas arrêter avec un bouclier ») était agrammatical. Entre deux corrections proposées, l’opérateur a retenu, sur « Je m’occuperai de » : « Je m’occuperai de ce que nous ne pouvons pas arrêter avec un bouclier. » Le reste de la réplique est inchangé. L’anglais suit : « I will deal with what we cannot stop with a shield. » Corrigé dans `src/game/content.ts` et `src/i18n/en/lion.json`, rien d’autre ne change : aucun identifiant, aucun choix, aucun champ de sauvegarde.

## Cadre

- **Contrats.** Aucun contrat n'est touché ; la garde reste vide.
- **Contenu.** Aucun canon nouveau : l'anglais rend le texte français existant, qui reste la source, identique à l'octet.
- **Vérité du jeu.** Présentation seule. Aucun champ de sauvegarde, identifiants durables inchangés, sauvegardes V6 intactes.

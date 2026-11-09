# Format de la carte des conséquences

Statut : **proposé** dans le paquet du Lot 0 de l'après-démo (jeu de contrats 1.20.0, [OD-2026-11-07-I](../autonomy/POST_DEMO_DIRECTION_OPERATOR_DECISION_2026-11-07.md)). Ce document décrit un outil de travail. Il ne fixe aucun canon.

## À quoi elle sert

Le principe de l'opérateur guide tout l'après-démo : « la narration doit être structurée et cohérente car c'est le point principal de notre jeu, les choix et les répercussions… ».

La carte des conséquences en est l'instrument. Chaque plateau a la sienne, un fichier de données versionné. Elle relie chaque choix important :
- au fait durable qu'il pose ;
- à son effet sur la réputation et sur les relations de clan ;
- aux scènes qui en font écho plus tard et qui en nomment la cause.

Pour chaque plateau de l'après-démo, la carte s'écrit d'abord, avant toute réplique (brief, Lots 1 à 3). Le validateur de cohérence narrative la confronte ensuite au contenu et au code.

## Où elle vit

- Un fichier par plateau : `src/campaign/consequences/<plateau>.consequences.json` (`lion`, puis `bear`, `dragon`, `scorpion`, `finale`).
- Le schéma : `src/campaign/consequences/ConsequenceMap.ts`, version 1. Un changement de forme augmente `schemaVersion` et migre les fichiers explicitement.
- Le validateur : `src/game/narrativeCoherence.ts`, lancé par `npm test` (`src/game/narrativeCoherence.test.ts`) et par `npm run narrative:validate`.

## Contenu d'une carte

| Champ | Rôle |
| --- | --- |
| `schemaVersion` | 1 |
| `plateauId` | `lion`, `bear`, `dragon`, `scorpion` ou `finale` |
| `status` | `canon` pour un contenu approuvé (le Lion) ; `draft` tant que l'opérateur n'a pas approuvé le plateau |
| `sources` | Les documents et fichiers dont la carte est tirée : la feuille de route, son statut, les faits de la démo, les décisions de l'opérateur |
| `facts` | Chaque fait durable : identifiant, nature, résumé en clair |
| `majorChoices` | Chaque choix important : où il se trouve, ses options, ses échos |
| `outcomes` | Les deux issues du plateau (honneur, force) : les faits qui les enregistrent, leurs effets sur les relations de clan, leurs échos. La carte de l’acte final n’en a pas : la fin suit les issues des quatre plateaux (R4, Lot 4) |
| `draftIds` | Facultatif (Lot 5). Les faits, choix et échos ajoutés en brouillon à une carte déjà canon, jusqu’à leur approbation ; `status` décrit le reste de la carte |
| `exceptions` | Les écarts connus, chacun avec sa raison |

### Faits

- `flag` : un drapeau de jeu posé par un dialogue ou par `RunSystem`.
- `flag_pattern` : une famille de drapeaux à suffixe variable, comme `refugeSecured:*`.
- `system` : un marqueur de déroulé sans conséquence narrative (`prologueSeen`). Il échappe aux règles d'écho, mais il doit être posé et lu.

### Choix importants

Un choix important donne :
- son lieu (`nodeId`), son dialogue (`dialogueId`) et son étape (`stepId`) ; `buildState` sert pour un dialogue construit selon l'état, comme le jugement d'Alaric ;
- ses options. Chaque option donne :
  - son indice ;
  - la voie qu'elle nourrit (`honour`, `force` ou `neutral`) ;
  - les drapeaux qu'elle pose directement (`sets`) ;
  - les faits que `RunSystem` enregistrera plus tard à cause d'elle (`leadsTo`), par exemple une victoire de boss ;
  - la réputation que ses effets déplacent, en valeurs de la démo ;
  - ses effets sur les relations de clan ;
- ses échos.

### Échos

Un écho décrit une scène plus tardive qui montre la conséquence d'un fait et en nomme la cause :
- `fact` : le fait montré ;
- `scope` : même plateau, plateau suivant, Tournoi, acte final ou épilogue ;
- `status` : `implemented` (vérifié dans le contenu) ou `planned` (conception seulement ; il ne compte pas encore) ;
- `nodeId`, `dialogueId`, `stepId` : où la scène se joue ;
- `state` : les drapeaux sous lesquels la scène est construite ; ils contiennent le fait ;
- `causePhrase` : les mots qui nomment la cause ;
- `contrast` : facultatif. C'est l'état contraire, quand « le même état sans le fait » n'est pas un état que le jeu peut atteindre. Pour une fin de route, ce sont les faits de l'autre route.

## Ce que le validateur vérifie

Il échoue sur chacun de ces cas, sauf s'il figure dans `exceptions` avec sa raison :

| Règle | Contrôle |
| --- | --- |
| Fait posé jamais lu | Un drapeau posé par un dialogue ou par le code et lu nulle part : ni condition de choix, ni condition contextuelle, ni code, ni score de conduite |
| Fait lu jamais posé | Un drapeau lu sans qu'aucun dialogue ni aucun code ne le pose |
| Choix sans écho | Une option d'un choix important sans écho réalisé qui montre plus tard ce qu'elle a posé, ou un écho placé avant le choix |
| Écho qui ne nomme pas sa cause | La phrase de cause absente de la scène construite avec le fait, ou présente aussi sans le fait : la scène ne parle alors pas de cette cause |
| Lien de dialogue rompu | Une étape, un combat, un dialogue de lieu, de combat, d'écho, d'événement ou de refuge qui n'existe pas |
| Acteur inconnu | Un orateur absent du registre des acteurs de dialogue |
| Étape inatteignable | Une étape qu'aucun lien n'atteint, ou un dialogue qu'aucun lieu, combat, écho, événement ou code ne joue |

Il reprend aussi l'audit des 75 dialogues de la passe narrative du 2026-11-04 : caractères corrompus, liens, acteurs et atteignabilité.

Il refuse enfin :
- une carte en désaccord avec le contenu : drapeaux posés, réputation, fait non déclaré ;
- une exception qui ne correspond plus à rien.

## Statuts et canon

- Une carte `draft` et ses échos sont des propositions. Rien ne devient canon sans l'approbation du plateau par l'opérateur.
- Les effets de relation d'une issue portent `relationStatus` : `proposed` jusqu'à l'approbation, puis `approved`.
- Un ajout à une carte canon (les fins du Lot 5) est listé dans `draftIds` jusqu’à son approbation. Il s’écrit aussi carte d’abord : tant que tous les échos d’un choix en brouillon sont `planned`, le validateur vérifie ce choix et les faits en brouillon qu’il pose comme une conception, puis entièrement dès qu’un écho est réalisé.
- La réputation des options est écrite en valeurs de la démo. Le réétalonnage du Lion, s'il est approuvé, se lit dans le rapport des bornes. Il ne change pas la carte.

## Exemple : Bois-Clair dans la carte du Lion

```json
{
  "id": "lion.bois_clair",
  "summary": "Bois-Clair assiégé : le vieux pont et les captifs, ou la porte basse et les coffres pour le clan.",
  "nodeId": "lion-village-choice",
  "dialogueId": "village_choice",
  "stepId": "5",
  "options": [
    { "choiceIndex": 0, "path": "honour", "sets": ["missionSuccess"], "reputation": 10 },
    { "choiceIndex": 1, "path": "force", "sets": ["missionGreed"], "reputation": -10 }
  ],
  "echoes": [
    {
      "id": "lion.bois_clair.saved.judgement",
      "fact": "missionSuccess",
      "scope": "same_plateau",
      "status": "implemented",
      "nodeId": "lion-final-judgement",
      "dialogueId": "lion_finale_judgement",
      "stepId": "outcome",
      "state": { "missionSuccess": true },
      "causePhrase": "votre compagnie a choisi le vieux pont et ramené les captifs"
    }
  ]
}
```

Le validateur construit le jugement avec `missionSuccess`, puis il trouve la phrase. Il le reconstruit sans le fait, et la phrase disparaît. L'écho nomme donc bien sa cause.

## Méthode pour un plateau de l'après-démo

1. Écrire la carte en brouillon avant toute réplique. Elle couvre :
   - les choix de l'entrée, de l'exploration et de la confrontation ;
   - les déclencheurs des deux voies ;
   - les relations de clan qui en découlent ;
   - les échos prévus dans le plateau, dans les suivants, au Tournoi, dans l'acte final et dans les épilogues ;
   - les échos des plateaux précédents, dont le Lion.
2. Écrire les dialogues en brouillon depuis la carte. Chaque écho passe de `planned` à `implemented` quand sa scène existe.
3. Lancer `npm run narrative:validate` : aucune erreur, des exceptions motivées seulement.
4. Livrer la carte dans le paquet du plateau avec la fiche des textes.

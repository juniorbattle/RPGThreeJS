# Ouverture de la chronique — OD-2026-11-02-A

**APPROVED DECISION.** Le 2026-11-02, l'opérateur a rempli la [fiche d'arbitrages de l'ouverture](https://claude.ai/artifact/RcD47SFx3tf9cxvm8fATeU) issue de l'[audit de l'ouverture](../reports/opening-audit-2026-11-02.md). Cette décision autorise une maquette hors jeu et trois corrections. Elle ne modifie aucun contrat et ne revient pas sur [OD-2026-10-24-A](CINEMATIC_RETIREMENT_OPERATOR_DECISION_2026-10-24.md) : rien n'entre dans le jeu avant que l'opérateur ait jugé la maquette en mouvement.

## Choix de l'opérateur

| Id | Sujet | Choix |
| --- | --- | --- |
| A1 | Principe | Oui, maquette hors jeu d'abord |
| A2 | Moment de l'intégration, si la maquette convainc | Avant le playtest PC |
| B1 | Matière | Mixte : tableaux et un plan d'arène. Note : « Oui mais les visuels ne sont pas encore optimale et bien adaptes a ce que nous voulons, est ce utile d'integrer le plateau de combat dans notre cutscene runtime ? » |
| B2 | Défilement | Automatique, un clic saute au plan suivant |
| B3 | Durée | 50 à 60 secondes |
| C1 | Objectif | Oui, dans la séquence |
| C2 | Dialogue d'ouverture | Couper les répétitions seulement |
| C3 | Chronologie | Oui, finir au camp |
| C4 | Personnage joueur | Rester sur « vous » |
| C5 | Bannière | Sans emblème |
| D1 | Défauts du prologue | Corriger maintenant |

## Réponse à la note sur B1

`PROPOSED FUTURE DESIGN` Non, le plateau n'est pas utile en lui-même. Il dit « combat », pas « village qui brûle ». Ce que l'arène apporte au récit, c'est la profondeur, le feu et les Serpents en marche. La maquette joue donc le plan de Bois-Clair en deux versions, et l'opérateur tranche en les voyant bouger :

- **Tableau vivant.** Le fond de tableau de Bois-Clair en feu, avec braises, fumée, lumière vive et Serpents qui passent. Pas de WebGL, et sans doute pas d'amendement.
- **Arène sans plateau.** Le décor 3D de Bois-Clair, caméra basse, plateau retiré. Si l'opérateur garde cette version, un amendement sera probablement nécessaire (rapport, section 4).

Le choix B1 restait valable tant que l'opérateur n'avait pas tranché : le plan d'arène était conservé pour la comparaison. Voir le verdict ci-dessous.

## Ce qui est autorisé maintenant

1. **Corrections D1.** Brume du prologue et mouvement réduit, reprise d'une sauvegarde laissée pendant l'ouverture, image de panneau absente. Le prologue actuel reste en place.
2. **Maquette A1.** Un écran réservé au serveur de développement, ouvert depuis le laboratoire QA, absent de la version de production. Script du rapport, section 6, avec les réglages B2, B3, C1, C3, C4 et C5.

## Ce qui attend le verdict de l'opérateur sur la maquette

- L'intégration dans le jeu, avant le playtest PC (A2).
- L'allègement du dialogue d'ouverture (C2) : coupes à l'intérieur des répliques de Séraphine et de Maelor, répliques des quatre héros intactes. Il se fait dans le même chantier que l'intégration.
- Le remplacement des cinq panneaux, dont les identifiants restent en place.

Si la maquette ne paraît pas meilleure, le prologue actuel reste et le chantier s'arrête là.

## Verdict de l'opérateur

Le 2026-11-02, à la question de la version de Bois-Clair à garder après l'avoir vue, l'opérateur a répondu : « Tableau vivant ». Cette réponse vaut verdict : la maquette convainc et l'intégration A2 s'applique, avant le playtest PC.

- **B1 est tranché.** La séquence est faite de tableaux, sans arène ni WebGL. Le plan d'arène et les versions de comparaison sont retirés.
- **Contrats.** Relecture indépendante de `contracts-guardian` sur le set 1.12.0 : pas d'amendement pour un lecteur réservé à cette ouverture, sans WebGL, sans image ni vidéo générée. Un lecteur réutilisable, une arène ou une image générée demanderaient un amendement.
- **C2.** Aucune réplique n'est coupée. Les doublons de l'audit venaient des anciens panneaux et disparaissent avec eux. Les deux phrases encore doublées, le Tournoi des Grands et Bois-Clair qui brûle, restent dans le dialogue : un joueur qui passe la séquence ne les entendrait nulle part ailleurs, et « Chacun » dépend de la première.
- **Son.** La séquence garde le contexte `drama` et n'ouvre aucune ambiance : celle du refuge est réservée à son écran, et celle de Bois-Clair à son biome de combat.
- **Figurants.** Les Serpents du plan 3 et les silhouettes du plan 4 sont lus comme du décor en mouvement. Le repère de quatre acteurs visibles vaut pour la scène jouée, que le plan 5 respecte. L'opérateur peut demander de les réduire.

## Ce qui ne change pas

Aucune phrase nouvelle, aucun fait sur le personnage joueur, aucun emblème. Aucune image générée, aucune vidéo. `acte_ouverture`, `camp_departure`, le contexte musical `drama`, les sauvegardes V6 et les autres invariants de la section 8 du rapport restent tenus.

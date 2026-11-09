# Paquet du Lot 5 de l’après-démo, les fins — OD-2026-11-09-B

**APPROVED DECISION.** Le 2026-11-09, l’opérateur a rempli la [fiche du Lot 5](https://claude.ai/artifact/FVEwyTcpDCHd4TH6fwVUze). Il accepte les fins comme canon et retient les quatre recommandations, sans note. Le paquet est décrit dans le [rapport du Lot 5](../reports/post-demo-lot-5-endings-2026-11-09.md) et sa [fiche de texte](../reports/post-demo-lot-5-endings-text-sheet-2026-11-09.md). La décision applique [OD-2026-11-07-I](POST_DEMO_DIRECTION_OPERATOR_DECISION_2026-11-07.md) (R4, F5), [OD-2026-11-08-A](POST_DEMO_LOT_0_OPERATOR_DECISION_2026-11-08.md) à [OD-2026-11-08-D](POST_DEMO_LOT_3_OPERATOR_DECISION_2026-11-08.md) et [OD-2026-11-09-A](POST_DEMO_LOT_4_OPERATOR_DECISION_2026-11-09.md) dans le cadre du jeu de contrats 1.20.0. Elle ne modifie aucun contrat.

## Choix de l’opérateur

| Point | Sujet | Choix |
| --- | --- | --- |
| 1 | Les fins, textes et choix | Acceptées comme canon : les épilogues du Respect, de la Crainte et de l’Équilibre, la scène de clôture de la Crainte, la règle R4 de bout en bout |
| 2 | Conséquences du choix de la Crainte | Se battre seuls contre tous : la compagnie reste debout, sans nom, et le clan sans terre est rayé des clans (anéanti). Accepter son destin : Alistair se livre aux clans, et le clan vit, déchu une fois de plus |
| 3 | Le dernier combat | « Seuls contre tous » : aucun soutien de clan ; le pillard du Serpent, puis les adversaires des autres clans ennemis dans l’ordre des rencontres, quatre au plus ; aucune récompense |
| 4 | Table des moments de l’acte final | Approuvée : la trahison au Tournoi et les trois épilogues, chacun avec ses faits établis ; elle ne joue que sur des tableaux approuvés |
| 5 | Écran de fin | « Fin de la chronique », le nom de la fin, puis « Quatre Sceaux, la brèche refermée : la Voie des Sceaux s’achève ici. » |

## Conséquences

- **Canon.** Les fins ne sont plus marquées brouillon. Les ajouts aux cinq cartes des conséquences sont canon : leur liste `draftIds` est retirée, et aucune carte ne garde d’écho prévu.
- **Après-démo complète.** Avec ce lot, le travail que décrit le brief est accepté en entier : l’Ours, le Dragon, le Scorpion, l’acte final et ses fins sont canon sur `post-demo`.
- **Noms.** L’entité, la capitale et les démons restent sans nom ; le chef Scorpion reste désigné par son titre (P5). Accepter les fins ne valide aucun nom.
- **Moments.** La table de l’acte final est approuvée ; ses moments ne jouent qu’une fois leurs tableaux peints approuvés. Les tables des moments des trois plateaux (l’arrivée et les deux issues), qui n’avaient pas été proposées, seront soumises avec le lot des images finales.
- **Intégration.** Rien n’entre dans `dev` sans ordre explicite de l’opérateur. La première intégration commence par une étiquette Git sur le dernier commit de la démo sur `dev` (OD-2026-11-08-A, point 6). Les images finales forment un lot à part, mené avec l’opérateur.

## Limites

- Aucun contrat ne change ; la baseline immuable reste `6c965169c2dc153cafd5a8609d914cf8de723ff3`.
- La démo sur `dev` ne change pas.
- L’équilibre tactique de l’acte final et du dernier combat attend le test de l’opérateur sur PC.

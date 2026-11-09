# Paquet du Lot 4 de l’après-démo, l’acte final — OD-2026-11-09-A

**APPROVED DECISION.** Le 2026-11-09, l’opérateur a rempli la [fiche du Lot 4](https://claude.ai/artifact/EQGCbPB7QoZFFz82PhGh6Q). Il accepte l’acte final comme canon et retient les cinq recommandations, sans note. Le paquet est décrit dans le [rapport du Lot 4](../reports/post-demo-lot-4-finale-2026-11-08.md) et sa [fiche de texte](../reports/post-demo-lot-4-finale-text-sheet-2026-11-08.md). La décision applique [OD-2026-11-07-I](POST_DEMO_DIRECTION_OPERATOR_DECISION_2026-11-07.md) (F1 à F4), [OD-2026-11-08-A](POST_DEMO_LOT_0_OPERATOR_DECISION_2026-11-08.md), [OD-2026-11-08-B](POST_DEMO_LOT_1_OPERATOR_DECISION_2026-11-08.md), [OD-2026-11-08-C](POST_DEMO_LOT_2_OPERATOR_DECISION_2026-11-08.md) et [OD-2026-11-08-D](POST_DEMO_LOT_3_OPERATOR_DECISION_2026-11-08.md) dans le cadre du jeu de contrats 1.20.0. Elle ne modifie aucun contrat.

## Choix de l’opérateur

| Point | Sujet | Choix |
| --- | --- | --- |
| 1 | L’acte final, textes et choix | Accepté comme canon : le Tournoi des Grands sur son tableau des rencontres, la trahison de Maelor, la capitale corrompue, la brèche, ses 15 scènes, ses choix et ses combats |
| 2 | Les verdicts du Tournoi | Relever un champion vaincu fait de son clan un allié ; l’humilier en fait un ennemi (−1). La relation fixée au Tournoi remplace celle des plateaux (cause `finale.tournament.<clan>`) |
| 3 | Les soutiens des clans alliés (F3) | Un soutien par clan allié, utilisable une fois par combat de l’acte final, par une compétence existante non ultime que le héros actif lance au coût de la compétence ; pas de soutien du clan affronté au Tournoi ; rien n’est sauvegardé |
| 4 | Les adversaires des clans ennemis | Au Tournoi, seul le clan affronté ; dans l’arène en flammes, aucun ; dans la capitale et à la brèche, tous les clans ennemis dans l’ordre des rencontres, jusqu’à quatre adversaires ou un boss et trois escortes |
| 5 | La brèche en deux phases | Maelor, puis l’entité, sans soin entre les deux |
| 6 | Réputation de l’acte final | Répartition gardée : +1 pour les civils couverts, les habitants dégagés, la victoire à la brèche et le gardien des remparts ; −1 par champion humilié, −2 pour la foule laissée, −1 pour les habitants laissés. Budget 4 et 3 |

## Conséquences

- **Canon.** Le statut de l’acte final passe de « brouillon » à « canon » dans le registre des plateaux, et sa carte des conséquences passe de « brouillon » à « canon ». Les soutiens et les adversaires des clans deviennent les règles de l’acte final ; ils restent dérivés des relations sauvegardées avant chaque combat.
- **Noms.** L’entité reste sans nom, sans histoire propre et sans réplique ; la capitale, les hôtes de l’arène et les démons restent sans nom, tant que l’opérateur n’en décide pas (F4). Accepter l’acte ne valide aucun nom.
- **Marques à l’écran.** Les scènes, le refuge, la carte et le tableau des rencontres de l’acte final ne sont plus marqués « Brouillon » ; leurs images restent provisoires et marquées « Image provisoire » jusqu’au lot des images finales.
- **Intégration.** L’acte final reste sur `post-demo` avec l’Ours, le Dragon et le Scorpion. Ils n’entrent dans `dev` que sur ordre explicite de l’opérateur, après l’étiquette Git sur le dernier commit de la démo (OD-2026-11-08-A, point 6).
- **Lot 5.** La session ouvre le Lot 5, les fins et le parcours complet (brief, section 3) : les trois épilogues (le Respect, la Crainte, l’Équilibre, F5), le choix de la Fin de la Crainte, la règle R4 de bout en bout et des parcours complets simulés. Sa carte des conséquences s’écrit d’abord, avant toute réplique. Les tableaux vivants des épilogues ne jouent que sur un tableau approuvé : tant que leurs tableaux sont provisoires, chaque moment passe directement à son dialogue.

## Limites

- Aucun contrat ne change ; la baseline immuable reste `6c965169c2dc153cafd5a8609d914cf8de723ff3`.
- La démo sur `dev` ne change pas.
- L’équilibre tactique de l’acte final, soutiens compris, attend le test de l’opérateur sur PC.

# Intégration de l’après-démo à `dev`, images finales et test final — OD-2026-11-09-C

**APPROVED DECISION.** Le 2026-11-09, après l’acceptation des fins ([OD-2026-11-09-B](POST_DEMO_LOT_5_OPERATOR_DECISION_2026-11-09.md)), l’opérateur a donné trois réponses à la session cloud de l’après-démo. Elles s’appliquent dans le cadre du jeu de contrats 1.20.0 et ne modifient aucun contrat.

## Choix de l’opérateur

| Point | Sujet | Choix |
| --- | --- | --- |
| 1 | Intégration | L’après-démo entre dans `dev`. Un rapport de ce qui a été fait est transmis à la session locale parente, pour poursuivre sur de bonnes bases |
| 2 | Étiquette de la démo figée | Le proxy GitHub de la session cloud refuse de pousser une étiquette (HTTP 403). Choix de l’opérateur : intégrer d’abord, par avance rapide ; la session locale pousse ensuite l’étiquette `demo-frozen-2026-11-09` sur `25ccd2f2`, le dernier commit de la démo |
| 3 | Images finales | Codex (ChatGPT) réalise le lot des images finales, son rôle depuis le début du projet. Une fois toutes les images intégrées, la finalisation reprend (tableaux vivants sur tableaux approuvés, tables des moments des plateaux) |
| 4 | Test final | Le test final sur PC, équilibre tactique compris, vient quand tout sera prêt |

## Conséquences

- **Intégration.** `dev` avance de `25ccd2f2` jusqu’au dernier commit de `post-demo`, sans fusion ni réécriture : `dev` n’avait reçu aucun commit depuis le départ de `post-demo`. `post-demo` et `dev` pointent sur le même commit.
- **La démo figée.** `25ccd2f2` reste dans l’historique de `dev`. L’étiquette posée dessus par la session locale garde la démo et ses valeurs de réputation du Lion (OD-2026-11-08-A, point 6). Sur `dev`, le Lion prend l’étalonnage de l’après-démo approuvé au Lot 0.
- **Les images.** Les registres de présentation de chaque plateau nomment chaque image provisoire et l’image finale qu’elle attend (`awaitedFinal`). Le lot des images suit les contrats en vigueur, notamment WORLD_AND_CHARACTERS « Provisional images » et la retraite des vidéos (OD-2026-10-24-A) : aucune vidéo.
- **Les moments.** La table des moments de l’acte final est approuvée (OD-2026-11-09-B). Les tables des trois plateaux (l’arrivée et les deux issues) seront proposées une fois les images intégrées. Aucun moment ne joue avant d’avoir un tableau peint approuvé.

## Limites

- Aucun contrat ne change ; la baseline immuable reste `6c965169c2dc153cafd5a8609d914cf8de723ff3`.
- `main` n’est pas touché.

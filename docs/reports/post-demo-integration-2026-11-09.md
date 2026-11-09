# Après-démo — intégration à `dev`

| Champ | Valeur |
| --- | --- |
| TASK | POST-DEMO-INTEGRATION |
| DOMAIN | Git (intégration), état et relais |
| BASELINE | `25ccd2f2` sur `dev` (dernier commit de la démo ; jeu de contrats 1.20.0, baseline immuable `6c965169c2dc153cafd5a8609d914cf8de723ff3`) |
| BRANCH | `post-demo`, puis `dev` par avance rapide |
| HEAD | le commit de ce rapport, sur `dev` et sur `post-demo` |
| STATUS | intégré sur ordre de l’opérateur ([OD-2026-11-09-C](../autonomy/POST_DEMO_INTEGRATION_OPERATOR_DECISION_2026-11-09.md)) ; étiquette de la démo figée à pousser depuis la session locale |
| MERGED_IN | `dev` |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | `dev` devient le jeu complet : le Lion étalonné pour l’après-démo, puis l’Ours, le Dragon, le Scorpion, l’acte final et ses trois fins, tous canon, images provisoires marquées. La démo figée reste à `25ccd2f2`. |
| CANONICAL_DOCS_UPDATED | `AGENTS.md` (priorité courante), `docs/autonomy/AUTONOMOUS_WORK_STATE.md` et `.json`, `docs/autonomy/OPERATOR_DECISIONS.md` |
| EVIDENCE | Mêmes vérifications que la clôture du Lot 5, rejouées sur l’arbre intégré (ci-dessous). |

## Ce qui a été fait

1. **Étiquette.** `demo-frozen-2026-11-09` a été créée sur `25ccd2f2` (étiquette annotée). Le proxy GitHub de la session cloud a refusé de la pousser (HTTP 403, quatre essais) alors qu’il accepte les branches. Ce refus n’a pas été contourné. L’opérateur a choisi d’intégrer d’abord ; la session locale pousse l’étiquette (commande dans [le relais](../autonomy/handoffs/2026-11-09T0323Z-claude-post-demo-integration.md)).
2. **Intégration.** `dev` n’avait reçu aucun commit depuis le départ de `post-demo` : il avance par avance rapide jusqu’au commit de ce rapport, sans fusion ni réécriture. Le diff depuis `25ccd2f2` touche 141 fichiers avant ce rapport (≈ 23 000 lignes ajoutées, 182 retirées).
3. **Relais.** [Le relais pour la session locale](../autonomy/handoffs/2026-11-09T0323Z-claude-post-demo-integration.md) dit où est quoi, ce qui reste à faire et ce qui n’est pas éprouvé.
4. **Suite décidée** (OD-2026-11-09-C) : Codex réalise les images finales ; puis la finalisation (tables des moments des plateaux, tableaux vivants sur tableaux approuvés) ; puis le test final sur PC.

## Vérification sur l’arbre intégré

| Contrôle | Résultat |
| --- | --- |
| `npx tsc --noEmit` | vert |
| `npx vitest run` | 3 155 réussis, 23 ignorés, 10 échecs connus de la ligne de base (spritesheetPng 5, cin6ea3_pilot_e_regate 4, cin4_media 1), aucun nouveau |
| `node --test tools/qa/qa-job.test.mjs` | 26 sur 26 |
| `npm run build` | vert |
| `npm run contracts:validate` | vert |
| Porte du verrou documentaire | vide |
| `npm run narrative:validate` | cinq cartes valides, aucun écho prévu |

## Rapports de l’après-démo

[Lot 0, fondations](post-demo-lot-0-foundations-2026-11-08.md) · [Lot 1, l’Ours](post-demo-lot-1-bear-2026-11-08.md) · [Lot 2, le Dragon](post-demo-lot-2-dragon-2026-11-08.md) · [Lot 3, le Scorpion](post-demo-lot-3-scorpion-2026-11-08.md) · [Lot 4, l’acte final](post-demo-lot-4-finale-2026-11-08.md) · [Lot 5, les fins](post-demo-lot-5-endings-2026-11-09.md).

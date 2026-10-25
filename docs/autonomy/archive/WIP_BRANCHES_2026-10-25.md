# Branches WIP archivées en tags

Tâche N3 d'[OD-2026-10-25-A](../CLAUDE_INTEGRATION_AND_CLEANUP_OPERATOR_DECISION_2026-10-25.md), 25 octobre 2026. Les 12 branches `wip/*` locales et les 11 branches `wip/*` d'origin (snapshots du 3 au 13 octobre, aucun mergé dans `dev`) sont remplacées par des tags annotés `archive/wip/<nom>`, poussés sur origin et vérifiés avant la suppression des branches. Aucun commit n'est perdu : chaque pointe reste joignable par son tag.

| Tag | Commit | Source |
| --- | --- | --- |
| `archive/wip/codex-manual-playtest-20261003T0735` | `5f89ea41` | local et origin ; travail clavier du champ de bataille préservé par OD-2026-10-03-A |
| `archive/wip/rpgthreejs-auto-dev-90m-20261003T1600` | `ae718cc1` | version publiée sur origin |
| `archive/wip/rpgthreejs-auto-dev-90m-20261003T1600-local` | `81ed1ff5` | version locale divergente, publiée pour la première fois par ce tag |
| `archive/wip/rpgthreejs-auto-dev-90m-20261010T1840` | `b2110fe0` | local et origin |
| `archive/wip/rpgthreejs-auto-dev-90m-20261012T0332` | `09f87540` | local seulement, publiée pour la première fois par ce tag (avec son parent `2c299b73`) |
| `archive/wip/rpgthreejs-auto-dev-90m-20261012T0647` | `01450fa8` | local et origin |
| `archive/wip/rpgthreejs-auto-dev-90m-20261012T1648` | `121d45fd` | local et origin |
| `archive/wip/rpgthreejs-auto-dev-90m-20261012T1821` | `c9269055` | local et origin |
| `archive/wip/rpgthreejs-auto-dev-90m-20261012T1848` | `64575cac` | local et origin |
| `archive/wip/rpgthreejs-auto-dev-90m-20261012T2045` | `29a75e2e` | local et origin |
| `archive/wip/rpgthreejs-auto-dev-90m-20261013T0127` | `72b1d3f6` | local et origin |
| `archive/wip/rpgthreejs-auto-dev-90m-20261013T0552` | `a355d957` | local et origin |
| `archive/wip/rpgthreejs-auto-dev-90m-20261013T1828` | `40d4cd6d` | local et origin |

Avant publication, les trois commits jamais poussés (`81ed1ff5`, `09f87540`, `2c299b73`) ont été inspectés : ils ne touchent que des sources, tests, outils de QA, l'état et un handoff, sans secret ni chemin propre à une machine. La publication du snapshot `0332` avait été bloquée le 12 octobre par le relecteur automatique de Codex, pas par l'opérateur ; elle relève de la publication autorisée par OD-2026-10-12-A et du choix N3.

Pour reprendre un de ces travaux : `git switch -c <nouvelle-branche> archive/wip/<nom>` depuis `dev`, sous verrou.

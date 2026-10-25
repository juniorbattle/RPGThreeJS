# Archive de l'état d'autonomie

Historique clos de l'état d'autonomie, sorti de l'état courant par [OD-2026-10-25-A](../CLAUDE_INTEGRATION_AND_CLEANUP_OPERATOR_DECISION_2026-10-25.md) (tâche N2). Rien n'y est réécrit : les copies sont identiques à l'état publié sur `dev@6b6cb95eb7115b42c331fc38daf840085fa8aea2`, et `.gitattributes` les marque `-text` pour que leurs octets ne changent pas au checkout.

| Fichier | Contenu | Blob Git | SHA-256 |
| --- | --- | --- | --- |
| `AUTONOMOUS_WORK_STATE_2026-10-25.json` | état complet : 119 clés, bloc `live`, 365 jobs QA | `0f3ff1a4b918e1d710dbbd2ecad38a70e79a8885` | `ff0e2850ffb855c9289e99bcab02cf3de1f390c01da8660a0c7749d32d10b2fc` |
| `AUTONOMOUS_WORK_STATE_2026-10-25.md` | résumé et liste des 365 jobs QA | `3aa564fecd8df88a73ff2856a33ed37578a006c8` | `27001c6b92be65228d09e2964596f3b32f1727f3c00ef82b58129560217daca4` |
| `QA_JOB_ORPHANS_2026-10-25.json` | annotation des 15 jobs restés RUNNING | — | — |
| `WIP_BRANCHES_2026-10-25.md` | inventaire des 13 tags `archive/wip/*` qui remplacent les branches WIP (N3) | — | — |

## Ce qui reste dans l'état courant

`docs/autonomy/AUTONOMOUS_WORK_STATE.json` garde les champs exigés par `MULTI_AGENT_PROTOCOL.md` §4, l'identité du run, les autorités en vigueur, les éléments ouverts ou différés (`deferredDemoTask`, `reopenedAcceptance`), les portées courantes et les jobs QA enregistrés après l'amendement 1.10.0 (`da69ec63`, 2026-10-24T23:02:52Z). Sa clé `stateArchive` décrit cette règle.

## Jobs QA archivés

`live.qaJobArchives` liste les snapshots dont les jobs restent réservés : `tools/qa/qa-job.mjs` refuse d'enregistrer un `jobId` ou une sortie déjà présents dans l'état courant ou dans ces archives. Les reçus restent sous `tmp/` aux chemins indiqués.

Les 15 jobs restés RUNNING (2 au 12 octobre) ont des reçus qui disent toujours RUNNING, sans heure de fin : leurs workers se sont arrêtés sans finaliser. Ils sont annotés `ORPHANED_UNVERIFIED` dans `QA_JOB_ORPHANS_2026-10-25.json`. Aucun processus n'a été inspecté ni arrêté, et ces entrées ne comptent plus comme workers en cours pour juger un verrou périmé. Aucune acceptation n'est déduite.

## Ajouter une archive

Copier l'état publié à l'identique sous un nouveau nom daté, ajouter son chemin à `live.qaJobArchives`, compacter l'état courant selon la même règle, puis lancer `npm test` et un `sync` réel de `qa-job.mjs` sous verrou.

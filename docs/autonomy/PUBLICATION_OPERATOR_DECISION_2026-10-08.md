# Publication operator decision — 2026-10-08

Decision ID: **OD-2026-10-08-A**. Status: **ACTIVE**.

Source: explicit operator instruction in the Codex conversation on 2026-10-08:

> pour toutes les prochaines Publications autorisées : push normal, sans force, de dev vers origin/dev et de wip/ vers origin (dépôt public de l'opérateur juniorbattle/RPGThreeJS), limité aux chemins sélectionnés ; jamais de secrets, de sorties ignorées (tmp/) ni de main.

For every subsequent authorized publication:

- Use a normal, non-force push from `dev` to `origin/dev`, or from the owned `wip/<runId>` branch to its matching branch on `origin`.
- Verify that `origin` identifies the operator's public repository `juniorbattle/RPGThreeJS` before publishing.
- Review and stage an explicit selection of repository paths. Git pushes commits, so review the outgoing commits and their changed paths as well; a path selection does not filter a push.
- Exclude secrets and ignored outputs, including `tmp/`. Never publish to `main` or force a push.

This decision specifies how already-authorized publications proceed. Existing task authority, exclusive-lock ownership, checkpoint verification and contract gates remain applicable. It does not authorize additional product scope, canon or LOCKED-contract changes, nor change the active demo task or its exact continuation. Owned WIP retirement continues under the existing handoff protocol after its selected contents are committed and verified on `origin/dev`.

Compliance: repository-governance clarification only; no runtime, QA assertion, save, canon or LOCKED document changes. Contract set 1.1.0 and immutable baseline `d7ca28aed5c377ffedb03202f6364b7a947d1096` remain in force.

## Standing dev publication authorization — OD-2026-10-08-B

Status: **ACTIVE**. Received on 2026-10-08 in Codex chat `01a11cad-ca2d-7d31-aae2-b1a6b954e4bb`, after the concrete three-file metadata checkpoint `a903b6ec72cb7f3721f2827047c924c6d7e0485d` and its pending lock release were presented.

Explicit operator instruction:

> oui et autoridse toujours la publication vers la branche dev

This approves that metadata checkpoint and verified lock release, and provides standing authorization for subsequent normal, non-force publications of coherent checkpoints from authorized RPGThreeJS work to `origin/dev` on the operator's public repository `juniorbattle/RPGThreeJS`. It covers reviewed product code, tests, QA drivers, explicitly selected evidence, documentation, operator-decision records and workflow/state/handoff closure files. Routine per-checkpoint human confirmation is not required for those dev publications.

The existing selected-path review, secret and ignored-output exclusion, exclusive writer lock, stopped-job checks, verification and remote-parity protocol continue to apply. `main` remains excluded. Canon, LOCKED contracts and additional product scope retain their existing operator-decision boundaries. OD-2026-10-08-A continues to govern publication mechanics and existing owned-WIP handling.

Record this standing authorization in run state and automation memory so scheduled runs can use it. An actual subsequent automatic-review rejection must still be reported and resolved through the normal approval mechanism; this decision does not authorize bypassing such a rejection.

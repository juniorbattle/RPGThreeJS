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


## Standing publication authorization reaffirmed - OD-2026-10-11-A

Status: **ACTIVE**. Direct operator instruction received in Codex chat 01a12e17-1fcf-7e02-a862-8e1dfe03454b on 2026-10-11 (America/Toronto), after pending closure commit9b14235 and its four selected metadata files were identified:

> OUI AUTORISE TOUTES LES PUBLICATIONS, NE ME DEMANDE PLUS A L'AVENIR

This explicitly resolves the pending closure publication and reaffirms OD-2026-10-08-B for all subsequent normal, non-force publications of coherent authorized RPGThreeJS checkpoints to origin/dev and owned wip branches. Workflow, paired state, handoff, and selected evidence closure are included. Do not request routine per-checkpoint confirmation. Keep selected-path review, exclusive locking, stopped-job checks, secret/ignored-output exclusion, verified destination and remote parity. Main, canon, LOCKED amendments and additional product scope retain their existing boundaries. Actual automatic-review failures must be handled through the normal mechanism; this authorization does not permit bypassing safeguards.

No runtime, save, QA assertion or LOCKED rule changed.

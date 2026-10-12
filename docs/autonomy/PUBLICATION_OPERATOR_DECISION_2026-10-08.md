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

## Standing dev publication for all future payloads - OD-2026-10-12-A

Status: **ACTIVE**. Direct operator instruction in Codex chat `01a0f5ba-db22-7412-b3ad-a3429d76cad6`, reaffirmed after the recurring publication request for `ecda304`:

> Je veux que tu autorises toujours cette demandes pour des publications vers la branche dev. tu n'as plus besoin de demander ma validation, car parfois la tache autonome semble bloquer en attendant mon approbation. plus besoin, fonce

This is permanent, explicit advance authorization from the human operator for **all future concrete commit payloads** of coherent, already-authorized RPGThreeJS work published by normal non-force push from `dev` to `origin/dev`, on the operator's public repository `https://github.com/juniorbattle/RPGThreeJS.git`. It covers product code, tests, existing QA drivers, deliberately selected evidence, documentation, operator-decision records and workflow/state/handoff closure. A new commit, selected path list or payload does not require another routine human confirmation. After the required review, publish and verify autonomously; do not ask "Autorises-tu sa publication sur origin/dev ?". Existing authorization for owned WIP snapshots remains active under OD-2026-10-08-A/B and OD-2026-10-11-A.

Before export, verify the exact destination and outgoing commits/paths, preserve exclusive locking, exclude secrets and ignored outputs, retain contract/verification gates and check remote parity. Technical Git/network permission requests must cite this direct human authorization and this section; do not misclassify future authorized payloads as lacking operator consent merely because they are new.

An actual automatic-review or tool refusal remains enforceable: preserve the local checkpoint, state the rejected action and exact reason, and use the normal approval mechanism if intervention is genuinely required. This instruction does not disable or circumvent tool safeguards. `main`, canon, LOCKED amendments and extensions of product scope retain their existing boundaries.

The live `ecda304` example was already published, followed by closure `ceabfe2`, before this configuration update; no duplicate publication or replay is needed. This decision changes workflow instructions only, not runtime, QA assertions, saves or production acceptance. Contract set 1.1.0 and its immutable baseline remain unchanged.

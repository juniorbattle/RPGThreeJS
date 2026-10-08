# Narrative environment coherence

CURRENT FACT — bounded source audit in run rpgthreejs-auto-dev-90m-20261008T0514 identifies a confirmed night-versus-sunset gap in the Bois-Clair night-watch. No environment was changed or accepted by this audit. Other campaign environments remain to be inventoried; demo incomplete.

Baseline: dev `6bcc566c9ba4b8e6f8fe0265cb91634c08e00641`. Authority: WORLD_AND_CHARACTERS / Narrative environment truth, CAMPAIGN_AND_STATE, OD-2026-10-03-A point15. Existing approved pack/master bytes and registry are preserved.

## Exact blocked deliverable

`ate_bois_clair_night_watch` step1 says “La nuit est tombée” in `src/game/r5NarrativeContent.ts:185`. All contextual opening variants retain night (`src/game/contextualDialogueContent.ts:238/247/256`). Its mapping at `src/render/data/demo-environment-pack-v1.production.json:1326` selects `bois_clair_tableau_burning`.

The source descriptor at `public/assets/generated/lion-phase/environments/demo-environment-pack-v1/approved-source-manifest.json:369` identifies a village square, burning outcome-neutral, sunset. Root inspected the actual approved `tableau/bois-clair-tableau-burning.png`: the bright orange horizon and illuminated sunset sky visibly contradict the night-watch’s established time.

No approved same-location nighttime replacement was established. Saved/sacrificed plates are dawn/smoky dawn (source descriptor407/425); the second-refuge night plate depicts a different location. These are not accepted substitutes. Preserve the existing nighttime text and branch facts; do not manufacture a time/location change, edit an approved master or select another scene merely because it is dark.

BLOCKED_ASSET: an approved Bois-Clair nighttime tableau plate/variant is needed before this deliverable can close. An asset deficit is a documented production gap. Source audit alone does not authorize a silent substitute or establish all branch/time/environment acceptance.

## Other bounded audit findings

Village choice describes burning before night and fits the burning/sunset plate. Saved/sacrificed media/aftermath mappings follow their established branch selection. Maelor ATEs and shadow signs select the moonlit shadow-ruins evidence-court family; no incompatible location/time was established by the scoped source audit. These observations are not comprehensive visual acceptance.

The current route runner covers Bois-Clair aftermath/arrival, but does not certify the later night-watch. The older `run_cin6d6_browser_qa.mjs` refuge flowH is only a pointer for further inspection; its historical PASS has not been accepted as current night-watch proof. No new QA tool or media generation was performed.

Next: obtain an approved same-location night plate or an explicit scoped art workstream, then wire only presentation context, inspect actual production night-watch in both established branches, and continue the broader family/context inventory. Retain this blocker while advancing independent authorized source work; no repetitive failed matrix or false environment PASS.

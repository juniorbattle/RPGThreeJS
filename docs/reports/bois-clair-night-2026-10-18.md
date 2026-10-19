# Bois-Clair night watch and first SFX listening pack

TASK: BOIS-CLAIR-NIGHT-TABLEAU / UI-FX-OFFLINE-AUDIT
DOMAIN: narrative presentation / offline media candidates
BASELINE: f4e8d9f4377060392bbf94d094ded66ef59d9ada on dev
BRANCH: dev
HEAD: product74f8669; final driver5e22775; closure commit contains this report
STATUS: ACCEPTED_SCOPED (night first step); OFFLINE_CANDIDATES (audio)
MERGED_IN: NONE (direct dev checkpoint)
SUPERSEDES: NONE
SUPERSEDED_BY: NONE
PRODUCTION_IMPACT: exact night-watch STATIC_TABLEAU background only; audio candidates do not play in the game
CANONICAL_DOCS_UPDATED: docs/autonomy/UI_FX_AUDIT_2026-10-18.md and OPERATOR_DECISIONS.md; no canonical story changed
EVIDENCE: bois-clair-night-2026-10-18/proof.json and two selected native captures; remaining receipts under ignored tmp/cinematics

## Player finding and correction

The operator identified a burning daytime/sunset plate during the nighttime Bois-Clair ATE. The new sibling night plate shows the shared village perimeter, palisade and empty road under moonlight; no houses, stocks, actors or outcome-specific structures are baked in. The small distant tower also exists intact in both original aftermath references. The resolver override is limited to `dialogue:ate_bois_clair_night_watch` with `STATIC_TABLEAU`; other169 context mappings and every other role retain their original binding. Original44-asset pack, dates, approval metadata, source files and hashes are unchanged. New correction provenance is separate; artistic acceptance remains operator review.

No dialogue, cast, choices, stage IDs, outcome flags, rewards, costs, V6, Alaric climax or video slots changed. The operator clarifies that the former Hunters defeat followed unhealed heroes despite available potions; that observation does not justify a difficulty adjustment.

## Verification and limits

40 current tests across environment correction6, contextual dialogue31 and refuge presentation3 pass; the initial filtered run additionally collected68 duplicate tests from ignored historical snapshots, excluded from the40 count. Current TypeScript/production build, contracts8/8, eight MP4s, Git LOCKED barrier and whitespace gate pass. Four flag combinations preserve four authored steps and unchanged owner state. All original bindings except the exact corrected role are checked against the original manifest.

Existing `tools/cinematics/run_cin6ea4_dialogue_qa.mjs --production-contextual` adds the opt-in `CIN6EA4_NIGHT_WATCH=1`, PC1366x768 normal only. It enters the real refuge/ATE through native controls from an explicitly declared presentation fixture; no earned-save, full campaign, combat or balance claim. Native first authored step has two pages: both show four actors, one stage-owned static surface, the exact decoded1672x941 asset/hash, readable complete contextual text and enabled controls. During observations, full live owner state and stored V6 bytes stay identical. No video/combat/errors. Steps2–4 and alternative native outcomes were not replayed for this single background correction.

Retained attempts are precise: sandbox browser executable missing; host capture good but new assertion inspected the surface wrapper instead of its environment child; next assertion reached decode but request required an absolute URL. Each affected assertion received a narrow correction without removal or weakened conditions. The final job `night-watch-final-0234` SUCCEEDED with exact source/driver/build/request/digest identity and root-inspected captures. Earlier failed receipts remain FAILED and unaccepted. Guardian scoped review is recorded in final paired state/proof; raw receipt NOT_ACCEPTED remains separate.

## SFX request delivered as listening candidates

Concrete source audit identifies existing intentional selection, confirm/back, explicit refusal, successful manual save, granted reward, successful heal and accepted actual move boundaries. Eight original short synthetic WAV candidates, manifest and manual listening page are under `docs/media/audio/ui-fx-candidates-v1/`; reproducible offline generator under `tools/audio/`. No external model/provider or samples used. Binary PCM/hash/duration/peak/RMS/edge integrity pass independently; page exposes eight native players, deliberate playback, stop and no autoplay. No subjective listening quality or hardware comfort is inferred.

The game remains silent under Audio DEFERRED/set1.5.0. Before runtime activation, use a dedicated narrow reviewed exception for this concrete lot, gesture unlock, volume/mute, deduplication, bounded playback and non-blocking failure/cleanup. No music, voice, ambience, combat or cinematic audio scope is invented. Operator scheduler unchanged. Next product step: listen/select or adjust these concrete timbres, then perform that bounded production integration.

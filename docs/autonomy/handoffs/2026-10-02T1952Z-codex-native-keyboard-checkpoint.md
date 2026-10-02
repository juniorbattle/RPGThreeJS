# Native combat keyboard and mobile defeat recovery checkpoint

Run rpgthreejs-auto-dev-90m-20261002T1952; baseline dev387dd732b3578b3e0ff620ff7e6c3cf5c01a8fe8; reviewed 2026-10-02T21:01:29.978Z. Implementation/final state commits: see HEAD/origin/dev and state checkpoint references. DEMO-QA-POLISH item9 remains IN_PROGRESS.

## Accepted scope

Global Enter no longer ends a turn when a native combat control owns activation. Six built-production cases at1366x768/620x780/390x844 with normal/OS motion pass; standalone campaignAcceptance=false.81focused+16receipt tests,types/build,8contracts/8slots and Git gates pass.

Native390x844 OS-only recovery: actual marais victory43actions/6rounds, Bois-Clair defeat15Wait/8rounds, keyboard return, exact failRunToCheckpointV6 and reload.105temporary gold/red_gem/iron_ore cleared,T1removed,T0preserved,17other autosaved fields retained. Desktop separately wins marais33actions4rounds and loses Bois-Clair17Wait8rounds; same owner/reload/agency proof with its own receipt/captures and guardian review. T3 was already absent; no preexisting-T3 deletion claim. Departure visible/enabled/non-inert/focused and zero overflow. Same contracts-guardian reviewed source/receipt boundary, then actual mobile proof; UI specialist reviewed native input ownership. Ten selected captures/hashes in docs/reports/combat-keyboard-native-activation-1; full raw proof stays ignored.

## Terminal outcomes and rejected attempts

- desktop: SUCCEEDED, pass=true, reviewEligible=true; native owner boundary accepted only as scoped below. Raw tmp/demo/1952-final-desktop/results.json; receipt tmp/demo/1952-final-desktop/qa-job.json.
- mobile: SUCCEEDED, pass=true, reviewEligible=true; native owner boundary accepted only as scoped below. Raw tmp/demo/1952-final-mobile/results.json; receipt tmp/demo/1952-final-mobile/qa-job.json.
- intermediate: FAILED, pass=false, reviewEligible=false; AssertionError [ERR_ASSERTION]: Defeat occurred before the requested native recovery boundary. Raw tmp/demo/1952-final-intermediate/results.json; receipt tmp/demo/1952-final-intermediate/qa-job.json.
- trial: FAILED, pass=false, reviewEligible=false; AssertionError [ERR_ASSERTION]: Battle did not finish before bounded deadline. Raw tmp/demo/1952-final-trial/results.json; receipt tmp/demo/1952-final-trial/qa-job.json.

Earlier1952mobile failed CSS-transformed innerText then JSON-undefined receipt comparison; fixed textContent/JSON-value comparison without relaxing owner assertions. Other3earlier owned jobs were stopped after identified harness defects; owner-interruption.json records preserve ABORTED_HARNESS_DEFECT even where worker receipt remains RUNNING_AT_INTERRUPTION. Legacy1453 old assertions/provenance remain NOT_ACCEPTED. Accepted desktop/mobile/keyboard proof does not certify620/Champion/full demo. A deadline/early loss does not prove a gameplay defect.

## Provenance and next action

Final driver558df230a943da57ec0bccc583ee1b8fd76aaab709e80e746b106aa3bcbe195c; helpera3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f; reviewed sourceTreea217d771f09008d7e07f0a15236317376000bbc9 and sourceDiff6a9d0d99de50c0170942550df93088ffcc83723168f9b3366fb23d996805c220. Combat build combat-DWj918UO.js; all full hashes/input/assertion parameters retained. Committing unchanged code changes HEAD/diff representation; acceptance names the reviewed precommit payload, verified against committed blobs.

Resume item9. Read terminal1952-final-desktop/intermediate/trial receipts/results/progress before any relaunch. Desktop1366normal/mobile390OS-only exact V6 recovery and six standalone keyboard cases are ACCEPTED_SCOPED; do not repeat unchanged accepted work. Investigate native pilot failed-target/Marian action retries and 620marais attrition using captured progress/action inputs; distinguish harness targeting/camera hit-testing from gameplay without changing truth or forcing victory. Fix verified harness/runtime defect, then rerun620 recovery from successful1153first-refuge seed/proof and Champion from successful1323second-refuge seed/proof in separate fresh output dirs. Preserve exact owner recovery/reload assertions, OS/game motion evidence and receipt provenance. A failed/interrupted result cannot seed certified continuation. Then sacrifice/full keyboard grid/VFX/balance; demo IN_PROGRESS.

Final source frozen during workers. Npm CLI missing npm-cli.js is inherited; direct installed Node binaries used. One owner, dev only; no LOCKED changes, main untouched, eightMP4s unchanged, no provider/media call, audio deferred, canon/durable IDs/V6 unchanged. Current owned WIP removed only after dev parity/content verification; older WIP branches preserved. Process/port closure and final commits are recorded in state/automation memory.

Implementation checkpoint c05ba67bd2823db16d80638d4aff3d1ba74b0052 pushed and remote verified. Reviewed source/driver/helper bytes equal committed blobs. Final Champion bound:round15,19/520HP,Kestrel90HP alive,other3KO; ending NOT_ACCEPTED. Guardian independently accepted desktop boundary;620still fails requested boundary. Three scoped guardian passes reuse the same reviewer; one UI recommendation.

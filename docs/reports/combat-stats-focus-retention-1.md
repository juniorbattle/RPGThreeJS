# Native combat inspection focus retention

| Field | Value |
| --- | --- |
| TASK | DEMO-QA-POLISH / combat-stats-focus-retention-1 |
| DOMAIN | Combat UI and production QA |
| BASELINE | dev 122ffe6feffd3d6ae4df678bbd13e6421596e4ea |
| BRANCH | dev |
| HEAD | e6f1a03568d14875db7a8c72f8dadc089b021072; final state commit is HEAD/origin/dev |
| STATUS | Review; scoped production PASS; item 9 IN_PROGRESS |
| MERGED_IN | NONE; dev checkpoint |
| SUPERSEDES | NONE; closes the focus/content gap recorded by combat-grid-hit-reachability-1 |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Rebuilt inspection card retains its already focused native statistics button |
| CANONICAL_DOCS_UPDATED | AUTONOMOUS_WORK_STATE.md/.json and current handoff |
| EVIDENCE | combat-stats-focus-retention-1/proof.json and six selected captures; raw tmp/demo/2252-card-focus-labels |

CURRENT FACT: `renderPanel` replaced its focused statistics button with `innerHTML`, leaving BODY focused. It now records whether that exact button held focus before replacement and restores focus to the replacement after the card/status render. Rendering when another control owns focus does not invoke this restoration. It retains the existing native button, Enter/Space behavior and `aria-expanded`. No tactical or campaign rules, CSS, art or save fields change.

Eight built-production cases pass: 390×844 with OS motion off/on, 390×600, 560×780, 620×780 with OS motion off/on and 1366×768 with OS motion off/on. The driver checks Enter expansion, actual focus on the replacement, native wheel scrolling where content overflows, last-stat visibility, Space collapse and Enter reopening without refocusing. Native basic attack spends the initial AP and creates the runtime-derived Essoufflé indicator; native cleric inspection exposes Main Bienveillante. Both richer cards retain focus on activation. Inspection is compared against sampled round/turn/active/mode, HP/AP/positions/statuses and inventory; actual attack is deliberately outside the nonmutation comparison.

The first run, `2252-card-focus`, failed because the new driver expected visible exhaustion text. The runtime displays an icon with an accessible Essoufflé label. The corrected assertion reads `aria-label`; no status runtime behavior changed. That failed receipt remains NOT_ACCEPTED. The final labels run has a SUCCEEDED receipt, stable source/driver/helper/build identity and matching result hash; the owner accepted only its stated scope after reading machine results and selected captures.

Six captures and a compact hash/provenance package are explicitly promoted here. Header content can scroll outside the narrow cap. This proves activation retention and wheel scrolling; it does not certify Tab reachability, keyboard-only scrolling/grid targeting, screen-reader behavior, fallback or overall campaign acceptance. The standalone proof explicitly retains `campaignAcceptance:false`.

The continuous campaign pilot also records native Champion skill menu availability and chooses from runtime pending centers occupied by the desired target, including a boss footprint cell other than its anchor. Native clicks still pass through runtime legality. This diagnostic/cell-selection change does not prove a successful cast by itself. Successful 1323 second-refuge ancestry remains mixed-build; a resumed ending cannot certify one corrected opening-to-ending build.

Subsequent diagnosis found the existing pilot's archer conservation assumption was wrong: `catalog.ts` exposes no skills for tier-0 weapons, and the earned archer has a novice bow. The owner stopped `2252-trial-native-skills` and retained its raw receipt plus `owner-interruption.json` as ABORTED_PILOT_POLICY_DEFECT. The corrected pilot reads native `active.skills`, conserves only for an actually unlocked two-AP archer skill or Salvation with a wounded ally, and recognizes the authored calibrated-shot replacement when available. It also records unavailable native menus. The equipment purchase/equip path and all owner/reload assertions remain unchanged. This other-driver correction occurred after card completion and does not invalidate its unchanged runtime/card-driver/build proof; the compact card package retains its original reviewed diagnostic-driver hash as history. The corrected continuous job has its own provenance and remains gated by terminal proof.

Validation: 159 focused tests across eight suites (103 panel/status/input and 56 management/skill-unlock), 16 receipt tests, TypeScript, production build, 8 LOCKED contracts / 8 video slots, driver syntax and protected/whitespace gates pass. The npm shim on PATH is missing; repository-installed tsc/Vite/Vitest and the package's exact `node tools/contracts/validate-contracts.mjs` script were used. The guardian independently ran contracts:validate via Program Files Node npm. Vite's inherited chunk advisory remains.

Read-only reviews: contracts_focus verifies focus and tactical/assertion authority; focus_ui verifies selected desktop/intermediate/narrow focus/content captures. Both return scoped PASS; full grid/campaign criteria stay open. No claim of quota savings.

## Continuous campaign terminal results

| Job | Terminal disposition | Acceptance |
| --- | --- | --- |
| 2252-card-focus | FAILED; incorrect visible-label assertion | NOT_ACCEPTED |
| 2252-card-focus-labels | SUCCEEDED; eight native card cases | ACCEPTED_SCOPED |
| 2252-recovery-620 | FAILED; actual marais defeat before village recovery | NOT_ACCEPTED |
| 2252-trial-native-skills | ABORTED_PILOT_POLICY_DEFECT; owned process tree stopped | NOT_ACCEPTED |
| 2252-trial-unlocked | FAILED; actual Champion defeat, not a timeout | NOT_ACCEPTED |

The corrected trial ends at round 14 after 69 native actions: 27 attacks, nine moves, one potion, 31 ordinary waits and one healer conservation wait. Champion remains alive with 121/520 HP. Archer, warrior and rogue payloads expose no skills, and their native skill menus are disabled. Marian exposes Salvation, conserves one AP at round 4 while positioned at (6,3), and is knocked out without a cast. This proves the corrected conservation guard's observed behavior; it does not accept healing, skill targeting or an ending. The next pilot diagnosis is healer AP readiness/support positioning before the first dangerous boss action, using actual unlocked skills and native controls.

620 recovery ends in native marais defeat after 50 actions, with two enemies at 40 and one HP. It never reaches the requested village boundary. The successful first-refuge seed contains 130 gold and novice weapons; a 220-gold healer upgrade cannot be assumed affordable there. Both failed receipts have stable execution provenance and empty browser errors. No failed result is an earned continuation seed, and neither failure establishes a balance or deadlock defect. Successful 1153/1323 inputs remain the specified seeds.

`campaign-proof.json` retains terminal receipts, result hashes, input lineage, native availability/action summaries and the owner interruption note. Two explicitly selected failure-boundary captures bring this package to eight images. They are not settled-VFX or successful recovery/ending evidence. All five owned workers are stopped and ports 5268–5270 are closed. The current handoff retains the exact next action and the scope limits.

## Contract compliance

Contract set PRODUCTION-CONTRACTS-LOCK-1/v1. Constitution, index, manifest, AUTONOMOUS_WORK_PROTOCOL, UI_AND_ACCESSIBILITY, COMBAT_AND_VFX, AUTHORING_AND_QA, CAMPAIGN_AND_STATE and PRESENTATION_AND_MEDIA were read. LOCKED rules impacted: focus ownership, truthful presentation, native tactical legality and evidence integrity. Both Git protection gates print nothing; no LOCKED rule changed.

| Row | Status | Evidence |
| --- | --- | --- |
| GAME_CONSTITUTION | PASS | Existing owners and native inputs retained |
| ART_DIRECTION | N/A | No art changes |
| CHARACTERS | N/A | No identity/pose changes |
| ENVIRONMENTS | N/A | No asset/camera changes |
| NARRATIVE / CAMPAIGN | BLOCKED for full item 9 | Continuous recovery/ending/branch gates remain incomplete |
| NARRATIVE_PRESENTATION | N/A | No dialogue, staging or canon changes |
| TRAVERSAL | N/A | No source change; recovery assertion remains separately gated |
| COMBAT | PASS scoped | Existing runtime legal centers/occupants and native execution |
| SAVE | PASS scoped | V6 schema and IDs unchanged; full continuation gated separately |
| UI / ACCESSIBILITY | PASS scoped | Eight native focus/content cases; Tab/full grid/fallback remain open |
| QA_EVIDENCE | PASS scoped | Matching receipts/hashes/captures; failed recovery/ending excluded from acceptance |
| REPOSITORY_GOVERNANCE | PASS at checkpoint | Owned lock, explicit WIP paths, dev-only push; closeout recorded in handoff |

The demo remains IN_PROGRESS. Audio is DEFERRED; the eight video slots/media bytes and the external manual remaster boundary remain unchanged. Current state/handoff records the exact campaign continuation.

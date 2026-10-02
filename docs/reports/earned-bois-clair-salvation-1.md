# Earned Bois-Clair continuation and Salvation correction

| Field | Value |
| --- | --- |
| TASK | DEMO-EARNED-BOIS-CLAIR-SALVATION-1 |
| DOMAIN | Combat truth adapter, campaign QA tooling |
| BASELINE | dev @ ed1bbe38cb659f128ad534d810fbfb2de0577fc2 |
| BRANCH | dev |
| HEAD | 786d760b0e1838440966ecd7833860320af1f6aa (implementation/evidence; later closeout appends QA results) |
| STATUS | Review; scoped correction and second-refuge proof PASS; full demo IN_PROGRESS |
| MERGED_IN | NONE; direct dev checkpoint |
| SUPERSEDES | NONE; extends refuge-autosave-durability-1 |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Existing Salvation authored healing percentage now reaches the tactical skill adapter, including existing upgrade increments |
| CANONICAL_DOCS_UPDATED | docs/project/CURRENT_STATUS.md |
| EVIDENCE | [Compact machine proof](earned-bois-clair-salvation-1-browser/browser-qa.json), eight inspected desktop captures; raw runs remain ignored under tmp/demo |

CURRENT FACT: the exact previously earned first-refuge V6 state continued through native T1 choices, a real marsh victory (46 actions), Bois-Clair defense victory (36 actions), and the second refuge. Opening victory (31 actions) is inherited from the verified prior run. The second-refuge autosave equals the resumed owner state, missionSuccess=true, missionGreed is absent (effective false), and temporary gold=0. Campaign owners resolve all outcomes and rewards. This rescue lineage is accepted only for the recorded desktop scenario. The road battle began before rebuild; the novice party had no Salvation, and village combat loaded the corrected build after rebuilding. A separate corrected-build replay is recorded independently rather than silently relabeling this run.

CURRENT FACT: getSpec omitted healPercent even though the authored Salvation definition already specifies40%, then55%/70% for its two existing upgrades. The minimal adapter correction carries that field into existing preview/resolution code. Three tests fail before and pass after the correction. A built-production standalone native cast heals52/75HP to75/75HP (clamped40% maxHP), consumes2AP (3→1), and leaves the caster selected. The former fallback would heal only4HP. This standalone default-party proof certifies the skill correction; it is separate from earned campaign acceptance. Native second-refuge rest, purchase and equip of the existing sacred crosier are observed in the ending continuation, without inventory or resource injection.

The reusable continuous driver requires an exact earned V6 save and successful prior proof, records their hashes, and supports rescue/sacrifice plus serpent/trial intent through existing choices. It checks refuge owner facts and reload equality, requires native Salvation when requested, and waits for terminal UI after ending reload. Harness corrections accommodate fewer than four living deployable members, zero-AP native Wait, nullable targeting, canvas hover validation and movement detours. Preliminary failures are retained in ignored folders; they are harness failures, not campaign acceptance. No force-win, fixture owner state, synthetic rewards or runtime methods resolve battles.

Validation:142 narrative/content/finale tests and175 focused combat/management tests PASS; TypeScript, production build and8-contract/8-slot validator PASS. The build retains the known chunk-size advisory. LOCKED documents remain byte-unchanged. Existing eight MP4s are retained; no generation or audio work occurred.

| Compliance | Status | Evidence and limits |
| --- | --- | --- |
| GAME_CONSTITUTION | PASS | Existing tactical owner resolves healing and campaign outcomes |
| ART_DIRECTION | PASS | No art or style changes |
| CHARACTERS | PASS | V2 assets unchanged |
| ENVIRONMENTS | PASS | Authored production surfaces retained |
| NARRATIVE / CAMPAIGN | PASS | Existing choices and durable IDs; exact earned-state lineage |
| NARRATIVE_PRESENTATION | PASS | Existing dialogue/Journey/cinematic handoffs exercised; no new canon |
| TRAVERSAL | PASS | T1 native branch into Bois-Clair; accepted T0/T1/T3 architecture retained |
| COMBAT | PASS | Authored40%/55%/70% adapter tests and native40% cast |
| SAVE | PASS | V6 schema unchanged; exact second-refuge autosave/reload |
| UI / ACCESSIBILITY | PASS | Scoped native keyboard/canvas desktop controls; wider demo/mobile/motion acceptance pending |
| QA_EVIDENCE | PASS | Ignored unique raw runs; explicit immutable eight-capture promotion |
| REPOSITORY_GOVERNANCE | PASS | Exclusive Codex lock, dev/WIP only; protected main/contracts/media |

Contract set:PRODUCTION-CONTRACTS-LOCK-1/v1. Read: constitution and all eight LOCKED contracts, plus T0 production authority. No LOCKED rule was changed. Final artistic remaster remains EXTERNAL_MANUAL_WORKSTREAM; prologue/refuge/Alistair decisions remain unactivated; audio DEFERRED.

CURRENT FACT at closeout: the earned second-refuge continuation wins the Serpent boss through61 native actions over8 rounds and reaches lion-seal-serpent-truth. Terminal UI settles, contains no dialogue/combat/Traversal surface, and V6 autosave/reload equals the completed owner state. Both terminal captures were inspected and promoted, giving eight selected captures. These outcome/reload checks PASS. The run's additional campaign-Salvation requirement FAILS because the cleric was KO before using the skill. Its older executing driver leaves raw pass=true alongside failure; the compact proof normalizes overall pass=false. The committed driver now clears pass on every caught failure and rejects prior proofs containing failure. Raw historical output remains unchanged. No successful campaign-native Salvation cast is claimed.

The independent corrected-build replay wins the marsh in8 rounds/46 actions but loses Bois-Clair with only Alistair and Cedric deployable (17 actions). Potion/revive supplies were exhausted and three members were KO after the road. This is a real strategy/preparation failure; it is not evidence of a Salvation regression because no novice-party skill cast occurred. The earlier successful lineage remains a separate recorded scenario; deterministic route/balance acceptance is incomplete. Next QA must examine native preparation and the real defeat return without injecting an outcome or altering balance to pass the driver.

Sacrifice/trial, mobile/reduced-motion combat, defeat recovery, full balance and final authored VFX remain item9. Inspected victory captures also show an attack banner above the result modal; establish whether it persists after settling before treating that as a presentation defect.

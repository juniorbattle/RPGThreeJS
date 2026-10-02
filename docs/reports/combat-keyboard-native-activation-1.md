# Native combat control activation

| Field | Value |
| --- | --- |
| TASK | DEMO-QA-POLISH / combat keyboard activation |
| DOMAIN | Combat input presentation, accessibility, QA tooling |
| BASELINE | dev @387dd732b3578b3e0ff620ff7e6c3cf5c01a8fe8 |
| BRANCH | dev |
| HEAD | c05ba67bd2823db16d80638d4aff3d1ba74b0052; reviewed source payload verified against committed blobs |
| STATUS | Review; scoped production PASS |
| MERGED_IN | NONE; direct authorized dev checkpoint |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Focused native controls no longer also execute a global tactical shortcut |
| CANONICAL_DOCS_UPDATED | docs/project/CURRENT_STATUS.md; docs/autonomy/QA_JOB_CONTINUITY.md; current autonomy state/handoff |
| EVIDENCE | combat-keyboard-native-activation-1/checks.json and ten explicitly selected captures |

CURRENT FACT: on the previous production build, Enter on the focused Attaquer button changed the active unit from Archère (player, AP1, menu) to Brigand (foe, AP1, AI). The global Enter shortcut ended the turn before the native button activation. The baseline was reproduced using ordinary standalone deployment and keyboard input, without tactical mutation or injected outcomes.

The input listener now respects already handled events and reserves interactive controls, their descendants and editable content for their native handlers. Escape still cancels targeting/movement when unclaimed; BODY and the battlefield retain existing shortcuts. The change does not compute AP, damage, status, outcome, resources or campaign state. Before editing the legacy-named production owner, its25 source/test/tool/doc references were inventoried; none were removed.

Six fresh built-production cases pass at1366×768,620×780 and390×844, each with normal and OS-reduced motion emulation. Enter/Space opens Attack and its native charge choice without changing unit/AP/round/turn/HP; Escape cancels targeting. Attack, skill and item Retour preserve the turn. BODY A/M work, and native Attendre advances exactly one turn. Focus and tested control bounds were checked; the three selected final captures were inspected.13 routing tests,42 runtime regression tests,3 shell tests,16 RunSystem tests and7 migration tests pass (81total), alongside16 receipt tests, TypeScript, the production build,8contracts/8slots, syntax and Git gates.

The continuous campaign pilot also fixes two observed harness failures: compare DOM text instead of CSS-transformed innerText for Prendre la route; compare persisted JSON values rather than an in-memory object containing omitted undefined fields. Assertion failures and provenance drift remain failures. A public, validated1–45minute timeout is recorded in receipts (default25;35 for this run). A prior Champion run was still progressing at its25minute limit: round8,74/520HP remaining and all four player units alive. This diagnoses the harness bound, not campaign balance.

## Scoped compliance

Orchestrator matrix, verified independently by contracts-guardian. Contract set PRODUCTION-CONTRACTS-LOCK-1/v1; no LOCKED rule changed, backed by silent Git gates and the8contract/8slot validator.

| Row | Status | Evidence |
| --- | --- | --- |
| GAME_CONSTITUTION | PASS | Input routing only; no new truth owner |
| ART_DIRECTION | N/A | No art change |
| CHARACTERS | N/A | No identities, poses or masters changed |
| ENVIRONMENTS | N/A | No asset changes |
| NARRATIVE / CAMPAIGN | PASS | No canonical dialogue, choice, outcome or resource change |
| NARRATIVE_PRESENTATION | N/A | No tableau or cinematic change |
| TRAVERSAL | PASS | Mobile failed-T1 cleanup and departure agency; no rollout or authoring change |
| COMBAT | PASS | Native activation and exactly-one Wait; resolution owners unchanged |
| SAVE | PASS | No schema change; exact mobile V6 recovery/reload and preserved autosaved facts |
| UI / ACCESSIBILITY | PASS | Scoped native focus/control behavior at three widths |
| QA_EVIDENCE | PASS | Receipt/result/driver/helper/build/source provenance reviewed |
| REPOSITORY_GOVERNANCE | PASS | dev, explicit snapshots/proof selection, historical outputs preserved |

Authorities read: constitution, contract index/manifest, AUTONOMOUS_WORK_PROTOCOL, CAMPAIGN_AND_STATE, COMBAT_AND_VFX, UI_AND_ACCESSIBILITY, AUTHORING_AND_QA, PRESENTATION_AND_MEDIA; related TRAVERSAL/WORLD contracts preserve unchanged scope. The direct validator was used because the host npm CLI is missing its npm-cli.js. This is an inherited environment failure, not a failed contract validator.

## Limits and campaign continuation

The standalone evidence explicitly keeps campaignAcceptance=false. OS emulation here does not certify effective visual reduction or unavailable-media fallback. Full grid targeting with the keyboard, full combat accessibility, authored VFX, sacrifice route and balance remain open. Transition/early-impact captures are not treated as settled VFX acceptance. Exactly eight existing videos and protected art remain; artistic remaster is external/manual, audio deferred, and operator canon/slot decisions remain open.

CURRENT FACT: the390×844OS-only recovery is independently accepted. From the exact successful1153first-refuge lineage, the marais battle wins in6rounds/43actions; Bois-Clair then loses through15native Wait inputs over8rounds. Native keyboard acknowledgement returns to the first-refuge T1 departure. The recovered V6 matches the owner rule and reload exactly:105temporary gold plus red_gem/iron_ore are removed, failed T1 is removed, T0 and17autosaved fields outside run/currentNodeId remain unchanged. T3 was already absent; this proves its absence afterward, not cleanup of a preexisting T3. Prendre la route is visible, enabled, non-inert and focused before/afterreload, with zero document overflow; three recovery captures were inspected. No outcome or owner state was injected.

The corrected1366×768normal-motion recovery is independently accepted: marais victory33actions/4rounds, Bois-Clair defeat17nativeWait/8rounds, the same exact V6 owner/reload/loot/T1/T0 assertions, and visible focused departure with zero overflow. Its own terminal receipt and three captures were reviewed by the orchestrator and the same contracts-guardian, with two captures selected. The620×780run lost in marais before the requested Bois-Clair boundary, so the requested recovery is NOT_ACCEPTED. Champion remains independently bounded; its terminal outcome is in the handoff. Interrupted or failed attempts cannot seed certified continuation. The demo remains IN_PROGRESS.

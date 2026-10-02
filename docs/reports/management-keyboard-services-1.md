# Management keyboard and service checkpoint

| Field | Value |
| --- | --- |
| TASK | DEMO-QA-POLISH / MANAGEMENT-KEYBOARD-SERVICES-1 |
| DOMAIN | UI/accessibility; management-owner boundary QA |
| BASELINE | dev @ e9df0f6047c0e983d5218152caf41f100705e301 |
| BRANCH | dev |
| HEAD | c861f903c12283e6d89fad53d1b9bf7d0a2633af (implementation); report delivery follows on dev |
| STATUS | Implemented checkpoint; scoped PASS; full demo remains IN_PROGRESS |
| MERGED_IN | Direct dev checkpoint, no main merge |
| SUPERSEDES | NONE; extends refuge-keyboard-focus-1 without changing its historical proof |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Native item details, contextual service names, equipment preview return focus and visible focus scrolling |
| CANONICAL_DOCS_UPDATED | docs/project/CURRENT_STATUS.md; docs/content/DEMO_CONTENT_MAP.md; autonomy state pair |
| EVIDENCE | [Final twelve-case proof](management-keyboard-services-1-browser/browser-qa.json), six selected captures below; extra reruns remain ignored |

2026-10-02 CURRENT FACT: ManagementView still calls the existing management owners for equipment, transactions, crafting and upgrades. No game rule, canonical choice, resource rule, save schema, character/environment asset or cinematic slot changed.

## Observed defects and resulting behavior

Three regression tests failed against the original source: details were clickable DIVs outside native Tab/Enter navigation; preview Retour focused the equipment-dialog close control rather than the replacement; weapon transactions had no contextual accessible name. The shared detail-row click owner also received bubbled transaction clicks. Details now have a separate native button beside the transaction, with no nested buttons or shared click owner.

Trade, forge, skill upgrade, consumable target/use and equip-confirm names use catalog/runtime context. Preview Retour restores the matching replacement while preserving the outer equipment-slot return. Details expose a visible two-pixel outline with four-pixel offset; native scroll margin/padding keeps its full six-pixel footprint inside the viewport and clipping ancestors. Focus state remains transient.

An initial four-case 620px geometry failure measured entry animation before it settled; waiting for fonts and finite panel animations resolved that timing issue. Visual inspection then separately found the bottom outline edge clipped despite a valid button box. The scroll-margin correction and expanded outline checks address that actual presentation defect. No QA scrollIntoView or forced scroll hides it.

## Verification

- 80/80 focused tests across seven suites: ManagementView8, management56, reputation3, ExplorationView6, RefugePresentation3, RefugeBackgroundReadiness2, CampaignStatusHud2.
- TypeScript, eight-contract/eight-slot validator, production Vite build and exactly eight shipped MP4s PASS. Only the inherited chunk-size advisory appeared.
- Final 12/12 built-production cases: first and second refuge ×1366x768/620x780/390x844 ×normal/OS reduced motion, normal game graphics. Driver: `tools/refuge-production-accessibility-qa.mjs`; source output: `tmp/refuge/management-services-0723-ring-final`.
- Actual Tab, Enter and Space open details; Escape restores the same item and shell inertness. Preview/Retour leaves authoritative state identical; confirm equips through the owner and restores the slot.
- Actual purchase of potion and weapon, weapon sale, crafting and two capped unlocked-skill upgrades match cloned authoritative owner results, including stock, wallet, permanent/temporary inventory, health, equipment and skill upgrades. Exhausted craft and capped upgrade become disabled. Rest, autosave, V6 reload and departure remain verified.
- Focus and full outline bounds, native button structure, accessible names and browser diagnostics checked; zero unexpected errors. Six final captures manually inspected. Protected committed/working-tree LOCKED gates and whitespace PASS.

These are isolated prepared V6 service scenarios. They do not certify an earned campaign, combat balance, all management accessibility or the full demo. Consumable-use labels are unit-tested; use itself remains outside this browser flow. Failed-background coverage remains in the earlier refuge-focus proof; this change does not alter background handling. No previous evidence was overwritten.

## Selected final captures

| State | Capture |
| --- | --- |
| Native inventory focus, desktop | [1366x768](management-keyboard-services-1-browser/inventory-focus-1366x768.png) |
| Full focus outline, intermediate OS reduce | [620x780](management-keyboard-services-1-browser/inventory-focus-620x780.png) |
| Preview Retour focus, mobile | [390x844](management-keyboard-services-1-browser/preview-return-390x844.png) |
| Inventory detail modal, mobile | [390x844](management-keyboard-services-1-browser/inventory-details-390x844.png) |
| Owner-resolved forge result, desktop | [1366x768](management-keyboard-services-1-browser/forge-owner-result-1366x768.png) |
| Owner upgrade cap, mobile | [390x844](management-keyboard-services-1-browser/upgrade-cap-390x844.png) |

## Contract compliance

Contract set v1, `PRODUCTION-CONTRACTS-LOCK-1`, baseline `b1e8858`. Read constitution, README/manifest, AUTONOMOUS_WORK_PROTOCOL, WORLD_AND_CHARACTERS, CAMPAIGN_AND_STATE, PRESENTATION_AND_MEDIA, UI_AND_ACCESSIBILITY and AUTHORING_AND_QA. COMBAT_AND_VFX/TRAVERSAL were also read for the independent continuous QA driver; no implementation in those domains is accepted by this report.

| Row | Result | Evidence |
| --- | --- | --- |
| GAME_CONSTITUTION | PASS | Existing truth/presentation boundary and progression preserved |
| ART_DIRECTION | PASS | Shared palette and layout retained; no art modification |
| CHARACTERS | PASS | V2 asset bytes retained |
| ENVIRONMENTS | PASS | Existing background owners unchanged |
| NARRATIVE / CAMPAIGN | PASS | No dialogue/choice/ID/outcome edit; owner-resolved services |
| NARRATIVE_PRESENTATION | PASS | Existing surfaces/media conserved |
| TRAVERSAL | PASS | No runtime modification; temporary/permanent loot boundary preserved |
| COMBAT | PASS | No tactical/Stage/VFX source change |
| SAVE | PASS | V6 owner truth survives reload; focus never serialized |
| UI / ACCESSIBILITY | PASS | Scoped native keyboard, names, focus restoration and full outline proof |
| QA_EVIDENCE | PASS | Final production matrix, machine geometry and six inspected immutable captures |
| REPOSITORY_GOVERNANCE | PASS | Dev checkpoint/push verified, WIP temporary-index backups, LOCKED gates silent |

No LOCKED rule changed. Six video candidates stay unaccepted/external; exactly eight production videos remain. Audio DEFERRED; prologue/refuge extension and Alistair decisions untouched. Next work is continuous earned-chronicle campaign/combat/VFX acceptance.

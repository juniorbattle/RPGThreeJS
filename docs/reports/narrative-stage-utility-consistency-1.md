# NARRATIVE-STAGE-UTILITY-CONSISTENCY-1

## Baseline and scope

- Repository: `juniorbattle/RPGThreeJS`
- Baseline: `main` at `a592ce641b666dc679bf5cd7be67a797ae14f449`
- Branch: `narrative-stage-utility-consistency-1`
- Scope: existing Journey/NarrativeStage Company, Save, and Menu utilities. No campaign topology, dialogue, ManagementView, save schema, combat, or Traversal rule changed.

## Root cause and authority

The suspected chain was confirmed. Ordinary Journey passed `request.secondary` through `planJourneyBoundary` and `JourneyAgencyPresentation.secondary`. The separate `presentationOnly` branch in `JourneyCampaignBoundary.present()` constructed a new agency object without `secondary`. `JourneyOverlay.secondaryBar` was consequently hidden and empty, so `NarrativeStage.requestAgency()` had no actions to mount in `NarrativeUtilityDock`.

A second omission blocked recovery even if buttons were restored: the presentation-only outcome mapped every non-Continue commit to `aborted`. GameApp's departure caller therefore had no way to handle Company, Save, or Menu and resume the same boundary.

Authority remains `GameApp` → `JourneyCampaignBoundary`/`JourneyAgencyPresentation` → `JourneyOverlay` → `NarrativeStage`/`NarrativeUtilityDock`. The overlay reports `{ kind: 'secondary', id }`; `GameApp.handleJourneySecondary()` alone opens Clan, saves manually, or renders Title. Route commitment remains in `GameApp.commitRunNodeChoice()`.

## Implementation and visibility policy

`withPresentationOnlyContinuation()` now derives the local Continue presentation from the planned Journey agency, preserving utilities and context while replacing route choices with `Prendre la route`. Presentation-only secondary outcomes remain secondary outcomes. The boundary disposes its committed session, then the existing GameApp handler runs. Company and Save re-present the same local request from unchanged route state because `JourneyOverlay` intentionally latches and disposes on any commit. Continue still waits for the covered Traversal handoff and carries no RunNode ID.

The utility policy follows player agency. `NarrativeStage.requestAgency()` mounts the dock only when the overlay has visible secondary actions. Absent actions yield no dock. Surface preparation, dialogue binding/step activation, cinematic hold, transition, global handoff, agency commit, and disposal remove it. The dock moves the original action element; it creates no buttons or gameplay handlers.

| State / surface | Utilities | Owner | Mount action | Dispose action |
| --- | --- | --- | --- | --- |
| Ordinary single, branch, route choice, departure, presentation-only Continue | Yes, when `secondary` is supplied | JourneyOverlay + NarrativeStage dock | `requestAgency()` moves `secondaryBar` to utility layer | Single commit, successor presentation, or stage dispose |
| Static tableau, TravelStill, or held visual with active Journey agency | Yes, when `secondary` is supplied | Same | `requestAgency()` after visible readiness | Same |
| Cinematic playback/beat, opaque reveal, hold before agency | No | NarrativeStage media/readiness | None | Surface preparation/hold clears prior dock |
| Dialogue line or dialogue choice | No | DialogueView + NarrativeStage | None | Bind/activate clears prior dock |
| Management, title, combat, Traversal | No | Their existing owners | None | Journey/Stage disposal at handoff |

`NarrativeUtilityDock` removes its previous element before a successor mount and removes role/label metadata on disposal. `JourneyOverlay` retains its existing single-commit latch, disabled-action behavior, focus restoration, and inert disposed buttons.

## Post-Alaric production-component proof

One browser path starts at the Lion camp, commits the audience node, plays through Alaric's actual dialogue and its mission choice, and reaches the reviewed departure tableau. The dialogue has no utility dock; the departure has `COMPANY`, `SAVE`, and `MENU` alongside `Prendre la route`. At that point the route node is `lion-audience`, `stepCounter` is 1, and `resolvedNodeIds` contains `lion-audience`.

A separate deterministic resolved-audience fixture invokes the normal `enterCampaignPresentation()` production path for repeatable interaction and mount counts below. Its starting `stepCounter` is 0 because fixture setup does not perform the camp-to-audience route commit.

| Observation | Before Company | After Company return | After Save | After Continue |
| --- | --- | --- | --- | --- |
| Run node | `lion-audience` | same | same | same until physical node handoff |
| `stepCounter` | 0 | 0 | 0 | 0 |
| `resolvedNodeIds` | `lion-audience` | same | same | same |
| Available routes | `lion-opening-ambush` | same | same | same |
| Mode | NARRATIVE | NARRATIVE | NARRATIVE | NARRATIVE / Traversal owner |

Company opened the existing Clan ManagementView with `returnToTravel = false`; closing it made one autosave and rebuilt the same departure stage, utilities, and Continue control. Save made exactly one manual save. The one-use overlay requires a same-boundary rebuild after Save; no route state changed. Menu used `renderTitle()` and left no NarrativeStage, Journey overlay, utility dock, or TravelView mounted. The Company/Save/Continue path counted three sequential Stage and dock mounts, **one maximum concurrent** Stage/dock/agency, one Traversal mount, zero TravelView mounts, zero route commits, and zero node resolutions. Autosaves: two (departure and Management close); manual saves: one.

## CampaignStatusHud and responsive QA

Chromium checks at 1440×810, 1366×768, 620×780, and 390×844 found all three buttons enabled and fully inside the viewport; no utility/HUD or utility/agency-card intersection; no document or dock overflow. The 390px HUD was checked with route gold 0 and 40. Desktop retains HUD upper-left, utilities upper-right, agency lower-right. At 390px the dock sits just below the HUD and uses compact readable labels. The stage/world remains visually dominant. Browser lifecycle checks found zero docks during a dialogue step and cinematic presentation.

Screenshots and machine-readable measurements are in [narrative-stage-utility-consistency-1-browser](./narrative-stage-utility-consistency-1-browser/), especially `ordinary-1440.png`, `branch-1440.png`, `departure-1440.png`, `post-management-1440.png`, `departure-620.png`, `departure-390.png`, and `browser-qa.json`. The repeatable runner is `tools/narrative-stage-utility-consistency-1-qa.mjs`.

## Validation and guards

- Focused JourneyOverlay/Session, NarrativeStage/Dock, JourneyCampaignBoundary/adapter, campaign presentation migration, T0 rollout, campaign grammar, Management, and NarrativeStage integration: **179/179 passed** across 11 files.
- Full Vitest: **2,537/2,537 passed** across 152 files.
- TypeScript `tsc --noEmit`: passed.
- Production Vite build: passed (existing large-chunk advisory only).
- Browser QA: passed, including Company return, Save, Menu, and Traversal continuation.
- `git diff --check`: passed.
- Historical guard baselines and exact-path allowlists: unchanged; all guard tests passed.

## Remaining caveats

Browser QA loads the real production components through Vite with a test-browser-only GameApp reference; the production bundle is separately build-validated. Operator runtime and visual review remains the handoff after push.

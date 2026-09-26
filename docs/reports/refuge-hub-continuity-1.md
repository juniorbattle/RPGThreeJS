# REFUGE-HUB-CONTINUITY-1

## Baseline and scope

- Repository: `juniorbattle/RPGThreeJS`
- Base: `main` at `d5774943ecec8dd0aaac7bd3fa7903d238831118`
- Branch: `refuge-hub-continuity-1`
- Scope: the two interactive refuge hubs, their presentation mapping, and their shared HUD lifecycle. `ManagementView`, run rules, save schema, and the final story refuge were not redesigned.

## Root cause and implementation

`ExplorationView` previously hardcoded “Refuge du Lion” over the generic `forest-dawn-far.webp` background. Its wrapping flex action row and `margin-left: auto` continuation produced variable grouping and possible wrapping. The view now receives a `RefugePresentation` resolved from the canonical `RunNode`. This data contains only identity, descriptive copy, environment context/role, visual family, and an optional authored gathering ID; gameplay values still come from `GameApp` and the existing management functions.

| Interactive node | Canonical title | Visual family | Hub environment context |
| --- | --- | --- | --- |
| `lion-first-refuge` | Refuge du Lion | `FIRST_REFUGE` | `dialogue:first_refuge_gathering` |
| `lion-second-refuge` | Dernier feu du Lion | `SECOND_REFUGE` | `node:lion-second-refuge` |

The resolver first requires `node.type === 'refuge'`; it returns no hub presentation for `lion-final-refuge`, whose canonical type remains `story`. The optional gathering slot reads the existing `CLAN_ANCHOR_DIALOGUES` authority. There is still no authored pre-management second-refuge gathering ID, so the existing `ate_bois_clair_night_watch` remains after node resolution and does not replay.

## Environment and dialogue continuity

The operator supplied the existing clean production plate at `public/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/first-refuge-tableau.png` as the canonical first-refuge environment. Its SHA-256 is `3103897cabf43ef86ba370a8de0c97d827878967e340c8d34231cee08a273c62`, matching the production manifest. The asset was already promoted; its PNG bytes were reused without regeneration or reprocessing.

A single scoped `dialogue:first_refuge_gathering` binding now points to that promoted `first_refuge_tableau` asset. `CAMPAIGN_GRAMMAR_PRESENTATIONS.first_refuge_gathering` and the first interactive hub resolve that same context and URL. Existing `FIRST_REFUGE` node and post-node ATE mappings were not replaced globally. Chromium inspected the rendered gathering environment layer and hub background: both use `/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/first-refuge-tableau.png`.

The second hub uses the existing `SECOND_REFUGE` `HOLD_SOURCE` plate at `/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/second-refuge-night-tableau.png`. Its title comes from the runtime node label, not the composited preview title.

## Background readiness correction

The initial second-refuge 1440 capture exposed the dark CSS fallback even though `--refuge-background` contained the correct URL. The hub now starts loading its resolved `presentation.background` before the arrival or gathering surface is disposed. A small `Image` load/decode helper records readiness and decoded dimensions for either refuge plate. `ExplorationView` keeps the hub hidden and inert until that request settles, then exposes it with `data-background-ready` and decoded dimensions. Its `open()` Promise still resolves only when the player chooses one of the existing actions. The same cached result is reused when returning from ManagementView or Rest.

If loading or decoding fails, or the request stalls for ten seconds, the hub becomes usable with its existing dark background fallback and a `data-background-error` reason. No loading screen or extra HUD was introduced. The browser QA now checks the runtime ready state, independently decodes the URL in Chromium, confirms positive matching dimensions and the visible surface, and records `backgroundUrl`, `backgroundReady`, `naturalWidth`, and `naturalHeight` in its JSON for both refuges. On the refreshed initial captures, each plate decoded at **1672×941**. The initial second-refuge 1440 screenshot visibly shows its camp environment; the post-management 1440 and 390 captures do as well. The first-refuge 1440 composition remains unchanged.

## HUD, actions, and state semantics

`GameApp` passes its one existing `CampaignStatusHud` instance into `ExplorationView`. The gathering dialogue hides it under dialogue policy. The hub mounts that same element with the existing `journey` layout; closing the hub removes it with owner-aware cleanup. Management owns its existing resource display while open. Returning to the hub remounts the same HUD element. No refuge-specific HUD, resource bar, or top menu was added.

The older T0 completion QA script's refuge-only HUD assertion was updated from zero to exactly one. Its gathering-dialogue zero-HUD assertion and historical evidence files remain unchanged.

The five action IDs remain `clan`, `shop`, `skills`, `rest`, `continue`. The visible labels are Clan, Shop, Amélioration, Repos, and Reprendre la route. Desktop uses a fixed five-column grid with a stronger continuation button; widths below 1100 px use two utility columns and a full-width continuation row. Local gradients support copy and buttons while leaving the environment visible.

`getRestCost()`, `getWoundedUnitCount()`, `restUnits()`, and `secureRunLoot()` remain authoritative. The UI shows disabled healthy Rest, enabled wounded Rest when affordable, and disabled Rest with an explicit gold shortfall. After Rest, the same hub returns with feedback and disabled Rest once fully healed. Secured-gold feedback shows the actual amount on initial entry and `+0` on sub-action returns as the existing loop resets `securedGold` to zero. Clan, Shop, Skills, and Rest do not resolve the node; Continue does.

## Browser QA and production flow

Runner: `node tools/refuge-hub-continuity-1-qa.mjs`. Evidence: [machine-readable QA](./refuge-hub-continuity-1-browser/browser-qa.json) and 15 PNG captures in the same directory. Representative captures include [first desktop](./refuge-hub-continuity-1-browser/first-refuge-1440.png), [first post-Rest](./refuge-hub-continuity-1-browser/first-refuge-post-rest-1440.png), [first post-management](./refuge-hub-continuity-1-browser/first-refuge-post-management-1440.png), [first 620 px](./refuge-hub-continuity-1-browser/first-refuge-620.png), [first 390 px](./refuge-hub-continuity-1-browser/first-refuge-390.png), [second desktop](./refuge-hub-continuity-1-browser/second-refuge-1440.png), and [second 390 px](./refuge-hub-continuity-1-browser/second-refuge-390.png). Separate captures cover wounded Rest, post-Shop, post-Skills, second-refuge management return, and the actual gathering/hub/post-node flow.

At 1440×810, 1366×768, 620×780, and 390×844, the runner asserts one hub, one HUD, five actions, no duplicate resource or top navigation, no horizontal overflow, no action/action or action/HUD intersection, no clipped labels, and all actions plus HUD inside the viewport. The disabled Rest button is a real disabled button, and Continue remains enabled. Management return never mounted TravelView and never exceeded one hub or HUD.

The production-flow segment loads a committed first-refuge save fixture built through `RunSystem`, then uses the actual application UI: arrival → `first_refuge_gathering` → hub → Clan → hub → Shop → hub → Rest → hub → Continue → existing post-node narrative → Journey. No narrative or management methods are mocked in that segment. At the initial hub, `currentNodeId` is `lion-first-refuge`, `stepCounter` is 6, the refuge is unresolved, 25 gold was secured into `state.gold` (120 → 145), route loot is 0, and one unit is wounded. Clan and Shop return without changing the node, step, or resolved set. Rest spends the existing 15-gold cost (145 → 130), heals the unit, and leaves the node unresolved. Continue adds the refuge to `resolvedNodeIds`; later authored narrative retains its own consequences. The observed maxima were one HUD, one hub, and zero TravelView mounts.

## Validation

- Focused refuge, shared HUD, campaign grammar, T0 production rollout, campaign presentation migration, R6 full-route, and historical cinematic guards: **12 files, 206 tests passed**.
- Background-readiness focused rerun, including ExplorationView, RefugePresentation, refugeHubContinuity, CampaignStatusHud, campaign grammar, and the CIN-6E-A guard: **7 files, 41 tests passed**.
- TypeScript `tsc --noEmit`: passed.
- Production Vite build: passed. The existing large-chunk advisory remains.
- Full Vitest with four maximum workers: **160 files, 2,562 tests passed** after adding the readiness tests.
- Scoped Chromium QA: passed with no page errors.
- Historical T0 browser completion guard: passed from a copied arrival checkpoint in ignored temporary output; recorded historical evidence files were untouched.
- `git diff --check`: passed.

The historical CIN-6E-A file guard now includes the exact `src/game/refugeHubContinuity.test.ts` path, which was already committed at this branch's starting HEAD. Its baseline hash and protection assertions were not changed.

## Remaining visual and content caveats

The explicitly supplied clean first-refuge plate depicts the same Lion camp as gathering and hub, but differs from the composited concept: its central ground is unoccupied and its fires are at the sides. The gathering stages company members over that plate; the hub uses the clean environment alone. The second refuge still lacks an authored pre-management gathering, so none was invented or moved ahead of management.

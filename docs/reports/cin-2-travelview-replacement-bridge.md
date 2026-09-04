# CIN-2 — TravelView Replacement Bridge

**Date:** 2026-09-03
**Status:** Implemented, tested, validated in a real browser. **Not committed. Not pushed.**
**Scope:** Presentation bridge only. No campaign, gameplay, narrative, combat, or save change.

---

## 1. Baseline

| Item | Value |
|---|---|
| Branch | `main` |
| CIN-2 baseline HEAD | `1dabf25369216db0d1713d4b17529d52a082c6b3` |
| Baseline commit | `CIN-1 — Cinematic Journey Runtime Foundation` |
| Parent baseline | `7bcf0b289806a3ece30fcbf6b07adc17cc5772a2` |
| `HEAD == origin/main` before edits | YES |
| Worktree before edits | Clean — no modified, no staged, no untracked |

CIN-1 was verified present: `CinematicPlayer.playHeld()`, `JourneySession`, `JourneyOverlay`, `JourneyTypes`, `CinematicPreloader`, all 10 QA scenarios/tests, and the CIN-1 report.

---

## 2. Audited old campaign flow

The pre-CIN-2 authoritative production flow was:

```
getAvailableRunNodes(state)
  → TravelView (onSelect)
  → GameApp.chooseRunNode(node)
  → enterRunNode(run, node.id)
  → state.currentNodeId / visitedNodeIds / seenUniqueEvents / stepCounter
  → resolveRunNode(node, false)
  → dialogue / combat / refuge / event / shop / boss
  → markResolved + playPostNodeNarrative (ATE → R4)
  → enterTravel()
  → TravelView
```

Every `enterTravel()` / `showTravel()` call was classified:

| Call site | Semantic purpose |
|---|---|
| `chooseRunNode` → `enterTravel()` | Node entry failed (unavailable) |
| `resolveRunNode` refuge loop exit | Normal post-refuge presentation |
| `resolveRunNode` shop exit | Normal post-shop presentation |
| `resolveRunNode` event/mystery/recruitment | Normal post-node presentation |
| `resolveRunNode` already-resolved guard | Fallback for re-visited node |
| `flushPendingCombat` no-combat fallback | Combat-less event completion |
| `resolveCombat` defeat | Combat failure return |
| `resolveCombat` boss victory | Post-finale presentation |
| `resolveCombat` normal victory | Post-combat presentation |
| `startNewChronicle` | New chronicle start |
| `continueChronicle` → `showTravel()` | Reload/continue mount |
| `openManagement` → `showTravel()` | Management return (TravelView's own Company button) |

All 12 `enterTravel()` calls and 2 `showTravel()` calls were redirected to `enterCampaignPresentation()` or removed (replaced by the facade's travel branch / failure fallback). `openManagement`'s `showTravel()` remains for TravelView's own Company button only.

---

## 3. Files changed

### Modified (2 files, +223 / −65)

| File | +/− | Change |
|---|---|---|
| `src/game/GameApp.ts` | +223/−65 | JOURNEY mode, campaign presentation facade, authoritative commit path, Journey boundary loop, secondary actions, failure fallback, continue/reload, dispose wiring |
| `src/ui/TravelView.ts` | +8/−35 | Replaced private `routePresentation`/`NODE_PRESENTATION` with shared `runNodePresentation` from `RunNodePresentation.ts` |

### Added (11 files, 1852 lines)

| File | Lines | Role |
|---|---|---|
| `src/ui/RunNodePresentation.ts` | 55 | Shared pure route-presentation semantics |
| `src/journey/JourneyPresentationPolicy.ts` | 38 | PURE presentation policy (`?journey=cinematic\|travel`, DEV-only) |
| `src/journey/JourneyRunNodeAdapter.ts` | 105 | PURE RunNode → Journey presentation adapter |
| `src/journey/JourneyPresentationResolver.ts` | 98 | PURE presentation resolver (empty production map) |
| `src/journey/RouteCommitGuard.ts` | 39 | PURE route-commit authorization guard |
| `src/journey/JourneyCampaignBoundary.ts` | 122 | Campaign boundary controller (one session per boundary) |
| `src/journey/JourneyPresentationPolicy.test.ts` | 60 | 7 tests |
| `src/journey/JourneyRunNodeAdapter.test.ts` | 127 | 9 tests |
| `src/journey/JourneyPresentationResolver.test.ts` | 83 | 7 tests |
| `src/journey/RouteCommitGuard.test.ts` | 67 | 6 tests |
| `src/journey/JourneyCampaignBoundary.test.ts` | 240 | 10 tests |
| `src/game/cin2CampaignBridge.test.ts` | 232 | 14 tests |

No binaries. No generated artifacts. No production cinematic data.

---

## 4. Final campaign presentation architecture

```
GameApp
  │
  ├── enterCampaignPresentation()           ← ONE semantic boundary
  │     ├── usesJourneyPresentation()       ← policy + failure latch
  │     ├── enterJourney()                  ← DEV ?journey=cinematic
  │     │     └── runJourneyBoundary()
  │     │           ├── JourneyCampaignBoundary.present()
  │     │           │     ├── JourneyPresentationResolver  (empty production map)
  │     │           │     ├── JourneySession (CIN-1)
  │     │           │     ├── JourneyRunNodeAdapter         (real RunNodes → choices)
  │     │           │     └── CinematicPreloader             (mapped candidates only)
  │     │           ├── commitRunNodeChoice(id)             ← ONE authoritative path
  │     │           │     └── RouteCommitGuard + enterRunNode + resolveRunNode
  │     │           └── handleJourneySecondary(actionId)    ← COMPANY / SAVE / MENU
  │     └── enterTravel()                   ← default + ?journey=travel + failure fallback
  │
  └── TravelView
        └── chooseRunNode(node) → commitRunNodeChoice(node.id)  ← same path
```

---

## 5. Presentation policy

`resolveCampaignPresentation({ search, dev })` is a pure function:

| Input | Result |
|---|---|
| No selector, DEV | `travel` |
| `?journey=travel`, DEV | `travel` |
| `?journey=cinematic`, DEV | `journey` |
| `?journey=cinematic`, production | `travel` |
| `?journey=unknown`, DEV | `travel` |
| Any selector, production | `travel` |

GameApp consults this policy exactly once at construction. A `journeyUnavailable` latch prevents recursion after a catastrophic failure. **PRODUCTION_DEFAULT_CHANGED: NO.**

---

## 6. JOURNEY AppMode

Added `'JOURNEY'` to the `AppMode` union. It is presentation-only: it owns no route truth, combat truth, dialogue truth, save truth, narrative state, reputation, Conduct, or inventory. The mode is set by `enterJourney()` and cleared by `showTravel()`, `renderTitle()`, `dispose()`, and the route commit path.

---

## 7. Campaign presentation facade

`enterCampaignPresentation()` is the single semantic boundary that replaced all 12 `enterTravel()` and 2 `showTravel()` return points. It decides only HOW the current boundary is presented — never what the campaign is. It delegates to `enterJourney()` or `enterTravel()` based on the policy.

`enterTravel()` is now reachable only from:
1. The facade's travel branch (normal default)
2. `failJourneyToTravel()` (catastrophic Journey failure fallback)

---

## 8. Shared RunNode presentation semantics

`src/ui/RunNodePresentation.ts` exports `runNodePresentation(node)`, `RUN_NODE_TYPE_PRESENTATION`, `RUN_NODE_DIFFICULTY_LABELS`, and `ratingScale(value)`. TravelView and the Journey adapter both import from this module — **one route truth, one presentation interpretation, two possible UI surfaces**. TravelView's private `NODE_PRESENTATION` table and `routePresentation()` function were removed.

---

## 9. RunNode → Journey adapter

`src/journey/JourneyRunNodeAdapter.ts` is a pure module that consumes `getAvailableRunNodes(state)` output (already adaptive-resolved by RunSystem) and maps to `JourneyChoicePresentation`:

- `id` — preserved exactly
- `label` — preserved exactly
- `category` — from shared `runNodePresentation`
- `difficulty` — from shared `runNodePresentation`
- `hint` — from the node itself
- `risk`/`reward` — `ratingScale()` of shared values
- `disabled` — never set by the adapter (RunSystem decides availability)

`planJourneyBoundary(available)` produces three plans:
- **branch** (2+ successors): real route choices
- **single** (1 successor): one CONTINUE affordance, `singleNodeId` carried
- **terminal** (0 successors): safe terminal, no fabricated route

No second route registry. No independent adaptive inference.

---

## 10. Authoritative route commit function

`commitRunNodeChoice(nodeId)` is the single path. Both `TravelView.chooseRunNode` and `JourneyCampaignBoundary.present()` delegate to it. It performs exactly once:
1. `evaluateRouteCommit()` — mode/in-flight/availability guard
2. `enterRunNode(this.state.run, node.id)` — RunSystem authority
3. `state.currentNodeId = entered.id`
4. `state.visitedNodeIds = [...this.state.run.visitedNodeIds]`
5. `state.seenUniqueEvents.push(entered.contentId)` (for event/mystery/recruitment)
6. `state.stepCounter += 1`
7. `resolveRunNode(entered, false)`

`enterRunNode` appears exactly once in the entire GameApp source. `stepCounter += 1` appears exactly once. No duplication.

---

## 11. Stale / double-commit protection

`RouteCommitGuard` is a pure module that authorizes before any RunSystem mutation:
- **unauthorized-mode**: mode not in `['TRAVEL', 'JOURNEY']`
- **commit-in-flight**: a commit is already being processed
- **unavailable-node**: node ID not in `getAvailableRunNodes(state)`

RunSystem is not queried for unauthorized/duplicate commits. The Journey overlay's single-commit latch is the UI-level protection; the guard is the independent system-level protection. A malicious or stale callback cannot advance the campaign even if the DOM fails.

---

## 12. Single-successor behavior

When `getAvailableRunNodes(state)` returns exactly 1 node, `planJourneyBoundary` produces a `single` plan with zero choices and one CONTINUE affordance. The continuation commits `plan.singleNodeId` — the exact successor — exactly once. No route-comparison card is shown. No recursive auto-resolution of multiple nodes.

**Browser-verified (scenario C):** at `lion-camp` (single successor `lion-audience`), Journey shows 0 choices + 1 CONTINUE. Clicking CONTINUE enters `lion-audience` and starts its dialogue.

---

## 13. Multi-successor behavior

When 2+ successors are available, `planJourneyBoundary` produces a `branch` plan with one choice per available node. The displayed risk/reward/difficulty/hint come from authoritative resolved RunNode data through the shared presentation semantics.

**Browser-verified (scenario D):** at `lion-refugees` (successors `lion-first-trial-event`, `lion-first-trial-combat`), Journey shows exactly 2 choices with the correct IDs. Choosing one enters that node and starts its content. The other node is untouched. No duplicate transition.

---

## 14. Zero-successor behavior

When 0 successors are available, `planJourneyBoundary` produces a `terminal` plan with zero choices and a "Retour au menu" continuation. No route is fabricated. No crash. Secondary navigation remains possible.

**Browser-verified (scenario D2):** at `lion-final-judgement` (0 successors), Journey shows 0 choices and "Retour au menu".

---

## 15. Journey presentation resolver

`src/journey/JourneyPresentationResolver.ts` is a pure module that answers "which cinematic corresponds to this boundary?" It supports four future mapping categories (`node:`, `edge:`, `content:`, `state:`) with stable key builders. The production map (`JOURNEY_PRESENTATION_MAP`) is **empty and frozen**. The resolver accepts injected maps for testing. It never derives or changes game truth.

`resolveBoundaryCinematic` looks up arrival first, then content reveal. `resolveCandidateCinematicIds` returns edge-then-arrival candidates, deduplicated, for preloading. With an empty map, both resolve to nothing — the Journey surface degrades to its neutral fallback.

---

## 16. Transient presentation context strategy

No new gameplay state was created. The Journey boundary derives its context from existing state:
- `currentNodeId` — from `getRunNode(state.run)`
- `currentContentId` — from the current node
- `available` — from `getAvailableRunNodes(state)`

No save schema change. No persistent presentation state. The `journeyUnavailable` latch and `routeCommitInFlight` flag are transient in-memory booleans that reset on page reload.

---

## 17. Preloader integration

`JourneyCampaignBoundary.present()` calls `session.preloadCandidates(resolveCandidateCinematicIds(context, map))` after the freeze. With an empty production map, this preloads nothing. With injected test mappings, it preloads only mapped local IDs — deduplicated, bounded, never played. On commit, `dispose()` clears the session and its preloader. On failure fallback, `disposeJourney()` clears everything.

---

## 18. Management return strategy

**Chosen strategy: Option B (dispose and deterministically reconstruct).**

When COMPANY is pressed:
1. `handleJourneySecondary('COMPANY')` calls `openManagement('clan', undefined, 'temporary', false)` with `returnToTravel = false`
2. Management overlay opens, player makes changes, auto-save fires
3. Management closes → `handleJourneySecondary` returns `true`
4. `runJourneyBoundary` loop continues → calls `boundary.present()` again
5. The new boundary reads the same unchanged route state → same choices

No route is entered. `stepCounter` is not incremented. `resolveRunNode` is not called. The same campaign boundary is reconstructed from unchanged route state.

**Browser-verified (scenario E):** stepCounter before = 4, after = 4. Journey restored with same 2 choices.

---

## 19. Manual save integration

SAVE calls `this.saves.saveManual(this.state)` — the existing `SaveRepository` authority. No route progress. No Journey commit. No schema change. The Journey boundary loop continues after saving.

---

## 20. Menu cleanup strategy

MENU calls `this.renderTitle()`, which calls `this.disposeJourney()` before setting TITLE mode. `disposeJourney()` calls `this.journeyBoundary?.dispose()` which disposes the `JourneySession` (releases DOM, media, listeners, preloads). No video elements, preloader entries, overlay listeners, stale commits, surfaces, or state-machine sessions survive behind the title screen.

---

## 21. Roadmap decision

**Deferred (Option 2).** TravelView's roadmap renderer is a large private component tightly coupled to TravelView's DOM structure. Extracting it would substantially inflate CIN-2 risk without adding bridge value. TravelView's roadmap continues working unchanged. A Journey-native roadmap belongs to later UX work.

---

## 22. Refuge handling

Refuge mechanics are completely unchanged: `resolveRunNode` still runs the same `ExplorationView` loop with rest/shop/clan/skills/continue. The only change is the return path: `enterTravel()` → `enterCampaignPresentation()`. Under Journey policy, the refuge "continue" returns to Journey. Under Travel policy, it returns to TravelView.

**Browser-verified (scenario F):** at `lion-first-refuge`, all 5 refuge options are present (clan, shop, skills, rest, continue). Rest is available ("Compagnie en pleine forme" — no wounded units).

---

## 23. lion-final-refuge preservation

`lion-final-refuge` is a `story` node (`type: 'story'`, `contentId: 'final_refuge'`), not a `refuge` node. It does not enter the `ExplorationView` refuge loop. Its narrative label "Refuge avant le Sceau" does not alter its node semantics. This is asserted in `cin2CampaignBridge.test.ts`.

---

## 24. New chronicle behavior

`startNewChronicle()` is unchanged except the final presentation boundary: `enterTravel()` → `enterCampaignPresentation()`.

- **Default:** Prologue → `acte_ouverture` → TravelView
- **DEV Journey:** Prologue → `acte_ouverture` → Journey

No state initialization, save clearing, `prologueSeen`, tutorial flags, opening dialogue, or campaign start state changes.

**Browser-verified (scenarios A + B):** default launch → TravelView; `?journey=cinematic` → Journey.

---

## 25. Continue / reload behavior

`continueChronicle()` was refactored:
1. Loads save, closes all views, disposes Journey, sets neutral RESULT mode (no campaign surface mounted yet)
2. Checks resume profile:
   - **Unresolved current node** or **pending finale boss** → `resolveRunNode(current, true)` directly (no replay)
   - **Resolved boundary** → `enterCampaignPresentation()` (Journey or TravelView)
3. No route re-selection. No duplicate judgement. No completed boss replay.

**Browser-verified (scenario H):** save at `lion-refugees` (resolved), reload → same 2 choices, same stepCounter (4 = 4).

---

## 26. Combat / post-node order preservation

R6 ordering is authoritative and unchanged:

```
maybePlayATEs(nodeId) → maybePlayReputationEvent(nodeId) → enterCampaignPresentation()
```

`playPostNodeNarrative` contains no presentation calls. `resolveCombat` calls `playPostNodeNarrative` before `enterCampaignPresentation`. No Journey between ATE and R4. Combat internals (CombatBridge, CombatStage, VFX, CasterMotion, AI, damage, skills, deployment, rewards, enemy definitions, combat configurations) are untouched — verified by diff audit and source scan.

---

## 27. Dialogue semantics preservation

DialogueView and dialogue truth are unchanged. `beforeDialogue` / `beforeCombat` / `afterCombat` / `chapterBeat` hooks remain valid. Journey never resolves dialogue choices, applies effects, infers facts, skips effects, or duplicates resolution. The `cin2CampaignBridge.test.ts` source scan confirms no Journey module imports or calls `enterRunNode`, `resolveRunNode`, `applyEffects`, `saveAuto`, `saveManual`, `startCombat`, or `playDialogue`.

---

## 28. TravelView preservation

TravelView is **not deleted**. Its route selection, roadmap, party display, HUD actions, and tooltips all work unchanged. `?journey=travel` forces it. Default without selector uses it. It remains the production default, debug fallback, fast QA, and emergency fallback. Both TravelView and Journey enter the same `commitRunNodeChoice` path.

**Browser-verified (scenarios A + G).**

---

## 29. Catastrophic Journey failure fallback

`failJourneyToTravel(error)`:
1. Logs the error
2. `disposeJourney()` — releases session, overlay, media, preloads
3. `journeyUnavailable = true` — latches Journey off for the rest of the session
4. `enterTravel()` — falls back to TravelView

No retry loop. No recursion (`journeyUnavailable` prevents `enterCampaignPresentation` from choosing Journey again). The `runJourneyBoundary` loop also bounds rejections at `JOURNEY_MAX_REJECTIONS = 3`.

The automated test `JourneyCampaignBoundary.test.ts` — "propagates catastrophic session failure" — proves the error propagates. The `cin2CampaignBridge.test.ts` source scan proves the `failJourneyToTravel` path exists and does not recurse.

---

## 30. Reduced-motion handling

CIN-1 reduced-motion semantics are preserved. In Journey mode, `reducedMotion: this.state.settings.reducedGraphics` is passed to `JourneyCampaignBoundary.present()`. The CIN-1 runtime bypasses video motion and reaches Journey agency safely. TravelView is not forced solely because motion is reduced. `reducedGraphics` and Journey-enabled are not conflated.

---

## 31. Production cinematic trigger / manifest state

- `VIDEO_CINEMATIC_TRIGGERS` — all four maps remain empty. Not in the diff.
- `public/assets/cinematics/manifest.json` — still only `qa-placeholder`. Not in the diff.
- No `serpent_general_reveal`, `lion_judgement`, `lion_champion_reveal`, or any other production mapping added.
- No new MP4/WebM binary anywhere under `public/`.
- `JOURNEY_PRESENTATION_MAP` — empty and frozen.
- All of the above are asserted by automated tests in `cin2CampaignBridge.test.ts` and `JourneyPresentationResolver.test.ts`.

**PRODUCTION_CINEMATIC_TRIGGERS_POPULATED: NO.**

---

## 32. Automated tests

`npm test` → **83 files / 1912 tests passed**, 0 failed.

Baseline (CIN-1) was 77 files / 1859 tests → **+6 files, +53 tests, 0 regressions**.

| New test file | Tests | Proves |
|---|---|---|
| `JourneyPresentationPolicy.test.ts` | 7 | Default/forced/DEV-only/unknown-value policy; source scan |
| `JourneyRunNodeAdapter.test.ts` | 9 | ID/label/risk/reward/difficulty/hint parity; adaptive content; single/multi/zero; shared semantics; no state dependency |
| `JourneyPresentationResolver.test.ts` | 7 | Key builders; empty production map; injected mappings; candidate dedup; no unavailable candidates |
| `RouteCommitGuard.test.ts` | 6 | Mode/in-flight/stale guards; no needless RunSystem query; authoritative node returned; mode predicate |
| `JourneyCampaignBoundary.test.ts` | 10 | Branch/single/terminal; single-commit latch; no state mutation; no DOM residue; preload; mapped clip; catastrophic failure |
| `cin2CampaignBridge.test.ts` | 14 | Single commit path; mode guard; facade routing; R6 ordering; combat/dialogue untouched; secondary wiring; management return; failure fallback; dispose paths; new chronicle; continue/reload; refuge; lion-final-refuge; production data guards |

CIN-1 regression: all 71 CIN-1 tests remain green (cinematics + journey).

---

## 33. Actual Chromium QA performed

Real Chromium (Playwright) against `npm run dev` on `http://localhost:5173`. Save states at key campaign positions were generated with `vite-node` and injected via `localStorage`.

| Scenario | Description | Result |
|---|---|---|
| A | Default launch, no selector → TravelView | **PASS** — `.travel-view` visible, 0 Journey overlays |
| B | `?journey=cinematic` → Journey (neutral fallback) | **PASS** — `.journey-overlay` visible, 1 `.journey-surface`, title "Camp du Lion", 0 TravelView |
| C | Single successor → CONTINUE → game progresses | **PASS** — 0 choices, 1 CONTINUE ("Continuer"), clicking starts dialogue, Journey gone |
| D | Multi-route at lion-refugees → 2 choices → pick one | **PASS** — 2 choices `[lion-first-trial-event, lion-first-trial-combat]`, 0 continues, picking one progresses, Journey gone |
| E | COMPANY → Management → return → Journey restored | **PASS** — management overlay visible, Journey restored, stepCounter 4→4 (no increment) |
| F | Refuge at lion-first-refuge → verify options | **PASS** — exploration view visible, all 5 options (clan, shop, skills, rest, continue) present |
| G | `?journey=travel` → TravelView | **PASS** — `.travel-view` visible, 0 Journey overlays |
| H | Continue/reload → correct boundary restored | **PASS** — 2 choices before reload, 2 after, same IDs, stepCounter 4=4 |
| D2 | Zero successors at lion-final-judgement → terminal | **PASS** — 0 choices, "Retour au menu" continue label |
| J | Console errors | **PASS** — 0 errors across all scenarios |

**TOTAL: 10/10 passed, 0 console errors.**

Scenario I (catastrophic Journey failure injection) was not performed in the browser — it would require modifying source code to inject a failure, which is not appropriate for QA. The automated test `JourneyCampaignBoundary.test.ts` — "propagates catastrophic session failure to the caller" — and the `cin2CampaignBridge.test.ts` source scan of `failJourneyToTravel` provide the proof.

---

## 34. Exact final test counts

| Gate | Result |
|---|---|
| `npm test` | **83 files / 1912 tests passed**, 0 failed (19.12 s) |
| `npx tsc --noEmit` | PASS (exit 0) |
| `npm run build` | PASS (`✓ built in 5.33s`) |
| `git diff --check` | PASS (exit 0) |
| Focused suites | 15 files / 192 passed |

---

## 35. TypeScript / build / diff results

- `npx tsc --noEmit`: exit 0, no diagnostics
- `npm run build`: success, only pre-existing "chunks larger than 500 kB" warning
- `git diff --check`: exit 0, no whitespace errors

---

## 36. Exact git diff summary

```
 src/game/GameApp.ts  | 245 ++++++++++++++++++++++++++++++++++++++++++++-------
 src/ui/TravelView.ts |  43 ++-------
 2 files changed, 223 insertions(+), 65 deletions(-)

untracked (new):
  src/game/cin2CampaignBridge.test.ts        232 lines
  src/journey/JourneyCampaignBoundary.test.ts 240 lines
  src/journey/JourneyCampaignBoundary.ts      122 lines
  src/journey/JourneyPresentationPolicy.test.ts 60 lines
  src/journey/JourneyPresentationPolicy.ts     38 lines
  src/journey/JourneyPresentationResolver.test.ts 83 lines
  src/journey/JourneyPresentationResolver.ts   98 lines
  src/journey/JourneyRunNodeAdapter.test.ts   127 lines
  src/journey/JourneyRunNodeAdapter.ts        105 lines
  src/journey/RouteCommitGuard.test.ts         67 lines
  src/journey/RouteCommitGuard.ts              39 lines
  src/ui/RunNodePresentation.ts                55 lines
  docs/reports/cin-2-travelview-replacement-bridge.md  (this report)
```

All 65 deletions are relocations: `enterTravel()` → `enterCampaignPresentation()`, `chooseRunNode` logic → `commitRunNodeChoice`, private `routePresentation`/`NODE_PRESENTATION` → shared `RunNodePresentation.ts`.

---

## 37. Known limitations

1. **No real video media.** All Journey boundaries degrade to the neutral fallback surface. Real final-frame/video proof is a CIN-3 gate.
2. **No production cinematic mappings.** `JOURNEY_PRESENTATION_MAP` is empty. The resolver architecture is ready but unpopulated.
3. **Roadmap deferred.** Journey has no native roadmap. TravelView's roadmap works unchanged.
4. **CAMP secondary action not implemented.** Real refuge nodes own camp gameplay; a fake generic entry point would be misleading.
5. **Catastrophic failure not browser-tested.** Proven by automated tests only; browser injection would require source modification.
6. **Journey is DEV-only.** `?journey=cinematic` has no effect in production builds. CIN-7 is the production default-switch phase.
7. **Management return uses Option B (reconstruct).** The boundary is deterministically rebuilt from unchanged route state. This works because route state is not mutated by management, but it means the Journey surface is disposed and re-created (brief transition).

---

## 38. Deferred work

| Item | Owner |
|---|---|
| Real pilot media + production mappings | CIN-3 |
| Production default switch | CIN-7 |
| Journey-native roadmap | Later UX |
| CAMP as Journey secondary (if ever needed) | Later UX |
| Real-video final-frame browser proof | CIN-3 |
| Offline last-frame production pipeline | CIN-4 |
| Full cinematic census | CIN-5 |
| Mass production | CIN-6 |

---

## 39. Confirmations

- **GAME TRUTH PRESERVED: YES.** No RunSystem, campaign topology, RunNode data, narrative content, dialogue, combat, reputation, management, Conduct, inventory, or save schema change. Journey modules import from `./` only and never call `enterRunNode`, `resolveRunNode`, `applyEffects`, `saveAuto`, `saveManual`, `startCombat`, or `playDialogue`.
- **TRAVELVIEW PRESERVED: YES.** Not deleted. `?journey=travel` forces it. Default uses it. Roadmap works. Route selection works. Both surfaces share one commit path.
- **PRODUCTION_DEFAULT_CHANGED: NO.** TravelView remains the production default. Journey is DEV-only via `?journey=cinematic` + `import.meta.env.DEV`.
- **PRODUCTION_CINEMATIC_TRIGGERS_POPULATED: NO.** All four maps empty. Manifest unchanged.
- **REAL VIDEO MEDIA ADDED: NO.** Zero MP4/WebM files under `public/`.
- **SAVE_SCHEMA_CHANGED: NO.** No save format or schema change.
- **COMBAT_CHANGED: NO.** No CombatBridge, CombatStage, VFX, CasterMotion, AI, damage, skills, deployment, rewards, enemy, or combat config change.

---

## 40. Commit / push status

**Nothing committed. Nothing pushed.** HEAD remains `1dabf25369216db0d1713d4b17529d52a082c6b3`.

**STOP at CIN-2.** No work started on CIN-3 (Pilot Production + Integration), CIN-4 (Offline Last-Frame Production Pipeline), CIN-5 (Full Cinematic Census), CIN-6 (Mass Production), or CIN-7 (Cinematic Journey Production Default).

---

**READY_FOR_CIN_3: YES** — no blockers. The campaign bridge is proven end-to-end with real RunSystem data through the real GameApp in a real browser. The only carry-over is that real video media does not yet exist, which is the explicit scope of CIN-3.

# CAMPAIGN-PRESENTATION-MIGRATION-1

Operator review report, 2026-09-22. Implementation remains **UNCOMMITTED / UNPUSHED / UNMERGED**.

Journey/NarrativeStage now owns normal production campaign presentation without a selector. Final T0 physical arrival uses the same campaign facade. RunSystem and the guarded route-commit method retain progression authority.

## Starting state and audit revalidation

- Branch: `campaign-presentation-migration-1`.
- HEAD: `26b435306775a9b5175273a9306b96852298241b`.
- `git status --short`: empty before edits.
- Local code matched the supplied audit. There were three direct `enterTravel()` calls: T0 completion, facade policy branch, catastrophic fallback. Three direct `showTravel()` calls served preview bootstrap, `enterTravel()`, and the Travel Company return.
- Traversal's production gate remains unchanged: `enabled: false`, `designAssetsReady: false`, rollout list `['T0']`. Promoting campaign presentation does not enable physical Traversal in production.

## Before and after call graphs

Before, production:

```text
campaign return -> enterCampaignPresentation()
  -> resumeActiveTraversalIfReady() [mid-route resolution only]
  -> usesJourneyPresentation() == false (production policy)
  -> enterTravel() -> showTravel() -> TravelView.open()
```

Before, DEV with `?journey=cinematic` or `?presentation=narrative`:

```text
enterCampaignPresentation() -> enterJourney() -> runJourneyBoundary()
  -> getRunNode() + getAvailableRunNodes()
  -> JourneyCampaignBoundary.present() -> NarrativeStage -> requestAgency()
  -> node outcome -> commitRunNodeChoice() -> evaluateRouteCommit()
  -> getAvailableRunNodes() -> enterRunNode() -> resolveRunNode()
```

Before, T0 final arrival bypassed that facade:

```text
TraversalT0Scene.advanceArrival() -> onArrival(destinationNodeId)
  -> completeTraversalT0Qa() -> enterTravel()
  -> covered task: completeArrival() -> showTravel() -> disposeTraversal()
  -> TravelView.open()
```

Root causes were both the direct final-arrival bypass and the production policy's unconditional `travel` result. Replacing only the bypass would not have migrated production.

After, normal production and DEV without an explicit legacy override:

```text
campaign return -> enterCampaignPresentation()
  -> resumeActiveTraversalIfReady() [existing mid-route case, if applicable]
  -> usesJourneyPresentation() == true
  -> enterJourney() -> covered transition
  -> close legacy Travel surface; set NARRATIVE; save once
  -> runJourneyBoundary()
  -> authoritative getRunNode() + getAvailableRunNodes()
  -> JourneyCampaignBoundary.present() -> existing NarrativeStage resolution
  -> TRAVEL_STILL / STATIC_TABLEAU / CINEMATIC_HOLD / CINEMATIC_VIDEO
  -> requestAgency() -> semantic node outcome
  -> commitRunNodeChoice() -> evaluateRouteCommit() + fresh available nodes
  -> sole GameApp enterRunNode() call -> resolveRunNode()
```

After, final T0 arrival:

```text
TraversalT0Scene.advanceArrival() -> single onArrival(destinationNodeId)
  -> completeTraversalT0Qa(): validate owner/destination/ARRIVING; guard duplicate handoff
  -> enterCampaignPresentation() -> enterJourney()
  -> shared traversal transition becomes opaque
  -> completeArrival() exactly once -> disposeTraversal() -> clear active owner
  -> JourneyCampaignBoundary / NarrativeStage
  -> await surface readiness before uncovering
  -> explicit player agency -> canonical commitRunNodeChoice()
```

Final arrival does not pass `destinationNodeId` into route commitment. The browser's current node remained `lion-first-trial-event`, with step count 3, until the player selected the refuge continuation.

Mid-route behavior remains:

```text
NODE_HANDOFF -> commitRunNodeChoice() -> beginNodeResolution()
  -> existing node gameplay -> resolvedNodeIds contains node
  -> enterCampaignPresentation() -> resumeActiveTraversalIfReady()
  -> covered cleanup of narrative/combat surface -> same traversal.resumeNode(nodeId)
```

Failure behavior:

```text
Journey setup/presentation failure or bounded repeated route rejection
  -> enterJourney() catches after SceneTransition releases its lock
  -> failJourneyToTravel() -> disposeJourney(); journeyUnavailable = true
  -> enterTravel() -> showTravel() -> TravelView.open()
subsequent campaign return -> latched facade branch -> enterTravel()
```

This also fixes the audited fallback's pre-ready hazard: `SceneTransition.run()` silently ignores nested runs while active. Recovery now starts after the enclosing transition finishes or unwinds, so its Travel task is actually executed.

## Physical completion lifecycle

Previously only `enterTravel()` completed an ARRIVING traversal inside its covered task, then `showTravel()` disposed it. Normal Journey entry did neither.

Now `enterJourney()` captures the arriving owner, uses the existing traversal transition rhythm, completes that owner inside the opaque covered task, then disposes it before creating the destination presentation. Readiness remains awaited under the shared cover. The callback additionally requires ARRIVING and suppresses duplicate in-flight calls. The legacy `enterTravel()` lifecycle remains valid for DEV override/recovery. NODE_HANDOFF/NODE_RESOLUTION never use final-arrival completion.

Executable tests verify one transition, one physical completion, one disposal, one normal boundary presentation and one normal save, with no route entry or state mutation caused by arrival. The complete scene-flow tests also advance the arrival clock repeatedly and verify only one callback.

## Authority matrix

| Owner | Final responsibility |
| --- | --- |
| RunSystem | Run truth, available nodes, route legality, node entry and progression. |
| Traversal | Physical travel, lane movement, roadside interaction, timing and a single arrival signal; no NarrativeStage construction or presentation-mode policy. |
| GameApp | Semantic handoff, covered lifecycle, orchestration, recovery and delegation to the canonical commit method. |
| JourneyCampaignBoundary | Presentation and agency over authoritative supplied nodes; returns semantic outcomes without entering nodes. |
| NarrativeStage | Media, still/tableau/dialogue rendering, agency surfaces and readiness. |
| RouteCommitGuard + commitRunNodeChoice | Mode/in-flight/availability validation and the single GameApp RunSystem entry path. |
| TravelView | Catastrophic recovery, explicit DEV legacy override, isolated preview bootstrap and its own management return. |

## Files changed

| File | Change and reason |
| --- | --- |
| `src/journey/JourneyPresentationPolicy.ts` | Default Journey in production and DEV; explicit Travel forcing is DEV-only. Unknown values keep the default; no `journey=1` alias introduced. |
| `src/game/GameApp.ts` | Canonical T0 callback, duplicate/phase guard, covered Journey completion/disposal, transition-safe recovery and current comments. |
| `src/cinematics/Cin6aPresentation.ts` | One obsolete production-default comment corrected; mappings unchanged. |
| `src/journey/JourneyPresentationPolicy.test.ts` | Production/no-selector, aliases, unknown values, DEV legacy override and override precedence. |
| `src/game/cin2CampaignBridge.test.ts` | Replaces the old direct-arrival route and three-call expectation with canonical handoff and two justified Travel calls. |
| `src/game/cin67NarrativeStageIntegration.test.ts` | Replaces obsolete production-Travel expectations; preserves NarrativeStage integration contracts. |
| `src/game/campaignPresentationMigration.test.ts` | Seven executable orchestration cases: covered single completion, duplicate/mismatched callbacks, authoritative agency and commitment, failures before/after readiness, same-session resume, DEV legacy arrival. |
| `src/traversal/TraversalT0Flow.test.ts` | Existing five complete road scenarios additionally verify one arrival callback, physical COMPLETE state and no automatic destination entry. |
| `tools/cinematics/cin6ea_preproduction.test.mjs` | Narrowly authorizes requested policy files, new regression test and comment cleanup in the existing historical scope guard. |
| `tools/cinematics/cin6ea_finalization.test.mjs` | Narrowly authorizes the two requested policy files; preserves all other protected-system/media checks. |
| `tools/cinematics/run_campaign_presentation_migration_qa.mjs` | Reproducible Playwright proof using existing QA server, isolated saves, actual app methods and production bundle; three screenshots only. |
| `docs/reports/campaign-presentation-migration-1.md` | This review report and final reference inventory. |

`JourneyCampaignBoundary.test.ts` and `TraversalT0Scene.test.ts` were inspected and passed unchanged: they already verify presentation-only outcomes, real scene interactions and resource behavior. Existing `NarrativePresentationRuntime.test.ts` verifies all four presentation modes. No renderer, campaign content, topology, save schema, combat, VFX, assets or Traversal production policy changed.

## Remaining Travel entries

| GameApp location | Classification |
| --- | --- |
| `startTraversalT0Qa()` -> `showTravel()` | Explicit isolated DEV/QA bootstrap before covered departure; never final arrival. |
| `enterCampaignPresentation()` -> `enterTravel()` | Only `journeyUnavailable` recovery latch or explicit DEV Travel override. Production policy always selects Journey before failure. |
| `enterTravel()` -> `showTravel()` | Implementation of the exceptional legacy/recovery transition, including covered physical completion if needed. |
| `failJourneyToTravel()` -> `enterTravel()` | Catastrophic recovery after transition lock release; latches Journey off. |
| `openManagement()` -> `showTravel()` | TravelView's own Company return with `returnToTravel`; Journey Company uses `false` and re-presents its boundary. |
| `showTravel()` -> `travel.open()` | Sole GameApp mount site; disposes other surface owners first. |
| Constructor `new TravelView(...)` | Creates an inert object. Its constructor does not mount DOM; `.open()` mounts the UI. |
| Other `travel.close()` calls | Cleanup only; cannot mount or grant Travel presentation authority. |

The exact remaining runtime and test references are individually inventoried in the appendix. There are no unexplained successful production Travel entries.

## Validation commands and results

Commands ran from the repository root. Logs are ignored local files; no validation output overwrote production media.

```text
node node_modules/vitest/vitest.mjs run src/game/campaignPresentationMigration.test.ts src/journey/JourneyPresentationPolicy.test.ts src/game/cin2CampaignBridge.test.ts src/game/cin67NarrativeStageIntegration.test.ts src/journey/JourneyCampaignBoundary.test.ts src/traversal/TraversalT0Scene.test.ts
PASS: 6 files, 62 tests (tmp-campaign-focused.log)

node node_modules/vitest/vitest.mjs run src/traversal/TraversalT0Flow.test.ts src/cinematics/NarrativePresentationRuntime.test.ts tools/cinematics/cin6ea_preproduction.test.mjs tools/cinematics/cin6ea_finalization.test.mjs
PASS: 4 files, 49 tests (tmp-campaign-integration.log)

node node_modules/typescript/bin/tsc --noEmit
PASS: exit 0 (tmp-campaign-typecheck.log)

node node_modules/vite/bin/vite.js build
PASS: exit 0 (tmp-campaign-build.log); existing >500 kB chunk warning

node node_modules/vitest/vitest.mjs run
PASS: 146 files, 2476 tests (tmp-campaign-full.log)

git diff --check
PASS: no whitespace errors; Git reports LF-to-CRLF working-copy notices

git diff --name-only -- public src/combat src/vfx src/game/runSystem.ts src/game/types.ts src/campaign src/traversal/TraversalFeaturePolicy.ts
PASS: empty
```

No lint script or linter configuration is present. Typecheck plus Vite build are the exact components of `npm run build`. The machine's `npx` launcher points to a missing global npm module, so installed entry points were used directly. Initial sandboxed Vitest startup was denied access to parent configuration directories; rerunning with approved execution permissions succeeded. The first full suite exposed exactly two obsolete scope-guard failures for the explicitly requested policy files; those guards were narrowly migrated, then the full suite passed. Current `CasterMotionBackCompat.test.ts` passes all 27 tests; no old VFX failure waiver is needed for this checkout.

Final code audit searched every requested symbol in GameApp and presentation/Traversal sources, reconstructed the call graphs above, verified only one GameApp `enterRunNode()` call, and confirmed the presentation-only boundary and renderer sources remain unchanged.

## Browser validation

```text
node tools/traversal/qa-server.mjs 5190
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5191 --strictPort
node tools/cinematics/run_campaign_presentation_migration_qa.mjs
```

Playwright uses isolated browser contexts; normal DEV/production checks resume a valid initial V6 save through the real Continue UI. DEV introspection is added only to the test browser's intercepted main module, never to repository runtime code or the production bundle. T0 uses the existing DEV preview, accelerates physical distance, drives real dialogue/fork controls, and uses the existing QA victory control for mandatory combat. The first attempt was blocked by the combat tutorial overlay; the harness now sets the existing tutorial-seen preference and handles its skip control.

- DEV no-selector, `?journey=cinematic`, and `?presentation=narrative`: NARRATIVE mode, one NarrativeStage, zero Travel mounts.
- Built production with no query parameters: one NarrativeStage, zero Travel mounts.
- Normal route choice: exactly one canonical `commitRunNodeChoice('lion-audience')`, step increment once.
- T0 final arrival: one completion and one disposal at cover opacity 1; zero remaining Traversal/Travel DOM; one NarrativeStage. No automatic refuge entry or step increment.
- Mid-route: the same scene resumes after `lion-opening-ambush`, `lion-nomad-crossroads`, and `lion-first-trial-event`.
- Explicit refuge continuation: exactly one canonical refuge commit after agency.
- Injected pre-ready session-construction failure: TravelView appears, Journey latch is true, no NarrativeStage remains, subsequent facade return stays on TravelView.
- Final browser command: PASS, exit 0. Across 246 sampled arrival frames: zero uncovered empty surfaces, zero Travel frames, zero duplicate NarrativeStages. Evidence is saved in `tmp/campaign-presentation-migration-1/browser-results.json`. Three screenshots cover DEV default, production default and T0 arrival; no video corpus generated. Production and final-arrival screenshots were visually inspected.

## Residual debt and review boundary

No known migration regression remains. TravelView is retained intentionally for the classified exceptional paths. T0 remains DEV-only; opening its production gate is outside this change. Browser proof covers the event branch; both event/combat branches are covered by the five full simulated road tests. Per-frame checks measure surface presence and cover state, not exhaustive pixel-by-pixel video analysis. Existing bundle-size warnings remain outside scope. Broad historic tool/report descriptions are preserved.

Final branch and HEAD remain the starting values. All listed changes are unstaged/uncommitted, with no push or merge performed. Local logs, build output and three screenshots are ignored validation artifacts. The final source/reference inventory follows.

Final `git status --short`:

```text
 M src/cinematics/Cin6aPresentation.ts
 M src/game/GameApp.ts
 M src/game/cin2CampaignBridge.test.ts
 M src/game/cin67NarrativeStageIntegration.test.ts
 M src/journey/JourneyPresentationPolicy.test.ts
 M src/journey/JourneyPresentationPolicy.ts
 M src/traversal/TraversalT0Flow.test.ts
 M tools/cinematics/cin6ea_finalization.test.mjs
 M tools/cinematics/cin6ea_preproduction.test.mjs
?? docs/reports/campaign-presentation-migration-1.md
?? src/game/campaignPresentationMigration.test.ts
?? tools/cinematics/run_campaign_presentation_migration_qa.mjs
```

## Reference inventory

Each row below identifies one remaining `TravelView`, `enterTravel(` or `showTravel(` occurrence in `src`. Test references assert architecture, legacy rendering or authority boundaries; they do not create normal runtime entry paths.

| File:line | Reference | Classification |
| --- | --- | --- |
| src/ui/TraversalTravelReturn.test.ts:5 | import { TravelView } from './TravelView'; | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/ui/TraversalTravelReturn.test.ts:9 | it.each(['lion-first-trial-event', 'lion-first-trial-combat'])('offers Refuge in TravelView after the chosen %s is entered', async branch => { | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/ui/TraversalTravelReturn.test.ts:20 | const view = new TravelView({ root: document.body, getState: () => state, | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/ui/TravelView.ts:10 | interface TravelViewOptions { | Retained legacy view implementation/types/shared-presentation comment |
| src/ui/TravelView.ts:38 | // Cinematic Journey surface reads every route exactly the way TravelView does. | Retained legacy view implementation/types/shared-presentation comment |
| src/ui/TravelView.ts:336 | export class TravelView { | Retained legacy view implementation/types/shared-presentation comment |
| src/ui/TravelView.ts:342 | constructor(private readonly options: TravelViewOptions) {} | Retained legacy view implementation/types/shared-presentation comment |
| src/ui/RunNodePresentation.ts:6 | * TravelView and the Cinematic Journey adapter both read route meaning from here, so the two | Shared authoritative option/presentation or legacy environment documentation; no entry |
| src/ui/RunNodePresentation.ts:46 | // A node without an authored difficulty reads as its type label, as TravelView has always done. | Shared authoritative option/presentation or legacy environment documentation; no entry |
| src/ui/CharacterUiIntegration.test.ts:7 | import { TravelView } from './TravelView'; | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/ui/CharacterUiIntegration.test.ts:42 | it('keeps TravelView on Master full-body ownership for heroes and advisors', () => { | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/ui/CharacterUiIntegration.test.ts:44 | const view = new TravelView({ | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/campaign/LionCampaignTravelRelations.ts:11 | /** Fork choice is rendered over the live Traversal world; never TravelView/Journey. */ | Live-world fork ownership documentation; no entry |
| src/campaign/LionCampaignTravelRelations.ts:54 | * A fork overlay never hands control to TravelView/Journey. After the choice is committed, | Live-world fork ownership documentation; no entry |
| src/journey/JourneyCampaignBoundary.ts:77 | /** Injectable so tests can prove catastrophic Journey failure drops back to TravelView. */ | Catastrophic-failure injection documentation |
| src/journey/JourneyRunNodeAdapter.ts:12 | * It receives exactly the nodes getAvailableRunNodes(state) produced for TravelView, so adaptive | Shared authoritative option/presentation or legacy environment documentation; no entry |
| src/journey/JourneyRunNodeAdapter.test.ts:15 | /** Exactly what TravelView receives: authoritative, adaptive-resolved successors. */ | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/journey/JourneyRunNodeAdapter.test.ts:120 | it('shares one presentation interpretation with TravelView', () => { | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/journey/JourneyRunNodeAdapter.test.ts:121 | const travel = readFileSync(join(process.cwd(), 'src', 'ui', 'TravelView.ts'), 'utf8'); | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/render/demoEnvironmentPack.ts:110 | * Resolve the real TravelView context from the authoritative current node and | Shared authoritative option/presentation or legacy environment documentation; no entry |
| src/journey/JourneyPresentationResolver.ts:13 | * CIN-6A populates only reviewed local Journey-node presentation seams. TravelView never reads | Journey-only presentation-map documentation; no Travel entry |
| src/journey/JourneyPresentationPolicy.ts:8 | * legacy TravelView; production recovery is owned by GameApp's catastrophic-failure latch. | DEV legacy override / production recovery policy documentation |
| src/journey/JourneyPresentationPolicy.ts:18 | /** import.meta.env.DEV. Allows the explicit legacy TravelView override. */ | DEV legacy override / production recovery policy documentation |
| src/journey/JourneyPresentationPolicy.ts:38 | /** True when the selector explicitly demands the TravelView fallback. */ | DEV legacy override / production recovery policy documentation |
| src/journey/JourneyPresentationPolicy.test.ts:22 | it('allows explicit TravelView overrides only in DEV, with precedence over Journey aliases', () => { | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/cinematics/JourneySession.test.ts:270 | expect(code).not.toMatch(/GameState\|enterRunNode\|runSystem\|combatConfigs\|SaveRepository\|DialogueView\|TravelView/); | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/game/runSystem.test.ts:69 | it('describes route risk, reward and narrative hints for TravelView', () => { | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/game/cin2CampaignBridge.test.ts:44 | // TravelView selection delegates instead of duplicating the sequence. | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/game/cin2CampaignBridge.test.ts:65 | // Only exceptional policy/failure branches enter legacy TravelView. | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/game/cin2CampaignBridge.test.ts:66 | expect(occurrences('await this.enterTravel();')).toBe(2); | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/game/cin2CampaignBridge.test.ts:71 | expect(method('private async failJourneyToTravel')).toContain('await this.enterTravel()'); | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/game/cin2CampaignBridge.test.ts:93 | expect(facade).toContain('await this.enterTravel()'); | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/game/cin2CampaignBridge.test.ts:155 | it('falls back to TravelView on catastrophic Journey failure without recursing', () => { | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/game/cin2CampaignBridge.test.ts:159 | expect(fail).toContain('await this.enterTravel()'); | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/game/cin2CampaignBridge.test.ts:194 | expect(chronicle).not.toContain('this.showTravel()'); | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/game/GameApp.ts:28 | import { TravelView } from '../ui/TravelView'; | Legacy view import |
| src/game/GameApp.ts:127 | private readonly travel: TravelView; | Inert legacy view owner |
| src/game/GameApp.ts:134 | // Journey/NarrativeStage is the default; TravelView is recovery or an explicit DEV override. | Default/recovery policy comment |
| src/game/GameApp.ts:184 | this.travel = new TravelView({ | Inert legacy object construction |
| src/game/GameApp.ts:271 | this.showTravel(); | Isolated DEV preview bootstrap |
| src/game/GameApp.ts:750 | * Every flow that used to return to TravelView returns here instead. It decides only HOW the | Canonical facade documentation |
| src/game/GameApp.ts:761 | await this.enterTravel(); | Latched recovery or explicit DEV override |
| src/game/GameApp.ts:797 | private async enterTravel(): Promise<void> { | Exceptional transition implementation |
| src/game/GameApp.ts:805 | this.showTravel(); | Exceptional transition mounts legacy surface |
| src/game/GameApp.ts:811 | private showTravel(): void { | Sole legacy mount helper |
| src/game/GameApp.ts:892 | console.error('[Journey] Presentation failed; falling back to TravelView.', error); | Catastrophic recovery diagnostic |
| src/game/GameApp.ts:895 | await this.enterTravel(); | Catastrophic recovery entry |
| src/game/GameApp.ts:957 | * THE authoritative route commit path. TravelView and Journey both enter here, and neither may | Shared authoritative commit documentation |
| src/game/GameApp.ts:1468 | // Only TravelView's own Company button reaches this branch; Journey rebuilds its boundary. | Legacy Company return documentation |
| src/game/GameApp.ts:1469 | this.showTravel(); | Legacy Company return entry |
| src/game/cin67NarrativeStageIntegration.test.ts:27 | expect(SOURCE).toContain('private readonly travel: TravelView'); | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/game/cin67NarrativeStageIntegration.test.ts:28 | expect(SOURCE).toContain('this.travel = new TravelView({'); | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/game/cin67NarrativeStageIntegration.test.ts:29 | expect(method('private async failJourneyToTravel')).toContain('await this.enterTravel()'); | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/game/cin67NarrativeStageIntegration.test.ts:134 | expect(resolveCombat).not.toContain('this.showTravel()'); | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/game/cin67NarrativeStageIntegration.test.ts:135 | expect(resolveCombat).not.toContain('this.enterTravel()'); | Test-only assertion/fixture for retained legacy behavior or authority boundary |
| src/game/cin67NarrativeStageIntegration.test.ts:145 | expect(defeat).not.toContain('this.enterTravel()'); | Test-only assertion/fixture for retained legacy behavior or authority boundary |

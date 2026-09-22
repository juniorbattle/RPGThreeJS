# TRAVERSAL-T0-PRODUCTION-ROLLOUT-1

Operator review report, 2026-09-22. **UNCOMMITTED / UNPUSHED / UNMERGED**.

**PASS.** Normal built production progression automatically enters T0 from the resolved audience, completes its canonical route and local road combat, returns to Journey under cover, and waits for explicit refuge entry. T1–T4 remain blocked.

## Starting state and supplied audit

- Branch: `traversal-t0-production-rollout-1`.
- HEAD: `54af7e14bb376708220c2a87ad01839c6274835a`.
- Initial `git status --short`: empty.
- The supplied audit matched the actual baseline. The source gate was disabled with assets not ready and `['T0']`; `usesTraversalPresentation()` existed but was unused by the facade; only `startTraversalT0Qa()` constructed a scene.
- QA used a reset state, isolated `TraversalPreviewSaves`, and Travel bootstrap. Road combat rejected non-QA execution and passed unconditional `devQa: true`.
- The prior migration already handled final arrival through the facade, covered completion/disposal, Journey readiness, and explicit destination agency. Canonical node handoff/resume was already present. Both remain intact.

## Blockers and implementation

The production blockers were the closed gate, absent facade selection, QA-only scene construction, and QA-only road combat guard. Production had no durable T0 entry save because it could not mount T0.

Before:

```text
resolved campaign node -> enterCampaignPresentation
  -> resumeActiveTraversalIfReady
  -> Journey/NarrativeStage
  -> TravelView only on explicit DEV legacy policy or catastrophic failure

DEV ?qa=1&traversal=t0 -> reset fixture -> TravelView -> TraversalT0Scene
```

After:

```text
resolved campaign node -> enterCampaignPresentation
  -> resume same NODE_RESOLUTION Traversal first
  -> preserve existing non-arriving Traversal / in-flight entry
  -> eligible resolved T0 origin -> enterTraversalT0
  -> otherwise Journey/NarrativeStage
  -> exceptional TravelView fallback
```

Eligibility uses `LION_TRAVERSAL_LEGS`, not a copied stage sequence. It requires no active Traversal or entry in flight, `run.status === 'active'`, the canonical current node matching T0's origin, that origin in `resolvedNodeIds`, the production policy accepting T0, and a RunSystem available node belonging to the relation's first stage. The runtime adapter explicitly supports only `candidate.id === 'T0'`.

The source gate is now deliberately `enabled: true`, `designAssetsReady: true`, `rolloutLegIds: ['T0']`. T0 evaluates to `ALLOWED`; T1–T4 evaluate to `LEG_NOT_IN_ROLLOUT`. No query, DEV, or environment gate override was added.

## Entry and ownership lifecycle

```text
NarrativeStage resolved audience
 -> facade eligibility
 -> claim traversalEntryInFlight (duplicate-entry protection)
 -> prepareGlobalHandoff
 -> SceneTransition traversal cover
 -> dispose NarrativeStage and Journey ownership
 -> close legacy Travel and combat surfaces
 -> NARRATIVE mode / campaignSurface=traversal
 -> construct one TraversalT0Scene with the real GameState
 -> activeTraversal = scene
 -> SaveRepository.saveAuto(real resolved origin)
 -> scene.open
 -> reveal / release entry mutex
```

The same mount helper serves the isolated QA fixture, which explicitly disables the production entry save. Only QA resets state and bootstraps Travel. Production neither manufactures node eligibility nor mounts Travel.

## Canonical interrupts, fork, bypass and local combat

```text
Traversal onNodeHandoff(node)
 -> commitRunNodeChoice(node.id)
 -> evaluateRouteCommit -> enterRunNode -> normal bookkeeping
 -> beginNodeResolution -> resolveRunNode
 -> normal campaign combat/dialogue and markResolved
 -> enterCampaignPresentation -> resumeActiveTraversalIfReady
 -> covered cleanup of node presentation -> same scene.resumeNode(node.id)
```

Opening ambush and selected trial combat remain canonical nodes. No combat/node content, rewards, topology, or balance changed. Live-world fork selection still delegates to `selectTraversalBranch`; the selected payoff is committed later through the canonical path. Optional bypass still delegates to `bypassTraversalNode`, without fabricating a visit or resolution.

```text
optional generic road encounter
 -> active T0 owner in LOCAL_INTERACTION required
 -> createRoadEncounterConfig (existing reward-free local composition)
 -> CombatBridge.start(devQa = traversalT0QaEnabled)
 -> local victory/retreat boolean
 -> covered return to the same mounted scene
```

This seam does not enter/resolve a RunNode, mark a canonical resolution, grant campaign rewards, apply canonical combat progression, or save. `CombatBridge` retains its independent `import.meta.env.DEV` checks for iframe URL and initialization privileges. Production passes false; the isolated DEV fixture retains QA controls.

## Final arrival

```text
Traversal ARRIVING -> one onArrival -> completeTraversalT0
 -> destination/phase/in-flight guard -> campaign facade
 -> existing ARRIVING owner prevents a new T0 entry
 -> enterJourney -> covered transition
 -> completeArrival once -> disposeTraversal once
 -> normal canonical autosave
 -> JourneyCampaignBoundary.present(authoritative available nodes)
 -> waitUntilSurfaceReady -> reveal NarrativeStage
 -> explicit player agency -> commitRunNodeChoice(lion-first-refuge)
```

`completeTraversalT0Qa` was renamed to `completeTraversalT0` to reflect shared production ownership. It never commits the destination. The catastrophic Journey fallback still completes/disposes under cover, latches Journey unavailable, and opens Travel through its existing exceptional path.

## Save, reload and Escape contract

There is no save-schema change and no persisted physical session, lane, animation, consumed local beats, or route distance. Production entry saves the resolved audience boundary before scene opening. RunSystem mutations and local pickups during T0 remain in memory until final arrival. Reload or Escape/title followed by Continue loads that durable origin and creates a fresh scene at zero progress.

`renderTitle()` already disposes Traversal without saving. `continueChronicle()` now also disposes any stale owner while loading, before selecting the resumed presentation. Ordinary canonical mid-route success does not call `saveAuto`: it resolves the node then resumes Traversal. Scene local interactions and road combat do not save. At final arrival the existing Journey save persists canonical state; later explicit refuge gameplay retains its normal persistence.

Save-call audit: constructor management callbacks, Journey manual save, legacy Travel manual save, refuge/shop management, finale choice, new chronicle and canonical defeat retain their existing contracts. T0's authored stages do not open management or select the finale. Canonical defeat continues to use the existing load/checkpoint failure path after disposing Traversal; this rollout does not redesign checkpoint failure. No conflicting physical-session persistence contract was found.

## Authority matrix

| Owner | Responsibility |
| --- | --- |
| RunSystem | Available routes, canonical node entry, fork selection and optional bypass truth |
| GameApp | Presentation selection, scene lifetime, transitions, durable saves and canonical commit orchestration |
| TraversalFeaturePolicy | Static reviewed T0-only production permission |
| LionCampaignTravelRelations | Single authority for origins, destinations, stage membership and fork contract |
| TraversalT0Scene | Physical route, local interactions and live-world agency; emits handoff/arrival callbacks |
| JourneyCampaignBoundary | Canonical destination options and explicit destination agency |
| NarrativeStage | Narrative presentation, surface readiness and covered handoff |
| TravelView | Catastrophic fallback, explicit DEV legacy override, isolated QA bootstrap, own management return |

## Files changed and executable coverage

| File | Reason / invariant |
| --- | --- |
| `src/game/GameApp.ts` | Production eligibility/mount, shared scene construction, entry mutex, real origin save, owner-safe road combat, shared arrival name, stale-owner cleanup on Continue |
| `src/traversal/TraversalFeaturePolicy.ts` | Deliberately open reviewed T0 gate only |
| `src/traversal/TraversalFeaturePolicy.test.ts` | T0 allowed; T1–T4 explicitly rejected; no runtime override |
| `src/game/cin2CampaignBridge.test.ts` | Migrate historical disabled-gate/facade assertions; retain canonical commit/source guards |
| `src/game/campaignPresentationMigration.test.ts` | Shared arrival name; existing executable arrival, ready/reveal, fallback, no auto-commit, same-owner resume proofs retained |
| `src/game/traversalT0ProductionRollout.test.ts` | Real GameApp orchestration, real scenes, RunSystem and SaveRepository; duplicate entry, cover/save order, noneligibility, T1–T4 origins, same-owner canonical return, Escape/Continue, reward-free road victory and retreat without QA |
| `tools/traversal/qa-production-rollout.mjs` | Reproducible unmodified built production browser route using ordinary UI controls and standard pre-T0 save |
| `docs/reports/traversal-t0-production-rollout-1.md` | This implementation and validation report |

`TraversalT0Flow.test.ts` and `TraversalT0Scene.test.ts` were inspected and executed without unnecessary edits. Existing executable coverage exercises both fork branches, mandatory selected payoff, optional confirmation/skip/opposite-lane bypass, local combat, arrival callback once, and physical arrival without destination commitment. No broad scope guard was weakened. No historical report was rewritten.

## Validation commands and results

| Command | Result |
| --- | --- |
| `npx.cmd vitest run src/game/traversalT0ProductionRollout.test.ts src/game/campaignPresentationMigration.test.ts src/game/cin2CampaignBridge.test.ts src/traversal src/game/traversalRouteAuthority.test.ts` | PASS: 16 files, 90 tests |
| `npx.cmd tsc --noEmit` | PASS |
| `npm.cmd run build` | PASS; existing large-chunk advisory only |
| `npx.cmd vitest run --reporter=json --outputFile=tmp/traversal-t0-production-full-tests.json` | PASS: 147 files, 2,488 tests; zero failed/pending |
| Lint | Not configured in `package.json`; no lint command invented |
| `git diff --check` | PASS; Git emits ordinary LF/CRLF checkout notices |
| `node tools/traversal/qa-server.mjs 5190` | Stable local DEV server |
| `npm.cmd run preview -- --host 127.0.0.1 --port 5191 --strictPort` | Built production server |
| `node tools/traversal/qa-production-rollout.mjs` | PASS: full built production route, Escape/Continue, reload/Continue, real canonical and local combat, arrival agency and Journey after refuge resolution |
| `node tmp/campaign-presentation-migration-qa.mjs` | PASS: DEV default and explicit Journey/Narrative selectors, production default Journey, isolated DEV T0 route, exact covered arrival and same-session resumes, catastrophic Journey fallback |
| `node tmp/traversal-production-entry-smoke.mjs` | PASS: unmodified production audience resolution automatically mounts one T0 with zero Travel mounts; production ignores QA selectors; DEV preview uses TraversalPreviewSaves without changing the normal save |

Initial sandboxed Vitest could not resolve `vite.config.ts` because esbuild was denied directory access. The same tests ran successfully with approved escalation. Early test-driver fixture errors were corrected; the results above are the final passing focused/full runs. The historical VFX failure note does not apply to this current full run: all 2,488 tests passed.

## Browser evidence

Evidence is local and intentionally compact, under `tmp/traversal-t0-production-rollout-1/`. The browser driver uses the actual production bundle with no response interception, no production app hook, and no selector. It creates a normal initial GameState on a separate DEV page, loads it through the production SaveRepository, chooses the audience through Journey, and advances authored dialogue through the UI. Combat actions use ordinary deployment, attack, movement, and turn controls; diagnostic reads select legal actions and the rendered camera projects pointer positions.

Final result: `browser-results.json`, with no page errors. The production route used the normal four initial heroes and ordinary authored combat compositions. The opening ambush was won through combat input handlers. The optional road patrol ended in defeat/retreat through its ordinary result button and returned locally to the same scene; it did not invoke canonical checkpoint recovery. This is an integration proof, not a combat-balance acceptance test.

The result button for the local defeat and any post-refuge dialogue were also driven through normal UI controls by the supervising browser session while the initial driver was running. The reusable driver was updated to handle both combat outcome buttons and post-refuge dialogue itself. No result protocol message, QA victory, state mutation, production source interception, or route hook was used to complete production combat or progression.

Recorded production results:

- One Traversal mount, maximum one concurrent scene, identical DOM scene through all route returns, zero TravelView mounts.
- Canonically resolved: `lion-audience`, `lion-opening-ambush`, `lion-nomad-crossroads`, `lion-refugees`, `lion-first-trial-event`.
- Live-world fork at 0.8, mandatory selected event payoff at 0.91, arrival at 1.0.
- Two real combat iframes (`Embuscade`, `Patrouille hostile`), both `/legacy-combat.html?campaign=1`, with zero QA controls.
- Only two autosave writes during the complete physical run: resolved `lion-audience` at entry and `lion-first-trial-event` at final arrival. No intermediate node/local-combat save.
- One physical `COMPLETE` phase and one disposal under an opaque global cover (`opacity: 1`). Journey offers Refuge du Lion while the current canonical node remains `lion-first-trial-event`; first refuge is absent from visited nodes until explicit confirmation.
- Explicit refuge confirmation and its normal continue flow produce a resolved `lion-first-refuge` save, one NarrativeStage, and zero Traversal surfaces. T1 does not mount.
- Escape/title and full page reload each load the durable audience snapshot and mount a fresh zero-progress T0.

Targeted screenshots, visually inspected: `production-t0-entry.png`, `production-fork.png`, `production-arrival-agency.png`. Temporary `progress.png` and `combat-progress.png` are single overwritten diagnostic captures, not a visual corpus.

The existing migration browser regression passed via a temporary copy of `tools/cinematics/run_campaign_presentation_migration_qa.mjs`. The copy changes only the tutorial-dismiss click to `await tutorial.click({ timeout: 500 }).catch(() => {});` because the tutorial may become hidden between visibility observation and click. The historical source is unchanged. Its output is `tmp/campaign-presentation-migration-1/browser-results.json`; the complete DEV preview demonstrates same-instance canonical resumes, one completion/disposal at full opacity, no destination commit, zero Travel mounts, and working catastrophic fallback.

`entry-and-qa-results.json` independently records the entire camp-to-resolved-audience-to-T0 entry: zero Travel mounts, one Traversal mount, maximum one concurrent Traversal, and a durable resolved audience save. A separate built production page with `?qa=1&traversal=t0` remains at the ordinary title with no QA button or preview. The DEV fixture selects `TraversalPreviewSaves` and leaves an existing normal autosave byte-equivalent in content.

## Repository-wide occurrence audit

Search terms: `TRAVERSAL_PRODUCTION_GATE`, `usesTraversalPresentation`, `isTraversalProductionEnabledForLeg`, `new TraversalT0Scene`, `startTraversalT0Qa`, `enterTraversal`, `activeTraversal`, `playTraversalRoadCombat`, `traversalT0QaEnabled`, `enterCampaignPresentation`, `completeTraversalT0`, `completeTraversalT0Qa`, `enterTravel`, `showTravel`, `TraversalPreviewSaves`.

Raw file/line evidence: `tmp/traversal-t0-production-rollout-1/occurrence-audit.txt`.

| Occurrences | Classification |
| --- | --- |
| `TraversalFeaturePolicy.ts` constant, evaluator and exported predicate | Production source-controlled permission; only T0 permitted |
| `GameApp` policy import / `usesTraversalPresentation` / facade eligibility | Production selection; no second topology |
| `GameApp` sole `new TraversalT0Scene` in `enterTraversalT0` | Shared mount, real state in production; no other production construction site |
| `GameApp` `startTraversalT0Qa`, DEV `qaEnabled` + `traversalT0QaEnabled`, save-repository ternary | Isolated DEV fixture only; production constructs `SaveRepository` |
| `TraversalPreviewSaves.ts` and its test | In-memory fixture repository; never selected by production |
| `GameApp` active owner/entry/arrival fields and dispose method | Scene ownership and duplicate lifecycle guards |
| `GameApp` road combat guard/return and canonical combat `devQa` option | Separate local/canonical seams, both without effective production QA |
| `GameApp` canonical handoff detection and resume helper | Existing RunSystem commit and same-instance return |
| `GameApp` arrival callback and `completeTraversalT0` | Shared arrival facade; no destination commit |
| `GameApp` enterJourney/enterTravel arriving-owner handling | Existing covered physical completion/disposal; Journey normal, Travel exceptional |
| `GameApp` facade callers in node resolution, pending combat, combat completion, new game, Continue | Semantic campaign boundaries, not alternative route authorities |
| `GameApp` two `enterTravel` calls | Explicit policy fallback and catastrophic Journey fallback |
| `GameApp` three `showTravel` calls | Isolated QA bootstrap, enterTravel implementation, legacy management return |
| Remaining source test occurrences | Executable fixtures and historical integration/source guards; no runtime mounting authority |
| `tools/cinematics/run_campaign_presentation_migration_qa.mjs` | Historical diagnostic script with DEV-only app instrumentation; not a shipped runtime path |
| Reports under docs and tools/traversal/qa | Historical phase evidence; closed-gate statements preserved as historical facts |
| `tools/traversal/taxonomy-review.html` and archived QA JSON results | Offline review/test evidence only; no production runtime imports |
| This report | Current rollout documentation |

## Residual debt and review state

- Mid-route persistence remains intentionally atomic: unfinished T0 restarts from its durable audience origin. No partial-session restoration was introduced.
- T1–T4 have relations but no enabled runtime. Their canonical origin tests return Journey, including first refuge.
- Build retains its existing large-chunk warning.
- The pre-existing generic combat defeat modal says “Revenir à la carte”; for local road combat its normal result callback correctly returns to Traversal. Combat copy was preserved as required.

## Required-contract completion audit

| Contract | Evidence |
| --- | --- |
| A. Static gate | FeaturePolicy executable tests: true/true/T0; T1–T4 `LEG_NOT_IN_ROLLOUT` |
| B–D. Before origin, entry, no premature entry | Production entry browser smoke; real GameApp integration rejects camp, unresolved audience, inactive run and incompatible continuation |
| E. Single owner | Entry integration checks covered stage/boundary disposal; production maximum one Traversal and zero Travel mounts |
| F. Durable entry | Real SaveRepository integration validates exact origin state and save-before-open order; production autosave/write telemetry |
| G. Canonical node return | Guarded commit integration and complete production browser route preserve the same scene |
| H. Fork | Real scene flow tests for both branches; production live-world event branch and its canonical payoff |
| I. Optional bypass | RunSystem/scene flow tests prove no fake visit/resolution; complete DEV browser route skips refugees; production route confirms them |
| J. Generic road combat | Production patrol fight/retreat with no QA controls, same scene and no extra save; integration checks both victory and retreat leave all canonical state unchanged |
| K–L. Arrival and destination | Executable migration lifecycle plus DEV callback instrumentation and built production completion/disposal/agency evidence |
| M. T1 blocked | Production explicit refuge resolve/continue ends in NarrativeStage; all later-leg origin integration cases reject Traversal |
| N. Escape/reload | Built production Escape/Continue and reload/Continue; integration additionally exits after a mid-route canonical resolution and restores origin |
| O. Fallback | Executable pre/post-ready catastrophic failures and real DEV browser fallback proof |

## Final git status

Branch and HEAD remain `traversal-t0-production-rollout-1` at `54af7e14bb376708220c2a87ad01839c6274835a`. `git diff --check` passes. The only modified/untracked review files are:

```text
 M src/game/GameApp.ts
 M src/game/campaignPresentationMigration.test.ts
 M src/game/cin2CampaignBridge.test.ts
 M src/traversal/TraversalFeaturePolicy.test.ts
 M src/traversal/TraversalFeaturePolicy.ts
?? docs/reports/traversal-t0-production-rollout-1.md
?? src/game/traversalT0ProductionRollout.test.ts
?? tools/traversal/qa-production-rollout.mjs
```

Browser screenshots/JSON, raw search evidence and full-suite JSON remain local under ignored `tmp/` directories. Production output remains under ignored `dist/`.

No commit, push, or merge was performed. No world art, sprites, cinematics, camera/lane/speed/beat tuning, dialogue, save schema, combat balance, VFX, RunSystem, campaign topology, or Journey visual/presentation-mode implementation was changed.

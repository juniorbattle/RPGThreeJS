# TRAVERSAL-T0-ROUTE-RISK-PRODUCTION-1

## Baseline and activation

- Baseline: `main @ f38a5660811a4c7af0f26fe2a573db109cd8699c`.
- Branch: `traversal-t0-route-risk-production-1`.
- The new pure `resolveTraversalRiskEnabled({ dev, search })` policy enables T0 Route Risk in production and DEV by default. Only DEV with `?traversalRisk=0` disables it. `?traversalRisk=1` remains compatible but unnecessary.
- The policy is used only by `TraversalT0Scene`. The fourteen authored hazards, lane assignments, progress positions, visuals, warning timing, collision semantics, six route clocks, and 2400 ms momentum recovery are unchanged.
- Verbose root risk datasets, including `riskEnabled`, are emitted only for `DEV + ?qa=1`. The production scene keeps gameplay state internally and has no root risk telemetry. The renderer's hazard attributes remain for presentation.

## Built production browser acceptance

`npm run build` produced the bundle served by Vite preview on `127.0.0.1:5218`. The canonical Playwright driver opened it with `?qa=1&traversal=t0`, without `traversalRisk=1`. Playwright exposes the built `GameApp` instance only in the intercepted browser response; it seeds the existing T0 QA origin and invokes the shared production `GameApp.enterTraversalT0` mounting and control wiring. At canonical combats, a Playwright fixture waits for the combat runtime to boot, then sends a valid victory result through the existing `CombatBridge`. No repository production code is changed for this instrumentation.

Both full paths completed: Route 1 → CP1 → Route 2 → Cédric → Route 3 → Aider/Passer → Route 4 → fork → Route 5A/5B → branch consequence → Route 6 → arrival → Journey agency. Each path had five checkpoint entries and exits, one arrival callback, and correct route and checkpoint world isolation. Route 6 coast continued for 196/195 sampled frames without changing canonical progress.

Path A collided once with Route 1's `t0:r1:branch-1`: observed speed fell from 1.398 to 1.001, the impact was 17 px from the caravan contact point, and recovery sampled speed 1.780 about 2395 ms later. Path B moved lane by keyboard before Route 1 contact and had zero Route 1 collisions. Its Route 5B two-lane hazards produced two contacts. Path A dodged the final Route 6 obstacle; the warning led contact by 2734 ms. No Route 1 collision or dodge changed the campaign state signature, including health, gold, reputation, inventory, flags, or RunSystem state. The Route 1 impact remained in the driving scene and did not launch combat. No risk data entered save or campaign authority.

All six risk PNGs were present in `dist`, matched the approved manifest SHA-256 values, and returned HTTP 200 in the production browser run. There were no asset 404s, failed requests, broken images in inspected captures, page errors, duplicate caravans, overlapping world surfaces, or overflow. The per-segment hazard DOM counts were exactly 1/1/2/2/2 or 3/3 across Routes 1–6; only one risk renderer was mounted, and root risk telemetry stayed absent. The renderer was `aria-hidden`, had no focusable obstacle controls, and lane buttons stayed locked during 917/902 sampled transition or checkpoint frames.

The ten retained production screenshots cover 1440×810, 620×780, and 390×844. They show Route 1 obstacle and impact, the 390 px lane dodge, Route 5B roadblock, Route 6 warnings at both responsive widths, the visible Route 6 obstacle, and Journey destination agency. Visual inspection confirmed readable lanes and warning markers, reachable buttons, and aligned contact. The [production gallery](traversal-t0-route-risk-production-1-browser/production/index.html) and [machine-readable QA](traversal-t0-route-risk-production-1-browser/production/browser-qa.json) hold the evidence; the [motion data](traversal-t0-route-risk-production-1-browser/production/motion-flow.json) contains both full paths.

## Mode matrix

| Mode | Expected | Result |
| --- | --- | --- |
| DEV default | Risk ON | Passed both complete paths with no enable flag, zero risk failures, and no browser errors |
| DEV `?traversalRisk=0` | Risk OFF | Passed both complete paths; zero hazard marks and no browser errors |
| Built production default | Risk ON | Passed both complete paths and all risk, asset, responsive, checkpoint, and coast assertions |
| Built production `?traversalRisk=0` | Risk ON | Passed both complete paths; Route 1 marks remained present, Path A still collided, all six risk assets loaded, and no production telemetry appeared |

The [DEV-default QA](traversal-t0-route-risk-production-1-browser/dev/browser-qa.json), [DEV risk-off QA](traversal-t0-route-risk-production-1-browser/dev-off/browser-qa.json), and [production URL guard QA](traversal-t0-route-risk-production-1-browser/production-risk-off-url/browser-qa.json) retain full machine-readable comparisons. The DEV risk-off run produced no risk image requests or risk renderer on either path. DEV-default and production URL guard had zero risk failures and zero browser errors.

## Validation and scope

- Focused Traversal, campaign, Journey, and cinematic authority suites: 120/120 passed.
- Full Vitest: 2,578/2,578 passed across 162 files.
- `tsc --noEmit` and `npm run build`: passed.
- `git diff --check`: passed before staging.
- The obsolete `tools/traversal-t0-route-risk-polish-qa.mjs` was removed after its completed art pass; the canonical `tools/traversal-t0-browser-qa.mjs` now owns these modes.
- Only the ten production screenshots are retained. DEV comparisons and the production URL guard retain JSON evidence without duplicating the accepted art galleries.
- Historical DEV-only reports were left intact; this report supersedes their activation status.

- ROUTE RISK PRODUCTION DEFAULT: YES
- DEV RISK-OFF OVERRIDE: YES
- PRODUCTION RISK-OFF OVERRIDE: NO
- SAVE SCHEMA CHANGED: NO
- CAMPAIGN AUTHORITY CHANGED: NO
- ROUTE REWARD ADDED: NO
- PURSUIT ADDED: NO

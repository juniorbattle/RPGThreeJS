---
name: qa-evidence
description: "Use to verify RPGThreeJS changes. Chooses and runs focused vitest, tsc, the contract validator, the production build and Playwright browser drivers; manages ports and ignored output paths; separates inherited baseline failures from new regressions; promotes compact evidence only on explicit selection."
---

# QA and evidence

Current OD-2026-10-24-A/set1.10.0 retires all production videos and illustrated cinematic production. Eight IDs below are historical only; zero active video/hold/preload/shipped MP4. Preserve archived media/evidence and existing canonical moments/agency through static dialogues/tableaux. Earlier eight-slot production instructions are historical.

Contract: AUTHORING_AND_QA (`docs/contracts/AUTHORING_AND_QA.md`) and the evidence policy in `docs/reports/README.md`. Target the authority boundary being changed; do not default to the full suite.

## Verification ladder (fast to slow)

1. Focused tests: `npx vitest run <files>` (seconds). Run the touched files and their neighbours. The full suite is `npm test` (about 2 minutes): vitest, then the `node:test` suite `tools/qa/qa-job.test.mjs`. It excludes `tmp/`, `output/` and the historical cinematic tests listed in `vite.config.ts`, and allows 20 s per test.
2. Types: `npx tsc --noEmit` (about 12 seconds).
3. `npm run contracts:validate`.
4. Build: `npm run build` (tsc and vite). When media code is involved, check that `dist` holds zero MP4s after retirement (eight historical media files are archived outside public): `(Get-ChildItem dist -Recurse -Filter *.mp4).Count`.
5. Browser drivers (below), against DEV or the built production preview. Production-affecting work needs the production build.
6. `git diff --check` and `git status`: only intended edits remain.

vitest loads `vite.config.ts`, which prints `[VFX Preview]` lines. They are harmless. The build prints an inherited chunk-size advisory.

## Browser drivers (usage verified in the scripts)

| Driver | Flags and env | Default output | Port |
| --- | --- | --- | --- |
| `tools/cinematics/run_cin6d6_route_browser_qa.mjs` | `--production`; env `CIN6D6_VIEWPORT` (default `1920x1080`), `CIN6D6_ROUTE_OUTPUT_DIR`, `CIN6D6_BASE_URL`, `CIN6D6_PORT`; `CIN6D6_VIDEO_RETIREMENT=1` with `--production`, `CIN6D6_LIVE_OS_FLIP=1` and `CIN6D6_ROUTE_SCENARIO=opening-camp-audience`, without reduced-motion, blocked-media or interrupt flags (the driver refuses other combinations), replays the native opening → camp → audience path and checks that no video is created or requested; also game-setting reduced motion, OS-only reduced motion and blocked-media modes (read the head of the script) | `tmp/cinematics/cin6d6/browser-qa/routes` | production preview 5242 (strict); DEV expects a server on 5173 |
| `tools/demo-continuous-production-qa.mjs` | env `DEMO_QA_TARGET`, `DEMO_QA_OUTPUT`, `DEMO_QA_PORT`, `DEMO_QA_VIEWPORT`, `DEMO_QA_OS_MOTION`, `DEMO_QA_GAME_MOTION`, `DEMO_QA_TOUCH`; continuations require matching `DEMO_QA_EARNED_SAVE` / `DEMO_QA_PRIOR_PROOF`; register `live.qaJobs` first | unique ignored `tmp/demo/...` | strict selected free port |
| `tools/dialogue/run-dialogue-ui-staging-qa.mjs` | spawns vite with `--strictPort` | read the script | read the script |

Other drivers (`tools/ui-*-qa.mjs`, `tools/refuge-hub-continuity-1-qa.mjs`, `tools/combat-*-qa.mjs`): read the script header for flags, ports and output before running.

Historical only: `tools/cinematics/run_eight_slot_browser_qa.mjs` and `run_production_eight_slot_media_qa.mjs` certify the production videos retired by OD-2026-10-24-A. Their past results keep their own scope; do not replay them as current proof.

Viewports used by accepted evidence: desktop 1440x810 or 1920x1080 (1366x768 for cinematics), intermediate 620x780, narrow 390x844.

## Long jobs and interruption recovery (OD-2026-10-02-C)

Follow docs/autonomy/QA_JOB_CONTINUITY.md. Register live.qaJobs before launching long QA. The campaign driver writes qa-job.json with PID/port, parameters and driver/helper/source/build hashes, then a final result hash/status after cleanup. Workers never edit shared MD/JSON. The lock holder runs sync at heartbeat/checkpoint and inspects receipts at restart before rerunning. Legacy results with unknown driver identity or old assertions are not current acceptance. A terminal quota event does not prove child processes stopped. Finished job history lives unchanged in `docs/autonomy/archive/`; `tools/qa/qa-job.mjs` keeps those job IDs and outputs reserved, and jobs annotated `ORPHANED_UNVERIFIED` there no longer count as running.

OD-2026-10-04-A: product code first. Per run, mechanical gates and one built-browser smoke tied to the change. Wider viewport/motion/route QA belongs only at queue-item milestones; sensitive guardian review remains mandatory under OD-2026-10-02-C. Reuse terminal compatible receipts and existing runners. A new QA tool requires one sentence of justification in the paired state. For a harness defect, make one minimal assertion correction, then continue production; no instrumentation rewrite loop and no false acceptance. Promote only a few inspected captures at the milestone, never raw diagnostics.

## Ports and processes

Codex, Devin or Claude may run QA at the same time. Pick a port nobody listens on (`Get-NetTCPConnection -LocalPort <n> -ErrorAction SilentlyContinue`). The DEV server default 5173 is not strict and may shift. Stop only the servers you started and record their PIDs. Never stop a process you did not start: report an orphan's port and PID to the operator (OD-2026-10-25-A). Claude starts the DEV server through `preview_start` and `.claude/launch.json`; project drivers keep their own servers.

## Evidence policy

- Ordinary reruns write to ignored paths: `tmp/`, `docs/reports/evidence/`, `tools/qa-shots/`. Never point a rerun at a tracked or historical folder.
- Promote tracked evidence only on explicit selection: one small machine-readable result and a few inspected screenshots at a milestone; prefer the existing task record over a new report. Never overwrite a validated historical proof.
- New task reports carry the metadata listed in `docs/reports/README.md`.
- Record machine-readable viewport and state results and inspect the actual captures, not only pass flags. Check real bounds, clipping, overflow and hit targets.
- When affected, also exercise failed asset loads, console errors, transitions, resume points and reduced motion.

## Classify failures

Name inherited baseline failures precisely and keep them apart from new regressions. Since `docs/reports/test-baseline-repair-2026-10-25.md` the full suite is green: treat any failure as a regression until proven otherwise. The historical cinematic tests excluded from the suite fail by design against retired media. Fixture limits: combat results injected through iframe fixtures prove lifecycle, not tactical balance; a DEV candidate gate is not production acceptance; a screenshot taken during a transition is not settled-typography proof.

## Report (return this)

Commands run with exit status; test counts per file; tsc and validator status; build status; driver results with output paths and viewports; baseline failures (named) versus new regressions; what was not run; ports and PIDs started and stopped.

---
name: qa-evidence
description: "Use to verify RPGThreeJS changes. Chooses and runs focused vitest, tsc, the contract validator, the production build and Playwright browser drivers; manages ports and ignored output paths; separates inherited baseline failures from new regressions; promotes compact evidence only on explicit selection."
---

# QA and evidence

Contract: AUTHORING_AND_QA (`docs/contracts/AUTHORING_AND_QA.md`) and the evidence policy in `docs/reports/README.md`. Target the authority boundary being changed; do not default to the full suite.

## Verification ladder (fast to slow)

1. Focused tests: `npx vitest run <files>` (seconds). Run the touched files and their neighbours.
2. Types: `npx tsc --noEmit` (about 12 seconds).
3. `npm run contracts:validate`.
4. Build: `npm run build` (tsc and vite). When media code is involved, check that `dist` holds exactly eight MP4s: `(Get-ChildItem dist -Recurse -Filter *.mp4).Count`.
5. Browser drivers (below), against DEV or the built production preview. Production-affecting work needs the production build.
6. `git diff --check` and `git status`: only intended edits remain.

vitest loads `vite.config.ts`, which prints `[VFX Preview]` lines. They are harmless. The build prints an inherited chunk-size advisory.

## Browser drivers (usage verified in the scripts)

| Driver | Flags and env | Default output | Port |
| --- | --- | --- | --- |
| `tools/cinematics/run_cin6d6_route_browser_qa.mjs` | `--production`; env `CIN6D6_VIEWPORT` (default `1920x1080`), `CIN6D6_ROUTE_OUTPUT_DIR`, `CIN6D6_BASE_URL`, `CIN6D6_PORT`; also game-setting reduced motion, OS-only reduced motion and blocked-media modes (read the head of the script) | `tmp/cinematics/cin6d6/browser-qa/routes` | production preview 5242 (strict); DEV expects a server on 5173 |
| `tools/cinematics/run_eight_slot_browser_qa.mjs` | env `EIGHT_SLOT_QA_OUTPUT` | `tmp/cinematics/eight-slot-qa` | read the script |
| `tools/cinematics/run_production_eight_slot_media_qa.mjs` | env `CIN8_MEDIA_OUTPUT`; isolated real-player proof, not campaign acceptance | `tmp/cinematics/eight-slot-remaster/media-qa` | read the script |
| `tools/traversal-t3-production-qa.mjs` | `--production`, `--candidate`, `--output=`, `--port=`, `--scenario=` | `tmp/traversal/t3-integration-production` or `-dev` | 5241 production, 5240 DEV |
| `tools/traversal-t0-browser-qa.mjs` | `--production`, `--print-output`, `--output=` | `docs/reports/evidence/traversal-t0/...` | read the script |
| `tools/dialogue/run-dialogue-ui-staging-qa.mjs` | spawns vite with `--strictPort` | read the script | read the script |

Other drivers (`tools/ui-*-qa.mjs`, `tools/narrative-stage-utility-consistency-1-qa.mjs`, `tools/refuge-hub-continuity-1-qa.mjs`, `tools/traversal-t1-*.mjs`, `tools/combat-*-qa.mjs`): read the script header for flags, ports and output before running.

Viewports used by accepted evidence: desktop 1440x810 or 1920x1080 (1366x768 for cinematics), intermediate 620x780, narrow 390x844.

## Ports and processes

The recurring Codex run and a Devin session may run QA at the same time. Pick a port nobody listens on (`Get-NetTCPConnection -LocalPort <n> -ErrorAction SilentlyContinue`). The DEV server default 5173 is not strict and may shift. Stop only the servers you started and record their PIDs.

## Evidence policy

- Ordinary reruns write to ignored paths: `tmp/`, `docs/reports/evidence/`, `tools/qa-shots/`. Never point a rerun at a tracked or historical folder.
- Promote tracked evidence only on explicit selection: one small machine-readable result, about 5 to 10 screenshots, and the report. Never overwrite a validated historical proof.
- New task reports carry the metadata listed in `docs/reports/README.md`.
- Record machine-readable viewport and state results and inspect the actual captures, not only pass flags. Check real bounds, clipping, overflow and hit targets.
- When affected, also exercise failed asset loads, console errors, transitions, resume points and reduced motion.

## Classify failures

Name inherited baseline failures precisely and keep them apart from new regressions. Documented so far: the extended historical CIN-6E-A set has one inherited allowlist omission for `NarrativeTableau.test.ts` (from commit `e898e61`); re-verify before relying on it. Fixture limits: combat results injected through iframe fixtures prove lifecycle, not tactical balance; a DEV candidate gate is not production acceptance; a screenshot taken during a transition is not settled-typography proof.

## Report (return this)

Commands run with exit status; test counts per file; tsc and validator status; build status; driver results with output paths and viewports; baseline failures (named) versus new regressions; what was not run; ports and PIDs started and stopped.

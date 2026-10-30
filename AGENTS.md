# RPGThreeJS agent guide

RPGThreeJS is a narrative tactical RPG with an authored campaign (Vite, TypeScript, three.js, vitest with happy-dom, Playwright QA). Three agents work in this repository: interactive Claude Code sessions, the recurring Codex run `rpgthreejs-auto-dev-90m` (saved PAUSED) and interactive Devin sessions. Under OD-2026-10-25-A Claude is the principal writer of interactive sessions while the automation stays paused; Codex works on request, never at the same time, under the same lock. This file is their shared entry point. It routes to authorities; it does not restate them.

## Authority and reading order

1. Explicit operator decisions: `docs/autonomy/OPERATOR_DECISIONS.md` and the files it links.
2. `docs/game/GAME_CONSTITUTION.md` and the eight LOCKED contracts (`docs/contracts/README.md`, `contracts.manifest.json`, then every contract relevant to the task). Contract set 1.11.0: approved amendment `PRODUCTION-CONTRACTS-MUSIC-AUDIO-1` / OD-2026-10-29-B, immutable baseline `a4ff05b2ced24e26af2e5b15d21b87ead1d24dfa`; set 1.10.0 (`PRODUCTION-CONTRACTS-CINEMATIC-RETIREMENT-1` / OD-2026-10-24-A, `da69ec63`) stays in force for cinematics. Original lock `PRODUCTION-CONTRACTS-LOCK-1` / `b1e8858` remains historical.
3. Current source: it states what is implemented today.
4. Canonical docs (`docs/project/`, `docs/content/`), then dated reports in `docs/reports/`. Reports are historical evidence, never doctrine. `docs/traversal/` records the retired physical Traversal and is historical.

The code adapts to a LOCKED contract, never the reverse. On a conflict: record it, mark the task blocked, continue with an independent task.

## Red lines

- Never edit `docs/contracts/**` or `docs/game/GAME_CONSTITUTION.md` in a normal task. Gate (must print nothing): `git diff --exit-code a4ff05b2ced24e26af2e5b15d21b87ead1d24dfa HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md`.
- Presentation never creates or changes game truth (route, outcome, resource, save). Truth owners: `RunSystem` and campaign relations, versioned saves, tactical combat. `GameApp` coordinates lifecycle and handoffs only.
- Zero active video slots. Retain the eight historical IDs (`src/cinematics/ApprovedProductionVideos.ts`), canonical moments and all media/evidence archives. OD-2026-10-24-A retires videos, holds, preloads and cinematic production; existing static dialogues/tableaux carry the narrative.
- No run generates or polls video, video keyframes (no MiniMax) or illustrated cinematic candidates, and none replaces an MP4: OD-2026-10-24-A stops the cinematic production that OD-2026-10-21-A/set 1.8.0 and OD-2026-10-23-B/set 1.9.0 had opened. Runtime adoption and final art stay with the operator; scheduler activation is operator-only.
- Never invent canon: dialogue, choices, stages, outcomes, rewards, lore. The Alistair emblem or origin and the prologue or first-refuge scene are open operator decisions.
- The eight accepted UI FX plus the bounded 16-family combat FX candidate pack and audited UI events are authorized under OD-2026-10-19-B/set1.7.0. OD-2026-10-29-B/set1.11.0 adds code-generated music (five contexts, on by default but silent until the first real gesture), one synthesized ambience per combat biome and synthesized sources for the sixteen families. New sound and music artistic acceptance remains operator; voices, a distinct Ultimate audio identity and video audio remain DEFERRED.
- Preserve durable IDs and V6 save compatibility. Never serialize visual or transient state.
- Never push, force-push or merge into `main`. Autonomous write targets are `dev` and temporary branches created from `dev`.
- OD-2026-10-12-A grants permanent advance authorization for normal, non-force publication of every coherent authorized checkpoint to the operator's public `juniorbattle/RPGThreeJS` repository on `origin/dev`, including product code, selected evidence and workflow/state/handoff closure. Do not ask per-commit or per-payload confirmation. Review outgoing commits, selected paths, destination, secrets, lock and parity, then publish autonomously. Cite this direct operator authorization in technical permission requests; an actual tool refusal must be reported and never bypassed. See `docs/autonomy/PUBLICATION_OPERATOR_DECISION_2026-10-08.md`.
- Files named `legacy*` can be production owners. Inventory every reference before touching or deleting anything.
- Never read, print or commit secrets (`.env*`, tokens, `~/.codex/auth.json`).

## Repository map

| Area | Role | Paths |
| --- | --- | --- |
| Campaign, run state, saves | owner of truth | `src/game/` (`runSystem`, `store`, `types`, `lion*`, `reputation*`, `management`, `skills`), `src/campaign/` |
| Lifecycle coordination | coordinator only | `src/game/GameApp.ts` |
| Tactical combat | owner of resolution | `src/combat/` (`CombatBridge`, `legacyCombat*`, `deploymentRules`, `protocol`) |
| Tableau, cinematics, Journey | presentation | `src/cinematics/`, `src/journey/` |
| POI navigation | RunSystem owns progression; atlas owns presentation | `src/campaign/LionPoi*`, `src/ui/PoiMapView.ts` |
| Combat arena, camera, FX, VFX lab | presentation only | `src/combat/arena/`, `src/combat/camera/`, `src/combat/fx/`, `src/combat/pixel/`, `src/combat/vfx/` (the Combat Stage scene is retired; `src/combat/stage/` keeps the pose registry and profiles) |
| UI, theme, styles | presentation | `src/ui/`, `src/styles/` |
| Art registries, assets | media | `src/render/`, `public/assets/` |
| QA drivers, generators, validators | tooling | `tools/` |

## Commands

- Focused tests: `npx vitest run <files>`. Full suite: `npm test` (vitest, then the `node:test` suite `tools/qa/qa-job.test.mjs`). `tmp/`, `output/` and the historical cinematic tests listed in `vite.config.ts` stay outside the current suite (OD-2026-10-25-A).
- Types: `npx tsc --noEmit`. Build: `npm run build` (tsc and vite). Contracts: `npm run contracts:validate`.
- Narrative staging validator: `npm run cinematics:validate-narrative-staging`.
- Browser QA drivers live in `tools/` (Playwright). Ports, flags and output paths: `.agents/skills/qa-evidence/SKILL.md`.
- vitest loads `vite.config.ts`, which prints `[VFX Preview]` lines. They are harmless.

## Autonomy and multi-agent protocol

- Protocol: `docs/autonomy/MULTI_AGENT_PROTOCOL.md`, which extends the LOCKED `docs/contracts/AUTONOMOUS_WORK_PROTOCOL.md`.
- Continuity truth: Git, `dev`, the contracts, `docs/autonomy/AUTONOMOUS_WORK_STATE.md` and `.json`, and the execution lock `.git/codex-autonomy.lock`. The state holds current facts only; closed history lives unchanged in `docs/autonomy/archive/` (OD-2026-10-25-A).
- One writer per working tree. At the start of a run or session do the read-only preflight (`handoff-governor` or the `autonomy-handoff` skill) before modifying anything. Never reset, clean or check out over uncommitted work: it may belong to an interrupted run.

## Specialists

Subagent profiles live in `.agents/agents/` (Devin) and `.codex/agents/` (Codex). The knowledge they load lives in `.agents/skills/`. `.claude/agents/` and `.claude/skills/` hold thin pointers to these canonical files for Claude Code (OD-2026-10-25-A): edit the canonical files, then keep names and descriptions in step. Retired profiles live in `.agents/archive/`. They are reviewers or runners and are read-only by default. Writing stays with the single orchestrator, who should load the matching skill first.

| Role | Skill | Use for |
| --- | --- | --- |
| `handoff-governor` | `autonomy-handoff` | run start, takeover, WIP snapshot, closeout |
| `contracts-guardian` | `contracts-compliance` | contract mapping, authority-boundary review, compliance matrix |
| `qa-evidence-runner` | `qa-evidence` | focused tests, tsc, build, browser drivers, evidence |
| `ui-accessibility` | `ui-accessibility` | UI, responsive layout, keyboard, reduced motion |
| `cinematics-journey` | `cinematics-journey` | Journey, retired cinematic identities and their static moments, skip, fallback, resume |
| `narrative-tableau` | `narrative-tableau` | relational grouping, stable facing, cast/ATE transitions, dialogue and context |
| `combat-vfx-sprites` | `combat-vfx-sprites` | frame animation of actors, combat poses and motion, arena presentation, VFX, combat sound cues and music |

Codex starts subagents only when authorized. The recurring instruction authorizes the named roles for the milestone/risk triggers in MULTI_AGENT_PROTOCOL.md; it does not yet name `combat-vfx-sprites`, and adding it there is an operator action. Applying a skill does not require spawning its reviewer. Continue coherent dev work autonomously without routine operator approval; the operator performs final demo testing.

## Conventions

- Commit messages: one imperative line, then a trailer line `Agent: <codex|devin|claude>; Run: <runId>`. Claude adds its `Co-Authored-By` line after the trailer; its runIds read `claude-<topic>-<YYYYMMDDTHHMMZ>`.
- The owner's host uses `core.autocrlf=true`: run `git diff --check` and avoid whitespace-only churn.
- Ordinary QA writes to ignored paths (`tmp/`, `docs/reports/evidence/`, `tools/qa-shots/`). Tracked evidence is promoted explicitly and never overwritten.
- New task reports follow `docs/reports/README.md`.

## Current priority

The live state's `nextAction` gives the exact next step. OD-2026-10-25-C ([demo finish line](docs/autonomy/DEMO_FINISH_LINE_OPERATOR_DECISION_2026-10-25.md)) is the current direction and supersedes the older stacked directives of the demo completion plan. Three tracks finish the demo:

- **A. Action and skill VFX.** Since OD-2026-10-29-A, combat plays procedural FX recipes only (`src/combat/fx/`); VFX Composer publications no longer play in combat. The operator reviews them in play; Claude retouches them on request.
- **B. Unit liveliness.** Delivered by the pixel sheets and the coded motion (OD-2026-10-29-A); the operator reviews it in play. Hero frame animation is dropped (OD-2026-10-30-A): coded motion on every character is the demo's animation. The other lots of `docs/combat/LOCAL_ART_MISSION.md` stay undecided, and no image generation runs without the operator's confirmation.
- **C. Music.** Contract set 1.11.0 (OD-2026-10-29-B): code-generated music for five contexts (`src/audio/music/`, adapted from the RPGCards engine) and biome ambience are delivered; the operator accepts them by listening. Each of the sixteen effect families can play its file or its synthesized source (`src/audio/synthCues.ts`, file by default); the operator compares them in the QA lab workshop and his choices become the default.

Then the operator PC playtest, a fix list, and a frozen demo; the mobile pass only if the operator wants it. The Alistair narrative pilot, Bois-Clair relational finishing, new systems or content, rebalancing and art remasters stay frozen until then, unless the operator asks. A defect found while playing can always be fixed.

## Standing constraints

- Cinematics (OD-2026-10-24-A, set 1.10.0): zero active video, video-derived hold, preload or shipped MP4; the eight historical IDs and every archive and proof stay. Existing static dialogues and tableaux carry the moments. No illustrated or video generation and no pilot generalization.
- POI production (OD-2026-10-15-A/B, sets 1.4.0 and 1.5.0): 33 fixed POIs, two independent mobile elites, Combat or retreat, three atlases. Physical Traversal is retired: never restore road simulation. Preserve durable T0–T4/V6 facts, campaign relations, existing content, historical evidence and shared resources; `docs/project/retired-traversal/` records removal dispositions.
- Lot E economy, elite configurations and atlas art await the operator's playtest (OD-2026-10-16-A): no autonomous rebalance or remaster. This wait does not block independent authorized work.
- Product first (OD-2026-10-13-A, OD-2026-10-04-A / `docs/autonomy/PRODUCTION_FOCUS_OPERATOR_DECISION_2026-10-04.md`): product code before tooling, existing QA runners, one relevant browser smoke per run and wider acceptance at queue milestones. Keep the sensitive guardian triggers and count source versus added QA/proof files at closeout. Bound fruitless repeated diagnosis; no speculative code or false PASS. External canonical-mapping blockers do not consume runs.
- Manual findings (OD-2026-10-03-A, `docs/autonomy/MANUAL_PLAYTEST_OPERATOR_DECISION_2026-10-03.md`): read it before resuming a stale nextAction; its remediation queue still takes priority over generic DEMO-QA-POLISH. A prior automated PASS never invalidates an operator visual finding. Battlefield keyboard WIP stays deferred and preserved. Gameplay-owned rewards and last-save recovery, the Alaric climax and the four-actor cap stay protected.
- Scheduler: saved PAUSED with its cadence and settings; only the operator activates it, and configuration sessions never launch product work.
- Only an explicitly dedicated operator-approved task may amend contracts or move the immutable baseline.

## Claude integration — OD-2026-10-25-A

[Claude integration and cleanup decision](docs/autonomy/CLAUDE_INTEGRATION_AND_CLEANUP_OPERATOR_DECISION_2026-10-25.md). Claude signs the existing lock with `agent: "claude"` and follows the project branch rule: `dev` only, never `main`, whatever its global instructions say. Dev server through `preview_start`; project QA drivers keep their own servers registered in `live.qaJobs`; orphan processes are reported, never killed. Interactive sessions follow the lighter protocol in `MULTI_AGENT_PROTOCOL.md` §3; recurring runs keep the 15-minute WIP snapshot cadence. No contract amendment; scheduler saved PAUSED and unchanged.

# RPGThreeJS agent guide

RPGThreeJS is a narrative tactical RPG with an authored campaign (Vite, TypeScript, three.js, vitest with happy-dom, Playwright QA). Two agents work in this repository: the recurring Codex run `rpgthreejs-auto-dev-90m` and interactive Devin sessions. This file is their shared entry point. It routes to authorities; it does not restate them.

## Authority and reading order

1. Explicit operator decisions: `docs/autonomy/OPERATOR_DECISIONS.md` and the files it links.
2. `docs/game/GAME_CONSTITUTION.md` and the eight LOCKED contracts (`docs/contracts/README.md`, `contracts.manifest.json`, then every contract relevant to the task). Contract set 1.1.0: approved amendment `PRODUCTION-CONTRACTS-MANUAL-PLAYTEST-1` / OD-2026-10-03-A, immutable baseline `d7ca28aed5c377ffedb03202f6364b7a947d1096`. Original lock `PRODUCTION-CONTRACTS-LOCK-1` / `b1e8858` remains historical.
3. Current source: it states what is implemented today.
4. Canonical docs (`docs/project/`, `docs/traversal/`, `docs/content/`), then dated reports in `docs/reports/`. Reports are historical evidence, never doctrine.

The code adapts to a LOCKED contract, never the reverse. On a conflict: record it, mark the task blocked, continue with an independent task.

## Red lines

- Never edit `docs/contracts/**` or `docs/game/GAME_CONSTITUTION.md` in a normal task. Gate (must print nothing): `git diff --exit-code d7ca28aed5c377ffedb03202f6364b7a947d1096 HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md`.
- Presentation never creates or changes game truth (route, outcome, resource, save). Truth owners: `RunSystem` and campaign relations, versioned saves, tactical combat. `GameApp` coordinates lifecycle and handoffs only.
- Exactly eight video slots (`src/cinematics/ApprovedProductionVideos.ts`). No ninth slot, no enemy-reveal or routine video. A prologue or first-refuge video needs a dedicated contract task first.
- Recurring runs never generate or poll video or keyframes (no MiniMax) and never replace an MP4. Media remaster is an external manual workstream.
- Never invent canon: dialogue, choices, stages, outcomes, rewards, lore. The Alistair emblem or origin and the prologue or first-refuge scene are open operator decisions.
- Audio is DEFERRED. Do not infer an audio doctrine.
- Preserve durable IDs and V6 save compatibility. Never serialize visual or transient state.
- Never push, force-push or merge into `main`. Autonomous write targets are `dev` and temporary branches created from `dev`.
- Files named `legacy*` can be production owners. Inventory every reference before touching or deleting anything.
- Never read, print or commit secrets (`.env*`, tokens, `~/.codex/auth.json`).

## Repository map

| Area | Role | Paths |
| --- | --- | --- |
| Campaign, run state, saves | owner of truth | `src/game/` (`runSystem`, `store`, `types`, `lion*`, `reputation*`, `management`, `skills`), `src/campaign/` |
| Lifecycle coordination | coordinator only | `src/game/GameApp.ts` |
| Tactical combat | owner of resolution | `src/combat/` (`CombatBridge`, `legacyCombat*`, `deploymentRules`, `protocol`) |
| Tableau, cinematics, Journey | presentation | `src/cinematics/`, `src/journey/` |
| Traversal (T0 reference, T1, T3) | presentation and ephemeral scene state | `src/traversal/` |
| Combat Stage, VFX | presentation only | `src/combat/stage/`, `src/combat/vfx/` |
| UI, theme, styles | presentation | `src/ui/`, `src/styles/` |
| Art registries, assets | media | `src/render/`, `public/assets/` |
| QA drivers, generators, validators | tooling | `tools/` |

## Commands

- Focused tests: `npx vitest run <files>`. Full suite: `npm test`.
- Types: `npx tsc --noEmit`. Build: `npm run build` (tsc and vite). Contracts: `npm run contracts:validate`.
- Narrative staging validator: `npm run cinematics:validate-narrative-staging`.
- Browser QA drivers live in `tools/` (Playwright). Ports, flags and output paths: `.agents/skills/qa-evidence/SKILL.md`.
- vitest loads `vite.config.ts`, which prints `[VFX Preview]` lines. They are harmless.

## Autonomy and multi-agent protocol

- Protocol: `docs/autonomy/MULTI_AGENT_PROTOCOL.md`, which extends the LOCKED `docs/contracts/AUTONOMOUS_WORK_PROTOCOL.md`.
- Continuity truth: Git, `dev`, the contracts, `docs/autonomy/AUTONOMOUS_WORK_STATE.md` and `.json`, and the execution lock `.git/codex-autonomy.lock`.
- One writer per working tree. At the start of a run or session do the read-only preflight (`handoff-governor` or the `autonomy-handoff` skill) before modifying anything. Never reset, clean or check out over uncommitted work: it may belong to an interrupted run.

## Specialists

Subagent profiles live in `.agents/agents/` (Devin) and `.codex/agents/` (Codex). The knowledge they load lives in `.agents/skills/`. They are reviewers or runners and are read-only by default. Writing stays with the single orchestrator, who should load the matching skill first.

| Role | Skill | Use for |
| --- | --- | --- |
| `handoff-governor` | `autonomy-handoff` | run start, takeover, WIP snapshot, closeout |
| `contracts-guardian` | `contracts-compliance` | contract mapping, authority-boundary review, compliance matrix |
| `qa-evidence-runner` | `qa-evidence` | focused tests, tsc, build, browser drivers, evidence |
| `ui-accessibility` | `ui-accessibility` | UI, responsive layout, keyboard, reduced motion |
| `cinematics-journey` | `cinematics-journey` | eight slots, Journey, skip, fallback, resume |
| `narrative-tableau` | `narrative-tableau` | relational grouping, stable facing, cast/ATE transitions, dialogue and context |
| `traversal-engineer` | `traversal-engineer` | T0/T1/T3 ground, route/checkpoint motion, Risk/Reward/Pursuit, depth and spawn lifetime |

Codex starts subagents only when authorized. The recurring instruction authorizes the named roles for the milestone/risk triggers in MULTI_AGENT_PROTOCOL.md; applying a skill does not require spawning its reviewer. Continue coherent dev work autonomously without routine operator approval; the operator performs final demo testing.

## Conventions

- Commit messages: one imperative line, then a trailer line `Agent: <codex|devin>; Run: <runId>`.
- The owner's host uses `core.autocrlf=true`: run `git diff --check` and avoid whitespace-only churn.
- Ordinary QA writes to ignored paths (`tmp/`, `docs/reports/evidence/`, `tools/qa-shots/`). Tracked evidence is promoted explicitly and never overwritten.
- New task reports follow `docs/reports/README.md`.

## Active manual-playtest priority

Read OD-2026-10-03-A and MANUAL_PLAYTEST_OPERATOR_DECISION_2026-10-03.md before resuming a stale nextAction. Its ordered remediation queue takes priority over generic DEMO-QA-POLISH; battlefield keyboard WIP is deferred and preserved. Prior automated PASS cannot invalidate the operator visual finding. The contract amendment is complete at the baseline above; runtime corrections require fresh acceptance. Eight videos, temporary-gold authority, Alaric climax and the four-actor cap remain protected. Only an explicitly dedicated operator-approved task may amend contracts or move the immutable baseline.

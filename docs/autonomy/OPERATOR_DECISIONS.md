# Operator decisions ledger

Append-only index of the explicit operator decisions that bind autonomous work. The newest decision wins. Never rewrite an entry: mark it superseded and add a new one. Each entry links its source of truth; do not copy decision text here.

| ID | Date (America/Toronto) | Decision | Source | Status |
| --- | --- | --- | --- | --- |
| OD-2026-10-01-A | 2026-10-01 | Standing authorization to use the local MiniMax key for RPGThreeJS clip work; active, rhythmic FF9-inspired direction for the eight cinematics | [CINEMATIC_VIDEO_OPERATOR_DECISION_2026-10-01.md](CINEMATIC_VIDEO_OPERATOR_DECISION_2026-10-01.md) | SUPERSEDED IN PART by OD-2026-10-01-B: generation, polling and replacement are excluded from recurring runs; the provider permission remains for explicitly engaged independent video work |
| OD-2026-10-01-B | 2026-10-01 | Video production and art direction leave the autonomous queue (EXTERNAL_MANUAL_WORKSTREAM). Autonomy prepares structure and existing-media QA, then queue item 9. The prologue cinematic and the first-refuge scene are planning only: no new slot, no new ID. The Alistair emblem or origin is undecided and not urgent | [CINEMATIC_STRUCTURE_OPERATOR_DECISION_2026-10-01.md](CINEMATIC_STRUCTURE_OPERATOR_DECISION_2026-10-01.md) | ACTIVE |
| OD-2026-10-02-A | 2026-10-02 | Multi-agent alignment: the six defaults listed below | [MULTI_AGENT_PROTOCOL.md](MULTI_AGENT_PROTOCOL.md) | ACTIVE, merged into `dev` on 2026-10-02 |
| OD-2026-10-02-B | 2026-10-02 | Integrate `devin/agents-wave1` into `dev` through the lock holder, provided it does not impact Codex; push `origin/dev`; brief Codex through the repository and its automation memory so that it adapts, updates itself and resumes autonomous work knowing that Devin collaborates | [Devin to Codex briefing](handoffs/2026-10-02T0533Z-devin-to-codex-briefing.md) | ACTIVE |
| OD-2026-10-02-C | 2026-10-02 | Adopt efficiency lot 1: milestone/risk reviews, short prompt, QA receipts and safe snapshots; continue autonomously to demo completion with operator final testing | [Autonomous efficiency decision](AUTONOMY_EFFICIENCY_OPERATOR_DECISION_2026-10-02.md) | ACTIVE; models/cadence/budget retained, automation remains paused |
| OD-2026-10-03-A | 2026-10-03 | Manual playtest production correction; highest remediation priority before generic DEMO-QA-POLISH continuation; dedicated contract amendment first | [Manual playtest decision](MANUAL_PLAYTEST_OPERATOR_DECISION_2026-10-03.md) | ACTIVE; affected historical QA does not invalidate manual findings; keyboard/combat work deferred and preserved |
| OD-2026-10-04-A | 2026-10-04 | Production first; one smoke per run, broad acceptance at milestones, minimal harness correction, external-blocker isolation and WIP snapshots within15min | [Production focus](PRODUCTION_FOCUS_OPERATOR_DECISION_2026-10-04.md) | ACTIVE; supersedes expansive operational QA guidance, preserves LOCKED targets and sensitive guardian triggers |
| OD-2026-10-08-A | 2026-10-08 | Subsequent authorized publications use normal non-force pushes of dev and owned wip branches to the operator's public origin, with reviewed selected paths and no secrets, ignored outputs or main | [Publication decision](PUBLICATION_OPERATOR_DECISION_2026-10-08.md) | ACTIVE |
| OD-2026-10-08-B | 2026-10-08 | Standing authorization to publish coherent authorized checkpoints, including workflow and state closure, to origin/dev without routine per-checkpoint confirmation; approve a903b6e metadata closure and verified lock release | [Standing dev publication authorization](PUBLICATION_OPERATOR_DECISION_2026-10-08.md#standing-dev-publication-authorization--od-2026-10-08-b) | ACTIVE; extends OD-2026-10-08-A |

## OD-2026-10-02-A details

1. WIP found on 2026-10-02: snapshot only, no takeover. Snapshot `a0b75148ca55207a6b59da2f05f912b435ce2e44` on `origin/wip/rpgthreejs-auto-dev-90m-20261002T0338` (see [the handoff note](handoffs/2026-10-02-devin-wip-snapshot.md)).
2. Shared layout: `AGENTS.md`, `.agents/` (skills and Devin agents) and `.codex/agents/`.
3. Roll out the six wave-1 specialists first.
4. WIP snapshots go to `wip/<runId>` branches.
5. Stable run rules live in the repository. The operator shortens the recurring prompt (protocol Appendix A).
6. The stale-lock threshold stays 105 minutes. An earlier takeover needs an explicit operator order.

## OD-2026-10-02-B details

1. The integration was done by the lock holder only after the stale-lock conditions held (heartbeat older than 105 minutes, dead `pid`, automation paused, no Codex activity, no QA process). It adds documentation files only, overlaps none of the uncommitted work and has no consumer in `src/` or `tools/`.
2. `origin/dev` is pushed after the integration, then the lock is released.
3. Codex is informed through [the briefing](handoffs/2026-10-02T0533Z-devin-to-codex-briefing.md) and a short note appended to its automation memory. Changing the recurring prompt stays an operator action.

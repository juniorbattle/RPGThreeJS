# Engineering rules

1. Derive current behavior from production source, then update [canonical docs](../README.md). Cite a baseline for any report or QA result.
2. Keep `GameApp` as presentation/lifecycle coordinator; `RunSystem` and campaign relations own topology, node eligibility, effects, temporary loot, and durable state. Traversal owns physical presentation and ephemeral Route state.
3. Preserve save compatibility and canonical node handoffs. A visual scene must not invent campaign results or direct secured gold changes.
4. Gate future Traversal legs deliberately in `TraversalFeaturePolicy` and the `GameApp` selector. A relation entry alone is not production enablement.
5. Keep T0 Route Risk, Reward, and Pursuit separate. CAUGHT invokes only the existing Route speed reset. No local road combat is present.
6. Treat `docs/reports` as historical records. Add metadata specified in [report standard](../reports/README.md); do not rewrite an older report to claim current authority.
7. Keep only a compact final evidence set after approval: a small machine-readable result, about 5–10 selected screenshots, and the final report. Check unique visual/motion proof and repair links before retiring intermediate files. Git history is the recovery source.
8. For cleanup, inventory dependencies first; `UNKNOWN_REVIEW` is never automatically deleted. The [audit plan](../audits/project-continuity-audit-1.md) is for operator review only.

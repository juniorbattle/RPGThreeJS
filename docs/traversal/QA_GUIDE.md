# Traversal QA guide

Baseline: `main @ 6ff5f4c78b9bacb945b9c20d5ce39d6222b68aa0`.

The canonical T0 browser driver is `node tools/traversal-t0-browser-qa.mjs`. Its options cover focused modes; `tools/traversal-t0-pursuit-qa.mjs` supplies deliberate CAUGHT/ESCAPED cases. The [integrated production report](../reports/traversal-t0-production-loop-final-1.md) identifies the accepted command modes and artifacts. Run against current source when releasing a new build; historical JSON is not a substitute for a current run.

## Minimum release matrix

1. Built production, both Path A/Aider/Route 5A and Path B/Passer/Route 5B: all six Routes, five checkpoint entries/exits, fork choice, canonical combat or dialogue handoff, Route 6 coast, physical exit, and Journey destination agency.
2. Risk/Reward/Pursuit all active together: independent marks, collision slowdown/recovery, once-only pouch callback and temporary loot, pursuit pressure/outcomes, no state resolution during checkpoints, and one renderer/caravan per Route.
3. Deliberate clean ESCAPED and CAUGHT: no campaign or save consequence; CAUGHT only resets Route speed. Test a Risk collision during Pursuit and a later pouch collection.
4. Production URLs carrying all three `=0` query values keep the systems on; DEV exact `=0` disables only its named system.
5. Desktop `1440×810`, intermediate `620×780`, and narrow `390×844`: lanes, HUD, controls, image loading, overflow, and route-state/transition boundaries. Inspect captures, not only numeric pass flags.

Retain a small machine-readable result, about 5–10 selected screenshots, and the final report after approval. The current [golden evidence](../reports/traversal-t0-production-loop-final-1-browser/production/browser-qa.json) remains in-tree. Before retiring older evidence, check for a unique art, motion, or historical comparison and repair every link. See the [cleanup plan](../audits/project-continuity-audit-1.md).

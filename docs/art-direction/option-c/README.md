# Option C — runtime art-direction lock

Status: **phases 1–3 complete; phase 4 not started; operator gate required**

Audit baseline: `678a37ac6f1b9320a94e4c4571ab2e069d6e237b` (`main == origin/main`)

Mission rule: no gameplay, route, choice/effect, save, combat-resolution, VFX-preset, canonical-sprite, or production-media mutation.

## Decision

Option C is technically compatible with the current game. The project already owns the required presentation boundaries; the refactor should replace or remaster art **behind those boundaries**, not introduce a new scene manager or a second narrative runtime.

The production sequence is locked as:

`game truth -> presentation resolution -> surface-specific art -> runtime composition -> human visual gate`

The next authorized work should be one isolated Forest Road pilot covering one family master, four role variants (travel, tableau, tactical combat, combat stage), and one Kestrel four-pose animation reference. Nothing in that pilot should be connected to the production asset manifest before operator approval.

## Deliverables

- [Audit report](audit-report.md): actual baseline, what to preserve, gaps, and current blockers.
- [Presentation-surface matrix](surface-matrix.md): runtime owner, source assets, visual target, constraints, and regression gates.
- [Production reference bible](production-reference-bible.md): interpretation of the six supplied previews, Option C visual grammar, and prompt-ready specifications.
- [Refactor plan](refactor-plan.md): ordered work by asset family and a bounded pilot contract.
- [Reference manifest](reference-manifest.json): immutable SHA-256 provenance for the six supplied previews.
- [Validation report](validation-report.md): current commands, results, protected-state audit, and go/no-go status.

The copied PNGs in `references/` are review references only. They are 1448×1086 moodboards, contain non-canonical labels and example UI, and must never be shipped or used as gameplay truth.

## Authorization boundary

Completed in this mission:

- repository and runtime audit;
- official surface matrix;
- consolidation of the supplied visual references;
- production-ready art grammar and prompt contracts;
- staged refactor plan;
- current validation and explicit regression reporting.

Not authorized and therefore not done:

- image or video generation;
- canonical asset replacement;
- production-manifest edits;
- runtime art integration;
- mass production;
- commit or push.

## Operator gate for phase 4

Authorize phase 4 only after accepting all of the following:

1. Forest Road is the first cross-surface family.
2. Kestrel is the first character-motion pilot.
3. Tableau backgrounds remain character-free; canonical actors are composed at runtime.
4. Travel variants carry no controllable-party staging and no fake exploration affordance.
5. Tactical and stage backgrounds are paired but separately framed for their existing cameras.
6. The current `lion_finale_judgement` dynamic-step staging regression is fixed and revalidated before any global visual lock.

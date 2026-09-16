# Option C — runtime art-direction lock

> **Current character-rendering authority:** the stricter [modern tactical pixel-art character lock](character-style-lock/README.md) supersedes older high-density illustrative guidance for Alistair, Marian, Elara, and any future Kestrel visual remaster. It is a preproduction contract only; no production deployment is authorized.

## CURRENT STATUS

```
INTEGRITY_PASS_INPUT_BASELINE =
3a6330fc79661f895c01ae7d43dc9e2b1a918b7c

STRUCTURAL_PREPRODUCTION =
COMPLETE

NEXT_PHASE =
CODEX VISUAL PRODUCTION
```

### P0 active batch (CODEX_P0_ACTIVE_BATCH)

| Character | ID | Role |
|---|---|---|
| Alistair | warrior | greatsword knight |
| Marian | white_mage | crosier cleric |
| Elara | dark_mage | grimoire mage |

### Kestrel

```
STRUCTURAL_GOLD_REFERENCE   = YES
RUNTIME_REFERENCE           = YES
VISUAL_REMASTER_ALLOWED     = YES
ANIMATION_REMASTER_ALLOWED = YES
REDESIGN_ALLOWED            = NO
```

### Forest Road

```
STRUCTURAL_GOLD_REFERENCE   = YES
COMPOSITION_REFERENCE       = YES
CAMERA_SEMANTICS_REFERENCE  = YES
VISUAL_REMASTER_ALLOWED     = YES
GAMEPLAY_GEOMETRY_CHANGE    = NO
```

### Required image production config

```
REQUIRED_IMAGE_MODEL    = gpt-image-2.5-sunburst-2026-09-08
REQUIRED_IMAGE_QUALITY  = max
FALLBACK_MODEL          = NONE
AUTO_DOWNGRADE          = FORBIDDEN
```

See `phase4c-glm/production-config.md` for the authoritative reference.

### Production promotion authority

```
GLM      → SCALING_DRAFT → DEV_PRODUCTION_CANDIDATE
CODEX    → FINAL_PRODUCTION_CANDIDATE
OPERATOR → PRODUCTION_APPROVED   (operator-only gate)
```

---

## HISTORICAL — original phase 1–3 authorization boundary

> The sections below are the original phase 1–3 documentation, retained as
> archived historical reference. The current state is above and in the
> `phase4-pilot/`, `phase4b-runtime-proof/`, and `phase4c-glm/` subdirectories.

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

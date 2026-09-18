# REPO-CLEAN-4 — Pre-cinematics repository cleanup

## Status

**READY FOR OPERATOR REVIEW**

- Baseline `main`: `2fb6988ca78ed84b10a31801e296e151ae41d2f1`
- Branch: `repo-cleanup-v4`
- Audited branch HEAD before this report: `052d4590d82e5d4de8dca8be05a99ae9caeaa77c`
- Purpose: remove completed production-pipeline residue before cinematic staging.
- Narrative/gameplay intent: unchanged.
- Production cinematic media: unchanged.
- Character System V2 production assets: unchanged.
- Production environment pixels: unchanged.

## Result

| Metric | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Tracked files | 3,253 | 1,062 | **-2,191** |
| Tracked bytes | 2,361,810,560 | 658,058,179 | **-1,703,752,381** |
| Approx. size | 2.36 GB | 658 MB | **~72% smaller** |

The reduction is from the active Git tree only. Historical commits remain the recovery source; Git history was not rewritten.

## Core architectural cleanup

### Retired Option C DEV proof runtime

Removed the completed proof/lab layer:

- `src/dev/optionCPhase4b/**`
- `src/dev/optionCPhase4c/**`
- `src/dev/optionCCombatPosesV2/**`
- `?devOptionC=forest-road`
- `?devOptionC=phase4c-labs`
- `?devOptionC=combat-poses-v2-runtime`
- Option C proof fields in the combat postMessage protocol
- Option C proof command bridge
- legacy combat proof animation/background override logic
- proof-only CSS

Production character and environment resolution remain authoritative through:

- `src/render/generated/characterSystemV2Manifest.json`
- `src/render/CharacterVisualRegistry.ts`
- `src/combat/stage/CombatPoseRegistry.ts`
- `src/render/data/demo-environment-pack-v1.production.json`
- `src/render/demoEnvironmentPack.ts`
- `public/assets/generated/lion-phase/environments/demo-environment-pack-v1/**`

### Retired completed Option C production pipelines

Removed:

- `public/assets/dev/option-c/**`
- `tools/option-c/**`
- Phase 4 pilot image-generation history
- Phase 4B runtime proof screenshots
- Phase 4C GLM lab documentation
- Forest Road pre-integration proof bundle
- raw generations
- rejected/intermediate candidates
- review boards
- runtime-proof screenshots
- one-shot promotion QA evidence

These were production-history artifacts after successful promotion, not current runtime authorities.

### Documentation normalization

The retained Option C documents now describe the current production state instead of linking to deleted DEV folders.

Retained current authorities include:

- `docs/art-direction/option-c/README.md`
- `docs/art-direction/option-c/character-style-lock/**`
- `docs/art-direction/option-c/production-reference-bible.md`
- `docs/art-direction/option-c/narrative-presentation-doctrine.md`
- `docs/art-direction/option-c/surface-matrix.md`
- final environment-production records.

## VFX cleanup

Retained current VFX runtime/dev tooling:

- `tools/vfx/sync-runtime-vfx.mjs`
- `tools/vfx/sync-candidate.mjs`
- `tools/vfx/sync-candidate-lib.mjs`
- `tools/vfx/validate-published-registry.mjs`
- current cadence/preview tooling
- runtime spritesheet audit tooling.

Retained runtime-authoritative catalogue:

- `docs/reports/vfx-megapack-r1-2-4-corrected-inventory.json`

Removed superseded R0/R1/R1.1 acquisition reports and `tools/vfx/r1_*` generation pipeline files whose final output is already represented by R1.2.4.

## Package manager

The repository now has one package-manager authority:

- `package.json`
- `package-lock.json`
- documented `npm` commands

Removed:

- stale `pnpm-lock.yaml`
- unresolved `pnpm-workspace.yaml`.

No dependency version was changed in this cleanup.

## Historical cleanup metadata

Removed the older REPO-CLEAN-1/2/3 reports and `tools/cleanup/specs/**` inventories from the active tree.

This report replaces them as the current repository-cleanliness reference. Earlier reports remain available through Git history.

## Protected runtime invariant

A SHA comparison was performed between baseline `main` and the cleanup branch for 365 protected runtime files covering:

- all production cinematic assets;
- all promoted generated assets;
- Character System V2 masters;
- Character System V2 combat poses;
- combat-stage assets;
- backdrops;
- 3D runtime assets;
- Character System V2 runtime manifest;
- production demo-environment manifest.

Result:

```text
PROTECTED_PATHS_CHECKED = 365
PROTECTED_PATHS_CHANGED = 0
PROTECTED_PATHS_MISSING = 0
```

## Final active DEV surface

After cleanup, `src/dev/` contains only the currently used VFX development bridge:

```text
src/dev/vfxDevHelpers.ts
src/dev/vfxDevHelpers.test.ts
src/dev/vfxPublishDevServer.ts
```

The old Option C laboratories no longer share the production source tree.

## Deleted-root verification

The cleanup branch contains zero entries under:

- `public/assets/dev/option-c`
- `src/dev/optionCPhase4b`
- `src/dev/optionCPhase4c`
- `src/dev/optionCCombatPosesV2`
- `tools/option-c`
- `tools/cleanup`
- `docs/art-direction/option-c/phase4-pilot`
- `docs/art-direction/option-c/phase4b-runtime-proof`
- `docs/art-direction/option-c/phase4c-glm`

## Validation boundary

This execution environment has repository-write/read access through the GitHub connector but no networked local checkout, and the repository contains no GitHub Actions workflow. Therefore this pass could not execute `npm test` or `npm run build` directly.

Validation completed here:

- exact baseline verification;
- branch-isolated execution;
- static dependency retirement audit;
- dead proof-route removal;
- deleted-root verification;
- production-asset SHA invariants;
- package-manager consolidation;
- current authority documentation repair.

Before merge, the operator/local environment should run:

```bash
npm ci
npm test
npm run build
npm run cinematics:validate-narrative-staging
```

Expected result: no new regression. Any failure introduced by this branch blocks merge.

## Merge gate

```text
ACTIVE_TREE_REDUCTION_LOCK = YES
OPTION_C_DEV_RETIREMENT_LOCK = YES
PRODUCTION_ASSET_INTEGRITY_LOCK = YES
CHARACTER_SYSTEM_V2_LOCK = YES
ENVIRONMENT_PRODUCTION_LOCK = YES
CINEMATIC_MEDIA_LOCK = YES
NARRATIVE_CHANGE = NO
GAMEPLAY_CHANGE = NO
READY_FOR_CINEMATICS_AFTER_VALIDATION = YES
```

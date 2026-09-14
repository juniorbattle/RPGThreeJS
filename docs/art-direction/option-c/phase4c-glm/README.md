# Option C — Phase 4C-GLM Scaling Foundation

**Status:** GLM structural draft — awaiting operator review
**Golden reference:** Kestrel + Forest Road (Phase 4B)
**Batch size:** 3 new characters (Alistair, Marian, Morvan)
**Recommendation:** APPROVE_GLM_FOUNDATION_FOR_CODEX

## Purpose

Phase 4C-GLM builds the scalable structural foundation for multi-character
integration on top of the approved Phase 4B Kestrel + Forest Road proof.
GLM owns structure, not final art. Codex later owns visual refinement.

> FIDELITY BEFORE PERFECTION.
> A structurally correct 80% draft is more valuable than an artistic
> reinterpretation that breaks consistency.

## Documentation map

| Document | Purpose |
|---|---|
| [00-golden-reference.md](./00-golden-reference.md) | Kestrel + Forest Road gold reference contract |
| [01-roster-census.md](./01-roster-census.md) | Full playable roster census (12 heroes) |
| [02-selected-batch.md](./02-selected-batch.md) | Selected batch of 3 characters for scaling |
| [03-character-schema.md](./03-character-schema.md) | Reusable character pipeline schema |
| [04-animation-schema.md](./04-animation-schema.md) | Animation state and metadata schema |
| [05-anchor-scale-contract.md](./05-anchor-scale-contract.md) | Anchor and scale contracts |
| [06-manifest-resolution.md](./06-manifest-resolution.md) | Semantic asset resolution |
| [07-selective-loading.md](./07-selective-loading.md) | Per-surface selective loading |
| [08-cache-policy.md](./08-cache-policy.md) | Cache ownership, reuse, unload |
| [09-dev-labs.md](./09-dev-labs.md) | Character/Tableau/Strategic/Combat Stage labs |
| [10-codex-handoff.md](./10-codex-handoff.md) | Codex handoff slots and instructions |
| [11-qa-gates.md](./11-qa-gates.md) | Quality gate scoring |

## Source modules

All Phase 4C source lives under `src/dev/optionCPhase4c/`:

| Module | Purpose |
|---|---|
| `OptionCCharacterSchema.ts` | Schema types, type guards, validators |
| `OptionCCharacterRegistry.ts` | Roster census + identity specs |
| `OptionCManifestResolver.ts` | Semantic asset resolution |
| `OptionCSelectiveLoader.ts` | Selective loading + cache + memory |
| `OptionCCharacterDefinitions.ts` | Kestrel + 3 draft character definitions |
| `OptionCPhase4cLabs.ts` | DEV lab router + 4 labs |
| `OptionCPhase4c.test.ts` | 79-test comprehensive suite |

## DEV entry

```
http://localhost:5173/?devOptionC=phase4c-labs
```

Only available when `import.meta.env.DEV` is true (Vite dev server).
Production builds never import Phase 4C modules.

## Hard constraints

- No global Option C preload
- No production asset modifications
- No gameplay/combat/VFX/save changes
- No image or video generation (GLM phase)
- No commit or push until operator review

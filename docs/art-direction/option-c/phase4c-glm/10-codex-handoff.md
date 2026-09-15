# 10 — Codex Handoff

## Slot contract

Each character has 5 Codex handoff slots:

| Slot | Dimensions | Frames | Timing | Destination |
|---|---|---|---|---|
| characterMaster | 512×512 | 1 | static | `phase4c/{char}/master.png` |
| idleSheet | 512×512 | 6-8 | 190ms loop | `phase4c/{char}/idle/` |
| dashSheet | 512×512 | 6-10 | 82ms oneShot→idle | `phase4c/{char}/dash/` |
| attackSheet | 512×512 | 8-12 | 105ms oneShot→idle | `phase4c/{char}/attack/` |
| skillSheet/castSheet | 512×512 | 8-12 | 125ms oneShot→idle | `phase4c/{char}/skill/` or `/cast/` |

## Slot metadata

Each slot includes:
- `expectedDimensions`: [512, 512]
- `transparent`: true (PNG with alpha)
- `anchor`: 'FOOT_CENTER'
- `surfaceScale`: 1
- `frameCountRange`: [min, max]
- `timingMetadata`: human-readable timing
- `canonicalReference`: path to canonical 640×768 source
- `kestrelReference`: path to Kestrel Phase 4B equivalent
- `fileDestination`: where Codex writes the final art
- `runtimeSemanticKey`: the semantic key the resolver expects

## Codex workflow

1. Read the slot contract from `OptionCCharacterDefinitions.ts`
2. Generate art matching `expectedDimensions` and `frameCountRange`
3. Write files to `fileDestination`
4. Update the character definition's `masterStatus` to `FINAL_PRODUCTION_CANDIDATE`
5. Update `runtimeStatus` to `FINAL_PRODUCTION_CANDIDATE`
6. Set `qaStatus.animationValidated` to true

### Production promotion authority model

```
GLM      → SCALING_DRAFT → DEV_PRODUCTION_CANDIDATE
CODEX    → FINAL_PRODUCTION_CANDIDATE
OPERATOR → PRODUCTION_APPROVED   (operator-only gate)
```

A Codex generation mission MUST NOT self-promote its output directly to
`PRODUCTION_APPROVED`. Only operator approval may set `PRODUCTION_APPROVED`.
The `validateCharacterDefinition` validator enforces this: it rejects any
definition whose `masterStatus` or `runtimeStatus` is `PRODUCTION_APPROVED`
during the GLM/Codex phase.

## What Codex does NOT need to do

- Rewrite the architecture
- Change the manifest resolver
- Modify the selective loader
- Modify the cache policy
- Modify the labs
- Modify the tests (except to update expected frame counts)
- Set `PRODUCTION_APPROVED` (operator-only)

The architecture is designed so Codex drops in art without structural changes.

# 03 — Character Pipeline Schema

## OptionCCharacterDefinition

The core schema that generalizes the Kestrel Phase 4B contract into a
reusable character definition. See `src/dev/optionCPhase4c/OptionCCharacterSchema.ts`.

### Structure

```typescript
interface OptionCCharacterDefinition {
  identity: OptionCCharacterIdentity;    // canonical identity
  sources: OptionCCharacterSources;       // canonical + derivative roots
  masterStatus: OptionCArtStatus;         // GOLD_REFERENCE | SCALING_DRAFT | ...
  surfaceAssets: OptionCSurfaceAssets;    // tableau/strategic/combatStage
  animations: OptionCAnimationMetadata[]; // per-state animation metadata
  anchors: OptionCAnchorContract;         // foot/body/head/weapon anchors
  scales: OptionCScaleContract;           // tableau/strategic/combatStage scales
  mirrorPolicy: OptionCMirrorPolicy;      // runtime | bakedLeft | ...
  loadingPolicy: OptionCLoadingPolicy;    // eager | lazy | predictive
  runtimeStatus: OptionCArtStatus;         // current runtime readiness
  qaStatus: OptionCQaStatus;              // validation flags
  codexHandoffSlots: OptionCCodexHandoffSlot[]; // Codex production slots
}
```

### Art status lifecycle

```
GOLD_REFERENCE (Kestrel only)
  ↓
SCALING_DRAFT (GLM structural draft)
  ↓
DEV_PRODUCTION_CANDIDATE (structurally mature)
  ↓
ART_PENDING_CODEX (awaiting Codex final art)
  ↓
PRODUCTION_APPROVED (Codex only — GLM never sets this)
```

### Validation

`validateCharacterDefinition(def)` returns null on success, error string on failure:
- identity.id must be non-empty
- canonicalSource must be non-empty
- animations must be non-empty
- no duplicate animation states
- all animation metadata must be internally consistent
- scales must be positive
- anchors must be non-negative
- GLM must never set PRODUCTION_APPROVED

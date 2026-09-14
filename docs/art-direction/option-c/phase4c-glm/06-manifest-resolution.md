# 06 — Manifest Resolution

## Semantic resolvers

Phase 4C uses semantic resolvers so raw file paths never scatter across
components. See `src/dev/optionCPhase4c/OptionCManifestResolver.ts`.

### resolveCharacterAsset

```typescript
resolveCharacterAsset({
  characterId: 'archer',
  surface: 'tableau',
  state: 'idle',
  frameIndex: 0,
})
// → { url: '/assets/dev/option-c/phase4b/kestrel/idle/frame-01.png',
//     semanticKey: 'character:archer:surface:tableau:state:idle:frame:0' }
```

### resolveEnvironmentAsset

```typescript
resolveEnvironmentAsset({
  family: 'forest-road',
  surface: 'strategic',
})
// → { url: '/assets/dev/option-c/phase4b/environment/forest-road-strategic.png',
//     semanticKey: 'env:forest-road:surface:strategic' }
```

## Fail-closed behavior

If a character or surface is missing, the resolver THROWS with the full
semantic key in the error message. It never silently returns a different
character's asset.

```
resolveCharacterAsset: unknown characterId 'fake'
  (semantic key: character=fake, surface=tableau, state=idle)
```

## Surface frame resolution

| Surface | States loaded |
|---|---|
| tableau | idle only |
| strategic | idle + dash |
| combat-stage | idle + attack + skill |
| travel | (environment only, no character frames) |

## Registered characters

| ID | Display | Status |
|---|---|---|
| archer | Kestrel | GOLD_REFERENCE |
| warrior | Alistair | SCALING_DRAFT |
| white_mage | Marian | SCALING_DRAFT |
| dark_knight | Morvan | SCALING_DRAFT |

## Environment families

| Family | Status |
|---|---|
| forest-road | GOLD_REFERENCE |

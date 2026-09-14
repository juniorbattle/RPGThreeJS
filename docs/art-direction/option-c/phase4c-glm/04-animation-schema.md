# 04 — Animation Schema

## OptionCAnimationState

Extended from the Phase 4B 4-state set to support diverse character archetypes:

| State | Phase 4B | Phase 4C | Usage |
|---|---|---|---|
| idle | ✓ | ✓ | Looping rest animation |
| dash | ✓ | ✓ | One-shot movement, returns to idle |
| attack | ✓ | ✓ | One-shot melee/ranged attack |
| skill | ✓ | ✓ | One-shot signature ability |
| cast | — | ✓ | One-shot spell cast (cleric/mage) |
| hurt | — | ✓ | Reaction to damage |
| guard | — | ✓ | Block/guard stance |
| death | — | ✓ | Defeat animation |
| victory | — | ✓ | Post-combat celebration |
| special | — | ✓ | Unique character-specific action |
| rangedRelease | — | ✓ | Bow/gun release moment |
| heavyAttack | — | ✓ | Charged/heavy swing |

No character is required to implement all states. Kestrel uses 4; draft
characters use 4 each.

## OptionCAnimationMetadata

```typescript
interface OptionCAnimationMetadata {
  state: OptionCAnimationState;
  frameWidth: number;      // 512 for Option C
  frameHeight: number;     // 512 for Option C
  frameCount: number;      // must match frames.length
  frameDurationMs: number; // positive
  loop: boolean;           // mutually exclusive with oneShot
  oneShot: boolean;        // requires returnState
  returnState?: OptionCAnimationState;
  footBaseline: number;    // Y of foot line
  pivotX: number;          // pivot for placement
  pivotY: number;
  mirrorAllowed: boolean;
  surfaceScale: number;     // relative to 512x512
  preloadPolicy: 'onDemand' | 'withSurface' | 'withCharacter';
  frames: readonly string[]; // ordered frame URLs
}
```

## Kestrel timing (gold reference)

| State | Duration | Loop | Return |
|---|---|---|---|
| idle | 190ms | yes | — |
| dash | 82ms | no | idle |
| attack | 105ms | no | idle |
| skill | 125ms | no | idle |

## SpriteFrameAnimationController compatibility

`toSpriteFrameAnimationDefinition(meta)` converts OptionCAnimationMetadata
to the existing `SpriteFrameAnimationDefinition<State>` so the Phase 4B
controller consumes it unchanged. No controller modifications needed.

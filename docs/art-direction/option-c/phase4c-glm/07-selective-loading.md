# 07 — Selective Loading

## NO_GLOBAL_OPTION_C_PRELOAD

```typescript
export const NO_GLOBAL_OPTION_C_PRELOAD = true as const;
```

Normal game startup never preloads Option C assets. Phase 4C labs load
assets only when a surface is mounted.

## Per-surface loading

See `src/dev/optionCPhase4c/OptionCSelectiveLoader.ts`.

### loadTravel(environmentFamily)
- Loads: environment travel plate only
- Does NOT load: any character frames

### loadTableau(environmentFamily, visibleCharacterIds)
- Loads: environment tableau plate + visible cast idle frames
- Does NOT load: non-visible cast, combat states

### loadStrategic(environmentFamily, participatingCharacterIds)
- Loads: environment strategic plate + participating units (idle + dash)
- Does NOT load: non-participating units, attack/skill states

### loadCombatStage(environmentFamily, attackerId, targetId, requiredState)
- Loads: environment combat-stage plate + attacker (all states) + target (idle)
- Does NOT load: other characters, other environments

## Loading policies

| Policy | When |
|---|---|
| eager | Preload immediately when surface mounts |
| lazy | Load on first display |
| predictive | Load when next-state prediction justifies it |

Kestrel idle uses `withSurface` (eager). All other states use `onDemand`.

## Memory estimate

- Character frame: 512×512×4 = 1 MB decoded RGBA
- Environment plate: 1672×941×4 ≈ 6.3 MB decoded RGBA
- File size estimates: ~200 KB per frame, ~3 MB per environment

# 05 — Anchor & Scale Contract

## Anchor contract

```typescript
interface OptionCAnchorContract {
  footCenter: { x: number; y: number };   // bottom-center of sprite
  bodyCenter: { x: number; y: number };  // torso midpoint
  headReference: { x: number; y: number }; // head center for look-target
  weaponReference?: { x: number; y: number }; // weapon position for VFX
}
```

All anchors are in pixels relative to the 512×512 Option C frame.

### Kestrel gold reference anchors

| Anchor | X | Y |
|---|---|---|
| footCenter | 256 | 466 |
| bodyCenter | 256 | 256 |
| headReference | 256 | 120 |
| weaponReference | 320 | 280 |

> The Kestrel foot baseline is `y=466`, matching the approved Phase 4A/4B
> runtime contract (`kestrel-runtime-contract.md`: "logical baseline / foot
> anchor | source pixel y=466"). The earlier `y=460` Phase 4C draft value was
> a discrepancy; the approved Gold source/runtime contract wins.

### Draft character anchors

| Character | footCenter | bodyCenter | headRef | weaponRef |
|---|---|---|---|---|
| Alistair | (256, 470) | (256, 256) | (256, 120) | (320, 300) |
| Marian | (256, 465) | (256, 256) | (256, 110) | (200, 260) |
| Elara | (256, 465) | (256, 256) | (256, 110) | (320, 250) |
| Morvan (DEFERRED) | (256, 468) | (256, 256) | (256, 115) | (340, 290) |

Draft anchors are GLM estimates — Codex may refine after real art.

## Scale contract

```typescript
interface OptionCScaleContract {
  tableau: number;      // ABSOLUTE narrative actor scale (0-1 relative to canvas)
  strategic: number;    // RELATIVE ASSET MULTIPLIER (1.0 = native 512 frame; NOT the 2.08 world plane)
  combatStage: number;  // RELATIVE ASSET MULTIPLIER (1.0 = native 512 frame; NOT the 2.08 world plane)
  draftScale: boolean;  // true = GLM estimate, false = final
}
```

### Scale semantics (IMPORTANT)

- `tableau` is an **absolute narrative actor scale** (e.g. 0.92 for Kestrel)
  applied to the actor on the tableau stage.
- `strategic` and `combatStage` are **relative asset multipliers** against the
  native 512×512 Option C frame (1.0 = native frame size). They are NOT the
  runtime Three.js proxy plane size. The strategic and combat-stage runtime
  proxy planes are fixed 2.08×2.08 world-unit geometries owned by the runtime,
  separate from these multipliers.
- Do NOT confuse a normalized multiplier (1.0) with a world plane size (2.08).

### Kestrel gold reference scales

| Surface | Scale | Draft? |
|---|---|---|
| tableau | 0.92 | no |
| strategic | 1.0 | no |
| combatStage | 1.0 | no |

### Draft character scales

| Character | tableau | strategic | combatStage | Draft? |
|---|---|---|---|---|
| Alistair | 0.86 | 1.0 | 1.0 | yes |
| Marian | 0.86 | 1.0 | 1.0 | yes |
| Elara | 0.86 | 1.0 | 1.0 | yes |
| Morvan (DEFERRED) | 0.90 | 1.0 | 1.0 | yes |

Draft scales are GLM estimates based on silhouette class and body class.
Codex may refine after real art.

## Mirror policy

| Policy | Meaning |
|---|---|
| runtime | Mirror via CSS transform (preferred) |
| bakedLeft | Image faces left, mirror for right |
| bakedRight | Image faces right, mirror for left |
| noMirror | Forward-facing only |

All Phase 4C characters use `runtime` mirroring.

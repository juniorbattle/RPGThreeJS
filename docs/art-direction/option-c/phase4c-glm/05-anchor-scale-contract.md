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
| footCenter | 256 | 460 |
| bodyCenter | 256 | 256 |
| headReference | 256 | 120 |
| weaponReference | 320 | 280 |

### Draft character anchors

| Character | footCenter | bodyCenter | headRef | weaponRef |
|---|---|---|---|---|
| Alistair | (256, 470) | (256, 256) | (256, 120) | (320, 300) |
| Marian | (256, 465) | (256, 256) | (256, 110) | (200, 260) |
| Morvan | (256, 468) | (256, 256) | (256, 115) | (340, 290) |

Draft anchors are GLM estimates — Codex may refine after real art.

## Scale contract

```typescript
interface OptionCScaleContract {
  tableau: number;      // 0-1 relative to canvas
  strategic: number;
  combatStage: number;
  draftScale: boolean;  // true = GLM estimate, false = final
}
```

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
| Morvan | 0.90 | 1.0 | 1.0 | yes |

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

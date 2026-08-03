# VFX-R3G — Spritesheet UV Bleeding / Frame Slicing Repair

## Summary

Runtime spritesheet VFX exhibited visible texture bleeding — fragments of neighbouring cells appearing at the edges of the active frame. This was most noticeable on large-scale additive-blended effects such as Éclipse dévorante, Météore obscure, Rempart du serment, Tourbillon d'acier, and Déferlement du lion. The root cause was a missing half-texel UV inset combined with `LinearFilter` sampling at exact cell boundaries.

## Root Cause

All runtime spritesheets are 1280×1280 RGBA PNGs arranged in a 5×5 grid (25 frames, 256px per cell). The UV calculation in `getVfxSpriteSheetFrameUv` placed `offset` and `repeat` at exact cell boundaries:

```
offsetX = column / cols
offsetY = 1 - (row + 1) / rows
repeatX = 1 / cols
repeatY = 1 / rows
```

With `THREE.LinearFilter` (set in `configureTexture`), the GPU samples a 2×2 texel region and interpolates bilinearly. At exact cell boundaries, the 2×2 kernel straddles two adjacent cells, producing a 1-texel bleed of the neighbouring frame's content.

This was amplified by:
- **Additive blending** — bleed adds on top instead of blending away
- **Large presentation scales** (scaleMultiplier up to 2.24, preset scales up to 2.22) — 1 texel at 1280px becomes multiple screen pixels
- **Content extending to cell edges** — some sheets have opaque art near cell boundaries

## Fix Applied

### Function modified

`src/combat/vfx/VfxSpriteSheets.ts` — `getVfxSpriteSheetFrameUv`

### Constants added

```ts
const VFX_SPRITE_SHEET_SIZE_PX = 1280;
const VFX_UV_INSET_TEXELS = 0.5;
const VFX_UV_INSET_U = VFX_UV_INSET_TEXELS / VFX_SPRITE_SHEET_SIZE_PX;
const VFX_UV_INSET_V = VFX_UV_INSET_TEXELS / VFX_SPRITE_SHEET_SIZE_PX;
```

### Formula

```ts
const cellWidth = 1 / definition.cols;
const cellHeight = 1 / definition.rows;

repeatX: cellWidth - VFX_UV_INSET_U * 2,
repeatY: cellHeight - VFX_UV_INSET_V * 2,
offsetX: column * cellWidth + VFX_UV_INSET_U,
offsetY: 1 - (row + 1) * cellHeight + VFX_UV_INSET_V,
```

### Inset value

- `0.5 / 1280 = 0.000390625` in UV space
- Shrinks each cell's sample region by 1 texel total (0.5 texel per side)
- Invisible to the eye (1px on a 256px cell)

## Why LinearFilter is preserved

`NearestFilter` would eliminate bleeding but produce pixelated/hard-edged VFX at the presentation scales used in combat. `LinearFilter` with a half-texel inset is the standard approach for atlas-based rendering — it keeps smooth interpolation while guaranteeing the 2×2 kernel stays within the active cell.

## Why flipY remains unchanged

`flipY = true` is the Three.js default for `TextureLoader` images and is required for correct row-major top-to-bottom frame ordering. The inset is applied symmetrically in both U and V and does not interact with the flip direction.

## Tests added

`src/combat/vfx/VfxSpriteSheets.test.ts`:

1. **Updated** `maps 5x5 frames row-major from the authored top-left with an explicit flipY invariant` — expected values now include the half-texel inset for frames 0, 4, 5, and 24.
2. **Added** `applies a half-texel UV inset so LinearFilter cannot sample neighbouring cells` — iterates all 25 frames and verifies:
   - `repeatX` / `repeatY` are strictly less than `1/cols` / `1/rows`
   - `offsetX` / `offsetY` are shifted inward from cell boundaries
   - The full UV range `[offset, offset+repeat]` stays strictly within the cell bounds
   - The inset equals exactly `0.5 / 1280`

## QA visual priority

The following presets should be verified in-game after this fix:

| Preset | SpriteSheet | Expected improvement |
|---|---|---|
| Rempart du serment | skill_barrier_guard_heavy + skill_barrier_shield_ring_medium | No bleed between barrier layers |
| Éclipse dévorante | skill_void_singularity_implosion_ultimate | Clean implosion without edge artifacts |
| Météore obscure | skill_meteor_impact_burst_heavy | No neighbouring frame fragments |
| Tourbillon d'acier | skill_wind_slash_swirl_medium | Clean swirl edges |
| Déferlement du lion | basic_execution_slash_heavy | No bleed at large scale |
| Vague de flammes | skill_fire_impact_burst_medium | Clean fire edges |
| Brise-garde | skill_barrier_guard_heavy | No bleed |
| Charge | blunt_impact | Clean impact |
| Frappe consacrée | skill_holy_radiance_burst_heavy | Clean radiance |
| Interposition | leap_impact (basic_body_slam_heavy) | Clean landing |

## Confirmation

- **No PNG modified** — fix is runtime UV calculation only
- **No gameplay modified** — no changes to damage, targeting, timing, or combat rules
- **No manifest modified** — no changes to asset registry
- **No presets modified** — no changes to VfxPresets.ts
- **flipY preserved** — `VFX_SPRITE_SHEET_FLIP_Y = true` unchanged
- **LinearFilter preserved** — `configureTexture` unchanged
- **ClampToEdgeWrapping preserved** — `configureTexture` unchanged
- **Frame order preserved** — row-major top-to-bottom with flipY

## Files changed

- `src/combat/vfx/VfxSpriteSheets.ts` — added inset constants, modified `getVfxSpriteSheetFrameUv`
- `src/combat/vfx/VfxSpriteSheets.test.ts` — updated UV mapping test, added inset verification test
- `docs/reports/vfx-r3g-spritesheet-uv-bleeding-repair.md` — this report

## Final commands

```powershell
npm.cmd test
npm.cmd run build
git diff --check
git status --short
```

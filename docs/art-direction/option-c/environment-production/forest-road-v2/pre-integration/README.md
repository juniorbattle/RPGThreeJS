# Forest Road v2 selected pre-integration package

Status: `OPERATOR_SELECTED`

Production approval: `NO`

Runtime integration authorization: `NO`

## Selected family

| Surface | Selected candidate | Runtime target |
| --- | --- | --- |
| Travel | B | `/assets/dev/option-c/phase4b/environment/forest-road-v2/forest-road-travel.png` |
| Static tableau | B | `/assets/dev/option-c/phase4b/environment/forest-road-v2/forest-road-tableau.png` |
| Strategic combat | B | `/assets/dev/option-c/phase4b/environment/forest-road-v2/forest-road-strategic.png` |
| Combat stage | C | `/assets/dev/option-c/phase4b/environment/forest-road-v2/forest-road-combat-stage.png` |

The four targets are byte-identical copies of the operator-selected clean source PNGs. No crop, resize, padding, filtering, palette change, or regeneration was applied.

## Package layout

The package lives beneath the existing Phase 4B environment namespace:

`public/assets/dev/option-c/phase4b/environment/forest-road-v2/`

It contains:

- four selected clean RGB PNG plates
- `selection-manifest.json` with classifications, dimensions, URLs, hashes, and invariants
- `provenance.json` with source-to-package lineage
- `staging-metadata.json` with normalized staging, anchor, and UI-safe regions
- `runtime-preview-targets.json` with existing adapter and crop/fit assumptions
- `asset-manifest.sha256` with authoritative plate hashes

## Runtime preparation boundary

The existing Option C Phase 4B architecture remains authoritative:

- Travel: `TravelView`, fixed `cover`, center-bottom presentation
- Tableau: `NarrativeSceneSurface`, runtime-owned actors, cover/center presentation
- Strategic: existing `BackgroundLayerSystem`, camera, HUD, units, actions, and combat semantics
- Combat stage: existing `BackgroundLayerSystem`, attacker-left/target-right composition, runtime-owned VFX

The targets are ready to load, but the current `OPTION_C_PHASE4B_ASSETS` URLs have intentionally not been changed. Switching the proof route to this package requires the next explicit operator authorization.

## Protected workstreams

- Existing Phase 4B environment files: unchanged
- Canonical environment assets: unchanged
- Character assets and character production: unchanged
- Runtime code and styles: unchanged
- Gameplay, narrative, combat logic, and VFX: unchanged
- Commit and push: not performed

## Validation

Run:

```powershell
python docs/art-direction/option-c/environment-production/forest-road-v2/pre-integration/validate_preintegration.py
```

The validator confirms byte identity, dimensions, metadata ranges, the presence of all twelve review candidates, and preservation of the four existing Phase 4B proof assets.

`runtime-preview-http-validation.json` records the separate DEV static-serving check. All four prepared URLs returned HTTP 200 with `image/png` and the expected byte length; the proof route itself remained unswitched.

# Combat VFX spritesheets - validation pack V1

This directory contains visual candidates only. Nothing in `validation/` may be referenced by runtime code.

## Contents

- `raw/`: untouched copies of selected generated source sheets.
- `processed/<effect>/frames/`: cleaned, transparent 256x256 frames.
- `processed/<effect>/sheet-transparent.png`: rebuilt transparent sheet.
- `processed/<effect>/animation.gif`: timing preview only.
- `processed/<effect>/qc.json`: deterministic chroma, edge and separator checks.
- `boards/`: per-effect contact sheets and the global comparison board.
- `vfx-sheets-manifest.json`: validation inventory; `runtime_ready` remains `false` until manual approval.

## Rebuild

```powershell
python tools/process_vfx_validation.py --processor <path-to-generate2dsprite.py>
```

Use `--only slash_arc fire_explosion` for a subset. Use `--refresh-existing-metadata` to remove machine-local paths without reprocessing images.

## Promotion gate

An effect can be promoted only after its contact sheet and animation preview are approved, its QC status is `candidate`, and a runtime preset defines scale, blend mode, anchor, timing and reduced-graphics behavior.

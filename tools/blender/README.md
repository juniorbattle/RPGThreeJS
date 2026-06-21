# Blender asset pipeline

Blender is an authoring tool. Runtime assets are exported as GLB into
`public/assets/3d`; the Three.js application never loads `.blend` files.

## Commands

```powershell
npm run blender:version
npm run blender:check
npm run blender:forest
```

The launcher resolves Blender in this order:

1. `BLENDER_PATH`;
2. a `blender` command available on `PATH`;
3. known Blender Foundation installations;
4. the current user's Blender Start Menu shortcut.

For a custom installation:

```powershell
$env:BLENDER_PATH = 'D:\Tools\Blender\blender.exe'
npm run blender:check
```

## Asset contract

- Blender sources: `assets-source/blender`.
- Runtime exports: `public/assets/3d`.
- Runtime format: binary glTF (`.glb`).
- Units: meters, with one grid tile equal to one meter.
- Up axis: Z in Blender; the glTF exporter performs the Three.js conversion.
- Apply scale and rotation before export.
- Put interactive pivots at ground contact.
- Prefix collision meshes with `COL_`.
- Prefer shared materials and stable object names.

`npm run blender:forest` rebuilds both `assets-source/blender/forest-kit.blend`
and the runtime export `public/assets/3d/forest-kit.glb`.

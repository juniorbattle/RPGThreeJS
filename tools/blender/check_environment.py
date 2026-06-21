import json
from pathlib import Path

import bpy


project_root = Path.cwd()
report = {
    "blender_version": bpy.app.version_string,
    "background_mode": bpy.app.background,
    "project_root": str(project_root),
    "source_directory": str(project_root / "assets-source" / "blender"),
    "export_directory": str(project_root / "public" / "assets" / "3d"),
    "glb_export_available": hasattr(bpy.ops.export_scene, "gltf"),
    "render_engine": bpy.context.scene.render.engine,
}

print("RPGTHREEJS_BLENDER_CHECK")
print(json.dumps(report, indent=2))

if not report["background_mode"]:
    raise RuntimeError("The environment check must run with --background.")

if not report["glb_export_available"]:
    raise RuntimeError("Blender glTF 2.0 export is unavailable.")

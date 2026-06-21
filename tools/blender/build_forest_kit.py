from math import radians, sin
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path.cwd()
SOURCE = ROOT / "assets-source" / "blender" / "forest-kit.blend"
EXPORT = ROOT / "public" / "assets" / "3d" / "forest-kit.glb"


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in bpy.data.materials:
        bpy.data.materials.remove(block)


def material(name, color, roughness=0.9, metallic=0.0, emission=None):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = 2.4
    return mat


MATS = {}


def mesh_material(obj, mat, smooth=False):
    obj.data.materials.append(mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = smooth
    return obj


def parented(obj, root):
    obj.parent = root
    return obj


def empty(name):
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    root.empty_display_type = "PLAIN_AXES"
    root["asset_role"] = "forest_prop"
    return root


def cube(name, location, scale, mat, root, bevel=0.08, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new("Soft bevel", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
    mesh_material(obj, mat, smooth=True)
    return parented(obj, root)


def cylinder(name, location, radius, depth, vertices, mat, root, rotation=(0, 0, 0), top_radius=None):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius,
        radius2=top_radius if top_radius is not None else radius,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    mesh_material(obj, mat)
    return parented(obj, root)


def ico(name, location, scale, mat, root, rotation=(0, 0, 0), subdivisions=2, organic=0.0, smooth=True):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=1, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if organic:
        for vertex in obj.data.vertices:
            direction = vertex.co.normalized()
            variation = 1.0 + organic * sin(vertex.co.x * 5.7 + vertex.co.y * 4.3 + vertex.co.z * 6.1)
            vertex.co = direction * vertex.co.length * variation
    mesh_material(obj, mat, smooth=smooth)
    return parented(obj, root)


def tree(name, height=3.5, broad=False, accent=False):
    root = empty(name)
    bark = MATS["bark_light"] if accent else MATS["bark"]
    cylinder(f"{name}_Trunk", (0, 0, height * 0.34), 0.22 if broad else 0.17, height * 0.68, 7, bark, root, top_radius=0.12)
    for index, angle in enumerate((0, 120, 240)):
        ico(
            f"{name}_Root{index + 1}",
            (0.16 * sin(radians(angle)), 0.16 * sin(radians(angle + 90)), 0.14),
            (0.18, 0.46, 0.13),
            bark,
            root,
            rotation=(0, radians(68), radians(angle)),
            organic=0.08,
        )
    if broad:
        for index, (x, y, rz) in enumerate(((-0.32, 0, -35), (0.34, 0.02, 35))):
            cylinder(
                f"{name}_Branch{index + 1}",
                (x, y, height * 0.61),
                0.11,
                1.2,
                7,
                bark,
                root,
                rotation=(0, radians(58), radians(rz)),
                top_radius=0.06,
            )
        ico(f"{name}_CrownA", (0, 0, height * 0.72), (1.08, 0.94, 0.72), MATS["leaf_mid"], root, organic=0.1)
        ico(f"{name}_CrownB", (-0.66, 0.06, height * 0.79), (0.82, 0.74, 0.63), MATS["leaf_dark"], root, organic=0.12)
        ico(f"{name}_CrownC", (0.64, -0.05, height * 0.84), (0.84, 0.76, 0.67), MATS["leaf_light"], root, organic=0.11)
        ico(f"{name}_CrownD", (0.03, 0, height * 1.0), (0.78, 0.72, 0.61), MATS["leaf_light"], root, organic=0.09)
    else:
        for index, (z, radius) in enumerate(((0.55, 0.86), (0.72, 0.72), (0.88, 0.55))):
            bpy.ops.mesh.primitive_cone_add(
                vertices=12,
                radius1=radius,
                radius2=0.05,
                depth=height * 0.34,
                location=(0, 0, height * z),
            )
            crown = bpy.context.object
            crown.name = f"{name}_Crown{index + 1}"
            mesh_material(crown, [MATS["leaf_dark"], MATS["leaf_mid"], MATS["leaf_light"]][index], smooth=True)
            parented(crown, root)
    return root


def bush(name, color_key, scale=(0.8, 0.62, 0.55)):
    root = empty(name)
    for index, offset in enumerate(((-0.3, 0, 0.3), (0.25, 0.03, 0.34), (0, -0.18, 0.48))):
        ico(f"{name}_Lobe{index + 1}", offset, tuple(component * (0.75 if index < 2 else 0.62) for component in scale), MATS[color_key], root, organic=0.13)
    return root


def rock(name, scale, moss=False):
    root = empty(name)
    body = ico(f"{name}_Body", (0, 0, scale[2] * 0.48), scale, MATS["stone_dark"], root, rotation=(0.13, 0.32, 0.08), organic=0.16, smooth=False)
    if moss:
        ico(f"{name}_Moss", (-scale[0] * 0.1, 0, scale[2] * 0.92), (scale[0] * 0.72, scale[1] * 0.7, scale[2] * 0.15), MATS["moss"], root, organic=0.12)
    return root


def cliff(name, width=3.0, height=1.8):
    root = empty(name)
    cube(f"{name}_Core", (0, 0.22, height * 0.42), (width * 0.48, 0.68, height * 0.42), MATS["earth"], root, bevel=0.34)
    for index, x in enumerate((-width * 0.43, -width * 0.2, 0, width * 0.22, width * 0.43)):
        ico(
            f"{name}_Rock{index + 1}",
            (x, -0.55 + 0.08 * (index % 2), height * (0.42 + (index % 3) * 0.035)),
            (width * 0.2, 0.56, height * (0.48 + (index % 2) * 0.08)),
            MATS["stone_dark" if index % 2 else "stone"],
            root,
            rotation=(0.08 * index, 0.18 * index, 0.04),
            organic=0.15,
            smooth=False,
        )
    cube(f"{name}_GrassCap", (0, 0.04, height * 0.91), (width * 0.49, 0.76, 0.15), MATS["grass"], root, bevel=0.28)
    return root


def ruin_arch(name):
    root = empty(name)
    for x in (-0.72, 0.72):
        cube(f"{name}_Pillar_{x}", (x, 0, 1.0), (0.34, 0.34, 1.0), MATS["stone"], root, bevel=0.12, rotation=(0, radians(x * 3), radians(x * 2)))
        cube(f"{name}_Foot_{x}", (x, 0, 0.16), (0.48, 0.48, 0.16), MATS["stone_dark"], root, bevel=0.08)
    cube(f"{name}_Lintel", (0, 0, 2.05), (1.2, 0.38, 0.3), MATS["stone"], root, bevel=0.14, rotation=(0, 0, radians(-3)))
    ico(f"{name}_Moss", (-0.62, -0.25, 2.28), (0.48, 0.24, 0.12), MATS["moss"], root)
    return root


def lantern(name):
    root = empty(name)
    cylinder(f"{name}_Post", (0, 0, 0.9), 0.07, 1.8, 7, MATS["bark_dark"], root, top_radius=0.05)
    cube(f"{name}_Arm", (0.28, 0, 1.68), (0.32, 0.055, 0.055), MATS["bark_dark"], root, bevel=0.04)
    cube(f"{name}_Cage", (0.53, 0, 1.42), (0.16, 0.16, 0.22), MATS["metal"], root, bevel=0.04)
    ico(f"{name}_Glow", (0.53, 0, 1.42), (0.1, 0.1, 0.13), MATS["lantern"], root)
    return root


def bridge(name):
    root = empty(name)
    for index in range(7):
        cube(f"{name}_Plank{index}", ((index - 3) * 0.38, 0, 0.22 + abs(index - 3) * 0.012), (0.18, 0.72, 0.09), MATS["wood"], root, bevel=0.035, rotation=(0, 0, radians((index % 3 - 1) * 1.5)))
    for y in (-0.64, 0.64):
        cylinder(f"{name}_RailA_{y}", (-1.18, y, 0.72), 0.045, 0.95, 7, MATS["bark_dark"], root)
        cylinder(f"{name}_RailB_{y}", (1.18, y, 0.72), 0.045, 0.95, 7, MATS["bark_dark"], root)
        cube(f"{name}_Rail_{y}", (0, y, 0.93), (1.2, 0.045, 0.045), MATS["bark_dark"], root, bevel=0.025)
    return root


def grass_cluster(name, tall=False):
    root = empty(name)
    height = 0.72 if tall else 0.38
    count = 9 if tall else 7
    for index in range(count):
        angle = radians(index * (137 if tall else 151))
        radius = 0.16 + (index % 3) * 0.07
        blade = ico(
            f"{name}_Blade{index + 1}",
            (sin(angle) * radius, sin(angle + radians(90)) * radius, height * 0.43),
            (0.055 if tall else 0.045, 0.12, height * (0.5 + (index % 3) * 0.08)),
            MATS["grass" if index % 3 else "leaf_light"],
            root,
            rotation=(radians(10 + index % 4 * 4), radians(index * 29), angle),
            subdivisions=1,
            organic=0.07,
        )
        blade.rotation_euler[1] += radians(12 if index % 2 else -9)
    return root


def fern(name, scale=1.0):
    root = empty(name)
    cylinder(f"{name}_Stem", (0, 0, 0.32 * scale), 0.025 * scale, 0.64 * scale, 6, MATS["leaf_dark"], root, top_radius=0.012 * scale)
    for frond_index, angle in enumerate((0, 72, 144, 216, 288)):
        length = (0.72 + (frond_index % 2) * 0.12) * scale
        frond_root = empty(f"{name}_Frond{frond_index + 1}")
        frond_root.parent = root
        frond_root.rotation_euler[2] = radians(angle)
        for leaf_index in range(5):
            progress = (leaf_index + 1) / 6
            for side in (-1, 1):
                leaf = ico(
                    f"{name}_Leaf_{frond_index}_{leaf_index}_{side}",
                    (side * 0.08 * scale, progress * length, 0.38 * scale + progress * 0.24 * scale),
                    (0.055 * scale, 0.17 * scale * (1.0 - progress * 0.35), 0.025 * scale),
                    MATS["leaf_mid" if leaf_index % 2 else "leaf_light"],
                    frond_root,
                    rotation=(radians(18), 0, radians(side * 28)),
                    subdivisions=1,
                    organic=0.05,
                )
                leaf.rotation_euler[1] = radians(side * 12)
    return root


def broad_plant(name):
    root = empty(name)
    for index, angle in enumerate((0, 60, 120, 180, 240, 300)):
        length = 0.78 + (index % 2) * 0.18
        leaf = ico(
            f"{name}_Leaf{index + 1}",
            (sin(radians(angle)) * 0.26, sin(radians(angle + 90)) * 0.26, 0.3),
            (0.19, length * 0.48, 0.055),
            MATS["leaf_light" if index % 3 == 0 else "leaf_mid"],
            root,
            rotation=(radians(22), radians(index * 13), radians(angle)),
            subdivisions=2,
            organic=0.08,
        )
        leaf.rotation_euler[1] += radians(20)
    return root


def mushroom_cluster(name):
    root = empty(name)
    for index, (x, y, size) in enumerate(((-0.18, 0.02, 0.8), (0.12, 0.05, 1.0), (0.28, -0.08, 0.62))):
        cylinder(f"{name}_Stem{index}", (x, y, 0.16 * size), 0.035 * size, 0.32 * size, 7, MATS["stone"], root, top_radius=0.026 * size)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=6, location=(x, y, 0.34 * size))
        cap = bpy.context.object
        cap.name = f"{name}_Cap{index}"
        cap.scale = (0.16 * size, 0.16 * size, 0.07 * size)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        mesh_material(cap, MATS["flower"], smooth=True)
        parented(cap, root)
    return root


def mark_roots():
    for obj in bpy.context.scene.objects:
        if obj.parent is None and obj.type == "EMPTY":
            obj["template_name"] = obj.name


reset_scene()

MATS.update(
    {
        "bark": material("Bark", (0.24, 0.12, 0.055)),
        "bark_light": material("Bark light", (0.36, 0.19, 0.075)),
        "bark_dark": material("Bark dark", (0.13, 0.075, 0.035)),
        "leaf_dark": material("Leaf dark", (0.08, 0.20, 0.11)),
        "leaf_mid": material("Leaf mid", (0.14, 0.34, 0.17)),
        "leaf_light": material("Leaf light", (0.30, 0.52, 0.21)),
        "grass": material("Grass", (0.25, 0.46, 0.18)),
        "moss": material("Moss", (0.32, 0.49, 0.19)),
        "earth": material("Earth", (0.28, 0.16, 0.09)),
        "stone": material("Stone", (0.43, 0.47, 0.43)),
        "stone_dark": material("Stone dark", (0.25, 0.29, 0.28)),
        "wood": material("Wood", (0.35, 0.18, 0.07)),
        "metal": material("Metal", (0.15, 0.13, 0.12), roughness=0.55, metallic=0.25),
        "lantern": material("Lantern glow", (1.0, 0.52, 0.12), roughness=0.35, emission=(1.0, 0.25, 0.04)),
        "flower": material("Flower warm", (0.88, 0.34, 0.24)),
    }
)

tree("Tree_Pine_A", 3.8)
tree("Tree_Pine_B", 3.2, accent=True)
tree("Tree_Broad_A", 3.6, broad=True)
bush("Bush_Dark", "leaf_dark")
bush("Bush_Light", "leaf_light", (0.72, 0.58, 0.5))
rock("Rock_Small", (0.55, 0.42, 0.48), moss=True)
rock("Rock_Medium", (0.9, 0.64, 0.72), moss=True)
rock("Rock_Tall", (0.64, 0.52, 1.15))
cliff("Cliff_Straight", 3.2, 1.65)
cliff("Cliff_Wide", 4.2, 2.1)
ruin_arch("Ruin_Arch")
lantern("Lantern_Post")
bridge("Bridge_Wood")
grass_cluster("Grass_Short_A")
grass_cluster("Grass_Tall_A", tall=True)
fern("Fern_A", 1.0)
fern("Fern_B", 0.78)
broad_plant("Broad_Plant_A")
mushroom_cluster("Mushroom_Cluster_A")
mark_roots()

bpy.context.scene.unit_settings.system = "METRIC"
bpy.context.scene.unit_settings.scale_length = 1.0
bpy.context.scene.render.engine = "BLENDER_EEVEE"

SOURCE.parent.mkdir(parents=True, exist_ok=True)
EXPORT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE))
bpy.ops.export_scene.gltf(
    filepath=str(EXPORT),
    export_format="GLB",
    export_apply=True,
    export_yup=True,
    export_materials="EXPORT",
    export_cameras=False,
    export_lights=False,
)

print(f"FOREST_KIT_SOURCE={SOURCE}")
print(f"FOREST_KIT_EXPORT={EXPORT}")

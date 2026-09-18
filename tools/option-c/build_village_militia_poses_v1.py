from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/assets/dev/option-c/village-militia-poses-v1"
MASTER_ROOT = ROOT / "public/assets/characters/pixel/masters"
COMBAT_ROOT = ROOT / "public/assets/characters/pixel/combat"
POSE_IDS = ("prepare", "dash", "attack", "cast")
TARGET_BASELINE = 456
WORLD_UNITS_PER_PIXEL = 0.00625
SAFE_MARGIN_PX = 32
PROCESSOR = Path.home() / ".codex/skills/generate2dsprite/scripts/generate2dsprite.py"

UNITS = {
    "village_militia_spearman": {
        "displayName": "Village Militia Spearman",
        "processorFitScale": 0.70,
        "sourceGeneration": "exec-da40c0b5-a25f-45c2-a584-c84012e9e799.png",
        "visualRole": "generic local militia frontline / control fighter",
    },
    "village_militia_slinger": {
        "displayName": "Village Militia Slinger",
        "processorFitScale": 0.75,
        "sourceGeneration": "exec-3546ae2f-6859-4d86-b04b-28d0167ac253.png",
        "visualRole": "generic local militia ranged skirmisher",
    },
}


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def alpha_bounds(image: Image.Image) -> tuple[int, int, int, int]:
    bounds = image.getchannel("A").getbbox()
    if bounds is None:
        raise RuntimeError("Expected visible pixels")
    return bounds


def protected_entries() -> dict[str, object]:
    masters = sorted(MASTER_ROOT.glob("*.png"))
    combat = sorted(COMBAT_ROOT.glob("*/*.png"))
    return {
        "mastersCount": len(masters),
        "combatPosesCount": len(combat),
        "masters": {rel(path): sha256(path) for path in masters},
        "combatPoses": {rel(path): sha256(path) for path in combat},
    }


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")


def checker(size: tuple[int, int], tile: int = 16) -> Image.Image:
    image = Image.new("RGBA", size, (25, 29, 37, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], tile):
        for x in range(0, size[0], tile):
            if (x // tile + y // tile) % 2:
                draw.rectangle((x, y, x + tile - 1, y + tile - 1), fill=(34, 39, 49, 255))
    return image


def label(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, color=(231, 235, 240, 255)) -> None:
    draw.text(xy, text, fill=color, font=ImageFont.load_default())


def display_canvas(image: Image.Image, size: int) -> Image.Image:
    # Every QA subject is transformed as a complete 512 canvas. No subject is
    # cropped or independently fitted for presentation.
    if image.size != (512, 512):
        raise RuntimeError(f"QA display expects a 512 canvas, got {image.size}")
    return image.resize((size, size), Image.Resampling.NEAREST)


def baseline_align(source: Image.Image, target_baseline: int) -> Image.Image:
    bounds = alpha_bounds(source)
    dy = target_baseline - bounds[3]
    shifted = Image.new("RGBA", source.size, (0, 0, 0, 0))
    shifted.alpha_composite(source, (0, dy))
    moved = alpha_bounds(shifted)
    if moved[3] != target_baseline:
        raise RuntimeError(f"Baseline alignment failed: {moved[3]} != {target_baseline}")
    return shifted


def run_processor(unit_id: str, unit: dict[str, object], output_dir: Path) -> None:
    command = [
        sys.executable,
        str(PROCESSOR),
        "process",
        "--input",
        str(OUT / "sources" / f"{unit_id}-board-source.png"),
        "--target",
        "creature",
        "--mode",
        "combat-poses-v2",
        "--output-dir",
        str(output_dir),
        "--prompt-file",
        str(OUT / "manifests" / f"{unit_id}-prompt.txt"),
        "--threshold",
        "70",
        "--edge-threshold",
        "140",
        "--cell-size",
        "512",
        "--rows",
        "2",
        "--cols",
        "2",
        "--label-prefix",
        unit_id,
        "--fit-scale",
        str(unit["processorFitScale"]),
        "--trim-border",
        "4",
        "--edge-clean-depth",
        "3",
        "--align",
        "feet",
        "--shared-scale",
        "--component-mode",
        "largest",
        "--component-padding",
        "0",
        "--min-component-area",
        "1",
        "--edge-touch-margin",
        "0",
        "--reject-edge-touch",
    ]
    subprocess.run(command, cwd=ROOT, check=True, capture_output=True, text=True)


def build_unit_board(unit_id: str, master: Image.Image, poses: dict[str, Image.Image]) -> Path:
    cell = 360
    header = 70
    board = Image.new("RGBA", (cell * 5, header + cell), (12, 15, 21, 255))
    draw = ImageDraw.Draw(board)
    label(draw, (18, 14), f"{unit_id} | MASTER + PREPARE + DASH + ATTACK + CAST")
    label(draw, (18, 34), "Identical full-canvas display transform; no per-subject fitting")
    items = [("MASTER", master), *[(pose.upper(), poses[pose]) for pose in POSE_IDS]]
    for index, (name, image) in enumerate(items):
        tile = checker((cell, cell), 18)
        tile.alpha_composite(display_canvas(image, cell), (0, 0))
        tile_draw = ImageDraw.Draw(tile)
        tile_draw.rectangle((0, 0, cell - 1, cell - 1), outline=(72, 81, 96, 255), width=1)
        label(tile_draw, (10, 10), name, (246, 218, 148, 255))
        board.alpha_composite(tile, (index * cell, header))
    output = OUT / "boards" / f"{unit_id}-board.png"
    output.parent.mkdir(parents=True, exist_ok=True)
    board.save(output)
    return output


def build_scale_board(unit_images: dict[str, dict[str, Image.Image]]) -> Path:
    references = [
        ("REF archer prepare", ROOT / "public/assets/characters/pixel/combat/archer/prepare.png"),
        ("REF lancer prepare", ROOT / "public/assets/characters/pixel/combat/lancer/prepare.png"),
        ("REF serpent_raider prepare", ROOT / "public/assets/characters/pixel/combat/serpent_raider/prepare.png"),
    ]
    items: list[tuple[str, Image.Image]] = []
    for unit_id in UNITS:
        items.append((f"{unit_id} MASTER", rgba(MASTER_ROOT / f"{unit_id}.png")))
        items.extend((f"{unit_id} {pose}", unit_images[unit_id][pose]) for pose in POSE_IDS)
    items.extend((name, rgba(path)) for name, path in references)
    cell = 300
    columns = 5
    rows = (len(items) + columns - 1) // columns
    header = 68
    board = Image.new("RGBA", (cell * columns, header + cell * rows), (11, 14, 20, 255))
    draw = ImageDraw.Draw(board)
    label(draw, (18, 13), "MILITIA SCALE COHERENCE | MASTERS + 8 POSES + STANDARD_HUMANOID REFERENCES")
    label(draw, (18, 34), "Every 512x512 source canvas uses the same 300x300 display transform")
    for index, (name, image) in enumerate(items):
        x = (index % columns) * cell
        y = header + (index // columns) * cell
        tile = checker((cell, cell), 15)
        tile.alpha_composite(display_canvas(image, cell), (0, 0))
        tile_draw = ImageDraw.Draw(tile)
        tile_draw.line((0, round(TARGET_BASELINE / 512 * cell), cell, round(TARGET_BASELINE / 512 * cell)), fill=(210, 76, 73, 210), width=1)
        tile_draw.rectangle((0, 0, cell - 1, cell - 1), outline=(70, 80, 96, 255), width=1)
        label(tile_draw, (8, 8), name, (241, 220, 164, 255))
        board.alpha_composite(tile, (x, y))
    output = OUT / "qa/militia-scale-coherence-board.png"
    output.parent.mkdir(parents=True, exist_ok=True)
    board.save(output)
    return output


def build_canvas_safety_board(unit_images: dict[str, dict[str, Image.Image]], records: list[dict[str, object]]) -> Path:
    cell = 384
    columns = 4
    header = 72
    rows = 2
    board = Image.new("RGBA", (cell * columns, header + cell * rows), (11, 14, 20, 255))
    draw = ImageDraw.Draw(board)
    label(draw, (18, 13), "MILITIA CANVAS SAFETY | ALPHA BOUNDS + 456 BASELINE + EDGE MARGINS")
    label(draw, (18, 34), f"Danger threshold: {SAFE_MARGIN_PX}px; green bounds must remain inside every 512 canvas")
    record_by_key = {(str(record["unitId"]), str(record["poseId"])): record for record in records}
    items = [(unit_id, pose) for unit_id in UNITS for pose in POSE_IDS]
    for index, (unit_id, pose) in enumerate(items):
        x = (index % columns) * cell
        y = header + (index // columns) * cell
        image = unit_images[unit_id][pose]
        record = record_by_key[(unit_id, pose)]
        tile = checker((cell, cell), 16)
        tile.alpha_composite(display_canvas(image, cell), (0, 0))
        tile_draw = ImageDraw.Draw(tile)
        sx = cell / 512
        left, top, right, bottom = [int(value) for value in record["alphaBounds"]]
        tile_draw.rectangle((round(left * sx), round(top * sx), round(right * sx), round(bottom * sx)), outline=(78, 222, 154, 255), width=2)
        baseline = round(int(record["baseline"]) * sx)
        tile_draw.line((0, baseline, cell, baseline), fill=(231, 83, 78, 255), width=1)
        label(tile_draw, (8, 8), f"{unit_id} | {pose}", (245, 220, 160, 255))
        margins = record["edgeMargins"]
        label(tile_draw, (8, 24), f"512x512 bounds={left},{top},{right},{bottom}")
        label(tile_draw, (8, 40), f"margins L{margins['left']} T{margins['top']} R{margins['right']} B{margins['bottom']}")
        board.alpha_composite(tile, (x, y))
    output = OUT / "qa/militia-canvas-safety-board.png"
    board.save(output)
    return output


def main() -> None:
    for path in (OUT / "boards", OUT / "poses", OUT / "manifests", OUT / "qa", OUT / "runtime-proof"):
        path.mkdir(parents=True, exist_ok=True)

    pre_path = OUT / "manifests/protected-production-hashes-before.json"
    if not pre_path.exists():
        write_json(pre_path, {"schemaVersion": 1, "phase": "BEFORE_DEV_FINALIZATION", **protected_entries()})

    pose_records: list[dict[str, object]] = []
    unit_images: dict[str, dict[str, Image.Image]] = {}
    board_records = []

    for unit_id, unit in UNITS.items():
        with tempfile.TemporaryDirectory(prefix=f"{unit_id}-processor-") as temporary:
            processor_dir = Path(temporary)
            run_processor(unit_id, unit, processor_dir)
            processor_meta = json.loads((processor_dir / "pipeline-meta.json").read_text(encoding="utf-8"))
            if not processor_meta.get("shared_scale") or processor_meta.get("component_mode") != "largest":
                raise RuntimeError(f"{unit_id}: processor must use one shared scale and largest-component cleanup")
            if processor_meta.get("edge_touch_frames"):
                raise RuntimeError(f"{unit_id}: raw board still has an edge-touching selected component")
            if float(processor_meta["fit_scale"]) != float(unit["processorFitScale"]):
                raise RuntimeError(f"{unit_id}: unexpected processor fit scale")

            final_poses: dict[str, Image.Image] = {}
            for index, pose_id in enumerate(POSE_IDS, start=1):
                source = processor_dir / f"{unit_id}-{index}.png"
                image = baseline_align(rgba(source), TARGET_BASELINE)
                destination = OUT / "poses" / unit_id / f"{pose_id}.png"
                destination.parent.mkdir(parents=True, exist_ok=True)
                image.save(destination)
                final_poses[pose_id] = image
                left, top, right, bottom = alpha_bounds(image)
                margins = {"left": left, "top": top, "right": 512 - right, "bottom": 512 - bottom}
                dangerous = min(margins.values()) < SAFE_MARGIN_PX
                pose_records.append({
                    "unitId": unit_id,
                    "poseId": pose_id,
                    "sourceMaster": rel(MASTER_ROOT / f"{unit_id}.png"),
                    "path": rel(destination),
                    "canvasWidth": 512,
                    "canvasHeight": 512,
                    "alphaBounds": [left, top, right, bottom],
                    "baseline": bottom,
                    "visiblePixelBounds": [left, top, right, bottom],
                    "edgeMargins": margins,
                    "sha256": sha256(destination),
                    "characterBoundFx": False,
                    "releasedFx": False,
                    "cropped": left <= 0 or top <= 0 or right >= 512 or bottom >= 512,
                    "dangerousMargin": dangerous,
                    "scaleChanged": False,
                    "scaleCorrection": 1,
                    "perPoseAutoScaling": False,
                    "fitToContent": False,
                    "sourceGrid": processor_meta["frames"][index - 1]["grid"],
                    "sharedSourceToOutputScale": True,
                })

            unit_images[unit_id] = final_poses
            master_path = MASTER_ROOT / f"{unit_id}.png"
            unit_board = build_unit_board(unit_id, rgba(master_path), final_poses)
            transparent_board = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
            for index, pose_id in enumerate(POSE_IDS):
                transparent_board.alpha_composite(final_poses[pose_id], ((index % 2) * 512, (index // 2) * 512))
            board_path = OUT / "boards" / f"{unit_id}-transparent-2x2.png"
            transparent_board.save(board_path)
            processor_meta_path = OUT / "manifests" / f"{unit_id}-processor-meta.json"
            shutil.copy2(processor_dir / "pipeline-meta.json", processor_meta_path)
            board_records.append({
                "unitId": unit_id,
                "displayName": unit["displayName"],
                "visualRole": unit["visualRole"],
                "sourceMaster": rel(master_path),
                "sourceMasterSha256": sha256(master_path),
                "sourceBoard": rel(OUT / "sources" / f"{unit_id}-board-source.png"),
                "sourceBoardSha256": sha256(OUT / "sources" / f"{unit_id}-board-source.png"),
                "generationSource": unit["sourceGeneration"],
                "transparentBoard": rel(board_path),
                "operatorBoard": rel(unit_board),
                "processorMeta": rel(processor_meta_path),
                "prompt": rel(OUT / "manifests" / f"{unit_id}-prompt.txt"),
                "baseline": TARGET_BASELINE,
                "worldUnitsPerPixel": WORLD_UNITS_PER_PIXEL,
                "scaleCorrection": 1,
                "sharedScaleAcrossPoses": True,
                "perPoseAutoScaling": False,
                "fitToContent": False,
            })

    scale_board = build_scale_board(unit_images)
    safety_board = build_canvas_safety_board(unit_images, pose_records)
    post = {"schemaVersion": 1, "phase": "AFTER_DEV_FINALIZATION", **protected_entries()}
    post_path = OUT / "manifests/protected-production-hashes-after.json"
    write_json(post_path, post)
    pre = json.loads(pre_path.read_text(encoding="utf-8"))
    changed_masters = sorted(path for path, digest in pre["masters"].items() if post["masters"].get(path) != digest)
    changed_combat = sorted(path for path, digest in pre["combatPoses"].items() if post["combatPoses"].get(path) != digest)

    manifest = {
        "schemaVersion": 1,
        "mission": "Option C Character System V2 Village Militia Combat Poses V1",
        "status": "DEV_REVIEW_READY",
        "productionPromotion": False,
        "poseOrder": list(POSE_IDS),
        "units": [],
        "boards": board_records,
        "scalePolicy": {
            "canvas": [512, 512],
            "baseline": TARGET_BASELINE,
            "worldUnitsPerPixel": WORLD_UNITS_PER_PIXEL,
            "scaleCorrection": 1,
            "sharedScalePerUnit": True,
            "perPoseAutoScaling": False,
            "fitToContent": False,
        },
        "qa": {
            "scaleCoherenceBoard": rel(scale_board),
            "canvasSafetyBoard": rel(safety_board),
            "operatorApproval": "PENDING",
        },
    }
    for unit_id in UNITS:
        poses = {}
        for record in pose_records:
            if record["unitId"] != unit_id:
                continue
            left, top, right, bottom = record["alphaBounds"]
            poses[record["poseId"]] = {
                "src": "/" + record["path"].removeprefix("public/"),
                "sha256": record["sha256"],
                "sourceSizePx": {"width": 512, "height": 512},
                "alphaBoundsPx": {"left": left, "top": top, "right": right, "bottom": bottom},
                "anchor": {"x": 256, "y": TARGET_BASELINE},
                "scaleCorrection": 1,
                "characterBoundFx": False,
            }
        manifest["units"].append({
            "unitId": unit_id,
            "worldUnitsPerPixel": WORLD_UNITS_PER_PIXEL,
            "master": "/assets/characters/pixel/masters/" + unit_id + ".png",
            "poses": poses,
            "productionStatus": "DEV_ONLY",
        })
    manifest_path = OUT / "manifests/village-militia-poses-v1-manifest.json"
    write_json(manifest_path, manifest)

    counts = {
        "posesPresent": len(pose_records),
        "croppedPoses": sum(bool(record["cropped"]) for record in pose_records),
        "dangerousMargins": sum(bool(record["dangerousMargin"]) for record in pose_records),
        "releasedFx": sum(bool(record["releasedFx"]) for record in pose_records),
        "bodyScaleChanges": sum(bool(record["scaleChanged"]) for record in pose_records),
        "characterBoundFx": sum(bool(record["characterBoundFx"]) for record in pose_records),
        "productionMastersChanged": len(changed_masters),
        "productionCombatPosesChanged": len(changed_combat),
    }
    pass_gate = counts == {
        "posesPresent": 8,
        "croppedPoses": 0,
        "dangerousMargins": 0,
        "releasedFx": 0,
        "bodyScaleChanges": 0,
        "characterBoundFx": 0,
        "productionMastersChanged": 0,
        "productionCombatPosesChanged": 0,
    }
    machine_qa = {
        "schemaVersion": 1,
        "status": "PASS" if pass_gate else "FAIL",
        "counts": counts,
        "changedProductionMasters": changed_masters,
        "changedProductionCombatPoses": changed_combat,
        "poses": pose_records,
        "policies": {
            "perPoseAutoScaling": False,
            "fitToContent": False,
            "sharedScalePerUnit": True,
            "baseline": TARGET_BASELINE,
            "dangerousMarginThresholdPx": SAFE_MARGIN_PX,
        },
    }
    machine_path = OUT / "qa/machine-qa.json"
    write_json(machine_path, machine_qa)

    summary = {
        "status": machine_qa["status"],
        "posesGenerated": len(pose_records),
        "manifest": rel(manifest_path),
        "machineQa": rel(machine_path),
        "unitBoards": [record["operatorBoard"] for record in board_records],
        "scaleBoard": rel(scale_board),
        "canvasSafetyBoard": rel(safety_board),
        "productionMastersChanged": len(changed_masters),
        "productionCombatPosesChanged": len(changed_combat),
    }
    print(json.dumps(summary, indent=2))
    if not pass_gate:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

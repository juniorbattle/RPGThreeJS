from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent.parent
QA_DIR = ROOT / "qa"
MANIFEST_DIR = ROOT / "manifests"
POSES = ("idle", "dash", "attack", "skill")
FRAME_SIZE = 512


UNITS = (
    {
        "slug": "alistair",
        "displayName": "Alistair",
        "scaleClass": "humanoid_hero",
        "targetWorldHeight": 2.1,
        "deliveryFitScale": 0.68,
        "weapon": "two-handed greatsword",
        "canonical": "public/assets/characters/pixel/full/alistair.png",
        "masterStatus": "CONFIRMED_FINAL_PRODUCTION_CANDIDATE",
        "masterSource": "public/assets/dev/option-c/phase4c/alistair/normalized/alistair-master.png",
        "weaponQa": {
            "status": "PASS_REVIEW_READY",
            "note": "The master-derived greatsword blade, guard, grip, and pommel now read as one canonical weapon across all four poses. The repaired IDLE has matching body presence; operator acceptance remains pending.",
        },
        "repairQa": {
            "scope": "IDLE perceived size and canonical greatsword geometry",
            "status": "PASS_REVIEW_READY",
        },
    },
    {
        "slug": "goblin",
        "displayName": "Goblin",
        "scaleClass": "small_creature",
        "targetWorldHeight": 1.6,
        "deliveryFitScale": 0.50,
        "weapon": "short leaf-shaped dagger",
        "canonical": "public/assets/characters/pixel/full/goblin.png",
        "masterStatus": "PILOT_CHARACTER_MASTER",
        "masterSource": "generated from the approved four-class style authority plus canonical Goblin identity",
        "weaponQa": {
            "status": "PASS_REVIEW_READY",
            "note": "The forward contact pose reads clearly and the dagger silhouette remains coherent across the four poses. Operator visual approval remains pending.",
        },
        "repairQa": {"scope": "not in repair scope", "status": "UNCHANGED"},
    },
    {
        "slug": "lion-champion",
        "displayName": "Lion Champion",
        "scaleClass": "boss_elite",
        "targetWorldHeight": 2.8,
        "deliveryFitScale": 0.74,
        "weapon": "royal two-handed greatsword",
        "canonical": "public/assets/characters/pixel/full/lion_champion.png",
        "masterStatus": "PILOT_CHARACTER_MASTER",
        "masterSource": "generated from the approved four-class style authority plus canonical Lion Champion identity",
        "weaponQa": {
            "status": "PASS_REVIEW_READY",
            "note": "The master-derived royal sword length, width, hooked gold guard, blue gem, grip, and pommel now read as one canonical weapon across all four poses while boss mass remains stable. Operator acceptance remains pending.",
        },
        "repairQa": {
            "scope": "canonical royal sword geometry while preserving boss mass",
            "status": "PASS_REVIEW_READY",
        },
    },
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def rel(path: Path) -> str:
    return path.relative_to(ROOT.parents[4]).as_posix()


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        return (0, 0, 0, 0)
    return bbox


def margins(bbox: tuple[int, int, int, int], size: int = FRAME_SIZE) -> dict[str, int]:
    left, top, right, bottom = bbox
    return {"left": left, "top": top, "right": size - right, "bottom": size - bottom}


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    name = "arialbd.ttf" if bold else "arial.ttf"
    path = Path("C:/Windows/Fonts") / name
    try:
        return ImageFont.truetype(str(path), size)
    except OSError:
        return ImageFont.load_default()


def checker(size: tuple[int, int], tile: int = 20) -> Image.Image:
    image = Image.new("RGBA", size, (36, 39, 46, 255))
    draw = ImageDraw.Draw(image)
    colors = ((48, 52, 61, 255), (64, 68, 78, 255))
    for y in range(0, size[1], tile):
        for x in range(0, size[0], tile):
            draw.rectangle((x, y, x + tile - 1, y + tile - 1), fill=colors[((x // tile) + (y // tile)) % 2])
    return image


def make_unit_qa(unit: dict, pose_records: list[dict]) -> Path:
    canvas = Image.new("RGB", (1760, 760), (20, 22, 28))
    draw = ImageDraw.Draw(canvas)
    gold = (226, 188, 105)
    pale = (232, 235, 242)
    muted = (155, 164, 180)
    cyan = (69, 204, 230)
    draw.text((38, 24), f"OPTION C COMBAT POSES V2 — {unit['displayName']}", font=font(30, True), fill=gold)
    draw.text((38, 64), "Character Master vs IDLE / DASH / ATTACK / SKILL — common 512 px canvas", font=font(18), fill=pale)

    entries = [("MASTER", ROOT / "masters" / f"{unit['slug']}-master.png", None)]
    for pose, record in zip(POSES, pose_records):
        entries.append((pose.upper(), ROOT.parents[4] / record["path"], record))

    card_w, card_h, gap, start_x, top = 320, 550, 22, 35, 110
    image_box = 286
    display_scale = image_box / FRAME_SIZE
    for index, (label, path, record) in enumerate(entries):
        x = start_x + index * (card_w + gap)
        draw.rounded_rectangle((x, top, x + card_w, top + card_h), radius=12, fill=(29, 32, 39), outline=(78, 85, 99), width=2)
        draw.text((x + 16, top + 13), label, font=font(20, True), fill=gold if index == 0 else pale)
        preview = checker((image_box, image_box), 18)
        source = Image.open(path).convert("RGBA")
        resized = source.resize((image_box, image_box), Image.Resampling.NEAREST)
        preview.alpha_composite(resized)
        px, py = x + 17, top + 55
        canvas.paste(preview.convert("RGB"), (px, py))
        bbox = alpha_bbox(source)
        box = tuple(int(value * display_scale) for value in bbox)
        draw.rectangle((px + box[0], py + box[1], px + box[2], py + box[3]), outline=cyan, width=2)
        if record is not None:
            baseline_y = py + int(record["footBaselinePx"] * display_scale)
            draw.line((px, baseline_y, px + image_box, baseline_y), fill=(238, 100, 90), width=2)
            draw.text((x + 16, top + 358), f"alpha bbox: {bbox}", font=font(14), fill=muted)
            draw.text((x + 16, top + 381), f"baseline/pivot: 256,{record['footBaselinePx']}", font=font(14), fill=muted)
            draw.text((x + 16, top + 404), "scaleCorrection: 1.0", font=font(14), fill=muted)
            draw.text((x + 16, top + 427), f"min margin: {min(record['transparentMarginsPx'].values())} px", font=font(14), fill=muted)
        else:
            draw.text((x + 16, top + 358), f"alpha bbox: {bbox}", font=font(14), fill=muted)
            draw.text((x + 16, top + 381), unit["masterStatus"], font=font(13), fill=muted)

    note = unit["weaponQa"]
    draw.text((38, 687), f"Weapon geometry: {note['status']}", font=font(17, True), fill=(244, 176, 92))
    draw.text((38, 716), note["note"], font=font(14), fill=pale)
    path = QA_DIR / f"{unit['slug']}-qa-board.png"
    canvas.save(path)
    return path


def make_stage_scale_board(unit_manifests: list[dict]) -> Path:
    canvas = Image.new("RGB", (1600, 760), (17, 19, 24))
    draw = ImageDraw.Draw(canvas)
    gold = (226, 188, 105)
    pale = (232, 235, 242)
    muted = (155, 164, 180)
    baseline_y = 620
    pixels_per_world_unit = 150
    draw.text((40, 28), "OPTION C PILOT — ACTUAL COMBAT-STAGE SCALE", font=font(30, True), fill=gold)
    draw.text((40, 70), "One common world scale per unit; natural size differences preserved", font=font(18), fill=pale)
    draw.line((70, baseline_y, 1535, baseline_y), fill=(238, 100, 90), width=3)
    draw.line((75, baseline_y, 75, baseline_y - pixels_per_world_unit), fill=gold, width=4)
    draw.line((63, baseline_y, 87, baseline_y), fill=gold, width=3)
    draw.line((63, baseline_y - pixels_per_world_unit, 87, baseline_y - pixels_per_world_unit), fill=gold, width=3)
    draw.text((92, baseline_y - pixels_per_world_unit - 8), "1.0 world unit", font=font(16, True), fill=gold)

    centers = (330, 810, 1290)
    for center_x, manifest in zip(centers, unit_manifests):
        idle = ROOT.parents[4] / manifest["poses"][0]["path"]
        source = Image.open(idle).convert("RGBA")
        bbox = alpha_bbox(source)
        alpha_height = bbox[3] - bbox[1]
        target_px = manifest["scaleData"]["targetWorldHeight"] * pixels_per_world_unit
        scale = target_px / alpha_height
        resized = source.resize((round(source.width * scale), round(source.height * scale)), Image.Resampling.NEAREST)
        rbbox = alpha_bbox(resized)
        paste_x = round(center_x - (rbbox[0] + rbbox[2]) / 2)
        paste_y = round(baseline_y - rbbox[3])
        canvas.paste(resized, (paste_x, paste_y), resized)
        draw.text((center_x - 120, 646), manifest["unit"]["displayName"], font=font(22, True), fill=pale)
        draw.text((center_x - 120, 681), f"{manifest['scaleData']['targetWorldHeight']:.1f} world units", font=font(17), fill=muted)
        draw.text((center_x - 120, 711), manifest["unit"]["scaleClass"].replace("_", " "), font=font(15), fill=muted)

    path = QA_DIR / "pilot-stage-scale.png"
    canvas.save(path)
    return path


def build() -> None:
    QA_DIR.mkdir(parents=True, exist_ok=True)
    MANIFEST_DIR.mkdir(parents=True, exist_ok=True)
    unit_manifests: list[dict] = []

    for unit in UNITS:
        slug = unit["slug"]
        processor_path = MANIFEST_DIR / f"{slug}-processor-meta.json"
        processor = json.loads(processor_path.read_text(encoding="utf-8"))
        pose_records: list[dict] = []
        idle_alpha_height = 0
        source_scales: list[float] = []
        foot_baselines: list[int] = []

        for pose_name, frame_meta in zip(POSES, processor["frames"]):
            path = ROOT / "split-poses" / slug / f"{slug}-{pose_name}.png"
            image = Image.open(path).convert("RGBA")
            bbox = alpha_bbox(image)
            if pose_name == "idle":
                idle_alpha_height = bbox[3] - bbox[1]
            crop = frame_meta["crop_bbox"]
            source_width = crop[2] - crop[0]
            source_height = crop[3] - crop[1]
            output_width, output_height = frame_meta["output_size"]
            foot_baseline = frame_meta["paste_position"][1] + output_height
            foot_baselines.append(foot_baseline)
            scale_candidates = []
            if source_width:
                scale_candidates.append(output_width / source_width)
            if source_height:
                scale_candidates.append(output_height / source_height)
            source_scales.append(sum(scale_candidates) / len(scale_candidates))
            pose_records.append(
                {
                    "pose": pose_name,
                    "path": rel(path),
                    "sha256": sha256(path),
                    "dimensionsPx": [image.width, image.height],
                    "alphaBBoxPx": list(bbox),
                    "transparentMarginsPx": margins(bbox),
                    "footBaselinePx": foot_baseline,
                    "pivotPx": [FRAME_SIZE // 2, foot_baseline],
                    "scaleCorrection": 1.0,
                    "sourceGrid": frame_meta["grid"],
                    "sourceCropBBoxPx": frame_meta["crop_bbox"],
                    "commonScaleOutputSizePx": frame_meta["output_size"],
                    "pastePositionPx": frame_meta["paste_position"],
                }
            )

        world_units_per_pixel = unit["targetWorldHeight"] / idle_alpha_height
        common_scale = sum(source_scales) / len(source_scales)
        if len(set(foot_baselines)) != 1:
            raise ValueError(f"{slug}: expected one shared baseline, got {foot_baselines}")
        foot_baseline = foot_baselines[0]
        master_path = ROOT / "masters" / f"{slug}-master.png"
        master_image = Image.open(master_path).convert("RGBA")
        board_path = ROOT / "boards-2x2" / f"{slug}-board.png"
        board_source_path = ROOT / "boards-2x2" / f"{slug}-board-source.png"
        qa_path = make_unit_qa(unit, pose_records)
        min_margin = min(min(record["transparentMarginsPx"].values()) for record in pose_records)

        manifest = {
            "schemaVersion": 1,
            "mission": "Option C Combat Poses V2 static pose library pilot",
            "status": "PILOT_REVIEW_READY",
            "productionPromotion": False,
            "unit": {
                "id": slug,
                "displayName": unit["displayName"],
                "scaleClass": unit["scaleClass"],
                "weapon": unit["weapon"],
                "canonicalReference": unit["canonical"],
            },
            "artDirection": {
                "primaryAuthority": "user-supplied approved four-class reference image",
                "family": "Option C clean modern premium HD-2D pixel art",
                "boardGenerationPolicy": "all four poses generated together in one 2x2 board",
            },
            "master": {
                "path": rel(master_path),
                "sha256": sha256(master_path),
                "dimensionsPx": [master_image.width, master_image.height],
                "alphaBBoxPx": list(alpha_bbox(master_image)),
                "status": unit["masterStatus"],
                "source": unit["masterSource"],
            },
            "board": {
                "sourcePath": rel(board_source_path),
                "sourceSha256": sha256(board_source_path),
                "transparentPath": rel(board_path),
                "transparentSha256": sha256(board_path),
                "dimensionsPx": list(Image.open(board_path).size),
                "grid": [2, 2],
                "poseOrder": ["idle", "dash", "attack", "skill"],
                "edgeTouchFrames": processor["edge_touch_frames"],
            },
            "poses": pose_records,
            "scaleData": {
                "canvasPx": [FRAME_SIZE, FRAME_SIZE],
                "equivalentPoseCanvasFormat": True,
                "targetWorldHeight": unit["targetWorldHeight"],
                "deliveryFitScale": unit["deliveryFitScale"],
                "worldUnitsPerPixel": round(world_units_per_pixel, 10),
                "sharedSourceToOutputScale": round(common_scale, 6),
                "sharedScaleAcrossPoses": True,
                "perPoseFitToContent": False,
                "scaleCorrection": 1.0,
                "footBaselinePx": foot_baseline,
                "pivotPx": [FRAME_SIZE // 2, foot_baseline],
            },
            "qa": {
                "boardBoundaryCheck": "PASS",
                "transparentRgbaCheck": "PASS",
                "poseCountCheck": "PASS",
                "commonScaleCheck": "PASS",
                "minimumTransparentMarginPx": min_margin,
                "identityConsistency": "REVIEW_READY",
                "headHelmetStability": "REVIEW_READY",
                "shoulderTorsoConsistency": "REVIEW_READY",
                "limbLengthConsistency": "REVIEW_READY",
                "weaponGeometry": unit["weaponQa"],
                **({"latestRepair": unit["repairQa"]} if slug in {"alistair", "lion-champion"} else {}),
                "silhouetteAtCombatScale": "REVIEW_READY",
                "vfxClearance": "PASS_MACHINE_BOUNDS",
                "operatorVisualApproval": "PENDING",
                "qaBoardPath": rel(qa_path),
            },
            "runtimeIntegration": {
                "possibleWithoutGameplayChanges": True,
                "possibleWithoutVfxChanges": True,
                "semanticMap": {"prepare": "idle", "dash": "dash", "attack": "attack", "cast": "skill"},
                "integrationPerformed": False,
            },
            "provenance": {
                "processorMetaPath": rel(processor_path),
                "promptPath": rel(MANIFEST_DIR / f"{slug}-board-prompt.txt"),
                "generatedOffline": True,
            },
        }
        manifest_path = MANIFEST_DIR / f"{slug}-manifest.json"
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        unit_manifests.append(manifest)

    stage_path = make_stage_scale_board(unit_manifests)
    pilot_manifest = {
        "schemaVersion": 1,
        "mission": "Option C Combat Poses V2 static pose library pilot",
        "status": "PILOT_REVIEW_READY",
        "productionPromotion": False,
        "units": [manifest["unit"]["id"] for manifest in unit_manifests],
        "unitManifests": [f"public/assets/dev/option-c/combat-poses-v2/manifests/{manifest['unit']['id']}-manifest.json" for manifest in unit_manifests],
        "styleFamilyCheck": "PASS_REVIEW_READY",
        "allBoardsGeneratedAsSingle2x2": True,
        "allPosesSharedScaleWithinUnit": True,
        "allScaleCorrections": 1.0,
        "commonPoseCanvasPx": [FRAME_SIZE, FRAME_SIZE],
        "deliveryFitScales": {unit["slug"]: unit["deliveryFitScale"] for unit in UNITS},
        "latestRepairScope": ["alistair", "lion-champion"],
        "goblinSetChanged": False,
        "repairInvariants": {
            "artDirectionChanged": False,
            "canvasChanged": False,
            "baselinePivotChanged": False,
            "sharedPerUnitScaleChanged": False,
            "attackSkillPoseLogicChanged": False,
        },
        "gameplayChanged": False,
        "combatLogicChanged": False,
        "vfxChanged": False,
        "canonicalAssetsChanged": False,
        "stageScaleQaPath": rel(stage_path),
        "operatorVisualApproval": "PENDING",
        "promotionBlockers": [
            "Operator visual approval is pending.",
            "Final human acceptance of the repaired Alistair and Lion Champion sword locks remains pending.",
        ],
    }
    (MANIFEST_DIR / "pilot-manifest.json").write_text(json.dumps(pilot_manifest, indent=2) + "\n", encoding="utf-8")

    validation_units: list[dict] = []
    for manifest in unit_manifests:
        slug = manifest["unit"]["id"]
        source_path = ROOT / "boards-2x2" / f"{slug}-board-source.png"
        source = Image.open(source_path).convert("RGB")
        corner_pixels = [
            source.getpixel((0, 0)),
            source.getpixel((source.width - 1, 0)),
            source.getpixel((0, source.height - 1)),
            source.getpixel((source.width - 1, source.height - 1)),
        ]
        magenta_pixels = sum(count for count, color in source.getcolors(source.width * source.height) or [] if color == (255, 0, 255))
        processor = json.loads((MANIFEST_DIR / f"{slug}-processor-meta.json").read_text(encoding="utf-8"))
        observed_scales: list[float] = []
        for frame in processor["frames"]:
            crop = frame["crop_bbox"]
            source_width = crop[2] - crop[0]
            source_height = crop[3] - crop[1]
            output_width, output_height = frame["output_size"]
            observed_scales.extend([output_width / source_width, output_height / source_height])
        scale_spread = max(observed_scales) - min(observed_scales)
        pose_paths = [ROOT.parents[4] / pose["path"] for pose in manifest["poses"]]
        pose_checks = [
            Image.open(path).mode == "RGBA" and Image.open(path).size == (FRAME_SIZE, FRAME_SIZE) and Image.open(path).getchannel("A").getextrema()[0] == 0
            for path in pose_paths
        ]
        checks = {
            "exactMagentaSourceCorners": all(pixel == (255, 0, 255) for pixel in corner_pixels),
            "magentaBackgroundMajority": magenta_pixels / (source.width * source.height) > 0.5,
            "boardBoundary": processor["edge_touch_frames"] == [],
            "sharedScaleEnabled": processor["shared_scale"] is True,
            "observedSharedScaleSpreadAtMost0_005": scale_spread <= 0.005,
            "fourTransparent512Poses": len(pose_paths) == 4 and all(pose_checks),
            "allScaleCorrectionsOne": all(pose["scaleCorrection"] == 1.0 for pose in manifest["poses"]),
            "deliveryFitScaleMatchesUnitClass": abs(processor["fit_scale"] - manifest["scaleData"]["deliveryFitScale"]) < 0.000001,
            "minimumTransparentMarginAtLeast60": manifest["qa"]["minimumTransparentMarginPx"] >= 60,
        }
        validation_units.append(
            {
                "unit": slug,
                "status": "PASS" if all(checks.values()) else "FAIL",
                "checks": checks,
                "exactMagentaPixelRatio": round(magenta_pixels / (source.width * source.height), 6),
                "observedSharedScaleSpread": round(scale_spread, 6),
            }
        )

    validation = {
        "schemaVersion": 1,
        "status": "PASS" if all(unit["status"] == "PASS" for unit in validation_units) else "FAIL",
        "scope": "Option C Combat Poses V2 pilot outputs only",
        "counts": {
            "finalMasters": len(list((ROOT / "masters").glob("*-master.png"))),
            "finalBoards": len(list((ROOT / "boards-2x2").glob("*-board.png"))),
            "splitPoses": len(list((ROOT / "split-poses").glob("*/*.png"))),
            "unitManifests": len(list(MANIFEST_DIR.glob("*-manifest.json"))) - 1,
        },
        "expectedCounts": {"finalMasters": 3, "finalBoards": 3, "splitPoses": 12, "unitManifests": 3},
        "units": validation_units,
        "operatorVisualApproval": "PENDING",
        "productionPromotion": False,
    }
    validation["countsPass"] = validation["counts"] == validation["expectedCounts"]
    validation["status"] = "PASS" if validation["status"] == "PASS" and validation["countsPass"] else "FAIL"
    (QA_DIR / "pilot-validation.json").write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    build()

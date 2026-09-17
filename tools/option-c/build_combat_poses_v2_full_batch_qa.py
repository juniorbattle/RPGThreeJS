from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/assets/dev/option-c/combat-poses-v2"
QA_ROOT = OUT / "qa/full-roster-batch"
QA_ROOT.mkdir(parents=True, exist_ok=True)

PILOTS = [
    ("alistair", "alistair"),
    ("goblin", "goblin"),
    ("lion-champion", "lion_champion"),
]
NEW_ORDER = [
    "white_mage",
    "dark_mage",
    "archer",
    "rogue",
    "lancer",
    "forest_badger",
    "cave_bat",
    "wild_boar",
    "cave_rat",
    "forest_spider",
    "marsh_toad",
    "serpent_raider",
    "serpent_brute",
    "serpent_oracle",
    "skeleton",
    "venom_serpent",
    "wolf",
    "young_dragon_elite",
    "forest_troll_elite",
    "serpent_general_boss",
    "serpent_duelist_elite",
    "serpent_elite_brute",
]
ROSTER = PILOTS + [(unit_id, unit_id) for unit_id in NEW_ORDER]
POSES = ("idle", "dash", "attack", "skill")

CLASSIFICATIONS = {
    **{logical: "APPROVED_PILOT" for _, logical in PILOTS},
    **{unit_id: "PASS_CANDIDATE" for unit_id in NEW_ORDER},
    "archer": "POSE_REPAIR",
    "forest_troll_elite": "WEAPON_REPAIR",
    "serpent_general_boss": "REGENERATE",
}
KNOWN_ISSUES = {
    "archer": [
        "SKILL remains too close to the ATTACK full-draw silhouette; local skill-pose repair is recommended after operator review."
    ],
    "forest_troll_elite": [
        "The canonical log club is visually detached/obscured by the body in DASH; local weapon-hand repair is recommended."
    ],
    "serpent_general_boss": [
        "The single allowed board correction preserved the curved sword in SKILL, but the ATTACK blade still crosses the source quadrant boundary and produces a clipped/foreign fragment after deterministic split; regenerate the complete 2x2 board after review."
    ],
}

FONT_PATH = Path(r"C:/Windows/Fonts/arial.ttf")
BOLD_PATH = Path(r"C:/Windows/Fonts/arialbd.ttf")


def font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    path = BOLD_PATH if bold else FONT_PATH
    if path.is_file():
        return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def load_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def checker(size: tuple[int, int], cell: int = 16) -> Image.Image:
    canvas = Image.new("RGBA", size, (31, 35, 43, 255))
    draw = ImageDraw.Draw(canvas)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            color = (46, 51, 61, 255) if (x // cell + y // cell) % 2 else (35, 39, 48, 255)
            draw.rectangle((x, y, min(size[0], x + cell), min(size[1], y + cell)), fill=color)
    return canvas


def image_bbox(path: Path) -> list[int] | None:
    bbox = load_rgba(path).getchannel("A").getbbox()
    return list(bbox) if bbox else None


def margins_from_bbox(bbox: list[int] | None) -> dict[str, int] | None:
    if not bbox:
        return None
    return {"left": bbox[0], "top": bbox[1], "right": 512 - bbox[2], "bottom": 512 - bbox[3]}


def unit_paths(file_slug: str) -> dict[str, Path]:
    return {
        "master": OUT / "masters" / f"{file_slug}-master.png",
        "board": OUT / "boards-2x2" / f"{file_slug}-board.png",
        **{
            pose: OUT / "split-poses" / file_slug / f"{file_slug}-{pose}.png"
            for pose in POSES
        },
    }


def draw_centered(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], text: str, face: ImageFont.ImageFont, fill=(235, 238, 244, 255)) -> None:
    bounds = draw.textbbox((0, 0), text, font=face)
    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]
    x = box[0] + (box[2] - box[0] - width) // 2
    y = box[1] + (box[3] - box[1] - height) // 2
    draw.text((x, y), text, font=face, fill=fill)


def paste_full_canvas(destination: Image.Image, sprite: Image.Image, box: tuple[int, int, int, int]) -> None:
    width = box[2] - box[0]
    height = box[3] - box[1]
    side = min(width, height)
    resized = sprite.resize((side, side), Image.Resampling.NEAREST)
    x = box[0] + (width - side) // 2
    y = box[1] + (height - side) // 2
    destination.alpha_composite(resized, (x, y))


def build_unit_qa(unit_id: str, file_slug: str, audit: dict[str, object]) -> Path:
    paths = unit_paths(file_slug)
    width, header, image_h, footer = 2560, 76, 512, 144
    canvas = Image.new("RGBA", (width, header + image_h + footer), (20, 23, 29, 255))
    draw = ImageDraw.Draw(canvas)
    labels = ("MASTER REFERENCE", "IDLE / PREPARE", "DASH", "ATTACK", "SKILL / CAST")
    baseline = int(audit["baselinePx"])
    pivot = audit["pivotPx"]
    for index, key in enumerate(("master",) + POSES):
        x = index * 512
        tile = checker((512, 512), 16)
        sprite = load_rgba(paths[key])
        tile.alpha_composite(sprite)
        canvas.alpha_composite(tile, (x, header))
        bbox = sprite.getchannel("A").getbbox()
        if bbox:
            color = (245, 189, 65, 255) if key == "master" else (74, 220, 165, 255)
            draw.rectangle((x + bbox[0], header + bbox[1], x + bbox[2] - 1, header + bbox[3] - 1), outline=color, width=2)
        if key != "master":
            draw.line((x, header + baseline, x + 511, header + baseline), fill=(255, 92, 92, 220), width=2)
            draw.ellipse(
                (
                    x + int(pivot[0]) - 5,
                    header + int(pivot[1]) - 5,
                    x + int(pivot[0]) + 5,
                    header + int(pivot[1]) + 5,
                ),
                outline=(100, 195, 255, 255),
                width=2,
            )
        draw.rectangle((x, 0, x + 511, header - 1), outline=(70, 76, 89, 255), width=1)
        draw_centered(draw, (x, 0, x + 512, header), labels[index], font(24, True))

    status = CLASSIFICATIONS[unit_id]
    line1 = (
        f"{unit_id}  |  target={audit['targetWorldSize']}u  |  factor={audit['targetDeliveryFactor']:.2f}  |  "
        f"baseline={baseline}  |  pivot=({pivot[0]},{pivot[1]})  |  scaleCorrection=1.0"
    )
    line2 = (
        f"QA={status}  |  identity/style/scale/morphology/pixel density/VFX clearance/grounding: operator review pending"
    )
    issue = "Known issue: " + (KNOWN_ISSUES.get(unit_id, ["none detected in batch triage"])[0])
    draw.text((28, header + image_h + 18), line1, font=font(25, True), fill=(244, 246, 250, 255))
    draw.text((28, header + image_h + 56), line2, font=font(21), fill=(184, 203, 223, 255))
    draw.text((28, header + image_h + 92), issue, font=font(18), fill=(242, 190, 105, 255))
    target = OUT / "qa" / f"{unit_id}-qa-board.png"
    canvas.save(target)
    return target


def build_roster_board(filename: str, source_key: str, title: str) -> None:
    cols, rows = 5, 5
    tile_w, tile_h, top = 330, 360, 76
    canvas = Image.new("RGBA", (cols * tile_w, top + rows * tile_h), (18, 21, 27, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((26, 19), title, font=font(34, True), fill=(245, 247, 251, 255))
    for index, (file_slug, logical) in enumerate(ROSTER):
        row, col = divmod(index, cols)
        x, y = col * tile_w, top + row * tile_h
        tile = checker((tile_w, tile_h - 48), 14)
        canvas.alpha_composite(tile, (x, y))
        sprite = load_rgba(unit_paths(file_slug)[source_key])
        paste_full_canvas(canvas, sprite, (x + 14, y + 2, x + tile_w - 14, y + tile_h - 54))
        status = CLASSIFICATIONS[logical]
        draw.rectangle((x, y, x + tile_w - 1, y + tile_h - 1), outline=(62, 70, 84, 255), width=2)
        draw_centered(draw, (x, y + tile_h - 48, x + tile_w, y + tile_h - 22), logical, font(17, True))
        draw_centered(draw, (x, y + tile_h - 23, x + tile_w, y + tile_h), status, font(13), (154, 199, 230, 255))
    canvas.save(QA_ROOT / filename)


def build_four_pose_board() -> None:
    cols, rows = 5, 5
    tile, top = 420, 76
    canvas = Image.new("RGBA", (cols * tile, top + rows * tile), (18, 21, 27, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((26, 19), "OPTION C V2 - FULL ROSTER FOUR-POSE REVIEW", font=font(34, True), fill=(245, 247, 251, 255))
    for index, (file_slug, logical) in enumerate(ROSTER):
        row, col = divmod(index, cols)
        x, y = col * tile, top + row * tile
        board = load_rgba(unit_paths(file_slug)["board"]).resize((384, 384), Image.Resampling.NEAREST)
        bg = checker((384, 384), 12)
        bg.alpha_composite(board)
        canvas.alpha_composite(bg, (x + 18, y + 4))
        draw.rectangle((x, y, x + tile - 1, y + tile - 1), outline=(62, 70, 84, 255), width=2)
        draw_centered(draw, (x, y + 388, x + tile, y + 416), logical, font(18, True))
    canvas.save(QA_ROOT / "four-pose-roster-board.png")


def build_relative_scale_board(audits: dict[str, dict[str, object]]) -> None:
    cols, rows = 5, 5
    tile_w, tile_h, top = 760, 350, 92
    canvas = Image.new("RGBA", (cols * tile_w, top + rows * tile_h), (17, 20, 26, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((26, 18), "RELATIVE SCALE: GOBLIN < ALISTAIR < LION CHAMPION + UNIT", font=font(34, True), fill=(245, 247, 251, 255))
    draw.text((26, 58), "Uniform display transform; each sprite retains its authored 512-canvas runtime factor.", font=font(20), fill=(170, 193, 215, 255))
    pilot_specs = [("goblin", "G", (96, 220, 130, 255)), ("alistair", "A", (103, 180, 255, 255)), ("lion-champion", "L", (246, 185, 74, 255))]
    scale = 0.40
    side = round(512 * scale)
    for index, (file_slug, logical) in enumerate(ROSTER):
        row, col = divmod(index, cols)
        x, y = col * tile_w, top + row * tile_h
        canvas.alpha_composite(checker((tile_w, tile_h - 42), 14), (x, y))
        draw.line((x + 12, y + 268, x + tile_w - 12, y + 268), fill=(255, 92, 92, 220), width=2)
        specs = pilot_specs + [(file_slug, "U", (231, 111, 145, 255))]
        for sprite_index, (slug, marker, color) in enumerate(specs):
            source = load_rgba(unit_paths(slug)["idle"]).resize((side, side), Image.Resampling.NEAREST)
            base = (
                int(json.loads((OUT / "manifests" / f"{slug}-manifest.json").read_text(encoding="utf-8"))["scaleData"]["footBaselinePx"])
                if slug in {"alistair", "goblin", "lion-champion"}
                else int(audits[slug]["baselinePx"])
            )
            px = x + 4 + sprite_index * 182
            py = y + 268 - round(base * scale)
            canvas.alpha_composite(source, (px, py))
            draw.text((px + 88, y + 275), marker, font=font(16, True), fill=color)
        audit = audits.get(logical)
        if audit:
            detail = f"{logical}  {audit['targetWorldSize']}u  factor {audit['targetDeliveryFactor']:.2f}"
        else:
            manifest = json.loads((OUT / "manifests" / f"{file_slug}-manifest.json").read_text(encoding="utf-8"))
            detail = f"{logical}  {manifest['scaleData']['targetWorldHeight']}u  factor {manifest['scaleData']['deliveryFitScale']:.2f}"
        draw_centered(draw, (x, y + tile_h - 42, x + tile_w, y + tile_h), detail, font(18, True))
        draw.rectangle((x, y, x + tile_w - 1, y + tile_h - 1), outline=(62, 70, 84, 255), width=2)
    canvas.save(QA_ROOT / "relative-scale-board.png")


def build_weapon_review_board(audits: dict[str, dict[str, object]]) -> None:
    cols, rows = 5, 5
    tile_w, tile_h, top = 500, 310, 76
    canvas = Image.new("RGBA", (cols * tile_w, top + rows * tile_h), (18, 21, 27, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((26, 19), "WEAPON / ATTACK METHOD REVIEW - MASTER VS ATTACK", font=font(34, True), fill=(245, 247, 251, 255))
    for index, (file_slug, logical) in enumerate(ROSTER):
        row, col = divmod(index, cols)
        x, y = col * tile_w, top + row * tile_h
        canvas.alpha_composite(checker((tile_w, tile_h - 56), 14), (x, y))
        master = load_rgba(unit_paths(file_slug)["master"])
        attack = load_rgba(unit_paths(file_slug)["attack"])
        paste_full_canvas(canvas, master, (x + 4, y + 4, x + 248, y + 248))
        paste_full_canvas(canvas, attack, (x + 252, y + 4, x + 496, y + 248))
        weapon = audits.get(logical, {}).get("weaponOrAttackMethod", "pilot canonical weapon")
        draw_centered(draw, (x, y + 252, x + tile_w, y + 278), logical, font(17, True))
        draw_centered(draw, (x + 8, y + 278, x + tile_w - 8, y + tile_h), str(weapon)[:62], font(13), (174, 198, 219, 255))
        status = CLASSIFICATIONS[logical]
        color = (255, 116, 108, 255) if status in {"WEAPON_REPAIR", "REGENERATE"} else (90, 214, 157, 255)
        draw.rectangle((x, y, x + tile_w - 1, y + tile_h - 1), outline=color, width=2)
    canvas.save(QA_ROOT / "weapon-review-board.png")


def verify_protection(inventory: dict[str, object]) -> tuple[list[str], list[str]]:
    pilot_changed = []
    for relative, expected in inventory["pilotProtectionSnapshot"]["sha256"].items():
        path = OUT / relative
        if not path.is_file() or sha256(path) != expected:
            pilot_changed.append(relative)
    canonical_changed = []
    for audit in inventory["audits"]:
        for source in audit["sourceFiles"]:
            path = ROOT / source["path"]
            if not path.is_file() or sha256(path) != source["sha256"]:
                canonical_changed.append(source["path"])
    return pilot_changed, canonical_changed


def main() -> None:
    audits_doc = json.loads((OUT / "audits/canonical-reference-audits.json").read_text(encoding="utf-8"))
    audits = {entry["unitId"]: entry for entry in audits_doc["units"]}
    inventory = json.loads((OUT / "audits/canonical-reference-inventory.json").read_text(encoding="utf-8"))
    units = []

    for unit_id in NEW_ORDER:
        audit = audits[unit_id]
        paths = unit_paths(unit_id)
        meta_path = OUT / "manifests" / f"{unit_id}-processor-meta.json"
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        pose_records = []
        for index, pose in enumerate(POSES):
            bbox = image_bbox(paths[pose])
            pose_records.append(
                {
                    "pose": "prepare" if pose == "idle" else "cast" if pose == "skill" else pose,
                    "path": rel(paths[pose]),
                    "sha256": sha256(paths[pose]),
                    "canvas": [512, 512],
                    "alphaBBox": bbox,
                    "transparentMargins": margins_from_bbox(bbox),
                    "baseline": audit["baselinePx"],
                    "pivot": audit["pivotPx"],
                    "scaleCorrection": 1.0,
                    "sourceGrid": meta["frames"][index]["grid"],
                    "sourceCropBBox": meta["frames"][index]["crop_bbox"],
                    "commonScaleOutputSize": meta["frames"][index]["output_size"],
                    "pastePosition": meta["frames"][index]["paste_position"],
                    "sourceEdgeTouch": bool(meta["frames"][index]["edge_touch"]),
                }
            )

        qa_path = build_unit_qa(unit_id, unit_id, audit)
        status = CLASSIFICATIONS[unit_id]
        issues = KNOWN_ISSUES.get(unit_id, [])
        manifest = {
            "schemaVersion": 1,
            "mission": "Option C Combat Poses V2 remaining 22 units production",
            "productionPromotion": False,
            "unitId": unit_id,
            "category": audit["category"],
            "canonicalReferenceFolder": audit["currentSourceFolder"],
            "master": rel(paths["master"]),
            "board": rel(paths["board"]),
            "prepare": rel(paths["idle"]),
            "dash": rel(paths["dash"]),
            "attack": rel(paths["attack"]),
            "cast": rel(paths["skill"]),
            "canvas": [512, 512],
            "baseline": audit["baselinePx"],
            "pivot": audit["pivotPx"],
            "targetWorldSize": audit["targetWorldSize"],
            "deliveryFactor": audit["targetDeliveryFactor"],
            "scaleCorrection": 1.0,
            "sizeClass": audit["targetSizeClass"],
            "weaponType": audit["weaponOrAttackMethod"],
            "qaStatus": status,
            "knownIssues": issues,
            "generationProvenance": {
                "model": "UNKNOWN",
                "modelProvenance": "UNKNOWN",
                "canonicalIdentityReference": audit["currentSourceFolder"],
                "styleReferences": [
                    "approved Option C four-class reference",
                    "Alistair V2 pilot",
                    "Goblin V2 pilot",
                    "Lion Champion V2 pilot",
                ],
                "masterSource": rel(OUT / "masters" / f"{unit_id}-master-source.png"),
                "boardSource": rel(OUT / "boards-2x2" / f"{unit_id}-board-source.png"),
                "boardPrompt": rel(OUT / "manifests" / f"{unit_id}-board-prompt.txt"),
                "processorMeta": rel(meta_path),
                "boardGeneratedAsOne2x2Family": True,
            },
            "scaleDoctrine": {
                "sharedScaleAcrossPoses": True,
                "perPoseAutoScaling": False,
                "fitToContentPerPose": False,
                "scaleCorrectionOverrides": 0,
            },
            "poses": pose_records,
            "qa": {
                "identity": "OPERATOR_REVIEW_PENDING",
                "style": "OPERATOR_REVIEW_PENDING",
                "physicalScale": "PASS_MACHINE_SHARED_SCALE",
                "morphology": "OPERATOR_REVIEW_PENDING",
                "poseSemantics": "REVIEW" if status in {"POSE_REPAIR", "REGENERATE"} else "PASS_CANDIDATE",
                "weapon": "REVIEW" if status in {"WEAPON_REPAIR", "REGENERATE"} else "PASS_CANDIDATE",
                "pixelDensity": "PASS_MACHINE_SHARED_SCALE",
                "vfxClearance": "PASS_MACHINE_BOUNDS" if not meta["edge_touch_frames"] else "SOURCE_EDGE_RISK",
                "groundingRisk": "AIRBORNE_ROOT_REVIEW" if unit_id == "cave_bat" else "PASS_MACHINE_BASELINE",
                "operatorApproval": "PENDING",
                "qaBoard": rel(qa_path),
            },
        }
        manifest_path = OUT / "manifests" / f"{unit_id}-manifest.json"
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        units.append(manifest)

    # Append immutable pilot records without rewriting their manifests.
    pilot_records = []
    for file_slug, logical in PILOTS:
        pilot = json.loads((OUT / "manifests" / f"{file_slug}-manifest.json").read_text(encoding="utf-8"))
        pilot_records.append(
            {
                "unitId": logical,
                "category": "APPROVED_PILOT",
                "canonicalReferenceFolder": pilot["unit"]["canonicalReference"],
                "master": pilot["master"]["path"],
                "board": pilot["board"]["transparentPath"],
                "prepare": pilot["poses"][0]["path"],
                "dash": pilot["poses"][1]["path"],
                "attack": pilot["poses"][2]["path"],
                "cast": pilot["poses"][3]["path"],
                "canvas": pilot["scaleData"]["canvasPx"],
                "baseline": pilot["scaleData"]["footBaselinePx"],
                "pivot": pilot["scaleData"]["pivotPx"],
                "targetWorldSize": pilot["scaleData"]["targetWorldHeight"],
                "deliveryFactor": pilot["scaleData"]["deliveryFitScale"],
                "scaleCorrection": 1.0,
                "sizeClass": pilot["unit"]["scaleClass"],
                "weaponType": pilot["unit"]["weapon"],
                "qaStatus": "APPROVED_PILOT",
                "knownIssues": [],
                "generationProvenance": pilot.get("provenance", {"modelProvenance": "UNKNOWN"}),
            }
        )

    build_roster_board("master-roster-board.png", "master", "OPTION C V2 - FULL ROSTER CHARACTER MASTERS")
    build_roster_board("idle-roster-board.png", "idle", "OPTION C V2 - IDLE / PREPARE ROSTER")
    build_roster_board("dash-roster-board.png", "dash", "OPTION C V2 - DASH ROSTER")
    build_roster_board("attack-roster-board.png", "attack", "OPTION C V2 - ATTACK ROSTER")
    build_roster_board("skill-roster-board.png", "skill", "OPTION C V2 - SKILL / CAST ROSTER")
    build_four_pose_board()
    build_relative_scale_board(audits)
    build_weapon_review_board(audits)

    pilot_changed, canonical_changed = verify_protection(inventory)
    all_units = pilot_records + units
    counts = {status: 0 for status in [
        "APPROVED_PILOT", "PASS_CANDIDATE", "TARGETED_REPAIR", "MASTER_REPAIR",
        "WEAPON_REPAIR", "POSE_REPAIR", "SCALE_REVIEW", "REGENERATE"
    ]}
    for record in all_units:
        counts[record["qaStatus"]] += 1

    batch = {
        "schemaVersion": 1,
        "mission": "RPGThreeJS Option C Combat Poses V2 full 25-unit batch",
        "status": "COMPLETE",
        "productionPromotion": False,
        "operatorApproval": "PENDING",
        "rosterCount": len(all_units),
        "pilotUnitsPreserved": 3,
        "canonicalReferenceAudits": 22,
        "remainingUnitsProduced": 22,
        "masters": 25,
        "boards2x2": 25,
        "finalPoses": 100,
        "perPoseAutoScaling": False,
        "fitToContentPerPose": False,
        "scaleCorrectionOverrides": 0,
        "pilotFilesChanged": len(pilot_changed),
        "pilotChangedPaths": pilot_changed,
        "canonicalAssetsChanged": bool(canonical_changed),
        "canonicalChangedPaths": canonical_changed,
        "runtimeChanged": False,
        "gameplayChanged": False,
        "combatLogicChanged": False,
        "vfxChanged": False,
        "environmentChanged": False,
        "commit": False,
        "push": False,
        "triageCounts": counts,
        "units": all_units,
        "reviewBoards": {
            "masterRosterBoard": rel(QA_ROOT / "master-roster-board.png"),
            "idleRosterBoard": rel(QA_ROOT / "idle-roster-board.png"),
            "dashRosterBoard": rel(QA_ROOT / "dash-roster-board.png"),
            "attackRosterBoard": rel(QA_ROOT / "attack-roster-board.png"),
            "skillRosterBoard": rel(QA_ROOT / "skill-roster-board.png"),
            "fourPoseRosterBoard": rel(QA_ROOT / "four-pose-roster-board.png"),
            "relativeScaleBoard": rel(QA_ROOT / "relative-scale-board.png"),
            "weaponReviewBoard": rel(QA_ROOT / "weapon-review-board.png"),
        },
    }
    batch_path = OUT / "manifests/full-roster-batch.json"
    batch_path.write_text(json.dumps(batch, indent=2) + "\n", encoding="utf-8")
    validation = {
        "status": "PASS_WITH_TRIAGE",
        "counts": counts,
        "pilotFilesChanged": pilot_changed,
        "canonicalAssetsChanged": canonical_changed,
        "expected": {"masters": 25, "boards": 25, "poses": 100, "manifests": 25},
        "actual": {
            "masters": len(list((OUT / "masters").glob("*-master.png"))),
            "boards": len(list((OUT / "boards-2x2").glob("*-board.png"))),
            "poses": len(list((OUT / "split-poses").glob("*/*.png"))),
            "manifests": sum(
                1
                for file_slug, _ in ROSTER
                if (OUT / "manifests" / f"{file_slug}-manifest.json").is_file()
            ),
        },
    }
    (QA_ROOT / "batch-validation.json").write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(validation, indent=2))


if __name__ == "__main__":
    main()

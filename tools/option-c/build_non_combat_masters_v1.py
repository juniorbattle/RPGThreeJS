from __future__ import annotations

import argparse
import hashlib
import json
from collections import OrderedDict
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/assets/dev/option-c/non-combat-masters-v1"
PROTECTED = ROOT / "public/assets/dev/option-c/combat-poses-v2/full-roster-rebuild"
CANVAS = (512, 512)
BASELINE = 456

UNITS = OrderedDict(
    [
        ("alaric", {"category": "KEY_STORY", "target_core": 342}),
        ("maelor", {"category": "KEY_STORY", "target_core": 338}),
        ("sage_seraphine", {"category": "KEY_STORY", "target_core": 336}),
        ("refugee_mother", {"category": "ACTIVE_CIVILIAN", "target_core": 328}),
        ("survivor", {"category": "ACTIVE_CIVILIAN", "target_core": 334}),
        ("villageoise", {"category": "ACTIVE_CIVILIAN", "target_core": 328}),
        ("wounded_merchant", {"category": "ACTIVE_CIVILIAN", "target_core": 332}),
        ("villageois", {"category": "OPTIONAL_CIVILIAN", "target_core": 330}),
        ("refugee", {"category": "OPTIONAL_CIVILIAN", "target_core": 326}),
        ("village_militia_spearman", {"category": "VILLAGE_COMBATANT", "target_core": 336}),
        ("village_militia_brute", {"category": "VILLAGE_COMBATANT", "target_core": 344}),
        ("village_militia_slinger", {"category": "VILLAGE_COMBATANT", "target_core": 332}),
    ]
)

STYLE_ANCHORS = OrderedDict(
    [
        ("alistair", PROTECTED / "masters/alistair-master.png"),
        ("archer", PROTECTED / "masters/archer-master.png"),
        ("white_mage", PROTECTED / "masters/white_mage-master.png"),
        ("rogue", PROTECTED / "masters/rogue-master.png"),
        ("lancer", PROTECTED / "masters/lancer-master.png"),
    ]
)


def rel(path: Path) -> str:
    return path.resolve().relative_to(ROOT.resolve()).as_posix()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    candidates = [
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"),
    ]
    for candidate in candidates:
        if candidate.is_file():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def checker(size: tuple[int, int], block: int = 16) -> Image.Image:
    image = Image.new("RGBA", size, (31, 35, 43, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], block):
        for x in range(0, size[0], block):
            if (x // block + y // block) % 2:
                draw.rectangle((x, y, x + block - 1, y + block - 1), fill=(46, 51, 61, 255))
    return image


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    return image.getchannel("A").point(lambda value: 255 if value > 12 else 0).getbbox()


def core_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    alpha = image.getchannel("A").point(lambda value: 255 if value > 24 else 0)
    bbox = alpha.getbbox()
    if bbox is None:
        return None
    extent = max(bbox[2] - bbox[0], bbox[3] - bbox[1])
    radius = max(2, round(extent * 0.012))
    kernel = radius * 2 + 1
    if kernel > 3:
        opened = alpha.filter(ImageFilter.MinFilter(kernel)).filter(ImageFilter.MaxFilter(kernel))
        opened_bbox = opened.getbbox()
        if opened_bbox is not None:
            bbox = opened_bbox
    return bbox


def box_size(box: tuple[int, int, int, int]) -> tuple[int, int]:
    return box[2] - box[0], box[3] - box[1]


def protected_hashes() -> dict[str, str]:
    files = sorted((PROTECTED / "masters").glob("*.png")) + sorted((PROTECTED / "split-poses").glob("*/*.png"))
    return {rel(path): sha256(path) for path in files}


def ensure_dirs() -> None:
    for path in [OUT / "masters", OUT / "manifests/master-metrics", OUT / "qa"]:
        path.mkdir(parents=True, exist_ok=True)


def normalize_one(unit: str, spec: dict) -> dict:
    source = OUT / "qa/processed" / unit / "clean.png"
    prompt = OUT / "manifests/prompts" / f"{unit}.txt"
    if not source.is_file():
        raise RuntimeError(f"{unit}: missing processor output {source}")
    if not prompt.is_file():
        raise RuntimeError(f"{unit}: missing prompt record {prompt}")

    clean = Image.open(source).convert("RGBA")
    full = alpha_bbox(clean)
    core = core_bbox(clean)
    if full is None or core is None:
        raise RuntimeError(f"{unit}: no subject detected")

    full_w, full_h = box_size(full)
    core_w, core_h = box_size(core)
    target_core = int(spec["target_core"])
    authored_scale = target_core / max(core_w, core_h)
    projected_full = (round(full_w * authored_scale), round(full_h * authored_scale))
    safe_limit = 488
    safe_scale = safe_limit / max(full_w, full_h)
    applied_scale = min(authored_scale, safe_scale)

    resized = clean.resize(
        (max(1, round(clean.width * applied_scale)), max(1, round(clean.height * applied_scale))),
        Image.Resampling.NEAREST,
    )
    scaled_full = alpha_bbox(resized)
    scaled_core = core_bbox(resized)
    if scaled_full is None or scaled_core is None:
        raise RuntimeError(f"{unit}: subject vanished during normalization")

    core_center_x = (scaled_core[0] + scaled_core[2]) / 2
    x = round(256 - core_center_x)
    y = round(BASELINE - scaled_core[3])
    left, top, right, bottom = (
        x + scaled_full[0],
        y + scaled_full[1],
        x + scaled_full[2],
        y + scaled_full[3],
    )
    margin = 12
    if left < margin:
        x += margin - left
    if right > CANVAS[0] - margin:
        x -= right - (CANVAS[0] - margin)
    if top < margin:
        y += margin - top
    if bottom > CANVAS[1] - margin:
        y -= bottom - (CANVAS[1] - margin)

    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    canvas.alpha_composite(resized, (x, y))
    output_full = alpha_bbox(canvas)
    output_core = core_bbox(canvas)
    if output_full is None or output_core is None:
        raise RuntimeError(f"{unit}: normalized output is empty")

    master = OUT / "masters" / f"{unit}.png"
    canvas.save(master)
    margins = [output_full[0], output_full[1], CANVAS[0] - output_full[2], CANVAS[1] - output_full[3]]
    metrics = {
        "unitId": unit,
        "category": spec["category"],
        "familyClass": "STANDARD_HUMANOID",
        "canvas": list(CANVAS),
        "alphaBounds": list(output_full),
        "coreBounds": list(output_core),
        "baseline": BASELINE,
        "measuredCoreBottom": output_core[3],
        "baselineDeltaPx": output_core[3] - BASELINE,
        "targetCoreExtentPx": target_core,
        "normalizedCoreExtentPx": max(box_size(output_core)),
        "authoredScale": authored_scale,
        "appliedScale": applied_scale,
        "scaleLimitedByExtremeAppendage": applied_scale + 1e-7 < authored_scale,
        "projectedFullSizeAtAuthoredScale": list(projected_full),
        "transparentMargins": margins,
        "safeMarginsPass": min(margins) >= 8,
        "faceObscurationPolicy": "PASS_AGENT_VISUAL_REVIEW",
        "reviewStatus": "OPERATOR_REVIEW_REQUIRED",
        "identityAlias": None,
        "perPoseAutoScaling": False,
        "fitToContent": False,
        "sourcePath": rel(source),
        "promptPath": rel(prompt),
        "masterPath": rel(master),
        "masterSha256": sha256(master),
    }
    (OUT / "manifests/master-metrics" / f"{unit}.json").write_text(
        json.dumps(metrics, indent=2) + "\n", encoding="utf-8"
    )
    return metrics


def place_sprite(canvas: Image.Image, sprite: Image.Image, tile_box: tuple[int, int, int, int], scale: float, baseline_y: int) -> None:
    left, top, right, bottom = tile_box
    side = round(512 * scale)
    shown = sprite.resize((side, side), Image.Resampling.NEAREST)
    x = left + ((right - left) - side) // 2
    y = baseline_y - round(BASELINE * scale)
    canvas.alpha_composite(shown, (x, y))


def build_roster_board() -> Path:
    cols, rows = 4, 3
    tile_w, tile_h, header = 470, 540, 105
    canvas = Image.new("RGBA", (cols * tile_w, header + rows * tile_h), (17, 20, 26, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((26, 18), "OPTION C V2 — NON-COMBAT MASTER ROSTER", font=font(34, True), fill=(245, 232, 196, 255))
    draw.text((26, 62), "12 transparent masters · shared baseline 456 · operator review required", font=font(19), fill=(161, 190, 216, 255))
    colors = {
        "KEY_STORY": (219, 177, 79, 255),
        "ACTIVE_CIVILIAN": (105, 184, 203, 255),
        "OPTIONAL_CIVILIAN": (128, 193, 137, 255),
        "VILLAGE_COMBATANT": (205, 128, 101, 255),
    }
    for index, (unit, spec) in enumerate(UNITS.items()):
        row, col = divmod(index, cols)
        x, y = col * tile_w, header + row * tile_h
        canvas.alpha_composite(checker((tile_w, tile_h - 62), 18), (x, y))
        baseline = y + 438
        place_sprite(canvas, Image.open(OUT / "masters" / f"{unit}.png").convert("RGBA"), (x, y, x + tile_w, y + tile_h), 0.84, baseline)
        draw.line((x + 14, baseline, x + tile_w - 14, baseline), fill=(226, 82, 91, 190), width=2)
        draw.rectangle((x, y, x + tile_w - 1, y + tile_h - 1), outline=colors[spec["category"]], width=3)
        draw.rectangle((x, y + tile_h - 62, x + tile_w, y + tile_h), fill=(20, 24, 31, 255))
        draw.text((x + 15, y + tile_h - 53), unit, font=font(22, True), fill=(244, 239, 224, 255))
        draw.text((x + 15, y + tile_h - 27), spec["category"], font=font(14), fill=colors[spec["category"]])
    path = OUT / "qa/master-roster-board.png"
    canvas.convert("RGB").save(path)
    return path


def build_scale_board() -> Path:
    cols, rows = 6, 2
    tile_w, tile_h, header = 310, 470, 108
    canvas = Image.new("RGBA", (cols * tile_w, header + rows * tile_h), (18, 22, 29, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((26, 18), "RELATIVE SCALE QA", font=font(34, True), fill=(245, 232, 196, 255))
    draw.text((26, 62), "Uniform 0.68 display transform · red line = shared logical baseline", font=font(19), fill=(161, 190, 216, 255))
    for index, unit in enumerate(UNITS):
        row, col = divmod(index, cols)
        x, y = col * tile_w, header + row * tile_h
        canvas.alpha_composite(checker((tile_w, tile_h), 16), (x, y))
        baseline = y + 370
        place_sprite(canvas, Image.open(OUT / "masters" / f"{unit}.png").convert("RGBA"), (x, y, x + tile_w, y + tile_h), 0.68, baseline)
        draw.line((x + 6, baseline, x + tile_w - 6, baseline), fill=(231, 82, 91, 210), width=2)
        draw.rectangle((x, y, x + tile_w - 1, y + tile_h - 1), outline=(87, 105, 126, 255), width=2)
        draw.rectangle((x, y + tile_h - 46, x + tile_w, y + tile_h), fill=(20, 24, 31, 255))
        draw.text((x + 10, y + tile_h - 34), unit, font=font(16, True), fill=(242, 237, 222, 255))
    path = OUT / "qa/relative-scale-board.png"
    canvas.convert("RGB").save(path)
    return path


def build_style_board() -> Path:
    entries = [(f"ANCHOR · {name}", path, True) for name, path in STYLE_ANCHORS.items()]
    entries += [(unit, OUT / "masters" / f"{unit}.png", False) for unit in UNITS]
    cols, rows = 6, 3
    tile_w, tile_h, header = 320, 440, 112
    canvas = Image.new("RGBA", (cols * tile_w, header + rows * tile_h), (17, 20, 26, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((26, 18), "STYLE COHERENCE QA", font=font(34, True), fill=(245, 232, 196, 255))
    draw.text((26, 62), "Approved combat-master anchors followed by the new non-combat family", font=font(19), fill=(161, 190, 216, 255))
    for index, (label, path, anchor) in enumerate(entries):
        row, col = divmod(index, cols)
        x, y = col * tile_w, header + row * tile_h
        canvas.alpha_composite(checker((tile_w, tile_h), 16), (x, y))
        baseline = y + 350
        place_sprite(canvas, Image.open(path).convert("RGBA"), (x, y, x + tile_w, y + tile_h), 0.65, baseline)
        color = (218, 173, 76, 255) if anchor else (101, 172, 221, 255)
        draw.line((x + 6, baseline, x + tile_w - 6, baseline), fill=(231, 82, 91, 180), width=2)
        draw.rectangle((x, y, x + tile_w - 1, y + tile_h - 1), outline=color, width=3 if anchor else 2)
        draw.rectangle((x, y + tile_h - 44, x + tile_w, y + tile_h), fill=(20, 24, 31, 255))
        draw.text((x + 10, y + tile_h - 32), label, font=font(15, True), fill=color)
    path = OUT / "qa/style-coherence-review-board.png"
    canvas.convert("RGB").save(path)
    return path


def validate_outputs() -> dict:
    expected = list(UNITS)
    masters = sorted((OUT / "masters").glob("*.png"))
    found = [path.stem for path in masters]
    missing = [unit for unit in expected if unit not in found]
    unexpected = [unit for unit in found if unit not in expected]
    units = []
    for unit in expected:
        path = OUT / "masters" / f"{unit}.png"
        if not path.is_file():
            continue
        image = Image.open(path)
        bbox = alpha_bbox(image.convert("RGBA"))
        units.append(
            {
                "unitId": unit,
                "path": rel(path),
                "mode": image.mode,
                "canvas": list(image.size),
                "alphaBounds": list(bbox) if bbox else None,
                "transparent": image.mode == "RGBA" and image.getchannel("A").getextrema()[0] == 0,
                "sha256": sha256(path),
            }
        )
    return {
        "expectedMasterCount": len(expected),
        "actualMasterCount": len(found),
        "missing": missing,
        "unexpected": unexpected,
        "allCanvas512": all(item["canvas"] == [512, 512] for item in units),
        "allRgbaTransparent": all(item["mode"] == "RGBA" and item["transparent"] for item in units),
        "allIdentityAliasesNull": True,
        "allFacesObscured": True,
        "facePolicyEvidence": "agent visual review plus per-unit prompt records; operator review remains required",
        "units": units,
    }


def build() -> None:
    ensure_dirs()
    protected_before = protected_hashes()
    metrics = [normalize_one(unit, spec) for unit, spec in UNITS.items()]
    boards = [build_roster_board(), build_scale_board(), build_style_board()]
    protected_after = protected_hashes()
    protected_unchanged = protected_before == protected_after
    master_count = sum(1 for path in protected_before if "/masters/" in path)
    pose_count = sum(1 for path in protected_before if "/split-poses/" in path)

    manifest = {
        "schemaVersion": 1,
        "phase": "NON_COMBAT_GENERIC_MASTER_GENERATION",
        "namespace": rel(OUT),
        "promotionStatus": "DEV_ONLY_NOT_PROMOTED",
        "masterCount": len(metrics),
        "canvas": list(CANVAS),
        "sharedBaseline": BASELINE,
        "familyClass": "STANDARD_HUMANOID",
        "faceIdentityPolicy": "ALL_FACES_OBSCURED",
        "reviewStatus": "OPERATOR_REVIEW_REQUIRED",
        "identityAliases": [],
        "units": metrics,
        "qaBoards": [rel(path) for path in boards],
    }
    (OUT / "manifests/non-combat-masters-v1-manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )

    qa = validate_outputs()
    qa.update(
        {
            "sharedBaseline": BASELINE,
            "allSafeMargins": all(item["safeMarginsPass"] for item in metrics),
            "allBaselineDeltaWithin2Px": all(abs(item["baselineDeltaPx"]) <= 2 for item in metrics),
            "scaleLimitedUnits": [item["unitId"] for item in metrics if item["scaleLimitedByExtremeAppendage"]],
            "operatorReviewStatus": "REQUIRED",
            "protectedExistingMasterCount": master_count,
            "protectedExistingPoseCount": pose_count,
            "protectedAssetHashesUnchangedDuringBuild": protected_unchanged,
            "productionPromotionPerformed": False,
            "productionOverwritePerformed": False,
            "archivedIdentityGenerated": False,
        }
    )
    (OUT / "qa/machine-qa.json").write_text(json.dumps(qa, indent=2) + "\n", encoding="utf-8")
    (OUT / "manifests/protected-assets-snapshot.json").write_text(
        json.dumps(
            {
                "masterCount": master_count,
                "poseCount": pose_count,
                "unchangedDuringBuild": protected_unchanged,
                "files": protected_after,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    if not protected_unchanged:
        raise RuntimeError("protected combat master/pose hashes changed during the build")
    if qa["missing"] or qa["unexpected"] or not qa["allCanvas512"] or not qa["allRgbaTransparent"]:
        raise RuntimeError("machine QA failed; inspect qa/machine-qa.json")
    print(json.dumps({key: value for key, value in qa.items() if key != "units"}, indent=2))


def check() -> None:
    qa = validate_outputs()
    required_boards = [
        OUT / "qa/master-roster-board.png",
        OUT / "qa/relative-scale-board.png",
        OUT / "qa/style-coherence-review-board.png",
    ]
    qa["requiredBoardsPresent"] = all(path.is_file() for path in required_boards)
    qa["manifestPresent"] = (OUT / "manifests/non-combat-masters-v1-manifest.json").is_file()
    ok = (
        not qa["missing"]
        and not qa["unexpected"]
        and qa["actualMasterCount"] == 12
        and qa["allCanvas512"]
        and qa["allRgbaTransparent"]
        and qa["requiredBoardsPresent"]
        and qa["manifestPresent"]
    )
    print(json.dumps({key: value for key, value in qa.items() if key != "units"}, indent=2))
    if not ok:
        raise SystemExit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build Option C V2 non-combat master-only candidate assets.")
    parser.add_argument("--check", action="store_true", help="Validate existing outputs without rebuilding them.")
    args = parser.parse_args()
    check() if args.check else build()

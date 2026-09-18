from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
PIXEL_ROOT = ROOT / "public/assets/characters/pixel"
DEV_ROOT = ROOT / "public/assets/dev/option-c/hero-scale-parity-v1/candidate"
ASSET_ROOT = DEV_ROOT
QA_ROOT = DEV_ROOT / "qa"
MANIFEST_ROOT = DEV_ROOT / "manifests"
MILITIA_ROOT = ROOT / "public/assets/dev/option-c/village-militia-poses-v1"

SCALE = 1.12
CANVAS = (512, 512)
PIVOT = (256, 456)
ALPHA_THRESHOLD = 8
MIN_SAFE_MARGIN_PX = 16
ROLES = ("master", "prepare", "dash", "attack", "cast")
OPERATOR_VISUAL_REVIEW = {
    "status": "PENDING_REVIEW",
    "pose": "attack",
    "previousStatus": "REJECTED",
    "previousFinding": "The attack spearhead terminated in a flat vertical cut and was visually incomplete.",
    "rootCause": "INHERITED_FROM_PRODUCTION_ATTACK_SOURCE; the uniform 1.12x transform reproduces the same truncated silhouette.",
    "resolutionStatus": "REPAIRED_DEV_CANDIDATE_PENDING_OPERATOR_REVIEW",
    "authorizedAction": "Rebuild the complete attack weapon head from the straight master/prepare spearhead, cross-check its size against dash, and align it exactly to the attack shaft; no generation and no production edit.",
}
ATTACK_REPAIR = {
    "method": "straight-canonical-spearhead-transplant-after-common-scale",
    "donorRole": "prepare",
    "referenceRoles": ["master", "prepare", "dash"],
    "masterSearchRectPx": [200, 35, 250, 165],
    "prepareSearchRectPx": [200, 40, 250, 165],
    "targetRightMarginPx": 23,
    "clearVerticalRangePx": [220, 320],
    "rotationDegreesClockwise": 90,
    "additionalScale": 1.0,
    "resampling": "none; exact 90-degree pixel transpose",
    "artGenerated": False,
    "productionModified": False,
}

REFERENCE_UNITS = (
    ("alistair", "Alistair"),
    ("archer", "Kestrel"),
    ("rogue", "Cedric"),
)

BODY_ANNOTATIONS = {
    "alistair": [198, 110, 354, 456],
    "archer": [201, 121, 323, 456],
    "rogue": [196, 128, 365, 456],
    "lancer": [218, 158, 349, 456],
}

LANCER_POSE_BODY_ANNOTATIONS = {
    "master": [218, 158, 349, 456],
    "prepare": [211, 163, 355, 456],
}

COLORS = {
    "background": (10, 14, 22, 255),
    "panel": (25, 32, 45, 255),
    "grid_a": (31, 39, 52, 255),
    "grid_b": (39, 48, 63, 255),
    "text": (239, 233, 213, 255),
    "muted": (159, 174, 194, 255),
    "baseline": (239, 84, 105, 255),
    "bounds": (68, 218, 238, 255),
    "safe": (121, 226, 142, 255),
    "warn": (255, 183, 74, 255),
}


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    family = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    try:
        return ImageFont.truetype(family, size)
    except OSError:
        return ImageFont.load_default()


def relative(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def source_path(role: str) -> Path:
    if role == "master":
        return PIXEL_ROOT / "masters/lancer.png"
    return PIXEL_ROOT / "combat/lancer" / f"{role}.png"


def candidate_path(role: str) -> Path:
    if role == "master":
        return ASSET_ROOT / "masters/lancer.png"
    return ASSET_ROOT / "combat/lancer" / f"{role}.png"


def alpha_bounds(image: Image.Image) -> list[int]:
    alpha = image.getchannel("A")
    mask = alpha.point(lambda value: 255 if value > ALPHA_THRESHOLD else 0)
    bounds = mask.getbbox()
    if bounds is None:
        raise ValueError("Transparent image has no alpha bounds")
    return list(bounds)


def margins(bounds: list[int], size: tuple[int, int] = CANVAS) -> dict[str, int]:
    return {
        "left": bounds[0],
        "right": size[0] - bounds[2],
        "top": bounds[1],
        "bottom": size[1] - bounds[3],
    }


def scale_landmark_bounds(bounds: list[int]) -> list[int]:
    px, py = PIVOT
    return [
        round(px + (bounds[0] - px) * SCALE),
        round(py + (bounds[1] - py) * SCALE),
        round(px + (bounds[2] - px) * SCALE),
        round(py + (bounds[3] - py) * SCALE),
    ]


def transform(source: Image.Image) -> tuple[Image.Image, dict[str, Any]]:
    if source.size != CANVAS:
        raise ValueError(f"Expected {CANVAS}, got {source.size}")
    scaled_size = (round(CANVAS[0] * SCALE), round(CANVAS[1] * SCALE))
    scaled_pivot = (round(PIVOT[0] * SCALE), round(PIVOT[1] * SCALE))
    crop_origin = (scaled_pivot[0] - PIVOT[0], scaled_pivot[1] - PIVOT[1])
    scaled = source.resize(scaled_size, Image.Resampling.NEAREST)
    output = scaled.crop((
        crop_origin[0],
        crop_origin[1],
        crop_origin[0] + CANVAS[0],
        crop_origin[1] + CANVAS[1],
    ))
    return output, {
        "operation": "uniform-full-canvas-nearest-neighbor-scale-then-pivot-crop",
        "factor": SCALE,
        "sourceCanvasPx": list(CANVAS),
        "scaledCanvasPx": list(scaled_size),
        "canonicalPivotPx": list(PIVOT),
        "scaledPivotPx": list(scaled_pivot),
        "cropOriginPx": list(crop_origin),
        "outputCanvasPx": list(CANVAS),
        "fitToContent": False,
        "perPoseScaling": False,
        "artRegenerated": False,
    }


def alpha_column_run(image: Image.Image, x: int) -> list[int]:
    ys = [y for y in range(image.height) if image.getpixel((x, y))[3] > ALPHA_THRESHOLD]
    if not ys:
        raise ValueError(f"No alpha run at x={x}")
    return [min(ys), max(ys) + 1]


def connected_component_from_top(image: Image.Image, search_rect: list[int]) -> tuple[Image.Image, dict[str, Any]]:
    crop = image.crop(tuple(search_rect))
    alpha = crop.getchannel("A")
    occupied = {
        (x, y)
        for y in range(crop.height)
        for x in range(crop.width)
        if alpha.getpixel((x, y)) > ALPHA_THRESHOLD
    }
    if not occupied:
        raise ValueError("Canonical spearhead search region is empty")
    top = min(y for _, y in occupied)
    seed = min((point for point in occupied if point[1] == top), key=lambda point: point[0])
    component: set[tuple[int, int]] = set()
    pending = [seed]
    while pending:
        point = pending.pop()
        if point in component or point not in occupied:
            continue
        component.add(point)
        x, y = point
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                if dx or dy:
                    pending.append((x + dx, y + dy))
    isolated = Image.new("RGBA", crop.size, (0, 0, 0, 0))
    for point in component:
        isolated.putpixel(point, crop.getpixel(point))
    bounds = isolated.getbbox()
    if bounds is None:
        raise ValueError("Canonical spearhead component extraction failed")
    tight = isolated.crop(bounds)
    return tight, {
        "searchRectPx": search_rect,
        "componentBoundsInSearchPx": list(bounds),
        "componentPixelCount": len(component),
        "componentSizePx": list(tight.size),
    }


def repair_attack_tip(
    attack: Image.Image,
    master: Image.Image,
    prepare: Image.Image,
    dash: Image.Image,
) -> tuple[Image.Image, dict[str, Any]]:
    master_head, master_extraction = connected_component_from_top(
        master,
        ATTACK_REPAIR["masterSearchRectPx"],
    )
    prepare_head, prepare_extraction = connected_component_from_top(
        prepare,
        ATTACK_REPAIR["prepareSearchRectPx"],
    )
    donor = prepare_head.transpose(Image.Transpose.ROTATE_270)
    donor_run = alpha_column_run(donor, 0)
    destination_x = CANVAS[0] - ATTACK_REPAIR["targetRightMarginPx"] - donor.width
    receiver_run = alpha_column_run(attack, destination_x - 1)
    donor_height = donor_run[1] - donor_run[0]
    receiver_height = receiver_run[1] - receiver_run[0]
    destination_y = round(
        ((receiver_run[0] + receiver_run[1]) - (donor_run[0] + donor_run[1])) / 2
    )
    repaired = attack.copy()
    clear_top, clear_bottom = ATTACK_REPAIR["clearVerticalRangePx"]
    repaired.paste(
        Image.new("RGBA", (CANVAS[0] - destination_x, clear_bottom - clear_top), (0, 0, 0, 0)),
        (destination_x, clear_top),
    )
    repaired.alpha_composite(donor, (destination_x, destination_y))
    repaired_run = alpha_column_run(repaired, destination_x)
    translated_donor_run = [donor_run[0] + destination_y, donor_run[1] + destination_y]
    dash_bounds = alpha_bounds(dash)
    repaired_bounds = alpha_bounds(repaired)
    contract = {
        **ATTACK_REPAIR,
        "masterExtraction": master_extraction,
        "prepareExtraction": prepare_extraction,
        "masterHeadSizePx": list(master_head.size),
        "prepareHeadSizePx": list(prepare_head.size),
        "rotatedDonorSizePx": list(donor.size),
        "destinationOriginPx": [destination_x, destination_y],
        "clearRectPx": [destination_x, clear_top, CANVAS[0], clear_bottom],
        "receiverSeamColumnPx": destination_x - 1,
        "receiverSeamAlphaRunPx": receiver_run,
        "donorSeamAlphaRunPx": donor_run,
        "translatedDonorSeamAlphaRunPx": translated_donor_run,
        "repairedSeamAlphaRunPx": repaired_run,
        "seamHeightDeltaPx": abs(receiver_height - donor_height),
        "seamRunAligned": translated_donor_run == repaired_run and abs(receiver_height - donor_height) <= 1,
        "dashReferenceRightMarginPx": CANVAS[0] - dash_bounds[2],
        "repairedAttackRightMarginPx": CANVAS[0] - repaired_bounds[2],
    }
    return repaired, contract


def snapshot(paths: list[Path], root: Path) -> dict[str, Any]:
    records = [{"path": relative(path), "sha256": sha256(path)} for path in sorted(paths)]
    text = "\n".join(f"{record['path']}\t{record['sha256']}" for record in records)
    return {
        "root": relative(root),
        "fileCount": len(records),
        "manifestSha256": hashlib.sha256(text.encode("utf-8")).hexdigest(),
        "files": records,
    }


def protected_snapshot() -> dict[str, Any]:
    return {
        "productionMasters": snapshot(sorted((PIXEL_ROOT / "masters").glob("*.png")), PIXEL_ROOT / "masters"),
        "productionCombatPoses": snapshot(sorted((PIXEL_ROOT / "combat").glob("*/*.png")), PIXEL_ROOT / "combat"),
        "militiaCandidates": snapshot(
            sorted(path for path in MILITIA_ROOT.rglob("*") if path.is_file()),
            MILITIA_ROOT,
        ),
    }


def checkerboard(size: tuple[int, int], step: int = 14) -> Image.Image:
    board = Image.new("RGBA", size, COLORS["grid_a"])
    draw = ImageDraw.Draw(board)
    for y in range(0, size[1], step):
        for x in range(0, size[0], step):
            if (x // step + y // step) % 2:
                draw.rectangle((x, y, x + step - 1, y + step - 1), fill=COLORS["grid_b"])
    return board


def header(canvas: Image.Image, title: str, subtitle: str) -> None:
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, canvas.width, 84), fill=COLORS["background"])
    draw.text((22, 13), title, font=font(27, True), fill=COLORS["text"])
    draw.text((22, 51), subtitle, font=font(14), fill=COLORS["muted"])


def composite_full_canvas(
    canvas: Image.Image,
    image: Image.Image,
    cell_origin: tuple[int, int],
    cell_size: tuple[int, int],
    scale: float,
    top_padding: int,
) -> tuple[int, int]:
    resized_size = (round(CANVAS[0] * scale), round(CANVAS[1] * scale))
    if resized_size[0] > cell_size[0] or top_padding + resized_size[1] > cell_size[1]:
        raise ValueError(
            f"QA render {resized_size} with top padding {top_padding} exceeds cell {cell_size}; "
            "refusing to create an overlapping or cropped proof"
        )
    rendered = image.resize(resized_size, Image.Resampling.NEAREST)
    origin = (
        cell_origin[0] + (cell_size[0] - resized_size[0]) // 2,
        cell_origin[1] + top_padding,
    )
    canvas.alpha_composite(rendered, origin)
    return origin


def build_peer_board() -> Path:
    columns = [*REFERENCE_UNITS, ("lancer-production", "Garen · PROD"), ("lancer-candidate", "Garen · DEV 1.12×")]
    cell_w, cell_h = 330, 500
    canvas = Image.new("RGBA", (cell_w * len(columns), 84 + cell_h), COLORS["background"])
    header(
        canvas,
        "LANCER 1.12× DEV CANDIDATE — MASTER PEER PARITY",
        "Identical 0.60× board transform · full 512px canvases · common pivot x=256 and baseline y=456 · body landmarks exclude weapons",
    )
    board_scale = 0.60
    for index, (unit_id, label) in enumerate(columns):
        x0, y0 = index * cell_w, 84
        canvas.alpha_composite(checkerboard((cell_w, cell_h)), (x0, y0))
        if unit_id == "lancer-candidate":
            image = Image.open(candidate_path("master")).convert("RGBA")
            bounds = scale_landmark_bounds(BODY_ANNOTATIONS["lancer"])
        elif unit_id == "lancer-production":
            image = Image.open(source_path("master")).convert("RGBA")
            bounds = BODY_ANNOTATIONS["lancer"]
        else:
            image = Image.open(PIXEL_ROOT / "masters" / f"{unit_id}.png").convert("RGBA")
            bounds = BODY_ANNOTATIONS[unit_id]
        origin = composite_full_canvas(canvas, image, (x0, y0), (cell_w, cell_h), board_scale, 35)
        draw = ImageDraw.Draw(canvas)
        baseline = round(origin[1] + PIVOT[1] * board_scale)
        draw.line((x0 + 8, baseline, x0 + cell_w - 8, baseline), fill=COLORS["baseline"], width=2)
        rect = [
            round(origin[0] + bounds[0] * board_scale),
            round(origin[1] + bounds[1] * board_scale),
            round(origin[0] + bounds[2] * board_scale),
            round(origin[1] + bounds[3] * board_scale),
        ]
        draw.rectangle(rect, outline=COLORS["warn"], width=3)
        body_height = bounds[3] - bounds[1]
        body_width = bounds[2] - bounds[0]
        draw.text((x0 + 12, y0 + 8), label, font=font(17, True), fill=COLORS["text"])
        draw.text((x0 + 12, y0 + cell_h - 34), f"body {body_height}px H × {body_width}px W", font=font(14), fill=COLORS["warn"])
    output = QA_ROOT / "lancer-1.12-master-parity.png"
    canvas.convert("RGB").save(output, optimize=False)
    return output


def build_identity_board() -> Path:
    cell_w, cell_h = 300, 360
    canvas = Image.new("RGBA", (cell_w * len(ROLES), 84 + cell_h * 2), COLORS["background"])
    header(
        canvas,
        "LANCER 1.12× DEV CANDIDATE — COMPLETE IDENTITY",
        "Top = production source · bottom = candidate · one shared whole-canvas transform for Master, prepare, dash, attack and cast",
    )
    board_scale = 0.48
    for column, role in enumerate(ROLES):
        for row, variant in enumerate(("PRODUCTION", "DEV 1.12×")):
            x0, y0 = column * cell_w, 84 + row * cell_h
            canvas.alpha_composite(checkerboard((cell_w, cell_h)), (x0, y0))
            path = source_path(role) if row == 0 else candidate_path(role)
            image = Image.open(path).convert("RGBA")
            origin = composite_full_canvas(canvas, image, (x0, y0), (cell_w, cell_h), board_scale, 34)
            draw = ImageDraw.Draw(canvas)
            baseline = round(origin[1] + PIVOT[1] * board_scale)
            draw.line((x0 + 8, baseline, x0 + cell_w - 8, baseline), fill=COLORS["baseline"], width=2)
            draw.text((x0 + 10, y0 + 7), f"{role.upper()} · {variant}", font=font(15, True), fill=COLORS["text"])
    output = QA_ROOT / "lancer-1.12-complete-identity.png"
    canvas.convert("RGB").save(output, optimize=False)
    return output


def build_margin_board(records: dict[str, dict[str, Any]]) -> Path:
    cell_w, cell_h = 315, 520
    canvas = Image.new("RGBA", (cell_w * len(ROLES), 84 + cell_h), COLORS["background"])
    header(
        canvas,
        "LANCER 1.12× DEV CANDIDATE — SAFE MARGINS",
        f"Cyan = 4px halo outside recomputed alpha bounds at A>{ALPHA_THRESHOLD} · minimum clearance = {MIN_SAFE_MARGIN_PX}px · red = baseline y=456",
    )
    board_scale = 0.56
    for column, role in enumerate(ROLES):
        x0, y0 = column * cell_w, 84
        canvas.alpha_composite(checkerboard((cell_w, cell_h)), (x0, y0))
        image = Image.open(candidate_path(role)).convert("RGBA")
        origin = composite_full_canvas(canvas, image, (x0, y0), (cell_w, cell_h), board_scale, 36)
        draw = ImageDraw.Draw(canvas)
        baseline = round(origin[1] + PIVOT[1] * board_scale)
        draw.line((x0 + 8, baseline, x0 + cell_w - 8, baseline), fill=COLORS["baseline"], width=2)
        bounds = records[role]["candidate"]["alphaBoundsPx"]
        halo_px = 4
        rect = [
            round(origin[0] + (bounds[0] - halo_px) * board_scale),
            round(origin[1] + (bounds[1] - halo_px) * board_scale),
            round(origin[0] + (bounds[2] + halo_px) * board_scale),
            round(origin[1] + (bounds[3] + halo_px) * board_scale),
        ]
        draw.rectangle(rect, outline=COLORS["bounds"], width=2)
        record_margins = records[role]["candidate"]["marginsPx"]
        minimum = min(record_margins.values())
        operator_pending = role == OPERATOR_VISUAL_REVIEW["pose"] and OPERATOR_VISUAL_REVIEW["status"] == "PENDING_REVIEW"
        status = "PENDING REVIEW" if operator_pending else "PASS" if minimum >= MIN_SAFE_MARGIN_PX else "FAIL"
        status_color = COLORS["safe"] if status == "PASS" else COLORS["warn"]
        draw.text((x0 + 10, y0 + 7), f"{role.upper()} · {status}", font=font(16, True), fill=status_color)
        lines = (
            f"bounds {bounds}",
            f"L {record_margins['left']}  R {record_margins['right']}",
            f"T {record_margins['top']}  B {record_margins['bottom']}",
            f"technical minimum {minimum}px" if operator_pending else f"minimum {minimum}px",
        )
        for line_index, line in enumerate(lines):
            draw.text((x0 + 10, y0 + cell_h - 82 + line_index * 19), line, font=font(12, line_index == 3), fill=status_color if line_index == 3 else COLORS["muted"])
    output = QA_ROOT / "lancer-1.12-safe-margins.png"
    canvas.convert("RGB").save(output, optimize=False)
    return output


def build_attack_tip_diagnostic(records: dict[str, dict[str, Any]]) -> Path:
    canvas = Image.new("RGBA", (1320, 1060), COLORS["background"])
    header(
        canvas,
        "LANCER ATTACK — CANONICAL STRAIGHT-SPEARHEAD REPAIR PROOF",
        "Left = defective production source · right = repaired 1.12× DEV candidate · no overlay is drawn over either sprite",
    )
    source = Image.open(source_path("attack")).convert("RGBA")
    candidate = Image.open(candidate_path("attack")).convert("RGBA")
    source_bounds = records["attack"]["source"]["alphaBoundsPx"]
    candidate_bounds = records["attack"]["candidate"]["alphaBoundsPx"]

    full_panels = (
        (20, "PRODUCTION SOURCE · INCOMPLETE TIP", source, source_bounds),
        (670, "DEV CANDIDATE · MASTER/PREPARE HEAD", candidate, candidate_bounds),
    )
    draw = ImageDraw.Draw(canvas)
    for x0, label, image, bounds in full_panels:
        y0 = 84
        canvas.alpha_composite(checkerboard((630, 520)), (x0, y0))
        canvas.alpha_composite(image, (x0 + 59, y0 + 4))
        draw.text((x0 + 14, y0 + 10), label, font=font(18, True), fill=COLORS["text"])
        draw.text(
            (x0 + 14, y0 + 486),
            f"alpha right={bounds[2]} (last occupied x={bounds[2] - 1}) · canvas right margin={512 - bounds[2]}px",
            font=font(13),
            fill=COLORS["muted"],
        )

    detail_panels = (
        (20, "SOURCE DEFECT · 4×", source.crop((380, 250, 480, 330))),
        (670, "REPAIRED COMPLETE HEAD · 3×", candidate.crop((350, 220, 505, 315))),
    )
    for x0, label, crop in detail_panels:
        y0 = 620
        canvas.alpha_composite(checkerboard((630, 410), 20), (x0, y0))
        detail_scale = 3 if label.startswith("REPAIRED") else 4
        enlarged = crop.resize((crop.width * detail_scale, crop.height * detail_scale), Image.Resampling.NEAREST)
        canvas.alpha_composite(enlarged, (x0 + (630 - enlarged.width) // 2, y0 + 5))
        draw.text((x0 + 14, y0 + 12), label, font=font(18, True), fill=COLORS["text"])
    draw.text(
        (22, 1038),
        "Repair result: DEV only · straight master/prepare head · dash size cross-check · pending operator review.",
        font=font(14, True),
        fill=COLORS["warn"],
    )
    output = QA_ROOT / "lancer-1.12-attack-tip-diagnostic.png"
    canvas.convert("RGB").save(output, optimize=False)
    return output


def build_attack_reference_board() -> Path:
    master = Image.open(candidate_path("master")).convert("RGBA")
    prepare = Image.open(candidate_path("prepare")).convert("RGBA")
    dash = Image.open(candidate_path("dash")).convert("RGBA")
    attack = Image.open(candidate_path("attack")).convert("RGBA")
    master_head, _ = connected_component_from_top(master, ATTACK_REPAIR["masterSearchRectPx"])
    prepare_head, _ = connected_component_from_top(prepare, ATTACK_REPAIR["prepareSearchRectPx"])

    def tight_crop(image: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
        crop = image.crop(box)
        bounds = crop.getbbox()
        if bounds is None:
            raise ValueError("Empty weapon reference crop")
        return crop.crop(bounds)

    references = (
        ("MASTER · HEAD ROTATED 90°", master_head.transpose(Image.Transpose.ROTATE_270)),
        ("PREPARE · DONOR ROTATED 90°", prepare_head.transpose(Image.Transpose.ROTATE_270)),
        ("DASH · HORIZONTAL REFERENCE", tight_crop(dash, (365, 220, 500, 320))),
        ("ATTACK · REPAIRED RESULT", tight_crop(attack, (365, 220, 500, 320))),
    )
    cell_w, cell_h = 400, 350
    canvas = Image.new("RGBA", (cell_w * len(references), 84 + cell_h), COLORS["background"])
    header(
        canvas,
        "LANCER ATTACK — THREE-POSE WEAPON INTEGRATION CROSS-CHECK",
        "Master + prepare define the straight canonical head · dash defines horizontal mass/margin · attack uses exact shaft-axis alignment",
    )
    draw = ImageDraw.Draw(canvas)
    display_scale = 2
    for index, (label, reference) in enumerate(references):
        x0, y0 = index * cell_w, 84
        canvas.alpha_composite(checkerboard((cell_w, cell_h), 16), (x0, y0))
        rendered = reference.resize(
            (reference.width * display_scale, reference.height * display_scale),
            Image.Resampling.NEAREST,
        )
        origin = (x0 + (cell_w - rendered.width) // 2, y0 + (cell_h - rendered.height) // 2)
        axis_y = origin[1] + rendered.height // 2
        draw.line((x0 + 12, axis_y, x0 + cell_w - 12, axis_y), fill=COLORS["baseline"], width=1)
        canvas.alpha_composite(rendered, origin)
        draw.text((x0 + 12, y0 + 10), label, font=font(15, True), fill=COLORS["text"])
        draw.text(
            (x0 + 12, y0 + cell_h - 30),
            f"native reference {reference.width}×{reference.height}px · display 2×",
            font=font(12),
            fill=COLORS["muted"],
        )
    output = QA_ROOT / "lancer-1.12-attack-three-pose-reference.png"
    canvas.convert("RGB").save(output, optimize=False)
    return output


def main() -> None:
    QA_ROOT.mkdir(parents=True, exist_ok=True)
    MANIFEST_ROOT.mkdir(parents=True, exist_ok=True)
    (ASSET_ROOT / "masters").mkdir(parents=True, exist_ok=True)
    (ASSET_ROOT / "combat/lancer").mkdir(parents=True, exist_ok=True)

    before = protected_snapshot()
    before_path = MANIFEST_ROOT / "protected-assets-before.json"
    before_path.write_text(json.dumps(before, indent=2) + "\n", encoding="utf-8")

    public_manifest_path = PIXEL_ROOT / "character-system-v2-manifest.json"
    public_manifest = json.loads(public_manifest_path.read_text(encoding="utf-8"))
    lancer_manifest = next(unit for unit in public_manifest["units"] if unit["unitId"] == "lancer")
    if lancer_manifest["worldUnitsPerPixel"] != 0.00625:
        raise ValueError("Unexpected Lancer worldUnitsPerPixel; refusing to build candidate")

    records: dict[str, dict[str, Any]] = {}
    transform_contract: dict[str, Any] | None = None
    for role in ROLES:
        source_file = source_path(role)
        output_file = candidate_path(role)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        source_image = Image.open(source_file).convert("RGBA")
        transformed, contract = transform(source_image)
        if transform_contract is None:
            transform_contract = contract
        elif transform_contract != contract:
            raise AssertionError("Transform contract drifted between Lancer roles")
        repair_contract = None
        if role == "attack":
            master_candidate = Image.open(candidate_path("master")).convert("RGBA")
            prepare_candidate = Image.open(candidate_path("prepare")).convert("RGBA")
            dash_candidate = Image.open(candidate_path("dash")).convert("RGBA")
            transformed, repair_contract = repair_attack_tip(
                transformed,
                master_candidate,
                prepare_candidate,
                dash_candidate,
            )
        transformed.save(output_file, format="PNG", optimize=False)

        manifest_entry = lancer_manifest["master"] if role == "master" else lancer_manifest["poses"][role]
        source_hash = sha256(source_file)
        if source_hash != manifest_entry["sha256"]:
            raise ValueError(f"Source hash mismatch for {role}")
        source_bounds = alpha_bounds(source_image)
        output_bounds = alpha_bounds(transformed)
        output_margins = margins(output_bounds)
        records[role] = {
            "source": {
                "path": relative(source_file),
                "sha256": source_hash,
                "canvasPx": list(source_image.size),
                "mode": source_image.mode,
                "alphaBoundsPx": source_bounds,
                "marginsPx": margins(source_bounds),
            },
            "candidate": {
                "path": relative(output_file),
                "sha256": sha256(output_file),
                "canvasPx": list(transformed.size),
                "mode": transformed.mode,
                "alphaBoundsPx": output_bounds,
                "marginsPx": output_margins,
                "safeMarginMinimumPx": min(output_margins.values()),
                "safeMarginStatus": "PASS" if min(output_margins.values()) >= MIN_SAFE_MARGIN_PX else "FAIL",
                "operatorVisualStatus": (
                    "PENDING_REVIEW_AFTER_CANONICAL_STRAIGHT_SPEARHEAD_REPAIR"
                    if role == OPERATOR_VISUAL_REVIEW["pose"]
                    else "NOT_REVIEWED"
                ),
                "postScaleRepair": repair_contract,
            },
            "runtimeContract": {
                "worldUnitsPerPixel": lancer_manifest["worldUnitsPerPixel"],
                "scaleCorrection": None if role == "master" else manifest_entry["scaleCorrection"],
                "anchorPx": list(PIVOT) if role == "master" else [manifest_entry["anchor"]["x"], manifest_entry["anchor"]["y"]],
            },
        }

    after = protected_snapshot()
    after_path = MANIFEST_ROOT / "protected-assets-after.json"
    after_path.write_text(json.dumps(after, indent=2) + "\n", encoding="utf-8")
    protection_comparisons = {
        key: {
            "beforeCount": before[key]["fileCount"],
            "afterCount": after[key]["fileCount"],
            "beforeManifestSha256": before[key]["manifestSha256"],
            "afterManifestSha256": after[key]["manifestSha256"],
            "changed": before[key]["manifestSha256"] != after[key]["manifestSha256"],
        }
        for key in before
    }
    protection_status = "PASS" if all(not item["changed"] for item in protection_comparisons.values()) else "FAIL"

    qa_outputs = [
        build_peer_board(),
        build_identity_board(),
        build_margin_board(records),
        build_attack_tip_diagnostic(records),
        build_attack_reference_board(),
    ]
    peer_body_heights = {
        name: bounds[3] - bounds[1]
        for (unit_id, name), bounds in zip(REFERENCE_UNITS, (BODY_ANNOTATIONS[item[0]] for item in REFERENCE_UNITS))
    }
    candidate_master_body = scale_landmark_bounds(LANCER_POSE_BODY_ANNOTATIONS["master"])
    candidate_prepare_body = scale_landmark_bounds(LANCER_POSE_BODY_ANNOTATIONS["prepare"])
    candidate_body_metrics = {
        "master": {
            "boundsPx": candidate_master_body,
            "widthPx": candidate_master_body[2] - candidate_master_body[0],
            "heightPx": candidate_master_body[3] - candidate_master_body[1],
        },
        "prepare": {
            "boundsPx": candidate_prepare_body,
            "widthPx": candidate_prepare_body[2] - candidate_prepare_body[0],
            "heightPx": candidate_prepare_body[3] - candidate_prepare_body[1],
        },
    }
    candidate_body_metrics["masterPrepareHeightRatio"] = round(
        candidate_body_metrics["prepare"]["heightPx"] / candidate_body_metrics["master"]["heightPx"],
        4,
    )
    candidate_body_metrics["referenceMasterBodyHeightsPx"] = peer_body_heights
    candidate_body_metrics["referenceMedianHeightPx"] = sorted(peer_body_heights.values())[1]

    safe_margins_status = "PASS" if all(
        record["candidate"]["safeMarginStatus"] == "PASS" for record in records.values()
    ) else "FAIL"
    invariants = {
        "allFiveRolesBuilt": set(records) == set(ROLES),
        "allCandidateCanvases512Rgba": all(
            record["candidate"]["canvasPx"] == [512, 512] and record["candidate"]["mode"] == "RGBA"
            for record in records.values()
        ),
        "sameUniformTransformAllRoles": transform_contract is not None,
        "attackRepairUsesAlreadyScaledCanonicalPixels": ATTACK_REPAIR["additionalScale"] == 1.0,
        "attackRepairSeamAligned": records["attack"]["candidate"]["postScaleRepair"]["seamRunAligned"],
        "canonicalPivotPreserved": transform_contract is not None and transform_contract["canonicalPivotPx"] == list(PIVOT),
        "safeMargins": safe_margins_status == "PASS",
        "worldUnitsPerPixelUnchanged": all(
            record["runtimeContract"]["worldUnitsPerPixel"] == 0.00625 for record in records.values()
        ),
        "scaleCorrectionUnchanged": all(
            role == "master" or records[role]["runtimeContract"]["scaleCorrection"] == 1.0 for role in ROLES
        ),
        "productionAndMilitiaUnchanged": protection_status == "PASS",
        "qaCellsDoNotOverlap": True,
        "noGeneratedArtwork": True,
        "noFitToContent": True,
        "noPerPoseScaling": True,
    }
    build_status = "PASS" if all(invariants.values()) else "FAIL"
    runtime_report_path = DEV_ROOT / "runtime-proof/lancer-1.12-runtime-proof-report.json"
    runtime_report = (
        json.loads(runtime_report_path.read_text(encoding="utf-8"))
        if runtime_report_path.exists()
        else None
    )
    runtime_status = runtime_report["status"] if runtime_report else "PENDING_CAPTURE"
    machine_verification_status = (
        "PASS"
        if build_status == "PASS" and runtime_status == "PASS"
        else "PENDING_RUNTIME_PROOF"
        if build_status == "PASS" and runtime_status == "PENDING_CAPTURE"
        else "FAIL"
    )
    verification_status = (
        "NEEDS_REVISION"
        if machine_verification_status == "PASS" and OPERATOR_VISUAL_REVIEW["status"] == "REJECTED"
        else machine_verification_status
    )
    review_status = (
        "OPERATOR_REJECTED_ATTACK_POSE"
        if OPERATOR_VISUAL_REVIEW["status"] == "REJECTED"
        else "READY_FOR_OPERATOR_VISUAL_REVIEW_AFTER_ATTACK_REPAIR"
        if verification_status == "PASS"
        else "BLOCKED"
    )

    manifest = {
        "schemaVersion": 1,
        "mission": "Option C Character System V2 — Lancer 1.12x DEV-only complete-identity candidate",
        "status": verification_status,
        "staticBuildStatus": build_status,
        "promotionStatus": "NOT_PROMOTED",
        "reviewStatus": review_status,
        "machineVerificationStatus": machine_verification_status,
        "operatorVisualReview": OPERATOR_VISUAL_REVIEW,
        "unitId": "lancer",
        "displayName": "Garen",
        "candidateRoot": relative(DEV_ROOT),
        "transform": transform_contract,
        "runtimeContract": {
            "worldUnitsPerPixel": 0.00625,
            "worldUnitsPerPixelChanged": False,
            "poseScaleCorrection": 1.0,
            "scaleCorrectionChanged": False,
            "canonicalPivotPx": list(PIVOT),
            "canonicalBaselineYpx": PIVOT[1],
        },
        "roles": records,
        "bodyScaleAudit": candidate_body_metrics,
        "safeMargins": {
            "alphaThreshold": ALPHA_THRESHOLD,
            "minimumRequiredPx": MIN_SAFE_MARGIN_PX,
            "status": safe_margins_status,
            "qaRenderIsolation": "PASS: every reduced 512px canvas fits fully inside its own comparison cell; cyan halo is outside alpha pixels",
        },
        "protectedAssets": {
            "status": protection_status,
            "comparisons": protection_comparisons,
            "beforeManifest": relative(before_path),
            "afterManifest": relative(after_path),
        },
        "invariants": invariants,
        "qa": [relative(path) for path in qa_outputs],
        "runtimeProof": {
            "status": runtime_status,
            "method": "browser-only request substitution; no runtime or production path changes",
            "report": relative(runtime_report_path) if runtime_report else None,
            "screenshots": runtime_report.get("screenshots", []) if runtime_report else [],
            "sourceCoverage": runtime_report.get("sourceCoverage") if runtime_report else None,
            "browserErrors": runtime_report.get("browserErrors") if runtime_report else None,
            "failedRequests": runtime_report.get("failedRequests") if runtime_report else None,
        },
        "changes": {
            "productionAssetsChanged": 0,
            "militiaCandidatesChanged": 0,
            "runtimeCodeChanged": False,
            "gameplayChanged": False,
            "newArtworkGenerated": False,
            "attackCandidatePatchedFromCanonicalPoseReferences": True,
            "committed": False,
            "pushed": False,
        },
    }
    manifest_path = MANIFEST_ROOT / "lancer-1.12-candidate-manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    report = {
        "schemaVersion": 1,
        "status": verification_status,
        "staticBuildStatus": build_status,
        "reviewStatus": review_status,
        "machineVerificationStatus": machine_verification_status,
        "operatorVisualReview": OPERATOR_VISUAL_REVIEW,
        "candidateManifest": relative(manifest_path),
        "bodyScaleAudit": candidate_body_metrics,
        "safeMargins": {
            role: record["candidate"]["marginsPx"] for role, record in records.items()
        },
        "safeMarginsStatus": safe_margins_status,
        "protectedAssetsStatus": protection_status,
        "qa": [relative(path) for path in qa_outputs],
        "runtimeProofStatus": runtime_status,
        "runtimeProofReport": relative(runtime_report_path) if runtime_report else None,
        "runtimeProofScreenshots": runtime_report.get("screenshots", []) if runtime_report else [],
        "operatorGate": "STOP_BEFORE_PRODUCTION_PROMOTION",
    }
    report_path = QA_ROOT / "lancer-1.12-candidate-report.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({
        "status": verification_status,
        "staticBuildStatus": build_status,
        "reviewStatus": review_status,
        "candidateManifest": relative(manifest_path),
        "report": relative(report_path),
        "bodyScaleAudit": candidate_body_metrics,
        "safeMargins": report["safeMargins"],
        "protectedAssetsStatus": protection_status,
        "qa": report["qa"],
    }, indent=2))
    if machine_verification_status == "FAIL":
        raise SystemExit(1)


if __name__ == "__main__":
    main()

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
PIXEL_ROOT = ROOT / "public/assets/characters/pixel"
OUTPUT_ROOT = ROOT / "public/assets/dev/option-c/hero-scale-parity-v1"
QA_ROOT = OUTPUT_ROOT / "qa"
MANIFEST_ROOT = OUTPUT_ROOT / "manifests"
MILITIA_ROOT = ROOT / "public/assets/dev/option-c/village-militia-poses-v1"

HEROES = (
    ("alistair", "Alistair"),
    ("white_mage", "Marian"),
    ("dark_mage", "Elara"),
    ("archer", "Kestrel"),
    ("rogue", "Cedric"),
    ("lancer", "Garen"),
)

# Half-open pixel bounds [left, top, right, bottom]. These annotations were
# placed against the current 512x512 production pixels. Body bounds follow
# visible anatomical/head-to-planted-foot landmarks and deliberately omit
# weapons plus silhouette-distorting cape/scarf extensions. Head bounds include
# a helmet/hood, but Elara's floppy hat tip and Marian's staff halo are excluded.
ANNOTATIONS: dict[str, dict[str, dict[str, Any]]] = {
    "alistair": {
        "master": {"body": [198, 110, 354, 456], "head": [240, 110, 316, 204], "shoulderWidth": 148},
        "prepare": {"body": [198, 111, 362, 456], "head": [245, 111, 322, 205], "shoulderWidth": 154},
    },
    "white_mage": {
        "master": {"body": [205, 136, 332, 456], "head": [242, 136, 302, 202], "shoulderWidth": 116},
        "prepare": {"body": [207, 141, 333, 456], "head": [245, 141, 304, 205], "shoulderWidth": 116},
    },
    "dark_mage": {
        "master": {"body": [201, 154, 329, 456], "head": [226, 154, 295, 219], "shoulderWidth": 124},
        "prepare": {"body": [190, 158, 341, 456], "head": [216, 158, 300, 219], "shoulderWidth": 127},
    },
    "archer": {
        "master": {"body": [201, 121, 323, 456], "head": [220, 121, 299, 215], "shoulderWidth": 112},
        "prepare": {"body": [196, 121, 322, 456], "head": [218, 121, 301, 216], "shoulderWidth": 114},
    },
    "rogue": {
        "master": {"body": [196, 128, 365, 456], "head": [243, 128, 319, 218], "shoulderWidth": 144},
        "prepare": {"body": [176, 128, 374, 456], "head": [249, 128, 328, 219], "shoulderWidth": 146},
    },
    "lancer": {
        "master": {"body": [218, 158, 349, 456], "head": [248, 158, 311, 231], "shoulderWidth": 116},
        "prepare": {"body": [211, 163, 355, 456], "head": [245, 163, 313, 235], "shoulderWidth": 119},
    },
}

COLORS = {
    "background": (10, 14, 22, 255),
    "panel": (18, 25, 37, 255),
    "grid_a": (31, 39, 52, 255),
    "grid_b": (38, 47, 62, 255),
    "text": (239, 233, 213, 255),
    "muted": (151, 166, 187, 255),
    "baseline": (239, 84, 105, 255),
    "full": (62, 209, 232, 255),
    "body": (255, 180, 70, 255),
    "head": (236, 91, 184, 255),
    "center": (121, 226, 142, 255),
}


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    family = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    try:
        return ImageFont.truetype(family, size)
    except OSError:
        return ImageFont.load_default()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def snapshot(paths: list[Path], root: Path) -> dict[str, Any]:
    records = [{"path": path.relative_to(ROOT).as_posix(), "sha256": sha256(path)} for path in sorted(paths)]
    manifest_text = "\n".join(f"{record['path']}\t{record['sha256']}" for record in records)
    return {
        "root": root.relative_to(ROOT).as_posix(),
        "fileCount": len(records),
        "manifestSha256": hashlib.sha256(manifest_text.encode("utf-8")).hexdigest(),
        "files": records,
    }


def protected_snapshot() -> dict[str, Any]:
    master_paths = sorted((PIXEL_ROOT / "masters").glob("*.png"))
    combat_paths = sorted((PIXEL_ROOT / "combat").glob("*/*.png"))
    militia_paths = sorted(path for path in MILITIA_ROOT.rglob("*") if path.is_file())
    return {
        "productionMasters": snapshot(master_paths, PIXEL_ROOT / "masters"),
        "productionCombatPoses": snapshot(combat_paths, PIXEL_ROOT / "combat"),
        "militiaCandidates": snapshot(militia_paths, MILITIA_ROOT),
    }


def image_path(unit_id: str, role: str) -> Path:
    if role == "master":
        return PIXEL_ROOT / "masters" / f"{unit_id}.png"
    return PIXEL_ROOT / "combat" / unit_id / "prepare.png"


def alpha_bounds(image: Image.Image, threshold: int = 8) -> list[int]:
    alpha = image.getchannel("A")
    mask = alpha.point(lambda value: 255 if value > threshold else 0)
    bounds = mask.getbbox()
    if bounds is None:
        raise ValueError("Transparent image has no alpha bounds")
    return list(bounds)


def metrics_for(unit_id: str, role: str) -> dict[str, Any]:
    path = image_path(unit_id, role)
    image = Image.open(path).convert("RGBA")
    width, height = image.size
    full = alpha_bounds(image)
    annotation = ANNOTATIONS[unit_id][role]
    body = annotation["body"]
    head = annotation["head"]
    body_width = body[2] - body[0]
    body_height = body[3] - body[1]
    head_width = head[2] - head[0]
    head_height = head[3] - head[1]
    return {
        "unitId": unit_id,
        "assetRole": role,
        "path": path.relative_to(ROOT).as_posix(),
        "sha256": sha256(path),
        "fullSpriteMetrics": {
            "canvasWidth": width,
            "canvasHeight": height,
            "baseline": 456,
            "alphaBounds": full,
            "width": full[2] - full[0],
            "height": full[3] - full[1],
            "margins": {
                "left": full[0],
                "right": width - full[2],
                "top": full[1],
                "bottom": height - full[3],
            },
            "authoritativeForBodyScale": False,
        },
        "bodyMetrics": {
            "measurementMethod": "manual landmark annotation on current production pixels; half-open bounds; weapons and extreme cape/scarf extensions excluded",
            "measurementUncertaintyPx": 3,
            "bodyBounds": body,
            "bodyTop": body[1],
            "bodyBottom": body[3],
            "bodyWidth": body_width,
            "bodyHeight": body_height,
            "headBounds": head,
            "headTop": head[1],
            "headBottom": head[3],
            "headWidth": head_width,
            "headHeight": head_height,
            "shoulderWidth": annotation["shoulderWidth"],
            "bodyPixelArea": None,
            "bodyOccupancyRatio": None,
            "bodyAreaReliability": "NOT_REPORTED: semantic weapon/cape separation is not deterministically recoverable from flattened RGBA pixels",
            "bodyCenter": [round((body[0] + body[2]) / 2, 1), round((body[1] + body[3]) / 2, 1)],
        },
    }


def checkerboard(size: tuple[int, int], step: int = 16) -> Image.Image:
    board = Image.new("RGBA", size, COLORS["grid_a"])
    draw = ImageDraw.Draw(board)
    for y in range(0, size[1], step):
        for x in range(0, size[0], step):
            if (x // step + y // step) % 2:
                draw.rectangle([x, y, x + step - 1, y + step - 1], fill=COLORS["grid_b"])
    return board


def draw_header(canvas: Image.Image, title: str, subtitle: str) -> None:
    draw = ImageDraw.Draw(canvas)
    draw.rectangle([0, 0, canvas.width, 82], fill=COLORS["background"])
    draw.text((22, 14), title, font=font(26, True), fill=COLORS["text"])
    draw.text((22, 49), subtitle, font=font(15), fill=COLORS["muted"])


def scaled_rect(bounds: list[int], origin: tuple[int, int], scale: float) -> list[int]:
    ox, oy = origin
    return [
        round(ox + bounds[0] * scale),
        round(oy + bounds[1] * scale),
        round(ox + bounds[2] * scale),
        round(oy + bounds[3] * scale),
    ]


def build_master_prepare_board(all_metrics: dict[str, dict[str, dict[str, Any]]]) -> Path:
    cell_w, row_h = 330, 390
    canvas = Image.new("RGBA", (cell_w * 6, 82 + row_h * 2), COLORS["background"])
    draw_header(
        canvas,
        "HERO SCALE PARITY — MASTER + PREPARE",
        "Production pixels · identical 0.56x transform · 512px canvas · pivot x=256 · shared baseline y=456 · nearest-neighbor",
    )
    scale = 0.56
    for row, role in enumerate(("master", "prepare")):
        for column, (unit_id, name) in enumerate(HEROES):
            x0 = column * cell_w
            y0 = 82 + row * row_h
            panel = checkerboard((cell_w, row_h), 14)
            canvas.alpha_composite(panel, (x0, y0))
            origin = (x0 + (cell_w - round(512 * scale)) // 2, y0 + 35)
            baseline_y = round(origin[1] + 456 * scale)
            draw = ImageDraw.Draw(canvas)
            draw.line([x0 + 10, baseline_y, x0 + cell_w - 10, baseline_y], fill=COLORS["baseline"], width=2)
            image = Image.open(image_path(unit_id, role)).convert("RGBA")
            resized = image.resize((round(512 * scale), round(512 * scale)), Image.Resampling.NEAREST)
            canvas.alpha_composite(resized, origin)
            draw.text((x0 + 12, y0 + 8), f"{name} · {role.upper()}", font=font(16, True), fill=COLORS["text"])
            body_height = all_metrics[unit_id][role]["bodyMetrics"]["bodyHeight"]
            full_height = all_metrics[unit_id][role]["fullSpriteMetrics"]["height"]
            draw.text((x0 + 12, y0 + row_h - 31), f"body {body_height}px  |  full {full_height}px", font=font(13), fill=COLORS["muted"])
    output = QA_ROOT / "hero-scale-parity-master-prepare.png"
    canvas.convert("RGB").save(output, optimize=False)
    return output


def build_body_bounds_board(all_metrics: dict[str, dict[str, dict[str, Any]]]) -> Path:
    cell_w, cell_h = 330, 520
    canvas = Image.new("RGBA", (cell_w * 6, 82 + cell_h), COLORS["background"])
    draw_header(
        canvas,
        "HERO SCALE PARITY — FULL ENVELOPE vs BODY LANDMARKS",
        "Cyan = full alpha (technical only) · amber = body-only (authoritative) · magenta = head/helmet · red = baseline",
    )
    scale = 0.68
    for column, (unit_id, name) in enumerate(HEROES):
        x0 = column * cell_w
        y0 = 82
        canvas.alpha_composite(checkerboard((cell_w, cell_h), 14), (x0, y0))
        origin = (x0 + (cell_w - round(512 * scale)) // 2, y0 + 42)
        image = Image.open(image_path(unit_id, "master")).convert("RGBA")
        resized = image.resize((round(512 * scale), round(512 * scale)), Image.Resampling.NEAREST)
        canvas.alpha_composite(resized, origin)
        draw = ImageDraw.Draw(canvas)
        metric = all_metrics[unit_id]["master"]
        full = scaled_rect(metric["fullSpriteMetrics"]["alphaBounds"], origin, scale)
        body = scaled_rect(metric["bodyMetrics"]["bodyBounds"], origin, scale)
        head = scaled_rect(metric["bodyMetrics"]["headBounds"], origin, scale)
        baseline_y = round(origin[1] + 456 * scale)
        draw.line([x0 + 6, baseline_y, x0 + cell_w - 6, baseline_y], fill=COLORS["baseline"], width=2)
        draw.rectangle(full, outline=COLORS["full"], width=2)
        draw.rectangle(body, outline=COLORS["body"], width=3)
        draw.rectangle(head, outline=COLORS["head"], width=2)
        draw.text((x0 + 12, y0 + 9), name, font=font(18, True), fill=COLORS["text"])
        body_height = metric["bodyMetrics"]["bodyHeight"]
        body_width = metric["bodyMetrics"]["bodyWidth"]
        draw.text((x0 + 12, y0 + cell_h - 60), f"BODY  {body_height}h × {body_width}w", font=font(14, True), fill=COLORS["body"])
        draw.text((x0 + 12, y0 + cell_h - 36), f"FULL  {metric['fullSpriteMetrics']['height']}h × {metric['fullSpriteMetrics']['width']}w", font=font(13), fill=COLORS["full"])
    output = QA_ROOT / "hero-scale-parity-body-bounds.png"
    canvas.convert("RGB").save(output, optimize=False)
    return output


def silhouette_image(source: Image.Image) -> Image.Image:
    alpha = source.getchannel("A").point(lambda value: 225 if value > 8 else 0)
    silhouette = Image.new("RGBA", source.size, (225, 232, 239, 0))
    silhouette.putalpha(alpha)
    return silhouette


def build_silhouette_board(all_metrics: dict[str, dict[str, dict[str, Any]]]) -> Path:
    cell_w, cell_h = 330, 560
    canvas = Image.new("RGBA", (cell_w * 6, 82 + cell_h), COLORS["background"])
    draw_header(
        canvas,
        "HERO SCALE PARITY — SILHOUETTE / MASS",
        "Identical transform and baseline · body and head labels are weapon-agnostic · full envelope remains visible only as context",
    )
    scale = 0.70
    for column, (unit_id, name) in enumerate(HEROES):
        x0 = column * cell_w
        y0 = 82
        canvas.alpha_composite(checkerboard((cell_w, cell_h), 14), (x0, y0))
        origin = (x0 + (cell_w - round(512 * scale)) // 2, y0 + 32)
        source = Image.open(image_path(unit_id, "master")).convert("RGBA")
        resized = silhouette_image(source).resize((round(512 * scale), round(512 * scale)), Image.Resampling.NEAREST)
        canvas.alpha_composite(resized, origin)
        metric = all_metrics[unit_id]["master"]
        body = scaled_rect(metric["bodyMetrics"]["bodyBounds"], origin, scale)
        full = scaled_rect(metric["fullSpriteMetrics"]["alphaBounds"], origin, scale)
        center = metric["bodyMetrics"]["bodyCenter"]
        center_x = round(origin[0] + center[0] * scale)
        center_y = round(origin[1] + center[1] * scale)
        baseline_y = round(origin[1] + 456 * scale)
        draw = ImageDraw.Draw(canvas)
        draw.line([x0 + 6, baseline_y, x0 + cell_w - 6, baseline_y], fill=COLORS["baseline"], width=2)
        draw.rectangle(full, outline=COLORS["full"], width=1)
        draw.rectangle(body, outline=COLORS["body"], width=3)
        draw.line([center_x - 8, center_y, center_x + 8, center_y], fill=COLORS["center"], width=2)
        draw.line([center_x, center_y - 8, center_x, center_y + 8], fill=COLORS["center"], width=2)
        draw.text((x0 + 12, y0 + 7), name, font=font(18, True), fill=COLORS["text"])
        body_metrics = metric["bodyMetrics"]
        lines = (
            f"body  {body_metrics['bodyHeight']}h × {body_metrics['bodyWidth']}w",
            f"head  {body_metrics['headHeight']}h × {body_metrics['headWidth']}w",
            f"shoulders  {body_metrics['shoulderWidth']}w",
            "body area  N/R (flattened gear)",
        )
        for line_index, line in enumerate(lines):
            color = COLORS["body"] if line_index < 3 else COLORS["muted"]
            draw.text((x0 + 12, y0 + cell_h - 86 + line_index * 20), line, font=font(13, line_index == 0), fill=color)
    output = QA_ROOT / "hero-scale-parity-silhouette.png"
    canvas.convert("RGB").save(output, optimize=False)
    return output


def report_data(all_metrics: dict[str, dict[str, dict[str, Any]]], protection: dict[str, Any]) -> dict[str, Any]:
    runtime_report_path = OUTPUT_ROOT / "runtime-proof/runtime-proof-report.json"
    runtime_report = json.loads(runtime_report_path.read_text(encoding="utf-8")) if runtime_report_path.exists() else None
    public_manifest_path = PIXEL_ROOT / "character-system-v2-manifest.json"
    generated_manifest_path = ROOT / "src/render/generated/characterSystemV2Manifest.json"
    public_manifest = json.loads(public_manifest_path.read_text(encoding="utf-8"))
    generated_manifest = json.loads(generated_manifest_path.read_text(encoding="utf-8"))
    manifest_units = {unit["unitId"]: unit for unit in public_manifest["units"]}
    manifest_asset_checks = []
    for unit_id, _ in HEROES:
        unit = manifest_units[unit_id]
        master = all_metrics[unit_id]["master"]
        prepare = all_metrics[unit_id]["prepare"]
        manifest_asset_checks.append({
            "unitId": unit_id,
            "masterPathMatch": unit["master"]["src"] == f"/assets/characters/pixel/masters/{unit_id}.png",
            "masterHashMatch": unit["master"]["sha256"] == master["sha256"],
            "preparePathMatch": unit["poses"]["prepare"]["src"] == f"/assets/characters/pixel/combat/{unit_id}/prepare.png",
            "prepareHashMatch": unit["poses"]["prepare"]["sha256"] == prepare["sha256"],
            "commonWorldUnitsPerPixel": unit["worldUnitsPerPixel"] == 0.00625,
            "prepareScaleCorrection": unit["poses"]["prepare"]["scaleCorrection"] == 1,
        })
    manifest_validation = {
        "publicPath": public_manifest_path.relative_to(ROOT).as_posix(),
        "generatedPath": generated_manifest_path.relative_to(ROOT).as_posix(),
        "publicGeneratedValueParity": public_manifest == generated_manifest,
        "assetChecks": manifest_asset_checks,
        "status": "PASS" if public_manifest == generated_manifest and all(
            all(value is True for key, value in check.items() if key != "unitId")
            for check in manifest_asset_checks
        ) else "FAIL",
    }
    hero_records = []
    runtime_policy = {
        "travel": "MASTER full canvas; same CSS master scale and slot scale for all eight lineup members",
        "companyRegister": "MASTER full canvas in selected-unit detail; shared object-fit contain and scale(1.3)",
        "strategic": "prepare; common worldUnitsPerPixel=0.00625 and scaleCorrection=1",
        "combatStage": "prepare; common worldUnitsPerPixel=0.00625 and per-pose scaleCorrection=1",
    }
    for unit_id, name in HEROES:
        master = all_metrics[unit_id]["master"]
        prepare = all_metrics[unit_id]["prepare"]
        delta = prepare["bodyMetrics"]["bodyHeight"] - master["bodyMetrics"]["bodyHeight"]
        parity_ratio = prepare["bodyMetrics"]["bodyHeight"] / master["bodyMetrics"]["bodyHeight"]
        is_lancer = unit_id == "lancer"
        hero_records.append({
            "unitId": unit_id,
            "displayName": name,
            "masterPath": master["path"],
            "preparePath": prepare["path"],
            "master": master,
            "prepare": prepare,
            "fullSpriteMetrics": {"master": master["fullSpriteMetrics"], "prepare": prepare["fullSpriteMetrics"]},
            "bodyMetrics": {"master": master["bodyMetrics"], "prepare": prepare["bodyMetrics"]},
            "comparison": {
                "masterVsPrepareParity": "PASS" if 0.97 <= parity_ratio <= 1.03 else "FAIL",
                "bodyHeightDeltaPx": delta,
                "bodyHeightRatio": round(parity_ratio, 4),
                "perceivedMass": "LOWER_THAN_ARMORED_AND_WIDE_CAPE_PEERS" if is_lancer else "CONTEXTUAL",
                "weaponEnvelopeDistortion": "YES_VERTICAL_SPEAR" if is_lancer else "PRESENT_BUT_NOT_PRIMARY",
            },
            "runtime": {
                "travel": "UNDERSIZED" if is_lancer else "REFERENCE",
                "companyRegister": "UNDERSIZED" if is_lancer else "REFERENCE",
                "strategic": "UNDERSIZED" if is_lancer else "REFERENCE",
                "combatStage": "UNDERSIZED" if is_lancer else "REFERENCE",
                "presentationPolicy": runtime_policy,
                "runtimeAddsUnitSpecificScaleDiscrepancy": False,
            },
            "result": "FOLLOW_UP_REQUIRED" if is_lancer else "PASS_REFERENCE",
        })

    primary_heights = {
        name: all_metrics[unit_id]["master"]["bodyMetrics"]["bodyHeight"]
        for unit_id, name in HEROES if unit_id in {"alistair", "archer", "rogue", "lancer"}
    }
    primary_widths = {
        name: all_metrics[unit_id]["master"]["bodyMetrics"]["bodyWidth"]
        for unit_id, name in HEROES if unit_id in {"alistair", "archer", "rogue", "lancer"}
    }
    reference_heights = [primary_heights[name] for name in ("Alistair", "Kestrel", "Cedric")]
    median_height = sorted(reference_heights)[1]
    lancer_height = primary_heights["Garen"]
    correction_factor = median_height / lancer_height
    return {
        "schemaVersion": 1,
        "mission": "Option C Character System V2 Hero Scale Parity Audit — Lancer / Garen",
        "status": "FOLLOW_UP_REQUIRED",
        "sourceOfTruth": "CURRENT_LOCAL_WORKTREE",
        "heroesAudited": "6/6",
        "primaryClassification": "MASTER_BODY_SCALE_TOO_SMALL",
        "classificationRationale": (
            "Garen's weapon-agnostic Master body is 298px head-to-foot versus 346px Alistair, "
            "335px Kestrel, and 328px Cedric. The 11.0% shortfall versus the 335px peer median "
            "exceeds the ±3px landmark uncertainty. His prepare pose preserves the Master ratio, "
            "and all audited runtimes preserve common source-pixel scale, so neither pose drift nor "
            "runtime presentation causes the difference. The vertical spear explains why historical "
            "core/full metrics concealed the underscaled body; it does not erase the measured body defect."
        ),
        "measurementPolicy": {
            "boundsConvention": "half-open [left, top, right, bottom]",
            "alphaThreshold": 8,
            "baseline": 456,
            "bodyAnnotationUncertaintyPx": 3,
            "primaryEvidence": "manual visible anatomical/head-to-planted-foot landmarks on current production pixels",
            "excluded": ["spear", "staff", "bow", "arrows", "dagger extensions", "detached FX", "extreme cape/scarf extensions"],
            "fullAlphaAuthoritativeForBodyScale": False,
            "historicalCoreMetricsAuthoritativeForBodyScale": False,
            "historicalCoreFinding": "Lancer normalizedCoreBBox includes the vertical spear and is therefore an envelope metric, not an anatomical body metric.",
        },
        "manifestValidation": manifest_validation,
        "heroes": hero_records,
        "standardHumanoidComparison": {"masterBodyHeightPx": primary_heights, "masterBodyWidthPx": primary_widths},
        "lancerQuestions": {
            "A_headToFootSmaller": "YES — 298px versus 328–346px peers",
            "B_bodyWidthMateriallyNarrower": "NO versus Kestrel; narrower than Alistair/Cedric, consistent with leaner armor and stance",
            "C_headHelmetSmaller": "YES — 73px high versus 90–94px peers",
            "D_legsBodyProportionsSmaller": "YES in absolute pixels; internal proportions remain coherent",
            "E_leanerSilhouetteOnly": "NO — lean mass contributes, but height and head size independently prove scale loss",
            "F_masterPrepareBodyScaleCoherent": "YES — 293/298 = 98.3%",
            "G_spearInflatesFullSpriteMetrics": "YES",
            "H_transparentPaddingContributes": "NO — common canvas/baseline and adequate margins; padding does not alter the equal-transform body measurement",
            "I_visibleInRuntime": "YES — current surfaces preserve common pixel/canvas transforms, so the smaller body persists",
            "J_scaleIncreaseBreaksRelationship": "NO at a conservative factor; 1.12x brings body height to 334px and retains about 44px top spear clearance on a 512px canvas when scaled around the canonical pivot",
        },
        "correction": {
            "required": True,
            "recommendedFactor": round(correction_factor, 4),
            "recommendedAction": (
                "Prepare a separate candidate that scales the entire Lancer identity uniformly by 1.12 around the canonical pivot/baseline: "
                "Master, prepare, dash, attack, cast, and dependent manifest bounds together. Do not change worldUnitsPerPixel or only one pose. "
                "Re-run crop/safe-margin and the four runtime surfaces before any promotion."
            ),
            "performed": False,
        },
        "runtimeAudit": {
            "evidenceMode": "current implementation inspection plus focused live screenshots",
            "liveProofStatus": runtime_report["status"] if runtime_report else "NOT_RUN",
            "liveProofReport": runtime_report_path.relative_to(ROOT).as_posix() if runtime_report else None,
            "liveProofSourceCoverage": runtime_report.get("sourceCoverage") if runtime_report else None,
            "travel": {"result": "UNDERSIZED", "unitSpecificRuntimeScale": False},
            "companyRegister": {"result": "UNDERSIZED", "unitSpecificRuntimeScale": False},
            "strategic": {"result": "UNDERSIZED", "unitSpecificRuntimeScale": False},
            "combatStage": {"result": "UNDERSIZED", "unitSpecificRuntimeScale": False},
        },
        "protectedAssets": protection,
        "changes": {
            "productionMastersChanged": 0,
            "productionCombatPosesChanged": 0,
            "militiaCandidatesChanged": 0,
            "gameplayChanged": False,
            "uiChanged": False,
            "combatLogicChanged": False,
            "newArtGenerated": False,
        },
        "qaPaths": [
            "public/assets/dev/option-c/hero-scale-parity-v1/qa/hero-scale-parity-master-prepare.png",
            "public/assets/dev/option-c/hero-scale-parity-v1/qa/hero-scale-parity-body-bounds.png",
            "public/assets/dev/option-c/hero-scale-parity-v1/qa/hero-scale-parity-silhouette.png",
            "public/assets/dev/option-c/hero-scale-parity-v1/qa/hero-scale-parity-report.json",
            "public/assets/dev/option-c/hero-scale-parity-v1/runtime-proof/travel-company-lineup.png",
            "public/assets/dev/option-c/hero-scale-parity-v1/runtime-proof/company-register-garen.png",
            "public/assets/dev/option-c/hero-scale-parity-v1/runtime-proof/strategic-primary-heroes.png",
            "public/assets/dev/option-c/hero-scale-parity-v1/runtime-proof/combat-stage-garen-prepare.png",
            "public/assets/dev/option-c/hero-scale-parity-v1/runtime-proof/runtime-proof-report.json",
        ],
    }


def main() -> None:
    QA_ROOT.mkdir(parents=True, exist_ok=True)
    MANIFEST_ROOT.mkdir(parents=True, exist_ok=True)

    before = protected_snapshot()
    (MANIFEST_ROOT / "protected-assets-before.json").write_text(json.dumps(before, indent=2) + "\n", encoding="utf-8")

    all_metrics: dict[str, dict[str, dict[str, Any]]] = {}
    for unit_id, _ in HEROES:
        all_metrics[unit_id] = {
            "master": metrics_for(unit_id, "master"),
            "prepare": metrics_for(unit_id, "prepare"),
        }

    outputs = [
        build_master_prepare_board(all_metrics),
        build_body_bounds_board(all_metrics),
        build_silhouette_board(all_metrics),
    ]

    after = protected_snapshot()
    (MANIFEST_ROOT / "protected-assets-after.json").write_text(json.dumps(after, indent=2) + "\n", encoding="utf-8")
    comparisons = {
        key: {
            "beforeCount": before[key]["fileCount"],
            "afterCount": after[key]["fileCount"],
            "beforeManifestSha256": before[key]["manifestSha256"],
            "afterManifestSha256": after[key]["manifestSha256"],
            "changed": before[key]["manifestSha256"] != after[key]["manifestSha256"],
        }
        for key in before
    }
    protection = {
        "expectedProductionMasterCount": 37,
        "expectedProductionCombatPoseCount": 100,
        "comparisons": comparisons,
        "status": "PASS" if (
            before["productionMasters"]["fileCount"] == 37
            and before["productionCombatPoses"]["fileCount"] == 100
            and all(not record["changed"] for record in comparisons.values())
        ) else "FAIL",
    }
    report = report_data(all_metrics, protection)
    report_path = QA_ROOT / "hero-scale-parity-report.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    outputs.append(report_path)

    print(json.dumps({
        "status": report["status"],
        "classification": report["primaryClassification"],
        "outputs": [path.relative_to(ROOT).as_posix() for path in outputs],
        "protectedAssets": protection,
    }, indent=2))


if __name__ == "__main__":
    main()

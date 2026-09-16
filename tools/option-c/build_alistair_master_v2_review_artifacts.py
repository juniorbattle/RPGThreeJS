#!/usr/bin/env python3
"""Normalize and audit the 256px Option C Alistair master candidates."""

from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
from statistics import median
from typing import Any

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[2]
ASSET_ROOT = ROOT / "public/assets/dev/option-c/character-masters/alistair-v2"
DOC_ROOT = ROOT / "docs/art-direction/option-c/character-style-lock"
PROMPT_ROOT = DOC_ROOT / "alistair-master-v2"
REFERENCE = DOC_ROOT / "references/character-style-reference-v1.png"
REFERENCE_SHA256 = "e4470e9506df2f4c84af286060e85b69983c87cb5bba27d1bb576f50847b7bd7"
MODEL = "gpt-image-2.5-sunburst-2026-09-08"
QUALITY = "max"

LOGICAL_SIZE = 256
RUNTIME_SIZE = 512
PIVOT_LOGICAL_X = 128
FOOT_BASELINE_LOGICAL = 232
TARGET_BODY_HEIGHT_LOGICAL = 168
MIN_EDGE_MARGIN_LOGICAL = 12
PALETTE_COLOR_CEILING = 128

CANDIDATES: dict[str, dict[str, Any]] = {
    "a": {
        "title": "ALISTAIR MASTER A",
        "variation": "fortress commander base",
        "scores": {
            "STYLE_MATCH": 4,
            "IDENTITY_MATCH": 5,
            "MASKED_FACE_COMPLIANCE": 5,
            "PIXEL_ART_QUALITY": 5,
            "SILHOUETTE_READABILITY": 5,
            "ARMOR_READABILITY": 5,
            "WEAPON_READABILITY": 5,
            "PROPORTION_COHERENCE": 4,
            "TACTICAL_READABILITY": 4,
            "ANIMATION_FEASIBILITY": 3,
            "NO_PAINTERLY_DRIFT": 5,
        },
    },
    "b": {
        "title": "ALISTAIR MASTER B",
        "variation": "cape-fold and armor-readability cleanup",
        "scores": {
            "STYLE_MATCH": 5,
            "IDENTITY_MATCH": 5,
            "MASKED_FACE_COMPLIANCE": 5,
            "PIXEL_ART_QUALITY": 5,
            "SILHOUETTE_READABILITY": 5,
            "ARMOR_READABILITY": 5,
            "WEAPON_READABILITY": 5,
            "PROPORTION_COHERENCE": 5,
            "TACTICAL_READABILITY": 5,
            "ANIMATION_FEASIBILITY": 4,
            "NO_PAINTERLY_DRIFT": 5,
        },
    },
    "c": {
        "title": "ALISTAIR MASTER C",
        "variation": "sword-angle and material-separation refinement",
        "scores": {
            "STYLE_MATCH": 5,
            "IDENTITY_MATCH": 5,
            "MASKED_FACE_COMPLIANCE": 5,
            "PIXEL_ART_QUALITY": 5,
            "SILHOUETTE_READABILITY": 5,
            "ARMOR_READABILITY": 5,
            "WEAPON_READABILITY": 5,
            "PROPORTION_COHERENCE": 5,
            "TACTICAL_READABILITY": 5,
            "ANIMATION_FEASIBILITY": 4,
            "NO_PAINTERLY_DRIFT": 5,
        },
    },
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def text_sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def relative(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def ensure_new(path: Path) -> None:
    if path.exists():
        raise RuntimeError(f"Refusing to overwrite existing artifact: {relative(path)}")
    path.parent.mkdir(parents=True, exist_ok=True)


def save_image(path: Path, image: Image.Image, created: list[Path]) -> None:
    ensure_new(path)
    image.save(path)
    created.append(path)


def write_json(path: Path, value: Any, created: list[Path]) -> None:
    ensure_new(path)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    created.append(path)


def write_text(path: Path, value: str, created: list[Path]) -> None:
    ensure_new(path)
    path.write_text(value, encoding="utf-8")
    created.append(path)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidate = Path("C:/Windows/Fonts") / ("segoeuib.ttf" if bold else "segoeui.ttf")
    if candidate.is_file():
        return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


def chroma_key(image: Image.Image) -> tuple[Image.Image, dict[str, Any]]:
    rgba = np.array(image.convert("RGBA"), dtype=np.uint8)
    rgb = rgba[..., :3]
    red = rgb[..., 0].astype(np.int16)
    green = rgb[..., 1].astype(np.int16)
    blue = rgb[..., 2].astype(np.int16)
    remove = (
        (red >= 190)
        & (blue >= 150)
        & (green <= 150)
        & ((red - green) >= 70)
        & ((blue - green) >= 50)
    )
    rgba[remove] = (0, 0, 0, 0)
    alpha = rgba[..., 3]
    ys, xs = np.nonzero(alpha)
    if not len(xs):
        raise RuntimeError("Chroma extraction produced an empty image")
    bbox = [int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)]
    return Image.fromarray(rgba, mode="RGBA"), {
        "method": "bounded-magenta-chroma-key",
        "sourceBbox": bbox,
        "foregroundPixels": int((alpha > 0).sum()),
        "removedPixels": int(remove.sum()),
    }


def quantize_rgba(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    rgb = Image.new("RGB", rgba.size, (0, 0, 0))
    rgb.paste(rgba.convert("RGB"), mask=alpha)
    quantized = rgb.quantize(
        colors=PALETTE_COLOR_CEILING,
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    ).convert("RGB")
    result = Image.merge("RGBA", (*quantized.split(), alpha))
    pixels = np.array(result, dtype=np.uint8)
    pixels[pixels[..., 3] == 0, :3] = 0
    return Image.fromarray(pixels, mode="RGBA")


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise RuntimeError("Image contains no opaque pixels")
    return bbox


def foot_center(crop: Image.Image) -> float:
    alpha = np.array(crop.getchannel("A"), dtype=np.uint8)
    band_height = max(12, round(crop.height * 0.025))
    _, xs = np.nonzero(alpha[-band_height:] > 0)
    if not len(xs):
        raise RuntimeError("Unable to resolve the foot support band")
    return (float(xs.min()) + float(xs.max()) + 1.0) / 2.0


def normalize(
    isolated: Image.Image,
    source_bbox: tuple[int, int, int, int],
    shared_scale: float,
) -> tuple[Image.Image, dict[str, Any]]:
    crop = isolated.crop(source_bbox)
    source_foot_center = foot_center(crop)
    scaled_width = max(1, round(crop.width * shared_scale))
    scaled_height = max(1, round(crop.height * shared_scale))
    scaled = crop.resize((scaled_width, scaled_height), Image.Resampling.NEAREST)
    scaled = quantize_rgba(scaled)
    scaled_foot_center = source_foot_center * scaled_width / crop.width
    paste_x = round(PIVOT_LOGICAL_X - scaled_foot_center)
    paste_y = FOOT_BASELINE_LOGICAL - scaled_height

    if paste_x < 0 or paste_y < 0 or paste_x + scaled_width > LOGICAL_SIZE or paste_y + scaled_height > LOGICAL_SIZE:
        raise RuntimeError("Shared-scale normalization would clip the candidate")

    logical = Image.new("RGBA", (LOGICAL_SIZE, LOGICAL_SIZE), (0, 0, 0, 0))
    logical.alpha_composite(scaled, (paste_x, paste_y))
    bbox = alpha_bbox(logical)
    left, top, right, bottom = bbox
    clearances = [left, top, LOGICAL_SIZE - right, LOGICAL_SIZE - bottom]
    if min(clearances) < MIN_EDGE_MARGIN_LOGICAL:
        raise RuntimeError(f"Candidate violates the {MIN_EDGE_MARGIN_LOGICAL}px edge margin: {clearances}")
    if bottom != FOOT_BASELINE_LOGICAL:
        raise RuntimeError(f"Candidate baseline drift: expected {FOOT_BASELINE_LOGICAL}, got {bottom}")

    pixels = np.array(logical, dtype=np.uint8)
    visible = pixels[..., 3] > 0
    rgb = pixels[..., :3].astype(np.int16)
    magenta_like = (
        visible
        & (rgb[..., 0] >= 190)
        & (rgb[..., 2] >= 150)
        & (rgb[..., 1] <= 150)
        & ((rgb[..., 0] - rgb[..., 1]) >= 70)
        & ((rgb[..., 2] - rgb[..., 1]) >= 50)
    )
    return logical, {
        "sourceBbox": list(source_bbox),
        "sourceExtent": [crop.width, crop.height],
        "sharedSourceToLogicalScale": round(shared_scale, 9),
        "sourceFootCenterXWithinCrop": round(source_foot_center, 3),
        "logicalPasteOrigin": [paste_x, paste_y],
        "logicalBbox": list(bbox),
        "logicalExtent": [right - left, bottom - top],
        "logicalBodyHeight": bottom - top,
        "pivotLogicalX": PIVOT_LOGICAL_X,
        "footBaselineLogical": FOOT_BASELINE_LOGICAL,
        "edgeClearance": clearances,
        "minimumEdgeClearance": min(clearances),
        "visibleMagentaLikePixelCount": int(magenta_like.sum()),
        "paletteColorCeiling": PALETTE_COLOR_CEILING,
        "rawToLogicalResampling": "nearest-neighbor",
        "dithering": "none",
    }


def exact_x2(logical: Image.Image) -> Image.Image:
    runtime = logical.resize((RUNTIME_SIZE, RUNTIME_SIZE), Image.Resampling.NEAREST)
    source = np.array(logical, dtype=np.uint8)
    expected = np.repeat(np.repeat(source, 2, axis=0), 2, axis=1)
    if not np.array_equal(expected, np.array(runtime, dtype=np.uint8)):
        raise RuntimeError("Runtime output is not an exact nearest-neighbor x2 transform")
    return runtime


def checkerboard(size: tuple[int, int], tile: int = 24) -> Image.Image:
    image = Image.new("RGB", size, (36, 39, 44))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], tile):
        for x in range(0, size[0], tile):
            if (x // tile + y // tile) % 2:
                draw.rectangle((x, y, x + tile - 1, y + tile - 1), fill=(49, 53, 59))
    return image


def review_panel(runtime: Image.Image, title: str, background: tuple[int, int, int], metric: dict[str, Any], geometry: bool = False) -> Image.Image:
    board = Image.new("RGB", (640, 670), background)
    board.paste(runtime, (64, 84), runtime)
    draw = ImageDraw.Draw(board)
    draw.text((32, 22), title, fill=(244, 231, 205), font=font(23, True))
    if geometry:
        pivot_x = 64 + PIVOT_LOGICAL_X * 2
        baseline_y = 84 + FOOT_BASELINE_LOGICAL * 2
        draw.line((pivot_x, 76, pivot_x, 606), fill=(72, 193, 255), width=2)
        draw.line((42, baseline_y, 598, baseline_y), fill=(255, 188, 59), width=2)
        draw.text((32, 620), f"pivot x={PIVOT_LOGICAL_X}  baseline y={FOOT_BASELINE_LOGICAL}  body={metric['logicalBodyHeight']}px", fill=(220, 224, 230), font=font(16))
    else:
        draw.text((32, 620), f"256 logical → exact NN ×2 → 512 runtime · body={metric['logicalBodyHeight']}px", fill=(220, 224, 230), font=font(16))
    return board


def silhouette_panel(runtime: Image.Image, title: str) -> Image.Image:
    board = Image.new("RGB", (640, 670), (232, 228, 218))
    shape = Image.new("RGBA", runtime.size, (8, 10, 13, 0))
    shape.putalpha(runtime.getchannel("A"))
    board.paste(shape, (64, 84), shape)
    draw = ImageDraw.Draw(board)
    draw.text((32, 22), title + " — SILHOUETTE", fill=(20, 22, 26), font=font(23, True))
    draw.text((32, 620), "Monochrome class / weapon readability proof", fill=(48, 52, 58), font=font(16))
    return board


def grayscale_panel(runtime: Image.Image, title: str) -> Image.Image:
    alpha = runtime.getchannel("A")
    gray = ImageOps.grayscale(runtime.convert("RGB")).convert("RGBA")
    gray.putalpha(alpha)
    board = checkerboard((640, 670))
    board.paste(gray, (64, 84), gray)
    draw = ImageDraw.Draw(board)
    draw.text((32, 22), title + " — VALUE GROUPS", fill=(244, 231, 205), font=font(23, True))
    draw.text((32, 620), "Armor / cloth / leather separation without hue", fill=(220, 224, 230), font=font(16))
    return board


def tactical_preview(logical: Image.Image, title: str) -> Image.Image:
    bbox = alpha_bbox(logical)
    crop = logical.crop(bbox)
    target_height = 96
    target_width = max(1, round(crop.width * target_height / crop.height))
    sprite = crop.resize((target_width, target_height), Image.Resampling.NEAREST)
    board = Image.new("RGB", (360, 180), (17, 23, 31))
    board.paste(sprite, ((360 - target_width) // 2, 50), sprite)
    draw = ImageDraw.Draw(board)
    draw.text((18, 12), title + " — 96PX READ", fill=(244, 231, 205), font=font(18, True))
    draw.text((18, 151), "TACTICAL READABILITY", fill=(182, 194, 207), font=font(14))
    return board


def comparison_board(runtimes: dict[str, Image.Image], metrics: dict[str, dict[str, Any]]) -> Image.Image:
    board = Image.new("RGB", (1740, 760), (11, 15, 20))
    draw = ImageDraw.Draw(board)
    draw.text((34, 24), "ALISTAIR V2 — FROM-SCRATCH MASTER CANDIDATES", fill=(244, 231, 205), font=font(30, True))
    draw.text((34, 63), "One approved style reference · zero legacy image inputs · no selection applied", fill=(236, 178, 58), font=font(18, True))
    for index, candidate in enumerate(("a", "b", "c")):
        x = 34 + index * 568
        runtime = runtimes[candidate]
        board.paste(runtime, (x + 18, 106), runtime)
        scores = CANDIDATES[candidate]["scores"]
        total = sum(scores.values())
        draw.text((x + 18, 635), f"{candidate.upper()} · {CANDIDATES[candidate]['variation']}", fill=(244, 231, 205), font=font(19, True))
        draw.text((x + 18, 668), f"QA {total}/55 · body {metrics[candidate]['logicalBodyHeight']}px · min edge {metrics[candidate]['minimumEdgeClearance']}px", fill=(196, 205, 216), font=font(16))
    draw.text((34, 725), "Recommendation: B · ALISTAIR_CHARACTER_MASTER_SELECTED=NO", fill=(236, 178, 58), font=font(19, True))
    return board


def main() -> int:
    created: list[Path] = []
    if sha256(REFERENCE) != REFERENCE_SHA256:
        raise RuntimeError("Approved style-reference hash mismatch")

    isolated: dict[str, Image.Image] = {}
    chroma: dict[str, dict[str, Any]] = {}
    source_bboxes: dict[str, tuple[int, int, int, int]] = {}
    provenances: dict[str, dict[str, Any]] = {}
    source_heights: list[int] = []

    for candidate in ("a", "b", "c"):
        raw_path = ASSET_ROOT / "raw" / f"alistair-master-v2-{candidate}-sunburst-raw.png"
        prompt_path = PROMPT_ROOT / f"alistair-master-v2-{candidate}.prompt.txt"
        provenance_path = ASSET_ROOT / "provenance" / f"alistair-master-v2-{candidate}-generation.json"
        provenance = json.loads(provenance_path.read_text(encoding="utf-8"))
        prompt = prompt_path.read_text(encoding="utf-8").strip()
        sources = provenance["request"]["sourceImages"]
        if provenance.get("status") != "SUCCEEDED":
            raise RuntimeError(f"Candidate {candidate.upper()} provenance is not successful")
        if provenance["request"]["model"] != MODEL or provenance["request"]["quality"] != QUALITY:
            raise RuntimeError(f"Candidate {candidate.upper()} model/quality provenance mismatch")
        if provenance["request"]["promptSha256"] != text_sha256(prompt):
            raise RuntimeError(f"Candidate {candidate.upper()} prompt hash mismatch")
        if len(sources) != 1 or sources[0]["sha256"] != REFERENCE_SHA256:
            raise RuntimeError(f"Candidate {candidate.upper()} did not use exactly one approved style reference")
        if sha256(raw_path) != provenance["output"]["sha256"]:
            raise RuntimeError(f"Candidate {candidate.upper()} raw hash mismatch")

        raw = Image.open(raw_path).convert("RGB")
        if raw.size != (2048, 2048):
            raise RuntimeError(f"Candidate {candidate.upper()} raw dimensions are not 2048x2048")
        clean, chroma_metric = chroma_key(raw)
        bbox = alpha_bbox(clean)
        isolated[candidate] = clean
        chroma[candidate] = chroma_metric
        source_bboxes[candidate] = bbox
        source_heights.append(bbox[3] - bbox[1])
        provenances[candidate] = provenance

    shared_source_height = float(median(source_heights))
    shared_scale = TARGET_BODY_HEIGHT_LOGICAL / shared_source_height
    logicals: dict[str, Image.Image] = {}
    runtimes: dict[str, Image.Image] = {}
    metrics: dict[str, dict[str, Any]] = {}

    for candidate in ("a", "b", "c"):
        isolated_path = ASSET_ROOT / "isolated" / f"alistair-master-v2-{candidate}-isolated.png"
        save_image(isolated_path, isolated[candidate], created)
        logical, metric = normalize(isolated[candidate], source_bboxes[candidate], shared_scale)
        runtime = exact_x2(logical)
        logical_path = ASSET_ROOT / "logical-256" / f"alistair-master-v2-{candidate}.png"
        runtime_path = ASSET_ROOT / "runtime-512" / f"alistair-master-v2-{candidate}.png"
        save_image(logical_path, logical, created)
        save_image(runtime_path, runtime, created)
        logicals[candidate] = logical
        runtimes[candidate] = runtime

        metric.update({
            "schemaVersion": 1,
            "candidate": candidate.upper(),
            "status": "MASTER_CANDIDATE",
            "rawPath": relative(ASSET_ROOT / "raw" / f"alistair-master-v2-{candidate}-sunburst-raw.png"),
            "rawSha256": provenances[candidate]["output"]["sha256"],
            "isolatedPath": relative(isolated_path),
            "isolatedSha256": sha256(isolated_path),
            "chroma": chroma[candidate],
            "logicalPath": relative(logical_path),
            "logicalSha256": sha256(logical_path),
            "runtimePath": relative(runtime_path),
            "runtimeSha256": sha256(runtime_path),
            "runtimeCanvas": [RUNTIME_SIZE, RUNTIME_SIZE],
            "exactNearestNeighborX2": True,
            "sharedScaleAcrossCandidates": True,
        })
        metrics[candidate] = metric

        review_dir = ASSET_ROOT / "reviews"
        review_images = {
            "dark-background": review_panel(runtime, CANDIDATES[candidate]["title"], (11, 15, 20), metric),
            "light-background": review_panel(runtime, CANDIDATES[candidate]["title"], (232, 228, 218), metric),
            "geometry-overlay": review_panel(runtime, CANDIDATES[candidate]["title"] + " — GEOMETRY", (20, 24, 30), metric, True),
            "silhouette": silhouette_panel(runtime, CANDIDATES[candidate]["title"]),
            "grayscale-value": grayscale_panel(runtime, CANDIDATES[candidate]["title"]),
            "tactical-96": tactical_preview(logical, CANDIDATES[candidate]["title"]),
            "pixel-inspection-4x": logical.resize((1024, 1024), Image.Resampling.NEAREST),
        }
        metric["reviews"] = []
        for name, review in review_images.items():
            path = review_dir / f"alistair-master-v2-{candidate}-{name}.png"
            save_image(path, review, created)
            metric["reviews"].append({"kind": name, "path": relative(path), "sha256": sha256(path)})
        write_json(ASSET_ROOT / "qa" / f"alistair-master-v2-{candidate}-metrics.json", metric, created)

    comparison_path = ASSET_ROOT / "reviews/alistair-master-v2-abc-comparison.png"
    save_image(comparison_path, comparison_board(runtimes, metrics), created)

    scorecard = {
        "schemaVersion": 1,
        "status": "PASS",
        "scoringScale": "1-5; PASS at 3 or higher",
        "reviewClassification": "OPERATOR_DECISION_AID_NOT_AUTOMATIC_SELECTION",
        "recommendedAlistairMaster": "B",
        "alistairCharacterMasterSelected": False,
        "candidates": {},
    }
    for candidate in ("a", "b", "c"):
        scores = CANDIDATES[candidate]["scores"]
        scorecard["candidates"][candidate.upper()] = {
            "status": "MASTER_CANDIDATE",
            "totalOutOf55": sum(scores.values()),
            "scorecard": {
                name: {"scoreOutOf5": score, "status": "PASS" if score >= 3 else "FAIL"}
                for name, score in scores.items()
            },
            "criticalFailures": [],
        }
    scorecard_path = ASSET_ROOT / "qa/alistair-master-v2-scorecard.json"
    write_json(scorecard_path, scorecard, created)

    technical_checks: list[dict[str, Any]] = []

    def check(name: str, passed: bool, evidence: Any) -> None:
        technical_checks.append({"name": name, "status": "PASS" if passed else "FAIL", "evidence": evidence})

    check("approved-reference-hash", sha256(REFERENCE) == REFERENCE_SHA256, REFERENCE_SHA256)
    check("generation-input-policy", all(len(provenances[c]["request"]["sourceImages"]) == 1 for c in CANDIDATES), {"approvedStyleReferenceInputsPerCandidate": 1, "legacyCharacterImageInputs": 0})
    check("logical-canvas", all(image.size == (256, 256) for image in logicals.values()), [256, 256])
    check("runtime-canvas", all(image.size == (512, 512) for image in runtimes.values()), [512, 512])
    check("exact-nearest-neighbor-x2", all(metrics[c]["exactNearestNeighborX2"] for c in CANDIDATES), True)
    check("shared-scale", all(metrics[c]["sharedSourceToLogicalScale"] == round(shared_scale, 9) for c in CANDIDATES), round(shared_scale, 9))
    check("baseline", all(metrics[c]["logicalBbox"][3] == FOOT_BASELINE_LOGICAL for c in CANDIDATES), FOOT_BASELINE_LOGICAL)
    check("edge-margin", all(metrics[c]["minimumEdgeClearance"] >= MIN_EDGE_MARGIN_LOGICAL for c in CANDIDATES), {c.upper(): metrics[c]["minimumEdgeClearance"] for c in CANDIDATES})
    check("target-body-height-family", all(abs(metrics[c]["logicalBodyHeight"] - TARGET_BODY_HEIGHT_LOGICAL) <= 2 for c in CANDIDATES), {c.upper(): metrics[c]["logicalBodyHeight"] for c in CANDIDATES})
    check("magenta-fringe", all(metrics[c]["visibleMagentaLikePixelCount"] == 0 for c in CANDIDATES), {c.upper(): metrics[c]["visibleMagentaLikePixelCount"] for c in CANDIDATES})
    check("no-selection", scorecard["alistairCharacterMasterSelected"] is False, False)
    audit_status = "PASS" if all(item["status"] == "PASS" for item in technical_checks) else "FAIL"
    audit = {
        "schemaVersion": 1,
        "status": audit_status,
        "checksPassed": sum(item["status"] == "PASS" for item in technical_checks),
        "checksFailed": sum(item["status"] == "FAIL" for item in technical_checks),
        "checks": technical_checks,
    }
    audit_path = ASSET_ROOT / "qa/alistair-master-v2-technical-audit.json"
    write_json(audit_path, audit, created)

    attempts = []
    for candidate in ("a", "b", "c"):
        provenance = provenances[candidate]
        attempts.append({
            "candidate": candidate.upper(),
            "status": provenance["status"],
            "timestamp": provenance["timestampStarted"],
            "requestId": provenance.get("response", {}).get("requestId"),
            "modelRequested": provenance["request"]["model"],
            "qualityRequested": provenance["request"]["quality"],
            "modelReported": provenance.get("response", {}).get("modelReported"),
            "styleReferenceSha256": provenance["request"]["sourceImages"][0]["sha256"],
            "promptSha256": provenance["request"]["promptSha256"],
            "rawDimensions": provenance["output"]["rawDimensions"],
            "outputSha256": provenance["output"]["sha256"],
            "provenancePath": relative(ASSET_ROOT / "provenance" / f"alistair-master-v2-{candidate}-generation.json"),
        })

    manifest = {
        "schemaVersion": 1,
        "generatedAt": utc_now(),
        "generationMode": "FROM_SCRATCH_TEXT_PLUS_ONE_APPROVED_STYLE_REFERENCE",
        "characterStyleReference": "ATTACHED_4_CLASS_REFERENCE",
        "referenceRole": "PRIMARY_STYLE_AUTHORITY",
        "styleReferencePath": relative(REFERENCE),
        "styleReferenceSha256": REFERENCE_SHA256,
        "approvedStyleReferenceInputsPerCandidate": 1,
        "legacyCharacterImageInputs": 0,
        "requestedModel": MODEL,
        "requestedQuality": QUALITY,
        "modelProvenance": "UNKNOWN_WHERE_RESPONSE_FIELD_IS_NULL",
        "fallbackUsed": False,
        "imageGenerationAttempts": 3,
        "attempts": attempts,
        "normalization": {
            "logicalCanvas": [LOGICAL_SIZE, LOGICAL_SIZE],
            "runtimeCanvas": [RUNTIME_SIZE, RUNTIME_SIZE],
            "upscale": "NEAREST_NEIGHBOR_X2",
            "pivotLogicalX": PIVOT_LOGICAL_X,
            "pivotRuntimeX": PIVOT_LOGICAL_X * 2,
            "footBaselineLogical": FOOT_BASELINE_LOGICAL,
            "footBaselineRuntime": FOOT_BASELINE_LOGICAL * 2,
            "targetUprightBodyHeightLogical": TARGET_BODY_HEIGHT_LOGICAL,
            "minimumEdgeMarginLogical": MIN_EDGE_MARGIN_LOGICAL,
            "sharedSourceHeight": shared_source_height,
            "sharedSourceToLogicalScale": round(shared_scale, 9),
            "sharedScaleAcrossCandidates": True,
            "independentPerCandidateScaling": False,
        },
        "candidates": {candidate.upper(): metrics[candidate] for candidate in ("a", "b", "c")},
        "comparisonBoard": relative(comparison_path),
        "scorecard": relative(scorecard_path),
        "technicalAudit": relative(audit_path),
        "recommendedAlistairMaster": "B",
        "alistairCharacterMasterSelected": False,
        "canonicalAssetsChanged": False,
        "runtimeChanged": False,
        "gameplayChanged": False,
        "combatLogicChanged": False,
        "vfxChanged": False,
    }
    manifest_path = ASSET_ROOT / "provenance/alistair-master-v2-manifest.json"
    write_json(manifest_path, manifest, created)

    report = """# Alistair V2 character-master candidates

Status: `AWAITING_OPERATOR_SELECTION`

The attached four-class image is the sole artistic visual authority. All three candidates were generated from scratch with exactly one approved style-reference input and zero legacy character-image inputs.

| Candidate | Variation | QA | Status |
| --- | --- | ---: | --- |
"""
    for candidate in ("a", "b", "c"):
        total = sum(CANDIDATES[candidate]["scores"].values())
        report += f"| {candidate.upper()} | {CANDIDATES[candidate]['variation']} | {total}/55 | MASTER_CANDIDATE |\n"
    report += """

## Recommendation

Recommend **B** for operator review: it preserves the strongest broad frontline silhouette, the cleanest armor grouping at tactical scale, and the most animation-feasible module separation while remaining in the approved visual family.

This is a recommendation only. `ALISTAIR_CHARACTER_MASTER_SELECTED=NO`. No candidate has been promoted, integrated, or applied to canonical assets.
"""
    report_path = PROMPT_ROOT / "ALISTAIR_MASTER_V2_CANDIDATE_REPORT.md"
    write_text(report_path, report, created)

    if audit_status != "PASS":
        raise RuntimeError(f"Technical audit failed; inspect {relative(audit_path)}")

    print(json.dumps({
        "status": "PASS",
        "comparisonBoard": relative(comparison_path),
        "recommendedAlistairMaster": "B",
        "alistairCharacterMasterSelected": False,
        "filesCreated": len(created),
        "technicalAudit": relative(audit_path),
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

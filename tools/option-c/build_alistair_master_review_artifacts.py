#!/usr/bin/env python3
"""Build deterministic logical/runtime Alistair master candidates and review evidence."""

from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
ASSET_ROOT = ROOT / "public/assets/dev/option-c/character-masters/alistair"
DOC_ROOT = ROOT / "docs/art-direction/option-c/character-style-lock"
REFERENCE = DOC_ROOT / "references/character-style-reference-v1.png"
SEED_B = ROOT / "public/assets/dev/option-c/style-seed/runtime-512/style-seed-b-lineup.png"
REFERENCE_SHA256 = "e4470e9506df2f4c84af286060e85b69983c87cb5bba27d1bb576f50847b7bd7"
SEED_B_SHA256 = "d5ba51cb46f3589dfab4433ed2ceeabe2fbc803514b7e5bdbff6aa7fb46014cd"
MODEL = "gpt-image-2.5-sunburst-2026-09-08"
QUALITY = "max"
LOGICAL_SIZE = 128
RUNTIME_SIZE = 512
PIVOT_X = 64
FOOT_BASELINE = 116
TARGET_BODY_HEIGHT = 84
MIN_EDGE_CLEARANCE = 6
CHROMA_THRESHOLD = 150
PALETTE_COLORS = 64

CANDIDATES: dict[str, dict[str, Any]] = {
    "a": {
        "acceptedRaw": "alistair-master-a-attempt-2-sunburst-raw.png",
        "acceptedPrompt": "alistair-master-a-attempt-2.prompt.txt",
        "acceptedProvenance": "alistair-master-a-attempt-2-generation.json",
        "title": "ALISTAIR MASTER A — FORTRESS VANGUARD",
        "swordCrop": (64, 40, 128, 104),
    },
    "b": {
        "acceptedRaw": "alistair-master-b-attempt-2-sunburst-raw.png",
        "acceptedPrompt": "alistair-master-b-attempt-2.prompt.txt",
        "acceptedProvenance": "alistair-master-b-attempt-2-generation.json",
        "title": "ALISTAIR MASTER B — BALANCED TACTICAL",
        "swordCrop": (64, 56, 128, 120),
    },
    "c": {
        "acceptedRaw": "alistair-master-c-attempt-2-sunburst-raw.png",
        "acceptedPrompt": "alistair-master-c-attempt-2.prompt.txt",
        "acceptedProvenance": "alistair-master-c-attempt-2-generation.json",
        "title": "ALISTAIR MASTER C — SEGMENTED VANGUARD",
        "swordCrop": (0, 56, 64, 120),
    },
}

SCORES: dict[str, dict[str, int]] = {
    "a": {
        "TRUE_PIXEL_ART_CONSTRUCTION": 5,
        "MODERNITY": 5,
        "REFERENCE_V1_VISUAL_MATCH": 5,
        "SEED_B_TECHNICAL_COMPATIBILITY": 4,
        "FACE_CONCEALMENT": 5,
        "SILHOUETTE_READABILITY": 5,
        "PROPORTION_COHERENCE": 4,
        "ARMOR_READABILITY": 5,
        "WEAPON_READABILITY": 5,
        "PIXEL_CLUSTER_DISCIPLINE": 4,
        "MATERIAL_READABILITY": 5,
        "ANIMATION_FEASIBILITY": 4,
        "TACTICAL_READABILITY": 4,
        "HD2D_ENVIRONMENT_COMPATIBILITY": 5,
        "NO_PAINTERLY_DRIFT": 5,
    },
    "b": {
        "TRUE_PIXEL_ART_CONSTRUCTION": 5,
        "MODERNITY": 5,
        "REFERENCE_V1_VISUAL_MATCH": 4,
        "SEED_B_TECHNICAL_COMPATIBILITY": 5,
        "FACE_CONCEALMENT": 5,
        "SILHOUETTE_READABILITY": 4,
        "PROPORTION_COHERENCE": 5,
        "ARMOR_READABILITY": 5,
        "WEAPON_READABILITY": 5,
        "PIXEL_CLUSTER_DISCIPLINE": 5,
        "MATERIAL_READABILITY": 5,
        "ANIMATION_FEASIBILITY": 5,
        "TACTICAL_READABILITY": 5,
        "HD2D_ENVIRONMENT_COMPATIBILITY": 5,
        "NO_PAINTERLY_DRIFT": 5,
    },
    "c": {
        "TRUE_PIXEL_ART_CONSTRUCTION": 5,
        "MODERNITY": 5,
        "REFERENCE_V1_VISUAL_MATCH": 5,
        "SEED_B_TECHNICAL_COMPATIBILITY": 4,
        "FACE_CONCEALMENT": 5,
        "SILHOUETTE_READABILITY": 5,
        "PROPORTION_COHERENCE": 5,
        "ARMOR_READABILITY": 5,
        "WEAPON_READABILITY": 5,
        "PIXEL_CLUSTER_DISCIPLINE": 4,
        "MATERIAL_READABILITY": 5,
        "ANIMATION_FEASIBILITY": 4,
        "TACTICAL_READABILITY": 5,
        "HD2D_ENVIRONMENT_COMPATIBILITY": 5,
        "NO_PAINTERLY_DRIFT": 5,
    },
}

ATTEMPTS = (
    ("A", 1, "alistair-master-a-sunburst-raw.png", "alistair-master-a.prompt.txt", "alistair-master-a-generation.json", "REJECTED_REFERENCE_COPY_DRIFT", "cape, helmet, tabard, and overall read remained too close to the anonymous V1 Knight"),
    ("A", 2, "alistair-master-a-attempt-2-sunburst-raw.png", "alistair-master-a-attempt-2.prompt.txt", "alistair-master-a-attempt-2-generation.json", "MASTER_CANDIDATE", None),
    ("B", 1, "alistair-master-b-sunburst-raw.png", "alistair-master-b.prompt.txt", "alistair-master-b-generation.json", "REJECTED_REFERENCE_COPY_DRIFT", "pointed helmet, symmetric cape, brooches, and central tabard echoed the anonymous V1 Knight"),
    ("B", 2, "alistair-master-b-attempt-2-sunburst-raw.png", "alistair-master-b-attempt-2.prompt.txt", "alistair-master-b-attempt-2-generation.json", "MASTER_CANDIDATE", None),
    ("C", 1, "alistair-master-c-sunburst-raw.png", "alistair-master-c.prompt.txt", "alistair-master-c-generation.json", "REJECTED_REFERENCE_COPY_DRIFT", "cape, tabard, brooches, helmet, and sword presentation substantially copied the anonymous V1 Knight"),
    ("C", 2, "alistair-master-c-attempt-2-sunburst-raw.png", "alistair-master-c-attempt-2.prompt.txt", "alistair-master-c-attempt-2-generation.json", "MASTER_CANDIDATE", None),
)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def relative(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidate = Path("C:/Windows/Fonts") / ("segoeuib.ttf" if bold else "segoeui.ttf")
    if candidate.is_file():
        return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


def chroma_key(image: Image.Image) -> tuple[Image.Image, dict[str, Any]]:
    rgba = np.array(image.convert("RGBA"), dtype=np.uint8)
    rgb = rgba[..., :3].astype(np.int32)
    distance_squared = (
        (rgb[..., 0] - 255) ** 2
        + rgb[..., 1] ** 2
        + (rgb[..., 2] - 255) ** 2
    )
    remove = distance_squared < CHROMA_THRESHOLD**2
    rgba[remove, 3] = 0
    rgba[remove, :3] = 0
    alpha = rgba[..., 3]
    ys, xs = np.nonzero(alpha)
    if len(xs) == 0:
        raise RuntimeError("Chroma extraction produced an empty image")
    bbox = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    result = Image.fromarray(rgba, mode="RGBA")
    return result, {
        "method": "euclidean-magenta-distance-binary-alpha",
        "threshold": CHROMA_THRESHOLD,
        "sourceBbox": list(bbox),
        "foregroundPixels": int((alpha > 0).sum()),
        "removedPixels": int(remove.sum()),
    }


def quantize_rgba(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    rgb = Image.new("RGB", rgba.size, (0, 0, 0))
    rgb.paste(rgba.convert("RGB"), mask=alpha)
    quantized = rgb.quantize(
        colors=PALETTE_COLORS,
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    ).convert("RGB")
    result = Image.merge("RGBA", (*quantized.split(), alpha))
    pixels = np.array(result, dtype=np.uint8)
    pixels[pixels[..., 3] == 0, :3] = 0
    return Image.fromarray(pixels, mode="RGBA")


def normalize_to_contract(clean: Image.Image) -> tuple[Image.Image, dict[str, Any]]:
    alpha = np.array(clean.getchannel("A"), dtype=np.uint8)
    ys, xs = np.nonzero(alpha)
    x0, x1 = int(xs.min()), int(xs.max()) + 1
    y0, y1 = int(ys.min()), int(ys.max()) + 1
    crop = clean.crop((x0, y0, x1, y1))
    crop_alpha = np.array(crop.getchannel("A"), dtype=np.uint8)

    band_start = max(0, crop.height - round(crop.height * 0.12))
    band_ys, band_xs = np.nonzero(crop_alpha[band_start:] > 0)
    if len(band_xs) == 0:
        raise RuntimeError("Unable to resolve Alistair foot support band")
    foot_center_source = (float(band_xs.min()) + float(band_xs.max()) + 1.0) / 2.0

    scale = TARGET_BODY_HEIGHT / crop.height
    scaled_width = max(1, round(crop.width * scale))
    scaled = crop.resize((scaled_width, TARGET_BODY_HEIGHT), Image.Resampling.NEAREST)
    foot_center_scaled = foot_center_source * (scaled_width / crop.width)
    paste_x = round(PIVOT_X - foot_center_scaled)
    paste_y = FOOT_BASELINE - TARGET_BODY_HEIGHT

    canvas = Image.new("RGBA", (LOGICAL_SIZE, LOGICAL_SIZE), (0, 0, 0, 0))
    canvas.alpha_composite(scaled, (paste_x, paste_y))
    canvas = quantize_rgba(canvas)
    bbox = canvas.getbbox()
    if bbox is None:
        raise RuntimeError("Normalized sprite is empty")
    bx0, by0, bx1, by1 = bbox
    clearances = [bx0, by0, LOGICAL_SIZE - bx1, LOGICAL_SIZE - by1]
    if min(clearances) < MIN_EDGE_CLEARANCE:
        raise RuntimeError(f"Normalized sprite violates {MIN_EDGE_CLEARANCE}px safe clearance: {clearances}")
    if by1 != FOOT_BASELINE:
        raise RuntimeError(f"Normalized sprite baseline drift: expected {FOOT_BASELINE}, got {by1}")

    return canvas, {
        "sourceBbox": [x0, y0, x1, y1],
        "sourceExtent": [x1 - x0, y1 - y0],
        "sourceFootSupportBandStart": y0 + band_start,
        "sourceFootCenterX": round(x0 + foot_center_source, 3),
        "sourceToLogicalScale": round(scale, 9),
        "normalizationRule": "per-candidate source correction to one shared 84px body-height target; never scaled to fill canvas",
        "independentFillScaling": False,
        "logicalBbox": list(bbox),
        "logicalExtent": [bx1 - bx0, by1 - by0],
        "logicalBodyHeight": by1 - by0,
        "pivotLogicalX": PIVOT_X,
        "footBaselineLogical": FOOT_BASELINE,
        "edgeClearance": clearances,
        "minimumEdgeClearance": min(clearances),
        "paletteColorCeiling": PALETTE_COLORS,
        "rawToLogicalResampling": "nearest-neighbor",
        "dithering": "none",
    }


def exact_x4(logical: Image.Image) -> Image.Image:
    runtime = logical.resize((RUNTIME_SIZE, RUNTIME_SIZE), Image.Resampling.NEAREST)
    source = np.array(logical, dtype=np.uint8)
    expected = np.repeat(np.repeat(source, 4, axis=0), 4, axis=1)
    if not np.array_equal(expected, np.array(runtime, dtype=np.uint8)):
        raise RuntimeError("Runtime candidate is not an exact nearest-neighbor x4 transform")
    return runtime


def checkerboard(size: tuple[int, int], tile: int = 24) -> Image.Image:
    image = Image.new("RGB", size, (28, 31, 36))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], tile):
        for x in range(0, size[0], tile):
            if (x // tile + y // tile) % 2:
                draw.rectangle((x, y, x + tile - 1, y + tile - 1), fill=(38, 42, 48))
    return image


def review_board(runtime: Image.Image, title: str, background: tuple[int, int, int]) -> Image.Image:
    board = Image.new("RGB", (640, 620), background)
    board.paste(runtime, (64, 76), runtime)
    draw = ImageDraw.Draw(board)
    ink = (241, 226, 194) if sum(background) < 400 else (25, 29, 34)
    draw.text((24, 20), title, fill=ink, font=font(24, True))
    draw.text((24, 574), "128 logical → exact nearest-neighbor ×4 → 512 runtime", fill=ink, font=font(16))
    return board


def silhouette(runtime: Image.Image, title: str) -> Image.Image:
    board = checkerboard((640, 620))
    mask = runtime.getchannel("A")
    shape = Image.new("RGBA", runtime.size, (246, 231, 191, 0))
    shape.putalpha(mask)
    board.paste(shape, (64, 76), shape)
    draw = ImageDraw.Draw(board)
    draw.text((24, 20), title + " — SILHOUETTE", fill=(241, 226, 194), font=font(24, True))
    return board


def grayscale(runtime: Image.Image, title: str) -> Image.Image:
    alpha = runtime.getchannel("A")
    gray = runtime.convert("L").convert("RGBA")
    gray.putalpha(alpha)
    return review_board(gray, title + " — VALUE", (17, 20, 24))


def detail_crop(logical: Image.Image, box: tuple[int, int, int, int], title: str) -> Image.Image:
    crop = logical.crop(box)
    scale = min(14, 448 // max(crop.width, crop.height))
    enlarged = crop.resize((crop.width * scale, crop.height * scale), Image.Resampling.NEAREST)
    board = checkerboard((512, 560), tile=16)
    x = (512 - enlarged.width) // 2
    y = 72 + (448 - enlarged.height) // 2
    board.paste(enlarged, (x, y), enlarged)
    draw = ImageDraw.Draw(board)
    draw.text((20, 18), title, fill=(241, 226, 194), font=font(22, True))
    draw.text((20, 526), f"logical crop {box} · nearest ×{scale}", fill=(241, 226, 194), font=font(14))
    return board


def geometry_board(runtime: Image.Image, title: str, metric: dict[str, Any], pivot_only: bool) -> Image.Image:
    board = Image.new("RGB", (640, 640), (13, 17, 22))
    board.paste(runtime, (64, 96), runtime)
    draw = ImageDraw.Draw(board)
    ox, oy = 64, 96
    pivot_x = ox + PIVOT_X * 4
    baseline_y = oy + FOOT_BASELINE * 4
    draw.line((pivot_x, oy, pivot_x, oy + 512), fill=(0, 226, 242), width=2)
    draw.line((ox, baseline_y, ox + 512, baseline_y), fill=(98, 238, 134), width=2)
    draw.ellipse((pivot_x - 5, baseline_y - 5, pivot_x + 5, baseline_y + 5), outline=(255, 225, 104), width=2)
    label = "PIVOT / BASELINE" if pivot_only else "GEOMETRY / SAFE AREA"
    draw.text((20, 18), title + " — " + label, fill=(241, 226, 194), font=font(22, True))
    if not pivot_only:
        safe = MIN_EDGE_CLEARANCE * 4
        draw.rectangle((ox + safe, oy + safe, ox + 512 - safe - 1, oy + 512 - safe - 1), outline=(236, 178, 58), width=2)
        bx0, by0, bx1, by1 = metric["logicalBbox"]
        draw.rectangle((ox + bx0 * 4, oy + by0 * 4, ox + bx1 * 4 - 1, oy + by1 * 4 - 1), outline=(255, 102, 126), width=2)
        draw.text((20, 602), f"bbox={metric['logicalBbox']}  body={metric['logicalBodyHeight']}px  min edge={metric['minimumEdgeClearance']}px", fill=(241, 226, 194), font=font(15))
    else:
        draw.text((20, 602), "pivot x=64 / 256 · foot baseline y=116 / 464", fill=(241, 226, 194), font=font(15))
    return board


def save_candidate(candidate: str, config: dict[str, Any]) -> tuple[Image.Image, Image.Image, dict[str, Any], list[dict[str, str]]]:
    raw_path = ASSET_ROOT / "raw" / config["acceptedRaw"]
    clean, chroma = chroma_key(Image.open(raw_path))
    isolated_path = ASSET_ROOT / "raw" / f"alistair-master-{candidate}-accepted-isolated.png"
    isolated_path.parent.mkdir(parents=True, exist_ok=True)
    clean.save(isolated_path)

    logical, metric = normalize_to_contract(clean)
    runtime = exact_x4(logical)
    logical_path = ASSET_ROOT / "logical-128" / f"alistair-master-{candidate}.png"
    runtime_path = ASSET_ROOT / "runtime-512" / f"alistair-master-{candidate}.png"
    logical_path.parent.mkdir(parents=True, exist_ok=True)
    runtime_path.parent.mkdir(parents=True, exist_ok=True)
    logical.save(logical_path)
    runtime.save(runtime_path)

    review_dir = ASSET_ROOT / "reviews"
    review_dir.mkdir(parents=True, exist_ok=True)
    title = config["title"]
    reviews: dict[str, Image.Image] = {
        "dark-background": review_board(runtime, title, (11, 15, 20)),
        "light-background": review_board(runtime, title, (232, 228, 218)),
        "silhouette": silhouette(runtime, title),
        "grayscale-value": grayscale(runtime, title),
        "pixel-inspection-400": review_board(runtime, title + " — 400% PIXEL INSPECTION", (11, 15, 20)),
        "armor-detail": detail_crop(logical, (40, 42, 88, 90), title + " — ARMOR DETAIL"),
        "helmet-detail": detail_crop(logical, (48, 28, 80, 60), title + " — HELMET DETAIL"),
        "sword-detail": detail_crop(logical, config["swordCrop"], title + " — SWORD DETAIL"),
        "geometry-overlay": geometry_board(runtime, title, metric, False),
        "pivot-baseline-overlay": geometry_board(runtime, title, metric, True),
    }
    review_entries: list[dict[str, str]] = []
    for name, image in reviews.items():
        path = review_dir / f"alistair-master-{candidate}-{name}.png"
        image.save(path)
        review_entries.append({"kind": name, "path": relative(path), "sha256": sha256(path)})

    metric.update({
        "schemaVersion": 1,
        "candidate": candidate.upper(),
        "status": "MASTER_CANDIDATE",
        "rawPath": relative(raw_path),
        "rawSha256": sha256(raw_path),
        "isolatedPath": relative(isolated_path),
        "isolatedSha256": sha256(isolated_path),
        "chroma": chroma,
        "logicalPath": relative(logical_path),
        "logicalSha256": sha256(logical_path),
        "runtimePath": relative(runtime_path),
        "runtimeSha256": sha256(runtime_path),
        "runtimeCanvas": [RUNTIME_SIZE, RUNTIME_SIZE],
        "exactNearestNeighborX4": True,
        "reviews": review_entries,
    })
    write_json(ASSET_ROOT / "qa" / f"alistair-master-{candidate}-metrics.json", metric)
    return logical, runtime, metric, review_entries


def comparison_board(runtimes: dict[str, Image.Image], metrics: dict[str, dict[str, Any]]) -> Path:
    board = Image.new("RGB", (1728, 700), (11, 15, 20))
    draw = ImageDraw.Draw(board)
    draw.text((32, 20), "ALISTAIR FROM-SCRATCH CHARACTER MASTER — OPERATOR COMPARISON", fill=(241, 226, 194), font=font(28, True))
    for index, candidate in enumerate(("a", "b", "c")):
        x = 32 + index * 560
        runtime = runtimes[candidate]
        board.paste(runtime, (x + 24, 104), runtime)
        draw.text((x + 24, 68), f"{candidate.upper()} · MASTER_CANDIDATE", fill=(241, 226, 194), font=font(22, True))
        metric = metrics[candidate]
        draw.text((x + 24, 630), f"body={metric['logicalBodyHeight']}px  pivot=64  baseline=116  min edge={metric['minimumEdgeClearance']}px", fill=(194, 203, 214), font=font(15))
    draw.text((32, 674), "Same 84px body-height target · 128 logical · exact nearest-neighbor ×4 · no operator selection applied", fill=(236, 178, 58), font=font(16, True))
    path = ASSET_ROOT / "reviews/alistair-master-abc-comparison.png"
    path.parent.mkdir(parents=True, exist_ok=True)
    board.save(path)
    return path


def attempt_record(candidate: str, attempt: int, raw_name: str, prompt_name: str, provenance_name: str, status: str, defect: str | None) -> dict[str, Any]:
    raw_path = ASSET_ROOT / "raw" / raw_name
    prompt_path = DOC_ROOT / "alistair-master" / prompt_name
    provenance_path = ASSET_ROOT / "provenance" / provenance_name
    provenance = json.loads(provenance_path.read_text(encoding="utf-8"))
    sources = provenance["request"]["sourceImages"]
    if len(sources) != 2:
        raise RuntimeError(f"{provenance_name}: expected exactly two approved visual inputs")
    source_hashes = {item["sha256"] for item in sources}
    if source_hashes != {REFERENCE_SHA256, SEED_B_SHA256}:
        raise RuntimeError(f"{provenance_name}: source authority hash set is invalid")
    return {
        "candidate": candidate,
        "attempt": attempt,
        "status": status,
        "selectedForNormalization": status == "MASTER_CANDIDATE",
        "defect": defect,
        "rawPath": relative(raw_path),
        "rawSha256": sha256(raw_path),
        "promptPath": relative(prompt_path),
        "promptSha256": sha256(prompt_path),
        "provenancePath": relative(provenance_path),
        "requestId": provenance.get("response", {}).get("requestId"),
        "modelRequested": provenance["request"]["model"],
        "qualityRequested": provenance["request"]["quality"],
        "modelReported": provenance.get("response", {}).get("modelReported"),
        "rawDimensions": provenance["output"]["rawDimensions"],
        "approvedStyleAuthorityInputs": 2,
        "legacyCharacterImageInputs": 0,
        "fallbackUsed": False,
    }


def main() -> int:
    if sha256(REFERENCE) != REFERENCE_SHA256:
        raise RuntimeError("CHARACTER_STYLE_REFERENCE_V1 hash mismatch")
    if sha256(SEED_B) != SEED_B_SHA256:
        raise RuntimeError("STYLE_SEED_B authority hash mismatch")

    logical: dict[str, Image.Image] = {}
    runtimes: dict[str, Image.Image] = {}
    metrics: dict[str, dict[str, Any]] = {}
    for candidate, config in CANDIDATES.items():
        logical[candidate], runtimes[candidate], metrics[candidate], _ = save_candidate(candidate, config)

    comparison_path = comparison_board(runtimes, metrics)
    attempts = [attempt_record(*record) for record in ATTEMPTS]

    scorecard: dict[str, Any] = {
        "schemaVersion": 1,
        "status": "PASS",
        "maximumCandidateStatus": "MASTER_CANDIDATE",
        "recommendedAlistairMaster": "B",
        "alistairCharacterMasterSelected": False,
        "candidates": {},
        "comparisonBoard": relative(comparison_path),
        "reviewNote": "Scores apply to accepted normalized candidates. Operator visual review and final selection remain authoritative.",
    }
    for candidate, scores in SCORES.items():
        scorecard["candidates"][candidate.upper()] = {
            "status": "MASTER_CANDIDATE",
            "totalOutOf75": sum(scores.values()),
            "scorecard": {name: {"scoreOutOf5": score, "status": "PASS" if score >= 3 else "FAIL"} for name, score in scores.items()},
            "criticalFailures": [],
        }
    write_json(ASSET_ROOT / "qa/alistair-master-scorecard.json", scorecard)

    manifest = {
        "schemaVersion": 1,
        "generatedAt": utc_now(),
        "baseline": "b109dab6714634ad11d066f1461ff58b3ffbbc62",
        "generationMode": "TEXT_PLUS_APPROVED_STYLE_AUTHORITIES",
        "characterStyleReference": "V1",
        "characterStyleReferenceRole": "PRIMARY_ARTISTIC_QUALITY_AUTHORITY",
        "styleReferencePath": relative(REFERENCE),
        "styleReferenceSha256": REFERENCE_SHA256,
        "characterStyleSeedV1": "B",
        "characterStyleSeedRole": "PRODUCTION_FEASIBILITY_AUTHORITY",
        "styleSeedPath": relative(SEED_B),
        "styleSeedSha256": SEED_B_SHA256,
        "approvedStyleAuthorityInputsPerGeneration": 2,
        "legacyCharacterImageInputsPerGeneration": 0,
        "model": MODEL,
        "quality": QUALITY,
        "fallbackUsed": False,
        "imageGenerationAttempts": len(attempts),
        "attempts": attempts,
        "normalization": {
            "logicalCanvas": [LOGICAL_SIZE, LOGICAL_SIZE],
            "runtimeCanvas": [RUNTIME_SIZE, RUNTIME_SIZE],
            "rawToLogicalResampling": "nearest-neighbor",
            "logicalToRuntimeResampling": "exact-nearest-neighbor-x4",
            "pivotLogical": PIVOT_X,
            "pivotRuntime": PIVOT_X * 4,
            "footBaselineLogical": FOOT_BASELINE,
            "footBaselineRuntime": FOOT_BASELINE * 4,
            "targetUprightBodyHeightLogical": TARGET_BODY_HEIGHT,
            "minimumEdgeClearanceLogical": MIN_EDGE_CLEARANCE,
            "independentFillScaling": False,
            "sharedBodyHeightTargetApplied": True,
        },
        "candidates": {candidate.upper(): metrics[candidate] for candidate in ("a", "b", "c")},
        "candidateStatus": {"A": "MASTER_CANDIDATE", "B": "MASTER_CANDIDATE", "C": "MASTER_CANDIDATE"},
        "comparisonBoard": relative(comparison_path),
        "recommendedAlistairMaster": "B",
        "alistairCharacterMasterSelected": False,
        "canonicalAssetsChanged": False,
        "runtimeChanged": False,
        "gameplayChanged": False,
        "combatLogicChanged": False,
        "vfxChanged": False,
    }
    write_json(ASSET_ROOT / "provenance/alistair-master-manifest.json", manifest)

    print(json.dumps({
        "status": "PASS",
        "logicalCandidates": {key.upper(): metrics[key]["logicalPath"] for key in metrics},
        "runtimeCandidates": {key.upper(): metrics[key]["runtimePath"] for key in metrics},
        "comparisonBoard": relative(comparison_path),
        "attempts": len(attempts),
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

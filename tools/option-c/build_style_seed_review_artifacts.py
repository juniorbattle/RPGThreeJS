#!/usr/bin/env python3
"""Build deterministic logical/runtime Option C style-seed candidates and review boards."""

from __future__ import annotations

from collections import deque
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[2]
ASSET_ROOT = ROOT / "public/assets/dev/option-c/style-seed"
DOC_ROOT = ROOT / "docs/art-direction/option-c/character-style-lock"
REFERENCE = DOC_ROOT / "references/character-style-reference-v1.png"
REFERENCE_SHA256 = "e4470e9506df2f4c84af286060e85b69983c87cb5bba27d1bb576f50847b7bd7"
MODEL = "gpt-image-2.5-sunburst-2026-09-08"
QUALITY = "max"
CLASSES = ("ranger", "knight", "priestess", "mage")
DISPLAY_NAMES = ("RANGER", "KNIGHT", "PRIESTESS", "MAGE")
ANCHOR_X = (256, 768, 1280, 1792)
LOGICAL_SIZE = 128
RUNTIME_SIZE = 512
PIVOT_X = 64
FOOT_BASELINE = 116
MIN_EDGE_CLEARANCE = 6
TARGET_MAX_FULL_EXTENT = 96
CHROMA_THRESHOLD = 150
MIN_COMPONENT_AREA = 6

CANDIDATES: dict[str, dict[str, Any]] = {
    "a": {
        "selected_raw": "style-seed-a-attempt-2-sunburst-raw.png",
        "selected_prompt": "style-seed-a-attempt-2.prompt.txt",
        "selected_provenance": "style-seed-a-attempt-2-generation.json",
        "palette_colors": 48,
        "title": "STYLE SEED A — CLEANEST / MOST TACTICAL",
    },
    "b": {
        "selected_raw": "style-seed-b-attempt-2-sunburst-raw.png",
        "selected_prompt": "style-seed-b-attempt-2.prompt.txt",
        "selected_provenance": "style-seed-b-attempt-2-generation.json",
        "palette_colors": 64,
        "title": "STYLE SEED B — BALANCED PREMIUM",
    },
    "c": {
        "selected_raw": "style-seed-c-attempt-2-sunburst-raw.png",
        "selected_prompt": "style-seed-c-attempt-2.prompt.txt",
        "selected_provenance": "style-seed-c-attempt-2-generation.json",
        "palette_colors": 80,
        "title": "STYLE SEED C — RICHER PREMIUM",
    },
}

SCORES: dict[str, dict[str, int]] = {
    "a": {
        "TRUE_PIXEL_ART_CONSTRUCTION": 5,
        "MODERNITY": 4,
        "TACTICAL_READABILITY": 5,
        "SILHOUETTE_DIFFERENTIATION": 5,
        "PROPORTION_COHERENCE": 4,
        "FACE_CONCEALMENT": 5,
        "PIXEL_CLUSTER_DISCIPLINE": 5,
        "MATERIAL_READABILITY": 4,
        "ANIMATION_FEASIBILITY": 5,
        "HD2D_ENVIRONMENT_COMPATIBILITY": 4,
        "ROSTER_COHERENCE": 4,
        "NO_PAINTERLY_DRIFT": 5,
    },
    "b": {
        "TRUE_PIXEL_ART_CONSTRUCTION": 5,
        "MODERNITY": 5,
        "TACTICAL_READABILITY": 4,
        "SILHOUETTE_DIFFERENTIATION": 5,
        "PROPORTION_COHERENCE": 4,
        "FACE_CONCEALMENT": 5,
        "PIXEL_CLUSTER_DISCIPLINE": 4,
        "MATERIAL_READABILITY": 5,
        "ANIMATION_FEASIBILITY": 4,
        "HD2D_ENVIRONMENT_COMPATIBILITY": 5,
        "ROSTER_COHERENCE": 5,
        "NO_PAINTERLY_DRIFT": 5,
    },
    "c": {
        "TRUE_PIXEL_ART_CONSTRUCTION": 4,
        "MODERNITY": 5,
        "TACTICAL_READABILITY": 4,
        "SILHOUETTE_DIFFERENTIATION": 5,
        "PROPORTION_COHERENCE": 4,
        "FACE_CONCEALMENT": 5,
        "PIXEL_CLUSTER_DISCIPLINE": 4,
        "MATERIAL_READABILITY": 5,
        "ANIMATION_FEASIBILITY": 3,
        "HD2D_ENVIRONMENT_COMPATIBILITY": 5,
        "ROSTER_COHERENCE": 5,
        "NO_PAINTERLY_DRIFT": 4,
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


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    name = "segoeuib.ttf" if bold else "segoeui.ttf"
    path = Path("C:/Windows/Fonts") / name
    if path.is_file():
        return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def chroma_key(image: Image.Image) -> Image.Image:
    rgba = np.array(image.convert("RGBA"), dtype=np.uint8)
    rgb = rgba[..., :3].astype(np.int32)
    distance_squared = (
        (rgb[..., 0] - 255) ** 2
        + rgb[..., 1] ** 2
        + (rgb[..., 2] - 255) ** 2
    )
    rgba[distance_squared < CHROMA_THRESHOLD**2, 3] = 0
    rgba[rgba[..., 3] == 0, :3] = 0
    return Image.fromarray(rgba, mode="RGBA")


def connected_components(mask: np.ndarray) -> tuple[np.ndarray, list[dict[str, Any]]]:
    height, width = mask.shape
    active = mask.reshape(-1).astype(np.uint8)
    visited = bytearray(width * height)
    labels = np.zeros(width * height, dtype=np.uint8)
    components: list[dict[str, Any]] = []

    for start in np.flatnonzero(active):
        start_i = int(start)
        if visited[start_i]:
            continue
        queue: deque[int] = deque([start_i])
        visited[start_i] = 1
        pixels: list[int] = []
        sum_x = 0
        sum_y = 0
        min_x = width
        min_y = height
        max_x = 0
        max_y = 0
        while queue:
            index = queue.popleft()
            y, x = divmod(index, width)
            pixels.append(index)
            sum_x += x
            sum_y += y
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)
            for dy in (-1, 0, 1):
                ny = y + dy
                if ny < 0 or ny >= height:
                    continue
                row = ny * width
                for dx in (-1, 0, 1):
                    if dx == 0 and dy == 0:
                        continue
                    nx = x + dx
                    if nx < 0 or nx >= width:
                        continue
                    neighbor = row + nx
                    if active[neighbor] and not visited[neighbor]:
                        visited[neighbor] = 1
                        queue.append(neighbor)

        area = len(pixels)
        if area < MIN_COMPONENT_AREA:
            continue
        centroid_x = sum_x / area
        centroid_y = sum_y / area
        group = min(range(4), key=lambda idx: abs(centroid_x - ANCHOR_X[idx]))
        labels[np.asarray(pixels, dtype=np.int64)] = group + 1
        components.append(
            {
                "area": area,
                "centroid": [round(centroid_x, 3), round(centroid_y, 3)],
                "bbox": [min_x, min_y, max_x + 1, max_y + 1],
                "assignedClass": CLASSES[group],
            }
        )

    return labels.reshape((height, width)), components


def isolate_groups(clean: Image.Image) -> tuple[list[Image.Image], list[dict[str, Any]], list[dict[str, Any]]]:
    array = np.array(clean, dtype=np.uint8)
    labels, components = connected_components(array[..., 3] > 0)
    groups: list[Image.Image] = []
    group_info: list[dict[str, Any]] = []

    for index, class_name in enumerate(CLASSES, start=1):
        keep = labels == index
        ys, xs = np.nonzero(keep)
        if len(xs) == 0:
            raise RuntimeError(f"No pixels assigned to {class_name}")
        x0, x1 = int(xs.min()), int(xs.max()) + 1
        y0, y1 = int(ys.min()), int(ys.max()) + 1
        isolated = array.copy()
        isolated[~keep, :] = 0
        crop = Image.fromarray(isolated, mode="RGBA").crop((x0, y0, x1, y1))
        groups.append(crop)
        group_info.append(
            {
                "class": class_name,
                "sourceBbox": [x0, y0, x1, y1],
                "sourceSize": [x1 - x0, y1 - y0],
                "componentCount": sum(1 for item in components if item["assignedClass"] == class_name),
            }
        )
    return groups, group_info, components


def quantize_rgba(image: Image.Image, colors: int) -> Image.Image:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    rgb = Image.new("RGB", rgba.size, (0, 0, 0))
    rgb.paste(rgba.convert("RGB"), mask=alpha)
    quantized = rgb.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    result = Image.merge("RGBA", (*quantized.split(), alpha))
    pixels = np.array(result, dtype=np.uint8)
    pixels[pixels[..., 3] == 0, :3] = 0
    return Image.fromarray(pixels, mode="RGBA")


def normalize_groups(
    groups: list[Image.Image], palette_colors: int
) -> tuple[list[Image.Image], float, list[dict[str, Any]]]:
    max_width = max(group.width for group in groups)
    max_height = max(group.height for group in groups)
    common_scale = min(
        (LOGICAL_SIZE - 2 * MIN_EDGE_CLEARANCE) / max_width,
        TARGET_MAX_FULL_EXTENT / max_height,
    )
    logical: list[Image.Image] = []
    metrics: list[dict[str, Any]] = []

    for class_name, group in zip(CLASSES, groups):
        width = max(1, round(group.width * common_scale))
        height = max(1, round(group.height * common_scale))
        resized = group.resize((width, height), Image.Resampling.NEAREST)
        canvas = Image.new("RGBA", (LOGICAL_SIZE, LOGICAL_SIZE), (0, 0, 0, 0))
        paste_x = PIVOT_X - width // 2
        paste_y = FOOT_BASELINE - height
        canvas.alpha_composite(resized, (paste_x, paste_y))
        canvas = quantize_rgba(canvas, palette_colors)
        bbox = canvas.getbbox()
        if bbox is None:
            raise RuntimeError(f"Empty normalized frame: {class_name}")
        x0, y0, x1, y1 = bbox
        edge_clearance = [x0, y0, LOGICAL_SIZE - x1, LOGICAL_SIZE - y1]
        logical.append(canvas)
        metrics.append(
            {
                "class": class_name,
                "logicalBbox": list(bbox),
                "logicalFullExtent": [x1 - x0, y1 - y0],
                "edgeClearance": edge_clearance,
                "minimumEdgeClearance": min(edge_clearance),
                "pivotLogicalX": PIVOT_X,
                "footBaselineLogical": FOOT_BASELINE,
                "sourceToLogicalScale": round(common_scale, 9),
                "paletteColorCeiling": palette_colors,
            }
        )
    return logical, common_scale, metrics


def assert_runtime_is_exact_x4(logical: Image.Image, runtime: Image.Image) -> None:
    source = np.array(logical, dtype=np.uint8)
    target = np.array(runtime, dtype=np.uint8)
    expected = np.repeat(np.repeat(source, 4, axis=0), 4, axis=1)
    if not np.array_equal(expected, target):
        raise RuntimeError("Runtime export is not an exact nearest-neighbor x4 transform")


def save_sprite_outputs(candidate: str, logical: list[Image.Image]) -> tuple[list[Image.Image], list[dict[str, Any]]]:
    logical_dir = ASSET_ROOT / "logical-128" / f"style-seed-{candidate}"
    runtime_dir = ASSET_ROOT / "runtime-512" / f"style-seed-{candidate}"
    logical_dir.mkdir(parents=True, exist_ok=True)
    runtime_dir.mkdir(parents=True, exist_ok=True)
    runtime: list[Image.Image] = []
    outputs: list[dict[str, Any]] = []

    logical_lineup = Image.new("RGBA", (LOGICAL_SIZE * 4, LOGICAL_SIZE), (0, 0, 0, 0))
    runtime_lineup = Image.new("RGBA", (RUNTIME_SIZE * 4, RUNTIME_SIZE), (0, 0, 0, 0))

    for index, (class_name, sprite) in enumerate(zip(CLASSES, logical)):
        logical_path = logical_dir / f"{class_name}.png"
        sprite.save(logical_path)
        enlarged = sprite.resize((RUNTIME_SIZE, RUNTIME_SIZE), Image.Resampling.NEAREST)
        assert_runtime_is_exact_x4(sprite, enlarged)
        runtime_path = runtime_dir / f"{class_name}.png"
        enlarged.save(runtime_path)
        logical_lineup.alpha_composite(sprite, (index * LOGICAL_SIZE, 0))
        runtime_lineup.alpha_composite(enlarged, (index * RUNTIME_SIZE, 0))
        runtime.append(enlarged)
        outputs.append(
            {
                "class": class_name,
                "logicalPath": logical_path.relative_to(ROOT).as_posix(),
                "logicalSha256": sha256(logical_path),
                "runtimePath": runtime_path.relative_to(ROOT).as_posix(),
                "runtimeSha256": sha256(runtime_path),
                "exactNearestNeighborX4": True,
            }
        )

    logical_lineup_path = ASSET_ROOT / "logical-128" / f"style-seed-{candidate}-lineup.png"
    runtime_lineup_path = ASSET_ROOT / "runtime-512" / f"style-seed-{candidate}-lineup.png"
    logical_lineup.save(logical_lineup_path)
    runtime_lineup.save(runtime_lineup_path)
    return runtime, outputs


def draw_header(draw: ImageDraw.ImageDraw, title: str, color: tuple[int, int, int, int]) -> None:
    draw.text((24, 14), title, fill=color, font=font(28, bold=True))


def make_lineup_board(
    path: Path,
    title: str,
    sprites: list[Image.Image],
    background: tuple[int, int, int, int],
    foreground: tuple[int, int, int, int],
) -> None:
    board = Image.new("RGBA", (2048, 640), background)
    draw = ImageDraw.Draw(board)
    draw_header(draw, title, foreground)
    for index, (label, sprite) in enumerate(zip(DISPLAY_NAMES, sprites)):
        board.alpha_composite(sprite, (index * 512, 58))
        box = draw.textbbox((0, 0), label, font=font(24, bold=True))
        width = box[2] - box[0]
        draw.text((index * 512 + (512 - width) // 2, 582), label, fill=foreground, font=font(24, bold=True))
    board.convert("RGB").save(path)


def make_silhouette(sprite: Image.Image, color: tuple[int, int, int]) -> Image.Image:
    alpha = sprite.getchannel("A")
    result = Image.new("RGBA", sprite.size, (*color, 0))
    result.putalpha(alpha)
    return result


def make_grayscale(sprite: Image.Image) -> Image.Image:
    gray = ImageOps.grayscale(sprite.convert("RGB"))
    return Image.merge("RGBA", (gray, gray, gray, sprite.getchannel("A")))


def make_material_board(path: Path, title: str, logical: list[Image.Image]) -> None:
    board = Image.new("RGBA", (1280, 380), (14, 18, 25, 255))
    draw = ImageDraw.Draw(board)
    draw_header(draw, title + " — MATERIAL DETAIL CROPS", (235, 223, 190, 255))
    for index, (label, sprite) in enumerate(zip(DISPLAY_NAMES, logical)):
        bbox = sprite.getbbox()
        assert bbox is not None
        x0, y0, x1, y1 = bbox
        center_x = (x0 + x1) // 2
        center_y = y0 + max(16, int((y1 - y0) * 0.42))
        crop_box = (
            max(0, min(96, center_x - 16)),
            max(0, min(96, center_y - 16)),
            max(0, min(96, center_x - 16)) + 32,
            max(0, min(96, center_y - 16)) + 32,
        )
        crop = sprite.crop(crop_box).resize((256, 256), Image.Resampling.NEAREST)
        left = index * 320 + 32
        top = 72
        tile = Image.new("RGBA", (256, 256), (32, 36, 43, 255))
        tile.alpha_composite(crop)
        board.alpha_composite(tile, (left, top))
        for grid in range(0, 257, 8):
            draw.line((left + grid, top, left + grid, top + 256), fill=(255, 255, 255, 24), width=1)
            draw.line((left, top + grid, left + 256, top + grid), fill=(255, 255, 255, 24), width=1)
        draw.text((left, 338), label, fill=(235, 223, 190, 255), font=font(18, bold=True))
    board.convert("RGB").save(path)


def make_geometry_board(
    path: Path,
    title: str,
    sprites: list[Image.Image],
    metrics: list[dict[str, Any]],
    mode: str,
) -> None:
    board = Image.new("RGBA", (2048, 640), (11, 15, 22, 255))
    draw = ImageDraw.Draw(board)
    draw_header(draw, title + " — " + mode.replace("_", " ").upper(), (235, 223, 190, 255))
    top = 58
    for index, (label, sprite, metric) in enumerate(zip(DISPLAY_NAMES, sprites, metrics)):
        left = index * 512
        if mode == "body_scale":
            sprite = make_silhouette(sprite, (30, 30, 34))
        board.alpha_composite(sprite, (left, top))
        pivot_x = left + PIVOT_X * 4
        baseline_y = top + FOOT_BASELINE * 4
        target_top_y = top + (FOOT_BASELINE - 84) * 4
        if mode in {"geometry", "baseline", "body_scale"}:
            draw.line((pivot_x, top, pivot_x, top + 512), fill=(0, 220, 235, 220), width=2)
            draw.line((left, baseline_y, left + 512, baseline_y), fill=(255, 76, 92, 230), width=3)
        if mode in {"geometry", "body_scale"}:
            x0, y0, x1, y1 = metric["logicalBbox"]
            draw.rectangle(
                (left + x0 * 4, top + y0 * 4, left + x1 * 4 - 1, top + y1 * 4 - 1),
                outline=(255, 198, 71, 255),
                width=2,
            )
        if mode == "body_scale":
            draw.line((left, target_top_y, left + 512, target_top_y), fill=(123, 244, 145, 220), width=2)
        extent = metric["logicalFullExtent"]
        caption = f"{label}  extent {extent[0]}x{extent[1]}  scale {metric['sourceToLogicalScale']:.5f}"
        draw.text((left + 12, 582), caption, fill=(235, 223, 190, 255), font=font(15, bold=True))
    board.convert("RGB").save(path)


def make_review_boards(
    candidate: str,
    title: str,
    logical: list[Image.Image],
    runtime: list[Image.Image],
    metrics: list[dict[str, Any]],
) -> list[str]:
    review_root = ASSET_ROOT / "reviews"
    review_root.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []

    def review_path(suffix: str) -> Path:
        path = review_root / f"style-seed-{candidate}-{suffix}.png"
        paths.append(path)
        return path

    make_lineup_board(
        review_path("four-class-lineup"), title, runtime, (22, 26, 34, 255), (235, 223, 190, 255)
    )
    make_lineup_board(
        review_path("dark-background"), title + " — DARK", runtime, (5, 8, 13, 255), (238, 229, 205, 255)
    )
    make_lineup_board(
        review_path("light-background"), title + " — LIGHT", runtime, (238, 234, 222, 255), (28, 30, 34, 255)
    )
    make_lineup_board(
        review_path("silhouette"),
        title + " — SILHOUETTE ONLY",
        [make_silhouette(sprite, (8, 8, 10)) for sprite in runtime],
        (238, 234, 222, 255),
        (28, 30, 34, 255),
    )
    make_lineup_board(
        review_path("grayscale-value"),
        title + " — GRAYSCALE / VALUE",
        [make_grayscale(sprite) for sprite in runtime],
        (18, 20, 24, 255),
        (235, 235, 235, 255),
    )
    make_lineup_board(
        review_path("pixel-inspection-400"),
        title + " — 400% NEAREST-NEIGHBOR PIXEL INSPECTION",
        [sprite.resize((512, 512), Image.Resampling.NEAREST) for sprite in logical],
        (18, 22, 28, 255),
        (235, 223, 190, 255),
    )
    make_material_board(review_path("material-detail-crops"), title, logical)
    make_geometry_board(review_path("geometry-overlay"), title, runtime, metrics, "geometry")
    make_geometry_board(review_path("baseline-overlay"), title, runtime, metrics, "baseline")
    make_geometry_board(review_path("body-scale-comparison"), title, runtime, metrics, "body_scale")
    return [path.relative_to(ROOT).as_posix() for path in paths]


def make_abc_comparison(all_logical: dict[str, list[Image.Image]]) -> Path:
    board = Image.new("RGBA", (1152, 960), (10, 14, 20, 255))
    draw = ImageDraw.Draw(board)
    draw.text((24, 16), "OPTION C — STYLE SEED A / B / C COMPARISON", fill=(235, 223, 190, 255), font=font(28, True))
    for row, candidate in enumerate(("a", "b", "c")):
        y = 80 + row * 288
        draw.text((20, y + 112), candidate.upper(), fill=(235, 223, 190, 255), font=font(28, True))
        for col, sprite in enumerate(all_logical[candidate]):
            preview = sprite.resize((256, 256), Image.Resampling.NEAREST)
            board.alpha_composite(preview, (96 + col * 256, y))
    path = ASSET_ROOT / "reviews/style-seed-abc-comparison.png"
    board.convert("RGB").save(path)
    return path


def validate_generation_provenance(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    request = payload.get("request", {})
    sources = request.get("sourceImages", [])
    if payload.get("status") != "SUCCEEDED":
        raise RuntimeError(f"Generation did not succeed: {path}")
    if request.get("model") != MODEL or request.get("quality") != QUALITY:
        raise RuntimeError(f"Model or quality drift: {path}")
    if len(sources) != 1 or sources[0].get("sha256") != REFERENCE_SHA256:
        raise RuntimeError(f"Style-reference input policy violation: {path}")
    return payload


def attempt_record(candidate: str, attempt: int, selected: bool) -> dict[str, Any]:
    if attempt == 1:
        raw_name = f"style-seed-{candidate}-sunburst-raw.png"
        provenance_name = f"style-seed-{candidate}-generation.json"
        prompt_name = f"style-seed-{candidate}.prompt.txt"
        status = "REJECTED_PROPORTIONS"
        defect = "2x2 raw introduced row-scale drift and cell-boundary overflow"
    else:
        raw_name = f"style-seed-{candidate}-attempt-2-sunburst-raw.png"
        provenance_name = f"style-seed-{candidate}-attempt-2-generation.json"
        prompt_name = f"style-seed-{candidate}-attempt-2.prompt.txt"
        status = "SELECTED_STYLE_AUTHORITY" if candidate == "b" else "VALID_ALTERNATE_NOT_SELECTED"
        defect = None
    raw_path = ASSET_ROOT / "raw" / raw_name
    provenance_path = ASSET_ROOT / "provenance" / provenance_name
    prompt_path = DOC_ROOT / "style-seed" / prompt_name
    generation = validate_generation_provenance(provenance_path)
    if generation["output"]["sha256"] != sha256(raw_path):
        raise RuntimeError(f"Raw output hash drift: {raw_path}")
    return {
        "candidate": candidate.upper(),
        "attempt": attempt,
        "status": status,
        "selectedForNormalization": selected,
        "defect": defect,
        "rawPath": raw_path.relative_to(ROOT).as_posix(),
        "rawSha256": sha256(raw_path),
        "promptPath": prompt_path.relative_to(ROOT).as_posix(),
        "promptSha256": generation["request"]["promptSha256"],
        "provenancePath": provenance_path.relative_to(ROOT).as_posix(),
        "requestId": generation.get("response", {}).get("requestId"),
        "modelRequested": generation["request"]["model"],
        "qualityRequested": generation["request"]["quality"],
        "modelReported": generation.get("response", {}).get("modelReported"),
        "rawDimensions": generation["output"]["rawDimensions"],
        "approvedStyleReferenceInputs": 1,
        "legacyCharacterImageInputs": 0,
        "fallbackUsed": False,
    }


def main() -> int:
    if sha256(REFERENCE) != REFERENCE_SHA256:
        raise RuntimeError("CHARACTER_STYLE_REFERENCE_V1 hash drift")

    for directory in ("logical-128", "runtime-512", "reviews", "qa", "provenance"):
        (ASSET_ROOT / directory).mkdir(parents=True, exist_ok=True)

    all_logical: dict[str, list[Image.Image]] = {}
    candidate_results: dict[str, Any] = {}
    attempts: list[dict[str, Any]] = []

    for candidate, config in CANDIDATES.items():
        attempts.append(attempt_record(candidate, 1, False))
        attempts.append(attempt_record(candidate, 2, True))
        raw_path = ASSET_ROOT / "raw" / config["selected_raw"]
        clean = chroma_key(Image.open(raw_path))
        clean_path = ASSET_ROOT / "raw" / f"style-seed-{candidate}-attempt-2-clean.png"
        clean.save(clean_path)
        groups, source_metrics, components = isolate_groups(clean)
        logical, common_scale, metrics = normalize_groups(groups, config["palette_colors"])
        runtime, outputs = save_sprite_outputs(candidate, logical)
        reviews = make_review_boards(candidate, config["title"], logical, runtime, metrics)
        all_logical[candidate] = logical

        for metric, source_metric in zip(metrics, source_metrics):
            metric.update(source_metric)
            if metric["minimumEdgeClearance"] < MIN_EDGE_CLEARANCE:
                raise RuntimeError(f"Edge clearance failed: {candidate} {metric['class']}")
            if metric["logicalBbox"][3] != FOOT_BASELINE:
                raise RuntimeError(f"Baseline failed: {candidate} {metric['class']}")

        scorecard = {
            key: {"scoreOutOf5": score, "status": "PASS" if score >= 3 else "FAIL"}
            for key, score in SCORES[candidate].items()
        }
        final_status = "SELECTED_STYLE_AUTHORITY" if candidate == "b" else "VALID_ALTERNATE_NOT_SELECTED"
        candidate_payload = {
            "candidateId": f"STYLE_SEED_{candidate.upper()}",
            "status": final_status,
            "selectedAttempt": 2,
            "rawPath": raw_path.relative_to(ROOT).as_posix(),
            "rawSha256": sha256(raw_path),
            "cleanRawPath": clean_path.relative_to(ROOT).as_posix(),
            "cleanRawSha256": sha256(clean_path),
            "logicalCanvas": [128, 128],
            "runtimeCanvas": [512, 512],
            "upscale": "NEAREST_NEIGHBOR_X4",
            "pivotLogical": 64,
            "pivotRuntime": 256,
            "footBaselineLogical": 116,
            "footBaselineRuntime": 464,
            "targetUprightBodyHeightLogical": "approximately 84px",
            "commonSourceToLogicalScale": round(common_scale, 9),
            "perClassIndependentScaling": False,
            "paletteColorCeiling": config["palette_colors"],
            "chromaThreshold": CHROMA_THRESHOLD,
            "componentCount": len(components),
            "classes": metrics,
            "outputs": outputs,
            "reviews": reviews,
            "scorecard": scorecard,
            "criticalFailures": [],
            "operatorSelectionRequired": False,
            "operatorSelected": candidate == "b",
        }
        qa_path = ASSET_ROOT / "qa" / f"style-seed-{candidate}-metrics.json"
        write_json(qa_path, candidate_payload)
        candidate_results[candidate.upper()] = candidate_payload

    comparison_path = make_abc_comparison(all_logical)
    scorecard_payload = {
        "schemaVersion": 1,
        "status": "PASS",
        "maximumCandidateStatus": "SELECTED_STYLE_AUTHORITY",
        "characterStyleSeedV1": "B",
        "recommendedCandidate": "B",
        "finalStyleSeedSelected": True,
        "candidates": {
            key: {
                "status": value["status"],
                "scorecard": value["scorecard"],
                "criticalFailures": value["criticalFailures"],
            }
            for key, value in candidate_results.items()
        },
        "comparisonBoard": comparison_path.relative_to(ROOT).as_posix(),
        "reviewNote": "Scores evaluate normalized logical sprites. The operator selected B as CHARACTER_STYLE_SEED_V1; A and C remain preserved valid alternates.",
    }
    write_json(ASSET_ROOT / "qa/style-seed-scorecard.json", scorecard_payload)

    manifest = {
        "schemaVersion": 1,
        "generatedAt": utc_now(),
        "doctrineStatus": "LOCKED",
        "characterStyleReference": "V1",
        "characterStyleReferenceRole": "PRIMARY_ARTISTIC_QUALITY_AUTHORITY",
        "styleReferencePath": REFERENCE.relative_to(ROOT).as_posix(),
        "styleReferenceSha256": REFERENCE_SHA256,
        "characterStyleSeedV1": "B",
        "characterStyleSeedRole": "PRODUCTION_FEASIBILITY_AUTHORITY",
        "generationMode": "TEXT_PLUS_APPROVED_STYLE_REFERENCE",
        "approvedStyleReferenceInputsPerGeneration": 1,
        "legacyCharacterImageInputsPerGeneration": 0,
        "model": MODEL,
        "quality": QUALITY,
        "fallbackUsed": False,
        "generationAttempts": len(attempts),
        "attempts": attempts,
        "normalization": {
            "rawToLogicalResampling": "nearest-neighbor",
            "logicalCanvas": [128, 128],
            "runtimeCanvas": [512, 512],
            "logicalToRuntimeResampling": "exact-nearest-neighbor-x4",
            "pivotLogical": 64,
            "pivotRuntime": 256,
            "footBaselineLogical": 116,
            "footBaselineRuntime": 464,
            "targetUprightBodyHeightLogical": "approximately 84px",
            "independentPerClassScaling": False,
        },
        "candidateStatus": {"A": "VALID_ALTERNATE_NOT_SELECTED", "B": "SELECTED_STYLE_AUTHORITY", "C": "VALID_ALTERNATE_NOT_SELECTED"},
        "comparisonBoard": comparison_path.relative_to(ROOT).as_posix(),
        "recommendedCandidate": "B",
        "finalStyleSeedSelected": True,
        "canonicalAssetsChanged": False,
        "runtimeChanged": False,
        "gameplayChanged": False,
        "combatLogicChanged": False,
        "vfxChanged": False,
    }
    write_json(ASSET_ROOT / "provenance/style-seed-manifest.json", manifest)
    print(json.dumps({
        "status": "PASS",
        "generationAttempts": len(attempts),
        "candidates": manifest["candidateStatus"],
        "recommendedCandidate": manifest["recommendedCandidate"],
        "comparisonBoard": manifest.get("comparisonBoard", comparison_path.relative_to(ROOT).as_posix()),
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

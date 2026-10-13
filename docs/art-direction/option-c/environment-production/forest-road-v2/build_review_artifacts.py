from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageStat


ROOT = Path(__file__).resolve().parents[5]
ASSET_ROOT = ROOT / "public/assets/dev/option-c/environments/forest-road-v2"
REVIEW_ROOT = ASSET_ROOT / "reviews"
QA_ROOT = ASSET_ROOT / "qa"

SURFACES = {
    "travel": ["a", "b", "c"],
    "tableau": ["a", "b", "c"],
    "strategic": ["a", "b", "c"],
    "combat-stage": ["a", "b", "c"],
}

RECOMMENDED = {
    "travel": "b",
    "tableau": "b",
    "strategic": "b",
    "combat-stage": "c",
}

ZONES = {
    "tableau": {
        "left_1": (0.10, 0.53, 0.26, 0.88),
        "left_2": (0.25, 0.53, 0.41, 0.88),
        "center": (0.42, 0.53, 0.58, 0.88),
        "right_1": (0.59, 0.53, 0.75, 0.88),
        "right_2": (0.74, 0.53, 0.90, 0.88),
        "dialogue_ui_safe": (0.25, 0.05, 0.75, 0.34),
    },
    "strategic": {
        "party": (0.08, 0.56, 0.38, 0.88),
        "center": (0.35, 0.47, 0.65, 0.82),
        "enemy": (0.62, 0.56, 0.92, 0.88),
        "top_ui_safe": (0.00, 0.00, 1.00, 0.18),
    },
    "combat-stage": {
        "attacker": (0.08, 0.55, 0.35, 0.86),
        "action_lane": (0.30, 0.43, 0.70, 0.77),
        "target": (0.65, 0.55, 0.92, 0.86),
        "top_ui_safe": (0.00, 0.00, 1.00, 0.16),
    },
}


def image_path(surface: str, candidate: str) -> Path:
    return ASSET_ROOT / surface / f"forest-road-v2-{surface}-{candidate}.png"


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        Path("C:/Windows/Fonts/seguisb.ttf"),
        Path("C:/Windows/Fonts/segoeui.ttf"),
        Path("C:/Windows/Fonts/arial.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def normalized_box(image: Image.Image, box: tuple[float, float, float, float]) -> tuple[int, int, int, int]:
    width, height = image.size
    return (
        round(box[0] * width),
        round(box[1] * height),
        round(box[2] * width),
        round(box[3] * height),
    )


def zone_metrics(image: Image.Image, box: tuple[float, float, float, float]) -> dict[str, float]:
    gray = image.convert("L").crop(normalized_box(image, box))
    stat = ImageStat.Stat(gray)
    histogram = gray.histogram()
    total = sum(histogram)
    cut_low = total * 0.05
    cut_high = total * 0.95
    running = 0
    p05 = 0
    p95 = 255
    for value, count in enumerate(histogram):
        running += count
        if running >= cut_low:
            p05 = value
            break
    running = 0
    for value, count in enumerate(histogram):
        running += count
        if running >= cut_high:
            p95 = value
            break
    edges = gray.filter(ImageFilter.FIND_EDGES)
    edge_mean = ImageStat.Stat(edges).mean[0]
    return {
        "luma_mean": round(stat.mean[0], 2),
        "luma_stddev": round(stat.stddev[0], 2),
        "p05": p05,
        "p95": p95,
        "edge_mean": round(edge_mean, 2),
    }


def label(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, *, fill: str = "white", size: int = 34) -> None:
    font = load_font(size)
    x, y = xy
    bbox = draw.textbbox((x, y), text, font=font, stroke_width=1)
    pad_x, pad_y = 14, 8
    draw.rounded_rectangle(
        (bbox[0] - pad_x, bbox[1] - pad_y, bbox[2] + pad_x, bbox[3] + pad_y),
        radius=8,
        fill=(8, 14, 24, 220),
        outline=(218, 176, 82, 255),
        width=2,
    )
    draw.text((x, y), text, font=font, fill=fill, stroke_fill=(0, 0, 0, 255), stroke_width=1)


def build_abc_board(surface: str) -> Path:
    thumb_size = (960, 540)
    header_height = 62
    canvas = Image.new("RGB", (thumb_size[0] * 3, thumb_size[1] + header_height), "#08101b")
    draw = ImageDraw.Draw(canvas)
    for index, candidate in enumerate(SURFACES[surface]):
        with Image.open(image_path(surface, candidate)) as source:
            thumb = source.convert("RGB").resize(thumb_size, Image.Resampling.LANCZOS)
        x = index * thumb_size[0]
        canvas.paste(thumb, (x, header_height))
        selected = RECOMMENDED[surface] == candidate
        title = f"{surface.upper()} {candidate.upper()}" + ("  |  RECOMMENDED" if selected else "")
        draw.rectangle((x, 0, x + thumb_size[0], header_height), fill="#08101b")
        draw.text(
            (x + 24, 14),
            title,
            font=load_font(28),
            fill="#f3d98d" if selected else "#ffffff",
        )
        if index:
            draw.line((x, 0, x, canvas.height), fill="#d8b052", width=3)
    output = REVIEW_ROOT / f"forest-road-v2-{surface}-abc-comparison.png"
    canvas.save(output, optimize=True)
    return output


def build_family_board() -> Path:
    cell = (960, 540)
    canvas = Image.new("RGB", (cell[0] * 2, cell[1] * 2), "#08101b")
    placements = [
        ("travel", 0, 0),
        ("tableau", 1, 0),
        ("strategic", 0, 1),
        ("combat-stage", 1, 1),
    ]
    for surface, column, row in placements:
        candidate = RECOMMENDED[surface]
        with Image.open(image_path(surface, candidate)) as source:
            thumb = source.convert("RGB").resize(cell, Image.Resampling.LANCZOS)
        x, y = column * cell[0], row * cell[1]
        canvas.paste(thumb, (x, y))
        draw = ImageDraw.Draw(canvas, "RGBA")
        label(draw, (x + 24, y + 20), f"{surface.upper()} {candidate.upper()}  |  RECOMMENDED", size=26)
    draw = ImageDraw.Draw(canvas)
    draw.line((cell[0], 0, cell[0], canvas.height), fill="#d8b052", width=3)
    draw.line((0, cell[1], canvas.width, cell[1]), fill="#d8b052", width=3)
    output = REVIEW_ROOT / "forest-road-v2-family-coherence-recommended.png"
    canvas.save(output, optimize=True)
    return output


def overlay_box(
    overlay: Image.Image,
    box: tuple[float, float, float, float],
    text: str,
    fill: tuple[int, int, int, int],
) -> None:
    layer = Image.new("RGBA", overlay.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")
    pixels = normalized_box(overlay, box)
    draw.rounded_rectangle(pixels, radius=12, fill=fill, outline=(255, 236, 171, 240), width=4)
    font = load_font(25)
    bbox = draw.textbbox((0, 0), text, font=font)
    x = pixels[0] + (pixels[2] - pixels[0] - (bbox[2] - bbox[0])) // 2
    y = pixels[1] + 12
    draw.text((x, y), text, font=font, fill="white", stroke_width=2, stroke_fill="black")
    overlay.alpha_composite(layer)


def build_tableau_overlay() -> Path:
    source_path = image_path("tableau", RECOMMENDED["tableau"])
    with Image.open(source_path) as source:
        base = source.convert("RGBA")
    overlay = base.copy()
    anchor_names = ["LEFT-1", "LEFT-2", "CENTER", "RIGHT-1", "RIGHT-2"]
    colors = [
        (32, 136, 203, 74),
        (42, 166, 214, 74),
        (147, 94, 201, 74),
        (212, 124, 45, 74),
        (196, 75, 61, 74),
    ]
    for anchor, name, color in zip(
        ["left_1", "left_2", "center", "right_1", "right_2"],
        anchor_names,
        colors,
    ):
        overlay_box(overlay, ZONES["tableau"][anchor], name, color)
    overlay_box(overlay, ZONES["tableau"]["dialogue_ui_safe"], "DIALOGUE UI SAFE", (17, 24, 38, 100))
    overlay_box(overlay, (0.00, 0.42, 0.08, 0.90), "ENTRY", (27, 125, 82, 78))
    overlay_box(overlay, (0.92, 0.42, 1.00, 0.90), "EXIT", (27, 125, 82, 78))
    output = REVIEW_ROOT / "forest-road-v2-tableau-b-staging-overlay.png"
    overlay.convert("RGB").save(output, optimize=True)
    return output


def build_strategic_overlay() -> Path:
    source_path = image_path("strategic", RECOMMENDED["strategic"])
    with Image.open(source_path) as source:
        overlay = source.convert("RGBA")
    overlay_box(overlay, ZONES["strategic"]["party"], "PARTY ZONE", (34, 143, 212, 76))
    overlay_box(overlay, ZONES["strategic"]["center"], "CENTER ENGAGEMENT", (146, 92, 202, 70))
    overlay_box(overlay, ZONES["strategic"]["enemy"], "ENEMY ZONE", (211, 69, 62, 76))
    overlay_box(overlay, ZONES["strategic"]["top_ui_safe"], "TOP UI SAFE", (17, 24, 38, 92))
    overlay_box(overlay, (0.00, 0.82, 0.22, 1.00), "LOWER UI SAFE", (17, 24, 38, 92))
    overlay_box(overlay, (0.78, 0.82, 1.00, 1.00), "LOWER UI SAFE", (17, 24, 38, 92))
    output = REVIEW_ROOT / "forest-road-v2-strategic-b-dev-overlay.png"
    overlay.convert("RGB").save(output, optimize=True)
    return output


def build_machine_qa(generated_outputs: list[Path]) -> Path:
    report: dict[str, object] = {
        "environment_family": "FOREST_ROAD_V2",
        "pipeline": {
            "visual_model": "baked_raster",
            "runtime_object_model": "none",
            "collision_model": "none",
            "engine_target": "project-native-review-only",
        },
        "expected_dimensions": [1672, 941],
        "recommendations": RECOMMENDED,
        "candidates": {},
        "generated_review_artifacts": [str(path.relative_to(ROOT)).replace("\\", "/") for path in generated_outputs],
    }
    candidate_report: dict[str, object] = {}
    for surface, candidates in SURFACES.items():
        surface_report: dict[str, object] = {}
        for candidate in candidates:
            path = image_path(surface, candidate)
            with Image.open(path) as image:
                entry: dict[str, object] = {
                    "path": str(path.relative_to(ROOT)).replace("\\", "/"),
                    "sha256": sha256(path),
                    "width": image.width,
                    "height": image.height,
                    "mode": image.mode,
                    "dimension_pass": image.size == (1672, 941),
                }
                if surface in ZONES:
                    entry["zone_metrics"] = {
                        zone: zone_metrics(image, box)
                        for zone, box in ZONES[surface].items()
                    }
                surface_report[candidate] = entry
        candidate_report[surface] = surface_report
    report["candidates"] = candidate_report
    output = QA_ROOT / "forest-road-v2-machine-qa.json"
    output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return output


def main() -> None:
    REVIEW_ROOT.mkdir(parents=True, exist_ok=True)
    QA_ROOT.mkdir(parents=True, exist_ok=True)
    expected = [image_path(surface, candidate) for surface, candidates in SURFACES.items() for candidate in candidates]
    missing = [str(path) for path in expected if not path.exists()]
    if missing:
        raise SystemExit("Missing candidates:\n" + "\n".join(missing))
    generated = [build_abc_board(surface) for surface in SURFACES]
    generated.append(build_family_board())
    generated.append(build_tableau_overlay())
    generated.append(build_strategic_overlay())
    qa_path = build_machine_qa(generated)
    print(json.dumps({"review_artifacts": [str(path) for path in generated], "qa": str(qa_path)}, indent=2))


if __name__ == "__main__":
    main()

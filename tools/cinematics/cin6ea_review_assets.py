#!/usr/bin/env python3
"""Create deterministic CIN-6E-A review sheets and layout guides."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[2]
COLORS = {
    "background": (10, 14, 21),
    "panel": (19, 25, 35),
    "gold": (221, 183, 112),
    "text": (238, 235, 226),
    "muted": (160, 169, 181),
    "safe": (54, 179, 126),
    "danger": (213, 79, 79),
    "lane": (74, 141, 214),
}


def font(size: int) -> ImageFont.ImageFont:
    candidates = [
        Path("C:/Windows/Fonts/segoeui.ttf"),
        Path("C:/Windows/Fonts/arial.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


def open_rgb(path: Path) -> Image.Image:
    with Image.open(path) as image:
        background = Image.new("RGBA", image.size, (20, 24, 30, 255))
        if image.mode == "RGBA":
            background.alpha_composite(image)
            return background.convert("RGB")
        return image.convert("RGB")


def write_sheet(title: str, frames: list[tuple[str, Path]], output: Path, columns: int, cell: tuple[int, int]) -> None:
    margin, label_height, title_height = 22, 42, 64
    rows = (len(frames) + columns - 1) // columns
    width = margin * (columns + 1) + cell[0] * columns
    height = margin * 2 + title_height + rows * (cell[1] + label_height)
    sheet = Image.new("RGB", (width, height), COLORS["background"])
    draw = ImageDraw.Draw(sheet)
    draw.text((margin, margin), title, fill=COLORS["gold"], font=font(26))
    for index, (label, path) in enumerate(frames):
        row, column = divmod(index, columns)
        x = margin + column * (cell[0] + margin)
        y = margin + title_height + row * (cell[1] + label_height)
        image = ImageOps.fit(open_rgb(path), cell, method=Image.Resampling.LANCZOS)
        sheet.paste(image, (x, y))
        draw.rectangle((x, y, x + cell[0] - 1, y + cell[1] - 1), outline=(70, 78, 91), width=1)
        draw.text((x + 4, y + cell[1] + 8), label, fill=COLORS["text"], font=font(16))
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, format="PNG", optimize=True)


def gold_sheets(root: Path, only_id: str | None = None) -> None:
    for analysis_path in sorted(root.glob("*/analysis.json")):
        analysis = json.loads(analysis_path.read_text(encoding="utf-8"))
        if only_id is not None and analysis["id"] != only_id:
            continue
        frames = [
            (f"{entry['label']} @ {entry['timestampSeconds']:.3f}s", ROOT / entry["path"])
            for entry in analysis["selectedFrames"]
        ]
        write_sheet(f"GOLD forensic set — {analysis['id']}", frames, analysis_path.parent / "selected_frames.png", 3, (640, 360))
        strip = [
            (f"{entry['timestampSeconds']:.2f}s", ROOT / entry["path"])
            for entry in analysis["stripFrames"]
        ]
        write_sheet(f"GOLD uniform strip — {analysis['id']}", strip, analysis_path.parent / "uniform_strip.png", 4, (400, 225))
        sampled_metrics = []
        previous = None
        for entry in analysis["stripFrames"]:
            current = open_rgb(ROOT / entry["path"]).resize((320, 180), Image.Resampling.BILINEAR)
            if previous is not None:
                left = list(previous.get_flattened_data())
                right = list(current.get_flattened_data())
                mean_absolute_difference = sum(
                    abs(a - b) for p1, p2 in zip(left, right) for a, b in zip(p1, p2)
                ) / (len(left) * 3 * 255)
                histogram_left = previous.histogram()
                histogram_right = current.histogram()
                histogram_l1 = sum(abs(a - b) for a, b in zip(histogram_left, histogram_right)) / (2 * 320 * 180 * 3)
                sampled_metrics.append({
                    "fromTimestampSeconds": previous_timestamp,
                    "toTimestampSeconds": entry["timestampSeconds"],
                    "normalizedMeanAbsoluteDifference": round(mean_absolute_difference, 6),
                    "normalizedHistogramL1": round(histogram_l1, 6),
                    "candidate": mean_absolute_difference >= 0.14 or histogram_l1 >= 0.2,
                })
            previous = current
            previous_timestamp = entry["timestampSeconds"]
        analysis["sampledContinuitySignals"] = {
            "method": "adjacent 320x180 RGB samples from the uniform strip",
            "thresholds": {"normalizedMeanAbsoluteDifference": 0.14, "normalizedHistogramL1": 0.2},
            "pairs": sampled_metrics,
            "candidatePairs": [metric for metric in sampled_metrics if metric["candidate"]],
            "limitations": "These signals flag review points; they do not prove editorial cuts or character identity.",
        }
        analysis["analysisSha256"] = hashlib.sha256(
            json.dumps({key: value for key, value in analysis.items() if key != "analysisSha256"}, sort_keys=True).encode("utf-8")
        ).hexdigest()
        analysis_path.write_text(json.dumps(analysis, indent=2) + "\n", encoding="utf-8")


def character_board(cards_path: Path, output: Path) -> None:
    cards = json.loads(cards_path.read_text(encoding="utf-8"))["characters"]
    frames = []
    for card in cards:
        asset = ROOT / card["canonicalFullBodyReferences"][0]
        frames.append((card["characterId"], asset))
    write_sheet("Canonical character production cards", frames, output, 6, (220, 264))


def layout_guides(profile_path: Path, output_root: Path) -> None:
    profile = json.loads(profile_path.read_text(encoding="utf-8"))
    for viewport in profile["viewports"]:
        width, height = viewport["width"], viewport["height"]
        canvas = Image.new("RGB", (width, height), COLORS["background"])
        draw = ImageDraw.Draw(canvas, "RGBA")
        draw.rectangle((0, 0, width - 1, height - 1), outline=COLORS["gold"] + (255,), width=max(2, width // 600))
        for zone in profile["normalizedZones"]:
            x0 = round(zone["x"] * width)
            y0 = round(zone["y"] * height)
            x1 = round((zone["x"] + zone["width"]) * width)
            y1 = round((zone["y"] + zone["height"]) * height)
            color = COLORS[zone["color"]]
            draw.rectangle((x0, y0, x1, y1), fill=color + (35,), outline=color + (220,), width=max(2, width // 800))
            draw.text((x0 + 8, y0 + 7), zone["label"], fill=color + (255,), font=font(max(13, width // 90)))
        horizon_y = round(profile["horizonTarget"] * height)
        ground_y = round(profile["groundBandY"] * height)
        draw.line((0, horizon_y, width, horizon_y), fill=COLORS["gold"] + (230,), width=max(2, width // 900))
        draw.text((12, horizon_y + 6), "HORIZON TARGET", fill=COLORS["gold"] + (255,), font=font(max(13, width // 90)))
        draw.line((0, ground_y, width, ground_y), fill=COLORS["safe"] + (230,), width=max(2, width // 900))
        draw.text((12, ground_y - 28), "FOOT / GROUND BAND", fill=COLORS["safe"] + (255,), font=font(max(13, width // 90)))
        output = output_root / f"tableau-layout-{width}x{height}.png"
        output.parent.mkdir(parents=True, exist_ok=True)
        canvas.save(output, format="PNG", optimize=True)


def continuity_board(output: Path) -> None:
    frames = [
        ("GOLD - Alaric Audience", ROOT / "tmp/cinematics/cin6ea/gold/alaric_audience_arrival/frames/integration.png"),
        ("GOLD - Camp Departure", ROOT / "tmp/cinematics/cin6ea/gold/camp_departure/frames/integration.png"),
        ("GOLD - Valmir Fork", ROOT / "tmp/cinematics/cin6ea/gold/valmir_route_fork/frames/integration.png"),
        ("TABLEAU - Audience", ROOT / "tmp/cinematics/cin6ea/execution/pilot_a/runtime-composite-b/1920x1080-pilot-a-static-tableau-background-a.png"),
        ("TRAVEL STILL - Forest", ROOT / "tmp/cinematics/cin6ea/execution/images/pilot_b_travel_still_a/pilot_b_travel_still_a.png"),
        ("TABLEAU - Forest", ROOT / "tmp/cinematics/cin6ea/execution/pilot_b/runtime-composite-a/1920x1080-pilot_b_static_tableau_background_a.png"),
        ("TABLEAU - Refuge", ROOT / "tmp/cinematics/cin6ea/execution/pilot_d/runtime-composite-a/1920x1080-pilot_d_static_tableau_background_a.png"),
        ("TABLEAU - Shadow", ROOT / "tmp/cinematics/cin6ea/execution/pilot_f/runtime-composite-a/1920x1080-pilot_f_static_tableau_background_a.png"),
        ("VIDEO C - PASS", ROOT / "tmp/cinematics/cin6ea/dynamic/pilot_c_attempt_1/frames/integration.png"),
        ("VIDEO E - REJECTED SOURCE", ROOT / "tmp/cinematics/cin6ea/dynamic/pilot_e_attempt_1/frames/integration.png"),
        ("VIDEO E-C - AGENT PASS", ROOT / "tmp/cinematics/cin6ea/dynamic/pilot_e_regate_attempt_1/frames/integration.png"),
        ("VIDEO F - PASS", ROOT / "tmp/cinematics/cin6ea/dynamic/pilot_f_attempt_1/frames/integration.png"),
    ]
    missing = [str(path.relative_to(ROOT)) for _, path in frames if not path.exists()]
    if missing:
        raise FileNotFoundError("Missing continuity-board inputs: " + ", ".join(missing))
    write_sheet("CIN-6E-A.3 global same-game continuity", frames, output, 3, (640, 360))


def mask_continuity_board(analysis_path: Path, output: Path) -> None:
    analysis = json.loads(analysis_path.read_text(encoding="utf-8"))
    rows = [
        ("CEDRIC — METAL MASK", (570, 150, 950, 530)),
        ("KESTREL — GREEN CLOTH MASK", (900, 140, 1300, 520)),
    ]
    margin, title_height, row_label_width = 20, 72, 300
    cell_width, cell_height = 260, 250
    width = row_label_width + len(analysis["selectedFrames"]) * (cell_width + margin) + margin
    height = title_height + len(rows) * (cell_height + margin) + margin
    canvas = Image.new("RGB", (width, height), COLORS["background"])
    draw = ImageDraw.Draw(canvas)
    draw.text((margin, 20), "CIN-6E-A.3 mask continuity — opening to exact final review", fill=COLORS["gold"], font=font(27))
    for row_index, (label, crop_box) in enumerate(rows):
        y = title_height + row_index * (cell_height + margin)
        draw.text((margin, y + 78), label, fill=COLORS["text"], font=font(19))
        for frame_index, entry in enumerate(analysis["selectedFrames"]):
            source = open_rgb(ROOT / entry["path"])
            crop = source.crop(crop_box)
            image = ImageOps.fit(crop, (cell_width, cell_height), method=Image.Resampling.LANCZOS)
            x = row_label_width + frame_index * (cell_width + margin)
            canvas.paste(image, (x, y))
            draw.rectangle((x, y, x + cell_width - 1, y + cell_height - 1), outline=COLORS["safe"], width=2)
            draw.text((x + 6, y + 6), f"{entry['label']} {entry['timestampSeconds']:.2f}s", fill=COLORS["text"], font=font(15))
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output, format="PNG", optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    gold = sub.add_parser("gold-sheets")
    gold.add_argument("--root", default="tmp/cinematics/cin6ea/gold")
    gold.add_argument("--id")
    chars = sub.add_parser("character-board")
    chars.add_argument("--cards", default="tools/cinematics/specs/canonical_character_production_cards.json")
    chars.add_argument("--output", default="tmp/cinematics/cin6ea/review/canonical-character-board.png")
    layouts = sub.add_parser("layout-guides")
    layouts.add_argument("--profile", default="tools/cinematics/specs/tableau_background_profile.json")
    layouts.add_argument("--output-root", default="tmp/cinematics/cin6ea/review/layout-guides")
    board = sub.add_parser("continuity-board")
    board.add_argument("--output", default="tmp/cinematics/cin6ea/review/global-continuity-board.png")
    masks = sub.add_parser("mask-continuity")
    masks.add_argument("--analysis", default="tmp/cinematics/cin6ea/dynamic/pilot_e_regate_attempt_1/analysis.json")
    masks.add_argument("--output", default="tmp/cinematics/cin6ea/review/cin6ea3/pilot-e-mask-continuity.png")
    args = parser.parse_args()
    if args.command == "gold-sheets":
        gold_sheets(ROOT / args.root, args.id)
    elif args.command == "character-board":
        character_board(ROOT / args.cards, ROOT / args.output)
    elif args.command == "layout-guides":
        layout_guides(ROOT / args.profile, ROOT / args.output_root)
    elif args.command == "continuity-board":
        continuity_board(ROOT / args.output)
    else:
        mask_continuity_board(ROOT / args.analysis, ROOT / args.output)


if __name__ == "__main__":
    main()

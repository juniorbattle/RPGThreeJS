#!/usr/bin/env python3
"""Build deterministic human-review boards for the Alistair Sunburst benchmark."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


INK = (235, 224, 196, 255)
GOLD = (201, 163, 77, 255)
DARK = (10, 14, 20, 255)
LIGHT = (238, 232, 216, 255)
CYAN = (53, 220, 255, 255)
RED = (255, 72, 72, 255)
GREEN = (115, 231, 137, 255)


def font(size: int) -> ImageFont.ImageFont:
    candidates = [
        Path("C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/segoeui.ttf"),
    ]
    for path in candidates:
        if path.is_file():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def checker(size: tuple[int, int], block: int = 24) -> Image.Image:
    image = Image.new("RGBA", size, (214, 214, 214, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], block):
        for x in range(0, size[0], block):
            if (x // block + y // block) % 2:
                draw.rectangle((x, y, x + block - 1, y + block - 1), fill=(167, 167, 167, 255))
    return image


def contain(subject: Image.Image, box: tuple[int, int, int, int], padding: int = 12) -> tuple[Image.Image, tuple[int, int]]:
    bbox = subject.getchannel("A").getbbox()
    if bbox is None:
        return subject, (box[0], box[1])
    cropped = subject.crop(bbox)
    target_w = box[2] - box[0] - padding * 2
    target_h = box[3] - box[1] - padding * 2
    scale = min(target_w / cropped.width, target_h / cropped.height)
    resized = cropped.resize((round(cropped.width * scale), round(cropped.height * scale)), Image.Resampling.LANCZOS)
    return resized, (
        box[0] + (box[2] - box[0] - resized.width) // 2,
        box[1] + (box[3] - box[1] - resized.height) // 2,
    )


def paste_contained(canvas: Image.Image, subject: Image.Image, box: tuple[int, int, int, int], padding: int = 12) -> None:
    resized, position = contain(subject, box, padding)
    canvas.alpha_composite(resized, dest=position)


def save_pose_strip(
    output: Path,
    poses: list[tuple[str, Image.Image]],
    background: str,
    report: dict,
) -> None:
    width, height = 2048, 640
    if background == "checker":
        canvas = checker((width, height))
    elif background == "dark":
        canvas = Image.new("RGBA", (width, height), DARK)
    else:
        canvas = Image.new("RGBA", (width, height), LIGHT)
    draw = ImageDraw.Draw(canvas)
    title_font = font(25)
    meta_font = font(16)
    for index, (name, pose) in enumerate(poses):
        x = index * 512
        if index:
            draw.line((x, 0, x, height), fill=GOLD, width=2)
        canvas.alpha_composite(pose, dest=(x, 72))
        draw.text((x + 22, 20), name.upper(), fill=INK if background != "light" else DARK, font=title_font)
        bbox = report["poses"][name]["normalized"]["alphaBBox"]
        draw.text((x + 22, 50), f"alpha {bbox}", fill=GOLD if background != "light" else (117, 84, 24, 255), font=meta_font)
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(output, quality=95)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", type=Path, required=True)
    parser.add_argument("--canonical", type=Path, required=True)
    parser.add_argument("--selected-master", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()

    report = json.loads(args.report.read_text(encoding="utf-8"))
    pose_names = ["idle", "dash", "attack", "skill"]
    poses = [(name, Image.open(report["poses"][name]["normalized"]["path"]).convert("RGBA")) for name in pose_names]
    normalized_master = Image.open(report["poses"]["master"]["normalized"]["path"]).convert("RGBA")
    canonical = Image.open(args.canonical).convert("RGBA")
    selected_master = Image.open(args.selected_master).convert("RGBA")
    out = args.output_dir
    out.mkdir(parents=True, exist_ok=True)

    master_board = Image.new("RGBA", (1920, 1080), DARK)
    master_draw = ImageDraw.Draw(master_board)
    master_draw.text((54, 32), "ALISTAIR CHARACTER MASTER REVIEW", fill=INK, font=font(34))
    master_draw.text((54, 78), "canonical authority | selected Sunburst master | normalized runtime derivative", fill=GOLD, font=font(19))
    columns = [(40, 128, 620, 1010), (670, 128, 1250, 1010), (1300, 128, 1880, 1010)]
    for box in columns:
        master_draw.rectangle(box, outline=GOLD, width=2)
    paste_contained(master_board, canonical, columns[0], 42)
    paste_contained(master_board, selected_master, columns[1], 42)
    checker_panel = checker((columns[2][2] - columns[2][0], columns[2][3] - columns[2][1]))
    master_board.alpha_composite(checker_panel, dest=(columns[2][0], columns[2][1]))
    paste_contained(master_board, normalized_master, columns[2], 42)
    for label, box in zip(("CANONICAL", "A003 SELECTED", "512 NORMALIZED"), columns):
        master_draw.text((box[0] + 20, box[3] - 44), label, fill=INK, font=font(20))
    master_board.convert("RGB").save(out / "alistair-character-master-review.png", quality=95)

    save_pose_strip(out / "alistair-4-pose-contact-sheet.png", poses, "checker", report)
    save_pose_strip(out / "alistair-4-pose-dark-background.png", poses, "dark", report)
    save_pose_strip(out / "alistair-4-pose-light-background.png", poses, "light", report)

    silhouette = Image.new("RGBA", (2048, 640), DARK)
    silhouette_draw = ImageDraw.Draw(silhouette)
    for index, (name, pose) in enumerate(poses):
        alpha = pose.getchannel("A")
        white = Image.new("RGBA", pose.size, (242, 238, 221, 255))
        white.putalpha(alpha)
        silhouette.alpha_composite(white, dest=(index * 512, 72))
        if index:
            silhouette_draw.line((index * 512, 0, index * 512, 640), fill=GOLD, width=2)
        silhouette_draw.text((index * 512 + 22, 22), name.upper(), fill=INK, font=font(25))
    silhouette.convert("RGB").save(out / "alistair-silhouette-comparison.png", quality=95)

    bbox_board = checker((2048, 640))
    bbox_draw = ImageDraw.Draw(bbox_board)
    for index, (name, pose) in enumerate(poses):
        x = index * 512
        bbox_board.alpha_composite(pose, dest=(x, 72))
        bbox = report["poses"][name]["normalized"]["alphaBBox"]
        bbox_draw.rectangle((x + bbox[0], 72 + bbox[1], x + bbox[2] - 1, 72 + bbox[3] - 1), outline=CYAN, width=3)
        bbox_draw.text((x + 18, 20), f"{name.upper()}  {bbox}", fill=DARK, font=font(20))
    bbox_board.convert("RGB").save(out / "alistair-alpha-bounding-box-review.png", quality=95)

    overlay = Image.new("RGBA", (2048, 640), DARK)
    overlay_draw = ImageDraw.Draw(overlay)
    baseline = int(report["contract"]["footBaseline"])
    head_line = baseline - int(report["contract"]["targetBodyHeight"])
    pivot = int(report["contract"]["pivotX"])
    for index, (name, pose) in enumerate(poses):
        x = index * 512
        overlay.alpha_composite(pose, dest=(x, 72))
        overlay_draw.line((x, 72 + baseline, x + 511, 72 + baseline), fill=GREEN, width=2)
        overlay_draw.line((x, 72 + head_line, x + 511, 72 + head_line), fill=RED, width=2)
        overlay_draw.line((x + pivot, 72, x + pivot, 583), fill=CYAN, width=2)
        overlay_draw.text((x + 18, 20), name.upper(), fill=INK, font=font(22))
        actual = report["poses"][name]["normalized"]["bodyHeight"]
        overlay_draw.text((x + 18, 48), f"body={actual}px foot={baseline} pivot={pivot}", fill=GOLD, font=font(16))
    overlay.convert("RGB").save(out / "alistair-size-baseline-overlay.png", quality=95)

    print(json.dumps({
        "status": "PASS",
        "outputs": sorted(path.name for path in out.glob("alistair-*.png")),
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Render grouped first/25/50/75/last contact sheets from ignored audit metadata."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--metadata", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--group-size", type=int, default=5)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    project_root = Path(__file__).resolve().parents[2]
    metadata = json.loads((project_root / args.metadata).read_text(encoding="utf-8"))
    output_dir = project_root / args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)
    font = ImageFont.load_default()
    frame_width, frame_height = 320, 180
    label_height, row_gap, margin = 30, 10, 12
    entries = metadata["entries"]
    for group_index in range(0, len(entries), args.group_size):
        group = entries[group_index : group_index + args.group_size]
        width = margin * 2 + frame_width * 5
        row_height = label_height + frame_height + row_gap
        height = margin * 2 + row_height * len(group)
        sheet = Image.new("RGB", (width, height), (15, 14, 18))
        draw = ImageDraw.Draw(sheet)
        for row, entry in enumerate(group):
            y = margin + row * row_height
            draw.text((margin, y + 6), f"{entry['runtimeId']} | {entry['report']['durationSeconds']:.3f}s | {entry['sourceSha256'][:12]}", fill=(245, 222, 168), font=font)
            for column, frame in enumerate(entry["frames"]):
                source = Image.open(project_root / frame["path"]).convert("RGB")
                source.thumbnail((frame_width, frame_height), Image.Resampling.LANCZOS)
                x = margin + column * frame_width
                sheet.paste(source, (x, y + label_height))
                draw.rectangle((x + 4, y + label_height + 4, x + 88, y + label_height + 20), fill=(0, 0, 0))
                draw.text((x + 7, y + label_height + 7), frame["label"], fill=(255, 255, 255), font=font)
        output_path = output_dir / f"p0-visual-audit-{group_index // args.group_size + 1:02d}.png"
        sheet.save(output_path)
        print(f"Wrote {output_path.relative_to(project_root)}")


if __name__ == "__main__":
    main()

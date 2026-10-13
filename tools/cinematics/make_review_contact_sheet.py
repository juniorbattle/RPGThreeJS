#!/usr/bin/env python3
"""Build an ignored comparison sheet from one or more sequence-review manifests."""

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps


def find_project_root(start: Path) -> Path:
    current = start.resolve()
    while current != current.parent:
        if (current / "package.json").is_file():
            return current
        current = current.parent
    raise FileNotFoundError("Could not locate repository root.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--metadata", action="append", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--title", default="CIN-4 comparison review")
    args = parser.parse_args()
    project_root = find_project_root(Path(__file__).parent)
    groups = []
    for metadata_arg in args.metadata:
        manifest = json.loads((project_root / metadata_arg).read_text(encoding="utf-8"))
        frames = []
        for entry in manifest["frames"]:
            with Image.open(project_root / entry["path"]) as image:
                frames.append((entry, image.convert("RGB").copy()))
        groups.append((manifest, frames))

    columns = 2
    cell_width, cell_height = 640, 360
    margin, label_height, group_heading = 24, 32, 44
    rows = sum((len(frames) + columns - 1) // columns for _, frames in groups)
    height = margin * 2 + 48 + rows * (cell_height + label_height) + len(groups) * group_heading
    sheet = Image.new("RGB", (margin * 3 + columns * cell_width, height), (18, 16, 20))
    draw = ImageDraw.Draw(sheet)
    draw.text((margin, margin), args.title, fill=(255, 232, 190))
    y = margin + 48
    for manifest, frames in groups:
        draw.text((margin, y), f"{manifest['label']} — {manifest['report']['durationSeconds']:.3f}s — {manifest['inputSha256'][:16]}", fill=(220, 198, 158))
        y += group_heading
        for index, (entry, image) in enumerate(frames):
            row, column = divmod(index, columns)
            x = margin + column * (cell_width + margin)
            top = y + row * (cell_height + label_height)
            thumb = ImageOps.fit(image, (cell_width, cell_height), method=Image.Resampling.LANCZOS)
            sheet.paste(thumb, (x, top))
            draw.text((x + 4, top + cell_height + 7), f"{entry['label']} @ {entry['timestampSeconds']:.3f}s", fill=(235, 224, 205))
        y += ((len(frames) + columns - 1) // columns) * (cell_height + label_height)
    output = (project_root / args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    if output.exists():
        raise FileExistsError(f"Refusing to overwrite contact sheet: {output}")
    sheet.save(output, format="PNG", optimize=True)
    print(f"Wrote {output.relative_to(project_root).as_posix()}.")


if __name__ == "__main__":
    main()

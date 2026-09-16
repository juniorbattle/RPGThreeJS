from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


MAGENTA = (255, 0, 255, 255)


def extract_two_pose_layers(row: Image.Image) -> list[tuple[Image.Image, tuple[int, int, int, int], int]]:
    alpha = row.getchannel("A")
    linked = alpha.filter(ImageFilter.MaxFilter(3))
    mask = np.asarray(linked, dtype=np.uint8) > 8
    height, width = mask.shape
    labels = np.zeros((height, width), dtype=np.int32)
    components: list[tuple[int, tuple[int, int, int, int], int]] = []
    label = 0

    for y in range(height):
        for x in range(width):
            if not mask[y, x] or labels[y, x] != 0:
                continue
            label += 1
            stack = [(x, y)]
            labels[y, x] = label
            area = 0
            min_x = max_x = x
            min_y = max_y = y
            while stack:
                current_x, current_y = stack.pop()
                area += 1
                min_x = min(min_x, current_x)
                max_x = max(max_x, current_x)
                min_y = min(min_y, current_y)
                max_y = max(max_y, current_y)
                for next_y in range(max(0, current_y - 1), min(height, current_y + 2)):
                    for next_x in range(max(0, current_x - 1), min(width, current_x + 2)):
                        if mask[next_y, next_x] and labels[next_y, next_x] == 0:
                            labels[next_y, next_x] = label
                            stack.append((next_x, next_y))
            components.append((area, (min_x, min_y, max_x + 1, max_y + 1), label))

    selected = sorted(components, reverse=True)[:2]
    if len(selected) != 2:
        raise ValueError(f"expected two connected pose silhouettes in row, found {len(selected)}")

    pixels = np.asarray(row, dtype=np.uint8)
    layers: list[tuple[Image.Image, tuple[int, int, int, int], int]] = []
    for area, linked_bbox, component_label in selected:
        component_mask = labels == component_label
        isolated = np.zeros_like(pixels)
        isolated[component_mask] = pixels[component_mask]
        layer = Image.fromarray(isolated, mode="RGBA")
        bbox = layer.getchannel("A").getbbox()
        if bbox is None:
            raise ValueError("selected component has no source alpha")
        layers.append((layer.crop(bbox), bbox, area))
    return sorted(layers, key=lambda item: (item[1][0] + item[1][2]) / 2)


def repack_board(source: Image.Image, cell_size: int, bottom_margin: int) -> Image.Image:
    if source.width % 2 or source.height % 2:
        raise ValueError(f"2x2 board dimensions must be even, got {source.size}")
    if cell_size <= bottom_margin * 2:
        raise ValueError("repack cell size must exceed twice the bottom margin")

    output = Image.new("RGBA", (cell_size * 2, cell_size * 2), (0, 0, 0, 0))
    source_row_height = source.height // 2
    for row_index in range(2):
        row = source.crop((0, row_index * source_row_height, source.width, (row_index + 1) * source_row_height))
        layers = extract_two_pose_layers(row)
        for column_index, (pose, bbox, area) in enumerate(layers):
            if pose.width > cell_size - bottom_margin * 2 or pose.height > cell_size - bottom_margin * 2:
                raise ValueError(
                    f"pose {row_index},{column_index} size {pose.size} exceeds repack cell {cell_size}"
                )
            paste_x = column_index * cell_size + (cell_size - pose.width) // 2
            paste_y = row_index * cell_size + cell_size - bottom_margin - pose.height
            output.alpha_composite(pose, (paste_x, paste_y))
            print(
                f"pose {row_index},{column_index}: source_bbox={bbox} area={area} "
                f"size={pose.size} paste=({paste_x},{paste_y})"
            )
    return output


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Composite one complete transparent 2x2 board over exact chroma magenta without per-pose transforms."
    )
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--outer-padding", type=int, default=0)
    parser.add_argument("--repack-cell-size", type=int, default=0)
    parser.add_argument("--cell-bottom-margin", type=int, default=64)
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGBA")
    if args.repack_cell_size:
        source = repack_board(source, args.repack_cell_size, args.cell_bottom_margin)
    if args.outer_padding < 0:
        raise ValueError("outer padding must be non-negative")
    padded_size = (
        source.width + args.outer_padding * 2,
        source.height + args.outer_padding * 2,
    )
    background = Image.new("RGBA", padded_size, MAGENTA)
    background.alpha_composite(source, (args.outer_padding, args.outer_padding))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    background.convert("RGB").save(args.output)
    print(
        f"prepared {args.output} from full board {source.size} with "
        f"{args.outer_padding}px uniform outer padding; no pose scaling"
    )


if __name__ == "__main__":
    main()

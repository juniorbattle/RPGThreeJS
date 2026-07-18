#!/usr/bin/env python3
"""Prepare generated combat VFX sheets for visual validation.

The source images stay untouched under ``public/assets/vfx``.  This tool copies
the selected sources into a validation workspace, detects the actual grid
separators, normalizes the grid, delegates chroma cleanup/frame extraction to
the generate2dsprite processor, and emits contact sheets plus QC metadata.

Nothing produced by this script is a runtime asset until it is manually
validated and promoted.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


MAGENTA = (255, 0, 255)
OUTPUT_CELL_SIZE = 256
SEPARATOR_PADDING = 3


@dataclass(frozen=True)
class SheetDefinition:
    id: str
    filename: str
    rows: int = 5
    cols: int = 5
    align: str = "center"
    duration_ms: int = 40


SHEETS: tuple[SheetDefinition, ...] = (
    SheetDefinition("slash_arc", "slash_arc_5x5_25f_1280.png", cols=6),
    SheetDefinition("small_impact", "small_impact_5x5_25f_1280.png"),
    SheetDefinition("thrust_line", "thrust_line_5x5_25f_1280.png"),
    SheetDefinition("projectile_shot", "projectile_shot_5x5_25f_1280.png"),
    SheetDefinition("magic_bolt", "magic_bolt_5x5_25f_1280.png"),
    SheetDefinition("fire_explosion", "fire_explosion_5x5_25f_1280.png", align="bottom"),
    SheetDefinition("heal_touch", "heal_touch_5x5_25f_1280.png", align="bottom"),
    SheetDefinition("buff_pulse", "buff_pulse_5x5_25f_1280.png", align="bottom"),
    SheetDefinition("barrier_shell", "barrier_shell_5x5_25f_1280.png", align="bottom"),
    SheetDefinition("teleport_burst", "teleport_burst_5x5_25f_1280.png", align="bottom"),
    SheetDefinition("shockwave_ring", "shockwave_ring_5x5_25f_1280.png", align="bottom"),
    SheetDefinition("leap_impact", "leap_impact_5x5_25f_1280.png", align="bottom"),
)


def _axis_separator_scores(rgb: np.ndarray, axis: int) -> np.ndarray:
    """Return the proportion of near-white separator pixels per x/y line."""

    near_white = np.min(rgb, axis=2) >= 232
    # axis=0 keeps columns, axis=1 keeps rows.
    return near_white.mean(axis=axis)


def _detect_boundaries(rgb: np.ndarray, count: int, orientation: str) -> tuple[list[int], list[float]]:
    size = rgb.shape[1] if orientation == "x" else rgb.shape[0]
    scores = _axis_separator_scores(rgb, 0 if orientation == "x" else 1)
    expected_step = size / count
    search_radius = max(16, int(expected_step * 0.22))

    boundaries = [0]
    confidences = [float(scores[0])]
    for index in range(1, count):
        expected = int(round(index * expected_step))
        start = max(boundaries[-1] + 24, expected - search_radius)
        stop = min(size - 24, expected + search_radius + 1)
        if start >= stop:
            raise ValueError(f"Cannot search {orientation} separator {index}/{count}.")

        candidates = np.arange(start, stop)
        # Prefer strong full-cell separators while mildly favouring the expected
        # position when an effect itself contains a long white beam.
        distance_penalty = np.abs(candidates - expected) / max(1, search_radius) * 0.035
        ranked = scores[start:stop] - distance_penalty
        peak = int(candidates[int(np.argmax(ranked))])
        boundaries.append(peak)
        confidences.append(float(scores[peak]))

    boundaries.append(size - 1)
    confidences.append(float(scores[size - 1]))

    widths = [boundaries[i + 1] - boundaries[i] for i in range(count)]
    minimum = expected_step * 0.62
    if min(widths) < minimum:
        raise ValueError(
            f"Unreliable {orientation} grid: {boundaries} (minimum cell {min(widths)}, expected {expected_step:.1f})."
        )
    return boundaries, confidences


def _normalize_grid(source: Image.Image, definition: SheetDefinition) -> tuple[Image.Image, dict[str, object]]:
    rgb = np.asarray(source.convert("RGB"))
    x_bounds, x_confidence = _detect_boundaries(rgb, definition.cols, "x")
    y_bounds, y_confidence = _detect_boundaries(rgb, definition.rows, "y")

    normalized = Image.new(
        "RGB",
        (definition.cols * OUTPUT_CELL_SIZE, definition.rows * OUTPUT_CELL_SIZE),
        MAGENTA,
    )
    source_boxes: list[list[int]] = []

    for row in range(definition.rows):
        for col in range(definition.cols):
            left = 2 if col == 0 else x_bounds[col] + SEPARATOR_PADDING
            right = source.width - 2 if col == definition.cols - 1 else x_bounds[col + 1] - SEPARATOR_PADDING
            top = 2 if row == 0 else y_bounds[row] + SEPARATOR_PADDING
            bottom = source.height - 2 if row == definition.rows - 1 else y_bounds[row + 1] - SEPARATOR_PADDING
            if right <= left or bottom <= top:
                raise ValueError(f"Invalid crop for {definition.id} frame {row},{col}.")

            frame = source.crop((left, top, right, bottom)).convert("RGB")
            max_size = OUTPUT_CELL_SIZE - 6
            scale = min(1.0, max_size / frame.width, max_size / frame.height)
            if scale < 1.0:
                frame = frame.resize(
                    (max(1, round(frame.width * scale)), max(1, round(frame.height * scale))),
                    Image.Resampling.LANCZOS,
                )
            paste_x = col * OUTPUT_CELL_SIZE + (OUTPUT_CELL_SIZE - frame.width) // 2
            paste_y = row * OUTPUT_CELL_SIZE + (OUTPUT_CELL_SIZE - frame.height) // 2
            normalized.paste(frame, (paste_x, paste_y))
            source_boxes.append([left, top, right, bottom])

    metadata = {
        "source_size": [source.width, source.height],
        "rows": definition.rows,
        "cols": definition.cols,
        "frame_count": definition.rows * definition.cols,
        "x_boundaries": x_bounds,
        "y_boundaries": y_bounds,
        "x_separator_confidence": [round(value, 4) for value in x_confidence],
        "y_separator_confidence": [round(value, 4) for value in y_confidence],
        "source_boxes": source_boxes,
        "normalized_cell_size": OUTPUT_CELL_SIZE,
    }
    return normalized, metadata


def _run_processor(
    processor: Path,
    normalized_source: Path,
    output_dir: Path,
    prompt_file: Path,
    definition: SheetDefinition,
) -> None:
    command = [
        sys.executable,
        str(processor),
        "process",
        "--input",
        str(normalized_source),
        "--target",
        "asset",
        "--mode",
        "vfx_sheet",
        "--output-dir",
        str(output_dir),
        "--rows",
        str(definition.rows),
        "--cols",
        str(definition.cols),
        "--label-prefix",
        f"{definition.id}_frame",
        "--cell-size",
        str(OUTPUT_CELL_SIZE),
        "--fit-scale",
        "0.90",
        "--trim-border",
        "0",
        "--edge-clean-depth",
        "0",
        "--align",
        definition.align,
        "--shared-scale",
        "--component-mode",
        "all",
        "--min-component-area",
        "2",
        "--threshold",
        "58",
        "--edge-threshold",
        "178",
        "--duration",
        str(definition.duration_ms),
        "--prompt-file",
        str(prompt_file),
    ]
    subprocess.run(command, check=True)


def _natural_frame_key(path: Path) -> int:
    return int(path.stem.rsplit("-", 1)[-1])


def _organize_frames(output_dir: Path, definition: SheetDefinition) -> list[Path]:
    source_frames = sorted(output_dir.glob(f"{definition.id}_frame-*.png"), key=_natural_frame_key)
    frames_dir = output_dir / "frames"
    frames_dir.mkdir(exist_ok=True)
    for stale in frames_dir.glob("frame_*.png"):
        stale.unlink()

    organized: list[Path] = []
    for index, source in enumerate(source_frames):
        destination = frames_dir / f"frame_{index:03d}.png"
        source.replace(destination)
        organized.append(destination)
    return organized


def _frame_qc(frame_paths: list[Path]) -> dict[str, object]:
    magenta_pixels = 0
    edge_alpha_pixels = 0
    opaque_pixels = 0
    empty_frames: list[int] = []
    frame_bboxes: list[list[int] | None] = []

    for index, path in enumerate(frame_paths):
        rgba = np.asarray(Image.open(path).convert("RGBA"))
        alpha = rgba[:, :, 3]
        opaque = alpha > 8
        opaque_pixels += int(opaque.sum())
        if not opaque.any():
            empty_frames.append(index)
            frame_bboxes.append(None)
        else:
            ys, xs = np.where(opaque)
            frame_bboxes.append([int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)])

        rgb = rgba[:, :, :3].astype(np.int32)
        distance = np.sqrt(
            (rgb[:, :, 0] - 255) ** 2 + rgb[:, :, 1] ** 2 + (rgb[:, :, 2] - 255) ** 2
        )
        magenta_pixels += int(((distance < 48) & opaque).sum())
        edge_alpha_pixels += int((alpha[0, :] > 8).sum())
        edge_alpha_pixels += int((alpha[-1, :] > 8).sum())
        edge_alpha_pixels += int((alpha[:, 0] > 8).sum())
        edge_alpha_pixels += int((alpha[:, -1] > 8).sum())

    status = "candidate"
    issues: list[str] = []
    if magenta_pixels:
        status = "needs_review"
        issues.append(f"{magenta_pixels} opaque near-magenta pixels remain")
    if edge_alpha_pixels:
        status = "needs_review"
        issues.append(f"{edge_alpha_pixels} opaque edge pixels remain")
    if empty_frames:
        issues.append(f"empty tail/start frames: {empty_frames}")

    return {
        "status": status,
        "frame_count": len(frame_paths),
        "opaque_pixels": opaque_pixels,
        "near_magenta_pixels": magenta_pixels,
        "edge_alpha_pixels": edge_alpha_pixels,
        "empty_frames": empty_frames,
        "frame_bboxes": frame_bboxes,
        "issues": issues,
    }


def _checkerboard(size: tuple[int, int], block: int = 12) -> Image.Image:
    board = Image.new("RGBA", size, (34, 38, 48, 255))
    draw = ImageDraw.Draw(board)
    for y in range(0, size[1], block):
        for x in range(0, size[0], block):
            if (x // block + y // block) % 2:
                draw.rectangle((x, y, x + block - 1, y + block - 1), fill=(52, 58, 70, 255))
    return board


def _make_contact_board(frame_paths: list[Path], definition: SheetDefinition, output_path: Path) -> None:
    tile = 156
    label_height = 20
    board = Image.new(
        "RGBA",
        (definition.cols * tile, definition.rows * (tile + label_height) + 40),
        (14, 17, 24, 255),
    )
    draw = ImageDraw.Draw(board)
    draw.text((12, 12), f"{definition.id} - {len(frame_paths)} frames - transparent QC", fill=(242, 211, 135, 255))

    for index, frame_path in enumerate(frame_paths):
        row, col = divmod(index, definition.cols)
        x = col * tile
        y = 40 + row * (tile + label_height)
        tile_image = _checkerboard((tile, tile))
        frame = Image.open(frame_path).convert("RGBA")
        frame.thumbnail((tile - 12, tile - 12), Image.Resampling.LANCZOS)
        tile_image.alpha_composite(frame, ((tile - frame.width) // 2, (tile - frame.height) // 2))
        board.alpha_composite(tile_image, (x, y))
        draw.rectangle((x, y, x + tile - 1, y + tile - 1), outline=(104, 91, 62, 255), width=1)
        draw.text((x + 6, y + tile + 3), f"{index:02d}", fill=(205, 212, 226, 255))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    board.convert("RGB").save(output_path, quality=94)


def _make_overview(entries: list[dict[str, object]], validation_root: Path) -> None:
    columns = 3
    tile_width, tile_height = 420, 330
    rows = (len(entries) + columns - 1) // columns
    board = Image.new("RGB", (columns * tile_width, rows * tile_height), (12, 15, 22))
    draw = ImageDraw.Draw(board)

    for index, entry in enumerate(entries):
        col, row = index % columns, index // columns
        x, y = col * tile_width, row * tile_height
        sheet_path = validation_root / str(entry["processed_sheet"])
        sheet = Image.open(sheet_path).convert("RGBA")
        preview = _checkerboard((390, 270), 14)
        sheet.thumbnail((380, 260), Image.Resampling.LANCZOS)
        preview.alpha_composite(sheet, ((390 - sheet.width) // 2, (270 - sheet.height) // 2))
        board.paste(preview.convert("RGB"), (x + 15, y + 38))
        draw.text((x + 15, y + 12), f"{entry['id']}  [{entry['frame_count']}f]  {entry['status']}", fill=(242, 211, 135))

    boards_dir = validation_root / "boards"
    boards_dir.mkdir(parents=True, exist_ok=True)
    board.save(boards_dir / "vfx-foundation-overview.png", quality=94)


def process_batch(repo_root: Path, processor: Path, selected_ids: set[str] | None) -> None:
    vfx_root = repo_root / "public" / "assets" / "vfx"
    validation_root = vfx_root / "validation" / "vfx-sheets-v1"
    raw_dir = validation_root / "raw"
    processed_dir = validation_root / "processed"
    boards_dir = validation_root / "boards"
    prompts_dir = validation_root / "prompts"
    rejected_dir = validation_root / "rejected"
    for directory in (raw_dir, processed_dir, boards_dir, prompts_dir, rejected_dir):
        directory.mkdir(parents=True, exist_ok=True)

    entries: list[dict[str, object]] = []
    definitions = [item for item in SHEETS if not selected_ids or item.id in selected_ids]
    if selected_ids:
        unknown = selected_ids - {item.id for item in SHEETS}
        if unknown:
            raise ValueError(f"Unknown VFX ids: {', '.join(sorted(unknown))}")

    for definition in definitions:
        source_path = vfx_root / definition.filename
        if not source_path.exists():
            raise FileNotFoundError(source_path)

        raw_copy = raw_dir / definition.filename
        shutil.copy2(source_path, raw_copy)
        source = Image.open(source_path).convert("RGB")
        normalized, grid_metadata = _normalize_grid(source, definition)

        prompt_file = prompts_dir / f"{definition.id}.txt"
        prompt_file.write_text(
            "Imported generated VFX source for deterministic chroma cleanup, frame extraction, alignment and QC. "
            "The original creative generation prompt was not stored with the source image.\n",
            encoding="utf-8",
        )

        output_dir = processed_dir / definition.id
        output_dir.mkdir(parents=True, exist_ok=True)
        for old_frame in output_dir.glob(f"{definition.id}_frame-*.png"):
            old_frame.unlink()

        with tempfile.TemporaryDirectory(prefix=f"vfx-{definition.id}-") as temporary:
            normalized_path = Path(temporary) / f"{definition.id}-normalized.png"
            normalized.save(normalized_path)
            _run_processor(processor, normalized_path, output_dir, prompt_file, definition)

        frame_paths = _organize_frames(output_dir, definition)
        expected_frames = definition.rows * definition.cols
        if len(frame_paths) != expected_frames:
            raise ValueError(f"{definition.id}: expected {expected_frames} frames, got {len(frame_paths)}.")

        qc = _frame_qc(frame_paths)
        (output_dir / "source-grid-meta.json").write_text(
            json.dumps(grid_metadata, indent=2), encoding="utf-8"
        )
        (output_dir / "qc.json").write_text(json.dumps(qc, indent=2), encoding="utf-8")

        contact_path = boards_dir / f"{definition.id}-contact.png"
        _make_contact_board(frame_paths, definition, contact_path)
        entry = {
            **asdict(definition),
            "frame_count": expected_frames,
            "fps": round(1000 / definition.duration_ms, 2),
            "status": qc["status"],
            "source": str(raw_copy.relative_to(validation_root)).replace("\\", "/"),
            "processed_sheet": str((output_dir / "sheet-transparent.png").relative_to(validation_root)).replace("\\", "/"),
            "frames": str((output_dir / "frames").relative_to(validation_root)).replace("\\", "/"),
            "animation": str((output_dir / "animation.gif").relative_to(validation_root)).replace("\\", "/"),
            "contact_board": str(contact_path.relative_to(validation_root)).replace("\\", "/"),
            "qc": str((output_dir / "qc.json").relative_to(validation_root)).replace("\\", "/"),
        }
        entries.append(entry)
        print(f"processed {definition.id}: {expected_frames} frames [{qc['status']}]")

    manifest = {
        "version": 1,
        "runtime_ready": False,
        "notes": "Validation candidates only. Runtime must never reference this directory.",
        "processor": str(processor),
        "entries": entries,
    }
    (validation_root / "vfx-sheets-manifest.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8"
    )
    _make_overview(entries, validation_root)
    (rejected_dir / "README.md").write_text(
        "# Rejected VFX candidates\n\nMove only visually rejected validation candidates here. Runtime must never reference this directory.\n",
        encoding="utf-8",
    )
    print(f"validation pack: {validation_root}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="RPGThreeJS repository root.",
    )
    parser.add_argument("--processor", type=Path, required=True, help="generate2dsprite.py path.")
    parser.add_argument("--only", nargs="*", help="Optional subset of VFX ids.")
    args = parser.parse_args()

    repo_root = args.repo_root.resolve()
    processor = args.processor.resolve()
    if not processor.exists():
        raise FileNotFoundError(processor)
    process_batch(repo_root, processor, set(args.only) if args.only else None)


if __name__ == "__main__":
    main()

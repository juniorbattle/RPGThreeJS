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
SEPARATOR_GUARD = 2
POST_RESAMPLE_MAGENTA_DISTANCE = 64
HOT_MAGENTA_MIN_SPILL = 18


@dataclass(frozen=True)
class SheetDefinition:
    id: str
    filename: str
    rows: int = 5
    cols: int = 5
    align: str = "center"
    duration_ms: int = 40
    chroma_palette: str = "warm"
    # Some authored effects intentionally contain a pillar/beam that the
    # generic separator detector would otherwise flag as a grid remnant.
    allow_linear_strokes: bool = False
    # A few generated sheets retain separator fragments in otherwise empty
    # frames. Enable the narrow cleanup only for those known-safe candidates.
    strip_linear_artifacts: bool = False


V1_SHEETS: tuple[SheetDefinition, ...] = (
    SheetDefinition("slash_arc", "slash_arc_5x5_25f_1280.png", cols=6),
    SheetDefinition("small_impact", "small_impact_5x5_25f_1280.png"),
    SheetDefinition("thrust_line", "thrust_line_5x5_25f_1280.png"),
    SheetDefinition("projectile_shot", "projectile_shot_5x5_25f_1280.png"),
    SheetDefinition("magic_bolt", "magic_bolt_5x5_25f_1280.png", chroma_palette="blue"),
    SheetDefinition("fire_explosion", "fire_explosion_5x5_25f_1280.png", align="bottom"),
    SheetDefinition("heal_touch", "heal_touch_5x5_25f_1280.png", align="bottom"),
    SheetDefinition(
        "buff_pulse", "buff_pulse_5x5_25f_1280.png", align="bottom", chroma_palette="cyan"
    ),
    SheetDefinition(
        "barrier_shell", "barrier_shell_5x5_25f_1280.png", align="bottom", chroma_palette="blue"
    ),
    SheetDefinition(
        "teleport_burst", "teleport_burst_5x5_25f_1280.png", align="bottom", chroma_palette="violet"
    ),
    SheetDefinition("shockwave_ring", "shockwave_ring_5x5_25f_1280.png", align="bottom"),
    SheetDefinition("leap_impact", "leap_impact_5x5_25f_1280.png", align="bottom"),
)


# The second pack is deliberately isolated from the V1 foundation.  It shares
# the deterministic cleanup/QC workflow but writes to its own validation and
# runtime-versioned destinations when it is eventually promoted.
V2_SHEETS: tuple[SheetDefinition, ...] = (
    SheetDefinition("artillery_barrage", "artillery_barrage_5x5_25f_1280.png", align="bottom"),
    SheetDefinition("dragon_breath", "dragon_breath_5x5_25f_1280.png", align="center"),
    SheetDefinition("heavy_execution", "heavy_execution_5x5_25f_1280.png", align="center"),
    SheetDefinition("meteor_fall", "meteor_fall_5x5_25f_1280.png", align="bottom"),
    SheetDefinition("titan_slam", "titan_slam_5x5_25f_1280.png", align="bottom"),
    # Runtime V2, Lot B: support, movement and physical-impact readability.
    SheetDefinition("regen_aura", "regen_aura_5x5_25f_1280.png", align="bottom", chroma_palette="cyan"),
    SheetDefinition("revive_pillar", "pillar_of_light_5x5_25f_1280.png", align="bottom", chroma_palette="warm", allow_linear_strokes=True),
    SheetDefinition("holy_aura", "évolution_d_un_cercle_magique_lumineux.png", align="bottom", chroma_palette="cyan"),
    SheetDefinition("bless_field", "évolution_d_un_symbole_magique_lumineux.png", align="bottom", chroma_palette="warm"),
    SheetDefinition("boost_aura", "effet_magique_progressif_lumineux.png", align="bottom", chroma_palette="cyan"),
    SheetDefinition("smoke_burst", "smoke_escape_5x5_25f_1280.png", align="bottom", chroma_palette="warm"),
    SheetDefinition("mace_impact", "mace_impact_5x5_25f_1280.png", align="center", chroma_palette="warm", strip_linear_artifacts=True),
    # Runtime V2, Lot C: tactical shapes, hero punctuation and boss signatures.
    SheetDefinition("line_blast", "line_blast_5x5_25f_1280.png", align="center", chroma_palette="warm", strip_linear_artifacts=True),
    SheetDefinition("cone_blast", "cone_blast_5x5_25f_1280.png", align="center", chroma_palette="warm", strip_linear_artifacts=True),
    SheetDefinition("dark_explosion", "dark_explosion_5x5_25f_1280.png", align="center", chroma_palette="violet", strip_linear_artifacts=True),
    SheetDefinition("explosion_large", "effet_magique_explosif_en_progression.png", align="bottom", chroma_palette="warm", strip_linear_artifacts=True),
    SheetDefinition("judgement_beam", "judgement_beam_5x5_25f_1280.png", align="bottom", chroma_palette="warm", allow_linear_strokes=True),
    SheetDefinition("holy_explosion", "holy_explosion_5x5_25f_1280.png", align="bottom", chroma_palette="warm", strip_linear_artifacts=True),
    SheetDefinition("eclipse_devour", "eclipse_devour_5x5_25f_1280.png", align="bottom", chroma_palette="violet", strip_linear_artifacts=True),
    SheetDefinition("drain_field", "drain_field_5x5_25f_1280.png", align="bottom", chroma_palette="violet", strip_linear_artifacts=True),
    SheetDefinition("zenith_arrow", "effets_magiques_d_arrowes_énergétiques.png", align="center", chroma_palette="blue", allow_linear_strokes=True),
    SheetDefinition("fault_breaker", "animation_d_impact_terrestre_en_vfx.png", align="bottom", chroma_palette="warm", strip_linear_artifacts=True),
    SheetDefinition("apocalypse_field", "apocalypse_field_5x5_25f_1280.png", align="bottom", chroma_palette="violet", strip_linear_artifacts=True),
)


VFX_VALIDATION_PACKS: dict[str, tuple[str, tuple[SheetDefinition, ...]]] = {
    "v1": ("vfx-sheets-v1", V1_SHEETS),
    "v2": ("vfx-sheets-v2", V2_SHEETS),
}

LOT_B_IDS = (
    "regen_aura",
    "revive_pillar",
    "holy_aura",
    "bless_field",
    "boost_aura",
    "smoke_burst",
    "mace_impact",
)

LOT_B_METADATA = {
    "regen_aura": ("support", "boss_regen"),
    "revive_pillar": ("support", "w_miracle"),
    "holy_aura": ("support", "w_sanctuary"),
    "bless_field": ("support", "reserved for a future blessing/harmony mapping"),
    "boost_aura": ("support", "e_vigor_rune"),
    "smoke_burst": ("movement", "ni_smoke_bomb and enemy_smoke_veil"),
    "mace_impact": ("physical_impact", "registered for a future mace-specific action"),
}

LOT_C_IDS = (
    "line_blast", "cone_blast", "dark_explosion", "explosion_large",
    "judgement_beam", "holy_explosion", "eclipse_devour", "drain_field",
    "zenith_arrow", "fault_breaker", "apocalypse_field",
)

LOT_C_METADATA = {
    "line_blast": ("shape", "line attacks and tactical impacts"),
    "cone_blast": ("shape", "cone and breath-like attacks"),
    "dark_explosion": ("shape", "dark AoE detonation"),
    "explosion_large": ("shape", "large fire or boss explosion"),
    "judgement_beam": ("ultimate", "p_radiant_judgement"),
    "holy_explosion": ("ultimate", "reserved holy burst; revive_pillar remains the primary miracle read"),
    "eclipse_devour": ("ultimate", "d_devouring_eclipse"),
    "drain_field": ("ultimate", "reserved drain/blood visual; blood_pact remains a support read"),
    "zenith_arrow": ("ultimate", "a_zenith_arrow"),
    "fault_breaker": ("ultimate", "ro_fault_breaker"),
    "apocalypse_field": ("boss", "boss_apocalypse"),
}


def _axis_separator_scores(rgb: np.ndarray, axis: int) -> np.ndarray:
    """Return the proportion of near-white separator pixels per x/y line."""

    near_white = np.min(rgb, axis=2) >= 232
    # axis=0 keeps columns, axis=1 keeps rows.
    return near_white.mean(axis=axis)


def _separator_band(scores: np.ndarray, peak: int) -> list[int]:
    """Return the complete bright separator run surrounding ``peak``."""

    threshold = max(0.82, float(scores[peak]) * 0.82)
    left = peak
    right = peak
    while left > 0 and scores[left - 1] >= threshold:
        left -= 1
    while right + 1 < len(scores) and scores[right + 1] >= threshold:
        right += 1
    return [left, right]


def _detect_boundaries(
    rgb: np.ndarray, count: int, orientation: str
) -> tuple[list[int], list[float], list[list[int]]]:
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
    bands = [_separator_band(scores, peak) for peak in boundaries]
    return boundaries, confidences, bands


def _normalize_grid(source: Image.Image, definition: SheetDefinition) -> tuple[Image.Image, dict[str, object]]:
    rgb = np.asarray(source.convert("RGB"))
    x_bounds, x_confidence, x_bands = _detect_boundaries(rgb, definition.cols, "x")
    y_bounds, y_confidence, y_bands = _detect_boundaries(rgb, definition.rows, "y")

    normalized = Image.new(
        "RGB",
        (definition.cols * OUTPUT_CELL_SIZE, definition.rows * OUTPUT_CELL_SIZE),
        MAGENTA,
    )
    source_boxes: list[list[int]] = []

    for row in range(definition.rows):
        for col in range(definition.cols):
            # Separator widths differ between generated sheets (from one to
            # seven pixels). Crop from the detected band extents rather than a
            # hard-coded point; the guard removes anti-aliased keyline spill.
            left = x_bands[col][1] + 1 + SEPARATOR_GUARD
            right = x_bands[col + 1][0] - SEPARATOR_GUARD
            top = y_bands[row][1] + 1 + SEPARATOR_GUARD
            bottom = y_bands[row + 1][0] - SEPARATOR_GUARD
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
        "x_separator_bands": x_bands,
        "y_separator_bands": y_bands,
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


def _sanitize_processor_metadata(output_dir: Path, definition: SheetDefinition) -> None:
    """Replace machine-local temporary paths with stable validation metadata."""

    metadata_path = output_dir / "pipeline-meta.json"
    if not metadata_path.exists():
        return
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    metadata["input"] = f"raw/{definition.filename}"
    metadata["input_transform"] = "separator-detected normalized grid (ephemeral)"
    metadata["processor"] = "generate2dsprite.py"
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")


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


def _sanitize_and_rebuild_outputs(
    frame_paths: list[Path], output_dir: Path, definition: SheetDefinition
) -> None:
    """Remove the key colour *and* decontaminate pre-composited glow edges.

    Generated VFX frequently contain translucent smoke or light already blended
    against ``#FF00FF``.  Removing only pixels close to the key leaves a pink
    fringe (and sometimes an opaque pink fill).  Because the background colour
    is known, this pass estimates its contribution, restores transparency and
    reconstructs the foreground colour.  A small per-effect palette policy
    then steers ambiguous pixels away from hot magenta while preserving neutral
    smoke/white highlights and the authored violet teleport family.
    """

    frames: list[Image.Image] = []
    for frame_path in frame_paths:
        rgba = np.asarray(Image.open(frame_path).convert("RGBA")).copy()
        rgb = rgba[:, :, :3].astype(np.float32)
        alpha = rgba[:, :, 3].astype(np.float32) / 255.0
        distance = np.sqrt(
            (rgb[:, :, 0] - 255) ** 2 + rgb[:, :, 1] ** 2 + (rgb[:, :, 2] - 255) ** 2
        )
        hard_key = (distance < POST_RESAMPLE_MAGENTA_DISTANCE) & (alpha > 0)

        red = rgb[:, :, 0]
        green = rgb[:, :, 1]
        blue = rgb[:, :, 2]
        spill = np.clip(np.minimum(red, blue) - green, 0.0, 255.0)
        contaminated = (
            (alpha > 0)
            & (~hard_key)
            & (spill > 2.0)
            & (red > green + 2.0)
            & (blue > green + 2.0)
        )

        # C = aF + (1-a)K, with K=(255, 0, 255).  ``spill`` is the
        # conservative key contribution that can be inferred without an
        # authored alpha channel.  Keep the processor alpha when it is already
        # stricter so this operation remains stable at anti-aliased edges.
        matte = np.clip(1.0 - spill / 255.0, 0.0, 1.0)
        safe_matte = np.maximum(matte, 1.0 / 255.0)
        recovered = np.empty_like(rgb)
        recovered[:, :, 0] = (red - spill) / safe_matte
        recovered[:, :, 1] = green / safe_matte
        recovered[:, :, 2] = (blue - spill) / safe_matte
        recovered = np.clip(recovered, 0.0, 255.0)

        value = recovered.max(axis=2)
        channel_range = recovered.max(axis=2) - recovered.min(axis=2)
        # White sparks and neutral smoke are valid after dematting.  Palette
        # steering applies only where recovered colour is still chromatic.
        neutral = channel_range <= np.maximum(22.0, value * 0.14)
        palette_mask = contaminated & (~neutral)

        target = recovered.copy()
        if definition.chroma_palette == "warm":
            target[:, :, 0] = value
            target[:, :, 1] = np.maximum(recovered[:, :, 1], value * 0.54)
            target[:, :, 2] = np.minimum(recovered[:, :, 2], value * 0.18)
        elif definition.chroma_palette == "blue":
            target[:, :, 0] = np.minimum(recovered[:, :, 0], value * 0.20)
            target[:, :, 1] = np.maximum(recovered[:, :, 1], value * 0.58)
            target[:, :, 2] = value
        elif definition.chroma_palette == "cyan":
            target[:, :, 0] = np.minimum(recovered[:, :, 0], value * 0.24)
            target[:, :, 1] = np.maximum(recovered[:, :, 1], value * 0.74)
            target[:, :, 2] = value
        elif definition.chroma_palette == "violet":
            target[:, :, 0] = value * 0.52
            target[:, :, 1] = np.minimum(
                np.maximum(recovered[:, :, 1], value * 0.10), value * 0.26
            )
            target[:, :, 2] = value
        else:
            raise ValueError(f"Unknown chroma palette: {definition.chroma_palette}")

        recovered[palette_mask] = target[palette_mask]
        rgb[contaminated] = recovered[contaminated]
        new_alpha = np.minimum(alpha, matte)
        new_alpha[(new_alpha < 0.025) | hard_key] = 0.0

        rgba[:, :, :3] = np.rint(np.clip(rgb, 0.0, 255.0)).astype(np.uint8)
        rgba[:, :, 3] = np.rint(new_alpha * 255.0).astype(np.uint8)
        if definition.strip_linear_artifacts:
            cleaned_rgb = rgba[:, :, :3].astype(np.int32)
            opaque = rgba[:, :, 3] > 8
            neutral_bright = opaque & (cleaned_rgb.min(axis=2) > 100) & (
                cleaned_rgb.max(axis=2) - cleaned_rgb.min(axis=2) < 65
            )
            linear_limit = int(min(rgba.shape[:2]) * 0.82)
            for column in np.where(neutral_bright.sum(axis=0) >= linear_limit)[0]:
                rgba[:, column, 3] = 0
            for row in np.where(neutral_bright.sum(axis=1) >= linear_limit)[0]:
                rgba[row, :, 3] = 0
        rgba[rgba[:, :, 3] == 0, :3] = 0
        frame = Image.fromarray(rgba, "RGBA")
        frame.save(frame_path)
        frames.append(frame)

    sheet = Image.new(
        "RGBA",
        (definition.cols * OUTPUT_CELL_SIZE, definition.rows * OUTPUT_CELL_SIZE),
        (0, 0, 0, 0),
    )
    for index, frame in enumerate(frames):
        row, col = divmod(index, definition.cols)
        sheet.alpha_composite(frame, (col * OUTPUT_CELL_SIZE, row * OUTPUT_CELL_SIZE))
    sheet.save(output_dir / "sheet-transparent.png")

    if frames:
        frames[0].save(
            output_dir / "animation.gif",
            save_all=True,
            append_images=frames[1:],
            duration=definition.duration_ms,
            loop=0,
            disposal=2,
            transparency=0,
        )


def _frame_qc(frame_paths: list[Path], allow_linear_strokes: bool = False) -> dict[str, object]:
    magenta_pixels = 0
    hot_magenta_pixels = 0
    edge_alpha_pixels = 0
    opaque_pixels = 0
    empty_frames: list[int] = []
    suspicious_linear_frames: list[int] = []
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
        red = rgb[:, :, 0]
        green = rgb[:, :, 1]
        blue = rgb[:, :, 2]
        spill = np.minimum(red, blue) - green
        hot_magenta = (
            opaque
            & (red > 90)
            & (blue > 90)
            & (spill > HOT_MAGENTA_MIN_SPILL)
            & (np.abs(red - blue) < 72)
        )
        hot_magenta_pixels += int(hot_magenta.sum())

        # Long, neutral, nearly axis-aligned strokes are characteristic of the
        # white grid keylines in the generated sources. Flag them explicitly;
        # normal projectiles, rings and sparks do not span 82% of a frame as a
        # one-pixel neutral line.
        channel_spread = rgb.max(axis=2) - rgb.min(axis=2)
        neutral_bright = opaque & (rgb.min(axis=2) > 100) & (channel_spread < 65)
        linear_limit = int(min(alpha.shape) * 0.82)
        if int(neutral_bright.sum(axis=0).max()) >= linear_limit or int(
            neutral_bright.sum(axis=1).max()
        ) >= linear_limit:
            suspicious_linear_frames.append(index)
        edge_alpha_pixels += int((alpha[0, :] > 8).sum())
        edge_alpha_pixels += int((alpha[-1, :] > 8).sum())
        edge_alpha_pixels += int((alpha[:, 0] > 8).sum())
        edge_alpha_pixels += int((alpha[:, -1] > 8).sum())

    status = "candidate"
    issues: list[str] = []
    if magenta_pixels:
        status = "needs_review"
        issues.append(f"{magenta_pixels} opaque near-magenta pixels remain")
    if hot_magenta_pixels:
        status = "needs_review"
        issues.append(f"{hot_magenta_pixels} hot-magenta spill pixels remain")
    if edge_alpha_pixels:
        status = "needs_review"
        issues.append(f"{edge_alpha_pixels} opaque edge pixels remain")
    if suspicious_linear_frames and not allow_linear_strokes:
        status = "needs_review"
        issues.append(f"possible grid-line remnants in frames: {suspicious_linear_frames}")
    if empty_frames:
        issues.append(f"empty tail/start frames: {empty_frames}")

    return {
        "status": status,
        "frame_count": len(frame_paths),
        "opaque_pixels": opaque_pixels,
        "near_magenta_pixels": magenta_pixels,
        "hot_magenta_pixels": hot_magenta_pixels,
        "edge_alpha_pixels": edge_alpha_pixels,
        "empty_frames": empty_frames,
        "suspicious_linear_frames": suspicious_linear_frames,
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


def _make_lot_b_contact_sheet(
    validation_root: Path, entries: list[dict[str, object]], mode: str, output_path: Path
) -> None:
    """Render a small review board for raw, dark-matted or checkerboard assets."""

    columns = 4
    tile_width, tile_height = 320, 300
    rows = (len(entries) + columns - 1) // columns
    board = Image.new("RGB", (columns * tile_width, rows * tile_height), (13, 16, 23))
    draw = ImageDraw.Draw(board)
    for index, entry in enumerate(entries):
        x = index % columns * tile_width
        y = index // columns * tile_height
        if mode == "raw":
            image = Image.open(validation_root / str(entry["source"])).convert("RGBA")
            background = Image.new("RGBA", (tile_width - 18, tile_height - 46), (37, 21, 42, 255))
        else:
            image = Image.open(validation_root / str(entry["processed_sheet"])).convert("RGBA")
            background = (
                _checkerboard((tile_width - 18, tile_height - 46), 14)
                if mode == "checkerboard"
                else Image.new("RGBA", (tile_width - 18, tile_height - 46), (17, 23, 33, 255))
            )
        image.thumbnail((tile_width - 32, tile_height - 60), Image.Resampling.LANCZOS)
        background.alpha_composite(image, ((background.width - image.width) // 2, (background.height - image.height) // 2))
        board.paste(background.convert("RGB"), (x + 9, y + 34))
        draw.text((x + 10, y + 10), f"{entry['id']}  [{entry['status']}]", fill=(243, 213, 136))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    board.save(output_path, quality=95)


def write_lot_b_artifacts(repo_root: Path) -> None:
    """Create portable Lot-B review artifacts after deterministic processing."""

    validation_root = repo_root / "public" / "assets" / "vfx" / "validation" / "vfx-sheets-v2"
    manifest_path = validation_root / "vfx-sheets-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    by_id = {str(entry["id"]): entry for entry in manifest.get("entries", [])}
    missing = [effect_id for effect_id in LOT_B_IDS if effect_id not in by_id]
    if missing:
        raise ValueError(f"Lot B artifacts require processed entries: {', '.join(missing)}")

    entries = [by_id[effect_id] for effect_id in LOT_B_IDS]
    inventory: list[dict[str, object]] = []
    for entry in entries:
        effect_id = str(entry["id"])
        definition = next(item for item in V2_SHEETS if item.id == effect_id)
        qc = json.loads((validation_root / str(entry["qc"])).read_text(encoding="utf-8"))
        source = Image.open(validation_root / str(entry["source"])).convert("RGBA")
        processed = Image.open(validation_root / str(entry["processed_sheet"])).convert("RGBA")
        category, intended_use = LOT_B_METADATA[effect_id]
        inventory.append({
            "id": effect_id,
            "category": category,
            "intended_use": intended_use,
            "source_raw": definition.filename,
            "source_dimensions": [source.width, source.height],
            "processed_sheet": str(entry["processed_sheet"]),
            "processed_dimensions": [processed.width, processed.height],
            "rows": definition.rows,
            "cols": definition.cols,
            "frame_count": definition.rows * definition.cols,
            "frame_duration_ms": definition.duration_ms,
            "align": definition.align,
            "qc_status": qc["status"],
            "promotion_decision": "candidate" if qc["status"] == "candidate" else "deferred",
            "qc": entry["qc"],
        })

    (validation_root / "lot_b_inventory.json").write_text(
        json.dumps({"lot": "B", "runtime_ready": False, "effects": inventory}, indent=2),
        encoding="utf-8",
    )
    boards_dir = validation_root / "boards"
    _make_lot_b_contact_sheet(validation_root, entries, "raw", boards_dir / "lot-b-raw-contact.png")
    _make_lot_b_contact_sheet(validation_root, entries, "processed", boards_dir / "lot-b-processed-contact.png")
    _make_lot_b_contact_sheet(validation_root, entries, "checkerboard", boards_dir / "lot-b-checkerboard-contact.png")
    report_lines = [
        "# VFX Runtime V2 - Lot B processing report",
        "",
        "All sources remain in validation only until the runtime promotion gate is applied.",
        "",
        "| ID | Category | Source | Result |",
        "| --- | --- | --- | --- |",
    ]
    report_lines.extend(
        f"| {entry['id']} | {entry['category']} | {entry['source_raw']} | {entry['promotion_decision']} ({entry['qc_status']}) |"
        for entry in inventory
    )
    report_lines.extend([
        "",
        "Contact sheets: `boards/lot-b-raw-contact.png`, `boards/lot-b-processed-contact.png`, and `boards/lot-b-checkerboard-contact.png`.",
        "Runtime code must never point at `validation/`, `raw/`, `processed/`, or `rejected/`.",
    ])
    (validation_root / "lot_b_processing_report.md").write_text("\n".join(report_lines) + "\n", encoding="utf-8")
    print(f"Lot B review artifacts: {validation_root}")


def write_lot_c_artifacts(repo_root: Path) -> None:
    """Create portable Lot-C review artifacts after deterministic processing."""

    validation_root = repo_root / "public" / "assets" / "vfx" / "validation" / "vfx-sheets-v2"
    manifest_path = validation_root / "vfx-sheets-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    by_id = {str(entry["id"]): entry for entry in manifest.get("entries", [])}
    missing = [effect_id for effect_id in LOT_C_IDS if effect_id not in by_id]
    if missing:
        raise ValueError(f"Lot C artifacts require processed entries: {', '.join(missing)}")

    entries = [by_id[effect_id] for effect_id in LOT_C_IDS]
    inventory: list[dict[str, object]] = []
    for entry in entries:
        effect_id = str(entry["id"])
        definition = next(item for item in V2_SHEETS if item.id == effect_id)
        qc = json.loads((validation_root / str(entry["qc"])).read_text(encoding="utf-8"))
        source = Image.open(validation_root / str(entry["source"])).convert("RGBA")
        processed = Image.open(validation_root / str(entry["processed_sheet"])).convert("RGBA")
        category, intended_use = LOT_C_METADATA[effect_id]
        decision = "integrated" if qc["status"] == "candidate" else "deferred"
        inventory.append({
            "id": effect_id,
            "category": category,
            "intended_use": intended_use,
            "source_file": definition.filename,
            "final_file": f"runtime/v2/{effect_id}_5x5_25f_1280.png",
            "source_dimensions": [source.width, source.height],
            "final_dimensions": [processed.width, processed.height],
            "rows": definition.rows,
            "cols": definition.cols,
            "frame_count": definition.rows * definition.cols,
            "frame_duration_ms": definition.duration_ms,
            "align": definition.align,
            "alpha_validation": qc["status"] == "candidate",
            "magenta_removal_validation": qc.get("near_magenta_pixels", 0) == 0 and qc.get("hot_magenta_pixels", 0) == 0,
            # Judgement Beam deliberately contains a vertical beam; its linear
            # frames are authored content, not separator remnants.
            "grid_line_removal_validation": definition.allow_linear_strokes or not qc.get("suspicious_linear_frames", []),
            "tactical_readability": "Peak overlap is allowed; the sheet clears before damage text and UI need to be read.",
            "decision": decision,
            "notes": qc.get("issues", []),
            "qc": entry["qc"],
        })

    (validation_root / "lot_c_inventory.json").write_text(
        json.dumps({"lot": "C", "runtime_ready": False, "effects": inventory}, indent=2),
        encoding="utf-8",
    )
    _make_lot_b_contact_sheet(validation_root, entries, "raw", validation_root / "lot_c_contact_sheet_raw.jpg")
    _make_lot_b_contact_sheet(validation_root, entries, "processed", validation_root / "lot_c_contact_sheet_processed.jpg")
    _make_lot_b_contact_sheet(validation_root, entries, "checkerboard", validation_root / "lot_c_contact_sheet_checkerboard.jpg")
    ultimate_entries = [entry for entry in entries if LOT_C_METADATA[str(entry["id"])][0] in {"ultimate", "boss"}]
    _make_lot_b_contact_sheet(validation_root, ultimate_entries, "checkerboard", validation_root / "lot_c_ultimate_scale_review.jpg")

    report_lines = [
        "# VFX Runtime V2 - Lot C processing report",
        "",
        "Lot C is processed deterministically from raw sheets. Runtime promotion is allowed only for candidates with clean alpha and no residual magenta or separator artifacts.",
        "",
        "| ID | Source -> Final | Grid | Alpha / magenta / grid | Decision |",
        "| --- | --- | --- | --- | --- |",
    ]
    report_lines.extend(
        "| {id} | {source_file} -> {final_file} | {cols}x{rows}, {frame_count} frames | {alpha}/{magenta}/{grid} | {decision} |".format(
            **entry,
            alpha="pass" if entry["alpha_validation"] else "defer",
            magenta="pass" if entry["magenta_removal_validation"] else "defer",
            grid="pass" if entry["grid_line_removal_validation"] else "review",
        )
        for entry in inventory
    )
    report_lines.extend([
        "",
        "Tactical readability: normal shapes stay near the target ground; ultimates and the boss field intentionally peak over multiple cells, then clear before the next tactical decision.",
        "Required review boards: `lot_c_contact_sheet_raw.jpg`, `lot_c_contact_sheet_processed.jpg`, `lot_c_contact_sheet_checkerboard.jpg`, and `lot_c_ultimate_scale_review.jpg`.",
        "Runtime code must never point at `validation/`, `raw/`, `processed/`, or `rejected/`.",
    ])
    (validation_root / "lot_c_processing_report.md").write_text("\n".join(report_lines) + "\n", encoding="utf-8")
    print(f"Lot C review artifacts: {validation_root}")


def _write_validation_readme(validation_root: Path, version: int) -> None:
    (validation_root / "README.md").write_text(
        f"""# Combat VFX spritesheets - validation pack V{version}

This directory contains visual candidates only. Nothing in `validation/` may be referenced by runtime code.

## Contents

- `raw/`: untouched copies of selected generated source sheets.
- `processed/<effect>/frames/`: cleaned, transparent 256x256 frames.
- `processed/<effect>/sheet-transparent.png`: rebuilt transparent sheet.
- `processed/<effect>/animation.gif`: timing preview only.
- `processed/<effect>/qc.json`: deterministic chroma, edge and separator checks.
- `boards/`: per-effect contact sheets and the global comparison board.
- `vfx-sheets-manifest.json`: validation inventory; `runtime_ready` remains `false` until manual approval.

## Rebuild

```powershell
python tools/process_vfx_validation.py --pack v{version} --processor <path-to-generate2dsprite.py>
```

Use `--only slash_arc fire_explosion` for a subset. Use `--refresh-existing-metadata` to remove machine-local paths without reprocessing images.

## Promotion gate

An effect can be promoted only after its contact sheet and animation preview are approved, its QC status is `candidate`, and a runtime preset defines scale, blend mode, anchor, timing and reduced-graphics behavior.
""",
        encoding="utf-8",
    )


def refresh_existing_metadata(repo_root: Path, pack: str) -> None:
    directory_name, sheets = VFX_VALIDATION_PACKS[pack]
    validation_root = repo_root / "public" / "assets" / "vfx" / "validation" / directory_name
    manifest_path = validation_root / "vfx-sheets-manifest.json"
    if not manifest_path.exists():
        raise FileNotFoundError(manifest_path)

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["processor"] = "generate2dsprite.py"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    for definition in sheets:
        _sanitize_processor_metadata(validation_root / "processed" / definition.id, definition)
    _write_validation_readme(validation_root, int(pack.removeprefix("v")))
    print(f"refreshed portable metadata: {validation_root}")


def process_batch(repo_root: Path, processor: Path, pack: str, selected_ids: set[str] | None) -> None:
    vfx_root = repo_root / "public" / "assets" / "vfx"
    directory_name, sheets = VFX_VALIDATION_PACKS[pack]
    validation_root = vfx_root / "validation" / directory_name
    raw_dir = validation_root / "raw"
    processed_dir = validation_root / "processed"
    boards_dir = validation_root / "boards"
    prompts_dir = validation_root / "prompts"
    rejected_dir = validation_root / "rejected"
    for directory in (raw_dir, processed_dir, boards_dir, prompts_dir, rejected_dir):
        directory.mkdir(parents=True, exist_ok=True)

    manifest_path = validation_root / "vfx-sheets-manifest.json"
    existing_entries: dict[str, dict[str, object]] = {}
    if manifest_path.exists():
        previous_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        existing_entries = {
            str(entry["id"]): entry
            for entry in previous_manifest.get("entries", [])
            if isinstance(entry, dict) and "id" in entry
        }

    entries: list[dict[str, object]] = []
    definitions = [item for item in sheets if not selected_ids or item.id in selected_ids]
    if selected_ids:
        unknown = selected_ids - {item.id for item in sheets}
        if unknown:
            raise ValueError(f"Unknown VFX ids: {', '.join(sorted(unknown))}")

    for definition in definitions:
        # New generated sources live under ``raw/``.  Keep the historical
        # root fallback so the V1 / pre-Lot-B workflow remains reproducible.
        source_path = vfx_root / "raw" / definition.filename
        if not source_path.exists():
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

        _sanitize_processor_metadata(output_dir, definition)

        frame_paths = _organize_frames(output_dir, definition)
        expected_frames = definition.rows * definition.cols
        if len(frame_paths) != expected_frames:
            raise ValueError(f"{definition.id}: expected {expected_frames} frames, got {len(frame_paths)}.")

        _sanitize_and_rebuild_outputs(frame_paths, output_dir, definition)
        qc = _frame_qc(frame_paths, definition.allow_linear_strokes)
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

    merged_entries = {**existing_entries, **{str(entry["id"]): entry for entry in entries}}
    ordered_ids = [definition.id for definition in sheets if definition.id in merged_entries]
    ordered_ids.extend(entry_id for entry_id in merged_entries if entry_id not in ordered_ids)
    manifest = {
        "version": int(pack.removeprefix("v")),
        "runtime_ready": False,
        "notes": "Validation candidates only. Runtime must never reference this directory.",
        "processor": processor.name,
        "entries": [merged_entries[entry_id] for entry_id in ordered_ids],
    }
    manifest_path.write_text(
        json.dumps(manifest, indent=2), encoding="utf-8"
    )
    _make_overview(manifest["entries"], validation_root)
    (rejected_dir / "README.md").write_text(
        "# Rejected VFX candidates\n\nMove only visually rejected validation candidates here. Runtime must never reference this directory.\n",
        encoding="utf-8",
    )
    _write_validation_readme(validation_root, int(pack.removeprefix("v")))
    print(f"validation pack: {validation_root}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="RPGThreeJS repository root.",
    )
    parser.add_argument("--processor", type=Path, help="generate2dsprite.py path.")
    parser.add_argument("--pack", choices=sorted(VFX_VALIDATION_PACKS), default="v1")
    parser.add_argument("--only", nargs="*", help="Optional subset of VFX ids.")
    parser.add_argument(
        "--write-lot-b-artifacts",
        action="store_true",
        help="Write Lot B inventory, report and comparison boards from processed candidates.",
    )
    parser.add_argument(
        "--write-lot-c-artifacts",
        action="store_true",
        help="Write Lot C inventory, report and comparison boards from processed candidates.",
    )
    parser.add_argument(
        "--refresh-existing-metadata",
        action="store_true",
        help="Refresh portable metadata and README without reprocessing images.",
    )
    args = parser.parse_args()

    repo_root = args.repo_root.resolve()
    if args.write_lot_b_artifacts:
        write_lot_b_artifacts(repo_root)
        return
    elif args.write_lot_c_artifacts:
        write_lot_c_artifacts(repo_root)
        return
    elif args.refresh_existing_metadata:
        refresh_existing_metadata(repo_root, args.pack)
        return
    if args.processor is None:
        parser.error("--processor is required unless --refresh-existing-metadata is used")
    processor = args.processor.resolve()
    if not processor.exists():
        raise FileNotFoundError(processor)
    process_batch(repo_root, processor, args.pack, set(args.only) if args.only else None)


if __name__ == "__main__":
    main()

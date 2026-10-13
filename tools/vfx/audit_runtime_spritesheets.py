#!/usr/bin/env python3
"""Full, non-destructive audit and normalization preview for runtime VFX sheets.

The script intentionally never writes into ``public/assets/vfx/runtime``.  It
measures every manifest sheet frame-by-frame, optionally creates normalization
candidates, generates visual evidence, and writes the R3H Markdown/JSON audit.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import shutil
import statistics
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable, Sequence

import numpy as np
from PIL import Image, ImageDraw, ImageFont


FRAME_SIZE = 256
ROWS = 5
COLS = 5
FRAME_COUNT = ROWS * COLS
SHEET_SIZE = FRAME_SIZE * COLS
SAFE_PADDING = 8
BOTTOM_BASELINE = 228
ALPHA_THRESHOLDS = (8, 32)

CLASSIFICATIONS = {
    "PASS",
    "PASS_WITH_MINOR_RISK",
    "NEEDS_NORMALIZATION",
    "NEEDS_REPLACEMENT",
    "NEEDS_REGENERATION",
    "MANUAL_REVIEW",
}

PRIORITY_ACTIONS: dict[str, dict[str, str]] = {
    "w_break_guard": {"label": "Brise-garde", "priority": "P1"},
    "w_charge": {"label": "Charge", "priority": "P1"},
    "w_whirl": {"label": "Tourbillon d'acier", "priority": "P0"},
    "w_lion_surge": {"label": "Deferlement du Lion", "priority": "P0"},
    "p_holy_strike": {"label": "Frappe consacree", "priority": "P2"},
    "p_interpose": {"label": "Interposition", "priority": "P1"},
    "p_oathwall": {"label": "Rempart du serment", "priority": "P0"},
    "d_devouring_eclipse": {"label": "Eclipse devorante", "priority": "P0"},
    "n_flame_wave": {"label": "Vague de flammes", "priority": "P1"},
    "n_dark_meteor": {"label": "Meteore obscur", "priority": "P0"},
}

# Browser QA findings are presentation evidence, not a replacement for metrics.
# They are kept separate from intrinsic asset classification.
SEMANTIC_ACTION_NOTES: dict[str, dict[str, str]] = {
    "w_charge": {
        "diagnostic": "wrong-effect-for-preset",
        "recommendation": "Remap Charge to a directional dash/ram impact; a stationary hammer crush is semantically weak.",
    },
    "p_interpose": {
        "diagnostic": "wrong-effect-for-preset",
        "recommendation": "Use a protective landing/guard impact instead of a generic body slam.",
    },
    "n_flame_wave": {
        "diagnostic": "wrong-effect-for-preset",
        "recommendation": "Prefer a directional wave/cone presentation; the local burst does not express propagation.",
    },
}

# These sheets were observed in combat with source-composition issues.  The
# metrics still appear in the report; this flag prevents unsafe auto-promotion.
MANUAL_SOURCE_FINDINGS: dict[str, str] = {
    "skill_wind_slash_swirl_medium": "Frames read as disconnected cell fragments during Tourbillon; regenerate from a clean per-frame composition.",
    "basic_execution_slash_heavy": "The enlarged ultimate exposes discontinuous source composition during Deferlement du Lion.",
    "skill_barrier_guard_heavy": "Guard layer contains unstable oversized shapes; the companion ring remains independently usable.",
    "skill_void_singularity_implosion_ultimate": "Ultimate source composition and frame centering are unstable at combat scale.",
    "skill_meteor_impact_burst_heavy": "Meteor impact sheet mixes descent/impact framing and reads as cell-composed when enlarged.",
}


@dataclass(frozen=True)
class BBox:
    left: int
    top: int
    right: int  # exclusive
    bottom: int  # exclusive

    @property
    def width(self) -> int:
        return self.right - self.left

    @property
    def height(self) -> int:
        return self.bottom - self.top

    @property
    def center_x(self) -> float:
        return (self.left + self.right - 1) / 2

    @property
    def center_y(self) -> float:
        return (self.top + self.bottom - 1) / 2

    def as_list(self) -> list[int]:
        return [self.left, self.top, self.right, self.bottom]


def alpha_bbox(alpha: np.ndarray, threshold: int) -> BBox | None:
    ys, xs = np.nonzero(alpha > threshold)
    if xs.size == 0:
        return None
    return BBox(int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)


def _round(value: float | int | None, digits: int = 3) -> float | int | None:
    if value is None:
        return None
    if isinstance(value, int):
        return value
    return round(float(value), digits)


def _stats(values: Sequence[float | int]) -> dict[str, float | int | None]:
    if not values:
        return {"min": None, "max": None, "mean": None, "median": None, "std": None, "range": None}
    vals = [float(value) for value in values]
    return {
        "min": _round(min(vals)),
        "max": _round(max(vals)),
        "mean": _round(statistics.fmean(vals)),
        "median": _round(statistics.median(vals)),
        "std": _round(statistics.pstdev(vals) if len(vals) > 1 else 0.0),
        "range": _round(max(vals) - min(vals)),
    }


def frame_metric(frame: Image.Image, index: int) -> dict[str, Any]:
    rgba = np.asarray(frame.convert("RGBA"), dtype=np.uint8)
    alpha = rgba[:, :, 3]
    metric: dict[str, Any] = {"index": index}

    for threshold in ALPHA_THRESHOLDS:
        mask = alpha > threshold
        bbox = alpha_bbox(alpha, threshold)
        prefix = f"alpha{threshold}"
        exact_edges = {
            "left": int(mask[:, 0].sum()),
            "right": int(mask[:, -1].sum()),
            "top": int(mask[0, :].sum()),
            "bottom": int(mask[-1, :].sum()),
        }
        safe_mask = np.zeros_like(mask)
        safe_mask[:SAFE_PADDING, :] = True
        safe_mask[-SAFE_PADDING:, :] = True
        safe_mask[:, :SAFE_PADDING] = True
        safe_mask[:, -SAFE_PADDING:] = True
        nonzero = int(mask.sum())
        metric[prefix] = {
            "bbox": bbox.as_list() if bbox else None,
            "width": bbox.width if bbox else 0,
            "height": bbox.height if bbox else 0,
            "centerX": _round(bbox.center_x) if bbox else None,
            "centerY": _round(bbox.center_y) if bbox else None,
            "top": bbox.top if bbox else None,
            "bottom": (bbox.bottom - 1) if bbox else None,
            "pixelCount": nonzero,
            "occupancy": _round(nonzero / (FRAME_SIZE * FRAME_SIZE), 5),
            "exactEdgePixels": exact_edges,
            "exactEdgeContact": any(exact_edges.values()),
            "safeBorderPixels": int((mask & safe_mask).sum()),
            "safeBorderRatio": _round(float((mask & safe_mask).sum()) / max(nonzero, 1), 5),
        }

    # Magenta is a valid artistic colour in arcane/void effects.  We therefore
    # inventory it as a palette signal and only flag a frame when a dominant,
    # flat chroma field resembles an unremoved key background.
    visible = alpha > 8
    magenta = (
        (rgba[:, :, 0] >= 220)
        & (rgba[:, :, 1] <= 90)
        & (rgba[:, :, 2] >= 170)
        & visible
    )
    magenta_pixels = int(magenta.sum())
    visible_pixels = int(visible.sum())
    magenta_coverage = magenta_pixels / (FRAME_SIZE * FRAME_SIZE)
    magenta_share = magenta_pixels / max(visible_pixels, 1)
    metric["magentaPalettePixels"] = magenta_pixels
    metric["magentaCoverage"] = _round(magenta_coverage, 5)
    metric["magentaShareOfVisible"] = _round(magenta_share, 5)
    metric["flatMagentaContamination"] = magenta_coverage >= 0.25 and magenta_share >= 0.65
    return metric


def split_frames(sheet: Image.Image, rows: int = ROWS, cols: int = COLS) -> list[Image.Image]:
    frame_w = sheet.width // cols
    frame_h = sheet.height // rows
    return [
        sheet.crop((col * frame_w, row * frame_h, (col + 1) * frame_w, (row + 1) * frame_h)).convert("RGBA")
        for row in range(rows)
        for col in range(cols)
    ]


def aggregate_metrics(frame_metrics: Sequence[dict[str, Any]], threshold: int) -> dict[str, Any]:
    prefix = f"alpha{threshold}"
    nonempty = [metric[prefix] for metric in frame_metrics if metric[prefix]["bbox"]]
    max_occupancy = max((float(metric["occupancy"]) for metric in nonempty), default=0.0)
    active = [
        metric
        for metric in nonempty
        if float(metric["occupancy"]) >= max(0.004, max_occupancy * 0.2)
        and max(int(metric["width"]), int(metric["height"])) >= 16
    ]
    use = active or nonempty
    exact_edge_frames = sum(1 for metric in nonempty if metric["exactEdgeContact"])
    safe_edge_frames = sum(1 for metric in nonempty if metric["safeBorderPixels"] > 0)
    return {
        "nonemptyFrames": len(nonempty),
        "activeFrames": len(active),
        "width": _stats([metric["width"] for metric in use]),
        "height": _stats([metric["height"] for metric in use]),
        "centerX": _stats([metric["centerX"] for metric in use]),
        "centerY": _stats([metric["centerY"] for metric in use]),
        "top": _stats([metric["top"] for metric in use]),
        "bottom": _stats([metric["bottom"] for metric in use]),
        "occupancy": _stats([metric["occupancy"] for metric in use]),
        "exactEdgeFrames": exact_edge_frames,
        "safeBorderFrames": safe_edge_frames,
        "safeBorderPixels": sum(int(metric["safeBorderPixels"]) for metric in nonempty),
        "safeBorderRatioMax": _round(max((float(metric["safeBorderRatio"]) for metric in nonempty), default=0.0), 5),
    }


def longest_true_run(values: np.ndarray) -> int:
    """Return the longest contiguous True run in a one-dimensional mask."""
    flat = np.asarray(values, dtype=bool).reshape(-1)
    if not flat.any():
        return 0
    padded = np.pad(flat.astype(np.int8), (1, 1), constant_values=0)
    transitions = np.diff(padded)
    starts = np.flatnonzero(transitions == 1)
    ends = np.flatnonzero(transitions == -1)
    return int((ends - starts).max(initial=0))


def detect_internal_boundary_contamination(sheet: Image.Image, threshold: int = 32) -> dict[str, Any]:
    alpha = np.asarray(sheet.convert("RGBA"), dtype=np.uint8)[:, :, 3]
    mask = alpha > threshold
    vertical: list[dict[str, Any]] = []
    horizontal: list[dict[str, Any]] = []
    for boundary in range(FRAME_SIZE, sheet.width, FRAME_SIZE):
        left = int(mask[:, boundary - 1].sum())
        right = int(mask[:, boundary].sum())
        paired_mask = mask[:, boundary - 1] & mask[:, boundary]
        paired = int(paired_mask.sum())
        coverage = paired / max(sheet.height, 1)
        longest_run = longest_true_run(paired_mask)
        suspicious = coverage >= 0.85 or longest_run >= round(sheet.height * 0.75)
        vertical.append({
            "x": boundary,
            "left": left,
            "right": right,
            "paired": paired,
            "pairedCoverage": _round(coverage, 5),
            "longestPairedRun": longest_run,
            "suspiciousStraightLine": suspicious,
        })
    for boundary in range(FRAME_SIZE, sheet.height, FRAME_SIZE):
        top = int(mask[boundary - 1, :].sum())
        bottom = int(mask[boundary, :].sum())
        paired_mask = mask[boundary - 1, :] & mask[boundary, :]
        paired = int(paired_mask.sum())
        coverage = paired / max(sheet.width, 1)
        longest_run = longest_true_run(paired_mask)
        suspicious = coverage >= 0.85 or longest_run >= round(sheet.width * 0.75)
        horizontal.append({
            "y": boundary,
            "top": top,
            "bottom": bottom,
            "paired": paired,
            "pairedCoverage": _round(coverage, 5),
            "longestPairedRun": longest_run,
            "suspiciousStraightLine": suspicious,
        })
    paired_total = sum(item["paired"] for item in vertical + horizontal)
    suspicious_lines = sum(1 for item in vertical + horizontal if item["suspiciousStraightLine"])
    return {
        "threshold": threshold,
        "vertical": vertical,
        "horizontal": horizontal,
        "pairedPixels": paired_total,
        "suspiciousBoundaryLines": suspicious_lines,
    }


def coefficient_of_variation(stat: dict[str, Any]) -> float:
    mean = float(stat.get("mean") or 0)
    return 0.0 if mean == 0 else float(stat.get("std") or 0) / mean


def risk_profile(entry: dict[str, Any], aggregate: dict[str, Any]) -> dict[str, Any]:
    """Summarize elevator and clipping risks without guessing artistic intent."""
    alpha8 = aggregate["alpha8"]
    alpha32 = aggregate["alpha32"]
    align = entry.get("align")
    drift_metric = "bottom" if align == "bottom" else "centerY"
    drift_range = float(alpha8[drift_metric]["range"] or 0)
    if drift_range > 90:
        elevator_level = "high"
    elif drift_range > (28 if align == "bottom" else 22):
        elevator_level = "medium"
    else:
        elevator_level = "low"

    max_width = float(alpha8["width"]["max"] or 0)
    max_height = float(alpha8["height"]["max"] or 0)
    exact_edge_frames = int(alpha32["exactEdgeFrames"])
    if exact_edge_frames >= 10 or max(max_width, max_height) >= FRAME_SIZE:
        clipping_level = "high"
    elif exact_edge_frames >= 3 or max(max_width, max_height) > FRAME_SIZE - 2 * SAFE_PADDING:
        clipping_level = "medium"
    else:
        clipping_level = "low"

    return {
        "elevator": {
            "level": elevator_level,
            "basis": drift_metric,
            "rangePx": _round(drift_range),
        },
        "clipping": {
            "level": clipping_level,
            "exactEdgeFramesAlpha32": exact_edge_frames,
            "safeBorderFramesAlpha8": int(alpha8["safeBorderFrames"]),
            "maxWidthAlpha8": _round(max_width),
            "maxHeightAlpha8": _round(max_height),
        },
    }


def classify_sheet(entry: dict[str, Any], analysis: dict[str, Any]) -> tuple[str, list[str], list[str]]:
    diagnostics: list[str] = []
    reasons: list[str] = []
    alpha8 = analysis["aggregate"]["alpha8"]
    alpha32 = analysis["aggregate"]["alpha32"]

    if analysis["formatErrors"]:
        diagnostics.extend(["bad-source-composition"])
        reasons.extend(analysis["formatErrors"])
        return "NEEDS_REPLACEMENT", diagnostics, reasons

    if entry["id"] in MANUAL_SOURCE_FINDINGS:
        diagnostics.append("bad-source-composition")
        if alpha32["exactEdgeFrames"]:
            diagnostics.append("internal-border-contamination")
        reasons.append(MANUAL_SOURCE_FINDINGS[entry["id"]])
        return "NEEDS_REGENERATION", diagnostics, reasons

    flat_magenta_frames = int(analysis["flatMagentaContaminationFrames"])
    if flat_magenta_frames > 0:
        diagnostics.append("bad-source-composition")
        reasons.append(
            f"{flat_magenta_frames} frame(s) contain a dominant flat magenta field consistent with an unremoved chroma background."
        )
        return "NEEDS_REPLACEMENT", diagnostics, reasons

    suspicious_lines = int(analysis["internalBoundary"].get("suspiciousBoundaryLines", 0))
    if suspicious_lines:
        diagnostics.append("internal-border-contamination")
        reasons.append(
            f"Detected {suspicious_lines} long continuous alpha line(s) across internal cell boundaries; inspect the source manually."
        )
        return "MANUAL_REVIEW", list(dict.fromkeys(diagnostics)), reasons

    max_w = float(alpha8["width"]["max"] or 0)
    max_h = float(alpha8["height"]["max"] or 0)
    center_x_range = float(alpha8["centerX"]["range"] or 0)
    center_y_range = float(alpha8["centerY"]["range"] or 0)
    bottom_range = float(alpha8["bottom"]["range"] or 0)
    risky_motion = entry.get("align") != "bottom" and max(center_x_range, center_y_range) > 64
    risky_baseline = entry.get("align") == "bottom" and bottom_range > 90
    source_already_clipped = alpha32["exactEdgeFrames"] >= 10 and max(max_w, max_h) >= FRAME_SIZE

    if source_already_clipped:
        diagnostics.extend(["cell-overflow", "edge-touch", "internal-border-contamination"])
        reasons.append(
            f"Core alpha reaches a cell edge in {alpha32['exactEdgeFrames']} frames and the visible bbox spans a full "
            f"{FRAME_SIZE}px cell; missing source pixels cannot be restored by recentering or downscale."
        )
        if risky_motion or risky_baseline:
            reasons.append("Large trajectory/baseline motion makes automatic repacking unsafe; preserve for manual review.")
            return "MANUAL_REVIEW", list(dict.fromkeys(diagnostics)), reasons
        diagnostics.append("bad-source-composition")
        return "NEEDS_REGENERATION", list(dict.fromkeys(diagnostics)), reasons

    if alpha32["exactEdgeFrames"] >= 10:
        diagnostics.extend(["cell-overflow", "edge-touch"])
        reasons.append(f"Core alpha reaches a cell edge in {alpha32['exactEdgeFrames']} frames; safe downscale/repack is required.")
    elif alpha32["exactEdgeFrames"] >= 3:
        diagnostics.append("edge-touch")
        reasons.append(f"Core alpha reaches a cell edge in {alpha32['exactEdgeFrames']} frames.")

    if max(max_w, max_h) > FRAME_SIZE - 2 * SAFE_PADDING:
        diagnostics.append("too-large-for-cell")
        reasons.append(f"Maximum active bbox {int(max_w)}x{int(max_h)} exceeds the {FRAME_SIZE - 2 * SAFE_PADDING}px safe area.")

    if entry.get("align") == "bottom":
        if bottom_range > 90:
            diagnostics.append("bottom-baseline-drift")
            reasons.append(f"Active-frame bottom baseline drifts by {bottom_range:.1f}px; this may be intentional trajectory and needs review.")
        elif bottom_range > 28:
            diagnostics.append("bottom-baseline-drift")
            reasons.append(f"Active-frame bottom baseline drifts by {bottom_range:.1f}px.")
    else:
        if center_y_range > 42:
            diagnostics.append("vertical-center-drift")
            reasons.append(f"Active-frame vertical center drifts by {center_y_range:.1f}px; motion may be intentional and needs review.")
        if center_x_range > 54:
            diagnostics.append("vertical-center-drift")
            reasons.append(f"Active-frame horizontal center drifts by {center_x_range:.1f}px; per-frame recentering could alter motion.")

    if diagnostics:
        if risky_motion or risky_baseline:
            return "MANUAL_REVIEW", list(dict.fromkeys(diagnostics)), reasons
        return "NEEDS_NORMALIZATION", list(dict.fromkeys(diagnostics)), reasons

    minor: list[str] = []
    if alpha8["safeBorderFrames"] > 0 or alpha8["exactEdgeFrames"] > 0:
        minor.append("edge-touch")
        reasons.append(f"Low-alpha glow enters the {SAFE_PADDING}px safety border in {alpha8['safeBorderFrames']} frames.")
    if entry.get("align") == "bottom" and bottom_range > 12:
        minor.append("bottom-baseline-drift")
        reasons.append(f"Minor bottom-baseline variation: {bottom_range:.1f}px.")
    if entry.get("align") != "bottom" and center_y_range > 22:
        minor.append("vertical-center-drift")
        reasons.append(f"Minor active-frame center variation: {center_y_range:.1f}px.")
    median_extent = max(float(alpha8["width"]["median"] or 0), float(alpha8["height"]["median"] or 0))
    if 0 < median_extent < 42:
        minor.append("too-small-after-normalization-risk")
        reasons.append(f"Median visible extent is only {median_extent:.1f}px; avoid further downscale.")
    if coefficient_of_variation(alpha8["width"]) > 0.72 or coefficient_of_variation(alpha8["height"]) > 0.72:
        minor.append("vertical-center-drift")
        reasons.append("Large frame-size variance may be intentional anticipation/aftermath; inspect playback.")

    if minor:
        return "PASS_WITH_MINOR_RISK", list(dict.fromkeys(minor)), reasons
    return "PASS", ["clean"], ["No structural normalization issue detected by alpha/border/baseline metrics."]


def shared_scale(frames: Sequence[Image.Image], threshold: int = 8) -> float:
    max_w = 1
    max_h = 1
    for frame in frames:
        bbox = alpha_bbox(np.asarray(frame, dtype=np.uint8)[:, :, 3], threshold)
        if bbox:
            max_w = max(max_w, bbox.width)
            max_h = max(max_h, bbox.height)
    safe_extent = FRAME_SIZE - 2 * SAFE_PADDING
    return min(1.0, safe_extent / max_w, safe_extent / max_h)


def repack_frame(
    frame: Image.Image,
    mode: str,
    scale: float,
    threshold: int = 8,
    baseline: int = BOTTOM_BASELINE,
) -> Image.Image:
    source = frame.convert("RGBA")
    bbox = alpha_bbox(np.asarray(source, dtype=np.uint8)[:, :, 3], threshold)
    output = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
    if bbox is None:
        return output

    crop = source.crop((bbox.left, bbox.top, bbox.right, bbox.bottom))
    if scale < 0.999999:
        new_size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
        crop = crop.resize(new_size, Image.Resampling.LANCZOS)

    x = round((FRAME_SIZE - crop.width) / 2)
    if mode == "bottom":
        y = baseline - crop.height + 1
    else:
        y = round((FRAME_SIZE - crop.height) / 2)
    x = max(SAFE_PADDING, min(x, FRAME_SIZE - SAFE_PADDING - crop.width))
    y = max(SAFE_PADDING, min(y, FRAME_SIZE - SAFE_PADDING - crop.height))
    output.alpha_composite(crop, (x, y))
    return output


def compose_sheet(frames: Sequence[Image.Image]) -> Image.Image:
    sheet = Image.new("RGBA", (SHEET_SIZE, SHEET_SIZE), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        row, col = divmod(index, COLS)
        sheet.alpha_composite(frame.convert("RGBA"), (col * FRAME_SIZE, row * FRAME_SIZE))
    return sheet


def normalize_sheet(sheet: Image.Image, align: str) -> tuple[Image.Image, dict[str, Any]]:
    # Palette colours are preserved exactly; this pass only changes per-cell
    # geometry.  Flat chroma contamination is rejected by classification.
    frames = split_frames(sheet.convert("RGBA"))
    scale = shared_scale(frames)
    mode = "bottom" if align == "bottom" else "center"
    packed = [repack_frame(frame, mode=mode, scale=scale) for frame in frames]
    return compose_sheet(packed), {
        "mode": "B_stable_bottom" if mode == "bottom" else "A_centered_impact",
        "sharedScale": _round(scale, 5),
        "downscaled": scale < 0.999999,
        "safePadding": SAFE_PADDING,
        "baseline": BOTTOM_BASELINE if mode == "bottom" else None,
        "palettePreserved": True,
        "result": "PASS_WITH_DOWNSCALE" if scale < 0.999999 else "NORMALIZED",
    }


def measure_sheet(sheet: Image.Image) -> dict[str, Any]:
    frames = split_frames(sheet)
    metrics = [frame_metric(frame, index) for index, frame in enumerate(frames)]
    return {
        "aggregate": {
            "alpha8": aggregate_metrics(metrics, 8),
            "alpha32": aggregate_metrics(metrics, 32),
        },
        "internalBoundary": detect_internal_boundary_contamination(sheet),
        "magentaPalettePixels": sum(metric["magentaPalettePixels"] for metric in metrics),
        "flatMagentaContaminationFrames": sum(1 for metric in metrics if metric["flatMagentaContamination"]),
        "frames": metrics,
    }


def draw_bbox_overlay(sheet: Image.Image, frame_metrics: Sequence[dict[str, Any]]) -> Image.Image:
    overlay = sheet.convert("RGBA").copy()
    draw = ImageDraw.Draw(overlay)
    font = ImageFont.load_default()
    for index, metric in enumerate(frame_metrics):
        row, col = divmod(index, COLS)
        ox, oy = col * FRAME_SIZE, row * FRAME_SIZE
        draw.rectangle((ox, oy, ox + FRAME_SIZE - 1, oy + FRAME_SIZE - 1), outline=(80, 80, 80, 180), width=1)
        for key, color in (("alpha8", (0, 255, 255, 255)), ("alpha32", (255, 170, 0, 255))):
            bbox = metric[key]["bbox"]
            if bbox:
                left, top, right, bottom = bbox
                draw.rectangle((ox + left, oy + top, ox + right - 1, oy + bottom - 1), outline=color, width=2)
        draw.rectangle((ox + 2, oy + 2, ox + 31, oy + 15), fill=(0, 0, 0, 190))
        draw.text((ox + 5, oy + 3), f"{index:02}", fill=(255, 255, 255, 255), font=font)
    return overlay


def make_before_after(original: Image.Image, candidate: Image.Image | None) -> Image.Image:
    left = original.convert("RGBA").resize((640, 640), Image.Resampling.LANCZOS)
    right_source = candidate.convert("RGBA") if candidate is not None else original.convert("RGBA")
    right = right_source.resize((640, 640), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (1280, 680), (16, 18, 24, 255))
    canvas.alpha_composite(left, (0, 40))
    canvas.alpha_composite(right, (640, 40))
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.load_default()
    draw.text((12, 12), "ORIGINAL RUNTIME", fill=(240, 220, 160, 255), font=font)
    draw.text((652, 12), "NORMALIZED CANDIDATE" if candidate else "NO SAFE AUTO-REPACK", fill=(240, 220, 160, 255), font=font)
    return canvas


def make_preview_gif(original: Image.Image, candidate: Image.Image | None, output: Path, duration_ms: int) -> None:
    original_frames = split_frames(original)
    candidate_frames = split_frames(candidate) if candidate is not None else original_frames
    frames: list[Image.Image] = []
    for left, right in zip(original_frames, candidate_frames):
        canvas = Image.new("RGBA", (512, 256), (12, 14, 20, 255))
        canvas.alpha_composite(left, (0, 0))
        canvas.alpha_composite(right, (256, 0))
        frames.append(canvas.convert("P", palette=Image.Palette.ADAPTIVE, colors=255))
    output.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(
        output,
        save_all=True,
        append_images=frames[1:],
        duration=max(35, duration_ms),
        loop=0,
        disposal=2,
        optimize=False,
    )


def balanced_object_blocks(source: str, anchor: str = "const presets = [") -> list[str]:
    start = source.find(anchor)
    if start < 0:
        return []
    start = source.find("[", start) + 1
    blocks: list[str] = []
    depth = 0
    block_start: int | None = None
    quote: str | None = None
    escaped = False
    for index in range(start, len(source)):
        char = source[index]
        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            continue
        if char in ("'", '"', "`"):
            quote = char
            continue
        if char == "{":
            if depth == 0:
                block_start = index
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0 and block_start is not None:
                blocks.append(source[block_start : index + 1])
                block_start = None
        elif char == "]" and depth == 0:
            break
    return blocks


def parse_usage(repo_root: Path) -> dict[str, Any]:
    presets_source = (repo_root / "src/combat/vfx/VfxPresets.ts").read_text(encoding="utf-8")
    presentation_source = (repo_root / "src/combat/skillPresentation.ts").read_text(encoding="utf-8")
    registry_source = (repo_root / "src/combat/vfx/VfxActionRegistry.ts").read_text(encoding="utf-8")

    preset_to_sheets: dict[str, list[str]] = {}
    id_matches = list(re.finditer(r"\bid:\s*'([^']+)'", presets_source))
    for index, id_match in enumerate(id_matches):
        block_end = id_matches[index + 1].start() if index + 1 < len(id_matches) else len(presets_source)
        block = presets_source[id_match.start() : block_end]
        sheets = re.findall(r"\bspriteSheet:\s*'([^']+)'", block)
        preset_to_sheets[id_match.group(1)] = list(dict.fromkeys(sheets))

    action_to_preset: dict[str, str] = {}
    presentation_pattern = re.compile(
        r"(?m)^\s*([a-z][a-z0-9_]+):\s*(?:presentation|bossSignature)\(\s*'[^']+'\s*,\s*'([^']+)'"
    )
    for action, preset in presentation_pattern.findall(presentation_source):
        action_to_preset[action] = preset
    mapping_pattern = re.compile(r"\{\s*actionId:\s*'([^']+)'[^\n}]*?presetId:\s*'([^']+)'", re.MULTILINE)
    for action, preset in mapping_pattern.findall(registry_source):
        action_to_preset[action] = preset

    sheet_to_presets: dict[str, list[str]] = defaultdict(list)
    preset_to_actions: dict[str, list[str]] = defaultdict(list)
    for action, preset in action_to_preset.items():
        preset_to_actions[preset].append(action)
    for preset, sheets in preset_to_sheets.items():
        for sheet in sheets:
            sheet_to_presets[sheet].append(preset)

    sheet_to_actions: dict[str, list[str]] = defaultdict(list)
    for sheet, presets in sheet_to_presets.items():
        for preset in presets:
            sheet_to_actions[sheet].extend(preset_to_actions.get(preset, []))
        sheet_to_actions[sheet] = list(dict.fromkeys(sheet_to_actions[sheet]))

    return {
        "presetToSheets": preset_to_sheets,
        "actionToPreset": action_to_preset,
        "sheetToPresets": {key: sorted(set(value)) for key, value in sheet_to_presets.items()},
        "sheetToActions": {key: sorted(set(value)) for key, value in sheet_to_actions.items()},
    }


def audit_entry(repo_root: Path, entry: dict[str, Any], usage: dict[str, Any]) -> dict[str, Any]:
    runtime_path = repo_root / "public" / entry["url"].lstrip("/")
    format_errors: list[str] = []
    if not runtime_path.is_file():
        return {
            "id": entry["id"],
            "runtimePath": str(runtime_path),
            "formatErrors": ["Runtime PNG is missing."],
            "classification": "NEEDS_REPLACEMENT",
            "diagnostics": ["bad-source-composition"],
            "reasons": ["Manifest path does not exist."],
        }

    with Image.open(runtime_path) as opened:
        sheet = opened.convert("RGBA")
    if sheet.size != (SHEET_SIZE, SHEET_SIZE):
        format_errors.append(f"Expected {SHEET_SIZE}x{SHEET_SIZE}, found {sheet.width}x{sheet.height}.")
    if entry.get("rows") != ROWS or entry.get("cols") != COLS or entry.get("frameCount") != FRAME_COUNT:
        format_errors.append("Manifest layout is not 5x5 / 25 frames.")
    if sheet.width % int(entry.get("cols", COLS)) or sheet.height % int(entry.get("rows", ROWS)):
        format_errors.append("Sheet dimensions are not divisible by manifest rows/columns.")

    frames = split_frames(sheet, int(entry.get("rows", ROWS)), int(entry.get("cols", COLS)))
    metrics = [frame_metric(frame, index) for index, frame in enumerate(frames)]
    analysis: dict[str, Any] = {
        "formatErrors": format_errors,
        "aggregate": {
            "alpha8": aggregate_metrics(metrics, 8),
            "alpha32": aggregate_metrics(metrics, 32),
        },
        "internalBoundary": detect_internal_boundary_contamination(sheet),
        "magentaPalettePixels": sum(metric["magentaPalettePixels"] for metric in metrics),
        "flatMagentaContaminationFrames": sum(1 for metric in metrics if metric["flatMagentaContamination"]),
    }
    classification, diagnostics, reasons = classify_sheet(entry, analysis)
    actions = usage["sheetToActions"].get(entry["id"], [])
    presets = usage["sheetToPresets"].get(entry["id"], [])
    priority_actions = [
        {"id": action, **PRIORITY_ACTIONS[action]}
        for action in actions
        if action in PRIORITY_ACTIONS
    ]
    semantic_findings = [
        {"actionId": action, **SEMANTIC_ACTION_NOTES[action]}
        for action in actions
        if action in SEMANTIC_ACTION_NOTES
    ]
    priority = min((item["priority"] for item in priority_actions), default="P2" if actions else "P3")
    risks = risk_profile(entry, analysis["aggregate"])
    return {
        "id": entry["id"],
        "filename": runtime_path.name,
        "runtimeUrl": entry["url"],
        "runtimePath": str(runtime_path.relative_to(repo_root)).replace("\\", "/"),
        "dimensions": list(sheet.size),
        "mode": "RGBA",
        "rows": entry.get("rows"),
        "cols": entry.get("cols"),
        "frameCount": entry.get("frameCount"),
        "frameDurationMs": entry.get("frameDurationMs"),
        "align": entry.get("align"),
        "category": entry.get("category"),
        "manifestPresentation": entry.get("presentation", {}),
        "classification": classification,
        "diagnostics": diagnostics,
        "reasons": reasons,
        "priority": priority,
        "usedByPresets": presets,
        "usedByActions": actions,
        "priorityActions": priority_actions,
        "semanticFindings": semantic_findings,
        "formatErrors": format_errors,
        "magentaPalettePixels": analysis["magentaPalettePixels"],
        "flatMagentaContaminationFrames": analysis["flatMagentaContaminationFrames"],
        "internalBoundary": analysis["internalBoundary"],
        "aggregate": analysis["aggregate"],
        "risks": risks,
        "frames": metrics,
    }


def candidate_for_audit(repo_root: Path, audit: dict[str, Any]) -> tuple[Image.Image | None, dict[str, Any] | None]:
    classification = audit["classification"]
    if classification not in {"PASS_WITH_MINOR_RISK", "NEEDS_NORMALIZATION", "MANUAL_REVIEW"}:
        return None, None
    runtime_path = repo_root / audit["runtimePath"]
    with Image.open(runtime_path) as opened:
        sheet = opened.convert("RGBA")
    if classification == "MANUAL_REVIEW":
        candidate = sheet.copy()
        metadata = {
            "mode": "C_manual_review_passthrough",
            "sharedScale": 1.0,
            "downscaled": False,
            "safePadding": SAFE_PADDING,
            "baseline": None,
            "palettePreserved": True,
            "result": "MANUAL_REVIEW_NO_REPACK",
        }
    else:
        candidate, metadata = normalize_sheet(sheet, audit["align"])

    after = measure_sheet(candidate)
    metadata["afterAggregate"] = after["aggregate"]
    metadata["afterInternalBoundary"] = after["internalBoundary"]
    metadata["afterMagentaPalettePixels"] = after["magentaPalettePixels"]
    metadata["afterFlatMagentaContaminationFrames"] = after["flatMagentaContaminationFrames"]
    metadata["afterRisks"] = risk_profile(audit, after["aggregate"])
    return candidate, metadata


def write_evidence(
    repo_root: Path,
    audit: dict[str, Any],
    candidate: Image.Image | None,
    candidate_meta: dict[str, Any] | None,
    evidence_root: Path,
) -> dict[str, str]:
    runtime_path = repo_root / audit["runtimePath"]
    with Image.open(runtime_path) as opened:
        original = opened.convert("RGBA")
    sheet_dir = evidence_root / audit["id"]
    sheet_dir.mkdir(parents=True, exist_ok=True)
    original_path = sheet_dir / "original_contact.png"
    overlay_path = sheet_dir / "bbox_overlay.png"
    before_after_path = sheet_dir / "before_after.png"
    summary_path = sheet_dir / "metrics-summary.json"
    original.save(original_path, optimize=True)
    draw_bbox_overlay(original, audit["frames"]).save(overlay_path, optimize=True)
    make_before_after(original, candidate).save(before_after_path, optimize=True)
    evidence = {
        "originalContact": str(original_path.relative_to(repo_root)).replace("\\", "/"),
        "bboxOverlay": str(overlay_path.relative_to(repo_root)).replace("\\", "/"),
        "beforeAfter": str(before_after_path.relative_to(repo_root)).replace("\\", "/"),
        "metricsSummary": str(summary_path.relative_to(repo_root)).replace("\\", "/"),
    }
    if candidate is not None:
        candidate_contact = sheet_dir / "normalized_contact.png"
        candidate.save(candidate_contact, optimize=True)
        evidence["normalizedContact"] = str(candidate_contact.relative_to(repo_root)).replace("\\", "/")
    if audit["priority"] in {"P0", "P1"} or audit["classification"] in {"NEEDS_REGENERATION", "NEEDS_REPLACEMENT"}:
        gif_path = sheet_dir / "playback_before_after.gif"
        make_preview_gif(original, candidate, gif_path, int(audit.get("frameDurationMs") or 40))
        evidence["animatedPreview"] = str(gif_path.relative_to(repo_root)).replace("\\", "/")
    summary_path.write_text(
        json.dumps(
            {
                "id": audit["id"],
                "classification": audit["classification"],
                "diagnostics": audit["diagnostics"],
                "reasons": audit["reasons"],
                "before": audit["aggregate"],
                "beforeRisks": audit["risks"],
                "candidate": candidate_meta,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    return evidence


def markdown_report(report: dict[str, Any]) -> str:
    summary = report["summary"]
    lines = [
        "# VFX-R3H — Full Runtime Spritesheet Normalization Audit",
        "",
        "> Audit non destructif. Aucun PNG de `public/assets/vfx/runtime/` n'a ete remplace.",
        "",
        "## Executive summary",
        "",
        f"- Feuilles runtime auditees : **{summary['auditedSheets']}** / manifeste : **{summary['manifestEntries']}**.",
        f"- PNG orphelins : **{len(summary['orphanPngs'])}** ; entrees manquantes : **{len(summary['missingManifestFiles'])}**.",
        f"- Candidats non destructifs : **{summary['candidateCount']}**.",
        f"- Repartition : {', '.join(f'`{key}` {value}' for key, value in summary['classificationCounts'].items())}.",
        "- Les verdicts de qualite d'image sont separes des problemes de mapping semantique.",
        "",
        "## Legend and thresholds",
        "",
        "- Bbox mesurees a `alpha > 8` (halo/empreinte visible) et `alpha > 32` (coeur de l'effet).",
        f"- Cellule : `{FRAME_SIZE}x{FRAME_SIZE}` ; marge sure : `{SAFE_PADDING}px` ; baseline basse : `y={BOTTOM_BASELINE}`.",
        "- Mode A : recentrage par bbox ; mode B : centrage horizontal + baseline stable ; mode C : copie de revue, sans repack.",
        "- `NEEDS_REGENERATION` signale une composition source qu'un repack ne peut pas reparer.",
        "- Les violets/magentas artistiques sont preserves. Seul un champ chroma plat, dominant et opaque est classe comme contamination.",
        "",
        "## Full inventory",
        "",
        "| Priority | ID | Align | Used by | Classification | Elevator / clipping | Diagnostics | Candidate |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for audit in report["sheets"]:
        used = ", ".join(audit["usedByActions"][:4]) or "—"
        if len(audit["usedByActions"]) > 4:
            used += f" +{len(audit['usedByActions']) - 4}"
        candidate = audit.get("candidate", {}).get("result", "—") if audit.get("candidate") else "—"
        risks = f"{audit['risks']['elevator']['level']} / {audit['risks']['clipping']['level']}"
        lines.append(
            f"| {audit['priority']} | `{audit['id']}` | {audit['align']} | {used} | **{audit['classification']}** | "
            f"{risks} | {', '.join(audit['diagnostics'])} | {candidate} |"
        )

    lines.extend([
        "",
        "## Priority action review",
        "",
        "| Action | Label | Preset | Runtime sheet(s) | Asset verdict | Semantic finding | Recommendation |",
        "|---|---|---|---|---|---|---|",
    ])
    for row in report["priorityActionReview"]:
        lines.append(
            f"| `{row['actionId']}` | {row['label']} | `{row.get('presetId', '—')}` | "
            f"{', '.join(f'`{item}`' for item in row['sheetIds']) or '—'} | "
            f"{', '.join(row['assetClassifications']) or '—'} | {row.get('semanticDiagnostic', '—')} | {row['recommendation']} |"
        )

    lines.extend([
        "",
        "## Replacement / normalization plan",
        "",
        "| Priority | Runtime sheet | Decision | Action | Rationale |",
        "|---|---|---|---|---|",
    ])
    for row in report["replacementPlan"]:
        lines.append(
            f"| {row['priority']} | `{row['id']}` | {row['classification']} | {row['nextAction']} | {row['rationale']} |"
        )

    lines.extend([
        "",
        "## Per-sheet evidence index",
        "",
    ])
    for audit in report["sheets"]:
        evidence = audit.get("evidence", {})
        links = ", ".join(
            f"[{key}]({value.removeprefix('docs/reports/')})"
            for key, value in evidence.items()
        )
        lines.append(f"- `{audit['id']}` — {links or 'aucune preuve generee'}")

    lines.extend([
        "",
        "## Safety statement",
        "",
        "- Aucun manifeste runtime, preset, mapping, UV, `flipY`, ordre de frame ou PNG runtime n'a ete modifie.",
        "- Les candidats sont exclusivement sous `public/assets/vfx/normalized_candidates/`.",
        "- Les constats `wrong-effect-for-preset` demandent un remapping futur et ne condamnent pas necessairement la feuille elle-meme.",
        "",
    ])
    return "\n".join(lines)


def build_priority_review(report_sheets: Sequence[dict[str, Any]], usage: dict[str, Any]) -> list[dict[str, Any]]:
    by_id = {audit["id"]: audit for audit in report_sheets}
    rows: list[dict[str, Any]] = []
    for action_id, meta in PRIORITY_ACTIONS.items():
        preset = usage["actionToPreset"].get(action_id)
        sheet_ids = usage["presetToSheets"].get(preset, []) if preset else []
        audits = [by_id[sheet_id] for sheet_id in sheet_ids if sheet_id in by_id]
        semantic = SEMANTIC_ACTION_NOTES.get(action_id)
        if semantic:
            recommendation = semantic["recommendation"]
        elif any(audit["classification"] in {"NEEDS_REGENERATION", "NEEDS_REPLACEMENT"} for audit in audits):
            recommendation = "Replace/regenerate the unsafe source sheet before runtime promotion; preserve the current runtime until validated."
        elif any(audit["classification"] == "NEEDS_NORMALIZATION" for audit in audits):
            recommendation = "Review and promote the generated normalization candidate after in-combat QA."
        else:
            recommendation = "Retain mapping; perform playback QA at the current preset scale."
        rows.append({
            "actionId": action_id,
            "label": meta["label"],
            "priority": meta["priority"],
            "presetId": preset,
            "sheetIds": sheet_ids,
            "assetClassifications": [audit["classification"] for audit in audits],
            "semanticDiagnostic": semantic["diagnostic"] if semantic else None,
            "recommendation": recommendation,
        })
    return rows


def replacement_plan(sheets: Sequence[dict[str, Any]]) -> list[dict[str, Any]]:
    action_for_class = {
        "PASS": "keep_runtime",
        "PASS_WITH_MINOR_RISK": "review_candidate_then_keep_or_promote",
        "NEEDS_NORMALIZATION": "qa_and_promote_candidate",
        "MANUAL_REVIEW": "manual_frame_review_no_auto_promotion",
        "NEEDS_REPLACEMENT": "replace_from_clean_source",
        "NEEDS_REGENERATION": "regenerate_source_sheet",
    }
    rows = []
    for audit in sheets:
        if audit["classification"] == "PASS" and not audit["semanticFindings"]:
            continue
        rationale = " ".join(audit["reasons"][:2])
        if audit["semanticFindings"]:
            rationale += " " + " ".join(item["recommendation"] for item in audit["semanticFindings"])
        rows.append({
            "priority": audit["priority"],
            "id": audit["id"],
            "classification": audit["classification"],
            "nextAction": action_for_class[audit["classification"]],
            "rationale": rationale.strip(),
        })
    return sorted(rows, key=lambda row: (row["priority"], row["id"]))


def clear_previous_generated_outputs(
    repo_root: Path,
    entries: Sequence[dict[str, Any]],
    candidate_root: Path,
    evidence_root: Path,
) -> None:
    """Remove only prior R3H-generated files for the current manifest IDs."""
    expected_candidate = (repo_root / "public/assets/vfx/normalized_candidates").resolve()
    expected_evidence = (repo_root / "docs/reports/evidence/vfx-r3h-full-runtime").resolve()
    if candidate_root.resolve() != expected_candidate or evidence_root.resolve() != expected_evidence:
        raise RuntimeError("Refusing to clear outputs outside the fixed R3H generated folders.")

    for entry in entries:
        candidate_path = (candidate_root / Path(entry["url"]).name).resolve()
        if candidate_path.parent == expected_candidate and candidate_path.is_file():
            candidate_path.unlink()

        evidence_dir = (evidence_root / entry["id"]).resolve()
        if evidence_dir.parent == expected_evidence and evidence_dir.is_dir():
            shutil.rmtree(evidence_dir)


def run(args: argparse.Namespace) -> dict[str, Any]:
    repo_root = args.repo_root.resolve()
    runtime_root = repo_root / "public/assets/vfx/runtime"
    manifest_path = runtime_root / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    entries = manifest.get("entries", [])
    usage = parse_usage(repo_root)
    sheets = [audit_entry(repo_root, entry, usage) for entry in entries]

    manifest_filenames = {Path(entry["url"]).name for entry in entries}
    runtime_pngs = {path.name for path in runtime_root.glob("*.png")}
    orphan_pngs = sorted(runtime_pngs - manifest_filenames)
    missing_files = sorted(manifest_filenames - runtime_pngs)

    candidate_root = repo_root / "public/assets/vfx/normalized_candidates"
    evidence_root = repo_root / "docs/reports/evidence/vfx-r3h-full-runtime"
    candidate_count = 0
    candidate_manifest: list[dict[str, Any]] = []

    if not args.metrics_only:
        clear_previous_generated_outputs(repo_root, entries, candidate_root, evidence_root)
        candidate_root.mkdir(parents=True, exist_ok=True)
        evidence_root.mkdir(parents=True, exist_ok=True)

    for audit in sheets:
        candidate: Image.Image | None = None
        candidate_meta: dict[str, Any] | None = None
        if not args.no_candidates and not args.metrics_only:
            candidate, candidate_meta = candidate_for_audit(repo_root, audit)
            if candidate is not None and candidate_meta is not None:
                candidate_path = candidate_root / audit["filename"]
                candidate.save(candidate_path, optimize=True)
                candidate_meta = {
                    **candidate_meta,
                    "path": str(candidate_path.relative_to(repo_root)).replace("\\", "/"),
                }
                candidate_manifest.append({"id": audit["id"], **candidate_meta})
                candidate_count += 1
        audit["candidate"] = candidate_meta
        if not args.no_evidence and not args.metrics_only and not audit.get("formatErrors"):
            audit["evidence"] = write_evidence(repo_root, audit, candidate, candidate_meta, evidence_root)

    counts = {classification: sum(1 for audit in sheets if audit["classification"] == classification) for classification in sorted(CLASSIFICATIONS)}
    report: dict[str, Any] = {
        "schemaVersion": 1,
        "mission": "VFX-R3H Full Runtime Spritesheet Normalization Audit",
        "nonDestructive": True,
        "manifest": {
            "path": str(manifest_path.relative_to(repo_root)).replace("\\", "/"),
            "version": manifest.get("version"),
            "runtimeReady": manifest.get("runtime_ready"),
        },
        "thresholds": {
            "alpha": list(ALPHA_THRESHOLDS),
            "safePadding": SAFE_PADDING,
            "bottomBaseline": BOTTOM_BASELINE,
            "expectedSheet": [SHEET_SIZE, SHEET_SIZE],
            "expectedGrid": [ROWS, COLS],
            "expectedFrames": FRAME_COUNT,
        },
        "summary": {
            "manifestEntries": len(entries),
            "auditedSheets": len(sheets),
            "orphanPngs": orphan_pngs,
            "missingManifestFiles": missing_files,
            "candidateCount": candidate_count,
            "classificationCounts": counts,
        },
        "priorityActionReview": build_priority_review(sheets, usage),
        "replacementPlan": replacement_plan(sheets),
        "sheets": sheets,
    }

    if args.metrics_only:
        print("id\talign\tclass\tedge32\tpaired\tmaxWxH\tcenterYRange\tbottomRange")
        for audit in sheets:
            a32 = audit["aggregate"]["alpha32"]
            a8 = audit["aggregate"]["alpha8"]
            print(
                f"{audit['id']}\t{audit['align']}\t{audit['classification']}\t{a32['exactEdgeFrames']}\t"
                f"{audit['internalBoundary']['pairedPixels']}\t{a8['width']['max']}x{a8['height']['max']}\t"
                f"{a8['centerY']['range']}\t{a8['bottom']['range']}"
            )
        return report

    (candidate_root / "normalization-manifest.json").write_text(
        json.dumps({"version": 1, "runtimeReferenced": False, "entries": candidate_manifest}, indent=2) + "\n",
        encoding="utf-8",
    )
    json_path = repo_root / "docs/reports/vfx-r3h-full-runtime-spritesheet-normalization-audit.json"
    md_path = repo_root / "docs/reports/vfx-r3h-full-runtime-spritesheet-normalization-audit.md"
    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    md_path.write_text(markdown_report(report), encoding="utf-8")
    return report


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path(__file__).resolve().parents[2],
        help="RPGThreeJS repository root",
    )
    parser.add_argument("--metrics-only", action="store_true", help="Print metrics without writing candidates, evidence, or reports")
    parser.add_argument("--no-candidates", action="store_true", help="Skip non-destructive normalization candidates")
    parser.add_argument("--no-evidence", action="store_true", help="Skip contact sheets, overlays, and GIF evidence")
    return parser.parse_args()


if __name__ == "__main__":
    result = run(parse_args())
    if not result.get("summary"):
        raise SystemExit(1)
    if not result.get("nonDestructive"):
        raise SystemExit("Audit unexpectedly marked as destructive")

from __future__ import annotations

import unittest
from pathlib import Path
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))

from audit_runtime_spritesheets import (
    BOTTOM_BASELINE,
    FRAME_COUNT,
    FRAME_SIZE,
    SAFE_PADDING,
    aggregate_metrics,
    alpha_bbox,
    classify_sheet,
    compose_sheet,
    detect_internal_boundary_contamination,
    frame_metric,
    normalize_sheet,
    repack_frame,
    shared_scale,
    split_frames,
)


def rectangle_frame(box: tuple[int, int, int, int], alpha: int = 255) -> Image.Image:
    image = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(image).rectangle(box, fill=(255, 180, 80, alpha))
    return image


class VfxAuditToolTests(unittest.TestCase):
    def test_alpha_bbox_respects_threshold(self) -> None:
        alpha = np.zeros((FRAME_SIZE, FRAME_SIZE), dtype=np.uint8)
        alpha[10:20, 30:50] = 16
        alpha[12:18, 35:45] = 64
        self.assertEqual(alpha_bbox(alpha, 8).as_list(), [30, 10, 50, 20])
        self.assertEqual(alpha_bbox(alpha, 32).as_list(), [35, 12, 45, 18])

    def test_edge_detection_reports_contact(self) -> None:
        metric = frame_metric(rectangle_frame((0, 20, 18, 80)), 0)
        self.assertTrue(metric["alpha32"]["exactEdgeContact"])
        self.assertGreater(metric["alpha32"]["exactEdgePixels"]["left"], 0)
        self.assertGreater(metric["alpha32"]["safeBorderPixels"], 0)

    def test_center_repack_centers_bbox(self) -> None:
        packed = repack_frame(rectangle_frame((10, 25, 49, 84)), mode="center", scale=1.0)
        bbox = alpha_bbox(np.asarray(packed)[:, :, 3], 8)
        self.assertAlmostEqual(bbox.center_x, (FRAME_SIZE - 1) / 2, delta=1)
        self.assertAlmostEqual(bbox.center_y, (FRAME_SIZE - 1) / 2, delta=1)

    def test_bottom_repack_uses_shared_baseline(self) -> None:
        packed = repack_frame(rectangle_frame((90, 20, 139, 99)), mode="bottom", scale=1.0)
        bbox = alpha_bbox(np.asarray(packed)[:, :, 3], 8)
        self.assertEqual(bbox.bottom - 1, BOTTOM_BASELINE)

    def test_shared_scale_preserves_safe_padding(self) -> None:
        large = rectangle_frame((0, 0, 255, 255))
        scale = shared_scale([large])
        self.assertAlmostEqual(scale, (FRAME_SIZE - 2 * SAFE_PADDING) / FRAME_SIZE, places=5)
        packed = repack_frame(large, mode="center", scale=scale)
        bbox = alpha_bbox(np.asarray(packed)[:, :, 3], 8)
        self.assertGreaterEqual(bbox.left, SAFE_PADDING)
        self.assertGreaterEqual(bbox.top, SAFE_PADDING)
        self.assertLessEqual(bbox.right, FRAME_SIZE - SAFE_PADDING)
        self.assertLessEqual(bbox.bottom, FRAME_SIZE - SAFE_PADDING)

    def test_sheet_integrity_after_normalization(self) -> None:
        frames = [rectangle_frame((20 + index % 4, 35, 110, 170)) for index in range(FRAME_COUNT)]
        sheet = compose_sheet(frames)
        normalized, metadata = normalize_sheet(sheet, "bottom")
        self.assertEqual(normalized.size, (1280, 1280))
        self.assertEqual(normalized.mode, "RGBA")
        self.assertEqual(len(split_frames(normalized)), FRAME_COUNT)
        self.assertEqual(metadata["safePadding"], SAFE_PADDING)

    def test_internal_boundary_contamination(self) -> None:
        sheet = compose_sheet([Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0)) for _ in range(FRAME_COUNT)])
        draw = ImageDraw.Draw(sheet)
        draw.rectangle((FRAME_SIZE - 1, 30, FRAME_SIZE, 70), fill=(255, 255, 255, 255))
        contamination = detect_internal_boundary_contamination(sheet)
        self.assertGreater(contamination["pairedPixels"], 0)
        self.assertEqual(contamination["suspiciousBoundaryLines"], 0)

    def test_long_internal_grid_line_is_suspicious(self) -> None:
        sheet = compose_sheet([Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0)) for _ in range(FRAME_COUNT)])
        draw = ImageDraw.Draw(sheet)
        draw.line((FRAME_SIZE - 1, 0, FRAME_SIZE - 1, sheet.height - 1), fill=(255, 255, 255, 255), width=1)
        draw.line((FRAME_SIZE, 0, FRAME_SIZE, sheet.height - 1), fill=(255, 255, 255, 255), width=1)
        contamination = detect_internal_boundary_contamination(sheet)
        self.assertGreaterEqual(contamination["suspiciousBoundaryLines"], 1)
        self.assertEqual(contamination["vertical"][0]["longestPairedRun"], sheet.height)

    def test_normalization_preserves_artistic_magenta(self) -> None:
        frame = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
        ImageDraw.Draw(frame).rectangle((80, 80, 176, 176), fill=(255, 0, 255, 255))
        normalized, metadata = normalize_sheet(compose_sheet([frame] * FRAME_COUNT), "center")
        pixels = np.asarray(normalized)
        artistic_magenta = (
            (pixels[:, :, 0] == 255)
            & (pixels[:, :, 1] == 0)
            & (pixels[:, :, 2] == 255)
            & (pixels[:, :, 3] == 255)
        )
        self.assertGreater(int(artistic_magenta.sum()), 0)
        self.assertTrue(metadata["palettePreserved"])

    def test_flat_magenta_background_requires_replacement(self) -> None:
        frame = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (255, 0, 255, 255))
        metrics = [frame_metric(frame, index) for index in range(FRAME_COUNT)]
        analysis = {
            "formatErrors": [],
            "aggregate": {
                "alpha8": aggregate_metrics(metrics, 8),
                "alpha32": aggregate_metrics(metrics, 32),
            },
            "internalBoundary": {"suspiciousBoundaryLines": 0},
            "flatMagentaContaminationFrames": FRAME_COUNT,
        }
        classification, diagnostics, _ = classify_sheet({"id": "synthetic", "align": "center"}, analysis)
        self.assertEqual(classification, "NEEDS_REPLACEMENT")
        self.assertIn("bad-source-composition", diagnostics)

    def test_already_clipped_low_drift_sheet_requires_regeneration(self) -> None:
        frame = rectangle_frame((0, 80, 255, 170))
        sheet = compose_sheet([frame] * FRAME_COUNT)
        frames = split_frames(sheet)
        metrics = [frame_metric(item, index) for index, item in enumerate(frames)]
        analysis = {
            "formatErrors": [],
            "aggregate": {
                "alpha8": aggregate_metrics(metrics, 8),
                "alpha32": aggregate_metrics(metrics, 32),
            },
            "internalBoundary": detect_internal_boundary_contamination(sheet),
            "flatMagentaContaminationFrames": 0,
        }
        classification, diagnostics, _ = classify_sheet({"id": "synthetic", "align": "center"}, analysis)
        self.assertEqual(classification, "NEEDS_REGENERATION")
        self.assertIn("cell-overflow", diagnostics)


if __name__ == "__main__":
    unittest.main()

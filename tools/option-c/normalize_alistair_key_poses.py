#!/usr/bin/env python3
"""Normalize the accepted Alistair master and key poses to one 512px geometry contract."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def alpha_bbox(alpha: np.ndarray) -> list[int] | None:
    ys, xs = np.nonzero(alpha > 0)
    if not len(xs):
        return None
    return [int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)]


def premultiplied_resize(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    rgba = np.asarray(image.convert("RGBA"), dtype=np.float32) / 255.0
    alpha = rgba[:, :, 3]
    premultiplied = rgba[:, :, :3] * alpha[:, :, None]
    resized_alpha = np.asarray(
        Image.fromarray(np.uint8(np.clip(alpha * 255.0, 0, 255)), mode="L").resize(
            size, Image.Resampling.LANCZOS
        ),
        dtype=np.float32,
    ) / 255.0
    channels = []
    for channel in range(3):
        source = Image.fromarray(
            np.uint8(np.clip(premultiplied[:, :, channel] * 255.0, 0, 255)), mode="L"
        )
        channels.append(
            np.asarray(source.resize(size, Image.Resampling.LANCZOS), dtype=np.float32) / 255.0
        )
    resized_premultiplied = np.stack(channels, axis=2)
    safe_alpha = np.maximum(resized_alpha[:, :, None], 1.0 / 255.0)
    rgb = np.where(resized_alpha[:, :, None] > 0, resized_premultiplied / safe_alpha, 0)
    output = np.concatenate((rgb, resized_alpha[:, :, None]), axis=2)
    return Image.fromarray(np.uint8(np.clip(output * 255.0, 0, 255)), mode="RGBA")


def crop_for_destination(
    image: Image.Image, x: int, y: int, frame_size: int
) -> tuple[Image.Image, tuple[int, int]]:
    source_left = max(0, -x)
    source_top = max(0, -y)
    source_right = min(image.width, frame_size - x)
    source_bottom = min(image.height, frame_size - y)
    if source_right <= source_left or source_bottom <= source_top:
        raise RuntimeError("Scaled candidate falls entirely outside the target frame")
    return image.crop((source_left, source_top, source_right, source_bottom)), (
        max(0, x),
        max(0, y),
    )


def transform_point(point: list[int], scale: float, paste: tuple[int, int]) -> list[float]:
    return [round(point[0] * scale + paste[0], 2), round(point[1] * scale + paste[1], 2)]


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, report: dict) -> None:
    contract = report["contract"]
    lines = [
        "# Alistair normalization report",
        "",
        f"Status: **{report['status']}**",
        "",
        "## Shared contract",
        "",
        f"- Frame: {contract['frameSize']}x{contract['frameSize']} RGBA PNG",
        f"- Pivot X: {contract['pivotX']}",
        f"- Foot baseline: {contract['footBaseline']}",
        f"- Target armored-body height: {contract['targetBodyHeight']}",
        f"- Minimum alpha-edge margin: {contract['minimumEdgeMargin']}",
        f"- Resampling: {contract['resampling']}",
        f"- Scale authority pose: {contract['scaleAuthorityPose']}",
        f"- Shared source-to-frame scale: {contract['sharedScale']:.9f}",
        "- Scale rule: the master alone establishes scale; every pose receives that exact scale and is translated only to the shared foot baseline and pivot.",
        "",
        "## Pose measurements",
        "",
        "| Pose | Source body h | Normalized body h | Pose compression | Scale | Alpha bbox | Visible w | Foot | Pivot x | Head center | Body center | Edge L/T/R/B |",
        "|---|---:|---:|---|---:|---:|---:|---|---|---|",
    ]
    for name, pose in report["poses"].items():
        bbox = pose["normalized"]["alphaBBox"]
        edge = pose["normalized"]["edgeClearance"]
        head = pose["normalized"]["headCenter"]
        body = pose["normalized"]["bodyCenter"]
        lines.append(
            f"| {name} | {pose['source']['bodyHeight']} | {pose['normalized']['bodyHeight']} | "
            f"{pose['normalized']['poseCompressionRatio']:.3f} | {pose['normalization']['scale']:.6f} | "
            f"{bbox} | {pose['normalized']['visibleWidth']} | {pose['normalized']['footBaseline']} | "
            f"{pose['normalized']['pivotX']:.2f} | {head} | {body} | "
            f"{edge['left']}/{edge['top']}/{edge['right']}/{edge['bottom']} |"
        )
    lines.extend([
        "",
        "## Consistency",
        "",
        f"- Maximum projected body-height deviation at the shared scale: {report['summary']['maxBodyHeightDeviation']} px (allowed resampling tolerance: {contract['resamplingPositionTolerancePx']} px)",
        f"- Maximum scale deviation: {report['summary']['maxScaleDeviation']:.9f}",
        f"- Normalized pose body-height range: {report['summary']['normalizedBodyHeightRange']} px (pose compression is expected)",
        f"- Minimum observed edge clearance: {report['summary']['minimumObservedEdgeClearance']} px",
        f"- Size consistency: {report['summary']['sizeConsistencyStatus']}",
        f"- Alpha containment: {report['summary']['alphaContainmentStatus']}",
        "",
        "Head/body/weapon reference points are operator-reviewed landmarks recorded in the checked-in config. Pixel bounds, scale, pivot, baseline, transformed landmarks, and clearances are calculated deterministically.",
        "",
    ])
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=Path, required=True)
    parser.add_argument("--json-report", type=Path, required=True)
    parser.add_argument("--md-report", type=Path, required=True)
    args = parser.parse_args()

    config = json.loads(args.config.read_text(encoding="utf-8"))
    contract = config["contract"]
    frame_size = int(contract["frameSize"])
    target_pivot_x = int(contract["pivotX"])
    target_foot = int(contract["footBaseline"])
    target_body_height = int(contract["targetBodyHeight"])
    minimum_margin = int(contract["minimumEdgeMargin"])
    resampling_tolerance = int(contract.get("resamplingPositionTolerancePx", 2))
    foot_band_fraction = float(contract["footBandFraction"])
    authority_name = str(contract.get("scaleAuthorityPose", "master"))
    authority_spec = config["poses"].get(authority_name)
    if authority_spec is None:
        raise RuntimeError(f"Missing scale authority pose: {authority_name}")
    authority_image = Image.open(Path(authority_spec["input"])).convert("RGBA")
    authority_alpha = np.asarray(authority_image.getchannel("A"))
    authority_bbox = alpha_bbox(authority_alpha)
    if authority_bbox is None:
        raise RuntimeError(f"{authority_name}: empty alpha")
    authority_foot = authority_bbox[3] - 1
    authority_head_top = int(authority_spec["sourceHeadTop"])
    authority_body_height = authority_foot - authority_head_top
    shared_scale = target_body_height / authority_body_height
    scale_iterations = 0
    while True:
        scale_iterations += 1
        authority_size = (
            max(1, round(authority_image.width * shared_scale)),
            max(1, round(authority_image.height * shared_scale)),
        )
        authority_scaled = premultiplied_resize(authority_image, authority_size)
        authority_scaled_bbox = alpha_bbox(np.asarray(authority_scaled.getchannel("A")))
        if authority_scaled_bbox is None:
            raise RuntimeError(f"{authority_name}: empty alpha after authority resize")
        authority_paste_y = target_foot - (authority_scaled_bbox[3] - 1)
        authority_mapped_head_top = round(authority_head_top * shared_scale + authority_paste_y)
        authority_observed_height = target_foot - authority_mapped_head_top
        if abs(authority_observed_height - target_body_height) <= 1 or scale_iterations >= 8:
            break
        shared_scale *= target_body_height / authority_observed_height
    if abs(authority_observed_height - target_body_height) > 1:
        raise RuntimeError(
            f"{authority_name}: could not resolve shared scale after {scale_iterations} iterations"
        )

    contract = {
        **contract,
        "scaleAuthorityPose": authority_name,
        "sharedScale": shared_scale,
        "sharedScaleIterations": scale_iterations,
    }
    report: dict = {
        "schemaVersion": 1,
        "status": "PASS",
        "config": args.config.as_posix(),
        "configSha256": sha256(args.config),
        "contract": contract,
        "poses": {},
    }

    body_heights: list[int] = []
    edge_clearances: list[int] = []
    for name, spec in config["poses"].items():
        input_path = Path(spec["input"])
        output_path = Path(spec["output"])
        image = Image.open(input_path).convert("RGBA")
        alpha = np.asarray(image.getchannel("A"))
        source_bbox = alpha_bbox(alpha)
        if source_bbox is None:
            raise RuntimeError(f"{name}: empty alpha")
        source_foot = source_bbox[3] - 1
        source_head_top = int(spec["sourceHeadTop"])
        source_body_height = source_foot - source_head_top
        if source_body_height <= 0:
            raise RuntimeError(f"{name}: invalid source body height")

        band_height = max(1, round(source_body_height * foot_band_fraction))
        band = alpha[max(0, source_foot - band_height + 1) : source_foot + 1] > 0
        _, band_xs = np.nonzero(band)
        if not len(band_xs):
            raise RuntimeError(f"{name}: no alpha in foot band")
        source_pivot_x = (int(band_xs.min()) + int(band_xs.max())) / 2.0
        scale = shared_scale
        scaled_size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
        scaled = premultiplied_resize(image, scaled_size)
        scaled_alpha = np.asarray(scaled.getchannel("A"))
        scaled_bbox = alpha_bbox(scaled_alpha)
        if scaled_bbox is None:
            raise RuntimeError(f"{name}: empty alpha after resize")
        paste_y = target_foot - (scaled_bbox[3] - 1)
        paste_x = round(target_pivot_x - source_pivot_x * scale)
        projected_bbox = [
            scaled_bbox[0] + paste_x,
            scaled_bbox[1] + paste_y,
            scaled_bbox[2] + paste_x,
            scaled_bbox[3] + paste_y,
        ]
        if projected_bbox[0] < 0 or projected_bbox[1] < 0 or projected_bbox[2] > frame_size or projected_bbox[3] > frame_size:
            raise RuntimeError(f"{name}: projected alpha would crop: {projected_bbox}")

        canvas = Image.new("RGBA", (frame_size, frame_size), (0, 0, 0, 0))
        cropped, destination = crop_for_destination(scaled, paste_x, paste_y, frame_size)
        canvas.alpha_composite(cropped, dest=destination)
        normalized_alpha = np.asarray(canvas.getchannel("A"))
        normalized_bbox = alpha_bbox(normalized_alpha)
        if normalized_bbox is None:
            raise RuntimeError(f"{name}: empty normalized alpha")

        edge = {
            "left": normalized_bbox[0],
            "top": normalized_bbox[1],
            "right": frame_size - normalized_bbox[2],
            "bottom": frame_size - normalized_bbox[3],
        }
        minimum_observed = min(edge.values())
        if minimum_observed < minimum_margin:
            raise RuntimeError(f"{name}: edge clearance {edge} violates minimum {minimum_margin}")
        edge_clearances.append(minimum_observed)

        head_center = transform_point(spec["headReferenceSource"], scale, (paste_x, paste_y))
        body_center = transform_point(spec["bodyCenterSource"], scale, (paste_x, paste_y))
        weapon_points = {
            "tip": transform_point(spec["weaponTipSource"], scale, (paste_x, paste_y)),
            "grip": transform_point(spec["weaponGripSource"], scale, (paste_x, paste_y)),
            "pommel": transform_point(spec["weaponPommelSource"], scale, (paste_x, paste_y)),
        }
        transformed_head_top = round(source_head_top * scale + paste_y)
        normalized_body_height = target_foot - transformed_head_top
        expected_body_height = round(source_body_height * shared_scale)
        body_heights.append(normalized_body_height)
        alpha_histogram = np.bincount(normalized_alpha.reshape(-1), minlength=256)
        edge_nonzero = int(
            np.count_nonzero(normalized_alpha[0, :])
            + np.count_nonzero(normalized_alpha[-1, :])
            + np.count_nonzero(normalized_alpha[1:-1, 0])
            + np.count_nonzero(normalized_alpha[1:-1, -1])
        )

        output_path.parent.mkdir(parents=True, exist_ok=True)
        canvas.save(output_path)
        output_sha = sha256(output_path)
        pose_report = {
            "source": {
                "path": input_path.as_posix(),
                "sha256": sha256(input_path),
                "dimensions": [image.width, image.height],
                "alphaBBox": source_bbox,
                "headTop": source_head_top,
                "footBaseline": source_foot,
                "bodyHeight": source_body_height,
                "pivotX": source_pivot_x,
                "headCenter": spec["headReferenceSource"],
                "bodyCenter": spec["bodyCenterSource"],
                "weapon": {
                    "tip": spec["weaponTipSource"],
                    "grip": spec["weaponGripSource"],
                    "pommel": spec["weaponPommelSource"],
                },
            },
            "normalization": {
                "scale": scale,
                "scaleIterations": scale_iterations if name == authority_name else 0,
                "scaledDimensions": list(scaled_size),
                "pastePosition": [paste_x, paste_y],
                "rule": "one master-derived scale for every pose; translation-only baseline and pivot alignment",
            },
            "normalized": {
                "path": output_path.as_posix(),
                "sha256": output_sha,
                "dimensions": [frame_size, frame_size],
                "mode": "RGBA",
                "alphaBBox": normalized_bbox,
                "visibleWidth": normalized_bbox[2] - normalized_bbox[0],
                "bodyHeight": normalized_body_height,
                "expectedBodyHeightAtSharedScale": expected_body_height,
                "poseCompressionRatio": round(source_body_height / authority_body_height, 6),
                "footBaseline": normalized_bbox[3] - 1,
                "pivotX": round(source_pivot_x * scale + paste_x, 2),
                "headTop": transformed_head_top,
                "headCenter": head_center,
                "bodyCenter": body_center,
                "weapon": weapon_points,
                "edgeClearance": edge,
                "alpha": {
                    "minimum": int(normalized_alpha.min()),
                    "maximum": int(normalized_alpha.max()),
                    "transparentPixels": int(alpha_histogram[0]),
                    "partialPixels": int(alpha_histogram[1:255].sum()),
                    "opaquePixels": int(alpha_histogram[255]),
                    "edgeNonzeroPixels": edge_nonzero,
                },
            },
        }
        report["poses"][name] = pose_report

        provenance_path = Path(spec["provenance"])
        provenance = json.loads(provenance_path.read_text(encoding="utf-8"))
        provenance["normalization"] = pose_report["normalized"]
        write_json(provenance_path, provenance)

    projected_deviations = [
        abs(pose["normalized"]["bodyHeight"] - pose["normalized"]["expectedBodyHeightAtSharedScale"])
        for pose in report["poses"].values()
    ]
    deviation = max(projected_deviations)
    scales = [pose["normalization"]["scale"] for pose in report["poses"].values()]
    max_scale_deviation = max(abs(scale - shared_scale) for scale in scales)
    report["summary"] = {
        "maxBodyHeightDeviation": deviation,
        "maxScaleDeviation": max_scale_deviation,
        "normalizedBodyHeightRange": [min(body_heights), max(body_heights)],
        "minimumObservedEdgeClearance": min(edge_clearances),
        "sizeConsistencyStatus": "PASS" if deviation <= resampling_tolerance and max_scale_deviation == 0 else "FAIL",
        "alphaContainmentStatus": "PASS" if min(edge_clearances) >= minimum_margin else "FAIL",
    }
    if deviation > resampling_tolerance or max_scale_deviation != 0:
        report["status"] = "FAIL"
    master = report["poses"]["master"]["normalized"]
    report["contract"]["targetHeadReference"] = master["headCenter"]
    report["contract"]["bodyCenter"] = master["bodyCenter"]
    report["contract"]["weaponReference"] = master["weapon"]["grip"]
    write_json(args.json_report, report)
    write_markdown(args.md_report, report)
    print(json.dumps(report["summary"], indent=2))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())

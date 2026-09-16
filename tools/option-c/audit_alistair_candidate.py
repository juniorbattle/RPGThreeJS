#!/usr/bin/env python3
"""Fail-closed audit for the DEV-only Alistair Sunburst/max candidate package."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image


MODEL = "gpt-image-2.5-sunburst-2026-09-08"
QUALITY = "max"
CANONICAL_SHA = "7e16df524ba10c6f42b08843eecafe5456425ba1e22f39567cd933fe23857942"
SELECTED_PROVENANCE = {
    "alistair-master-candidate-a003-chroma.json",
    "alistair-idle-key-pose-a001.json",
    "alistair-dash-key-pose-a003.json",
    "alistair-attack-key-pose-a001.json",
    "alistair-skill-key-pose-a001.json",
}
EXPECTED_REVIEWS = {
    "alistair-character-master-review.png",
    "alistair-4-pose-contact-sheet.png",
    "alistair-4-pose-dark-background.png",
    "alistair-4-pose-light-background.png",
    "alistair-silhouette-comparison.png",
    "alistair-alpha-bounding-box-review.png",
    "alistair-size-baseline-overlay.png",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path("public/assets/dev/option-c/phase4c/alistair"))
    parser.add_argument("--canonical", type=Path, default=Path("public/assets/characters/pixel/full/alistair.png"))
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    checks: list[dict] = []

    def check(name: str, passed: bool, evidence: object) -> None:
        checks.append({"name": name, "status": "PASS" if passed else "FAIL", "evidence": evidence})

    check("canonical-sha-unchanged", sha256(args.canonical) == CANONICAL_SHA, sha256(args.canonical))

    normalization_path = args.root / "qa" / "alistair-normalization-report.json"
    normalization = load_json(normalization_path)
    check("normalization-report", normalization.get("status") == "PASS", normalization.get("summary"))
    check(
        "one-master-derived-scale",
        normalization["summary"].get("maxScaleDeviation") == 0
        and normalization["contract"].get("scaleAuthorityPose") == "master",
        {
            "authority": normalization["contract"].get("scaleAuthorityPose"),
            "sharedScale": normalization["contract"].get("sharedScale"),
            "maxScaleDeviation": normalization["summary"].get("maxScaleDeviation"),
        },
    )

    normalized_results = {}
    for name in ("master", "idle", "dash", "attack", "skill"):
        path = args.root / "normalized" / f"alistair-{name}.png"
        image = Image.open(path).convert("RGBA")
        alpha = image.getchannel("A")
        bbox = alpha.getbbox()
        edge_nonzero = sum(1 for x in range(image.width) if alpha.getpixel((x, 0)) or alpha.getpixel((x, image.height - 1)))
        edge_nonzero += sum(1 for y in range(1, image.height - 1) if alpha.getpixel((0, y)) or alpha.getpixel((image.width - 1, y)))
        pose = normalization["poses"][name]["normalized"]
        passed = image.size == (512, 512) and bbox is not None and edge_nonzero == 0 and pose["footBaseline"] == 470
        normalized_results[name] = {
            "path": path.as_posix(),
            "sha256": sha256(path),
            "dimensions": list(image.size),
            "mode": image.mode,
            "alphaBBox": list(bbox) if bbox else None,
            "edgeNonzeroPixels": edge_nonzero,
            "footBaseline": pose["footBaseline"],
        }
        check(f"normalized-{name}", passed, normalized_results[name])

    provenance_results = []
    for path in sorted((args.root / "provenance").glob("*.json")):
        data = load_json(path)
        request = data.get("request", {})
        passed = data.get("status") == "SUCCEEDED" and request.get("model") == MODEL and request.get("quality") == QUALITY
        provenance_results.append({
            "file": path.name,
            "candidateId": data.get("candidateId"),
            "status": data.get("status"),
            "model": request.get("model"),
            "quality": request.get("quality"),
            "requestId": data.get("response", {}).get("requestId"),
            "modelReported": data.get("response", {}).get("modelReported"),
            "selection": data.get("selection", {}).get("status"),
            "pass": passed,
        })
    check("all-generation-provenance-locked", all(item["pass"] for item in provenance_results), provenance_results)
    selected_files = {item["file"] for item in provenance_results if item["selection"] == "SELECTED"}
    check("selected-provenance-accounted", selected_files == SELECTED_PROVENANCE, sorted(selected_files))

    review_files = {path.name for path in (args.root / "reviews").glob("*.png")}
    check("human-review-artifacts", EXPECTED_REVIEWS.issubset(review_files), sorted(review_files))

    runtime = load_json(args.root / "qa" / "alistair-runtime-qa.json")
    runtime_capture_files = list((args.root / "reviews" / "runtime").glob("*/*.png"))
    check(
        "real-runtime-proof",
        runtime.get("status") == "PASS"
        and all(value == "PASS" for value in runtime.get("surfaceStatus", {}).values())
        and len(runtime_capture_files) == 8,
        {
            "status": runtime.get("status"),
            "surfaces": runtime.get("surfaceStatus"),
            "viewports": runtime.get("requiredViewports"),
            "captureCount": len(runtime_capture_files),
            "errorCount": runtime.get("errorCount"),
        },
    )

    status = "PASS" if all(item["status"] == "PASS" for item in checks) else "FAIL"
    report = {
        "schemaVersion": 1,
        "status": status,
        "artStatus": "FINAL_PRODUCTION_CANDIDATE",
        "productionApproved": False,
        "requiredModel": MODEL,
        "requiredQuality": QUALITY,
        "fallbackUsed": False,
        "generationRequests": len(provenance_results),
        "masterGenerationAttempts": 3,
        "poseGenerationAttempts": 6,
        "normalized": normalized_results,
        "checks": checks,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"status": status, "checks": len(checks), "output": args.output.as_posix()}, indent=2))
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())

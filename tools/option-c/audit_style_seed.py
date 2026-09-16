#!/usr/bin/env python3
"""Fail-closed audit for the Option C A/B/C common character style-seed gate."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image


MODEL = "gpt-image-2.5-sunburst-2026-09-08"
QUALITY = "max"
REFERENCE_SHA256 = "e4470e9506df2f4c84af286060e85b69983c87cb5bba27d1bb576f50847b7bd7"
CLASSES = ("ranger", "knight", "priestess", "mage")
REVIEW_SUFFIXES = (
    "four-class-lineup",
    "dark-background",
    "light-background",
    "silhouette",
    "grayscale-value",
    "pixel-inspection-400",
    "material-detail-crops",
    "geometry-overlay",
    "baseline-overlay",
    "body-scale-comparison",
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path("."))
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("public/assets/dev/option-c/style-seed/qa/style-seed-audit.json"),
    )
    args = parser.parse_args()
    root = args.root.resolve()
    asset_root = root / "public/assets/dev/option-c/style-seed"
    doc_root = root / "docs/art-direction/option-c/character-style-lock"
    checks: list[dict[str, Any]] = []

    def check(name: str, passed: bool, evidence: Any) -> None:
        checks.append({"name": name, "status": "PASS" if passed else "FAIL", "evidence": evidence})

    reference = doc_root / "references/character-style-reference-v1.png"
    reference_hash = sha256(reference) if reference.is_file() else None
    check(
        "style-reference-v1-byte-lock",
        reference_hash == REFERENCE_SHA256,
        {"path": reference.relative_to(root).as_posix(), "sha256": reference_hash},
    )

    manifest_path = asset_root / "provenance/style-seed-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    check(
        "manifest-generation-lock",
        manifest.get("model") == MODEL
        and manifest.get("quality") == QUALITY
        and manifest.get("fallbackUsed") is False
        and manifest.get("approvedStyleReferenceInputsPerGeneration") == 1
        and manifest.get("legacyCharacterImageInputsPerGeneration") == 0
        and manifest.get("generationAttempts") == 6,
        {
            "model": manifest.get("model"),
            "quality": manifest.get("quality"),
            "fallbackUsed": manifest.get("fallbackUsed"),
            "attempts": manifest.get("generationAttempts"),
        },
    )
    check(
        "operator-final-selection",
        manifest.get("finalStyleSeedSelected") is True
        and manifest.get("characterStyleSeedV1") == "B"
        and manifest.get("characterStyleReferenceRole") == "PRIMARY_ARTISTIC_QUALITY_AUTHORITY"
        and manifest.get("characterStyleSeedRole") == "PRODUCTION_FEASIBILITY_AUTHORITY"
        and manifest.get("candidateStatus") == {
            "A": "VALID_ALTERNATE_NOT_SELECTED",
            "B": "SELECTED_STYLE_AUTHORITY",
            "C": "VALID_ALTERNATE_NOT_SELECTED",
        },
        {
            "characterStyleSeedV1": manifest.get("characterStyleSeedV1"),
            "finalStyleSeedSelected": manifest.get("finalStyleSeedSelected"),
            "candidateStatus": manifest.get("candidateStatus"),
        },
    )

    attempts = manifest.get("attempts", [])
    attempt_evidence = []
    attempt_pass = len(attempts) == 6
    for attempt in attempts:
        provenance_path = root / attempt["provenancePath"]
        raw_path = root / attempt["rawPath"]
        provenance = json.loads(provenance_path.read_text(encoding="utf-8"))
        request = provenance.get("request", {})
        sources = request.get("sourceImages", [])
        valid = (
            provenance.get("status") == "SUCCEEDED"
            and request.get("model") == MODEL
            and request.get("quality") == QUALITY
            and len(sources) == 1
            and sources[0].get("sha256") == REFERENCE_SHA256
            and provenance.get("output", {}).get("sha256") == sha256(raw_path)
            and attempt.get("approvedStyleReferenceInputs") == 1
            and attempt.get("legacyCharacterImageInputs") == 0
            and attempt.get("fallbackUsed") is False
        )
        attempt_pass = attempt_pass and valid
        attempt_evidence.append(
            {
                "candidate": attempt.get("candidate"),
                "attempt": attempt.get("attempt"),
                "status": attempt.get("status"),
                "valid": valid,
                "requestId": attempt.get("requestId"),
                "sourceCount": len(sources),
            }
        )
    check("six-generation-provenance-records", attempt_pass, attempt_evidence)

    for candidate in ("a", "b", "c"):
        metrics_path = asset_root / f"qa/style-seed-{candidate}-metrics.json"
        metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
        expected_status = "SELECTED_STYLE_AUTHORITY" if candidate == "b" else "VALID_ALTERNATE_NOT_SELECTED"
        check(
            f"{candidate}-candidate-contract",
            metrics.get("status") == expected_status
            and metrics.get("selectedAttempt") == 2
            and metrics.get("logicalCanvas") == [128, 128]
            and metrics.get("runtimeCanvas") == [512, 512]
            and metrics.get("upscale") == "NEAREST_NEIGHBOR_X4"
            and metrics.get("pivotLogical") == 64
            and metrics.get("pivotRuntime") == 256
            and metrics.get("footBaselineLogical") == 116
            and metrics.get("footBaselineRuntime") == 464
            and metrics.get("perClassIndependentScaling") is False
            and metrics.get("criticalFailures") == [],
            {
                "status": metrics.get("status"),
                "selectedAttempt": metrics.get("selectedAttempt"),
                "commonScale": metrics.get("commonSourceToLogicalScale"),
                "criticalFailures": metrics.get("criticalFailures"),
            },
        )

        class_metrics = {item["class"]: item for item in metrics.get("classes", [])}
        same_scale = {item.get("sourceToLogicalScale") for item in class_metrics.values()}
        geometry_pass = (
            set(class_metrics) == set(CLASSES)
            and len(same_scale) == 1
            and all(item.get("logicalBbox", [None, None, None, None])[3] == 116 for item in class_metrics.values())
            and all(item.get("minimumEdgeClearance", -1) >= 6 for item in class_metrics.values())
        )
        check(
            f"{candidate}-shared-scale-baseline-edge-clearance",
            geometry_pass,
            {
                name: {
                    "scale": item.get("sourceToLogicalScale"),
                    "bbox": item.get("logicalBbox"),
                    "minimumEdgeClearance": item.get("minimumEdgeClearance"),
                }
                for name, item in class_metrics.items()
            },
        )

        output_pass = True
        output_evidence = []
        for class_name in CLASSES:
            logical_path = asset_root / f"logical-128/style-seed-{candidate}/{class_name}.png"
            runtime_path = asset_root / f"runtime-512/style-seed-{candidate}/{class_name}.png"
            with Image.open(logical_path) as logical_image, Image.open(runtime_path) as runtime_image:
                logical = np.array(logical_image.convert("RGBA"), dtype=np.uint8)
                runtime = np.array(runtime_image.convert("RGBA"), dtype=np.uint8)
            exact = np.array_equal(np.repeat(np.repeat(logical, 4, axis=0), 4, axis=1), runtime)
            valid = logical.shape == (128, 128, 4) and runtime.shape == (512, 512, 4) and exact
            output_pass = output_pass and valid
            output_evidence.append(
                {
                    "class": class_name,
                    "logicalSha256": sha256(logical_path),
                    "runtimeSha256": sha256(runtime_path),
                    "exactNearestNeighborX4": exact,
                }
            )
        check(f"{candidate}-exact-logical-runtime-exports", output_pass, output_evidence)

        review_paths = [asset_root / f"reviews/style-seed-{candidate}-{suffix}.png" for suffix in REVIEW_SUFFIXES]
        check(
            f"{candidate}-complete-review-matrix",
            all(path.is_file() and path.stat().st_size > 0 for path in review_paths),
            [path.relative_to(root).as_posix() for path in review_paths],
        )

    scorecard_path = asset_root / "qa/style-seed-scorecard.json"
    scorecard = json.loads(scorecard_path.read_text(encoding="utf-8"))
    score_pass = scorecard.get("finalStyleSeedSelected") is True and scorecard.get("characterStyleSeedV1") == "B"
    for key, candidate in scorecard.get("candidates", {}).items():
        expected_status = "SELECTED_STYLE_AUTHORITY" if key == "B" else "VALID_ALTERNATE_NOT_SELECTED"
        score_pass = score_pass and candidate.get("status") == expected_status
        score_pass = score_pass and candidate.get("criticalFailures") == []
        score_pass = score_pass and all(
            item.get("status") == "PASS" and item.get("scoreOutOf5", 0) >= 3
            for item in candidate.get("scorecard", {}).values()
        )
    check(
        "scorecard-critical-pass-and-final-selection",
        score_pass,
        {
            "recommendedCandidate": scorecard.get("recommendedCandidate"),
            "finalStyleSeedSelected": scorecard.get("finalStyleSeedSelected"),
        },
    )

    protected_state = {
        "canonicalAssetsChanged": manifest.get("canonicalAssetsChanged"),
        "runtimeChanged": manifest.get("runtimeChanged"),
        "gameplayChanged": manifest.get("gameplayChanged"),
        "combatLogicChanged": manifest.get("combatLogicChanged"),
        "vfxChanged": manifest.get("vfxChanged"),
    }
    check("protected-state-declarations", all(value is False for value in protected_state.values()), protected_state)

    failed = [item for item in checks if item["status"] == "FAIL"]
    report = {
        "schemaVersion": 1,
        "status": "PASS" if not failed else "FAIL",
        "checksPassed": len(checks) - len(failed),
        "checksFailed": len(failed),
        "checks": checks,
    }
    output = args.output if args.output.is_absolute() else root / args.output
    write_json(output, report)
    print(json.dumps({
        "status": report["status"],
        "checksPassed": report["checksPassed"],
        "checksFailed": report["checksFailed"],
        "output": output.relative_to(root).as_posix(),
    }, indent=2))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())

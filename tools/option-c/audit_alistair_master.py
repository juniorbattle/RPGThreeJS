#!/usr/bin/env python3
"""Audit the from-scratch Alistair master operator-gate bundle."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
ASSET_ROOT = ROOT / "public/assets/dev/option-c/character-masters/alistair"
MANIFEST_PATH = ASSET_ROOT / "provenance/alistair-master-manifest.json"
SCORECARD_PATH = ASSET_ROOT / "qa/alistair-master-scorecard.json"
REFERENCE_SHA256 = "e4470e9506df2f4c84af286060e85b69983c87cb5bba27d1bb576f50847b7bd7"
SEED_B_SHA256 = "d5ba51cb46f3589dfab4433ed2ceeabe2fbc803514b7e5bdbff6aa7fb46014cd"
MODEL = "gpt-image-2.5-sunburst-2026-09-08"
QUALITY = "max"
REQUIRED_REVIEWS = {
    "dark-background",
    "light-background",
    "silhouette",
    "grayscale-value",
    "pixel-inspection-400",
    "armor-detail",
    "helmet-detail",
    "sword-detail",
    "geometry-overlay",
    "pivot-baseline-overlay",
}
REQUIRED_QA = {
    "TRUE_PIXEL_ART_CONSTRUCTION",
    "MODERNITY",
    "REFERENCE_V1_VISUAL_MATCH",
    "SEED_B_TECHNICAL_COMPATIBILITY",
    "FACE_CONCEALMENT",
    "SILHOUETTE_READABILITY",
    "PROPORTION_COHERENCE",
    "ARMOR_READABILITY",
    "WEAPON_READABILITY",
    "PIXEL_CLUSTER_DISCIPLINE",
    "MATERIAL_READABILITY",
    "ANIMATION_FEASIBILITY",
    "TACTICAL_READABILITY",
    "HD2D_ENVIRONMENT_COMPATIBILITY",
    "NO_PAINTERLY_DRIFT",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def resolve(repo_path: str) -> Path:
    return ROOT / Path(repo_path)


def check(condition: bool, message: str, failures: list[str]) -> None:
    if not condition:
        failures.append(message)


def main() -> int:
    failures: list[str] = []
    checks: list[str] = []
    manifest = load_json(MANIFEST_PATH)
    scorecard = load_json(SCORECARD_PATH)

    check(manifest["baseline"] == "b109dab6714634ad11d066f1461ff58b3ffbbc62", "baseline mismatch", failures)
    check(manifest["generationMode"] == "TEXT_PLUS_APPROVED_STYLE_AUTHORITIES", "generation mode mismatch", failures)
    check(manifest["characterStyleReference"] == "V1", "style reference is not V1", failures)
    check(manifest["styleReferenceSha256"] == REFERENCE_SHA256, "V1 manifest hash mismatch", failures)
    check(sha256(resolve(manifest["styleReferencePath"])) == REFERENCE_SHA256, "V1 file hash mismatch", failures)
    check(manifest["characterStyleSeedV1"] == "B", "selected style seed is not B", failures)
    check(manifest["styleSeedSha256"] == SEED_B_SHA256, "Seed B manifest hash mismatch", failures)
    check(sha256(resolve(manifest["styleSeedPath"])) == SEED_B_SHA256, "Seed B file hash mismatch", failures)
    check(manifest["model"] == MODEL, "model lock mismatch", failures)
    check(manifest["quality"] == QUALITY, "quality lock mismatch", failures)
    check(manifest["fallbackUsed"] is False, "fallback was used", failures)
    check(manifest["imageGenerationAttempts"] == 6, "generation attempt count is not 6", failures)
    check(manifest["approvedStyleAuthorityInputsPerGeneration"] == 2, "approved input count mismatch", failures)
    check(manifest["legacyCharacterImageInputsPerGeneration"] == 0, "legacy character image input count is not zero", failures)
    checks.append("authority/model/input lock")

    attempts = manifest["attempts"]
    check(len(attempts) == 6, "attempt ledger does not contain 6 records", failures)
    accepted = [item for item in attempts if item["selectedForNormalization"]]
    rejected = [item for item in attempts if not item["selectedForNormalization"]]
    check(len(accepted) == 3, "accepted-attempt count is not 3", failures)
    check(len(rejected) == 3, "rejected-attempt count is not 3", failures)
    for attempt in attempts:
        raw = resolve(attempt["rawPath"])
        prompt = resolve(attempt["promptPath"])
        provenance = resolve(attempt["provenancePath"])
        check(raw.is_file() and sha256(raw) == attempt["rawSha256"], f"raw hash mismatch: {raw}", failures)
        check(prompt.is_file() and sha256(prompt) == attempt["promptSha256"], f"prompt hash mismatch: {prompt}", failures)
        check(provenance.is_file(), f"missing provenance: {provenance}", failures)
        if provenance.is_file():
            payload = load_json(provenance)
            sources = payload["request"]["sourceImages"]
            source_hashes = {entry["sha256"] for entry in sources}
            check(len(sources) == 2, f"approved source count mismatch: {provenance}", failures)
            check(source_hashes == {REFERENCE_SHA256, SEED_B_SHA256}, f"unapproved visual source: {provenance}", failures)
            check(payload["request"]["model"] == MODEL, f"model mismatch: {provenance}", failures)
            check(payload["request"]["quality"] == QUALITY, f"quality mismatch: {provenance}", failures)
        check(attempt["legacyCharacterImageInputs"] == 0, f"legacy input count mismatch: {provenance}", failures)
    checks.append("six-attempt provenance ledger")

    norm = manifest["normalization"]
    check(norm["logicalCanvas"] == [128, 128], "logical canvas mismatch", failures)
    check(norm["runtimeCanvas"] == [512, 512], "runtime canvas mismatch", failures)
    check(norm["logicalToRuntimeResampling"] == "exact-nearest-neighbor-x4", "runtime upscale mismatch", failures)
    check(norm["pivotLogical"] == 64 and norm["pivotRuntime"] == 256, "pivot mismatch", failures)
    check(norm["footBaselineLogical"] == 116 and norm["footBaselineRuntime"] == 464, "baseline mismatch", failures)
    check(norm["targetUprightBodyHeightLogical"] == 84, "body-height target mismatch", failures)
    check(norm["independentFillScaling"] is False, "independent fill scaling was enabled", failures)
    checks.append("common geometry contract")

    for candidate in ("A", "B", "C"):
        metric = manifest["candidates"][candidate]
        check(metric["status"] == "MASTER_CANDIDATE", f"{candidate}: invalid status", failures)
        check(metric["logicalBodyHeight"] == 84, f"{candidate}: body height is not 84", failures)
        check(metric["footBaselineLogical"] == 116, f"{candidate}: baseline mismatch", failures)
        check(metric["pivotLogicalX"] == 64, f"{candidate}: pivot mismatch", failures)
        check(metric["minimumEdgeClearance"] >= 6, f"{candidate}: edge clearance below 6", failures)
        check(metric["independentFillScaling"] is False, f"{candidate}: independent fill scaling enabled", failures)
        check(metric["exactNearestNeighborX4"] is True, f"{candidate}: x4 flag false", failures)

        logical_path = resolve(metric["logicalPath"])
        runtime_path = resolve(metric["runtimePath"])
        check(sha256(logical_path) == metric["logicalSha256"], f"{candidate}: logical hash mismatch", failures)
        check(sha256(runtime_path) == metric["runtimeSha256"], f"{candidate}: runtime hash mismatch", failures)
        logical = np.array(Image.open(logical_path).convert("RGBA"), dtype=np.uint8)
        runtime = np.array(Image.open(runtime_path).convert("RGBA"), dtype=np.uint8)
        check(logical.shape == (128, 128, 4), f"{candidate}: logical shape mismatch", failures)
        check(runtime.shape == (512, 512, 4), f"{candidate}: runtime shape mismatch", failures)
        expected = np.repeat(np.repeat(logical, 4, axis=0), 4, axis=1)
        check(np.array_equal(runtime, expected), f"{candidate}: runtime is not exact nearest x4", failures)
        check(set(np.unique(logical[..., 3])).issubset({0, 255}), f"{candidate}: alpha is not binary", failures)
        opaque = logical[logical[..., 3] > 0, :3]
        check(len(np.unique(opaque, axis=0)) <= 64, f"{candidate}: palette exceeds 64 colors", failures)
        review_kinds = {item["kind"] for item in metric["reviews"]}
        check(review_kinds == REQUIRED_REVIEWS, f"{candidate}: review set mismatch", failures)
        for review in metric["reviews"]:
            path = resolve(review["path"])
            check(path.is_file() and sha256(path) == review["sha256"], f"{candidate}: review hash mismatch {path}", failures)
    checks.append("A/B/C logical-runtime-review artifacts")

    comparison = resolve(manifest["comparisonBoard"])
    check(comparison.is_file(), "missing A/B/C comparison board", failures)
    check(scorecard["maximumCandidateStatus"] == "MASTER_CANDIDATE", "scorecard maximum status mismatch", failures)
    check(scorecard["recommendedAlistairMaster"] in {"A", "B", "C", "NONE"}, "invalid recommendation", failures)
    check(scorecard["alistairCharacterMasterSelected"] is False, "operator selection was applied", failures)
    for candidate in ("A", "B", "C"):
        categories = set(scorecard["candidates"][candidate]["scorecard"])
        check(categories == REQUIRED_QA, f"{candidate}: QA category set mismatch", failures)
        check(scorecard["candidates"][candidate]["status"] == "MASTER_CANDIDATE", f"{candidate}: scorecard status mismatch", failures)
        check(not scorecard["candidates"][candidate]["criticalFailures"], f"{candidate}: critical failures present", failures)
    checks.append("operator-gate scorecard")

    forbidden_pose_tokens = ("idle", "dash", "attack", "skill", "cast")
    pose_files = [path for path in ASSET_ROOT.rglob("*") if path.is_file() and any(token in path.name.lower() for token in forbidden_pose_tokens)]
    check(not pose_files, "pose or animation artifacts were generated", failures)
    check(manifest["alistairCharacterMasterSelected"] is False, "manifest records an unauthorized final selection", failures)
    for key in ("canonicalAssetsChanged", "runtimeChanged", "gameplayChanged", "combatLogicChanged", "vfxChanged"):
        check(manifest[key] is False, f"protected-state flag is true: {key}", failures)
    checks.append("scope and operator gate")

    report = {
        "schemaVersion": 1,
        "status": "FAIL" if failures else "PASS",
        "checks": checks,
        "failures": failures,
        "candidateStatus": manifest["candidateStatus"],
        "recommendedAlistairMaster": scorecard["recommendedAlistairMaster"],
        "alistairCharacterMasterSelected": False,
    }
    write_path = ASSET_ROOT / "qa/alistair-master-audit.json"
    write_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())

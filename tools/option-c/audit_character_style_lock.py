#!/usr/bin/env python3
"""Fail-closed audit for the Option C character-style preproduction lock."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

from PIL import Image


EXPECTED_MODEL = "gpt-image-2.5-sunburst-2026-09-08"
EXPECTED_QUALITY = "max"
EXPECTED_STYLE_REFERENCE = Path(
    "docs/art-direction/option-c/character-style-lock/references/character-style-reference-v1.png"
)
EXPECTED_STYLE_REFERENCE_HASH = "e4470e9506df2f4c84af286060e85b69983c87cb5bba27d1bb576f50847b7bd7"
EXPECTED_ACTIVE = {
    "warrior": ("Alistair", "alistair.md"),
    "white_mage": ("Marian", "marian.md"),
    "dark_mage": ("Elara", "elara.md"),
}
EXPECTED_HASHES = {
    "warrior": "7e16df524ba10c6f42b08843eecafe5456425ba1e22f39567cd933fe23857942",
    "white_mage": "152e6a17afbf99ae18aea2b14253db067fb76719beffd3809d9613b8ee6c8191",
    "dark_mage": "fc9a38e614b466c2258becac7b0f39618058b02a9b4ebdcaced541d2ebe99b74",
    "archer": "e948beb899eef71940aec200c3747e098a2c2f980ba16ec5e6e15b2ae5a700ec",
}
REQUIRED_HEADINGS = (
    "## 2. Refined style brief",
    "## 3. Silhouette and readability breakdown",
    "## 4. Proportion and scale contract",
    "## 5. Key-pose target pack",
    "## 6. Animation consistency checklist",
    "## 7. Prompt wording guidance",
    "## 8. Explicit rejection criteria",
)
REQUIRED_POSE_TERMS = ("Idle", "Dash", "Attack")
REQUIRED_SURFACE_TERMS = ("Tableau", "Strategic", "Combat Stage")


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
    parser.add_argument(
        "--contract-root",
        type=Path,
        default=Path("docs/art-direction/option-c/character-style-lock"),
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("docs/art-direction/option-c/character-style-lock/qa-report.json"),
    )
    args = parser.parse_args()

    contract_path = args.contract_root / "roster-contract.json"
    contract = json.loads(contract_path.read_text(encoding="utf-8"))
    checks: list[dict[str, Any]] = []

    def check(name: str, passed: bool, evidence: Any) -> None:
        checks.append({
            "name": name,
            "status": "PASS" if passed else "FAIL",
            "evidence": evidence,
        })

    construction = contract.get("construction", {})
    check(
        "native-pixel-construction",
        construction.get("logicalCanvas") == [128, 128]
        and construction.get("deliveryCanvas") == [512, 512]
        and construction.get("integerExportScale") == 4
        and construction.get("resampling") == "nearest-neighbor",
        construction,
    )
    check(
        "shared-pivot-and-baseline",
        construction.get("pivotLogical") == [64, 116]
        and construction.get("pivotDelivery") == [256, 464]
        and construction.get("perPoseScale") == 1.0
        and construction.get("independentPoseScalingAllowed") is False,
        {
            "pivotLogical": construction.get("pivotLogical"),
            "pivotDelivery": construction.get("pivotDelivery"),
            "perPoseScale": construction.get("perPoseScale"),
            "independentPoseScalingAllowed": construction.get("independentPoseScalingAllowed"),
        },
    )
    check(
        "model-lock",
        contract.get("requiredModel") == EXPECTED_MODEL
        and contract.get("requiredQuality") == EXPECTED_QUALITY
        and contract.get("fallbackAllowed") is False,
        {
            "model": contract.get("requiredModel"),
            "quality": contract.get("requiredQuality"),
            "fallbackAllowed": contract.get("fallbackAllowed"),
        },
    )
    style_reference = contract.get("styleReference", {})
    style_reference_path = Path(style_reference.get("path", ""))
    style_reference_hash = sha256(style_reference_path) if style_reference_path.is_file() else None
    check(
        "approved-style-reference-v1",
        style_reference_path == EXPECTED_STYLE_REFERENCE
        and style_reference_hash == EXPECTED_STYLE_REFERENCE_HASH
        and style_reference.get("sha256") == EXPECTED_STYLE_REFERENCE_HASH
        and style_reference.get("approvedStyleReferenceInputCount") == 1
        and style_reference.get("legacyCharacterImageInputCount") == 0
        and style_reference.get("identityAuthority") is False
        and style_reference.get("directDesignTemplate") is False,
        {
            "path": style_reference_path.as_posix(),
            "declaredSha256": style_reference.get("sha256"),
            "actualSha256": style_reference_hash,
            "approvedStyleReferenceInputCount": style_reference.get("approvedStyleReferenceInputCount"),
            "legacyCharacterImageInputCount": style_reference.get("legacyCharacterImageInputCount"),
        },
    )
    check(
        "preproduction-boundary",
        contract.get("productionApproved") is False
        and contract.get("massGenerationAuthorized") is False
        and contract.get("runtimeIntegrationAuthorized") is False,
        {
            "productionApproved": contract.get("productionApproved"),
            "massGenerationAuthorized": contract.get("massGenerationAuthorized"),
            "runtimeIntegrationAuthorized": contract.get("runtimeIntegrationAuthorized"),
        },
    )

    source_policy = contract.get("generationSourcePolicy", {})
    check(
        "fresh-base-source-policy",
        source_policy.get("buildFromScratch") is True
        and source_policy.get("legacyCharacterImagesAsModelInputs") is False
        and source_policy.get("legacyAnimationFramesAsModelInputs") is False
        and source_policy.get("legacyDerivedCandidatesAsModelInputs") is False
        and source_policy.get("legacyTracingOrRepaintingAllowed") is False
        and source_policy.get("freshRosterStyleSeedRequired") is True
        and source_policy.get("freshCharacterMasterRequired") is True
        and source_policy.get("styleSeedGenerationMode") == "TEXT_PLUS_APPROVED_STYLE_REFERENCE"
        and source_policy.get("allowedStyleSeedInputs")
        == ["written-global-doctrine", "character-style-reference-v1"],
        source_policy,
    )

    characters = contract.get("characters", {})
    check(
        "active-roster",
        all(
            character_id in characters
            and characters[character_id].get("displayName") == display_name
            and characters[character_id].get("contract") == document
            for character_id, (display_name, document) in EXPECTED_ACTIVE.items()
        ),
        sorted(characters),
    )

    for character_id, expected_hash in EXPECTED_HASHES.items():
        character = characters[character_id]
        legacy_reference = Path(character["legacyReference"])
        actual_hash = sha256(legacy_reference)
        with Image.open(legacy_reference) as image:
            evidence = {
                "path": legacy_reference.as_posix(),
                "sha256": actual_hash,
                "dimensions": list(image.size),
                "mode": image.mode,
                "alphaBBox": list(image.convert("RGBA").getchannel("A").getbbox() or ()),
            }
        check(
            f"canonical-{character_id}",
            actual_hash == expected_hash and evidence["dimensions"] == [640, 768],
            evidence,
        )

    for character_id, (_, document) in EXPECTED_ACTIVE.items():
        path = args.contract_root / document
        text = path.read_text(encoding="utf-8")
        headings_ok = all(heading in text for heading in REQUIRED_HEADINGS)
        poses_ok = all(term in text for term in REQUIRED_POSE_TERMS) and (
            "Skill" in text or "Cast" in text
        )
        surfaces_ok = all(term in text for term in REQUIRED_SURFACE_TERMS)
        check(
            f"deliverables-{character_id}",
            headings_ok and poses_ok and surfaces_ok,
            {
                "path": path.as_posix(),
                "requiredHeadings": headings_ok,
                "keyPoseTerms": poses_ok,
                "surfaceTerms": surfaces_ok,
            },
        )

    required_files = {
        "README.md",
        "alistair.md",
        "marian.md",
        "elara.md",
        "kestrel-benchmark.md",
        "generation-gate.md",
        "roster-contract.json",
    }
    present_files = {path.name for path in args.contract_root.iterdir() if path.is_file()}
    check("required-artifacts", required_files.issubset(present_files), sorted(present_files))

    kestrel = characters.get("archer", {})
    check(
        "kestrel-structural-boundary",
        kestrel.get("status") == "STRUCTURAL_GOLD_REFERENCE_ONLY"
        and kestrel.get("modifiedInThisPhase") is False,
        kestrel,
    )

    candidate_policy = contract.get("currentCandidatePolicy", {})
    check(
        "legacy-alistair-classification",
        candidate_policy.get("existingAlistairSunburstPack")
        == "LEGACY_DERIVED_REJECTED_FOR_NEW_PIPELINE"
        and candidate_policy.get("allowedAsVisualBase") is False
        and candidate_policy.get("deleted") is False
        and candidate_policy.get("productionPromoted") is False,
        candidate_policy,
    )

    status = "PASS" if all(item["status"] == "PASS" for item in checks) else "FAIL"
    report = {
        "schemaVersion": 1,
        "status": status,
        "contractStatus": contract.get("status"),
        "productionApproved": False,
        "activeCharacters": list(EXPECTED_ACTIVE),
        "checksPassed": sum(item["status"] == "PASS" for item in checks),
        "checksFailed": sum(item["status"] == "FAIL" for item in checks),
        "checks": checks,
    }
    write_json(args.output, report)
    print(json.dumps({
        "status": status,
        "checksPassed": report["checksPassed"],
        "checksFailed": report["checksFailed"],
        "output": args.output.as_posix(),
    }, indent=2))
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())

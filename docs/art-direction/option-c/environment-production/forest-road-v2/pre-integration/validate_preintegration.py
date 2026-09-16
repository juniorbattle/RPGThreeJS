from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from PIL import Image


ROOT = Path(__file__).resolve().parents[6]
PACKAGE = ROOT / "public/assets/dev/option-c/phase4b/environment/forest-road-v2"
REPORT = Path(__file__).with_name("preintegration-validation.json")
EXISTING_PHASE4B_MANIFEST = ROOT / "docs/art-direction/option-c/phase4b-runtime-proof/manifests/runtime-proof-manifest.json"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def in_unit_interval(value: Any) -> bool:
    if isinstance(value, (int, float)):
        return 0 <= value <= 1
    if isinstance(value, list):
        return all(in_unit_interval(item) for item in value)
    if isinstance(value, dict):
        return all(in_unit_interval(item) for item in value.values())
    return True


def main() -> None:
    selection = json.loads((PACKAGE / "selection-manifest.json").read_text(encoding="utf-8"))
    provenance = json.loads((PACKAGE / "provenance.json").read_text(encoding="utf-8"))
    staging = json.loads((PACKAGE / "staging-metadata.json").read_text(encoding="utf-8"))
    preview = json.loads((PACKAGE / "runtime-preview-targets.json").read_text(encoding="utf-8"))
    existing_manifest = json.loads(EXISTING_PHASE4B_MANIFEST.read_text(encoding="utf-8"))

    checks: list[dict[str, Any]] = []
    selected_hashes: dict[str, str] = {}
    for surface in selection["surfaces"]:
        source = ROOT / surface["source"]
        destination = PACKAGE / surface["packageAsset"]
        source_hash = sha256(source)
        destination_hash = sha256(destination)
        with Image.open(destination) as image:
            dimensions = [image.width, image.height]
            mode = image.mode
            image_format = image.format
        passed = (
            source_hash == destination_hash == surface["sha256"]
            and dimensions == [1672, 941]
            and mode == "RGB"
            and image_format == "PNG"
            and destination.stat().st_size == surface["bytes"]
        )
        selected_hashes[surface["surfaceId"]] = destination_hash
        checks.append({
            "id": f"selected_{surface['surfaceId'].lower()}_byte_identity",
            "pass": passed,
            "source": str(source.relative_to(ROOT)).replace("\\", "/"),
            "destination": str(destination.relative_to(ROOT)).replace("\\", "/"),
            "sha256": destination_hash,
            "dimensions": dimensions,
            "mode": mode,
            "format": image_format,
        })

    existing_environment_entries = [
        entry
        for entry in existing_manifest["runtimeAssets"]
        if "/phase4b/environment/" in entry["runtimeDerivative"]
    ]
    existing_preserved = all(
        sha256(ROOT / entry["runtimeDerivative"]) == entry["sha256"]
        for entry in existing_environment_entries
    )
    checks.append({
        "id": "existing_phase4b_environment_assets_preserved",
        "pass": existing_preserved and len(existing_environment_entries) == 4,
        "files": [entry["runtimeDerivative"] for entry in existing_environment_entries],
    })

    review_candidates = list((ROOT / "public/assets/dev/option-c/environments/forest-road-v2").glob("*/*.png"))
    clean_candidates = [
        path
        for path in review_candidates
        if path.parent.name in {"travel", "tableau", "strategic", "combat-stage"}
    ]
    checks.append({
        "id": "all_review_candidates_preserved",
        "pass": len(clean_candidates) == 12,
        "count": len(clean_candidates),
    })

    staging_ranges_pass = in_unit_interval(staging["surfaces"])
    checks.append({
        "id": "staging_metadata_normalized",
        "pass": staging_ranges_pass,
    })

    expected_urls = {surface["surfaceId"]: surface["runtimeUrl"] for surface in selection["surfaces"]}
    preview_urls = {surface_id: data["url"] for surface_id, data in preview["targets"].items()}
    checks.append({
        "id": "runtime_preview_urls_match_selection",
        "pass": expected_urls == preview_urls and preview["targetsPrepared"] and not preview["targetsWired"],
    })

    provenance_entries = {entry["surfaceId"]: entry["sha256"] for entry in provenance["entries"]}
    checks.append({
        "id": "provenance_matches_selected_assets",
        "pass": provenance_entries == selected_hashes,
    })

    hash_manifest_entries = {}
    for line in (PACKAGE / "asset-manifest.sha256").read_text(encoding="utf-8").splitlines():
        expected_hash, filename = line.split(maxsplit=1)
        hash_manifest_entries[filename] = expected_hash
    actual_hash_entries = {
        surface["packageAsset"]: selected_hashes[surface["surfaceId"]]
        for surface in selection["surfaces"]
    }
    checks.append({
        "id": "sha256_manifest_matches_selected_assets",
        "pass": hash_manifest_entries == actual_hash_entries,
    })

    selected_candidates = {
        surface["surfaceId"]: surface["selectedCandidate"]
        for surface in selection["surfaces"]
    }
    checks.append({
        "id": "operator_selection_lock",
        "pass": selected_candidates == {
            "TRAVEL": "B",
            "STATIC_TABLEAU": "B",
            "STRATEGIC_COMBAT": "B",
            "COMBAT_STAGE": "C",
        },
    })

    tableau = staging["surfaces"]["STATIC_TABLEAU"]
    strategic = staging["surfaces"]["STRATEGIC_COMBAT"]
    combat_stage = staging["surfaces"]["COMBAT_STAGE"]
    checks.append({
        "id": "surface_semantic_locks",
        "pass": (
            tableau["characterFreeEnvironment"]
            and tableau["runtimeActorsOnly"]
            and tableau["companyGeography"] == "LEFT"
            and tableau["lionCourtGeography"] == "RIGHT"
            and strategic["cameraDoctrine"] == "SLIGHTLY_ELEVATED_FRONTAL"
            and strategic["runtimePlacementAuthority"] == "EXISTING_COMBAT_RUNTIME"
            and combat_stage["geography"] == "ATTACKER_LEFT_TARGET_RIGHT"
            and combat_stage["vfxOwnership"] == "RUNTIME_OWNED"
            and not combat_stage["bakedVfx"]
        ),
    })

    result = {
        "schemaVersion": 1,
        "packageId": selection["packageId"],
        "status": "PASS" if all(check["pass"] for check in checks) else "FAIL",
        "checks": checks,
        "invariants": selection["invariants"],
    }
    REPORT.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    raise SystemExit(0 if result["status"] == "PASS" else 1)


if __name__ == "__main__":
    main()

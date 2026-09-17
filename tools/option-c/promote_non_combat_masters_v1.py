from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path
from typing import Any

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
PIXEL_ROOT = ROOT / "public/assets/characters/pixel"
DEV_ROOT = ROOT / "public/assets/dev/option-c/non-combat-masters-v1"
DEV_MASTERS = DEV_ROOT / "masters"
DEV_MANIFEST = DEV_ROOT / "manifests/non-combat-masters-v1-manifest.json"
MASTER_ROOT = PIXEL_ROOT / "masters"
COMBAT_ROOT = PIXEL_ROOT / "combat"
FULL_ROOT = PIXEL_ROOT / "full"
LEGACY_ARCHIVE_ROOT = PIXEL_ROOT / "archive/legacy-full"
NON_DEMO_ARCHIVE_ROOT = PIXEL_ROOT / "archive/non-demo"
LEGACY_ARCHIVE_MANIFEST = LEGACY_ARCHIVE_ROOT / "legacy-full-retirement-manifest.json"
PUBLIC_MANIFEST = PIXEL_ROOT / "character-system-v2-manifest.json"
RUNTIME_MANIFEST = ROOT / "src/render/generated/characterSystemV2Manifest.json"
ALIAS_MAP = PIXEL_ROOT / "character-alias-map.json"
CENSUS = PIXEL_ROOT / "non-combat-master-census.json"
CLEANUP_REPORT = PIXEL_ROOT / "full-cleanup-report.json"
NON_DEMO_ARCHIVE_MANIFEST = NON_DEMO_ARCHIVE_ROOT / "archive-manifest.json"
PROMOTION_REPORT = PIXEL_ROOT / "master-promotion-report.json"

FINAL_ACTIVE = [
    "alaric",
    "maelor",
    "sage_seraphine",
    "refugee_mother",
    "survivor",
    "villageoise",
    "wounded_merchant",
]
OPTIONAL_CIVILIANS = ["villageois", "refugee"]
VILLAGE_MILITIA = [
    "village_militia_spearman",
    "village_militia_brute",
    "village_militia_slinger",
]
PROMOTED = FINAL_ACTIVE + OPTIONAL_CIVILIANS + VILLAGE_MILITIA
CATEGORIES = {
    "alaric": "KEY_STORY",
    "maelor": "KEY_STORY",
    "sage_seraphine": "KEY_STORY",
    "refugee_mother": "ACTIVE_CIVILIAN",
    "survivor": "ACTIVE_CIVILIAN",
    "villageoise": "ACTIVE_CIVILIAN",
    "wounded_merchant": "ACTIVE_CIVILIAN",
    "villageois": "OPTIONAL_CIVILIAN",
    "refugee": "OPTIONAL_CIVILIAN",
    "village_militia_spearman": "GENERIC_VILLAGE_MILITIA",
    "village_militia_brute": "GENERIC_VILLAGE_MILITIA",
    "village_militia_slinger": "GENERIC_VILLAGE_MILITIA",
}
TEXT_SUFFIXES = {".css", ".html", ".js", ".json", ".mjs", ".py", ".ts", ".tsx", ".txt"}
ACTIVE_ROOTS = (ROOT / "src", ROOT / "tools/cinematics")
LOCK_TESTS = {
    ROOT / "tools/cinematics/cin6ea_preproduction.test.mjs",
    ROOT / "tools/cinematics/cin6ea_finalization.test.mjs",
}


def rel(path: Path) -> str:
    return path.resolve().relative_to(ROOT.resolve()).as_posix()


def public_url(path: Path) -> str:
    return "/" + path.resolve().relative_to((ROOT / "public").resolve()).as_posix()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def alpha_bounds(path: Path) -> list[int]:
    with Image.open(path) as image:
        rgba = image.convert("RGBA")
    bbox = rgba.getchannel("A").point(lambda value: 255 if value > 12 else 0).getbbox()
    if bbox is None:
        raise RuntimeError(f"Transparent/blank master: {rel(path)}")
    return list(bbox)


def png_size(path: Path) -> list[int]:
    with Image.open(path) as image:
        return [image.width, image.height]


def inventory_hashes(root: Path) -> dict[str, str]:
    return {rel(path): sha256(path) for path in sorted(root.rglob("*.png"))}


def load_dev_metrics() -> dict[str, dict[str, Any]]:
    manifest = json.loads(DEV_MANIFEST.read_text(encoding="utf-8"))
    by_id = {unit["unitId"]: unit for unit in manifest["units"]}
    if list(by_id) != PROMOTED or len(by_id) != 12:
        raise RuntimeError(f"Approved DEV roster mismatch: {list(by_id)}")
    return by_id


def validate_starting_manifest() -> dict[str, Any]:
    manifest = json.loads(PUBLIC_MANIFEST.read_text(encoding="utf-8"))
    if manifest.get("status") != "PROMOTED" or manifest.get("counts") != {"masters": 25, "combatPoses": 100}:
        raise RuntimeError("Expected the locked 25-master / 100-pose production baseline.")
    if PUBLIC_MANIFEST.read_bytes() != RUNTIME_MANIFEST.read_bytes():
        raise RuntimeError("Public and runtime Character System V2 manifests diverged before promotion.")
    if len(list(MASTER_ROOT.glob("*.png"))) != 25 or len(list(COMBAT_ROOT.rglob("*.png"))) != 100:
        raise RuntimeError("Production disk inventory does not match the 25/100 baseline.")
    return manifest


def promote_masters(dev_metrics: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    records = []
    for character_id in PROMOTED:
        source = DEV_MASTERS / f"{character_id}.png"
        destination = MASTER_ROOT / f"{character_id}.png"
        if not source.is_file():
            raise RuntimeError(f"Missing approved DEV master: {rel(source)}")
        if png_size(source) != [512, 512]:
            raise RuntimeError(f"Approved DEV master is not 512x512: {character_id}")
        source_hash = sha256(source)
        shutil.copyfile(source, destination)
        destination_hash = sha256(destination)
        if source_hash != destination_hash:
            raise RuntimeError(f"Non-identical promotion: {character_id}")
        metrics = dev_metrics[character_id]
        if alpha_bounds(destination) != metrics["alphaBounds"]:
            raise RuntimeError(f"Alpha bounds changed during promotion: {character_id}")
        records.append(
            {
                "characterId": character_id,
                "sourcePath": rel(source),
                "destinationPath": rel(destination),
                "sha256": source_hash,
                "byteIdentical": True,
            }
        )
    return records


def archive_legacy_full() -> tuple[list[dict[str, Any]], dict[str, str]]:
    LEGACY_ARCHIVE_ROOT.mkdir(parents=True, exist_ok=True)
    existing_archive_by_hash = {
        sha256(path): path
        for path in sorted((PIXEL_ROOT / "archive").rglob("*.png"))
    }
    records = []
    old_hashes: dict[str, str] = {}
    for character_id in FINAL_ACTIVE:
        source = FULL_ROOT / f"{character_id}.png"
        if not source.is_file():
            raise RuntimeError(f"Missing final active legacy full file: {rel(source)}")
        old_hash = sha256(source)
        old_hashes[character_id] = old_hash
        existing = existing_archive_by_hash.get(old_hash)
        reused = existing is not None
        if existing is None:
            archive_path = LEGACY_ARCHIVE_ROOT / f"{character_id}.png"
            shutil.copyfile(source, archive_path)
            if sha256(archive_path) != old_hash:
                raise RuntimeError(f"Legacy archive copy differs: {character_id}")
            existing_archive_by_hash[old_hash] = archive_path
        else:
            archive_path = existing
        records.append(
            {
                "characterId": character_id,
                "formerPath": rel(source),
                "archivePath": rel(archive_path),
                "sha256": old_hash,
                "replacementMasterPath": rel(MASTER_ROOT / f"{character_id}.png"),
                "reason": "CHARACTER_SYSTEM_V2_MASTER_PROMOTION",
                "reusedExistingByteIdenticalArchive": reused,
            }
        )
    write_json(
        LEGACY_ARCHIVE_MANIFEST,
        {
            "schemaVersion": 1,
            "status": "COMPLETE",
            "archiveRoot": rel(LEGACY_ARCHIVE_ROOT) + "/",
            "retiredIdentityCount": len(records),
            "entries": records,
        },
    )
    return records, old_hashes


def iter_text_files() -> list[Path]:
    files: list[Path] = []
    for root in ACTIVE_ROOTS:
        for path in root.rglob("*"):
            if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES:
                files.append(path)
    return sorted(files)


def protect_historical_lock_block(path: Path, text: str) -> tuple[str, dict[str, str]]:
    if path not in LOCK_TESTS:
        return text, {}
    start = text.find("const authorizedPostLockFiles")
    end = text.find("]);", start)
    if start < 0 or end < 0:
        return text, {}
    block = text[start:end]
    tokens: dict[str, str] = {}
    for character_id in FINAL_ACTIVE:
        exact = f"public/assets/characters/pixel/full/{character_id}.png"
        token = f"__FINAL_FULL_HISTORY_{character_id.upper()}__"
        if exact in block:
            block = block.replace(exact, token)
            tokens[token] = exact
    return text[:start] + block + text[end:], tokens


def migrate_active_text(old_hashes: dict[str, str], new_hashes: dict[str, str]) -> dict[str, Any]:
    changed: list[str] = []
    path_occurrences = 0
    hash_occurrences = 0
    for path in iter_text_files():
        original = path.read_text(encoding="utf-8", errors="ignore")
        updated, tokens = protect_historical_lock_block(path, original)
        for character_id in FINAL_ACTIVE:
            pairs = (
                (
                    f"/assets/characters/pixel/full/{character_id}.png",
                    f"/assets/characters/pixel/masters/{character_id}.png",
                ),
                (
                    f"public/assets/characters/pixel/full/{character_id}.png",
                    f"public/assets/characters/pixel/masters/{character_id}.png",
                ),
            )
            for old_path, new_path in pairs:
                count = updated.count(old_path)
                if count:
                    updated = updated.replace(old_path, new_path)
                    path_occurrences += count
            count = updated.count(old_hashes[character_id])
            if count:
                updated = updated.replace(old_hashes[character_id], new_hashes[character_id])
                hash_occurrences += count
        if path == ROOT / "tools/cinematics/specs/cinematic_continuity_bible.json":
            updated = updated.replace(
                '"canonicalCharacterRoot": "public/assets/characters/pixel/full/"',
                '"canonicalCharacterRoot": "public/assets/characters/pixel/masters/"',
            )
        for token, exact in tokens.items():
            updated = updated.replace(token, exact)
        if updated != original:
            path.write_text(updated, encoding="utf-8", newline="")
            changed.append(rel(path))
    return {
        "pathOccurrencesMigrated": path_occurrences,
        "hashOccurrencesMigrated": hash_occurrences,
        "changedFiles": changed,
    }


def contains_path(node: Any, character_id: str) -> bool:
    needle = f"/assets/characters/pixel/masters/{character_id}.png"
    if isinstance(node, str):
        return needle in node
    if isinstance(node, list):
        return any(contains_path(value, character_id) for value in node)
    if isinstance(node, dict):
        return any(contains_path(value, character_id) for value in node.values())
    return False


def refresh_embedded_bounds(node: Any, metrics: dict[str, dict[str, Any]]) -> int:
    changes = 0
    if isinstance(node, list):
        return sum(refresh_embedded_bounds(value, metrics) for value in node)
    if not isinstance(node, dict):
        return 0
    for value in node.values():
        changes += refresh_embedded_bounds(value, metrics)
    reference_paths = node.get("referencePaths")
    if isinstance(reference_paths, list) and "referenceSha256" in node:
        expected_hashes = {
            reference: sha256(ROOT / reference)
            for reference in reference_paths
            if isinstance(reference, str) and (ROOT / reference).is_file()
        }
        if len(expected_hashes) == len(reference_paths) and node["referenceSha256"] != expected_hashes:
            node["referenceSha256"] = expected_hashes
            changes += 1
    matches = [character_id for character_id in FINAL_ACTIVE if contains_path(node, character_id)]
    if len(matches) != 1:
        return changes
    character_id = matches[0]
    bounds = metrics[character_id]["alphaBounds"]
    if "canonicalAlphaBoundingBox" in node and node["canonicalAlphaBoundingBox"] != bounds:
        node["canonicalAlphaBoundingBox"] = bounds
        changes += 1
    if (
        isinstance(node.get("referenceSha256"), str)
        and node["referenceSha256"] != metrics[character_id]["masterSha256"]
    ):
        node["referenceSha256"] = metrics[character_id]["masterSha256"]
        changes += 1
    return changes


def refresh_cinematic_json_metrics(dev_metrics: dict[str, dict[str, Any]]) -> dict[str, Any]:
    changed_files: list[str] = []
    changed_fields = 0
    for path in sorted((ROOT / "tools/cinematics/specs").rglob("*.json")):
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        changes = refresh_embedded_bounds(value, dev_metrics)
        if changes:
            write_json(path, value)
            changed_files.append(rel(path))
            changed_fields += changes
    return {"changedFields": changed_fields, "changedFiles": changed_files}


def build_production_manifest(
    baseline: dict[str, Any],
    dev_metrics: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    units = baseline["units"]
    for unit in units:
        unit["category"] = "COMBAT_CHARACTER"
        unit["productionStatus"] = "PROMOTED"
        unit["combatPoseStatus"] = "PROMOTED_4_POSES"
    for character_id in PROMOTED:
        metrics = dev_metrics[character_id]
        master = MASTER_ROOT / f"{character_id}.png"
        src = public_url(master)
        bounds = metrics["alphaBounds"]
        units.append(
            {
                "unitId": character_id,
                "category": CATEGORIES[character_id],
                "scaleFamily": "STANDARD_HUMANOID",
                "worldUnitsPerPixel": baseline["policy"]["commonWorldUnitsPerPixel"],
                "canvasSize": {"width": 512, "height": 512},
                "alphaBounds": {
                    "left": bounds[0],
                    "top": bounds[1],
                    "right": bounds[2],
                    "bottom": bounds[3],
                },
                "baseline": metrics["baseline"],
                "productionStatus": "PROMOTED",
                "combatPoseStatus": "NOT_PRODUCED",
                "master": {
                    "src": src,
                    "sha256": sha256(master),
                    "sourceSizePx": {"width": 512, "height": 512},
                },
                "roles": {"full": src, "dialogue": src, "ui": src},
                "poses": {},
            }
        )
    baseline["sourceRoots"] = {
        "combatMasters": baseline["sourceRoot"],
        "nonCombatMasters": rel(DEV_ROOT),
    }
    baseline["policy"]["activeFullRootRetired"] = True
    baseline["policy"]["nonCombatOnlyMastersCanOmitCombatPoses"] = True
    baseline["counts"] = {"masters": 37, "combatPoses": 100}
    write_json(PUBLIC_MANIFEST, baseline)
    RUNTIME_MANIFEST.write_bytes(PUBLIC_MANIFEST.read_bytes())
    return baseline


def update_metadata(
    manifest: dict[str, Any],
    archive_records: list[dict[str, Any]],
    promotion_records: list[dict[str, Any]],
    migration: dict[str, Any],
    protected_masters_unchanged: bool,
    combat_poses_unchanged: bool,
) -> None:
    aliases = json.loads(ALIAS_MAP.read_text(encoding="utf-8"))
    entries = aliases["entries"]
    by_id = {entry["runtimeId"]: entry for entry in entries}
    for entry in entries:
        legacy_path = entry.get("legacyFullPath")
        if isinstance(legacy_path, str) and "/characters/pixel/full/" in legacy_path:
            entry["legacyFullPath"] = None
            entry["legacyFullStatus"] = "RETIRED"
    for character_id in PROMOTED:
        entry = by_id.get(character_id)
        if entry is None:
            entry = {"runtimeId": character_id}
            entries.append(entry)
            by_id[character_id] = entry
        entry.update(
            {
                "masterId": character_id,
                "newMasterPath": f"/assets/characters/pixel/masters/{character_id}.png",
                "canonicalAssetPath": f"/assets/characters/pixel/masters/{character_id}.png",
                "aliasOf": None,
                "category": CATEGORIES[character_id],
                "status": "MASTERED",
            }
        )
        if character_id in FINAL_ACTIVE:
            archived_name = "seraphine" if character_id == "sage_seraphine" else character_id
            archive_bucket = "non-demo" if character_id == "sage_seraphine" else "legacy-full"
            entry["legacyFullPath"] = (
                f"/assets/characters/pixel/archive/{archive_bucket}/{archived_name}.png"
            )
        else:
            entry["legacyFullPath"] = None
    seraphine = by_id["seraphine"]
    seraphine.update(
        {
            "masterId": "sage_seraphine",
            "legacyFullPath": "/assets/characters/pixel/archive/non-demo/seraphine.png",
            "newMasterPath": "/assets/characters/pixel/masters/sage_seraphine.png",
            "canonicalAssetPath": "/assets/characters/pixel/masters/sage_seraphine.png",
            "aliasOf": "sage_seraphine",
            "status": "ALIAS_TO_CANONICAL_MASTER",
        }
    )
    aliases.update(
        {
            "schemaVersion": 3,
            "status": "COMPLETE",
            "ACTIVE_FULL_IDENTITIES": [],
            "SERAPHINE_CANONICAL_ID": "sage_seraphine",
            "SERAPHINE_ALIAS_RESOLUTION": {
                "aliasId": "seraphine",
                "canonicalAssetPath": "/assets/characters/pixel/masters/sage_seraphine.png",
                "archivedAliasSourcePath": "/assets/characters/pixel/archive/non-demo/seraphine.png",
                "activeProductionIdentities": ["sage_seraphine"],
            },
            "FINAL_NON_COMBAT_GENERATION_QUEUE": [],
            "OPTIONAL_GENERIC_QUEUE": [],
            "OPTIONAL_GENERIC_REGISTERED": OPTIONAL_CIVILIANS,
            "GENERIC_VILLAGE_MILITIA_REGISTERED": VILLAGE_MILITIA,
            "BROKEN_REFERENCES": [],
            "REMAINING_FULL_FILES": 0,
            "PRODUCTION_MASTER_COUNT": 37,
            "counts": {
                "records": len(entries),
                "aliasesResolved": sum(1 for entry in entries if entry.get("aliasOf")),
                "activeSeraphineProductionIdentities": 1,
                "productionMasters": 37,
            },
        }
    )
    write_json(ALIAS_MAP, aliases)

    census = json.loads(CENSUS.read_text(encoding="utf-8"))
    archive_by_id = {record["characterId"]: record for record in archive_records}
    for character in census.get("characters", []):
        character_id = character.get("characterId")
        if character_id not in FINAL_ACTIVE:
            continue
        character.update(
            {
                "currentFullPath": None,
                "legacyFullArchivePath": "/" + archive_by_id[character_id]["archivePath"].removeprefix("public/"),
                "masterExists": True,
                "masterPath": f"/assets/characters/pixel/masters/{character_id}.png",
                "needsNewMaster": False,
                "currentAssetStillRequired": False,
                "productionStatus": "PROMOTED",
            }
        )
    for character in census.get("optionalGenericCharacters", []):
        character_id = character.get("characterId")
        if character_id not in OPTIONAL_CIVILIANS:
            continue
        character.update(
            {
                "masterExists": True,
                "masterPath": f"/assets/characters/pixel/masters/{character_id}.png",
                "needsNewMaster": False,
                "productionStatus": "PROMOTED",
            }
        )
    census.update(
        {
            "schemaVersion": 4,
            "status": "COMPLETE",
            "scope": "Production Character System V2 master authority after final legacy-full retirement.",
            "ACTIVE_FULL_IDENTITIES": [],
            "SERAPHINE_CANONICAL_ID": "sage_seraphine",
            "SERAPHINE_ALIAS_RESOLUTION": aliases["SERAPHINE_ALIAS_RESOLUTION"],
            "FINAL_NON_COMBAT_GENERATION_QUEUE": [],
            "OPTIONAL_GENERIC_QUEUE": [],
            "OPTIONAL_GENERIC_REGISTERED": OPTIONAL_CIVILIANS,
            "GENERIC_VILLAGE_MILITIA_REGISTERED": VILLAGE_MILITIA,
            "PROMOTED_NON_COMBAT_MASTERS": PROMOTED,
            "BROKEN_REFERENCES": [],
            "REMAINING_FULL_FILES": 0,
            "remainingFullFiles": [],
            "counts": {
                "productionMasters": 37,
                "combatCharacters": 25,
                "keyStory": 3,
                "activeCivilians": 4,
                "optionalCivilians": 2,
                "genericVillageMilitia": 3,
                "remainingFullFiles": 0,
            },
        }
    )
    write_json(CENSUS, census)

    cleanup = json.loads(CLEANUP_REPORT.read_text(encoding="utf-8"))
    cleanup.update(
        {
            "schemaVersion": 3,
            "status": "PASS",
            "FULL_CLEANUP": "PASS",
            "ACTIVE_FULL_IDENTITIES": [],
            "SERAPHINE_CANONICAL_ID": "sage_seraphine",
            "SERAPHINE_ALIAS_RESOLUTION": aliases["SERAPHINE_ALIAS_RESOLUTION"],
            "FINAL_NON_COMBAT_GENERATION_QUEUE": [],
            "OPTIONAL_GENERIC_QUEUE": [],
            "OPTIONAL_GENERIC_REGISTERED": 2,
            "GENERIC_VILLAGE_MILITIA_REGISTERED": 3,
            "BROKEN_REFERENCES": [],
            "REMAINING_FULL_FILES": 0,
            "ACTIVE_DEMO_NON_COMBAT": 0,
            "ARCHIVED_NON_DEMO": 20,
            "SERAPHINE_DUPLICATE_RESOLVED": True,
            "BROKEN_CHARACTER_REFERENCES": 0,
            "finalMasterPromotion": {
                "promoted": len(promotion_records),
                "byteIdentical": all(record["byteIdentical"] for record in promotion_records),
                "finalLegacyIdentitiesMigrated": len(archive_records),
                "activeFullReferencesRemaining": 0,
                "productionMasters": manifest["counts"]["masters"],
            },
            "activeReferenceMigration": migration,
            "productionAssetIntegrity": {
                "existing25MastersVerifiedUnchanged": protected_masters_unchanged,
                "combatPosesVerifiedUnchanged": combat_poses_unchanged,
                "verifiedExistingAssets": 125,
            },
            "strategicPolicy": "CombatPoseSet.prepare",
            "combatStagePolicy": "V2 prepare/dash/attack/cast",
            "newArtGenerated": False,
            "gameplayChanged": False,
            "combatLogicChanged": False,
            "vfxChanged": False,
            "environmentChanged": False,
        }
    )
    write_json(CLEANUP_REPORT, cleanup)

    non_demo = json.loads(NON_DEMO_ARCHIVE_MANIFEST.read_text(encoding="utf-8"))
    non_demo.update(
        {
            "ACTIVE_FULL_IDENTITIES": [],
            "SERAPHINE_CANONICAL_ID": "sage_seraphine",
            "SERAPHINE_ALIAS_RESOLUTION": aliases["SERAPHINE_ALIAS_RESOLUTION"],
            "FINAL_NON_COMBAT_GENERATION_QUEUE": [],
            "OPTIONAL_GENERIC_QUEUE": [],
            "OPTIONAL_GENERIC_REGISTERED": OPTIONAL_CIVILIANS,
            "GENERIC_VILLAGE_MILITIA_REGISTERED": VILLAGE_MILITIA,
            "REMAINING_FULL_FILES": 0,
        }
    )
    write_json(NON_DEMO_ARCHIVE_MANIFEST, non_demo)


def active_full_references() -> list[dict[str, Any]]:
    pattern = re.compile(r"(?:/|public/)assets/characters/pixel/full/[a-z0-9_-]+\.png")
    hits = []
    for path in iter_text_files():
        if path.name.endswith(".test.ts") or path.name.endswith(".test.mjs"):
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        matches = sorted(set(pattern.findall(text)))
        if matches:
            hits.append({"path": rel(path), "references": matches})
    for path in (ALIAS_MAP, CENSUS, PUBLIC_MANIFEST, RUNTIME_MANIFEST):
        text = path.read_text(encoding="utf-8", errors="ignore")
        matches = sorted(set(pattern.findall(text)))
        if matches:
            hits.append({"path": rel(path), "references": matches})
    return hits


def retire_full_root() -> None:
    hits = active_full_references()
    if hits:
        raise RuntimeError(f"Active full references remain; refusing retirement: {hits}")
    for character_id in FINAL_ACTIVE:
        path = FULL_ROOT / f"{character_id}.png"
        if path.is_file():
            path.unlink()
    if FULL_ROOT.exists():
        remaining = list(FULL_ROOT.iterdir())
        if remaining:
            raise RuntimeError(f"Unexpected files remain in full root: {[rel(path) for path in remaining]}")
        FULL_ROOT.rmdir()


def verify_final_state(
    initial_master_hashes: dict[str, str],
    initial_combat_hashes: dict[str, str],
    promotion_records: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    masters = sorted(MASTER_ROOT.glob("*.png"))
    combat = sorted(COMBAT_ROOT.rglob("*.png"))
    existing_master_hashes = {path: sha256(ROOT / path) for path in initial_master_hashes}
    combat_hashes = {path: sha256(ROOT / path) for path in initial_combat_hashes}
    existing_unchanged = existing_master_hashes == initial_master_hashes
    combat_unchanged = combat_hashes == initial_combat_hashes
    manifest = json.loads(PUBLIC_MANIFEST.read_text(encoding="utf-8"))
    byte_identical = True
    for character_id in PROMOTED:
        byte_identical &= sha256(DEV_MASTERS / f"{character_id}.png") == sha256(MASTER_ROOT / f"{character_id}.png")
    return {
        "productionMasters": len(masters),
        "combatPoses": len(combat),
        "newMastersPromoted": sum((MASTER_ROOT / f"{character_id}.png").is_file() for character_id in PROMOTED),
        "byteIdenticalPromotion": byte_identical,
        "existing25MasterHashesUnchanged": existing_unchanged,
        "combatPoseHashesUnchanged": combat_unchanged,
        "activeFullReferences": active_full_references(),
        "fullDirectoryActive": FULL_ROOT.exists(),
        "manifestMasters": manifest.get("counts", {}).get("masters"),
        "manifestCombatPoses": manifest.get("counts", {}).get("combatPoses"),
        "publicRuntimeManifestByteIdentical": PUBLIC_MANIFEST.read_bytes() == RUNTIME_MANIFEST.read_bytes(),
        "promotionRecords": promotion_records or [],
    }


def run() -> None:
    baseline = validate_starting_manifest()
    dev_metrics = load_dev_metrics()
    initial_master_hashes = inventory_hashes(MASTER_ROOT)
    initial_combat_hashes = inventory_hashes(COMBAT_ROOT)
    promotion_records = promote_masters(dev_metrics)
    archive_records, old_hashes = archive_legacy_full()
    new_hashes = {character_id: sha256(MASTER_ROOT / f"{character_id}.png") for character_id in PROMOTED}
    migration = migrate_active_text(old_hashes, new_hashes)
    cinematic_metrics = refresh_cinematic_json_metrics(dev_metrics)
    migration["cinematicMetricRefresh"] = cinematic_metrics
    manifest = build_production_manifest(baseline, dev_metrics)

    current_master_hashes = {path: sha256(ROOT / path) for path in initial_master_hashes}
    current_combat_hashes = {path: sha256(ROOT / path) for path in initial_combat_hashes}
    existing_unchanged = current_master_hashes == initial_master_hashes
    combat_unchanged = current_combat_hashes == initial_combat_hashes
    if not existing_unchanged or not combat_unchanged:
        raise RuntimeError("Locked existing master or combat pose hashes changed.")

    update_metadata(
        manifest,
        archive_records,
        promotion_records,
        migration,
        existing_unchanged,
        combat_unchanged,
    )
    retire_full_root()
    final = verify_final_state(initial_master_hashes, initial_combat_hashes, promotion_records)
    final.update(
        {
            "status": "PASS",
            "legacyFullArchived": archive_records,
            "legacyFullDeletedFromActiveRoot": len(FINAL_ACTIVE),
            "seraphineCanonicalId": "sage_seraphine",
            "seraphineDuplicateActive": False,
            "optionalCiviliansRegistered": OPTIONAL_CIVILIANS,
            "genericVillageMilitiaRegistered": VILLAGE_MILITIA,
            "newArtGenerated": False,
            "gameplayChanged": False,
            "combatLogicChanged": False,
            "vfxChanged": False,
            "environmentChanged": False,
        }
    )
    write_json(PROMOTION_REPORT, final)
    if (
        final["productionMasters"] != 37
        or final["combatPoses"] != 100
        or final["newMastersPromoted"] != 12
        or not final["byteIdenticalPromotion"]
        or not final["existing25MasterHashesUnchanged"]
        or not final["combatPoseHashesUnchanged"]
        or final["activeFullReferences"]
        or final["fullDirectoryActive"]
        or final["manifestMasters"] != 37
        or final["manifestCombatPoses"] != 100
        or not final["publicRuntimeManifestByteIdentical"]
    ):
        raise RuntimeError("Final promotion validation failed; inspect master-promotion-report.json")
    print(json.dumps({key: value for key, value in final.items() if key not in {"promotionRecords", "legacyFullArchived"}}, indent=2))


def check() -> None:
    report = json.loads(PROMOTION_REPORT.read_text(encoding="utf-8"))
    manifest = json.loads(PUBLIC_MANIFEST.read_text(encoding="utf-8"))
    errors = []
    if len(list(MASTER_ROOT.glob("*.png"))) != 37:
        errors.append("production master count is not 37")
    if len(list(COMBAT_ROOT.rglob("*.png"))) != 100:
        errors.append("combat pose count is not 100")
    if FULL_ROOT.exists():
        errors.append("legacy full directory still exists")
    if active_full_references():
        errors.append("active full references remain")
    if manifest.get("counts") != {"masters": 37, "combatPoses": 100}:
        errors.append("production manifest count mismatch")
    if PUBLIC_MANIFEST.read_bytes() != RUNTIME_MANIFEST.read_bytes():
        errors.append("public/runtime manifests differ")
    for record in report["promotionRecords"]:
        if sha256(ROOT / record["sourcePath"]) != sha256(ROOT / record["destinationPath"]):
            errors.append(f"promotion bytes differ: {record['characterId']}")
    for record in report["legacyFullArchived"]:
        if sha256(ROOT / record["archivePath"]) != record["sha256"]:
            errors.append(f"archive hash mismatch: {record['characterId']}")
    print(json.dumps({"status": "FAIL" if errors else "PASS", "errors": errors}, indent=2))
    if errors:
        raise SystemExit(1)


def refresh_metadata() -> None:
    manifest = json.loads(PUBLIC_MANIFEST.read_text(encoding="utf-8"))
    archive_records = json.loads(LEGACY_ARCHIVE_MANIFEST.read_text(encoding="utf-8"))["entries"]
    promotion_records = json.loads(PROMOTION_REPORT.read_text(encoding="utf-8"))["promotionRecords"]
    cleanup = json.loads(CLEANUP_REPORT.read_text(encoding="utf-8"))
    update_metadata(
        manifest,
        archive_records,
        promotion_records,
        cleanup["activeReferenceMigration"],
        True,
        True,
    )
    cinematic_metrics = refresh_cinematic_json_metrics(load_dev_metrics())
    references = active_full_references()
    print(json.dumps({
        "status": "FAIL" if references else "PASS",
        "activeFullReferences": references,
        "cinematicMetricRefresh": cinematic_metrics,
    }, indent=2))
    if references:
        raise SystemExit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Promote approved Option C V2 non-combat masters and retire legacy full assets.")
    parser.add_argument("--check", action="store_true", help="Validate an already completed promotion.")
    parser.add_argument("--refresh-metadata", action="store_true", help="Refresh final metadata after a completed promotion.")
    args = parser.parse_args()
    if args.check:
        check()
    elif args.refresh_metadata:
        refresh_metadata()
    else:
        run()

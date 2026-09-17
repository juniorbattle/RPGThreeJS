from __future__ import annotations

import hashlib
import json
import re
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PIXEL_ROOT = ROOT / "public/assets/characters/pixel"
FULL_ROOT = PIXEL_ROOT / "full"
ARCHIVE_ROOT = PIXEL_ROOT / "archive/non-demo"
MASTER_ROOT = PIXEL_ROOT / "masters"
MANIFEST_PATH = PIXEL_ROOT / "character-system-v2-manifest.json"
CENSUS_PATH = PIXEL_ROOT / "non-combat-master-census.json"
CLEANUP_REPORT_PATH = PIXEL_ROOT / "full-cleanup-report.json"
ALIAS_MAP_PATH = PIXEL_ROOT / "character-alias-map.json"
ARCHIVE_MANIFEST_PATH = ARCHIVE_ROOT / "archive-manifest.json"
CINEMATIC_SCALE_PATH = ROOT / "tools/cinematics/specs/cinematic_character_scale.json"

ACTIVE_ROOTS = (ROOT / "src", ROOT / "tools/cinematics")
TEXT_SUFFIXES = {".css", ".html", ".js", ".json", ".mjs", ".py", ".ts", ".tsx", ".txt"}
LOCK_TESTS = {
    ROOT / "tools/cinematics/cin6ea_preproduction.test.mjs",
    ROOT / "tools/cinematics/cin6ea_finalization.test.mjs",
}

ACTIVE_FULL_IDENTITIES = (
    "alaric",
    "maelor",
    "sage_seraphine",
    "refugee_mother",
    "survivor",
    "villageoise",
    "wounded_merchant",
)

ARCHIVED_NON_DEMO_IDENTITIES = (
    "aldric",
    "eldwin",
    "gunnar",
    "lyra",
    "morvan",
    "talon",
    "chroniqueur",
    "shrine_apparition",
    "seal_guardian",
    "troll",
    "undead_champion",
    "forest_viper",
    "future_herbalist",
    "future_lion_scribe",
    "future_lion_spearman",
    "future_shadow_envoy",
    "giant_mygale",
    "mountain_ram",
    "river_crab",
    "swamp_crocodile",
)

OPTIONAL_GENERIC_QUEUE = ("villageois", "refugee")
SERAPHINE_CANONICAL_ID = "sage_seraphine"
SERAPHINE_ALIAS_ID = "seraphine"
SERAPHINE_CANONICAL_PATH = "/assets/characters/pixel/full/sage_seraphine.png"
SERAPHINE_ALIAS_ARCHIVE_PATH = "/assets/characters/pixel/archive/non-demo/seraphine.png"

DISPLAY_NAMES = {
    "alaric": "Alaric",
    "maelor": "Maelor",
    "sage_seraphine": "Sage Seraphine",
    "refugee_mother": "Refugee Mother",
    "survivor": "Survivor",
    "villageoise": "Villageoise",
    "wounded_merchant": "Wounded Merchant",
    "villageois": "Villageois",
    "refugee": "Refugee",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def relative(path: Path) -> str:
    return path.resolve().relative_to(ROOT.resolve()).as_posix()


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def iter_text_files() -> list[Path]:
    files: list[Path] = []
    for base in ACTIVE_ROOTS:
        files.extend(
            path
            for path in base.rglob("*")
            if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES
        )
    return sorted(set(files))


def without_lock_allowlist(path: Path, text: str) -> str:
    if path not in LOCK_TESTS:
        return text
    start = text.find("const authorizedPostLockFiles")
    end = text.find("]);", start)
    if start >= 0 and end >= 0:
        return text[:start] + text[end + 3:]
    return text


def text_corpus(*, strip_lock_allowlists: bool = True) -> dict[Path, str]:
    corpus = {}
    for path in iter_text_files():
        text = path.read_bytes().decode("utf-8", errors="ignore")
        corpus[path] = without_lock_allowlist(path, text) if strip_lock_allowlists else text
    return corpus


def reference_files(token: str, corpus: dict[Path, str]) -> list[str]:
    public_token = f"public{token}"
    return sorted(
        relative(path)
        for path, text in corpus.items()
        if token in text or public_token in text
    )


def verify_character_system_assets() -> dict[str, str]:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if len(manifest.get("units", [])) != 25:
        raise RuntimeError("Character System V2 manifest must retain exactly 25 mastered combatants.")
    verified: dict[str, str] = {}
    for unit in manifest["units"]:
        assets = [unit["master"], *unit["poses"].values()]
        for asset in assets:
            url = asset["src"]
            path = ROOT / "public" / url.removeprefix("/")
            actual = sha256(path)
            if actual != asset["sha256"]:
                raise RuntimeError(f"Production character asset hash mismatch: {url}")
            verified[url] = actual
    if len(verified) != 125:
        raise RuntimeError(f"Expected 25 masters plus 100 poses, found {len(verified)} assets.")
    return verified


def reference_audit_before(existing_manifest: dict | None) -> dict[str, list[str]]:
    if existing_manifest:
        entries = existing_manifest.get("entries", [])
        preserved = {
            entry["identity"]: entry.get("referencesBeforeArchive", [])
            for entry in entries
            if entry.get("classification") == "NON_DEMO_IDENTITY"
        }
        alias = next(
            (entry.get("referencesBeforeArchive", []) for entry in entries if entry.get("classification") == "SERAPHINE_ALIAS_SOURCE"),
            None,
        )
        if len(preserved) == len(ARCHIVED_NON_DEMO_IDENTITIES) and alias is not None:
            return {**preserved, SERAPHINE_ALIAS_ID: alias}

    corpus = text_corpus()
    result = {}
    for identity in ARCHIVED_NON_DEMO_IDENTITIES:
        result[identity] = reference_files(
            f"/assets/characters/pixel/full/{identity}.png",
            corpus,
        )
    result[SERAPHINE_ALIAS_ID] = reference_files(
        "/assets/characters/pixel/full/seraphine.png",
        corpus,
    )
    return result


def migrate_active_references() -> dict:
    replacements = {
        f"/assets/characters/pixel/full/{identity}.png":
        f"/assets/characters/pixel/archive/non-demo/{identity}.png"
        for identity in ARCHIVED_NON_DEMO_IDENTITIES
    }
    replacements["/assets/characters/pixel/full/seraphine.png"] = SERAPHINE_CANONICAL_PATH

    changed_files: list[str] = []
    occurrences = 0
    for path in iter_text_files():
        original = path.read_bytes().decode("utf-8")
        updated = original
        protected: dict[str, str] = {}
        if path in LOCK_TESTS:
            start = updated.find("const authorizedPostLockFiles")
            end = updated.find("]);", start)
            if start >= 0 and end >= 0:
                block = updated[start:end]
                for index, old in enumerate(replacements):
                    public_old = f"public{old}"
                    token = f"__OPTION_C_ARCHIVE_ALLOWLIST_{index}__"
                    if public_old in block:
                        block = block.replace(public_old, token)
                        protected[token] = public_old
                updated = updated[:start] + block + updated[end:]
        for old, new in replacements.items():
            count = updated.count(old)
            if count:
                occurrences += count
                updated = updated.replace(old, new)
        for token, original_value in protected.items():
            updated = updated.replace(token, original_value)
        if updated != original:
            path.write_text(updated, encoding="utf-8", newline="")
            changed_files.append(relative(path))
    return {"referenceOccurrencesMigrated": occurrences, "changedFiles": changed_files}


def move_archive_assets() -> tuple[list[dict], dict[str, str]]:
    ARCHIVE_ROOT.mkdir(parents=True, exist_ok=True)
    resolved_archive = ARCHIVE_ROOT.resolve()
    entries: list[dict] = []
    hashes: dict[str, str] = {}
    move_plan = [
        (identity, "NON_DEMO_IDENTITY")
        for identity in ARCHIVED_NON_DEMO_IDENTITIES
    ] + [(SERAPHINE_ALIAS_ID, "SERAPHINE_ALIAS_SOURCE")]

    for identity, classification in move_plan:
        source = (FULL_ROOT / f"{identity}.png").resolve()
        target = (ARCHIVE_ROOT / f"{identity}.png").resolve()
        if target.parent != resolved_archive:
            raise RuntimeError(f"Refusing archive move outside target root: {target}")
        if source.is_file() and target.is_file():
            raise RuntimeError(f"Both source and archive target exist for {identity}.")
        if source.is_file():
            before = sha256(source)
            source.rename(target)
        elif target.is_file():
            before = sha256(target)
        else:
            raise RuntimeError(f"Missing both source and archive asset for {identity}.")
        after = sha256(target)
        if before != after:
            raise RuntimeError(f"Archive move changed bytes for {identity}.")
        hashes[identity] = after
        entries.append({
            "identity": identity,
            "classification": classification,
            "originalPath": f"public/assets/characters/pixel/full/{identity}.png",
            "archivePath": f"public/assets/characters/pixel/archive/non-demo/{identity}.png",
            "sha256": after,
            "aliasOf": SERAPHINE_CANONICAL_ID if identity == SERAPHINE_ALIAS_ID else None,
        })
    return entries, hashes


def original_full_references() -> dict[str, list[str]]:
    corpus = text_corpus()
    unresolved = {}
    for identity in (*ARCHIVED_NON_DEMO_IDENTITIES, SERAPHINE_ALIAS_ID):
        refs = reference_files(f"/assets/characters/pixel/full/{identity}.png", corpus)
        if refs:
            unresolved[identity] = refs
    return unresolved


def broken_character_references() -> list[dict]:
    pattern = re.compile(
        r"(?:public)?(/assets/characters/pixel/(?:full|masters|archive/non-demo)/[a-z0-9_]+\.png)"
    )
    broken = []
    for path, text in text_corpus().items():
        for asset_path in sorted(set(pattern.findall(text))):
            if ".test." in path.name and asset_path.endswith("/missing.png"):
                continue
            disk_path = ROOT / "public" / asset_path.removeprefix("/")
            if not disk_path.is_file():
                broken.append({"referenceFile": relative(path), "assetPath": asset_path})
    return broken


def classify_surfaces(references: list[str]) -> list[str]:
    surfaces = set()
    for path in references:
        lowered = path.lower()
        if "dialogue" in lowered:
            surfaces.add("DIALOGUE")
        if "cinematic" in lowered:
            surfaces.add("CINEMATIC_TOOLING")
        if "/ui/" in lowered or "assetmanifest" in lowered:
            surfaces.add("UI")
        if "/combat/" in lowered:
            surfaces.add("COMBAT_COMPATIBILITY")
        if "/game/" in lowered:
            surfaces.add("GAME_CONTENT")
        if "/dev/" in lowered:
            surfaces.add("DEV_TOOLING")
    return sorted(surfaces)


def common_summary(broken: list[dict]) -> dict:
    return {
        "ACTIVE_FULL_IDENTITIES": list(ACTIVE_FULL_IDENTITIES),
        "ARCHIVED_NON_DEMO_IDENTITIES": list(ARCHIVED_NON_DEMO_IDENTITIES),
        "SERAPHINE_CANONICAL_ID": SERAPHINE_CANONICAL_ID,
        "SERAPHINE_ALIAS_RESOLUTION": {
            "aliasId": SERAPHINE_ALIAS_ID,
            "canonicalAssetPath": SERAPHINE_CANONICAL_PATH,
            "archivedAliasSourcePath": SERAPHINE_ALIAS_ARCHIVE_PATH,
            "byteIdenticalBeforeArchive": True,
            "activeProductionIdentities": [SERAPHINE_CANONICAL_ID],
        },
        "FINAL_NON_COMBAT_GENERATION_QUEUE": list(ACTIVE_FULL_IDENTITIES),
        "OPTIONAL_GENERIC_QUEUE": list(OPTIONAL_GENERIC_QUEUE),
        "BROKEN_REFERENCES": broken,
        "REMAINING_FULL_FILES": len(ACTIVE_FULL_IDENTITIES),
        "ARCHIVED_FILE_COUNT": len(ARCHIVED_NON_DEMO_IDENTITIES) + 1,
    }


def refresh_cinematic_root_policy() -> None:
    scale = json.loads(CINEMATIC_SCALE_PATH.read_text(encoding="utf-8"))
    scale["canonicalRoot"] = "public/assets/characters/pixel/"
    scale["canonicalAssetRoots"] = [
        "public/assets/characters/pixel/masters/",
        "public/assets/characters/pixel/full/",
        "public/assets/characters/pixel/archive/non-demo/",
    ]
    write_json(CINEMATIC_SCALE_PATH, scale)


def build_census(previous: dict, broken: list[dict]) -> dict:
    previous_by_id = {
        entry.get("characterId"): entry
        for entry in previous.get("characters", [])
        if entry.get("characterId")
    }
    corpus = text_corpus()
    characters = []
    for identity in ACTIVE_FULL_IDENTITIES:
        path = f"/assets/characters/pixel/full/{identity}.png"
        refs = reference_files(path, corpus)
        prior = previous_by_id.get(identity, {})
        characters.append({
            "characterId": identity,
            "displayName": DISPLAY_NAMES[identity],
            "currentFullPath": path,
            "runtimeSurfaces": classify_surfaces(refs),
            "dialogueUsage": bool(prior.get("dialogueUsage")),
            "uiUsage": bool(prior.get("uiUsage")),
            "staticTableauUsage": bool(prior.get("staticTableauUsage")),
            "cinematicReferenceUsage": bool(prior.get("cinematicReferenceUsage")),
            "combatUnit": bool(prior.get("combatUnit")),
            "masterExists": False,
            "masterPath": None,
            "aliasOf": None,
            "demoRelevant": True,
            "needsNewMaster": True,
            "currentAssetStillRequired": True,
            "generationPriority": "KEY_CHARACTER" if identity in {"alaric", "maelor", "sage_seraphine"} else "SUPPORTING_NPC",
            "runtimeReferences": refs,
        })
    optional = [{
        "characterId": identity,
        "displayName": DISPLAY_NAMES[identity],
        "currentFullPath": None,
        "masterExists": False,
        "demoRelevant": True,
        "optional": True,
        "needsNewMaster": True,
        "generationPriority": "OPTIONAL_GENERIC",
    } for identity in OPTIONAL_GENERIC_QUEUE]
    result = {
        "schemaVersion": 3,
        "status": "COMPLETE",
        "scope": "Active demo non-combat master scope after non-demo archival.",
        "artDoctrine": "Future masters must match the approved 25 Character System V2 masters.",
        **common_summary(broken),
        "counts": {
            "activeDemoNonCombat": 7,
            "optionalGenericNonCombat": 2,
            "archivedNonDemoIdentities": 20,
            "archivedFiles": 21,
            "remainingFullFiles": 7,
            "finalRequiredGenerationQueue": 7,
        },
        "remainingFullFiles": [f"public/assets/characters/pixel/full/{identity}.png" for identity in ACTIVE_FULL_IDENTITIES],
        "characters": characters,
        "optionalGenericCharacters": optional,
    }
    write_json(CENSUS_PATH, result)
    return result


def build_alias_map(previous: dict, broken: list[dict]) -> dict:
    entries = [entry for entry in previous.get("entries", []) if entry.get("runtimeId") not in {SERAPHINE_ALIAS_ID, SERAPHINE_CANONICAL_ID}]
    entries.extend([
        {
            "runtimeId": SERAPHINE_CANONICAL_ID,
            "masterId": None,
            "legacyFullPath": SERAPHINE_CANONICAL_PATH,
            "newMasterPath": None,
            "canonicalAssetPath": SERAPHINE_CANONICAL_PATH,
            "aliasOf": None,
            "status": "ACTIVE_DEMO_MASTER_PENDING",
        },
        {
            "runtimeId": SERAPHINE_ALIAS_ID,
            "masterId": None,
            "legacyFullPath": SERAPHINE_ALIAS_ARCHIVE_PATH,
            "newMasterPath": SERAPHINE_CANONICAL_PATH,
            "canonicalAssetPath": SERAPHINE_CANONICAL_PATH,
            "aliasOf": SERAPHINE_CANONICAL_ID,
            "status": "ALIAS_TO_ACTIVE_CANONICAL_IDENTITY",
        },
    ])
    entries.sort(key=lambda item: item["runtimeId"])
    result = {
        "schemaVersion": 2,
        "status": "COMPLETE",
        **common_summary(broken),
        "entries": entries,
        "counts": {
            "records": len(entries),
            "aliasesResolved": sum(1 for entry in entries if entry.get("aliasOf") is not None),
            "activeSeraphineProductionIdentities": 1,
        },
    }
    write_json(ALIAS_MAP_PATH, result)
    return result


def build_archive_manifest(
    entries: list[dict],
    references_before: dict[str, list[str]],
    broken: list[dict],
) -> dict:
    corpus = text_corpus()
    for entry in entries:
        identity = entry["identity"]
        entry["referencesBeforeArchive"] = references_before.get(identity, [])
        entry["currentArchiveReferences"] = reference_files(
            f"/assets/characters/pixel/archive/non-demo/{identity}.png",
            corpus,
        )
        entry["originalFullReferencesRemaining"] = 0
    result = {
        "schemaVersion": 1,
        "status": "COMPLETE",
        "archiveRoot": "public/assets/characters/pixel/archive/non-demo/",
        **common_summary(broken),
        "counts": {
            "archivedNonDemoIdentities": 20,
            "seraphineAliasSourcesArchived": 1,
            "archivedFiles": 21,
        },
        "entries": entries,
    }
    write_json(ARCHIVE_MANIFEST_PATH, result)
    return result


def build_cleanup_report(
    previous: dict,
    migration: dict,
    broken: list[dict],
    production_assets: dict[str, str],
) -> dict:
    prior_source = previous.get("priorCombatCleanup", previous)
    prior_combat = {
        "combatCharactersAlreadyMastered": prior_source.get("combatCharactersAlreadyMastered"),
        "combatFullReferencesMigrated": prior_source.get("combatFullReferencesMigrated"),
        "combatFullFilesDeleted": prior_source.get("combatFullFilesDeleted"),
    }
    prior_migration = previous.get("archiveMigration", {})
    total_occurrences = (
        int(prior_migration.get("referenceOccurrencesMigrated", 0))
        + int(migration["referenceOccurrencesMigrated"])
    )
    changed_files = sorted(set(prior_migration.get("changedFiles", [])) | set(migration["changedFiles"]))
    archive_migration = {
        "referenceOccurrencesMigrated": total_occurrences,
        "changedFiles": changed_files,
        "lastIdempotentRun": migration,
    }
    result = {
        "schemaVersion": 2,
        "status": "PASS",
        "FULL_CLEANUP": "PASS",
        **common_summary(broken),
        "ACTIVE_DEMO_NON_COMBAT": 7,
        "OPTIONAL_GENERIC_NON_COMBAT": 2,
        "ARCHIVED_NON_DEMO": 20,
        "SERAPHINE_DUPLICATE_RESOLVED": True,
        "BROKEN_CHARACTER_REFERENCES": len(broken),
        "priorCombatCleanup": prior_combat,
        "archiveMigration": archive_migration,
        "productionAssetIntegrity": {
            "mastersVerifiedUnchanged": 25,
            "combatPosesVerifiedUnchanged": 100,
            "verifiedAssets": len(production_assets),
        },
        "strategicPolicy": "CombatPoseSet.prepare",
        "combatStagePolicy": "V2 prepare/dash/attack/cast",
        "fullDialogueNonCombatSurfaces": "PASS" if not broken else "FAIL",
        "newArtGenerated": False,
        "gameplayChanged": False,
        "combatLogicChanged": False,
        "vfxChanged": False,
        "environmentChanged": False,
        "recovery": "Archived files remain byte-identical under archive/non-demo and all changes remain uncommitted.",
    }
    write_json(CLEANUP_REPORT_PATH, result)
    return result


def main() -> None:
    previous_census = json.loads(CENSUS_PATH.read_text(encoding="utf-8"))
    previous_report = json.loads(CLEANUP_REPORT_PATH.read_text(encoding="utf-8"))
    previous_aliases = json.loads(ALIAS_MAP_PATH.read_text(encoding="utf-8"))
    existing_archive_manifest = (
        json.loads(ARCHIVE_MANIFEST_PATH.read_text(encoding="utf-8"))
        if ARCHIVE_MANIFEST_PATH.is_file()
        else None
    )

    production_before = verify_character_system_assets()
    canonical_seraphine = FULL_ROOT / "sage_seraphine.png"
    alias_source = FULL_ROOT / "seraphine.png"
    archived_alias = ARCHIVE_ROOT / "seraphine.png"
    if not canonical_seraphine.is_file():
        raise RuntimeError("Missing canonical sage_seraphine.png.")
    alias_candidate = alias_source if alias_source.is_file() else archived_alias
    if not alias_candidate.is_file() or sha256(canonical_seraphine) != sha256(alias_candidate):
        raise RuntimeError("Seraphine sources are not byte-identical; refusing automatic alias collapse.")

    references_before = reference_audit_before(existing_archive_manifest)
    migration = migrate_active_references()
    refresh_cinematic_root_policy()
    entries, _archive_hashes = move_archive_assets()

    expected_full = {f"{identity}.png" for identity in ACTIVE_FULL_IDENTITIES}
    actual_full = {path.name for path in FULL_ROOT.glob("*.png")}
    if actual_full != expected_full:
        raise RuntimeError(f"full/ does not contain exactly the seven active identities: {sorted(actual_full)}")
    expected_archive = {f"{identity}.png" for identity in (*ARCHIVED_NON_DEMO_IDENTITIES, SERAPHINE_ALIAS_ID)}
    actual_archive = {path.name for path in ARCHIVE_ROOT.glob("*.png")}
    if actual_archive != expected_archive:
        raise RuntimeError(f"Archive does not contain the expected 21 files: {sorted(actual_archive)}")

    unresolved = original_full_references()
    if unresolved:
        raise RuntimeError(f"Original full references remain: {json.dumps(unresolved, indent=2)}")
    production_after = verify_character_system_assets()
    if production_before != production_after:
        raise RuntimeError("Combat master or pose bytes changed during archive pass.")
    broken = broken_character_references()
    if broken:
        raise RuntimeError(f"Broken active character references: {json.dumps(broken, indent=2)}")

    build_census(previous_census, broken)
    build_alias_map(previous_aliases, broken)
    build_archive_manifest(entries, references_before, broken)
    report = build_cleanup_report(previous_report, migration, broken, production_after)
    print(json.dumps({
        "status": report["FULL_CLEANUP"],
        "activeDemoNonCombat": report["ACTIVE_DEMO_NON_COMBAT"],
        "optionalGenericNonCombat": report["OPTIONAL_GENERIC_NON_COMBAT"],
        "archivedNonDemoIdentities": report["ARCHIVED_NON_DEMO"],
        "archivedFiles": report["ARCHIVED_FILE_COUNT"],
        "seraphineDuplicateResolved": report["SERAPHINE_DUPLICATE_RESOLVED"],
        "brokenReferences": report["BROKEN_CHARACTER_REFERENCES"],
        "referenceOccurrencesMigrated": report["archiveMigration"]["referenceOccurrencesMigrated"],
    }, indent=2))


if __name__ == "__main__":
    main()

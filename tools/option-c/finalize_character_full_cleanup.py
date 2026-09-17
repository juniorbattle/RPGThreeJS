from __future__ import annotations

import hashlib
import json
import re
from collections import defaultdict
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
PIXEL_ROOT = ROOT / "public/assets/characters/pixel"
FULL_ROOT = PIXEL_ROOT / "full"
MASTER_ROOT = PIXEL_ROOT / "masters"
COMBAT_ROOT = PIXEL_ROOT / "combat"
MANIFEST_PATH = PIXEL_ROOT / "character-system-v2-manifest.json"
RUNTIME_MANIFEST_PATH = ROOT / "src/render/generated/characterSystemV2Manifest.json"
CENSUS_PATH = PIXEL_ROOT / "non-combat-master-census.json"
CLEANUP_REPORT_PATH = PIXEL_ROOT / "full-cleanup-report.json"
ALIAS_MAP_PATH = PIXEL_ROOT / "character-alias-map.json"
CINEMATIC_SCALE_PATH = ROOT / "tools/cinematics/specs/cinematic_character_scale.json"
CIN6EA2_SELECTIONS_PATH = ROOT / "tools/cinematics/specs/cin6ea2_operator_selections.json"

TEXT_SUFFIXES = {".css", ".html", ".js", ".json", ".mjs", ".py", ".ts", ".tsx", ".txt"}
ACTIVE_ROOTS = (ROOT / "src", ROOT / "tools/cinematics")
OUTPUT_FILES = {MANIFEST_PATH, RUNTIME_MANIFEST_PATH, CENSUS_PATH, CLEANUP_REPORT_PATH, ALIAS_MAP_PATH}
LOCK_TESTS = {
    ROOT / "tools/cinematics/cin6ea_preproduction.test.mjs",
    ROOT / "tools/cinematics/cin6ea_finalization.test.mjs",
}

# One legacy file was shared by serpent_brute and serpent_elite_brute, so the
# approved 25-master roster retires exactly 24 full-body files.
TREATED_FULL_TO_MASTER = {
    "alistair": "alistair",
    "cave_bat": "cave_bat",
    "cave_rat": "cave_rat",
    "cedric": "rogue",
    "elara": "dark_mage",
    "forest_badger": "forest_badger",
    "forest_spider": "forest_spider",
    "forest_troll_elite": "forest_troll_elite",
    "goblin": "goblin",
    "kestrel": "archer",
    "lancer": "lancer",
    "lion_champion": "lion_champion",
    "marian": "white_mage",
    "marsh_toad": "marsh_toad",
    "serpent_brute": "serpent_brute",
    "serpent_duelist_elite": "serpent_duelist_elite",
    "serpent_general_boss": "serpent_general_boss",
    "serpent_oracle": "serpent_oracle",
    "serpent_raider": "serpent_raider",
    "skeleton": "skeleton",
    "venom_serpent": "venom_serpent",
    "wild_boar": "wild_boar",
    "wolf": "wolf",
    "young_dragon_elite": "young_dragon_elite",
}

LEGACY_BY_MASTER = {
    "alistair": "alistair",
    "archer": "kestrel",
    "cave_bat": "cave_bat",
    "cave_rat": "cave_rat",
    "dark_mage": "elara",
    "forest_badger": "forest_badger",
    "forest_spider": "forest_spider",
    "forest_troll_elite": "forest_troll_elite",
    "goblin": "goblin",
    "lancer": "lancer",
    "lion_champion": "lion_champion",
    "marsh_toad": "marsh_toad",
    "rogue": "cedric",
    "serpent_brute": "serpent_brute",
    "serpent_duelist_elite": "serpent_duelist_elite",
    "serpent_elite_brute": "serpent_brute",
    "serpent_general_boss": "serpent_general_boss",
    "serpent_oracle": "serpent_oracle",
    "serpent_raider": "serpent_raider",
    "skeleton": "skeleton",
    "venom_serpent": "venom_serpent",
    "white_mage": "marian",
    "wild_boar": "wild_boar",
    "wolf": "wolf",
    "young_dragon_elite": "young_dragon_elite",
}

MASTER_ALIASES = {
    "warrior": "alistair",
    "marian": "white_mage",
    "elara": "dark_mage",
    "kestrel": "archer",
    "cedric": "rogue",
    "serpent_elite_raider": "serpent_duelist_elite",
    "serpent_captain": "serpent_general_boss",
    "young_wyrm": "young_dragon_elite",
    "lion_chief": "lion_champion",
}

DISPLAY_NAMES = {
    "alaric": "Alaric",
    "aldric": "Aldric",
    "chroniqueur": "Chroniqueur",
    "eldwin": "Eldwin",
    "forest_viper": "Forest Viper",
    "future_herbalist": "Future Herbalist",
    "future_lion_scribe": "Future Lion Scribe",
    "future_lion_spearman": "Future Lion Spearman",
    "future_shadow_envoy": "Future Shadow Envoy",
    "giant_mygale": "Giant Mygale",
    "gunnar": "Gunnar",
    "lyra": "Lyra",
    "maelor": "Maelor",
    "morvan": "Morvan",
    "mountain_ram": "Mountain Ram",
    "refugee_mother": "Refugee Mother",
    "river_crab": "River Crab",
    "sage_seraphine": "Sage Séraphine",
    "seal_guardian": "Seal Guardian",
    "shrine_apparition": "Shrine Apparition",
    "survivor": "Survivor",
    "swamp_crocodile": "Swamp Crocodile",
    "talon": "Talon",
    "troll": "Troll",
    "undead_champion": "Undead Champion",
    "villageoise": "Villageoise",
    "wounded_merchant": "Wounded Merchant",
}

IDENTITY_PATHS = {
    identity: f"/assets/characters/pixel/full/{identity}.png"
    for identity in DISPLAY_NAMES
}
IDENTITY_PATHS["sage_seraphine"] = "/assets/characters/pixel/full/seraphine.png"

PRIORITY_GROUPS = {
    "KEY_CHARACTER": (
        "alaric", "aldric", "eldwin", "gunnar", "lyra", "maelor", "morvan", "sage_seraphine", "talon",
    ),
    "RECURRING_NPC": ("chroniqueur",),
    "SUPPORTING_NPC": (
        "refugee_mother", "shrine_apparition", "survivor", "villageoise", "wounded_merchant",
    ),
    "MINOR_NPC": ("seal_guardian", "troll", "undead_champion"),
    "NOT_DEMO_REQUIRED": (
        "forest_viper", "future_herbalist", "future_lion_scribe", "future_lion_spearman",
        "future_shadow_envoy", "giant_mygale", "mountain_ram", "river_crab", "swamp_crocodile",
    ),
}

COMBAT_IDENTITIES = {
    "alaric", "aldric", "eldwin", "gunnar", "lyra", "morvan", "seal_guardian", "talon", "troll",
    "undead_champion",
}


def relative(path: Path) -> str:
    return path.resolve().relative_to(ROOT.resolve()).as_posix()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_json_preserving_newline(path: Path, value: object) -> None:
    original = path.read_bytes()
    newline = "\r\n" if b"\r\n" in original else "\n"
    rendered = json.dumps(value, indent=2, ensure_ascii=False) + "\n"
    path.write_bytes(rendered.replace("\n", newline).encode("utf-8"))


def iter_text_files(roots: tuple[Path, ...]) -> list[Path]:
    files: list[Path] = []
    for root in roots:
        if root.is_file():
            if root.suffix.lower() in TEXT_SUFFIXES:
                files.append(root)
            continue
        for path in root.rglob("*"):
            if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES:
                files.append(path)
    return sorted(set(files))


def load_manifest() -> dict:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if manifest.get("status") != "PROMOTED" or manifest.get("counts") != {"masters": 25, "combatPoses": 100}:
        raise RuntimeError("Character System V2 production manifest is not PROMOTED 25/100.")
    if manifest.get("policy", {}).get("nonCombatRolesUseMaster") is not True:
        raise RuntimeError("Production manifest has not migrated non-combat roles to Masters V2.")
    if MANIFEST_PATH.read_bytes() != RUNTIME_MANIFEST_PATH.read_bytes():
        raise RuntimeError("Public and runtime Character System V2 manifests differ.")
    return manifest


def verify_production_assets(manifest: dict) -> dict[str, str]:
    verified: dict[str, str] = {}
    for unit in manifest["units"]:
        master = ROOT / "public" / unit["master"]["src"].removeprefix("/")
        if not master.is_file() or sha256(master) != unit["master"]["sha256"]:
            raise RuntimeError(f"Master hash mismatch: {unit['unitId']}")
        verified[relative(master)] = unit["master"]["sha256"]
        for pose_name, pose in unit["poses"].items():
            pose_path = ROOT / "public" / pose["src"].removeprefix("/")
            if not pose_path.is_file() or sha256(pose_path) != pose["sha256"]:
                raise RuntimeError(f"Combat pose hash mismatch: {unit['unitId']}/{pose_name}")
            verified[relative(pose_path)] = pose["sha256"]
        role_paths = {unit["roles"][role] for role in ("full", "dialogue", "ui")}
        if role_paths != {unit["master"]["src"]}:
            raise RuntimeError(f"Non-combat role did not migrate to master: {unit['unitId']}")
    if len(verified) != 125:
        raise RuntimeError(f"Expected 125 verified production assets, found {len(verified)}.")
    return verified


def migrate_active_references() -> dict:
    replacements: dict[str, tuple[str, str, str]] = {}
    for legacy_stem, master_id in TREATED_FULL_TO_MASTER.items():
        legacy_file = FULL_ROOT / f"{legacy_stem}.png"
        master_file = MASTER_ROOT / f"{master_id}.png"
        if not master_file.is_file():
            raise RuntimeError(f"Missing production master: {master_id}")
        replacements[legacy_stem] = (
            f"/assets/characters/pixel/full/{legacy_stem}.png",
            f"/assets/characters/pixel/masters/{master_id}.png",
            sha256(legacy_file) if legacy_file.is_file() else None,
        )

    master_hashes = {master_id: sha256(MASTER_ROOT / f"{master_id}.png") for master_id in set(TREATED_FULL_TO_MASTER.values())}
    changed_files: list[str] = []
    path_occurrences = 0
    hash_occurrences = 0
    elite_brute_corrections = 0

    for path in iter_text_files(ACTIVE_ROOTS):
        original = path.read_bytes().decode("utf-8")
        updated = original
        protected_tokens: dict[str, str] = {}
        if path in LOCK_TESTS:
            start = updated.find("const authorizedPostLockFiles")
            end = updated.find("]);", start)
            if start >= 0 and end >= 0:
                block = updated[start:end]
                for legacy_stem in TREATED_FULL_TO_MASTER:
                    exact = f"public/assets/characters/pixel/full/{legacy_stem}.png"
                    token = f"__CHARACTER_V2_RETIRED_FULL_{legacy_stem.upper()}__"
                    if exact in block:
                        block = block.replace(exact, token)
                        protected_tokens[token] = exact
                updated = updated[:start] + block + updated[end:]
        for legacy_stem, (old_path, new_path, old_hash) in replacements.items():
            occurrences = updated.count(old_path)
            if occurrences == 0:
                continue
            path_occurrences += occurrences
            updated = updated.replace(old_path, new_path)
            new_hash = master_hashes[TREATED_FULL_TO_MASTER[legacy_stem]]
            if old_hash is not None:
                hash_count = updated.count(old_hash)
                if hash_count:
                    updated = updated.replace(old_hash, new_hash)
                    hash_occurrences += hash_count

        if "serpent_elite_brute" in updated and "/assets/characters/pixel/masters/serpent_brute.png" in updated:
            lines = updated.splitlines(keepends=True)
            corrected = []
            for line in lines:
                if "serpent_elite_brute" in line:
                    count = line.count("/assets/characters/pixel/masters/serpent_brute.png")
                    if count:
                        line = line.replace(
                            "/assets/characters/pixel/masters/serpent_brute.png",
                            "/assets/characters/pixel/masters/serpent_elite_brute.png",
                        )
                        elite_brute_corrections += count
                corrected.append(line)
            updated = "".join(corrected)

        for token, exact in protected_tokens.items():
            updated = updated.replace(token, exact)

        if updated != original:
            path.write_bytes(updated.encode("utf-8"))
            changed_files.append(relative(path))

    return {
        "pathOccurrencesMigrated": path_occurrences,
        "sourceHashesMigrated": hash_occurrences,
        "eliteBruteIdentityCorrections": elite_brute_corrections,
        "changedFiles": changed_files,
    }


def audited_migrated_reference_count(manifest: dict) -> dict:
    master_ids = "|".join(re.escape(unit["unitId"]) for unit in manifest["units"])
    pattern = re.compile(rf"/assets/characters/pixel/masters/(?:{master_ids})\.png")
    by_file: dict[str, int] = {}
    for path in iter_text_files(ACTIVE_ROOTS):
        if path == RUNTIME_MANIFEST_PATH:
            continue
        count = 0
        for line in path.read_bytes().decode("utf-8", errors="ignore").splitlines():
            line_count = len(pattern.findall(line))
            if (
                path == ROOT / "src/render/CharacterVisualRegistry.test.ts"
                and "resolveCharacterAsset('warrior', 'master')" in line
            ):
                line_count -= 1
            count += line_count
        if count:
            if path == CINEMATIC_SCALE_PATH:
                count -= 1  # New distinct serpent_elite_brute profile; not a migrated legacy reference.
            by_file[relative(path)] = count
    manifest_role_references = len(manifest["units"]) * 3 * 2
    return {
        "count": sum(by_file.values()) + manifest_role_references,
        "activeSourceAndToolingReferences": sum(by_file.values()),
        "publicAndRuntimeManifestRoleReferences": manifest_role_references,
        "files": by_file,
    }


def source_geometry(path: Path) -> dict:
    with Image.open(path) as image:
        rgba = image.convert("RGBA")
        width, height = rgba.size
        bounds = rgba.getchannel("A").getbbox()
    if bounds is None:
        raise RuntimeError(f"Canonical character source is fully transparent: {path}")
    left, top, right, bottom = bounds
    center_x = (left + right - 1) / 2
    center_y = (top + bottom - 1) / 2
    return {
        "sourceWidth": width,
        "sourceHeight": height,
        "alphaBounds": {"left": left, "top": top, "right": right, "bottom": bottom},
        "visibleBodyWidth": right - left,
        "visibleBodyHeight": bottom - top,
        "footAnchor": {
            "sourceX": center_x,
            "sourceY": bottom - 1,
            "normalizedX": round(center_x / width, 6),
            "normalizedY": round((bottom - 1) / height, 6),
        },
        "visualCenter": {
            "sourceX": center_x,
            "sourceY": center_y,
            "normalizedX": round(center_x / width, 6),
            "normalizedY": round(center_y / height, 6),
        },
        "transparentMargins": {
            "left": left,
            "top": top,
            "right": width - right,
            "bottom": height - bottom,
        },
    }


def refresh_cinematic_scale_registry() -> None:
    scale = json.loads(CINEMATIC_SCALE_PATH.read_text(encoding="utf-8"))
    scale["canonicalRoot"] = "public/assets/characters/pixel/"
    scale["canonicalAssetRoots"] = [
        "public/assets/characters/pixel/masters/",
        "public/assets/characters/pixel/full/",
    ]
    characters = [
        entry
        for entry in scale["characters"]
        if entry["id"] not in {"seraphine", "serpent_elite_brute"}
    ]
    for entry in characters:
        identity = entry["id"]
        if identity == "sage_seraphine":
            entry["asset"] = "public/assets/characters/pixel/full/seraphine.png"
        if identity not in TREATED_FULL_TO_MASTER:
            continue
        master_id = TREATED_FULL_TO_MASTER[identity]
        master_path = MASTER_ROOT / f"{master_id}.png"
        entry["asset"] = f"public/assets/characters/pixel/masters/{master_id}.png"
        entry["sourceSha256"] = sha256(master_path)
        entry.update(source_geometry(master_path))
        entry["reviewBodyHeightPx"] = round(scale["reviewConvention"]["referenceBodyHeightPx"] * entry["relativeStature"])

    elite_path = MASTER_ROOT / "serpent_elite_brute.png"
    elite = {
        "id": "serpent_elite_brute",
        "asset": "public/assets/characters/pixel/masters/serpent_elite_brute.png",
        "sourceSha256": sha256(elite_path),
        "category": "HUMAN",
        "relativeStature": 1.2,
        **source_geometry(elite_path),
        "reviewBodyHeightPx": round(scale["reviewConvention"]["referenceBodyHeightPx"] * 1.2),
    }
    characters.append(elite)
    scale["characters"] = sorted(characters, key=lambda entry: entry["id"])
    if len(scale["characters"]) != 52 or len({entry["id"] for entry in scale["characters"]}) != 52:
        raise RuntimeError("Cinematic scale registry must describe exactly 52 real identities.")
    write_json_preserving_newline(CINEMATIC_SCALE_PATH, scale)


def refresh_named_character_reference_hashes() -> None:
    selections = json.loads(CIN6EA2_SELECTIONS_PATH.read_text(encoding="utf-8"))
    for selected in selections["selectedH3Sources"]:
        references = selected["characterReferenceSha256"]
        for character_id in list(references):
            master_id = TREATED_FULL_TO_MASTER.get(character_id)
            if master_id is not None:
                references[character_id] = sha256(MASTER_ROOT / f"{master_id}.png")
    write_json_preserving_newline(CIN6EA2_SELECTIONS_PATH, selections)


def active_legacy_references() -> dict[str, list[str]]:
    references: dict[str, list[str]] = defaultdict(list)
    for path in iter_text_files(ACTIVE_ROOTS + (MANIFEST_PATH, RUNTIME_MANIFEST_PATH)):
        if path in OUTPUT_FILES:
            continue
        text = path.read_bytes().decode("utf-8", errors="ignore")
        if path in LOCK_TESTS:
            start = text.find("const authorizedPostLockFiles")
            end = text.find("]);", start)
            if start >= 0 and end >= 0:
                text = text[:start] + text[end + 3:]
        for legacy_stem in TREATED_FULL_TO_MASTER:
            token = f"/assets/characters/pixel/full/{legacy_stem}.png"
            if token in text:
                references[legacy_stem].append(relative(path))
    return dict(references)


def historical_legacy_references() -> dict[str, list[str]]:
    references: dict[str, list[str]] = defaultdict(list)
    roots = (ROOT / "docs", ROOT / "public/assets/dev", ROOT / "tools/cleanup", ROOT / "tools/option-c")
    for path in iter_text_files(roots):
        if path in OUTPUT_FILES or path == Path(__file__).resolve():
            continue
        text = path.read_bytes().decode("utf-8", errors="ignore")
        for legacy_stem in TREATED_FULL_TO_MASTER:
            token = f"/assets/characters/pixel/full/{legacy_stem}.png"
            if token in text:
                references[legacy_stem].append(relative(path))
    return {key: sorted(value) for key, value in references.items()}


def delete_retired_full_files() -> list[str]:
    deleted: list[str] = []
    resolved_root = FULL_ROOT.resolve()
    for legacy_stem in sorted(TREATED_FULL_TO_MASTER):
        path = (FULL_ROOT / f"{legacy_stem}.png").resolve()
        if path.parent != resolved_root:
            raise RuntimeError(f"Refusing deletion outside full root: {path}")
        if path.is_file():
            path.unlink()
        deleted.append(relative(path))
    return deleted


def build_alias_map(manifest: dict) -> dict:
    entries = []
    for unit in manifest["units"]:
        unit_id = unit["unitId"]
        legacy_stem = LEGACY_BY_MASTER[unit_id]
        entries.append({
            "runtimeId": unit_id,
            "masterId": unit_id,
            "legacyFullPath": f"/assets/characters/pixel/full/{legacy_stem}.png",
            "newMasterPath": unit["master"]["src"],
            "aliasOf": None,
            "status": "MASTERED",
        })
    for runtime_id, master_id in sorted(MASTER_ALIASES.items()):
        legacy_stem = LEGACY_BY_MASTER[master_id]
        entries.append({
            "runtimeId": runtime_id,
            "masterId": master_id,
            "legacyFullPath": f"/assets/characters/pixel/full/{legacy_stem}.png",
            "newMasterPath": f"/assets/characters/pixel/masters/{master_id}.png",
            "aliasOf": master_id,
            "status": "COVERED_BY_EXISTING_MASTER",
        })
    entries.append({
        "runtimeId": "seraphine",
        "masterId": None,
        "legacyFullPath": "/assets/characters/pixel/full/seraphine.png",
        "newMasterPath": None,
        "aliasOf": "sage_seraphine",
        "status": "SHARES_FUTURE_MASTER",
    })
    result = {
        "schemaVersion": 1,
        "status": "COMPLETE",
        "entries": sorted(entries, key=lambda item: item["runtimeId"]),
        "counts": {
            "records": len(entries),
            "aliasesResolved": sum(1 for item in entries if item["aliasOf"] is not None),
            "aliasesCoveredByExistingMaster": len(MASTER_ALIASES),
            "aliasesSharingFutureMaster": 1,
        },
    }
    write_json(ALIAS_MAP_PATH, result)
    return result


def text_corpus() -> dict[Path, str]:
    return {
        path: path.read_bytes().decode("utf-8", errors="ignore")
        for path in iter_text_files(ACTIVE_ROOTS)
        if path not in OUTPUT_FILES
    }


def identity_references(identity: str, current_path: str, corpus: dict[Path, str]) -> list[str]:
    identities = {identity}
    if identity == "sage_seraphine":
        identities.add("seraphine")
    pattern = re.compile(r"\b(?:" + "|".join(re.escape(value) for value in sorted(identities)) + r")\b")
    return sorted(
        relative(path)
        for path, text in corpus.items()
        if current_path in text or current_path.removeprefix("/") in text or pattern.search(text)
    )


def priority_for(identity: str) -> str:
    matches = [priority for priority, ids in PRIORITY_GROUPS.items() if identity in ids]
    if len(matches) != 1:
        raise RuntimeError(f"Identity must have exactly one generation priority: {identity}")
    return matches[0]


def build_census() -> tuple[dict, dict[str, list[str]]]:
    corpus = text_corpus()
    characters = []
    grouped: dict[str, list[str]] = {priority: [] for priority in PRIORITY_GROUPS}
    dialogue_text = "\n".join(
        text for path, text in corpus.items()
        if relative(path).startswith("src/game/")
    )
    for identity in sorted(DISPLAY_NAMES):
        current_path = IDENTITY_PATHS[identity]
        references = identity_references(identity, current_path, corpus)
        priority = priority_for(identity)
        grouped[priority].append(identity)
        surfaces = set()
        for reference in references:
            if reference == "src/render/assetManifest.ts":
                surfaces.add("ASSET_MANIFEST")
            elif reference == "src/game/catalog.ts":
                surfaces.add("CATALOG")
            elif reference.startswith("src/game/"):
                surfaces.add("GAME_CONTENT")
            elif reference.startswith("src/ui/"):
                surfaces.add("UI")
            elif reference.startswith("src/combat/"):
                surfaces.add("COMBAT")
            elif reference.startswith("src/cinematics/"):
                surfaces.add("STATIC_TABLEAU")
            elif reference.startswith("tools/cinematics/"):
                surfaces.add("CINEMATIC_TOOLING")
        aliases = {identity}
        if identity == "sage_seraphine":
            aliases.add("seraphine")
        dialogue_usage = any(
            re.search(rf"actorId:\s*['\"]{re.escape(alias)}['\"]", dialogue_text)
            for alias in aliases
        )
        static_tableau_usage = "STATIC_TABLEAU" in surfaces
        cinematic_usage = static_tableau_usage or "CINEMATIC_TOOLING" in surfaces
        demo_relevant = priority != "NOT_DEMO_REQUIRED"
        characters.append({
            "characterId": identity,
            "displayName": DISPLAY_NAMES[identity],
            "currentFullPath": current_path,
            "runtimeSurfaces": sorted(surfaces),
            "dialogueUsage": dialogue_usage,
            "uiUsage": "UI" in surfaces or "ASSET_MANIFEST" in surfaces,
            "staticTableauUsage": static_tableau_usage,
            "cinematicReferenceUsage": cinematic_usage,
            "combatUnit": identity in COMBAT_IDENTITIES,
            "masterExists": False,
            "masterPath": None,
            "aliasOf": None,
            "demoRelevant": demo_relevant,
            "needsNewMaster": demo_relevant,
            "currentAssetStillRequired": demo_relevant,
            "generationPriority": priority,
            "runtimeReferences": references,
        })

    queue = {
        priority: sorted(ids)
        for priority, ids in grouped.items()
        if priority != "NOT_DEMO_REQUIRED"
    }
    remaining_files = sorted(relative(path) for path in FULL_ROOT.glob("*.png"))
    result = {
        "schemaVersion": 2,
        "status": "COMPLETE",
        "scope": "Remaining real non-combat identities after Character System V2 full cleanup.",
        "artDoctrine": "Future masters must match the approved 25 Character System V2 masters.",
        "counts": {
            "remainingFullFiles": len(remaining_files),
            "remainingRealNonCombatIdentities": len(characters),
            "nonCombatMastersToGenerate": sum(len(ids) for ids in queue.values()),
            **{priority: len(ids) for priority, ids in grouped.items()},
        },
        "remainingFullFiles": remaining_files,
        "duplicateOrAliasAssets": [{
            "path": "public/assets/characters/pixel/full/sage_seraphine.png",
            "canonicalIdentity": "sage_seraphine",
            "canonicalCurrentFullPath": "/assets/characters/pixel/full/seraphine.png",
            "byteIdentical": sha256(FULL_ROOT / "sage_seraphine.png") == sha256(FULL_ROOT / "seraphine.png"),
            "requiresSeparateGeneration": False,
        }],
        "characters": characters,
        "NON_COMBAT_MASTERS_TO_GENERATE": queue,
        "NOT_DEMO_REQUIRED": sorted(grouped["NOT_DEMO_REQUIRED"]),
    }
    write_json(CENSUS_PATH, result)
    return result, grouped


def broken_active_character_references() -> list[dict]:
    pattern = re.compile(r"(?:public)?(/assets/characters/pixel/(?:full|masters)/[a-z0-9_]+\.png)")
    broken = []
    for path in iter_text_files(ACTIVE_ROOTS + (MANIFEST_PATH, RUNTIME_MANIFEST_PATH)):
        if path in {CENSUS_PATH, CLEANUP_REPORT_PATH, ALIAS_MAP_PATH}:
            continue
        text = path.read_bytes().decode("utf-8", errors="ignore")
        if path in LOCK_TESTS:
            start = text.find("const authorizedPostLockFiles")
            end = text.find("]);", start)
            if start >= 0 and end >= 0:
                text = text[:start] + text[end + 3:]
        for asset_path in sorted(set(pattern.findall(text))):
            if ".test." in path.name and asset_path == "/assets/characters/pixel/full/missing.png":
                continue
            disk_path = ROOT / "public" / asset_path.removeprefix("/")
            if not disk_path.is_file():
                broken.append({"referenceFile": relative(path), "assetPath": asset_path})
    return broken


def main() -> None:
    manifest = load_manifest()
    before_assets = verify_production_assets(manifest)
    migration = migrate_active_references()
    refresh_cinematic_scale_registry()
    refresh_named_character_reference_hashes()
    active_refs = active_legacy_references()
    if active_refs:
        raise RuntimeError(f"Refusing cleanup with active legacy references: {json.dumps(active_refs, indent=2)}")
    historical_refs = historical_legacy_references()
    deleted = delete_retired_full_files()
    after_assets = verify_production_assets(manifest)
    if before_assets != after_assets:
        raise RuntimeError("Master or combat pose hashes changed during cleanup.")

    alias_map = build_alias_map(manifest)
    census, grouped = build_census()
    migrated_reference_audit = audited_migrated_reference_count(manifest)
    broken = broken_active_character_references()
    if broken:
        raise RuntimeError(f"Broken active character references: {json.dumps(broken, indent=2)}")

    treated_audit = []
    for legacy_stem in sorted(TREATED_FULL_TO_MASTER):
        treated_audit.append({
            "legacyFullPath": f"public/assets/characters/pixel/full/{legacy_stem}.png",
            "masterId": TREATED_FULL_TO_MASTER[legacy_stem],
            "newMasterPath": f"public/assets/characters/pixel/masters/{TREATED_FULL_TO_MASTER[legacy_stem]}.png",
            "activeReferences": [],
            "historicalReferences": historical_refs.get(legacy_stem, []),
            "classification": "UNUSED_ACTIVE_PATH_RETIRED",
            "deleted": True,
        })

    aliases_without_generation = sorted(MASTER_ALIASES)
    report = {
        "schemaVersion": 1,
        "status": "PASS",
        "combatCharactersAlreadyMastered": {"completed": 25, "expected": 25},
        "combatFullReferencesMigrated": migrated_reference_audit["count"],
        "combatFullFilesDeleted": {"count": len(deleted), "files": deleted},
        "combatFullFilesStillRequired": {"count": 0, "files": []},
        "aliasesResolved": alias_map["counts"]["aliasesResolved"],
        "aliasesNotRequiringGeneration": {
            "count": len(aliases_without_generation),
            "runtimeIds": aliases_without_generation,
        },
        "brokenCharacterReferences": broken,
        "remainingFullFiles": census["counts"]["remainingFullFiles"],
        "remainingRealNonCombatIdentities": census["counts"]["remainingRealNonCombatIdentities"],
        "nonCombatMastersToGenerate": census["counts"]["nonCombatMastersToGenerate"],
        "generationQueue": census["NON_COMBAT_MASTERS_TO_GENERATE"],
        "notDemoRequired": census["NOT_DEMO_REQUIRED"],
        "reviewRequired": [],
        "productionAssetIntegrity": {
            "mastersVerifiedUnchanged": 25,
            "combatPosesVerifiedUnchanged": 100,
            "hashesBeforeAndAfterEqual": True,
        },
        "strategicPolicy": "CombatPoseSet.prepare",
        "combatStagePolicy": "V2 prepare/dash/attack/cast",
        "newArtGenerated": False,
        "deletionRecovery": "Deleted files are tracked legacy assets and remain recoverable from Git history until the cleanup is committed.",
        "migration": {
            "lastIdempotentRun": migration,
            "referenceAudit": migrated_reference_audit,
        },
        "treatedFiles": treated_audit,
    }
    write_json(CLEANUP_REPORT_PATH, report)
    print(json.dumps({
        "status": report["status"],
        "referencesMigrated": report["combatFullReferencesMigrated"],
        "filesDeleted": report["combatFullFilesDeleted"]["count"],
        "remainingFullFiles": report["remainingFullFiles"],
        "remainingRealIdentities": report["remainingRealNonCombatIdentities"],
        "mastersToGenerate": report["nonCombatMastersToGenerate"],
        "aliasesResolved": report["aliasesResolved"],
        "brokenReferences": len(report["brokenCharacterReferences"]),
        "queueCounts": {key: len(value) for key, value in report["generationQueue"].items()},
        "notDemoRequired": len(report["notDemoRequired"]),
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

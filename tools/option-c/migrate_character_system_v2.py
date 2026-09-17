from __future__ import annotations

import hashlib
import json
import re
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "public/assets/dev/option-c/combat-poses-v2/full-roster-rebuild"
PRODUCTION = ROOT / "public/assets/characters/pixel"
MASTERS = PRODUCTION / "masters"
COMBAT = PRODUCTION / "combat"
PUBLIC_MANIFEST = PRODUCTION / "character-system-v2-manifest.json"
RUNTIME_MANIFEST = ROOT / "src/render/generated/characterSystemV2Manifest.json"
LEGACY_ROOT = ROOT / "public/assets/combat-stage/poses"
LEGACY_PLAN = PRODUCTION / "legacy-pose-cleanup-plan.json"
NON_COMBAT_CENSUS = PRODUCTION / "non-combat-master-census.json"

POSE_NAMES = {
    "prepare": "idle",
    "dash": "dash",
    "attack": "attack",
    "cast": "skill",
}
ALLOWED_CANVASES = {(512, 512), (640, 512), (512, 640), (640, 640)}
WORLD_UNITS_PER_PIXEL = 0.00625

FULL_BY_MASTER = {
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

MASTER_BY_CHARACTER = {
    value: key for key, value in FULL_BY_MASTER.items() if value != "serpent_brute"
}
MASTER_BY_CHARACTER.update({
    "serpent_brute": "serpent_brute",
    "serpent_captain": "serpent_general_boss",
    "serpent_elite_raider": "serpent_duelist_elite",
    "serpent_elite_brute": "serpent_elite_brute",
})

TEXT_SUFFIXES = {
    ".css", ".html", ".js", ".json", ".md", ".mjs", ".py", ".ts", ".tsx", ".txt",
}
IGNORED_PARTS = {".git", "dist", "node_modules"}
SEARCH_ROOTS = (
    ROOT / "src",
    ROOT / "tools",
    ROOT / "docs",
    SOURCE / "manifests",
)


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


def png_size(path: Path) -> tuple[int, int]:
    data = path.read_bytes()[:24]
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"Not a PNG: {rel(path)}")
    return int.from_bytes(data[16:20], "big"), int.from_bytes(data[20:24], "big")


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def copy_exact(source: Path, target: Path) -> str:
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, target)
    source_hash = sha256(source)
    if sha256(target) != source_hash:
        raise RuntimeError(f"Byte-identical promotion failed: {rel(target)}")
    return source_hash


def load_unit_manifests() -> dict[str, dict]:
    unit_root = SOURCE / "manifests/units"
    manifests = {}
    for path in sorted(unit_root.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        manifests[data["unitId"]] = data
    return manifests


def promote_assets() -> dict:
    cleanup = json.loads((SOURCE / "manifests/final-cleanup-manifest.json").read_text(encoding="utf-8"))
    if cleanup.get("status") != "COMPLETE" or cleanup.get("totalUnits") != 25 or cleanup.get("posesAudited") != 100:
        raise RuntimeError("Approved source final-cleanup gate is not COMPLETE 25/100.")

    unit_manifests = load_unit_manifests()
    if set(unit_manifests) != set(FULL_BY_MASTER):
        raise RuntimeError("Approved per-unit manifest roster does not match the production roster.")

    units = []
    for unit_id in sorted(unit_manifests):
        source_manifest = unit_manifests[unit_id]
        source_master = SOURCE / "masters" / f"{unit_id}-master.png"
        target_master = MASTERS / f"{unit_id}.png"
        master_hash = copy_exact(source_master, target_master)
        if master_hash != source_manifest["master"]["sha256"]:
            raise RuntimeError(f"Approved master hash mismatch: {unit_id}")

        poses = {}
        for production_pose, source_pose in POSE_NAMES.items():
            source_record = source_manifest["poses"][source_pose]
            source_path = ROOT / source_record["path"]
            target_path = COMBAT / unit_id / f"{production_pose}.png"
            promoted_hash = copy_exact(source_path, target_path)
            dimensions = tuple(source_record["dimensions"])
            if dimensions not in ALLOWED_CANVASES:
                raise RuntimeError(f"Unsupported production canvas {dimensions}: {unit_id}/{production_pose}")
            if png_size(target_path) != dimensions:
                raise RuntimeError(f"PNG dimensions differ from approved metadata: {unit_id}/{production_pose}")
            if promoted_hash != source_record["sha256"]:
                raise RuntimeError(f"Approved pose hash mismatch: {unit_id}/{production_pose}")
            poses[production_pose] = {
                "src": public_url(target_path),
                "sha256": promoted_hash,
                "sourceSizePx": {"width": dimensions[0], "height": dimensions[1]},
                "alphaBoundsPx": {
                    "left": source_record["alphaBBox"][0],
                    "top": source_record["alphaBBox"][1],
                    "right": source_record["alphaBBox"][2],
                    "bottom": source_record["alphaBBox"][3],
                },
                "anchor": {"x": source_record["pivot"][0], "y": source_record["pivot"][1]},
                "scaleCorrection": 1.0,
                "characterBoundFx": bool(source_record["characterBoundFx"]),
            }

        master_url = public_url(target_master)
        units.append({
            "unitId": unit_id,
            "scaleFamily": source_manifest["scaleFamily"],
            "worldUnitsPerPixel": WORLD_UNITS_PER_PIXEL,
            "master": {
                "src": master_url,
                "sha256": master_hash,
                "sourceSizePx": {"width": 512, "height": 512},
            },
            "roles": {
                "full": master_url,
                "dialogue": master_url,
                "ui": master_url,
            },
            "poses": poses,
        })

    manifest = {
        "schemaVersion": 2,
        "status": "PROMOTED",
        "sourceRoot": rel(SOURCE),
        "productionRoots": {
            "masters": rel(MASTERS),
            "combat": rel(COMBAT),
        },
        "policy": {
            "masterAuthority": True,
            "fullAssetsReplaced": True,
            "legacyCombatFullAssetsRetired": True,
            "nonCombatRolesUseMaster": True,
            "commonWorldUnitsPerPixel": WORLD_UNITS_PER_PIXEL,
            "scaleCorrection": 1.0,
            "variableCanvasSupported": True,
            "byteIdenticalPromotion": True,
        },
        "counts": {"masters": len(units), "combatPoses": sum(len(unit["poses"]) for unit in units)},
        "units": units,
    }
    write_json(PUBLIC_MANIFEST, manifest)
    write_json(RUNTIME_MANIFEST, manifest)
    if PUBLIC_MANIFEST.read_bytes() != RUNTIME_MANIFEST.read_bytes():
        raise RuntimeError("Public and runtime production manifests diverged.")
    return manifest


def iter_text_files() -> list[Path]:
    output = []
    for search_root in SEARCH_ROOTS:
        if not search_root.exists():
            continue
        for path in search_root.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
                continue
            if any(part in IGNORED_PARTS for part in path.parts):
                continue
            output.append(path)
    return output


def load_text_corpus() -> dict[Path, str]:
    return {
        path: path.read_text(encoding="utf-8", errors="ignore")
        for path in iter_text_files()
    }


def build_legacy_cleanup_plan(corpus: dict[Path, str]) -> dict:
    assets = []
    counts = {"SAFE_TO_DELETE": 0, "STILL_REFERENCED": 0, "HISTORICAL_EVIDENCE": 0}
    for asset in sorted(LEGACY_ROOT.rglob("*.png")):
        relative = rel(asset)
        references = []
        for path, text in corpus.items():
            if path in {LEGACY_PLAN, PUBLIC_MANIFEST, RUNTIME_MANIFEST}:
                continue
            if relative in text or relative.removeprefix("public/") in text:
                references.append(rel(path))
        runtime_references = [path for path in references if path.startswith("src/") and not path.endswith(".test.ts")]
        if runtime_references:
            classification = "STILL_REFERENCED"
            reason = "Referenced by production runtime source."
        elif references:
            classification = "HISTORICAL_EVIDENCE"
            reason = "Retained as canonical identity or reproducibility evidence outside production runtime."
        else:
            classification = "SAFE_TO_DELETE"
            reason = "No repository text reference found; deletion still requires operator authorization."
        counts[classification] += 1
        assets.append({
            "path": relative,
            "sha256": sha256(asset),
            "classification": classification,
            "reason": reason,
            "references": sorted(references),
        })
    plan = {
        "schemaVersion": 1,
        "status": "COMPLETE",
        "legacyRoot": rel(LEGACY_ROOT),
        "deletionPerformed": False,
        "counts": counts,
        "assets": assets,
    }
    write_json(LEGACY_PLAN, plan)
    return plan


def profile_entries(asset_manifest: str) -> list[tuple[str, str]]:
    block_match = re.search(r"characterProfiles:\s*\{(?P<body>.*?)\n\s*\},\n\s*visualProfiles:", asset_manifest, re.S)
    if not block_match:
        raise RuntimeError("Unable to parse characterProfiles from assetManifest.ts")
    pattern = re.compile(r"^\s*([a-z0-9_]+):\s*\{[^\n]*?full:\s*'([^']+)'", re.M)
    return pattern.findall(block_match.group("body"))


def build_non_combat_census(corpus: dict[Path, str]) -> dict:
    asset_manifest_path = ROOT / "src/render/assetManifest.ts"
    asset_manifest = asset_manifest_path.read_text(encoding="utf-8")
    profiles = profile_entries(asset_manifest)
    full_files = sorted((PRODUCTION / "full").glob("*.png"))
    profile_paths = {path for _, path in profiles}
    entries: list[dict] = []

    logical_entries = list(profiles)
    for path in full_files:
        url = public_url(path)
        if url not in profile_paths:
            logical_entries.append((path.stem, url))

    searchable = [
        path for path in corpus
        if path not in {NON_COMBAT_CENSUS, PUBLIC_MANIFEST, RUNTIME_MANIFEST}
    ]
    for character_id, full_path in sorted(logical_entries):
        references = []
        for path in searchable:
            text = corpus[path]
            if full_path in text or re.search(rf"\b{re.escape(character_id)}\b", text):
                references.append(rel(path))
        runtime_refs = [path for path in references if path.startswith("src/") and ".test." not in path]
        master_id = MASTER_BY_CHARACTER.get(character_id)
        if not master_id:
            basename = Path(full_path).stem
            master_id = MASTER_BY_CHARACTER.get(basename)
        alias_of = None
        basename = Path(full_path).stem
        if character_id != basename:
            alias_of = basename
        surfaces = set()
        for reference in runtime_refs:
            if reference == "src/render/assetManifest.ts":
                surfaces.add("ASSET_MANIFEST")
            elif reference == "src/combat/legacyCombatRuntime.js":
                surfaces.add("COMBAT_UI_OR_FALLBACK")
            elif reference.startswith("src/cinematics/"):
                surfaces.add("CINEMATIC")
            elif reference.startswith("src/ui/"):
                surfaces.add("UI")
            elif reference.startswith("src/game/"):
                surfaces.add("GAME_CONTENT")
        dialogue_usage = character_id in {entry_id for entry_id, _ in profiles}
        ui_usage = dialogue_usage
        cinematic_usage = any(path.startswith("src/cinematics/") or path.startswith("tools/cinematics/") for path in references)
        combat_unit = any(path == "src/combat/legacyCombatRuntime.js" for path in runtime_refs) or master_id is not None
        demo_relevant = any(path.startswith("src/") and ".test." not in path for path in references)
        entries.append({
            "characterId": character_id,
            "currentFullPath": full_path,
            "runtimeSurfaces": sorted(surfaces),
            "dialogueUsage": dialogue_usage,
            "uiUsage": ui_usage,
            "cinematicReferenceUsage": cinematic_usage,
            "combatUnit": combat_unit,
            "newMasterAlreadyExists": master_id is not None,
            "masterId": master_id,
            "needsNewMaster": master_id is None and demo_relevant,
            "aliasOf": alias_of,
            "demoRelevant": demo_relevant,
            "runtimeReferences": sorted(runtime_refs),
        })

    census = {
        "schemaVersion": 1,
        "status": "COMPLETE",
        "scope": "Current full-character assets and logical character profiles; full assets remain unchanged.",
        "fullAssetsReplaced": False,
        "counts": {
            "fullPngFiles": len(full_files),
            "logicalCharacters": len(entries),
            "withNewMaster": sum(1 for entry in entries if entry["newMasterAlreadyExists"]),
            "needsNewMaster": sum(1 for entry in entries if entry["needsNewMaster"]),
        },
        "characters": entries,
    }
    write_json(NON_COMBAT_CENSUS, census)
    return census


def main() -> None:
    manifest = promote_assets()
    print("promotion complete", flush=True)
    corpus = load_text_corpus()
    print(f"text corpus loaded: {len(corpus)} files", flush=True)
    cleanup = build_legacy_cleanup_plan(corpus)
    print("legacy cleanup plan complete", flush=True)
    print(json.dumps({
        "status": "PASS",
        "mastersPromoted": manifest["counts"]["masters"],
        "combatPosesPromoted": manifest["counts"]["combatPoses"],
        "legacyCleanupPlan": cleanup["counts"],
        "nonCombatCensus": "MAINTAINED_BY_FINAL_CLEANUP",
    }, indent=2))


if __name__ == "__main__":
    main()

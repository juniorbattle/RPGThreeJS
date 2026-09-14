from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[3]
MANIFEST_DIR = ROOT / "manifests"
GENERATOR = "OpenAI built-in image_gen tool"
MODEL = "UNKNOWN"
PROVENANCE_NOTE = "The image_gen tool response and PNG metadata exposed no exact model identifier; no model name is inferred."
TEXT_EXTENSIONS = {".css", ".html", ".js", ".json", ".md", ".mjs", ".py", ".txt", ".ts", ".tsx"}
CANONICAL_KESTREL = "public/assets/characters/pixel/full/kestrel.png"
SURFACE_BOARD = "docs/art-direction/option-c/references/surface-board-b.png"
MOTION_KESTREL = "docs/art-direction/option-c/references/motion-kestrel-reference.png"
CURRENT_TRAVEL = "public/assets/generated/lion-phase/dialogue/forest_fork.webp"
CURRENT_STRATEGIC = "public/assets/generated/lion-phase/combat/forest_route.webp"
CURRENT_STAGE = "public/assets/generated/lion-phase/combat-stage/forest_route_stage.webp"
CURRENT_ARCHER_POSE = "public/assets/combat-stage/poses/heroes/archer_sheet_4x1/archer_sheet_4x1_01_pose1.png"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def portable_sha256(path: Path) -> tuple[str, str]:
    if path.suffix.lower() in TEXT_EXTENSIONS:
        data = path.read_bytes().replace(b"\r\n", b"\n").replace(b"\r", b"\n")
        return hashlib.sha256(data).hexdigest(), "SHA256_LF_NORMALIZED"
    return sha256(path), "SHA256_RAW_BYTES"


def image_dimensions(path: Path) -> list[int] | None:
    try:
        with Image.open(path) as image:
            return [image.width, image.height]
    except Exception:
        return None


def reference(path_string: str) -> dict:
    path = REPO / path_string
    record = {"path": path_string, "exists": path.exists()}
    if path.exists() and path.is_file():
        record["sha256"] = sha256(path)
        dimensions = image_dimensions(path)
        if dimensions:
            record["dimensions"] = dimensions
    return record


def generation_entry(
    asset_id: str,
    filename: str,
    category: str,
    purpose: str,
    status: str,
    prompt_file: str,
    references: list[str],
    option_c_references: list[str],
    source_artifact: str,
    canonical: str | None = CANONICAL_KESTREL,
    rejection_reason: str | None = None,
) -> dict:
    path = ROOT / filename
    prompt_path = ROOT / prompt_file
    timestamp = datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat()
    entry = {
        "assetId": asset_id,
        "filename": path.relative_to(REPO).as_posix(),
        "category": category,
        "purpose": purpose,
        "status": status,
        "canonicalReferenceSource": reference(canonical) if canonical else None,
        "visualReferenceInputs": [reference(item) for item in references],
        "optionCPreviewReferencesUsed": [reference(item) for item in option_c_references],
        "promptFile": prompt_path.relative_to(REPO).as_posix(),
        "prompt": prompt_path.read_text(encoding="utf-8").strip(),
        "generator": GENERATOR,
        "modelProvenance": MODEL,
        "modelProvenanceNote": PROVENANCE_NOTE,
        "sourceGeneratorArtifactId": source_artifact,
        "generationTimestamp": timestamp,
        "generationTimestampSource": "repository-copy filesystem mtime",
        "dimensions": image_dimensions(path),
        "sha256": sha256(path),
    }
    if rejection_reason:
        entry["rejectionReason"] = rejection_reason
    return entry


entries = [
    generation_entry(
        "FOREST_ROAD_VISUAL_MASTER",
        "masters/forest-road-visual-master-dev.png",
        "environment_master",
        "Single environmental visual authority for the Forest Road pilot family.",
        "DEV_CANDIDATE",
        "prompts/forest-road-master.prompt.txt",
        [CURRENT_TRAVEL, CURRENT_STRATEGIC, CURRENT_STAGE],
        [SURFACE_BOARD],
        "exec-60963997-124e-43c8-9978-a0aaefd5b2a2.png",
        canonical=None,
    ),
    generation_entry(
        "FOREST_ROAD_TRAVEL",
        "environment/forest-road-travel-dev.png",
        "environment_variant",
        "Character-free guided Travel Still treatment with existing UI-safe zones.",
        "DEV_CANDIDATE",
        "prompts/forest-road-travel.prompt.txt",
        ["docs/art-direction/option-c/phase4-pilot/masters/forest-road-visual-master-dev.png", CURRENT_TRAVEL],
        [SURFACE_BOARD],
        "exec-5be6f8d6-d95f-4291-a7e4-9f694d3fabea.png",
        canonical=None,
    ),
    generation_entry(
        "FOREST_ROAD_TABLEAU",
        "environment/forest-road-tableau-dev.png",
        "environment_variant",
        "Character-free Static Tableau plate for runtime actor staging.",
        "DEV_CANDIDATE",
        "prompts/forest-road-tableau.prompt.txt",
        ["docs/art-direction/option-c/phase4-pilot/masters/forest-road-visual-master-dev.png", CURRENT_TRAVEL],
        [SURFACE_BOARD],
        "exec-a99a03a8-79c0-4b21-9998-2cf930dbb949.png",
        canonical=None,
    ),
    generation_entry(
        "FOREST_ROAD_STRATEGIC",
        "environment/forest-road-strategic-dev.png",
        "environment_variant",
        "Existing-camera tactical battlefield treatment with readable UI zones.",
        "DEV_CANDIDATE",
        "prompts/forest-road-strategic.prompt.txt",
        ["docs/art-direction/option-c/phase4-pilot/masters/forest-road-visual-master-dev.png", CURRENT_STRATEGIC],
        [SURFACE_BOARD],
        "exec-abdebb33-2709-4b0c-8445-dce25b106e8d.png",
        canonical=None,
    ),
    generation_entry(
        "FOREST_ROAD_COMBAT_STAGE",
        "environment/forest-road-combat-stage-dev.png",
        "environment_variant",
        "Side-on Combat Stage treatment with attacker, target and feedback lanes.",
        "DEV_CANDIDATE",
        "prompts/forest-road-combat-stage.prompt.txt",
        ["docs/art-direction/option-c/phase4-pilot/masters/forest-road-visual-master-dev.png", CURRENT_STAGE],
        [SURFACE_BOARD],
        "exec-67ce71e8-f4fc-4826-8ce8-c926f870b4aa.png",
        canonical=None,
    ),
    generation_entry(
        "KESTREL_OPTION_C_CHARACTER_MASTER",
        "characters/kestrel-option-c-character-master-dev.png",
        "character_master",
        "Three-view transparent DEV authority for the canonical Kestrel identity.",
        "DEV_CANDIDATE",
        "prompts/kestrel-character-master.prompt.txt",
        [CANONICAL_KESTREL, CURRENT_ARCHER_POSE],
        [MOTION_KESTREL],
        "exec-9861bb43-9e83-406d-afde-b7f860a40fae.png",
    ),
    generation_entry(
        "KESTREL_MASTER_CHECKERBOARD_CORRECTION",
        "qa/rejected-kestrel-master-checkerboard.png",
        "rejected_character_master",
        "Attempted transparency correction retained only as rejected evidence.",
        "REJECTED",
        "prompts/kestrel-master-checkerboard-rejected.prompt.txt",
        ["docs/art-direction/option-c/phase4-pilot/characters/kestrel-option-c-character-master-dev.png"],
        [],
        "exec-76700826-e05e-49bd-a6eb-bf78789d3d94.png",
        rejection_reason="Checkerboard is baked RGB (opaque Format24bppRgb), not real alpha transparency.",
    ),
    generation_entry(
        "KESTREL_FOUR_POSE_BOARD_V1",
        "characters/kestrel-four-pose-reference-raw.png",
        "rejected_pose_board",
        "Initial four-pose authority attempt retained as rejected evidence.",
        "REJECTED",
        "prompts/kestrel-four-pose-reference.prompt.txt",
        ["docs/art-direction/option-c/phase4-pilot/characters/kestrel-option-c-character-master-dev.png", CANONICAL_KESTREL],
        [MOTION_KESTREL],
        "exec-293cd3e9-0c17-41b5-9b62-58dde8c18b0c.png",
        rejection_reason="Inter-cell overlap and edge touch; dash also reads as airborne/platformer-like.",
    ),
    generation_entry(
        "KESTREL_DASH_REFERENCE_RAW",
        "characters/kestrel-dash-reference-raw.png",
        "pose_source",
        "Grounded replacement source for the normalized dash pose.",
        "DEV_CANDIDATE",
        "prompts/kestrel-dash-reference.prompt.txt",
        ["docs/art-direction/option-c/phase4-pilot/characters/kestrel-option-c-character-master-dev.png", CANONICAL_KESTREL, "docs/art-direction/option-c/phase4-pilot/characters/kestrel-four-pose-reference-raw.png"],
        [MOTION_KESTREL],
        "exec-d32c1f4f-5cd3-4917-8cee-87dcacea75c4.png",
    ),
    generation_entry(
        "KESTREL_IDLE_REFERENCE_RAW",
        "characters/kestrel-idle-reference-raw.png",
        "pose_source",
        "Source for the normalized idle pose.",
        "DEV_CANDIDATE",
        "prompts/kestrel-idle-reference.prompt.txt",
        ["docs/art-direction/option-c/phase4-pilot/characters/kestrel-option-c-character-master-dev.png", CANONICAL_KESTREL, "docs/art-direction/option-c/phase4-pilot/characters/kestrel-four-pose-reference-raw.png"],
        [MOTION_KESTREL],
        "exec-5984c7e7-4ba3-46a9-9577-843f049c5c82.png",
    ),
    generation_entry(
        "KESTREL_ATTACK_REFERENCE_RAW",
        "characters/kestrel-attack-reference-raw.png",
        "pose_source",
        "Source for the normalized bow-attack pose.",
        "DEV_CANDIDATE",
        "prompts/kestrel-attack-reference.prompt.txt",
        ["docs/art-direction/option-c/phase4-pilot/characters/kestrel-option-c-character-master-dev.png", CANONICAL_KESTREL, "docs/art-direction/option-c/phase4-pilot/characters/kestrel-four-pose-reference-raw.png"],
        [MOTION_KESTREL],
        "exec-430d69df-7be0-4a39-898f-106690a9a1e5.png",
    ),
    generation_entry(
        "KESTREL_CAST_SKILL_REFERENCE_RAW",
        "characters/kestrel-skill-reference-raw.png",
        "pose_source",
        "Source for the normalized precision/zenith-shot skill pose.",
        "DEV_CANDIDATE",
        "prompts/kestrel-skill-reference.prompt.txt",
        ["docs/art-direction/option-c/phase4-pilot/characters/kestrel-option-c-character-master-dev.png", CANONICAL_KESTREL, "docs/art-direction/option-c/phase4-pilot/characters/kestrel-four-pose-reference-raw.png"],
        [MOTION_KESTREL],
        "exec-0eb53906-a14d-48b8-a9ff-85ba9fdd05db.png",
    ),
    generation_entry(
        "KESTREL_IDLE_ANIMATION_RAW_V1",
        "animations/idle/raw-generated.png",
        "animation_source",
        "Eight-frame restrained idle loop source.",
        "DEV_CANDIDATE",
        "prompts/kestrel-idle-animation.prompt.txt",
        ["docs/art-direction/option-c/phase4-pilot/characters/kestrel-option-c-character-master-dev.png", CANONICAL_KESTREL, "docs/art-direction/option-c/phase4-pilot/characters/poses/idle/kestrel-idle-1.png", "docs/art-direction/option-c/phase4-pilot/references/2x4-animation-layout-guide.png"],
        [MOTION_KESTREL],
        "exec-94efbd5a-acc7-4006-9c0b-531628832817.png",
    ),
    generation_entry(
        "KESTREL_DASH_ANIMATION_RAW_V1",
        "animations/dash/raw-generated.png",
        "rejected_animation_source",
        "First eight-frame grounded dash source.",
        "REJECTED",
        "prompts/kestrel-dash-animation.prompt.txt",
        ["docs/art-direction/option-c/phase4-pilot/characters/kestrel-option-c-character-master-dev.png", CANONICAL_KESTREL, "docs/art-direction/option-c/phase4-pilot/characters/poses/dash/kestrel-dash-1.png", "docs/art-direction/option-c/phase4-pilot/references/2x4-animation-layout-guide.png"],
        [MOTION_KESTREL],
        "exec-ada33a27-3aac-4c4d-894b-dd8c774737ad.png",
        rejection_reason="Frame [1,2] touched the left cell edge; corrected version required.",
    ),
    generation_entry(
        "KESTREL_ATTACK_ANIMATION_RAW_V1",
        "animations/attack/raw-generated.png",
        "rejected_animation_source",
        "First eight-frame bow-attack source.",
        "REJECTED",
        "prompts/kestrel-attack-animation.prompt.txt",
        ["docs/art-direction/option-c/phase4-pilot/characters/kestrel-option-c-character-master-dev.png", CANONICAL_KESTREL, "docs/art-direction/option-c/phase4-pilot/characters/poses/attack/kestrel-attack-1.png", "docs/art-direction/option-c/phase4-pilot/references/2x4-animation-layout-guide.png"],
        [MOTION_KESTREL],
        "exec-612f3c6d-38d5-4df4-ba60-2135c3cf246f.png",
        rejection_reason="Frames [0,2], [1,0], [1,1], [1,2] touched cell edges; corrected version required.",
    ),
    generation_entry(
        "KESTREL_CAST_SKILL_ANIMATION_RAW_V1",
        "animations/skill/raw-generated.png",
        "rejected_animation_source",
        "First eight-frame precision-shot skill source.",
        "REJECTED",
        "prompts/kestrel-skill-animation.prompt.txt",
        ["docs/art-direction/option-c/phase4-pilot/characters/kestrel-option-c-character-master-dev.png", CANONICAL_KESTREL, "docs/art-direction/option-c/phase4-pilot/characters/poses/skill/kestrel-skill-1.png", "docs/art-direction/option-c/phase4-pilot/references/2x4-animation-layout-guide.png"],
        [MOTION_KESTREL],
        "exec-8aff0042-b16c-4573-a686-5d8c93b441b1.png",
        rejection_reason="Frames [0,3], [1,0], [1,1], [1,2], [1,3] touched cell edges; corrected version required.",
    ),
    generation_entry(
        "KESTREL_DASH_ANIMATION_RAW_V2",
        "animations/dash/raw-generated-retry.png",
        "animation_source",
        "Corrected eight-frame grounded dash source with safe cell margins.",
        "DEV_CANDIDATE",
        "prompts/kestrel-dash-animation-retry.prompt.txt",
        ["docs/art-direction/option-c/phase4-pilot/animations/dash/raw-generated.png", "docs/art-direction/option-c/phase4-pilot/characters/kestrel-option-c-character-master-dev.png", CANONICAL_KESTREL, "docs/art-direction/option-c/phase4-pilot/characters/poses/dash/kestrel-dash-1.png", "docs/art-direction/option-c/phase4-pilot/references/2x4-animation-layout-guide.png"],
        [MOTION_KESTREL],
        "exec-0dcce236-b2d2-4729-b383-d0e2dfb72b36.png",
    ),
    generation_entry(
        "KESTREL_ATTACK_ANIMATION_RAW_V2",
        "animations/attack/raw-generated-retry.png",
        "animation_source",
        "Corrected eight-frame bow-attack source with safe cell margins.",
        "DEV_CANDIDATE",
        "prompts/kestrel-attack-animation-retry.prompt.txt",
        ["docs/art-direction/option-c/phase4-pilot/animations/attack/raw-generated.png", "docs/art-direction/option-c/phase4-pilot/characters/kestrel-option-c-character-master-dev.png", CANONICAL_KESTREL, "docs/art-direction/option-c/phase4-pilot/characters/poses/attack/kestrel-attack-1.png", "docs/art-direction/option-c/phase4-pilot/references/2x4-animation-layout-guide.png"],
        [MOTION_KESTREL],
        "exec-22dd0e98-3350-46a9-84f6-363732db7774.png",
    ),
    generation_entry(
        "KESTREL_CAST_SKILL_ANIMATION_RAW_V2",
        "animations/skill/raw-generated-retry.png",
        "animation_source",
        "Corrected eight-frame precision-shot source with safe cell margins.",
        "DEV_CANDIDATE",
        "prompts/kestrel-skill-animation-retry.prompt.txt",
        ["docs/art-direction/option-c/phase4-pilot/animations/skill/raw-generated.png", "docs/art-direction/option-c/phase4-pilot/characters/kestrel-option-c-character-master-dev.png", CANONICAL_KESTREL, "docs/art-direction/option-c/phase4-pilot/characters/poses/skill/kestrel-skill-1.png", "docs/art-direction/option-c/phase4-pilot/references/2x4-animation-layout-guide.png"],
        [MOTION_KESTREL],
        "exec-69a788a8-f599-4e08-9f41-6503dbdd7e5e.png",
    ),
]

deterministic_renders = []
for width, height in ((1920, 1080), (1366, 768)):
    for surface in ("travel", "tableau", "strategic", "stage"):
        filename = f"composites/{width}x{height}-{surface}.png"
        path = ROOT / filename
        deterministic_renders.append(
            {
                "assetId": f"DEV_COMPOSITE_{surface.upper()}_{width}X{height}",
                "filename": path.relative_to(REPO).as_posix(),
                "category": "cross_surface_composite",
                "purpose": f"Deterministic {surface} layout/crop/UI-safe-zone evidence at {width}x{height}.",
                "status": "DEV_CANDIDATE",
                "canonicalReferenceSource": reference(CANONICAL_KESTREL),
                "visualReferenceInputs": [reference(f"docs/art-direction/option-c/phase4-pilot/environment/forest-road-{'combat-stage' if surface == 'stage' else surface}-dev.png")],
                "optionCPreviewReferencesUsed": [],
                "promptFile": None,
                "promptApplicability": "NOT_APPLICABLE_DETERMINISTIC_BROWSER_RENDER",
                "renderSource": "docs/art-direction/option-c/phase4-pilot/qa/surface-preview.html",
                "generator": "Playwright Chromium screenshot",
                "modelProvenance": "NOT_APPLICABLE",
                "generationTimestamp": datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat(),
                "generationTimestampSource": "filesystem mtime",
                "dimensions": image_dimensions(path),
                "sha256": sha256(path),
            }
        )

lineage = {
    "schemaVersion": 1,
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "baseline": "8265b071ea28569562017d621fbe1f124e0d0995",
    "pilotStatus": "APPROVED_DEV_PILOT",
    "operatorDecision": "APPROVED_DEV_PILOT",
    "operatorDecisionDate": "2026-09-13",
    "generatorModelPolicy": {"generator": GENERATOR, "exactModelProvenance": MODEL, "note": PROVENANCE_NOTE},
    "imageGeneration": entries,
    "deterministicRenders": deterministic_renders,
}
(MANIFEST_DIR / "generation-lineage.json").write_text(json.dumps(lineage, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def classify(relative: str) -> tuple[str, str | None]:
    lower = relative.lower()
    if any(token in lower for token in ("rejected-", "rejected_", "rejected/")):
        return "REJECTED", "Retained rejection evidence."
    if lower.endswith("characters/kestrel-four-pose-reference-raw.png"):
        return "REJECTED", "Initial pose board has inter-cell overlap and an airborne dash read."
    if lower.endswith("animations/dash/raw-generated.png") or lower.endswith("animations/attack/raw-generated.png") or lower.endswith("animations/skill/raw-generated.png"):
        return "REJECTED", "First animation source failed edge-touch rejection."
    if lower.endswith(("animation.gif", "raw-sheet.png", "raw-sheet-clean.png", "pipeline-meta.json", "prompt-used.txt")):
        return "SUPPORT_FILE", "Processing preview or pipeline evidence; transparent frames and sheet are the accepted animation assets."
    if lower.startswith(("masters/", "environment/", "characters/poses/")):
        return "ACCEPTED_DEV_CANDIDATE", None
    if lower == "characters/kestrel-option-c-character-master-dev.png":
        return "ACCEPTED_DEV_CANDIDATE", None
    if lower.endswith("characters/kestrel-idle-reference-raw.png") or lower.endswith("characters/kestrel-dash-reference-raw.png") or lower.endswith("characters/kestrel-attack-reference-raw.png") or lower.endswith("characters/kestrel-skill-reference-raw.png"):
        return "ACCEPTED_DEV_CANDIDATE", None
    if lower.startswith(("animations/idle/processed/", "animations/dash/processed-retry/", "animations/attack/processed-retry/", "animations/skill/processed-retry/")):
        return "ACCEPTED_DEV_CANDIDATE", None
    if lower.endswith("animations/idle/raw-generated.png") or lower.endswith("raw-generated-retry.png"):
        return "ACCEPTED_DEV_CANDIDATE", None
    if lower.startswith("composites/") and not lower.endswith("operator-review-board.png"):
        return "ACCEPTED_DEV_CANDIDATE", None
    return "SUPPORT_FILE", None


excluded_from_inventory = {
    "manifests/pilot-manifest.json",
    "manifests/pilot-manifest.sha256",
}
inventory = []
for path in sorted(item for item in ROOT.rglob("*") if item.is_file()):
    relative = path.relative_to(ROOT).as_posix()
    if relative in excluded_from_inventory:
        continue
    classification, reason = classify(relative)
    digest, hash_mode = portable_sha256(path)
    record = {
        "path": path.relative_to(REPO).as_posix(),
        "classification": classification,
        "bytes": path.stat().st_size,
        "sha256": digest,
        "hashMode": hash_mode,
    }
    dimensions = image_dimensions(path)
    if dimensions:
        record["dimensions"] = dimensions
    if reason:
        record["classificationReason"] = reason
    inventory.append(record)

pilot_manifest = {
    "schemaVersion": 1,
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "baseline": "8265b071ea28569562017d621fbe1f124e0d0995",
    "scope": ROOT.relative_to(REPO).as_posix(),
    "pilotStatus": "APPROVED_DEV_PILOT",
    "operatorDecision": "APPROVED_DEV_PILOT",
    "operatorDecisionDate": "2026-09-13",
    "devPilotApproved": True,
    "productionApproved": False,
    "productionPromotions": 0,
    "hashPolicy": {
        "binary": "SHA256_RAW_BYTES",
        "text": "SHA256 after CRLF and CR normalization to LF",
    },
    "inventoryExclusions": sorted(excluded_from_inventory),
    "classificationCounts": {
        key: sum(1 for item in inventory if item["classification"] == key)
        for key in ("ACCEPTED_DEV_CANDIDATE", "REVISE", "REJECTED", "SUPPORT_FILE")
    },
    "files": inventory,
}
pilot_manifest_path = MANIFEST_DIR / "pilot-manifest.json"
pilot_manifest_path.write_text(json.dumps(pilot_manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

sha_paths = sorted(path for path in ROOT.rglob("*") if path.is_file() and path.name != "pilot-manifest.sha256")
sha_lines = [f"{portable_sha256(path)[0]}  {path.relative_to(ROOT).as_posix()}" for path in sha_paths]
(MANIFEST_DIR / "pilot-manifest.sha256").write_text("\n".join(sha_lines) + "\n", encoding="utf-8")

print(json.dumps({"lineageEntries": len(entries), "deterministicRenders": len(deterministic_renders), "inventoryFiles": len(inventory), "classificationCounts": pilot_manifest["classificationCounts"], "sha256Entries": len(sha_lines)}, indent=2))

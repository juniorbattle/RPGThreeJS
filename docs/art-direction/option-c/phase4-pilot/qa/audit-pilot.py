from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[3]
CANONICAL = REPO / "public/assets/characters/pixel/full/kestrel.png"
CANONICAL_SHA256 = "e948beb899eef71940aec200c3747e098a2c2f980ba16ec5e6e15b2ae5a700ec"

POSES = {
    "idle": ROOT / "characters/poses/idle/kestrel-idle-1.png",
    "dash": ROOT / "characters/poses/dash/kestrel-dash-1.png",
    "attack": ROOT / "characters/poses/attack/kestrel-attack-1.png",
    "skill": ROOT / "characters/poses/skill/kestrel-skill-1.png",
}

ANIMATIONS = {
    "idle": ROOT / "animations/idle/processed",
    "dash": ROOT / "animations/dash/processed-retry",
    "attack": ROOT / "animations/attack/processed-retry",
    "skill": ROOT / "animations/skill/processed-retry",
}

ENVIRONMENTS = {
    "master": ROOT / "masters/forest-road-visual-master-dev.png",
    "travel": ROOT / "environment/forest-road-travel-dev.png",
    "tableau": ROOT / "environment/forest-road-tableau-dev.png",
    "strategic": ROOT / "environment/forest-road-strategic-dev.png",
    "combat_stage": ROOT / "environment/forest-road-combat-stage-dev.png",
}

COMPOSITES = {
    f"{width}x{height}-{surface}": ROOT / f"composites/{width}x{height}-{surface}.png"
    for width, height in ((1920, 1080), (1366, 768))
    for surface in ("travel", "tableau", "strategic", "stage")
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def image_record(path: Path) -> dict:
    with Image.open(path) as image:
        record = {
            "path": path.relative_to(REPO).as_posix(),
            "width": image.width,
            "height": image.height,
            "mode": image.mode,
            "sha256": sha256(path),
        }
        if image.format == "GIF":
            record["gifTransparencyIndex"] = image.info.get("transparency")
            record["gifFrameCount"] = getattr(image, "n_frames", 1)
        if "A" in image.getbands():
            alpha = image.getchannel("A")
            extrema = alpha.getextrema()
            bbox = alpha.getbbox()
            record["alphaExtrema"] = list(extrema)
            record["alphaBBox"] = list(bbox) if bbox else None
            if bbox:
                record["alphaMargins"] = {
                    "left": bbox[0],
                    "top": bbox[1],
                    "right": image.width - bbox[2],
                    "bottom": image.height - bbox[3],
                }
        return record


checks: list[dict] = []


def check(name: str, passed: bool, evidence) -> None:
    checks.append({"name": name, "pass": bool(passed), "evidence": evidence})


canonical_hash = sha256(CANONICAL)
check("canonical_kestrel_hash_unchanged", canonical_hash == CANONICAL_SHA256, canonical_hash)

master = image_record(ROOT / "characters/kestrel-option-c-character-master-dev.png")
check(
    "kestrel_master_real_transparency",
    bool(master.get("alphaExtrema")) and master["alphaExtrema"][0] == 0 and master["alphaExtrema"][1] > 0,
    master,
)

pose_records = {}
pose_bottoms = []
for action, path in POSES.items():
    record = image_record(path)
    pose_records[action] = record
    bbox = record.get("alphaBBox")
    margins = record.get("alphaMargins", {})
    pose_bottoms.append(bbox[3] if bbox else None)
    check(
        f"pose_{action}_canvas_alpha_and_edges",
        record["width"] == 768
        and record["height"] == 768
        and record.get("alphaExtrema") == [0, 255]
        and all(value > 0 for value in margins.values()),
        record,
    )
check("pose_feet_anchor_consistency", len(set(pose_bottoms)) == 1, pose_bottoms)

animation_records = {}
all_animation_bottoms = []
for action, directory in ANIMATIONS.items():
    metadata = json.loads((directory / "pipeline-meta.json").read_text(encoding="utf-8"))
    frames = [image_record(directory / f"kestrel-{action}-{index}.png") for index in range(1, 9)]
    bottoms = [frame["alphaBBox"][3] for frame in frames]
    all_animation_bottoms.extend(bottoms)
    unique_frames = len({frame["sha256"] for frame in frames})
    margins_clear = all(all(value > 0 for value in frame["alphaMargins"].values()) for frame in frames)
    canvas_ok = all(frame["width"] == 512 and frame["height"] == 512 and frame.get("alphaExtrema") == [0, 255] for frame in frames)
    metadata_ok = (
        metadata.get("rows") == 2
        and metadata.get("cols") == 4
        and metadata.get("shared_scale") is True
        and metadata.get("align") == "feet"
        and metadata.get("edge_touch_frames") == []
    )
    animation_records[action] = {
        "directory": directory.relative_to(REPO).as_posix(),
        "frameCount": len(frames),
        "canvas": [512, 512],
        "uniqueFrameHashes": unique_frames,
        "alphaBBoxBottoms": bottoms,
        "metadata": metadata,
        "frames": frames,
        "sheet": image_record(directory / "sheet-transparent.png"),
        "gif": image_record(directory / "animation.gif"),
    }
    gif_ok = animation_records[action]["gif"].get("gifTransparencyIndex") is not None and animation_records[action]["gif"].get("gifFrameCount") == 8
    check(f"animation_{action}_technical_contract", canvas_ok and margins_clear and metadata_ok and gif_ok, animation_records[action])
    check(f"animation_{action}_feet_anchor", len(set(bottoms)) == 1, bottoms)
    check(f"animation_{action}_has_8_distinct_frames", unique_frames == 8, unique_frames)
check("animation_cross_action_canvas", all(record["canvas"] == [512, 512] for record in animation_records.values()), {key: value["canvas"] for key, value in animation_records.items()})
check("animation_cross_action_feet_anchor", len(set(all_animation_bottoms)) == 1, all_animation_bottoms)

environment_records = {name: image_record(path) for name, path in ENVIRONMENTS.items()}
check("environment_family_present", len(environment_records) == 5 and all(record["width"] > 0 and record["height"] > 0 for record in environment_records.values()), environment_records)

composite_records = {name: image_record(path) for name, path in COMPOSITES.items()}
composite_dimensions_ok = all(
    [record["width"], record["height"]] == [int(name.split("x")[0]), int(name.split("x")[1].split("-")[0])]
    for name, record in composite_records.items()
)
check("composite_exact_dimensions", composite_dimensions_ok, composite_records)

browser_results = json.loads((ROOT / "qa/composite-results.json").read_text(encoding="utf-8"))
check(
    "composite_browser_geometry",
    len(browser_results.get("results", [])) == 8 and all(item.get("pass") for item in browser_results["results"]),
    browser_results,
)

rejected_evidence = {
    "checkerboard_master": (ROOT / "qa/rejected-kestrel-master-checkerboard.png").exists(),
    "four_pose_board": (ROOT / "characters/kestrel-four-pose-reference-raw.png").exists(),
    "first_dash_sheet": (ROOT / "animations/dash/raw-generated.png").exists(),
    "first_attack_sheet": (ROOT / "animations/attack/raw-generated.png").exists(),
    "first_skill_sheet": (ROOT / "animations/skill/raw-generated.png").exists(),
}
check("rejected_evidence_retained", all(rejected_evidence.values()), rejected_evidence)

report = {
    "schemaVersion": 1,
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "root": ROOT.relative_to(REPO).as_posix(),
    "canonicalKestrel": {"path": CANONICAL.relative_to(REPO).as_posix(), "sha256": canonical_hash},
    "environment": environment_records,
    "kestrelMaster": master,
    "poses": pose_records,
    "animations": animation_records,
    "composites": composite_records,
    "rejectedEvidence": rejected_evidence,
    "checks": checks,
    "summary": {
        "passed": sum(1 for item in checks if item["pass"]),
        "failed": sum(1 for item in checks if not item["pass"]),
        "overallPass": all(item["pass"] for item in checks),
    },
}

output = ROOT / "qa/pilot-machine-qa.json"
output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(json.dumps(report["summary"], indent=2))

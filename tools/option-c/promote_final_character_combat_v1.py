from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
PUBLIC_MANIFEST = ROOT / "public/assets/characters/pixel/character-system-v2-manifest.json"
RUNTIME_MANIFEST = ROOT / "src/render/generated/characterSystemV2Manifest.json"
MASTER_ROOT = ROOT / "public/assets/characters/pixel/masters"
COMBAT_ROOT = ROOT / "public/assets/characters/pixel/combat"
LANCER_ROOT = ROOT / "public/assets/dev/option-c/hero-scale-parity-v1/candidate"
MILITIA_ROOT = ROOT / "public/assets/dev/option-c/village-militia-poses-v1"
QA_ROOT = ROOT / "public/assets/dev/option-c/final-character-combat-promotion-v1/qa"
POSES = ("prepare", "dash", "attack", "cast")

EXPECTED = {
    "lancer/master": "4cb15e26e168985a56666becf3c4d14ef8c35a95f784940f17e5a894b21a278d",
    "lancer/prepare": "71a8d68f765367eefe2317e1fea6b0d82c1957968d5208a23b57bc28a6f3fcfa",
    "lancer/dash": "9d89be015f5292e3a04131da8791ebc7e3ddd6fbc56b461d417011acf277eb8f",
    "lancer/attack": "2c57235b843c667e7a4c993ae2da695d38c683dfbe25ea12fe848265c7be916d",
    "lancer/cast": "1c6f58d989f5300b8f1c6c5b0f823c4ad149627cec92ea37094ce3b71592d8ca",
    "village_militia_spearman/prepare": "11c0f6ec9872b21dd2d731205bd74601c41cecf94c6d1353bf195a63d21d71c8",
    "village_militia_spearman/dash": "71229a34a8a8ee7e59febb9d2d0beb960b84416e2246190e864d4d915e79dcd8",
    "village_militia_spearman/attack": "71fc6aa2822529e6b8d77e258ea238b7e3a3d3b5483b0c55b486705a1708e16b",
    "village_militia_spearman/cast": "24e2f9a166522c85378d5f02e7f68168c6bd4ab410e5eb59d2f239be0a128961",
    "village_militia_slinger/prepare": "83e28be13f380a00f78fb8f7aa163138a9b1e7ad825deb072a0b06184ea10fb4",
    "village_militia_slinger/dash": "27f1d5a296de9ce42b2d5725e46d9fafd6477a3a06fbc7163d0c2515e94634f8",
    "village_militia_slinger/attack": "444f612f3ead4fb60242458d4884d1dcd0de3fef4dc9d791bbe69ea463526b14",
    "village_militia_slinger/cast": "9066d47ced7bf92cdb7ef6b0a8f2f7fa5de43febd43d373211069360a3d3c9b0",
}
MASTER_HASHES = {
    "village_militia_spearman": "b35b7f7ca5f7323c2f1e123b8047bd22735e756b11be08e5550d344eda476a5d",
    "village_militia_slinger": "2a0c3d4743261cb445e6f999ab39c7c52083fd94c4c48d116a44836ca657c478",
    "village_militia_brute": "8132e4162e4a3f57dfe6e2d206fc4d1b46c5debfba4352f0dafe3c3c9f2bf150",
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inventory(root: Path) -> dict[str, str]:
    return {str(p.relative_to(ROOT)).replace("\\", "/"): digest(p) for p in sorted(root.rglob("*.png"))}


def atomic_copy(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    temp = target.with_suffix(target.suffix + ".promotion-tmp")
    temp.write_bytes(source.read_bytes())
    os.replace(temp, target)


def bounds(path: Path) -> dict[str, int]:
    box = Image.open(path).convert("RGBA").getchannel("A").getbbox()
    if box is None:
        raise RuntimeError(f"No visible pixels: {path}")
    return {"left": box[0], "top": box[1], "right": box[2], "bottom": box[3]}


def pose_record(unit_id: str, pose: str, path: Path) -> dict:
    with Image.open(path) as image:
        size = {"width": image.width, "height": image.height}
    return {
        "src": f"/assets/characters/pixel/combat/{unit_id}/{pose}.png",
        "sha256": digest(path),
        "sourceSizePx": size,
        "alphaBoundsPx": bounds(path),
        "anchor": {"x": 256, "y": 456},
        "scaleCorrection": 1.0,
        "characterBoundFx": unit_id == "lancer" and pose == "cast",
    }


def board(title: str, rows: list[tuple[str, Path, Path]], output: Path) -> None:
    cell = 320
    canvas = Image.new("RGB", (cell * 2, 48 + cell * len(rows)), "#101722")
    draw = ImageDraw.Draw(canvas)
    draw.text((12, 14), title, fill="#ffffff")
    for index, (label, approved, production) in enumerate(rows):
        y = 48 + index * cell
        for col, (kind, source) in enumerate((("APPROVED", approved), ("PRODUCTION", production))):
            image = Image.open(source).convert("RGBA")
            image.thumbnail((cell - 16, cell - 36), Image.Resampling.NEAREST)
            x = col * cell + (cell - image.width) // 2
            canvas.paste(image, (x, y + 24 + (cell - 36 - image.height) // 2), image)
            draw.text((col * cell + 8, y + 6), f"{label} | {kind}", fill="#65e6ff")
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output)


def main() -> None:
    public = json.loads(PUBLIC_MANIFEST.read_text(encoding="utf-8"))
    runtime = json.loads(RUNTIME_MANIFEST.read_text(encoding="utf-8"))
    if public != runtime or public["counts"] != {"masters": 37, "combatPoses": 100}:
        raise RuntimeError("Production manifests are not the expected equivalent 37/100 baseline.")
    before_masters = inventory(MASTER_ROOT)
    before_combat = inventory(COMBAT_ROOT)
    if len(before_masters) != 37 or len(before_combat) != 100:
        raise RuntimeError("Disk inventory is not the expected 37/100 baseline.")
    for unit_id, expected in MASTER_HASHES.items():
        if digest(MASTER_ROOT / f"{unit_id}.png") != expected:
            raise RuntimeError(f"Protected militia Master drift: {unit_id}")
    if (COMBAT_ROOT / "village_militia_brute").exists():
        raise RuntimeError("Protected brute combat folder unexpectedly exists.")

    sources: dict[str, Path] = {"lancer/master": LANCER_ROOT / "masters/lancer.png"}
    sources.update({f"lancer/{pose}": LANCER_ROOT / f"combat/lancer/{pose}.png" for pose in POSES})
    for unit_id in ("village_militia_spearman", "village_militia_slinger"):
        sources.update({f"{unit_id}/{pose}": MILITIA_ROOT / f"poses/{unit_id}/{pose}.png" for pose in POSES})
    for key, source in sources.items():
        if digest(source) != EXPECTED[key]:
            raise RuntimeError(f"Approved candidate hash mismatch: {key}")

    atomic_copy(sources["lancer/master"], MASTER_ROOT / "lancer.png")
    for key, source in sources.items():
        if key == "lancer/master":
            continue
        unit_id, pose = key.split("/")
        atomic_copy(source, COMBAT_ROOT / unit_id / f"{pose}.png")

    units = {unit["unitId"]: unit for unit in public["units"]}
    lancer = units["lancer"]
    lancer["master"]["sha256"] = digest(MASTER_ROOT / "lancer.png")
    lancer["master"]["sourceSizePx"] = {"width": 512, "height": 512}
    for unit_id in ("lancer", "village_militia_spearman", "village_militia_slinger"):
        unit = units[unit_id]
        unit["poses"] = {pose: pose_record(unit_id, pose, COMBAT_ROOT / unit_id / f"{pose}.png") for pose in POSES}
        unit["combatPoseStatus"] = "PROMOTED_4_POSES"
    public["counts"] = {"masters": 37, "combatPoses": 108}
    encoded = json.dumps(public, indent=2, ensure_ascii=False) + "\n"
    PUBLIC_MANIFEST.write_text(encoded, encoding="utf-8")
    RUNTIME_MANIFEST.write_text(encoded, encoding="utf-8")

    after_masters = inventory(MASTER_ROOT)
    after_combat = inventory(COMBAT_ROOT)
    changed_masters = sorted(key for key in after_masters if before_masters.get(key) != after_masters[key])
    changed_existing = sorted(key for key in before_combat if before_combat[key] != after_combat.get(key))
    added_combat = sorted(key for key in after_combat if key not in before_combat)
    expected_added = sorted(
        f"public/assets/characters/pixel/combat/{unit_id}/{pose}.png"
        for unit_id in ("village_militia_spearman", "village_militia_slinger") for pose in POSES
    )
    if changed_masters != ["public/assets/characters/pixel/masters/lancer.png"]:
        raise RuntimeError(f"Unexpected Master changes: {changed_masters}")
    if changed_existing != sorted(f"public/assets/characters/pixel/combat/lancer/{pose}.png" for pose in POSES):
        raise RuntimeError(f"Unexpected existing combat changes: {changed_existing}")
    if added_combat != expected_added or len(after_combat) != 108:
        raise RuntimeError(f"Unexpected combat additions: {added_combat}")
    for unit_id, expected in MASTER_HASHES.items():
        if digest(MASTER_ROOT / f"{unit_id}.png") != expected:
            raise RuntimeError(f"Militia Master changed: {unit_id}")
    if (COMBAT_ROOT / "village_militia_brute").exists():
        raise RuntimeError("Brute combat folder was created.")

    QA_ROOT.mkdir(parents=True, exist_ok=True)
    board("Lancer approved candidate vs production (byte-identical)", [
        ("MASTER", sources["lancer/master"], MASTER_ROOT / "lancer.png"),
        *[(pose.upper(), sources[f"lancer/{pose}"], COMBAT_ROOT / "lancer" / f"{pose}.png") for pose in POSES],
    ], QA_ROOT / "lancer-production-parity.png")
    board("Village militia approved candidates vs production (byte-identical)", [
        (f"{unit_id} {pose}", sources[f"{unit_id}/{pose}"], COMBAT_ROOT / unit_id / f"{pose}.png")
        for unit_id in ("village_militia_spearman", "village_militia_slinger") for pose in POSES
    ], QA_ROOT / "militia-production-parity.png")
    report = {
        "schemaVersion": 1,
        "mission": "Final Character Combat Promotion V1",
        "status": "PASS",
        "counts": {"masters": len(after_masters), "combatPoses": len(after_combat), "combatPoseIdentities": 27},
        "manifestParity": json.loads(PUBLIC_MANIFEST.read_text(encoding="utf-8")) == json.loads(RUNTIME_MANIFEST.read_text(encoding="utf-8")),
        "changedMasters": changed_masters,
        "changedExistingCombatPoses": changed_existing,
        "addedCombatPoses": added_combat,
        "candidateParity": {key: digest(source) == EXPECTED[key] for key, source in sources.items()},
        "productionParity": {
            key: digest(MASTER_ROOT / "lancer.png") == expected if key == "lancer/master" else digest(COMBAT_ROOT / key.split("/")[0] / f"{key.split('/')[1]}.png") == expected
            for key, expected in EXPECTED.items()
        },
        "protectedMilitiaMasters": {unit_id: digest(MASTER_ROOT / f"{unit_id}.png") == expected for unit_id, expected in MASTER_HASHES.items()},
        "bruteCombatFolderAbsent": not (COMBAT_ROOT / "village_militia_brute").exists(),
        "nonTargetMastersUnchanged": sum(before_masters[key] == after_masters[key] for key in before_masters if not key.endswith("/lancer.png")),
        "nonTargetExistingCombatUnchanged": sum(before_combat[key] == after_combat[key] for key in before_combat if "/lancer/" not in key),
    }
    (QA_ROOT / "promotion-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()

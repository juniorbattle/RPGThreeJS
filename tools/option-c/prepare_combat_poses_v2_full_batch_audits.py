from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
POSE_ROOT = ROOT / "public/assets/combat-stage/poses"
OUT_ROOT = ROOT / "public/assets/dev/option-c/combat-poses-v2"
AUDIT_ROOT = OUT_ROOT / "audits"

ROSTER = [
    ("white_mage", "heroes/white_mage_sheet_4x1", "hero"),
    ("dark_mage", "heroes/dark_mage_sheet_4x1", "hero"),
    ("archer", "heroes/archer_sheet_4x1", "hero"),
    ("rogue", "heroes/rogue_sheet_4x1", "hero"),
    ("lancer", "heroes/lancer_sheet_4x1", "hero"),
    ("forest_badger", "enemies/enemy_badger_4x1_2560x768", "enemy"),
    ("cave_bat", "enemies/enemy_bat_4x1_2560x768", "enemy"),
    ("wild_boar", "enemies/enemy_boar_4x1_2560x768", "enemy"),
    ("cave_rat", "enemies/enemy_cave_rat_4x1_2560x768", "enemy"),
    ("forest_spider", "enemies/enemy_forest_spider_4x1_2560x768", "enemy"),
    ("marsh_toad", "enemies/enemy_marsh_toad_4x1_2560x768", "enemy"),
    ("serpent_raider", "enemies/enemy_masked_assassin_4x1_2560x768", "enemy"),
    ("serpent_brute", "enemies/enemy_serpent_mace_knight_4x1_2560x768", "enemy"),
    ("serpent_oracle", "enemies/enemy_serpent_mage_4x1_2560x768", "enemy"),
    ("skeleton", "enemies/enemy_skeleton_4x1_2560x768", "enemy"),
    ("venom_serpent", "enemies/enemy_venom_serpent_4x1_2560x768", "enemy"),
    ("wolf", "enemies/enemy_wolf_4x1_2560x768", "enemy"),
    ("young_dragon_elite", "bosses/enemy_dragon_elite_4x1_2560x768", "elite_boss"),
    ("forest_troll_elite", "bosses/enemy_ogre_elite_4x1_2560x768", "elite_boss"),
    ("serpent_general_boss", "bosses/enemy_serpent_champion_4x1_2560x768", "elite_boss"),
    ("serpent_duelist_elite", "bosses/enemy_serpent_duelist_elite_4x1_2560x768", "elite_boss"),
    ("serpent_elite_brute", "bosses/enemy_serpent_halberd_elite_4x1_2560x768", "elite_boss"),
]

PILOTS = ["alistair", "goblin", "lion-champion"]
PILOT_PATHS = [
    OUT_ROOT / "masters" / f"{unit}-master.png" for unit in PILOTS
] + [
    OUT_ROOT / "boards-2x2" / f"{unit}-board.png" for unit in PILOTS
] + [
    OUT_ROOT / "split-poses" / unit / f"{unit}-{pose}.png"
    for unit in PILOTS
    for pose in ("idle", "dash", "attack", "skill")
] + [
    OUT_ROOT / "manifests" / f"{unit}-manifest.json" for unit in PILOTS
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def contain(image: Image.Image, width: int, height: int) -> Image.Image:
    copy = image.convert("RGBA")
    copy.thumbnail((width, height), Image.Resampling.LANCZOS)
    return copy


def build_reference_board(unit_id: str, source_folder: str) -> dict:
    source_dir = POSE_ROOT / source_folder
    files = sorted(source_dir.glob("*.png"))
    if len(files) != 4:
        raise RuntimeError(f"{unit_id}: expected 4 canonical poses in {source_dir}, found {len(files)}")

    board = Image.new("RGBA", (1024, 1120), (15, 18, 24, 255))
    draw = ImageDraw.Draw(board)
    font = ImageFont.load_default()
    draw.text((28, 22), f"{unit_id} | CANONICAL IDENTITY REFERENCE ONLY", fill=(238, 218, 162, 255), font=font)
    labels = ["POSE 1", "POSE 2", "POSE 3", "POSE 4"]
    cells = [(0, 64), (512, 64), (0, 576), (512, 576)]
    source_records = []
    for label, file_path, (x, y) in zip(labels, files, cells, strict=True):
        cell = Image.new("RGBA", (512, 512), (27, 31, 40, 255))
        image = contain(Image.open(file_path), 466, 454)
        px = (512 - image.width) // 2
        py = 34 + (454 - image.height)
        cell.alpha_composite(image, (px, py))
        cell_draw = ImageDraw.Draw(cell)
        cell_draw.text((14, 12), label, fill=(194, 204, 216, 255), font=font)
        board.alpha_composite(cell, (x, y))
        source_records.append({
            "path": file_path.relative_to(ROOT).as_posix(),
            "sha256": sha256(file_path),
            "dimensionsPx": list(Image.open(file_path).size),
        })

    output = AUDIT_ROOT / f"{unit_id}-canonical-reference.png"
    output.parent.mkdir(parents=True, exist_ok=True)
    board.save(output)
    return {
        "unitId": unit_id,
        "canonicalReferenceFolder": (POSE_ROOT / source_folder).relative_to(ROOT).as_posix(),
        "referenceBoard": output.relative_to(ROOT).as_posix(),
        "sourceFiles": source_records,
    }


def main() -> None:
    AUDIT_ROOT.mkdir(parents=True, exist_ok=True)
    audits = [build_reference_board(unit_id, folder) for unit_id, folder, _ in ROSTER]
    pilot_hashes = {
        path.relative_to(OUT_ROOT).as_posix(): sha256(path)
        for path in PILOT_PATHS
        if path.exists()
    }
    payload = {
        "schemaVersion": 1,
        "mission": "Option C Combat Poses V2 remaining 22 units",
        "canonicalReferenceAuditCount": len(audits),
        "canonicalReferencePolicy": "READ_ONLY_IDENTITY_AUTHORITY_NOT_STYLE_AUTHORITY",
        "audits": audits,
        "pilotProtectionSnapshot": {
            "expectedFiles": len(PILOT_PATHS),
            "capturedFiles": len(pilot_hashes),
            "sha256": pilot_hashes,
        },
    }
    with (AUDIT_ROOT / "canonical-reference-inventory.json").open("w", encoding="utf-8", newline="\n") as stream:
        json.dump(payload, stream, indent=2, ensure_ascii=False)
        stream.write("\n")
    print(json.dumps({
        "canonicalReferenceAudits": len(audits),
        "pilotFilesSnapshotted": len(pilot_hashes),
        "auditRoot": AUDIT_ROOT.relative_to(ROOT).as_posix(),
    }, indent=2))


if __name__ == "__main__":
    main()

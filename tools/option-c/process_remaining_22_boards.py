from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/assets/dev/option-c/combat-poses-v2"
GENERATED = Path(
    r"C:/Users/miche/.codex/generated_images/01a0ab7a-f41d-72b1-b622-3dd0c827024a"
)
PYTHON = Path(
    r"C:/Users/miche/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe"
)
PROCESSOR = Path(
    r"C:/Users/miche/.codex/skills/generate2dsprite/scripts/generate2dsprite.py"
)

BOARD_SOURCES = {
    "white_mage": "exec-e4360494-7238-40ca-b2ba-065721040227.png",
    "dark_mage": "exec-bea26df7-36b1-499a-8b31-e167f13d2fec.png",
    "archer": "exec-a765a1ef-0c09-4fc3-b438-b9b9b95fe8df.png",
    "rogue": "exec-d607a17c-bed0-4568-997d-eceb8a0727fb.png",
    "lancer": "exec-590f6f58-fc20-4513-8921-f0bc96765d24.png",
    "forest_badger": "exec-402d0a7a-0db4-4d76-a1c5-55ae3fff86a2.png",
    "cave_bat": "exec-341a7381-6e67-49d4-9072-1c54d3ede02a.png",
    "wild_boar": "exec-27fb3891-02fa-45e2-ad14-da0476394988.png",
    "cave_rat": "exec-5bf66ad6-cee9-4efd-8994-c415b9e4c592.png",
    "forest_spider": "exec-a1b6945a-39fa-4905-9eb1-19f4c08168b2.png",
    "marsh_toad": "exec-e6e5e6a0-c11b-4aad-b8de-0fea4b8f5859.png",
    "serpent_raider": "exec-684f9a09-b37f-4979-beff-230ba6aae5fe.png",
    "serpent_brute": "exec-a3129747-de1f-4a04-b34b-297b9b17543c.png",
    "serpent_oracle": "exec-40fdc048-3daf-4db4-859b-2636834cadf7.png",
    "skeleton": "exec-e5ad0631-15c9-4348-a166-102be5747107.png",
    "venom_serpent": "exec-38469d3e-3051-498a-9c15-1dbcc1e0f67f.png",
    "wolf": "exec-ded5eeda-d9d7-4cb2-94be-1818dace71fa.png",
    "young_dragon_elite": "exec-df8f3922-6635-4fb7-af72-77a413253df4.png",
    "forest_troll_elite": "exec-5a3d2d37-07e7-4140-81ff-1f574882110c.png",
    "serpent_general_boss": "exec-6e46f4d0-f7f1-45b3-b550-2ff9f44e0dc0.png",
    "serpent_duelist_elite": "exec-dfc1f983-f835-4481-8b5b-b74b7f202266.png",
    "serpent_elite_brute": "exec-5a412b41-d325-42ea-9cfa-d7360ee83eb4.png",
}

POSE_NAMES = ("idle", "dash", "attack", "skill")


def main() -> None:
    audits = json.loads(
        (OUT / "audits/canonical-reference-audits.json").read_text(encoding="utf-8")
    )
    audit_by_id = {record["unitId"]: record for record in audits["units"]}
    processor_root = OUT / ".processor"
    processor_root.mkdir(parents=True, exist_ok=True)
    records = []

    for unit_id, filename in BOARD_SOURCES.items():
        audit = audit_by_id[unit_id]
        factor = float(audit["targetDeliveryFactor"])
        source = GENERATED / filename
        if not source.is_file():
            raise FileNotFoundError(source)

        source_copy = OUT / "boards-2x2" / f"{unit_id}-board-source.png"
        board = OUT / "boards-2x2" / f"{unit_id}-board.png"
        split_dir = OUT / "split-poses" / unit_id
        proc_dir = processor_root / unit_id
        source_copy.parent.mkdir(parents=True, exist_ok=True)
        split_dir.mkdir(parents=True, exist_ok=True)
        proc_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, source_copy)

        prompt_text = (
            f"One coherent exact 2x2 board for {unit_id}. "
            "TOP LEFT IDLE, TOP RIGHT DASH, BOTTOM LEFT ATTACK, "
            "BOTTOM RIGHT SKILL/CAST. Same character, anatomy, equipment, "
            "weapon geometry, physical scale and pixel density in all cells. "
            f"Pose logic: {audit['poseLogic']}. Attack commits forward at contact; "
            "skill/cast is a broad concentration pose, distinct from idle and attack. "
            "No baked VFX. Flat #FF00FF background."
        )
        prompt_path = OUT / "manifests" / f"{unit_id}-board-prompt.txt"
        prompt_path.write_text(prompt_text + "\n", encoding="utf-8")

        command = [
            str(PYTHON),
            str(PROCESSOR),
            "process",
            "--input",
            str(source_copy),
            "--target",
            "player" if audit["category"] == "HERO" else "creature",
            "--mode",
            "combat-poses-v2",
            "--output-dir",
            str(proc_dir),
            "--prompt-file",
            str(prompt_path),
            "--threshold",
            "70",
            "--edge-threshold",
            "140",
            "--cell-size",
            "512",
            "--rows",
            "2",
            "--cols",
            "2",
            "--label-prefix",
            unit_id,
            "--fit-scale",
            str(factor),
            "--trim-border",
            "4",
            "--edge-clean-depth",
            "3",
            "--align",
            "feet",
            "--shared-scale",
            "--component-mode",
            "all",
            "--min-component-area",
            "1",
            "--edge-touch-margin",
            "0",
        ]
        subprocess.run(command, cwd=ROOT, check=True, capture_output=True, text=True)

        shutil.copy2(proc_dir / "sheet-transparent.png", board)
        pose_paths = {}
        for index, pose_name in enumerate(POSE_NAMES, start=1):
            destination = split_dir / f"{unit_id}-{pose_name}.png"
            shutil.copy2(proc_dir / f"{unit_id}-{index}.png", destination)
            pose_paths[pose_name] = destination.relative_to(ROOT).as_posix()
        meta_target = OUT / "manifests" / f"{unit_id}-processor-meta.json"
        shutil.copy2(proc_dir / "pipeline-meta.json", meta_target)
        records.append(
            {
                "unitId": unit_id,
                "source": source_copy.relative_to(ROOT).as_posix(),
                "board": board.relative_to(ROOT).as_posix(),
                "poses": pose_paths,
                "deliveryFactor": factor,
                "baseline": audit["baselinePx"],
                "pivot": audit["pivotPx"],
                "processorMeta": meta_target.relative_to(ROOT).as_posix(),
            }
        )
        print(f"processed {unit_id}", flush=True)

    (OUT / "manifests/remaining-22-board-processing.json").write_text(
        json.dumps({"schemaVersion": 1, "units": records}, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"boardsProcessed": len(records)}, indent=2))


if __name__ == "__main__":
    main()
